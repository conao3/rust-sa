use axum::{routing::post, Router, Extension};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use async_graphql::{EmptyMutation, EmptySubscription, Schema, Object};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};

struct Query;

#[Object]
impl Query {
    async fn health(&self) -> String {
        "ok".to_string()
    }
}

type AppSchema = Schema<Query, EmptyMutation, EmptySubscription>;

async fn graphql_handler(
    schema: Extension<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

fn build_graphql_router(schema: AppSchema) -> Router {
    Router::new()
        .route("/graphql", post(graphql_handler))
        .layer(Extension(schema))
}

#[tokio::main]
async fn start_graphql_server() {
    let schema = Schema::build(Query, EmptyMutation, EmptySubscription).finish();
    let app = build_graphql_router(schema);
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
