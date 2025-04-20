# tests/integration/test_debug.py

import pytest

def test_api_endpoints():
    """Print all API endpoints in the Flask app"""
    from api.app import app
    
    print("\nAPI endpoints:")
    for rule in app.url_map.iter_rules():
        if '/api/' in str(rule):
            print(f"{rule.endpoint}: {rule.rule} {rule.methods}")