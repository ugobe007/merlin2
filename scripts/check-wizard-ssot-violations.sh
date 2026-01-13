#!/bin/bash
# ============================================================================
# Wizard V6 SSOT Violation Checker
# ============================================================================
# 
# This script checks for forbidden math calculations in WizardV6 files
# outside of Step5MagicFit.tsx (the only authorized compute moment).
#
# Usage:
#   ./scripts/check-wizard-ssot-violations.sh
#
# Exit codes:
#   0 = No violations found
#   1 = Violations found (CI should fail)
# ============================================================================

set -e

WIZARD_DIR="src/components/wizard/v6"
ALLOWLIST_FILE="$WIZARD_DIR/steps/Step5MagicFit.tsx"
VIOLATIONS=0

# Patterns that indicate SSOT violations (math calculations)
BLOCKLIST_PATTERNS=(
  "annualSavings\\s*="
  "paybackYears\\s*="
  "tenYearROI\\s*="
  "federalITC\\s*="
  "netInvestment\\s*="
  "calculateFinancial"
  "calculateBESS"
  "gridSynkBESSCalculator"
  "compareConfigFinancials"
  "estimateAnnualSavings"
  "calculateArbitrageSavings"
  "computeSavings"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Checking Wizard V6 for SSOT violations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Allowlist: $ALLOWLIST_FILE"
echo "Checking directory: $WIZARD_DIR"
echo ""

# Find all TypeScript files in wizard/v6 (excluding Step5MagicFit.tsx)
FILES=$(find "$WIZARD_DIR" -name "*.ts" -o -name "*.tsx" | grep -v "$ALLOWLIST_FILE")

for FILE in $FILES; do
  FILE_VIOLATIONS=0
  
  for PATTERN in "${BLOCKLIST_PATTERNS[@]}"; do
    # Check if pattern exists in file
    if grep -qE "$PATTERN" "$FILE" 2>/dev/null; then
      # Check if it's a false positive (e.g., reading from state, not computing)
      # Allow: "const x = state.calculations.selected.annualSavings"
      # Block: "const annualSavings = someRate * someValue"
      if grep -E "$PATTERN" "$FILE" | grep -vE "(state\.|calculations\.|result\.|from|read)" > /dev/null; then
        if [ $FILE_VIOLATIONS -eq 0 ]; then
          echo "❌ VIOLATION in: $FILE"
          FILE_VIOLATIONS=1
          VIOLATIONS=$((VIOLATIONS + 1))
        fi
        echo "   Pattern: $PATTERN"
        grep -nE "$PATTERN" "$FILE" | grep -vE "(state\.|calculations\.|result\.|from|read)" | head -3 | sed 's/^/      /'
      fi
    fi
  done
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ No SSOT violations found!"
  exit 0
else
  echo "❌ Found $VIOLATIONS file(s) with SSOT violations"
  echo ""
  echo "Fix: Move calculations to Step5MagicFit.tsx or read from state.calculations.*"
  exit 1
fi
