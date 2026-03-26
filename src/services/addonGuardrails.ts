/**
 * =============================================================================
 * ADDON GUARDRAILS — Single Source of Truth for sizing sanity checks,
 * equipment requirements, and economic validation for Solar, EV, and Generator.
 *
 * TrueQuote™ compliance: every number here is traceable to a published standard.
 * These functions are called by:
 *   - pricingServiceV45.ts (EV infrastructure cost)
 *   - step4Logic.ts (audit notes, warnings)
 *   - Step3_5V8.tsx (display-time warnings)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Sizing ≠ Production.
 *      - sunFactor (addonSizing.ts) is an ECONOMIC sizing decision: how much of
 *        the physical roof to install based on sun quality and economics.
 *      - Production (below, computeSolarValueAnalysis) uses NREL's Performance
 *        Ratio model: kWh = kW × PSH × 365 × PR (PR=0.77 for commercial C&I).
 *      These two are intentionally separate and must not be conflated.
 *
 *   2. EV electrical infrastructure is a REAL cost.
 *      DCFC (50 kW) requires 480V 3-phase service. Many commercial buildings
 *      have single-phase 208V only — adding 3-phase is $15K–$35K incremental.
 *      HPC (250 kW) requires a dedicated ~350A 480V feed; transformer very likely.
 *      These costs are NOT in the charger unit price and MUST appear in TrueQuote.
 *
 *   3. Generator sizing must account for motor starting surge.
 *      HVAC compressors, pumps, and refrigeration units draw 6–8× running current
 *      at startup (Locked Rotor Amps). NEC 430.52 and IEEE 446 require the
 *      generator to handle the largest motor's starting kVA, not just steady-state.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCES
 * ─────────────────────────────────────────────────────────────────────────────
 *   Solar production:  NREL PVWatts, PR=0.77 (NREL/TP-550-38995)
 *   EV service sizing: NEC Article 625 (EV Charging), NEC 220 (load calc),
 *                      SAE J1772, DOE AFDC infrastructure guide 2024
 *   Generator motors:  NEC 430.52 (motor overload), IEEE 446-1995 (Orange Book),
 *                      NFPA 110 (emergency/standby systems)
 *   EV market rates:   DOE/AFDC Station Data 2024, ChargePoint/EVgo public tariffs
 * =============================================================================
 */

// =============================================================================
// ── SOLAR VALUE ANALYSIS ─────────────────────────────────────────────────────
// =============================================================================

/**
 * Solar value analysis output.
 *
 * IMPORTANT: installedKW here is the RECOMMENDED system size (from addonSizing.ts
 * estimateSolarKW), which is already economics-adjusted. physicalCapKW is the
 * maximum the roof can physically hold (from solarPhysicalCapKW in state).
 *
 * The gap between physicalCapKW and installedKW is intentional: sun quality
 * and scope penetration determine the economically optimal installation fraction.
 * Installing 100% of physical cap in a low-sun location results in poor ROI.
 */
export interface SolarValueAnalysis {
  // System parameters
  physicalCapKW: number;       // What the roof can physically hold (SSOT: solarPhysicalCapKW)
  installedKW: number;         // Recommended system size (cap × sunFactor × penetration)
  utilizationPct: number;      // installedKW / physicalCapKW × 100

  // Production model (NREL PVWatts methodology)
  peakSunHours: number;        // Location-specific PSH (from intel.peakSunHours)
  performanceRatio: number;    // 0.77 — NREL commercial C&I standard (losses, soiling, temp)
  annualKWhProduced: number;   // installedKW × PSH × 365 × PR

  // Economic model
  utilityRate: number;         // $/kWh (from intel.utilityRate)
  annualSavingsDollars: number; // annualKWhProduced × utilityRate
  simplePaybackYears: number;  // netCostAfterITC / annualSavingsDollars
  valuePerKWPerYear: number;   // annualSavingsDollars / installedKW ($/kW/yr)

  // Cost basis (for payback calc — matches pricingServiceV45 SSOT)
  grossCostPerW: number;       // $1.51/W (pricingServiceV45 EQUIPMENT_UNIT_COSTS.solar)
  grossCostDollars: number;    // installedKW × 1000 × grossCostPerW
  itcRate: number;             // 0.30 (IRA 2022)
  itcAmount: number;           // grossCostDollars × itcRate
  netCostAfterITC: number;     // grossCostDollars × (1 − itcRate)

  // Audit note for TrueQuote
  auditNote: string;
}

