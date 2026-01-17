/**
 * MultiSelect - Pill/chip style multi-selection
 * Used for: Amenities, features, equipment, services
 */
import React from 'react';
import { Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: string;
  energyKwh?: number;
}

interface MultiSelectProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  icon?: string;
  hint?: string;
  maxSelections?: number;
}

export function MultiSelect({
  label,
  values,
  onChange,
  options,
  icon,
  hint,
  maxSelections
}: MultiSelectProps) {
  const toggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      if (maxSelections && values.length >= maxSelections) return;
      onChange([...values, optionValue]);
    }
  };

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      {/* Label Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <span className="text-white font-medium text-lg">{label}</span>
        </div>
        <span className="text-slate-400 text-sm">
          {values.length} selected
          {maxSelections && ` (max ${maxSelections})`}
        </span>
      </div>

      {/* Options as Pills */}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = values.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              disabled={!isSelected && maxSelections !== undefined && values.length >= maxSelections}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                  : 'bg-white/5/30 border-white/10 text-slate-300 hover:border-purple-500/50 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-purple-400" />}
              {option.icon && <span>{option.icon}</span>}
              <span className="font-medium">{option.label}</span>
              {option.energyKwh && isSelected && (
                <span className="text-xs text-amber-400">+{(option.energyKwh / 1000).toFixed(0)}k kWh</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-slate-500 text-xs mt-3">{hint}</p>
      )}
    </div>
  );
}
