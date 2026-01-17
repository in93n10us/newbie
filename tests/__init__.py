"""
Unit tests for package initialization.
Tests the basic package structure and import functionality.
"""

import unittest
import sys
import importlib
import logging
from pathlib import Path

class TestPackageInit(unittest.TestCase):
    """Test cases for package initialization."""

    def setUp(self):
        """Set up test environment."""
        # Store original sys.path
        self.original_path = sys.path.copy()
        
        # Add project root to path
        project_root = Path(__file__).parent.parent
        sys.path.insert(0, str(project_root))

    def tearDown(self):
        """Clean up test environment."""
        # Restore original sys.path
        sys.path = self.original_path

    def test_package_import(self):
        """Test that the package can be imported."""
        try:
            import sentinelai
            self.assertTrue(True)
        except ImportError:
            self.fail("Failed to import sentinelai package")

    def test_subpackage_imports(self):
        """Test that all subpackages can be imported."""
        subpackages = ['client', 'server', 'ml']
        for subpackage in subpackages:
            try:
                importlib.import_module(f'sentinelai.{subpackage}')
                self.assertTrue(True)
            except ImportError as e:
                self.fail(f"Failed to import sentinelai.{subpackage}: {str(e)}")

    def test_logger_configuration(self):
        """Test that logging is properly configured."""
        import sentinelai
        logger = logging.getLogger('sentinelai')
        
        # Check logger level
        self.assertEqual(logger.level, logging.INFO)
        
        # Check handler exists
        self.assertTrue(len(logger.handlers) > 0)
        
        # Check formatter
        formatter = logger.handlers[0].formatter
        self.assertIsNotNone(formatter)
        expected_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        self.assertEqual(formatter._fmt, expected_format)

    def test_package_metadata(self):
        """Test package metadata attributes."""
        import sentinelai
        
        # Test required attributes exist
        self.assertTrue(hasattr(sentinelai, '__title__'))
        self.assertTrue(hasattr(sentinelai, '__version__'))
        self.assertTrue(hasattr(sentinelai, '__description__'))
        
        # Test attribute types
        self.assertIsInstance(sentinelai.__title__, str)
        self.assertIsInstance(sentinelai.__version__, str)
        self.assertIsInstance(sentinelai.__description__, str)

    def test_invalid_subpackage_import(self):
        """Test importing non-existent subpackage raises ImportError."""
        with self.assertRaises(ImportError):
            importlib.import_module('sentinelai.nonexistent')

    def test_package_reload(self):
        """Test package can be reloaded without errors."""
        import sentinelai
        try:
            importlib.reload(sentinelai)
            self.assertTrue(True)
        except Exception as e:
            self.fail(f"Failed to reload package: {str(e)}")

if __name__ == '__main__':
    unittest.main()