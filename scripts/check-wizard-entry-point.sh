#!/usr/bin/env bash
# check-wizard-entry-point.sh
#
# Policy: the production wizard routes must use the canonical V8 shell.
# Catches regressions where /wizard drifts back to legacy V6/V7/vNext shells,
# or duplicate WizardV8Page/useWizardV8 files are introduced outside the
# canonical src/wizard/v8 directory.
#
# Run: npm run check:wizard  (add to package.json scripts)
# Or:  bash scripts/check-wizard-entry-point.sh

set -euo pipefail

CANONICAL="src/wizard/v8/WizardV8Page.tsx"
CANONICAL_HOOK="src/wizard/v8/useWizardV8.ts"
APP_ENTRY="src/App.tsx"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

# 1. Canonical files must exist
if [ ! -f "$CANONICAL" ]; then
  echo -e "${RED}FAIL: Canonical entry point missing: $CANONICAL${NC}"
  errors=$((errors + 1))
fi

if [ ! -f "$CANONICAL_HOOK" ]; then
  echo -e "${RED}FAIL: Canonical V8 hook missing: $CANONICAL_HOOK${NC}"
  errors=$((errors + 1))
fi

if [ ! -f "$APP_ENTRY" ]; then
  echo -e "${RED}FAIL: App entry missing: $APP_ENTRY${NC}"
  errors=$((errors + 1))
fi

# 2. Exactly one non-archived WizardV8Page file should exist
v8_pages=$(find src -name "WizardV8Page.tsx" -not -path "*/_archive*" -not -path "*/_deprecated*" 2>/dev/null || true)
v8_page_count=$(printf "%s\n" "$v8_pages" | sed '/^$/d' | wc -l | tr -d ' ')
if [ "$v8_page_count" != "1" ] || [ "$v8_pages" != "$CANONICAL" ]; then
  echo -e "${RED}FAIL: Expected exactly one canonical WizardV8Page at $CANONICAL:${NC}"
  echo "$v8_pages"
  errors=$((errors + 1))
fi

# 3. Exactly one non-archived V8 hook should exist
v8_hooks=$(find src -name "useWizardV8.ts" -not -path "*/_archive*" -not -path "*/_deprecated*" 2>/dev/null || true)
v8_hook_count=$(printf "%s\n" "$v8_hooks" | sed '/^$/d' | wc -l | tr -d ' ')
if [ "$v8_hook_count" != "1" ] || [ "$v8_hooks" != "$CANONICAL_HOOK" ]; then
  echo -e "${RED}FAIL: Expected exactly one canonical useWizardV8 hook at $CANONICAL_HOOK:${NC}"
  echo "$v8_hooks"
  errors=$((errors + 1))
fi

# 4. App entry must import and route production wizard paths to V8
if ! grep -q 'import("./wizard/v8/WizardV8Page")' "$APP_ENTRY"; then
  echo -e "${RED}FAIL: $APP_ENTRY does not lazy-import canonical WizardV8Page${NC}"
  errors=$((errors + 1))
fi

if ! grep -q 'pathname === "/wizard"' "$APP_ENTRY"; then
  echo -e "${RED}FAIL: $APP_ENTRY does not define a /wizard route${NC}"
  errors=$((errors + 1))
fi

if ! grep -q 'pathname === "/wizard-v8"' "$APP_ENTRY"; then
  echo -e "${RED}FAIL: $APP_ENTRY does not define a /wizard-v8 route${NC}"
  errors=$((errors + 1))
fi

bad_wizard_routes=$(grep -n 'pathname === "/wizard"' -A6 "$APP_ENTRY" | grep -E 'WizardV6|WizardV7|WizardVNext' || true)
if [ -n "$bad_wizard_routes" ]; then
  echo -e "${RED}FAIL: /wizard route points at a legacy wizard:${NC}"
  echo "$bad_wizard_routes"
  errors=$((errors + 1))
fi

# 5. No direct imports from removed/orphaned V8 locations
bad_imports=$(grep -rn "from.*pages/WizardV8Page\|import.*pages/WizardV8Page" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "_archive" || true)
if [ -n "$bad_imports" ]; then
  echo -e "${RED}FAIL: Import from orphaned WizardV8Page path:${NC}"
  echo "$bad_imports"
  errors=$((errors + 1))
fi

# Results
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✓ Wizard entry point policy: PASS${NC}"
  echo "  Canonical: $CANONICAL"
  echo "  Hook: $CANONICAL_HOOK"
  echo "  Production /wizard routes use V8"
  echo "  No duplicate V8 shells/hooks"
  exit 0
else
  echo -e "${RED}✗ Wizard entry point policy: $errors VIOLATION(S)${NC}"
  exit 1
fi
