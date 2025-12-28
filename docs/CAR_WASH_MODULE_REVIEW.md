# 🚗 CAR WASH MODULE EDITS - SSOT & TrueQuote Compliance Review

**Date:** December 26, 2025  
**Reviewer:** AI Assistant  
**Status:** ⚠️ **PENDING APPROVAL** - Issues identified

---

## ⚠️ **CRITICAL CONCERNS**

### **1. SSOT Violations (Must Fix)**

#### **Issue 1.1: Brand Selection Logic**
- **Request:** Brand selection filters car wash type options
- **SSOT Risk:** ❌ **HIGH** - Brand-specific logic should NOT be in power calculations
- **Recommendation:** 
  - ✅ Store brand in `useCaseData` (metadata only)
  - ✅ Use brand as lookup key for equipment presets in database
  - ❌ DO NOT hardcode brand logic in calculation functions
  - ✅ Move brand presets to `use_case_configurations` table (database-driven)

#### **Issue 1.2: Peak Power Demand User Input**
- **Request:** Ask user for peak power demand
- **SSOT Risk:** ❌ **HIGH** - Power calculations must be SSOT, not user-input
- **Current Implementation:** `calculateCarWashPower()` calculates power from equipment
- **Recommendation:**
  - ✅ Keep power calculation in `useCasePowerCalculations.ts` (SSOT)
  - ✅ Allow user to provide peak demand as **validation/override** only
  - ✅ If user provides peak demand, show comparison: "Your input: X kW vs Calculated: Y kW"
  - ✅ Use calculated value for quotes, flag user input as "validation reference"

#### **Issue 1.3: Grid Connection User Input**
- **Request:** Ask user for grid connection type
- **SSOT Risk:** ⚠️ **MEDIUM** - Already exists in wizard state
- **Current Implementation:** Grid connection is in `wizardState.gridConnection` (Step 4)
- **Recommendation:**
  - ✅ Keep grid connection in Step 4 (Magic Fit) where it currently is
  - ✅ Do NOT duplicate in Step 3 (Facility Details)
  - ⚠️ If car wash needs it earlier, consider showing it as "read-only preview" based on ZIP code
  - ❌ DO NOT move grid connection to Step 3

---

### **2. TrueQuote Compliance Issues**

#### **Issue 2.1: Monthly Demand Charges**
- **Request:** "Are we asking for their monthly electricity bill from the user here?"
- **TrueQuote Risk:** ❌ **HIGH** - User-provided bill data needs source attribution
- **Recommendation:**
  - ✅ If collecting electricity bill: Must show TrueQuote source: "User-provided utility bill"
  - ✅ Provide option to auto-calculate from location (ZIP → utility → rate lookup)
  - ✅ Allow manual override with source tracking
  - ✅ Show in quote: "Demand charge: $X/kW (Source: User-provided bill) vs $Y/kW (Location-based estimate)"

#### **Issue 2.2: Primary Energy Goal (Why Only One?)**
- **Request:** User questions why only one energy goal
- **TrueQuote Risk:** ✅ **LOW** - This is workflow, not calculation
- **Current Implementation:** Goals are in Step 1, multiple goals supported
- **Recommendation:**
  - ✅ Multiple goals ARE supported (goals array in wizard state)
  - ✅ Confirm goals are properly passed through to quote calculations
  - ✅ Show all selected goals in quote summary

---

### **3. Workflow & UI Issues**

#### **Issue 3.1: 5-Step Constraint**
- **Requirement:** Must stay with 5 steps only, additional steps = sub-steps/popups
- **Current Wizard Steps:**
  1. Step 1: Location & Goals
  2. Step 2: Industry Selection
  3. Step 3: Facility Details (where car wash questions go)
  4. Step 4: Magic Fit (System sizing)
  5. Step 5: Quote Review

