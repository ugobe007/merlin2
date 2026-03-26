/**
 * WIZARD V8 — STEP 3: FACILITY PROFILE (SECTION-GUIDED)
 *
 * SECTION-BY-SECTION GUIDED DESIGN
 * Shows one section at a time with pill nav and forward/back controls.
 *
 * Features:
 *  • Section pill nav at top — shows completion per section
 *  • One section visible at a time with icon, title, description
 *  • Per-section progress counter "X of Y answered"
 *  • Back / Next Section navigation at bottom
 *  • Auto-scroll to section top on navigate
 *  • Smart defaults & restore still work as before
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WizardState, WizardActions } from "../wizardState";
import {
  resolveStep3Schema,
  type CuratedField,
  type CuratedSchema,
  type CuratedSection,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import QuestionCard from "@/components/wizard/v7/steps/QuestionCard";
import { isAnswered } from "@/components/wizard/v7/steps/step3Helpers";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export function Step3V8({ state, actions }: Props) {
  const { industry, step3Answers: answers } = state;

  // Resolve curated schema
  const curatedSchema: CuratedSchema = useMemo(() => {
    if (!industry) {
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
    return resolveStep3Schema(industry);
  }, [industry]);

  const { displayName } = curatedSchema;

  // Normalize questions
  const questions: CuratedField[] = useMemo(() => {
    const raw =
      (curatedSchema as unknown as Record<string, unknown>)?.questions ??
      (curatedSchema as unknown as Record<string, unknown>)?.fields ??
      [];
    return (raw as Array<Record<string, unknown>>).map(
      (q: Record<string, unknown>, idx: number) => {
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
      }
    );
  }, [curatedSchema, industry]);

  // Track auto-filled defaults
  const [defaultFilledIds, setDefaultFilledIds] = useState<Set<string>>(new Set());
  const appliedSchemaRef = useRef<string>("");

  // Auto-apply smart defaults on load
  useEffect(() => {
    const templateKey = `${industry}-${questions.length}`;
    if (appliedSchemaRef.current === templateKey) return;

    const toApply: Record<string, unknown> = {};
    const newDefaultIds = new Set<string>();

    for (const q of questions) {
      const qAny = q as unknown as Record<string, unknown>;
      if (
        qAny.smartDefault !== undefined &&
        qAny.smartDefault !== null &&
        qAny.smartDefault !== "" &&
        !isAnswered(answers[q.id])
      ) {
        toApply[q.id] = qAny.smartDefault;
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

  // Restores a field to its smartDefault and re-shows the "Industry default" badge.
  const resetToDefault = useCallback(
    (id: string) => {
      const q = questions.find((fq) => fq.id === id);
      if (!q) return;
      const def = (q as unknown as Record<string, unknown>).smartDefault;
      if (def === undefined || def === null || def === "") return;
      actions.setAnswer(id, def);
      setDefaultFilledIds((prev) => new Set([...prev, id]));
    },
    [questions, actions]
  );

  // Check conditional visibility
  const isQuestionVisible = useCallback(
    (q: CuratedField): boolean => {
      const qAny = q as unknown as Record<string, unknown>;
      const c = qAny.conditionalLogic as Record<string, unknown> | undefined;
      if (!c?.dependsOn || typeof c.showIf !== "function") return true;
      try {
        const depKey = String(c.dependsOn);
        return !!(c.showIf as (val: unknown) => boolean)(answers[depKey]);
      } catch {
        return true; // Fail-open
      }
    },
    [answers]
  );

  // Visible questions
  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.id && q.id !== "undefined").filter(isQuestionVisible),
    [questions, isQuestionVisible]
  );

  // Get dynamic options
  const getOptions = useCallback(
    (q: CuratedField) => {
      const base = (q.options ?? []) as (string | number | Record<string, unknown>)[];
      const qAny = q as unknown as Record<string, unknown>;
      const c = qAny.conditionalLogic as Record<string, unknown> | undefined;
      if (!c?.modifyOptions || !c.dependsOn) return base;
      try {
        const depKey = String(c.dependsOn);
        const next = (c.modifyOptions as (val: unknown) => unknown)(answers[depKey]);
        return Array.isArray(next) ? (next as (string | number | Record<string, unknown>)[]) : base;
      } catch {
        return base;
      }
    },
    [answers]
  );

  // ─── Section grouping ────────────────────────────────────────────────────
  // Map sectionId → questions for that section
  const sectionQuestionMap = useMemo(() => {
    const map = new Map<string, CuratedField[]>();
    for (const q of visibleQuestions) {
      const sectionId = ((q as unknown as Record<string, unknown>).section as string) || "general";
      if (!map.has(sectionId)) map.set(sectionId, []);
      map.get(sectionId)!.push(q);
    }
    return map;
  }, [visibleQuestions]);

  // Ordered sections: prefer schema sections (filtered to those that have questions),
  // fall back to deriving from question.section values in order.
  const orderedSections = useMemo<CuratedSection[]>(() => {
    const schemaSections = curatedSchema.sections ?? [];
    if (schemaSections.length > 0) {
      return schemaSections.filter((s) => sectionQuestionMap.has(s.id));
    }
    // Fallback: derive from question order
    const seen = new Set<string>();
    const result: CuratedSection[] = [];
    for (const q of visibleQuestions) {
      const id = ((q as unknown as Record<string, unknown>).section as string) || "general";
      if (!seen.has(id)) {
        seen.add(id);
        result.push({
          id,
          label: id.charAt(0).toUpperCase() + id.slice(1),
          icon: "📋",
        });
      }
    }
    return result;
  }, [curatedSchema.sections, sectionQuestionMap, visibleQuestions]);

  // Active section index — resets when industry changes
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const prevIndustryRef = useRef(industry);
  useEffect(() => {
    if (prevIndustryRef.current !== industry) {
      setActiveSectionIdx(0);
      prevIndustryRef.current = industry;
    }
  }, [industry]);

  // Clamp index if sections shrink (e.g., filters change visibility)
  const clampedIdx = Math.min(activeSectionIdx, Math.max(0, orderedSections.length - 1));

  const currentSection: CuratedSection | undefined = orderedSections[clampedIdx];
  const currentSectionQuestions: CuratedField[] = currentSection
    ? (sectionQuestionMap.get(currentSection.id) ?? [])
    : visibleQuestions;

  // Overall progress
  const answeredCount = useMemo(
    () => visibleQuestions.filter((q) => isAnswered(answers[q.id])).length,
    [visibleQuestions, answers]
  );

  // Per-section answered count
  const getSectionAnswered = useCallback(
    (sectionId: string) => {
      const qs = sectionQuestionMap.get(sectionId) ?? [];
      return qs.filter((q) => isAnswered(answers[q.id])).length;
    },
    [sectionQuestionMap, answers]
  );

  // Whether a section has all required fields answered
  const isSectionComplete = useCallback(
    (sectionId: string) => {
      const qs = sectionQuestionMap.get(sectionId) ?? [];
      return qs.every((q) => !q.required || isAnswered(answers[q.id]));
    },
    [sectionQuestionMap, answers]
  );

  // Scroll sentinel for section-top
  const sectionTopRef = useRef<HTMLDivElement>(null);

  const goToSection = useCallback((idx: number) => {
    setActiveSectionIdx(idx);
    setTimeout(() => {
      sectionTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const isLastSection = clampedIdx === orderedSections.length - 1;
  const isFirstSection = clampedIdx === 0;

  // ─── Single-section render helper (reused below) ──────────────────────────
  const renderQuestion = (q: CuratedField, indexInSection: number) => {
    const qAny = q as unknown as Record<string, unknown>;
    const merlinTip = qAny.merlinTip as string | undefined;

    // Non-inline types: QuestionCard handles its own header, title, and tip — render standalone
    if (!["buttons", "number_input", "toggle"].includes(q.type)) {
      return (
        <div key={q.id} id={`question-${q.id}`} style={{ marginBottom: 12 }}>
          <QuestionCard
            q={q}
            index={indexInSection}
            answers={answers}
            defaultFilledIds={defaultFilledIds}
            onAnswer={setAnswerWithTracking}
            getOptions={getOptions}
          />
        </div>
      );
    }

    return (
      <div
        key={q.id}
        id={`question-${q.id}`}
        style={{
          background: "rgba(30, 41, 59, 0.6)",
          borderRadius: 12,
          padding: 0,
          marginBottom: 12,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Question Header */}
        <div
          style={{
            background: "rgba(51, 65, 85, 0.6)",
            padding: "10px 16px",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              background: "rgba(99, 102, 241, 0.2)",
              color: "#94a3b8",
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {indexInSection + 1}
          </div>
          {/* Show badge when value is still the auto-filled default */}
          {qAny.smartDefault !== undefined &&
            qAny.smartDefault !== null &&
            qAny.smartDefault !== "" &&
            defaultFilledIds.has(q.id) && (
              <div
                style={{
                  marginLeft: "auto",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#3ECF8E",
                  padding: "3px 8px",
                  borderRadius: 5,
                  fontSize: 9,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span>✨</span> Industry default
              </div>
            )}
          {/* Restore button when user changed a smart-defaulted field */}
          {qAny.smartDefault !== undefined &&
            qAny.smartDefault !== null &&
            qAny.smartDefault !== "" &&
            !defaultFilledIds.has(q.id) &&
            isAnswered(answers[q.id]) && (
              <button
                type="button"
                onClick={() => resetToDefault(q.id)}
                title="Restore industry default"
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "rgba(148,163,184,0.5)",
                  padding: "3px 6px",
                  borderRadius: 5,
                  fontSize: 9,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(148,163,184,0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(148,163,184,0.5)";
                }}
              >
                ↩ restore
              </button>
            )}
        </div>

        {/* Question Content */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 6 }}>
            {q.title || q.label}
          </div>

          {!!qAny.description && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              {String(qAny.description)}
            </div>
          )}

          {merlinTip && (
            <div
              style={{
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                <div style={{ color: "#94a3b8", fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                  💡
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 3 }}>
                    Merlin's Tip
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>
                    {merlinTip}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Answer Options */}
          {q.type === "buttons" && !!qAny.options && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  q.options && q.options.length <= 3
                    ? "repeat(auto-fit, minmax(200px, 1fr))"
                    : q.options && q.options.length <= 6
                      ? "repeat(3, 1fr)"
                      : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
              }}
            >
              {(q.options ?? []).map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswerWithTracking(q.id, opt.value)}
                    style={{
                      background: isSelected ? "rgba(16,185,129,0.10)" : "rgba(51, 65, 85, 0.5)",
                      border: isSelected
                        ? "1.5px solid rgba(16,185,129,0.50)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(51, 65, 85, 0.7)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(51, 65, 85, 0.5)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: opt.description ? 4 : 0,
                        }}
                      >
                        {opt.icon && (
                          <span style={{ fontSize: 16 }}>
                            {typeof opt.icon === "string"
                              ? opt.icon
                              : opt.label.match(/[⭐🌟🎨🏢]/u)?.[0]}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isSelected ? "#6EE7B7" : "white",
                          }}
                        >
                          {opt.label.replace(/[⭐🌟🎨🏢]/gu, "").trim()}
                        </span>
                      </div>
                      {opt.description && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                          {opt.description}
                        </div>
                      )}
                    </div>
                    {/* Circle checkmark indicator */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                        background: isSelected ? "#3ECF8E" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0D1117",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 8px rgba(16,185,129,0.5)" : "none",
                      }}
                    >
                      {isSelected && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "number_input" && (
            <input
              type="number"
              value={(answers[q.id] as string | number) || ""}
              onChange={(e) => setAnswerWithTracking(q.id, e.target.value)}
              placeholder={(qAny.placeholder as string) || "Enter value"}
              style={{
                width: "100%",
                background: "rgba(51, 65, 85, 0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "white",
                fontSize: 14,
              }}
            />
          )}

          {q.type === "toggle" && (
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ].map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAnswerWithTracking(q.id, opt.value)}
                    style={{
                      flex: 1,
                      background: isSelected ? "rgba(16,185,129,0.10)" : "rgba(51, 65, 85, 0.5)",
                      border: isSelected
                        ? "1.5px solid rgba(16,185,129,0.50)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "12px",
                      color: isSelected ? "#6EE7B7" : "white",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {opt.label}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                        background: isSelected ? "#3ECF8E" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#0D1117",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  // No-questions fallback
  if (visibleQuestions.length === 0) {
    return (
      <div
        style={{
          background: "#0D1117",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: 32,
            borderRadius: 12,
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.20)",
            textAlign: "center",
            color: "white",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(251,191,36,0.95)",
              marginBottom: 8,
            }}
          >
            No questions found for {displayName}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", marginBottom: 20 }}>
            The questionnaire for this industry is still being configured.
          </div>
          <button
            type="button"
            onClick={() => actions.goToStep(2)}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "1px solid rgba(251,191,36,0.40)",
              background: "transparent",
              color: "rgba(251,191,36,0.95)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to Industry Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0D1117", minHeight: "100vh" }}>
      <div
        ref={sectionTopRef}
        style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px 40px" }}
      >
        {/* ── Section pill nav (only when multi-section) ── */}
        {orderedSections.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {orderedSections.map((sec, idx) => {
              const isActive = idx === clampedIdx;
              const answered = getSectionAnswered(sec.id);
              const total = sectionQuestionMap.get(sec.id)?.length ?? 0;
              const complete = isSectionComplete(sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => goToSection(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: isActive
                      ? "1.5px solid rgba(62,207,142,0.60)"
                      : complete
                        ? "1px solid rgba(62,207,142,0.25)"
                        : "1px solid rgba(255,255,255,0.10)",
                    background: isActive
                      ? "rgba(62,207,142,0.12)"
                      : complete
                        ? "rgba(62,207,142,0.05)"
                        : "rgba(255,255,255,0.03)",
                    color: isActive ? "#3ECF8E" : complete ? "#6EE7B7" : "rgba(255,255,255,0.50)",
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {sec.icon && <span style={{ fontSize: 13 }}>{sec.icon}</span>}
                  <span>{sec.label}</span>
                  {complete ? (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#3ECF8E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 800,
                        color: "#080B10",
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: isActive ? "rgba(62,207,142,0.70)" : "rgba(255,255,255,0.30)",
                      }}
                    >
                      {answered}/{total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Current section header ── */}
        {currentSection && (
          <div
            style={{
              marginBottom: 20,
              padding: "16px 20px",
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(62,207,142,0.08) 0%, rgba(62,207,142,0.02) 100%)",
              border: "1px solid rgba(62,207,142,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {currentSection.icon && <span style={{ fontSize: 28 }}>{currentSection.icon}</span>}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "white" }}>
                    {currentSection.label}
                  </span>
                  {orderedSections.length > 1 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgba(62,207,142,0.70)",
                        background: "rgba(62,207,142,0.08)",
                        border: "1px solid rgba(62,207,142,0.20)",
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      Section {clampedIdx + 1} of {orderedSections.length}
                    </span>
                  )}
                </div>
                {currentSection.description && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginBottom: 4 }}>
                    {currentSection.description}
                  </div>
                )}
                {/* Per-section progress */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                      maxWidth: 160,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        background: "#3ECF8E",
                        width: `${
                          currentSectionQuestions.length > 0
                            ? (getSectionAnswered(currentSection.id) /
                                currentSectionQuestions.length) *
                              100
                            : 0
                        }%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
                    {getSectionAnswered(currentSection.id)} of {currentSectionQuestions.length}{" "}
                    answered
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Questions for current section ── */}
        {currentSectionQuestions.map((q, idx) => renderQuestion(q, idx))}

        {/* ── Section navigation ── */}
        {orderedSections.length > 1 && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Back */}
            <button
              type="button"
              onClick={() =>
                isFirstSection
                  ? actions.goToStep(2 as import("../wizardState").WizardStep)
                  : goToSection(clampedIdx - 1)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "11px 18px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.65)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}
            >
              <ChevronLeft size={16} />
              {isFirstSection ? "← Industry" : (orderedSections[clampedIdx - 1]?.label ?? "← Back")}
            </button>

            {/* Overall progress pill */}
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {answeredCount} / {visibleQuestions.length} total answered
            </div>

            {/* Next Section / Choose Add-ons CTA */}
            {isLastSection ? (
              <button
                type="button"
                onClick={() => actions.goToStep(4 as import("../wizardState").WizardStep)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%)",
                  color: "#080B10",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(16,185,129,0.50)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(16,185,129,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Choose add-ons
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToSection(clampedIdx + 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%)",
                  color: "#080B10",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(16,185,129,0.50)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(16,185,129,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {orderedSections[clampedIdx + 1]?.label ?? "Next"}
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Step3V8;
