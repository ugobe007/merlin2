/**
 * STEP 1: COMPLETE YOUR PROFILE SECTION
 * =====================================
 * 
 * December 2025 - Requirement D
 * 
 * When coming from HERO calculator:
 * - Shows READ-ONLY summary of HERO values (with Edit link)
 * - Only asks for NEW information not captured in HERO:
 *   - Electricity Rate
 *   - Primary Goals
 *   - Backup Requirements
 *   - Existing Equipment
 *   - Timeline & Budget (optional)
 * 
 * This eliminates redundant questions and speeds up the wizard flow.
 */

import React, { useMemo } from 'react';
import {
  Hotel, Zap, DollarSign, Edit2, Shield, Clock, Sun, Car,
  TrendingDown, CheckCircle, HelpCircle, Battery, Flame,
  ArrowRight, Building2,
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import type { HeroToWizardPayload } from '../types/heroPayload';
import {
  getHeroPayload,
  getHotelClassLabel,
  buildAmenitiesSummary,
  getStateAvgRate,
  WIZARD_GOALS,
  BACKUP_IMPORTANCE_OPTIONS,
  BACKUP_DURATION_OPTIONS,
  TIMELINE_OPTIONS,
  BUDGET_RANGE_OPTIONS,
} from '../types/heroPayload';

// ============================================
// PROPS
// ============================================

export interface Step1CompleteProfileProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  heroPayload: HeroToWizardPayload | null;
  onContinue: () => void;
  onEditHero?: () => void; // Navigate back to hero calculator
}

// ============================================
// GOAL ICONS MAPPING
// ============================================

const GOAL_ICONS: Record<string, React.ComponentType<any>> = {
  'demand-charges': TrendingDown,
  'backup-power': Shield,
  'tou-optimization': Clock,
  'solar-consumption': Sun,
  'ev-support': Car,
  'grid-independence': Zap,
};

// ============================================
// COMPONENT
// ============================================

