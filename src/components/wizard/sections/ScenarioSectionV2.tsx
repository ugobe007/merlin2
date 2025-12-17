/**
 * SCENARIO SECTION V2 (Section 4) - TWO-COLUMN COMPARISON
 * =========================================================
 * 
 * NEW DESIGN: Two-column layout comparing:
 * - LEFT: Merlin's AI-Optimized Recommendation (read-only)
 * - RIGHT: User's Custom Configuration (editable sliders)
 * 
 * This lets users see exactly what Merlin recommends while making
 * their own adjustments side-by-side.
 * 
 * Created: Dec 15, 2025 - Two-column redesign
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, Sparkles, Info, Battery, Sun, Zap, 
  DollarSign, Clock, Shield, CheckCircle, Settings, ChevronRight, 
  Building, Wand2, User, Lock, Unlock, RefreshCw, TrendingUp
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { ScenarioConfig, ScenarioGeneratorResult } from '@/services/scenarioGenerator';
import { ScenarioExplainerModal } from '../modals/ScenarioExplainerModal';

interface ScenarioSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  scenarioResult: ScenarioGeneratorResult | null;
  isGenerating: boolean;
  onGenerateScenarios: () => Promise<void>;
  /** Peak demand from centralized calculations */
  peakDemandKW: number;
  /** Power coverage percentage */
  powerCoverage: number;
  /** Navigate to Advanced Quote Builder for pro users */
  onOpenAdvanced?: () => void;
}

