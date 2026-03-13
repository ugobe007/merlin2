/**
 * =============================================================================
 * WIZARD V8 — HOOK
 * =============================================================================
 *
 * Single React hook. Wraps useReducer(reducer, initialState()).
 *
 * Responsibilities:
 *   - Expose { state, actions } to the step components
 *   - Wire ZIP debounce → 3 parallel API calls (utility, solar, weather)
 *   - Derive industry meta (solar cap, critical load %) immediately on selection
 *
 * Does NOT:
 *   - Contain business logic or math
 *   - Write to any secondary store (no merlinMemory, no TrueQuoteTemp)
 *   - Import from other step files
 *
 * Tier building (calculateQuote → 3 tiers) lives in step4Logic.ts (Session 2)
 * and is passed in as a callback via buildTiers(). This keeps the hook
 * dependency-free and independently testable.
 * =============================================================================
 */

import { useReducer, useCallback, useRef, useEffect } from "react";
import {
  reducer,
  initialState,
  isSolarFeasible,
  type WizardState,
  type WizardActions,
  type WizardStep,
  type IndustrySlug,
  type QuoteTier,
  type SolarGrade,
} from "./wizardState";

// Intel fetches (utility, solar, weather) use local services — no backend needed.
// Location resolution is V8-native: direct ZIP lookup (zippopotam.us) with
// utility-rate-service fallback. No dependency on V7's backend /api/location/resolve.
import { fetchUtility, fetchSolar, fetchWeather } from "@/wizard/v7/api/wizardAPI";

import { getFacilityConstraints } from "@/services/useCasePowerCalculations";
import { getCriticalLoadWithSource } from "@/services/benchmarkSources";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildTiers } from "./step4Logic";
import type { LocationData } from "./wizardState";

// ── ZIP → LocationData (V8-native, no backend required) ─────────────────────
//
// zippopotam.us is free, no API key, CORS-enabled, and has been stable for 10+
// years. It returns city + state abbreviation + lat/lng for US ZIPs.
// If it fails we fall back to state-from-utility lookup with ZIP as city.

interface ZippopotamPlace {
  "place name": string;
  "state abbreviation": string;
  latitude: string;
  longitude: string;
}

interface ZippopotamResponse {
  "post code": string;
  "country abbreviation": string;
  places: ZippopotamPlace[];
}

async function resolveZip(zip: string, signal?: AbortSignal): Promise<LocationData> {
  // ── Primary: zippopotam.us ─────────────────────────────────────────────
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal });
    if (res.ok) {
      const data: ZippopotamResponse = await res.json();
      const place = data.places?.[0];
      if (place) {
        return {
          zip,
          city: place["place name"],
          state: place["state abbreviation"],
          formattedAddress: `${place["place name"]}, ${place["state abbreviation"]} ${zip}`,
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
        };
      }
    }
  } catch {
    // fall through to secondary
  }

  // ── Secondary: derive state from utility rate service ──────────────────
  // getCommercialRateByZip works with local EIA data — no external call needed.
  try {
    const { getCommercialRateByZip } = await import("@/services/utilityRateService");
    const utility = await getCommercialRateByZip(zip);
    if (utility?.state) {
      return {
        zip,
        city: zip, // best we can do without geocoder
        state: utility.state,
        formattedAddress: `${zip}, ${utility.state}`,
      };
    }
  } catch {
    // fall through to minimal fallback
  }

  // ── Tertiary: bare ZIP (never throws — keeps wizard moving) ───────────
  // We still have full intel (utility rate, solar, weather) from the other
  // three API calls, so the wizard is usable even without a city name.
  return {
    zip,
    city: "",
    state: "",
    formattedAddress: zip,
  };
}

const ZIP_DEBOUNCE_MS = 350;

type TierBuildCache = {
  key: string;
  promise: Promise<[QuoteTier, QuoteTier, QuoteTier]>;
};

