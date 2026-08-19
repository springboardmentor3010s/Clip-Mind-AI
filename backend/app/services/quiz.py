"""Derives interactive study materials (flashcards, fill-in-the-blank, and
multiple-choice questions) directly from a transcript + its extracted
keywords — the same frequency-based, no-external-model approach used
elsewhere in this project (see services/key_moments.py). These are draft
study aids generated on the fly, not persisted, and not a substitute for
instructor-authored materials — but they give Learners/Educators something
interactive to work with immediately after a transcript is ready.
"""
import random
import re
from typing import Any, Dict, List


def _find_segment_with_keyword(segments: List[Dict[str, Any]], keyword: str):
    for seg in segments:
        text = seg.get("text", "")
        if re.search(rf"\b{re.escape(keyword)}\b", text, re.IGNORECASE):
            return seg
    return None


def generate_flashcards(segments: List[Dict[str, Any]], keywords: List[str], max_cards: int = 8) -> List[Dict[str, str]]:
    """One card per top keyword: front = term, back = the sentence it appeared in."""
    cards = []
    for kw in keywords[:max_cards]:
        seg = _find_segment_with_keyword(segments, kw)
        if not seg:
            continue
        cards.append({
            "term": kw.capitalize(),
            "context": seg.get("text", "").strip().capitalize(),
        })
    return cards


def generate_fill_in_blanks(segments: List[Dict[str, Any]], keywords: List[str], max_questions: int = 8) -> List[Dict[str, str]]:
    """Blanks out the keyword in a sentence it appears in; the answer is the keyword."""
    questions = []
    used_keywords = set()
    for kw in keywords:
        if len(questions) >= max_questions:
            break
        seg = _find_segment_with_keyword(segments, kw)
        if not seg or kw in used_keywords:
            continue
        text = seg.get("text", "").strip()
        blanked = re.sub(rf"\b{re.escape(kw)}\b", "_____", text, count=1, flags=re.IGNORECASE)
        if blanked == text:
            continue
        questions.append({"question": blanked.capitalize(), "answer": kw})
        used_keywords.add(kw)
    return questions


def generate_mcqs(segments: List[Dict[str, Any]], keywords: List[str], max_questions: int = 6) -> List[Dict[str, Any]]:
    """Multiple-choice: 'which word completes this sentence', with the correct
    keyword mixed in among distractors drawn from the video's other keywords."""
    fill_ins = generate_fill_in_blanks(segments, keywords, max_questions=max_questions)
    questions = []
    for item in fill_ins:
        correct = item["answer"]
        distractor_pool = [kw for kw in keywords if kw != correct]
        distractors = random.sample(distractor_pool, k=min(3, len(distractor_pool)))
        options = distractors + [correct]
        random.shuffle(options)
        questions.append({
            "question": item["question"],
            "options": [opt.capitalize() for opt in options],
            "answer": correct.capitalize(),
        })
    return questions


def generate_study_materials(segments: List[Dict[str, Any]], keywords: List[str]) -> Dict[str, Any]:
    return {
        "flashcards": generate_flashcards(segments, keywords),
        "fill_in_blanks": generate_fill_in_blanks(segments, keywords),
        "mcqs": generate_mcqs(segments, keywords),
    }
