# Universal Facility Configuration Pattern

**Version:** 1.1  
**Created:** December 15, 2025  
**Updated:** December 15, 2025  
**Status:** APPROVED - Ready for Implementation

---

## Vineet's Answers (Dec 15, 2025)

| Question | Answer | Implementation |
|----------|--------|----------------|
| **1. Quick Estimate** | The landing page teaser calculator (CarWashEnergy style), NOT Magic Fit | ✅ Keep landing page simple; Magic Fit is optimization engine |
| **2. 200% oversized** | Context-dependent - some use cases need it, others excessive | ✅ Magic Fit scenarios adapt to use case requirements |
| **3. Roof space/Solar** | Auto-estimate first, then popup for specific sizing | ✅ Default based on use case, modal for refinement |
| **4. Equipment variants** | Standard/Premium tiers only; Advanced for granular | ✅ Two-tier system, not per-equipment selection |

---

## Two-Track System (Confirmed)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE TEASER CALCULATOR                        │
│              (CarWashEnergy, HotelEnergy, EVChargingEnergy)              │
│                                                                          │
│  ✓ 2 questions only (Type + Size)                                        │
│  ✓ Instant savings estimate as user interacts                            │
│  ✓ "Get Full Quote" button → StreamlinedWizard                           │
│                                                                          │
│  Example: CarWashEnergy Quick Estimate                                   │
│  • Question 1: Wash Type (Express/Full-Service/Self-Service/In-Bay)     │
│  • Question 2: Number of Bays (slider)                                   │
│  • Result: Annual savings + Payback years (instant)                      │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      STREAMLINED WIZARD + MAGIC FIT                      │
│                     (Full quote with optimization)                       │
│                                                                          │
│  Section 1: Location                                                     │
│  Section 2: Industry Selection (pre-filled from landing page)            │
│  Section 3: Facility Details                                             │
│       • Subtype (Tunnel/In-Bay/Self-Service)                             │
│       • Size (bays, pumps, etc.)                                         │
│       • Equipment Tier: Standard / Premium (TWO TIERS ONLY)              │
│  Section 4: Goals → Magic Fit generates 3 optimized scenarios            │
│  Section 5: Results + "Refine Solar Size" popup (auto-estimate first)    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Purpose

This document defines a **universal data model** for facility configuration that applies to ALL use cases in the Merlin wizard. Instead of making one-off changes for car wash, we define patterns that work across hotel, EV charging, office, hospital, etc.

---

## The Four Pillars of Facility Configuration

Every use case should collect the same FOUR categories of information:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL FACILITY CONFIGURATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. FACILITY SUBTYPE (First Question)                                │   │
│  │    What KIND of [industry] is this?                                 │   │
│  │    - Determines baseline power profile                              │   │
│  │    - Determines equipment options                                   │   │
│  │    - Determines physical constraints                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. SIZE/CAPACITY (Primary Metric)                                   │   │
│  │    How BIG is this facility?                                        │   │
│  │    - PRECISE input (slider or number, not ranges)                   │   │
│  │    - Industry-appropriate unit                                      │   │
│  │    - Direct correlation to peak demand                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. EQUIPMENT PROFILE (Use-Case Specific)                            │   │
│  │    What EQUIPMENT does this facility have?                          │   │
│  │    - Major energy consumers                                         │   │
│  │    - Equipment variants (Standard vs High Performance)              │   │
│  │    - Counts/quantities                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. PHYSICAL CONSTRAINTS (TrueQuote™ Required)                       │   │
│  │    What are the LIMITATIONS of this facility?                       │   │
│  │    - Available roof space (solar constraint)                        │   │
│  │    - Available land (ground-mount, wind)                            │   │
│  │    - Electrical infrastructure (interconnection limits)             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1: Facility Subtype

### Why This Matters
Different subtypes have dramatically different power profiles. A self-service car wash uses 1/10th the energy of an automated tunnel. An economy hotel uses 1/3rd the energy per room of a luxury resort.

