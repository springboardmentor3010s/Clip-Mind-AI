import math
import re
from collections import Counter


def _tokenize(text: str):
    """
    Convert text into normalized word tokens.
    """
    return re.findall(
        r"\b[a-zA-Z0-9]{2,}\b",
        text.lower()
    )


def _build_vocabulary(documents):
    """
    Build a vocabulary from all documents.
    """
    vocabulary = set()

    for document in documents:
        vocabulary.update(
            _tokenize(document)
        )

    return sorted(vocabulary)


def _term_frequency(tokens):
    """
    Calculate normalized term frequency.
    """
    if not tokens:
        return {}

    counts = Counter(tokens)
    total = len(tokens)

    return {
        word: count / total
        for word, count in counts.items()
    }


def _inverse_document_frequency(
    documents,
    vocabulary
):
    """
    Calculate IDF for every vocabulary term.
    """
    total_documents = len(documents)

    idf = {}

    for word in vocabulary:

        document_count = sum(
            1
            for document in documents
            if word in set(_tokenize(document))
        )

        idf[word] = math.log(
            (1 + total_documents)
            / (1 + document_count)
        ) + 1

    return idf


def _tfidf_vector(
    text,
    vocabulary,
    idf
):
    """
    Convert text into a TF-IDF vector.
    """
    tokens = _tokenize(text)
    tf = _term_frequency(tokens)

    return [
        tf.get(word, 0.0) * idf.get(word, 0.0)
        for word in vocabulary
    ]


def _cosine_similarity(vector_a, vector_b):
    """
    Calculate cosine similarity between two vectors.
    """
    if not vector_a or not vector_b:
        return 0.0

    dot_product = sum(
        a * b
        for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = math.sqrt(
        sum(a * a for a in vector_a)
    )

    magnitude_b = math.sqrt(
        sum(b * b for b in vector_b)
    )

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (
        magnitude_a * magnitude_b
    )


def _normalize_scores(scores):
    """
    Normalize a list of scores to the range 0-1.
    """
    if not scores:
        return []

    minimum = min(scores)
    maximum = max(scores)

    if maximum == minimum:
        return [1.0 for _ in scores]

    return [
        (score - minimum) /
        (maximum - minimum)
        for score in scores
    ]


def _generate_title(text: str):
    """
    Generate a simple title from the beginning
    of the transcript segment.

    This is intentionally lightweight.
    More advanced title generation can be added
    later as part of Highlight Reports.
    """
    words = text.strip().split()

    if not words:
        return "Key Moment"

    title_words = words[:8]

    title = " ".join(title_words)

    if len(words) > 8:
        title += "..."

    return title


def detect_key_moments(
    segments,
    summary_text: str,
    max_moments: int = 5
):
    """
    Detect important transcript segments.

    Parameters
    ----------
    segments:
        List of TranscriptSegment objects.

    summary_text:
        Short AI-generated summary of the video.

    max_moments:
        Maximum number of key moments to return.

    Returns
    -------
    List of dictionaries containing detected key moments.
    """

    if not segments:
        return []

    # Remove empty segments.
    valid_segments = [
        segment
        for segment in segments
        if segment.segment_text
        and segment.segment_text.strip()
    ]

    if not valid_segments:
        return []

    segment_texts = [
        segment.segment_text.strip()
        for segment in valid_segments
    ]

    # ---------------------------------------------------------
    # 1. Build TF-IDF vocabulary
    # ---------------------------------------------------------

    documents = segment_texts.copy()

    if summary_text:
        documents.append(summary_text)

    vocabulary = _build_vocabulary(
        documents
    )

    idf = _inverse_document_frequency(
        documents,
        vocabulary
    )

    segment_vectors = [
        _tfidf_vector(
            text,
            vocabulary,
            idf
        )
        for text in segment_texts
    ]

    # ---------------------------------------------------------
    # 2. Create overall transcript representation
    # ---------------------------------------------------------

    transcript_text = " ".join(
        segment_texts
    )

    transcript_vector = _tfidf_vector(
        transcript_text,
        vocabulary,
        idf
    )

    # ---------------------------------------------------------
    # 3. Create summary representation
    # ---------------------------------------------------------

    summary_vector = _tfidf_vector(
        summary_text or "",
        vocabulary,
        idf
    )

    # ---------------------------------------------------------
    # 4. Calculate importance signals
    # ---------------------------------------------------------

    centrality_scores = []
    summary_scores = []
    length_scores = []

    for index, segment in enumerate(
        valid_segments
    ):

        vector = segment_vectors[index]

        # How representative is this segment
        # of the overall transcript?
        centrality = _cosine_similarity(
            vector,
            transcript_vector
        )

        # How closely does this segment
        # relate to the AI-generated summary?
        summary_similarity = _cosine_similarity(
            vector,
            summary_vector
        )

        # Very short fragments such as
        # "yes", "okay", "thank you" should
        # receive a lower score.
        word_count = len(
            _tokenize(segment.segment_text)
        )

        length_score = min(
            word_count / 20.0,
            1.0
        )

        centrality_scores.append(
            centrality
        )

        summary_scores.append(
            summary_similarity
        )

        length_scores.append(
            length_score
        )

    # ---------------------------------------------------------
    # 5. Normalize signals
    # ---------------------------------------------------------

    centrality_scores = _normalize_scores(
        centrality_scores
    )

    summary_scores = _normalize_scores(
        summary_scores
    )

    # ---------------------------------------------------------
    # 6. Calculate final importance score
    # ---------------------------------------------------------

    scored_segments = []

    for index, segment in enumerate(
        valid_segments
    ):

        importance_score = (
            0.45 * centrality_scores[index]
            +
            0.45 * summary_scores[index]
            +
            0.10 * length_scores[index]
        )

        importance_score = round(
            min(
                max(importance_score, 0.0),
                1.0
            ),
            4
        )

        scored_segments.append({
            "segment": segment,
            "importance_score": importance_score
        })

    # ---------------------------------------------------------
    # 7. Sort by importance
    # ---------------------------------------------------------

    scored_segments.sort(
        key=lambda item: item["importance_score"],
        reverse=True
    )

    # ---------------------------------------------------------
    # 8. Select top moments
    # ---------------------------------------------------------

    if max_moments <= 0:
        max_moments = 5

    max_moments = min(
        max_moments,
        len(scored_segments)
    )

    selected = scored_segments[
        :max_moments
    ]

    # ---------------------------------------------------------
    # 9. Convert into KeyMoment-ready data
    # ---------------------------------------------------------

    key_moments = []

    for item in selected:

        segment = item["segment"]

        key_moments.append({
            "transcript_segment_id": segment.id,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "title": _generate_title(
                segment.segment_text
            ),
            "segment_text": segment.segment_text,
            "importance_score": item[
                "importance_score"
            ]
        })

    # Return chronologically rather than
    # by importance.
    key_moments.sort(
        key=lambda item: item["start_time"]
    )

    return key_moments