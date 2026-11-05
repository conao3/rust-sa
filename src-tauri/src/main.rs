mod cli;

use std::path::Path;

#[cfg(feature = "desktop")]
use cli::DesktopCommand;
use cli::{
    Bytes, Cli, CliError, Command, DiffCommand, GetGraphqlSchemaOutput, GlobalArgs, OpenReviewArgs,
    OpenReviewOutput, SchemaCommand, ServerCommand, ServerEndpoints, StartServerArgs,
};
use conao3_sa::server::{build_schema, register_stdin_patch, spec_to_diff_args};

#[cfg(feature = "desktop")]
use std::sync::atomic::{AtomicU32, Ordering};

#[cfg(feature = "desktop")]
use std::path::PathBuf;

#[cfg(feature = "desktop")]
use tauri::{AppHandle, State, WebviewUrl, WebviewWindowBuilder, ipc::Channel};

#[cfg(feature = "desktop")]
use conao3_sa::server::{AppSchema, BackendError, blob_text, diff_text, watcher_for};

#[cfg(feature = "desktop")]
#[tauri::command]
async fn graphql(
    schema: State<'_, AppSchema>,
    query: String,
    variables: Option<serde_json::Value>,
    operation_name: Option<String>,
) -> Result<serde_json::Value, String> {
    let mut request = async_graphql::Request::new(query);
    if let Some(vars) = variables {
        request = request.variables(async_graphql::Variables::from_json(vars));
    }
    if let Some(name) = operation_name {
        request = request.operation_name(name);
    }
    let response = schema.execute(request).await;
    serde_json::to_value(response).map_err(|err| err.to_string())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn diff(
    rev: String,
    repo: String,
    path: Option<String>,
    w: Option<bool>,
) -> Result<String, String> {
    let bytes = diff_text(&rev, &repo, path.as_deref(), w.unwrap_or(false))
        .await
        .map_err(backend_error_to_string)?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn blob(rev: String, repo: String, path: String) -> Result<String, String> {
    let bytes = blob_text(&rev, &repo, &path)
        .await
        .map_err(backend_error_to_string)?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn subscribe_events(repo: String, channel: Channel<String>) -> Result<(), String> {
    let tx = watcher_for(PathBuf::from(&repo));
    let mut rx = tx.subscribe();
    tauri::async_runtime::spawn(async move {
        while let Ok(payload) = rx.recv().await {
            if channel.send(payload).is_err() {
                break;
            }
        }
    });
    Ok(())
}

#[cfg(feature = "desktop")]
#[tauri::command]
async fn open_new_window(app: AppHandle) -> Result<(), String> {
    static COUNTER: AtomicU32 = AtomicU32::new(0);
    let id = COUNTER.fetch_add(1, Ordering::Relaxed);
    let label = format!("window-{id}");
    WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("/".into()))
        .title("rust-sa")
        .inner_size(1200.0, 800.0)
        .resizable(true)
        .on_document_title_changed(|window, title| {
            let _ = window.set_title(&title);
        })
        .build()
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[cfg(feature = "desktop")]
fn backend_error_to_string(err: BackendError) -> String {
    match err {
        BackendError::Internal(msg) => msg,
        BackendError::BadRequest(msg) => msg,
        BackendError::NotFound(msg) => msg,
    }
}

fn percent_encode(input: &str) -> String {
    input
        .bytes()
        .flat_map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![b as char]
            }
            _ => format!("%{b:02X}").chars().collect(),
        })
        .collect()
}

