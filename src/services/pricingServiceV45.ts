/**
 * Pricing Service v4.5 - Centralized Cost Logic
 * ==============================================
 *
 * Single source of truth for all equipment costs based on Step 5 v4.5 validated architecture.
 *
 * Key Changes from v4.0:
 * - Fixed inverter double-counting ($0.19/W deducted from solar)
 * - Added site engineering & construction costs ($25,800 baseline)
 * - Added 7.5% construction contingency
 * - Added annual operating reserves (insurance, inverter, BESS degradation)
 * - Implemented tiered margin structure (22% → 17% → 15%, equipment-only quote basis)
 * - Honest financial projections (4.5yr payback vs fabricated 4.0yr)
 * - v4.5.1: Added EV electrical infrastructure cost (480V service, transformer, panel)
 *   as a separate line item — DCFC/HPC charger unit prices do NOT cover service upgrades.
 *
 * Data Sources:
 * - NREL ATB 2024/2025 (battery, solar, wind)
 * - Industry benchmarks (generator, EV charging, site work)
 * - Government APIs (merlinDataService.js)
 * - addonGuardrails.ts (EV electrical infrastructure, NEC/SAE/DOE)
 *
 * Version: 4.5.1
 * Date: March 26, 2026
 * Author: Merlin Energy Systems
 */

import { computeEVInfrastructureRequirements } from "./addonGuardrails";

// ============================================================================
// EQUIPMENT UNIT PRICING ($/unit)
// ============================================================================

export const EQUIPMENT_UNIT_COSTS = {
  // Solar PV — equipment-only (NO field labor)
  solar: {
    pricePerWatt: 1.0, // $/W equipment-only: modules, racking, BOS wiring, basic permits. NO field labor.
    laborPerWatt: 0.51, // $/W field installation labor — shown as Additional Costs, NOT in equipment quote.
    inverterDeduction: 0.19, // $/W (inverter now in BESS hybrid system)
    grossPricePerWatt: 1.7, // $/W gross before inverter deduction
    source: "NREL ATB 2024 / NREL C&I Rooftop 2024",
    notes:
      "Equipment quote: modules, racking, BOS wiring, basic permits. Inverter EXCLUDED. Field labor at $0.51/W billed separately.",
  },

  // Battery Energy Storage System (BESS) — PACK PRICING ONLY
  bess: {
    pricePerKWh: 350, // $/kWh — PACK ONLY (cells, BMS, thermal mgmt, enclosure). ❌ Excl. PCS & installation.
    pricePerKW: 150, // $/kW — PCS / hybrid inverter (solar+battery+EV dispatch). Priced separately.
    source: "NREL ATB 2024, BloombergNEF",
    notes:
      "Pack cost only. PCS in pricePerKW. Installation/civil in SITE_WORK_COSTS. Guardrails: $105–$250/kWh (DEFAULT_PRICE_GUARDS).",
  },

  // Backup Generator
  generator: {
    pricePerKW: 690, // $/kW for diesel/natural gas genset
    fuelTankCost: 15000, // 24-48 hour runtime tank
    transferSwitchCost: 8000, // Automatic transfer switch
    source: "Industry benchmarks 2024",
    notes: "Industrial-grade genset with ATS and fuel storage",
  },

  // EV Charging Infrastructure — CHARGER UNIT + BASIC INSTALL ONLY
  // ⚠️  These prices DO NOT include electrical service upgrades for DCFC/HPC.
  //     480V 3-phase service, transformers, and switchgear are calculated separately
  //     by addonGuardrails.computeEVInfrastructureRequirements() and added as a
  //     distinct line item (evInfrastructureCost) in calculateSystemCosts().
  evCharging: {
    level2: 7000, // $/unit — 7.2 kW L2: hardware + mounting + 240V circuit run
    dcfc: 50000, // $/unit — 50 kW DCFC: hardware + basic 480V conduit run (assumes 3-phase already present)
    hpc: 150000, // $/unit — 250 kW HPC: hardware + basic 480V conduit run (assumes adequate service)
    source: "DOE Alternative Fuels Data Center, evChargingCalculations.ts",
    notes:
      "Unit price = charger hardware + mounting + conduit run. Electrical service upgrade (480V, transformer) is a SEPARATE line item computed by addonGuardrails.ts.",
  },
} as const;

