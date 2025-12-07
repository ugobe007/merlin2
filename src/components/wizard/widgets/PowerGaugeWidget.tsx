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
      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl hover:shadow-xl 
                 transition-all duration-300 hover:scale-110 cursor-pointer
                 border-3 border-slate-600 hover:border-slate-400
                 flex items-center justify-center group"
      style={{ borderWidth: '3px' }}
      title="Click to view Power Profile"
    >
      {/* Outer glow ring - HIGH CONTRAST */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ 
          boxShadow: `0 0 25px ${needleColor}60, 0 0 50px ${needleColor}30`,
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
      
      {/* Status indicator dot - LARGER */}
      <div 
        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-800
                    ${isGapMet ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} 
                    flex items-center justify-center`}
      >
        {isGapMet ? (
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-white" />
        )}
      </div>
      
      {/* Hover tooltip - HIGH CONTRAST */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                      transition-opacity bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
        ⚡ Power Profile
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full border-2 border-purple-500/50 overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(147, 51, 234, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - HIGH CONTRAST */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 p-5 border-b-2 border-purple-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/30 p-3 rounded-xl border border-white/20">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">⚡ Power Profile</h2>
                <p className="text-base text-white/90 font-medium">Your Energy Configuration</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-white hover:bg-white/20 rounded-xl p-2 transition-colors border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Power Metrics Grid - HIGH CONTRAST */}
        <div className="p-5 space-y-4">
          {/* BESS */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 rounded-xl p-4 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-500 p-3 rounded-xl shadow-lg shadow-cyan-500/30">
                <Battery className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-cyan-300 uppercase tracking-wider font-bold">🔋 BESS</p>
                <p className="text-2xl font-black text-white">
                  {formatKW(data.bessKW)} / {formatKWh(data.bessKWh)}
                </p>
              </div>
            </div>
          </div>

          {/* Peak Demand */}
          <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 rounded-xl p-4 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-orange-300 uppercase tracking-wider font-bold">⚡ Peak Demand</p>
                <p className="text-2xl font-black text-white">{formatKW(data.peakDemandKW)}</p>
              </div>
            </div>
          </div>

          {/* Optional Sources - HIGH CONTRAST */}
          <div className="grid grid-cols-2 gap-4">
            {(data.solarKW ?? 0) > 0 && (
              <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/10 rounded-xl p-4 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/10">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 p-2 rounded-lg shadow-lg shadow-yellow-500/30">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-300 font-bold">☀️ Solar</p>
                    <p className="text-xl font-black text-white">{formatKW(data.solarKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.windKW ?? 0) > 0 && (
              <div className="bg-gradient-to-br from-sky-600/20 to-blue-600/10 rounded-xl p-4 border-2 border-sky-500/50 shadow-lg shadow-sky-500/10">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500 p-2 rounded-lg shadow-lg shadow-sky-500/30">
                    <Wind className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-sky-300 font-bold">💨 Wind</p>
                    <p className="text-xl font-black text-white">{formatKW(data.windKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.evChargersKW ?? 0) > 0 && (
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/10 rounded-xl p-4 border-2 border-green-500/50 shadow-lg shadow-green-500/10">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg shadow-lg shadow-green-500/30">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-300 font-bold">🚗 EV Chargers</p>
                    <p className="text-xl font-black text-white">{formatKW(data.evChargersKW!)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(data.generatorKW ?? 0) > 0 && (
              <div className="bg-gradient-to-br from-red-600/20 to-orange-600/10 rounded-xl p-4 border-2 border-red-500/50 shadow-lg shadow-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg shadow-lg shadow-red-500/30">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-300 font-bold">🔥 Generator</p>
                    <p className="text-xl font-black text-white">{formatKW(data.generatorKW!)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Power GAP - HIGH CONTRAST */}
          <div className={`rounded-2xl p-5 border-3 ${
            data.isGapMet 
              ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/20 border-green-400 shadow-xl shadow-green-500/20' 
              : 'bg-gradient-to-r from-red-600/30 to-orange-600/20 border-red-400 shadow-xl shadow-red-500/20'
          }`} style={{ borderWidth: '3px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-lg ${
                  data.isGapMet ? 'bg-green-500 shadow-green-500/40' : 'bg-red-500 shadow-red-500/40'
                }`}>
                  {data.isGapMet ? (
                    <CheckCircle className="w-7 h-7 text-white" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-300 uppercase tracking-wider font-bold">⚡ Power GAP</p>
                  <p className={`text-3xl font-black ${
                    data.isGapMet ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {data.isGapMet ? '✅ COMPLETE' : formatKW(Math.abs(data.powerGapKW))}
                  </p>
                </div>
              </div>
              
              {data.isGapMet && (
                <div className="bg-green-500 rounded-full p-2 shadow-lg shadow-green-500/50">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            
            {!data.isGapMet && (
              <p className="mt-3 text-base text-red-200 font-medium">
                ⚠️ Add {formatKW(Math.abs(data.powerGapKW))} more generation to meet requirements
              </p>
            )}
          </div>

          {/* Progress Bar - HIGH CONTRAST */}
          <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-xl p-4 border-2 border-gray-600">
            <div className="flex items-center justify-between text-base mb-3">
              <span className="text-gray-300 font-bold">📊 Configuration Progress</span>
              <span className={`font-black text-xl ${data.isGapMet ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.round(percentageMet)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border border-gray-600">
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

        {/* Footer with tip - HIGH CONTRAST */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-4 border-t-2 border-purple-500/30">
          <div className="flex items-center gap-3 text-base text-purple-200">
            <Info className="w-5 h-5 text-purple-400" />
            <span className="font-medium">💡 Complete the Power GAP to unlock your optimized quote</span>
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
