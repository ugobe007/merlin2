/**
 * @fileoverview useWizardCore - Reducer, Initial State, and Contract Quote Runner
 * @module wizard/v7/hooks/useWizardCore
 * 
 * Extracted from useWizardV7.ts (Op1e-1 - Feb 22, 2026)
 * 
 * Contains the core state management infrastructure:
 * - initialState(): Factory for initial WizardState
 * - reduce(): Main reducer function (716 lines, 44 intent types)
 * - runContractQuote(): Contract quote runner (Layer A)
 * 
 * This allows useWizardV7.ts to focus on hook orchestration while
 * keeping the state machine logic separate and testable.
 */

import { useReducer } from "react";
// Import types from main hook (defined there to avoid circular dependency)
import type {
  WizardState,
  WizardStep,
  Intent,
  Step3Answers,
  Step3AnswersMeta,
  AnswerSource,
  PricingFreeze,
  QuoteOutput,
  LocationCard,
  LocationIntel,
  GridMode,
  WizardError,
} from "./useWizardV7";
import { devLog, devWarn } from "@/wizard/v7/debug/devLog";
import { merlinMemory } from "@/wizard/v7/memory";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { applyTemplateMapping } from "@/wizard/v7/templates/applyMapping";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import type { CalcInputs } from "@/wizard/v7/calculators/contract";
import { resolveIndustryContext } from "@/wizard/v7/industry/resolveIndustryContext";
import { getSizingDefaults } from "@/wizard/v7/pricing/pricingBridge";
import { validateTemplateAgainstCalculator } from "@/wizard/v7/templates/validator";
import { ContractRunLogger } from "@/wizard/v7/telemetry/contractTelemetry";

/* ============================================================
   Helper Functions
============================================================ */

