# tests/integration/test_upload_route.py

import pytest
import json
import io
from unittest.mock import patch, MagicMock


def test_upload_route_complete_flow(client, sample_pdf_file, mock_openai):
    """
    Test the complete flow of the /upload route:
    file → text → summarize → save
    """
    # Mock the extract_text function
    with patch('api.upload.extract_text', return_value="Sample extracted text from PDF"):
        # Mock the analyze_financial_content function
        with patch('api.upload.analyze_financial_content', return_value="Financial analysis of the document"):
            # Mock GridFS
            with patch('api.app.fs.put', return_value="mock_gridfs_id"):
                # Mock MongoDB document collection
                with patch('api.app.document_collection.insert_one') as mock_insert:
                    # Create a test file
                    test_file = (io.BytesIO(b"Test file content"), 'test_document.pdf')
                    
                    # Make the request to the /upload endpoint
                    response = client.post(
                        '/upload',
                        data={
                            'file': test_file,
                            'comment': 'Please analyze this financial report',
                            'user_id': 'test_user_123'
                        },
                        content_type='multipart/form-data'
                    )
                    
                    # Check the response
                    assert response.status_code == 200
                    data = json.loads(response.data)
                    assert 'analysis' in data
                    assert data['analysis'] == "Financial analysis of the document"
                    assert 'filename' in data
                    assert data['filename'] == 'test_document.pdf'
                    
                    # Verify the document was saved to MongoDB
                    assert mock_insert.called
                    
def test_upload_route_invalid_file_type(client):
    """Test uploading an invalid file type"""
    # Create a test file with invalid extension
    test_file = (io.BytesIO(b"Test file content"), 'test_document.xyz')
    
    # Make the request to the /upload endpoint
    response = client.post(
        '/upload',
        data={
            'file': test_file,
            'comment': 'Please analyze this document',
            'user_id': 'test_user_123'
        },
        content_type='multipart/form-data'
    )
    
    # Check the response
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Invalid file type' in data['error']

def test_upload_route_file_too_large(client):
    """Test uploading a file that exceeds the size limit"""
    # Create a mock file that reports a large size
    with patch('flask.Request.content_length', 11 * 1024 * 1024):  # 11MB (over 10MB limit)
        test_file = (io.BytesIO(b"Test file content"), 'test_document.pdf')
        
        # Make the request to the /upload endpoint
        response = client.post(
            '/upload',
            data={
                'file': test_file,
                'comment': 'Please analyze this document',
                'user_id': 'test_user_123'
            },
            content_type='multipart/form-data'
        )
        
        # Check the response
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'File is too large' in data['error']