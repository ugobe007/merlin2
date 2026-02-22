/**
 * Wizard V7 API Functions
 * 
 * All API calls and external service integrations for the wizard flow.
 * Extracted from useWizardV7.ts for better organization and testability.
 * 
 * @module wizard/v7/api/wizardAPI
 */

import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";
import type {
  LocationCard,
  BusinessCard,
  IndustrySlug,
  Step3Template,
  Step3Answers,
  Step3AnswersMeta,
  LocationIntel,
} from "@/wizard/v7/hooks/useWizardV7";
import type { PricingConfig, PricingQuoteResult } from "@/wizard/v7/pricing/pricingBridge";
import { resolveIndustryContext } from "@/wizard/v7/industry";
import { validateTemplate, formatValidationResult } from "@/wizard/v7/validation/templateValidator";

/**
 * Resolve user location input -> LocationCard
 * 
 * Uses Google Places API via backend to geocode location.
 * Handles ZIP-only inputs, validates US state presence.
 */
export async function resolveLocation(input: string, signal?: AbortSignal): Promise<LocationCard> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw { code: "VALIDATION", message: "Location input is empty." };
  }

  // Import API helper
  const { apiCall, API_ENDPOINTS } = await import("@/config/api");

  // Call backend location resolve endpoint
  const response = await apiCall<{
    ok: boolean;
    location?: LocationCard;
    source?: string;
    confidence?: number;
    evidence?: {
      source: string;
      placeId?: string;
      locationType?: string;
      components?: string[];
    };
    reason?: string;
    notes?: string[];
  }>(API_ENDPOINTS.LOCATION_RESOLVE, {
    method: "POST",
    body: JSON.stringify({ query: trimmed }),
    signal,
  });

  // Handle rejection from backend
  if (!response.ok) {
    const errorMsg = response.notes?.join(" ") || response.reason || "Location not found";

    // Log evidence for debugging if present
    if (response.evidence && import.meta.env.DEV) {
      devLog("[V7 SSOT] Location rejection evidence:", response.evidence);
    }

    throw { code: "VALIDATION", message: errorMsg };
  }

  // Log confidence + evidence for audit trail
  const confidence = response.confidence ?? 0.7;
  const evidence = response.evidence;

  if (import.meta.env.DEV) {
    devLog(`[V7 SSOT] Location resolved with confidence: ${confidence}`, {
      source: evidence?.source,
      placeId: evidence?.placeId,
      components: evidence?.components,
    });
  }

  // Soft-gate: Warn about low confidence but allow through
  if (confidence < 0.7) {
    devWarn(
      `[V7 SSOT] Low confidence location (${confidence}): ${response.location?.formattedAddress}`
    );
  }

  // Validate state field for US locations (SSOT requirement)
  let location = response.location!;
  if (location.countryCode === "US" && !location.state) {
    throw {
      code: "VALIDATION",
      message:
        "Location found, but no state detected. Please add state to your search (e.g., 'San Francisco, CA').",
    };
  }

  // ✅ FIX Feb 7, 2026: Guarantee postalCode is populated when input is a ZIP.
  // Many geocoders return lat/lng + formattedAddress but omit postalCode for ZIP lookups.
  const zip5 = trimmed.replace(/\D/g, "").slice(0, 5);
  if (zip5.length === 5 && /^\d{3,10}$/.test(trimmed) && !location.postalCode) {
    location = { ...location, postalCode: zip5 };
    if (import.meta.env.DEV) {
      devLog(`[V7 SSOT] resolveLocation: injected postalCode=${zip5} (geocoder omitted it)`);
    }
  }

  return location;
}

/**
 * Fetch utility rate data by ZIP code
 * 
 * Progressive hydration: enriches location with utility data.
 */
export async function fetchUtility(
  zipOrInput: string
): Promise<{ rate?: number; demandCharge?: number; provider?: string }> {
  const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
  if (!zip || zip.length < 5) {
    return { rate: undefined, demandCharge: undefined, provider: undefined };
  }

  try {
    // Wire to real utilityRateService
    const { getCommercialRateByZip } = await import("@/services/utilityRateService");
    const data = await getCommercialRateByZip(zip);

    if (!data) {
      devWarn("[V7] No utility data for ZIP:", zip);
      return { rate: undefined, demandCharge: undefined, provider: undefined };
    }

    return {
      rate: data.rate,
      demandCharge: data.demandCharge,
      provider: data.utilityName,
    };
  } catch (e) {
    devError("[V7] Utility rate fetch error:", e);
    throw e;
  }
}

