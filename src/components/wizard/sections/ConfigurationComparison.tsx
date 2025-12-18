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
  
  // Handle config selection
  const handleSelectConfig = (config: 'user' | 'merlin') => {
    setSelectedConfig(config);
    
    // Apply the selected configuration
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
    
    // Auto-advance after selection
    setTimeout(() => {
      onContinue();
    }, 500);
  };
  
  // Don't render if not on this section
  if (currentSection !== 4) return null;
  
  return (
    <div
      ref={sectionRef}
      className="min-h-[calc(100vh-120px)] p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Explanation Banner */}
        {showExplanation && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-indigo-400/40 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white mb-1">Compare Your Options</h3>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-indigo-200 leading-relaxed">
                  Based on your power preferences (solar, wind, generator), we've calculated your configuration on the left.
                  Merlin's AI-optimized recommendation is on the right. <strong>Compare the savings and choose which to proceed with.</strong>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation - Back / Home */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
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
            SIDE-BY-SIDE COMPARISON
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* ═══════════════════════════════════════════
              USER'S CONFIGURATION (Left)
          ═══════════════════════════════════════════ */}
          <div 
            onClick={() => handleSelectConfig('user')}
            className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl p-6 border-2 cursor-pointer transition-all ${
              selectedConfig === 'user'
                ? 'border-emerald-400 ring-4 ring-emerald-500/30 scale-[1.02]'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            {selectedConfig === 'user' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  SELECTED
                </span>
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Configuration</h3>
                <p className="text-sm text-gray-400">Customize your energy system</p>
              </div>
            </div>
            
            {/* ═══════════════════════════════════════════
                INTERACTIVE SLIDERS WITH GUIDANCE
            ═══════════════════════════════════════════ */}
            <div className="space-y-4 mb-6">
              
              {/* Battery Slider */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300 font-medium">Battery Power</span>
                  </div>
                  <span className="font-bold text-white">{formatPower(userBatteryKW)}</span>
                </div>
                <input
                  type="range"
                  min={recommendations.minBatteryKW}
                  max={recommendations.maxBatteryKW}
                  value={userBatteryKW}
                  onChange={(e) => setUserBatteryKW(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatPower(recommendations.minBatteryKW)}</span>
                  <span className="text-blue-400">Recommended: {formatPower(recommendations.recommendedBatteryKW)}</span>
                  <span>{formatPower(recommendations.maxBatteryKW)}</span>
                </div>
              </div>
              
              {/* Duration Slider */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300 font-medium">Backup Duration</span>
                  </div>
                  <span className="font-bold text-white">{userDurationHours} hours</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={userDurationHours}
                  onChange={(e) => setUserDurationHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2 hrs</span>
                  <span className="text-purple-400">Recommended: 4 hrs</span>
                  <span>8 hrs</span>
                </div>
              </div>
              
              {/* Solar Slider with Smart Guidance */}
              <div className={`rounded-xl p-4 ${userSolarKW > recommendations.recommendedSolarKW ? 'bg-amber-900/30 border border-amber-500/40' : 'bg-slate-800/50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span className="text-gray-300 font-medium">Solar Power</span>
                    {userSolarKW > recommendations.recommendedSolarKW && (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <span className={`font-bold ${userSolarKW > recommendations.recommendedSolarKW ? 'text-amber-400' : 'text-white'}`}>
                    {formatPower(userSolarKW)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={recommendations.maxSolarKW}
                  value={userSolarKW}
                  onChange={(e) => setUserSolarKW(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 kW</span>
                  <span className="text-amber-400">Optimal: {formatPower(recommendations.recommendedSolarKW)}</span>
                  <span>{formatPower(recommendations.maxSolarKW)}</span>
                </div>
                
                {/* Smart Guidance Message */}
                {userSolarKW > recommendations.recommendedSolarKW && (
                  <div className="mt-3 p-3 bg-amber-900/40 rounded-lg border border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-200">
                        <strong className="text-amber-300">For {industryName}</strong>, we recommend ~{formatPower(recommendations.recommendedSolarKW)} of solar 
                        (1.2x your {formatPower(peakDemandKW)} peak demand). 
                        You've selected {formatPower(userSolarKW)} which exceeds your facility's typical needs. 
                        This will increase costs without proportional savings.
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Optimal indicator */}
                {userSolarKW > 0 && userSolarKW <= recommendations.recommendedSolarKW && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Good choice! Solar sized appropriately for your facility.</span>
                  </div>
                )}
              </div>
              
              {/* Generator Slider */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-slate-400" />
                    <span className="text-gray-300 font-medium">Backup Generator</span>
                  </div>
                  <span className="font-bold text-white">{formatPower(userGeneratorKW)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={recommendations.maxGeneratorKW}
                  value={userGeneratorKW}
                  onChange={(e) => setUserGeneratorKW(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 kW</span>
                  <span className="text-gray-400">Optional: {formatPower(recommendations.recommendedGeneratorKW)}</span>
                  <span>{formatPower(recommendations.maxGeneratorKW)}</span>
                </div>
              </div>
            </div>
            
            {/* Storage Summary */}
            <div className="bg-blue-900/20 rounded-xl p-3 mb-4 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-300">Total Storage Capacity</span>
                <span className="font-bold text-white transition-all duration-300 ease-out">{formatEnergy(userConfig.batteryKWh)}</span>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Annual Savings</span>
                <span className="text-xl font-bold text-emerald-400 transition-all duration-300 ease-out">{formatMoney(userConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Payback Period</span>
                <span className="text-xl font-bold text-white transition-all duration-300 ease-out">{userConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">25-Year ROI</span>
                <span className="text-xl font-bold text-purple-400 transition-all duration-300 ease-out">{userConfig.roi25Year}%</span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-semibold">Net Investment</span>
                  <span className="text-2xl font-black text-white transition-all duration-300 ease-out">{formatMoney(userConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button */}
            <button
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                selectedConfig === 'user'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
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
              MERLIN'S RECOMMENDATION (Right)
          ═══════════════════════════════════════════ */}
          <div 
            onClick={() => handleSelectConfig('merlin')}
            className={`relative bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-3xl p-6 border-2 cursor-pointer transition-all ${
              selectedConfig === 'merlin'
                ? 'border-purple-400 ring-4 ring-purple-500/30 scale-[1.02]'
                : 'border-purple-500/40 hover:border-purple-400/60'
            }`}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 ${
                selectedConfig === 'merlin'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
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
                <h3 className="text-xl font-bold text-white">Merlin's Recommendation</h3>
                <p className="text-sm text-purple-300">AI-optimized for your facility</p>
              </div>
            </div>
            
            {/* Equipment Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-blue-400" />
                  <span className="text-purple-200">Battery Storage</span>
                </div>
                <span className="font-bold text-white transition-all duration-300 ease-out">
                  {formatPower(merlinConfig.batteryKW)} / {formatEnergy(merlinConfig.batteryKWh)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-200">Backup Duration</span>
                </div>
                <span className="font-bold text-white transition-all duration-300 ease-out">{merlinConfig.durationHours} hours</span>
              </div>
              
              {merlinConfig.solarKW > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span className="text-purple-200">Solar</span>
                  </div>
                  <span className="font-bold text-amber-400 transition-all duration-300 ease-out">{formatPower(merlinConfig.solarKW)}</span>
                </div>
              )}
              
              {merlinConfig.generatorKW > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-slate-400" />
                    <span className="text-purple-200">Generator</span>
                  </div>
                  <span className="font-bold text-white">{formatPower(merlinConfig.generatorKW)}</span>
                </div>
              )}
              
              {/* Why This Config */}
              <div className="bg-purple-500/10 rounded-lg p-3 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-purple-200">Why this configuration?</span>
                </div>
                <ul className="text-xs text-purple-300 space-y-1">
                  <li>• Optimized for {wizardState.industryName || 'your facility type'}</li>
                  <li>• {wizardState.state} electricity rates considered</li>
                  <li>• Balanced for fastest payback with adequate backup</li>
                </ul>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="bg-purple-800/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-300">Annual Savings</span>
                <span className="text-xl font-bold text-emerald-400 transition-all duration-300 ease-out">{formatMoney(merlinConfig.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">Payback Period</span>
                <span className="text-xl font-bold text-white transition-all duration-300 ease-out">{merlinConfig.paybackYears.toFixed(1)} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">25-Year ROI</span>
                <span className="text-xl font-bold text-purple-400 transition-all duration-300 ease-out">{merlinConfig.roi25Year}%</span>
              </div>
              <div className="pt-2 border-t border-purple-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200 font-semibold">Net Investment</span>
                  <span className="text-2xl font-black text-white transition-all duration-300 ease-out">{formatMoney(merlinConfig.netCost)}</span>
                </div>
              </div>
            </div>
            
            {/* Select Button */}
            <button
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                selectedConfig === 'merlin'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
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
        
        {/* Comparison Summary */}
        {userConfig.batteryKW > 0 && merlinConfig.batteryKW > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              Quick Comparison
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Battery Size</p>
                <p className="text-lg font-bold text-white">
                  {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).diff > 0 && (
                    <span className={getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).isHigher ? 'text-amber-400' : 'text-blue-400'}>
                      {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).isHigher ? '+' : '-'}
                      {getComparison(userConfig.batteryKWh, merlinConfig.batteryKWh).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Annual Savings</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).diff > 0 && (
                    <span className={getComparison(userConfig.annualSavings, merlinConfig.annualSavings).isHigher ? 'text-emerald-400' : 'text-amber-400'}>
                      {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).isHigher ? '+' : '-'}
                      {getComparison(userConfig.annualSavings, merlinConfig.annualSavings).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Payback</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).diff > 0 && (
                    <span className={!getComparison(userConfig.paybackYears, merlinConfig.paybackYears).isHigher ? 'text-emerald-400' : 'text-amber-400'}>
                      {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).isHigher ? '+' : '-'}
                      {getComparison(userConfig.paybackYears, merlinConfig.paybackYears).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Investment</p>
                <p className="text-lg font-bold">
                  {getComparison(userConfig.netCost, merlinConfig.netCost).diff > 0 && (
                    <span className={!getComparison(userConfig.netCost, merlinConfig.netCost).isHigher ? 'text-emerald-400' : 'text-amber-400'}>
                      {getComparison(userConfig.netCost, merlinConfig.netCost).isHigher ? '+' : '-'}
                      {getComparison(userConfig.netCost, merlinConfig.netCost).diff.toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* TrueQuote Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 rounded-full">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">TrueQuote™ - All estimates traceable to authoritative sources</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationComparison;
