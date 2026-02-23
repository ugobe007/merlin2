/**
 * Step 5 MagicFit — shared types, helpers, and pure calculation functions.
 * Extracted from Step5MagicFitV7.tsx (Op4, February 22, 2026).
 */
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import type { EnergyGoal, QuoteOutput } from "@/wizard/v7/hooks/useWizardV7";
import { applyMarginToQuote } from "@/wizard/v7/pricing/pricingBridge";
import { useMerlinData } from "@/wizard/v7/memory/useMerlinData";
import type { QuoteResult } from "@/services/unifiedQuoteCalculator";

export type TierKey = "starter" | "perfectFit" | "beastMode";

export interface TierConfig {
  name: string;
  tagline: string;
  multiplier: number; // BESS sizing multiplier vs base
  solarMultiplier: number; // Solar sizing vs base
  genMultiplier: number; // Generator sizing vs base
  headlineClass: string;
  cardBorder: string;
  cardBg: string;
  accentColor: string;
  buttonClass: string;
}

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  starter: {
    name: "STARTER",
    tagline: "Save More",
    multiplier: 0.75,
    solarMultiplier: 0.5,
    genMultiplier: 0.8,
    headlineClass: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
    cardBorder: "border-white/[0.06]",
    cardBg: "bg-white/[0.02]",
    accentColor: "text-emerald-400",
    buttonClass:
      "text-slate-300 bg-transparent border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04]",
  },
  perfectFit: {
    name: "PERFECT FIT",
    tagline: "Best Value",
    multiplier: 1.0,
    solarMultiplier: 1.0,
    genMultiplier: 1.0,
    headlineClass: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
    cardBorder: "border-[#3ECF8E]/30",
    cardBg: "bg-white/[0.03]",
    accentColor: "text-[#3ECF8E]",
    buttonClass: "text-[#0D0D0D] bg-[#3ECF8E] hover:bg-[#3ECF8E]/90",
  },
  beastMode: {
    name: "BEAST MODE",
    tagline: "Full Power",
    multiplier: 1.4,
    solarMultiplier: 1.5,
    genMultiplier: 1.25,
    headlineClass: "text-2xl lg:text-3xl font-bold tracking-tight text-white",
    cardBorder: "border-white/[0.06]",
    cardBg: "bg-white/[0.02]",
    accentColor: "text-amber-400",
    buttonClass:
      "text-slate-300 bg-transparent border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.04]",
  },
};

export interface TierQuote {
  tierKey: TierKey;
  config: TierConfig;
  quote: QuoteResult;
  loading: boolean;
  error: string | null;
}

/** Margin data attached to QuoteResult at runtime by scaleTier() */
export interface MarginData {
  sellPriceTotal: number;
  baseCostTotal: number;
  marginDollars: number;
  marginPercent: number;
  marginBand: string;
  itcRate: number;
  itcAmount: number;
  netCost: number;
}

/** QuoteResult extended with optional margin overlay */
export type QuoteWithMargin = QuoteResult & { _margin?: MarginData };

