def detect_key_moments(transcript):
    """
    Detect simple key moments from transcript.
    """

    if not transcript:
        return []

    sentences = transcript.split(".")

    key_moments = []

    for i, sentence in enumerate(sentences[:5]):
        sentence = sentence.strip()
        if sentence:
            key_moments.append({
                "timestamp": f"00:{i*2:02d}:00",
                "text": sentence
            })

    return key_moments