from collections import Counter
import re

STOP_WORDS = {
    "the","is","are","was","were","a","an","of","to","and","in",
    "on","for","with","that","this","it","as","by","be","or","from",
    "at","we","our","you","your","they","their","he","she","his","her",
    "i","me","my","have","has","had","will","can","about","all","what",
    "when","where","which","who","why","how","into","out","up","down",
    "over","under","after","before","again","more","most","very",
    "just","only","also","there","here","their","them","then",
    "been","being","using","use","used","every","each","some","many",
    "new","see","look","looked","looking","around","things","thing"
}

def extract_keywords(text, top_n=10):
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())

    words = [
        word for word in words
        if word not in STOP_WORDS
    ]

    counts = Counter(words)

    return [word for word, _ in counts.most_common(top_n)]