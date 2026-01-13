# MagicFit vs TrueQuote: Proposal vs Authenticated Quote

## Architecture Model: "Estimate → Choose → Authenticate → Commit"

### Stage 1: MagicFit Proposal (Temporary, Non-SSOT)

**Purpose:** Fast UX for scenario exploration and user choice

**MagicFit can:**
- ✅ Estimate sizing
- ✅ Estimate capex
- ✅ Estimate savings/payback
- ✅ Show 3 scenarios quickly
- ✅ Help users choose a direction

**MagicFit must be stored separately:**
```typescript
state.magicFit = {
  fingerprint: string;
  scenarios: ScenarioConfig[];
  selectedType?: "essentials" | "balanced" | "max-savings";
  isEstimate: true; // Always true
  generatedAt: number;
}
```

**MagicFit must NOT be stored in:**
- ❌ `state.calculations.base`
- ❌ `state.calculations.selected`
- ❌ Anything called "TrueQuote"

### Stage 2: TrueQuote Authentication (SSOT)

**Purpose:** Authoritative quote with verified pricing and traceability

**When user selects a scenario/tier:**
1. Translate MagicFit selection into TrueQuote request
2. Call TrueQuote with user inputs + preferences
3. TrueQuote returns authenticated results

**TrueQuote provides:**
- ✅ Authenticated equipment sizing
- ✅ Authenticated pricing inputs/sources
- ✅ Authenticated financials
- ✅ Real quote ID
- ✅ Traceability

**Commit only TrueQuote results:**
```typescript
state.calculations = { base, selected }  // SSOT only
state.quoteCache = { fingerprint, result }
```

## Concrete Rules

### Rule 1: MagicFit outputs are never "calculations"
Call them:
- `proposal`
- `estimate`
- `preview`
- `scenarioDraft`

**Not "calculations."**

### Rule 2: Only TrueQuote can populate `calculations.base/selected`
This is the hard SSOT boundary.

### Rule 3: Branding Clarity

**If MagicFit values are shown:**
- Label them "Estimate"
- Remove TrueQuote badge
- Use different color or icon
- Show "Final numbers confirmed in Step 5"

**Once TrueQuote returns:**
- Swap UI to "TrueQuote Verified"
- Hide or freeze MagicFit display
- Show comparison if desired

### Rule 4: Export is SSOT-only
PDF/email/export must use only:
- ✅ TrueQuote authenticated results
- ❌ Never MagicFit estimates

## Data Flow

### MagicFit → TrueQuote (Clean Handoff)

**MagicFit outputs "intent":**
```typescript
magicFitProposal.selected = {
  scenarioType: "balanced",
  targetBatteryRatio: 0.7,
  durationHours: 4,
  targetSolarRatio: 0.5,
  targetGeneratorRatio: 0.27
}
```

**Step5 builds TrueQuote request:**
```typescript
TrueQuoteRequest = {
  location,
  utility,
  facility,
  useCaseData.inputs,
  preferences: {
    durationHours: 4,
    sizingMode: "ratio",
    targetRatios: { battery: 0.7, solar: 0.5, generator: 0.27 }
  }
}
```

**TrueQuote computes and returns real values:**
- `batteryKW/kWh`
- `solarKW`
- `generatorKW`
- `capex`
- `savings`
- `payback`

## Pitfall: "Two Competing Calculators"

**Problem:**
If UI reads from MagicFit sometimes and TrueQuote other times:
- ❌ Mismatched values
- ❌ Users seeing numbers change "randomly"
- ❌ Tier switching bugs
- ❌ Caching weirdness

**Fix:**
- ✅ If TrueQuote has run, hide MagicFit numbers or show as "Original estimate" in comparison
- ✅ ValueTicker should always read from TrueQuote `calculations` once available
- ✅ Never mix MagicFit and TrueQuote values in the same display

## State Shape

```typescript
WizardState {
  // ... other fields ...
  
  // SSOT (TrueQuote only)
  calculations?: {
    base: CalculationsBase;
    selected: CalculationsSelected;
  };
  
  quoteCache?: {
    fingerprint: string;
    result: TrueQuoteAuthenticatedResult | null;
    inFlightFingerprint?: string;
  };
  
  // Proposal/Preview (MagicFit - temporary)
  magicFit?: {
    fingerprint: string;
    scenarios: ScenarioConfig[];
    selectedType?: "essentials" | "balanced" | "max-savings";
    isEstimate: true;
    generatedAt: number;
  };
}
```

## Implementation Sequence

1. ✅ Add `magicFit` to WizardV6 state (separate from calculations)
2. MagicFit generates scenarios and stores them in `state.magicFit`
3. Step5 uses selected scenario to build TrueQuote request
4. On TrueQuote result, commit to `state.calculations` and freeze MagicFit display

## Current Status

**Step5MagicFit.tsx:**
- ✅ Already uses TrueQuote only (clean)
- ✅ Stores results in `state.calculations` (correct)
- ✅ Does NOT use MagicFit.ts for pre-computation

**MagicFit.ts:**
- May be used elsewhere for scenario generation
- If used, must store in `state.magicFit` (not `calculations`)
- Must be clearly labeled as "Estimate" in UI
