/**
 * @fileoverview runContractQuote — TrueQuote™ Layer A contract execution
 *
 * Extracted from useWizardCore.ts (Op13 - Feb 2026)
 */

import type {
  PricingFreeze,
  QuoteOutput,
  LocationCard,
  LocationIntel,
  GridMode,
} from "./useWizardV7";
import { devLog, devWarn } from "@/wizard/v7/debug/devLog";
import { getTemplate } from "@/wizard/v7/templates/templateIndex";
import { applyTemplateMapping } from "@/wizard/v7/templates/applyMapping";
import { CALCULATORS_BY_ID } from "@/wizard/v7/calculators/registry";
import type { CalcInputs } from "@/wizard/v7/calculators/contract";
import { resolveIndustryContext } from "@/wizard/v7/industry/resolveIndustryContext";
import { getSizingDefaults } from "@/wizard/v7/pricing/pricingBridge";
import { validateTemplateAgainstCalculator } from "@/wizard/v7/templates/validator";
import { ContractRunLogger } from "@/wizard/v7/telemetry/contractTelemetry";

function nowISO(): string {
  return new Date().toISOString();
}

/* ============================================================
   Contract Quote Result Types + Runner (extracted from useWizardCore)
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
