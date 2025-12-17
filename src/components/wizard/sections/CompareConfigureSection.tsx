/**
 * COMPARE & CONFIGURE SECTION (Step 3)
 * ====================================
 * 
 * The "Mind Twist" - Two-column comparison letting users see:
 * - LEFT: Merlin's AI-optimized recommendation (read-only, locked 🔒)
 * - RIGHT: Their own configuration (editable sliders, unlocked 🔓)
 * 
 * Key Features:
 * - BESS auto-sizes based on Grid-Synk formula (NOT user-editable)
 * - Duration slider affects BESS capacity but not power
 * - Real-time financial updates via SSOT
 * - TrueQuote™ source tracking
 * 
 * @created December 2025
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  User, 
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Info,
  Zap,
  Settings,
  CheckCircle2,
  Sun,
  Wind,
  Fuel,
  Battery,
  X,
  ExternalLink,
} from 'lucide-react';
import { calculateBESS, recalculateBESSForDuration, BESS_RATIOS } from '@/services/gridSynkBESSCalculator';
import { calculateFinancialsSync } from '@/services/compareConfigFinancials';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import type { 
  MerlinRecommendation, 
  UserConfiguration, 
  CompareConfigureSectionProps,
  FinancialResult,
} from '@/types/compareConfig';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompareConfigureSection({
  peakDemandKW,
  state,
  electricityRate,
  demandChargePerKW,
  primaryApplication,
  initialSolarKW,
  initialWindKW,
  initialGeneratorKW,
  onAcceptConfig,
  onAdvancedQuoteBuilder,
}: CompareConfigureSectionProps) {
  
  // ═══════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════
  
  const [showFirstTimePopup, setShowFirstTimePopup] = useState(true);
  const [showBESSExplainer, setShowBESSExplainer] = useState(false);
  const [hasUserModified, setHasUserModified] = useState(false);
  
  // User configuration (editable)
  const [userSolarKW, setUserSolarKW] = useState(initialSolarKW);
  const [userWindKW, setUserWindKW] = useState(initialWindKW);
  const [userGeneratorKW, setUserGeneratorKW] = useState(initialGeneratorKW);
  const [userDurationHours, setUserDurationHours] = useState(4);
  
  // Check if first visit
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('compareConfig_seenPopup');
    if (hasSeenPopup) {
      setShowFirstTimePopup(false);
    }
  }, []);
  
  const handleDismissPopup = useCallback(() => {
    setShowFirstTimePopup(false);
    sessionStorage.setItem('compareConfig_seenPopup', 'true');
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════
  // MERLIN'S RECOMMENDATION (Calculated once)
  // ═══════════════════════════════════════════════════════════════════
  
  const merlinRecommendation = useMemo((): MerlinRecommendation => {
    // Calculate optimal BESS using Grid-Synk
    const bess = calculateBESS({
      peakDemandKW,
      durationHours: 4, // Merlin defaults to 4 hours
      application: primaryApplication || 'peak-shaving',
    });
    
    // Calculate optimal solar (50% of peak for balanced ROI)
    const optimalSolarKW = Math.round(peakDemandKW * 0.5);
    
    // Calculate optimal generator (25% for backup)
    const optimalGeneratorKW = Math.round(peakDemandKW * 0.25);
    
    // Calculate financials
    const financials = calculateFinancialsSync({
      batteryKW: bess.batteryKW,
      batteryKWh: bess.batteryKWh,
      solarKW: optimalSolarKW,
      windKW: 0,
      generatorKW: optimalGeneratorKW,
      state,
      electricityRate,
      demandChargePerKW: demandChargePerKW || 15,
    });
    
    return {
      batteryKW: bess.batteryKW,
      batteryKWh: bess.batteryKWh,
      durationHours: 4,
      solarKW: optimalSolarKW,
      windKW: 0,
      generatorKW: optimalGeneratorKW,
      netInvestment: financials.netInvestment,
      annualSavings: financials.annualSavings,
      paybackYears: financials.paybackYears,
      roi25Year: financials.roi25Year,
      reasoning: 'Optimized for best ROI with peak shaving + solar generation',
      confidence: 'high',
    };
  }, [peakDemandKW, primaryApplication, state, electricityRate, demandChargePerKW]);
  
  // ═══════════════════════════════════════════════════════════════════
  // USER CONFIGURATION (Recalculated on every change)
  // ═══════════════════════════════════════════════════════════════════
  
  const userConfiguration = useMemo((): UserConfiguration => {
    // Auto-calculate BESS based on user's duration
    const bess = recalculateBESSForDuration(
      peakDemandKW,
      userDurationHours,
      primaryApplication || 'peak-shaving'
    );
    
    // Calculate financials for user's config
    const financials = calculateFinancialsSync({
      batteryKW: bess.batteryKW,
      batteryKWh: bess.batteryKWh,
      solarKW: userSolarKW,
      windKW: userWindKW,
      generatorKW: userGeneratorKW,
      state,
      electricityRate,
      demandChargePerKW: demandChargePerKW || 15,
    });
    
    return {
      batteryKW: bess.batteryKW,
      batteryKWh: bess.batteryKWh,
      durationHours: userDurationHours,
      solarKW: userSolarKW,
      windKW: userWindKW,
      generatorKW: userGeneratorKW,
      netInvestment: financials.netInvestment,
      annualSavings: financials.annualSavings,
      paybackYears: financials.paybackYears,
      roi25Year: financials.roi25Year,
    };
  }, [
    peakDemandKW, 
    userDurationHours, 
    userSolarKW, 
    userWindKW, 
    userGeneratorKW,
    primaryApplication,
    state,
    electricityRate,
    demandChargePerKW
  ]);
  
  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════
  
  const handleSliderChange = useCallback((
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => {
    setter(value);
    setHasUserModified(true);
  }, []);
  
  const handleResetToMerlin = useCallback(() => {
    setUserSolarKW(merlinRecommendation.solarKW);
    setUserWindKW(merlinRecommendation.windKW);
    setUserGeneratorKW(merlinRecommendation.generatorKW);
    setUserDurationHours(merlinRecommendation.durationHours);
    setHasUserModified(false);
  }, [merlinRecommendation]);
  
  const handleAcceptMerlin = useCallback(() => {
    onAcceptConfig({
      batteryKW: merlinRecommendation.batteryKW,
      batteryKWh: merlinRecommendation.batteryKWh,
      durationHours: merlinRecommendation.durationHours,
      solarKW: merlinRecommendation.solarKW,
      windKW: merlinRecommendation.windKW,
      generatorKW: merlinRecommendation.generatorKW,
      netInvestment: merlinRecommendation.netInvestment,
      annualSavings: merlinRecommendation.annualSavings,
      paybackYears: merlinRecommendation.paybackYears,
      roi25Year: merlinRecommendation.roi25Year,
    }, 'merlin');
  }, [merlinRecommendation, onAcceptConfig]);
  
  const handleAcceptUser = useCallback(() => {
    onAcceptConfig(userConfiguration, 'user');
  }, [userConfiguration, onAcceptConfig]);
  
  // ═══════════════════════════════════════════════════════════════════
  // SLIDER RANGES
  // ═══════════════════════════════════════════════════════════════════
  
  const sliderRanges = useMemo(() => ({
    solar: {
      min: 0,
      max: Math.round(peakDemandKW * 1.5), // Up to 150% of peak
      step: 25,
    },
    wind: {
      min: 0,
      max: Math.round(peakDemandKW * 0.5), // Up to 50% of peak
      step: 25,
    },
    generator: {
      min: 0,
      max: Math.round(peakDemandKW * 0.75), // Up to 75% of peak
      step: 25,
    },
    duration: {
      min: 2,
      max: 8,
      step: 1,
    },
  }), [peakDemandKW]);
  
  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-6">
      {/* First-Time Popup */}
      {showFirstTimePopup && (
        <FirstTimePopup onDismiss={handleDismissPopup} />
      )}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Compare & Configure
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Compare Merlin's AI-optimized recommendation with your custom configuration.
          Adjust the sliders on the right to see how changes affect your savings.
        </p>
      </div>
      
      {/* Two-Column Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Merlin's Pick */}
        <ConfigColumn
          title="Merlin's Pick"
          subtitle="AI-Optimized for Your Facility"
          icon={<Sparkles className="w-5 h-5" />}
          isLocked={true}
          config={{
            batteryKW: merlinRecommendation.batteryKW,
            batteryKWh: merlinRecommendation.batteryKWh,
            durationHours: merlinRecommendation.durationHours,
            solarKW: merlinRecommendation.solarKW,
            windKW: merlinRecommendation.windKW,
            generatorKW: merlinRecommendation.generatorKW,
          }}
          financials={{
            netInvestment: merlinRecommendation.netInvestment,
            annualSavings: merlinRecommendation.annualSavings,
            paybackYears: merlinRecommendation.paybackYears,
            roi25Year: merlinRecommendation.roi25Year,
          }}
          onAccept={handleAcceptMerlin}
          acceptLabel="Accept Merlin's"
          accentColor="purple"
        />
        
        {/* RIGHT: User's Config */}
        <ConfigColumn
          title="Your Configuration"
          subtitle="Customize Your System"
          icon={<User className="w-5 h-5" />}
          isLocked={false}
          config={{
            batteryKW: userConfiguration.batteryKW,
            batteryKWh: userConfiguration.batteryKWh,
            durationHours: userConfiguration.durationHours,
            solarKW: userConfiguration.solarKW,
            windKW: userConfiguration.windKW,
            generatorKW: userConfiguration.generatorKW,
          }}
          financials={{
            netInvestment: userConfiguration.netInvestment,
            annualSavings: userConfiguration.annualSavings,
            paybackYears: userConfiguration.paybackYears,
            roi25Year: userConfiguration.roi25Year,
          }}
          onAccept={handleAcceptUser}
          acceptLabel="Accept My Config"
          accentColor="amber"
          sliders={{
            solar: {
              value: userSolarKW,
              onChange: (v) => handleSliderChange(setUserSolarKW, v),
              ...sliderRanges.solar,
            },
            wind: {
              value: userWindKW,
              onChange: (v) => handleSliderChange(setUserWindKW, v),
              ...sliderRanges.wind,
            },
            generator: {
              value: userGeneratorKW,
              onChange: (v) => handleSliderChange(setUserGeneratorKW, v),
              ...sliderRanges.generator,
            },
            duration: {
              value: userDurationHours,
              onChange: (v) => handleSliderChange(setUserDurationHours, v),
              ...sliderRanges.duration,
            },
          }}
          onReset={hasUserModified ? handleResetToMerlin : undefined}
        />
      </div>
      
      {/* BESS Explainer */}
      <BESSExplainer
        peakDemandKW={peakDemandKW}
        durationHours={userDurationHours}
        batteryKW={userConfiguration.batteryKW}
        batteryKWh={userConfiguration.batteryKWh}
        application={primaryApplication || 'peak-shaving'}
        isExpanded={showBESSExplainer}
        onToggle={() => setShowBESSExplainer(!showBESSExplainer)}
      />
      
      {/* Advanced Quote Builder Link */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onAdvancedQuoteBuilder}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900
                     border-2 border-gray-300 rounded-xl hover:border-gray-400 
                     hover:bg-gray-50 transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Advanced Quote Builder</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* TrueQuote Badge */}
      <div className="flex justify-center pt-4">
        <TrueQuoteBadge size="md" showTooltip={true} />
      </div>
    </div>
  );
}

