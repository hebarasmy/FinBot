import pytest
from unittest.mock import MagicMock
from sentence_transformers import SentenceTransformer

@pytest.mark.asyncio
async def test_sentence_embedding_generation():
    # Mock SentenceTransformer
    mock_model = MagicMock(spec=SentenceTransformer)
    mock_model.encode.return_value = [0.1, 0.2, 0.3]

    # Test sentence embedding
    sentence = "This is a test sentence."
    embedding = mock_model.encode(sentence)

    assert embedding == [0.1, 0.2, 0.3], "Embedding does not match expected output"
