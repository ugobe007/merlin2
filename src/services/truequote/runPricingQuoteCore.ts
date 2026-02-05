/* eslint-disable no-console */

/**
 * Pure Layer B Pricing Quote Runner
 * 
 * Takes Layer A output (load profile) and runs SSOT pricing calculator.
 * No React hooks, can run in Node scripts.
 */

import { calculateQuote } from "@/services/unifiedQuoteCalculator";
import type { ContractQuoteResult } from "./runContractQuoteCore";

export type PricingQuoteResult = {
  capexUSD: number;
  annualSavingsUSD: number;
  roiYears: number;
  npvUSD?: number;
  irr?: number;
  demandChargeSavings?: number;
  pricingSnapshotId: string;
  warnings: string[];
};

function hashStable(obj: unknown): string {
  // Cheap stable hash for snapshots (deterministic for same inputs)
  const s = JSON.stringify(obj, Object.keys(obj as any).sort());
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return `snap_${(h >>> 0).toString(16)}`;
}

export async function runPricingQuoteCore(layerA: ContractQuoteResult): Promise<PricingQuoteResult> {
  const warnings: string[] = [];

  // Extract sizing hints from Layer A
  const sizingHints = layerA.sizingHints as any;
  const storageToPeakRatio = sizingHints?.storageToPeakRatio ?? 0.4;
  const durationHours = sizingHints?.durationHours ?? 4;

  // Build pricing inputs from Layer A load profile
  const pricingInputs = {
    storageSizeMW: (layerA.loadProfile.peakLoadKW / 1000) * storageToPeakRatio,
    durationHours,
    electricityRate: (layerA.inputsUsed as any)?.electricityRate ?? 0.12,
    demandCharge: (layerA.inputsUsed as any)?.demandCharge ?? 15,
    useCase: layerA.industry,
    location: (layerA.inputsUsed as any)?.location ?? "unknown",
  };

  // Check for defaults being used (indicates incomplete inputs)
  if (pricingInputs.location === "unknown") warnings.push("⚠️ Location unknown (defaulted)");
  if (pricingInputs.electricityRate === 0.12) warnings.push("ℹ️ Default electricity rate used (0.12 $/kWh)");
  if (pricingInputs.demandCharge === 15) warnings.push("ℹ️ Default demand charge used (15 $/kW)");

  const pricingSnapshotId = hashStable(pricingInputs);

  // Run SSOT pricing calculator
  const quote = await calculateQuote(pricingInputs as any);

  const capexUSD = quote?.costs?.netCost ?? 0;
  const annualSavingsUSD = quote?.financials?.annualSavings ?? 0;
  const roiYears = quote?.financials?.paybackYears ?? 0;
  const npvUSD = quote?.financials?.npv;
  const irr = quote?.financials?.irr;
  const demandChargeSavings = quote?.financials?.demandChargeSavings;

  // Sanity checks on pricing outputs
  if (!Number.isFinite(capexUSD) || capexUSD <= 0) warnings.push("⚠️ Capex is zero/invalid");
  if (!Number.isFinite(annualSavingsUSD) || annualSavingsUSD <= 0) warnings.push("⚠️ Annual savings is zero/invalid");
  if (!Number.isFinite(roiYears) || roiYears <= 0) warnings.push("⚠️ ROI is zero/invalid");
  if (roiYears > 100) warnings.push("⚠️ ROI > 100 years (suspiciously high)");

  // DEV trace (mirrors useWizardV7 quote sanity checks)
  if (process.env.NODE_ENV === "development") {
    console.group("[TrueQuote] Quote Sanity Check");
    console.log("Pricing Inputs:", pricingInputs);
    console.log("Snapshot ID:", pricingSnapshotId);
    console.log("Outputs:", { capexUSD, annualSavingsUSD, roiYears, npvUSD, irr });
    if (warnings.length) console.warn("Warnings:", warnings);
    console.groupEnd();
  }

  return {
    capexUSD,
    annualSavingsUSD,
    roiYears,
    npvUSD,
    irr,
    demandChargeSavings,
    pricingSnapshotId,
    warnings,
  };
}
