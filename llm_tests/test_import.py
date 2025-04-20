import os
import sys
import importlib.util

# Print current working directory and Python path
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Add the parent directory to the path
parent_dir = os.path.dirname(os.getcwd())
if parent_dir not in sys.path:
    sys.path.append(os.getcwd())
    print(f"Updated Python path: {sys.path}")

# Define a mock function to replace the actual API function
def mock_get_ai_response(prompt, model, region="Global"):
    """Mock function to simulate responses from different models"""
    print(f"Mock response for: {prompt[:30]}... using model: {model}")
    return f"This is a mock response about {prompt[:20]}... for the {region} region."

# Try to run the evaluation script with the mock function
try:
    # First try to import the evaluate_llms module
    spec = importlib.util.spec_from_file_location(
        "evaluate_llms", 
        os.path.join(os.getcwd(), "llm_tests", "evaluate_llms.py")
    )
    evaluate_llms = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(evaluate_llms)
    
    # Replace the get_ai_response function with our mock
    evaluate_llms.get_ai_response = mock_get_ai_response
    
    print("Successfully imported evaluate_llms.py and replaced get_ai_response with mock")
    
except Exception as e:
    print(f"Error importing evaluate_llms.py: {str(e)}")

# Try to import the upload module to see if that's the issue
try:
    from api.upload import handle_file_upload
    print("Successfully imported handle_file_upload from api.upload")
except ImportError as e:
    print(f"Import Error: {str(e)}")
    
    # Check if the file exists
    api_app_path = os.path.join(os.getcwd(), "api", "app.py")
    print(f"Checking if {api_app_path} exists: {os.path.exists(api_app_path)}")
    
    if os.path.exists(api_app_path):
        print("File exists, checking content...")
        with open(api_app_path, 'r') as f:
            content = f.read()
            if "handle_file_upload" in content:
                print("Function found in file, but import failed")
            else:
                print("Function not found in file")