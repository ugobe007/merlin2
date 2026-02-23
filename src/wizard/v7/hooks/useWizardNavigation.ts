/**
 * useWizardNavigation.ts
 * 
 * Op1e-4 Extraction (Feb 22, 2026)
 * 
 * RESPONSIBILITIES:
 * - Step-to-step navigation (goToStep, nextStep)
 * - Gate validation (can user proceed to target step?)
 * - Minimal location hydration (ZIP → LocationCard when needed)
 * - Step requirement enforcement (prevent invalid state transitions)
 * 
 * EXTRACTED FROM: useWizardV7.ts (lines 698-865, 1640-1781, 2087-2099)
 * EXTRACTED LINES: ~323 lines
 * 
 * ARCHITECTURE:
 * - Helper functions for location validation
 * - stepCanProceed: Monotonic gate enforcement
 * - goToStep: Main navigation with gate checks + template loading
 * - nextStep: Simple sequencing in 6-step flow
 * 
 * ✅ Op1e-4 Complete: Navigation logic fully extracted (Feb 22, 2026)
 */

import type { WizardState, WizardStep, Intent, LocationCard, Step3Template } from "./useWizardV7";
import * as api from "../api/wizardAPI";

/* ============================================================
   Helper Functions - Location Validation
============================================================ */

/**
 * Normalize ZIP to exactly 5 digits (strips non-digits, truncates).
 * Exported for use in other hooks.
 */
export function getNormalizedZip(state: WizardState): string {
  const raw = state.location?.postalCode ?? state.locationRawInput ?? "";
  return raw.replace(/\D/g, "").slice(0, 5);
}

/** Strip to exactly 5 digits (or fewer if input is short). */
function normalizeZip5(s: string): string {
  return (s ?? "").replace(/\D/g, "").slice(0, 5);
}

/** True when the string contains a valid US 5-digit ZIP. */
function _isZip5(s: string): boolean {
  return normalizeZip5(s).length === 5;
}

function _hasState(location: LocationCard | null): boolean {
  // your bug: "STATE never confirms"
  return !!location?.state && location.state.trim().length >= 2;
}

/**
 * ✅ FIX (Feb 5, 2026): ZIP is location. City/state are enrichment.
 * Returns true if we have a LocationCard OR a valid 5-digit ZIP.
 * Prevents "Location missing" when geocode hasn't resolved yet.
 */
function hasValidLocation(state: WizardState): boolean {
  if (state.location) return true;
  return getNormalizedZip(state).length >= 5;
}

/**
 * Basic ZIP prefix → state code lookup (synchronous, no DB needed).
 * Uses US Postal Service ZIP prefix assignment table.
 * This ensures buildMinimalLocationFromZip always returns a state when possible.
 */
function getStateFromZipPrefix(zip: string): string | undefined {
  const prefix = parseInt(zip.substring(0, 3), 10);
  if (isNaN(prefix)) return undefined;

  // US ZIP prefix ranges → state codes
  if (prefix >= 995 && prefix <= 999) return "AK";
  if (prefix >= 35 && prefix <= 36) return "AL";
  if (prefix >= 716 && prefix <= 729) return "AR";
  if (prefix >= 850 && prefix <= 865) return "AZ";
  if (prefix >= 900 && prefix <= 961) return "CA";
  if (prefix >= 800 && prefix <= 816) return "CO";
  if (prefix >= 60 && prefix <= 69) return "CT";
  if (prefix === 200 || prefix === 202 || (prefix >= 203 && prefix <= 205)) return "DC";
  if (prefix === 197 || prefix === 198 || prefix === 199) return "DE";
  if (prefix >= 320 && prefix <= 349) return "FL";
  if ((prefix >= 300 && prefix <= 319) || prefix === 398 || prefix === 399) return "GA";
  if (prefix >= 967 && prefix <= 968) return "HI";
  if (prefix >= 500 && prefix <= 528) return "IA";
  if (prefix >= 832 && prefix <= 838) return "ID";
  if (prefix >= 600 && prefix <= 629) return "IL";
  if (prefix >= 460 && prefix <= 479) return "IN";
  if (prefix >= 660 && prefix <= 679) return "KS";
  if (prefix >= 400 && prefix <= 427) return "KY";
  if (prefix >= 700 && prefix <= 714) return "LA";
  if (prefix >= 10 && prefix <= 27) return "MA";
  if (prefix >= 206 && prefix <= 219) return "MD";
  if (prefix >= 39 && prefix <= 49) return "ME";
  if (prefix >= 480 && prefix <= 499) return "MI";
  if (prefix >= 550 && prefix <= 567) return "MN";
  if (prefix >= 630 && prefix <= 658) return "MO";
  if (prefix >= 386 && prefix <= 397) return "MS";
  if (prefix >= 590 && prefix <= 599) return "MT";
  if (prefix >= 270 && prefix <= 289) return "NC";
  if (prefix >= 580 && prefix <= 588) return "ND";
  if (prefix >= 680 && prefix <= 693) return "NE";
  if (prefix >= 30 && prefix <= 38) return "NH";
  if (prefix >= 70 && prefix <= 89) return "NJ";
  if (prefix >= 870 && prefix <= 884) return "NM";
  if (prefix >= 889 && prefix <= 898) return "NV";
  if (prefix >= 100 && prefix <= 149) return "NY";
  if (prefix >= 430 && prefix <= 459) return "OH";
  if (prefix >= 730 && prefix <= 749) return "OK";
  if (prefix >= 970 && prefix <= 979) return "OR";
  if (prefix >= 150 && prefix <= 196) return "PA";
  if (prefix >= 28 && prefix <= 29) return "RI";
  if (prefix >= 290 && prefix <= 299) return "SC";
  if (prefix >= 570 && prefix <= 577) return "SD";
  if (prefix >= 370 && prefix <= 385) return "TN";
  if ((prefix >= 750 && prefix <= 799) || (prefix >= 885 && prefix <= 888)) return "TX";
  if (prefix >= 840 && prefix <= 847) return "UT";
  if (prefix >= 220 && prefix <= 246) return "VA";
  if (prefix >= 50 && prefix <= 59) return "VT";
  if (prefix >= 980 && prefix <= 994) return "WA";
  if (prefix >= 530 && prefix <= 549) return "WI";
  if (prefix >= 247 && prefix <= 268) return "WV";
  if (prefix >= 820 && prefix <= 831) return "WY";

  return undefined;
}

