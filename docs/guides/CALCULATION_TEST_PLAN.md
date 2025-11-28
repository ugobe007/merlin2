# 🧪 Calculation Test Plan - Merlin2 BESS System

**Date**: November 17, 2025  
**Purpose**: Systematic validation of all calculation logic across use cases  
**Status**: Testing in progress

---

## 🎯 Test Objectives

1. ✅ **Verify Datacenter Sizing** - 250MW → 125MW (Tier III) 
2. ⏳ **Validate Other Templates** - Manufacturing, Hotel, Hospital, etc.
3. ⏳ **Check Financial Calculations** - ROI, payback, NPV accuracy
4. ⏳ **Verify Special Cases** - EV charging, custom peak load input
5. ⏳ **Test Edge Cases** - Very large systems (100+ MW), very small (<1 MW)

---

## 📋 Test Cases by Use Case Template

### 1. ✅ **Datacenter** (VERIFIED - WORKING)

**Test Scenario**: 250 MW Tier III datacenter
- **Expected BESS**: 125 MW / 3 hours (0.5 multiplier)
- **Result**: ✅ WORKING (fixed in baselineService.ts)
- **Special Logic**: Lines 88-98 in baselineService.ts
- **Calculation**: `250 MW × 0.5 = 125 MW`

**Tier Multipliers**:
```typescript
tier3: { power: 0.5, duration: 3 }    // 125 MW / 3hr
tier4: { power: 0.6, duration: 4 }    // 150 MW / 4hr  
microgrid: { power: 0.8, duration: 6 } // 200 MW / 6hr
```

**Status**: ✅ Complete

---

### 2. ⏳ **Manufacturing Facility**

**Test Scenarios**:

#### A. Small Manufacturer
- Facility Size: 50,000 sq ft
- Peak Load: 2 MW
- Operating Hours: 16 hr/day, 5 days/week
- **Expected BESS**: ~1-2 MW / 4-6 hours
- **Financial**: ~$75K-200K annual savings

#### B. Large Manufacturer  
- Facility Size: 500,000 sq ft
- Peak Load: 15 MW
- Operating Hours: 24/7
- **Expected BESS**: ~8-12 MW / 4-6 hours
- **Financial**: ~$500K-1M annual savings

**Validation Points**:
- [ ] Power sizing scales with facility size
- [ ] Duration based on operating schedule
- [ ] Demand charge savings calculation accurate
- [ ] Tax credit (30% ITC) applied correctly

**Status**: ⏳ Pending test

---

### 3. ⏳ **Hospital**

**Test Scenario**: 200-bed acute care hospital
- **Database Values** (from useCaseTemplates.ts):
  - Typical Load: 2,033 kW (2.033 MW)
  - Peak Load: 2,870 kW (2.87 MW)
  - Profile: 24/7 constant load
  - Critical backup requirement

**Expected Results**:
- **BESS Sizing**: 2-3 MW / 6-8 hours (longer duration for critical backup)
- **Solar**: Optional (rooftop space dependent)
- **Generator Backup**: 2-3 MW diesel for redundancy
- **Annual Savings**: $100K-300K (demand charge + resilience value)

**Validation Points**:
- [ ] Sizing accounts for 24/7 operation
- [ ] Longer duration for critical infrastructure
- [ ] Generator backup sizing appropriate
- [ ] Financial includes reliability value

**Status**: ⏳ Pending test

---

### 4. ⏳ **Hotel**

**Test Scenarios**:

#### A. Boutique Hotel (50 rooms)
- **Database Scale Factor**: 50 rooms / 100 = 0.5x
- **Expected BESS**: ~250-500 kW / 3-4 hours
- **Peak Times**: Morning (7-10am), Evening (6-9pm)

#### B. Large Hotel (300 rooms)
- **Database Scale Factor**: 300 rooms / 100 = 3x  
- **Expected BESS**: ~1.5-2 MW / 3-4 hours
- **Annual Savings**: $30K-80K (based on template)

**Validation Points**:
- [ ] Scale factor calculation correct (rooms/100)
- [ ] Peak shaving for breakfast/dinner rush
- [ ] HVAC load properly weighted
- [ ] Guest comfort maintained during discharge

**Status**: ⏳ Pending test

---

### 5. ⏳ **EV Charging Station**

**Test Scenario**: 10 DC fast chargers (150 kW each)
- **Total Nameplate**: 1,500 kW (1.5 MW)
- **Utilization**: ~35-45% (per database)
- **Expected BESS**: 750-1,000 kW / 2-3 hours

