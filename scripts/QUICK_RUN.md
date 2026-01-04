# Quick Run Instructions

## 🚀 Fastest Way to Run Diagnostic

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Open Browser
Navigate to: http://localhost:5173

### Step 3: Complete Wizard
- Go through Steps 1-5 (or at least to Step 5 where calculations happen)
- Or navigate directly to Step 6 (Quote page)

### Step 4: Run Diagnostic

**Option A: Copy from file**
```bash
# On Mac:
cat scripts/wizard-diagnostic-enhanced.js | pbcopy

# On Linux:
cat scripts/wizard-diagnostic-enhanced.js | xclip -selection clipboard

# On Windows (PowerShell):
Get-Content scripts/wizard-diagnostic-enhanced.js | Set-Clipboard
```

Then:
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Paste (Cmd+V / Ctrl+V)
4. Press Enter

**Option B: Load from file**
```javascript
// In browser console:
fetch('/scripts/wizard-diagnostic-enhanced.js')
  .then(r => r.text())
  .then(eval);
```

**Option C: Bookmarklet**
1. Copy the `javascript:` line from `scripts/wizard-diagnostic-bookmarklet.js`
2. Create a bookmark with that URL
3. Click bookmark when on wizard page

### Step 5: Export Results (Optional)
```javascript
// In console after diagnostic runs:
exportDiagnosticJSON()
```

This downloads a JSON file with all diagnostic data.

---

## 📋 What You'll See

The diagnostic will show:
- ✅/⚠️/❌ Status for each step
- BESS calculation analysis
- Data flow validation
- Storage checks
- Data integrity checks
- Summary of issues and warnings

---

## 🔍 Access Debug Data

After running, access:
```javascript
window.__MERLIN_DEBUG_STATE__    // Full wizard state
window.__MERLIN_DEBUG_RESULTS__  // Diagnostic results
```
