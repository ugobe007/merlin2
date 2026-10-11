export interface ZipHit {
  zip5: string;
  zip4: string | null;
  source: string;
}

export interface DemandCharge {
  low: number | null;
  high: number | null;
  unit?: string;
  detail?: string;
}

export interface PublicRegion {
  utilityId: string;
  utility: string;
  shortName: string;
  state: string;
  isMunicipal: boolean;
  rateSchedule: string;
  demandCharge: DemandCharge;
  verdict: "strong" | "moderate" | "weak" | "unknown";
  verdictMeaning: string | null;
  confidence: string;
  reason: string | null;
}

export interface UtilityResolution {
  resolved: boolean;
  confidence: "high" | "medium" | "ambiguous" | "none";
  requiresConfirmation: boolean;
  zip: string | null;
  region: PublicRegion | null;
  candidates: PublicRegion[];
  message: string;
  mayProduceEstimate: boolean;
  mayProduceCertified: false;
}

export interface UtilityLookup {
  regions: Array<{
    id: string;
    utility: string;
    shortName: string;
    state: string;
    isMunicipal?: boolean;
    defaultRateSchedule: string;
    demandCharge: DemandCharge;
    verdict: "strong" | "moderate" | "weak" | "unknown";
    prefixes?: { high?: string[]; medium?: string[]; ambiguous?: string[] };
    notes?: string[];
    standardExclusions?: string[];
  }>;
  verdicts: Record<string, { meaning?: string }>;
  overrides?: Array<{ zip5: string; utilityId: string; reason?: string }>;
}

export function extractZip(address: string): ZipHit | null;
export function resolveUtility(address: string, lookup: UtilityLookup): UtilityResolution;
export function reconcileWithBill(
  resolution: UtilityResolution,
  utilityNameOnBill: string | null | undefined,
  lookup: UtilityLookup
): {
  utilityId: string | null;
  source: "bill";
  discrepancy: { zipResolved: string; billSays: string; action: string } | null;
  reconciled: boolean;
};
