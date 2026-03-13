/**
 * WIZARD V8 — STEP 3: FACILITY PROFILE
 *
 * V7 CURATED SCHEMA ARCHITECTURE (March 1, 2026)
 * Ported from Step3ProfileV7Curated.tsx with V8 state wiring
 *
 * Features:
 *  • Auto-fills industry-typical defaults from curatedFieldsResolver
 *  • Merlin confirmation banner before continuing
 *  • Solar sizing modal integration (optional)
 *  • Progress tracking (required fields)
 *  • QuestionCard renderer with icons, tips, conditional logic
 *
 * RULE: This is V7's Step3 implementation. Do NOT simplify or change the flow.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { WizardState, WizardActions } from "../wizardState";
import {
  resolveStep3Schema,
  type CuratedField,
  type CuratedSchema,
  type CanonicalIndustryKey,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import QuestionCard from "@/components/wizard/v7/steps/QuestionCard";
import { 
  INDUSTRY_IMAGES 
} from "@/components/wizard/v7/steps/step3Constants";
import { isAnswered, isRequired } from "@/components/wizard/v7/steps/step3Helpers";
import merlinIcon from "@/assets/images/new_small_profile_.png";


interface Props {
  state: WizardState;
  actions: WizardActions;
}

export function Step3V8({ state, actions }: Props) {
  const { industry, step3Answers: answers, baseLoadKW } = state;

  // Resolve curated schema (SSOT for questions, defaults, validation)
  const curatedSchema: CuratedSchema = useMemo(() => {
    console.log('[Step3V8] Resolving schema for industry:', industry);
    if (!industry) {
      console.log('[Step3V8] No industry set, using fallback');
      return {
        industry: "other",
        displayName: "Other",
        icon: "🏢",
        questions: [],
        sections: [],
        questionCount: 0,
        requiredCount: 0,
        source: "fallback" as const,
      };
    }
    const schema = resolveStep3Schema(industry);
    console.log('[Step3V8] Resolved schema:', {
      industry,
      displayName: schema.displayName,
      questionCount: schema.questionCount,
      source: schema.source,
      questionsLength: schema.questions?.length || 0,
    });
    return schema;
  }, [industry]);

  const { displayName, icon } = curatedSchema;

  // Normalize questions (same as V7)
  const questions: CuratedField[] = useMemo(() => {
    const raw = (curatedSchema as unknown as Record<string, unknown>)?.questions ?? (curatedSchema as unknown as Record<string, unknown>)?.fields ?? [];
    console.log('[Step3V8] Raw questions from schema:', Array.isArray(raw) ? raw.length : 0);
    const normalized = (raw as Array<Record<string, unknown>>).map((q: Record<string, unknown>, idx: number) => {
      const rawId = q?.id ?? q?.key ?? q?.fieldId ?? q?.name;
      const id = rawId && String(rawId) !== "undefined" ? rawId : `${industry}_${idx}`;
      const title = q?.title ?? q?.label ?? q?.prompt ?? q?.question;
      const optionsRaw = q?.options ?? q?.choices ?? q?.values ?? q?.items;
      
      return {
        ...q,
        id: String(id),
        title,
        label: q?.label ?? title,
        type: q?.type ?? q?.inputType ?? q?.kind ?? "text",
        required: Boolean(q?.required ?? q?.isRequired ?? false),
        options: optionsRaw,
      } as CuratedField;
    });
    console.log('[Step3V8] Normalized questions:', normalized.length);
    return normalized;
  }, [curatedSchema, industry]);

  // Track auto-filled defaults
  const [defaultFilledIds, setDefaultFilledIds] = useState<Set<string>>(new Set());
  const appliedSchemaRef = useRef<string>("");
  const [defaultsReviewed, setDefaultsReviewed] = useState(false);

  // Auto-apply smart defaults on load
  useEffect(() => {
    const templateKey = `${industry}-${questions.length}`;
    if (appliedSchemaRef.current === templateKey) return;

    const toApply: Record<string, unknown> = {};
    const newDefaultIds = new Set<string>();

    for (const q of questions) {
      if (
        q.smartDefault !== undefined &&
        q.smartDefault !== null &&
        q.smartDefault !== "" &&
        !isAnswered(answers[q.id])
      ) {
        toApply[q.id] = q.smartDefault;
        newDefaultIds.add(q.id);
      }
    }

    if (Object.keys(toApply).length > 0) {
      for (const [id, value] of Object.entries(toApply)) {
        actions.setAnswer(id, value);
      }
      setDefaultFilledIds(newDefaultIds);
    }
    appliedSchemaRef.current = templateKey;
  }, [industry, questions.length, questions, answers, actions]);

  // Answer setter with tracking
  const setAnswerWithTracking = useCallback(
    (id: string, value: unknown) => {
      setDefaultFilledIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      actions.setAnswer(id, value);
    },
    [actions]
  );

  // Check conditional visibility
  const isQuestionVisible = useCallback(
    (q: CuratedField): boolean => {
      const c = q.conditionalLogic;
      if (!c?.dependsOn || typeof c.showIf !== "function") return true;
      try {
        return !!c.showIf(answers[c.dependsOn]);
      } catch {
        return true; // Fail-open
      }
    },
    [answers]
  );

  // Get dynamic options
  const getOptions = useCallback(
    (q: CuratedField) => {
      const base = q.options ?? [];
      const c = q.conditionalLogic;
      if (!c?.modifyOptions || !c.dependsOn) return base;
      try {
        const next = c.modifyOptions(answers[c.dependsOn]);
        return Array.isArray(next) ? next : base;
      } catch {
        return base;
      }
    },
    [answers]
  );

  // Visible questions
  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.id && q.id !== "undefined").filter(isQuestionVisible),
    [questions, isQuestionVisible]
  );

  // Required fields + completion
  const missingRequired = useMemo(() => {
    return questions
      .filter(isRequired)
      .filter(isQuestionVisible)
      .filter((q) => !isAnswered(answers[q.id]))
      .map((q) => q.id);
  }, [questions, answers, isQuestionVisible]);

  const visibleRequiredCount = useMemo(
    () => questions.filter(isRequired).filter(isQuestionVisible).length,
    [questions, isQuestionVisible]
  );

  const answeredRequired = visibleRequiredCount - missingRequired.length;
  const progressPct =
    visibleRequiredCount === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((answeredRequired / visibleRequiredCount) * 100)));

  const isComplete = missingRequired.length === 0;

  // Hero image - convert V8 underscored slug to V7 hyphenated key
  const heroKey = ((industry ?? "other").replace(/_/g, "-")) as CanonicalIndustryKey;
  const heroImg = INDUSTRY_IMAGES[heroKey] ?? INDUSTRY_IMAGES.other;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 40px" }}>
      {/* Hero Header with Industry Image */}
      <div 
        style={{ 
          marginBottom: 24,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          background: "rgba(15, 23, 42, 0.6)",
        }}
      >
        {/* Industry Image Background */}
        <div style={{ position: "relative", height: 160, width: "100%" }}>
          <img
            src={heroImg}
            alt={displayName}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              opacity: 0.6,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div 
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.6) 50%, transparent 100%)",
            }}
          />
          
          {/* Icon + Title Overlay */}
          <div style={{ position: "absolute", left: 24, top: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{icon || "🏢"}</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.5px" }}>
                Step 3 — Profile
              </div>
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
              {displayName}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Banner - Always Visible */}
      <div
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
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
              We filled out the answers for you based on industry defaults
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.70)",
              }}
            >
              Feel free to adjust them to your specific requirements or accept them to build your quote. Every facility is unique — review these values and make changes where needed.
            </div>
          </div>
        </div>
      </div>

      {/* Pre-filled hint (shows count when defaults applied) */}
      {defaultFilledIds.size > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.20)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ color: "#06B6D4", flexShrink: 0 }}
          >
            <path
              d="M8 1L10.18 5.42L15 6.11L11.5 9.52L12.36 14.31L8 12.01L3.64 14.31L4.5 9.52L1 6.11L5.82 5.42L8 1Z"
              fill="currentColor"
              opacity="0.7"
            />
          </svg>
          <p style={{ fontSize: 12, color: "rgba(6, 182, 212, 0.90)", margin: 0 }}>
            <span style={{ fontWeight: 600, color: "rgba(6, 182, 212, 1)" }}>
              Pre-filled {defaultFilledIds.size} answers with industry defaults.
            </span>{" "}
            Review and adjust any values that differ for your facility.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(232,235,243,0.40)" }}>
            PROGRESS
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#3ECF8E" }}>
            {answeredRequired} / {visibleRequiredCount} required
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 20,
            background: "rgba(255,255,255,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "linear-gradient(90deg,#3ECF8E,#4F8CFF)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Live power badge */}
      {baseLoadKW > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(62,207,142,0.06)",
            border: "1px solid rgba(62,207,142,0.20)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Sparkles className="w-5 h-5" style={{ color: "#3ECF8E" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,235,243,0.92)" }}>
              Estimated Peak Load: {Math.round(baseLoadKW).toLocaleString()} kW
            </div>
            <div style={{ fontSize: 11, color: "rgba(232,235,243,0.50)" }}>
              Updates as you answer questions
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {visibleQuestions.length === 0 ? (
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "rgba(251,191,36,0.05)",
              border: "1px solid rgba(251,191,36,0.20)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(251,191,36,0.95)", marginBottom: 6 }}>
              No questions found for {displayName}
            </div>
            <div style={{ fontSize: 12, color: "rgba(232,235,243,0.60)", marginBottom: 16 }}>
              The questionnaire for this industry is still being configured.
            </div>
            <button
              type="button"
              onClick={() => actions.goToStep(2)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid rgba(251,191,36,0.40)",
                background: "transparent",
                color: "rgba(251,191,36,0.95)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Back to Industry Selection
            </button>
          </div>
        ) : (
          visibleQuestions.map((q, index) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={index}
              answers={answers}
              defaultFilledIds={defaultFilledIds}
              onAnswer={setAnswerWithTracking}
              getOptions={getOptions}
            />
          ))
        )}
      </div>

      {/* Completion banner */}
      {isComplete && !defaultsReviewed && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(6,182,212,0.30)",
            background: "rgba(6,182,212,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
            <img src={merlinIcon} alt="Merlin" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(6,232,212,0.95)", margin: 0 }}>
                {defaultFilledIds.size > 0
                  ? `Merlin pre-filled ${defaultFilledIds.size} answer${defaultFilledIds.size === 1 ? "" : "s"} using industry defaults`
                  : "Looking good — your profile is complete"}
              </p>
              <p style={{ fontSize: 12, color: "rgba(232,235,243,0.60)", margin: "6px 0 12px", lineHeight: 1.5 }}>
                {defaultFilledIds.size > 0
                  ? "These are typical values for your industry. You can scroll up to review and adjust anything that doesn't match your facility, or continue with these defaults for a fast estimate."
                  : "Your answers are ready. Continue to see your custom BESS options, or scroll up to review your inputs."}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (baseLoadKW <= 0) {
                      alert("Still calculating your power requirements. Please wait a moment or try answering more questions.");
                      return;
                    }
                    setDefaultsReviewed(true);
                    // Always go to Step 3.5 to show add-on options
                    actions.goToStep(4);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "2px solid #3ECF8E",
                    background: "transparent",
                    color: "#3ECF8E",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(62,207,142,0.10)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Looks good — Continue →
                </button>
                {defaultFilledIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultsReviewed(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "transparent",
                      color: "rgba(232,235,243,0.70)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Let me review first
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plain continue button (after review) */}
      {defaultsReviewed && (
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <button
            type="button"
            onClick={() => {
              if (baseLoadKW <= 0) {
                alert("Still calculating your power requirements. Please wait a moment or try answering more questions.");
                return;
              }
              // Always go to Step 4 (Add-ons) to show recommendations
              actions.goToStep(4);
            }}
            disabled={!isComplete}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              border: isComplete ? "2px solid #3ECF8E" : "2px solid rgba(255,255,255,0.10)",
              background: "transparent",
              color: isComplete ? "#3ECF8E" : "rgba(232,235,243,0.25)",
              cursor: isComplete ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Continue to Options →
          </button>
        </div>
      )}
    </div>
  );
}

export default Step3V8;
