from tests.conftest import auth_headers


def test_study_materials_404_without_transcript(client):
    res = client.get("/learn/999999999/study-materials")
    assert res.status_code == 404


def test_regenerate_requires_content_manager(client, learner_token):
    res = client.post("/learn/1/study-materials/generate", headers=auth_headers(learner_token))
    assert res.status_code in (403, 404)  # 403 for role check fires before the 404 not-found check


def test_update_requires_content_manager(client, learner_token):
    res = client.put(
        "/learn/1/study-materials",
        json={"flashcards": [], "fill_in_blanks": [], "mcqs": []},
        headers=auth_headers(learner_token),
    )
    assert res.status_code == 403


def test_save_and_read_back_edited_materials(client, creator_token):
    # PUT creates a saved record even without a prior generate call.
    payload = {
        "flashcards": [{"term": "Photosynthesis", "context": "Plants convert light into energy."}],
        "fill_in_blanks": [{"question": "Plants convert light into _____.", "answer": "energy"}],
        "mcqs": [{"question": "What do plants convert light into?", "options": ["Energy", "Rock", "Metal", "Water"], "answer": "Energy"}],
    }
    put_res = client.put("/learn/999888/study-materials", json=payload, headers=auth_headers(creator_token))
    assert put_res.status_code == 200
    assert put_res.json()["is_saved"] is True
    assert put_res.json()["flashcards"][0]["term"] == "Photosynthesis"

    get_res = client.get("/learn/999888/study-materials")
    assert get_res.status_code == 200
    assert get_res.json()["is_saved"] is True
    assert get_res.json()["mcqs"][0]["answer"] == "Energy"
