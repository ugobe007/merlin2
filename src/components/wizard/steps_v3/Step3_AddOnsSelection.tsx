/**
 * STEP 3: Add-Ons Selection
 * ========================
 * 
 * Enhanced add-ons step with:
 * - Geographic intelligence integration (smart recommendations based on location)
 * - Solar, Wind, Generators, EV Charging with sliders
 * - Real-time cost/benefit estimates
 * - Power Profile points system integration
 * 
 * @version 2.0 - November 30, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Car, Zap, Wind, MapPin, TrendingUp, Sparkles, AlertTriangle, Check, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  getGeographicRecommendations, 
  getSmartRecommendations,
  getStateFromZipCode,
  type GeographicRecommendation 
} from '@/services/geographicIntelligenceService';
import { getSolarPricing, getWindPricing, getGeneratorPricing } from '@/services/unifiedPricingService';
import { EV_CHARGER_SPECS } from '@/services/evChargingCalculations';

// ============================================
// TYPES
// ============================================

interface AddOnConfig {
  enabled: boolean;
  value: number;
  estimated: {
    cost: number;
    annualSavings: number;
    paybackYears: number;
  };
}

// EV Charger configuration interface
interface EVChargerConfig {
  level2Count: number;      // Level 2 chargers (7-22 kW)
  dcfcCount: number;        // DC Fast Chargers (50-150 kW)
  hpcCount: number;         // High Power Chargers (250-350 kW)
}

interface Step3Props {
  // Current values
  solarMWp?: number;
  evChargerCount?: number;
  generatorKW?: number;
  windMWp?: number;
  
  // NEW: Detailed EV charger configuration
  evChargerConfig?: EVChargerConfig;
  onUpdateEVConfig?: (config: EVChargerConfig) => void;
  
  // Update handlers
  onUpdateSolar?: (mwp: number) => void;
  onUpdateEV?: (count: number) => void;
  onUpdateGenerator?: (kw: number) => void;
  onUpdateWind?: (mwp: number) => void;
  
  // Navigation
  onNext: () => void;
  onBack: () => void;
  
  // Conditional display based on user preferences from Step 1
  showSolar?: boolean;
  showEV?: boolean;
  
  // Geographic context
  zipCode?: string;
  stateCode?: string;
  
  // System context
  peakDemandKW?: number;
  durationHours?: number;
  storageSizeMW?: number;
  
  // Power Profile integration
  onAwardPoints?: (points: number, reason: string) => void;
}

// ============================================
// CONSTANTS (Defaults from SSOT - will be overridden by fetched values)
// ============================================

const DEFAULT_COST_ESTIMATES = {
  solar: {
    perKW: 850, // $/kW installed (NREL ATB 2024 - $0.85/W)
    capacityFactor: 0.20, // 20% average
    annualMWhPerMW: 1500 // 1500 MWh/year per MW
  },
  wind: {
    perKW: 1200, // $/kW installed (NREL ATB 2024)
    capacityFactor: 0.30,
    annualMWhPerMW: 2500
  },
  generator: {
    perKW: 500, // $/kW for diesel genset (NREL ATB 2024)
    fuelCostPerKWh: 0.15 // $/kWh estimated fuel cost
  },
  evCharger: {
    level2: 8000,    // $/unit installed (~$8K for L2 19kW)
    dcfc: 85000,     // $/unit installed (~$85K for 150kW DCFC)
    hpc: 180000,     // $/unit installed (~$180K for 350kW HPC)
    level2PowerKW: 15,  // Average L2 power
    dcfcPowerKW: 100,   // Average DCFC power
    hpcPowerKW: 300     // Average HPC power
  }
};

// EV Charger specs for display
const EV_CHARGER_INFO = {
  level2: {
    name: 'Level 2',
    power: '7-22 kW',
    chargeTime: '~8 hrs for full charge',
    cost: '~$8K installed',
    color: 'green'
  },
  dcfc: {
    name: 'DC Fast (DCFC)',
    power: '50-150 kW',
    chargeTime: '~30 min to 80%',
    cost: '~$85K installed',
    color: 'blue'
  },
  hpc: {
    name: 'High Power (HPC)',
    power: '250-350 kW',
    chargeTime: '~15 min to 80%',
    cost: '~$180K installed',
    color: 'purple'
  }
};

// ============================================
// COMPONENT
// ============================================

const Step3_AddOnsSelection: React.FC<Step3Props> = ({
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
  showEV = true,
  zipCode,
  stateCode,
  peakDemandKW = 500,
  durationHours = 4,
  storageSizeMW = 1,
  onAwardPoints
}) => {
  // Local EV charger state (used if parent doesn't provide evChargerConfig)
  const [localEVConfig, setLocalEVConfig] = useState<EVChargerConfig>({
    level2Count: evChargerCount,
    dcfcCount: 0,
    hpcCount: 0
  });
  
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
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    solar: true,
    ev: true,
    generator: false,
    wind: false
  });
  
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  // ✅ USE SSOT: State for pricing from unifiedPricingService
  const [costEstimates, setCostEstimates] = useState(DEFAULT_COST_ESTIMATES);
  
  // Fetch SSOT pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const [solarPricing, windPricing, generatorPricing] = await Promise.all([
          getSolarPricing(),
          getWindPricing(),
          getGeneratorPricing()
        ]);
        
        setCostEstimates(prev => ({
          ...prev,
          solar: { ...prev.solar, perKW: solarPricing.pricePerWatt * 1000 }, // Convert $/W to $/kW
          wind: { ...prev.wind, perKW: windPricing.pricePerKW },
          generator: { ...prev.generator, perKW: generatorPricing.pricePerKW },
          evCharger: {
            ...prev.evCharger,
            level2: EV_CHARGER_SPECS.level2_19kw.installCostUSD, // From evChargingCalculations SSOT
            dcFast: EV_CHARGER_SPECS.dcfc_150kw.installCostUSD
          }
        }));
      } catch (error) {
        console.error('Error fetching SSOT pricing:', error);
      }
    };
    fetchPricing();
  }, []);
  
  // Get geographic recommendations
  const geoRecommendation = useMemo<GeographicRecommendation | null>(() => {
    const state = stateCode || (zipCode ? getStateFromZipCode(zipCode) : null);
    if (!state) return null;
    return getGeographicRecommendations(state);
  }, [zipCode, stateCode]);
  
  // Smart recommendations based on location + system size
  const smartRecs = useMemo(() => {
    const state = stateCode || (zipCode ? getStateFromZipCode(zipCode) : null);
    if (!state) return null;
    return getSmartRecommendations(state, 'commercial', {
      peakDemandKW,
      backupHoursNeeded: durationHours,
      criticalLoadsKW: peakDemandKW * 0.3
    });
  }, [zipCode, stateCode, peakDemandKW, durationHours]);
  
  // Calculate estimated costs and savings using SSOT pricing
  const calculateEstimates = useMemo(() => {
    const electricityRate = geoRecommendation?.profile?.avgElectricityRate || 0.12;
    
    const solar = {
      cost: solarMWp * 1000 * costEstimates.solar.perKW,
      annualGeneration: solarMWp * costEstimates.solar.annualMWhPerMW,
      annualSavings: solarMWp * costEstimates.solar.annualMWhPerMW * 1000 * electricityRate * 0.9, // 90% self-consumption
      paybackYears: solarMWp > 0 
        ? (solarMWp * 1000 * costEstimates.solar.perKW) / (solarMWp * costEstimates.solar.annualMWhPerMW * 1000 * electricityRate * 0.9)
        : 0
    };
    
    const wind = {
      cost: windMWp * 1000 * costEstimates.wind.perKW,
      annualGeneration: windMWp * costEstimates.wind.annualMWhPerMW,
      annualSavings: windMWp * costEstimates.wind.annualMWhPerMW * 1000 * electricityRate * 0.85,
      paybackYears: windMWp > 0
        ? (windMWp * 1000 * costEstimates.wind.perKW) / (windMWp * costEstimates.wind.annualMWhPerMW * 1000 * electricityRate * 0.85)
        : 0
    };
    
    const generator = {
      cost: generatorKW * costEstimates.generator.perKW,
      annualFuelCost: generatorKW * 100 * costEstimates.generator.fuelCostPerKWh, // ~100 hours/year usage
      // Value is in avoided outage costs
      outageProtection: generatorKW * 0.5 * 24 * electricityRate * 10 // ~10 outages avoided
    };
    
    // Calculate detailed EV charger costs using the new config
    const evL2Cost = currentEVConfig.level2Count * costEstimates.evCharger.level2;
    const evDCFCCost = currentEVConfig.dcfcCount * costEstimates.evCharger.dcfc;
    const evHPCCost = currentEVConfig.hpcCount * costEstimates.evCharger.hpc;
    const totalEVCost = evL2Cost + evDCFCCost + evHPCCost;
    
    const totalEVPowerKW = 
      (currentEVConfig.level2Count * costEstimates.evCharger.level2PowerKW) +
      (currentEVConfig.dcfcCount * costEstimates.evCharger.dcfcPowerKW) +
      (currentEVConfig.hpcCount * costEstimates.evCharger.hpcPowerKW);
    
    const totalChargerCount = currentEVConfig.level2Count + currentEVConfig.dcfcCount + currentEVConfig.hpcCount;
    
    const ev = {
      cost: totalEVCost,
      level2Cost: evL2Cost,
      dcfcCost: evDCFCCost,
      hpcCost: evHPCCost,
      powerKW: totalEVPowerKW,
      chargerCount: totalChargerCount,
      // Revenue from charging if public (weighted by charger type)
      potentialRevenue: (currentEVConfig.level2Count * 3000) + (currentEVConfig.dcfcCount * 15000) + (currentEVConfig.hpcCount * 25000)
    };
    
    return { solar, wind, generator, ev };
  }, [solarMWp, windMWp, generatorKW, currentEVConfig, geoRecommendation, costEstimates]);
  
  // Track add-ons for Power Profile points
  const totalEVChargers = currentEVConfig.level2Count + currentEVConfig.dcfcCount + currentEVConfig.hpcCount;
  const hasAnyAddOns = solarMWp > 0 || totalEVChargers > 0 || generatorKW > 0 || windMWp > 0;
  const addOnCount = [solarMWp > 0, totalEVChargers > 0, generatorKW > 0, windMWp > 0].filter(Boolean).length;
  
  // Award points when add-ons are added
  useEffect(() => {
    if (onAwardPoints && addOnCount > 0) {
      // 25 points per add-on type
      onAwardPoints(addOnCount * 25, `Added ${addOnCount} energy add-on${addOnCount > 1 ? 's' : ''}`);
    }
  }, [addOnCount]);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Add-Ons & Enhancements
            </h2>
            <p className="text-gray-600 mt-1">
              Maximize your energy system's potential
            </p>
          </div>
        </div>
      </div>
      
      {/* Geographic Intelligence Banner */}
      {geoRecommendation && showRecommendations && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-5 relative">
          <button
            onClick={() => setShowRecommendations(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>🎯 Smart Recommendations for {geoRecommendation.state}</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="bg-white/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {geoRecommendation.profile.avgSolarHoursPerDay.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">Sun hrs/day</div>
                </div>
                <div className="bg-white/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-green-600">
                    {geoRecommendation.profile.gridReliabilityScore}%
                  </div>
                  <div className="text-xs text-gray-600">Grid reliability</div>
                </div>
                <div className="bg-white/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-600">
                    ${(geoRecommendation.profile.avgElectricityRate * 100).toFixed(1)}¢
                  </div>
                  <div className="text-xs text-gray-600">per kWh</div>
                </div>
                <div className="bg-white/80 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-purple-600">
                    ${geoRecommendation.profile.avgDemandCharge}
                  </div>
                  <div className="text-xs text-gray-600">Demand $/kW</div>
                </div>
              </div>
              {smartRecs && (
                <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2">
                  💡 {smartRecs.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Add-Ons Grid */}
      <div className="space-y-4">
        
        {/* ☀️ SOLAR PANELS */}
        {showSolar && (
          <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
            solarMWp > 0 
              ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' 
              : 'border-gray-200 bg-white hover:border-yellow-300'
          }`}>
            {/* Header - Always visible */}
            <button
              onClick={() => toggleSection('solar')}
              className="w-full p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  solarMWp > 0 ? 'bg-yellow-500' : 'bg-yellow-100'
                }`}>
                  <Sun className={`w-8 h-8 ${solarMWp > 0 ? 'text-white' : 'text-yellow-600'}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Solar Panels
                    {geoRecommendation?.recommendations.solar.recommended && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {solarMWp > 0 
                      ? `${solarMWp.toFixed(1)} MW generating ~${(solarMWp * 1500).toFixed(0)} MWh/year`
                      : 'Clean energy generation to reduce grid dependency'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {solarMWp > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-600">{solarMWp.toFixed(1)} MW</div>
                    <div className="text-xs text-gray-500">{formatCurrency(calculateEstimates.solar.cost)}</div>
                  </div>
                )}
                {expandedSections.solar ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>
            
            {/* Expanded content */}
            {expandedSections.solar && (
              <div className="px-5 pb-5 pt-2 border-t border-yellow-200/50">
                {/* Recommendation reason */}
                {geoRecommendation && (
                  <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
                    <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>{geoRecommendation.recommendations.solar.reason}</span>
                  </div>
                )}
                
                {/* Slider */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Capacity</span>
                    <span className="text-lg font-bold text-yellow-600">{solarMWp.toFixed(1)} MW</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={solarMWp}
                    onChange={(e) => onUpdateSolar?.(parseFloat(e.target.value))}
                    className="w-full h-3 bg-yellow-100 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(solarMWp / 10) * 100}%, #fef3c7 ${(solarMWp / 10) * 100}%, #fef3c7 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 MW</span>
                    <span>5 MW</span>
                    <span>10 MW</span>
                  </div>
                </div>
                
                {/* Stats */}
                {solarMWp > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateEstimates.solar.cost)}</div>
                      <div className="text-xs text-gray-500">Installed Cost</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(calculateEstimates.solar.annualSavings)}/yr</div>
                      <div className="text-xs text-gray-500">Est. Savings</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{calculateEstimates.solar.paybackYears.toFixed(1)} yrs</div>
                      <div className="text-xs text-gray-500">Payback</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 🚗 EV CHARGERS - Enhanced with L2, DCFC, HPC */}
        {showEV && (
          <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
            totalEVChargers > 0 
              ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}>
            <button
              onClick={() => toggleSection('ev')}
              className="w-full p-5 flex items-center justify-between"
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
                      ? `${totalEVChargers} chargers (${calculateEstimates.ev.powerKW.toFixed(0)} kW total)`
                      : 'Add electric vehicle charging - L2, DC Fast, High Power'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {totalEVChargers > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">{totalEVChargers}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(calculateEstimates.ev.cost)}</div>
                  </div>
                )}
                {expandedSections.ev ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>
            
            {expandedSections.ev && (
              <div className="px-5 pb-5 pt-2 border-t border-green-200/50">
                {/* Charger Type Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  {/* Level 2 Chargers */}
                  <div className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{EV_CHARGER_INFO.level2.name}</h4>
                        <p className="text-xs text-gray-500">{EV_CHARGER_INFO.level2.power}</p>
                        <p className="text-xs text-gray-400">{EV_CHARGER_INFO.level2.chargeTime}</p>
                      </div>
                      <span className="text-green-600 text-sm font-bold">{EV_CHARGER_INFO.level2.cost}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, level2Count: Math.max(0, currentEVConfig.level2Count - 1) })}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold"
                      >−</button>
                      <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.level2Count}</span>
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, level2Count: currentEVConfig.level2Count + 1 })}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white font-bold"
                      >+</button>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">
                      {(currentEVConfig.level2Count * 15).toFixed(0)} kW load
                    </div>
                  </div>
                  
                  {/* DC Fast Chargers */}
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{EV_CHARGER_INFO.dcfc.name}</h4>
                        <p className="text-xs text-gray-500">{EV_CHARGER_INFO.dcfc.power}</p>
                        <p className="text-xs text-gray-400">{EV_CHARGER_INFO.dcfc.chargeTime}</p>
                      </div>
                      <span className="text-blue-600 text-sm font-bold">{EV_CHARGER_INFO.dcfc.cost}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, dcfcCount: Math.max(0, currentEVConfig.dcfcCount - 1) })}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold"
                      >−</button>
                      <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.dcfcCount}</span>
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, dcfcCount: currentEVConfig.dcfcCount + 1 })}
                        className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"
                      >+</button>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">
                      {(currentEVConfig.dcfcCount * 100).toFixed(0)} kW load
                    </div>
                  </div>
                  
                  {/* High Power Chargers */}
                  <div className="bg-white rounded-xl p-4 border border-purple-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{EV_CHARGER_INFO.hpc.name}</h4>
                        <p className="text-xs text-gray-500">{EV_CHARGER_INFO.hpc.power}</p>
                        <p className="text-xs text-gray-400">{EV_CHARGER_INFO.hpc.chargeTime}</p>
                      </div>
                      <span className="text-purple-600 text-sm font-bold">{EV_CHARGER_INFO.hpc.cost}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, hpcCount: Math.max(0, currentEVConfig.hpcCount - 1) })}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 font-bold"
                      >−</button>
                      <span className="flex-1 text-center text-2xl font-black text-gray-900">{currentEVConfig.hpcCount}</span>
                      <button 
                        onClick={() => updateEVConfig({ ...currentEVConfig, hpcCount: currentEVConfig.hpcCount + 1 })}
                        className="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold"
                      >+</button>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">
                      {(currentEVConfig.hpcCount * 300).toFixed(0)} kW load
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                {totalEVChargers > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateEstimates.ev.cost)}</div>
                      <div className="text-xs text-gray-500">Total Cost</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{calculateEstimates.ev.powerKW.toFixed(0)} kW</div>
                      <div className="text-xs text-gray-500">Total Power</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{totalEVChargers}</div>
                      <div className="text-xs text-gray-500">Chargers</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">{formatCurrency(calculateEstimates.ev.potentialRevenue)}/yr</div>
                      <div className="text-xs text-gray-500">Revenue Potential</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* ⚡ BACKUP GENERATOR */}
        <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
          generatorKW > 0 
            ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50' 
            : 'border-gray-200 bg-white hover:border-orange-300'
        }`}>
          <button
            onClick={() => toggleSection('generator')}
            className="w-full p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                generatorKW > 0 ? 'bg-orange-500' : 'bg-orange-100'
              }`}>
                <Zap className={`w-8 h-8 ${generatorKW > 0 ? 'text-white' : 'text-orange-600'}`} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Backup Generator
                  {geoRecommendation?.recommendations.generator.recommended && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      ⚠️ Recommended
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {generatorKW > 0 
                    ? `${generatorKW.toFixed(0)} kW natural gas/diesel backup`
                    : 'Extended backup power for critical loads'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {generatorKW > 0 && (
                <div className="text-right">
                  <div className="text-xl font-bold text-orange-600">{generatorKW.toFixed(0)} kW</div>
                  <div className="text-xs text-gray-500">{formatCurrency(calculateEstimates.generator.cost)}</div>
                </div>
              )}
              {expandedSections.generator ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>
          
          {expandedSections.generator && (
            <div className="px-5 pb-5 pt-2 border-t border-orange-200/50">
              {geoRecommendation && (
                <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 bg-orange-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>{geoRecommendation.recommendations.generator.reason}</span>
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Generator Capacity</span>
                  <span className="text-lg font-bold text-orange-600">{generatorKW.toFixed(0)} kW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={generatorKW}
                  onChange={(e) => onUpdateGenerator?.(parseFloat(e.target.value))}
                  className="w-full h-3 bg-orange-100 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${(generatorKW / 5000) * 100}%, #fed7aa ${(generatorKW / 5000) * 100}%, #fed7aa 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 kW</span>
                  <span>2,500 kW</span>
                  <span>5,000 kW</span>
                </div>
              </div>
              
              {generatorKW > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateEstimates.generator.cost)}</div>
                    <div className="text-xs text-gray-500">Installed Cost</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(calculateEstimates.generator.annualFuelCost)}/yr</div>
                    <div className="text-xs text-gray-500">Est. Fuel Cost</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 💨 WIND TURBINES */}
        <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
          windMWp > 0 
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50' 
            : 'border-gray-200 bg-white hover:border-blue-300'
        }`}>
          <button
            onClick={() => toggleSection('wind')}
            className="w-full p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                windMWp > 0 ? 'bg-blue-500' : 'bg-blue-100'
              }`}>
                <Wind className={`w-8 h-8 ${windMWp > 0 ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Wind Turbines
                  {geoRecommendation?.recommendations.wind.recommended && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      ✓ Excellent Area
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {windMWp > 0 
                    ? `${windMWp.toFixed(1)} MW generating ~${(windMWp * 2500).toFixed(0)} MWh/year`
                    : 'Wind power generation for complementary renewable energy'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {windMWp > 0 && (
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{windMWp.toFixed(1)} MW</div>
                  <div className="text-xs text-gray-500">{formatCurrency(calculateEstimates.wind.cost)}</div>
                </div>
              )}
              {expandedSections.wind ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </button>
          
          {expandedSections.wind && (
            <div className="px-5 pb-5 pt-2 border-t border-blue-200/50">
              {geoRecommendation && (
                <div className="flex items-start gap-2 mb-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{geoRecommendation.recommendations.wind.reason}</span>
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Wind Capacity</span>
                  <span className="text-lg font-bold text-blue-600">{windMWp.toFixed(1)} MW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={windMWp}
                  onChange={(e) => onUpdateWind?.(parseFloat(e.target.value))}
                  className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(windMWp / 10) * 100}%, #dbeafe ${(windMWp / 10) * 100}%, #dbeafe 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 MW</span>
                  <span>5 MW</span>
                  <span>10 MW</span>
                </div>
              </div>
              
              {windMWp > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(calculateEstimates.wind.cost)}</div>
                    <div className="text-xs text-gray-500">Installed Cost</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(calculateEstimates.wind.annualSavings)}/yr</div>
                    <div className="text-xs text-gray-500">Est. Savings</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{calculateEstimates.wind.paybackYears.toFixed(1)} yrs</div>
                    <div className="text-xs text-gray-500">Payback</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Card */}
      {hasAnyAddOns && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Your Enhanced System
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {solarMWp > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{solarMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Solar</p>
              </div>
            )}
            {evChargerCount > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{evChargerCount}</p>
                <p className="text-xs text-gray-600">EV Chargers</p>
              </div>
            )}
            {generatorKW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{generatorKW.toFixed(0)} kW</p>
                <p className="text-xs text-gray-600">Generator</p>
              </div>
            )}
            {windMWp > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{windMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Wind</p>
              </div>
            )}
          </div>
          
          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Add-on Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  calculateEstimates.solar.cost + 
                  calculateEstimates.wind.cost + 
                  calculateEstimates.generator.cost + 
                  calculateEstimates.ev.cost
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Est. Annual Benefit</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  calculateEstimates.solar.annualSavings + 
                  calculateEstimates.wind.annualSavings + 
                  calculateEstimates.ev.potentialRevenue
                )}/yr
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* No add-ons message */}
      {!hasAnyAddOns && (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-gray-500 mb-2">
            No add-ons selected yet
          </p>
          <p className="text-sm text-gray-400">
            Your battery system works great on its own! Add-ons are optional enhancements.
          </p>
        </div>
      )}
      
      {/* Power Profile Bonus */}
      {hasAnyAddOns && (
        <div className="flex items-center justify-center gap-2 text-sm text-purple-600 bg-purple-50 rounded-lg py-2">
          <Sparkles className="w-4 h-4" />
          <span>+{addOnCount * 25} Power Profile points for adding {addOnCount} enhancement{addOnCount > 1 ? 's' : ''}!</span>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {hasAnyAddOns ? 'Continue with Add-ons' : 'Skip Add-ons'} →
        </button>
      </div>
    </div>
  );
};

export default Step3_AddOnsSelection;
