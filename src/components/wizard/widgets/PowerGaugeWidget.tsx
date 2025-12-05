/**
 * Power Gauge Widget - Floating Clickable Power Profile Icon
 * ===========================================================
 * 
 * A compact, always-visible gauge icon that shows power adequacy at a glance.
 * Click to expand into a full Power Profile popup showing:
 * - BESS [___kW / ___kWh]
 * - Power [___kW peak demand]
 * - Solar [___kW] (if selected)
 * - Wind [___kW] (if selected)
 * - EV Chargers [___kW] (if selected)
 * - Generator [___kW] (if selected)
 * - Power GAP [___kW] with green checkbox when met
 * 
 * Design: Fuel gauge style (red → yellow → green arc)
 */

import React, { useState } from 'react';
import { 
  X, 
  Battery, 
  Zap, 
  Sun, 
  Wind, 
  Car, 
  Flame,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface PowerGaugeData {
  // BESS Configuration
  bessKW: number;
  bessKWh: number;
  
  // Peak Demand
  peakDemandKW: number;
  
  // Generation Sources (optional)
  solarKW?: number;
  windKW?: number;
  evChargersKW?: number;
  generatorKW?: number;
  
  // Calculated Power Gap
  powerGapKW: number;
  
  // Is the gap closed?
  isGapMet: boolean;
}

interface PowerGaugeWidgetProps {
  data: PowerGaugeData;
  position?: 'fixed' | 'relative' | 'inline';
  className?: string;
}

// ============================================
// MINI GAUGE ICON (Always Visible)
// ============================================

interface MiniGaugeProps {
  percentage: number;
  isGapMet: boolean;
  onClick: () => void;
}

const MiniGauge: React.FC<MiniGaugeProps> = ({ percentage, isGapMet, onClick }) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const angle = -90 + (clampedPercentage / 100) * 180;
  
  // Get color based on percentage
  const getColor = () => {
    if (clampedPercentage >= 100) return '#22c55e'; // green-500
    if (clampedPercentage >= 75) return '#84cc16'; // lime-500
    if (clampedPercentage >= 50) return '#eab308'; // yellow-500
    if (clampedPercentage >= 25) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const needleColor = getColor();
  const bgRingColor = isGapMet ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

  return (
    <button
      onClick={onClick}
      className="relative w-14 h-14 rounded-full bg-slate-900 shadow-lg hover:shadow-xl 
                 transition-all duration-300 hover:scale-110 cursor-pointer
                 border-2 border-slate-700 hover:border-slate-500
                 flex items-center justify-center group"
      title="Click to view Power Profile"
    >
      {/* Outer glow ring */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ 
          boxShadow: `0 0 15px ${needleColor}40`,
          backgroundColor: bgRingColor 
        }}
      />
      
      {/* SVG Gauge */}
      <svg viewBox="0 0 100 60" className="w-12 h-8 relative z-10">
        {/* Background arc segments - Red to Yellow to Green */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Filled arc based on percentage */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${clampedPercentage * 1.26} 126`}
        />
        
        {/* Needle */}
        <g transform={`rotate(${angle} 50 55)`}>
          <line
            x1="50"
            y1="55"
            x2="50"
            y2="20"
            stroke={needleColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="50" cy="55" r="4" fill={needleColor} />
        </g>
        
        {/* Center dot */}
        <circle cx="50" cy="55" r="3" fill="white" />
      </svg>
      
      {/* Status indicator dot */}
      <div 
        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900
                    ${isGapMet ? 'bg-green-500' : 'bg-red-500'} 
                    flex items-center justify-center`}
      >
        {isGapMet ? (
          <CheckCircle className="w-3 h-3 text-white" />
        ) : (
          <AlertTriangle className="w-2.5 h-2.5 text-white" />
        )}
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                      transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
        Power Profile
      </div>
    </button>
  );
};

// ============================================
// POWER PROFILE POPUP MODAL
// ============================================

interface PowerProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: PowerGaugeData;
}

