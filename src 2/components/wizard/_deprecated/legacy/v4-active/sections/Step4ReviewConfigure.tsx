/**
 * STEP 4: REVIEW & CONFIGURE
 * ============================
 * 
 * Created: December 21, 2025
 * 
 * Purpose: Allow users to review their system configuration and make adjustments
 * before seeing Magic Fit results. Merlin provides intelligent warnings when
 * users make suboptimal choices.
 * 
 * Features:
 * - Configuration Presets: [Conservative] [Optimized] [Aggressive]
 * - Interactive Sliders: Solar %, Battery Duration, Generator
 * - Smart Warnings: Merlin alerts when config deviates from optimal
 * - Sun Icon Integration: Solar sizing suggestions persist here
 * - Visual Energy Mix: Pie/bar chart showing energy sources
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sun, Battery, Fuel, Zap, AlertTriangle, CheckCircle, Sparkles,
  TrendingUp, TrendingDown, Lightbulb, ChevronRight, Settings,
  Wind, Shield, DollarSign, Clock, Info, ArrowRight, Gauge
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { MerlinGreeting, FloatingNavigationArrows } from '../shared';

// Merlin profile image
const merlinProfile = '/images/new_profile_merlin.png';

// ============================================
// TYPES
// ============================================

interface Step4ReviewConfigureProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  // Recommended values from Merlin's calculations
  recommendedBatteryKW: number;
  recommendedBatteryKWh: number;
  recommendedSolarKW: number;
  recommendedGeneratorKW: number;
  peakDemandKW: number;
}

type ConfigPreset = 'conservative' | 'optimized' | 'aggressive';

interface PresetConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  solarPercent: number;    // % of recommended
  batteryPercent: number;  // % of recommended
  durationHours: number;
  includeGenerator: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

const PRESETS: Record<ConfigPreset, PresetConfig> = {
  conservative: {
    label: 'Conservative',
    description: 'Lower upfront cost, proven ROI, minimal risk',
    icon: Shield,
    solarPercent: 60,
    batteryPercent: 70,
    durationHours: 2,
    includeGenerator: false,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  optimized: {
    label: 'Optimized',
    description: 'Merlin\'s recommended balance of savings and resilience',
    icon: Sparkles,
    solarPercent: 100,
    batteryPercent: 100,
    durationHours: 4,
    includeGenerator: false,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-400',
  },
  aggressive: {
    label: 'Maximum',
    description: 'Maximum savings, full backup power, energy independence',
    icon: TrendingUp,
    solarPercent: 140,
    batteryPercent: 130,
    durationHours: 6,
    includeGenerator: true,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
  },
};

// ============================================
// HELPER: Generate Merlin warning message
// ============================================

function getMerlinWarning(
  currentSolarKW: number,
  currentBatteryKW: number,
  currentBatteryKWh: number,
  currentGeneratorKW: number,
  recommendedSolarKW: number,
  recommendedBatteryKW: number,
  recommendedBatteryKWh: number,
  recommendedGeneratorKW: number,
  peakDemandKW: number
): { type: 'warning' | 'caution' | 'success'; message: string; details: string } | null {
  
  const solarDiff = currentSolarKW - recommendedSolarKW;
  const batteryDiff = currentBatteryKW - recommendedBatteryKW;
  const totalPowerKW = currentBatteryKW + currentSolarKW + currentGeneratorKW;
  const coveragePercent = peakDemandKW > 0 ? (totalPowerKW / peakDemandKW) * 100 : 0;
  
  // Critical: Not enough power to cover peak demand
  if (coveragePercent < 50 && peakDemandKW > 0) {
    return {
      type: 'warning',
      message: `Your configuration only covers ${Math.round(coveragePercent)}% of your peak demand`,
      details: `You need at least ${Math.round(peakDemandKW)} kW to fully power your facility during peak hours. Consider increasing battery or adding a generator.`
    };
  }
  
  // Warning: Significantly undersized
  if (batteryDiff < -recommendedBatteryKW * 0.3) {
    return {
      type: 'warning',
      message: 'Battery storage is significantly undersized',
      details: `Your ${currentBatteryKW} kW battery may not provide adequate backup or peak shaving. Merlin recommends at least ${recommendedBatteryKW} kW for your facility.`
    };
  }
  
  // Warning: Very oversized (wasting money)
  if (batteryDiff > recommendedBatteryKW * 0.5) {
    return {
      type: 'caution',
      message: 'Battery may be larger than needed',
      details: `A ${currentBatteryKW} kW system is ${Math.round((batteryDiff / recommendedBatteryKW) * 100)}% larger than optimal. This adds cost without proportional benefits.`
    };
  }
  
  // Caution: No solar when solar is viable
  if (currentSolarKW === 0 && recommendedSolarKW > 0) {
    return {
      type: 'caution',
      message: 'Solar could significantly boost your savings',
      details: `Adding ${recommendedSolarKW} kW of solar could increase your annual savings by 30-50%. Your location has excellent solar potential.`
    };
  }
  
  // Good configuration
  if (coveragePercent >= 90) {
    return {
      type: 'success',
      message: 'Great configuration!',
      details: `Your system covers ${Math.round(coveragePercent)}% of peak demand and is well-balanced for your goals.`
    };
  }
  
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Step4ReviewConfigure({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  recommendedBatteryKW,
  recommendedBatteryKWh,
  recommendedSolarKW,
  recommendedGeneratorKW,
  peakDemandKW,
}: Step4ReviewConfigureProps) {
  // Track selected preset (null if user has customized)
  const [selectedPreset, setSelectedPreset] = useState<ConfigPreset>('optimized');
  const [hasCustomized, setHasCustomized] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Current configuration values (from wizard state or calculated from preset)
  const currentConfig = useMemo(() => ({
    solarKW: wizardState.solarKW || 0,
    batteryKW: wizardState.batteryKW || 0,
    batteryKWh: wizardState.batteryKWh || 0,
    durationHours: wizardState.durationHours || 4,
    generatorKW: wizardState.generatorKW || 0,
    windKW: wizardState.windTurbineKW || 0,
  }), [wizardState]);
  
  // Calculate power coverage
  const totalPowerKW = currentConfig.batteryKW + currentConfig.solarKW + currentConfig.generatorKW + currentConfig.windKW;
  const coveragePercent = peakDemandKW > 0 ? Math.min(200, Math.round((totalPowerKW / peakDemandKW) * 100)) : 0;
  
  // Get Merlin's warning/advice
  const merlinAdvice = useMemo(() => getMerlinWarning(
    currentConfig.solarKW,
    currentConfig.batteryKW,
    currentConfig.batteryKWh,
    currentConfig.generatorKW,
    recommendedSolarKW,
    recommendedBatteryKW,
    recommendedBatteryKWh,
    recommendedGeneratorKW,
    peakDemandKW
  ), [currentConfig, recommendedSolarKW, recommendedBatteryKW, recommendedBatteryKWh, recommendedGeneratorKW, peakDemandKW]);
  
  // Apply a preset configuration
  const applyPreset = useCallback((preset: ConfigPreset) => {
    const config = PRESETS[preset];
    const newSolarKW = Math.round((recommendedSolarKW * config.solarPercent) / 100);
    const newBatteryKW = Math.round((recommendedBatteryKW * config.batteryPercent) / 100);
    const newBatteryKWh = Math.round(newBatteryKW * config.durationHours);
    const newGeneratorKW = config.includeGenerator ? Math.round(peakDemandKW * 0.5) : 0;
    
    setWizardState(prev => ({
      ...prev,
      solarKW: newSolarKW,
      batteryKW: newBatteryKW,
      batteryKWh: newBatteryKWh,
      durationHours: config.durationHours,
      generatorKW: newGeneratorKW,
      wantsGenerator: config.includeGenerator,
    }));
    
    setSelectedPreset(preset);
    setHasCustomized(false);
  }, [recommendedSolarKW, recommendedBatteryKW, peakDemandKW, setWizardState]);
  
  // Initialize with Optimized preset on first load
  useEffect(() => {
    if (currentSection === 3 && currentConfig.batteryKW === 0 && recommendedBatteryKW > 0) {
      applyPreset('optimized');
    }
  }, [currentSection, currentConfig.batteryKW, recommendedBatteryKW, applyPreset]);
  
  // Handle slider changes
  const handleSliderChange = (field: string, value: number) => {
    setHasCustomized(true);
    setSelectedPreset('optimized'); // Keep visual but show customized indicator
    
    if (field === 'solarKW') {
      setWizardState(prev => ({ ...prev, solarKW: value }));
    } else if (field === 'batteryKW') {
      const newKWh = Math.round(value * (wizardState.durationHours || 4));
      setWizardState(prev => ({ ...prev, batteryKW: value, batteryKWh: newKWh }));
    } else if (field === 'durationHours') {
      const newKWh = Math.round((wizardState.batteryKW || 0) * value);
      setWizardState(prev => ({ ...prev, durationHours: value, batteryKWh: newKWh }));
    } else if (field === 'generatorKW') {
      setWizardState(prev => ({ 
        ...prev, 
        generatorKW: value,
        wantsGenerator: value > 0,
      }));
    }
  };
  
  // Format helpers
  const formatPower = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatEnergy = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;
  
  // Action instructions for Merlin
  const actionInstructions = [
    'Choose a configuration preset or customize with sliders',
    'Review the power coverage indicator',
    'Read Merlin\'s advice if shown',
  ];
  
  // Check if ready to continue
  const canContinue = currentConfig.batteryKW > 0;

  return (
    <div
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] pb-[120px]"
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* MerlinGreeting */}
        <MerlinGreeting
          stepNumber={4}
          totalSteps={5}
          stepTitle="Review & Configure"
          stepDescription={
            hasCustomized 
              ? "You've customized your configuration. I'll analyze these settings and show you optimized options in the next step."
              : selectedPreset === 'optimized'
                ? "I've pre-configured your system with my recommended settings. Feel free to adjust using the presets below, or fine-tune with the sliders."
                : `You've selected the ${PRESETS[selectedPreset].label} configuration. This is a great choice for ${PRESETS[selectedPreset].description.toLowerCase()}.`
          }
          estimatedTime="1-2 min"
          actionInstructions={actionInstructions}
          nextStepPreview="Next: See 3 optimized Magic Fit™ options based on your configuration"
          isComplete={canContinue}
          onCompleteMessage={canContinue ? "Your configuration is ready! Click Continue to see your Magic Fit™ options." : undefined}
        />
        
        {/* ═══════════════════════════════════════════════════════════════
            CONFIGURATION PRESETS - Three clickable cards
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration Presets
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(PRESETS) as ConfigPreset[]).map((preset) => {
              const config = PRESETS[preset];
              const Icon = config.icon;
              const isSelected = selectedPreset === preset && !hasCustomized;
              
              return (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? `${config.bgColor} ${config.borderColor} shadow-lg ring-2 ring-offset-2 ring-offset-[#1e1e3d] ${config.borderColor.replace('border-', 'ring-')}`
                      : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {/* Recommended badge for Optimized */}
                  {preset === 'optimized' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      ⭐ RECOMMENDED
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? config.bgColor : 'bg-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? config.color : 'text-white/60'}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg ${isSelected ? config.color : 'text-white'}`}>
                        {config.label}
                      </h4>
                    </div>
                  </div>
                  
                  <p className={`text-sm ${isSelected ? 'text-gray-600' : 'text-white/60'}`}>
                    {config.description}
                  </p>
                  
                  {/* Quick specs */}
                  <div className={`mt-3 pt-3 border-t ${isSelected ? 'border-gray-200' : 'border-white/10'} grid grid-cols-2 gap-2 text-xs`}>
                    <div className={isSelected ? 'text-gray-500' : 'text-white/50'}>
                      <Sun className="w-3 h-3 inline mr-1" />
                      Solar: {config.solarPercent}%
                    </div>
                    <div className={isSelected ? 'text-gray-500' : 'text-white/50'}>
                      <Battery className="w-3 h-3 inline mr-1" />
                      {config.durationHours}hr storage
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className={`w-6 h-6 ${config.color}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Customized indicator */}
          {hasCustomized && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-cyan-300 text-sm">
                <Settings className="w-4 h-4" />
                Custom configuration active
              </span>
            </div>
          )}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            POWER COVERAGE INDICATOR - Visual bar
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Power Coverage
            </h3>
            <span className={`text-2xl font-bold ${
              coveragePercent >= 100 ? 'text-emerald-400' :
              coveragePercent >= 70 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {coveragePercent}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-4 bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                coveragePercent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                coveragePercent >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                'bg-gradient-to-r from-red-500 to-orange-400'
              }`}
              style={{ width: `${Math.min(100, coveragePercent)}%` }}
            />
            {/* 100% marker */}
            <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-white/50" 
                 style={{ left: coveragePercent > 100 ? `${(100/coveragePercent)*100}%` : '100%' }} />
          </div>
          
          <div className="flex justify-between text-xs text-white/50">
            <span>Peak Demand: {formatPower(peakDemandKW)}</span>
            <span>Configured: {formatPower(totalPowerKW)}</span>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN'S ADVICE - Smart warning panel
        ═══════════════════════════════════════════════════════════════ */}
        {merlinAdvice && (
          <div className={`mb-8 p-5 rounded-2xl border-2 ${
            merlinAdvice.type === 'warning' ? 'bg-red-500/10 border-red-400/50' :
            merlinAdvice.type === 'caution' ? 'bg-amber-500/10 border-amber-400/50' :
            'bg-emerald-500/10 border-emerald-400/50'
          }`}>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <img src={merlinProfile} alt="Merlin" className="w-16 h-16 object-contain" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {merlinAdvice.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                  {merlinAdvice.type === 'caution' && <Lightbulb className="w-5 h-5 text-amber-400" />}
                  {merlinAdvice.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  <h4 className={`font-bold ${
                    merlinAdvice.type === 'warning' ? 'text-red-300' :
                    merlinAdvice.type === 'caution' ? 'text-amber-300' :
                    'text-emerald-300'
                  }`}>
                    {merlinAdvice.message}
                  </h4>
                </div>
                <p className="text-white/70 text-sm">
                  {merlinAdvice.details}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════
            FINE-TUNE SLIDERS - Premium Advanced Configuration
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 rounded-2xl border border-white/20 transition-all shadow-lg"
          >
            <span className="text-white font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <div>Fine-Tune Configuration</div>
                <div className="text-xs text-white/50 font-normal">Adjust each component precisely</div>
              </div>
            </span>
            <ChevronRight className={`w-6 h-6 text-white/60 transition-transform duration-300 ${showAdvancedOptions ? 'rotate-90' : ''}`} />
          </button>
          
          {showAdvancedOptions && (
            <div className="mt-4 p-6 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 space-y-8">
              
              {/* Solar Slider - Premium Design */}
              <div className="group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 border border-amber-400/30">
                    <Sun className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white font-semibold">Solar Power</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={Math.round(recommendedSolarKW * 2)}
                          step={10}
                          value={currentConfig.solarKW}
                          onChange={(e) => handleSliderChange('solarKW', Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-white/10 border border-amber-400/30 rounded-lg text-amber-400 font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        />
                        <span className="text-white/50 text-sm">kW</span>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm mb-3">Generate clean energy during daylight hours</p>
                  </div>
                </div>
                
                {/* Premium Slider Track */}
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${(currentConfig.solarKW / (recommendedSolarKW * 2)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={Math.round(recommendedSolarKW * 2)}
                    step={10}
                    value={currentConfig.solarKW}
                    onChange={(e) => handleSliderChange('solarKW', Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {/* Slider thumb indicator */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-amber-400 pointer-events-none transition-all"
                    style={{ left: `calc(${(currentConfig.solarKW / (recommendedSolarKW * 2)) * 100}% - 10px)` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="text-white/40">0 kW</span>
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full font-medium">Rec: {formatPower(recommendedSolarKW)}</span>
                  <span className="text-white/40">{formatPower(recommendedSolarKW * 2)}</span>
                </div>
              </div>
              
              {/* Battery Power Slider - Premium Design */}
              <div className="group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-400/30">
                    <Battery className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white font-semibold">Battery Power</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={50}
                          max={Math.round(recommendedBatteryKW * 2)}
                          step={10}
                          value={currentConfig.batteryKW}
                          onChange={(e) => handleSliderChange('batteryKW', Number(e.target.value))}
                          className="w-24 px-3 py-2 bg-white/10 border border-emerald-400/30 rounded-lg text-emerald-400 font-bold text-right focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                        />
                        <span className="text-white/50 text-sm">kW</span>
                      </div>
                    </div>
                    <p className="text-white/50 text-sm mb-3">Store energy for peak shaving & backup power</p>
                  </div>
                </div>
                
                {/* Premium Slider Track */}
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${((currentConfig.batteryKW - 50) / ((recommendedBatteryKW * 2) - 50)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={50}
                    max={Math.round(recommendedBatteryKW * 2)}
                    step={10}
                    value={currentConfig.batteryKW}
                    onChange={(e) => handleSliderChange('batteryKW', Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-emerald-400 pointer-events-none transition-all"
                    style={{ left: `calc(${((currentConfig.batteryKW - 50) / ((recommendedBatteryKW * 2) - 50)) * 100}% - 10px)` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="text-white/40">50 kW</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">Rec: {formatPower(recommendedBatteryKW)}</span>
                  <span className="text-white/40">{formatPower(recommendedBatteryKW * 2)}</span>
                </div>
              </div>
              
              {/* Duration Selection - Premium Pills */}
              <div className="group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                    <Clock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white font-semibold">Storage Duration</label>
                      <span className="text-cyan-400 font-bold text-lg">{formatEnergy(currentConfig.batteryKWh)}</span>
                    </div>
                    <p className="text-white/50 text-sm">How long your battery can power your facility</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {[2, 4, 6, 8].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => handleSliderChange('durationHours', hours)}
                      className={`relative py-4 px-3 rounded-xl font-bold transition-all overflow-hidden ${
                        currentConfig.durationHours === hours
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30'
                      }`}
                    >
                      <div className="text-2xl">{hours}</div>
                      <div className="text-xs opacity-70">hours</div>
                      {currentConfig.durationHours === hours && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-cyan-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Generator Toggle & Slider - Premium Design */}
              <div className="group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 border border-orange-400/30">
                    <Fuel className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white font-semibold">Backup Generator</label>
                      <button
                        onClick={() => {
                          const newValue = currentConfig.generatorKW > 0 ? 0 : Math.round(peakDemandKW * 0.5);
                          handleSliderChange('generatorKW', newValue);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                          currentConfig.generatorKW > 0
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
                        }`}
                      >
                        {currentConfig.generatorKW > 0 ? '✓ Enabled' : '+ Add Generator'}
                      </button>
                    </div>
                    <p className="text-white/50 text-sm">Critical backup for extended outages</p>
                  </div>
                </div>
                
                {currentConfig.generatorKW > 0 && (
                  <div className="ml-16 space-y-3">
                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="number"
                        min={50}
                        max={Math.round(peakDemandKW)}
                        step={25}
                        value={currentConfig.generatorKW}
                        onChange={(e) => handleSliderChange('generatorKW', Number(e.target.value))}
                        className="w-24 px-3 py-2 bg-white/10 border border-orange-400/30 rounded-lg text-orange-400 font-bold text-right focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                      />
                      <span className="text-white/50 text-sm">kW</span>
                    </div>
                    
                    {/* Premium Slider Track */}
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${((currentConfig.generatorKW - 50) / (peakDemandKW - 50)) * 100}%` }}
                      />
                      <input
                        type="range"
                        min={50}
                        max={Math.round(peakDemandKW)}
                        step={25}
                        value={currentConfig.generatorKW}
                        onChange={(e) => handleSliderChange('generatorKW', Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-orange-400 pointer-events-none transition-all"
                        style={{ left: `calc(${((currentConfig.generatorKW - 50) / (peakDemandKW - 50)) * 100}% - 10px)` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">50 kW</span>
                      <span className="text-white/40">{formatPower(peakDemandKW)} (Peak)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            CURRENT CONFIGURATION SUMMARY
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-5 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl border border-purple-400/30">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Your Configuration Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Battery */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Battery className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-white font-bold text-lg">{formatPower(currentConfig.batteryKW)}</div>
              <div className="text-emerald-400/70 text-sm">{formatEnergy(currentConfig.batteryKWh)}</div>
              <div className="text-white/40 text-xs mt-1">Battery Storage</div>
            </div>
            
            {/* Solar */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Sun className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-white font-bold text-lg">{formatPower(currentConfig.solarKW)}</div>
              <div className="text-amber-400/70 text-sm">{currentConfig.solarKW > 0 ? 'Active' : 'None'}</div>
              <div className="text-white/40 text-xs mt-1">Solar Power</div>
            </div>
            
            {/* Generator */}
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Fuel className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-white font-bold text-lg">{formatPower(currentConfig.generatorKW)}</div>
              <div className="text-orange-400/70 text-sm">{currentConfig.generatorKW > 0 ? 'Backup' : 'None'}</div>
              <div className="text-white/40 text-xs mt-1">Generator</div>
            </div>
            
            {/* Total */}
            <div className="bg-purple-500/20 rounded-xl p-4 text-center border border-purple-400/30">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-white font-bold text-lg">{formatPower(totalPowerKW)}</div>
              <div className="text-purple-400/70 text-sm">{coveragePercent}% coverage</div>
              <div className="text-white/40 text-xs mt-1">Total Power</div>
            </div>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            NAVIGATION BUTTONS - CONSISTENT DESIGN
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mt-8">
          {/* Left side: Back */}
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
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back
          </button>
          
          {/* Right side: Continue to Magic Fit */}
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              canContinue
                ? 'bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6] border-2 border-[#ad42ff] text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105'
                : 'bg-gray-300 border-2 border-gray-400 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>See Magic Fit™ Options</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {!canContinue && (
          <p className="text-center text-amber-300 text-sm mt-3">
            Configure your battery system to continue
          </p>
        )}
        
      </div>
      
      {/* Floating Navigation Arrows - Apple style */}
      <FloatingNavigationArrows
        canGoBack={true}
        canGoForward={canContinue}
        onBack={onBack}
        onForward={onContinue}
        backLabel="Back to Facility"
        forwardLabel="Magic Fit™"
      />
    </div>
  );
}

export default Step4ReviewConfigure;