**Special Calculation** (lines 76-86 baselineService.ts):
```typescript
const totalChargerPower = numChargers * avgChargerPower;
const utilizationFactor = 0.4; // 40% typical
const peakDemand = totalChargerPower * utilizationFactor;
```

**Validation Points**:
- [ ] Charger type affects power sizing (Level 2 vs DC Fast)
- [ ] Utilization factor applied correctly
- [ ] Demand charge management for peak periods
- [ ] Revenue from grid services calculated

**Status**: ⏳ Pending test

---

### 6. ⏳ **Car Wash**

**Test Scenario**: 3-bay tunnel wash
- **Database Values**:
  - Typical Load: 95 kW
  - Peak Load: 171 kW  
  - Profile: Peaked (weekend/lunch rush)

**Expected BESS**: ~100-150 kW / 2-3 hours
**Peak Times**: Weekends, lunch hours (11am-2pm)

**Validation Points**:
- [ ] Equipment loads sum correctly (conveyor, dryers, pumps, etc.)
- [ ] Weekend vs weekday profiles different
- [ ] Demand charge savings substantial (high demand charges for small facilities)

**Status**: ⏳ Pending test

---

### 7. ⏳ **Indoor Farm**

**Test Scenario**: 20,000 sq ft vertical farm
- **Power Density**: ~35 W/sq ft (LED grow lights)
- **Expected Load**: ~700 kW constant
- **Profile**: 24/7 lighting + climate control

**Expected BESS**: ~400-600 kW / 4-6 hours
**Solar Integration**: High value (offset 24/7 lighting costs)

**Validation Points**:
- [ ] Lighting load dominant (~60-70% of total)
- [ ] HVAC sizing for climate control
- [ ] Solar paired properly (high daytime production)
- [ ] TOU rate optimization for lighting schedule

**Status**: ⏳ Pending test

---

## 🔍 Financial Calculation Validation

### Critical Formulas to Test

From `centralizedCalculations.ts`:

#### 1. **Peak Shaving Savings**
```typescript
const peakShavingSavings = storageSizeMW * 1000 * ANNUAL_CYCLES * 
  durationHours * electricityRate * PEAK_SHAVING_MULTIPLIER;
```

**Test Values**:
- 2 MW system, 4 hours, $0.12/kWh, 250 cycles/year
- **Expected**: `2000 kW × 250 × 4 × $0.12 × multiplier = ?`

#### 2. **Demand Charge Savings**
```typescript
const demandSavings = storageSizeMW * DEMAND_CHARGE_MONTHLY_PER_MW * 12;
```

**Test Values**:
- 2 MW system, $15,000/MW-month
- **Expected**: `2 × $15,000 × 12 = $360,000/year`

#### 3. **Tax Credit (ITC)**
```typescript
const taxCredit = equipmentCost * FEDERAL_TAX_CREDIT_RATE;
```

**Test Values**:
- $2M equipment cost, 30% ITC
- **Expected**: `$2,000,000 × 0.30 = $600,000`

#### 4. **Simple Payback**
```typescript
const paybackYears = netCost / annualSavings;
```

**Test Values**:
- Net Cost: $1.4M (after tax credit)
- Annual Savings: $200K
- **Expected**: `$1,400,000 / $200,000 = 7 years`

#### 5. **NPV Calculation**
```typescript
// 25-year NPV with 8% discount rate, 2% escalation
let npv = -netCost;
for (let year = 1; year <= 25; year++) {
  const escalatedSavings = annualSavings * Math.pow(1 + 0.02, year - 1);
  const discountedSavings = escalatedSavings / Math.pow(1 + 0.08, year);
  npv += discountedSavings;
}
```

**Test Values** (manual calculation):
- Net Cost: $1.4M
- Annual Savings: $200K (escalating 2%/year)
- Discount Rate: 8%
- **Expected NPV**: ~$800K-1.2M positive (verify against financial calculator)

---

## 🚨 Special Cases to Test

### 1. **User-Provided Peak Load**

**Scenario**: User enters explicit peak load instead of using template defaults

**Test**: Manufacturing facility, user enters 25 MW peak load
- **Expected**: System uses 25 MW, NOT template default
- **Code Location**: baselineService.ts lines 103-125
- **Validation**: Console log should show "Using user's explicit peak load input"

**Status**: ⏳ Pending test

---

### 2. **Multi-Template Selection**

**Scenario**: User selects multiple templates (e.g., Hotel + EV Charging)

**Test**: 200-room hotel with 20 EV chargers
- **Expected**: Combined load from both templates
- **Calculation**: Hotel base load + EV charger load
- **Validation**: Total power adds correctly

**Status**: ⏳ Pending test

---

### 3. **Very Large Systems (100+ MW)**