- **Car Wash Questions Breakdown:**
  - Brand Selection → **Step 3** (facility details)
  - Car Wash Type → **Step 3** (facility details)
  - Days/Hours → **Step 3** (facility details)
  - Square Footage → **Step 3** (facility details) + **Solar Popup**
  - Grid Connection → **Step 4** (already exists, DO NOT move)
  - Peak Power → **Step 3** (as override/validation only)
  - Tunnels/Bays → **Step 3** (facility details)
  - Vehicle Throughput → **Step 3** (facility details)
  - Pumps (detailed) → **Step 3** (facility details - **POPUP** for detailed pump configuration)
  - Dryers → **Step 3** (facility details)
  - Vacuum Stations → **Step 3** (facility details)
  - Monthly Demand → **Step 1** (location - or **Step 3** as optional override)

- **Recommendation:**
  - ✅ Most questions fit in Step 3 (Facility Details)
  - ⚠️ **Detailed pump configuration** should be a **POPUP MODAL** within Step 3
  - ✅ Solar square footage ties to existing **Solar Popup Modal** (already exists)
  - ❌ Do NOT create new wizard steps

#### **Issue 3.2: Solar Integration**
- **Request:** Evaluate solar based on rooftop % and recommend Standard vs High Efficiency panels
- **Current Implementation:** Solar popup exists, solar sizing logic exists
- **Recommendation:**
  - ✅ Use existing `SolarConfigModal` (Step 4)
  - ✅ Add rooftop % calculation to solar sizing logic
  - ✅ Add panel type recommendation (Standard vs High Efficiency) to solar calculations
  - ✅ Show recommendation in solar popup: "Based on 5,000 sq ft roof (80% usable), we recommend High Efficiency panels for maximum generation"
  - ✅ This is SSOT-compliant (solar sizing is already in `calculateSolarSizing()`)

---

## ✅ **APPROVED APPROACHES**

### **1. Brand Selection**
- ✅ Store brand as metadata in `useCaseData.brand`
- ✅ Use brand to look up equipment presets from database
- ✅ Database table: `use_case_configurations` with brand-specific equipment defaults
- ✅ Power calculation uses equipment config, not brand directly

### **2. Car Wash Type**
- ✅ Store in `useCaseData.carWashType`
- ✅ Use type to filter bay count options (1-2 for tunnels, 2-20 for self-serve)
- ✅ Use type in power calculations (already implemented)

### **3. Days/Hours of Operation**
- ✅ Store in `useCaseData.daysPerWeek`, `useCaseData.hoursPerDay`
- ✅ Use in power calculations (already in `CarWashOperationsConfig`)

### **4. Square Footage**
- ✅ Store in `useCaseData.totalSqFt`, `useCaseData.roofSqFt`
- ✅ Use for solar sizing (existing solar logic)
- ✅ Calculate usable roof %: `usableRoofSqFt = roofSqFt * 0.8` (industry standard)

### **5. Number of Tunnels/Bays**
- ✅ Store in `useCaseData.bayCount` (already exists)
- ✅ Filter options based on car wash type (UI logic only)
- ✅ Use in power calculations (already implemented)

### **6. Vehicle Throughput**
- ✅ Store in `useCaseData.vehiclesPerDay`
- ✅ Use for operational analysis (not power calculation, but useful for financial metrics)
- ✅ Can be used to validate power calculations (more vehicles = more equipment use)

### **7. Detailed Pump Configuration**
- ✅ **POPUP MODAL** within Step 3
- ✅ Store in `useCaseData.pumps: { highPressure: number, chemical: number, support: number }`
- ✅ Use in power calculations (needs integration with `calculateCarWashEquipmentPower()`)
- ✅ Brand-specific presets pre-fill pump counts

### **8. Dryers**
- ✅ Store in `useCaseData.dryerCount`, `useCaseData.dryerType: 'standard' | 'high-power'`
- ✅ Use in power calculations (already in `CAR_WASH_EQUIPMENT_POWER.drying`)

### **9. Vacuum Stations**
- ✅ Store in `useCaseData.vacuumStations` (already exists)
- ✅ Use in power calculations (already implemented)

---

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Database Updates (SSOT-Compliant)**
1. ✅ Add brand lookup table: `car_wash_brands` (id, name, slug, equipment_preset_id)
2. ✅ Add equipment preset table: `car_wash_equipment_presets` (id, brand_id, pump_counts, default_config)
3. ✅ Update `use_case_configurations` for car-wash with brand-specific defaults

