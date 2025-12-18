/**
 * GOALS SECTION V3 - Clean Refactor December 17, 2025
 * ====================================================
 * 
 * COMPLETELY REBUILT from scratch to fix systematic bugs:
 * - NO overflow-hidden animations (breaks sliders)
 * - Simple conditional rendering (stable, no CSS hacks)
 * - Clean state management (no re-render issues)
 * - Professional, stable interactions
 * 
 * Architecture:
 * - Each equipment type in its own collapsible card
 * - Controlled via simple boolean state
 * - Sliders work without animation interference
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Sparkles, 
  Car, 
  Sun, 
  Wind, 
  Fuel, 
  Zap, 
  Info, 
  Home,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';

// ============================================================================
// CONSTANTS
// ============================================================================

const GENERATOR_RESERVE_MARGIN = 1.25;

const CRITICAL_LOAD_BY_INDUSTRY: Record<string, number> = {
  'hotel': 0.50,
  'hospital': 0.85,
  'data-center': 1.0,
  'manufacturing': 0.60,
  'retail': 0.40,
  'office': 0.35,
  'warehouse': 0.35,
  'car-wash': 0.25,
  'ev-charging': 0.70,
  'default': 0.50,
};

// ============================================================================
// TYPES
// ============================================================================

interface GoalsSectionV3Props {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onHome?: () => void;
  onGenerateScenarios?: () => void;
  isGeneratingScenarios?: boolean;
  powerCoverage?: number;
  peakDemandKW?: number;
  merlinRecommendation?: {
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    paybackYears: number;
    roi10Year: number;
    currency: string;
  };
}

// ============================================================================
// HELPER: Simple Number Input with +/- buttons (no slider issues)
// ============================================================================

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
}

function NumberInput({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', helpText }: NumberInputProps) {
  const handleIncrement = () => {
    const newVal = Math.min(max, value + step);
    onChange(newVal);
  };
  
  const handleDecrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(newVal);
  };
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  
  const formatValue = (v: number) => {
    if (unit === 'kW' && v >= 1000) return `${(v / 1000).toFixed(1)} MW`;
    return `${v.toLocaleString()} ${unit}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-lg font-bold text-purple-600">{formatValue(value)}</span>
      </div>
      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
      
      {/* Slider + Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-purple-600"
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min.toLocaleString()} {unit}</span>
        <span>{max.toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER: Equipment Card (collapsible section)
// ============================================================================

interface EquipmentCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
  recommended?: boolean;
}

function EquipmentCard({ icon, title, subtitle, isEnabled, onToggle, children, recommended }: EquipmentCardProps) {
  return (
    <div className={`rounded-2xl border-2 transition-colors ${
      isEnabled ? 'border-purple-400 bg-white' : 'border-slate-200 bg-slate-50'
    }`}>
      {/* Header - Click to toggle */}
      <button
        type="button"
        onClick={() => onToggle(!isEnabled)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-500'}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {recommended && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Recommended
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle indicator */}
          <div className={`w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-purple-600' : 'bg-slate-300'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
              isEnabled ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
            }`} />
          </div>
          
          {isEnabled ? (
            <ChevronUp className="w-5 h-5 text-purple-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* Content - Only render when enabled (simple conditional, no animation hacks) */}
      {isEnabled && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER: Simple Select
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}

function SimpleSelect({ label, value, onChange, options }: SimpleSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-white border border-slate-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoalsSectionV3({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  onHome,
  onGenerateScenarios,
  isGeneratingScenarios = false,
  powerCoverage = 100,
  peakDemandKW = 500,
  merlinRecommendation,
}: GoalsSectionV3Props) {
  
  // Calculate recommended values
  const recommendations = useMemo(() => {
    const criticalLoadPct = CRITICAL_LOAD_BY_INDUSTRY[wizardState.selectedIndustry || 'default'] || 0.5;
    return {
      solarKW: Math.round(peakDemandKW * 0.6),
      windKW: Math.round(peakDemandKW * 0.2),
      generatorKW: Math.round(peakDemandKW * criticalLoadPct * GENERATOR_RESERVE_MARGIN),
    };
  }, [peakDemandKW, wizardState.selectedIndustry]);

  // Format helpers
  const formatKW = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;

  // Calculate total EV load for display
  const totalExistingEVLoadKW = (
    (wizardState.existingEVL1 || 0) * 1.4 +
    (wizardState.existingEVL2 || 0) * 11 +
    (wizardState.existingEVL3 || 0) * 150
  );
  
  const totalNewEVLoadKW = (
    (wizardState.evChargersL2 || 0) * 11 +
    (wizardState.evChargersDCFC || 0) * 150 +
    (wizardState.evChargersHPC || 0) * 350
  );

  // Don't render if not on section 3
  if (currentSection !== 3) return null;

  return (
    <div ref={sectionRef} className="min-h-[calc(100vh-120px)] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Step 3 of 7</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Configure Your Energy System
          </h2>
          <p className="text-gray-600">
            Select the equipment you want to include. Merlin will optimize sizing based on your facility.
          </p>
        </div>

        {/* Equipment Cards */}
        <div className="space-y-4">
          
          {/* ════════════════════════════════════════════════════════════════
              EXISTING EV CHARGERS
          ════════════════════════════════════════════════════════════════ */}
          <EquipmentCard
            icon={<Car className="w-5 h-5" />}
            title="Existing EV Chargers"
            subtitle="Already installed at your facility"
            isEnabled={wizardState.hasExistingEV || false}
            onToggle={(enabled) => setWizardState(prev => ({
              ...prev,
              hasExistingEV: enabled,
              ...(enabled ? {} : { existingEVL1: 0, existingEVL2: 0, existingEVL3: 0 })
            }))}
          >
            <div className="space-y-4 pt-2">
              <NumberInput
                label="Level 1 Chargers (1.4 kW each)"
                value={wizardState.existingEVL1 || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL1: v }))}
                min={0}
                max={20}
                step={1}
                unit="units"
                helpText="Standard 120V outlets"
              />
              <NumberInput
                label="Level 2 Chargers (11 kW each)"
                value={wizardState.existingEVL2 || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL2: v }))}
                min={0}
                max={50}
                step={1}
                unit="units"
                helpText="240V chargers - most common"
              />
              <NumberInput
                label="DC Fast Chargers (150 kW each)"
                value={wizardState.existingEVL3 || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, existingEVL3: v }))}
                min={0}
                max={20}
                step={1}
                unit="units"
                helpText="High-power DC charging"
              />
              
              {totalExistingEVLoadKW > 0 && (
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-700 font-medium">
                    Total Existing EV Load: {formatKW(totalExistingEVLoadKW)}
                  </p>
                </div>
              )}
            </div>
          </EquipmentCard>

          {/* ════════════════════════════════════════════════════════════════
              NEW EV CHARGERS
          ════════════════════════════════════════════════════════════════ */}
          <EquipmentCard
            icon={<Car className="w-5 h-5" />}
            title="Add New EV Chargers"
            subtitle="Plan for future EV infrastructure"
            isEnabled={wizardState.wantsEVCharging || false}
            onToggle={(enabled) => setWizardState(prev => ({
              ...prev,
              wantsEVCharging: enabled,
              ...(enabled ? {} : { evChargersL2: 0, evChargersDCFC: 0, evChargersHPC: 0 })
            }))}
          >
            <div className="space-y-4 pt-2">
              <NumberInput
                label="Level 2 Chargers (11 kW each)"
                value={wizardState.evChargersL2 || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersL2: v }))}
                min={0}
                max={50}
                step={1}
                unit="units"
              />
              <NumberInput
                label="DC Fast Chargers (150 kW each)"
                value={wizardState.evChargersDCFC || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersDCFC: v }))}
                min={0}
                max={20}
                step={1}
                unit="units"
              />
              <NumberInput
                label="High Power Chargers (350 kW each)"
                value={wizardState.evChargersHPC || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, evChargersHPC: v }))}
                min={0}
                max={10}
                step={1}
                unit="units"
                helpText="Ultra-fast charging for EVs"
              />
              
              {totalNewEVLoadKW > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    New EV Load: {formatKW(totalNewEVLoadKW)}
                  </p>
                </div>
              )}
            </div>
          </EquipmentCard>

          {/* ════════════════════════════════════════════════════════════════
              SOLAR
          ════════════════════════════════════════════════════════════════ */}
          <EquipmentCard
            icon={<Sun className="w-5 h-5" />}
            title="Solar Power"
            subtitle="Reduce electricity costs with on-site generation"
            isEnabled={wizardState.wantsSolar || false}
            onToggle={(enabled) => setWizardState(prev => ({
              ...prev,
              wantsSolar: enabled,
              solarKW: enabled ? (prev.solarKW || recommendations.solarKW) : 0
            }))}
            recommended={powerCoverage < 100}
          >
            <div className="space-y-4 pt-2">
              <NumberInput
                label="Solar System Size"
                value={wizardState.solarKW || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, solarKW: v }))}
                min={0}
                max={Math.max(2000, Math.round(peakDemandKW * 1.5))}
                step={25}
                unit="kW"
                helpText={`Recommended: ${formatKW(recommendations.solarKW)}`}
              />
              
              {/* Solar canopy option */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="solarCanopy"
                  checked={wizardState.wantsSolarCanopy || false}
                  onChange={(e) => setWizardState(prev => ({ ...prev, wantsSolarCanopy: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="solarCanopy" className="text-sm text-gray-700">
                  Include solar parking canopy (premium option)
                </label>
              </div>
            </div>
          </EquipmentCard>

          {/* ════════════════════════════════════════════════════════════════
              WIND
          ════════════════════════════════════════════════════════════════ */}
          <EquipmentCard
            icon={<Wind className="w-5 h-5" />}
            title="Wind Power"
            subtitle="Complements solar with 24/7 generation potential"
            isEnabled={wizardState.wantsWind || false}
            onToggle={(enabled) => setWizardState(prev => ({
              ...prev,
              wantsWind: enabled,
              windTurbineKW: enabled ? (prev.windTurbineKW || recommendations.windKW) : 0
            }))}
          >
            <div className="space-y-4 pt-2">
              <NumberInput
                label="Wind Turbine Capacity"
                value={wizardState.windTurbineKW || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, windTurbineKW: v }))}
                min={0}
                max={Math.max(500, Math.round(peakDemandKW * 0.5))}
                step={10}
                unit="kW"
              />
            </div>
          </EquipmentCard>

          {/* ════════════════════════════════════════════════════════════════
              BACKUP GENERATOR
          ════════════════════════════════════════════════════════════════ */}
          <EquipmentCard
            icon={<Fuel className="w-5 h-5" />}
            title="Backup Generator"
            subtitle="Extended backup beyond battery duration"
            isEnabled={wizardState.wantsGenerator || false}
            onToggle={(enabled) => setWizardState(prev => ({
              ...prev,
              wantsGenerator: enabled,
              generatorKW: enabled ? (prev.generatorKW || recommendations.generatorKW) : 0
            }))}
            recommended={powerCoverage < 100}
          >
            <div className="space-y-4 pt-2">
              <SimpleSelect
                label="Generator Type"
                value={wizardState.generatorType || 'traditional'}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorType: v as any }))}
                options={[
                  { value: 'traditional', label: 'Traditional Combustion' },
                  { value: 'linear', label: 'Linear Generator (Mainspring)' },
                ]}
              />
              
              <SimpleSelect
                label="Fuel Type"
                value={wizardState.generatorFuel || 'natural-gas'}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorFuel: v as any }))}
                options={[
                  { value: 'natural-gas', label: 'Natural Gas' },
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'propane', label: 'Propane' },
                  { value: 'dual-fuel', label: 'Dual Fuel' },
                ]}
              />
              
              <NumberInput
                label="Generator Size"
                value={wizardState.generatorKW || 0}
                onChange={(v) => setWizardState(prev => ({ ...prev, generatorKW: v }))}
                min={50}
                max={5000}
                step={50}
                unit="kW"
                helpText={`Recommended: ${formatKW(recommendations.generatorKW)}`}
              />
            </div>
          </EquipmentCard>

          {/* ════════════════════════════════════════════════════════════════
              GRID CONNECTION
          ════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Grid Connection Status</h3>
                <p className="text-sm text-gray-500">How reliable is your utility power?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'on-grid', label: 'Reliable', icon: '🔌' },
                { value: 'limited', label: 'Limited', icon: '⚠️' },
                { value: 'unreliable', label: 'Unreliable', icon: '🔴' },
                { value: 'off-grid', label: 'Off-Grid', icon: '🏝️' },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWizardState(prev => ({ ...prev, gridConnection: option.value as any }))}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    wizardState.gridConnection === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-white text-gray-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl block mb-1">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            NAVIGATION
        ════════════════════════════════════════════════════════════════ */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              
              {onHome && (
                <button
                  type="button"
                  onClick={onHome}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Home
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (onGenerateScenarios) onGenerateScenarios();
                onContinue();
              }}
              disabled={isGeneratingScenarios}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl transition-colors"
            >
              {isGeneratingScenarios ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Next Step
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GoalsSectionV3;
