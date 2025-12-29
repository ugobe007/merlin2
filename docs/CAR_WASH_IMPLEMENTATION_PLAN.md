# 🚗 CAR WASH MODULE - IMPLEMENTATION PLAN

**Date:** December 26, 2025  
**Status:** ✅ **APPROVED - READY FOR IMPLEMENTATION**

---

## 📋 **IMPLEMENTATION PHASES**

### **Phase 1: Database Schema Updates** (SSOT-Compliant)

#### **1.1 Brand Preset Tables**
```sql
-- Car wash brands lookup
CREATE TABLE car_wash_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,  -- "El Car Wash", "Tommy's Express"
  slug TEXT NOT NULL UNIQUE,  -- "el-car-wash", "tommys-express"
  logo_url TEXT,
  description TEXT,
  equipment_preset_id UUID REFERENCES car_wash_equipment_presets(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment presets per brand
CREATE TABLE car_wash_equipment_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES car_wash_brands(id),
  preset_name TEXT NOT NULL,  -- "Express Conveyor Standard"
  config_data JSONB NOT NULL,  -- { pumps: { highPressure: 5, chemical: 10, ... }, ... }
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data for El Car Wash and Tommy's Express (from appendix)
```

#### **1.2 Update Use Case Configuration**
- Add brand-specific defaults to `use_case_configurations` for car-wash
- Link brand presets to equipment defaults

---

### **Phase 2: Step 3 UI Updates** (Facility Details)

#### **2.1 Brand Selection** (First Question)
- **Component:** Logo grid or dropdown
- **Storage:** `useCaseData.brand` (slug)
- **Logic:** 
  - On selection, load equipment preset from database
  - Pre-fill pump counts and equipment defaults
  - Filter car wash type options if brand has specific design model

#### **2.2 Car Wash Type** (Second Question)
- **Component:** Radio buttons or card selection
- **Options:**
  - Express Conveyor Tunnel
  - Full Service Tunnel
  - In-Bay Automatic
  - Self Service
- **Storage:** `useCaseData.carWashType`
- **Logic:**
  - Filter bay count options based on type (1-2 for tunnels, 2-20 for self-serve)

#### **2.3 Days and Hours of Operation**
- **Component:** Sliders
- **Fields:**
  - Days open per week: Slider 5-7
  - Hours open per day: Slider 8-16
- **Storage:** `useCaseData.daysPerWeek`, `useCaseData.hoursPerDay`

#### **2.4 Square Footage**
- **Component:** Number inputs
- **Fields:**
  - Total Building and Canopy square footage
  - Main Tunnel Building Rooftop square footage
- **Storage:** `useCaseData.totalSqFt`, `useCaseData.roofSqFt`
- **Logic:**
  - Calculate usable roof % (industry standard: 80%)
  - Store `useCaseData.usableRoofSqFt = roofSqFt * 0.8`
  - Use for solar sizing in Solar Popup Modal

#### **2.5 Grid Connection** (NEW - Moved from Step 4)
- **Component:** Radio buttons or dropdown
- **Options:** 'on-grid', 'off-grid', 'limited', 'unreliable', 'expensive'
- **Storage:** `useCaseData.gridConnection`
- **Logic:**
  - Conditional: Show only for car wash use case
  - Or show for all use cases (consistency decision needed)

#### **2.6 Peak Power Demand** (Validation/Override)
- **Component:** Number input with calculated value comparison
- **Storage:** `useCaseData.peakPowerDemandOverride` (optional)
- **Display:**
  - Show calculated value: "Calculated: X kW (from equipment)"
  - Optional input: "Your peak demand (optional validation):"
  - If user provides: Show comparison: "Your input: Y kW vs Calculated: X kW"
  - Use calculated value for quotes, flag user input as metadata

