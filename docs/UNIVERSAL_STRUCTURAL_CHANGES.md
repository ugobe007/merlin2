# 🔧 UNIVERSAL STRUCTURAL CHANGES - ALL USE CASES

**Date:** December 26, 2025  
**Policy:** All changes must be systematic - structural changes apply to ALL use cases  
**Status:** 📋 **REVIEW REQUIRED**

---

## 🎯 **CORE PRINCIPLE**

> **"What we structurally change for car wash, we make for all other industry use cases."**

This means:
- ✅ Structural UI patterns (brand selection, equipment popups, validation fields)
- ✅ Data flow patterns (Step 1 → Step 3 re-affirmation)
- ✅ Question organization (grouping, conditional logic)
- ❌ NOT use case-specific content (car wash pumps vs hotel rooms)

---

## 📊 **CURRENT STRUCTURE ANALYSIS**

### **Current Step 3 (Facility Details) Structure:**
```
Step 3: Facility Details
├─ Load questions from database (useCaseService.getUseCaseBySlug())
├─ Render questions dynamically based on use case
├─ Store answers in useCaseData: Record<string, any>
├─ Exclude certain fields (solar, EV) → handled via popups
└─ Validate required fields before proceeding
```

### **Current Data Flow:**
```
Step 1: Location & Goals
  └─→ wizardState.electricityRate (auto-calculated from ZIP)

Step 3: Facility Details
  └─→ useCaseData: Record<string, any> (use case specific)

Step 4: Magic Fit (System Sizing)
  └─→ wizardState.gridConnection (currently here)
  └─→ wizardState.batteryKW, solarKW, etc.
```

---

## 🔄 **PROPOSED STRUCTURAL CHANGES**

### **Change 1: Brand/Manufacturer Selection Pattern** ⚠️ **UNIVERSAL**

**What:** Add optional brand/manufacturer selection for all use cases

**Structure:**
- **Car Wash:** El Car Wash, Tommy's Express → Equipment presets
- **Hotels:** Marriott, Hilton, Hyatt → Room configurations, amenity defaults
- **Hospitals:** HCA, Kaiser, Mayo → Equipment standards, bed configurations
- **Data Centers:** AWS, Google, Microsoft → Tier standards, PUE defaults
- **Manufacturing:** Industry-specific manufacturers → Equipment power profiles

**Implementation:**
```typescript
// Universal structure
interface BrandSelection {
  fieldName: 'brand' | 'manufacturer' | 'chain' | 'operator';
  label: string; // "Brand", "Hotel Chain", "Hospital System", etc.
  options: BrandOption[];
  loadPreset: (brandId: string) => Promise<EquipmentPreset>;
}

// Database structure (universal)
CREATE TABLE use_case_brands (
  id UUID PRIMARY KEY,
  use_case_slug TEXT NOT NULL,  -- 'car-wash', 'hotel', 'hospital', etc.
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  equipment_preset_id UUID,
  is_active BOOLEAN
);
```

**Impact:** ALL use cases get optional brand selection if configured

---

### **Change 2: Grid Connection → Step 3** ⚠️ **UNIVERSAL**

**What:** Move grid connection question from Step 4 to Step 3

**Current:** Step 4 (Magic Fit) - after system sizing  
**Proposed:** Step 3 (Facility Details) - before system sizing

**Rationale:**
- Grid connection affects power calculations (off-grid needs more generation)
- Should be known before system sizing
- More logical flow: Facility details → Grid status → System sizing

**Structure:**
```typescript
// Step 3: Add to all use cases
{
  fieldName: 'gridConnection',
  questionText: 'What is your grid connection status?',
  questionType: 'select',
  options: ['on-grid', 'off-grid', 'limited', 'unreliable', 'expensive'],
  isRequired: true,
  // Conditional: Show for all use cases (not just car wash)
}
```

**Impact:** ALL use cases get grid connection in Step 3

**Migration:**
- Remove from Step 4
- Add to Step 3 question set (database-driven)
- Update all use case configurations

---

### **Change 3: Demand Charge Re-affirmation Pattern** ⚠️ **UNIVERSAL**

**What:** Step 1 calculates, Step 3 re-affirms/confirms

**Structure:**
```typescript
// Step 1: Auto-calculate
wizardState.electricityRate = calculateFromZipCode(zipCode);
wizardState.demandCharge = calculateDemandChargeFromZipCode(zipCode);

// Step 3: Re-affirm (universal pattern)
{
  fieldName: 'demandChargeConfirmation',
  questionText: 'Monthly demand charge (from Step 1): $X/kW',
  questionType: 'number',
  defaultValue: wizardState.demandCharge, // Pre-filled from Step 1
  helpText: 'Confirm this matches your utility bill, or adjust if different',
  isRequired: false,
  sourceTracking: 'location-based-estimate' | 'user-confirmed' | 'user-override'
}
```

**Impact:** ALL use cases get demand charge re-affirmation in Step 3

