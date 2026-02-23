// src/wizard/v7/hooks/useWizardPricing.ts
/**
 * ============================================================
 * WizardV7 - Pricing Engine Hook
 * ============================================================
 * Extracted from useWizardV7.ts - Op1e-3 (Feb 22, 2026)
 *
 * Responsibilities:
 * - Run non-blocking pricing calculations (Layer A + Layer B)
 * - Generate deterministic request keys for stale-write protection
 * - Merge load profile + financial metrics into QuoteOutput
 * - Handle pricing failures gracefully (never block navigation)
 * - Retry pricing from Results page
 * - Retry template loading for TrueQuote™ upgrade
 * - Exponential backoff retry logic with timeout
 *
 * Architecture (Feb 2026):
 * - Layer A: runContractQuote() → Load profile + sizing hints (physics)
 * - Layer B: runPricingQuote() → Financial metrics (SSOT pricing bridge)
 * - MONOTONIC: ALL financial fields or NONE (never partial populate)
 * - FIRE-AND-FORGET: Pricing failures don't block navigation
 * - WATCHDOG: 15s timeout prevents "pending forever" states
 *
 * Dependencies:
 * - runContractQuote (from useWizardCore)
 * - runPricingQuote, generatePricingSnapshotId (from pricingBridge)
 * - sanityCheckQuote (from pricingSanity)
 * - merlinMemory (for persistence)
 * - wizardAPI (for template loading)
 */

import { useCallback, useRef } from "react";
import { runContractQuote } from "./useWizardCore";
import {
  runPricingQuote,
  generatePricingSnapshotId,
  type PricingConfig,
  type PricingQuoteResult,
} from "@/wizard/v7/pricing/pricingBridge";
import { sanityCheckQuote, type PricingSanity } from "@/wizard/v7/utils/pricingSanity";
import { merlinMemory } from "@/wizard/v7/memory";
import { wizardAPI as api } from "@/wizard/v7/api/wizardAPI";
import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";

// Import types from main hook
import type {
  LocationCard,
  LocationIntel,
  SystemAddOns,
  Step3Template,
  QuoteOutput,
  PricingFreeze,
  ConfidenceLevel,
  Intent,
  IndustrySlug,
} from "./useWizardV7";

/**
 * Hook parameters - all state and callbacks from parent
 */
export interface UseWizardPricingParams {
  // Current state
  industry: IndustrySlug;
  step3Answers: Record<string, unknown>;
  step3AnswersMeta: Record<string, { source?: string }>;
  step3Template: Step3Template | null;
  location: LocationCard | null;
  locationIntel: LocationIntel | null;
  templateMode: "industry" | "fallback";
  step4AddOns: SystemAddOns;

  // Callbacks
  dispatch: (intent: Intent) => void;
  setBusy: (busy: boolean, status?: string) => void;

  // Abort controller ref
  abortRef: React.MutableRefObject<AbortController | null>;
}

/**
 * Hook return type
 */
export interface UseWizardPricingResult {
  runPricingSafe: (args: {
    industry: string;
    answers: Record<string, unknown>;
    location?: LocationCard;
    locationIntel?: LocationIntel;
    addOns?: SystemAddOns;
  }) => Promise<
    { ok: true; freeze: PricingFreeze; quote: QuoteOutput; warnings: string[] } | { ok: false; error: string }
  >;
  retryPricing: () => Promise<
    { ok: true; freeze: PricingFreeze; quote: QuoteOutput; warnings: string[] } | { ok: false; error: string }
  >;
  retryTemplate: () => Promise<void>;
}

/** Pricing timeout (15 seconds) */
const PRICING_TIMEOUT_MS = 15_000;

/**
 * Generate deterministic request key for stale-write protection
 */