### Universal Field Name
```typescript
field_name: 'facilitySubtype'
question_type: 'select'
display_order: 1  // Always first question
```

### By Industry

| Use Case | Subtypes | Power Multiplier |
|----------|----------|------------------|
| **Car Wash** | Automated Tunnel, In Bay Automatic, Self Service | 1.0x, 0.6x, 0.15x |
| **Hotel** | Economy, Midscale, Upscale, Luxury | 0.6x, 0.8x, 1.0x, 1.4x |
| **EV Charging** | Fast Hub (DCFC), Destination (L2), Fleet Depot | 1.5x, 0.5x, 1.0x |
| **Hospital** | Critical Care, General, Outpatient Clinic | 1.5x, 1.0x, 0.5x |
| **Office** | Class A (Premium), Class B (Standard), Class C (Basic) | 1.2x, 1.0x, 0.7x |
| **Data Center** | Tier IV (Critical), Tier III (Concurrent), Tier II (Basic) | 1.5x, 1.0x, 0.6x |
| **Retail** | Big Box, Strip Mall, Standalone | 1.3x, 1.0x, 0.7x |
| **Manufacturing** | Heavy (Foundry), Medium (Assembly), Light (Packaging) | 2.0x, 1.0x, 0.4x |

### Database Implementation
```sql
-- Example: Add facilitySubtype to car-wash custom_questions
INSERT INTO custom_questions (
  use_case_id,
  question_text,
  field_name,
  question_type,
  default_value,
  is_required,
  help_text,
  display_order,
  options
) VALUES (
  (SELECT id FROM use_cases WHERE slug = 'car-wash'),
  'What type of car wash?',
  'facilitySubtype',
  'select',
  '"tunnel"',
  true,
  'Different wash types have very different energy profiles',
  1,  -- FIRST question
  '["tunnel", "in-bay", "self-service"]'
);
```

---

## Pillar 2: Size/Capacity (Precise Input)

### Why This Matters
Vineet correctly noted that **ranges are imprecise**. If sizing differs significantly between 51 cars/hr and 99 cars/hr, we need the exact number.

### Universal Approach
- **Always use slider or number input** (not ranges/buckets)
- **Show calculated peak demand in real-time** as user adjusts
- **Use industry-appropriate units**

### By Industry

| Use Case | Primary Metric | Unit | Range | Default |
|----------|---------------|------|-------|---------|
| **Car Wash** | Throughput | cars/hour | 20-200 | 75 |
| **Hotel** | Room Count | rooms | 20-1000 | 150 |
| **EV Charging** | Total Ports | ports | 2-100 | 12 |
| **Hospital** | Bed Count | beds | 20-1000 | 200 |
| **Office** | Square Footage | sq ft | 5,000-500,000 | 50,000 |
| **Data Center** | IT Load | kW | 50-10,000 | 500 |
| **Retail** | Square Footage | sq ft | 2,000-200,000 | 25,000 |
| **Manufacturing** | Square Footage | sq ft | 10,000-1,000,000 | 100,000 |
| **Warehouse** | Square Footage | sq ft | 20,000-2,000,000 | 200,000 |

### UI Pattern
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  How many cars per hour?                                                    │
│                                                                             │
│  ◄────────────●───────────────────────────────────────►                    │
│  20                     75                           200                    │
│                                                                             │
│  ⚡ Estimated Peak Demand: 125 kW                                          │
│     Based on: Tunnel wash × 75 cars/hr × equipment profile                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 3: Equipment Profile

### Why This Matters
Different equipment variants consume different amounts of energy. A "high performance" blower uses 2-3x the energy of a standard blower.

### Universal Approach
- **Group equipment by category**
- **Offer Standard vs High Performance variants where applicable**
- **Use sliders for quantities**

### Car Wash Equipment Example

