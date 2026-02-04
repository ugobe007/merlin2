/**
 * Step 3: Gated 4-Part Questionnaire (V7)
 * ========================================
 *
 * Created: January 31, 2026
 * Updated: January 31, 2026 - Hardened per Vineet's feedback
 *
 * ARCHITECTURE:
 * 1. Templates MAY define `parts` array - if missing, we derive 4 parts
 * 2. User progresses Part 1/4 → Part 2/4 → Part 3/4 → Part 4/4
 * 3. Defaults apply per-part when entering that part (keyed by template+part)
 * 4. Navigation gated: can't advance until current part is complete
 * 5. "Continue" advances to results (pricing runs async)
 *
 * KEY FIXES (Jan 31, 2026):
 * - Backward compatible: derives parts if template.parts missing
 * - Defaults keyed by `${template.industry}:${template.version}:${part.id}`
 * - Reset only affects current part fields with defaults
 * - User-edited fields tracked, never auto-overwritten
 * - DEV-only console warnings, no user-facing mismatch notes
 * - Part completion validates CURRENT part only
 *
 * SSOT CONTRACT:
 * - This component is a VIEW CONTROLLER only
 * - Does NOT re-implement SSOT calculators
 * - Applies defaults via setAnswers callback
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { IndustryTemplateV1, TemplatePart, TemplateQuestion, OptionItem } from "@/wizard/v7/templates/types";
import type { WizardV7LifeSignals } from "@/wizard/v7/hooks/useWizardV7";
import Step3SystemAssist from "@/components/wizard/v7/shared/Step3SystemAssist";

// =============================================================================
// TYPES
// =============================================================================

type Step3Answers = Record<string, unknown>;

interface Step3GatedProps {
  /** Template loaded from SSOT (includes parts, questions, defaults) */
  template: IndustryTemplateV1 | null;

  /** Current answers (controlled) */
  answers: Step3Answers;

  /**
   * SSOT ACTIONS (provenance-aware)
   * These stamp meta correctly so the face never lies.
   * 
   * NOTE: Signatures match useWizardV7 hook exports exactly:
   * - setStep3Answer(id, value) → onAnswerChange
   * - resetToDefaults({ partId }) → onResetPart  
   * - markDefaultsApplied(partId) → onDefaultsApplied
   * - hasDefaultsApplied(partId) → hasDefaultsApplied
   * - canResetToDefaults(partId) → canResetToDefaults
   * - canApplyDefaults(partId) → canApplyDefaults
   * - applyStep3Defaults(partId) → applyStep3Defaults
   * - getDefaultForQuestion(qId) → getDefaultForQuestion
   */
  /** Update single answer (stamps source="user") */
  onAnswerChange: (id: string, value: unknown) => void;
  
  /** Reset to defaults for a part (rewrites provenance) */
  onResetPart: (partId: string) => void;
  
  /** Mark defaults applied for a part (FSM tracking) */
  onDefaultsApplied: (partId: string) => void;
  
  /** Check if defaults already applied for a part (from SSOT) */
  hasDefaultsApplied: (partId: string) => boolean;

  /** SSOT-authoritative: Check if part has ANY defaults (for button visibility) */
  canResetToDefaults: (partId: string) => boolean;
  
  /** SSOT-authoritative: Check if defaults can be applied (exist + not yet applied) */
  canApplyDefaults: (partId: string) => boolean;
  
  /** SSOT action: Apply defaults for a part (batch apply + stamp provenance) */
  /** NOTE: Optional - if not provided, uses onResetPart as fallback */
  applyStep3Defaults?: (partId: string) => void;
  
  /** SSOT helper: Get default value for a specific question */
  getDefaultForQuestion: (questionId: string) => unknown;

  /** Called when user completes all 4 parts and clicks Continue */
  onComplete: () => void;

  /** Called when user clicks Back (on Part 1, goes to Step 2) */
  onBack: () => void;

  /** Optional: lifeSignals for expression (face can read truth) */
  lifeSignals?: WizardV7LifeSignals;

  /** Optional: Industry slug for DEV mismatch detection */
  selectedIndustrySlug?: string;

  /** Optional: Industry display name for header (uses template.industry if not provided) */
  industryDisplayName?: string;

  /** Optional: Is the system busy (e.g., generating quote) */
  isBusy?: boolean;
}

// =============================================================================
// INDUSTRY DISPLAY CONFIG
// =============================================================================

