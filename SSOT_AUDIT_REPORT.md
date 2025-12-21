# SSOT (Single Source of Truth) Audit Report
**Date:** December 2025  
**Purpose:** Verify all calculations use `unifiedQuoteCalculator.ts` (TrueQuote™ compliance)

## ✅ SSOT-Compliant Components

### 1. **Wizard Quote Generation** ✅
- **File:** `src/components/wizard/hooks/useStreamlinedWizard.ts`
- **Function:** `generateQuote()`
- **Status:** ✅ Uses `calculateQuote()` from `unifiedQuoteCalculator.ts`
- **Line:** ~1010
- **Notes:** Properly passes all required parameters

### 2. **Step 4 Magic Fit - Super Size** ✅
- **File:** `src/components/wizard/sections/Step4MagicFit.tsx`
- **Function:** `handleSuperSize()`
- **Status:** ✅ Uses `calculateQuote()` from `unifiedQuoteCalculator.ts`
- **Notes:** Regenerates quotes with increased specs using SSOT

### 3. **Scenario Generator** ✅
- **File:** `src/services/scenarioGenerator.ts`
- **Function:** `generateSingleScenario()`
- **Status:** ✅ Uses `calculateQuote()` from `unifiedQuoteCalculator.ts`
- **Notes:** All 3 scenarios (Savings, Balanced, Resilient) use SSOT

### 4. **Interactive Config Dashboard** ✅
- **File:** `src/components/wizard/InteractiveConfigDashboard.tsx`
- **Function:** `calculateMetrics()`
- **Status:** ✅ Uses `calculateFinancialMetrics()` from `centralizedCalculations.ts`
- **Notes:** Properly delegates to SSOT

### 5. **Quote Complete Page** ✅
- **File:** `src/components/wizard/QuoteCompletePage.tsx`
- **Function:** `calculateROI()`
- **Status:** ✅ Uses `calculateFinancialMetrics()` from `centralizedCalculations.ts`
- **Notes:** SSOT-compliant

## ⚠️ Potential Issues to Review

### 1. **Default Electricity Rates (Fallback Values)**
- **Locations:**
  - `Step4MagicFit.tsx:112` - `electricityRate || 0.12`
  - `useStreamlinedWizard.ts:1161` - `electricityRate || 0.12`
  - `QuoteCompletePage.tsx:235` - `electricityRate || 0.12`
- **Status:** ⚠️ Fallback defaults (acceptable if SSOT fails)
- **Recommendation:** Verify these are only used as fallbacks when actual rates unavailable

### 2. **Hero Section - Marketing Display**
- **File:** `src/components/sections/HeroSection.tsx`
- **Status:** ⚠️ Uses `DISPLAY_PRICING` constants (acceptable for marketing)
- **Line:** ~14-15
- **Notes:** Hero stats are display-only, not actual quotes. Acceptable for marketing purposes.

### 3. **Arbitrage Threshold**
- **File:** `src/components/wizard/sections/QuoteResultsSection.tsx`
- **Line:** 199 - `(geo.profile?.avgElectricityRate || 0) > 0.12`
- **Status:** ⚠️ Hardcoded threshold value
- **Recommendation:** Move to constants or SSOT configuration

### 4. **Savings Source Percentage**
- **File:** `src/components/wizard/sections/QuoteResultsSectionNew.tsx`
- **Line:** 535 - `annualSavings * 0.15`
- **Status:** ⚠️ Hardcoded 15% multiplier
- **Recommendation:** Verify this percentage comes from SSOT or is documented source

### 5. **Annual Savings Rate**
- **File:** `src/components/wizard/QuoteCompletePage.tsx`
- **Line:** 223 - `annualSavingsRate: 0.15` (15% of system cost)
- **Status:** ⚠️ Hardcoded percentage
- **Recommendation:** Verify this is documented industry standard or move to SSOT

## ✅ Equipment Sizing Calculations

### Industry Ratios (SSOT-Aligned)
- **File:** `src/components/wizard/sections/GoalsSection.tsx`
- **Status:** ✅ Uses industry-standard ratios (0.4 for battery, 0.6 for solar, 0.25 for generator)
- **Notes:** These ratios should align with SSOT industry standards
- **Recommendation:** Verify these ratios match `getIndustryBESSRatio()` in scenarioGenerator

## 🔍 TrueQuote™ Compliance Checklist

- [x] All actual quote generation uses `unifiedQuoteCalculator.ts`
- [x] Scenario generation uses SSOT
- [x] Financial metrics come from centralized calculations
- [ ] All fallback/default values documented
- [ ] All percentage multipliers have documented sources
- [ ] Equipment sizing ratios match SSOT industry standards

## 📋 Recommendations

1. **Document Fallback Values:** Create a constants file for all default/fallback values with source attribution
2. **Audit Percentage Multipliers:** Verify all percentage multipliers (15%, etc.) are from documented industry sources
3. **Centralize Thresholds:** Move hardcoded thresholds (like 0.12 for arbitrage) to SSOT configuration
4. **Verify Industry Ratios:** Ensure equipment sizing ratios match SSOT industry standards

## 🎯 Next Steps

1. Review and document all hardcoded values
2. Verify percentage multipliers have source attribution
3. Test state persistence in wizard
4. Fix transition bugs (separate issue)

