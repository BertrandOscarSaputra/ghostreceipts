use std::net::SocketAddr;
use axum::{routing::get, Json, Router};
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod errors;
mod handlers;
mod models;
mod repositories;
mod routes;
mod services;
mod state;

use config::AppConfig;
use state::AppState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = AppConfig::from_env();
    tracing::info!("Starting GhostReceipt backend on {}:{}", config.host, config.port);

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to PostgreSQL database");

    tracing::info!("Connected to PostgreSQL database");

    // Automatically apply migrations
    if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
        tracing::warn!("Migration notice: {:?}", e);
    } else {
        tracing::info!("Database migrations applied successfully");
    }

    let state = AppState { db: pool };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(|| async {
            Json(serde_json::json!({
                "status": "healthy",
                "service": "ghostreceipt-backend",
                "version": env!("CARGO_PKG_VERSION")
            }))
        }))
        .merge(routes::agreements::router())
        .merge(routes::users::router())
        .merge(routes::auth::router())
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("GhostReceipt backend listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
