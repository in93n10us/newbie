"""
Server component initialization for SentinelAI's real-time anti-cheat detection system.

This module initializes the server-side components, including API endpoints,
data processing pipelines, and ML model serving infrastructure.
"""

import logging
from pathlib import Path
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Server configuration
SERVER_VERSION = "1.0.0"
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000

class ServerConfig:
    """Server configuration management class."""
    
    def __init__(
        self,
        host: str = DEFAULT_HOST,
        port: int = DEFAULT_PORT,
        model_path: Optional[Path] = None,
        debug: bool = False
    ):
        """
        Initialize server configuration.

        Args:
            host: Server host address
            port: Server port number
            model_path: Path to ML model files
            debug: Enable debug mode
        """
        self.host = host
        self.port = port
        self.model_path = model_path or Path("models")
        self.debug = debug

        # Ensure model directory exists
        self.model_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initialized server configuration: host={host}, port={port}")

    def validate(self) -> bool:
        """
        Validate server configuration.

        Returns:
            bool: True if configuration is valid
        """
        try:
            assert isinstance(self.port, int) and 1 <= self.port <= 65535
            assert isinstance(self.host, str) and self.host
            assert self.model_path.exists()
            return True
        except AssertionError as e:
            logger.error(f"Invalid server configuration: {str(e)}")
            return False

def init_server(config: Optional[ServerConfig] = None) -> ServerConfig:
    """
    Initialize server with provided or default configuration.

    Args:
        config: Optional server configuration

    Returns:
        ServerConfig: Validated server configuration

    Raises:
        ValueError: If configuration validation fails
    """
    try:
        server_config = config or ServerConfig()
        if not server_config.validate():
            raise ValueError("Invalid server configuration")
        
        logger.info(f"Server initialized successfully (v{SERVER_VERSION})")
        return server_config
        
    except Exception as e:
        logger.error(f"Failed to initialize server: {str(e)}")
        raise

# Export version and configuration
__version__ = SERVER_VERSION
__all__ = ['ServerConfig', 'init_server', 'SERVER_VERSION']