const INDUSTRY_ICONS: Record<string, string> = {
  hotel: "🏨",
  car_wash: "🚗",
  data_center: "💾",
  manufacturing: "🏭",
  warehouse: "📦",
  office: "🏢",
  retail: "🛒",
  restaurant: "🍽️",
  healthcare: "🏥",
  ev_charging: "⚡",
};

const INDUSTRY_NAMES: Record<string, string> = {
  hotel: "Hotel & Hospitality",
  car_wash: "Car Wash",
  data_center: "Data Center",
  manufacturing: "Manufacturing",
  warehouse: "Warehouse & Logistics",
  office: "Office Building",
  retail: "Retail",
  restaurant: "Restaurant",
  healthcare: "Healthcare",
  ev_charging: "EV Charging",
};

// =============================================================================
// HELPER: Check if a value is "empty" (needs default)
// =============================================================================

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// ============================================================================
// VALUE EQUALITY HELPERS (for modifiedFieldCount accuracy)
// Handles: primitives, arrays, objects, whitespace-empty strings
// ============================================================================

/** Treat null, undefined, and whitespace-only strings as "empty" */
const isEmptyish = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  return false;
};

/** Value-equality that respects arrays/objects and empty normalization */
const equalish = (a: unknown, b: unknown): boolean => {
  // Both empty = equal
  if (isEmptyish(a) && isEmptyish(b)) return true;
  
  // Primitives + NaN handling
  if (Object.is(a, b)) return true;
  
  // Arrays (shallow compare)
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Objects (stable stringify fallback)
  if (typeof a === "object" && typeof b === "object" && a && b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  
  return false;
};

// =============================================================================
// HELPER: Derive 4 parts from flat questions array (backward compatibility)
// =============================================================================

function deriveParts(questions: TemplateQuestion[]): TemplatePart[] {
  if (questions.length === 0) return [];

  const total = questions.length;
  const partSize = Math.ceil(total / 4);

  const partLabels = [
    { id: "derived_part1", label: "Basic Info", description: "Primary facility details" },
    { id: "derived_part2", label: "Operations", description: "How your facility operates" },
    { id: "derived_part3", label: "Systems", description: "Equipment and systems" },
    { id: "derived_part4", label: "Energy & Billing", description: "Current energy usage" },
  ];

  const parts: TemplatePart[] = [];
  for (let i = 0; i < 4; i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, total);
    if (start >= total) break;

    parts.push({
      ...partLabels[i],
      questionIds: questions.slice(start, end).map((q) => q.id),
    });
  }

  return parts;
}

// =============================================================================
// =============================================================================
// HELPER: Get questions for a specific part
// =============================================================================

function getQuestionsForPart(
  part: TemplatePart,
  allQuestions: TemplateQuestion[]
): TemplateQuestion[] {
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
  return part.questionIds
    .map((id) => questionMap.get(id))
    .filter((q): q is TemplateQuestion => q !== undefined);
}

// =============================================================================
// HELPER: Check if part is complete (all required questions IN THIS PART answered)
// =============================================================================

