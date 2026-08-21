import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def summarize_text(text):
    prompt = f"""
    Summarize the following transcript.

    Also list important key moments.

    Transcript:
    {text}
    """

    response = model.generate_content(prompt)

    return response.text