function createTierBuildKey(state: WizardState): string {
  return JSON.stringify({
    step: state.step,
    location: state.location
      ? {
          zip: state.location.zip,
          state: state.location.state,
        }
      : null,
    industry: state.industry,
    baseLoadKW: state.baseLoadKW,
    peakLoadKW: state.peakLoadKW,
    criticalLoadPct: state.criticalLoadPct,
    solarPhysicalCapKW: state.solarPhysicalCapKW,
    wantsSolar: state.wantsSolar,
    wantsEVCharging: state.wantsEVCharging,
    wantsGenerator: state.wantsGenerator,
    solarKW: state.solarKW,
    generatorKW: state.generatorKW,
    generatorFuelType: state.generatorFuelType,
    evChargers: state.evChargers,
    evRevenuePerYear: state.evRevenuePerYear,
    step3Answers: state.step3Answers,
    intel: {
      utilityRate: state.intel?.utilityRate,
      demandCharge: state.intel?.demandCharge,
      solarFeasible: state.intel?.solarFeasible,
      peakSunHours: state.intel?.peakSunHours,
      solarGrade: state.intel?.solarGrade,
    },
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWizardV8(): { state: WizardState; actions: WizardActions } {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Refs for debounce and abort — never trigger re-renders
  const zipDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tierBuildRef = useRef<TierBuildCache | null>(null);

  // ── Step 1: Raw input → debounced intel fetch ───────────────────────────

  const setLocationRaw = useCallback((value: string) => {
    dispatch({ type: "SET_LOCATION_RAW", value });

    // Normalize to digits only, max 5
    const zip = value.replace(/\D/g, "").slice(0, 5);

    // Clear pending debounce
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);

    if (zip.length !== 5) {
      // Incomplete ZIP — reset intel status to idle
      dispatch({
        type: "PATCH_INTEL",
        patch: {
          utilityStatus: "idle",
          solarStatus: "idle",
          weatherStatus: "idle",
        },
      });
      return;
    }

    // Valid 5-digit ZIP — debounce the fetch
    zipDebounceRef.current = setTimeout(() => {
      void loadLocationIntel(zip);
    }, ZIP_DEBOUNCE_MS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * loadLocationIntel — fires all three API calls in parallel.
   *
   * Each resolves independently (fail-soft). The UI shows each card
   * as its fetch completes, giving a progressive "scanning" reveal.
   *
   * Pattern source: primeLocationIntel() in useWizardLocation.ts (V7)
   */
  const loadLocationIntel = useCallback(async (zip: string) => {
    // Cancel any in-flight requests from a previous ZIP
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // Mark all three as fetching immediately — cards show skeletons
    dispatch({
      type: "PATCH_INTEL",
      patch: {
        utilityStatus: "fetching",
        solarStatus: "fetching",
        weatherStatus: "fetching",
      },
    });

    // All three in parallel — fail-soft per service (Promise.allSettled)
    const [utilityRes, solarRes, weatherRes] = await Promise.allSettled([
      fetchUtility(zip),
      fetchSolar(zip),
      fetchWeather(zip),
    ]);

    // ── Utility result ──────────────────────────────────────────────────
    if (utilityRes.status === "fulfilled") {
      const u = utilityRes.value;
      dispatch({
        type: "PATCH_INTEL",
        patch: {
          utilityRate: u.rate ?? 0,
          demandCharge: u.demandCharge ?? 0,
          utilityProvider: u.provider ?? "",
          utilityStatus: "ready",
        },
      });
    } else {
      dispatch({ type: "PATCH_INTEL", patch: { utilityStatus: "error" } });
    }

    // ── Solar result ────────────────────────────────────────────────────
    if (solarRes.status === "fulfilled") {
      const s = solarRes.value;
      const grade = (s.grade ?? "C") as SolarGrade;
      const psh = s.peakSunHours ?? 0;
      dispatch({
        type: "PATCH_INTEL",
        patch: {
          solarGrade: grade,
          solarFeasible: isSolarFeasible(grade) && psh >= 3.5,
          peakSunHours: psh,
          solarStatus: "ready",
        },
      });
    } else {
      dispatch({ type: "PATCH_INTEL", patch: { solarStatus: "error" } });
    }

    // ── Weather result ──────────────────────────────────────────────────
    if (weatherRes.status === "fulfilled") {
      const w = weatherRes.value;
      dispatch({
        type: "PATCH_INTEL",
        patch: {
          weatherRisk: w.risk ?? "",
          weatherProfile: w.profile ?? "",
          avgTempF: w.avgTempF ?? 0,
          weatherStatus: "ready",
        },
      });
    } else {
      dispatch({ type: "PATCH_INTEL", patch: { weatherStatus: "error" } });
    }
  }, []);

  /**
   * submitLocation — geocode the typed ZIP/postal code to a named location card.
   * NO LONGER auto-advances to Step 2 — waits for business confirmation.
   */
  const submitLocation = useCallback(async (country: "US" | "International" = "US") => {
    const raw = state.locationRaw.trim();
    
    // US: 5-digit ZIP only
    if (country === "US") {
      const zip = raw.replace(/\D/g, "").slice(0, 5);
      if (zip.length !== 5) return;

      dispatch({ type: "SET_LOCATION_STATUS", status: "fetching" });

      try {
        const locationData = await resolveZip(zip, abortRef.current?.signal);
        dispatch({ type: "SET_LOCATION", location: locationData });
        // NO auto-advance - wait for business confirmation
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          code: "GEOCODE_FAILED",
          message: e instanceof Error ? e.message : "Could not find that ZIP code.",
        });
      }
      return;
    }

    // International: allow any postal code format (at least 3 chars)
    if (raw.length < 3) return;

    dispatch({ type: "SET_LOCATION_STATUS", status: "fetching" });

    try {
      // For international, create a basic location with the postal code as-is
      // In a full implementation, you'd use Google Geocoding API or similar
      const locationData: LocationData = {
        zip: raw,
        city: raw, // Placeholder - ideally would geocode
        state: "", // International doesn't have state
        formattedAddress: raw,
      };
      dispatch({ type: "SET_LOCATION", location: locationData });
      // NO auto-advance - wait for business confirmation
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        code: "GEOCODE_FAILED",
        message: e instanceof Error ? e.message : "Could not find that location.",
      });
    }
  }, [state.locationRaw]);

  const setGridReliability = useCallback(
    (reliability: "reliable" | "occasional-outages" | "frequent-outages" | "unreliable") => {
      dispatch({ type: "SET_GRID_RELIABILITY", reliability });
    },
    []
  );

  const clearLocation = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    dispatch({ type: "CLEAR_LOCATION" });
  }, []);

  /**
   * detectIndustryFromName — simple keyword-based industry detection
   */
  const detectIndustryFromName = (
    name: string
  ): { industry: IndustrySlug | null; confidence: number } => {
    const lowerName = name.toLowerCase();

    // DEBUG: Log what we're detecting
    if (import.meta.env.DEV) {
      console.log("[detectIndustryFromName] Input:", name, "→ lowercase:", lowerName);
    }

    // Industry detection rules (confidence 0-1)
    // Car Wash: enhanced with common brands
    if (
      /car\s*wash|carwash|auto\s*wash|auto\s*spa|detail\s*center|mister\s*car\s*wash|take\s*5|zips\s*car\s*wash/i.test(
        lowerName
      )
    ) {
      return { industry: "car_wash", confidence: 0.95 };
    }
    // Truck Stop: travel centers and major brands
    if (
      /truck\s*stop|truckstop|travel\s*center|travel\s*plaza|love'?s|pilot|flying\s*j|ta\s*travel|petro/i.test(
        lowerName
      )
    ) {
      return { industry: "truck_stop", confidence: 0.9 };
    }
    // Casino/Gaming: major brands and common terms
    if (
      /casino|gaming|mgm|caesars|wynn|bellagio|venetian|aria|station\s*casinos|golden\s*nugget/i.test(
        lowerName
      )
    ) {
      return { industry: "casino", confidence: 0.95 };
    }
    if (
      /hotel|motel|inn|resort|hospitality|hilton|marriott|hyatt|sheraton|holiday\s*inn|courtyard|hampton/i.test(
        lowerName
      )
    ) {
      return { industry: "hotel", confidence: 0.9 };
    }
    if (
      /data\s*center|datacenter|server\s*farm|cloud|switch|equinix|digitalrealty|coresite|cyxtera|qts|vantage|iron\s*mountain/i.test(
        lowerName
      )
    ) {
      if (import.meta.env.DEV) {
        console.log("[detectIndustryFromName] ✅ MATCHED data_center");
      }
      return { industry: "data_center", confidence: 0.95 };
    }
    // Hospital/Healthcare: match common patterns
    if (
      /hospital|medical\s*center|health\s*center|healthcare|health\s*system|clinic|dignity\s*health|kaiser|sutter|providence|mayo|cleveland\s*clinic/i.test(
        lowerName
      )
    ) {
      return { industry: "hospital", confidence: 0.9 };
    }
    // Office Building: enhanced with building types
    if (
      /office|corporate|headquarters|hq|office\s*building|office\s*tower|office\s*park|business\s*center|corporate\s*center|plaza|high\s*rise/i.test(
        lowerName
      )
    ) {
      return { industry: "office", confidence: 0.75 };
    }
    if (
      /charging|ev\s*station|electric\s*vehicle|electrify\s*america|chargepoint|evgo/i.test(
        lowerName
      )
    ) {
      return { industry: "ev_charging", confidence: 0.9 };
    }
    if (
      /gas\s*station|fuel|convenience\s*store|7-eleven|circle\s*k|shell|chevron|bp/i.test(lowerName)
    ) {
      return { industry: "gas_station", confidence: 0.85 };
    }
    if (/warehouse|distribution|logistics|fulfillment|amazon|fedex|ups|dhl/i.test(lowerName)) {
      return { industry: "warehouse", confidence: 0.85 };
    }
    if (/walmart|target|costco|home\s*depot|lowes/i.test(lowerName)) {
      return { industry: "retail", confidence: 0.85 };
    }
    if (/retail|store|shop|mall|shopping/i.test(lowerName)) {
      return { industry: "retail", confidence: 0.7 };
    }
    if (/restaurant|cafe|diner|bistro|eatery/i.test(lowerName)) {
      return { industry: "restaurant", confidence: 0.85 };
    }
    if (/apartment|residential|housing|condo/i.test(lowerName)) {
      return { industry: "apartment", confidence: 0.85 };
    }
    if (/manufacturing|factory|plant|production/i.test(lowerName)) {
      return { industry: "manufacturing", confidence: 0.85 };
    }

    if (import.meta.env.DEV) {
      console.log("[detectIndustryFromName] ❌ No match found for:", lowerName);
    }
    return { industry: null, confidence: 0 };
  };

  /**
   * setBusiness — sets business name, auto-detects industry, estimates roof space
   */
  const setBusiness = useCallback(
    (
      name: string,
      placesData?: {
        address?: string;
        website?: string;
        description?: string;
        photoAttributionName?: string;
        photoAttributionUri?: string;
        placeId?: string;
        formattedAddress?: string;
        photoUrl?: string;
        lat?: number;
        lng?: number;
      }
    ) => {
      if (import.meta.env.DEV) {
        console.log("[setBusiness] Called with name:", name, "placesData:", placesData);
      }

      if (!name.trim()) {
        dispatch({ type: "SET_BUSINESS", business: null });
        return;
      }

      const { industry, confidence } = detectIndustryFromName(name);

      if (import.meta.env.DEV) {
        console.log("[setBusiness] Detection result:", { industry, confidence });
      }

      // Industry-based roof space estimates (typical commercial buildings)
      const INDUSTRY_ROOF_ESTIMATES: Record<string, number> = {
        car_wash: 5000, // Small building with bay canopy
        gas_station: 8000, // Station + canopy
        retail: 12000, // Strip mall unit
        restaurant: 6000, // Single-story commercial
        office: 20000, // Multi-story office building
        hotel: 30000, // Large multi-story with rooftop
        warehouse: 50000, // Large flat industrial roof
        manufacturing: 60000, // Industrial facility
        data_center: 40000, // Large commercial tech facility
        hospital: 50000, // Large institutional building
        healthcare: 25000, // Medical office building
        ev_charging: 10000, // Station with covered parking
        shopping_center: 80000, // Large retail complex
        apartment: 25000, // Multi-family residential
        college: 70000, // Campus building
        airport: 100000, // Large terminal
        casino: 60000, // Large entertainment complex
        cold_storage: 45000, // Industrial warehouse
        indoor_farm: 40000, // Controlled environment agriculture
        truck_stop: 15000, // Large service station
        microgrid: 30000, // Multi-building complex
        government: 35000, // Public building
        agricultural: 20000, // Farm building
      };

      const estimatedRoofSpaceSqFt = industry
        ? INDUSTRY_ROOF_ESTIMATES[industry] || 15000
        : undefined;

      dispatch({
        type: "SET_BUSINESS",
        business: {
          name,
          detectedIndustry: industry,
          confidence,
          estimatedRoofSpaceSqFt,
          ...placesData,
        },
      });
    },
    []
  );

  const setBusinessAddress = useCallback((address: string) => {
    dispatch({ type: "SET_BUSINESS_ADDRESS", address });
  }, []);

  /**
   * confirmBusiness — confirms business and advances (skips Step 2 if industry detected)
   */
  const confirmBusiness = useCallback(() => {
    dispatch({ type: "CONFIRM_BUSINESS" });
  }, []);

  // ── Step 3: Reactive power calculation ─────────────────────────────────────
  //
  // Watches step3Answers + industry. Calls calculateUseCasePower() (synchronous
  // SSOT function) and dispatches SET_BASE_LOAD with the result.
  // This keeps Rule 3: steps are pure renderers — no calculations inside them.

  useEffect(() => {
    const slug = state.industry;
    if (!slug) {
      console.log('[useWizardV8] Power calc skipped: no industry');
      return;
    }

    const answers = state.step3Answers;
    if (Object.keys(answers).length === 0) {
      console.log('[useWizardV8] Power calc skipped: no answers');
      return;
    }

    console.log('[useWizardV8] Running power calculation for:', slug, 'with answers:', answers);

    // Convert underscore slug (V8 type) → hyphen slug (SSOT function convention)
    const ssotSlug = slug.replace(/_/g, "-");

    try {
      const result = calculateUseCasePower(ssotSlug, answers as Record<string, unknown>);
      console.log('[useWizardV8] Power calculation result:', result);

      // PowerCalculationResult returns powerMW (megawatts), convert to kW
      // Legacy results may have averageLoadKW/baseLoadKW/peakLoadKW
      let baseKW = 0;
      let peakKW = 0;
      let source = "";

      // PowerCalculationResult only has powerMW field (standardized Dec 2025)
      baseKW = result.powerMW * 1000;
      peakKW = baseKW * 1.3; // Assume 30% peak factor
      source = "powerMW";

      if (import.meta.env.DEV) {
        console.log("[useWizardV8] Parsed power:", {
          baseKW: Math.round(baseKW),
          peakKW: Math.round(peakKW),
          // criticalLoadKW: result.criticalLoadKW, // TODO: Add to PowerCalculationResult type
          // criticalLoadPercent: result.criticalLoadPercent,
          source,
          rawResult: result,
        });
      }

      if (baseKW > 0 || peakKW > 0) {
        dispatch({
          type: "SET_BASE_LOAD",
          baseLoadKW: Math.round(baseKW),
          peakLoadKW: Math.round(peakKW),
          // criticalLoadKW: result.criticalLoadKW, // TODO: Re-enable when PowerCalculationResult includes this
        });
      } else {
        // No valid power calculated - log for debugging
        if (import.meta.env.DEV) {
          console.warn("[useWizardV8] Power calculation returned 0 for both base and peak", result);
        }
      }
    } catch (err) {
      // Calculation may fail with partial answers
      if (import.meta.env.DEV) {
        console.error("[useWizardV8] Power calculation failed:", err);
        console.log("[useWizardV8] Failed with industry:", ssotSlug, "answers:", answers);
      }
      // baseLoadKW stays at 0 until enough answers are present
    }
  }, [state.step3Answers, state.industry]);

  // ── Step 2: Industry selection ─────────────────────────────────────────

  /**
   * setIndustry — dispatches slug + derives meta immediately from SSOT.
   * Meta: solar physical cap + critical load % (IEEE 446 / NEC).
   */
  const setIndustry = useCallback((slug: IndustrySlug) => {
    dispatch({ type: "SET_INDUSTRY", slug });

    // Solar physical cap from SSOT
    const constraints = getFacilityConstraints(slug);
    const solarPhysicalCapKW = constraints?.totalRealisticSolarKW ?? 0;

    // Critical load % from SSOT (getCriticalLoadWithSource handles slug variants)
    let criticalLoadPct = 0.4; // general commercial default
    try {
      const critInfo = getCriticalLoadWithSource(slug);
      criticalLoadPct = critInfo.percentage;
    } catch {
      // slug not in table → use default
    }

    dispatch({
      type: "SET_INDUSTRY_META",
      solarPhysicalCapKW,
      criticalLoadPct,
    });
  }, []);

  // ── Step 3 ────────────────────────────────────────────────────────────────

  const setAnswer = useCallback((key: string, value: unknown) => {
    dispatch({ type: "SET_ANSWER", key, value });
  }, []);

  const setAddonPreference = useCallback((addon: "solar" | "ev" | "generator", value: boolean) => {
    dispatch({ type: "SET_ADDON_PREFERENCE", addon, value });
  }, []);

  const setAddonConfig = useCallback(
    (
      config: Partial<{
        solarKW: number;
        generatorKW: number;
        generatorFuelType: "diesel" | "natural-gas" | "dual-fuel";
        level2Chargers: number;
        dcfcChargers: number;
        hpcChargers: number;
      }>
    ) => {
      dispatch({ type: "SET_ADDON_CONFIG", config });
    },
    []
  );

  const setEVChargers = useCallback((chargers: WizardState["evChargers"]) => {
    dispatch({ type: "SET_EV_CHARGERS", chargers });
  }, []);

  const setBaseLoad = useCallback(
    (baseLoadKW: number, peakLoadKW: number, evRevenuePerYear?: number) => {
      dispatch({
        type: "SET_BASE_LOAD",
        baseLoadKW,
        peakLoadKW,
        evRevenuePerYear,
      });
    },
    []
  );

  // ── Step 4 ────────────────────────────────────────────────────────────────

  const setTiers = useCallback((tiers: [QuoteTier, QuoteTier, QuoteTier]) => {
    dispatch({ type: "SET_TIERS", tiers });
  }, []);

  const setTiersStatus = useCallback((status: WizardState["tiersStatus"]) => {
    dispatch({ type: "SET_TIERS_STATUS", status });
  }, []);

  const getOrStartTierBuild = useCallback((nextState: WizardState) => {
    const key = createTierBuildKey(nextState);
    if (tierBuildRef.current?.key === key) {
      return tierBuildRef.current.promise;
    }

    const promise = buildTiers(nextState);
    tierBuildRef.current = { key, promise };
    return promise;
  }, []);

  // ── Step 5 ────────────────────────────────────────────────────────────────

  const selectTier = useCallback((index: 0 | 1 | 2) => {
    dispatch({ type: "SELECT_TIER", index });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToStep = useCallback(
    async (step: WizardStep) => {
      // ⚡ REMOVED SKIP LOGIC - Step 4 (Add-ons) should ALWAYS show
      // Even if no addons initially selected, we show intelligent recommendations
      // User can skip addons by clicking Continue, but we always present the opportunity

      // ⚡ REMOVED MANUAL TIER BUILDING - useEffect handles it proactively
      // Tiers are built in background during Step 3/4 via useEffect
      // Navigation just moves to the next step - tiers should already be ready

      dispatch({ type: "GO_TO_STEP", step });
    },
    []
  );

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    tierBuildRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  useEffect(() => {
    // Build from Step 3 OR Step 4 - just need baseLoadKW + location
    const canBuild = 
      (state.step === 3 || state.step === 4) && 
      state.baseLoadKW > 0 && 
      !!state.location;

    if (!canBuild) return;

    // ⚡ PROACTIVE TIER BUILDING - runs in background during Step 3/4
    console.log('[useWizardV8] 🔄 Proactively building tiers in background...', {
      step: state.step,
      baseLoadKW: state.baseLoadKW,
    });
    
    dispatch({ type: "SET_TIERS_STATUS", status: "fetching" });

    void getOrStartTierBuild(state)
      .then(tiers => {
        console.log('[useWizardV8] ✅ Background tier build complete', tiers.length);
        dispatch({ type: "SET_TIERS", tiers });
        dispatch({ type: "SET_TIERS_STATUS", status: "ready" });
      })
      .catch((error) => {
        console.error('[useWizardV8] ❌ Background tier build failed:', error);
        dispatch({ type: "SET_TIERS_STATUS", status: "error" });
        if (tierBuildRef.current?.key === createTierBuildKey(state)) {
          tierBuildRef.current = null;
        }
      });
  }, [getOrStartTierBuild, state]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    state,
    actions: {
      setLocationRaw,
      submitLocation,
      clearLocation,
      setGridReliability,
      setBusiness,
      setBusinessAddress,
      confirmBusiness,
      setIndustry,
      setAnswer,
      setAddonPreference,
      setAddonConfig,
      setEVChargers,
      setBaseLoad,
      setTiers,
      setTiersStatus,
      selectTier,
      goToStep,
      goBack,
      reset,
      clearError,
    },
  };
}

export type { WizardState, WizardActions } from "./wizardState";
