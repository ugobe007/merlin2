# 📅 CHRONOLOGICAL IMPLEMENTATION PLAN

**Date:** December 26, 2025  
**Approach:** Tackle changes in order of wizard flow  
**Status:** 🚀 **PHASE 1 - READY TO START**

---

## 🎯 **IMPLEMENTATION SEQUENCE**

### **Phase 1: Step 1 Enhancement** (Location + Goals + Grid Connection)
### **Phase 2: Opportunity Discovery Popup** (After Step 2)
### **Phase 3: Step 3 Enhancements** (Brand, Operating Hours, etc.)
### **Phase 4: RAVS Framework & Scenario Generation** (After Step 3)
### **Phase 5: Step 4 Enhancement** (Scenario Presentation)

---

## 📋 **PHASE 1: STEP 1 ENHANCEMENT**

### **Goal:** Combine Location + Goals + Grid Connection in Step 1

### **Changes Required:**

1. **Update Step 1 Component** (`src/components/wizard/v5/steps/Step1LocationGoals.tsx`)
   - Add grid connection question/selector
   - Update UI layout to accommodate three sections

2. **Update Wizard State** (`src/components/wizard/v5/WizardV5.tsx`)
   - Move `gridConnection` from Step 4 to Step 1
   - Update state structure

3. **Update Type Definitions**
   - `WizardState` interface
   - Default state values

4. **Update Step 4** (Remove grid connection from Step 4)
   - Remove grid connection UI
   - Use grid connection from Step 1 state

### **Files to Modify:**
- `src/components/wizard/v5/steps/Step1LocationGoals.tsx`
- `src/components/wizard/v5/WizardV5.tsx`
- `src/components/wizard/v5/steps/Step4MagicFit.tsx`

### **Estimated Time:** 1-2 hours

---

## 📋 **PHASE 2: OPPORTUNITY DISCOVERY POPUP**

### **Goal:** Show opportunity discovery popup after Step 2 (industry selection)

### **Changes Required:**

1. **Create Opportunity Discovery Modal Component**
   - New file: `src/components/wizard/v5/components/OpportunityDiscoveryModal.tsx`
   - Show solar/generator/EV opportunities
   - Basic risk assessment (location-based)
   - Store user preferences

2. **Create Basic Risk Assessment Service**
   - New file: `src/services/riskAssessmentService.ts`
   - Weather risk (basic - location-based lookup)
   - Grid reliability (basic - location-based lookup)
   - Solar viability check

3. **Update Wizard Flow**
   - Trigger popup after Step 2 (industry selection)
   - Store preferences in wizard state

4. **Market Conditions Service** (Basic MVP)
   - Location-based opportunity assessment
   - Solar viability check
   - Generator pricing lookup
   - EV charging opportunity assessment

### **Files to Create:**
- `src/components/wizard/v5/components/OpportunityDiscoveryModal.tsx`
- `src/services/riskAssessmentService.ts`
- `src/services/marketConditionsService.ts` (or extend existing)

### **Files to Modify:**
- `src/components/wizard/v5/WizardV5.tsx` (trigger popup)
- `src/components/wizard/v5/steps/Step2IndustrySelect.tsx` (trigger after selection)

### **Estimated Time:** 3-4 hours

---

## 📋 **PHASE 3: STEP 3 ENHANCEMENTS**

### **Goal:** Add brand selection, operating hours, rooftop square footage, etc.

### **Changes Required:**

1. **Database Schema Updates**
   - Create `use_case_brands` table
   - Add brand/chain questions to use case question sets
   - Add operating hours questions (relevant use cases)
   - Add rooftop square footage questions (building-based use cases)

2. **Update Step 3 Component**
   - Add brand selection UI (conditional rendering)
   - Add operating hours fields (conditional)
   - Add rooftop square footage fields (conditional)
   - Add demand charge re-affirmation
   - Add peak power validation field (optional)

3. **Brand Preset Service**
   - Load brand presets from database
   - Pre-fill equipment defaults based on brand

4. **Update Use Case Service**
   - Load brand options for use case
   - Handle brand preset loading

### **Files to Create:**
- `database/migrations/[timestamp]_add_use_case_brands.sql`
- `database/migrations/[timestamp]_add_brand_questions.sql`
- `src/services/brandPresetService.ts`

### **Files to Modify:**
- `src/components/wizard/v5/steps/Step3FacilityDetails.tsx`
- `src/services/useCaseService.ts`

