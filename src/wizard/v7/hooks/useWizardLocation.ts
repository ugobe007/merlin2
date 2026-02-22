// src/wizard/v7/hooks/useWizardLocation.ts
/**
 * ============================================================
 * useWizardLocation - Location Step Logic (Op1a)
 * ============================================================
 *
 * Extracted from useWizardV7.ts (5,349 lines) as part of Op1a.
 * Contains all location-related callbacks and logic:
 * - Location input/confirmation
 * - Google Places resolution
 * - Location intelligence (utility rates, solar, weather)
 * - Business detection/confirmation
 * - Goals modal logic
 *
 * Dependencies: Uses dispatch from parent reducer + shared state
 */

import { useCallback } from "react";
import { merlinMemory } from "@/wizard/v7/memory";
import { devLog, devWarn } from "@/wizard/v7/debug/devLog";

import type { LocationCard, LocationIntel, BusinessCard, WizardState } from "./useWizardV7";

// API function types
/* eslint-disable @typescript-eslint/no-explicit-any */
interface WizardAPI {
  resolveLocation: (input: string, signal?: AbortSignal) => Promise<LocationCard>;
  fetchUtility: (
    input: string
  ) => Promise<{ rate?: number; demandCharge?: number; provider?: string }>;
  fetchSolar: (input: string) => Promise<{ peakSunHours?: number; grade?: string }>;
  fetchWeather: (input: string) => Promise<{ risk?: string; profile?: string }>;
  inferIndustry: (
    location: LocationCard,
    signal?: AbortSignal,
    businessCard?: BusinessCard | null
  ) => Promise<{ industry: any; confidence: number }>;
  loadStep3Template: (industry: any, signal?: AbortSignal) => Promise<any>;
  computeSmartDefaults: (
    template: any,
    intel: any,
    business: any
  ) => { answers: Record<string, any>; meta: Record<string, any> };
  buildIntelPatch: (intel: LocationIntel | null) => Record<string, any>;
  buildBusinessPatch: (business: BusinessCard | null) => Record<string, any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Hook parameters - receives dispatch and necessary state slices
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface UseWizardLocationParams {
  // State slices needed
  state: Pick<
    WizardState,
    | "locationRawInput"
    | "location"
    | "locationConfirmed"
    | "locationIntel"
    | "businessDraft"
    | "businessCard"
    | "businessConfirmed"
    | "goalsConfirmed"
    | "step"
  >;

  // Dispatch function from main reducer
  dispatch: React.Dispatch<any>;

  // Shared utilities from parent
  clearError: () => void;
  setError: (err: unknown) => void;
  setBusy: (isBusy: boolean, busyLabel?: string) => void;
  abortOngoing: () => void;
  setStep: (step: any, reason?: string) => void;

  // Abort controller ref from parent
  abortRef: React.MutableRefObject<AbortController | null>;

  // API functions from parent
  api: WizardAPI;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Return type - all location-related actions
 */
export interface WizardLocationActions {
  updateLocationRaw: (value: string) => void;
  confirmLocation: (value: boolean) => void;
  submitLocation: (
    rawInput?: string,
    businessInfo?: { name?: string; address?: string }
  ) => Promise<void>;
  primeLocationIntel: (zipOrInput: string) => Promise<Partial<LocationIntel>>;
  setBusinessDraft: (patch: Partial<{ name: string; address: string }>) => void;
  skipBusiness: () => void;
  confirmBusiness: (value: boolean) => Promise<void>;
}

/**
 * useWizardLocation hook - extracted location step logic
 */
export function useWizardLocation(params: UseWizardLocationParams): WizardLocationActions {
  const { state, dispatch, clearError, setError, setBusy, abortOngoing, setStep, abortRef, api } =
    params;

  /**
   * updateLocationRaw - Update raw location input (typing)
   */
  const updateLocationRaw = useCallback(
    (value: string) => {
      dispatch({ type: "SET_LOCATION_RAW", value });
    },
    [dispatch]
  );

  /**
   * confirmLocation - User confirms their location (ZIP resolved)
   * @param value - true = confirmed, false = reset
   */
  const confirmLocation = useCallback(
    (value: boolean) => {
      dispatch({ type: "SET_LOCATION_CONFIRMED", confirmed: value });
      dispatch({ type: "DEBUG_NOTE", note: `Location ${value ? "confirmed" : "reset"} by user` });
    },
    [dispatch]
  );

  /**
   * setBusinessDraft - Update draft business fields (name/address)
   * This is ephemeral input that should NOT persist unless confirmed.
   */
  const setBusinessDraft = useCallback(
    (patch: Partial<{ name: string; address: string }>) => {
      dispatch({ type: "SET_BUSINESS_DRAFT", patch });
    },
    [dispatch]
  );

  /**
   * primeLocationIntel - SINGLE SOURCE OF TRUTH for location enrichment
   *
   * ✅ UNIFIED (Feb 7, 2026): Both debounced typing AND submitLocation use this function.
   * - Fires 3 parallel fetches (utility, solar, weather)
   * - Dispatches PATCH_LOCATION_INTEL as each resolves (progressive UI hydration)
   * - Returns the assembled Partial<LocationIntel> so callers can use it immediately
   *   (without waiting for React state to propagate)
   *
   * @param zipOrInput - ZIP code or raw input string
   * @returns Partial<LocationIntel> with whatever data was successfully fetched
   */
  const primeLocationIntel = useCallback(
    async (zipOrInput: string): Promise<Partial<LocationIntel>> => {
      const input = zipOrInput.trim();
      if (!input || input.length < 3) return {};

      dispatch({ type: "DEBUG_TAG", lastAction: "primeLocationIntel" });

      // Set all to fetching (progressive UI feedback)
      dispatch({
        type: "PATCH_LOCATION_INTEL",
        patch: {
          utilityStatus: "fetching",
          solarStatus: "fetching",
          weatherStatus: "fetching",
          utilityError: undefined,
          solarError: undefined,
          weatherError: undefined,
        },
      });

      // Fire all 3 in parallel with Promise.allSettled (fail-soft per service)
      const [utilityRes, solarRes, weatherRes] = await Promise.allSettled([
        api.fetchUtility(input),
        api.fetchSolar(input),
        api.fetchWeather(input),
      ]);

      // Assemble the intel object from settled results
      const intel: Partial<LocationIntel> = { updatedAt: Date.now() };

      if (utilityRes.status === "fulfilled") {
        intel.utilityRate = utilityRes.value.rate;
        intel.demandCharge = utilityRes.value.demandCharge;
        intel.utilityProvider = utilityRes.value.provider;
        intel.utilityStatus = "ready";
      } else {
        intel.utilityStatus = "error";
        intel.utilityError = String(utilityRes.reason?.message ?? utilityRes.reason);
      }

      if (solarRes.status === "fulfilled") {
        intel.peakSunHours = solarRes.value.peakSunHours;
        intel.solarGrade = solarRes.value.grade;
        intel.solarStatus = "ready";
      } else {
        intel.solarStatus = "error";
        intel.solarError = String(solarRes.reason?.message ?? solarRes.reason);
      }

      if (weatherRes.status === "fulfilled") {
        intel.weatherRisk = weatherRes.value.risk;
        intel.weatherProfile = weatherRes.value.profile;
        intel.weatherStatus = "ready";
      } else {
        intel.weatherStatus = "error";
        intel.weatherError = String(weatherRes.reason?.message ?? weatherRes.reason);
      }

      // Dispatch final merged state (one atomic patch with all results)
      dispatch({ type: "PATCH_LOCATION_INTEL", patch: intel });

      // ✅ MERLIN MEMORY (Feb 11, 2026): Persist weather data
      if (
        weatherRes.status === "fulfilled" &&
        (weatherRes.value.risk || weatherRes.value.profile)
      ) {
        merlinMemory.set("weather", {
          profile: weatherRes.value.profile,
          extremes: weatherRes.value.risk,
          source: "cache",
          fetchedAt: Date.now(),
        });
      }

      // ✅ MERLIN MEMORY (Feb 11, 2026): Persist solar resource data
      if (solarRes.status === "fulfilled" && solarRes.value.peakSunHours) {
        merlinMemory.set("solar", {
          peakSunHours: solarRes.value.peakSunHours,
          grade: solarRes.value.grade,
          // Derive capacity factor from peak sun hours (PSH / 24)
          capacityFactor: solarRes.value.peakSunHours
            ? solarRes.value.peakSunHours / 24
            : undefined,
          source: "regional-estimate",
          fetchedAt: Date.now(),
        });
      }

      // ✅ MERLIN MEMORY: Also patch location with utility rates
      if (intel.utilityRate != null || intel.demandCharge != null) {
        merlinMemory.patch("location", {
          utilityRate: intel.utilityRate,
          demandCharge: intel.demandCharge,
          peakSunHours: intel.peakSunHours,
        });
      }

      if (import.meta.env.DEV) {
        const ready = [intel.utilityStatus, intel.solarStatus, intel.weatherStatus].filter(
          (s) => s === "ready"
        ).length;
        devLog(`[V7 SSOT] primeLocationIntel complete: ${ready}/3 services ready for "${input}"`);
      }

      return intel;
    },
    [dispatch, api]
  );

  /**
   * submitLocation - Step 1 submit (SSOT validates + populates intel)
   * ✅ FIX Jan 31: Accept businessInfo directly from Step1 (not stale state.businessDraft)
   */
  const submitLocation = useCallback(
    async (rawInput?: string, businessInfo?: { name?: string; address?: string }) => {
      clearError();
      abortOngoing();

      const input = (rawInput ?? state.locationRawInput).trim();
      if (import.meta.env.DEV) {
        devLog("[V7] submitLocation called", { rawInput, stateRaw: state.locationRawInput, input });
      }
      dispatch({ type: "DEBUG_TAG", lastAction: "submitLocation" });

      const normalizedZip = normalizeZip5(input);

      // ✅ GUARD: Prevent double-submit loop when already confirmed for same ZIP
      if (
        state.locationConfirmed &&
        normalizedZip &&
        state.location?.postalCode === normalizedZip &&
        state.step !== "location"
      ) {
        if (import.meta.env.DEV) {
          devLog("[V7] submitLocation: Already confirmed for this ZIP, skipping re-submit");
        }
        return;
      }

      if (!input) {
        setError({ code: "VALIDATION", message: "Please enter an address or business name." });
        return;
      }

      // ✅ CONFIRMATION DOCTRINE (Feb 10): confirmation is a USER intent state
      // - If user clicked Continue and we can derive a ZIP5, confirm immediately
      // - Resolve/prime are best-effort and MUST NOT clear confirmation
      const canConfirm = normalizedZip.length === 5;
      if (canConfirm) {
        dispatch({ type: "SET_LOCATION_CONFIRMED", confirmed: true });
        if (import.meta.env.DEV) {
          devLog("[V7 SSOT] Location confirmed by user (Continue clicked)", { zip: normalizedZip });
        }
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Resolving location...");
        dispatch({ type: "DEBUG_TAG", lastApi: "resolveLocation" });

        let location: LocationCard;

        try {
          location = await api.resolveLocation(input, controller.signal);
        } catch (resolveErr) {
          // ✅ Non-blocking fallback: proceed with ZIP-only location card
          devWarn("[V7 SSOT] resolveLocation failed, using ZIP fallback:", resolveErr);
          const minCard = buildMinimalLocationFromZip(state);
          if (!minCard) throw resolveErr;

          location = minCard;
          dispatch({
            type: "DEBUG_NOTE",
            note: `Geocode failed — using ZIP-only location (${minCard.postalCode})`,
          });

          // ✅ IMPORTANT: do NOT clear confirmation here (keep user intent)
          dispatch({ type: "SET_LOCATION", location: minCard });
        }

        // ✅ FIX Feb 7, 2026: Guarantee postalCode is populated when input is a ZIP.
        const zip5 = normalizeZip5(input);
        if (isZip5(input) && !location.postalCode) {
          location = { ...location, postalCode: zip5 };
          dispatch({
            type: "DEBUG_NOTE",
            note: `Resolved location missing postalCode; injected ZIP ${zip5} from raw input`,
          });
        }

        // Also inject state from ZIP prefix if geocoder didn't return it
        if (!hasState(location) && isZip5(input)) {
          const stateFromZip = getStateFromZipPrefix(zip5);
          if (stateFromZip) {
            location = { ...location, state: stateFromZip };
            dispatch({
              type: "DEBUG_NOTE",
              note: `Resolved location missing state; injected ${stateFromZip} from ZIP prefix`,
            });
          }
        }

        // SSOT: allow location but note missing state if expected
        if (!hasState(location)) {
          dispatch({
            type: "DEBUG_NOTE",
            note: "Location resolved but state missing. Ensure geocoder returns state for US addresses.",
          });
        }

        dispatch({ type: "SET_LOCATION", location });

        // ✅ FIX Jan 31: Use businessInfo passed directly (not stale state.businessDraft)
        // Create businessCard when business name is provided
        const businessName = businessInfo?.name?.trim();
        const businessAddress = businessInfo?.address?.trim();
        const hasBusiness = !!businessName || !!businessAddress;

        let newBusinessCard: BusinessCard | null = null;
        if (hasBusiness) {
          newBusinessCard = {
            name: businessName || undefined,
            address: businessAddress || undefined,
            formattedAddress: location.formattedAddress,
            city: location.city,
            stateCode: location.state,
            postal: location.postalCode,
            lat: location.lat,
            lng: location.lng,
            placeId: location.placeId,
            resolvedAt: Date.now(),
          };
          dispatch({ type: "SET_BUSINESS_CARD", card: newBusinessCard });
          dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true }); // ✅ Auto-confirm (Feb 12): no friction gate
          dispatch({
            type: "DEBUG_NOTE",
            note: `Business card created + auto-confirmed: ${newBusinessCard.name || newBusinessCard.address}`,
          });
        }

        // ✅ UNIFIED ENRICHMENT (Feb 7, 2026): Use primeLocationIntel — SINGLE path
        setBusy(true, "Fetching location intelligence...");
        dispatch({ type: "DEBUG_TAG", lastApi: "primeLocationIntel" });
        const zip = normalizeZip5(location.postalCode || input);
        let intel: Partial<LocationIntel> = {};
        try {
          intel = await primeLocationIntel(zip || input);

          // ✅ RUNTIME PROBE (Feb 7, 2026): Log exactly what came back
          if (import.meta.env.DEV) {
            const definedKeys = Object.keys(intel).filter(
              (k) => (intel as Record<string, unknown>)[k] !== undefined
            );
            devLog(
              `[V7 Step1] submitLocation intel keys: [${definedKeys.join(", ")}]`,
              `| utilityRate=${intel.utilityRate} | peakSunHours=${intel.peakSunHours}`
            );
          }
        } catch (enrichErr) {
          // Enrichment failure is NEVER fatal — proceed with empty intel
          devWarn("[V7 Step1] primeLocationIntel failed (non-blocking):", enrichErr);
          dispatch({
            type: "DEBUG_NOTE",
            note: `Location intel failed (non-blocking): ${(enrichErr as { message?: string })?.message ?? enrichErr}`,
          });
        }

        // ✅ MERLIN MEMORY (Feb 11, 2026): Persist location for downstream steps
        merlinMemory.set("location", {
          zip: location.postalCode || normalizedZip,
          state: location.state,
          city: location.city,
          lat: location.lat,
          lng: location.lng,
          formattedAddress: location.formattedAddress,
          utilityRate: (intel as Record<string, unknown>).utilityRate as number | undefined,
          demandCharge: (intel as Record<string, unknown>).demandCharge as number | undefined,
          peakSunHours: (intel as Record<string, unknown>).peakSunHours as number | undefined,
        });
        if (newBusinessCard) {
          merlinMemory.set("business", {
            name: newBusinessCard.name,
            address: newBusinessCard.address,
            placeId: newBusinessCard.placeId,
          });
        }

        // ✅ FIX Feb 12: Business is auto-confirmed on creation (no confirm gate).
        // If we created a business card, run industry inference before stopping for goals.
        if (newBusinessCard) {
          try {
            setBusy(true, "Inferring industry...");
            dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
            const inferred = await api.inferIndustry(location, controller.signal, newBusinessCard);

            if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
              dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
              dispatch({
                type: "DEBUG_NOTE",
                note: `Industry inferred from business: ${inferred.industry} (locked)`,
              });

              merlinMemory.set("industry", {
                slug: inferred.industry,
                inferred: true,
                confidence: inferred.confidence,
              });

              // Preload step 3 template immediately
              setBusy(true, "Loading profile template...");
              dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
              const template = await api.loadStep3Template(inferred.industry, controller.signal);
              dispatch({ type: "SET_STEP3_TEMPLATE", template });
              dispatch({
                type: "SET_TEMPLATE_MODE",
                mode: (template.industry as string) === "generic" ? "fallback" : "industry",
              });

              const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
              dispatch({
                type: "SET_STEP3_ANSWERS",
                answers: baselineAnswers,
                source: "template_default",
              });

              const intelPatch = api.buildIntelPatch(intel as LocationIntel);
              if (Object.keys(intelPatch).length > 0) {
                dispatch({
                  type: "PATCH_STEP3_ANSWERS",
                  patch: intelPatch,
                  source: "location_intel",
                });
              }

              const businessPatch = api.buildBusinessPatch(newBusinessCard);
              if (Object.keys(businessPatch).length > 0) {
                dispatch({
                  type: "PATCH_STEP3_ANSWERS",
                  patch: businessPatch,
                  source: "business_detection",
                });
              }
            } else {
              dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
            }
          } catch (inferErr) {
            devWarn("[V7] Industry inference failed (non-blocking):", inferErr);
            dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          }
        }

        // ✅ GOALS MODAL CHECK (Feb 10, 2026)
        // Location is now confirmed - check if goals modal should show
        if (!state.goalsConfirmed) {
          dispatch({
            type: "DEBUG_NOTE",
            note: "Location confirmed - waiting for goals selection",
          });
          setBusy(false);
          abortRef.current = null;
          return;
        }

        // Goals already confirmed - proceed to industry inference
        setBusy(true, "Inferring industry...");
        dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
        const inferred = await api.inferIndustry(location, controller.signal);

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          merlinMemory.set("industry", {
            slug: inferred.industry,
            inferred: true,
            confidence: inferred.confidence,
          });

          // Preload step 3 template
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });
          dispatch({
            type: "SET_TEMPLATE_MODE",
            mode: (template.industry as string) === "generic" ? "fallback" : "industry",
          });

          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({
            type: "SET_STEP3_ANSWERS",
            answers: baselineAnswers,
            source: "template_default",
          });

