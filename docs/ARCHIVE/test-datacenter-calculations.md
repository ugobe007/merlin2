# Data Center Calculation Test Plan

## Issue
Production site (merlin2-fly.dev) is recommending only 2MW for a 100MW data center, which is drastically undersized.

## Root Cause Analysis

### Potential Issues:
1. **Default fallback value**: Line 660 in SmartWizardV2.tsx uses `parseFloat(useCaseData.capacity) || 5` which defaults to 5MW if parsing fails
2. **Baseline template**: Default is 10MW / 6hr for data centers (line 840)
3. **Missing capacity input**: User input for capacity might not be captured correctly

## Expected Results for 100MW Data Center

### Tier III Data Center (Standard):
- **BESS Size**: 50MW / 3hr (50% of capacity with 3-hour backup)
- **Generator**: 20MW (20% of capacity)
- **Solar**: 1-2MW (limited by roof space for cooling)
- **Configuration**: "50MW / 3hr BESS + 20MW Generator + Optional 1.5MW Solar"

### Tier IV Data Center (High Reliability):
- **BESS Size**: 60MW / 4hr (60% of capacity with 4-hour backup)
- **Generator**: 30MW (30% of capacity)
- **Solar**: Off-site PPA recommended
- **Configuration**: "60MW / 4hr BESS + 30MW Generator + Optional Off-site Solar PPA"

### Microgrid Data Center:
- **BESS Size**: 80MW / 6hr (80% of capacity with 6-hour backup)
- **Generator**: 30MW (30% of capacity)
- **Solar**: 1.5MW (space constrained)
- **Configuration**: "80MW / 6hr BESS + 30MW Generator + Optional 1.5MW Solar"

## Test Cases

### Test 1: Direct Capacity Input
```
Industry: Data Center
Capacity: 100 MW
Grid Connection: Single
Uptime Requirement: Tier III
```
**Expected**: ~50MW / 3hr BESS

### Test 2: Square Footage Input
```
Industry: Data Center
Square Footage: 666,667 sq ft
Power Density: 150 W/sq ft
Grid Connection: Single
Uptime Requirement: Tier III
```
**Calculated Capacity**: (666,667 * 150) / 1,000,000 = 100MW
**Expected**: ~50MW / 3hr BESS

### Test 3: Tier IV High Reliability
```
Industry: Data Center
Capacity: 100 MW
Grid Connection: Redundant
Uptime Requirement: Tier IV
```
**Expected**: ~60MW / 4hr BESS

### Test 4: Microgrid Architecture
```
Industry: Data Center
Capacity: 100 MW
Grid Connection: Microgrid
Uptime Requirement: Tier III
```
**Expected**: ~80MW / 6hr BESS

## Local Testing Steps

### 1. Start Development Server
```bash
cd /Users/robertchristopher/merlin2
npm run dev
```

### 2. Open Smart Wizard
- Navigate to http://localhost:5173
- Click "Smart Wizard" or "Get Started"

### 3. Run Test Case 1
- **Step 1**: Select "Data Center" template
- **Step 2**: Fill in questionnaire:
  - Capacity: 100 MW
  - Grid Connection: Single Grid Connection
  - Uptime Requirement: Tier III
  - Cooling: Air-cooled
- **Step 3**: Check recommended BESS size
- **Expected**: Should show 50MW / 3hr, NOT 2MW

### 4. Verify Calculations
- Check console for any errors
- Verify `useCaseData.capacity` is being captured as `100`
- Verify calculation: `capacity * 0.5 = 50MW`

### 5. Test Other Scenarios
- Repeat with Tier IV (should get 60MW)
- Repeat with Microgrid (should get 80MW)
- Test with square footage input

## Code Verification Checklist

- [ ] Line 660: Verify default fallback is reasonable (currently 5MW)
- [ ] Line 673-688: Verify data center calculation logic
- [ ] Lines 331-390 (industryQuestionnaires.ts): Verify capacity input is defined
- [ ] Verify useCaseData object structure in Step 2
- [ ] Check if there's a units conversion issue (kW vs MW)

## Debugging Commands

```bash
# Check for TypeScript errors
npm run type-check

# Check for console errors in browser
# Open DevTools → Console tab

# Check calculation values
# Add console.log in SmartWizardV2.tsx line 660:
console.log('Data Center Capacity:', useCaseData.capacity, 'Parsed:', parseFloat(useCaseData.capacity));
```

## Production Deployment After Fix

```bash
# 1. Build production version
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to Fly.io
fly deploy

# 4. Verify on production
# Navigate to https://merlin2-fly.dev
# Run same test cases
```

## Success Criteria

✅ **Pass**: 100MW data center gets 50MW+ BESS recommendation
❌ **Fail**: 100MW data center gets <10MW BESS recommendation

## Notes

- Data center power density: 150 W/sq ft (line 86)
- Baseline template: 10MW / 6hr (line 840)
- Industry standard: 50-80% of capacity for BESS sizing
- Tier III = 99.982% uptime requirement
- Tier IV = 99.995% uptime requirement