/**
 * Fetch solar resource data by ZIP code
 * 
 * Progressive hydration: enriches location with solar potential.
 */
export async function fetchSolar(zipOrInput: string): Promise<{ peakSunHours?: number; grade?: string }> {
  const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
  if (!zip || zip.length < 5) {
    return { peakSunHours: undefined, grade: undefined };
  }

  try {
    // Wire to real pvWattsService
    const { estimateSolarProduction: _estimateSolarProduction, REGIONAL_CAPACITY_FACTORS } =
      await import("@/services/pvWattsService");
    const { getUtilityRatesByZip } = await import("@/services/utilityRateService");

    // Get state from ZIP for capacity factor lookup
    const utilityData = await getUtilityRatesByZip(zip);
    const stateCode = utilityData?.stateCode || "CA";

    // Get capacity factor and calculate peak sun hours
    const capacityFactor = REGIONAL_CAPACITY_FACTORS[stateCode] ?? 0.17;
    // Peak sun hours ≈ capacity factor × 24 (simplified)
    const peakSunHours = capacityFactor * 24;

    // Solar grade based on capacity factor
    let grade: string;
    if (capacityFactor >= 0.21) grade = "A";
    else if (capacityFactor >= 0.18) grade = "A-";
    else if (capacityFactor >= 0.16) grade = "B+";
    else if (capacityFactor >= 0.14) grade = "B";
    else grade = "C";

    return {
      peakSunHours: Math.round(peakSunHours * 10) / 10,
      grade,
    };
  } catch (e) {
    devError("[V7] Solar data fetch error:", e);
    throw e;
  }
}

/**
 * Fetch weather profile data by ZIP code
 * 
 * Progressive hydration: enriches location with climate data.
 */
export async function fetchWeather(zipOrInput: string): Promise<{ risk?: string; profile?: string }> {
  const zip = zipOrInput.replace(/\D/g, "").slice(0, 5);
  if (!zip || zip.length < 5) {
    return { risk: undefined, profile: undefined };
  }

  try {
    // Wire to real weatherService
    const { getWeatherData } = await import("@/services/weatherService");
    const data = await getWeatherData(zip);

    if (!data) {
      devWarn("[V7] No weather data for ZIP:", zip);
      return { risk: undefined, profile: undefined };
    }

    return {
      risk: data.extremes, // "Frequent heatwaves", "Harsh winters", etc.
      profile: data.profile, // "Hot & Humid", "Cold & Dry", "Temperate", etc.
    };
  } catch (e) {
    devError("[V7] Weather fetch error:", e);
    throw e;
  }
}

/**
 * Infer industry from location and business card
 * 
 * Uses keyword matching on business name, address, and location.
 * Returns industry slug with confidence score.
 */
