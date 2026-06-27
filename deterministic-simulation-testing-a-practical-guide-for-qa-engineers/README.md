# Deterministic Simulation Testing: Companion Code

Companion code for the blog post *Deterministic Simulation Testing: A
Practical Guide for QA Engineers*. Builds a virtual clock, a seeded RNG,
and a simulated network in Python, then uses them to make a flaky
retry-with-backoff client fully reproducible from a seed.

## Files

- **`dst_example.py`** — the example itself: `VirtualClock`,
  `FlakyService`, `SimulatedNetwork`, and a retry client run through
  `run_simulation(seed)`. No dependencies beyond the standard library.
- **`test_dst_example.py`** — regression tests that pin known failing
  seeds (16 and 18), demonstrating the post's core practice: once a
  seed reveals a bug, it becomes a permanent test.
- **`requirements.txt`** — `pytest`, needed only to run the tests.

## Usage

Run the seed sweep directly:

```bash
python dst_example.py
```

Run the regression tests:

```bash
pip install -r requirements.txt
pytest test_dst_example.py -v
```
