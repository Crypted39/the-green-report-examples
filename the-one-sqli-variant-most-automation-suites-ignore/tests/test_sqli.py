"""
JSON-key SQL injection test suite

Run against the local lab app:
    python app.py &
    pytest test_sqli.py -v
"""

import time
import pytest
import requests

BASE_URL = "http://localhost:5000"
VULN_URL = f"{BASE_URL}/api/search"  # intentionally broken
SAFE_URL = f"{BASE_URL}/api/search/safe"  # fixed with allowlist

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

DB_ERROR_SIGNATURES = [
    "sql syntax",
    "unclosed quotation",
    "unterminated string",
    "ora-",
    "pg_query",
    "mysql_fetch",
    "sqlite3.operationalerror",
    "syntax error",
    "no such column",
    "no such table",
    "unrecognized token",
    "near",  # sqlite: "near "X": syntax error"
    "conversion failed",
    "invalid column name",
]


def has_sql_error(resp: requests.Response) -> bool:
    text = resp.text.lower()
    return any(sig in text for sig in DB_ERROR_SIGNATURES)


def post(url, body, timeout=8):
    return requests.post(url, json=body, timeout=timeout)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def wait_for_server():
    """Fail fast with a helpful message if the app isn't running."""
    import time
    for _ in range(10):
        try:
            requests.get(f"{BASE_URL}/health", timeout=1)
            return
        except Exception:
            time.sleep(0.5)
    pytest.exit(
        "\n\n  Could not reach the lab app.\n"
        "    Start it first:  python app.py\n",
        returncode=1,
    )


# ---------------------------------------------------------------------------
# Error-based injection (keys only)
# ---------------------------------------------------------------------------

ERROR_KEY_PAYLOADS = [
    ("single quote", "body'"),
    ("double quote", 'body"'),
    ("backtick", "body`"),
    ("paren close + comment", "body);--"),
    ("OR tautology", "body' OR '1'='1"),
    ("UNION probe", "body' UNION SELECT 1,2,3--"),
    ("comment strip", "body'--"),
    ("stacked semicolon", "body'; DROP TABLE messages;--"),
    ("SQLite version probe", "body' AND 1=(SELECT 1 FROM sqlite_master)--"),
]


class TestErrorBasedKeyInjection:
    """
    Any SQL error reflected in the response means the key was
    interpolated verbatim into the query.
    """

    @pytest.mark.parametrize("label,key", ERROR_KEY_PAYLOADS)
    def test_vulnerable_endpoint_leaks_error(self, label, key):
        """Confirm the vulnerable endpoint DOES expose SQL errors (demo only)."""
        resp = post(VULN_URL, {key: "anything"})
        # We expect the vulnerable endpoint to show errors — this documents the bug
        found = has_sql_error(resp)
        print(f"\n  [{label}] status={resp.status_code} sql_error={found}")
        # Not asserting failure here — we're documenting the vuln exists.
        # The important assertion is the safe endpoint below.

    @pytest.mark.parametrize("label,key", ERROR_KEY_PAYLOADS)
    def test_safe_endpoint_rejects_unknown_keys(self, label, key):
        """The fixed endpoint must return 400 and no SQL error for injected keys."""
        resp = post(SAFE_URL, {key: "anything"})

        assert resp.status_code == 400, (
            f"[{label}] Expected 400 for injected key '{key}', got {resp.status_code}.\n"
            f"Response: {resp.text[:300]}"
        )
        assert not has_sql_error(resp), (
            f"[{label}] SQL error leaked from safe endpoint with key '{key}'.\n"
            f"Response: {resp.text[:300]}"
        )


# ---------------------------------------------------------------------------
# Boolean-based blind injection
# ---------------------------------------------------------------------------

class TestBooleanBasedKeyInjection:
    """
    If true-condition vs false-condition responses differ in content or
    status, the key is being evaluated as SQL.
    """

    BOOLEAN_PAIRS = [
        ("SQLite boolean",
         "body' AND '1'='1",
         "body' AND '1'='2"),
        ("numeric tautology",
         "body' AND 1=1--",
         "body' AND 1=2--"),
    ]

    @pytest.mark.parametrize("label,true_key,false_key", BOOLEAN_PAIRS)
    def test_safe_endpoint_boolean_blind(self, label, true_key, false_key):
        resp_t = post(SAFE_URL, {true_key: "x"})
        resp_f = post(SAFE_URL, {false_key: "x"})

        # Both must be rejected identically (400)
        assert resp_t.status_code == 400, f"[{label}] TRUE key not rejected"
        assert resp_f.status_code == 400, f"[{label}] FALSE key not rejected"

        len_diff = abs(len(resp_t.text) - len(resp_f.text))
        assert len_diff < 50, (
            f"[{label}] Response sizes differ by {len_diff} chars for TRUE vs FALSE key "
            "— boolean-based SQLi may be possible on the safe endpoint."
        )

    @pytest.mark.parametrize("label,true_key,false_key", BOOLEAN_PAIRS)
    def test_vulnerable_endpoint_boolean_blind_demo(self, label, true_key, false_key):
        """Documents that the vulnerable endpoint responds differently to true/false."""
        resp_t = post(VULN_URL, {true_key: "x"})
        resp_f = post(VULN_URL, {false_key: "x"})
        len_diff = abs(len(resp_t.text) - len(resp_f.text))
        print(f"\n  [{label}] true={resp_t.status_code} false={resp_f.status_code} "
              f"len_diff={len_diff}")


# ---------------------------------------------------------------------------
# Time-based blind injection
# ---------------------------------------------------------------------------

TIME_PAYLOADS = [
    ("SQLite heavy query",
     "body' AND (SELECT COUNT(*) FROM sqlite_master m1, sqlite_master m2) > 0 AND '1'='1",
     5.0),  # threshold: allowlist rejection should be near-instant; 5s is generous
    # even on slow Windows machines. If it breaches this, SQL is executing.
]


class TestTimeBasedKeyInjection:
    """
    If the safe endpoint takes measurably longer with a time-delay payload
    injected as a key, the key is not being sanitised.
    """

    @pytest.mark.parametrize("label,key,min_delay", TIME_PAYLOADS)
    def test_safe_endpoint_no_delay(self, label, key, min_delay):
        t0 = time.monotonic()
        resp = post(SAFE_URL, {key: "test"}, timeout=10)
        elapsed = time.monotonic() - t0

        # Should be rejected fast (400), not executed
        assert resp.status_code == 400, (
            f"[{label}] Safe endpoint didn't reject time-based key. "
            f"Status: {resp.status_code}"
        )
        assert elapsed < min_delay, (
            f"[{label}] Safe endpoint took {elapsed:.2f}s — "
            "time-based SQLi may be executable via injected keys."
        )


# ---------------------------------------------------------------------------
# Allowlist coverage — good keys should still work
# ---------------------------------------------------------------------------

class TestAllowlistedKeysWork:
    """Regression: the fix must not break legitimate queries."""

    def test_known_good_key(self):
        resp = post(SAFE_URL, {"user_id": "1"})
        assert resp.status_code == 200, (
            f"Legitimate key 'user_id' was rejected. Response: {resp.text}"
        )
        data = resp.json()
        assert "results" in data

    def test_unknown_key_rejected(self):
        resp = post(SAFE_URL, {"totally_unknown_column": "x"})
        assert resp.status_code == 400

    def test_empty_body(self):
        resp = post(SAFE_URL, {})
        assert resp.status_code == 200
