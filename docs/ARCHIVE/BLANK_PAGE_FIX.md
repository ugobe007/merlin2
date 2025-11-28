# 🔧 Blank Page Troubleshooting

## Issue: `http://localhost:5178` shows blank page

### Quick Fixes (Try in order):

1. **Hard Refresh the Browser**
   - **Chrome/Edge**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Firefox**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - **Safari**: Press `Cmd+Option+R` (Mac)

2. **Clear Browser Cache**
   - Open DevTools: `F12` or `Right-click → Inspect`
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Check Browser Console**
   - Press `F12` to open DevTools
   - Click "Console" tab
   - Look for red error messages
   - Take a screenshot if you see errors

4. **Check Network Tab**
   - Press `F12` to open DevTools
   - Click "Network" tab
   - Refresh the page
   - Look for failed requests (red text)

5. **Try Different Browser**
   - If using Chrome, try Firefox or Safari
   - This helps determine if it's browser-specific

6. **Restart Dev Server**
   - In VS Code terminal, press `Ctrl+C` to stop server
   - Run: `npm run dev`
   - Wait for "ready in XXX ms" message
   - Refresh browser

7. **Check if Port is Correct**
   - Server is running on: **http://localhost:5178**
   - Make sure you're visiting the correct port
   - Not 5176, 5177, or 3000

---

## Common Causes & Solutions

### Cause 1: Browser Cache
**Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Cause 2: JavaScript Error
**Solution**: 
1. Open browser console (F12)
2. Look for errors
3. Share the error message for help

### Cause 3: Wrong Port
**Solution**: 
- Check terminal output
- Look for: `Local: http://localhost:XXXX/`
- Use that exact URL

### Cause 4: CSS Not Loading
**Symptoms**: See text but no styling
**Solution**: 
1. Check if `/src/index.css` exists
2. Hard refresh browser
3. Clear Tailwind cache: `rm -rf node_modules/.cache`

### Cause 5: Module Import Error
**Symptoms**: Console shows "Failed to resolve import"
**Solution**:
1. Check the error message
2. Verify file exists
3. Check import path is correct

---

## What to Check in Browser Console

Open DevTools (F12) and look for:

### ❌ Bad Signs:
```
Uncaught Error: ...
Failed to resolve import ...
Cannot find module ...
Unexpected token ...
```

### ✅ Good Signs:
```
[vite] connected.
```

---

## Verification Steps

Run these in order:

### 1. Check Server is Running
In terminal, you should see:
```
VITE v5.4.20  ready in XXX ms
➜  Local:   http://localhost:5178/
```

### 2. Visit Correct URL
Make sure it's: **http://localhost:5178** (not 5176 or 5177)

### 3. Check DevTools Console
- Press F12
- Click Console tab
- Should see: `[vite] connected.`
- If you see errors, share them

### 4. Check Network Tab
- Press F12
- Click Network tab  
- Refresh page
- Look for any red (failed) requests

---

## Nuclear Option (If Nothing Works)

If page is still blank after trying everything:

```bash
# Stop the dev server (Ctrl+C)

# Clear all caches and rebuild
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist

# Restart dev server
npm run dev
```

Then:
1. Close ALL browser tabs for localhost:5178
2. Open a NEW incognito/private window
3. Visit http://localhost:5178

---

## Expected Behavior

When working correctly, you should see:

1. **Main App**: BESS Quote Builder interface
2. **Admin Button**: Purple "🧙‍♂️ Admin" button in top-right
3. **Styling**: Dark theme with purple/blue gradients
4. **No Console Errors**: Clean console in DevTools

---

## What to Report if Still Broken

If page is still blank, please share:

1. **Browser & Version**: Chrome 120? Firefox 121? Safari 17?
2. **Console Errors**: Screenshot of Console tab (F12)
3. **Network Errors**: Screenshot of Network tab showing failed requests
4. **Terminal Output**: Any error messages in VS Code terminal
5. **What you see**: Completely blank? White screen? Any text?

---

## Most Likely Fix

**99% of the time, it's a cache issue.**

Try this:
1. Open **NEW** incognito/private window
2. Visit http://localhost:5178
3. If it works in incognito, it's definitely cache
4. Solution: Clear browser cache or use incognito

---

**Quick Test**: Can you open http://localhost:5178 in an **incognito window**?
- If YES → It's a cache issue, clear your regular browser cache
- If NO → Check browser console for errors
