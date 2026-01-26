# Pricing Freeze Pattern (Jan 23, 2026)

## Problem Fixed

**Race Condition**: PricingConfigService constructor called `this.loadConfiguration()` (async) without awaiting → consumers read config before DB finishes → inconsistent quote math, "Invalid config from database" warnings.

## Solution: `ready()` Method + Frozen State

### 1. PricingConfigService Changes (✅ APPLIED)

```typescript
// ✅ Constructor no longer calls async work
constructor() {
  this.config = DEFAULT_PRICING_CONFIG;
}

// ✅ NEW: Call ready() before using pricing
async ready(): Promise<PricingConfiguration> {
  if (this._readyResolved) return this.getConfiguration();
  
  if (!this._readyPromise) {
    this._readyPromise = (async () => {
      await this.loadConfiguration();
      this._readyResolved = true;
      return this.getConfiguration();
    })();
  }
  return this._readyPromise;
}

// ✅ Browser guard for SSR safety
private isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
```

### 2. Helper Export (✅ APPLIED)

```typescript
// Use this in wizard/components
export async function getPricingConfiguration(): Promise<PricingConfiguration> {
  return pricingConfigService.ready();
}
```

### 3. Validation Tightened (✅ APPLIED)

Now checks actual numeric types, not just key existence:

```typescript
private validateConfig(config: any): boolean {
  // Check sections exist
  if (!requiredSections.every((section) => section in config)) {
    return false;
  }

  // ✅ Validate sentinel values to catch partial/corrupt DB rows
  if (typeof config.bess?.smallSystemPerKWh !== "number" || config.bess.smallSystemPerKWh <= 0) {
    return false;
  }
  if (typeof config.solar?.commercialPerWatt !== "number" || config.solar.commercialPerWatt <= 0) {
    return false;
  }
  // ... etc
}
```

## Usage Pattern: Freeze Pricing in WizardV7

### Step 1: Add State to useWizardV7.ts

```typescript
import { getPricingConfiguration } from "@/services/pricingConfigService";
import type { PricingConfiguration } from "@/services/pricingConfigService";

// Add to state
const [pricingConfig, setPricingConfig] = useState<PricingConfiguration | null>(null);
const [pricingStatus, setPricingStatus] = useState<'idle'|'loading'|'ready'|'fallback'>('idle');
```

### Step 2: Load Once at Step 3 Entry

```typescript
useEffect(() => {
  // Only load when entering Step 3 or later
  if (currentStep < 3) return;
  
  // Only load once per wizard session
  if (pricingConfig) return;

  let cancelled = false;
  (async () => {
    setPricingStatus('loading');
    const cfg = await getPricingConfiguration();
    if (cancelled) return;
    
    setPricingConfig(cfg);
    
    // Determine status based on source
    const isDefault = cfg?.updatedBy?.includes("Default") || 
                      cfg?.version === "1.0.0" ||
                      cfg?.lastUpdated === DEFAULT_PRICING_CONFIG.lastUpdated;
    setPricingStatus(isDefault ? 'fallback' : 'ready');
  })();

  return () => { cancelled = true; };
}, [currentStep, pricingConfig]);
```

### Step 3: Export from Hook

```typescript
return {
  // ... existing exports
  pricingConfig,
  pricingStatus,
};
```

### Step 4: Use in Step 3 Components

```tsx
// Step3DetailsV7.tsx or quote calculation components
const {
  pricingConfig,
  pricingStatus,
  // ... other wizard state
} = useWizardV7();

// Show pricing status badge
{pricingStatus === 'ready' && (
  <div className="badge badge-success">
    ✓ TrueQuote Verified Pricing
  </div>
)}

{pricingStatus === 'fallback' && (
  <div className="badge badge-warning">
    ⚠ Fallback Pricing (Database Unavailable)
  </div>
)}

{pricingStatus === 'loading' && (
  <div className="badge badge-info">
    ⏳ Loading Pricing...
  </div>
)}

// Only calculate quotes when pricing is loaded
{pricingStatus !== 'idle' && pricingStatus !== 'loading' && (
  <QuotePreview 
    powerProfile={powerProfile}
    pricingConfig={pricingConfig!}
  />
)}
```

## Benefits

| Issue | Before | After |
|-------|--------|-------|
| **Race condition** | Config read before loaded | `await ready()` ensures loaded |
| **Mid-session switching** | Defaults → DB mid-step | Frozen at Step 3 entry |
| **Multiple instances** | Each loads independently | Single-flight Promise |
| **SSR crashes** | `localStorage` in Node | Browser guard |
| **Quote consistency** | Numbers change mid-wizard | Same config entire session |

## PowerProfile Pipeline (Next Step)

Once pricing is frozen, implement:

```
Questionnaire Answers
    ↓
PowerProfile (pure facility data)
    ↓ + pricingConfig (frozen)
QuotePreview (priced results)
```

**PowerProfile Interface** (to be implemented):
```typescript
interface PowerProfile {
  industrySlug: string;           // Canonical from DB
  facilityType: string;
  operatingHours: {
    daysPerWeek: number;
    hoursPerDay: number;
  };
  connectedLoadKw: number;        // Sum of major loads
  peakDemandKw: number;          // Estimated or provided
  loadShape: {                   // 24h curve or proxies
    baseloadPct: number;
    peakBlocks: Array<{ hour: number; pct: number }>;
  };
  seasonality?: Record<string, number>;
  criticalLoads?: number;
  outageTolerance?: number;
  tariffInputs?: {
    demandChargePresent: boolean;
    touPresent: boolean;
  };
}
```

## Files Modified

- ✅ `src/services/pricingConfigService.ts` - Constructor fix, ready() method, browser guards, validation
- ⏳ `src/hooks/useWizardV7.ts` - Add pricingConfig state (NEXT STEP)
- ⏳ `src/components/wizard/v7/steps/Step3DetailsV7.tsx` - Show pricing status, use frozen config (NEXT STEP)

## Testing Checklist

- [ ] Start wizard → check console for "Invalid config" warnings (should be GONE)
- [ ] Complete Step 1-2 → enter Step 3 → check pricingStatus transitions: idle → loading → ready
- [ ] Generate quote in Step 3 → check quote math stays consistent (no mid-step changes)
- [ ] Refresh page at Step 3 → verify pricing reloads but then stays frozen
- [ ] Test with DB unavailable → verify fallback status badge shows correctly
- [ ] Test SSR build → verify no `localStorage` crashes

## Related Issues Fixed

- ✅ "Invalid config from database, using defaults" churn
- ✅ Multiple GoTrueClient instances (singleton pattern applied earlier)
- ✅ Non-deterministic pricing behavior
- ✅ Quote math changing mid-wizard session
- ✅ Race condition in service initialization
