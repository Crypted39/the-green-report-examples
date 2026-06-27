"""
Regression tests for dst_example.py

These tests demonstrate the core DST workflow described in the companion
blog post: once a seed has revealed a failure, lock it in as a permanent
test so the behavior can never silently regress.

Run with:

    pytest test_dst_example.py -v
"""

import pytest

from dst_example import run_simulation


def test_seed_16_is_a_known_regression():
    """Seed 16 was found failing during the seed sweep in the blog post.

    This is the entire point of DST: instead of writing a hand-crafted
    test that tries to recreate this exact failure, the seed itself
    *is* the test. If a future change to FlakyService, VirtualClock, or
    the retry logic makes this seed pass instead, that's a behavior
    change worth noticing.
    """
    assert run_simulation(16) == "failed"


def test_determinism():
    """Running the same seed twice must produce the exact same outcome.
    This is the premise the rest of DST is built on.
    """
    assert run_simulation(42) == run_simulation(42)


@pytest.mark.parametrize("seed", range(20))
def test_seed_sweep_matches_known_outcomes(seed):
    """Pins the full 0-19 sweep shown in the blog post as a single source
    of truth, so any change that shifts these outcomes gets caught
    immediately rather than discovered later by chance.
    """
    known_failures = {16, 18}
    expected = "failed" if seed in known_failures else "success"
    assert run_simulation(seed) == expected