function createSessionId(): string {
  return `wiz_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function getStateFromZipPrefix(zip: string): string | undefined {
  const prefix = zip.slice(0, 3);
  // Simple map of ZIP prefixes to states (first 100 entries for common states)
  const zipMap: Record<string, string> = {
    // Northeast
    "010": "MA", "011": "MA", "012": "MA", "013": "MA", "014": "MA",
    "015": "MA", "016": "MA", "017": "MA", "018": "MA", "019": "MA",
    "020": "MA", "021": "MA", "022": "MA", "023": "MA", "024": "MA",
    "025": "MA", "026": "MA", "027": "MA",
    "028": "RI", "029": "RI",
    "030": "NH", "031": "NH", "032": "NH", "033": "NH", "034": "NH",
    "035": "NH", "036": "NH", "037": "NH", "038": "NH",
    "039": "ME", "040": "ME", "041": "ME", "042": "ME", "043": "ME",
    "044": "ME", "045": "ME", "046": "ME", "047": "ME", "048": "ME", "049": "ME",
    "050": "VT", "051": "VT", "052": "VT", "053": "VT", "054": "VT",
    "055": "MA", "056": "VT", "057": "VT", "058": "VT", "059": "VT",
    "060": "CT", "061": "CT", "062": "CT", "063": "CT", "064": "CT",
    "065": "CT", "066": "CT", "067": "CT", "068": "CT", "069": "CT",
    "070": "NJ", "071": "NJ", "072": "NJ", "073": "NJ", "074": "NJ",
    "075": "NJ", "076": "NJ", "077": "NJ", "078": "NJ", "079": "NJ",
    "080": "NJ", "081": "NJ", "082": "NJ", "083": "NJ", "084": "NJ",
    "085": "NJ", "086": "NJ", "087": "NJ", "088": "NJ", "089": "NJ",
    // Mid-Atlantic
    "100": "NY", "101": "NY", "102": "NY", "103": "NY", "104": "NY",
    "105": "NY", "106": "NY", "107": "NY", "108": "NY", "109": "NY",
    "110": "NY", "111": "NY", "112": "NY", "113": "NY", "114": "NY",
    "115": "NY", "116": "NY", "117": "NY", "118": "NY", "119": "NY",
    "120": "NY", "121": "NY", "122": "NY", "123": "NY", "124": "NY",
    "125": "NY", "126": "NY", "127": "NY", "128": "NY", "129": "NY",
    "130": "NY", "131": "NY", "132": "NY", "133": "NY", "134": "NY",
    "135": "NY", "136": "NY", "137": "NY", "138": "NY", "139": "NY",
    "140": "NY", "141": "NY", "142": "NY", "143": "NY", "144": "NY",
    "145": "NY", "146": "NY", "147": "NY", "148": "NY", "149": "NY",
    "150": "PA", "151": "PA", "152": "PA", "153": "PA", "154": "PA",
    "155": "PA", "156": "PA", "157": "PA", "158": "PA", "159": "PA",
    "160": "PA", "161": "PA", "162": "PA", "163": "PA", "164": "PA",
    "165": "PA", "166": "PA", "167": "PA", "168": "PA", "169": "PA",
    "170": "PA", "171": "PA", "172": "PA", "173": "PA", "174": "PA",
    "175": "PA", "176": "PA", "177": "PA", "178": "PA", "179": "PA",
    "180": "PA", "181": "PA", "182": "PA", "183": "PA", "184": "PA",
    "185": "PA", "186": "PA", "187": "PA", "188": "PA", "189": "PA",
    "190": "PA", "191": "PA", "192": "PA", "193": "PA", "194": "PA",
    "195": "PA", "196": "PA",
    "197": "DE", "198": "DE", "199": "DE",
    // Mid-Atlantic continued
    "200": "DC", "201": "VA", "202": "DC", "203": "DC", "204": "MD",
    "205": "MD", "206": "MD", "207": "MD", "208": "MD", "209": "MD",
    "210": "MD", "211": "MD", "212": "MD", "214": "MD", "215": "MD",
    "216": "MD", "217": "MD", "218": "MD", "219": "MD",
    "220": "VA", "221": "VA", "222": "VA", "223": "VA", "224": "VA",
    "225": "VA", "226": "VA", "227": "VA", "228": "VA", "229": "VA",
    "230": "VA", "231": "VA", "232": "VA", "233": "VA", "234": "VA",
    "235": "VA", "236": "VA", "237": "VA", "238": "VA", "239": "VA",
    "240": "VA", "241": "VA", "242": "VA", "243": "VA", "244": "VA",
    "245": "VA", "246": "VA",
    // South
    "247": "WV", "248": "WV", "249": "WV", "250": "WV", "251": "WV",
    "252": "WV", "253": "WV", "254": "WV", "255": "WV", "256": "WV",
    "257": "WV", "258": "WV", "259": "WV", "260": "WV", "261": "WV",
    "262": "WV", "263": "WV", "264": "WV", "265": "WV", "266": "WV",
    "267": "WV", "268": "WV",
    "270": "NC", "271": "NC", "272": "NC", "273": "NC", "274": "NC",
    "275": "NC", "276": "NC", "277": "NC", "278": "NC", "279": "NC",
    "280": "NC", "281": "NC", "282": "NC", "283": "NC", "284": "NC",
    "285": "NC", "286": "NC", "287": "NC", "288": "NC", "289": "NC",
    "290": "SC", "291": "SC", "292": "SC", "293": "SC", "294": "SC",
    "295": "SC", "296": "SC", "297": "SC", "298": "SC", "299": "SC",
    "300": "GA", "301": "GA", "302": "GA", "303": "GA", "304": "GA",
    "305": "GA", "306": "GA", "307": "GA", "308": "GA", "309": "GA",
    "310": "GA", "311": "GA", "312": "GA", "313": "GA", "314": "GA",
    "315": "GA", "316": "GA", "317": "GA", "318": "GA", "319": "GA",
    "320": "FL", "321": "FL", "322": "FL", "323": "FL", "324": "FL",
    "325": "FL", "326": "FL", "327": "FL", "328": "FL", "329": "FL",
    "330": "FL", "331": "FL", "332": "FL", "333": "FL", "334": "FL",
    "335": "FL", "336": "FL", "337": "FL", "338": "FL", "339": "FL",
    // Midwest
    "600": "IL", "601": "IL", "602": "IL", "603": "IL", "604": "IL",
    "605": "IL", "606": "IL", "607": "IL", "608": "IL", "609": "IL",
    "610": "IL", "611": "IL", "612": "IL", "613": "IL", "614": "IL",
    "615": "IL", "616": "IL", "617": "IL", "618": "IL", "619": "IL",
    "620": "IL", "621": "IL", "622": "IL", "623": "IL", "624": "IL",
    "625": "IL", "626": "IL", "627": "IL", "628": "IL", "629": "IL",
    // Texas
    "750": "TX", "751": "TX", "752": "TX", "753": "TX", "754": "TX",
    "755": "TX", "756": "TX", "757": "TX", "758": "TX", "759": "TX",
    "760": "TX", "761": "TX", "762": "TX", "763": "TX", "764": "TX",
    "765": "TX", "766": "TX", "767": "TX", "768": "TX", "769": "TX",
    "770": "TX", "771": "TX", "772": "TX", "773": "TX", "774": "TX",
    "775": "TX", "776": "TX", "777": "TX", "778": "TX", "779": "TX",
    "780": "TX", "781": "TX", "782": "TX", "783": "TX", "784": "TX",
    "785": "TX", "786": "TX", "787": "TX", "788": "TX", "789": "TX",
    "790": "TX", "791": "TX", "792": "TX", "793": "TX", "794": "TX",
    "795": "TX", "796": "TX", "797": "TX", "798": "TX", "799": "TX",
    // West
    "900": "CA", "901": "CA", "902": "CA", "903": "CA", "904": "CA",
    "905": "CA", "906": "CA", "907": "CA", "908": "CA", "910": "CA",
    "911": "CA", "912": "CA", "913": "CA", "914": "CA", "915": "CA",
    "916": "CA", "917": "CA", "918": "CA", "919": "CA", "920": "CA",
    "921": "CA", "922": "CA", "923": "CA", "924": "CA", "925": "CA",
    "926": "CA", "927": "CA", "928": "CA", "930": "CA", "931": "CA",
    "932": "CA", "933": "CA", "934": "CA", "935": "CA", "936": "CA",
    "937": "CA", "938": "CA", "939": "CA", "940": "CA", "941": "CA",
    "942": "CA", "943": "CA", "944": "CA", "945": "CA", "946": "CA",
    "947": "CA", "948": "CA", "949": "CA", "950": "CA", "951": "CA",
    "952": "CA", "953": "CA", "954": "CA", "955": "CA", "956": "CA",
    "957": "CA", "958": "CA", "959": "CA", "960": "CA", "961": "CA",
  };
  
  return zipMap[prefix];
}

/* ============================================================
   Contract Quote Result Types
============================================================ */

export interface ContractQuoteResult {
  loadProfile: {
    baseLoadKW: number;
    peakLoadKW: number;
    energyKWhPerDay: number;
  };
  sizingHints: {
    storageToPeakRatio: number;
    durationHours: number;
    source: string;
  };
  inputsUsed: {
    electricityRate: number;
    demandCharge: number;
    location: {
      state: string;
      zip?: string;
      city?: string;
    };
    industry: string;
    gridMode: GridMode;
  };
}

/* ============================================================
   Core Functions
============================================================ */

/**
 * Run contract quote (Layer A: load profile calculation)
 * 
 * This is the entry point for the TrueQuote™ contract execution pipeline:
 * 1. Resolve industry context (canonical slug, calculator ID, template key)
 * 2. Load template and calculator
 * 3. Validate template ↔ calculator alignment
 * 4. Map answers → calculator inputs
 * 5. Run calculator to get load profile
 * 6. Build pricing freeze snapshot
 * 7. Return quote with TrueQuote™ validation envelope
 */
export function runContractQuote(params: {
  industry: string;
  answers: Record<string, unknown>;
  location?: LocationCard;
  locationIntel?: LocationIntel;
}): ContractQuoteResult & { freeze: PricingFreeze; quote: QuoteOutput; sessionId: string } {
  // Initialize telemetry logger
  let logger: ContractRunLogger | undefined;

  try {
    // 1. Resolve industry context (SSOT — replaces scattered alias maps)
    const ctx = resolveIndustryContext(params.industry);

    // 2. Load template using resolved templateKey
    const tpl = getTemplate(ctx.templateKey);
    if (!tpl) {
      throw {
        code: "STATE",
        message: `No template found for industry "${params.industry}" (templateKey: "${ctx.templateKey}")`,
      };
    }

    // 3. Get calculator contract using resolved calculatorId
    const calc = CALCULATORS_BY_ID[ctx.calculatorId];
    if (!calc) {
      throw {
        code: "STATE",
        message: `No calculator registered for id "${ctx.calculatorId}" (industry: "${params.industry}")`,
      };
    }

    // Initialize logger with context
    logger = new ContractRunLogger(params.industry, tpl.version, ctx.calculatorId);

    // Log start event
    logger.logStart(tpl.questions.length);

    // 3. Validate template vs calculator (hard fail on mismatch)
    //    SKIP validation when industry borrows another industry's template
    //    (e.g., gas_station borrows hotel template but uses gas_station_load_v1 calculator)
    const isBorrowedTemplate = ctx.templateKey !== ctx.canonicalSlug;

    if (!isBorrowedTemplate) {
      const validation = validateTemplateAgainstCalculator(tpl, calc, {
        minQuestions: 16,
        maxQuestions: 18,
      });

      if (!validation.ok) {
        const issues = validation.issues.map((i) => `${i.level}:${i.code}:${i.message}`);

        // Log validation failure
        logger.logValidationFailed(issues);

        const errorMsg = issues.join(" | ");
        throw { code: "VALIDATION", message: `Template validation failed: ${errorMsg}` };
      }
    }

    // 4. Apply mapping (answers → canonical calculator inputs)
    const mappedInputs = applyTemplateMapping(tpl, params.answers);

    // 4a. Bridge: pass raw answers underneath mapped inputs.
    // This ensures legacy curated-schema field names (e.g., "capacity",
    // "uptimeRequirement") are visible to calculator adapters even when
    // the template mapping doesn't reference them. Mapped values win.
    const inputs = { ...params.answers, ...mappedInputs };

    // 5. Run calculator
    const computed = calc.compute(inputs as CalcInputs);

    // 6. Extract load profile (Layer A output)
    const loadProfile = {
      baseLoadKW: computed.baseLoadKW ?? 0,
      peakLoadKW: computed.peakLoadKW ?? 0,
      energyKWhPerDay: computed.energyKWhPerDay ?? 0,
    };

    // ============================================================
    // LOAD PROFILE CONSISTENCY CHECK (TrueQuote validation)
    // ============================================================
    if (import.meta.env.DEV) {
      console.group(`[TrueQuote] Load Profile Consistency: ${tpl.industry}`);
      devLog("Template:", {
        industry: tpl.industry,
        version: tpl.version,
        calculator: tpl.calculator.id,
      });
      devLog("Inputs Used:", inputs);
      devLog("Load Profile:", loadProfile);
      devLog("Duty Cycle:", (computed as Record<string, unknown>).dutyCycle || "not provided");
      devLog(
        "kW Contributors:",
        (computed as Record<string, unknown>).kWContributors || "not provided"
      );

      // Sanity checks
      const warnings: string[] = [];
      if (loadProfile.peakLoadKW === 0) warnings.push("⚠️ Peak load is ZERO");
      if (loadProfile.peakLoadKW < loadProfile.baseLoadKW)
        warnings.push("⚠️ Peak < Base (impossible)");
      if (loadProfile.energyKWhPerDay === 0) warnings.push("⚠️ Daily energy is ZERO");
      if (loadProfile.energyKWhPerDay > loadProfile.peakLoadKW * 24) {
        warnings.push("⚠️ Daily energy > peak×24h (impossible)");
      }

      if (warnings.length > 0) {
        devWarn("Load Profile Sanity Issues:", warnings);
      } else {
        devLog("✅ Load profile passes sanity checks");
      }
      console.groupEnd();
    }

    // 7. Get sizing hints (industry-specific defaults + input-based)
    // ✅ FIX (Feb 14, 2026): Use ctx.sizingDefaults (canonical industry) instead of
    // getSizingDefaults(tpl.industry). When gas_station borrows hotel's template,
    // tpl.industry = "hotel" (hours=4) but gas_station needs hours=2.
    const sizingDefaults = ctx.sizingDefaults ?? getSizingDefaults(ctx.canonicalSlug);
    const sizingHints = {
      storageToPeakRatio: sizingDefaults.ratio,
      durationHours: sizingDefaults.hours,
      source: "industry-default" as const,
    };

    // 8. Collect inputs used for pricing (for audit trail)
    const locationIntel = params.locationIntel;
    const inputsUsed = {
      electricityRate: locationIntel?.utilityRate ?? 0.12,
      demandCharge: locationIntel?.demandCharge ?? 15,
      location: {
        state: params.location?.state ?? "unknown",
        zip: params.location?.postalCode,
        city: params.location?.city,
      },
      // ✅ FIX (Feb 14, 2026): Use canonical slug, not borrowed template industry.
      // gas_station borrowing hotel template should pass "gas-station" to pricing, not "hotel".
      industry: ctx.canonicalSlug.replace(/_/g, "-"),
      gridMode: (params.answers.gridMode as GridMode) ?? "grid_tied",
    };

    // 9. Build pricing freeze (SSOT snapshot)
    const freeze: PricingFreeze = {
      powerMW: loadProfile.peakLoadKW ? loadProfile.peakLoadKW / 1000 : undefined,
      hours: sizingHints.durationHours,
      mwh: loadProfile.energyKWhPerDay ? loadProfile.energyKWhPerDay / 1000 : undefined,
      useCase: ctx.canonicalSlug.replace(/_/g, "-"),
      createdAtISO: nowISO(),
    };

    // 10. Build base quote output (load profile only - no financials yet)
    const computedAny = computed as Record<string, unknown>;
    const quote: QuoteOutput = {
      baseLoadKW: loadProfile.baseLoadKW,
      peakLoadKW: loadProfile.peakLoadKW,
      energyKWhPerDay: loadProfile.energyKWhPerDay,
      storageToPeakRatio: sizingHints.storageToPeakRatio,
      durationHours: sizingHints.durationHours,
      notes: [...(computed.assumptions ?? []), ...(computed.warnings ?? []).map((w) => `⚠️ ${w}`)],
      pricingComplete: false, // Will be set true after Layer B

      // TrueQuote™ validation envelope — persisted for export/audit
      trueQuoteValidation: computed.validation
        ? {
            version: computed.validation.version,
            dutyCycle: computed.validation.dutyCycle,
            kWContributors: computed.validation.kWContributors as
              | Record<string, number>
              | undefined,
            kWContributorsTotalKW: computed.validation.kWContributorsTotalKW,
            kWContributorShares: computed.validation.kWContributorShares,
            assumptions: computed.assumptions,
          }
        : computedAny.kWContributors
          ? {
              version: "v1" as const,
              kWContributors: computedAny.kWContributors as Record<string, number>,
              dutyCycle: computedAny.dutyCycle as number | undefined,
              assumptions: computed.assumptions,
            }
          : undefined,
    };

    // 11. Log success telemetry
    logger.logSuccess({
      baseLoadKW: computed.baseLoadKW,
      peakLoadKW: computed.peakLoadKW,
      energyKWhPerDay: computed.energyKWhPerDay,
      warningsCount: computed.warnings?.length ?? 0,
      assumptionsCount: computed.assumptions?.length ?? 0,
      missingInputs: computed.warnings
        ?.filter((w) => w.toLowerCase().includes("missing"))
        .map((w) => w.split(":")[0].trim()),
    });

    // Log warnings separately if present
    if (computed.warnings && computed.warnings.length > 0) {
      logger.logWarnings(computed.warnings);
    }

    // ============================================================
    // QUOTE SANITY CHECKS (TrueQuote validation)
    // ============================================================
    if (import.meta.env.DEV) {
      const quoteSanityWarnings: string[] = [];

      // Check sizing hints
      if (!sizingHints.storageToPeakRatio || sizingHints.storageToPeakRatio <= 0) {
        quoteSanityWarnings.push("⚠️ Storage-to-peak ratio invalid or zero");
      }
      if (!sizingHints.durationHours || sizingHints.durationHours <= 0) {
        quoteSanityWarnings.push("⚠️ Duration hours invalid or zero");
      }

      // Check pricing inputs
      if (inputsUsed.electricityRate === 0.12) {
        quoteSanityWarnings.push("ℹ️ Using default electricity rate (0.12 $/kWh)");
      }
      if (inputsUsed.demandCharge === 15) {
        quoteSanityWarnings.push("ℹ️ Using default demand charge (15 $/kW)");
      }
      if (inputsUsed.location.state === "unknown") {
        quoteSanityWarnings.push("⚠️ Location unknown - using generic pricing");
      }

      if (quoteSanityWarnings.length > 0) {
        console.group("[TrueQuote] Quote Sanity Warnings");
        quoteSanityWarnings.forEach((w) => devWarn(w));
        devLog("Sizing Hints:", sizingHints);
        devLog("Inputs Used:", inputsUsed);
        console.groupEnd();
      }
    }

    return {
      freeze,
      quote,
      sessionId: logger.getSessionId(),
      // Layer A outputs for Layer B
      loadProfile,
      sizingHints,
      inputsUsed,
    };
  } catch (err) {
    // Log failure telemetry
    if (logger) {
      logger.logFailure({
        code: (err as { code?: string }).code || "UNKNOWN",
        message: (err as { message?: string }).message || "Contract execution failed",
      });
    }

    // Re-throw for caller
    throw err;
  }
}

/**
 * Initial wizard state factory
 * 
 * Returns a clean slate for a new wizard session.
 * Used by:
 * - useWizardV7 hook initialization
 * - RESET_SESSION reducer intent
 */
export function initialState(): WizardState {
  // Initialize Merlin Memory session
  const sessionId = createSessionId();
  merlinMemory.set("session", {
    startedAt: Date.now(),
    stepHistory: [{ step: "location", enteredAt: Date.now() }],
    totalStepsCompleted: 0,
    quoteGenerations: 0,
    addOnChanges: 0,
    lastActiveAt: Date.now(),
  });

  return {
    schemaVersion: "7.0.0",
    sessionId,
    step: "location",
    stepHistory: ["location"],
    isHydrating: false,
    isBusy: false,
    error: null,

    // Step 1: Location
    locationRawInput: "",
    location: null,
    locationIntel: null,
    locationConfirmed: false,

    // Step 1: Business Detection
    businessDraft: { name: "", address: "" },
    business: null,
    businessCard: null,
    businessConfirmed: false,

    // Step 1: Goals
    goals: [],
    goalsConfirmed: false,
    goalsModalRequested: false,

    // Step 2: Industry
    industry: "auto",
    industryLocked: false,
    templateMode: "industry", // Default: use industry template

    // Step 3: Profile
    step3Template: null,
    step3Answers: {},
    step3AnswersMeta: {}, // Provenance tracking
    step3Complete: false,
    // FSM state
    step3Status: "idle",
    step3PartIndex: 0,
    step3DefaultsAppliedParts: [],

    // Step 4: Add-ons
    includeSolar: false,
    includeGenerator: false,
    includeEV: false,
    addOnsConfirmed: false,
    step4AddOns: {
      includeSolar: false,
      solarKW: 0,
      includeGenerator: false,
      generatorKW: 0,
      generatorFuelType: "natural-gas",
      includeWind: false,
      windKW: 0,
    },

    // Pricing (Phase 6: non-blocking)
    pricingStatus: "idle",
    pricingError: null,
    pricingWarnings: [],
    pricingRequestKey: null,
    pricingUpdatedAt: null,
    pricingFreeze: null,
    quote: null,

    // Debug
    debug: {
      lastAction: undefined,
      lastTransition: undefined,
      lastApi: undefined,
      notes: ["Initial state created."],
    },
  };
}

/**
 * Main wizard reducer
 * 
 * Handles 44 intent types across all wizard steps:
 * - Hydration (3 intents)
 * - Session management (5 intents)
 * - Location (5 intents)
 * - Goals (4 intents)
 * - Business (4 intents)
 * - Industry (1 intent)
 * - Step 3 (9 intents + 6 FSM intents)
 * - Step 4 Add-ons (4 intents)
 * - Pricing (5 intents)
 * - Debug (2 intents)
 * 
 * Total: 716 lines, 44 intent types
 */
export function reduce(state: WizardState, intent: Intent): WizardState {
  switch (intent.type) {
    case "HYDRATE_START":
      return { ...state, isHydrating: true, error: null };

    case "HYDRATE_SUCCESS":
      return {
        ...state,
        ...intent.payload,
        isHydrating: false,
        debug: { ...state.debug, notes: [...state.debug.notes, "Hydrate success."] },
      };

    case "HYDRATE_FAIL":
      return { ...state, isHydrating: false, error: intent.error };

    case "SET_BUSY":
      return { ...state, isBusy: intent.isBusy, busyLabel: intent.busyLabel };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_ERROR":
      return { ...state, error: intent.error };

    case "SET_STEP": {
      const prev = state.step;
      const next = intent.step;
      const reason = intent.reason || "unknown";

      // Diagnostic log (Step3→Step4 root cause analysis)
      devLog("[Wizard] step transition", { from: prev, to: next, reason });

      return {
        ...state,
        step: intent.step,
        debug: { ...state.debug, lastTransition: `${prev} → ${next} (${reason})` },
      };
    }

    case "PUSH_HISTORY": {
      const prev = state.stepHistory[state.stepHistory.length - 1];
      if (prev === intent.step) return state;
      return { ...state, stepHistory: [...state.stepHistory, intent.step] };
    }

    case "RESET_SESSION":
      return {
        ...initialState(),
        sessionId: intent.sessionId,
        isHydrating: false,
        debug: {
          lastAction: "RESET_SESSION",
          lastTransition: undefined,
          lastApi: undefined,
          notes: ["Session reset."],
        },
      };

    case "SET_LOCATION_RAW": {
      const raw = intent.value;
      const digits = raw.replace(/\D/g, "").slice(0, 5);
      // ✅ FIX Feb 7, 2026: When user types a pure 5-digit ZIP, pre-populate a minimal
      // location card with postalCode + state. This ensures state.location.postalCode is
      // available immediately for gates, persistence, and downstream services.
      // NOTE: This does NOT trigger the full downstream reset that SET_LOCATION does.
      const isPureZipInput = /^\d{3,10}$/.test(raw.trim());
      if (isPureZipInput && digits.length === 5) {
        const stateCode = getStateFromZipPrefix(digits);
        // ✅ FIX Feb 11: Edit-clears-confirmation behavior
        // When user types a NEW ZIP that differs from confirmed ZIP, clear confirmation
        const confirmedZip = state.location?.postalCode || "";
        const zipChanged = digits !== confirmedZip;
        return {
          ...state,
          locationRawInput: raw,
          location: {
            ...(state.location ?? { formattedAddress: digits }),
            postalCode: digits,
            ...(stateCode && !state.location?.state ? { state: stateCode } : {}),
          } as LocationCard,
          // Clear confirmation ONLY if ZIP changed
          locationConfirmed: zipChanged ? false : state.locationConfirmed,
        };
      }
      // For incomplete ZIPs or text input, just update raw input (don't change confirmation)
      return { ...state, locationRawInput: raw };
    }

    case "SET_LOCATION":
      // ✅ FIX Jan 31: ALWAYS reset downstream when setting a location (prevents stale intel/template)
      // If location is null, we're clearing; if it's set, we're changing - either way, reset downstream
      return {
        ...state,
        location: intent.location,
        // Always clear downstream to prevent stale data
        locationIntel: null,
        industry: "auto",
        industryLocked: false,
        step3Template: null,
        step3Answers: {},
        step3AnswersMeta: {}, // Clear provenance on location change
        step3Complete: false,
        // Reset FSM
        step3Status: "idle",
        step3PartIndex: 0,
        step3DefaultsAppliedParts: [],
        pricingFreeze: null,
        quote: null,
      };

    case "SET_LOCATION_INTEL":
      return { ...state, locationIntel: intent.intel };

    case "PATCH_LOCATION_INTEL":
      return {
        ...state,
        locationIntel: {
          ...(state.locationIntel ?? {}),
          ...intent.patch,
          updatedAt: Date.now(),
        },
      };

    case "SET_LOCATION_CONFIRMED":
      return { ...state, locationConfirmed: intent.confirmed };

    case "SET_GOALS":
      return { ...state, goals: intent.goals };

    case "TOGGLE_GOAL": {
      const hasGoal = state.goals.includes(intent.goal);
      const newGoals = hasGoal
        ? state.goals.filter((g) => g !== intent.goal)
        : [...state.goals, intent.goal];
      return { ...state, goals: newGoals };
    }

    case "REQUEST_GOALS_MODAL":
      return { ...state, goalsModalRequested: true };

    case "SET_GOALS_CONFIRMED": {
      const goalsConfirmed = intent.confirmed;

      // ✅ FIX Feb 12: Business is auto-confirmed on search, so no businessPending gate needed
      const onLocationStep = state.step === "location";
      const locationReady = state.locationConfirmed === true;

      // Advance when goals confirmed + location ready
      const canAdvance = goalsConfirmed && onLocationStep && locationReady;

      // ✅ FIX Feb 11: Skip industry step when already locked AND template is loaded
      // Goals inform the wizard, they don't instruct it — routing is based on industry detection
      const skipIndustry =
        canAdvance &&
        state.industryLocked &&
        !!state.industry &&
        state.industry !== "auto" &&
        !!state.step3Template; // Safety: template must be loaded before skipping to profile

      const nextStep = canAdvance ? (skipIndustry ? "profile" : "industry") : state.step;

      return {
        ...state,
        goalsConfirmed,
        goalsModalRequested: false, // clear the request
        step: nextStep,
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            goalsConfirmed
              ? canAdvance
                ? skipIndustry
                  ? "Goals confirmed - skipping industry (locked) → profile"
                  : "Goals confirmed - advancing to industry step"
                : "Goals confirmed - waiting for location"
              : "Goals skipped",
          ],
        },
      };
    }

    case "TOGGLE_SOLAR":
      return { ...state, includeSolar: !state.includeSolar };

    case "SET_SOLAR_SIZING":
      return {
        ...state,
        includeSolar: intent.solarKW > 0,
        step4AddOns: {
          ...state.step4AddOns,
          includeSolar: intent.solarKW > 0,
          solarKW: intent.solarKW,
        },
      };

    case "TOGGLE_GENERATOR":
      return { ...state, includeGenerator: !state.includeGenerator };

    case "TOGGLE_EV":
      return { ...state, includeEV: !state.includeEV };

    case "SET_ADDONS_CONFIRMED":
      return { ...state, addOnsConfirmed: intent.confirmed };

    case "SET_BUSINESS_DRAFT":
      return {
        ...state,
        businessDraft: {
          ...state.businessDraft,
          ...intent.patch,
        },
        // Reset confirmation when draft changes
        businessConfirmed: false,
      };

    case "SET_BUSINESS":
      return {
        ...state,
        business: intent.business,
        businessCard: intent.business, // Keep legacy alias in sync
        businessConfirmed: false, // Reset confirmation when business changes
      };

    case "SET_BUSINESS_CARD":
      return {
        ...state,
        businessCard: intent.card ? { ...intent.card, resolvedAt: Date.now() } : null,
        business: intent.card ? { ...intent.card, resolvedAt: Date.now() } : null, // Keep in sync
        // Reset confirmation when business card changes
        businessConfirmed: false,
      };

    case "SET_BUSINESS_CONFIRMED":
      return {
        ...state,
        businessConfirmed: intent.confirmed,
      };

    case "SET_INDUSTRY":
      return {
        ...state,
        industry: intent.industry,
        industryLocked: typeof intent.locked === "boolean" ? intent.locked : state.industryLocked,
      };

    case "SET_STEP3_TEMPLATE":
      return { ...state, step3Template: intent.template };

    case "SET_TEMPLATE_MODE":
      return { ...state, templateMode: intent.mode };

    case "SET_STEP3_ANSWER": {
      // Single answer mutation with provenance tracking
      const source = intent.source ?? "user"; // Default to "user" if not specified
      const ts = nowISO();
      const prevValue = state.step3Answers[intent.id];

      return {
        ...state,
        step3Answers: { ...state.step3Answers, [intent.id]: intent.value },
        step3AnswersMeta: {
          ...state.step3AnswersMeta,
          [intent.id]: {
            source,
            at: ts,
            prev: prevValue,
          },
        },
      };
    }

    case "SET_STEP3_ANSWERS": {
      // Bulk answer replacement with provenance tracking
      // ⚠️ HARDENING: This should ONLY be used for baseline initialization or explicit reset
      // Runtime updates from intel/business MUST use PATCH_STEP3_ANSWERS
      const source = intent.source ?? "template_default";
      const ts = nowISO();

      // Safety check: warn if overwriting user edits (indicates misuse)
      const hasUserEdits = Object.values(state.step3AnswersMeta).some((m) => m.source === "user");
      if (hasUserEdits && source !== "user" && import.meta.env.DEV) {
        devWarn(
          "[V7 SSOT] ⚠️ SET_STEP3_ANSWERS called with existing user edits. " +
            "Consider using PATCH_STEP3_ANSWERS or RESET_STEP3_TO_DEFAULTS instead."
        );
      }

      // Build meta for all keys being set
      const newMeta: Step3AnswersMeta = {};
      for (const id of Object.keys(intent.answers)) {
        newMeta[id] = {
          source,
          at: ts,
          prev: state.step3Answers[id],
        };
      }

      return {
        ...state,
        step3Answers: intent.answers,
        step3AnswersMeta: newMeta, // Replace (not merge) for full resets
      };
    }

    case "PATCH_STEP3_ANSWERS": {
      // Patch (merge) answers WITHOUT stomping user edits
      // Used for intel/detection patches that arrive after initial load
      const source = intent.source;
      const ts = nowISO();

      // Only apply patch for keys that are NOT already "user" sourced
      const patchedAnswers = { ...state.step3Answers };
      const patchedMeta = { ...state.step3AnswersMeta };

      for (const [id, value] of Object.entries(intent.patch)) {
        const existingMeta = state.step3AnswersMeta[id];

        // Skip if user has already touched this field
        if (existingMeta?.source === "user") {
          devLog(`[V7 Provenance] Skipping patch for ${id} - user already edited`);
          continue;
        }

        // Apply the patch
        patchedAnswers[id] = value;
        patchedMeta[id] = {
          source,
          at: ts,
          prev: state.step3Answers[id],
        };
      }

      return {
        ...state,
        step3Answers: patchedAnswers,
        step3AnswersMeta: patchedMeta,
      };
    }

    case "RESET_STEP3_TO_DEFAULTS": {
      // Explicit reset with provenance rewrite (user requested "reset to defaults")
      // This DOES overwrite user values because user explicitly asked for it
      const template = state.step3Template;
      if (!template) return state;

      const ts = nowISO();
      const resetAnswers: Step3Answers = {};
      const resetMeta: Step3AnswersMeta = {};

      // Determine which question IDs to reset
      let questionIdsToReset: string[];
      if (intent.scope === "all") {
        questionIdsToReset = template.questions.map((q) => q.id);
      } else {
        // Reset only questions in the specified part
        // For now, treat partId as a prefix filter (e.g., "part1_" questions)
        // In practice, this should use template.parts structure
        const scopeObj = intent.scope as { partId: string };
        questionIdsToReset = template.questions
          .filter((q) => q.id.startsWith(scopeObj.partId))
          .map((q) => q.id);
      }

      // Apply template.defaults first, then question.defaultValue
      for (const qid of questionIdsToReset) {
        const q = template.questions.find((qu) => qu.id === qid);
        if (!q) continue;

        // Priority: template.defaults > question.defaultValue > undefined
        let value: unknown = undefined;
        let source: AnswerSource = "template_default";

        if (template.defaults && qid in template.defaults) {
          value = template.defaults[qid];
          source = "template_default";
        } else if (q.defaultValue !== undefined) {
          value = q.defaultValue;
          source = "question_default";
        }

        if (value !== undefined) {
          resetAnswers[qid] = value;
          resetMeta[qid] = {
            source,
            at: ts,
            prev: state.step3Answers[qid], // Keep audit trail of what was reset
          };
        }
      }

      // Merge reset values into existing answers (only reset specified scope)
      const finalAnswers =
        intent.scope === "all" ? resetAnswers : { ...state.step3Answers, ...resetAnswers };
      const finalMeta =
        intent.scope === "all" ? resetMeta : { ...state.step3AnswersMeta, ...resetMeta };

      // Clear defaults-applied tracking for reset scope
      let newDefaultsApplied = state.step3DefaultsAppliedParts;
      if (intent.scope === "all") {
        newDefaultsApplied = [];
      } else {
        newDefaultsApplied = state.step3DefaultsAppliedParts.filter(
          (p) => !p.includes((intent.scope as { partId: string }).partId)
        );
      }

      devLog(
        `[V7 FSM] Reset to defaults: scope=${JSON.stringify(intent.scope)}, fields=${Object.keys(resetAnswers).length}`
      );

      return {
        ...state,
        step3Answers: finalAnswers,
        step3AnswersMeta: finalMeta,
        step3DefaultsAppliedParts: newDefaultsApplied,
      };
    }

    case "SET_STEP3_COMPLETE":
      return { ...state, step3Complete: intent.complete };

    case "SUBMIT_STEP3_STARTED":
      return {
        ...state,
        isBusy: true,
        error: null,
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_STARTED",
          notes: ["Submitting Step 3 answers with retry logic"],
        },
      };

    case "SUBMIT_STEP3_SUCCESS":
      devLog("[V7 Reducer] SUBMIT_STEP3_SUCCESS → transitioning step='profile' to step='options'");
      return {
        ...state,
        isBusy: false,
        step3Complete: true,
        step: "options", // Step 3 → Step 4 Options (add-ons)
        // FIX (Feb 11, 2026): Push 'profile' to stepHistory so goBack from Options
        // correctly returns to profile instead of skipping over it
        stepHistory:
          state.stepHistory[state.stepHistory.length - 1] === "profile"
            ? state.stepHistory
            : [...state.stepHistory, "profile"],
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_SUCCESS",
          lastTransition: "profile → options (step3_complete)",
          notes: ["Step 3 submission successful, advanced to options step"],
        },
      };

    case "SUBMIT_STEP3_FAILED":
      return {
        ...state,
        isBusy: false,
        error: {
          code: "UNKNOWN",
          message: intent.error.message,
          detail: { retries: intent.error.retries },
        },
        debug: {
          ...state.debug,
          lastAction: "SUBMIT_STEP3_FAILED",
          notes: [
            `Step 3 submission failed after ${intent.error.retries || 0} retries: ${intent.error.message}`,
          ],
        },
      };

    // ============================================================
    // Step 3 FSM Events
    // ============================================================

    case "STEP3_TEMPLATE_REQUESTED":
      return {
        ...state,
        step3Status: "template_loading",
        debug: { ...state.debug, notes: [...state.debug.notes, "Template load requested"] },
      };

    case "STEP3_TEMPLATE_READY":
      return {
        ...state,
        step3Status: "template_ready",
        debug: {
          ...state.debug,
          notes: [...state.debug.notes, `Template ready: ${intent.templateId}`],
        },
      };

    case "STEP3_DEFAULTS_APPLIED": {
      const key = `${intent.templateId}.${intent.partId}`;
      // Guard: don't re-apply defaults for same template+part
      if (state.step3DefaultsAppliedParts.includes(key)) {
        devLog(`[V7 FSM] Defaults already applied for ${key}, skipping`);
        return state;
      }
      return {
        ...state,
        step3Status: "part_active",
        step3DefaultsAppliedParts: [...state.step3DefaultsAppliedParts, key],
        debug: { ...state.debug, notes: [...state.debug.notes, `Defaults applied: ${key}`] },
      };
    }

    case "STEP3_PART_NEXT": {
      // Guard: can only advance from part_active
      if (state.step3Status !== "part_active") {
        devWarn(`[V7 FSM] Cannot advance part from status: ${state.step3Status}`);
        return state;
      }
      return {
        ...state,
        step3PartIndex: state.step3PartIndex + 1,
        step3Status: "part_active", // Next part becomes active
      };
    }

    case "STEP3_PART_PREV": {
      if (state.step3PartIndex <= 0) return state;
      return {
        ...state,
        step3PartIndex: state.step3PartIndex - 1,
      };
    }

    case "STEP3_PART_SET":
      return {
        ...state,
        step3PartIndex: Math.max(0, intent.index),
      };

    case "STEP3_QUOTE_REQUESTED": {
      // Guard: can only request quote from part_active when on final part
      if (state.step3Status !== "part_active") {
        devWarn(`[V7 FSM] Cannot request quote from status: ${state.step3Status}`);
        return state;
      }
      return {
        ...state,
        step3Status: "quote_generating",
      };
    }

    case "STEP3_QUOTE_DONE":
      return {
        ...state,
        step3Status: "complete",
        step3Complete: true,
      };

    case "STEP3_ERROR":
      return {
        ...state,
        step3Status: "error",
        error: { code: "STATE", message: intent.message },
      };

    // ============================================================
    // Pricing FSM (Phase 6: non-blocking)
    // ============================================================

    case "PRICING_START":
      return {
        ...state,
        pricingStatus: "pending",
        pricingError: null,
        pricingWarnings: [],
        pricingRequestKey: intent.requestKey,
        debug: {
          ...state.debug,
          notes: [...state.debug.notes, `Pricing started: ${intent.requestKey.slice(0, 8)}`],
        },
      };

    case "PRICING_SUCCESS": {
      // STALE-WRITE GUARD: Only accept if requestKey matches current request
      if (state.pricingRequestKey !== intent.requestKey) {
        devWarn(
          `[V7 Pricing] Ignoring stale success: expected ${state.pricingRequestKey?.slice(0, 8)}, got ${intent.requestKey.slice(0, 8)}`
        );
        return {
          ...state,
          debug: {
            ...state.debug,
            notes: [
              ...state.debug.notes,
              `Pricing stale-write blocked: ${intent.requestKey.slice(0, 8)}`,
            ],
          },
        };
      }
      return {
        ...state,
        pricingStatus: "ok",
        pricingFreeze: intent.freeze,
        quote: intent.quote,
        pricingWarnings: intent.warnings,
        pricingError: null,
        pricingUpdatedAt: Date.now(),
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            `Pricing ok: ${intent.warnings.length} warnings (key: ${intent.requestKey.slice(0, 8)})`,
          ],
        },
      };
    }

    case "PRICING_ERROR": {
      // STALE-WRITE GUARD: Only accept if requestKey matches current request
      if (state.pricingRequestKey !== intent.requestKey) {
        devWarn(
          `[V7 Pricing] Ignoring stale error: expected ${state.pricingRequestKey?.slice(0, 8)}, got ${intent.requestKey.slice(0, 8)}`
        );
        return {
          ...state,
          debug: {
            ...state.debug,
            notes: [
              ...state.debug.notes,
              `Pricing stale-error blocked: ${intent.requestKey.slice(0, 8)}`,
            ],
          },
        };
      }

      // Detect timeout errors and use "timed_out" status
      const isTimeout =
        intent.error.toLowerCase().includes("timeout") ||
        intent.error.toLowerCase().includes("timed out") ||
        intent.error.toLowerCase().includes("exceeded");

      return {
        ...state,
        pricingStatus: isTimeout ? "timed_out" : "error",
        pricingError: intent.error,
        pricingUpdatedAt: Date.now(),
        debug: {
          ...state.debug,
          notes: [
            ...state.debug.notes,
            `Pricing ${isTimeout ? "timed_out" : "error"}: ${intent.error} (key: ${intent.requestKey.slice(0, 8)})`,
          ],
        },
      };
    }

    case "PRICING_RETRY":
      return {
        ...state,
        pricingStatus: "idle",
        pricingError: null,
        pricingWarnings: [],
        debug: { ...state.debug, notes: [...state.debug.notes, "Pricing retry requested"] },
      };

    case "SET_STEP4_ADDONS":
      return {
        ...state,
        step4AddOns: intent.addOns,
        debug: { ...state.debug, notes: [...state.debug.notes, "Step 4 add-ons updated"] },
      };

    // Legacy handlers (deprecated, use PRICING_* intents)
    case "SET_PRICING_FREEZE":
      return { ...state, pricingFreeze: intent.freeze };

    case "SET_QUOTE":
      return { ...state, quote: intent.quote };

    case "DEBUG_NOTE":
      return { ...state, debug: { ...state.debug, notes: [...state.debug.notes, intent.note] } };

    case "DEBUG_TAG":
      return {
        ...state,
        debug: {
          ...state.debug,
          lastAction: intent.lastAction ?? state.debug.lastAction,
          lastTransition: intent.lastTransition ?? state.debug.lastTransition,
          lastApi: intent.lastApi ?? state.debug.lastApi,
        },
      };

    default:
      return state;
  }
}

/**
 * Custom hook for wizard state management
 * 
 * Wraps useReducer with initialState and reduce functions.
 * Returns [state, dispatch] tuple.
 */
export function useWizardReducer() {
  return useReducer(reduce, undefined, initialState);
}
