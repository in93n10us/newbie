rust
use jalen::{JalenError, ml, network, crypto, telemetry};
use std::path::Path;
use tokio;

// Helper functions for test setup/teardown
async fn setup() {
    // Initialize test environment
    std::env::set_var("RUST_LOG", "debug");
    tracing_subscriber::fmt::init();
}

async fn teardown() {
    // Cleanup test artifacts
}

#[tokio::test]
async fn test_ml_model_loading() {
    setup().await;

    let model_path = Path::new("tests/fixtures/test_model.onnx");
    let result = ml::load_model(&model_path).await;
    
    assert!(result.is_ok(), "Model loading should succeed");
    
    // Test invalid path
    let invalid_path = Path::new("nonexistent.onnx");
    let err_result = ml::load_model(&invalid_path).await;
    assert!(matches!(err_result, Err(ml::MLError::ModelLoadError(_))));

    teardown().await;
}

#[tokio::test]
async fn test_network_connectivity() {
    setup().await;

    let server = network::Server::new("127.0.0.1:50051").await;
    assert!(server.is_ok(), "Server creation should succeed");

    let client = network::Client::connect("http://127.0.0.1:50051").await;
    assert!(client.is_ok(), "Client connection should succeed");

    // Test invalid connection
    let bad_client = network::Client::connect("http://invalid:50051").await;
    assert!(matches!(bad_client, Err(_)));

    teardown().await;
}

#[tokio::test]
async fn test_crypto_operations() {
    setup().await;

    let test_data = b"test message";
    let key = crypto::generate_key();
    
    let encrypted = crypto::encrypt(&key, test_data).await;
    assert!(encrypted.is_ok(), "Encryption should succeed");

    if let Ok(enc_data) = encrypted {
        let decrypted = crypto::decrypt(&key, &enc_data).await;
        assert!(decrypted.is_ok(), "Decryption should succeed");
        assert_eq!(decrypted.unwrap(), test_data);
    }

    teardown().await;
}

#[tokio::test]
async fn test_telemetry_collection() {
    setup().await;

    let collector = telemetry::Collector::new();
    let metrics = collector.gather_metrics().await;
    
    assert!(metrics.is_ok(), "Metrics collection should succeed");
    
    if let Ok(m) = metrics {
        assert!(m.cpu_usage.is_some());
        assert!(m.memory_usage.is_some());
        assert!(m.network_stats.is_some());
    }

    teardown().await;
}

#[tokio::test]
async fn test_error_handling() {
    setup().await;

    // Test various error conditions
    let ml_err = ml::MLError::ModelLoadError("test error".into());
    let jalen_err: JalenError = ml_err.into();
    assert!(matches!(jalen_err, JalenError::MLError(_)));

    let crypto_err = crypto::CryptoError::EncryptionError("test error".into());
    let jalen_err: JalenError = crypto_err.into();
    assert!(matches!(jalen_err, JalenError::CryptoError(_)));

    teardown().await;
}

#[tokio::test]
async fn test_end_to_end() {
    setup().await;

    // Test complete workflow
    let collector = telemetry::Collector::new();
    let metrics = collector.gather_metrics().await.unwrap();

    let model = ml::load_model(Path::new("tests/fixtures/test_model.onnx")).await.unwrap();
    let prediction = model.predict(&metrics).await;
    
    assert!(prediction.is_ok());
    assert!(prediction.unwrap().confidence > 0.0);

    teardown().await;
}

#[tokio::test]
async fn test_concurrent_operations() {
    setup().await;

    let handles: Vec<_> = (0..10).map(|_| {
        tokio::spawn(async {
            let collector = telemetry::Collector::new();
            collector.gather_metrics().await
        })
    }).collect();

    for handle in handles {
        let result = handle.await.unwrap();
        assert!(result.is_ok());
    }

    teardown().await;
}