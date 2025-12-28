# 🎯 WIZARD OPPORTUNITY DISCOVERY STRATEGY

**Date:** December 26, 2025  
**Status:** 📋 **STRATEGIC DIRECTION**

---

## 🎯 **CORE STRATEGY**

> **"Help users understand their solar, EV charging, and generator opportunities early, but calculate full options after Step 3."**

### **Key Principles:**
1. **Early Discovery:** Identify opportunities immediately after industry selection
2. **Educational:** Users don't understand solar/EV, so explain opportunities first
3. **Location-Based:** Use location + market conditions to identify viable options
4. **Deferred Calculation:** Full financial modeling waits until Step 3 complete
5. **Scenario-Based:** Present multiple scenarios (savings, revenue, cost reduction)
6. **Business Owner Focus:** Think like business owners - show full value proposition

---

## 🔄 **REVISED WIZARD FLOW**

### **NEW Flow After Industry Selection:**

```
Step 2: User selects industry icon (e.g., "Hotel")
  ↓
POPUP MODAL: "Explore Opportunities for Your Location"
  ├─→ Solar: "Yes, I'm interested in solar"
  ├─→ Power Generators: "Yes, I'm interested in generators"
  └─→ EV Charging: "Yes, I'm interested in EV charging"
  ↓
User clicks "Continue" → Wizard stores preferences
  ↓
Step 3: Facility Details (existing questions)
  ↓
Step 4: Magic Fit → PRESENT CALCULATED OPTIONS
  ├─→ If Solar selected: Show solar opportunities + financials
  ├─→ If Generator selected: Show generator options + financials
  └─→ If EV selected: Show EV charging opportunities + financials
```

---

## 📋 **STRUCTURAL CHANGES (REVISED)**

### **Change 1: Opportunity Discovery Popup (NEW - After Step 2)**

**What:** Popup modal after industry selection

**Structure:**
```typescript
interface OpportunityDiscoveryModal {
  industry: string;
  location: { state: string; zipCode: string };
  
  opportunities: {
    solar: {
      available: boolean;  // Based on location/market
      explanation: string;  // "Solar can reduce your energy costs by 30-50%..."
      marketConditions: {
        pricePerWatt: number;
        paybackYears: number;
        viability: 'high' | 'medium' | 'low';
      };
      whyNotAvailable?: string;  // If solar not viable
      alternative?: 'generator';  // Suggest generator if solar not viable
    };
    generator: {
      available: boolean;
      explanation: string;
      marketConditions: {
        pricePerKW: number;
        fuelType: 'diesel' | 'natural-gas';
      };
    };
    evCharging: {
      available: boolean;
      explanation: string;
      marketConditions: {
        pricePerPort: number;
        revenuePotential: number;  // Per month per port
      };
    };
  };
  
  userSelection: {
    interestedInSolar?: boolean;
    interestedInGenerator?: boolean;
    interestedInEV?: boolean;
  };
}
```

**Implementation:**
- Trigger: After Step 2 (Industry Selection), before Step 3
- Store preferences in wizard state
- Use preferences in Step 4 to calculate and present options

**Database:**
- Store opportunity preferences: `wizardState.opportunityPreferences`

---

### **Change 2: Use Case-Specific Categories (Enhanced)**

**What:** Additional questions for use case-specific categories

