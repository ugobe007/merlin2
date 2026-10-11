/**
 * The orchestration fee. /api/quote and /how-we-get-paid both read this.
 * Change the price here. Do not copy the number into either of them.
 *
 * Live model: 20% on the first $200,000 of equipment, 14% up to $800,000,
 * 13% above that. Each rate applies only to the dollars inside its bracket.
 * /api/quote and the wizard both read calculateMerlinFees from this file.
 */
export type FeeBand = { below: number; rate: number };

export type OrchestrationFee =
  | { kind: "flat"; dollars: number }
  | { kind: "tiered"; bands: readonly FeeBand[] }
  | { kind: "marginal"; bands: readonly FeeBand[] };

export const ORCHESTRATION_FEE: OrchestrationFee = {
  kind: "marginal",
  bands: [
    { below: 200_000, rate: 0.2 },
    { below: 800_000, rate: 0.14 },
    { below: Number.POSITIVE_INFINITY, rate: 0.13 },
  ],
};

function money(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function orchestrationFeeLabel(fee: OrchestrationFee = ORCHESTRATION_FEE): string {
  if (fee.kind === "flat") return `${money(fee.dollars)} per site, flat`;
  return fee.bands
    .map((band, index) => {
      const rate = `${Math.round(band.rate * 100)}%`;
      if (fee.kind === "marginal" && index === 0) {
        return `${rate} on the first ${money(band.below)} of equipment`;
      }
      if (index === 0) return `${rate} of equipment under ${money(band.below)}`;
      if (!Number.isFinite(band.below)) return `${rate} above that`;
      return `${rate} up to ${money(band.below)}`;
    })
    .join(", ");
}

export const ORCHESTRATION_FEE_LABEL = orchestrationFeeLabel();

/** The sentence the fee page may say about this kind. A step schedule has none. */
export function orchestrationFeeArgument(fee: OrchestrationFee = ORCHESTRATION_FEE): {
  heading: string;
  claim: string;
  reason: string;
} {
  if (fee.kind === "flat") {
    return {
      heading: "Orchestration is a flat fee, not a percentage",
      claim:
        "The fee doesn't move when the equipment does. A percentage of project cost pays more when the system is bigger. A flat fee does not.",
      reason: "the fee doesn't move when the equipment does",
    };
  }
  if (fee.kind === "marginal") {
    return {
      heading: "Our rate falls as your project grows",
      claim: "We earn a smaller share of a bigger project, never a larger one.",
      reason: "our share shrinks as the project grows",
    };
  }
  return { heading: "The schedule", claim: "", reason: "the fee is quoted up front" };
}

function tieredRate(subtotal: number, bands: readonly FeeBand[]): number {
  return bands.find((band) => subtotal < band.below)?.rate ?? bands[bands.length - 1].rate;
}

function marginalDollars(subtotal: number, bands: readonly FeeBand[]): number {
  let fee = 0;
  let floor = 0;
  for (const band of bands) {
    const width = Math.max(0, Math.min(subtotal, band.below) - floor);
    fee += width * band.rate;
    floor = band.below;
    if (subtotal <= band.below) break;
  }
  return fee;
}

function feeDollars(subtotal: number): number {
  if (ORCHESTRATION_FEE.kind === "flat") return ORCHESTRATION_FEE.dollars;
  if (ORCHESTRATION_FEE.kind === "tiered") return subtotal * tieredRate(subtotal, ORCHESTRATION_FEE.bands);
  return marginalDollars(subtotal, ORCHESTRATION_FEE.bands);
}

export function orchestrationMargin(equipmentSubtotal: number): number {
  const subtotal = Number(equipmentSubtotal) || 0;
  if (!(subtotal > 0)) return 0;
  if (ORCHESTRATION_FEE.kind === "tiered") return tieredRate(subtotal, ORCHESTRATION_FEE.bands);
  return feeDollars(subtotal) / subtotal;
}

export function calculateMerlinFees(equipmentSubtotal: number) {
  const subtotal = Number(equipmentSubtotal) || 0;
  const totalFee = feeDollars(subtotal);
  return {
    designIntelligence: Math.round(totalFee * 0.14),
    procurementSourcing: Math.round(totalFee * 0.65),
    pmConstruction: Math.round(totalFee * 0.16),
    incentiveFiling: Math.round(totalFee * 0.05),
    totalFee: Math.round(totalFee),
    effectiveMargin: orchestrationMargin(subtotal),
    annualMonitoring: 580,
  };
}
