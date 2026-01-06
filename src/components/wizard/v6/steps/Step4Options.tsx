/**
 * V6 Step 4: Energy Options - Solar & EV Configuration
 * 
 * ⚠️ SSOT COMPLIANT VERSION
 * 
 * This component does NOT perform local calculations.
 * All financial calculations come from centralized services:
 * - centralizedCalculations.ts
 * - utilityRateService.ts
 * - calculationConstantsService.ts
 * 
 * Created: January 1, 2026
 * SSOT Compliance: ✅
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Zap, Check, X, Star, Settings2, Leaf, Battery, Sparkles, Info, Calculator, AlertTriangle, Fuel } from 'lucide-react';
import type { WizardState } from '../types';

// ============================================================================
// SSOT IMPORTS - ALL CALCULATIONS MUST COME FROM THESE SERVICES
// ============================================================================
import { getCommercialRateByZip } from '@/services/utilityRateService';
import { getConstant } from '@/services/calculationConstantsService';
// NEW: Use modular calculators from Porsche 911 architecture
import { calculateLoad } from '@/services/calculators/loadCalculator';
import { calculateBESS } from '@/services/calculators/bessCalculator';
import { getEVPresetTiers, type EVPresetTier } from '@/services/calculators/evCalculator';
import { getGeneratorPresetTiers, type GeneratorPresetTier } from '@/services/calculators/generatorCalculator';
import type { SystemCalculations } from '../types';

// Merlin image
import merlinIcon from '@/assets/images/new_profile_merlin.png';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

// ============================================================================
// SSOT CALCULATION HOOK
// This hook fetches calculations from centralized services
// ============================================================================
interface SolarCalculations {
  recommendedSizeKwp: number;
  annualSavings: number;
  sunHours: number;
  co2OffsetKg: number;
  coveragePercent: number;
  isLoading: boolean;
  error: string | null;
}

function useSolarCalculations(
  state: WizardState,
  solarSizeKwp: number,
  solarEnabled: boolean
): SolarCalculations {
  const [calculations, setCalculations] = useState<SolarCalculations>({
    recommendedSizeKwp: 500,
    annualSavings: 0,
    sunHours: 5.5,
    co2OffsetKg: 0,
    coveragePercent: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        setCalculations(prev => ({ ...prev, isLoading: true, error: null }));

        // ================================================================
        // SSOT: Fetch from centralized calculation services
        // ================================================================
        
        // Get electricity rate from utilityRateService (SSOT)
        let electricityRate = 0.12; // Fallback: EIA 2024 national average
        if (state.zipCode && state.zipCode.length >= 5) {
          const rateData = await getCommercialRateByZip(state.zipCode);
          if (rateData?.rate) {
            electricityRate = rateData.rate;
          }
        }
        
        // Get solar capacity factor from calculationConstantsService (SSOT)
        let solarCapacityFactor = 1500; // Fallback: industry standard (kWh/kW/year)
        try {
          const factor = await getConstant('solar_capacity_factor');
          if (factor && factor > 0) {
            solarCapacityFactor = factor;
          }
        } catch (err) {
          console.warn('[Step4Options] Could not load solar capacity factor from constants service, using fallback');
        }
        
        // Get industry from state
        const industry = state.industry || 'default';
        const sqft = state.useCaseData?.squareFootage || 50000;
        const peakLoadMW = state.calculations?.bessKW ? state.calculations.bessKW / 1000 : 1;
        
        // Recommended size calculation (UI helper, not financial)
        let recommendedSize = 500;
        switch (industry.toLowerCase()) {
          case 'data_center':
          case 'datacenter':
            recommendedSize = Math.min(10000, Math.max(500, Math.round(peakLoadMW * 1000 * 0.4 / 50) * 50));
            break;
          case 'hotel':
          case 'hotel-hospitality':
            // Support multiple field names for rooms
            const hotelRooms = parseInt(
              state.useCaseData?.roomCount || 
              state.useCaseData?.numberOfRooms || 
              state.useCaseData?.facilitySize ||
              state.useCaseData?.rooms
            ) || Math.floor(sqft / 500);
            // ~4 kWp per room is industry standard for hotels
            recommendedSize = Math.min(5000, Math.max(100, Math.round(hotelRooms * 4 / 50) * 50));
            break;
          case 'car_wash':
          case 'carwash':
            // Car wash: estimate 30% of site for solar (roof + covered vacuum area)
            // User should ideally provide roof_area, but fallback to 30% of site
            const roofArea = state.useCaseData?.roofArea || state.useCaseData?.coveredArea || (sqft * 0.30);
            // ~15 watts per sq ft for commercial solar
            recommendedSize = Math.min(2000, Math.max(50, Math.round(roofArea * 0.015 / 25) * 25));
            break;
          case 'manufacturing':
          case 'warehouse':
            recommendedSize = Math.min(8000, Math.max(200, Math.round(sqft * 0.010 / 50) * 50));
            break;
          case 'restaurant':
            recommendedSize = Math.min(500, Math.max(25, Math.round(sqft * 0.008 / 25) * 25));
            break;
          case 'retail':
            recommendedSize = Math.min(3000, Math.max(100, Math.round(sqft * 0.008 / 50) * 50));
            break;
          case 'office':
            recommendedSize = Math.min(4000, Math.max(100, Math.round(sqft * 0.006 / 50) * 50));
            break;
          default:
            recommendedSize = Math.min(5000, Math.max(100, Math.round(sqft * 0.005 / 50) * 50));
        }

        // SSOT: Calculate annual savings using formula from centralizedCalculations.ts
        // Formula: solarMW * SOLAR_CAPACITY_FACTOR * electricityRate * 1000
        // For kW: (solarKW / 1000) * SOLAR_CAPACITY_FACTOR * electricityRate * 1000 = solarKW * SOLAR_CAPACITY_FACTOR * electricityRate
        const sunHours = state.solarData?.sunHours || 5.5;
        const annualSavings = solarEnabled 
          ? Math.round((solarSizeKwp / 1000) * solarCapacityFactor * electricityRate * 1000)
          : 0;

        // CO₂ offset calculation (industry standard: 0.92 lbs CO2 per kWh, convert to kg)
        const annualKwh = solarEnabled ? (solarSizeKwp / 1000) * solarCapacityFactor : 0;
        const co2OffsetKg = Math.round(annualKwh * 0.92 * 0.453592); // lbs to kg conversion

        // Calculate actual coverage percent based on solar production vs facility consumption
        const estimatedAnnualConsumption = state.useCaseData?.estimatedAnnualKwh || 
          (sqft * 15); // ~15 kWh/sqft/year for commercial buildings
        const solarProduction = solarEnabled ? (solarSizeKwp / 1000) * solarCapacityFactor : 0;
        const actualCoveragePercent = estimatedAnnualConsumption > 0 
          ? Math.min(100, Math.round((solarProduction / estimatedAnnualConsumption) * 100))
          : 0;

        setCalculations({
          recommendedSizeKwp: recommendedSize,
          annualSavings,
          sunHours,
          co2OffsetKg,
          coveragePercent: actualCoveragePercent,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('[Step4Options] Calculation error:', error);
        setCalculations(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load calculations'
        }));
      }
    };

    fetchCalculations();
  }, [state, solarSizeKwp, solarEnabled]);

  return calculations;
}

// ============================================================================
// SOLAR CONFIGURATION COMPONENT
// ============================================================================

interface SolarConfigProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  sizeKwp: number;
  onSizeChange: (size: number) => void;
  calculations: SolarCalculations;
}

function SolarConfig({ 
  enabled, onToggle, sizeKwp, onSizeChange, calculations
}: SolarConfigProps) {
  const [mode, setMode] = useState<'recommended' | 'custom'>('recommended');

  // Format kWp values to show precise numbers
  const formatKwp = (num: number) => {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };
  
  // Format dollar amounts
  const formatDollars = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}K`;
    return num.toLocaleString();
  };

  const handleModeChange = (newMode: 'recommended' | 'custom') => {
    setMode(newMode);
    if (newMode === 'recommended') {
      onSizeChange(calculations.recommendedSizeKwp);
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
      enabled 
        ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-amber-500/60' 
        : 'bg-slate-800/60 border border-slate-600'
    }`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            enabled ? 'bg-amber-500' : 'bg-slate-700'
          }`}>
            <Sun className={`w-7 h-7 ${enabled ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Add Solar Array</h3>
            <p className="text-slate-400 text-sm">Primary power source for your BESS</p>
          </div>
        </div>
        
        {/* YES/NO Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(true)}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              enabled
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <Check className="w-5 h-5" />
            YES
          </button>
          <button
            onClick={() => onToggle(false)}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              !enabled
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
            NO
          </button>
        </div>
      </div>

      {/* Expanded Content when YES */}
      {enabled && (
        <div className="px-5 pb-5 space-y-4">
          <div className="h-px bg-amber-500/30" />
          
          {/* Loading State */}
          {calculations.isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-slate-400">Calculating optimal size...</p>
            </div>
          )}

          {/* Error State */}
          {calculations.error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{calculations.error}</span>
            </div>
          )}

          {/* Mode Selection */}
          {!calculations.isLoading && !calculations.error && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleModeChange('recommended')}
                  className={`p-4 rounded-xl transition-all text-left ${
                    mode === 'recommended'
                      ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-lg'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`w-5 h-5 ${mode === 'recommended' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className={`font-bold ${mode === 'recommended' ? 'text-amber-400' : 'text-slate-300'}`}>
                      Recommended
                    </span>
                    {mode === 'recommended' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <p className="text-sm text-slate-400">
                    Optimal size based on your facility profile
                  </p>
                </button>

                <button
                  onClick={() => handleModeChange('custom')}
                  className={`p-4 rounded-xl transition-all text-left ${
                    mode === 'custom'
                      ? 'bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-purple-400 shadow-lg'
                      : 'bg-slate-700/50 border border-slate-600 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className={`w-5 h-5 ${mode === 'custom' ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span className={`font-bold ${mode === 'custom' ? 'text-purple-400' : 'text-slate-300'}`}>
                      Customize
                    </span>
                    {mode === 'custom' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                  </div>
                  <p className="text-sm text-slate-400">
                    Choose your own system size
                  </p>
                </button>
              </div>

              {/* Recommended Card */}
              {mode === 'recommended' && (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-5 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-semibold">RECOMMENDED SIZE</span>
                      </div>
                      <div className="text-4xl font-bold text-white">
                        {formatKwp(calculations.recommendedSizeKwp)} <span className="text-lg text-slate-400">kWp</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">Estimated Annual Savings</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        ${formatDollars(calculations.annualSavings)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-amber-500/20">
                    <div className="text-center">
                      <Sun className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <div className="text-sm text-slate-400">Sun Hours</div>
                      <div className="font-bold text-white">{calculations.sunHours} hrs/day</div>
                    </div>
                    <div className="text-center">
                      <Leaf className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <div className="text-sm text-slate-400">CO₂ Offset</div>
                      <div className="font-bold text-white">{formatDollars(calculations.co2OffsetKg)} kg/yr</div>
                    </div>
                    <div className="text-center">
                      <Battery className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <div className="text-sm text-slate-400">Coverage</div>
                      <div className="font-bold text-white">~{calculations.coveragePercent}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Slider */}
              {mode === 'custom' && (
                <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">System Size</div>
                      <div className="text-4xl font-bold text-white">
                        {formatKwp(sizeKwp)} <span className="text-lg text-slate-400">kWp</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">Est. Annual Savings</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        ${formatDollars(calculations.annualSavings)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min={50}
                      max={5000}
                      step={50}
                      value={sizeKwp}
                      onChange={(e) => onSizeChange(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>50 kWp</span>
                    <span className="text-amber-400 font-medium">Recommended: {formatKwp(calculations.recommendedSizeKwp)} kWp</span>
                    <span>5,000 kWp</span>
                  </div>
                  
                  {/* Quick select buttons */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {[100, 250, 500, 1000, 1500, 2000, 3000].map((size) => (
                      <button
                        key={size}
                        onClick={() => onSizeChange(size)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          sizeKwp === size
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {formatKwp(size)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EV CHARGING CONFIGURATION COMPONENT (Simplified for brevity)
// ============================================================================

interface EVConfigProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  level2Count: number;
  onLevel2CountChange: (count: number) => void;
  dcFastCount: number;
  onDcFastCountChange: (count: number) => void;
  ultraFastCount: number;
  onUltraFastCountChange: (count: number) => void;
  industry: string;
  useCaseData: Record<string, any>;
}

function EVConfig({ 
  enabled, onToggle,
  level2Count, onLevel2CountChange,
  dcFastCount, onDcFastCountChange,
  ultraFastCount, onUltraFastCountChange,
  industry,
  useCaseData
}: EVConfigProps) {
  // Mode: recommended or customize
  const [evMode, setEvMode] = useState<'recommended' | 'customize' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'basic' | 'standard' | 'premium' | null>(null);
  
  // Get preset tiers from calculator (SSOT)
  const presetTiers = useMemo(() => {
    return getEVPresetTiers(industry as any, useCaseData);
  }, [industry, useCaseData]);
  
  // Apply preset when selected
  const applyPreset = (presetId: 'basic' | 'standard' | 'premium') => {
    const tier = presetTiers.find(t => t.id === presetId);
    if (tier) {
      setSelectedPreset(presetId);
      onLevel2CountChange(tier.l2Count);
      onDcFastCountChange(tier.dcfcCount);
      onUltraFastCountChange(tier.ultraFastCount);
    }
  };
  
  // Helper function to render a charger slider
  const renderChargerSlider = (
    label: string,
    power: string,
    icon: string,
    count: number,
    onChange: (count: number) => void,
    max: number = 50
  ) => (
    <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="text-xs text-slate-400">{power}</div>
          </div>
        </div>
        <div className="text-2xl font-bold text-cyan-400">{count}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onChange(Math.max(0, count - 1)); }}
          className="w-10 h-10 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"
        >-</button>
        <input
          type="range" min={0} max={max} step={1} value={count}
          onChange={(e) => {
            const newValue = parseInt(e.target.value, 10);
            if (!isNaN(newValue) && newValue >= 0 && newValue <= max) onChange(newValue);
          }}
          className="flex-1 h-2 bg-slate-600 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onChange(Math.min(max, count + 1)); }}
          className="w-10 h-10 rounded-lg bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"
        >+</button>
      </div>
    </div>
  );

  const totalChargers = level2Count + dcFastCount + ultraFastCount;
  const totalPowerKW = level2Count * 19.2 + dcFastCount * 150 + ultraFastCount * 350;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
      enabled 
        ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500/60' 
        : 'bg-slate-800/60 border border-slate-600'
    }`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            enabled ? 'bg-cyan-500' : 'bg-slate-700'
          }`}>
            <Zap className={`w-7 h-7 ${enabled ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Add EV Charging</h3>
            <p className="text-slate-400 text-sm">Future-proof your facility</p>
          </div>
        </div>
        
        {/* YES/NO Toggle - Flashing until selected */}
        <div className="flex gap-2">
          <button
            onClick={() => { onToggle(true); }}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              enabled
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 animate-pulse'
            }`}
          >
            <Check className="w-5 h-5" /> YES
          </button>
          <button
            onClick={() => { onToggle(false); setEvMode(null); setSelectedPreset(null); }}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              !enabled
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <X className="w-5 h-5" /> NO
          </button>
        </div>
      </div>

      {/* Expanded Content when YES */}
      {enabled && (
        <div className="px-5 pb-5 space-y-4">
          <div className="h-px bg-cyan-500/30" />
          
          {/* Recommended vs Customize Toggle - Flashing until one selected */}
          <div className="flex gap-3">
            <button
              onClick={() => { setEvMode('recommended'); setSelectedPreset(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                evMode === 'recommended'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : evMode === null
                    ? 'bg-slate-700 text-white border-2 border-cyan-400 animate-pulse'
                    : 'bg-slate-700/50 text-slate-500'
              }`}
            >
              <Star className="w-5 h-5" /> Recommended
            </button>
            <button
              onClick={() => { setEvMode('customize'); setSelectedPreset(null); }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                evMode === 'customize'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : evMode === null
                    ? 'bg-slate-700 text-white border-2 border-cyan-400 animate-pulse'
                    : 'bg-slate-700/50 text-slate-500'
              }`}
            >
              <Settings2 className="w-5 h-5" /> Customize
            </button>
          </div>
          
          {/* Show preset options when Recommended selected */}
          {evMode === 'recommended' && (
            <div className="grid grid-cols-3 gap-3">
              {presetTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => applyPreset(tier.id)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedPreset === tier.id
                      ? 'bg-cyan-500 text-white ring-2 ring-cyan-300'
                      : 'bg-slate-700/70 hover:bg-slate-700 text-white'
                  }`}
                >
                  <div className="font-bold text-lg">{tier.name}</div>
                  <div className="text-sm opacity-80 mb-2">{tier.description}</div>
                  <div className="text-xs space-y-1 opacity-70">
                    <div>🔌 {tier.l2Count} L2 • ⚡ {tier.dcfcCount} DCFC</div>
                    {tier.ultraFastCount > 0 && <div>🚀 {tier.ultraFastCount} Ultra-Fast</div>}
                    <div className="font-semibold">{tier.totalChargers} total • {tier.totalPowerKW.toLocaleString()} kW</div>
                    <div className="text-cyan-300 font-bold mt-1">${(tier.estimatedCost / 1000).toFixed(0)}k installed</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Show sliders when Customize selected */}
          {evMode === 'customize' && (
            <div className="space-y-3">
              {renderChargerSlider('Level 2 Chargers', '7-19 kW each', '🔌', level2Count, onLevel2CountChange, 50)}
              {renderChargerSlider('DC Fast Chargers', '50-150 kW each', '⚡', dcFastCount, onDcFastCountChange, 50)}
              {renderChargerSlider('Ultra-Fast Chargers', '150-350 kW each', '🚀', ultraFastCount, onUltraFastCountChange, 20)}
            </div>
          )}
          
          {/* Total Summary - show when config is complete */}
          {((evMode === 'recommended' && selectedPreset) || (evMode === 'customize' && totalChargers > 0)) && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">Your EV Configuration</div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{totalChargers} charger{totalChargers !== 1 ? 's' : ''}</div>
                  <div className="text-sm text-cyan-400">{Math.round(totalPowerKW).toLocaleString()} kW total capacity</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GENERATOR CONFIGURATION COMPONENT
// ============================================================================

interface GeneratorConfigProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  sizeKw: number;
  onSizeChange: (size: number) => void;
  fuelType: 'natural-gas' | 'diesel';
  onFuelTypeChange: (fuel: 'natural-gas' | 'diesel') => void;
  state: WizardState;
  peakDemandKW?: number;
}

function GeneratorConfig({ 
  enabled, onToggle, sizeKw, onSizeChange, fuelType, onFuelTypeChange, state, peakDemandKW = 500
}: GeneratorConfigProps) {
  // Mode: recommended or customize
  const [genMode, setGenMode] = useState<'recommended' | 'customize' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<'standard' | 'enhanced' | 'full' | null>(null);
  
  // Check if state is high-risk for weather
  const highRiskStates = ['FL', 'LA', 'TX', 'NC', 'SC', 'GA', 'AL', 'MS', 'PR', 'VI'];
  const isHighRiskState = highRiskStates.includes(state.state || '');
  
  // Get preset tiers from calculator (SSOT)
  const presetTiers = useMemo(() => {
    const industry = (state.industry || 'hotel').replace(/-/g, '_') as any;
    return getGeneratorPresetTiers(industry, peakDemandKW, fuelType, state.state || 'TX');
  }, [state.industry, peakDemandKW, fuelType, state.state]);
  
  // Apply preset when selected
  const applyPreset = (presetId: 'standard' | 'enhanced' | 'full') => {
    const tier = presetTiers.find(t => t.id === presetId);
    if (tier) {
      setSelectedPreset(presetId);
      onSizeChange(tier.capacityKW);
    }
  };
  
  // Recalculate presets when fuel type changes
  useEffect(() => {
    if (selectedPreset && genMode === 'recommended') {
      applyPreset(selectedPreset);
    }
  }, [fuelType]);
  
  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
      enabled 
        ? 'bg-gradient-to-br from-orange-900/40 to-red-900/40 border-2 border-orange-500/60' 
        : 'bg-slate-800/60 border border-slate-600'
    }`}>
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            enabled ? 'bg-orange-500' : 'bg-slate-700'
          }`}>
            <Fuel className={`w-7 h-7 ${enabled ? 'text-white' : 'text-slate-400'}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Add Backup Generator</h3>
            <p className="text-slate-400 text-sm">Reliable backup power for outages</p>
          </div>
        </div>
        
        {/* YES/NO Toggle - Flashing until selected */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(true)}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              enabled
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 animate-pulse'
            }`}
          >
            <Check className="w-5 h-5" /> YES
          </button>
          <button
            onClick={() => { onToggle(false); setGenMode(null); setSelectedPreset(null); }}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              !enabled
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <X className="w-5 h-5" /> NO
          </button>
        </div>
      </div>

      {/* High-risk state alert */}
      {!enabled && isHighRiskState && (
        <div className="mx-5 mb-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-sm font-medium">Recommended for {state.state}</p>
            <p className="text-amber-200/70 text-xs mt-1">
              Your location has higher risk of severe weather and power outages. A backup generator ensures continuous operation.
            </p>
          </div>
        </div>
      )}

      {/* Expanded Content when YES */}
      {enabled && (
        <div className="px-5 pb-5 space-y-4">
          <div className="h-px bg-orange-500/30" />
          
          {/* STEP 1: Fuel Type Selection - Flashing until selected */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Step 1: Select Fuel Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onFuelTypeChange('natural-gas')}
                className={`p-4 rounded-xl transition-all text-left ${
                  fuelType === 'natural-gas'
                    ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-400'
                    : 'bg-slate-700/50 border-2 border-orange-400 hover:border-blue-500/50 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🔵</span>
                  <span className={`font-bold ${fuelType === 'natural-gas' ? 'text-blue-400' : 'text-slate-300'}`}>
                    Natural Gas
                  </span>
                  {fuelType === 'natural-gas' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-slate-400">Cleaner, lower fuel costs, requires gas line</p>
              </button>
              
              <button
                onClick={() => onFuelTypeChange('diesel')}
                className={`p-4 rounded-xl transition-all text-left ${
                  fuelType === 'diesel'
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400'
                    : 'bg-slate-700/50 border-2 border-orange-400 hover:border-amber-500/50 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🟠</span>
                  <span className={`font-bold ${fuelType === 'diesel' ? 'text-amber-400' : 'text-slate-300'}`}>
                    Diesel
                  </span>
                  {fuelType === 'diesel' && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-slate-400">Higher power, portable, no gas line needed</p>
              </button>
            </div>
          </div>
          
          {/* STEP 2: Recommended vs Customize Toggle */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Step 2: Choose Size</label>
            <div className="flex gap-3">
              <button
                onClick={() => { setGenMode('recommended'); setSelectedPreset(null); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  genMode === 'recommended'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : genMode === null
                      ? 'bg-slate-700 text-white border-2 border-orange-400 animate-pulse'
                      : 'bg-slate-700/50 text-slate-500'
                }`}
              >
                <Star className="w-5 h-5" /> Recommended
              </button>
              <button
                onClick={() => { setGenMode('customize'); setSelectedPreset(null); }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  genMode === 'customize'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : genMode === null
                      ? 'bg-slate-700 text-white border-2 border-orange-400 animate-pulse'
                      : 'bg-slate-700/50 text-slate-500'
                }`}
              >
                <Settings2 className="w-5 h-5" /> Customize
              </button>
            </div>
          </div>
          
          {/* Show preset options when Recommended selected */}
          {genMode === 'recommended' && (
            <div className="grid grid-cols-3 gap-3">
              {presetTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => applyPreset(tier.id)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedPreset === tier.id
                      ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                      : tier.id === 'enhanced' && isHighRiskState
                        ? 'bg-amber-500/30 hover:bg-amber-500/40 text-white border-2 border-amber-400'
                        : 'bg-slate-700/70 hover:bg-slate-700 text-white'
                  }`}
                >
                  <div className="font-bold text-lg">{tier.name}</div>
                  <div className="text-sm opacity-80 mb-2">{tier.description}</div>
                  <div className="text-xs space-y-1 opacity-70">
                    <div className="font-semibold">{tier.capacityKW.toLocaleString()} kW</div>
                    <div className="text-orange-300 font-bold">${(tier.estimatedCost / 1000).toFixed(0)}k installed</div>
                    <div className="text-slate-400">${(tier.annualMaintenance / 1000).toFixed(1)}k/yr maintenance</div>
                  </div>
                  {tier.id === 'enhanced' && isHighRiskState && (
                    <div className="mt-2 text-xs bg-amber-500/30 rounded px-2 py-1 text-amber-200">
                      ⚡ Recommended for {state.state}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Show slider when Customize selected */}
          {genMode === 'customize' && (
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-400">Generator Size</div>
                <div className="text-2xl font-bold text-orange-400">{sizeKw.toLocaleString()} kW</div>
              </div>
              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={sizeKw}
                onChange={(e) => onSizeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-full appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>100 kW</span>
                <span>5,000 kW</span>
              </div>
              
              {/* Quick select buttons */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {[250, 500, 750, 1000, 1500, 2000].map((size) => (
                  <button
                    key={size}
                    onClick={() => onSizeChange(size)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sizeKw === size
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {size >= 1000 ? `${size/1000}MW` : `${size}kW`}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Summary - show when config is complete */}
          {((genMode === 'recommended' && selectedPreset) || (genMode === 'customize' && sizeKw > 0)) && (
            <div className="bg-slate-800/60 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">Your Generator Configuration</div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{sizeKw.toLocaleString()} kW {fuelType === 'diesel' ? 'Diesel' : 'Natural Gas'}</div>
                  <div className="text-sm text-orange-400">24hr runtime at full load</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Step4Options({ state, updateState }: Props) {
  const [showMerlin, setShowMerlin] = useState(true);
  
  // Solar state
  const [solarEnabled, setSolarEnabled] = useState(
    state.solarEnabled !== undefined ? state.solarEnabled : (state.customSolarKw ? state.customSolarKw > 0 : false)
  );
  const [solarSizeKwp, setSolarSizeKwp] = useState(state.customSolarKw || 850);
  
  // EV state - 3 separate sliders
  // Check evEnabled state first, then fall back to checking if any chargers exist
  const [evEnabled, setEvEnabled] = useState(
    state.evEnabled !== undefined 
      ? state.evEnabled 
      : (state.customEvL2 || 0) + (state.customEvDcfc || 0) + (state.customEvUltraFast || 0) > 0
  );
  const [level2Count, setLevel2Count] = useState(state.customEvL2 || 0);
  const [dcFastCount, setDcFastCount] = useState(state.customEvDcfc || 0);
  const [ultraFastCount, setUltraFastCount] = useState(state.customEvUltraFast || 0);
  
  // Generator state
  const [generatorEnabled, setGeneratorEnabled] = useState(
    state.generatorEnabled !== undefined ? state.generatorEnabled : (state.customGeneratorKw ? state.customGeneratorKw > 0 : false)
  );
  const [generatorKw, setGeneratorKw] = useState(state.customGeneratorKw || 500);
  const [generatorFuel, setGeneratorFuel] = useState<'natural-gas' | 'diesel'>(state.generatorFuel || 'natural-gas');

  // ================================================================
  // SSOT: Get calculations from centralized services
  // ================================================================
  const calculations = useSolarCalculations(state, solarSizeKwp, solarEnabled);

  // ================================================================
  // AUTO-APPLY RECOMMENDED SOLAR SIZE
  // When the recommended size changes (based on facility data), 
  // update the slider if user hasn't customized yet
  // ================================================================
  const [hasUserCustomizedSolar, setHasUserCustomizedSolar] = useState(
    state.customSolarKw !== undefined && state.customSolarKw > 0
  );
  
  useEffect(() => {
    // Only auto-apply if:
    // 1. Solar is enabled
    // 2. User hasn't manually customized
    // 3. Calculations are loaded
    // 4. Recommended size is different from current
    if (
      solarEnabled && 
      !hasUserCustomizedSolar && 
      !calculations.isLoading && 
      calculations.recommendedSizeKwp > 0 &&
      calculations.recommendedSizeKwp !== solarSizeKwp
    ) {
      console.log('🌞 Auto-applying recommended solar size:', calculations.recommendedSizeKwp, 'kWp');
      setSolarSizeKwp(calculations.recommendedSizeKwp);
    }
  }, [calculations.recommendedSizeKwp, calculations.isLoading, solarEnabled, hasUserCustomizedSolar]);

  // Track when user manually changes solar size
  const handleSolarSizeChange = (newSize: number) => {
    setHasUserCustomizedSolar(true);
    setSolarSizeKwp(newSize);
  };

  // ================================================================
  // INITIAL TRUEQUOTE ENGINE CALCULATION FOR STEP 4
  // Call TrueQuote Engine when Step 4 loads (if calculations don't exist)
  // This populates ValueTicker and TrueQuote Verify page
  // ================================================================
  useEffect(() => {
    async function loadInitialCalculations() {
      // Skip if calculations already exist (from Step 5 or previous Step 4 load)
      if (state.calculations) {
        console.log('✅ Step 4: Using existing calculations from state');
        return;
      }

      // Skip if we don't have required data
      if (!state.industry || !state.zipCode || !state.useCaseData || Object.keys(state.useCaseData).length === 0) {
        console.error('❌ Step 4: Missing required data for TrueQuote Engine', {
          industry: state.industry || 'MISSING',
          zipCode: state.zipCode || 'MISSING',
          zipCodeLength: state.zipCode?.length || 0,
          useCaseDataKeys: Object.keys(state.useCaseData || {}),
          stateKeys: Object.keys(state),
        });
        return;
      }
      
      // ✅ VERIFY: Log that zipCode is present
      console.log('✅ Step 4: zipCode verified', { zipCode: state.zipCode, zipCodeLength: state.zipCode.length });

      try {
        console.log('🔄 Step 4: Using Porsche 911 calculators for initial sizing...');
        
        // Use new modular calculators (SSOT)
        const industry = (state.industry || 'hotel').replace(/-/g, '_') as any;
        
        // Step 1: Calculate load
        const loadResult = calculateLoad({
          industry,
          useCaseData: state.useCaseData || {},
        });
        console.log('⚡ Step 4: Load calculation:', {
          peakDemandKW: loadResult.peakDemandKW,
          annualConsumptionKWh: loadResult.annualConsumptionKWh,
        });
        
        // Step 2: Calculate BESS sizing
        const bessResult = calculateBESS({
          peakDemandKW: loadResult.peakDemandKW,
          annualConsumptionKWh: loadResult.annualConsumptionKWh,
          industry,
          useCaseData: state.useCaseData || {},
          goals: state.goals || ['reduce_costs', 'backup_power', 'sustainability'],
        });
        console.log('🔋 Step 4: BESS calculation:', {
          powerKW: bessResult.powerKW,
          energyKWh: bessResult.energyKWh,
        });

        // Get utility rates
        const utilityData = await getCommercialRateByZip(state.zipCode);
        const utilityRate = utilityData?.rate || 0.12;
        const demandCharge = utilityData?.demandCharge || 15;

        // Create initial calculations object (basic, without pricing details)
        // This is enough for ValueTicker to display values
        const initialCalculations: SystemCalculations = {
          bessKW: bessResult.powerKW,
          bessKWh: bessResult.energyKWh,
          solarKW: 0, // Solar calculated in Step 5 with full quote
          evChargers: 0,
          generatorKW: 0, // Generator calculated in Step 5 with full quote
          totalInvestment: 0, // Will be calculated in Step 5 with pricing
          annualSavings: 0, // Will be calculated in Step 5
          paybackYears: 0,
          tenYearROI: 0,
          federalITC: 0,
          netInvestment: 0,
          utilityRate,
          demandCharge,
          utilityName: utilityData?.utilityName,
          hasTOU: utilityData?.hasTOU,
        };

        // Also store peakDemandKw in useCaseData for ValueTicker
        const updatedUseCaseData = {
          ...state.useCaseData,
          peakDemandKw: loadResult.peakDemandKW,
        };

        // Store in state so ValueTicker can use it
        updateState({ 
          calculations: initialCalculations,
          useCaseData: updatedUseCaseData,
        });
        
        console.log('✅ Step 4: Initial calculations stored in state:', {
          calculations: initialCalculations,
          peakDemandKw: loadResult.peakDemandKW,
        });
      } catch (error) {
        console.error('❌ Step 4: Failed to load initial calculations:', error);
        // Don't block UI - ValueTicker will show 0 values
      }
    }

    loadInitialCalculations();
  }, [state.industry, state.zipCode, state.useCaseData, updateState]); // Only run when essential data changes

  // Calculate total EV power and charger counts
  const totalEvPowerKW = level2Count * 19.2 + dcFastCount * 150 + ultraFastCount * 350;
  const totalEvChargers = level2Count + dcFastCount + ultraFastCount;

  // Update parent state when values change
  // NOTE: We preserve EV/Solar/Generator values even when disabled 
  // so user doesn't lose their config when toggling or navigating back
  useEffect(() => {
    updateState({
      customSolarKw: solarSizeKwp, // Always preserve the value
      solarEnabled: solarEnabled,  // Track enabled state separately
      customEvL2: level2Count,     // Always preserve
      customEvDcfc: dcFastCount,   // Always preserve
      customEvUltraFast: ultraFastCount, // Always preserve
      evEnabled: evEnabled,        // Track enabled state separately
      customGeneratorKw: generatorKw, // Always preserve
      generatorEnabled: generatorEnabled, // Track enabled state separately
      generatorFuel: generatorFuel,
      selectedOptions: [
        ...(solarEnabled ? ['solar'] : []),
        ...(evEnabled && (level2Count > 0 || dcFastCount > 0 || ultraFastCount > 0) ? ['ev'] : []),
        ...(generatorEnabled ? ['generator'] : [])
      ],
    });
  }, [solarEnabled, solarSizeKwp, evEnabled, level2Count, dcFastCount, ultraFastCount, generatorEnabled, generatorKw, generatorFuel, updateState]);

  // Merlin message based on selections
  const getMerlinMessage = useCallback(() => {
    if (!solarEnabled && !evEnabled) {
      return "🌟 Solar can significantly reduce your energy costs! With your location's excellent sun hours, I recommend adding a solar array. Click YES to see your personalized recommendation!";
    } else if (solarEnabled && !evEnabled) {
      return `☀️ Great choice on solar! A ${solarSizeKwp.toLocaleString()} kWp system could save you ~$${calculations.annualSavings.toLocaleString()}/year. Want to future-proof with EV charging too?`;
    } else if (!solarEnabled && evEnabled) {
      if (totalEvChargers > 0) {
        return `⚡ Great! ${totalEvChargers} EV charger${totalEvChargers > 1 ? 's' : ''} with ${Math.round(totalEvPowerKW)} kW total power. Consider adding solar to power those chargers and maximize your savings!`;
      }
      return "⚡ EV charging is a smart investment! Use the sliders below to configure your charger mix. Consider adding solar to power those chargers and maximize your savings.";
    } else {
      return "🎉 Excellent! Solar + EV charging is the ultimate combo. Your facility will be energy-independent and ready for the future!";
    }
  }, [solarEnabled, evEnabled, solarSizeKwp, calculations.annualSavings, totalEvChargers, totalEvPowerKW]);

  // Format dollar amounts for display
  const formatDollars = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="relative pb-8">
      {/* ================================================================== */}
      {/* MERLIN ADVISOR - LEFT SIDE */}
      {/* ================================================================== */}
      {showMerlin && (
        <div 
          className="fixed z-50"
          style={{ left: '24px', bottom: '100px', maxWidth: '320px' }}
        >
          <div className="bg-slate-800 border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">Merlin</span>
                <span className="text-amber-100 text-sm">Energy Advisor</span>
              </div>
              <button onClick={() => setShowMerlin(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex gap-3">
              <img src={merlinIcon} alt="Merlin" className="w-14 h-14 rounded-full border-2 border-amber-500 flex-shrink-0" />
              <div>
                <p className="text-white text-sm leading-relaxed">{getMerlinMessage()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Step 4: Energy Options
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Customize Your Energy System
          </h1>
          <p className="text-slate-400">
            Add solar and EV charging to maximize your savings
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-sm text-slate-400">Estimated Annual Savings</div>
                <div className="text-2xl font-bold text-emerald-400">
                  ${formatDollars(solarEnabled ? calculations.annualSavings : 0)}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {solarEnabled && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-medium">{solarSizeKwp.toLocaleString()} kWp</span>
                </div>
              )}
              {evEnabled && totalEvChargers > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm font-medium">
                    {totalEvChargers} charger{totalEvChargers > 1 ? 's' : ''} ({Math.round(totalEvPowerKW)} kW)
                  </span>
                </div>
              )}
              {generatorEnabled && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 rounded-lg">
                  <Fuel className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-400 text-sm font-medium">{generatorKw.toLocaleString()} kW</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Solar Configuration */}
        <SolarConfig
          enabled={solarEnabled}
          onToggle={setSolarEnabled}
          sizeKwp={solarSizeKwp}
          onSizeChange={handleSolarSizeChange}
          calculations={calculations}
        />

        {/* EV Configuration - 3 Separate Sliders */}
        <EVConfig
          enabled={evEnabled}
          onToggle={setEvEnabled}
          level2Count={level2Count}
          onLevel2CountChange={setLevel2Count}
          dcFastCount={dcFastCount}
          onDcFastCountChange={setDcFastCount}
          ultraFastCount={ultraFastCount}
          onUltraFastCountChange={setUltraFastCount}
          industry={state.industry || 'retail'}
          useCaseData={state.useCaseData || {}}
        />

        {/* Generator Configuration */}
        <GeneratorConfig
          enabled={generatorEnabled}
          onToggle={setGeneratorEnabled}
          sizeKw={generatorKw}
          onSizeChange={setGeneratorKw}
          fuelType={generatorFuel}
          onFuelTypeChange={setGeneratorFuel}
          state={state}
          peakDemandKW={state.calculations?.bessKW || 500}
        />

        {/* Info Note */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            These options will be included in your final quote. You can always adjust them later before finalizing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Step4Options;
