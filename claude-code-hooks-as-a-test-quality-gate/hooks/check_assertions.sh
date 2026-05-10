#!/bin/bash
# check_assertions.sh
# Standalone hook that verifies test files contain meaningful assertions.
# Use this if you prefer individual hooks over the combined qa_gate.sh.
#
# Usage: called automatically by Claude Code via .claude/settings.json
#        Can also be run manually: bash .claude/hooks/check_assertions.sh <file_path>

FILE=$1

# Only check test files
if [[ ! "$FILE" == tests/*.py ]]; then
  exit 0
fi

# Skip files that have no test functions
if ! grep -qE "def test_" "$FILE"; then
  exit 0
fi

# Count test functions and assertions
TEST_COUNT=$(grep -cE "def test_" "$FILE")
ASSERTION_COUNT=$(grep -cE "assert |expect\(|should\.|to_be_|to_have_|to_contain_" "$FILE")

if [ "$ASSERTION_COUNT" -eq 0 ]; then
  echo ""
  echo "QA GATE FAILED: No assertions found in $FILE"
  echo "Every test must verify at least one expected outcome."
  echo "Examples:"
  echo "  assert page.url.endswith('/dashboard')"
  echo "  expect(page.locator(\"[data-testid='success-msg']\")).to_be_visible()"
  exit 1
fi

# Warn if there are significantly more tests than assertions
if [ "$TEST_COUNT" -gt "$ASSERTION_COUNT" ]; then
  echo ""
  echo "QA GATE WARNING: $FILE has $TEST_COUNT test functions but only $ASSERTION_COUNT assertions."
  echo "Some tests may be missing meaningful verifications."
fi

exit 0
