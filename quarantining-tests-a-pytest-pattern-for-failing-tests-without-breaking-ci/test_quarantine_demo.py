import pytest


def test_normal_passing():
    """A regular, healthy test. Should pass normally."""
    assert 1 + 1 == 2


@pytest.mark.quarantine(
    reason="Flaky due to race condition in async setup",
    ticket="QA-482",
    expires="2099-01-01",
)
def test_quarantined_failing():
    """Quarantined test that fails. Should report as XFAIL, not FAIL."""
    assert False, "This test is known to be flaky"


@pytest.mark.quarantine(
    reason="Suspected fixed, kept in quarantine to confirm",
    ticket="QA-501",
    expires="2099-01-01",
)
def test_quarantined_unexpectedly_passing():
    """Quarantined test that passes. Should report as XPASS, not block the build."""
    assert 1 + 1 == 2


@pytest.mark.quarantine(
    reason="Test for expiry check demo, intentionally expired",
    ticket="QA-999",
    expires="2020-01-01",
)
def test_quarantined_expired():
    """Runs like any quarantined test. Its expiry date is in the past on purpose,
    so check_quarantine_expiry.py should flag it."""
    assert True
