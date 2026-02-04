# TrueQuote Diagnostic System

**Created: February 3, 2026**

System for detecting Step 3 configuration mismatches and unit conversion bugs in the Merlin wizard.

---

## 🎯 What This Catches

### Unit Mismatches
- ❌ hours vs minutes
- ❌ kW vs MW
- ❌ dailyVehicles vs vehicles/hour
- ❌ hp vs kW (vacuum/pumps/blowers)

### Configuration Bugs
- ❌ Conditional dependency mismatches (naturalGasLine → waterHeaterType)
- ❌ Base load > Peak load (logic error)
- ❌ Negative values (unit conversion bug)
- ❌ Default/fallback applied when answer exists

### Sizing Drift
- ❌ Load result says X peak but sizing hints produce Y kW
- ❌ Duration not aligned with industry defaults
- ❌ Step 3 answers imply one config but calculator assumes another

---

## 📦 Files Created

```
merlin3/
├── scripts/
│   └── quote-diag.ts           # Calculator script harness
├── src/
│   └── utils/
│       └── quoteInvariants.ts  # Runtime invariant checks
└── package.json                # Added: npm run quote:diag
```

---

## 🚀 Usage

### 1. Run Calculator Script (Offline Testing)

```bash
npm run quote:diag
```

**What it does:**
- Runs Layer A + Layer B with 7 car wash variants
- Prints load profile, sizing, pricing for each
- Checks **monotonic behavior** (strong signal of bugs):
  - `dailyVehicles ↑` ⇒ `peak/kWh should ↑`
  - `operatingHours ↑` ⇒ `peak/kWh should ↑`
  - `dryer quantity ↑` ⇒ `peak should ↑`
  - `pump quantity ↑` ⇒ `peak should ↑`

**Example Output:**
```
🧪 cw_baseline — Car Wash baseline
------------------------------------------------------------
Load: base=120kW peak=180kW kWh/day=3240
Sizing: {"bessKW":72,"bessKWh":288,"durationHrs":4}
Fallbacks: 0
Snapshot: 7f3a9b2c8d1e
Pricing: capex=$215,000 savings=$48,000 roi=4.5y

✅ Monotonic OK: dailyVehicles ↑ => peak/kWh should ↑
❌ Monotonic FAIL: dryer quantity ↑ => peak should ↑
   cw_baseline | x=4 | peak=180kW | kWh/d=3240
   cw_big_dryers | x=8 | peak=175kW | kWh/d=3100  ← BUG!
```

If monotonic check **FAILS**, you have a **real bug**.

---

### 2. Run Wizard with Invariants (Live Testing)

Open wizard with debug panel:
```
http://localhost:5184/wizard?debug=1
```

1. Fill out Step 3 (car wash)
2. Click "See Results →"
3. Check debug panel for:
   - `data-testid="debug-invariants"`
   - `data-count="0"` = all good
   - `data-count="3"` = 3 issues found

**Invariants are DEV-only and non-blocking** - they light up problems without stopping navigation.

---

## 🔍 Invariant Checks

### Load Profile Invariants
| Code | Severity | Message |
|------|----------|---------|
| `LOAD_MISSING` | error | Missing baseLoadKW or peakLoadKW |
| `LOAD_NAN` | error | NaN/Infinity in load profile |
| `LOAD_NEGATIVE` | error | Negative kW (unit bug) |
| `BASE_GT_PEAK` | error | Base > Peak (logic bug) |
| `KWH_NEGATIVE` | error | Negative kWh/day |
| `PEAK_HUGE` | warn | Peak > 5 MW (possible unit mismatch) |
| `KWH_HUGE` | warn | Energy > 200,000 kWh/day |
| `LOAD_FACTOR_HIGH` | warn | Base > 90% of peak (check diversity) |

### Pricing Invariants
| Code | Severity | Message |
|------|----------|---------|
| `FIN_NAN` | error | Financial metric is NaN/Infinity |
| `CAPEX_NEG` | error | Negative CapEx (impossible) |
| `ROI_NEG` | error | Negative ROI years |
| `SAVINGS_NEG` | warn | Negative annual savings |
| `ROI_LONG` | warn | ROI > 50 years (not viable) |
| `IRR_NEG` | warn | Negative IRR |

---

## 🛠️ Customizing for Your Industry

### Add Hotel Variants

Edit `scripts/quote-diag.ts`:

```typescript
function baseHotelAnswers(): Record<string, unknown> {
  return {
    roomCount: 150,
    hotelClass: "midscale",
    hasPool: true,
    hasRestaurant: false,
    // ... etc
  };
}

function makeVariants(): Variant[] {
  const base = baseHotelAnswers();
  return [
    { id: "hotel_baseline", industry: "hotel", answers: { ...base } },
    { id: "hotel_more_rooms", industry: "hotel", answers: { ...base, roomCount: 300 } },
    { id: "hotel_luxury", industry: "hotel", answers: { ...base, hotelClass: "luxury" } },
  ];
}
```

### Adjust Sanity Thresholds

Edit `src/utils/quoteInvariants.ts`:

```typescript
// Increase threshold for industrial sites
if (peak > 10000) {  // was 5000
  issues.push({ severity: "warn", code: "PEAK_HUGE", ... });
}
```

---

## 🎯 Top 5 Likely Bugs (Based on Your Suspicion)

Based on car wash Step 3 structure, expect to find:

1. **dryerConfiguration not flowing into blower kW**
   - Symptom: `cw_big_dryers` has same peak as baseline
   - Fix: Check `dryerConfiguration.quantity` → load model mapping

2. **pumpConfiguration quantity not contributing to peak**
   - Symptom: `cw_big_pumps` has same peak as baseline
   - Fix: HP → kW conversion missing or wrong

3. **dailyVehicles treated as vehicles/hour**
   - Symptom: Peak is 10-20x too high
   - Fix: Check throughput normalization (per day vs per hour)

4. **operatingHours applied twice**
   - Symptom: kWh/day grows quadratically with hours
   - Fix: Check if hours × days/week double-counts

5. **Tier 2 defaults overriding Tier 1 answered fields**
   - Symptom: Fallback count > 0 even when all blockers answered
   - Fix: Check key normalization (snake_case vs camelCase)

---

## 📊 Next Steps

1. **Run the harness**: `npm run quote:diag`
2. **Look for monotonic failures** (bottom of output)
3. **If failure found**, paste the 3 relevant variants here:
   - `cw_baseline`
   - The variant that should be higher
   - The failing variant output
4. **We'll trace the bug** to exact file + line number

---

## 🚨 When to Re-Run

- After changing calculator code
- After updating Step 3 schema
- Before merging any pricing/load changes
- When adding new industry
- When debugging "quote doesn't match expectations"

This is your **non-negotiable gate** before shipping.
