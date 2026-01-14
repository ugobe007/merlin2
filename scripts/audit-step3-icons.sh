#!/bin/bash
# ============================================================================
# AUDIT STEP 3 ICONS - Check all industry question values against QuestionIconMap
# Run: bash scripts/audit-step3-icons.sh
# ============================================================================

echo "=============================================="
echo "STEP 3 ICON AUDIT - All Industries"
echo "=============================================="
echo ""

ICON_MAP_FILE="src/components/wizard/QuestionIconMap.tsx"
MIGRATIONS_DIR="database/migrations"

# Count total mappings
TOTAL_ICONS=$(grep -c "type: 'emoji'" "$ICON_MAP_FILE" 2>/dev/null)
echo "📊 QuestionIconMap has $TOTAL_ICONS emoji icon mappings"
echo ""

# Collect all unique option values from ALL migrations (text only)
echo "🔍 Checking database migrations for option values..."

ALL_TEXT_VALUES=$(grep -rh '"value": "[^"]*"' $MIGRATIONS_DIR/*.sql 2>/dev/null | \
  grep -o '"value": "[^"]*"' | \
  sed 's/"value": "//g' | \
  sed 's/"//g' | \
  grep -E '^[a-zA-Z_-]+$' | \
  sort | uniq)

TOTAL_VALUES=$(echo "$ALL_TEXT_VALUES" | wc -l | tr -d ' ')
echo "Found $TOTAL_VALUES unique text-based option values"
echo ""

# Check which values are missing from QuestionIconMap
echo "🔍 Checking for missing icon mappings..."
echo ""

MISSING_COUNT=0
MISSING_VALUES=""

for value in $ALL_TEXT_VALUES; do
  if [ -z "$value" ]; then
    continue
  fi
  
  if ! grep -q "'$value':" "$ICON_MAP_FILE" 2>/dev/null; then
    MISSING_COUNT=$((MISSING_COUNT + 1))
    MISSING_VALUES="$MISSING_VALUES$value\n"
  fi
done

echo "=============================================="
echo "SUMMARY"
echo "=============================================="
echo "Total icon mappings: $TOTAL_ICONS"
echo "Total text values in DB: $TOTAL_VALUES"
echo "Missing mappings: $MISSING_COUNT"
echo ""

if [ $MISSING_COUNT -gt 0 ]; then
  echo "❌ Missing values:"
  echo -e "$MISSING_VALUES" | sort | uniq
  echo ""
  echo "Add these to src/components/wizard/QuestionIconMap.tsx"
  exit 1
else
  echo "✅ All text-based option values have icon mappings!"
  exit 0
fi
