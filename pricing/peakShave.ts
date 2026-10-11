/**
 * Credited peak shave. /api/quote and pricingServiceV45 both read this.
 *
 * CALIBRATE ME. A battery cannot save more demand than it shaves, and it
 * cannot shave more than the peak. 0.45 sits just above the 0.40 sizing
 * ratio and off the 0.50 edge. Set it from metered performance. It is not
 * chosen to make a tier win.
 */
export const MAX_SHAVE_FRACTION = 0.45;
export const PEAK_SHAVE_EFFECTIVENESS = 0.75;
/** Car-wash tunnels. LADWP / IEEE motor-start shaving. Public quotes and the wizard both use this. */
export const CAR_WASH_SHAVE_EFFECTIVENESS = 0.95;

/** One effectiveness per industry. Car wash is 0.95. Everything else is 0.75. */
export function shaveEffectivenessForIndustry(industry = ""): number {
  const key = industry.toLowerCase().replace(/[\s-]+/g, "_");
  return key === "car_wash" ? CAR_WASH_SHAVE_EFFECTIVENESS : PEAK_SHAVE_EFFECTIVENESS;
}

/** Hardware limit: the unit's own kW, and 45% of site peak when a peak is known. */
export function shaveCeilingKW(nameplateKW: number, peakLoadKW = 0): number {
  if (!(nameplateKW > 0)) return 0;
  const peakCap = peakLoadKW > 0 ? Math.round(peakLoadKW * MAX_SHAVE_FRACTION) : nameplateKW;
  return Math.min(nameplateKW, peakCap);
}

/** Kilowatts of nameplate the battery is allowed to dispatch against the peak. */
export function creditedShaveKW(bessKW: number, peakLoadKW = 0): number {
  return shaveCeilingKW(bessKW, peakLoadKW);
}

/**
 * Industry factors are applied to the hardware ceiling, then clamped back to it.
 * A later multiplier cannot credit more kilowatts than the battery or the peak cap.
 */
export function demandShaveKW(nameplateKW: number, peakLoadKW = 0, effectiveness = PEAK_SHAVE_EFFECTIVENESS): number {
  const ceiling = shaveCeilingKW(nameplateKW, peakLoadKW);
  const claimed = ceiling * effectiveness;
  if (!(claimed > 0)) return 0;
  return Math.min(claimed, ceiling);
}
