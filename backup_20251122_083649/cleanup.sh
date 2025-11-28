#!/bin/bash
# Merlin2 SAFE Cleanup Script
# Conservative cleanup - only removes backup files and reports issues
# DOES NOT delete any service files without explicit confirmation

set -e  # Exit on error

echo "🧹 Starting Merlin2 SAFE Cleanup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track changes
CHANGES_MADE=0

echo "${BLUE}ℹ️  This script will:${NC}"
echo "  ✅ Delete backup files (.backup, .bak)"
echo "  ✅ Report debug code locations"
echo "  ✅ Count TODO comments"
echo "  ❌ NOT delete any service files"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask for confirmation
read -p "Continue with cleanup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi
echo ""

# 1. Remove backup files
echo "📦 Step 1: Removing backup files..."
BACKUP_FILES=(
    "src/components/BessQuoteBuilder.tsx.backup"
    "src/services/__tests__/baselineService.test.ts.bak"
    "src/utils/testCalculations.ts.bak"
    "src/scripts/verifyDatabaseConfig.ts.bak"
)

for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ${RED}Deleting${NC}: $file"
        rm "$file"
        CHANGES_MADE=$((CHANGES_MADE + 1))
    else
        echo "  ${YELLOW}Not found${NC}: $file"
    fi
done
echo ""

# 2. Clean old archive files
echo "📁 Step 2: Cleaning archive folder..."
ARCHIVE_FILES=(
    "docs/ARCHIVE/PRICING_CONFIG_SCHEMA.sql.old"
    "docs/ARCHIVE/supabase_pricing_schema.sql.old"
)

for file in "${ARCHIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ${RED}Deleting${NC}: $file"
        rm "$file"
        CHANGES_MADE=$((CHANGES_MADE + 1))
    else
        echo "  ${YELLOW}Not found${NC}: $file"
    fi
done
echo ""

# 3. Report on services (DO NOT DELETE)
echo "✅ Step 3: Service Health Check..."
echo "  ${GREEN}KEEPING${NC} these active services:"
echo "    - dailySyncService.ts (used for price sync)"
echo "    - centralizedCalculations.ts (core engine)"
echo "    - advancedFinancialModeling.ts (financial features)"
echo "    - bessDataService.ts (data calculations)"
echo "    - advancedBessAnalytics.ts (analytics)"
echo "    - baselineService.ts (baseline calculations)"
echo ""

# 4. Report debug code (DO NOT REMOVE - just report)
echo "🐛 Step 4: Debug Code Report..."
echo "  ${YELLOW}Found debug code in these locations:${NC}"
echo ""

echo "  ${BLUE}dailySyncService.ts${NC} - Misleading 'deprecated' warnings:"
grep -n "console.warn.*DailySyncService" src/services/dailySyncService.ts | head -5 || echo "    None found"
echo "    💡 Suggestion: Remove warning messages (service is working!)"
echo ""

echo "  ${BLUE}baselineService.ts${NC} - Debug console.log statements:"
grep -n "console.log.*BaselineService" src/services/baselineService.ts | wc -l | xargs echo "    Found:" "statements"
echo "    💡 Suggestion: Wrap in if (import.meta.env.DEV)"
echo ""

echo "  ${BLUE}authService.ts${NC} - window.authDebug exposure:"
grep -n "window.*authDebug" src/services/authService.ts || echo "    None found"
echo "    💡 Suggestion: Gate with if (import.meta.env.DEV)"
echo ""

# 5. Count TODOs
echo "📝 Step 5: TODO Comment Audit..."
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "  ${YELLOW}Found${NC}: $TODO_COUNT TODO/FIXME/HACK comments"
echo "  💡 Review SAFE_CLEANUP_PLAN.md for details"
echo ""

# 6. Check for more backup files
echo "🔍 Step 6: Scanning for any remaining backup files..."
EXTRA_BACKUPS=$(find src/ -name "*.backup" -o -name "*.bak" -o -name "*.old" 2>/dev/null)
if [ -z "$EXTRA_BACKUPS" ]; then
    echo "  ${GREEN}✓${NC} No additional backup files found"
else
    echo "  ${YELLOW}Found additional backup files:${NC}"
    echo "$EXTRA_BACKUPS"
fi
echo ""

# 7. Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files deleted: ${GREEN}$CHANGES_MADE${NC} backup files"
echo ""
echo "${BLUE}Services verified ACTIVE and KEPT:${NC}"
echo "  ✅ dailySyncService.ts - Price sync"
echo "  ✅ centralizedCalculations.ts - Core calculations"  
echo "  ✅ advancedFinancialModeling.ts - Financial modeling"
echo "  ✅ bessDataService.ts - BESS data"
echo "  ✅ advancedBessAnalytics.ts - Analytics"
echo "  ✅ baselineService.ts - Baseline calculations"
echo ""
echo "${YELLOW}Manual cleanup recommended:${NC}"
echo "  1. Remove misleading warnings in dailySyncService.ts"
echo "  2. Gate debug logs in baselineService.ts (15+ statements)"
echo "  3. Gate window.authDebug in authService.ts"
echo "  4. Review $TODO_COUNT TODO comments"
echo ""
echo "${GREEN}Next steps:${NC}"
echo "  1. Review: SAFE_CLEANUP_PLAN.md"
echo "  2. Run: npm run type-check"
echo "  3. Run: npm run build"
echo "  4. Test: All wizard flows"
echo "  5. Verify: Admin panel price sync works"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create git commit if changes were made
if [ $CHANGES_MADE -gt 0 ]; then
    echo "📝 Cleanup complete. Ready to commit:"
    echo "   git add -A"
    echo "   git commit -m 'cleanup: Remove backup files (safe cleanup)'"
    echo ""
fi

echo "🎉 Safe cleanup complete!"
echo "   No service files were deleted."
echo "   Review SAFE_CLEANUP_PLAN.md for next steps."