export async function inferIndustry(
  location: LocationCard,
  _signal?: AbortSignal,
  businessCard?: BusinessCard | null
): Promise<{ industry: IndustrySlug; confidence: number }> {
  // If businessCard has inferred industry, use it
  if (businessCard?.inferredIndustry && businessCard.inferredIndustry !== "auto") {
    const confidence = businessCard.industryConfidence ?? 0.9;
    devLog(
      `[V7 SSOT] Using business card industry: ${businessCard.inferredIndustry} (${confidence})`
    );
    return { industry: businessCard.inferredIndustry, confidence };
  }

  // Fallback: try to infer from location name, address, AND business card keywords
  // ✅ FIX Feb 7, 2026: Include businessCard.name + address so "dash car wash" matches car_wash
  const searchText = [
    businessCard?.name,
    businessCard?.address,
    location.formattedAddress,
    location.city,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Simple keyword matching for common industries
  const industryKeywords: Record<IndustrySlug, string[]> = {
    car_wash: ["car wash", "carwash", "auto wash", "auto spa"],
    hotel: ["hotel", "motel", "inn", "resort", "suites", "lodge", "hospitality"],
    ev_charging: ["ev charging", "charging station", "supercharger", "electrify"],
    retail: ["retail", "store", "shop", "mall", "outlet"],
    restaurant: ["restaurant", "cafe", "diner", "grill", "kitchen", "bistro", "eatery"],
    warehouse: ["warehouse", "logistics", "distribution", "fulfillment", "storage"],
    manufacturing: ["manufacturing", "factory", "industrial", "plant", "production", "xtreme"],
    office: ["office", "corporate", "headquarters", "plaza"],
    healthcare: ["hospital", "clinic", "medical", "health", "care"],
    data_center: ["data center", "datacenter", "colocation", "colo"],
    auto: [],
    other: [],
  };

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      // ✅ FIX Feb 7, 2026: Business name keyword match gets 0.92 confidence
      // (clears the 0.85 threshold for auto-skip to Step 3).
      // Location-only keyword match stays at 0.75 (user picks industry manually).
      const fromBusiness =
        businessCard?.name &&
        keywords.some((kw) => (businessCard.name ?? "").toLowerCase().includes(kw));
      const conf = fromBusiness ? 0.92 : 0.75;
      devLog(
        `[V7 SSOT] Inferred industry from keywords: ${industry} (conf=${conf}, fromBusiness=${fromBusiness})`
      );
      return { industry: industry as IndustrySlug, confidence: conf };
    }
  }

  // No match
  return { industry: "auto", confidence: 0 };
}

/**
 * Load Step 3 template by industry
 * 
 * RESILIENCE: API is an enhancement, not a dependency.
 * Falls back to local JSON templates if backend unavailable.
 * 
 * @param industry - Industry slug to load template for
 * @param signal - AbortSignal for cancellation
 * @returns Step3Template with validated structure
 */
