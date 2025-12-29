/**
 * SOLAR OPPORTUNITY MODAL
 * =======================
 * Interactive modal for solar sizing and savings estimation
 * 
 * Features:
 * 1. Energy opportunity overview
 * 2. Financial benefits (savings, arbitrage, grid independence)
 * 3. Solar sizing slider based on building square footage
 * 4. Guidance tips
 * 5. Save/Apply configuration
 */

import React, { useState, useEffect } from 'react';
import {
  Sun, X, DollarSign, Zap, Leaf, TrendingDown, Battery, 
  Building2, Ruler, Sparkles, CheckCircle, Info, ArrowRight,
  PiggyBank, PlugZap, ShieldCheck, HelpCircle
} from 'lucide-react';

interface SolarOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (solarKW: number) => void;
  stateName: string;
  currentSolarKW?: number;
  electricityRate?: number;
}

// Solar potential by state (average peak sun hours per day)
const STATE_SOLAR_DATA: Record<string, { sunHours: number; tier: 'excellent' | 'good' | 'moderate' }> = {
  'Arizona': { sunHours: 6.5, tier: 'excellent' },
  'California': { sunHours: 5.8, tier: 'excellent' },
  'Nevada': { sunHours: 6.2, tier: 'excellent' },
  'New Mexico': { sunHours: 6.0, tier: 'excellent' },
  'Texas': { sunHours: 5.5, tier: 'excellent' },
  'Utah': { sunHours: 5.7, tier: 'excellent' },
  'Colorado': { sunHours: 5.5, tier: 'excellent' },
  'Florida': { sunHours: 5.4, tier: 'excellent' },
  'Hawaii': { sunHours: 5.5, tier: 'excellent' },
  'Georgia': { sunHours: 5.0, tier: 'good' },
  'North Carolina': { sunHours: 4.8, tier: 'good' },
  'South Carolina': { sunHours: 5.0, tier: 'good' },
  'Oklahoma': { sunHours: 5.2, tier: 'good' },
  'Louisiana': { sunHours: 4.8, tier: 'good' },
  'default': { sunHours: 4.5, tier: 'moderate' },
};

