#!/usr/bin/env bash
# check-wizard-entry-point.sh
#
# Policy: Exactly ONE WizardV7Page can export a React component.
# Catches the exact duplication that caused the Feb 2026 regression:
#   - Duplicate stepCanProceed() in multiple files
#   - Duplicate getPhase() in multiple files
#   - Multiple default-exported WizardV7Page components
#
# Run: npm run check:wizard  (add to package.json scripts)
# Or:  bash scripts/check-wizard-entry-point.sh

set -euo pipefail

CANONICAL="src/pages/WizardV7Page.tsx"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

# 1. Canonical file must exist
if [ ! -f "$CANONICAL" ]; then
  echo -e "${RED}FAIL: Canonical entry point missing: $CANONICAL${NC}"
  errors=$((errors + 1))
fi

# 2. No stepCanProceed in any WizardV7Page file (it belongs in useWizardV7.ts only)
dupes=$(grep -rn "function stepCanProceed\|function getPhase" src/**/WizardV7Page*.tsx 2>/dev/null | grep -v "_archive" || true)
if [ -n "$dupes" ]; then
  echo -e "${RED}FAIL: Duplicate gate logic found in WizardV7Page files:${NC}"
  echo "$dupes"
  errors=$((errors + 1))
fi

# 3. No non-archived WizardV7Page.tsx outside src/pages/
rogue=$(find src -name "WizardV7Page.tsx" -not -path "*/pages/*" -not -path "*/_archive*" -not -path "*/_deprecated*" 2>/dev/null || true)
if [ -n "$rogue" ]; then
  echo -e "${RED}FAIL: Rogue WizardV7Page.tsx found outside src/pages/:${NC}"
  echo "$rogue"
  errors=$((errors + 1))
fi

# 4. No file should import from the orphaned location
bad_imports=$(grep -rn "from.*wizard/v7/WizardV7Page\|import.*wizard/v7/WizardV7Page" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "_archive" || true)
if [ -n "$bad_imports" ]; then
  echo -e "${RED}FAIL: Import from orphaned WizardV7Page path:${NC}"
  echo "$bad_imports"
  errors=$((errors + 1))
fi

# Results
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✓ Wizard entry point policy: PASS${NC}"
  echo "  Canonical: $CANONICAL"
  echo "  No duplicate gate logic"
  echo "  No rogue WizardV7Page files"
  exit 0
else
  echo -e "${RED}✗ Wizard entry point policy: $errors VIOLATION(S)${NC}"
  exit 1
fi