function isPartComplete(
  part: TemplatePart,
  questions: TemplateQuestion[],
  answers: Step3Answers
): { complete: boolean; missing: string[] } {
  const partQuestions = getQuestionsForPart(part, questions);
  const missing: string[] = [];

  for (const q of partQuestions) {
    if (!q.required) continue;
    if (isEmpty(answers[q.id])) {
      missing.push(q.label);
    }
  }

  return { complete: missing.length === 0, missing };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Step3GatedV7({
  template,
  answers,
  onAnswerChange,
  onResetPart,
  onDefaultsApplied,
  hasDefaultsApplied,
  canResetToDefaults,
  canApplyDefaults,
  applyStep3Defaults,
  getDefaultForQuestion,
  onComplete,
  onBack,
  lifeSignals,
  selectedIndustrySlug,
  industryDisplayName,
  isBusy = false,
}: Step3GatedProps) {
  // ---------------------------------------------------------------------------
  // STATE: Current part index (0-based, local UI state only)
  // ---------------------------------------------------------------------------
  const [partIndex, setPartIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // PROVENANCE: Now SSOT-owned via lifeSignals and callbacks
  // - hasDefaultsApplied(partId, templateId) replaces defaultsAppliedRef
  // - lifeSignals.userCorrections replaces touchedFieldsRef (source: 'user' in meta)
  // ---------------------------------------------------------------------------
  // Helper: check if field was user-corrected (replaces touchedFieldsRef lookup)
  const isFieldTouched = useCallback(
    (fieldId: string): boolean => {
      // If lifeSignals available, use O(1) lookup
      if (lifeSignals?.isFieldUserCorrected) {
        return lifeSignals.isFieldUserCorrected(fieldId);
      }
      // Fallback: check meta.source (shouldn't happen in V7 flow)
      return false;
    },
    [lifeSignals]
  );

  // ---------------------------------------------------------------------------
  // CLEAR PART INDEX ON TEMPLATE CHANGE (UI state only)
  // ---------------------------------------------------------------------------
  const templateIdentity = template?.id ?? `${template?.industry}.${template?.version}`;
  useEffect(() => {
    if (!template) return;
    // When template identity changes, reset to first part
    setPartIndex(0);
    if (import.meta.env.DEV) {
      console.log("[Step3Gated] Template changed, reset to part 0:", templateIdentity);
    }
  }, [templateIdentity]);

  // ---------------------------------------------------------------------------
  // DERIVED: Parts (from template or derived from questions)
  // ---------------------------------------------------------------------------
  const questions = template?.questions ?? [];
  const defaults = template?.defaults ?? {};

  // BACKWARD COMPAT: If template has no parts, derive them from questions
  const parts = useMemo(() => {
    if (!template) return [];
    if (template.parts && template.parts.length > 0) {
      return template.parts;
    }
    // Derive 4 parts from flat question list
    if (import.meta.env.DEV) {
      console.log("[Step3Gated] Template has no parts, deriving from questions");
    }
    return deriveParts(template.questions);
  }, [template]);

  // Fix #2: Memoize questionMap to avoid rebuilding on every render
  const questionMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );

  const getPartQuestions = useCallback(
    (part: TemplatePart) =>
      part.questionIds
        .map((id) => questionMap.get(id))
        .filter((q): q is TemplateQuestion => q !== undefined),
    [questionMap]
  );

  const currentPart = parts[partIndex] ?? null;
  const currentQuestions = useMemo(
    () => (currentPart ? getPartQuestions(currentPart) : []),
    [currentPart, getPartQuestions]
  );

  // Fix #1: Remove misleading || 4 fallback (we early-return if parts.length === 0)
  const totalParts = parts.length;
  const isLastPart = partIndex >= totalParts - 1;

  // Fix #2: Precompute part completion statuses for pills (avoids O(parts * questions) on every keystroke)
  const partStatuses = useMemo(() => {
    return parts.map((p) => {
      const pq = getPartQuestions(p);
      const missing: string[] = [];
      for (const q of pq) {
        if (q.required && isEmpty(answers[q.id])) {
          missing.push(q.label);
        }
      }
      return { partId: p.id, complete: missing.length === 0, missing };
    });
  }, [parts, getPartQuestions, answers]);

  // ---------------------------------------------------------------------------
  // COMPLETION STATUS (for current part only - uses precomputed partStatuses)
  // ---------------------------------------------------------------------------
  const completionStatus = useMemo(() => {
    if (!currentPart || partStatuses.length === 0) {
      return { complete: false, missing: [] as string[] };
    }
    const status = partStatuses[partIndex];
    return status ?? { complete: false, missing: [] as string[] };
  }, [currentPart, partStatuses, partIndex]);

  // ---------------------------------------------------------------------------
  // APPLY DEFAULTS FOR CURRENT PART (via SSOT callback)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentPart || !template) return;

    // Use SSOT callback to check if defaults already applied
    // NOTE: SSOT internally tracks by template+part, we just pass partId
    if (hasDefaultsApplied(currentPart.id)) return;

    const partQuestions = getPartQuestions(currentPart);
    let anyApplied = false;
    const applied: string[] = [];

    for (const q of partQuestions) {
      // Only fill empty fields that haven't been touched by user
      const untouched = !isFieldTouched(q.id);
      const hasDefault = defaults[q.id] !== undefined;
      const isEmptyValue = isEmpty(answers[q.id]);

      if (isEmptyValue && hasDefault && untouched) {
        // Apply via SSOT callback (provenance will be 'default')
        onAnswerChange(q.id, defaults[q.id]);
        anyApplied = true;
        applied.push(q.id);
      }
    }

    // Mark defaults as applied via SSOT callback
    if (anyApplied) {
      onDefaultsApplied(currentPart.id);
      if (import.meta.env.DEV) {
        console.log(`[Step3Gated] Applied defaults for Part ${partIndex + 1} (${currentPart.id}):`, applied);
      }
    }
  }, [partIndex, currentPart, template, getPartQuestions, defaults, answers, hasDefaultsApplied, onAnswerChange, onDefaultsApplied, isFieldTouched]);

  // ---------------------------------------------------------------------------
  // HANDLERS (delegate to SSOT callbacks)
  // ---------------------------------------------------------------------------

  const handleAnswerChange = useCallback(
    (questionId: string, value: unknown) => {
      // Delegate to SSOT - provenance tracking handled there
      onAnswerChange(questionId, value);
    },
    [onAnswerChange]
  );

  const handleResetPartToDefaults = useCallback(() => {
    if (!currentPart) return;
    // Delegate to SSOT callback - ALWAYS use { partId } scope, NEVER "all"
    onResetPart(currentPart.id);
    if (import.meta.env.DEV) {
      console.log(`[Step3Gated] Reset Part ${partIndex + 1} to defaults (via SSOT)`);
    }
  }, [currentPart, onResetPart, partIndex]);

  // System Assist: Apply defaults for current part
  // Uses applyStep3Defaults if provided, otherwise falls back to onResetPart
  const handleApplyDefaults = useCallback(() => {
    if (!currentPart) return;
    if (applyStep3Defaults) {
      applyStep3Defaults(currentPart.id);
    } else {
      // Fallback: reset to defaults is semantically equivalent
      onResetPart(currentPart.id);
    }
    if (import.meta.env.DEV) {
      console.log(`[Step3Gated] Apply defaults for Part ${partIndex + 1} (via SSOT)`);
    }
  }, [currentPart, applyStep3Defaults, onResetPart, partIndex]);

  // ---------------------------------------------------------------------------
  // DETERMINISTIC MODIFIED FIELD COUNT (for System Assist)
  // RULE: count(partQuestions where answer != getDefaultForQuestion(qId))
  // Uses equalish() to handle arrays/objects and whitespace normalization.
  // ---------------------------------------------------------------------------
  const modifiedFieldCount = useMemo(() => {
    if (!currentPart) return 0;
    
    let count = 0;
    for (const q of currentQuestions) {
      const currentValue = answers[q.id];
      const defaultValue = getDefaultForQuestion(q.id);
      
      // Compare using equalish (handles arrays, objects, whitespace)
      if (!equalish(currentValue, defaultValue)) {
        count++;
      }
    }
    
    return count;
  }, [currentPart, currentQuestions, answers, getDefaultForQuestion]);

  const handleNextPart = useCallback(() => {
    if (!completionStatus.complete) return;
    if (isLastPart) {
      onComplete();
    } else {
      setPartIndex((i) => Math.min(i + 1, totalParts - 1));
    }
  }, [completionStatus.complete, isLastPart, onComplete, totalParts]);

  const handlePrevPart = useCallback(() => {
    if (partIndex === 0) {
      onBack();
    } else {
      setPartIndex((i) => Math.max(i - 1, 0));
    }
  }, [partIndex, onBack]);

  // ---------------------------------------------------------------------------
  // DEV-ONLY: Template mismatch warning (Fix #4: compare slugs, not display names)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!template || !selectedIndustrySlug) return;

    if (template.industry !== selectedIndustrySlug) {
      console.warn("[Step3Gated] TEMPLATE MISMATCH:", {
        selected: selectedIndustrySlug,
        template: template.industry,
        templateVersion: template.version,
      });
    }
  }, [template, selectedIndustrySlug]);

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (!template) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <div className="text-lg font-semibold text-white">Loading questionnaire...</div>
          <div className="text-sm text-slate-400 mt-2">Waiting for template</div>
        </div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-semibold text-white">Template Error</div>
          <div className="text-sm text-slate-400 mt-2">
            Template has no questions. Check template configuration.
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  const industry = template.industry;
  const displayIndustryName = industryDisplayName || INDUSTRY_NAMES[industry] || industry;
  const industryIcon = INDUSTRY_ICONS[industry] || "🏢";

  return (
    <div className="h-full min-h-0 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      {/* =========================================
          TOP BAR: Industry + Part Progress
          ========================================= */}
      <div className="flex-shrink-0 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Industry badge */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{industryIcon}</span>
              <div>
                <div className="text-lg font-semibold text-white">{displayIndustryName}</div>
                <div className="text-sm text-slate-400">
                  Part {partIndex + 1} of {totalParts}
                </div>
              </div>
            </div>

            {/* Part progress pills (uses precomputed partStatuses) */}
            <div className="flex items-center gap-2">
              {parts.map((part, i) => {
                const status = partStatuses[i];
                const isCurrent = i === partIndex;
                const isCompleted = i < partIndex || status?.complete;

                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      // Allow jumping back, but not forward unless complete
                      if (i <= partIndex) setPartIndex(i);
                    }}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      isCurrent
                        ? "bg-purple-600 text-white"
                        : isCompleted
                          ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
                          : "bg-white/5 text-slate-500",
                    ].join(" ")}
                    title={part.label}
                  >
                    {isCompleted && !isCurrent ? "✓" : i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          MAIN CONTENT: Current Part Questions
          ========================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* System Assist Strip - Apply/Reset Defaults for current part */}
          {currentPart && (
            <Step3SystemAssist
              partLabel={currentPart.label}
              canApply={canApplyDefaults(currentPart.id)}
              canReset={canResetToDefaults(currentPart.id)}
              hasApplied={hasDefaultsApplied(currentPart.id)}
              onApply={handleApplyDefaults}
              onReset={handleResetPartToDefaults}
              modifiedFieldCount={modifiedFieldCount}
            />
          )}
          
          {/* Part Header */}
          {currentPart && (
            <div className="mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentPart.label}</h2>
                {currentPart.description && (
                  <p className="text-slate-400 mt-1">{currentPart.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {currentQuestions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(v) => handleAnswerChange(q.id, v)}
              />
            ))}
          </div>

          {/* Part Completion Status */}
          {!completionStatus.complete && completionStatus.missing.length > 0 && (
            <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-sm font-semibold text-amber-300 mb-2">
                Complete these to continue:
              </div>
              <ul className="text-sm text-amber-200/80 list-disc list-inside space-y-1">
                {completionStatus.missing.slice(0, 4).map((label) => (
                  <li key={label}>{label}</li>
                ))}
                {completionStatus.missing.length > 4 && (
                  <li>+{completionStatus.missing.length - 4} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          BOTTOM BAR: Navigation
          ========================================= */}
      <div className="flex-shrink-0 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              onClick={handlePrevPart}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
            >
              ← {partIndex === 0 ? "Back to Step 2" : "Previous Part"}
            </button>

            {/* Progress indicator */}
            <div className="text-sm text-slate-400">
              {currentQuestions.filter((q) => q.required && !isEmpty(answers[q.id])).length} /{" "}
              {currentQuestions.filter((q) => q.required).length} required
            </div>

            {/* Next / Generate button */}
            <button
              onClick={handleNextPart}
              disabled={!completionStatus.complete || isBusy}
              className={[
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                completionStatus.complete && !isBusy
                  ? isLastPart
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                    : "bg-purple-600 text-white hover:bg-purple-500"
                  : "bg-white/5 text-slate-500 cursor-not-allowed",
              ].join(" ")}
            >
              {isBusy ? (
                <>
                  <span className="animate-spin inline-block mr-2">⟳</span>
                  Generating...
                </>
              ) : isLastPart ? (
                <>See Results →</>
              ) : (
                <>Next Part →</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// QUESTION FIELD COMPONENT
// =============================================================================

// OptionItem imported from @/wizard/v7/templates/types
function normalizeOption(opt: OptionItem): { value: string; label: string } {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

interface QuestionFieldProps {
  question: TemplateQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

function QuestionField({ question, value, onChange }: QuestionFieldProps) {
  const { id, label, type, required, unit, options, min, max, hint } = question;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-semibold text-slate-200">
        {label}
        {required && <span className="text-purple-400 ml-1">*</span>}
        {unit && <span className="text-slate-500 font-normal ml-1">({unit})</span>}
      </label>

      {/* Input based on type */}
      {type === "number" && (
        <input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          min={min}
          max={max}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw.trim() === "") return onChange(undefined);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          placeholder={hint || `Enter ${label.toLowerCase()}`}
        />
      )}

      {type === "text" && (
        <input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
          placeholder={hint || `Enter ${label.toLowerCase()}`}
        />
      )}

      {type === "select" && options && (
        <select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
        >
          <option value="">Select {label.toLowerCase()}...</option>
          {options.map((opt) => {
            const { value: v, label: l } = normalizeOption(opt as OptionItem);
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      )}

      {type === "boolean" && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={id}
              checked={value === true}
              onChange={() => onChange(true)}
              className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-300">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={id}
              checked={value === false}
              onChange={() => onChange(false)}
              className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-300">No</span>
          </label>
        </div>
      )}

      {type === "multiselect" && options && (
        <div className="space-y-2">
          {options.map((opt) => {
            const { value: v, label: l } = normalizeOption(opt as OptionItem);
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(v);
            return (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...arr, v]
                      : arr.filter((x) => x !== v);
                    onChange(next);
                  }}
                  className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">{l}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Hint */}
      {hint && type !== "number" && type !== "text" && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
