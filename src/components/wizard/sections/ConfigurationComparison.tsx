// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION COMPARISON SECTION (Step 4)
// Complete redesign - Dec 16, 2025
// Updated Dec 17, 2025 - Added sliders with smart guidance for user config
// 
// The "Mind Twist" - User's configuration vs Merlin's recommendation
// 
// Features:
// 1. User can ADJUST their configuration with sliders
// 2. Smart guidance shows when user exceeds recommended capacity
// 3. Merlin's AI-optimized recommendation (FIXED - doesn't change)
// 4. Side-by-side comparison with key metrics
// 5. User can accept either configuration
// 6. Auto-advances to scenario planner (Step 5) after selection
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Battery,
  Sun,
  Wind,
  Zap,
  Fuel,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  Shield,
  Scale,
  ThumbsUp,
  Lightbulb,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import merlinImage from '@/assets/images/new_Merlin.png';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';

interface ConfigurationComparisonProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  centralizedState: any;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onHome?: () => void; // Navigate to vertical landing page
}

export function ConfigurationComparison({
  wizardState,
  setWizardState,
  centralizedState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  onHome,
}: ConfigurationComparisonProps) {
  const [selectedConfig, setSelectedConfig] = useState<'user' | 'merlin' | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  
  // Get peak demand for guidance
  const peakDemandKW = centralizedState?.calculated?.totalPeakDemandKW || 450;
  const industryName = wizardState.industryName || wizardState.selectedIndustry || 'your facility';
  
  // Get Merlin's recommendation from centralized calculations
  const merlinConfig = {
    batteryKW: centralizedState?.calculated?.recommendedBatteryKW || 250,
    batteryKWh: centralizedState?.calculated?.recommendedBatteryKWh || 1000,
    durationHours: centralizedState?.calculated?.recommendedBackupHours || 4,
    solarKW: centralizedState?.calculated?.recommendedSolarKW || 0,
    windKW: 0, // Merlin typically doesn't recommend wind for hotels
    generatorKW: centralizedState?.calculated?.recommendedGeneratorKW || 0,
    annualSavings: centralizedState?.calculated?.estimatedAnnualSavings || 50000,
    paybackYears: centralizedState?.calculated?.estimatedPaybackYears || 4.5,
    roi25Year: Math.round((25 / (centralizedState?.calculated?.estimatedPaybackYears || 4.5)) * 100) || 550,
    netCost: centralizedState?.calculated?.estimatedCost || 500000,
  };
  
  // ═══════════════════════════════════════════════════════════════
  // SMART CAPACITY RECOMMENDATIONS
  // These are based on peak demand and industry standards
  // ═══════════════════════════════════════════════════════════════
  const recommendations = {
    // Battery: 50-100% of peak demand for most commercial
    minBatteryKW: Math.round(peakDemandKW * 0.5),
    maxBatteryKW: Math.round(peakDemandKW * 1.5),
    recommendedBatteryKW: merlinConfig.batteryKW,
    // Solar: 50-150% of peak demand (NREL commercial solar sizing)
    minSolarKW: Math.round(peakDemandKW * 0.5),
    maxSolarKW: Math.round(peakDemandKW * 2.0),
    recommendedSolarKW: Math.round(peakDemandKW * 1.2), // 1.2x peak is optimal
    // Wind: typically 10-50% of peak for commercial (less common)
    minWindKW: 0,
    maxWindKW: Math.round(peakDemandKW * 0.5),
    recommendedWindKW: 0, // Wind rarely recommended for commercial
    // Generator: 25-50% of peak for backup
    minGeneratorKW: Math.round(peakDemandKW * 0.25),
    maxGeneratorKW: Math.round(peakDemandKW * 0.75),
    recommendedGeneratorKW: Math.round(peakDemandKW * 0.25),
  };
  
  // User's current config (editable via sliders)
  const [userBatteryKW, setUserBatteryKW] = useState(wizardState.batteryKW || merlinConfig.batteryKW);
  const [userSolarKW, setUserSolarKW] = useState(wizardState.solarKW || 0);
  const [userWindKW, setUserWindKW] = useState(wizardState.windTurbineKW || 0);
  const [userGeneratorKW, setUserGeneratorKW] = useState(wizardState.generatorKW || 0);
  const [userDurationHours, setUserDurationHours] = useState(wizardState.durationHours || 4);
  
  // Sync local state to wizard state
  useEffect(() => {
    setWizardState(prev => ({
      ...prev,
      batteryKW: userBatteryKW,
      batteryKWh: userBatteryKW * userDurationHours,
      solarKW: userSolarKW,
      windTurbineKW: userWindKW,
      generatorKW: userGeneratorKW,
      durationHours: userDurationHours,
    }));
  }, [userBatteryKW, userSolarKW, userWindKW, userGeneratorKW, userDurationHours, setWizardState]);
  
  // Calculate user config financials (rough estimate)
  const userConfig = {
    batteryKW: userBatteryKW,
    batteryKWh: userBatteryKW * userDurationHours,
    durationHours: userDurationHours,
    solarKW: userSolarKW,
    windKW: userWindKW,
    generatorKW: userGeneratorKW,
    annualSavings: Math.round((userBatteryKW * userDurationHours) * 0.12 * 365 * 0.4),
    paybackYears: 0,
    roi25Year: 0,
    netCost: Math.round((userBatteryKW * userDurationHours * 150) + (userSolarKW * 850) + (userGeneratorKW * 800)),
  };
  userConfig.paybackYears = userConfig.annualSavings > 0 ? userConfig.netCost / userConfig.annualSavings : 10;
  userConfig.roi25Year = userConfig.paybackYears > 0 ? Math.round((25 / userConfig.paybackYears) * 100) : 0;
  
  // Calculate comparison percentages
  const getComparison = useCallback((userVal: number, merlinVal: number) => {
    if (merlinVal === 0) return { diff: 0, isHigher: false };
    const diff = ((userVal - merlinVal) / merlinVal) * 100;
    return { diff: Math.abs(diff), isHigher: userVal > merlinVal };
  }, []);
  
  // Format helpers
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    if (amt >= 1000) return `$${Math.round(amt / 1000)}K`;
    return `$${amt.toLocaleString()}`;
  };
  
  const formatPower = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
    return `${Math.round(kw)} kW`;
  };
  
  const formatEnergy = (kwh: number) => {
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${Math.round(kwh)} kWh`;
  };
  
  // Handle config selection - NO auto-advance, user must click button
  const handleSelectConfig = (config: 'user' | 'merlin') => {
    setSelectedConfig(config);
    
    // Apply the selected configuration to state
    if (config === 'merlin') {
      setWizardState(prev => ({
        ...prev,
        batteryKW: merlinConfig.batteryKW,
        batteryKWh: merlinConfig.batteryKWh,
        durationHours: merlinConfig.durationHours,
        solarKW: merlinConfig.solarKW,
        windTurbineKW: merlinConfig.windKW,
        generatorKW: merlinConfig.generatorKW,
        selectedConfigSource: 'merlin',
      }));
    } else {
      setWizardState(prev => ({
        ...prev,
        selectedConfigSource: 'user',
      }));
    }
    // NO auto-advance - user must click "Continue" button to proceed
  };
  
  // Handle continue button click - only way to advance to next step
  const handleContinueClick = () => {
    if (!selectedConfig) {
      // Auto-select user config if they haven't selected anything
      setSelectedConfig('user');
    }
    onContinue();
  };
  
  // Don't render if not on this section
  if (currentSection !== 4) return null;
  
  return (
    <div
      ref={sectionRef}
      className="min-h-[calc(100vh-120px)] p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GUIDANCE BANNER - Large, visible, branded
            Using Merlin palette: Light purple #cc89ff background
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8 bg-gradient-to-br from-[#cc89ff]/30 via-[#bc66ff]/20 to-[#8dcefb]/20 border-4 border-[#6700b6] rounded-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-5">
            {/* Merlin Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#6700b6] to-[#060F76] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#ad42ff]">
                  <img src={merlinImage} alt="Merlin" className="w-16 h-16" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ffa600] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Scale className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* Guidance Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Compare Your Options</h2>
                <span className="px-3 py-1 bg-[#ffa600] text-white text-sm font-bold rounded-full">
                  Step 4 of 7
                </span>
              </div>
              
              <p className="text-lg text-white/90 leading-relaxed mb-4">
                I've prepared <strong className="text-[#ffd689]">two configurations</strong> for your {industryName}:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* User Config explanation */}
                <div className="bg-[#060F76] border-2 border-[#68BFFA] rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#68BFFA] rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-black text-lg text-[#68BFFA]">Your Configuration</h4>
                  </div>
                  <p className="text-white text-sm">
                    Based on your choices in Goals - includes your solar, wind, and generator preferences.
                  </p>
                </div>
                
                {/* Merlin Config explanation */}
                <div className="bg-[#6700b6] border-2 border-[#ffa600] rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#ffa600] rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-black text-lg text-[#ffa600]">Merlin's Recommendation</h4>
                  </div>
                  <p className="text-white text-sm">
                    AI-optimized for your peak demand ({formatPower(peakDemandKW)}) using industry benchmarks.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[#ffd689]">
                <Lightbulb className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Click either card to select it, then hit "Continue" to see your TrueQuote™
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Title - large and prominent */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white mb-3">
            Your Configuration vs. <span className="text-[#ffa600]">Merlin's Recommendation</span>
          </h2>
          <p className="text-xl text-white/80 font-medium">Click either card to select it, then hit "Next Step" to continue</p>
        </div>
        
        {/* ════════════════════════════════════════════════════════════════
            SIDE-BY-SIDE COMPARISON - Light backgrounds for contrast
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* ═══════════════════════════════════════════
              USER'S CONFIGURATION (Left) - BLUE/CYAN Theme
              High contrast with the purple Merlin panel
          ═══════════════════════════════════════════ */}
          <div 
            className={`relative rounded-3xl p-10 border-4 transition-all shadow-2xl ${
              selectedConfig === 'user'
                ? 'border-[#ffa600] ring-4 ring-[#ffa600]/40 scale-[1.03] z-10'
                : 'border-[#68BFFA] hover:border-[#ffa600] cursor-pointer opacity-90'
            }`}
            style={{background: 'linear-gradient(135deg, #060F76 0%, #68BFFA 60%, #005fa3 100%)'}}
            onClick={() => handleSelectConfig('user')}
          >
            {selectedConfig === 'user' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#68BFFA] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                  SELECTED
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ffa600] to-[#68BFFA] rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white drop-shadow-xl">
                <ThumbsUp className="w-9 h-9 text-white drop-shadow" />
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">Your Configuration</h3>
                <p className="text-xl text-white font-bold opacity-90">Customize your energy system</p>
              </div>
            </div>
            
            {/* ═══════════════════════════════════════════
                INTERACTIVE SLIDERS WITH GUIDANCE - Light theme
            ═══════════════════════════════════════════ */}
            <div className="space-y-4 mb-6">
              
              {/* Battery Slider */}
              <div className="bg-white/70 rounded-xl p-4 border border-[#68BFFA]/30 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-[#68BFFA]" />
                    <span className="text-[#060F76] font-semibold">Battery Power</span>
                  </div>
                  <span className="font-bold text-[#060F76]">{formatPower(userBatteryKW)}</span>
                </div>
                <input
                  type="range"
                  min={recommendations.minBatteryKW}
                  max={recommendations.maxBatteryKW}
                  value={userBatteryKW}
                  onChange={(e) => setUserBatteryKW(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-3 bg-[#68BFFA]/30 rounded-lg appearance-none cursor-pointer accent-[#68BFFA]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#68BFFA] [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span className="text-[#060F76]/70">{formatPower(recommendations.minBatteryKW)}</span>
                  <span className="text-[#6700b6] font-bold">Recommended: {formatPower(recommendations.recommendedBatteryKW)}</span>
                  <span className="text-[#060F76]/70">{formatPower(recommendations.maxBatteryKW)}</span>
                </div>
              </div>
              
              {/* Duration Slider */}
              <div className="bg-white/70 rounded-xl p-4 border border-[#68BFFA]/30 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#68BFFA]" />
                    <span className="text-[#060F76] font-semibold">Backup Duration</span>
                  </div>
                  <span className="font-bold text-[#060F76]">{userDurationHours} hours</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={userDurationHours}
                  onChange={(e) => setUserDurationHours(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-3 bg-[#68BFFA]/30 rounded-lg appearance-none cursor-pointer accent-[#68BFFA]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#68BFFA] [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span className="text-[#060F76]/70">2 hrs</span>
                  <span className="text-[#6700b6] font-bold">Recommended: 4 hrs</span>
                  <span className="text-[#060F76]/70">8 hrs</span>
                </div>
              </div>
              
              {/* Solar Slider with Smart Guidance */}
              <div className={`rounded-xl p-4 border shadow-sm ${userSolarKW > recommendations.recommendedSolarKW ? 'bg-[#ffa600]/20 border-[#ffa600]/50' : 'bg-white/70 border-[#68BFFA]/30'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-[#ffa600]" />
                    <span className="text-[#060F76] font-semibold">Solar Power</span>
                    {userSolarKW > recommendations.recommendedSolarKW && (
                      <AlertTriangle className="w-4 h-4 text-[#ffa600]" />
                    )}
                  </div>
                  <span className={`font-bold ${userSolarKW > recommendations.recommendedSolarKW ? 'text-[#ffa600]' : 'text-[#060F76]'}`}>
                    {formatPower(userSolarKW)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={recommendations.maxSolarKW}
                  value={userSolarKW}
                  onChange={(e) => setUserSolarKW(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-3 bg-[#68BFFA]/30 rounded-lg appearance-none cursor-pointer accent-[#ffa600]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffa600] [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span className="text-[#060F76]/70">0 kW</span>
                  <span className="text-[#6700b6] font-bold">Optimal: {formatPower(recommendations.recommendedSolarKW)}</span>
                  <span className="text-[#060F76]/70">{formatPower(recommendations.maxSolarKW)}</span>
                </div>
                
                {/* Smart Guidance Message */}
                {userSolarKW > recommendations.recommendedSolarKW && (
                  <div className="mt-3 p-3 bg-white/70 rounded-lg border border-[#ffa600]/40">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#ffa600] flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-[#060F76]">
                        <strong className="text-[#ffa600]">For {industryName}</strong>, we recommend ~{formatPower(recommendations.recommendedSolarKW)} of solar 
                        (1.2x your {formatPower(peakDemandKW)} peak demand). 
                        You've selected {formatPower(userSolarKW)} which exceeds your facility's typical needs. 
                        This will increase costs without proportional savings.
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Optimal indicator */}
                {userSolarKW > 0 && userSolarKW <= recommendations.recommendedSolarKW && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#6700b6]">
                    <CheckCircle className="w-3 h-3" />
                    <span>Good choice! Solar sized appropriately for your facility.</span>
                  </div>
                )}
              </div>
              
              {/* Generator Slider */}
              <div className="bg-white/70 rounded-xl p-4 border border-[#68BFFA]/30 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-[#060F76]" />
                    <span className="text-[#060F76] font-semibold">Backup Generator</span>
                  </div>
                  <span className="font-bold text-[#060F76]">{formatPower(userGeneratorKW)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={recommendations.maxGeneratorKW}
                  value={userGeneratorKW}
                  onChange={(e) => setUserGeneratorKW(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-3 bg-[#68BFFA]/30 rounded-lg appearance-none cursor-pointer accent-[#060F76]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#060F76] [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span className="text-[#060F76]/70">0 kW</span>
                  <span className="text-[#6700b6] font-bold">Optional: {formatPower(recommendations.recommendedGeneratorKW)}</span>
                  <span className="text-[#060F76]/70">{formatPower(recommendations.maxGeneratorKW)}</span>
                </div>
              </div>
            </div>
            
            {/* Storage Summary */}
            <div className="bg-white/90 rounded-xl p-4 mb-4 border-2 border-[#ffa600]/60">
              <div className="flex items-center justify-between">
                <span className="text-lg text-[#060F76] font-bold">Total Storage Capacity</span>
                <span className="text-xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatEnergy(userConfig.batteryKWh)}</span>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="bg-white/90 rounded-xl p-5 space-y-4 border-2 border-[#ffa600]/60">
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">Annual Savings</span>
                <span className="text-2xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(userConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">Payback Period</span>
                <span className="text-2xl font-black text-[#6700b6] transition-all duration-300 ease-out">{userConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">25-Year ROI</span>
                <span className="text-2xl font-black text-[#ffa600] transition-all duration-300 ease-out">{userConfig.roi25Year}%</span>
              </div>
              <div className="pt-3 border-t-2 border-[#6700b6]/30">
                <div className="flex justify-between items-center">
                  <span className="text-xl text-[#060F76] font-bold">Net Investment</span>
                  <span className="text-3xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(userConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button - Actually selects this config */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSelectConfig('user'); }}
              className={`w-full mt-4 py-4 rounded-xl font-extrabold text-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                selectedConfig === 'user'
                  ? 'bg-[#68BFFA] text-white'
                  : 'bg-[#060F76] hover:bg-[#0815a9] text-white border-2 border-[#68BFFA]'
              }`}
            >
              {selectedConfig === 'user' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Selected
                </>
              ) : (
                <>
                  Use My Configuration
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
          
          {/* ═══════════════════════════════════════════
              MERLIN'S RECOMMENDATION (Right) - PURPLE Theme
              Click anywhere on card to select
          ═══════════════════════════════════════════ */}
          <div 
            className={`relative rounded-3xl p-10 border-4 transition-all shadow-2xl cursor-pointer ${
              selectedConfig === 'merlin'
                ? 'border-[#ffa600] ring-4 ring-[#ffa600]/40 scale-[1.03] z-10'
                : 'border-[#6700b6] hover:border-[#ffa600] opacity-90'
            }`}
            style={{background: 'linear-gradient(135deg, #6700b6 0%, #ffa600 60%, #ff7c00 100%)'}}
            onClick={() => handleSelectConfig('merlin')}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg ${
                selectedConfig === 'merlin'
                  ? 'bg-[#6700b6] text-white'
                  : 'bg-gradient-to-r from-[#ffa600] to-[#ff8c00] text-white'
              }`}>
                {selectedConfig === 'merlin' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    SELECTED
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    RECOMMENDED
                  </>
                )}
              </span>
            </div>
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <img src={merlinImage} alt="Merlin" className="w-16 h-16 rounded-2xl border-4 border-white shadow-2xl drop-shadow-xl" />
              <div>
                <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">Merlin's Recommendation</h3>
                <p className="text-xl text-white font-bold opacity-90">AI-optimized for your facility</p>
              </div>
            </div>
            
            {/* Equipment Summary */}
            <div className="space-y-3 mb-4 bg-white/50 rounded-xl p-3">
              <div className="flex justify-between items-center py-2 border-b border-[#6700b6]/20">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-[#6700b6]" />
                  <span className="text-[#060F76]">Battery Storage</span>
                </div>
                <span className="font-bold text-[#6700b6] transition-all duration-300 ease-out">
                  {formatPower(merlinConfig.batteryKW)} / {formatEnergy(merlinConfig.batteryKWh)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-[#6700b6]/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#6700b6]" />
                  <span className="text-[#060F76]">Backup Duration</span>
                </div>
                <span className="font-bold text-[#060F76] transition-all duration-300 ease-out">{merlinConfig.durationHours} hours</span>
              </div>
              
              {merlinConfig.solarKW > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-[#6700b6]/20">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-[#ffa600]" />
                    <span className="text-[#060F76]">Solar</span>
                  </div>
                  <span className="font-bold text-[#ffa600] transition-all duration-300 ease-out">{formatPower(merlinConfig.solarKW)}</span>
                </div>
              )}
              
              {merlinConfig.generatorKW > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-[#6700b6]/20">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-[#060F76]" />
                    <span className="text-[#060F76]">Generator</span>
                  </div>
                  <span className="font-bold text-[#060F76]">{formatPower(merlinConfig.generatorKW)}</span>
                </div>
              )}
            </div>
            
            {/* ═══════════════════════════════════════════
                ENHANCED: Detailed Analysis Section
            ═══════════════════════════════════════════ */}
            
            {/* Why This Config - Expanded */}
            <div className="bg-white/60 rounded-xl p-4 mb-4 border border-[#6700b6]/20">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-[#ffa600]" />
                <span className="font-bold text-[#6700b6]">Why Merlin Recommends This</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#6700b6] flex-shrink-0 mt-0.5" />
                  <span className="text-[#060F76]">
                    <strong className="text-[#6700b6]">{wizardState.industryName || 'Your facility'}</strong> typically needs {merlinConfig.durationHours}-hour backup for reliable operations
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#6700b6] flex-shrink-0 mt-0.5" />
                  <span className="text-[#060F76]">
                    <strong className="text-[#6700b6]">{wizardState.state}</strong> electricity at <strong className="text-[#ffa600]">${(wizardState.electricityRate || 0.12).toFixed(2)}/kWh</strong> makes this configuration profitable
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#6700b6] flex-shrink-0 mt-0.5" />
                  <span className="text-[#060F76]">
                    Battery sized at <strong className="text-[#6700b6]">40% of peak demand</strong> for optimal peak shaving
                  </span>
                </li>
                {merlinConfig.solarKW > 0 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#6700b6] flex-shrink-0 mt-0.5" />
                    <span className="text-[#060F76]">
                      Solar sized to <strong className="text-[#ffa600]">maximize self-consumption</strong> and reduce grid dependency
                    </span>
                  </li>
                )}
              </ul>
            </div>
            
            {/* ROI Analysis - HIGH CONTRAST */}
            <div className="bg-gradient-to-br from-[#fffbe9] to-[#fff5d6] rounded-xl p-4 mb-4 border-2 border-[#6700b6]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#6700b6]" />
                <span className="font-black text-lg text-[#6700b6]">Return on Investment</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border-2 border-[#6700b6]/40 shadow-md">
                  <p className="text-xs text-[#6700b6] font-semibold mb-1">10-Year Savings</p>
                  <p className="text-2xl font-black text-[#6700b6]">{formatMoney(merlinConfig.annualSavings * 10)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border-2 border-[#6700b6]/40 shadow-md">
                  <p className="text-xs text-[#6700b6] font-semibold mb-1">25-Year Savings</p>
                  <p className="text-2xl font-black text-[#6700b6]">{formatMoney(merlinConfig.annualSavings * 25)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t-2 border-[#6700b6]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[#6700b6] font-semibold">Monthly Savings</span>
                  <span className="font-black text-xl text-[#ffa600]">{formatMoney(merlinConfig.annualSavings / 12)}/mo</span>
                </div>
              </div>
            </div>
            
            {/* TrueQuote™ Sources */}
            <div className="bg-white/50 rounded-xl p-3 mb-4 border border-[#6700b6]/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#6700b6]" />
                <span className="text-xs font-semibold text-[#6700b6]">TrueQuote™ Pricing Sources</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#060F76]/70">
                  <span className="w-2 h-2 bg-[#6700b6] rounded-full"></span>
                  NREL ATB 2024
                </div>
                <div className="flex items-center gap-1.5 text-[#060F76]/70">
                  <span className="w-2 h-2 bg-[#ffa600] rounded-full"></span>
                  IRA Tax Credits
                </div>
                <div className="flex items-center gap-1.5 text-[#060F76]/70">
                  <span className="w-2 h-2 bg-[#68BFFA] rounded-full"></span>
                  Regional Rates
                </div>
                <div className="flex items-center gap-1.5 text-[#060F76]/70">
                  <span className="w-2 h-2 bg-[#060F76] rounded-full"></span>
                  Industry Benchmarks
                </div>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="bg-white/90 rounded-xl p-5 space-y-4 border-2 border-[#ffa600]/60">
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">Annual Savings</span>
                <span className="text-2xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(merlinConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">Payback Period</span>
                <span className="text-2xl font-black text-[#6700b6] transition-all duration-300 ease-out">{merlinConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-[#060F76] font-semibold">25-Year ROI</span>
                <span className="text-2xl font-black text-[#ffa600] transition-all duration-300 ease-out">{merlinConfig.roi25Year}%</span>
              </div>
              <div className="pt-3 border-t-2 border-[#6700b6]/30">
                <div className="flex justify-between items-center">
                  <span className="text-xl text-[#060F76] font-bold">Net Investment</span>
                  <span className="text-3xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(merlinConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button - Actually selects Merlin's config */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSelectConfig('merlin'); }}
              className={`w-full mt-4 py-4 rounded-xl font-extrabold text-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                selectedConfig === 'merlin'
                  ? 'bg-emerald-600 text-white border-2 border-white'
                  : 'bg-[#060F76] hover:bg-[#0a1a9a] text-white border-2 border-[#6700b6]'
              }`}
            >
              {selectedConfig === 'merlin' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Selected
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Accept Merlin's Recommendation
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Quick Comparison panel removed for clarity and visual hierarchy */}
        
        {/* Hint if no selection */}
        {!selectedConfig && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#ffa600]/20 border-2 border-[#ffa600] rounded-2xl animate-pulse">
              <span className="text-2xl">👆</span>
              <p className="text-xl text-white font-bold">
                Click a card above to select your configuration
              </p>
            </div>
          </div>
        )}
        
        {/* TrueQuote Badge - Exact design match: cream bg, orange shield, brown text */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowTrueQuoteModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#fffbe9] border-2 border-[#6700b6] rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            {/* Orange shield with checkmark */}
            <div className="w-8 h-8 bg-[#ffa600] rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#5c3d00]">TrueQuote™</span>
          </button>
        </div>
      </div>
      
      {/* TrueQuote Modal */}
      <TrueQuoteModal 
        isOpen={showTrueQuoteModal} 
        onClose={() => setShowTrueQuoteModal(false)} 
      />
      {/* Footer Navigation - LARGER CTA BUTTONS with POP */}
      <div className="w-full py-8 px-4 flex items-center justify-between mt-12 bg-gradient-to-r from-[#060F76]/30 to-[#6700b6]/20 rounded-2xl border-2 border-[#6700b6]/40">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-8 py-4 bg-[#060F76] border-2 border-[#6700b6] rounded-xl text-white font-bold text-xl hover:bg-[#0a1a9a] hover:border-[#ffa600] transition-all shadow-lg hover:shadow-xl hover:shadow-[#6700b6]/30"
          >
            <ChevronLeft className="w-6 h-6" />
            Back
          </button>
          <button
            onClick={onHome || onBack}
            className="flex items-center justify-center w-14 h-14 bg-[#060F76] border-2 border-[#6700b6] rounded-xl text-white hover:bg-[#0a1a9a] hover:border-[#ffa600] transition-all shadow-lg"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={handleContinueClick}
          className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#6700b6] to-[#4b00a0] border-4 border-[#ffa600] rounded-2xl text-white font-black text-2xl hover:from-[#7a00d4] hover:to-[#5a00b8] transition-all shadow-2xl hover:shadow-[#ffa600]/40 hover:scale-105 animate-pulse"
          style={{ animationDuration: '2s' }}
        >
          <span>Next Step</span>
          <ArrowRight className="w-8 h-8 text-[#ffa600]" />
        </button>
      </div>
    </div>
  );
}

export default ConfigurationComparison;
