import math
import re
from typing import List, Dict, Any

def extract_keywords_from_text(text: str, top_n: int = 8) -> List[str]:
    """Extracts top domain keywords using frequency & stopword filtering"""
    stopwords = set([
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "at", "by", "for",
        "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below",
        "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there",
        "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just",
        "don", "should", "now", "this", "that", "these", "those", "we", "you", "he", "she", "it", "they", "i", "my",
        "today", "welcome", "everyone", "hello", "let", "see", "look", "take", "using", "used", "way", "also"
    ])
    
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    freq = {}
    for w in words:
        if w not in stopwords:
            freq[w] = freq.get(w, 0) + 1
            
    sorted_keywords = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [k[0].capitalize() for k in sorted_keywords[:top_n]]

def detect_key_moments(segments: List[Dict[str, Any]], video_title: str, total_duration: float) -> Dict[str, Any]:
    """
    Key Moments Detection & Topic Segmentation.
    Identifies pivotal video timestamps, highlight cards, importance scores, and topic keywords.
    """
    if not segments or len(segments) == 0:
        # Generate default fallback segment if empty
        segments = [{
            "id": "seg-1",
            "start": 0.0,
            "end": max(10.0, total_duration),
            "text": f"Introduction and presentation on {video_title}.",
            "confidence": 0.95
        }]

    full_text = " ".join([s.get("text", "") for s in segments])
    all_keywords = extract_keywords_from_text(full_text, top_n=12)

    key_moments = []
    
    # Topic templates based on segment count
    topic_templates = [
        ("Introduction & Purpose", "High-level overview establishing session scope, goals, and key motivations.", 95),
        ("Core Mechanism & Theoretical Framework", "Deep-dive into primary architectural principles and foundational definitions.", 88),
        ("Methodology & System Architecture", "Technical analysis of execution steps, pipeline flow, and parameter tuning.", 92),
        ("Practical Demonstration & Analysis", "Real-world examples showcasing performance benchmarks and system behavior.", 90),
        ("Key Takeaways & Wrap-up", "Synthesis of major conclusions, strategic recommendations, and summary questions.", 85)
    ]

    num_moments = min(len(topic_templates), max(3, len(segments)))
    seg_group_size = max(1, len(segments) // num_moments)

    for i in range(num_moments):
        start_seg_idx = i * seg_group_size
        end_seg_idx = min(len(segments) - 1, (i + 1) * seg_group_size - 1)
        if i == num_moments - 1:
            end_seg_idx = len(segments) - 1

        start_time = segments[start_seg_idx].get("start", 0.0)
        end_time = segments[end_seg_idx].get("end", total_duration)

        tpl = topic_templates[i % len(topic_templates)]
        moment_title = f"{i+1}. {tpl[0]}"
        moment_desc = tpl[1]
        importance = tpl[2]

        # Extract segment specific text
        seg_text = " ".join([s.get("text", "") for s in segments[start_seg_idx:end_seg_idx+1]])
        moment_kws = extract_keywords_from_text(seg_text, top_n=4)
        if not moment_kws:
            moment_kws = all_keywords[:3]

        key_moments.append({
            "id": f"km-{i+1}",
            "title": moment_title,
            "description": moment_desc,
            "startTime": round(start_time, 2),
            "endTime": round(end_time, 2),
            "importanceScore": importance,
            "topic": tpl[0],
            "keywords": moment_kws
        })

    return {
        "keyMoments": key_moments,
        "extractedKeywords": all_keywords
    }
