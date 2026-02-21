/**
 * Step 3 Profile V7 — Curated Schema Edition
 *
 * Created: February 2, 2026
 *
 * FIXES:
 * - Uses resolveStep3Schema() instead of backend template questions
 * - Preserves icons, Merlin tips, conditional logic, validation
 * - Renders per-industry curated fields (NOT collapsed 3-template mapping)
 *
 * ARCHITECTURE:
 * - Curated schema resolver is SSOT for field definitions
 * - Backend template (if any) provides section order/copy only
 * - This component renders from curated schema
 */

import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Sun, Zap, Building2, Settings, Target } from "lucide-react";
import SolarSizingModal, { type SolarSizingResult } from "./SolarSizingModal";
import {
  resolveStep3Schema,
  CANONICAL_INDUSTRY_KEYS,
  type CuratedField,
  type CuratedSchema,
  type CuratedSection,
  type CanonicalIndustryKey,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import type { WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";
import {
  normalizeFieldType as normalizeFieldTypeUtil,
  chooseRendererForQuestion,
} from "./Step3RendererLogic";
import { devLog, devWarn, devError } from "@/wizard/v7/debug/devLog";

// Industry images (same as original)
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import carWashImg from "@/assets/images/car_wash_1.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import warehouseImg from "@/assets/images/logistics_1.jpg";
import officeImg from "@/assets/images/office_building1.jpg";
import retailImg from "@/assets/images/retail_1.jpg";
import restaurantImg from "@/assets/images/restaurant_1.jpg";
import healthcareImg from "@/assets/images/hospital_1.jpg";
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import evChargingImg from "@/assets/images/ev_charging_station.jpg";
import airportImg from "@/assets/images/airport_11.jpeg";
import casinoImg from "@/assets/images/casino_gaming1.jpg";
import gasStationImg from "@/assets/images/truck_stop.jpg";
import collegeImg from "@/assets/images/college_1.jpg";
import agricultureImg from "@/assets/images/agriculture_1.jpg";
import apartmentImg from "@/assets/images/apartment_building.jpg";
import residentialImg from "@/assets/images/Residential1.jpg";
import indoorFarmImg from "@/assets/images/indoor_farm1.jpg";
import merlinIcon from "@/assets/images/new_small_profile_.png";

type Step3Answers = Record<string, unknown>;

type Props = {
  state: WizardV7State;
  actions?: {
    setStep3Answer?: (id: string, value: unknown) => void;
    submitStep3?: (answersOverride?: Step3Answers) => Promise<void>;
    goBack?: () => void;
    toggleSolar?: () => void;
    setSolarSizing?: (solarKW: number) => void;
    toggleGenerator?: () => void;
    toggleEV?: () => void;
    confirmAddOns?: (value: boolean) => void;
  };
  updateState?: (patch: Partial<WizardV7State>) => void;
};

// Image mapping (type-enforced against canonical keys - adding industry requires image)
const INDUSTRY_IMAGES: Record<CanonicalIndustryKey, string> = {
  "car-wash": carWashImg,
  hotel: hotelImg,
  "ev-charging": evChargingImg,
  datacenter: dataCenterImg,
  hospital: healthcareImg,
  airport: airportImg,
  casino: casinoImg,
  warehouse: warehouseImg,
  retail: retailImg,
  "gas-station": gasStationImg,
  office: officeImg,
  manufacturing: manufacturingImg,
  restaurant: restaurantImg,
  college: collegeImg,
  agriculture: agricultureImg,
  "cold-storage": warehouseImg, // uses warehouse as fallback
  apartment: apartmentImg,
  residential: residentialImg,
  "indoor-farm": indoorFarmImg,
  government: officeImg, // office building as proxy for government
  other: hotelImg,
  auto: hotelImg,
};

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return String(v);
  } catch {
    return "";
  }
}

function isAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

// Required check with validation fallback (guards against missing required flag)
function isRequired(q: CuratedField): boolean {
  return q.required ?? q.validation?.required ?? false;
}

// Section icon mapping — Lucide icons for professional look
const SECTION_ICONS: Record<string, React.ReactNode> = {
  facility: <Building2 className="w-4 h-4" />,
  operations: <Settings className="w-4 h-4" />,
  energy: <Zap className="w-4 h-4" />,
  solar: <Sun className="w-4 h-4" />,
  goals: <Target className="w-4 h-4" />,
};

// Section descriptions for contextual guidance
const SECTION_DESCRIPTIONS: Record<string, string> = {
  facility: "Tell us about your building or site",
  operations: "How your facility operates day-to-day",
  energy: "Your current energy setup and grid connection",
  solar: "Solar generation potential and existing installations",
  goals: "What you want to achieve with energy storage",
};

// Normalize field type - delegates to extracted utility
function normalizeFieldType(t?: string): string {
  return normalizeFieldTypeUtil(t);
}

// Solar questions now handled by SolarSizingModal popup (Feb 18, 2026)
// All solar-specific questions moved to modal; primaryGoal/budgetTimeline remapped to 'goals'
const SOLAR_QUESTIONS_MOVED_TO_MODAL = new Set([
  "roofArea",
  "canopyInterest",
  "carportInterest",
  "totalSiteArea",
  "solarCapacityKW",
  "existingSolar",
  "sustainabilityMandate", // government config has this in solar section
]);

// Questions wrongly categorized under 'solar' section — remap to 'goals'
const REMAP_TO_GOALS = new Set(["primaryGoal", "budgetTimeline"]);

