# 🏗️ Modular Architecture Migration Plan
**Date**: December 25, 2025  
**Status**: Phase 1 - Core Extraction

---

## 🎯 Goals

1. **Extract Core Services** → `@merlin/core` package
2. **Extract Wizard Module** → `@merlin/wizard` package  
3. **Create CarWash POC** → Standalone `carwash-site` app
4. **Maintain SSOT & TrueQuote Compliance** throughout

---

## 📋 Phase 1: Core Extraction (Current)

### Step 1: Create Package Structure ✅
- [x] Set up monorepo with Turborepo
- [x] Create `packages/core` structure
- [x] Create `packages/wizard` structure
- [x] Create `packages/verticals/carwash` structure
- [x] Create `apps/carwash-site` structure

### Step 2: Extract Core Services (In Progress)
- [ ] Copy calculation services to `packages/core/src/calculations/`
  - [ ] `unifiedQuoteCalculator.ts`
  - [ ] `centralizedCalculations.ts`
  - [ ] `equipmentCalculations.ts`
  - [ ] `QuoteEngine.ts`
- [ ] Copy validation services to `packages/core/src/validation/`
  - [ ] `calculationValidator.ts`
  - [ ] `trueQuoteValidator.ts` (new)
- [ ] Copy pricing services to `packages/core/src/pricing/`
  - [ ] `unifiedPricingService.ts`
  - [ ] `marketDataIntegrationService.ts`
- [ ] Copy constants service to `packages/core/src/constants/`
  - [ ] `calculationConstantsService.ts`
- [ ] Copy power calculations to `packages/core/src/calculations/`
  - [ ] `useCasePowerCalculations.ts`

### Step 3: Update Imports
- [ ] Update all imports in main codebase to use `@merlin/core`
- [ ] Test that calculations still work
- [ ] Verify SSOT compliance

### Step 4: Build & Test Core Package
- [ ] Configure TypeScript compilation
- [ ] Build `@merlin/core` package
- [ ] Run tests
- [ ] Verify exports

---

## 📋 Phase 2: Wizard Extraction

### Step 1: Extract Wizard Component
- [ ] Copy `WizardV5.tsx` to `packages/wizard/src/`
- [ ] Copy step components
- [ ] Copy design system
- [ ] Copy shared components

### Step 2: Add Configuration System
- [ ] Create `VerticalConfig` interface
- [ ] Create theming system
- [ ] Add branding configuration

### Step 3: Build Wizard Package
- [ ] Configure build
- [ ] Test wizard in isolation
- [ ] Verify props interface

---

## 📋 Phase 3: CarWash POC

### Step 1: Create CarWash App
- [ ] Set up `apps/carwash-site/`
- [ ] Install `@merlin/core` and `@merlin/wizard`
- [ ] Create CarWash-specific config
- [ ] Create CarWash theme

### Step 2: Integrate Wizard
- [ ] Import `WizardV5` from `@merlin/wizard`
- [ ] Configure with CarWash settings
- [ ] Test wizard flow

### Step 3: Test TrueQuote Compliance
- [ ] Generate quotes
- [ ] Verify validation
- [ ] Check audit trail
- [ ] Verify source attribution

### Step 4: Build & Deploy
- [ ] Build standalone app
- [ ] Test deployment
- [ ] Verify no cross-contamination

---

## 🔒 SSOT & TrueQuote Compliance Checklist

### Core Package
- [ ] All calculations use `@merlin/core`
- [ ] No hardcoded values
- [ ] All quotes validated
- [ ] Audit trail complete
- [ ] Source attribution present

### Wizard Package
- [ ] Uses `@merlin/core` for calculations
- [ ] No calculation logic in wizard
- [ ] All quotes validated before display

### CarWash App
- [ ] Uses `@merlin/core` and `@merlin/wizard`
- [ ] No duplicate calculation code
- [ ] TrueQuote badge displayed
- [ ] Validation results shown

---

## 📊 Progress Tracking

**Phase 1: Core Extraction**
- Structure: ✅ 100%
- Services: 🔄 20%
- Imports: ⏳ 0%
- Testing: ⏳ 0%

**Phase 2: Wizard Extraction**
- Structure: ✅ 100%
- Component: ⏳ 0%
- Config: ⏳ 0%
- Testing: ⏳ 0%

**Phase 3: CarWash POC**
- Structure: ✅ 100%
- Integration: ⏳ 0%
- Testing: ⏳ 0%
- Deployment: ⏳ 0%

---

## 🚨 Critical Requirements

1. **Accuracy**: All calculations must maintain current accuracy
2. **TrueQuote**: All quotes must pass TrueQuote validation
3. **SSOT**: No duplicate calculation logic
4. **Market-Driven**: Pricing must use scraper/ML integration
5. **Audit Trail**: Complete traceability to sources

---

## 📝 Notes

- Migration is incremental - can test at each step
- Main codebase continues to work during migration
- Can rollback at any point
- Each phase is independently testable




