from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import ollama

router = APIRouter()

# Request Body Schema
class ExplainRequest(BaseModel):
    transcript: str
    keyword: str
    language: str = "en"

@router.post("/explain-keyword")
def explain_keyword(payload: ExplainRequest):
    transcript = payload.transcript
    keyword = payload.keyword
    language = payload.language

    # Check whether keyword exists in transcript
    if keyword.lower() not in transcript.lower():
        return {
            "success": False,
            "message": f'"{keyword}" was not found in the transcript.'
        }

    lang_names = {
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिंदी)",
        "te": "Telugu (తెలుగు)",
        "ml": "Malayalam (മലയാളം)",
        "kn": "Kannada (കന്നഡ)",
        "mr": "Marathi",
        "gu": "Gujarati",
        "bn": "Bengali",
        "en": "English",
        "fr": "French",
        "de": "German",
        "es": "Spanish"
    }
    target_lang_name = lang_names.get(language, language)

    # ---------------- Improved Prompt ----------------
    prompt = f"""
You are an AI Educational Tutor.

TASK:
Explain the exact meaning and concept of the keyword "{keyword}" in a simple way for a student, based on its context in the provided transcript.

STRICT RULES:
1. Do NOT just repeat or copy-paste sentences from the transcript.
2. Give a clear, original explanation of what "{keyword}" actually means.
3. Write your COMPLETE explanation strictly in {target_lang_name} ({language}).
4. Keep the explanation engaging, accurate, and under 5 sentences.

Transcript Context:
{transcript}

Keyword to explain:
{keyword}
"""

    try:
        response = ollama.chat(
            model="llama3.2",
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.4} # Balanced creativity for better explanations
        )

        return {
            "success": True,
            "keyword": keyword,
            "explanation": response["message"]["content"]
        }

    except Exception as e:
        print("Ollama Explain Error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate explanation: {str(e)}"
        )