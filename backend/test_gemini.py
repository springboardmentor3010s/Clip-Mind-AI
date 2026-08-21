import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

print("API KEY:", api_key)

genai.configure(api_key=api_key)

for model in genai.list_models():
    print(model.name)