export function ScenarioSectionV2({
  wizardState,
  setWizardState,
  currentSection,
  sectionRef,
  onBack,
  onContinue,
  scenarioResult,
  isGenerating,
  onGenerateScenarios,
  peakDemandKW,
  powerCoverage,
  onOpenAdvanced,
}: ScenarioSectionProps) {
  // NOTE: Dec 16, 2025 - ScenarioExplainerModal removed from auto-show
  // The AcceptCustomizeModal now appears BEFORE Section 4 (in StreamlinedWizard)
  // Users can still click "How does this work?" to see the explainer
  // We no longer auto-show explainer since AcceptCustomizeModal covers the choice
  const [showExplainer, setShowExplainer] = useState(false);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(true); // Default to true - don't auto-show
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  
  // User's custom configuration (separate from Merlin's recommendation)
  const [userBatteryKW, setUserBatteryKW] = useState(wizardState.batteryKW || 0);
  const [userDurationHours, setUserDurationHours] = useState(wizardState.durationHours || 4);
  const [userSolarKW, setUserSolarKW] = useState(wizardState.solarKW || 0);
  
  // Track if scenarios have been generated for this session
  const scenariosGeneratedRef = useRef(false);

  // Dec 16, 2025: ScenarioSectionV2 is now Section 5 (after Magic Fit)
  // It only renders when currentSection matches what's passed from parent
  const SECTION_NUMBER = 5; // This component is Section 5 in the wizard flow
  
  // Show explainer on first visit (disabled - AcceptCustomizeModal already explained)
  useEffect(() => {
    if (currentSection === SECTION_NUMBER && !hasSeenExplainer) {
      // Don't auto-show explainer - AcceptCustomizeModal already explained
      // setShowExplainer(true);
    }
  }, [currentSection, hasSeenExplainer]);

  // Auto-generate scenarios when entering section (ONCE per session)
  // Note: Scenarios should already be generated from Magic Fit (Section 4)
  useEffect(() => {
    if (currentSection === SECTION_NUMBER && !scenarioResult && !isGenerating && !scenariosGeneratedRef.current) {
      scenariosGeneratedRef.current = true;
      onGenerateScenarios();
    }
  }, [currentSection, scenarioResult, isGenerating, onGenerateScenarios]);
  
  // Reset the ref when leaving section
  useEffect(() => {
    if (currentSection !== SECTION_NUMBER) {
      scenariosGeneratedRef.current = false;
    }
  }, [currentSection]);

  // Sync user config with Merlin's recommendation initially
  useEffect(() => {
    if (scenarioResult && !useCustomConfig) {
      const recommended = scenarioResult.scenarios[scenarioResult.recommendedIndex];
      setUserBatteryKW(recommended.batteryKW);
      setUserDurationHours(recommended.durationHours);
      setUserSolarKW(recommended.solarKW);
    }
  }, [scenarioResult, useCustomConfig]);

  const handleExplainerContinue = () => {
    setShowExplainer(false);
    setHasSeenExplainer(true);
  };

  const handleAcceptMerlin = () => {
    if (!scenarioResult) return;
    const recommended = scenarioResult.scenarios[scenarioResult.recommendedIndex];
    
    setWizardState(prev => ({
      ...prev,
      selectedScenario: recommended,
      batteryKW: recommended.batteryKW,
      batteryKWh: recommended.batteryKWh,
      durationHours: recommended.durationHours,
      solarKW: recommended.solarKW,
      generatorKW: recommended.generatorKW,
    }));
    
    onContinue();
  };

  const handleAcceptCustom = () => {
    const batteryKWh = userBatteryKW * userDurationHours;
    
    setWizardState(prev => ({
      ...prev,
      selectedScenario: null, // Custom config, not a preset scenario
      batteryKW: userBatteryKW,
      batteryKWh: batteryKWh,
      durationHours: userDurationHours,
      solarKW: userSolarKW,
      generatorKW: prev.generatorKW,
    }));
    
    onContinue();
  };

  const handleResetToMerlin = () => {
    if (!scenarioResult) return;
    const recommended = scenarioResult.scenarios[scenarioResult.recommendedIndex];
    setUserBatteryKW(recommended.batteryKW);
    setUserDurationHours(recommended.durationHours);
    setUserSolarKW(recommended.solarKW);
    setUseCustomConfig(false);
  };

  // Format helpers
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
    return `$${Math.round(amt).toLocaleString()}`;
  };
  const formatPower = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatEnergy = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;

  // Calculate estimated costs for user config (rough estimate)
  const estimateUserCost = () => {
    const batteryCost = userBatteryKW * userDurationHours * 150; // $150/kWh estimate
    const solarCost = userSolarKW * 850; // $0.85/W estimate
    const totalCost = batteryCost + solarCost;
    const netCost = totalCost * 0.7; // 30% ITC
    return { totalCost, netCost };
  };

  const userCosts = estimateUserCost();

  if (currentSection !== SECTION_NUMBER) return null;

  const recommended = scenarioResult?.scenarios[scenarioResult.recommendedIndex];

  return (
    <>
      {/* Explainer Modal */}
      <ScenarioExplainerModal
        isOpen={showExplainer}
        onClose={() => { setShowExplainer(false); setHasSeenExplainer(true); }}
        onContinue={handleExplainerContinue}
      />

      <div ref={sectionRef} className="min-h-[calc(100vh-120px)] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Preferences
            </button>
            <button
              onClick={() => setShowExplainer(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              How does this work?
            </button>
          </div>

          {/* Section Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Step 4 of 5 • Fine-tune</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Compare & Choose
            </h2>
            <p className="text-gray-400">
              Accept Merlin's optimized recommendation or customize your own configuration
            </p>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
              <p className="text-lg text-white font-medium">Analyzing your facility...</p>
              <p className="text-sm text-gray-400 mt-1">Generating optimized configuration</p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TWO-COLUMN COMPARISON LAYOUT
          ════════════════════════════════════════════════════════════════ */}
          {scenarioResult && !isGenerating && recommended && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ═══════════════════════════════════════════════════════════
                  LEFT COLUMN: MERLIN'S RECOMMENDATION (Read-Only)
              ═══════════════════════════════════════════════════════════ */}
              <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/30 rounded-2xl border-2 border-blue-500/50 p-6 relative">
                {/* Header Badge */}
                <div className="absolute -top-3 left-6">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Wand2 className="w-3.5 h-3.5" />
                    MERLIN'S PICK
                  </span>
                </div>

                {/* Lock Icon */}
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center" title="AI-Optimized (Read-Only)">
                    <Lock className="w-4 h-4 text-blue-400" />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-white mb-1">AI-Optimized Configuration</h3>
                  <p className="text-sm text-blue-200/70 mb-6">
                    Balanced for maximum ROI based on your {wizardState.industryName || 'facility'}
                  </p>

                  {/* Equipment Specs */}
                  <div className="space-y-4 mb-6">
                    {/* Battery */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Battery className="w-5 h-5 text-blue-400" />
                          <span className="text-gray-300 font-medium">Battery Storage</span>
                        </div>
                        <span className="text-white font-bold">{formatPower(recommended.batteryKW)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Capacity</span>
                        <span className="text-gray-300">{formatEnergy(recommended.batteryKWh)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration</span>
                        <span className="text-gray-300">{recommended.durationHours} hours</span>
                      </div>
                    </div>

                    {/* Solar */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5 text-amber-400" />
                          <span className="text-gray-300 font-medium">Solar Array</span>
                        </div>
                        <span className="text-white font-bold">
                          {recommended.solarKW > 0 ? formatPower(recommended.solarKW) : 'Not Included'}
                        </span>
                      </div>
                      {recommended.solarKW > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Annual Generation</span>
                          <span className="text-gray-300">~{Math.round(recommended.solarKW * 1.5 * 365 / 1000)} MWh</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30 mb-6">
                    <h4 className="text-sm font-semibold text-blue-300 mb-3">Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Net Investment</p>
                        <p className="text-2xl font-bold text-white">{formatMoney(recommended.netCost)}</p>
                        <p className="text-xs text-gray-500">after 30% ITC</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Annual Savings</p>
                        <p className="text-2xl font-bold text-emerald-400">{formatMoney(recommended.annualSavings)}</p>
                        <p className="text-xs text-gray-500">estimated</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-500/20 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">{recommended.paybackYears.toFixed(1)} years</p>
                          <p className="text-xs text-gray-500">Payback Period</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">{Math.round(recommended.roi25Year)}%</p>
                          <p className="text-xs text-gray-500">25-Year ROI</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <button
                    onClick={handleAcceptMerlin}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accept Merlin's Recommendation
                  </button>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  RIGHT COLUMN: USER'S CONFIGURATION (Editable)
              ═══════════════════════════════════════════════════════════ */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 rounded-2xl border-2 border-slate-600 p-6 relative">
                {/* Header Badge */}
                <div className="absolute -top-3 left-6">
                  <span className="bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    YOUR CONFIG
                  </span>
                </div>

                {/* Unlock Icon */}
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-slate-600/50 rounded-full flex items-center justify-center" title="Customize Your Values">
                    <Unlock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-white mb-1">Custom Configuration</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Adjust the sliders to customize your system
                  </p>

                  {/* Editable Equipment Specs */}
                  <div className="space-y-4 mb-6">
                    {/* Battery Power Slider */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Battery className="w-5 h-5 text-purple-400" />
                          <span className="text-gray-300 font-medium">Battery Power</span>
                        </div>
                        <span className="text-white font-bold">{formatPower(userBatteryKW)}</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={Math.max(2000, recommended.batteryKW * 2)}
                        step={10}
                        value={userBatteryKW}
                        onChange={(e) => {
                          setUserBatteryKW(Number(e.target.value));
                          setUseCustomConfig(true);
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50 kW</span>
                        <span>{formatPower(Math.max(2000, recommended.batteryKW * 2))}</span>
                      </div>
                    </div>

                    {/* Duration Slider */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-400" />
                          <span className="text-gray-300 font-medium">Duration</span>
                        </div>
                        <span className="text-white font-bold">{userDurationHours} hours</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={8}
                        step={1}
                        value={userDurationHours}
                        onChange={(e) => {
                          setUserDurationHours(Number(e.target.value));
                          setUseCustomConfig(true);
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>2 hr</span>
                        <span>8 hr</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Capacity: {formatEnergy(userBatteryKW * userDurationHours)}
                      </p>
                    </div>

                    {/* Solar Slider */}
                    <div className="bg-slate-900/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5 text-amber-400" />
                          <span className="text-gray-300 font-medium">Solar Array</span>
                        </div>
                        <span className="text-white font-bold">
                          {userSolarKW > 0 ? formatPower(userSolarKW) : 'None'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(1000, recommended.solarKW * 2)}
                        step={10}
                        value={userSolarKW}
                        onChange={(e) => {
                          setUserSolarKW(Number(e.target.value));
                          setUseCustomConfig(true);
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0 kW</span>
                        <span>{formatPower(Math.max(1000, recommended.solarKW * 2))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reset Button */}
                  {useCustomConfig && (
                    <button
                      onClick={handleResetToMerlin}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 mb-4 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset to Merlin's Values
                    </button>
                  )}

                  {/* Estimated Financial Summary */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600 mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Estimated Financials</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Est. Net Cost</p>
                        <p className="text-2xl font-bold text-white">{formatMoney(userCosts.netCost)}</p>
                        <p className="text-xs text-gray-500">after 30% ITC</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">vs. Merlin's</p>
                        <p className={`text-lg font-bold ${userCosts.netCost > recommended.netCost ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {userCosts.netCost > recommended.netCost ? '+' : ''}{formatMoney(userCosts.netCost - recommended.netCost)}
                        </p>
                        <p className="text-xs text-gray-500">difference</p>
                      </div>
                    </div>
                  </div>

                  {/* Accept Custom Button */}
                  <button
                    onClick={handleAcceptCustom}
                    className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-500"
                  >
                    <Settings className="w-5 h-5" />
                    Use My Custom Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {scenarioResult && !isGenerating && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Not sure? We recommend accepting Merlin's optimized configuration for best results.
            </p>
          )}
          
          {/* Pro Mode Escape Hatch */}
          {onOpenAdvanced && scenarioResult && !isGenerating && (
            <div className="mt-8 pt-6 border-t border-slate-700">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Need even more control? Advanced mode lets you configure every detail.
                </p>
                <button
                  onClick={onOpenAdvanced}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg font-medium transition-colors border border-slate-600"
                >
                  <Settings className="w-4 h-4" />
                  Switch to Advanced Mode
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ScenarioSectionV2;