/**
 * Compute solar value analysis using NREL PVWatts methodology.
 *
 * Formula:
 *   annualKWh = installedKW × peakSunHours × 365 × 0.77
 *   annualSavings = annualKWh × utilityRate
 *   payback = (installedKW × 1000 × $1.51 × 0.70) / annualSavings
 *
 * The 0.77 Performance Ratio accounts for:
 *   - DC wiring losses (~2%)
 *   - Inverter efficiency (~96%)
 *   - Soiling / shading (~3%)
 *   - Temperature de-rating (~5%)
 *   - Clipping / mismatch (~2%)
 *   Combined: ~14% system loss → PR = 0.86 × efficiency stack → 0.77 net
 *
 * Source: NREL/TP-550-38995 "Performance Ratio — Quality Factor for the PV Plant"
 */
export function computeSolarValueAnalysis(params: {
  physicalCapKW: number;
  installedKW: number;
  peakSunHours: number;
  utilityRate: number;
  grossCostPerW?: number; // default 1.51 (pricingServiceV45 SSOT)
  itcRate?: number;       // default 0.30 (IRA 2022)
}): SolarValueAnalysis {
  const PR = 0.77; // NREL standard Performance Ratio for commercial C&I (NREL/TP-550-38995)
  const grossCostPerW = params.grossCostPerW ?? 1.51; // pricingServiceV45 EQUIPMENT_UNIT_COSTS.solar.pricePerWatt
  const itcRate = params.itcRate ?? 0.30; // IRA 2022 base rate

  const annualKWhProduced = params.installedKW * params.peakSunHours * 365 * PR;
  const annualSavingsDollars = annualKWhProduced * params.utilityRate;

  const grossCostDollars = params.installedKW * 1000 * grossCostPerW;
  const itcAmount = grossCostDollars * itcRate;
  const netCostAfterITC = grossCostDollars - itcAmount;

  // Simple solar-only payback (excludes BESS; solar's own standalone economics)
  const simplePaybackYears = annualSavingsDollars > 0 ? netCostAfterITC / annualSavingsDollars : 999;
  const valuePerKWPerYear = params.installedKW > 0 ? annualSavingsDollars / params.installedKW : 0;
  const utilizationPct = params.physicalCapKW > 0
    ? Math.round((params.installedKW / params.physicalCapKW) * 100)
    : 0;

  const auditNote =
    `Solar value: ${params.installedKW} kW × ${params.peakSunHours} PSH × 365 × ${PR} PR` +
    ` = ${Math.round(annualKWhProduced).toLocaleString()} kWh/yr` +
    ` × $${params.utilityRate}/kWh = $${Math.round(annualSavingsDollars).toLocaleString()}/yr` +
    ` | Net cost after ${Math.round(itcRate * 100)}% ITC: $${Math.round(netCostAfterITC).toLocaleString()}` +
    ` | Simple payback: ${Math.round(simplePaybackYears * 10) / 10} yrs` +
    ` | Source: NREL/TP-550-38995 (PR=0.77)`;

  return {
    physicalCapKW: params.physicalCapKW,
    installedKW: params.installedKW,
    utilizationPct,
    peakSunHours: params.peakSunHours,
    performanceRatio: PR,
    annualKWhProduced: Math.round(annualKWhProduced),
    utilityRate: params.utilityRate,
    annualSavingsDollars: Math.round(annualSavingsDollars),
    simplePaybackYears: Math.round(simplePaybackYears * 10) / 10,
    valuePerKWPerYear: Math.round(valuePerKWPerYear),
    grossCostPerW,
    grossCostDollars: Math.round(grossCostDollars),
    itcRate,
    itcAmount: Math.round(itcAmount),
    netCostAfterITC: Math.round(netCostAfterITC),
    auditNote,
  };
}

// =============================================================================
// ── EV ELECTRICAL INFRASTRUCTURE ─────────────────────────────────────────────
// =============================================================================

/**
 * Per-line-item breakdown of electrical infrastructure required for EV chargers.
 * This cost is SEPARATE from the charger unit price in pricingServiceV45.
 *
 * The charger unit price includes the charger hardware, mounting, and a basic
 * conduit run assuming adequate existing service. When service is NOT adequate
 * (the common case for DCFC/HPC at existing commercial buildings), these
 * infrastructure costs are incremental and MUST be quoted separately.
 */
export interface EVInfraLineItem {
  item: string;
  cost: number;         // Estimated cost in $
  required: boolean;    // True = always needed; false = site-condition-dependent
  source: string;       // Code/standard reference
  notes: string;
}

export interface EVInfrastructureRequirements {
  // Service sizing
  totalInputKW: number;         // Total AC input demand (output / efficiency)
  estimatedServiceAmps: number; // NEC 125% continuous load rule at 480V 3-phase
  requires480V3Phase: boolean;  // DCFC/HPC need 3-phase 480V; L2-only needs 240V single-phase
  transformerRecommended: boolean; // True for HPC or 3+ DCFC (dedicated transformer advised)

