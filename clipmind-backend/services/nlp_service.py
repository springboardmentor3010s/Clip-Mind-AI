"""
Lightweight, dependency-friendly NLP:
- Extractive TextRank summarization
- Short summary generation
- Abstract generation
- Detailed summary generation
- Frequency-based keyword extraction

No external model downloads required.
Uses scikit-learn + networkx + regex.
"""

import re
from collections import Counter

import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


STOPWORDS = set("""
a about above after again against all am an and any are aren't as at be because been
before being below between both but by can't cannot could couldn't did didn't do does
doesn't doing don't down during each few for from further had hadn't has hasn't have
haven't having he he'd he'll he's her here here's hers herself him himself his how
how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most
mustn't my myself no nor not of off on once only or other ought our ours ourselves out
over own same shan't she she'd she'll she's should shouldn't so some such than that
that's the their theirs them themselves then there there's these they they'd they'll
they're they've this that these those through to too under until up very was wasn't we
we'd we'll we're we've were weren't what what's when when's where where's which while
who who's whom why why's with won't would wouldn't you you'd you'll you're you've your
yourself yourselves this that these those it its
""".split())


def split_sentences(text: str):
    """Split transcript text into reasonably clean sentences."""
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    sentences = re.split(r"(?<=[.!?])\s+", text)

    return [
        s.strip()
        for s in sentences
        if len(s.strip()) > 0
    ]


def _tokenize_words(text: str):
    """Return lowercase word tokens."""
    return re.findall(r"[a-zA-Z']+", text.lower())


def textrank_sentences(sentences, top_n=5):
    """
    Rank sentences using a TF-IDF similarity graph + PageRank.

    Returns sentence indices in their original transcript order.
    """
    if not sentences:
        return []

    if len(sentences) <= top_n:
        return list(range(len(sentences)))

    vectorizer = TfidfVectorizer(stop_words="english")

    try:
        tfidf = vectorizer.fit_transform(sentences)
    except ValueError:
        return list(range(min(top_n, len(sentences))))

    sim_matrix = cosine_similarity(tfidf)

    for i in range(len(sim_matrix)):
        sim_matrix[i, i] = 0

    graph = nx.from_numpy_array(sim_matrix)

    try:
        scores = nx.pagerank(graph, max_iter=200)
    except nx.PowerIterationFailedConvergence:
        scores = {i: 1.0 for i in range(len(sentences))}

    ranked = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    # Take the most important sentences and restore transcript order.
    top_indices = sorted(
        idx for idx, _ in ranked[:top_n]
    )

    return top_indices


def extract_keywords(text: str, top_n: int = 8):
    """Frequency-based keyword extraction."""
    words = [
        w
        for w in _tokenize_words(text)
        if len(w) > 4 and w not in STOPWORDS
    ]

    counts = Counter(words)

    return [
        {
            "term": term,
            "count": count
        }
        for term, count in counts.most_common(top_n)
    ]


def _clean_summary_sentences(sentences):
    """
    Remove obviously empty/very short sentences from summaries.
    """
    cleaned = []

    for sentence in sentences:
        sentence = re.sub(r"\s+", " ", sentence).strip()

        if len(sentence.split()) >= 4:
            cleaned.append(sentence)

    return cleaned


def _build_short_summary(sentences, ranked_indices):
    """
    Create a concise summary from the most important transcript sentences.
    """
    if not sentences:
        return ""

    important = [
        sentences[i]
        for i in ranked_indices[:2]
        if i < len(sentences)
    ]

    important = _clean_summary_sentences(important)

    if not important:
        return sentences[0]

    return " ".join(important)


def _build_detailed_summary(sentences, ranked_indices):
    """
    Create a fuller summary using up to five important transcript sentences.
    """
    if not sentences:
        return ""

    important = [
        sentences[i]
        for i in ranked_indices[:5]
        if i < len(sentences)
    ]

    important = _clean_summary_sentences(important)

    if not important:
        return " ".join(sentences[:5])

    return " ".join(important)


def _build_abstract(title, duration_fmt, short_summary, topics):
    """
    Create a clean abstract without inventing information
    that isn't present in the transcript.
    """
    if short_summary:
        return short_summary

    if topics:
        return (
            f"This recording discusses {', '.join(topics[:3])}."
        )

    return (
        f"This {duration_fmt} recording contains transcribed "
        f"content processed by ClipMind AI."
    )


def _extract_action_items(sentences):
    """
    Extract transcript sentences that appear to contain
    action items or next steps.
    """
    action_items = []

    cue_words = (
        "should",
        "need to",
        "must",
        "let's",
        "we will",
        "next step",
        "todo",
        "action",
        "plan to",
        "have to",
        "going to",
    )

    for sentence in sentences:
        low = sentence.lower()

        if any(cue in low for cue in cue_words):
            action_items.append(sentence)

        if len(action_items) >= 3:
            break

    if not action_items:
        action_items = [
            "Review the generated transcript for accuracy.",
            "Confirm the key moments align with the source recording.",
            "Archive this summary alongside the original media file.",
        ]

    return action_items


def build_summary(title: str, duration_fmt: str, full_text: str):
    """
    Generate all summary information for a processed recording.

    Output:
        shortSummary
        abstract
        detailedSummary
        bullets
        topics
        actionItems
        wordCount
        compression
    """

    full_text = re.sub(r"\s+", " ", full_text or "").strip()

    sentences = split_sentences(full_text)
    word_count = len(re.findall(r"\S+", full_text))

    if not sentences:
        return {
            "shortSummary": "No speech content was detected in this recording.",
            "abstract": "No speech content was detected in this recording.",
            "detailedSummary": "No transcript content was available to generate a detailed summary.",
            "bullets": ["No transcript content was available to summarize."],
            "topics": ["general"],
            "actionItems": [
                "Review the generated transcript for accuracy.",
                "Confirm the key moments align with the source recording.",
                "Archive this summary alongside the original media file.",
            ],
            "wordCount": 0,
            "compression": 0,
        }

    # Rank transcript sentences.
    top_idx = textrank_sentences(
        sentences,
        top_n=min(5, len(sentences))
    )

    bullets = [
        sentences[i]
        for i in top_idx
        if i < len(sentences)
    ]

    # Generate the three summary levels.
    short_summary = _build_short_summary(
        sentences,
        top_idx
    )

    detailed_summary = _build_detailed_summary(
        sentences,
        top_idx
    )

    keywords = extract_keywords(
        full_text,
        top_n=6
    )

    topics = [
        k["term"]
        for k in keywords[:5]
    ] or ["general"]

    abstract = _build_abstract(
        title,
        duration_fmt,
        short_summary,
        topics
    )

    action_items = _extract_action_items(
        sentences
    )

    bullet_words = len(
        re.findall(
            r"\S+",
            " ".join(bullets)
        )
    ) if bullets else 0

    compression = round(
        (1 - (bullet_words / max(1, word_count))) * 100
    )

    return {
        "shortSummary": short_summary,
        "abstract": abstract,
        "detailedSummary": detailed_summary,
        "bullets": bullets if bullets else [
            "No transcript content was available to summarize."
        ],
        "topics": topics,
        "actionItems": action_items,
        "wordCount": word_count,
        "compression": max(
            0,
            min(99, compression)
        ),
    }