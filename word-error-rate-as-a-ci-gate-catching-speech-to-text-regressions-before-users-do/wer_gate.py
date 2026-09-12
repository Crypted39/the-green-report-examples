"""
WER regression gate for a speech-to-text model.

Compares STT output (hypothesis) against a human-verified reference
transcript for each test case, normalizes both sides so formatting
differences don't count as errors, and fails the run if any case
exceeds the WER threshold.

Usage:
    python wer_gate.py                # uses test_cases.json
    python wer_gate.py other.json     # any file with the same shape
"""

import json
import sys
from pathlib import Path

import jiwer

# Max acceptable word error rate per case. Tune this against a baseline
# run of your current model so the gate catches regressions, not noise.
WER_THRESHOLD = 0.15

# The transform pipeline decides what counts as an error.
# Order matters: contractions need their apostrophe, and hyphens need
# to become spaces before RemovePunctuation deletes them outright.
normalize = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.ExpandCommonEnglishContractions(),  # "hasn't" -> "has not"
    jiwer.SubstituteRegexes({r"-": " "}),     # "twenty-five" -> "twenty five"
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
    jiwer.ReduceToListOfListOfWords(),
])


def load_cases(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def evaluate(reference, hypothesis):
    """Return raw WER, normalized word-level output, and CER."""
    raw_wer = jiwer.wer(reference, hypothesis)
    words = jiwer.process_words(
        reference,
        hypothesis,
        reference_transform=normalize,
        hypothesis_transform=normalize,
    )
    cer = jiwer.cer(reference, hypothesis)
    return raw_wer, words, cer


def main():
    cases_file = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("test_cases.json")
    cases = load_cases(cases_file)

    failures = 0
    for case in cases:
        raw_wer, words, cer = evaluate(case["reference"], case["hypothesis"])
        passed = words.wer <= WER_THRESHOLD
        failures += not passed

        print(f"[{'PASS' if passed else 'FAIL'}] {case['id']}")
        print(f"  WER raw={raw_wer:.2f}  normalized={words.wer:.2f}  CER={cer:.2f}")
        print(f"  subs={words.substitutions}  dels={words.deletions}  ins={words.insertions}")
        if not passed:
            print(jiwer.visualize_alignment(words, show_measures=False))

    print(f"\n{len(cases) - failures}/{len(cases)} cases within WER <= {WER_THRESHOLD}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