| Equipment | Standard Power | High Performance Power | Count Input |
|-----------|---------------|----------------------|-------------|
| High Pressure Pumps | 15 kW each | 25 kW each | Slider: 1-10 |
| Dryers/Blowers | 10 kW each | 22 kW each | Slider: 1-8 |
| Vacuum Stations | 3 kW each | 5 kW each | Slider: 0-20 |
| Conveyor Motor | 5 kW | 10 kW | Fixed by subtype |
| Lighting | 2 kW | 4 kW (LED retrofit) | Fixed |
| HVAC | 5 kW | N/A | Fixed |

### Hotel Equipment Example

| Equipment | Standard Power | High Performance Power | Count Input |
|-----------|---------------|----------------------|-------------|
| HVAC per Room | 2.5 kW | 4 kW (individual PTACs) | Per room |
| Lighting per Room | 0.3 kW | 0.5 kW (all LED) | Per room |
| Pool/Spa | 15 kW | 25 kW (heated year-round) | Boolean |
| Restaurant | 50 kW | 100 kW (full kitchen) | Boolean |
| Laundry | 30 kW | 60 kW (on-site commercial) | Boolean |
| EV Chargers | 7 kW (L2) | 150 kW (DCFC) | Count |

---

## Pillar 4: Physical Constraints (TrueQuote™ Critical)

### Why This Matters
**This is a TrueQuote™ requirement.** We cannot recommend 280kW of solar on a 5,000 sq ft building. The physics don't work.

### Solar Constraint Formula
```
Max Solar kW = (Available Roof Sq Ft × 0.75 usable) / 100 sq ft per kW

Example:
- Building footprint: 5,000 sq ft
- Usable roof space: 5,000 × 0.75 = 3,750 sq ft
- Max solar: 3,750 / 100 = 37.5 kW (NOT 280 kW!)
```

### Industry-Specific Roof Space

| Use Case | Typical Footprint | Usable Roof % | Max Solar kW |
|----------|-------------------|---------------|--------------|
| **Car Wash (Tunnel)** | 5,000-7,000 sq ft | 60% | 30-42 kW |
| **Car Wash (Self Service)** | 1,500 sq ft | 70% | 10 kW |
| **Hotel (per 100 rooms)** | 30,000 sq ft | 50% | 150 kW |
| **Office** | = sq ft input | 70% | Variable |
| **Hospital** | 100,000+ sq ft | 40% (rooftop units) | 400+ kW |
| **Retail** | = sq ft input | 80% | Variable |
| **Warehouse** | = sq ft input | 90% | Variable |

### Universal Physical Constraints Questions

```typescript
// Question 1: Building footprint (infer from size OR ask)
{
  field_name: 'buildingFootprintSqFt',
  question_text: 'Building footprint (sq ft)?',
  question_type: 'number',
  help_text: 'Ground floor area - we use this to calculate max solar capacity',
  default_value: null,  // Auto-calculate from facilitySize if not provided
}

// Question 2: Available roof space (optional override)
{
  field_name: 'availableRoofSqFt',
  question_text: 'Available roof space for solar (sq ft)?',
  question_type: 'number',
  help_text: 'Leave blank to use our estimate',
  default_value: null,  // Auto-calculate: footprint × usable %
}

// Question 3: Ground space available (for ground-mount solar or wind)
{
  field_name: 'availableLandSqFt',
  question_text: 'Available land for ground-mount equipment (sq ft)?',
  question_type: 'number',
  help_text: 'Parking lots, adjacent land, etc.',
  default_value: 0,
}

// Question 4: Electrical service capacity
{
  field_name: 'electricalServiceAmps',
  question_text: 'Electrical service capacity (amps)?',
  question_type: 'select',
  options: ['200A', '400A', '800A', '1000A+', 'Unknown'],
  default_value: 'Unknown',
  help_text: 'Found on your electrical panel or utility bill',
}
```

---

## WizardState Additions

### New Fields Required

```typescript
// Add to WizardState interface in wizardTypes.ts
interface WizardState {
  // ... existing fields ...
  
  // Pillar 1: Facility Subtype
  facilitySubtype: string;  // e.g., 'tunnel', 'in-bay', 'self-service'
  
  // Pillar 4: Physical Constraints
  physicalConstraints: {
    buildingFootprintSqFt: number | null;
    availableRoofSqFt: number | null;
    availableLandSqFt: number;
    electricalServiceAmps: string;
    maxSolarKW: number;  // Calculated from roof space
    maxGroundMountKW: number;  // Calculated from land
  };
}
```

