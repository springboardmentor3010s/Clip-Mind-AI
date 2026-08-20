"""
Generates simple Q&A pairs from summary text using a lightweight
T5-based question-generation model.
"""

from transformers import pipeline

_qg_pipeline = None


def get_qg_pipeline():
    global _qg_pipeline
    if _qg_pipeline is None:
        print("[Q&A] Loading question-generation model (first run may take a while)...")
        _qg_pipeline = pipeline("text2text-generation", model="google/flan-t5-small")
        print("[Q&A] Model loaded.")
    return _qg_pipeline


def generate_qa_pairs(text: str, num_questions: int = 4) -> list[dict]:
    qg = get_qg_pipeline()

    prompt = (
        f"Generate {num_questions} short quiz questions with answers based on this text. "
        f"Format each as 'Q: ... A: ...' on its own line.\n\nText: {text}"
    )
    result = qg(prompt, max_length=300, do_sample=False)[0]["generated_text"]

    pairs = []
    lines = [l.strip() for l in result.split("\n") if l.strip()]
    for line in lines:
        if "Q:" in line and "A:" in line:
            q_part = line.split("Q:")[1].split("A:")[0].strip()
            a_part = line.split("A:")[1].strip()
            if q_part and a_part:
                pairs.append({"question": q_part, "answer": a_part})

    # Fallback: if the model didn't follow the format well, generate simpler
    # single Q&A per sentence chunk as a safety net.
    if not pairs:
        sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20][:num_questions]
        for s in sentences:
            pairs.append({"question": f"What does the video say about: \"{s[:50]}...\"?", "answer": s})

    return pairs[:num_questions]