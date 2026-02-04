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

import React, { useMemo, useCallback } from "react";
import { 
  resolveStep3Schema, 
  CANONICAL_INDUSTRY_KEYS,
  getTier1Blockers,
  isBlockerQuestion,
  type CuratedField, 
  type CuratedSchema,
  type CanonicalIndustryKey,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import type { WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";

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
  "gas-station": hotelImg,       // TODO: add gas station image
  office: officeImg,
  manufacturing: manufacturingImg,
  restaurant: restaurantImg,
  college: hotelImg,             // TODO: add college image
  agriculture: hotelImg,         // TODO: add agriculture image
  "cold-storage": warehouseImg,  // uses warehouse as fallback
  apartment: hotelImg,           // TODO: add apartment image
  residential: hotelImg,         // TODO: add residential image
  "indoor-farm": hotelImg,       // TODO: add indoor farm image
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

// Normalize field type to prevent mis-rendering from legacy/variant type names
function normalizeFieldType(t?: string): string {
  const x = (t || "").toLowerCase();
  if (x === "multi-select") return "multiselect";
  if (x === "dropdown") return "select";
  if (x === "radio") return "buttons";
  if (x === "boolean" || x === "yesno" || x === "switch") return "toggle";
  if (x === "range") return "slider";
  return x || "text";
}

export default function Step3ProfileV7Curated(props: Props) {
  const { state, actions, updateState } = props;
  
  // Get industry from state (fix operator precedence)
  const industry =
    ((state as Record<string, unknown>).industry as string | undefined) ?? "other";
  
  // Get answers from state (fix operator precedence)
  const answers: Step3Answers =
    ((state as Record<string, unknown>).step3Answers as Step3Answers | undefined) ?? {};
  
  // ✅ RESOLVE CURATED SCHEMA (NOT from backend template)
  const schema: CuratedSchema = useMemo(() => {
    return resolveStep3Schema(industry);
  }, [industry]);
  
  const { questions, displayName, icon, source } = schema;
  // Note: sections available via schema.sections when needed for grouped rendering
  
  // Get hero image (keyed off normalized schema.industry - type-enforced)
  const heroKey = schema.industry as CanonicalIndustryKey;
  const heroImg = INDUSTRY_IMAGES[heroKey] ?? INDUSTRY_IMAGES.other;
  
  // Check conditional visibility (fail-open to avoid deadlocks)
  const isQuestionVisible = useCallback((q: CuratedField): boolean => {
    const c = q.conditionalLogic;
    // No conditional = always visible
    if (!c?.dependsOn || typeof c.showIf !== "function") return true;
    
    try {
      return !!c.showIf(answers[c.dependsOn]);
    } catch (e) {
      // Fail-open: show question if conditional throws (prevents UI deadlocks)
      if (import.meta.env.DEV) {
        console.warn("[Step3Curated] conditionalLogic threw", { id: q.id, dependsOn: c.dependsOn, e });
      }
      return true;
    }
  }, [answers]);
  
  // Get options (applies modifyOptions if present - enables dynamic option mutation)
  const getOptions = useCallback((q: CuratedField) => {
    const base = q.options ?? [];
    const c = q.conditionalLogic;
    if (!c?.modifyOptions || !c.dependsOn) return base;
    
    try {
      const next = c.modifyOptions(answers[c.dependsOn]);
      return Array.isArray(next) ? next : base;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("[Step3Curated] modifyOptions threw", { id: q.id, dependsOn: c.dependsOn, e });
      }
      return base; // fail-open
    }
  }, [answers]);
  
  // Answer setter (prefer actions.setStep3Answer; updateState is legacy fallback)
  const setAnswer = useCallback((id: string, value: unknown) => {
    if (actions?.setStep3Answer) {
      actions.setStep3Answer(id, value);
      return;
    }
    // Legacy fallback - may drop rapid updates if batched
    if (import.meta.env.DEV && updateState && !actions?.setStep3Answer) {
      console.warn("[Step3Curated] updateState fallback in use; may drop rapid updates.");
    }
    if (updateState) {
      const nextAnswers = { ...answers, [id]: value };
      updateState({ step3Answers: nextAnswers } as Partial<WizardV7State>);
    }
  }, [actions, updateState, answers]);
  
  // Required fields (ALL required - stable count for debugging)
  const requiredIds = useMemo(() => {
    return questions.filter(isRequired).map(q => q.id);
  }, [questions]);
  
  // Tier 1 blockers (gates completion)
  const blockerIds = useMemo(() => {
    const tier1 = getTier1Blockers(industry);
    return tier1.filter(id => questions.some(q => q.id === id));
  }, [industry, questions]);
  
  // Tier 2 recommended (visible, doesn't gate)
  const recommendedIds = useMemo(() => {
    return requiredIds.filter(id => !blockerIds.includes(id));
  }, [requiredIds, blockerIds]);
  
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
      .filter(q => !isAnswered(answers[q.id]))
      .map(q => q.id);
  }, [questions, answers, isQuestionVisible]);
  
  // Progress metrics (uses blockers if available, else all required)
  const effectiveRequired = blockerIds.length > 0 ? blockerIds.length : visibleRequiredCount;
  const effectiveMissing = blockerIds.length > 0 ? missingBlockers.length : missingRequired.length;
  const answeredRequired = effectiveRequired - effectiveMissing;
  const progressPct = effectiveRequired === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round((answeredRequired / effectiveRequired) * 100)));
  
  // Completion status (uses blockers if available)
  const isComplete = blockerIds.length > 0 
    ? missingBlockers.length === 0 
    : missingRequired.length === 0;
  
  // DEV invariants: catch schema corruption instantly
  if (import.meta.env.DEV) {
    const ids = questions.map(q => q.id);
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
    
    // Get options (applies modifyOptions if present - enables dynamic option mutation)
    const options = getOptions(q);
    
    // Determine input type (normalized to prevent legacy/variant type mis-rendering)
    const inputType = normalizeFieldType(q.type || (options.length ? "select" : "text"));
    
    return (
      <div 
        key={q.id} 
        className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40 transition-all hover:border-violet-500/40"
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
              {hasValue && (
                <span className="text-green-400 text-sm">✓</span>
              )}
            </div>
            
            {/* Title */}
            <div className="text-sm font-semibold text-slate-100">
              {label}
            </div>
            
            {/* Subtitle */}
            {q.subtitle && (
              <div className="text-xs text-slate-400 mt-1">
                {q.subtitle}
              </div>
            )}
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
          {/* Buttons (for options with icons) - coerce values to string */}
          {(inputType === 'buttons' || inputType === 'select') && options.length > 0 && options.length <= 6 && (
            <div className="grid grid-cols-2 gap-2">
              {options.map(opt => {
                const optVal = String(opt.value);
                const selected = asString(value) === optVal;
                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => setAnswer(q.id, optVal)}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${selected
                        ? 'border-violet-500 bg-violet-500/20 text-white'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                      }
                      ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={opt.disabled}
                  >
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
          
          {/* Select dropdown (for many options) - coerce values to string */}
          {inputType === 'select' && options.length > 6 && (
            <select
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
              value={asString(value)}
              onChange={e => setAnswer(q.id, e.target.value)}
            >
              <option value="">Select…</option>
              {options.map(opt => {
                const optVal = String(opt.value);
                return (
                  <option key={optVal} value={optVal}>
                    {opt.icon ? `${opt.icon} ` : ''}{opt.label}
                  </option>
                );
              })}
            </select>
          )}
          
          {/* Number input */}
          {inputType === 'number' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
                placeholder={q.placeholder || ''}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '') return setAnswer(q.id, '');
                  const n = Number(raw);
                  setAnswer(q.id, Number.isFinite(n) ? n : raw);
                }}
                min={q.range?.min ?? q.validation?.min}
                max={q.range?.max ?? q.validation?.max}
              />
              {(q.suffix || q.unit) && (
                <span className="text-slate-400 text-sm">{q.suffix || q.unit}</span>
              )}
            </div>
          )}
          
          {/* Slider */}
          {inputType === 'slider' && q.range && (
            <div className="space-y-2">
              <input
                type="range"
                className="w-full accent-violet-500"
                min={q.range.min}
                max={q.range.max}
                step={q.range.step}
                value={typeof value === 'number' ? value : (typeof q.smartDefault === 'number' ? q.smartDefault : q.range.min)}
                onChange={e => setAnswer(q.id, Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{q.range.min}{q.unit || ''}</span>
                <span className="text-violet-300 font-medium">
                  {typeof value === 'number' ? value : (typeof q.smartDefault === 'number' ? q.smartDefault : q.range.min)}{q.unit || ''}
                </span>
                <span>{q.range.max}{q.unit || ''}</span>
              </div>
            </div>
          )}
          
          {/* Toggle (stores boolean) */}
          {inputType === 'toggle' && (
            <div className="flex gap-2">
              {[true, false].map(opt => (
                <button
                  key={String(opt)}
                  type="button"
                  onClick={() => setAnswer(q.id, opt)}
                  className={`
                    flex-1 p-3 rounded-lg border transition-all
                    ${value === opt
                      ? 'border-violet-500 bg-violet-500/20 text-white'
                      : 'border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                    }
                  `}
                >
                  <span className="text-lg mr-2">{opt ? '✅' : '❌'}</span>
                  <span className="font-medium">{opt ? 'Yes' : 'No'}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Text input (fallback) */}
          {inputType === 'text' && (
            <input
              type="text"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2.5 text-slate-100"
              placeholder={q.placeholder || ''}
              value={asString(value)}
              onChange={e => setAnswer(q.id, e.target.value)}
            />
          )}
          
          {/* Multiselect (values coerced to strings for consistent comparison) */}
          {inputType === 'multiselect' && options.length > 0 && (
            <div className="space-y-2">
              {options.map(opt => {
                const optVal = String(opt.value);
                const selected = Array.isArray(value) && value.map(String).includes(optVal);
                return (
                  <label
                    key={optVal}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selected
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-slate-700/60 bg-slate-900/60 hover:border-slate-500'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="accent-violet-500"
                      checked={selected}
                      onChange={e => {
                        const current = Array.isArray(value) ? value.map(String) : [];
                        if (e.target.checked) {
                          setAnswer(q.id, [...current, optVal]);
                        } else {
                          setAnswer(q.id, current.filter(v => v !== optVal));
                        }
                      }}
                    />
                    {opt.icon && <span className="text-lg">{opt.icon}</span>}
                    <span className="text-sm text-slate-200">{opt.label}</span>
                    {opt.description && (
                      <span className="text-xs text-slate-400">— {opt.description}</span>
                    )}
                  </label>
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
    
    const missingId = questions.find(q => !q.id);
    if (missingId) console.warn("[Step3Curated] question missing id", missingId);
    
    const badDepends = questions.find(q => q.conditionalLogic && !q.conditionalLogic.dependsOn);
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
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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
              <span className={`
                px-2 py-1 text-xs font-mono rounded
                ${source === 'curated-complete' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  source === 'curated-legacy' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'}
              `}>
                {source}
              </span>
            </div>
          )}
        </div>
        
        {/* Progress banner */}
        <div className="p-4 border-t border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">
              <span className="text-violet-300 font-semibold">{visibleQuestions.length}</span> questions
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
      <div className="space-y-4">
        {visibleQuestions.map((q, idx) => renderQuestion(q, idx))}
      </div>
      
      {/* Continue Button */}
      <div className="mt-6 flex justify-end">
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
            px-6 py-3 rounded-xl font-bold text-base transition-all
            ${isComplete && state.pricingStatus !== "pending"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 cursor-pointer"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
        >
          See Results →
        </button>
      </div>
      
      {/* DEV Diagnostics */}
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl border border-slate-700/40 bg-slate-950/40 p-4 text-xs font-mono text-slate-400">
          <div className="text-slate-300 font-bold mb-2">🔧 DEV: Curated Schema Resolver</div>
          <div>Industry: <span className="text-violet-300">{industry}</span> → <span className="text-green-300">{heroKey}</span> (normalized)</div>
          <div>Source: <span className={source === 'curated-complete' ? 'text-green-300' : source === 'curated-legacy' ? 'text-blue-300' : 'text-amber-300'}>{source}</span></div>
          <div>Questions: {questions.length} total, {visibleQuestions.length} visible</div>
          <div>Required: {requiredIds.length} total, {visibleRequiredCount} visible</div>
          <div className="text-violet-300 font-bold mt-1">Tier 1 Blockers: {blockerIds.length > 0 ? `${answeredRequired}/${effectiveRequired}` : 'Not configured'}</div>
          {blockerIds.length > 0 && (
            <div className="text-blue-300">Tier 2 Recommended: {recommendedIds.length}</div>
          )}
          <div>Progress: <span className="text-violet-300">{progressPct.toFixed(0)}%</span></div>
          <div>Complete: <span className={isComplete ? 'text-green-300' : 'text-red-300'}>{String(isComplete)}</span></div>
          {missingBlockers.length > 0 && (
            <div className="mt-2 text-red-300">
              Missing Blockers: {missingBlockers.join(', ')}
            </div>
          )}
          {missingRequired.length > 0 && blockerIds.length === 0 && (
            <div className="mt-2 text-amber-300">
              Missing: {missingRequired.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