### Calculation Service Integration

```typescript
// Add to unifiedQuoteCalculator.ts

interface QuoteInput {
  // ... existing fields ...
  
  // Physical constraints
  maxSolarKW?: number;  // Cap solar recommendation to this
  maxGroundMountKW?: number;  // Additional ground-mount capacity
}

// In calculateQuote():
function calculateQuote(input: QuoteInput): QuoteResult {
  // Calculate raw solar recommendation
  let recommendedSolarKW = calculateOptimalSolar(input);
  
  // Apply physical constraints (TrueQuote™)
  if (input.maxSolarKW && recommendedSolarKW > input.maxSolarKW) {
    recommendedSolarKW = input.maxSolarKW;
    // Add note to quote about constraint
    quote.notes.push({
      type: 'constraint',
      message: `Solar limited to ${input.maxSolarKW} kW based on available roof space`,
      source: 'TrueQuote™ Physical Constraints'
    });
  }
  
  // ...
}
```

---

## ✅ CONFIRMED: Vineet's Answers (Dec 15, 2025)

### 1. Quick Estimate vs Magic Fit
> **ANSWER:** Quick Estimate = The landing page teaser calculator (CarWashEnergy style). Magic Fit = The optimization engine in StreamlinedWizard.

**Implementation:** Keep landing page calculators simple (2 questions, instant results). Magic Fit remains as the 3-scenario optimization engine in the full wizard.

### 2. "200% Power Oversizing"
> **ANSWER:** Context-dependent. Some use cases need it, others it's excessive.

**Implementation:** Magic Fit scenarios should adapt to use case requirements. Don't apply blanket 200% oversizing.

### 3. Roof Space Question Placement
> **ANSWER:** Provide estimates based on use case, then popup window for specific sizing.

**Implementation:** Auto-estimate solar first, offer "Refine Solar Size" modal for users who want specific square footage sizing.

### 4. Equipment Variants
> **ANSWER:** Standard/Premium tiers only. If users want granular equipment selection, use Advanced Quote Builder.

**Implementation:** Two-tier system (Standard / Premium), not per-equipment selection.

---

## Implementation Plan (Ready to Execute)

### Phase 1: Equipment Tier System (Immediate)
- [ ] Add `equipmentTier` field to WizardState: `'standard' | 'premium'`
- [ ] Add Standard/Premium selector to FacilityDetailsSection
- [ ] Update equipment calculations to use tier multiplier
- [ ] Remove per-equipment questions (blowers, pumps, etc.) from wizard

### Phase 2: Facility Subtype (Immediate)
- [ ] Add `facilitySubtype` to WizardState
- [ ] Make subtype the FIRST question in FacilityDetailsSection
- [ ] Create database migration for car wash subtypes
- [ ] Apply subtype power multipliers in SSOT calculations

### Phase 3: Solar Refinement Modal (Week 1)
- [ ] Create `SolarSizingModal.tsx` component
- [ ] Auto-estimate solar based on use case defaults
- [ ] Add "Refine Solar Size" button to Results section
- [ ] Apply roof space constraints to cap recommendations

### Phase 4: Physical Constraints (Week 1)
- [ ] Add `physicalConstraints` to WizardState
- [ ] Calculate max solar based on roof formula: `Max kW = (Roof SqFt × Usable%) / 100`
- [ ] Add TrueQuote™ notes when constraints apply

---

## Car Wash Specific Implementation

Based on Vineet's feedback document, here's the car wash implementation:

