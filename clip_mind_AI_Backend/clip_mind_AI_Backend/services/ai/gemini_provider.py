"""
Gemini AI provider implementation (fallback).

STT Model  : gemini speech API
LLM Model  : gemini-2.5-flash
"""
import json
import logging
import google.generativeai as genai
from django.conf import settings
from .base import BaseAIProvider
from core.exceptions import AIProviderError
from .groq_provider import _ANALYSIS_PROMPT, _MAX_ANALYSIS_CHARS, _normalise_analysis

logger = logging.getLogger("ai")


class GeminiProvider(BaseAIProvider):
    """Google Gemini-backed fallback implementation."""

    # gemini-flash-latest is the model actually reachable on the free key
    # (2.5-flash / 2.5-flash-lite return 404 "no longer available to new users",
    # 2.0-flash returns 429 quota).
    LLM_MODEL = "gemini-flash-latest"

    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise AIProviderError("GEMINI_API_KEY is not configured.")
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(self.LLM_MODEL)

    @property
    def provider_name(self) -> str:
        return "Gemini"

    def transcribe(self, audio_file_path: str, language: str | None = None) -> dict:
        """
        Gemini audio transcription via Gemini Files API.
        Uploads the audio file and requests transcription. Returns
        {"text": str, "segments": [...], "language": str}.
        """
        logger.info("Gemini STT | file=%s | lang=%s", audio_file_path, language or "auto")
        lang_hint = f" The spoken language is '{language}'." if language else ""
        try:
            audio_file = genai.upload_file(audio_file_path)
            try:
                response = self._model.generate_content(
                    [
                        "Transcribe the following audio accurately and completely." + lang_hint +
                        " Output the full text and segments with timestamps (start and end in seconds). "
                        "Return exactly a JSON object with keys 'text' (string), 'language' (ISO-639-1 code) and 'segments' "
                        "(list of objects with keys 'start', 'end', and 'text').",
                        audio_file
                    ],
                    generation_config=genai.GenerationConfig(response_mime_type="application/json"),
                )
                data = json.loads(response.text)
                segments = []
                for seg in data.get("segments", []):
                    start = float(seg.get("start", 0.0))
                    end = float(seg.get("end", 0.0))
                    segments.append({
                        "start": start,
                        "duration": max(0.0, end - start),
                        "text": seg.get("text", "").strip()
                    })
                return {
                    "text": data.get("text", ""),
                    "segments": segments,
                    "language": data.get("language", language or ""),
                }
            except Exception as json_exc:
                logger.warning("Gemini JSON STT failed, falling back to plain text: %s", json_exc)
                response = self._model.generate_content(
                    ["Transcribe the following audio accurately and completely." + lang_hint, audio_file]
                )
                text = response.text.strip()
                return {
                    "text": text,
                    "segments": [{"start": 0.0, "duration": 0.0, "text": text}],
                    "language": language or "",
                }
        except Exception as exc:
            logger.error("Gemini STT failed | error=%s", exc)
            raise AIProviderError(f"Gemini transcription failed: {exc}") from exc

    def summarize(self, text: str, prompt: str | None = None) -> str:
        """Summarize text using gemini-2.5-flash."""
        system_prompt = prompt or (
            "You are an expert content summarizer. "
            "Produce a concise, well-structured summary of the provided transcript. "
            "Highlight key topics, decisions, and action items."
        )
        logger.info("Gemini LLM | model=%s | chars=%d", self.LLM_MODEL, len(text))
        try:
            response = self._model.generate_content(f"{system_prompt}\n\n{text}")
            return response.text
        except Exception as exc:
            logger.error("Gemini LLM failed | error=%s", exc)
            raise AIProviderError(f"Gemini summarization failed: {exc}") from exc

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
            response = self._model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json"),
            )
            return json.loads(response.text)
        except Exception as exc:
            logger.error("Gemini translate_json failed | error=%s", exc)
            raise AIProviderError(f"Gemini translation failed: {exc}") from exc

    def analyze_transcript(self, transcript: str, title: str = "") -> dict:
        """
        Generate summary + key moments using Gemini as a fallback.
        Returns {"summary": str, "key_moments": list, ...}.
        """
        body = transcript[:_MAX_ANALYSIS_CHARS]
        if len(transcript) > _MAX_ANALYSIS_CHARS:
            body += "\n[... transcript truncated for length ...]"

        prompt = _ANALYSIS_PROMPT.format(title=title or "Unknown", transcript=body)
        logger.info("Gemini analyze_transcript | model=%s | chars=%d", self.LLM_MODEL, len(body))

        try:
            response = self._model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(response_mime_type="application/json"),
            )
            return _normalise_analysis(json.loads(response.text))
        except Exception as exc:
            logger.error("Gemini analyze_transcript failed | error=%s", exc)
            raise AIProviderError(f"Gemini analysis failed: {exc}") from exc

