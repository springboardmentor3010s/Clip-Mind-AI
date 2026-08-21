import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

import os

print("=" * 50)
print("API KEY:", os.getenv("GEMINI_API_KEY"))
print("=" * 50)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_summary(transcript: str):

    prompt = f"""
You are an AI assistant.

Summarize the following transcript.

Rules:
- Use simple English.
- Give summary in a paragraph.
- Do NOT use Markdown.
- Do NOT use ** or # symbols.
- Return plain text only.
- Mention only the important ideas.

Transcript:

{transcript}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text

def generate_short_summary(summary: str):
    prompt = f"""
Convert the following detailed summary into a very short summary.

Rules:
- Maximum 3 sentences.
- Keep only the most important points.
- Use simple English.

Summary:

{summary}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return response.text