#!/bin/bash
# check_hardcoded_waits.sh
# Standalone hook that detects hardcoded wait patterns in test files.
# Use this if you prefer individual hooks over the combined qa_gate.sh.
#
# Usage: called automatically by Claude Code via .claude/settings.json
#        Can also be run manually: bash .claude/hooks/check_hardcoded_waits.sh <file_path>

FILE=$1

# Only check Python test files
if [[ ! "$FILE" == tests/*.py ]]; then
  exit 0
fi

# Check for hardcoded wait patterns
if grep -nE "time\.sleep\(|waitForTimeout\(|Thread\.sleep\(" "$FILE"; then
  echo ""
  echo "QA GATE FAILED: Hardcoded wait detected in $FILE"
  echo "Replace with an explicit wait condition:"
  echo "  Playwright: page.wait_for_selector(), expect(locator).to_be_visible()"
  echo "  Selenium:   WebDriverWait(driver, timeout).until(...)"
  exit 1
fi

exit 0
