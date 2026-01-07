import pytest

from low_high_chance import classify_probability


def test_classify_probability_probability_input() -> None:
    assert classify_probability(0.7, threshold=0.6).label == "high"
    assert classify_probability(0.59, threshold=0.6).label == "low"


def test_classify_probability_percent_input() -> None:
    assert classify_probability(70, threshold=60).label == "high"
    assert classify_probability(59, threshold=60).label == "low"


def test_rejects_out_of_range() -> None:
    with pytest.raises(ValueError):
        classify_probability(-0.1)
    with pytest.raises(ValueError):
        classify_probability(101)
