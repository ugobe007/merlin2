/**
 * CONFIGURATION SECTION (Section 4)
 * ==================================
 * 
 * System configuration with real-time cost calculation.
 * Includes battery, solar, wind, generator, and EV charger settings.
 * Shows Merlin's recommendation vs user's selection comparison.
 * 
 * Extracted from StreamlinedWizard.tsx during December 2025 refactor.
 * 
 * NEW: MerlinWizardModal integration for step-by-step guided configuration.
 */

import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Sparkles, Battery, Sun, Wind, Fuel, Car,
  Settings, Clock, Zap, CheckCircle, AlertTriangle, TrendingDown, Info, X, Shield, Wand2
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import PowerGapIndicator from '../indicators/PowerGapIndicator';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
// MerlinWizardModal removed - file no longer exists
import merlinImage from '@/assets/images/new_Merlin.png';

interface ConfigurationSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  centralizedState: any; // From useWizardState hook
  onBack: () => void;
  onGenerateQuote: () => Promise<void>;
  onShowPowerProfileExplainer: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

export function ConfigurationSection({
  wizardState,
  setWizardState,
  centralizedState,
  onBack,
  onGenerateQuote,
  onShowPowerProfileExplainer,
  sectionRef,
  isHidden = false,
}: ConfigurationSectionProps) {
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  const [showMerlinWizard, setShowMerlinWizard] = useState(false);
  
  // Calculate current peak demand from centralizedState
  const peakDemandKW = centralizedState?.calculated?.totalPeakDemandKW || wizardState.batteryKW * 1.5 || 500;
  
  // Build recommendation object for MerlinWizardModal
  const merlinRecommendation = {
    batteryKW: centralizedState?.calculated?.recommendedBatteryKW || wizardState.batteryKW || 250,
    batteryKWh: centralizedState?.calculated?.recommendedBatteryKWh || wizardState.batteryKWh || 1000,
    solarKW: centralizedState?.calculated?.recommendedSolarKW || wizardState.solarKW || 0,
    windKW: wizardState.windTurbineKW || 0,
    generatorKW: wizardState.generatorKW || 0,
    evChargersL2: wizardState.evChargersL2 || 0,
    evChargersDCFC: wizardState.evChargersDCFC || 0,
    bessRatio: 0.4, // Default BESS-to-peak ratio
    backupHours: centralizedState?.calculated?.recommendedBackupHours || wizardState.durationHours || 4,
    peakDemandKW: peakDemandKW,
    rationale: [
      wizardState.selectedIndustry ? `Optimized for ${wizardState.industryName || wizardState.selectedIndustry}` : 'General commercial sizing',
      `${wizardState.state || 'US'} electricity rates considered`,
      wizardState.gridConnection === 'unreliable' ? 'Extended backup for unreliable grid' : 'Standard grid-tied configuration',
    ],
  };
  
  // Calculate power coverage
  const totalConfigured = wizardState.batteryKW + wizardState.solarKW + wizardState.generatorKW;
  const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfigured / peakDemandKW) * 100) : 0;
  
  // Handle configuration changes from MerlinWizardModal
  const handleMerlinConfig = (config: Partial<WizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...config,
    }));
    setShowMerlinWizard(false);
  };
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-120px)] p-8 ${isHidden ? 'hidden' : ''}`}
    >
      {/* Background gradient orbs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-6xl mx-auto relative">
        {/* Section Navigation */}
        <SectionHeader onBack={onBack} />
        
        {/* INSTRUCTIONAL PANEL */}
        <div className="mb-6 p-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400 rounded-2xl backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <span>👋</span> Let's Configure Your Energy System
              </h3>
              <p className="text-lg text-indigo-100 mb-3 leading-relaxed">
                Merlin has calculated your power needs and recommended the optimal system size below. 
                You can accept Merlin's recommendation or adjust any component to customize your system.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <span className="text-white font-semibold">Review the configuration</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-2xl">⚡</span>
                  <span className="text-white font-semibold">Adjust power sources if needed</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="text-2xl">💰</span>
                  <span className="text-white font-semibold">Click "Generate Quote" when ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Title with TrueQuote Badge */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-5 py-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 text-sm">AI-Optimized Recommendation</span>
            </div>
            <button
              onClick={() => setShowTrueQuoteModal(true)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full px-4 py-2 hover:from-emerald-200 hover:to-teal-200 transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 text-sm font-medium">TrueQuote™</span>
              <Info className="w-3 h-3 text-emerald-500" />
            </button>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">System</span> Configuration
          </h2>
          <p className="text-gray-300 mb-4">Adjust if needed, or continue with our recommendation</p>
          
          {/* Merlin Energy Wizard Button */}
          <button
            onClick={() => setShowMerlinWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-pulse hover:animate-none"
          >
            <Wand2 className="w-5 h-5" />
            <span>Merlin Energy Wizard</span>
            <Sparkles className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-400 mt-2">Let Merlin guide you step-by-step through optimal configuration</p>
        </div>
        
        {/* Real-time Cost Summary - Enhanced with glassmorphism */}
        <CostSummaryBar wizardState={wizardState} />
        
        {/* Review & Customize Panel - MOVED UP */}
        <ReviewCustomizePanel 
          wizardState={wizardState}
          setWizardState={setWizardState}
          centralizedState={centralizedState}
          onShowPowerProfileExplainer={onShowPowerProfileExplainer}
        />
        
        {/* Utility Impact Comparison */}
        <UtilityImpactComparison wizardState={wizardState} />
        
        {/* Generate Quote Button */}
        <GenerateQuoteButton 
          isCalculating={wizardState.isCalculating}
          onClick={onGenerateQuote}
        />
      </div>
      
      {/* TrueQuote Calculation Explainer Modal */}
      {showTrueQuoteModal && (
        <TrueQuoteExplainerModal 
          wizardState={wizardState}
          centralizedState={centralizedState}
          onClose={() => setShowTrueQuoteModal(false)}
        />
      )}
      
      {/* Merlin Energy Wizard Modal - DISABLED: MerlinWizardModal component no longer exists
      {showMerlinWizard && (
        <MerlinWizardModal
          isOpen={showMerlinWizard}
          onClose={() => setShowMerlinWizard(false)}
          onComplete={handleMerlinConfig}
          recommendation={merlinRecommendation}
          industryName={wizardState.industryName || wizardState.selectedIndustry || 'your facility'}
          location={wizardState.state || 'US'}
          powerCoverage={powerCoverage}
        />
      )}
      */}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SectionHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </button>
      <div className="text-sm text-gray-400">Step 4 of 5</div>
    </div>
  );
}

function CostSummaryBar({ wizardState }: { wizardState: WizardState }) {
  const totalEVChargers = wizardState.evChargersL1 + wizardState.evChargersL2 + 
                          wizardState.evChargersDCFC + wizardState.evChargersHPC;
  
  // Don't show the cost bar if there's no estimated cost yet
  if (wizardState.estimatedCost.total <= 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-white/95 via-purple-50/95 to-white/95 backdrop-blur-xl rounded-3xl p-6 border-2 border-purple-200/60 mb-8 sticky top-4 z-10 shadow-2xl shadow-purple-500/10">
      {/* Decorative glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/5 via-emerald-500/5 to-purple-500/5 animate-pulse" style={{ animationDuration: '4s' }} />
      
      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="text-center lg:text-left">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <p className="text-purple-600 text-sm font-semibold uppercase tracking-wider">Estimated Project Cost</p>
            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              TrueQuote™
            </span>
          </div>
          <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 drop-shadow-sm">
            ${wizardState.estimatedCost.total >= 1000000 
              ? (wizardState.estimatedCost.total / 1000000).toFixed(2) + 'M' 
              : wizardState.estimatedCost.total.toLocaleString()}
          </p>
        </div>
        
        {/* Configuration Summary Chips - Enhanced */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {wizardState.batteryKWh > 0 && (
            <ConfigChip icon={Battery} value={`${wizardState.batteryKWh.toLocaleString()} kWh`} label="Battery" color="purple" />
          )}
          {wizardState.solarKW > 0 && (
            <ConfigChip icon={Sun} value={`${wizardState.solarKW} kW`} label="Solar" color="amber" />
          )}
          {wizardState.windTurbineKW > 0 && (
            <ConfigChip icon={Wind} value={`${wizardState.windTurbineKW} kW`} label="Wind" color="sky" />
          )}
          {wizardState.generatorKW > 0 && (
            <ConfigChip icon={Fuel} value={`${wizardState.generatorKW} kW`} label="Generator" color="slate" />
          )}
          {totalEVChargers > 0 && (
            <EVChargerChip wizardState={wizardState} />
          )}
        </div>
      </div>
      
      {/* Cost Breakdown Bar */}
      {wizardState.estimatedCost.total > 0 && (
        <CostBreakdownBar wizardState={wizardState} />
      )}
    </div>
  );
}

interface ConfigChipProps {
  icon: React.ElementType;
  value: string;
  label: string;
  color: 'purple' | 'amber' | 'sky' | 'slate' | 'emerald';
}

function ConfigChip({ icon: Icon, value, label, color }: ConfigChipProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    sky: 'bg-sky-100 text-sky-700 border-sky-300',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };
  const labelColors = {
    purple: 'text-purple-500',
    amber: 'text-amber-500',
    sky: 'text-sky-500',
    slate: 'text-slate-500',
    emerald: 'text-emerald-500',
  };
  
  return (
    <div className={`flex items-center gap-2 ${colorClasses[color]} px-3 py-1.5 rounded-full text-sm border`}>
      <Icon className="w-4 h-4" />
      <span className="font-bold">{value}</span>
      <span className={labelColors[color]}>{label}</span>
    </div>
  );
}

function EVChargerChip({ wizardState }: { wizardState: WizardState }) {
  const parts = [];
  if (wizardState.evChargersL1 > 0) parts.push(`${wizardState.evChargersL1} L1`);
  if (wizardState.evChargersL2 > 0) parts.push(`${wizardState.evChargersL2} L2`);
  if (wizardState.evChargersDCFC > 0) parts.push(`${wizardState.evChargersDCFC} L3`);
  if (wizardState.evChargersHPC > 0) parts.push(`${wizardState.evChargersHPC} Ultra`);
  
  return (
    <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm border border-emerald-300">
      <Car className="w-4 h-4" />
      <span className="font-bold">{parts.join(' ')}</span>
      <span className="text-emerald-500">Chargers</span>
    </div>
  );
}

function CostBreakdownBar({ wizardState }: { wizardState: WizardState }) {
  const { estimatedCost } = wizardState;
  const total = estimatedCost.total;
  
  const segments = [
    { cost: estimatedCost.battery, color: 'bg-purple-500', label: 'Battery' },
    { cost: estimatedCost.solar, color: 'bg-amber-500', label: 'Solar' },
    { cost: estimatedCost.wind, color: 'bg-sky-500', label: 'Wind' },
    { cost: estimatedCost.generator, color: 'bg-slate-500', label: 'Generator' },
    { cost: estimatedCost.evChargers, color: 'bg-emerald-500', label: 'EV Chargers' },
    { cost: estimatedCost.installation, color: 'bg-cyan-500', label: 'Installation' },
  ].filter(s => s.cost > 0);
  
  return (
    <div className="mt-4 pt-4 border-t border-purple-200">
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
        {segments.map((seg, i) => (
          <div 
            key={i}
            className={`${seg.color} h-full`} 
            style={{ width: `${(seg.cost / total) * 100}%` }}
            title={`${seg.label}: $${seg.cost.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
        {segments.map((seg, i) => (
          <span key={i}>
            <span className={`w-2 h-2 inline-block rounded-full ${seg.color} mr-1`}></span>
            {seg.label}: ${seg.cost.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

function UtilityImpactComparison({ wizardState }: { wizardState: WizardState }) {
  // Calculate utility impact based on configuration
  const batteryKW = wizardState.batteryKW || 0;
  const solarKW = wizardState.solarKW || 0;
  const electricityRate = wizardState.electricityRate || 0.12;
  const peakDemandKW = batteryKW * 1.5; // Estimate peak demand
  const demandChargeRate = 15; // $/kW average
  
  // Before: Current utility costs
  const monthlyEnergyConsumption = peakDemandKW * 720 * 0.3; // 30% load factor
  const currentEnergyCost = Math.round(monthlyEnergyConsumption * electricityRate);
  const currentDemandCharges = Math.round(peakDemandKW * demandChargeRate);
  const currentMonthlyBill = currentEnergyCost + currentDemandCharges;
  
  // After: With BESS
  const solarOffset = solarKW > 0 ? Math.min(0.4, (solarKW / peakDemandKW) * 0.5) : 0;
  const peakShavingPercent = batteryKW > 0 ? Math.min(0.35, batteryKW / peakDemandKW * 0.3) : 0;
  const projectedEnergyCost = Math.round(currentEnergyCost * (1 - solarOffset));
  const projectedDemandCharges = Math.round(currentDemandCharges * (1 - peakShavingPercent));
  const projectedMonthlyBill = projectedEnergyCost + projectedDemandCharges;
  const monthlySavings = currentMonthlyBill - projectedMonthlyBill;
  
  if (currentMonthlyBill <= 0) return null;
  
  const formatCost = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 10000) return `${Math.round(val / 1000)}K`;
    return val.toLocaleString();
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Before/After Utility Comparison */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-green-500" />
          Utility Impact Comparison
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">Before BESS</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-red-500 truncate">
              ${formatCost(currentMonthlyBill)}
            </div>
            <div className="text-xs text-gray-500">/month</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">After BESS</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-green-500 truncate">
              ${formatCost(projectedMonthlyBill)}
            </div>
            <div className="text-xs text-gray-500">/month</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <div className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
            Save ${formatCost(monthlySavings)}/month
          </div>
          <div className="text-sm text-gray-500">
            ({currentMonthlyBill > 0 ? Math.round((monthlySavings / currentMonthlyBill) * 100) : 0}% reduction • ${(monthlySavings * 12).toLocaleString()}/year)
          </div>
        </div>
      </div>
      
      {/* Why This Configuration */}
      <WhyThisConfiguration wizardState={wizardState} peakShavingPercent={peakShavingPercent} />
    </div>
  );
}

function WhyThisConfiguration({ wizardState, peakShavingPercent }: { wizardState: WizardState; peakShavingPercent: number }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-purple-500" />
        Why This Configuration?
      </h3>
      <ul className="space-y-4">
        {wizardState.solarKW > 0 && wizardState.geoRecommendations && (
          <li className="flex items-start gap-4 text-base">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">Solar recommended:</span>
              <span className="text-gray-700"> {wizardState.state} averages {wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)} sun-hours/day</span>
            </div>
          </li>
        )}
        {wizardState.batteryKW > 0 && (
          <li className="flex items-start gap-4 text-base">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">Battery storage:</span>
              <span className="text-gray-700"> Capture ~{Math.round(peakShavingPercent * 100)}% peak demand savings</span>
            </div>
          </li>
        )}
        {wizardState.electricityRate > 0.12 && (
          <li className="flex items-start gap-4 text-base">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">High utility rates:</span>
              <span className="text-gray-700"> ${wizardState.electricityRate.toFixed(2)}/kWh makes storage valuable</span>
            </div>
          </li>
        )}
        {(wizardState.selectedIndustry === 'data-center' || wizardState.selectedIndustry === 'hospital') && (
          <li className="flex items-start gap-4 text-base">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">Critical facility:</span>
              <span className="text-gray-700"> Extended backup ({wizardState.durationHours}+ hours) recommended</span>
            </div>
          </li>
        )}
        {wizardState.geoRecommendations?.profile.gridReliabilityScore && wizardState.geoRecommendations.profile.gridReliabilityScore < 85 && (
          <li className="flex items-start gap-4 text-base">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800">Grid reliability:</span>
              <span className="text-gray-700"> Score {wizardState.geoRecommendations.profile.gridReliabilityScore}/100 - backup power valuable</span>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

interface ReviewCustomizePanelProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  centralizedState: any;
  onShowPowerProfileExplainer: () => void;
}

function ReviewCustomizePanel({ wizardState, setWizardState, centralizedState, onShowPowerProfileExplainer }: ReviewCustomizePanelProps) {
  const applyRecommendation = () => {
    setWizardState(prev => ({
      ...prev,
      batteryKW: centralizedState.calculated.recommendedBatteryKW || prev.batteryKW,
      durationHours: centralizedState.calculated.recommendedBackupHours || prev.durationHours,
      batteryKWh: (centralizedState.calculated.recommendedBatteryKW || prev.batteryKW) * 
                  (centralizedState.calculated.recommendedBackupHours || prev.durationHours),
      solarKW: wizardState.wantsSolar ? (centralizedState.calculated.recommendedSolarKW || prev.solarKW) : prev.solarKW,
    }));
  };
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-300 mb-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Review & Customize</h3>
            <p className="text-sm text-gray-500">Compare Merlin's recommendation with your selections</p>
          </div>
        </div>
        
        <button
          onClick={applyRecommendation}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Use Merlin's Recommendation
        </button>
      </div>
      
      {/* Recommendation Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Merlin's Recommendation */}
        <MerlinRecommendationPanel wizardState={wizardState} centralizedState={centralizedState} />
        
        {/* Right Column: Your Selection */}
        <UserSelectionPanel wizardState={wizardState} setWizardState={setWizardState} centralizedState={centralizedState} />
      </div>
      
      {/* Grid Status Impact Notice */}
      {wizardState.gridConnection && wizardState.gridConnection !== 'on-grid' && (
        <GridStatusNotice wizardState={wizardState} centralizedState={centralizedState} />
      )}
      
      {/* Power Gap Indicator */}
      {centralizedState.calculated.recommendedBatteryKW > 0 && (
        <div className="mt-6">
          <PowerGapIndicator
            peakDemandKW={centralizedState.calculated.totalPeakDemandKW || centralizedState.calculated.recommendedBatteryKW * 2}
            batteryKW={wizardState.batteryKW}
            solarKW={wizardState.solarKW || 0}
            generatorKW={wizardState.generatorKW || 0}
            gridConnection={wizardState.gridConnection as 'on-grid' | 'off-grid' | 'limited'}
            showDetails={true}
            onConfigureClick={() => {
              // Jump to battery configuration
              const batterySection = document.getElementById('battery-config');
              batterySection?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
}

function MerlinRecommendationPanel({ wizardState, centralizedState }: { wizardState: WizardState; centralizedState: any }) {
  const formatPower = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${kw || 0} kW`;
  const formatEnergy = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${kwh || 0} kWh`;
  
  return (
    <div className="bg-white/80 rounded-2xl p-5 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
        <h4 className="font-bold text-purple-700">Merlin's Recommendation</h4>
      </div>
      
      <div className="space-y-3">
        {/* BESS Recommendation */}
        <div className="flex justify-between items-center py-2 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">Battery Storage</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-purple-700">
              {formatPower(centralizedState.calculated.recommendedBatteryKW)}
            </div>
            <div className="text-xs text-gray-500">
              {formatEnergy(centralizedState.calculated.recommendedBatteryKWh)} storage
            </div>
          </div>
        </div>
        
        {/* Backup Hours */}
        <div className="flex justify-between items-center py-2 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">Backup Duration</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-purple-700">
              {centralizedState.calculated.recommendedBackupHours || 4} hours
            </div>
            <div className="text-xs text-gray-500">
              Based on {wizardState.gridConnection === 'unreliable' ? 'unreliable grid' : 
                       wizardState.gridConnection === 'off-grid' ? 'off-grid setup' :
                       wizardState.gridConnection === 'limited' ? 'limited grid' : 'your grid status'}
            </div>
          </div>
        </div>
        
        {/* Solar (if enabled) */}
        {wizardState.wantsSolar && (
          <div className="flex justify-between items-center py-2 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-gray-600">Solar</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-amber-600">
                {formatPower(centralizedState.calculated.recommendedSolarKW)}
              </div>
              <div className="text-xs text-gray-500">
                {wizardState.geoRecommendations?.profile.avgSolarHoursPerDay.toFixed(1) || 5} sun-hours/day
              </div>
            </div>
          </div>
        )}
        
        {/* Peak Demand Summary */}
        <div className="flex justify-between items-center py-2 bg-purple-50 rounded-lg px-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-medium">Total Peak Demand</span>
          </div>
          <div className="font-bold text-purple-800">
            {formatPower(Math.round(centralizedState.calculated.totalPeakDemandKW || 0))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserSelectionPanel({ wizardState, setWizardState, centralizedState }: { 
  wizardState: WizardState; 
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  centralizedState: any;
}) {
  const formatPower = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${kw} kW`;
  
  return (
    <div className="bg-white/80 rounded-2xl p-5 border border-emerald-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
          <Settings className="w-4 h-4 text-emerald-600" />
        </div>
        <h4 className="font-bold text-emerald-700">Your Selection (Adjustable)</h4>
      </div>
      
      <div className="space-y-4">
        {/* Battery Power Slider */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Battery Power</span>
            <span className="font-bold text-emerald-700">{formatPower(wizardState.batteryKW)}</span>
          </div>
          <input
            type="range"
            min={10}
            max={10000}
            step={10}
            value={wizardState.batteryKW}
            onChange={(e) => {
              const newKW = parseInt(e.target.value);
              setWizardState(prev => ({ 
                ...prev, 
                batteryKW: newKW,
                batteryKWh: newKW * prev.durationHours 
              }));
            }}
            className="w-full accent-emerald-500"
          />
          {wizardState.batteryKW !== centralizedState.calculated.recommendedBatteryKW && (
            <div className="text-xs text-amber-600 mt-1">
              ⚠️ Different from recommendation ({centralizedState.calculated.recommendedBatteryKW} kW)
            </div>
          )}
        </div>
        
        {/* Duration Slider */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Backup Duration</span>
            <span className="font-bold text-emerald-700">{wizardState.durationHours} hours</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={wizardState.durationHours}
            onChange={(e) => {
              const newHours = parseFloat(e.target.value);
              setWizardState(prev => ({ 
                ...prev, 
                durationHours: newHours,
                batteryKWh: prev.batteryKW * newHours 
              }));
            }}
            className="w-full accent-emerald-500"
          />
          {wizardState.durationHours !== centralizedState.calculated.recommendedBackupHours && (
            <div className="text-xs text-amber-600 mt-1">
              ⚠️ Different from recommendation ({centralizedState.calculated.recommendedBackupHours} hrs)
            </div>
          )}
        </div>
        
        {/* Solar Slider (if enabled) */}
        {wizardState.wantsSolar && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Solar Capacity</span>
              <span className="font-bold text-amber-600">{formatPower(wizardState.solarKW)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(10000, wizardState.solarKW * 2)}
              step={10}
              value={wizardState.solarKW}
              onChange={(e) => setWizardState(prev => ({ ...prev, solarKW: parseInt(e.target.value) }))}
              className="w-full accent-amber-500"
            />
          </div>
        )}
        
        {/* EV Charger Summary */}
        {(wizardState.existingEVL1 > 0 || wizardState.existingEVL2 > 0 || wizardState.existingEVL3 > 0 ||
          wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
          <div className="bg-emerald-50 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-emerald-700">EV Chargers</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(wizardState.existingEVL1 > 0 || wizardState.existingEVL2 > 0 || wizardState.existingEVL3 > 0) && (
                <div className="text-gray-600">
                  <span className="font-medium">Existing:</span>{' '}
                  {((wizardState.existingEVL1 || 0) * 1.4 + (wizardState.existingEVL2 || 0) * 11 + (wizardState.existingEVL3 || 0) * 100).toFixed(0)} kW
                </div>
              )}
              {(wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
                <div className="text-gray-600">
                  <span className="font-medium">New:</span>{' '}
                  {(wizardState.evChargersL2 * 11 + wizardState.evChargersDCFC * 100 + wizardState.evChargersHPC * 350)} kW
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GridStatusNotice({ wizardState, centralizedState }: { wizardState: WizardState; centralizedState: any }) {
  const gridConfig = {
    unreliable: { emoji: '⚠️', title: 'Unreliable Grid Detected', msg: `Merlin recommends ${centralizedState.calculated.recommendedBackupHours || 6} hours of backup for reliability.` },
    'off-grid': { emoji: '🏝️', title: 'Off-Grid Configuration', msg: `Off-grid systems need ${centralizedState.calculated.recommendedBackupHours || 8} hours minimum backup.` },
    expensive: { emoji: '💰', title: 'High Electricity Costs', msg: 'Battery storage helps reduce peak demand charges.' },
    limited: { emoji: '📉', title: 'Limited Grid Capacity', msg: 'Battery can help manage grid capacity constraints.' },
  };
  
  const config = gridConfig[wizardState.gridConnection as keyof typeof gridConfig];
  if (!config) return null;
  
  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-xl">{config.emoji}</div>
        <div>
          <div className="font-bold text-amber-800">{config.title}</div>
          <div className="text-sm text-amber-700">{config.msg}</div>
        </div>
      </div>
    </div>
  );
}

function GenerateQuoteButton({ isCalculating, onClick }: { isCalculating: boolean; onClick: () => Promise<void> }) {
  return (
    <div className="sticky bottom-4 z-20 mt-8">
      <button
        onClick={onClick}
        disabled={isCalculating}
        className="w-full py-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98]"
      >
        {isCalculating ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <span>Calculating Your Quote...</span>
          </>
        ) : (
          <>
            <span className="text-2xl">🧙‍♂️</span>
            <span>Generate My Quote</span>
            <ArrowRight className="w-6 h-6" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-purple-300/60 mt-2">Powered by TrueQuote™ — Every number traceable to source</p>
    </div>
  );
}

// TrueQuote Calculation Explainer Modal
function TrueQuoteExplainerModal({ 
  wizardState, 
  centralizedState, 
  onClose 
}: { 
  wizardState: WizardState; 
  centralizedState: any; 
  onClose: () => void;
}) {
  const calc = centralizedState?.calculated || {};
  const geo = wizardState.geoRecommendations;
  
  // Calculate metrics
  const batteryKW = wizardState.batteryKW || calc.recommendedBatteryKW || 0;
  const batteryKWh = wizardState.batteryKWh || calc.recommendedBatteryKWh || 0;
  const solarKW = wizardState.solarKW || 0;
  const generatorKW = wizardState.generatorKW || 0;
  const peakDemandKW = calc.recommendedBatteryKW || calc.totalPeakDemandKW || 0;
  const totalConfiguredKW = batteryKW + solarKW + generatorKW;
  const coveragePercent = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 0;
  const solarHours = geo?.profile?.avgSolarHoursPerDay || 0;
  const sunRating = solarHours > 0 ? Math.min(5, Math.max(1, Math.round(solarHours - 2))) : 0;
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">TrueQuote™ Calculations</h3>
                <p className="text-sm text-gray-500">Every number traceable to authoritative sources</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Calculation Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Power Profile */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-emerald-800">Power Profile</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Energy:</span>
                  <span className="font-bold text-emerald-700">{batteryKWh >= 1000 ? `${(batteryKWh/1000).toFixed(1)} MWh` : `${batteryKWh} kWh`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Power:</span>
                  <span className="font-bold text-emerald-700">{totalConfiguredKW >= 1000 ? `${(totalConfiguredKW/1000).toFixed(1)} MW` : `${totalConfiguredKW} kW`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-bold text-emerald-700">{wizardState.durationHours}hr</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-600">
                <strong>Formula:</strong> Energy = Power × Duration
              </div>
            </div>
            
            {/* Power Gap */}
            <div className={`p-4 rounded-2xl border ${coveragePercent >= 100 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className={`w-5 h-5 ${coveragePercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}`} />
                <h4 className={`font-bold ${coveragePercent >= 100 ? 'text-emerald-800' : 'text-amber-800'}`}>Power Gap Analysis</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Demand:</span>
                  <span className="font-bold">{peakDemandKW >= 1000 ? `${(peakDemandKW/1000).toFixed(1)} MW` : `${peakDemandKW} kW`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Configured:</span>
                  <span className="font-bold">{totalConfiguredKW >= 1000 ? `${(totalConfiguredKW/1000).toFixed(1)} MW` : `${totalConfiguredKW} kW`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage:</span>
                  <span className={`font-bold ${coveragePercent >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>{Math.min(coveragePercent, 200)}%{coveragePercent > 200 ? '+' : ''}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-80">
                <strong>Formula:</strong> Coverage = Configured ÷ Peak Demand × 100
              </div>
            </div>
            
            {/* Solar Opportunity */}
            {solarHours > 0 && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-amber-800">Solar Opportunity</h4>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className={`text-2xl ${i <= sunRating ? '' : 'opacity-30'}`}>☀️</span>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Sun Hours:</span>
                    <span className="font-bold text-amber-700">{solarHours.toFixed(1)} hrs/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-bold text-amber-700">{sunRating}/5 {['', 'Limited', 'Fair', 'Good', 'Excellent', 'Exceptional'][sunRating]}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-600">
                  <strong>Source:</strong> NREL Solar Resource Data
                </div>
              </div>
            )}
            
            {/* Energy Opportunities */}
            {geo && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔥</span>
                  <h4 className="font-bold text-orange-800">Energy Opportunities</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {(geo.profile?.avgDemandCharge || 0) > 10 && (
                    <div className="flex items-center gap-2">
                      <span>🔥</span>
                      <span className="text-gray-700"><strong>Peak Shaving</strong> - ${geo.profile?.avgDemandCharge}/kW demand charge</span>
                    </div>
                  )}
                  {(geo.profile?.avgElectricityRate || 0) > 0.12 && (
                    <div className="flex items-center gap-2">
                      <span>🔥</span>
                      <span className="text-gray-700"><strong>Arbitrage</strong> - ${geo.profile?.avgElectricityRate?.toFixed(3)}/kWh TOU potential</span>
                    </div>
                  )}
                  {(geo.profile?.gridReliabilityScore || 100) < 80 && (
                    <div className="flex items-center gap-2">
                      <span>🔥</span>
                      <span className="text-gray-700"><strong>Grid Stability</strong> - {geo.profile?.gridReliabilityScore}% reliability</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-orange-600">
                  <strong>Source:</strong> EIA + State utility data
                </div>
              </div>
            )}
          </div>
          
          {/* Data Sources */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Authoritative Data Sources
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-gray-600">BESS Pricing: <strong>NREL ATB 2024</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-600">Solar Pricing: <strong>NREL Cost Benchmark</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">Tax Credits: <strong>IRA 2022</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-600">Utility Rates: <strong>EIA 2024</strong></span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold transition-colors hover:from-emerald-600 hover:to-teal-600"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationSection;
