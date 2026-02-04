import React, { useMemo, useEffect, useCallback } from "react";
import type {
  Step3Template,
  WizardState as WizardV7State,
  OptionItem,
} from "@/wizard/v7/hooks/useWizardV7";
import { getTier1Blockers, isBlockerQuestion } from "@/wizard/v7/schema/curatedFieldsResolver";

// ============================================================================
// INDUSTRY IMAGE IMPORTS (Vite-safe for production builds)
// ============================================================================
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

type Step3Answers = Record<string, unknown>;

/**
 * MINIMAL ACTIONS CONTRACT (Feb 1, 2026)
 * 
 * This step ONLY needs:
 * - setStep3Answer: update a single answer
 * - submitStep3: move to results (optional, shell may handle nav)
 * 
 * We DO NOT call:
 * - canApplyDefaults (was causing crashes)
 * - canResetToDefaults (not needed for gate compliance)
 * - Any pricing/DB/async methods
 */
type Props = {
  state: WizardV7State;

  /**
   * Actions from shell (preferred pattern)
   * Only includes methods we actually need
   */
  actions?: {
    setStep3Answer?: (id: string, value: unknown) => void;
    submitStep3?: (answersOverride?: Step3Answers) => Promise<void>;
    submitStep3Partial?: () => Promise<void>;  // Escape hatch for incomplete
    goBack?: () => void;
  };

  /**
   * Alternative: direct state updater (for testing or simple shells)
   */
  updateState?: (patch: Partial<WizardV7State>) => void;

  /**
   * Optional — some implementations pass these directly:
   * If your hook stores them in state, we read from state and ignore these.
   */
  template?: Step3Template | null;
  answers?: Step3Answers;
};

type QuestionLike = {
  id: string;
  label?: string;
  prompt?: string;
  required?: boolean;
  type?: string; // "number" | "text" | "select" | "radio" | ...
  options?: OptionItem[];
  placeholder?: string;
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
  if (typeof value === "object") return Object.keys(value as any).length > 0;
  return true;
}

function getIndustryHero(industry?: string) {
  switch (industry) {
    case "hotel":
      return { img: hotelImg, title: "Hotel / Hospitality" };
    case "car_wash":
      return { img: carWashImg, title: "Car Wash" };
    case "manufacturing":
      return { img: manufacturingImg, title: "Manufacturing" };
    case "warehouse":
      return { img: warehouseImg, title: "Warehouse / Logistics" };
    case "office":
      return { img: officeImg, title: "Office" };
    case "retail":
      return { img: retailImg, title: "Retail" };
    case "restaurant":
      return { img: restaurantImg, title: "Restaurant" };
    case "hospital":
    case "healthcare":
      return { img: healthcareImg, title: "Healthcare" };
    case "data_center":
      return { img: dataCenterImg, title: "Data Center" };
    case "ev_charging":
      return { img: evChargingImg, title: "EV Charging" };
    default:
      return { img: hotelImg, title: "Profile" };
  }
}

