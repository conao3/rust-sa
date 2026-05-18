use std::sync::mpsc;

use tauri::{WebviewUrl, WebviewWindowBuilder};

fn main() {
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

    let (port_tx, port_rx) = mpsc::channel::<u16>();
    std::thread::spawn(move || {
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("failed to start backend tokio runtime");
        let send_port = move |port| {
            let _ = port_tx.send(port);
        };
        if let Err(err) = runtime.block_on(conao3_sa::server::run_with_port_callback(send_port)) {
            eprintln!("backend exited: {err}");
        }
    });

    let port = port_rx
        .recv()
        .expect("backend never reported its bound port");
    let api_origin = format!("http://127.0.0.1:{port}");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let script = format!(
                "globalThis.__SA_API_ORIGIN__ = {};",
                serde_json::to_string(&api_origin)?
            );
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("/".into()))
                .title("rust-sa")
                .inner_size(1200.0, 800.0)
                .resizable(true)
                .initialization_script(&script)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
