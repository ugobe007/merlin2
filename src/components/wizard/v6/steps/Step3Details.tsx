/**
 * V6 Step 3: Facility Details - High contrast inputs, realistic scales
 */
import React from 'react';
import { Building2, Clock, Zap, Sun, Hash } from 'lucide-react';
import type { WizardState, FacilityDetails } from '../types';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

// Industry-specific configurations
const INDUSTRY_CONFIG: Record<string, {
  primaryField: { key: keyof FacilityDetails; label: string; icon: string; min: number; max: number; step: number; unit: string; presets: number[] };
  showSqFt: boolean;
  sqFtRange: { min: number; max: number; presets: number[] };
}> = {
  hotel: {
    primaryField: { key: 'roomCount', label: 'Number of Rooms', icon: '🛏️', min: 10, max: 1000, step: 10, unit: 'rooms', presets: [50, 150, 300, 500, 800] },
    showSqFt: false,
    sqFtRange: { min: 1000, max: 500000, presets: [10000, 50000, 100000, 250000, 500000] }
  },
  car_wash: {
    primaryField: { key: 'tunnelCount', label: 'Number of Wash Bays/Tunnels', icon: '🚗', min: 1, max: 7, step: 1, unit: 'bays', presets: [1, 2, 3, 5, 7] },
    showSqFt: true,
    sqFtRange: { min: 1000, max: 50000, presets: [2000, 5000, 10000, 25000, 50000] }
  },
  ev_charging: {
    primaryField: { key: 'chargerCount', label: 'Number of Chargers', icon: '⚡', min: 2, max: 100, step: 2, unit: 'chargers', presets: [4, 10, 20, 50, 100] },
    showSqFt: true,
    sqFtRange: { min: 500, max: 100000, presets: [1000, 5000, 20000, 50000, 100000] }
  },
  data_center: {
    primaryField: { key: 'rackCount', label: 'Number of Server Racks', icon: '🖥️', min: 10, max: 1000, step: 10, unit: 'racks', presets: [20, 50, 100, 250, 500] },
    showSqFt: true,
    sqFtRange: { min: 5000, max: 500000, presets: [10000, 50000, 100000, 250000, 500000] }
  },
  hospital: {
    primaryField: { key: 'bedCount', label: 'Number of Beds', icon: '🏥', min: 10, max: 1000, step: 10, unit: 'beds', presets: [25, 100, 250, 500, 1000] },
    showSqFt: true,
    sqFtRange: { min: 10000, max: 1000000, presets: [50000, 150000, 300000, 500000, 1000000] }
  },
  default: {
    primaryField: { key: 'squareFootage', label: 'Total Square Footage', icon: '📐', min: 1000, max: 500000, step: 1000, unit: 'sq ft', presets: [5000, 25000, 50000, 100000, 250000] },
    showSqFt: true,
    sqFtRange: { min: 1000, max: 500000, presets: [5000, 25000, 50000, 100000, 250000] }
  }
};

function InputCard({ 
  label, 
  icon, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  unit, 
  presets 
}: { 
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  presets: number[];
}) {
  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Value display */}
      <div className="flex justify-end mb-4">
        <div className="px-4 py-2 bg-purple-100 border-2 border-purple-300 rounded-xl">
          <span className="text-2xl font-bold text-purple-700">{value.toLocaleString()}</span>
          <span className="text-purple-600 ml-2">{unit}</span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === preset
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
            }`}
          >
            {formatValue(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Step3Details({ state, updateState }: Props) {
  const config = INDUSTRY_CONFIG[state.industry] || INDUSTRY_CONFIG.default;
  
  const updateFacility = (key: keyof FacilityDetails, value: number) => {
    updateState({
      facilityDetails: { ...state.facilityDetails, [key]: value }
    });
  };

  const industryLabel = state.industryName || 'Your Facility';

  return (
    <div className="space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Tell Us About Your Facility</h1>
        <p className="text-purple-300">{industryLabel} details</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Primary industry-specific field */}
        <InputCard
          label={config.primaryField.label}
          icon={config.primaryField.icon}
          value={state.facilityDetails[config.primaryField.key] as number || config.primaryField.min}
          onChange={(val) => updateFacility(config.primaryField.key, val)}
          min={config.primaryField.min}
          max={config.primaryField.max}
          step={config.primaryField.step}
          unit={config.primaryField.unit}
          presets={config.primaryField.presets}
        />

        {/* Square footage (if applicable) */}
        {config.showSqFt && config.primaryField.key !== 'squareFootage' && (
          <InputCard
            label="Total Facility Square Footage"
            icon="📐"
            value={state.facilityDetails.squareFootage || config.sqFtRange.min}
            onChange={(val) => updateFacility('squareFootage', val)}
            min={config.sqFtRange.min}
            max={config.sqFtRange.max}
            step={1000}
            unit="sq ft"
            presets={config.sqFtRange.presets}
          />
        )}

        {/* Operating Hours */}
        <InputCard
          label="Operating Hours Per Day"
          icon="🕐"
          value={state.facilityDetails.operatingHours || 12}
          onChange={(val) => updateFacility('operatingHours', val)}
          min={1}
          max={24}
          step={1}
          unit="hours/day"
          presets={[8, 12, 16, 20, 24]}
        />

        {/* Optional: Rooftop space for solar */}
        <InputCard
          label="Available Rooftop Space (optional)"
          icon="☀️"
          value={state.facilityDetails.rooftopSquareFootage || 0}
          onChange={(val) => updateFacility('rooftopSquareFootage', val)}
          min={0}
          max={100000}
          step={500}
          unit="sq ft"
          presets={[0, 5000, 10000, 25000, 50000]}
        />
      </div>

      {/* Ready indicator */}
      {(state.facilityDetails.squareFootage > 0 || 
        (state.facilityDetails.roomCount && state.facilityDetails.roomCount > 0) ||
        (state.facilityDetails.tunnelCount && state.facilityDetails.tunnelCount > 0) ||
        (state.facilityDetails.chargerCount && state.facilityDetails.chargerCount > 0)) && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium">✓ Facility details captured. Click Continue!</p>
        </div>
      )}
    </div>
  );
}
