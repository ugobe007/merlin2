# TRUEQUOTE™ PROGRESSIVE MODELING IMPLEMENTATION

**Date:** January 21, 2026  
**Status:** ✅ PHASE 1-3 COMPLETE | Phase 4-5 Pending  
**Philosophy:** "Don't audit. Model progressively."

---

## ✅ IMPLEMENTATION STATUS (Jan 21, 2026)

| Phase   | Description                                             | Status     |
| ------- | ------------------------------------------------------- | ---------- |
| Phase 1 | Add progressive model types to WizardState              | ✅ DONE    |
| Phase 2 | Create micro-prompt components                          | ✅ DONE    |
| Phase 3 | Integrate into Step 3 + estimatedPowerMetrics           | ✅ DONE    |
| Phase 4 | Update telemetry (FloatingBatteryProgress, AdvisorRail) | ⏳ Pending |
| Phase 5 | Testing & refinement                                    | ⏳ Pending |

### Files Created/Modified:

**New Files:**

- `src/components/wizard/v6/micro-prompts/ServiceSizePrompt.tsx` (~160 lines)
- `src/components/wizard/v6/micro-prompts/DemandChargePrompt.tsx` (~170 lines)
- `src/components/wizard/v6/micro-prompts/HVACTypePrompt.tsx` (~140 lines)
- `src/components/wizard/v6/micro-prompts/BackupGeneratorPrompt.tsx` (~175 lines)
- `src/components/wizard/v6/micro-prompts/ProgressiveModelPanel.tsx` (~290 lines)
- `src/components/wizard/v6/micro-prompts/index.ts` (~30 lines)

**Modified Files:**

- `src/components/wizard/v6/types.ts` - Added progressive model types + INITIAL_WIZARD_STATE
- `src/components/wizard/v6/steps/Step3Details.tsx` - Integrated ProgressiveModelPanel
- `src/components/wizard/v6/WizardV6.tsx` - Updated estimatedPowerMetrics useMemo

---

## 🎯 STRATEGIC PRINCIPLE

> Without these fields, TrueQuote is a smart estimator.  
> With these fields, TrueQuote becomes a real financial model.

**Collection Strategy:**

- ❌ NOT via raw form fields
- ✅ Progressive modeling through micro-interactions
- ✅ Derived inference from high-level questions
- ✅ Silent defaults with "Refine this" option
- ✅ Industry-contextual prompts (1-2 per industry max)

---

## 📊 FIELD CATEGORIES & COLLECTION STRATEGY

### 1️⃣ PEAK & GRID ENVELOPE (Global Core)

**Fields needed for ALL industries:**
| Field | Purpose | Current Status |
|-------|---------|----------------|
| `peakDemandKW` | Core for all sizing | ✅ Exists but rarely populated |
| `gridCapacityKW` | Ceiling constraint | ✅ Exists but rarely populated |
| `demandChargeImpact` | ROI accuracy | ❌ Not in state |
| `monthlyDemandCharges` | Economic modeling | ❌ Not in state |
| `demandChargePercent` | Bill analysis | ❌ Not in state |

**Collection Strategy (Steps 2-3):**

Instead of asking "What is your peak demand in kW?" ask:

```
┌─────────────────────────────────────────────────────────────┐
│  💡 "What is your main electrical service size?"           │
│                                                             │
│  ○ 200A Single Phase (~48 kW)                              │
│  ○ 400A Three Phase (~275 kW)                              │
│  ○ 800A Three Phase (~550 kW)                              │
│  ○ 1000A+ / Dedicated Feeder (750+ kW)                     │
│  ○ Unsure — Merlin will estimate                           │
└─────────────────────────────────────────────────────────────┘
```

**Inference Logic:**

```typescript
const SERVICE_TO_GRID_CAPACITY = {
  "200A-single": { gridCapacityKW: 48, peakDemandBand: [30, 45] },
  "400A-three": { gridCapacityKW: 275, peakDemandBand: [150, 250] },
  "800A-three": { gridCapacityKW: 550, peakDemandBand: [300, 500] },
  "1000A-plus": { gridCapacityKW: 750, peakDemandBand: [500, 1500] },
  unsure: null, // Use industry heuristics
};
```