export const SolarOpportunityModal: React.FC<SolarOpportunityModalProps> = ({
  isOpen,
  onClose,
  onApply,
  stateName,
  currentSolarKW = 0,
  electricityRate = 0.12,
}) => {
  const [activeTab, setActiveTab] = useState<'energy' | 'financial' | 'sizing' | 'guidance'>('energy');
  const [buildingSqFt, setBuildingSqFt] = useState(10000);
  const [roofUsagePercent, setRoofUsagePercent] = useState(70);
  const [estimatedSolarKW, setEstimatedSolarKW] = useState(currentSolarKW || 100);

  // Get solar data for state
  const solarData = STATE_SOLAR_DATA[stateName] || STATE_SOLAR_DATA.default;

  // Calculate solar system size based on building footprint
  // Rule of thumb: ~15-20 watts per sq ft of usable roof space
  // Commercial panels: ~400W per panel, ~18 sq ft per panel
  useEffect(() => {
    const usableRoofSqFt = buildingSqFt * (roofUsagePercent / 100);
    const estimatedKW = Math.round((usableRoofSqFt * 17) / 1000); // 17W per sq ft average
    setEstimatedSolarKW(Math.max(10, estimatedKW));
  }, [buildingSqFt, roofUsagePercent]);

  // Calculate financial projections
  const annualProduction = estimatedSolarKW * solarData.sunHours * 365; // kWh/year
  const annualSavings = annualProduction * electricityRate;
  const systemCost = estimatedSolarKW * 850; // $850/kW commercial average
  const paybackYears = systemCost / annualSavings;
  const itcCredit = systemCost * 0.30; // 30% ITC
  const netCost = systemCost - itcCredit;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-b border-amber-400/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">Solar Opportunity</h2>
              <p className="text-amber-200/80">
                {stateName} • {solarData.sunHours} peak sun hours/day • 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  solarData.tier === 'excellent' ? 'bg-green-500/30 text-green-300' :
                  solarData.tier === 'good' ? 'bg-blue-500/30 text-blue-300' :
                  'bg-gray-500/30 text-gray-300'
                }`}>
                  {solarData.tier.toUpperCase()}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'energy', label: 'Energy', icon: Zap },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'sizing', label: 'Sizing', icon: Ruler },
              { id: 'guidance', label: 'Guidance', icon: HelpCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab 1: Energy Opportunity */}
          {activeTab === 'energy' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Your Energy Opportunity</h3>
                <p className="text-white/60">
                  {stateName} receives excellent sunlight for solar energy generation
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                  <Sun className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{solarData.sunHours}</div>
                  <div className="text-xs text-white/60">Sun Hours/Day</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                  <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{Math.round(annualProduction / 1000)}k</div>
                  <div className="text-xs text-white/60">kWh/Year Potential</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                  <Leaf className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{Math.round(annualProduction * 0.0007)}</div>
                  <div className="text-xs text-white/60">Tons CO₂ Avoided</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-400/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-200">Perfect for Solar + Storage</h4>
                    <p className="text-green-200/70 text-sm mt-1">
                      Combining solar with battery storage maximizes your savings by storing excess energy 
                      for use during peak rate periods or outages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Financial Opportunity */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Financial Benefits</h3>
                <p className="text-white/60">
                  Multiple ways to save and earn with solar
                </p>
              </div>

              {/* Three benefit cards */}
              <div className="space-y-4">
                {/* Savings */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl p-5 border border-emerald-400/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <PiggyBank className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-emerald-200 text-lg">Save Money</h4>
                      <p className="text-emerald-200/70 text-sm mt-1">
                        Reduce your electricity bills by generating your own power. At ${electricityRate.toFixed(2)}/kWh, 
                        you could save up to <span className="font-bold text-emerald-300">${Math.round(annualSavings).toLocaleString()}/year</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arbitrage */}
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-5 border border-blue-400/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-200 text-lg">Energy Arbitrage</h4>
                      <p className="text-blue-200/70 text-sm mt-1">
                        Store solar energy when rates are low, use it when rates are high. 
                        With time-of-use rates, this can add <span className="font-bold text-blue-300">20-40% more savings</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid Independence */}
                <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-2xl p-5 border border-purple-400/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-200 text-lg">Grid Independence</h4>
                      <p className="text-purple-200/70 text-sm mt-1">
                        Protect against outages and rate increases. With solar + battery, 
                        achieve <span className="font-bold text-purple-300">70-100% energy independence</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick financial summary */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-white/60">30% ITC Tax Credit</div>
                    <div className="text-xl font-bold text-green-400">${Math.round(itcCredit).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60">Est. Payback Period</div>
                    <div className="text-xl font-bold text-amber-400">{paybackYears.toFixed(1)} years</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Solar Sizing */}
          {activeTab === 'sizing' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Size Your Solar System</h3>
                <p className="text-white/60">
                  Estimate based on your building footprint
                </p>
              </div>

              {/* Building Size Slider */}
              <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <label className="text-white font-medium">Building Footprint (sq ft)</label>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={buildingSqFt}
                  onChange={(e) => setBuildingSqFt(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-violet-500
                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50"
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-white/40">1,000</span>
                  <span className="text-white font-bold text-lg">{buildingSqFt.toLocaleString()} sq ft</span>
                  <span className="text-white/40">100,000</span>
                </div>
              </div>

              {/* Roof Usage Slider */}
              <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <Ruler className="w-5 h-5 text-amber-400" />
                  <label className="text-white font-medium">Usable Roof Space (%)</label>
                  <div className="ml-auto flex items-center gap-1 text-xs text-white/50">
                    <Info className="w-3 h-3" />
                    Account for HVAC, skylights, setbacks
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={roofUsagePercent}
                  onChange={(e) => setRoofUsagePercent(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                    [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-orange-500
                    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/50"
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-white/40">30%</span>
                  <span className="text-white font-bold text-lg">{roofUsagePercent}%</span>
                  <span className="text-white/40">90%</span>
                </div>
              </div>

              {/* Estimated System Size */}
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl p-6 border-2 border-amber-400/50">
                <div className="text-center">
                  <div className="text-white/60 text-sm mb-1">Recommended Solar System</div>
                  <div className="flex items-center justify-center gap-2">
                    <Sun className="w-8 h-8 text-amber-400" />
                    <span className="text-4xl font-black text-white">{estimatedSolarKW}</span>
                    <span className="text-xl text-white/60">kW</span>
                  </div>
                  <div className="text-amber-200/70 text-sm mt-2">
                    ≈ {Math.round(estimatedSolarKW / 0.4)} panels • ${Math.round(systemCost).toLocaleString()} installed
                  </div>
                </div>
              </div>

              {/* Manual Override */}
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm">Or enter manually:</span>
                <input
                  type="number"
                  value={estimatedSolarKW}
                  onChange={(e) => setEstimatedSolarKW(Math.max(10, Number(e.target.value)))}
                  className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-center
                    focus:border-amber-400 focus:outline-none"
                />
                <span className="text-white/60">kW</span>
              </div>
            </div>
          )}

          {/* Tab 4: Guidance */}
          {activeTab === 'guidance' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Sizing Guidance</h3>
                <p className="text-white/60">
                  Tips for optimal solar system sizing
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: 'Rule of Thumb: 15-20W per sq ft',
                    description: 'Commercial buildings typically support 15-20 watts of solar per square foot of usable roof space.',
                    icon: Ruler,
                    color: 'purple'
                  },
                  {
                    title: 'Account for Obstructions',
                    description: 'Reduce usable roof by 20-40% for HVAC units, skylights, parapet setbacks, and shading.',
                    icon: Building2,
                    color: 'blue'
                  },
                  {
                    title: 'Match to Energy Usage',
                    description: 'Ideally size solar to cover 80-100% of your daytime energy consumption for maximum savings.',
                    icon: Zap,
                    color: 'amber'
                  },
                  {
                    title: 'Consider Battery Pairing',
                    description: 'Adding battery storage lets you use solar energy 24/7 and provides backup power during outages.',
                    icon: Battery,
                    color: 'green'
                  },
                  {
                    title: 'Check Net Metering',
                    description: 'Many states allow you to sell excess solar back to the grid. Check your local utility policies.',
                    icon: PlugZap,
                    color: 'cyan'
                  },
                ].map((tip, idx) => (
                  <div 
                    key={idx}
                    className={`bg-${tip.color}-500/10 rounded-xl p-4 border border-${tip.color}-400/30 flex items-start gap-3`}
                    style={{ 
                      backgroundColor: `rgba(var(--${tip.color}-500), 0.1)`,
                      borderColor: `rgba(var(--${tip.color}-400), 0.3)`
                    }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0`}>
                      <tip.icon className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{tip.title}</h4>
                      <p className="text-white/60 text-sm mt-1">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="text-white/60 text-sm">
              {estimatedSolarKW > 0 && (
                <span>
                  Solar: <span className="text-amber-400 font-bold">{estimatedSolarKW} kW</span> • 
                  Savings: <span className="text-green-400 font-bold">${Math.round(annualSavings).toLocaleString()}/yr</span>
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Skip for Now
              </button>
              <button
                onClick={() => {
                  onApply(estimatedSolarKW);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all
                  bg-gradient-to-r from-amber-500 to-orange-500 text-white
                  shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02]"
              >
                <Sun className="w-5 h-5" />
                Add {estimatedSolarKW} kW Solar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarOpportunityModal;
