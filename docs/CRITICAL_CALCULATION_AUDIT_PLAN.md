# Critical Calculation Audit Plan

**Date:** January 2, 2026  
**Status:** 🚨 CRITICAL - Multiple Calculation Errors Found  
**Priority:** P0 - System-wide calculation failures

---

## Executive Summary

User reports systematic calculation errors across multiple industries:
- **Solar/EV charging not included** when selected
- **Step 3 input variables** not collected/passed to calculations
- **Industry templates** use incorrect math
- **Wizard miscalculates** numbers
- **Incorrect configurations** in templates
- **Logic errors** (e.g., tier 3 data center getting 750 kWh instead of 750 MW - 1000x error!)

**Impact:** This violates the core Merlin value proposition: "accurate calculations with good math"

---

## Audit Scope

### 1. Step 3 → TrueQuote Engine Data Flow
**Questions:**
- Are Step 3 input variables (roomCount, rackCount, bayCount, etc.) properly stored in `state.useCaseData`?
- Does `mapWizardStateToTrueQuoteInput` correctly map all fields?
- Are foundational variables (roomCount, rackCount, etc.) present in `facilityData` when TrueQuote Engine runs?

**Files to Check:**
- `src/components/wizard/v6/steps/Step3Details.tsx`
- `src/components/wizard/v6/steps/Step3HotelEnergy.tsx`
- `src/components/wizard/v6/utils/trueQuoteMapper.ts`
- `src/services/TrueQuoteEngine.ts` (extractUnitCount method)

---

### 2. Solar/EV Charging Inclusion Logic
**Questions:**
- When user selects solar in Step 4, does `state.customSolarKw` get set correctly?
- Does Step 5 check `selectedOptions.includes('solar')` properly?
- Is solar/EV included in final quote calculations (Step 6)?
- Are there multiple code paths that could exclude solar/EV?

**Files to Check:**
- `src/components/wizard/v6/steps/Step4Options.tsx`
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (lines 445-582)
- `src/components/wizard/v6/steps/Step6Quote.tsx`
- `src/services/TrueQuoteEngine.ts` (solar calculation logic)

---

### 3. Unit Errors (kWh vs MW)
**Critical Example:** Tier 3 data center with gigawatts of servers getting 750 kWh instead of 750 MW

**Questions:**
- How is peak demand calculated for data centers?
- Is rackCount being extracted correctly?
- Are the multipliers correct (e.g., 5 kW per rack, 1.6 PUE)?
- Is the final BESS sizing in correct units (kW, not kWh)?

**Example Calculation:**
- 150,000 racks × 5 kW/rack = 750,000 kW = 750 MW
- With 1.6 PUE = 1,200 MW peak demand
- Tier 3 BESS = 50% of peak = 600 MW (not 600 kWh!)
- With 4-hour duration = 2,400 MWh

**Files to Check:**
- `src/services/TrueQuoteEngine.ts` (calculatePeakDemand, DATA_CENTER_CONFIG)
- `src/services/TrueQuoteEngine.ts` (calculateBESS method - lines 1578-1610)

---

### 4. Industry Template Math Errors
**Questions:**
- Are industry multipliers correct?
- Are power calculations using correct formulas?
- Are the wattsPerUnit values accurate?
- Are modifiers (PUE, etc.) applied correctly?

**Files to Check:**
- `src/services/TrueQuoteEngine.ts` (all IndustryConfig objects)
- Industry-specific calculation files in `src/services/`

---

### 5. Configuration Errors
**Questions:**
- Are BESS multipliers appropriate for each industry/subtype?
- Are duration hours correct?
- Are min/max BESS sizes realistic?
- Are generator requirements correct?

**Files to Check:**
- `src/services/TrueQuoteEngine.ts` (all IndustryConfig.subtypes)

---

### 6. Wizard Calculation Logic
**Questions:**
- Does Step 5 use TrueQuote Engine correctly?
- Are there fallback calculations that bypass TrueQuote Engine?
- Are calculations happening in the right order?
- Is data persistence working between steps?

**Files to Check:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` (calculateSystemAsync)
- `src/components/wizard/v6/WizardV6.tsx`

---

## Test Cases to Verify

### Data Center (Tier 3)
- **Input:** 150,000 racks, Tier 3, PUE 1.6
- **Expected Peak:** ~1,200 MW (150k racks × 5kW × 1.6 PUE)
- **Expected BESS:** ~600 MW / 2,400 MWh (50% of peak, 4-hour)
- **Current Result:** ❓ (Reported as 750 kWh - 1000x error!)

### Hotel (450 rooms, high-end)
- **Input:** 450 rooms, upscale/luxury, solar selected
- **Expected Peak:** ~2-3 MW (depends on amenities)
- **Expected BESS:** ~1-1.5 MW / 4-6 MWh
- **Expected Solar:** Should be included if selected
- **Current Result:** ❓ (Solar not included, BESS wrong size)

### Car Wash (4 bays)
- **Input:** 4 bays, express tunnel
- **Expected Peak:** ~200 kW (4 bays × 50 kW)
- **Expected BESS:** ~80 kW / 320 kWh (40% of peak)
- **Current Result:** ❓

---

## Root Cause Hypotheses

1. **Data Flow Broken:** Step 3 data not reaching TrueQuote Engine
2. **Unit Confusion:** Calculations mixing kW/kWh/MW/MWh incorrectly
3. **Missing Variables:** Foundational variables (rackCount, roomCount) not in facilityData
4. **Logic Errors:** Solar/EV inclusion logic has bugs
5. **Template Errors:** Industry configs have wrong multipliers/formulas
6. **SSOT Violations:** Multiple calculation paths, not using TrueQuote Engine consistently

---

## Fix Strategy

1. **Audit First:** Create test cases for each industry, verify inputs/outputs
2. **Fix Data Flow:** Ensure Step 3 → TrueQuote Engine data flows correctly
3. **Fix Unit Errors:** Verify all calculations use correct units (kW for power, kWh for energy)
4. **Fix Inclusion Logic:** Simplify solar/EV inclusion - if selected, include it
5. **Fix Templates:** Review and correct all IndustryConfig objects
6. **Restore SSOT:** Ensure all calculations go through TrueQuote Engine
7. **Add Validation:** Add unit tests to prevent regression

---

## Next Steps

1. Create audit script to test each industry
2. Document actual vs expected for each use case
3. Fix root causes systematically
4. Add comprehensive tests
5. Verify with user before deployment
