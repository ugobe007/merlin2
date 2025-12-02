/**
 * NEW Step 3: Add Goodies
 * Solar panels, EV chargers (L2, DCFC, HPC), generators, wind turbines
 * Each adds to the Power Profile ecosystem
 * 
 * @version 2.0 - December 1, 2025
 * Enhanced with detailed EV charger types (Level 2, DC Fast, High Power)
 */

import React, { useState, useMemo } from 'react';
import { Sun, Car, Zap, Wind, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

// EV Charger configuration interface
interface EVChargerConfig {
  level2Count: number;      // Level 2 chargers (7-22 kW)
  dcfcCount: number;        // DC Fast Chargers (50-150 kW)
  hpcCount: number;         // High Power Chargers (250-350 kW)
}

interface Step3Props {
  solarMWp?: number;
  evChargerCount?: number;
  generatorKW?: number;
  windMWp?: number;
  
  // NEW: Detailed EV charger configuration
  evChargerConfig?: EVChargerConfig;
  onUpdateEVConfig?: (config: EVChargerConfig) => void;
  
  onUpdateSolar?: (mwp: number) => void;
  onUpdateEV?: (count: number) => void;
  onUpdateGenerator?: (kw: number) => void;
  onUpdateWind?: (mwp: number) => void;
  onNext: () => void;
  onBack: () => void;
  // Conditional display based on user preferences from Step 1
  showSolar?: boolean;
  showEV?: boolean;
}

// EV Charger pricing (from evChargingCalculations.ts SSOT)
const EV_CHARGER_PRICING = {
  level2: { cost: 8000, powerKW: 15, name: 'Level 2', desc: '7-22 kW • ~8 hrs charge' },
  dcfc: { cost: 85000, powerKW: 100, name: 'DC Fast (DCFC)', desc: '50-150 kW • ~30 min' },
  hpc: { cost: 180000, powerKW: 300, name: 'High Power (HPC)', desc: '250-350 kW • ~15 min' }
};

const Step3_AddGoodies: React.FC<Step3Props> = ({
  solarMWp = 0,
  evChargerCount = 0,
  generatorKW = 0,
  windMWp = 0,
  evChargerConfig,
  onUpdateEVConfig,
  onUpdateSolar,
  onUpdateEV,
  onUpdateGenerator,
  onUpdateWind,
  onNext,
  onBack,
  showSolar = true,
  showEV = true
}) => {
  // Local EV charger state (used if parent doesn't provide evChargerConfig)
  const [localEVConfig, setLocalEVConfig] = useState<EVChargerConfig>({
    level2Count: evChargerCount,
    dcfcCount: 0,
    hpcCount: 0
  });
  
  // Expanded sections state
  const [expandedEV, setExpandedEV] = useState(false);
  
  // Use provided config or local state
  const currentEVConfig = evChargerConfig || localEVConfig;
  const updateEVConfig = (newConfig: EVChargerConfig) => {
    if (onUpdateEVConfig) {
      onUpdateEVConfig(newConfig);
    } else {
      setLocalEVConfig(newConfig);
      // Also update the legacy evChargerCount for backward compatibility
      const totalCount = newConfig.level2Count + newConfig.dcfcCount + newConfig.hpcCount;
      onUpdateEV?.(totalCount);
    }
  };
  
  // Calculate totals
  const totalEVChargers = currentEVConfig.level2Count + currentEVConfig.dcfcCount + currentEVConfig.hpcCount;
  const totalEVPowerKW = 
    (currentEVConfig.level2Count * EV_CHARGER_PRICING.level2.powerKW) +
    (currentEVConfig.dcfcCount * EV_CHARGER_PRICING.dcfc.powerKW) +
    (currentEVConfig.hpcCount * EV_CHARGER_PRICING.hpc.powerKW);
  const totalEVCost = 
    (currentEVConfig.level2Count * EV_CHARGER_PRICING.level2.cost) +
    (currentEVConfig.dcfcCount * EV_CHARGER_PRICING.dcfc.cost) +
    (currentEVConfig.hpcCount * EV_CHARGER_PRICING.hpc.cost);
  
  // Calculate estimated costs
  const estimates = useMemo(() => ({
    solar: {
      cost: solarMWp * 850000, // ~$850K/MW installed
      annualGeneration: solarMWp * 1500, // MWh/year
    },
    wind: {
      cost: windMWp * 1200000, // ~$1.2M/MW installed
      annualGeneration: windMWp * 2500, // MWh/year
    },
    generator: {
      cost: generatorKW * 500, // ~$500/kW
    },
    ev: {
      cost: totalEVCost,
      powerKW: totalEVPowerKW,
    }
  }), [solarMWp, windMWp, generatorKW, totalEVCost, totalEVPowerKW]);
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };
  
  const hasAnyGoodies = solarMWp > 0 || totalEVChargers > 0 || generatorKW > 0 || windMWp > 0;

  const handleNext = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(onNext, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-5xl">✨</span>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
              Add Extras
            </h2>
            <p className="text-gray-600 mt-2">
              Enhance your energy system with renewables & EV charging
            </p>
          </div>
        </div>
      </div>

      {/* Goodies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Solar Panels */}
        {showSolar && (
        <div className={`border-2 rounded-2xl p-6 transition-all ${
          solarMWp > 0 
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400' 
            : 'bg-white border-gray-200 hover:border-yellow-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Solar Panels</h3>
              <p className="text-sm text-gray-600">Clean energy generation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{solarMWp.toFixed(1)}</p>
                <p className="text-xs text-gray-500">MWp</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={solarMWp}
                onChange={(e) => onUpdateSolar && onUpdateSolar(parseFloat(e.target.value))}
                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(solarMWp / 10) * 100}%, #fef3c7 ${(solarMWp / 10) * 100}%, #fef3c7 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 MW</span>
                <span>10 MW</span>
              </div>
            </div>
            
            {solarMWp > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Annual Generation:</p>
                <p className="font-bold text-gray-900">{(solarMWp * 1500).toFixed(0)} MWh/year</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* EV Chargers - Enhanced with L2, DCFC, HPC */}
        {showEV && (
        <div className={`md:col-span-2 border-2 rounded-2xl overflow-hidden transition-all ${
          totalEVChargers > 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400' 
            : 'bg-white border-gray-200 hover:border-green-300'
        }`}>
          {/* Header - Clickable to expand */}
          <button
            onClick={() => setExpandedEV(!expandedEV)}
            className="w-full p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                totalEVChargers > 0 ? 'bg-green-500' : 'bg-green-100'
              }`}>
                <Car className={`w-8 h-8 ${totalEVChargers > 0 ? 'text-white' : 'text-green-600'}`} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">EV Charging Infrastructure</h3>
                <p className="text-sm text-gray-600">
                  {totalEVChargers > 0 
                    ? `${totalEVChargers} chargers • ${totalEVPowerKW.toLocaleString()} kW total • ${formatCurrency(totalEVCost)}`
                    : 'Add Level 2, DC Fast, or High Power chargers'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalEVChargers > 0 && (
                <div className="text-right mr-2">
                  <div className="text-xl font-bold text-green-600">{totalEVChargers}</div>
                  <div className="text-xs text-gray-500">chargers</div>
                </div>
              )}
              {expandedEV ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
            </div>
          </button>
          
          {/* Expanded Content */}
          {expandedEV && (
            <div className="px-6 pb-6 pt-2 border-t border-green-200">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Level 2 Chargers */}
                <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{EV_CHARGER_PRICING.level2.name}</h4>
                      <p className="text-xs text-gray-500">{EV_CHARGER_PRICING.level2.desc}</p>
                    </div>
                    <span className="text-green-600 text-sm font-bold">~$8K/ea</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, level2Count: Math.max(0, currentEVConfig.level2Count - 1) })}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold text-xl"
                    >−</button>
                    <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.level2Count}</span>
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, level2Count: currentEVConfig.level2Count + 1 })}
                      className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    >+</button>
                  </div>
                  <div className="text-center text-sm text-gray-500 mt-2">
                    {(currentEVConfig.level2Count * EV_CHARGER_PRICING.level2.powerKW).toLocaleString()} kW load
                  </div>
                </div>
                
                {/* DC Fast Chargers */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{EV_CHARGER_PRICING.dcfc.name}</h4>
                      <p className="text-xs text-gray-500">{EV_CHARGER_PRICING.dcfc.desc}</p>
                    </div>
                    <span className="text-blue-600 text-sm font-bold">~$85K/ea</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, dcfcCount: Math.max(0, currentEVConfig.dcfcCount - 1) })}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold text-xl"
                    >−</button>
                    <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.dcfcCount}</span>
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, dcfcCount: currentEVConfig.dcfcCount + 1 })}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    >+</button>
                  </div>
                  <div className="text-center text-sm text-gray-500 mt-2">
                    {(currentEVConfig.dcfcCount * EV_CHARGER_PRICING.dcfc.powerKW).toLocaleString()} kW load
                  </div>
                </div>
                
                {/* High Power Chargers */}
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{EV_CHARGER_PRICING.hpc.name}</h4>
                      <p className="text-xs text-gray-500">{EV_CHARGER_PRICING.hpc.desc}</p>
                    </div>
                    <span className="text-purple-600 text-sm font-bold">~$180K/ea</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, hpcCount: Math.max(0, currentEVConfig.hpcCount - 1) })}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold text-xl"
                    >−</button>
                    <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.hpcCount}</span>
                    <button 
                      onClick={() => updateEVConfig({ ...currentEVConfig, hpcCount: currentEVConfig.hpcCount + 1 })}
                      className="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    >+</button>
                  </div>
                  <div className="text-center text-sm text-gray-500 mt-2">
                    {(currentEVConfig.hpcCount * EV_CHARGER_PRICING.hpc.powerKW).toLocaleString()} kW load
                  </div>
                </div>
              </div>
              
              {/* Summary Stats */}
              {totalEVChargers > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(totalEVCost)}</div>
                    <div className="text-xs text-gray-500">Total Cost</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-green-600">{totalEVPowerKW.toLocaleString()} kW</div>
                    <div className="text-xs text-gray-500">Total Power</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-blue-600">{totalEVChargers}</div>
                    <div className="text-xs text-gray-500">Chargers</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency((currentEVConfig.level2Count * 3000) + (currentEVConfig.dcfcCount * 15000) + (currentEVConfig.hpcCount * 25000))}/yr
                    </div>
                    <div className="text-xs text-gray-500">Revenue Potential</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Collapsed Summary */}
          {!expandedEV && totalEVChargers === 0 && (
            <div className="px-6 pb-6 pt-0">
              <p className="text-sm text-gray-500 text-center">Click to configure EV charging stations</p>
            </div>
          )}
        </div>
        )}

        {/* Generator */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Generator</h3>
              <p className="text-sm text-gray-600">Backup power redundancy</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{generatorKW.toFixed(0)}</p>
                <p className="text-xs text-gray-500">kW</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={generatorKW}
                onChange={(e) => onUpdateGenerator && onUpdateGenerator(parseFloat(e.target.value))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${(generatorKW / 5000) * 100}%, #fed7aa ${(generatorKW / 5000) * 100}%, #fed7aa 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 kW</span>
                <span>5,000 kW</span>
              </div>
            </div>
            
            {generatorKW > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Fuel Type:</p>
                <p className="font-bold text-gray-900">Natural Gas / Diesel</p>
              </div>
            )}
          </div>
        </div>

        {/* Wind Turbines */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wind className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Wind Turbines</h3>
              <p className="text-sm text-gray-600">Wind energy generation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{windMWp.toFixed(1)}</p>
                <p className="text-xs text-gray-500">MWp</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={windMWp}
                onChange={(e) => onUpdateWind && onUpdateWind(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(windMWp / 10) * 100}%, #dbeafe ${(windMWp / 10) * 100}%, #dbeafe 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 MW</span>
                <span>10 MW</span>
              </div>
            </div>
            
            {windMWp > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Annual Generation:</p>
                <p className="font-bold text-gray-900">{(windMWp * 2500).toFixed(0)} MWh/year</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {hasAnyGoodies && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <DollarSign className="w-6 h-6 text-purple-600" />
            Your Enhanced System
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {solarMWp > 0 && (
              <div className="text-center">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{solarMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Solar • {formatCurrency(estimates.solar.cost)}</p>
              </div>
            )}
            {windMWp > 0 && (
              <div className="text-center">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{windMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Wind • {formatCurrency(estimates.wind.cost)}</p>
              </div>
            )}
            {totalEVChargers > 0 && (
              <div className="text-center">
                <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{totalEVChargers} chargers</p>
                <p className="text-xs text-gray-600">EV • {formatCurrency(totalEVCost)}</p>
              </div>
            )}
            {generatorKW > 0 && (
              <div className="text-center">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{generatorKW.toFixed(0)} kW</p>
                <p className="text-xs text-gray-600">Generator • {formatCurrency(estimates.generator.cost)}</p>
              </div>
            )}
            <div className="text-center bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Total Add-Ons</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(estimates.solar.cost + estimates.wind.cost + totalEVCost + estimates.generator.cost)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skip Option */}
      {!hasAnyGoodies && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            No goodies selected. Your battery system works great on its own!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
        >
          Next →
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Step3_AddGoodies;