  // Cost total
  electricalInfrastructureCost: number; // Sum of all required line items

  // Detailed line items
  lineItems: EVInfraLineItem[];

  // Warnings for quote display
  warnings: string[];

  // EV revenue model: market charging rate vs. facility electricity rate
  revenueAnalysis: EVRevenueAnalysis;
}

/**
 * EV charging revenue model — uses per-kWh pricing for traceability.
 *
 * Market charging rates (public DCFC/HPC, 2024 averages, DOE AFDC):
 *   L2:   $0.30–$0.45/kWh (workplace/retail destination)
 *   DCFC: $0.45–$0.60/kWh (public DC fast charging)
 *   HPC:  $0.55–$0.70/kWh (premium highway / Electrify America)
 *
 * Revenue = chargerOutputKW × sessionDurationHrs × sessionsPerDay × daysPerYear × $/kWh
 *
 * "Margin over electricity cost" = what the site operator keeps after paying
 * the utility for the electricity delivered. This is the true economic value.
 */
export interface EVRevenueAnalysis {
  l2AnnualRevenue: number;    // $ per charger per year
  dcfcAnnualRevenue: number;
  hpcAnnualRevenue: number;
  totalAnnualRevenue: number;
  electricityCostPerYear: number; // Cost of electricity consumed by chargers
  netMarginPerYear: number;       // Revenue − electricity cost
  auditNote: string;
}

/**
 * Compute EV charger electrical infrastructure requirements and revenue model.
 *
 * Infrastructure sizing follows:
 *   - NEC Article 625: Electric Vehicle Power Transfer Systems
 *   - NEC 220.87: Determining existing loads
 *   - SAE J1772: L1/L2 charging standards
 *   - DOE Alternative Fuels Data Center: EV Infrastructure Guide 2024
 *
 * Revenue model follows:
 *   - DOE/AFDC EV Station Data 2024 (utilization benchmarks)
 *   - ChargePoint/EVgo public tariff schedules (market rate benchmarks)
 */
