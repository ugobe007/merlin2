/**
 * SCENARIO COMPARISON COMPONENT
 * ==============================
 * 
 * Displays 3 configuration scenarios side-by-side:
 * 1. Savings Optimized - Green card
 * 2. Balanced (Recommended) - Blue card, highlighted
 * 3. Maximum Resilience - Purple card
 * 
 * User can select one scenario to proceed with detailed quote.
 * 
 * Created: Dec 2025 - Phase 3 of Optimizer implementation
 */

import React from 'react';
import { 
  type ScenarioConfig,
  type ScenarioGeneratorResult,
  formatCurrency,
  formatPower,
  formatEnergy,
} from '@/services/scenarioGenerator';

// ============================================
// TYPES
// ============================================

interface ScenarioComparisonProps {
  result: ScenarioGeneratorResult;
  onSelectScenario: (scenario: ScenarioConfig) => void;
  isLoading?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  result,
  onSelectScenario,
  isLoading = false,
}) => {
  if (isLoading) {
    return <ScenarioLoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Configuration
        </h3>
        <p className="text-gray-600">
          Based on your facility data, we've generated 3 optimized options
        </p>
      </div>

      {/* Recommendation Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-blue-900">Our Recommendation</p>
            <p className="text-blue-700 text-sm">{result.recommendationReason}</p>
          </div>
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {result.scenarios.map((scenario, index) => (
          <ScenarioCard
            key={scenario.type}
            scenario={scenario}
            isRecommended={index === result.recommendedIndex}
            onSelect={() => onSelectScenario(scenario)}
          />
        ))}
      </div>

      {/* Footer Help */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Need help choosing? <span className="text-blue-600 cursor-pointer hover:underline">Compare detailed specs</span>
      </p>
    </div>
  );
};

// ============================================
// SCENARIO CARD COMPONENT
// ============================================

interface ScenarioCardProps {
  scenario: ScenarioConfig;
  isRecommended: boolean;
  onSelect: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  isRecommended,
  onSelect,
}) => {
  const colorClasses = getColorClasses(scenario.type, isRecommended);

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-6 transition-all duration-200
        hover:shadow-lg cursor-pointer
        ${colorClasses.border}
        ${colorClasses.bg}
        ${isRecommended ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
      onClick={onSelect}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            RECOMMENDED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 mt-2">
        <span className="text-3xl mb-2 block">{scenario.icon}</span>
        <h4 className={`text-lg font-bold ${colorClasses.text}`}>
          {scenario.name}
        </h4>
        <p className="text-sm text-gray-500">{scenario.tagline}</p>
      </div>

      {/* Primary Metric - Cost */}
      <div className="text-center py-4 border-t border-b border-gray-200">
        <p className="text-sm text-gray-500 mb-1">Net Investment</p>
        <p className={`text-3xl font-bold ${colorClasses.text}`}>
          {formatCurrency(scenario.netCost)}
        </p>
        <p className="text-xs text-gray-400">after incentives</p>
      </div>

      {/* Key Metrics */}
      <div className="py-4 space-y-3">
        <MetricRow 
          label="Payback Period" 
          value={`${scenario.paybackYears.toFixed(1)} years`} 
          highlight={scenario.type === 'savings'}
        />
        <MetricRow 
          label="Annual Savings" 
          value={formatCurrency(scenario.annualSavings)}
        />
        <MetricRow 
          label="Backup Duration" 
          value={`${scenario.backupHours}+ hours`}
          highlight={scenario.type === 'resilient'}
        />
        <MetricRow 
          label="25-Year ROI" 
          value={`${Math.round(scenario.roi25Year * 100)}%`}
        />
      </div>

      {/* Equipment Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-2">System Includes:</p>
        <div className="space-y-1 text-sm">
          <EquipmentLine 
            icon="🔋" 
            text={`${formatPower(scenario.batteryKW)} / ${formatEnergy(scenario.batteryKWh)}`} 
          />
          {scenario.solarKW > 0 && (
            <EquipmentLine icon="☀️" text={`${formatPower(scenario.solarKW)} Solar`} />
          )}
          {scenario.generatorKW > 0 && (
            <EquipmentLine icon="⚡" text={`${formatPower(scenario.generatorKW)} Generator`} />
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="space-y-1 mb-4">
        {scenario.highlights.slice(0, 3).map((highlight, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">{highlight}</span>
          </div>
        ))}
      </div>

      {/* Tradeoffs (subtle) */}
      {scenario.tradeoffs.length > 0 && (
        <div className="space-y-1">
          {scenario.tradeoffs.slice(0, 2).map((tradeoff, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{tradeoff}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      <button
        className={`
          w-full mt-6 py-3 px-4 rounded-lg font-semibold transition-colors
          ${colorClasses.button}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        Select This Option
      </button>

      {/* Confidence Score */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${colorClasses.confidence}`}
            style={{ width: `${scenario.confidenceScore}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{scenario.confidenceScore}% confidence</span>
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const MetricRow: React.FC<{ 
  label: string; 
  value: string; 
  highlight?: boolean 
}> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
      {value}
    </span>
  </div>
);

const EquipmentLine: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2">
    <span>{icon}</span>
    <span className="text-gray-700">{text}</span>
  </div>
);

const ScenarioLoadingState: React.FC = () => (
  <div className="text-center py-12">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
    <p className="text-lg text-gray-600">Generating optimized configurations...</p>
    <p className="text-sm text-gray-400 mt-1">Analyzing your facility data</p>
  </div>
);

// ============================================
// COLOR HELPERS
// ============================================

function getColorClasses(type: string, isRecommended: boolean) {
  const base = {
    savings: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      text: 'text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      confidence: 'bg-emerald-500',
    },
    balanced: {
      border: isRecommended ? 'border-blue-400' : 'border-blue-200',
      bg: isRecommended ? 'bg-blue-50/50' : 'bg-white',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      confidence: 'bg-blue-500',
    },
    resilient: {
      border: 'border-purple-200',
      bg: 'bg-white',
      text: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      confidence: 'bg-purple-500',
    },
  };

  return base[type as keyof typeof base] || base.balanced;
}

// ============================================
// COMPACT VIEW (for sidebar/mobile)
// ============================================

interface ScenarioCompactProps {
  scenarios: ScenarioConfig[];
  selectedType: string | null;
  onSelect: (scenario: ScenarioConfig) => void;
}

export const ScenarioCompact: React.FC<ScenarioCompactProps> = ({
  scenarios,
  selectedType,
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => (
        <div
          key={scenario.type}
          onClick={() => onSelect(scenario)}
          className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all
            ${selectedType === scenario.type 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{scenario.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{scenario.name}</p>
                <p className="text-sm text-gray-500">{scenario.paybackYears.toFixed(1)}yr payback</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{formatCurrency(scenario.netCost)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(scenario.annualSavings)}/yr</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScenarioComparison;
