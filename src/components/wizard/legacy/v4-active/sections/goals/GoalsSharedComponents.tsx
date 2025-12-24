// ═══════════════════════════════════════════════════════════════════════════
// GOALS SHARED COMPONENTS - Extracted Dec 16, 2025
// Reusable components shared across Goals sub-sections
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { findClosestPresetIndex } from '../../constants/wizardConstants';
import type { WizardState } from '../../types/wizardTypes';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SubComponentProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  /** Optional: highlight this option when user needs more power */
  highlightForPower?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER SLIDER (Reusable)
// ═══════════════════════════════════════════════════════════════════════════

interface PowerSliderProps {
  value: number;
  onChange: (v: number) => void;
  presets: { value: number; label: string }[];
  colorClass: string;
  label: string;
}

export function PowerSlider({ value, onChange, presets, colorClass, label }: PowerSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-20">{label}:</span>
      <button
        onClick={() => {
          const idx = findClosestPresetIndex(value, presets);
          const newIdx = Math.max(0, idx - 1);
          onChange(presets[newIdx].value);
        }}
        className={`w-10 h-10 bg-${colorClass}-100 hover:bg-${colorClass}-200 rounded-lg flex items-center justify-center text-${colorClass}-700 font-bold`}
      >
        <Minus className="w-5 h-5" />
      </button>
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={presets.length - 1}
          step={1}
          value={findClosestPresetIndex(value, presets)}
          onChange={(e) => onChange(presets[parseInt(e.target.value)].value)}
          className={`w-full h-2 bg-${colorClass}-200 rounded-lg appearance-none cursor-pointer accent-${colorClass}-500`}
        />
      </div>
      <button
        onClick={() => {
          const idx = findClosestPresetIndex(value, presets);
          const newIdx = Math.min(presets.length - 1, idx + 1);
          onChange(presets[newIdx].value);
        }}
        className={`w-10 h-10 bg-${colorClass}-100 hover:bg-${colorClass}-200 rounded-lg flex items-center justify-center text-${colorClass}-700 font-bold`}
      >
        <Plus className="w-5 h-5" />
      </button>
      <div className="w-28 text-right">
        {value >= 1000 ? (
          <>
            <span className={`text-2xl font-black text-${colorClass}-600`}>{(value / 1000).toFixed(1)}</span>
            <span className="text-sm text-gray-500 ml-1">MW</span>
          </>
        ) : (
          <>
            <span className={`text-2xl font-black text-${colorClass}-600`}>{value}</span>
            <span className="text-sm text-gray-500 ml-1">kW</span>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOF SPACE WARNING
// ═══════════════════════════════════════════════════════════════════════════

export function RoofSpaceWarning({ wizardState }: { wizardState: WizardState }) {
  const solarKW = wizardState.solarKW || 0;
  const sqFt = wizardState.facilitySize || 0;
  const estimatedRoofNeeded = solarKW * 100;
  const ROOF_USABLE_FACTOR = 0.6;
  const estimatedRoofAvailable = sqFt * ROOF_USABLE_FACTOR;
  const isOversized = solarKW > 0 && sqFt > 0 && estimatedRoofNeeded > estimatedRoofAvailable;

  if (!isOversized) return null;

  return (
    <div className="p-3 bg-yellow-100 border border-yellow-400 rounded-lg mb-4">
      <div className="flex items-start gap-2 text-yellow-800 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Space Consideration:</strong> {solarKW >= 1000 ? `${(solarKW/1000).toFixed(1)} MW` : `${solarKW} kW`} solar typically needs ~{estimatedRoofNeeded.toLocaleString()} sq ft.
          Your {sqFt.toLocaleString()} sq ft building has ~{Math.round(estimatedRoofAvailable).toLocaleString()} sq ft available.
          <span className="block mt-1 text-yellow-700">
            💡 Consider ground-mount, carport solar, or reducing to {Math.round(estimatedRoofAvailable / 100)} kW.
          </span>
        </div>
      </div>
    </div>
  );
}