export default function Step3ProfileV7(props: Props) {
  const { state, updateState, actions } = props;

  // Prefer explicit props if your shell passes them; otherwise read from state.
  const template: Step3Template | null =
    (props.template as any) ??
    ((state as any).step3Template ?? (state as any).profileTemplate ?? null);

  const answers: Step3Answers =
    (props.answers as any) ??
    ((state as any).step3Answers ?? (state as any).profileAnswers ?? {});

  const industry = (state as any).industry ?? (state as any).industry?.selected;

  const hero = useMemo(() => getIndustryHero(industry), [industry]);

  const questions: QuestionLike[] = useMemo(() => {
    const q = (template as any)?.questions;
    return Array.isArray(q) ? (q as QuestionLike[]) : [];
  }, [template]);

  const requiredIds: string[] = useMemo(() => {
    return questions.filter((q) => q.required).map((q) => q.id);
  }, [questions]);

  // Tier 1: Blocker IDs (gates Step 3 completion)
  const blockerIds: string[] = useMemo(() => {
    if (!industry) return [];
    const tier1 = getTier1Blockers(industry);
    // Only include blockers that exist in the current question set
    return tier1.filter(id => questions.some(q => q.id === id));
  }, [industry, questions]);

  // Tier 2: Recommended IDs (doesn't gate, but shown as "recommended")
  const recommendedIds: string[] = useMemo(() => {
    return requiredIds.filter(id => !blockerIds.includes(id));
  }, [requiredIds, blockerIds]);

  const missingRequired: string[] = useMemo(() => {
    if (!requiredIds.length) return [];
    const missing: string[] = [];
    for (const id of requiredIds) {
      if (!isAnswered(answers?.[id])) missing.push(id);
    }
    return missing;
  }, [requiredIds, answers]);

  // Tier 1: Missing blockers (actually gates completion)
  const missingBlockers: string[] = useMemo(() => {
    if (!blockerIds.length) return [];
    const missing: string[] = [];
    for (const id of blockerIds) {
      if (!isAnswered(answers?.[id])) missing.push(id);
    }
    return missing;
  }, [blockerIds, answers]);

  /**
   * Step3 completeness rules (V7 contract + Tier 1/Tier 2 split):
   * - If template is absent OR has no blocker questions => allow continue (non-blocking)
   * - If Tier 1 blockers exist => gate until all blockers answered
   * - Tier 2 (recommended) questions don't gate, but shown as "recommended" for emphasis
   * 
   * Updated: Feb 3, 2026 — Car wash reduced from 24 to 8 blockers
   */
  const step3Complete: boolean = useMemo(() => {
    if (!template) return true;
    if (!blockerIds.length) return true;  // No blockers = always passable
    return missingBlockers.length === 0;  // Only blockers gate completion
  }, [template, blockerIds.length, missingBlockers.length]);

  // Write completion back to state for gates (SSOT)
  // NOTE: Only needed when shell uses updateState pattern
  useEffect(() => {
    if (!updateState) return;

    const current = (state as any).step3Complete;
    const currentMissing = (state as any).step3MissingRequired;
    const currentMissingBlockers = (state as any).step3MissingBlockers;

    // Avoid loops: only write when changes
    const missingChanged =
      Array.isArray(currentMissing)
        ? currentMissing.join("|") !== missingRequired.join("|")
        : missingRequired.length > 0;
    
    const blockersChanged =
      Array.isArray(currentMissingBlockers)
        ? currentMissingBlockers.join("|") !== missingBlockers.join("|")
        : missingBlockers.length > 0;

    if (current !== step3Complete || missingChanged || blockersChanged) {
      updateState({
        step3Complete,
        step3MissingRequired: missingRequired,
        step3MissingBlockers: missingBlockers,  // NEW: Track blocker progress
      } as Partial<WizardV7State>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3Complete, missingRequired.join("|"), missingBlockers.join("|")]);

  // Answer update: prefer actions.setStep3Answer, fall back to updateState
  const setAnswer = useCallback(
    (id: string, value: unknown) => {
      // Primary: use actions from shell (triggers SSOT dispatch)
      if (actions?.setStep3Answer) {
        actions.setStep3Answer(id, value);
        return;
      }
      // Fallback: direct state update
      if (updateState) {
        const nextAnswers = { ...(answers || {}), [id]: value };
        updateState({
          step3Answers: nextAnswers,
        } as Partial<WizardV7State>);
      }
    },
    [actions, updateState, answers]
  );

  // --- Render helpers ---
  const renderQuestion = (q: QuestionLike) => {
    const value = answers?.[q.id];

    const label = q.label ?? q.prompt ?? q.id;
    const required = !!q.required;
    const type = q.type ?? (Array.isArray(q.options) ? "select" : "text");

    // Select / radio
    if (type === "select" || type === "dropdown") {
      const opts = Array.isArray(q.options) ? q.options : [];
      return (
        <div key={q.id} className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-100">
              {label} {required ? <span className="text-red-300">*</span> : null}
            </div>
            {!isAnswered(value) && required ? (
              <div className="text-xs text-red-300">Required</div>
            ) : null}
          </div>

          <select
            className="mt-3 w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2 text-slate-100"
            value={asString(value)}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          >
            <option value="">Select…</option>
            {opts.map((o: any) => (
              <option key={o.value ?? o.id ?? o.label} value={asString(o.value ?? o.id ?? o.label)}>
                {o.label ?? o.name ?? asString(o.value)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "number") {
      return (
        <div key={q.id} className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-100">
              {label} {required ? <span className="text-red-300">*</span> : null}
            </div>
            {!isAnswered(value) && required ? (
              <div className="text-xs text-red-300">Required</div>
            ) : null}
          </div>

          <input
            className="mt-3 w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2 text-slate-100"
            type="number"
            inputMode="numeric"
            placeholder={q.placeholder ?? ""}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return setAnswer(q.id, "");
              const n = Number(raw);
              setAnswer(q.id, Number.isFinite(n) ? n : raw);
            }}
          />
        </div>
      );
    }

    // Default: text
    return (
      <div key={q.id} className="rounded-xl border border-slate-700/60 p-4 bg-slate-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-100">
            {label} {required ? <span className="text-red-300">*</span> : null}
          </div>
          {!isAnswered(value) && required ? (
            <div className="text-xs text-red-300">Required</div>
          ) : null}
        </div>

        <input
          className="mt-3 w-full rounded-lg bg-slate-950/60 border border-slate-700/60 px-3 py-2 text-slate-100"
          type="text"
          placeholder={q.placeholder ?? ""}
          value={asString(value)}
          onChange={(e) => setAnswer(q.id, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header / Hero */}
      <div className="rounded-2xl overflow-hidden border border-slate-700/40 bg-slate-950/40">
        <div className="relative h-36 w-full">
          <img
            src={hero.img}
            alt={hero.title}
            className="h-36 w-full object-cover opacity-70"
            onError={(e) => {
              // Never crash on image errors
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
          <div className="absolute left-5 top-5">
            <div className="text-lg font-extrabold text-slate-50">Step 3 — Profile</div>
            <div className="text-sm text-slate-300">{hero.title}</div>
          </div>
        </div>

        {/* Assist panel (non-blocking) - simplified for V7 contract */}
        <div className="p-4">
          {/* Step3SystemAssist requires SSOT actions we no longer have.
              For now, show a simple banner. Replace when actions are wired. */}
          <div className="rounded-lg bg-slate-800/50 p-3 text-sm text-slate-300">
            <span className="text-slate-100 font-medium">💡 Tip:</span>{" "}
            Fill in your facility details below for an accurate quote.
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {!template ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200">
            We couldn't load the profile questions. You can continue — we'll use defaults.
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-xl border border-slate-700/40 bg-slate-950/30 p-4 text-slate-300">
            No profile questions required for this industry.
          </div>
        ) : (
          questions.map(renderQuestion)
        )}
      </div>

      {/* Continue Buttons */}
      <div className="mt-6 flex flex-col items-end gap-3">
        {/* Primary: Full submission (only when complete) */}
        <button
          type="button"
          data-testid="step3-continue"
          onClick={() => {
            if (actions?.submitStep3) {
              void actions.submitStep3();
            }
          }}
          disabled={!step3Complete || state.pricingStatus === "pending"}
          className={`
            px-6 py-3 rounded-xl font-bold text-base transition-all
            ${step3Complete && state.pricingStatus !== "pending"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 cursor-pointer"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }
          `}
        >
          See Results →
        </button>

        {/* Escape hatch: Partial submission (when incomplete) */}
        {!step3Complete && actions?.submitStep3Partial && (
          <button
            type="button"
            data-testid="step3-continue-partial"
            onClick={() => {
              if (actions.submitStep3Partial) {
                void actions.submitStep3Partial();
              }
            }}
            disabled={state.pricingStatus === "pending"}
            className="
              px-5 py-2 rounded-lg text-sm transition-all
              bg-slate-700/50 text-slate-300 border border-slate-600/50
              hover:bg-slate-700 hover:text-white hover:border-slate-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            See Load Results (incomplete) →
          </button>
        )}
      </div>

      {/* DEV diagnostic */}
      {import.meta.env.DEV ? (
        <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-950/40 p-3 text-xs text-slate-300">
          <div>
            <span className="text-slate-100 font-semibold">step3Complete:</span>{" "}
            {String(step3Complete)}
          </div>
          {missingRequired.length ? (
            <div className="mt-1">
              <span className="text-slate-100 font-semibold">missingRequired:</span>{" "}
              {missingRequired.join(", ")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
