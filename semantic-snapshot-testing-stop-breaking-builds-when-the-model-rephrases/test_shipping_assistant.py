from pathlib import Path

import pytest

from semantic_snapshot import SemanticSnapshot, compare, embed

SNAPSHOTS = Path(__file__).parent / "snapshots"

# The response approved when the snapshot was recorded.
APPROVED = "Standard shipping takes 3 to 5 business days. Orders placed before 2 PM ship the same day."

# What the assistant says today: same facts, different words.
TODAY = "Orders usually arrive within 3 to 5 business days, and anything placed before 2 PM goes out the same day."

WRONG_WINDOW = "Standard shipping takes 5 to 7 business days. Orders placed before 2 PM ship the same day."
WRONG_CUTOFF = "Standard shipping takes 3 to 5 business days. Orders placed before 5 PM ship the same day."
UNRELATED = "I am sorry, I cannot help with that request."
NEGATED = "Standard shipping does not take 3 to 5 business days. Orders placed before 2 PM do not ship the same day."


def ask_assistant(question):
    """Stand-in for the LLM call in your application. Swap in the real client here."""
    return TODAY


@pytest.fixture
def checker():
    """A matcher that never re-records, so the regression tests below stay deliberate."""
    return SemanticSnapshot(SNAPSHOTS)


def test_shipping_answer_still_matches_snapshot(semantic_snapshot):
    answer = ask_assistant("How long does shipping take?")
    semantic_snapshot.assert_matches("shipping_policy", answer)


def test_changed_delivery_window_fails(checker):
    with pytest.raises(AssertionError, match="facts:"):
        checker.assert_matches("shipping_policy", WRONG_WINDOW)


def test_changed_cutoff_time_fails(checker):
    with pytest.raises(AssertionError, match="facts:"):
        checker.assert_matches("shipping_policy", WRONG_CUTOFF)


def test_unrelated_answer_fails(checker):
    with pytest.raises(AssertionError, match="meaning:"):
        checker.assert_matches("shipping_policy", UNRELATED)


def test_similarity_alone_cannot_tell_rewording_from_a_wrong_number():
    """The reason the matcher checks facts as well as meaning."""
    snapshot = embed(APPROVED)
    reworded = compare(APPROVED, snapshot, TODAY)
    wrong_number = compare(APPROVED, snapshot, WRONG_WINDOW)

    assert wrong_number.similarity > reworded.similarity
    assert wrong_number.meaning_ok and not wrong_number.facts_ok


@pytest.mark.xfail(
    strict=True,
    reason="Known gap: a negation keeps the same topic and the same numbers, so both checks pass.",
)
def test_negated_answer_fails(checker):
    with pytest.raises(AssertionError):
        checker.assert_matches("shipping_policy", NEGATED)
