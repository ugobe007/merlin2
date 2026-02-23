import React from "react";
import { Sparkles } from "lucide-react";
import type { CuratedField } from "@/wizard/v7/schema/curatedFieldsResolver";
import { chooseRendererForQuestion } from "./Step3RendererLogic";
import { asString, isAnswered, isRequired } from "./step3Helpers";

type Step3Answers = Record<string, unknown>;

export type QuestionCardProps = {
  q: CuratedField;
  /** Continuous 0-based index across all visible questions */
  index: number;
  answers: Step3Answers;
  defaultFilledIds: Set<string>;
  onAnswer: (id: string, value: unknown) => void;
  getOptions: (q: CuratedField) => (Record<string, unknown> | string | number)[];
};

/**
 * Renders a single Step 3 curated question with all 8 input renderer variants.
 * Extracted from Step3ProfileV7Curated.tsx (Op3, February 22, 2026).
 * Parent pre-filters visible questions before passing to this component.
 */
export default function QuestionCard({
  q,
  index,
  answers,
  defaultFilledIds,
  onAnswer,
  getOptions,
}: QuestionCardProps) {
  // Alias keeps extracted body unchanged (body calls setAnswer(id, val))
  const setAnswer = onAnswer;


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
      ? (options as (Record<string, unknown> | string | number)[]).map((o: Record<string, unknown> | string | number, i: number): NormalizedOption => {
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
}
