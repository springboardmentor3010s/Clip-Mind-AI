"""
Translates transcript segments into a target language using Google Translate
(via deep-translator). This is separate from Whisper's speech recognition —
Whisper converts speech to text in the spoken language, and this translates
that text into whatever language the user wants.
"""

from deep_translator import GoogleTranslator


def translate_segments(segments: list[dict], target_lang: str) -> list[dict]:
    translated = []
    for seg in segments:
        try:
            translated_text = GoogleTranslator(source="auto", target=target_lang).translate(seg["text"])
        except Exception as e:
            print(f"[Translate] Failed on segment, keeping original: {e}")
            translated_text = seg["text"]
        translated.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": translated_text,
        })
    return translated


def translate_text(text: str, target_lang: str) -> str:
    try:
        return GoogleTranslator(source="auto", target=target_lang).translate(text)
    except Exception as e:
        print(f"[Translate] Failed: {e}")
        return text