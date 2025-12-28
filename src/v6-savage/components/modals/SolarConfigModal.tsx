/**
 * SOLAR CONFIGURATION MODAL (Compact)
 * ====================================
 * Focused modal for solar configuration questions
 * Replaces inline questions in Step 3
 * 
 * Flow:
 * 1. Do you have solar? (toggle)
 * 2. If yes: How much do you have?
 * 3. If no: Would you like solar? → How much?
 * 4. Apply configuration
 */

import React, { useState, useMemo } from 'react';
import {
  X, Sun, Zap, Battery, DollarSign, 
  TrendingUp, Check, Plus, Minus, Sparkles,
  Leaf, PiggyBank
} from 'lucide-react';

interface SolarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: SolarConfig) => void;
  stateName: string;
  electricityRate?: number;
  batteryKW?: number;
  currentConfig?: SolarConfig;
}

export interface SolarConfig {
  hasSolar: boolean;
  existingSolarKW: number;
  wantSolar: boolean;
  desiredSolarKW: number;
  totalSolarKW: number;
}

// Solar preset options
const SOLAR_PRESETS = [
  { kW: 100, label: '100 kW', description: 'Small pilot' },
  { kW: 250, label: '250 kW', description: 'Single building' },
  { kW: 500, label: '500 kW', description: 'Multi-building' },
  { kW: 1000, label: '1 MW', description: 'Medium campus' },
  { kW: 2000, label: '2 MW', description: 'Large installation' },
  { kW: 5000, label: '5 MW', description: 'Utility scale' },
];

// Solar potential by state (Peak Sun Hours - NREL data)
// PSH = Average daily hours of 1000W/m² solar irradiance
const STATE_SOLAR_DATA: Record<string, { sunHours: number; tier: 'excellent' | 'good' | 'moderate' | 'fair' }> = {
  // Excellent (5.5+ PSH) - Southwest & Sun Belt
  'Arizona': { sunHours: 6.5, tier: 'excellent' },
  'Nevada': { sunHours: 6.2, tier: 'excellent' },
  'New Mexico': { sunHours: 6.4, tier: 'excellent' },
  'California': { sunHours: 5.8, tier: 'excellent' },
  'Utah': { sunHours: 5.7, tier: 'excellent' },
  'Colorado': { sunHours: 5.5, tier: 'excellent' },
  'Texas': { sunHours: 5.5, tier: 'excellent' },
  'Florida': { sunHours: 5.4, tier: 'excellent' },
  'Hawaii': { sunHours: 5.5, tier: 'excellent' },
  
  // Good (4.5-5.4 PSH) - Southern & Central states
  'Georgia': { sunHours: 5.0, tier: 'good' },
  'South Carolina': { sunHours: 5.0, tier: 'good' },
  'Oklahoma': { sunHours: 5.1, tier: 'good' },
  'Kansas': { sunHours: 5.0, tier: 'good' },
  'Nebraska': { sunHours: 4.9, tier: 'good' },
  'North Carolina': { sunHours: 4.8, tier: 'good' },
  'Alabama': { sunHours: 4.9, tier: 'good' },
  'Mississippi': { sunHours: 4.8, tier: 'good' },
  'Louisiana': { sunHours: 4.8, tier: 'good' },
  'Tennessee': { sunHours: 4.7, tier: 'good' },
  'Arkansas': { sunHours: 4.8, tier: 'good' },
  'Missouri': { sunHours: 4.6, tier: 'good' },
  'Virginia': { sunHours: 4.6, tier: 'good' },
  'Wyoming': { sunHours: 5.1, tier: 'good' },
  'Montana': { sunHours: 4.8, tier: 'good' },
  'Idaho': { sunHours: 4.9, tier: 'good' },
  'New Jersey': { sunHours: 4.5, tier: 'good' },
  'Maryland': { sunHours: 4.5, tier: 'good' },
  'Delaware': { sunHours: 4.5, tier: 'good' },
  'South Dakota': { sunHours: 4.8, tier: 'good' },
  'North Dakota': { sunHours: 4.6, tier: 'good' },
  
  // Moderate (4.0-4.4 PSH) - Northeast & Midwest
  'New York': { sunHours: 4.2, tier: 'moderate' },
  'Pennsylvania': { sunHours: 4.2, tier: 'moderate' },
  'Illinois': { sunHours: 4.4, tier: 'moderate' },
  'Indiana': { sunHours: 4.3, tier: 'moderate' },
  'Ohio': { sunHours: 4.1, tier: 'moderate' },
  'Kentucky': { sunHours: 4.4, tier: 'moderate' },
  'West Virginia': { sunHours: 4.2, tier: 'moderate' },
  'Iowa': { sunHours: 4.4, tier: 'moderate' },
  'Minnesota': { sunHours: 4.3, tier: 'moderate' },
  'Wisconsin': { sunHours: 4.2, tier: 'moderate' },
  'Michigan': { sunHours: 4.0, tier: 'moderate' },
  'Massachusetts': { sunHours: 4.2, tier: 'moderate' },
  'Connecticut': { sunHours: 4.2, tier: 'moderate' },
  'Rhode Island': { sunHours: 4.2, tier: 'moderate' },
  'New Hampshire': { sunHours: 4.1, tier: 'moderate' },
  'Vermont': { sunHours: 4.0, tier: 'moderate' },
  'Maine': { sunHours: 4.1, tier: 'moderate' },
  
  // Fair (< 4.0 PSH) - Pacific Northwest
  'Washington': { sunHours: 3.8, tier: 'fair' },
  'Oregon': { sunHours: 3.9, tier: 'fair' },
  'Alaska': { sunHours: 3.2, tier: 'fair' },
  
  'default': { sunHours: 4.5, tier: 'moderate' },
};

