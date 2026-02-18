/**
 * Step 5: MagicFit V7 - 3-Tier System Recommendations
 *
 * Created: February 10, 2026
 * Updated: February 18, 2026 — ZERO-DB-CALL refactor
 *
 * ─── KEY INSIGHT ───
 * Step 4's pricing pipeline (`runPricingSafe`) already computed a full quote
 * and stored it in `state.quote` with `pricingComplete: true`.  That quote
 * is the **PerfectFit (1.0x)** base.  Starter and BeastMode are derived by
 * pure-math scaling — no Supabase calls, no `calculateQuote()` calls.
 *
 * This eliminates:
 * - 3 redundant `calculateQuote()` DB round-trips on mount
 * - The double-render bug (handleSelectTier → updateQuote → useMerlinData
 *   sees new bessKW → fingerprint changes → generateTiers fires AGAIN)
 *
 * Fallback: If `state.quote.pricingComplete` is false (Step 4 pricing failed),
 * we make ONE `calculateQuote()` call for PerfectFit and derive the other two.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Check, Loader2, AlertTriangle, Battery, Sun, Fuel, Clock, Shield } from "lucide-react";
import type {
  WizardState as WizardV7State,
  EnergyGoal,
  WizardStep,
  QuoteOutput,
} from "@/wizard/v7/hooks/useWizardV7";
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import TrueQuoteFinancialModal from "@/components/wizard/v7/shared/TrueQuoteFinancialModal";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";

// SSOT calculation engine — only used as fallback when Step 4 pricing is missing
import { calculateQuote } from "@/services/unifiedQuoteCalculator";
import { applyMarginToQuote } from "@/wizard/v7/pricing/pricingBridge";
import { useMerlinData } from "@/wizard/v7/memory/useMerlinData";
import type { QuoteResult } from "@/services/unifiedQuoteCalculator";

interface Props {
  state: WizardV7State;
  actions?: {
    goBack?: () => void;
    goToStep?: (step: WizardStep) => void;
    updateQuote?: (quote: Partial<QuoteOutput>) => void;
  };
}

type TierKey = "starter" | "perfectFit" | "beastMode";

interface TierConfig {
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

const TIER_CONFIG: Record<TierKey, TierConfig> = {
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

interface TierQuote {
  tierKey: TierKey;
  config: TierConfig;
  quote: QuoteResult;
  loading: boolean;
  error: string | null;
}

/** Margin data attached to QuoteResult at runtime by scaleTier() */
interface MarginData {
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
type QuoteWithMargin = QuoteResult & { _margin?: MarginData };

function formatCurrency(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "$0";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function safeFixed(value: number | undefined | null, digits: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function getIndustryLabel(slug: string): string {
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
function getGoalBasedMultipliers(goals: EnergyGoal[]) {
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
function scaleTier(
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
  } | null
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

  const scaledSolar = baseEquipment.solar
    ? {
        ...baseEquipment.solar,
        totalMW: baseEquipment.solar.totalMW * config.solarMultiplier,
        panelQuantity: Math.ceil(baseEquipment.solar.panelQuantity * config.solarMultiplier),
        totalCost: baseEquipment.solar.totalCost * config.solarMultiplier,
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
function buildQuoteResultFromState(
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

export default function Step5MagicFitV7({ state, actions }: Props) {
  const [tiers, setTiers] = useState<TierQuote[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // ✅ MERLIN MEMORY: Read cross-step data from Memory first, fall back to state
  const data = useMerlinData(state);

  // ══════════════════════════════════════════════════════════════════════════
  // SNAPSHOT: Freeze all sizing inputs at mount time.
  // handleSelectTier → updateQuote changes state.quote.bessKW, which would
  // change useMerlinData's return value → trigger re-render → re-generation.
  // We snapshot once and use the ref for all tier derivation.
  // ══════════════════════════════════════════════════════════════════════════
  const snapshotRef = useRef<{
    frozen: boolean;
    rawBESSKW: number;
    ssotDuration: number;
    solarKW: number;
    generatorKW: number;
    windKW: number;
    location: string;
    utilityRate: number;
    demandCharge: number;
    industry: string;
    goals: EnergyGoal[];
    addOns: typeof data.addOns;
    stateQuote: QuoteOutput | undefined;
    stateQuoteMargin: QuoteOutput["margin"] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }>({ frozen: false } as any);

  // Only capture on FIRST render (frozen === false)
  if (!snapshotRef.current.frozen) {
    const rawBESSKW =
      data.bessKW > 0 ? data.bessKW : data.peakLoadKW || state?.quote?.peakLoadKW || 200;
    const ssotDuration = data.durationHours > 0 ? data.durationHours : 4;

    snapshotRef.current = {
      frozen: true,
      rawBESSKW,
      ssotDuration,
      solarKW: data.addOns.includeSolar
        ? data.addOns.solarKW > 0
          ? data.addOns.solarKW
          : rawBESSKW * 0.5
        : 0,
      generatorKW: data.addOns.includeGenerator
        ? data.addOns.generatorKW > 0
          ? data.addOns.generatorKW
          : rawBESSKW * 0.75
        : 0,
      windKW: data.addOns.includeWind
        ? data.addOns.windKW > 0
          ? data.addOns.windKW
          : rawBESSKW * 0.3
        : 0,
      location: data.location.state || "CA",
      utilityRate: data.utilityRate || 0.12,
      demandCharge: data.demandCharge || 0,
      industry: data.industry || "commercial",
      goals: data.goals as EnergyGoal[],
      addOns: { ...data.addOns },
      stateQuote: state?.quote ? { ...state.quote } : undefined,
      stateQuoteMargin: state?.quote?.margin ? { ...state.quote.margin } : undefined,
    };
  }

  const snap = snapshotRef.current;

  // Apply goal-based intelligence to sizing (from frozen snapshot)
  const goalModifiers = useMemo(
    () => getGoalBasedMultipliers(snap.goals),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Never recompute — goals are frozen at mount
  );

  // ── Stabilize derived sizing from frozen snapshot ──
  const baseBESSKW = snap.rawBESSKW * goalModifiers.bessMultiplier;
  const baseDuration = snap.ssotDuration * goalModifiers.durationMultiplier;
  const baseSolarKW = snap.solarKW * goalModifiers.solarMultiplier;
  const baseGeneratorKW = snap.generatorKW * goalModifiers.generatorMultiplier;
  const baseWindKW = snap.windKW * goalModifiers.solarMultiplier;

  // ══════════════════════════════════════════════════════════════════════════
  // TIER GENERATION — runs ONCE on mount, zero DB calls if Step 4 pricing exists
  // ══════════════════════════════════════════════════════════════════════════
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Run exactly ONCE
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    let cancelled = false;

    async function generateTiers() {
      setIsLoading(true);
      setLoadError(null);

      const sq = snap.stateQuote;
      const hasPricing = sq?.pricingComplete === true && (sq.grossCost ?? 0) > 0;

      console.log("[Step5 MagicFit] generateTiers starting (zero-DB-call path)", {
        hasPricingFromStep4: hasPricing,
        baseBESSKW,
        baseDuration,
        baseSolarKW,
        baseGeneratorKW,
        baseWindKW,
        location: snap.location,
        utilityRate: snap.utilityRate,
        demandCharge: snap.demandCharge,
        industry: snap.industry,
        goals: snap.goals,
        stateQuote: sq
          ? {
              grossCost: sq.grossCost,
              annualSavingsUSD: sq.annualSavingsUSD,
              bessKW: sq.bessKW,
              pricingComplete: sq.pricingComplete,
            }
          : null,
      });

      try {
        let baseQuoteResult: QuoteResult;
        let baseMargin: {
          sellPriceTotal: number;
          baseCostTotal: number;
          marginDollars: number;
          marginPercent: number;
          marginBand: string;
          itcRate: number;
          itcAmount: number;
          netCost: number;
        } | null;

        if (hasPricing && sq) {
          // ═══════════════════════════════════════════════════════════════
          // FAST PATH: Build QuoteResult from state.quote (no DB call!)
          // Step 4's runPricingSafe already computed everything we need.
          // ═══════════════════════════════════════════════════════════════
          console.log("[Step5 MagicFit] ✅ Using Step 4 cached quote (zero DB calls)");
          baseQuoteResult = buildQuoteResultFromState(sq, data);

          // Reconstruct margin from state.quote.margin
          const m = snap.stateQuoteMargin;
          baseMargin = m
            ? {
                sellPriceTotal: m.sellPriceTotal,
                baseCostTotal: m.baseCostTotal,
                marginDollars: m.marginDollars,
                marginPercent: m.marginPercent,
                marginBand: m.marginBand,
                itcRate: sq.itcRate ?? 0.3,
                itcAmount: sq.itcAmount ?? m.sellPriceTotal * (sq.itcRate ?? 0.3),
                netCost:
                  m.sellPriceTotal - (sq.itcAmount ?? m.sellPriceTotal * (sq.itcRate ?? 0.3)),
              }
            : null;
        } else {
          // ═══════════════════════════════════════════════════════════════
          // FALLBACK: Step 4 pricing missing — make ONE calculateQuote call
          // for PerfectFit base, then derive others with pure math.
          // ═══════════════════════════════════════════════════════════════
          console.log(
            "[Step5 MagicFit] ⚠️ No Step 4 pricing — falling back to single calculateQuote call"
          );

          const PER_TIER_TIMEOUT_MS = 20_000;
          let timer: ReturnType<typeof setTimeout> | undefined;

          const quotePromise = calculateQuote({
            storageSizeMW: baseBESSKW / 1000,
            durationHours: baseDuration,
            location: snap.location,
            zipCode: "",
            electricityRate: snap.utilityRate,
            demandCharge: snap.demandCharge || undefined,
            useCase: snap.industry.replace(/_/g, "-"),
            solarMW: baseSolarKW / 1000,
            windMW: baseWindKW / 1000,
            generatorMW: baseGeneratorKW / 1000,
            generatorFuelType: (snap.addOns.generatorFuelType || "natural-gas") as
              | "diesel"
              | "natural-gas"
              | "dual-fuel",
            gridConnection: "on-grid",
            batteryChemistry: "lfp",
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(`PerfectFit fallback timed out after ${PER_TIER_TIMEOUT_MS / 1000}s`)
                ),
              PER_TIER_TIMEOUT_MS
            );
          });

          baseQuoteResult = await Promise.race([quotePromise, timeoutPromise]);
          clearTimeout(timer);

          // Apply margin to the fresh quote
          const energyMWh = (baseBESSKW / 1000) * baseDuration;
          const marginResult = applyMarginToQuote(baseQuoteResult, energyMWh);
          const itcRate = baseQuoteResult.benchmarkAudit?.assumptions?.itcRate ?? 0.3;
          const sellPriceTotal = marginResult.sellPriceTotal;
          const itcAmount = sellPriceTotal * itcRate;

          baseMargin = {
            sellPriceTotal,
            baseCostTotal: marginResult.baseCostTotal,
            marginDollars: marginResult.totalMarginDollars,
            marginPercent: marginResult.blendedMarginPercent,
            marginBand: marginResult.marginBandDescription,
            itcRate,
            itcAmount,
            netCost: sellPriceTotal - itcAmount,
          };
        }

        if (cancelled) return;

        // ═══════════════════════════════════════════════════════════════════
        // DERIVE ALL 3 TIERS from the single base using pure math
        // ═══════════════════════════════════════════════════════════════════
        const results: TierQuote[] = [];
        for (const tierKey of ["starter", "perfectFit", "beastMode"] as const) {
          results.push(
            scaleTier(baseQuoteResult, tierKey, TIER_CONFIG[tierKey], baseDuration, baseMargin)
          );
        }

        if (!cancelled) {
          console.log(
            "[Step5 MagicFit] All 3 tiers derived (zero extra DB calls):",
            results.map((r) => ({
              tier: r.tierKey,
              annualSavings: r.quote?.financials?.annualSavings,
              totalCost: r.quote?.costs?.totalProjectCost,
              payback: r.quote?.financials?.paybackYears,
            }))
          );
          setTiers(results);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error("[Step5 MagicFit] generateTiers failed:", msg);
          setLoadError(msg);
          setIsLoading(false);
        }
      }
    }

    generateTiers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount — all inputs frozen in snapshotRef

  const handleSelectTier = (tierKey: TierKey) => {
    setSelectedTier(tierKey);

    // Store selected tier quote into wizard state so Step 6 Results shows correct numbers
    const tierData = tiers.find((t) => t.tierKey === tierKey);
    if (tierData?.quote && actions?.updateQuote) {
      const eq = tierData.quote.equipment;
      const batt = eq?.batteries;
      const bessKWh = batt ? (batt.unitEnergyMWh ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const bessKW = batt ? (batt.unitPowerMW ?? 0) * (batt.quantity ?? 0) * 1000 : 0;
      const solarKW = eq?.solar ? (eq.solar.totalMW ?? 0) * 1000 : 0;
      const genKW = eq?.generators
        ? (eq.generators.unitPowerMW ?? 0) * (eq.generators.quantity ?? 0) * 1000
        : 0;

      // Use margin-adjusted pricing (sell price) when available
      const margin = (tierData.quote as QuoteWithMargin)?._margin;
      const grossCost = margin?.sellPriceTotal ?? tierData.quote.costs?.totalProjectCost ?? 0;
      const itcAmount = margin?.itcAmount ?? grossCost * 0.3;
      const netCost = margin?.netCost ?? grossCost - itcAmount;
      const itcRate = margin?.itcRate ?? 0.3;

      actions.updateQuote({
        bessKWh,
        bessKW,
        solarKW,
        generatorKW: genKW,
        capexUSD: netCost,
        grossCost,
        itcAmount,
        itcRate,
        annualSavingsUSD: tierData.quote.financials?.annualSavings ?? 0,
        roiYears: tierData.quote.financials?.annualSavings
          ? Math.min(netCost / tierData.quote.financials.annualSavings, 99)
          : (tierData.quote.financials?.paybackYears ?? 0),
        npv: tierData.quote.financials?.npv ?? undefined,
        irr: tierData.quote.financials?.irr ?? undefined,
        paybackYears: tierData.quote.financials?.paybackYears ?? 0,
        durationHours: baseDuration,
        pricingComplete: true,
        notes: [
          `MagicFit tier: ${TIER_CONFIG[tierKey].name} (${TIER_CONFIG[tierKey].multiplier}x)`,
          ...(margin
            ? [`Margin: ${margin.marginBand} (${(margin.marginPercent * 100).toFixed(1)}%)`]
            : []),
        ],
      });
    }

    // ✅ FEB 2026: No auto-advance — user confirms by clicking Next in bottom nav
  };

  if (isLoading || tiers.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          {loadError ? (
            <>
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <p className="text-slate-300 text-base font-semibold mb-2">
                Couldn't generate options
              </p>
              <p className="text-slate-500 text-sm mb-4">{loadError}</p>
              <button
                onClick={actions?.goBack}
                className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Options
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-300 text-base font-medium">
                Generating your custom system options...
              </p>
              <p className="text-slate-500 text-sm mt-2">Analyzing facility profile and goals</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Build equipment summary for the selected tier (or perfectFit as default)
  const _summaryTier = tiers.find((t) => t.tierKey === (selectedTier || "perfectFit"));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* TrueQuote Financial Modal — full ROI, 10yr cashflow, sensitivity */}
      {(() => {
        const modalTier = tiers.find((t) => t.tierKey === (selectedTier || "perfectFit"));
        const mq = modalTier?.quote;
        const mm = (mq as QuoteWithMargin)?._margin;
        return (
          <TrueQuoteFinancialModal
            isOpen={showTrueQuoteModal}
            onClose={() => setShowTrueQuoteModal(false)}
            totalInvestment={mm?.sellPriceTotal ?? mq?.costs?.totalProjectCost ?? 0}
            federalITC={mm?.itcAmount ?? mq?.costs?.taxCredit ?? 0}
            netInvestment={mm?.netCost ?? mq?.costs?.netCost ?? 0}
            annualSavings={mq?.financials?.annualSavings ?? 0}
            bessKWh={
              mq?.equipment?.batteries
                ? (mq.equipment.batteries.unitEnergyMWh ?? 0) *
                  (mq.equipment.batteries.quantity ?? 0) *
                  1000
                : 0
            }
            solarKW={mq?.equipment?.solar ? (mq.equipment.solar.totalMW ?? 0) * 1000 : 0}
            industry={getIndustryLabel(data.industry)}
            location={data.location.state}
          />
        );
      })()}

      {/* ✅ TrueQuote Hero Badge — large, gold, unmissable */}
      <button
        type="button"
        onClick={() => setShowTrueQuoteModal(true)}
        className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-400/50 hover:bg-amber-500/[0.08] transition-all duration-300 cursor-pointer"
        aria-label="Open TrueQuote financial summary"
      >
        {/* Gold Shield Image */}
        <div className="shrink-0 relative">
          <img
            src={badgeGoldIcon}
            alt="TrueQuote Verified"
            className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Badge Text */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl font-bold text-amber-400 tracking-tight">TrueQuote™</span>
            <span className="text-xs font-semibold text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Verified
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-snug">
            Every number is sourced. Click to view full financial projection, ROI analysis, and
            payback timeline.
          </p>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Inline guidance */}
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-slate-400">
          Three system options for your{" "}
          <span className="text-slate-200 font-medium">{getIndustryLabel(data.industry)}</span>{" "}
          facility
          <span className="text-slate-500"> · sized by Merlin based on your profile and goals</span>
        </p>

        {/* Goal-based sizing hints */}
        {goalModifiers.goalHints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goalModifiers.goalHints.map((hint, idx) => (
              <span key={idx} className="text-xs text-[#3ECF8E]/80">
                {hint}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.tierKey;
          const isRecommended = tier.tierKey === "perfectFit";

          if (tier.error) {
            return (
              <div
                key={tier.tierKey}
                className={`p-5 rounded-xl border ${tier.config.cardBorder} ${tier.config.cardBg}`}
              >
                <h3 className={tier.config.headlineClass}>{tier.config.name}</h3>
                <div className="flex items-center gap-2 text-red-400 mt-4 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Error: {tier.error}</span>
                </div>
              </div>
            );
          }

          if (!tier.quote) return null;

          const quote = tier.quote;
          const batteries = quote.equipment?.batteries;
          const bessKWh = batteries
            ? (batteries.unitEnergyMWh ?? 0) * (batteries.quantity ?? 0) * 1000
            : 0;
          const bessKW = batteries
            ? (batteries.unitPowerMW ?? 0) * (batteries.quantity ?? 0) * 1000
            : 0;
          const solarKW = quote.equipment?.solar ? (quote.equipment.solar.totalMW ?? 0) * 1000 : 0;
          const genKW = quote.equipment?.generators
            ? (quote.equipment.generators.unitPowerMW ?? 0) *
              (quote.equipment.generators.quantity ?? 0) *
              1000
            : 0;

          return (
            <div
              key={tier.tierKey}
              className={`
                relative rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                ${tier.config.cardBorder} ${tier.config.cardBg}
                ${isSelected ? "ring-2 ring-[#3ECF8E]/50" : ""}
                ${isRecommended && !isSelected ? "ring-1 ring-[#3ECF8E]/20" : ""}
              `}
              onClick={() => handleSelectTier(tier.tierKey)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-[#3ECF8E]" />
              )}

              <div className="p-5">
                {/* Recommended tag */}
                {isRecommended && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#3ECF8E]/10 border border-[#3ECF8E]/25 rounded-full text-[#3ECF8E] text-[11px] font-semibold mb-3">
                    Recommended
                  </div>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 border-2 border-[#3ECF8E] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#3ECF8E]" />
                  </div>
                )}

                {/* TrueQuote verified label */}
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="text-amber-400 font-semibold">TrueQuote™</span>
                  <span>verified</span>
                </div>

                {/* Tier Name + Tagline */}
                <h3 className={`${tier.config.headlineClass} mb-1 leading-tight`}>
                  {tier.config.name}
                </h3>
                <p className="text-slate-500 text-xs font-medium mb-4">{tier.config.tagline}</p>

                {/* Annual Savings - HERO */}
                <div className="mb-4 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mb-1">
                    Annual Savings
                  </div>
                  <div
                    className={`text-2xl lg:text-3xl font-bold ${tier.config.accentColor} leading-none`}
                  >
                    {formatCurrency(quote.financials?.annualSavings)}
                    <span className="text-sm text-slate-600 font-semibold ml-1">/yr</span>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Equipment
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Battery className="w-3 h-3" /> Battery
                    </span>
                    <span className="text-white font-semibold tabular-nums">
                      {formatNumber(Math.round(bessKWh))} kWh / {formatNumber(Math.round(bessKW))}{" "}
                      kW
                    </span>
                  </div>

                  {(batteries?.quantity ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" /> Duration
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                        {safeFixed(baseDuration, 1)} hours
                      </span>
                    </div>
                  )}

                  {solarKW > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Sun className="w-3 h-3" /> Solar
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                        {formatNumber(Math.round(solarKW))} kW
                      </span>
                    </div>
                  )}

                  {genKW > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Fuel className="w-3 h-3" /> Generator
                      </span>
                      <span className="text-white font-semibold tabular-nums">
                        {formatNumber(Math.round(genKW))} kW
                      </span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1.5 mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Financials
                  </div>
                  {(() => {
                    const m = (quote as QuoteWithMargin)?._margin;
                    const investment = m?.sellPriceTotal ?? quote.costs?.totalProjectCost ?? 0;
                    const itc = m?.itcAmount ?? quote.costs?.taxCredit ?? 0;
                    const net = m?.netCost ?? quote.costs?.netCost ?? 0;
                    return (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Investment</span>
                          <span className="text-white font-semibold tabular-nums">
                            {formatCurrency(investment)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Federal ITC</span>
                          <span className="text-green-400 font-semibold tabular-nums">
                            −{formatCurrency(itc)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white">Net Cost</span>
                          <span className="text-white tabular-nums">{formatCurrency(net)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* ROI Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">Payback</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.paybackYears, 1)}y
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">10yr ROI</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi10Year, 0)}%
                    </div>
                  </div>
                  <div className="text-center p-2 bg-white/[0.03] rounded-lg">
                    <div className="text-[10px] text-slate-500 font-medium">5yr ROI</div>
                    <div className={`text-sm font-bold ${tier.config.accentColor}`}>
                      {safeFixed(quote.financials?.roi5Year, 0)}%
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all
                    ${tier.config.buttonClass}
                    ${isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"}
                  `}
                >
                  {isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Selected
                    </span>
                  ) : (
                    `Select ${tier.config.name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment Legend */}
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Battery className="w-3 h-3" /> BESS
          </span>
          {data.addOns.includeSolar && (
            <span className="flex items-center gap-1.5">
              <Sun className="w-3 h-3" /> Solar
            </span>
          )}
          {data.addOns.includeGenerator && (
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3 h-3" /> Generator
            </span>
          )}
        </div>
      </div>

      {/* ✅ No in-page footer buttons — the shell's bottom nav handles Back/Continue */}
    </div>
  );
}
