/**
 * Step 3: Facility Details (V7) — Full-Screen Questionnaire
 *
 * Architecture (Jan 24, 2026 - Full-Screen Design):
 * - Compact top bar: Industry + Progress + Collapsible metrics toggle
 * - Full-width questionnaire: Maximum space for input fields
 * - Optional metrics panel: Toggle to show live calculations
 * - Wraps Step3Integration.tsx (SSOT for data integrity)
 * - Wraps CompleteStep3Component.tsx (database-driven questionnaire)
 *
 * Removed 2-column split layout per Vineet's recommendation.
 * Users get full screen real estate for the questionnaire.
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Step3Integration } from "../../Step3Integration";
import { getDeviationFlags, type DeviationFlag } from "@/services/templates";

interface LocationIntel {
  peakSunHours: number | null;
  utilityRate: number | null;
  weatherRisk: "Low" | "Med" | "High" | string | null;
  solarGrade: string | null;
  riskDrivers: string[];
  sourceLabel?: string;
}

/**
 * NOTE:
 * If you already have a shared PricingConfig type elsewhere, replace `unknown` with that import.
 * Keeping as unknown here avoids TS build breaks if your pricing types are currently in flux.
 */
type PricingConfig = unknown;
type PricingStatus = "idle" | "loading" | "ready" | "fallback";

interface Step3DetailsV7Props {
  industry: string | null;
  location: {
    zipCode: string;
    businessName: string;
    state?: string;
    city?: string;
    business?: {
      name: string;
      industrySlug?: string;
    };
  } | null;
  locationIntel?: LocationIntel;
  answers: Record<string, unknown>;
  setAnswers: (answers: Record<string, unknown>) => void;
  onComplete: () => void;
  onBack: () => void;

  // ✅ Pricing freeze (from useWizardV7)
  pricingConfig: PricingConfig | null;
  pricingStatus: PricingStatus;
}

// Industry-specific icons
const INDUSTRY_ICONS: Record<string, string> = {
  'car-wash': '🚗',
  'hotel': '🏨',
  'office': '🏢',
  'hospital': '🏥',
  'data-center': '💾',
  'manufacturing': '🏭',
  'ev-charging': '⚡',
  'retail': '🛒',
  'restaurant': '🍽️',
  'warehouse': '📦',
  'apartment': '🏘️',
  'college': '🎓',
  'airport': '✈️',
  'gas-station': '⛽',
  'casino': '🎰',
  'cold-storage': '❄️',
};

function StepLoadingCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Compact top bar skeleton */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-900/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-6 w-40 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="flex-1 max-w-md h-2 rounded-full bg-white/5 animate-pulse" />
          <div className="h-8 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Full-width questionnaire skeleton */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xl font-semibold text-white">{title}</div>
            {subtitle && (
              <div className="text-sm text-slate-300 mt-2">{subtitle}</div>
            )}
            <div className="mt-6 space-y-4">
              <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step3DetailsV7({
  industry,
  location,
  locationIntel,
  answers,
  setAnswers,
  onComplete,
  onBack,
  pricingConfig,
  pricingStatus,
}: Step3DetailsV7Props) {
  const [liveMetrics, setLiveMetrics] = useState<{
    peakDemandKW?: number;
    dailyKWh?: number;
    recommendedBESSKW?: number;
    recommendedBESSKWh?: number;
    estimatedSavings?: number;
    confidence?: number;
  } | null>(null);

  // ✅ Template state: V7 must persist template that CompleteStep3Component loads from DB
  // Without this, template is "loaded" but dropped on the floor by updateState handler
  const [step3Template, setStep3Template] = useState<any>(null);

  const [questionCount, setQuestionCount] = useState({ answered: 0, total: 0 });
  const [dbError, setDbError] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ HOOKS ORDER FIX: Declare all useState before any early returns
  const [showMetrics, setShowMetrics] = useState(false);

  // Calculate progress (moved above early return to avoid conditional hook call)
  useEffect(() => {
    const answered = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
    setQuestionCount(prev => ({ answered, total: prev.total || 16 }));
  }, [answers]);

  // ✅ Pricing snapshot: freeze identity at first ready/fallback
  const [pricingSnapshot, setPricingSnapshot] = useState<PricingConfig | null>(
    null
  );

  useEffect(() => {
    const ok = pricingStatus === "ready" || pricingStatus === "fallback";
    if (!pricingSnapshot && ok && pricingConfig) {
      setPricingSnapshot(pricingConfig);
    }
  }, [pricingSnapshot, pricingStatus, pricingConfig]);

  const pricing = pricingSnapshot ?? pricingConfig;
  const isPricingLoading =
    pricingStatus === "idle" || pricingStatus === "loading";

  // ✅ DEBUG: Log pricing status transitions to diagnose stuck loading
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Step3] pricing:", { pricingStatus, hasConfig: !!pricingConfig, hasSnapshot: !!pricingSnapshot });
    }
  }, [pricingStatus, pricingConfig, pricingSnapshot]);

  // ✅ WIRING DOCTRINE: Normalize industry slug in one place before Step 3
  // Prevents drift between template keys, calculator keys, and display names
  function normalizeIndustrySlug(raw: string | null | undefined): string {
    if (!raw) return "office";
    const s = raw.toLowerCase().trim();
    // Allow "Car Wash" → "car-wash", "Hotel_Motel" → "hotel-motel"
    return s.replace(/[\s_]+/g, "-");
  }

  // ✅ HOOKS RULE: Compute industrySlug BEFORE early return (used by useMemo below)
  const industrySlug = normalizeIndustrySlug(industry || location?.business?.industrySlug);

  // ============================================================================
  // CONFIDENCE SCORING (merged: completeness + calculator + template boost)
  // ✅ MOVED ABOVE GATE to fix React Hooks order error
  // ============================================================================

  // Base completeness score (0-100)
  const completeness = questionCount.total > 0 
    ? Math.round((questionCount.answered / questionCount.total) * 100)
    : 0;

  // Calculator confidence (0-1 scale, converted to 0-100)
  const calcConfidence = liveMetrics?.confidence != null 
    ? Math.round(liveMetrics.confidence * 100) 
    : null;

  // Template boost: small bounded bonus if template is present
  const templateBoost = step3Template ? 10 : 0;

  // Merged confidence formula (no useMemo needed - cheap computation)
  const confidenceScore = calcConfidence != null
    ? Math.min(100, Math.round((0.6 * completeness) + (0.4 * calcConfidence) + templateBoost))
    : Math.min(100, completeness + templateBoost);

  const confidenceLabel = confidenceScore >= 80 ? 'High' : confidenceScore >= 50 ? 'Medium' : 'Low';
  const confidenceColor = confidenceScore >= 80 ? '#22c55e' : confidenceScore >= 50 ? '#f59e0b' : '#ef4444';

  // ============================================================================
  // DEVIATION FLAGS (non-blocking warnings)
  // ✅ MOVED ABOVE GATE to fix React Hooks order error
  // ============================================================================
  const deviationFlags: DeviationFlag[] = useMemo(() => {
    if (!step3Template || Object.keys(answers).length < 3) return [];
    return getDeviationFlags(industrySlug, answers, step3Template);
  }, [industrySlug, answers, step3Template]);

  // HARD GATE: Step 3+ does not render questionnaire or metrics until pricing is frozen
  if (isPricingLoading) {
    return (
      <StepLoadingCard
        title="Locking pricing..."
        subtitle="Freezing quote assumptions for this session"
      />
    );
  }

  // Get industry icon (slug already computed above)
  const industryIcon = INDUSTRY_ICONS[industrySlug] || '🏢';
  
  // Industry display names
  const industryNames: Record<string, string> = {
    'car-wash': 'Car Wash',
    'hotel': 'Hotel',
    'office': 'Office Building',
    'hospital': 'Hospital',
    'data-center': 'Data Center',
    'manufacturing': 'Manufacturing Facility',
    'ev-charging': 'EV Charging Station',
    'retail': 'Retail Store',
    'restaurant': 'Restaurant',
    'warehouse': 'Warehouse',
    'apartment': 'Apartment Complex',
    'college': 'College/University',
    'airport': 'Airport',
    'gas-station': 'Gas Station',
    'casino': 'Casino',
    'cold-storage': 'Cold Storage',
  };
  const industryName = industryNames[industrySlug] || 'Commercial Facility';

  const pricingBadge =
    pricingStatus === "ready" ? (
      <span className="text-[11px] px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
        ✅ Pricing locked
      </span>
    ) : (
      <span className="text-[11px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
        ⚠️ Using default pricing (estimate)
      </span>
    );

  // Handle updates from Step3Integration (live calculations)
  const handleAnswersUpdate = (newAnswers: Record<string, unknown>, metrics?: any) => {
    try {
      setAnswers(newAnswers);
      
      // Update live metrics if provided
      if (metrics) {
        setLiveMetrics({
          peakDemandKW: metrics.peakKW || metrics.peakDemandKW,
          dailyKWh: metrics.dailyKWh,
          recommendedBESSKW: metrics.bessKW || metrics.recommendedBESSKW,
          recommendedBESSKWh: metrics.bessKWh || metrics.recommendedBESSKWh,
          estimatedSavings: metrics.annualSavings || metrics.estimatedSavings,
          confidence: metrics.confidence,
        });
      }
      
      // Clear error if successful
      if (dbError) setDbError(null);
    } catch (error) {
      console.error('Error updating answers:', error);
      setDbError(error instanceof Error ? error.message : 'Failed to update questionnaire');
    }
  };

  // ---- TrueQuote Proof CTA (fires window event - no prop threading) ----
  const openTrueQuoteProof = () => {
    const payload: Partial<import("@/components/shared/TrueQuoteModal").TrueQuoteProofPayload> = {
      industry: industrySlug,

      location: {
        zipCode: location?.zipCode,
        city: location?.city,
        state: location?.state,
        region: location?.state ? `${location.state}` : undefined,
      },

      business: {
        name: location?.business?.name || location?.businessName || industryName,
        address:
          location?.city && location?.state
            ? `${location.city}, ${location.state}`
            : location?.zipCode || undefined,
        category: industryName,
      },

      locationIntel: {
        peakSunHours: locationIntel?.peakSunHours ?? null,
        utilityRate: locationIntel?.utilityRate ?? null,
        weatherRisk: (locationIntel?.weatherRisk as "Low" | "Med" | "High" | null) ?? null,
        solarGrade: locationIntel?.solarGrade ?? null,
        riskDrivers: locationIntel?.riskDrivers || [],
      },

      outputs: {
        // Step 3 live metrics (what the user cares about)
        peakDemandKW: liveMetrics?.peakDemandKW ?? null,
        dailyKWh: liveMetrics?.dailyKWh ?? null,
        recommendedBESSKW: liveMetrics?.recommendedBESSKW ?? null,
        recommendedBESSKWh: liveMetrics?.recommendedBESSKWh ?? null,
        estimatedAnnualSavings: liveMetrics?.estimatedSavings ?? null,
        confidenceScore,
        confidenceLabel,
        pricingStatus,
      },

      assumptions: [
        { label: "Pricing mode", value: pricingStatus === "ready" ? "Locked" : "Default (Estimate)" },
        ...(locationIntel?.utilityRate != null
          ? [{ label: "Utility rate", value: `$${Number(locationIntel.utilityRate).toFixed(2)}/kWh` }]
          : []),
        ...(locationIntel?.peakSunHours != null
          ? [{ label: "Peak sun hours", value: `${Number(locationIntel.peakSunHours).toFixed(1)} hrs/day` }]
          : []),
      ],
    };

    window.dispatchEvent(
      new CustomEvent("truequote:open", {
        detail: { mode: "proof", payload },
      })
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* COMPACT TOP BAR - Industry + Progress + Metrics Toggle */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Industry badge */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{industryIcon}</span>
              <div>
                <div className="text-lg font-semibold text-white">{industryName}</div>
                <div className="text-sm text-slate-400">
                  {location?.business?.name || location?.businessName || location?.city || 'Your facility'}
                </div>
              </div>
            </div>

            {/* Center: Progress bar */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                      style={{ width: `${confidenceScore}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
                  {questionCount.answered}/{questionCount.total}
                </span>
              </div>
            </div>

            {/* Right: Status badges + metrics toggle */}
            <div className="flex items-center gap-3">
              {pricingBadge}
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  showMetrics 
                    ? "bg-purple-600 text-white" 
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                ].join(" ")}
              >
                {showMetrics ? "Hide Metrics" : "Show Metrics"}
              </button>
            </div>
          </div>

          {/* Collapsible Metrics Row */}
          {showMetrics && liveMetrics && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-4 gap-4">
                {liveMetrics.peakDemandKW && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-orange-300 mb-1">Peak Demand</div>
                    <div className="text-xl font-bold text-orange-400">
                      {Math.round(liveMetrics.peakDemandKW).toLocaleString()} kW
                    </div>
                  </div>
                )}
                {liveMetrics.dailyKWh && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-blue-300 mb-1">Daily Use</div>
                    <div className="text-xl font-bold text-blue-400">
                      {Math.round(liveMetrics.dailyKWh).toLocaleString()} kWh
                    </div>
                  </div>
                )}
                {liveMetrics.recommendedBESSKW && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-purple-300 mb-1">Recommended BESS</div>
                    <div className="text-xl font-bold text-purple-400">
                      {Math.round(liveMetrics.recommendedBESSKW)} kW
                    </div>
                  </div>
                )}
                {liveMetrics.estimatedSavings && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-emerald-300 mb-1">Est. Savings</div>
                    <div className="text-xl font-bold text-emerald-400">
                      ${Math.round(liveMetrics.estimatedSavings / 1000)}k/yr
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL-WIDTH QUESTIONNAIRE */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Deviation Flags (if any) */}
          {deviationFlags.length > 0 && (
            <div className="mb-6 space-y-2">
              {deviationFlags.map((flag) => (
                <div
                  key={flag.code}
                  className={[
                    "rounded-xl border px-4 py-3 flex items-start gap-3",
                    flag.severity === "warning"
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-blue-500/30 bg-blue-500/10",
                  ].join(" ")}
                >
                  <span className="text-lg">⚠️</span>
                  <div>
                    <div className={[
                      "text-sm font-semibold",
                      flag.severity === "warning" ? "text-amber-300" : "text-blue-300",
                    ].join(" ")}>
                      {flag.label}
                    </div>
                    <div className="text-xs text-slate-300">{flag.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error display */}
          {dbError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <div className="text-lg font-semibold text-red-300 mb-2">Database Connection Issue</div>
              <div className="text-sm text-slate-300">{dbError}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          ) : (
            /* Step3Integration handles all question rendering and calculations */
            <Step3Integration
              state={{
                industry: industrySlug,
                useCaseData: {
                  inputs: answers,
                  template: step3Template,  // ✅ Pass persisted template back in
                },

                // ✅ Pricing freeze passed into SSOT state (no DB reads inside Step 3+)
                pricingConfig: pricing,
                pricingStatus,
              }}
              updateState={(updates: any) => {
                // ✅ WIRING DOCTRINE: Invariant guard - make bad update shapes loud, not silent
                const inputs = updates?.useCaseData?.inputs;
                const metrics = updates?.useCaseData?.industryMetrics;
                const template = updates?.useCaseData?.template;

                // ✅ CRITICAL: Persist template in V7 layer so it survives re-renders
                // Without this, template loaded by CompleteStep3Component is dropped
                // ✅ HARDENED: Use fingerprint to detect both identity churn AND stale template swaps
                if (template) {
                  setStep3Template((prev: any) => {
                    // Build fingerprints for comparison
                    const getFingerprint = (t: any) => {
                      if (!t) return null;
                      // ✅ Full loadProfile hash (catches any profile field change)
                      const loadProfileHash = t.loadProfile
                        ? JSON.stringify({
                            baseline_kw: t.loadProfile.baseline_kw,
                            peak_kw: t.loadProfile.peak_kw,
                            diversity_factor: t.loadProfile.diversity_factor,
                            duty_cycle_hint: t.loadProfile.duty_cycle_hint,
                          })
                        : null;
                      return JSON.stringify({
                        id: t.id || t.useCaseId,
                        slug: t.slug,
                        updated: t.updated_at || t.updatedAt,
                        equipCount: t.equipmentSummary?.total_equipment,
                        questionCount: t.questions?.length ?? t.questionCount,
                        loadProfileHash,
                      });
                    };

                    const prevFp = getFingerprint(prev);
                    const nextFp = getFingerprint(template);

                    // Same fingerprint? Keep prev reference to avoid rerenders
                    if (prevFp && nextFp && prevFp === nextFp) return prev;

                    // New or updated template - log and persist
                    const nextId = template?.id || template?.slug || template?.useCaseId;
                    if (import.meta.env.DEV) {
                      if (prevFp && nextFp) {
                        console.log("[Step3] TEMPLATE UPDATED:", nextId, "(fingerprint changed)");
                      } else {
                        console.log("[Step3] TEMPLATE CAPTURED:", nextId || "(loaded)");
                      }
                    }
                    return template;
                  });
                }

                if (!inputs || typeof inputs !== "object") {
                  if (import.meta.env.DEV) {
                    console.error("[Step3] BAD UPDATE SHAPE - expected useCaseData.inputs", updates);
                  }
                  setDbError("Step 3 wiring error: missing useCaseData.inputs");
                  return;
                }

                // ✅ DEV: Log input key changes to catch template/calculator key drift
                if (import.meta.env.DEV && Object.keys(answers).length > 0) {
                  const prevKeys = Object.keys(answers);
                  const nextKeys = Object.keys(inputs);
                  const added = nextKeys.filter(k => !prevKeys.includes(k));
                  if (added.length > 0) {
                    console.log("[Step3] INPUT KEYS added:", added.slice(0, 10));
                  }
                }

                handleAnswersUpdate(inputs as Record<string, unknown>, metrics);
              }}
              initialData={answers}
              onComplete={(data) => {
                setIsLoading(false);
                handleAnswersUpdate(data as Record<string, unknown>);
              }}
              onNext={(quoteData) => {
                setIsLoading(false);
                handleAnswersUpdate(quoteData.answers, quoteData.metrics);
                onComplete();
              }}
              onBack={onBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
