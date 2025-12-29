#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "   CRITICAL FILES AUDIT: Hardcoded Values in Core Logic"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Auditing critical calculation files for hardcoded values..."
echo ""

CRITICAL_FILES=(
  "src/components/wizard/StreamlinedWizard.tsx"
  "src/hooks/useWizardState.ts"
  "src/hooks/wizard/useSystemCalculations.ts"
  "src/services/useCasePowerCalculations.ts"
  "src/services/evChargingCalculations.ts"
  "src/services/unifiedQuoteCalculator.ts"
  "src/services/centralizedCalculations.ts"
  "src/services/baselineService.ts"
  "src/core/calculations/QuoteEngine.ts"
  "src/utils/equipmentCalculations.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "════════════════════════════════════════════════════════════"
    echo "FILE: $file"
    echo "════════════════════════════════════════════════════════════"
    
    echo ""
    echo "🔢 Multiplication operations (* number):"
    grep -n -E "\* *[0-9]+\.?[0-9]*" "$file" | head -30
    
    echo ""
    echo "➗ Division operations (/ number):"
    grep -n -E "/ *[0-9]+\.?[0-9]*" "$file" | head -15
    
    echo ""
    echo "⚠️  Fallback values (|| number, ?? number):"
    grep -n -E "(\|\||\?\?) *[0-9]+" "$file" | head -15
    
    echo ""
    echo "💰 Price-related hardcoded values:"
    grep -n -iE "(price|cost|dollar|\\\$).*[0-9]{3,}|[0-9]{3,}.*(price|cost|dollar|\\\$)" "$file" | head -10
    
    echo ""
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   SPECIFIC PATTERN SEARCH: SOLAR MULTIPLIERS"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Looking for solar pricing calculations that might be wrong:"
grep -rn --include="*.ts" --include="*.tsx" -E "solar.*\* *[0-9]|solarKW.*\* *[0-9]|solarMW.*\* *[0-9]" src/components src/services src/hooks 2>/dev/null | grep -v "node_modules" | grep -v ".test." | head -30

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   SPECIFIC PATTERN SEARCH: BATTERY PRICING"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Looking for battery pricing that differs from NREL ATB:"
grep -rn --include="*.ts" --include="*.tsx" -E "battery.*\* *[0-9]{3}|batteryCost.*[0-9]{3}|kWh.*\* *[0-9]{2,3}" src/components src/services src/hooks 2>/dev/null | grep -v "node_modules" | grep -v ".test." | head -30

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   SPECIFIC PATTERN SEARCH: RECOMMENDATION vs USER SELECTION"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Looking for where recommendations diverge from user selections:"
grep -rn --include="*.ts" --include="*.tsx" -E "recommendation|Merlin.*Recommendation|recommended" src/components/wizard 2>/dev/null | grep -v "node_modules" | head -20

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   AUDIT COMPLETE"
echo "════════════════════════════════════════════════════════════"