export async function loadStep3Template(industry: IndustrySlug, signal?: AbortSignal): Promise<Step3Template> {
  // Resolve industry context via SSOT catalog (replaces inline templateMapping)
  const ctx = resolveIndustryContext(industry);
  const selected = industry;
  const effective = ctx.templateKey as IndustrySlug;

  devLog(
    `[V7 SSOT] Step3 template resolved: selected=${selected} effective=${effective} (via industryCatalog)`
  );

  // ============================================================
  // Phase 1: Try remote API (preferred — freshest data)
  // ============================================================
  let remoteTemplate: Step3Template | null = null;
  let _apiError: unknown = null;

  try {
    const { apiCall, API_ENDPOINTS } = await import("@/config/api");

    const response = await apiCall<{
      ok: boolean;
      template?: Step3Template;
      reason?: string;
      notes?: string[];
      requestedIndustry?: string;
      availableIndustries?: string[];
    }>(API_ENDPOINTS.TEMPLATE_LOAD, {
      method: "POST",
      body: JSON.stringify({ industry: effective }),
      signal,
    });

    if (response.ok && response.template) {
      remoteTemplate = response.template;
    } else {
      _apiError = {
        code: "API",
        message: response.notes?.join(" ") || `Template not found for ${selected}`,
        reason: response.reason,
      };

      if (import.meta.env.DEV) {
        devWarn(
          `[V7 SSOT] Template API returned {ok:false}:`,
          `reason=${response.reason}`,
          `industry=${response.requestedIndustry ?? effective}`,
          `available=[${response.availableIndustries?.join(", ") ?? "?"}]`
        );
      }
    }
  } catch (err: unknown) {
    // AbortError should propagate immediately — user navigated away
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      throw err;
    }
    _apiError = err;
    devWarn(
      `[V7 SSOT] Template API failed (will try local fallback):`,
      err instanceof Error ? err.message : err
    );
  }

  // ============================================================
  // Phase 2: Resolve template (remote OR local fallback OR generic)
  // ============================================================
  let sourceLabel: "api" | "local" | "generic-fallback" = "api";

  if (!remoteTemplate) {
    // Fallback 1: load from bundled JSON templates (industry-specific)
    const { getTemplate, getFallbackTemplate } =
      await import("@/wizard/v7/templates/templateIndex");
    const localTpl = getTemplate(effective);

    if (!localTpl) {
      // Fallback 2: Universal generic template (works for ANY facility)
      // Recovery Strategy: Never hard-fail — always give user a path forward
      devWarn(`[V7 SSOT] No template for "${effective}" — using generic facility fallback`);
      const genericTpl = getFallbackTemplate();

      remoteTemplate = {
        id: genericTpl.id ?? `${genericTpl.industry}.${genericTpl.version}`,
        industry: genericTpl.industry as IndustrySlug,
        selectedIndustry: selected as IndustrySlug, // Preserve what user actually picked
        version: genericTpl.version,
        questions: genericTpl.questions.map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type as Step3Template["questions"][number]["type"],
          required: q.required,
          options: q.options as Step3Template["questions"][number]["options"],
          unit: q.unit,
          hint: q.hint,
          min: q.min,
          max: q.max,
          defaultValue: genericTpl.defaults?.[q.id] as
            | string
            | number
            | boolean
            | string[]
            | undefined,
        })),
        defaults: genericTpl.defaults,
      };
      sourceLabel = "generic-fallback";
    } else {
      // Convert IndustryTemplateV1 → Step3Template shape
      remoteTemplate = {
        id: localTpl.id ?? `${localTpl.industry}.${localTpl.version}`,
        industry: localTpl.industry as IndustrySlug,
        version: localTpl.version,
        questions: localTpl.questions.map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type as Step3Template["questions"][number]["type"],
          required: q.required,
          options: q.options as Step3Template["questions"][number]["options"],
          unit: q.unit,
          hint: q.hint,
          min: q.min,
          max: q.max,
          defaultValue: localTpl.defaults?.[q.id] as
            | string
            | number
            | boolean
            | string[]
            | undefined,
        })),
        defaults: localTpl.defaults,
      };
      sourceLabel = "local";
    }

    if (import.meta.env.DEV) {
      devWarn(
        `[V7 SSOT] ⚠ Using ${sourceLabel.toUpperCase()} template for "${effective}" (API unavailable)`
      );
    }
  }

  // ============================================================
  // Phase 3: Stamp identity fields + validate
  // ============================================================

  // Generate deterministic template ID if not provided
  const templateId =
    (remoteTemplate as Record<string, unknown>).id ?? `${effective}.${remoteTemplate.version}`;

  // Build final template with proper identity fields
  const finalTemplate: Step3Template = {
    ...remoteTemplate,

    // Stable identity for keying
    id: templateId as string,

    // Internal truth: what the questions/mapping actually belong to
    industry: effective,

    // UI display: what user selected (for headers, badges)
    selectedIndustry: selected,

    // Debug field (redundant but useful for logging)
    _effectiveTemplate: effective,
  };

  // ============================================================
  // SSOT Contract Validation (invariant enforcement)
  // ============================================================
  const validation = validateTemplate(finalTemplate, {
    minQuestions: 8,
    maxQuestions: 24,
    strictMode: false,
  });

  if (!validation.ok) {
    // Log detailed validation failure
    devError("[V7 SSOT] Template validation FAILED:", formatValidationResult(validation));

    // Hard fail - don't return a broken template that would produce garbage quotes
    throw {
      code: "VALIDATION",
      message: `Template contract violation: ${validation.issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")}`,
      _validationResult: validation,
    };
  }

  // Log warnings in DEV (non-blocking)
  if (validation.summary.warnings > 0 && import.meta.env.DEV) {
    devWarn("[V7 SSOT] Template validation warnings:", formatValidationResult(validation));
  }

  devLog(
    `[V7 SSOT] Loaded Step3 template: selected=${selected} effective=${effective} source=${sourceLabel} v=${remoteTemplate.version} id=${templateId} questions=${finalTemplate.questions.length} ✓`
  );

  return finalTemplate;
}

/**
 * Compute smart defaults for Step 3 initial load
 * 
 * TEMPLATE-DRIVEN (no hardcoded industryDefaults magic object).
 * 
 * Sources (in priority order, last wins within each category):
 * 1. template.defaults (canonical defaults from JSON/DB)
 * 2. question.defaultValue (legacy per-question defaults)
 * 
 * IMPORTANT: Does NOT include locationIntel or businessDetection.
 * Those are "override patches" applied separately via PATCH_STEP3_ANSWERS
 * to avoid stomping user edits on re-hydration.
 * 
 * @returns { answers, meta } with provenance tracking
 */
