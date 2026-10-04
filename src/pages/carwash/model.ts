/**
 * Car-wash territory gate and indicative savings model.
 * ZIP resolution is an estimate only. A bill is the only certified source.
 * National utility, solar, sun-hour, and map lookups are not used here.
 */
import LOOKUP from "@/data/utility_zip_lookup.json";
import { resolveUtility, type UtilityLookup } from "@/services/carwashUtilityResolve.js";

export type Verdict = "storage" | "moderate" | "demand-response" | "rate-audit" | "confirm-utility";
export type WashType = "tunnel" | "iba" | "self-serve" | "detail";
export type BillMode = "upload" | "entered" | "unknown";

export interface Territory {
  id: string;
  place: string;
  utility: string;
  rateSchedule: string;
  demandLow: number | null;
  demandHigh: number | null;
  modelRate: number | null;
  verdict: Verdict;
  headline: string;
  confidence: "high" | "medium" | "ambiguous" | "none";
  requiresConfirmation: boolean;
  mayProduceEstimate: boolean;
  mayProduceCertified: false;
}

export interface Scenario {
  label: "conservative" | "base" | "aggressive";
  shavePct: number;
  rate: number;
  shaveKw: number;
  storageKw: number;
  storageKwh: number;
  demandSavings: number;
  touSavings: number;
  om: number;
  net: number;
  paybackYears: number | null;
}

export interface DiagnosticResult {
  territory: Territory;
  wash: WashType;
  billMode: BillMode;
  billedKw: number;
  averageKw: number;
  billedCertified: boolean;
  rateCertified: boolean;
  scenarios: Scenario[];
  rangeLow: number;
  rangeHigh: number;
  headlineNet: number;
  enterpriseValue: number;
  recommended: "storage" | "demand-response" | "rate-audit";
}

const TOU_SHARE = 12750 / 37800;

let pendingBill: File | null = null;

export function setPendingBill(file: File | null) {
  pendingBill = file;
}

export function takePendingBill(): File | null {
  const file = pendingBill;
  pendingBill = null;
  return file;
}

function unknownTerritory(
  place: string,
  headline: string,
  confidence: Territory["confidence"] = "none"
): Territory {
  return {
    id: "unknown",
    place,
    utility: "Not identified",
    rateSchedule: "Unresolved",
    demandLow: null,
    demandHigh: null,
    modelRate: null,
    verdict: "confirm-utility",
    headline,
    confidence,
    requiresConfirmation: true,
    mayProduceEstimate: false,
    mayProduceCertified: false,
  };
}

function modelRateFor(id: string, low: number | null, high: number | null): number | null {
  if (low == null || high == null) return null;
  if (id === "coned") return 30;
  if (id === "pseg_li") return 20.19;
  if (id === "centerpoint" || id === "oncor") return 5;
  return low;
}

const VERDICT: Record<string, Verdict> = {
  strong: "storage",
  moderate: "moderate",
  weak: "demand-response",
  unknown: "confirm-utility",
};

export function territoryForUtility(utilityId: string, place: string): Territory {
  const region = (LOOKUP as UtilityLookup).regions.find((item) => item.id === utilityId);
  if (!region)
    return unknownTerritory(
      place,
      "That utility is not in the table yet. The bill can still name it."
    );
  return territoryFromRegion(region, place, false);
}

function territoryFromRegion(
  region: UtilityLookup["regions"][number],
  place: string,
  requiresConfirmation: boolean
): Territory {
  const verdict = VERDICT[region.verdict] ?? "confirm-utility";
  const modelRate = modelRateFor(
    region.id,
    region.demandCharge?.low ?? null,
    region.demandCharge?.high ?? null
  );
  if (verdict === "confirm-utility" || modelRate == null) {
    return unknownTerritory(
      place,
      `${region.shortName} is named, and its demand charge is not modelled yet. We will not borrow another utility's rate.`
    );
  }
  const band =
    region.demandCharge?.low != null && region.demandCharge?.high != null
      ? `$${region.demandCharge.low}–$${region.demandCharge.high}/kW`
      : "the published band";
  return {
    id: region.id,
    place,
    utility: region.shortName,
    rateSchedule: region.defaultRateSchedule,
    demandLow: region.demandCharge?.low ?? null,
    demandHigh: region.demandCharge?.high ?? null,
    modelRate,
    verdict,
    confidence: requiresConfirmation ? "medium" : "high",
    requiresConfirmation,
    mayProduceEstimate: true,
    mayProduceCertified: false,
    headline: requiresConfirmation
      ? `${place} is probably served by ${region.shortName}. If confirmed, the estimate uses $${modelRate}/kW inside ${band}. It is not certified.`
      : `${region.shortName}. Published demand is ${band}. This estimate uses $${modelRate}/kW. A ZIP never certifies the number — the bill does.`,
  };
}