// ============================================================================
// CONFIG COLUMN COMPONENT
// ============================================================================

interface ConfigColumnProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isLocked: boolean;
  config: {
    batteryKW: number;
    batteryKWh: number;
    durationHours: number;
    solarKW: number;
    windKW: number;
    generatorKW: number;
  };
  financials: {
    netInvestment: number;
    annualSavings: number;
    paybackYears: number;
    roi25Year: number;
  };
  onAccept: () => void;
  acceptLabel: string;
  accentColor: 'purple' | 'amber';
  sliders?: {
    solar: { value: number; onChange: (v: number) => void; min: number; max: number; step: number };
    wind: { value: number; onChange: (v: number) => void; min: number; max: number; step: number };
    generator: { value: number; onChange: (v: number) => void; min: number; max: number; step: number };
    duration: { value: number; onChange: (v: number) => void; min: number; max: number; step: number };
  };
  onReset?: () => void;
}

function ConfigColumn({
  title,
  subtitle,
  icon,
  isLocked,
  config,
  financials,
  onAccept,
  acceptLabel,
  accentColor,
  sliders,
  onReset,
}: ConfigColumnProps) {
  const colorClasses = {
    purple: {
      border: 'border-purple-300',
      bg: 'bg-purple-50',
      header: 'bg-gradient-to-r from-purple-600 to-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      slider: 'accent-purple-600',
    },
    amber: {
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      header: 'bg-gradient-to-r from-amber-500 to-amber-400',
      button: 'bg-amber-500 hover:bg-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      slider: 'accent-amber-500',
    },
  };
  
  const colors = colorClasses[accentColor];
  
  return (
    <div className={`rounded-2xl border-2 ${colors.border} overflow-hidden shadow-lg`}>
      {/* Header */}
      <div className={`${colors.header} px-6 py-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
          </div>
          <div className={`p-2 rounded-full ${isLocked ? 'bg-white/20' : 'bg-white/30'}`}>
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4 bg-white">
        {/* Reset Button (only for user column) */}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Merlin's values
          </button>
        )}
        
        {/* BESS Section */}
        <div className={`p-4 rounded-xl ${colors.bg}`}>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-600" />
            Battery Storage
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Power:</span>
              <span className="font-semibold text-gray-900 ml-2">{config.batteryKW.toLocaleString()} kW</span>
            </div>
            <div>
              <span className="text-gray-500">Capacity:</span>
              <span className="font-semibold text-gray-900 ml-2">{config.batteryKWh.toLocaleString()} kWh</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Duration:</span>
              {sliders ? (
                <div className="mt-2">
                  <input
                    type="range"
                    min={sliders.duration.min}
                    max={sliders.duration.max}
                    step={sliders.duration.step}
                    value={sliders.duration.value}
                    onChange={(e) => sliders.duration.onChange(Number(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${colors.slider}`}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{sliders.duration.min} hr</span>
                    <span className="font-semibold text-gray-900">{config.durationHours} hours</span>
                    <span>{sliders.duration.max} hr</span>
                  </div>
                </div>
              ) : (
                <span className="font-semibold text-gray-900 ml-2">{config.durationHours} hours</span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            Auto-calculated via Grid-Synk formula
          </p>
        </div>
        
        {/* Solar */}
        <EquipmentRow
          label="Solar"
          value={config.solarKW}
          unit="kW"
          icon={<Sun className="w-4 h-4 text-amber-500" />}
          slider={sliders?.solar}
          isLocked={isLocked}
          accentColor={accentColor}
        />
        
        {/* Generator */}
        <EquipmentRow
          label="Generator"
          value={config.generatorKW}
          unit="kW"
          icon={<Fuel className="w-4 h-4 text-gray-500" />}
          slider={sliders?.generator}
          isLocked={isLocked}
          accentColor={accentColor}
        />
        
        {/* Wind */}
        <EquipmentRow
          label="Wind"
          value={config.windKW}
          unit="kW"
          icon={<Wind className="w-4 h-4 text-blue-500" />}
          slider={sliders?.wind}
          isLocked={isLocked}
          accentColor={accentColor}
        />
        
        {/* Financial Summary */}
        <div className="border-t-2 border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Net Investment:</span>
              <span className="font-bold text-gray-900">${financials.netInvestment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Savings:</span>
              <span className="font-bold text-emerald-600">${financials.annualSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payback Period:</span>
              <span className="font-bold text-gray-900">{financials.paybackYears.toFixed(1)} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">25-Year ROI:</span>
              <span className="font-bold text-emerald-600">{financials.roi25Year.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* Accept Button */}
        <button
          onClick={onAccept}
          className={`w-full py-4 ${colors.button} text-white font-bold rounded-xl 
                     flex items-center justify-center gap-2 transition-all
                     hover:shadow-lg`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {acceptLabel}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EQUIPMENT ROW COMPONENT
// ============================================================================

interface EquipmentRowProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  slider?: { value: number; onChange: (v: number) => void; min: number; max: number; step: number };
  isLocked: boolean;
  accentColor: 'purple' | 'amber';
}

function EquipmentRow({ label, value, unit, icon, slider, isLocked, accentColor }: EquipmentRowProps) {
  const sliderClass = accentColor === 'purple' ? 'accent-purple-600' : 'accent-amber-500';
  
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-semibold text-gray-900">{value.toLocaleString()} {unit}</span>
      </div>
      {slider && !isLocked && (
        <div className="mt-2">
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={slider.value}
            onChange={(e) => slider.onChange(Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${sliderClass}`}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{slider.min}</span>
            <span>{slider.max}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BESS EXPLAINER COMPONENT
// ============================================================================

interface BESSExplainerProps {
  peakDemandKW: number;
  durationHours: number;
  batteryKW: number;
  batteryKWh: number;
  application: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function BESSExplainer({
  peakDemandKW,
  durationHours,
  batteryKW,
  batteryKWh,
  application,
  isExpanded,
  onToggle,
}: BESSExplainerProps) {
  // Get the ratio for the application
  const ratio = BESS_RATIOS[application] || BESS_RATIOS['default'] || 0.5;
  const combinedEfficiency = 0.7695; // 90% DoD × 90% static × 95% cycle
  
  return (
    <div className="bg-gray-100 rounded-2xl border-2 border-gray-300 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-gray-900">
            BESS Auto-Sizing (Grid-Synk Industry Standard)
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-white rounded-xl">
              <h5 className="font-semibold text-gray-900 mb-2">Your Inputs</h5>
              <div className="space-y-1 text-gray-600">
                <p>Peak Demand: <strong className="text-gray-900">{peakDemandKW.toLocaleString()} kW</strong></p>
                <p>Duration: <strong className="text-gray-900">{durationHours} hours</strong></p>
                <p>Application: <strong className="text-gray-900 capitalize">{application.replace(/-/g, ' ')}</strong></p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <h5 className="font-semibold text-gray-900 mb-2">Calculated BESS</h5>
              <div className="space-y-1 text-gray-600">
                <p>Power: <strong className="text-gray-900">{batteryKW.toLocaleString()} kW</strong></p>
                <p>Capacity: <strong className="text-gray-900">{batteryKWh.toLocaleString()} kWh</strong></p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h5 className="font-semibold text-amber-900 mb-2">Formula (Grid-Synk)</h5>
            <div className="space-y-2 font-mono text-sm text-amber-800">
              <p>
                <span className="text-amber-600">Step 1:</span> BESS Power = Peak × {(ratio * 100).toFixed(0)}% = {peakDemandKW.toLocaleString()} × {ratio} = <strong>{batteryKW.toLocaleString()} kW</strong>
              </p>
              <p>
                <span className="text-amber-600">Step 2:</span> Usable Capacity = {batteryKW.toLocaleString()} kW × {durationHours} hr = <strong>{(batteryKW * durationHours).toLocaleString()} kWh</strong>
              </p>
              <p>
                <span className="text-amber-600">Step 3:</span> Required Capacity = {(batteryKW * durationHours).toLocaleString()} ÷ {(combinedEfficiency * 100).toFixed(1)}% = <strong>{batteryKWh.toLocaleString()} kWh</strong>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs text-amber-700">
                📖 The {(combinedEfficiency * 100).toFixed(1)}% efficiency accounts for: 90% DoD, 90% static losses, 95% cycle efficiency
              </p>
              <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Source: <a href="https://grid-synk.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">Grid-Synk BESS Calculator</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FIRST TIME POPUP
// ============================================================================

interface FirstTimePopupProps {
  onDismiss: () => void;
}

function FirstTimePopup({ onDismiss }: FirstTimePopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md p-6 animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">How This Works</h3>
        </div>
        
        <p className="text-gray-600 mb-4 text-center">
          Compare <strong className="text-purple-700">Merlin's AI-optimized recommendation</strong> (left) with 
          <strong className="text-amber-600"> your custom configuration</strong> (right).
        </p>
        
        <ul className="space-y-3 text-sm text-gray-600 mb-6">
          <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span><strong className="text-purple-700">Left column is locked</strong> — Merlin's AI-optimized values based on your facility</span>
          </li>
          <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <Unlock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span><strong className="text-amber-600">Right column has sliders</strong> — adjust to see how changes affect financials</span>
          </li>
          <li className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
            <Zap className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span><strong className="text-emerald-700">BESS auto-calculates</strong> — you set duration, we size the battery using Grid-Synk standards</span>
          </li>
        </ul>
        
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 
                     text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          Got it! Let's Compare
        </button>
      </div>
    </div>
  );
}

export default CompareConfigureSection;
