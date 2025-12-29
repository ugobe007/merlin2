/**
 * Power Meter Widget
 * ====================
 * Displays power generation capacity vs requirement
 * Shows RED when insufficient, GREEN when adequate with beautiful gauge
 * Used in Steps 2-6 to track power generation adequacy
 * NOW CLICKABLE - Shows explanation modal when clicked
 */

import React, { useState } from 'react';
import { Zap, AlertCircle, CheckCircle, X, Info, HelpCircle } from 'lucide-react';
import { formatPower } from '../constants/wizardConstants';

// Helper to format MW values (converts kW input to readable format)
const formatPowerMW = (mw: number): string => {
  const kw = mw * 1000;
  return formatPower(kw);
};

/**
 * Power Explanation Modal - Explains what the numbers mean
 */
interface PowerExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalGenerationMW: number;
  effectiveRequirementMW: number;
  peakDemandMW: number;
  gridAvailableMW: number;
  gridConnection: string;
  isSufficient: boolean;
}

const PowerExplanationModal: React.FC<PowerExplanationModalProps> = ({
  isOpen,
  onClose,
  totalGenerationMW,
  effectiveRequirementMW,
  peakDemandMW,
  gridAvailableMW,
  gridConnection,
  isSufficient
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Understanding Your Power Status</h2>
                <p className="text-sm opacity-90">What these numbers mean for your project</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${isSufficient ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {isSufficient ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <p className={`font-bold ${isSufficient ? 'text-green-800' : 'text-red-800'}`}>
                {isSufficient ? '✓ Power Generation is Sufficient' : '⚠ Additional Power Generation Needed'}
              </p>
              <p className={`text-sm ${isSufficient ? 'text-green-700' : 'text-red-700'}`}>
                {formatPowerMW(totalGenerationMW)} of {formatPowerMW(effectiveRequirementMW)} required
              </p>
            </div>
          </div>

          {/* Explanation Sections */}
          <div className="space-y-4">
            {/* Power Generation Explained */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-100 p-1.5 rounded-lg">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-800">Power Generation ({formatPowerMW(totalGenerationMW)})</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                This is your <strong>total configured power sources</strong> - the combined capacity of:
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>☀️ <strong>Solar panels</strong> - Generate power during daylight hours</li>
                <li>💨 <strong>Wind turbines</strong> - Generate power when wind is available</li>
                <li>⚡ <strong>Backup generators</strong> - Provide reliable on-demand power</li>
              </ul>
            </div>

            {/* Required Power Explained */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-bold text-slate-800">Required Power ({formatPowerMW(effectiveRequirementMW)})</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                This is the <strong>power you need to generate</strong> based on your grid situation:
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>🏭 <strong>Peak Demand:</strong> {formatPowerMW(peakDemandMW)} (your facility's maximum load)</li>
                {gridConnection === 'reliable' && gridAvailableMW > 0 && (
                  <li>🔌 <strong>Grid Supply:</strong> -{formatPowerMW(gridAvailableMW)} (reliable grid covers this)</li>
                )}
                {gridConnection === 'off-grid' && (
                  <li>🏝️ <strong>Off-Grid:</strong> You must generate 100% of your power needs</li>
                )}
                {gridConnection === 'unreliable' && (
                  <li>⚠️ <strong>Unreliable Grid:</strong> Backup generation recommended for stability</li>
                )}
              </ul>
            </div>

            {/* Navigation Bar Explained */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-bold">Understanding the Status Bar</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70 mb-1">Peak</p>
                  <p className="font-bold">{formatPowerMW(peakDemandMW)}</p>
                  <p className="text-xs text-white/60 mt-1">Maximum facility load</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70 mb-1">Grid</p>
                  <p className="font-bold">{formatPowerMW(gridAvailableMW)}</p>
                  <p className="text-xs text-white/60 mt-1">Power from utility grid</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70 mb-1">Battery</p>
                  <p className="font-bold">X.X MW</p>
                  <p className="text-xs text-white/60 mt-1">Energy storage capacity</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70 mb-1">Solar/Gen</p>
                  <p className="font-bold">{formatPowerMW(totalGenerationMW)}</p>
                  <p className="text-xs text-white/60 mt-1">On-site generation</p>
                </div>
              </div>
            </div>

            {/* What This Means */}
            <div className={`rounded-xl p-4 ${isSufficient ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${isSufficient ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <HelpCircle className={`w-4 h-4 ${isSufficient ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
                <h3 className={`font-bold ${isSufficient ? 'text-green-800' : 'text-amber-800'}`}>
                  What This Means For You
                </h3>
              </div>
              {isSufficient ? (
                <p className="text-sm text-green-700">
                  ✅ Your power configuration is complete! You have enough generation capacity 
                  to meet your facility's needs. The system will use battery storage to smooth 
                  out peak demands and provide backup power during outages.
                </p>
              ) : (
                <p className="text-sm text-amber-700">
                  ⚠️ You need to add more power generation sources. Consider adding solar panels, 
                  wind turbines, or backup generators to close the gap. Without sufficient generation, 
                  your facility may experience power shortfalls during grid outages.
                </p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Gauge Component - Beautiful semi-circular meter like speedometer
 */
interface GaugeProps {
  percentage: number; // 0-100
  isSufficient: boolean;
}

const Gauge: React.FC<GaugeProps> = ({ percentage, isSufficient }) => {
  // Clamp percentage between 0-100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  // Calculate rotation angle (-90 to 90 degrees for 180° arc)
  const angle = -90 + (clampedPercentage / 100) * 180;
  
  // Color zones based on percentage
  const getColorForSegment = (segmentStart: number, segmentEnd: number) => {
    if (clampedPercentage < segmentStart) return '#e5e7eb'; // gray-200 - not reached
    if (clampedPercentage >= segmentEnd) return getSegmentColor(segmentEnd); // fully covered
    return getSegmentColor(clampedPercentage); // in progress
  };
  
  const getSegmentColor = (pct: number) => {
    if (pct <= 25) return '#ef4444'; // red-500
    if (pct <= 50) return '#f97316'; // orange-500
    if (pct <= 75) return '#eab308'; // yellow-500
    if (pct <= 90) return '#84cc16'; // lime-500
    return '#22c55e'; // green-500
  };

  return (
    <div className="relative w-48 h-24">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        {/* Background arc segments */}
        <path
          d="M 20 90 A 80 80 0 0 1 60 20"
          fill="none"
          stroke={getColorForSegment(0, 25)}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 60 20 A 80 80 0 0 1 100 10"
          fill="none"
          stroke={getColorForSegment(25, 50)}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 100 10 A 80 80 0 0 1 140 20"
          fill="none"
          stroke={getColorForSegment(50, 75)}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 140 20 A 80 80 0 0 1 180 90"
          fill="none"
          stroke={getColorForSegment(75, 100)}
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Center white circle */}
        <circle cx="100" cy="90" r="8" fill="white" stroke="#1e293b" strokeWidth="2" />
        
        {/* Needle */}
        <g transform={`rotate(${angle} 100 90)`}>
          <path
            d="M 100 90 L 95 85 L 100 20 L 105 85 Z"
            fill="#1e293b"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <circle cx="100" cy="90" r="6" fill="#1e293b" />
        </g>
      </svg>
      
      {/* Center value display */}
      <div className="absolute inset-0 flex items-end justify-center pb-2">
        <div className="text-center">
          <div className={`text-2xl font-bold ${isSufficient ? 'text-green-600' : 'text-red-600'}`}>
            {Math.round(clampedPercentage)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PowerMeterProps {
  /** Peak power demand in MW */
  peakDemandMW: number;
  /** Total power generation configured (solar + wind + generator) */
  totalGenerationMW: number;
  /** Grid available capacity in MW (0 for off-grid) */
  gridAvailableMW?: number;
  /** Grid connection type */
  gridConnection?: 'reliable' | 'unreliable' | 'off-grid';
  /** Show compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const PowerMeterWidget: React.FC<PowerMeterProps> = ({
  peakDemandMW,
  totalGenerationMW,
  gridAvailableMW = 0,
  gridConnection = 'reliable',
  compact = false,
  className = ''
}) => {
  // Modal state
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate effective requirement based on grid
  let effectiveRequirementMW = peakDemandMW;
  if (gridConnection === 'reliable' && gridAvailableMW > 0) {
    effectiveRequirementMW = Math.max(0, peakDemandMW - gridAvailableMW);
  }

  // Calculate gap/surplus
  const powerGapMW = Math.max(0, effectiveRequirementMW - totalGenerationMW);
  const isSufficient = powerGapMW === 0;
  const percentageMet = effectiveRequirementMW > 0 
    ? Math.min(100, (totalGenerationMW / effectiveRequirementMW) * 100)
    : 0;

  // Status colors
  const statusColor = isSufficient ? 'green' : 'red';
  const bgColor = isSufficient ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSufficient ? 'border-green-500' : 'border-red-500';
  const textColor = isSufficient ? 'text-green-800' : 'text-red-800';
  const iconColor = isSufficient ? 'text-green-600' : 'text-red-600';

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowExplanation(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${borderColor} ${bgColor} ${className} cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]`}
          title="Click to learn what these numbers mean"
        >
          {isSufficient ? (
            <CheckCircle className={`w-4 h-4 ${iconColor}`} />
          ) : (
            <AlertCircle className={`w-4 h-4 ${iconColor}`} />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${textColor}`}>Power Generation</span>
              <span className={`font-bold ${textColor}`}>
                {formatPowerMW(totalGenerationMW)} / {formatPowerMW(effectiveRequirementMW)}
              </span>
            </div>
          </div>
        </button>
        
        <PowerExplanationModal
          isOpen={showExplanation}
          onClose={() => setShowExplanation(false)}
          totalGenerationMW={totalGenerationMW}
          effectiveRequirementMW={effectiveRequirementMW}
          peakDemandMW={peakDemandMW}
          gridAvailableMW={gridAvailableMW}
          gridConnection={gridConnection}
          isSufficient={isSufficient}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowExplanation(true)}
        className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 ${className} cursor-pointer hover:shadow-lg transition-all text-left w-full`}
        title="Click to learn what these numbers mean"
      >
        <div className="flex items-start gap-3">
          <Zap className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-1`} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-bold ${textColor}`}>Power Generation Meter</h4>
              {isSufficient ? (
                <CheckCircle className={`w-5 h-5 ${iconColor}`} />
              ) : (
                <AlertCircle className={`w-5 h-5 ${iconColor}`} />
              )}
            </div>

            {/* Beautiful Gauge Meter */}
            <div className="flex justify-center mb-3">
              <Gauge percentage={percentageMet} isSufficient={isSufficient} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className={`text-xs ${textColor} opacity-75`}>Required</p>
                <p className={`font-bold ${textColor}`}>{formatPowerMW(effectiveRequirementMW)}</p>
              </div>
              <div>
                <p className={`text-xs ${textColor} opacity-75`}>Generated</p>
                <p className={`font-bold ${textColor}`}>{formatPowerMW(totalGenerationMW)}</p>
              </div>
            </div>

            {/* Status Message */}
            <div className={`mt-3 text-sm ${textColor} font-medium`}>
              {isSufficient ? (
                <span>✓ Generation meets requirements</span>
              ) : (
                <span>⚠ {formatPowerMW(powerGapMW)} additional generation needed</span>
              )}
            </div>

            {/* Grid info if applicable */}
            {gridConnection === 'reliable' && gridAvailableMW > 0 && (
              <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded px-2 py-1">
                Grid provides {formatPowerMW(gridAvailableMW)} • Total needed: {formatPowerMW(peakDemandMW)}
              </div>
            )}
          </div>
        </div>
      </button>
      
      <PowerExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        totalGenerationMW={totalGenerationMW}
        effectiveRequirementMW={effectiveRequirementMW}
        peakDemandMW={peakDemandMW}
        gridAvailableMW={gridAvailableMW}
        gridConnection={gridConnection}
        isSufficient={isSufficient}
      />
    </>
  );
};