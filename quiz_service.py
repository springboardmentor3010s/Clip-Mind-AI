"""
Quiz Generation Service using Google Gemini API.
Generates multiple-choice questions from video transcripts or summaries.
"""

import os
import json
import logging
from dotenv import load_dotenv
from google import genai

logger = logging.getLogger(__name__)
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_API_KEY not found. Please set it in your .env file."
    )

# Initialize the new google-genai client
client = genai.Client(api_key=GOOGLE_API_KEY)


class QuizService:
    """
    Generates multiple-choice quizzes from transcript/summary text
    using Google Gemini.
    """

    def __init__(self):
        self.model_name = "gemini-2.5-flash"
        self.client = client if GOOGLE_API_KEY else None

    # -----------------------------------------------------

    def generate_quiz(
        self,
        transcript: str,
        num_questions: int = 10,
        difficulty: str = "Medium",
    ) -> list[dict]:
        """
        Generate multiple-choice questions from the given transcript.

        Args:
            transcript: The video transcript or summary text.
            num_questions: Number of questions to generate (1-20).
            difficulty: Difficulty level - "Easy", "Medium", or "Hard".

        Returns:
            List of question dicts with keys: question, options, answer.
        """
        if not self.client:
            raise RuntimeError(
                "Gemini API key not configured. Set GOOGLE_API_KEY environment variable."
            )

        if not transcript or not transcript.strip():
            raise ValueError("Transcript is empty")

        # Clamp question count
        num_questions = max(1, min(20, num_questions))

        prompt = f"""
You are an AI quiz generator. Generate {num_questions} {difficulty} difficulty multiple-choice questions
based on the following transcript.

Rules:
- Each question must have exactly 4 options.
- One option must be the correct answer.
- Questions should test understanding, not just memorization.
- Return ONLY valid JSON — no markdown, no code fences, no extra text.

Format:
[
  {{
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }}
]

Transcript:
{transcript}
"""

        try:
            logger.info(
                f"Generating {num_questions} {difficulty} questions via Gemini..."
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            text = response.text.strip()

            # Strip markdown code fences if present
            if text.startswith("```"):
                # Remove opening fence (```json or ```)
                first_newline = text.find("\n")
                if first_newline != -1:
                    text = text[first_newline + 1 :]
                # Remove closing fence
                if text.endswith("```"):
                    text = text[:-3].strip()
                elif "```" in text:
                    text = text[: text.rfind("```")].strip()

            quiz = json.loads(text)

            if not isinstance(quiz, list):
                raise ValueError("Response is not a list")

            logger.info(f"Successfully generated {len(quiz)} questions")
            return quiz

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.debug(f"Raw response: {text}")
            raise RuntimeError(
                "Failed to parse quiz response. Please try again."
            ) from e
        except Exception as e:
            logger.exception("Quiz generation failed")
            raise RuntimeError(f"Quiz generation failed: {str(e)}") from e