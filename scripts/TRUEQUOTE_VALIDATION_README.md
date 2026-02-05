# TrueQuote™ Validation Harness

**Deterministic quote validation system that catches Step 3 config mismatches before they produce garbage quotes.**

## What It Does

Runs **Layer A (contract quote)** + **Layer B (pricing)** across industries with fixture answers to validate:
1. Load profile consistency (peak vs base, energy sanity, duty cycle)
2. kW contributors (no negatives, no NaN, reasonable magnitudes)
3. Pricing inputs (no unexpected defaults, valid ROI/capex outputs)
4. Full forensic trace for debugging bad quotes

## Files

```
src/services/truequote/
├── runContractQuoteCore.ts  # Layer A: Pure contract runner (no React hooks)
└── runPricingQuoteCore.ts   # Layer B: Pure pricing runner (calls SSOT calculator)

scripts/
└── validate-truequote.ts    # Automated harness (runs A+B, writes JSON report)
```

## Usage

### Quick Run

```bash
npx tsx scripts/validate-truequote.ts
```

**Output**: `truequote-validation-report.json` in project root

**Exit codes**:
- `0` = All industries pass
- `1` = One or more industries failed hard invariants
- `2` = Harness crashed

### Install tsx (if not already installed)

```bash
npm install -D tsx
```

## Hard Invariants Enforced

The harness **fails loudly** on these violations:

| Invariant | Description |
|-----------|-------------|
| `peak>0` | Peak load must be positive |
| `peak>=base` | Peak cannot be less than base load |
| `energy<=peak×24h` | Daily energy cannot exceed theoretical maximum |
| `dutyCycle∈[0,1.25]` | Duty cycle must be in valid range |
| `contributors≥0` | All kW contributors must be non-negative |
| `contributors∉NaN` | No NaN values allowed |
| `capex>0` | Capex must be positive |
| `ROI>0` | ROI must be positive |
| `ROI<100` | ROI should be reasonable (<100 years) |

## Forensic Trace Bundle

Each industry produces a full trace with:

```typescript
{
  ts: "2026-02-05T10:30:00.000Z",
  layer: "A",
  template: {
    industry: "car_wash",
    version: "cw.v1.0.0",
    calculator: "cw_load_v1_16q"
  },
  inputsUsed: {
    tunnelOrBayCount: 1,
    operatingHours: { start: "08:00", end: "18:00" },
    dailyVehicles: 150,
    electricityRate: 0.15,
    demandCharge: 20,
    // ... all mapped inputs
  },
  loadProfile: {
    baseLoadKW: 45.2,
    peakLoadKW: 78.5,
    energyKWhPerDay: 950.4
  },
  computed: {
    dutyCycle: 0.5,
    kWContributors: {
      pumps: 32.0,
      dryers: 24.0,
      waterHeater: 15.0,
      lighting: 7.5
    }
  },
  sizingHints: {
    storageToPeakRatio: 0.4,
    durationHours: 4
  },
  warnings: [
    "ℹ️ Using default electricity rate (0.12 $/kWh)"
  ],
  missingInputs: [],
  inputFallbacks: {
    electricityRate: { value: 0.12, reason: "no location intel" }
  }
}
```

## Adding Industry Fixtures

Edit `scripts/validate-truequote.ts`:

```typescript
const FIXTURES: Record<string, Record<string, any>> = {
  car_wash: {
    facilityType: "tunnel",
    tunnelOrBayCount: 1,
    operatingHours: { start: "08:00", end: "18:00" },
    daysPerWeek: 7,
    dailyVehicles: 150,
    // ... your fixture answers
  },
  hotel: {
    rooms: 120,
    occupancyRate: 0.75,
    // ...
  },
  // Add new industry here
  your_industry: {
    // ... answers that match template questions
  },
};
```

## Industry-Specific Invariants

After the basic harness runs, add custom invariants for specific industries:

