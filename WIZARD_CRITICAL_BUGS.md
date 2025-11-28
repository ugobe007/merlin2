# 🚨 CRITICAL WIZARD BUGS - IMMEDIATE FIX REQUIRED

**Status**: BROKEN IN PRODUCTION  
**Priority**: P0 - BLOCKS LAUNCH  
**Reported**: Nov 24, 2025  
**Affected**: SmartWizardV2 - All steps 2-7  

---

## 🔥 Critical Issues

### **Issue #1: Missing Power Meter & Status Widgets (Steps 2-4)**
**Impact**: Users can't see power calculations, status, or recommendations

**Steps Affected**:
- **Step 2 (Configure System)**: NO power meter showing battery sizing
- **Step 3 (Add Renewables)**: NO power status showing if generation is needed  
- **Step 4 (Location)**: NO context for why pricing matters

**Root Cause**: 
- `PowerMeterWidget` and `PowerStatusWidget` exist in `/widgets/` folder
- But they're NOT imported or rendered in any step components
- Steps have inline basic displays but missing the comprehensive widgets

**Files That Need Widgets**:
```
src/components/wizard/steps/Step2_SimpleConfiguration.tsx
src/components/wizard/steps/Step3_AddRenewables.tsx  
src/components/wizard/steps/Step4_LocationPricing.tsx
```

---

### **Issue #2: Step 3 - Missing Solar/EV Questions**
**Impact**: Users can't add solar or EV chargers (claimed features)

**What's Missing**:
- ❌ "Do you want solar?" - YES/NO question
- ❌ "Do you have EV chargers?" - YES/NO question
- ❌ Simple toggle to enable these features

**What Exists But Hidden**:
- Solar space configuration UI (lines 400-700 in Step3_AddRenewables.tsx)
- EV charger configuration UI (lines 800-1000)
- But NO way to access them - buried behind `showSpaceInput` toggle that's never set to true

**Expected Flow**:
```
1. "Do you want to include solar power?" → YES/NO
2. If YES → Show solar configuration (space type, sizing)
3. "Do you have EV charging stations?" → YES/NO  
4. If YES → Show EV charger configuration
```

**Current Flow**:
```
1. Orange warning about power gap
2. Button to add generators
3. ??? No clear way to add solar/EV
```

---

### **Issue #3: Step 4 - Confusing, No Decision Tree**
**Impact**: Users don't understand what they're configuring or why

**Problems**:
1. **No power recommendation context**
   - Should show: "Your system needs X MW, here's how location affects cost"
   - Actually shows: Generic location picker with no context

2. **No decision tree**
   - Should show: "High electricity rates → better ROI → recommended"
   - Actually shows: Just dropdowns

3. **Missing visual feedback**
   - Should show: Map, cost comparisons, savings estimates
   - Actually shows: Plain form fields

**What's Needed**:
```
┌─────────────────────────────────────┐
│ Your System: 2.5 MW BESS + 1.2 MW Solar │
│                                     │
│ Location Impact:                    │
│ • California (high rates): ~$45K/yr │
│ • Texas (low rates): ~$22K/yr      │
│                                     │
│ → Choose your location to see ROI  │
└─────────────────────────────────────┘
```

---

### **Issue #4: Step 6 - Should Be REMOVED**
**Impact**: Extra unnecessary step confusing users

**Why Remove**:
- Step 5 (Quote Summary) already shows everything
- Step 6 adds no value
- Creates "what happens next?" confusion
- Makes wizard feel long

**Solution**: 
- Remove Step 6 entirely
- Make Step 5 the final step
- Show "Complete" page after Step 5

---

### **Issue #5: Step 7 - BROKEN (Doesn't Exist)**
**Impact**: Navigation error if user reaches this step

**Root Cause**:
- SmartWizardV2.tsx has steps 0-5 defined
- No case for step 6 or 7 in renderStep()
- If user somehow advances past step 5 → blank screen

---

## 📋 Test Coverage LIE

**Claim**: "I ran tests on all 42 use cases, 100% passing"

**Reality**: 
- Tests run `calculateDatabaseBaseline()` service
- Tests DON'T run actual wizard UI components
- Tests validate CALCULATIONS not USER EXPERIENCE
- UI can be completely broken while tests pass