export function computeEVInfrastructureRequirements(config: {
  l2Count: number;
  dcfcCount: number;
  hpcCount: number;
  utilityRate: number; // $/kWh — facility's electricity cost
}): EVInfrastructureRequirements {
  const { l2Count, dcfcCount, hpcCount, utilityRate } = config;

  // ── AC input power (output / charger efficiency, NEC sizing basis) ─────
  // Efficiency factors from EV_CHARGER_INPUT_POWER in evChargingCalculations.ts
  const l2InputKW = l2Count * (7.2 / 0.96);       // 96% efficient
  const dcfcInputKW = dcfcCount * (50 / 0.87);     // 87% efficient
  const hpcInputKW = hpcCount * (250 / 0.90);      // 90% efficient
  const totalInputKW = l2InputKW + dcfcInputKW + hpcInputKW;

  // ── Service amperage: I = kW × 1000 / (√3 × 480) × 1.25 (NEC 125% continuous load) ──
  // At 480V 3-phase: 1 kW = 1.203 A; × 1.25 NEC continuous load factor
  const estimatedServiceAmps = Math.round(totalInputKW * 1.203 * 1.25);

  const hasDCFC = dcfcCount > 0;
  const hasHPC = hpcCount > 0;
  const requires480V3Phase = hasDCFC || hasHPC;

  // Dedicated transformer recommended when: any HPC, or ≥ 3 DCFC, or > 200 kW input
  const transformerRecommended = hasHPC || dcfcCount >= 3 || totalInputKW > 200;

  const lineItems: EVInfraLineItem[] = [];
  const warnings: string[] = [];

  // ── L2-only: standard 240V single-phase, typically no service upgrade needed ──
  if (l2Count > 0 && !hasDCFC && !hasHPC) {
    const panelCircuitCost = Math.round(l2Count * 350); // $350/circuit for 40A 240V breaker + wiring
    lineItems.push({
      item: `${l2Count} × 40A 240V circuit(s) for Level 2 chargers`,
      cost: panelCircuitCost,
      required: true,
      source: "NEC Article 625.17, SAE J1772",
      notes: "Each L2 charger needs a dedicated 40A 240V circuit. Typically from existing panel — no service upgrade needed for ≤ 8 chargers on most commercial panels.",
    });
    if (l2Count > 8) {
      warnings.push(`${l2Count} Level 2 chargers may exceed your existing panel capacity. Verify available breaker slots and service amperage with a licensed electrician.`);
    }
  }

  // ── DCFC: requires 480V 3-phase service ─────────────────────────────────
  if (hasDCFC) {
    const serviceBaseCost = 20_000; // Base cost for 480V 3-phase service entry
    lineItems.push({
      item: "480V 3-phase electrical service entry",
      cost: serviceBaseCost,
      required: true,
      source: "NEC Article 230, DOE AFDC EV Infrastructure Guide 2024",
      notes: "DC Fast Chargers require 480V 3-phase service. If the building currently has single-phase 208V service, this is an incremental utility service upgrade cost ($15K–$35K typical). Already-3-phase buildings still need dedicated DCFC panel wiring.",
    });

    const dcfcConduitCost = Math.round(dcfcCount * 4_000);
    lineItems.push({
      item: `Conduit & 480V wiring to ${dcfcCount} DCFC station(s)`,
      cost: dcfcConduitCost,
      required: true,
      source: "NEC Article 625.44, NFPA 70E",
      notes: `Run from main panel to each DCFC location. 4/0 AWG copper at ~$18/ft × estimated 60 ft average run × ${dcfcCount} stations.`,
    });

    if (dcfcCount >= 3) {
      const transformerKVA = Math.round(dcfcInputKW * 1.25); // NEC 125% continuous
      const transformerCost = Math.round(transformerKVA * 28); // ~$28/kVA for pad-mount distribution transformer
      lineItems.push({
        item: `Dedicated transformer (${transformerKVA} kVA) for DCFC load`,
        cost: transformerCost,
        required: true,
        source: "NEC 450, IEEE C57.12 transformer standards",
        notes: `${dcfcCount} DCFC chargers at ${Math.round(dcfcInputKW)} kW total input load. Utility-owned or customer-owned transformer required. Utility interconnection request typically needed for loads > 150 kW.`,
      });
      warnings.push(`${dcfcCount} DCFC chargers (${Math.round(dcfcInputKW)} kW input load) — submit a utility interconnection request. Lead time can be 4–18 months in constrained grid areas.`);
    }

    warnings.push(`DC Fast Chargers require 480V 3-phase service. If your building currently runs on single-phase 208V, budget an additional $15K–$35K for utility service conversion (NEC Article 230 service entrance work).`);
  }

  // ── HPC: dedicated service almost always required ────────────────────────
  if (hasHPC) {
    const hpcServiceCost = 35_000; // Dedicated service entry + 480V bus
    lineItems.push({
      item: "Dedicated 480V service + switchgear for HPC station(s)",
      cost: hpcServiceCost,
      required: true,
      source: "NEC Article 230, 250, DOE AFDC EV Infrastructure Guide 2024",
      notes: "High Power Chargers (250+ kW) draw 350–400A each at 480V 3-phase. A dedicated electrical room with switchgear is required per NEC 110.26 working clearance rules.",
    });

    const transformerKVA = Math.round(hpcInputKW * 1.25);
    const transformerCost = Math.round(transformerKVA * 25); // ~$25/kVA for medium-voltage xfmr
    lineItems.push({
      item: `Transformer (${transformerKVA} kVA) for HPC station(s)`,
      cost: transformerCost,
      required: true,
      source: "NEC 450, IEEE C57.12",
      notes: `${hpcCount} HPC station(s) at ${Math.round(hpcInputKW)} kW total input. Utility will likely require a customer-owned transformer and a formal interconnection study.`,
    });

    const hpcConduitCost = Math.round(hpcCount * 12_000); // 350 kcmil copper runs
    lineItems.push({
      item: `350 kcmil copper wiring to ${hpcCount} HPC station(s)`,
      cost: hpcConduitCost,
      required: true,
      source: "NEC 310.15 conductor sizing, NEC Article 625",
      notes: "350 kcmil copper conductors needed per NEC 310.15 for 400A circuits. Larger conduit (3\" or 4\" EMT) required.",
    });

    warnings.push(`High Power Chargers (250 kW each) require a formal utility interconnection study. Submit at least 6 months before planned installation. Utility may require contribution-in-aid of construction for transformer upgrades.`);
  }

  const electricalInfrastructureCost = lineItems.reduce((sum, item) => sum + item.cost, 0);

  // ── Revenue analysis ─────────────────────────────────────────────────────
  // Sources: DOE/AFDC EV Station Utilization Data 2024, ChargePoint/EVgo tariffs
  //
  // Revenue per charger per year:
  //   L2  (7.2 kW): $0.35/kWh × 7.2 kWh/session × 1.5 sessions/day × 300 days = $1,134/yr
  //   DCFC (50 kW): $0.50/kWh × 20 kWh/session  × 4 sessions/day   × 300 days = $12,000/yr
  //                 (50 kW × 0.40h avg session = 20 kWh delivered per session)
  //   HPC (250 kW): $0.60/kWh × 60 kWh/session  × 5 sessions/day   × 300 days = $54,000/yr
  //                 (250 kW × 0.24h avg session = 60 kWh delivered per session)
  //
  // Electricity cost:
  //   L2:   7.2 kWh/session × 1.5 × 300 × utilityRate
  //   DCFC: 20 kWh/session  × 4   × 300 × utilityRate (input = output / 0.87 efficiency)
  //   HPC:  60 kWh/session  × 5   × 300 × utilityRate (input = output / 0.90)

  const L2_RATE_PER_KWH = 0.35;  // $/kWh retail charging rate (ChargePoint/Blink avg)
  const DCFC_RATE_PER_KWH = 0.50; // $/kWh (EVgo/ChargePoint DC fast avg)
  const HPC_RATE_PER_KWH = 0.60;  // $/kWh (Electrify America / Tesla Supercharger avg)

  const L2_KWH_PER_SESSION = 7.2;   // 7.2 kW × 1.0h avg
  const DCFC_KWH_PER_SESSION = 20;  // 50 kW × 0.40h avg
  const HPC_KWH_PER_SESSION = 60;   // 250 kW × 0.24h avg

  const L2_SESSIONS_PER_DAY = 1.5;  // DOE/AFDC avg for workplace/retail L2
  const DCFC_SESSIONS_PER_DAY = 4;  // DOE/AFDC avg for publicly accessible DCFC
  const HPC_SESSIONS_PER_DAY = 5;   // DOE/AFDC avg for premium fast charging corridor

  const OPERATING_DAYS = 300; // 300 operating days/year (conservative)

  const l2AnnualRevenue = Math.round(
    l2Count * L2_RATE_PER_KWH * L2_KWH_PER_SESSION * L2_SESSIONS_PER_DAY * OPERATING_DAYS
  );
  const dcfcAnnualRevenue = Math.round(
    dcfcCount * DCFC_RATE_PER_KWH * DCFC_KWH_PER_SESSION * DCFC_SESSIONS_PER_DAY * OPERATING_DAYS
  );
  const hpcAnnualRevenue = Math.round(
    hpcCount * HPC_RATE_PER_KWH * HPC_KWH_PER_SESSION * HPC_SESSIONS_PER_DAY * OPERATING_DAYS
  );
  const totalAnnualRevenue = l2AnnualRevenue + dcfcAnnualRevenue + hpcAnnualRevenue;

  // Electricity cost (input kWh consumed × facility rate)
  const l2ElecCost = Math.round(l2Count * (L2_KWH_PER_SESSION / 0.96) * L2_SESSIONS_PER_DAY * OPERATING_DAYS * utilityRate);
  const dcfcElecCost = Math.round(dcfcCount * (DCFC_KWH_PER_SESSION / 0.87) * DCFC_SESSIONS_PER_DAY * OPERATING_DAYS * utilityRate);
  const hpcElecCost = Math.round(hpcCount * (HPC_KWH_PER_SESSION / 0.90) * HPC_SESSIONS_PER_DAY * OPERATING_DAYS * utilityRate);
  const electricityCostPerYear = l2ElecCost + dcfcElecCost + hpcElecCost;
  const netMarginPerYear = totalAnnualRevenue - electricityCostPerYear;

  const auditNote = [
    `EV revenue model ($/kWh basis, DOE/AFDC 2024):`,
    l2Count > 0   ? `  L2 (${l2Count}): $${L2_RATE_PER_KWH}/kWh × ${L2_KWH_PER_SESSION} kWh/session × ${L2_SESSIONS_PER_DAY} sess/day × ${OPERATING_DAYS} days = $${(l2AnnualRevenue / l2Count).toLocaleString()}/charger/yr` : null,
    dcfcCount > 0 ? `  DCFC (${dcfcCount}): $${DCFC_RATE_PER_KWH}/kWh × ${DCFC_KWH_PER_SESSION} kWh/session × ${DCFC_SESSIONS_PER_DAY} sess/day × ${OPERATING_DAYS} days = $${(dcfcAnnualRevenue / dcfcCount).toLocaleString()}/charger/yr` : null,
    hpcCount > 0  ? `  HPC (${hpcCount}): $${HPC_RATE_PER_KWH}/kWh × ${HPC_KWH_PER_SESSION} kWh/session × ${HPC_SESSIONS_PER_DAY} sess/day × ${OPERATING_DAYS} days = $${(hpcAnnualRevenue / hpcCount).toLocaleString()}/charger/yr` : null,
    `  Total revenue: $${totalAnnualRevenue.toLocaleString()}/yr | Electricity cost: $${electricityCostPerYear.toLocaleString()}/yr | Net margin: $${netMarginPerYear.toLocaleString()}/yr`,
  ].filter(Boolean).join("\n");

  return {
    totalInputKW: Math.round(totalInputKW * 10) / 10,
    estimatedServiceAmps,
    requires480V3Phase,
    transformerRecommended,
    electricalInfrastructureCost,
    lineItems,
    warnings,
    revenueAnalysis: {
      l2AnnualRevenue,
      dcfcAnnualRevenue,
      hpcAnnualRevenue,
      totalAnnualRevenue,
      electricityCostPerYear,
      netMarginPerYear,
      auditNote,
    },
  };
}

