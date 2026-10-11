/**
 * Customer quote contract.
 *
 * The page renders POST /api/quote (server/routes/quote.js): tiers, confidence,
 * provenance, monteCarlo. It does not read packages/core QuoteResult, and it
 * does not render `installer`. Those are different contracts; mixing them is
 * how netCost and netInvestment got treated as the same field.
 */
import type { Territory, WashType } from "./model";

export type QuoteTierKey = "starter" | "recommended" | "complete";

export interface ApiQuoteTier {
  label: string;
  equipment: {
    solarKW: number;
    bessKW: number;
    bessKWh: number;
    durationHrs: number;
    generatorKW: number;
    l2Chargers: number;
    dcfcChargers: number;
    hpcChargers: number;
    truckStopCabinets: number;
  };
  costs: {
    solarCost: number;
    bessCost: number;
    generatorCost: number;
    evChargingCost: number;
    equipmentSubtotal: number;
    siteEngineering: number;
    constructionContingency: number;
    merlinFees: {
      designIntelligence: number;
      procurementSourcing: number;
      pmConstruction: number;
      incentiveFiling: number;
      totalFee: number;
      effectiveMargin: number;
      annualMonitoring: number;
    };
    totalInvestment: number;
    federalITC: number;
    netInvestment: number;
    returnCapital: { investment: number };
    complianceCapital: { investment: number };
    annualReserves: number;
  };
  savings: {
    demandChargeSavings: number;
    shaveEffectiveness?: number;
    effectiveShaveKW?: number;
    creditedShaveKW?: number;
    uncreditedShaveKW?: number;
    shaveCapped?: boolean;
    solarKWhProduced: number;
    solarSavings: number;
    evChargingRevenue: number;
    grossAnnualSavings: number;
    annualReserves: number;
    netAnnualSavings: number;
  };
  roi: {
    paybackYears: number;
    paysBackInLife: boolean;
    warrantyYears: number;
    warrantyTerms: { years: number; netBack: number; paidOff: boolean }[];
    monthlySavings: number;
    netBack5Year: number;
    netBack10Year: number;
    netBack20Year: number;
    netBack25Year: number;
    year1ROI: number | null;
    roi10Year: number | null;
    roi25Year: number | null;
    npv25Year: number;
  };
  blendedRoi?: {
    paybackYears: number;
  };
}

export interface ApiQuote {
  ok: true;
  location: { formattedAddress: string; stateCode: string | null };
  solar: { peakSunHours: number; source: string };
  inputs: {
    industry: string;
    facilityParams: {
      peakLoadKW: number;
      electricityRate: number;
      demandCharge: number;
      bessApplication: string;
    };
    industryDefaultsApplied: boolean;
  };
  tiers: Record<QuoteTierKey, ApiQuoteTier>;
  confidence: { score: number; tier: string; description: string };
  monteCarlo: {
    p10: { paybackYears: number; annualSavings: string; label: string };
    p50: { paybackYears: number; annualSavings: string; label: string };
    p90: { paybackYears: number; annualSavings: string; label: string };
    note: string;
  };
  equipmentSelection: {
    bess: { vendor?: string; model?: string; scoreBase?: number };
    note?: string;
  };
  provenance: Record<
    string,
    { tag: "benchmark" | "estimate" | "verified" | string; source: string }
  >;
  meta?: {
    itcNote?: string;
    bessMethod?: string;
    pricingSource?: string;
    notes?: string[];
  };
}

/** Con Edison SC-9 demand charge when the bill has not certified the rate. */
export const CONED_UNCERTIFIED_DEMAND_PER_KW = 36;

const WASH_PEAK: Record<WashType, number> = {
  tunnel: 350,
  iba: 150,
  "self-serve": 80,
  detail: 40,
};

export interface QuoteRequestContext {
  peakStatus: "certified" | "entered" | "estimated" | "provisional";
  peakSourceText: string;
  rateStatus: "certified" | "entered" | "estimated" | "provisional";
  rateSourceText: string;
}

/** Inputs for POST /api/quote. The server sizes and prices; this only names the site. */
export function buildQuoteRequest(input: {
  address: string;
  wash: WashType;
  billMode: "upload" | "entered" | "unknown";
  billedKw: string;
  demandCharge: number | null;
  territory: Territory;
}): { body: Record<string, unknown>; context: QuoteRequestContext } {
  const enteredPeak = Number(input.billedKw);
  const hasPeak = enteredPeak > 0;
  const peakLoadKW = hasPeak ? enteredPeak : WASH_PEAK[input.wash];
  const peakSource =
    input.billMode === "upload" && hasPeak
      ? "utility_bill"
      : hasPeak
        ? "override"
        : "industry_default";

  const peakStatus: QuoteRequestContext["peakStatus"] =
    peakSource === "utility_bill"
      ? "certified"
      : peakSource === "override"
        ? "entered"
        : "estimated";
  const peakSourceText =
    peakStatus === "certified"
      ? "Read from your bill"
      : peakStatus === "entered"
        ? "You entered this"
        : "Typical billed demand for this wash, until the bill arrives";

  const billRate =
    input.billMode === "upload" && input.demandCharge != null && input.demandCharge > 0
      ? input.demandCharge
      : null;
  const territory = input.territory;
  let demand: number | null = billRate;
  let rateStatus: QuoteRequestContext["rateStatus"] = "provisional";
  let rateSourceText = "Industry default until a utility tariff is named";

  if (billRate != null) {
    rateStatus = "certified";
    rateSourceText = "Read from your bill";
  } else if (
    territory.confidence !== "none" &&
    territory.demandLow != null &&
    territory.demandHigh != null
  ) {
    demand =
      territory.id === "coned"
        ? CONED_UNCERTIFIED_DEMAND_PER_KW
        : Math.round(((territory.demandLow + territory.demandHigh) / 2) * 100) / 100;
    rateStatus = "estimated";
    rateSourceText =
      territory.id === "coned"
        ? `${territory.utility} ${territory.rateSchedule}, filed schedule`
        : `${territory.utility} ${territory.rateSchedule}, published band`;
  }

  const body: Record<string, unknown> = {
    industry: "car_wash",
    location: input.address,
    peakLoadKW,
    peakSource,
    bessApplication: "peak_shaving",
  };
  if (demand != null) {
    body.demandCharge = demand;
    body.rateSource = "override";
  }

  return { body, context: { peakStatus, peakSourceText, rateStatus, rateSourceText } };
}