export const SolarConfigModal: React.FC<SolarConfigModalProps> = ({
  isOpen,
  onClose,
  onApply,
  stateName,
  electricityRate = 0.12,
  batteryKW = 500,
  currentConfig,
}) => {
  // State
  const [hasSolar, setHasSolar] = useState(currentConfig?.hasSolar || false);
  const [existingSolarKW, setExistingSolarKW] = useState(currentConfig?.existingSolarKW || 0);
  const [wantSolar, setWantSolar] = useState(currentConfig?.wantSolar ?? true);
  const [desiredSolarKW, setDesiredSolarKW] = useState(currentConfig?.desiredSolarKW || 500);

  // Get solar data for state
  const solarData = STATE_SOLAR_DATA[stateName] || STATE_SOLAR_DATA.default;

  // Calculate total solar
  const totalSolarKW = useMemo(() => {
    if (hasSolar) return existingSolarKW;
    if (wantSolar) return desiredSolarKW;
    return 0;
  }, [hasSolar, existingSolarKW, wantSolar, desiredSolarKW]);

  // Financial calculations
  const annualProduction = totalSolarKW * solarData.sunHours * 365;
  const annualSavings = annualProduction * electricityRate;
  const systemCost = totalSolarKW * 850; // $850/kW commercial
  const itcCredit = systemCost * 0.30;
  const netCost = systemCost - itcCredit;
  const paybackYears = netCost / annualSavings;

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      hasSolar,
      existingSolarKW,
      wantSolar,
      desiredSolarKW,
      totalSolarKW,
    });
    onClose();
  };

  // Tier badge color
  const tierColors = {
    excellent: 'bg-amber-500 text-black',
    good: 'bg-yellow-500 text-black',
    moderate: 'bg-orange-500 text-white',
    fair: 'bg-slate-500 text-white',
  };

  // Tier descriptions
  const tierDescriptions = {
    excellent: 'Premium solar location',
    good: 'Above average solar potential',
    moderate: 'Average solar potential',
    fair: 'Below average, but still viable',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl shadow-amber-500/20">
        
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-b border-amber-400/30 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Solar Configuration</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-300/70">{stateName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tierColors[solarData.tier]}`}>
                    {solarData.tier.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Peak Sun Hours Display */}
          <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider">Peak Sun Hours (Daily Avg)</div>
                <div className="text-2xl font-bold text-amber-300">{solarData.sunHours} hours/day</div>
                <div className="text-white/50 text-xs mt-1">{tierDescriptions[solarData.tier]}</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-xs uppercase tracking-wider">Annual Equivalent</div>
                <div className="text-lg font-bold text-white">{Math.round(solarData.sunHours * 365).toLocaleString()} hrs/yr</div>
                <div className="text-white/50 text-xs mt-1">NREL Solar Resource Data</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════
              EXISTING SOLAR QUESTION
          ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-white flex-1 font-medium">Do you have solar installed?</span>
              <button
                onClick={() => setHasSolar(!hasSolar)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  hasSolar ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                  hasSolar ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* If has solar: How much? */}
            {hasSolar && (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-white font-medium mb-4">How much solar do you have?</div>
                <div className="grid grid-cols-3 gap-2">
                  {SOLAR_PRESETS.map((preset) => (
                    <button
                      key={preset.kW}
                      onClick={() => setExistingSolarKW(preset.kW)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        existingSolarKW === preset.kW
                          ? 'bg-amber-500 text-black ring-2 ring-amber-300'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="font-bold">{preset.label}</div>
                      <div className="text-xs opacity-70">{preset.description}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-white/70 text-sm">Custom:</span>
                  <input
                    type="number"
                    value={existingSolarKW}
                    onChange={(e) => setExistingSolarKW(Math.max(0, Number(e.target.value)))}
                    className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-center"
                  />
                  <span className="text-white/70 text-sm">kW</span>
                </div>
              </div>
            )}

            {/* If no solar: Want solar? */}
            {!hasSolar && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white flex-1 font-medium">Would you like to add solar?</span>
                  <button
                    onClick={() => setWantSolar(!wantSolar)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      wantSolar ? 'bg-amber-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                      wantSolar ? 'translate-x-9' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* If want solar: How much? */}
                {wantSolar && (
                  <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="text-white font-medium mb-4">How much solar would you like?</div>
                    <div className="grid grid-cols-3 gap-2">
                      {SOLAR_PRESETS.map((preset) => (
                        <button
                          key={preset.kW}
                          onClick={() => setDesiredSolarKW(preset.kW)}
                          className={`p-3 rounded-xl text-center transition-all ${
                            desiredSolarKW === preset.kW
                              ? 'bg-amber-500 text-black ring-2 ring-amber-300'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          <div className="font-bold">{preset.label}</div>
                          <div className="text-xs opacity-70">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-white/70 text-sm">Custom:</span>
                      <input
                        type="number"
                        value={desiredSolarKW}
                        onChange={(e) => setDesiredSolarKW(Math.max(0, Number(e.target.value)))}
                        className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-center"
                      />
                      <span className="text-white/70 text-sm">kW</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SOLAR + BESS SYNERGY
          ═══════════════════════════════════════════════════════════ */}
          {totalSolarKW > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-amber-500/10 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Solar + BESS Synergy</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-amber-400">{totalSolarKW.toLocaleString()}</div>
                  <div className="text-xs text-white/60">kW Solar</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-green-400">{Math.round(annualProduction / 1000).toLocaleString()}</div>
                  <div className="text-xs text-white/60">MWh/year</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-2xl font-black text-emerald-400">${Math.round(annualSavings / 1000)}K</div>
                  <div className="text-xs text-white/60">Savings/year</div>
                </div>
              </div>

              {/* Financial details */}
              {!hasSolar && wantSolar && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>System Cost:</span>
                    <span>${systemCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span>30% ITC Credit:</span>
                    <span>-${itcCredit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2">
                    <span>Net Cost:</span>
                    <span>${netCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span>Payback:</span>
                    <span>{paybackYears.toFixed(1)} years</span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400">
                  <Battery className="w-4 h-4" />
                  <span className="font-medium">
                    BESS stores excess solar for use after sunset
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Benefits list */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: PiggyBank, text: 'Reduce energy costs', color: 'text-amber-400' },
              { icon: Leaf, text: 'Zero carbon energy', color: 'text-green-400' },
              { icon: TrendingUp, text: 'Hedge against rate hikes', color: 'text-purple-400' },
              { icon: Zap, text: 'Energy independence', color: 'text-cyan-400' },
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
              {totalSolarKW > 0 && (
                <span>
                  Solar: <span className="text-amber-400 font-bold">{totalSolarKW.toLocaleString()} kW</span>
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold transition-all shadow-lg shadow-amber-500/30"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Apply
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarConfigModal;
