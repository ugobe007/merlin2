// ============================================
// MERLIN STEP 3 INPUT COMPONENTS
// File: src/components/wizard/v6/step3/inputs/index.tsx
// ============================================

import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { getColorScheme, type ColorScheme } from "./registry";

// ============================================
// TYPES
// ============================================

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  group?: string;
}

interface QuestionConfig {
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  suffix?: string;
  allowEstimate?: boolean;
}

type BooleanQuestionConfig = { trueLabel?: string; falseLabel?: string };
type NumberQuestionConfig = {
  min?: number;
  max?: number;
  step?: number;
  default?: number;
  suffix?: string;
  allowEstimate?: boolean;
};

// ============================================
// UTILITY: Get Icon (supports Lucide, Emoji, SVG, Images)
// ============================================

import { getQuestionIcon, hasOptionMapping } from "../../../QuestionIconMap";

const getIcon = (
  iconName: string | undefined,
  className?: string,
  questionField?: string,
  optionValue?: string
) => {
  // PRIORITY: If we have a known mapping for this option value, use it first
  // This ensures emoji icons from QuestionIconMap override any Lucide icons in DB
  if (optionValue && hasOptionMapping(optionValue)) {
    return getQuestionIcon(questionField, optionValue);
  }

  // If no icon name, try to get from question/option mapping
  if (!iconName && (questionField || optionValue)) {
    return getQuestionIcon(questionField, optionValue);
  }

  // Try as emoji first (higher priority than Lucide)
  // Simple emoji detection: check if string contains emoji codepoints

  if (iconName && /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(iconName)) {
    return <span className={className || "text-2xl"}>{iconName}</span>;
  }

  // Try as Lucide icon
  if (iconName) {
    const Icon = (
      LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
    )[iconName];
    if (Icon) {
      return <Icon className={className || "w-5 h-5"} />;
    }

    // Try question/option mapping
    return getQuestionIcon(questionField, optionValue, iconName);
  }

  // Fallback
  return getQuestionIcon(questionField, optionValue);
};

// ============================================
// PANEL BUTTON GROUP (3-6 options, single select)
// ============================================

interface PanelButtonGroupProps {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4 | 5 | 6;
  colorScheme?: ColorScheme;
  questionField?: string; // Field name for icon lookup in QuestionIconMap
}

