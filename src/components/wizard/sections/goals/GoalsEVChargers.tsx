// ═══════════════════════════════════════════════════════════════════════════
// GOALS EV CHARGERS - Extracted Dec 16, 2025
// EV charger configuration components (existing + new)
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Car } from 'lucide-react';
import type { SubComponentProps } from './GoalsSharedComponents';
import type { WizardState } from '../../types/wizardTypes';

// ═══════════════════════════════════════════════════════════════════════════
// EXISTING EV CHARGERS
// ═══════════════════════════════════════════════════════════════════════════

interface EVChargersExistingProps extends SubComponentProps {
  isEVChargingUseCase: boolean;
}

export function EVChargersExisting({ wizardState, setWizardState, isEVChargingUseCase }: EVChargersExistingProps) {
  if (isEVChargingUseCase) {
    // EV Charging use case - show summary
    return (
      <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-emerald-500">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">Your EV Charging Infrastructure</h4>
            <p className="text-sm text-gray-500">Pre-filled from your earlier selections</p>
          </div>
        </div>
        <ChargerLevelInputs
          l1={wizardState.existingEVL1}
          l2={wizardState.existingEVL2}
          dcfc={wizardState.existingEVL3}
          onL1Change={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
          onL2Change={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
          onDCFCChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
          colorClass="emerald"
        />
        <PowerSourceSelector wizardState={wizardState} setWizardState={setWizardState} />
        <TotalLoadDisplay
          l1={wizardState.existingEVL1}
          l2={wizardState.existingEVL2}
          dcfc={wizardState.existingEVL3}
          hpc={0}
          label="Total EV Load"
          colorClass="emerald"
        />
      </div>
    );
  }

  // Non-EV use cases - Yes/No question
  return (
    <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
      wizardState.hasExistingEV
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg'
        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${wizardState.hasExistingEV ? 'bg-emerald-500' : 'bg-gray-200'}`}>
          <Car className={`w-6 h-6 ${wizardState.hasExistingEV ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">Do you have EXISTING EV chargers?</h4>
          <p className="text-sm text-gray-500">Current charging infrastructure</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWizardState(prev => ({ ...prev, hasExistingEV: true }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.hasExistingEV === true ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >Yes</button>
          <button
            onClick={() => setWizardState(prev => ({
              ...prev, hasExistingEV: false, existingEVL1: 0, existingEVL2: 0, existingEVL3: 0, existingEVPowerSource: 'grid'
            }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.hasExistingEV === false ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >No</button>
        </div>
      </div>

      {wizardState.hasExistingEV && (
        <div className="mt-4 pt-4 border-t border-emerald-200 space-y-4">
          <ChargerLevelInputs
            l1={wizardState.existingEVL1}
            l2={wizardState.existingEVL2}
            dcfc={wizardState.existingEVL3}
            onL1Change={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
            onL2Change={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
            onDCFCChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
            colorClass="emerald"
          />
          <PowerSourceSelector wizardState={wizardState} setWizardState={setWizardState} />
          <TotalLoadDisplay
            l1={wizardState.existingEVL1}
            l2={wizardState.existingEVL2}
            dcfc={wizardState.existingEVL3}
            hpc={0}
            label="Total Existing EV Load"
            colorClass="emerald"
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW EV CHARGERS
// ═══════════════════════════════════════════════════════════════════════════

interface EVChargersNewProps extends SubComponentProps {
  isEVChargingUseCase: boolean;
}

export function EVChargersNew({ wizardState, setWizardState, isEVChargingUseCase }: EVChargersNewProps) {
  return (
    <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
      wizardState.wantsEVCharging
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg'
        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${wizardState.wantsEVCharging ? 'bg-blue-500' : 'bg-gray-200'}`}>
          <Car className={`w-6 h-6 ${wizardState.wantsEVCharging ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">
            {isEVChargingUseCase ? 'Expand charging capacity?' : 'Add NEW EV chargers?'}
          </h4>
          <p className="text-sm text-gray-500">
            {isEVChargingUseCase ? 'Add more chargers beyond current setup' : 'Plan for future charging'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWizardState(prev => ({ ...prev, wantsEVCharging: true }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.wantsEVCharging ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >Yes</button>
          <button
            onClick={() => setWizardState(prev => ({
              ...prev, wantsEVCharging: false, evChargersL2: 0, evChargersDCFC: 0, evChargersHPC: 0
            }))}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              wizardState.wantsEVCharging === false ? 'bg-gray-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >No</button>
        </div>
      </div>

      {wizardState.wantsEVCharging && (
        <div className="mt-4 pt-4 border-t border-blue-200 space-y-4" style={{ scrollMarginTop: '100px' }}>
          <NewChargerInputs wizardState={wizardState} setWizardState={setWizardState} />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700">New EV Load</p>
              <p className="text-2xl font-black text-blue-600">
                {((wizardState.evChargersL1 || 0) * 1.4 + wizardState.evChargersL2 * 11 + wizardState.evChargersDCFC * 150 + wizardState.evChargersHPC * 350).toFixed(0)} kW
              </p>
            </div>
            <div className="bg-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700">Estimated Cost</p>
              <p className="text-2xl font-black text-blue-600">
                ${((wizardState.evChargersL1 || 0) * 3000 + wizardState.evChargersL2 * 10000 + wizardState.evChargersDCFC * 85000 + wizardState.evChargersHPC * 180000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARGER INPUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ChargerLevelInputsProps {
  l1: number;
  l2: number;
  dcfc: number;
  onL1Change: (v: number) => void;
  onL2Change: (v: number) => void;
  onDCFCChange: (v: number) => void;
  colorClass: 'emerald' | 'blue';
}

export function ChargerLevelInputs({ l1, l2, dcfc, onL1Change, onL2Change, onDCFCChange, colorClass }: ChargerLevelInputsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ChargerInput label="Level 1" power="1.4 kW" value={l1} onChange={onL1Change} colorClass={colorClass} multiplier={1.4} maxValue={20} icon="🔌" />
      <ChargerInput label="Level 2" power="7-11 kW" value={l2} onChange={onL2Change} colorClass={colorClass} multiplier={11} maxValue={20} icon="⚡" />
      <ChargerInput label="DCFC" power="50-150 kW" value={dcfc} onChange={onDCFCChange} colorClass={colorClass} multiplier={100} maxValue={10} icon="🚀" />
    </div>
  );
}

interface ChargerInputProps {
  label: string;
  power: string;
  value: number;
  onChange: (v: number) => void;
  colorClass: string;
  multiplier: number;
  maxValue?: number;
  icon?: string;
}

function ChargerInput({ label, power, value, onChange, colorClass, multiplier, maxValue = 20, icon }: ChargerInputProps) {
  const totalKW = value * multiplier;
  const colorStyles = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      slider: 'accent-emerald-500',
      value: 'text-emerald-600',
      badge: 'bg-emerald-500',
      glow: 'shadow-emerald-500/30',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      slider: 'accent-blue-500',
      value: 'text-blue-600',
      badge: 'bg-blue-500',
      glow: 'shadow-blue-500/30',
    },
  }[colorClass] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    slider: 'accent-gray-500',
    value: 'text-gray-600',
    badge: 'bg-gray-500',
    glow: 'shadow-gray-500/30',
  };

  return (
    <div className={`${colorStyles.bg} rounded-2xl p-5 border-2 ${colorStyles.border} transition-all ${value > 0 ? `shadow-lg ${colorStyles.glow}` : ''}`}>
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon || '🔌'}</span>
          <div>
            <h5 className="font-bold text-gray-800 text-lg">{label}</h5>
            <p className="text-sm text-gray-500">{power} each</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${colorStyles.badge} text-white font-black text-xl`}>
          {value}
        </div>
      </div>
      
      {/* Slider */}
      <div className="mt-4">
        <input
          type="range"
          min="0"
          max={maxValue}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`w-full h-3 rounded-full cursor-pointer ${colorStyles.slider}`}
          style={{
            background: `linear-gradient(to right, ${colorClass === 'emerald' ? '#10b981' : '#3b82f6'} 0%, ${colorClass === 'emerald' ? '#10b981' : '#3b82f6'} ${(value/maxValue)*100}%, #e5e7eb ${(value/maxValue)*100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
      </div>
      
      {/* Power output */}
      <div className={`mt-3 text-center p-3 rounded-xl bg-white/70 border ${colorStyles.border}`}>
        <span className="text-sm text-gray-500">Total Power: </span>
        <span className={`font-black text-xl ${colorStyles.value}`}>{totalKW.toFixed(1)} kW</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW CHARGER INPUTS (with sliders)
// ═══════════════════════════════════════════════════════════════════════════

function NewChargerInputs({ wizardState, setWizardState }: SubComponentProps) {
  const inputs = [
    { key: 'evChargersL1', label: 'Level 1', power: '1.4 kW', cost: '~$3K', mult: 1.4, icon: '🔌', max: 20 },
    { key: 'evChargersL2', label: 'Level 2', power: '11 kW', cost: '~$10K', mult: 11, icon: '⚡', max: 20 },
    { key: 'evChargersDCFC', label: 'DCFC', power: '150 kW', cost: '~$85K', mult: 150, icon: '🚀', max: 10 },
    { key: 'evChargersHPC', label: 'Ultra-Fast', power: '350 kW', cost: '~$180K', mult: 350, icon: '⚡️', max: 5 },
  ];

  // Calculate totals
  const totalKW = inputs.reduce((sum, { key, mult }) => sum + (wizardState[key as keyof WizardState] as number) * mult, 0);
  const totalCost = (wizardState.evChargersL1 || 0) * 3000 + wizardState.evChargersL2 * 10000 + wizardState.evChargersDCFC * 85000 + wizardState.evChargersHPC * 180000;

  return (
    <div className="space-y-4">
      {/* Charger grid with sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inputs.map(({ key, label, power, cost, mult, icon, max }) => {
          const value = wizardState[key as keyof WizardState] as number;
          return (
            <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200 transition-all hover:shadow-lg hover:shadow-blue-500/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h5 className="font-bold text-gray-800 text-lg">{label}</h5>
                    <p className="text-sm text-gray-500">{power} • {cost} each</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-blue-500 text-white font-black text-2xl shadow-lg shadow-blue-500/30">
                  {value}
                </div>
              </div>
              
              {/* Slider */}
              <div className="mt-4">
                <input
                  type="range"
                  min="0"
                  max={max}
                  value={value}
                  onChange={(e) => setWizardState(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-4 rounded-full cursor-pointer accent-blue-500"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value/max)*100}%, #e5e7eb ${(value/max)*100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                  <span>0</span>
                  <span>{max} max</span>
                </div>
              </div>
              
              {/* Power output */}
              <div className="mt-3 flex items-center justify-between bg-white/70 rounded-xl p-3 border border-blue-100">
                <span className="text-gray-600 font-medium">Power Added:</span>
                <span className="font-black text-xl text-blue-600">{(value * mult).toFixed(0)} kW</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-center text-white shadow-xl shadow-blue-500/30">
          <p className="text-blue-100 text-sm font-medium mb-1">💡 Total New EV Load</p>
          <p className="text-4xl font-black">{totalKW.toFixed(0)} kW</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-center text-white shadow-xl shadow-emerald-500/30">
          <p className="text-emerald-100 text-sm font-medium mb-1">💰 Estimated Hardware Cost</p>
          <p className="text-4xl font-black">${totalCost.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER SOURCE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════

function PowerSourceSelector({ wizardState, setWizardState }: SubComponentProps) {
  const options = [
    { id: 'grid', label: 'Grid only', icon: '🔌' },
    { id: 'solar-grid', label: 'Solar + Grid', icon: '☀️' },
    { id: 'solar-only', label: 'Solar only', icon: '🌞' },
    { id: 'generator', label: 'Generator backup', icon: '⚡' },
  ];

  return (
    <div className="bg-white/50 rounded-xl p-4">
      <h5 className="font-medium text-gray-700 mb-3">How are your chargers powered?</h5>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setWizardState(prev => ({ ...prev, existingEVPowerSource: opt.id as any }))}
            className={`p-3 rounded-lg text-sm font-medium transition-all ${
              wizardState.existingEVPowerSource === opt.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{opt.icon}</span> {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOTAL LOAD DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

interface TotalLoadDisplayProps {
  l1: number;
  l2: number;
  dcfc: number;
  hpc: number;
  label: string;
  colorClass: string;
}

function TotalLoadDisplay({ l1, l2, dcfc, hpc, label, colorClass }: TotalLoadDisplayProps) {
  const total = (l1 * 1.4) + (l2 * 11) + (dcfc * 150) + (hpc * 350);
  return (
    <div className={`bg-${colorClass}-100 rounded-xl p-4 text-center`}>
      <p className={`text-sm text-${colorClass}-700`}>{label}</p>
      <p className={`text-2xl font-black text-${colorClass}-600`}>{total.toFixed(1)} kW</p>
    </div>
  );
}
