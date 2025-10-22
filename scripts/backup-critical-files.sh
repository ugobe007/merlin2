#!/bin/bash

# Backup Critical Files Script
# This creates timestamped backups of critical files to prevent corruption

BACKUP_DIR=".backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# List of critical files to backup
CRITICAL_FILES=(
  "src/components/BessQuoteBuilder.tsx"
  "src/components/AuthModal.tsx"
  "src/components/wizard/SmartWizardModal.tsx"
  "src/services/authService.ts"
  "src/services/currencyService.ts"
)

echo "🔒 Creating backup at $TIMESTAMP..."

# Backup each critical file
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Create directory structure in backup
    dir=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$TIMESTAMP/$dir"
    
    # Copy file to backup
    cp "$file" "$BACKUP_DIR/$TIMESTAMP/$file"
    echo "✅ Backed up: $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✨ Backup complete in $BACKUP_DIR/$TIMESTAMP/"

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t | tail -n +11 | xargs rm -rf 2>/dev/null
echo "🧹 Cleaned old backups (keeping last 10)"
