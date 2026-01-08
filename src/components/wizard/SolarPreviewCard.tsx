import React, { useState } from 'react';
import { calculateSolarCapacity } from '@/services/TrueQuoteEngine-Solar';
import type { SolarCapacityResult } from '@/services/TrueQuoteEngine-Solar';
import { getSolarTemplate } from '@/services/solarTemplates';

interface SolarPreviewCardProps {
  industry: string;
  roofArea?: number;
  roofUnit?: 'sqft' | 'sqm';
  carportInterest?: 'yes' | 'no' | 'unsure';
  carportArea?: number;
  carportUnit?: 'sqft' | 'sqm';
}

export function SolarPreviewCard({
  industry,
  roofArea,
  roofUnit = 'sqft',
  carportInterest = 'no',
  carportArea,
  carportUnit = 'sqft'
}: SolarPreviewCardProps) {
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Don't show preview if no roof area entered
  if (!roofArea || roofArea <= 0) {
    return null;
  }

  // Calculate solar capacity using TrueQuoteEngine
  const result: SolarCapacityResult = calculateSolarCapacity({
    industry,
    roofArea,
    roofUnit,
    carportInterest,
    carportArea: carportInterest !== 'no' ? carportArea : undefined,
    carportUnit
  });

  const template = getSolarTemplate(industry);
  const hasCarport = carportInterest !== 'no' && result.carportSolarKW > 0;

  return (
    <div className="solar-preview-card bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">☀️</div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Solar Capacity Preview
            </h3>
            <p className="text-sm text-slate-400">
              Live calculation from TrueQuote™ Engine
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          TrueQuote™
        </div>
      </div>

      {/* Roof Solar Calculation */}
      <div className="space-y-3 mb-4">
        <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
          {/* Roof Area Input */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Roof Area:</span>
            <span className="text-white font-semibold">
              {result.roofArea.toLocaleString()} sq ft
            </span>
          </div>

          {/* Usable Factor */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">× Usable Factor:</span>
            <span className="text-slate-400">
              {(result.roofUsableFactor * 100).toFixed(0)}%
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-2"></div>

          {/* Usable Roof Area */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Usable Roof:</span>
            <span className="text-purple-300 font-semibold">
              {result.roofSolarUsable.toLocaleString()} sq ft
            </span>
          </div>

          {/* Roof Solar Generation */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Solar Generation:</span>
            <span className="text-purple-400 font-bold text-lg">
              {result.roofSolarKW.toFixed(1)} kW
            </span>
          </div>
        </div>

        {/* Carport Solar (if applicable) */}
        {hasCarport && (
          <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyan-400 text-sm font-semibold">+ Carport Solar</span>
            </div>

            {/* Carport Area */}
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Carport Area:</span>
              <span className="text-white font-semibold">
                {result.carportArea.toLocaleString()} sq ft
              </span>
            </div>

            {/* Usable Factor (100% for carports) */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">× Usable Factor:</span>
              <span className="text-slate-400">
                {(result.carportUsableFactor * 100).toFixed(0)}%
              </span>
            </div>

            {/* Carport Solar Generation */}
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Additional Solar:</span>
              <span className="text-cyan-400 font-bold text-lg">
                +{result.carportSolarKW.toFixed(1)} kW
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total Solar System */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-200 font-semibold">Total Solar System:</span>
          <span className="text-white font-bold text-2xl">
            {result.totalSolarKW.toFixed(1)} kW
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SystemSizeBadge category={result.systemSizeCategory} />
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Annual Generation</div>
            <div className="text-sm font-semibold text-purple-300">
              {(result.annualGenerationKWh / 1000).toFixed(0)}k kWh/year
            </div>
          </div>
        </div>
      </div>

      {/* Estimated Savings */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">Monthly</div>
          <div className="text-lg font-bold text-green-400">
            ${((result.annualGenerationKWh * 0.12) / 12).toFixed(0)}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">Annual</div>
          <div className="text-lg font-bold text-green-400">
            ${(result.annualGenerationKWh * 0.12).toFixed(0)}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">10-Year</div>
          <div className="text-lg font-bold text-green-400">
            ${((result.annualGenerationKWh * 0.12 * 10 * 1.03) / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Expandable Assumptions */}
      <button
        onClick={() => setShowAssumptions(!showAssumptions)}
        className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-300 transition-colors py-2"
      >
        <span>View Calculation Assumptions</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showAssumptions ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Assumptions Panel */}
      {showAssumptions && (
        <div className="mt-3 bg-slate-900/70 rounded-xl p-4 space-y-3 border border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Industry Template: {template.displayName}
          </h4>
          
          <div className="space-y-2">
            {template.assumptions.map((assumption, index) => (
              <div key={index} className="flex gap-2 text-xs text-slate-400">
                <span className="text-purple-400 flex-shrink-0">•</span>
                <span>{assumption}</span>
              </div>
            ))}
          </div>

          {/* Audit Trail */}
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Calculation Engine:</span>
                <span className="text-slate-400 font-mono">{result.engineVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Template Version:</span>
                <span className="text-slate-400 font-mono">{result.templateVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Calculated:</span>
                <span className="text-slate-400">
                  {new Date(result.calculatedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Calculations */}
          <details className="mt-3">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
              Show detailed calculations
            </summary>
            <div className="mt-2 space-y-2 text-xs font-mono text-slate-500">
              {/* Roof Calculation */}
              <div className="bg-slate-950/50 rounded p-2">
                <div className="text-purple-400 mb-1">Roof Solar:</div>
                <div>{result.calculations.roofUsable.formula}</div>
                <div className="text-slate-600">
                  = {result.calculations.roofUsable.inputs.roofArea.toLocaleString()} × {result.calculations.roofUsable.inputs.roofUsableFactor}
                </div>
                <div className="text-purple-300">
                  = {result.calculations.roofUsable.result.toLocaleString()} sq ft
                </div>
              </div>

              <div className="bg-slate-950/50 rounded p-2">
                <div>{result.calculations.roofGeneration.formula}</div>
                <div className="text-slate-600">
                  = {result.calculations.roofGeneration.inputs.roofSolarUsable.toLocaleString()} × {result.calculations.roofGeneration.inputs.solarDensity}
                </div>
                <div className="text-purple-300">
                  = {result.calculations.roofGeneration.result.toFixed(1)} kW
                </div>
              </div>

              {/* Carport Calculation (if applicable) */}
              {hasCarport && result.calculations.carportUsable && (
                <>
                  <div className="bg-slate-950/50 rounded p-2">
                    <div className="text-cyan-400 mb-1">Carport Solar:</div>
                    <div>{result.calculations.carportUsable.formula}</div>
                    <div className="text-slate-600">
                      = {result.calculations.carportUsable.inputs.carportArea.toLocaleString()} × {result.calculations.carportUsable.inputs.carportUsableFactor}
                    </div>
                    <div className="text-cyan-300">
                      = {result.calculations.carportUsable.result.toLocaleString()} sq ft
                    </div>
                  </div>

                  {result.calculations.carportGeneration && (
                    <div className="bg-slate-950/50 rounded p-2">
                      <div>{result.calculations.carportGeneration.formula}</div>
                      <div className="text-slate-600">
                        = {result.calculations.carportGeneration.inputs.carportSolarUsable.toLocaleString()} × {result.calculations.carportGeneration.inputs.solarDensity}
                      </div>
                      <div className="text-cyan-300">
                        = {result.calculations.carportGeneration.result.toFixed(1)} kW
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Total */}
              <div className="bg-slate-950/50 rounded p-2">
                <div className="text-white mb-1">Total Generation:</div>
                <div>{result.calculations.totalGeneration.formula}</div>
                <div className="text-slate-600">
                  = {result.calculations.totalGeneration.inputs.roofSolarKW.toFixed(1)} + {result.calculations.totalGeneration.inputs.carportSolarKW.toFixed(1)}
                </div>
                <div className="text-white font-bold">
                  = {result.calculations.totalGeneration.result.toFixed(1)} kW
                </div>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        Final sizing verified through site survey and satellite imagery
      </div>
    </div>
  );
}

// ============================================================================
// SYSTEM SIZE BADGE
// ============================================================================

function SystemSizeBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Small': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Medium': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Large': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Extra Large': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const colorClass = colors[category] || colors['Medium'];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colorClass}`}>
      <div className="w-2 h-2 rounded-full bg-current"></div>
      <span>{category} System</span>
    </div>
  );
}