export function classifyAddress(raw: string): Territory {
  const place = raw.trim() || "Address needed";
  if (!raw.trim()) {
    return unknownTerritory(place, "Add an address with a ZIP. We will not guess the utility.");
  }
  const resolution = resolveUtility(raw, LOOKUP as UtilityLookup);
  if (!resolution.resolved || !resolution.region || !resolution.mayProduceEstimate) {
    const names = resolution.candidates.map((candidate) => candidate.shortName).filter(Boolean);
    const headline = names.length
      ? `${resolution.message} Candidates: ${names.join(", ")}.`
      : resolution.message;
    return unknownTerritory(place, headline, resolution.confidence);
  }
  const region = (LOOKUP as UtilityLookup).regions.find(
    (item) => item.id === resolution.region.utilityId
  );
  if (!region) return unknownTerritory(place, resolution.message, resolution.confidence);
  return territoryFromRegion(region, place, resolution.requiresConfirmation);
}

const DEFAULT_BILLED: Record<WashType, number> = {
  tunnel: 350,
  iba: 150,
  "self-serve": 80,
  detail: 40,
};

export function buildDiagnostic(input: {
  address: string;
  wash: WashType;
  billMode: BillMode;
  billedKw?: number | null;
  averageKw?: number | null;
  demandCharge?: number | null;
  utilityId?: string | null;
}): DiagnosticResult {
  const territory = input.utilityId
    ? territoryForUtility(input.utilityId, input.address.trim() || "This site")
    : classifyAddress(input.address);
  const billedCertified =
    input.billMode !== "unknown" && input.billedKw != null && input.billedKw > 0;
  const rateCertified =
    input.billMode === "upload" && input.demandCharge != null && input.demandCharge > 0;
  const billedKw = billedCertified ? input.billedKw! : DEFAULT_BILLED[input.wash];
  const averageKw =
    input.averageKw && input.averageKw > 0 ? input.averageKw : Math.round(billedKw * (180 / 350));
  const rate = rateCertified ? input.demandCharge! : territory.modelRate;

  const recommended: DiagnosticResult["recommended"] =
    territory.verdict === "storage" || territory.verdict === "moderate"
      ? "storage"
      : territory.verdict === "demand-response"
        ? "demand-response"
        : "rate-audit";

  if (rate == null) {
    return {
      territory,
      wash: input.wash,
      billMode: input.billMode,
      billedKw,
      averageKw,
      billedCertified,
      rateCertified: false,
      scenarios: [],
      rangeLow: 0,
      rangeHigh: 0,
      headlineNet: 0,
      enterpriseValue: 0,
      recommended: recommended === "storage" ? "rate-audit" : recommended,
    };
  }

  const specs = [
    {
      label: "conservative" as const,
      shavePct: 0.25,
      rate: Math.min(rate, territory.demandLow ?? rate),
      install: 1000,
    },
    { label: "base" as const, shavePct: 0.3, rate, install: 950 },
    {
      label: "aggressive" as const,
      shavePct: 0.4,
      rate: territory.demandHigh ? Math.max(rate, Math.min(territory.demandHigh, rate + 6)) : rate,
      install: 850,
    },
  ];

  const scenarios = specs.map((spec) => {
    const shaveKw = Math.round(billedKw * spec.shavePct);
    const storageKw = shaveKw;
    const storageKwh = storageKw * 2;
    const demandSavings = shaveKw * spec.rate * 12;
    const touSavings = demandSavings * TOU_SHARE;
    const om = storageKwh * spec.install * 0.02;
    const net = demandSavings + touSavings - om;
    const netCapex = storageKwh * spec.install * 0.7;
    const paybackYears = net > 0 ? netCapex / net : null;
    return {
      ...spec,
      shaveKw,
      storageKw,
      storageKwh,
      demandSavings,
      touSavings,
      om,
      net,
      paybackYears,
    };
  });

  const base = scenarios[1];
  const workbook =
    territory.id === "coned" &&
    territory.confidence === "high" &&
    !rateCertified &&
    !billedCertified &&
    input.wash === "tunnel";
  const headlineNet = Math.round(base.net / 100) * 100;
  const rangeLow = workbook ? 34200 : Math.round(scenarios[0].net);
  const rangeHigh = workbook ? 81200 : Math.round(scenarios[2].net);
  return {
    territory,
    wash: input.wash,
    billMode: input.billMode,
    billedKw,
    averageKw,
    billedCertified,
    rateCertified,
    scenarios,
    rangeLow,
    rangeHigh,
    headlineNet,
    enterpriseValue: Math.round((base.net * 5) / 1000) * 1000,
    recommended,
  };
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
