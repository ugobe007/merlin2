#!/bin/bash
# ============================================================================
# MERLIN AUTO-FIX SCRIPT
# ============================================================================
# Automatically fixes safe lint issues without breaking code
#
# Usage:
#   chmod +x scripts/auto-fix.sh
#   ./scripts/auto-fix.sh
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 MERLIN AUTO-FIX SCRIPT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# ============================================================================
# PHASE 1: SAFE DELETIONS
# ============================================================================

echo -e "\n${CYAN}📁 PHASE 1: Cleaning up duplicate/backup folders${NC}"
echo "─────────────────────────────────────────────────"

# Check for "src 2" directory
if [ -d "src 2" ]; then
  echo -e "${YELLOW}Found duplicate 'src 2' directory ($(du -sh "src 2" | cut -f1))${NC}"
  read -p "Delete 'src 2'? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "src 2"
    echo -e "${GREEN}✅ Deleted 'src 2'${NC}"
  fi
fi

# Check for backup directories
BACKUP_DIRS=("backup_"* ".backups" "*.backup" "src/assets/images/originals_backup")
for pattern in "${BACKUP_DIRS[@]}"; do
  for dir in $pattern; do
    if [ -d "$dir" ] && [ "$dir" != "$pattern" ]; then
      echo -e "${YELLOW}Found backup directory: $dir ($(du -sh "$dir" 2>/dev/null | cut -f1))${NC}"
      read -p "Delete '$dir'? (y/n) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$dir"
        echo -e "${GREEN}✅ Deleted '$dir'${NC}"
      fi
    fi
  done
done

# ============================================================================
# PHASE 2: AUTO-FIX LINT ISSUES
# ============================================================================

echo -e "\n${CYAN}🔧 PHASE 2: Auto-fixing lint issues${NC}"
echo "─────────────────────────────────────────────────"

# Count errors before
BEFORE=$(npm run lint 2>&1 | grep -o "[0-9]* problems" | grep -o "[0-9]*" | head -1 || echo "0")
echo -e "Problems before: ${RED}$BEFORE${NC}"

# Run ESLint auto-fix
echo -e "\n${YELLOW}Running ESLint auto-fix...${NC}"
npm run lint:fix 2>&1 | tail -5 || true

# Count errors after
AFTER=$(npm run lint 2>&1 | grep -o "[0-9]* problems" | grep -o "[0-9]*" | head -1 || echo "0")
echo -e "Problems after: ${GREEN}$AFTER${NC}"
if [ "$BEFORE" != "0" ] && [ "$AFTER" != "0" ]; then
  FIXED=$((BEFORE - AFTER))
  if [ "$FIXED" -gt "0" ]; then
    echo -e "Fixed: ${GREEN}$FIXED${NC} issues"
  else
    echo -e "Fixed: ${YELLOW}0${NC} issues (may need manual fixes)"
  fi
fi

# ============================================================================
# PHASE 3: REMOVE UNUSED IMPORTS (More Aggressive)
# ============================================================================

echo -e "\n${CYAN}🗑️  PHASE 3: Analyzing unused imports${NC}"
echo "─────────────────────────────────────────────────"

# Find files with unused imports and list them
echo "Files with most unused imports:"
npm run lint 2>&1 | grep "is defined but never used" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -10 | while read count file; do
    if [ "$count" -gt "5" ]; then
      echo "  $count unused in $(basename "$file")"
    fi
  done || echo "  (Could not analyze)"

# ============================================================================
# PHASE 4: FIX SPECIFIC PATTERNS
# ============================================================================

echo -e "\n${CYAN}🔨 PHASE 4: Fixing specific patterns${NC}"
echo "─────────────────────────────────────────────────"

