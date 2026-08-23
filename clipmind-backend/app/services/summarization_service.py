from transformers import pipeline


summarizer = pipeline(
    "summarization",
    model="t5-small"
)


def generate_short_summary(transcript: str):

    summary = summarizer(
        "summarize: " + transcript,
        max_length=120,
        min_length=40,
        do_sample=False
    )

    return summary[0]["summary_text"]


def generate_detailed_summary(transcript: str):

    summary = summarizer(
        "summarize: " + transcript,
        max_length=250,
        min_length=120,
        do_sample=False
    )

    return summary[0]["summary_text"]


def generate_educational_summary(transcript: str):

    educational_prompt = (
        "summarize the following lecture as educational study material. "
        "Focus on the main topic, key concepts, important points, "
        "and useful learning takeaways. "
        "Keep the explanation clear and suitable for students. "
        "Do not introduce information that is not present in the lecture. "
        "\n\n"
        + transcript
    )

    summary = summarizer(
        educational_prompt,
        max_length=250,
        min_length=100,
        do_sample=False
    )

    return summary[0]["summary_text"]

def generate_learning_material(transcript: str):
    """
    Generate structured learning material from a transcript.

    Returns:
        dict containing:
        - overview
        - key_learning_points
        - study_notes
    """

    if not transcript or not transcript.strip():
        raise ValueError("Transcript cannot be empty.")

    # ---------------------------------------------------------
    # Overview
    # ---------------------------------------------------------

    overview_result = summarizer(
        "summarize: " + transcript,
        max_length=100,
        min_length=40,
        do_sample=False
    )

    overview = overview_result[0]["summary_text"]

    # ---------------------------------------------------------
    # Study Notes
    # ---------------------------------------------------------

    notes_result = summarizer(
        "summarize: " + transcript,
        max_length=220,
        min_length=100,
        do_sample=False
    )

    study_notes = notes_result[0]["summary_text"]

    # ---------------------------------------------------------
    # Key Learning Points
    # ---------------------------------------------------------

    sentences = [
        sentence.strip()
        for sentence in transcript.replace("\n", " ").split(".")
        if sentence.strip()
    ]

    # Take meaningful transcript sentences as learning points.
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