"""
Groq AI provider implementation.

STT Model : whisper-large-v3         (highest-accuracy Whisper on Groq; better
                                      multilingual coverage than the -turbo variant)
LLM Model : openai/gpt-oss-120b      (strong open reasoning model, reliable JSON,
                                      fast on Groq — used for study-grade summaries)
"""
import json
import logging
from groq import Groq
from django.conf import settings
from .base import BaseAIProvider
from core.exceptions import AIProviderError

logger = logging.getLogger("ai")

# Study.lol-grade structured analysis prompt. Braces are doubled so str.format()
# only substitutes {title} and {transcript}.
_ANALYSIS_PROMPT = """\
You are an expert study-notes and content-analysis assistant. Produce notes on par with study.lol.
Analyze the transcript of a video titled "{title}" and return ONLY valid JSON (no markdown fences, no commentary)
with EXACTLY these keys:
{{
  "short_summary": "2-3 sentence high-level overview of the whole video.",
  "detailed_summary": "Comprehensive, well-structured multi-paragraph summary in clear prose. Explain the main ideas, arguments, and conclusions so that a reader who never watched the video understands it fully.",
  "bullet_summary": ["6-12 concise, information-dense takeaways"],
  "chapter_summary": [{{"chapter": "Section title", "summary": "What this section covers", "timestamp_seconds": 0.0}}],
  "important_topics": ["core topics, entities, and keywords"],
  "action_items": ["concrete next steps, tasks, or recommendations mentioned or clearly implied"],
  "glossary": [{{"term": "Key term or concept", "definition": "Plain-language definition"}}],
  "key_questions": [{{"question": "Exam-style question a learner should be able to answer after watching", "answer": "Concise correct answer"}}],
  "key_moments": [{{"title": "Highlight title", "description": "Why this moment matters", "timestamp_seconds": 12.5, "order": 0}}]
}}

Rules:
- Base everything ONLY on the transcript. Never invent facts that the transcript does not support.
- Every timestamp_seconds MUST fall within the transcript's actual time range.
- Write explanations in English even if the spoken language differs.
- If the content is a song or has sparse speech, summarize its theme, mood, story, and the meaning of the lyrics; keep sections short but still populate them.
- Return valid JSON only.

Transcript:
{transcript}
"""

# Max transcript characters sent to the LLM. The free Groq tier caps requests at
# ~8000 tokens/minute, so prompt + max_tokens must stay under that budget.
# ~14000 chars ≈ 3500 tokens, leaving room for the 4096-token completion.
_MAX_ANALYSIS_CHARS = 14000