# Fix empty catch blocks (add console.error)
echo -e "${YELLOW}Checking for empty catch blocks...${NC}"
EMPTY_CATCH=$(grep -r "catch.*{[[:space:]]*}" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
if [ "$EMPTY_CATCH" -gt "0" ]; then
  echo "  Found $EMPTY_CATCH empty catch blocks (manual fix needed)"
  grep -rn "catch.*{[[:space:]]*}" src --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 | while read line; do
    echo "    - $line"
  done
else
  echo "  ✅ No empty catch blocks found"
fi

# Fix unnecessary escape characters in regex
echo -e "\n${YELLOW}Checking for unnecessary escapes...${NC}"
ESCAPE_FILES=$(npm run lint 2>&1 | grep -c "Unnecessary escape" || echo "0")
if [ "$ESCAPE_FILES" -gt "0" ]; then
  echo "  Found in $ESCAPE_FILES files (auto-fixable)"
else
  echo "  ✅ No unnecessary escapes found"
fi

# ============================================================================
# PHASE 5: TYPE SAFETY IMPROVEMENTS
# ============================================================================

echo -e "\n${CYAN}📝 PHASE 5: Type safety analysis${NC}"
echo "─────────────────────────────────────────────────"

# Count 'any' usages
ANY_COUNT=$(grep -r ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo -e "Files using 'any' type: ${YELLOW}$ANY_COUNT${NC} occurrences"

# Files with most 'any' usage
echo -e "\nTop files with 'any' usage:"
grep -rc ": any" src --include="*.ts" --include="*.tsx" 2>/dev/null | \
  sort -t: -k2 -nr | head -10 | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    count=$(echo "$line" | cut -d: -f2)
    if [ "$count" -gt "3" ]; then
      echo "  $count any's in $(basename "$file")"
    fi
  done || echo "  (Could not analyze)"

# ============================================================================
# PHASE 6: REACT HOOKS VIOLATIONS (Critical - Manual Fix Needed)
# ============================================================================

echo -e "\n${CYAN}⚠️  PHASE 6: React Hooks Violations (CRITICAL)${NC}"
echo "─────────────────────────────────────────────────"

HOOKS_VIOLATIONS=$(npm run lint 2>&1 | grep -c "react-hooks/rules-of-hooks" || echo "0")
if [ "$HOOKS_VIOLATIONS" -gt "0" ]; then
  echo -e "  Found ${RED}$HOOKS_VIOLATIONS${NC} React hooks violations:"
  npm run lint 2>&1 | grep "react-hooks/rules-of-hooks" | head -5 | while read line; do
    echo "    - $line"
  done
else
  echo "  ✅ No React hooks violations found!"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Final error count
FINAL=$(npm run lint 2>&1 | grep -o "[0-9]* problems" | grep -o "[0-9]*" | head -1 || echo "0")

if [ "$BEFORE" != "0" ] && [ "$FINAL" != "0" ]; then
  FIXED=$((BEFORE - FINAL))
  echo -e "Starting problems: ${RED}$BEFORE${NC}"
  echo -e "Remaining problems: ${YELLOW}$FINAL${NC}"
  if [ "$FIXED" -gt "0" ]; then
    echo -e "Auto-fixed:       ${GREEN}$FIXED${NC}"
  else
    echo -e "Auto-fixed:       ${YELLOW}0${NC} (may need manual fixes)"
  fi
fi

echo -e "\n${YELLOW}Manual fixes still needed:${NC}"
if [ "$HOOKS_VIOLATIONS" -gt "0" ]; then
  echo "  ⚠️  React hooks violations (conditional hooks)"
fi
if [ "$EMPTY_CATCH" -gt "0" ]; then
  echo "  ⚠️  Empty catch blocks (add error handling)"
fi
if [ "$ANY_COUNT" -gt "100" ]; then
  echo "  ⚠️  Many 'any' types (replace with proper types)"
fi

echo -e "\n${GREEN}Next steps:${NC}"
echo "  1. Run: npm run build (check for type errors)"
echo "  2. Run: npm run test (ensure nothing broke)"
if [ "$HOOKS_VIOLATIONS" -gt "0" ]; then
  echo "  3. Fix React hooks violations manually"
fi
echo "  4. Commit changes: git add -A && git commit -m 'chore: auto-fix lint issues'"

echo -e "\n${GREEN}Done!${NC}"
