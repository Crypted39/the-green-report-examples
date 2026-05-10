#!/bin/bash
# qa_gate.sh
# Claude Code hook that enforces QA test conventions on every file edit.
# Checks for: hardcoded waits, forbidden selectors, and missing assertions.
#
# Usage: called automatically by Claude Code via .claude/settings.json
#        Can also be run manually: bash .claude/hooks/qa_gate.sh <file_path>

FILE=$1
VIOLATIONS=0

# Only check Python test files and page objects
if [[ ! "$FILE" == tests/*.py ]] && [[ ! "$FILE" == pages/*.py ]]; then
  exit 0
fi

echo "Running QA gate checks on $FILE..."

# -------------------------------------------------------
# Check 1: Hardcoded waits
# -------------------------------------------------------
if grep -nE "time\.sleep\(|waitForTimeout\(|Thread\.sleep\(" "$FILE"; then
  echo ""
  echo "FAILED [Hardcoded Wait]: Replace with an explicit wait condition."
  echo "  Playwright: page.wait_for_selector(), expect(locator).to_be_visible()"
  echo "  Selenium:   WebDriverWait(driver, timeout).until(...)"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# -------------------------------------------------------
# Check 2: Forbidden selectors
# -------------------------------------------------------
if grep -nE "By\.XPATH|find_element\(By\.ID|find_element\(By\.CLASS_NAME|css=\'" "$FILE"; then
  echo ""
  echo "FAILED [Forbidden Selector]: Use data-testid attributes only."
  echo "  Correct:   page.locator(\"[data-testid='submit-btn']\")"
  echo "  Forbidden: By.XPATH, By.ID, By.CLASS_NAME, css selectors"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

# -------------------------------------------------------
# Check 3: Missing assertions (test files only)
# -------------------------------------------------------
if [[ "$FILE" == tests/*.py ]]; then
  if grep -qE "def test_" "$FILE"; then
    ASSERTION_COUNT=$(grep -cE "assert |expect\(|should\.|to_be_|to_have_|to_contain_" "$FILE")
    TEST_COUNT=$(grep -cE "def test_" "$FILE")

    if [ "$ASSERTION_COUNT" -eq 0 ]; then
      echo ""
      echo "FAILED [Missing Assertions]: Every test must verify at least one outcome."
      echo "  Example: assert page.url.endswith('/dashboard')"
      echo "  Example: expect(page.locator(\"[data-testid='msg']\")).to_be_visible()"
      VIOLATIONS=$((VIOLATIONS + 1))
    elif [ "$TEST_COUNT" -gt "$ASSERTION_COUNT" ]; then
      echo ""
      echo "WARNING [Assertion Coverage]: $TEST_COUNT tests but only $ASSERTION_COUNT assertions found."
      echo "Some tests may be missing meaningful verifications."
    fi
  fi
fi

# -------------------------------------------------------
# Summary
# -------------------------------------------------------
if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo "QA gate failed with $VIOLATIONS violation(s) in $FILE"
  echo "Claude Code will attempt to fix the issues above before continuing."
  exit 1
fi

echo "QA gate passed."
exit 0
