// ============================================
// MERLIN STEP 3 INPUT COMPONENTS
// File: src/components/wizard/v6/step3/inputs/index.tsx
// ============================================

import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// COLOR SCHEME SYSTEM
// ============================================

export interface ColorScheme {
  primary: string;
  primaryGradient: string;
  border: string;
  borderSelected: string;
  focusBorder: string;
  bgSelected: string;
  bgHover: string;
  text: string;
  textSelected: string;
  ring: string;
  iconBg: string;
  iconBgSelected: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  // Section 0: Purple
  {
    primary: "violet-500",
    primaryGradient: "from-violet-500 to-purple-500",
    border: "border-violet-300",
    borderSelected: "border-violet-500",
    focusBorder: "focus:border-violet-500",
    bgSelected: "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
    bgHover: "hover:bg-violet-50 hover:border-violet-400",
    text: "text-violet-700",
    textSelected: "text-violet-700",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
    iconBgSelected: "bg-violet-500 text-white",
  },
  // Section 1: Gradient Purple
  {
    primary: "purple-500",
    primaryGradient: "from-purple-500 via-indigo-500 to-purple-600",
    border: "border-purple-300",
    borderSelected: "border-purple-500",
    focusBorder: "focus:border-purple-500",
    bgSelected: "bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-purple-600/5",
    bgHover: "hover:bg-purple-50 hover:border-purple-400",
    text: "text-purple-700",
    textSelected: "text-purple-700",
    ring: "ring-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
    iconBgSelected: "bg-gradient-to-br from-purple-500 to-indigo-500 text-white",
  },
  // Section 2: Light Blue
  {
    primary: "sky-500",
    primaryGradient: "from-sky-400 to-cyan-500",
    border: "border-sky-300",
    borderSelected: "border-sky-500",
    focusBorder: "focus:border-sky-500",
    bgSelected: "bg-gradient-to-br from-sky-500/10 to-cyan-500/5",
    bgHover: "hover:bg-sky-50 hover:border-sky-400",
    text: "text-sky-700",
    textSelected: "text-sky-700",
    ring: "ring-sky-200",
    iconBg: "bg-sky-100 text-sky-600",
    iconBgSelected: "bg-sky-500 text-white",
  },
  // Section 3: Amber
  {
    primary: "amber-500",
    primaryGradient: "from-amber-400 to-orange-500",
    border: "border-amber-300",
    borderSelected: "border-amber-500",
    focusBorder: "focus:border-amber-500",
    bgSelected: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    bgHover: "hover:bg-amber-50 hover:border-amber-400",
    text: "text-amber-700",
    textSelected: "text-amber-700",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    iconBgSelected: "bg-amber-500 text-white",
  },
  // Section 4: Emerald (cycle repeats)
  {
    primary: "emerald-500",
    primaryGradient: "from-emerald-400 to-teal-500",
    border: "border-emerald-300",
    borderSelected: "border-emerald-500",
    focusBorder: "focus:border-emerald-500",
    bgSelected: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
    bgHover: "hover:bg-emerald-50 hover:border-emerald-400",
    text: "text-emerald-700",
    textSelected: "text-emerald-700",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
    iconBgSelected: "bg-emerald-500 text-white",
  },
  // Section 5: Pink
  {
    primary: "pink-500",
    primaryGradient: "from-pink-400 to-rose-500",
    border: "border-pink-300",
    borderSelected: "border-pink-500",
    focusBorder: "focus:border-pink-500",
    bgSelected: "bg-gradient-to-br from-pink-500/10 to-rose-500/5",
    bgHover: "hover:bg-pink-50 hover:border-pink-400",
    text: "text-pink-700",
    textSelected: "text-pink-700",
    ring: "ring-pink-200",
    iconBg: "bg-pink-100 text-pink-600",
    iconBgSelected: "bg-pink-500 text-white",
  },
];

export const getColorScheme = (sectionIndex: number): ColorScheme => {
  return COLOR_SCHEMES[sectionIndex % COLOR_SCHEMES.length];
};

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
  if (iconName && /[\u{1F300}-\u{1F9FF}]/u.test(iconName)) {
    return <span className={className || "text-2xl"}>{iconName}</span>;
  }

  // Try as Lucide icon
  if (iconName) {
    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
    ];
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
}

