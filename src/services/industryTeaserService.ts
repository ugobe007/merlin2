export type IndustryTeaserProfile = {
  avgPeakKW: number;
  peakShavingPct: number;
  solarFitPct: number;
  typicalBESSKW: number;
  typicalSolarKW: number;
  durationHrs: number;
  dataSource: string;
};

const TEASER_FALLBACK_PROFILES: Record<string, IndustryTeaserProfile> = {
  // Solar values = realistic ROOFTOP-ONLY estimates based on building footprint constraints
  // TrueQuote™: Max roof kW = footprint × usable% × 15 W/sqft / 1000
  // See solarCalculator.ts INDUSTRY_SOLAR_CONFIG for full derivations
  hotel: { avgPeakKW: 350, peakShavingPct: 0.25, solarFitPct: 0.30, typicalBESSKW: 150, typicalSolarKW: 105, durationHrs: 4, dataSource: "ASHRAE 90.1, NREL Rooftop PV" },
  "car-wash": { avgPeakKW: 200, peakShavingPct: 0.35, solarFitPct: 0.40, typicalBESSKW: 113, typicalSolarKW: 40, durationHrs: 4, dataSource: "ICA 2024, NREL Rooftop PV" },
  "ev-charging": { avgPeakKW: 500, peakShavingPct: 0.40, solarFitPct: 0.35, typicalBESSKW: 250, typicalSolarKW: 150, durationHrs: 4, dataSource: "SAE J1772, canopy-primary" },
  manufacturing: { avgPeakKW: 800, peakShavingPct: 0.30, solarFitPct: 0.25, typicalBESSKW: 400, typicalSolarKW: 500, durationHrs: 4, dataSource: "EIA MECS, NREL Rooftop PV" },
  "data-center": { avgPeakKW: 2000, peakShavingPct: 0.20, solarFitPct: 0.15, typicalBESSKW: 1000, typicalSolarKW: 180, durationHrs: 4, dataSource: "Uptime Institute, NREL Rooftop PV" },
  hospital: { avgPeakKW: 1500, peakShavingPct: 0.20, solarFitPct: 0.20, typicalBESSKW: 750, typicalSolarKW: 300, durationHrs: 4, dataSource: "NEC 517, NREL Rooftop PV" },
  retail: { avgPeakKW: 250, peakShavingPct: 0.30, solarFitPct: 0.35, typicalBESSKW: 100, typicalSolarKW: 150, durationHrs: 4, dataSource: "CBECS 2018, SEIA Solar Means Business" },
  office: { avgPeakKW: 400, peakShavingPct: 0.25, solarFitPct: 0.30, typicalBESSKW: 200, typicalSolarKW: 90, durationHrs: 4, dataSource: "CBECS 2018, NREL Rooftop PV" },
  warehouse: { avgPeakKW: 300, peakShavingPct: 0.30, solarFitPct: 0.60, typicalBESSKW: 150, typicalSolarKW: 800, durationHrs: 4, dataSource: "CBECS 2018, NREL Rooftop PV" },
  restaurant: { avgPeakKW: 150, peakShavingPct: 0.25, solarFitPct: 0.20, typicalBESSKW: 75, typicalSolarKW: 24, durationHrs: 4, dataSource: "ASHRAE 90.1, NREL Rooftop PV" },
  "gas-station": { avgPeakKW: 100, peakShavingPct: 0.30, solarFitPct: 0.35, typicalBESSKW: 50, typicalSolarKW: 25, durationHrs: 4, dataSource: "EIA, NREL Rooftop PV" },
  apartment: { avgPeakKW: 200, peakShavingPct: 0.20, solarFitPct: 0.25, typicalBESSKW: 100, typicalSolarKW: 54, durationHrs: 4, dataSource: "CBECS 2018, NREL Rooftop PV" },
  college: { avgPeakKW: 800, peakShavingPct: 0.25, solarFitPct: 0.30, typicalBESSKW: 400, typicalSolarKW: 300, durationHrs: 4, dataSource: "CBECS 2018, NREL Rooftop PV" },
  casino: { avgPeakKW: 2000, peakShavingPct: 0.25, solarFitPct: 0.25, typicalBESSKW: 1000, typicalSolarKW: 900, durationHrs: 4, dataSource: "ASHRAE 90.1, NREL Rooftop PV" },
  airport: { avgPeakKW: 5000, peakShavingPct: 0.20, solarFitPct: 0.15, typicalBESSKW: 2500, typicalSolarKW: 600, durationHrs: 4, dataSource: "FAA, NREL Rooftop PV" },
  default: { avgPeakKW: 300, peakShavingPct: 0.28, solarFitPct: 0.30, typicalBESSKW: 150, typicalSolarKW: 100, durationHrs: 4, dataSource: "CBECS Average, NREL Rooftop PV" },
};

export function getIndustryTeaserProfile(industrySlug: string | null | undefined): IndustryTeaserProfile {
  const normalized = (industrySlug || "default").replace(/_/g, "-").toLowerCase();
  return TEASER_FALLBACK_PROFILES[normalized] || TEASER_FALLBACK_PROFILES.default;
}
