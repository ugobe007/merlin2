# Universal Facility Configuration Pattern

**Version:** 1.0  
**Created:** December 15, 2025  
**Status:** PROPOSAL - Pending Vineet Feedback

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

## Questions for Vineet (Before Implementation)

### 1. Quick Estimate vs Magic Fit
> Is the "quick estimate" screen that Vineet wants removed the same as our Magic Fit 3-scenario view? Or is there a separate "quick estimate" that appears before Magic Fit?

**Context:** Magic Fit already shows 3 scenarios with different savings/payback profiles. If this IS the "quick estimate," we're already aligned.

### 2. "200% Power Oversizing"
> Which option is oversized - the base recommendation or the "Maximum Protection" scenario?

**Possible interpretations:**
- **Base recommendation is oversized** → Need to reduce BESS_POWER_RATIOS in scenarioGenerator.ts
- **Maximum Protection is oversized** → The 1.3x multiplier may be too aggressive
- **Solar recommendation is oversized** → Need to apply roof space constraints

### 3. Roof Space Question Placement
> Should we ask about roof space BEFORE showing solar options, or calculate it automatically from building size?

**Option A:** Add explicit "Available roof space" question for all use cases
**Option B:** Auto-calculate from building footprint using industry-specific ratios
**Option C:** Hybrid - auto-calculate but allow override

### 4. Equipment Variants
> For equipment with Standard vs High Performance variants (like car wash blowers), should we:
- Ask about each piece of equipment separately?
- Offer a single "Equipment Grade" toggle (Standard / Premium / Custom)?
- Auto-detect based on facility subtype (Tunnel = High Performance by default)?

---

## Implementation Phases

### Phase 1: Data Model (Week 1)
- [ ] Add `facilitySubtype` to WizardState
- [ ] Add `physicalConstraints` to WizardState
- [ ] Create migration to add these fields to custom_questions for ALL use cases

### Phase 2: Solar Constraints (Week 1)
- [ ] Add roof space calculation to SSOT
- [ ] Cap solar recommendations based on physical constraints
- [ ] Add TrueQuote™ notes when constraints apply

### Phase 3: UI Updates (Week 2)
- [ ] Update FacilityDetailsSection to render subtype as first question
- [ ] Replace range selectors with sliders
- [ ] Show real-time peak demand calculation

### Phase 4: Car Wash Specific (Week 2)
- [ ] Add car wash subtypes to database
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

