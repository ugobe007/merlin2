# TO REVIEW: Power Gap Analysis Service

**Saved:** December 9, 2025  
**File:** `src/services/powerGapAnalysis.ts`  
**Status:** For discussion

---

## Purpose

This service is "the intelligence behind Merlin" - it calculates the gap between what a customer **NEEDS** versus what they currently have or are considering.

### Core Calculation Flow:
1. **NEEDED Power** - Based on use case + customer answers (critical loads, backup hours, growth)
2. **SELECTED Power** - Current system sizing from baseline calculation
3. **GAP** - The shortfall or surplus
4. **RECOMMENDATION** - What action to take

---

## Key Interface: `PowerGapAnalysis`

```typescript
interface PowerGapAnalysis {
  // Current state
  selectedPowerKW: number;
  selectedEnergyKWh: number;
  selectedDurationHours: number;
  
  // Requirements
  neededPowerKW: number;
  neededEnergyKWh: number;
  neededDurationHours: number;
  
  // Gap analysis
  powerGapKW: number;  // Negative = need more, Positive = surplus
  energyGapKWh: number;
  durationGapHours: number;
  
  // Status
  hasSufficientPower: boolean;
  hasSufficientEnergy: boolean;
  hasSufficientDuration: boolean;
  
  // Recommendations
  recommendation: 'sufficient' | 'add_power' | 'add_energy' | 'add_both';
  recommendationText: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}
```

---

## Use Case-Specific Calculations

| Use Case | Special Logic |
|----------|---------------|
| **Office** | +20% for data_critical loads, min 4 hrs if data center present, solar matching |
| **EV Charging** | User-specified kW respected, standard 5hr peak duration |
| **Hotel** | Min 4 hrs for guest safety, +15% for full/life_safety systems |
| **Data Center** | +20% for N+1 redundancy, min 4 hrs until generators stabilize |
| **Apartment** | +30% if providing tenant backup, min 4 hrs |
| **Retail** | Min 6 hrs if refrigeration present (prevent spoilage) |

---

## Confidence Assessment

Based on how many key questions were answered:
- **≥80%** answered → High confidence
- **≥50%** answered → Medium confidence  
- **<50%** answered → Low confidence

Key fields tracked:
- `peak_demand_kw`
- `monthly_bill`
- `operating_hours`
- `backup_hours`
- `critical_loads`

---

## Discussion Topics

1. **Is this being used anywhere currently?**
2. **Should it integrate with `calculateQuote()`?**
3. **Are the industry-specific multipliers accurate?**
4. **Should confidence affect pricing or recommendations?**
5. **Could this power a "smart recommendation" UI component?**

---

## Full Source Code

Located at: `src/services/powerGapAnalysis.ts` (369 lines)

Key functions:
- `calculatePowerGap()` - Main entry point
- `calculateNeededCapacity()` - Use case router
- `calculateOfficeNeeds()`, `calculateHotelNeeds()`, etc. - Industry-specific
- `generateRecommendation()` - Decision logic
- `assessConfidence()` - Data quality scoring
