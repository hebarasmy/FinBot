import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv('.env.local')

# testing page
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello, who are you?"}]
)

print(response.choices[0].message.content)