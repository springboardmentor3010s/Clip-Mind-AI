import os
import json
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_topics(transcript: str):
    prompt = f"""
You are an AI assistant.

Read the transcript and divide it into major topics.

Return ONLY valid JSON.

Example:

[
  {{
    "title": "Introduction",
    "description": "Speaker introduces the topic."
  }},
  {{
    "title": "What is Artificial Intelligence?",
    "description": "Explains AI and its meaning."
  }},
  {{
    "title": "Applications",
    "description": "Discusses real-world uses of AI."
  }},
  {{
    "title": "Conclusion",
    "description": "Summarizes the discussion."
  }}
]

Transcript:

{transcript}
"""

    models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ]

    last_error = None

    for model in models:
        for attempt in range(3):
            try:
                print(f"Generating topics using {model} (attempt {attempt + 1})")

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )

                text = response.text.strip()

                if text.startswith("```json"):
                    text = text.replace("```json", "").replace("```", "").strip()
                elif text.startswith("```"):
                    text = text.replace("```", "").strip()

                return json.loads(text)

            except Exception as e:
                last_error = e
                print(f"Topic generation failed: {e}")

                if attempt < 2:
                    time.sleep(2 ** attempt)

    print("All topic generation attempts failed.")
    print(f"Last error: {last_error}")

    return []