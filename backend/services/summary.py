print("Summary service loaded")


def generate_summary(transcript):

    if not transcript or not transcript.strip():
        return "No transcript available."

    sentences = transcript.split(". ")

    selected = sentences[:5]

    bullets = []

    for sentence in selected:
        sentence = sentence.strip()

        if sentence:
            if not sentence.endswith("."):
                sentence += "."

            bullets.append("• " + sentence)

    return "\n\n".join(bullets)