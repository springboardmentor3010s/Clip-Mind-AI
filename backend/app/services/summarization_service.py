from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "facebook/bart-large-cnn"

# Lazy-loaded globals to keep startup instantaneous
_tokenizer = None
_model = None

def _get_summarizer_components():
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        print("Loading BART model into memory...")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    return _tokenizer, _model

def generate_summaries(text: str) -> dict:
    """
    Generates short and detailed summaries using Hugging Face BART sequence-to-sequence model.
    """
    if not text or len(text.strip()) == 0:
        return {"short_summary": "", "detailed_summary": ""}

    tokenizer, model = _get_summarizer_components()

    # Truncate strictly by tokens to avoid exceeding BART's 1024 token limit
    inputs = tokenizer(text, max_length=1024, truncation=True, return_tensors="pt")
    input_ids = inputs["input_ids"]

    token_count = input_ids.shape[1]
    if token_count < 30:
        return {
            "short_summary": text,
            "detailed_summary": text
        }

    # 1. Generate Short Summary
    short_max = min(60, max(20, int(token_count * 0.3)))
    short_ids = model.generate(
        input_ids,
        max_length=short_max,
        min_length=10,
        no_repeat_ngram_size=3,
        num_beams=4,
        early_stopping=True
    )
    short_summary = tokenizer.decode(short_ids[0], skip_special_tokens=True)

    # 2. Generate Detailed Summary
    detailed_max = min(250, max(50, int(token_count * 0.6)))
    detailed_ids = model.generate(
        input_ids,
        max_length=detailed_max,
        min_length=30,
        no_repeat_ngram_size=3,
        num_beams=4,
        early_stopping=True
    )
    detailed_summary = tokenizer.decode(detailed_ids[0], skip_special_tokens=True)

    return {
        "short_summary": short_summary,
        "detailed_summary": detailed_summary
    }