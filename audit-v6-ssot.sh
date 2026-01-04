#!/bin/bash

# ============================================================================
# SSOT VIOLATION AUDIT SCRIPT - V6 WIZARD
# ============================================================================
# Run this script to detect hardcoded calculations that should use SSOT services
#
# Usage: ./audit-v6-ssot.sh [directory]
# Example: ./audit-v6-ssot.sh src/components/wizard/v6
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directory to audit (default to wizard v6)
AUDIT_DIR="${1:-src/components/wizard/v6}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           SSOT VIOLATION AUDIT - V6 WIZARD                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Scanning: $AUDIT_DIR"
echo ""

CRITICAL_COUNT=0
WARNING_COUNT=0

# ============================================================================
# CRITICAL: Local Calculations (Should use SSOT services)
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${RED}🚨 CRITICAL: LOCAL CALCULATIONS (Should use SSOT)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Pattern 1: Hardcoded savings formulas
echo ""
echo -e "${CYAN}Pattern: Hardcoded savings calculations${NC}"
if grep -rn --include="*.tsx" --include="*.ts" \
  -E "sunHours \* 365|365 \* 0\.12|\* 0\.15|\* 0\.20" \
  "$AUDIT_DIR" 2>/dev/null | grep -v "// SSOT" | grep -v "node_modules"; then
  ((CRITICAL_COUNT++))
else
  echo -e "${GREEN}  ✓ None found${NC}"
fi

# Pattern 2: Direct Math.round on financial calculations
echo ""
echo -e "${CYAN}Pattern: Local financial calculations (Math.round on $)${NC}"
if grep -rn --include="*.tsx" --include="*.ts" \
  -E "Math\.round\(.*(savings|Savings|cost|Cost|price|Price)" \
  "$AUDIT_DIR" 2>/dev/null | grep -v "// SSOT" | grep -v "node_modules"; then
  ((CRITICAL_COUNT++))
else
  echo -e "${GREEN}  ✓ None found${NC}"
fi

# Pattern 3: Hardcoded electricity rates
echo ""
echo -e "${CYAN}Pattern: Hardcoded electricity rates${NC}"
if grep -rn --include="*.tsx" --include="*.ts" \
  -E "0\.1[0-4]\s*[;,\*]|effectiveRate\s*=\s*0\." \
  "$AUDIT_DIR" 2>/dev/null | grep -v "// SSOT" | grep -v "node_modules" | grep -v "placeholder"; then
  ((CRITICAL_COUNT++))
else
  echo -e "${GREEN}  ✓ None found${NC}"
fi

# Pattern 4: Hardcoded demand charges
echo ""
echo -e "${CYAN}Pattern: Hardcoded demand charge values${NC}"
if grep -rn --include="*.tsx" --include="*.ts" \
  -E "demandCharge.*=.*[0-9]+|[0-9]+.*\/kW.*month" \
  "$AUDIT_DIR" 2>/dev/null | grep -v "// SSOT" | grep -v "node_modules"; then
  ((CRITICAL_COUNT++))
else
  echo -e "${GREEN}  ✓ None found${NC}"
fi

# Pattern 5: Solar sizing calculations not from service
echo ""
echo -e "${CYAN}Pattern: Local solar sizing calculations${NC}"
if grep -rn --include="*.tsx" --include="*.ts" \
  -E "sqft.*\/.*[0-9]+|peakLoadMW.*\*.*[0-9]+\.[0-9]" \
  "$AUDIT_DIR" 2>/dev/null | grep -v "// SSOT" | grep -v "node_modules" | grep -v "placeholder"; then
  ((CRITICAL_COUNT++))
else
  echo -e "${GREEN}  ✓ None found${NC}"
fi

# ============================================================================
# WARNING: Missing SSOT Imports
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⚠️  WARNING: MISSING SSOT SERVICE IMPORTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for files that calculate but don't import SSOT services
for file in $(find "$AUDIT_DIR" -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v node_modules); do
  if grep -q "annualSavings\|financialMetrics\|calculateSavings" "$file" 2>/dev/null; then
    if ! grep -q "centralizedCalculations\|QuoteEngine\|unifiedQuoteCalculator" "$file" 2>/dev/null; then
      echo -e "${YELLOW}  ⚠️  $file${NC}"
      echo "     Has financial calculations but missing SSOT service imports"
      ((WARNING_COUNT++))
    fi
  fi
done

# ============================================================================
# INFO: Files with calculations
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📋 FILES CONTAINING CALCULATIONS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for file in $(find "$AUDIT_DIR" -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v node_modules); do
  CALC_COUNT=$(grep -c -E "Math\.|useMemo|useEffect.*calc" "$file" 2>/dev/null || echo 0)
  # Handle case where grep returns multiple lines (shouldn't happen with -c, but just in case)
  CALC_COUNT=$(echo "$CALC_COUNT" | head -1 | tr -d '\n')
  if [ "$CALC_COUNT" -gt 3 ] 2>/dev/null; then
    echo "  📄 $file ($CALC_COUNT calculation patterns)"
  fi
done

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        AUDIT SUMMARY                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $CRITICAL_COUNT -gt 0 ]; then
  echo -e "${RED}🚨 CRITICAL ISSUES: $CRITICAL_COUNT${NC}"
else
  echo -e "${GREEN}✅ CRITICAL ISSUES: 0${NC}"
fi

if [ $WARNING_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS: $WARNING_COUNT${NC}"
else
  echo -e "${GREEN}✅ WARNINGS: 0${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SSOT SERVICE CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "All financial calculations should use:"
echo "  ├── centralizedCalculations.ts → calculateFinancialMetrics()"
echo "  ├── QuoteEngine.ts → generateQuote()"  
echo "  ├── unifiedQuoteCalculator.ts → calculateQuote()"
echo "  ├── calculationConstantsService.ts → getCalculationConstant()"
echo "  └── pricingConfigService.ts → getPricingConfig()"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Exit with error if critical issues found
if [ $CRITICAL_COUNT -gt 0 ]; then
  echo -e "${RED}❌ AUDIT FAILED - Fix critical issues before deployment${NC}"
  exit 1
else
  echo -e "${GREEN}✅ AUDIT PASSED${NC}"
  exit 0
fi
