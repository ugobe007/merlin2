# 🤖 MERLIN LLM DEVELOPER GUIDE

## How AI Agents Should Learn, Develop, and Contribute to Merlin

**Version:** 1.0.0 | **Read Before Writing A Single Line of Code**

---

## STEP 1: ORIENT YOURSELF (Always First)

Before touching anything, read these files in order:

```bash
1. .merlin-meta/CONSTITUTION.md      # Supreme law — what you can/cannot do
2. .merlin-meta/CANONICAL_ELEMENTS.ts # Type-safe canonical references
3. src/services/DEPRECATION_STATUS.md # What NOT to use
4. MERLIN_STRATEGIC_ROADMAP.md        # Where we're going
5. MERLIN_KEY_DIFFERENTIATORS.md      # Why we win (use in sales context)
```

---

## STEP 2: UNDERSTAND THE ARCHITECTURE

### The Merlin Stack

```
Frontend (React + TypeScript + Vite)
  │
  ├── src/components/     → UI ONLY. Zero business logic allowed.
  ├── src/wizard/         → Multi-step quote wizard (WizardV8 is current)
  ├── src/pages/          → Route-level pages
  ├── src/hooks/          → React hooks (state, effects, data fetching)
  │
  ├── src/services/       → ALL BUSINESS LOGIC LIVES HERE
  │   ├── unifiedQuoteCalculator.ts  ← THE BRAIN. Touch with extreme care.
  │   ├── pricingServiceV45.ts       ← Pricing logic. Versioned.
  │   ├── benchmarkSources.ts        ← Audit trail for all numbers.
  │   └── [industry]IndustryProfile.ts ← Per-vertical logic.
  │
  ├── src/api/            → Public-facing API (NEW — see API strategy)
  └── src/contexts/       → React contexts (auth, theme, quote state)

Backend (Node.js Express — server/)
  │
  ├── server/routes/      → API routes
  ├── server/index.js     → Entry point
  └── supabase/           → DB migrations and schema

MCP Server (New — mcp-server/)
  └── Sales agent interface for AI clients

Agents (New — agents/)
  └── Daily autonomous operations
```

### The Wizard Flow (Current: V8)

```
Step 1: Business Type Selection (industry vertical)
Step 2: Location + Utility Information (zip code, utility)
Step 3: Load Profile (energy usage, peak demand, hours)
Step 4: System Configuration (MagicFit auto + manual override)
Step 5: Financial Parameters (ITC, financing, escalation rate)
Step 6: Quote Output (TrueQuote™ results + lead capture)
```

---

## STEP 3: NAMING CONVENTIONS (Mandatory)

### File Naming

```
Services:          camelCaseService.ts          (e.g., pricingService.ts)
Components:        PascalCase.tsx               (e.g., QuoteOutput.tsx)
Hooks:             useHookName.ts               (e.g., useQuoteState.ts)
Types/Interfaces:  PascalCase in types/ folder  (e.g., QuoteInput.ts)
Utils:             camelCase.ts                 (e.g., formatCurrency.ts)
Tests:             *.test.ts or *.spec.ts
Agents:            kebab-case.ts                (e.g., health-monitor.ts)
```

### Variable Naming for Energy Concepts

```typescript
// ALWAYS use these canonical names — never invent alternatives
storageSizeMW; // Battery storage in megawatts (not: batterySize, storage, MW)
durationHours; // Storage duration in hours (not: hours, runtime)
solarMW; // Solar generation in megawatts (not: solar, pvSize)
annualSavings; // Annual dollar savings (not: savings, yearSavings)
paybackYears; // Simple payback period (not: payback, roi)
npvDollars; // Net Present Value in dollars (not: npv, netValue)
irrPercent; // Internal Rate of Return as percent (not: irr, returnRate)
lcoePerKwh; // Levelized Cost of Energy (not: lcoe, costPerKwh)
peakDemandKw; // Peak demand in kilowatts (not: peak, demand)
averageLoadKw; // Average load in kilowatts (not: avgLoad, load)
```

---

## STEP 4: WHEN TO CREATE VS. WHEN TO MODIFY

### CREATE a new file when:

- Adding a new industry vertical profile (`[industry]IndustryProfile.ts`)
- Adding a new API endpoint (in `server/routes/`)
- Adding a new React component (in `src/components/`)
- Adding agent capabilities (in `agents/`)
- Adding ontology entries (in `ontology/`)

### MODIFY an existing file when:

- Fixing a bug in an existing service
- Adding a feature to an existing service
- Updating pricing benchmarks in `benchmarkSources.ts`
- Adding wizard steps to existing wizard flow

### NEVER create a new file that:

- Duplicates calculation logic already in `unifiedQuoteCalculator.ts`
- Creates a parallel pricing service to `pricingServiceV45.ts`
- Creates a new database abstraction layer
- Shadows an existing service with a "v2" suffix without deprecating the original

---

## STEP 5: HOW TO ADD A CALCULATION

