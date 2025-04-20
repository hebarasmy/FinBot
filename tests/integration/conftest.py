import pytest
import os
import sys
import json
from unittest.mock import patch, MagicMock
from flask import Flask
import chromadb
import io
import numpy as np

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from api.app import app as flask_app

@pytest.fixture
def app():
    """Create a Flask test client for the application."""
    # Configure app for testing
    flask_app.config.update({
        "TESTING": True,
        "MONGODB_URI": "mongodb://testuser:testpassword@localhost:27017/test_finbot",
    })
    
    # Return the app for testing
    return flask_app

@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()

@pytest.fixture
def mock_chroma_client():
    """Create a mock ChromaDB client."""
    mock_client = MagicMock()
    mock_collection = MagicMock()
    
    # Configure the mock collection to return sample results
    mock_collection.query.return_value = {
        'ids': [['doc1', 'doc2', 'doc3']],
        'distances': [[0.1, 0.2, 0.3]],
        'metadatas': [[
            {
                'date': '2023-04-15',
                'source': 'Financial Times',
                'region': 'Global',
                'detailed_summary': 'Sample financial news about markets.'
            },
            {
                'date': '2023-04-14',
                'source': 'Wall Street Journal',
                'region': 'US',
                'detailed_summary': 'Economic outlook for the next quarter.'
            },
            {
                'date': '2023-04-13',
                'source': 'Bloomberg',
                'region': 'Asia',
                'detailed_summary': 'Asian markets performance analysis.'
            }
        ]],
        'documents': [['Sample document 1', 'Sample document 2', 'Sample document 3']]
    }
    
    mock_client.get_or_create_collection.return_value = mock_collection
    return mock_client

@pytest.fixture
def mock_openai():
    """Create a mock OpenAI client."""
    mock_client = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock(message=MagicMock(content="This is a mock AI response about finance."))]
    mock_client.chat.completions.create.return_value = mock_completion
    return mock_client

@pytest.fixture
def mock_mongodb():
    """Create a mock MongoDB client."""
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_collection = MagicMock()
    
    # Configure the mock collection for various operations
    mock_collection.insert_one.return_value = MagicMock(inserted_id="mock_id_12345")
    mock_collection.find_one.return_value = {
        "_id": "mock_id_12345",
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User",
        "isVerified": True
    }
    
    mock_db.collection.return_value = mock_collection
    mock_client.db.return_value = mock_db
    return mock_client

@pytest.fixture
def sample_pdf_file():
    """Create a sample PDF file for testing."""
    # This is just a mock binary content, not a real PDF
    content = b"%PDF-1.5\nSample PDF content for testing"
    return io.BytesIO(content)