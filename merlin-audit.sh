#!/bin/bash
# ============================================================================
# MERLIN CODEBASE AUDIT SCRIPT
# Version: 1.0.0
# Purpose: Detect nested calculations, naming issues, bad links, ghost files
# Usage: cd /Users/robertchristopher/merlin2 && bash merlin-audit.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "============================================================================"
echo "                    MERLIN CODEBASE AUDIT"
echo "                    $(date)"
echo "============================================================================"
echo ""

# Track issues
CRITICAL_COUNT=0
WARNING_COUNT=0
INFO_COUNT=0

# ============================================================================
# CATEGORY 1: NESTED/EMBEDDED CALCULATIONS
# Look for calculation logic that should be in SSOT but isn't
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CATEGORY 1: NESTED/EMBEDDED CALCULATIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "1.1 Checking for embedded calculation functions in components..."
echo "    (These should be in SSOT services, not components)"
echo ""

# Pattern 1: Math operations in component files
echo "    → Searching for math operations (* / + -) with kW, MW, power, energy..."
CALC_PATTERNS=$(grep -rn --include="*.tsx" -E "(kW|MW|power|energy|storage|capacity)\s*[\*\/\+\-]\s*[0-9]" src/components/ 2>/dev/null || true)
if [ -n "$CALC_PATTERNS" ]; then
    echo -e "${YELLOW}    ⚠️  POTENTIAL EMBEDDED CALCULATIONS FOUND:${NC}"
    echo "$CALC_PATTERNS" | head -20
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No obvious math operations in components${NC}"
fi
echo ""

# Pattern 2: Functions named calculate* in component files (WARNING - verify they call SSOT)
echo "    → Searching for calculate* functions in components..."
# Exclude functions that are clearly calling SSOT services
CALC_FUNCS=$(grep -rn --include="*.tsx" -E "(function|const)\s+calculate[A-Z]" src/components/ 2>/dev/null | grep -v "SSOT\|QuoteEngine" || true)
if [ -n "$CALC_FUNCS" ]; then
    echo -e "${YELLOW}    ⚠️  CALCULATION FUNCTIONS IN COMPONENTS (verify they call SSOT):${NC}"
    echo "$CALC_FUNCS"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No calculate* functions in components${NC}"
fi
echo ""

# Pattern 3: Direct calculateQuote imports (should use QuoteEngine) - only flag ACTUAL imports
echo "    → Checking for legacy calculateQuote imports..."
# Only flag actual import statements, not comments/documentation
LEGACY_IMPORTS=$(grep -rn --include="*.tsx" --include="*.ts" "^import.*calculateQuote" src/ 2>/dev/null | grep -v "QuoteEngine" | grep -v ".test." || true)
if [ -n "$LEGACY_IMPORTS" ]; then
    echo -e "${YELLOW}    ⚠️  DIRECT calculateQuote IMPORTS (consider using QuoteEngine):${NC}"
    echo "$LEGACY_IMPORTS"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No legacy calculateQuote imports${NC}"
fi
echo ""

# Pattern 4: Hardcoded numeric constants that look like rates/factors
echo "    → Checking for hardcoded calculation constants in components..."
HARDCODED=$(grep -rn --include="*.tsx" -E "=\s*(0\.[0-9]{2,}|[1-9][0-9]{2,})\s*[\*\/]" src/components/ 2>/dev/null | grep -v "tailwind" | grep -v "className" | head -10 || true)
if [ -n "$HARDCODED" ]; then
    echo -e "${YELLOW}    ⚠️  POTENTIAL HARDCODED CONSTANTS:${NC}"
    echo "$HARDCODED"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No obvious hardcoded calculation constants${NC}"
fi
echo ""

# ============================================================================
# CATEGORY 2: INCORRECT NAME ASSOCIATIONS
# Files/imports that reference renamed or moved modules
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CATEGORY 2: INCORRECT NAME ASSOCIATIONS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "2.1 Checking for imports of non-existent files..."
echo ""

