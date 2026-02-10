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
import {
  resolveStep3Schema,
  CANONICAL_INDUSTRY_KEYS,
  getTier1Blockers,
  type CuratedField,
  type CuratedSchema,
  type CanonicalIndustryKey,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import type { WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";
import {
  normalizeFieldType as normalizeFieldTypeUtil,
  chooseRendererForQuestion,
} from "./Step3RendererLogic";
import SmartAddOnsModal from "./SmartAddOnsModal";

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

type Step3Answers = Record<string, unknown>;

type Props = {
  state: WizardV7State;
  actions?: {
    setStep3Answer?: (id: string, value: unknown) => void;
    submitStep3?: (answersOverride?: Step3Answers) => Promise<void>;
    goBack?: () => void;
    toggleSolar?: () => void;
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
  "gas-station": hotelImg, // TODO: add gas station image
  office: officeImg,
  manufacturing: manufacturingImg,
  restaurant: restaurantImg,
  college: hotelImg, // TODO: add college image
  agriculture: hotelImg, // TODO: add agriculture image
  "cold-storage": warehouseImg, // uses warehouse as fallback
  apartment: hotelImg, // TODO: add apartment image
  residential: hotelImg, // TODO: add residential image
  "indoor-farm": hotelImg, // TODO: add indoor farm image
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

// Normalize field type - delegates to extracted utility
function normalizeFieldType(t?: string): string {
  return normalizeFieldTypeUtil(t);
}

export default function Step3ProfileV7Curated(props: Props) {
  const { state, actions, updateState } = props;

  // Get industry from state (fix operator precedence)
  const industry = ((state as Record<string, unknown>).industry as string | undefined) ?? "other";

  // Get answers from state (wrapped in useMemo to prevent dep warnings)
  const answers: Step3Answers = useMemo(
    () => ((state as Record<string, unknown>).step3Answers as Step3Answers | undefined) ?? {},
    [state]
  );

  // ✅ RESOLVE CURATED SCHEMA (NOT from backend template)
  const schema: CuratedSchema = useMemo(() => {
    return resolveStep3Schema(industry);
  }, [industry]);

  const { questions, displayName, icon, source } = schema;
  // Note: sections available via schema.sections when needed for grouped rendering

  // ============================================================================
  // AUTO-APPLY SMART DEFAULTS (Pre-fill with industry-typical values)
  // ============================================================================

  // Track which fields were auto-filled (vs user-edited)
  const [defaultFilledIds, setDefaultFilledIds] = useState<Set<string>>(new Set());
  const appliedSchemaRef = useRef<string>("");

  // Add-ons modal state (triggers after Continue click)
  const [showAddOnsModal, setShowAddOnsModal] = useState(false);

  // On schema load, pre-fill any unanswered fields with their smartDefault
  useEffect(() => {
    const schemaKey = `${schema.industry}-${schema.questionCount}`;
    if (appliedSchemaRef.current === schemaKey) return; // Already applied for this schema

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
      appliedSchemaRef.current = schemaKey;

      if (import.meta.env.DEV) {
        console.log(
          `[Step3Curated] ✅ Auto-filled ${Object.keys(toApply).length} fields with industry defaults:`,
          Object.keys(toApply)
        );
      }
    } else {
      appliedSchemaRef.current = schemaKey;
    }
  }, [schema.industry, schema.questionCount, questions]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get hero image (keyed off normalized schema.industry - type-enforced)
  const heroKey = schema.industry as CanonicalIndustryKey;
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
          console.warn("[Step3Curated] conditionalLogic threw", {
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
          console.warn("[Step3Curated] modifyOptions threw", {
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

  // Required fields (ALL required - stable count for debugging)
  const _requiredIds = useMemo(() => {
    return questions.filter(isRequired).map((q) => q.id);
  }, [questions]);

  // Tier 1 blockers (gates completion)
  const blockerIds = useMemo(() => {
    const tier1 = getTier1Blockers(industry);
    return tier1.filter((id) => questions.some((q) => q.id === id));
  }, [industry, questions]);

  // Missing blockers (Tier 1 only - actually gates completion)
  const missingBlockers = useMemo(() => {
    if (!blockerIds.length) return [];
    const missing: string[] = [];
    for (const id of blockerIds) {
      if (!isAnswered(answers[id])) missing.push(id);
    }
    return missing;
  }, [blockerIds, answers]);

  // Visible required count (for progress denominator)
  const visibleRequiredCount = useMemo(() => {
    return questions.filter(isRequired).filter(isQuestionVisible).length;
  }, [questions, isQuestionVisible]);

  // Missing required (visible + required + unanswered - for UI display only)
  const missingRequired = useMemo(() => {
    return questions
      .filter(isRequired)
      .filter(isQuestionVisible)
      .filter((q) => !isAnswered(answers[q.id]))
      .map((q) => q.id);
  }, [questions, answers, isQuestionVisible]);

  // Progress metrics (uses blockers if available, else all required)
  const effectiveRequired = blockerIds.length > 0 ? blockerIds.length : visibleRequiredCount;
  const effectiveMissing = blockerIds.length > 0 ? missingBlockers.length : missingRequired.length;
  const answeredRequired = effectiveRequired - effectiveMissing;
  const progressPct =
    effectiveRequired === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((answeredRequired / effectiveRequired) * 100)));

  // Completion status (uses blockers if available)
  const isComplete =
    blockerIds.length > 0 ? missingBlockers.length === 0 : missingRequired.length === 0;

  // DEV invariants: catch schema corruption instantly
  if (import.meta.env.DEV) {
    const ids = questions.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length) console.error("[Step3Curated] Duplicate question ids:", dupes);

    for (const q of questions) {
      const t = normalizeFieldType(q.type);
      if (!t) console.error("[Step3Curated] Missing type:", q);
      if (isRequired(q) && !(q.title || q.label)) {
        console.error("[Step3Curated] Required question missing label/title:", q.id);
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

    // Choose renderer based on type and option count (extracted for testability)
    const renderer = chooseRendererForQuestion(q);

    return (
      <div
        key={q.id}
        className={`rounded-xl border p-4 transition-all ${
          isDefaultFilled
            ? "border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400/40"
            : "border-slate-700/60 bg-slate-900/40 hover:border-violet-500/40"
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            {/* Question number + Section badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {index + 1}
              </div>
              <span className="px-2 py-0.5 bg-violet-500/15 text-violet-300 text-xs font-medium rounded-full capitalize border border-violet-500/20">
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
            <div className="text-sm font-semibold text-slate-100">{label}</div>

            {/* Subtitle */}
            {q.subtitle && <div className="text-xs text-slate-400 mt-1">{q.subtitle}</div>}
          </div>
        </div>

        {/* Help Text */}
        {q.helpText && (
          <div className="flex items-start gap-2 p-2 bg-blue-950/40 border border-blue-500/20 rounded-lg mb-3">
            <span className="text-blue-400 text-sm">ℹ️</span>
            <p className="text-xs text-blue-300/90">{q.helpText}</p>
          </div>
        )}

        {/* Merlin's Tip */}
        {q.merlinTip && (
          <div className="flex items-start gap-2 p-2.5 bg-purple-950/40 border border-purple-500/20 rounded-lg mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🧙‍♂️</span>
            </div>
            <div>
              <div className="font-semibold text-purple-200 text-xs mb-0.5">Merlin's Tip</div>
              <p className="text-xs text-purple-300/90 leading-relaxed">{q.merlinTip}</p>
            </div>
          </div>
        )}

        {/* Input Component */}
        <div className="mt-2">
          {/* Buttons for small option sets (≤6 options: 2-column grid) */}
          {renderer === "grid" && (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      p-3 rounded-lg border text-left transition-all relative
                      ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/20 text-white ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                          : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-800/80 hover:scale-[1.01]"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md animate-in fade-in zoom-in duration-200">
                        ✓
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Buttons for medium option sets (7-18 options: compact grid for hours/ranges) */}
          {renderer === "compact_grid" && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {options.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      px-2 py-2.5 rounded-lg border text-center transition-all relative
                      ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/20 text-white ring-2 ring-emerald-500/50 font-bold shadow-lg shadow-emerald-500/20"
                          : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-800/80"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                    `}
                    disabled={opt.disabled}
                  >
                    <div className="text-sm font-medium">{opt.icon || opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{opt.description}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Select dropdown (for very large option sets >18) */}
          {renderer === "select" && options.length > 0 && (
            <select
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
              value={asString(value)}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            >
              <option value="">Select…</option>
              {options.map((opt) => {
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
                    const current = typeof value === "number" ? value : (q.smartDefault ?? 0);
                    const min = q.range?.min ?? q.validation?.min ?? 0;
                    const step = q.range?.step ?? 1;
                    const next = Math.max(min, current - step);
                    setAnswer(q.id, next);
                  }}
                  className="w-12 h-12 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-violet-500 hover:bg-violet-500/20 hover:text-violet-200 hover:shadow-lg hover:shadow-violet-500/20 transition-all flex items-center justify-center text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 active:bg-violet-500/30"
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
                    const current = typeof value === "number" ? value : (q.smartDefault ?? 0);
                    const max = q.range?.max ?? q.validation?.max ?? 9999;
                    const step = q.range?.step ?? 1;
                    const next = Math.min(max, current + step);
                    setAnswer(q.id, next);
                  }}
                  className="w-12 h-12 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-violet-500 hover:bg-violet-500/10 hover:text-violet-300 transition-all flex items-center justify-center text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
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
          {renderer === "range_buttons" && options.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      p-3.5 rounded-lg border text-center transition-all relative
                      ${
                        selected
                          ? "border-violet-500 bg-violet-500/20 text-white ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20 scale-[1.02]"
                          : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-violet-400/40 hover:bg-slate-800/80 hover:scale-[1.01]"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md animate-in fade-in zoom-in duration-200">
                        ✓
                      </span>
                    )}
                    {opt.icon && <div className="text-2xl mb-1.5">{opt.icon}</div>}
                    <div className="font-semibold text-sm">{opt.label}</div>
                    {opt.description && (
                      <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
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
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-200 font-bold text-base">
                      {sliderVal}
                      {q.unit || ""}
                    </span>
                  </div>
                  {/* Track with filled portion */}
                  <div className="relative pt-1">
                    <input
                      type="range"
                      className="w-full h-2 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-violet-300 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/40 [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-violet-300 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(139 92 246) 0%, rgb(139 92 246) ${pct}%, rgb(51 65 85) ${pct}%, rgb(51 65 85) 100%)`,
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
                    flex-1 p-3 rounded-lg border transition-all relative
                    ${
                      value === opt
                        ? "border-emerald-500 bg-emerald-500/20 text-white ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                        : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:bg-slate-800/80 hover:scale-[1.01] active:scale-[0.98]"
                    }
                  `}
                >
                  {value === opt && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
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
          {renderer === "multiselect" && options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {options.map((opt) => {
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
                      p-3 rounded-lg border text-left transition-all relative
                      ${
                        selected
                          ? "border-violet-500 bg-violet-500/20 text-white ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20 scale-[1.02]"
                          : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-violet-400/40 hover:bg-slate-800/80 hover:scale-[1.01]"
                      }
                      ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}
                    `}
                    disabled={opt.disabled}
                  >
                    {selected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md animate-in fade-in zoom-in duration-200">
                        ✓
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {opt.icon && <span className="text-lg">{opt.icon}</span>}
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
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
  const visibleQuestions = useMemo(
    () => questions.filter(isQuestionVisible),
    [questions, isQuestionVisible]
  );

  // DEV invariants: catch broken schemas immediately
  if (import.meta.env.DEV) {
    // Check image map completeness
    for (const k of CANONICAL_INDUSTRY_KEYS) {
      if (!INDUSTRY_IMAGES[k]) {
        console.error("[Step3Curated] Missing hero image for industry:", k);
      }
    }

    const missingId = questions.find((q) => !q.id);
    if (missingId) console.warn("[Step3Curated] question missing id", missingId);

    const badDepends = questions.find((q) => q.conditionalLogic && !q.conditionalLogic.dependsOn);
    if (badDepends) console.warn("[Step3Curated] conditionalLogic missing dependsOn", badDepends);
  }

  return (
    <div className="w-full">
      {/* Hero Header */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-950/40 mb-4">
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
              <div className="text-lg font-extrabold text-slate-50">Step 3 — Profile</div>
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
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">{visibleQuestions.map((q, idx) => renderQuestion(q, idx))}</div>

      {/* Continue Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          data-testid="step3-continue"
          onClick={() => {
            // Show add-ons modal first (user selects solar/gen/ev)
            if (!state.addOnsConfirmed) {
              setShowAddOnsModal(true);
            } else {
              // Already confirmed add-ons, proceed to step 4
              if (actions?.submitStep3) {
                void actions.submitStep3();
              }
            }
          }}
          disabled={!isComplete || state.pricingStatus === "pending"}
          className={`
            px-6 py-3 rounded-xl font-bold text-base transition-all
            ${
              isComplete && state.pricingStatus !== "pending"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
        >
          Continue →
        </button>
      </div>

      {/* Smart Add-Ons Modal */}
      {actions?.toggleSolar && actions?.toggleGenerator && actions?.toggleEV && actions?.confirmAddOns && (
        <SmartAddOnsModal
          isOpen={showAddOnsModal}
          goals={state.goals}
          industry={state.industry}
          peakDemandKW={state.peakLoadKW}
          includeSolar={state.includeSolar}
          includeGenerator={state.includeGenerator}
          includeEV={state.includeEV}
          onToggleSolar={actions.toggleSolar}
          onToggleGenerator={actions.toggleGenerator}
          onToggleEV={actions.toggleEV}
          onContinue={() => {
            // User confirmed choices, close modal and proceed to step 4
            actions.confirmAddOns?.(true);
            setShowAddOnsModal(false);
            if (actions?.submitStep3) {
              void actions.submitStep3();
            }
          }}
          onSkip={() => {
            // User skipped add-ons, still proceed to step 4
            actions.confirmAddOns?.(true);
            setShowAddOnsModal(false);
            if (actions?.submitStep3) {
              void actions.submitStep3();
            }
          }}
        />
      )}
    </div>
  );
}
