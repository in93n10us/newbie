rust
//! Network communication module for SentinelAI
//! 
//! Handles all networking functionality including:
//! - gRPC client/server communication
//! - WebSocket connections for real-time data streaming
//! - HTTP API endpoints
//! - Connection management and retry logic

use std::error::Error;
use tokio::net::{TcpListener, TcpStream};
use tonic::{transport::Server, Request, Response, Status};
use serde::{Serialize, Deserialize};
use tracing::{info, error, warn};

/// Custom error type for network operations
#[derive(thiserror::Error, Debug)]
pub enum NetworkError {
    #[error("Connection failed: {0}")]
    ConnectionError(String),
    
    #[error("Protocol error: {0}")]
    ProtocolError(String),
    
    #[error("Transport error: {0}")]
    TransportError(#[from] tonic::transport::Error),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Configuration for network connections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    pub host: String,
    pub port: u16,
    pub max_connections: u32,
    pub timeout_ms: u64,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 50051,
            max_connections: 1000,
            timeout_ms: 30000,
        }
    }
}

/// Main network service handler
pub struct NetworkService {
    config: NetworkConfig,
    server: Option<Server>,
}

impl NetworkService {
    /// Create a new NetworkService instance
    pub fn new(config: NetworkConfig) -> Self {
        Self {
            config,
            server: None,
        }
    }

    /// Start the network service
    pub async fn start(&mut self) -> Result<(), NetworkError> {
        let addr = format!("{}:{}", self.config.host, self.config.port)
            .parse()
            .map_err(|e| NetworkError::ConnectionError(e.to_string()))?;

        info!("Starting network service on {}", addr);

        // Initialize TCP listener
        let listener = TcpListener::bind(&addr).await?;

        // Connection handling loop
        loop {
            match listener.accept().await {
                Ok((socket, peer_addr)) => {
                    info!("New connection from {}", peer_addr);
                    self.handle_connection(socket).await?;
                }
                Err(e) => {
                    error!("Failed to accept connection: {}", e);
                    continue;
                }
            }
        }
    }

    /// Handle individual TCP connections
    async fn handle_connection(&self, socket: TcpStream) -> Result<(), NetworkError> {
        // Connection handling logic here
        Ok(())
    }

    /// Stop the network service
    pub async fn stop(&mut self) -> Result<(), NetworkError> {
        info!("Stopping network service");
        // Cleanup logic here
        Ok(())
    }

    /// Send data to a remote endpoint
    pub async fn send_data<T: Serialize>(&self, data: T) -> Result<(), NetworkError> {
        // Data transmission logic here
        Ok(())
    }
}

/// Helper function to check if a port is available
pub async fn is_port_available(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).await.is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_network_config_default() {
        let config = NetworkConfig::default();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 50051);
    }

    #[tokio::test]
    async fn test_port_availability() {
        assert!(is_port_available(0).await); // System should assign an available port
    }
}