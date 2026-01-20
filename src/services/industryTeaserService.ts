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
  hotel: { avgPeakKW: 350, peakShavingPct: 0.25, solarFitPct: 0.30, typicalBESSKW: 150, typicalSolarKW: 200, durationHrs: 4, dataSource: "ASHRAE 90.1" },
  "car-wash": { avgPeakKW: 200, peakShavingPct: 0.35, solarFitPct: 0.40, typicalBESSKW: 113, typicalSolarKW: 158, durationHrs: 4, dataSource: "Merlin Analysis" },
  "ev-charging": { avgPeakKW: 500, peakShavingPct: 0.40, solarFitPct: 0.35, typicalBESSKW: 250, typicalSolarKW: 300, durationHrs: 4, dataSource: "SAE J1772" },
  manufacturing: { avgPeakKW: 800, peakShavingPct: 0.30, solarFitPct: 0.25, typicalBESSKW: 400, typicalSolarKW: 500, durationHrs: 4, dataSource: "EIA MECS" },
  "data-center": { avgPeakKW: 2000, peakShavingPct: 0.20, solarFitPct: 0.15, typicalBESSKW: 1000, typicalSolarKW: 800, durationHrs: 4, dataSource: "Uptime Institute" },
  hospital: { avgPeakKW: 1500, peakShavingPct: 0.20, solarFitPct: 0.20, typicalBESSKW: 750, typicalSolarKW: 600, durationHrs: 4, dataSource: "NEC 517" },
  retail: { avgPeakKW: 250, peakShavingPct: 0.30, solarFitPct: 0.35, typicalBESSKW: 100, typicalSolarKW: 150, durationHrs: 4, dataSource: "CBECS 2018" },
  office: { avgPeakKW: 400, peakShavingPct: 0.25, solarFitPct: 0.30, typicalBESSKW: 200, typicalSolarKW: 250, durationHrs: 4, dataSource: "CBECS 2018" },
  default: { avgPeakKW: 300, peakShavingPct: 0.28, solarFitPct: 0.30, typicalBESSKW: 150, typicalSolarKW: 200, durationHrs: 4, dataSource: "CBECS Average" },
};

export function getIndustryTeaserProfile(industrySlug: string | null | undefined): IndustryTeaserProfile {
  const normalized = (industrySlug || "default").replace(/_/g, "-").toLowerCase();
  return TEASER_FALLBACK_PROFILES[normalized] || TEASER_FALLBACK_PROFILES.default;
}
