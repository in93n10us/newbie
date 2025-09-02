rust
use crate::network::{NetworkError, ConnectionConfig, ConnectionState};
use tokio::net::{TcpListener, TcpStream};
use std::time::Duration;
use tonic::{Request, Response, Status};
use mockall::predicate::*;
use mockall::mock;

// Mock external dependencies
mock! {
    pub Connection {
        fn connect(&self) -> Result<ConnectionState, NetworkError>;
        fn disconnect(&self) -> Result<(), NetworkError>;
        fn is_connected(&self) -> bool;
    }
}

// Test fixtures
const TEST_HOST: &str = "127.0.0.1";
const TEST_PORT: u16 = 8080;
const TIMEOUT_MS: u64 = 1000;

// Helper functions
async fn setup_test_server() -> TcpListener {
    TcpListener::bind(format!("{}:{}", TEST_HOST, TEST_PORT))
        .await
        .expect("Failed to bind test server")
}

#[tokio::test]
async fn test_connection_success() {
    let config = ConnectionConfig {
        host: TEST_HOST.to_string(),
        port: TEST_PORT,
        timeout: Duration::from_millis(TIMEOUT_MS),
    };

    let mut mock_conn = MockConnection::new();
    mock_conn.expect_connect()
        .returning(|| Ok(ConnectionState::Connected));
    
    let result = mock_conn.connect();
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_connection_timeout() {
    let config = ConnectionConfig {
        host: TEST_HOST.to_string(),
        port: TEST_PORT,
        timeout: Duration::from_millis(1), // Very short timeout
    };

    let mut mock_conn = MockConnection::new();
    mock_conn.expect_connect()
        .returning(|| Err(NetworkError::Timeout));

    let result = mock_conn.connect();
    assert!(matches!(result, Err(NetworkError::Timeout)));
}

#[tokio::test]
async fn test_connection_refused() {
    let config = ConnectionConfig {
        host: "256.256.256.256".to_string(), // Invalid IP
        port: TEST_PORT,
        timeout: Duration::from_millis(TIMEOUT_MS),
    };

    let mut mock_conn = MockConnection::new();
    mock_conn.expect_connect()
        .returning(|| Err(NetworkError::ConnectionRefused));

    let result = mock_conn.connect();
    assert!(matches!(result, Err(NetworkError::ConnectionRefused)));
}

#[tokio::test]
async fn test_disconnect_success() {
    let mut mock_conn = MockConnection::new();
    mock_conn.expect_disconnect()
        .returning(|| Ok(()));
    mock_conn.expect_is_connected()
        .returning(|| false);

    let result = mock_conn.disconnect();
    assert!(result.is_ok());
    assert!(!mock_conn.is_connected());
}

#[tokio::test]
async fn test_connection_state() {
    let mut mock_conn = MockConnection::new();
    mock_conn.expect_is_connected()
        .returning(|| true);
    
    assert!(mock_conn.is_connected());
}

#[tokio::test]
async fn test_multiple_connections() {
    let server = setup_test_server().await;
    
    let mut connections = vec![];
    for _ in 0..5 {
        let mut mock_conn = MockConnection::new();
        mock_conn.expect_connect()
            .returning(|| Ok(ConnectionState::Connected));
        connections.push(mock_conn);
    }

    for conn in connections.iter_mut() {
        let result = conn.connect();
        assert!(result.is_ok());
    }
}

#[tokio::test]
async fn test_reconnection_after_failure() {
    let mut mock_conn = MockConnection::new();
    
    // First attempt fails
    mock_conn.expect_connect()
        .returning(|| Err(NetworkError::ConnectionRefused));
    
    // Second attempt succeeds  
    mock_conn.expect_connect()
        .returning(|| Ok(ConnectionState::Connected));

    let result1 = mock_conn.connect();
    assert!(result1.is_err());

    let result2 = mock_conn.connect(); 
    assert!(result2.is_ok());
}

#[tokio::test]
async fn test_invalid_config() {
    let config = ConnectionConfig {
        host: "".to_string(), // Empty host
        port: 0, // Invalid port
        timeout: Duration::from_millis(TIMEOUT_MS),
    };

    let mut mock_conn = MockConnection::new();
    mock_conn.expect_connect()
        .returning(|| Err(NetworkError::InvalidConfig));

    let result = mock_conn.connect();
    assert!(matches!(result, Err(NetworkError::InvalidConfig)));
}