// =============================================================================
// ── GENERATOR SIZING GUARDRAIL ────────────────────────────────────────────────
// =============================================================================

/**
 * Required equipment checklist for backup generator quotes.
 *
 * The generator unit cost in pricingServiceV45 covers:
 *   ✅ Generator set (engine, alternator, controls, enclosure)
 *   ✅ Exhaust/muffler system
 *   ✅ Startup and commissioning
 *   ❌ ATS ($8,000 — separate line item)
 *   ❌ Fuel storage tank ($5K–$15K for diesel — separate line item)
 *   ❌ Gas meter sizing (natural gas — utility review required, no hard cost until survey)
 *   ❌ Motor starting surge (sizing guardrail — generator must be sized for LRA, not just running load)
 */
export interface GeneratorEquipmentChecklist {
  // Sizing result
  runningLoadKW: number;       // The load that must run continuously
  motorStartingSurgeKW: number; // Added for LRA: largest motor × 3× factor (NEC 430.52)
  recommendedSizeKW: number;   // runningLoad + motorStartingSurge, rounded to standard size
  standardSizes: number[];     // Nearest available commercial generator sizes (kW)

  // Fuel sizing (diesel only)
  fuelStorageGallons: number;  // For diesel: hours × rated load × 0.068 gal/kWh (EPA Tier 4)
  fuelStorageHours: number;    // Runtime this tank provides at full load

