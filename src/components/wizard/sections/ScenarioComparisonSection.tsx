/**
 * SCENARIO COMPARISON SECTION
 * ===========================
 * 
 * Displays 3 configuration scenarios side-by-side:
 * 1. Cost Saver (💰) - Best ROI, minimal investment
 * 2. Balanced (⚡) - Recommended for most businesses
 * 3. Resilient (🛡️) - Maximum capability & backup
 * 
 * User can select their preferred scenario to proceed with full quote.
 * 
 * December 2025
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowRight,
  Battery,
  Check,
  ChevronDown,
  Crown,
  DollarSign,
  RefreshCw,
  Shield,
  Sun,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { generateScenarios, type GeneratedScenario, type ScenarioGeneratorOutput } from '@/services/scenarioGenerator';
import type { WizardState } from '../types/wizardTypes';

// ============================================
// TYPES
// ============================================

interface ScenarioComparisonSectionProps {
  wizardState: WizardState;
  onSelectScenario: (scenario: GeneratedScenario) => void;
  onBack: () => void;
}

// ============================================
// HELPERS
// ============================================

const formatMoney = (amt: number) => {
  if (amt >= 1000000) return `$${(amt / 1000000).toFixed(2)}M`;
  if (amt >= 1000) return `$${Math.round(amt).toLocaleString()}`;
  return `$${Math.round(amt)}`;
};

const formatKW = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;

// ============================================
// SCENARIO CARD COMPONENT
// ============================================

interface ScenarioCardProps {
  scenario: GeneratedScenario;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function ScenarioCard({ scenario, isRecommended, isSelected, onSelect }: ScenarioCardProps) {
  const iconSize = "w-6 h-6";
  
  // Color schemes per scenario type
  const colorSchemes = {
    savings: {
      gradient: 'from-amber-500 to-yellow-500',
      lightBg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-300',
      activeBorder: 'border-amber-500',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      button: 'bg-amber-500 hover:bg-amber-600',
      icon: DollarSign,
    },
    balanced: {
      gradient: 'from-emerald-500 to-teal-500',
      lightBg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-300',
      activeBorder: 'border-emerald-500',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      button: 'bg-emerald-500 hover:bg-emerald-600',
      icon: Zap,
    },
    resilient: {
      gradient: 'from-purple-500 to-indigo-500',
      lightBg: 'from-purple-50 to-indigo-50',
      border: 'border-purple-300',
      activeBorder: 'border-purple-500',
      text: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      button: 'bg-purple-500 hover:bg-purple-600',
      icon: Shield,
    },
  };
  
  const colors = colorSchemes[scenario.type];
  const IconComponent = colors.icon;
  
  return (
    <div
      onClick={onSelect}
      className={`
        relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected 
          ? `ring-4 ring-${scenario.type === 'savings' ? 'amber' : scenario.type === 'balanced' ? 'emerald' : 'purple'}-500/50 shadow-xl scale-[1.02]` 
          : 'shadow-lg hover:shadow-xl hover:scale-[1.01]'}
        ${isRecommended ? colors.activeBorder : colors.border} border-2
      `}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className={`absolute -top-0 -right-0 bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl`}>
          <div className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            RECOMMENDED
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.lightBg} p-6 pb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colors.gradient} flex items-center justify-center`}>
            <span className="text-2xl">{scenario.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{scenario.name}</h3>
            <p className="text-sm text-gray-500">{scenario.tagline}</p>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="p-6 pt-4">
        {/* Price */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 mb-1">Net Investment (after ITC)</p>
          <p className="text-3xl font-black text-gray-800">{formatMoney(scenario.costs.netCost)}</p>
          <p className="text-xs text-gray-400 line-through">{formatMoney(scenario.costs.totalProjectCost)} before tax credit</p>
        </div>
        
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`bg-gradient-to-br ${colors.lightBg} rounded-lg p-3 text-center`}>
            <p className="text-xs text-gray-500">Payback</p>
            <p className={`text-lg font-bold ${colors.text}`}>{scenario.financials.paybackYears} yrs</p>
          </div>
          <div className={`bg-gradient-to-br ${colors.lightBg} rounded-lg p-3 text-center`}>
            <p className="text-xs text-gray-500">10yr ROI</p>
            <p className={`text-lg font-bold ${colors.text}`}>{scenario.financials.roi10Year}%</p>
          </div>
        </div>
        
        {/* Annual Savings */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
          <p className="text-xs text-gray-500">Annual Savings</p>
          <p className="text-xl font-bold text-emerald-600">{formatMoney(scenario.financials.annualSavings)}/yr</p>
        </div>
        
        {/* System Configuration */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>{formatKW(scenario.config.bessKW)} / {formatKWh(scenario.config.bessKWh)}</span>
            <span className="text-gray-400">• {scenario.config.durationHours}hr</span>
          </div>
          {scenario.config.solarKW > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{formatKW(scenario.config.solarKW)} Solar</span>
            </div>
          )}
          {scenario.config.generatorKW > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="w-4 h-4 text-slate-500" />
              <span>{formatKW(scenario.config.generatorKW)} Generator</span>
            </div>
          )}
        </div>
        
        {/* Benefits */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Benefits</p>
          <ul className="space-y-1.5">
            {scenario.benefits.slice(0, 3).map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Confidence */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Estimate Confidence</span>
            <span className="text-xs font-semibold text-gray-600">{scenario.confidence}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${scenario.confidence}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{scenario.confidenceReason}</p>
        </div>
        
        {/* Select Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`
            w-full mt-4 py-3 rounded-xl font-bold text-white transition-all
            ${isSelected 
              ? `${colors.button} ring-2 ring-offset-2 ring-${scenario.type === 'savings' ? 'amber' : scenario.type === 'balanced' ? 'emerald' : 'purple'}-500` 
              : `${colors.button}`}
          `}
        >
          {isSelected ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Selected
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Select This Option
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ScenarioComparisonSection({
  wizardState,
  onSelectScenario,
  onBack,
}: ScenarioComparisonSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarioOutput, setScenarioOutput] = useState<ScenarioGeneratorOutput | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Generate scenarios on mount
  const generateAllScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Map wizard goals to scenario generator format
      const goalMapping: Record<string, string> = {
        'reduce-costs': 'cost-savings',
        'backup-power': 'backup-power',
        'sustainability': 'sustainability',
        'grid-independence': 'grid-independence',
        'demand-charges': 'cost-savings',
        'peak-shaving': 'cost-savings',
      };
      
      const goals = (wizardState.goals || []).map(g => goalMapping[g] || g);
      
      const result = await generateScenarios({
        peakDemandKW: wizardState.peakDemandKW || wizardState.batteryKW * 2 || 500,
        industryType: wizardState.selectedIndustry || 'commercial',
        state: wizardState.state || 'California',
        electricityRate: wizardState.electricityRate || 0.15,
        goals,
        wantsSolar: wizardState.wantsSolar ?? true,
        wantsGenerator: wizardState.wantsGenerator ?? false,
        dailyKWh: wizardState.dailyKWh || undefined,
      });
      
      setScenarioOutput(result);
      setSelectedIndex(result.recommendedIndex);
    } catch (err) {
      console.error('[ScenarioComparison] Failed to generate scenarios:', err);
      setError('Failed to generate scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [wizardState]);

  useEffect(() => {
    generateAllScenarios();
  }, []); // Only run on mount

  const handleSelectScenario = (index: number) => {
    setSelectedIndex(index);
  };

  const handleProceed = () => {
    if (selectedIndex !== null && scenarioOutput) {
      onSelectScenario(scenarioOutput.scenarios[selectedIndex]);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-300">Generating Your Options...</p>
          <p className="text-sm text-gray-500 mt-1">Analyzing {wizardState.industryName || 'your facility'} requirements</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !scenarioOutput) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-lg font-semibold text-gray-300 mb-2">Unable to Generate Scenarios</p>
          <p className="text-sm text-gray-500 mb-4">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={generateAllScenarios}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { scenarios, recommendedIndex, inputSummary } = scenarioOutput;

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">Choose Your Configuration</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Based on your {inputSummary.industryType} facility in {inputSummary.state}, 
            we've prepared three options optimized for different priorities.
          </p>
        </div>

        {/* Input Summary (collapsible) */}
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 mx-auto"
          >
            <span>Analysis Details</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          
          {showDetails && (
            <div className="mt-4 bg-gray-800/50 rounded-xl p-4 max-w-xl mx-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Peak Demand</p>
                  <p className="text-white font-semibold">{formatKW(inputSummary.peakDemandKW)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Industry Load Factor</p>
                  <p className="text-white font-semibold">{Math.round(inputSummary.loadProfile.peakLoadFactor * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">TOU Peak Window</p>
                  <p className="text-white font-semibold">
                    {inputSummary.touSchedule.summerPeakStart}:00 - {inputSummary.touSchedule.summerPeakEnd}:00
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Peak Rate Multiplier</p>
                  <p className="text-white font-semibold">{inputSummary.touSchedule.peakRateMultiplier}x</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.type}
              scenario={scenario}
              isRecommended={index === recommendedIndex}
              isSelected={selectedIndex === index}
              onSelect={() => handleSelectScenario(index)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleProceed}
            disabled={selectedIndex === null}
            className={`
              px-8 py-3 rounded-xl font-bold text-white transition-all
              ${selectedIndex !== null 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg' 
                : 'bg-gray-600 cursor-not-allowed opacity-50'}
            `}
          >
            <span className="flex items-center gap-2">
              Continue with {selectedIndex !== null ? scenarios[selectedIndex].name : 'Selection'}
              <ArrowRight className="w-5 h-5" />
            </span>
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Not sure? The <span className="text-emerald-400 font-semibold">Balanced</span> option works great for most businesses.
        </p>
      </div>
    </div>
  );
}

export default ScenarioComparisonSection;
