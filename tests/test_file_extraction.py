# tests/test_file_extraction.py
import pytest
import io
# Update the import to match your actual code structure
from api.upload import extract_text  # Instead of from lib.utils import extract_file_content

def test_extract_text_from_txt():
    """Test extracting text from a TXT file"""
    # Create a sample text content
    sample_txt_content = b"This is a sample text file.\nIt has multiple lines.\nEnd of file."
    
    # Create a file-like object with the sample content
    file_obj = io.BytesIO(sample_txt_content)
    
    # Call the extract_text function
    result = extract_text(file_obj, "txt")
    
    # Check the result
    assert result == "This is a sample text file.\nIt has multiple lines.\nEnd of file."