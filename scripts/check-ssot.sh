#!/bin/bash
# SSOT Validation Pre-commit Hook
# Checks for common SSOT violations before commit

set -e

echo "🔍 Checking for SSOT violations..."

# Check for flat calculations access (should be calculations.selected.*)
# Excludes: test files, deprecated folders, validation utilities (which check for patterns)
FLAT_ACCESS=$(grep -rn "calculations\.bessKW\|calculations\.bessKWh\|calculations\.solarKW" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "selected\." | grep -v "_deprecated" | grep -v "\.test\." | grep -v "base\." | grep -v "ssotValidation" | grep -v "received:" | grep -v "expected:" || true)

if [ -n "$FLAT_ACCESS" ]; then
  echo ""
  echo "❌ SSOT VIOLATION: Found flat calculations access!"
  echo "   Use calculations.selected.bessKW instead of calculations.bessKW"
  echo ""
  echo "Violations found:"
  echo "$FLAT_ACCESS"
  echo ""
  echo "Fix these before committing."
  exit 1
fi

# Check for imports from deprecated TrueQuoteEngine (not in _deprecated folder)
DEPRECATED_IMPORTS=$(grep -rn "from '@/services/TrueQuoteEngine'\|from \"@/services/TrueQuoteEngine\"" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "_deprecated" || true)

if [ -n "$DEPRECATED_IMPORTS" ]; then
  echo ""
  echo "⚠️  WARNING: Found imports from deprecated TrueQuoteEngine"
  echo "   Use TrueQuoteEngineV2 or MerlinOrchestrator instead"
  echo ""
  echo "Deprecated imports found:"
  echo "$DEPRECATED_IMPORTS"
  echo ""
  # Warning only, don't block commit
fi

echo "✅ SSOT validation passed!"
