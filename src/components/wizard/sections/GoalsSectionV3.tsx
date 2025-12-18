/**
 * GoalsSectionV3.tsx
 * Step 3: Goals & Preferences with Equipment Configuration
 * REBUILT Dec 2025 - Proper event isolation for slider/select controls
 */

import React, { useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Zap, Sun, Wind, Fuel, Battery, Plug } from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface MerlinRecommendation {
  solarKW: number;
  windKW: number;
  generatorKW: number;
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  pcsKW: number;
  transformerKVA: number;
  totalProductionKW: number;
  totalStorageKWh: number;
  dailyProductionKWh: number;
  annualSavings: number;
  paybackYears: number;
  roi10Year: number;
  currency: string;
}

interface GoalsSectionV3Props {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onHome?: () => void;
  onContinue: () => void;
  onGenerateScenarios?: () => void;
  isGeneratingScenarios?: boolean;
  powerCoverage?: number;
  peakDemandKW?: number;
  merlinRecommendation?: MerlinRecommendation;
}

// =============================================================================
// EVENT ISOLATION - Prevents bubbling to parent EquipmentCard toggle
// =============================================================================
interface EventIsolatorProps {
  children: React.ReactNode;
  className?: string;
}

const EventIsolator: React.FC<EventIsolatorProps> = ({ children, className }) => {
  const stopAll = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={className}
      onClick={stopAll}
      onMouseDown={stopAll}
      onMouseUp={stopAll}
      onPointerDown={stopAll}
      onPointerUp={stopAll}
      onTouchStart={stopAll}
      onTouchEnd={stopAll}
    >
      {children}
    </div>
  );
};

