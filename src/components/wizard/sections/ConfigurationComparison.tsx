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
                <div className="bg-white/10 border-2 border-[#68BFFA] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#68BFFA] rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-[#68BFFA]">Your Configuration</h4>
                  </div>
                  <p className="text-white/80 text-sm">
                    Based on your choices in Goals - includes your solar, wind, and generator preferences.
                  </p>
                </div>
                
                {/* Merlin Config explanation */}
                <div className="bg-white/10 border-2 border-[#ad42ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#6700b6] rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-[#ad42ff]">Merlin's Recommendation</h4>
                  </div>
                  <p className="text-white/80 text-sm">
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
        
        {/* Navigation - Back / Home */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-[#060F76] hover:bg-[#0815a9] text-white font-medium rounded-lg transition-colors border-2 border-[#4b59f5]"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={onHome || onBack} // Home navigates to vertical landing page
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg border border-slate-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm">
            <Sparkles className="w-4 h-4" />
            Step 3 of 5
          </span>
        </div>
        
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Your Configuration vs. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Merlin's Recommendation</span>
          </h2>
          <p className="text-gray-400">Select the configuration you want to proceed with</p>
        </div>
        
        {/* ════════════════════════════════════════════════════════════════
            SIDE-BY-SIDE COMPARISON - Light backgrounds for contrast
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* ═══════════════════════════════════════════
              USER'S CONFIGURATION (Left) - BLUE/CYAN Theme
              High contrast with the purple Merlin panel
          ═══════════════════════════════════════════ */}
          <div 
            className={`relative bg-gradient-to-br from-[#68BFFA]/30 to-[#0ea5e9]/20 rounded-3xl p-6 border-2 transition-all shadow-xl ${
              selectedConfig === 'user'
                ? 'border-[#68BFFA] ring-4 ring-[#68BFFA]/40 scale-[1.02]'
                : 'border-[#68BFFA]/60 hover:border-[#68BFFA] cursor-pointer'
            }`}
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
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#68BFFA] to-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg">
                <ThumbsUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#060F76]">Your Configuration</h3>
                <p className="text-sm text-[#68BFFA]">Customize your energy system</p>
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
                <div className="flex justify-between text-xs text-[#060F76]/60 mt-1">
                  <span>{formatPower(recommendations.minBatteryKW)}</span>
                  <span className="text-[#68BFFA] font-medium">Recommended: {formatPower(recommendations.recommendedBatteryKW)}</span>
                  <span>{formatPower(recommendations.maxBatteryKW)}</span>
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
                <div className="flex justify-between text-xs text-[#060F76]/60 mt-1">
                  <span>2 hrs</span>
                  <span className="text-[#68BFFA] font-medium">Recommended: 4 hrs</span>
                  <span>8 hrs</span>
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
                <div className="flex justify-between text-xs text-[#060F76]/60 mt-1">
                  <span>0 kW</span>
                  <span className="text-[#ffa600] font-medium">Optimal: {formatPower(recommendations.recommendedSolarKW)}</span>
                  <span>{formatPower(recommendations.maxSolarKW)}</span>
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
                <div className="flex justify-between text-xs text-[#060F76]/60 mt-1">
                  <span>0 kW</span>
                  <span className="text-[#68BFFA] font-medium">Optional: {formatPower(recommendations.recommendedGeneratorKW)}</span>
                  <span>{formatPower(recommendations.maxGeneratorKW)}</span>
                </div>
              </div>
            </div>
            
            {/* Storage Summary */}
            <div className="bg-[#68BFFA]/15 rounded-xl p-3 mb-4 border border-[#68BFFA]/40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#060F76] font-medium">Total Storage Capacity</span>
                <span className="font-bold text-[#060F76] transition-all duration-300 ease-out">{formatEnergy(userConfig.batteryKWh)}</span>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="bg-white/80 rounded-xl p-4 space-y-3 border border-[#68BFFA]/30">
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">Annual Savings</span>
                <span className="text-xl font-bold text-[#060F76] transition-all duration-300 ease-out">{formatMoney(userConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">Payback Period</span>
                <span className="text-xl font-bold text-[#060F76] transition-all duration-300 ease-out">{userConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">25-Year ROI</span>
                <span className="text-xl font-bold text-[#ffa600] transition-all duration-300 ease-out">{userConfig.roi25Year}%</span>
              </div>
              <div className="pt-2 border-t border-[#68BFFA]/30">
                <div className="flex justify-between items-center">
                  <span className="text-[#060F76] font-semibold">Net Investment</span>
                  <span className="text-2xl font-black text-[#060F76] transition-all duration-300 ease-out">{formatMoney(userConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button - Actually selects this config */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSelectConfig('user'); }}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
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
            className={`relative bg-gradient-to-br from-[#6700b6]/30 to-[#cc89ff]/30 rounded-3xl p-6 border-2 transition-all shadow-xl cursor-pointer ${
              selectedConfig === 'merlin'
                ? 'border-[#6700b6] ring-4 ring-[#6700b6]/40 scale-[1.02]'
                : 'border-[#6700b6]/60 hover:border-[#6700b6]'
            }`}
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
            <div className="flex items-center gap-3 mb-6">
              <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold text-[#6700b6]">Merlin's Recommendation</h3>
                <p className="text-sm text-[#060F76]/70">AI-optimized for your facility</p>
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
            
            {/* ROI Analysis */}
            <div className="bg-[#6700b6]/10 rounded-xl p-4 mb-4 border border-[#6700b6]/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#6700b6]" />
                <span className="font-bold text-[#6700b6]">Return on Investment</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/70 rounded-lg p-3 text-center border border-[#6700b6]/20">
                  <p className="text-xs text-[#060F76]/60 mb-1">10-Year Savings</p>
                  <p className="text-lg font-bold text-[#6700b6]">{formatMoney(merlinConfig.annualSavings * 10)}</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center border border-[#6700b6]/20">
                  <p className="text-xs text-[#060F76]/60 mb-1">25-Year Savings</p>
                  <p className="text-lg font-bold text-[#6700b6]">{formatMoney(merlinConfig.annualSavings * 25)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#6700b6]/20">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#060F76]">Monthly Savings</span>
                  <span className="font-bold text-[#ffa600]">{formatMoney(merlinConfig.annualSavings / 12)}/mo</span>
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
            <div className="bg-white/70 rounded-xl p-4 space-y-3 border border-[#6700b6]/20">
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">Annual Savings</span>
                <span className="text-xl font-bold text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(merlinConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">Payback Period</span>
                <span className="text-xl font-bold text-[#060F76] transition-all duration-300 ease-out">{merlinConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#060F76]/70">25-Year ROI</span>
                <span className="text-xl font-bold text-[#ffa600] transition-all duration-300 ease-out">{merlinConfig.roi25Year}%</span>
              </div>
              <div className="pt-2 border-t border-[#6700b6]/20">
                <div className="flex justify-between items-center">
                  <span className="text-[#060F76] font-semibold">Net Investment</span>
                  <span className="text-2xl font-black text-[#6700b6] transition-all duration-300 ease-out">{formatMoney(merlinConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button - Actually selects Merlin's config */}
            <button
              onClick={(e) => { e.stopPropagation(); handleSelectConfig('merlin'); }}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                selectedConfig === 'merlin'
                  ? 'bg-[#6700b6] text-white'
                  : 'bg-gradient-to-r from-[#ffa600] to-[#ff8c00] hover:from-[#ffb733] hover:to-[#ffa600] text-white border-2 border-[#6700b6]'
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
        
        {/* Comparison Summary - Light background */}
        {userConfig.batteryKW > 0 && merlinConfig.batteryKW > 0 && (
          <div className="bg-white/80 rounded-2xl p-5 border border-[#6700b6]/30 shadow-lg">
            <h4 className="font-bold text-[#6700b6] mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#6700b6]" />
              Quick Comparison
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-[#060F76]/60 mb-1">Battery Size</p>
                <p className="text-lg font-bold text-[#060F76]">
                  {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).diff > 0 && (
                    <span className={getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).isHigher ? 'text-[#ffa600]' : 'text-[#68BFFA]'}>
                      {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).isHigher ? '+' : '-'}
                      {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#060F76]/60 mb-1">Annual Savings</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).diff > 0 && (
                    <span className={getComparison(userConfig.annualSavings, merlinConfig.annualSavings).isHigher ? 'text-[#6700b6]' : 'text-[#ffa600]'}>
                      {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).isHigher ? '+' : '-'}
                      {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#060F76]/60 mb-1">Payback</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).diff > 0 && (
                    <span className={!getComparison(userConfig.paybackYears, merlinConfig.paybackYears).isHigher ? 'text-[#6700b6]' : 'text-[#ffa600]'}>
                      {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).isHigher ? '+' : '-'}
                      {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#060F76]/60 mb-1">Investment</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.netCost, merlinConfig.netCost).diff > 0 && (
                    <span className={!getComparison(userConfig.netCost, merlinConfig.netCost).isHigher ? 'text-[#6700b6]' : 'text-[#ffa600]'}>
                      {getComparison(userConfig.netCost, merlinConfig.netCost).isHigher ? '+' : '-'}
                      {getComparison(userConfig.netCost, merlinConfig.netCost).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Continue Button - Only way to advance */}
        {selectedConfig && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinueClick}
              className="group px-8 py-4 bg-gradient-to-r from-[#6700b6] to-[#060F76] hover:from-[#7a00d9] hover:to-[#0b1fa8] text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-[#6700b6]/25 flex items-center gap-3"
            >
              Continue to Scenario Planner
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
        
        {/* Hint if no selection */}
        {!selectedConfig && (
          <div className="mt-8 text-center">
            <p className="text-[#060F76]/60 text-sm animate-pulse">
              ☝️ Select a configuration above to continue
            </p>
          </div>
        )}
        
        {/* TrueQuote Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6700b6]/10 border border-[#6700b6]/30 rounded-full">
            <Shield className="w-4 h-4 text-[#6700b6]" />
            <span className="text-sm text-[#6700b6]">TrueQuote™ - All estimates traceable to authoritative sources</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationComparison;
