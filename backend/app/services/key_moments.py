import re
from collections import Counter
from typing import List, Dict, Any

# Simple stop words list to avoid heavy NLTK dependency
STOP_WORDS = set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", 
    "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", 
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", 
    "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", 
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", 
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", 
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", 
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", 
    "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", 
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", 
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", 
    "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", 
    "you've", "your", "yours", "yourself", "yourselves", "so", "just", "like", "know", "going", "think", "really",
    # Contraction fragments — the keyword regex only matches letters, so "don't" splits into
    # "don" + "t" and the "t" gets dropped by the length filter, leaving "don" as a false keyword.
    "don", "isn", "wasn", "weren", "hadn", "hasn", "haven", "shouldn", "wouldn", "couldn",
    "aren", "won", "mustn", "shan", "didn", "doesn", "ain", "ll", "ve", "re",
])

def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """Extracts the most frequent non-stopword keywords from text."""
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    filtered_words = [w for w in words if w not in STOP_WORDS]
    counts = Counter(filtered_words)
    return [word for word, count in counts.most_common(top_n)]

def generate_title_from_text(text: str, max_keywords: int = 4) -> str:
    """Derives a short, human-readable title from a transcript using the same
    frequency-based keyword extraction as key moment detection — no extra model."""
    keywords = extract_keywords(text, top_n=max_keywords)
    return generate_title_from_keywords(keywords)

def generate_key_moments(segments: List[Dict[str, Any]], top_keywords: List[str], chunk_duration_sec: int = 300) -> List[Dict[str, Any]]:
    """
    Groups segments into chronological chapters (topic segmentation) rather than
    picking isolated "highlight" segments — this gives full timeline coverage
    (every part of the video gets a marker, not just keyword-dense spikes) and
    reads more like a table of contents than a highlight reel.
    """
    if not segments:
        return []

    ordered = sorted(segments, key=lambda s: s.get("start_time", 0))

    chapters: List[Dict[str, Any]] = []
    current = {
        "start_time": ordered[0].get("start_time", 0),
        "end_time": ordered[0].get("end_time", 0),
        "text_blocks": [ordered[0].get("text", "")],
    }

    for seg in ordered[1:]:
        start_time = seg.get("start_time", 0)
        end_time = seg.get("end_time", 0)
        text = seg.get("text", "")

        if start_time - current["start_time"] <= chunk_duration_sec:
            current["end_time"] = end_time
            current["text_blocks"].append(text)
        else:
            chapters.append(current)
            current = {"start_time": start_time, "end_time": end_time, "text_blocks": [text]}

    chapters.append(current)

    key_moments = []
    for chap in chapters:
        chapter_text = " ".join(chap["text_blocks"]).strip()

        chapter_keywords = extract_keywords(chapter_text, top_n=3)
        if not chapter_keywords:
            chapter_lower = chapter_text.lower()
            chapter_keywords = [kw for kw in top_keywords if kw in chapter_lower][:3]

        title = generate_title_from_keywords(chapter_keywords) or "General Discussion"
        description = chapter_text[:160].strip().capitalize()
        if len(chapter_text) > 160:
            description += "..."

        key_moments.append({
            "start_time": chap["start_time"],
            "end_time": chap["end_time"],
            "title": title,
            "description": description,
        })

    return key_moments

def generate_title_from_keywords(keywords: List[str]) -> str:
    """Formats a keyword list as a short, human-readable title, e.g. 'Empowerment, Authority & Permission'."""
    if not keywords:
        return ""
    capitalized = [kw.capitalize() for kw in keywords]
    if len(capitalized) == 1:
        return capitalized[0]
    return ", ".join(capitalized[:-1]) + " & " + capitalized[-1]

def process_video_key_moments(segments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Full pipeline for a video's transcript segments."""
    full_text = " ".join([seg.get("text", "") for seg in segments])
    keywords = extract_keywords(full_text, top_n=15)
    # Chunk into ~5 minute chapters so long videos get proportionally more markers.
    moments = generate_key_moments(segments, keywords, chunk_duration_sec=300)
    return {"keywords": keywords, "moments": moments}
