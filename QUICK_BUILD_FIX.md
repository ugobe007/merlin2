# 🔧 Quick Build Fix

## Problem
You're running `npm run build` from the **root directory (`/`)** instead of the project directory.

## Error You're Seeing
```bash
Roberts-MacBook-Air-2:/ robertchristopher$ npm run build
npm error code ENOENT
npm error path /package.json
npm error errno -2
npm error enoent Could not read package.json
```

## Solution

### Always navigate to project directory FIRST:

```bash
# ❌ WRONG - You're in root directory (/)
Roberts-MacBook-Air-2:/ robertchristopher$ npm run build

# ✅ CORRECT - Navigate to project first
cd /Users/robertchristopher/merlin3
npm run build
```

## Quick Commands

### Build the project:
```bash
cd /Users/robertchristopher/merlin3
npm run build
```

### Run dev server:
```bash
cd /Users/robertchristopher/merlin3
npm run dev
```

### Deploy to Fly.io:
```bash
cd /Users/robertchristopher/merlin3
flyctl deploy
```

### Check current directory:
```bash
pwd
# Should show: /Users/robertchristopher/merlin3
# NOT: /
```

## Your Terminal Prompt Explained

```bash
Roberts-MacBook-Air-2:/ robertchristopher$
                      ^
                      This shows current directory
```

- `/` = Root directory (WRONG - no package.json here!)
- `/Users/robertchristopher/merlin3` = Project directory (CORRECT!)

## How to Fix Right Now

```bash
# 1. Navigate to project
cd ~/merlin3

# OR full path:
cd /Users/robertchristopher/merlin3

# 2. Verify you're in right place
pwd
ls package.json  # Should exist!

# 3. Now run commands
npm run build
npm run dev
```

---

**TIP:** Create an alias in your `~/.zshrc` to jump to project quickly:
```bash
echo 'alias merlin="cd /Users/robertchristopher/merlin3"' >> ~/.zshrc
source ~/.zshrc

# Now you can just type:
merlin
npm run build
```
