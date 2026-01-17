/**
 * ToggleCard - Modern Yes/No toggle with visual cards
 * Used for: Binary questions (24/7 operations, backup power, etc.)
 */
import React from 'react';
import { Check, X } from 'lucide-react';

interface ToggleCardProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  icon?: string;
  description?: string;
  yesLabel?: string;
  noLabel?: string;
}

export function ToggleCard({
  label,
  value,
  onChange,
  icon,
  description,
  yesLabel = 'Yes',
  noLabel = 'No'
}: ToggleCardProps) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-purple-500/50 transition-all">
      {/* Label Row */}
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <span className="text-white font-medium text-lg">{label}</span>
      </div>

      {description && (
        <p className="text-slate-400 text-sm mb-4">{description}</p>
      )}

      {/* Toggle Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Yes Card */}
        <button
          onClick={() => onChange(true)}
          className={`relative p-4 rounded-xl border-2 transition-all ${
            value === true
              ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20'
              : 'bg-white/5/30 border-white/10 hover:border-green-500/50 hover:bg-green-500/10'
          }`}
        >
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
            value === true ? 'bg-green-500' : 'bg-slate-600'
          }`}>
            <Check className={`w-6 h-6 ${value === true ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <span className={`block text-center font-semibold ${
            value === true ? 'text-green-300' : 'text-slate-300'
          }`}>
            {yesLabel}
          </span>
        </button>

        {/* No Card */}
        <button
          onClick={() => onChange(false)}
          className={`relative p-4 rounded-xl border-2 transition-all ${
            value === false
              ? 'bg-slate-600/30 border-slate-400 shadow-lg'
              : 'bg-white/5/30 border-white/10 hover:border-slate-400/50 hover:bg-slate-600/20'
          }`}
        >
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
            value === false ? 'bg-slate-500' : 'bg-slate-600'
          }`}>
            <X className={`w-6 h-6 ${value === false ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <span className={`block text-center font-semibold ${
            value === false ? 'text-slate-200' : 'text-slate-300'
          }`}>
            {noLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
