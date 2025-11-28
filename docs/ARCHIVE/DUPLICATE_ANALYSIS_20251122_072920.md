# Duplicate Functionality Analysis

**Generated:** $(date)

## Calculation Services (Potential Duplicates)

### Financial Calculations:

### Functions named 'calculateFinancialMetrics':
src/utils/industryStandardFormulas.ts:export const calculateFinancialMetrics = (inputs: FinancialInputs): {
src/services/centralizedCalculations.ts:export async function calculateFinancialMetrics(

### NPV/IRR Calculations:
src/services/pricingIntelligence.ts:      irr: calculateIRR(totalCapex, netAnnualRevenue, 15), // 15-year project life
src/services/pricingIntelligence.ts:      npv: calculateNPV(totalCapex, netAnnualRevenue, 15, 0.08), // 8% discount rate
src/services/pricingIntelligence.ts:      profitabilityIndex: calculateNPV(totalCapex, netAnnualRevenue, 15, 0.08) / totalCapex
src/services/pricingIntelligence.ts:function calculateIRR(initialInvestment: number, annualCashFlow: number, years: number): number {
src/services/pricingIntelligence.ts:function calculateNPV(initialInvestment: number, annualCashFlow: number, years: number, discountRate: number): number {

## Findings:

### ✅ KEEP (Primary):
- `src/services/centralizedCalculations.ts` - Main calculation engine
- `src/services/baselineService.ts` - Sizing calculations
- `src/services/unifiedPricingService.ts` - Equipment pricing

### ⚠️ REVIEW (Potentially Deprecated):
- `src/services/bessDataService.ts` - Has calculateBESSFinancials() function
- `src/services/industryStandardFormulas.ts` - Name conflict with centralizedCalculations

### Action Items:
1. Search for all calls to `bessDataService.calculateBESSFinancials()`
2. Replace with `centralizedCalculations.calculateFinancialMetrics()`
3. Remove bessDataService if no other essential functions

---

## Modal System Duplicates


### Modal Components:
src/components/modals/LoadProjectModal.tsx
src/components/modals/LayoutPreferenceModal.tsx
src/components/modals/CalculationModal.tsx
src/components/modals/RevenueGenerationModal.tsx
src/components/modals/WelcomeModal.tsx
src/components/modals/AccountSetup.tsx
src/components/modals/CostSavingsModal.tsx
src/components/modals/ModalRenderer.tsx
src/components/modals/AdvancedConfigModal.tsx
src/components/modals/SaveProjectModal.tsx
src/components/modals/PowerAdjustmentModal.tsx
src/components/modals/ModalManager.tsx
src/components/modals/SustainabilityModal.tsx
src/components/modals/JoinMerlinModal.tsx
src/components/modals/ContactSalesModal.tsx
src/components/modals/QuotePreviewModal.tsx
src/components/modals/ConsultationModal.tsx
src/components/modals/AIChatModal.tsx

### Findings:
- `ModalRenderer.tsx` - Current working system ✅
- `ModalManager.tsx` - Has TypeScript errors ❌
- Action: Remove ModalManager.tsx after verifying no dependencies

---

## Step Components Analysis


- Step1_PowerEquipment.tsx:      121 lines
- Step0_ProjectType.tsx:      139 lines
- Step3_AddRenewables.tsx:     1542 lines
- Step4_QuoteSummary.tsx:     2016 lines
- Step3_Applications.tsx:       57 lines
- Step4_LocationPricing.tsx:      337 lines
- Step0_Goals.tsx:      210 lines
- Step6_FinalOutput.tsx:      334 lines
- Step5_EnhancedApplications.tsx:      447 lines
- Step2_UseCase.tsx:      223 lines
- Step2_SimpleConfiguration.tsx:      447 lines
- Step8_AdvancedFinancials.tsx:        0 lines
- Step7_DetailedCostAnalysis.tsx:      327 lines
- Step_Intro.tsx:      377 lines
- Step2_HybridConfig.tsx:      266 lines
- Step4_Summary.tsx:      286 lines
- Step5_CostBreakdown.tsx:      267 lines
- Step6_TimeframeGoals.tsx:      165 lines
- Step1_IndustryTemplate.tsx:      436 lines
- Step3_LocationTariff.tsx:      274 lines
- Step2_Budget.tsx:      126 lines

### Naming Convention Issues:
- Step4_QuoteSummary.tsx is actually Step 5 in the wizard (Review Quote)
- Step naming is 0-indexed but file names are mixed

---

## Service File Size Analysis


### Large Service Files (potential candidates for splitting):
    1387 src/services/baselineService.ts
    1086 src/services/useCaseService.ts
     990 src/services/centralizedCalculations.ts
     883 src/services/aiDataCollectionService.ts
     881 src/services/advancedBessAnalytics.ts
     831 src/services/systemControlsPricingService.ts
     689 src/services/powerElectronicsPricingService.ts
     643 src/services/bessDataService.ts
     636 src/services/priceAlertService.ts
     627 src/services/unifiedPricingService.ts

---

## Recommendations

### Immediate Actions:
1. **Remove deprecated services:**
   - Archive `bessDataService.ts` (after migrating calls)
   - Archive `industryStandardFormulas.ts`
   
2. **Fix modal system:**
   - Remove `ModalManager.tsx`
   - Ensure all modals use `ModalRenderer.tsx`

3. **Consolidate documentation:**
   - Move 35+ .md files to `/docs/archive/`
   - Keep only: README, ARCHITECTURE_GUIDE, SERVICES_ARCHITECTURE, SUPABASE_SETUP

4. **Remove junk files:**
   - All test scripts (.js, .mjs, .py)
   - All fix/debug scripts (.sh)
   - All *_COMPLETE.md, *_PLAN.md files

### Testing Required:
- Run full test suite after removing deprecated services
- Verify all modals work with ModalRenderer
- Check wizard flow end-to-end

---

**End of Duplicate Analysis**
