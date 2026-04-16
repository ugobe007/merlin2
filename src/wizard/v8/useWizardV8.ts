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

import { useReducer, useCallback, useRef, useEffect, useMemo } from "react";
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

// Dev-only logging helpers — compiled away in production bundles

const devLog = import.meta.env.DEV ? (...a: unknown[]) => console.log(...a) : () => undefined;
const devWarn = import.meta.env.DEV ? (...a: unknown[]) => console.warn(...a) : () => undefined;

// Intel fetches (utility, solar, weather) use local services — no backend needed.
// Location resolution is V8-native: direct ZIP lookup (zippopotam.us) with
// utility-rate-service fallback. No dependency on V7's backend /api/location/resolve.
import { fetchUtility, fetchSolar, fetchWeather } from "@/wizard/v7/api/wizardAPI";
import { fetchGoogleSolarByZip } from "@/services/solarSizingIntegrationService";

import {
  getFacilityConstraints,
  getCarWashSolarCapacity,
  computeSolarWattsPerSqft,
  computeCanopyWattsPerSqft,
} from "@/services/useCasePowerCalculations";
import { getLastSelectedPanelSync } from "@/services/solarPanelSelectionService";
import { getCriticalLoadWithSource } from "@/services/benchmarkSources";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildTiers } from "./step4Logic";
import type { LocationData } from "./wizardState";

