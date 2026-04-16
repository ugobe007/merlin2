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
import { BillUploadPanel } from "./BillUploadPanel";
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

  // ── Project type selection ──────────────────────────────────────────────
  const projectType = answers.project_type as "existing" | "greenfield" | undefined;

  return (
    <div style={{ background: "#0D1117", minHeight: "100vh" }}>
      <div
        ref={sectionTopRef}
        style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px 40px" }}
      >
        {/* ── Utility Bill Upload ── */}
        <BillUploadPanel
          uploadedData={state.uploadedBillData}
          onExtracted={actions.setBillData}
          onCleared={actions.clearBillData}
        />

        {/* ── Universal: Project Type preamble ── */}
        <div
          style={{
            marginBottom: 20,
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.65)",
              marginBottom: 10,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            🏗️ Project Type
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
            Is this an existing operating facility, or a new build / ground-up project? This shapes
            how Merlin models roof constraints and panel selection.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {(
              [
                {
                  value: "existing" as const,
                  emoji: "🏢",
                  label: "Existing facility",
                  sub: "Working with a real roof/canopy you already have",
                  accentColor: "rgba(62,207,142,",
                },
                {
                  value: "greenfield" as const,
                  emoji: "🌱",
                  label: "Greenfield / new build",
                  sub: "Designing the footprint from scratch",
                  accentColor: "rgba(99,179,237,",
                },
              ] as const
            ).map(({ value, emoji, label, sub, accentColor }) => {
              const active = projectType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => actions.setAnswer("project_type", value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: active
                      ? `2px solid ${accentColor}0.70)`
                      : "1px solid rgba(255,255,255,0.10)",
                    background: active ? `${accentColor}0.08)` : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? `${accentColor}1.0)` : "rgba(255,255,255,0.80)",
                      marginBottom: 3,
                    }}
                  >
                    {active ? `✓ ${label}` : label}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(148,163,184,0.70)", lineHeight: 1.4 }}>
                    {sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Use Smart Defaults skip banner ── */}
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(62,207,142,0.10) 0%, rgba(62,207,142,0.04) 100%)",
            border: "1px solid rgba(62,207,142,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3ECF8E", marginBottom: 3 }}>
              ✓ All {visibleQuestions.length} questions pre-filled with {displayName} benchmarks
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              Smart defaults applied — review and customize below, or skip straight to add-ons.
            </div>
          </div>
          <button
            type="button"
            onClick={() => actions.goToStep(4 as import("../wizardState").WizardStep)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%)",
              color: "#080B10",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: "0 4px 14px rgba(16,185,129,0.30)",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(16,185,129,0.45)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(16,185,129,0.30)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Use Smart Defaults → Skip to Add-ons
          </button>
        </div>

        {/* ── Accordion sections ── */}
        {orderedSections.map((sec) => {
          const isOpen = openSections.has(sec.id);
          const sectionQs = sectionQuestionMap.get(sec.id) ?? [];
          const answered = getSectionAnswered(sec.id);
          const total = sectionQs.length;
          const complete = isSectionComplete(sec.id);

          // Build a 2-line preview of first 2-3 default values for collapsed state
          const previewItems = sectionQs
            .slice(0, 3)
            .map((q) => {
              const val = answers[q.id];
              const displayVal = Array.isArray(val) ? val.join(", ") : String(val ?? "");
              const label = q.title || q.label || "";
              return label && displayVal
                ? `${String(label).split(" ").slice(0, 3).join(" ")}: ${displayVal}`
                : null;
            })
            .filter(Boolean);

          return (
            <div
              key={sec.id}
              style={{
                marginBottom: 10,
                borderRadius: 12,
                border: isOpen
                  ? "1px solid rgba(62,207,142,0.28)"
                  : complete
                    ? "1px solid rgba(62,207,142,0.15)"
                    : "1px solid rgba(255,255,255,0.08)",
                background: isOpen ? "rgba(62,207,142,0.04)" : "rgba(255,255,255,0.02)",
                transition: "border-color 0.2s ease",
                overflow: "hidden",
              }}
            >
              {/* Accordion header — always visible */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {/* Icon */}
                {sec.icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{sec.icon}</span>}

                {/* Labels */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: previewItems.length > 0 && !isOpen ? 4 : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isOpen ? "#3ECF8E" : "rgba(255,255,255,0.90)",
                      }}
                    >
                      {sec.label}
                    </span>
                    {complete && !isOpen && (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "#3ECF8E",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#080B10",
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </span>
                    )}
                    <span
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", marginLeft: "auto" }}
                    >
                      {answered}/{total}
                    </span>
                  </div>
                  {/* Collapsed preview */}
                  {!isOpen && previewItems.length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.40)",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {previewItems.join(" · ")}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ padding: "0 16px 16px" }}>
                  {sectionQs.map((q, idx) => renderQuestion(q, idx))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Always-visible Choose Add-ons CTA ── */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => actions.goToStep(2 as import("../wizardState").WizardStep)}
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
            <ChevronLeft size={16} />← Industry
          </button>

          {/* Overall progress */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>
            {answeredCount} / {visibleQuestions.length} answered
          </div>

          {/* Choose add-ons */}
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
        </div>
      </div>
    </div>
  );
}

export default Step3V8;