Then show:

```
Peak Load (estimated): 92–118 kW
Grid Headroom: ████████░░ Limited
              └── "Refine this for higher accuracy"
```

---

### 2️⃣ DEMAND CHARGE MECHANICS (ROI Critical)

**Fields needed:**
| Field | Purpose | Current Status |
|-------|---------|----------------|
| `hasDemandCharge` | Gate question | ❌ Not in state |
| `demandChargeRate` | $/kW | ❌ Not in state |
| `demandChargeBand` | Approximation | ❌ Not in state |

**Collection Strategy (Step 2 or 3):**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ "Do you pay a demand charge on your utility bill?"     │
│                                                             │
│  ○ Yes                                                      │
│  ○ No                                                       │
│  ○ Not sure                                                 │
└─────────────────────────────────────────────────────────────┘

[If Yes]:
┌─────────────────────────────────────────────────────────────┐
│  📊 "Approximate demand charge per kW?"                    │
│                                                             │
│  ○ Under $10/kW                                             │
│  ○ $10–$20/kW                                               │
│  ○ $20+/kW                                                  │
│  ○ Not sure — use regional average                         │
└─────────────────────────────────────────────────────────────┘
```

**Inference Logic:**

```typescript
const DEMAND_CHARGE_BANDS = {
  "under-10": { rate: 8, impact: "low" },
  "10-20": { rate: 15, impact: "medium" },
  "20-plus": { rate: 25, impact: "high" },
  "not-sure": null, // Use EIA state average
};
```

**Unlocks:**

- Peak shaving ROI (accurate)
- Battery payback modeling
- TOU arbitrage value

---

### 3️⃣ BACKUP / RESILIENCE LAYER (Industry-Specific)

**Fields needed (only for relevant industries):**
| Field | Industries | Current Status |
|-------|-----------|----------------|
| `hasBackupGenerator` | hospital, data-center, casino, airport | ❌ Not in state |
| `generatorCapacityKW` | same | ❌ Not in state |
| `hasEVCharging` | hotel, retail, office, warehouse | Partial |
| `evChargerCount` | same | Partial |
| `hvacType` | all | ❌ Not in state |

**Collection Strategy (Step 3, industry-contextual):**

For **Hospital/Data Center/Casino**:

```
┌─────────────────────────────────────────────────────────────┐
│  🔌 "Do you have backup generators?"                       │
│                                                             │
│  ○ Yes                                                      │
│  ○ No                                                       │
│  ○ Planned                                                  │
│                                                             │
│  [If Yes]: "Approximate capacity (kW)?"                    │
│  ○ Under 100 kW                                             │
│  ○ 100–500 kW                                               │
│  ○ 500+ kW                                                  │
│  ○ Not sure                                                 │
└─────────────────────────────────────────────────────────────┘
```

For **All Industries** (subtle):

```
┌─────────────────────────────────────────────────────────────┐
│  🌡️ "Primary HVAC type?"                                   │
│                                                             │
│  ○ Packaged rooftop (RTU)                                   │
│  ○ Central chiller system                                   │
│  ○ Heat pumps (VRF/Mini-split)                             │
│  ○ Not sure                                                 │
└─────────────────────────────────────────────────────────────┘
```

**HVAC Impact on Load:**

```typescript
const HVAC_MULTIPLIERS = {
  rtu: 1.0, // Baseline
  chiller: 1.15, // Higher electrical load
  "heat-pump": 0.9, // More efficient
  "not-sure": 1.0, // Default
};
```

---

### 4️⃣ INDUSTRY-SPECIFIC LOAD SHAPE DRIVERS

**Rule: Max 1-2 additional questions per industry**

| Industry            | Key Question                       | Field           |
| ------------------- | ---------------------------------- | --------------- |
| **Shopping Center** | "Approximate number of tenants?"   | `tenantCount`   |
| **Car Wash**        | "What lighting type?"              | `lightingType`  |
| **EV Charging**     | "Charger types?" (already asked)   | `chargerMix`    |
| **Hotel**           | "Number of rooms?" (already asked) | `numRooms`      |
| **Data Center**     | "IT load MW?" (already asked)      | `capacity`      |
| **Cold Storage**    | "Temperature zones?"               | `tempZones`     |
| **Manufacturing**   | "Compressed air?"                  | `compressedAir` |

---

## 🏗️ IMPLEMENTATION PHASES

### PHASE 1: Extend State Types (1 hour)

**File: `src/components/wizard/v6/types.ts`**

Add to `WizardState`:

```typescript
// ============================================================================
// PROGRESSIVE MODEL FIELDS (Jan 2026)
// ============================================================================

