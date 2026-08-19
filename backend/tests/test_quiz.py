from app.services.quiz import generate_flashcards, generate_fill_in_blanks, generate_mcqs, generate_study_materials

SEGMENTS = [
    {"start_time": 0, "end_time": 5, "text": "Machine learning models require large amounts of data."},
    {"start_time": 5, "end_time": 10, "text": "Neural networks are inspired by the structure of the brain."},
    {"start_time": 10, "end_time": 15, "text": "Deep learning is a subset of machine learning techniques."},
]
KEYWORDS = ["learning", "machine", "data", "neural", "networks"]


def test_generate_flashcards_pulls_context_sentence():
    cards = generate_flashcards(SEGMENTS, KEYWORDS)
    assert len(cards) > 0
    assert cards[0]["term"] == "Learning"
    assert "learning" in cards[0]["context"].lower()


def test_generate_fill_in_blanks_masks_the_keyword():
    questions = generate_fill_in_blanks(SEGMENTS, KEYWORDS)
    assert len(questions) > 0
    for q in questions:
        assert "_____" in q["question"]
        assert q["answer"] in KEYWORDS
        # the answer word itself should no longer appear in the blanked question
        assert q["answer"].lower() not in q["question"].lower().replace("_____", "")


def test_generate_mcqs_includes_correct_answer_in_options():
    mcqs = generate_mcqs(SEGMENTS, KEYWORDS)
    assert len(mcqs) > 0
    for q in mcqs:
        assert q["answer"] in q["options"]
        assert len(q["options"]) <= 4
        assert len(set(q["options"])) == len(q["options"])  # no duplicate options


def test_generate_study_materials_returns_all_three_kinds():
    result = generate_study_materials(SEGMENTS, KEYWORDS)
    assert set(result.keys()) == {"flashcards", "fill_in_blanks", "mcqs"}


def test_empty_inputs_produce_no_materials():
    result = generate_study_materials([], [])
    assert result == {"flashcards": [], "fill_in_blanks": [], "mcqs": []}