/**
 * Build a minimal LocationCard from ZIP when geocode hasn't resolved.
 * ✅ FIX Feb 2026: Now includes state code from ZIP prefix lookup.
 * Downstream services accept this gracefully (city optional, state preferred).
 * Exported for use in other hooks (e.g., useWizardStep3).
 */
export function buildMinimalLocationFromZip(state: WizardState): LocationCard | null {
  const zip = getNormalizedZip(state);
  if (zip.length < 5) return null;

  // Synchronous state lookup from ZIP prefix (no DB, no async)
  const stateCode = getStateFromZipPrefix(zip);
  const city: string | undefined = undefined; // City requires geocoding

  return {
    formattedAddress: zip,
    postalCode: zip,
    city,
    state: stateCode,
    countryCode: "US",
  };
}

/**
 * Monotonic gate validation: Check if step requirements are satisfied.
 * Used by goToStep to enforce forward-only progression with valid state.
 * 
 * Exported for use in gates computation (useWizardV7).
 */
export function stepCanProceed(state: WizardState, step: WizardStep): { ok: boolean; reason?: string } {
  if (step === "location") {
    // Check for valid ZIP (5+ digits) OR location object with address
    // Business name and address are OPTIONAL - ZIP alone is sufficient
    const normalizedZip = getNormalizedZip(state);

    // Valid ZIP is always sufficient (5+ digits for US, 3+ for international)
    if (normalizedZip.length >= 5) {
      return { ok: true };
    }

    // Also allow if location resolved (from address lookup) even without ZIP
    if (state.location?.formattedAddress) {
      return { ok: true };
    }

    return { ok: false, reason: "Please enter a valid ZIP/postal code." };
  }
  if (step === "industry") {
    // ✅ FIX (Feb 5, 2026): ZIP is location — don't require geocoded LocationCard
    if (!hasValidLocation(state)) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto")
      return { ok: false, reason: "Industry not selected or inferred." };
    return { ok: true };
  }
  if (step === "profile") {
    // ✅ FIX (Feb 5, 2026): ZIP is location — don't require geocoded LocationCard
    if (!hasValidLocation(state)) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto") return { ok: false, reason: "Industry missing." };
    if (!state.step3Template) return { ok: false, reason: "Step 3 template missing." };
    return { ok: true };
  }
  if (step === "results") {
    // Phase 6: Only require step3Complete. Pricing is non-blocking.
    // Results page will show spinner/banner based on pricingStatus.
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  if (step === "options") {
    // Options step requires profile to be complete
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  if (step === "magicfit") {
    // MagicFit requires options step visited (step3Complete is sufficient)
    if (!state.step3Complete) return { ok: false, reason: "Step 3 incomplete." };
    return { ok: true };
  }
  return { ok: false, reason: "Unknown step." };
}

/* ============================================================
   Hook Interfaces
============================================================ */

export interface UseWizardNavigationParams {
  state: WizardState;
  dispatch: (intent: Intent) => void;
  clearError: () => void;
  setBusy: (busy: boolean, message?: string) => void;
  setError: (error: unknown) => void;
  setStep: (step: WizardStep, reason: string) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
}

export interface UseWizardNavigationResult {
  goToStep: (target: WizardStep) => Promise<void>;
  nextStep: () => WizardStep | null;
}

/* ============================================================
   Main Hook
============================================================ */

import { useCallback } from "react";

function isAbort(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || (err as { code?: string }).code === "ABORTED")
  );
}

