import type { ContractQuoteResult } from "./runContractQuoteCore";

export type PricingQuoteResult = {
  capexUSD: number;
  annualSavingsUSD: number;
  roiYears: number;
  warnings: string[];
  assumptions: Record<string, number>;
};

const BESS_POWER_USD_PER_KW = 350;
const BESS_ENERGY_USD_PER_KWH = 175;
const INSTALLATION_MULTIPLIER = 1.35;
const DEMAND_REDUCTION_FACTOR = 0.65;
const DEFAULT_DEMAND_CHARGE_USD_PER_KW_MONTH = 15;
const DEFAULT_ENERGY_RATE_USD_PER_KWH = 0.12;

function numberOr(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function runPricingQuoteCore(
  layerA: ContractQuoteResult
): Promise<PricingQuoteResult> {
  const peakLoadKW = Math.max(0, numberOr(layerA.loadProfile?.peakLoadKW, 0));
  const energyKWhPerDay = Math.max(0, numberOr(layerA.loadProfile?.energyKWhPerDay, 0));
  const storageToPeakRatio = numberOr(layerA.sizingHints?.storageToPeakRatio, 0.5);
  const durationHours = numberOr(layerA.sizingHints?.durationHours, 4);
  const demandCharge = numberOr(
    layerA.inputsUsed?.demandCharge,
    DEFAULT_DEMAND_CHARGE_USD_PER_KW_MONTH
  );
  const electricityRate = numberOr(
    layerA.inputsUsed?.electricityRate,
    DEFAULT_ENERGY_RATE_USD_PER_KWH
  );

  const bessKW = Math.max(75, peakLoadKW * storageToPeakRatio);
  const bessKWh = bessKW * durationHours;
  const equipmentCapex = bessKW * BESS_POWER_USD_PER_KW + bessKWh * BESS_ENERGY_USD_PER_KWH;
  const capexUSD = Math.round(equipmentCapex * INSTALLATION_MULTIPLIER);

  const demandSavings = bessKW * demandCharge * 12 * DEMAND_REDUCTION_FACTOR;
  const energySavings = energyKWhPerDay * 365 * electricityRate * 0.08;
  const annualSavingsUSD = Math.round(Math.max(1, demandSavings + energySavings));
  const roiYears = Number((capexUSD / annualSavingsUSD).toFixed(2));

  const warnings: string[] = [];
  if (peakLoadKW <= 0)
    warnings.push("⚠️ Pricing used minimum BESS size because peak load was missing");
  if (Object.keys(layerA.inputFallbacks ?? {}).length > 0) {
    warnings.push(
      `ℹ️ Pricing used Layer A defaults: ${Object.keys(layerA.inputFallbacks ?? {}).join(", ")}`
    );
  }

  return {
    capexUSD,
    annualSavingsUSD,
    roiYears,
    warnings,
    assumptions: {
      bessKW,
      bessKWh,
      storageToPeakRatio,
      durationHours,
      demandCharge,
      electricityRate,
    },
  };
}
