"""Pick the similarity threshold from labeled pairs instead of guessing 0.8.

Every pair in data/labeled_pairs.json is a snapshot, a new response, and a label that says what
kind of change the new response represents. The script scores every pair, then sweeps the
threshold and reports two things at each step:

  * false failures: harmless paraphrases that would break the build
  * catch rate:     real regressions that would be caught, per kind

Run it with: python calibrate.py
"""

import json
from collections import defaultdict
from pathlib import Path
from statistics import mean

from semantic_snapshot import MODEL_NAME, cosine_similarity, embed, extract_facts

DATA = Path(__file__).parent / "data" / "labeled_pairs.json"
REGRESSION_KINDS = ["number_change", "word_change", "unrelated"]
MARGIN = 0.05


def score_pairs():
    scored = []
    for pair in json.loads(DATA.read_text(encoding="utf-8")):
        scored.append(
            {
                "kind": pair["kind"],
                "similarity": cosine_similarity(embed(pair["snapshot"]), embed(pair["response"])),
                "facts_ok": extract_facts(pair["snapshot"]) == extract_facts(pair["response"]),
            }
        )
    return scored


def by_kind(scored):
    groups = defaultdict(list)
    for item in scored:
        groups[item["kind"]].append(item)
    return groups


def print_score_ranges(groups):
    print(f"Similarity by kind of change ({MODEL_NAME})\n")
    print(f"{'kind':<15}{'pairs':>6}{'lowest':>9}{'average':>9}{'highest':>9}")
    for kind in ["paraphrase"] + REGRESSION_KINDS:
        scores = [item["similarity"] for item in groups[kind]]
        print(f"{kind:<15}{len(scores):>6}{min(scores):>9.3f}{mean(scores):>9.3f}{max(scores):>9.3f}")


def caught(item, threshold, use_facts):
    below = item["similarity"] < threshold
    return below or (use_facts and not item["facts_ok"])


def print_sweep(groups):
    paraphrases = groups["paraphrase"]
    print("\nThreshold sweep, similarity only\n")
    header = f"{'threshold':>9}{'false failures':>16}"
    for kind in REGRESSION_KINDS:
        header += f"{kind:>16}"
    print(header)
    for step in range(50, 100, 5):
        threshold = step / 100
        false_failures = sum(caught(p, threshold, False) for p in paraphrases)
        row = f"{threshold:>9.2f}{f'{false_failures}/{len(paraphrases)}':>16}"
        for kind in REGRESSION_KINDS:
            hits = sum(caught(i, threshold, False) for i in groups[kind])
            row += f"{f'{hits}/{len(groups[kind])}':>16}"
        print(row)


def recommend(groups):
    lowest_paraphrase = min(p["similarity"] for p in groups["paraphrase"])
    threshold = round(lowest_paraphrase - MARGIN, 2)
    print(
        f"\nLowest paraphrase score is {lowest_paraphrase:.3f}. "
        f"Recommended threshold: {threshold:.2f} (that score minus a margin of {MARGIN})."
    )
    print(f"\nAt {threshold:.2f}, regressions caught\n")
    print(f"{'kind':<15}{'similarity only':>17}{'plus fact check':>17}")
    for kind in REGRESSION_KINDS:
        pairs = groups[kind]
        only = sum(caught(i, threshold, False) for i in pairs)
        both = sum(caught(i, threshold, True) for i in pairs)
        print(f"{kind:<15}{f'{only}/{len(pairs)}':>17}{f'{both}/{len(pairs)}':>17}")
    false_failures = sum(caught(p, threshold, True) for p in groups["paraphrase"])
    print(f"\nParaphrases that would fail the build: {false_failures}/{len(groups['paraphrase'])}")
    return threshold


if __name__ == "__main__":
    groups = by_kind(score_pairs())
    print_score_ranges(groups)
    print_sweep(groups)
    recommend(groups)
