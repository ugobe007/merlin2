/**
 * SOLAR SIZING MODAL (Dec 2025)
 * =============================
 * 
 * Per Vineet feedback: "Auto-estimate first, then popup for specific sizing"
 * 
 * This modal allows users to refine their solar recommendation by:
 * 1. Entering actual roof space (sq ft)
 * 2. Adjusting usable roof percentage
 * 3. Seeing real-time max solar capacity calculation
 * 
 * Formula: Max Solar kW = (Roof SqFt × Usable%) / 100 sq ft per kW
 * (Industry standard: ~100 sq ft per kW for commercial solar)
 */

import React, { useState, useEffect } from 'react';
import { X, Sun, Building2, Info, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';
import type { PhysicalConstraints } from '../types/wizardTypes';

// ============================================
// CONSTANTS
// ============================================

// Industry standard: approximately 100 sq ft per kW for commercial solar
const SQ_FT_PER_KW = 100;

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

// ============================================
// TYPES
// ============================================

interface SolarSizingModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (constraints: PhysicalConstraints) => void;
  currentConstraints: PhysicalConstraints;
  facilityType: string;
  facilityName: string;
  currentSolarKW: number; // Currently recommended solar
}

// ============================================
// COMPONENT
// ============================================

export function SolarSizingModal({
  show,
  onClose,
  onSave,
  currentConstraints,
  facilityType,
  facilityName,
  currentSolarKW,
}: SolarSizingModalProps) {
  // Get defaults for this facility type
  const defaults = DEFAULT_ROOF_ESTIMATES[facilityType] || DEFAULT_ROOF_ESTIMATES['default'];
  
  // Local state for editing
  const [roofSpaceSqFt, setRoofSpaceSqFt] = useState<number>(
    currentConstraints.roofSpaceSqFt ?? defaults.sqFt
  );
  const [usablePercent, setUsablePercent] = useState<number>(
    currentConstraints.usableRoofPercent ?? defaults.usablePercent
  );
  const [hasGroundSpace, setHasGroundSpace] = useState<boolean>(
    (currentConstraints.groundSpaceAcres ?? 0) > 0
  );
  const [groundSpaceAcres, setGroundSpaceAcres] = useState<number>(
    currentConstraints.groundSpaceAcres ?? 0
  );
  
  // Calculate max solar capacity
  const roofSolarKW = Math.round((roofSpaceSqFt * (usablePercent / 100)) / SQ_FT_PER_KW);
  const groundSolarKW = hasGroundSpace ? Math.round(groundSpaceAcres * 200) : 0; // ~200 kW per acre ground-mount
  const totalMaxSolarKW = roofSolarKW + groundSolarKW;
  
  // Check if current recommendation exceeds capacity
  const isOverCapacity = currentSolarKW > totalMaxSolarKW;
  const recommendedSolarKW = Math.min(currentSolarKW, totalMaxSolarKW);
  
  // Reset to defaults when modal opens
  useEffect(() => {
    if (show) {
      setRoofSpaceSqFt(currentConstraints.roofSpaceSqFt ?? defaults.sqFt);
      setUsablePercent(currentConstraints.usableRoofPercent ?? defaults.usablePercent);
      setGroundSpaceAcres(currentConstraints.groundSpaceAcres ?? 0);
      setHasGroundSpace((currentConstraints.groundSpaceAcres ?? 0) > 0);
    }
  }, [show, currentConstraints, defaults]);
  
  const handleSave = () => {
    onSave({
      roofSpaceSqFt,
      usableRoofPercent: usablePercent,
      maxSolarKW: totalMaxSolarKW,
      groundSpaceAcres: hasGroundSpace ? groundSpaceAcres : null,
      electricalCapacityKW: currentConstraints.electricalCapacityKW,
      isRefined: true,
    });
    onClose();
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-amber-500/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Refine Solar Sizing</h2>
                <p className="text-amber-100 text-sm">Customize for your {facilityName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 text-sm">
                  <strong>Why this matters:</strong> Solar panel installation requires roof space. 
                  We estimate ~100 sq ft per kW of solar capacity. Refine your numbers for an accurate quote.
                </p>
              </div>
            </div>
          </div>
          
          {/* Current Estimate */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-gray-400 text-sm mb-1">Current Solar Recommendation</p>
            <p className="text-3xl font-bold text-white">{currentSolarKW.toLocaleString()} kW</p>
            {isOverCapacity && (
              <div className="flex items-center gap-2 mt-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Exceeds your roof capacity</span>
              </div>
            )}
          </div>
          
          {/* Roof Space Input */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-white font-medium mb-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Available Roof Space
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={roofSpaceSqFt}
                  onChange={(e) => setRoofSpaceSqFt(parseInt(e.target.value) || 0)}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white text-lg font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <span className="text-gray-400 font-medium">sq ft</span>
              </div>
              <p className="text-gray-500 text-sm mt-1">{defaults.description}</p>
            </div>
            
            {/* Usable Percentage Slider */}
            <div>
              <label className="flex items-center justify-between text-white font-medium mb-2">
                <span>Usable Roof Area</span>
                <span className="text-amber-400 font-bold">{usablePercent}%</span>
              </label>
              <input
                type="range"
                min={20}
                max={90}
                value={usablePercent}
                onChange={(e) => setUsablePercent(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>20% (lots of obstructions)</span>
                <span>90% (clear roof)</span>
              </div>
            </div>
          </div>
          
          {/* Ground Mount Option */}
          <div className="border-t border-slate-700 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGroundSpace}
                onChange={(e) => setHasGroundSpace(e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500"
              />
              <span className="text-white font-medium">I have land for ground-mount solar</span>
            </label>
            
            {hasGroundSpace && (
              <div className="mt-4 ml-8">
                <label className="text-gray-300 text-sm mb-2 block">Available land (acres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={groundSpaceAcres}
                  onChange={(e) => setGroundSpaceAcres(parseFloat(e.target.value) || 0)}
                  className="w-32 px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-amber-500 transition-all"
                />
                <p className="text-gray-500 text-xs mt-1">~200 kW per acre for ground-mount</p>
              </div>
            )}
          </div>
          
          {/* Calculation Result */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-5 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Your Solar Capacity</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Roof: {roofSpaceSqFt.toLocaleString()} sq ft × {usablePercent}%</span>
                <span className="text-white font-medium">{roofSolarKW} kW</span>
              </div>
              {hasGroundSpace && groundSpaceAcres > 0 && (
                <div className="flex justify-between text-gray-300">
                  <span>Ground: {groundSpaceAcres} acres</span>
                  <span className="text-white font-medium">+{groundSolarKW} kW</span>
                </div>
              )}
              <div className="border-t border-emerald-500/30 pt-2 mt-2 flex justify-between">
                <span className="text-emerald-300 font-bold">Maximum Solar Capacity</span>
                <span className="text-2xl font-black text-white">{totalMaxSolarKW} kW</span>
              </div>
            </div>
            
            {/* Recommendation */}
            {isOverCapacity ? (
              <div className="mt-4 p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">We'll adjust to {recommendedSolarKW} kW</span>
                </div>
                <p className="text-amber-200/70 text-sm mt-1">
                  Your roof can't fit {currentSolarKW} kW. We'll optimize within your space constraints.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Great news!</span>
                </div>
                <p className="text-emerald-200/70 text-sm mt-1">
                  You have room for the recommended {currentSolarKW} kW solar array.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-sm px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Apply Constraints
          </button>
        </div>
      </div>
    </div>
  );
}

export default SolarSizingModal;
