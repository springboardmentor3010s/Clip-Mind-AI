import logging
import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM

logger = logging.getLogger(__name__)

# Initialize the summarizer pipeline
# We use a lightweight model by default to ensure it runs quickly without a GPU
try:
    try:
        summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    except KeyError:
        logger.info("Pipeline task 'summarization' not recognized, using AutoModelForSeq2SeqLM fallback.")
        tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")
        model = AutoModelForSeq2SeqLM.from_pretrained("sshleifer/distilbart-cnn-12-6")

        def summarizer_fallback(text, max_length=150, min_length=30, do_sample=False):
            inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=max_length,
                min_length=min_length,
                do_sample=do_sample
            )
            summary_text = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
            return [{"summary_text": summary_text}]

        summarizer = summarizer_fallback
except Exception as e:
    logger.error(f"Failed to load summarization model: {e}")
    summarizer = None

def chunk_text(text: str, max_chunk_size: int = 3000) -> list[str]:
    """
    Splits text into chunks to respect the model's context limits.
    Roughly, 3000 chars is ~600-800 tokens depending on the tokenizer.
    """
    words = text.split(" ")
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) > max_chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = len(word)
        else:
            current_chunk.append(word)
            current_length += len(word) + 1 # +1 for space
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

def generate_summary(text: str, detailed: bool = False) -> str:
    """
    Generates a summary for the given text.
    If detailed is True, it returns a longer, more comprehensive summary.
    """
    if not summarizer:
        return "Summary generation is currently unavailable (model not loaded)."

    if not text or not text.strip():
        return "No spoken content detected in this video to summarize."
        
    chunks = chunk_text(text, max_chunk_size=3000)
    summaries = []
    
    # Adjust max_length based on whether a detailed summary is requested
    max_len = 150 if detailed else 50
    min_len = 50 if detailed else 20
    
    for chunk in chunks:
        # Some chunks might be too small for the min_len constraint
        actual_min_len = min(min_len, len(chunk.split(" ")) - 1)
        
        # Guard against extremely short chunks
        if len(chunk.split(" ")) < 10:
            summaries.append(chunk)
            continue
            
        try:
            result = summarizer(chunk, max_length=max_len, min_length=actual_min_len, do_sample=False)
            summaries.append(result[0]['summary_text'])
        except Exception as e:
            logger.error(f"Error summarizing chunk: {e}")
            
    return " ".join(summaries)