export function computeSmartDefaults(
  template: Step3Template,
  _locationIntel: LocationIntel | null, // Reserved for future (not used in baseline)
  _businessCard: BusinessCard | null // Reserved for future (not used in baseline)
): { answers: Step3Answers; meta: Step3AnswersMeta } {
  const answers: Step3Answers = {};
  const meta: Step3AnswersMeta = {};
  const ts = new Date().toISOString();

  // 1. Apply template-level defaults first (canonical source from JSON/DB)
  if (template.defaults && typeof template.defaults === "object") {
    for (const [key, value] of Object.entries(template.defaults)) {
      answers[key] = value;
      meta[key] = { source: "template_default", at: ts };
    }
  }

  // 2. Apply per-question defaultValue (legacy format, overwrites template.defaults)
  for (const q of template.questions) {
    if (q.defaultValue !== undefined) {
      const prev = answers[q.id];
      answers[q.id] = q.defaultValue;
      meta[q.id] = { source: "question_default", at: ts, prev };
    }
  }

  devLog(
    `[V7 SSOT] Computed baseline defaults: ${Object.keys(answers).length} fields from template.id=${template.id || "?"}`
  );
  return { answers, meta };
}

/**
 * Build a patch object from locationIntel
 * 
 * Maps intel fields to Step 3 question IDs.
 * Returns only the fields that have data (sparse patch).
 * 
 * This is applied via PATCH_STEP3_ANSWERS with source="location_intel"
 * so it won't stomp user edits.
 */
export function buildIntelPatch(locationIntel: LocationIntel | null): Step3Answers {
  if (!locationIntel) return {};

  const patch: Step3Answers = {};

  // Map locationIntel fields to Step 3 question IDs
  if (locationIntel.demandCharge !== undefined) {
    patch["demand_charge_rate"] = locationIntel.demandCharge;
  }
  if (locationIntel.utilityRate !== undefined) {
    patch["electricity_rate"] = locationIntel.utilityRate;
  }
  // Future: Add more mappings as needed (e.g., peak_sun_hours → solar questions)

  if (Object.keys(patch).length > 0) {
    devLog(`[V7 SSOT] Built intel patch: ${Object.keys(patch).join(", ")}`);
  }

  return patch;
}

/**
 * Build a patch object from businessCard detection
 * 
 * Maps business detection fields to Step 3 question IDs.
 * Returns only the fields that have data (sparse patch).
 * 
 * This is applied via PATCH_STEP3_ANSWERS with source="business_detection"
 * so it won't stomp user edits.
 */
export function buildBusinessPatch(businessCard: BusinessCard | null): Step3Answers {
  if (!businessCard) return {};

  const patch: Step3Answers = {};

  // Map businessCard fields to Step 3 question IDs
  // (These would come from businessDetectionService / Places API)
  // Example: if business detection found operating hours
  // patch["operating_hours"] = businessCard.operatingHours;

  // For now, this is a placeholder for future businessDetectionService integration

  if (Object.keys(patch).length > 0) {
    devLog(`[V7 SSOT] Built business patch: ${Object.keys(patch).join(", ")}`);
  }

  return patch;
}

/**
 * Run pricing quote calculation
 * 
 * Delegates to pricingBridge.ts for actual implementation.
 * 
 * @param contract - Contract quote result from truequote engine
 * @param config - Pricing configuration
 * @returns Pricing quote result with financials
 */
export async function runPricingQuote(
  contract: import("@/wizard/v7/pricing/pricingBridge").ContractQuoteResult,
  config: PricingConfig
): Promise<PricingQuoteResult> {
  // Implementation delegated to pricingBridge.ts
  const { runPricingQuote: _runPricingQuote } = await import("@/wizard/v7/pricing/pricingBridge");
  return _runPricingQuote(contract, config);
}

/**
 * Wizard API object
 * 
 * All API functions in a single exportable object for backward compatibility.
 */
export const wizardAPI = {
  resolveLocation,
  fetchUtility,
  fetchSolar,
  fetchWeather,
  inferIndustry,
  loadStep3Template,
  computeSmartDefaults,
  buildIntelPatch,
  buildBusinessPatch,
  runPricingQuote,
};
