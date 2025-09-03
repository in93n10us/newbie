import os
import pytest
import tempfile
import shutil
from pathlib import Path

@pytest.fixture(scope="session")
def temp_dir():
    """Create a temporary directory for test files."""
    tmp_dir = tempfile.mkdtemp()
    yield tmp_dir
    shutil.rmtree(tmp_dir)

@pytest.fixture(scope="session")
def project_root():
    """Return the project root directory."""
    return Path(__file__).parent.parent

@pytest.fixture(scope="session")
def test_data_dir(project_root):
    """Return the test data directory."""
    data_dir = project_root / "tests" / "data"
    data_dir.mkdir(exist_ok=True)
    return data_dir

@pytest.fixture(scope="function")
def temp_env_vars():
    """Temporarily set environment variables for testing."""
    original_env = dict(os.environ)
    
    # Set test environment variables
    os.environ["SENTINEL_ENV"] = "test"
    os.environ["SENTINEL_API_KEY"] = "test_key"
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture(scope="function")
def mock_config():
    """Return mock configuration for testing."""
    return {
        "api": {
            "host": "localhost",
            "port": 8000,
            "debug": True
        },
        "ml": {
            "model_path": "models/test",
            "batch_size": 16
        },
        "logging": {
            "level": "DEBUG",
            "file": "test.log"
        }
    }

@pytest.fixture(scope="function")
def clean_test_dir(temp_dir):
    """Create a clean test directory for each test."""
    test_dir = Path(temp_dir) / "test"
    test_dir.mkdir(exist_ok=True)
    yield test_dir
    if test_dir.exists():
        shutil.rmtree(test_dir)

@pytest.fixture(scope="session")
def sample_data():
    """Return sample test data."""
    return {
        "telemetry": {
            "player_id": "test123",
            "timestamp": 1234567890,
            "metrics": {
                "aim_accuracy": 0.95,
                "movement_speed": 500,
                "actions_per_minute": 300
            }
        }
    }

def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection based on markers."""
    if not config.getoption("--run-slow"):
        skip_slow = pytest.mark.skip(reason="need --run-slow option to run")
        for item in items:
            if "slow" in item.keywords:
                item.add_marker(skip_slow)

def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--run-slow", 
        action="store_true", 
        default=False, 
        help="run slow tests"
    )
    parser.addoption(
        "--integration",
        action="store_true",
        default=False,
        help="run integration tests"
    )