export function Step1CompleteProfile({
  wizardState,
  setWizardState,
  heroPayload,
  onContinue,
  onEditHero,
}: Step1CompleteProfileProps) {
  // Check if we have hero data
  const fromHero = !!heroPayload;
  
  // Build amenities summary
  const amenitiesSummary = useMemo(() => {
    return heroPayload ? buildAmenitiesSummary(heroPayload) : [];
  }, [heroPayload]);
  
  // Check if form is complete enough to continue
  const isComplete = useMemo(() => {
    const hasRate = (wizardState.electricityRate || 0) > 0;
    const hasGoals = (wizardState.goals?.length || 0) > 0;
    return hasRate && hasGoals;
  }, [wizardState.electricityRate, wizardState.goals]);
  
  // Toggle goal selection
  const toggleGoal = (goalId: string) => {
    setWizardState(prev => {
      const currentGoals = prev.goals || [];
      const hasGoal = currentGoals.includes(goalId);
      return {
        ...prev,
        goals: hasGoal
          ? currentGoals.filter(g => g !== goalId)
          : [...currentGoals, goalId],
      };
    });
  };
  
  // Get extended wizard state with additional fields we need
  const extendedState = wizardState as WizardState & {
    backupImportance?: string;
    backupDuration?: string;
    criticalLoadPercent?: number;
    hasExistingSolar?: boolean;
    existingSolarKW?: number;
    hasExistingGenerator?: boolean;
    existingGeneratorKW?: number;
    noExistingEquipment?: boolean;
    timeline?: string;
    budgetRange?: string;
    utilityCompany?: string;
  };
  
  // Update extended state helper
  const updateExtendedState = (updates: Partial<typeof extendedState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white mb-2">Complete Your Profile</h2>
        <p className="text-slate-400">
          {fromHero 
            ? "We've captured your property details. Now tell us about your energy goals."
            : "Tell us about your facility and energy goals."}
        </p>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SUMMARY CARD (Read-Only)
          ═══════════════════════════════════════════════════════════════════ */}
      {fromHero && heroPayload && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-indigo-500/30">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Your Property
              <span className="text-xs text-slate-500 font-normal">(from calculator)</span>
            </h3>
            {onEditHero && (
              <button 
                onClick={onEditHero}
                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          
          {/* Property headline */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Hotel className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {heroPayload.rooms}-Room {getHotelClassLabel(heroPayload.hotelClass || 'midscale')} Hotel
              </p>
              <p className="text-slate-400">
                {heroPayload.state}
                {heroPayload.buildingSqFt && ` • ${heroPayload.buildingSqFt.toLocaleString()} sq ft`}
              </p>
            </div>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-2xl font-bold text-white">{heroPayload.peakDemandKW}</span>
                <span className="text-slate-400 text-sm">kW</span>
              </div>
              <p className="text-xs text-slate-400">Peak Demand</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-white">${heroPayload.monthlyCharges.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400">Monthly Bill</p>
            </div>
          </div>
          
          {/* Amenities */}
          {amenitiesSummary.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenitiesSummary.map((amenity, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════
          UTILITY INFORMATION (NOT in HERO)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Utility Information
        </h3>
        
        <div className="space-y-4">
          {/* Electricity Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Electricity Rate <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.00"
                value={wizardState.electricityRate || ''}
                onChange={(e) => setWizardState(prev => ({
                  ...prev,
                  electricityRate: parseFloat(e.target.value) || 0
                }))}
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.12"
              />
              <span className="text-slate-400">per kWh</span>
            </div>
            {heroPayload?.state && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                {heroPayload.state} average: ${getStateAvgRate(heroPayload.state)}/kWh
              </p>
            )}
          </div>
          
          {/* Utility Company (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Utility Company <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={extendedState.utilityCompany || ''}
              onChange={(e) => updateExtendedState({ utilityCompany: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., NV Energy, PG&E, FPL..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Helps us find accurate rate structures and incentives
            </p>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          PRIMARY GOALS (NOT in HERO)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Battery className="w-5 h-5 text-purple-400" />
          Primary Goals <span className="text-red-400">*</span>
        </h3>
        <p className="text-sm text-slate-400 mb-4">Select all that apply to your situation</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {WIZARD_GOALS.map((goal) => {
            const IconComponent = GOAL_ICONS[goal.id] || Zap;
            const isSelected = wizardState.goals?.includes(goal.id);
            
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-400/60 text-white'
                    : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{goal.label}</p>
                  <p className="text-xs text-slate-500 truncate">{goal.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          BACKUP POWER REQUIREMENTS (NOT in HERO)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Backup Power Requirements
        </h3>
        
        <div className="space-y-5">
          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              How important is backup power for your facility?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BACKUP_IMPORTANCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateExtendedState({ backupImportance: option.id })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    extendedState.backupImportance === option.id
                      ? 'bg-amber-500/20 border-amber-400/60 text-white'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-sm capitalize">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Minimum backup duration needed:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BACKUP_DURATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateExtendedState({ backupDuration: option.id })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    extendedState.backupDuration === option.id
                      ? 'bg-amber-500/20 border-amber-400/60 text-white'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-sm">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Critical Load Percentage */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Critical load percentage: <span className="text-white font-bold">{extendedState.criticalLoadPercent || 70}%</span>
            </label>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={extendedState.criticalLoadPercent || 70}
              onChange={(e) => updateExtendedState({ criticalLoadPercent: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              What % of your facility must stay powered during an outage?
            </p>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          EXISTING EQUIPMENT (NOT in HERO)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          Existing Equipment
        </h3>
        
        <div className="space-y-3">
          {/* Existing Solar */}
          <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
            <input
              type="checkbox"
              checked={extendedState.hasExistingSolar || false}
              onChange={(e) => updateExtendedState({ 
                hasExistingSolar: e.target.checked,
                noExistingEquipment: e.target.checked ? false : extendedState.noExistingEquipment
              })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
            <Sun className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">Existing Solar Panels</span>
            {extendedState.hasExistingSolar && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  placeholder="kW"
                  value={extendedState.existingSolarKW || ''}
                  onChange={(e) => updateExtendedState({ existingSolarKW: parseInt(e.target.value) || 0 })}
                  className="w-20 bg-slate-600 border border-slate-500 rounded-lg px-3 py-1 text-white text-sm"
                />
                <span className="text-slate-400 text-sm">kW</span>
              </div>
            )}
          </label>
          
          {/* Existing Generator */}
          <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
            <input
              type="checkbox"
              checked={extendedState.hasExistingGenerator || false}
              onChange={(e) => updateExtendedState({ 
                hasExistingGenerator: e.target.checked,
                noExistingEquipment: e.target.checked ? false : extendedState.noExistingEquipment
              })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-white font-medium">Backup Generator</span>
            {extendedState.hasExistingGenerator && (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  placeholder="kW"
                  value={extendedState.existingGeneratorKW || ''}
                  onChange={(e) => updateExtendedState({ existingGeneratorKW: parseInt(e.target.value) || 0 })}
                  className="w-20 bg-slate-600 border border-slate-500 rounded-lg px-3 py-1 text-white text-sm"
                />
                <span className="text-slate-400 text-sm">kW</span>
              </div>
            )}
          </label>
          
          {/* None */}
          <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-all">
            <input
              type="checkbox"
              checked={extendedState.noExistingEquipment || false}
              onChange={(e) => updateExtendedState({ 
                noExistingEquipment: e.target.checked,
                hasExistingSolar: e.target.checked ? false : extendedState.hasExistingSolar,
                hasExistingGenerator: e.target.checked ? false : extendedState.hasExistingGenerator
              })}
              className="w-5 h-5 accent-emerald-500 rounded"
            />
            <span className="text-white font-medium">None</span>
          </label>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          TIMELINE & BUDGET (Optional, NOT in HERO)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Timeline & Budget
          <span className="text-xs text-slate-500 font-normal ml-2">(optional)</span>
        </h3>
        
        <div className="space-y-5">
          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              When are you looking to install?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateExtendedState({ timeline: option.id })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    extendedState.timeline === option.id
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-white'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-sm">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Budget range:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BUDGET_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateExtendedState({ budgetRange: option.id })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    extendedState.budgetRange === option.id
                      ? 'bg-cyan-500/20 border-cyan-400/60 text-white'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-sm">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          CONTINUE BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
      <button
        onClick={onContinue}
        disabled={!isComplete}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
          isComplete
            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02]'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        Continue to System Sizing
        <ArrowRight className="w-5 h-5" />
      </button>
      
      {!isComplete && (
        <p className="text-center text-sm text-slate-500">
          Please enter your electricity rate and select at least one goal to continue
        </p>
      )}
    </div>
  );
}

export default Step1CompleteProfile;
