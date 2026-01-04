# Merlin Wizard Diagnostic Tools

Comprehensive diagnostic and validation scripts for the Merlin Wizard application.

## 📁 Files

1. **`wizard-diagnostic-enhanced.js`** - Full-featured diagnostic script (recommended)
2. **`wizard-diagnostic-bookmarklet.js`** - Bookmarklet version (one-click access)
3. **`wizard-diagnostic.js`** - Original version (legacy)

## 🚀 Quick Start

### Method 1: Enhanced Script (Recommended)

1. Open the Merlin wizard in your browser
2. Navigate to **Step 5 (System)** or **Step 6 (Quote)**
3. Open DevTools (`F12` or `Cmd+Option+I` on Mac)
4. Go to the **Console** tab
5. Copy the entire contents of `wizard-diagnostic-enhanced.js`
6. Paste into the console and press **Enter**

### Method 2: Bookmarklet (One-Click)

1. Open `wizard-diagnostic-bookmarklet.js`
2. Copy the entire line starting with `javascript:`
3. Create a new bookmark in your browser
4. Edit the bookmark:
   - **Name**: `Merlin Diagnostic`
   - **URL**: Paste the copied `javascript:` code
5. When on the wizard page, click the bookmark to run diagnostics

### Method 3: Load from File

```javascript
// In browser console:
fetch('/scripts/wizard-diagnostic-enhanced.js')
  .then(r => r.text())
  .then(eval);
```

## ✨ Features

### Enhanced State Detection
- ✅ Multiple detection methods (global, localStorage, React fiber traversal)
- ✅ Supports React 16, 17, and 18
- ✅ React DevTools integration
- ✅ Fallback methods for edge cases

### Comprehensive Diagnostics

#### Step-by-Step Validation
- **Step 1**: Location, ZIP code, goals, solar data
- **Step 2**: Industry selection and name
- **Step 3**: Facility details, useCaseData, industry-specific fields
- **Step 4**: Options (solar/EV/generator), tiers, custom values
- **Step 5**: Power level selection

#### Calculation Validation
- BESS power and energy (with duration calculation)
- Financial metrics (investment, savings, payback, ROI)
- ITC validation
- Ratio checks (e.g., BESS duration)

#### Storage Checks
- localStorage persistence
- sessionStorage step tracking
- State synchronization validation

#### Data Integrity
- NaN and Infinity detection
- Circular reference detection
- JSON serialization validation

#### Performance Checks
- State object size
- useCaseData field count
- Memory usage warnings

### Industry-Specific Validation

The script checks for required fields based on industry:
- **Data Center**: `rackCount`, `tier`, `squareFootage`, `estimatedAnnualKwh`
- **Hotel**: `roomCount`, `squareFootage`, `estimatedAnnualKwh`
- **Hospital**: `bedCount`, `squareFootage`, `estimatedAnnualKwh`
- **Manufacturing**: `squareFootage`, `estimatedAnnualKwh`, `peakDemandKw`
- And more...

### JSON Export

After running diagnostics, export results as JSON:

```javascript
// In console:
exportDiagnosticJSON()
```

This downloads a JSON file containing:
- Full wizard state
- All diagnostic results
- Summary of issues and warnings
- Timestamp and URL
- User agent

## 📊 Output Format

The diagnostic script provides:

1. **Color-coded status indicators**:
   - ✅ Green: Pass
   - ⚠️ Yellow: Warning
   - ❌ Red: Critical issue

2. **Detailed analysis**:
   - Step-by-step data flow
   - BESS calculation breakdown
   - Root cause analysis for failures
   - Storage and integrity checks

3. **Summary**:
   - Count of critical issues
   - Count of warnings
   - Overall status (PASS/WARN/FAIL)

## 🔍 Troubleshooting

### "Could not find wizard state"

**Possible causes:**
1. Not on the wizard page
2. Wizard hasn't initialized yet
3. React state not accessible
4. React version not supported

**Solutions:**
1. Navigate to Step 5 or Step 6
2. Refresh the page and try again
3. Check React DevTools
4. Try the bookmarklet version
5. Check browser console for errors

### State found but calculations are zero

**Common causes:**
1. `useCaseData` is empty (data in `facilityDetails` instead)
2. `estimatedAnnualKwh` is missing or zero
3. Calculation engine not triggered
4. Power level not selected

**Solutions:**
1. Check Step 3 is writing to `useCaseData`
2. Verify `estimatedAnnualKwh` is set
3. Navigate to Step 5 to trigger calculations
4. Select a power level

## 🛠️ Advanced Usage

### Access Debug Data

After running diagnostics, access the data:

```javascript
// Full wizard state
window.__MERLIN_DEBUG_STATE__

// Diagnostic results
window.__MERLIN_DEBUG_RESULTS__

// Export as JSON
exportDiagnosticJSON()
```

### Custom Analysis

```javascript
const state = window.__MERLIN_DEBUG_STATE__;
const results = window.__MERLIN_DEBUG_RESULTS__;

// Check specific field
console.log(state.useCaseData?.estimatedAnnualKwh);

// Check calculations
console.log(state.calculations?.bessKW);

// Find all issues
const allIssues = Object.entries(results)
  .filter(([_, r]) => r.issues.length > 0)
  .map(([step, r]) => ({ step, issues: r.issues }));
```

## 📝 Example Output

```
🧙 MERLIN WIZARD ENHANCED DIAGNOSTIC
Searching for wizard state...
✅ Found wizard state via: localStorage: merlin-wizard-state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DATA FLOW CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
State found via: localStorage: merlin-wizard-state

✅ Step 1: Location

✅ Step 2: Industry

✅ Step 3: Details

✅ Step 4: Options

✅ Step 5: System

✅ Calculations

✅ Storage

✅ Data Integrity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔋 BESS CALCULATION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   BESS Power:  500 kW
   BESS Energy: 2000 kWh
   Duration:    4.00 hours
   Investment:  $1,250,000
   Savings:     $150,000/yr
   Payback:     8.3 years

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ✅ All critical checks passed!

   💾 State saved to window.__MERLIN_DEBUG_STATE__
   💾 Results saved to window.__MERLIN_DEBUG_RESULTS__
   📥 Run exportDiagnosticJSON() to download results as JSON
```

## 🔄 Version History

- **v2.0 (Enhanced)**: Added comprehensive checks, JSON export, improved state detection
- **v1.0 (Original)**: Basic diagnostic functionality

## 📄 License

Internal tool for Merlin Wizard development and debugging.

## 🤝 Contributing

When adding new diagnostic checks:
1. Add to appropriate step in `runDiagnostic()`
2. Update output in `printResults()`
3. Include in JSON export
4. Update this README

---

**Need help?** Check the console output for detailed error messages and suggested fixes.