**TrueQuote Compliance:**
- Track source: "Location-based estimate" vs "User-confirmed" vs "User-override"
- Show in quote: "Demand charge: $X/kW (Source: User-confirmed, originally location-based)"

---

### **Change 4: Peak Power Validation Pattern** ⚠️ **UNIVERSAL**

**What:** Show calculated power, allow user validation input

**Structure:**
```typescript
// Universal pattern for all use cases
{
  fieldName: 'peakPowerValidation',
  questionType: 'calculated-with-validation',
  calculatedValue: calculatePowerFromEquipment(useCaseData), // SSOT
  userInput: useCaseData.peakPowerOverride, // Optional validation
  displayComparison: true, // "Your input: X kW vs Calculated: Y kW"
  useForQuotes: 'calculated', // Always use calculated (SSOT)
  metadata: 'validation-reference' // User input is metadata only
}
```

**Implementation:**
- Calculate power from equipment/facility data (SSOT)
- Display calculated value prominently
- Show optional validation input field
- If user provides input, show comparison
- Use calculated value for quotes, store user input as metadata

**Impact:** ALL use cases get peak power validation field

**SSOT Compliance:**
- Power calculations remain in `useCasePowerCalculations.ts`
- User input is validation/override only
- Never use user input directly for quotes (unless explicitly approved)

---

### **Change 5: Detailed Equipment Configuration Popup** ⚠️ **UNIVERSAL**

**What:** Popup modal for detailed equipment configuration

**Structure:**
```typescript
// Universal popup pattern
interface EquipmentConfigModal {
  useCase: string;
  equipmentCategories: EquipmentCategory[];
  loadPresets: (brandId?: string) => Promise<EquipmentPreset>;
  saveToUseCaseData: (config: EquipmentConfig) => void;
}

// Examples:
// Car Wash: Pumps (High Pressure, Chemical, Support)
// Hotel: HVAC Systems, Elevators, Kitchen Equipment
// Hospital: Medical Equipment, Imaging Systems, Lab Equipment
// Data Center: Server Racks, Cooling Systems, UPS Systems
// Manufacturing: Production Lines, Compressed Air, Process Equipment
```

**Implementation:**
- Button in Step 3: "Configure Equipment (Optional)"
- Opens modal with use case-specific equipment categories
- Pre-fills from brand preset if brand selected
- Saves to `useCaseData.equipmentConfig`

**Impact:** ALL use cases can have detailed equipment popup if configured

**Database Structure:**
```sql
CREATE TABLE use_case_equipment_categories (
  id UUID PRIMARY KEY,
  use_case_slug TEXT NOT NULL,
  category_name TEXT NOT NULL,  -- "Pumps", "HVAC", "Medical Equipment", etc.
  equipment_items JSONB,  -- List of equipment items with power specs
  is_required BOOLEAN DEFAULT false
);
```

---

### **Change 6: Days/Hours of Operation** ⚠️ **UNIVERSAL**

**What:** Add operating schedule to all use cases

**Structure:**
```typescript
// Universal pattern
{
  fieldName: 'operatingSchedule',
  questionType: 'compound',
  fields: [
    { name: 'daysPerWeek', type: 'slider', min: 1, max: 7 },
    { name: 'hoursPerDay', type: 'slider', min: 4, max: 24 },
    { name: 'peakHoursStart', type: 'time' },
    { name: 'peakHoursEnd', type: 'time' }
  ]
}
```

**Use Cases:**
- **Car Wash:** Days open, hours open
- **Hotels:** 24/7 operations, peak check-in hours
- **Hospitals:** 24/7 operations, peak surgery hours
- **Retail:** Store hours, peak shopping hours
- **Manufacturing:** Shift schedules, production hours

**Impact:** ALL use cases get operating schedule if relevant

**Power Calculation Integration:**
- Use operating schedule in power calculations
- Adjust load factors based on hours
- Calculate peak demand windows

---

### **Change 7: Square Footage (Total + Rooftop)** ⚠️ **UNIVERSAL**

**What:** Separate total square footage from rooftop square footage

**Structure:**
```typescript
// Universal pattern
{
  fieldName: 'facilitySquareFootage',
  questionType: 'compound',
  fields: [
    { name: 'totalSqFt', label: 'Total Building Square Footage' },
    { name: 'roofSqFt', label: 'Rooftop Square Footage (for solar)' },
    { name: 'usableRoofPercent', calculated: true } // Auto-calculate 80% usable
  ]
}
```

**Use Cases:**
- **Car Wash:** Total building + tunnel rooftop
- **Hotels:** Total building + rooftop (for solar)
- **Retail:** Total building + rooftop (for solar)
- **Manufacturing:** Total facility + rooftop (for solar)
- **Warehouses:** Total building + large flat roof (ideal for solar)

**Impact:** ALL use cases get rooftop square footage if relevant

