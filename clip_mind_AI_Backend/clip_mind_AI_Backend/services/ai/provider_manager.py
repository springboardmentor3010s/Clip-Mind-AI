"""
AI Provider Manager.

Priority:
  1. Groq (if GROQ_API_KEY is set)
  2. Gemini (if GEMINI_API_KEY is set)

Resilient Fallback:
  If a Groq request fails, automatically fall back to Gemini.
"""
import logging
from django.conf import settings
from .base import BaseAIProvider
from core.exceptions import AIProviderError

logger = logging.getLogger("ai")


class FallbackAIProvider(BaseAIProvider):
    """
    A wrapper provider that handles Groq to Gemini fallback at runtime.
    """

    def __init__(self):
        self._groq_provider = None
        self._gemini_provider = None

        # Warm up providers if keys exist
        if getattr(settings, "GROQ_API_KEY", None):
            try:
                from .groq_provider import GroqProvider
                self._groq_provider = GroqProvider()
            except Exception as exc:
                logger.error("Failed to initialize GroqProvider: %s", exc)

        if getattr(settings, "GEMINI_API_KEY", None):
            try:
                from .gemini_provider import GeminiProvider
                self._gemini_provider = GeminiProvider()
            except Exception as exc:
                logger.error("Failed to initialize GeminiProvider: %s", exc)

        if not self._groq_provider and not self._gemini_provider:
            raise AIProviderError(
                "No AI provider available. Please set GROQ_API_KEY or GEMINI_API_KEY."
            )

    @property
    def provider_name(self) -> str:
        if self._groq_provider:
            return "Resilient Groq (with Gemini Fallback)"
        return "Gemini Only"

    def transcribe(self, audio_file_path: str, language: str | None = None) -> dict:
        """Try Groq STT first, fall back to Gemini."""
        if self._groq_provider:
            try:
                logger.info("Fallback STT | Attempting Groq...")
                return self._groq_provider.transcribe(audio_file_path, language=language)
            except Exception as exc:
                logger.warning("Groq STT failed; switching to Gemini fallback. Error: %s", exc)
                if self._gemini_provider:
                    return self._gemini_provider.transcribe(audio_file_path, language=language)
                raise exc
        elif self._gemini_provider:
            return self._gemini_provider.transcribe(audio_file_path, language=language)
        raise AIProviderError("No STT provider is available.")

    def summarize(self, text: str, prompt: str | None = None) -> str:
        """Try Groq LLM first, fall back to Gemini."""
        if self._groq_provider:
            try:
                logger.info("Fallback Summarize | Attempting Groq...")
                return self._groq_provider.summarize(text, prompt=prompt)
            except Exception as exc:
                logger.warning("Groq Summarize failed; switching to Gemini fallback. Error: %s", exc)
                if self._gemini_provider:
                    return self._gemini_provider.summarize(text, prompt=prompt)
                raise exc
        elif self._gemini_provider:
            return self._gemini_provider.summarize(text, prompt=prompt)
        raise AIProviderError("No Summarizer provider is available.")

    def analyze_transcript(self, transcript: str, title: str = "") -> dict:
        """Try Groq analysis first, fall back to Gemini."""
        if self._groq_provider:
            try:
                logger.info("Fallback Analyze | Attempting Groq...")
                return self._groq_provider.analyze_transcript(transcript, title=title)
            except Exception as exc:
                logger.warning("Groq Analysis failed; switching to Gemini fallback. Error: %s", exc)
                if self._gemini_provider:
                    return self._gemini_provider.analyze_transcript(transcript, title=title)
                raise exc
        elif self._gemini_provider:
            return self._gemini_provider.analyze_transcript(transcript, title=title)
        raise AIProviderError("No Analyzer provider is available.")

    def translate_json(self, data: dict, target_language: str) -> dict:
        """Try Groq translation first, fall back to Gemini."""
        if self._groq_provider:
            try:
                logger.info("Fallback Translate | Attempting Groq...")
                return self._groq_provider.translate_json(data, target_language)
            except Exception as exc:
                logger.warning("Groq Translate failed; switching to Gemini fallback. Error: %s", exc)
                if self._gemini_provider:
                    return self._gemini_provider.translate_json(data, target_language)
                raise exc
        elif self._gemini_provider:
            return self._gemini_provider.translate_json(data, target_language)
        raise AIProviderError("No Translation provider is available.")


_provider_instance: BaseAIProvider | None = None


def get_ai_provider() -> BaseAIProvider:
    """
    Return the resilient fallback AI provider.
    """
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = FallbackAIProvider()
    return _provider_instance


def reset_provider() -> None:
    global _provider_instance
    _provider_instance = None

