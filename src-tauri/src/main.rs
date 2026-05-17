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

    std::thread::spawn(|| {
        let runtime = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .expect("failed to start backend tokio runtime");
        if let Err(err) = runtime.block_on(conao3_sa::server::run()) {
            eprintln!("backend exited: {err}");
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
