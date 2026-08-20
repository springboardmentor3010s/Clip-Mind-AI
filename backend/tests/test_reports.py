import json

from app.services.report_service import _safe_json


def test_safe_json_with_valid_json():

    data = json.dumps([
        {
            "title": "Introduction"
        }
    ])

    result = _safe_json(data)

    assert isinstance(result, list)

    assert len(result) == 1

    assert result[0]["title"] == "Introduction"


def test_safe_json_with_empty_value():

    result = _safe_json("")

    assert result == []


def test_safe_json_with_none():

    result = _safe_json(None)

    assert result == []


def test_safe_json_with_invalid_json():

    result = _safe_json(
        "this is not valid json"
    )

    assert result == []