**Scenario**: Utility-scale BESS or large datacenter

**Test Values**:
- 150 MW / 4 hours
- Sliders go up to 100 MW (recently updated)
- Solar: 50 MW, Wind: 30 MW, Generator: 40 MW

**Validation**:
- [ ] Sliders allow 100 MW input (fixed in last update)
- [ ] Financial calculations don't overflow
- [ ] Cost scaling remains linear/accurate
- [ ] Export pricing correct for utility-scale

**Status**: ⏳ Pending test

---

### 4. **Very Small Systems (<500 kW)**

**Scenario**: Small commercial building or retail store

**Test**: 250 kW / 2 hours system
- **Expected**: Different cost per kWh (higher per-unit cost for small systems)
- **Validation**: Fixed costs don't dominate economics
- **Payback**: Still reasonable (8-12 years)

**Status**: ⏳ Pending test

---

## 📊 Test Execution Checklist

### Before Testing:
- [x] Fix datacenter calculation bug
- [x] Update slider limits to 100 MW
- [x] Verify centralized calculations service
- [x] Fix lead capture modal download bug

### During Testing:
- [ ] Open browser console (watch for calculation logs)
- [ ] Test each use case systematically
- [ ] Record actual vs expected values
- [ ] Screenshot any anomalies
- [ ] Check database queries (network tab)

### After Testing:
- [ ] Document all bugs found
- [ ] Prioritize fixes by severity
- [ ] Update this test plan with results
- [ ] Verify fixes with regression tests

---

## 🐛 Known Issues Log

### Issue #1: ✅ FIXED - Datacenter undersizing
**Description**: 250MW datacenter showing 2MW instead of 125MW  
**Root Cause**: Priority logic wrong (square footage overriding capacity input)  
**Fix**: Lines 88-98 in baselineService.ts - datacenter special case  
**Status**: ✅ Resolved

### Issue #2: ✅ FIXED - Slider limits too low
**Description**: Couldn't add 50MW generators for 250MW datacenter  
**Root Cause**: Slider max attributes set to 5-30 MW  
**Fix**: Updated 6 sliders to max="100" across 2 files  
**Status**: ✅ Resolved

### Issue #3: ✅ FIXED - Lead capture download bypass
**Description**: Word download happening even when modal closed  
**Root Cause**: `handleLeadCaptureSkip()` still calling `proceedWithDownload()`  
**Fix**: Remove download call when user skips/closes modal  
**Status**: ✅ Resolved

### Issue #4: ⏳ PENDING - [Add new issues as discovered]

---

## 🎓 Testing Instructions

### How to Test Each Use Case:

1. **Open Smart Wizard**
   - Click "Start Smart Wizard" from main page
   - Or click "Smart Wizard" from Advanced Quote Builder

2. **Select Template**
   - Choose industry template (e.g., "Manufacturing")
   - Note the default values shown

3. **Enter Specific Values**
   - Fill out custom questions (facility size, peak load, etc.)
   - Watch console for calculation logs

4. **Review Calculations**
   - Check "Storage Size (MW)" - does it match expected?
   - Check "Duration (Hours)" - appropriate for use case?
   - Check "Annual Savings" - reasonable order of magnitude?
   - Check "Payback Period" - within industry norms?

5. **Test Renewable Integration**
   - Add solar/wind/generator
   - Verify sizing suggestions make sense
   - Check financial impact calculations

6. **Review Final Quote**
   - Complete wizard to summary page
   - Verify all numbers match previous steps
   - Check equipment breakdown costs
   - Verify tax credit calculation (30% of equipment)

7. **Test Export**
   - Try downloading Word/PDF/Excel
   - Verify lead capture modal works
   - Check exported values match UI

---

## 📝 Test Results Template

```
### [Template Name] - Test Date: [Date]

**Input Parameters**:
- [List all inputs provided]

**Expected Results**:
- Power: X MW
- Duration: Y hours  
- Annual Savings: $Z
- Payback: W years

**Actual Results**:
- Power: [Actual] MW
- Duration: [Actual] hours
- Annual Savings: $[Actual]
- Payback: [Actual] years

**Status**: ✅ Pass / ❌ Fail / ⚠️ Needs Review

**Notes**: [Any observations or anomalies]
```

---

## 🚀 Next Steps

1. **Start with known-good cases** (Datacenter - already verified)
2. **Test common use cases** (Manufacturing, Hotel, Hospital)
3. **Test edge cases** (Very large, very small systems)
4. **Verify financial formulas** (Cross-check with spreadsheet)
5. **Document all findings** (Update this file with results)

---

**Ready to test?** Let's start with Manufacturing or Hotel - your choice! 🎯
