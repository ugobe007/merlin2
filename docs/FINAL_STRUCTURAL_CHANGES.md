# ✅ FINAL STRUCTURAL CHANGES - CONFIRMED

**Date:** December 26, 2025  
**Status:** ✅ **APPROVED - READY FOR IMPLEMENTATION**

---

## 🎯 **CONFIRMED STRUCTURAL CHANGES**

### **1. Step 1 Enhancement: Location + Goals + Grid Connection** ✅

**Change:** Combine grid connection with Step 1

**Structure:**
```
Step 1: Location + Goals + Grid Connection
├─ Location
│  ├─ State
│  ├─ ZIP Code
│  └─ Auto-calculate: Electricity rate, demand charges
├─ Goals
│  └─ Energy savings, revenue, resilience, etc.
└─ Grid Connection Status
   ├─ On-grid (reliable)
   ├─ On-grid (unreliable/outages)
   ├─ On-grid (expensive/high rates)
   ├─ Off-grid
   └─ Limited capacity
```

**Rationale:**
- Grid connection informs AI-driven opportunity assessment
- Location + grid status = risk factors for solar/generator/EV
- Goals inform priority weighting (cost vs resilience vs revenue)

**Impact:** ALL use cases

---

### **2. AI-Driven Opportunity Discovery (After Step 2)** ✅

**Change:** Intelligent opportunity assessment using risk analysis

**Structure:**
- Trigger: After industry selection (Step 2)
- Process: AI assesses risks (weather, grid, system)
- Display: Show opportunities based on risk + location + goals
- Store: User preferences (interested in solar/generator/EV)

**Impact:** ALL use cases

---

### **3. Brand/Chain Selection (Universal Pattern)** ✅

**Change:** Add brand/chain selection for use case-specific categories

**Examples:**
- Car Wash: Tommy's Express, El Car Wash
- Hotels: Hilton, Marriott, Hyatt
- Hospitals: HCA, Kaiser, Mayo

**Database:** `use_case_brands` table

**Impact:** All relevant use cases (configurable)

---

### **4. Operating Hours (Universal for Relevant Use Cases)** ✅

**Change:** Add operating schedule (days/hours) to relevant use cases

**Structure:**
- Fields: `daysPerWeek`, `hoursPerDay`, `peakHoursStart`, `peakHoursEnd`
- Database: Add to relevant use cases

**Impact:** Car wash, retail, manufacturing, hotels, etc.

---

### **5. Demand Charge Re-affirmation (Step 3)** ✅

**Change:** Step 1 calculates, Step 3 re-affirms

**Status:** Confirmed, implement as planned

---

### **6. Peak Power Validation (Step 3)** ✅

**Change:** Show calculated value, allow optional user validation

**Status:** Confirmed, implement as planned

---

### **7. Equipment Config Popup (Conditional)** ✅

**Change:** Detailed equipment configuration modal

**Status:** Conditional (use case-specific)

---

### **8. Rooftop Square Footage (Universal for Buildings)** ✅

**Change:** Separate total + rooftop for solar sizing

**Status:** Confirmed, important for solar opportunities

---

## 🔄 **REVISED WIZARD FLOW**

```
Step 1: Location + Goals + Grid Connection
  ├─ Collect all three inputs
  └─ Auto-calculate: Electricity rates, demand charges
  ↓
Step 2: Industry Selection
  └─ User selects industry
  ↓
AI OPPORTUNITY ASSESSMENT (Background):
  ├─ Fetch weather data (NOAA)
  ├─ Fetch grid reliability (EIA)
  ├─ Assess risks (weather, grid, system)
  └─ Generate initial opportunity recommendations
  ↓
OPPORTUNITY DISCOVERY POPUP:
  ├─ Show opportunities (risk-aware)
  ├─ Explain: "Full scenarios calculated after Step 3"
  └─ User selects interests
  ↓
Step 3: Facility Details
  ├─ Brand/chain selection (if applicable)
  ├─ Operating hours (if applicable)
  ├─ Rooftop square footage (if applicable)
  ├─ Demand charge re-affirmation
  ├─ Peak power validation (optional)
  └─ All use case-specific questions (SSOT)
  ↓
AI SCENARIO GENERATION (After Step 3):
  ├─ Complete risk assessment
  ├─ Generate scenarios (Monte Carlo)
  ├─ Financial modeling (ROI, NPV, payback)
  └─ Rank scenarios by risk + preferences
  ↓
Step 4: Magic Fit + Scenario Presentation
  ├─ Battery sizing (baseline)
  ├─ IF Solar selected: Show scenarios with risk assessment
  ├─ IF Generator selected: Show scenarios with reliability analysis
  ├─ IF EV selected: Show scenarios with revenue potential
  └─ Present AI recommendations with explanations
  ↓
Step 5: Quote Review
  └─ Final quote with selected scenario
```

---

## 📊 **DATABASE CHANGES REQUIRED**

### **New Tables:**
1. `use_case_brands` - Brand/chain selection
2. `risk_assessments` - Store risk scores (optional, for analytics)

### **Updates to Existing:**
1. All use case question sets: Add grid connection (move from Step 4)
2. Relevant use cases: Add operating hours questions
3. Building-based use cases: Add rooftop square footage
4. All use cases: Add demand charge re-affirmation

---

## ✅ **IMPLEMENTATION PRIORITY**

### **Phase 1: Step 1 Enhancement**
1. Combine grid connection with Step 1
2. Update Step 1 UI
3. Update wizard state structure

### **Phase 2: Opportunity Discovery (Basic)**
1. Create opportunity discovery popup
2. Basic risk assessment (weather + grid)
3. Store user preferences

### **Phase 3: Step 3 Enhancements**
1. Brand/chain selection component
2. Operating hours fields
3. Rooftop square footage
4. Demand charge re-affirmation
5. Peak power validation

### **Phase 4: AI Integration (MVP)**
1. Weather data integration (NOAA)
2. Grid reliability data (EIA)
3. Risk scoring algorithms
4. Basic scenario generation
5. Financial calculations

### **Phase 5: Step 4 Enhancement**
1. Scenario presentation
2. AI recommendations
3. Explanation generation (templates)

---

---

## 🏆 **CATEGORY LEADER STRATEGY (RAVS Framework)**

**See:** `docs/RAVS_FRAMEWORK_CATEGORY_LEADER_STRATEGY.md` for full details

### **Key Components:**
- **RAVS Formula:** Risk-Adjusted Value Score (financial + reliability + resiliency - penalties)
- **Explainable AI:** "Why NOT" explanations for transparency
- **Industry-Specific Logic:** Tailored priorities and weights per use case
- **CFO-Grade Financing:** Buy/Lease/PPA recommendations with RAVS adjustments

**Status:** ✅ **ALL STRUCTURAL CHANGES CONFIRMED - RAVS FRAMEWORK INTEGRATED - READY FOR IMPLEMENTATION**

