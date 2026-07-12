"""
Offline tests for the harness logic (summarize, print_report).
These don't hit the API, so they're safe to run without OPENAI_API_KEY
and are useful for confirming the harness itself works before you point
it at a real model.

Usage:
    python -m pytest test_conformance_check.py -v
"""

from conformance_check import summarize


def test_summarize_all_pass():
    results = [{"passed": True, "raw": "{}"} for _ in range(10)]
    summary = summarize(results)
    assert summary["total_runs"] == 10
    assert summary["conformance_rate"] == 100.0
    assert summary["failure_breakdown"] == {}


def test_summarize_mixed_results():
    results = (
            [{"passed": True, "raw": "{}"} for _ in range(8)]
            + [{"passed": False, "reason": "invalid_json", "raw": "not json"}]
            + [{"passed": False, "reason": "'priority' is a required property", "raw": "{}"}]
    )
    summary = summarize(results)
    assert summary["total_runs"] == 10
    assert summary["conformance_rate"] == 80.0
    assert summary["failure_breakdown"] == {
        "invalid_json": 1,
        "'priority' is a required property": 1,
    }


def test_summarize_empty_results():
    summary = summarize([])
    assert summary["total_runs"] == 0
    assert summary["conformance_rate"] == 0.0
    assert summary["failure_breakdown"] == {}


def test_summarize_groups_duplicate_failure_reasons():
    results = [
        {"passed": False, "reason": "invalid_json", "raw": "x"},
        {"passed": False, "reason": "invalid_json", "raw": "y"},
        {"passed": True, "raw": "{}"},
    ]
    summary = summarize(results)
    assert summary["failure_breakdown"] == {"invalid_json": 2}
    assert summary["conformance_rate"] == round(1 / 3 * 100, 1)


if __name__ == "__main__":
    # Allow running as a plain script too, without pytest.
    test_summarize_all_pass()
    test_summarize_mixed_results()
    test_summarize_empty_results()
    test_summarize_groups_duplicate_failure_reasons()
    print("All offline tests passed.")
