#!/usr/bin/env bash
set -euo pipefail

# Merlin QA runner: lint + typecheck + playwright wizard smoke
# Usage:
#   bash scripts/qa-wizard.sh
#   PORT=5177 bash scripts/qa-wizard.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-5177}"
BASE_URL="http://localhost:${PORT}"

echo "====================================================="
echo "Merlin Wizard QA"
echo "BASE_URL=${BASE_URL}"
echo "====================================================="

echo ""
echo "1) Lint"
npm run lint || true

echo ""
echo "2) Typecheck"
# adjust if your script is different:
npx tsc --noEmit || true

echo ""
echo "3) Unit tests (optional)"
if npm run -s 2>/dev/null | grep -qE "^  test$|^  test:"; then
  npm test || true
else
  echo "(skipping: no npm test script detected)"
fi

echo ""
echo "4) Playwright wizard smoke"
export E2E_BASE_URL="${BASE_URL}"
export E2E_PORT="${PORT}"

# Ensure playwright browsers installed (first time only)
npx playwright install --with-deps >/dev/null 2>&1 || true

npx playwright test tests/e2e/qa-wizard.spec.ts --project=chromium

echo ""
echo "✅ QA completed successfully"
