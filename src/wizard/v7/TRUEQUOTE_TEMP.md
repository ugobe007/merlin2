# TrueQuoteTemp — Canonical Wizard Session Store

## What It Is

`TrueQuoteTemp` (`src/wizard/v7/trueQuoteTemp.ts`) is the **single source of truth**
for all wizard session data from Step 1 through Step 6.

It replaces the fragmented pattern of:
- 16+ scattered `merlinMemory.set(...)` calls across hooks and components
- `snapshotRef` / `readyToFreeze` / `frozen` / `flush-on-unmount` acrobatics in Step 5
- Race conditions caused by React 18 effect ordering (effects fire **after paint**)

---

## Data Flow

```
Step 1  → TrueQuoteTemp.writeLocation()      ← synchronous, in navigation handler
Step 2  → TrueQuoteTemp.writeIndustry()      ← synchronous, in navigation handler
Step 3  → TrueQuoteTemp.writeProfile()       ← synchronous, when answers submitted
Step 4  → TrueQuoteTemp.writeAddOns()        ← synchronous, in toggleOption() event handler
Pricing → TrueQuoteTemp.writePricing()       ← async (but isolated — doesn't block UI)
Step 5  → reads tqt = useTrueQuoteTemp()     ← reactive, always sees latest
Step 5  → TrueQuoteTemp.writeSelectedTier()  ← synchronous, on tier card click
Step 6  → reads tqt = useTrueQuoteTemp()     ← reactive, always sees latest
```

---

## Why Event Handlers, Not Effects

React 18 guarantees:
- State updater functions (`setX(prev => ...)`) run **synchronously**
- `useEffect` callbacks fire **after paint** — potentially after the next component
  has already mounted and read its initial state

The old pattern (write to `merlinMemory` in a `useEffect`) meant:

```
1. User clicks EV toggle → setSelectedOptions → React queues re-render
2. User clicks "See MagicFit" → Step 5 mounts → snapshot reads includeEV=false ← BUG
3. Step 4 cleanup effects fire → merlinMemory.set(includeEV:true) ← TOO LATE
```

The new pattern (write to `TrueQuoteTemp` in the toggle event handler):

```
1. User clicks EV toggle → toggleOption() → TrueQuoteTemp.writeAddOns({includeEV:true})
   ↑ synchronous, before any React re-render
2. User clicks "See MagicFit" → Step 5 mounts → useTrueQuoteTemp() reads includeEV=true ✅
3. No cleanup effects needed — data is already there
```

---

## API

```typescript
import { TrueQuoteTemp } from "@/wizard/v7/trueQuoteTemp";
import { useTrueQuoteTemp } from "@/wizard/v7/hooks/useTrueQuoteTemp";

// ── Read (React component) ────────────────────────────────────────────────
const tqt = useTrueQuoteTemp();        // subscribes, re-renders on patch()
const { includeEV, grossCost } = tqt;  // destructure any field

// ── Write (event handlers only — never in useEffect) ─────────────────────

// Step 1
TrueQuoteTemp.writeLocation({ state, zip, city, utilityRate, demandCharge, peakSunHours });

// Step 2
TrueQuoteTemp.writeIndustry("hotel");

// Step 3
TrueQuoteTemp.writeProfile({ peakLoadKW, durationHours, goals });

// Step 4 (called inside toggleOption's setState updater)
TrueQuoteTemp.writeAddOns({ includeSolar, solarKW, includeGenerator, generatorKW,
                             generatorFuelType, includeWind, windKW, includeEV, evChargerKW });

// Pricing (called after pricing pipeline completes)
TrueQuoteTemp.writePricing({ pricingComplete, grossCost, taxCredit, netCost,
                              annualSavings, paybackYears, roi5Year, roi10Year, roi25Year, npv, irr });

// Step 5
TrueQuoteTemp.writeSelectedTier("perfectFit");

// ── Session management ────────────────────────────────────────────────────
TrueQuoteTemp.reset(sessionId);  // call on wizard start
TrueQuoteTemp.patch({ any: "partial" });  // low-level, use typed helpers above
```

---

## What Stays in `merlinMemory`

`merlinMemory` is retained for backward compatibility with consumers that haven't
been migrated yet (`useMerlinData`, legacy V6 components, etc.).

**During the migration period**, each canonical write to `TrueQuoteTemp` is also
mirrored to `merlinMemory`. Once all consumers are migrated, the mirror writes
can be removed.

| Data | TrueQuoteTemp | merlinMemory | Notes |
|------|--------------|--------------|-------|
| Add-ons (solar/EV/gen) | ✅ CANONICAL | 🔄 mirrored | Step 5 reads from TrueQuoteTemp |
| Pricing results | ✅ CANONICAL | 🔄 mirrored | Step 5/6 should migrate to TrueQuoteTemp |
| Location/weather | 🚧 planned | existing | `useWizardLocation` to migrate |
| Industry | 🚧 planned | existing | `useWizardStep2` to migrate |

---

## Persistence

TrueQuoteTemp persists to `sessionStorage` under key `tqt_v1`. This means:
- Page refresh within same tab restores all wizard values
- Closing the tab discards the session (intentional — quotes are ephemeral until saved)
- Multiple tabs are independent (each has its own `sessionStorage`)

---

## Files

| File | Purpose |
|------|---------|
| `src/wizard/v7/trueQuoteTemp.ts` | Store implementation + `TrueQuoteTempData` type |
| `src/wizard/v7/hooks/useTrueQuoteTemp.ts` | React hook (`useSyncExternalStore`) |

---

## Migration Checklist

- [x] `SystemAddOnsCards.tsx` — `toggleOption` writes to TrueQuoteTemp
- [x] `SystemAddOnsCards.tsx` — auto-apply `useEffect` writes to TrueQuoteTemp  
- [x] `Step5MagicFitV7.tsx` — snapshot reads add-ons from TrueQuoteTemp
- [x] `useWizardPricing.ts` — `writePricing()` after pricing completes
- [ ] `useWizardLocation.ts` — `writeLocation()` when location confirmed
- [ ] `useWizardStep2.ts` — `writeIndustry()` when industry selected
- [ ] `Step5MagicFitV7.tsx` — full `snapshotRef` removal (replace with pure TrueQuoteTemp reads)
- [ ] `Step6ResultsV7.tsx` — migrate from `useMerlinData` to `useTrueQuoteTemp`

---

*Established: Feb 2026 — Canonical fix for EV charger badge race condition.*
*Owner: Wizard architecture. Do not bypass — write to TrueQuoteTemp, not directly to merlinMemory.*
