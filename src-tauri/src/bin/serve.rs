#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    conao3_sa::server::run().await
}
