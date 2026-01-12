/**
 * Wizard Fingerprint for Quote Caching
 *
 * Creates a stable fingerprint of wizard state inputs for idempotent quote generation.
 * Only includes inputs that affect TrueQuote calculation.
 * Excludes outputs like calculations/quoteResult.
 */

import type { WizardState } from "../types";

export function fingerprintWizardForQuote(state: WizardState): string {
  // Include only inputs that affect TrueQuote calculation.
  // Exclude outputs like calculations/quoteResult.
  const fingerprint = {
    location: { zipCode: state.zipCode, state: state.state },
    industry: state.industry,
    inputs: state.useCaseData?.inputs ?? {},
    preferences: {
      selectedOptions: state.selectedOptions ?? [],
      customSolarKw: state.customSolarKw ?? null,
      customGeneratorKw: state.customGeneratorKw ?? null,
      customEvL2: state.customEvL2 ?? null,
      customEvDcfc: state.customEvDcfc ?? null,
      electricityRate: state.electricityRate ?? null,
    },
  };

  return JSON.stringify(fingerprint);
}