// =============================================================================
// NUMBER INPUT - Slider with text input
// =============================================================================
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
}) => {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  }, [onChange, min, max]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={handleTextChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right
                       disabled:bg-gray-100 disabled:text-gray-400"
          />
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
      {/* Dedicated event capture container for slider */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     disabled:cursor-not-allowed disabled:opacity-50
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#6700b6]
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-[#6700b6]
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-0"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

// =============================================================================
// EQUIPMENT CARD - Expandable card with header/content separation
// =============================================================================
interface EquipmentCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
  children: React.ReactNode;
  accentColor?: string;
  bgColor?: string;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  expanded,
  onExpand,
  children,
  accentColor = '#6700b6',
  bgColor = '#FED19F',
}) => {
  const handleHeaderClick = useCallback(() => {
    if (enabled) {
      onExpand();
    } else {
      onToggle();
    }
  }, [enabled, onExpand, onToggle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleHeaderClick();
    }
  }, [handleHeaderClick]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
        enabled ? 'border-[#6700b6] shadow-lg' : 'border-gray-200'
      }`}
      style={{ backgroundColor: enabled ? `${bgColor}20` : 'white' }}
    >
      {/* Header - Clickable area for expand/collapse */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleHeaderClick}
        onKeyDown={handleKeyDown}
        className="w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        {/* Enable Checkbox */}
        <EventIsolator>
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleCheckboxChange}
            className="w-5 h-5 rounded border-gray-300 text-[#6700b6] focus:ring-[#6700b6]"
          />
        </EventIsolator>

        {/* Icon */}
        <div
          className={`p-2 rounded-lg ${enabled ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
          style={{ backgroundColor: enabled ? accentColor : undefined }}
        >
          {icon}
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 text-left">
          <h3 className={`font-semibold ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        {enabled && (
          <div className="text-gray-400">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        )}
      </div>

      {/* Content - NOT inside button, only shown when expanded */}
      {enabled && expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function GoalsSectionV3({
  wizardState,
  setWizardState,
}: GoalsSectionV3Props) {
  // ---------------------------------------------------------------------------
  // Local state for card expansion
  // ---------------------------------------------------------------------------
  const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({
    bess: true,
    solar: false,
    wind: false,
    generator: false,
    evChargers: false,
  });

  // ---------------------------------------------------------------------------
  // Equipment toggle handlers (use WizardState field names)
  // ---------------------------------------------------------------------------
  const toggleSolar = useCallback(() => {
    setWizardState((prev: WizardState) => ({ ...prev, wantsSolar: !prev.wantsSolar }));
  }, [setWizardState]);

  const toggleWind = useCallback(() => {
    setWizardState((prev: WizardState) => ({ ...prev, wantsWind: !prev.wantsWind }));
  }, [setWizardState]);

  const toggleGenerator = useCallback(() => {
    setWizardState((prev: WizardState) => ({ ...prev, wantsGenerator: !prev.wantsGenerator }));
  }, [setWizardState]);

  const toggleExistingEV = useCallback(() => {
    setWizardState((prev: WizardState) => ({ ...prev, hasExistingEV: !prev.hasExistingEV }));
  }, [setWizardState]);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Grid connection options (match WizardState type)
  // ---------------------------------------------------------------------------
  type GridConnectionType = 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
  const gridOptions = useMemo(() => [
    { value: 'on-grid', label: 'Grid-Connected (Standard)' },
    { value: 'off-grid', label: 'Off-Grid / Island Mode' },
    { value: 'limited', label: 'Limited Grid (Backup Only)' },
  ], []);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment & Goals</h2>
        <p className="text-gray-600 mt-1">
          Configure your energy system components
        </p>
      </div>

      {/* Grid Connection */}
      <div className="bg-gradient-to-r from-[#060F76]/5 to-[#6700b6]/5 rounded-xl p-4 mb-6">
        <EventIsolator className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Grid Connection Status</label>
          <select
            value={wizardState.gridConnection || 'on-grid'}
            onChange={(e) => setWizardState((prev: WizardState) => ({ 
              ...prev, 
              gridConnection: e.target.value as GridConnectionType 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       bg-white focus:outline-none focus:ring-2 focus:ring-[#6700b6]/20 focus:border-[#6700b6]"
          >
            {gridOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </EventIsolator>
      </div>

      {/* Equipment Cards Stack */}
      <div className="space-y-4">
        {/* BESS Card - Always enabled, just configure size */}
        <EquipmentCard
          icon={<Battery size={24} />}
          title="Battery Storage (BESS)"
          subtitle="Energy storage for peak shaving & backup"
          enabled={true}
          onToggle={() => {}}
          expanded={expandedCards.bess ?? true}
          onExpand={() => toggleExpanded('bess')}
          accentColor="#6700b6"
          bgColor="#cc89ff"
        >
          <div className="space-y-4">
            <EventIsolator>
              <NumberInput
                label="Battery Capacity"
                value={wizardState.batteryKW || 500}
                onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, batteryKW: val }))}
                min={100}
                max={10000}
                step={100}
                unit=" kW"
              />
            </EventIsolator>
            <EventIsolator>
              <NumberInput
                label="Duration"
                value={wizardState.durationHours || 4}
                onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, durationHours: val }))}
                min={1}
                max={8}
                step={1}
                unit=" hrs"
              />
            </EventIsolator>
          </div>
        </EquipmentCard>

        {/* Solar Card */}
        <EquipmentCard
          icon={<Sun size={24} />}
          title="Solar PV"
          subtitle="On-site solar generation"
          enabled={wizardState.wantsSolar ?? false}
          onToggle={toggleSolar}
          expanded={expandedCards.solar ?? false}
          onExpand={() => toggleExpanded('solar')}
          accentColor="#ffa600"
          bgColor="#ffd689"
        >
          <EventIsolator>
            <NumberInput
              label="Solar Capacity"
              value={wizardState.solarKW || 500}
              onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, solarKW: val }))}
              min={50}
              max={5000}
              step={50}
              unit=" kW"
            />
          </EventIsolator>
        </EquipmentCard>

        {/* Wind Card */}
        <EquipmentCard
          icon={<Wind size={24} />}
          title="Wind Turbine"
          subtitle="On-site wind generation"
          enabled={wizardState.wantsWind ?? false}
          onToggle={toggleWind}
          expanded={expandedCards.wind ?? false}
          onExpand={() => toggleExpanded('wind')}
          accentColor="#68BFFA"
          bgColor="#b3dffc"
        >
          <EventIsolator>
            <NumberInput
              label="Wind Capacity"
              value={wizardState.windTurbineKW || 500}
              onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, windTurbineKW: val }))}
              min={50}
              max={3000}
              step={50}
              unit=" kW"
            />
          </EventIsolator>
        </EquipmentCard>

        {/* Generator Card */}
        <EquipmentCard
          icon={<Fuel size={24} />}
          title="Backup Generator"
          subtitle="Diesel/Natural gas backup power"
          enabled={wizardState.wantsGenerator ?? false}
          onToggle={toggleGenerator}
          expanded={expandedCards.generator ?? false}
          onExpand={() => toggleExpanded('generator')}
          accentColor="#ef4444"
          bgColor="#fecaca"
        >
          <div className="space-y-4">
            <EventIsolator>
              <NumberInput
                label="Generator Capacity"
                value={wizardState.generatorKW || 500}
                onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, generatorKW: val }))}
                min={50}
                max={5000}
                step={50}
                unit=" kW"
              />
            </EventIsolator>
            <EventIsolator className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Fuel Type</label>
              <select
                value={wizardState.generatorFuel || 'natural-gas'}
                onChange={(e) => setWizardState((prev: WizardState) => ({ 
                  ...prev, 
                  generatorFuel: e.target.value as 'diesel' | 'natural-gas' | 'propane'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           bg-white focus:outline-none focus:ring-2 focus:ring-[#6700b6]/20 focus:border-[#6700b6]"
              >
                <option value="natural-gas">Natural Gas</option>
                <option value="diesel">Diesel</option>
                <option value="propane">Propane</option>
              </select>
            </EventIsolator>
          </div>
        </EquipmentCard>

        {/* Existing EV Chargers Card */}
        <EquipmentCard
          icon={<Plug size={24} />}
          title="Existing EV Chargers"
          subtitle="Account for current charging infrastructure"
          enabled={wizardState.hasExistingEV ?? false}
          onToggle={toggleExistingEV}
          expanded={expandedCards.evChargers ?? false}
          onExpand={() => toggleExpanded('evChargers')}
          accentColor="#22c55e"
          bgColor="#bbf7d0"
        >
          <div className="space-y-4">
            <EventIsolator>
              <NumberInput
                label="Level 2 Chargers (7kW each)"
                value={wizardState.existingEVL2 || 0}
                onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, existingEVL2: val }))}
                min={0}
                max={50}
                step={1}
                unit=" units"
              />
            </EventIsolator>
            <EventIsolator>
              <NumberInput
                label="DC Fast Chargers (50kW each)"
                value={wizardState.existingEVL3 || 0}
                onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, existingEVL3: val }))}
                min={0}
                max={20}
                step={1}
                unit=" units"
              />
            </EventIsolator>
          </div>
        </EquipmentCard>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#6700b6]/10 to-[#ffa600]/10 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-[#6700b6]" size={20} />
          <span className="font-semibold text-gray-900">Configuration Summary</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="text-gray-600">
            <span className="font-medium">BESS:</span> {wizardState.batteryKW || 500} kW / {wizardState.durationHours || 4}h
          </div>
          {wizardState.wantsSolar && (
            <div className="text-gray-600">
              <span className="font-medium">Solar:</span> {wizardState.solarKW || 500} kW
            </div>
          )}
          {wizardState.wantsWind && (
            <div className="text-gray-600">
              <span className="font-medium">Wind:</span> {wizardState.windTurbineKW || 500} kW
            </div>
          )}
          {wizardState.wantsGenerator && (
            <div className="text-gray-600">
              <span className="font-medium">Generator:</span> {wizardState.generatorKW || 500} kW
            </div>
          )}
          {wizardState.hasExistingEV && (
            <div className="text-gray-600">
              <span className="font-medium">EV:</span> {wizardState.existingEVL2 || 0} L2, {wizardState.existingEVL3 || 0} DCFC
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalsSectionV3;
