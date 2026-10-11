import type { QuoteTier, WizardState } from "./wizardState";

type ApiTier = {
  equipment?: { solarKW?: number; bessKW?: number; bessKWh?: number; generatorKW?: number };
  savings?: { netAnnualSavings?: number; demandChargeSavings?: number };
  roi?: { paybackYears?: number };
  costs?: { netInvestment?: number; totalInvestment?: number };
};

function stamp(tier: QuoteTier, api: ApiTier | undefined): QuoteTier {
  if (!api?.equipment || !api.savings || !api.roi || !api.costs) return tier;
  const payback = api.roi.paybackYears;
  return {
    ...tier,
    solarKW: api.equipment.solarKW ?? tier.solarKW,
    bessKW: api.equipment.bessKW ?? tier.bessKW,
    bessKWh: api.equipment.bessKWh ?? tier.bessKWh,
    generatorKW: api.equipment.generatorKW ?? tier.generatorKW,
    annualSavings: api.savings.netAnnualSavings ?? tier.annualSavings,
    demandChargeSavings: api.savings.demandChargeSavings ?? tier.demandChargeSavings,
    paybackYears: typeof payback === "number" ? payback : tier.paybackYears,
    netCost: api.costs.netInvestment ?? tier.netCost,
    grossCost: api.costs.totalInvestment ?? tier.grossCost,
  };
}

/**
 * Car-wash tiers on Merlin use the same POST /api/quote numbers as carwashenergy.com.
 * Any other industry keeps the in-wizard price. A failed call keeps the local tier.
 */
export async function priceCarWashFromQuoteApi(
  state: WizardState,
  tiers: [QuoteTier, QuoteTier, QuoteTier]
): Promise<[QuoteTier, QuoteTier, QuoteTier]> {
  if (typeof window === "undefined") return tiers;
  if (state.industry !== "car_wash" || !state.location) return tiers;
  const location =
    state.location.formattedAddress ||
    [state.location.city, state.location.state, state.location.zip].filter(Boolean).join(", ");
  if (!location.trim()) return tiers;

  const peakLoadKW = state.peakLoadKW > 0 ? state.peakLoadKW : state.baseLoadKW;
  const body: Record<string, unknown> = {
    industry: "car_wash",
    location,
    peakLoadKW,
    peakSource: "override",
    bessApplication: "peak_shaving",
  };
  if (state.intel?.demandCharge && state.intel.demandCharge > 0)
    body.demandCharge = state.intel.demandCharge;
  if (state.intel?.utilityRate && state.intel.utilityRate > 0)
    body.electricityRate = state.intel.utilityRate;

  try {
    const response = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      tiers?: { starter?: ApiTier; recommended?: ApiTier; complete?: ApiTier };
    } | null;
    if (!response.ok || !payload?.ok || !payload.tiers) return tiers;
    return [
      stamp(tiers[0], payload.tiers.starter),
      stamp(tiers[1], payload.tiers.recommended),
      stamp(tiers[2], payload.tiers.complete),
    ];
  } catch {
    return tiers;
  }
}
