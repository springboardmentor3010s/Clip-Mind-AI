import re

from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer


CUSTOM_STOP_WORDS = {
    "said",
    "say",
    "says",
    "also",
    "like",
    "just",
    "really",
    "actually",
    "thing",
    "things",
    "way",
    "ways",
    "get",
    "got",
    "getting",
    "know",
    "known",
    "using",
    "used",
    "use",
    "make",
    "makes",
    "made",
    "want",
    "need",
    "needs",
    "going",
    "come",
    "comes",
    "let",
    "lets",
    "okay",
    "yes",
    "yeah",
    "well",
    "moves",
}


GENERIC_SINGLE_WORDS = {
    "answer",
    "question",
    "user",
    "response",
    "information",
    "thing",
    "people",
    "person",
    "problem",
    "example",
    "part",
    "point",
    "time",
    "way",
    "case",
    "result",
    "work",
    "number",
    "large",
    "small",
    "good",
    "different",
    "important",
}


TECHNICAL_TERMS = {
    "llm",
    "rag",
    "ai",
    "nlp",
    "api",
    "ml",
}


def _clean_text(text: str):

    text = text.lower()

    text = re.sub(
        r"[^a-zA-Z0-9\s-]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


def _is_generic_single_word(
    keyword: str
):

    return (
        len(keyword.split()) == 1
        and keyword in GENERIC_SINGLE_WORDS
    )


def _is_redundant_phrase(
    candidate: str,
    selected_keywords: list
):

    candidate_words = set(
        candidate.split()
    )

    for selected in selected_keywords:

        selected_words = set(
            selected.split()
        )

        # Candidate is completely contained
        # inside a stronger phrase.
        if (
            candidate_words < selected_words
        ):
            return True

        # Singular/plural variation.
        if (
            candidate.rstrip("s")
            == selected.rstrip("s")
        ):
            return True

    return False


def extract_keywords(
    segments,
    max_keywords: int = 15
):

    """
    Extract keywords and phrases from
    timestamped transcript segments.

    Each transcript segment is treated as
    a separate TF-IDF document.
    """

    if not segments:
        return []

    # ---------------------------------------------------------
    # 1. Prepare segment documents
    # ---------------------------------------------------------

    documents = []

    for segment in segments:

        text = _clean_text(
            segment.segment_text
        )

        if text:

            documents.append(text)

    if not documents:
        return []

    # ---------------------------------------------------------
    # 2. TF-IDF across transcript segments
    # ---------------------------------------------------------

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 3),
        min_df=1,
        max_features=300
    )

    tfidf_matrix = vectorizer.fit_transform(
        documents
    )

    terms = vectorizer.get_feature_names_out()

    # Average TF-IDF score across segments.
    average_scores = (
        tfidf_matrix.mean(axis=0)
        .A1
    )

    # ---------------------------------------------------------
    # 3. Frequency across complete transcript
    # ---------------------------------------------------------

    complete_text = " ".join(
        documents
    )

    candidates = []

    for term, tfidf_score in zip(
        terms,
        average_scores
    ):

        if tfidf_score <= 0:
            continue

        words = term.split()

        # Remove custom filler words.
        if any(
            word in CUSTOM_STOP_WORDS
            for word in words
        ):
            continue

        # Ignore extremely short terms.
        if any(
            len(word) < 2
            for word in words
        ):
            continue

        frequency = complete_text.count(
            term
        )

        if frequency <= 0:
            continue

        # -----------------------------------------------------
        # 4. Build relevance score
        # -----------------------------------------------------

        score = float(tfidf_score)

        # Prefer meaningful phrases.
        if len(words) == 2:

            score *= 1.25

        elif len(words) >= 3:

            score *= 1.50

        # Penalize generic standalone words.
        if _is_generic_single_word(term):

            score *= 0.35

        # Slight boost for technical acronyms.
        if term in TECHNICAL_TERMS:

            score *= 1.35

        candidates.append({
            "keyword": term,
            "frequency": frequency,
            "score": score
        })

    if not candidates:
        return []

    # ---------------------------------------------------------
    # 5. Sort candidates
    # ---------------------------------------------------------

    candidates.sort(
        key=lambda item: (
            item["score"],
            item["frequency"]
        ),
        reverse=True
    )

    # ---------------------------------------------------------
    # 6. Remove redundant phrases
    # ---------------------------------------------------------

    selected = []

    for candidate in candidates:

        keyword = candidate["keyword"]

        if _is_redundant_phrase(
            keyword,
            [
                item["keyword"]
                for item in selected
            ]
        ):
            continue

        selected.append(candidate)

        if len(selected) >= max_keywords:
            break

    if not selected:
        return []

    # ---------------------------------------------------------
    # 7. Normalize relevance scores
    # ---------------------------------------------------------

    max_score = max(
        item["score"]
        for item in selected
    )

    results = []

    for item in selected:

        relevance_score = (
            item["score"] / max_score
            if max_score > 0
            else 0.0
        )

        results.append({
            "keyword": item["keyword"],
            "frequency": item["frequency"],
            "relevance_score": round(
                relevance_score,
                4
            )
        })

    return results