```typescript
// ✅ CORRECT WAY — Route through SSOT
import { calculateQuote } from "@/services/unifiedQuoteCalculator";

const result = await calculateQuote({
  storageSizeMW: 1.0,
  durationHours: 4,
  industryType: "hotel",
  zipCode: "89101",
});

// ❌ WRONG WAY — Never do inline calculations
const savings = peakKw * 15 * 12; // Hard-coded, unvalidated, not auditable
```

---

## STEP 6: HOW TO ADD A NEW INDUSTRY VERTICAL

1. Create `src/services/[industry]IndustryProfile.ts` following the pattern in `hotelIndustryProfile.ts`
2. Add to `src/services/industryTemplates.ts`
3. Add load profile to `src/services/industryPowerProfilesService.ts`
4. Add use case slug to `useCaseService.ts`
5. Add to the canonical verticals list in `.merlin-meta/CONSTITUTION.md` (§ 2.4)
6. Add a Playwright E2E test in `tests/`
7. Create SMB landing page in `src/pages/`

---

## STEP 7: HOW TO UPDATE PRICING

Pricing data is sacred. Follow this process:

1. Find the new benchmark data (NREL ATB, Wood Mackenzie, BloombergNEF)
2. Update `src/services/benchmarkSources.ts` with the new source citation
3. Update `src/services/pricingServiceV45.ts` with the new values
4. Run `npm run truequote:validate` to confirm calculations still pass
5. Document the change in `PRICING_CALCULATIONS_REFERENCE.md`
6. Bump the version in `benchmarkSources.ts` (`CURRENT_BENCHMARK_VERSION`)

---

## STEP 8: HOW LLMs SHOULD RESPOND TO COMMON REQUESTS

### "Make the quote faster"

→ Profile with Vite's analyzer first. Cache calculation results in `cacheService.ts`.
→ DO NOT simplify the TrueQuote algorithm to improve speed.

### "Add a new field to the wizard"

→ Check `validationSchemaService.ts` first. Add field there.
→ Update the QuoteInput interface in `unifiedQuoteCalculator.ts`.
→ Map the field in `trueQuoteMapperConfig.ts`.

### "Fix a pricing bug"

→ Trace from the UI output back to `benchmarkSources.ts`.
→ Check calculation chain: component → service → unifiedQuoteCalculator → benchmarkSources.
→ Never fix by changing the output number — fix the root cause.

### "Add AI features"

→ Use `openAIService.ts` for OpenAI calls.
→ AI features are ADVISORY only — never let AI override TrueQuote™ numbers.
→ AI recommendations must include a "how we calculated this" disclosure.

### "Clean up the code"

→ Check `DEPRECATION_STATUS.md` for what's already marked for removal.
→ Remove one file at a time with a test to confirm nothing breaks.
→ Never delete a service unless you've confirmed zero imports.

---

## STEP 9: TESTING REQUIREMENTS

```bash
# Before every commit:
npm run typecheck    # Must be zero errors
npm run lint         # Must be zero errors
npm run test         # Must be all green

# Before every major feature:
npm run test:playwright  # E2E tests must pass
```

### Test Coverage Targets

| Layer      | Minimum Coverage     |
| ---------- | -------------------- |
| Services   | 80%                  |
| Utils      | 90%                  |
| Components | 60% (behavior tests) |
| API routes | 75%                  |

---

## STEP 10: LOGGING AND CHANGE TRACKING

All agent changes must be logged:

```typescript
// agents/_change_log.json format
{
  "timestamp": "2026-03-31T06:00:00Z",
  "agent": "daily-runner",
  "action": "fixed_pricing_bug",
  "files_modified": ["src/services/pricingServiceV45.ts"],
  "authorization_level": 2,
  "reviewed_by": null,
  "deployed": false
}
```

---

## GLOSSARY OF MERLIN TERMS

| Term       | Definition                                                            |
| ---------- | --------------------------------------------------------------------- |
| TrueQuote™ | Merlin's proprietary BESS sizing and financial analysis algorithm     |
| SSOT       | Single Source of Truth — `unifiedQuoteCalculator.ts`                  |
| BESS       | Battery Energy Storage System                                         |
| EPC        | Engineering, Procurement & Construction company                       |
| Vertical   | An industry-specific SMB product (car wash, hotel, etc.)              |
| MagicFit   | Auto-optimization algorithm that selects optimal system configuration |
| WizardV8   | Current version of the multi-step quote wizard                        |
| SMB        | Small-to-Medium Business (our vertical market target)                 |
| ITC        | Investment Tax Credit (federal energy incentive)                      |
| NEM        | Net Energy Metering (solar billing mechanism)                         |
| TOU        | Time of Use (utility rate structure with peak/off-peak pricing)       |
| Lead       | A qualified prospect captured through our SMB verticals               |
| LCOE       | Levelized Cost of Energy ($/kWh over system lifetime)                 |
| IRR        | Internal Rate of Return (financial performance metric)                |
| NPV        | Net Present Value (financial performance metric)                      |
| p50        | 50th percentile scenario (median/conservative projection)             |
| ATB        | Annual Technology Baseline (NREL authoritative cost database)         |
| MCP        | Model Context Protocol (AI agent communication standard)              |
