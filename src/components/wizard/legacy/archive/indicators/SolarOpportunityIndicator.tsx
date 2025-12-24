/**
 * SolarOpportunityIndicator Component
 * 
 * Displays solar potential based on location and roof/land area.
 * Shows estimated savings and environmental impact.
 */

import React from 'react';
import { Sun, TrendingUp, Leaf, DollarSign, MapPin } from 'lucide-react';

export interface SolarOpportunityIndicatorProps {
  /** State/location for solar irradiance data */
  state: string;
  /** Monthly electric bill for savings calculation */
  monthlyBill?: number;
  /** Electricity rate $/kWh */
  electricityRate?: number;
  /** Available roof or land area in sq ft */
  availableArea?: number;
  /** Currently configured solar in kW */
  configuredSolarKW?: number;
  /** Whether to show compact version */
  compact?: boolean;
  /** Click handler to add solar */
  onAddSolar?: () => void;
}

// Solar irradiance by state (kWh/kW/year) - simplified data
const STATE_SOLAR_IRRADIANCE: Record<string, number> = {
  'AZ': 1800, 'CA': 1700, 'NV': 1750, 'NM': 1780, 'TX': 1600,
  'FL': 1550, 'CO': 1650, 'UT': 1700, 'GA': 1500, 'NC': 1450,
  'SC': 1480, 'AL': 1450, 'LA': 1500, 'MS': 1480, 'TN': 1400,
  'OK': 1550, 'KS': 1500, 'MO': 1400, 'AR': 1450, 'KY': 1350,
  'VA': 1400, 'WV': 1300, 'MD': 1400, 'DE': 1400, 'NJ': 1350,
  'PA': 1300, 'NY': 1250, 'CT': 1300, 'RI': 1300, 'MA': 1280,
  'VT': 1200, 'NH': 1220, 'ME': 1200, 'OH': 1250, 'IN': 1300,
  'IL': 1350, 'MI': 1200, 'WI': 1250, 'MN': 1300, 'IA': 1350,
  'ND': 1350, 'SD': 1400, 'NE': 1450, 'MT': 1400, 'WY': 1500,
  'ID': 1450, 'OR': 1300, 'WA': 1200, 'HI': 1650, 'AK': 900,
};

// Typical solar panel output per sq ft
const WATTS_PER_SQFT = 15; // Conservative estimate

function getSolarRating(state: string): { rating: 'Excellent' | 'Good' | 'Fair' | 'Moderate'; color: string } {
  const irradiance = STATE_SOLAR_IRRADIANCE[state] || 1400;
  if (irradiance >= 1650) return { rating: 'Excellent', color: 'text-green-600' };
  if (irradiance >= 1450) return { rating: 'Good', color: 'text-emerald-600' };
  if (irradiance >= 1300) return { rating: 'Fair', color: 'text-yellow-600' };
  return { rating: 'Moderate', color: 'text-orange-600' };
}

export function SolarOpportunityIndicator({
  state,
  monthlyBill = 0,
  electricityRate = 0.12,
  availableArea = 0,
  configuredSolarKW = 0,
  compact = false,
  onAddSolar
}: SolarOpportunityIndicatorProps) {
  const irradiance = STATE_SOLAR_IRRADIANCE[state] || 1400;
  const { rating, color } = getSolarRating(state);
  
  // Calculate potential solar based on available area
  const maxSolarKW = availableArea > 0 ? (availableArea * WATTS_PER_SQFT) / 1000 : 100; // Default 100kW if no area
  
  // Calculate annual production
  const annualProductionKWh = configuredSolarKW > 0 
    ? configuredSolarKW * irradiance 
    : maxSolarKW * irradiance;
  
  // Calculate savings
  const annualSavings = annualProductionKWh * electricityRate;
  const monthlySavings = annualSavings / 12;
  
  // CO2 offset (EPA: 0.855 lbs CO2 per kWh)
  const annualCO2OffsetLbs = annualProductionKWh * 0.855;
  const annualCO2OffsetTons = annualCO2OffsetLbs / 2000;
  
  // Compact mode
  if (compact) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 cursor-pointer hover:bg-yellow-200 transition-colors"
        onClick={onAddSolar}
        title={`Solar rating: ${rating} (${irradiance} kWh/kW/yr)`}
      >
        <Sun className="w-4 h-4 text-yellow-600" />
        <span className={`text-sm font-medium ${color}`}>
          {rating} Solar
        </span>
      </div>
    );
  }
  
  // Full indicator
  return (
    <div className="rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-gray-800">Solar Opportunity</span>
        </div>
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full bg-white ${color}`}>
          {rating}
        </span>
      </div>
      
      {/* Location Info */}
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
        <MapPin className="w-3 h-3" />
        <span>{state} receives ~{irradiance} kWh/kW/year</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            ${monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500">Monthly Savings</p>
        </div>
        
        <div className="bg-white rounded-lg p-3 text-center">
          <Leaf className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {annualCO2OffsetTons.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">Tons CO₂/year</p>
        </div>
      </div>
      
      {/* Potential */}
      <div className="bg-white/60 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Potential System Size</span>
          <span className="font-semibold text-gray-800">{maxSolarKW.toFixed(0)} kW</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm text-gray-600">Annual Production</span>
          <span className="font-semibold text-gray-800">
            {(annualProductionKWh / 1000).toFixed(0)} MWh
          </span>
        </div>
      </div>
      
      {/* CTA */}
      {onAddSolar && configuredSolarKW === 0 && (
        <button
          onClick={onAddSolar}
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Add Solar to Your Quote
        </button>
      )}
      
      {configuredSolarKW > 0 && (
        <div className="text-center text-sm text-green-600 font-medium">
          ✓ {configuredSolarKW.toFixed(0)} kW Solar configured
        </div>
      )}
    </div>
  );
}

export default SolarOpportunityIndicator;