fn repo_root(cwd: &Path) -> Result<String, String> {
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(cwd)
        .args(["rev-parse", "--show-toplevel"])
        .output()
        .map_err(|err| format!("git rev-parse failed: {err}"))?;
    if !output.status.success() {
        return Err(format!(
            "git rev-parse failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn open_browser(url: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let status = std::process::Command::new("open").arg(url).status();
    #[cfg(target_os = "linux")]
    let status = std::process::Command::new("xdg-open").arg(url).status();
    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("cmd")
        .args(["/C", "start", "", url])
        .status();
    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    let status: Result<std::process::ExitStatus, std::io::Error> = Err(std::io::Error::new(
        std::io::ErrorKind::Unsupported,
        "unsupported platform",
    ));

    let status = status.map_err(|err| format!("open browser failed: {err}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("open browser exited with {status}"))
    }
}

#[cfg(feature = "desktop")]
fn run_desktop() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(build_schema())
        .invoke_handler(tauri::generate_handler![
            graphql,
            diff,
            blob,
            subscribe_events,
            open_new_window
        ])
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/".into()))
                .title("rust-sa")
                .inner_size(1200.0, 800.0)
                .resizable(true)
                .on_document_title_changed(|window, title| {
                    let _ = window.set_title(&title);
                })
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn run_runtime<F>(f: F) -> Result<(), CliError>
where
    F: std::future::Future<Output = Result<(), Box<dyn std::error::Error>>>,
{
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .map_err(|err| CliError::Other(format!("failed to start tokio runtime: {err}")))?;
    runtime
        .block_on(f)
        .map_err(|err| CliError::Other(format!("backend exited: {err}")))
}

fn endpoints(port: u16) -> ServerEndpoints {
    let base_url = std::env::var("PORTLESS_URL")
        .map(|url| url.trim_end_matches('/').to_string())
        .unwrap_or_else(|_| format!("http://127.0.0.1:{port}"));
    ServerEndpoints {
        graphql_url: format!("{base_url}/api/graphql"),
        diff_url: format!("{base_url}/api/diff"),
        blob_url: format!("{base_url}/api/blob"),
        events_url: format!("{base_url}/api/events"),
        base_url,
    }
}

fn emit_output<T: serde::Serialize>(global: &GlobalArgs, output: &T) {
    let value = serde_json::to_value(output).expect("output serializes");
    cli::emit(global, &value);
}

fn open_review(global: &GlobalArgs, args: OpenReviewArgs) -> Result<(), CliError> {
    let open = !args.no_open;
    let path = match (args.spec, args.patch) {
        (Some(spec), None) => {
            let cwd = std::env::current_dir().map_err(|err| {
                CliError::Other(format!("failed to get current directory: {err}"))
            })?;
            let repo = repo_root(&cwd).map_err(CliError::Target)?;
            let _ = spec_to_diff_args(&spec);
            format!(
                "/compare/{}?repo={}",
                percent_encode(&spec),
                percent_encode(&repo)
            )
        }
        (None, Some(Bytes(patch))) => {
            let patch_id = register_stdin_patch(patch.to_vec());
            format!("/compare/stdin?patch={patch_id}")
        }
        _ => {
            return Err(CliError::Param(
                "one of --spec or --patch is required".into(),
            ));
        }
    };
    if global.debug {
        eprintln!("[debug] review path: {path}");
    }
    let global = global.clone();
    run_runtime(conao3_sa::server::run_on_port_with_callback(
        args.port,
        move |port| {
            let review_url = format!("http://127.0.0.1:{port}{path}");
            let browser_opened = open
                && match open_browser(&review_url) {
                    Ok(()) => true,
                    Err(err) => {
                        eprintln!("{err}");
                        false
                    }
                };
            emit_output(
                &global,
                &OpenReviewOutput {
                    review_url,
                    browser_opened,
                    endpoints: endpoints(port),
                },
            );
        },
    ))
}

fn start_server(global: &GlobalArgs, args: StartServerArgs) -> Result<(), CliError> {
    let global = global.clone();
    run_runtime(conao3_sa::server::run_on_port_with_callback(
        args.port,
        move |port| emit_output(&global, &endpoints(port)),
    ))
}

fn get_graphql_schema(global: &GlobalArgs) -> Result<(), CliError> {
    let output = GetGraphqlSchemaOutput {
        sdl: build_schema().sdl(),
    };
    let value = serde_json::to_value(output).map_err(|err| CliError::Other(err.to_string()))?;
    cli::emit(global, &value);
    Ok(())
}

fn execute(cli: Cli) -> Result<(), CliError> {
    match cli.command {
        Command::Diff(DiffCommand::OpenReview(args)) => open_review(&cli.global, args),
        Command::Server(ServerCommand::StartServer(args)) => start_server(&cli.global, args),
        Command::Schema(SchemaCommand::GetGraphqlSchema(_)) => get_graphql_schema(&cli.global),
        #[cfg(feature = "desktop")]
        Command::Desktop(DesktopCommand::StartApp(_)) => {
            run_desktop();
            Ok(())
        }
    }
}

fn main() {
    let args = std::env::args_os().collect::<Vec<_>>();
    #[cfg(feature = "desktop")]
    if args.len() == 1 {
        run_desktop();
        return;
    }
    let code = match cli::parse(args) {
        cli::Parsed::Exit(code) => code,
        cli::Parsed::Run(cli) => match execute(cli) {
            Ok(()) => 0,
            Err(err) => {
                eprintln!("{}", err.message());
                err.exit_code()
            }
        },
    };
    std::process::exit(code);
}
