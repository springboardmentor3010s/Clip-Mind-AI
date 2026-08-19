"""
Abstract base class for all AI providers.
New providers (OpenAI, Anthropic, etc.) must implement this interface.
"""
from abc import ABC, abstractmethod


class BaseAIProvider(ABC):
    """
    Interface that every AI provider must implement.
    This allows the ProviderManager to swap providers transparently.
    """

    @abstractmethod
    def transcribe(self, audio_file_path: str, language: str | None = None) -> dict:
        """
        Convert audio to text.

        :param audio_file_path: Local path to the audio file.
        :param language: Optional ISO-639-1 language hint (e.g. 'hi') to skip
            auto-detection and improve accuracy for known-language content.
        :returns: dict with keys 'text' (str), 'segments' (list) and 'language' (str).
        """

    @abstractmethod
    def summarize(self, text: str, prompt: str | None = None) -> str:
        """
        Summarize text using the LLM.

        :param text: Input text to summarize.
        :param prompt: Optional system/user prompt override.
        :returns: Summary string.
        """

    @abstractmethod
    def analyze_transcript(self, transcript: str, title: str = "") -> dict:
        """
        Produce a summary and extract key moments from a transcript.

        :returns: dict with keys:
            - summary (str)
            - key_moments (list of {title, description, timestamp_seconds, order})
        """

    @abstractmethod
    def translate_json(self, data: dict, target_language: str) -> dict:
        """
        Translate the human-readable string values inside `data` into
        `target_language`, preserving the JSON structure, keys, numbers and
        timestamp fields exactly. Returns the translated dict.
        """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable name of the provider."""
