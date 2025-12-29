/**
 * EV CHARGING CONFIGURATION MODAL
 * ================================
 * Interactive modal for EV charger configuration and load estimation
 * 
 * Features:
 * 1. Existing charger inventory (or none)
 * 2. Desired charger count with type selection
 * 3. Load impact estimation
 * 4. BESS synergy benefits
 * 5. Save/Apply configuration
 */

import React, { useState, useMemo } from 'react';
import {
  X, Zap, PlugZap, Car, Battery, DollarSign, 
  TrendingUp, Check, Plus, Minus, Info, Sparkles,
  Clock, Users, Building2
} from 'lucide-react';

interface EVChargingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: EVChargingConfig) => void;
  stateName: string;
  electricityRate?: number;
  currentConfig?: EVChargingConfig;
}

export interface EVChargingConfig {
  hasExisting: boolean;
  existingL2Count: number;
  existingDCFCCount: number;
  wantNew: boolean;
  desiredL2Count: number;
  desiredDCFCCount: number;
  totalLoadKW: number;
}

// EV Charger Specifications
const EV_CHARGER_SPECS = {
  level2: { 
    kW: 7.2, 
    label: 'Level 2 (7.2 kW)',
    description: 'Standard workplace/destination charging',
    cost: 2500,
    chargeTime: '4-8 hours for full charge'
  },
  dcfc: { 
    kW: 150, 
    label: 'DC Fast Charger (150 kW)',
    description: 'Rapid charging for quick turnaround',
    cost: 75000,
    chargeTime: '15-30 minutes for 80%'
  },
  hpc: {
    kW: 350,
    label: 'High Power Charger (350 kW)',
    description: 'Ultra-fast charging for heavy use',
    cost: 150000,
    chargeTime: '10-15 minutes for 80%'
  }
};

// Concurrency factors (not all chargers used simultaneously)
const CONCURRENCY_FACTORS = {
  level2: 0.3,  // 30% simultaneous use typical
  dcfc: 0.5,    // 50% simultaneous use
  hpc: 0.6      // 60% simultaneous use
};

