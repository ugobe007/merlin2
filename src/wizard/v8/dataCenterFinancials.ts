/**
 * Data-center-specific financial logic.
 *
 * Hyperscale and colocation facilities routinely bundle a diesel generator for
 * Tier III/IV resilience. The generator is mission-critical capex with $0 direct
 * utility savings — including it in the primary payback metric produces 25–30 yr
 * figures that misrepresent the BESS + solar energy investment.
 *
 * This module:
 *   1. Splits net investment into energy package vs resilience (generator).
 *   2. Adds DC-specific OPEX avoidance credits (UPS displacement, capacity deferral).
 *   3. Returns dual ROI metrics — energy-primary payback for quoting, total-project
 *      payback for full-scope disclosure.
 */

import { calculateROI, type ROIMetrics } from "../../services/pricingServiceV45";
import type { DataCenterFacilityDetails } from "./wizardState";

export type ExistingUpsType = "lead-acid" | "lithium" | "flywheel" | "none" | string;

export interface DataCenterFinancialInputs {
  /** IT load from facility calc (kW). Falls back to baseLoad / PUE when absent. */
  itLoadKW: number;
  bessKW: number;
  bessKWh: number;
  generatorCost: number;
  totalNetInvestment: number;
  /** Base annual savings from pricingServiceV45 (net of reserves, incl. EV if any). */
  baseAnnualSavings: number;
  /** Energy-only savings net of reserves (excl. EV revenue) — for dual payback. */
  baseEnergySavingsNet: number;
  demandChargePerKWMonth: number;
  existingUps?: ExistingUpsType;
  facilityDetails?: DataCenterFacilityDetails | null;
}

export interface DataCenterFinancialBreakdown {
  /** Post-ITC investment in BESS + solar + eligible soft costs (excl. generator). */
  energyNetInvestment: number;
  /** Generator equipment capex — not ITC-eligible, tracked as resilience spend. */
  resilienceNetInvestment: number;
  totalNetInvestment: number;

  upsDisplacementSavings: number;
  capacityDeferralSavings: number;
  dcAddOnSavings: number;

  /** Annual savings including DC add-ons (same basis as tier.annualSavings). */
  totalAnnualSavings: number;
  /** Energy savings including DC add-ons, excl. EV revenue. */
  totalEnergySavingsNet: number;

  /** Primary quoting metric — energy package payback only. */
  paybackYearsEnergy: number;
  /** Full-scope payback including generator capex. */
  paybackYearsTotal: number;
  /** Estimated years the generator adds vs energy-only payback. */
  generatorPaybackDragYears: number;

  roi10YearEnergy: number;
  roi10YearTotal: number;
  npv25Energy: number;
  npv25Total: number;
}

/** Amortized annual UPS battery O&M + replacement avoided when BESS augments the stack. */
const UPS_OM_PER_KW_YR: Record<string, number> = {
  "lead-acid": 58,
  lithium: 32,
  flywheel: 12,
  none: 0,
};

/**
 * BESS can displace up to 85% of IT load from legacy UPS battery stacks.
 * Capped at installed BESS power (kW).
 */
function calcUpsDisplacementSavings(
  itLoadKW: number,
  bessKW: number,
  existingUps: ExistingUpsType
): number {
  if (bessKW <= 0 || itLoadKW <= 0) return 0;
  const upsType = existingUps || "lead-acid";
  const rate = UPS_OM_PER_KW_YR[upsType] ?? UPS_OM_PER_KW_YR["lead-acid"];
  if (rate <= 0) return 0;

  const protectedKW = Math.min(bessKW, itLoadKW * 0.85);
  return Math.round(protectedKW * rate);
}

/**
 * Large-facility grid interconnection deferral value from peak shaving during ramp-up.
 * Conservative: 12% of annual demand-charge value on deferred kW capacity.
 * Applies to facilities ≥ 5 MW IT load.
 */
function calcCapacityDeferralSavings(
  itLoadKW: number,
  bessKW: number,
  demandChargePerKWMonth: number
): number {
  if (itLoadKW < 5_000 || bessKW <= 0 || demandChargePerKWMonth <= 0) return 0;

  const deferrableKW = Math.min(bessKW, itLoadKW * 0.25);
  const annualDemandValue = deferrableKW * demandChargePerKWMonth * 12;
  return Math.round(annualDemandValue * 0.12);
}

/**
 * Apply data-center financial adjustments to a tier's base v45 economics.
 */
export function applyDataCenterFinancials(
  inputs: DataCenterFinancialInputs
): DataCenterFinancialBreakdown {
  const {
    itLoadKW,
    bessKW,
    generatorCost,
    totalNetInvestment,
    baseAnnualSavings,
    baseEnergySavingsNet,
    demandChargePerKWMonth,
    existingUps,
  } = inputs;

  const resilienceNetInvestment = Math.max(0, Math.round(generatorCost));
  const energyNetInvestment = Math.max(0, Math.round(totalNetInvestment - resilienceNetInvestment));

  const upsDisplacementSavings = calcUpsDisplacementSavings(
    itLoadKW,
    bessKW,
    existingUps ?? "lead-acid"
  );
  const capacityDeferralSavings = calcCapacityDeferralSavings(
    itLoadKW,
    bessKW,
    demandChargePerKWMonth
  );
  const dcAddOnSavings = upsDisplacementSavings + capacityDeferralSavings;

  const totalAnnualSavings = baseAnnualSavings + dcAddOnSavings;
  const totalEnergySavingsNet = baseEnergySavingsNet + dcAddOnSavings;

  const energyROI: ROIMetrics = calculateROI(
    energyNetInvestment,
    totalAnnualSavings,
    0.05,
    totalEnergySavingsNet > 0 ? totalEnergySavingsNet : undefined
  );

  const totalROI: ROIMetrics = calculateROI(
    totalNetInvestment,
    totalAnnualSavings,
    0.05,
    totalEnergySavingsNet > 0 ? totalEnergySavingsNet : undefined
  );

  const generatorPaybackDragYears =
    totalAnnualSavings > 0 && resilienceNetInvestment > 0
      ? Math.round((resilienceNetInvestment / totalAnnualSavings) * 10) / 10
      : 0;

  return {
    energyNetInvestment,
    resilienceNetInvestment,
    totalNetInvestment,
    upsDisplacementSavings,
    capacityDeferralSavings,
    dcAddOnSavings,
    totalAnnualSavings,
    totalEnergySavingsNet,
    paybackYearsEnergy: energyROI.paybackYears,
    paybackYearsTotal: totalROI.paybackYears,
    generatorPaybackDragYears,
    roi10YearEnergy: energyROI.roi10Year,
    roi10YearTotal: totalROI.roi10Year,
    npv25Energy: energyROI.npv25Year,
    npv25Total: totalROI.npv25Year,
  };
}

/**
 * Resolve IT load kW for DC financials from facility details or wizard load state.
 */
export function resolveDataCenterItLoadKW(
  facilityDetails: DataCenterFacilityDetails | null | undefined,
  baseLoadKW: number,
  effectivePue?: number
): number {
  if (facilityDetails?.itLoadKW && facilityDetails.itLoadKW > 0) {
    return facilityDetails.itLoadKW;
  }
  const pue = effectivePue ?? facilityDetails?.effectivePue ?? 1.4;
  if (baseLoadKW > 0 && pue > 1) {
    return Math.round(baseLoadKW / pue);
  }
  return Math.round(baseLoadKW);
}
