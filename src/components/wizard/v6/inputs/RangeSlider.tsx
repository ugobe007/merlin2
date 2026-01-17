/**
 * RangeSlider - Modern percentage/range slider
 * Used for: Occupancy rate, utilization, efficiency targets
 */
import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: string;
  hint?: string;
  showPresets?: boolean;
  presets?: number[];
}

export function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  unit = '%',
  icon,
  hint,
  showPresets = true,
  presets
}: RangeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const defaultPresets = presets || [25, 50, 75, 100].filter(p => p >= min && p <= max);

  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-purple-500/50 transition-all">
      {/* Label Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl">{icon}</span>}
          <span className="text-white font-medium text-lg">{label}</span>
        </div>
        <div className="text-3xl font-bold text-purple-400">
          {value}{unit}
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        {/* Filled portion */}
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-4 border-purple-500 transition-all"
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>

      {/* Actual Range Input (invisible but functional) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ marginTop: '-3rem', height: '5rem' }}
      />

      {/* Preset Buttons */}
      {showPresets && (
        <div className="flex justify-between mt-4">
          {defaultPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                value === preset
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-slate-600 hover:text-white'
              }`}
            >
              {preset}{unit}
            </button>
          ))}
        </div>
      )}

      {/* Min/Max Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-slate-500 text-xs text-center mt-3">{hint}</p>
      )}
    </div>
  );
}