export const PanelButtonGroup: React.FC<PanelButtonGroupProps> = ({
  options,
  value,
  onChange,
  columns = Math.min(options.length, 4) as 2 | 3 | 4 | 5 | 6,
  colorScheme,
  questionField,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-2", gridCols[columns])}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex flex-col items-center p-3 rounded-xl transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              isSelected
                ? `border-2 ${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/10 shadow-lg shadow-violet-500/20`
                : `border border-white/10 bg-white/5/40 hover:bg-white/5/60 hover:border-white/10`
            )}
          >
            {/* Selection indicator - sleek corner pill */}
            {isSelected && (
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-900",
                  `bg-gradient-to-br ${scheme.primaryGradient}`
                )}
              >
                <LucideIcons.Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            )}

            {/* Icon container - compact with gradient glow on select */}
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-all",
                isSelected
                  ? `bg-gradient-to-br ${scheme.primaryGradient} text-white shadow-md shadow-violet-500/30`
                  : "bg-white/5/60 text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
              )}
            >
              {getIcon(option.icon, "w-4 h-4", questionField, option.value)}
            </div>

            {/* Label - tighter */}
            <span
              className={cn(
                "text-xs font-medium text-center leading-tight",
                isSelected ? "text-white" : "text-slate-300 group-hover:text-slate-200"
              )}
            >
              {option.label}
            </span>

            {/* Description - only on hover or select, ultra-compact */}
            {option.description && (
              <span
                className={cn(
                  "text-[10px] text-slate-500 text-center mt-0.5 line-clamp-1 transition-opacity",
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// TOGGLE BUTTONS (Yes/No, binary choice)
// ============================================

interface ToggleButtonsProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  colorScheme?: ColorScheme;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No",
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  return (
    <div className="flex gap-2">
      {[
        { val: true, label: trueLabel, icon: "Check" },
        { val: false, label: falseLabel, icon: "X" },
      ].map(({ val, label, icon }) => {
        const isSelected = value === val;
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all duration-200",
              "hover:scale-[1.01] active:scale-[0.99]",
              isSelected
                ? val
                  ? `${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/15 shadow-md shadow-emerald-500/20`
                  : "border-slate-500 bg-white/5 text-slate-300"
                : `border-white/10 bg-white/5/40 hover:bg-white/5 hover:border-white/10`
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                isSelected && val && `bg-gradient-to-br ${scheme.primaryGradient}`,
                isSelected && !val && "bg-slate-600",
                !isSelected && "bg-white/5"
              )}
            >
              {getIcon(icon, cn("w-3 h-3", isSelected ? "text-white" : "text-slate-500"))}
            </div>
            <span
              className={cn(
                "font-medium text-sm",
                isSelected ? (val ? "text-white" : "text-slate-300") : "text-slate-400"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// SLIDER WITH +/- BUTTONS
// ============================================

interface SliderWithButtonsProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  formatValue?: (value: number) => string;
  colorScheme?: ColorScheme;
}

export const SliderWithButtons: React.FC<SliderWithButtonsProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  formatValue,
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  // Ensure value is never null - default to min if null/undefined
  const safeValue = value ?? min ?? 0;
  const displayValue = formatValue
    ? formatValue(safeValue)
    : `${safeValue.toLocaleString()}${suffix}`;
  const percentage = ((safeValue - min) / (max - min)) * 100;

  const increment = () => onChange(Math.min(max, safeValue + step));
  const decrement = () => onChange(Math.max(min, safeValue - step));

  return (
    <div className="space-y-2">
      {/* Compact value display */}
      <div className="flex justify-center">
        <div
          className={cn(
            "px-3 py-1.5 rounded-lg font-semibold text-base",
            `bg-gradient-to-br ${scheme.primaryGradient}/20 border border-violet-500/30`,
            "text-white"
          )}
        >
          {displayValue}
        </div>
      </div>

      {/* Slider with buttons - tighter */}
      <div className="flex items-center gap-2">
        {/* Minus button - smaller */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            safeValue <= min
              ? "bg-white/5 text-slate-600 cursor-not-allowed"
              : `bg-white/5 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95`
          )}
        >
          <LucideIcons.Minus className="w-4 h-4" />
        </button>

        {/* Slider track - slimmer */}
        <div className="flex-1 relative h-2 bg-white/5 rounded-full overflow-hidden">
          {/* Filled portion with gradient */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-150",
              scheme.primaryGradient
            )}
            style={{ width: `${percentage}%` }}
          />

          {/* Input slider (invisible but functional) */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Thumb indicator - smaller, sleek */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-150 pointer-events-none",
              `ring-2 ring-offset-1 ring-offset-slate-900`,
              scheme.borderSelected.replace("border-", "ring-")
            )}
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>

        {/* Plus button - smaller */}
        <button
          type="button"
          onClick={increment}
          disabled={safeValue >= max}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            safeValue >= max
              ? "bg-white/5 text-slate-600 cursor-not-allowed"
              : `bg-white/5 text-slate-300 hover:bg-slate-600 hover:text-white active:scale-95`
          )}
        >
          <LucideIcons.Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Min/Max labels - smaller */}
      <div className="flex justify-between text-[10px] text-slate-500 px-10">
        <span>
          {min.toLocaleString()}
          {suffix}
        </span>
        <span>
          {max.toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
};

// ============================================
// CHECKBOX GRID (Multiselect)
// ============================================

interface CheckboxGridProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: 2 | 3 | 4;
  colorScheme?: ColorScheme;
}

export const CheckboxGrid: React.FC<CheckboxGridProps> = ({
  options,
  value = [],
  onChange,
  columns = 3,
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Group options if they have group property
  const groups = options.reduce(
    (acc, opt) => {
      const group = opt.group || "default";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    },
    {} as Record<string, Option[]>
  );

  const hasGroups = Object.keys(groups).length > 1 || !groups["default"];

  const renderOption = (option: Option) => {
    const isSelected = value.includes(option.value);
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => toggleOption(option.value)}
        className={cn(
          "group relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 text-left",
          "hover:scale-[1.01] active:scale-[0.99]",
          isSelected
            ? `border-2 ${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/10`
            : `border border-white/10 bg-white/5/40 hover:bg-white/5 hover:border-white/10`
        )}
      >
        {/* Checkbox - sleeker */}
        <div
          className={cn(
            "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all",
            isSelected
              ? `bg-gradient-to-br ${scheme.primaryGradient}`
              : "border border-white/10 bg-white/5"
          )}
        >
          {isSelected && <LucideIcons.Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </div>

        {/* Icon - compact */}
        {option.icon && (
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              isSelected ? scheme.iconBg : "bg-white/5 text-slate-400"
            )}
          >
            {getIcon(option.icon, "w-3.5 h-3.5", undefined, option.value)}
          </div>
        )}

        {/* Label */}
        <span className={cn("text-xs font-medium", isSelected ? "text-white" : "text-slate-300")}>
          {option.label}
        </span>
      </button>
    );
  };

  if (hasGroups) {
    return (
      <div className="space-y-3">
        {Object.entries(groups).map(([groupName, groupOptions]) => (
          <div key={groupName}>
            {groupName !== "default" && (
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {groupName}
              </h4>
            )}
            <div className={cn("grid gap-1.5", gridCols[columns])}>
              {groupOptions.map(renderOption)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className={cn("grid gap-1.5", gridCols[columns])}>{options.map(renderOption)}</div>;
};

// ============================================
// NUMBER INPUT (Clean text input for numbers)
// ============================================

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  suffix?: string;
  allowEstimate?: boolean;
  onEstimateToggle?: (useEstimate: boolean) => void;
  useEstimate?: boolean;
  colorScheme?: ColorScheme;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = "Enter value",
  suffix,
  allowEstimate,
  onEstimateToggle,
  useEstimate,
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              if (val !== null && min !== undefined && val < min) return;
              if (val !== null && max !== undefined && val > max) return;
              onChange(val);
            }}
            placeholder={placeholder}
            disabled={useEstimate}
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-base font-medium transition-all border",
              "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900",
              useEstimate
                ? "bg-white/5 border-white/10 text-slate-500"
                : `bg-white/5/60 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-amber-400/15`
            )}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
              {suffix}
            </span>
          )}
        </div>
      </div>

      {allowEstimate && onEstimateToggle && (
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <div
            className={cn(
              "w-4 h-4 rounded flex items-center justify-center transition-all",
              useEstimate
                ? `bg-gradient-to-br ${scheme.primaryGradient}`
                : "border border-white/10 bg-white/5 group-hover:border-slate-500"
            )}
          >
            {useEstimate && (
              <LucideIcons.Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            )}
          </div>
          <span className="text-xs text-slate-400 group-hover:text-slate-300">Estimate for me</span>
        </label>
      )}
    </div>
  );
};

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
  icon?: string;
  questionCount?: number;
  completedCount?: number;
  colorScheme?: ColorScheme;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  questionCount,
  completedCount,
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  const isComplete = questionCount !== undefined && completedCount === questionCount;

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 mb-3">
      <div className="flex items-center gap-2">
        {icon && (
          <div
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br",
              scheme.primaryGradient,
              "text-white shadow-sm"
            )}
          >
            {getIcon(icon, "w-3.5 h-3.5")}
          </div>
        )}
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>

      {questionCount !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"
          )}
        >
          {isComplete && <LucideIcons.CheckCircle2 className="w-3 h-3" />}
          <span>
            {completedCount}/{questionCount}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// RANGE BUTTON GROUP (For discrete count ranges)
