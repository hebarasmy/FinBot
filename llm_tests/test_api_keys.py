import os
import openai
import groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API keys
openai_api_key = os.getenv("OPENAI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

print("Testing API keys...")

# Test OpenAI API key
print("\nTesting OpenAI API key:")
if not openai_api_key:
    print("❌ OPENAI_API_KEY not found in environment variables")
else:
    print(f"✓ OPENAI_API_KEY found: {openai_api_key[:5]}...{openai_api_key[-4:]}")
    try:
        client = openai.OpenAI(api_key=openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, are you working?"}
            ],
            max_tokens=10
        )
        print(f"✓ OpenAI API test successful. Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ OpenAI API test failed: {str(e)}")

# Test Groq API key
print("\nTesting Groq API key:")
if not groq_api_key:
    print("❌ GROQ_API_KEY not found in environment variables")
else:
    print(f"✓ GROQ_API_KEY found: {groq_api_key[:5]}...{groq_api_key[-4:]}")
    try:
        client = groq.Groq(api_key=groq_api_key)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello, are you working?"}
            ],
            max_tokens=10
        )
        print(f"✓ Groq API test successful. Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Groq API test failed: {str(e)}")

print("\nAPI key testing complete.")