#!/bin/bash
# Batch process files with ESLint auto-fixer
# Processes files in batches to avoid timeouts

BATCH_SIZE=10
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Get all TypeScript files
FILES=$(find src -name "*.ts" -o -name "*.tsx" | sort)

TOTAL=$(echo "$FILES" | wc -l | tr -d ' ')
BATCH_NUM=0
PROCESSED=0
FIXED_TOTAL=0

echo "🔧 Batch ESLint Auto-Fixer"
echo "📁 Total files: $TOTAL"
echo "📦 Batch size: $BATCH_SIZE"
echo ""

# Process files in batches
echo "$FILES" | while IFS= read -r file; do
  if [ -z "$file" ]; then
    continue
  fi
  
  # Process batch
  if [ $((PROCESSED % BATCH_SIZE)) -eq 0 ]; then
    BATCH_NUM=$((BATCH_NUM + 1))
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Batch $BATCH_NUM (files $((PROCESSED + 1))-$((PROCESSED + BATCH_SIZE)))"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  fi
  
  # Run auto-fixer on this file
  node scripts/fix-lint-errors.js --file="$file" > /dev/null 2>&1
  
  PROCESSED=$((PROCESSED + 1))
  
  # Show progress every 10 files
  if [ $((PROCESSED % 10)) -eq 0 ]; then
    echo "  ✓ Processed $PROCESSED/$TOTAL files..."
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Batch processing complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
