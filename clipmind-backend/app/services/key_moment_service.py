import math
import re
from collections import Counter


# =========================================================
# TEXT UTILITIES
# =========================================================

def _tokenize(text: str):
    """
    Convert text into normalized word tokens.
    """
    return re.findall(
        r"\b[a-zA-Z0-9]{2,}\b",
        text.lower()
    )


def _sentence_split(text: str):
    """
    Split text into reasonably clean sentences.
    """
    return [
        sentence.strip()
        for sentence in re.split(
            r"(?<=[.!?])\s+",
            text.strip()
        )
        if sentence.strip()
    ]


# =========================================================
# TF-IDF
# =========================================================

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

    tokenized_documents = [
        set(_tokenize(document))
        for document in documents
    ]

    for word in vocabulary:

        document_count = sum(
            1
            for tokens in tokenized_documents
            if word in tokens
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
    Normalize scores to the range 0-1.
    """
    if not scores:
        return []

    minimum = min(scores)
    maximum = max(scores)

    if maximum == minimum:
        return [1.0 for _ in scores]

    return [
        (score - minimum)
        / (maximum - minimum)
        for score in scores
    ]


# =========================================================
# KEY MOMENT QUALITY SIGNALS
# =========================================================

IMPORTANT_PHRASES = {
    "important",
    "important point",
    "key point",
    "key concept",
    "remember",
    "note that",
    "remember that",
    "in summary",
    "to summarize",
    "therefore",
    "thus",
    "in conclusion",
    "main idea",
    "definition",
    "defined as",
    "means that",
    "refers to",
    "example",
    "for example",
    "important to understand",
    "takeaway",
    "principle",
    "concept",
    "advantage",
    "disadvantage",
    "difference",
    "compare",
    "because",
    "reason",
    "result",
    "process",
    "step",
    "steps"
}


LOW_VALUE_PHRASES = {
    "thank you",
    "thanks",
    "okay",
    "ok",
    "alright",
    "good morning",
    "good afternoon",
    "good evening",
    "welcome everyone",
    "can you hear me",
    "are you able to hear me",
    "let us begin",
    "let's begin"
}


def _important_phrase_score(text: str):
    """
    Detect language that commonly indicates
    an educationally important statement.
    """
    normalized = text.lower().strip()

    score = 0.0

    for phrase in IMPORTANT_PHRASES:
        if phrase in normalized:
            score += 0.15

    return min(score, 1.0)


def _low_value_penalty(text: str):
    """
    Penalize conversational filler and greetings.
    """
    normalized = text.lower().strip()

    penalty = 0.0

    for phrase in LOW_VALUE_PHRASES:
        if phrase in normalized:
            penalty += 0.25

    return min(penalty, 0.8)


def _length_score(text: str):
    """
    Give reasonable-length transcript segments
    a higher quality score.

    Extremely short fragments are usually poor
    key moments.
    """
    word_count = len(_tokenize(text))

    if word_count < 5:
        return 0.0

    if word_count < 10:
        return 0.35

    if word_count < 15:
        return 0.65

    if word_count < 25:
        return 1.0

    if word_count < 40:
        return 0.9

    return 0.75


def _position_score(index: int, total_segments: int):
    """
    Provide a small positional signal.

    This prevents all selected moments from clustering
    around one tiny portion of the lecture.
    """
    if total_segments <= 1:
        return 1.0

    position = index / (total_segments - 1)

    # Slightly favor the beginning and middle where
    # introductions and core explanations often occur,
    # without heavily biasing the result.
    distance_from_middle = abs(position - 0.5)

    return max(
        0.0,
        1.0 - (distance_from_middle * 0.6)
    )


def _generate_title(text: str):
    """
    Generate a cleaner title from the transcript segment.
    """
    sentences = _sentence_split(text)

    if sentences:
        title_source = sentences[0]
    else:
        title_source = text.strip()

    words = title_source.split()

    if not words:
        return "Key Moment"

    title_words = words[:10]

    title = " ".join(title_words)

    if len(words) > 10:
        title += "..."

    return title


# =========================================================
# DIVERSITY
# =========================================================

def _text_similarity(text_a: str, text_b: str):
    """
    Calculate lexical similarity between two segments.
    """
    tokens_a = set(_tokenize(text_a))
    tokens_b = set(_tokenize(text_b))

    if not tokens_a or not tokens_b:
        return 0.0

    intersection = len(
        tokens_a.intersection(tokens_b)
    )

    union = len(
        tokens_a.union(tokens_b)
    )

    if union == 0:
        return 0.0

    return intersection / union


def _select_diverse_moments(
    scored_segments,
    max_moments
):
    """
    Select high-quality moments while avoiding
    several nearly identical adjacent segments.
    """

    selected = []

    for candidate in scored_segments:

        if len(selected) >= max_moments:
            break

        candidate_text = (
            candidate["segment"].segment_text
        )

        too_similar = False

        for existing in selected:

            existing_text = (
                existing["segment"].segment_text
            )

            similarity = _text_similarity(
                candidate_text,
                existing_text
            )

            if similarity >= 0.65:
                too_similar = True
                break

        if not too_similar:
            selected.append(candidate)

    # If strict diversity left us with too few moments,
    # fill remaining slots with the highest scoring
    # candidates.
    if len(selected) < max_moments:

        selected_ids = {
            item["segment"].id
            for item in selected
        }

        for candidate in scored_segments:

            if len(selected) >= max_moments:
                break

            if candidate["segment"].id not in selected_ids:
                selected.append(candidate)

    return selected


# =========================================================
# MAIN KEY MOMENT DETECTION
# =========================================================

def detect_key_moments(
    segments,
    summary_text: str,
    max_moments: int = 5
):
    """
    Detect important transcript segments.

    Uses the existing TF-IDF approach together with:
        - summary relevance
        - transcript centrality
        - segment quality
        - important phrase detection
        - filler penalty
        - positional signal
        - diversity filtering

    Returns the same structure already expected
    by the existing API.
    """

    if not segments:
        return []

    # -----------------------------------------------------
    # 1. Remove empty segments
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # 2. Build TF-IDF representation
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # 3. Overall transcript representation
    # -----------------------------------------------------

    transcript_text = " ".join(
        segment_texts
    )

    transcript_vector = _tfidf_vector(
        transcript_text,
        vocabulary,
        idf
    )

    # -----------------------------------------------------
    # 4. Summary representation
    # -----------------------------------------------------

    summary_vector = _tfidf_vector(
        summary_text or "",
        vocabulary,
        idf
    )

    # -----------------------------------------------------
    # 5. Calculate individual signals
    # -----------------------------------------------------

    centrality_scores = []
    summary_scores = []
    length_scores = []
    phrase_scores = []
    position_scores = []
    filler_penalties = []

    total_segments = len(valid_segments)

    for index, segment in enumerate(
        valid_segments
    ):

        text = segment.segment_text.strip()

        vector = segment_vectors[index]

        # How representative is the segment
        # of the complete transcript?
        centrality = _cosine_similarity(
            vector,
            transcript_vector
        )

        # How strongly does the segment relate
        # to the generated summary?
        summary_similarity = _cosine_similarity(
            vector,
            summary_vector
        )

        length = _length_score(text)

        phrase_score = _important_phrase_score(
            text
        )

        position = _position_score(
            index,
            total_segments
        )

        filler_penalty = _low_value_penalty(
            text
        )

        centrality_scores.append(
            centrality
        )

        summary_scores.append(
            summary_similarity
        )

        length_scores.append(
            length
        )

        phrase_scores.append(
            phrase_score
        )

        position_scores.append(
            position
        )

        filler_penalties.append(
            filler_penalty
        )

    # -----------------------------------------------------
    # 6. Normalize TF-IDF signals
    # -----------------------------------------------------

    centrality_scores = _normalize_scores(
        centrality_scores
    )

    summary_scores = _normalize_scores(
        summary_scores
    )

    # -----------------------------------------------------
    # 7. Calculate final importance score
    # -----------------------------------------------------

    scored_segments = []

    for index, segment in enumerate(
        valid_segments
    ):

        importance_score = (
            0.25 * summary_scores[index]
            +
            0.20 * centrality_scores[index]
            +
            0.15 * length_scores[index]
            +
            0.20 * phrase_scores[index]
            +
            0.10 * position_scores[index]
            +
            0.10 * (
                1.0 - filler_penalties[index]
            )
        )

        importance_score = round(
            min(
                max(
                    importance_score,
                    0.0
                ),
                1.0
            ),
            4
        )

        scored_segments.append({
            "segment": segment,
            "importance_score": importance_score
        })

    # -----------------------------------------------------
    # 8. Sort by importance
    # -----------------------------------------------------

    scored_segments.sort(
        key=lambda item:
        item["importance_score"],
        reverse=True
    )

    # -----------------------------------------------------
    # 9. Determine number of moments
    # -----------------------------------------------------

    if max_moments <= 0:
        max_moments = 5

    max_moments = min(
        max_moments,
        len(scored_segments)
    )

    # -----------------------------------------------------
    # 10. Select diverse moments
    # -----------------------------------------------------

    selected = _select_diverse_moments(
        scored_segments,
        max_moments
    )

    # -----------------------------------------------------
    # 11. Convert to existing API structure
    # -----------------------------------------------------

    key_moments = []

    for item in selected:

        segment = item["segment"]

        key_moments.append({
            "transcript_segment_id":
                segment.id,

            "start_time":
                segment.start_time,

            "end_time":
                segment.end_time,

            "title":
                _generate_title(
                    segment.segment_text
                ),

            "segment_text":
                segment.segment_text,

            "importance_score":
                item["importance_score"]
        })

    # -----------------------------------------------------
    # 12. Return chronologically
    # -----------------------------------------------------

    key_moments.sort(
        key=lambda item:
        item["start_time"]
    )

    return key_moments