use axum::{routing::post, Router};
use std::net::SocketAddr;
use tokio::net::TcpListener;

async fn graphql_handler() -> &'static str {
    "{\"data\":{\"health\":\"ok\"}}"
}

fn build_graphql_router() -> Router {
    Router::new().route("/graphql", post(graphql_handler))
}

#[tokio::main]
async fn start_graphql_server() {
    let app = build_graphql_router();
    let addr: SocketAddr = "127.0.0.1:4000".parse().unwrap();
    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            tokio::spawn(start_graphql_server());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
