# Comprehensive Merlin Fix Plan

**Date:** January 2, 2026  
**Status:** In Progress  
**Priority:** P0 - Critical System-Wide Fixes

---

## Executive Summary

User reports systematic calculation errors across multiple industries:
- Solar/EV charging not included when selected
- Step 3 input variables not collected/passed to calculations  
- Industry templates use incorrect math
- Wizard miscalculates numbers
- Incorrect configurations in templates
- Logic errors (e.g., tier 3 data center getting 750 kWh instead of 750 MW - 1000x error!)

**Goal:** Thorough cleanup of all calculation logic to restore Merlin's core value proposition: accurate calculations with good math.

---

## Audit Results

Initial audit script results:

### ✅ PASSED
- Data Center (Tier 3, 150k racks): Peak demand and BESS calculations correct
- Car Wash (4 bays): All calculations correct
- Hospital (200 beds): All calculations correct  
- Manufacturing (100k sqft): All calculations correct

### ❌ FAILED
- **Hotel (450 rooms, upscale)**: Peak demand 1.4 MW vs expected 2.5 MW
  - Issue: Hotel config uses ~3 kW/room, expected ~5.5 kW/room for upscale
  - BESS sizing: 0.68 MW vs expected 1.24 MW

### ⚠️ WARNINGS
- Data Center generator: 1,500 MW (1.5 GW) - seems too high, needs review
- All industries: Solar/EV inclusion working correctly ✅

---

## Fix Plan

### Phase 1: Fix Industry Template Math ✅ IN PROGRESS

#### 1.1 Hotel Configuration
**Issue:** Hotel uses ~3 kW/room, should be ~5.5 kW/room for upscale hotels

**Current Config:**
- `wattsPerUnit: 3000` (3 kW per room)

**Fix:**
- Upscale/luxury: 5,500 W/room (5.5 kW)
- Midscale: 3,500 W/room (3.5 kW)
- Economy: 2,500 W/room (2.5 kW)

**File:** `src/services/TrueQuoteEngine.ts` - `HOTEL_CONFIG`

---

#### 1.2 Data Center Generator Sizing
**Issue:** Generator is 1,500 MW for 150k racks - seems too high

**Current Logic:**
- Critical load = peak demand (100% critical for tier 3)
- Generator = critical load × 1.25 (reserve margin)

**Analysis:**
- Peak demand: 1,200 MW
- Critical load: 1,200 MW (100% for tier 3)
- Generator: 1,200 × 1.25 = 1,500 MW ✅ Correct calculation

**Conclusion:** This is actually correct for a tier 3 data center with 150k racks. The issue is that this is a MASSIVE facility. However, we should verify the multiplier is appropriate.

**Action:** Review generator sizing multipliers - 1.25x might be appropriate for N+1 redundancy.

---

### Phase 2: Fix Data Flow (Step 3 → TrueQuote Engine)

#### 2.1 Verify Input Mapping
**Files to Check:**
- `src/components/wizard/v6/utils/trueQuoteMapper.ts`
- `src/components/wizard/v6/steps/Step3Details.tsx`
- `src/components/wizard/v6/steps/Step3HotelEnergy.tsx`

**Verify:**
- All foundational variables (roomCount, rackCount, bayCount, etc.) are mapped correctly
- Data flows from Step 3 → `state.useCaseData` → `mapWizardStateToTrueQuoteInput` → TrueQuote Engine

**Status:** Previously fixed via SSOT audit - verify still working

---

### Phase 3: Fix Solar/EV Inclusion

#### 3.1 Verify Solar Inclusion
**Files:**
- `src/components/wizard/v6/steps/Step4Options.tsx` - Sets `state.customSolarKw`
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Uses solar from Step 4 or TrueQuote Engine
- `src/services/TrueQuoteEngine.ts` - Calculates solar if `solarEnabled: true`

**Status:** Audit shows solar is being included ✅

#### 3.2 Verify EV Inclusion
**Files:**
- `src/components/wizard/v6/steps/Step4Options.tsx` - Sets EV charger counts
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Uses EV counts from Step 4
- `src/services/TrueQuoteEngine.ts` - Calculates EV if `evChargingEnabled: true`

**Status:** Audit shows EV is being included ✅

---

### Phase 4: Fix Unit Errors (kWh vs MW)

#### 4.1 Verify Units Throughout
**Current Status:**
- TrueQuote Engine correctly uses kW for power, kWh for energy ✅
- Step 5 correctly converts to MW/MWh for display ✅

**User Report:** "750 kWh instead of 750 MW" for data center
- This suggests a display error, not a calculation error
- Need to verify Step 5/6 display logic

**Files to Check:**
- `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Display formatting
- `src/components/wizard/v6/steps/Step6Quote.tsx` - Display formatting

---

### Phase 5: Review All Industry Configs

#### 5.1 Review All IndustryConfig Objects
**Files:** `src/services/TrueQuoteEngine.ts`

**Industries to Review:**
1. ✅ Data Center - PASSED audit
2. ❌ Hotel - FAILED audit (fix in Phase 1.1)
3. ✅ Car Wash - PASSED audit
4. ✅ Hospital - PASSED audit
5. ✅ Manufacturing - PASSED audit
6. ⏳ Retail - Not tested yet
7. ⏳ Office - Not tested yet
8. ⏳ All other industries - Not tested yet

**Action:** Review all industry configs for:
- Correct `wattsPerUnit` or `wattsPerSqft` values
- Appropriate BESS multipliers
- Correct duration hours
- Generator requirements and sizing

---

### Phase 6: Testing & Verification

#### 6.1 Expand Audit Script
**File:** `scripts/comprehensive-calculation-audit.ts`

**Add test cases for:**
- All 20 industries
- Multiple subtypes per industry
- Edge cases (very large facilities, very small facilities)
- Solar/EV inclusion scenarios

#### 6.2 Manual Testing Checklist
- [ ] Test each industry in wizard
- [ ] Verify Step 3 inputs flow to calculations
- [ ] Verify solar/EV included when selected
- [ ] Verify units displayed correctly (kW/MW, kWh/MWh)
- [ ] Verify calculations match industry standards

---

## Implementation Order

1. ✅ **Phase 1.1: Fix Hotel Configuration** - HIGH PRIORITY
2. ⏳ **Phase 1.2: Review Data Center Generator** - MEDIUM PRIORITY
3. ⏳ **Phase 5: Review All Industry Configs** - HIGH PRIORITY
4. ⏳ **Phase 4: Verify Unit Display** - MEDIUM PRIORITY
5. ⏳ **Phase 6: Comprehensive Testing** - HIGH PRIORITY

---

## Success Criteria

- [ ] All industries pass audit script
- [ ] All calculations use TrueQuote Engine (SSOT)
- [ ] Solar/EV included when selected
- [ ] Units displayed correctly (kW/MW, kWh/MWh)
- [ ] Calculations match industry standards
- [ ] No hardcoded values (all from database or TrueQuote Engine)

---

## Notes

- User emphasis: "everything must be cleaned up"
- Focus on accuracy: "bad math" is the problem Merlin solves
- SSOT compliance: All calculations through TrueQuote Engine
- TrueQuote compliance: All numbers traceable to sources