// Country list for matching user input to country names
const INTERNATIONAL_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Qatar" },
  { code: "ZA", name: "South Africa" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
];

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
  // Combine caller's signal with a 8s timeout so browsers with strict privacy
  // settings (ad blockers, Safari ITP, Firefox ETP) don't leave the button
  // permanently stuck on "Checking…".
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 8000);
  const combinedSignal = signal
    ? AbortSignal.any
      ? AbortSignal.any([signal, timeoutController.signal])
      : timeoutController.signal
    : timeoutController.signal;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: combinedSignal });
    clearTimeout(timeoutId);
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
    clearTimeout(timeoutId);
    // fall through to secondary (timeout, CORS block, network error, etc.)
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
    // ⚡ CRITICAL: Include individual EV charger counts (not just evChargers object)
    // These are set by Step 4 addon config and must trigger tier rebuild
    level2Chargers: state.level2Chargers,
    dcfcChargers: state.dcfcChargers,
    hpcChargers: state.hpcChargers,
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
    // For international locations, pass country code from state.location.state field
    const countryCode = state.location?.state?.length === 2 ? state.location.state : undefined;
    const [utilityRes, solarRes, weatherRes, googleSolarRes] = await Promise.allSettled([
      fetchUtility(zip, countryCode),
      fetchSolar(zip),
      fetchWeather(zip),
      // Google Solar: actual rooftop area + precise sun hours for this address.
      // Uses existing VITE_GOOGLE_MAPS_API_KEY (Solar API must be enabled in GCP).
      // Fail-soft: returns null if API not enabled or location has no coverage.
      fetchGoogleSolarByZip(zip),
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
          hasTOU: u.hasTOU ?? false,
          peakRate: u.peakRate,
          rateName: u.rateName,
          rateSchedule: u.rateSchedule,
          demandChargeSource: u.demandChargeSource,
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

    // ── Google Solar result ─────────────────────────────────────────────
    // Provides actual rooftop area and location-specific sun hours.
    // Updates solarPhysicalCapKW if industry already selected and user
    // has not yet manually entered a roof area in Step 3.
    if (googleSolarRes.status === "fulfilled" && googleSolarRes.value) {
      const gs = googleSolarRes.value;
      // roofAreaUsedSqFt is the Google Solar usable panel area (already at 80% of max)
      const roofSqFt = gs.roofAreaUsedSqFt ?? 0;
      // specificYieldKwh_per_kWp ÷ 365 ≈ daily peak sun hours
      const gsPSH = gs.specificYieldKwh_per_kWp ? gs.specificYieldKwh_per_kWp / 365 : undefined;

      dispatch({
        type: "PATCH_INTEL",
        patch: {
          googleSolarRoofSqFt: roofSqFt > 0 ? roofSqFt : undefined,
          googleSolarPeakSunHours: gsPSH,
          // Override NREL peak sun hours with Google's location-specific model when available
          // Guard: only accept physically plausible values (1–9 h/day) to prevent bad API data (e.g. 0.01) overriding NREL
          ...(gsPSH && gsPSH >= 1.0 && gsPSH <= 9.0 ? { peakSunHours: gsPSH } : {}),
          googleSolarStatus: "ready",
        },
      });

      // If industry is already set and user hasn't entered roof area yet,
      // immediately update solarPhysicalCapKW with Google Solar's real rooftop data.
      // This is Vineet's "typical rooftop size" requirement.
      if (roofSqFt > 0 && state.industry) {
        const constraints = getFacilityConstraints(state.industry);
        const usableRoofPercent = constraints?.usableRoofPercent ?? 0.4;
        const _cachedPanel = getLastSelectedPanelSync();
        const solarWPerSqft = computeSolarWattsPerSqft(_cachedPanel);
        const userRoofArea = Number(state.step3Answers?.roofArea ?? 0);
        // Only apply if user hasn't entered their own roof area
        if (userRoofArea <= 0) {
          const googleCapKW = Math.round((roofSqFt * usableRoofPercent * solarWPerSqft) / 1000);
          if (googleCapKW > 0 && googleCapKW !== state.solarPhysicalCapKW) {
            dispatch({
              type: "SET_INDUSTRY_META",
              solarPhysicalCapKW: googleCapKW,
              criticalLoadPct: state.criticalLoadPct ?? 0.4,
            });
          }
        }
      }
    } else {
      dispatch({
        type: "PATCH_INTEL",
        patch: { googleSolarStatus: "unavailable" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Schedule-refinement effect — fires when the user enters peakLoadKW in Step 3.
   *
   * On first intel load (ZIP entry) we don't yet know peak kW, so the demand charge
   * defaults to utility-avg or state-avg. Once Step 3 is complete and peakLoadKW > 0,
   * we re-call fetchUtility with that value to resolve the correct tariff tier
   * (e.g. APS GS-65 vs SGS based on whether the site is over 30 kW).
   *
   * After the synchronous schedule resolution settles, we also fire fetchNRELURDB
   * in the background (no await on critical path) as the Tier 3 enrichment — if
   * it returns a more specific demand charge we patch intel a second time.
   */
  useEffect(() => {
    const zip = state.location?.zip;
    const peakKW = state.peakLoadKW;
    if (!zip || zip.length !== 5 || !peakKW || peakKW <= 0) return;
    if (state.intelStatus?.utility !== "ready") return;

    // Re-run schedule lookup with actual peak kW now that we know it
    void (async () => {
      try {
        const refined = await fetchUtility(zip, undefined, peakKW);
        if (refined) {
          dispatch({
            type: "PATCH_INTEL",
            patch: {
              demandCharge: refined.demandCharge ?? state.intel?.demandCharge ?? 0,
              rateName: refined.rateName,
              rateSchedule: refined.rateSchedule,
              demandChargeSource: refined.demandChargeSource,
            },
          });
        }
      } catch {
        // fail-soft: keep existing demand charge
      }

      // Tier 3: NREL URDB background enrichment — fires after schedule resolution
      // Non-blocking: if URDB has a better (live-tariff) value, patch once more.
      try {
        const { fetchNRELURDB } = await import("@/services/utilityRateService");
        const urdb = await fetchNRELURDB(zip);
        if (urdb) {
          dispatch({
            type: "PATCH_INTEL",
            patch: {
              demandCharge: urdb.demandCharge,
              rateName: urdb.rateName,
              rateSchedule: urdb.rateSchedule,
              demandChargeSource: "schedule",
            },
          });
        }
      } catch {
        // URDB failure is always silent — local schedule data already set above
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.peakLoadKW, state.location?.zip]);

  /**
   * submitLocation — geocode the typed ZIP/postal code to a named location card.
   * NO LONGER auto-advances to Step 2 — waits for business confirmation.
   * @param countryCode - US ZIP or 2-letter country code (e.g., "CA", "GB", "NZ")
   */
  const submitLocation = useCallback(
    async (countryCode: string = "US") => {
      const raw = state.locationRaw.trim();

      // US: 5-digit ZIP only
      if (countryCode === "US") {
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

      // International: allow country name or postal code (minimum 2 chars)
      if (raw.length < 2) return;

      dispatch({ type: "SET_LOCATION_STATUS", status: "fetching" });

      try {
        // Check if input matches a country name from our list
        const matchedCountry = INTERNATIONAL_COUNTRIES.find(
          (c) =>
            c.name.toLowerCase() === raw.toLowerCase() ||
            c.name.toLowerCase().includes(raw.toLowerCase()) ||
            c.code.toLowerCase() === raw.toLowerCase()
        );

        // If matched, use the country code; otherwise use the provided code
        const finalCountryCode = matchedCountry ? matchedCountry.code : countryCode;
        const displayName = matchedCountry ? matchedCountry.name : raw;

        // For international, create a basic location with country info
        const locationData: LocationData = {
          zip: raw,
          city: displayName,
          state: finalCountryCode, // Store country code in state field for international
          formattedAddress: `${displayName}, ${finalCountryCode}`,
        };
        dispatch({ type: "SET_LOCATION", location: locationData });

        // Fetch utility rates with country code for international locations
        devLog(`[submitLocation] Fetching utility rates for ${finalCountryCode}`);
        try {
          const utilityData = await fetchUtility(raw, finalCountryCode);
          devLog(`[submitLocation] Utility data:`, utilityData);
          dispatch({
            type: "PATCH_INTEL",
            patch: {
              utilityRate: utilityData.rate ?? 0,
              demandCharge: utilityData.demandCharge ?? 0,
              utilityProvider: utilityData.provider ?? "",
              hasTOU: utilityData.hasTOU ?? false,
              peakRate: utilityData.peakRate,
              rateName: utilityData.rateName,
              rateSchedule: utilityData.rateSchedule,
              demandChargeSource: utilityData.demandChargeSource,
              utilityStatus: "ready",
            },
          });
        } catch (utilityError) {
          devWarn(
            `[submitLocation] Failed to fetch utility for ${finalCountryCode}:`,
            utilityError
          );
          dispatch({ type: "PATCH_INTEL", patch: { utilityStatus: "error" } });
        }

        // NO auto-advance - wait for business confirmation
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          code: "GEOCODE_FAILED",
          message: e instanceof Error ? e.message : "Could not find that location.",
        });
      }
    },
    [state.locationRaw]
  );

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
    // Hospital/Healthcare: match common patterns including dental, PT, and eye care
    if (
      /hospital|medical\s*center|health\s*center|healthcare|health\s*system|clinic|dignity\s*health|kaiser|sutter|providence|mayo|cleveland\s*clinic/i.test(
        lowerName
      )
    ) {
      return { industry: "hospital", confidence: 0.9 };
    }
    // Dental/Orthodontics as medical offices
    if (
      /dent(al|ist|istry)|orthodont(ic|ics|ist)|braces|smile\s*direct|aspen\s*dental|bright\s*now/i.test(
        lowerName
      )
    ) {
      return { industry: "hospital", confidence: 0.85 };
    }
    // Physical Therapy as medical offices
    if (
      /physical\s*therap(y|ist)|rehab(ilitation)?|sports\s*medicine|athletico|pt\s*solutions/i.test(
        lowerName
      )
    ) {
      return { industry: "hospital", confidence: 0.85 };
    }
    // Optometry/Ophthalmology as medical offices
    if (
      /optom(etry|etrist)|ophthalm(ology|ologist)|eye\s*care|vision\s*center|lenscrafters|visionworks|pearle\s*vision/i.test(
        lowerName
      )
    ) {
      return { industry: "hospital", confidence: 0.85 };
    }
    // Fast Food Restaurants - classify as restaurant/retail
    if (
      /mcdonald'?s|burger\s*king|wendy'?s|taco\s*bell|kfc|chick-fil-a|chipotle|subway|arby'?s|sonic|dairy\s*queen|jack\s*in\s*the\s*box|carl'?s\s*jr|hardee'?s|five\s*guys|shake\s*shack|in-n-out|whataburger|culver'?s|popeyes|pizza\s*hut|domino'?s|papa\s*john'?s|little\s*caesars|panera/i.test(
        lowerName
      )
    ) {
      return { industry: "restaurant", confidence: 0.9 };
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
    if (
      /college|university|polytechnic|community\s+college|cal\s*(state|poly)|state\s+univ/i.test(
        lowerName
      )
    ) {
      return { industry: "college", confidence: 0.8 };
    }
    if (/airport|airfield|air\s*terminal|aviation|airstrip|aerodrome/i.test(lowerName)) {
      return { industry: "airport", confidence: 0.9 };
    }
    if (
      /cold\s*storage|cold\s*chain|refrigerated\s*(warehouse|facility)|freezer\s*(facility|storage)/i.test(
        lowerName
      )
    ) {
      return { industry: "cold_storage", confidence: 0.85 };
    }
    if (
      /indoor\s*farm|vertical\s*farm|hydroponic|aeroponic|aquaponic|greenhouse\s*(farm|grower)/i.test(
        lowerName
      )
    ) {
      return { industry: "indoor_farm", confidence: 0.85 };
    }
    if (
      /\bfarm\b|ranch|\bagriculture\b|\bagricultural\b|organic\s*farm|dairy\s*farm|vineyard|winery|orchard|livestock/i.test(
        lowerName
      )
    ) {
      return { industry: "agricultural", confidence: 0.8 };
    }
    // Fitness / Gym: standalone gyms, health clubs, boutique studios
    if (
      /\bgym\b|fitness|health\s*club|crossfit|planet\s*fitness|anytime\s*fitness|la\s*fitness|crunch|orangetheory|f45|equinox|24\s*hour\s*fitness|gold'?s\s*gym|snap\s*fitness|magicfit|magic\s*fit|blink\s*fitness|workout|yoga\s*studio|pilates|boxing\s*gym|martial\s*arts|jiu[- ]jitsu|kickboxing|boot\s*camp\s*fitness/i.test(
        lowerName
      )
    ) {
      return { industry: "fitness_center", confidence: 0.88 };
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
        car_wash: 8000, // Express tunnel 4.5-8K; flex/full-service 10-15K
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
        fitness_center: 10000, // Standalone gym: 5-15K sqft
        gym: 10000, // Alias for fitness_center
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
   *
   * BUG FIX: When CONFIRM_BUSINESS auto-detects the industry and skips Step 2,
   * the SET_INDUSTRY reducer resets solarPhysicalCapKW to 0 but SET_INDUSTRY_META
   * is never dispatched (setIndustry() is only called from Step 2 UI cards).
   * We must dispatch SET_INDUSTRY_META here so solarPhysicalCapKW is populated
   * even on the auto-skip path.
   */
  const confirmBusiness = useCallback(() => {
    dispatch({ type: "CONFIRM_BUSINESS" });

    // If a high-confidence industry was detected, populate solar cap + critical
    // load % immediately — exactly what setIndustry() does for the manual path.
    const detectedSlug = state.business?.detectedIndustry;
    const confidence = state.business?.confidence ?? 0;
    if (detectedSlug && confidence >= 0.75) {
      const constraints = getFacilityConstraints(detectedSlug);
      const solarPhysicalCapKW = constraints?.totalRealisticSolarKW ?? 0;
      let criticalLoadPct = 0.4;
      try {
        const critInfo = getCriticalLoadWithSource(detectedSlug);
        criticalLoadPct = critInfo.percentage;
      } catch {
        /* slug not in table — use default */
      }

      dispatch({ type: "SET_INDUSTRY_META", solarPhysicalCapKW, criticalLoadPct });
    }
  }, [state.business?.detectedIndustry, state.business?.confidence]);

  // ── Step 3: Reactive power calculation ─────────────────────────────────────
  //
  // Watches step3Answers + industry. Calls calculateUseCasePower() (synchronous
  // SSOT function) and dispatches SET_BASE_LOAD with the result.
  // This keeps Rule 3: steps are pure renderers — no calculations inside them.
  //
  // Non-power keys: add-on scope intents and navigation markers written to
  // step3Answers by Step3_5V8. These are NOT equipment inputs and must NOT
  // trigger a recalculation when they change.
  const NON_POWER_ANSWER_KEYS = new Set([
    "solarScope",
    "generatorScope",
    "evScope",
    "step3_5Visited",
    "canopyInterest",
  ]);

  // Stable string key of only the equipment-relevant answers.
  // Changes only when an answer that affects kW calculation changes.
  // Non-power keys (solarScope, generatorScope, evScope, step3_5Visited,
  // canopyInterest) are excluded so toggling add-ons or leaving the add-ons
  // step does NOT trigger a recalculation.

  const powerAnswersKey = useMemo(() => {
    return Object.entries(state.step3Answers)
      .filter(([k]) => !NON_POWER_ANSWER_KEYS.has(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join("|");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step3Answers]);

  // Stable serialization of ALL step3 answers — replaces JSON.stringify(state.step3Answers)
  // in the tier-build effect dependency array so serialization cost is paid once
  // per object change rather than on every render.

  const step3AnswersKey = useMemo(() => {
    return Object.entries(state.step3Answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v)}`)
      .join("|");
  }, [state.step3Answers]);

  // Ref so the effect body can always read the latest full answers snapshot
  // without adding state.step3Answers to the dependency array (which would
  // re-trigger on every non-power key change).
  const step3AnswersRef = useRef(state.step3Answers);
  step3AnswersRef.current = state.step3Answers;

  useEffect(() => {
    const slug = state.industry;
    if (!slug) {
      devLog("[useWizardV8] Power calc skipped: no industry");
      return;
    }

    const answers = step3AnswersRef.current;
    if (Object.keys(answers).length === 0) {
      devLog("[useWizardV8] Power calc skipped: no answers");
      return;
    }

    devLog("[useWizardV8] Running power calculation for:", slug, "with answers:", answers);

    // Convert underscore slug (V8 type) → hyphen slug (SSOT function convention)
    const ssotSlug = slug.replace(/_/g, "-");

    try {
      const result = calculateUseCasePower(ssotSlug, answers as Record<string, unknown>);
      devLog("[useWizardV8] Power calculation result:", result);

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
  }, [powerAnswersKey, state.industry]);

  // ── roofArea → solarPhysicalCapKW reactive update ──────────────────────────
  // When the user updates solar-related Step 3 answers, compute a more accurate
  // solar cap and update state.
  //
  // Car wash uses getCarWashSolarCapacity() which implements Vineet's model:
  //   building roof (by facilityType + roofType) + vacuum canopy + carport
  //   NOTE: totalSiteArea (~45k sqft) is the property — NOT usable for solar sizing.
  //   Building is only 4,500-6,500 sqft; vacuum canopy is the best solar surface.
  //
  // All other industries: roofArea × usableRoofPercent × 15 W/sqft / 1000
  //   totalSiteArea is intentionally ignored here — it includes parking and driveways.
  useEffect(() => {
    if (!state.industry) return;
    const criticalLoadPct = state.criticalLoadPct ?? 0.4;
    let newCap = 0;

    const isCarWash = state.industry === "car_wash";

    if (isCarWash) {
      // Base = building roof + vacuum canopy (no carport override)
      // Pass cached panel spec so density uses actual Wp/sqft from supplier DB.
      const cachedPanel = getLastSelectedPanelSync();
      const baseCapKW = getCarWashSolarCapacity(
        { ...(state.step3Answers ?? {}), canopyInterest: "no" },
        cachedPanel ?? undefined
      );
      const staticCap = getFacilityConstraints(state.industry)?.totalRealisticSolarKW ?? 60;
      const baseKW = baseCapKW > 0 ? baseCapKW : staticCap;
      // canopyInterest='yes' but carportArea not entered → getCarWashSolarCapacity returns 0
      // for carport. Add SSOT canopyPotentialKW as the default carport contribution.
      const carportInterest = (state.step3Answers?.canopyInterest ?? "no") as string;
      const carportArea = Number(state.step3Answers?.carportArea ?? 0);
      const canopyDefault = getFacilityConstraints("car_wash")?.canopyPotentialKW ?? 54;
      if (carportInterest === "yes") {
        const actual = carportArea > 0 ? Math.round((carportArea * 0.95) / 100) : canopyDefault;
        newCap = baseKW + actual;
      } else {
        newCap = baseKW;
      }
    } else {
      // canopyInterest='yes' → add full canopy potential from SSOT
      // canopyInterest='learn_more' → add 50% canopy (shows upside, not committed)
      // canopyInterest='no' → roof only (maxRooftopSolarKW)
      // canopyInterest not answered → use totalRealisticSolarKW static blend
      const roofArea = Number(state.step3Answers?.roofArea ?? 0);
      const canopyInterest = state.step3Answers?.canopyInterest as string | undefined;
      const constraints = getFacilityConstraints(state.industry);
      const usableRoofPercent = constraints?.usableRoofPercent ?? 0.4;
      const staticCap = constraints?.totalRealisticSolarKW ?? 0;
      const maxRoofOnlyKW = constraints?.maxRooftopSolarKW ?? 0;
      const canopyKW = constraints?.canopyPotentialKW ?? 0;

      // Roof-only solar from user's entered area — density scales with supplier DB panel spec.
      // computeSolarWattsPerSqft() returns 15 W/sqft when no panel is cached (SSOT default).
      const _cachedPanel = getLastSelectedPanelSync();
      const solarWPerSqft = computeSolarWattsPerSqft(_cachedPanel);
      const canopyWPerSqft = computeCanopyWattsPerSqft(_cachedPanel);
      const roofKW =
        roofArea > 0
          ? Math.round((roofArea * usableRoofPercent * solarWPerSqft) / 1000)
          : maxRoofOnlyKW; // fall back to SSOT cap when no area entered

      // For canopy kW: if user provided an explicit area, scale by panel spec;
      // otherwise use the SSOT canopyPotentialKW from constraints (already at 15 W/sqft)
      const canopyArea = Number(state.step3Answers?.canopyArea ?? 0);
      const dynamicCanopyKW =
        canopyArea > 0 ? Math.round((canopyArea * 0.95 * canopyWPerSqft) / 1000) : canopyKW; // fall back to SSOT constant when no area entered

      if (canopyInterest === "no") {
        // User explicitly declined canopy — roof only
        newCap = roofKW > 0 ? roofKW : maxRoofOnlyKW;
      } else if (canopyInterest === "yes") {
        // Full canopy included
        newCap = roofKW + dynamicCanopyKW;
      } else if (canopyInterest === "learn_more") {
        // Show 50% of canopy upside
        newCap = roofKW + Math.round(dynamicCanopyKW * 0.5);
      } else {
        // Not yet answered: use static SSOT blend (includes typical canopy)
        if (roofArea <= 0) return; // no roof area entered → keep cap from setIndustry
        newCap =
          staticCap > 0
            ? Math.round((roofKW + staticCap) / 2) // blend user data + SSOT
            : roofKW;
      }
    }

    if (newCap > 0 && newCap !== state.solarPhysicalCapKW) {
      dispatch({ type: "SET_INDUSTRY_META", solarPhysicalCapKW: newCap, criticalLoadPct });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.industry,
    state.step3Answers?.roofArea,
    state.step3Answers?.canopyInterest,
    state.step3Answers?.facilityType,
    state.step3Answers?.roofType,
    state.step3Answers?.vacuumStations,
    state.step3Answers?.carportArea,
  ]);

  // ── Step 2: Industry selection ─────────────────────────────────────────

  /**
   * setIndustry — dispatches slug + derives meta immediately from SSOT.
   * Meta: solar physical cap + critical load % (IEEE 446 / NEC).
   */
  const setIndustry = useCallback(
    (slug: IndustrySlug) => {
      dispatch({ type: "SET_INDUSTRY", slug });

      // Solar physical cap: prefer Google Solar actual rooftop area over SSOT static estimate.
      // This is Vineet's "typical rooftop size" requirement — real building data beats generic caps.
      const constraints = getFacilityConstraints(slug);
      const ssotCapKW = constraints?.totalRealisticSolarKW ?? 0;

      let solarPhysicalCapKW = ssotCapKW; // SSOT fallback

      const googleRoofSqFt = state.intel?.googleSolarRoofSqFt ?? 0;
      const userRoofArea = Number(state.step3Answers?.roofArea ?? 0);

      // Use Google Solar roof area when:
      //   • We have it (ZIP already entered before industry selected)
      //   • User hasn't overridden with their own measurement yet
      if (googleRoofSqFt > 0 && userRoofArea <= 0) {
        const usableRoofPercent = constraints?.usableRoofPercent ?? 0.4;
        const _cachedPanel = getLastSelectedPanelSync();
        const solarWPerSqft = computeSolarWattsPerSqft(_cachedPanel);
        const googleCapKW = Math.round((googleRoofSqFt * usableRoofPercent * solarWPerSqft) / 1000);
        if (googleCapKW > 0) {
          solarPhysicalCapKW = googleCapKW;
          devLog(
            `[setIndustry] Google Solar roof cap: ${googleCapKW} kW ` +
              `(${googleRoofSqFt.toFixed(0)} sqft × ${usableRoofPercent * 100}% × ${solarWPerSqft} W/sqft) ` +
              `vs SSOT: ${ssotCapKW} kW`
          );
        }
      }

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
    },
    [state.intel?.googleSolarRoofSqFt, state.step3Answers?.roofArea]
  );

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
        solarPanelTier: "standard" | "premium";
        solarStructureType: "rooftop" | "carport_new" | "carport_retrofit";
        generatorKW: number;
        generatorFuelType: "diesel" | "natural-gas" | "dual-fuel" | "linear";
        linearGeneratorKW: number;
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

  const setPanelInfo = useCallback(
    (
      panelAmps: number,
      serviceType: "single-phase-208" | "three-phase-208" | "three-phase-480" | "unknown",
      upgradeCost: number,
      upgradeType:
        | "none"
        | "circuit_breakers"
        | "service_upgrade"
        | "transformer"
        | "standalone_panel"
    ) => {
      dispatch({ type: "SET_PANEL_INFO", panelAmps, serviceType, upgradeCost, upgradeType });
    },
    []
  );

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

  const setBillData = useCallback(
    (data: import("@/services/openAIExtractionService").ExtractedSpecsData) => {
      dispatch({ type: "SET_BILL_DATA", data });
      // Also patch intel with utility rate from bill if available
      if (data.utilityInfo?.electricityRate != null) {
        dispatch({
          type: "PATCH_INTEL",
          patch: {
            utilityRate: data.utilityInfo.electricityRate,
            ...(data.utilityInfo.utilityProvider
              ? { utilityProvider: data.utilityInfo.utilityProvider }
              : {}),
            utilityStatus: "ready" as const,
          },
        });
      }
    },
    []
  );

  const clearBillData = useCallback(() => {
    dispatch({ type: "CLEAR_BILL_DATA" });
  }, []);

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

  const goToStep = useCallback(async (step: WizardStep) => {
    // ⚡ REMOVED SKIP LOGIC - Step 4 (Add-ons) should ALWAYS show
    // Even if no addons initially selected, we show intelligent recommendations
    // User can skip addons by clicking Continue, but we always present the opportunity

    // ⚡ REMOVED MANUAL TIER BUILDING - useEffect handles it proactively
    // Tiers are built in background during Step 3/4 via useEffect
    // Navigation just moves to the next step - tiers should already be ready

    dispatch({ type: "GO_TO_STEP", step });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_BACK" });
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (zipDebounceRef.current) clearTimeout(zipDebounceRef.current);
    tierBuildRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  // ⚡ TIER BUILDING - Proactive background build
  // Watches the cache key (createTierBuildKey) which includes ALL relevant fields:
  // - step, location, industry, baseLoadKW, peakLoadKW, criticalLoadPct
  // - solarPhysicalCapKW, wantsSolar, wantsGenerator, wantsEVCharging
  // - solarKW, generatorKW, generatorFuelType, evChargers, evRevenuePerYear
  // - step3Answers, intel (utilityRate, demandCharge, etc.)
  //
  // When createTierBuildKey() changes, the cached tier build is invalidated
  // and a new build is triggered. This is SSOT for cache invalidation.
  useEffect(() => {
    // Detect stale cache: tiers are "ready" but the current state (e.g. addon
    // preferences changed on Step 3.5) no longer matches what was built.
    const currentKey = createTierBuildKey(state);
    const cacheStale =
      state.tiersStatus === "ready" &&
      tierBuildRef.current !== null &&
      tierBuildRef.current.key !== currentKey;

    const shouldBuild =
      state.step >= 3 &&
      state.baseLoadKW > 0 &&
      !!state.location &&
      state.tiersStatus !== "fetching" &&
      (state.tiersStatus !== "ready" || cacheStale);

    if (!shouldBuild) return;

    devLog(
      "[useWizardV8] 🔄 Building tiers",
      cacheStale ? "(addons changed — rebuilding)" : "(initial build)",
      {
        step: state.step,
        wantsSolar: state.wantsSolar,
        solarScope: state.step3Answers?.solarScope,
      }
    );

    dispatch({ type: "SET_TIERS_STATUS", status: "fetching" });

    // E5 MagicFit watchdog: if buildTiers hangs (e.g. Supabase stall) for
    // more than 15 s, force-reset to error so the UI doesn't freeze forever.
    const buildKey = createTierBuildKey(state);
    const watchdog = setTimeout(() => {
      // Only reset if still waiting on the same build key
      if (tierBuildRef.current?.key === buildKey) {
        console.warn("[useWizardV8] ⏱ Tier build watchdog fired — forcing error state");
        dispatch({ type: "SET_TIERS_STATUS", status: "error" });
        tierBuildRef.current = null;
      }
    }, 15_000);

    void getOrStartTierBuild(state)
      .then((tiers) => {
        clearTimeout(watchdog);
        devLog("[useWizardV8] ✅ Background tier build complete", tiers.length);
        dispatch({ type: "SET_TIERS", tiers });
        dispatch({ type: "SET_TIERS_STATUS", status: "ready" });
      })
      .catch((error) => {
        clearTimeout(watchdog);
        console.error("[useWizardV8] ❌ Tier build failed:", error);
        dispatch({ type: "SET_TIERS_STATUS", status: "error" });
        if (tierBuildRef.current?.key === createTierBuildKey(state)) {
          tierBuildRef.current = null;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getOrStartTierBuild,
    state.step,
    state.baseLoadKW,
    state.location?.zip,
    state.tiersStatus,
    state.industry,
    state.peakLoadKW,
    state.criticalLoadPct,
    state.solarPhysicalCapKW,
    state.wantsSolar,
    state.wantsGenerator,
    state.wantsEVCharging,
    state.solarKW,
    state.generatorKW,
    state.generatorFuelType,
    state.level2Chargers,
    state.dcfcChargers,
    state.hpcChargers,
    // state intentionally omitted — would fire on every render.
    // Use stable memoized key instead of inline JSON.stringify (saves
    // serialization cost on every render; same semantics, fires only when
    // step3Answers object reference changes).

    step3AnswersKey,
    state.intel?.utilityRate,
    state.intel?.demandCharge,
    state.intel?.peakSunHours,
    state.intel?.solarFeasible,
  ]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // ── Return ────────────────────────────────────────────────────────────────

  // Memoize the actions bag so downstream components that destructure `actions`
  // don't re-render just because unrelated state (e.g. baseLoadKW) changed.
  // All callbacks are already stable (useCallback), so this memo rarely fires.
  const actions = useMemo(
    () => ({
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
      setPanelInfo,
      setBaseLoad,
      setBillData,
      clearBillData,
      setTiers,
      setTiersStatus,
      selectTier,
      goToStep,
      goBack,
      reset,
      clearError,
    }),
    [
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
      setPanelInfo,
      setBaseLoad,
      setBillData,
      clearBillData,
      setTiers,
      setTiersStatus,
      selectTier,
      goToStep,
      goBack,
      reset,
      clearError,
    ]
  );

  return { state, actions };
}

export type { WizardState, WizardActions } from "./wizardState";