// ============================================================================
// SITE WORK & SOFT COSTS
// ============================================================================

export const SITE_WORK_COSTS = {
  structuralEngineering: 3500,
  monitoringHardware: 4000,
  interconnectionStudy: 2500,
  concretePad: 5000, // For BESS + generator
  trenchingConduit: 5000,
  commissioning: 3500,
  asBuiltDrawings: 1500,
  necSignage: 800,

  // Total baseline site work
  get total(): number {
    return (
      this.structuralEngineering +
      this.monitoringHardware +
      this.interconnectionStudy +
      this.concretePad +
      this.trenchingConduit +
      this.commissioning +
      this.asBuiltDrawings +
      this.necSignage
    );
  },
} as const;

/**
 * Non-labor soft costs — included in the equipment quote.
 * Engineering, permits, monitoring hardware, documentation.
 */
export const SOFT_COSTS = {
  structuralEngineering: 3500, // PE/structural stamped drawings
  monitoringHardware: 4000, // Monitoring hardware + software (IoT, SCADA)
  interconnectionStudy: 2500, // Utility interconnection study + filing fees
  asBuiltDrawings: 1500, // As-built documentation package
  necSignage: 800, // NEC-required safety signage (materials)

  get total(): number {
    return (
      this.structuralEngineering +
      this.monitoringHardware +
      this.interconnectionStudy +
      this.asBuiltDrawings +
      this.necSignage
    );
  },
} as const;

/**
 * Installation & field labor costs — ADDITIONAL COSTS, shown separately from
 * the equipment quote. NOT included in the Merlin equipment/software quote.
 * Displayed as a separate line per quote policy (human labor costs).
 */
export const INSTALLATION_COSTS = {
  concretePad: 5000, // BESS + generator foundation: concrete pour, rebar
  trenchingConduit: 5000, // Underground conduit runs, cable trays
  commissioning: 3500, // System startup, testing, utility inspection

  get total(): number {
    return this.concretePad + this.trenchingConduit + this.commissioning;
  },
} as const;

export const CONSTRUCTION_CONTINGENCY_RATE = 0.075; // 7.5% industry standard

// ============================================================================
// ANNUAL OPERATING RESERVES (Honest TCO)
// ============================================================================

export const ANNUAL_RESERVES = {
  insuranceRider: 1250, // $/year for property insurance rider
  inverterReplacementReserve: (solarKW: number) => solarKW * 1000 * 0.01, // $0.01/W/yr
  // LFP capacity fade reserve: 2% of pack value/yr (industry standard)
  // For 350 kWh @ $350/kWh = $2,450/yr vs. old flat $500 (84% underfunded)
  bessLegradationReserve: (bessKWh: number, bessPackPricePerKWh?: number) =>
    bessKWh * (bessPackPricePerKWh ?? EQUIPMENT_UNIT_COSTS.bess.pricePerKWh) * 0.02,

  // Calculate total annual reserves
  total: (solarKW: number, bessKWh = 0): number => {
    return (
      ANNUAL_RESERVES.insuranceRider +
      ANNUAL_RESERVES.inverterReplacementReserve(solarKW) +
      ANNUAL_RESERVES.bessLegradationReserve(bessKWh)
    );
  },
} as const;

// ============================================================================
// MERLIN AI SERVICES - TIERED MARGIN STRUCTURE
// ============================================================================

/**
 * Calculate Merlin service fees based on equipment subtotal
 * Implements tiered margin: 20% (small) → 14% (medium) → 13% (large)
 */
