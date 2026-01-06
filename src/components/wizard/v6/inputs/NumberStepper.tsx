/**
 * NumberStepper - Modern number input with +/- buttons
 * Used for: Beds, rooms, bays, racks, floors, etc.
 */
import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: string;
  hint?: string;
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  icon,
  hint
}: NumberStepperProps) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 hover:border-purple-500/50 transition-all">
      {/* Label Row */}
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-white font-medium text-lg">{label}</span>
      </div>

      {/* Stepper Control */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={decrease}
          disabled={value <= min}
          className="w-14 h-14 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
        >
          <Minus className="w-6 h-6 text-white" />
        </button>

        <div className="flex-1 text-center">
          <div className="text-4xl font-bold text-white">{value.toLocaleString()}</div>
          {unit && <div className="text-slate-400 text-sm mt-1">{unit}</div>}
        </div>

        <button
          onClick={increase}
          disabled={value >= max}
          className="w-14 h-14 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex gap-2 mt-4 justify-center">
        {[min, Math.round((max - min) * 0.25) + min, Math.round((max - min) * 0.5) + min, Math.round((max - min) * 0.75) + min, max].map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === preset
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white'
            }`}
          >
            {preset.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-slate-500 text-xs text-center mt-3">{hint}</p>
      )}
    </div>
  );
}