### Facility Subtypes
```typescript
const CAR_WASH_SUBTYPES = [
  { id: 'tunnel', label: 'Express Tunnel', powerMultiplier: 1.0, description: '30-60 cars/hr' },
  { id: 'fullservice', label: 'Full-Service', powerMultiplier: 1.2, description: '50-100 cars/hr' },
  { id: 'inbay', label: 'In-Bay Automatic', powerMultiplier: 0.6, description: '6-10 cars/hr' },
  { id: 'selfservice', label: 'Self-Service', powerMultiplier: 0.15, description: '2-4 per bay/hr' },
];
```

### Equipment Tiers
```typescript
const CAR_WASH_EQUIPMENT_TIERS = {
  standard: {
    label: 'Standard Equipment',
    description: 'Industry-standard pumps, blowers, and dryers',
    powerMultiplier: 1.0,
  },
  premium: {
    label: 'Premium Equipment',
    description: 'High-performance pumps, blowers, and dryers',
    powerMultiplier: 1.3,
  },
};
```

### Solar Defaults (Auto-Estimate)
- **Typical car wash roof:** 5,000 - 8,000 sq ft
- **Usable roof %:** 60% (equipment, HVAC on roof)
- **Default max solar:** ~30-50 kW
- **Popup allows:** Exact roof sq ft input

---

## Implementation Phases (UPDATED)

### Phase 1: Data Model (Immediate)
- [ ] Add `facilitySubtype` to WizardState
- [ ] Add `equipmentTier` to WizardState (`'standard' | 'premium'`)
- [ ] Add `physicalConstraints` to WizardState

### Phase 2: UI Updates (Immediate)
- [ ] Add subtype selector to FacilityDetailsSection (FIRST question)
- [ ] Add Standard/Premium tier selector
- [ ] Remove granular equipment questions

### Phase 3: Solar Modal (Week 1)
- [ ] Create SolarSizingModal.tsx
- [ ] Auto-estimate based on facility type
- [ ] "Refine" button for specific sizing

### Phase 4: Database (Week 1)
- [ ] Migration for car wash subtypes
- [ ] Migration for equipment tiers
- [ ] Apply to all use cases
- [ ] Add equipment profile questions (pumps, blowers, vacuums)
- [ ] Add EV charger question after vacuums

### Phase 5: Roll Out to Other Industries (Week 3+)
- [ ] Hotel subtypes
- [ ] EV Charging subtypes
- [ ] Office subtypes
- [ ] Hospital subtypes

---

## Appendix: Industry-Specific Subtype Details

### Car Wash Subtypes

| Subtype | Description | Typical Power | Roof Space | Equipment |
|---------|-------------|--------------|------------|-----------|
| **Automated Tunnel** | Conveyor-driven express wash | 100-250 kW | 4,000-6,000 sq ft | High pressure pumps, tunnel blowers, conveyor |
| **In Bay Automatic** | Touchless or friction in bay | 50-80 kW | 1,000-1,500 sq ft | Gantry system, medium pumps |
| **Self Service** | Manual spray bays | 10-30 kW | 800-1,500 sq ft | Coin-op pumps, vacuums |

### Hotel Subtypes

| Subtype | Description | kW per Room | Amenities |
|---------|-------------|-------------|-----------|
| **Economy** | Budget lodging, minimal amenities | 1.5 kW | Vending only |
| **Midscale** | Standard amenities, free breakfast | 2.5 kW | Breakfast, pool |
| **Upscale** | Full service, restaurant | 4.0 kW | Restaurant, fitness, pool |
| **Luxury** | Premium, multiple F&B outlets | 6.0 kW | Spa, multiple restaurants, full service |

### EV Charging Subtypes

| Subtype | Description | Power Profile | Use Case |
|---------|-------------|---------------|----------|
| **Fast Hub** | Highway corridor, DCFC dominant | 500-2000 kW | Road trips, 15-30 min charges |
| **Destination** | Retail/hospitality, L2 dominant | 50-150 kW | Shopping, dining, 1-4 hr stays |
| **Fleet Depot** | Overnight charging, scheduled | 200-500 kW | Delivery vans, buses, scheduled routes |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 15, 2025 | AI Assistant | Initial proposal based on Vineet feedback |

