# Merlin Energy Platform — Intellectual Property Disclosure

**Prepared:** March 23, 2026 (v1.0) | Updated: April 2026 (v2.0)  
**Prepared by:** Robert Christopher  
**Product:** Merlin Energy — Commercial BESS Quoting & Configuration Platform  
**Live URL:** https://merlinenergy.net  
**Codebase:** github.com/ugobe007/merlin2 (branch: main)

> ⚠️ **CONFIDENTIAL — ATTORNEY-CLIENT PRIVILEGED**  
> This document contains trade secret and patent-sensitive information.  
> Do not distribute outside legal counsel.

---

## Table of Contents

1. [System-Level Patent (Combined Claim)](#system-level-patent)
2. [Component Patents — TrueQuote Engine Layer](#truequote-engine-patents) — Patents 1–8
3. [Component Patents — Wizard V8 Layer](#wizard-v8-patents) — Patents 9–15
4. [Component Patents — Intelligence & Vendor Platform Layer](#intelligence--vendor-platform-patents) — Patents 16–22
5. [Component Patents — Pricing & Intelligence Architecture Layer](#pricing--intelligence-architecture-patents) — Patents 23–29 _(new — v3.0)_
6. [Trade Secrets](#trade-secrets)
7. [Trademarks](#trademarks)
8. [Copyrights](#copyrights)
9. [Filing Priority & Roadmap](#filing-priority--roadmap)
10. [Prior Art Notes](#prior-art-notes)

---

## System-Level Patent

### PATENT 0 — _Merlin Energy Configuration System_

**Unified system claim encompassing Patents 1–15**

> A computer-implemented system for automatically generating bankable commercial energy storage system configurations, comprising: a location-aware geographic intelligence layer that resolves a user-supplied location identifier through a multi-tier fallback chain while simultaneously initiating independent parallel fetches for utility rate data, solar irradiance data, and weather data; a probabilistic business classification engine that maps a business name to a facility-type category using confidence-weighted keyword matching, eliminates intermediate configuration steps when classification confidence exceeds a threshold, and atomically populates physics constraints in the same transaction; a four-layer energy system sizing engine that combines geographic, industry, operational, and goal parameters into three distinct optimized configurations; a proactive synthesis engine that begins computing configurations before the user requests them using a content-addressable cache; and a source-traceable pricing engine where every computed value is linked to a documented external authority with full audit metadata.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts`
- `src/wizard/v8/wizardState.ts`
- `src/wizard/v8/step4Logic.ts`
- `src/services/CompleteTrueQuoteEngine.ts`
- `src/services/MerlinOrchestrator.ts`
- `src/services/benchmarkSources.ts`

---

## TrueQuote Engine Patents

### PATENT 1 — _Four-Layer Energy System Sizing Engine_

**Field:** Energy system configuration; commercial BESS sizing  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented method for sizing a commercial battery energy storage system using a four-layer information pyramid where each layer is collected sequentially and each constrains the next.

**Novel Elements:**

**Layer 1 (Location):**

- Derives continuous solar viability coefficient:
  `sunFactor = clamp((peakSunHours − 3.0) / 2.5, 0, 1)`
  - Value = 1.0 at 5.5 PSH (grade A−), 0.32 at 3.8 PSH (Ann Arbor), 0.0 below 3.0 PSH
- Maps to a letter-grade system (A, A−, B+, B, B−, C+, C, D)
- B− (PSH ≥ 3.5) is the minimum viable solar grade — below this solar is excluded entirely

**Layer 2 (Industry/Facility Type):**

- Industry-specific `solarPhysicalCapKW` — maximum solar the facility can physically host
  - car wash: 60 kW (small bay roof), hotel: 225 kW, warehouse: 819 kW, hospital: 150 kW
- Industry-specific `criticalLoadPct` — IEEE 446-1995 / NEC 517 compliant critical load percentage

**Layer 3 (Operational Profile):**

- Actual measured power demand: `baseLoadKW`, `peakLoadKW`
- EV charger load pre-merged into demand baseline (not a post-hoc add-on)
- BESS application intent from questionnaire

**Layer 4 (Goal):**

- Goal-weighted penetration table:
  - `save_more`: smaller BESS, moderate solar, shorter duration
  - `save_most`: balanced sizing for optimal NPV/ROI
  - `full_power`: maximum BESS, maximum solar, generator always included, longest duration
- Goals adjust sizing _weights_ — they do not set values (data decides, goals guide)

**Solar Sizing Formula:**

```
solarOptimalKW = solarPhysicalCapKW × sunFactor × goalPenetration
solarFinalKW   = min(solarOptimalKW, solarPhysicalCapKW)  // never exceed physical cap
```

**Double-Gate Solar Feasibility:**  
Solar is included only when BOTH:

- (a) `solarGrade ≥ B−` (PSH ≥ 3.5) — geographic gate
- (b) `solarPhysicalCapKW > 0` — facility gate  
  Either gate alone is insufficient.

**Key Source Files:**

- `src/wizard/v8/step4Logic.ts`
- `src/wizard/v8/wizardState.ts` (`isSolarFeasible()`)
- `src/services/useCasePowerCalculations.ts` (`getFacilityConstraints()`)
- `src/services/benchmarkSources.ts` (`getCriticalLoadWithSource()`)

---

### PATENT 2 — _MagicFit: Generative Three-Tier Energy System Optimizer_

**Field:** Energy system configuration; multi-tier quote generation  
**Filing type:** Utility patent

**Abstract:**  
A system that generates three distinct optimized energy system configurations from a single base calculation, with BESS capacity dynamically upsized based on the specific combination of generation sources the user has included or declined.

**Novel Elements:**

**Four BESS Upsize Matrices:**
| Generation Combination | BESS Upsize (Starter/Recommended/Complete) | Duration Multiplier |
|---|---|---|
| Full (solar + generator) | 1.0× / 1.0× / 1.0× | 1.0× |
| Solar Only (no generator) | 1.15× / 1.25× / 1.35× | 1.5× |
| Generator Only (no solar) | 1.0× / 1.1× / 1.2× | 1.0× |
| UPS Mode (neither) | 1.35× / 1.5× / 1.65× | 2.0× |

**UPS Mode:**  
When a user declines both solar and generator, BESS is upsized up to 1.65× with a 2.0× duration multiplier to fully substitute for absent on-site generation — the system automatically compensates for the absence of renewable generation.

**Authentication Pattern:**  
MagicFit cannot present results directly to the user. All proposals must pass TrueQuote authentication before reaching the customer interface.

**Three-Tier Derivation:**  
Three configurations are derived from a single financial model call (not three separate calculations), ensuring internal consistency across tiers.

**Key Source Files:**

- `src/services/MagicFit.ts`
- `src/services/TrueQuoteEngineV2.ts`
- `src/services/MerlinOrchestrator.ts`

---

### PATENT 3 — _Source-Traceable Quote Generation System ("TrueQuote™ Compliance")_

**Field:** Financial modeling; energy project finance  
**Filing type:** Utility patent

**Abstract:**  
A commercial energy system quoting platform where every computed value in a customer-facing quote is linked to a documented, version-controlled external authority with a full audit trail and deviation logging system.

**Novel Elements:**

**Typed Source Registry (`AUTHORITATIVE_SOURCES`):**
Every data source is a typed record including:

- `id`, `name`, `organization`, `type` (primary/secondary/certification/utility)
- `publicationDate`, `retrievalDate`, `vintage`, `lastVerified`
- `url`, `notes`

Sources include: NREL ATB 2024, NREL StoreFAST, NREL Cost Benchmark Q1 2024, EIA CBECS 2018, IEEE 446-1995, SEIA, BNEF, ASHRAE

**Per-Value Citation:**  
Every formula return includes `{ value, unit, sourceId, citation, confidence, validFrom, validUntil }` — not just a number.

**`QuoteAuditMetadata`:**  
Each generated quote includes:

- `generatedAt`, `benchmarkVersion`, `sourcesUsed[]`, `methodologyVersion`
- `deviations[]`: any value that differs from the national benchmark is logged with `lineItem`, `benchmarkValue`, `appliedValue`, and `reason`

**Drift Detection Architecture:**  
TrueQuote computes "base cost" (market truth) — MarginPolicyEngine applies "sell price policy" (commercialization). These two layers are never merged, making price drift auditable.

**Key Source Files:**

- `src/services/benchmarkSources.ts`
- `src/services/marginPolicyEngine.ts`
- `src/services/unifiedQuoteCalculator.ts`

---

### PATENT 4 — _Three-Layer Commercial Margin Policy Engine_

**Field:** Commercial pricing systems; automated margin management  
**Filing type:** Utility patent

**Abstract:**  
A pricing system with a formally separated three-layer stack (market cost → obtainable reality → sell price) with deal-size discount curves, product-class margin tiers, risk adjusters, and automated human-review triggers.

**Novel Elements:**

**Three-Layer Pricing Stack:**

- Layer A: Market/base pricing (SSOT — external data, never modified)
- Layer B: Obtainable reality buffer (procurement uncertainty, regional variance)
- Layer C: Sell price (margin policy applied — this is the customer-visible number)

**Deal Size Discount Curve:**  
Larger deals automatically receive tighter margins — the curve is encoded as margin bands (`micro`, `small`, `medium`, `large`, `enterprise`) each with configured margin percentages per product class.

**Product-Class Margin Configuration:**  
Distinct margins for: `bess`, `solar`, `wind`, `generator`, `ev_charger`, `inverter_pcs`, `transformer`, `microgrid_controller`, `bms`, `scada`, `ems_software`, `construction_labor`, `engineering`

**ReviewEvent System:**  
Automated human-in-the-loop trigger when:

- Market price falls below review threshold → `warning`
- Market price is suspiciously low → `alert` (requires human review before quote is issued)
- Pricing data is stale → `warning`

**Floor/Ceiling Guards:**  
Hard limits at both unit price and total quote level prevent quote outliers from reaching customers.

**Key Source Files:**

- `src/services/marginPolicyEngine.ts`

---

### PATENT 5 — _8760-Hour BESS Dispatch Simulator_

**Field:** Energy management systems; battery dispatch optimization  
**Filing type:** Utility patent

**Abstract:**  
A full-year (8,760-hour) hourly energy simulation engine for commercial battery storage systems that computes dispatch schedules, multi-strategy revenue stacks, and time-of-use arbitrage values using actual industry load profiles and utility rate structures.

**Novel Elements:**

**8760-Hour Simulation:**  
Full-year hourly dispatch with per-hour state-of-charge tracking (not annual averages or monthly multipliers).

**Multi-Strategy Optimization (selectable per configuration):**

- Peak shaving: reduce demand charges during utility peak windows
- TOU arbitrage: charge during off-peak, discharge during on-peak
- Solar self-consumption: store excess PV for discharge later
- Demand response: grid services revenue
- Backup power: avoided outage cost valuation

**Load Profile Library:**  
Industry-specific hourly load shapes (hotel, hospital, data-center, warehouse, EV charging, etc.) derived from NREL Load Profile Library and EIA Typical Load Shapes.

**Output:**

- Hourly dispatch schedule, annual energy throughput (MWh)
- Revenue/savings by category (peak, TOU, DR, backup)
- Capacity factor achieved, SOC profile

**Key Source Files:**

- `src/services/hourly8760AnalysisService.ts`

---

### PATENT 6 — _Probabilistic Financial Analysis for Commercial Energy Storage_

**Field:** Financial modeling; risk quantification  
**Filing type:** Utility patent

**Abstract:**  
A Monte Carlo simulation system for commercial BESS financial analysis producing P10/P50/P90 distributions of NPV, IRR, and payback period, with ITC qualification risk modeled as a discrete binary event.

**Novel Elements:**

**Latin Hypercube Sampling:**  
Uses Latin Hypercube sampling (not simple random Monte Carlo) for efficiency with correlated input variables.

**ITC Qualification as Binary Risk:**  
The federal Investment Tax Credit qualification is modeled as a binary risk event — `probability of failing PWA audit (0–1)` — with discrete impact on NPV distribution. No prior commercial energy quoting system models ITC risk probabilistically.

**Correlated Variable Set:**  
Six variables with documented NREL ATB uncertainty ranges:

- Electricity rate escalation (±2% around base)
- Battery degradation rate (±20%)
- Capacity factor/utilization (±15%)
- Equipment costs (±10% committed / ±25% indicative)
- ITC qualification (binary: pass/fail)
- Demand charge changes (±20%)

**Output Format:**  
P10/P50/P90 NPV, IRR, payback + sensitivity tornado chart data — formatted for direct use in customer-facing bankability presentations.

**Key Source Files:**

- `src/services/monteCarloService.ts`

---

### PATENT 7 — _Geographic Intelligence Engine for Energy System Recommendation_

**Field:** Geographic information systems; energy planning  
**Filing type:** Utility patent

**Abstract:**  
A location-aware energy recommendation system that synthesizes solar irradiance, grid reliability metrics, utility rate structures, and state incentive stacking for all 50 U.S. states into a composite energy viability profile.

**Novel Elements:**

**Solar Grade Letter System:**  
Continuous `peakSunHours` value converted to a letter grade (A, A−, B+, B, B−, C+, C, D) via `gradeFromPSH()`. B− is the minimum viable grade — not just informational, but an eligibility gate that excludes solar from quotes.

**Composite Grid Reliability Score:**  
Combines `averageOutagesPerYear` + `typicalOutageDuration` + region-specific event notes (PSPS events in California, aging infrastructure flags) into a categorical reliability rating used for generator auto-recommendation.

**State Incentive Stacking:**  
Federal ITC base rate + `additionalItcBonus` (state-specific) + SREC availability + Net Metering policy = combined effective incentive rate per state. All 50 states encoded.

**TOU Structure as Dispatch Strategy Selector:**  
TOU availability and rate structure classification are used as primary factors in selecting the BESS dispatch optimization strategy — not just informational context.

**Key Source Files:**

- `src/services/geographicIntelligenceService.ts`

---

### PATENT 8 — _Market Inference Engine for Energy Configuration Pattern Detection_

**Field:** Business intelligence; market analysis  
**Filing type:** Utility patent

**Abstract:**  
A system that analyzes real-world energy system installation patterns, news signals, and market data to identify BESS configuration trends, customer decision indicators, and emerging opportunities, feeding results to downstream ML models.

**Novel Elements:**

**Configuration Frequency Analysis:**  
Tracks how often specific BESS configurations (e.g., "500 kW / 1 MWh") appear across real market transactions, with per-industry frequency distributions and price ranges.

**Customer Decision Indicator Correlation:**  
Maps customer-stated decision drivers (peak shaving, backup power, revenue generation) to adoption probability using correlation scores derived from historical data.

**Temporal Trend Tracking:**  
Three timeframe categories (short: 1–3 months, medium: 3–12 months, long: 12+ months) with magnitude and confidence scores for each trend.

**Key Source Files:**

- `src/services/marketInferenceEngine.ts`

---

## Wizard V8 Patents

### PATENT 9 — _Proactive Background Synthesis Engine with Content-Addressable Promise Cache_

**Field:** Web application architecture; asynchronous computation  
**Filing type:** Utility patent — **HIGHEST PRIORITY WIZARD CLAIM**

**Abstract:**  
A multi-step web application that proactively begins computing final results in the background several steps before the user arrives at the results page, using a content-addressable cache key derived from all relevant state parameters to deduplicate in-flight computations and detect stale results.

**Novel Elements:**

**Content-Addressable Cache Key (`createTierBuildKey`):**  
A deterministic JSON fingerprint derived from 20+ state parameters:

```
fingerprint = JSON.stringify({
  location.{zip, state}, industry,
  baseLoadKW, peakLoadKW, criticalLoadPct, solarPhysicalCapKW,
  wantsSolar, wantsGenerator, wantsEVCharging,
  solarKW, generatorKW, generatorFuelType,
  level2Chargers, dcfcChargers, hpcChargers,
  evRevenuePerYear, step3Answers,
  intel.{utilityRate, demandCharge, peakSunHours, solarFeasible}
})
```

**Promise Deduplication:**  
If the fingerprint matches an already-in-flight Promise, that same Promise is returned — no duplicate computation. If any input changes, the cached Promise is discarded and a new build begins immediately.

**Stale Cache Detection:**  
System detects when `tiersStatus === "ready"` but the current fingerprint no longer matches what was built (e.g., user changed addon preference after tiers were computed). A silent background rebuild is triggered without the user seeing a loading state.

**Proactive Pre-Computation:**  
Computation begins at Step 3 — two full steps before the results page (Step 5). The user experiences zero wait time at the results step in the typical flow.

**Stale-While-Rebuilding Pattern:**  
When state changes trigger a rebuild, existing results remain visible and usable until the new build completes, then are silently replaced.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts` (`createTierBuildKey`, tier-building `useEffect`, `getOrStartTierBuild`)
- `src/wizard/v8/step4Logic.ts` (`buildTiers`)

---

### PATENT 10 — _Fail-Soft Triple-Tier Location Resolution with Progressive Intel Reveal_

**Field:** Geographic data services; progressive web application UX  
**Filing type:** Utility patent

**Abstract:**  
A location input system that resolves a postal code through a three-tier fallback chain while simultaneously initiating three independent parallel geospatial data API calls, each of which populates the UI independently as it completes — creating a progressive reveal experience where no single API failure blocks the user.

**Novel Elements:**

**Three-Tier Fallback Resolution Chain:**

1. `zippopotam.us` (geocoder) → city + state + lat/lng
2. Local EIA utility rate table → state derived from rate data (no external call)
3. Identity fallback → ZIP used as location; wizard proceeds with full intel without a city name

Each tier is a _different data source type_ (external geocoder → local data table → identity), ensuring the chain never fails completely.

**Parallel Progressive Reveal:**

```
Promise.allSettled([fetchUtility, fetchSolar, fetchWeather])
→ Each resolves independently
→ Each dispatches PATCH_INTEL immediately on resolution
→ UI: 3 skeleton cards → each fills individually as API completes
→ Any failure → that card shows error state; other cards unaffected
```

**350ms Debounce on 5-Character Input:**  
ZIP code input is debounced at 350ms, normalized to digits-only, and clamped to 5 characters before triggering API calls. This prevents ~90% of intermediate API calls during fast typing.

**Fail-Soft Per-Service:**  
`Promise.allSettled()` (not `Promise.all()`) ensures one failed API call never blocks the other two. The wizard remains fully usable with partial intel.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts` (`resolveZip`, `loadLocationIntel`, `setLocationRaw`)

---

### PATENT 11 — _Confidence-Gated Wizard Step Elimination with Atomic Constraint Population_

**Field:** Multi-step form systems; business process automation  
**Filing type:** Utility patent — **CORE WIZARD CLAIM**

**Abstract:**  
A multi-step configuration wizard that evaluates a business name against a confidence-weighted classifier and, when confidence exceeds a threshold, simultaneously eliminates an intermediate step from the user's navigation path AND populates all downstream physics constraints in a single atomic transaction — preventing the null-state window that would otherwise exist between step elimination and constraint availability.

**The Two-Phase Dispatch Pattern:**

```
// Phase 1: Navigate (skip Step 2)
dispatch({ type: "CONFIRM_BUSINESS" })
// → reducer sets step: 1 → 3, sets industry slug

// Phase 2: Populate constraints (in same user action, same event loop tick)
if (confidence >= 0.75) {
  constraints = getFacilityConstraints(detectedSlug)
  dispatch({ type: "SET_INDUSTRY_META",
             solarPhysicalCapKW: constraints.totalRealisticSolarKW,
             criticalLoadPct: critInfo.percentage })
}
// → solarPhysicalCapKW is populated BEFORE Step 3 renders
// → without Phase 2: solarPhysicalCapKW = 0 → solar excluded from all tiers
```

**Client-Side Industry Classifier (`detectIndustryFromName`):**  
No backend call, no ML model. Pure regex-based keyword matching with:

- 30+ industry categories (hotel, car_wash, truck_stop, casino, data_center, hospital, restaurant, warehouse, etc.)
- Tiered confidence values: 0.70 (generic terms) → 0.85 (specialty terms) → 0.90–0.95 (brand names)
- Named entity recognition for major brands: Marriott/Hilton/Hyatt → `hotel: 0.90`; Love's/Pilot/Flying J → `truck_stop: 0.90`; Mister Car Wash/Take 5/Zips → `car_wash: 0.95`
- Sub-specialty detection: dental/orthodontics/PT/optometry → `hospital: 0.85`

**Confidence Threshold as Continuous Gate:**  
Not binary (detected/not detected) — confidence is a continuous value (0–1). The threshold (0.75) determines whether the step-skip path fires. Values below 0.75 always show Step 2 regardless of detection.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts` (`detectIndustryFromName`, `confirmBusiness`)
- `src/wizard/v8/wizardState.ts` (`CONFIRM_BUSINESS` reducer)

---

### PATENT 12 — _Equipment-Answer Selective Memoization for Reactive Energy Calculation_

**Field:** Web application state management; reactive computation  
**Filing type:** Utility patent

**Abstract:**  
A system that semantically partitions a heterogeneous set of user-provided answers into two classes — physics-affecting equipment parameters and intent/scope declarations — and triggers energy demand recalculation only when physics-affecting parameters change, preventing false recalculations from intent toggles.

**The Two Answer Classes:**

| Class             | Keys                                                                           | Effect on Calculation              |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| Physics-affecting | `washBays`, `squareFootage`, `numRooms`, `operatingHours`, etc.                | Triggers `calculateUseCasePower()` |
| Intent/scope      | `solarScope`, `generatorScope`, `evScope`, `step3_5Visited`, `carportInterest` | No effect on power calculation     |

**Selective Memoization Key:**

```typescript
powerAnswersKey = useMemo(
  () =>
    Object.entries(step3Answers)
      .filter(([k]) => !NON_POWER_ANSWER_KEYS.has(k)) // exclude intent keys
      .sort(([a], [b]) => a.localeCompare(b)) // deterministic order
      .map(([k, v]) => `${k}:${String(v)}`)
      .join("|"),
  [step3Answers]
);
```

**Two-Level Memoization:**

- `powerAnswersKey`: filters equipment subset → triggers `calculateUseCasePower()`
- `step3AnswersKey`: all answers → triggers tier cache invalidation

**Impact:**  
When user toggles "I want solar" (writes `solarScope: true`), `powerAnswersKey` does NOT change → no `calculateUseCasePower()` call → no false load recalculation. When user enters "number of wash bays: 4", `powerAnswersKey` changes → power recalculated → tier cache invalidated → new tiers begin building in background.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts` (`powerAnswersKey`, `step3AnswersKey`, `NON_POWER_ANSWER_KEYS`)

---

### PATENT 13 — _Measured-Area Solar Capacity Blending with Industry-Default Anchoring_

**Field:** Solar system sizing; building energy analysis  
**Filing type:** Utility patent

**Abstract:**  
A solar capacity sizing system that computes a physics-derived capacity from user-entered building area, blends it with an industry-standard static default, and pre-populates an estimated area from an industry-type lookup table before the user has entered any measurements.

**The Blend Formula:**

```
calculatedKW = round(usedArea × usableRoofPercent × 15 W/sqft / 1000)
newCap = round((calculatedKW + staticIndustryCap) / 2)
```

The weighted average prevents wild swings when users enter unusual area values. The industry static cap provides an authoritative upper anchor.

**Industry-Default Pre-Population (`INDUSTRY_ROOF_ESTIMATES`):**  
At business detection time — before the user enters Step 3 — an estimated `roofSpaceSqFt` is assigned based on facility type:

| Industry      | Estimated Roof (sqft) |
| ------------- | --------------------- |
| Car wash      | 5,000                 |
| Gas station   | 8,000                 |
| Restaurant    | 6,000                 |
| Retail        | 12,000                |
| Office        | 20,000                |
| Hotel         | 30,000                |
| Warehouse     | 50,000                |
| Manufacturing | 60,000                |
| Data center   | 40,000                |
| Hospital      | 50,000                |
| Airport       | 100,000               |

**Dual-Source Area Resolution:**

- Primary: explicit user-entered `roofArea` (sqft)
- Secondary: `totalSiteArea` (used when roofArea is absent)
- Tertiary: industry default estimate (pre-populated at business detection)

**No-Op Guard:**  
`if (newCap > 0 && newCap !== state.solarPhysicalCapKW)` — prevents reactive feedback loops where the same value repeatedly triggers the same update.

**Key Source Files:**

- `src/wizard/v8/useWizardV8.ts` (roofArea `useEffect`, `setBusiness` → `INDUSTRY_ROOF_ESTIMATES`)

---

### PATENT 14 — _Grid Reliability → Generator Auto-Enable via Unidirectional Reducer Recommendation_

**Field:** Energy system recommendation; state machine design  
**Filing type:** Utility patent

**Abstract:**  
A configuration system that automatically recommends and enables a backup generator when a user reports unreliable grid conditions, with the recommendation applied at the reducer level (not the UI level) to ensure persistence, and using a one-directional guard that prevents the recommendation from ever being revoked by a subsequent reliability input.

**The Mechanism:**

```typescript
case "SET_GRID_RELIABILITY": {
  const autoEnableGenerator =
    reliability === "unreliable" || reliability === "frequent-outages";
  return {
    ...state,
    gridReliability: reliability,
    wantsGenerator: autoEnableGenerator || state.wantsGenerator
    //              ↑ enables automatically  ↑ never disables manual selection
  };
}
```

**Reliability Threshold:**  
Four reliability categories: `reliable`, `occasional-outages`, `frequent-outages`, `unreliable`. Auto-enable fires only at the two worst categories — not at `occasional-outages`.

**One-Directional Enable Guard:**  
`autoEnableGenerator || state.wantsGenerator` — if the user has already manually enabled the generator, reporting "reliable" grid does NOT disable it. The recommendation is additive, never subtractive.

**Reducer-Level Application:**  
Unlike UI-level recommendations (tooltips, banners), this recommendation modifies the canonical state object directly — it persists through step navigation, state resets, and page refreshes.

**Key Source Files:**

- `src/wizard/v8/wizardState.ts` (`SET_GRID_RELIABILITY` reducer)

---

### PATENT 15 — _"Teach Through Revelation" Formally Encoded UX Architecture_

**Field:** Human-computer interaction; software UX systems  
**Filing type:** Utility patent + Design patent (for the visual implementation)

**Abstract:**  
A user interface architecture where UX design constraints are encoded as a typed, machine-readable constant object that enforces data-first presentation rules, maximum copy-block limits, reveal trigger events, and contextual advisor message templates on a per-step basis.

**`UX_POLICY` Constant (machine-readable design rules):**

```typescript
UX_POLICY = {
  step1: {
    maxCopyBlocks: 0, // hard limit: no non-data text
    revealTrigger: "validZip", // content appears on valid ZIP entry
    progressiveReveal: ["utility", "solar", "weather"], // ordered reveal
    advisorVoice: null, // data cards speak for themselves
  },
  step3: {
    maxCopyBlocks: 0,
    revealTrigger: "firstAnswer", // live power gauge activates on answer 1
    advisorVoice: "Your estimated peak: {peakLoadKW} kW", // live data token
  },
  step5: {
    maxCopyBlocks: 0,
    advisorVoice: "Recommended fits {percentOfFacilities}% of {industry}.",
  },
};
```

**Novel Elements:**

- `maxCopyBlocks`: an integer design constraint enforced at the code level (not a style guide recommendation)
- `revealTrigger`: machine-readable event name that controls when primary content appears (`validZip`, `firstAnswer`, `pageLoad`, `immediate`)
- `advisorVoice`: parameterized template with live data tokens — forces advisor messages to reference real user data, not generic copy
- `progressiveReveal`: an ordered array of UI panel identifiers that defines reveal sequence — not an animation config but a semantic ordering

**Key Source Files:**

- `src/wizard/v8/wizardState.ts` (`UX_POLICY`)

---

---

## Intelligence & Vendor Platform Patents

### PATENT 16 — _Multi-Source Energy Equipment Price Intelligence System_

**Field:** Market data aggregation; energy equipment pricing  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented system that continuously monitors heterogeneous public data sources — including RSS news feeds, government databases, manufacturer announcements, and data provider APIs — and applies a multi-layer parsing pipeline to extract, normalize, classify, and store structured equipment pricing data for battery energy storage systems, solar modules, wind turbines, generators, inverters, EV chargers, transformers, and related clean-energy equipment.

**Novel Elements:**

**Multi-Source Architecture:**

- Six source types: `rss_feed`, `api`, `web_scrape`, `data_provider`, `government`, `manufacturer`
- Each source carries a `reliability_score` (0–1) and configurable `scrape_config` (retry policy, CORS proxy, timeout)
- `ScrapeJob` schema with `schedule_cron`, `priority`, and `last_run_status` enables autonomous scheduled scraping

**Dual-Pattern Price Extraction per Equipment Class:**

- Every equipment category has two regex families: _unit price pattern_ (e.g., `$XXX/kWh`) and _narrative price pattern_ (e.g., "battery costs fell to $XXX per kWh"), increasing recall over single-pattern systems
- Equipment categories: `bess`, `solar`, `wind`, `generator`, `linear-generator`, `inverter`, `transformer`, `switchgear`, `ev-charger`, `bms`, `microgrid`, `hybrid-system`
- Price units normalized to `$/kWh`, `$/W`, `$/kW`, `$/unit`, `$/MW`

**Word-Boundary Content Classifier:**

- `classifyContent()` applies word-boundary regex matching (not substring matching) to avoid false positives (e.g., "BMS" in "submarines")
- Returns multi-label equipment array, multi-label topic array, and a float `relevanceScore` composited from per-match counts and per-topic weights
- 12 topic categories: pricing, projects, policy, tariffs, market-trends, technology, financing, manufacturing, grid, sustainability, performance, partnership

**Extracted Price Confidence:**

- Each `ExtractedPrice` carries equipment type, numeric value, unit, currency, context snippet, and `confidence` float (0–1)
- Manufacturer detection boosts confidence from `"medium"` to `"high"`

**Zero-Dependency Dual-Runtime Parser:**

- `marketDataParser.ts` has no imports (no browser APIs, no `import.meta.env`), making it safe to run identically in browser (Vite) and Node.js (GitHub Actions CI scripts)

**Key Source Files:**

- `src/services/marketDataParser.ts`
- `src/services/marketDataScraper.ts`
- `scripts/run-daily-scrape.ts`

---

### PATENT 17 — _Continuous RSS-to-ML Training Pipeline with Vendor-Submission Data Fusion_

**Field:** Machine learning data pipeline; pricing database construction  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented method that builds and continuously updates an AI/ML training database (`ai_training_data`) by ingesting two independent streams — (1) automatically scraped public RSS/news article pricing data and (2) approved vendor-submitted product pricing — and merging them into a unified schema with confidence scores, source provenance, and deduplication, so that downstream ML models and the quote engine consume a continuously self-improving pricing dataset without human curation.

**Novel Elements:**

**Dual-Stream Ingestion:**

- Stream A (Public): RSS articles → `extractPricingData()` / `extractConfigData()` / `extractMarketTrends()` → `ai_training_data` with `source: "rss_feed"` and confidence 0.5–0.9
- Stream B (Vendor): Admin-approved `vendor_products` records → `addVendorDataToMLTraining()` → `ai_training_data` with `source: "vendor_submission"` and confidence 0.9 (highest tier, because vendor pricing is verified first-party data)

**Approval Gate as Quality Filter:**

- Vendor data enters the pipeline only when `status = 'approved'` in the `vendor_products` table, preventing unapproved (potentially incorrect or strategic) pricing from corrupting the ML training set

**Idempotent Upsert with Provenance Key:**

- Deduplication key: `(data_type, product_type, manufacturer, model_name, source, vendor_id)` — prevents duplicate training rows while allowing price updates over time

**Three Data Type Schema:**

- `data_type: "pricing"` — price per unit with capacity and confidence
- `data_type: "configuration"` — product technical specs (chemistry, voltage, efficiency, warranty, cycle life) extracted via regex from article text
- `data_type: "market_trend"` — directional signals (price-decrease, price-increase, new-technology, market-growth, policy-change) with impact level and affected product list

**Confidence Cascade:**

- RSS high-confidence: manufacturer detected in article → 0.9
- RSS medium-confidence: price found but no manufacturer → 0.7
- RSS low-confidence: ambiguous extraction → 0.5
- Vendor submission: always 0.9 (admin-approved)

**Key Source Files:**

- `src/services/rssToAIDatabase.ts`
- `src/services/vendorDataToMLService.ts`
- `src/services/marketDataParser.ts`

---

### PATENT 18 — _Two-Dimensional Signal × Industry Confidence Engine for Energy Project Opportunity Detection_

**Field:** Sales intelligence; automated lead generation; NLP classification  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented method that continuously monitors public business news RSS feeds and classifies articles as commercial energy project leads using a two-dimensional scoring model: an independent `SIGNAL_KEYWORDS` axis (construction, expansion, new opening, funding, acquisition, sustainability, energy upgrade, facility upgrade) crossed with an `INDUSTRY_KEYWORDS` axis (data center, manufacturing, logistics, hospitality, healthcare, retail, education, automotive), computes a composite confidence score, and presents filtered ranked leads in a sales CRM dashboard.

**Novel Elements:**

**Two-Dimensional Keyword Classification:**

- Axis 1 (Signal): 8 signal categories, each with multi-keyword detection — signals represent _intent to purchase_ (construction = new facility needs power; energy_upgrade = active energy project)
- Axis 2 (Industry): 8 industry verticals — represents _commercial customer fit_ for BESS/solar systems
- Both axes are independently detected; any non-zero signal count qualifies the article for scoring

**Composite Confidence Formula:**

```
score = (base_confidence × 0.8) + (company_name_quality_score × 0.2)
```

Where `base_confidence` = industry_bonus + (signal_count × 15) + high_value_signal_bonus.  
The name quality weight prevents noise articles with strong signals but garbage company names from polluting the lead queue.

**High-Value Signal and Industry Bonuses:**

- High-value industries (data_center, manufacturing, logistics, healthcare): +30 points
- Other matched industry: +10 points
- Each signal: +15 points
- High-value signals (construction, new_opening, expansion, energy_upgrade): +20 points bonus

**Company Name Quality Gate:**

- `scoreCompanyName()` assigns a quality score (0–100) to extracted company names
- Leads with quality score < 50 are discarded before scoring, reducing API costs for downstream enrichment
- Name extracted via `extractCompanyFromTitle()` with fallback to first 2–3 title words

**Deduplication by URL:**

- `seenUrls` Set prevents the same news article from generating duplicate leads across multiple RSS sources

**Dashboard with Status CRM:**

- Opportunities stored in Supabase `opportunities` table with status: `new` → `contacted` → `converted` / `archived`
- Real-time filter by: status, minConfidence, industry, free-text search
- One-click status update with audit trail

**Key Source Files:**

- `src/services/opportunityScraperService.ts`
- `src/pages/OpportunitiesDashboard.tsx`
- `src/types/opportunity.ts`

---

### PATENT 19 — _Hybrid AI+Regex BESS Specification Extraction from Unstructured RFP Documents_

**Field:** Document understanding; energy procurement; AI extraction  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented method that accepts unstructured energy project documents (PDF, Excel, CSV, plain text) uploaded by procurement teams or commercial customers, parses them using a document-format-aware ingestion layer, then applies a dual-track extraction pipeline — (1) regex pattern matching as a fast, always-available baseline and (2) GPT-4 AI extraction as a high-accuracy overlay — merges the two outputs with AI preference when confidence thresholds are met, and produces a structured `ExtractedSpecs` object suitable for directly seeding a BESS configuration wizard.

**Novel Elements:**

**Format-Aware Ingestion Layer:**

- PDF: Raw byte array → text decode → readable-segment extraction (handles non-scanned PDFs); graceful partial-success when PDF contains scanned images
- Excel (.xlsx/.xls): `xlsx` library → per-sheet JSON extraction → structured `ParsedTable` objects + concatenated text for AI
- CSV: `PapaParse` → tabular data + text representation
- Each format produces a unified `ParsedDocument` with `textContent`, `tables[]`, `metadata`, and `status` (success/partial/failed)

**Dual-Track Extraction with Hybrid Merge:**

- Track 1 (Regex): `extractWithRegex()` — deterministic, zero-latency, no external dependency. Patterns for: MW/kW power, MWh/kWh energy, duration, state (all 50 states + DC by abbreviation and full name), ZIP code, industry keywords, solar/wind/generator sizing, grid connection type, budget amounts
- Track 2 (AI): `extractWithAI()` — GPT-4 structured JSON prompt, higher accuracy for narrative specs, handles ambiguous phrasing
- `mergeExtractions()` — AI fields take precedence when AI is available; regex fills gaps. Graceful fallback to regex-only when AI unavailable

**Duration Inference:**

- If explicit duration not found: `durationHours = energyMWh / storageSizeMW` — derived from power and energy specs

**Confidence and Warning System:**

- `confidence` score (0–100) on the `ExtractedSpecs` object
- `warnings[]` — human-readable issues (e.g., "AI extraction unavailable", "No power capacity found")
- `suggestions[]` — actionable remediation hints for the user

**Extraction Method Audit Trail:**

- `extractionMethod: "ai" | "regex" | "hybrid"` — enables downstream quality filtering

**Key Source Files:**

- `src/services/specExtractionService.ts`
- `src/services/documentParserService.ts`

---

### PATENT 20 — _ISO/RTO Ancillary Revenue Projection Engine with State-to-Market-Operator Mapping_

**Field:** Energy market revenue modeling; BESS monetization  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented method that, given a customer's state and BESS system parameters (kW / duration hours), maps the location to the appropriate ISO/RTO (CAISO, ERCOT, PJM, NYISO, ISO-NE, MISO), retrieves live market price data from a continuously-updated database, evaluates eligibility for all four ancillary service categories, and produces a total annual revenue projection including service-level breakdowns, requirement gap analysis, risk level, and market outlook narrative — enabling commercial customers to quantify the revenue value of their BESS investment before purchase.

**Novel Elements:**

**State-to-ISO Mapping (50 states + DC):**

- All 50 U.S. states and D.C. mapped to their primary ISO/RTO by both abbreviation and full name
- Handles multi-state ISOs (PJM covers 13 states + DC; MISO covers 15 states)
- Returns `null` for states without organized ISO markets (enabling graceful fallback)

**Per-Service Revenue Calculation:**

```
annualRevenue = systemSizeMW × pricePerMWYear × utilizationRate
```

- Eligibility gates: `systemSizeMW ≥ minPowerMW` AND `durationHours ≥ minDurationHours`
- `requirementGaps[]` — specific gap descriptions when eligibility not met
- `revenuePerKWYear` — normalized metric for cross-system comparison

**Four-Service Aggregation:**

- Simultaneous calculation across: `frequency_regulation`, `spinning_reserves`, `capacity`, `energy_arbitrage`
- `totalAnnualRevenue` = sum of all eligible service revenues
- `bestOpportunity` = highest-revenue eligible service

**Market Trend Risk Assessment:**

- Counts increasing vs. decreasing trend signals across service prices
- `riskLevel: "low" | "medium" | "high"` with narrative `marketOutlook` string

**Cross-ISO Revenue Comparison:**

- `compareISORevenue()` calculates and ranks all 6 ISOs by total revenue potential for a given system, enabling relocation or interconnection decisions

**15-Minute Cache:**

- All database queries cached with 15-minute TTL — market prices change infrequently but the dashboard may be rendered many times per session

**Key Source Files:**

- `src/services/isoMarketService.ts`
- Supabase table: `iso_market_prices`

---

### PATENT 21 — _Specialty-Gated Vendor Portal with RFQ Distribution and Bidirectional ML Feedback Loop_

**Field:** B2B marketplace; vendor management; ML data acquisition  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented multi-sided marketplace system in which energy equipment vendors self-register with a declared specialty (battery, inverter, EMS, BOS, EPC, integrator), pass through an admin approval gate, submit product pricing and specifications, receive open Requests for Quotes (RFQs) matched to their specialty, and in which every admin-approved vendor product is simultaneously propagated to (a) the live equipment pricing table used by the customer-facing quote engine and (b) the AI/ML training database — creating a bidirectional feedback loop where vendor supply-side data continuously improves quote accuracy.

**Novel Elements:**

**Specialty-Declared Registration:**

- Vendors declare specialty at registration: `battery | inverter | ems | bos | epc | integrator`
- Specialty gates which RFQs appear in the vendor's portal (only relevant project types surfaced)
- Status lifecycle: `pending` → `approved` (admin gate, no auto-approval)

**Dual-Destination Approved Product Sync:**

- On approval, `syncApprovedVendorProducts()` writes to `equipment_pricing` table (live quote engine source)
- Simultaneously, `addVendorDataToMLTraining()` writes to `ai_training_data` table (ML pipeline)
- The two writes are independent — failure of one does not block the other
- Confidence score of 0.9 is assigned to all vendor submissions (highest tier, reflecting human-approved provenance)

**Idempotent Price Updates:**

- Existing `equipment_pricing` records are updated, not duplicated, when a vendor revises pricing
- Deduplication key: `(vendor_id, manufacturer, model, equipment_type)`

**RFQ Lifecycle Display:**

- `VendorRFQsTab` shows open RFQs with system size (MW × duration = MWh), location, due date
- Vendors submit proposals or request details from the portal

**Vendor Build-Quote Integration:**

- `VendorBuildQuoteTab` allows vendors to generate a full quote using the same Merlin TrueQuote engine — vendors become first-class consumers of the same quoting infrastructure

**Admin Oversight Dashboard:**

- `VendorAdminDashboard` provides full visibility into pending/approved/rejected vendors and products

**Key Source Files:**

- `src/services/vendorService.ts`
- `src/services/vendorPricingIntegrationService.ts`
- `src/services/vendorDataToMLService.ts`
- `src/components/vendor/tabs/VendorRFQsTab.tsx`
- `src/components/vendor/tabs/VendorSubmitPricingTab.tsx`
- `src/pages/admin/VendorAdminDashboard.tsx`

---

### PATENT 22 — _Usage-Gated Market Intelligence Dashboard with Multi-Chemistry Battery Degradation Comparison_

**Field:** SaaS tiered access control; energy market analytics  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented market intelligence platform that aggregates live energy equipment price trends derived from the RSS-to-AI pipeline, utility rate benchmarks by region, IRA 2022 Investment Tax Credit scenario calculations, and multi-chemistry battery degradation curves, and gates access to report generation by subscription tier using a usage-credit model — where lower tiers receive a teaser preview with blurred paywall and higher tiers receive unlimited access — creating a monetized, continuously self-refreshing market intelligence product.

**Novel Elements:**

**Four-Panel Intelligence Aggregation:**

- Panel 1 (Price Trends): Live equipment price trends (BESS $/kWh, Solar $/W, Inverter $/kW, Generator $/kW, EV Charger $/unit) with 30-day change delta, data point count, and source citations — fed by `marketDataIntegrationService`
- Panel 2 (Utility Rates): Regional utility rate benchmarks by ZIP code — fed by `utilityRateService`
- Panel 3 (ITC Scenarios): IRA 2022 ITC scenario modeling at multiple rate assumptions — fed by `itcCalculator`
- Panel 4 (Degradation): Side-by-side multi-chemistry battery degradation curves (LFP, NMC, NCA, Flow VRB, Sodium-Ion) with annual capacity retention — fed by `batteryDegradationService`

**Tier-Gated Usage Credit System:**

- Guest/Builder: 1–2 market reports per month (teaser; remaining panels blurred behind paywall overlay)
- Pro: 10 market reports per month
- Advanced/Business: Unlimited
- `canRunMarketReport()` and `gatedMarketReport()` enforce limits before API calls are made, preventing cost overrun

**Blurred Paywall UI Pattern:**

- Panels beyond the tier limit render with CSS blur + lock icon + upgrade CTA — allowing users to perceive value without full access (conversion optimization pattern)

**Feature Availability API:**

- `getFeatureAvailability()` returns a structured object indicating which features are accessible at the current tier, enabling conditional rendering without hardcoded tier checks throughout the component

**Key Source Files:**

- `src/pages/MarketIntelligencePage.tsx`
- `src/services/marketDataIntegrationService.ts`
- `src/services/featureGate.ts`
- `src/services/subscriptionService.ts`
- `src/services/batteryDegradationService.ts`
- `src/services/itcCalculator.ts`

---

## Pricing & Intelligence Architecture Patents

### PATENT 23 — _Baseline-Relative Energy Price Alert Classification with Context-Inferred Tier Selection and Project Cost Decomposition_

**Field:** Energy market intelligence; automated deal detection  
**Filing type:** Utility patent

**Abstract:**  
A computer-implemented system that monitors unstructured news articles and market publications, extracts energy equipment pricing data using three distinct regex patterns (including a project-level cost decomposition method), infers the appropriate sector baseline tier from contextual keywords, classifies the extracted price against the baseline into one of five alert levels, and stores the resulting alert with full provenance metadata.

**Novel Elements:**

**Three-Pattern Price Extraction:**

- Pattern 1: Direct unit price — `$X/kWh` or `$X per kWh` with multiplier normalization
- Pattern 2: MWh price with scale normalization — `$X per MWh` (supports k/M/billion multipliers)
- Pattern 3: **Project cost decomposition** — `"$X million for Y MW / Z MWh"` → infers implied $/kWh by dividing total project cost by energy capacity. No prior system applies this decomposition to derive equipment unit prices from project announcements.

**Context-Inferred Baseline Selection:**  
Instead of a flat market baseline, the system reads the article text for sector indicator keywords:

- `"utility"` / `"MW"` / `"grid-scale"` → selects `battery_kwh_utility = $115/kWh` baseline
- `"C&I"` / `"commercial"` / `"industrial"` → selects `battery_kwh_commercial = $130/kWh`
- `"residential"` / `"home"` / `"behind-the-meter"` → selects `battery_kwh_residential = $150/kWh`
  Default: utility baseline. The tier selection is derived from article language, not a user input.

**Five-Tier Deal Classification:**

- `excellent_deal`: price ≤ −20% vs. baseline
- `good_deal`: price ≤ −10% vs. baseline
- `info`: price ≤ −5% vs. baseline (market intelligence only)
- `warning`: price ≥ +10% vs. baseline (cost increase signal)
- `critical`: price ≥ +20% vs. baseline (supply chain alert)

**Multi-Factor Relevance Scoring:**  
50 base + up to +20 (direct $/kWh mention) + +10 (pricing/cost keyword) + +15 (vendor name match) + +10 (MW-scale mention) + +15/+10/+5 (recency: <7 days / <30 days / <90 days) = 0–120 relevance score.

**Provenance Storage (`energy_price_alerts` table):**  
Every alert stored with: `alert_type`, `alert_level`, `price_value`, `price_unit`, `project_size_mw`, `vendor_company`, `source_title`, `deal_summary`, `market_impact`, `price_trend`, `relevance_score`, `industry_sector`, `technology_type`, `baseline_price`, `price_difference_percent`, `is_below_market`, `verified`.

**Key Source Files:**

- `src/services/priceAlertService.ts` (`BASELINE_PRICES`, `extractPricingFromArticle`, `determineBaselinePrice`, `determineAlertLevel`, `calculateRelevanceScore`)

---

### PATENT 24 — _Self-Healing Wizard AI Agent with Typed Auto-Fix, localStorage Runtime Gate Relaxation, and Cascading Admin Escalation_

**Field:** Web application reliability; autonomous fault management  
**Filing type:** Utility patent

**Abstract:**  
A continuous monitoring agent that runs inside a multi-step web application wizard, classifies detected issues into seven typed categories with auto-fix eligibility flags, applies runtime fixes for eligible issue types (including dynamically relaxing wizard gate validation thresholds via browser localStorage with timed expiry), and escalates non-auto-fixable issues to administrators via email and Slack webhook — with deduplication of admin alerts within a 5-minute window and automatic pruning of alerts older than 1 hour.

**Novel Elements:**

**Seven Typed Issue Categories with Auto-Fix Eligibility:**

| Type              | Auto-Fix                  | Description                                          |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| `dual_validation` | ❌ (requires code change) | Multiple gate validation systems disagree            |
| `bottleneck`      | ✅                        | Step exit rate / gate failure rate exceeds threshold |
| `broken_gate`     | ❌                        | Gate logic produces contradictory results            |
| `error_spike`     | ❌                        | Error count spike in rolling window                  |
| `api_failure`     | ✅                        | Backend API endpoints unreachable                    |
| `database_error`  | ❌                        | DB connection / query failures                       |
| `network_timeout` | ❌                        | Request timeout spike                                |

**localStorage-Based Runtime Gate Relaxation:**  
For `bottleneck` issues, the auto-fix writes to browser localStorage:

```
wizardRelaxedGates = "true"
wizardRelaxedGatesExpiry = timestamp + 600000ms  // 10-minute self-expiry
wizardRelaxedGatesReason = issue.description
```

The wizard state machine reads this flag on each step evaluation and temporarily reduces gate thresholds. The fix has a built-in 10-minute expiry — it cannot persist indefinitely.

**API Retry Auto-Fix with Configurable Backoff:**  
For `api_failure` issues, the auto-fix writes:

```
wizardAPIRetryEnabled = "true"
wizardAPIRetryMaxAttempts = "3"
```

**Location Step Special-Casing:**  
The location step uses tighter alert thresholds (20% exit rate → alert vs. 50% for other steps; 15% gate failure rate → alert vs. 30% for other steps), because location resolution failure is a hard dependency for all downstream calculations.

**Cascading Admin Escalation:**  
Issues with `requiresAdmin: true` generate `AdminAlert` objects delivered via:

1. Browser console (always)
2. Email (via `/api/admin/send-alert` in production, `mailto:` link in development)
3. Slack webhook (if `ADMIN_CONFIG.slackWebhook` is set)

**5-Minute Deduplication Window:**  
Admin alerts within the same `category` within 300,000 ms are deduplicated — only the first fires. Alerts older than 3,600,000 ms are pruned automatically.

**Key Source Files:**

- `src/services/wizardAIAgentV2.ts` (`WizardAIAgent`, `attemptAutoFix`, `relaxGateValidation`, `enableAPIRetry`, `notifyAdmin`)

---

### PATENT 25 — _Five-Priority Equipment Pricing Waterfall with Market-Confidence-Blended Override and Scale-Tier Segmentation_

**Field:** Commercial pricing systems; energy equipment cost estimation  
**Filing type:** Utility patent

**Abstract:**  
A pricing service that resolves the unit cost of energy equipment by traversing a five-priority ordered data source hierarchy, where each level is attempted in sequence and the first non-null result terminates the search. For battery storage specifically, the third priority incorporates a market-data blend function that uses a 70%/30% market-to-default weight when ≥10 market data points exist, or a 50%/50% blend below that threshold. Solar pricing uniquely applies a scale-based segmentation (commercial < 5 MW vs. utility ≥ 5 MW) at all priority levels.

**The Five-Priority Waterfall (for battery pricing):**

| Priority | Source                                                                                                                                        | Fallback Condition                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1        | `vendorPricingService.getVendorPricing()` — approved vendor products                                                                          | No approved vendor pricing active                 |
| 2        | `calculationConstantsService.getConstant()` — admin-configurable DB constants, size-tiered (small < 1 MWh / medium 1–10 MWh / large ≥ 10 MWh) | Constant not set in DB                            |
| 3        | `equipment_pricing` table (vendor-specific, synced from supply chain)                                                                         | No active equipment_pricing rows                  |
| 4        | `marketDataIntegrationService.getMarketAdjustedPrice()` — market-intelligence-blended price                                                   | Market data confidence too low or < 3 data points |
| 5        | NREL ATB 2024/2025 hardcoded baseline                                                                                                         | Always succeeds                                   |

**Market Intelligence Blend Function:**

```
if (priceDiff > 30%) and (dataPoints >= 10):
  blendedPrice = marketAvg × 0.7 + defaultPrice × 0.3
elif (priceDiff > 30%) and (dataPoints < 10):
  blendedPrice = marketAvg × 0.5 + defaultPrice × 0.5
else:
  blendedPrice = marketAvg  // fully aligned with market
```

**Scale-Tier Segmentation (solar):**  
Solar pricing fetches from `pricing_configurations.solar_default` and returns:

- `< 5 MW`: `commercial_per_watt` (default $0.85/W)
- `≥ 5 MW`: `utility_scale_per_watt` (default $0.65/W)
  The MW parameter bypasses the shared pricing cache and always fetches fresh to ensure correct tier selection.

**Scale-Adjusted Vendor Pricing (battery):**  
When vendor pricing is used at Priority 1, additional scale adjustments are applied:

- `≥ 100 MWh` (utility-scale) → `× 0.85` (15% quantity discount)
- `< 20 MWh` (small commercial) → `× 1.30` (30% small-system premium)

**Key Source Files:**

- `src/services/unifiedPricingService.ts` (`fetchBatteryPricingFromDB`, `fetchSolarPricingFromDB`, `getBatteryPricing`, `getSolarPricing`)
- `src/services/marketDataIntegrationService.ts` (`getMarketAdjustedPrice`)

---

### PATENT 26 — _Database-Driven Market Price Arbitration with Dual-Source Merge, Statistical Confidence Weighting, and DB-Level RPC Aggregation_

**Field:** Market data systems; statistical price arbitration  
**Filing type:** Utility patent

**Abstract:**  
A market price computation system that merges data from two heterogeneous database tables (a continuously-updated scraped price table and a legacy manual-entry table), applies per-record confidence-and-recency weighting to compute a statistical price summary, filters records that would distort regional price signals (specifically, low-price records from China/CNY currency sources below a geographic price floor), and optionally delegates the entire statistical aggregation to a database-level stored procedure (`calculate_weighted_price()`) parameterized by equipment type, region, capacity, and technology.

**Novel Elements:**

**Dual-Source Merge with Priority:**

- Source 1: `collected_market_prices` — continuously updated by the real-time scraper pipeline; mapped at high-confidence
- Source 2: `market_pricing_data` — legacy seed data and manual entries; mapped at lower-confidence
  Both sources contribute to the same statistical computation; Source 1 records receive higher weight.

**China/CNY Price Exclusion Filter:**

```typescript
// For BESS, exclude China-origin prices that skew North American averages:
if (equipmentType === 'bess' && row.currency === 'CNY') skip;
if (equipmentType === 'bess' && row.region matches /china|cn|asia/i && row.price_per_unit < 80) skip;
```

This prevents cell-level Chinese factory prices (not installed-system prices) from artificially depressing the North American market average.

**Combined Confidence × Recency Weight:**

```
weight(record) = confidence_weight × recency_weight
  where confidence_weight = 1.0 (high) | 0.7 (medium) | 0.4 (low)
  and   recency_weight = max(0.3, 1 − daysSince / 90)  // linear decay to floor at 0.3
```

**Statistics Suite:**  
For each equipment type + region: weighted average, min, max, median, data point count, 30-day rolling change percentage, and unique source list.

**`PricingPolicy` Interface (DB-Configurable):**  
Each equipment type can have a `pricing_policies` DB record defining:

- `source_weights`: per-source trust weight
- `frequency_weights`: by data source type (scraped/manual/provider)
- `reliability_multiplier`: global multiplier on reliability scores
- `age_decay_factor`: controls steepness of recency decay
- `industry_floor` / `industry_ceiling`: absolute price bounds
- `industry_guidance_weight`: how much industry guidance anchors the average
- `outlier_std_threshold`: records beyond N standard deviations are excluded
- `min_data_points`: minimum records required before market override is used
- `regional_multipliers`: per-region adjustment factors

**DB-Level RPC Aggregation:**  
`supabase.rpc("calculate_weighted_price", { p_equipment_type, p_region, p_capacity_mw, p_technology })` — pushes statistical computation to the database, returning `{ weighted_price, sample_count, confidence, floor_price, ceiling_price, price_range_low, price_range_high }`.

**Key Source Files:**

- `src/services/marketDataIntegrationService.ts` (`getMarketPrices`, `getMarketPriceSummary`, `getMarketAdjustedPrice`, `getPricingPolicies`, `calculateWeightedPrice`)

---

### PATENT 27 — _Dual-Pipeline Intelligence Architecture with Equipment-Category-Filtered RSS Routing to Parallel AI-Training and Deal-Alert Destinations_

**Field:** Market intelligence systems; automated data pipeline architecture  
**Filing type:** Utility patent — **CORE WIRING CLAIM**

**Abstract:**  
A market intelligence architecture where a single scheduled RSS fetch pipeline simultaneously routes each ingested article to two separate downstream consumers — an AI training database (for long-term ML model improvement) and a real-time price alert engine (for immediate deal detection) — with article routing filtered by equipment category before fetch, and both pipelines fed by a single source resolution that prioritizes a database-configured source list over a hardcoded fallback list.

**The Dual-Destination Wiring (the core novel claim):**

```
rssAutoFetchService.scheduleRSSFetching()
  │
  ├──→ processBatchForAI()  →  rssToAIDatabase.ts
  │         └──→ ai_training_data table (ML training corpus)
  │         └──→ scraped_articles table (market signal store)
  │              └──→ mlProcessingService (price trend forecasting)
  │              └──→ marketInferenceEngine (BESS config pattern detection)
  │                        └──→ pricingUpdateRecommendations → unifiedPricingService
  │
  └──→ processNewsForPriceAlerts()  →  priceAlertService.ts
            └──→ extractPricingFromArticle() [3-pattern extraction]
            └──→ determineBaselinePrice() [context-inferred sector tier]
            └──→ determineAlertLevel() [5-tier classification]
            └──→ energy_price_alerts table
```

**Single-Fetch, Dual-Dispatch Architecture:**  
Each RSS fetch event triggers BOTH destinations with a single HTTP call per source. The article object traverses both pipelines; neither pipeline modifies the shared article object.

**Equipment-Category-Filtered Fetch (`fetchRSSFeedsForEquipment`):**  
Sources are tagged with `equipment_categories[]` in the database. Fetching for `"bess"` returns only sources whose categories include `"bess"` or `"all"`. This ensures ML training data and price alerts are equipment-category-specific, not generic.

**DB-First, Hardcoded-Fallback Source Resolution:**

```
getRSSSources():
  1. Query market_data_sources WHERE is_active = true (DB-driven)
  2. If DB query fails or returns 0 rows → fall back to hardcoded RSS_SOURCES[]
```

The hardcoded list is a safety net — operational source management is DB-driven.

**Health Check per Source (`checkRSSFeedHealth`):**  
Each source produces a `{ sourceId, status: "ok"|"error", articlesFound, error? }` record on each health check cycle. This enables per-source reliability tracking independent of the `reliability_score` field.

**Downstream Pricing Feedback Loop:**  
The ML pipeline (via `marketInferenceEngine`) can produce `PricingUpdateRecommendation[]` objects that flow back to `unifiedPricingService` — closing an end-to-end feedback loop from scraped article → pricing recommendation → quote engine.

**Key Source Files:**

- `src/services/rssAutoFetchService.ts` (`scheduleRSSFetching`, `fetchRSSFeedsForEquipment`, `getRSSSources`, `checkRSSFeedHealth`)
- `src/services/priceAlertService.ts` (`processNewsForPriceAlerts`)
- `src/services/rssToAIDatabase.ts` (`processBatchForAI`)
- `src/services/mlProcessingService.ts`
- `src/services/marketInferenceEngine.ts`

---

### PATENT 28 — _Forbidden UI Computation Enforcement Architecture with Compile-Time Method Injection_

**Field:** Software architecture; pricing integrity enforcement  
**Filing type:** Utility patent

**Abstract:**  
A commercial pricing system that enforces a strict separation between base-cost computation (performed in the server-side pricing engine) and customer-visible sell-price computation (also performed server-side) by embedding "forbidden method" functions directly on the result object returned to the UI layer — functions that throw runtime exceptions if called, making it structurally impossible for UI code to compute margin or net cost independently.

**The Forbidden Method Pattern:**

```typescript
// Attached to every MarginRenderEnvelope (result object)
_FORBIDDEN_computeMarginInUI: () => {
  throw new Error("UI must not compute margin");
},
_FORBIDDEN_computeNetCostInUI: () => {
  throw new Error("UI must not compute net cost");
}
```

**Why This Is Novel:**
Standard approaches use comments, code review, or style guides to prevent UI margin computation. This system makes the anti-pattern **architecturally impossible** — the runtime exception fires before any incorrect computation could produce a result. The result object itself enforces the constraint.

**Audit Integrity Consequence:**  
Because the UI cannot compute margin or net cost, every sell price in the customer-facing quote is guaranteed to have been produced by the `marginPolicyEngine` with full `ClampEvent[]` and `ReviewEvent[]` audit trail. Price drift detection is always possible because the separation is structurally enforced.

**Propagation Through Tiers:**  
The `MarginRenderEnvelope` (containing the forbidden methods) is attached to each of the three TrueQuote option tiers (`starter.marginRender`, `perfectFit.marginRender`, `beastMode.marginRender`) — all three tiers carry the enforcement.

**Complementary `_FORBIDDEN` field convention:**  
The underscore prefix + all-caps `_FORBIDDEN_` naming convention is a machine-readable marker (not just a style convention) — it enables static analysis tooling to detect any call site where these methods are invoked, providing both runtime and static enforcement.

**Key Source Files:**

- `src/services/marginPolicyEngine.ts` (`MarginRenderEnvelope` type)
- `src/services/TrueQuoteEngineV2.ts` (fallback margin render assignment)
- `src/services/marginRenderEnvelopeAdapter.ts`

---

### PATENT 29 — _Vertical SMB Energy Platform with DB-Driven White-Label Site Configuration and Per-Industry Power Profiles_

**Field:** SaaS platform architecture; energy system configuration for SMBs  
**Filing type:** Utility patent

**Abstract:**  
A software-as-a-service platform architecture that powers multiple distinct white-label energy advisory websites (each with its own domain, color scheme, and feature set) from a single shared backend, where the configuration for each site — including which energy technologies to show, the industry-specific power demand profile, and all calculation constants — is stored in a database and fetched at runtime, enabling new vertical deployments without code changes.

**Novel Elements:**

**`SMBSiteConfig` (DB-Driven White-Label Record):**  
Each vertical site is described by a runtime-fetched record containing:

- `slug`, `domain`, `name`, `tagline`, `primaryColor`, `secondaryColor`, `logoUrl`
- `industryCategory`, `useCaseSlug`
- `features: { showSolar, showWind, showGenerator, showEV, showFinancing, showMarketIntelligence }` — boolean feature flags that control which energy technology products are visible in the UI

**`IndustryPowerProfile` (Per-Industry Physics Baseline):**  
Each supported vertical has a typed power profile:

- `typicalPeakDemandKw`: baseline peak load for this facility type
- `typicalMonthlyKwh`: monthly energy consumption
- `recommendedBatteryKwhPerUnit`: BESS sizing per "unit" (wash bay, hotel room, restaurant seat, etc.)
- `recommendedSolarKwPerUnit`: solar sizing per unit
- `unitName`/`unitPlural`: the business-specific unit (e.g., "wash bay" / "wash bays")
- `typicalPaybackYears`: expected payback for this vertical

**Zero-Code Deployment Principle:**  
New vertical sites (e.g., `coldstorage.energy`, `airportenergy.com`) are deployed by inserting a new `SMBSiteConfig` row and `IndustryPowerProfile` row in the database — no new code is deployed. Feature flags control product visibility per vertical.

**Geographic Intelligence Integration:**  
Each SMB site query calls `getGeographicRecommendations(zipCode)` from `geographicIntelligenceService` to derive location-specific electricity rates, solar potential, and technology recommendations — the same geographic engine as the main platform, reused at zero marginal cost per vertical.

**`CalculationConstants` from DB (No Deploy Needed):**  
`batteryCostPerKwhSmall`, `solarCostPerWatt`, `inverterCostPerKw`, `federalItcRate`, `discountRate`, `batteryDegradationRate`, `electricityEscalationRate`, `peakShavingTargetPercent`, `backupHoursMinimum` — all fetched from Supabase, allowing admin-driven constant updates without code deployment.

**Key Source Files:**

- `src/services/smbPlatformService.ts` (`SMBSiteConfig`, `IndustryPowerProfile`, `CalculationConstants`)
- `src/services/geographicIntelligenceService.ts` (`getGeographicRecommendations`)

---

## Trade Secrets

_These are better protected under the Defend Trade Secrets Act (DTSA) than patents. Do NOT include specific values in patent filings._

| Secret                                     | Description                                                                                                                                                                                                                                                   | Why Trade Secret                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Industry facility constraint database**  | Specific `totalRealisticSolarKW`, `usableRoofPercent`, `criticalLoadPct` values per industry slug                                                                                                                                                             | Proprietary calibrated dataset — disclosing values enables direct replication                                                            |
| **Margin band configuration**              | Specific margin percentages per product class and deal size band                                                                                                                                                                                              | Core commercial confidentiality                                                                                                          |
| **Keyword confidence weights**             | Numeric confidence weights for each keyword-to-industry mapping                                                                                                                                                                                               | Specific thresholds enable classifier replication                                                                                        |
| **MagicFit BESS upsize ratios**            | The specific 1.15/1.25/1.35/1.5/1.65 upsize multipliers and 1.5/2.0 duration multipliers                                                                                                                                                                      | The exact values are the IP — the concept can be disclosed, the numbers cannot                                                           |
| **Market inference correlation scores**    | Correlation scores between customer decision indicators and BESS adoption                                                                                                                                                                                     | Derived from proprietary customer data                                                                                                   |
| **Brand name keyword lists**               | Full lists of brand names mapped to industry slugs with confidence values                                                                                                                                                                                     | Enables direct classifier replication                                                                                                    |
| **ReviewEvent thresholds**                 | Specific price review thresholds per product class                                                                                                                                                                                                            | Core to pricing integrity                                                                                                                |
| **RSS source reliability scores**          | Calibrated `reliability_score` values for each market data source and the scrape configuration parameters (retry policy, CORS proxy, timeout)                                                                                                                 | Reflects operational experience — replicating these exactly requires running the scraper                                                 |
| **Opportunity signal weighting formula**   | The specific numeric constants in `calculateConfidence()` (30 points for high-value industry, 15 per signal, 20 for high-value signal bonus) and the 0.8/0.2 weighting between base confidence and company name quality                                       | Specific weights are calibrated to minimize false positives in the BESS sales context                                                    |
| **ISO market price database**              | The specific `price_per_mw_year`, `utilization_rate`, and `typical_capacity_factor` values per ISO/service type in `iso_market_prices`                                                                                                                        | Derived from proprietary analysis of CAISO OASIS, ERCOT, PJM, NYISO, ISO-NE, MISO — competitive advantage in revenue projection accuracy |
| **Vendor specialty-to-RFQ matching rules** | The logic that routes RFQs to vendors by specialty and the criteria for admin approval decisions                                                                                                                                                              | Core marketplace operations — disclosing criteria enables gaming of the approval process                                                 |
| **China/CNY price exclusion thresholds**   | The specific `price_per_unit < 80` floor and `region` regex patterns used to exclude China-origin cell prices from North American market averages                                                                                                             | Specific thresholds reflect calibration to North American installed-system prices; disclosing enables adversarial price injection        |
| **Procurement buffer trigger prices**      | The specific `procurementBufferTrigger` values per product class (e.g., $110/kWh for BESS, $0.70/W for solar) and the `procurementBufferPct` (15% for BESS, 10% for solar)                                                                                    | These values are calibrated to real procurement experience; disclosing enables competitors to replicate the anti-fantasy pricing layer   |
| **MagicFit BESS upsize ratios (v1.1.1)**   | The specific Starter/PerfectFit/BeastMode upsize multipliers for each of the 4 generation scenarios: fullGeneration (1.0/1.0/1.0), solarOnly (1.15/1.25/1.35), generatorOnly (1.0/1.1/1.2), upsMode (1.5/1.75/2.0) and duration multipliers (1.0/1.5/1.0/2.0) | The exact ratios reflect operational calibration of system independence vs. cost — disclosing enables direct replication                 |
| **Goal-adjustment scale increments**       | The specific ±0.05/0.10/0.15/0.25 scale adjustments per goal type (backup_power/grid_independence/reduce_costs/sustainability) in MagicFit                                                                                                                    | Specific increments are calibrated to produce commercially viable quote spreads                                                          |
| **Pricing waterfall blend thresholds**     | The specific 70%/30% vs 50%/50% market-to-default blend ratios and the ≥10 / <10 data-point threshold that selects between them in `getMarketAdjustedPrice()`                                                                                                 | Specific values reflect calibration to reduce price volatility; disclosing enables adversarial market data injection                     |
| **SMB industry power profile constants**   | `recommendedBatteryKwhPerUnit`, `recommendedSolarKwPerUnit`, `typicalPaybackYears` per vertical (car wash, laundromat, restaurant, cold storage, etc.)                                                                                                        | Derived from proprietary installation and quote data; enables direct replication of per-vertical sizing recommendations                  |
| **Rate of decay in relevance scoring**     | The specific recency weight breakpoints (+15 for <7 days, +10 for <30 days, +5 for <90 days) and vendor bonus (+15) in `calculateRelevanceScore()`                                                                                                            | Specific weights calibrated to surface actionable deals vs. noise in the energy storage market                                           |

---

## Trademarks

_File on USPTO Principal Register (TEAS Plus application, ~$250/class). Commercial use in interstate commerce as of March 23, 2026._

| Mark                          | USPTO Class                                        | Use Evidence                             | Risk Assessment                            |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| **MERLIN** (word mark)        | IC 042 (Software as a service — energy consulting) | Live at merlinenergy.net                 | ⚠️ Search recommended — "Merlin" is common |
| **TRUEQUOTE™**                | IC 042                                             | Used throughout product UI and marketing | 🟢 Strong — coined term, distinctive       |
| **MAGICFIT™**                 | IC 042                                             | Used in product UI (Step 4 branding)     | 🟢 Strong — coined term                    |
| **MERLIN ENERGY** (word mark) | IC 042                                             | Domain, social profiles, product         | 🟡 Moderate — composite mark               |
| **BEAST MODE**                | IC 042                                             | Used as a tier label                     | 🔴 Weak — descriptive/common phrase        |

---

## Copyrights

_Registration strengthens enforcement. File with U.S. Copyright Office (Form TX, ~$65/group). Automatic protection exists but registration is required for statutory damages._

**Register the following as a compilation group (Form TX — "group of works"):**

| Work                                         | Description                                                                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/` directory                    | Entire service layer — 100+ TypeScript service files as a compilation of literary works                                                 |
| `src/wizard/v8/` directory                   | Wizard state machine, synthesis engine, and step components                                                                             |
| `src/services/benchmarkSources.ts`           | The authoritative source registry as a creative compilation                                                                             |
| Inline architecture documentation            | The TrueQuote Engine docblock headers and wizard architecture comments — these are copyrightable creative works independent of the code |
| `src/wizard/v8/wizardState.ts` (`UX_POLICY`) | The UX policy object as a creative design expression                                                                                    |

---

## Filing Priority & Roadmap

### 🔴 Immediate (File within 30 days)

| Action                                                        | Cost                 | Rationale                                                                                                                                            |
| ------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provisional patent (Patents 1 + 9 + 11 as unified system)     | ~$320 (small entity) | 12-month priority date placeholder; merlin2 is live in commerce as of today (March 23, 2026). AIA grace period: 1 year from first public disclosure. |
| TRUEQUOTE™ trademark (TEAS Plus)                              | ~$250                | Already in active commercial use — this is the easiest strong mark to register                                                                       |
| Provisional patent (Patent 18 — Opportunity Detection Engine) | ~$320                | Opportunity scraper is operationally live and publicly detectable — file now to establish priority                                                   |

### 🟡 60–90 Days

| Action                                                                                       | Cost  | Rationale                                                                                                                       |
| -------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| Provisional patent (Patents 2 + 3 + 4 — MagicFit + TrueQuote™ Compliance + Margin Engine)    | ~$320 | Second provisional covering the commercial/pricing layer                                                                        |
| MAGICFIT™ trademark                                                                          | ~$250 | Strong coined mark, actively used                                                                                               |
| Copyright registration (service layer compilation)                                           | ~$65  | Low cost, significant litigation value                                                                                          |
| Provisional patent (Patents 16 + 17 — Price Intelligence + RSS-to-ML Pipeline)               | ~$320 | Market data pipeline is a unique asset — covers scraper + ML fusion architecture together                                       |
| Provisional patent (Patent 21 — Vendor Portal + ML Feedback Loop)                            | ~$320 | Vendor portal is live; the dual-destination approved-product sync is novel                                                      |
| **Provisional patent (Patents 23 + 27 — Price Alert Classification + Dual-Pipeline Wiring)** | ~$320 | The dual-pipeline RSS wiring is the most defensible new "wiring" patent — file before any public discussion of the architecture |

### 🟢 6 Months

| Action                                                                                   | Cost                      | Rationale                                                                                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Full utility application — Patents 1, 9, 11 (combined system)                            | ~$8,000–15,000 (attorney) | Convert provisionals to full utility apps                                                                                 |
| Provisional patent (Patents 5 + 6 — 8760 + Monte Carlo)                                  | ~$320                     | Technical differentiation in financial modeling                                                                           |
| Full utility — TRUEQUOTE™                                                                | ~$3,000–5,000 (attorney)  | Full prosecution                                                                                                          |
| Trade secret program documentation                                                       | ~$2,000–5,000 (attorney)  | Formal DTSA protection requires documented secrecy measures                                                               |
| Provisional patent (Patents 19 + 20 — Hybrid RFP Extraction + ISO Revenue Engine)        | ~$320                     | Document intelligence and ISO revenue modeling are mature and in active use                                               |
| Provisional patent (Patent 22 — Tiered Market Intelligence Dashboard)                    | ~$320                     | Usage-gated aggregated market dashboard is a novel SaaS monetization architecture                                         |
| **Provisional patent (Patents 25 + 26 — Pricing Waterfall + Market Arbitration Engine)** | ~$320                     | The 5-priority waterfall + DB-driven policy engine are novel — database-level RPC aggregation is distinctive              |
| **Provisional patent (Patent 24 — Self-Healing Wizard Agent)**                           | ~$320                     | localStorage runtime gate relaxation is novel auto-fix mechanism — prior art check needed for localStorage-based auto-fix |
| **Provisional patent (Patent 28 — Forbidden UI Computation Enforcement)**                | ~$320                     | The _FORBIDDEN_ method injection pattern is a novel software architecture technique for enforcing audit integrity         |

### 🔵 12 Months

| Action                                                                               | Cost                | Rationale                                                                                                            |
| ------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Full utility — Patents 2, 3, 4, 9, 11                                                | ~$8,000–15,000 each | Complete patent portfolio                                                                                            |
| PCT application (international)                                                      | ~$4,500             | Preserves rights in EU, Canada, Australia, Japan, UAE, Saudi Arabia — target markets in wizard international support |
| Design patent (Wizard UX)                                                            | ~$1,500             | Covers the visual expression of the TrueQuote wizard flow                                                            |
| Full utility — Patents 16, 17, 18 (Market Intelligence + Opportunity Engine cluster) | ~$8,000–15,000      | Intelligence platform as a separate patent family from the quoting engine                                            |
| Full utility — Patent 21 (Vendor Portal + ML Feedback Loop)                          | ~$8,000–15,000      | Marketplace architecture with ML feedback loop                                                                       |

---

## Prior Art Notes

_Issues the patent attorney should investigate before filing._

1. **Multi-step configuration wizards**: Salesforce CPQ, Oracle CPQ, and similar configure-price-quote systems use multi-step wizards. Merlin's distinction is the physics-layer coupling and proactive background synthesis — not the wizard format itself.

2. **Proactive/speculative computation**: Browser prefetching and server-side speculation are prior art for _prefetching content_. The novel element here is a **content-addressable cache keyed on user-configuration state** for an _async calculation_, not a network resource.

3. **Industry type detection**: Business category classification appears in Google Places, Yelp, and other directory APIs. Merlin's distinction is client-side, confidence-weighted, step-elimination logic — not the detection itself.

4. **BESS sizing calculators**: NREL's PVWatts, SAM (System Advisor Model), and commercial tools (Aurora Solar, Helioscope) exist for solar sizing. Merlin's distinction is the **four-layer coupling** and **three-tier optimizer** as a unified automated sales system — not the individual sizing formulas.

5. **Monte Carlo for energy projects**: Common in academic literature and professional tools (RETScreen, HOMER). Merlin's distinction is ITC binary risk modeling and Latin Hypercube sampling in a consumer-facing quote context.

6. **News/RSS scrapers and price monitoring**: Bloomberg, S&P Global, and energy data vendors (Wood Mackenzie, BloombergNEF) monitor equipment pricing. Merlin's distinction is the **dual-pattern per-equipment-class regex extraction** combined with a **zero-dependency dual-runtime parser** (browser + Node.js) and the **RSS-to-ML training database** architecture — not scraping or price monitoring per se.

7. **NLP-based lead scoring**: Salesforce Einstein, HubSpot AI, and marketing intelligence platforms score leads from public signals. Merlin's distinction is the **two-dimensional Signal × Industry confidence formula specifically calibrated for commercial BESS sales**, including the company name quality weight as a cost-guard against downstream AI API calls — not lead scoring in general.

8. **Document spec extraction**: IDP (Intelligent Document Processing) vendors (AWS Textract, Google Document AI, ABBYY) extract structured data from documents. Merlin's distinction is the **hybrid AI+regex dual-track pipeline with graceful fallback and confidence audit trail**, specifically for energy RFP/specification documents with BESS-specific field schema — not document extraction in general.

9. **ISO/RTO revenue calculators**: NREL's ReEDS and commercial tools model ancillary revenue. Merlin's distinction is the **integrated state-to-ISO mapping + per-service eligibility gate + 4-service aggregation as a real-time SaaS quote component** — not revenue modeling in isolation.

10. **Vendor portals and B2B marketplaces**: Alibaba, Grainger, and vertical marketplaces enable vendor product submissions. Merlin's distinction is the **bidirectional ML feedback loop where admin-approved vendor pricing simultaneously propagates to both the live quote engine and the ML training database** — not vendor portals or marketplaces per se.

11. **Energy price monitoring and alert systems**: Bloomberg and energy data vendors (Wood Mackenzie, BNEF) provide price alerts for energy commodities. Merlin's distinction is the **context-inferred baseline tier selection from article text** + **project cost decomposition to unit price** + **5-tier deal quality classification** in a single automated pipeline operating on unstructured news text — not price alerts from structured data feeds.

12. **Self-healing and circuit-breaker patterns**: Netflix Hystrix, AWS Circuit Breaker, and similar SRE tools implement auto-recovery for microservices. Merlin's distinction is **browser-side wizard gate relaxation via localStorage with timed expiry as an auto-fix mechanism for UX flow bottlenecks** — not infrastructure-level circuit breakers. The auto-fix acts on wizard validation thresholds, not service calls.

13. **Multi-tenant SaaS white-labeling**: Shopify, White-Label SaaS platforms, and headless CMS systems support multi-tenant white-label deployments. Merlin's distinction is the **per-vertical `IndustryPowerProfile` with physics-based per-unit sizing recommendations (`kWh per wash bay`, `kW per hotel room`, etc.)** combined with zero-code vertical deployment — not white-label configuration in general.

14. **Pricing enforcement and audit trails**: SOX-compliant accounting systems and commercial pricing engines (Zilliant, Vendavo) provide audit trails and pricing controls. Merlin's distinction is the **`_FORBIDDEN_` runtime method injection pattern that makes UI-side margin computation structurally impossible** by embedding exception-throwing functions on the result object itself — not audit trail generation per se.

---

## Brief Description of the Drawings

**FIG. 1** is a layered system architecture diagram of the Merlin Energy platform, illustrating five hierarchical functional layers flowing from user-visible interface down to external data authorities: a User Interface Layer containing six client-side application modules; a Wizard and Orchestration Layer containing the state machine, reducer, and tier-building engine; a Quote and Pricing Engine Layer containing the quote authentication, optimization, and pricing services; an Intelligence and Data Layer containing geographic, market, and financial analysis services; and an External Data Sources Layer identifying the authoritative external data providers. Directed arrows between layers indicate data flow and dependency relationships.

**FIG. 2** is a flowchart illustrating the end-to-end operational workflow of the Merlin Energy wizard, beginning at a user-initiated START node and proceeding through: business name entry with client-side industry classification; a confidence-gated decision node that eliminates an intermediate step and atomically populates facility constraints when confidence meets or exceeds 0.75; ZIP code entry with three-tier fallback geographic resolution and parallel progressive intel reveal; an optional industry selection step; load profile and equipment data collection with selective memoization and proactive background tier computation; add-on and configuration selection with reducer-level generator auto-enablement; three-tier MagicFit optimization; TrueQuote™-authenticated quote results display; and a format-branching export decision node. Back-navigation state reset behavior is annotated on the diagram.

**FIG. 3** is a three-panel diagram illustrating the core computation and compliance pipeline. The left panel depicts the Four-Layer Energy System Sizing Engine (Patent 1) with its location-to-solar-grade conversion, industry-specific facility constraints, operational demand profile inputs, goal-weighted penetration adjustments, and double-gated solar sizing formula. The center panel depicts the MagicFit Three-Tier Optimizer (Patent 2) with its four-scenario BESS upsize matrix, single-base-calculation three-tier derivation, and the Content-Addressable Proactive Synthesis Cache (Patent 9). The right panel depicts the TrueQuote™ Compliance Architecture (Patents 3, 4, and 28), including the typed authoritative source registry, per-value citation schema, quote audit metadata, three-layer margin policy stack, and Forbidden UI computation enforcement.

**FIG. 4** is a wireframe diagram of the Merlin Energy wizard user interface, depicting five sequential screen panels rendered side by side with connecting directional flow arrows: Screen 1 shows business name entry with industry auto-detection at 90% confidence and atomic constraint population; Screen 2 shows ZIP code entry with progressive solar grade, utility rate, and grid reliability reveal; Screen 3 shows load profile collection with live peak demand computation; Screen 4 shows add-on selection with MagicFit upsize matrix status and automatic generator enablement; Screen 5 shows the TrueQuote™-authenticated three-tier quote result with BESS and solar system sizing, total installed cost, annual savings, payback period, 25-year NPV, 25-year ROI, and export options.

---

## Detailed Description of the Drawings

### FIG. 1 — System Architecture

Referring to FIG. 1, the Merlin Energy platform is organized into five stacked horizontal functional layers, each bounded by a labeled zone. Data flows downward through directed arrows between layers.

**User Interface Layer (100)** comprises six client-side modules rendered in browser. Wizard V8 (101) is the primary five-step guided configuration interface, the primary subject of Patents 9–15. ProQuote Builder (102) is an advanced manual configuration tool. Results / Step 5 (103) is the tier-presentation display presenting TrueQuote™-authenticated quotes. Deep Dive Panel (104) is the bank-grade and professional financial model view. Market Intelligence Dashboard (105) aggregates live equipment price trends, utility benchmarks, ITC scenarios, and battery degradation data (Patent 22). Vendor Portal (106) provides the RFQ receipt and product submission interface (Patent 21).

**Wizard and Orchestration Layer (110)** comprises four modules. `useWizardV8` (111) serves as the primary state orchestrator implementing the content-addressable promise cache, proactive background synthesis, and stale-while-rebuilding pattern (Patent 9). `wizardState.ts` (112) is the pure reducer implementing the `UX_POLICY` design constraint object (Patent 15), all step transition logic, the confidence-gated CONFIRM_BUSINESS reducer (Patent 11), the SET_GRID_RELIABILITY reducer (Patent 14), and the GO_BACK tier reset. `step4Logic.ts` (113) implements the `buildTiers()` function that executes the four-layer sizing engine (Patent 1) and invokes the MagicFit optimizer. `MerlinOrchestrator` (114) applies TrueQuote™ authentication and routes MagicFit three-tier outputs to the customer-facing result set (Patents 2 and 3).

**Quote and Pricing Engine Layer (120)** comprises six computational services. `TrueQuoteV2` (121) is the quote engine and authentication gateway that validates every generated quote against the source registry before results are released. `MagicFit.ts` (122) is the three-tier optimizer implementing the four-scenario upsize matrices (Patent 2). `MarginPolicy` (123) is the three-layer pricing stack (market base cost / procurement buffer / sell price) with Forbidden UI method injection (Patents 4 and 28). `benchmarkSources` (124) is the typed `AUTHORITATIVE_SOURCES` registry implementing per-value citation and deviation logging for TrueQuote™ compliance (Patent 3). `unifiedPricing` (125) implements the five-priority pricing waterfall with market-confidence blend function (Patent 25). `8760 Simulator` (126) is the full-year hourly energy dispatch simulation engine (Patent 5).

**Intelligence and Data Layer (130)** comprises six analytical services. `geoIntelligence` (131) implements solar grade letter computation, composite grid reliability scoring, state incentive stacking, and ISO/RTO state-to-operator mapping (Patents 7 and 20). `marketDataParser` (132) implements dual-pattern per-equipment-class RSS price extraction with zero-dependency dual-runtime architecture (Patent 16). `rssAutoFetch` (133) implements the dual-pipeline scheduled fetch service routing each ingested article simultaneously to the AI training database and the price alert engine (Patent 27). `priceAlert` (134) implements three-pattern price extraction, context-inferred baseline tier selection, and five-tier deal classification (Patent 23). `monteCarlo` (135) implements P10/P50/P90 Latin Hypercube sampling with ITC binary risk modeling (Patent 6). `specExtraction` (136) implements the hybrid AI+regex dual-track extraction pipeline for unstructured RFP documents (Patent 19).

**External Data Sources Layer (140)** identifies six external data authorities consulted by the Intelligence layer. NREL ATB 2024 (141) provides battery and solar equipment cost benchmarks. EIA CBECS (142) provides commercial building energy consumption data. Supabase Database (143) is the application's primary relational datastore. GPT-4 AI (144) provides high-accuracy structured extraction for the hybrid document parser and speculative configuration suggestions. ISO/RTO Feeds (145) provide ancillary service price data for the revenue projection engine. Vendor API (146) represents the supply-side vendor pricing submission channel.

Directed arrows (150) between adjacent layers indicate the direction of primary data flow. Each arrow represents one or more asynchronous API calls, database queries, or Promise-based fetches traversing the layer boundary in the direction shown. Arrows between the Intelligence layer and External Sources layer represent outbound queries; return data flows upward through the same boundaries.

---

### FIG. 2 — Wizard Workflow

Referring to FIG. 2, the end-to-end operational flow of the Merlin Energy wizard is illustrated as a top-to-bottom flowchart with rectangular process nodes, diamond decision nodes, and annotated side notes.

Process initiates at **START (200)** when a user opens the Merlin Energy application in a browser.

**Step 0 — Business Name Entry (201):** The user enters a business or facility name. The system immediately applies `detectIndustryFromName()` (202), a client-side confidence-weighted natural language classifier that applies word-boundary regex matching across 30+ industry categories with tiered confidence values (0.70 for generic terms, 0.85 for specialty terms, 0.90–0.95 for recognized brand names). No backend call is made; classification occurs entirely in the browser.

**Confidence Gate Decision Node (203):** A diamond node evaluates whether the returned confidence value is greater than or equal to 0.75. If YES (204), two simultaneous actions occur in the same event loop tick: (a) the wizard navigator advances from Step 1 directly to Step 3, eliminating Step 2 from the user's session; and (b) `getFacilityConstraints()` (205) is called to atomically populate `solarPhysicalCapKW` and `criticalLoadPct` before Step 3 renders, preventing the null-state window described in Patent 11. If NO (206), the wizard proceeds normally through Step 2.

**Step 1 — ZIP Code Entry (207):** The user enters a five-digit postal code. Input is debounced at 350 milliseconds, normalized to digits only, and clamped to five characters before triggering API calls. The system initiates a three-tier fallback geographic resolution chain (208): primary external geocoder API (zippopotam.us), secondary local EIA utility rate table (state derived from rate data), and tertiary identity fallback (ZIP used as location with full intel proceeding). Simultaneously, three independent parallel API fetches are initiated for utility rate, solar irradiance, and weather data (209).

**Progressive Intel Reveal (210):** Each of the three parallel fetches resolves independently and dispatches a `PATCH_INTEL` action immediately upon completion, using `Promise.allSettled()` rather than `Promise.all()`. Three interface panels transition from skeleton loading state to populated state independently. A failure in any single API call causes only that panel to show an error state; the remaining panels and the wizard flow are unaffected (Patent 10).

**Step 2 — Industry Selector (211):** This step is rendered only when the confidence gate at node (203) returned NO. The user manually selects from twelve industry categories. Facility constraints are populated from this selection.

**Step 3 — Load Profile and Equipment (212):** The user provides physics-affecting operational parameters such as room count, square footage, and operating hours. The system applies selective memoization (213) using the `NON_POWER_ANSWER_KEYS` exclusion set: only parameters that affect power demand computations trigger `calculateUseCasePower()`; intent and scope toggles (solar interest, generator scope, etc.) do not trigger recalculation (Patent 12). A side note (214) identifies that background `buildTiers()` computation initiates at this step — two full steps before the results page — enabling zero user-perceived wait time at Step 5 under normal flow (Patent 9).

**Step 3.5 — Add-Ons and Configuration (215):** The user selects optional system components including solar PV, backup generator, and EV charging, and specifies a system goal. Grid reliability input (216) triggers the `SET_GRID_RELIABILITY` reducer: when reliability is reported as "unreliable" or "frequent-outages," `wantsGenerator` is set to `true` at the reducer level using a one-directional enable guard that prevents subsequent reliable-grid inputs from disabling a manually-selected generator (Patent 14). Add-on and goal changes invalidate the content-addressable cache key, causing a silent background rebuild of tiers.

**Step 4 — System Configuration (217):** The MagicFit three-tier optimizer applies the upsize matrix (218) corresponding to the user's generation combination scenario (Full / Solar Only / Generator Only / UPS Mode) and produces three distinct BESS configurations (Starter, Recommended, Complete) from a single base financial model calculation.

**Step 5 — Quote Results (219):** Three TrueQuote™-authenticated tier configurations are presented with NPV, IRR, payback period, and 25-year ROI metrics. Because computation began at Step 3, results are typically available before the user reaches this step, resulting in zero or near-zero loading time.

**Export Decision Node (220):** A diamond node branches on the selected export format. If Word (.docx) is selected (221), an authentication check is performed and a fully structured Word document including the project configuration, financial tables, and cover letter is generated server-side. If Excel (.xlsx) or PDF is selected (222), no authentication is required; both formats are generated entirely client-side without a server call, enabling offline-capable export (Phase 5 C4 implementation).

**TrueQuote™ Compliance Audit (223):** All quote outputs pass through a compliance check verifying source citation completeness, deviation log integrity, and benchmark version currency. Process concludes at **QUOTE DELIVERED (224)**.

**Back Navigation Reset (225):** A side-note annotation on the left margin indicates that if the user navigates backward to any step before Step 4, `tiersStatus` is reset to `"idle"` and the `tiers` array is cleared, preventing stale configuration results from being presented after upstream state changes (Phase 7 B5 implementation).

---

### FIG. 3 — Optimization Engine

Referring to FIG. 3, the diagram is organized into three vertically-oriented zone panels bounded by labeled regions, illustrating the Three-Patent computation and compliance core of the Merlin Energy platform.

#### Left Panel — Four-Layer Sizing Engine (300) [Patent 1]

**Layer 1 — Location (301)** accepts a ZIP code input and resolves it to a `peakSunHours` value via the geographic intelligence service. This continuous value is converted to a solar viability coefficient using the formula:

```text
sunFactor = clamp((peakSunHours − 3.0) / 2.5,  0,  1)
```

A `sunFactor` of 1.0 corresponds to PSH ≥ 5.5 (Grade A−); a value of 0.32 corresponds to PSH = 3.8 (Ann Arbor, Michigan); and the coefficient reaches 0.0 below PSH = 3.0. The coefficient is further discretized to a letter-grade system (A, A−, B+, B, B−, C+, C, D) for display purposes. Grade B− (PSH ≥ 3.5) is a hard eligibility gate: solar is excluded from all generated configurations when this threshold is not met.

**Layer 2 — Industry / Facility (302)** receives the industry classification slug and populates two facility-specific constraints: `solarPhysicalCapKW`, representing the maximum solar capacity the physical structure of the facility can host (examples: car_wash = 60 kW; hotel = 225 kW; warehouse = 819 kW; hospital = 150 kW); and `criticalLoadPct`, the minimum load percentage that must remain energized during a grid outage, derived from IEEE 446-1995 and NEC 517 standards.

**Layer 3 — Operational Profile (303)** incorporates measured power demand values: `baseLoadKW` (steady-state consumption), `peakLoadKW` (maximum demand), and EV charger load, which is pre-merged into the demand baseline at this layer rather than added as a post-calculation increment, ensuring that BESS sizing accounts for EV demand from the first computation.

**Layer 4 — Goal (304)** applies goal-weighted penetration adjustments to the sizing formula. Three goal categories are supported: `save_more` (conservative BESS, moderate solar, shorter duration, faster payback); `save_most` (balanced sizing for optimal 25-year NPV, the default Recommended configuration); and `full_power` (maximum BESS and solar capacity, generator always included, longest duration, maximum resilience). Goals adjust sizing weights proportionally; they do not set absolute values. Market and geographic data determine the actual sizing; goals guide the proportionality.

**Solar Sizing Formula with Double Gate (305)** combines all four layer outputs:

```text
solarOptimalKW = solarPhysicalCapKW × sunFactor × goalPenetration
solarFinalKW   = min(solarOptimalKW, solarPhysicalCapKW)
```

Solar is included in a configuration only when both eligibility gates are satisfied simultaneously: Gate A (geographic) requires `solarGrade ≥ B−` (PSH ≥ 3.5); Gate B (facility) requires `solarPhysicalCapKW > 0`. Either gate alone is insufficient.

#### Center Panel — MagicFit Optimizer (310) [Patents 2 and 9]

An arrow from the Four-Layer panel delivers the base calculated BESS size to the MagicFit Optimizer at module boundary (310a).

**Upsize Matrix (311)** specifies BESS capacity multipliers for each of four generation combination scenarios. When the Full generation scenario is selected (both solar and generator present), no upsize is applied (1.0× across all tiers). When Solar Only is selected (generator declined), BESS is upsized to 1.15×, 1.25×, or 1.35× for Starter, Recommended, and Complete tiers respectively, with a 1.5× duration multiplier to extend storage sufficiency in the absence of a generator. When Generator Only is selected (solar declined), a modest upsize of 1.0×, 1.1×, 1.2× is applied with 1.0× duration. When UPS Mode is active (both solar and generator declined), BESS is upsized to 1.35×, 1.50×, or 1.65× with a 2.0× duration multiplier, compensating for the complete absence of on-site generation by maximizing self-sufficiency from stored energy alone (Patent 2).

**Single Base Calculation (312)** establishes that the three tiers are derived from a single financial model invocation, not from three independent calculations. This architectural decision ensures that NPV, IRR, and payback values across the Starter, Recommended, and Complete tiers share a consistent financial basis and cannot produce contradictory results.

**Three Tiers Output (313)** produces the Starter configuration (conservative sizing, faster payback), the Recommended configuration (optimal 25-year NPV, the MagicFit default), and the Complete configuration (maximum resilience, longest warranty coverage).

**Content-Addressable Cache (314)** stores the in-flight computation Promise keyed on a deterministic JSON fingerprint (`createTierBuildKey`) derived from 20+ state parameters including ZIP code, state, industry slug, baseLoadKW, peakLoadKW, criticalLoadPct, solarPhysicalCapKW, all add-on selections, all equipment sizes, and all geographic intelligence values. If an identical fingerprint is requested while computation is in progress, the existing Promise is returned — no duplicate computation is initiated. When any input parameter changes, the cached Promise is discarded and a new build begins immediately. Existing results remain visible and usable during the rebuild (stale-while-rebuilding). Computation is initiated at Step 3, enabling zero user-perceived wait time at Step 5 in the typical flow (Patent 9).

Authenticated tier outputs (315) flow to the TrueQuote™ compliance layer before any results are presented to the user.

#### Right Panel — TrueQuote™ Compliance Architecture (320) [Patents 3, 4, and 28]

**Source Registry (321)** is the typed `AUTHORITATIVE_SOURCES` constant object in which every external data authority consumed by the platform is described as a structured record containing: `id`, `name`, `organization`, `type` (primary / secondary / certification / utility), `publicationDate`, `retrievalDate`, `vintage`, `lastVerified`, `url`, and `notes`. Enumerated authorities include NREL ATB 2024, NREL StoreFAST, NREL Cost Benchmark Q1 2024, EIA CBECS 2018, IEEE 446-1995, SEIA, BNEF, and ASHRAE. No value used in a customer-facing quote may reference a data source that is not registered in this object.

**Per-Value Citation (322)** enforces that every return value from a benchmark service function includes a structured citation object: `{ value, unit, sourceId, citation, confidence, validFrom, validUntil }`. The `sourceId` field links the value to its entry in the Source Registry. The `validFrom` and `validUntil` fields enable detection of stale benchmark data.

**Audit Metadata (323)** is attached to every generated quote as a `QuoteAuditMetadata` object containing: `generatedAt` timestamp, `benchmarkVersion`, `sourcesUsed[]` array, `methodologyVersion`, and a `deviations[]` array. Each entry in `deviations[]` records a specific instance where an applied value differs from the national benchmark, with fields: `lineItem`, `benchmarkValue`, `appliedValue`, and `reason`. This enables post-hoc audit of any quote's pricing derivation.

**Margin Policy (324) [Patent 4]** implements the formally separated three-layer pricing stack. Layer A is the market base cost (the SSOT, sourced from external benchmark data and never modified by the pricing engine). Layer B is the obtainable reality buffer (accounting for procurement uncertainty and regional variance). Layer C is the sell price (the customer-visible number, produced by applying the commercial margin policy to Layer A + Layer B). The strict separation ensures that price drift between market truth and sell price is always auditable. The deal-size discount curve, product-class margin tiers, and automated ReviewEvent triggers described in Patent 4 all operate within this layer stack.

**Forbidden UI Methods (325) [Patent 28]** are two runtime-exception-throwing functions attached to every `MarginRenderEnvelope` result object: `_FORBIDDEN_computeMarginInUI()` and `_FORBIDDEN_computeNetCostInUI()`. If any user interface code invokes either function, an exception is thrown before any computation can complete. This makes it structurally impossible — not merely discouraged — for the UI layer to independently compute margin or net cost. Because all sell prices are therefore guaranteed to originate from the margin policy engine with full ClampEvent and ReviewEvent audit trail, the separation between base cost and sell price described in Layer C above is architecturally enforced rather than convention-enforced.

---

### FIG. 4 — Wizard User Interface

Referring to FIG. 4, five sequential wizard screen panels (400–440) are depicted in a horizontal row with connecting directional arrows (450) between adjacent panels, representing the primary user-facing interface flow of the Merlin Energy platform from initial input through quote delivery.

Each screen panel comprises: an outer rounded-rectangle bezel (401a) with a color-coded border indicating the step's primary theme; a solid color title bar (401b) showing the step name and a circular step number badge; and a scrollable content area containing four element types — label annotations (gray, supplementary text), input fields (dark background, placeholder text), data cards (mid-tone background, populated system-derived values), and highlighted cards (color-matched to the step theme, representing primary actionable information).

**Screen 1 — Step 0: Enter Business Name (400):**
A text input field (401) accepts a business or facility name. Upon input, the industry classifier executes client-side and, when confidence reaches or exceeds 0.75, a highlighted detection card (402) displays the detected industry type and confidence percentage. Supporting data cards (403) show the industry-inferred solar physical capacity cap (225 kW for the hotel example) and critical load percentage (45%). Label annotations (404) confirm that Step 2 has been eliminated from the session navigation path and that facility constraints have been atomically populated via `getFacilityConstraints()`. A call-to-action button (405) advances to Step 1.

**Screen 2 — Step 1: ZIP Code and Location Intelligence (410):**
A text input field (411) accepts a five-digit ZIP code. Two highlighted data cards (412, 413) display, respectively: the resolved solar grade letter and peak sun hours value (e.g., Grade A at 5.8 PSH) and the grid reliability classification (e.g., Reliable). Supporting data cards (414) show utility rate per kWh, peak demand rate per kW, applicable state ITC bonus percentage, and SREC availability. Each card populates independently as its corresponding API call resolves, implementing the progressive reveal mechanism of Patent 10. A label annotation (415) identifies this mechanism. A call-to-action button (416) initiates location analysis.

**Screen 3 — Step 3: Load Profile and Equipment (420):**
Two text input fields (421, 422) collect physics-affecting operational parameters — for the hotel example, room count (150 rooms) and gross square footage (45,000 sqft). A highlighted demand card (423) displays the computed peak demand in kW (432 kW for the example), updated reactively each time a physics-affecting parameter changes. Supporting data cards (424) show the steady-state base load (220 kW), EV charger load contribution pre-merged into the demand baseline (+18 kW), estimated solar-eligible roof area (30,000 sqft), and the resulting solar physical capacity cap (225 kW). A label annotation (425) identifies the selective memoization mechanism of Patent 12. Background tier computation has initiated at this step, though no indication is shown in the UI. A call-to-action button (426) proceeds to Step 3.5.

**Screen 4 — Step 3.5/4: Add-Ons and Configuration (430):**
Highlighted selection cards (431, 432) confirm Solar PV (225 kW) and Backup Generator as enabled add-ons for the current session. A supporting card (433) indicates that the generator was automatically enabled by the `SET_GRID_RELIABILITY` reducer in response to a reported unreliable grid condition, referencing Patent 14's reducer-level auto-enablement mechanism. A goal selection annotation (434) identifies the user's chosen optimization objective (Save the Most). A highlighted status card (435) shows MagicFit optimization in progress, indicating that the content-addressable cache is building tiers. Supporting cards (436) identify the applicable generation combination scenario (Solar Only), the upsize matrix being applied (1.15× / 1.25× / 1.35×), and the duration multiplier (1.5×). A call-to-action button (437) navigates to Step 5.

**Screen 5 — Step 5: Quote Results (440):**
A TrueQuote™ authentication label (441) confirms that all presented values have passed source citation verification and the compliance audit. A highlighted recommendation card (442) identifies the Recommended tier as the MagicFit-selected optimal configuration. Supporting data cards (443) display the full system specification: BESS capacity (1.4 MW / 5.6 MWh), solar system size (225 kW), and total installed cost ($2,847,000 for the example). A highlighted financial metrics card (444) displays annual savings ($312,000). Additional data cards (445) show the simple payback period (9.1 years), the 25-year unlevered net present value ($1.84M), and the 25-year return on investment (187%). A label annotation (446) identifies the three available export formats: Word document (requires authentication), Excel workbook (client-side, no authentication), and PDF (client-side print, no authentication). A call-to-action button (447) initiates the selected export.

Directional arrows (450) between adjacent screen panels indicate the primary sequential navigation direction from Step 0 through Step 5. The arrowed path represents the happy-path flow for a high-confidence industry detection scenario in which Step 2 is eliminated. In sessions where the confidence gate is not met, Step 2 would appear between Screens 1 and 3 as an additional screen panel.

---

_Last updated: April 2026_
_Document version: 3.0 — Added Patents 23–29 (Pricing & Intelligence Architecture layer), 9 new Trade Secrets, 4 new Prior Art notes_
_Prior version: 2.0 — Added Patents 16–22 (Intelligence & Vendor Platform layer)_
_Prior version: 1.0 — March 23, 2026 (Patents 0–15, Wizard/TrueQuote layer)_
_Next review: Prior to first USPTO filing_