**Solar Integration:**
- Calculate usable roof: `usableRoofSqFt = roofSqFt * 0.8`
- Use for solar sizing in Solar Config Modal
- Recommend panel type based on available space

---

## 📋 **STRUCTURAL CHANGE SUMMARY**

| Change | Scope | Impact | Priority |
|--------|-------|--------|----------|
| **1. Brand Selection** | Universal (optional) | All use cases can have brand/manufacturer selection | Medium |
| **2. Grid Connection → Step 3** | Universal (required) | ALL use cases move grid connection to Step 3 | High |
| **3. Demand Charge Re-affirm** | Universal (required) | ALL use cases get Step 3 re-affirmation | High |
| **4. Peak Power Validation** | Universal (optional) | All use cases can show calculated + validation | Medium |
| **5. Equipment Config Popup** | Universal (optional) | All use cases can have detailed equipment popup | Medium |
| **6. Operating Schedule** | Universal (conditional) | Use cases with operating hours get schedule fields | Low |
| **7. Rooftop Square Footage** | Universal (conditional) | Use cases with buildings get rooftop field | Low |

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Database Schema Updates** (Universal)
1. Add `use_case_brands` table (universal)
2. Add `use_case_equipment_categories` table (universal)
3. Add `gridConnection` to all use case question sets
4. Add `demandChargeConfirmation` to all use case question sets
5. Add `operatingSchedule` to relevant use cases
6. Add `facilitySquareFootage` (total + rooftop) to relevant use cases

### **Phase 2: Step 3 Component Updates** (Universal)
1. Add brand selection component (conditional rendering)
2. Move grid connection from Step 4 to Step 3
3. Add demand charge re-affirmation field
4. Add peak power validation field (conditional)
5. Add equipment config popup button (conditional)
6. Add operating schedule fields (conditional)
7. Add rooftop square footage fields (conditional)

### **Phase 3: Step 4 Updates** (Universal)
1. Remove grid connection (moved to Step 3)
2. Update system sizing to use Step 3 grid connection

### **Phase 4: Calculation Updates** (Universal)
1. Update all power calculations to use Step 3 grid connection
2. Integrate operating schedule into power calculations
3. Integrate equipment configs into power calculations
4. Keep peak power calculation SSOT-compliant (calculated, not user input)

### **Phase 5: Use Case-Specific Content** (Per Use Case)
1. Car Wash: Brand presets, pump categories
2. Hotels: Chain presets, HVAC/amenity categories
3. Hospitals: System presets, medical equipment categories
4. Data Centers: Provider presets, rack/cooling categories
5. Manufacturing: Manufacturer presets, production line categories

---

## ⚠️ **CRITICAL DECISIONS NEEDED**

### **Decision 1: Grid Connection Location**
**Question:** Move grid connection to Step 3 for ALL use cases, or keep in Step 4?

**Options:**
- **Option A:** Move to Step 3 for ALL use cases (consistent)
- **Option B:** Keep in Step 4 for all use cases (current)
- **Option C:** Conditional - Step 3 for some, Step 4 for others (inconsistent)

**Recommendation:** Option A (consistent, better UX flow)

---

### **Decision 2: Brand Selection Scope**
**Question:** Which use cases should have brand selection?

**Options:**
- **Option A:** All use cases (universal pattern)
- **Option B:** Only use cases with clear brand/chain options (car wash, hotels, hospitals)
- **Option C:** Configurable per use case (database-driven)

**Recommendation:** Option C (flexible, database-driven)

---

### **Decision 3: Equipment Config Popup Scope**
**Question:** Which use cases need detailed equipment configuration?

**Options:**
- **Option A:** All use cases (universal pattern)
- **Option B:** Only use cases with complex equipment (car wash, hospitals, manufacturing)
- **Option C:** Configurable per use case (database-driven)

**Recommendation:** Option C (flexible, database-driven)

---

### **Decision 4: Operating Schedule Scope**
**Question:** Which use cases need operating schedule?

**Options:**
- **Option A:** All use cases
- **Option B:** Only use cases with variable operating hours (retail, car wash, manufacturing)
- **Option C:** Configurable per use case (database-driven)

**Recommendation:** Option B (relevant use cases only)

---

## ✅ **APPROVAL CHECKLIST**

Before implementation, approve:

- [ ] **Grid Connection:** Move to Step 3 for ALL use cases? (Decision 1)
- [ ] **Brand Selection:** Universal pattern or configurable? (Decision 2)
- [ ] **Equipment Popup:** Universal pattern or configurable? (Decision 3)
- [ ] **Operating Schedule:** Which use cases? (Decision 4)
- [ ] **Demand Charge Re-affirm:** Universal for all use cases? ✅ (Already approved)
- [ ] **Peak Power Validation:** Universal pattern? ✅ (Already approved)
- [ ] **Rooftop Square Footage:** Universal for building-based use cases? ✅ (Already approved)

---

**Status:** 📋 **AWAITING DECISIONS ON STRUCTURAL SCOPE**

