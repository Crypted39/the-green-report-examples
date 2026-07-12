"""
JSON Schema Conformance Harness
--------------------------------
Runs a fixed prompt against an LLM N times, validates each response against
a JSON Schema, and reports a conformance rate plus a failure breakdown.

Usage:
    export OPENAI_API_KEY=sk-...
    python conformance_check.py --runs 50 --min-rate 95
"""

import argparse
import json
import os
import sys
from collections import Counter

from jsonschema import validate, ValidationError
from openai import OpenAI

# ---------------------------------------------------------------------------
# 1. Define the schema you're actually testing against.
#    This is the contract your downstream system expects, not just "valid JSON".
# ---------------------------------------------------------------------------
SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "priority": {"type": "string", "enum": ["low", "medium", "high"]},
        "tags": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["name", "priority", "tags"],
    "additionalProperties": False,
}

PROMPT = (
    "Extract the task details as JSON: "
    "'Fix the login bug, it's urgent, tag it as backend and auth.'"
)

DEFAULT_MODEL = os.environ.get("CONFORMANCE_TEST_MODEL", "gpt-4o")


def get_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("Error: OPENAI_API_KEY environment variable is not set.")
    return OpenAI(api_key=api_key)


def build_system_prompt(schema: dict) -> str:
    """
    IMPORTANT: response_format={"type": "json_object"} only guarantees valid
    JSON syntax. It does not tell the model your field names, types, or enum
    values. Without this, the model will invent its own reasonable-looking
    keys (e.g. "task" instead of "name") and fail conformance 100% of the
    time, every time, which isn't the intermittent drift this harness is
    meant to catch. Embedding the schema in the prompt gives the model a
    fighting chance, so conformance failures become the occasional, harder
    to catch kind instead of a guaranteed miss.
    """
    return (
        "Respond with a single JSON object that matches this JSON Schema "
        "exactly. Use these exact field names, types, and enum values. Do "
        "not add extra fields.\n\n"
        f"{json.dumps(schema)}"
    )


# ---------------------------------------------------------------------------
# 2. Wrap a single model call in a function that validates its own output.
#    Invalid JSON and schema violations are tracked as distinct failure types.
# ---------------------------------------------------------------------------
def run_once(client: OpenAI, model: str = DEFAULT_MODEL, prompt: str = PROMPT,
             schema: dict = SCHEMA) -> dict:
    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": build_system_prompt(schema)},
            {"role": "user", "content": prompt},
        ],
    )
    raw = response.choices[0].message.content

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {"passed": False, "reason": "invalid_json", "raw": raw}

    try:
        validate(instance=parsed, schema=schema)
        return {"passed": True, "raw": raw}
    except ValidationError as e:
        return {"passed": False, "reason": e.message, "raw": raw}


# ---------------------------------------------------------------------------
# 3. Aggregate results into a conformance rate and a failure breakdown.
# ---------------------------------------------------------------------------
def summarize(results: list) -> dict:
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failures = [r["reason"] for r in results if not r["passed"]]
    failure_breakdown = Counter(failures)

    return {
        "total_runs": total,
        "conformance_rate": round(passed / total * 100, 1) if total else 0.0,
        "failure_breakdown": dict(failure_breakdown),
    }


def print_report(name: str, summary: dict) -> None:
    print(f"{name:<20} {summary['conformance_rate']}% conformant "
          f"({summary['total_runs']} runs)")
    if summary["failure_breakdown"]:
        print("  Failure breakdown:")
        for reason, count in summary["failure_breakdown"].items():
            print(f"    - {reason}: {count}")


# ---------------------------------------------------------------------------
# 4. CLI entry point: run N trials, report results, fail the build if the
#    conformance rate drops below the configured threshold.
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="JSON schema conformance harness")
    parser.add_argument("--runs", type=int, default=50,
                        help="Number of trials to run (default: 50)")
    parser.add_argument("--min-rate", type=float, default=95.0,
                        help="Minimum acceptable conformance rate (default: 95.0)")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL,
                        help=f"Model to test (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    client = get_client()

    print(f"Running {args.runs} trials against model '{args.model}'...\n")
    results = [run_once(client, model=args.model) for _ in range(args.runs)]
    summary = summarize(results)

    print_report("extract_task", summary)
    print()

    if summary["conformance_rate"] < args.min_rate:
        sys.exit(
            f"FAIL: conformance rate {summary['conformance_rate']}% is below "
            f"the {args.min_rate}% threshold."
        )

    print(f"PASS: conformance rate {summary['conformance_rate']}% meets the "
          f"{args.min_rate}% threshold.")


if __name__ == "__main__":
    main()