const PowerProfilePopup: React.FC<PowerProfilePopupProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const formatKW = (kw: number) => {
    if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
    return `${Math.round(kw)} kW`;
  };

  const formatKWh = (kwh: number) => {
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
    return `${Math.round(kwh)} kWh`;
  };

  // Calculate total generation
  const totalGeneration = (data.solarKW || 0) + (data.windKW || 0) + (data.generatorKW || 0);
  const percentageMet = data.peakDemandKW > 0 
    ? Math.min(100, ((data.bessKW + totalGeneration) / data.peakDemandKW) * 100)
    : 0;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Power Profile</h2>
                <p className="text-sm text-white/80">Your Energy Configuration</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Power Metrics Grid */}
        <div className="p-4 space-y-3">
          {/* BESS */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500/20 p-2 rounded-lg">
                <Battery className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider">BESS</p>
                <p className="text-lg font-bold text-white">
                  {formatKW(data.bessKW)} / {formatKWh(data.bessKWh)}
                </p>
              </div>
            </div>
          </div>

          {/* Peak Demand */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Peak Demand</p>
                <p className="text-lg font-bold text-white">{formatKW(data.peakDemandKW)}</p>
              </div>
            </div>
          </div>

          {/* Optional Sources - Only show if > 0 */}
          <div className="grid grid-cols-2 gap-3">
            {(data.solarKW ?? 0) > 0 && (
              <div className="bg-slate-800 rounded-xl p-3 border border-yellow-500/30">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-400">Solar</p>
                    <p className="text-sm font-bold text-white">{formatKW(data.solarKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.windKW ?? 0) > 0 && (
              <div className="bg-slate-800 rounded-xl p-3 border border-sky-500/30">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="text-xs text-slate-400">Wind</p>
                    <p className="text-sm font-bold text-white">{formatKW(data.windKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.evChargersKW ?? 0) > 0 && (
              <div className="bg-slate-800 rounded-xl p-3 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-slate-400">EV Chargers</p>
                    <p className="text-sm font-bold text-white">{formatKW(data.evChargersKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.generatorKW ?? 0) > 0 && (
              <div className="bg-slate-800 rounded-xl p-3 border border-red-500/30">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-slate-400">Generator</p>
                    <p className="text-sm font-bold text-white">{formatKW(data.generatorKW!)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Power GAP - The Key Metric */}
          <div className={`rounded-xl p-4 border-2 ${
            data.isGapMet 
              ? 'bg-green-500/10 border-green-500' 
              : 'bg-red-500/10 border-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  data.isGapMet ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {data.isGapMet ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Power GAP</p>
                  <p className={`text-xl font-bold ${
                    data.isGapMet ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.isGapMet ? 'COMPLETE' : formatKW(Math.abs(data.powerGapKW))}
                  </p>
                </div>
              </div>
              
              {data.isGapMet && (
                <div className="bg-green-500 rounded-full p-1">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            {!data.isGapMet && (
              <p className="mt-2 text-sm text-red-300">
                Add {formatKW(Math.abs(data.powerGapKW))} more generation to meet requirements
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">Configuration Progress</span>
              <span className={`font-bold ${data.isGapMet ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.round(percentageMet)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  data.isGapMet 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500'
                }`}
                style={{ width: `${Math.min(percentageMet, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer with tip */}
        <div className="bg-slate-800/50 p-3 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4" />
            <span>Complete the Power GAP to unlock your optimized quote</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN WIDGET COMPONENT
// ============================================

export const PowerGaugeWidget: React.FC<PowerGaugeWidgetProps> = ({
  data,
  position = 'fixed',
  className = ''
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Calculate percentage for the gauge
  const totalPower = data.bessKW + (data.solarKW || 0) + (data.windKW || 0) + (data.generatorKW || 0);
  const percentage = data.peakDemandKW > 0 
    ? Math.min(100, (totalPower / data.peakDemandKW) * 100)
    : 0;

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 right-6 z-50' 
    : position === 'inline'
    ? 'relative inline-flex'
    : 'relative';

  return (
    <>
      <div className={`${positionClasses} ${className}`}>
        <MiniGauge
          percentage={percentage}
          isGapMet={data.isGapMet}
          onClick={() => setIsPopupOpen(true)}
        />
      </div>

      <PowerProfilePopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        data={data}
      />
    </>
  );
};

export default PowerGaugeWidget;
