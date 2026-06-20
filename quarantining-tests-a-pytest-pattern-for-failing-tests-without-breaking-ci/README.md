# Test Quarantine Demo

A minimal, runnable example of the quarantine pattern: a custom pytest marker,
a conftest hook that makes quarantined failures non-blocking, and a script
that catches quarantines past their expiry date.

## Setup

    pip install -r requirements.txt

## 1. Run the test suite

    pytest -v

Expected output:
- `test_normal_passing` -> PASSED
- `test_quarantined_failing` -> XFAIL (does not break the build)
- `test_quarantined_unexpectedly_passing` -> XPASS (does not break the build)
- `test_quarantined_expired` -> XPASS (still runs fine; this one is checked below)

The whole suite exits with status 0, even though one quarantined test is
actually failing under the hood.

## 2. Check for expired quarantines

    python check_quarantine_expiry.py

This scans the same tests for any `quarantine` marker whose `expires` date is
in the past. `test_quarantined_expired` is intentionally set to expire in
2020, so this script will exit with status 1 and print it out.

## Files

- `pytest.ini` - registers the custom `quarantine` marker
- `conftest.py` - converts quarantined tests to xfail at collection time
- `test_quarantine_demo.py` - example tests: normal, quarantined, and expired
- `check_quarantine_expiry.py` - standalone script that fails on expired quarantines
