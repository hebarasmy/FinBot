import pytest
import json
import numpy as np
from unittest.mock import patch, MagicMock

@pytest.mark.parametrize("region,model", [
    ("Global", "chatgpt"),
    ("US", "llama"),
    ("Asia", "deepseek")
])
def test_ask_route_complete_flow(client, mock_chroma_client, mock_openai, region, model):
    """
    Test the complete flow of the /ask route:
    query → embed → ChromaDB → LLM → clean output
    """
    # Mock the embedding model
    with patch('api.app.embed_model.encode', return_value=np.array([0.1, 0.2, 0.3])):
        # Mock ChromaDB client
        with patch('api.app.chroma_client', mock_chroma_client):
            # Mock OpenAI client
            with patch('api.app.openai_client', mock_openai):
                # Mock Groq API call
                with patch('api.app.requests.post') as mock_post:
                    mock_post.return_value.status_code = 200
                    mock_post.return_value.json.return_value = {
                        'choices': [{'message': {'content': 'This is a mock Groq API response about finance.'}}]
                    }
                    
                    # Make the request to the /ask endpoint
                    response = client.post('/ask', json={
                        'prompt': 'What is the current state of the stock market?',
                        'region': region,
                        'model': model,
                        'userId': 'test_user_123'
                    })
                    
                    # Check the response
                    assert response.status_code == 200
                    data = json.loads(response.data)
                    assert 'response' in data
                    assert 'chatId' in data
                    
                    # Verify the correct model was used
                    if model == 'chatgpt':
                        assert mock_openai.chat.completions.create.called
                    else:
                        assert mock_post.called
                    
                    # Verify the response contains meaningful content
                    assert data['response'] is not None
                    assert len(data['response']) > 0

def test_ask_route_error_handling(client, mock_chroma_client, mock_openai):
    """Test error handling in the /ask route when OpenAI API fails"""
    # Mock the embedding model
    with patch('api.app.embed_model.encode', return_value=np.array([0.1, 0.2, 0.3])):
        # Mock ChromaDB client
        with patch('api.app.chroma_client', mock_chroma_client):
            # Mock OpenAI client to raise an exception
            with patch('api.app.openai_client.chat.completions.create', side_effect=Exception("OpenAI API error")):
                # Make the request to the /ask endpoint
                response = client.post('/ask', json={
                    'prompt': 'What is the current state of the stock market?',
                    'region': 'Global',
                    'model': 'chatgpt',
                    'userId': 'test_user_123'
                })
                
                # Check the response
                assert response.status_code == 200
                data = json.loads(response.data)
                assert 'response' in data
                
                # Check that the response contains an error message
                assert "Error" in data['response'] or "error" in data['response']

def test_ask_route_with_empty_prompt(client, mock_chroma_client, mock_openai):
    """Test the /ask route with an empty prompt"""
    # Make the request to the /ask endpoint with an empty prompt
    response = client.post('/ask', json={
        'prompt': '',
        'region': 'Global',
        'model': 'chatgpt',
        'userId': 'test_user_123'
    })
    
    # Check the response
    assert response.status_code == 400  # Bad Request
    data = json.loads(response.data)
    assert 'error' in data
    assert 'prompt' in data['error'].lower()  # Error message should mention the prompt

def test_ask_route_with_invalid_model(client, mock_chroma_client, mock_openai):
    """Test the /ask route with an invalid model"""
    # Make the request to the /ask endpoint with an invalid model
    response = client.post('/ask', json={
        'prompt': 'What is the current state of the stock market?',
        'region': 'Global',
        'model': 'invalid_model',
        'userId': 'test_user_123'
    })
    
    # Check the response - either it should return an error or fall back to a default model
    assert response.status_code in [200, 400]
    data = json.loads(response.data)
    
    if response.status_code == 400:
        assert 'error' in data
        assert 'model' in data['error'].lower()  # Error message should mention the model
    else:
        assert 'response' in data
        assert data['response'] is not None

def test_ask_route_with_long_prompt(client, mock_chroma_client, mock_openai):
    """Test the /ask route with a very long prompt"""
    # Create a long prompt (5000 characters)
    long_prompt = "A" * 5000
    
    # Mock the embedding model
    with patch('api.app.embed_model.encode', return_value=np.array([0.1, 0.2, 0.3])):
        # Mock ChromaDB client
        with patch('api.app.chroma_client', mock_chroma_client):
            # Mock OpenAI client
            with patch('api.app.openai_client.chat.completions.create') as mock_create:
                mock_create.return_value.choices = [MagicMock(message=MagicMock(content="Response to long prompt"))]
                
                # Make the request to the /ask endpoint
                response = client.post('/ask', json={
                    'prompt': long_prompt,
                    'region': 'Global',
                    'model': 'chatgpt',
                    'userId': 'test_user_123'
                })
                
                # Check the response - it should either handle the long prompt or return an error
                assert response.status_code in [200, 400]
                
                if response.status_code == 200:
                    data = json.loads(response.data)
                    assert 'response' in data
                    assert data['response'] is not None
                else:
                    data = json.loads(response.data)
                    assert 'error' in data

def test_ask_route_non_financial_query(client, mock_chroma_client, mock_openai):
    """Test the /ask route with a non-financial query"""
    # Mock the embedding model
    with patch('api.app.embed_model.encode', return_value=np.array([0.1, 0.2, 0.3])):
        # Mock ChromaDB client
        with patch('api.app.chroma_client', mock_chroma_client):
            # Mock OpenAI client
            with patch('api.app.openai_client.chat.completions.create') as mock_create:
                mock_create.return_value.choices = [MagicMock(message=MagicMock(content="This query is not related to finance."))]
                
                # Make the request to the /ask endpoint with a non-financial query
                response = client.post('/ask', json={
                    'prompt': 'What is the capital of France?',
                    'region': 'Global',
                    'model': 'chatgpt',
                    'userId': 'test_user_123'
                })
                
                # Check the response - it should either detect non-financial queries or provide a generic response
                assert response.status_code == 200
                data = json.loads(response.data)
                assert 'response' in data
                
                # The response might indicate it's a non-financial query or provide a generic answer
                # This depends on how your application is designed to handle such queries
                assert data['response'] is not None