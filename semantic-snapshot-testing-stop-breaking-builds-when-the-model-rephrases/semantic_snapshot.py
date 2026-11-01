"""Semantic snapshots: compare what a response means, not how it is worded."""

import json
import os
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"

# Picked with calibrate.py: just below the lowest score of any known-good paraphrase.
DEFAULT_THRESHOLD = 0.74

# Numbers, times, prices and percentages: "3", "9:30", "$50", "15%".
FACT_PATTERN = re.compile(r"[$€£]?\d+(?:[.,:]\d+)*%?")

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed(text):
    """Return a unit-length embedding, so cosine similarity is a plain dot product."""
    return _get_model().encode(text, normalize_embeddings=True)


def cosine_similarity(a, b):
    return float(np.dot(a, b))


def extract_facts(text):
    """Count every number-like token. Counter equality ignores order and wording."""
    return Counter(FACT_PATTERN.findall(text))


@dataclass
class MatchResult:
    similarity: float
    threshold: float
    missing_facts: list = field(default_factory=list)
    unexpected_facts: list = field(default_factory=list)

    @property
    def meaning_ok(self):
        return self.similarity >= self.threshold

    @property
    def facts_ok(self):
        return not self.missing_facts and not self.unexpected_facts

    @property
    def passed(self):
        return self.meaning_ok and self.facts_ok


def compare(snapshot_text, snapshot_embedding, response, threshold=DEFAULT_THRESHOLD):
    """Score a new response against a stored one. Pure function, no file access."""
    expected = extract_facts(snapshot_text)
    actual = extract_facts(response)
    return MatchResult(
        similarity=cosine_similarity(np.asarray(snapshot_embedding), embed(response)),
        threshold=threshold,
        missing_facts=sorted((expected - actual).elements()),
        unexpected_facts=sorted((actual - expected).elements()),
    )


class SemanticSnapshot:
    """Stores one JSON file per snapshot: the approved text, its embedding and the model."""

    def __init__(self, directory, update=False, threshold=DEFAULT_THRESHOLD):
        self.directory = Path(directory)
        self.update = update
        self.threshold = threshold

    def _path(self, name):
        return self.directory / f"{name}.json"

    def _write(self, name, response):
        self.directory.mkdir(parents=True, exist_ok=True)
        payload = {
            "model": MODEL_NAME,
            "response": response,
            "embedding": [round(float(x), 6) for x in embed(response)],
        }
        self._path(name).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    def assert_matches(self, name, response, threshold=None):
        path = self._path(name)

        if self.update:
            self._write(name, response)
            return

        if not path.exists():
            # Like Jest's --ci flag: a CI run must never silently record a new snapshot.
            if os.environ.get("CI"):
                raise AssertionError(
                    f"No snapshot named '{name}' and CI is set. "
                    "Record it locally with --update-snapshots and commit it."
                )
            self._write(name, response)
            return

        stored = json.loads(path.read_text(encoding="utf-8"))
        if stored["model"] != MODEL_NAME:
            raise AssertionError(
                f"Snapshot '{name}' was embedded with {stored['model']}, but the matcher uses "
                f"{MODEL_NAME}. Scores from different models are not comparable. "
                "Re-record it with --update-snapshots."
            )

        result = compare(
            stored["response"], stored["embedding"], response, threshold or self.threshold
        )
        if not result.passed:
            raise AssertionError(self._explain(name, stored["response"], response, result))

    @staticmethod
    def _explain(name, expected, actual, result):
        lines = [f"Response no longer matches snapshot '{name}'."]
        if not result.meaning_ok:
            lines.append(
                f"  meaning: similarity {result.similarity:.3f} is below the "
                f"threshold of {result.threshold:.2f}"
            )
        if not result.facts_ok:
            lines.append(
                f"  facts:   missing {result.missing_facts}, unexpected {result.unexpected_facts}"
            )
        lines.append(f"  snapshot: {expected}")
        lines.append(f"  received: {actual}")
        return "\n".join(lines)