export function calculateMerlinFees(equipmentSubtotal: number): {
  designIntelligence: number;
  procurementSourcing: number;
  pmConstruction: number;
  incentiveFiling: number;
  totalFee: number;
  annualMonitoring: number;
  effectiveMargin: number;
} {
  // Rates calibrated for equipment-only quote basis (labor excluded from quote).
  // Higher vs. EPC model: Merlin provides design intelligence, procurement,
  // software platform, and incentive filing; field labor is a separate cost center.
  let marginRate: number;
  if (equipmentSubtotal < 200000) {
    marginRate = 0.22; // 22% for small projects (<$200K)
  } else if (equipmentSubtotal < 800000) {
    marginRate = 0.17; // 17% for medium projects ($200K–$800K)
  } else {
    marginRate = 0.15; // 15% for large projects (>$800K)
  }

  const totalFee = equipmentSubtotal * marginRate;

  // Breakdown of fees (approximate distribution)
  const designIntelligence = totalFee * 0.14; // ~14% of total fee
  const procurementSourcing = totalFee * 0.65; // ~65% of total fee (largest component)
  const pmConstruction = totalFee * 0.16; // ~16% of total fee
  const incentiveFiling = totalFee * 0.05; // ~5% of total fee

  return {
    designIntelligence: Math.round(designIntelligence),
    procurementSourcing: Math.round(procurementSourcing),
    pmConstruction: Math.round(pmConstruction),
    incentiveFiling: Math.round(incentiveFiling),
    totalFee: Math.round(totalFee),
    annualMonitoring: 580, // Fixed annual monitoring fee
    effectiveMargin: marginRate,
  };
}

// ============================================================================
// FINANCIAL CALCULATIONS
// ============================================================================

export const FEDERAL_ITC_RATE = 0.3; // 30% Investment Tax Credit (IRA 2022)

/**
 * Calculate Federal ITC for eligible installed costs.
 *
 * IRA 2022 (IRC Section 48) — credit basis includes all capitalized costs to
 * acquire, engineer, construct, and commission the qualified energy property:
 *   ✅ Equipment (solar + BESS)
 *   ✅ Site engineering & construction (site work, contingency)
 *   ❌ Developer/service fees (Merlin AI fees — excluded as soft costs)
 *   ❌ EV chargers and generators (not qualified energy property under Sec 48)
 *
 * Omitting site work / contingency understates the credit by ~$13K on a
 * typical $291K commercial install — now corrected.
 */
export function calculateFederalITC(costs: {
  solar?: number;
  bess?: number;
  generator?: number;
  evCharging?: number;
  siteEngineering?: number;
  constructionContingency?: number;
  installationLabor?: number; // field labor: concrete, trenching, commissioning
}): number {
  // ITC-eligible basis per IRA 2022 Section 48: all capitalized installed costs
  // for qualified energy property — equipment + labor + site engineering.
  const itcEligible =
    (costs.solar || 0) +
    (costs.bess || 0) +
    (costs.siteEngineering || 0) +
    (costs.constructionContingency || 0) +
    (costs.installationLabor || 0);
  return itcEligible * FEDERAL_ITC_RATE;
}

/**
 * Calculate construction contingency (7.5% of hard costs)
 */
export function calculateConstructionContingency(hardCosts: number): number {
  return hardCosts * CONSTRUCTION_CONTINGENCY_RATE;
}

// ============================================================================
// COMPLETE COST CALCULATION
// ============================================================================

export interface EquipmentConfig {
  solarKW?: number;
  bessKW?: number;
  bessKWh?: number;
  generatorKW?: number;
  /** 'natural-gas' | 'diesel' | 'dual-fuel'. Affects $/kW rate and whether a
   *  fuel storage tank is required. Natural gas generators draw from the utility
   *  line — no tank needed. Defaults to 'diesel' when omitted. */
  generatorFuelType?: string;
  level2Chargers?: number;
  dcfcChargers?: number;
  hpcChargers?: number;
  /**
   * Override solar $/W from supplier DB (effective price incl. any tariff adder).
   * When omitted, falls back to EQUIPMENT_UNIT_COSTS.solar.pricePerWatt (SSOT default: $1.00/W).
   */
  solarPricePerWattOverride?: number;
  /**
   * Override BESS pack $/kWh from supplier DB (effective price incl. any tariff adder).
   * When omitted, falls back to EQUIPMENT_UNIT_COSTS.bess.pricePerKWh (SSOT default: $350/kWh).
   */
  bessPackPricePerKWhOverride?: number;
  /**
   * Override BESS PCS/inverter $/kW from supplier DB.
   * When omitted, falls back to EQUIPMENT_UNIT_COSTS.bess.pricePerKW (SSOT default: $150/kW).
   */
  bessInverterPricePerKWOverride?: number;
}

export interface CostBreakdown {
  // Equipment costs
  solarCost: number;
  bessCost: number;
  generatorCost: number;
  evChargingCost: number; // Charger unit prices only
  evInfrastructureCost: number; // 480V service, transformer, panel — SEPARATE from charger unit price
  equipmentSubtotal: number;

