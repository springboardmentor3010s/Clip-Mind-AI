"""
Learning material generator service (pure Python — no model inference).

Builds structured study materials — summary, key terms, flashcards, and
key takeaways — from a video transcript. Reuses the lightweight keyword
extractor and bullet-point extractor so it completes in milliseconds
without loading the heavy transformers/torch stack.
"""
import re
from app.services.bullet_points import generate_bullet_points
from app.services.keyword_service import KeywordService


_SENTENCE_REGEX = re.compile(r"(?<=[.!?])\s+")

_kw_service = KeywordService()


def _split_sentences(text: str) -> list:
    """Split text into cleaned, non-empty sentences."""
    if not text:
        return []
    text = re.sub(r"\s+", " ", text).strip()
    return [s.strip() for s in _SENTENCE_REGEX.split(text) if s.strip()]


def _first_sentence_containing(text_sentences: list, term: str, max_chars: int = 200) -> str:
    """Return the first sentence mentioning ``term`` (truncated), or empty."""
    term_lower = term.lower()
    for sentence in text_sentences:
        if term_lower in sentence.lower():
            if len(sentence) > max_chars:
                cut = sentence[:max_chars]
                cut = cut.rsplit(" ", 1)[0]
                return cut.rstrip(" ,;:.") + "..."
            return sentence
    return ""


class LearningMaterialService:
    """Generate study materials from a transcript."""

    @staticmethod
    def generate(
        transcript: str,
        summary_text: str | None = None,
        title_hint: str = "Study Notes",
        num_terms: int = 8,
        num_flashcards: int = 6,
        num_takeaways: int = 8,
    ) -> dict:
        """
        Generate a learning-materials payload.

        Returns a dict matching ``LearningMaterialContent``:
        ``{ summary, key_terms[], flashcards[], takeaways[] }``.
        """
        if not transcript or not transcript.strip():
            raise ValueError("Transcript is empty. Generate a transcript first.")

        sentences = _split_sentences(transcript)

        # --- Key terms (from the transcript, ordered by frequency) ---
        keyword_data = _kw_service.extract_keywords(transcript, top_n=num_terms * 2)
        key_terms = []
        seen_terms = set()
        for item in keyword_data:
            term = (item.get("keyword") or "").capitalize()
            if not term or term.lower() in seen_terms:
                continue
            seen_terms.add(term.lower())
            definition = _first_sentence_containing(sentences, term)
            key_terms.append({"term": term, "definition": definition})
            if len(key_terms) >= num_terms:
                break

        # --- Flashcards (keyword → sentence Q/A) ---
        flashcards = []
        for term_info in key_terms[:num_flashcards]:
            if not term_info["definition"]:
                continue
            flashcards.append(
                {
                    "front": f"What is {term_info['term']}?",
                    "back": term_info["definition"],
                }
            )
        # Pad with sentence-based flashcards if needed
        if len(flashcards) < num_flashcards and len(sentences) >= 2:
            for sentence in sentences[1:]:
                if len(flashcards) >= num_flashcards:
                    break
                words = re.findall(r"[a-zA-Z']+", sentence)
                if len(words) < 6:
                    continue
                front = " ".join(words[:6]).rstrip(" ,;:.") + "...?"
                flashcards.append({"front": front, "back": sentence})

        # --- Takeaways (concise bullet points) ---
        source = summary_text or transcript
        takeaways = generate_bullet_points(source, num_points=num_takeaways, max_chars=160)

        # --- Summary (extractive: first few keyword-weighted sentences) ---
        if summary_text and summary_text.strip():
            summary = re.sub(r"\s+", " ", summary_text).strip()
            if len(summary) > 900:
                summary = summary[:900].rsplit(" ", 1)[0] + "..."
        else:
            summary_sentences = _split_sentences(transcript)
            if summary_sentences:
                summary = " ".join(summary_sentences[:3])
            else:
                summary = transcript.strip()[:500]

        return {
            "summary": summary,
            "key_terms": key_terms,
            "flashcards": flashcards,
            "takeaways": takeaways,
        }