#### **2.7 Number of Tunnels or Wash Bays**
- **Component:** Number input (slider or dropdown)
- **Storage:** `useCaseData.bayCount` (already exists)
- **Logic:**
  - Filter max based on car wash type:
    - Conveyor/Full Service/In-Bay: 1-2 max
    - Self Service: 2-20 max

#### **2.8 Average Vehicle Throughput**
- **Component:** Number input
- **Fields:**
  - Vehicles per day (conditional on car wash type)
- **Storage:** `useCaseData.vehiclesPerDay`
- **Logic:**
  - Different label based on type (automated system vs self-serve)

#### **2.9 Detailed Pump Configuration** (POPUP MODAL)
- **Trigger:** Button "Configure Pumps (Optional)"
- **Component:** Modal with three sections:
  - High Pressure Pumps: Slider 0-20
  - Chemical Application Pumps: Slider 0-20
  - Support and Utilities Pumps: Slider 0-20
- **Storage:** 
  ```typescript
  useCaseData.pumps = {
    highPressure: number,
    chemical: number,
    support: number
  }
  ```
- **Logic:**
  - Pre-fill from brand preset if brand selected
  - Use in `calculateCarWashEquipmentPower()` integration

#### **2.10 Dryers**
- **Component:** Number input + radio buttons
- **Fields:**
  - Number of dryers: Slider 1-10
  - Dryer type: Radio buttons "Standard" or "High Power"
- **Storage:** `useCaseData.dryerCount`, `useCaseData.dryerType: 'standard' | 'high-power'`

#### **2.11 Vacuum Stations**
- **Component:** Number input
- **Storage:** `useCaseData.vacuumStations` (already exists)

#### **2.12 Monthly Demand Charges** (Re-affirm)
- **Component:** Display calculated value + optional override input
- **Display:**
  - Show: "Monthly demand charge (from Step 1): $X/kW"
  - Input: "Confirm or adjust (optional):"
- **Storage:** 
  - Primary: `wizardState.electricityRate` (from Step 1)
  - Override: `useCaseData.demandChargeOverride` (optional)
- **TrueQuote:** Track source: "Location-based estimate" vs "User-confirmed" vs "User-override"

---

### **Phase 3: Step 1 Updates** (Location & Goals)

#### **3.1 Monthly Demand Charges Auto-calculation**
- **Enhancement:** Improve demand charge calculation from ZIP code
- **Storage:** Already in `wizardState.electricityRate`
- **Logic:**
  - Auto-calculate from ZIP → utility → demand charge rate
  - Show preview: "Estimated demand charge: $X/kW (based on location)"
  - Allow user to adjust if they know their rate

---

### **Phase 4: Calculation Updates** (SSOT-Compliant)

#### **4.1 Update `calculateCarWashPower()` Integration**
- **File:** `packages/core/src/calculations/useCasePowerCalculations.ts`
- **Updates:**
  - Integrate pump counts from `useCaseData.pumps`
  - Use equipment presets from database if brand selected
  - Use `useCaseData.gridConnection` if needed for car wash-specific logic
  - Keep peak power calculation in function (SSOT)
  - Accept user override as metadata only (validation reference)

#### **4.2 Update `calculateCarWashEquipmentPower()`**
- **Integration:** 
  - Map `useCaseData.pumps` to `CarWashEquipmentConfig`
  - Use dryer type (standard vs high-power)
  - Use brand preset defaults if available

#### **4.3 Solar Sizing Integration**
- **File:** Solar sizing logic (existing)
- **Updates:**
  - Use `useCaseData.usableRoofSqFt` for solar capacity calculation
  - Add panel type recommendation (Standard vs High Efficiency)
  - Show in Solar Config Modal: "Based on X sq ft roof (Y% usable), we recommend High Efficiency panels"

---

### **Phase 5: TrueQuote Compliance**

#### **5.1 Source Attribution**
- Add source tracking for:
  - Peak power demand: "Calculated from equipment" vs "User-provided validation"
  - Demand charges: "Location-based estimate" vs "User-confirmed" vs "User-override"
  - Equipment presets: "Brand preset: El Car Wash" vs "Manual configuration"

