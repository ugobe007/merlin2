# Backup & Restore Scripts

## Overview
These scripts help prevent file corruption and provide easy recovery options.

## Usage

### Create a Backup
Run this before making major changes:
```bash
./scripts/backup-critical-files.sh
```

This will:
- Create a timestamped backup in `.backups/`
- Backup all critical files (BessQuoteBuilder, AuthModal, etc.)
- Keep last 10 backups automatically

### Restore from Backup
If something gets corrupted:
```bash
./scripts/restore-from-backup.sh
```

This will:
- Show you a list of available backups
- Let you choose which one to restore
- Create a backup of current state before restoring
- Copy the selected backup files back

## Automatic Backups

### Add to your workflow:
Before building or deploying, run:
```bash
./scripts/backup-critical-files.sh && npm run build
```

### Add to package.json scripts:
```json
{
  "scripts": {
    "backup": "./scripts/backup-critical-files.sh",
    "safe-build": "./scripts/backup-critical-files.sh && npm run build",
    "safe-deploy": "./scripts/backup-critical-files.sh && npm run build && flyctl deploy"
  }
}
```

Then use:
```bash
npm run safe-build
npm run safe-deploy
```

## Protected Files

Currently backing up:
- `src/components/BessQuoteBuilder.tsx` (Main app)
- `src/components/AuthModal.tsx` (Login/signup)
- `src/components/wizard/SmartWizardModal.tsx` (Wizard)
- `src/services/authService.ts` (Auth logic)
- `src/services/currencyService.ts` (Currency conversion)

To add more files, edit `scripts/backup-critical-files.sh` and add to the `CRITICAL_FILES` array.

## Git Integration

`.gitattributes` has been configured to:
- Ensure consistent line endings (LF)
- Prevent merge conflicts
- Handle binary files correctly

## Recovery from Git

You can also use git tags for recovery:
```bash
# See all tags
git tag

# Restore to a specific tag
git checkout v1.0-currency-working

# Or create a new branch from a tag
git checkout -b recovery v1.0-currency-working
```

## Best Practices

1. **Before major changes:** `npm run backup`
2. **After successful changes:** Create a git tag
3. **Regular commits:** Commit working code frequently
4. **Test locally first:** Use `npm run dev` before deploying

## Troubleshooting

### "Ghost in the machine" issues are usually caused by:

1. **Merge conflicts** - Fixed with `.gitattributes`
2. **Multiple editors** - Make sure VS Code extensions aren't auto-reformatting
3. **Git pulling old code** - Check your current branch: `git branch`
4. **Cache issues** - Clear with: `rm -rf node_modules dist && npm install`

### Quick Recovery Commands:

```bash
# See what changed
git status
git diff

# Undo uncommitted changes
git restore <filename>

# Go back to last commit
git reset --hard HEAD

# Go back to tagged version
git reset --hard v1.0-currency-working
```