  // Site work & soft costs
  siteEngineering: number;
  constructionContingency: number;

  // Subtotal before Merlin fees
  subtotalBeforeMerlin: number;

  // Merlin AI services
  merlinFees: ReturnType<typeof calculateMerlinFees>;

  // Total investment
  totalInvestment: number;

  // Incentives
  federalITC: number;
  netInvestment: number;

  // Solar field installation labor (subset of installationLaborCost — ITC-eligible per §48)
  solarLaborCost: number;
  // Installation & field labor (ADDITIONAL COSTS — NOT in equipment quote, shown separately)
  installationLaborCost: number;
  // Total project cost (equipment quote + installation labor) — true ROI/NPV investment basis
  totalProjectCost: number;

  // Annual operating reserves
  annualReserves: number;
}

/**
 * Calculate complete cost breakdown with v4.5 validated logic
 */
export function calculateSystemCosts(config: EquipmentConfig): CostBreakdown {
  // Validation: check for negative values
  if (
    (config.solarKW || 0) < 0 ||
    (config.bessKW || 0) < 0 ||
    (config.bessKWh || 0) < 0 ||
    (config.generatorKW || 0) < 0 ||
    (config.level2Chargers || 0) < 0 ||
    (config.dcfcChargers || 0) < 0 ||
    (config.hpcChargers || 0) < 0
  ) {
    throw new Error("Equipment quantities cannot be negative");
  }

  // Equipment costs (pricePerWatt = equipment/BOS only — NO field labor)
  // Use solarPricePerWattOverride (from supplier DB) when provided, else SSOT default
  const effectiveSolarPricePerWatt =
    config.solarPricePerWattOverride ?? EQUIPMENT_UNIT_COSTS.solar.pricePerWatt;
  const solarCost = (config.solarKW || 0) * effectiveSolarPricePerWatt * 1000;
  const solarLaborCost = (config.solarKW || 0) * EQUIPMENT_UNIT_COSTS.solar.laborPerWatt * 1000;

  // Use supplier DB overrides when provided; SSOT constants as fallback.
  const effectiveBessPackPricePerKWh =
    config.bessPackPricePerKWhOverride ?? EQUIPMENT_UNIT_COSTS.bess.pricePerKWh;
  const effectiveBessPCSPricePerKW =
    config.bessInverterPricePerKWOverride ?? EQUIPMENT_UNIT_COSTS.bess.pricePerKW;
  const bessCost =
    (config.bessKWh || 0) * effectiveBessPackPricePerKWh +
    (config.bessKW || 0) * effectiveBessPCSPricePerKW;

  const isNaturalGasGenerator = (config.generatorFuelType ?? "diesel") === "natural-gas";
  // Natural gas: $500/kW (piped supply, no on-site tank) + ATS only
  // Diesel: $690/kW (stored fuel) + $15K tank + $8K ATS
  const genPricePerKW = isNaturalGasGenerator ? 500 : EQUIPMENT_UNIT_COSTS.generator.pricePerKW;
  const genFuelTank = isNaturalGasGenerator ? 0 : EQUIPMENT_UNIT_COSTS.generator.fuelTankCost;
  const generatorCost =
    (config.generatorKW || 0) * genPricePerKW +
    (config.generatorKW ? genFuelTank : 0) +
    (config.generatorKW ? EQUIPMENT_UNIT_COSTS.generator.transferSwitchCost : 0);

  const evChargingCost =
    (config.level2Chargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.level2 +
    (config.dcfcChargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.dcfc +
    (config.hpcChargers || 0) * EQUIPMENT_UNIT_COSTS.evCharging.hpc;

  // EV electrical infrastructure — computed by addonGuardrails.ts (NEC/SAE/DOE).
  // This is SEPARATE from charger unit prices above. Covers:
  //   L2 only: basic 240V circuit additions (low cost)
  //   DCFC:    480V 3-phase service entry, conduit runs (often $20K+ for 1st DCFC)
  //   HPC:     dedicated 480V switchgear + transformer (often $35K+ per HPC)
  // utilityRate=0 here because infrastructure cost doesn't depend on rate
  const evInfra = computeEVInfrastructureRequirements({
    l2Count: config.level2Chargers || 0,
    dcfcCount: config.dcfcChargers || 0,
    hpcCount: config.hpcChargers || 0,
    utilityRate: 0, // rate not needed for infrastructure cost calculation
  });
  const evInfrastructureCost = evInfra.electricalInfrastructureCost;

  // Equipment subtotal includes BOTH charger unit cost AND infrastructure cost
  const equipmentSubtotal =
    solarCost + bessCost + generatorCost + evChargingCost + evInfrastructureCost;

  // Non-labor soft costs only (engineering, permits, monitoring hardware)
  // Labor (concrete pad, trenching, commissioning) is in installationLaborCost below
  const siteEngineering = SOFT_COSTS.total;

  // Construction contingency (7.5% of equipment + soft costs)
  const constructionContingency = calculateConstructionContingency(
    equipmentSubtotal + siteEngineering
  );

  const subtotalBeforeMerlin = equipmentSubtotal + siteEngineering + constructionContingency;

  // Merlin AI services (tiered margin)
  const merlinFees = calculateMerlinFees(equipmentSubtotal);

  // Total investment
  const totalInvestment = subtotalBeforeMerlin + merlinFees.totalFee;

  // Installation & field labor — ADDITIONAL COSTS (not in equipment quote)
  const installationLaborCost = solarLaborCost + INSTALLATION_COSTS.total;

  // Federal ITC basis — IRA 2022 Section 48 / 48E:
  // Only "qualified energy property" costs are eligible: solar (equip + labor),
  // BESS, and the share of soft costs / contingency attributable to those assets.
  // Generator costs (fossil fuel) and EV charging infrastructure are NOT eligible.
  // Merlin fees are also excluded from the ITC basis.
  //
  // Soft cost proration: siteEngineering and constructionContingency are split
  // proportionally between ITC-eligible (solar+BESS) and non-eligible (gen+EV)
  // hard costs per standard cost-segregation practice.
  const hasQualifyingEquipment = solarCost + bessCost > 0;
  const itcEligibleHardCosts = solarCost + solarLaborCost + bessCost;
  const totalHardCosts = equipmentSubtotal + solarLaborCost; // all equip + solar labor
  const itcEligibleFraction = totalHardCosts > 0 ? itcEligibleHardCosts / totalHardCosts : 0;
  const proratedSiteEngineering = siteEngineering * itcEligibleFraction;
  const proratedContingency = constructionContingency * itcEligibleFraction;
  const proratedInstallLabor = INSTALLATION_COSTS.total * itcEligibleFraction;

  const federalITC = hasQualifyingEquipment
    ? calculateFederalITC({
        solar: solarCost + solarLaborCost,
        bess: bessCost,
        siteEngineering: proratedSiteEngineering,
        constructionContingency: proratedContingency,
        installationLabor: proratedInstallLabor,
      })
    : 0;

  // Quote total (equipment + soft costs + contingency + Merlin fee) — NO labor
  // totalProjectCost = full project (quote + labor) — ROI/NPV investment basis
  const totalProjectCost = totalInvestment + installationLaborCost;
  const netInvestment = totalProjectCost - federalITC;

  // Annual operating reserves
  const annualReserves = ANNUAL_RESERVES.total(config.solarKW || 0, config.bessKWh || 0);

  return {
    solarCost: Math.round(solarCost),
    bessCost: Math.round(bessCost),
    generatorCost: Math.round(generatorCost),
    evChargingCost: Math.round(evChargingCost),
    evInfrastructureCost: Math.round(evInfrastructureCost),
    equipmentSubtotal: Math.round(equipmentSubtotal),
    siteEngineering: Math.round(siteEngineering),
    constructionContingency: Math.round(constructionContingency),
    subtotalBeforeMerlin: Math.round(subtotalBeforeMerlin),
    merlinFees,
    totalInvestment: Math.round(totalInvestment),
    federalITC: Math.round(federalITC),
    netInvestment: Math.round(netInvestment),
    solarLaborCost: Math.round(solarLaborCost),
    installationLaborCost: Math.round(installationLaborCost),
    totalProjectCost: Math.round(totalProjectCost),
    annualReserves: Math.round(annualReserves),
  };
}

// ============================================================================
// SAVINGS CALCULATIONS (Honest projections)
// ============================================================================

export interface SavingsInputs {
  // Equipment configuration
  bessKW: number;
  bessKWh: number;
  solarKW: number;
  generatorKW: number;
  evChargers: number; // total count (fallback when typed counts not provided)
  l2Chargers?: number; // Level 2 charger count (for per-type revenue calc)
  dcfcChargers?: number; // DC Fast Charger count
  hpcChargers?: number; // High Power Charger count

  // Utility rates
  electricityRate: number; // $/kWh
  demandCharge: number; // $/kW
  peakRate?: number; // $/kWh for TOU arbitrage
  hasTOU?: boolean;

  // Operating parameters
  sunHoursPerDay?: number; // Average for location
  cyclesPerYear?: number; // Battery cycles

  // Facility context (used for industry-specific savings, e.g. hospital downtime avoidance)
  industry?: string;
}

export interface SavingsBreakdown {
  // Annual savings by source
  demandChargeSavings: number;
  touArbitrageSavings: number;
  solarSavings: number;
  evChargingRevenue: number;
  generatorBackupValue: number;
  grossAnnualSavings: number;

  // Annual costs/reserves
  annualReserves: number;
  netAnnualSavings: number;
}

/**
 * Calculate annual savings with honest reserves deduction
 */
export function calculateAnnualSavings(inputs: SavingsInputs, solarKW: number): SavingsBreakdown {
  // Warn on unrealistic electricity rates (>$1/kWh is unrealistic for commercial)
  if (inputs.electricityRate > 1.0) {
    console.warn(
      `Unrealistic electricity rate: $${inputs.electricityRate}/kWh. Typical commercial rates are $0.08–$0.30/kWh.`
    );
  }

  // BESS Demand Charge Savings
  // Commercial BESS demand management effectiveness: 75% (NREL/EPRI benchmark
  // for purpose-built demand-charge BESS — reflects months where peak is
  // successfully clipped vs. months where SOC or dispatch timing falls short)
  const demandChargeSavings = inputs.bessKW * inputs.demandCharge * 12 * 0.75;

  // BESS TOU Arbitrage (if applicable)
  let touArbitrageSavings = 0;
  if (inputs.hasTOU && inputs.peakRate) {
    const spread = inputs.peakRate - inputs.electricityRate;
    const cyclesPerYear = inputs.cyclesPerYear || 250;
    const dod = 0.8; // Depth of discharge
    touArbitrageSavings = inputs.bessKWh * dod * spread * cyclesPerYear;
  }

  // Solar Savings
  // NREL methodology: production = systemKW × GHI_PSH × 365 × PR
  // PR = 0.77 accounts for DC wiring losses, inverter efficiency, soiling, temperature
  const sunHoursPerDay = inputs.sunHoursPerDay || 5;
  const PR = 0.77; // Performance Ratio (NREL standard for commercial C&I solar)
  const solarKWhProduced = inputs.solarKW * sunHoursPerDay * 365 * PR;
  const solarSavings = solarKWhProduced * inputs.electricityRate;

  // EV Charging Revenue by charger type (DOE/EVI benchmarks, 300 operating days/yr)
  // L2 (7.2 kW):    $3/session  × 1.5 sessions/day × 300 days = $1,350/charger/yr
  // DCFC (50 kW):   $12/session × 5 sessions/day   × 300 days = $18,000/charger/yr
  // HPC (150+ kW):  $25/session × 8 sessions/day   × 300 days = $60,000/charger/yr
  let evChargingRevenue: number;
  if (inputs.l2Chargers != null || inputs.dcfcChargers != null || inputs.hpcChargers != null) {
    const l2 = inputs.l2Chargers ?? 0;
    const dcfc = inputs.dcfcChargers ?? 0;
    const hpc = inputs.hpcChargers ?? 0;
    evChargingRevenue = l2 * 3 * 1.5 * 300 + dcfc * 12 * 5 * 300 + hpc * 25 * 8 * 300;
  } else {
    // Fallback: treat all as L2 (conservative — avoids prior 4x overestimate)
    evChargingRevenue = inputs.evChargers * 1350;
  }

  // Generator Backup Value (avoided downtime costs)
  // For hospitals (NEC 517 / NFPA 99 critical facilities), a backup generator
  // actively avoids costs from regulatory fines, life-safety events, and lost
  // revenue from generator-dependent clinical operations (ORs, ICU, imaging).
  // Estimate: 2 avoided outage events/yr × 4 hrs × $7,500/hr avoided cost = $60K/yr.
  // Source: ASHE (American Society for Healthcare Engineering) facility risk studies.
  // For all other industries, generator backup value remains $0 (hard to quantify generally).
  const generatorBackupValue =
    inputs.industry === "hospital" && inputs.generatorKW > 0
      ? 2 * 4 * 7500 // 2 events/yr × 4 hr/event × $7,500/hr = $60,000/yr
      : 0;

  const grossAnnualSavings =
    demandChargeSavings +
    touArbitrageSavings +
    solarSavings +
    evChargingRevenue +
    generatorBackupValue;

  // Deduct annual operating reserves for honest TCO
  const annualReserves = ANNUAL_RESERVES.total(solarKW, inputs.bessKWh);
  const netAnnualSavings = grossAnnualSavings - annualReserves;

  return {
    demandChargeSavings: Math.round(demandChargeSavings),
    touArbitrageSavings: Math.round(touArbitrageSavings),
    solarSavings: Math.round(solarSavings),
    evChargingRevenue: Math.round(evChargingRevenue),
    generatorBackupValue: Math.round(generatorBackupValue),
    grossAnnualSavings: Math.round(grossAnnualSavings),
    annualReserves: Math.round(annualReserves),
    netAnnualSavings: Math.round(netAnnualSavings),
  };
}

// ============================================================================
// ROI CALCULATIONS (Honest financial metrics)
// ============================================================================

export interface ROIMetrics {
  paybackYears: number;
  year1ROI: number; // First year ROI %
  roi10Year: number; // 10-year ROI %
  roi25Year: number; // 25-year ROI %
  npv25Year: number; // Net Present Value over 25 years
}

/**
 * Calculate financial metrics with honest projections
 */
export function calculateROI(
  netInvestment: number,
  netAnnualSavings: number,
  discountRate: number = 0.05 // 5% discount rate for NPV
): ROIMetrics {
  // Validation: prevent division by zero and negative values
  if (netInvestment <= 0) {
    console.warn("⚠️ Invalid netInvestment (<=0), returning default metrics");
    return {
      paybackYears: 999,
      year1ROI: 0,
      roi10Year: 0,
      roi25Year: 0,
      npv25Year: 0,
    };
  }

  if (netAnnualSavings <= 0) {
    console.warn("⚠️ Invalid netAnnualSavings (<=0), system will not pay back");
    return {
      paybackYears: 999,
      year1ROI: -100,
      roi10Year: -100,
      roi25Year: -100,
      npv25Year: -netInvestment,
    };
  }

  // Simple payback
  const paybackYears = netInvestment / netAnnualSavings;

  // Year 1 ROI
  const year1ROI = (netAnnualSavings / netInvestment) * 100;

  // 10-Year ROI
  const savings10Year = netAnnualSavings * 10;
  const roi10Year = ((savings10Year - netInvestment) / netInvestment) * 100;

  // 25-Year ROI
  const savings25Year = netAnnualSavings * 25;
  const roi25Year = ((savings25Year - netInvestment) / netInvestment) * 100;

  // 25-Year NPV (discounted cash flow)
  let npv25Year = -netInvestment;
  for (let year = 1; year <= 25; year++) {
    npv25Year += netAnnualSavings / Math.pow(1 + discountRate, year);
  }

  return {
    paybackYears: Math.round(paybackYears * 10) / 10, // 1 decimal place
    year1ROI: Math.round(year1ROI),
    roi10Year: Math.round(roi10Year),
    roi25Year: Math.round(roi25Year),
    npv25Year: Math.round(npv25Year),
  };
}

// ============================================================================
// CONVENIENCE EXPORT - Complete calculation
// ============================================================================

export interface CompleteFinancialAnalysis {
  costs: CostBreakdown;
  savings: SavingsBreakdown;
  roi: ROIMetrics;
}

/**
 * One-stop function for complete financial analysis
 */
export function calculateCompleteFinancials(
  equipment: EquipmentConfig,
  savingsInputs: SavingsInputs
): CompleteFinancialAnalysis {
  const costs = calculateSystemCosts(equipment);
  const savings = calculateAnnualSavings(savingsInputs, equipment.solarKW || 0);
  const roi = calculateROI(costs.netInvestment, savings.netAnnualSavings);

  return {
    costs,
    savings,
    roi,
  };
}
