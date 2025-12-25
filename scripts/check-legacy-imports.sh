#!/bin/bash
# Check for legacy StreamlinedWizard imports in active codebase

echo "🔍 Checking for legacy StreamlinedWizard imports..."
echo ""

# Find all files that import StreamlinedWizard (excluding legacy folders)
FILES=$(grep -r "StreamlinedWizard" src/ --include="*.ts" --include="*.tsx" | \
  grep -v "legacy/" | \
  grep -v "archive/" | \
  grep -v "node_modules/" | \
  cut -d: -f1 | sort -u)

if [ -z "$FILES" ]; then
  echo "✅ No active StreamlinedWizard imports found!"
  exit 0
else
  echo "⚠️  Found StreamlinedWizard references in active code:"
  echo ""
  for file in $FILES; do
    echo "  - $file"
    grep -n "StreamlinedWizard" "$file" | sed 's/^/    /'
  done
  echo ""
  echo "❌ These files need to be migrated to WizardV5"
  exit 1
fi

