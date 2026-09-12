# WER gate for speech-to-text

Measures Word Error Rate (WER) and Character Error Rate (CER) of speech-to-text
output against reference transcripts, and fails if any case exceeds a threshold.

## Setup

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```
python wer_gate.py
```

Exit code is `1` if any case exceeds `WER_THRESHOLD`, so it can gate a CI job.

## Files

- `wer_gate.py` — normalization pipeline, scoring, and the pass/fail gate
- `test_cases.json` — reference transcripts paired with STT output (hypotheses)
- `requirements.txt` — `jiwer`
