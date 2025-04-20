# tests/test_query_cleaning.py
import pytest
# Update the import to match your actual code structure
from api.app import clean_response  # Instead of from lib.utils import clean_query

def test_clean_response_removes_thinking_tags():
    """Test that clean_response removes thinking tags"""
    test_response = "Here's my <Thinking>internal thought process</Thinking> final answer."
    cleaned = clean_response(test_response)
    
    assert "<Thinking>" not in cleaned
    assert "internal thought process" not in cleaned
    assert "Here's my  final answer." == cleaned