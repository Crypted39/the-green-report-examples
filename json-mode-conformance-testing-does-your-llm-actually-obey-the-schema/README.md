# JSON Schema Conformance Harness

A small test harness for a question most LLM test suites skip: not "is the
answer right?" but "does the output actually conform to the schema, every
single time?"

It runs a fixed prompt against a model N times, validates each response
against a JSON Schema, and reports a conformance rate plus a breakdown of
failure types (invalid JSON, missing fields, wrong types, bad enum values,
etc).

## Setup

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
```

## Run the offline tests first

These confirm the harness logic itself works, without spending any API
calls:

```bash
python -m pytest test_conformance_check.py -v
```

## Run a live conformance check

```bash
python conformance_check.py --runs 50 --min-rate 95
```

Example output:

```
Running 50 trials against model 'gpt-4o'...

extract_task         94.0% conformant (50 runs)
  Failure breakdown:
    - 'priority' is a required property: 2
    - 'High' is not one of ['low', 'medium', 'high']: 1

FAIL: conformance rate 94.0% is below the 95.0% threshold.
```

The script exits non-zero when the conformance rate drops below
`--min-rate`, so it plugs straight into CI as a pass/fail gate.

### Options

| Flag         | Default | Description                                  |
|--------------|---------|-----------------------------------------------|
| `--runs`     | 50      | Number of trials to run                       |
| `--min-rate` | 95.0    | Minimum acceptable conformance rate (percent)  |
| `--model`    | gpt-4o  | Model to test                                  |

## Adapting it to your own schema

Edit `SCHEMA` and `PROMPT` at the top of `conformance_check.py`. Everything
else (the run loop, the summarizer, the CLI) works unchanged for any JSON
Schema. If you'd rather validate with Pydantic or a TypeScript stack with
Zod, swap out the `validate(...)` call in `run_once` for your validator of
choice; the pass/fail/reason contract stays the same.

## CI

`.github/workflows/conformance.yml` runs the offline tests plus a live
50-run check every night at 06:00 UTC, and can also be triggered manually
from the Actions tab. Add `OPENAI_API_KEY` as a repository secret for it to
work.

## Why this matters

"JSON mode" guarantees syntactically valid JSON. It does not guarantee the
output matches your schema. Required fields still go missing, types still
get swapped, enums still drift, and none of that breaks `JSON.parse()`. This
harness turns "seems to work" into a number you can track, gate on, and
catch regressions against, the same way you'd treat any other SLA.