### **Phase 2: UI Updates (Step 3)**
1. ✅ Add brand selection (dropdown/logo grid) → stores `useCaseData.brand`
2. ✅ Add car wash type selection → stores `useCaseData.carWashType`
3. ✅ Add days/hours sliders → stores `useCaseData.daysPerWeek`, `useCaseData.hoursPerDay`
4. ✅ Add square footage inputs → stores `useCaseData.totalSqFt`, `useCaseData.roofSqFt`
5. ✅ Add tunnels/bays input (filtered by type) → stores `useCaseData.bayCount`
6. ✅ Add vehicle throughput input → stores `useCaseData.vehiclesPerDay`
7. ✅ Add dryer inputs → stores `useCaseData.dryerCount`, `useCaseData.dryerType`
8. ✅ Add vacuum stations input → stores `useCaseData.vacuumStations`
9. ⚠️ Add **POPUP MODAL** for detailed pump configuration → stores `useCaseData.pumps`

### **Phase 3: Calculation Updates (SSOT-Compliant)**
1. ✅ Update `calculateCarWashPower()` to use equipment presets from database
2. ✅ Integrate pump counts into `calculateCarWashEquipmentPower()`
3. ✅ Add peak demand validation (show user input vs calculated, use calculated)
4. ✅ Keep grid connection in Step 4 (no changes)
5. ✅ Update solar sizing to use rooftop % and recommend panel type

### **Phase 4: TrueQuote Updates**
1. ✅ Add source attribution for monthly demand charges
2. ✅ Add source attribution for peak demand (if user-provided)
3. ✅ Ensure all equipment power values cite sources (NREL, manufacturer specs)

---

## ✅ **USER APPROVALS (December 26, 2025)**

### **Q1: Peak Power Demand** ✅ **APPROVED**
- **Approved Approach:** Option A - Calculate from equipment (SSOT-compliant), allow user input as validation only
- **Implementation:** 
  - Calculate power from equipment in `calculateCarWashPower()` (SSOT)
  - Show user input field as "validation/override" in Step 3
  - Display comparison: "Your input: X kW vs Calculated: Y kW"
  - Use calculated value for quotes, flag user input as "validation reference"

### **Q2: Grid Connection** ✅ **APPROVED**
- **Approved Approach:** Move to Step 3 for car wash
- **Implementation:**
  - Add grid connection question to Step 3 (Facility Details) for car wash
  - Conditional display: Show for car wash use case
  - Store in `useCaseData.gridConnection`
  - Use in power calculations if needed for car wash logic

### **Q3: Monthly Demand Charges** ✅ **APPROVED**
- **Approved Approach:** Step 1 (auto-calculate from ZIP), re-affirm/confirm number in Step 3
- **Implementation:**
  - Step 1: Auto-calculate demand charge from ZIP code (location-based)
  - Store in wizard state (already exists)
  - Step 3: Show calculated value, allow user to confirm or override
  - Track source: "Location-based estimate" vs "User-confirmed" vs "User-override"
  - TrueQuote: Show source attribution in quote

### **Q4: Multiple Energy Goals** ⏳ **TO VERIFY**
- **Status:** Need to verify multiple goals are properly passed through
- **Action:** Verify goals array is used in quote calculations

---

## ✅ **APPROVAL CHECKLIST**

Before implementation, user approved:

- [x] **Brand selection approach** - Database-driven presets, not hardcoded logic ✅
- [x] **Peak power demand approach** - Calculate from equipment, user input as validation ✅
- [x] **Grid connection location** - Move to Step 3 for car wash ✅
- [x] **Monthly demand charges location** - Step 1 auto-calculate + Step 3 re-affirm ✅
- [ ] **Multiple goals support** - Verify it works (pending verification)
- [x] **Detailed pump configuration** - Popup modal (not new step) ✅
- [x] **Solar integration approach** - Use existing popup, add rooftop % and panel recommendations ✅

---

## 🚨 **BLOCKERS**

**ALL BLOCKERS RESOLVED** ✅

All critical items have been approved by user. Ready to proceed with implementation.

---

**Status:** ✅ **APPROVED - READY FOR IMPLEMENTATION**

