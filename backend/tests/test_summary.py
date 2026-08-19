import pytest
from unittest.mock import patch, MagicMock
from app.services.summarization import generate_summary

@patch("app.services.summarization.summarizer")
def test_generate_summary_short(mock_summarizer):
    # Setup mock behavior
    mock_summarizer.return_value = [{"summary_text": "This is a mocked short summary."}]
    
    text = "A very long text that needs to be summarized into a shorter version."
    summary = generate_summary(text, detailed=False)
    
    assert summary == "This is a mocked short summary."
    # Assert it passed max_length = 50 for short summaries
    _, kwargs = mock_summarizer.call_args
    assert kwargs["max_length"] == 50
    assert kwargs["do_sample"] is False

@patch("app.services.summarization.summarizer")
def test_generate_summary_detailed(mock_summarizer):
    # Setup mock behavior
    mock_summarizer.return_value = [{"summary_text": "This is a mocked detailed summary containing more information."}]
    
    text = "A very long text that needs to be summarized into a more detailed version."
    summary = generate_summary(text, detailed=True)
    
    assert summary == "This is a mocked detailed summary containing more information."
    # Assert it passed max_length = 150 for detailed summaries
    _, kwargs = mock_summarizer.call_args
    assert kwargs["max_length"] == 150
    assert kwargs["do_sample"] is False

@patch("app.services.summarization.summarizer", new=None)
def test_generate_summary_fallback():
    # If summarizer is None (failed to load model), it should return a fallback message
    text = "Some text."
    summary = generate_summary(text)
    
    assert "Summary generation is currently unavailable" in summary