// Like: 1-5, 6-10, 11-20, 21-50, 50+
// Also supports percentage ranges like: Low (0-40%), Medium (40-60%)
// ============================================

interface RangeOption {
  label: string;
  sublabel?: string; // e.g., "0-40%" shown below the label
  min: number;
  max: number | null;
}

interface RangeButtonGroupProps {
  ranges: RangeOption[];
  value: number | null;
  onChange: (value: number) => void;
  suffix?: string;
  colorScheme?: ColorScheme;
}

export const RangeButtonGroup: React.FC<RangeButtonGroupProps> = ({
  ranges,
  value,
  onChange,
  suffix = "",
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);

  // Find which range the current value falls into
  const selectedRangeIndex =
    value !== null
      ? ranges.findIndex((r) => value >= r.min && (r.max === null || value <= r.max))
      : -1;

  // When user clicks a range, set value to the midpoint (or min for open-ended)
  const handleRangeClick = (range: RangeOption) => {
    if (range.max === null) {
      // Open-ended range like "50+" - use min value
      onChange(range.min);
    } else {
      // Use midpoint of range
      const midpoint = Math.round((range.min + range.max) / 2);
      onChange(midpoint);
    }
  };

  return (
    <div className="space-y-2">
      {/* Range buttons */}
      <div className="grid grid-cols-5 gap-2">
        {ranges.map((range, index) => {
          const isSelected = selectedRangeIndex === index;
          return (
            <button
              key={range.label}
              type="button"
              onClick={() => handleRangeClick(range)}
              className={cn(
                "group relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? `border-2 ${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/15 shadow-lg shadow-violet-500/20`
                  : `border border-white/10 bg-white/5/40 hover:bg-white/5/60 hover:border-white/10`
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-900",
                    `bg-gradient-to-br ${scheme.primaryGradient}`
                  )}
                >
                  <LucideIcons.Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Range label */}
              <span
                className={cn(
                  "text-sm font-semibold",
                  isSelected ? "text-white" : "text-slate-300 group-hover:text-slate-200"
                )}
              >
                {range.label}
              </span>

              {/* Sublabel (e.g., "0-40%") */}
              {range.sublabel && (
                <span
                  className={cn(
                    "text-xs mt-0.5",
                    isSelected ? "text-violet-300" : "text-slate-500 group-hover:text-slate-400"
                  )}
                >
                  {range.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current value display & suffix */}
      {value !== null && suffix && (
        <div className="flex justify-center">
          <span className="text-xs text-slate-500">
            Selected: <span className="text-slate-300 font-medium">{value}</span> {suffix}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// SMART QUESTION (Auto-selects component)
// Supports: select, multiselect, number, boolean, text,
//           range_buttons, slider, toggle
// ============================================

interface RangeConfig {
  ranges?: RangeOption[];
  suffix?: string;
}

interface SliderConfig {
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

interface SmartQuestionProps {
  question: {
    id: string;
    question_text: string;
    question_type:
      | "select"
      | "multiselect"
      | "number"
      | "boolean"
      | "text"
      | "range_buttons"
      | "slider"
      | "toggle";
    field_name: string;
    options?: Option[] | QuestionConfig | RangeConfig | SliderConfig;
    help_text?: string;
    is_required?: boolean;
    icon_name?: string;
  };
  value: unknown;
  onChange: (fieldName: string, value: unknown) => void;
  colorScheme?: ColorScheme;
}

export const SmartQuestion: React.FC<SmartQuestionProps> = ({
  question,
  value,
  onChange,
  colorScheme,
}) => {
  const scheme = colorScheme || getColorScheme(0);
  const { question_text, question_type, field_name, options, help_text, is_required } = question;

  // Parse options based on question type
  const parsedOptions = Array.isArray(options) ? options : [];
  const config = !Array.isArray(options) ? (options as QuestionConfig) : null;

  const renderInput = () => {
    switch (question_type) {
      case "boolean": {
        const boolConfig = (config as BooleanQuestionConfig | null) ?? null;
        return (
          <ToggleButtons
            value={value as boolean | null}
            onChange={(v) => onChange(field_name, v)}
            trueLabel={boolConfig?.trueLabel}
            falseLabel={boolConfig?.falseLabel}
            colorScheme={scheme}
          />
        );
      }

      case "multiselect":
        return (
          <CheckboxGrid
            options={parsedOptions}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => onChange(field_name, v)}
            colorScheme={scheme}
          />
        );

      case "select":
        if (parsedOptions.length <= 6) {
          return (
            <PanelButtonGroup
              options={parsedOptions}
              value={value as string | null}
              onChange={(v) => onChange(field_name, v)}
              colorScheme={scheme}
              questionField={field_name}
            />
          );
        }
        // Fallback to dropdown for 7+ options - dark mode styled
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className={cn(
              "w-full px-3 py-2.5 rounded-xl border bg-white/5/60 text-white",
              "border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/15 focus:border-violet-500",
              "cursor-pointer appearance-none"
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem",
            }}
          >
            <option value="" className="bg-white/5">
              Select an option...
            </option>
            {parsedOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white/5">
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "number": {
        const numConfig: NumberQuestionConfig = (config as NumberQuestionConfig) ?? {
          min: 0,
          max: 1000,
          step: 1,
        };
        const range = (numConfig.max ?? 1000) - (numConfig.min ?? 0);

        if (range > 20) {
          return (
            <SliderWithButtons
              value={(value as number | null) ?? numConfig.default ?? numConfig.min ?? 0}
              onChange={(v) => onChange(field_name, v)}
              min={numConfig.min ?? 0}
              max={numConfig.max ?? 1000}
              step={numConfig.step ?? 1}
              suffix={numConfig.suffix}
              colorScheme={scheme}
            />
          );
        }

        return (
          <NumberInput
            value={value as number | null}
            onChange={(v) => onChange(field_name, v)}
            min={numConfig.min}
            max={numConfig.max}
            suffix={numConfig.suffix}
            allowEstimate={numConfig.allowEstimate}
            colorScheme={scheme}
          />
        );
      }

      // NEW: Range buttons for discrete count ranges
      case "range_buttons": {
        const rangeConfig = config as RangeConfig | null;
        const ranges = rangeConfig?.ranges || [
          { label: "1-10", min: 1, max: 10 },
          { label: "11-25", min: 11, max: 25 },
          { label: "26-50", min: 26, max: 50 },
          { label: "51-100", min: 51, max: 100 },
          { label: "100+", min: 101, max: null },
        ];
        return (
          <RangeButtonGroup
            ranges={ranges}
            value={value as number | null}
            onChange={(v) => onChange(field_name, v)}
            suffix={rangeConfig?.suffix}
            colorScheme={scheme}
          />
        );
      }

      // NEW: Slider for continuous values
      case "slider": {
        const sliderConfig = config as SliderConfig | null;
        return (
          <SliderWithButtons
            value={(value as number | null) ?? sliderConfig?.min ?? 0}
            onChange={(v) => onChange(field_name, v)}
            min={sliderConfig?.min ?? 0}
            max={sliderConfig?.max ?? 1000}
            step={sliderConfig?.step ?? 1}
            suffix={sliderConfig?.suffix}
            colorScheme={scheme}
          />
        );
      }

      // NEW: Toggle for yes/no questions (alias for boolean)
      case "toggle": {
        return (
          <ToggleButtons
            value={value as boolean | null}
            onChange={(v) => onChange(field_name, v)}
            colorScheme={scheme}
          />
        );
      }

      default:
        return (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className={cn(
              "w-full px-3 py-2.5 rounded-xl border bg-white/5/60 text-white placeholder:text-slate-500",
              "border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400/15 focus:border-violet-500"
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block">
        <span className="text-xs font-medium text-slate-300">
          {question_text}
          {is_required && <span className="text-rose-400 ml-0.5">*</span>}
        </span>
        {help_text && <span className="block text-[10px] text-slate-500 mt-0.5">{help_text}</span>}
      </label>
      {renderInput()}
    </div>
  );
};

// ============================================
// EXPORTS
// ============================================

export default {
  PanelButtonGroup,
  ToggleButtons,
  SliderWithButtons,
  CheckboxGrid,
  NumberInput,
  RangeButtonGroup,
  SectionHeader,
  SmartQuestion,
  getIcon,
};
