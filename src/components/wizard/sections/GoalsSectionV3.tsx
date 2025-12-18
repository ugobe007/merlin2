/**
 * GoalsSectionV3.tsx
 * Step 3: Goals & Equipment Configuration
 * 
 * COMPLETELY REDESIGNED Dec 17, 2025
 * Following Merlin Energy Wizard Complete System Documentation
 * 
 * REQUIRED ELEMENTS:
 * ✅ StepExplanation component at top with Merlin branding
 * ✅ Navigation buttons at bottom (Back/Home/Next)
 * ✅ Cards max-width ~768px (max-w-3xl) centered
 * ✅ Readable text - white/light on dark backgrounds
 * ✅ Merlin color palette: Purple/indigo backgrounds, amber/gold accents
 * ✅ Event isolation on all sliders to prevent card collapse
 * ✅ Grid connection with 4 pill buttons
 */

import React, { useCallback, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Zap, Sun, Wind, Fuel, Battery, Plug, Check, 
  ArrowLeft, Home, ArrowRight, Wifi, WifiOff, AlertTriangle, Radio
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { StepExplanation } from '../ui/StepExplanation';

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
// NUMBER INPUT - Dark themed slider with prominent controls
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

  const handleIncrement = useCallback(() => {
    const newVal = Math.min(value + step, max);
    onChange(newVal);
  }, [value, step, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newVal = Math.max(value - step, min);
    onChange(newVal);
  }, [value, step, min, onChange]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  }, [onChange, min, max]);

  return (
    <div className="space-y-3">
      {/* Label and Value Row */}
      <div className="flex justify-between items-center">
        <label className="text-white font-semibold text-base">{label}</label>
        <div className="flex items-center gap-2">
          {/* Decrement Button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className="w-8 h-8 rounded-lg bg-[#68BFFA]/40 hover:bg-[#68BFFA]/70 
                       text-white font-bold text-xl flex items-center justify-center
                       border border-[#68BFFA]/60 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          
          {/* Value Display */}
          <div className="flex items-center bg-[#060F76]/60 rounded-lg border-2 border-[#ffa600]/50 px-3 py-1">
            <input
              type="number"
              value={value}
              onChange={handleTextChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="w-16 bg-transparent text-[#ffa600] font-black text-xl text-center
                         focus:outline-none disabled:opacity-50
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {unit && <span className="text-[#FED19F] font-semibold ml-1">{unit}</span>}
          </div>
          
          {/* Increment Button */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className="w-8 h-8 rounded-lg bg-[#68BFFA]/40 hover:bg-[#68BFFA]/70 
                       text-white font-bold text-xl flex items-center justify-center
                       border border-[#68BFFA]/60 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Slider */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="relative"
      >
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full h-3 rounded-full appearance-none cursor-pointer
                     bg-[#68BFFA]/30 
                     disabled:cursor-not-allowed disabled:opacity-50
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#ffa600]
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-[#ffa600]/50
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-[#FED19F]
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-[#ffa600]
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-[#FED19F]
                     [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-sm text-[#68BFFA]">
        <span>{min.toLocaleString()}{unit}</span>
        <span>{max.toLocaleString()}{unit}</span>
      </div>
    </div>
  );
};

// =============================================================================
// EQUIPMENT CARD - Dark themed expandable card
// =============================================================================
interface EquipmentCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
  onForceExpand?: () => void; // NEW: Force expand to true (used when enabling disabled card)
  children: React.ReactNode;
  iconBgColor?: string;
  alwaysEnabled?: boolean;
  recommended?: boolean;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  expanded,
  onExpand,
  onForceExpand,
  children,
  iconBgColor = 'bg-[#6700b6]',
  alwaysEnabled = false,
  recommended = false,
}) => {

  // Only expand/collapse when checkbox is clicked
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!enabled) {
      onToggle();
      if (onForceExpand) {
        onForceExpand();
      } else {
        onExpand();
      }
    } else {
      onExpand();
    }
  };

  const isActive = alwaysEnabled || enabled;

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isActive 
          ? 'bg-gradient-to-br from-[#060F76]/40 to-[#0a1a9a]/30 border-[#ffa600]/60 shadow-lg shadow-[#ffa600]/20' 
          : 'bg-[#060F76]/30 border-[#6700b6]/30 hover:border-[#ffa600]/50'
        }`}
    >
      {/* Header */}
      <div
        className="w-full p-4 flex items-center gap-4 select-none"
      >
        {/* Enable Checkbox */}
        {!alwaysEnabled && (
          <EventIsolator>
            <div 
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all
                ${enabled 
                  ? 'bg-[#ffa600] border-[#FED19F]' 
                  : 'bg-[#060F76]/50 border-[#68BFFA]/50 hover:border-[#68BFFA]'
                }`}
              onClick={handleCheckboxClick}
            >
              {enabled && <Check size={16} className="text-[#060F76]" strokeWidth={3} />}
            </div>
          </EventIsolator>
        )}

        {/* Icon */}
        <div className={`p-2 rounded-lg ${isActive ? iconBgColor : 'bg-[#060F76]/50'}`}>
          {icon}
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-[#cc89ff]'}`}>
              {title}
            </h3>
            {recommended && (
              <span className="px-2 py-0.5 bg-[#22c55e]/20 border border-[#22c55e]/40 rounded-full text-[#22c55e] text-xs font-semibold">
                Recommended
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-[#cc89ff]/70">{subtitle}</p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        {isActive && (
          <div className="text-[#cc89ff]">
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        )}
      </div>

      {/* Content - stop propagation so clicks don't collapse the card */}
      {isActive && expanded && (
        <div 
          className="px-4 pb-4 pt-2 border-t border-[#6700b6]/30"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// GRID CONNECTION PILL BUTTON
// =============================================================================
interface GridPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}

const GridPill: React.FC<GridPillProps> = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all flex-1
      ${selected 
        ? 'bg-gradient-to-r from-[#68BFFA] to-[#4ba3e8] border-[#ffa600] text-white shadow-lg shadow-[#68BFFA]/40' 
        : 'bg-[#060F76]/30 border-[#68BFFA]/40 text-[#68BFFA] hover:border-[#68BFFA] hover:bg-[#68BFFA]/20'
      }`}
  >
    {icon}
    <span className="font-semibold text-sm whitespace-nowrap">{label}</span>
  </button>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function GoalsSectionV3({
  wizardState,
  setWizardState,
  onBack,
  onHome,
  onContinue,
  sectionRef,
  merlinRecommendation,
}: GoalsSectionV3Props) {
  // ---------------------------------------------------------------------------
  // Local state for card expansion
  // ---------------------------------------------------------------------------
  const [expandedCards, setExpandedCards] = React.useState<Record<string, boolean>>({
    bess: true,
    solar: false,
    wind: false,
    generator: false,
    existingEV: false,
    newEV: false,
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

  // Force expand a card (set to true, don't toggle)
  const forceExpand = useCallback((key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: true }));
  }, []);

  // ---------------------------------------------------------------------------
  // Grid connection options
  // ---------------------------------------------------------------------------
  type GridConnectionType = 'on-grid' | 'off-grid' | 'limited' | 'unreliable';
  
  const gridOptions = useMemo(() => [
    { value: 'on-grid', label: 'Reliable', icon: <Wifi size={18} /> },
    { value: 'limited', label: 'Limited', icon: <AlertTriangle size={18} /> },
    { value: 'unreliable', label: 'Unreliable', icon: <Radio size={18} /> },
    { value: 'off-grid', label: 'Off-Grid', icon: <WifiOff size={18} /> },
  ], []);

  // ---------------------------------------------------------------------------
  // Calculate totals for summary
  // ---------------------------------------------------------------------------
  const existingEVLoad = useMemo(() => {
    const l2 = (wizardState.existingEVL2 || 0) * 7;
    const dcfc = (wizardState.existingEVL3 || 0) * 50;
    return l2 + dcfc;
  }, [wizardState.existingEVL2, wizardState.existingEVL3]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div ref={sectionRef} className="min-h-screen py-8 px-4">
      {/* Centered Container - MAX WIDTH 768px (max-w-3xl) */}
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ================================================================= */}
        {/* STEP EXPLANATION - Merlin's Guidance (REQUIRED) */}
        {/* ================================================================= */}
        <StepExplanation
          stepNumber={4}
          totalSteps={5}
          title="Configure Your Energy System"
          description="Tell me about your existing equipment and what you'd like to add. I'll analyze your facility data to recommend the perfect energy solution."
          estimatedTime="2-3 min"
          showMerlin={true}
          tips={[
            "Toggle on equipment you have or want to add",
            "Existing EV chargers add to your current load",
            "Solar and wind offset electricity costs",
            "Generator backup provides resilience during outages"
          ]}
          outcomes={[
            "Battery Storage",
            "Solar PV",
            "Wind Power",
            "Backup Generator",
            "EV Chargers"
          ]}
        />

        {/* ================================================================= */}
        {/* GRID CONNECTION STATUS - 4 Pill Buttons */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-r from-[#060F76]/50 to-[#0a1a9a]/40 rounded-xl p-5 border-2 border-[#68BFFA]/40 shadow-lg shadow-[#68BFFA]/10">
          <div className="mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Zap className="text-[#ffa600]" size={20} />
              Grid Connection Status
            </h3>
            <p className="text-[#68BFFA] text-sm mt-1">How reliable is your utility power?</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gridOptions.map((opt) => (
              <GridPill
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                value={opt.value}
                selected={(wizardState.gridConnection || 'on-grid') === opt.value}
                onClick={() => setWizardState((prev: WizardState) => ({ 
                  ...prev, 
                  gridConnection: opt.value as GridConnectionType 
                }))}
              />
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* EQUIPMENT CARDS */}
        {/* ================================================================= */}
        <div className="space-y-4">
          
          {/* BESS Card - Always enabled (core product) */}
          <EquipmentCard
            icon={<Battery size={24} className="text-white" />}
            title="Battery Storage (BESS)"
            subtitle="Energy storage for peak shaving & backup"
            enabled={true}
            onToggle={() => {}}
            expanded={expandedCards.bess ?? true}
            onExpand={() => toggleExpanded('bess')}
            iconBgColor="bg-gradient-to-r from-[#ffa600] to-[#ff8c00]"
            alwaysEnabled={true}
          >
            <div className="space-y-6 pt-2">
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
              {/* Calculated storage */}
              <div className="bg-[#6700b6]/30 rounded-lg p-3 border border-[#ffa600]/30">
                <span className="text-[#cc89ff] text-sm">Total Storage Capacity</span>
                <p className="text-[#ffa600] font-black text-xl">
                  {((wizardState.batteryKW || 500) * (wizardState.durationHours || 4)).toLocaleString()} kWh
                </p>
              </div>
            </div>
          </EquipmentCard>

          {/* Solar Card */}
          <EquipmentCard
            icon={<Sun size={24} className="text-white" />}
            title="Solar PV"
            subtitle="On-site solar generation"
            enabled={wizardState.wantsSolar ?? false}
            onToggle={toggleSolar}
            expanded={expandedCards.solar ?? false}
            onExpand={() => toggleExpanded('solar')}
            onForceExpand={() => forceExpand('solar')}
            iconBgColor="bg-[#ffa600]"
            recommended={true}
          >
            <div className="pt-2">
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
              {merlinRecommendation?.solarKW && (
                <div className="mt-4 bg-[#22c55e]/10 rounded-lg p-3 border border-[#22c55e]/30">
                  <span className="text-[#22c55e] text-sm">Merlin Recommends</span>
                  <p className="text-white font-bold">{merlinRecommendation.solarKW.toLocaleString()} kW</p>
                </div>
              )}
            </div>
          </EquipmentCard>

          {/* Wind Card */}
          <EquipmentCard
            icon={<Wind size={24} className="text-white" />}
            title="Wind Turbine"
            subtitle="On-site wind generation"
            enabled={wizardState.wantsWind ?? false}
            onToggle={toggleWind}
            expanded={expandedCards.wind ?? false}
            onExpand={() => toggleExpanded('wind')}
            onForceExpand={() => forceExpand('wind')}
            iconBgColor="bg-[#68BFFA]"
          >
            <div className="pt-2">
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
            </div>
          </EquipmentCard>

          {/* Generator Card */}
          <EquipmentCard
            icon={<Fuel size={24} className="text-white" />}
            title="Backup Generator"
            subtitle="Diesel/Natural gas backup power"
            enabled={wizardState.wantsGenerator ?? false}
            onToggle={toggleGenerator}
            expanded={expandedCards.generator ?? false}
            onExpand={() => toggleExpanded('generator')}
            onForceExpand={() => forceExpand('generator')}
            iconBgColor="bg-red-500"
            recommended={wizardState.gridConnection === 'unreliable' || wizardState.gridConnection === 'limited'}
          >
            <div className="space-y-6 pt-2">
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
              <EventIsolator className="space-y-2">
                <label className="text-white font-semibold text-base block">Fuel Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['natural-gas', 'diesel', 'propane'] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setWizardState((prev: WizardState) => ({ ...prev, generatorFuel: fuel }))}
                      className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all
                        ${(wizardState.generatorFuel || 'natural-gas') === fuel
                          ? 'bg-[#6700b6] border-[#ffa600] text-white'
                          : 'bg-[#060F76]/30 border-[#6700b6]/40 text-[#cc89ff] hover:border-[#6700b6]'
                        }`}
                    >
                      {fuel === 'natural-gas' ? 'Natural Gas' : fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                    </button>
                  ))}
                </div>
              </EventIsolator>
            </div>
          </EquipmentCard>

          {/* Existing EV Chargers Card */}
          <EquipmentCard
            icon={<Plug size={24} className="text-white" />}
            title="Existing EV Chargers"
            subtitle="Account for current charging infrastructure"
            enabled={wizardState.hasExistingEV ?? false}
            onToggle={toggleExistingEV}
            expanded={expandedCards.existingEV ?? false}
            onExpand={() => toggleExpanded('existingEV')}
            onForceExpand={() => forceExpand('existingEV')}
            iconBgColor="bg-[#22c55e]"
          >
            <div className="space-y-6 pt-2">
              <EventIsolator>
                <NumberInput
                  label="Level 2 Chargers (7 kW each)"
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
                  label="DC Fast Chargers (50 kW each)"
                  value={wizardState.existingEVL3 || 0}
                  onChange={(val) => setWizardState((prev: WizardState) => ({ ...prev, existingEVL3: val }))}
                  min={0}
                  max={20}
                  step={1}
                  unit=" units"
                />
              </EventIsolator>
              {/* Total existing EV load */}
              {existingEVLoad > 0 && (
                <div className="bg-[#22c55e]/10 rounded-lg p-3 border border-[#22c55e]/30">
                  <span className="text-[#22c55e] text-sm">Total Existing EV Load</span>
                  <p className="text-white font-bold text-lg">{existingEVLoad.toLocaleString()} kW</p>
                </div>
              )}
            </div>
          </EquipmentCard>
        </div>

        {/* ================================================================= */}
        {/* CONFIGURATION SUMMARY */}
        {/* ================================================================= */}
        <div className="bg-gradient-to-r from-[#060F76]/50 via-[#0a1a9a]/40 to-[#68BFFA]/20 rounded-xl p-5 border-2 border-[#68BFFA]/40 shadow-lg shadow-[#68BFFA]/10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-[#ffa600]" size={24} />
            <span className="font-bold text-xl text-white">Configuration Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* BESS - Always shown */}
            <div className="bg-[#ffa600]/15 rounded-lg p-3 border border-[#ffa600]/40">
              <span className="text-[#ffa600] text-sm">Battery Storage</span>
              <p className="text-white font-bold text-lg">
                {wizardState.batteryKW || 500} kW / {wizardState.durationHours || 4}h
              </p>
              <p className="text-[#FED19F] text-xs">
                {((wizardState.batteryKW || 500) * (wizardState.durationHours || 4)).toLocaleString()} kWh
              </p>
            </div>
            
            {/* Solar */}
            {wizardState.wantsSolar && (
              <div className="bg-[#ffa600]/10 rounded-lg p-3 border border-[#ffa600]/40">
                <span className="text-[#FED19F] text-sm">Solar PV</span>
                <p className="text-[#ffa600] font-bold text-lg">{wizardState.solarKW || 500} kW</p>
              </div>
            )}
            
            {/* Wind */}
            {wizardState.wantsWind && (
              <div className="bg-[#68BFFA]/10 rounded-lg p-3 border border-[#68BFFA]/40">
                <span className="text-[#68BFFA] text-sm">Wind Turbine</span>
                <p className="text-white font-bold text-lg">{wizardState.windTurbineKW || 500} kW</p>
              </div>
            )}
            
            {/* Generator */}
            {wizardState.wantsGenerator && (
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/40">
                <span className="text-red-300 text-sm">Backup Generator</span>
                <p className="text-white font-bold text-lg">{wizardState.generatorKW || 500} kW</p>
                <p className="text-red-300 text-xs capitalize">{wizardState.generatorFuel || 'natural-gas'}</p>
              </div>
            )}
            
            {/* EV Chargers */}
            {wizardState.hasExistingEV && existingEVLoad > 0 && (
              <div className="bg-[#22c55e]/10 rounded-lg p-3 border border-[#22c55e]/40">
                <span className="text-[#22c55e] text-sm">EV Chargers</span>
                <p className="text-white font-bold text-lg">{existingEVLoad} kW load</p>
                <p className="text-[#22c55e] text-xs">
                  {wizardState.existingEVL2 || 0} L2, {wizardState.existingEVL3 || 0} DCFC
                </p>
              </div>
            )}
            
            {/* Grid Status */}
            <div className="bg-[#68BFFA]/10 rounded-lg p-3 border border-[#68BFFA]/40">
              <span className="text-[#68BFFA] text-sm">Grid Status</span>
              <p className="text-white font-bold text-lg capitalize">
                {(wizardState.gridConnection || 'on-grid').replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* NAVIGATION BUTTONS (REQUIRED) */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between pt-6 border-t border-[#68BFFA]/30">
          {/* Left side: Back + Home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl
                         bg-[#060F76]/50 border-2 border-[#68BFFA]/40
                         text-white font-semibold
                         hover:bg-[#68BFFA]/20 hover:border-[#68BFFA] transition-all"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="flex items-center gap-2 px-4 py-3 rounded-xl
                           bg-[#060F76]/50 border-2 border-[#68BFFA]/40
                           text-white font-semibold
                           hover:bg-[#68BFFA]/20 hover:border-[#68BFFA] transition-all"
              >
                <Home size={18} />
              </button>
            )}
          </div>
          
          {/* Right side: Next Step */}
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 px-8 py-4 rounded-xl
                       bg-gradient-to-r from-[#ffa600] to-[#ff8c00]
                       border-2 border-[#FED19F]/50
                       text-[#060F76] font-black text-lg
                       hover:from-[#ffb833] hover:to-[#ffa600]
                       hover:border-white hover:shadow-lg hover:shadow-[#ffa600]/40
                       transition-all"
          >
            Next Step
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default GoalsSectionV3;
