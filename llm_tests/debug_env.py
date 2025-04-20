import os
import sys
from dotenv import load_dotenv, find_dotenv

print(f"Current working directory: {os.getcwd()}")
print(f"Python version: {sys.version}")
print(f"Looking for .env file...")

# Try to find the .env file
env_file = find_dotenv()
if env_file:
    print(f"Found .env file at: {env_file}")
    load_dotenv(env_file)
else:
    print("No .env file found!")
    
    # Try to look in parent directories
    parent_dir = os.path.dirname(os.getcwd())
    parent_env = os.path.join(parent_dir, '.env')
    if os.path.exists(parent_env):
        print(f"Found .env file in parent directory: {parent_env}")
        load_dotenv(parent_env)

# Check if environment variables are set
openai_api_key = os.getenv("OPENAI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

print("\nChecking environment variables:")
print(f"OPENAI_API_KEY: {'✓ Found' if openai_api_key else '❌ Not found'}")
print(f"GROQ_API_KEY: {'✓ Found' if groq_api_key else '❌ Not found'}")

# List all environment variables (be careful with sensitive information)
print("\nAll environment variables (first few characters only):")
for key, value in os.environ.items():
    if key in ["OPENAI_API_KEY", "GROQ_API_KEY"] and value:
        print(f"{key}: {value[:5]}...")
    elif "API" in key.upper() and "KEY" in key.upper() and value:
        print(f"{key}: {value[:5]}...")