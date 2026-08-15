from app.services.summarization_service import (
    generate_short_summary
)

text = """
Artificial Intelligence is changing the world.
Machine Learning is a branch of AI.
Deep Learning is a subset of Machine Learning.
It is widely used in healthcare,
finance, education and autonomous vehicles.
"""

summary = generate_short_summary(text)

print(summary)