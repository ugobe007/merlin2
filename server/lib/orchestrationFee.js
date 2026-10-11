/**
 * Built from pricing/orchestrationFee.ts for the Node 20 API process.
 * The Dockerfile rebuilds this file with esbuild on deploy.
 */
export const ORCHESTRATION_FEE = {
  kind: "marginal",
  bands: [
    { below: 200_000, rate: 0.2 },
    { below: 800_000, rate: 0.14 },
    { below: Number.POSITIVE_INFINITY, rate: 0.13 },
  ],
};

function money(amount) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function orchestrationFeeLabel(fee = ORCHESTRATION_FEE) {
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

export function orchestrationFeeArgument(fee = ORCHESTRATION_FEE) {
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

function tieredRate(subtotal, bands) {
  return bands.find((band) => subtotal < band.below)?.rate ?? bands[bands.length - 1].rate;
}

function marginalDollars(subtotal, bands) {
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

function feeDollars(subtotal) {
  if (ORCHESTRATION_FEE.kind === "flat") return ORCHESTRATION_FEE.dollars;
  if (ORCHESTRATION_FEE.kind === "tiered") return subtotal * tieredRate(subtotal, ORCHESTRATION_FEE.bands);
  return marginalDollars(subtotal, ORCHESTRATION_FEE.bands);
}

export function orchestrationMargin(equipmentSubtotal) {
  const subtotal = Number(equipmentSubtotal) || 0;
  if (!(subtotal > 0)) return 0;
  if (ORCHESTRATION_FEE.kind === "tiered") return tieredRate(subtotal, ORCHESTRATION_FEE.bands);
  return feeDollars(subtotal) / subtotal;
}

export function calculateMerlinFees(equipmentSubtotal) {
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