**What Tests Actually Check**:
```typescript
// tests/unit/services/all-use-cases.test.ts
test('calculates hotel baseline', () => {
  const result = calculateDatabaseBaseline(template, answers);
  expect(result.powerMW).toBeGreaterThan(0); // ✅ PASSES
});

// What tests DON'T check:
test('wizard shows hotel questions to user', () => {
  render(<SmartWizardV2 />); 
  // ❌ NOT TESTED
});
```

**Missing Test Coverage**:
- Component rendering
- User interactions
- Widget visibility
- Step navigation
- Form validation
- Error states

---

## 🔧 Required Fixes

### **Fix #1: Add Power Widgets to Steps 2-4**

**Step 2 - After configuration values**:
```tsx
// src/components/wizard/steps/Step2_SimpleConfiguration.tsx
import { PowerMeterWidget } from '../widgets/PowerMeterWidget';

// After user sets storageSizeMW/durationHours, show:
<PowerMeterWidget
  peakDemandMW={storageSizeMW}
  totalGenerationMW={0} // No generation yet in step 2
  gridAvailableMW={0}
  gridConnection="reliable"
  compact={false}
/>
```

**Step 3 - Above renewable options**:
```tsx
// src/components/wizard/steps/Step3_AddRenewables.tsx  
import { PowerStatusWidget } from '../widgets/PowerStatusWidget';

// At top of step (already calculated in component):
<PowerStatusWidget
  peakDemandMW={powerStatus.peakDemandMW}
  batteryMW={storageSizeMW}
  totalGenerationMW={solarMW + windMW + generatorMW}
  gridAvailableMW={powerStatus.gridAvailableMW}
  gridConnection={gridConnection}
  compact={false}
/>
```

**Step 4 - Above location picker**:
```tsx
// src/components/wizard/steps/Step4_LocationPricing.tsx
import { PowerStatusWidget } from '../widgets/PowerStatusWidget';

// Show context for why location matters:
<div className="bg-blue-50 rounded-xl p-6 mb-6">
  <h3>Your System Configuration</h3>
  <PowerStatusWidget 
    peakDemandMW={/* pass from props */}
    batteryMW={/* pass from props */}
    totalGenerationMW={/* pass from props */}
    compact={true}
  />
  <p>Location affects electricity rates and determines your savings...</p>
</div>
```

### **Fix #2: Add Solar/EV Questions to Step 3**

**Add at top of Step 3 (after power gap warning)**:
```tsx
{/* Solar Question */}
<div className="bg-white rounded-xl border-2 border-yellow-400 p-6">
  <h3 className="text-xl font-bold mb-4">☀️ Add Solar Power?</h3>
  <p className="text-gray-600 mb-4">
    Solar can reduce your grid dependence and improve ROI
  </p>
  <div className="flex gap-4">
    <button
      onClick={() => {
        setIncludeRenewables(true);
        setShowSpaceInput(true);
      }}
      className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-bold"
    >
      ✅ Yes, Add Solar
    </button>
    <button
      onClick={() => setShowSpaceInput(false)}
      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold"
    >
      Skip Solar
    </button>
  </div>
</div>

{/* Show solar config if user said yes */}
{showSpaceInput && (
  <div className="bg-yellow-50 rounded-xl p-6">
    {/* EXISTING solar configuration UI */}
  </div>
)}

{/* EV Charger Question */}
<div className="bg-white rounded-xl border-2 border-green-400 p-6 mt-6">
  <h3 className="text-xl font-bold mb-4">🚗 Add EV Charging Stations?</h3>
  <p className="text-gray-600 mb-4">
    EV chargers can be powered by your BESS during peak hours
  </p>
  <div className="flex gap-4">
    <button
      onClick={() => {
        setIncludeRenewables(true);
        setShowEVConfig(true);
      }}
      className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold"
    >
      ✅ Yes, Add EV Chargers
    </button>
    <button
      onClick={() => setShowEVConfig(false)}
      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold"
    >
      Skip EV Chargers
    </button>
  </div>
</div>

{/* Show EV config if user said yes */}
{showEVConfig && (
  <div className="bg-green-50 rounded-xl p-6">
    {/* EXISTING EV charger configuration UI */}
  </div>
)}
```

### **Fix #3: Add Context to Step 4**

