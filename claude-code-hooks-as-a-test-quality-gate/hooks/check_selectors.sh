#!/bin/bash
# check_selectors.sh
# Standalone hook that enforces the data-testid selector strategy.
# Use this if you prefer individual hooks over the combined qa_gate.sh.
#
# Usage: called automatically by Claude Code via .claude/settings.json
#        Can also be run manually: bash .claude/hooks/check_selectors.sh <file_path>

FILE=$1
VIOLATIONS=0

# Only check Python test files and page objects
if [[ ! "$FILE" == tests/*.py ]] && [[ ! "$FILE" == pages/*.py ]]; then
  exit 0
fi

# Check for forbidden selector patterns
if grep -nE "By\.XPATH|find_element\(By\.ID|find_element\(By\.CLASS_NAME|css=\'" "$FILE"; then
  echo ""
  echo "QA GATE FAILED: Forbidden selector pattern detected in $FILE"
  echo "Your framework only allows data-testid attributes:"
  echo "  Correct:   page.locator(\"[data-testid='submit-btn']\")"
  echo "  Forbidden: By.XPATH, By.ID, By.CLASS_NAME, css selectors"
  VIOLATIONS=1
fi

# Check that data-testid is being used where selectors appear
if grep -nE "locator\(|find_element\(" "$FILE" | grep -v "data-testid"; then
  echo ""
  echo "QA GATE WARNING: Selector found that may not use data-testid in $FILE"
  echo "Verify that all locators follow the data-testid convention."
  VIOLATIONS=1
fi

if [ $VIOLATIONS -ne 0 ]; then
  exit 1
fi

exit 0