### **Estimated Time:** 4-6 hours

---

## 📋 **PHASE 4: RAVS FRAMEWORK & SCENARIO GENERATION**

### **Goal:** Implement RAVS calculation and scenario generation

### **Changes Required:**

1. **RAVS Calculation Service** (MVP)
   - Financial return calculation
   - Reliability scoring (basic)
   - Resiliency scoring (basic)
   - Weather risk penalty (basic)
   - Industry-specific weights

2. **Scenario Generation Service**
   - Generate scenarios (solar, generator, BESS, hybrid)
   - Calculate RAVS for each scenario
   - Rank scenarios by RAVS

3. **Explainable AI Service** (MVP - Templates)
   - Generate recommendation explanations
   - Generate "why NOT" explanations
   - Template-based (not full NLG yet)

4. **Integrate with Step 3 Completion**
   - Trigger scenario generation after Step 3
   - Store scenarios in wizard state

### **Files to Create:**
- `src/services/ravsService.ts`
- `src/services/scenarioGenerationService.ts`
- `src/services/explainableAIService.ts`

### **Files to Modify:**
- `src/components/wizard/v5/WizardV5.tsx` (trigger after Step 3)
- Calculation services (integration points)

### **Estimated Time:** 6-8 hours (MVP), 12-16 hours (full)

---

## 📋 **PHASE 5: STEP 4 ENHANCEMENT**

### **Goal:** Present scenarios with RAVS scores and explanations

### **Changes Required:**

1. **Update Step 4 Component**
   - Show battery sizing (baseline - existing)
   - Show solar scenarios (if selected)
   - Show generator scenarios (if selected)
   - Show EV scenarios (if selected)
   - Display RAVS scores
   - Display explanations ("why" and "why NOT")

2. **Scenario Comparison UI**
   - Side-by-side scenario comparison
   - Financial comparison (ROI, NPV, payback)
   - Risk comparison (weather, grid, operational)
   - Recommendation highlight

3. **CFO-Grade Financial Display**
   - Financing options (Buy/Lease/PPA)
   - Financial projections
   - Risk-adjusted returns

### **Files to Modify:**
- `src/components/wizard/v5/steps/Step4MagicFit.tsx`
- Create scenario presentation components

### **Files to Create:**
- `src/components/wizard/v5/components/ScenarioComparison.tsx`
- `src/components/wizard/v5/components/ScenarioCard.tsx`
- `src/components/wizard/v5/components/RecommendationExplanation.tsx`

### **Estimated Time:** 4-6 hours

---

## ✅ **CHRONOLOGICAL CHECKLIST**

### **Phase 1: Step 1 Enhancement** ⏳ **NEXT**
- [ ] Update Step 1 component to include grid connection
- [ ] Update wizard state structure
- [ ] Remove grid connection from Step 4
- [ ] Test Step 1 → Step 2 flow

### **Phase 2: Opportunity Discovery Popup** 📋 **AFTER PHASE 1**
- [ ] Create OpportunityDiscoveryModal component
- [ ] Create basic risk assessment service
- [ ] Create market conditions service (MVP)
- [ ] Integrate popup into wizard flow
- [ ] Test popup trigger and preference storage

### **Phase 3: Step 3 Enhancements** 📋 **AFTER PHASE 2**
- [ ] Create database migrations (brands, questions)
- [ ] Seed brand data (car wash, hotels, etc.)
- [ ] Update Step 3 component
- [ ] Create brand preset service
- [ ] Test brand selection and preset loading

### **Phase 4: RAVS Framework** 📋 **AFTER PHASE 3**
- [ ] Create RAVS calculation service (MVP)
- [ ] Create scenario generation service
- [ ] Create explainable AI service (templates)
- [ ] Integrate with Step 3 completion
- [ ] Test scenario generation and RAVS scoring

### **Phase 5: Step 4 Enhancement** 📋 **AFTER PHASE 4**
- [ ] Update Step 4 component
- [ ] Create scenario presentation components
- [ ] Integrate RAVS scores and explanations
- [ ] Test scenario presentation and comparison

---

## 🚀 **STARTING WITH PHASE 1**

**Ready to begin Phase 1: Step 1 Enhancement**

This is the foundation - combining Location + Goals + Grid Connection will inform all subsequent phases.

---

**Status:** ✅ **READY TO START PHASE 1**


