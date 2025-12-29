/**
 * GoalsSectionV3.tsx
 * Step 3: Goals & Equipment Configuration
 * 
 * COMPLETELY REDESIGNED Dec 17, 2025
 * Following Merlin Energy Wizard Complete System Documentation
 * 
 * UPDATED Dec 18, 2025: Step-based color progression (soft green for Step 3)
 * 
 * REQUIRED ELEMENTS:
 * ✅ StepExplanation component at top with Merlin branding
 * ✅ Navigation buttons at bottom (Back/Home/Next)
 * ✅ Cards max-width ~768px (max-w-3xl) centered
 * ✅ Step-based panels - Step 3 = soft green (#E8FDF4 → #D4F7E9)
 * ✅ Merlin color palette: Green for Step 3 accents, orange for highlights
 * ✅ Event isolation on all sliders to prevent card collapse
 * ✅ Grid connection with 4 pill buttons
 */

import React, { useCallback, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Zap, Sun, Wind, Fuel, Battery, Plug, Check, 
  ArrowLeft, Home, ArrowRight, Wifi, WifiOff, AlertTriangle, Radio, Wand2, Sparkles, Gauge
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { StepExplanation } from '../ui/StepExplanation';
import { MerlinGuidancePanel } from '../ui/MerlinGuidancePanel';
import { getStepColors } from '../constants/stepColors';

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 PANEL COLORS - Soft Green (building solution)
// Uses stepColors.ts for consistency across wizard
// ═══════════════════════════════════════════════════════════════════════════
const step3Colors = getStepColors(3);
const PANEL_BG = step3Colors.panelBg;
const PANEL_BORDER = step3Colors.panelBorder;
const PANEL_BG_GRADIENT = step3Colors.panelBgGradient;

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
                     bg-[#f5d4a3] 
                     disabled:cursor-not-allowed disabled:opacity-50
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#6700b6]
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:shadow-purple-500/50
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-white
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-[#6700b6]
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-white
                     [&::-moz-range-thumb]:shadow-lg"
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-sm text-gray-500">
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
          ? `${PANEL_BG_GRADIENT} border-[#6700b6] shadow-lg shadow-purple-500/20` 
          : `bg-white border-[#f5d4a3] hover:border-[#6700b6]/50`
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
                  ? 'bg-[#6700b6] border-[#6700b6]' 
                  : 'bg-white border-[#f5d4a3] hover:border-[#6700b6]'
                }`}
              onClick={handleCheckboxClick}
            >
              {enabled && <Check size={16} className="text-white" strokeWidth={3} />}
            </div>
          </EventIsolator>
        )}

        {/* Icon */}
        <div className={`p-2 rounded-lg ${isActive ? iconBgColor : 'bg-gray-100'}`}>
          {icon}
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
              {title}
            </h3>
            {recommended && (
              <span className="px-2 py-0.5 bg-[#22c55e]/20 border border-[#22c55e]/40 rounded-full text-[#22c55e] text-xs font-semibold">
                Recommended
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        {isActive && (
          <div className="text-[#6700b6]">
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        )}
      </div>

      {/* Content - stop propagation so clicks don't collapse the card */}
      {isActive && expanded && (
        <div 
          className="px-4 pb-4 pt-2 border-t border-[#f5d4a3]"
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
        ? 'bg-gradient-to-r from-[#6700b6] to-[#060F76] border-[#6700b6] text-white shadow-lg shadow-purple-500/40' 
        : 'bg-white border-[#f5d4a3] text-gray-600 hover:border-[#6700b6] hover:bg-[#fffaf0]'
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
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GUIDANCE PANEL (Dec 21, 2025 - Using reusable component)
        ═══════════════════════════════════════════════════════════════ */}
        <MerlinGuidancePanel
          stepNumber={3}
          totalSteps={5}
          stepLabel="Configure System"
          customIcon={Wand2}
          acknowledgment={`✅ Perfect! I've analyzed your ${wizardState.industryName || 'facility'} in ${wizardState.state || 'your location'}`}
          heading="Configure Your Energy System"
          subheading="Based on your facility details, I've calculated your optimal energy configuration. Review my recommendations below!"
          instructions={[
            { text: "Review my BESS recommendation", highlight: "BESS recommendation" },
            { text: "Add Solar, Wind, or Generator", highlight: "Solar, Wind, or Generator" },
            { text: "Click Generate Quote", highlight: "Generate Quote" },
          ]}
          recommendation={merlinRecommendation ? {
            title: "💡 Merlin's Optimal Configuration",
            content: (
              <>
                For your {wizardState.industryName}, I recommend <strong>{merlinRecommendation.batteryKW >= 1000 ? `${(merlinRecommendation.batteryKW / 1000).toFixed(1)} MW` : `${merlinRecommendation.batteryKW} kW`}</strong> battery 
                {merlinRecommendation.solarKW > 0 && <> + <strong>{merlinRecommendation.solarKW >= 1000 ? `${(merlinRecommendation.solarKW / 1000).toFixed(1)} MW` : `${merlinRecommendation.solarKW} kW`}</strong> solar</>}.
                Estimated savings: <strong className="text-emerald-300">${(merlinRecommendation.annualSavings / 1000).toFixed(0)}K/year</strong>
              </>
            )
          } : undefined}
          proTip={{
            title: "👆 Pro Tip: Check the Power Profile",
            content: "Watch the <strong>Power Profile</strong> in the top nav bar update as you adjust settings. It shows your total system capacity!"
          }}
        />

        {/* ================================================================= */}
        {/* MERLIN'S SUGGESTED CONFIGURATION - Prominent recommendation panel */}
        {/* ================================================================= */}
        {merlinRecommendation && (
          <div className="bg-gradient-to-br from-[#6700b6]/10 to-[#060F76]/10 rounded-3xl p-6 border-2 border-[#6700b6]/30 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6700b6] to-[#060F76] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800">Merlin's Suggested Configuration</h3>
                <p className="text-sm text-gray-500">Based on your facility analysis • Scroll down to customize</p>
              </div>
            </div>
            
            {/* Recommendation Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Battery */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#ffa600] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-5 h-5 text-[#ffa600]" />
                  <span className="text-sm font-semibold text-gray-600">Battery</span>
                </div>
                <p className="text-xl font-black text-gray-800">
                  {merlinRecommendation.batteryKW >= 1000 
                    ? `${(merlinRecommendation.batteryKW / 1000).toFixed(1)} MW`
                    : `${merlinRecommendation.batteryKW} kW`}
                </p>
                <p className="text-xs text-gray-500">{merlinRecommendation.durationHours}h duration</p>
              </div>
              
              {/* Solar (if recommended) */}
              {merlinRecommendation.solarKW > 0 && (
                <div className="bg-white rounded-xl p-4 border-2 border-[#ffa600] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-[#ffa600]" />
                    <span className="text-sm font-semibold text-gray-600">Solar</span>
                  </div>
                  <p className="text-xl font-black text-gray-800">
                    {merlinRecommendation.solarKW >= 1000 
                      ? `${(merlinRecommendation.solarKW / 1000).toFixed(1)} MW`
                      : `${merlinRecommendation.solarKW} kW`}
                  </p>
                  <p className="text-xs text-gray-500">Recommended</p>
                </div>
              )}
              
              {/* Annual Savings */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#22c55e] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[#22c55e]" />
                  <span className="text-sm font-semibold text-gray-600">Savings</span>
                </div>
                <p className="text-xl font-black text-[#22c55e]">
                  ${(merlinRecommendation.annualSavings / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500">per year</p>
              </div>
              
              {/* Payback */}
              <div className="bg-white rounded-xl p-4 border-2 border-[#6700b6] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#6700b6]" />
                  <span className="text-sm font-semibold text-gray-600">Payback</span>
                </div>
                <p className="text-xl font-black text-[#6700b6]">
                  {merlinRecommendation.paybackYears.toFixed(1)} yrs
                </p>
                <p className="text-xs text-gray-500">{merlinRecommendation.roi10Year}% ROI</p>
              </div>
            </div>
            
            {/* Apply Button */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  // Apply Merlin's recommendation to wizard state
                  setWizardState((prev: WizardState) => ({
                    ...prev,
                    batteryKW: merlinRecommendation.batteryKW,
                    durationHours: merlinRecommendation.durationHours,
                    solarKW: merlinRecommendation.solarKW,
                    wantsSolar: merlinRecommendation.solarKW > 0,
                  }));
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-[#6700b6] to-[#060F76]
                           text-white font-bold
                           hover:shadow-lg hover:shadow-purple-500/30
                           transition-all"
              >
                <Check className="w-5 h-5" />
                Apply Merlin's Suggestion
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GRID CONNECTION STATUS - 4 Pill Buttons */}
        {/* ================================================================= */}
        <div className={`${PANEL_BG_GRADIENT} rounded-xl p-5 border-2 ${PANEL_BORDER} shadow-lg`}>
          <div className="mb-4">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
              <Zap className="text-[#ffa600]" size={20} />
              Grid Connection Status
            </h3>
            <p className="text-gray-500 text-sm mt-1">How reliable is your utility power?</p>
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
              <div className="bg-white rounded-lg p-3 border-2 border-[#6700b6]">
                <span className="text-gray-600 text-sm">Total Storage Capacity</span>
                <p className="text-[#6700b6] font-black text-xl">
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
                <div className="mt-4 bg-emerald-50 rounded-lg p-3 border border-emerald-300">
                  <span className="text-emerald-700 text-sm">Merlin Recommends</span>
                  <p className="text-gray-800 font-bold">{merlinRecommendation.solarKW.toLocaleString()} kW</p>
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
                <label className="text-gray-800 font-semibold text-base block">Fuel Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['natural-gas', 'diesel', 'propane'] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setWizardState((prev: WizardState) => ({ ...prev, generatorFuel: fuel }))}
                      className={`px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all
                        ${(wizardState.generatorFuel || 'natural-gas') === fuel
                          ? 'bg-[#6700b6] border-[#6700b6] text-white'
                          : 'bg-white border-[#f5d4a3] text-gray-600 hover:border-[#6700b6]'
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
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-300">
                  <span className="text-emerald-700 text-sm">Total Existing EV Load</span>
                  <p className="text-gray-800 font-bold text-lg">{existingEVLoad.toLocaleString()} kW</p>
                </div>
              )}
            </div>
          </EquipmentCard>
        </div>

        {/* ================================================================= */}
        {/* CONFIGURATION SUMMARY */}
        {/* ================================================================= */}
        <div className={`${PANEL_BG_GRADIENT} rounded-xl p-5 border-2 ${PANEL_BORDER} shadow-lg`}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-[#ffa600]" size={24} />
            <span className="font-bold text-xl text-gray-800">Configuration Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* BESS - Always shown */}
            <div className="bg-white rounded-lg p-3 border-2 border-[#6700b6]">
              <span className="text-[#6700b6] text-sm">Battery Storage</span>
              <p className="text-gray-800 font-bold text-lg">
                {wizardState.batteryKW || 500} kW / {wizardState.durationHours || 4}h
              </p>
              <p className="text-gray-500 text-xs">
                {((wizardState.batteryKW || 500) * (wizardState.durationHours || 4)).toLocaleString()} kWh
              </p>
            </div>
            
            {/* Solar */}
            {wizardState.wantsSolar && (
              <div className="bg-white rounded-lg p-3 border-2 border-[#ffa600]">
                <span className="text-[#ffa600] text-sm">Solar PV</span>
                <p className="text-gray-800 font-bold text-lg">{wizardState.solarKW || 500} kW</p>
              </div>
            )}
            
            {/* Wind */}
            {wizardState.wantsWind && (
              <div className="bg-white rounded-lg p-3 border-2 border-[#68BFFA]">
                <span className="text-[#68BFFA] text-sm">Wind Turbine</span>
                <p className="text-gray-800 font-bold text-lg">{wizardState.windTurbineKW || 500} kW</p>
              </div>
            )}
            
            {/* Generator */}
            {wizardState.wantsGenerator && (
              <div className="bg-white rounded-lg p-3 border-2 border-red-400">
                <span className="text-red-500 text-sm">Backup Generator</span>
                <p className="text-gray-800 font-bold text-lg">{wizardState.generatorKW || 500} kW</p>
                <p className="text-red-400 text-xs capitalize">{wizardState.generatorFuel || 'natural-gas'}</p>
              </div>
            )}
            
            {/* EV Chargers */}
            {wizardState.hasExistingEV && existingEVLoad > 0 && (
              <div className="bg-white rounded-lg p-3 border-2 border-emerald-400">
                <span className="text-emerald-600 text-sm">EV Chargers</span>
                <p className="text-gray-800 font-bold text-lg">{existingEVLoad} kW load</p>
                <p className="text-emerald-500 text-xs">
                  {wizardState.existingEVL2 || 0} L2, {wizardState.existingEVL3 || 0} DCFC
                </p>
              </div>
            )}
            
            {/* Grid Status */}
            <div className="bg-white rounded-lg p-3 border-2 border-gray-300">
              <span className="text-gray-500 text-sm">Grid Status</span>
              <p className="text-gray-800 font-bold text-lg capitalize">
                {(wizardState.gridConnection || 'on-grid').replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* NAVIGATION BUTTONS - CONSISTENT DESIGN */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between pt-6">
          {/* Left side: Back + Home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-r from-slate-600 to-slate-700
                         border-2 border-slate-500
                         text-white font-bold
                         hover:from-slate-500 hover:to-slate-600
                         hover:shadow-lg transition-all"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="flex items-center gap-2 px-4 py-3 rounded-xl
                           bg-slate-800/50 border-2 border-slate-600
                           text-gray-300 font-semibold
                           hover:bg-slate-700 hover:text-white transition-all"
              >
                <Home size={18} />
              </button>
            )}
          </div>
          
          {/* Right side: Generate Quote */}
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 px-8 py-4 rounded-xl
                       bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6]
                       border-2 border-[#ad42ff]
                       text-white font-black text-lg
                       hover:shadow-xl hover:shadow-purple-500/40
                       hover:scale-105 transition-all"
          >
            Generate Quote
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default GoalsSectionV3;
