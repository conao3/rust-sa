use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};

use tauri::{ipc::Channel, AppHandle, State, WebviewUrl, WebviewWindowBuilder};

use conao3_sa::server::{blob_text, build_schema, diff_text, watcher_for, AppSchema, BackendError};

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

#[tauri::command]
async fn blob(rev: String, repo: String, path: String) -> Result<String, String> {
    let bytes = blob_text(&rev, &repo, &path)
        .await
        .map_err(backend_error_to_string)?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

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

fn backend_error_to_string(err: BackendError) -> String {
    match err {
        BackendError::Internal(msg) => msg,
        BackendError::BadRequest(msg) => msg,
        BackendError::NotFound(msg) => msg,
    }
}

fn main() {
    if std::env::args().any(|a| a == "--schema") {
        print!("{}", build_schema().sdl());
        return;
    }

    if std::env::args().any(|a| a == "--serve") {
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("failed to start tokio runtime");
        if let Err(err) = runtime.block_on(conao3_sa::server::run()) {
            eprintln!("backend exited: {err}");
            std::process::exit(1);
        }
        return;
    }

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
