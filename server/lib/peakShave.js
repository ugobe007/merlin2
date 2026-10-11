/**
 * Built from pricing/peakShave.ts for the Node 20 API process.
 * The Dockerfile rebuilds this file with esbuild on deploy.
 */
export const MAX_SHAVE_FRACTION = 0.45;
export const PEAK_SHAVE_EFFECTIVENESS = 0.75;
export const CAR_WASH_SHAVE_EFFECTIVENESS = 0.95;

export function shaveEffectivenessForIndustry(industry = "") {
  const key = industry.toLowerCase().replace(/[\s-]+/g, "_");
  return key === "car_wash" ? CAR_WASH_SHAVE_EFFECTIVENESS : PEAK_SHAVE_EFFECTIVENESS;
}

export function shaveCeilingKW(nameplateKW, peakLoadKW = 0) {
  if (!(nameplateKW > 0)) return 0;
  const peakCap = peakLoadKW > 0 ? Math.round(peakLoadKW * MAX_SHAVE_FRACTION) : nameplateKW;
  return Math.min(nameplateKW, peakCap);
}

export function creditedShaveKW(bessKW, peakLoadKW = 0) {
  return shaveCeilingKW(bessKW, peakLoadKW);
}

export function demandShaveKW(nameplateKW, peakLoadKW = 0, effectiveness = PEAK_SHAVE_EFFECTIVENESS) {
  const ceiling = shaveCeilingKW(nameplateKW, peakLoadKW);
  const claimed = ceiling * effectiveness;
  if (!(claimed > 0)) return 0;
  return Math.min(claimed, ceiling);
}
