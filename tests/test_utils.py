# tests/test_utils.py
import pytest
import bcrypt
# Update the import to match your actual code structure
# If these functions are in app/actions/auth-actions.ts, you'll need to create Python equivalents
# For example:

def hashPassword(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verifyPassword(password, hashed):
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def test_password_hashing():
    """Test that password hashing works correctly"""
    password = "test_password"
    hashed = hashPassword(password)
    
    assert verifyPassword(password, hashed)
    assert not verifyPassword("wrong_password", hashed)