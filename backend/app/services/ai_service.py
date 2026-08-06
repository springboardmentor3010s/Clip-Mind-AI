import os
import json
import re

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def clean_json(content: str):
    """
    Clean and parse model output into valid JSON.
    """

    # Remove thinking blocks
    content = re.sub(
        r"<think>.*?</think>",
        "",
        content,
        flags=re.DOTALL
    ).strip()

    # Remove markdown
    content = content.replace("```json", "")
    content = content.replace("```", "").strip()

    # Extract JSON
    start = content.find("{")
    end = content.rfind("}")

    if start == -1 or end == -1:
        raise Exception("No JSON object returned.\n\n" + content)

    content = content[start:end + 1]

    try:
        return json.loads(content)

    except json.JSONDecodeError:

        fixed = content

        # Remove trailing commas
        fixed = re.sub(r",(\s*[}\]])", r"\1", fixed)

        # Replace single quotes
        fixed = fixed.replace("'", '"')

        # Quote unquoted keys
        fixed = re.sub(
            r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)',
            r'\1"\2"\3',
            fixed
        )

        return json.loads(fixed)


def generate_ai_content(transcript):

    transcript = transcript[:5000]

    prompt = f"""
You are an Educational AI.

IMPORTANT:

Return ONLY valid JSON.

Do NOT output <think>.
Do NOT think aloud.
Do NOT explain.
Do NOT use markdown.
Do NOT use code fences.

The first character MUST be {{
The last character MUST be }}

If any text appears before the JSON, your response is invalid.

Generate:

• Title
• Summary (150-200 words, multiple paragraphs)
• 4 Topics
• 4 Key Moments
• 4 Quiz Questions
• 4 Flashcards

Key Moments:
Use timestamps from the lecture whenever possible.

Quiz:
Each question must have exactly 4 options.

Flashcards:
Front = Concept
Back = Explanation

Transcript:

{transcript}

Return this schema exactly:

{{
    "title":"",
    "summary":"",
    "topics":[
        ""
    ],
    "key_moments":[
        {{
            "time":"00:00",
            "title":""
        }}
    ],
    "quiz":[
        {{
            "question":"",
            "options":[
                "",
                "",
                "",
                ""
            ],
            "answer":""
        }}
    ],
    "flashcards":[
        {{
            "front":"",
            "back":""
        }}
    ]
}}
"""

    response = client.chat.completions.create(
    model="qwen/qwen3.6-27b",

    messages=[
        {
            "role": "system",
            "content": (
                "You are a JSON generator. "
                "Return ONLY valid JSON. "
                "Never output <think>. "
                "Never reveal reasoning. "
                "Never use markdown."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ],

    temperature=0,

    max_completion_tokens=2500,

    reasoning_effort="none"
)

    content = response.choices[0].message.content.strip()

    print("\n========== RAW AI CONTENT ==========\n")
    print(content)
    print("\n====================================\n")

    return clean_json(content)


def generate_learning_material(transcript):

    transcript = transcript[:5000]

    prompt = f"""
You are an expert educator.

Return ONLY valid RFC 8259 JSON.

Rules:

- No markdown.
- No explanations.
- No thinking.
- No code fences.
- Property names MUST use double quotes.

Return exactly:

{{
    "notes":"",
    "assignment":[
        ""
    ],
    "question_bank":[
        ""
    ],
    "revision_guide":[
        ""
    ]
}}

Transcript:

{transcript}
"""

    response = client.chat.completions.create(
    model="qwen/qwen3.6-27b",

    messages=[
        {
            "role": "system",
            "content": (
                "You are a JSON generator. "
                "Return ONLY valid JSON. "
                "Never output <think>. "
                "Never reveal reasoning. "
                "Never use markdown."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ],

    temperature=0,

    max_completion_tokens=2000,

    reasoning_effort="none"
)

    content = response.choices[0].message.content.strip()

    print("\n====== RAW LEARNING MATERIAL ======\n")
    print(content)
    print("\n===================================\n")

    return clean_json(content)