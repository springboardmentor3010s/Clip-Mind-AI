import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_summary(transcript: str):

    prompt = f"""
You are an AI assistant.

Summarize the following transcript.

Rules:
- Use simple English.
- Maximum 5 bullet points.
- Mention only the important ideas.

Transcript:

{transcript}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text