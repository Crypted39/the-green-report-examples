# Semantic snapshot testing example

A small pytest matcher that compares an LLM response with an approved snapshot by meaning instead of by characters. It is the companion code for The Green Report article "Semantic Snapshot Testing: Stop Breaking Builds When the Model Rephrases".

Tested with Python 3.13, pytest 9.0 and sentence-transformers 5.1. The embedding model runs locally, so there is no API key and no cost per run. The first run downloads the `all-MiniLM-L6-v2` model (about 90 MB) and caches it.

```
pip install -r requirements.txt
pytest -v
python calibrate.py
```

## What the matcher checks

A response passes only if both checks pass:

1. **Meaning.** The cosine similarity between the stored embedding and the new response's embedding is at or above the threshold.
2. **Facts.** Every number in the snapshot (counts, times, prices, percentages) appears in the new response the same number of times, and the new response adds none.

The second check exists because the first one cannot do it alone. In the calibration data, a response with a changed number scores between 0.935 and 0.998 against its snapshot, higher than most harmless rewordings, so no similarity threshold separates the two.

## Files

| File | Purpose |
|------|---------|
| `semantic_snapshot.py` | Embedding, cosine similarity, fact extraction and the `SemanticSnapshot` class |
| `conftest.py` | The `semantic_snapshot` fixture and the `--update-snapshots` option |
| `test_shipping_assistant.py` | Example tests: a reworded answer passes, wrong answers fail |
| `calibrate.py` | Scores labeled pairs and sweeps the threshold |
| `data/labeled_pairs.json` | 29 labeled pairs: paraphrases, number changes, word changes and unrelated answers |
| `snapshots/shipping_policy.json` | The approved response, its embedding and the model that produced it |

## Snapshot workflow

- The first run records a missing snapshot and passes. If the `CI` environment variable is set, a missing snapshot fails instead, so a pipeline never records one silently.
- `pytest --update-snapshots` re-records every snapshot with the response the test received. Use it only when a change is deliberate.
- Each snapshot stores the model name. If the matcher's model changes, the test fails with a message to re-record, because scores from different models cannot be compared.
- A failing test prints which check failed, the stored response and the received one.

## Choosing the threshold

`python calibrate.py` scores every labeled pair, sweeps the threshold from 0.50 to 0.95, and prints how many harmless paraphrases would fail and how many regressions of each kind would be caught. With this model and data, the lowest paraphrase scores 0.788, so the default is 0.74 (that score minus a margin of 0.05). The commonly guessed 0.80 already fails 1 of 10 paraphrases, and 0.85 fails 4.

The threshold belongs to the model and the data. If you change the embedding model, or your responses look different from a support assistant's, replace `data/labeled_pairs.json` with pairs from your own application and run the script again.

## Known limits

- **Negations and swapped words.** "Does not take 3 to 5 days" keeps the topic and every number, so both checks pass. In the labeled data, only 1 of 6 word changes is caught. `test_negated_answer_fails` is marked `xfail` to document this. A model-graded check is the usual next step for these.
- **Number formatting.** The fact check compares tokens exactly. "Three to five days" against a snapshot that says "3 to 5" reports both numbers missing and fails a harmless answer, and so do "2:00 PM" against "2 PM", "14:00" against "2 PM" and "1000" against "1,000". If the snapshot spells numbers out, a change such as "five to seven" is not detected. Normalize numbers before extracting them, or tell the model to always write digits.
- **Long responses.** `all-MiniLM-L6-v2` reads at most 256 tokens. A change after that point is invisible to the meaning check (the similarity stays at 1.000), so keep snapshotted text short or split long answers into chunks.
- **Small data set.** 10 paraphrases is enough to show the method, not enough to trust a threshold in production.

## Using it with a real model

`ask_assistant()` in `test_shipping_assistant.py` returns a fixed string so the example runs offline. Replace its body with the call your application makes, and keep the rest of the test as it is.