export const PanelButtonGroup: React.FC<PanelButtonGroupProps> = ({
  options,
  value,
  onChange,
  columns = Math.min(options.length, 4) as 2 | 3 | 4 | 5 | 6,
  colorScheme,
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
    <div className={cn("grid gap-3", gridCols[columns])}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-xl transition-all duration-200",
              "hover:scale-[1.02]",
              isSelected
                ? `border-2 ${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]`
                : `border border-transparent bg-slate-800/50 hover:bg-slate-700/50`
            )}
          >
            {/* Selection checkmark */}
            {isSelected && (
              <div
                className={cn(
                  "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center",
                  scheme.iconBgSelected
                )}
              >
                <LucideIcons.Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Icon - always render, using option.value to look up from QuestionIconMap */}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                isSelected
                  ? `bg-gradient-to-br ${scheme.primaryGradient} text-white`
                  : "bg-slate-700/50 text-slate-300"
              )}
            >
              {getIcon(option.icon, "w-5 h-5", undefined, option.value)}
            </div>

            {/* Label */}
            <span
              className={cn(
                "text-sm font-medium text-center",
                isSelected ? scheme.textSelected : "text-slate-200"
              )}
            >
              {option.label}
            </span>

            {/* Description */}
            {option.description && (
              <span className="text-xs text-slate-400 text-center mt-1 line-clamp-2">
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
    <div className="flex gap-3">
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
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all duration-200",
              "hover:scale-[1.01]",
              isSelected
                ? val
                  ? `${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/10 ${scheme.textSelected}`
                  : "border-slate-400 bg-slate-50 text-slate-700"
                : `border-slate-200 bg-white ${scheme.bgHover}`
            )}
          >
            {getIcon(
              icon,
              cn(
                "w-4 h-4",
                isSelected && val && "text-emerald-600",
                isSelected && !val && "text-slate-600"
              )
            )}
            <span className="font-medium">{label}</span>
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
  const displayValue = formatValue ? formatValue(value) : `${value.toLocaleString()}${suffix}`;
  const percentage = ((value - min) / (max - min)) * 100;

  const increment = () => onChange(Math.min(max, value + step));
  const decrement = () => onChange(Math.max(min, value - step));

  return (
    <div className="space-y-3">
      {/* Value display */}
      <div className="flex justify-center">
        <div
          className={cn(
            "px-4 py-2 rounded-lg font-semibold text-lg",
            scheme.iconBg,
            scheme.textSelected
          )}
        >
          {displayValue}
        </div>
      </div>

      {/* Slider with buttons */}
      <div className="flex items-center gap-3">
        {/* Minus button */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all",
            value <= min
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : `border-slate-300 text-slate-600 ${scheme.bgHover}`
          )}
        >
          <LucideIcons.Minus className="w-5 h-5" />
        </button>

        {/* Slider track */}
        <div className="flex-1 relative h-3 bg-slate-200 rounded-full overflow-hidden">
          {/* Filled portion */}
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
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Thumb indicator */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 rounded-full shadow-md transition-all duration-150 pointer-events-none",
              scheme.borderSelected
            )}
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>

        {/* Plus button */}
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all",
            value >= max
              ? "border-slate-200 text-slate-300 cursor-not-allowed"
              : `border-slate-300 text-slate-600 ${scheme.bgHover}`
          )}
        >
          <LucideIcons.Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-slate-500 px-12">
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
          "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left",
          "hover:scale-[1.01]",
          isSelected
            ? `${scheme.borderSelected} bg-gradient-to-br ${scheme.primaryGradient}/10`
            : `border-slate-200 bg-white ${scheme.bgHover}`
        )}
      >
        {/* Checkbox */}
        <div
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all",
            isSelected ? `bg-gradient-to-br ${scheme.primaryGradient}` : "border-2 border-slate-300"
          )}
        >
          {isSelected && <LucideIcons.Check className="w-3 h-3 text-white" />}
        </div>

        {/* Icon */}
        {option.icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isSelected ? scheme.iconBg : "bg-slate-100 text-slate-500"
            )}
          >
            {getIcon(option.icon, "w-4 h-4", undefined, option.value)}
          </div>
        )}

        {/* Label */}
        <span
          className={cn("text-sm font-medium", isSelected ? scheme.textSelected : "text-slate-700")}
        >
          {option.label}
        </span>
      </button>
    );
  };

  if (hasGroups) {
    return (
      <div className="space-y-4">
        {Object.entries(groups).map(([groupName, groupOptions]) => (
          <div key={groupName}>
            {groupName !== "default" && (
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {groupName}
              </h4>
            )}
            <div className={cn("grid gap-2", gridCols[columns])}>
              {groupOptions.map(renderOption)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className={cn("grid gap-2", gridCols[columns])}>{options.map(renderOption)}</div>;
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
    <div className="space-y-2">
      <div className="flex gap-3">
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
              "w-full px-4 py-3 rounded-xl text-lg font-medium transition-all border-2",
              "focus:outline-none focus:ring-2",
              useEstimate
                ? "bg-slate-100 border-slate-200 text-slate-400"
                : `bg-white ${scheme.border} text-slate-700 ${scheme.focusBorder} ${scheme.ring}`
            )}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              {suffix}
            </span>
          )}
        </div>
      </div>

      {allowEstimate && onEstimateToggle && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useEstimate}
            onChange={(e) => onEstimateToggle(e.target.checked)}
            className={cn(
              "w-4 h-4 rounded border-slate-300 focus:ring-2",
              `text-${scheme.primary.replace("500", "600")}`,
              scheme.ring
            )}
          />
          <span className="text-sm text-slate-600">Estimate for me</span>
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
    <div className="flex items-center justify-between py-3 border-b border-slate-200 mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
              scheme.primaryGradient,
              "text-white"
            )}
          >
            {getIcon(icon, "w-4 h-4")}
          </div>
        )}
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>

      {questionCount !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isComplete ? "text-emerald-600" : "text-slate-500"
          )}
        >
          {isComplete && <LucideIcons.CheckCircle2 className="w-4 h-4" />}
          <span>
            {completedCount}/{questionCount}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// SMART QUESTION (Auto-selects component)
// ============================================

interface SmartQuestionProps {
  question: {
    id: string;
    question_text: string;
    question_type: "select" | "multiselect" | "number" | "boolean" | "text";
    field_name: string;
    options?: Option[] | QuestionConfig;
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
            />
          );
        }
        // Fallback to dropdown for 7+ options
        return (
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2",
              scheme.focusBorder,
              scheme.ring
            )}
          >
            <option value="">Select an option...</option>
            {parsedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
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
              value={((value as number | null) ?? numConfig.default ?? numConfig.min ?? 0)}
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

      default:
        return (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2",
              scheme.focusBorder,
              scheme.ring
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          {question_text}
          {is_required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {help_text && <span className="block text-xs text-slate-500 mt-0.5">{help_text}</span>}
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
  SectionHeader,
  SmartQuestion,
  getIcon,
};