class GroqProvider(BaseAIProvider):
    """Groq-backed implementation of the AI provider interface."""

    STT_MODEL = "whisper-large-v3"
    LLM_MODEL = "openai/gpt-oss-120b"

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise AIProviderError("GROQ_API_KEY is not configured.")
        self._client = Groq(api_key=api_key)

    @property
    def provider_name(self) -> str:
        return "Groq"

    def transcribe(self, audio_file_path: str, language: str | None = None) -> dict:
        """
        Transcribe audio using Groq Whisper Large V3.

        Returns {"text": str, "segments": [{start, duration, text}], "language": str}.
        `language` (ISO-639-1, e.g. 'hi') may be provided to skip auto-detection
        and improve accuracy for known-language content.
        """
        logger.info("Groq STT | model=%s | file=%s | lang=%s", self.STT_MODEL, audio_file_path, language or "auto")
        try:
            kwargs = {"model": self.STT_MODEL, "response_format": "verbose_json", "temperature": 0.0}
            if language:
                kwargs["language"] = language
            with open(audio_file_path, "rb") as audio:
                response = self._client.audio.transcriptions.create(file=audio, **kwargs)

            if isinstance(response, dict):
                text = response.get("text", "")
                segments_raw = response.get("segments", [])
                detected = response.get("language", "")
            else:
                text = getattr(response, "text", "")
                segments_raw = getattr(response, "segments", [])
                detected = getattr(response, "language", "")

            segments = []
            for item in segments_raw:
                if isinstance(item, dict):
                    start = item.get("start", 0.0)
                    end = item.get("end", 0.0)
                    seg_text = item.get("text", "")
                else:
                    start = getattr(item, "start", 0.0)
                    end = getattr(item, "end", 0.0)
                    seg_text = getattr(item, "text", "")
                segments.append({
                    "start": start,
                    "duration": max(0.0, (end or 0.0) - (start or 0.0)),
                    "text": (seg_text or "").strip(),
                })
            return {"text": text, "segments": segments, "language": detected or (language or "")}
        except Exception as exc:
            logger.error("Groq STT failed | error=%s", exc)
            raise AIProviderError(f"Groq transcription failed: {exc}") from exc

    def summarize(self, text: str, prompt: str | None = None) -> str:
        """Summarize free-form text using the configured LLM."""
        system_prompt = prompt or (
            "You are an expert content summarizer. Produce a concise, well-structured "
            "summary of the provided transcript. Highlight key topics, decisions, and action items."
        )
        logger.info("Groq LLM | model=%s | chars=%d", self.LLM_MODEL, len(text))
        try:
            response = self._client.chat.completions.create(
                model=self.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as exc:
            logger.error("Groq LLM failed | error=%s", exc)
            raise AIProviderError(f"Groq summarization failed: {exc}") from exc

    def translate_json(self, data: dict, target_language: str) -> dict:
        """Translate string values in `data` into target_language, preserving structure."""
        payload = json.dumps(data, ensure_ascii=False)
        prompt = (
            f"Translate every human-readable natural-language string VALUE in the following JSON "
            f"into {target_language}. Keep the JSON structure, all keys, numbers, and timestamp "
            f"fields EXACTLY the same — only translate natural-language text values. Do not add, "
            f"remove, or reorder fields. Return ONLY the translated JSON object.\n\nJSON:\n{payload}"
        )
        try:
            response = self._client.chat.completions.create(
                model=self.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)
        except Exception as exc:
            logger.error("Groq translate_json failed | error=%s", exc)
            raise AIProviderError(f"Groq translation failed: {exc}") from exc

    def analyze_transcript(self, transcript: str, title: str = "") -> dict:
        """Generate a study-grade structured analysis (summary + key moments + more)."""
        body = transcript[:_MAX_ANALYSIS_CHARS]
        if len(transcript) > _MAX_ANALYSIS_CHARS:
            body += "\n[... transcript truncated for length ...]"

        prompt = _ANALYSIS_PROMPT.format(title=title or "Unknown", transcript=body)
        logger.info("Groq analyze_transcript | model=%s | chars=%d", self.LLM_MODEL, len(body))
        try:
            response = self._client.chat.completions.create(
                model=self.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )
            data = json.loads(response.choices[0].message.content)
            return _normalise_analysis(data)
        except Exception as exc:
            logger.error("Groq analyze_transcript failed | error=%s", exc)
            raise AIProviderError(f"Groq analysis failed: {exc}") from exc


def _normalise_analysis(data: dict) -> dict:
    """Ensure the analysis dict has consistent, safe defaults for all keys."""
    data.setdefault("short_summary", "")
    data.setdefault("detailed_summary", "")
    data.setdefault("bullet_summary", [])
    data.setdefault("chapter_summary", [])
    data.setdefault("important_topics", [])
    data.setdefault("action_items", [])
    data.setdefault("glossary", [])
    data.setdefault("key_questions", [])
    for i, km in enumerate(data.get("key_moments", []) or []):
        km.setdefault("order", i)
        km.setdefault("timestamp_seconds", 0.0)
        km.setdefault("description", "")
        km.setdefault("title", f"Moment {i + 1}")
    return data