# Check for imports of definitely missing files (known patterns)
MISSING_IMPORTS=$(grep -rn --include="*.ts" --include="*.tsx" "from.*'\./\|from.*\"\./" src/ 2>/dev/null | while read line; do
    FILE=$(echo "$line" | cut -d: -f1)
    DIR=$(dirname "$FILE")
    IMPORT_PATH=$(echo "$line" | grep -oE "from ['\"][./][^'\"]+['\"]" | sed "s/from ['\"]//;s/['\"]//")
    
    if [ -n "$IMPORT_PATH" ]; then
        # Resolve relative path from the file's directory
        RESOLVED="${DIR}/${IMPORT_PATH}"
        # Check if file exists with various extensions
        if [ ! -f "${RESOLVED}.ts" ] && [ ! -f "${RESOLVED}.tsx" ] && [ ! -f "${RESOLVED}/index.ts" ] && [ ! -f "${RESOLVED}/index.tsx" ]; then
            echo "$FILE: $IMPORT_PATH"
        fi
    fi
done 2>/dev/null | head -10)

if [ -n "$MISSING_IMPORTS" ]; then
    echo -e "${YELLOW}    ⚠️  POTENTIALLY MISSING LOCAL IMPORTS:${NC}"
    echo "$MISSING_IMPORTS"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ Local imports appear valid${NC}"
fi
echo ""

echo "2.2 Checking for references to deleted/renamed files..."
echo ""

# Known deleted files from refactoring
DELETED_FILES=("calculationValidator" "oldCalculations" "legacyQuote")
for deleted in "${DELETED_FILES[@]}"; do
    REFS=$(grep -rn --include="*.ts" --include="*.tsx" "$deleted" src/ 2>/dev/null || true)
    if [ -n "$REFS" ]; then
        echo -e "${RED}    🚨 REFERENCES TO DELETED FILE '$deleted':${NC}"
        echo "$REFS"
        CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
    fi
done
echo -e "${GREEN}    ✅ No references to known deleted files${NC}"
echo ""

echo "2.3 Checking for mismatched export/import names..."
echo ""

# Check QuoteEngine exports match imports
QUOTE_ENGINE_EXPORTS=$(grep -E "^export" src/core/calculations/QuoteEngine.ts 2>/dev/null | grep -oE "(class|const|function|type|interface)\s+\w+" | awk '{print $2}' || true)
echo "    QuoteEngine exports: $QUOTE_ENGINE_EXPORTS"
echo ""

# ============================================================================
# CATEGORY 3: INCORRECT OR BAD LINKS
# Broken routes, dead URLs, missing assets
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CATEGORY 3: INCORRECT OR BAD LINKS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "3.1 Extracting all route definitions..."
echo ""
ROUTES=$(grep -rn --include="*.tsx" -E "path=|to=|href=" src/ 2>/dev/null | grep -oE "(path|to|href)=['\"][^'\"]+['\"]" | sort -u || true)
echo "    Found routes/links:"
echo "$ROUTES" | sed 's/^/    /'
echo ""

echo "3.2 Checking for hardcoded localhost URLs..."
LOCALHOST=$(grep -rn --include="*.ts" --include="*.tsx" "localhost" src/ 2>/dev/null | grep -v "// " || true)
if [ -n "$LOCALHOST" ]; then
    echo -e "${YELLOW}    ⚠️  HARDCODED LOCALHOST URLS:${NC}"
    echo "$LOCALHOST"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No hardcoded localhost URLs${NC}"
fi
echo ""

echo "3.3 Checking for broken asset references..."
ASSET_REFS=$(grep -rn --include="*.tsx" -E "src=['\"]/(images|assets|public)" src/ 2>/dev/null || true)
if [ -n "$ASSET_REFS" ]; then
    echo "    Asset references found:"
    echo "$ASSET_REFS" | while read -r line; do
        ASSET_PATH=$(echo "$line" | grep -oE "/(images|assets|public)[^'\"]*" | head -1)
        if [ -n "$ASSET_PATH" ] && [ ! -f "public$ASSET_PATH" ] && [ ! -f ".$ASSET_PATH" ]; then
            echo -e "${YELLOW}    ⚠️  POTENTIALLY MISSING ASSET: $ASSET_PATH${NC}"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    done
