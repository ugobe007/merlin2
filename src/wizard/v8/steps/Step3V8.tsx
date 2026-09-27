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
import { estimateSolarKW } from "../addonSizing";
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
  const [facilityMode, setFacilityMode] = useState<"upload" | "defaults" | "details">(
    state.uploadedBillData ? "upload" : "defaults"
  );
  const appliedSchemaRef = useRef<string>("");

  // Derived recommended solar capacity for Step 3
  const computedSolarCap = estimateSolarKW("roof_canopy", state);
  const recommendedSolarKW = useMemo(() => {
    return computedSolarCap > 0 ? computedSolarCap : Math.round((state.baseLoadKW || 100) * 0.35);
  }, [computedSolarCap, state.baseLoadKW]);

  const isSolarIncluded = state.wantsSolar !== false;

  const handleToggleSolar = useCallback(
    (include: boolean) => {
      actions.setAddonPreference("solar", include);
      if (include) {
        actions.setAddonConfig({ solarKW: recommendedSolarKW });
      } else {
        actions.setAddonConfig({ solarKW: 0 });
      }
    },
    [actions, recommendedSolarKW]
  );

  const handleGetEnergyQuote = useCallback(() => {
    if (isSolarIncluded && recommendedSolarKW > 0) {
      actions.setAddonConfig({ solarKW: recommendedSolarKW });
    }
    actions.goToStep(6 as import("../wizardState").WizardStep);
  }, [actions, isSolarIncluded, recommendedSolarKW]);

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
  // Open ALL sections by default so questions are immediately visible on screen!
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    return new Set(orderedSections.map((s) => s.id));
  });

  const prevIndustryRef = useRef(industry);
  useEffect(() => {
    if (prevIndustryRef.current !== industry && orderedSections.length > 0) {
      setOpenSections(new Set(orderedSections.map((s) => s.id)));
      prevIndustryRef.current = industry;
    }
  }, [industry, orderedSections]);

  // When detailLevel changes, keep sections open so questions are always visible
  const prevDetailRef = useRef(detailLevel);
  useEffect(() => {
    if (prevDetailRef.current !== detailLevel && orderedSections.length > 0) {
      prevDetailRef.current = detailLevel;
      setOpenSections(new Set(orderedSections.map((s) => s.id)));
    }
  }, [detailLevel, orderedSections]);

  // Track answer changes
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

  const expandAllSections = useCallback(() => {
    setOpenSections(new Set(orderedSections.map((s) => s.id)));
  }, [orderedSections]);

  const collapseAllSections = useCallback(() => {
    setOpenSections(new Set());
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
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(16,185,129,0.24) 0%, rgba(6,182,212,0.16) 100%)"
                        : "rgba(15, 23, 42, 0.75)",
                      border: isSelected
                        ? "2px solid #10B981"
                        : "1.5px solid rgba(255,255,255,0.16)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: isSelected
                        ? "0 0 20px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(30, 41, 59, 0.85)";
                        e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)";
                        e.currentTarget.style.boxShadow = "0 0 12px rgba(56,189,248,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
                        e.currentTarget.style.boxShadow = "none";
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
                            fontWeight: isSelected ? 800 : 700,
                            color: isSelected ? "#FFFFFF" : "#F1F5F9",
                          }}
                        >
                          {opt.label}
                        </span>
                      </div>
                      {opt.description && (
                        <div
                          className="wiz-s3-q-opt-desc"
                          style={{ color: isSelected ? "#A7F3D0" : "#94A3B8" }}
                        >
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
                        background: isSelected
                          ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 10px rgba(16,185,129,0.6)" : "none",
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
                background: "rgba(15, 23, 42, 0.75)",
                border: "1.5px solid rgba(255,255,255,0.18)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#38bdf8";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(56,189,248,0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.boxShadow = "none";
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
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(16,185,129,0.24) 0%, rgba(6,182,212,0.16) 100%)"
                        : "rgba(15, 23, 42, 0.75)",
                      border: isSelected
                        ? "2px solid #10B981"
                        : "1.5px solid rgba(255,255,255,0.16)",
                      borderRadius: 10,
                      padding: "12px",
                      color: isSelected ? "#FFFFFF" : "#F1F5F9",
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 700,
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: isSelected ? "0 0 18px rgba(16,185,129,0.35)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(30, 41, 59, 0.85)";
                        e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "rgba(15, 23, 42, 0.75)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
                      }
                    }}
                  >
                    {opt.label}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                        background: isSelected
                          ? "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
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
          <div className="wiz-step-eyebrow">Step 3 of 4 · Facility profile</div>
          <h1 className="wiz-step-title">{displayName} profile</h1>
          <p className="wiz-step-desc">
            Choose how to set up your facility profile — upload a bill, accept industry defaults, or
            customize details.
          </p>
        </div>

        {/* ── 3 Main Options Tab Selector ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setFacilityMode("upload")}
            style={{
              padding: "16px 14px",
              borderRadius: 12,
              background:
                facilityMode === "upload"
                  ? "linear-gradient(135deg, rgba(6,182,212,0.20), rgba(15,23,42,0.85))"
                  : "rgba(15,23,42,0.60)",
              border:
                facilityMode === "upload"
                  ? "2px solid #06b6d4"
                  : "1.5px solid rgba(255,255,255,0.14)",
              color: "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: facilityMode === "upload" ? "0 0 20px rgba(6,182,212,0.25)" : "none",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>📄</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: facilityMode === "upload" ? "#38bdf8" : "#f1f5f9",
              }}
            >
              [1] Upload utility bill
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.70)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Auto-fill peak kW &amp; rates from your PDF statement
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFacilityMode("defaults")}
            style={{
              padding: "16px 14px",
              borderRadius: 12,
              background:
                facilityMode === "defaults"
                  ? "linear-gradient(135deg, rgba(16,185,129,0.20), rgba(15,23,42,0.85))"
                  : "rgba(15,23,42,0.60)",
              border:
                facilityMode === "defaults"
                  ? "2px solid #10b981"
                  : "1.5px solid rgba(255,255,255,0.14)",
              color: "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: facilityMode === "defaults" ? "0 0 20px rgba(16,185,129,0.25)" : "none",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>⚡</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: facilityMode === "defaults" ? "#34d399" : "#f1f5f9",
              }}
            >
              [2] Accept industry defaults
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.70)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Fastest setup · Sized using ASHRAE &amp; CBECS benchmarks
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFacilityMode("details")}
            style={{
              padding: "16px 14px",
              borderRadius: 12,
              background:
                facilityMode === "details"
                  ? "linear-gradient(135deg, rgba(99,102,241,0.20), rgba(15,23,42,0.85))"
                  : "rgba(15,23,42,0.60)",
              border:
                facilityMode === "details"
                  ? "2px solid #6366f1"
                  : "1.5px solid rgba(255,255,255,0.14)",
              color: "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: facilityMode === "details" ? "0 0 20px rgba(99,102,241,0.25)" : "none",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>📋</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: facilityMode === "details" ? "#818cf8" : "#f1f5f9",
              }}
            >
              [3] Add details
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.70)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              Customize operating hours, HVAC &amp; specific equipment
            </div>
          </button>
        </div>

        {/* ── Solar PV Coverage Section ── */}
        <div
          style={{
            padding: 26,
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)",
            border: "2.5px solid #a855f7",
            marginBottom: 24,
            boxShadow: "0 0 35px rgba(168, 85, 247, 0.30), inset 0 0 20px rgba(168, 85, 247, 0.10)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative glowing accent line on top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, #a855f7, #38bdf8, #a855f7)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: "rgba(168, 85, 247, 0.25)",
                border: "1.5px solid #d8b4fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 0 16px rgba(168, 85, 247, 0.40)",
                flexShrink: 0,
              }}
            >
              ☀️
            </div>
            <div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#ffffff",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Recommended Solar: {recommendedSolarKW} kW
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "rgba(233, 213, 255, 0.90)",
                  margin: "4px 0 0",
                  lineHeight: 1.45,
                }}
              >
                Merlin auto-sized{" "}
                <strong style={{ color: "#d8b4fe" }}>{recommendedSolarKW} kW</strong> of solar for
                your facility to minimize utility bills and capture 30% Federal ITC tax savings.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleSolar(true)}
              style={{
                padding: "18px 22px",
                borderRadius: 14,
                border: isSolarIncluded
                  ? "3px solid #10b981"
                  : "1.5px solid rgba(255,255,255,0.14)",
                background: isSolarIncluded
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)"
                  : "rgba(255,255,255,0.03)",
                color: "#ffffff",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: isSolarIncluded
                  ? "0 0 30px rgba(16, 185, 129, 0.55), inset 0 0 18px rgba(16, 185, 129, 0.20)"
                  : "none",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: isSolarIncluded ? "#34d399" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isSolarIncluded ? "✓ Recommended Solar" : "Recommended Solar"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: isSolarIncluded
                    ? "rgba(167, 243, 208, 0.90)"
                    : "rgba(203, 213, 225, 0.75)",
                  marginTop: 6,
                  lineHeight: 1.45,
                }}
              >
                Auto-added to energy stack ({recommendedSolarKW} kW) for max ROI &amp; 30% ITC tax
                credit
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToggleSolar(false)}
              style={{
                padding: "18px 22px",
                borderRadius: 14,
                border: !isSolarIncluded
                  ? "3px solid #94a3b8"
                  : "1.5px solid rgba(255,255,255,0.14)",
                background: !isSolarIncluded
                  ? "rgba(148, 163, 184, 0.20)"
                  : "rgba(255,255,255,0.03)",
                color: "#ffffff",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: !isSolarIncluded ? "0 0 20px rgba(148, 163, 184, 0.30)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: !isSolarIncluded ? "#cbd5e1" : "rgba(255,255,255,0.70)",
                }}
              >
                {!isSolarIncluded ? "✓ No Solar" : "No Solar"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(203, 213, 225, 0.75)",
                  marginTop: 6,
                  lineHeight: 1.45,
                }}
              >
                Battery Storage (BESS) peak-shaving stack only
              </div>
            </button>
          </div>
        </div>

        {/* ── Mode 1: Upload Utility Bill ── */}
        {facilityMode === "upload" && (
          <div style={{ marginBottom: 24 }}>
            <BillUploadPanel
              uploadedData={state.uploadedBillData}
              onExtracted={actions.setBillData}
              onCleared={() => {
                actions.clearBillData();
                setFacilityMode("defaults");
              }}
            />
          </div>
        )}

        {/* ── Mode 2: Accept Industry Defaults ── */}
        {facilityMode === "defaults" && (
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: "linear-gradient(145deg, rgba(168,85,247,0.12), rgba(15,23,42,0.85))",
              border: "1.5px solid rgba(168,85,247,0.35)",
              marginBottom: 24,
              boxShadow: "0 0 28px rgba(168,85,247,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Smart Defaults Applied for {displayName}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(203,213,225,0.80)", margin: "4px 0 0" }}>
                  Estimated Peak Load:{" "}
                  <strong style={{ color: "#c084fc" }}>
                    ~
                    {Math.round(
                      state.peakLoadKW > 0 ? state.peakLoadKW : state.baseLoadKW || 150
                    ).toLocaleString()}{" "}
                    kW
                  </strong>{" "}
                  based on standard {displayName.toLowerCase()} load profiles.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setFacilityMode("details")}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(255,255,255,0.22)",
                  background: "rgba(15,23,42,0.60)",
                  color: "#f1f5f9",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Customize details instead →
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 3: Add Details (Questionnaire) ── */}
        {facilityMode === "details" && (
          <>
            <div className="wiz-s3-panel">
              <div className="wiz-s3-config">
                <div>
                  <h3 className="wiz-s3-field-label">PROJECT TYPE</h3>
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
                  <h3 className="wiz-s3-field-label">HOW MUCH DETAIL?</h3>
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
                  <strong>⚡ Smart defaults applied</strong> for {displayName}
                  <span className="wiz-s3-streamline-hint">
                    Review or edit your facility parameters in the cards below, or skip directly to
                    add-ons.
                  </span>
                </div>
                <div
                  className="wiz-s3-streamline-actions"
                  style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
                >
                  <button
                    type="button"
                    onClick={() => actions.setDetailLevel("critical")}
                    style={{
                      padding: "11px 18px",
                      borderRadius: 10,
                      border: "1.5px solid rgba(255,255,255,0.22)",
                      background: "rgba(15, 23, 42, 0.75)",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🎯 Customize key inputs
                  </button>
                  <button
                    type="button"
                    className="wiz-s3-skip-cyan"
                    onClick={() => actions.goToStep(4 as import("../wizardState").WizardStep)}
                  >
                    Skip to add-ons →
                  </button>
                </div>
              </div>
            )}

            <div className="wiz-s3-hub">
              <div
                className="wiz-s3-hub-hdr"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="wiz-s3-hub-title">{displayName} Profile Inputs</span>
                  <span className="wiz-s3-hub-count">
                    {answeredCount} of {displayedCount} complete · {defaultFilledIds.size} defaults
                    applied
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={expandAllSections}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 8,
                      color: "#38bdf8",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "5px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllSections}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 8,
                      color: "rgba(232,235,243,0.70)",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "5px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Collapse all
                  </button>
                </div>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Step3V8;