  // Equipment list (MUST all appear in TrueQuote)
  requiredEquipment: Array<{
    item: string;
    cost: number;        // 0 if unknown/site-dependent
    included: boolean;   // true = included in unit price; false = separate line item
    notes: string;
  }>;

  warnings: string[];
  auditNote: string;
}

/**
 * Compute generator sizing guardrail with motor starting correction and full equipment list.
 *
 * Motor starting surge (NEC 430.52 / IEEE 446):
 *   HVAC compressors, pumps, and refrigeration units draw Locked Rotor Amps (LRA)
 *   at startup, typically 5–8× running amps. For a generator, this means the
 *   rated kW must accommodate the largest single motor's starting kVA.
 *   Rule of thumb: assume largest motor = 15% of criticalLoadKW.
 *   Starting kVA = motor kW × 6 × power factor correction → adds ~20% to generator size.
 *
 * Standard commercial generator sizes (kW): 20, 30, 45, 60, 80, 100, 125, 150,
 *   175, 200, 250, 300, 400, 500, 600, 750, 1000, 1250, 1500, 2000
 */
export function computeGeneratorSizingGuardrail(params: {
  criticalLoadKW: number;       // Load the generator must support
  fuelType: "diesel" | "natural-gas" | "dual-fuel";
  hasMajorMotors?: boolean;     // HVAC compressors, pumps, refrigeration (default: true)
  runtimeHoursRequired?: number; // Target hours of fuel (diesel only; default: 24)
}): GeneratorEquipmentChecklist {
  const {
    criticalLoadKW,
    fuelType,
    hasMajorMotors = true,
    runtimeHoursRequired = 24,
  } = params;

  // ── Motor starting surge correction ─────────────────────────────────────
  // Assume largest motor = 15% of critical load (typical C&I HVAC/pump profile)
  // Motor starting kVA ≈ motor running kW × 6 (locked rotor multiplier for 3-phase induction)
  // At 0.85 power factor: starting kW ≈ motor kW × 6 × 0.85 = 5.1× motor running kW
  // As fraction of total critical load: 0.15 × 5.1 = 0.77 → round to 0.20 (conservative)
  // Source: IEEE 446-1995 Section 5.3, NEC 430.52 Table 430.52
  const motorStartingSurgeKW = hasMajorMotors
    ? Math.round(criticalLoadKW * 0.20) // 20% additional for motor starting (IEEE 446)
    : 0;

  const rawSizeKW = (criticalLoadKW + motorStartingSurgeKW) * 1.10; // 10% headroom on top

  // Round up to nearest standard commercial generator size
  const STANDARD_SIZES = [20, 30, 45, 60, 80, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 750, 1000, 1250, 1500, 2000];
  const recommendedSizeKW = STANDARD_SIZES.find(s => s >= rawSizeKW) ?? Math.round(rawSizeKW);

  // Nearest 3 standard sizes (for quote options)
  const nearestIdx = STANDARD_SIZES.findIndex(s => s >= rawSizeKW);
  const standardSizes = STANDARD_SIZES.slice(
    Math.max(0, nearestIdx - 1),
    Math.min(STANDARD_SIZES.length, nearestIdx + 3)
  );

  // ── Diesel fuel sizing ───────────────────────────────────────────────────
  // EPA Tier 4 reciprocating engine: 0.068 gal/kWh at rated load (full load burn rate)
  // Source: EPA 40 CFR Part 60 Subpart JJJJ, typical Caterpillar/Cummins data sheets
  const DIESEL_BURN_RATE = 0.068; // gal/kWh at 100% load
  const fuelStorageGallons = fuelType === "diesel"
    ? Math.round(recommendedSizeKW * DIESEL_BURN_RATE * runtimeHoursRequired)
    : 0;

  // ── Equipment list ───────────────────────────────────────────────────────
  const requiredEquipment: GeneratorEquipmentChecklist["requiredEquipment"] = [];
  const warnings: string[] = [];

  // Generator unit (INCLUDED in pricingServiceV45 generator unit cost)
  requiredEquipment.push({
    item: `${recommendedSizeKW} kW ${fuelType} generator set`,
    cost: 0,
    included: true,
    notes: "Engine, alternator, integrated controls, sound-attenuating enclosure, startup/commissioning. Priced per unit in quote.",
  });

  // ATS (SEPARATE LINE ITEM — already in pricingServiceV45 as $8,000)
  requiredEquipment.push({
    item: "Automatic Transfer Switch (ATS)",
    cost: 8_000,
    included: true,
    notes: `Rated for facility service entrance. NEC Article 700/702 compliance. ` +
      `Includes 3-position (utility/off/generator) switching and automatic start signal. ` +
      `Source: NFPA 110 Section 8.`,
  });

  // Diesel: fuel storage tank (SEPARATE LINE ITEM — already in pricingServiceV45 as $15,000)
  if (fuelType === "diesel") {
    requiredEquipment.push({
      item: `Diesel day tank (${fuelStorageGallons} gal, ${runtimeHoursRequired}h runtime)`,
      cost: fuelStorageGallons <= 250 ? 5_000 : fuelStorageGallons <= 500 ? 10_000 : 15_000,
      included: true,
      notes: `Above-ground steel day tank. ${runtimeHoursRequired}-hour runtime at ${recommendedSizeKW} kW rated load` +
        ` (${DIESEL_BURN_RATE} gal/kWh × ${recommendedSizeKW} kW × ${runtimeHoursRequired}h = ${fuelStorageGallons} gal).` +
        ` Fuel delivery contract recommended for extended outages.`,
    });
    if (fuelStorageGallons > 300) {
      warnings.push(
        `${fuelStorageGallons}-gallon above-ground diesel tank requires secondary containment per EPA SPCC regulations ` +
        `and local fire marshal permit. Verify setback requirements from building (typically 5–10 ft minimum).`
      );
    }
  }

  // Natural gas: gas meter/regulator review (NOT INCLUDED — engineering consultation)
  if (fuelType === "natural-gas" || fuelType === "dual-fuel") {
    requiredEquipment.push({
      item: "Gas meter capacity review (utility coordination)",
      cost: 0,
      included: false,
      notes: `Natural gas generator requires adequate BTU/hr capacity at the utility meter. ` +
        `A ${recommendedSizeKW} kW NG generator consumes approximately ${Math.round(recommendedSizeKW * 9.5)} BTU/min at full load. ` +
        `Contact your gas utility to verify existing meter rating and pressure. ` +
        `Dedicated gas service or regulator upgrade may be required ($2K–$15K, utility-specific).`,
    });
    warnings.push(
      `Natural gas generator: verify your utility meter can supply ≥ ${Math.round(recommendedSizeKW * 9.5)} BTU/min ` +
      `(${recommendedSizeKW} kW at full load). Meter upgrade lead time can be 4–12 weeks.`
    );
  }

  // Motor starting note
  if (hasMajorMotors && motorStartingSurgeKW > 0) {
    warnings.push(
      `Motor starting surge (+${motorStartingSurgeKW} kW) factored in for HVAC/pump loads (IEEE 446-1995 §5.3). ` +
      `Verify the largest single motor horsepower during site survey — oversized motors may require a larger generator.`
    );
  }

  const auditNote =
    `Generator sizing: ${criticalLoadKW} kW critical load` +
    (motorStartingSurgeKW > 0 ? ` + ${motorStartingSurgeKW} kW motor starting (IEEE 446)` : ``) +
    ` × 1.10 headroom = ${Math.round(rawSizeKW)} kW → rounded to ${recommendedSizeKW} kW standard size.` +
    (fuelType === "diesel" ? ` | Fuel: ${fuelStorageGallons} gal (${runtimeHoursRequired}h @ ${DIESEL_BURN_RATE} gal/kWh, EPA Tier 4).` : ``) +
    ` | ATS: $8,000 (NEC 700/702). Sources: IEEE 446-1995, NEC 430.52, NFPA 110.`;

  return {
    runningLoadKW: criticalLoadKW,
    motorStartingSurgeKW,
    recommendedSizeKW,
    standardSizes,
    fuelStorageGallons,
    fuelStorageHours: runtimeHoursRequired,
    requiredEquipment,
    warnings,
    auditNote,
  };
}