export default function Step3ProfileV7Curated(props: Props) {
  const { state, actions, updateState } = props;

  // ✅ CRITICAL FIX (Feb 10, 2026): Use effectiveIndustry from template (retail → hotel mapping)
  const effectiveIndustry =
    (state.step3Template as Record<string, unknown>)?.effectiveIndustry ||
    (state.step3Template as Record<string, unknown>)?.selectedIndustry ||
    ((state as Record<string, unknown>).industry as string | undefined) ||
    "other";

  // ✅ Alias for backward compatibility with existing code (Feb 10, 2026)
  const _industry = String(effectiveIndustry);

  devLog(
    "[Step3Curated] Using effectiveIndustry:",
    effectiveIndustry,
    "(selected:",
    state.industry,
    ")"
  );

  // Get answers from state (wrapped in useMemo to prevent dep warnings)
  const answers: Step3Answers = useMemo(
    () => ((state as Record<string, unknown>).step3Answers as Step3Answers | undefined) ?? {},
    [state]
  );

  // ✅ SSOT FIX (Feb 10, 2026): Use CURATED SCHEMA as single source of truth
  // Normalize questions to guarantee stable IDs and consistent structure
  const curatedSchema: CuratedSchema = useMemo(() => {
    return resolveStep3Schema(String(effectiveIndustry));
  }, [effectiveIndustry]);

  const { displayName, icon, source } = curatedSchema;

  // ✅ Normalize schema questions into a single, safe shape
  // This guarantees: stable IDs (fixes React keys), normalized options (fixes blank cards), consistent types
  const questions: CuratedField[] = useMemo(() => {
    const raw: Record<string, unknown>[] =
      ((curatedSchema as unknown as Record<string, unknown>)?.questions as Record<
        string,
        unknown
      >[]) ??
      ((curatedSchema as unknown as Record<string, unknown>)?.fields as Record<
        string,
        unknown
      >[]) ??
      [];

    return (raw ?? []).map((q: Record<string, unknown>, idx: number) => {
      // Guarantee stable id (fixes React key + answer wiring)
      // ✅ Filter out literal string "undefined" (common schema corruption)
      const rawId = q?.id ?? q?.key ?? q?.fieldId ?? q?.name;
      const id =
        rawId && String(rawId) !== "undefined" ? rawId : `${String(effectiveIndustry)}_${idx}`;

      // Normalize label/title
      const title = q?.title ?? q?.label ?? q?.prompt ?? q?.question ?? undefined;

      // Normalize options (common break: choices/values/items vs options)
      const optionsRaw = q?.options ?? q?.choices ?? q?.values ?? q?.items ?? undefined;

      return {
        ...q,
        id: String(id),
        title,
        label: q?.label ?? title,
        // keep existing type if present; fallback so renderer doesn't choke
        type: q?.type ?? q?.inputType ?? q?.kind ?? "text",
        required: Boolean(q?.required ?? q?.isRequired ?? false),
        // stash raw options into `options` so your getOptions(q) sees them
        options: optionsRaw,
      } as CuratedField;
    });
  }, [curatedSchema, effectiveIndustry]);

  const questionCount = questions.length;

  // DEV logging to confirm single source of truth
  if (import.meta.env.DEV) {
    devLog("[Step3Curated] Render source (CURATED SSOT)", {
      effectiveIndustry,
      curatedQuestions: questions.length,
      templateQuestions: (
        (state.step3Template as Record<string, unknown>)?.questions as unknown[] | undefined
      )?.length,
      undefinedIds: questions.filter((q) => !q?.id).length,
    });
  }

  // ============================================================================
  // AUTO-APPLY SMART DEFAULTS (Pre-fill with industry-typical values)
  // ============================================================================

  // Track which fields were auto-filled (vs user-edited)
  const [defaultFilledIds, setDefaultFilledIds] = useState<Set<string>>(new Set());
  const appliedSchemaRef = useRef<string>("");

  // Wizard confirmation state: user must acknowledge pre-filled defaults before proceeding
  const [defaultsReviewed, setDefaultsReviewed] = useState(false);

  // On template load, pre-fill any unanswered fields with their smartDefault
  useEffect(() => {
    const templateKey = `${effectiveIndustry}-${questionCount}`;
    if (appliedSchemaRef.current === templateKey) return; // Already applied for this template

    const toApply: Record<string, unknown> = {};
    const newDefaultIds = new Set<string>();

    for (const q of questions) {
      if (q.smartDefault !== undefined && q.smartDefault !== null && q.smartDefault !== "") {
        // Only pre-fill if not already answered
        if (!isAnswered(answers[q.id])) {
          toApply[q.id] = q.smartDefault;
          newDefaultIds.add(q.id);
        }
      }
    }

    if (Object.keys(toApply).length > 0) {
      // Apply all defaults in one batch
      for (const [id, value] of Object.entries(toApply)) {
        if (actions?.setStep3Answer) {
          actions.setStep3Answer(id, value);
        } else if (updateState) {
          // Fallback: batch via updateState
          const nextAnswers = { ...answers, ...toApply };
          updateState({ step3Answers: nextAnswers } as Partial<WizardV7State>);
          break; // Only need one updateState call for batch
        }
      }

      setDefaultFilledIds(newDefaultIds);
      appliedSchemaRef.current = templateKey;

      if (import.meta.env.DEV) {
        devLog(
          `[Step3Curated] ✅ Auto-filled ${Object.keys(toApply).length} fields with industry defaults:`,
          Object.keys(toApply)
        );
      }
    } else {
      appliedSchemaRef.current = templateKey;
    }
    // ✅ FIX (Feb 10, 2026): Include answers/actions/updateState in deps to prevent stale answer bugs
    // This ensures submitStep3 uses current answers, not stale closure values
  }, [effectiveIndustry, questionCount, questions, answers, actions, updateState]);

  // When user edits a field, remove it from "default-filled" tracking
  const setAnswerWithTracking = useCallback(
    (id: string, value: unknown) => {
      // Remove from default-filled set (user now owns this value)
      setDefaultFilledIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (actions?.setStep3Answer) {
        actions.setStep3Answer(id, value);
        return;
      }
      if (updateState) {
        const nextAnswers = { ...answers, [id]: value };
        updateState({ step3Answers: nextAnswers } as Partial<WizardV7State>);
      }
    },
    [actions, updateState, answers]
  );

  // Get hero image (keyed off effectiveIndustry - type-enforced)
  const heroKey = effectiveIndustry as CanonicalIndustryKey;
  const heroImg = INDUSTRY_IMAGES[heroKey] ?? INDUSTRY_IMAGES.other;

  // Check conditional visibility (fail-open to avoid deadlocks)
  const isQuestionVisible = useCallback(
    (q: CuratedField): boolean => {
      const c = q.conditionalLogic;
      // No conditional = always visible
      if (!c?.dependsOn || typeof c.showIf !== "function") return true;

      try {
        return !!c.showIf(answers[c.dependsOn]);
      } catch (e) {
        // Fail-open: show question if conditional throws (prevents UI deadlocks)
        if (import.meta.env.DEV) {
          devWarn("[Step3Curated] conditionalLogic threw", {
            id: q.id,
            dependsOn: c.dependsOn,
            e,
          });
        }
        return true;
      }
    },
    [answers]
  );

  // Get options (applies modifyOptions if present - enables dynamic option mutation)
  const getOptions = useCallback(
    (q: CuratedField) => {
      const base = q.options ?? [];
      const c = q.conditionalLogic;
      if (!c?.modifyOptions || !c.dependsOn) return base;

      try {
        const next = c.modifyOptions(answers[c.dependsOn]);
        return Array.isArray(next) ? next : base;
      } catch (e) {
        if (import.meta.env.DEV) {
          devWarn("[Step3Curated] modifyOptions threw", {
            id: q.id,
            dependsOn: c.dependsOn,
            e,
          });
        }
        return base; // fail-open
      }
    },
    [answers]
  );

  // Answer setter uses tracking wrapper (keeps default-filled state accurate)
  const setAnswer = setAnswerWithTracking;

  // Required fields (from curated schema - SSOT)
  const requiredIds = useMemo(() => {
    return questions.filter(isRequired).map((q) => q.id);
  }, [questions]);

  // Missing required (for completion calculation)
  // ✅ FIX (Feb 10, 2026): Pre-filled defaults (cyan badges) count as answered
  // isAnswered() already checks for value existence, not click events
  const missingRequired = useMemo(() => {
    return questions
      .filter(isRequired)
      .filter(isQuestionVisible)
      .filter((q) => {
        const value = answers[q.id];
        // ✅ Value exists (either user-entered OR auto-filled) = answered
        return !isAnswered(value);
      })
      .map((q) => q.id);
  }, [questions, answers, isQuestionVisible]);

  // Visible required count (for progress denominator)
  const visibleRequiredCount = useMemo(() => {
    return questions.filter(isRequired).filter(isQuestionVisible).length;
  }, [questions, isQuestionVisible]);

  // Progress metrics (uses template questions)
  const answeredRequired = visibleRequiredCount - missingRequired.length;
  const progressPct =
    visibleRequiredCount === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((answeredRequired / visibleRequiredCount) * 100)));

  // Completion status (all required fields answered)
  const isComplete = missingRequired.length === 0;

  devLog("[Step3Curated] Completion check (CURATED SSOT)", {
    totalQuestions: questionCount,
    requiredCount: requiredIds.length,
    visibleRequiredCount,
    missingCount: missingRequired.length,
    missingQuestions: missingRequired, // Show which questions are missing
    isComplete,
    progressPct,
    autoFilledCount: defaultFilledIds.size, // How many were auto-filled
  });

  // DEV invariants: catch schema corruption instantly
  if (import.meta.env.DEV) {
    const ids = questions.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) devError("[Step3Curated] Duplicate question ids:", dupes);

    for (const q of questions) {
      const t = normalizeFieldType(q.type);
      if (!t) devError("[Step3Curated] Missing type:", q);
      if (isRequired(q) && !(q.title || q.label)) {
        devError("[Step3Curated] Required question missing label/title:", q.id);
      }
    }
  }

  // Render a single question
  const renderQuestion = (q: CuratedField, index: number) => {
    if (!isQuestionVisible(q)) return null;

    const value = answers[q.id];
    const label = q.title || q.label || q.id;
    const required = isRequired(q);
    const hasValue = isAnswered(value);
    const isDefaultFilled = defaultFilledIds.has(q.id) && hasValue;

    // Get options (applies modifyOptions if present - enables dynamic option mutation)
    const options = getOptions(q);

    // ✅ Normalize options to prevent blank cards (with Array guard to prevent crash)
    // Preserves icon, description, disabled for rich button cards
    type NormalizedOption = {
      label: string;
      value: string;
      icon?: string;
      description?: string;
      disabled?: boolean;
    };
    const normalizedOptions: NormalizedOption[] = Array.isArray(options)
      ? options.map((o: Record<string, unknown> | string | number, i: number): NormalizedOption => {
          if (typeof o === "string" || typeof o === "number") {
            return { label: String(o), value: String(o) };
          }
          const label = String(o?.label ?? o?.text ?? o?.name ?? String(o?.value ?? i));
          const value = String(o?.value ?? o?.id ?? o?.key ?? label ?? i);
          return {
            label,
            value,
            icon: typeof o?.icon === "string" ? o.icon : undefined,
            description: typeof o?.description === "string" ? o.description : undefined,
            disabled: typeof o?.disabled === "boolean" ? o.disabled : undefined,
          };
        })
      : [];

    // Choose renderer based on type and option count (extracted for testability)
    // ✅ Pass normalized question so renderer sees correct option count
    const qForRender = { ...q, options: normalizedOptions };
    const renderer = chooseRendererForQuestion(qForRender as CuratedField);

    return (
      <div
        key={q.id}
        className={`rounded-lg border p-4 transition-colors ${
          isDefaultFilled
            ? "border-cyan-500/40 bg-slate-900/60 hover:border-cyan-400/50"
            : "border-slate-700/50 bg-slate-900/60 hover:border-white/[0.15]"
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            {/* Question number + Section badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-[#3ECF8E]/15 flex items-center justify-center text-[#3ECF8E] text-xs lg:text-sm font-semibold">
                {index + 1}
              </div>
              <span className="px-2 py-0.5 text-slate-400 text-xs lg:text-sm font-semibold tracking-wide rounded capitalize border border-white/[0.08]">
                {q.section}
              </span>
              {required && !hasValue && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold uppercase rounded border border-red-500/40">
                  Required
                </span>
              )}
              {hasValue && !isDefaultFilled && <span className="text-green-400 text-sm">✓</span>}
              {isDefaultFilled && (
                <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 text-[10px] font-medium rounded-full border border-cyan-500/20 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 0.5L6.09 3.26L9.09 3.64L6.95 5.64L7.55 8.59L5 7.15L2.45 8.59L3.05 5.64L0.91 3.64L3.91 3.26L5 0.5Z"
                      fill="currentColor"
                    />
                  </svg>
                  Industry default
                </span>
              )}
            </div>

            {/* Title */}
            <div className="text-sm lg:text-base font-bold text-slate-100 tracking-tight">
              {label}
            </div>

            {/* Subtitle */}
            {q.subtitle && (
              <div className="text-xs lg:text-sm text-slate-400 mt-1">{q.subtitle}</div>
            )}
          </div>
        </div>

        {/* Help Text */}
        {q.helpText && (
          <div className="flex items-start gap-2 p-2 bg-blue-950/40 border border-blue-500/20 rounded-lg mb-3">
            <span className="text-blue-400 text-sm">ℹ️</span>
            <p className="text-xs lg:text-sm text-blue-300/90">{q.helpText}</p>
          </div>
        )}

        {/* Merlin's Tip */}
        {q.merlinTip && (
          <div className="flex items-start gap-2 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg mb-3">
            <div className="w-6 h-6 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#3ECF8E]" />
            </div>
            <div>
              <div className="font-semibold text-slate-300 text-xs lg:text-sm mb-0.5">
                Merlin's Tip
              </div>
              <p className="text-xs lg:text-sm text-slate-400 leading-relaxed">{q.merlinTip}</p>
            </div>
          </div>
        )}

        {/* Input Component */}
        <div className="mt-2">
          {/* Buttons for small option sets (≤6 options: 2-column grid) */}
          {renderer === "grid" && (
            <div className="grid grid-cols-2 gap-2">
              {normalizedOptions.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      p-3 rounded-lg border text-left transition-colors relative
                      ${
                        selected
                          ? "border-emerald-400 text-emerald-300 font-semibold bg-transparent"
                          : "border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 bg-transparent"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        ✓
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <span className="font-medium text-sm lg:text-base">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <p className="text-xs lg:text-sm text-slate-400 mt-1">{opt.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Buttons for medium option sets (7-18 options: compact grid for hours/ranges) */}
          {renderer === "compact_grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {normalizedOptions.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      px-2 py-2.5 rounded-lg border text-center transition-colors relative min-h-[44px]
                      ${
                        selected
                          ? "border-emerald-400 text-emerald-300 font-bold bg-emerald-500/[0.08]"
                          : "border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 bg-transparent"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                    <div className="text-sm lg:text-base font-medium">{opt.icon || opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] lg:text-xs text-slate-500 mt-0.5">
                        {opt.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Select dropdown (for very large option sets >18) */}
          {renderer === "select" && normalizedOptions.length > 0 && (
            <select
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
              value={asString(value)}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            >
              <option value="">Select…</option>
              {normalizedOptions.map((opt) => {
                const optVal = String(opt.value);
                return (
                  <option key={optVal} value={optVal}>
                    {opt.icon ? `${opt.icon} ` : ""}
                    {opt.label}
                  </option>
                );
              })}
            </select>
          )}

          {/* Number input — unit suffix inside field, smart placeholder, inline validation */}
          {renderer === "number" && (
            <div className="relative">
              <input
                type="number"
                className={`w-full rounded-lg bg-slate-950/60 border px-3 py-2.5 text-slate-100 ${
                  q.suffix || q.unit ? "pr-14" : ""
                } ${
                  value !== null &&
                  value !== undefined &&
                  value !== "" &&
                  ((q.range?.min != null && Number(value) < q.range.min) ||
                    (q.range?.max != null && Number(value) > q.range.max) ||
                    (q.validation?.min != null && Number(value) < q.validation.min) ||
                    (q.validation?.max != null && Number(value) > q.validation.max))
                    ? "border-amber-500/60 focus:ring-amber-500/40"
                    : "border-slate-700/60 focus:ring-violet-500/40"
                } focus:ring-1 focus:outline-none transition-colors`}
                placeholder={
                  q.placeholder || (q.smartDefault != null ? String(q.smartDefault) : "")
                }
                value={value === null || value === undefined ? "" : String(value)}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") return setAnswer(q.id, "");
                  const n = Number(raw);
                  setAnswer(q.id, Number.isFinite(n) ? n : raw);
                }}
                min={q.range?.min ?? q.validation?.min}
                max={q.range?.max ?? q.validation?.max}
              />
              {(q.suffix || q.unit) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                  {q.suffix || q.unit}
                </span>
              )}
              {/* Inline validation hint */}
              {value !== null &&
                value !== undefined &&
                value !== "" &&
                (() => {
                  const n = Number(value);
                  const min = q.range?.min ?? q.validation?.min;
                  const max = q.range?.max ?? q.validation?.max;
                  if (min != null && n < min)
                    return (
                      <p className="text-amber-400 text-xs mt-1">
                        Minimum: {min}
                        {q.unit ? ` ${q.unit}` : ""}
                      </p>
                    );
                  if (max != null && n > max)
                    return (
                      <p className="text-amber-400 text-xs mt-1">
                        Maximum: {max}
                        {q.unit ? ` ${q.unit}` : ""}
                      </p>
                    );
                  return null;
                })()}
            </div>
          )}

          {/* Number Stepper — Enhanced number input with +/- buttons for discrete counts */}
          {renderer === "number_stepper" && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Decrement button */}
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof value === "number" ? value : Number(q.smartDefault ?? 0);
                    const min = q.range?.min ?? q.validation?.min ?? 0;
                    const step = q.range?.step ?? 1;
                    const next = Math.max(min, current - step);
                    setAnswer(q.id, next);
                  }}
                  className="w-12 h-12 rounded-lg border border-slate-700/50 bg-transparent text-slate-400 hover:border-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={
                    value !== null &&
                    value !== undefined &&
                    typeof value === "number" &&
                    (q.range?.min != null || q.validation?.min != null) &&
                    value <= (q.range?.min ?? q.validation?.min ?? 0)
                  }
                >
                  −
                </button>

                {/* Number display with unit */}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    className={`w-full rounded-lg bg-slate-950/60 border px-4 py-3 text-center text-lg font-semibold text-slate-100 ${
                      q.suffix || q.unit ? "pr-16" : ""
                    } border-slate-700/60 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 focus:outline-none transition-colors`}
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") return setAnswer(q.id, "");
                      const n = Number(raw);
                      if (Number.isFinite(n)) {
                        const min = q.range?.min ?? q.validation?.min;
                        const max = q.range?.max ?? q.validation?.max;
                        if (min != null && n < min) return;
                        if (max != null && n > max) return;
                        setAnswer(q.id, n);
                      }
                    }}
                    placeholder={
                      q.placeholder || (q.smartDefault != null ? String(q.smartDefault) : "0")
                    }
                    min={q.range?.min ?? q.validation?.min}
                    max={q.range?.max ?? q.validation?.max}
                    step={q.range?.step ?? 1}
                  />
                  {(q.suffix || q.unit) && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
                      {q.suffix || q.unit}
                    </span>
                  )}
                </div>

                {/* Increment button */}
                <button
                  type="button"
                  onClick={() => {
                    const current = typeof value === "number" ? value : Number(q.smartDefault ?? 0);
                    const max = q.range?.max ?? q.validation?.max ?? 9999;
                    const step = q.range?.step ?? 1;
                    const next = Math.min(max, current + step);
                    setAnswer(q.id, next);
                  }}
                  className="w-12 h-12 rounded-lg border border-slate-700/50 bg-transparent text-slate-400 hover:border-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={
                    value !== null &&
                    value !== undefined &&
                    typeof value === "number" &&
                    (q.range?.max != null || q.validation?.max != null) &&
                    value >= (q.range?.max ?? q.validation?.max ?? 9999)
                  }
                >
                  +
                </button>
              </div>

              {/* Range hint */}
              {(q.range?.min != null || q.range?.max != null) && (
                <p className="text-xs text-slate-500 text-center">
                  Range: {q.range.min ?? 0} - {q.range.max ?? "∞"}
                  {q.unit ? ` ${q.unit}` : ""}
                </p>
              )}
            </div>
          )}

          {/* Range Buttons — Button card selection for range values (e.g., "100-250 rooms") */}
          {renderer === "range_buttons" && normalizedOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {normalizedOptions.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      p-3.5 rounded-lg border text-center transition-colors relative
                      ${
                        selected
                          ? "border-violet-400 text-violet-300 font-semibold bg-transparent"
                          : "border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 bg-transparent"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-violet-400 flex items-center justify-center text-violet-400 text-xs font-bold">
                        ✓
                      </span>
                    )}
                    {opt.icon && <div className="text-2xl mb-1.5">{opt.icon}</div>}
                    <div className="font-semibold text-sm lg:text-base">{opt.label}</div>
                    {opt.description && (
                      <p className="text-xs lg:text-sm text-slate-400 mt-1">{opt.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Slider */}
          {renderer === "slider" &&
            q.range &&
            (() => {
              const sliderVal =
                typeof value === "number"
                  ? value
                  : typeof q.smartDefault === "number"
                    ? q.smartDefault
                    : q.range.min;
              const pct =
                q.range.max > q.range.min
                  ? ((sliderVal - q.range.min) / (q.range.max - q.range.min)) * 100
                  : 0;
              return (
                <div className="space-y-3">
                  {/* Current value badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#3ECF8E]/30 text-[#3ECF8E] font-semibold text-base">
                      {sliderVal}
                      {q.unit || ""}
                    </span>
                  </div>
                  {/* Track with filled portion */}
                  <div className="relative pt-1">
                    <input
                      type="range"
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3ECF8E] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3ECF8E]/80 [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#3ECF8E] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#3ECF8E]/80 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(62 207 142) 0%, rgb(62 207 142) ${pct}%, rgb(51 65 85) ${pct}%, rgb(51 65 85) 100%)`,
                      }}
                      min={q.range.min}
                      max={q.range.max}
                      step={q.range.step}
                      value={sliderVal}
                      onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {q.range.min}
                      {q.unit || ""}
                    </span>
                    <span>
                      {q.range.max}
                      {q.unit || ""}
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Toggle (stores boolean) */}
          {renderer === "toggle" && (
            <div className="flex gap-2">
              {[true, false].map((opt) => (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => setAnswer(q.id, opt)}
                  className={`
                    flex-1 p-3 rounded-lg border transition-colors relative
                    ${
                      value === opt
                        ? "border-emerald-400 text-emerald-300 font-semibold bg-transparent"
                        : "border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 bg-transparent"
                    }
                  `}
                >
                  {value === opt && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-xs font-bold">
                      ✓
                    </span>
                  )}
                  <span className="text-lg mr-2">{opt ? "✅" : "❌"}</span>
                  <span className="font-medium">{opt ? "Yes" : "No"}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text input (fallback) */}
          {renderer === "text" && (
            <input
              type="text"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
              placeholder={q.placeholder || ""}
              value={asString(value)}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}

          {/* Multiselect - CheckboxGrid (button cards with checkmarks) */}
          {renderer === "multiselect" && normalizedOptions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {normalizedOptions.map((opt) => {
                const optVal = String(opt.value);
                const selected = Array.isArray(value) && value.map(String).includes(optVal);
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(value) ? value.map(String) : [];
                      if (selected) {
                        setAnswer(
                          q.id,
                          current.filter((v) => v !== optVal)
                        );
                      } else {
                        setAnswer(q.id, [...current, optVal]);
                      }
                    }}
                    className={`
                      p-3 rounded-lg border text-left transition-colors relative
                      ${
                        selected
                          ? "border-violet-400 text-violet-300 font-semibold bg-transparent"
                          : "border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300 bg-transparent"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-violet-400 flex items-center justify-center text-violet-400 text-xs font-bold">
                        ✓
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <span className="font-medium text-sm lg:text-base">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <p className="text-xs lg:text-sm text-slate-400 mt-1">{opt.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter visible questions (memoized to avoid render churn)
  // ✅ Also filter out questions with missing IDs (prevents React key errors)
  // ✅ Filter out solar sizing questions handled by SolarSizingModal (Feb 18, 2026)
  // ✅ Remap primaryGoal/budgetTimeline from solar → goals section (Feb 18, 2026)
  const visibleQuestions = useMemo(
    () =>
      questions
        .filter((q) => q.id && q.id !== "undefined")
        .filter((q) => !SOLAR_QUESTIONS_MOVED_TO_MODAL.has(q.id))
        .filter(isQuestionVisible)
        .map((q) => (REMAP_TO_GOALS.has(q.id) ? { ...q, section: "goals" } : q)),
    [questions, isQuestionVisible]
  );

  // ── Solar Sizing Modal state ──
  const [showSolarModal, setShowSolarModal] = useState(false);
  const [solarSizingResult, setSolarSizingResult] = useState<SolarSizingResult | null>(null);

  // Extract location state for solar production estimates
  const locationState = useMemo(() => {
    const loc = state.location;
    if (!loc) return undefined;
    // Try to extract 2-letter state from location data
    const stateStr =
      (loc as Record<string, unknown>).state ?? (loc as Record<string, unknown>).region;
    return stateStr ? String(stateStr).toUpperCase().slice(0, 2) : undefined;
  }, [state.location]);

  const electricityRate = useMemo(() => {
    const intel = state.locationIntel;
    if (!intel) return 0.12;
    return ((intel as Record<string, unknown>).electricityRate as number) ?? 0.12;
  }, [state.locationIntel]);

  // Check if user wants solar (from existingSolar answer or wantSolar answer)
  const handleSolarSizingApply = useCallback(
    (result: SolarSizingResult) => {
      setSolarSizingResult(result);
      setShowSolarModal(false);

      // Update wizard state with solar sizing via dedicated action
      if (actions?.setSolarSizing) {
        actions.setSolarSizing(result.solarKW);
      }

      // Also set the answer for solarCapacityKW so it flows through to the calculator
      if (actions?.setStep3Answer) {
        actions.setStep3Answer("solarCapacityKW", result.solarKW);
        // Persist roof/canopy breakdown so Step 5 can cap Starter to roof-only
        actions.setStep3Answer("roofSolarKW", result.roofSolarKW);
        actions.setStep3Answer("canopySolarKW", result.canopySolarKW);
        // If they used the modal, they want solar
        actions.setStep3Answer("wantSolar", "yes");
      }
    },
    [actions]
  );

  // DEV invariants: catch broken schemas immediately
  if (import.meta.env.DEV) {
    // Check for undefined IDs that would cause React key errors
    const undefinedIdQuestions = visibleQuestions.filter((q) => !q.id || q.id === "undefined");
    if (undefinedIdQuestions.length > 0) {
      devError(
        "[Step3Curated] ❌ Questions with undefined IDs:",
        undefinedIdQuestions.map((q) => ({ id: q.id, label: q.label, title: q.title }))
      );
    }

    // Check image map completeness
    for (const k of CANONICAL_INDUSTRY_KEYS) {
      if (!INDUSTRY_IMAGES[k]) {
        devError("[Step3Curated] Missing hero image for industry:", k);
      }
    }

    const missingId = questions.find((q) => !q.id);
    if (missingId) devWarn("[Step3Curated] question missing id", missingId);

    const badDepends = questions.find((q) => q.conditionalLogic && !q.conditionalLogic.dependsOn);
    if (badDepends) devWarn("[Step3Curated] conditionalLogic missing dependsOn", badDepends);
  }

  // ============================================================================
  // SECTION GROUPING — Group questions by section for visual hierarchy
  // ============================================================================
  const sections: CuratedSection[] = curatedSchema.sections;

  // Build ordered groups: section → questions[]
  // ✅ Solar section is fully handled by SolarSizingModal — skip it here (Feb 2026)
  const sectionGroups = useMemo(() => {
    // Get unique section IDs in question order (preserves flow)
    const seenSections: string[] = [];
    for (const q of visibleQuestions) {
      const s = q.section || "general";
      // Skip 'solar' section entirely — handled by SolarSizingModal
      if (s === "solar") continue;
      if (!seenSections.includes(s)) seenSections.push(s);
    }

    const groups = seenSections.map((sectionId) => {
      const sectionMeta = sections.find((s) => s.id === sectionId);
      const sectionQuestions = visibleQuestions.filter(
        (q) => (q.section || "general") === sectionId
      );
      return {
        id: sectionId,
        label: sectionMeta?.label || sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
        icon: sectionMeta?.icon,
        description: sectionMeta?.description || SECTION_DESCRIPTIONS[sectionId],
        questions: sectionQuestions,
      };
    });

    // Filter out empty sections (safety net)
    return groups.filter((g) => g.questions.length > 0);
  }, [visibleQuestions, sections]);

  // Compute question index offsets per section for continuous numbering
  const sectionStartIndexes = useMemo(() => {
    const offsets: Record<string, number> = {};
    let offset = 0;
    for (const group of sectionGroups) {
      offsets[group.id] = offset;
      offset += group.questions.length;
    }
    return offsets;
  }, [sectionGroups]);

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950/60 mb-4">
        <div className="relative h-32 w-full">
          <img
            src={heroImg}
            alt={displayName}
            className="h-32 w-full object-cover opacity-60"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          <div className="absolute left-5 top-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <div className="text-lg font-extrabold text-slate-50 tracking-tight">
                Step 3 — Profile
              </div>
            </div>
            <div className="text-sm text-slate-300 mt-1">{displayName}</div>
          </div>

          {/* Schema source badge (DEV only) */}
          {import.meta.env.DEV && (
            <div className="absolute right-4 top-4">
              <span
                className={`
                px-2 py-1 text-xs font-mono rounded
                ${
                  source === "curated-complete"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : source === "curated-legacy"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }
              `}
              >
                {source}
              </span>
            </div>
          )}
        </div>

        {/* Progress banner */}
        <div className="p-4 border-t border-slate-700/40">
          {/* Default Settings Explanation - Always shown at top */}
          <div
            style={{
              marginBottom: 16,
              padding: "16px 20px",
              borderRadius: 12,
              background:
                "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "start",
                gap: 12,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(139, 92, 246, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                💡
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.95)",
                    marginBottom: 6,
                  }}
                >
                  Industry Default Settings
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "rgba(255, 255, 255, 0.70)",
                  }}
                >
                  We've pre-filled answers with industry standard values to help you get started
                  quickly. Please review and adjust any fields to match your specific requirements —
                  every facility is unique. Once you're satisfied, continue to see your custom
                  quote.
                </div>
              </div>
            </div>
          </div>

          {/* Pre-filled hint (shows when defaults were applied) */}
          {defaultFilledIds.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2.5 bg-cyan-950/30 border border-cyan-500/20 rounded-lg">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-cyan-400 flex-shrink-0"
              >
                <path
                  d="M8 1L10.18 5.42L15 6.11L11.5 9.52L12.36 14.31L8 12.01L3.64 14.31L4.5 9.52L1 6.11L5.82 5.42L8 1Z"
                  fill="currentColor"
                  opacity="0.7"
                />
              </svg>
              <p className="text-xs text-cyan-300/90">
                <span className="font-semibold text-cyan-200">
                  Pre-filled with industry defaults.
                </span>{" "}
                Review and adjust any values that differ for your specific facility.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">
              <span className="text-violet-300 font-semibold">{visibleQuestions.length}</span>{" "}
              questions
              {missingRequired.length > 0 && (
                <span className="text-amber-300 ml-2">
                  ({missingRequired.length} required remaining)
                </span>
              )}
            </div>
            {isComplete && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span>✓</span>
                <span>Ready to continue</span>
              </div>
            )}
          </div>

          {/* Progress bar (uses visible required count as denominator) */}
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3ECF8E] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions — grouped by section with headers */}
      <div className="space-y-6">
        {sectionGroups.map((group) => {
          const sectionIcon = SECTION_ICONS[group.id];

          // Render section header + questions
          const sectionContent = (
            <div
              key={group.id}
              className="rounded-xl overflow-hidden border border-slate-700/30 bg-slate-950/40"
            >
              {/* Section Header */}
              <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  {/* Section Icon */}
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400">
                    {sectionIcon || <span className="text-base lg:text-lg">{group.icon}</span>}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm lg:text-base font-bold tracking-tight text-slate-200">
                      {group.label}
                    </h3>
                    {group.description && (
                      <p className="text-xs lg:text-sm text-slate-400 mt-0.5">
                        {group.description}
                      </p>
                    )}
                  </div>

                  {/* Question count badge */}
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-500 border border-slate-700/50">
                    {group.questions.length}{" "}
                    {group.questions.length === 1 ? "question" : "questions"}
                  </span>
                </div>
              </div>

              {/* Section Questions */}
              <div className="p-4 space-y-4">
                {group.questions.map((q, qIdx) => {
                  const globalIdx = sectionStartIndexes[group.id] + qIdx;
                  return renderQuestion(q, globalIdx);
                })}
              </div>
            </div>
          );

          return sectionContent;
        })}
      </div>

      {/* ── Solar Sizing Assistant — standalone card (Feb 18, 2026) ── */}
      <div className="rounded-xl overflow-hidden border border-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-950/60">
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowSolarModal(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50 hover:bg-amber-950/30 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-amber-200 group-hover:text-amber-100">
                  {solarSizingResult ? "☀️ Update Solar Sizing" : "☀️ Size My Solar"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {solarSizingResult
                    ? `Currently sized: ${solarSizingResult.solarKW.toLocaleString()} kW — click to adjust`
                    : "Calculate your optimal solar size based on your building and roof"}
                </p>
              </div>
              <span className="text-amber-400 text-lg group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </button>

          {/* Show sizing result summary if user has sized solar */}
          {solarSizingResult && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-green-950/20 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-200">Solar Sized ✓</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-300">
                    {solarSizingResult.solarKW.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">kW System</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    ${(solarSizingResult.annualSavings / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-slate-400">/year savings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {(solarSizingResult.annualProductionKWh / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-slate-400">kWh/year</div>
                </div>
              </div>
              {solarSizingResult.includesCanopy && (
                <p className="text-xs text-amber-300/60 mt-2 text-center">
                  Includes {solarSizingResult.canopySolarKW.toLocaleString()} kW canopy solar
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Continue — single clean flow (Feb 11, 2026) */}
      <div className="mt-6 flex flex-col items-end gap-3">
        {/* Confirmation banner — only when defaults were auto-filled and not yet reviewed */}
        {isComplete && defaultFilledIds.size > 0 && !defaultsReviewed && (
          <div
            className="w-full rounded-xl border border-cyan-500/30 p-4"
            style={{ background: "rgba(6, 182, 212, 0.08)" }}
          >
            <div className="flex items-start gap-3">
              <img src={merlinIcon} alt="Merlin" className="w-7 h-7 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-cyan-200">
                  Merlin pre-filled {defaultFilledIds.size} answers using industry defaults
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  These are typical values for your industry. You can scroll up to review and adjust
                  anything that doesn't match your facility, or continue with these defaults for a
                  fast estimate.
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultsReviewed(true);
                      if (actions?.submitStep3) {
                        void actions.submitStep3();
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm border-2 border-[#3ECF8E] text-[#3ECF8E] hover:bg-[#3ECF8E]/10 transition-all"
                  >
                    Looks good — Continue →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultsReviewed(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2.5 rounded-lg font-medium text-sm border border-white/[0.1] text-slate-300 hover:bg-white/[0.04] transition-all"
                  >
                    Let me review first
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Continue button — only shown when defaults reviewed (or no defaults) */}
        {(defaultFilledIds.size === 0 || defaultsReviewed) && (
          <button
            type="button"
            data-testid="step3-continue"
            onClick={() => {
              if (actions?.submitStep3) {
                void actions.submitStep3();
              }
            }}
            disabled={!isComplete || state.pricingStatus === "pending"}
            className={`
              px-6 py-3 rounded-lg font-semibold text-base transition-all
              ${
                isComplete && state.pricingStatus !== "pending"
                  ? "border-2 border-[#3ECF8E] text-[#3ECF8E] cursor-pointer hover:bg-[#3ECF8E]/10"
                  : "border-2 border-slate-700 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            Continue to Options →
          </button>
        )}
      </div>

      {/* Solar Sizing Modal (Feb 18, 2026) */}
      <SolarSizingModal
        isOpen={showSolarModal}
        onClose={() => setShowSolarModal(false)}
        onApply={handleSolarSizingApply}
        industry={_industry}
        step3Answers={answers}
        state={locationState}
        electricityRate={electricityRate}
      />
    </div>
  );
}