export function formatCurrency(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "$0";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function safeFixed(value: number | undefined | null, digits: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function getIndustryLabel(slug: string): string {
  return getIndustryMeta(slug).label || slug.replace(/_/g, " ");
}

/**
 * Analyze user's energy goals and return sizing multipliers
 *
 * Goals influence:
 * - BESS capacity (backup_power, energy_independence → larger)
 * - Duration (backup_power → longer)
 * - Solar sizing (reduce_carbon, energy_independence → more solar)
 * - Generator sizing (backup_power → larger backup)
 */
export function getGoalBasedMultipliers(goals: EnergyGoal[]) {
  const modifiers = {
    bessMultiplier: 1.0,
    durationMultiplier: 1.0,
    solarMultiplier: 1.0,
    generatorMultiplier: 1.0,
    recommendedTier: "perfectFit" as TierKey,
    goalHints: [] as string[],
  };

  // No goals selected → return defaults
  if (goals.length === 0) {
    return modifiers;
  }

  // GOAL: Lower Bills → optimize for cost, smaller system
  if (goals.includes("lower_bills")) {
    modifiers.bessMultiplier *= 0.9; // Slightly smaller BESS
    modifiers.solarMultiplier *= 1.1; // More solar = more savings
    modifiers.recommendedTier = "starter";
    modifiers.goalHints.push("Optimized for fast payback with solar self-consumption");
  }

  // GOAL: Backup Power → larger capacity, longer duration
  if (goals.includes("backup_power")) {
    modifiers.bessMultiplier *= 1.15; // 15% larger BESS
    modifiers.durationMultiplier *= 1.5; // 6 hours instead of 4
    modifiers.generatorMultiplier *= 1.2; // Larger backup generator
    modifiers.recommendedTier = "perfectFit";
    modifiers.goalHints.push("Extended duration for reliable backup power");
  }

  // GOAL: Reduce Carbon → maximize renewables
  if (goals.includes("reduce_carbon")) {
    modifiers.solarMultiplier *= 1.4; // Much more solar
    modifiers.bessMultiplier *= 1.1; // Larger battery to store solar
    modifiers.generatorMultiplier *= 0.7; // Smaller/no generator
    modifiers.goalHints.push("Maximize solar + storage for zero-carbon operation");
  }

  // GOAL: Energy Independence → go big on everything
  if (goals.includes("energy_independence")) {
    modifiers.bessMultiplier *= 1.3; // Much larger BESS
    modifiers.solarMultiplier *= 1.5; // Maximum solar
    modifiers.generatorMultiplier *= 1.3; // Full backup capability
    modifiers.durationMultiplier *= 1.25; // 5 hours
    modifiers.recommendedTier = "beastMode";
    modifiers.goalHints.push("Oversized system for true grid independence");
  }

  // GOAL: Reduce Demand Charges → optimize for peak shaving
  if (goals.includes("reduce_demand_charges")) {
    modifiers.bessMultiplier *= 1.05; // Slightly larger for peaks
    modifiers.solarMultiplier *= 0.9; // Less solar, more battery focus
    modifiers.goalHints.push("Sized for aggressive peak demand reduction");
  }

  return modifiers;
}

// ═════════════════════════════════════════════════════════════════════════════
// PURE-MATH TIER SCALING
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Scale a base QuoteResult to a tier using pure math multipliers.
 *
 * Equipment sizes scale linearly by the tier multiplier.
 * Costs scale linearly (BESS $/kWh is constant, solar $/W is constant, etc.)
 * Savings scale linearly with system size.
 * Payback = netCost / annualSavings (recalculated from scaled values).
 * NPV and IRR are re-derived from the scaled cost/savings.
 */
export function scaleTier(
  base: QuoteResult,
  tierKey: TierKey,
  config: TierConfig,
  baseDuration: number,
  baseMargin: {
    sellPriceTotal: number;
    baseCostTotal: number;
    marginDollars: number;
    marginPercent: number;
    marginBand: string;
    itcRate: number;
    itcAmount: number;
    netCost: number;
  } | null,
  maxRoofSolarMW?: number, // Cap from solar sizing (roof-only, no canopy)
  maxTotalSolarMW?: number // Cap from INDUSTRY_FACILITY_CONSTRAINTS (roof + canopy physical limit)
): TierQuote {
  // For perfectFit (1.0x multipliers), just return the base directly
  if (config.multiplier === 1.0 && config.solarMultiplier === 1.0 && config.genMultiplier === 1.0) {
    // Attach margin as-is
    if (baseMargin) {
      (base as QuoteWithMargin)._margin = { ...baseMargin };
    }
    return { tierKey, config, quote: base, loading: false, error: null };
  }

  // Composite cost-scaling factor:
  // BESS dominates cost (~60-70%), solar is secondary (~15-25%), gen is minor (~10%)
  // We use a weighted blend of the multipliers to scale total costs
  const baseCosts = base.costs;
  const baseFinancials = base.financials;
  const baseEquipment = base.equipment;

  // Scale equipment individually
  const scaledBatteries = baseEquipment.batteries
    ? {
        ...baseEquipment.batteries,
        unitPowerMW: baseEquipment.batteries.unitPowerMW * config.multiplier,
        unitEnergyMWh: baseEquipment.batteries.unitEnergyMWh * config.multiplier,
        totalCost: baseEquipment.batteries.totalCost * config.multiplier,
      }
    : baseEquipment.batteries;

  const scaledInverters = {
    ...baseEquipment.inverters,
    unitPowerMW: baseEquipment.inverters.unitPowerMW * config.multiplier,
    totalCost: baseEquipment.inverters.totalCost * config.multiplier,
  };

  const scaledTransformers = {
    ...baseEquipment.transformers,
    totalCost: baseEquipment.transformers.totalCost * config.multiplier,
  };

  const scaledSwitchgear = {
    ...baseEquipment.switchgear,
    totalCost: baseEquipment.switchgear.totalCost * config.multiplier,
  };

  // Solar scaling: cap to physical building constraints (roof + canopy)
  // Vineet: "Solar 165kW will not fit in an automated car wash" — respect physics
  let solarScale = config.solarMultiplier;
  if (maxRoofSolarMW && maxRoofSolarMW > 0 && baseEquipment.solar && baseEquipment.solar.totalMW > 0) {
    const rawScaledMW = baseEquipment.solar.totalMW * config.solarMultiplier;
    if (config.solarMultiplier < 1.0) {
      // Starter: use roof-only solar (physically meaningful, not arbitrary fraction)
      solarScale = Math.min(maxRoofSolarMW, rawScaledMW) / baseEquipment.solar.totalMW;
    } else if (config.solarMultiplier > 1.0) {
      // BeastMode: allow scaling above base but not below roof-only
      solarScale = Math.max(solarScale, maxRoofSolarMW / baseEquipment.solar.totalMW);
    }
  }

  // Hard cap: total solar (roof + canopy) must not exceed physical building limit
  if (maxTotalSolarMW && maxTotalSolarMW > 0 && baseEquipment.solar && baseEquipment.solar.totalMW > 0) {
    const scaledMW = baseEquipment.solar.totalMW * solarScale;
    if (scaledMW > maxTotalSolarMW) {
      solarScale = maxTotalSolarMW / baseEquipment.solar.totalMW;
    }
  }

  const scaledSolar = baseEquipment.solar
    ? {
        ...baseEquipment.solar,
        totalMW: baseEquipment.solar.totalMW * solarScale,
        panelQuantity: Math.ceil(baseEquipment.solar.panelQuantity * solarScale),
        totalCost: baseEquipment.solar.totalCost * solarScale,
      }
    : undefined;

  const scaledGenerators = baseEquipment.generators
    ? {
        ...baseEquipment.generators,
        unitPowerMW: baseEquipment.generators.unitPowerMW * config.genMultiplier,
        totalCost: baseEquipment.generators.totalCost * config.genMultiplier,
      }
    : undefined;

  // Sum individual equipment costs for new total
  const scaledEquipmentCost =
    (scaledBatteries?.totalCost ?? 0) +
    scaledInverters.totalCost +
    scaledTransformers.totalCost +
    scaledSwitchgear.totalCost +
    (scaledSolar?.totalCost ?? 0) +
    (scaledGenerators?.totalCost ?? 0);

  // Installation scales with equipment cost (same ratio as base)
  const installRatio =
    baseCosts.equipmentCost > 0 ? baseCosts.installationCost / baseCosts.equipmentCost : 0.25; // sensible fallback: 25%
  const scaledInstallCost = scaledEquipmentCost * installRatio;
  const scaledTotalCost = scaledEquipmentCost + scaledInstallCost;

  // ITC rate stays the same
  const itcRate =
    baseMargin?.itcRate ?? baseCosts.taxCredit / Math.max(baseCosts.totalProjectCost, 1);
  const scaledTaxCredit = scaledTotalCost * itcRate;
  const scaledNetCost = scaledTotalCost - scaledTaxCredit;

  // Savings scale: BESS savings dominate (peak shaving, arbitrage), solar adds production savings
  // Weighted: bessWeight = equipment cost share of BESS, solarWeight = solar share
  const baseBESSCost = base.equipment.batteries?.totalCost ?? 0;
  const baseSolarCost = base.equipment.solar?.totalCost ?? 0;
  const baseGenCost = base.equipment.generators?.totalCost ?? 0;
  const baseTotal = baseBESSCost + baseSolarCost + baseGenCost || 1;
  const savingsMultiplier =
    (baseBESSCost / baseTotal) * config.multiplier +
    (baseSolarCost / baseTotal) * config.solarMultiplier +
    (baseGenCost / baseTotal) * config.genMultiplier;
  const scaledAnnualSavings = baseFinancials.annualSavings * savingsMultiplier;

  // Payback recalculated from scaled values
  const scaledPayback =
    scaledAnnualSavings > 0 ? Math.min(scaledNetCost / scaledAnnualSavings, 99) : 99;

  // ROI: (savings × years - cost) / cost × 100
  const scaledROI10 =
    scaledNetCost > 0 ? ((scaledAnnualSavings * 10 - scaledNetCost) / scaledNetCost) * 100 : 0;
  // NOTE: We keep roi25Year as a computed field for data completeness,
  // but the UI shows a 5yr ROI instead (user-facing timeline = 5-10 years)
  const scaledROI25 =
    scaledNetCost > 0 ? ((scaledAnnualSavings * 25 - scaledNetCost) / scaledNetCost) * 100 : 0;
  const scaledROI5 =
    scaledNetCost > 0 ? ((scaledAnnualSavings * 5 - scaledNetCost) / scaledNetCost) * 100 : 0;

  // NPV: scale proportionally (not exact but good enough for tier comparison)
  const npvScaleFactor =
    baseCosts.netCost > 0 ? scaledNetCost / baseCosts.netCost : savingsMultiplier;
  const scaledNPV = baseFinancials.npv * npvScaleFactor;

  // IRR: stays roughly similar for scaled systems (same cost structure, same savings proportions)
  // Small adjustment: larger systems have slightly lower IRR due to increased capital
  const irrAdjust = config.multiplier > 1 ? 0.98 : config.multiplier < 1 ? 1.02 : 1.0;
  const scaledIRR = baseFinancials.irr * irrAdjust;

  // Overall cost scale factor for installation/commissioning/certification
  const costScale =
    baseCosts.totalProjectCost > 0
      ? scaledTotalCost / baseCosts.totalProjectCost
      : config.multiplier;

  const scaledQuote: QuoteResult = {
    equipment: {
      ...baseEquipment,
      batteries: scaledBatteries,
      inverters: scaledInverters,
      transformers: scaledTransformers,
      switchgear: scaledSwitchgear,
      solar: scaledSolar,
      generators: scaledGenerators,
      // Scale required sub-objects proportionally
      installation: {
        bos: baseEquipment.installation.bos * costScale,
        epc: baseEquipment.installation.epc * costScale,
        contingency: baseEquipment.installation.contingency * costScale,
        totalInstallation: baseEquipment.installation.totalInstallation * costScale,
      },
      commissioning: {
        factoryAcceptanceTest: baseEquipment.commissioning.factoryAcceptanceTest * costScale,
        siteAcceptanceTest: baseEquipment.commissioning.siteAcceptanceTest * costScale,
        scadaIntegration: baseEquipment.commissioning.scadaIntegration * costScale,
        functionalSafetyTest: baseEquipment.commissioning.functionalSafetyTest * costScale,
        performanceTest: baseEquipment.commissioning.performanceTest * costScale,
        totalCommissioning: baseEquipment.commissioning.totalCommissioning * costScale,
      },
      certification: {
        interconnectionStudy: baseEquipment.certification.interconnectionStudy * costScale,
        utilityUpgrades: baseEquipment.certification.utilityUpgrades * costScale,
        environmentalPermits: baseEquipment.certification.environmentalPermits * costScale,
        buildingPermits: baseEquipment.certification.buildingPermits * costScale,
        fireCodeCompliance: baseEquipment.certification.fireCodeCompliance * costScale,
        totalCertification: baseEquipment.certification.totalCertification * costScale,
      },
      annualCosts: {
        operationsAndMaintenance: baseEquipment.annualCosts.operationsAndMaintenance * costScale,
        extendedWarranty: baseEquipment.annualCosts.extendedWarranty * costScale,
        capacityTesting: baseEquipment.annualCosts.capacityTesting * costScale,
        insurancePremium: baseEquipment.annualCosts.insurancePremium * costScale,
        softwareLicenses: baseEquipment.annualCosts.softwareLicenses * costScale,
        totalAnnualCost: baseEquipment.annualCosts.totalAnnualCost * costScale,
        year1Total: baseEquipment.annualCosts.year1Total * costScale,
      },
      totals: {
        equipmentCost: scaledEquipmentCost,
        installationCost: scaledInstallCost,
        commissioningCost: baseEquipment.totals.commissioningCost * costScale,
        certificationCost: baseEquipment.totals.certificationCost * costScale,
        totalCapex: scaledTotalCost,
        totalProjectCost: scaledTotalCost,
        annualOpex: baseEquipment.totals.annualOpex * costScale,
      },
    },
    costs: {
      equipmentCost: scaledEquipmentCost,
      installationCost: scaledInstallCost,
      totalProjectCost: scaledTotalCost,
      taxCredit: scaledTaxCredit,
      netCost: scaledNetCost,
    },
    financials: {
      annualSavings: scaledAnnualSavings,
      paybackYears: scaledPayback,
      roi5Year: scaledROI5,
      roi10Year: scaledROI10,
      roi25Year: scaledROI25,
      npv: scaledNPV,
      irr: scaledIRR,
    },
    metadata: { ...base.metadata },
    benchmarkAudit: { ...base.benchmarkAudit },
  };

  // Apply margin scaling
  if (baseMargin) {
    const scaledSellPrice = scaledTotalCost * (1 + baseMargin.marginPercent);
    const scaledMarginDollars = scaledSellPrice - scaledTotalCost;
    const scaledITCOnSell = scaledSellPrice * baseMargin.itcRate;
    const scaledNetAfterMargin = scaledSellPrice - scaledITCOnSell;

    (scaledQuote as QuoteWithMargin)._margin = {
      sellPriceTotal: scaledSellPrice,
      baseCostTotal: scaledTotalCost,
      marginDollars: scaledMarginDollars,
      marginPercent: baseMargin.marginPercent,
      marginBand: baseMargin.marginBand,
      itcRate: baseMargin.itcRate,
      itcAmount: scaledITCOnSell,
      netCost: scaledNetAfterMargin,
    };
  }

  return { tierKey, config, quote: scaledQuote, loading: false, error: null };
}

/**
 * Build a synthetic QuoteResult from `state.quote` (QuoteOutput).
 * This bridges the gap between what Step 4 stored and what the tier cards render.
 */
export function buildQuoteResultFromState(
  q: QuoteOutput,
  data: ReturnType<typeof useMerlinData>
): QuoteResult {
  const bessKW = q.bessKW ?? 0;
  const bessKWh = q.bessKWh ?? 0;
  // ✅ FIX: Fall back to data.addOns.solarKW if quote didn't capture solar
  // This ensures solar configured in Step 3 isn't lost even if pricing ran without addOns
  const solarKW = q.solarKW ?? (data.addOns.includeSolar ? data.addOns.solarKW : 0);
  const genKW = q.generatorKW ?? (data.addOns.includeGenerator ? data.addOns.generatorKW : 0);
  const _duration = q.durationHours ?? 4;

  // Reconstruct equipment from stored sizing
  const grossCost = q.grossCost ?? q.capexUSD ?? 0;
  const itcRate = q.itcRate ?? 0.3;
  const itcAmount = q.itcAmount ?? grossCost * itcRate;
  const netCost = q.capexUSD ?? grossCost - itcAmount;

  // Estimate equipment cost split (industry standard: equipment ~75%, install ~25%)
  const equipmentCost = grossCost * 0.75;
  const installationCost = grossCost * 0.25;

  // Battery pricing: derive per-kWh cost from total
  const batteryCostShare = 0.55; // Batteries typically 55% of equipment
  const battTotalCost = equipmentCost * batteryCostShare;
  const pricePerKWh = bessKWh > 0 ? battTotalCost / bessKWh : 125;

  // Inverter cost share ~15%
  const invTotalCost = equipmentCost * 0.15;

  // Transformer/switchgear ~10%
  const transTotalCost = equipmentCost * 0.05;
  const sgTotalCost = equipmentCost * 0.05;

  // Solar cost (if applicable)
  // SSOT: costPerWatt is $/W. Total = kW × 1000 (→ W) × $/W = total $
  // Example: 500 kW × 1000 × $0.95/W = $475,000
  const solarCostPerWatt = solarKW >= 5000 ? 0.75 : solarKW >= 100 ? 0.95 : 1.25; // SSOT tiered pricing (Q1 2026)
  const actualSolarCost = solarKW > 0 ? solarKW * 1000 * solarCostPerWatt : 0;

  // Generator cost
  const genCostPerKW = 700;
  const genTotalCost = genKW > 0 ? genKW * genCostPerKW : 0;

  // Estimate sub-costs for required EquipmentBreakdown fields
  const bosEpc = installationCost;
  const commissioningTotal = grossCost * 0.02; // ~2% of project
  const certificationTotal = grossCost * 0.015; // ~1.5%
  const annualOMTotal = grossCost * 0.015; // ~1.5% annual

  return {
    equipment: {
      batteries: {
        quantity: 1,
        unitPowerMW: bessKW / 1000,
        unitEnergyMWh: bessKWh / 1000,
        unitCost: battTotalCost,
        totalCost: battTotalCost,
        manufacturer: "CATL/BYD",
        model: "LFP Commercial",
        pricePerKWh,
      },
      inverters: {
        quantity: Math.max(1, Math.ceil(bessKW / 500)),
        unitPowerMW: Math.min(bessKW, 500) / 1000,
        unitCost: invTotalCost / Math.max(1, Math.ceil(bessKW / 500)),
        totalCost: invTotalCost,
        manufacturer: "SMA/Sungrow",
        model: "Commercial PCS",
      },
      transformers: {
        quantity: 1,
        unitPowerMVA: (bessKW / 1000) * 1.1,
        unitCost: transTotalCost,
        totalCost: transTotalCost,
        voltage: "480V/12.47kV",
        manufacturer: "ABB/Eaton",
      },
      switchgear: {
        quantity: 1,
        unitCost: sgTotalCost,
        totalCost: sgTotalCost,
        type: "Metal-Enclosed",
        voltage: "480V",
      },
      ...(solarKW > 0
        ? {
            solar: {
              totalMW: solarKW / 1000,
              panelQuantity: Math.ceil(solarKW / 0.4), // ~400W panels
              inverterQuantity: Math.max(1, Math.ceil(solarKW / 100)),
              totalCost: actualSolarCost,
              costPerWatt: solarCostPerWatt,
              priceCategory: solarKW >= 5000 ? "utility" : "commercial",
              spaceRequirements: {
                rooftopAreaSqFt: 0,
                groundAreaSqFt: 0,
                rooftopAreaAcres: 0,
                groundAreaAcres: 0,
                isFeasible: true,
                constraints: [],
              },
            },
          }
        : {}),
      ...(genKW > 0
        ? {
            generators: {
              quantity: 1,
              unitPowerMW: genKW / 1000,
              unitCost: genTotalCost,
              totalCost: genTotalCost,
              costPerKW: genCostPerKW,
              fuelType: data.addOns.generatorFuelType || "natural-gas",
              manufacturer: "Caterpillar/Generac",
            },
          }
        : {}),
      installation: {
        bos: bosEpc * 0.4,
        epc: bosEpc * 0.5,
        contingency: bosEpc * 0.1,
        totalInstallation: bosEpc,
      },
      commissioning: {
        factoryAcceptanceTest: commissioningTotal * 0.2,
        siteAcceptanceTest: commissioningTotal * 0.25,
        scadaIntegration: commissioningTotal * 0.2,
        functionalSafetyTest: commissioningTotal * 0.15,
        performanceTest: commissioningTotal * 0.2,
        totalCommissioning: commissioningTotal,
      },
      certification: {
        interconnectionStudy: certificationTotal * 0.25,
        utilityUpgrades: certificationTotal * 0.3,
        environmentalPermits: certificationTotal * 0.15,
        buildingPermits: certificationTotal * 0.15,
        fireCodeCompliance: certificationTotal * 0.15,
        totalCertification: certificationTotal,
      },
      annualCosts: {
        operationsAndMaintenance: annualOMTotal * 0.5,
        extendedWarranty: annualOMTotal * 0.15,
        capacityTesting: annualOMTotal * 0.1,
        insurancePremium: annualOMTotal * 0.15,
        softwareLicenses: annualOMTotal * 0.1,
        totalAnnualCost: annualOMTotal,
        year1Total: annualOMTotal * 1.2,
      },
      totals: {
        equipmentCost,
        installationCost,
        commissioningCost: commissioningTotal,
        certificationCost: certificationTotal,
        totalCapex: grossCost,
        totalProjectCost: grossCost,
        annualOpex: annualOMTotal,
      },
    },
    costs: {
      equipmentCost,
      installationCost,
      totalProjectCost: grossCost,
      taxCredit: itcAmount,
      netCost,
    },
    financials: {
      annualSavings: q.annualSavingsUSD ?? 0,
      paybackYears: q.paybackYears ?? q.roiYears ?? 0,
      roi5Year:
        q.annualSavingsUSD && netCost > 0
          ? ((q.annualSavingsUSD * 5 - netCost) / netCost) * 100
          : 0,
      roi10Year:
        q.annualSavingsUSD && netCost > 0
          ? ((q.annualSavingsUSD * 10 - netCost) / netCost) * 100
          : 0,
      roi25Year:
        q.annualSavingsUSD && netCost > 0
          ? ((q.annualSavingsUSD * 25 - netCost) / netCost) * 100
          : 0,
      npv: q.npv ?? 0,
      irr: q.irr ?? 0,
    },
    metadata: {
      calculatedAt: new Date(),
      pricingSource: "TrueQuote (Step 4 cached)",
      systemCategory:
        bessKW / 1000 >= 1 ? "utility" : bessKW / 1000 >= 0.05 ? "commercial" : "residential",
    },
    benchmarkAudit: {
      version: "2.0",
      methodology: "TrueQuote SSOT (cached from Step 4 pricing pipeline)",
      sources: [],
      assumptions: {
        discountRate: 0.08,
        projectLifeYears: 25,
        degradationRate: 0.015,
        itcRate,
      },
      deviations: [],
    },
  };
}

