/**
 * IconSelector - Visual card selector with icons
 * Used for: Pool type, HVAC type, hotel category, etc.
 */
import React from 'react';
import { Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  energyImpact?: 'low' | 'medium' | 'high';
}

interface IconSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: string;
  columns?: 2 | 3 | 4;
  hint?: string;
}

export function IconSelector({
  label,
  value,
  onChange,
  options,
  icon,
  columns = 3,
  hint
}: IconSelectorProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4'
  };

  const impactColors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/50',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    high: 'bg-red-500/20 text-red-400 border-red-500/50'
  };

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      {/* Label Row */}
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-white font-medium text-lg">{label}</span>
      </div>

      {/* Options Grid */}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5/30 border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              {option.icon && (
                <div className="text-3xl mb-2">{option.icon}</div>
              )}

              {/* Label */}
              <div className={`font-semibold ${isSelected ? 'text-purple-200' : 'text-white'}`}>
                {option.label}
              </div>

              {/* Description */}
              {option.description && (
                <div className="text-slate-400 text-xs mt-1">{option.description}</div>
              )}

              {/* Energy Impact Badge */}
              {option.energyImpact && (
                <div className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium border ${impactColors[option.energyImpact]}`}>
                  {option.energyImpact === 'high' ? '⚡ High Energy' : 
                   option.energyImpact === 'medium' ? '⚡ Medium' : '✓ Low Energy'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-slate-500 text-xs text-center mt-3">{hint}</p>
      )}
    </div>
  );
}