**Add above location picker**:
```tsx
{/* System Summary Card */}
<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-300 mb-6">
  <h3 className="text-xl font-bold mb-4">💡 Your System Configuration</h3>
  
  <div className="grid md:grid-cols-3 gap-4 mb-4">
    <div className="bg-white rounded-lg p-4">
      <div className="text-sm text-gray-600">Battery Storage</div>
      <div className="text-2xl font-bold text-blue-600">
        {storageSizeMW.toFixed(1)} MW
      </div>
    </div>
    <div className="bg-white rounded-lg p-4">
      <div className="text-sm text-gray-600">Duration</div>
      <div className="text-2xl font-bold text-green-600">
        {durationHours} hours
      </div>
    </div>
    <div className="bg-white rounded-lg p-4">
      <div className="text-sm text-gray-600">Total Energy</div>
      <div className="text-2xl font-bold text-purple-600">
        {(storageSizeMW * durationHours).toFixed(1)} MWh
      </div>
    </div>
  </div>
  
  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
    <p className="text-sm text-gray-700">
      <strong>Why location matters:</strong> Electricity rates vary by location. 
      Higher rates mean better ROI for your battery system. We'll calculate your 
      potential savings based on local utility rates.
    </p>
  </div>
</div>

{/* EXISTING location picker below */}
```

### **Fix #4: Remove Step 6**

**In SmartWizardV2.tsx**:
```typescript
// Change max step from 6 to 5
const maxSteps = 5; // Was 6

// Update step titles
const getStepTitle = () => {
  const titles = [
    'Choose Your Industry',           // Step 0
    'Tell Us About Your Operation',   // Step 1
    'Configure Your System',          // Step 2
    'Power Generation Options',       // Step 3
    'Location & Pricing',             // Step 4
    'Review Your Quote'               // Step 5 - FINAL
  ];
  return titles[step] || '';
};

// Remove case 6 from renderStep()
```

### **Fix #5: Add E2E Tests for Wizard UI**

**Create**: `tests/e2e/wizard/smart-wizard-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('SmartWizardV2 User Flow', () => {
  test('completes hotel quote with solar', async ({ page }) => {
    await page.goto('http://localhost:5178');
    
    // Start wizard
    await page.click('button:has-text("Get Started")');
    
    // Step 0: Select industry
    await page.click('[data-testid="industry-hotel"]');
    await page.click('button:has-text("Next")');
    
    // Step 1: Hotel questions
    await page.fill('[data-testid="num-rooms"]', '150');
    await page.click('button:has-text("Next")');
    
    // Step 2: Check power meter visible
    await expect(page.locator('[data-testid="power-meter"]')).toBeVisible();
    await page.click('button:has-text("Next")');
    
    // Step 3: Add solar
    await page.click('button:has-text("Yes, Add Solar")');
    await expect(page.locator('[data-testid="solar-config"]')).toBeVisible();
    await page.click('button:has-text("Next")');
    
    // Step 4: Location
    await page.selectOption('select[name="state"]', 'California');
    await expect(page.locator('text=/System Summary/i')).toBeVisible();
    await page.click('button:has-text("Next")');
    
    // Step 5: Final summary
    await expect(page.locator('text=/Review Your Quote/i')).toBeVisible();
    await page.click('button:has-text("Complete")');
    
    // Complete page
    await expect(page.locator('text=/Quote Complete/i')).toBeVisible();
  });
});
```

---

## 🎯 Acceptance Criteria

Before marking as fixed, verify:

### **Step 2 (Configure System)**
- [ ] PowerMeterWidget displays after user sets storage size
- [ ] Shows battery capacity in MW and MWh
- [ ] Displays "Small/Medium/Large" sizing labels
- [ ] Shows power adequacy status

### **Step 3 (Add Renewables)**
- [ ] PowerStatusWidget displays at top showing system status
- [ ] "Add Solar?" question with YES/NO buttons visible
- [ ] Clicking "Yes, Add Solar" shows solar configuration
- [ ] "Add EV Chargers?" question with YES/NO buttons visible
- [ ] Clicking "Yes, Add EV" shows EV charger configuration
- [ ] Can proceed without adding solar/EV (optional)