function generateRequestKey(args: {
  industry: string;
  answers: Record<string, unknown>;
  location?: LocationCard;
}): string {
  const keyParts = [
    args.industry,
    args.location?.state ?? "unknown",
    args.location?.postalCode ?? "00000",
    JSON.stringify({
      peakDemandKW: args.answers.peakDemandKW,
      monthlyKWh: args.answers.monthlyKWh,
      annualKWh: args.answers.annualKWh,
      gridMode: args.answers.gridMode,
      batteryDuration: args.answers.batteryDuration,
    }),
  ];
  const str = keyParts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `req_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

/**
 * Helper: Timeout wrapper for promises
 */
function withTimeout<T>(fn: () => T | Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Pricing timeout after ${ms}ms`)), ms);
    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then((v) => {
            clearTimeout(timer);
            resolve(v);
          })
          .catch((e) => {
            clearTimeout(timer);
            reject(e);
          });
      } else {
        clearTimeout(timer);
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

/**
 * Helper: Sleep for retry backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper: Exponential backoff retry
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; timeoutMs?: number } = {}
): Promise<T> {
  const { attempts = 3, baseDelayMs = 250, timeoutMs = 9000 } = options;
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      devLog(`[V7 Pricing] Attempt ${i + 1}/${attempts}`);
      return await withTimeout(fn, timeoutMs);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      devWarn(`[V7 Pricing] Attempt ${i + 1} failed:`, lastError.message);

      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        devLog(`[V7 Pricing] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * useWizardPricing Hook
 *
 * Provides pricing calculation and retry logic.
 */
export function useWizardPricing(params: UseWizardPricingParams): UseWizardPricingResult {
  const {
    industry,
    step3Answers,
    step3AnswersMeta,
    step3Template,
    location,
    locationIntel,
    templateMode,
    step4AddOns,
    dispatch,
    setBusy,
    abortRef,
  } = params;

  /**
   * runPricingSafe - Non-blocking pricing with Layer A + Layer B
   *
   * Flow:
   * 1. Generate request key for stale-write protection
   * 2. Dispatch PRICING_START
   * 3. Run Layer A: runContractQuote (load profile)
   * 4. Persist load profile to Merlin Memory
   * 5. Run Layer B: runPricingQuote (financial metrics)
   * 6. Merge outputs into QuoteOutput (MONOTONIC: all or none)
   * 7. Run sanity checks (NaN/Infinity/negative)
   * 8. Dispatch PRICING_SUCCESS or PRICING_ERROR
   * 9. Persist financials to Merlin Memory
   *
   * DOCTRINE:
   * - Pricing failures NEVER block navigation
   * - Bad math becomes warnings, not errors
   * - User can retry from Results page
   * - 15s timeout prevents "pending forever"
   */
  const runPricingSafe = useCallback(
    async (args: {
      industry: string;
      answers: Record<string, unknown>;
      location?: LocationCard;
      locationIntel?: LocationIntel;
      addOns?: SystemAddOns;
    }) => {
      const requestKey = generateRequestKey({
        industry: args.industry,
        answers: args.answers,
        location: args.location,
      });

      dispatch({ type: "PRICING_START", requestKey });
      dispatch({ type: "DEBUG_TAG", lastApi: "runPricingSafe" });

      try {
        // Layer A: Contract quote (physics + load profile)
        const contractResult = await withTimeout(
          () =>
            runContractQuote({
              industry: args.industry,
              answers: args.answers,
              location: args.location,
              locationIntel: args.locationIntel,
            }),
          PRICING_TIMEOUT_MS / 2
        );

        const { freeze, quote: baseQuote, sessionId, loadProfile, sizingHints, inputsUsed } =
          contractResult;

        // Persist load profile immediately (even if Layer B fails)
        merlinMemory.patch("profile", {
          peakLoadKW: loadProfile.peakLoadKW,
          avgLoadKW: loadProfile.baseLoadKW,
          energyKWhPerDay: loadProfile.energyKWhPerDay,
        });

        // Layer B: Pricing bridge (financial metrics)
        let pricingResult: PricingQuoteResult | null = null;
        const allWarnings: string[] = [
          ...(baseQuote.notes?.filter((n) => n.startsWith("⚠️")) ?? []),
        ];

        try {
          const addOns = args.addOns;
          const contractForPricing: import("@/wizard/v7/pricing/pricingBridge").ContractQuoteResult =
            {
              loadProfile,
              sizingHints: {
                ...sizingHints,
                source: sizingHints.source as "industry-default" | "user-config" | "template",
              },
              inputsUsed: {
                electricityRate: inputsUsed.electricityRate,
                demandCharge: inputsUsed.demandCharge,
                location: inputsUsed.location,
                industry: inputsUsed.industry,
                gridMode: inputsUsed.gridMode,
                solarMW:
                  addOns?.includeSolar && addOns.solarKW > 0 ? addOns.solarKW / 1000 : undefined,
                generatorMW:
                  addOns?.includeGenerator && addOns.generatorKW > 0
                    ? addOns.generatorKW / 1000
                    : undefined,
                generatorFuelType: addOns?.includeGenerator ? addOns.generatorFuelType : undefined,
                windMW: addOns?.includeWind && addOns.windKW > 0 ? addOns.windKW / 1000 : undefined,
              },
              assumptions: baseQuote.notes?.filter((n) => !n.startsWith("⚠️")),
              warnings: baseQuote.notes
                ?.filter((n) => n.startsWith("⚠️"))
                .map((n) => n.replace("⚠️ ", "")),
            };

          const snapshotId = generatePricingSnapshotId({
            peakLoadKW: loadProfile.peakLoadKW,
            storageToPeakRatio: sizingHints.storageToPeakRatio,
            durationHours: sizingHints.durationHours,
            industry: inputsUsed.industry,
            state: inputsUsed.location.state,
            electricityRate: inputsUsed.electricityRate,
          });

          const pricingConfig: PricingConfig = {
            snapshotId,
            includeAdvancedAnalysis: true,
            itcBonuses: addOns?.itcBonuses ?? undefined,
          };

          pricingResult = await withTimeout(
            () => runPricingQuote(contractForPricing, pricingConfig),
            PRICING_TIMEOUT_MS / 2
          );

          if (!pricingResult.ok) {
            allWarnings.push(`⚠️ Pricing: ${pricingResult.error ?? "Unknown error"}`);
          }
        } catch (pricingErr) {
          const errMsg =
            (pricingErr as { message?: string })?.message ?? "Pricing calculation failed";
          allWarnings.push(`⚠️ Pricing failed: ${errMsg}`);
          devWarn("[V7 Pricing] Layer B error (non-blocking):", errMsg);
        }

        // Merge Layer A + Layer B (MONOTONIC)
        const inputFallbacks: QuoteOutput["inputFallbacks"] = {};

        if (!args.locationIntel?.utilityRate) {
          inputFallbacks.electricityRate = {
            value: inputsUsed.electricityRate ?? 0,
            reason: "Default rate (no utility data)",
          };
        }
        if (!args.locationIntel?.demandCharge) {
          inputFallbacks.demandCharge = {
            value: inputsUsed.demandCharge ?? 0,
            reason: "Default demand charge (no utility data)",
          };
        }
        if (!args.location?.state) {
          inputFallbacks.location = {
            value: inputsUsed.location.state ?? "unknown",
            reason: "Location not resolved",
          };
        }

        const mergedQuote: QuoteOutput = {
          baseLoadKW: loadProfile.baseLoadKW,
          peakLoadKW: loadProfile.peakLoadKW,
          energyKWhPerDay: loadProfile.energyKWhPerDay,
          storageToPeakRatio: sizingHints.storageToPeakRatio,
          durationHours: sizingHints.durationHours,

          ...(pricingResult?.ok && pricingResult.data
            ? {
                capexUSD: pricingResult.data.capexUSD,
                grossCost: pricingResult.data.grossCost,
                itcAmount: pricingResult.data.itcAmount,
                itcRate: pricingResult.data.itcRate,
                annualSavingsUSD: pricingResult.data.annualSavingsUSD,
                roiYears: pricingResult.data.roiYears,
                npv: pricingResult.data.financials?.npv,
                irr: pricingResult.data.financials?.irr,
                paybackYears: pricingResult.data.financials?.paybackYears,
                demandChargeSavings: (
                  pricingResult.data.financials as Record<string, unknown> | undefined
                )?.demandChargeSavings as number | undefined,
                bessKWh: pricingResult.data.breakdown?.batteries
                  ? pricingResult.data.breakdown.batteries.unitEnergyMWh *
                    pricingResult.data.breakdown.batteries.quantity *
                    1000
                  : undefined,
                bessKW: pricingResult.data.breakdown?.batteries
                  ? pricingResult.data.breakdown.batteries.unitPowerMW *
                    pricingResult.data.breakdown.batteries.quantity *
                    1000
                  : undefined,
                solarKW: pricingResult.data.breakdown?.solar
                  ? pricingResult.data.breakdown.solar.totalMW * 1000
                  : undefined,
                generatorKW: pricingResult.data.breakdown?.generators
                  ? pricingResult.data.breakdown.generators.unitPowerMW *
                    pricingResult.data.breakdown.generators.quantity *
                    1000
                  : undefined,
                equipmentCosts: (() => {
                  const bd = pricingResult.data.breakdown;
                  if (!bd) return undefined;
                  const bessKWh = bd.batteries
                    ? bd.batteries.unitEnergyMWh * bd.batteries.quantity * 1000
                    : 0;
                  const bessKW = bd.batteries
                    ? bd.batteries.unitPowerMW * bd.batteries.quantity * 1000
                    : 0;
                  const gross = pricingResult.data.grossCost;
                  return {
                    batteryCost: bd.batteries?.totalCost,
                    batteryPerKWh:
                      bessKWh > 0 ? Math.round(bd.batteries.totalCost / bessKWh) : undefined,
                    inverterCost: bd.inverters?.totalCost,
                    inverterPerKW:
                      bessKW > 0 ? Math.round(bd.inverters.totalCost / bessKW) : undefined,
                    transformerCost: bd.transformers?.totalCost,
                    switchgearCost: bd.switchgear?.totalCost,
                    solarCost: bd.solar?.totalCost,
                    solarPerWatt: bd.solar?.costPerWatt,
                    generatorCost: bd.generators?.totalCost,
                    generatorPerKW: bd.generators?.costPerKW,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    installationCost: (pricingResult.data as any).financials?.installationCost,
                    totalEquipmentCost: pricingResult.data.baseCost,
                    allInPerKW: bessKW > 0 ? Math.round(gross / bessKW) : undefined,
                    allInPerKWh: bessKWh > 0 ? Math.round(gross / bessKWh) : undefined,
                  };
                })(),
                pricingSnapshotId: pricingResult.data.pricingSnapshotId,
                pricingComplete: true,
                margin: pricingResult.data.margin
                  ? {
                      sellPriceTotal: pricingResult.data.margin.sellPriceTotal,
                      baseCostTotal: pricingResult.data.margin.baseCostTotal,
                      marginDollars: pricingResult.data.margin.marginDollars,
                      marginPercent: pricingResult.data.margin.marginPercent,
                      marginBand: pricingResult.data.margin.marginBand,
                      policyVersion: pricingResult.data.margin.policyVersion,
                      needsReview: pricingResult.data.margin.needsReview,
                      warnings: pricingResult.data.margin.warnings,
                    }
                  : undefined,
                metadata: pricingResult.data.metadata ?? undefined,
              }
            : {
                pricingComplete: false,
              }),

          inputFallbacks: Object.keys(inputFallbacks).length > 0 ? inputFallbacks : undefined,
          trueQuoteValidation: baseQuote.trueQuoteValidation,
          notes: [...(baseQuote.notes?.filter((n) => !n.startsWith("⚠️")) ?? []), ...allWarnings],
        };

        // Confidence scoring
        {
          const template = step3Template;
          const answers = args.answers;
          const meta = step3AnswersMeta;

          const locConf: ConfidenceLevel = args.locationIntel?.utilityRate
            ? "exact"
            : args.location?.state
              ? "regional"
              : "default";

          const industryConf: "v1" | "fallback" =
            (template?.industry as string) === "generic" ||
            (template?._effectiveTemplate as string) === "generic"
              ? "fallback"
              : "v1";

          const totalQs = template?.questions?.length ?? 0;
          const answeredQs = Object.keys(answers).filter(
            (k) => answers[k] != null && answers[k] !== ""
          ).length;
          const profileCompleteness = totalQs > 0 ? Math.round((answeredQs / totalQs) * 100) : 0;

          let defaultsUsed = 0;
          let userInputs = 0;
          for (const key of Object.keys(answers)) {
            const m = meta[key];
            if (m?.source === "user") userInputs++;
            else defaultsUsed++;
          }

          const overall: "high" | "medium" | "low" =
            locConf === "exact" && industryConf === "v1" && profileCompleteness >= 70
              ? "high"
              : locConf !== "default" && profileCompleteness >= 30
                ? "medium"
                : "low";

          mergedQuote.confidence = {
            location: locConf,
            industry: industryConf,
            profileCompleteness,
            defaultsUsed,
            userInputs,
            overall,
          };
        }

        // Sanity check
        const sanity: PricingSanity = sanityCheckQuote(mergedQuote);

        if (sanity.warnings.length > 0) {
          devWarn(
            `[V7 Pricing] Quote has ${sanity.warnings.length} sanity warnings:`,
            sanity.warnings
          );
        }

        const enrichedFreeze: PricingFreeze = {
          ...freeze,
          hours: sizingHints.durationHours,
          solarMWp: mergedQuote.solarKW ? mergedQuote.solarKW / 1000 : undefined,
          generatorMW: mergedQuote.generatorKW ? mergedQuote.generatorKW / 1000 : undefined,
        };

        dispatch({
          type: "PRICING_SUCCESS",
          freeze: enrichedFreeze,
          quote: mergedQuote,
          warnings: [...allWarnings, ...sanity.warnings],
          requestKey,
        });

        dispatch({
          type: "DEBUG_NOTE",
          note: `Pricing ok: sessionId=${sessionId}, pricingComplete=${mergedQuote.pricingComplete}, key=${requestKey.slice(0, 8)}`,
        });

        // Persist to Merlin Memory
        if (pricingResult?.ok && pricingResult.data) {
          const pd = pricingResult.data;
          const fin = pd.financials;

          merlinMemory.set("financials", {
            equipmentCost: pd.breakdown?.batteries
              ? Object.values(pd.breakdown).reduce(
                  (sum, eq) => sum + ((eq as { totalCost?: number })?.totalCost ?? 0),
                  0
                )
              : pd.capexUSD,
            installationCost: 0,
            totalProjectCost: pd.grossCost,
            taxCredit: pd.itcAmount,
            netCost: pd.capexUSD,
            annualSavings: pd.annualSavingsUSD,
            demandChargeSavings: mergedQuote.demandChargeSavings,
            paybackYears: pd.roiYears,
            roi10Year: fin?.roi10Year ?? 0,
            roi25Year: fin?.roi25Year ?? 0,
            npv: fin?.npv ?? 0,
            irr: fin?.irr ?? 0,
            itcRate: pd.itcRate,
            itcAmount: pd.itcAmount,
            pricingSnapshotId: pd.pricingSnapshotId,
            calculatedAt: Date.now(),
          });

          const session = merlinMemory.get("session");
          if (session) {
            merlinMemory.patch("session", {
              quoteGenerations: (session.quoteGenerations ?? 0) + 1,
              lastActiveAt: Date.now(),
            });
          }
        }

        return {
          ok: true as const,
          freeze: enrichedFreeze,
          quote: mergedQuote,
          warnings: [...allWarnings, ...sanity.warnings],
        };
      } catch (err: unknown) {
        const errMsg = (err as { message?: string })?.message ?? "Pricing calculation failed";
        devError("[V7 Pricing] Error:", errMsg, err);
        dispatch({ type: "PRICING_ERROR", error: errMsg, requestKey });
        return { ok: false as const, error: errMsg };
      }
    },
    [dispatch, step3Template, step3AnswersMeta]
  );

  /**
   * retryPricing - Retry from Results page
   */
  const retryPricing = useCallback(async () => {
    if (industry === "auto") {
      devWarn("[V7 Pricing] Cannot retry: industry not set");
      return { ok: false as const, error: "Industry not set" };
    }
    dispatch({ type: "PRICING_RETRY" });
    return runPricingSafe({
      industry,
      answers: step3Answers,
      location: location ?? undefined,
      locationIntel: locationIntel ?? undefined,
      addOns: step4AddOns,
    });
  }, [runPricingSafe, industry, step3Answers, location, locationIntel, step4AddOns, dispatch]);

  /**
   * retryTemplate - Upgrade from fallback to industry template
   */
  const retryTemplate = useCallback(async () => {
    if (industry === "auto") {
      devWarn("[V7 Pricing] Cannot retry template: industry not set");
      return;
    }
    if (templateMode === "industry") {
      devLog("[V7 Pricing] Already have industry template");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setBusy(true, "Retrying industry template...");
      const template = await api.loadStep3Template(industry, controller.signal);
      dispatch({ type: "SET_STEP3_TEMPLATE", template });
      dispatch({
        type: "SET_TEMPLATE_MODE",
        mode: (template.industry as string) === "generic" ? "fallback" : "industry",
      });

      const { answers: baselineAnswers } = api.computeSmartDefaults(template, null, null);
      const patch: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(baselineAnswers)) {
        if (step3Answers[key] == null || step3Answers[key] === "") {
          patch[key] = val;
        }
      }
      if (Object.keys(patch).length > 0) {
        dispatch({ type: "PATCH_STEP3_ANSWERS", patch, source: "template_default" });
      }

      devLog(
        "[V7 Pricing] Template retry result:",
        (template.industry as string) === "generic" ? "fallback" : "industry"
      );
    } catch (err) {
      devWarn("[V7 Pricing] Template retry failed:", err instanceof Error ? err.message : err);
    } finally {
      setBusy(false);
    }
  }, [industry, templateMode, step3Answers, setBusy, dispatch, abortRef]);

  return { runPricingSafe, retryPricing, retryTemplate };
}