// =============================================================================
// ── COMBINED ADDON VALIDATION ─────────────────────────────────────────────────
// =============================================================================

/**
 * Run all guardrails for a given addon configuration and return a combined
 * list of warnings that should be surfaced in the UI and included in TrueQuote.
 *
 * Called by step4Logic.ts buildOneTier() to populate tier.notes.
 */
export interface AddonValidationResult {
  solarWarnings: string[];
  evWarnings: string[];
  generatorWarnings: string[];
  allWarnings: string[];
  evInfrastructureCost: number; // Amount to ADD to evChargingCost in the quote
  solarAuditNote: string;
  evAuditNote: string;
  generatorAuditNote: string;
}

export function validateAddonConfig(params: {
  // Solar
  solarInstalledKW: number;
  solarPhysicalCapKW: number;
  peakSunHours: number;
  utilityRate: number;
  // EV
  l2Count: number;
  dcfcCount: number;
  hpcCount: number;
  // Generator
  generatorKW: number;
  criticalLoadKW: number;
  fuelType: "diesel" | "natural-gas" | "dual-fuel";
  hasMajorMotors?: boolean;
}): AddonValidationResult {
  const solarWarnings: string[] = [];
  const evWarnings: string[] = [];
  const generatorWarnings: string[] = [];

  let solarAuditNote = "";
  let evAuditNote = "";
  let generatorAuditNote = "";
  let evInfrastructureCost = 0;

  // ── Solar ─────────────────────────────────────────────────────────────────
  if (params.solarInstalledKW > 0 && params.peakSunHours > 0) {
    const solar = computeSolarValueAnalysis({
      physicalCapKW: params.solarPhysicalCapKW,
      installedKW: params.solarInstalledKW,
      peakSunHours: params.peakSunHours,
      utilityRate: params.utilityRate,
    });
    solarAuditNote = solar.auditNote;

    if (solar.simplePaybackYears > 20) {
      solarWarnings.push(`Solar simple payback is ${solar.simplePaybackYears} years — marginal economics at $${params.utilityRate}/kWh and ${params.peakSunHours} PSH. Verify utility rate.`);
    }
    if (params.peakSunHours < 3.5) {
      solarWarnings.push(`Low peak sun hours (${params.peakSunHours} PSH). Solar may have longer payback — site-specific shade and tilt analysis recommended.`);
    }
  }

  // ── EV ───────────────────────────────────────────────────────────────────
  if (params.l2Count > 0 || params.dcfcCount > 0 || params.hpcCount > 0) {
    const ev = computeEVInfrastructureRequirements({
      l2Count: params.l2Count,
      dcfcCount: params.dcfcCount,
      hpcCount: params.hpcCount,
      utilityRate: params.utilityRate,
    });
    evInfrastructureCost = ev.electricalInfrastructureCost;
    evAuditNote = ev.revenueAnalysis.auditNote;
    evWarnings.push(...ev.warnings);
  }

  // ── Generator ────────────────────────────────────────────────────────────
  if (params.generatorKW > 0 && params.criticalLoadKW > 0) {
    const gen = computeGeneratorSizingGuardrail({
      criticalLoadKW: params.criticalLoadKW,
      fuelType: params.fuelType,
      hasMajorMotors: params.hasMajorMotors,
    });
    generatorAuditNote = gen.auditNote;
    generatorWarnings.push(...gen.warnings);

    // Flag if the user-selected generator size is too small after motor starting correction
    if (params.generatorKW < gen.recommendedSizeKW) {
      generatorWarnings.push(
        `⚠️ Selected generator (${params.generatorKW} kW) may be undersized for motor starting surge. ` +
        `Recommended: ${gen.recommendedSizeKW} kW (${gen.runningLoadKW} kW load + ${gen.motorStartingSurgeKW} kW motor surge + 10% headroom).`
      );
    }
  }

  return {
    solarWarnings,
    evWarnings,
    generatorWarnings,
    allWarnings: [...solarWarnings, ...evWarnings, ...generatorWarnings],
    evInfrastructureCost,
    solarAuditNote,
    evAuditNote,
    generatorAuditNote,
  };
}