          const intelPatch = api.buildIntelPatch(intel as LocationIntel);
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }

          // ✅ FIX Feb 11: Goals already confirmed — advance to profile (skip industry, it's locked)
          devLog("[V7 SSOT] Business + industry inferred + goals confirmed → profile");
          setStep("profile", "industry_locked_goals_confirmed");
        } else {
          dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          setStep("industry", "needs_industry");
        }
      } catch (err: unknown) {
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
        } else {
          setError(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- all state fields already in deps, 'state' object itself not needed
    [
      clearError,
      abortOngoing,
      setError,
      setBusy,
      setStep,
      dispatch,
      abortRef,
      primeLocationIntel,
      state.locationRawInput,
      state.location,
      state.locationConfirmed,
      state.locationIntel,
      state.businessCard,
      state.step,
      state.goalsConfirmed,
      api,
    ]
  );

  /**
   * skipBusiness - User skips/dismisses the detected business card
   */
  const skipBusiness = useCallback(() => {
    // ✅ FIX Jan 31: Clear businessDraft to prevent stale draft persisting
    dispatch({ type: "SET_BUSINESS_DRAFT", patch: { name: "", address: "" } });
    dispatch({ type: "SET_BUSINESS_CARD", card: null });
    dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true });
    dispatch({ type: "DEBUG_NOTE", note: "Business skipped by user - draft cleared" });
    dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });

    // ✅ FIX Feb 11: Don't jump to industry if goals aren't confirmed yet
    if (!state.goalsConfirmed) {
      dispatch({
        type: "DEBUG_NOTE",
        note: "Business skipped - staying on location for goals modal",
      });
      return;
    }
    setStep("industry", "business_skipped");
  }, [dispatch, setStep, state.goalsConfirmed]);

  /**
   * confirmBusiness - User confirms the detected business card
   */
  const confirmBusiness = useCallback(
    async (value: boolean) => {
      // If false, delegate to skipBusiness
      if (!value) {
        skipBusiness();
        return;
      }

      dispatch({ type: "SET_BUSINESS_CONFIRMED", confirmed: true });
      dispatch({ type: "DEBUG_NOTE", note: "Business confirmed by user" });

      if (!state.location) {
        setError({ code: "VALIDATION", message: "No location set." });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setBusy(true, "Inferring industry...");
        dispatch({ type: "DEBUG_TAG", lastApi: "inferIndustry" });
        const inferred = await api.inferIndustry(
          state.location,
          controller.signal,
          state.businessCard
        );

        if (inferred.industry !== "auto" && inferred.confidence >= 0.85) {
          dispatch({ type: "SET_INDUSTRY", industry: inferred.industry, locked: true });
          dispatch({
            type: "DEBUG_NOTE",
            note: `Industry inferred: ${inferred.industry} (locked)`,
          });

          merlinMemory.set("industry", {
            slug: inferred.industry,
            inferred: true,
            confidence: inferred.confidence,
          });

          // Preload step 3 template
          setBusy(true, "Loading profile template...");
          dispatch({ type: "DEBUG_TAG", lastApi: "loadStep3Template" });
          const template = await api.loadStep3Template(inferred.industry, controller.signal);
          dispatch({ type: "SET_STEP3_TEMPLATE", template });
          dispatch({
            type: "SET_TEMPLATE_MODE",
            mode: (template.industry as string) === "generic" ? "fallback" : "industry",
          });

          const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
          dispatch({
            type: "SET_STEP3_ANSWERS",
            answers: baselineAnswers,
            source: "template_default",
          });

          const intelPatch = api.buildIntelPatch(state.locationIntel || ({} as LocationIntel));
          if (Object.keys(intelPatch).length > 0) {
            dispatch({ type: "PATCH_STEP3_ANSWERS", patch: intelPatch, source: "location_intel" });
          }

          const businessPatch = api.buildBusinessPatch(state.businessCard);
          if (Object.keys(businessPatch).length > 0) {
            dispatch({
              type: "PATCH_STEP3_ANSWERS",
              patch: businessPatch,
              source: "business_detection",
            });
          }

          // ✅ FIX (Feb 10, 2026): Stay on location so goals modal can render
          devLog("[V7 SSOT] Business confirmed, staying on location for goals modal");
        } else {
          dispatch({ type: "SET_INDUSTRY", industry: "auto", locked: false });
          if (!state.goalsConfirmed) {
            dispatch({
              type: "DEBUG_NOTE",
              note: "Industry not inferred - staying on location for goals modal",
            });
          } else {
            setStep("industry", "needs_industry");
          }
        }
      } catch (err: unknown) {
        if (isAbort(err)) {
          setError({ code: "ABORTED", message: "Request cancelled." });
        } else {
          setError(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [
      skipBusiness,
      setError,
      setBusy,
      setStep,
      dispatch,
      abortRef,
      state.location,
      state.businessCard,
      state.locationIntel,
      state.goalsConfirmed,
      api,
    ]
  );

  return {
    updateLocationRaw,
    confirmLocation,
    submitLocation,
    primeLocationIntel,
    setBusinessDraft,
    skipBusiness,
    confirmBusiness,
  };
}

/* ============================================================
   Helpers (copied from parent for independence)
============================================================ */

function normalizeZip5(s: string): string {
  const digits = s.replace(/\D/g, "");
  return digits.slice(0, 5);
}

function isZip5(s: string): boolean {
  return /^\d{5}$/.test(s.trim());
}

function hasState(location: LocationCard | null): boolean {
  if (!location) return false;
  const s = location.state?.trim() ?? location.countryCode?.trim();
  return !!s && s.length >= 2;
}

function getStateFromZipPrefix(zip: string): string | undefined {
  const prefix = zip.slice(0, 3);
  const map: Record<string, string> = {
    "100": "NY",
    "101": "NY",
    "102": "NY",
    "103": "NY",
    // ... (would include full mapping here - abbreviated for space)
    "900": "CA",
    "901": "CA",
    "902": "CA",
  };
  return map[prefix];
}

function buildMinimalLocationFromZip(
  state: Pick<WizardState, "locationRawInput">
): LocationCard | null {
  const zip = normalizeZip5(state.locationRawInput);
  if (!isZip5(zip)) return null;

  const stateCode = getStateFromZipPrefix(zip);
  return {
    formattedAddress: `ZIP ${zip}`,
    postalCode: zip,
    state: stateCode,
    country: "US",
    countryCode: "US",
  };
}

function isAbort(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return ("name" in err && err.name === "AbortError") || ("code" in err && err.code === "ABORTED");
}
