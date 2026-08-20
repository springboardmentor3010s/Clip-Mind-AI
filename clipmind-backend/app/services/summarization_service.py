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

    summary = summarizer(
        transcript,
        max_length=180,
        min_length=50,
        do_sample=False
    )

    return summary[0]["summary_text"]