export function useWizardNavigation(params: UseWizardNavigationParams): UseWizardNavigationResult {
  const { state, dispatch, clearError, setBusy, setError, setStep, abortRef } = params;

  /* ============================================================
     goToStep: Main navigation with gate validation
  ============================================================ */

  const goToStep = useCallback(
    async (target: WizardStep) => {
      clearError();
      dispatch({ type: "DEBUG_TAG", lastAction: "goToStep" });

      // enforce monotonic gating: you can go back freely, but forward must be valid
      if (target === "location") {
        setStep("location", "nav");
        return;
      }

      if (target === "industry") {
        // ✅ FIX (Feb 5, 2026): ZIP is location — auto-create minimal LocationCard if needed
        if (!state.location) {
          const minCard = buildMinimalLocationFromZip(state);
          if (!minCard) {
            setError({ code: "STATE", message: "Please enter a valid ZIP code." });
            return;
          }
          // Hydrate location from ZIP so downstream gates pass
          dispatch({ type: "SET_LOCATION", location: minCard });
          dispatch({
            type: "DEBUG_NOTE",
            note: "Auto-created minimal LocationCard from ZIP (geocode pending)",
          });
        }
        setStep("industry", "nav");
        return;
      }

      if (target === "profile") {
        const okIndustry = stepCanProceed(state, "industry");
        if (!okIndustry.ok) {
          setError({ code: "STATE", message: okIndustry.reason ?? "Cannot proceed to Step 3." });
          return;
        }
        // Ensure template loaded
        if (!state.step3Template) {
          const controller = new AbortController();
          abortRef.current = controller;
          try {
            setBusy(true, "Loading profile template...");
            const template = await api.loadStep3Template(state.industry, controller.signal);
            dispatch({ type: "SET_STEP3_TEMPLATE", template });
            dispatch({
              type: "SET_TEMPLATE_MODE",
              mode: (template.industry as string) === "generic" ? "fallback" : "industry",
            });

            // ✅ PROVENANCE: Apply baseline defaults on navigation too
            const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
            dispatch({
              type: "SET_STEP3_ANSWERS",
              answers: baselineAnswers,
              source: "template_default",
            });

            // ✅ PROVENANCE: Apply intel patches separately
            const intelPatch = api.buildIntelPatch(state.locationIntel);
            if (Object.keys(intelPatch).length > 0) {
              dispatch({
                type: "PATCH_STEP3_ANSWERS",
                patch: intelPatch,
                source: "location_intel",
              });
            }

            // ✅ PROVENANCE: Apply business detection patches separately
            const businessPatch = api.buildBusinessPatch(state.businessCard);
            if (Object.keys(businessPatch).length > 0) {
              dispatch({
                type: "PATCH_STEP3_ANSWERS",
                patch: businessPatch,
                source: "business_detection",
              });
            }
          } catch (err: unknown) {
            if (isAbort(err)) setError({ code: "ABORTED", message: "Request cancelled." });
            else setError(err);
            return;
          } finally {
            setBusy(false);
            abortRef.current = null;
          }
        }
        setStep("profile", "nav");
        return;
      }

      if (target === "results") {
        // ✅ FIX (Feb 10, 2026): Check prerequisites before allowing Results step
        // This prevents Step3→Step4 with invalid state (locationConfirmed=false, etc.)
        if (!state.locationConfirmed) {
          setError({ code: "STATE", message: "Location not confirmed. Please complete Step 1." });
          setStep("location", "prereq_missing");
          return;
        }
        if (!state.goalsConfirmed) {
          setError({ code: "STATE", message: "Goals not confirmed. Please complete Step 1." });
          setStep("location", "prereq_missing");
          return;
        }
        if (!state.step3Complete) {
          setError({
            code: "STATE",
            message: "Step 3 incomplete. Please answer all required questions.",
          });
          setStep("profile", "prereq_missing");
          return;
        }

        const ok = stepCanProceed(state, "results");
        if (!ok.ok) {
          setError({ code: "STATE", message: ok.reason ?? "Cannot proceed to Results." });
          return;
        }
        setStep("results", "nav");
        return;
      }

      if (target === "options") {
        if (!state.step3Complete) {
          setError({ code: "STATE", message: "Please complete Step 3 first." });
          return;
        }
        setStep("options", "nav");
        return;
      }

      if (target === "magicfit") {
        if (!state.step3Complete) {
          setError({ code: "STATE", message: "Please complete Step 3 first." });
          return;
        }
        setStep("magicfit", "nav");
        return;
      }
    },
    [clearError, setBusy, setError, setStep, state, dispatch, abortRef]
  );

  /* ============================================================
     nextStep: Simple sequencing helper
  ============================================================ */

  const nextStep = useCallback((): WizardStep | null => {
    if (state.step === "location") {
      // Skip industry if already locked
      if (state.industryLocked && state.industry && state.industry !== "auto") {
        return "profile";
      }
      return "industry";
    }
    if (state.step === "industry") return "profile";
    if (state.step === "profile") return "options";
    if (state.step === "options") return "magicfit";
    if (state.step === "magicfit") return "results";
    return null;
  }, [state.step, state.industryLocked, state.industry]);

  /* ============================================================
     Return
  ============================================================ */

  return {
    goToStep,
    nextStep,
  };
}
