# lib/utils.py

def clean_query(query):
    """Clean and format a user query"""
    # Remove extra whitespace
    cleaned = query.strip()
    # Convert to lowercase
    cleaned = cleaned.lower()
    # Remove special characters if needed
    # Add more cleaning logic as needed
    return cleaned

def extract_file_content(file_obj, file_type):
    """Extract content from a file"""
    if file_type == "txt":
        return file_obj.read().decode("utf-8")
    elif file_type == "pdf":
        # Implement PDF extraction logic
        return "PDF content"
    elif file_type == "docx":
        # Implement DOCX extraction logic
        return "DOCX content"
    else:
        raise ValueError(f"Unsupported file type: {file_type}")