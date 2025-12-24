# Wizard Architecture Documentation

**Last Updated**: December 12, 2025 (v2 - with guided-flow and indicators)

## Overview

The Merlin Energy Wizard guides users through configuring a Battery Energy Storage System (BESS) quote. This document maps all components, their dependencies, and data flow.

---

## Folder Structure

```
src/components/wizard/
├── ARCHITECTURE.md           # This file - system documentation
│
├── StreamlinedWizard.tsx     # Main orchestrator component (~280 lines)
│
├── constants/                # Static configuration values
│   ├── index.ts              # Re-exports
│   └── wizardConstants.ts    # BESS ratios, presets, industry defaults
│
├── types/                    # TypeScript interfaces
│   ├── index.ts              # Re-exports
│   └── wizardTypes.ts        # WizardState, section props, etc.
│
├── hooks/                    # State management
│   ├── index.ts              # Re-exports
│   └── useStreamlinedWizard.ts  # Central state hook (633 lines)
│
├── sections/                 # Major wizard pages (Steps 0-5)
│   ├── index.ts
│   ├── WelcomeLocationSection.tsx   # Step 0: Location input
│   ├── IndustrySection.tsx          # Step 1: Industry selection
│   ├── FacilityDetailsSection.tsx   # Step 2: Custom questions
│   ├── GoalsSection.tsx             # Step 3: Goals & add-ons
│   ├── ConfigurationSection.tsx     # Step 4: System configuration + MerlinWizard
│   └── QuoteResultsSection.tsx      # Step 5: Final quote
│
├── navigation/               # Navigation components ✅ IMPLEMENTED
│   ├── index.ts
│   ├── WizardProgress.tsx           # Step indicator with circles/progress bar
│   ├── WizardNavButtons.tsx         # Standardized Back/Continue/Skip buttons
│   └── WizardTabs.tsx               # Header tab navigation (horizontal)
│
├── indicators/               # Status indicators ✅ IMPLEMENTED
│   ├── index.ts
│   ├── PowerGapIndicator.tsx        # Power coverage % display (compact + full)
│   ├── SolarOpportunityIndicator.tsx # Solar potential based on state irradiance
│   ├── EnergyOpportunityBadge.tsx   # Badges: peak-shaving, demand-response, etc.
│   └── PowerStatusCard.tsx          # Combined power status with source breakdown
│
├── guided-flow/              # Step-by-step configuration ✅ IMPLEMENTED
│   ├── index.ts
│   └── MerlinWizardModal.tsx        # 5-step "Merlin Energy Wizard" modal
│       ├── Step 1: Review Merlin's Recommendation
│       ├── Step 2: Solar & Wind Configuration
│       ├── Step 3: EV Chargers (L2/DCFC/HPC)
│       ├── Step 4: BESS-to-Power Ratio
│       └── Step 5: Confirm & Generate
│
├── widgets/                  # Visual display components
│   ├── index.ts
│   ├── PowerMeterWidget.tsx         # Animated power meter
│   ├── PowerGaugeWidget.tsx         # Gauge-style display
│   ├── PowerStatusWidget.tsx        # Status with icons
│   └── PowerDashboardWidget.tsx     # Combined dashboard
│
├── shared/                   # Reusable UI components
│   └── (various shared components)
│
└── _deprecated/              # Old components (do not use)
    └── StreamlinedWizard.legacy.tsx
```

---

## New Components (December 2025)

### 1. Merlin Energy Wizard Modal (`guided-flow/MerlinWizardModal.tsx`)

A step-by-step guided modal that walks users through configuration:

**Features:**
- Accept Merlin's recommendation OR customize
- Real-time power coverage display
- BESS-to-power ratio explanation
- EV charger configuration
- Solar/wind sizing

**Usage in ConfigurationSection:**
```tsx
<MerlinWizardModal
  isOpen={showMerlinWizard}
  onClose={() => setShowMerlinWizard(false)}
  onComplete={handleMerlinConfig}
  recommendation={merlinRecommendation}
  industryName="Hotel"
  location="CA"
  powerCoverage={85}
/>
```

### 2. Power Gap Indicator (`indicators/PowerGapIndicator.tsx`)

Shows the gap between peak demand and configured power sources:

**Features:**
- Compact mode for header display
- Full mode with progress bar and breakdown
- Grid connection awareness
- Click to configure

**Props:**
```tsx
interface PowerGapIndicatorProps {
  peakDemandKW: number;
  batteryKW: number;
  solarKW: number;
  generatorKW: number;
  gridConnection?: 'on-grid' | 'unreliable' | 'expensive' | 'limited' | 'off-grid';
  showDetails?: boolean;
  compact?: boolean;
  onConfigureClick?: () => void;
}
```

### 3. Solar Opportunity Indicator (`indicators/SolarOpportunityIndicator.tsx`)

Shows solar potential based on state irradiance:

**Features:**
- State-specific solar irradiance data
- Estimated savings and CO2 offset
- "Add Solar" call-to-action

### 4. Energy Opportunity Badge (`indicators/EnergyOpportunityBadge.tsx`)

Small badges for various opportunities:

**Types:**
- `peak-shaving`, `solar-potential`, `demand-response`
- `backup-power`, `cost-savings`, `green-energy`
- `grid-services`, `ev-ready`, `configured`, `warning`, `info`

### 5. Navigation Components (`navigation/`)

Standardized navigation for wizard consistency:

- **WizardProgress**: Visual step indicator
- **WizardNavButtons**: Back/Continue/Skip with loading states
- **WizardTabs**: Tab-style section navigation

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                          │
│   Location → Industry → Facility Details → Goals → Configuration            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   useStreamlinedWizard.ts                                   │
│                     (Central State Hook)                                    │
│                                                                             │
│   Local State (wizardState):                                                │
│   ├── state, zipCode, county         # Location                             │
│   ├── selectedIndustry, industryName # Industry                             │
│   ├── facilitySize, useCaseData      # Facility details                     │
│   ├── goals, wantsSolar, wantsWind   # Goals & preferences                  │
│   ├── batteryKW, batteryKWh          # System configuration                 │
│   └── gridConnection                  # Grid status                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ SYNC EFFECTS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   useWizardState.ts                                         │
│                   (Centralized Calculation State)                           │
│                                                                             │
│   centralizedState:                                                         │
│   ├── facility: { squareFeet, bedCount, surgicalSuites... }                │
│   ├── industry: { type }                                                    │
│   ├── useCaseData: { ...all custom question answers }                       │
│   ├── existingInfrastructure: { gridConnection, evChargers... }            │
│   └── calculated: { <== AUTO-RECALCULATED                                   │
│       ├── totalPeakDemandKW    # Building + EV load                         │
│       ├── recommendedBatteryKW # BESS power (peak × ratio)                  │
│       ├── recommendedBatteryKWh # BESS energy (power × hours)               │
│       ├── recommendedSolarKW   # Solar (battery × 1.4 ILR)                  │
│       └── recommendedBackupHours # Based on grid reliability                │
│   }                                                                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  │ DELEGATE TO SSOT
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   useCasePowerCalculations.ts                               │
│                        (SSOT - Single Source of Truth)                      │
│                                                                             │
│   calculateUseCasePower(industryType, useCaseData)                          │
│   ├── 'hospital' → bedCount × 5kW + surgicalSuites × 40kW + MRI × 100kW    │
│   ├── 'hotel' → roomCount × hotelClass multiplier                           │
│   ├── 'data-center' → rackCount × density × PUE                             │
│   └── etc.                                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components Reference

### Header Indicators (in StreamlinedWizard.tsx header)

| Indicator | Location | Data Source | Updates When |
|-----------|----------|-------------|--------------|
| **Storage Summary** | Header left | `centralizedState.calculated` | Industry/facility changes |
| **Power Gap** | Header center | `centralizedState.calculated.totalPeakDemandKW` vs configured | Any power config change |
| **Solar Opportunity** | Header right | `wizardState.geoRecommendations.avgSolarHoursPerDay` | Location changes |

### Sync Effects (in useStreamlinedWizard.ts)

| Effect | Triggers On | Updates | Purpose |
|--------|-------------|---------|---------|
| `useCaseData sync` | `wizardState.useCaseData` changes | `centralizedState.useCaseData`, `facility` | Pass custom questions to calc |
| `industry sync` | `wizardState.selectedIndustry` changes | `centralizedState.industry.type` | Set industry for power calc |
| `grid connection sync` | `wizardState.gridConnection` changes | `centralizedState.existingInfrastructure.gridConnection` | Adjust backup hours |
| `EV chargers sync` | EV charger counts change | `centralizedState.existingInfrastructure.evChargers` | Add EV load to peak |
| `solar sync` | `wizardState.solarKW` changes | `centralizedState.goals.solarKW` | Include solar in battery sizing |

### BESS Sizing Ratios (in wizardConstants.ts)

| Use Case | Ratio | Source |
|----------|-------|--------|
| Peak Shaving | 0.40 | IEEE 4538388, MDPI Energies |
| Arbitrage | 0.50 | Industry practice |
| Resilience | 0.70 | IEEE 446-1995 |
| Microgrid | 1.00 | NREL standards |

---

## Debugging Guide

### Power Gap Not Updating?

1. Check browser console for: `📊 [SYNC] useCaseData → centralizedState:`
2. Check for: `⚡ [useWizardState] RECALCULATE TRIGGERED:`
3. Check for: `🔧 [calculateBuildingLoad] useCaseData being sent to SSOT:`
4. Check for: `🔌 [PowerGap Header]:` with new values

### Expected Log Chain When User Changes Equipment:

```
1. 📊 [SYNC] useCaseData → centralizedState: { surgicalSuites: 2 }
2. ⚡ [useWizardState] RECALCULATE TRIGGERED: { facilitySurgicalSuites: 2 }
3. 🔧 [calculateBuildingLoad] useCaseData: { surgicalSuites: 2 }
4. 🏥 [Hospital Power] Calculation: { equipmentLoadKW: 80 }
5. 🔌 [PowerGap Header]: { peakDemandKW: 1330 }
```

---

## Adding New Features

### To Add a New Industry:

1. Add slug to `use_cases` table in Supabase
2. Add calculation case in `useCasePowerCalculations.ts` → `calculateUseCasePower()`
3. Add custom questions to `custom_questions` table
4. Test with StreamlinedWizard

### To Add a New Indicator:

1. Create component in `/indicators/`
2. Import in StreamlinedWizard.tsx header section
3. Connect to `wizard.centralizedState.calculated` or `wizard.wizardState`
4. Add to this documentation

---

## Files Quick Reference

| Need to... | Edit this file |
|------------|----------------|
| Change BESS ratios | `constants/wizardConstants.ts` |
| Change power calculations | `services/useCasePowerCalculations.ts` |
| Change state sync logic | `hooks/useStreamlinedWizard.ts` |
| Change UI layout | `StreamlinedWizard.tsx` |
| Change section content | `sections/*.tsx` |
| Change quote generation | `hooks/useStreamlinedWizard.ts` → `generateQuote()` |