**Structure:**
- **Operating Hours:** Universal for relevant use cases
- **Brand Name/Chain:** Universal pattern (Tommy's Car Wash, Hilton Hotels, etc.)
- **Database Updates:** Add to all relevant use cases

**Examples:**
- **Car Wash:** Brand (Tommy's, El Car Wash), Operating Hours
- **Hotels:** Chain (Hilton, Marriott, etc.), Operating Hours
- **Hospitals:** System (HCA, Kaiser, etc.), Operating Hours
- **Retail:** Chain (Walmart, Target, etc.), Operating Hours

**Database Schema:**
```sql
-- Universal brand/chain selection
CREATE TABLE use_case_brands (
  id UUID PRIMARY KEY,
  use_case_slug TEXT NOT NULL,
  name TEXT NOT NULL,  -- "Tommy's Express", "Hilton", "HCA Health"
  slug TEXT NOT NULL,
  equipment_preset_id UUID,
  market_conditions JSONB,  -- Pricing, typical configurations
  is_active BOOLEAN
);
```

---

### **Change 3: SSOT Compliance - Unified Questions**

**Critical Policy:**
> **"Car wash questions on main merlin site = same as carwashenergy site"**

**Structure:**
- All use case questions stored in database (`custom_questions` table)
- No nested questions
- No duplicate question sets
- Single source of truth for each use case

**Implementation:**
- Car wash questions: Same in `car-wash` use case (used by both sites)
- No conditional "if carwashenergy.com then ask X" logic
- Questions configured in database, rendered dynamically

---

### **Change 4: Scenario-Based Financial Presentation (Step 4)**

**What:** Present multiple scenarios showing full value proposition

**Structure:**
```typescript
interface OpportunityScenario {
  type: 'solar' | 'generator' | 'ev-charging' | 'hybrid';
  title: string;
  description: string;
  
  financials: {
    upfrontCost: number;
    monthlySavings: number;
    monthlyRevenue?: number;  // For EV charging
    paybackYears: number;
    totalSavingsOverLifetime: number;
    roi: number;
  };
  
  energyMetrics: {
    energyGeneratedKWh?: number;  // Solar
    energySavedKWh?: number;
    demandChargeReduction?: number;
    carbonOffsetTons?: number;
  };
  
  revenueOpportunities?: {
    evChargingRevenue?: number;  // Per month
    netMeteringCredits?: number;  // Solar
    demandResponse?: number;  // Grid services
  };
  
  additionalBenefits?: string[];  // "Tax credits", "Property value increase", etc.
}
```

**Presentation (Step 4):**
- Show 3-5 scenarios based on user selections
- Compare: "Just Battery" vs "Battery + Solar" vs "Battery + Solar + EV"
- Show revenue opportunities (not just savings)
- Show additional cost savings (tax credits, property value, etc.)

---

## 🔄 **REVISED DATA FLOW**

```
Step 1: Location & Goals
  └─→ wizardState.location (state, zipCode)
  └─→ wizardState.electricityRate (auto-calculated)
  └─→ wizardState.goals

Step 2: Industry Selection
  └─→ wizardState.selectedIndustry
  ↓
POPUP: Opportunity Discovery
  └─→ wizardState.opportunityPreferences = {
        interestedInSolar: boolean,
        interestedInGenerator: boolean,
        interestedInEV: boolean
      }
  └─→ Calculate market conditions (location-based)
  └─→ Determine viability (solar available? generator needed?)

Step 3: Facility Details
  └─→ useCaseData: {
        brand: string,  // "Tommy's Express", "Hilton", etc.
        operatingHours: { daysPerWeek, hoursPerDay },
        // ... other use case-specific questions
      }
  └─→ All questions from database (SSOT-compliant)

Step 4: Magic Fit (System Sizing + Opportunity Presentation)
  ├─→ Calculate battery sizing (existing)
  ├─→ IF interestedInSolar:
  │   └─→ Calculate solar opportunities
  │   └─→ Present scenarios (savings, revenue, benefits)
  ├─→ IF interestedInGenerator:
  │   └─→ Calculate generator options
  │   └─→ Present scenarios (backup power, cost savings)
  └─→ IF interestedInEV:
      └─→ Calculate EV charging opportunities
      └─→ Present scenarios (revenue, customer attraction)

Step 5: Quote Review
  └─→ Full quote with selected scenarios
```

---

## 📊 **MARKET CONDITIONS INTEGRATION**

### **Location-Based Opportunity Assessment:**

```typescript
interface MarketConditionsService {
  // Solar viability
  checkSolarViability(location: Location): {
    available: boolean;
    pricePerWatt: number;
    paybackYears: number;
    viability: 'high' | 'medium' | 'low';
    whyNotAvailable?: string;  // "Insufficient sun hours", "Shading issues", etc.
    alternative?: 'generator';  // If solar not viable, suggest generator
  };
  
  // Generator pricing
  getGeneratorPricing(location: Location, sizeKW: number): {
    pricePerKW: number;
    fuelType: 'diesel' | 'natural-gas';
    installationCost: number;
  };
  
  // EV charging opportunities
  getEVChargingOpportunity(location: Location, useCase: string): {
    available: boolean;
    pricePerPort: number;
    revenuePotential: number;  // Per month per port
    marketDemand: 'high' | 'medium' | 'low';
  };
}
```

**Data Sources:**
- Solar: NREL solar resource maps, local utility rates, incentives
- Generators: Market pricing, fuel availability by region
- EV Charging: Market demand data, charging station density, utility programs

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Phase 1: Opportunity Discovery Popup**
- [ ] Create `OpportunityDiscoveryModal` component
- [ ] Add market conditions service
- [ ] Calculate solar viability from location
- [ ] Calculate generator pricing from location
- [ ] Calculate EV charging opportunities from location
- [ ] Store user preferences in wizard state
- [ ] Trigger popup after Step 2 (industry selection)

### **Phase 2: Database Updates (SSOT)**
- [ ] Add `use_case_brands` table (universal)
- [ ] Seed brand data for all relevant use cases
- [ ] Add operating hours questions to relevant use cases
- [ ] Ensure car wash questions are same across all sites (SSOT)
- [ ] Verify no nested/duplicate questions

### **Phase 3: Step 4 Enhancement (Scenario Presentation)**
- [ ] Calculate solar scenarios (if selected)
- [ ] Calculate generator scenarios (if selected)
- [ ] Calculate EV charging scenarios (if selected)
- [ ] Present multiple scenarios with financials
- [ ] Show revenue opportunities (not just savings)
- [ ] Show additional benefits (tax credits, property value, etc.)

### **Phase 4: Step 3 Questions (Use Case-Specific)**
- [ ] Add brand/chain selection (universal pattern)
- [ ] Add operating hours (relevant use cases)
- [ ] Add other use case-specific questions
- [ ] Ensure all questions come from database (SSOT)

---

## 🎯 **KEY DECISIONS RESOLVED**

1. ✅ **Solar/EV/Generator Discovery:** Early popup after industry selection
2. ✅ **Calculation Timing:** Full financial modeling after Step 3
3. ✅ **Brand Selection:** Universal pattern (database-driven)
4. ✅ **Operating Hours:** Universal for relevant use cases
5. ✅ **SSOT Compliance:** All questions from database, no nested questions
6. ✅ **Scenario Presentation:** Show multiple scenarios with full value proposition

---

**Status:** ✅ **STRATEGIC DIRECTION UNDERSTOOD - READY FOR IMPLEMENTATION PLAN**

