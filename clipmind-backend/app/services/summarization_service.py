from transformers import pipeline


# ---------------------------------------------------------
# Load BART summarization model once
# ---------------------------------------------------------

summarizer = pipeline(
    "summarization",
    model="sshleifer/distilbart-cnn-12-6"
)


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

# Keep chunks comfortably below BART's input limit.
CHUNK_WORD_LIMIT = 300


# ---------------------------------------------------------
# Helper: Count model tokens
# ---------------------------------------------------------

def _count_tokens(text: str):
    if not text or not text.strip():
        return 0

    return len(
        summarizer.tokenizer.encode(
            text,
            add_special_tokens=True
        )
    )


# ---------------------------------------------------------
# Helper: Split long transcript into chunks
# ---------------------------------------------------------

def _split_into_chunks(
    transcript: str,
    max_words: int = CHUNK_WORD_LIMIT
):
    """
    Split a transcript into manageable chunks.

    Sentences are kept together where possible so that
    important information is less likely to be cut
    in the middle of a sentence.
    """

    transcript = (
        transcript
        .replace("\n", " ")
        .strip()
    )

    if not transcript:
        return []

    # Basic sentence separation
    sentences = [
        sentence.strip()
        for sentence in transcript.split(".")
        if sentence.strip()
    ]

    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:

        sentence_word_count = len(
            sentence.split()
        )

        # If adding this sentence would make the
        # chunk too large, save the current chunk.
        if (
            current_chunk
            and current_word_count
            + sentence_word_count
            > max_words
        ):
            chunks.append(
                " ".join(current_chunk)
            )

            current_chunk = []
            current_word_count = 0

        current_chunk.append(sentence)
        current_word_count += sentence_word_count

    # Add remaining sentences
    if current_chunk:
        chunks.append(
            " ".join(current_chunk)
        )

    return chunks


# ---------------------------------------------------------
# Helper: Summarize a single text block
# ---------------------------------------------------------

def _summarize_text(
    text: str,
    max_length: int,
    min_length: int
):
    """
    Summarize a single text block safely.
    """

    if not text or not text.strip():
        return ""

    text = text.strip()

    token_count = _count_tokens(text)

    # If the source is already very short, returning it
    # is better than forcing the model to create an
    # unnecessarily long summary.
    if token_count <= min_length + 10:
        return text

    # Make sure the requested output length is valid.
    safe_min_length = min(
        min_length,
        max(10, token_count // 2)
    )

    safe_max_length = min(
        max_length,
        max(safe_min_length + 10, token_count - 5)
    )

    result = summarizer(
        text,
        max_length=safe_max_length,
        min_length=safe_min_length,
        do_sample=False,
        truncation=True
    )

    return result[0]["summary_text"].strip()


# ---------------------------------------------------------
# Helper: Summarize long transcripts
# ---------------------------------------------------------

def _summarize_long_transcript(
    transcript: str,
    max_length: int,
    min_length: int
):
    """
    Summarize both short and long transcripts.

    Short transcript:
        Direct BART summarization.

    Long transcript:
        Chunk → summarize chunks → consolidate summaries.
    """

    if not transcript or not transcript.strip():
        raise ValueError(
            "Transcript cannot be empty."
        )

    transcript = transcript.strip()

    # -----------------------------------------------------
    # Short transcript
    # -----------------------------------------------------

    if len(transcript.split()) <= CHUNK_WORD_LIMIT:

        return _summarize_text(
            transcript,
            max_length=max_length,
            min_length=min_length
        )

    # -----------------------------------------------------
    # Long transcript
    # -----------------------------------------------------

    chunks = _split_into_chunks(
        transcript
    )

    chunk_summaries = []

    for chunk in chunks:

        summary = _summarize_text(
            chunk,
            max_length=100,
            min_length=30
        )

        if summary:
            chunk_summaries.append(
                summary
            )

    if not chunk_summaries:
        return transcript

    # Combine intermediate summaries
    combined_summary = " ".join(
        chunk_summaries
    )

    # -----------------------------------------------------
    # Final consolidation
    # -----------------------------------------------------

    return _summarize_text(
        combined_summary,
        max_length=max_length,
        min_length=min_length
    )


# =========================================================
# EXISTING PUBLIC FUNCTIONS
# =========================================================


# ---------------------------------------------------------
# Short Summary
# ---------------------------------------------------------

def generate_short_summary(
    transcript: str
):
    """
    Generate a concise summary.

    Existing function interface is preserved.
    """

    return _summarize_long_transcript(
        transcript,
        max_length=120,
        min_length=40
    )


# ---------------------------------------------------------
# Detailed Summary
# ---------------------------------------------------------

def generate_detailed_summary(
    transcript: str
):
    """
    Generate a more detailed summary.

    Existing function interface is preserved.
    """

    return _summarize_long_transcript(
        transcript,
        max_length=250,
        min_length=120
    )


# ---------------------------------------------------------
# Educational Summary
# ---------------------------------------------------------

def generate_educational_summary(
    transcript: str
):
    """
    Generate an educational summary.

    Existing function interface is preserved.
    """

    if not transcript or not transcript.strip():
        raise ValueError(
            "Transcript cannot be empty."
        )

    chunks = _split_into_chunks(
        transcript
    )

    educational_summaries = []

    for chunk in chunks:

        educational_text = (
            "The following is lecture content. "
            "Summarize the important educational information "
            "from the lecture. Focus on the main topic, "
            "key concepts, important points, and useful "
            "learning takeaways. "
            "Do not introduce information that is not present "
            "in the lecture. "
            "\n\n"
            + chunk
        )

        summary = _summarize_text(
            educational_text,
            max_length=120,
            min_length=40
        )

        if summary:
            educational_summaries.append(
                summary
            )

    if not educational_summaries:
        return ""

    combined_summary = " ".join(
        educational_summaries
    )

    # Final consolidation if necessary
    if _count_tokens(combined_summary) > 250:

        return _summarize_text(
            combined_summary,
            max_length=250,
            min_length=100
        )

    return combined_summary


# ---------------------------------------------------------
# Learning Material
# ---------------------------------------------------------

def generate_learning_material(
    transcript: str
):
    """
    Generate structured learning material.

    Returns:
        dict containing:
        - overview
        - key_learning_points
        - study_notes

    Existing return structure is preserved.
    """

    if not transcript or not transcript.strip():
        raise ValueError(
            "Transcript cannot be empty."
        )

    # -----------------------------------------------------
    # Overview
    # -----------------------------------------------------

    overview = _summarize_long_transcript(
        transcript,
        max_length=100,
        min_length=40
    )

    # -----------------------------------------------------
    # Study Notes
    # -----------------------------------------------------

    study_notes = _summarize_long_transcript(
        transcript,
        max_length=220,
        min_length=100
    )

    # -----------------------------------------------------
    # Key Learning Points
    # -----------------------------------------------------

    sentences = [
        sentence.strip()
        for sentence in transcript
        .replace("\n", " ")
        .split(".")
        if sentence.strip()
    ]

    key_points = []

    for sentence in sentences:

        if len(sentence.split()) >= 8:
            key_points.append(sentence)

        if len(key_points) >= 6:
            break

    return {
        "overview": overview,
        "key_learning_points": key_points,
        "study_notes": study_notes
    }