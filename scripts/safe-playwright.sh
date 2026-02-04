#!/usr/bin/env bash
# ============================================================================
# SAFE PLAYWRIGHT RUNNER (Feb 1, 2026)
# ============================================================================
# Wraps Playwright with a hard timeout to prevent infinite hangs.
#
# Usage:
#   ./scripts/safe-playwright.sh tests/e2e/my-test.spec.ts
#   ./scripts/safe-playwright.sh --timeout 300 tests/e2e/slow-test.spec.ts
#
# IMPORTANT: Start dev server manually FIRST:
#   npm run dev
#
# This script will:
#   1. Enforce a hard timeout (default: 180 seconds)
#   2. Kill any stuck processes on timeout
#   3. Print clear error message on timeout
# ============================================================================

set -euo pipefail

TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-180}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
if [[ "${1:-}" == "--timeout" ]]; then
  TIMEOUT_SECONDS="$2"
  shift 2
fi

TEST_PATH="${1:-tests/e2e}"

echo "🎭 Running Playwright with ${TIMEOUT_SECONDS}s hard timeout"
echo "   Test: $TEST_PATH"
echo ""

# Check if dev server is running
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:5177/ 2>/dev/null | grep -q "200"; then
  echo "⚠️  Dev server not running on port 5177"
  echo "   Start it first: npm run dev"
  echo ""
  echo "   Or use port 5184: E2E_PORT=5184 ./scripts/safe-playwright.sh $TEST_PATH"
  exit 1
fi

# Run with timeout
cd "$PROJECT_ROOT"

# Use perl alarm for cross-platform timeout
# Falls back to timeout command if perl fails
run_with_timeout() {
  if command -v timeout &> /dev/null; then
    # GNU timeout (Linux)
    timeout --kill-after=10 "$TIMEOUT_SECONDS" npx playwright test "$TEST_PATH" "$@"
  elif command -v gtimeout &> /dev/null; then
    # GNU timeout via Homebrew (macOS)
    gtimeout --kill-after=10 "$TIMEOUT_SECONDS" npx playwright test "$TEST_PATH" "$@"
  else
    # Perl fallback (universal)
    perl -e 'alarm shift; exec @ARGV' "$TIMEOUT_SECONDS" npx playwright test "$TEST_PATH" "$@"
  fi
}

EXIT_CODE=0
run_with_timeout "${@:2}" || EXIT_CODE=$?

if [[ $EXIT_CODE -eq 124 ]] || [[ $EXIT_CODE -eq 142 ]]; then
  echo ""
  echo "⏰ TIMEOUT: Test exceeded ${TIMEOUT_SECONDS}s hard limit"
  echo ""
  echo "   Running cleanup..."
  bash "$SCRIPT_DIR/kill-dev.sh" 2>/dev/null || true
  exit 1
fi

exit $EXIT_CODE
