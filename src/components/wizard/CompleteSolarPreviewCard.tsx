/**
 * Complete Solar Preview Card
 * 
 * Shows live solar capacity calculations with expandable details
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sun, Zap } from 'lucide-react';

interface CompleteSolarPreviewCardProps {
  roofArea: number;
  carportArea?: number;
  carportInterest?: string;
}

export function CompleteSolarPreviewCard({
  roofArea,
  carportArea = 0,
  carportInterest
}: CompleteSolarPreviewCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // ============================================================================
  // CALCULATIONS
  // ============================================================================
  // Constants (from car wash template)
  const ROOF_USABLE_FACTOR = 0.65; // 65% of roof is usable
  const CARPORT_USABLE_FACTOR = 1.0; // 100% of carport is usable
  const SOLAR_DENSITY = 0.15; // 150W per sq ft (400W panels)
  const ANNUAL_GENERATION_FACTOR = 1200; // kWh per kW per year (location-dependent)
  const ELECTRICITY_RATE = 0.12; // $0.12 per kWh

  // Roof calculations
  const roofUsableArea = roofArea * ROOF_USABLE_FACTOR;
  const roofSolarKW = roofUsableArea * SOLAR_DENSITY;

  // Carport calculations
  const includeCarport = carportInterest === 'yes' && carportArea > 0;
  const carportUsableArea = includeCarport ? carportArea * CARPORT_USABLE_FACTOR : 0;
  const carportSolarKW = carportUsableArea * SOLAR_DENSITY;

  // Total system
  const totalSolarKW = roofSolarKW + carportSolarKW;
  const annualGenerationKWh = totalSolarKW * ANNUAL_GENERATION_FACTOR;

  // Savings
  const monthlySavings = (annualGenerationKWh / 12) * ELECTRICITY_RATE;
  const annualSavings = annualGenerationKWh * ELECTRICITY_RATE;
  const tenYearSavings = annualSavings * 10;

  // System size category
  const getSystemSize = (kw: number) => {
    if (kw < 50) return 'Small';
    if (kw < 100) return 'Medium';
    if (kw < 250) return 'Large';
    if (kw < 500) return 'Extra Large';
    return 'Industrial';
  };

  const systemSize = getSystemSize(totalSolarKW);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (roofArea === 0) return null;

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-2 border-amber-500/30 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Sun className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Solar Capacity Preview</h3>
            <p className="text-sm text-amber-300">Live calculation from TrueQuote™ Engine</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-amber-500 text-amber-950 text-sm font-bold rounded-full">
          {systemSize} System
        </div>
      </div>

      {/* Main Calculation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Roof Solar */}
        <div className="p-4 bg-slate-900/50 rounded-xl">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Roof Area</div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{roofArea.toLocaleString()}</span>
              <span className="text-slate-400">sq ft</span>
            </div>
            <div className="text-sm text-slate-400">
              × {(ROOF_USABLE_FACTOR * 100).toFixed(0)}% usable = {roofUsableArea.toLocaleString()} sq ft
            </div>
            <div className="text-lg font-semibold text-amber-400 mt-2">
              {roofSolarKW.toFixed(1)} kW
            </div>
          </div>
        </div>

        {/* Carport Solar (if applicable) */}
        {includeCarport && (
          <div className="p-4 bg-slate-900/50 rounded-xl border-2 border-purple-500/30">
            <div className="text-xs text-purple-400 uppercase tracking-wide mb-2">Carport Area</div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{carportArea.toLocaleString()}</span>
                <span className="text-slate-400">sq ft</span>
              </div>
              <div className="text-sm text-slate-400">
                × 100% usable = {carportUsableArea.toLocaleString()} sq ft
              </div>
              <div className="text-lg font-semibold text-purple-400 mt-2">
                {carportSolarKW.toFixed(1)} kW
              </div>
            </div>
          </div>
        )}

        {/* Total System */}
        <div className="p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500 rounded-xl">
          <div className="text-xs text-green-400 uppercase tracking-wide mb-2">Total Solar System</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-3xl font-bold text-white">{totalSolarKW.toFixed(1)}</span>
              <span className="text-slate-300">kW</span>
            </div>
            <div className="text-sm text-green-300">
              Annual: {(annualGenerationKWh / 1000).toFixed(0)}k kWh/year
            </div>
          </div>
        </div>
      </div>

      {/* Savings Display */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-xl mb-4">
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Monthly</div>
          <div className="text-2xl font-bold text-green-400">
            ${monthlySavings.toFixed(0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Annual</div>
          <div className="text-2xl font-bold text-green-400">
            ${annualSavings.toFixed(0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">10-Year</div>
          <div className="text-2xl font-bold text-green-400">
            ${(tenYearSavings / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium text-slate-300">
          {showDetails ? 'Hide' : 'Show'} detailed calculations
        </span>
        {showDetails ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Detailed Calculations */}
      {showDetails && (
        <div className="mt-4 p-4 bg-slate-900/70 rounded-xl space-y-3 text-sm font-mono">
          <div className="text-xs text-amber-400 uppercase tracking-wider mb-3">
            Industry Template: Car Wash
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span>Roof usable factor:</span>
              <span className="text-white">{(ROOF_USABLE_FACTOR * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Carport usable factor:</span>
              <span className="text-white">100%</span>
            </div>
            <div className="flex justify-between">
              <span>Solar panel density:</span>
              <span className="text-white">150W per sq ft</span>
            </div>
            <div className="flex justify-between">
              <span>Panel specifications:</span>
              <span className="text-white">400W panels</span>
            </div>
            <div className="flex justify-between">
              <span>Annual generation factor:</span>
              <span className="text-white">1,200 kWh/kW/year</span>
            </div>
            <div className="flex justify-between">
              <span>Electricity rate:</span>
              <span className="text-white">$0.12/kWh</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700">
            <div className="text-xs text-slate-500">
              TrueQuoteEngine v2.1.0 • Calculated: {new Date().toLocaleString()}
            </div>
          </div>

          {/* Calculation Audit Trail */}
          <div className="pt-3 border-t border-slate-700 space-y-1 text-xs text-slate-400">
            <div>Roof Solar: {roofArea} × {ROOF_USABLE_FACTOR} × {SOLAR_DENSITY} = {roofSolarKW.toFixed(1)} kW</div>
            {includeCarport && (
              <div>Carport Solar: {carportArea} × {CARPORT_USABLE_FACTOR} × {SOLAR_DENSITY} = {carportSolarKW.toFixed(1)} kW</div>
            )}
            <div>Total Generation: {totalSolarKW.toFixed(1)} kW × {ANNUAL_GENERATION_FACTOR} = {annualGenerationKWh.toFixed(0)} kWh/year</div>
            <div>Annual Savings: {annualGenerationKWh.toFixed(0)} × ${ELECTRICITY_RATE} = ${annualSavings.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300">
          These are preliminary estimates. Final system design will be optimized based on your utility rates, 
          roof orientation, shading analysis, and local incentives.
        </p>
      </div>
    </div>
  );
}

export default CompleteSolarPreviewCard;