export const EVChargingConfigModal: React.FC<EVChargingConfigModalProps> = ({
  isOpen,
  onClose,
  onApply,
  stateName,
  electricityRate = 0.12,
  currentConfig,
}) => {
  // State
  const [hasExisting, setHasExisting] = useState(currentConfig?.hasExisting || false);
  const [existingL2Count, setExistingL2Count] = useState(currentConfig?.existingL2Count || 0);
  const [existingDCFCCount, setExistingDCFCCount] = useState(currentConfig?.existingDCFCCount || 0);
  const [wantNew, setWantNew] = useState(currentConfig?.wantNew ?? true);
  const [desiredL2Count, setDesiredL2Count] = useState(currentConfig?.desiredL2Count || 10);
  const [desiredDCFCCount, setDesiredDCFCCount] = useState(currentConfig?.desiredDCFCCount || 2);

  // Calculate total load
  const totalLoadKW = useMemo(() => {
    const existingL2Load = existingL2Count * EV_CHARGER_SPECS.level2.kW * CONCURRENCY_FACTORS.level2;
    const existingDCFCLoad = existingDCFCCount * EV_CHARGER_SPECS.dcfc.kW * CONCURRENCY_FACTORS.dcfc;
    const newL2Load = wantNew ? desiredL2Count * EV_CHARGER_SPECS.level2.kW * CONCURRENCY_FACTORS.level2 : 0;
    const newDCFCLoad = wantNew ? desiredDCFCCount * EV_CHARGER_SPECS.dcfc.kW * CONCURRENCY_FACTORS.dcfc : 0;
    return Math.round(existingL2Load + existingDCFCLoad + newL2Load + newDCFCLoad);
  }, [existingL2Count, existingDCFCCount, wantNew, desiredL2Count, desiredDCFCCount]);

  // Calculate costs
  const totalCost = useMemo(() => {
    if (!wantNew) return 0;
    return (desiredL2Count * EV_CHARGER_SPECS.level2.cost) + 
           (desiredDCFCCount * EV_CHARGER_SPECS.dcfc.cost);
  }, [wantNew, desiredL2Count, desiredDCFCCount]);

  // BESS savings potential
  const bessRecommendedKW = useMemo(() => {
    // BESS sized at ~40% of peak EV load for demand charge management
    return Math.round(totalLoadKW * 0.4);
  }, [totalLoadKW]);

  const annualDemandSavings = useMemo(() => {
    // Average demand charge savings
    return bessRecommendedKW * 15 * 12; // $15/kW/month average
  }, [bessRecommendedKW]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      hasExisting,
      existingL2Count,
      existingDCFCCount,
      wantNew,
      desiredL2Count,
      desiredDCFCCount,
      totalLoadKW,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-900 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-b border-emerald-400/30 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <PlugZap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">EV Charging Setup</h2>
                <p className="text-emerald-300/70">Configure your EV infrastructure</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* ═══════════════════════════════════════════════════════════
              EXISTING CHARGERS SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Current Infrastructure</h3>
            </div>
            
            {/* Toggle: Do you have chargers? */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/80 flex-1">Do you have EV chargers installed?</span>
              <button
                onClick={() => setHasExisting(!hasExisting)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  hasExisting ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                  hasExisting ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Existing charger counts */}
            {hasExisting && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Level 2 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-white/60 mb-2">Level 2 Chargers</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExistingL2Count(Math.max(0, existingL2Count - 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-2xl font-bold text-white w-12 text-center">{existingL2Count}</span>
                    <button
                      onClick={() => setExistingL2Count(existingL2Count + 1)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-white/40 mt-2">{EV_CHARGER_SPECS.level2.kW} kW each</div>
                </div>

                {/* DCFC */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-sm text-white/60 mb-2">DC Fast Chargers</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExistingDCFCCount(Math.max(0, existingDCFCCount - 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-2xl font-bold text-white w-12 text-center">{existingDCFCCount}</span>
                    <button
                      onClick={() => setExistingDCFCCount(existingDCFCCount + 1)}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-white/40 mt-2">{EV_CHARGER_SPECS.dcfc.kW} kW each</div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ADD NEW CHARGERS SECTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Add EV Charging</h3>
            </div>
            
            {/* Toggle: Want new chargers? */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white/80 flex-1">Would you like to add EV chargers?</span>
              <button
                onClick={() => setWantNew(!wantNew)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  wantNew ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                  wantNew ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* New charger configuration */}
            {wantNew && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  {/* Level 2 */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">Level 2</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDesiredL2Count(Math.max(0, desiredL2Count - 5))}
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-3xl font-bold text-white w-16 text-center">{desiredL2Count}</span>
                      <button
                        onClick={() => setDesiredL2Count(desiredL2Count + 5)}
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="text-xs text-white/50 mt-3">
                      {EV_CHARGER_SPECS.level2.description}
                    </div>
                    <div className="text-sm text-emerald-400 mt-2">
                      ~${(desiredL2Count * EV_CHARGER_SPECS.level2.cost).toLocaleString()}
                    </div>
                  </div>

                  {/* DCFC */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-white">DC Fast</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDesiredDCFCCount(Math.max(0, desiredDCFCCount - 1))}
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-3xl font-bold text-white w-16 text-center">{desiredDCFCCount}</span>
                      <button
                        onClick={() => setDesiredDCFCCount(desiredDCFCCount + 1)}
                        className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="text-xs text-white/50 mt-3">
                      {EV_CHARGER_SPECS.dcfc.description}
                    </div>
                    <div className="text-sm text-cyan-400 mt-2">
                      ~${(desiredDCFCCount * EV_CHARGER_SPECS.dcfc.cost).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Total equipment cost */}
                {totalCost > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Total Equipment Cost</span>
                      <span className="text-xl font-bold text-white">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      Installation and make-ready costs additional (~30-50% of equipment)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              LOAD IMPACT & BESS SYNERGY
          ═══════════════════════════════════════════════════════════ */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Battery className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">BESS Synergy</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {totalLoadKW} kW
                </div>
                <div className="text-sm text-white/60 mt-1">Peak EV Load</div>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
                  {bessRecommendedKW} kW
                </div>
                <div className="text-sm text-white/60 mt-1">BESS Recommended</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  ~${annualDemandSavings.toLocaleString()}/year in demand charge savings
                </span>
              </div>
              <div className="text-xs text-white/50 mt-1">
                BESS absorbs EV charging peaks, reducing demand charges significantly
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              BENEFITS LIST
          ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: TrendingUp, text: 'Revenue from charging fees', color: 'text-emerald-400' },
              { icon: Users, text: 'Attract EV drivers', color: 'text-cyan-400' },
              { icon: Sparkles, text: 'Sustainability leadership', color: 'text-purple-400' },
              { icon: Clock, text: 'Future-proof infrastructure', color: 'text-amber-400' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
                <span className="text-sm text-white/70">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-white/60">
              {totalLoadKW > 0 && (
                <span>
                  EV Load: <span className="text-emerald-400 font-bold">{totalLoadKW} kW</span>
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold transition-all shadow-lg shadow-emerald-500/30"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Apply Configuration
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVChargingConfigModal;
