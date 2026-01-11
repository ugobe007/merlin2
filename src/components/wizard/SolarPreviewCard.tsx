import React from 'react';
import { Sun } from 'lucide-react';
import { calculateSolarCapacity } from '@/services/TrueQuoteEngine-Solar';
import type { SolarCapacityResult } from '@/services/TrueQuoteEngine-Solar';

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

  const hasCarport = carportInterest !== 'no' && result.carportSolarKW > 0;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Solar Capacity</h3>
        </div>
        <div className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-1 rounded">
          TrueQuote™
        </div>
      </div>

      {/* Main Display */}
      <div className="space-y-3">
        {/* Roof Solar */}
        <div className="flex justify-between items-center">
          <span className="text-slate-300 text-sm">Roof Solar:</span>
          <span className="text-purple-300 font-bold text-lg">
            {result.roofSolarKW.toFixed(1)} kW
          </span>
        </div>

        {/* Carport Solar (if applicable) */}
        {hasCarport && (
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">+ Carport Solar:</span>
            <span className="text-cyan-300 font-bold text-lg">
              +{result.carportSolarKW.toFixed(1)} kW
            </span>
          </div>
        )}

        {/* Divider */}
        {hasCarport && <div className="border-t border-slate-700/50"></div>}

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-slate-200 font-semibold">Total System:</span>
          <span className="text-white font-bold text-2xl">
            {result.totalSolarKW.toFixed(1)} kW
          </span>
        </div>

        {/* Annual Generation */}
        <div className="text-center pt-2 border-t border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Annual Generation</div>
          <div className="text-sm font-semibold text-purple-300">
            {(result.annualGenerationKWh / 1000).toFixed(0)}k kWh/year
          </div>
        </div>
      </div>
    </div>
  );
}

