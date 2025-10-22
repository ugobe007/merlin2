#!/bin/bash

# Restore from Backup Script

BACKUP_DIR=".backups"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ No backup directory found!"
  exit 1
fi

# List available backups
echo "📦 Available backups:"
echo ""
ls -t "$BACKUP_DIR" | nl

echo ""
echo "Enter the number of the backup to restore (or 'q' to quit):"
read -r choice

if [ "$choice" = "q" ]; then
  echo "👋 Cancelled"
  exit 0
fi

# Get the selected backup
backup=$(ls -t "$BACKUP_DIR" | sed -n "${choice}p")

if [ -z "$backup" ]; then
  echo "❌ Invalid selection"
  exit 1
fi

echo ""
echo "⚠️  This will restore files from: $backup"
echo "Current files will be backed up to .backups/pre-restore_$(date +"%Y%m%d_%H%M%S")"
echo ""
echo "Continue? (y/N)"
read -r confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "👋 Cancelled"
  exit 0
fi

# Create pre-restore backup
./scripts/backup-critical-files.sh

# Restore files
echo "🔄 Restoring files from $backup..."
cp -r "$BACKUP_DIR/$backup/"* .
echo "✅ Files restored!"
echo ""
echo "💡 Run 'git status' to see what changed"
echo "💡 Run 'git diff' to see the differences"
