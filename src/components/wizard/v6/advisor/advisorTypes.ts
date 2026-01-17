// src/components/wizard/v6/advisor/advisorTypes.ts

export type AdvisorMode = "estimate" | "verified";

// Keep this tight. If Vineet wants more, we add deliberately.
export type AdvisorCardType = "discovery" | "tip" | "progress" | "action" | "summary";

export type AdvisorBadge =
  | "Estimate"
  | "Not Verified"
  | "TrueQuote Verified"
  | "Recommended"
  | "Most Popular"
  | "High Opportunity"
  | "Business Continuity";

export interface AdvisorCard {
  id: string;              // unique within payload
  type: AdvisorCardType;
  title: string;
  body?: string;           // short; budget-enforced
  badge?: AdvisorBadge;
  // future-safe: optional structured fields (no behavior)
  meta?: Record<string, string | number | boolean>;
}

export interface AdvisorPayload {
  // required contract
  step: number;            // 1..7
  key: string;             // stable per step (e.g. "step-1", or "step-4:hotel")
  mode: AdvisorMode;

  headline: string;
  subline?: string;

  // max 3 enforced
  cards: AdvisorCard[];

  // REQUIRED in estimate mode (enforced + default injected)
  disclaimer?: string;

  // optional: shows in dev
  debug?: {
    source?: string;       // "Step1Location", "Step4Options"
    ts?: string;           // ISO timestamp
  };
}

export interface AdvisorPublishOptions {
  // default true: clearing on step change prevents stale rail
  clearOnStepChange?: boolean;

  // dev-only: show warnings
  enableWarnings?: boolean;
}

export interface AdvisorContextValue {
  publish: (payload: AdvisorPayload) => void;
  clear: (key?: string) => void;
  getCurrent: () => AdvisorPayload | null;
  getWarnings: () => string[];
}
