#!/bin/bash

# Merlin3 Cleanup Script
# Provides various codebase cleanup and analysis commands

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Full structure audit
audit() {
    print_header "📊 FULL STRUCTURE AUDIT"
    
    echo -e "${GREEN}Directory Structure:${NC}"
    find src -type d | sort | head -30
    
    echo -e "\n${GREEN}File Counts by Type:${NC}"
    echo "TypeScript files: $(find src -name '*.ts' -o -name '*.tsx' | wc -l | tr -d ' ')"
    echo "Test files: $(find src tests -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' 2>/dev/null | wc -l | tr -d ' ')"
    echo "Component files: $(find src -name '*.tsx' | wc -l | tr -d ' ')"
    
    echo -e "\n${GREEN}Largest Directories:${NC}"
    du -sh src/* 2>/dev/null | sort -hr | head -10
    
    echo -e "\n${GREEN}Import Analysis:${NC}"
    echo "Total imports: $(grep -r "^import" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')"
    
    echo -e "\n${GREEN}Export Analysis:${NC}"
    echo "Total exports: $(grep -r "^export" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')"
}

# Find deprecated folders
deprecated() {
    print_header "🗑️  DEPRECATED FOLDERS"
    
    echo -e "${YELLOW}Checking for common deprecated patterns:${NC}\n"
    
    # Check for common deprecated folder names
    deprecated_patterns=("old" "legacy" "deprecated" "backup" "archive" "temp" "tmp" "src 2")
    
    for pattern in "${deprecated_patterns[@]}"; do
        if find . -type d -iname "*$pattern*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | grep -q .; then
            echo -e "${RED}Found:${NC}"
            find . -type d -iname "*$pattern*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null
            echo ""
        fi
    done
    
    # Check for duplicate src folders
    if [ -d "src 2" ]; then
        echo -e "${RED}⚠️  Found duplicate 'src 2' directory${NC}"
        echo "Size: $(du -sh 'src 2' 2>/dev/null | cut -f1)"
    fi
    
    echo -e "\n${GREEN}No deprecated folders found (or all checked)${NC}"
}

# Find large files
large_files() {
    print_header "📏 LARGE FILES (>500 lines)"
    
    echo -e "${YELLOW}Searching for files with more than 500 lines...${NC}\n"
    
    find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -exec sh -c 'lines=$(wc -l < "$1" | tr -d " "); if [ "$lines" -gt 500 ]; then echo "$lines $1"; fi' _ {} \; \
        | sort -rn \
        | head -20 \
        | while read lines file; do
            echo -e "${RED}$lines lines${NC} - $file"
        done
    
    echo -e "\n${GREEN}Large file analysis complete${NC}"
}

# Find dead code (unused exports)
dead_code() {
    print_header "💀 DEAD CODE ANALYSIS (Unused Exports)"
    
    echo -e "${YELLOW}Note: This is a basic analysis. For comprehensive analysis, use tools like ts-prune or depcheck${NC}\n"
    
    # Find all exports
    echo -e "${GREEN}Analyzing exports...${NC}"
    
    # Count named exports
    named_exports=$(grep -r "^export " src --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "export default" | wc -l | tr -d ' ')
    default_exports=$(grep -r "^export default" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    
    echo "Named exports: $named_exports"
    echo "Default exports: $default_exports"
    
    echo -e "\n${YELLOW}For detailed unused export detection, consider:${NC}"
    echo "  npm install -g ts-prune"
    echo "  ts-prune"
    echo ""
    echo "  or"
    echo ""
    echo "  npm install -g depcheck"
    echo "  depcheck"
}

# Find duplicate code
duplicates() {
    print_header "🔄 DUPLICATE CODE ANALYSIS"
    
    echo -e "${YELLOW}Checking for potential code duplication...${NC}\n"
    
    # Find files with similar names (potential duplicates)
    echo -e "${GREEN}Files with similar names:${NC}"
    find src -type f -name "*.ts" -o -name "*.tsx" | \
        sed 's|.*/||' | \
        sort | \
        uniq -d | \
        while read name; do
            echo -e "${YELLOW}Potential duplicate: $name${NC}"
            find src -name "$name" 2>/dev/null
            echo ""
        done
    
    echo -e "\n${YELLOW}For comprehensive duplicate detection, consider:${NC}"
    echo "  npm install -g jscpd"
    echo "  jscpd src --min-lines 10 --min-tokens 50"
}

# Dependency analysis
deps() {
    print_header "📦 DEPENDENCY ANALYSIS"
    
    echo -e "${GREEN}Installed Dependencies:${NC}"
    echo "Production: $(npm list --depth=0 --prod 2>/dev/null | grep -E '^[├└]' | wc -l | tr -d ' ') packages"
    echo "Development: $(npm list --depth=0 --dev 2>/dev/null | grep -E '^[├└]' | wc -l | tr -d ' ') packages"
    
    echo -e "\n${GREEN}Outdated Packages:${NC}"
    npm outdated 2>/dev/null || echo "All packages up to date (or npm outdated failed)"
    
    echo -e "\n${GREEN}Unused Dependencies:${NC}"
    echo -e "${YELLOW}Run 'npx depcheck' for detailed unused dependency analysis${NC}"
    
    echo -e "\n${GREEN}Package Sizes:${NC}"
    if command -v du >/dev/null 2>&1; then
        du -sh node_modules/* 2>/dev/null | sort -hr | head -10 || echo "Could not analyze node_modules"
    fi
}

# Clean build artifacts
clean() {
    print_header "🧹 CLEANING BUILD ARTIFACTS"
    
    echo -e "${YELLOW}Removing build artifacts...${NC}\n"
    
    # Remove common build artifacts
    artifacts=(
        "dist"
        ".turbo"
        "node_modules/.vite"
        "coverage"
        ".nyc_output"
        "*.log"
        ".cache"
    )
    
    for artifact in "${artifacts[@]}"; do
        if [ -e "$artifact" ] || [ -d "$artifact" ] 2>/dev/null; then
            echo -e "${RED}Removing: $artifact${NC}"
            rm -rf "$artifact" 2>/dev/null || true
        fi
    done
    
    # Clean TypeScript build info
    find . -name "tsconfig.tsbuildinfo" -type f -delete 2>/dev/null || true
    
    echo -e "\n${GREEN}✓ Build artifacts cleaned${NC}"
}

# Run everything
full() {
    print_header "🚀 RUNNING FULL CLEANUP & ANALYSIS"
    
    audit
    deprecated
    large_files
    dead_code
    duplicates
    deps
    
    echo -e "\n${YELLOW}Note: 'clean' was not run automatically. Run './scripts/cleanup.sh clean' manually if needed.${NC}"
}

# Main command handler
case "${1:-}" in
    audit)
        audit
        ;;
    deprecated)
        deprecated
        ;;
    large-files)
        large_files
        ;;
    dead-code)
        dead_code
        ;;
    duplicates)
        duplicates
        ;;
    deps)
        deps
        ;;
    clean)
        clean
        ;;
    full)
        full
        ;;
    *)
        echo -e "${RED}Usage: $0 <command>${NC}"
        echo ""
        echo "Commands:"
        echo "  audit        - Full structure audit"
        echo "  deprecated   - Find deprecated folders"
        echo "  large-files  - Files over 500 lines"
        echo "  dead-code    - Unused exports"
        echo "  duplicates   - Duplicate code"
        echo "  deps         - Dependency analysis"
        echo "  clean        - Remove build artifacts"
        echo "  full         - Run everything"
        exit 1
        ;;
esac