// Peak & Grid Envelope
serviceSize?: ServiceSizeOption;
gridCapacityInferred?: number;      // Derived from serviceSize
peakDemandInferred?: [number, number]; // Range [low, high]

// Demand Charge Mechanics
hasDemandCharge?: 'yes' | 'no' | 'not-sure';
demandChargeBand?: 'under-10' | '10-20' | '20-plus' | 'not-sure';
demandChargeRateInferred?: number;  // Derived

// Resilience Layer (industry-contextual)
hasBackupGenerator?: 'yes' | 'no' | 'planned';
generatorCapacityBand?: 'under-100' | '100-500' | '500-plus' | 'not-sure';
hvacType?: 'rtu' | 'chiller' | 'heat-pump' | 'not-sure';

// Inference Confidence
modelConfidence?: 'low' | 'medium' | 'high';
fieldsCollected?: string[];  // Track what user provided
```

Add new type:

```typescript
export type ServiceSizeOption =
  | "200A-single"
  | "400A-three"
  | "800A-three"
  | "1000A-plus"
  | "unsure";
```

---

### PHASE 2: Create Micro-Prompt Components (2-3 hours)

**New File: `src/components/wizard/v6/micro-prompts/`**

```
micro-prompts/
├── ServiceSizePrompt.tsx      # Electrical service size
├── DemandChargePrompt.tsx     # Demand charge Y/N + band
├── HVACTypePrompt.tsx         # HVAC type (all industries)
├── BackupGeneratorPrompt.tsx  # Generator (high-criticality only)
└── index.ts
```

**Design Principle:**

- Single question per prompt
- Takes < 3 seconds to answer
- Shows inferred result immediately
- "Refine" link for power users

**Example Component:**

```tsx
// ServiceSizePrompt.tsx
export function ServiceSizePrompt({ value, onChange, inferred }: ServiceSizePromptProps) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-slate-800/50 p-4">
      <div className="text-sm font-semibold text-white mb-3">
        💡 What is your main electrical service size?
      </div>
      <div className="space-y-2">
        {SERVICE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "w-full text-left px-4 py-2 rounded-lg transition-all",
              value === opt.value
                ? "bg-violet-500/20 border-violet-400"
                : "bg-slate-700/50 hover:bg-slate-700"
            )}
          >
            <div className="text-sm text-white">{opt.label}</div>
            <div className="text-xs text-slate-400">{opt.hint}</div>
          </button>
        ))}
      </div>

      {/* Show inferred values */}
      {inferred && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-xs text-emerald-300">
            Peak Load (estimated): {inferred.peakRange[0]}–{inferred.peakRange[1]} kW
          </div>
          <div className="text-xs text-emerald-300/70">
            Grid Capacity: {inferred.gridCapacity} kW
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### PHASE 3: Integrate into Step 2-3 Flow (2-3 hours)

**Location:** After industry selection, before facility details

**Step 2.5 (New Sub-Step):** "Help Merlin Size Your System"

```
┌─────────────────────────────────────────────────────────────┐
│  🧙 Help Merlin Size Your System                            │
│                                                             │
│  These quick questions help us calculate accurate savings.  │
│                                                             │
│  [ServiceSizePrompt]                                        │
│                                                             │
│  [DemandChargePrompt]                                       │
│                                                             │
│  [HVACTypePrompt] — only if industry requires               │
│                                                             │
│  ┌─ Inferred Power Profile ─────────────────────────────┐   │
│  │  Peak: 85–115 kW        Storage: 200–400 kWh        │   │
│  │  Grid: Moderate         Demand Impact: $1,200/mo    │   │
│  │                         └── "Refine this"           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  [Continue →]                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 4: Update estimatedPowerMetrics (1-2 hours)

**File:** `WizardV6.tsx` - `estimatedPowerMetrics` useMemo

Add at TOP of useMemo:

```typescript
// PHASE 1: Check progressive model fields FIRST
const serviceSize = state.serviceSize;
const hasDemandCharge = state.hasDemandCharge;
const demandChargeBand = state.demandChargeBand;
const hvacType = state.hvacType;

// If service size provided, use it as ceiling
if (serviceSize && serviceSize !== "unsure") {
  const gridCap = SERVICE_TO_GRID_CAPACITY[serviceSize];
  if (gridCap) {
    // This becomes hard ceiling for all calculations
    maxGridCapacityKW = gridCap.gridCapacityKW;
    peakDemandRange = gridCap.peakDemandBand;
  }
}

// Apply HVAC multiplier to all calculations
const hvacMultiplier = HVAC_MULTIPLIERS[hvacType || "not-sure"] || 1.0;
```

Add at BOTTOM of useMemo (before return):

```typescript
// Apply progressive model constraints
if (maxGridCapacityKW && estimatedPeakKW > maxGridCapacityKW) {
  estimatedPeakKW = maxGridCapacityKW;
  source = "grid-constrained";
}

// Calculate demand charge impact
let demandChargeMonthly = 0;
if (hasDemandCharge === "yes" && demandChargeBand) {
  const rate = DEMAND_CHARGE_BANDS[demandChargeBand]?.rate || 15;
  demandChargeMonthly = estimatedPeakKW * rate;
}
```

---

### PHASE 5: Live Telemetry Updates (1 hour)

**File:** `FloatingBatteryProgress.tsx` / `AdvisorRail.tsx`

Update telemetry to show:

```
Peak: 92–118 kW        [████████░░]
Storage: 200–400 kWh   [██████████]
Grid: Limited          [████░░░░░░]
Demand Impact: $1,200/mo
```

With real-time updates as user answers questions.

---

## 📅 IMPLEMENTATION TIMELINE

| Phase | Task                           | Time    | Priority    |
| ----- | ------------------------------ | ------- | ----------- |
| **1** | Extend WizardState types       | 1 hr    | 🔴 Critical |
| **2** | Create micro-prompt components | 2-3 hrs | 🔴 Critical |
| **3** | Integrate into Step 2-3 flow   | 2-3 hrs | 🔴 Critical |
| **4** | Update estimatedPowerMetrics   | 1-2 hrs | 🔴 Critical |
| **5** | Live telemetry updates         | 1 hr    | 🟡 High     |
| **6** | Testing & refinement           | 2 hrs   | 🟡 High     |

**Total: ~10-12 hours of focused work**

---

## ✅ SUCCESS CRITERIA

After implementation:

1. ✅ `peakDemandKW` populated for 80%+ of quotes
2. ✅ `gridCapacityKW` populated for 80%+ of quotes
3. ✅ `demandChargeImpact` calculated for 70%+ of quotes
4. ✅ Model confidence displayed in UI
5. ✅ TrueQuote can be promoted to "Verified" when fields present
6. ✅ ROI calculations within ±10% of actual (up from ±30%)

---

## 🚀 NEXT ACTION

**Start with Phase 1:** Add the new fields to `types.ts`

Then create a single micro-prompt for service size to prove the pattern.

Want me to start implementing?
