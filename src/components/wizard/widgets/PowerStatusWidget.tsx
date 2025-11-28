/**
 * Power Status Widget
 * ====================
 * Displays overall system power status (Battery + Generation)
 * Shows checkmark when complete system meets requirements
 * Used in Steps 5-6 to show total system adequacy
 */

import React from 'react';
import { Battery, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPowerMW } from '../steps_v3/modules/PowerCalculations';

export interface PowerStatusProps {
  /** Peak power demand in MW */
  peakDemandMW: number;
  /** Battery storage power in MW */
  batteryMW: number;
  /** Total power generation (solar + wind + generator) in MW */
  totalGenerationMW: number;
  /** Grid available capacity in MW */
  gridAvailableMW?: number;
  /** Grid connection type */
  gridConnection?: 'reliable' | 'unreliable' | 'off-grid';
  /** Show compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const PowerStatusWidget: React.FC<PowerStatusProps> = ({
  peakDemandMW,
  batteryMW,
  totalGenerationMW,
  gridAvailableMW = 0,
  gridConnection = 'reliable',
  compact = false,
  className = ''
}) => {
  // Calculate total configured power
  const totalConfiguredMW = batteryMW + totalGenerationMW;

  // Calculate effective requirement
  let effectiveRequirementMW = peakDemandMW;
  if (gridConnection === 'reliable' && gridAvailableMW > 0) {
    effectiveRequirementMW = Math.max(0, peakDemandMW - gridAvailableMW);
  }

  // Calculate adequacy
  const powerGapMW = Math.max(0, effectiveRequirementMW - totalConfiguredMW);
  const powerSurplusMW = Math.max(0, totalConfiguredMW - effectiveRequirementMW);
  const isSufficient = powerGapMW === 0;
  const percentageMet = effectiveRequirementMW > 0
    ? Math.min(100, (totalConfiguredMW / effectiveRequirementMW) * 100)
    : 0;

  // Status colors
  const statusColor = isSufficient ? 'green' : 'orange';
  const bgColor = isSufficient ? 'bg-green-50' : 'bg-orange-50';
  const borderColor = isSufficient ? 'border-green-500' : 'border-orange-500';
  const textColor = isSufficient ? 'text-green-800' : 'text-orange-800';
  const iconColor = isSufficient ? 'text-green-600' : 'text-orange-600';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${borderColor} ${bgColor} ${className}`}>
        {isSufficient ? (
          <CheckCircle className={`w-4 h-4 ${iconColor}`} />
        ) : (
          <AlertCircle className={`w-4 h-4 ${iconColor}`} />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${textColor}`}>Total Power Status</span>
            <span className={`font-bold ${textColor}`}>
              {formatPowerMW(totalConfiguredMW)} / {formatPowerMW(effectiveRequirementMW)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isSufficient ? (
            <CheckCircle className={`w-6 h-6 ${iconColor}`} />
          ) : (
            <AlertCircle className={`w-6 h-6 ${iconColor}`} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-bold ${textColor}`}>Power Status</h4>
            <span className={`text-xs ${textColor} font-semibold px-2 py-1 rounded bg-white/50`}>
              {isSufficient ? 'ADEQUATE' : 'NEEDS MORE'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-3 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isSufficient ? 'bg-green-600' : 'bg-orange-600'
                }`}
                style={{ width: `${Math.min(percentageMet, 100)}%` }}
              />
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
            <div className="bg-white/50 rounded px-2 py-1">
              <div className="flex items-center gap-1">
                <Battery className="w-3 h-3" />
                <span className="text-xs opacity-75">Battery</span>
              </div>
              <p className={`font-bold ${textColor} text-xs`}>{formatPowerMW(batteryMW)}</p>
            </div>
            <div className="bg-white/50 rounded px-2 py-1">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="text-xs opacity-75">Generation</span>
              </div>
              <p className={`font-bold ${textColor} text-xs`}>{formatPowerMW(totalGenerationMW)}</p>
            </div>
            <div className="bg-white/50 rounded px-2 py-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span className="text-xs opacity-75">Total</span>
              </div>
              <p className={`font-bold ${textColor} text-xs`}>{formatPowerMW(totalConfiguredMW)}</p>
            </div>
          </div>

          {/* Status Message */}
          <div className={`text-sm ${textColor} font-medium`}>
            {isSufficient ? (
              <>
                {powerSurplusMW > 0 ? (
                  <span>✓ System adequate with {formatPowerMW(powerSurplusMW)} surplus</span>
                ) : (
                  <span>✓ System meets requirements exactly</span>
                )}
              </>
            ) : (
              <span>⚠ {formatPowerMW(powerGapMW)} additional capacity needed</span>
            )}
          </div>

          {/* Requirement Info */}
          <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded px-2 py-1">
            Peak demand: {formatPowerMW(peakDemandMW)}
            {gridConnection === 'reliable' && gridAvailableMW > 0 && (
              <> • Grid: {formatPowerMW(gridAvailableMW)} • Required from system: {formatPowerMW(effectiveRequirementMW)}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