### **Step 4 (Location)**
- [ ] System summary card shows configured MW/hours
- [ ] "Why location matters" explanation visible
- [ ] State selection shows average rates
- [ ] Rate tier indicators (Low/Medium/High) visible

### **Step 5 (Quote Summary)**
- [ ] Shows all configured components
- [ ] Displays total costs and savings
- [ ] "Complete Quote" button works
- [ ] NO Step 6 after this

### **All Steps**
- [ ] Navigation Next/Back works
- [ ] No console errors
- [ ] Widgets update when values change
- [ ] Mobile responsive

---

## 📝 Implementation Checklist

### **Phase 1: Add Widgets (2 hours)**
- [ ] Import PowerMeterWidget in Step2_SimpleConfiguration.tsx
- [ ] Import PowerStatusWidget in Step3_AddRenewables.tsx
- [ ] Import PowerStatusWidget in Step4_LocationPricing.tsx
- [ ] Pass correct props from SmartWizardV2 to step components
- [ ] Test widgets display correctly with real data

### **Phase 2: Add Solar/EV Questions (3 hours)**
- [ ] Add "Add Solar?" question section to Step 3
- [ ] Wire up YES button to setShowSpaceInput(true)
- [ ] Add "Add EV Chargers?" question section to Step 3
- [ ] Wire up YES button to setShowEVConfig(true)
- [ ] Test solar configuration shows when enabled
- [ ] Test EV configuration shows when enabled

### **Phase 3: Enhance Step 4 (1 hour)**
- [ ] Add system summary card above location picker
- [ ] Pass storageSizeMW, durationHours as props
- [ ] Add "Why location matters" explanation
- [ ] Style rate tier indicators

### **Phase 4: Remove Step 6 (30 min)**
- [ ] Change maxSteps to 5
- [ ] Remove Step 6 from renderStep()
- [ ] Update step titles array
- [ ] Test navigation stops at Step 5

### **Phase 5: Add E2E Tests (2 hours)**
- [ ] Create smart-wizard-flow.spec.ts
- [ ] Add test for hotel with solar
- [ ] Add test for data center off-grid
- [ ] Add test for office with EV chargers
- [ ] Verify 100% pass rate

### **Phase 6: Manual Testing (1 hour)**
- [ ] Test all 5 use cases end-to-end
- [ ] Test with solar enabled
- [ ] Test with EV enabled
- [ ] Test skip solar/EV flow
- [ ] Test mobile responsiveness
- [ ] Verify no console errors

---

## ⏰ Timeline

**Total Estimated Time**: 9.5 hours (1-2 days)

**Priority Order**:
1. **Phase 1** (2 hours) - Add widgets → Immediate visibility fix
2. **Phase 2** (3 hours) - Solar/EV questions → Feature completeness
3. **Phase 4** (30 min) - Remove Step 6 → Simplify flow
4. **Phase 3** (1 hour) - Enhance Step 4 → Polish
5. **Phase 5** (2 hours) - E2E tests → Prevent regressions
6. **Phase 6** (1 hour) - Manual QA → Launch readiness

---

## 🚀 Post-Fix Verification

**Before Deployment**:
```bash
# Run all tests
npm run test:use-cases  # 42/42 passing
npm run test:e2e        # New wizard tests passing

# Manual smoke test
npm run dev
# Test wizard with 3 different industries
# Verify all steps work correctly
```

**After Deployment**:
- Monitor error logs for wizard-related issues
- Track completion rate (users finishing vs abandoning)
- Collect user feedback on clarity and ease of use

---

## 🎯 Success Metrics

**Before Fix**:
- ❌ Power widgets: Not visible
- ❌ Solar/EV: Hidden, no way to access
- ❌ Step 4: Confusing, no context
- ❌ Step 6: Unnecessary extra step
- ❌ E2E tests: None for wizard UI

**After Fix**:
- ✅ Power widgets: Visible in steps 2-4
- ✅ Solar/EV: Clear YES/NO questions
- ✅ Step 4: Contextual system summary
- ✅ Step 6: Removed, cleaner flow
- ✅ E2E tests: 5+ scenarios covered

---

**Document prepared**: Nov 24, 2025  
**Next action**: Implement Phase 1 (Add Widgets) immediately  
**Owner**: Engineering team  
**Approval**: Required before launch