#### **5.2 Quote Display**
- Show source citations in quote results
- Display validation comparisons (calculated vs user input)

---

## 📝 **DATA FLOW**

```
Step 1: Location & Goals
  ├─→ Auto-calculate demand charge from ZIP
  └─→ Store in wizardState.electricityRate

Step 3: Facility Details (Car Wash)
  ├─→ Brand Selection → useCaseData.brand → Load equipment preset
  ├─→ Car Wash Type → useCaseData.carWashType → Filter bay options
  ├─→ Days/Hours → useCaseData.daysPerWeek, hoursPerDay
  ├─→ Square Footage → useCaseData.totalSqFt, roofSqFt, usableRoofSqFt
  ├─→ Grid Connection → useCaseData.gridConnection (conditional)
  ├─→ Peak Power (validation) → useCaseData.peakPowerDemandOverride
  ├─→ Bays → useCaseData.bayCount
  ├─→ Vehicle Throughput → useCaseData.vehiclesPerDay
  ├─→ Pumps (popup) → useCaseData.pumps
  ├─→ Dryers → useCaseData.dryerCount, dryerType
  ├─→ Vacuum Stations → useCaseData.vacuumStations
  └─→ Demand Charges (re-affirm) → Show wizardState.electricityRate, allow override

Quote Generation
  ├─→ calculateCarWashPower() uses equipment data (SSOT)
  ├─→ Equipment presets from database if brand selected
  ├─→ Pump counts from useCaseData.pumps
  └─→ Peak power: Use calculated, flag user override as metadata
```

---

## 🔄 **INTEGRATION POINTS**

### **Existing Systems to Update:**
1. ✅ `Step3FacilityDetails.tsx` - Add car wash-specific questions
2. ✅ `calculateCarWashPower()` - Integrate new equipment data
3. ✅ `calculateCarWashEquipmentPower()` - Use pump counts, dryer types
4. ✅ Solar Config Modal - Use rooftop square footage
5. ✅ `useCaseService` - Load brand presets from database
6. ✅ Quote Engine - Pass all car wash data to calculations

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database** (Day 1)
- [ ] Create `car_wash_brands` table
- [ ] Create `car_wash_equipment_presets` table
- [ ] Seed El Car Wash preset data
- [ ] Seed Tommy's Express preset data
- [ ] Update `use_case_configurations` for car-wash

### **Phase 2: Step 3 UI** (Day 1-2)
- [ ] Brand selection component
- [ ] Car wash type selection
- [ ] Days/hours sliders
- [ ] Square footage inputs
- [ ] Grid connection (conditional for car wash)
- [ ] Peak power validation input
- [ ] Bay count (with type filtering)
- [ ] Vehicle throughput input
- [ ] Pump configuration modal
- [ ] Dryer inputs
- [ ] Vacuum stations input
- [ ] Demand charge re-affirm

### **Phase 3: Step 1** (Day 2)
- [ ] Enhance demand charge auto-calculation
- [ ] Show demand charge preview

### **Phase 4: Calculations** (Day 2-3)
- [ ] Integrate pump counts into `calculateCarWashEquipmentPower()`
- [ ] Integrate dryer types
- [ ] Use brand presets in power calculations
- [ ] Keep peak power calculation SSOT-compliant

### **Phase 5: TrueQuote** (Day 3)
- [ ] Add source attribution
- [ ] Update quote display with sources

### **Testing** (Day 3-4)
- [ ] Test brand selection → equipment preset loading
- [ ] Test power calculations with new equipment data
- [ ] Test solar sizing with rooftop square footage
- [ ] Test demand charge flow (Step 1 → Step 3)
- [ ] Test quote generation with all new fields
- [ ] Verify SSOT compliance (no hardcoded brand logic)
- [ ] Verify TrueQuote compliance (all sources cited)

---

**Status:** ✅ **READY TO IMPLEMENT**


