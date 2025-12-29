/**
 * SOLAR OPPORTUNITY MODAL - Comprehensive Solar Planning Tool
 * ===========================================================
 * 
 * December 16, 2025
 * 
 * A comprehensive modal for exploring solar opportunities including:
 * 1. Location-based solar potential (peak sun hours)
 * 2. Solar sizing tools (roof space, ground mount)
 * 3. ROI and savings calculations
 * 4. Solar planning information (incentives, payback, financing)
 * 5. Visual displays and interactive tools
 * 
 * This modal enhances the basic SolarSizingModal with planning features.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sun, Building2, Info, Calculator, CheckCircle, AlertTriangle, 
  TrendingUp, DollarSign, MapPin, Award, Calendar, Zap, BarChart3,
  Lightbulb, Sparkles
} from 'lucide-react';
import type { PhysicalConstraints, WizardState } from '../types/wizardTypes';
import { getPeakSunHours } from '@/services/solarSizingService';

// ============================================
// CONSTANTS
// ============================================

const SQ_FT_PER_KW = 100; // Industry standard: ~100 sq ft per kW for commercial solar
const GROUND_KW_PER_ACRE = 200; // ~200 kW per acre for ground-mount

// Default roof estimates by facility type
const DEFAULT_ROOF_ESTIMATES: Record<string, { sqFt: number; usablePercent: number; description: string }> = {
  'car-wash': { sqFt: 6000, usablePercent: 60, description: 'Typical car wash canopy + building' },
  'hotel': { sqFt: 15000, usablePercent: 50, description: 'Varies by floors; ground-mount may be option' },
  'ev-charging': { sqFt: 8000, usablePercent: 70, description: 'Canopy structures ideal for solar' },
  'office': { sqFt: 25000, usablePercent: 55, description: 'Flat roofs common; HVAC equipment reduces usable area' },
  'retail': { sqFt: 20000, usablePercent: 60, description: 'Big box stores have excellent solar potential' },
  'warehouse': { sqFt: 100000, usablePercent: 70, description: 'Large flat roofs ideal for solar' },
  'hospital': { sqFt: 50000, usablePercent: 40, description: 'HVAC/medical equipment limits roof space' },
  'manufacturing': { sqFt: 75000, usablePercent: 65, description: 'Industrial roofs often good for solar' },
  'data-center': { sqFt: 30000, usablePercent: 45, description: 'Cooling equipment reduces usable roof' },
  'default': { sqFt: 20000, usablePercent: 55, description: 'Average commercial building' },
};

// Solar ratings based on peak sun hours
function getSolarRating(peakSunHours: number): { rating: string; color: string; icon: string } {
  if (peakSunHours >= 5.5) return { rating: 'Excellent', color: 'emerald', icon: '🌟' };
  if (peakSunHours >= 4.5) return { rating: 'Very Good', color: 'green', icon: '⭐' };
  if (peakSunHours >= 3.5) return { rating: 'Good', color: 'yellow', icon: '☀️' };
  if (peakSunHours >= 2.5) return { rating: 'Moderate', color: 'orange', icon: '🌤️' };
  return { rating: 'Fair', color: 'gray', icon: '⛅' };
}

// ============================================
// TYPES
// ============================================

interface SolarOpportunityModalProps {
  show: boolean;
  onClose: () => void;
  onSave?: (constraints: PhysicalConstraints) => void;
  wizardState: WizardState;
  facilityType?: string;
  facilityName?: string;
  currentSolarKW?: number;
}

// ============================================
// COMPONENT
// ============================================

export function SolarOpportunityModal({
  show,
  onClose,
  onSave,
  wizardState,
  facilityType = 'default',
  facilityName = 'facility',
  currentSolarKW = 0,
}: SolarOpportunityModalProps) {
  // Get defaults for this facility type
  const defaults = DEFAULT_ROOF_ESTIMATES[facilityType] || DEFAULT_ROOF_ESTIMATES['default'];
  
  // Location data
  const location = wizardState.state || wizardState.zipCode || 'California';
  const peakSunHours = useMemo(() => getPeakSunHours(location), [location]);
  const solarRating = useMemo(() => getSolarRating(peakSunHours), [peakSunHours]);
  const utilityRate = wizardState.electricityRate || 0.12;
  
  // Local state for sizing tools
  const [roofSpaceSqFt, setRoofSpaceSqFt] = useState<number>(defaults.sqFt);
  const [usablePercent, setUsablePercent] = useState<number>(defaults.usablePercent);
  const [hasGroundSpace, setHasGroundSpace] = useState<boolean>(false);
  const [groundSpaceAcres, setGroundSpaceAcres] = useState<number>(0);
  const [targetSolarKW, setTargetSolarKW] = useState<number>(currentSolarKW || 100);
  
  // Calculate solar capacity
  const roofSolarKW = Math.round((roofSpaceSqFt * (usablePercent / 100)) / SQ_FT_PER_KW);
  const groundSolarKW = hasGroundSpace ? Math.round(groundSpaceAcres * GROUND_KW_PER_ACRE) : 0;
  const totalMaxSolarKW = roofSolarKW + groundSolarKW;
  
  // Calculate annual generation and savings
  const annualGenerationKWh = useMemo(() => {
    const systemKW = Math.min(targetSolarKW, totalMaxSolarKW);
    // Formula: System Size (kW) × Peak Sun Hours × 365 days × 0.85 (system efficiency)
    return Math.round(systemKW * peakSunHours * 365 * 0.85);
  }, [targetSolarKW, totalMaxSolarKW, peakSunHours]);
  
  const annualSavings = useMemo(() => {
    return Math.round(annualGenerationKWh * utilityRate);
  }, [annualGenerationKWh, utilityRate]);
  
  // Estimate system cost (rough: $2.50/W for commercial)
  const estimatedSystemCost = useMemo(() => {
    const systemKW = Math.min(targetSolarKW, totalMaxSolarKW);
    return Math.round(systemKW * 2500); // $2.50/W = $2,500/kW
  }, [targetSolarKW, totalMaxSolarKW]);
  
  // IRA tax credit (30% of system cost)
  const taxCredit = Math.round(estimatedSystemCost * 0.30);
  const netSystemCost = estimatedSystemCost - taxCredit;
  
  // Simple payback (years)
  const paybackYears = annualSavings > 0 ? (netSystemCost / annualSavings) : 0;
  
  // ROI over 25 years
  const roi25Year = annualSavings > 0 
    ? (((annualSavings * 25) - netSystemCost) / netSystemCost) * 100 
    : 0;
  
  // Reset when modal opens
  useEffect(() => {
    if (show) {
      const constraints = wizardState.physicalConstraints || {};
      setRoofSpaceSqFt(constraints.roofSpaceSqFt ?? defaults.sqFt);
      setUsablePercent(constraints.usableRoofPercent ?? defaults.usablePercent);
      setGroundSpaceAcres(constraints.groundSpaceAcres ?? 0);
      setHasGroundSpace((constraints.groundSpaceAcres ?? 0) > 0);
      setTargetSolarKW(currentSolarKW || Math.min(roofSolarKW, 100));
    }
  }, [show, wizardState.physicalConstraints, defaults, currentSolarKW]);
  
  const handleSave = () => {
    if (onSave) {
      onSave({
        roofSpaceSqFt,
        usableRoofPercent: usablePercent,
        maxSolarKW: totalMaxSolarKW,
        groundSpaceAcres: hasGroundSpace ? groundSpaceAcres : null,
        electricalCapacityKW: wizardState.physicalConstraints?.electricalCapacityKW,
        isRefined: true,
      });
    }
    onClose();
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] border-2 border-amber-500/40">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 px-6 py-5 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Solar Opportunity Explorer</h2>
                <p className="text-amber-100 text-sm flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {location} • {solarRating.icon} {solarRating.rating} Solar Potential
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ════════════════════════════════════════════════════════════════
              SECTION 1: SOLAR POTENTIAL OVERVIEW
              ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Peak Sun Hours */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-5 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-emerald-400" />
                <span className="text-emerald-300 font-semibold text-sm">Peak Sun Hours</span>
              </div>
              <p className="text-4xl font-black text-white">{peakSunHours.toFixed(1)}</p>
              <p className="text-emerald-200/70 text-xs mt-2">hours/day average</p>
            </div>
            
            {/* Solar Rating */}
            <div className={`bg-gradient-to-br ${
              solarRating.color === 'emerald' ? 'from-emerald-900/50 to-emerald-800/50 border-emerald-500/30' :
              solarRating.color === 'green' ? 'from-green-900/50 to-green-800/50 border-green-500/30' :
              solarRating.color === 'yellow' ? 'from-yellow-900/50 to-yellow-800/50 border-yellow-500/30' :
              solarRating.color === 'orange' ? 'from-orange-900/50 to-orange-800/50 border-orange-500/30' :
              'from-gray-900/50 to-gray-800/50 border-gray-500/30'
            } rounded-xl p-5 border`}>
              <div className="flex items-center gap-3 mb-3">
                <Award className={`w-6 h-6 ${
                  solarRating.color === 'emerald' ? 'text-emerald-400' :
                  solarRating.color === 'green' ? 'text-green-400' :
                  solarRating.color === 'yellow' ? 'text-yellow-400' :
                  solarRating.color === 'orange' ? 'text-orange-400' :
                  'text-gray-400'
                }`} />
                <span className={`font-semibold text-sm ${
                  solarRating.color === 'emerald' ? 'text-emerald-300' :
                  solarRating.color === 'green' ? 'text-green-300' :
                  solarRating.color === 'yellow' ? 'text-yellow-300' :
                  solarRating.color === 'orange' ? 'text-orange-300' :
                  'text-gray-300'
                }`}>Solar Rating</span>
              </div>
              <p className="text-3xl font-black text-white">{solarRating.rating}</p>
              <p className={`text-xs mt-2 ${
                solarRating.color === 'emerald' ? 'text-emerald-200/70' :
                solarRating.color === 'green' ? 'text-green-200/70' :
                solarRating.color === 'yellow' ? 'text-yellow-200/70' :
                solarRating.color === 'orange' ? 'text-orange-200/70' :
                'text-gray-200/70'
              }`}>{solarRating.icon} Great for solar!</p>
            </div>
            
            {/* Utility Rate */}
            <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-xl p-5 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-blue-400" />
                <span className="text-blue-300 font-semibold text-sm">Utility Rate</span>
              </div>
              <p className="text-4xl font-black text-white">${utilityRate.toFixed(3)}</p>
              <p className="text-blue-200/70 text-xs mt-2">per kWh</p>
            </div>
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 2: SOLAR SIZING TOOLS
              ════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Solar Sizing Calculator</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roof Space Input */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-white font-medium mb-3">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    Available Roof Space
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={roofSpaceSqFt}
                      onChange={(e) => setRoofSpaceSqFt(parseInt(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-xl text-white text-lg font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                    <span className="text-gray-300 font-medium">sq ft</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">{defaults.description}</p>
                </div>
                
                {/* Usable Percentage Slider */}
                <div>
                  <label className="flex items-center justify-between text-white font-medium mb-3">
                    <span>Usable Roof Area</span>
                    <span className="text-amber-400 font-bold text-lg">{usablePercent}%</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={90}
                    value={usablePercent}
                    onChange={(e) => setUsablePercent(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>20% (obstructions)</span>
                    <span>90% (clear roof)</span>
                  </div>
                </div>
                
                {/* Roof Solar Capacity Result */}
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-gray-400 text-sm mb-1">Roof Solar Capacity</p>
                  <p className="text-3xl font-black text-emerald-400">{roofSolarKW} kW</p>
                </div>
              </div>
              
              {/* Ground Mount Option */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasGroundSpace}
                    onChange={(e) => setHasGroundSpace(e.target.checked)}
                    className="w-6 h-6 rounded accent-amber-500"
                  />
                  <span className="text-white font-medium text-lg">I have land for ground-mount solar</span>
                </label>
                
                {hasGroundSpace && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm mb-2 block">Available land (acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={groundSpaceAcres}
                        onChange={(e) => setGroundSpaceAcres(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 rounded-xl text-white text-lg font-bold focus:border-amber-500 transition-all"
                      />
                      <p className="text-gray-500 text-xs mt-2">~{GROUND_KW_PER_ACRE} kW per acre for ground-mount</p>
                    </div>
                    
                    {/* Ground Solar Capacity Result */}
                    <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                      <p className="text-gray-400 text-sm mb-1">Ground Solar Capacity</p>
                      <p className="text-3xl font-black text-emerald-400">{groundSolarKW} kW</p>
                    </div>
                  </div>
                )}
                
                {/* Total Maximum Capacity */}
                <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-4 border-2 border-emerald-500/50">
                  <p className="text-emerald-300 font-semibold text-sm mb-2">Maximum Solar Capacity</p>
                  <p className="text-4xl font-black text-white">{totalMaxSolarKW} kW</p>
                </div>
              </div>
            </div>
            
            {/* Target System Size */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <label className="block text-white font-medium mb-3">
                Target Solar System Size (kW)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={Math.max(totalMaxSolarKW, 500)}
                  step={10}
                  value={targetSolarKW}
                  onChange={(e) => setTargetSolarKW(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="w-32 text-center">
                  <span className="text-3xl font-black text-amber-400">{targetSolarKW}</span>
                  <span className="text-gray-400 text-sm ml-1">kW</span>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Adjust to see projected savings and ROI
              </p>
            </div>
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 3: FINANCIAL ANALYSIS
              ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Financial Analysis</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-gray-400 text-xs mb-1">Annual Generation</p>
                <p className="text-2xl font-black text-white">{annualGenerationKWh.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">kWh/year</p>
              </div>
              
              <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-500/30">
                <p className="text-emerald-300 text-xs mb-1">Annual Savings</p>
                <p className="text-2xl font-black text-emerald-400">${annualSavings.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">per year</p>
              </div>
              
              <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-500/30">
                <p className="text-blue-300 text-xs mb-1">System Cost</p>
                <p className="text-2xl font-black text-blue-400">${estimatedSystemCost.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">before incentives</p>
              </div>
              
              <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-500/30">
                <p className="text-amber-300 text-xs mb-1">Tax Credit (30%)</p>
                <p className="text-2xl font-black text-amber-400">${taxCredit.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">IRA credit</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-5 border border-green-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">Payback Period</span>
                </div>
                <p className="text-4xl font-black text-white">{paybackYears.toFixed(1)}</p>
                <p className="text-green-200/70 text-sm mt-2">years</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-900/50 to-teal-900/50 rounded-xl p-5 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-300 font-semibold">25-Year ROI</span>
                </div>
                <p className="text-4xl font-black text-white">{roi25Year.toFixed(0)}%</p>
                <p className="text-cyan-200/70 text-sm mt-2">return on investment</p>
              </div>
            </div>
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 4: SOLAR PLANNING INFORMATION
              ════════════════════════════════════════════════════════════════ */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Solar Planning & Incentives</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-semibold">Federal Tax Credit (ITC)</span>
                </div>
                <p className="text-white text-sm">
                  <strong>30%</strong> of system cost (through 2032) via the Inflation Reduction Act (IRA).
                  No cap on system size for commercial installations.
                </p>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">State & Local Incentives</span>
                </div>
                <p className="text-white text-sm">
                  Many states offer additional rebates, tax credits, and SREC programs. 
                  Check your local utility and state energy office for details.
                </p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">Accelerated Depreciation</span>
                </div>
                <p className="text-white text-sm">
                  Commercial solar systems qualify for <strong>MACRS depreciation</strong> (5-year),
                  providing additional tax savings.
                </p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 font-semibold">Net Metering</span>
                </div>
                <p className="text-white text-sm">
                  Excess solar generation credits your utility bill at retail rates,
                  maximizing your savings and ROI.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm px-6 py-5 border-t-2 border-slate-700 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 text-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Save Solar Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SolarOpportunityModal;