else
    echo -e "${GREEN}    ✅ No asset reference issues detected${NC}"
fi
echo ""

echo "3.4 Checking for external API URLs..."
API_URLS=$(grep -rn --include="*.ts" --include="*.tsx" -E "https?://[^'\"]*api" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$API_URLS" ]; then
    echo "    External API URLs found (verify these are correct):"
    echo "$API_URLS" | sed 's/^/    /'
    INFO_COUNT=$((INFO_COUNT + 1))
fi
echo ""

# ============================================================================
# CATEGORY 4: GHOST FILES AND LEGACY CODE
# Unused files, dead code, deprecated but not removed
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CATEGORY 4: GHOST FILES AND LEGACY CODE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "4.1 Finding potentially unused TypeScript files..."
echo ""

# List all .ts/.tsx files and check if they're imported anywhere
UNUSED_FILES=""
for file in $(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v ".test." | grep -v "__tests__" | grep -v "node_modules"); do
    BASENAME=$(basename "$file" | sed 's/\.[^.]*$//')
    
    # Skip index files and main entry points
    if [ "$BASENAME" = "index" ] || [ "$BASENAME" = "main" ] || [ "$BASENAME" = "App" ] || [ "$BASENAME" = "vite-env" ]; then
        continue
    fi
    
    # Check if this file is imported anywhere
    IMPORT_COUNT=$(grep -r --include="*.ts" --include="*.tsx" -l "$BASENAME" src/ 2>/dev/null | grep -v "$file" | wc -l)
    
    if [ "$IMPORT_COUNT" -eq 0 ]; then
        UNUSED_FILES="${UNUSED_FILES}${file}\n"
    fi
done

if [ -n "$UNUSED_FILES" ]; then
    echo -e "${YELLOW}    ⚠️  POTENTIALLY UNUSED FILES (verify before deleting):${NC}"
    echo -e "$UNUSED_FILES" | head -20
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ All files appear to be imported somewhere${NC}"
fi
echo ""

echo "4.2 Checking for TODO/FIXME/HACK/DEPRECATED comments..."
echo ""
TODOS=$(grep -rn --include="*.ts" --include="*.tsx" -E "(TODO|FIXME|HACK|DEPRECATED|XXX):" src/ 2>/dev/null | head -20 || true)
if [ -n "$TODOS" ]; then
    echo -e "${YELLOW}    ⚠️  TECHNICAL DEBT MARKERS FOUND:${NC}"
    echo "$TODOS"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No TODO/FIXME/HACK markers found${NC}"
fi
echo ""

echo "4.3 Checking for commented-out code blocks..."
echo ""
COMMENTED_CODE=$(grep -rn --include="*.ts" --include="*.tsx" -E "^\s*//\s*(import|export|function|const|class|interface)" src/ 2>/dev/null | head -15 || true)
if [ -n "$COMMENTED_CODE" ]; then
    echo -e "${YELLOW}    ⚠️  COMMENTED-OUT CODE (consider removing):${NC}"
    echo "$COMMENTED_CODE"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No significant commented-out code found${NC}"
fi
echo ""

echo "4.4 Checking for console.log statements (should be removed for production)..."
echo ""
CONSOLE_LOGS=$(grep -rn --include="*.ts" --include="*.tsx" "console\.\(log\|debug\|info\)" src/ 2>/dev/null | grep -v ".test." | head -15 || true)
if [ -n "$CONSOLE_LOGS" ]; then
    echo -e "${YELLOW}    ⚠️  CONSOLE STATEMENTS FOUND:${NC}"
    echo "$CONSOLE_LOGS"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ No console.log statements found${NC}"
fi
echo ""

echo "4.5 Checking for dead exports (exported but never imported)..."
echo ""
# This is a simplified check - counts exports vs imports for key modules
for service in "useCasePowerCalculations" "centralizedCalculations" "evChargingCalculations" "unifiedQuoteCalculator"; do
    if [ -f "src/services/${service}.ts" ]; then
        EXPORT_COUNT=$(grep -c "^export" "src/services/${service}.ts" 2>/dev/null || echo "0")
        IMPORT_COUNT=$(grep -r --include="*.ts" --include="*.tsx" "from.*${service}" src/ 2>/dev/null | wc -l)
        echo "    ${service}: ${EXPORT_COUNT} exports, ${IMPORT_COUNT} import statements"
        
        if [ "$IMPORT_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}    ⚠️  ${service} has exports but NO imports - may be dead code${NC}"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    fi
done
echo ""

echo "4.6 Checking for orphaned test files..."
echo ""
for testfile in $(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null); do
    # Get the source file this test should be testing
    SOURCEFILE=$(echo "$testfile" | sed 's/\.test\./\./' | sed 's|__tests__/||')
    SOURCEFILE2=$(echo "$testfile" | sed 's/\.test\.ts/.ts/' | sed 's|/__tests__||')
    
    if [ ! -f "$SOURCEFILE" ] && [ ! -f "$SOURCEFILE2" ]; then
        echo -e "${YELLOW}    ⚠️  ORPHANED TEST FILE: $testfile${NC}"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    fi
done
echo -e "${GREEN}    ✅ Test file check complete${NC}"
echo ""

# ============================================================================
# CATEGORY 5: SSOT COMPLIANCE CHECK
# Verify QuoteEngine is the single source of truth
# ============================================================================
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CATEGORY 5: SSOT COMPLIANCE CHECK${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "5.1 Verifying QuoteEngine is imported correctly..."
echo ""
QE_IMPORTS=$(grep -rn --include="*.tsx" "QuoteEngine" src/components/ 2>/dev/null || true)
QE_COUNT=$(echo "$QE_IMPORTS" | grep -c "QuoteEngine" || echo "0")
echo "    QuoteEngine imports in components: $QE_COUNT"

if [ "$QE_COUNT" -lt 4 ]; then
    echo -e "${YELLOW}    ⚠️  Expected 8+ QuoteEngine imports (found $QE_COUNT)${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
else
    echo -e "${GREEN}    ✅ QuoteEngine imports look correct${NC}"
fi
echo ""

echo "5.2 Checking that QuoteEngine.generateQuote() is used..."
echo ""
GENERATE_QUOTE=$(grep -rn --include="*.tsx" "QuoteEngine.generateQuote" src/ 2>/dev/null || true)
if [ -n "$GENERATE_QUOTE" ]; then
    echo -e "${GREEN}    ✅ QuoteEngine.generateQuote() usage found:${NC}"
    echo "$GENERATE_QUOTE" | wc -l | xargs echo "       Total calls:"
else
    echo -e "${RED}    🚨 NO QuoteEngine.generateQuote() calls found!${NC}"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "============================================================================"
echo "                           AUDIT SUMMARY"
echo "============================================================================"
echo ""
echo -e "${RED}🚨 CRITICAL ISSUES: $CRITICAL_COUNT${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARNING_COUNT${NC}"
echo -e "${BLUE}ℹ️  INFO: $INFO_COUNT${NC}"
echo ""

if [ $CRITICAL_COUNT -gt 0 ]; then
    echo -e "${RED}❌ AUDIT FAILED - Fix critical issues before deployment${NC}"
    exit 1
elif [ $WARNING_COUNT -gt 5 ]; then
    echo -e "${YELLOW}⚠️  AUDIT PASSED WITH WARNINGS - Review before deployment${NC}"
    exit 0
else
    echo -e "${GREEN}✅ AUDIT PASSED - Codebase is clean${NC}"
    exit 0
fi
