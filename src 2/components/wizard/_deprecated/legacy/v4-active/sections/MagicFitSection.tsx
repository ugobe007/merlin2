/**
 * MagicFitSection.tsx
 * 
 * Step 4: Magic Fit™ Scenarios - "Wizard on Steroids"
 * 
 * Presents three pre-optimized scenario cards:
 * 1. 🛡️ ESSENTIALS - BESS only, fastest payback
 * 2. ⚖️ BALANCED - BESS + Solar + Generator (Merlin's recommendation)
 * 3. 🚀 MAX SAVINGS - Full stack, maximum long-term savings
 * 
 * Users can:
 * - Select one of the three scenarios
 * - Skip and use their Step 3 configuration
 * - Generate final quote
 * - Exit to Advanced Quote Builder
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Settings,
  FileText,
  Shield,
  Scale,
  Rocket,
  Zap,
  Sun,
  Wind,
  Fuel,
  Battery,
  Clock,
  TrendingUp,
  DollarSign,
  Award
} from 'lucide-react';
import { generateMagicFitScenarios, getScenarioComparison } from '@/services/magicFitScenarios';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import type { 
  ScenarioConfig, 
  MagicFitSectionProps, 
  ScenarioComparison,
  CurrentConfig 
} from '@/types/magicFit';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MagicFitSection({
  peakDemandKW,
  state,
  electricityRate,
  demandChargePerKW,
  primaryApplication,
  step3Config,
  facilityName,
  onSelectScenario,
  onUseStep3Config,
  onGenerateQuote,
  onAdvancedQuoteBuilder,
}: MagicFitSectionProps) {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [useStep3, setUseStep3] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GENERATE SCENARIOS (memoized)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const scenarios = useMemo(() => 
    generateMagicFitScenarios({
      peakDemandKW,
      state,
      electricityRate,
      demandChargePerKW,
      primaryApplication,
    }),
    [peakDemandKW, state, electricityRate, demandChargePerKW, primaryApplication]
  );
  
  const comparison = useMemo(() => getScenarioComparison(scenarios), [scenarios]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSelectScenario = useCallback((scenario: ScenarioConfig) => {
    setSelectedScenario(scenario);
    setUseStep3(false);
    onSelectScenario(scenario);
  }, [onSelectScenario]);
  
  const handleUseStep3 = useCallback(() => {
    setSelectedScenario(null);
    setUseStep3(true);
    onUseStep3Config();
  }, [onUseStep3Config]);
  
  const handleGenerateQuote = useCallback(() => {
    onGenerateQuote();
  }, [onGenerateQuote]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CURRENT CONFIGURATION (for display)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const currentConfig: CurrentConfig | null = useMemo(() => {
    if (useStep3) {
      return {
        source: 'Step 3 Configuration',
        batteryKW: step3Config.batteryKW,
        batteryKWh: step3Config.batteryKWh,
        durationHours: step3Config.durationHours,
        solarKW: step3Config.solarKW,
        windKW: step3Config.windKW,
        generatorKW: step3Config.generatorKW,
        netInvestment: step3Config.netInvestment,
        annualSavings: step3Config.annualSavings,
        paybackYears: step3Config.paybackYears,
        roi25Year: step3Config.roi25Year,
      };
    }
    if (selectedScenario) {
      return {
        source: `${selectedScenario.name} Scenario`,
        batteryKW: selectedScenario.equipment.batteryKW,
        batteryKWh: selectedScenario.equipment.batteryKWh,
        durationHours: selectedScenario.equipment.durationHours,
        solarKW: selectedScenario.equipment.solarKW,
        windKW: selectedScenario.equipment.windKW,
        generatorKW: selectedScenario.equipment.generatorKW,
        netInvestment: selectedScenario.financials.netInvestment,
        annualSavings: selectedScenario.financials.annualSavings,
        paybackYears: selectedScenario.financials.paybackYears,
        roi25Year: selectedScenario.financials.roi25Year,
      };
    }
    return null;
  }, [selectedScenario, useStep3, step3Config]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review & Select Your Configuration
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Based on your <strong className="text-purple-700">{facilityName}</strong> in{' '}
          <strong className="text-purple-700">{state}</strong>, 
          we've generated 3 optimized options. Select one or use your custom configuration.
        </p>
      </div>
      
      {/* Magic Fit Scenarios */}
      <div className="bg-gradient-to-br from-purple-50 to-amber-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Magic Fit™ Scenarios</h3>
            <p className="text-sm text-gray-600">AI-optimized configurations for your facility</p>
          </div>
        </div>
        
        {/* Scenario Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.type}
              scenario={scenario}
              isSelected={selectedScenario?.type === scenario.type}
              onSelect={() => handleSelectScenario(scenario)}
              comparison={comparison}
            />
          ))}
        </div>
        
        {/* Skip to Step 3 Config */}
        <div className="mt-6 pt-6 border-t-2 border-purple-200">
          <button
            onClick={handleUseStep3}
            className={`w-full py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              useStep3
                ? 'bg-amber-100 border-amber-400 text-amber-800 font-semibold'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {useStep3 && <CheckCircle2 className="w-5 h-5" />}
            Skip - Use My Configuration from Step 3
            {step3Config.source === 'merlin' && " (Merlin's Pick)"}
            {step3Config.source === 'user' && ' (Custom)'}
          </button>
        </div>
      </div>
      
      {/* Selected Configuration Summary */}
      {currentConfig && (
        <SelectedConfigSummary config={currentConfig} />
      )}
      
      {/* TrueQuote Verification */}
      <TrueQuoteVerification state={state} />
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleGenerateQuote}
          disabled={!currentConfig}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            currentConfig
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FileText className="w-5 h-5" />
          Generate Final Quote
        </button>
        
        <button
          onClick={onAdvancedQuoteBuilder}
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold
                     border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          <Settings className="w-5 h-5" />
          Advanced Quote Builder
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
// SUB-COMPONENTS
// ============================================================================

interface ScenarioCardInternalProps {
  scenario: ScenarioConfig;
  isSelected: boolean;
  onSelect: () => void;
  comparison: ScenarioComparison;
}

function ScenarioCard({ scenario, isSelected, onSelect, comparison }: ScenarioCardInternalProps) {
  // Icon mapping
  const IconComponent = {
    'essentials': Shield,
    'balanced': Scale,
    'max-savings': Rocket,
  }[scenario.type];
  
  // Color schemes per scenario type
  const colorMap = {
    'essentials': {
      bg: 'bg-slate-50',
      border: isSelected ? 'border-slate-500' : 'border-slate-200',
      header: 'bg-slate-600',
      button: isSelected ? 'bg-slate-600' : 'bg-slate-500 hover:bg-slate-600',
      ring: 'ring-slate-500',
    },
    'balanced': {
      bg: 'bg-purple-50',
      border: isSelected ? 'border-purple-500' : 'border-purple-200',
      header: 'bg-purple-600',
      button: isSelected ? 'bg-purple-600' : 'bg-purple-500 hover:bg-purple-600',
      ring: 'ring-purple-500',
    },
    'max-savings': {
      bg: 'bg-amber-50',
      border: isSelected ? 'border-amber-500' : 'border-amber-200',
      header: 'bg-amber-500',
      button: isSelected ? 'bg-amber-500' : 'bg-amber-400 hover:bg-amber-500',
      ring: 'ring-amber-500',
    },
  };
  
  const colors = colorMap[scenario.type];
  
  // Comparison badges for this scenario
  const badges: string[] = [];
  if (comparison.lowestCost === scenario.type) badges.push('Lowest Cost');
  if (comparison.fastestPayback === scenario.type) badges.push('Fastest Payback');
  if (comparison.highestSavings === scenario.type) badges.push('Most Savings');
  
  return (
    <div 
      className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden 
                  transition-all cursor-pointer hover:shadow-lg ${
                    isSelected ? `ring-2 ring-offset-2 ${colors.ring}` : ''
                  }`}
      onClick={onSelect}
    >
      {/* Recommended Badge */}
      {scenario.isRecommended && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-center py-1 text-sm font-bold">
          ⭐ RECOMMENDED
        </div>
      )}
      
      {/* Header */}
      <div className={`${colors.header} text-white px-4 py-4`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{scenario.icon}</span>
          <div>
            <h4 className="font-bold text-lg">{scenario.name}</h4>
            <p className="text-white/80 text-sm">{scenario.tagline}</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Comparison Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map(badge => (
              <span 
                key={badge}
                className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full"
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        )}
        
        {/* Equipment Section */}
        <div className="space-y-2">
          <h5 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Equipment</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">{scenario.equipment.batteryKW.toLocaleString()} kW</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">{scenario.equipment.batteryKWh.toLocaleString()} kWh</span>
            </div>
            {scenario.equipment.solarKW > 0 ? (
              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">{scenario.equipment.solarKW.toLocaleString()} kW</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Sun className="w-4 h-4" />
                <span>—</span>
              </div>
            )}
            {scenario.equipment.generatorKW > 0 ? (
              <div className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{scenario.equipment.generatorKW.toLocaleString()} kW</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Fuel className="w-4 h-4" />
                <span>—</span>
              </div>
            )}
            {scenario.equipment.windKW > 0 && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Wind className="w-4 h-4 text-cyan-500" />
                <span className="text-gray-600">{scenario.equipment.windKW.toLocaleString()} kW Wind</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Financials Section */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <h5 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Financials</h5>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Net Investment
              </span>
              <span className="font-bold text-gray-900">
                ${scenario.financials.netInvestment.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Annual Savings
              </span>
              <span className="font-bold text-emerald-600">
                ${scenario.financials.annualSavings.toLocaleString()}/yr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Payback
              </span>
              <span className="font-bold text-gray-900">
                {scenario.financials.paybackYears.toFixed(1)} years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> 25-Year ROI
              </span>
              <span className="font-bold text-emerald-600">
                {scenario.financials.roi25Year.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Highlights Section */}
        <div className="space-y-1.5 pt-2 border-t border-gray-200">
          {scenario.highlights.map((highlight, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {highlight}
            </div>
          ))}
        </div>
        
        {/* Select Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-full py-3 ${colors.button} text-white font-bold rounded-xl 
                     transition-all flex items-center justify-center gap-2`}
        >
          {isSelected ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Selected
            </>
          ) : (
            'Select'
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SELECTED CONFIG SUMMARY
// ============================================================================

interface SelectedConfigSummaryInternalProps {
  config: CurrentConfig;
}

function SelectedConfigSummary({ config }: SelectedConfigSummaryInternalProps) {
  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 rounded-xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Your Selected Configuration</h3>
          <p className="text-sm text-gray-600">{config.source}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Equipment Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Equipment</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Battery Power</div>
              <div className="font-bold text-gray-900">{config.batteryKW.toLocaleString()} kW</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Battery Capacity</div>
              <div className="font-bold text-gray-900">{config.batteryKWh.toLocaleString()} kWh</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Solar</div>
              <div className="font-bold text-gray-900">
                {config.solarKW > 0 ? `${config.solarKW.toLocaleString()} kW` : '—'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-xs uppercase tracking-wide">Generator</div>
              <div className="font-bold text-gray-900">
                {config.generatorKW > 0 ? `${config.generatorKW.toLocaleString()} kW` : '—'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Financials</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-emerald-600 text-xs uppercase tracking-wide">Net Investment</div>
              <div className="font-bold text-emerald-900">${config.netInvestment.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-emerald-600 text-xs uppercase tracking-wide">Annual Savings</div>
              <div className="font-bold text-emerald-900">${config.annualSavings.toLocaleString()}/yr</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-emerald-600 text-xs uppercase tracking-wide">Payback Period</div>
              <div className="font-bold text-emerald-900">{config.paybackYears.toFixed(1)} years</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-emerald-600 text-xs uppercase tracking-wide">25-Year ROI</div>
              <div className="font-bold text-emerald-900">{config.roi25Year.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TRUEQUOTE VERIFICATION
// ============================================================================

interface TrueQuoteVerificationInternalProps {
  state: string;
}

function TrueQuoteVerification({ state }: TrueQuoteVerificationInternalProps) {
  return (
    <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrueQuoteBadge size="sm" showTooltip={false} />
        <h3 className="text-lg font-bold text-amber-900">TrueQuote™ Verification</h3>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700">
            All calculations traceable to <strong className="text-gray-900">NREL ATB 2024</strong>
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700">
            Pricing aligned with <strong className="text-gray-900">Grid-Synk</strong> industry benchmarks
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700">
            Tax credits: <strong className="text-gray-900">30% ITC</strong> (IRA 2022)
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700">
            Utility rates: <strong className="text-gray-900">EIA {state} data</strong> (2024)
          </span>
        </div>
      </div>
    </div>
  );
}

export default MagicFitSection;