```typescript
// In scripts/validate-truequote.ts, after Layer A:

if (industry === "car_wash") {
  const contrib = a.computed.kWContributors ?? {};
  const total = Object.values(contrib).reduce((sum, v) => sum + (v as number), 0);
  
  // Dryers + pumps should be 60-80% of total load for tunnel car wash
  const dryersAndPumps = (contrib.dryers ?? 0) + (contrib.pumps ?? 0);
  const ratio = dryersAndPumps / total;
  
  if (ratio < 0.6 || ratio > 0.8) {
    warnings.push(`⚠️ Car wash: dryers+pumps = ${(ratio*100).toFixed(0)}% (expected 60-80%)`);
  }
  
  // Operating hours should affect duty cycle
  const dc = a.computed.dutyCycle ?? 0;
  const expectedDC = 10 / 24; // 10 hours/day for 08:00-18:00
  if (Math.abs(dc - expectedDC) > 0.1) {
    warnings.push(`⚠️ Car wash: duty cycle ${dc.toFixed(2)} doesn't match operating hours`);
  }
}
```

## Debugging Bad Quotes

When you see a suspicious quote in production:

1. **Run harness** to get trace bundle:
   ```bash
   npx tsx scripts/validate-truequote.ts
   ```

2. **Open report**:
   ```bash
   code truequote-validation-report.json
   ```

3. **Find industry** and check:
   - `loadProfile` - Are peak/base/energy reasonable?
   - `kWContributors` - Which components are wrong?
   - `inputsUsed` - Were any fields defaulted?
   - `warnings` - What invariants were violated?

4. **Compare with production state**:
   - Copy user's Step 3 answers from production
   - Add to FIXTURES
   - Re-run harness
   - Diff trace bundle with expected

## CI Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Validate TrueQuote
  run: npx tsx scripts/validate-truequote.ts
```

The script exits with code 1 if any industry fails hard invariants, causing CI to fail.

## Next Steps

### Phase 1: Get All Industries Passing (Current)
- [x] Create harness infrastructure
- [ ] Run across car_wash, hotel, ev_charging, data_center
- [ ] Fix any hard failures (peak=0, peak<base, etc.)

### Phase 2: Add Industry-Specific Invariants
- [ ] Car wash: dryers+pumps dominant contributors
- [ ] Hotel: HVAC dominant for occupied rooms
- [ ] EV charging: charger power matches config
- [ ] Data center: PUE multiplier applied correctly

### Phase 3: Production Integration
- [ ] Add "Export TrueQuote Trace" button to Results page
- [ ] Save trace to localStorage on quote generation
- [ ] Admin panel: "Validate All Use Cases" button
- [ ] Automated nightly validation reports

## Troubleshooting

### `Cannot find package '@/wizard'`

The harness needs TypeScript path resolution. Options:

**Option A: Use vite-node (recommended)**
```bash
npx vite-node scripts/validate-truequote.ts
```

**Option B: Build first**
```bash
npm run build
node dist/scripts/validate-truequote.js
```

**Option C: Add tsconfig-paths**
```bash
npm install -D tsconfig-paths
npx ts-node -r tsconfig-paths/register scripts/validate-truequote.ts
```

### `Module not found: templateIndex`

Check import paths in `runContractQuoteCore.ts` match your V7 architecture:
```typescript
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
```

### `Calculator returns undefined`

Your calculator's `compute()` function needs to return:
```typescript
{
  baseLoadKW: number;
  peakLoadKW: number;
  energyKWhPerDay: number;
  dutyCycle?: number;
  kWContributors?: Record<string, number>;
  assumptions?: string[];
  warnings?: string[];
}
```

## Questions?

- **"Why separate Layer A and B?"** - Because load profile bugs (Layer A) are different from pricing bugs (Layer B). You can validate physics independently of pricing.
- **"Can I run this on production quotes?"** - Yes! Add a `runDiagnostic(quoteId)` function that loads production answers and runs the harness.
- **"How do I add more fixtures?"** - Just add to the `FIXTURES` object in `validate-truequote.ts`. Each key = industry slug, value = Step 3 answers object.
