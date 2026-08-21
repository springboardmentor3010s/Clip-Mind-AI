import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_highlight_report(
    transcript,
    summary,
    keywords,
    key_moments,
):

    prompt = f"""
Return ONLY valid JSON.

Generate an AI Highlight Report.

Return exactly in this format.

{{
    "executive_summary":"...",
    "top_highlights":[
        "...",
        "...",
        "...",
        "..."
    ],
    "important_keywords":[
        "...",
        "...",
        "..."
    ],
    "key_moments":[
        "...",
        "...",
        "..."
    ],
    "ai_insight":"..."
}}

Summary:
{summary}

Keywords:
{keywords}

Key Moments:
{key_moments}

Transcript:
{transcript}
"""

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )

        text = response.text.strip()
        print("=" * 80)
        print("RAW GEMINI RESPONSE")
        print(text)
        print("=" * 80)

        if text.startswith("```json"):
            text = text.replace("```json", "")

        if text.endswith("```"):
            text = text.replace("```", "")

        text = text.strip()

        return json.loads(text)

    except Exception as e:

        print("Highlight Report Error:", e)

        return {
            "executive_summary": "",
            "top_highlights": [],
            "important_keywords": [],
            "key_moments": [],
            "ai_insight": ""
        }