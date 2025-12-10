#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "   SSOT AUDIT: Finding Hardcoded Numbers in Calculations"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Directories to scan
DIRS="src/components src/hooks src/services src/core src/utils"

# Files to exclude (known safe constants files)
EXCLUDE_PATTERN="node_modules|\.test\.|\.spec\.|constants\.ts|config\.ts|types\.ts"

echo "🔍 CATEGORY 1: Power/Energy Multipliers (kW, kWh)"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: numbers × kW patterns, likely hardcoded power values"
echo ""

# Find power-related multipliers (common values: 1.4, 3.5, 6, 7, 11, 50, 100, 150, 350)
grep -rn --include="*.ts" --include="*.tsx" -E "\* *(1\.4|3\.5|6|7|11|50|100|150|350|1000)" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -50

echo ""
echo "🔍 CATEGORY 2: Division Operations (potential unit conversions)"
echo "────────────────────────────────────────────────────────────"
grep -rn --include="*.ts" --include="*.tsx" -E "/ *(1000|100|60|24|12|4)" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -30

echo ""
echo "🔍 CATEGORY 3: Hardcoded Prices ($)"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: dollar amounts that should come from pricing service"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "[0-9]+(000|500|800|850|180)" $DIRS 2>/dev/null | grep -iE "price|cost|\\\$|dollar" | grep -vE "$EXCLUDE_PATTERN" | head -30

echo ""
echo "🔍 CATEGORY 4: Percentage/Ratio Multipliers"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: 0.xx multipliers (efficiency, diversity factors)"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "\* *0\.[0-9]+" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -40

echo ""
echo "🔍 CATEGORY 5: Battery/Duration Constants"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: backup hours, duration multipliers"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(backupHours|duration|hours).*[0-9]|[0-9].*(backupHours|duration|hours)" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -20

echo ""
echo "🔍 CATEGORY 6: EV Charger Power Values"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: L1=1.4kW, L2=7-11kW, L3=50-150kW, HPC=350kW"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(1\.4|7\.2|7|11|19\.2|50|100|150|350)" $DIRS 2>/dev/null | grep -iE "ev|charger|L1|L2|L3|dcfc|hpc|level" | grep -vE "$EXCLUDE_PATTERN" | head -30

echo ""
echo "🔍 CATEGORY 7: Solar/Wind Constants"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: sun hours, capacity factors, generation multipliers"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(sunHours|solarHours|capacityFactor|windFactor)" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -20
grep -rn --include="*.ts" --include="*.tsx" -E "\* *(4\.5|5|5\.5|6|6\.5)" $DIRS 2>/dev/null | grep -iE "solar|sun|hour" | grep -vE "$EXCLUDE_PATTERN" | head -20

echo ""
echo "🔍 CATEGORY 8: Room/Facility Power Calculations"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: kW per room, kW per sqft, diversity factors"
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(room|bed|bay|rack).*\* *[0-9]|[0-9].*\* *(room|bed|bay|rack)" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -20
grep -rn --include="*.ts" --include="*.tsx" -E "sqft.*\* *[0-9]|[0-9].*\* *sqft|squareFeet.*\* *[0-9]" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -20

echo ""
echo "🔍 CATEGORY 9: Magic Numbers in Conditionals"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: if (x > 1000), if (x < 50), etc."
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(>|<|>=|<=|===|==) *[0-9]{2,}" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN|index|length|\.length|section|step|page" | head -30

echo ""
echo "🔍 CATEGORY 10: Default/Fallback Values"
echo "────────────────────────────────────────────────────────────"
echo "Looking for: || 1000, || 25000, ?? 100, etc."
echo ""
grep -rn --include="*.ts" --include="*.tsx" -E "(\|\||:|\?\?) *[0-9]{3,}" $DIRS 2>/dev/null | grep -vE "$EXCLUDE_PATTERN" | head -30

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   POTENTIAL SSOT VIOLATIONS BY FILE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Files with most potential hardcoded values:"
echo ""

# Count occurrences per file
for dir in $DIRS; do
  if [ -d "$dir" ]; then
    grep -rl --include="*.ts" --include="*.tsx" -E "\* *[0-9]+\.?[0-9]*" "$dir" 2>/dev/null | while read file; do
      count=$(grep -c -E "\* *[0-9]+\.?[0-9]*" "$file" 2>/dev/null)
      if [ "$count" -gt 5 ]; then
        echo "  $count matches: $file"
      fi
    done
  fi
done | sort -rn | head -20

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   SSOT SOURCE FILES (These SHOULD have constants)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "These files are the APPROVED source of truth for constants:"
echo ""
ls -la src/services/useCasePowerCalculations.ts 2>/dev/null && echo "  ✅ useCasePowerCalculations.ts"
ls -la src/services/evChargingCalculations.ts 2>/dev/null && echo "  ✅ evChargingCalculations.ts"
ls -la src/services/calculationConstantsService.ts 2>/dev/null && echo "  ✅ calculationConstantsService.ts"
ls -la src/services/unifiedPricingService.ts 2>/dev/null && echo "  ✅ unifiedPricingService.ts"
ls -la src/utils/equipmentCalculations.ts 2>/dev/null && echo "  ✅ equipmentCalculations.ts"
ls -la src/data/constants.ts 2>/dev/null && echo "  ✅ constants.ts"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "   RECOMMENDED ACTIONS"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Review each flagged file above"
echo "2. Move hardcoded values to appropriate SSOT file:"
echo "   - Power calculations → useCasePowerCalculations.ts"
echo "   - EV charger values → evChargingCalculations.ts"
echo "   - Pricing → unifiedPricingService.ts or calculationConstantsService.ts"
echo "   - Equipment → equipmentCalculations.ts"
echo ""
echo "3. Replace hardcoded values with imports from SSOT"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "   AUDIT COMPLETE"
echo "════════════════════════════════════════════════════════════"
