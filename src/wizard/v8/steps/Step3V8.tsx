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
import type { WizardState, WizardActions } from "../wizardState";
import { BillUploadPanel } from "./BillUploadPanel";
import {
  resolveStep3Schema,
  type CuratedField,
  type CuratedSchema,
  type CuratedSection,
} from "@/wizard/v7/schema/curatedFieldsResolver";
import QuestionCard from "@/components/wizard/v7/steps/QuestionCard";
import { isAnswered } from "@/components/wizard/v7/steps/step3Helpers";
import { getCriticalFieldIds } from "@/wizard/v7/schema/step3CriticalFields";
import type { Step3DetailLevel } from "../wizardState";

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
  const [billUploadOpen, setBillUploadOpen] = useState(Boolean(state.uploadedBillData));
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

  // Visible questions (after conditional logic)
  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.id && q.id !== "undefined").filter(isQuestionVisible),
    [questions, isQuestionVisible]
  );

  // ─── Detail level (streamline | critical | all) ──────────────────────────
  const detailLevel: Step3DetailLevel = state.step3DetailLevel ?? "streamline";

  // The subset of questions that genuinely drive this industry's quote.
  const criticalIds = useMemo(
    () => getCriticalFieldIds(curatedSchema.industry, questions),
    [curatedSchema.industry, questions]
  );

  // Questions actually shown for the active detail level. In "critical" mode we
  // surface only the quote-driving inputs; the rest keep their smart defaults.
  const displayedQuestions = useMemo(() => {
    if (detailLevel === "critical") {
      return visibleQuestions.filter((q) => criticalIds.has(q.id));
    }
    return visibleQuestions;
  }, [visibleQuestions, detailLevel, criticalIds]);

  // Count of critical questions currently visible (for the selector label).
  const criticalCount = useMemo(
    () => visibleQuestions.filter((q) => criticalIds.has(q.id)).length,
    [visibleQuestions, criticalIds]
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
    for (const q of displayedQuestions) {
      const sectionId = ((q as unknown as Record<string, unknown>).section as string) || "general";
      if (!map.has(sectionId)) map.set(sectionId, []);
      map.get(sectionId)!.push(q);
    }
    return map;
  }, [displayedQuestions]);

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
    for (const q of displayedQuestions) {
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
  }, [curatedSchema.sections, sectionQuestionMap, displayedQuestions]);

  // Track which sections are expanded in the accordion
  // Sections that the user has manually changed start expanded
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const prevIndustryRef = useRef(industry);
  useEffect(() => {
    if (prevIndustryRef.current !== industry) {
      setOpenSections(new Set());
      prevIndustryRef.current = industry;
    }
  }, [industry]);

  // When the user switches detail level, expand everything for critical/all
  // (so the questions to answer are immediately visible) and collapse for
  // streamline. Only fires on an actual mode change, preserving manual toggles.
  const prevDetailRef = useRef(detailLevel);
  useEffect(() => {
    if (prevDetailRef.current === detailLevel) return;
    prevDetailRef.current = detailLevel;
    if (detailLevel === "streamline") {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(orderedSections.map((s) => s.id)));
    }
  }, [detailLevel, orderedSections]);

  // Expand a section when the user manually edits a question inside it
  const setAnswerWithTracking = useCallback(
    (id: string, value: unknown) => {
      setDefaultFilledIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // Find and open the section containing this question
      const q = visibleQuestions.find((fq) => fq.id === id);
      if (q) {
        const sectionId =
          ((q as unknown as Record<string, unknown>).section as string) || "general";
        setOpenSections((prev) => {
          if (prev.has(sectionId)) return prev;
          return new Set([...prev, sectionId]);
        });
      }
      actions.setAnswer(id, value);
    },
    [actions, visibleQuestions]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  // Scroll sentinel for section-top
  const sectionTopRef = useRef<HTMLDivElement>(null);

  // ─── Single-section render helper (reused below) ──────────────────────────
  const renderQuestion = (q: CuratedField, indexInSection: number) => {
    const qAny = q as unknown as Record<string, unknown>;
    const merlinTip = qAny.merlinTip as string | undefined;

    // Non-inline types: QuestionCard handles its own header, title, and tip — render standalone
    if (!["buttons", "number_input", "toggle"].includes(q.type)) {
      return (
        <div key={q.id} id={`question-${q.id}`} className="wiz-s3-q-wrap">
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
      <div key={q.id} id={`question-${q.id}`} className="wiz-s3-q">
        <div className="wiz-s3-q-hdr">
          <div className="wiz-s3-q-num">{indexInSection + 1}</div>

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

        <div className="wiz-s3-q-body">
          <div className="wiz-s3-q-title">{q.title || q.label}</div>

          {!!qAny.description && <div className="wiz-s3-q-desc">{String(qAny.description)}</div>}

          {merlinTip && (
            <div className="wiz-s3-q-tip">
              <div className="wiz-s3-q-tip-icon">💡</div>
              <div>
                <div className="wiz-s3-q-tip-label">Merlin's Tip</div>
                <div className="wiz-s3-q-tip-text">{merlinTip}</div>
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
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: isSelected ? "#6EE7B7" : "white",
                          }}
                        >
                          {opt.label}
                        </span>
                      </div>
                      {opt.description && (
                        <div className="wiz-s3-q-opt-desc">{opt.description}</div>
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
                        background: isSelected ? "#34d399" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0d1230",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 8px rgba(52,211,153,0.45)" : "none",
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
                        background: isSelected ? "#34d399" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#0d1230",
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

  // ── Project type selection ──────────────────────────────────────────────
  const projectType = answers.project_type as "existing" | "greenfield" | undefined;

  // ── Section progress helpers ──────────────────────────────────────────────
  const getSectionAnswered = (sectionId: string): number => {
    const qs = sectionQuestionMap.get(sectionId) ?? [];
    return qs.filter((q) => isAnswered(answers[q.id])).length;
  };

  const isSectionComplete = (sectionId: string): boolean => {
    const qs = sectionQuestionMap.get(sectionId) ?? [];
    return qs.length > 0 && qs.every((q) => isAnswered(answers[q.id]));
  };

  const answeredCount = displayedQuestions.filter((q) => isAnswered(answers[q.id])).length;
  const displayedCount = displayedQuestions.length;

  // Detail-level selector options
  const detailOptions: Array<{
    id: Step3DetailLevel;
    emoji: string;
    label: string;
    sub: string;
    accent: string;
  }> = [
    {
      id: "streamline",
      emoji: "⚡",
      label: "Streamline",
      sub: "Smart defaults — fastest",
      accent: "rgba(62,207,142,",
    },
    {
      id: "critical",
      emoji: "🎯",
      label: "Key questions",
      sub: `${criticalCount} inputs that drive your quote`,
      accent: "rgba(99,179,237,",
    },
    {
      id: "all",
      emoji: "📋",
      label: "Full detail",
      sub: `All ${visibleQuestions.length} — most accurate`,
      accent: "rgba(167,139,250,",
    },
  ];

  return (
    <div className="wiz-root wiz-s3">
      <div className="wiz-s3-inner" ref={sectionTopRef}>
        <div className="wiz-step-header">
          <div className="wiz-step-eyebrow">Step 3 of 6 · Facility profile</div>
          <h1 className="wiz-step-title">{displayName} profile</h1>
          <p className="wiz-step-desc">
            Tell us about your site — or keep the smart defaults and continue. Answers here drive
            system sizing, savings, and equipment selection.
          </p>
        </div>

        {!state.uploadedBillData && !billUploadOpen ? (
          <button
            type="button"
            className="wiz-s3-bill-link"
            onClick={() => setBillUploadOpen(true)}
          >
            📄 Have a utility bill? Upload to auto-fill peak demand and rates
          </button>
        ) : (
          <BillUploadPanel
            uploadedData={state.uploadedBillData}
            onExtracted={actions.setBillData}
            onCleared={() => {
              actions.clearBillData();
              setBillUploadOpen(false);
            }}
          />
        )}

        <div className="wiz-s3-panel">
          <div className="wiz-s3-config">
            <div>
              <h3 className="wiz-s3-field-label">Project type</h3>
              <div className="wiz-s3-choices cols-2">
                {(
                  [
                    {
                      value: "existing" as const,
                      label: "Existing facility",
                      sub: "Real roof / canopy on site",
                    },
                    {
                      value: "greenfield" as const,
                      label: "Greenfield",
                      sub: "Designing footprint from scratch",
                    },
                  ] as const
                ).map(({ value, label, sub }) => {
                  const active = projectType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`wiz-s3-choice${active ? " active" : ""}`}
                      onClick={() => actions.setAnswer("project_type", value)}
                    >
                      <div className="wiz-s3-choice-label">{active ? `✓ ${label}` : label}</div>
                      <div className="wiz-s3-choice-sub">{sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="wiz-s3-field-label">How much detail?</h3>
              <div className="wiz-s3-choices cols-3">
                {detailOptions.map(({ id, label, sub }) => {
                  const active = detailLevel === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`wiz-s3-choice${active ? " active" : ""}`}
                      onClick={() => actions.setDetailLevel(id)}
                    >
                      <div className="wiz-s3-choice-label">{active ? `✓ ${label}` : label}</div>
                      <div className="wiz-s3-choice-sub">{sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {detailLevel === "streamline" && (
          <div className="wiz-s3-streamline">
            <div className="wiz-s3-streamline-text">
              <strong>{visibleQuestions.length} questions</strong> pre-filled with {displayName}{" "}
              benchmarks — continue now or expand a section below to customize.
              <span className="wiz-s3-streamline-hint">
                Override only what you know. Defaults are industry-calibrated.
              </span>
            </div>
            <button
              type="button"
              className="wiz-s3-skip"
              onClick={() => actions.goToStep(4 as import("../wizardState").WizardStep)}
            >
              Skip to add-ons →
            </button>
          </div>
        )}

        <div className="wiz-s3-hub">
          <div className="wiz-s3-hub-hdr">
            <span className="wiz-s3-hub-title">Facility profile</span>
            <span className="wiz-s3-hub-count">
              {answeredCount} of {displayedCount} complete
            </span>
          </div>

          <div className="wiz-s3-sections">
            {orderedSections.map((sec) => {
              const isOpen = openSections.has(sec.id);
              const sectionQs = sectionQuestionMap.get(sec.id) ?? [];
              const answered = getSectionAnswered(sec.id);
              const total = sectionQs.length;
              const complete = isSectionComplete(sec.id);

              const humanizeVal = (s: string) =>
                s
                  .replace(/[_-]+/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .replace(/^\w/, (c) => c.toUpperCase());

              const previewItems = sectionQs
                .slice(0, 3)
                .map((q) => {
                  const val = answers[q.id];
                  const rawVal = Array.isArray(val) ? val.join(", ") : String(val ?? "");
                  if (!rawVal) return null;
                  const label = String(q.title || q.label || "").replace(/[?:]\s*$/, "");
                  const displayVal = humanizeVal(rawVal);
                  return label ? `${label}: ${displayVal}` : displayVal;
                })
                .filter(Boolean);

              return (
                <div
                  key={sec.id}
                  className={`wiz-s3-section${isOpen ? " open" : ""}${complete ? " complete" : ""}`}
                >
                  <button
                    type="button"
                    className="wiz-s3-section-trigger"
                    onClick={() => toggleSection(sec.id)}
                  >
                    {sec.icon && <span className="wiz-s3-section-icon">{sec.icon}</span>}
                    <div className="wiz-s3-section-body-wrap">
                      <div className="wiz-s3-section-title-row">
                        <span className="wiz-s3-section-title">{sec.label}</span>
                        {complete && !isOpen && <span className="wiz-s3-section-check">✓</span>}
                        <span className="wiz-s3-section-badge">
                          {answered}/{total}
                        </span>
                      </div>
                      {!isOpen && previewItems.length > 0 && (
                        <div className="wiz-s3-section-preview">{previewItems.join(" · ")}</div>
                      )}
                    </div>
                    <span className="wiz-s3-section-chevron">▼</span>
                  </button>

                  {isOpen && (
                    <div className="wiz-s3-section-content">
                      {sectionQs.map((q, idx) => renderQuestion(q, idx))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step3V8;
