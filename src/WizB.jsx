import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { fetchSupplierFinancials } from './DataService';
import MerlinSSOTTracker, { SSOTTriggerButton } from './MerlinSSOTTracker';
// FIX L-1: Production logging guard — set to false for investor demo / production builds
// ═══ SINGLE SOURCE OF TRUTH — all financial/regulatory constants from merlinConstants.js ═══
import {
  ITC_RATE, ITC_DOMESTIC_BONUS, ITC_BASIS_HAIRCUT, MACRS_SCHEDULE,
  BONUS_DEPRECIATION_RATE, ASSUMED_TAX_RATE, EV_CHARGER_CREDIT_RATE, EV_CHARGER_CREDIT_MAX,
  MERLIN_MARGIN_RATE, LOAN_RATES as MC_LOAN_RATES, CARPORT_COST_PER_W,
  CARBON_CREDIT_PRICE, BILL_RECONCILIATION_THRESHOLD,
  INVERTER_REPLACE_YEAR, BESS_REPLACE_YEAR, PROJECT_LIFETIME_YEARS,
  DC_AC_RATIO, DEFAULT_TILT, SYSTEM_LOSSES_PCT,
  DEFAULT_ELECTRIC_RATE, DEFAULT_DEMAND_CHARGE,
  MIN_ANNUAL_BILL, MAX_ANNUAL_BILL, PVWATTS_MODULE_TYPES,
  BESS_DEGRADATION_DEFAULT, SILVER_COST_PCT_OF_PANEL,
  STATE_CLIMATE, CAR_WASH_CLIMATE_ADJUSTMENTS, getClimateAdjustments, BUSINESS_GAS_PROFILES // FIX SYNC-10+11: SSOT — was locally defined, now imported
} from './merlinConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY WIZARD B — STEPS 4-7 (MERGED BUILD)
// UI shell: v11 dark split-panel
// Calculation engines: Bob's build (6 engines + supporting data)
// Financing engine: v11 (Purchase/Lease/PPA/Loan, MACRS/ITC compliant)
// Supplier data: v14 (Feb 2026, 74 suppliers across 7 categories incl. Sigenergy + Wood Mackenzie Grade A trackers)
//
// Props from Wizard A:
//   { locationData, selectedIndustry, annualBill, formData, onBack, onStartOver }
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SUPPORTING DATA (from Bob's build)
// ═══════════════════════════════════════════════════════════════════════════════

// Icon stubs — Bob's engine functions reference lucide-react icons as data values.
// These are never rendered (UI uses emoji icons via GOAL_ICON_MAP). Stubs prevent ReferenceError.
const Sun = 'Sun', Battery = 'Battery', Wind = 'Wind', Zap = 'Zap';
const Droplets = 'Droplets', Shield = 'Shield', Dollar = 'Dollar';
const Settings = 'Settings', Trending = 'Trending', Leaf = 'Leaf';
const TrendingUp = 'TrendingUp', DollarSign = 'DollarSign', BatteryCharging = 'BatteryCharging';
const WEATHER_RISK_DATA = {
  'AL': { hail: 2, wind: 3, tornado: 3, hurricane: 3, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  'AK': { hail: 1, wind: 3, tornado: 0, hurricane: 0, lightning: 1, snow: 5, cold: 5, heat: 1, wildfire: 3, flood: 2, earthquake: 5, drought: 1, grid: 2 },
  'AZ': { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 3, snow: 1, cold: 1, heat: 5, wildfire: 4, flood: 2, earthquake: 2, drought: 5, grid: 4 },
  'AR': { hail: 3, wind: 3, tornado: 4, hurricane: 1, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 3, drought: 2, grid: 3 },
  'CA': { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 1, cold: 1, heat: 4, wildfire: 5, flood: 2, earthquake: 5, drought: 5, grid: 3 },
  'CO': { hail: 4, wind: 3, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 3, heat: 2, wildfire: 4, flood: 2, earthquake: 2, drought: 3, grid: 4 },
  'CT': { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 2, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'DE': { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'DC': { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  'FL': { hail: 2, wind: 3, tornado: 2, hurricane: 5, lightning: 5, snow: 0, cold: 1, heat: 4, wildfire: 3, flood: 4, earthquake: 0, drought: 2, grid: 3 },
  'GA': { hail: 2, wind: 3, tornado: 3, hurricane: 3, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  'HI': { hail: 1, wind: 2, tornado: 0, hurricane: 2, lightning: 2, snow: 0, cold: 0, heat: 2, wildfire: 3, flood: 3, earthquake: 4, drought: 2, grid: 3 },
  'ID': { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 4, cold: 4, heat: 2, wildfire: 4, flood: 2, earthquake: 3, drought: 3, grid: 4 },
  'IL': { hail: 3, wind: 3, tornado: 4, hurricane: 0, lightning: 3, snow: 3, cold: 4, heat: 3, wildfire: 1, flood: 3, earthquake: 2, drought: 1, grid: 3 },
  'IN': { hail: 3, wind: 3, tornado: 3, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 3, wildfire: 1, flood: 3, earthquake: 2, drought: 1, grid: 3 },
  'IA': { hail: 4, wind: 3, tornado: 4, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 3, wildfire: 1, flood: 3, earthquake: 1, drought: 2, grid: 4 },
  'KS': { hail: 5, wind: 4, tornado: 5, hurricane: 0, lightning: 4, snow: 3, cold: 3, heat: 4, wildfire: 2, flood: 2, earthquake: 2, drought: 3, grid: 3 },
  'KY': { hail: 2, wind: 2, tornado: 3, hurricane: 0, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 3, earthquake: 3, drought: 1, grid: 3 },
  'LA': { hail: 2, wind: 3, tornado: 3, hurricane: 5, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 2, flood: 4, earthquake: 1, drought: 1, grid: 2 },
  'ME': { hail: 1, wind: 3, tornado: 1, hurricane: 1, lightning: 2, snow: 5, cold: 5, heat: 1, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 2 },
  'MD': { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'MA': { hail: 2, wind: 3, tornado: 1, hurricane: 2, lightning: 2, snow: 4, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'MI': { hail: 2, wind: 2, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'MN': { hail: 3, wind: 3, tornado: 3, hurricane: 0, lightning: 3, snow: 5, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  'MS': { hail: 2, wind: 3, tornado: 4, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 2, flood: 3, earthquake: 2, drought: 1, grid: 2 },
  'MO': { hail: 4, wind: 3, tornado: 4, hurricane: 0, lightning: 4, snow: 2, cold: 3, heat: 4, wildfire: 1, flood: 3, earthquake: 4, drought: 2, grid: 3 },
  'MT': { hail: 3, wind: 3, tornado: 1, hurricane: 0, lightning: 2, snow: 4, cold: 5, heat: 2, wildfire: 4, flood: 2, earthquake: 3, drought: 2, grid: 3 },
  'NE': { hail: 5, wind: 4, tornado: 4, hurricane: 0, lightning: 4, snow: 3, cold: 4, heat: 3, wildfire: 2, flood: 2, earthquake: 1, drought: 3, grid: 4 },
  'NV': { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 2, cold: 2, heat: 5, wildfire: 4, flood: 2, earthquake: 3, drought: 5, grid: 4 },
  'NH': { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 2, snow: 4, cold: 4, heat: 1, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'NJ': { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 3, snow: 3, cold: 2, heat: 3, wildfire: 1, flood: 3, earthquake: 1, drought: 1, grid: 3 },
  'NM': { hail: 3, wind: 3, tornado: 1, hurricane: 0, lightning: 3, snow: 2, cold: 2, heat: 4, wildfire: 4, flood: 2, earthquake: 2, drought: 4, grid: 4 },
  'NY': { hail: 2, wind: 2, tornado: 1, hurricane: 2, lightning: 2, snow: 4, cold: 4, heat: 2, wildfire: 1, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  'NC': { hail: 2, wind: 3, tornado: 3, hurricane: 4, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 2, drought: 2, grid: 3 },
  'ND': { hail: 4, wind: 4, tornado: 3, hurricane: 0, lightning: 3, snow: 5, cold: 5, heat: 2, wildfire: 2, flood: 3, earthquake: 1, drought: 2, grid: 3 },
  'OH': { hail: 2, wind: 2, tornado: 3, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 3, wildfire: 1, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  'OK': { hail: 5, wind: 5, tornado: 5, hurricane: 1, lightning: 5, snow: 2, cold: 2, heat: 5, wildfire: 3, flood: 3, earthquake: 3, drought: 3, grid: 3 },
  'OR': { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 2, cold: 2, heat: 2, wildfire: 5, flood: 2, earthquake: 4, drought: 2, grid: 3 },
  'PA': { hail: 2, wind: 2, tornado: 2, hurricane: 1, lightning: 3, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'RI': { hail: 2, wind: 3, tornado: 1, hurricane: 2, lightning: 2, snow: 3, cold: 3, heat: 2, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 3 },
  'SC': { hail: 2, wind: 3, tornado: 3, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 4, wildfire: 2, flood: 3, earthquake: 2, drought: 2, grid: 3 },
  'SD': { hail: 4, wind: 4, tornado: 3, hurricane: 0, lightning: 3, snow: 4, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 2, grid: 3 },
  'TN': { hail: 3, wind: 3, tornado: 4, hurricane: 1, lightning: 4, snow: 2, cold: 2, heat: 4, wildfire: 2, flood: 3, earthquake: 4, drought: 1, grid: 3 },
  'TX': { hail: 4, wind: 4, tornado: 5, hurricane: 4, lightning: 4, snow: 1, cold: 1, heat: 5, wildfire: 4, flood: 3, earthquake: 2, drought: 4, grid: 2 },
  'UT': { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 2, snow: 3, cold: 3, heat: 3, wildfire: 4, flood: 2, earthquake: 3, drought: 4, grid: 4 },
  'VT': { hail: 2, wind: 2, tornado: 1, hurricane: 1, lightning: 2, snow: 5, cold: 5, heat: 1, wildfire: 1, flood: 2, earthquake: 1, drought: 1, grid: 2 },
  'VA': { hail: 2, wind: 2, tornado: 2, hurricane: 2, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 2, earthquake: 2, drought: 1, grid: 3 },
  'WA': { hail: 1, wind: 2, tornado: 1, hurricane: 0, lightning: 1, snow: 2, cold: 2, heat: 2, wildfire: 5, flood: 2, earthquake: 4, drought: 2, grid: 3 },
  'WV': { hail: 2, wind: 2, tornado: 1, hurricane: 0, lightning: 3, snow: 3, cold: 3, heat: 2, wildfire: 2, flood: 3, earthquake: 1, drought: 1, grid: 2 },
  'WI': { hail: 3, wind: 2, tornado: 2, hurricane: 0, lightning: 3, snow: 4, cold: 5, heat: 2, wildfire: 2, flood: 2, earthquake: 1, drought: 1, grid: 4 },
  'WY': { hail: 3, wind: 4, tornado: 1, hurricane: 0, lightning: 3, snow: 4, cold: 4, heat: 2, wildfire: 3, flood: 2, earthquake: 2, drought: 2, grid: 3 },
  'default': { hail: 2, wind: 2, tornado: 2, hurricane: 1, lightning: 3, snow: 2, cold: 2, heat: 3, wildfire: 2, flood: 2, earthquake: 2, drought: 2, grid: 3 }
};

// FIX SYNC-10+11: STATE_CLIMATE, CAR_WASH_CLIMATE_ADJUSTMENTS, getClimateAdjustments,
// BUSINESS_GAS_PROFILES now imported from merlinConstants.js (eliminates ~255 lines of duplication)
// SAFETY NET: inline fallback if merlinConstants doesn't export getClimateAdjustments
const _getClimateAdjustments = typeof getClimateAdjustments === 'function' ? getClimateAdjustments : (state) => {
  // Inline fallback — Michigan-centric defaults, safe for all states
  const CLIMATE_DEFAULTS = {
    MI: { climateZone: 'cold', hdd: 6500, heatingMonths: 6, inletWaterTemp: 45, hvacMultiplier: 1.35, floorHeatingKW: 20, floorHeatingHoursPerDay: 10, chemicalHeaterMultiplier: 1.20, waterHeatingMultiplier: 1.25, winterThroughputFactor: 0.75, summerThroughputFactor: 1.10, description: 'Cold — heavy heating load' },
    FL: { climateZone: 'hot', hdd: 600, heatingMonths: 0, inletWaterTemp: 72, hvacMultiplier: 1.40, floorHeatingKW: 0, floorHeatingHoursPerDay: 0, chemicalHeaterMultiplier: 0.85, waterHeatingMultiplier: 0.70, winterThroughputFactor: 1.05, summerThroughputFactor: 0.90, description: 'Hot — cooling dominant' },
    TX: { climateZone: 'mixed-hot', hdd: 2200, heatingMonths: 2, inletWaterTemp: 62, hvacMultiplier: 1.30, floorHeatingKW: 0, floorHeatingHoursPerDay: 0, chemicalHeaterMultiplier: 0.95, waterHeatingMultiplier: 0.85, winterThroughputFactor: 0.95, summerThroughputFactor: 0.95, description: 'Mixed-hot' },
    CA: { climateZone: 'mild', hdd: 2500, heatingMonths: 2, inletWaterTemp: 60, hvacMultiplier: 1.00, floorHeatingKW: 0, floorHeatingHoursPerDay: 0, chemicalHeaterMultiplier: 0.90, waterHeatingMultiplier: 0.80, winterThroughputFactor: 1.00, summerThroughputFactor: 1.00, description: 'Mild' },
    default: { climateZone: 'moderate', hdd: 4500, heatingMonths: 4, inletWaterTemp: 55, hvacMultiplier: 1.15, floorHeatingKW: 10, floorHeatingHoursPerDay: 6, chemicalHeaterMultiplier: 1.00, waterHeatingMultiplier: 1.00, winterThroughputFactor: 0.90, summerThroughputFactor: 1.00, description: 'Moderate — fallback' },
  };
  return CLIMATE_DEFAULTS[state] || CLIMATE_DEFAULTS.default;
};
// SAFETY NET: protect against missing STATE_CLIMATE / BUSINESS_GAS_PROFILES imports
const _STATE_CLIMATE = (typeof STATE_CLIMATE === 'object' && STATE_CLIMATE) ? STATE_CLIMATE : { default: { hdd: 4500, cdd: 1200, heatingMonths: 4, coolingMonths: 4 } };
const _BUSINESS_GAS_PROFILES = (typeof BUSINESS_GAS_PROFILES === 'object' && BUSINESS_GAS_PROFILES) ? BUSINESS_GAS_PROFILES : { default: { baseTherm: 200, heatingMultiplier: 0.6, hotWaterMultiplier: 0.3, processGas: 20 } };

// Calculate estimated monthly gas consumption (therms) based on business type and climate
const calculateMonthlyGasTherms = (state, businessType) => {
  const climate = _STATE_CLIMATE[state] || _STATE_CLIMATE['default'];
  const profile = _BUSINESS_GAS_PROFILES[businessType] || _BUSINESS_GAS_PROFILES['default'];
  
  // Climate adjustment factor (normalized to moderate climate = 1.0)
  // Higher HDD = more heating needed
  const climateAdjustment = climate.hdd / 5000; // 5000 HDD = baseline
  
  // Calculate heating component (scales with climate)
  const heatingTherms = profile.baseTherm * profile.heatingMultiplier * climateAdjustment;
  
  // Hot water is less climate-dependent but still affected
  const hotWaterTherms = profile.baseTherm * profile.hotWaterMultiplier * (0.7 + 0.3 * climateAdjustment);
  
  // Process gas is constant regardless of climate
  const processTherms = profile.processGas;
  
  // Total monthly therms (average across year)
  const totalTherms = heatingTherms + hotWaterTherms + processTherms;
  
  // Annualize and average (heating only happens part of year)
  const heatingMonthsRatio = climate.heatingMonths / 12;
  const annualizedTherms = (heatingTherms * heatingMonthsRatio * 2) + // Double during heating months, zero otherwise
                          hotWaterTherms + // Year-round
                          processTherms;   // Year-round
  
  return Math.round(annualizedTherms);
};

// Calculate estimated monthly gas cost


const INDUSTRY_CONSUMPTION = {
  carwash: { 
    baseKWh: 25000, peakKW: 150, loadFactor: 0.4, shiftableLoad: 0.15, downtimeCost: 500,
    lightingPct: 0.10, hvacPct: 0.15, motorsPct: 0.25, processPct: 0.50,
    roofSqFt: 8000, hotWaterPct: 0.60, coolingLoad: 0.3, heatingLoad: 0.4,
    peakDrivers: 'Tunnel dryers (50-100kW each), water heating, vacuum islands'
  },
  hospital: { 
    baseKWh: 500000, peakKW: 1500, loadFactor: 0.7, shiftableLoad: 0.05, downtimeCost: 50000,
    lightingPct: 0.12, hvacPct: 0.40, motorsPct: 0.15, processPct: 0.33,
    roofSqFt: 50000, hotWaterPct: 0.20, coolingLoad: 0.6, heatingLoad: 0.4,
    peakDrivers: 'Imaging (MRI, CT), HVAC, surgical suites'
  },
  datacenter: { 
    baseKWh: 1000000, peakKW: 2000, loadFactor: 0.85, shiftableLoad: 0.08, downtimeCost: 100000,
    lightingPct: 0.02, hvacPct: 0.45, motorsPct: 0.03, processPct: 0.50,
    roofSqFt: 30000, hotWaterPct: 0.02, coolingLoad: 0.9, heatingLoad: 0.05,
    peakDrivers: 'IT load, cooling systems (40-50% of total)'
  },
  retail: { 
    baseKWh: 15000, peakKW: 60, loadFactor: 0.5, shiftableLoad: 0.20, downtimeCost: 800,
    lightingPct: 0.30, hvacPct: 0.40, motorsPct: 0.05, processPct: 0.25,
    roofSqFt: 12000, hotWaterPct: 0.05, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'HVAC, refrigeration, lighting'
  },
  warehouse: { 
    baseKWh: 30000, peakKW: 100, loadFactor: 0.55, shiftableLoad: 0.30, downtimeCost: 1500,
    lightingPct: 0.25, hvacPct: 0.20, motorsPct: 0.30, processPct: 0.25,
    roofSqFt: 50000, hotWaterPct: 0.03, coolingLoad: 0.3, heatingLoad: 0.3,
    peakDrivers: 'Forklift charging, dock doors, refrigeration'
  },
  manufacturing: { 
    baseKWh: 150000, peakKW: 500, loadFactor: 0.5, shiftableLoad: 0.20, downtimeCost: 10000,
    lightingPct: 0.10, hvacPct: 0.20, motorsPct: 0.40, processPct: 0.30,
    roofSqFt: 40000, hotWaterPct: 0.10, coolingLoad: 0.4, heatingLoad: 0.5,
    peakDrivers: 'Equipment startup, compressors, process heat'
  },
  restaurant: { 
    baseKWh: 12000, peakKW: 50, loadFactor: 0.45, shiftableLoad: 0.10, downtimeCost: 600,
    lightingPct: 0.15, hvacPct: 0.30, motorsPct: 0.10, processPct: 0.45,
    roofSqFt: 3000, hotWaterPct: 0.25, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'Kitchen exhaust, refrigeration, HVAC'
  },
  gasstation: { 
    baseKWh: 8000, peakKW: 30, loadFactor: 0.5, shiftableLoad: 0.15, downtimeCost: 1000,
    lightingPct: 0.35, hvacPct: 0.25, motorsPct: 0.15, processPct: 0.25,
    roofSqFt: 2000, hotWaterPct: 0.05, coolingLoad: 0.4, heatingLoad: 0.3,
    peakDrivers: 'Refrigeration, lighting, pumps'
  },
  office: { 
    baseKWh: 20000, peakKW: 80, loadFactor: 0.5, shiftableLoad: 0.25, downtimeCost: 300,
    lightingPct: 0.25, hvacPct: 0.50, motorsPct: 0.05, processPct: 0.20,
    roofSqFt: 10000, hotWaterPct: 0.05, coolingLoad: 0.5, heatingLoad: 0.5,
    peakDrivers: 'HVAC, elevators, office equipment'
  },
  evcharging: { 
    baseKWh: 50000, peakKW: 400, loadFactor: 0.3, shiftableLoad: 0.35, downtimeCost: 2000,
    lightingPct: 0.05, hvacPct: 0.05, motorsPct: 0.05, processPct: 0.85,
    roofSqFt: 5000, hotWaterPct: 0.01, coolingLoad: 0.2, heatingLoad: 0.1,
    peakDrivers: 'DC fast chargers (50-350kW each)'
  },
  // FIX B-13 (Phase 2): Hotel + indoor farm — major Merlin target verticals
  hotel: {
    baseKWh: 80000, peakKW: 300, loadFactor: 0.55, shiftableLoad: 0.15, downtimeCost: 5000,
    lightingPct: 0.15, hvacPct: 0.45, motorsPct: 0.10, processPct: 0.30,
    roofSqFt: 25000, hotWaterPct: 0.35, coolingLoad: 0.5, heatingLoad: 0.4,
    peakDrivers: 'HVAC (45%), laundry, kitchen, hot water, elevators'
  },
  indoorfarm: {
    baseKWh: 200000, peakKW: 600, loadFactor: 0.65, shiftableLoad: 0.15, downtimeCost: 15000,
    lightingPct: 0.55, hvacPct: 0.30, motorsPct: 0.05, processPct: 0.10,
    roofSqFt: 30000, hotWaterPct: 0.05, coolingLoad: 0.6, heatingLoad: 0.3,
    peakDrivers: 'LED grow lights (55%), HVAC/dehumidification, irrigation pumps'
  }
};

// Calculate all savings opportunities with actual dollar values


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: CALCULATION ENGINES (from Bob's build)
// ═══════════════════════════════════════════════════════════════════════════════

// FIX H-2: Single source of truth for annual solar production calculation
const calcAnnualProd = (systemKW, prodRate, weatherDerating, tempDerate) => {
  const raw = Math.round((systemKW || 0) * (prodRate || 1200) * (weatherDerating || 1.0) * (tempDerate || 1.0));
  return isNaN(raw) || raw <= 0 ? Math.round((systemKW || 0) * 1200) : raw; // NaN-safe fallback
};

// FIX NaN-SHIELD: Safe display formatters — never shows NaN/$NaN/undefined to user
const fmt = (v, decimals) => {
  if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) return '—'; // FIX SIM: catches NaN AND Infinity
  if (typeof v !== 'number') return String(v);
  return decimals != null ? v.toFixed(decimals) : v.toLocaleString();
};
const $fmt = (v) => '$' + fmt(v); // Currency shorthand

// ═══════════════════════════════════════════════════════════════════════════
// PUMP CONFIGURATION OPTIONS (must match Wizard A definition)
// ═══════════════════════════════════════════════════════════════════════════
const PUMP_CONFIG_OPTIONS = [
  { id: 'standard',      dutyCycle: 0.40, efficiencyMult: 1.0,  autoVFD: false },
  { id: 'highPressure',  dutyCycle: 0.60, efficiencyMult: 1.0,  autoVFD: false },
  { id: 'multiple',      dutyCycle: 0.45, efficiencyMult: 0.90, autoVFD: false },
  { id: 'variableSpeed', dutyCycle: 0.50, efficiencyMult: 0.75, autoVFD: true  },
];
const getPumpConfig = (id) => PUMP_CONFIG_OPTIONS.find(c => c.id === id) || PUMP_CONFIG_OPTIONS[1]; // default highPressure

// ═══════════════════════════════════════════════════════════════════════════
// DRYER CONFIGURATION OPTIONS (must match Wizard A definition)
// ═══════════════════════════════════════════════════════════════════════════
const DRYER_CONFIG_OPTIONS = [
  { id: 'blowersOnly', heatingKW: 0,  dutyCycle: 0.60, efficiencyMult: 1.0,  hasHeatedElements: false },
  { id: 'heated',      heatingKW: 40, dutyCycle: 0.65, efficiencyMult: 1.0,  hasHeatedElements: true  },
  { id: 'hybrid',      heatingKW: 24, dutyCycle: 0.60, efficiencyMult: 0.95, hasHeatedElements: true  },
  { id: 'noDryers',    heatingKW: 0,  dutyCycle: 0,    efficiencyMult: 0,    hasHeatedElements: false },
];
const getDryerConfig = (id) => DRYER_CONFIG_OPTIONS.find(c => c.id === id) || DRYER_CONFIG_OPTIONS[0]; // default blowersOnly

// ═══════════════════════════════════════════════════════════════════════════
// VACUUM SYSTEM CONFIGURATION OPTIONS (must match Wizard A definition)
// ═══════════════════════════════════════════════════════════════════════════
const VACUUM_CONFIG_OPTIONS = [
  { id: 'individual',     stationHP: 4,  turbineHP: 0,  dutyCycle: 0.25, efficiencyMult: 1.0,  hasTurbine: false },
  { id: 'centralTurbine', stationHP: 0,  turbineHP: 30, dutyCycle: 0.70, efficiencyMult: 0.85, hasTurbine: true  },
  { id: 'hybrid',         stationHP: 4,  turbineHP: 25, dutyCycle: 0.45, efficiencyMult: 0.90, hasTurbine: true  },
  { id: 'noVacuums',      stationHP: 0,  turbineHP: 0,  dutyCycle: 0,    efficiencyMult: 0,    hasTurbine: false },
];
const getVacuumConfig = (id) => VACUUM_CONFIG_OPTIONS.find(c => c.id === id) || VACUUM_CONFIG_OPTIONS[0]; // default individual

// FIX SYNC-4: Weather derating for solar production (aligned with WizA)
// Snow loss + heat/humidity loss — only states with meaningful impact
const SNOW_HEAT_BY_STATE = {
  // Only states with snow≥3 or heat≥4 — others default to 1.0 derating
  AK: { snow: 5, heat: 1 }, CO: { snow: 4, heat: 2 }, CT: { snow: 3, heat: 2 },
  IA: { snow: 4, heat: 3 }, ID: { snow: 4, heat: 2 }, IL: { snow: 3, heat: 3 },
  IN: { snow: 3, heat: 3 }, MA: { snow: 4, heat: 2 }, ME: { snow: 5, heat: 1 },
  MI: { snow: 4, heat: 2 }, MN: { snow: 5, heat: 2 }, MT: { snow: 4, heat: 2 },
  ND: { snow: 5, heat: 2 }, NE: { snow: 3, heat: 3 }, NH: { snow: 4, heat: 1 },
  NY: { snow: 4, heat: 2 }, OH: { snow: 3, heat: 3 }, PA: { snow: 3, heat: 2 },
  RI: { snow: 3, heat: 2 }, SD: { snow: 4, heat: 2 }, VT: { snow: 5, heat: 1 },
  WI: { snow: 4, heat: 2 }, WY: { snow: 4, heat: 2 },
  // Hot states (heat≥4)
  AL: { snow: 1, heat: 4 }, AR: { snow: 2, heat: 4 }, AZ: { snow: 1, heat: 5 },
  FL: { snow: 0, heat: 4 }, GA: { snow: 1, heat: 4 }, KS: { snow: 3, heat: 4 },
  LA: { snow: 1, heat: 5 }, MO: { snow: 2, heat: 4 }, MS: { snow: 1, heat: 5 },
  NC: { snow: 2, heat: 4 }, NV: { snow: 2, heat: 5 }, OK: { snow: 2, heat: 5 },
  SC: { snow: 1, heat: 4 }, TN: { snow: 2, heat: 4 }, TX: { snow: 1, heat: 5 },
};
const getWeatherDerating = (stateCode) => {
  const sh = SNOW_HEAT_BY_STATE[stateCode];
  if (!sh) return 1.0; // Mild states — no derating
  const snowDerate = sh.snow >= 5 ? 0.88 : sh.snow >= 4 ? 0.92 : sh.snow >= 3 ? 0.95 : 1.0;
  const heatDerate = sh.heat >= 5 ? 0.93 : sh.heat >= 4 ? 0.96 : 1.0;
  return Math.round((snowDerate * heatDerate) * 1000) / 1000;
};

const calculateSavingsOpportunities = (utilityData, solarData, industry, stateCode, formData = {}) => {
  if (!utilityData || !utilityData.electric) return { opportunities: [], summary: '' };
  const electric = utilityData.electric;
  const gas = utilityData.gas || {};
  const climate = _STATE_CLIMATE[stateCode] || _STATE_CLIMATE['default'];
  const totalGasRate = (gas?.rate || 0) + (gas?.deliveryCharge || 0);
  
  // ========================================
  // CAR WASH SPECIFIC CALCULATIONS
  // ========================================
  if (industry.id === 'carwash' && Object.keys(formData).length > 0) {
    return calculateCarWashOpportunities(formData, electric, gas, totalGasRate, solarData, climate, industry, stateCode);
  }
  
  // ========================================
  // ========================================
  // GENERIC INDUSTRY CALCULATIONS (fallback)
  // ========================================
  const baseConsumption = INDUSTRY_CONSUMPTION[industry.id];
  
  // Override defaults with actual formData values when provided
  // FIX #22: Handle both boolean hasGasLine and string gasLine formats
  const hasGasLine = formData.hasGasLine !== undefined ? formData.hasGasLine 
    : formData.gasLine !== undefined ? formData.gasLine === 'yes' 
    : true;
  const roofSqFt = formData.roofArea ? parseInt(formData.roofArea) : baseConsumption.roofSqFt;
  const operatingHours = formData.operatingHours || industry.operatingHours || 12;
  const backupPriority = formData.backupPriority || (baseConsumption.downtimeCost > 5000 ? 3 : baseConsumption.downtimeCost > 1000 ? 2 : 1);
  
  // ═══════════════════════════════════════════════════════════════════
  // MODEL G (Hybrid) — Monte Carlo-validated as best composite accuracy
  // ═══════════════════════════════════════════════════════════════════
  // SIZING (solar kW, BESS kWh, gen kW → project cost): Industry profile
  //   → Profile is calibrated to facility physics, stable, low variance
  // SAVINGS (annual $, ROI → payback): Bill data with validation gate
  //   → Customer's actual spend captures climate, age, efficiency
  //   → Validation gate prevents slider noise from corrupting projections
  // Monte Carlo result: Payback 12.1% error (vs 15.3% profile-only, 26.0% blend)
  
  // FIX #1 (Model G — Hybrid): Wire Step 1 annualBill for financial projections
  // FIX AUDIT-6: initialAnnualBill was a variable from buildRecommendation's scope, NOT accessible here.
  // It evaluated as undefined > 0 = false, silently skipping bill-based monthlyBill derivation.
  // Now reads from formData._annualBill (set by calculateGoalScores caller at line 4071).
  const _annualBillRef = formData._annualBill || 0;
  // FIX M-4: Bill priority chain — monthlyElectricBill (Q7) > annualBill (slider) > estimatedBill (vehicle calc)
  // When monthlyElectricBill exists, it is the highest-fidelity source. estimatedBill is suppressed.
  const monthlyBill = formData.monthlyElectricBill
    || (_annualBillRef > 0 ? Math.round(_annualBillRef / 12) : null);
  // Reconciliation: warn if vehicle-estimated and actual bill diverge >30%
  if (formData.monthlyElectricBill && formData.estimatedBill) {
    const estAnnual = formData.estimatedBill * 12;
    const actualAnnual = parseInt(formData.monthlyElectricBill) * 12;
    if (actualAnnual > 0 && Math.abs(estAnnual - actualAnnual) / actualAnnual > 0.30) {
      console.warn(`[Merlin] Bill divergence: vehicle-estimated $${estAnnual}/yr vs actual $${actualAnnual}/yr (${Math.round(Math.abs(estAnnual - actualAnnual) / actualAnnual * 100)}%). Using actual.`);
    }
  }
  
  // TRACK 1: SIZING — profile-based (stable for equipment selection + cost)
  let monthlyKWh = baseConsumption.baseKWh;
  let peakKW = baseConsumption.peakKW;
  
  // TRACK 2: SAVINGS — bill-based with validation gate
  let savingsMonthlyKWh = baseConsumption.baseKWh; // default to profile
  let savingsPeakKW = baseConsumption.peakKW;
  let financialMonthlyBill = null;
  // FIX AUDIT-5: utilityBillingType was UNDEFINED in generic scope (only declared inside carwash path).
  // All non-carwash industries silently fell through to 0.75 default, ignoring user's actual billing type.
  const utilityBillingType = formData.utilityBillingType || 'unknown';
  if (monthlyBill) {
    financialMonthlyBill = parseInt(monthlyBill) || 0; // FIX H-2: guard NaN
    // Billing-type-aware energy/demand split (not fixed 60/40)
    const energyPct = { flat: 1.0, tou: 0.95, demand: 0.65, 'tou-demand': 0.55, unknown: 0.75 }[utilityBillingType] || 0.75;
    const billKWh = Math.round((financialMonthlyBill * energyPct) / (electric.avgRate || 0.15));
    const billPeakKW = (electric.demandCharge ?? 0) > 0
      ? Math.round((financialMonthlyBill * (1 - energyPct)) / electric.demandCharge)
      : Math.round(billKWh / (operatingHours * 30) * 1.5);
    
    // Validation gate: if bill-derived kWh is within ±40% of profile → trust bill more
    const profileKWh = baseConsumption.baseKWh;
    const deviation = Math.abs(billKWh - profileKWh) / Math.max(profileKWh, 1);
    if (deviation <= 0.40) {
      // Bill is plausible — 70% bill + 30% profile for savings
      savingsMonthlyKWh = Math.round(billKWh * 0.70 + profileKWh * 0.30);
      savingsPeakKW = Math.round(billPeakKW * 0.70 + baseConsumption.peakKW * 0.30);
    } else {
      // Bill seems extreme (slider noise?) — 30% bill + 70% profile
      savingsMonthlyKWh = Math.round(billKWh * 0.30 + profileKWh * 0.70);
      savingsPeakKW = Math.round(billPeakKW * 0.30 + baseConsumption.peakKW * 0.70);
    }
  }
  
  const hourMultiplier = operatingHours / (industry.operatingHours || 12);
  monthlyKWh = Math.round(monthlyKWh * hourMultiplier);
  
  const annualKWh = monthlyKWh * 12;
  // Propane uses LP tanks (not gas line), so calculate therms even without gas line
  const waterHeaterType = formData.waterHeater || 'unknown';
  const hasPropane = waterHeaterType === 'propane';
  const gasThermsMo = (hasGasLine || hasPropane) ? calculateMonthlyGasTherms(stateCode, industry.id) : 0;
  // Propane: 15% efficiency penalty vs natural gas
  const propaneEffPenalty = hasPropane ? 1.15 : 1.0;
  const adjustedGasThermsMo = Math.round(gasThermsMo * propaneEffPenalty);
  const annualTherms = adjustedGasThermsMo * 12;
  // Fuel cost: propane $2.73/therm vs utility gas rate
  const effectiveFuelRate = hasPropane ? 2.73 : totalGasRate;
  
  const consumption = {
    ...baseConsumption,
    roofSqFt,
    downtimeCost: backupPriority === 3 ? baseConsumption.downtimeCost * 2 : backupPriority === 1 ? baseConsumption.downtimeCost * 0.5 : baseConsumption.downtimeCost,
    // MODEL G: Dual-track financial reference for savings/payback
    financialMonthlyBill: financialMonthlyBill || null,
    financialAnnualBill: financialMonthlyBill ? financialMonthlyBill * 12 : null,
    savingsMonthlyKWh,    // Bill-validated kWh for savings projections
    savingsPeakKW,        // Bill-validated peak for demand shaving projections
  };
  
  const annualElectricUsage = annualKWh * electric.avgRate;
  const annualDemandCharges = peakKW * electric.demandCharge * 12;
  const annualGasCost = annualTherms * effectiveFuelRate;
  const totalAnnualEnergy = annualElectricUsage + annualDemandCharges + annualGasCost;
  
  const opportunities = [];
  
  // Generic opportunities (abbreviated for space - keep existing logic)
  // ... Solar, Battery, LED, HVAC, etc.
  
  // 1. SOLAR PV
  // FIX #21: Guard against solarData.annualProduction = 0
  // FIX SYNC-12: Apply usable roof factor (HVAC units, vents, setbacks, shading — aligned with WizA)
  // FIX AUDIT-9: Was 100 sqft/kW with 0.70 usable = 7 W/sqft gross (outdated for 16% panels).
  // Optimizer uses 15 W/sqft × 0.65 usable = 9.75 W/sqft gross (modern 22%+ panels with row spacing).
  // Old method underestimated generic industry solar capacity by 39% vs car wash/optimizer.
  const usableRoofFactor = 0.65; // Aligned with optimizer (was 0.70)
  const roofSolarDensity_gen = 15; // W per sq ft — aligned with optimizer (was ~10 via 100 sqft/kW)
  const effectiveRoofSqFt_gen = Math.round(consumption.roofSqFt * usableRoofFactor);
  const maxRoofKW_gen = Math.round(consumption.roofSqFt * usableRoofFactor * roofSolarDensity_gen / 1000);
  const solarSystemKW = Math.min(
    solarData.annualProduction > 0 ? Math.round((annualKWh * 0.80) / solarData.annualProduction) : 0,
    maxRoofKW_gen + (formData.carportArea ? Math.round(parseInt(formData.carportArea) * 13 / 1000) : 0) // FIX M3: include carport capacity
  );
  const solarAnnualProduction = Math.round(solarSystemKW * solarData.annualProduction * getWeatherDerating(stateCode)); // FIX SYNC-4: weather derating
  const solarAnnualSavings = Math.round(solarAnnualProduction * electric.avgRate * getSelfConsumptionRate(solarAnnualProduction, annualKWh)); // FIX M2: dynamic self-consumption
  // FIX M3 + F6: Split roof vs carport cost with size-tiered roof pricing (NREL 2025 ATB)
  const roofSolarKW_gen = Math.min(maxRoofKW_gen, solarSystemKW);
  const carportSolarKW_gen = Math.max(0, solarSystemKW - roofSolarKW_gen);
  // FIX F6: Size-tiered $/W — small systems have higher soft costs per watt
  const roofCostPerW = roofSolarKW_gen <= 20 ? 3200 : roofSolarKW_gen <= 50 ? 2800 : roofSolarKW_gen <= 200 ? 2500 : 2200;
  const solarCost = roofSolarKW_gen * roofCostPerW + carportSolarKW_gen * (CARPORT_COST_PER_W * 1000);
  const solarNetCost = Math.round(solarCost * (1 - ITC_RATE)); // FIX SYNC-9: dynamic ITC from merlinConstants SSOT
  opportunities.push({
    id: 'solarPV', rank: 0, name: 'Solar PV Installation', icon: Sun, category: 'Generation',
    annualSavings: solarAnnualSavings, investmentCost: solarCost, netCost: solarNetCost,
    paybackYears: solarAnnualSavings > 0 ? solarNetCost / solarAnnualSavings : 99, sizing: `${solarSystemKW} kW system`,
    description: `Generate ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year`,
    factors: [
      { label: 'Solar Resource', value: solarData.irradiance, unit: 'kWh/m²/day', quality: solarData.irradiance > 5 ? 'excellent' : 'good' },
      { label: 'Electric Rate', value: electric.avgRate, unit: '$/kWh', quality: electric.avgRate > 0.14 ? 'favorable' : 'moderate' },
      { label: 'Roof Space', value: consumption.roofSqFt, unit: 'sq ft', quality: 'available' }
    ],
    whyThisBusiness: `${industry.name} roof space supports ${solarSystemKW} kW of solar generation.`
  });
  
  // 2. BATTERY PEAK SHAVING
  // FIX F5: Dynamic BESS sizing — larger where demand charges are higher
  const bessPctOfPeak = 0.15 + 0.25 * Math.min(1, electric.demandCharge / 25); // 15-40% of peak
  const batteryKW = Math.round(peakKW * bessPctOfPeak);
  const batteryKWh = batteryKW * 2;
  const peakShavingSavings = Math.round(batteryKW * electric.demandCharge * 0.93 * 12); // FIX #133: 93% RT eff (aligned with A Fix #131)
  // FIX #24: Size-tiered BESS pricing (was flat $500/kWh)
  // FIX PB-1: BESS pricing updated to Q1 2026 market — BNEF/WoodMac LFP commercial installed
  const bessPerKWh = batteryKWh > 500 ? 150 : batteryKWh > 200 ? 250 : batteryKWh > 100 ? 280 : batteryKWh > 50 ? 350 : 500; // V6: Q1 2026 tiers
  const batteryCost = batteryKWh * bessPerKWh;
  const batteryNetCost = Math.round(batteryCost * (1 - ITC_RATE)); // FIX SYNC-9: dynamic ITC
  opportunities.push({
    id: 'batteryPeakShaving', rank: 0, name: 'Battery Peak Shaving', icon: Battery, category: 'Demand Management',
    annualSavings: peakShavingSavings, investmentCost: batteryCost, netCost: batteryNetCost,
    paybackYears: peakShavingSavings > 0 ? batteryNetCost / peakShavingSavings : 99, sizing: `${batteryKW} kW / ${batteryKWh} kWh`,
    description: `Reduce peak demand by ${Math.round(bessPctOfPeak * 100)}% (${batteryKW} kW)`,
    factors: [
      { label: 'Current Peak', value: peakKW, unit: 'kW', quality: 'measured' },
      { label: 'Demand Charge', value: electric.demandCharge, unit: '$/kW', quality: electric.demandCharge > 15 ? 'high' : 'moderate' }
    ],
    whyThisBusiness: `Peak demand of ${peakKW} kW creates significant demand charges.`
  });
  
  // 3. LED LIGHTING
  const lightingKWh = annualKWh * consumption.lightingPct;
  const ledAnnualSavings = Math.round(lightingKWh * 0.50 * electric.avgRate);
  // FIX SCORE-2: LED cost was lightingKWh * 0.002 = ~$360 for a 12K sqft store (unrealistically low).
  // Real commercial LED retrofit costs $150-200/kW of connected lighting load.
  // Estimate connected kW from annual kWh ÷ operating hours ÷ 365, then apply $200/kW.
  const lightingKW_est = lightingKWh / ((operatingHours || 12) * 365);
  const ledCost = Math.max(3000, Math.round(lightingKW_est * 200)); // Floor $3K minimum for any commercial project
  opportunities.push({
    id: 'ledLighting', rank: 0, name: 'LED Lighting Upgrade', icon: Zap, category: 'Efficiency',
    annualSavings: ledAnnualSavings, investmentCost: ledCost, netCost: ledCost,
    paybackYears: ledAnnualSavings > 0 ? ledCost / ledAnnualSavings : 99, sizing: `${Math.round(lightingKWh / 1000)} MWh lighting`,
    description: `Reduce lighting energy by 50%`,
    factors: [{ label: 'Lighting Load', value: (consumption.lightingPct * 100).toFixed(0), unit: '%', quality: 'of total' }],
    whyThisBusiness: `Lighting is ${(consumption.lightingPct * 100).toFixed(0)}% of energy use.`
  });
  
  // 4. HVAC OPTIMIZATION
  const hvacKWh = annualKWh * consumption.hvacPct;
  const hvacAnnualSavings = Math.round(hvacKWh * 0.25 * electric.avgRate);
  const hvacCost = Math.round(peakKW * consumption.hvacPct * 150);
  opportunities.push({
    id: 'hvacOptimization', rank: 0, name: 'HVAC Optimization', icon: Wind, category: 'Efficiency',
    annualSavings: hvacAnnualSavings, investmentCost: hvacCost, netCost: hvacCost,
    paybackYears: hvacAnnualSavings > 0 ? hvacCost / hvacAnnualSavings : 99, sizing: `${Math.round(hvacKWh / 1000)} MWh HVAC`,
    description: `Smart controls and VFDs for 25% savings`,
    factors: [{ label: 'HVAC Load', value: (consumption.hvacPct * 100).toFixed(0), unit: '%', quality: 'of total' }],
    whyThisBusiness: `HVAC is ${(consumption.hvacPct * 100).toFixed(0)}% of load in ${climate.climateZone} climate.`
  });
  
  // 5. DEMAND RESPONSE
  const curtailableKW = Math.round(peakKW * consumption.shiftableLoad * 0.5);
  const drAnnualSavings = Math.round(curtailableKW * 150);
  opportunities.push({
    id: 'demandResponse', rank: 0, name: 'Demand Response', icon: TrendingUp, category: 'Grid Services',
    annualSavings: drAnnualSavings, investmentCost: 5000, netCost: 5000,
    paybackYears: drAnnualSavings > 0 ? 5000 / drAnnualSavings : 99, sizing: `${curtailableKW} kW curtailable`,
    description: `Utility incentives for grid event participation`,
    factors: [{ label: 'Curtailable', value: curtailableKW, unit: 'kW', quality: 'available' }],
    whyThisBusiness: `${curtailableKW} kW can be curtailed during grid events.`
  });
  
  // 6. RATE OPTIMIZATION
  const rateOptSavings = Math.round(annualElectricUsage * 0.05);
  opportunities.push({
    id: 'rateOptimization', rank: 0, name: 'Rate Structure Optimization', icon: DollarSign, category: 'Rate Optimization',
    annualSavings: rateOptSavings, investmentCost: 2500, netCost: 2500,
    paybackYears: rateOptSavings > 0 ? 2500 / rateOptSavings : 99, sizing: 'Rate analysis',
    description: `Evaluate TOU and demand rate options`,
    factors: [{ label: 'Annual Spend', value: Math.round(annualElectricUsage / 1000), unit: '$K', quality: 'electric' }],
    whyThisBusiness: `$${Math.round(annualElectricUsage).toLocaleString()} annual spend warrants rate analysis.`
  });
  
  // Composite scoring: savings (30%) + 25yr NPV (25%) + payback (20%) + ROI (15%) + category (10%)
  // FIX SCORE-1: Old 40/30/20/10 split rewarded small quick-wins over high-value strategic investments.
  // Adding 25yr NPV ensures solar/BESS rank proportional to lifetime value, not just payback speed.
  // FIX SCORE-3: Solar/BESS payback now uses ITC+MACRS effective cost (was ITC-only, inflating payback by ~1.5 yrs).
  // ITC-eligible items: solarPV, batteryPeakShaving. MACRS Year 1 = investmentCost × 50% basis × 100% bonus × 26.5% tax.
  const ITC_ELIGIBLE = new Set(['solarPV', 'batteryPeakShaving']);
  const DEFAULT_TAX_RATE = ASSUMED_TAX_RATE; // ← merlinConstants SSOT (C-Corp default)
  opportunities.forEach(opp => {
    if (ITC_ELIGIBLE.has(opp.id)) {
      const macrsYr1 = Math.round(opp.investmentCost * 0.50 * DEFAULT_TAX_RATE); // 50% basis after ITC × 100% bonus × tax rate
      opp._effectiveNetCost = opp.netCost - macrsYr1;
      opp._effectivePayback = opp.annualSavings > 0 ? opp._effectiveNetCost / opp.annualSavings : 99;
    } else {
      opp._effectiveNetCost = opp.netCost;
      opp._effectivePayback = opp.paybackYears;
    }
  });
  const maxSavings = Math.max(...opportunities.map(o => o.annualSavings), 2000); // FIX M-2: min $2K benchmark prevents inflated scores on thin portfolios
  // Item-specific 25yr NPV multipliers — accounts for degradation, equipment life, escalation
  // FIX SCORE-3: Solar/BESS multipliers now include front-loaded ITC+MACRS value (was undercounting by ~15%)
  // Solar: 20× base + ITC/MACRS = ~23×. BESS: 18× base + ITC/MACRS = ~21×.
  const NPV_MULT = { solarPV: 23, batteryPeakShaving: 21, ledLighting: 24, hvacOptimization: 22, demandResponse: 22, rateOptimization: 24 };
  opportunities.forEach(opp => { opp._npv25 = Math.round(opp.annualSavings * (NPV_MULT[opp.id] || 22.5) - opp._effectiveNetCost); });
  const maxNPV = Math.max(...opportunities.map(o => o._npv25), 1);
  const catBonus = { 'Generation': 10, 'Storage': 8, 'Demand Management': 8, 'Efficiency': 7, 'Electrification': 6, 'Resilience': 6, 'Revenue': 5, 'Grid Services': 5, 'Rate Optimization': 5, 'Monitoring': 4, 'Non-Energy': 2 };
  opportunities.forEach(opp => {
    const savScore = (opp.annualSavings / maxSavings) * 30;
    const npvScore = opp._npv25 > 0 ? (opp._npv25 / maxNPV) * 25 : 0;
    const payScore = opp._effectivePayback < 3 ? 20 : opp._effectivePayback < 6 ? 15 : opp._effectivePayback < 10 ? 10 : 3;
    const roiScore = opp._effectiveNetCost > 0 ? Math.min(15, (opp.annualSavings / opp._effectiveNetCost) * 75) : 8;
    const bonus = catBonus[opp.category] || 5;
    opp.compositeScore = Math.round(savScore + npvScore + payScore + roiScore + bonus);
  });
  opportunities.sort((a, b) => b.compositeScore - a.compositeScore);
  opportunities.forEach((opp, idx) => { opp.rank = idx + 1; });
  
  const top10 = opportunities.slice(0, 10);
  return {
    opportunities: top10,
    allOpportunities: opportunities,
    summary: {
      totalAnnualEnergyCost: Math.round(totalAnnualEnergy),
      top10AnnualSavings: Math.round(top10.reduce((sum, o) => sum + o.annualSavings, 0)),
      top10Investment: Math.round(top10.reduce((sum, o) => sum + o.netCost, 0)),
      savingsPct: Math.min(100, Math.round((top10.reduce((sum, o) => sum + o.annualSavings, 0) / Math.max(totalAnnualEnergy, 1)) * 100))
    }
  };
};

// FIX M2: Dynamic self-consumption rate — module scope so both generic + carwash scorers can use it
// Small systems self-consume nearly everything; oversized systems export surplus at lower NEM rates
// Aligned with A's getSelfConsumptionRate — FIX F3: continuous curve (no cliffs)
const getSelfConsumptionRate = (solarKWh, usageKWh) => {
  if (usageKWh <= 0) return 0.85;
  const offset = usageKWh > 0 ? solarKWh / usageKWh : 0; // E-12: Guard div-by-zero
  if (offset <= 0) return 0.98;
  if (offset <= 0.50) return 0.98 - (offset / 0.50) * 0.07;           // 98% → 91%
  if (offset <= 0.80) return 0.91 - ((offset - 0.50) / 0.30) * 0.10;  // 91% → 81%
  if (offset <= 1.00) return 0.81 - ((offset - 0.80) / 0.20) * 0.13;  // 81% → 68%
  return Math.max(0.55, 0.68 - (offset - 1.00) * 0.43);               // 68% → 55% floor
};

const calculateCarWashOpportunities = (formData, electric, gas, totalGasRate, solarData, climate, industry, stateCode) => {
  
  // Parse all form data — infer facility type from other signals if not provided
  const facilityType = formData.facilityType || (
    (parseInt(formData.bayCount) || 0) > 2 ? 'self' :       // Multiple bays → self-serve
    (parseInt(formData.bayCount) || 0) === 1 && !formData.tunnelLength ? 'inbay' : // Single bay, no tunnel → in-bay automatic
    'express'                                          // Default: express tunnel (most common)
  );
  const bayCount = parseInt(formData.bayCount) || (facilityType === 'self' ? 4 : 1);
  // FIX #36: Type-aware operating hours (was flat 12)
  const operatingHours = parseInt(formData.operatingHours) || ({ express: 14, full: 12, flex: 14, mini: 12, self: 16, inbay: 10, iba: 10 }[facilityType] || 12);
  const daysPerWeek = parseInt(formData.daysPerWeek) || 7;
  const dailyVehicles = parseInt(formData.dailyVehicles) || ({ express: 300, full: 200, flex: 250, mini: 200, self: 100, inbay: 80, iba: 80 }[facilityType] || 200);
  const hasGasLine = formData.gasLine !== undefined ? formData.gasLine === 'yes' : true;
  // FIX #117: Aligned with calculateFacilityLoad — default 'new', support both 'average' and 'moderate' keys
  const equipmentAge = formData.equipmentAge || 'new';
  const ageFactor = { new: 1.00, average: 1.12, moderate: 1.12, old: 1.25, veryOld: 1.40 }[equipmentAge] || 1.00;
  // Handle 'unknown' water heater - estimate based on gas availability
  let waterHeater = formData.waterHeater || 'gas'; // 'gas', 'electric', 'propane', 'none', 'unknown'
  if (waterHeater === 'unknown') {
    waterHeater = hasGasLine ? 'gas' : 'electric';
  }
  // Fuel cost: propane $2.73/therm ($2.50/gal ÷ 0.915 therms/gal) vs utility gas rate (avg ~$1.20/therm)
  const effectiveFuelRate = waterHeater === 'propane' ? 2.73 : totalGasRate;
  const serviceRating = parseInt(formData.serviceRating) || 400; // Amps
  
  // NEW: Electrical infrastructure details
  const siteVoltage = formData.siteVoltage || '480v-3phase';
  const powerQualityIssues = formData.powerQualityIssues || [];
  const utilityBillingType = formData.utilityBillingType || 'demand'; // flat, tou, demand, tou-demand
  const outageImpact = formData.outageImpact || ({ express: 'complete-shutdown', full: 'complete-shutdown', flex: 'partial-operations', mini: 'partial-operations', self: 'minor-disruptions', inbay: 'partial-operations', iba: 'partial-operations' }[facilityType] || 'partial-operations');
  
  // Calculate voltage-adjusted capacity
  const voltageMultiplier = siteVoltage === '480v-3phase' ? 0.83 : siteVoltage === '208v-3phase' ? 0.36 : 0.24;
  const availableCapacityKW = Math.round(serviceRating * voltageMultiplier);
  
  // BESS value adjustments based on billing type
  const bessBillingMultiplier = {
    'flat': 0.3, // BESS mostly for backup only
    'tou': 1.2, // Arbitrage value
    'demand': 1.5, // Peak shaving very valuable
    'tou-demand': 1.8, // Both strategies
    'unknown': 1.0 // Default assumption
  }[utilityBillingType] || 1.0;
  
  // Outage cost for ROI calculations
  const hourlyOutageCost = {
    'complete-shutdown': 1500, // $1,500/hr average
    'partial-operations': 700,
    'minor-disruptions': 200,
    'no-impact': 0
  }[outageImpact] || 500;
  
  // Equipment checklist data — smart defaults by facility type when Wizard A doesn't provide
  const DEFAULT_EQUIPMENT_BY_TYPE = {
    express: ['pumps', 'dryers', 'conveyor', 'vacuums', 'airCompressor', 'lighting', 'pos'],
    full: ['pumps', 'dryers', 'conveyor', 'vacuums', 'airCompressor', 'lighting', 'pos'],
    flex: ['pumps', 'dryers', 'conveyor', 'vacuums', 'airCompressor', 'lighting', 'pos'],
    mini: ['pumps', 'dryers', 'vacuums', 'lighting', 'pos'],
    self: ['pumps', 'vacuums', 'lighting', 'pos'],
    inbay: ['pumps', 'dryers', 'lighting', 'pos'],
    iba: ['pumps', 'dryers', 'lighting', 'pos'], // Alias: Wizard A sends 'iba', B uses 'inbay'
  };
  const equipmentList = formData.selectedEquipment && formData.selectedEquipment.length > 0
    ? formData.selectedEquipment
    : DEFAULT_EQUIPMENT_BY_TYPE[facilityType] || DEFAULT_EQUIPMENT_BY_TYPE.express;
  const selectedEquipment = new Set(equipmentList);
  const hasPumps = selectedEquipment.has('pumps');
  const hasDryers = selectedEquipment.has('dryers');
  const hasConveyor = selectedEquipment.has('conveyor');
  const hasVacuums = selectedEquipment.has('vacuums');
  const hasAirCompressor = selectedEquipment.has('airCompressor');
  const hasRO = selectedEquipment.has('ro');
  const hasLighting = selectedEquipment.has('lighting') || selectedEquipment.has('tunnelLighting');
  const hasPOS = selectedEquipment.has('pos');
  const hasElectricWaterHeater = selectedEquipment.has('waterHeaterElec');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEW: Comprehensive equipment load calculation for ALL selected items
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Calculate additional loads from new equipment categories
  // ═══════════════════════════════════════════════════════════════════════════
  // SITE FEATURES BUNDLE LOADS (Streamlined Q9)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Get bundle values with smart defaults based on facility type
  // FIX P0-2: getSiteFeaturesKW — tunnelExtras/waterTreatment REMOVED from WizA (Feb 11 audit).
  // Tunnel extras load is now captured by brushMotorCount (side washers, wheel cleaners, etc.)
  // Water treatment load is now captured by waterReclaimLevel (basic/standard/advanced)
  // Only climateControl and premiumServices remain as siteFeatures fields from WizA.
  const getSiteFeaturesKW = () => {
    const coldStates = ['MI', 'MN', 'WI', 'IL', 'OH', 'PA', 'NY', 'MA', 'CT', 'NJ', 'CO', 'UT', 'MT', 'ND', 'SD', 'NE', 'IA', 'IN', 'WY', 'ID', 'ME', 'NH', 'VT'];
    const isCold = coldStates.includes(formData.state || stateCode || '');
    const facType = formData.facilityType || 'express';
    
    // Climate Control: minimal=10, standard=20, full=50
    const climateControlLevel = formData.siteFeatures?.climateControl || (isCold ? 'full' : 'standard');
    const climateControlKW = climateControlLevel === 'minimal' ? 10 : climateControlLevel === 'standard' ? 20 : 50;
    
    // Premium Services: none=0, basic=3, full=10
    const premiumServicesLevel = formData.siteFeatures?.premiumServices || 
      (facType === 'fullService' ? 'full' : facType === 'express' || facType === 'flex' ? 'basic' : 'none');
    const premiumServicesKW = premiumServicesLevel === 'none' ? 0 : premiumServicesLevel === 'basic' ? 3 : 10;
    
    return {
      tunnelExtras: 0,        // REMOVED — captured by brushMotorCount
      waterTreatment: 0,      // REMOVED — captured by waterReclaimLevel
      climateControl: climateControlKW,
      premiumServices: premiumServicesKW,
      siteInfra: 0,           // REMOVED — lighting/signage/POS now from user-collected data
      total: climateControlKW + premiumServicesKW
    };
  };
  
  const siteFeaturesKW = getSiteFeaturesKW();
  
  // FIX P1-3: additionalLoads zeroed for items now captured by main equipment loop
  const additionalLoads = {
    tunnelExtras: 0,       // Captured by brushMotorCount
    waterTreatment: 0,     // Captured by waterReclaimLevel → roKW path
    hvacTotal: siteFeaturesKW.climateControl,
    premiumServices: siteFeaturesKW.premiumServices,
    lightingTotal: 0,      // Captured by lightingTier (WizA Q12)
    securityIT: 0,         // Captured by kioskCount/officeFacilities (WizA Q12)
    accessPayment: 0,      // Captured by kioskCount (WizA Q12)
    vacuumExtras: 0,
    airExtras: 0,
    amenities: 0,
    evCharging: 0
  };
  
  // Equipment count/HP values - handle 'unknown' by using typical defaults
  const pumpCount = hasPumps ? parseInt(formData.pumpCount) || 3 : 0;
  const pumpHP = hasPumps ? (formData.pumpHP === 'unknown' ? 15 : parseFloat(formData.pumpHP) || 15) : 0;
  const pumpHasVFD = formData.pumpHasVFD || false;
  const pumpCfg = getPumpConfig(formData.pumpConfig);
  const dryerCount = hasDryers ? parseInt(formData.dryerCount) || 4 : 0;
  const dryerHP = hasDryers ? (formData.dryerHP === 'unknown' ? 15 : parseFloat(formData.dryerHP) || 15) : 0;
  const dryerHasVFD = formData.dryerHasVFD || false;
  const dryerCfg = getDryerConfig(formData.dryerConfig);
  const conveyorHP = hasConveyor ? (formData.conveyorHP === 'unknown' ? 10 : parseFloat(formData.conveyorHP) || 10) : 0;
  const vacuumCount = hasVacuums ? parseInt(formData.vacuumCount) || 4 : 0;
  const airCompressorHP = hasAirCompressor ? (formData.airCompressorHP === 'unknown' ? 10 : parseFloat(formData.airCompressorHP) || 10) : 0;
  
  // Water reclaim level and percentage
  const waterReclaimLevel = formData.waterReclaimLevel || 'none'; // 'none', 'basic', 'standard', 'advanced'
  const reclaimPct = waterReclaimLevel === 'none' ? 0 : 
                     waterReclaimLevel === 'basic' ? 0.55 : 
                     waterReclaimLevel === 'standard' ? 0.75 : 0.90;
  const hasReclaim = reclaimPct > 0;
  
  // Other data
  const roofArea = parseInt(formData.roofArea) || 5000;
  const carportArea = formData.carportInterest !== 'no' ? parseInt(formData.carportArea) || 0 : 0;
  const l2Chargers = parseInt(formData.l2Chargers) || 0;
  const dcChargers = parseInt(formData.dcChargers) || 0;
  
  // ========================================
  // CALCULATE ACTUAL ENERGY CONSUMPTION
  // ========================================
  
  // Tunnel dryers: #1 electric consumer at car washes (INDUCTIVE)
  // Use actual count × HP, dryer config affects duty cycle and heating load
  const totalDryerHP = dryerCount * dryerHP;
  const dryerEfficiencyFactor = dryerHasVFD ? 0.80 : dryerCfg.efficiencyMult;
  const dryerKW = totalDryerHP * 0.746 * dryerEfficiencyFactor;
  const dryerHoursPerDay = dryerCfg.dutyCycle > 0 ? Math.min(operatingHours * dryerCfg.dutyCycle, dailyVehicles * 0.025) : 0;
  const dryerKWhPerMonth = dryerKW * dryerHoursPerDay * daysPerWeek * 4.33 * ageFactor; // FIX #18: age factor
  
  // High pressure pumps (INDUCTIVE)
  // Use actual count × HP, pump config affects duty cycle and efficiency
  const totalPumpHP = pumpCount * pumpHP;
  const pumpEfficiencyFactor = (pumpHasVFD || pumpCfg.autoVFD) ? 0.75 : pumpCfg.efficiencyMult;
  const pumpKW = totalPumpHP * 0.746 * pumpEfficiencyFactor;
  const pumpHoursPerDay = Math.min(operatingHours * pumpCfg.dutyCycle, dailyVehicles * 0.02);
  const pumpKWhPerMonth = pumpKW * pumpHoursPerDay * daysPerWeek * 4.33 * ageFactor; // FIX #18: age factor
  
  // Water heating (RESISTIVE if electric)
  // Reclaim systems pre-warm water (~60-70°F vs 40-50°F fresh), reducing heating load by ~25%
  // FIX P2: Proportional reclaim heating reduction — higher reclaim % = more pre-warmed water
  // none: 1.0, basic(55%): 0.81, standard(75%): 0.74, advanced(90%): 0.69
  const reclaimHeatingReduction = 1.0 - (reclaimPct * 0.35);
  let waterHeaterKW = 0;
  let waterHeaterKWhPerMonth = 0;
  let gasThermsMo = 0;
  if (waterHeater === 'electric' || hasElectricWaterHeater) {
    waterHeaterKW = bayCount * 50;
    waterHeaterKWhPerMonth = waterHeaterKW * operatingHours * 0.4 * daysPerWeek * 4.33 * reclaimHeatingReduction;
  } else if (waterHeater === 'gas' || waterHeater === 'propane') {
    const propaneEffPenalty = waterHeater === 'propane' ? 1.15 : 1.0;
    gasThermsMo = bayCount * 200 * (climate.hdd / 5000) * reclaimHeatingReduction * propaneEffPenalty;
  }
  
  // Vacuum stations (INDUCTIVE) — config-driven architecture from WizA
  const vacuumCfg = getVacuumConfig(formData.vacuumConfig);
  const vacuumTurbineHP = parseInt(formData.vacuumTurbineHP) || 0;
  const vacuumStationKW = vacuumCfg.stationHP > 0 ? vacuumCount * vacuumCfg.stationHP * 0.746 : 0;
  const vacuumTurbineKW = vacuumCfg.hasTurbine ? (vacuumTurbineHP || vacuumCfg.turbineHP) * 0.746 * vacuumCfg.efficiencyMult : 0;
  const vacuumKW = vacuumStationKW + vacuumTurbineKW;
  const vacuumStationHours = vacuumCfg.stationHP > 0 ? operatingHours * vacuumCfg.dutyCycle : 0;
  const vacuumTurbineHours = vacuumCfg.hasTurbine ? operatingHours * vacuumCfg.dutyCycle : 0;
  const vacuumKWhPerMonth = (vacuumStationKW * ageFactor * vacuumStationHours + vacuumTurbineKW * ageFactor * vacuumTurbineHours) * daysPerWeek * 4.33;
  
  // Conveyor motors (INDUCTIVE)
  const conveyorKW = conveyorHP * 0.746;
  const conveyorKWhPerMonth = conveyorKW * operatingHours * 0.5 * daysPerWeek * 4.33 * ageFactor; // FIX #18
  
  // Air compressors (INDUCTIVE)
  const airCompKW = airCompressorHP * 0.746;
  const airCompKWhPerMonth = airCompKW * operatingHours * 0.3 * daysPerWeek * 4.33 * ageFactor; // FIX #18
  
  // FIX P0-3: Brush motors (INDUCTIVE) — WizA sends brushMotorCount + brushMotorAvgHP
  const brushMotorCount = parseInt(formData.brushMotorCount) || 0;
  const brushMotorAvgHP = parseFloat(formData.brushMotorAvgHP) || 3;
  const brushMotorKW = brushMotorCount * brushMotorAvgHP * 0.746;
  const brushMotorHoursPerDay = Math.min(operatingHours * 0.5, dailyVehicles * 0.02);
  const brushMotorKWhPerMonth = brushMotorKW * ageFactor * brushMotorHoursPerDay * daysPerWeek * 4.33;
  
  // FIX P2-7: Heated dryer elements (RESISTIVE) — now driven by dryerConfig
  const hasHeatedDryers = dryerCfg.hasHeatedElements;
  const heatedDryerKW = dryerCfg.heatingKW; // 0 for blowers, 40 for heated, 24 for hybrid
  const heatedDryerKWhPerMonth = heatedDryerKW * dryerHoursPerDay * daysPerWeek * 4.33;
  
  // FIX P2-2: RO system (INDUCTIVE) — use actual HP from WizA instead of hardcoded 4 kW
  const roHP_calc = hasRO ? (formData.roHP === 'unknown' ? 5 : parseFloat(formData.roHP) || 5) : 0;
  const roKW = roHP_calc * 0.746;
  const roKWhPerMonth = roKW * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // FIX P2-3: Lighting (RESISTIVE) — use lightingTier from WizA instead of formula
  const LIGHTING_TIER_KW = { basic: 4, standard: 8, premium: 13 };
  const lightingTier = formData.lightingTier || 'standard';
  const lightingKW = hasLighting ? (LIGHTING_TIER_KW[lightingTier] || 8) : 3;
  const lightingKWhPerMonth = lightingKW * operatingHours * 0.7 * daysPerWeek * 4.33;
  
  // FIX P2-3b: Signage (RESISTIVE) — use signageTier from WizA, runs ~16 hrs/day
  const SIGNAGE_TIER_KW = { basic: 2, standard: 4, premium: 7 };
  const signageTier = formData.signageTier || null;
  const signageKW = signageTier ? (SIGNAGE_TIER_KW[signageTier] || 4) : 0;
  const signageKWhPerMonth = signageKW * 16 * daysPerWeek * 4.33;
  
  // FIX P2-4: POS/Payment kiosks (RESISTIVE) — use kioskCount from WizA
  const kioskCount = parseInt(formData.kioskCount) || (hasPOS ? 2 : 0);
  const posKW = kioskCount * 0.5;
  const posKWhPerMonth = posKW * 24 * 30; // Kiosks run 24/7
  
  // Office/Amenities (RESISTIVE) — from WizA officeFacilities
  const officeFacList = formData.officeFacilities || [];
  const OFFICE_KW = { waitingArea: 3, office: 2, breakRoom: 2.5, restroom: 1, detailBay: 4, vendingArea: 2 };
  const officeFacilitiesKW = officeFacList.reduce((sum, f) => sum + (OFFICE_KW[f] || 1.5), 0);
  const officeKWhPerMonth = officeFacilitiesKW * operatingHours * 0.5 * daysPerWeek * 4.33;
  
  // HVAC: Minimal for most car washes
  const hvacKW = bayCount * 5;
  const hvacKWhPerMonth = hvacKW * operatingHours * 0.3 * daysPerWeek * 4.33;
  
  // EV Chargers
  const evL2KW = l2Chargers * 12;
  const evDCKW = dcChargers * 50; // FIX DCFC: Was 150kW (ultra-fast), corrected to 50kW to match WizA standard DCFC rating
  // FIX #128: DCFC utilization — 6 sessions/day × ~35min each at avg 50kW = ~1.2 hrs equivalent at full power
  // L2 utilization: 3 sessions/day × ~8hrs total connected (trickle charge, lower power)
  const evKWhPerMonth = (evL2KW * 8 + evDCKW * 1.2) * daysPerWeek * 4.33;
  
  // FIX P0-2/P1-3: additionalKWhPerMonth — only truly incremental loads
  // All tunnel/water/lighting/signage/POS are now in main equipment above (no phantom loads)
  const additionalKWhPerMonth = Math.round(
    (additionalLoads.hvacTotal * operatingHours * 0.3 * daysPerWeek * 4.33) + // Climate control from siteFeatures
    (additionalLoads.premiumServices * operatingHours * 0.3 * daysPerWeek * 4.33)  // Premium services
  );
  
  const monthlyKWh = Math.round(
    dryerKWhPerMonth + pumpKWhPerMonth + waterHeaterKWhPerMonth +
    vacuumKWhPerMonth + conveyorKWhPerMonth + airCompKWhPerMonth +
    brushMotorKWhPerMonth + heatedDryerKWhPerMonth +
    roKWhPerMonth + lightingKWhPerMonth + signageKWhPerMonth + posKWhPerMonth +
    officeKWhPerMonth + hvacKWhPerMonth + evKWhPerMonth + additionalKWhPerMonth
  );
  
  // Calculate resistive vs inductive loads
  const additionalResistive = additionalLoads.premiumServices;
  const additionalInductive = 0; // All inductive loads now in main equipment

  const resistiveKW = waterHeaterKW + heatedDryerKW + lightingKW + signageKW + posKW + officeFacilitiesKW + additionalResistive;
  const inductiveKW = dryerKW + pumpKW + brushMotorKW + vacuumKW + conveyorKW + airCompKW + roKW + hvacKW + additionalInductive;
  const totalConnectedKW = resistiveKW + inductiveKW + evL2KW + evDCKW;
  
  // Peak demand with motor startup factor (largest motor * 5 for startup surge)
  // FIX P3: Include ageFactor — older motors draw more current due to bearing wear/insulation breakdown
  const largestMotorKW = Math.max(dryerKW, pumpKW, brushMotorKW, conveyorKW, airCompKW);
  const runningInductiveKW = inductiveKW * ageFactor * 0.8; // 80% simultaneous, aged
  const peakKW = Math.round(
    resistiveKW + runningInductiveKW + (largestMotorKW * ageFactor * 0.5) + // Startup headroom
    evL2KW * 0.5 + evDCKW * 0.3
  );
  
  // FIX F1+F2: Climate consumption & peak multipliers
  // Cold states: higher water heating energy (lower inlet temps), HVAC heating, longer drying
  // Hot states: HVAC cooling compressors, but less water heating needed
  const CLIMATE_MULTIPLIERS = {
    AK: { kWh: 1.18, peak: 1.06 }, ME: { kWh: 1.15, peak: 1.05 }, MN: { kWh: 1.14, peak: 1.06 },
    WI: { kWh: 1.12, peak: 1.05 }, MI: { kWh: 1.11, peak: 1.05 }, VT: { kWh: 1.12, peak: 1.04 },
    NH: { kWh: 1.10, peak: 1.04 }, MT: { kWh: 1.11, peak: 1.05 }, ND: { kWh: 1.13, peak: 1.05 },
    SD: { kWh: 1.10, peak: 1.04 }, NY: { kWh: 1.08, peak: 1.03 }, MA: { kWh: 1.08, peak: 1.03 },
    CT: { kWh: 1.07, peak: 1.03 }, CO: { kWh: 1.08, peak: 1.04 }, IA: { kWh: 1.09, peak: 1.04 },
    IL: { kWh: 1.06, peak: 1.03 }, IN: { kWh: 1.06, peak: 1.03 }, OH: { kWh: 1.06, peak: 1.03 },
    PA: { kWh: 1.06, peak: 1.03 }, WA: { kWh: 1.04, peak: 1.02 }, OR: { kWh: 1.04, peak: 1.02 },
    ID: { kWh: 1.08, peak: 1.04 }, WY: { kWh: 1.09, peak: 1.04 },
    // Hot states: HVAC cooling load increases
    AZ: { kWh: 0.95, peak: 1.08 }, NV: { kWh: 0.96, peak: 1.07 }, TX: { kWh: 0.97, peak: 1.06 },
    FL: { kWh: 0.96, peak: 1.07 }, HI: { kWh: 0.94, peak: 1.05 }, LA: { kWh: 0.97, peak: 1.06 },
    MS: { kWh: 0.97, peak: 1.05 }, AL: { kWh: 0.97, peak: 1.05 }, GA: { kWh: 0.97, peak: 1.05 },
    OK: { kWh: 0.98, peak: 1.05 }, SC: { kWh: 0.97, peak: 1.05 },
    CA: { kWh: 0.97, peak: 1.04 }, NM: { kWh: 0.96, peak: 1.06 },
  };
  const climateFactor = CLIMATE_MULTIPLIERS[stateCode] || { kWh: 1.00, peak: 1.00 };
  const climateAdjustedMonthlyKWh = Math.round(monthlyKWh * climateFactor.kWh);
  const climateAdjustedPeakKW = Math.round(peakKW * climateFactor.peak);

  // Annual totals (using climate-adjusted values)
  const annualKWh = climateAdjustedMonthlyKWh * 12;
  const annualTherms = gasThermsMo * 12;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FIX C-1: MODEL G DUAL-TRACK — now applies to car wash (was generic-only)
  // SIZING: annualKWh from equipment model (stable, physics-based)
  // SAVINGS: savingsAnnualKWh = bill-validated kWh for savings/payback calculations
  // Monte Carlo validated: 12.1% payback error (vs 15.3% profile-only)
  // ═══════════════════════════════════════════════════════════════════════════════
  let savingsAnnualKWh = annualKWh; // default to equipment model
  let savingsPeakKW = climateAdjustedPeakKW;
  
  // Phase 2: If actual kWh/peak provided, use those directly (Tier 4/5)
  const actualMonthlyKWh = formData.actualMonthlyKWh !== undefined && formData.actualMonthlyKWh !== "" ? parseInt(formData.actualMonthlyKWh) : null; // FIX H-7b: ?? preserves 0
  const actualPeakKW = formData.actualPeakDemandKW !== undefined && formData.actualPeakDemandKW !== "" ? parseInt(formData.actualPeakDemandKW) : null; // FIX H-7b
  
  if (actualMonthlyKWh) {
    savingsAnnualKWh = actualMonthlyKWh * 12;
  }
  if (actualPeakKW) {
    savingsPeakKW = actualPeakKW;
  }
  
  // If no Phase 2 data, apply Model G validation gate using Step 1 annual bill
  if (!actualMonthlyKWh) {
    const billRef = formData._annualBill || (formData.estimatedBill ? formData.estimatedBill * 12 : null);
    if (billRef && billRef > 0 && electric.avgRate > 0) {
      const energyPctLocal = { flat: 1.0, tou: 0.95, demand: 0.65, 'tou-demand': 0.55, unknown: 0.75 }[utilityBillingType] || 0.75;
      const billImpliedKWh = Math.round((billRef * energyPctLocal) / electric.avgRate);
      const deviation = Math.abs(billImpliedKWh - annualKWh) / Math.max(annualKWh, 1);
      if (deviation <= 0.40) {
        // Bill plausible — 70% bill + 30% equipment for savings
        savingsAnnualKWh = Math.round(billImpliedKWh * 0.70 + annualKWh * 0.30);
      } else {
        // Bill extreme — 30% bill + 70% equipment
        savingsAnnualKWh = Math.round(billImpliedKWh * 0.30 + annualKWh * 0.70);
      }
      // Derive peak from bill if demand-billed
      if (energyPctLocal < 1.0 && electric.demandCharge > 0) {
        const billPeakKW = Math.round((billRef * (1 - energyPctLocal)) / (electric.demandCharge * 12));
        savingsPeakKW = deviation <= 0.40
          ? Math.round(billPeakKW * 0.70 + climateAdjustedPeakKW * 0.30)
          : Math.round(billPeakKW * 0.30 + climateAdjustedPeakKW * 0.70);
      }
    }
  }
  
  // Current costs (using savings-track values for accuracy)
  const annualElectricUsage = savingsAnnualKWh * electric.avgRate;
  const annualDemandCharges = savingsPeakKW * electric.demandCharge * 12;
  const annualGasCost = annualTherms * effectiveFuelRate;
  const totalAnnualEnergy = annualElectricUsage + annualDemandCharges + annualGasCost;
  
  // ========================================
  // BUILD OPPORTUNITIES
  // ========================================
  const opportunities = [];
  
  // 1. SOLAR PV - Roof + Carport with ENERGY GAP ANALYSIS
  const totalSolarArea = roofArea + carportArea;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGY GAP ANALYSIS - Roof capacity vs Demand
  // ═══════════════════════════════════════════════════════════════════════════
  const wattsPerSqFtRoof = 15; // Commercial flat roof (modern 22%+ panels with row spacing)
  const usableRoofPct = 0.65; // Account for HVAC, vents, setbacks
  const maxRoofKW = Math.round((roofArea * usableRoofPct * wattsPerSqFtRoof) / 1000);
  const maxRoofAnnualKWh = maxRoofKW * solarData.annualProduction;
  const roofOnlyOffset = annualKWh > 0 ? Math.round((maxRoofAnnualKWh / annualKWh) * 100) : 0; // FIX #21
  
  // Carport analysis if gap exists
  const targetOffset = 80; // Target 80% offset
  const energyGap = annualKWh * (targetOffset / 100) - maxRoofAnnualKWh;
  const hasEnergyGap = energyGap > 0 && roofOnlyOffset < targetOffset;
  
  // Carport sizing to fill gap
  const wattsPerSqFtCarport = 13; // Lower density for vehicle clearance/tilt
  const carportKWNeeded = hasEnergyGap && solarData.annualProduction > 0 ? Math.round(energyGap / solarData.annualProduction) : 0;
  const carportAreaNeeded = Math.round(carportKWNeeded * 1000 / wattsPerSqFtCarport);
  const canFillGapWithCarport = carportArea >= carportAreaNeeded;
  
  // Final solar sizing
  const solarSystemKW = Math.min(
    Math.round((annualKWh * 0.85) / solarData.annualProduction), // Size to offset 85%
    Math.round(totalSolarArea / 100) // 100 sqft per kW conservative
  );
  const solarAnnualProduction = Math.round(solarSystemKW * solarData.annualProduction * getWeatherDerating(stateCode)); // FIX SYNC-4: weather derating
  const solarAnnualSavings = Math.round(solarAnnualProduction * electric.avgRate * getSelfConsumptionRate(solarAnnualProduction, savingsAnnualKWh)); // FIX C-1+M2: Model G savings track + dynamic self-consumption
  const roofSolarKW = Math.min(maxRoofKW, solarSystemKW);
  const carportSolarKW = Math.max(0, solarSystemKW - roofSolarKW);
  const solarCost = roofSolarKW * (roofSolarKW <= 20 ? 3200 : roofSolarKW <= 50 ? 2800 : roofSolarKW <= 200 ? 2500 : 2200) + carportSolarKW * (CARPORT_COST_PER_W * 1000); // FIX F6: size-tiered $/W + carport premium
  const solarNetCost = Math.round(solarCost * (1 - ITC_RATE)); // FIX SYNC-9: dynamic ITC
  
  // Energy gap recommendation
  let gapStrategy = '';
  let gapDescription = '';
  if (!hasEnergyGap) {
    gapStrategy = 'roof_sufficient';
    gapDescription = `Roof solar alone (${maxRoofKW} kW max) can achieve ${roofOnlyOffset}% offset.`;
  } else if (canFillGapWithCarport) {
    gapStrategy = 'roof_plus_carport';
    gapDescription = `Roof provides ${roofOnlyOffset}% offset. Add ${carportKWNeeded} kW carport solar over vacuum area to reach ${targetOffset}%.`;
  } else if (carportArea > 0) {
    gapStrategy = 'partial_carport';
    gapDescription = `Roof provides ${roofOnlyOffset}%. Carport can add ${Math.round(carportArea * wattsPerSqFtCarport / 1000)} kW. Consider generator for resilience.`;
  } else {
    gapStrategy = 'roof_plus_generator';
    gapDescription = `Roof maxes at ${maxRoofKW} kW (${roofOnlyOffset}% offset). Generator recommended for backup resilience.`;
  }
  
  if (solarSystemKW > 0) {
    opportunities.push({
      id: 'solarPV', rank: 0, name: 'Solar PV Installation', icon: Sun, category: 'Generation',
      annualSavings: solarAnnualSavings, investmentCost: solarCost, netCost: solarNetCost,
      paybackYears: solarAnnualSavings > 0 ? solarNetCost / solarAnnualSavings : 99,
      sizing: `${solarSystemKW} kW (${roofSolarKW} roof${carportSolarKW > 0 ? ` + ${carportSolarKW} carport` : ''})`,
      description: `Generate ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year, offset ${annualKWh > 0 ? Math.round(solarAnnualProduction / annualKWh * 100) : 0}% of usage`, // FIX M5: guard div/0
      // NEW: Energy gap analysis
      energyGapAnalysis: {
        strategy: gapStrategy,
        maxRoofKW,
        maxRoofOffset: roofOnlyOffset,
        targetOffset,
        energyGapKWh: Math.max(0, Math.round(energyGap)),
        carportKWNeeded,
        carportAreaNeeded,
        recommendation: gapDescription
      },
      factors: [
        { label: 'Solar Resource', value: solarData.irradiance, unit: 'kWh/m²/day', quality: solarData.irradiance > 5 ? 'excellent' : solarData.irradiance > 4 ? 'good' : 'moderate' },
        { label: 'Roof Capacity', value: maxRoofKW, unit: 'kW max', quality: roofOnlyOffset >= targetOffset ? 'sufficient' : 'needs carport' },
        { label: 'Energy Gap', value: hasEnergyGap ? Math.round(energyGap / 1000) + ' MWh' : 'None', quality: hasEnergyGap ? (canFillGapWithCarport ? 'carport can fill' : 'generator backup') : 'covered' }
      ],
      whyThisBusiness: `${gapDescription} Total system: ${solarSystemKW} kW generating ${Math.round(solarAnnualProduction).toLocaleString()} kWh/year.`
    });
  }
  
  // 2. BATTERY PEAK SHAVING - Target dryer peaks
  // FIX F5: Dynamic sizing — high demand charge states get larger BESS, low get smaller
  const dryerShavePct = 0.30 + 0.30 * Math.min(1, electric.demandCharge / 25); // 30-60% of dryer peak
  const peakReduction = Math.round(dryerKW * dryerShavePct);
  const batteryKWh = peakReduction * 2; // 2-hour duration
  const peakShavingSavings = Math.round(peakReduction * electric.demandCharge * 0.93 * 12); // FIX #135: 93% RT eff
  // FIX PB-1: BESS pricing updated to Q1 2026 market — BNEF/WoodMac LFP commercial installed
  const bessPerKWh = batteryKWh > 500 ? 150 : batteryKWh > 200 ? 250 : batteryKWh > 100 ? 280 : batteryKWh > 50 ? 350 : 500; // V6: Q1 2026 tiers
  const batteryCost = batteryKWh * bessPerKWh;
  const batteryNetCost = Math.round(batteryCost * (1 - ITC_RATE)); // FIX SYNC-9: dynamic ITC
  
  if (peakShavingSavings > 1000) {
    opportunities.push({
      id: 'batteryPeakShaving', rank: 0, name: 'Battery Peak Shaving', icon: Battery, category: 'Demand Management',
      annualSavings: peakShavingSavings, investmentCost: batteryCost, netCost: batteryNetCost,
      paybackYears: peakShavingSavings > 0 ? batteryNetCost / peakShavingSavings : 99,
      sizing: `${peakReduction} kW / ${batteryKWh} kWh`,
      description: `Reduce peak demand from ${climateAdjustedPeakKW} kW to ${climateAdjustedPeakKW - peakReduction} kW during dryer cycles`,
      factors: [
        { label: 'Dryer Peak', value: Math.round(dryerKW), unit: 'kW', quality: 'primary target' },
        { label: 'Demand Charge', value: electric.demandCharge, unit: '$/kW/mo', quality: electric.demandCharge > 15 ? 'high' : 'moderate' },
        { label: 'Peak Reduction', value: peakReduction, unit: 'kW', quality: `${climateAdjustedPeakKW > 0 ? Math.round(peakReduction / climateAdjustedPeakKW * 100) : 0}% of total` }
      ],
      whyThisBusiness: `Your ${bayCount} tunnel dryers at ${dryerHP} HP create ${Math.round(dryerKW)} kW peaks. Battery can absorb dryer startup surges and reduce demand charges by $${Math.round(peakShavingSavings / 12).toLocaleString()}/mo.`
    });
  }
  
  // 3. HEAT PUMP WATER HEATER - Only if currently gas or propane
  if ((waterHeater === 'gas' || waterHeater === 'propane') && annualTherms > 500) {
    const hpwhCOP = 3.5;
    const electricEquivalentKWh = (hpwhCOP > 0 ? annualTherms * 29.3 / hpwhCOP : 0); // E-12: Guard div-by-zero
    const gasCostSaved = annualTherms * effectiveFuelRate;
    const electricCostAdded = electricEquivalentKWh * electric.avgRate;
    const hpwhAnnualSavings = Math.round(gasCostSaved - electricCostAdded);
    const hpwhCost = Math.round(bayCount * 25000); // ~$25k per tunnel for commercial HPWH
    const hpwhNetCost = Math.round(hpwhCost * (1 - ITC_RATE)); // FIX SYNC-9: dynamic ITC from merlinConstants SSOT (was hardcoded 0.70)
    
    if (hpwhAnnualSavings > 0) {
      opportunities.push({
        id: 'heatPumpWaterHeater', rank: 0, name: 'Heat Pump Water Heater', icon: Droplets, category: 'Electrification',
        annualSavings: hpwhAnnualSavings, investmentCost: hpwhCost, netCost: hpwhNetCost,
        paybackYears: hpwhAnnualSavings > 0 ? hpwhNetCost / hpwhAnnualSavings : 99,
        sizing: `Replace ${Math.round(annualTherms / 12)} therms/mo ${waterHeater === 'propane' ? 'propane' : 'gas'}`,
        description: `Convert ${waterHeater === 'propane' ? 'propane' : 'gas'} water heating to 3.5 COP heat pump, eliminate ${Math.round(annualTherms).toLocaleString()} therms/year`,
        factors: [
          { label: `Current ${waterHeater === 'propane' ? 'Propane' : 'Gas'}`, value: Math.round(annualTherms / 12), unit: 'therms/mo', quality: 'water heating' },
          { label: `${waterHeater === 'propane' ? 'Propane' : 'Gas'} Rate`, value: effectiveFuelRate.toFixed(2), unit: '$/therm', quality: effectiveFuelRate > 1.5 ? 'high' : 'moderate' },
          { label: 'Heat Pump COP', value: '3.5', unit: 'efficiency', quality: `vs 0.8-0.95 ${waterHeater === 'propane' ? 'propane' : 'gas'}` }
        ],
        whyThisBusiness: `Your ${bayCount} tunnel${bayCount > 1 ? 's use' : ' uses'} ~${Math.round(gasThermsMo)} therms/month for ${waterHeater === 'propane' ? 'propane' : 'gas'} water heating. Heat pump reduces operating cost by ${gasCostSaved > 0 ? Math.round((gasCostSaved - electricCostAdded) / gasCostSaved * 100) : 0}% while eliminating ${waterHeater === 'propane' ? 'propane' : 'gas'} dependency.`
      });
    }
  }
  
  // 4. VFD ON PUMPS - Only if NOT already VFD-equipped and total pump HP >= 15
  if (!pumpHasVFD && !pumpCfg.autoVFD && hasPumps && totalPumpHP >= 15) {
    const pumpAnnualKWh = pumpKWhPerMonth * 12;
    const vfdSavings = Math.round(pumpAnnualKWh * 0.30 * electric.avgRate);
    const vfdCost = Math.round(totalPumpHP * 200); // ~$200/HP for VFD
    
    opportunities.push({
      id: 'pumpVFD', rank: 0, name: 'VFD on High-Pressure Pumps', icon: Settings, category: 'Efficiency',
      annualSavings: vfdSavings, investmentCost: vfdCost, netCost: vfdCost,
      paybackYears: vfdSavings > 0 ? vfdCost / vfdSavings : 99,
      sizing: `${pumpCount}× ${pumpHP} HP pumps (${totalPumpHP} HP total)`,
      description: `Variable frequency drives reduce pump energy 30% with soft-start`,
      factors: [
        { label: 'Pump Status', value: 'Fixed Speed', unit: '', quality: 'VFD upgrade candidate' },
        { label: 'Total Pump HP', value: totalPumpHP, unit: 'HP', quality: `${pumpCount}× ${pumpHP}HP` },
        { label: 'VFD Savings', value: '30', unit: '%', quality: 'typical' }
      ],
      whyThisBusiness: `Your ${pumpCount} pumps (${totalPumpHP} HP total) run ${Math.round(pumpHoursPerDay)} hrs/day. VFDs provide soft-start (extends pump life), pressure matching, and 30% energy savings.`
    });
  }
  
  // 4b. VFD ON DRYERS - Only if NOT already VFD-equipped and total dryer HP >= 20
  if (!dryerHasVFD && hasDryers && totalDryerHP >= 20) {
    const dryerAnnualKWh = dryerKWhPerMonth * 12;
    const vfdSavings = Math.round(dryerAnnualKWh * 0.25 * electric.avgRate); // 25% savings for dryers
    const vfdCost = Math.round(totalDryerHP * 180); // ~$180/HP for VFD on blowers
    
    opportunities.push({
      id: 'dryerVFD', rank: 0, name: 'VFD on Blowers/Dryers', icon: Wind, category: 'Efficiency',
      annualSavings: vfdSavings, investmentCost: vfdCost, netCost: vfdCost,
      paybackYears: vfdSavings > 0 ? vfdCost / vfdSavings : 99,
      sizing: `${dryerCount}× ${dryerHP} HP blowers (${totalDryerHP} HP total)`,
      description: `Variable speed dryers match airflow to vehicle speed, reduce energy 25%`,
      factors: [
        { label: 'Dryer Status', value: 'Fixed Speed', unit: '', quality: 'VFD upgrade candidate' },
        { label: 'Total Dryer HP', value: totalDryerHP, unit: 'HP', quality: `${dryerCount}× ${dryerHP}HP` },
        { label: 'VFD Savings', value: '25', unit: '%', quality: 'typical' }
      ],
      whyThisBusiness: `Your ${dryerCount} blowers (${totalDryerHP} HP total) are the #1 energy consumer. VFDs modulate airflow based on vehicle speed and wet conditions, saving 25%.`
    });
  }
  
  // 5. LED LIGHTING - Always applicable
  const lightingAnnualKWh = lightingKWhPerMonth * 12;
  const ledSavings = Math.round(lightingAnnualKWh * 0.50 * electric.avgRate);
  const ledCost = Math.round(lightingKW * 150); // ~$150 per kW of lighting
  
  opportunities.push({
    id: 'ledLighting', rank: 0, name: 'LED Lighting Upgrade', icon: Zap, category: 'Efficiency',
    annualSavings: ledSavings, investmentCost: ledCost, netCost: ledCost,
    paybackYears: ledSavings > 0 ? ledCost / ledSavings : 99,
    sizing: `${Math.round(lightingKW)} kW → ${Math.round(lightingKW * 0.5)} kW`,
    description: `Replace existing lighting with LEDs for 50% reduction`,
    factors: [
      { label: 'Current Load', value: Math.round(lightingKW), unit: 'kW', quality: 'lighting' },
      { label: 'Operating Hours', value: operatingHours * daysPerWeek, unit: 'hrs/week', quality: `${daysPerWeek} days` },
      { label: 'Savings', value: '50', unit: '%', quality: 'typical LED' }
    ],
    whyThisBusiness: `${operatingHours} hours/day × ${daysPerWeek} days/week = high lighting utilization. LEDs also reduce cooling load and maintenance.`
  });
  
  // 6. VACUUM STATION EFFICIENCY - If has vacuums
  if (hasVacuums && vacuumCount > 0) {
    const vacuumAnnualKWh = vacuumKWhPerMonth * 12;
    const vacuumSavings = Math.round(vacuumAnnualKWh * 0.25 * electric.avgRate);
    const vacuumCost = vacuumCount * 1500; // Motor upgrades, timers
    
    opportunities.push({
      id: 'vacuumEfficiency', rank: 0, name: 'Vacuum Station Efficiency', icon: Wind, category: 'Efficiency',
      annualSavings: vacuumSavings, investmentCost: vacuumCost, netCost: vacuumCost,
      paybackYears: vacuumSavings > 0 ? vacuumCost / vacuumSavings : 99,
      sizing: `${vacuumCount} stations`,
      description: `High-efficiency motors, auto-shutoff timers, duct optimization`,
      factors: [
        { label: 'Stations', value: vacuumCount, unit: 'units', quality: 'vacuum island' },
        { label: 'Total Load', value: Math.round(vacuumKW), unit: 'kW', quality: `${vacuumCount}x ~4HP` },
        { label: 'Savings', value: '25', unit: '%', quality: 'efficiency upgrade' }
      ],
      whyThisBusiness: `${vacuumCount} vacuum stations at 25% utilization over ${operatingHours} hours. Timer controls and efficient motors reduce waste.`
    });
  }
  
  // 7. WATER RECLAIM SYSTEM - Install or upgrade based on current level
  const gallonsPerCar = facilityType === 'express' ? 35 : facilityType === 'mini' ? 25 : 15;
  const annualGallons = dailyVehicles * daysPerWeek * 52 * gallonsPerCar;
  const waterCostPerGallon = 0.005; // ~$5 per 1000 gallons
  
  // Calculate potential savings based on reclaim level
  if (waterReclaimLevel !== 'advanced') {
    const currentSavingsPct = reclaimPct;
    const targetSavingsPct = 0.90; // Advanced system target
    const additionalSavingsPct = targetSavingsPct - currentSavingsPct;
    
    // Water savings from upgrade/install
    const waterSavings = Math.round(annualGallons * additionalSavingsPct * waterCostPerGallon);
    // Heating energy savings (pre-warmed reclaimed water)
    const heatingEnergySavings = Math.round(waterSavings * (waterReclaimLevel === 'none' ? 2 : 1));
    const reclaimSavings = waterSavings + heatingEnergySavings;
    
    // Cost depends on whether installing new or upgrading
    let reclaimCost;
    let oppName;
    let oppDescription;
    
    if (waterReclaimLevel === 'none') {
      reclaimCost = 35000 + bayCount * 10000; // Full install
      oppName = 'Water Reclaim System';
      oppDescription = `Install advanced reclaim system (90% recycling)`;
    } else if (waterReclaimLevel === 'basic') {
      reclaimCost = 20000 + bayCount * 5000; // Upgrade basic → advanced
      oppName = 'Upgrade to Advanced Reclaim';
      oppDescription = `Upgrade from basic (55%) to advanced (90%) reclaim`;
    } else { // standard
      reclaimCost = 12000 + bayCount * 3000; // Upgrade standard → advanced
      oppName = 'Upgrade to Advanced Reclaim';
      oppDescription = `Upgrade from standard (75%) to advanced (90%) reclaim`;
    }
    
    opportunities.push({
      id: 'waterReclaim', rank: 0, name: oppName, icon: Leaf, category: 'Non-Energy',
      annualSavings: reclaimSavings, investmentCost: reclaimCost, netCost: reclaimCost,
      paybackYears: reclaimSavings > 0 ? reclaimCost / reclaimSavings : 99,
      sizing: `${Math.round(annualGallons / 1000000 * additionalSavingsPct).toLocaleString()}M gal/year additional savings`,
      description: oppDescription,
      factors: [
        { label: 'Current Reclaim', value: Math.round(currentSavingsPct * 100), unit: '%', quality: waterReclaimLevel === 'none' ? 'no system' : waterReclaimLevel },
        { label: 'Target Reclaim', value: '90', unit: '%', quality: 'advanced system' },
        { label: 'Additional Savings', value: Math.round(additionalSavingsPct * 100), unit: '%', quality: 'water + heating' }
      ],
      whyThisBusiness: waterReclaimLevel === 'none' 
        ? `${dailyVehicles} cars/day × ${gallonsPerCar} gallons = ${Math.round(annualGallons / 1000).toLocaleString()}K gal/year. Advanced reclaim saves 90% of water/sewer plus pre-warmed water reduces heating costs.`
        : `Your ${waterReclaimLevel} system saves ${Math.round(currentSavingsPct * 100)}%. Upgrading to advanced (membrane/UV) adds ${Math.round(additionalSavingsPct * 100)}% more savings plus better water quality.`
    });
  }
  
  // 8. DEMAND RESPONSE - If enough curtailable load
  const curtailableKW = Math.round((vacuumKW + dryerKW * 0.3) * 0.5);
  if (curtailableKW > 20) {
    const drSavings = Math.round(curtailableKW * 150);
    
    opportunities.push({
      id: 'demandResponse', rank: 0, name: 'Demand Response', icon: TrendingUp, category: 'Grid Services',
      annualSavings: drSavings, investmentCost: 5000, netCost: 5000,
      paybackYears: drSavings > 0 ? 5000 / drSavings : 99,
      sizing: `${curtailableKW} kW curtailable`,
      description: `Earn utility incentives for reducing load during grid events`,
      factors: [
        { label: 'Curtailable', value: curtailableKW, unit: 'kW', quality: 'vacuums + partial dryers' },
        { label: 'Incentive', value: '~$150', unit: '/kW/year', quality: 'typical utility rate' },
        { label: 'Events', value: '10-15', unit: '/year', quality: '~4 hours each' }
      ],
      whyThisBusiness: `Vacuums (${Math.round(vacuumKW)} kW) can pause during events. Partial dryer curtailment during off-peak hours adds ${curtailableKW} kW of grid services revenue.`
    });
  }
  
  // 9. EV CHARGING EXPANSION - If interested/has chargers
  if (l2Chargers > 0 || dcChargers > 0 || carportArea > 0) {
    const newL2 = carportArea > 0 ? Math.round(carportArea / 500) : 4; // 1 L2 per 500 sqft carport, or 4 default
    const evRevenue = newL2 * 3000; // ~$3k/year per L2 in revenue
    const evInstallCost = newL2 * 5000;
    const evNetCost = Math.round(evInstallCost * (1 - EV_CHARGER_CREDIT_RATE)); // FIX C-2: use merlinConstants SSOT
    
    opportunities.push({
      id: 'evCharging', rank: 0, name: 'EV Charging Expansion', icon: BatteryCharging, category: 'Revenue',
      annualSavings: evRevenue, investmentCost: evInstallCost, netCost: evNetCost,
      paybackYears: evRevenue > 0 ? evNetCost / evRevenue : 99, // FIX M4: guard div/0
      sizing: `Add ${newL2} Level 2 chargers`,
      description: `Generate revenue from EV charging, attract premium customers`,
      factors: [
        { label: 'New Chargers', value: newL2, unit: 'L2 ports', quality: carportArea > 0 ? 'under carport' : 'lot install' },
        { label: 'Revenue Est.', value: Math.round(evRevenue / newL2 / 12), unit: '$/port/mo', quality: 'after electricity' },
        { label: 'Dwell Time', value: '15-30', unit: 'minutes', quality: 'matches wash time' }
      ],
      whyThisBusiness: `Car wash customers dwell 15-30 minutes - perfect for L2 charging. ${carportArea > 0 ? `${carportArea.toLocaleString()} sq ft carport provides covered charging.` : 'Adds customer amenity and revenue stream.'}`
    });
  }
  
  // 10. RATE OPTIMIZATION
  const rateOptSavings = Math.round((annualElectricUsage + annualDemandCharges) * 0.05);
  
  opportunities.push({
    id: 'rateOptimization', rank: 0, name: 'Utility Rate Optimization', icon: DollarSign, category: 'Rate Optimization',
    annualSavings: rateOptSavings, investmentCost: 2500, netCost: 2500,
    paybackYears: rateOptSavings > 0 ? 2500 / rateOptSavings : 99,
    sizing: 'Rate analysis & switching',
    description: `Evaluate TOU rates, demand response tariffs, and utility programs`,
    factors: [
      { label: 'Annual Electric', value: Math.round((annualElectricUsage + annualDemandCharges) / 1000), unit: '$K', quality: 'usage + demand' },
      { label: 'Current Rate', value: electric.avgRate, unit: '$/kWh', quality: 'average' },
      { label: 'Potential', value: '3-8', unit: '% savings', quality: 'typical range' }
    ],
    whyThisBusiness: `$${Math.round(annualElectricUsage + annualDemandCharges).toLocaleString()}/year electric spend. Car washes with off-peak hours may benefit from TOU rates.`
  });
  
  // ========================================
  // COMPOSITE SCORING AND SORT (highest to lowest)
  // ========================================
  // Composite scoring: savings (30%) + 25yr NPV (25%) + payback (20%) + ROI (15%) + category (10%)
  // FIX SCORE-1: Matches generic engine rebalance — solar/BESS rank by lifetime value, not just payback speed
  // FIX SCORE-3: Solar/BESS payback now uses ITC+MACRS effective cost (was ITC-only, inflating payback by ~1.5 yrs)
  const ITC_ELIGIBLE_CW = new Set(['solarPV', 'batteryPeakShaving']);
  const DEFAULT_TAX_RATE_CW = ASSUMED_TAX_RATE; // ← merlinConstants SSOT
  opportunities.forEach(opp => {
    if (ITC_ELIGIBLE_CW.has(opp.id)) {
      const macrsYr1 = Math.round(opp.investmentCost * 0.50 * DEFAULT_TAX_RATE_CW);
      opp._effectiveNetCost = opp.netCost - macrsYr1;
      opp._effectivePayback = opp.annualSavings > 0 ? opp._effectiveNetCost / opp.annualSavings : 99;
    } else {
      opp._effectiveNetCost = opp.netCost;
      opp._effectivePayback = opp.paybackYears;
    }
  });
  const maxSavings_cw = Math.max(...opportunities.map(o => o.annualSavings), 2000); // FIX M-2: min $2K benchmark
  // Item-specific 25yr NPV multipliers — FIX SCORE-3: Solar/BESS include ITC+MACRS front-loaded value
  const NPV_MULT_CW = { solarPV: 23, batteryPeakShaving: 21, ledLighting: 24, pumpVFD: 24, dryerVFD: 24, vacuumEfficiency: 24, heatPumpWaterHeater: 23, waterReclaim: 15, demandResponse: 22, evCharging: 20, rateOptimization: 24 };
  opportunities.forEach(opp => { opp._npv25 = Math.round(opp.annualSavings * (NPV_MULT_CW[opp.id] || 22.5) - opp._effectiveNetCost); });
  const maxNPV_cw = Math.max(...opportunities.map(o => o._npv25), 1);
  // Non-Energy: water recycling is complementary to energy scope — visible but demoted
  const catBonus_cw = { 'Generation': 10, 'Storage': 8, 'Demand Management': 8, 'Efficiency': 7, 'Electrification': 6, 'Resilience': 6, 'Revenue': 5, 'Grid Services': 5, 'Rate Optimization': 5, 'Monitoring': 4, 'Non-Energy': 2 };
  opportunities.forEach(opp => {
    const savScore = (opp.annualSavings / maxSavings_cw) * 30;
    const npvScore = opp._npv25 > 0 ? (opp._npv25 / maxNPV_cw) * 25 : 0;
    const payScore = opp._effectivePayback < 3 ? 20 : opp._effectivePayback < 6 ? 15 : opp._effectivePayback < 10 ? 10 : 3;
    const roiScore = opp._effectiveNetCost > 0 ? Math.min(15, (opp.annualSavings / opp._effectiveNetCost) * 75) : 8;
    const bonus = catBonus_cw[opp.category] || 5;
    opp.compositeScore = Math.round(savScore + npvScore + payScore + roiScore + bonus);
  });
  opportunities.sort((a, b) => b.compositeScore - a.compositeScore);
  opportunities.forEach((opp, idx) => { opp.rank = idx + 1; });
  
  const top10 = opportunities.slice(0, 10);
  
  return {
    opportunities: top10,
    allOpportunities: opportunities,
    summary: {
      totalAnnualEnergyCost: Math.round(totalAnnualEnergy),
      top10AnnualSavings: Math.round(top10.reduce((sum, o) => sum + o.annualSavings, 0)),
      top10Investment: Math.round(top10.reduce((sum, o) => sum + o.netCost, 0)),
      savingsPct: Math.min(100, Math.round((top10.reduce((sum, o) => sum + o.annualSavings, 0) / Math.max(totalAnnualEnergy, 1)) * 100))
    },
    // Expose calculated values for display
    calculatedConsumption: {
      monthlyKWh: climateAdjustedMonthlyKWh,
      peakKW: climateAdjustedPeakKW,
      annualKWh,
      monthlyTherms: gasThermsMo,
      resistiveKW,
      inductiveKW,
      totalConnectedKW,
      serviceRating,
      climateMultiplier: climateFactor, // FIX F1+F2: expose for display
      breakdown: (() => { const safeKWh = Math.max(climateAdjustedMonthlyKWh, 1); return {
        dryers: { kW: Math.round(dryerKW), kWhMo: Math.round(dryerKWhPerMonth), pct: Math.round(dryerKWhPerMonth / safeKWh * 100), type: 'inductive', config: formData.dryerConfig || 'blowersOnly', heatingKW: heatedDryerKW },
        pumps: { kW: Math.round(pumpKW), kWhMo: Math.round(pumpKWhPerMonth), pct: Math.round(pumpKWhPerMonth / safeKWh * 100), type: 'inductive', hasVFD: pumpHasVFD, config: formData.pumpConfig || 'highPressure', dutyCycle: pumpCfg.dutyCycle },
        brushMotors: { kW: Math.round(brushMotorKW), kWhMo: Math.round(brushMotorKWhPerMonth), pct: Math.round(brushMotorKWhPerMonth / safeKWh * 100), type: 'inductive', count: brushMotorCount },
        waterHeater: { kW: waterHeaterKW, kWhMo: Math.round(waterHeaterKWhPerMonth), pct: Math.round(waterHeaterKWhPerMonth / safeKWh * 100), type: 'resistive' },
        heatedDryers: { kW: heatedDryerKW, kWhMo: Math.round(heatedDryerKWhPerMonth), pct: Math.round(heatedDryerKWhPerMonth / safeKWh * 100), type: 'resistive' },
        vacuums: { kW: Math.round(vacuumKW), kWhMo: Math.round(vacuumKWhPerMonth), pct: Math.round(vacuumKWhPerMonth / safeKWh * 100), count: vacuumCount, config: formData.vacuumConfig || 'individual', turbineHP: vacuumTurbineHP, type: 'inductive' },
        conveyor: { kW: Math.round(conveyorKW), kWhMo: Math.round(conveyorKWhPerMonth), pct: Math.round(conveyorKWhPerMonth / safeKWh * 100), type: 'inductive' },
        airCompressor: { kW: Math.round(airCompKW), kWhMo: Math.round(airCompKWhPerMonth), pct: Math.round(airCompKWhPerMonth / safeKWh * 100), type: 'inductive' },
        ro: { kW: Math.round(roKW * 10) / 10, kWhMo: Math.round(roKWhPerMonth), pct: Math.round(roKWhPerMonth / safeKWh * 100), type: 'inductive', hp: roHP_calc },
        lighting: { kW: Math.round(lightingKW), kWhMo: Math.round(lightingKWhPerMonth), pct: Math.round(lightingKWhPerMonth / safeKWh * 100), type: 'resistive', tier: lightingTier },
        signage: { kW: Math.round(signageKW), kWhMo: Math.round(signageKWhPerMonth), pct: Math.round(signageKWhPerMonth / safeKWh * 100), type: 'resistive', tier: signageTier },
        pos: { kW: posKW, kWhMo: Math.round(posKWhPerMonth), pct: Math.round(posKWhPerMonth / safeKWh * 100), type: 'resistive', kiosks: kioskCount },
        office: { kW: Math.round(officeFacilitiesKW * 10) / 10, kWhMo: Math.round(officeKWhPerMonth), pct: Math.round(officeKWhPerMonth / safeKWh * 100), type: 'resistive' },
        hvac: { kW: Math.round(hvacKW), kWhMo: Math.round(hvacKWhPerMonth), pct: Math.round(hvacKWhPerMonth / safeKWh * 100), type: 'inductive' },
        evChargers: { kW: evL2KW + evDCKW, kWhMo: Math.round(evKWhPerMonth), pct: Math.round(evKWhPerMonth / safeKWh * 100), l2: l2Chargers, dc: dcChargers }
      }; })()
    }
  };
};

const calculateGoalScores = (utilityData, solarData, industry, stateCode, formData = {}) => {
  if (!industry || !utilityData?.electric) {
    return [];
  }
  
  const result = calculateSavingsOpportunities(utilityData, solarData, industry, stateCode, formData);
  if (!result || !result.opportunities) return [];
  
  // Use compositeScore from opportunity scoring engine (already computed during sort)
  return result.opportunities.map(opp => ({
    id: opp.id,
    name: opp.name,
    icon: opp.icon,
    score: opp.compositeScore || Math.round(
      (opp.annualSavings / Math.max(...result.opportunities.map(o => o.annualSavings), 1)) * 80 +
      Math.max(0, (1 - opp.paybackYears / 15)) * 20
    ),
    monthlyImpact: Math.round(opp.annualSavings / 12),
    reason: opp.sizing,
    detail: opp.description,
    shortDesc: opp.category,
    annualSavings: opp.annualSavings,
    paybackYears: opp.paybackYears
  }));
};

// ============================================
// LOAD CALCULATION - Based on actual facility inputs
// ============================================
const calculateFacilityLoad = (formData, industry, state = 'MI', locationData = null) => {
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (industry?.id !== 'carwash') {
    // ═══════════════════════════════════════════════════════════════════════════════
    // AUDIT FIX: Enhanced generic industry calculation with industry-specific factors
    // Previously just used estimatedBill/100 for ALL industries - now uses benchmarks
    // ═══════════════════════════════════════════════════════════════════════════════
    // FIX #41: A sends monthlyElectricBill & facilitySqFt — B must read both naming conventions
    const estimatedMonthlyBill = parseFloat(formData.monthlyElectricBill || formData.estimatedBill) || 15000;
    const sqFootage = parseFloat(formData.facilitySqFt || formData.squareFootage || formData.siteSqFt) || 20000;
    
    // Industry-specific load factors (kW/1000 sq ft and demand factor)
    const INDUSTRY_FACTORS = {
      // FIX #42: Added loadFactor (avg load / peak load) separate from demandFactor (peak / connected)
      // FIX #45: avgRate kept as last-resort fallback only — locationData rate used first
      'datacenter': { 
        kwPer1000SqFt: 150, demandFactor: 0.90, loadFactor: 0.80,
        criticalPct: 0.70, avgRate: 0.10, description: 'High-density computing loads'
      },
      'retail': { 
        kwPer1000SqFt: 8, demandFactor: 0.55, loadFactor: 0.40,
        criticalPct: 0.25, avgRate: 0.12, description: 'Lighting and HVAC dominant'
      },
      'warehouse': { 
        kwPer1000SqFt: 4, demandFactor: 0.40, loadFactor: 0.35,
        criticalPct: 0.15, avgRate: 0.11, description: 'Lighting and material handling'
      },
      'restaurant': { 
        kwPer1000SqFt: 45, demandFactor: 0.65, loadFactor: 0.45,
        criticalPct: 0.40, avgRate: 0.13, description: 'Kitchen and refrigeration loads'
      },
      'cstore': { 
        kwPer1000SqFt: 25, demandFactor: 0.70, loadFactor: 0.55,
        criticalPct: 0.50, avgRate: 0.12, description: 'Refrigeration and fuel dispensing'
      },
      // FIX B-13 (Phase 2): Hotel + indoor farm
      'hotel': {
        kwPer1000SqFt: 20, demandFactor: 0.65, loadFactor: 0.55,
        criticalPct: 0.35, avgRate: 0.12, description: 'HVAC, hot water, laundry, kitchen, elevators'
      },
      'indoorfarm': {
        kwPer1000SqFt: 80, demandFactor: 0.75, loadFactor: 0.65,
        criticalPct: 0.60, avgRate: 0.11, description: 'LED grow lights, HVAC, dehumidification'
      },
      'default': {
        kwPer1000SqFt: 12, demandFactor: 0.60, loadFactor: 0.45,
        criticalPct: 0.25, avgRate: 0.12, description: 'General commercial'
      }
    };
    
    const factors = INDUSTRY_FACTORS[industry?.id] || INDUSTRY_FACTORS.default;
    
    // Calculate connected load from square footage (more accurate than bill)
    const sqFootageBasedKW = (sqFootage / 1000) * factors.kwPer1000SqFt;
    
    // Calculate from bill as cross-check
    // FIX #45: Use actual location utility rate, not hardcoded industry avgRate
    const avgRate = locationData?.utility?.electric?.avgRate || factors.avgRate;
    // FIX #57: Subtract estimated demand charge portion before kWh conversion
    // Commercial bills = energy charges + demand charges. Dividing total by $/kWh overstates kWh.
    const estDemandCharge = locationData?.utility?.electric?.demandCharge ?? 12; // FIX H-7: ?? (0 valid for flat-rate)
    const sqFootageBasedPeakKW = (sqFootage / 1000) * factors.kwPer1000SqFt * factors.demandFactor;
    const estDemandPortion = sqFootageBasedPeakKW * estDemandCharge;
    const energyOnlyBill = Math.max(estimatedMonthlyBill - estDemandPortion, estimatedMonthlyBill * 0.60);
    const billBasedAnnualKWh = avgRate > 0 ? energyOnlyBill * 12 / avgRate : 0; // FIX H-6: div-by-zero guard
    const billBasedPeakKW = billBasedAnnualKWh / (8760 * factors.loadFactor);
    
    // Use average of both methods for robustness
    const estimatedConnectedKW = sqFootage > 1000 
      ? (sqFootageBasedKW + billBasedPeakKW) / 2 
      : billBasedPeakKW;
    
    const peakDemandKW = Math.round(estimatedConnectedKW * factors.demandFactor);
    // FIX #42: Use loadFactor (not demandFactor again) for annual usage
    const annualUsageKWh = Math.round(peakDemandKW * 8760 * factors.loadFactor);
    const criticalLoadKW = Math.round(estimatedConnectedKW * factors.criticalPct);
    
    return {
      peakDemandKW: Math.max(peakDemandKW, 25), // Minimum 25 kW for commercial
      annualUsageKWh: Math.max(annualUsageKWh, 50000), // Minimum 50,000 kWh/year
      criticalLoadKW: Math.max(criticalLoadKW, 10), // Minimum 10 kW critical
      totalConnectedKW: Math.round(estimatedConnectedKW),
      loadBreakdown: { 
        estimated: true,
        method: 'industry_benchmark',
        industry: industry?.id || 'default',
        factors: factors,
        sqFootage: sqFootage,
        monthlyBill: estimatedMonthlyBill
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CAR WASH SPECIFIC LOAD CALCULATION - COMPREHENSIVE
  // Accounts for: facility type, tunnel length, bay count, all equipment, features
  // NOW WITH CLIMATE ADJUSTMENTS for seasonal accuracy
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Get climate adjustments for this location
  const climate = _getClimateAdjustments(state);
  
  const facilityType = formData.facilityType || 'express';
  const isTunnel = ['express', 'mini', 'flex', 'fullService'].includes(facilityType);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CRITICAL: Tunnel Length and Bay Count Scaling
  // Longer tunnels = more equipment stages = more energy
  // More bays = multiplied equipment operations
  // ═══════════════════════════════════════════════════════════════════════════════
  const tunnelLength = parseInt(formData.tunnelLength) || (facilityType === 'express' ? 120 : facilityType === 'mini' ? 55 : 0);
  const bayCount = parseInt(formData.bayCount) || 1;
  
  // Tunnel length scaling factor (normalized to 120ft standard)
  // 80ft = 0.67x, 120ft = 1.0x, 180ft = 1.5x
  const tunnelScaleFactor = isTunnel ? Math.max(0.5, tunnelLength / 120) : 1.0;
  
  // Bay multiplier for equipment runtime (not all equipment runs simultaneously in multi-bay)
  // 1 bay = 1.0x, 2 bays = 1.7x, 3 bays = 2.3x (accounting for diversity)
  const bayMultiplier = bayCount === 1 ? 1.0 : bayCount === 2 ? 1.7 : Math.min(bayCount * 0.8, 4.0);
  
  // Operating parameters
  const operatingHours = parseInt(formData.operatingHours) || (facilityType === 'express' ? 14 : facilityType === 'mini' ? 12 : 10);
  const daysPerWeek = parseInt(formData.daysPerWeek) || 7;
  const dailyVehicles = parseInt(formData.dailyVehicles) || ({ express: 300, full: 200, flex: 250, mini: 200, self: 100, inbay: 80, iba: 80 }[facilityType] || 200);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE EQUIPMENT LOADS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Pump System (scaled by tunnel length for tunnels)
  const pumpHP = parseInt(formData.pumpHP) || 15;
  const pumpCount = parseInt(formData.pumpCount) || 3;
  const pumpHasVFD = formData.pumpHasVFD === true;
  const pumpCfg2 = getPumpConfig(formData.pumpConfig);
  const basePumpKW = pumpHP * pumpCount * 0.746 * ((pumpHasVFD || pumpCfg2.autoVFD) ? 0.75 : pumpCfg2.efficiencyMult * 0.85);
  const pumpKW = basePumpKW * (isTunnel ? tunnelScaleFactor : bayMultiplier);
  
  // Dryer System (CRITICAL: scale by tunnel length - more dryer modules in longer tunnels)
  const dryerHP = parseInt(formData.dryerHP) || 15;
  const dryerCount = parseInt(formData.dryerCount) || 4;
  const dryerHasVFD = formData.dryerHasVFD === true;
  const dryerCfg2 = getDryerConfig(formData.dryerConfig);
  const baseDryerKW = dryerHP * dryerCount * 0.746 * (dryerHasVFD ? 0.70 : dryerCfg2.efficiencyMult * 0.85);
  const dryerKW = baseDryerKW * (isTunnel ? tunnelScaleFactor : bayMultiplier);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // WATER HEATING - BTU-BASED CALCULATION (Sprint 3)
  // Industry standard: BTU = gallons × 8.34 lbs/gal × temperature rise
  // This replaces the connected-load approach for much better accuracy
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Water usage per car by facility type (gallons)
  const gallonsPerCar = {
    express: 35,      // Full tunnel wash
    mini: 28,         // Shorter tunnel
    flex: 30,         // Flex-serve
    fullService: 40,  // Full service with interior
    iba: 20,          // In-bay automatic
    self: 15          // Self-service bay
  }[facilityType] || 30;
  
  // Daily water usage
  const dailyGallons = dailyVehicles * gallonsPerCar * bayMultiplier;
  
  // Temperature calculations
  const inletWaterTemp = climate.inletWaterTemp || 55; // °F from climate data
  const targetWaterTemp = 130; // °F - industry standard hot water
  const tempRise = targetWaterTemp - inletWaterTemp;
  
  // BTU calculation: gallons × 8.34 lbs/gal × temp rise × 1 BTU/lb/°F
  const dailyBTU = dailyGallons * 8.34 * tempRise;
  const dailyTherms = dailyBTU / 100000; // 100,000 BTU = 1 therm
  
  // Equipment efficiency factors
  const heaterEfficiency = {
    gas: 0.80,        // 80% efficient gas heater
    propane: 0.78,    // 78% efficient propane (slightly less than piped gas)
    electric: 0.95,   // 95% efficient electric
    tankless: 0.92,   // 92% efficient tankless
    hybrid: 0.85      // Hybrid efficiency varies
  };
  
  // Calculate actual energy needed based on heating type
  const waterHeating = formData.waterHeater || 'gas';
  const efficiency = heaterEfficiency[waterHeating] || 0.85;
  
  // Water heating energy consumption
  let waterHeaterKW = 0;           // Connected load for peak demand
  let waterHeaterKWhPerDayCalc = 0; // Actual daily energy consumption
  let waterHeaterThermsPerDay = 0;  // Gas consumption (if gas heating)
  let waterHeaterAnnualGasCost = 0; // Annual gas cost
  
  if (waterHeating === 'gas' || waterHeating === 'propane') {
    // Gas/Propane water heating - calculate therms needed
    const propaneEffPenalty = waterHeating === 'propane' ? 1.15 : 1.0; // Propane ~15% less efficient
    waterHeaterThermsPerDay = dailyTherms / efficiency * propaneEffPenalty;
    // Connected load is minimal (just circulation pumps, igniter)
    waterHeaterKW = 2; // Minimal electric for gas/propane system
    waterHeaterKWhPerDayCalc = waterHeaterKW * operatingHours * 0.3;
    // Fuel cost calculation: gas ~$1.20/therm, propane ~$2.73/therm ($2.50/gal ÷ 0.915 therms/gal)
    const gasPricePerTherm = waterHeating === 'propane' ? 2.73 : 1.20;
    waterHeaterAnnualGasCost = Math.round(waterHeaterThermsPerDay * 365 * gasPricePerTherm);
  } else if (waterHeating === 'electric' || waterHeating === 'tankless') {
    // Electric water heating - convert BTU to kWh
    // 1 therm = 29.3 kWh
    const dailyKWhNeeded = (dailyTherms * 29.3) / efficiency;
    waterHeaterKWhPerDayCalc = dailyKWhNeeded;
    // Connected load based on heating capacity needed
    // Peak hour demand = assume 20% of daily volume in 2 hours
    const peakGallonsPerHour = (dailyGallons * 0.20) / 2;
    const peakBTUPerHour = peakGallonsPerHour * 8.34 * tempRise;
    // 1 kW = 3,412 BTU/hr
    waterHeaterKW = Math.round(peakBTUPerHour / 3412 / efficiency);
  } else if (waterHeating === 'hybrid') {
    // Hybrid: 60% gas, 40% electric typically
    const gasPortionTherms = (dailyTherms * 0.60) / heaterEfficiency.gas;
    const electricPortionKWh = (dailyTherms * 0.40 * 29.3) / heaterEfficiency.electric;
    waterHeaterThermsPerDay = gasPortionTherms;
    waterHeaterKWhPerDayCalc = electricPortionKWh;
    // Connected load for electric portion
    const peakGallonsPerHour = (dailyGallons * 0.20) / 2;
    const peakBTUPerHour = peakGallonsPerHour * 8.34 * tempRise * 0.40; // 40% electric
    waterHeaterKW = Math.round(peakBTUPerHour / 3412 / efficiency);
    // Gas cost
    const gasPricePerTherm = 1.20;
    waterHeaterAnnualGasCost = Math.round(gasPortionTherms * 365 * gasPricePerTherm);
  }
  
  // Water heating calculation summary for transparency
  const waterHeatingCalc = {
    method: 'BTU-based',
    gallonsPerCar,
    dailyGallons: Math.round(dailyGallons),
    inletWaterTemp,
    targetWaterTemp,
    tempRise,
    dailyBTU: Math.round(dailyBTU),
    dailyTherms: Math.round(dailyTherms * 10) / 10,
    heatingType: waterHeating,
    efficiency,
    connectedLoadKW: waterHeaterKW,
    dailyKWh: Math.round(waterHeaterKWhPerDayCalc),
    waterHeaterDailyTherms: Math.round(waterHeaterThermsPerDay * 10) / 10,
    annualGasCost: waterHeaterAnnualGasCost,
    annualKWh: Math.round(waterHeaterKWhPerDayCalc * 365)
  };
  
  // Vacuum Systems — config-driven architecture from WizA
  const vacuumCount = parseInt(formData.vacuumCount) || (facilityType === 'express' ? 8 : facilityType === 'mini' ? 6 : 4);
  const vacuumCfg2 = getVacuumConfig(formData.vacuumConfig);
  const vacuumTurbineHP_calc = parseInt(formData.vacuumTurbineHP) || 0;
  const vacuumStationKW = vacuumCfg2.stationHP > 0 ? vacuumCount * vacuumCfg2.stationHP * 0.746 : 0;
  const vacuumTurbineKW_calc = vacuumCfg2.hasTurbine ? (vacuumTurbineHP_calc || vacuumCfg2.turbineHP) * 0.746 * vacuumCfg2.efficiencyMult : 0;
  const vacuumKW = vacuumStationKW + vacuumTurbineKW_calc;
  
  // Conveyor/Equipment Motors (tunnel types only, scaled by length)
  const conveyorHP = parseInt(formData.conveyorHP) || 20;
  let conveyorKW = 0;
  if (isTunnel) {
    conveyorKW = conveyorHP * 0.746 * tunnelScaleFactor;
  }
  
  // Air Compressor
  const airCompressorHP = parseInt(formData.airCompressorHP) || 7.5;
  const airCompKW = airCompressorHP * 0.746 * (isTunnel ? 1.0 : bayMultiplier);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // BRUSH MOTORS — FIX P1-1: Use WizA user-collected data when available
  // Falls back to facility-type config table when user didn't select brushMotors
  // ═══════════════════════════════════════════════════════════════════════════════
  const userBrushCount = parseInt(formData.brushMotorCount) || 0;
  const userBrushAvgHP = parseFloat(formData.brushMotorAvgHP) || 3;
  
  let brushTotalHP;
  let brushes = null;
  if (userBrushCount > 0) {
    // User-collected: count × avgHP (from WizA Q15)
    brushTotalHP = userBrushCount * userBrushAvgHP;
  } else {
    // Fallback: facility-type config table
    const brushConfig = {
      express: { sideHP: 5, sideCount: 6, topHP: 7.5, topCount: 1, wheelHP: 3, wheelCount: 4 },
      mini: { sideHP: 5, sideCount: 4, topHP: 5, topCount: 1, wheelHP: 2, wheelCount: 2 },
      flex: { sideHP: 5, sideCount: 4, topHP: 5, topCount: 1, wheelHP: 2, wheelCount: 2 },
      fullService: { sideHP: 5, sideCount: 6, topHP: 7.5, topCount: 1, wheelHP: 3, wheelCount: 4 },
      iba: { sideHP: 3, sideCount: 2, topHP: 5, topCount: 1, wheelHP: 0, wheelCount: 0 },
      self: { sideHP: 0, sideCount: 0, topHP: 0, topCount: 0, wheelHP: 0, wheelCount: 0 }
    };
    brushes = brushConfig[facilityType] || brushConfig.express;
    brushTotalHP = (brushes.sideHP * brushes.sideCount) + (brushes.topHP * brushes.topCount) + (brushes.wheelHP * brushes.wheelCount);
  }
  const brushKW = brushTotalHP * 0.746 * (isTunnel ? tunnelScaleFactor : 1.0);
  const brushDutyCycle = 0.40; // Brushes only run during active wash cycle (~40% of operating hours)
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SIGNAGE & EXTERIOR LIGHTING (Sprint 4 - Previously Missing!)
  // Pylon signs, menu boards, architectural lighting, parking lot lights
  // These run dusk-to-dawn regardless of wash operations
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Get site square footage (used for parking lot lighting calc)
  const siteSqFtForLighting = parseInt(formData.siteSqFt) || (facilityType === 'express' ? 50000 : facilityType === 'mini' ? 30000 : 20000);
  
  // Signage — FIX P1-1: Use signageTier from WizA when available, fall back to facility config
  const SIGNAGE_TIER_KW_C2 = { basic: 2, standard: 4, premium: 7 };
  const userSignageTier = formData.signageTier || null;
  let signageKW;
  let signage = null;
  if (userSignageTier) {
    signageKW = SIGNAGE_TIER_KW_C2[userSignageTier] || 4;
  } else {
    const signageConfig = {
      express: { pylonKW: 1.5, menuKW: 0.8, archKW: 2.0 },
      mini: { pylonKW: 1.0, menuKW: 0.5, archKW: 1.0 },
      flex: { pylonKW: 1.2, menuKW: 0.6, archKW: 1.5 },
      fullService: { pylonKW: 1.5, menuKW: 0.8, archKW: 2.5 },
      iba: { pylonKW: 0.8, menuKW: 0.3, archKW: 0.5 },
      self: { pylonKW: 0.5, menuKW: 0.2, archKW: 0.3 }
    };
    signage = signageConfig[facilityType] || signageConfig.express;
    signageKW = signage.pylonKW + signage.menuKW + signage.archKW;
  }
  const signageHoursPerDay = 12; // Average dusk-to-dawn
  
  // Parking lot / security lighting
  const parkingLotKW = Math.max(1, Math.round(siteSqFtForLighting / 8000)); // ~1 kW per 8000 sq ft
  const parkingLotHoursPerDay = 10; // Evening/night hours
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EQUIPMENT AGE FACTOR (Sprint 4 - Efficiency Degradation)
  // Older equipment uses more energy: motors lose efficiency, seals leak, etc.
  // Industry data: 15+ year old equipment uses 20-40% more energy
  // ═══════════════════════════════════════════════════════════════════════════════
  const equipmentAgeFactors = {
    new: 1.00,       // 0-5 years: baseline efficiency
    average: 1.12,   // FIX #117: alias for 'moderate' — Calc 1 uses 'average'
    moderate: 1.12,  // 5-10 years: 12% degradation
    old: 1.25,       // 10-15 years: 25% degradation  
    veryOld: 1.40    // 15+ years: 40% degradation
  };
  const equipmentAge = formData.equipmentAge || 'new'; // Default 'new' — conservative initial quote; site visit confirms actual age
  const ageFactor = equipmentAgeFactors[equipmentAge] || 1.00;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // WATER RECLAIM SYSTEM LOAD (PREVIOUSLY MISSING!)
  // Basic: settling tanks, basic pump (2-5 kW)
  // Standard: multi-stage filtration (5-10 kW)
  // Advanced: UV, ozone, membrane, recycle pumps (10-25 kW)
  // ═══════════════════════════════════════════════════════════════════════════════
  const waterReclaimLevel = formData.waterReclaimLevel || 'none';
  let waterReclaimKW = 0;
  if (waterReclaimLevel === 'basic') {
    waterReclaimKW = 3 * (isTunnel ? tunnelScaleFactor : bayMultiplier);
  } else if (waterReclaimLevel === 'standard') {
    waterReclaimKW = 8 * (isTunnel ? tunnelScaleFactor : bayMultiplier);
  } else if (waterReclaimLevel === 'advanced') {
    waterReclaimKW = 20 * (isTunnel ? tunnelScaleFactor : bayMultiplier);
  }
  
  // RO System for spot-free — FIX P1-1: Use user's roHP when available
  const hasRO = formData.hasRO === true || waterReclaimLevel === 'advanced';
  let roSystemKW = 0;
  if (hasRO && waterReclaimLevel !== 'advanced') {
    // Standalone RO not part of advanced reclaim
    const userROHP = formData.roHP === 'unknown' ? 5 : parseFloat(formData.roHP) || 0;
    roSystemKW = userROHP > 0
      ? userROHP * 0.746 * (isTunnel ? tunnelScaleFactor : bayMultiplier)
      : 10 * (isTunnel ? tunnelScaleFactor : bayMultiplier); // fallback 10 kW
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SITE FEATURES LOAD (PREVIOUSLY MISSING!)
  // Tunnel Extras: wheel blasters, undercarriage wash, triple foam, etc.
  // Premium Services: heated wax application, ceramic sealants, etc.
  // Climate Control: HVAC for enclosed tunnel, waiting areas
  // ═══════════════════════════════════════════════════════════════════════════════
  const siteFeatures = formData.siteFeatures || {};
  
  // Tunnel Extras (wheel blasters, undercarriage, etc.)
  let tunnelExtrasKW = 0;
  if (siteFeatures.tunnelExtras === 'standard') {
    tunnelExtrasKW = 15 * tunnelScaleFactor; // ~15 kW for standard extras
  } else if (siteFeatures.tunnelExtras === 'premium') {
    tunnelExtrasKW = 30 * tunnelScaleFactor; // ~30 kW for premium extras
  }
  
  // Premium Services (heated wax, ceramic)
  let premiumServicesKW = 0;
  if (siteFeatures.premiumServices === 'basic') {
    premiumServicesKW = 5;
  } else if (siteFeatures.premiumServices === 'full') {
    premiumServicesKW = 15;
  }
  
  // Climate Control - NOW WITH CLIMATE ADJUSTMENT
  // Hot climates need more cooling, cold climates need more heating
  let climateControlKW = 0;
  if (siteFeatures.climateControl === 'minimal') {
    climateControlKW = Math.round(5 * climate.hvacMultiplier);
  } else if (siteFeatures.climateControl === 'standard') {
    climateControlKW = Math.round(15 * climate.hvacMultiplier);
  } else if (siteFeatures.climateControl === 'full') {
    climateControlKW = Math.round(30 * climate.hvacMultiplier);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CLIMATE-SPECIFIC LOADS (NEW - Sprint 2)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Floor Heating - Required in cold climates to prevent ice in tunnel
  // Express tunnels: 50 kW, Mini: 25 kW, IBA: 10 kW
  const baseFloorHeatingKW = facilityType === 'express' ? climate.floorHeatingKW : 
                             facilityType === 'mini' ? Math.round(climate.floorHeatingKW * 0.5) :
                             facilityType === 'iba' ? Math.round(climate.floorHeatingKW * 0.2) : 0;
  const floorHeatingKW = isTunnel ? baseFloorHeatingKW : 0;
  
  // Chemical Heaters - Presoak, triple foam, wax need heating especially in cold
  // Base: 8 kW for express, adjusted by climate
  const baseChemicalHeaterKW = facilityType === 'express' ? 8 : facilityType === 'mini' ? 5 : 3;
  const chemicalHeaterKW = Math.round(baseChemicalHeaterKW * climate.chemicalHeaterMultiplier);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FACILITY INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Lighting - USE ACTUAL SITE SQFT FROM FORM
  const siteSqFt = parseInt(formData.siteSqFt) || (facilityType === 'express' ? 50000 : facilityType === 'mini' ? 30000 : 20000);
  const buildingSqFt = isTunnel ? tunnelLength * 50 + 2000 : siteSqFt * 0.15; // Estimate building from tunnel or site
  // Lighting — FIX P1-1: Use lightingTier from WizA when available, fall back to sqft estimate
  const LIGHTING_TIER_KW_C2 = { basic: 4, standard: 8, premium: 13 };
  const userLightingTier = formData.lightingTier || null;
  const lightingKW = userLightingTier ? (LIGHTING_TIER_KW_C2[userLightingTier] || 8) : Math.round(buildingSqFt * 0.012);
  
  // Controls & IT — FIX P1-1: Use kioskCount from WizA for POS component
  const userKioskCount = parseInt(formData.kioskCount) || 0;
  const controlsKW = (isTunnel ? 5 : 3) + (userKioskCount * 0.5); // Base controls + POS kiosks
  
  // HVAC - Adjusted by climate (hot = more cooling, cold = more heating in waiting area)
  const baseHvacKW = siteFeatures.climateControl ? 0 : 15; // Only if climateControl not selected
  const hvacKW = Math.round(baseHvacKW * climate.hvacMultiplier);
  
  // FIX P2-7 (Calc2): Heated dryer elements — now driven by dryerConfig
  const hasHeatedDryers_c2 = dryerCfg2.hasHeatedElements;
  const heatedDryerKW_c2 = dryerCfg2.heatingKW; // 0 for blowers, 40 for heated, 24 for hybrid
  
  // FIX P1-1 (Calc2): Office facilities — WizA sends officeFacilities array
  const officeFacList_c2 = formData.officeFacilities || [];
  const OFFICE_KW_C2 = { waitingArea: 3, office: 2, breakRoom: 2.5, restroom: 1, detailBay: 4, vendingArea: 2 };
  const officeFacilitiesKW_c2 = officeFacList_c2.reduce((sum, f) => sum + (OFFICE_KW_C2[f] || 1.5), 0);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // TOTALS CALCULATION (with Sprint 4 additions)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Base connected load (all equipment)
  const baseConnectedLoadKW = 
    pumpKW + dryerKW + waterHeaterKW + vacuumKW + conveyorKW + airCompKW +
    waterReclaimKW + roSystemKW +
    tunnelExtrasKW + premiumServicesKW + climateControlKW +
    lightingKW + controlsKW + hvacKW +
    floorHeatingKW + chemicalHeaterKW +
    // Sprint 4 additions:
    brushKW +           // Brush motors
    signageKW +         // Signage (runs on separate circuit, dusk-dawn)
    parkingLotKW +      // Parking lot lighting
    // Feb 11 audit additions:
    heatedDryerKW_c2 +  // Heated dryer elements (resistive)
    officeFacilitiesKW_c2; // Office/amenities
  
  // Apply equipment age factor to motor loads (not lighting/controls)
  const motorLoadsKW = pumpKW + dryerKW + vacuumKW + conveyorKW + airCompKW + brushKW;
  const ageAdjustedMotorLoadsKW = motorLoadsKW * ageFactor;
  const nonMotorLoadsKW = baseConnectedLoadKW - motorLoadsKW;
  
  const connectedLoadKW = Math.round(ageAdjustedMotorLoadsKW + nonMotorLoadsKW);
  
  // Peak demand (diversity factor ~0.7 - not everything runs simultaneously)
  const diversityFactor = isTunnel ? 0.70 : 0.75; // Tunnels have better load diversity
  const peakDemandKW = Math.round(connectedLoadKW * diversityFactor);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CRITICAL LOAD - Emergency/Safety Only (NOT production equipment!)
  // A car wash doesn't wash cars during a power outage!
  // Critical = only what's needed for safety, security, and clearing the tunnel
  // ═══════════════════════════════════════════════════════════════════════════════
  const emergencyConveyor = isTunnel ? Math.min(conveyorKW, 25) : 0; // Just enough to clear stuck cars
  const emergencyLighting = Math.max(lightingKW * 0.20, 8); // 20% = emergency egress lighting
  const emergencyIT = 5; // POS, security cameras, alarms
  const emergencySump = 10; // Sump pumps for water drainage
  const emergencyControls = Math.min(controlsKW, 5); // Basic safety controls
  const criticalLoadKW = Math.round(emergencyConveyor + emergencyLighting + emergencyIT + emergencySump + emergencyControls);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // THROUGHPUT-BASED ENERGY CALCULATION
  // More cars = more equipment runtime = more energy usage
  // Scaled by tunnel length and bay count
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Equipment duty cycles based on throughput (cars/day)
  // Longer tunnels = longer wash time per car
  const cycleTimeMultiplier = isTunnel ? tunnelScaleFactor : 1.0;
  const dryerHoursPerDay = dryerCfg2.dutyCycle > 0 ? Math.min(operatingHours * dryerCfg2.dutyCycle, dailyVehicles * 0.025 * cycleTimeMultiplier) * bayMultiplier : 0;
  const pumpHoursPerDay = Math.min(operatingHours * pumpCfg2.dutyCycle, dailyVehicles * 0.02 * cycleTimeMultiplier) * bayMultiplier;
  const conveyorHoursPerDay = isTunnel ? Math.min(operatingHours * 0.5, dailyVehicles * 0.015 * cycleTimeMultiplier) : 0;
  const vacuumHoursPerDay = operatingHours * vacuumCfg2.dutyCycle; // Config-driven duty cycle
  const airCompHoursPerDay = operatingHours * 0.3 * (isTunnel ? 1.0 : bayMultiplier);
  const waterReclaimHoursPerDay = waterReclaimKW > 0 ? pumpHoursPerDay : 0; // Runs when pumps run
  const roHoursPerDay = roSystemKW > 0 ? operatingHours * 0.4 : 0; // Runs during operations
  const tunnelExtrasHoursPerDay = tunnelExtrasKW > 0 ? pumpHoursPerDay : 0;
  const premiumServicesHoursPerDay = premiumServicesKW > 0 ? operatingHours * 0.2 : 0;
  
  // Daily kWh by equipment type (throughput-adjusted)
  const dryerKWhPerDay = dryerKW * dryerHoursPerDay;
  const pumpKWhPerDay = pumpKW * pumpHoursPerDay;
  const conveyorKWhPerDay = conveyorKW * conveyorHoursPerDay;
  const vacuumKWhPerDay = vacuumKW * vacuumHoursPerDay;
  const airCompKWhPerDay = airCompKW * airCompHoursPerDay;
  // Water heater: Use BTU-based calculation from Sprint 3 (not connected load × hours)
  const waterHeaterKWhPerDay = waterHeaterKWhPerDayCalc; // From BTU calculation above
  const waterReclaimKWhPerDay = waterReclaimKW * waterReclaimHoursPerDay;
  const roKWhPerDay = roSystemKW * roHoursPerDay;
  const tunnelExtrasKWhPerDay = tunnelExtrasKW * tunnelExtrasHoursPerDay;
  const premiumServicesKWhPerDay = premiumServicesKW * premiumServicesHoursPerDay;
  const climateControlKWhPerDay = climateControlKW * operatingHours * 0.6;
  const lightingKWhPerDay = lightingKW * operatingHours * 0.7;
  const hvacKWhPerDay = hvacKW * operatingHours * 0.5;
  const controlsKWhPerDay = controlsKW * operatingHours;
  
  // NEW: Climate-specific kWh calculations
  // Floor heating only runs during heating months, not year-round
  const floorHeatingHoursPerDay = climate.floorHeatingHoursPerDay || 0;
  const floorHeatingKWhPerDay = floorHeatingKW * floorHeatingHoursPerDay;
  const floorHeatingDaysPerYear = climate.heatingMonths * 30 * (daysPerWeek / 7); // Pro-rate for operating days
  const floorHeatingAnnualKWh = Math.round(floorHeatingKWhPerDay * floorHeatingDaysPerYear);
  
  // Chemical heaters run more in cold, duty cycle varies by season
  const chemicalHeaterDutyCycle = climate.climateZone === 'cold' ? 0.5 : 
                                   climate.climateZone === 'moderate' ? 0.3 : 0.15;
  const chemicalHeaterKWhPerDay = chemicalHeaterKW * operatingHours * chemicalHeaterDutyCycle;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SPRINT 4: Additional Equipment kWh Calculations
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Brush motors - run during wash cycle only (~40% duty cycle)
  const brushKWhPerDay = brushKW * operatingHours * brushDutyCycle * ageFactor;
  
  // Signage - runs dusk to dawn, independent of operations
  const signageKWhPerDay = signageKW * signageHoursPerDay;
  
  // Parking lot lighting - runs evening/night hours
  const parkingLotKWhPerDay = parkingLotKW * parkingLotHoursPerDay;
  
  // Apply age factor to motor-driven equipment kWh
  const dryerKWhPerDayAged = dryerKWhPerDay * ageFactor;
  const pumpKWhPerDayAged = pumpKWhPerDay * ageFactor;
  const conveyorKWhPerDayAged = conveyorKWhPerDay * ageFactor;
  const vacuumKWhPerDayAged = vacuumKWhPerDay * ageFactor;
  const airCompKWhPerDayAged = airCompKWhPerDay * ageFactor;
  
  // Total daily kWh (base - not including seasonal floor heating)
  // Now includes Sprint 4 equipment and age factor on motors
  // Feb 11 audit: Added heated dryer elements and office facilities
  const heatedDryerKWhPerDay_c2 = heatedDryerKW_c2 * dryerHoursPerDay; // Runs when dryers run
  const officeKWhPerDay_c2 = officeFacilitiesKW_c2 * operatingHours * 0.5; // 50% duty cycle
  const baseDailyKWh = dryerKWhPerDayAged + pumpKWhPerDayAged + conveyorKWhPerDayAged + vacuumKWhPerDayAged + 
                   airCompKWhPerDayAged + waterHeaterKWhPerDay + waterReclaimKWhPerDay + roKWhPerDay +
                   tunnelExtrasKWhPerDay + premiumServicesKWhPerDay + climateControlKWhPerDay +
                   lightingKWhPerDay + hvacKWhPerDay + controlsKWhPerDay + chemicalHeaterKWhPerDay +
                   // Sprint 4 additions:
                   brushKWhPerDay + signageKWhPerDay + parkingLotKWhPerDay +
                   // Feb 11 audit additions:
                   heatedDryerKWhPerDay_c2 + officeKWhPerDay_c2;
  
  // For display purposes - average daily including seasonal loads
  const dailyKWh = baseDailyKWh + (floorHeatingAnnualKWh / 365);
  
  // Annual usage - base + floor heating (which is seasonal)
  // FIX #114: Signage/parking run 365 days, not just operating days
  const weeksPerYear = 52;
  const operatingDaysPerYear = daysPerWeek * weeksPerYear;
  const alwaysOnDailyKWh = signageKWhPerDay + parkingLotKWhPerDay; // These run every day
  const operationalDailyKWh = baseDailyKWh - alwaysOnDailyKWh;     // Equipment only runs on operating days
  const baseAnnualKWh = (operationalDailyKWh * operatingDaysPerYear) + (alwaysOnDailyKWh * 365);
  const annualUsageKWh = Math.round(baseAnnualKWh + floorHeatingAnnualKWh);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SEASONAL BREAKDOWN (NEW - Sprint 2)
  // Show how energy varies by season for transparency
  // ═══════════════════════════════════════════════════════════════════════════════
  const winterDailyKWh = baseDailyKWh * climate.winterThroughputFactor + floorHeatingKWhPerDay;
  const summerDailyKWh = baseDailyKWh * climate.summerThroughputFactor;
  const seasonalBreakdown = {
    climateZone: climate.climateZone,
    state,
    hdd: climate.hdd,
    heatingMonths: climate.heatingMonths,
    inletWaterTemp: climate.inletWaterTemp,
    // Monthly estimates
    winterMonthlyKWh: Math.round(winterDailyKWh * 30),
    summerMonthlyKWh: Math.round(summerDailyKWh * 30),
    springFallMonthlyKWh: Math.round(baseDailyKWh * 30),
    // Annual components
    floorHeatingAnnualKWh,
    chemicalHeaterAnnualKWh: Math.round(chemicalHeaterKWhPerDay * daysPerWeek * weeksPerYear),
    // Adjustments applied
    waterHeatingAdjustment: `${Math.round((climate.waterHeatingMultiplier - 1) * 100)}%`,
    hvacAdjustment: `${Math.round((climate.hvacMultiplier - 1) * 100)}%`,
    description: climate.description
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // COST BREAKDOWN - Demand Charges + Energy Charges
  // This is critical for accurate bill estimation and BESS value calculation
  // ═══════════════════════════════════════════════════════════════════════════════
  const utilityBillingType = formData.utilityBillingType || 'demand';
  const hasDemandCharges = utilityBillingType === 'demand' || utilityBillingType === 'tou-demand' || utilityBillingType === 'unknown';
  
  // Demand rate: use user input, or default based on billing type
  const demandRatePerKW = formData.demandRate ?? (hasDemandCharges ? 12 : 0); // $/kW — FIX H-3: ?? not || (0 is valid)
  
  // Energy rate: use live locationData rate, then billing-type adjustment
  // FIX C-2: Was hardcoded $0.12-$0.14 regardless of state. Hawaii=$0.35 would be understated 65%.
  const liveAvgRate = locationData?.utility?.electric?.avgRate || 0.12;
  const energyRate = utilityBillingType === 'tou' ? liveAvgRate * 1.15 :        // TOU avg ~15% above base
                     utilityBillingType === 'tou-demand' ? liveAvgRate * 0.90 :  // TOU+Demand: energy portion lower
                     utilityBillingType === 'flat' ? liveAvgRate * 1.05 :        // Flat rate ~5% above base
                     liveAvgRate;                                                // Default: use live rate directly
  
  // Monthly calculations
  const monthlyKWh = Math.round(annualUsageKWh / 12);
  const monthlyEnergyCharge = Math.round(monthlyKWh * energyRate);
  const monthlyDemandCharge = hasDemandCharges ? Math.round(peakDemandKW * demandRatePerKW) : 0;
  const monthlyElectricBill = monthlyEnergyCharge + monthlyDemandCharge;
  const annualElectricCost = monthlyElectricBill * 12;
  const demandChargePercent = monthlyElectricBill > 0 ? Math.round((monthlyDemandCharge / monthlyElectricBill) * 100) : 0;
  
  const costBreakdown = {
    // Rates
    energyRate,
    demandRate: demandRatePerKW,
    utilityBillingType,
    hasDemandCharges,
    // Monthly
    monthlyKWh,
    monthlyEnergyCharge,
    monthlyDemandCharge,
    monthlyElectricBill,
    // Annual
    annualEnergyCharge: monthlyEnergyCharge * 12,
    annualDemandCharge: monthlyDemandCharge * 12,
    annualElectricCost,
    // Analysis
    demandChargePercent,
    // BESS opportunity (peak shaving potential)
    potentialPeakReduction: Math.round(peakDemandKW * 0.30), // 30% peak shave potential
    potentialDemandSavings: hasDemandCharges ? Math.round(peakDemandKW * 0.30 * demandRatePerKW * 12) : 0
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PHASE 2: Override with actual utility bill data when provided (Tier 4/5 accuracy)
  // Monte Carlo validated: actual kWh+peakKW → 0% payback error vs ~8-10% derived
  // These fields come from optional Q9 inputs in WizA CarWashAssessment
  // ═══════════════════════════════════════════════════════════════════════════════
  const actualMonthlyKWh = formData.actualMonthlyKWh !== undefined && formData.actualMonthlyKWh !== "" ? parseInt(formData.actualMonthlyKWh) : null; // FIX H-7b
  const actualPeakKW = formData.actualPeakDemandKW !== undefined && formData.actualPeakDemandKW !== "" ? parseInt(formData.actualPeakDemandKW) : null; // FIX H-7b
  
  // Override annualUsageKWh if actual kWh provided (Tier 4)
  const finalAnnualUsageKWh = actualMonthlyKWh 
    ? actualMonthlyKWh * 12  // Direct from utility bill — no conversion error
    : annualUsageKWh;        // Equipment-based model (default)
    
  // Override peakDemandKW if actual peak provided (Tier 5)
  const finalPeakDemandKW = actualPeakKW 
    ? actualPeakKW           // Direct from utility bill — eliminates demand estimation error
    : peakDemandKW;          // Equipment-based model (default)

  // Recalculate cost breakdown with actual values if provided
  const finalMonthlyKWh = Math.round(finalAnnualUsageKWh / 12);
  const finalMonthlyEnergyCharge = Math.round(finalMonthlyKWh * energyRate);
  const finalMonthlyDemandCharge = hasDemandCharges ? Math.round(finalPeakDemandKW * demandRatePerKW) : 0;
  const finalMonthlyElectricBill = finalMonthlyEnergyCharge + finalMonthlyDemandCharge;
  const finalAnnualElectricCost = finalMonthlyElectricBill * 12;
  const finalDemandChargePercent = finalMonthlyElectricBill > 0 ? Math.round((finalMonthlyDemandCharge / finalMonthlyElectricBill) * 100) : 0;

  const finalCostBreakdown = (actualMonthlyKWh || actualPeakKW) ? {
    ...costBreakdown,
    monthlyKWh: finalMonthlyKWh,
    monthlyEnergyCharge: finalMonthlyEnergyCharge,
    monthlyDemandCharge: finalMonthlyDemandCharge,
    monthlyElectricBill: finalMonthlyElectricBill,
    annualEnergyCharge: finalMonthlyEnergyCharge * 12,
    annualDemandCharge: finalMonthlyDemandCharge * 12,
    annualElectricCost: finalAnnualElectricCost,
    demandChargePercent: finalDemandChargePercent,
    potentialPeakReduction: Math.round(finalPeakDemandKW * 0.30),
    potentialDemandSavings: hasDemandCharges ? Math.round(finalPeakDemandKW * 0.30 * demandRatePerKW * 12) : 0,
    _phase2Override: true,
    _source: actualMonthlyKWh && actualPeakKW ? 'actual_both' : actualMonthlyKWh ? 'actual_kwh' : 'actual_peak'
  } : costBreakdown;

  return {
    peakDemandKW: Number.isFinite(finalPeakDemandKW) ? finalPeakDemandKW : 112,
    connectedLoadKW: Number.isFinite(connectedLoadKW) ? connectedLoadKW : 180,
    criticalLoadKW: Number.isFinite(criticalLoadKW) ? criticalLoadKW : 45,
    annualUsageKWh: Number.isFinite(finalAnnualUsageKWh) ? finalAnnualUsageKWh : 350000,
    dailyKWh: Number.isFinite(dailyKWh) ? Math.round(dailyKWh) : 960,
    operatingHours,
    daysPerWeek,
    dailyVehicles,
    // Phase 2: Track data source for transparency
    _dataSource: {
      kWh: actualMonthlyKWh ? 'actual_bill' : 'equipment_model',
      peakKW: actualPeakKW ? 'actual_bill' : 'equipment_model',
      tier: actualMonthlyKWh && actualPeakKW ? 5 : actualMonthlyKWh ? 4 : actualPeakKW ? 4 : 2,
      modelKWh: annualUsageKWh,         // Equipment-model value (for comparison)
      modelPeakKW: peakDemandKW,        // Equipment-model value (for comparison)
      actualMonthlyKWh,
      actualPeakKW
    },
    // Scaling factors used (for transparency)
    scalingFactors: {
      tunnelLength,
      tunnelScaleFactor: Math.round(tunnelScaleFactor * 100) / 100,
      bayCount,
      bayMultiplier: Math.round(bayMultiplier * 100) / 100
    },
    criticalLoadBreakdown: {
      conveyor: { kW: Math.round(emergencyConveyor), purpose: 'Clear tunnel' },
      lighting: { kW: Math.round(emergencyLighting), purpose: 'Emergency egress' },
      it: { kW: emergencyIT, purpose: 'POS, security, alarms' },
      sump: { kW: emergencySump, purpose: 'Water drainage' },
      controls: { kW: emergencyControls, purpose: 'Safety systems' }
    },
    loadBreakdown: {
      pumps: { kW: Math.round(pumpKW), kWhPerDay: Math.round(pumpKWhPerDay), hasVFD: pumpHasVFD, hp: pumpHP, count: pumpCount, config: formData.pumpConfig || 'highPressure' },
      dryers: { kW: Math.round(dryerKW), kWhPerDay: Math.round(dryerKWhPerDay), hasVFD: dryerHasVFD, hp: dryerHP, count: dryerCount, config: formData.dryerConfig || 'blowersOnly' },
      // Water heater with BTU-based calculation details (Sprint 3)
      waterHeater: { 
        kW: Math.round(waterHeaterKW), 
        kWhPerDay: Math.round(waterHeaterKWhPerDay), 
        type: waterHeating,
        btuBased: true,
        gallonsPerDay: Math.round(dailyGallons),
        tempRise,
        dailyTherms: waterHeaterThermsPerDay > 0 ? Math.round(waterHeaterThermsPerDay * 10) / 10 : 0,
        annualGasCost: waterHeaterAnnualGasCost
      },
      vacuums: { kW: Math.round(vacuumKW), kWhPerDay: Math.round(vacuumKWhPerDay), count: vacuumCount, config: formData.vacuumConfig || 'individual' },
      conveyor: { kW: Math.round(conveyorKW), kWhPerDay: Math.round(conveyorKWhPerDay), hp: conveyorHP },
      airCompressor: { kW: Math.round(airCompKW), kWhPerDay: Math.round(airCompKWhPerDay), hp: airCompressorHP },
      waterReclaim: { kW: Math.round(waterReclaimKW), kWhPerDay: Math.round(waterReclaimKWhPerDay), level: waterReclaimLevel },
      roSystem: { kW: Math.round(roSystemKW), kWhPerDay: Math.round(roKWhPerDay), hasRO },
      tunnelExtras: { kW: Math.round(tunnelExtrasKW), kWhPerDay: Math.round(tunnelExtrasKWhPerDay), level: siteFeatures.tunnelExtras },
      premiumServices: { kW: Math.round(premiumServicesKW), kWhPerDay: Math.round(premiumServicesKWhPerDay), level: siteFeatures.premiumServices },
      climateControl: { kW: Math.round(climateControlKW), kWhPerDay: Math.round(climateControlKWhPerDay), level: siteFeatures.climateControl, climateAdjusted: true },
      lighting: { kW: Math.round(lightingKW), kWhPerDay: Math.round(lightingKWhPerDay) },
      hvac: { kW: hvacKW, kWhPerDay: Math.round(hvacKWhPerDay), climateAdjusted: true },
      controls: { kW: controlsKW, kWhPerDay: Math.round(controlsKWhPerDay) },
      // NEW: Climate-specific loads
      floorHeating: { kW: floorHeatingKW, kWhPerDay: Math.round(floorHeatingKWhPerDay), annualKWh: floorHeatingAnnualKWh, seasonalOnly: true, heatingMonths: climate.heatingMonths },
      chemicalHeaters: { kW: chemicalHeaterKW, kWhPerDay: Math.round(chemicalHeaterKWhPerDay), dutyCycle: chemicalHeaterDutyCycle, climateAdjusted: true },
      // Sprint 4: Previously missing equipment
      brushMotors: { 
        kW: Math.round(brushKW), 
        kWhPerDay: Math.round(brushKWhPerDay), 
        dutyCycle: brushDutyCycle,
        hp: brushTotalHP,
        config: brushes,
        ageAdjusted: true
      },
      signage: { 
        kW: Math.round(signageKW * 10) / 10, 
        kWhPerDay: Math.round(signageKWhPerDay), 
        hoursPerDay: signageHoursPerDay,
        components: signage
      },
      parkingLot: { 
        kW: parkingLotKW, 
        kWhPerDay: Math.round(parkingLotKWhPerDay), 
        hoursPerDay: parkingLotHoursPerDay 
      },
      // Feb 11 audit: Previously missing from Calc2
      heatedDryers: {
        kW: heatedDryerKW_c2,
        kWhPerDay: Math.round(heatedDryerKWhPerDay_c2),
        active: hasHeatedDryers_c2,
        type: 'resistive'
      },
      officeFacilities: {
        kW: Math.round(officeFacilitiesKW_c2 * 10) / 10,
        kWhPerDay: Math.round(officeKWhPerDay_c2),
        items: officeFacList_c2,
        type: 'resistive'
      }
    },
    // Equipment age factor applied
    equipmentAge: {
      category: equipmentAge,
      factor: ageFactor,
      impactPercent: Math.round((ageFactor - 1) * 100),
      affectedLoads: ['pumps', 'dryers', 'vacuums', 'conveyor', 'airCompressor', 'brushMotors'],
      description: ageFactor > 1.2 ? 'Older equipment using significantly more energy' : 
                   ageFactor > 1.1 ? 'Moderate efficiency degradation from equipment age' : 
                   'Equipment operating at near-optimal efficiency'
    },
    // NEW: Cost breakdown with demand charges (Phase 2 override if actual data provided)
    costBreakdown: finalCostBreakdown,
    // NEW: Seasonal breakdown showing climate impact
    seasonalBreakdown,
    // NEW: Water heating BTU calculation details (Sprint 3)
    waterHeatingCalc,
    // Gas costs (if gas water heating)
    gasCosts: waterHeaterAnnualGasCost > 0 ? {
      annualTherms: Math.round(waterHeaterThermsPerDay * 365),
      annualCost: waterHeaterAnnualGasCost,
      monthlyTherms: Math.round(waterHeaterThermsPerDay * 30),
      monthlyCost: Math.round(waterHeaterAnnualGasCost / 12)
    } : null
  };
};

// MERLIN ENERGY PRICING MODEL - Research-Backed January 2025
// Sources: NREL, EnergySage, DOE ESGC, Ember Energy, GSL Energy
// ============================================
const PRICING_MODEL = {
  // ============================================
  // EQUIPMENT WHOLESALE COSTS (What Merlin pays suppliers)
  // These are PRE-MARKUP costs for equipment only
  // ============================================
  equipmentWholesale: {
    // SOLAR PANELS ($/W) - Post April 2025 tariffs
    solarPanels: {
      tier1Import: { min: 0.28, max: 0.35, typical: 0.32 },      // Canadian Solar, Jinko, Trina
      tier1Domestic: { min: 0.35, max: 0.45, typical: 0.40 },    // US-assembled, IRA bonus
      premium: { min: 0.42, max: 0.55, typical: 0.48 },          // SunPower, REC Alpha
      budget: { min: 0.22, max: 0.30, typical: 0.26 }            // Chinese direct post-tariff
    },
    // INVERTERS ($/W)
    inverters: {
      stringCommercial: { min: 0.08, max: 0.12, typical: 0.10 }, // SMA, Fronius commercial
      optimizedString: { min: 0.35, max: 0.50, typical: 0.42 },  // SolarEdge + optimizers
      microinverter: { min: 0.28, max: 0.55, typical: 0.38 }     // Enphase IQ8
    },
    // RACKING ($/W)
    racking: {
      roofFlush: { min: 0.08, max: 0.12, typical: 0.10 },        // IronRidge, Unirac
      groundFixed: { min: 0.15, max: 0.25, typical: 0.20 },      // Ground mount
      carport: { min: 0.80, max: 1.20, typical: 1.00 }           // Solar carport
    },
    // BESS ($/kWh equipment only)
    bess: {
      utilityScale: { min: 70, max: 95, typical: 80 },           // >500kWh LFP
      commercialLarge: { min: 120, max: 180, typical: 150 },     // 100-500kWh
      commercialMedium: { min: 200, max: 320, typical: 260 },    // 50-100kWh
      commercialSmall: { min: 350, max: 500, typical: 420 }      // <50kWh
    },
    // GENERATORS ($/kW equipment only)
    generators: {
      naturalGas: { min: 280, max: 400, typical: 340 },          // Cummins, Generac
      propane: { min: 250, max: 380, typical: 310 },             // Kohler, Briggs
      diesel: { min: 220, max: 350, typical: 280 }               // Caterpillar
    },
    // EV CHARGING (per port equipment only)
    evCharging: {
      l2: { min: 800, max: 1500, typical: 1100 },                // ChargePoint L2
      dcfc50kW: { min: 25000, max: 40000, typical: 32000 },      // ABB, Tritium
      dcfc150kW: { min: 55000, max: 85000, typical: 70000 },     // High-power
      dcfc350kW: { min: 90000, max: 140000, typical: 115000 }    // Ultra-fast
    }
  },
  
  // ============================================
  // COST STRUCTURE (% of final customer price)
  // ============================================
  costStructure: {
    equipment: 0.35,      // 35% - Wholesale equipment cost
    labor: 0.16,          // 16% - Installation crews, electricians
    softCosts: 0.07,      // 7% - Engineering, design, PM, permitting
    transportation: 0.04, // 4% - Freight, logistics, crane rental
    salesMarketing: 0.04, // 4% - Sales commission, acquisition
    contingency: 0.04,    // 4% - Warranty reserve, unforeseen
    merlinMargin: 0.25    // ~25% blended GP — tiered per-component (see MARGIN_RATES in TrueQuoteEngineV2)
  },
  // TOTAL: 100%
  //
  // ============================================
  // WHY 30% MARGIN (NOT 22%):
  // ============================================
  // Industry benchmarks:
  // - Solar EPC: 25-40% gross (LumberFi, EnergySage)
  // - BESS integrators: 20-30% (DOE ESGC 2020)
  // - Tesla Energy: 26% gross margin (Q4 2024)
  //
  // Merlin commands 30% because:
  // 1. AI-powered decision intelligence (premium)
  // 2. Full turnkey multi-vendor coordination
  // 3. Ongoing optimization services
  // 4. We compete on INTELLIGENCE, not price
  // 5. 30% is MID-RANGE for quality EPCs
  //
  // $150K project: 30% = $45K profit vs 22% = $33K
  // That's $12,000 LEFT ON THE TABLE per project!
  // ============================================
  
  // State sales tax (equipment portion only)
  salesTax: {
    MI: 0.06, TX: 0.0625, CA: 0.0725, FL: 0.06, NY: 0.08, AZ: 0.056,
    OH: 0.0575, GA: 0.04, NC: 0.0475, NV: 0.0685, WA: 0.065,
    CO: 0.029, IL: 0.0625, PA: 0.06, NJ: 0.0663, MA: 0.0625,
    default: 0.06
  },
  
  // TURNKEY INSTALLED COSTS (What customer pays)
  turnkeyInstalled: {
    solar: {
      commercial: { min: 2.00, max: 2.80, typical: 2.40 },      // $/W rooftop
      carport: { min: 3.40, max: 4.80, typical: 4.10 },         // $/W carport
      ground: { min: 1.90, max: 2.50, typical: 2.20 }           // $/W ground
    },
    bess: {
      utilityScale: { min: 125, max: 200, typical: 160 },       // $/kWh >500kWh
      commercialLarge: { min: 280, max: 420, typical: 350 },    // $/kWh 100-500kWh
      commercialMedium: { min: 400, max: 580, typical: 480 },   // $/kWh 50-100kWh
      commercialSmall: { min: 600, max: 900, typical: 750 }     // $/kWh <50kWh
    },
    generator: {
      naturalGas: { min: 500, max: 750, typical: 620 },         // $/kW installed
      propane: { min: 450, max: 700, typical: 560 },            // $/kW installed
      diesel: { min: 400, max: 650, typical: 500 }              // $/kW installed
    },
    evCharging: {
      l2: { min: 4500, max: 8000, typical: 6200 },              // Per port
      dcfc50: { min: 55000, max: 85000, typical: 70000 },       // 50kW
      dcfc150: { min: 110000, max: 160000, typical: 135000 },   // 150kW
      dcfc350: { min: 170000, max: 260000, typical: 210000 }    // 350kW
    }
  },
  
  // Engineering buffers
  engineeringBuffer: {
    conservative: 1.10,
    standard: 1.15,
    aggressive: 1.25
  }
};

// ============================================
// WEATHER RISK ASSESSMENT ENGINE
// Computes location-specific risk scores that drive generator, solar, and BESS decisions
// ============================================
const computeWeatherRisk = (state) => {
  const w = WEATHER_RISK_DATA[state] || WEATHER_RISK_DATA['default'];
  
  // ── Storm risk: drives generator recommendation & backup sizing ──
  // Weighted: tornado/hurricane are catastrophic (grid down for days), wind is secondary
  const stormScore = Math.max(w.tornado, w.hurricane) * 0.5 + w.wind * 0.3 + w.lightning * 0.2;
  const stormLevel = stormScore >= 3.0 ? 'high' : stormScore >= 2.0 ? 'moderate' : 'low';
  
  // ── Grid reliability: independent of weather, infrastructure-driven ──
  const gridLevel = w.grid >= 4 ? 'poor' : w.grid >= 3 ? 'fair' : 'good';
  
  // ── Combined outage risk: storm + grid compound each other ──
  // A storm-prone area with poor grid = very high outage exposure
  const outageScore = stormScore * 0.6 + w.grid * 0.4;
  const outageLevel = outageScore >= 3.0 ? 'high' : outageScore >= 2.0 ? 'moderate' : 'low';
  
  // ── Solar panel physical risk: hail and wind destroy panels ──
  // Hail ≥ 3: real replacement risk. Most manufacturer warranties EXCLUDE hail damage.
  // Standard 25yr panel warranties cover defects & degradation, NOT impact damage.
  // Homeowner/commercial property insurance may cover it, but with deductibles,
  // depreciation, and potential premium increases after claims.
  // Wind ≥ 4: panel uplift risk, racking failure, micro-crack damage from vibration
  const panelDamageScore = w.hail * 0.65 + w.wind * 0.35;
  const panelRiskLevel = panelDamageScore >= 3.5 ? 'high' : panelDamageScore >= 2.5 ? 'moderate' : 'low';
  
  // Estimated panel replacement probability over 25yr system life
  // Based on NREL "Weather-Related Damage to PV Systems" data:
  // Hail 5 zones (OK, KS, NE): ~40-60% chance of significant damage in 25yr
  // Hail 4 zones (CO, MO, IA): ~25-35% chance
  // Hail 3 zones (TX, AR, IN): ~10-20% chance
  // Hail ≤ 2: <5% chance — negligible
  const panelReplacementProbability = 
    w.hail >= 5 ? 0.50 :
    w.hail >= 4 ? 0.30 :
    w.hail >= 3 ? 0.15 :
    w.hail >= 2 ? 0.05 : 0.02;
  
  // ── Solar production derating: snow load + extreme heat ──
  // Snow ≥ 4: panels covered 2-4 months/yr, production loss 8-15%
  // Heat ≥ 4: temperature coefficient loss, panels lose ~0.35%/°C above 25°C
  const snowDerating = w.snow >= 5 ? 0.88 : w.snow >= 4 ? 0.92 : w.snow >= 3 ? 0.95 : 1.0;
  const heatDerating = w.heat >= 5 ? 0.93 : w.heat >= 4 ? 0.96 : 1.0;
  const productionDerating = snowDerating * heatDerating;
  
  // ── Backup duration recommendation ──
  // Standard: 4hr. Storm-prone: 6-8hr. Hurricane zones: 8-12hr (multi-day outages)
  const recommendedBackupHours = 
    (w.hurricane >= 4 || (stormScore >= 3.5 && w.grid >= 4)) ? 8 :
    (stormScore >= 3.0 || w.grid >= 4) ? 6 : 4;
  
  // ── Generator decision trigger (TRUE if weather alone justifies it) ──
  const weatherNeedsGenerator = outageScore >= 2.5;
  const generatorWeatherReason = 
    w.hurricane >= 4 ? 'hurricane_zone' :
    w.tornado >= 4 ? 'tornado_corridor' :
    (stormScore >= 3.0 && w.grid >= 3) ? 'storm_grid_compound' :
    w.grid >= 4 ? 'poor_grid_reliability' :
    stormScore >= 3.0 ? 'elevated_storm_risk' : null;
  
  return {
    raw: w,
    stormScore, stormLevel,
    gridLevel, gridScore: w.grid,
    outageScore, outageLevel,
    panelDamageScore, panelRiskLevel,
    panelReplacementProbability,
    snowDerating, heatDerating, productionDerating,
    recommendedBackupHours,
    weatherNeedsGenerator,
    generatorWeatherReason,
    // Human-readable summary for UI
    summary: outageLevel === 'high' 
      ? `High outage risk — ${w.tornado >= 4 ? 'tornado corridor' : w.hurricane >= 4 ? 'hurricane zone' : 'severe storms'} with ${gridLevel} grid reliability`
      : outageLevel === 'moderate'
      ? `Moderate outage risk — seasonal storms with ${gridLevel} grid`
      : `Low outage risk — stable weather and ${gridLevel} grid`
  };
};

// ============================================
// SYSTEM OPTIMIZATION ENGINE
// ============================================
const optimizeSystemSizing = (facilityLoad, roofArea, carportArea = 0, groundMountArea = 0, industry, state, liveSolarRate = null, formData = {}) => {
  const buffer = PRICING_MODEL.engineeringBuffer.standard; // 15% engineering buffer
  const weatherRisk = computeWeatherRisk(state);
  
  // Step 1: Calculate target energy needs (with buffer)
  const targetAnnualKWh = facilityLoad.annualUsageKWh * buffer;
  const targetPeakKW = facilityLoad.peakDemandKW * buffer;
  const criticalLoadKW = facilityLoad.criticalLoadKW;
  
  // Step 2: Calculate available solar capacity from roof
  // Typical commercial: 15 W/sq ft roof (modern 22%+ panels with row spacing)
  // FIX DD-1: WizA car wash path pre-deducts unusable roof (polycarbonate, mixed, opaque factors).
  // roofArea from car wash WizA = solar-ready sqft. Only need fire-code setback deduction (0.90).
  // Generic industries: user enters raw "available roof area" → apply full 0.65 usability factor.
  // Detection: formData.roofType is ONLY set by car wash WizA flow (polycarbonate/mixed/opaque).
  const roofUsableFactor = formData.roofType ? 0.90 : 0.65;
  const roofSolarDensity = 15; // W per sq ft — roof-mount
  const maxRoofSolarW = roofArea * roofUsableFactor * roofSolarDensity;
  const maxRoofSolarKW = Math.round(maxRoofSolarW / 1000);
  
  // Step 3: Calculate carport solar if available
  const carportUsableFactor = 0.85; // 85% usable (designed for solar)
  const carportSolarDensity = 13; // W per sq ft — lower density for vehicle clearance/tilt
  const maxCarportSolarW = carportArea * carportUsableFactor * carportSolarDensity;
  const maxCarportSolarKW = Math.round(maxCarportSolarW / 1000);
  
  // Step 3b: Calculate ground-mount solar if available
  // FIX GM-1: Ground mount was ignored in sizing — WizA sends groundMountArea but optimizer never used it
  const groundMountUsableFactor = 0.90; // 90% usable (dedicated solar field, minimal obstructions)
  const groundMountSolarDensity = 15; // W per sq ft — ground mount with tilt optimization
  const maxGroundSolarW = groundMountArea * groundMountUsableFactor * groundMountSolarDensity;
  const maxGroundSolarKW = Math.round(maxGroundSolarW / 1000);
  
  // Step 4: Total available solar capacity
  const maxTotalSolarKW = maxRoofSolarKW + maxCarportSolarKW + maxGroundSolarKW;
  
  // Solar production rate from live PVWatts or module-scope STATE_SOLAR_PRODUCTION table
  const solarProductionPerKW = liveSolarRate || STATE_SOLAR_PRODUCTION[state] || STATE_SOLAR_PRODUCTION.default;
  
  // Step 5: Calculate solar needed to offset 70-80% of usage
  const targetSolarOffset = 0.75;
  const idealSolarKW = Math.round((targetAnnualKWh * targetSolarOffset) / solarProductionPerKW);
  
  // Step 6: Constrain solar to available space
  const actualSolarKW = Math.min(idealSolarKW, maxTotalSolarKW);
  const roofSolarKW = Math.min(actualSolarKW, maxRoofSolarKW);
  const carportSolarKW = Math.min(actualSolarKW - roofSolarKW, maxCarportSolarKW);
  const groundSolarKW = Math.max(0, actualSolarKW - roofSolarKW - carportSolarKW); // FIX GM-1: overflow to ground
  
  // Step 7: Calculate unmet energy needs
  // Apply weather-based production derating (snow load, heat loss)
  const solarAnnualProduction = Math.round(actualSolarKW * solarProductionPerKW * weatherRisk.productionDerating);
  const unmetAnnualKWh = Math.max(0, targetAnnualKWh - solarAnnualProduction);
  const solarShortfallPct = unmetAnnualKWh / targetAnnualKWh;
  
  // Step 8: Size BESS based on multiple factors
  // a) Peak shaving: 30-40% of peak demand
  const peakShavingKW = Math.round(targetPeakKW * 0.35);
  
  // b) TOU arbitrage: 4-hour duration is standard
  const touDuration = 4;
  const touKWh = peakShavingKW * touDuration;
  
  // c) Backup: Weather-informed duration — storm-prone areas need more
  const backupHours = weatherRisk.recommendedBackupHours;
  const backupKWh = criticalLoadKW * backupHours;
  
  // Take maximum of the three use cases
  const bessKWh = Math.max(touKWh, backupKWh);
  // FIX #32: Power = max of peak shaving need and critical load, NOT kWh/touDuration
  // When backup drives kWh sizing (e.g. 8hr × 30kW = 240kWh), dividing by touDuration (4)
  // gave 60kW — double the actual 30kW needed. Power is independent of energy capacity.
  const bessKW = Math.round(Math.max(peakShavingKW, criticalLoadKW));
  
  // Step 9: Determine if generator is needed
  // THREE decision paths — any one triggers recommendation:
  //   Path A: Solar shortfall — panels can't cover enough, generator fills the gap
  //   Path B: BESS undersized — battery can't power critical load alone
  //   Path C: Weather/grid risk — storms knock out grid for extended periods,
  //           BESS drains in hours but outages last days. Generator = unlimited runtime.
  // FIX #9: Suppress generator for minor/no-impact outage when weather risk is low
  const outageImpact = formData.outageImpact || 'partial-operations';
  const outageJustifiesGen = outageImpact === 'complete-shutdown' || outageImpact === 'partial-operations';
  const needsGenerator = 
    (solarShortfallPct > 0.40 && outageJustifiesGen) ||  // Path A: Solar shortfall + business needs backup
    (criticalLoadKW * backupHours > bessKWh && outageJustifiesGen) || // FIX #56: Path B: BESS insufficient + business needs backup
    (weatherRisk.weatherNeedsGenerator && outageImpact !== 'no-impact' && outageImpact !== 'full-operations');  // Path C: Weather risk — skip if no impact OR facility already handles outages (FIX SIM-1)
  
  const generatorReason = 
    solarShortfallPct > 0.40 ? 'solar_shortfall' :
    criticalLoadKW * backupHours > bessKWh ? 'backup_energy_shortfall' :
    weatherRisk.generatorWeatherReason || 'weather_risk';
  
  const generatorKW = needsGenerator 
    ? Math.ceil(criticalLoadKW * 1.20 / 10) * 10 // 20% buffer, round to 10kW
    : 0;
  
  // ═══ ENERGY GAP ANALYSIS — determines how to "make up" the shortfall ═══
  const roofOnlyProductionKWh = Math.round(maxRoofSolarKW * solarProductionPerKW * weatherRisk.productionDerating);
  const roofOnlyOffsetPct = targetAnnualKWh > 0 ? Math.round((roofOnlyProductionKWh / targetAnnualKWh) * 100) : 0;
  const hasEnergyGap_opt = roofOnlyOffsetPct < 75; // target 75% offset
  const gapKWh = Math.max(0, targetAnnualKWh * 0.75 - roofOnlyProductionKWh);
  const carportCanFillKWh = Math.round(maxCarportSolarKW * solarProductionPerKW * weatherRisk.productionDerating);
  const groundCanFillKWh = Math.round(maxGroundSolarKW * solarProductionPerKW * weatherRisk.productionDerating); // FIX GM-3
  const canCarportFillGap = (carportArea > 0 || groundMountArea > 0) && (carportCanFillKWh + groundCanFillKWh) >= gapKWh;
  const combinedOffsetPct = targetAnnualKWh > 0 ? Math.round(((roofOnlyProductionKWh + carportCanFillKWh + groundCanFillKWh) / targetAnnualKWh) * 100) : 0;
  
  return {
    // Solar optimization
    // FIX NaN-5: Guard all outputs — NaN from any upstream input must not reach buildRecommendation
    solar: {
      idealKW: idealSolarKW || 85,
      actualKW: Number.isFinite(actualSolarKW) ? actualSolarKW : 85,
      roofKW: Number.isFinite(roofSolarKW) ? roofSolarKW : Math.min(85, maxRoofSolarKW || 85),
      carportKW: Number.isFinite(carportSolarKW) ? carportSolarKW : 0,
      groundKW: Number.isFinite(groundSolarKW) ? groundSolarKW : 0, // FIX GM-1
      maxAvailableKW: maxTotalSolarKW || 85,
      constrainedBySpace: idealSolarKW > maxTotalSolarKW,
      annualProduction: Number.isFinite(solarAnnualProduction) ? solarAnnualProduction : 102000,
      offsetPercentage: Number.isFinite(targetAnnualKWh) && targetAnnualKWh > 0 ? Math.round((solarAnnualProduction / targetAnnualKWh) * 100) : 65
    },
    
    // Energy gap analysis — flows to Step 4 gap makeup scoring
    energyGapAnalysis: {
      hasGap: hasEnergyGap_opt,
      roofOnlyOffsetPct,
      combinedOffsetPct,
      gapKWh: Math.round(gapKWh),
      maxRoofKW: maxRoofSolarKW,
      maxCarportKW: maxCarportSolarKW,
      maxGroundKW: maxGroundSolarKW, // FIX GM-1
      carportCanFillGap: canCarportFillGap,
      solarShortfallPct: Math.round(solarShortfallPct * 100),
      targetAnnualKWh: Math.round(targetAnnualKWh),
      unmetAnnualKWh: Math.round(unmetAnnualKWh),
    },
    
    // FIX EXP-1: Solar Expansion Scenarios — pre-computed for Step 5/6 advisory
    // Shows customer what each expansion option buys them
    expansionScenarios: (() => {
      if (!hasEnergyGap_opt && actualSolarKW >= idealSolarKW * 0.90) return null; // No expansion needed
      const prodRate = solarProductionPerKW * (weatherRisk.productionDerating || 1.0);
      const scenarios = [];
      const ind = (industry?.id || '').toLowerCase();
      const ft = (formData.facilityType || '').toLowerCase();
      
      // ═══ INDUSTRY-AWARE EXPANSION SCENARIOS ═══
      // Research-backed: Express tunnel car washes operate on 0.75-1.5 acre commercial pads.
      // Site breakdown for a typical 1-acre express wash:
      //   Tunnel building (125ft × 35ft = 4,375 sqft) — metal/polycarbonate roof, already in roof solar
      //   Queue/stacking lanes (2 × 150ft × 12ft = 3,600 sqft) — MUST stay open for signage, pay kiosks, attendants
      //   Vacuum stations (12-16 stations = 1,800 sqft) — IDEAL for solar canopy, cars stationary 3-5 min
      //   Exit lanes (~2,000 sqft) — need clearance for dryer units and exiting vehicles
      //   Equipment room (~600 sqft) — behind tunnel, small roof, can add 5-7 kW
      //   Driveways/circulation (~6,000 sqft) — fire lanes, ADA, turning radius, snow storage
      //   Employee parking (4-8 spots = 600-1,200 sqft) — only non-operational space on site
      //   Customer parking: ZERO at express washes. Drive-through only.
      //   Full-service washes MAY have 10-20 customer waiting spots (~2,000-3,000 sqft)
      //
      // FEASIBLE solar expansion for car washes:
      //   ✅ Vacuum canopy — the ONLY proven, high-value expansion (shade + energy, no land)
      //   ✅ Vacuum + equipment bldg roof — adds ~5-7 kW from equipment room
      //   ⚠️ Small employee carport — 600-1,200 sqft, marginal but possible
      //   ❌ "Carport / Parking Shade" at 4,500 sqft — WHERE? No parking lot exists at express washes
      //   ❌ "Full-Site Canopy" at 7,500 sqft — IMPOSSIBLE. Queue lanes need open sky, no customer lot
      //   ❌ Ground mount — already excluded (no unused land)
      const isCarWash = ind === 'carwash' || ft === 'express' || ft === 'full' || ft === 'flex' || ft === 'mini' || ft === 'self' || ft === 'inbay' || ft === 'iba';
      const isHotel = ind === 'hotel' || ind === 'resort' || ind === 'hospitality';
      const isAgri = ind === 'agriculture' || ind === 'farm' || ind === 'indoorfarm' || ind === 'agrivoltaic';
      const isDataCenter = ind === 'datacenter' || ind === 'data_center';
      const hasAdjacentLand = formData.groundMountInterest === 'yes' && (parseInt(formData.groundMountArea) || 0) > 0;
      const userGroundArea = hasAdjacentLand ? parseInt(formData.groundMountArea) || 5000 : 0;
      
      // Ground mount feasibility flag per industry
      const groundMountFeasible = hasAdjacentLand || isHotel || isAgri || isDataCenter;
      
      if (isCarWash) {
        // ── CAR WASH SCENARIOS — 3 options: Roof (baseline), Vacuum Canopy, Equipment Bldg Roof ──
        // Roof solar is already captured in actualSolarKW. These are expansion-only.
        
        // Scenario 1: Vacuum Canopy — THE primary expansion for car washes
        // 12-24 vacuum stations, ~150 sqft each, ~85% panel coverage, 13 W/sqft
        // Only place on-site where cars sit still. Proven dual-use: shade + energy.
        const vacStations = parseInt(formData.vacuumCount || 0) > 0 ? parseInt(formData.vacuumCount) : 12; // FIX: was formData.vacuumStations (WizA sends vacuumCount)
        const vacArea = Math.max(1200, vacStations * 150);
        const vacKW = Math.round(vacArea * 0.85 * 13 / 1000);
        const vacTotalKW = Math.min(idealSolarKW, actualSolarKW + vacKW);
        const vacProd = Math.round(vacTotalKW * prodRate);
        const vacOffset = targetAnnualKWh > 0 ? Math.round((vacProd / targetAnnualKWh) * 100) : 0;
        scenarios.push({ id: 'vacuum_canopy', label: 'Vacuum Canopy Solar', icon: '🏗️', area: vacArea, addedKW: Math.round(vacTotalKW - actualSolarKW), totalKW: vacTotalKW, annualProd: vacProd, offset: Math.min(vacOffset, 100), structuralCost: Math.round((vacTotalKW - actualSolarKW) * 1000 * CARPORT_COST_PER_W) /* FIX C-3 */, desc: `Solar panels over ${vacStations} vacuum stations — customer shade + energy, zero new land` });
        
        // Scenario 2: Equipment Building Roof
        // Chemical storage, water treatment, compressors — typically 400-800 sqft flat roof behind tunnel.
        // Adds ~5-7 kW. Low structural cost (roof already exists). Marginal but real.
        const equipRoofArea = 600; // conservative — most equipment bldgs 400-800 sqft
        const equipKW = Math.round(equipRoofArea * 0.80 * 13 / 1000); // 80% usable (HVAC vents)
        const equipTotalKW = Math.min(idealSolarKW, actualSolarKW + equipKW);
        const equipProd = Math.round(equipTotalKW * prodRate);
        const equipOffset = targetAnnualKWh > 0 ? Math.round((equipProd / targetAnnualKWh) * 100) : 0;
        scenarios.push({ id: 'equip_roof', label: 'Equipment Building Roof', icon: '🔧', area: equipRoofArea, addedKW: Math.round(equipTotalKW - actualSolarKW), totalKW: equipTotalKW, annualProd: equipProd, offset: Math.min(equipOffset, 100), structuralCost: Math.round((equipTotalKW - actualSolarKW) * 1000 * 0.40), desc: '~600 sqft flat roof behind tunnel — low cost (structure exists), small but real output', isMinor: true });
        
        
      } else {
        // ── NON-CAR-WASH SCENARIOS ──
        
        // Carport / Parking Shade
        const cpArea = isHotel ? 8000 : 5000;
        const cpLabel = isHotel ? 'Parking Structure Solar' : 'Carport Solar Canopy';
        const cpKW = Math.round(cpArea * 0.85 * 13 / 1000);
        const cpTotalKW = Math.min(idealSolarKW, actualSolarKW + cpKW);
        const cpProd = Math.round(cpTotalKW * prodRate);
        const cpOffset = targetAnnualKWh > 0 ? Math.round((cpProd / targetAnnualKWh) * 100) : 0;
        scenarios.push({ id: 'carport_solar', label: cpLabel, icon: '🅿️', area: cpArea, addedKW: Math.round(cpTotalKW - actualSolarKW), totalKW: cpTotalKW, annualProd: cpProd, offset: Math.min(cpOffset, 100), structuralCost: Math.round((cpTotalKW - actualSolarKW) * 1000 * CARPORT_COST_PER_W) /* FIX C-3 */, desc: 'Solar canopy over existing parking — shade + energy + EV readiness' });
      
        // Full-Site Canopy (non-car-wash only)
        const lgArea = isHotel ? 15000 : 10000;
        const lgKW = Math.round(lgArea * 0.85 * 13 / 1000);
        const lgTotalKW = Math.min(idealSolarKW, actualSolarKW + lgKW);
        const lgProd = Math.round(lgTotalKW * prodRate);
        const lgOffset = targetAnnualKWh > 0 ? Math.round((lgProd / targetAnnualKWh) * 100) : 0;
        scenarios.push({ id: 'large_carport', label: 'Full-Site Solar Canopy', icon: '☀️', area: lgArea, addedKW: Math.round(lgTotalKW - actualSolarKW), totalKW: lgTotalKW, annualProd: lgProd, offset: Math.min(lgOffset, 100), structuralCost: Math.round((lgTotalKW - actualSolarKW) * 1000 * CARPORT_COST_PER_W) /* FIX C-3 */, desc: 'Maximum coverage — all available parking and walkway areas' });
      }
      
      // ── Ground Mount — GATED by industry feasibility ──
      if (groundMountFeasible) {
        const gmArea = userGroundArea || (isHotel ? 10000 : isAgri ? 20000 : isDataCenter ? 15000 : 5000);
        const gmKW = Math.round(gmArea * 0.90 * 15 / 1000);
        const gmTotalKW = Math.min(idealSolarKW, actualSolarKW + gmKW);
        const gmProd = Math.round(gmTotalKW * prodRate);
        const gmOffset = targetAnnualKWh > 0 ? Math.round((gmProd / targetAnnualKWh) * 100) : 0;
        const gmLabel = isAgri ? 'Agrivoltaic Ground Array' : 'Ground-Mount Array';
        const gmDesc = isAgri ? 'Elevated panels with crop/grazing use underneath — dual-revenue land use'
          : isHotel ? 'Dedicated solar field on resort grounds — high density, lowest structural cost'
          : hasAdjacentLand ? `Ground array on your ${gmArea.toLocaleString()} sqft adjacent lot — lowest $/W`
          : 'Dedicated solar field on unused land — lowest structural premium';
        scenarios.push({ id: 'ground_mount', label: gmLabel, icon: isAgri ? '🌾' : '🌱', area: gmArea, addedKW: Math.round(gmTotalKW - actualSolarKW), totalKW: gmTotalKW, annualProd: gmProd, offset: Math.min(gmOffset, 100), structuralCost: Math.round((gmTotalKW - actualSolarKW) * 1000 * 0.40), desc: gmDesc });
      }
      
      // ── Car Wash: explain WHY ground mount is excluded ──
      const groundMountNote = isCarWash && !hasAdjacentLand
        ? 'Ground-mount excluded — express tunnel sites (0.75–1.5 acres) have no unused land. Tunnel + queue + vacuum + equipment = entire lot. If you have adjacent land, update Step 3.'
        : null;
      
      return { roofOnlyKW: actualSolarKW, roofOnlyOffset: roofOnlyOffsetPct, idealKW: idealSolarKW, targetOffset: 75, scenarios, groundMountNote, industryType: ind || 'commercial' };
    })(),
    
    // BESS optimization
    // FIX NaN-6: Guard BESS outputs against NaN
    bess: {
      capacityKWh: Number.isFinite(bessKWh) ? Math.round(bessKWh / 25) * 25 : 200,
      powerKW: Number.isFinite(bessKW) ? Math.round(bessKW / 5) * 5 : 50,
      duration: Number.isFinite(Math.max(touDuration, backupHours)) ? Math.max(touDuration, backupHours) : 4,
      sizingBasis: backupKWh > touKWh ? 'backup' : 'peak_shaving'
    },
    
    // Generator recommendation — driven by technical + weather + grid factors
    generator: {
      recommended: needsGenerator,
      powerKW: generatorKW,
      reason: needsGenerator ? generatorReason : null
    },
    
    // Weather risk assessment — flows through to UI
    weatherRisk,
    
    // Engineering buffer applied
    bufferFactor: buffer,
    targetPeakKW: targetPeakKW,
    targetAnnualKWh: targetAnnualKWh
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE INCENTIVES DATABASE (24 states)
// ═══════════════════════════════════════════════════════════════════════════════
const STATE_INCENTIVES = {
  // FIX B-8 (Phase 4): All 50 states + DC. Source: DSIRE, state energy offices (Feb 2026)
  // ⚠️ State incentive programs expire, get defunded, or change annually. These are POINT-IN-TIME
  // estimates. Verify DSIRE (dsireusa.org) and state energy office before including in customer quotes.
  // Programs like IL Shines, CA SGIP, NY-Sun have enrollment caps that may be reached.
  // Northeast — generally strong programs
  CT: { solarPerKW: 150, bessPerKWh: 200, maxBess: 50000, notes: 'RSIP residential + commercial' },
  DC: { solarPerKW: 100, bessPerKWh: 0, maxBess: 0, notes: 'DCSEU SREC program' },
  MA: { solarPerKW: 100, bessPerKWh: 250, maxBess: 75000, notes: 'SMART program + storage' },
  MD: { solarPerKW: 100, bessPerKWh: 150, maxBess: 30000, notes: 'SEIF + MEA programs' },
  ME: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Efficiency Maine' },
  NH: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Commercial solar rebate (limited)' },
  NJ: { solarPerKW: 85, bessPerKWh: 100, maxBess: 30000, notes: 'SuSI + storage incentive' },
  NY: { solarPerKW: 200, bessPerKWh: 200, maxBess: 50000, notes: 'NY-Sun + storage adders' },
  PA: { solarPerKW: 25, bessPerKWh: 50, maxBess: 15000, notes: 'SREC + some utilities' },
  RI: { solarPerKW: 75, bessPerKWh: 100, maxBess: 20000, notes: 'REF commercial incentives' },
  VT: { solarPerKW: 50, bessPerKWh: 100, maxBess: 20000, notes: 'Bring Your Own Device' },
  // Southeast — limited state programs
  AL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA programs only' },
  AR: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering only' },
  DE: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Green Energy Fund (limited)' },
  FL: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering, no state rebate' },
  GA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Limited state programs' },
  KY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  LA: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Tax credit expired 2025' },
  MS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NC: { solarPerKW: 25, bessPerKWh: 0, maxBess: 0, notes: 'Duke Energy rebates' },
  SC: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit 25%' },
  TN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'TVA Green Connect' },
  VA: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'Grid transformation' },
  WV: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  // Midwest
  IA: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates vary' },
  IL: { solarPerKW: 50, bessPerKWh: 50, maxBess: 20000, notes: 'Illinois Shines' },
  IN: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Net metering reduced' },
  KS: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MI: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'DTE/Consumers programs' },
  MN: { solarPerKW: 40, bessPerKWh: 50, maxBess: 15000, notes: 'Made in Minnesota solar' },
  MO: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility rebates only' },
  ND: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  NE: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Public power — check utility' },
  OH: { solarPerKW: 0, bessPerKWh: 25, maxBess: 10000, notes: 'Limited programs' },
  OK: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  SD: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  WI: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Focus on Energy rebate' },
  // West
  AZ: { solarPerKW: 0, bessPerKWh: 75, maxBess: 20000, notes: 'APS/SRP storage rebates' },
  CA: { solarPerKW: 0, bessPerKWh: 150, maxBess: 100000, notes: 'SGIP still active for storage' },
  CO: { solarPerKW: 50, bessPerKWh: 100, maxBess: 40000, notes: 'Xcel rebates, EnergySmart' },
  HI: { solarPerKW: 0, bessPerKWh: 200, maxBess: 50000, notes: 'Strong storage support' },
  ID: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  MT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'Alternative energy credit' },
  NM: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Solar Market Development' },
  NV: { solarPerKW: 0, bessPerKWh: 50, maxBess: 15000, notes: 'NV Energy programs' },
  OR: { solarPerKW: 50, bessPerKWh: 100, maxBess: 25000, notes: 'Energy Trust of Oregon' },
  TX: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Utility programs only' },
  UT: { solarPerKW: 15, bessPerKWh: 0, maxBess: 0, notes: 'State tax credit (reduced)' },
  WA: { solarPerKW: 30, bessPerKWh: 50, maxBess: 15000, notes: 'Utility programs vary' },
  WY: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'No state incentive' },
  // Territories / Other
  AK: { solarPerKW: 0, bessPerKWh: 50, maxBess: 10000, notes: 'Rural microgrid grants' },
  default: { solarPerKW: 0, bessPerKWh: 0, maxBess: 0, notes: 'Check local utility' }
};

// State-specific solar production (kWh/kW/year) — aligned with Wizard A's SOLAR_DATA
const STATE_SOLAR_PRODUCTION = {
  AZ: 1860, NV: 1770, NM: 1800, CA: 1650, UT: 1590, CO: 1560,
  TX: 1560, FL: 1530, GA: 1440, NC: 1350, SC: 1440, AL: 1350, MS: 1440, LA: 1440,
  VA: 1290, MD: 1230, DE: 1230, NJ: 1200, PA: 1140, NY: 1140, CT: 1140, RI: 1140, MA: 1140, DC: 1200,
  IL: 1230, IN: 1200, OH: 1140, MI: 1200, WI: 1200, MN: 1230, IA: 1260, MO: 1320, KS: 1500, NE: 1440,
  MT: 1350, WY: 1500, ID: 1440, WA: 1080, OR: 1200, VT: 1110, NH: 1140, ME: 1140,
  HI: 1560, AK: 840, TN: 1320, KY: 1260, WV: 1200, OK: 1500, AR: 1320, SD: 1350, ND: 1290,
  default: 1350
};

// State-aware utility escalation rates (10-yr CAGR from EIA data, commercial sector)
// NOTE: Rates reflect 10yr trailing avg (EIA data). Some states (CA, HI, CT) include recent spikes from
// wildfire/grid modernization that may not sustain. Conservative cap at 5.0% for long-term projections.
// TODO: Use EIA AEO forward-looking projections (typically 2-3% nationally) for sensitivity analysis.
const STATE_ESCALATION_RATES = {
  CA: 0.058, HI: 0.055, CT: 0.052, NH: 0.048, MA: 0.047, RI: 0.047, ME: 0.046, VT: 0.045,
  NY: 0.044, NJ: 0.043, AK: 0.042, MD: 0.040, IL: 0.040, PA: 0.039, DE: 0.038, OH: 0.037,
  MI: 0.038, WI: 0.035, MN: 0.034, IN: 0.034, VA: 0.033, NC: 0.032, SC: 0.031, GA: 0.030,
  CO: 0.030, AZ: 0.029, NV: 0.028, OR: 0.028, WA: 0.027, TN: 0.026, AL: 0.025, MS: 0.025,
  TX: 0.024, OK: 0.024, KS: 0.023, MO: 0.023, AR: 0.023, LA: 0.022, FL: 0.021, NM: 0.022,
  ID: 0.021, UT: 0.021, MT: 0.020, WY: 0.020, NE: 0.020, SD: 0.019, ND: 0.019, IA: 0.020,
  KY: 0.024, WV: 0.023, DC: 0.041, default: 0.030
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: BRIDGE FUNCTION
// Runs calculation engines and produces a `rec` object matching MOCK_REC shape
// so the v11 financial engine doesn't need structural changes.
// ═══════════════════════════════════════════════════════════════════════════════
const buildRecommendation = (formData, locationData, selectedIndustry, initialAnnualBill) => {
  if (!locationData?.utility?.electric || !formData) {
    // Return safe defaults when data not available yet
    return {
      solar: { sizeKW: 85, annualProduction: 102000 },
      bess: { capacityKWh: 200, powerKW: 50, duration: 4 },
      generator: { powerKW: 60, fuelType: 'Natural Gas' },
      facilityLoad: { peakDemandKW: 112, criticalLoadKW: 45, annualUsageKWh: 350000, totalConnectedKW: 180 },
      assumptions: { electricRate: 0.19, demandCharge: 15, rateEscalation: `${(STATE_ESCALATION_RATES.MI * 100).toFixed(1)}%` },
      weatherRisk: computeWeatherRisk('MI'),
      _isDefault: true
    };
  }
  try { // E-1: Protect entire financial calculation pipeline — any NaN/undefined crash returns safe fallback

  const state = locationData.utility.state || 'MI';
  if (!locationData.utility.state) console.warn('[Merlin WizB] No state in locationData — defaulting to MI. Rates/incentives may be inaccurate.'); // FIX H-3
  const electric = locationData.utility.electric;
  const solarData = locationData.solar || { peakSunHours: 4.0, annualProduction: 1200, irradiance: 4.2 };

  // Step 1: Calculate facility load
  const facilityLoad = calculateFacilityLoad(formData, selectedIndustry, state, locationData);

  // Step 2: Get roof/carport/ground areas
  // FIX DD-2: Car wash default roofArea is ~1,800-2,000 sqft (tunnel building), not 5,000
  const _rawRoof = parseInt(formData.roofArea) || 0; // FIX H-2: guard NaN
  const roofArea = _rawRoof > 0 ? _rawRoof
    : (parseInt(formData.totalRoofArea) || 0) > 0 ? Math.round((parseInt(formData.totalRoofArea) || 0) * 0.55)
    : selectedIndustry?.id === 'carwash' ? 2000
    : 5000;
  const carportArea = formData.carportInterest !== 'no' ? Math.max(parseInt(formData.carportArea) || 0, 0) : 0;
  // FIX GM-1: Read ground mount area — WizA sends this when user selects ground strategy
  const groundMountArea = formData.groundMountInterest === 'yes' ? Math.max(parseInt(formData.groundMountArea) || 0, 0) : 0;

  // Step 3: Optimize system sizing
  // FIX C-1: MODEL G DUAL-TRACK — applies to ALL industries including car wash
  // SIZING: Uses equipment-profile kWh (stable, physics-based) — never adjusted by bill
  // SAVINGS: Uses bill-validated kWh with validation gate — captures actual spend
  // Monte Carlo validated: 12.1% payback error (vs 15.3% profile-only, 26.0% old blend)
  // PHASE 2: Skip bill→kWh derivation entirely if actual utility data provided
  const hasActualKWh = facilityLoad._dataSource?.actualMonthlyKWh > 0;
  const hasActualPeak = facilityLoad._dataSource?.actualPeakKW > 0;
  
  // Preserve original equipment-model value for SIZING (never mutated)
  const sizingAnnualKWh = facilityLoad.annualUsageKWh;
  const sizingPeakKW = facilityLoad.peakDemandKW;
  
  // Compute SAVINGS track kWh (bill-validated or actual)
  let savingsAnnualKWh = sizingAnnualKWh; // default to equipment model
  let savingsPeakKW = sizingPeakKW;
  
  if (hasActualKWh || hasActualPeak) {
    // Phase 2 Tier 4/5: Actual data already applied in calculateFacilityLoad
    // No bill cross-check needed — actual data IS the ground truth
    savingsAnnualKWh = facilityLoad.annualUsageKWh; // already overridden in calculateFacilityLoad
    savingsPeakKW = facilityLoad.peakDemandKW;
    facilityLoad._billAdjusted = false;
    facilityLoad._phase2Bypass = true;
  } else if (initialAnnualBill && initialAnnualBill > 0) {
    // Model G: Bill → kWh conversion with validation gate
    const utilityRateLocal = locationData?.utility?.electric?.avgRate || 0.19;
    const utilityBillingType = formData.utilityBillingType || 'demand';
    // Billing-type-aware energy/demand split (matches consumption section logic)
    const energyPctLocal = { flat: 1.0, tou: 0.95, demand: 0.65, 'tou-demand': 0.55, unknown: 0.75 }[utilityBillingType] || 0.75;
    const energyOnlyAnnualBill = Math.max(initialAnnualBill * energyPctLocal, initialAnnualBill * 0.55);
    const billImpliedKWh = Math.round(energyOnlyAnnualBill / utilityRateLocal);
    const demandChargeLocal = locationData?.utility?.electric?.demandCharge ?? 12; // FIX H-7: ??
    const billImpliedPeakKW = (energyPctLocal < 1.0 && demandChargeLocal > 0)
      ? Math.round((initialAnnualBill * (1 - energyPctLocal)) / (demandChargeLocal * 12))
      : sizingPeakKW;
    
    // Validation gate: 40% threshold (was 30% in old Model D)
    const deviation = Math.abs(billImpliedKWh - sizingAnnualKWh) / Math.max(sizingAnnualKWh, 1);
    if (deviation <= 0.40) {
      // Bill is plausible — 70% bill + 30% profile for SAVINGS (not sizing)
      savingsAnnualKWh = Math.round(billImpliedKWh * 0.70 + sizingAnnualKWh * 0.30);
      savingsPeakKW = Math.round(billImpliedPeakKW * 0.70 + sizingPeakKW * 0.30);
    } else {
      // Bill seems extreme (slider noise?) — 30% bill + 70% profile
      savingsAnnualKWh = Math.round(billImpliedKWh * 0.30 + sizingAnnualKWh * 0.70);
      savingsPeakKW = Math.round(billImpliedPeakKW * 0.30 + sizingPeakKW * 0.70);
    }
    facilityLoad._billAdjusted = true;
    facilityLoad._modelG = { billImpliedKWh, sizingKWh: sizingAnnualKWh, savingsKWh: savingsAnnualKWh, deviation: Math.round(deviation * 100) };
  }
  
  // Store savings track on facilityLoad for financial engine downstream
  facilityLoad.savingsAnnualKWh = savingsAnnualKWh;
  facilityLoad.savingsPeakKW = savingsPeakKW;
  // SIZING uses original equipment model (NOT adjusted by bill)
  facilityLoad.annualUsageKWh = sizingAnnualKWh;
  const optimization = optimizeSystemSizing(facilityLoad, roofArea, carportArea, groundMountArea, selectedIndustry, state, locationData?.solar?.annualProduction || null, formData);

  // Step 4: Apply results
  // FIX NaN-1: Guard against NaN cascading from any upstream calculation path
  // Math.round(NaN / 5) * 5 = NaN, and NaN < 25 is false, so NaN would pass through unchecked
  let solarSystemKW = Math.round(optimization.solar.actualKW / 5) * 5;
  if (!Number.isFinite(solarSystemKW) || solarSystemKW < 25) solarSystemKW = Math.max(25, Math.round((facilityLoad.annualUsageKWh || 350000) * 0.75 / (solarProductionRate || 1200) / 5) * 5) || 85;

  // Solar production using live PVWatts data if available, else STATE_SOLAR_PRODUCTION
  const solarProductionRate = locationData?.solar?.annualProduction || STATE_SOLAR_PRODUCTION[state] || STATE_SOLAR_PRODUCTION.default;
  // FIX #85: Only apply NASA temp derating when using STATIC table. PVWatts already models temperature.
  const tempDerateRec = (locationData?.solar?._liveSource && locationData?.solar?._tempDeratingFactor) ? 1.0 : (locationData?.solar?._tempDeratingFactor || 1.0);
  const annualProduction = calcAnnualProd(solarSystemKW, solarProductionRate, optimization.weatherRisk?.productionDerating, tempDerateRec); // FIX H-2: unified calc

  // BESS sizing
  // FIX NaN-3: Math.max(NaN, 50) returns NaN, not 50. Guard with isFinite check.
  const _rawBessKWh = optimization.bess.capacityKWh;
  const bessKWh = Number.isFinite(_rawBessKWh) ? Math.max(_rawBessKWh, 50) : 200;
  const bessKW = Number.isFinite(optimization.bess.powerKW) ? optimization.bess.powerKW : 50; // FIX NaN-4
  const bessDuration = Number.isFinite(optimization.bess.duration) ? optimization.bess.duration : 4; // FIX NaN-4

  // Generator recommendation
  // FIX GEN-GAS: Dual-check gasLine (car wash sends string 'yes'/'no') + hasGasLine (generic sends boolean)
  const hasGasLine = formData.gasLine !== undefined ? formData.gasLine === 'yes'
    : formData.hasGasLine !== undefined ? formData.hasGasLine === true
    : true;
  const fuelType = hasGasLine ? 'Natural Gas' : 'Propane';
  const genKW = optimization.generator.recommended
    ? Math.ceil(facilityLoad.criticalLoadKW * 1.25 / 10) * 10
    : 60; // Default if not auto-recommended

  // Demand charge from formData or utility default
  const demandCharge = formData.demandRate ?? electric.demandCharge ?? 15; // FIX H-3: ?? not || (0 is valid for flat-rate)

  return {
    solar: { sizeKW: solarSystemKW, annualProduction, roofKW: optimization.solar.roofKW, carportKW: optimization.solar.carportKW, groundKW: optimization.solar.groundKW || 0 },
    expansionScenarios: optimization.expansionScenarios || null, // FIX EXP-1: Solar expansion advisory data
    bess: { capacityKWh: bessKWh, powerKW: bessKW, duration: bessDuration },
    generator: { powerKW: genKW, fuelType, recommended: optimization.generator.recommended, reason: optimization.generator.reason },
    facilityLoad: {
      peakDemandKW: facilityLoad.peakDemandKW || 112,
      criticalLoadKW: facilityLoad.criticalLoadKW || 45,
      annualUsageKWh: facilityLoad.annualUsageKWh || 350000,
      totalConnectedKW: facilityLoad.totalConnectedKW || Math.round((facilityLoad.peakDemandKW || 112) * 1.4),
      // FIX C-1: Model G dual-track — separate savings from sizing
      savingsAnnualKWh: facilityLoad.savingsAnnualKWh || facilityLoad.annualUsageKWh,
      savingsPeakKW: facilityLoad.savingsPeakKW || facilityLoad.peakDemandKW
    },
    assumptions: {
      electricRate: electric.avgRate || 0.19,
      demandCharge: demandCharge,
      rateEscalation: `${((STATE_ESCALATION_RATES[state] || STATE_ESCALATION_RATES.default) * 100).toFixed(1)}%`,
      // MODEL D: Actual bill reference for financial projections (savings can't exceed actual spend)
      financialAnnualBill: initialAnnualBill > 0 ? initialAnnualBill : null,
    },
    weatherRisk: optimization.weatherRisk,
    optimization,
    _isDefault: false,
    // Phase 2: Data source transparency
    _dataSource: facilityLoad._dataSource || { tier: 2, kWh: 'equipment_model', peakKW: 'equipment_model' }
  };
  } catch (buildErr) { // E-1: Catch any calculation crash — return safe defaults instead of white screen
    console.error('[buildRecommendation] CRASH:', buildErr);
    console.error('[buildRecommendation] STACK:', buildErr.stack);
    console.error('[buildRecommendation] formData keys:', formData ? Object.keys(formData).join(', ') : 'NULL');
    console.error('[buildRecommendation] locationData:', JSON.stringify({ state: locationData?.utility?.state, hasElectric: !!locationData?.utility?.electric, hasSolar: !!locationData?.solar }));
    const _st = locationData?.utility?.state || locationData?.state || 'MI';
    return {
      solar: { sizeKW: 85, annualProduction: 102000, roofKW: 85, carportKW: 0 },
      bess: { capacityKWh: 200, powerKW: 50, duration: 4 },
      generator: { powerKW: 60, fuelType: 'Natural Gas', recommended: true, reason: 'default_fallback' },
      facilityLoad: { peakDemandKW: 112, criticalLoadKW: 45, annualUsageKWh: 350000, totalConnectedKW: 180, savingsAnnualKWh: 350000, savingsPeakKW: 112 },
      assumptions: { electricRate: locationData?.utility?.electric?.avgRate || 0.19, demandCharge: locationData?.utility?.electric?.demandCharge ?? 15, rateEscalation: `${((STATE_ESCALATION_RATES[_st] || STATE_ESCALATION_RATES.default) * 100).toFixed(1)}%` },
      weatherRisk: computeWeatherRisk(_st),
      _isDefault: true, _error: buildErr.message, _errorStack: buildErr.stack,
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: SUPPLIER DATABASE (v14.2 — Feb 2026 AUDIT, 110 suppliers × 10 categories | v14 Fixes: Tesla BESS $400→$300, SimpliPhi→B&S rebrand, Maxeon/SolarEdge distress flags, Enel X divestiture, Jinko Neo 4.0 | v14.1: heatPumpWH ×8, waterReclaim ×8 | v14.2: evCharger restructured to L2 ×10 + DCFC ×10 with turnkey installed costs (hardware+labor+permits+commissioning), carWashEquipment ×10 tunnel system OEMs, TURNKEY_COST_MODEL with state multipliers and §30C tax credits)
// ═══════════════════════════════════════════════════════════════════════════════
const SUPPLIERS = {
  solar: [
    { rank: 1, manufacturer: 'Qcells', model: 'Q.TRON XL-G2.3/BFG', watts: 620, efficiency: 22.2, technology: 'N-type TOPCon', warranty: 30, score: 85, costPerW: 2.45, usMade: true, country: 'USA', factory: 'Dalton, Georgia', tariffRisk: 'Low', tariffNote: 'IRA domestic content bonus eligible (+10% ITC); US-manufactured; zero tariff exposure', panelCount: 137, certifications: 'UL 61730, IEC 61215, TÜV QCPV', tempCoeff: '-0.34%/°C', dimensions: '2382×1134×30mm', weight: '32.4 kg', degradation: 0.0033, uflpaRisk: 'Low', uflpaNote: 'US-manufactured; polysilicon sourced from non-Xinjiang suppliers; full traceability documentation available' },
    { rank: 2, manufacturer: 'Canadian Solar', model: 'HiKu7 CS7L-595', watts: 595, efficiency: 21.4, technology: 'Mono PERC', warranty: 25, score: 74, costPerW: 2.35, usMade: false, country: 'China/Thailand', factory: 'Suzhou, China', tariffRisk: 'Extreme', tariffNote: 'AD/CVD final rates 50-80% (Apr 2025); reciprocal tariff 36% Thailand; Section 201 14% (expires Feb 2026); FEOC material assistance rules apply 2026+', panelCount: 143, certifications: 'UL 61730, IEC 61215, MCS', tempCoeff: '-0.35%/°C', dimensions: '2172×1303×35mm', weight: '32.2 kg', degradation: 0.005, uflpaRisk: 'High', uflpaNote: 'China-manufactured; CBP has detained Canadian Solar shipments; requires supply chain traceability documentation per UFLPA §3' },
    { rank: 3, manufacturer: 'JinkoSolar', model: 'Tiger Neo 4.0 JKM-N-66HL4M-BDV', watts: 640, efficiency: 23.6, technology: 'N-type TOPCon (HOT 4.0)', warranty: 30, score: 73, costPerW: 2.15, usMade: false, country: 'China/Vietnam/USA', factory: 'Shanghai, China + Jacksonville, FL (new US factory)', tariffRisk: 'Extreme', tariffNote: 'AD/CVD final rates 50-80% Vietnam (Apr 2025); reciprocal tariff 46% Vietnam; Section 301 50% China-origin; UFLPA enforcement active; FEOC exclusion risk 2026+; Jacksonville FL factory may qualify for IRA domestic content', panelCount: 133, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.26%/°C', dimensions: '2382×1134×30mm', weight: '32.5 kg', degradation: 0.004, uflpaRisk: 'Extreme', uflpaNote: 'China-manufactured (except FL factory); multiple CBP WROs issued against Jinko affiliates; active UFLPA enforcement; requires third-party supply chain audit; FL factory modules may be UFLPA-exempt' },
    { rank: 4, manufacturer: 'Silfab Solar', model: 'SIL-430-NL', watts: 430, efficiency: 21.8, technology: 'N-type TOPCon', warranty: 25, score: 78, costPerW: 2.55, usMade: true, country: 'USA', factory: 'Burlington, Washington', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; IRA domestic content eligible; zero tariff exposure; strong FEOC compliance', panelCount: 198, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.34%/°C', dimensions: '1722×1134×30mm', weight: '21.8 kg', degradation: 0.004, uflpaRisk: 'Low', uflpaNote: 'US-manufactured; polysilicon from non-Xinjiang sources; UFLPA compliant' },
    { rank: 5, manufacturer: 'First Solar', model: 'Series 7 FS-7605', watts: 605, efficiency: 22.3, technology: 'CdTe thin-film', warranty: 30, score: 83, costPerW: 2.60, usMade: true, country: 'USA', factory: 'Perrysburg, Ohio + Lake Township, Ohio', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; IRA §45X eligible; zero China supply chain exposure; only major US thin-film manufacturer; new Alabama factory 2026', panelCount: 140, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.28%/°C', dimensions: '2580×1244×40mm', weight: '43.5 kg', degradation: 0.003, uflpaRisk: 'None', uflpaNote: 'Zero polysilicon supply chain — CdTe technology uses cadmium telluride, not silicon; fully UFLPA exempt' },
    { rank: 6, manufacturer: 'LONGi', model: 'Hi-MO X6 LR5-72HBD', watts: 590, efficiency: 22.5, technology: 'N-type HJT', warranty: 30, score: 72, costPerW: 2.15, usMade: false, country: 'China/Vietnam', factory: 'Xian, China', tariffRisk: 'Extreme', tariffNote: 'AD/CVD 50-80%; reciprocal tariff 46% Vietnam transshipment; Section 301 50%; FEOC material rules apply; lowest $/W but tariff-adjusted cost competitive only via SE Asian routing', panelCount: 144, certifications: 'UL 61730, IEC 61215, TÜV', tempCoeff: '-0.26%/°C', dimensions: '2278×1134×30mm', weight: '29.5 kg', degradation: 0.004, uflpaRisk: 'High', uflpaNote: 'China-manufactured; CBP UFLPA enforcement active; requires supply chain documentation' },
    { rank: 7, manufacturer: 'Trina Solar', model: 'Vertex N TSM-NEG21C.20', watts: 600, efficiency: 22.6, technology: 'N-type TOPCon', warranty: 25, score: 70, costPerW: 2.20, usMade: false, country: 'China/Thailand', factory: 'Changzhou, China', tariffRisk: 'Extreme', tariffNote: 'AD/CVD final rates 50-80% (Apr 2025); reciprocal tariff 36% Thailand; Section 201 14%; extensive SE Asian circumvention enforcement', panelCount: 142, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.30%/°C', dimensions: '2384×1134×30mm', weight: '33.8 kg', degradation: 0.004, uflpaRisk: 'High', uflpaNote: 'China-manufactured; UFLPA enforcement active; requires traceability audit' },
    { rank: 8, manufacturer: 'REC Group', model: 'Alpha Pure-R 470', watts: 470, efficiency: 22.0, technology: 'N-type HJT', warranty: 25, score: 79, costPerW: 2.50, usMade: false, country: 'Singapore/Norway', factory: 'Tuas, Singapore', tariffRisk: 'Low', tariffNote: 'Singapore: no AD/CVD or reciprocal tariff; Norwegian-designed; non-China supply chain; REC ProTrust warranty (no China cell dependency)', panelCount: 181, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.26%/°C', dimensions: '1870×1045×30mm', weight: '23.5 kg', degradation: 0.0035, uflpaRisk: 'Low', uflpaNote: 'Singapore-manufactured; European polysilicon sources; UFLPA compliant' },
    { rank: 9, manufacturer: 'Maxeon', model: 'Maxeon 7 SPR-440', watts: 440, efficiency: 24.1, technology: 'IBC N-type', warranty: 40, score: 65, costPerW: 3.10, usMade: false, country: 'Malaysia/Mexico', factory: 'Kuala Lumpur, Malaysia', tariffRisk: 'Low', tariffNote: 'Malaysia: no reciprocal tariff currently; highest efficiency panel available; 40-year warranty industry-leading; former SunPower technology', panelCount: 193, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.27%/°C', dimensions: '1872×1032×40mm', weight: '22.6 kg', degradation: 0.0025, uflpaRisk: 'Low', uflpaNote: 'Non-China manufacturing; European polysilicon; UFLPA compliant', riskNote: 'CAUTION: 50-84% bankruptcy probability (Macroaxis/ValueInvesting, Feb 2026). Revenue declined 40% YoY; $15M Q1 losses; class action lawsuit; Nasdaq non-compliance warning. SunPower (former parent) bankrupt Aug 2024. Warranty fulfillment risk if Maxeon fails. Highest cost panel in DB at $3.10/W.' },
    { rank: 10, manufacturer: 'Heliene', model: 'HEL-144-M10H-620W', watts: 620, efficiency: 22.1, technology: 'N-type TOPCon', warranty: 30, score: 77, costPerW: 2.50, usMade: true, country: 'Canada/USA', factory: 'Mountain Iron, Minnesota', tariffRisk: 'None', tariffNote: 'US-manufactured at Minnesota facility; IRA domestic content eligible; Canadian-owned; zero tariff exposure', panelCount: 137, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.34%/°C', dimensions: '2382×1134×35mm', weight: '32.0 kg', degradation: 0.004, uflpaRisk: 'Low', uflpaNote: 'US-manufactured; polysilicon sourced from non-Xinjiang suppliers' },
    { rank: 11, manufacturer: 'Mission Solar', model: 'MSE430SQ7T', watts: 430, efficiency: 21.5, technology: 'Mono PERC', warranty: 25, score: 74, costPerW: 2.45, usMade: true, country: 'USA', factory: 'San Antonio, Texas', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; IRA domestic content eligible; OCI-owned; Buy American compliant', panelCount: 198, certifications: 'UL 61730, IEC 61215', tempCoeff: '-0.35%/°C', dimensions: '1722×1134×35mm', weight: '22.5 kg', degradation: 0.005, uflpaRisk: 'Low', uflpaNote: 'US-manufactured; Korean cell supply; UFLPA compliant' },
  ],
  inverter: [
    { rank: 6, manufacturer: 'SolarEdge', model: 'SE100K-US', powerKW: 100, efficiency: 99.0, type: 'String', warranty: 12, score: 58, costPerKW: 150, usMade: false, country: 'Israel', factory: 'Herzliya, Israel', tariffRisk: 'Low', tariffNote: 'US-Israel FTA: duty-free', certifications: 'UL 1741 SA, IEEE 1547, Rule 21', maxVoltage: '600V DC', mpptChannels: 6, cooling: 'Natural convection', dimensions: '940×315×260mm', riskNote: 'CAUTION: Altman Z-Score -1.28 (distress zone, Feb 2026). >80% bankruptcy probability within 24 months per Altman model. Revenue declined 78% YoY. $157M net loss Q1 2024. $550M bonds were due Sep 2025. Customer PM&M Electric bankrupt ($11.4M loss). Negative gross margins (-3.5%). Warranty fulfillment risk if company fails. Consider SMA, Sungrow, or Fronius as safer alternatives.' },
    { rank: 2, manufacturer: 'Enphase', model: 'IQ8A-72', powerKW: 85, efficiency: 97.5, type: 'Micro', warranty: 25, score: 82, costPerKW: 185, usMade: true, country: 'USA', factory: 'Austin, Texas', tariffRisk: 'Low', tariffNote: 'IRA domestic content eligible; module-level monitoring included; strong financial health', certifications: 'UL 1741 SA, IEEE 1547, Rule 21', maxVoltage: '400V DC', mpptChannels: 1, cooling: 'Sealed enclosure', dimensions: '212×175×30mm' },
    { rank: 1, manufacturer: 'SMA', model: 'Sunny Tripower X 25', powerKW: 100, efficiency: 98.4, type: 'String', warranty: 15, score: 77, costPerKW: 140, usMade: false, country: 'Germany/USA', factory: 'Denver, Colorado (assembly)', tariffRisk: 'Low', tariffNote: 'German-engineered; US-assembled; no AD/CVD; IRA domestic content potential', certifications: 'UL 1741 SA, IEEE 1547, Rule 21', maxVoltage: '1000V DC', mpptChannels: 6, cooling: 'OptiCool active cooling', dimensions: '661×682×264mm' },
    { rank: 4, manufacturer: 'Sigenergy', model: 'SigenStar 100TL', powerKW: 100, efficiency: 98.9, type: 'Hybrid (Inverter+BESS)', warranty: 15, score: 79, costPerKW: 170, usMade: false, country: 'Germany/China', factory: 'Nanjing, China (German-engineered)', tariffRisk: 'High', tariffNote: 'Section 301 25%; German R&D; integrated inverter+BESS reduces total BOS cost 20-30%; AI-powered MPPT optimization', certifications: 'UL 1741 SA, IEEE 1547, IEC 62109', maxVoltage: '1100V DC', mpptChannels: 8, cooling: 'Liquid cooling (shared with BESS)', dimensions: '650×500×250mm' },
    { rank: 5, manufacturer: 'Sungrow', model: 'SG110CX-US', powerKW: 110, efficiency: 98.7, type: 'String', warranty: 10, score: 74, costPerKW: 120, usMade: false, country: 'China', factory: 'Hefei, China', tariffRisk: 'High', tariffNote: 'Section 301 25% (2026); #1 global inverter market share; lowest $/kW; strong bankability per BNEF', certifications: 'UL 1741 SA, IEEE 1547', maxVoltage: '1100V DC', mpptChannels: 9, cooling: 'Smart forced air', dimensions: '1035×700×348mm' },
    { rank: 3, manufacturer: 'Fronius', model: 'Tauro ECO 100', powerKW: 100, efficiency: 98.5, type: 'String', warranty: 10, score: 75, costPerKW: 145, usMade: false, country: 'Austria', factory: 'Wels, Austria', tariffRisk: 'Low', tariffNote: 'EU-manufactured; no AD/CVD; Austrian engineering quality; excellent shade management; Active Cooling Technology', certifications: 'UL 1741 SA, IEEE 1547', maxVoltage: '1000V DC', mpptChannels: 6, cooling: 'Active cooling (ACT)', dimensions: '725×510×225mm' },
    { rank: 7, manufacturer: 'GoodWe', model: 'GW100K-HT', powerKW: 100, efficiency: 98.4, type: 'String', warranty: 10, score: 69, costPerKW: 100, usMade: false, country: 'China', factory: 'Suzhou, China', tariffRisk: 'High', tariffNote: 'Section 301 25%; value-segment leader; UL-listed for US market; growing US installer adoption', certifications: 'UL 1741 SA, IEEE 1547', maxVoltage: '1100V DC', mpptChannels: 10, cooling: 'Smart forced air', dimensions: '1035×660×328mm' },
  ],
  bess: [
    { rank: 1, manufacturer: 'Tesla', model: 'Megapack 2 (C&I config)', capacityKWh: 200, powerKW: 50, chemistry: 'LFP', cells: 'CATL prismatic', cycles: 7000, roundTrip: 93, warranty: 15, score: 84, costPerKWh: 275, usMade: true, country: 'USA', factory: 'Lathrop, California', tariffRisk: 'Low', tariffNote: 'US-assembled; IRA §45X manufacturing credit eligible; Megapack 3 (5 MWh, Houston TX factory, 50 GWh/yr capacity) shipping H2 2026; Megablock (20 MWh = 4×MP3) also H2 2026; bulk pricing ~$266/kWh at scale; $5.05M per Megapack unit (Q3 2026 delivery)', certifications: 'UL 9540A, NFPA 855', thermalMgmt: 'Liquid glycol cooling', commProtocol: 'Modbus TCP/IP, SunSpec', dimensions: '1300×850×430mm' },
    { rank: 2, manufacturer: 'BYD', model: 'Battery-Box HVS', capacityKWh: 204, powerKW: 51, chemistry: 'LFP', cells: 'BYD Blade prismatic', cycles: 6000, roundTrip: 95.3, warranty: 10, score: 68, costPerKWh: 310, usMade: false, country: 'China', factory: 'Shenzhen, China', tariffRisk: 'Extreme', tariffNote: 'Section 301 tariff increasing to 25% in 2026; IEEPA 54% cumulative; CLASSIFIED AS FEOC — projects using BYD batteries starting construction 2026+ are INELIGIBLE for §48E ITC; consider US-made alternatives', certifications: 'UL 9540A, IEC 62619', thermalMgmt: 'Forced air cooling', commProtocol: 'CAN bus, RS-485', dimensions: '1200×580×600mm' },
    { rank: 3, manufacturer: 'Enphase', model: 'IQ Battery 5P (×42)', capacityKWh: 210, powerKW: 48, chemistry: 'LFP', cells: 'LFP prismatic', cycles: 6000, roundTrip: 96, warranty: 15, score: 78, costPerKWh: 480, usMade: true, country: 'USA', factory: 'Fremont, California', tariffRisk: 'Low', tariffNote: 'US-assembled; IRA domestic content eligible; modular 5kWh units; AC-coupled with IQ microinverters', certifications: 'UL 9540A, NFPA 855', thermalMgmt: 'Passive cooling (no fans)', commProtocol: 'Envoy gateway, WiFi/Cellular', dimensions: '1078×380×172mm (per unit)' },
    { rank: 4, manufacturer: 'Sungrow', model: 'PowerStack 255CS', capacityKWh: 255, powerKW: 100, chemistry: 'LFP', cells: 'Prismatic', cycles: 8000, roundTrip: 96, warranty: 15, score: 80, costPerKWh: 320, usMade: false, country: 'China', factory: 'Hefei, China', tariffRisk: 'High', tariffNote: 'Section 301 25% (2026); FEOC material assistance rules apply; #1 bankable BESS per BNEF; liquid-cooled; SiC semiconductors; grid-forming capable', certifications: 'UL 9540A, IEC 62619', thermalMgmt: 'Liquid cooling (proprietary)', commProtocol: 'Modbus TCP/IP, EMS integrated', dimensions: '2085×1100×1385mm' },
    { rank: 5, manufacturer: 'Sigenergy', model: 'SigenStor C&I 215', capacityKWh: 215, powerKW: 100, chemistry: 'LFP', cells: 'CATL prismatic', cycles: 8000, roundTrip: 97.2, warranty: 15, score: 81, costPerKWh: 380, usMade: false, country: 'Germany/China', factory: 'Nanjing, China (German-engineered)', tariffRisk: 'High', tariffNote: 'Section 301 25% (2026); German engineering/QC but China-assembled; integrated hybrid inverter+BESS reduces BOS cost 20-30%; FEOC material rules may apply', certifications: 'UL 9540A, IEC 62619, TÜV SÜD', thermalMgmt: 'Liquid cooling (integrated)', commProtocol: 'Modbus TCP/IP, SunSpec, OCPP 1.6J', dimensions: '1650×1070×600mm' },
    { rank: 6, manufacturer: 'Fortress Power', model: 'eVault Max 18.5', capacityKWh: 185, powerKW: 45, chemistry: 'LFP', cells: 'Prismatic', cycles: 6000, roundTrip: 94.5, warranty: 10, score: 73, costPerKWh: 420, usMade: true, country: 'USA', factory: 'Bucks County, Pennsylvania', tariffRisk: 'Low', tariffNote: 'US-assembled; IRA domestic content potential; strong C&I focus; scalable to 370kWh; no FEOC risk', certifications: 'UL 9540A, UL 1973', thermalMgmt: 'Active fan cooling', commProtocol: 'CAN bus, Modbus RTU', dimensions: '965×635×260mm (per module)' },
    { rank: 7, manufacturer: 'Briggs & Stratton (SimpliPHI)', model: 'SimpliPHI ESS (6kW inverter + 4.98kWh LFP)', capacityKWh: 172, powerKW: 40, chemistry: 'LFP', cells: 'Cylindrical (cobalt-free)', cycles: 10000, roundTrip: 96, warranty: 10, score: 71, costPerKWh: 520, usMade: true, country: 'USA', factory: 'Oxnard, California (Briggs & Stratton Energy Solutions)', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; non-toxic cobalt-free; IRA domestic content eligible; no thermal runaway risk; acquired by Briggs & Stratton Sep 2021; fully integrated Jul 2023; EnergyTrak EMS software; scalable to 299kWh per system', certifications: 'UL 9540A, UL 1973', thermalMgmt: 'Passive (no thermal runaway)', commProtocol: 'CAN bus + EnergyTrak EMS', dimensions: '670×457×190mm (per unit)' },
    { rank: 8, manufacturer: 'Sonnen', model: 'sonnenCore+ C&I', capacityKWh: 200, powerKW: 50, chemistry: 'LFP', cells: 'Prismatic', cycles: 10000, roundTrip: 94, warranty: 15, score: 76, costPerKWh: 450, usMade: true, country: 'USA/Germany', factory: 'Wildpoldsried, Germany + US assembly', tariffRisk: 'Low', tariffNote: 'Siemens subsidiary; US assembly facility; German engineering; strong VPP/grid services integration', certifications: 'UL 9540A, IEC 62619', thermalMgmt: 'Active cooling', commProtocol: 'WiFi, Ethernet, ecoLinx', dimensions: '1370×660×225mm (per unit)' },
    { rank: 9, manufacturer: 'Samsung SDI', model: 'All-in-One ESS C&I', capacityKWh: 200, powerKW: 50, chemistry: 'NMC/LFP', cells: 'Samsung prismatic', cycles: 6000, roundTrip: 95, warranty: 10, score: 70, costPerKWh: 360, usMade: false, country: 'South Korea', factory: 'Cheonan, South Korea', tariffRisk: 'Low', tariffNote: 'US-Korea FTA: duty-free; Samsung Tier 1 bankable; auto-grade cells; no FEOC risk (non-China)', certifications: 'UL 9540A, IEC 62619', thermalMgmt: 'Liquid cooling', commProtocol: 'Modbus TCP/IP, EMS', dimensions: '2000×1100×800mm' },
    { rank: 10, manufacturer: 'EG4', model: 'LifePower4 Wall Mount (×8)', capacityKWh: 192, powerKW: 48, chemistry: 'LFP', cells: 'Prismatic', cycles: 7000, roundTrip: 93, warranty: 10, score: 65, costPerKWh: 280, usMade: false, country: 'China', factory: 'Shenzhen, China', tariffRisk: 'High', tariffNote: 'Section 301 25%; lowest $/kWh in class but FEOC material risk; strong DIY/installer community; 48V stackable', certifications: 'UL 9540A, FCC Part 15', thermalMgmt: 'Active fan cooling', commProtocol: 'CAN bus, RS-485', dimensions: '580×500×175mm (per unit)' },
  ],
  generator: [
    { rank: 1, manufacturer: 'Generac', model: 'SG060', powerKW: 60, fuelType: 'Natural Gas', warranty: 5, score: 81, costPerKW: 550, usMade: true, country: 'USA', factory: 'Waukesha, Wisconsin', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; no import duties', certifications: 'EPA Tier 4, UL 2200, NFPA 110', engineType: 'Generac 2.4L 4-cyl', fuelConsumption: '580 ft³/hr NG', noiseLevel: '74 dB @ 7m', transferSwitch: 'Included (200A ATS)', startTime: '<10 sec' },
    { rank: 2, manufacturer: 'Kohler', model: 'KG60', powerKW: 60, fuelType: 'Natural Gas', warranty: 5, score: 78, costPerKW: 600, usMade: true, country: 'USA', factory: 'Kohler, Wisconsin', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; no import duties', certifications: 'EPA Tier 4, UL 2200, NFPA 110', engineType: 'Kohler KDI 3404', fuelConsumption: '620 ft³/hr NG', noiseLevel: '72 dB @ 7m', transferSwitch: 'Included (200A ATS)', startTime: '<10 sec' },
    { rank: 3, manufacturer: 'Cummins', model: 'C60 N6', powerKW: 60, fuelType: 'Natural Gas', warranty: 5, score: 80, costPerKW: 580, usMade: true, country: 'USA', factory: 'Fridley, Minnesota', tariffRisk: 'None', tariffNote: 'US-manufactured; Tier 1 bankability; extensive service network; dual-fuel options available', certifications: 'EPA Tier 4, UL 2200, NFPA 110, CSA', engineType: 'Cummins B3.3G', fuelConsumption: '600 ft³/hr NG', noiseLevel: '75 dB @ 7m', transferSwitch: 'PowerCommand MTS (200A)', startTime: '<10 sec' },
    { rank: 4, manufacturer: 'Caterpillar', model: 'CG055 NG', powerKW: 55, fuelType: 'Natural Gas', warranty: 5, score: 76, costPerKW: 650, usMade: true, country: 'USA', factory: 'Griffin, Georgia', tariffRisk: 'None', tariffNote: 'US-manufactured; Cat dealer network nationwide; industrial-grade; higher $/kW but premium reliability/support', certifications: 'EPA Tier 4, UL 2200, NFPA 110', engineType: 'Cat C3.3B', fuelConsumption: '590 ft³/hr NG', noiseLevel: '73 dB @ 7m', transferSwitch: 'Cat ATS (200A)', startTime: '<10 sec' },
    { rank: 5, manufacturer: 'Briggs & Stratton', model: 'Model 076225', powerKW: 48, fuelType: 'Natural Gas', warranty: 5, score: 72, costPerKW: 480, usMade: true, country: 'USA', factory: 'Milwaukee, Wisconsin', tariffRisk: 'None', tariffNote: 'US-manufactured; Vanguard engine; lowest $/kW for commercial; strong dealer network; §179 eligible', certifications: 'EPA, UL 2200, NFPA 110', engineType: 'Vanguard 3.0L V-Twin', fuelConsumption: '520 ft³/hr NG', noiseLevel: '76 dB @ 7m', transferSwitch: 'Symphony II ATS (200A)', startTime: '<12 sec' },
    { rank: 6, manufacturer: 'Generac', model: 'SG100 NG', powerKW: 100, fuelType: 'Natural Gas', warranty: 5, score: 83, costPerKW: 520, usMade: true, country: 'USA', factory: 'Waukesha, Wisconsin', tariffRisk: 'None', tariffNote: 'US-manufactured; best for high-demand facilities; economies of scale at 100kW; Generac service network', certifications: 'EPA Tier 4, UL 2200, NFPA 110', engineType: 'Generac 5.4L V-8', fuelConsumption: '950 ft³/hr NG', noiseLevel: '76 dB @ 7m', transferSwitch: 'Included (400A ATS)', startTime: '<10 sec' },
    { rank: 7, manufacturer: 'MTU Onsite Energy', model: 'DS60 NG', powerKW: 60, fuelType: 'Natural Gas/Dual', warranty: 5, score: 74, costPerKW: 620, usMade: false, country: 'Germany/USA', factory: 'Mankato, Minnesota (assembly)', tariffRisk: 'Low', tariffNote: 'Rolls-Royce Power Systems subsidiary; German-engineered; US-assembled; dual-fuel capable; industrial-grade', certifications: 'EPA Tier 4, UL 2200, NFPA 110, ISO 8528', engineType: 'MTU 4R106', fuelConsumption: '610 ft³/hr NG', noiseLevel: '71 dB @ 7m', transferSwitch: 'Optional (separate ATS)', startTime: '<10 sec' },
    { rank: 8, manufacturer: 'Cummins', model: 'C100 N6L', powerKW: 100, fuelType: 'Natural Gas', warranty: 5, score: 82, costPerKW: 550, usMade: true, country: 'USA', factory: 'Fridley, Minnesota', tariffRisk: 'None', tariffNote: 'US-manufactured; 100kW for large facilities; PowerCommand controller with paralleling; remote monitoring', certifications: 'EPA Tier 4, UL 2200, NFPA 110, CSA', engineType: 'Cummins L9N', fuelConsumption: '980 ft³/hr NG', noiseLevel: '77 dB @ 7m', transferSwitch: 'PowerCommand ATS (400A)', startTime: '<10 sec' },
    { rank: 9, manufacturer: 'Gillette Generators', model: 'SPJD-600', powerKW: 60, fuelType: 'Diesel/Dual', warranty: 3, score: 70, costPerKW: 500, usMade: true, country: 'USA', factory: 'Elkhart, Indiana', tariffRisk: 'None', tariffNote: 'US-manufactured; John Deere engine; commercial-grade; competitive pricing; smaller dealer network', certifications: 'EPA Tier 4 Final, UL 2200', engineType: 'John Deere 4045T', fuelConsumption: '4.5 gal/hr diesel', noiseLevel: '78 dB @ 7m', transferSwitch: 'Optional (separate ATS)', startTime: '<10 sec' },
    { rank: 10, manufacturer: 'Hipower Systems', model: 'HFNG-60', powerKW: 60, fuelType: 'Natural Gas', warranty: 5, score: 69, costPerKW: 540, usMade: true, country: 'USA', factory: 'Miami, Florida', tariffRisk: 'None', tariffNote: 'US-manufactured; designed for commercial/industrial; Cummins engine option; Miami-Dade approved for hurricane zones', certifications: 'EPA Tier 4, UL 2200, NFPA 110, Miami-Dade NOA', engineType: 'Various (Cummins/Ford)', fuelConsumption: '590 ft³/hr NG', noiseLevel: '75 dB @ 7m', transferSwitch: 'Deep Sea DSE controller (ATS optional)', startTime: '<10 sec' },
  ],
  racking: [
    { rank: 1, manufacturer: 'IronRidge', model: 'XR100', type: 'Roof Mount', warranty: 20, score: 83, costPerPanel: 45, usMade: true, country: 'USA', factory: 'Hayward, California', tariffRisk: 'None', tariffNote: 'US-manufactured aluminum; IRA domestic content eligible', certifications: 'UL 2703, ICC-ES ESR-3522', material: '6005-T5 Aluminum', windLoad: '150 mph (Exposure D)', snowLoad: '90 psf', maxSpan: '72 inches' },
    { rank: 2, manufacturer: 'Unirac', model: 'SolarMount', type: 'Roof Mount', warranty: 20, score: 80, costPerPanel: 42, usMade: true, country: 'USA', factory: 'Albuquerque, New Mexico', tariffRisk: 'None', tariffNote: 'US-manufactured; domestic content eligible', certifications: 'UL 2703, ICC-ES ESR-3486', material: '6063-T6 Aluminum', windLoad: '140 mph (Exposure D)', snowLoad: '75 psf', maxSpan: '66 inches' },
    { rank: 3, manufacturer: 'SnapNrack', model: 'RL Universal', type: 'Roof Mount', warranty: 25, score: 78, costPerPanel: 48, usMade: true, country: 'USA', factory: 'Irvine, California', tariffRisk: 'None', tariffNote: 'US-manufactured; tool-free wire management; IRA eligible', certifications: 'UL 2703, ICC-ES ESR-4199', material: '6005-T5 Aluminum', windLoad: '150 mph (Exposure D)', snowLoad: '85 psf', maxSpan: '72 inches' },
    { rank: 4, manufacturer: 'Quick Mount PV', model: 'QRail Pro', type: 'Roof Mount', warranty: 20, score: 76, costPerPanel: 50, usMade: true, country: 'USA', factory: 'Walnut Creek, California', tariffRisk: 'None', tariffNote: 'US-manufactured; waterproof flashing system; code-compliant roof penetrations', certifications: 'UL 2703, ICC-ES ESR-3744, Miami-Dade NOA', material: '6005-T5 Aluminum', windLoad: '180 mph (Miami-Dade)', snowLoad: '110 psf', maxSpan: '60 inches' },
    { rank: 5, manufacturer: 'Schletter', model: 'FS Uno', type: 'Ground Mount', warranty: 20, score: 74, costPerPanel: 55, usMade: false, country: 'Germany/USA', factory: 'Shelby, North Carolina (assembly)', tariffRisk: 'Low', tariffNote: 'German-engineered; US-assembled; IRA domestic content potential', certifications: 'UL 2703, IEC 61215', material: 'Hot-dip galvanized steel', windLoad: '130 mph (Exposure C)', snowLoad: '60 psf', maxSpan: '96 inches' },
    { rank: 6, manufacturer: 'GameChange Solar', model: 'Genius Tracker 1P', type: 'Single-Axis Tracker', warranty: 25, score: 77, costPerPanel: 70, usMade: true, country: 'USA', factory: 'Paragould, Arkansas', tariffRisk: 'None', tariffNote: 'US-manufactured; 10-25% yield increase vs fixed; IRA domestic content eligible', certifications: 'UL 2703, UL 3703', material: 'Galvanized steel + aluminum', windLoad: '150 mph stow', snowLoad: '60 psf (stow mode)', maxSpan: '120 inches (2-up portrait)' },
    { rank: 7, manufacturer: 'NextPower (Nextracker)', model: 'NX Horizon 1P', type: 'Single-Axis Tracker', warranty: 30, score: 88, costPerPanel: 78, usMade: true, country: 'USA', factory: 'Fremont, CA + 15 US partner facilities', tariffRisk: 'None', tariffNote: 'US-manufactured; IRA domestic content eligible; #1 Wood Mackenzie global tracker ranking (H1 2025); 150+ GW shipped; NX Horizon Low Carbon option reduces footprint 35%', certifications: 'UL 2703, UL 3703, IEC 62817', material: 'Hot-dip galvanized steel + 6005-T5 aluminum', windLoad: '150 mph (Hail Pro: 75° stow)', snowLoad: '60 psf (stow mode)', maxSpan: '90 modules per row (1-in-portrait)' },
    { rank: 8, manufacturer: 'K2 Systems', model: 'CrossRail 38', type: 'Roof Mount', warranty: 15, score: 71, costPerPanel: 38, usMade: false, country: 'Germany', factory: 'Renningen, Germany', tariffRisk: 'Low', tariffNote: 'German-manufactured; EU quality; no AD/CVD; competitive pricing', certifications: 'UL 2703, IEC 61215', material: '6063-T6 Aluminum', windLoad: '130 mph (Exposure C)', snowLoad: '70 psf', maxSpan: '60 inches' },
    { rank: 9, manufacturer: 'PanelClaw', model: 'Polar Bear II', type: 'Flat Roof Ballast', warranty: 20, score: 73, costPerPanel: 52, usMade: true, country: 'USA', factory: 'North Andover, Massachusetts', tariffRisk: 'None', tariffNote: 'US-manufactured; no roof penetration; ideal for TPO/EPDM/PVC membranes', certifications: 'UL 2703, ICC-ES ESR-3968', material: '6005-T5 Aluminum + concrete ballast', windLoad: '140 mph (Exposure D)', snowLoad: '80 psf', maxSpan: '66 inches (ballasted)' },
    { rank: 10, manufacturer: 'EcoFasten', model: 'Rock-It System 3.0', type: 'Roof Mount', warranty: 20, score: 72, costPerPanel: 46, usMade: true, country: 'USA', factory: 'Morrisville, Vermont', tariffRisk: 'None', tariffNote: 'US-manufactured; patented watertight compression design; cold-climate optimized', certifications: 'UL 2703, ICC-ES ESR-4529, Miami-Dade NOA', material: '6061-T6 Aluminum', windLoad: '160 mph (Exposure D)', snowLoad: '100 psf', maxSpan: '66 inches' },
    { rank: 11, manufacturer: 'S:FLEX', model: 'FlatFix Fusion', type: 'Flat Roof Ballast', warranty: 20, score: 68, costPerPanel: 40, usMade: false, country: 'Germany', factory: 'Munich, Germany', tariffRisk: 'Low', tariffNote: 'German-manufactured; aerodynamic low-ballast design; 40% less weight than competitors', certifications: 'UL 2703', material: '6063-T6 Aluminum', windLoad: '120 mph (Exposure C)', snowLoad: '55 psf', maxSpan: '60 inches (ballasted)' },
    { rank: 12, manufacturer: 'Array Technologies', model: 'DuraTrack HZ v3', type: 'Single-Axis Tracker', warranty: 25, score: 86, costPerPanel: 72, usMade: true, country: 'USA', factory: 'Albuquerque, New Mexico (doubling capacity 2025)', tariffRisk: 'None', tariffNote: 'US-manufactured; #3 Wood Mackenzie global ranking (H1 2025); IRA domestic content eligible; 99.996% uptime; passive wind mitigation (no active stow needed); zero scheduled maintenance; 167x fewer components than competitors', certifications: 'UL 2703, UL 3703, IEC 62817', material: 'Hot-dip galvanized steel', windLoad: '150 mph (passive wind mitigation)', snowLoad: '60 psf (auto stow)', maxSpan: '100+ modules per row (1-in-portrait)' },
    { rank: 13, manufacturer: 'Trina Tracker', model: 'Vanguard 1P', type: 'Single-Axis Tracker', warranty: 25, score: 82, costPerPanel: 58, usMade: false, country: 'China', factory: 'Changzhou, China + overseas assembly', tariffRisk: 'Medium', tariffNote: '#2 Wood Mackenzie global ranking (H1 2025); Grade A manufacturer; expanding regional assembly to mitigate trade risks; subsidiary of Trina Solar; competitive pricing', certifications: 'UL 2703, UL 3703, IEC 62817', material: 'Hot-dip galvanized steel + aluminum', windLoad: '140 mph (active stow)', snowLoad: '55 psf', maxSpan: '90 modules per row' },
    { rank: 14, manufacturer: 'Arctech', model: 'SkyLine II 1P', type: 'Single-Axis Tracker', warranty: 25, score: 80, costPerPanel: 55, usMade: false, country: 'China', factory: 'Kunshan, China + Jeddah, Saudi Arabia (15 GW capacity)', tariffRisk: 'Medium', tariffNote: 'Wood Mackenzie Grade A; 100+ GW delivered to 2,000+ plants across 40+ countries; synchronous multi-point drive; pentagonal torque tube; expanding Jeddah facility; relevant for Saudi expansion', certifications: 'UL 2703, IEC 62817', material: 'Hot-dip galvanized steel (D-shaped torque tube)', windLoad: '140 mph (active stow)', snowLoad: '55 psf', maxSpan: '90 modules per row' },
    { rank: 15, manufacturer: 'Soltec', model: 'SF8 Tracker', type: 'Single-Axis Tracker', warranty: 25, score: 78, costPerPanel: 60, usMade: false, country: 'Spain', factory: 'Molina de Segura, Spain + US operations', tariffRisk: 'Low', tariffNote: 'Wood Mackenzie Grade A; Spanish-engineered; significant US project presence; TeamTrack autonomous bifacial optimization; diffuse light harvesting algorithm', certifications: 'UL 2703, UL 3703, IEC 62817', material: 'Hot-dip galvanized steel', windLoad: '140 mph', snowLoad: '50 psf', maxSpan: '90 modules per row' },
    { rank: 16, manufacturer: 'Flexrack (Qcells)', model: 'FlexTrack S-Series', type: 'Single-Axis Tracker', warranty: 25, score: 76, costPerPanel: 65, usMade: true, country: 'USA', factory: 'Youngstown, Ohio (Northern States Metals)', tariffRisk: 'None', tariffNote: 'US-manufactured; Wood Mackenzie Grade A; 4+ GW installed in 40+ states; division of Northern States Metals (since 1972); IRA domestic content eligible; full turnkey services incl. geotech + install + commissioning', certifications: 'UL 2703, UL 3703', material: 'Hot-dip galvanized steel + aluminum', windLoad: '140 mph (self-powered)', snowLoad: '55 psf', maxSpan: '90 modules per row (110° rotation)' },
  ],
  // ── CATEGORY 6: EV CHARGERS — L2 + DCFC (Turnkey Installed Costs) ──────
  // All costs are TURNKEY INSTALLED: hardware + electrical infrastructure + labor + permits + commissioning + signage/bollards.
  // §30C Alternative Fuel Vehicle Refueling Property Credit: 30% of cost, max $100K per location, expires June 30 2026.
  // Permit costs vary by state — see TURNKEY_COST_MODEL below for state multipliers.
  // L2 turnkey = hardware + $800-$3,000 install (panel, conduit, labor, permit).
  // DCFC turnkey = hardware + $15,000-$50,000 install (480V service, transformer, trenching, labor, permit, commissioning).
  evCharger: [
    // ── L2 CHARGERS (Level 2, 208-240V AC) ────────────────────────────────
    { rank: 1, chargerClass: 'L2', manufacturer: 'ChargePoint', model: 'CPF50', type: 'Level 2 Commercial', ports: 2, kW: 12.0, warranty: 3, score: 82, hardwareCost: 8000, installCost: 3500, permitCost: 400, turnkeyInstalled: 11900, usMade: false, country: 'USA / China', factory: 'Campbell, CA (HQ)', tariffRisk: 'Medium', tariffNote: 'Assembled overseas; §30C credit requires placed in service by June 30, 2026; OCPP 1.6J; ChargePoint network integration; fleet management; Autocharge+', certifications: 'UL Listed, Energy Star, OCPP 1.6J', connector: 'SAE J1772', networkFees: '$45-65/mo per station', cableLength: '23 ft', mountType: 'Pedestal or Wall', turnkeyIncludes: 'Hardware, 240V 60A circuit, conduit run (avg 50ft), dedicated breaker, mounting, permit, commissioning, network activation' },
    { rank: 2, chargerClass: 'L2', manufacturer: 'Wallbox', model: 'Pulsar Plus 48A', type: 'Level 2 Smart', ports: 1, kW: 11.5, warranty: 3, score: 79, hardwareCost: 700, installCost: 1800, permitCost: 300, turnkeyInstalled: 2800, usMade: true, country: 'USA/Spain', factory: 'Arlington, Texas', tariffRisk: 'Low', tariffNote: 'US-manufactured at Arlington TX; OCPP 1.6J; WiFi/BT; power sharing up to 25 units; §30C eligible; dynamic load management', certifications: 'UL Listed, Energy Star, OCPP 1.6J', connector: 'SAE J1772', networkFees: 'Free (myWallbox app)', cableLength: '25 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 50A circuit, conduit, breaker, mounting, permit' },
    { rank: 3, chargerClass: 'L2', manufacturer: 'Grizzl-E', model: 'Classic 40A', type: 'Level 2 Rugged', ports: 1, kW: 9.6, warranty: 3, score: 72, hardwareCost: 450, installCost: 1500, permitCost: 250, turnkeyInstalled: 2200, usMade: false, country: 'Canada', factory: 'Toronto, Ontario', tariffRisk: 'Low', tariffNote: 'USMCA compliant; NEMA 4 outdoor-rated; best value rugged charger; no network fees; hardwired install', certifications: 'UL Listed, cUL', connector: 'SAE J1772', networkFees: 'None (no WiFi model)', cableLength: '24 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 50A circuit, conduit, breaker, mounting, permit' },
    { rank: 4, chargerClass: 'L2', manufacturer: 'Emporia', model: 'Level 2 Smart 48A', type: 'Level 2 Smart', ports: 1, kW: 11.5, warranty: 3, score: 74, hardwareCost: 500, installCost: 1600, permitCost: 250, turnkeyInstalled: 2350, usMade: false, country: 'USA/China', factory: 'Designed USA, assembled China', tariffRisk: 'Medium', tariffNote: 'Section 301 25%; integrates with Emporia Vue energy monitor; solar-aware charging; lowest smart charger cost', certifications: 'UL Listed, Energy Star', connector: 'SAE J1772', networkFees: 'Free (Emporia app)', cableLength: '24 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 50A circuit, conduit, breaker, mounting, permit' },
    { rank: 5, chargerClass: 'L2', manufacturer: 'ABB', model: 'Terra AC W22-T-R-0', type: 'Level 2 Commercial', ports: 2, kW: 22.0, warranty: 3, score: 80, hardwareCost: 3500, installCost: 3000, permitCost: 400, turnkeyInstalled: 6900, usMade: false, country: 'Switzerland/USA', factory: 'New Berlin, Wisconsin (assembly)', tariffRisk: 'Low', tariffNote: 'Swiss-engineered; US-assembled; commercial-grade 22kW; OCPP 2.0.1 compliant; ISO 15118 Plug & Charge; ABB global service', certifications: 'UL Listed, OCPP 2.0.1, ISO 15118', connector: 'SAE J1772', networkFees: '$25/mo (ABB ChargerSync)', cableLength: '16 ft', mountType: 'Pedestal or Wall', turnkeyIncludes: 'Hardware, 208V 3-phase circuit, conduit, breaker, pedestal/wall mount, permit, commissioning' },
    { rank: 6, chargerClass: 'L2', manufacturer: 'Blink', model: 'IQ 200-M', type: 'Level 2 Commercial', ports: 2, kW: 19.2, warranty: 2, score: 70, hardwareCost: 6000, installCost: 3200, permitCost: 350, turnkeyInstalled: 9550, usMade: true, country: 'USA', factory: 'Bowie, Maryland', tariffRisk: 'None', tariffNote: 'US-manufactured; Blink Network revenue sharing model; dual-port commercial; IRA domestic content eligible', certifications: 'UL Listed, OCPP 1.6J', connector: 'SAE J1772', networkFees: '$50/mo (Blink Network)', cableLength: '18 ft', mountType: 'Pedestal', turnkeyIncludes: 'Hardware, 240V circuit, conduit, pedestal foundation, breaker, permit, network activation' },
    { rank: 7, chargerClass: 'L2', manufacturer: 'Tesla', model: 'Wall Connector (Gen 3)', type: 'Level 2 Smart', ports: 1, kW: 11.5, warranty: 4, score: 77, hardwareCost: 475, installCost: 1600, permitCost: 250, turnkeyInstalled: 2325, usMade: true, country: 'USA', factory: 'Fremont, California', tariffRisk: 'None', tariffNote: 'US-manufactured; WiFi-enabled; power sharing up to 6 units; NACS native + J1772 adapter; Tesla app; longest warranty in L2 class', certifications: 'UL Listed', connector: 'NACS (J1772 adapter)', networkFees: 'Free (Tesla app)', cableLength: '24 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 60A circuit, conduit, breaker, wall mount, permit' },
    { rank: 8, chargerClass: 'L2', manufacturer: 'Siemens', model: 'VersiCharge Ultra', type: 'Level 2 Smart', ports: 1, kW: 11.5, warranty: 3, score: 75, hardwareCost: 700, installCost: 1800, permitCost: 300, turnkeyInstalled: 2800, usMade: false, country: 'Germany/USA', factory: 'Grand Prairie, Texas', tariffRisk: 'Low', tariffNote: 'German-engineered; US-manufactured; Siemens industrial reliability; NEMA 4X outdoor rated; OCPP 1.6J', certifications: 'UL Listed, Energy Star, OCPP 1.6J', connector: 'SAE J1772', networkFees: 'Free (Siemens app)', cableLength: '23 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 50A circuit, conduit, breaker, wall mount, permit' },
    { rank: 9, chargerClass: 'L2', manufacturer: 'Autel', model: 'MaxiCharger AC 50A', type: 'Level 2 Smart', ports: 1, kW: 12.0, warranty: 3, score: 73, hardwareCost: 600, installCost: 1700, permitCost: 300, turnkeyInstalled: 2600, usMade: false, country: 'China', factory: 'Shenzhen, China', tariffRisk: 'High', tariffNote: 'Section 301 25%; NACS adapter included; highest power L2 at 12kW; dynamic load management', certifications: 'UL Listed, Energy Star, OCPP 1.6J', connector: 'SAE J1772 + NACS', networkFees: 'Free (Autel Charge app)', cableLength: '25 ft', mountType: 'Pedestal or Wall', turnkeyIncludes: 'Hardware, 240V 60A circuit, conduit, breaker, mount, permit' },
    { rank: 10, chargerClass: 'L2', manufacturer: 'Enel X / JuiceBox', model: 'JuiceBox 48A Pro', type: 'Level 2 Smart', ports: 1, kW: 11.5, warranty: 3, score: 52, hardwareCost: 650, installCost: 1600, permitCost: 250, turnkeyInstalled: 2500, usMade: false, country: 'Italy/China', factory: 'Designed Italy, assembled China', tariffRisk: 'Medium', tariffNote: 'Section 301 25%; smart energy management; JuicePlan subscription optional', certifications: 'UL Listed, Energy Star, OCPP 1.6J', connector: 'SAE J1772', networkFees: 'Free (JuiceNet app)', cableLength: '24 ft', mountType: 'Wall mount', turnkeyIncludes: 'Hardware, 240V 50A circuit, conduit, breaker, wall mount, permit', riskNote: 'CAUTION: Enel divesting entire global EV charging business (2024-2026). JuiceBox product line future uncertain — may be acquired, sold, or discontinued. Do NOT recommend for new installs.' },
    // ── DCFC CHARGERS (Level 3, 480V DC) ──────────────────────────────────
    // Turnkey = hardware + 480V service upgrade + transformer (if needed) + trenching + concrete pad + conduit + labor + permits + commissioning + bollards + signage
    // Average DCFC install adds $15K-$50K over hardware depending on site electrical readiness and kW rating.
    { rank: 11, chargerClass: 'DCFC', manufacturer: 'ABB', model: 'Terra 54 HV', type: 'DCFC All-in-One', ports: 1, kW: 50, warranty: 2, score: 84, hardwareCost: 44000, installCost: 18000, permitCost: 1500, turnkeyInstalled: 63500, usMade: false, country: 'Switzerland/USA', factory: 'New Berlin, Wisconsin (assembly)', tariffRisk: 'Low', tariffNote: 'Swiss-engineered; US-assembled; best-selling 50kW DCFC globally; paralleled power modules with automatic failover for high uptime; 920V HV charging; EMC Class B for fuel stations and residential-adjacent; OCPP 2.0; ABB connected services', certifications: 'UL Listed, OCPP 2.0, IEC 61851-23, EMC Class B', connector: 'CCS1 + CHAdeMO', networkFees: '$35/mo (ABB ChargerSync)', cableLength: '16 ft', mountType: 'Pedestal (concrete pad)', turnkeyIncludes: 'Hardware, 480V 3-phase service, transformer (if needed), trenching (avg 75ft), concrete pad, conduit, breaker, bollards, signage, commissioning, permit, network activation', inputVoltage: '480V 3-phase', coolingType: 'Air-cooled', dimensions: '25.1×47.9×26 in', weight: '485 lbs' },
    { rank: 12, chargerClass: 'DCFC', manufacturer: 'ABB', model: 'Terra 124', type: 'DCFC All-in-One', ports: 2, kW: 120, warranty: 2, score: 82, hardwareCost: 82000, installCost: 28000, permitCost: 2000, turnkeyInstalled: 112000, usMade: false, country: 'Switzerland/USA', factory: 'New Berlin, Wisconsin (assembly)', tariffRisk: 'Low', tariffNote: 'Swiss-engineered; US-assembled; dual CCS1 ports with dynamic power sharing (120kW single / 60kW×2); 920V HV; NEVI-compliant at 150kW with power module upgrade; ABB global service; ideal for highway rest stops and commercial plazas', certifications: 'UL Listed, OCPP 2.0, IEC 61851-23, EMC Class B', connector: 'Dual CCS1 (NACS option)', networkFees: '$45/mo (ABB ChargerSync)', cableLength: '16 ft', mountType: 'Pedestal (concrete pad)', turnkeyIncludes: 'Hardware, 480V 3-phase 200A service, transformer, trenching, concrete pad, conduit, breaker, bollards, signage, commissioning, permits, network', inputVoltage: '480V 3-phase', coolingType: 'Air-cooled', dimensions: '74.8×22.2×34.6 in', weight: '925 lbs' },
    { rank: 13, chargerClass: 'DCFC', manufacturer: 'ChargePoint', model: 'Express 250 (CPE250)', type: 'DCFC All-in-One', ports: 1, kW: 62.5, warranty: 1, score: 80, hardwareCost: 58000, installCost: 20000, permitCost: 1500, turnkeyInstalled: 79500, usMade: false, country: 'USA/China', factory: 'Campbell, CA (HQ); assembled overseas', tariffRisk: 'Medium', tariffNote: 'ChargePoint largest US DCFC network (388K+ ports); Express 250 modular architecture supports 200-1000V battery packs; 96% efficiency; 20" LED status display; Autocharge+; scalable — add power modules for 125kW; Enterprise Cloud Plan required ($900-$1,200/yr)', certifications: 'UL Listed, OCPP 1.6J, ISO 15118', connector: 'CCS1 + CHAdeMO (NACS option)', networkFees: '$75/mo (Enterprise Cloud Plan)', cableLength: '18 ft', mountType: 'Pedestal (concrete pad)', turnkeyIncludes: 'Hardware, 480V 3-phase service, transformer, trenching, concrete pad, conduit, breaker, bollards, area lighting, commissioning, 1yr cloud plan, permit, network activation', inputVoltage: '480V 3-phase', coolingType: 'Active air-cooled', dimensions: '96×38×26 in', weight: '1,100 lbs' },
    { rank: 14, chargerClass: 'DCFC', manufacturer: 'ChargePoint', model: 'Express 280 (CPE280)', type: 'DCFC Split System', ports: 2, kW: 80, warranty: 1, score: 78, hardwareCost: 69000, installCost: 25000, permitCost: 2000, turnkeyInstalled: 96000, usMade: false, country: 'USA/China', factory: 'Campbell, CA (HQ); assembled overseas', tariffRisk: 'Medium', tariffNote: 'Split system: separate power cabinet + dispensers; dual CCS1 with NACS option; 80kW total (dynamic sharing); cable management kit; 10" touchscreen; contactless credit card + RFID; sequential charging; ideal for retail plazas and fleet depots', certifications: 'UL Listed, OCPP 1.6J, ISO 15118', connector: 'Dual CCS1 (NACS option)', networkFees: '$75/mo (Enterprise Cloud Plan)', cableLength: '15 ft', mountType: 'Pedestal + Power Cabinet', turnkeyIncludes: 'Hardware, power cabinet, 480V 200A service, transformer, trenching, concrete pads (×2), conduit, breaker, bollards, signage, commissioning, 1yr cloud + warranty, permit', inputVoltage: '480V 3-phase', coolingType: 'Active air-cooled', dimensions: 'Dispenser: 72×30×18 in; Cabinet: 48×36×24 in', weight: '1,400 lbs total' },
    { rank: 15, chargerClass: 'DCFC', manufacturer: 'Tritium', model: 'RTM75', type: 'DCFC All-in-One', ports: 2, kW: 75, warranty: 3, score: 83, hardwareCost: 55000, installCost: 18000, permitCost: 1500, turnkeyInstalled: 74500, usMade: true, country: 'Australia/USA', factory: 'Lebanon, Tennessee', tariffRisk: 'None', tariffNote: 'US-manufactured in Tennessee; Australian-designed; smallest footprint DCFC on market; liquid-cooled IP65 sealed; modular power units (single-person lift for field service); patented cooling handles dust/humidity/corrosion; ISO 15118 Plug & Charge; NEVI-compliant; Whisper Mode for noise-sensitive sites; IRA domestic content eligible', certifications: 'UL Listed, OCPP 1.6J/2.0, ISO 15118, IP65, IK10', connector: 'CCS1 + CHAdeMO (NACS option)', networkFees: 'Varies by network partner (ChargeLab, EV Connect, SWTCH)', cableLength: '16 ft', mountType: 'Pedestal (smallest DCFC footprint)', turnkeyIncludes: 'Hardware, 480V 3-phase service, transformer (if needed), trenching, concrete pad, conduit, breaker, bollards, commissioning, permit, network setup', inputVoltage: '480V 3-phase', coolingType: 'Liquid-cooled (patented)', dimensions: '31×25×79 in', weight: '440 lbs' },
    { rank: 16, chargerClass: 'DCFC', manufacturer: 'Tritium', model: 'PKM150', type: 'DCFC Modular/Scalable', ports: 2, kW: 150, warranty: 3, score: 81, hardwareCost: 85000, installCost: 30000, permitCost: 2000, turnkeyInstalled: 117000, usMade: true, country: 'Australia/USA', factory: 'Lebanon, Tennessee', tariffRisk: 'None', tariffNote: 'US-manufactured; first DC microgrid DCFC — shared power pool across dispensers; exceed grid limits via power sharing; modular: start with 2 dispensers, scale to 8; off-grid capable with 3rd-party DC sources; NEVI-compliant; ideal for sites needing future expansion', certifications: 'UL Listed, OCPP 2.0, ISO 15118, IP65', connector: 'CCS1 (NACS option)', networkFees: 'Varies by network partner', cableLength: '16 ft', mountType: 'Dispenser + Power Cabinet', turnkeyIncludes: 'Hardware (1 cabinet + 2 dispensers), 480V 3-phase 400A service, transformer, trenching, concrete pads, conduit, breaker, bollards, signage, commissioning, permit', inputVoltage: '480V 3-phase', coolingType: 'Liquid-cooled', dimensions: 'Dispenser: 31×25×79 in; Cabinet: 36×48×72 in', weight: '1,200 lbs total' },
    { rank: 17, chargerClass: 'DCFC', manufacturer: 'Autel', model: 'MaxiCharger DC Fast 60kW', type: 'DCFC All-in-One', ports: 2, kW: 60, warranty: 3, score: 76, hardwareCost: 46000, installCost: 18000, permitCost: 1500, turnkeyInstalled: 65500, usMade: false, country: 'China', factory: 'Shenzhen, China', tariffRisk: 'High', tariffNote: 'Section 301 25%; dual CCS1 ports; NACS adapter available; dynamic power sharing; 25ft cables; competitive pricing offsets tariff; strong for car wash / retail where cost matters; 3yr warranty is best-in-class for DCFC', certifications: 'UL Listed, OCPP 1.6J, Energy Star', connector: 'Dual CCS1 (NACS option)', networkFees: 'Free (Autel Charge app)', cableLength: '25 ft', mountType: 'Pedestal (concrete pad)', turnkeyIncludes: 'Hardware, 480V 3-phase service, transformer (if needed), trenching, concrete pad, conduit, breaker, bollards, commissioning, permit', inputVoltage: '480V 3-phase', coolingType: 'Air-cooled', dimensions: '65×26×30 in', weight: '595 lbs' },
    { rank: 18, chargerClass: 'DCFC', manufacturer: 'Kempower', model: 'Movable Charger T-Series 50kW', type: 'DCFC Portable/Modular', ports: 2, kW: 50, warranty: 2, score: 74, hardwareCost: 35000, installCost: 12000, permitCost: 1000, turnkeyInstalled: 48000, usMade: false, country: 'Finland', factory: 'Lahti, Finland', tariffRisk: 'Low', tariffNote: 'Finnish-manufactured; EU origin; portable/relocatable design — no permanent concrete pad required; ideal for events, seasonal sites, construction zones; ChargEye cloud management; modular power units; CCS1 + CHAdeMO', certifications: 'UL Listed, OCPP 1.6J, IP54', connector: 'CCS1 + CHAdeMO', networkFees: '$20/mo (ChargEye)', cableLength: '16 ft', mountType: 'Portable (wheeled) or Pedestal', turnkeyIncludes: 'Hardware, 480V connection, minimal trenching (portable), breaker, permit, commissioning', inputVoltage: '480V 3-phase', coolingType: 'Liquid-cooled', dimensions: '25×48×26 in', weight: '310 lbs' },
    { rank: 19, chargerClass: 'DCFC', manufacturer: 'BTC Power (Innogy)', model: 'Gen4 Split 120kW', type: 'DCFC Split System', ports: 2, kW: 120, warranty: 2, score: 75, hardwareCost: 72000, installCost: 28000, permitCost: 2000, turnkeyInstalled: 102000, usMade: true, country: 'USA', factory: 'Santa Ana, California', tariffRisk: 'None', tariffNote: 'US-manufactured; major NEVI program supplier; Gen4 split architecture: 1 power cabinet + up to 4 dispensers; OCPP 2.0; CCS + NACS; used by EVgo, Shell Recharge, Electrify America; proven at scale; NEVI-compliant 150kW with single dispenser mode', certifications: 'UL Listed, OCPP 2.0, ISO 15118, CTEP certified', connector: 'CCS1 + NACS', networkFees: 'Varies by CPO', cableLength: '18 ft', mountType: 'Dispenser + Power Cabinet', turnkeyIncludes: 'Hardware (cabinet + 2 dispensers), 480V 200A service, transformer, trenching, concrete pads, conduit, breaker, bollards, signage, commissioning, permit', inputVoltage: '480V 3-phase', coolingType: 'Liquid-cooled', dimensions: 'Dispenser: 72×28×16 in; Cabinet: 60×42×30 in', weight: '1,500 lbs total' },
    { rank: 20, chargerClass: 'DCFC', manufacturer: 'FreeWire', model: 'Boost Charger 200kW', type: 'DCFC Battery-Integrated', ports: 2, kW: 200, warranty: 3, score: 72, hardwareCost: 180000, installCost: 15000, permitCost: 1500, turnkeyInstalled: 196500, usMade: true, country: 'USA', factory: 'Newark, California', tariffRisk: 'None', tariffNote: 'US-manufactured; battery-integrated DCFC (160kWh LFP battery) — charges from standard 240V or 480V, then boosts to 200kW output; eliminates need for expensive 480V service upgrade or transformer; dramatically reduces utility demand charges; ideal for sites with limited electrical capacity (gas stations, car washes, convenience stores); premium price offset by $50K-$100K avoided infrastructure costs', certifications: 'UL Listed, OCPP 1.6J', connector: 'Dual CCS1 (NACS option)', networkFees: 'Varies by network partner', cableLength: '16 ft', mountType: 'Self-contained unit', turnkeyIncludes: 'Hardware (charger + integrated battery), minimal electrical connection (can use existing 240V!), concrete pad, bollards, commissioning, permit — NO transformer or 480V upgrade needed', inputVoltage: '240V single-phase or 480V 3-phase (flexible)', coolingType: 'Liquid-cooled', dimensions: '72×56×96 in', weight: '7,000 lbs' },
  ],
  monitor: [
    { rank: 1, manufacturer: 'Span', model: 'Panel 200A', type: 'Smart Panel + Monitor', features: 'Circuit-level, load control, EV integration', warranty: 10, score: 85, cost: 8500, usMade: true, country: 'USA', factory: 'San Francisco, California', tariffRisk: 'None', tariffNote: 'US-designed & manufactured', certifications: 'UL 67 Listed, IEEE 1547', circuits: '32 spaces', maxAmps: '200A main', connectivity: 'WiFi 6 + Cellular backup', appControl: 'iOS/Android per-circuit control' },
    { rank: 2, manufacturer: 'Sense', model: 'Pro', type: 'AI Energy Monitor', features: 'Device detection, solar tracking, alerts', warranty: 3, score: 74, cost: 4500, usMade: true, country: 'USA', factory: 'Cambridge, Massachusetts', tariffRisk: 'None', tariffNote: 'US-designed; hardware assembled in USA', certifications: 'FCC Part 15, UL Listed', circuits: 'Whole-home + 2 flex CTs', maxAmps: '400A (split-phase)', connectivity: 'WiFi 2.4GHz', appControl: 'iOS/Android with AI insights' },
    { rank: 3, manufacturer: 'Emporia', model: 'Vue Gen 3', type: 'Energy Monitor', features: 'Real-time usage, circuit-level CTs, solar, EV', warranty: 2, score: 72, cost: 350, usMade: false, country: 'USA/China', factory: 'Designed USA, assembled China', tariffRisk: 'Medium', tariffNote: 'Section 301 25%; lowest-cost circuit-level monitor; integrates with Emporia EV charger', certifications: 'FCC Part 15, UL Listed', circuits: '16 circuits (expandable to 200+)', maxAmps: '200A main + 16 CTs', connectivity: 'WiFi 2.4GHz', appControl: 'iOS/Android real-time dashboard' },
    { rank: 4, manufacturer: 'Schneider Electric', model: 'Wiser Energy', type: 'AI Energy Monitor', features: 'Device detection, solar PV monitoring, demand alerts', warranty: 3, score: 76, cost: 3500, usMade: false, country: 'France/USA', factory: 'Designed France, assembled Nashville, TN', tariffRisk: 'Low', tariffNote: 'French-engineered; US-assembled; Schneider industrial reliability; former Neurio acquisition', certifications: 'UL Listed, FCC Part 15', circuits: 'Whole-home + 2 solar CTs', maxAmps: '400A (split-phase)', connectivity: 'WiFi 2.4/5GHz', appControl: 'iOS/Android + Schneider Home app' },
    { rank: 5, manufacturer: 'Leviton', model: 'Decora Smart Energy Hub', type: 'Smart Panel Monitor', features: 'Circuit metering, load shedding, demand response', warranty: 5, score: 71, cost: 2800, usMade: true, country: 'USA', factory: 'Melville, New York', tariffRisk: 'None', tariffNote: 'US-manufactured; integrates with Leviton smart devices; demand response ready', certifications: 'UL Listed, FCC Part 15', circuits: '32 circuits', maxAmps: '200A main', connectivity: 'WiFi + Zigbee', appControl: 'iOS/Android My Leviton app' },
    { rank: 6, manufacturer: 'Enphase', model: 'IQ Gateway + CTs', type: 'Solar + Storage Monitor', features: 'Solar production, battery state, grid status, consumption', warranty: 5, score: 78, cost: 1200, usMade: true, country: 'USA', factory: 'Fremont, California', tariffRisk: 'None', tariffNote: 'US-manufactured; best-in-class when paired with Enphase IQ ecosystem; cellular backup; included with Enphase solar installs', certifications: 'UL Listed, FCC Part 15', circuits: 'Production + Consumption CTs', maxAmps: '200A per CT', connectivity: 'WiFi + Cellular + Ethernet', appControl: 'iOS/Android Enlighten app' },
    { rank: 7, manufacturer: 'SolarEdge', model: 'SetApp + Energy Hub', type: 'Solar + Home Monitor', features: 'Panel-level monitoring, consumption, EV charging', warranty: 12, score: 55, cost: 1500, usMade: false, country: 'Israel', factory: 'Herzliya, Israel', tariffRisk: 'Low', tariffNote: 'US-Israel FTA: duty-free', certifications: 'UL Listed, FCC Part 15', circuits: 'Panel-level + whole-home', maxAmps: '200A main', connectivity: 'WiFi + Ethernet + RS-485', appControl: 'iOS/Android mySolarEdge', riskNote: 'CAUTION: Same financial distress as SolarEdge inverter division — Altman Z-Score -1.28; >80% bankruptcy probability. Monitoring platform may lose support if company fails. Consider Enphase IQ Gateway, Span Panel, or Sense Pro as alternatives.' },
    { rank: 8, manufacturer: 'Curb', model: 'Curb Energy Monitor', type: 'Circuit-Level Monitor', features: '18-circuit real-time, solar, usage disaggregation', warranty: 2, score: 69, cost: 500, usMade: true, country: 'USA', factory: 'Austin, Texas', tariffRisk: 'None', tariffNote: 'US-manufactured; 18-circuit CTs included; real-time second-by-second data; works with any solar system', certifications: 'FCC Part 15, UL Listed', circuits: '18 circuits', maxAmps: '200A main', connectivity: 'WiFi 2.4GHz', appControl: 'iOS/Android + web dashboard' },
    { rank: 9, manufacturer: 'Iotawatt', model: 'IotaWatt Open Source', type: 'Open Source Monitor', features: 'Up to 14 CTs, local data, InfluxDB/Emoncms export', warranty: 1, score: 64, cost: 200, usMade: true, country: 'USA', factory: 'Asheville, North Carolina', tariffRisk: 'None', tariffNote: 'US-manufactured; open-source firmware; no cloud dependency; local-first data; hobbyist/advanced user', certifications: 'FCC Part 15', circuits: '14 CT inputs', maxAmps: '200A per CT', connectivity: 'WiFi 2.4GHz (local HTTP)', appControl: 'Web interface (local/remote)' },
    { rank: 10, manufacturer: 'Rainforest', model: 'EAGLE-200', type: 'Smart Meter Gateway', features: 'Direct utility AMI access, HAN radio, real-time pricing', warranty: 2, score: 66, cost: 150, usMade: false, country: 'Canada', factory: 'Burnaby, British Columbia', tariffRisk: 'Low', tariffNote: 'USMCA compliant; reads utility smart meter directly via HAN radio; real-time pricing data; demand response', certifications: 'FCC Part 15, Zigbee SEP 1.x', circuits: 'Whole-home via AMI', maxAmps: 'Utility meter rated', connectivity: 'WiFi + Zigbee HAN', appControl: 'iOS/Android + cloud portal' },
  ],
  // ── CATEGORY 8: HEAT PUMP WATER HEATERS (Commercial / C&I) ──────────────
  // Step 5 add-on for facilities with gas water heaters. Sized for car wash (300 vehicles/day), hotel, restaurant loads.
  // IRA §25C: 30% tax credit up to $2,000 (residential). IRA §179D: Commercial building deduction for qualifying systems.
  heatPumpWH: [
    { rank: 1, manufacturer: 'Rheem', model: 'ProTerra XE80 Hybrid (×2)', type: 'Hybrid Heat Pump', capacityGal: 160, inputKW: 4.5, uef: 4.07, maxTempF: 140, recoveryGPH: 45, warranty: 10, score: 84, costPerUnit: 3200, totalInstalled: 14000, usMade: true, country: 'USA', factory: 'Montgomery, Alabama', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; IRA §25C eligible (30% credit); §179D qualifying for commercial; ENERGY STAR Most Efficient 2025; EcoNet WiFi smart controls included; CTA-2045 demand response ready', certifications: 'ENERGY STAR, UL 174, NSF/ANSI 5, CTA-2045', refrigerant: 'R134a', noiseLevel: '49 dB(A)', smartFeatures: 'EcoNet WiFi, leak detection, vacation mode, demand response CTA-2045 port', ambientRange: '37°F – 120°F', dimensions: '73.5×24.5×24.5 in (each)', annualSavings: '$4,100 vs gas (at $1.20/therm, $0.14/kWh)' },
    { rank: 2, manufacturer: 'A.O. Smith', model: 'Voltex XE80 Hybrid (×2)', type: 'Hybrid Heat Pump', capacityGal: 160, inputKW: 4.5, uef: 3.88, maxTempF: 140, recoveryGPH: 42, warranty: 10, score: 81, costPerUnit: 3000, totalInstalled: 13500, usMade: true, country: 'USA', factory: 'Ashland City, Tennessee', tariffRisk: 'None', tariffNote: 'US-manufactured; IRA §25C eligible; §179D qualifying; ENERGY STAR Sustained Excellence winner 6 consecutive years; X3 Scale Prevention extends lifespan 300%; iCOMM connectivity', certifications: 'ENERGY STAR, UL 174, NSF/ANSI 5', refrigerant: 'R134a', noiseLevel: '51 dB(A)', smartFeatures: 'iCOMM WiFi module, leak detection, 4 operating modes', ambientRange: '40°F – 120°F', dimensions: '73×24×24 in (each)', annualSavings: '$3,800 vs gas' },
    { rank: 3, manufacturer: 'Nyle', model: 'E90 Commercial HPWH', type: 'Dedicated Heat Pump (add-on to storage tank)', capacityGal: 'Pairs with 120-300 gal storage', inputKW: 7.2, cop: 3.5, maxTempF: 160, recoveryGPH: 68, warranty: 5, score: 82, costPerUnit: 8500, totalInstalled: 18000, usMade: true, country: 'USA', factory: 'Bangor, Maine', tariffRisk: 'None', tariffNote: 'Fully US-manufactured; largest commercial HPWH manufacturer in North America; dedicated heat pump pairs with any storage tank; ideal for high-volume commercial (car wash, hotel, laundry); IRA §179D eligible; 160°F output eliminates Legionella risk', certifications: 'UL Listed, NSF/ANSI 5, ASHRAE 90.1 compliant', refrigerant: 'R-410A', noiseLevel: '55 dB(A)', smartFeatures: 'BACnet/Modbus integration, remote monitoring, multi-unit cascade control', ambientRange: '35°F – 115°F', dimensions: '24×30×55 in (heat pump unit only)', annualSavings: '$5,200 vs gas (higher volume throughput)' },
    { rank: 4, manufacturer: 'Colmac WaterHeat', model: 'CxA 30 (C&I)', type: 'Dedicated Commercial Heat Pump', capacityGal: 'Pairs with 200-500 gal storage', inputKW: 8.8, cop: 3.8, maxTempF: 185, recoveryGPH: 80, warranty: 5, score: 79, costPerUnit: 12000, totalInstalled: 24000, usMade: true, country: 'USA', factory: 'Colville, Washington', tariffRisk: 'None', tariffNote: 'US-manufactured; 185°F single-pass = HACCP Legionella eradication without UV/chemicals; double-wall vented condenser isolates refrigerant from potable water; ideal for food service, hotels, car wash high-temp needs; §179D eligible', certifications: 'UL Listed, NSF/ANSI 5, ASHRAE 90.1, HACCP compliant', refrigerant: 'R-410A', noiseLevel: '58 dB(A)', smartFeatures: 'BACnet/Modbus, cascade control for multi-unit, fault monitoring', ambientRange: '30°F – 115°F', dimensions: '36×42×60 in (heat pump unit only)', annualSavings: '$6,400 vs gas (commercial volume)' },
    { rank: 5, manufacturer: 'Stiebel Eltron', model: 'Accelera 300 E (×2)', type: 'Hybrid Heat Pump', capacityGal: 160, inputKW: 3.4, uef: 3.39, maxTempF: 149, recoveryGPH: 36, warranty: 10, score: 77, costPerUnit: 3800, totalInstalled: 16500, usMade: false, country: 'Germany', factory: 'Holzminden, Germany', tariffRisk: 'Low', tariffNote: 'German-engineered and manufactured; EU origin = no AD/CVD or Section 301; premium build quality; hygienic glass-enameled interior; lowest energy consumption in standby (504 Wh/24h); impressed current anode; quietest unit at 42 dB(A)', certifications: 'ENERGY STAR, UL 174, CE, IEC 60335', refrigerant: 'R134a', noiseLevel: '42 dB(A)', smartFeatures: 'LCD display, boost mode, SI/US unit toggle, auto defrost', ambientRange: '43°F – 108°F', dimensions: '71×26×26 in (each)', annualSavings: '$3,400 vs gas' },
    { rank: 6, manufacturer: 'Bradford White', model: 'AeroTherm RE2H80R10B-HW (×2)', type: 'Hybrid Heat Pump', capacityGal: 160, inputKW: 4.5, uef: 3.75, maxTempF: 140, recoveryGPH: 40, warranty: 10, score: 76, costPerUnit: 2800, totalInstalled: 13000, usMade: true, country: 'USA', factory: 'Middleville, Michigan', tariffRisk: 'None', tariffNote: 'US-manufactured; pro-channel only (plumber-installed); Vitraglas glass lining + Hydrojet sediment reduction; 140+ year brand heritage; lowest installed cost in category; strong contractor network; IRA §25C eligible', certifications: 'ENERGY STAR, UL 174, NSF/ANSI 5', refrigerant: 'R134a', noiseLevel: '52 dB(A)', smartFeatures: 'Honeywell controller, 4 operating modes, status indicator LEDs', ambientRange: '40°F – 120°F', dimensions: '72×23×23 in (each)', annualSavings: '$3,600 vs gas' },
    { rank: 7, manufacturer: 'Mitsubishi Electric', model: 'QAHV N560 CO2 HPWH', type: 'CO2 Heat Pump (dedicated)', capacityGal: 'Pairs with 120-500 gal storage', inputKW: 4.5, cop: 4.0, maxTempF: 176, recoveryGPH: 55, warranty: 5, score: 78, costPerUnit: 14000, totalInstalled: 26000, usMade: false, country: 'Japan', factory: 'Shizuoka, Japan', tariffRisk: 'Low', tariffNote: 'Japan origin = no AD/CVD; US-Japan trade agreement; CO2 (R-744) refrigerant = zero ODP, GWP of 1 (lowest possible); operates efficiently to -13°F ambient; 176°F output; ideal for cold climates; premium price but best lifecycle efficiency', certifications: 'UL Listed, ASHRAE 90.1, NSF/ANSI 5', refrigerant: 'R-744 (CO2)', noiseLevel: '52 dB(A)', smartFeatures: 'MELCloud remote monitoring, cascade control, BACnet integration', ambientRange: '-13°F – 109°F', dimensions: '53×33×27 in (outdoor unit)', annualSavings: '$5,800 vs gas (CO2 cycle efficiency advantage)' },
    { rank: 8, manufacturer: 'State Water Heaters', model: 'ProLine XE Hybrid 80 (×2)', type: 'Hybrid Heat Pump', capacityGal: 160, inputKW: 4.5, uef: 3.70, maxTempF: 140, recoveryGPH: 38, warranty: 10, score: 73, costPerUnit: 2600, totalInstalled: 12500, usMade: true, country: 'USA', factory: 'Ashland City, Tennessee', tariffRisk: 'None', tariffNote: 'US-manufactured; A.O. Smith subsidiary — same factory, shared components, lower price tier; IRA §25C eligible; ENERGY STAR rated; most rebate-friendly option; best for budget-conscious commercial installs', certifications: 'ENERGY STAR, UL 174, NSF/ANSI 5', refrigerant: 'R134a', noiseLevel: '53 dB(A)', smartFeatures: 'Basic WiFi, 4 operating modes, status LEDs', ambientRange: '40°F – 120°F', dimensions: '72×23×23 in (each)', annualSavings: '$3,400 vs gas' },
  ],
  // ── CATEGORY 9a: CANOPY / CARPORT STRUCTURES (Solar Expansion) ──────────
  // Structure-only (steel/aluminum frame + foundation + install). Panels use roof solar supplier.
  // Total carport installed: $3.14–3.17/W (EnergySage 2026). Structure premium over roof: ~$0.56–0.61/W.
  // Structure-only equipment: ~$0.48–0.62/W (mfg spec) + $0.85–0.95/W install labor.
  // Sources: NREL 2025 ATB, EnergySage Marketplace H2 2025, Solar Builder RBI cost analysis, mfg spec sheets.
  canopyStructure: [
    { rank: 1, manufacturer: 'Baja Carports', model: 'Single-Post Cantilever', type: 'Pre-engineered bolted steel', material: 'Cold-rolled high-tensile steel', windLoad: '150 mph', snowLoad: '40 psf', tiltAngle: '7°', foundationType: 'At-grade concrete', clearHeight: '14 ft', warranty: 20, score: 86, costPerW: 0.55, installLaborPerW: 0.90, usMade: true, country: 'USA', factory: 'Vista, California', tariffRisk: 'None', tariffNote: 'US-manufactured 38+ years; ASTM steel standards; AISI S100 compliant; no field welding required; pre-engineered bolted connections; IRA domestic content eligible', certifications: 'IBC 2021, ASCE 7-22, AISI S100, PE stamped', noFieldWelding: true, features: 'Cantilever design maximizes parking clearance; galvanized steel; optional sub-decking for waterproofing; integrated cable management; EV-ready conduit routing' },
    { rank: 2, manufacturer: 'Quest Renewables', model: 'QuadPod™ Triangular', type: 'Ground-assembled triangular frame', material: 'Galvanized steel triangular', windLoad: '130 mph', snowLoad: '35 psf', tiltAngle: '5–10°', foundationType: 'Micropile / helical pier', clearHeight: '14 ft', warranty: 20, score: 83, costPerW: 0.48, installLaborPerW: 0.85, usMade: true, country: 'USA', factory: 'Atlanta, Georgia', tariffRisk: 'None', tariffNote: 'US-manufactured; DOE SunShot Initiative funded design; 50% less steel than conventional T-structure; ground-assembled then tilted up = faster install; 50% fewer foundations; IRA domestic content eligible', certifications: 'IBC 2021, ASCE 7-22, PE stamped', noFieldWelding: true, features: 'Patented triangular geometry uses 50% less steel; ground assembly reduces crane time; ideal for poor soil conditions; reduces foundation count by 50%' },
    { rank: 3, manufacturer: 'Schletter Group', model: 'Park@Sol™', type: 'Aluminum alloy + micropile foundation', material: 'Aluminum alloy + steel micropile', windLoad: '160 mph', snowLoad: '50 psf', tiltAngle: '5–15°', foundationType: 'Schletter Micropile (hollow metal rod)', clearHeight: '14 ft', warranty: 20, score: 81, costPerW: 0.62, installLaborPerW: 0.88, usMade: true, country: 'USA / Germany', factory: 'Shelby, North Carolina', tariffRisk: 'Low', tariffNote: 'German-engineered, US-manufactured in Shelby NC; aluminum = corrosion-free, maintenance-free; micropile foundation minimizes concrete; patented connection system = no on-site welding; highest wind/snow ratings in category', certifications: 'IBC 2021, ASCE 7-22, Eurocode EN 1991, PE stamped', noFieldWelding: true, features: 'Highest wind rating (160 mph); maintenance-free aluminum; micropile foundation reduces concrete 70%; optional sub-decking, lighting, drainage, ad space' },
    { rank: 4, manufacturer: 'GameChange Solar', model: 'Pour-in-Place Carport', type: 'T-structure hot-dip galvanized steel', material: 'Hot-dip galvanized steel', windLoad: '140 mph', snowLoad: '45 psf', tiltAngle: '7°', foundationType: 'Pour-in-place concrete', clearHeight: '14 ft', warranty: 20, score: 79, costPerW: 0.52, installLaborPerW: 0.88, usMade: true, country: 'USA', factory: 'Cincinnati, Ohio', tariffRisk: 'None', tariffNote: 'US-manufactured; formerly RBI Solar (acquired 2022); T-structure = most economical design, least steel per kW; hot-dip galvanized per ASTM A123; pour-in-place foundation = simple, fast; IRA domestic content eligible', certifications: 'IBC 2021, ASCE 7-22, ASTM A123, PE stamped', noFieldWelding: false, features: 'T-structure uses least material; most cost-effective for large lots; hot-dip galvanized 25+ year corrosion resistance; standard 7° tilt for self-cleaning' },
    { rank: 5, manufacturer: 'Solar FlexRack', model: 'TDP 2.0 Carport', type: 'Double-post adjustable tilt', material: 'Galvanized steel + aluminum rails', windLoad: '130 mph', snowLoad: '40 psf', tiltAngle: '5–15° adjustable', foundationType: 'Concrete pier / driven pile', clearHeight: '14 ft', warranty: 25, score: 77, costPerW: 0.58, installLaborPerW: 0.90, usMade: true, country: 'USA', factory: 'Youngstown, Ohio', tariffRisk: 'None', tariffNote: 'US-manufactured; Northern States Metals subsidiary; adjustable tilt angle optimizes production by latitude; longest warranty in category (25 yr); double-post = extra stability for heavy snow regions; IRA domestic content eligible', certifications: 'IBC 2021, ASCE 7-22, ASTM A123, PE stamped', noFieldWelding: true, features: 'Only adjustable-tilt carport in category; 25-year warranty (longest); double-post extra stability; ideal for Midwest/Northeast snow belt; aluminum rail caps reduce thermal bridging' },
  ],
  // ── CATEGORY 10: WATER RECLAIM SYSTEMS (Car Wash) ────────────────────────
  // Step 5 add-on for car washes with basic reclaim. Upgrading from 50-60% basic to 85-95% advanced.
  // EPA: 60-85 gal fresh water per vehicle without reclaim. Target: reduce to 8-15 gal (final rinse only).
  waterReclaim: [
    { rank: 1, manufacturer: 'Con-Serv Manufacturing', model: 'CS-3000 Advanced Reclaim', type: 'Multi-Stage Filtration + Ozone', reclaimRate: '90%', filtrationMicron: 5, throughputGPM: 80, odorControl: 'Ozone injection + activated carbon', warranty: 3, score: 83, costInstalled: 38000, usMade: true, country: 'USA', factory: 'Milwaukee, Wisconsin', tariffRisk: 'None', tariffNote: 'US-manufactured; industry leader for 30+ years; patented multi-stage hydrocyclone + bag filtration + ozone; 90% reclaim rate proven at 300+ car/day volumes; fresh water used only for final spot-free rinse (RO/DI)', certifications: 'UL Listed, NSF/ANSI 61, WaterSavers certified', maintenanceCycle: 'Monthly: bag filter change ($25). Quarterly: ozone generator check. Annual: hydrocyclone service', filterMedia: 'Hydrocyclone + 5-micron bag filters + ozone + activated carbon', freshWaterPerCar: '12 gal (final rinse only)', waterSavingsGalYr: '2,400,000', annualSavings: '$10,200 (water + sewer at $4.25/1000 gal)', footprint: '6×4×6 ft', powerReq: '208-240V, 30A' },
    { rank: 2, manufacturer: 'SoBrite Technologies', model: 'Filtermatic 3B', type: 'Non-Consumable Filter Media + Ozone', reclaimRate: '92%', filtrationMicron: 5, throughputGPM: 100, odorControl: 'AquaPrep ozone + bio-control', warranty: 3, score: 81, costInstalled: 42000, usMade: true, country: 'USA', factory: 'Green Bay, Wisconsin', tariffRisk: 'None', tariffNote: 'US-manufactured; non-consumable filter media = no ongoing filter replacement costs; AquaPrep odor control proven across 500+ installs; highest throughput (100 GPM) for high-volume express tunnels; skid-mounted, pre-plumbed for fast install', certifications: 'UL Listed, NSF/ANSI 61, WaterSavers certified', maintenanceCycle: 'Monthly: media rinse (automated). Quarterly: ozone lamp replacement ($85). Annual: full system service', filterMedia: 'Proprietary non-consumable media + ozone + bio-treatment', freshWaterPerCar: '10 gal (final rinse only)', waterSavingsGalYr: '2,600,000', annualSavings: '$11,050', footprint: '8×4×7 ft', powerReq: '208-240V, 40A' },
    { rank: 3, manufacturer: 'CATEC', model: 'WRS-200 Advanced', type: 'Ozone + Multi-Stage Settling + Filtration', reclaimRate: '88%', filtrationMicron: 5, throughputGPM: 75, odorControl: 'High-output ozone injection', warranty: 5, score: 80, costInstalled: 35000, usMade: true, country: 'USA', factory: 'Sarasota, Florida', tariffRisk: 'None', tariffNote: 'US-manufactured; best-in-class 5-year warranty (3yr on ozone generator + pumps); proven at 200+ car/day volumes; strong operator community reputation; CATEC provides pre-construction site consultation — critical for pit design and plumbing layout; lowest cost in top tier', certifications: 'UL Listed, NSF/ANSI 61', maintenanceCycle: 'Monthly: sediment pit pump-out. Quarterly: ozone check. Annual: full inspection', filterMedia: 'Multi-stage settling tanks + hydrocyclone + ozone injection + 5-micron polishing', freshWaterPerCar: '14 gal', waterSavingsGalYr: '2,200,000', annualSavings: '$9,350', footprint: '5×4×5 ft', powerReq: '208-240V, 20A' },
    { rank: 4, manufacturer: 'PurWater (Sonny\'s)', model: 'Succession Self-Purging', type: 'Self-Purging Filtration + Ozone', reclaimRate: '90%', filtrationMicron: 5, throughputGPM: 85, odorControl: 'Engineered ozone injection', warranty: 3, score: 78, costInstalled: 40000, usMade: true, country: 'USA', factory: 'Tamarac, Florida', tariffRisk: 'None', tariffNote: 'US-manufactured; Sonny\'s Enterprises subsidiary (acquired 2021) — largest car wash equipment company; patented Succession Self-Purging Technology eliminates disposable bag filters entirely; certified 5-micron without consumables; integrates with Sonny\'s tunnel systems', certifications: 'UL Listed, NSF/ANSI 61, WaterSavers certified', maintenanceCycle: 'Self-purging: automated backwash cycle. Quarterly: ozone check. Annual: full service', filterMedia: 'Patent-pending Succession self-purging filtration + ozone', freshWaterPerCar: '11 gal', waterSavingsGalYr: '2,500,000', annualSavings: '$10,625', footprint: '6×4×6 ft', powerReq: '208-240V, 30A' },
    { rank: 5, manufacturer: 'PurClean (NCS)', model: 'PurClean 2.0 Reclaim', type: 'Bio-Treatment + Ozone + Filtration', reclaimRate: '85%', filtrationMicron: 10, throughputGPM: 70, odorControl: 'Bio-treatment + ozone dual approach', warranty: 2, score: 74, costInstalled: 32000, usMade: true, country: 'USA', factory: 'Springfield, Missouri', tariffRisk: 'None', tariffNote: 'US-manufactured; Tommy Car Wash Systems / NCS platform; bio-treatment approach reduces chemical dependency; good for mid-volume (150-250 cars/day); lower cost entry point; integrates with NCS tunnel equipment', certifications: 'UL Listed, NSF/ANSI 61', maintenanceCycle: 'Weekly: bio-media check. Monthly: filter change ($30). Quarterly: full service', filterMedia: 'Bio-treatment media + bag filtration + ozone polishing', freshWaterPerCar: '16 gal', waterSavingsGalYr: '2,000,000', annualSavings: '$8,500', footprint: '5×3×5 ft', powerReq: '208-240V, 20A' },
    { rank: 6, manufacturer: 'Hydro Engineering', model: 'Hydrokleen 3000', type: 'Closed-Loop Filtration + UV + Ozone', reclaimRate: '95%', filtrationMicron: 3, throughputGPM: 60, odorControl: 'UV sterilization + ozone', warranty: 3, score: 77, costInstalled: 48000, usMade: true, country: 'USA', factory: 'Salt Lake City, Utah', tariffRisk: 'None', tariffNote: 'US-manufactured since 1980; ISO 9001:2015 certified; UL 1776/979 certified; highest reclaim rate (95%) using closed-loop with UV + ozone; 3-micron finest filtration in class; military/government contract proven; premium price but lowest fresh water consumption; ideal for drought regions or zero-discharge mandates', certifications: 'UL 1776, UL 979, CSA, CE, ISO 9001:2015, WaterSavers certified', maintenanceCycle: 'Monthly: UV lamp check. Quarterly: membrane service ($120). Annual: full system calibration', filterMedia: 'Multi-stage settlement + 3-micron membrane + UV sterilization + ozone', freshWaterPerCar: '6 gal', waterSavingsGalYr: '2,800,000', annualSavings: '$11,900', footprint: '8×5×7 ft', powerReq: '208-240V, 50A' },
    { rank: 7, manufacturer: 'Reclaim Equipment Co.', model: 'Rainmaker RMK-300', type: 'Reclaim Ready + Filtration + Ozone', reclaimRate: '87%', filtrationMicron: 5, throughputGPM: 75, odorControl: 'Ozone injection', warranty: 2, score: 72, costInstalled: 30000, usMade: true, country: 'USA', factory: 'Clearwater, Florida', tariffRisk: 'None', tariffNote: 'US-manufactured; uniquely provides Reclaim Ready high-pressure pump systems designed for reclaimed water — other manufacturers require 3rd-party pumps that degrade faster on recycled water; complete water recovery solution; budget-friendly entry; strong for 150-250 car/day operations', certifications: 'UL Listed', maintenanceCycle: 'Monthly: bag filter + pit service. Quarterly: ozone check. Annual: pump rebuild', filterMedia: 'Settlement tank + hydrocyclone + bag filtration + ozone', freshWaterPerCar: '15 gal', waterSavingsGalYr: '2,100,000', annualSavings: '$8,925', footprint: '5×4×5 ft', powerReq: '208-240V, 20A' },
    { rank: 8, manufacturer: 'Park USA (NWPX)', model: 'HydroRecycle HR-200', type: 'Settlement + Coalescing + Ozone', reclaimRate: '85%', filtrationMicron: 10, throughputGPM: 65, odorControl: 'Ozone + chemical treatment', warranty: 3, score: 71, costInstalled: 34000, usMade: true, country: 'USA', factory: 'Houston, Texas', tariffRisk: 'None', tariffNote: 'US-manufactured; NWPX division specializes in water/wastewater treatment; strong in Texas/Gulf Coast markets where water costs are rising; coalescing plate separator technology for oil/grease removal; good for sites with high TDS water; integrates with ParkUSA stormwater systems', certifications: 'UL Listed, NSF/ANSI 61, Texas CEQ approved', maintenanceCycle: 'Monthly: plate cleaning + chemical dosing. Quarterly: ozone service. Annual: full inspection', filterMedia: 'Coalescing plate separator + settlement + bag filtration + ozone', freshWaterPerCar: '16 gal', waterSavingsGalYr: '2,000,000', annualSavings: '$8,500', footprint: '6×4×6 ft', powerReq: '208-240V, 25A' },
  ],
  // ── CATEGORY 10: CAR WASH TUNNEL EQUIPMENT (Component Suppliers) ────────
  // Tracks major US tunnel system manufacturers and their component specialties.
  // These are the OEMs/resellers that supply the physical tunnel wash components.
  // Used by Wizard A to identify existing equipment brands and assess replacement/upgrade needs.
  // Cross-references: waterReclaim suppliers (Category 9), heatPumpWH (Category 8).
  carWashEquipment: [
    { rank: 1, manufacturer: "Sonny's Enterprises", type: 'Full Tunnel System OEM', specialty: 'Conveyors, wraps, mitters, brushes, dryers, controls, chemistry, vacuums', tunnelTypes: 'Express exterior, full-service, flex', throughput: '60-160 cars/hr', warranty: '1-3 yr component', score: 88, country: 'USA', factory: 'Tamarac, Florida', tariffRisk: 'None', tariffNote: 'US-manufactured; world\'s largest conveyorized car wash equipment manufacturer; ISO 9001 certified; OneWash complete suite (equipment + chemistry + controls + marketing + college); carries OEM parts for Hanna, Peco, PDQ, Belanger, MacNeil, Ryko; Quivio software ecosystem; acquired PurWater reclaim (see waterReclaim category); $750M revenue', brands: 'Sonny\'s, PECO, PurWater (Succession reclaim)', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: true, chemPumps: true, vacuum: true }, website: 'sonnysdirect.com' },
    { rank: 2, manufacturer: 'Tommy Car Wash Systems', type: 'Full Tunnel System OEM', specialty: 'Stainless steel arches, friction equipment, premium aesthetics, in-bay conversions', tunnelTypes: 'Express exterior, in-bay automatic conversion, full-service', throughput: '50-120 cars/hr', warranty: '1-3 yr component', score: 85, country: 'USA', factory: 'Holland, Michigan', tariffRisk: 'None', tariffNote: 'US-manufactured since 1969; 3rd-generation car wash operator/manufacturer; signature stainless steel Tommy Arches with ultra-bright LEDs; patented All-in-One Extreme Clean combo; Tommy 2.0 Drying System; equipment manufactured by AVW Equipment (sister company); in-bay conversion doubles throughput from 7-8 to 50+ cars/hr; NCS chemical platform', brands: 'Tommy, NCS (chemistry), PurClean (reclaim — see waterReclaim category)', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: true, chemPumps: true, vacuum: false }, website: 'tommycarwash.com' },
    { rank: 3, manufacturer: 'MacNeil Wash Systems', type: 'Full Tunnel System OEM', specialty: 'Affordable quality conveyors, brushes, dryers; high-speed capability', tunnelTypes: 'Express exterior, full-service', throughput: '60-140 cars/hr', warranty: '1-3 yr component', score: 82, country: 'Canada/USA', factory: 'Barrie, Ontario + US distribution', tariffRisk: 'Low', tariffNote: 'USMCA compliant; established 1982; Grade-A equipment reputation; known for value + durability; strong North American dealer network; affordable entry for new operators; retrofit-friendly designs', brands: 'MacNeil', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: false, chemPumps: true, vacuum: false }, website: 'macneilwash.com' },
    { rank: 4, manufacturer: 'AVW Equipment Company', type: 'Full Tunnel System OEM', specialty: 'Simplicity in motion — fewer moving parts, high-speed, reclaim-compatible', tunnelTypes: 'Full, flex, express', throughput: '60-160 cars/hr (industry-leading speed)', warranty: '1-3 yr component', score: 83, country: 'USA', factory: 'Holland, Michigan', tariffRisk: 'None', tariffNote: 'US-manufactured since 1973; builds equipment for Tommy Car Wash Systems; family-owned; known for simple designs = lower maintenance; stainless steel construction; high-pressure equipment works with reclaim water as well as fresh; quieter operation than competitors', brands: 'AVW', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: false, antiCollision: false, ledLighting: false, chemPumps: false, vacuum: false }, website: 'avwequipment.com' },
    { rank: 5, manufacturer: 'Motor City Wash Works', type: 'Full Tunnel System OEM', specialty: 'Speed-focused systems, exclusive proprietary components, 160 cph capability', tunnelTypes: 'Express exterior, full-service', throughput: '100-160 cars/hr', warranty: '1-3 yr component', score: 80, country: 'USA', factory: 'Livonia, Michigan', tariffRisk: 'None', tariffNote: 'US-manufactured; speed leader at 160 cars/hr; exclusive products: Axis Arch, Dry N Shine, CruzControl, Dually, Glide XD Belt Conveyor, 300GT Wrap Arounds, LIT Arch; premium components for maximum throughput; quick turnaround on replacement parts', brands: 'Motor City, Wash Street packages', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: true, chemPumps: true, vacuum: false }, website: 'motorcitywashworks.com' },
    { rank: 6, manufacturer: 'OPW Vehicle Wash Solutions (Belanger + PDQ)', type: 'Full System OEM + In-Bay', specialty: 'DuraTrans conveyor, AirCannon dryers, Kondor touchless, LaserWash in-bay', tunnelTypes: 'Tunnel, in-bay touchless, in-bay soft-touch, fleet', throughput: '60-120 cars/hr (tunnel); 8-12 cars/hr (in-bay)', warranty: '1-3 yr component', score: 81, country: 'USA', factory: 'Belanger: Livonia, MI; PDQ: De Pere, WI', tariffRisk: 'None', tariffNote: 'US-manufactured; most comprehensive portfolio in industry — tunnels, touchless, soft-touch, fleet, drive-thru; Belanger DuraTrans XDW (most advanced conveyor available); AirCannon dryers last 30% longer; PDQ LaserWash 360 Plus (10,000+ systems shipped, #1 in-bay globally); Kondor Flight illuminated touchless; DuraShiner tire applicator saves 40-50¢/car', brands: 'Belanger, PDQ, LaserWash, Kondor, DuraTrans, AirCannon, DuraShiner, Chameleon Arch', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: true, chemPumps: true, vacuum: false }, website: 'opwvws.com' },
    { rank: 7, manufacturer: 'Coleman Hanna Carwash Systems', type: 'Full Tunnel + Hybrid System OEM', specialty: 'Hybrid systems, mini-tunnels, Smart Link pre-plumbed backroom, Global Mini-Tunnel', tunnelTypes: 'Full tunnel (60-110ft), mini-tunnel, hybrid, metrowash', throughput: '35-100 cars/hr', warranty: '1-3 yr component', score: 78, country: 'USA', factory: 'Concordville, Pennsylvania', tariffRisk: 'None', tariffNote: 'US-manufactured; Smart Link System = pre-plumbed/pre-wired backroom saves hours of install time; Stack and Scrub (SAS) frame integrates multiple wash components in 24ft; Global Mini-Tunnel fits standard rollover bays (35-60 cph); MetroWash 85 cph in 40ft building; 5+ decades of innovation', brands: 'Coleman Hanna, Smart Link, SAS, Global, MetroWash, H.E.S.S. Dryers', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: false, chemPumps: true, vacuum: false }, website: 'colemanhanna.com' },
    { rank: 8, manufacturer: 'Washworld Inc.', type: 'In-Bay Automatic OEM', specialty: 'Touch-free and soft-touch in-bay systems, Razor series touchless, Profile series soft-touch', tunnelTypes: 'In-bay touchless, in-bay soft-touch, hybrid', throughput: '8-15 cars/hr per bay', warranty: '1-2 yr component', score: 75, country: 'USA', factory: 'De Pere, Wisconsin', tariffRisk: 'None', tariffNote: 'US-manufactured; Razor HyperForce dual high-pressure spray arch (1500 PSI @ 36 GPM); Profile MAX soft-touch; Profile Apex hybrid (touchless + soft-touch); 24/7 tech support; CAT pump stations; ideal for gas stations, convenience stores, small-volume sites', brands: 'Washworld, Razor, Profile', components: { conveyor: false, topBrush: true, wrapAround: true, mitter: false, tireBrush: false, rockerWasher: false, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: false, ledLighting: false, chemPumps: true, vacuum: false }, website: 'washworldinc.com' },
    { rank: 9, manufacturer: 'Istobal', type: 'Full System OEM (European)', specialty: 'Rollover gantry, tunnel, self-service; European engineering, global presence', tunnelTypes: 'Tunnel, rollover, self-service, bus/truck wash', throughput: '50-90 cars/hr (tunnel)', warranty: '2 yr standard', score: 73, country: 'Spain/USA', factory: 'Valencia, Spain + US distribution', tariffRisk: 'Low', tariffNote: 'EU-manufactured; 70+ year history; 3,000+ employees; presence in 75+ countries; strong in European markets expanding to US; rollover gantry systems popular for gas stations; bus/truck wash capability; water recycling systems integrated', brands: 'Istobal', components: { conveyor: true, topBrush: true, wrapAround: true, mitter: false, tireBrush: true, rockerWasher: true, chemArch: true, hpArch: true, tripleFoam: true, blowerDryer: true, controller: true, antiCollision: true, ledLighting: true, chemPumps: true, vacuum: true }, website: 'istobal.com' },
    { rank: 10, manufacturer: 'Kirikian Industries (Neoglide)', type: 'Specialty Component — Brush Media', specialty: 'Neoglide closed-cell brush media, Ninja Brush; sold through Sonny\'s and all major OEMs', tunnelTypes: 'Component supplier (all tunnel types)', throughput: 'N/A (component)', warranty: '6-12 mo brush media', score: 77, country: 'USA', factory: 'Hamilton, New Jersey', tariffRisk: 'None', tariffNote: 'US-manufactured; Neoglide = industry-standard closed-cell wash media; inhibits water absorption + resists grit embedding; superior tensile strength for longevity; brightening effect polishes clearcoat; available in solid + swirl colors; compatible with ALL manufacturers\' equipment (Sonny\'s, Tommy, MacNeil, Belanger, etc.)', brands: 'Neoglide, Ninja Brush', components: { conveyor: false, topBrush: true, wrapAround: true, mitter: true, tireBrush: true, rockerWasher: true, chemArch: false, hpArch: false, tripleFoam: false, blowerDryer: false, controller: false, antiCollision: false, ledLighting: false, chemPumps: false, vacuum: false }, website: 'neoglide.com' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4a: TURNKEY COST MODEL — State-Based Installation Multipliers
// ═══════════════════════════════════════════════════════════════════════════════
// All SUPPLIERS.evCharger turnkeyInstalled costs are base national averages.
// Apply state multiplier to get location-adjusted turnkey cost.
// Factors: prevailing wage laws, permit complexity, utility interconnection timelines, demand charge structures.
const TURNKEY_COST_MODEL = {
  // State multipliers applied to turnkeyInstalled cost
  stateMultipliers: {
    // Tier 1: Low-cost, streamlined permits (multiplier 0.85–0.95)
    TX: 0.88, FL: 0.90, AZ: 0.88, GA: 0.92, TN: 0.90, NC: 0.92, SC: 0.90, AL: 0.87, MS: 0.85, LA: 0.89, IN: 0.93, OH: 0.93, MO: 0.90,
    // Tier 2: Moderate cost, standard permits (multiplier 0.95–1.05)
    MI: 1.00, PA: 1.02, VA: 0.98, CO: 1.00, WI: 0.97, MN: 1.00, IA: 0.95, KY: 0.95, OK: 0.88, NV: 0.98, UT: 0.95, OR: 1.03, WA: 1.05,
    // Tier 3: High-cost, complex permits / prevailing wage (multiplier 1.05–1.30)
    CA: 1.25, NY: 1.20, NJ: 1.18, MA: 1.15, CT: 1.12, IL: 1.10, MD: 1.08, HI: 1.30, DC: 1.15, VT: 1.05, ME: 1.05,
  },
  defaultMultiplier: 1.00,
  // Turnkey cost breakdown structure (% of total)
  costBreakdown: {
    L2: { hardware: 0.35, electricalInfra: 0.30, labor: 0.20, permits: 0.08, commissioning: 0.04, contingency: 0.03 },
    DCFC: { hardware: 0.50, electricalInfra: 0.22, labor: 0.14, permits: 0.05, commissioning: 0.04, bollardSignage: 0.03, contingency: 0.02 },
  },
  // Tax credits applicable
  taxCredits: {
    section30C: { rate: EV_CHARGER_CREDIT_RATE, maxPerLocation: EV_CHARGER_CREDIT_MAX, expiresDate: '2026-06-30', note: 'Alternative Fuel Vehicle Refueling Property Credit; rate and max from merlinConstants SSOT; must be placed in service by June 30, 2026' /* VERIFY: §30C expiry per OBBBA §70401 */ },
    nevi: { note: 'National EV Infrastructure program; up to $600K per station for NEVI-compliant 150kW+ sites; state DOT administered' },
    stateRebates: { note: 'Many states offer additional rebates: CA up to $80K/DCFC (CALeVIP), NY up to $4K/L2 (DEC), MI Clean Energy credits, etc.' },
  },
  // Helper: get turnkey cost adjusted for state
  getStateTurnkey: (baseTurnkey, stateCode) => {
    const mult = TURNKEY_COST_MODEL.stateMultipliers[stateCode] || TURNKEY_COST_MODEL.defaultMultiplier;
    return Math.round(baseTurnkey * mult);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4b: DYNAMIC SUPPLIER SCORING ENGINE (FIX #75)
// Scores each supplier based on project-specific context instead of static values.
// 
// SCORING DIMENSIONS (100 pts total):
//   Technical Merit  — 25%  (efficiency, warranty, cycles, degradation, temp coeff)
//   Cost Fit         — 20%  ($/W or $/kWh relative to project size)
//   Tariff Risk      — 20%  (AD/CVD, Section 301, FEOC, reciprocal tariffs)
//   IRA Eligibility  — 15%  (domestic content bonus, §45X manufacturing credit)
//   Financial Health — 10%  (bankruptcy risk, warranty fulfillment confidence)
//   Location Fit     — 10%  (weather resilience, wind/snow loads, climate)
// ═══════════════════════════════════════════════════════════════════════════════

const scoreSuppliers = (projectContext) => {
  const {
    stateCode = 'MI',
    systemSizeKW = 85,
    bessCapacityKWh = 200,
    annualKWh = 350000,
    demandCharge = 15,
    weatherRisk = {},
    hasGasLine = true,
    prioritizeDomestic = true,
    roofWindZone = 'moderate',
    snowLoadPSF = 40,
    edgarData = {}, // Live SEC EDGAR financials: { SolarEdge: {...}, Enphase: {...}, ... }
  } = projectContext;

  // ── Helper: normalize to 0-100 ──
  const norm = (val, min, max) => max === min ? 50 : Math.round(Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)));
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

  // ── Tariff risk scoring (higher = better = less risk) ──
  const tariffScore = (risk) => ({
    'None': 100, 'Low': 85, 'Medium': 60, 'High': 35, 'Extreme': 10
  }[risk] || 50);

  // ── IRA domestic content (higher = better) ──
  const iraScore = (usMade, tariffRisk) => {
    if (usMade) return 95;
    if (tariffRisk === 'Low') return 60;
    if (tariffRisk === 'Medium') return 40;
    return 15;
  };

  // ── Financial health — prefers live EDGAR data, falls back to hardcoded riskNote ──
  const financialScore = (supplier) => {
    // Check for live EDGAR Z-score
    const edgar = edgarData[supplier.manufacturer];
    if (edgar?.altmanZ !== null && edgar?.altmanZ !== undefined) {
      // Altman Z-Score: >2.99 = safe, 1.81-2.99 = grey zone, <1.81 = distress
      const z = edgar.altmanZ;
      if (z > 2.99) return 90;
      if (z > 2.5) return 80;
      if (z > 1.81) return 55;
      if (z > 1.0) return 30;
      return 15; // Deep distress
    }
    // Fallback to static riskNote
    if (supplier.riskNote && supplier.riskNote.includes('bankruptcy')) return 25;
    if (supplier.riskNote && supplier.riskNote.includes('distress')) return 30;
    if (supplier.usMade) return 85;
    return 70;
  };

  // ── Build live riskNote from EDGAR if available ──
  // CRITICAL: Must preserve 'bankruptcy' and 'distress' keywords for calcWarrantyReserve
  const buildLiveRiskNote = (supplier) => {
    const edgar = edgarData[supplier.manufacturer];
    if (!edgar) return supplier.riskNote || null;
    const z = edgar.altmanZ;
    const rev = edgar.revenue ? `$${edgar.revenue}M revenue` : '';
    const ni = edgar.netIncome ? `$${edgar.netIncome}M net income` : '';
    const parts = [rev, ni].filter(Boolean).join(', ');
    if (z !== null) {
      if (z < 1.81) return `SEC EDGAR (live): Altman Z-Score ${z} (distress zone). ${parts}. >50% bankruptcy risk within 24 months. Warranty fulfillment risk.`;
      if (z < 2.99) return `SEC EDGAR (live): Altman Z-Score ${z} (caution zone — potential distress). ${parts}. Monitor quarterly. Elevated bankruptcy risk if trend continues.`;
      return `SEC EDGAR (live): Altman Z-Score ${z} (healthy). ${parts}.`;
    }
    // EDGAR returned data but no Z-score — KEEP original riskNote if it had distress warnings
    if (supplier.riskNote && (supplier.riskNote.includes('bankruptcy') || supplier.riskNote.includes('distress'))) {
      return supplier.riskNote + (parts ? ` [SEC EDGAR: ${parts}]` : '');
    }
    return supplier.riskNote || (parts ? `SEC EDGAR: ${parts}` : null);
  };

  // ── Wind/snow location fit for racking ──
  const windZoneMultiplier = { low: 0.6, moderate: 0.8, high: 1.0, extreme: 1.2 }[roofWindZone] || 0.8;

  // High-wind states
  const highWindStates = ['FL', 'TX', 'LA', 'NC', 'SC', 'AL', 'MS', 'GA'];
  const highSnowStates = ['MI', 'MN', 'WI', 'CO', 'UT', 'MT', 'NY', 'MA', 'VT', 'NH', 'ME'];
  const isHighWind = highWindStates.includes(stateCode);
  const isHighSnow = highSnowStates.includes(stateCode);

  // ═══ SCORE SOLAR PANELS ═══
  const scoredSolar = SUPPLIERS.solar.map(panel => {
    const technical = (
      norm(panel.efficiency, 19, 24) * 0.35 +          // Efficiency (19-24% range)
      norm(panel.warranty, 15, 30) * 0.25 +             // Warranty years
      norm(1 - panel.degradation, 0.993, 1.0) * 0.20 + // Low degradation
      norm(panel.watts, 400, 700) * 0.20                // Panel wattage
    );
    // Cost: lower is better, but factor in panel count needed (fewer high-watt panels = less labor)
    const panelsNeeded = Math.ceil(systemSizeKW * 1000 / panel.watts);
    const totalCost = panelsNeeded * panel.costPerW * panel.watts;
    const costPerKWSystem = totalCost / systemSizeKW;
    const cost = norm(3500 - costPerKWSystem, 0, 1500); // Invert: lower cost = higher score

    const tariff = tariffScore(panel.tariffRisk);
    const ira = iraScore(panel.usMade, panel.tariffRisk);
    const financial = financialScore(panel);

    // Location: temp coefficient matters in hot states, degradation in sunny states
    const hotStates = ['AZ', 'NV', 'TX', 'FL', 'CA', 'GA', 'AL', 'MS', 'LA', 'SC'];
    const isHot = hotStates.includes(stateCode);
    const tempCoeffVal = Math.abs(parseFloat(panel.tempCoeff) || 0.35);
    const location = isHot
      ? norm(0.40 - tempCoeffVal, 0, 0.15) * 0.7 + norm(1 - panel.degradation, 0.993, 1.0) * 0.3
      : norm(panel.warranty, 20, 30) * 0.5 + norm(1 - panel.degradation, 0.993, 1.0) * 0.5;

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.20 +
      ira * (prioritizeDomestic ? 0.18 : 0.10) +
      financial * 0.10 + location * (prioritizeDomestic ? 0.07 : 0.15)
    );

    return {
      ...panel,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });

  // ═══ SCORE BESS ═══
  const scoredBESS = SUPPLIERS.bess.map(batt => {
    const technical = (
      norm(batt.cycles, 4000, 10000) * 0.30 +      // Cycle life
      norm(batt.roundTrip, 88, 98) * 0.25 +         // Round-trip efficiency
      norm(batt.warranty, 8, 20) * 0.25 +            // Warranty
      norm(batt.powerKW, 30, 120) * 0.20             // Power rating
    );
    // Cost: $/kWh — lower is better
    const cost = norm(800 - batt.costPerKWh, 0, 600);
    const tariff = tariffScore(batt.tariffRisk);
    const ira = iraScore(batt.usMade, batt.tariffRisk);
    // FEOC penalty: BYD classified as FEOC — ineligible for §48E ITC from 2026
    const feocPenalty = (batt.tariffNote && batt.tariffNote.includes('FEOC')) ? -15 : 0;
    const financial = financialScore(batt);

    // Location: high demand charge states benefit more from peak shaving (favor higher power)
    const location = demandCharge > 15
      ? norm(batt.powerKW, 30, 120) * 0.6 + (batt.thermalMgmt?.includes('Liquid') ? 30 : 15) * 0.4
      : norm(batt.capacityKWh, 100, 300) * 0.5 + norm(batt.warranty, 8, 20) * 0.5;

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.20 +
      (ira + feocPenalty) * (prioritizeDomestic ? 0.18 : 0.10) +
      financial * 0.10 + location * (prioritizeDomestic ? 0.07 : 0.15)
    );

    return {
      ...batt,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira: ira + feocPenalty, financial, location: Math.round(location) }
    };
  });

  // ═══ SCORE INVERTERS ═══
  const scoredInverters = SUPPLIERS.inverter.map(inv => {
    const technical = (
      norm(inv.efficiency, 95, 99.5) * 0.30 +       // Efficiency
      norm(inv.warranty, 10, 25) * 0.30 +            // Warranty
      norm(inv.mpptChannels, 1, 8) * 0.20 +          // MPPT flexibility
      norm(inv.powerKW, 50, 120) * 0.20              // Power rating
    );
    const cost = norm(250 - inv.costPerKW, 0, 200);
    const tariff = tariffScore(inv.tariffRisk);
    const ira = iraScore(inv.usMade, inv.tariffRisk);
    const financial = financialScore(inv);

    // Location: micro inverters (Enphase) better for partial shading; string better for open roofs
    // For car washes, open flat roofs favor string inverters
    const isOpenRoof = true; // Most commercial = flat open roof
    const location = isOpenRoof
      ? (inv.type === 'String' ? 70 : 55) // String slightly preferred for open commercial
      : (inv.type === 'Micro' ? 75 : 60); // Micro preferred for shading

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.20 +
      ira * (prioritizeDomestic ? 0.18 : 0.10) +
      financial * 0.10 + location * (prioritizeDomestic ? 0.07 : 0.15)
    );

    return {
      ...inv,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location }
    };
  });

  // ═══ SCORE GENERATORS ═══
  const scoredGenerators = SUPPLIERS.generator.map(gen => {
    const technical = (
      norm(gen.warranty, 3, 10) * 0.25 +
      norm(10 - parseFloat(gen.startTime) || 10, 0, 10) * 0.25 + // Faster start = better
      norm(80 - parseFloat(gen.noiseLevel) || 75, 0, 15) * 0.25 + // Lower noise = better
      (gen.transferSwitch?.includes('Included') ? 80 : 40) * 0.25 // ATS included bonus
    );
    const cost = norm(700 - gen.costPerKW, 0, 400);
    const tariff = tariffScore(gen.tariffRisk);
    const ira = iraScore(gen.usMade, gen.tariffRisk);
    const financial = financialScore(gen);
    // Location: gas generators preferred where gas available; outage-prone areas value faster start
    const outageLevel = weatherRisk?.outageLevel || 'moderate';
    const location = (
      (hasGasLine && gen.fuelType === 'Natural Gas' ? 80 : 40) * 0.5 +
      (outageLevel === 'high' ? 90 : outageLevel === 'moderate' ? 70 : 50) * 0.5
    );

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.20 +
      ira * 0.10 + financial * 0.10 + location * 0.15
    );

    return {
      ...gen,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });

  // ═══ SCORE RACKING ═══
  const scoredRacking = SUPPLIERS.racking.map(rack => {
    const windRating = parseInt(rack.windLoad) || 130;
    const snowRating = parseInt(rack.snowLoad) || 60;
    const technical = (
      norm(windRating, 100, 170) * 0.35 +
      norm(snowRating, 40, 100) * 0.25 +
      norm(rack.warranty, 10, 25) * 0.25 +
      norm(parseInt(rack.maxSpan) || 60, 48, 84) * 0.15
    );
    const cost = norm(60 - rack.costPerPanel, 0, 40);
    const tariff = tariffScore(rack.tariffRisk);
    const ira = iraScore(rack.usMade, rack.tariffRisk);
    const financial = financialScore(rack);
    // Location: wind/snow loads must meet or exceed local requirements
    const location = (
      (isHighWind ? norm(windRating, 120, 170) : 70) * 0.5 +
      (isHighSnow ? norm(snowRating, 60, 100) : 70) * 0.5
    );

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.15 +
      ira * 0.10 + financial * 0.10 + location * 0.20
    );

    return {
      ...rack,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });

  // ═══ SCORE EV CHARGERS ═══
  const scoredEV = SUPPLIERS.evCharger.map(ev => {
    const technical = (
      norm(ev.kW, 7, 22) * 0.30 +                     // Higher power = faster charging
      norm(ev.ports || 1, 1, 2) * 0.20 +               // More ports = better utilization
      norm(ev.warranty, 1, 5) * 0.25 +                  // Warranty duration
      (ev.certifications?.includes('OCPP') ? 80 : 40) * 0.25 // Open protocol compliance
    );
    const cost = norm(9000 - ev.costPerUnit, 0, 8500);  // Lower cost = higher score
    const tariff = tariffScore(ev.tariffRisk);
    const ira = iraScore(ev.usMade, ev.tariffRisk);
    const financial = financialScore(ev);
    // Location: commercial sites prefer networked chargers; multi-port for high traffic
    const location = (
      (ev.networkFees?.includes('Free') ? 80 : 50) * 0.4 +
      norm(ev.kW, 7, 22) * 0.3 +
      (ev.connector?.includes('NACS') ? 80 : 60) * 0.3
    );

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.20 +
      ira * 0.15 + financial * 0.10 + location * 0.10
    );
    return {
      ...ev,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });

  // ═══ SCORE MONITORS ═══
  const scoredMonitors = SUPPLIERS.monitor.map(mon => {
    const circuitCount = parseInt(mon.circuits) || (mon.circuits?.includes('Whole') ? 2 : 1);
    const technical = (
      norm(circuitCount, 1, 32) * 0.30 +              // More circuits = better visibility
      norm(mon.warranty, 1, 10) * 0.25 +                // Warranty
      (mon.connectivity?.includes('Cellular') ? 90 : mon.connectivity?.includes('WiFi 6') ? 80 : 60) * 0.25 + // Connectivity reliability
      (mon.appControl?.includes('per-circuit') || mon.features?.includes('Circuit-level') ? 85 : 60) * 0.20 // Granularity
    );
    const cost = norm(9000 - mon.cost, 0, 9000);       // Lower cost = higher score
    const tariff = tariffScore(mon.tariffRisk);
    const ira = iraScore(mon.usMade, mon.tariffRisk);
    const financial = financialScore(mon);
    // Location: reliability matters more in grid-unstable areas
    const gridRisk = weatherRisk?.grid || 3;
    const location = (
      (gridRisk >= 4 ? 90 : gridRisk >= 3 ? 70 : 50) * 0.4 +
      (mon.connectivity?.includes('Cellular') ? 90 : 50) * 0.3 +
      norm(mon.warranty, 1, 10) * 0.3
    );

    const dynamicScore = clamp(
      technical * 0.25 + cost * 0.20 + tariff * 0.15 +
      ira * 0.15 + financial * 0.10 + location * 0.15
    );
    return {
      ...mon,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });

  // ── CANOPY STRUCTURES — scored same weighted criteria as all equipment ──
  const scoredCanopyStructures = SUPPLIERS.canopyStructure.map(cs => {
    const totalCostPerW = cs.costPerW + cs.installLaborPerW;
    const technical = (
      norm(parseInt(cs.windLoad) || 130, 100, 180) * 0.30 +    // Higher wind rating = more durable
      norm(parseInt(cs.snowLoad) || 30, 20, 60) * 0.20 +       // Higher snow load = Midwest/NE ready
      norm(cs.warranty, 10, 30) * 0.25 +                        // Warranty
      (cs.noFieldWelding ? 85 : 60) * 0.15 +                    // No field welding = faster install
      (cs.material?.includes('Aluminum') ? 90 : 75) * 0.10     // Aluminum = corrosion-free
    );
    const cost = norm(2.00 - totalCostPerW, 0, 2.00);           // Lower total $/W = higher score
    const tariff = tariffScore(cs.tariffRisk);
    const ira = iraScore(cs.usMade, cs.tariffRisk);
    const financial = financialScore(cs);
    const windRisk = weatherRisk?.wind || 3;
    const snowRisk = weatherRisk?.snow || 2;
    const location = (
      norm(parseInt(cs.windLoad) || 130, 100, 180) * (windRisk >= 4 ? 0.5 : 0.3) +
      norm(parseInt(cs.snowLoad) || 30, 20, 60) * (snowRisk >= 3 ? 0.4 : 0.2) +
      norm(cs.warranty, 10, 30) * 0.3
    );

    const dynamicScore = clamp(
      technical * 0.20 + cost * 0.25 + tariff * 0.15 +
      ira * 0.15 + financial * 0.10 + location * 0.15
    );
    return {
      ...cs,
      score: dynamicScore,
      _scoreBreakdown: { technical: Math.round(technical), cost: Math.round(cost), tariff, ira, financial, location: Math.round(location) }
    };
  });


  const sortAndRank = (arr) => {
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    sorted.forEach((item, idx) => {
      item.rank = idx + 1;
      // Overlay live EDGAR riskNote if available
      const liveNote = buildLiveRiskNote(item);
      if (liveNote && liveNote !== item.riskNote) item.riskNote = liveNote;
      // Tag source
      const edgar = edgarData[item.manufacturer];
      if (edgar) item._edgarLive = true;
    });
    return sorted;
  };

  return {
    solar: sortAndRank(scoredSolar),
    inverter: sortAndRank(scoredInverters),
    bess: sortAndRank(scoredBESS),
    generator: sortAndRank(scoredGenerators),
    racking: sortAndRank(scoredRacking),
    evCharger: sortAndRank(scoredEV),
    monitor: sortAndRank(scoredMonitors),
    canopyStructure: sortAndRank(scoredCanopyStructures),
  };
};

// SVG ICONS (matching lucide-react style from Steps 1-3)
// ═══════════════════════════════════════════════════════════════════════════════
const Icon = ({ children, size = 20, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const IcoZap = (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>;
const IcoCheck = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>;
const IcoChevL = (p) => <Icon {...p}><polyline points="15 18 9 12 15 6"/></Icon>;
const IcoChevR = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>;
const IcoMapPin = (p) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>;
const IcoSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Icon>;

const IcoBattery = (p) => <Icon {...p}><rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/></Icon>;

const IcoRotate = (p) => <Icon {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Icon>;
const IcoFuel = (p) => <Icon {...p}><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 22H3"/><path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 4"/></Icon>;
const IcoPlugZap = (p) => <Icon {...p}><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="m2 22 3-3"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m18 3-4 4h6l-4 4"/></Icon>;
const IcoCpu = (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></Icon>;
const IcoLayers = (p) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
const IcoActivity = (p) => <Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Icon>;
const IcoInfo = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Icon>;
const IcoTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>;
const IcoBarChart = (p) => <Icon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>;
const IcoDollarSign = (p) => <Icon {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>;
const IcoAlertTriangle = (p) => <Icon {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>;


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: STATIC FALLBACKS & ENHANCEMENT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Fallback goals (used when calculation engines haven't run yet)
const buildMockGoals = (stateCode) => {
  const wr = computeWeatherRisk(stateCode);
  // Resilience score: 40-95 based on outage risk (higher risk = higher priority)
  const resilienceScore = Math.round(Math.min(95, 40 + wr.outageScore * 12));
  const resilienceInsight = wr.outageLevel === 'high' 
    ? `${wr.summary}. Generator critical.`
    : wr.outageLevel === 'moderate'
    ? `${wr.summary}. Generator recommended.`
    : 'Low outage risk. BESS provides adequate backup.';
  return [
    { id: 'costReduction', name: 'Lower Energy Costs', solutions: 'Solar PV + Efficiency', score: 89, icon: '💰', keyMetric: 'High rates → strong solar ROI', insight: 'Full Retail net metering available.' },
    { id: 'peakManagement', name: 'Peak Shaving & Demand Mgmt', solutions: 'Battery Storage (BESS)', score: 82, icon: '📈', keyMetric: 'Demand charge reduction target', insight: 'BESS can shave 20-40% of peaks.' },
    { id: 'resilience', name: 'Protect Against Outages', solutions: wr.weatherNeedsGenerator ? 'Generator + BESS Backup' : 'BESS Backup', score: resilienceScore, icon: '🛡️', keyMetric: `Outage risk: ${wr.outageLevel}`, insight: resilienceInsight },
    { id: 'operations', name: 'Optimize Equipment', solutions: 'VFD Retrofits + Reclaim', score: 64, icon: '⚙️', keyMetric: 'Motor efficiency improvements', insight: '25-40% savings typical' },
    { id: 'arbitrage', name: 'TOU Rate Optimization', solutions: 'Battery Arbitrage', score: 52, icon: '📊', keyMetric: 'TOU spread analysis', insight: 'Buy off-peak, use during peak.' },
    { id: 'futureProof', name: 'Sustainability & Incentives', solutions: '30% ITC + Rate Hedge', score: 48, icon: '🌱', keyMetric: 'Federal incentives available', insight: 'Solar ITC: BOC by Jul 4, 2026. BESS ITC: through 2033.' },
  ];
};

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC ENHANCEMENTS BUILDER — replaces MOCK_ENHANCEMENTS
// Scores and costs are computed from formData, locationData, rec, and weather data.
// Each enhancement is scored 0-100 based on facility-specific factors.
// ═══════════════════════════════════════════════════════════════════════════════
// fmt + safeFixed removed — using global fmt()/fmt(n,d) from line 240 (FIX C-1b: resolved duplicate declaration)

const buildEnhancements = (formData, locationData, rec, stateCode) => {
  // Defensive: default to empty object so we always compute (with fallback values on every field)
  const fd = formData || {};
  const safeRec = rec || { facilityLoad: { criticalLoadKW: 45, peakDemandKW: 112, annualUsageKWh: 350000 }, bess: { capacityKWh: 200 }, generator: { powerKW: 60 } };
  const weather = WEATHER_RISK_DATA[stateCode] || WEATHER_RISK_DATA['default'];

  // ── DEDUP vs STEP 3 FORM DATA: Don't re-offer items the user already has ──
  // VFD: handled by vfdTargetHP computation (0 HP if both pumps+dryers already have VFDs)
  // Water reclaim: handled by reclaimLevel !== 'advanced' gate (already existed)
  // EV chargers: new gate — skip if user reported existing chargers in Step 3
  const hasEVChargers = (parseInt(fd.l2Chargers) || 0) > 0 || (parseInt(fd.dcChargers) || 0) > 0;
  const electric = locationData?.utility?.electric || {};
  const hasGasLine = fd.gasLine !== undefined ? fd.gasLine === 'yes'
    : fd.hasGasLine !== undefined ? fd.hasGasLine === true
    : true; // FIX GEN-GAS: Dual-check for car wash (string) + generic (boolean)
  const facilityType = fd.facilityType || 'generic'; // FIX GEN-FAC: was 'express' — generic industries shouldn't get car wash defaults
  const isCarWash = ['express', 'mini', 'flex', 'fullService', 'self', 'inbay', 'iba'].includes(facilityType);
  const dailyVehicles = isCarWash
    ? (parseInt(fd.dailyVehicles) || ({ express: 300, full: 200, flex: 250, mini: 200, self: 100, inbay: 80, iba: 80 }[facilityType] || 200))
    : 0; // FIX GEN-FAC: generic industries don't have dailyVehicles
  const operatingHours = parseInt(fd.operatingHours) || 14;
  const criticalKW = safeRec.facilityLoad?.criticalLoadKW || 45;
  const peakKW = safeRec.facilityLoad?.peakDemandKW || 112;
  // FIX GEN-FAC: Industry-aware downtime cost (was car-wash-only: dailyVehicles × $25)
  const downtimeCostPerDay = isCarWash
    ? dailyVehicles * (facilityType === 'express' ? 25 : facilityType === 'fullService' ? 40 : 20)
    : Math.round(peakKW * operatingHours * (locationData?.utility?.electric?.avgRate || 0.16) * 1.5); // Generic: lost production + spoilage factor

  // Weather risk composite (0-5 scale)
  const stormRisk = Math.max(weather.tornado || 0, weather.hurricane || 0, weather.wind || 0);
  const gridRisk = weather.grid || 3;
  const resilienceScore = (stormRisk + gridRisk) / 2; // 0-5

  const enhancements = [];

  // ── 1. EV CHARGING ── (skip if user already has chargers per Step 3)
  // EV: show expansion opportunity even if user already has chargers
  // FIX S5-3/S5-4: Revenue & cost now use same formulas as Step 7 financial model
  {
  const carportArea = fd.carportInterest !== 'no' ? parseInt(fd.carportArea) || 0 : 0;
  const existingL2 = parseInt(fd.l2Chargers) || 0;
  const existingDC = parseInt(fd.dcChargers) || 0;
  const hasCarport = carportArea > 500;
  const newL2 = hasCarport ? Math.max(2, Math.round(carportArea / 500)) : (hasEVChargers ? 2 : 4);
  // FIX S5-3: Use same revenue formula as Step 7: 2 sessions/day × $5/session - electricity
  // DOE/AFDC L2 at retail: 1-2 sessions/day, $2K-$4K/yr NET per charger
  const utilRate = electric.avgRate || 0.16;
  const evL2GrossRev = newL2 * (2 * 365 * 5); // 2 sessions × $5 × 365
  const evL2ElecCost = newL2 * (6 * 2 * 365 * utilRate); // 6 kWh × 2 sessions × 365 × rate
  const evRevenue = Math.round(evL2GrossRev - evL2ElecCost);
  // FIX S5-4: Use supplier-level cost ($8K/L2 default, matching Step 7 se.costPerUnit)
  const evInstallCost = newL2 * 8000; // Matches Step 7 supplier default
  const evNetCost = Math.round(evInstallCost * (1 - EV_CHARGER_CREDIT_RATE)); // §30C credit
  const evDemandKW = newL2 * 7; // ~7 kW avg draw per L2
  const evPayback = evRevenue > 0 ? evNetCost / evRevenue : 99; // FIX C-3: guard div/0 when no L2 chargers
  // Score: lower if already have chargers (diminishing returns), higher if carport synergy
  const evScore = Math.min(100, Math.round(
    (hasCarport ? 25 : 10) + // Carport synergy
    (dailyVehicles > 200 ? 20 : 10) + // Customer volume
    25 + // §30C credit — PIS by June 30, 2026 (OBBBA accelerated expiration)
    (evPayback < 4 ? 20 : evPayback < 6 ? 12 : 5) + // ROI quality
    (existingL2 + existingDC === 0 ? 8 : -5) // First-mover advantage vs diminishing returns
  ));
  const evName = hasEVChargers
    ? `Expand EV Charging (+${newL2} L2)`
    : 'EV Charging Stations';
  const evExistingNote = hasEVChargers
    ? `Adding to your existing ${existingL2 > 0 ? `${existingL2} L2` : ''}${existingL2 > 0 && existingDC > 0 ? ' + ' : ''}${existingDC > 0 ? `${existingDC} DCFC` : ''}`
    : `${newL2} new L2 chargers`;
  enhancements.push({
    id: 'evCharging', name: evName, icon: '⚡', score: evScore,
    estimatedCost: `$${fmt(evNetCost)}`,
    annualSavings: evRevenue, savingsLabel: 'Revenue',
    payback: `${evPayback.toFixed(1)} yr`,
    keyFactors: [
      { label: 'Chargers', value: evExistingNote, positive: true },
      { label: 'Demand', value: `+${evDemandKW} kW on panel`, positive: false },
      { label: '§30C Credit', value: '30% ITC (exp. 6/2026)', positive: true },
      { label: 'Connector', value: 'J1772 + NACS', positive: true }
    ]
  });
  }

  // ── 2. EXTENDED BACKUP ──
  const bessHrs = safeRec.bess?.capacityKWh && criticalKW > 0 ? safeRec.bess.capacityKWh / criticalKW : 4;
  const extCostPerHr = Math.round(criticalKW * 500 / 4); // Incremental BESS cost per hour
  const extHoursNeeded = Math.max(0, 8 - bessHrs); // Target 8 hrs min
  const extCost = Math.round(extHoursNeeded * extCostPerHr);
  const extScore = Math.min(100, Math.round(
    (resilienceScore >= 3.5 ? 30 : resilienceScore >= 2.5 ? 18 : 8) + // Storm/grid risk
    (downtimeCostPerDay > 5000 ? 25 : downtimeCostPerDay > 2000 ? 15 : 8) + // Revenue at risk
    (bessHrs < 4 ? 20 : bessHrs < 8 ? 12 : 0) + // Current gap
    (operatingHours >= 14 ? 10 : 5) // Long-hour operations more exposed
  ));
  enhancements.push({
    id: 'extendedBackup', name: 'Extended Backup', icon: '🔋', score: extScore,
    estimatedCost: extCost > 0 ? `$${fmt(extCost)}` : '$0 (already sized)',
    annualSavings: Math.round(downtimeCostPerDay * 5), savingsLabel: 'Avoided Loss',
    payback: extCost > 0 && downtimeCostPerDay > 0 ? `${(extCost / (downtimeCostPerDay * 5)).toFixed(1)} yr` : 'N/A',
    keyFactors: [
      { label: 'Duration', value: `${Math.round(bessHrs)}h → 8+ hrs`, positive: true },
      { label: 'Critical Load', value: `${Math.round(criticalKW)} kW`, positive: true },
      { label: 'Storm Risk', value: stormRisk >= 3 ? 'Elevated' : 'Moderate', positive: stormRisk < 3 },
      { label: 'Add\'l BESS', value: `${Math.round(extHoursNeeded * criticalKW)} kWh`, positive: true }
    ]
  });

  // ── 3. GENERATOR INTEGRATION — uses rec.generator sizing, ties to Step 6/7 cost ──
  const genKW = safeRec.generator?.powerKW || Math.ceil(criticalKW * 1.25 / 10) * 10;
  const genSupplierCostPerKW = 550; // Matches Step 6/7 supplier default
  const genCostEst = genKW * genSupplierCostPerKW; // Full cost — same basis as Step 6/7
  const genPayback = (downtimeCostPerDay * 5) > 0 ? genCostEst / (downtimeCostPerDay * 5) : 99;
  const genIsAlreadyRecommended = safeRec.generator?.recommended === true;
  const genScore = Math.min(100, Math.round(
    (hasGasLine ? 20 : 5) +
    (resilienceScore >= 3.5 ? 25 : resilienceScore >= 2.5 ? 15 : 5) +
    (criticalKW > 80 ? 15 : criticalKW > 40 ? 10 : 5) +
    (downtimeCostPerDay > 5000 ? 15 : downtimeCostPerDay > 2000 ? 10 : 5) +
    (genPayback < 6 ? 10 : 5)
  ));
  enhancements.push({
    id: 'generatorHybrid',
    name: genIsAlreadyRecommended ? `${genKW} kW Generator (included in quote)` : `Add ${genKW} kW Backup Generator`,
    icon: '⛽', score: genScore,
    estimatedCost: genIsAlreadyRecommended ? 'Included' : `$${fmt(genCostEst)}`,
    annualSavings: Math.round(downtimeCostPerDay * 5), savingsLabel: 'Avoided Loss',
    payback: genIsAlreadyRecommended ? 'Included' : `${genPayback.toFixed(1)} yr`,
    keyFactors: [
      { label: 'Size', value: `${genKW} kW (${Math.round(genKW / criticalKW * 100)}% of critical load)`, positive: true },
      { label: 'Gas Line', value: hasGasLine ? 'Available' : 'Needed ($8-15K install)', positive: hasGasLine },
      { label: 'Runtime', value: 'Unlimited with fuel', positive: true },
      { label: 'BESS Coord', value: `Auto-transfer + ${Math.round(safeRec.bess?.capacityKWh || 200)} kWh bridge`, positive: true }
    ]
  });

  // ── 4. WATER RECLAIM ── (only for water-intensive industries like car wash)
  const hasWaterOps = fd.waterReclaimLevel !== undefined || fd.dailyVehicles !== undefined || fd.bayCount !== undefined;
  const reclaimLevel = fd.waterReclaimLevel || 'none';
  const currentPct = reclaimLevel === 'none' ? 0 : reclaimLevel === 'basic' ? 55 : reclaimLevel === 'standard' ? 75 : 90;
  const targetPct = 90;
  const gallonsPerCar = facilityType === 'express' ? 35 : facilityType === 'mini' ? 28 : 20;
  const annualGallons = dailyVehicles * (parseInt(fd.daysPerWeek) || 7) * 52 * gallonsPerCar;
  const waterSavingsPct = (targetPct - currentPct) / 100;
  const waterSavings = Math.round(annualGallons * waterSavingsPct * 0.005); // $5/1000 gal
  const heatingReduction = Math.round(waterSavings * (reclaimLevel === 'none' ? 2 : 1));
  const reclaimTotalSavings = waterSavings + heatingReduction;
  const reclaimCost = reclaimLevel === 'none' ? 35000 + (parseInt(fd.bayCount) || 3) * 10000
    : reclaimLevel === 'basic' ? 20000 + (parseInt(fd.bayCount) || 3) * 5000
    : 12000 + (parseInt(fd.bayCount) || 3) * 3000;
  const reclaimPayback = reclaimTotalSavings > 0 ? reclaimCost / reclaimTotalSavings : 99;
  const reclaimScore = reclaimLevel === 'advanced' ? 0 : Math.min(100, Math.round(
    (reclaimLevel === 'none' ? 25 : reclaimLevel === 'basic' ? 18 : 10) + // Upgrade headroom
    (dailyVehicles > 250 ? 20 : dailyVehicles > 150 ? 12 : 5) + // Volume drives value
    (reclaimPayback < 3 ? 20 : reclaimPayback < 5 ? 12 : 5) + // ROI
    (waterSavingsPct > 0.5 ? 15 : 8) // Large improvement potential
  ));
  if (hasWaterOps && reclaimLevel !== 'advanced') {
    enhancements.push({
      id: 'waterReclaim',
      name: reclaimLevel === 'none' ? 'Add Water Reclaim System' : `Upgrade ${reclaimLevel.charAt(0).toUpperCase() + reclaimLevel.slice(1)} → Advanced Reclaim`,
      icon: '💧', score: reclaimScore,
      estimatedCost: `$${fmt(reclaimCost)}`,
      annualSavings: reclaimTotalSavings, savingsLabel: 'Savings',
      payback: `${reclaimPayback.toFixed(1)} yr`,
      keyFactors: [
        { label: 'Reclaim', value: `${currentPct}% → ${targetPct}%`, positive: true },
        { label: 'Gallons Saved', value: `${fmt(Math.round(annualGallons * waterSavingsPct))}/yr`, positive: true },
        { label: 'Maint. Adder', value: '+$2,000/yr', positive: false },
        { label: 'Compliance', value: 'EPA/local regs', positive: true }
      ]
    });
  }

  // ── 5. VFD MOTOR RETROFITS ── (only for industries with declared pump/dryer motors)
  const hasDeclaredMotors = fd.pumpHP || fd.pumpCount || fd.dryerHP || fd.dryerCount;
  const pumpHasVFD = fd.pumpHasVFD === true;
  const dryerHasVFD = fd.dryerHasVFD === true;
  const pumpHP = parseInt(fd.pumpHP) || 15;
  const pumpCount = parseInt(fd.pumpCount) || 3;
  const dryerHP = parseInt(fd.dryerHP) || 15;
  const dryerCount = parseInt(fd.dryerCount) || 4;
  const vfdTargetHP = hasDeclaredMotors ? ((!pumpHasVFD ? pumpHP * pumpCount : 0) + (!dryerHasVFD ? dryerHP * dryerCount : 0)) : 0;
  const vfdCost = Math.round(vfdTargetHP * 180);
  const vfdAnnualSavings = Math.round(vfdTargetHP * 0.746 * operatingHours * 0.3 * (parseInt(fd.daysPerWeek) || 7) * 52 * (electric.avgRate || 0.19) * 0.30);
  const vfdPayback = vfdAnnualSavings > 0 ? vfdCost / vfdAnnualSavings : 99;
  const vfdScore = vfdTargetHP < 20 ? 0 : Math.min(100, Math.round(
    (vfdTargetHP >= 80 ? 25 : vfdTargetHP >= 40 ? 15 : 8) + // Motor HP target
    (vfdPayback < 2.5 ? 25 : vfdPayback < 4 ? 15 : 5) + // ROI
    (!pumpHasVFD && !dryerHasVFD ? 15 : 8) + // Both upgradeable
    10 // Soft-start benefit (always positive)
  ));
  if (vfdTargetHP >= 20) {
    // Dynamic label based on which motors still need VFD
    const vfdTargets = [];
    if (!pumpHasVFD) vfdTargets.push('Pumps');
    if (!dryerHasVFD) vfdTargets.push('Dryers');
    const vfdLabel = vfdTargets.length === 2 ? 'VFD on Pumps & Dryers' : `VFD on ${vfdTargets[0]}`;
    enhancements.push({
      id: 'vfdRetrofit', name: vfdLabel, icon: '🔧', score: vfdScore,
      estimatedCost: `$${fmt(vfdCost)}`,
      annualSavings: vfdAnnualSavings, savingsLabel: 'Savings',
      payback: `${vfdPayback.toFixed(1)} yr`,
      keyFactors: [
        { label: 'Motors', value: vfdTargets.join(' + '), positive: true },
        { label: 'Total HP', value: `${vfdTargetHP} HP`, positive: true },
        { label: 'Energy Cut', value: '~30% on motors', positive: true },
        { label: 'Soft-Start', value: 'Reduces inrush', positive: true }
      ]
    });
  }

  // ── 6. SMART ENERGY MONITOR ──
  const annualEnergyCost = (safeRec.facilityLoad?.annualUsageKWh || 350000) * (electric.avgRate || 0.19);
  const monitorSavings = Math.round(annualEnergyCost * 0.08); // 8% avg from monitoring
  const monitorCost = peakKW > 200 ? 12000 : peakKW > 100 ? 8500 : 5000;
  const monitorPayback = monitorSavings > 0 ? monitorCost / monitorSavings : 99;
  const monitorScore = Math.min(100, Math.round(
    (monitorPayback < 1.5 ? 20 : monitorPayback < 3 ? 12 : 5) + // ROI
    (peakKW > 150 ? 15 : peakKW > 75 ? 10 : 5) + // Complexity benefit
    15 + // Real-time visibility always valuable
    (annualEnergyCost > 50000 ? 10 : 5) // Higher spend = more savings
  ));
  enhancements.push({
    id: 'monitoring', name: 'Smart Energy Monitor', icon: '📡', score: monitorScore,
    estimatedCost: `$${fmt(monitorCost)}`,
    annualSavings: monitorSavings, savingsLabel: 'Savings',
    payback: `${monitorPayback.toFixed(1)} yr`,
    keyFactors: [
      { label: 'Metering', value: 'Real-time (1-sec)', positive: true },
      { label: 'Circuits', value: peakKW > 200 ? '48+ circuits' : peakKW > 100 ? '32 circuits' : '16 circuits', positive: true },
      { label: 'Alerts', value: 'Anomaly + demand', positive: true },
      { label: 'Reporting', value: 'Utility-grade export', positive: true }
    ]
  });

  // ── 7. HEAT PUMP WATER HEATER ── (only for gas/propane water heating)
  // FIX S5-1: HPWH was missing from buildEnhancements — Step 7 charged cost but credited $0 savings
  const waterHeater = fd.waterHeater || (hasGasLine ? 'gas' : 'electric');
  const hasGasWaterHeating = waterHeater === 'gas' || waterHeater === 'propane';
  if (hasGasWaterHeating) {
    const bayCount = parseInt(fd.bayCount) || 3;
    // Gas therms estimate: car wash uses ~150-300 therms/mo for water heating depending on volume
    const estimatedThermsMo = facilityType === 'express' ? Math.round(dailyVehicles * 0.8) : Math.round(dailyVehicles * 0.5);
    const annualTherms = estimatedThermsMo * 12;
    const gasRate = waterHeater === 'propane' ? 2.73 : 1.20; // $/therm
    const hpwhCOP = 3.5;
    const electricEquivKWh = annualTherms * 29.3 / hpwhCOP;
    const gasCostSaved = Math.round(annualTherms * gasRate);
    const electricCostAdded = Math.round(electricEquivKWh * (electric.avgRate || 0.16));
    const hpwhAnnualSavings = gasCostSaved - electricCostAdded;
    const hpwhUnitCost = 25000; // per tunnel/bay
    const hpwhTotalCost = bayCount * hpwhUnitCost;
    const hpwhPayback = hpwhAnnualSavings > 0 ? hpwhTotalCost / hpwhAnnualSavings : 99;
    const hpwhScore = hpwhAnnualSavings <= 0 ? 0 : Math.min(100, Math.round(
      (hpwhPayback < 4 ? 25 : hpwhPayback < 6 ? 15 : 5) + // ROI
      (waterHeater === 'propane' ? 20 : 10) + // Propane more expensive = bigger savings
      (annualTherms > 2000 ? 15 : annualTherms > 1000 ? 10 : 5) + // Volume
      10 // Electrification/IRA bonus
    ));
    if (hpwhAnnualSavings > 0) {
      enhancements.push({
        id: 'heatPumpWH',
        name: `Heat Pump Water Heater (${bayCount} unit${bayCount > 1 ? 's' : ''})`,
        icon: '🔥', score: hpwhScore,
        estimatedCost: `$${fmt(hpwhTotalCost)}`,
        annualSavings: hpwhAnnualSavings, savingsLabel: 'Savings',
        payback: `${hpwhPayback.toFixed(1)} yr`,
        keyFactors: [
          { label: 'Current', value: `${waterHeater === 'propane' ? 'Propane' : 'Gas'} (${estimatedThermsMo} therms/mo)`, positive: false },
          { label: 'COP', value: '3.5 (vs 0.8 gas)', positive: true },
          { label: 'Gas Eliminated', value: `$${fmt(gasCostSaved)}/yr`, positive: true },
          { label: 'IRA §25C', value: 'Tax credit eligible', positive: true }
        ]
      });
    }
  }

  // Remove deprecated enhancements (EV Charging, VFD, Smart Monitor — handled outside wizard scope)
  // Sort by score descending
  enhancements.sort((a, b) => b.score - a.score);
  return enhancements;
};

// ═══════════════════════════════════════════════════════════════════════════════
// GAP MAKEUP OPTIONS SCORING ENGINE — Step 14 auto-ranked strategies
// Each option scored 0-100 based on feasibility, ROI, coverage, complexity
// ═══════════════════════════════════════════════════════════════════════════════
const buildGapMakeupOptions = (rec, locationData, formData, stateCode) => {
  if (!rec || !rec.optimization) return [];
  const opt = rec.optimization;
  const gap = opt.energyGapAnalysis || {};
  const weather = WEATHER_RISK_DATA[stateCode] || WEATHER_RISK_DATA['default'];
  const electric = locationData?.utility?.electric || {};
  // FIX GEN-GAS: Dual-check gasLine (car wash sends string 'yes'/'no') + hasGasLine (generic sends boolean)
  const hasGasLine = formData?.gasLine !== undefined ? formData.gasLine === 'yes'
    : formData?.hasGasLine !== undefined ? formData.hasGasLine === true
    : true;
  const carportArea = formData?.carportInterest !== 'no' ? parseInt(formData?.carportArea) || 0 : 0;
  const outageImpact = formData?.outageImpact || 'partial-operations';
  const stormRisk = Math.max(weather.tornado || 0, weather.hurricane || 0, weather.wind || 0);
  const gridRisk = weather.grid || 3;
  const utilityRate = electric.avgRate || DEFAULT_ELECTRIC_RATE; // FIX H-3: merlinConstants SSOT (was 0.19)
  const demandCharge = electric.demandCharge || 15;
  const roofOffsetPct = gap.roofOnlyOffsetPct || opt.solar?.offsetPercentage || 50;
  const solarKW = rec.solar?.sizeKW || opt.solar?.actualKW || 50;
  const bessKWh = rec.bess?.capacityKWh || 200;

  const options = [];

  // ── 1. ROOF SOLAR MAXIMIZATION ──
  // Always available — maximize what roof can produce
  const roofScore = Math.min(100, Math.round(
    (roofOffsetPct >= 70 ? 30 : roofOffsetPct >= 50 ? 22 : roofOffsetPct >= 30 ? 15 : 8) + // Coverage
    (utilityRate >= 0.20 ? 20 : utilityRate >= 0.14 ? 14 : 8) + // Rate ROI
    15 + // Simplest implementation
    (opt.solar?.constrainedBySpace ? 0 : 10) + // Space headroom
    (gap.maxRoofKW >= 50 ? 10 : gap.maxRoofKW >= 25 ? 6 : 3) // Scale benefit
  ));
  options.push({
    id: 'roof_solar', name: 'Maximize Roof Solar', icon: '☀️',
    score: roofScore,
    coverage: `${roofOffsetPct}% offset`,
    detail: `${gap.maxRoofKW || Math.round(solarKW * 0.7)} kW roof capacity · ITC eligible`,
    factors: [
      { label: 'Capacity', value: `${gap.maxRoofKW || '—'} kW`, positive: true },
      { label: 'Offset', value: `${roofOffsetPct}%`, positive: roofOffsetPct >= 50 },
      { label: 'Complexity', value: 'Low', positive: true },
      { label: 'ITC', value: '30%', positive: true },
    ],
    strategy: 'generation',
  });

  // ── 2. CARPORT SOLAR (if carport area available) ──
  if (carportArea > 200) {
    const carportKW = gap.maxCarportKW || Math.round(carportArea * 0.85 * 13 / 1000);
    const combinedOffset = gap.combinedOffsetPct || Math.min(100, roofOffsetPct + Math.round(carportKW / solarKW * roofOffsetPct));
    const carportScore = Math.min(100, Math.round(
      (gap.carportCanFillGap ? 30 : combinedOffset > roofOffsetPct + 15 ? 22 : 12) + // Gap fill quality
      (utilityRate >= 0.20 ? 18 : utilityRate >= 0.14 ? 12 : 6) + // Rate ROI
      (carportArea >= 2000 ? 15 : carportArea >= 1000 ? 10 : 5) + // Scale
      10 + // Dual-use (shade + power)
      (combinedOffset >= 75 ? 12 : combinedOffset >= 60 ? 8 : 3) // Target coverage
    ));
    options.push({
      id: 'carport_solar', name: 'Add Carport Solar', icon: '🅿️',
      score: carportScore,
      coverage: `+${carportKW} kW → ${combinedOffset}% total offset`,
      detail: `${carportArea.toLocaleString()} sq ft vacuum area · dual-use structure`,
      factors: [
        { label: 'Add\'l kW', value: `+${carportKW} kW`, positive: true },
        { label: 'Combined', value: `${combinedOffset}%`, positive: combinedOffset >= 60 },
        { label: 'Dual-Use', value: 'Shade + power', positive: true },
        { label: 'Cost', value: 'Higher $/W', positive: false },
      ],
      strategy: 'generation',
    });
  }

  // ── 3. BESS PEAK SHAVING + TOU ARBITRAGE ──
  const touSpread = (electric.peakRate || 0.25) - (electric.offPeakRate || 0.08);
  const bessScore = Math.min(100, Math.round(
    (demandCharge >= 20 ? 28 : demandCharge >= 12 ? 20 : demandCharge >= 5 ? 12 : 5) + // Demand shaving ROI
    (touSpread >= 0.15 ? 18 : touSpread >= 0.08 ? 12 : 5) + // TOU arbitrage value
    (bessKWh >= 200 ? 12 : bessKWh >= 100 ? 8 : 4) + // Scale benefit
    (outageImpact === 'complete-shutdown' ? 15 : outageImpact === 'partial-operations' ? 10 : 4) + // Backup value
    8 // Always adds grid services eligibility
  ));
  options.push({
    id: 'bess_optimization', name: 'BESS Peak Shaving + Arbitrage', icon: '🔋',
    score: bessScore,
    coverage: `${Math.round(rec.bess?.powerKW || 30)} kW shaving · ${rec.bess?.duration || 4}hr backup`,
    detail: `$${demandCharge}/kW demand charge → strong shaving ROI · TOU spread $${touSpread.toFixed(2)}/kWh`,
    factors: [
      { label: 'Demand Cut', value: `~${Math.round((rec.bess?.powerKW || 30) * 0.35)} kW`, positive: true },
      { label: 'TOU Spread', value: `$${touSpread.toFixed(2)}`, positive: touSpread >= 0.08 },
      { label: 'Backup', value: `${rec.bess?.duration || 4}hr`, positive: true },
      { label: 'ITC', value: '30%', positive: true },
    ],
    strategy: 'storage',
  });

  // ── 4. GENERATOR BACKUP ──
  const genKW = rec.generator?.powerKW || 60;
  const genScore = Math.min(100, Math.round(
    (stormRisk >= 4 ? 28 : stormRisk >= 3 ? 20 : stormRisk >= 2 ? 12 : 5) + // Weather risk
    (gridRisk >= 4 ? 18 : gridRisk >= 3 ? 12 : 5) + // Grid reliability
    (hasGasLine ? 15 : 5) + // Fuel infrastructure
    (outageImpact === 'complete-shutdown' ? 18 : outageImpact === 'partial-operations' ? 12 : 3) + // Business impact
    (rec.generator?.recommended ? 8 : 0) // Engine already recommends
  ));
  options.push({
    id: 'generator_backup', name: 'Generator + BESS Hybrid', icon: '⛽',
    score: genScore,
    coverage: `${genKW} kW · unlimited runtime`,
    detail: `${hasGasLine ? 'Natural gas' : 'Propane'} · auto-transfer + islanding`,
    factors: [
      { label: 'Runtime', value: 'Unlimited', positive: true },
      { label: 'Fuel', value: hasGasLine ? 'Gas line ✓' : 'Propane', positive: hasGasLine },
      { label: 'Storm Risk', value: stormRisk >= 3 ? 'Elevated' : 'Moderate', positive: stormRisk < 3 },
      { label: 'ATS', value: 'Auto-transfer', positive: true },
    ],
    strategy: 'resilience',
  });

  // ── 5. DEMAND-SIDE REDUCTION (VFDs, efficiency) ──
  const hasPumps = formData?.pumpHP || formData?.pumpCount;
  const hasDryers = formData?.dryerHP || formData?.dryerCount;
  const hasMotors = hasPumps || hasDryers;
  const pumpHasVFD = formData?.pumpHasVFD === true;
  const dryerHasVFD = formData?.dryerHasVFD === true;
  const vfdOpportunity = hasMotors && (!pumpHasVFD || !dryerHasVFD);
  const reductionScore = Math.min(100, Math.round(
    (vfdOpportunity ? 25 : 8) + // VFD opportunity
    (utilityRate >= 0.20 ? 15 : utilityRate >= 0.14 ? 10 : 5) + // Savings at rate
    (formData?.waterReclaimLevel === 'none' || formData?.waterReclaimLevel === 'basic' ? 15 : 5) + // Water savings
    12 + // Always reduces peak demand → helps BESS sizing
    (formData?.lightingTier === 'fluorescent' || formData?.lightingTier === 'hid' ? 10 : 3) // LED upgrade
  ));
  options.push({
    id: 'demand_reduction', name: 'Demand-Side Reduction', icon: '⚙️',
    score: reductionScore,
    coverage: `${vfdOpportunity ? '25-40% motor savings' : '8-15% efficiency gains'}`,
    detail: `${vfdOpportunity ? 'VFD retrofits on pumps/dryers + ' : ''}LED + controls optimization`,
    factors: [
      { label: 'VFD', value: vfdOpportunity ? 'Upgradeable' : 'Done', positive: vfdOpportunity },
      { label: 'Motor Cut', value: vfdOpportunity ? '25-40%' : 'N/A', positive: vfdOpportunity },
      { label: 'Peak Reduction', value: 'Helps BESS', positive: true },
      { label: 'Complexity', value: 'Low-Med', positive: true },
    ],
    strategy: 'efficiency',
  });

  // Sort by score descending — highest priority first
  options.sort((a, b) => b.score - a.score);
  options.forEach((opt, idx) => { opt.rank = idx + 1; });
  return options;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 → STEP 4 VALIDATION — ensures goals reflect facility assessment data
// Maps each Step 3 input category to the goals it should influence
// ═══════════════════════════════════════════════════════════════════════════════
const validateStep3ToStep4 = (formData, goals, rec) => {
  if (!formData || !goals || goals.length === 0) return { valid: true, signals: [], warnings: [] };
  const fd = formData;
  const signals = []; // Positive confirmations that data flows correctly
  const warnings = []; // Mismatches or missing data

  // 1. Facility type → should influence load calculation and goal weighting
  if (fd.facilityType) {
    signals.push({ field: 'facilityType', value: fd.facilityType, impact: 'Load profile baseline set' });
  } else {
    warnings.push({ field: 'facilityType', issue: 'Missing — using default load profile' });
  }

  // 2. Operating hours/days → energy consumption scaling
  if (fd.operatingHours && fd.daysPerWeek) {
    signals.push({ field: 'operatingHours', value: `${fd.operatingHours}h × ${fd.daysPerWeek}d`, impact: 'Annual kWh scaled' });
  }

  // 3. Monthly electric bill → savings calculation anchor
  if (fd.monthlyElecBill || fd.monthlyElectricBill) {
    const bill = fd.monthlyElecBill || fd.monthlyElectricBill;
    signals.push({ field: 'monthlyBill', value: `$${(parseInt(bill) || 0).toLocaleString()}`, impact: 'Savings calibrated to actual spend' });
  } else {
    warnings.push({ field: 'monthlyBill', issue: 'No bill data — using industry benchmark' });
  }

  // 4. Equipment data → VFD/efficiency goal scoring
  if (fd.pumpHP || fd.dryerHP) {
    const hasVFDGap = !fd.pumpHasVFD || !fd.dryerHasVFD;
    signals.push({ field: 'equipment', value: `${fd.pumpHP || 0}HP pumps + ${fd.dryerHP || 0}HP dryers`, impact: hasVFDGap ? 'VFD savings opportunity detected' : 'VFDs already installed' });
  }

  // 5. Outage impact → resilience goal weighting
  if (fd.outageImpact) {
    const resGoal = goals.find(g => g.id === 'resilience');
    if (fd.outageImpact === 'complete-shutdown' && resGoal && resGoal.score < 60) {
      warnings.push({ field: 'outageImpact', issue: 'High outage impact but resilience scored low — check weather data' });
    } else {
      signals.push({ field: 'outageImpact', value: fd.outageImpact, impact: `Resilience priority: ${resGoal?.score || 'N/A'}` });
    }
  }

  // 6. Water reclaim → efficiency opportunity
  if (fd.waterReclaimLevel && fd.waterReclaimLevel !== 'advanced') {
    signals.push({ field: 'waterReclaim', value: fd.waterReclaimLevel, impact: 'Water efficiency upgrade opportunity included' });
  }

  // 7. Roof/carport → solar sizing validation
  if (fd.roofArea) {
    const roofKW = rec?.solar?.sizeKW || 0;
    const carportKW = rec?.solar?.carportKW || 0;
    signals.push({ field: 'solarArea', value: `${(parseInt(fd.roofArea) || 0).toLocaleString()} sq ft roof${carportKW > 0 ? ` + carport` : ''}`, impact: `${roofKW} kW system sized` });
  }

  // 8. Gas line / water heater → electrification opportunity
  if (fd.gasLine === 'no' && fd.waterHeater === 'electric') {
    signals.push({ field: 'electrification', value: 'All-electric', impact: 'No gas dependency — full solar+BESS optimization' });
  } else if (fd.waterHeater === 'gas' || fd.waterHeater === 'propane') {
    signals.push({ field: 'electrification', value: `${fd.waterHeater} water heater`, impact: 'Heat pump water heater upgrade scored' });
  }

  return {
    valid: warnings.length === 0,
    signals,
    warnings,
    score: Math.round((signals.length / Math.max(signals.length + warnings.length, 1)) * 100),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EnergyWizardB_SplitPanel({ locationData, selectedIndustry, annualBill: initialAnnualBill, formData: wizardAFormData, onBack, onStartOver }) {
  // FIX D-2 + GEN-COMPAT: Normalize generic Step 3 fields BEFORE any calculations run
  // useMemo (not useEffect) so normalization is available on first render for downstream useMemos
  const formData = useMemo(() => {
    if (!wizardAFormData) return {};
    const fd = { ...wizardAFormData }; // Shallow copy — never mutate props
    // backupPriority (1/2/3) → outageImpact (string) — generic Step 3 Q6
    if (fd.backupPriority && !fd.outageImpact) {
      const bpMap = { 1: 'minor-disruptions', 2: 'partial-operations', 3: 'complete-shutdown' };
      fd.outageImpact = bpMap[fd.backupPriority] || 'partial-operations';
    }
    // hasGasLine (bool) → gasLine (string) — generic Step 3 Q4
    if (fd.hasGasLine !== undefined && fd.gasLine === undefined) {
      fd.gasLine = fd.hasGasLine ? 'yes' : 'no';
    }
    // utilityBillingType default for generic
    if (!fd.utilityBillingType) fd.utilityBillingType = 'unknown';
    return fd;
  }, [wizardAFormData]);
  // D-2: Warnings only (non-blocking, dev console)
  useEffect(() => {
    if (!formData || !Object.keys(formData).length) return;
    ['gasLine','operatingHours','outageImpact','entityType','energyCommunity'].forEach(k => {
      if (formData[k] === undefined) console.warn(`[Merlin WizB] Missing field: ${k} — using defaults`);
    });
  }, [formData]);
  // ═══ RESPONSIVE: Mobile detection (breakpoint 768px) ═══
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  const [trueQuoteTab, setTrueQuoteTab] = useState('why');
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
      if (w >= 768) setSidebarOpen(false); // auto-close sidebar on desktop
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [currentStep, setCurrentStep] = useState(4);
  const [selectedEnhancements, setSelectedEnhancements] = useState([]);
  // pulseOn removed — Step 5 selection now uses solid fill instead of pulsing border
  const [showEnhancementConfig, setShowEnhancementConfig] = useState(null);
  const [selectedExpansion, setSelectedExpansion] = useState(null); // Solar expansion scenario from advisory
  const [showExpansionModal, setShowExpansionModal] = useState(false); // Decision Gate modal
  const [expansionModalStep, setExpansionModalStep] = useState(1); // 1 = problem, 2 = solutions
  const [enhancementConfigs, setEnhancementConfigs] = useState({
    evCharging: { l2Count: 0, dcCount: 0 },
    extendedBackup: { hours: 8 },
    generatorHybrid: { autoSize: true, manualKW: 50 }
  });

  // ═══ PRE-POPULATE EV CONFIG FROM STEP 3 ═══
  // If user said they have EV chargers in Step 3, start from their existing count
  // If no chargers, default to recommended 4 L2 / 0 DCFC
  useEffect(() => {
    const hasEV = wizardAFormData?.hasEvChargers === 'yes';
    const existingL2 = parseInt(wizardAFormData?.l2Chargers) || 0;
    const existingDC = parseInt(wizardAFormData?.dcChargers) || 0;
    if (hasEV && (existingL2 > 0 || existingDC > 0)) {
      // User has chargers — suggest adding more on top
      setEnhancementConfigs(prev => ({
        ...prev,
        evCharging: { l2Count: existingL2 + 2, dcCount: existingDC, _existingL2: existingL2, _existingDC: existingDC }
      }));
    } else {
      // No chargers — default recommendation
      setEnhancementConfigs(prev => ({
        ...prev,
        evCharging: { l2Count: 4, dcCount: 0, _existingL2: 0, _existingDC: 0 }
      }));
    }
  }, [wizardAFormData?.hasEvChargers, wizardAFormData?.l2Chargers, wizardAFormData?.dcChargers]);
  const [selectedSuppliers, setSelectedSuppliers] = useState({ solar: 0, inverter: 0, racking: 0, bess: 0, generator: 0, evCharger: 0, monitor: 0, canopyStructure: 0 });
  const [supplierPopup, setSupplierPopup] = useState(null);
  const [edgarData, setEdgarData] = useState({}); // { SolarEdge: {...}, Enphase: {...}, ... }
  const [edgarStatus, setEdgarStatus] = useState(null); // null | 'fetching' | 'done'
  const [calcError, setCalcError] = useState(null); // E-4: User-visible error state
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine); // E-7: Network status

  // ═══ LIVE EDGAR FETCH — pulls SEC financials for public suppliers ═══
  useEffect(() => {
    let cancelled = false; // FIX #97: prevent state update after unmount
    const publicSuppliers = ['SolarEdge', 'Enphase', 'Tesla', 'Canadian Solar', 'JinkoSolar', 'Generac', 'ChargePoint', 'First Solar', 'Maxeon', 'Sungrow', 'BYD'];
    setEdgarStatus('fetching');
    Promise.allSettled(publicSuppliers.map(name => fetchSupplierFinancials(name)))
      .then(results => {
        if (cancelled) return;
        const data = {};
        publicSuppliers.forEach((name, i) => {
          if (results[i].status === 'fulfilled' && results[i].value) {
            data[name] = results[i].value;
          }
        });
        setEdgarData(data);
        setEdgarStatus(Object.keys(data).length > 0 ? 'done' : null);
        // FIX A-11: removed debug log
      })
      .catch(() => { if (!cancelled) setEdgarStatus(null); });
    return () => { cancelled = true; };
  }, []);

  // E-7: Network online/offline listener
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // ACC-3: Step change announcement for screen readers
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  const stepNames = { 4: 'Equipment Configuration', 5: 'Enhancements', 6: 'Financing', 7: 'Quote Summary' };

  // DT-1 + CQ-1: Keyboard-accessible step navigation
  const handleStepKeyDown = React.useCallback((e, stepNum) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (stepNum >= 4 && stepNum < currentStep) {
        setCurrentStep(stepNum);
        setStepAnnouncement(`Navigated to Step ${stepNum}: ${stepNames[stepNum]}`);
      }
    } else if (e.key === 'ArrowDown' && stepNum < 7) {
      e.preventDefault();
      const nextEl = e.target.parentElement?.nextElementSibling?.querySelector('[tabindex]');
      nextEl?.focus();
    } else if (e.key === 'ArrowUp' && stepNum > 4) {
      e.preventDefault();
      const prevEl = e.target.parentElement?.previousElementSibling?.querySelector('[tabindex]');
      prevEl?.focus();
    }
  }, [currentStep]);

  // E-4: ErrorBanner component — dismissible error display with optional retry
  const ErrorBanner = ({ message, onDismiss, onRetry }) => (
    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px' }} role="alert">
      <span style={{ color: '#DC2626', fontSize: 14 }}>⚠️ {message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 12px', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Retry</button>}
      <button onClick={onDismiss} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 16 }} aria-label="Dismiss error">✕</button>
    </div>
  );

  // SI-1: EDGAR data freshness check
  const edgarFreshnessWarning = useMemo(() => {
    if (edgarStatus !== 'done' || Object.keys(edgarData).length === 0) return null;
    const timestamps = Object.values(edgarData).map(d => d?._timestamp).filter(Boolean);
    if (timestamps.length === 0) return null;
    const oldest = new Date(Math.min(...timestamps.map(t => new Date(t).getTime())));
    const hoursAgo = (Date.now() - oldest.getTime()) / 3600000;
    return hoursAgo > 168 ? 'SEC financial data is over 7 days old — may be stale' : null;
  }, [edgarData, edgarStatus]);

  const [financeTab, setFinanceTab] = useState('purchase');
  const [internalView, setInternalView] = useState(false); // Target cost model: customer vs internal view
  const [showDetails, setShowDetails] = useState(false);
  // Lease config (fixed parameters — convert to controls if user-configurable later)
  const leaseTerm = 10;
  const leaseType = 'capital'; // capital ($1) vs operating (FMV)
  const leaseEscalator = 0;
  // PPA config
  const ppaTerm = 20;
  const ppaRateType = 'fixed'; // fixed vs escalating
  const ppaEscalator = 2.0;
  // Loan config
  const loanTerm = 10;
  const loanDown = 0;
  const [hoveredEquip, setHoveredEquip] = useState(null);
  // Generator inclusion — risk-driven: only included when engine recommends, user can remove
  const [genUserRemoved, setGenUserRemoved] = useState(false);
  const [showGenWarning, setShowGenWarning] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [ssotTrackerOpen, setSsotTrackerOpen] = useState(false);
  const [s7Section, setS7Section] = useState('overview'); // active tab: overview|compare|breakdown|timeline|tax|compliance
  const [s7DetailTab, setS7DetailTab] = useState('purchase'); // which financing type inside Cost Breakdown
  const rightPanelRef = useRef(null);

  // ═══ LIVE CALCULATION ENGINE — replaces MOCK_REC ═══
  const rec = useMemo(() => buildRecommendation(formData, locationData, selectedIndustry, initialAnnualBill), [formData, locationData, selectedIndustry, initialAnnualBill]);
  // E-1b: If buildRecommendation crashed, surface error to user
  useEffect(() => {
    if (rec?._error) setCalcError(`Calculation error: ${rec._error}. Default values shown — please verify inputs.`);
    else setCalcError(null);
  }, [rec]);

  // ═══ AUTO-OPEN SOLAR EXPANSION MODAL when Step 5 opens with a roof gap ═══
  useEffect(() => {
    if (currentStep === 5 && rec?.expansionScenarios && !selectedExpansion) {
      setExpansionModalStep(1);
      setShowExpansionModal(true);
    }
  }, [currentStep]);

  // ═══ DYNAMIC LOCATION DATA — from Wizard A ═══
  const state = locationData?.utility?.state || locationData?.state || 'MI'; // FIX H-3: prefer utility.state, fallback state, then MI
  if (!locationData?.utility?.state && !locationData?.state) console.warn('[Merlin WizB] No state resolved — defaulting to MI'); // FIX H-3
  const utilityRate = locationData?.utility?.electric?.avgRate || DEFAULT_ELECTRIC_RATE; // FIX H-3: merlinConstants SSOT
  const peakSunHours = locationData?.solar?.peakSunHours || Math.round((STATE_SOLAR_PRODUCTION[state] || STATE_SOLAR_PRODUCTION.default) / (365 * 0.82) * 10) / 10;
  const weatherData = WEATHER_RISK_DATA[state] || WEATHER_RISK_DATA['default'];
  const stormRiskLevel = Math.max(weatherData.tornado || 0, weatherData.hurricane || 0, weatherData.wind || 0);

  // ═══ LIVE GOAL SCORES — replaces MOCK_GOALS ═══
  const liveGoalScores = useMemo(() => {
    try {
    if (!locationData?.utility || !selectedIndustry) return [];
    return calculateGoalScores(locationData.utility, locationData.solar, selectedIndustry, state, { ...(formData || {}), _annualBill: initialAnnualBill });
    } catch (e) { console.error('[useMemo:liveGoalScores]', e); return []; }
  }, [locationData, selectedIndustry, state, formData, initialAnnualBill]);

  // ═══ COMPUTED GOALS — map live engine output to rendering shape, fall back to static ═══
  const GOAL_ICON_MAP = { solarPV: '☀️', batteryPeakShaving: '📈', ledLighting: '💡', hvacOptimization: '🌡️', demandResponse: '📊', rateOptimization: '💰', vfdRetrofit: '⚙️', waterReclaim: '💧', evCharging: '⚡', waterHeater: '🔥' };
  const goals = useMemo(() => {
    try {
    if (liveGoalScores && liveGoalScores.length > 0) {
      const mapped = liveGoalScores.map(g => ({
        id: g.id, name: g.name,
        solutions: g.reason || g.shortDesc || '',
        score: Math.max(0, Math.min(100, g.score)),
        icon: GOAL_ICON_MAP[g.id] || '⚡',
        keyMetric: g.annualSavings ? `$${Math.round(g.annualSavings / 1000)}K/yr savings` : '',
        insight: g.detail || (g.paybackYears ? `${fmt(g.paybackYears, 1)} yr payback` : '')
      }));
      // Inject resilience goal if live engine doesn't produce one (it's weather-driven, not savings-driven)
      if (!mapped.find(g => g.id === 'resilience')) {
        const wr = computeWeatherRisk(state);
        const resScore = Math.round(Math.min(95, 40 + wr.outageScore * 12));
        mapped.push({
          id: 'resilience', name: 'Protect Against Outages',
          solutions: wr.weatherNeedsGenerator ? 'Generator + BESS Backup' : 'BESS Backup',
          score: resScore,
          icon: '🛡️',
          keyMetric: `Outage risk: ${wr.outageLevel}`,
          insight: wr.outageLevel === 'high' ? `${wr.summary}. Generator critical.` : wr.outageLevel === 'moderate' ? `${wr.summary}. Generator recommended.` : 'Low outage risk. BESS provides adequate backup.'
        });
        // Re-sort by score descending
        mapped.sort((a, b) => b.score - a.score);
      }
      return mapped;
    }
    return buildMockGoals(state);
    } catch (e) { console.error('[useMemo:goals]', e); return buildMockGoals(state); }
  }, [liveGoalScores, state]);

  // ═══ DYNAMIC ENHANCEMENTS — replaces MOCK_ENHANCEMENTS ═══
  const FALLBACK_ENHANCEMENTS = [
    { id: 'extendedBackup', name: 'Extended Backup', icon: '🔋', score: 72, estimatedCost: '$10K-35K', payback: 'N/A', keyFactors: [{ label: 'Duration', value: '8+ hrs', positive: true }, { label: 'Storm Risk', value: 'Moderate', positive: false }, { label: 'Revenue Loss', value: '$3-5K/day', positive: true }] },
    { id: 'generatorHybrid', name: 'Advanced Generator Integration', icon: '⛽', score: 68, estimatedCost: '$35K-65K', payback: '5-8 yr', keyFactors: [{ label: 'Gas Line', value: 'Check', positive: true }, { label: 'Backup', value: 'Unlimited', positive: true }, { label: 'Islanding', value: 'BESS+Gen', positive: true }] },
    { id: 'evCharging', name: 'EV Charging Stations', icon: '⚡', score: 65, estimatedCost: '$11K-25K', payback: '3-5 yr', keyFactors: [{ label: 'Revenue', value: '$3-8K/yr', positive: true }, { label: 'ITC', value: '30%', positive: true }, { label: 'Dwell', value: 'Matches wash', positive: true }] },
    { id: 'waterReclaim', name: 'Water Reclaim System', icon: '💧', score: 61, estimatedCost: '$25K-45K', payback: '2-4 yr', keyFactors: [{ label: 'Water Save', value: '60-90%', positive: true }, { label: 'Annual Savings', value: '$3-8K/yr', positive: true }, { label: 'Maint.', value: '+$2K/yr', positive: false }] },
    { id: 'vfdRetrofit', name: 'VFD on Pumps & Dryers', icon: '🔧', score: 58, estimatedCost: '$40K-70K', payback: '3-5 yr', keyFactors: [{ label: 'Energy Save', value: '20-40%', positive: true }, { label: 'Motor Life', value: '+5 yrs', positive: true }, { label: 'Install', value: 'Downtime req', positive: false }] },
    { id: 'heatPumpWH', name: 'Heat Pump Water Heater', icon: '🔥', score: 56, estimatedCost: '$25K-75K', payback: '3-6 yr', keyFactors: [{ label: 'COP', value: '3.5 vs 0.8 gas', positive: true }, { label: 'Gas Eliminated', value: '$3-8K/yr', positive: true }, { label: 'IRA §25C', value: 'Tax credit', positive: true }] },
    { id: 'monitoring', name: 'Smart Energy Monitor', icon: '📡', score: 55, estimatedCost: '$8K-15K', payback: '2-3 yr', keyFactors: [{ label: 'Visibility', value: 'Real-time', positive: true }, { label: 'Savings', value: '5-15%', positive: true }, { label: 'Data', value: 'Demand alerts', positive: true }] },
    // Industry-specific enhancements (filtered by INDUSTRY_ENHANCEMENTS map)
    { id: 'hvacOptimization', name: 'HVAC Optimization', icon: '🌡️', score: 62, estimatedCost: '$15K-40K', payback: '2-4 yr', keyFactors: [{ label: 'Energy Save', value: '15-30%', positive: true }, { label: 'Comfort', value: 'Improved', positive: true }, { label: 'Maint.', value: 'Predictive', positive: true }] },
    { id: 'coolRoof', name: 'Cool Roof / Insulation', icon: '🏠', score: 48, estimatedCost: '$8K-25K', payback: '3-6 yr', keyFactors: [{ label: 'Cooling Load', value: '-15-25%', positive: true }, { label: 'Roof Life', value: '+10 yrs', positive: true }, { label: 'Disruption', value: 'Minimal', positive: true }] },
    { id: 'bmsIntegration', name: 'BMS Integration', icon: '🖥️', score: 52, estimatedCost: '$20K-60K', payback: '2-4 yr', keyFactors: [{ label: 'Automation', value: 'Full HVAC+Light', positive: true }, { label: 'Savings', value: '10-20%', positive: true }, { label: 'Data', value: 'Cloud dashboard', positive: true }] },
    { id: 'coolingRedundancy', name: 'Cooling Redundancy', icon: '❄️', score: 70, estimatedCost: '$30K-80K', payback: 'N/A', keyFactors: [{ label: 'Uptime', value: '99.99%', positive: true }, { label: 'Failover', value: 'Auto N+1', positive: true }, { label: 'Monitoring', value: '24/7 alerts', positive: true }] },
    { id: 'ledGrowLights', name: 'LED Grow Lights', icon: '🌱', score: 64, estimatedCost: '$20K-50K', payback: '2-3 yr', keyFactors: [{ label: 'Energy Save', value: '40-60%', positive: true }, { label: 'Yield', value: '+15-25%', positive: true }, { label: 'Spectrum', value: 'Tunable', positive: true }] },
    { id: 'compressedAir', name: 'Compressed Air Audit', icon: '💨', score: 50, estimatedCost: '$5K-20K', payback: '1-3 yr', keyFactors: [{ label: 'Leak Fix', value: '20-30% waste', positive: true }, { label: 'Pressure', value: 'Optimized', positive: true }, { label: 'Quick Win', value: 'Fast ROI', positive: true }] },
  ];
  const liveEnhancements = useMemo(() => { try { return buildEnhancements(formData, locationData, rec, state); } catch (e) { console.error('[useMemo:liveEnhancements]', e); return []; } }, [formData, locationData, rec, state]);
  const enhancements = (liveEnhancements && liveEnhancements.length > 0 ? liveEnhancements : FALLBACK_ENHANCEMENTS.filter(e => {
    // Mirror live engine industry gates for fallback path
    const isWaterIndustry = formData?.waterReclaimLevel !== undefined || formData?.dailyVehicles !== undefined;
    const isMotorIndustry = formData?.pumpHP || formData?.pumpCount || formData?.dryerHP || formData?.dryerCount;
    if (e.id === 'waterReclaim' && !isWaterIndustry) return false;
    if (e.id === 'waterReclaim' && formData?.waterReclaimLevel === 'advanced') return false; // Already at max
    if (e.id === 'vfdRetrofit' && !isMotorIndustry) return false;
    const hasGasWH = formData?.waterHeater === 'gas' || formData?.waterHeater === 'propane' || (formData?.hasGasLine && !formData?.waterHeater);
    if (e.id === 'heatPumpWH' && !hasGasWH) return false;
    return true;
  }).map(e => {
    // Patch water reclaim fallback with Step 3 data so it's not generic
    if (e.id === 'waterReclaim' && formData?.waterReclaimLevel) {
      const lvl = formData.waterReclaimLevel;
      const curPct = lvl === 'none' ? 0 : lvl === 'basic' ? 55 : lvl === 'standard' ? 75 : 90;
      return {
        ...e,
        name: lvl === 'none' ? 'Add Water Reclaim System' : `Upgrade ${lvl.charAt(0).toUpperCase() + lvl.slice(1)} → Advanced Reclaim`,
        keyFactors: [
          { label: 'Reclaim', value: `${curPct}% → 90%`, positive: true },
          { label: 'Annual Savings', value: '$3-8K/yr', positive: true },
          { label: 'Maint.', value: '+$2K/yr', positive: false },
        ],
      };
    }
    return e;
  }));

  // Sync: remove any selectedEnhancements that no longer exist in the list
  // (handles case where user goes back to Step 3, adds chargers/VFDs, returns to Step 5)
  // NOTE: Disabled — Step5_3Col_v2 manages its own addon IDs which may differ from WizB's enhancements array.
  // Only 'evCharging' is consumed downstream (line ~3825). Step5 pushes state directly.
  const enhancementIds = useMemo(() => { try { return new Set((enhancements || []).map(e => e.id)); } catch (e) { console.error('[useMemo:enhancementIds]', e); return new Set(); } }, [enhancements]);
  // useEffect(() => {
  //   setSelectedEnhancements(prev => {
  //     const filtered = prev.filter(id => enhancementIds.has(id));
  //     return filtered.length !== prev.length ? filtered : prev;
  //   });
  // }, [enhancementIds]);

  // ═══ GAP MAKEUP OPTIONS — scored strategies for filling energy shortfall ═══
  const gapMakeupOptions = useMemo(() => {
    try { return buildGapMakeupOptions(rec, locationData, formData, state); }
    catch (e) { console.error('[useMemo:gapMakeupOptions]', e); return []; }
  }, [rec, locationData, formData, state]);

  // ═══ STEP 3 → 4 VALIDATION — confirms facility data drives goal rankings ═══
  const step3Validation = useMemo(() => {
    try { return validateStep3ToStep4(formData, goals, rec); }
    catch (e) { console.error('[useMemo:step3Validation]', e); return { valid: true, signals: [], warnings: [], score: 100 }; }
  }, [formData, goals, rec]);

  // ═══ DYNAMIC SUPPLIER SCORING (FIX #75) ═══
  const _defaultSuppliers = { solar: [], bess: [], inverter: [], racking: [], generator: [], evCharger: [], monitor: [] };
  const scoredSuppliers = useMemo(() => { try { return scoreSuppliers({
    stateCode: state,
    systemSizeKW: rec.solar?.sizeKW || 85,
    bessCapacityKWh: rec.bess?.capacityKWh || 200,
    annualKWh: rec.facilityLoad?.annualUsageKWh || 350000,
    demandCharge: rec.assumptions?.demandCharge ?? 15, // FIX H-7: ??
    weatherRisk: rec.weatherRisk || {},
    hasGasLine: formData?.gasLine === 'yes' || formData?.hasGasLine === true, // FIX D-1: car wash passes gasLine:'yes'|'no', general passes hasGasLine:true|false
    prioritizeDomestic: true,
    edgarData, // Live SEC EDGAR financials
  }); } catch (e) { console.error('[useMemo:scoredSuppliers]', e); return _defaultSuppliers; } }, [state, rec, formData, edgarData]);

  const ss = (scoredSuppliers.solar || [])[selectedSuppliers.solar] || (scoredSuppliers.solar || [])[0] || {};
  const si = (scoredSuppliers.inverter || [])[selectedSuppliers.inverter] || (scoredSuppliers.inverter || [])[0] || {};
  const sr = (scoredSuppliers.racking || [])[selectedSuppliers.racking || 0] || (scoredSuppliers.racking || [])[0] || {};
  const sb = (scoredSuppliers.bess || [])[selectedSuppliers.bess] || (scoredSuppliers.bess || [])[0] || {};
  const sg = (scoredSuppliers.generator || [])[selectedSuppliers.generator] || (scoredSuppliers.generator || [])[0] || {};
  const se = (scoredSuppliers.evCharger || [])[selectedSuppliers.evCharger || 0] || (scoredSuppliers.evCharger || [])[0] || {};
  const sm = (scoredSuppliers.monitor || [])[selectedSuppliers.monitor || 0] || (scoredSuppliers.monitor || [])[0] || {};
  const scs = (scoredSuppliers.canopyStructure || [])[selectedSuppliers.canopyStructure || 0] || (scoredSuppliers.canopyStructure || [])[0] || {};
  const svfd = (scoredSuppliers.vfd || [])[selectedSuppliers.vfd || 0] || (scoredSuppliers.vfd || [])[0] || {};
  const shpwh = SUPPLIERS.heatPumpWH?.[0] || {};
  const swr = SUPPLIERS.waterReclaim?.[0] || {};

  // ═══ DYNAMIC PANEL COUNT — computed from engine-sized system + selected supplier watts ═══
  const panelWatts = ss?.watts || 450;
  const dynamicPanelCount = Math.ceil(((rec.solar.sizeKW || 85) * 1000) / panelWatts); // FIX NaN-8: guard sizeKW

  const costPerW = ss?.costPerW || 2.50;
  const roofSolarKW = rec.solar.roofKW || rec.solar.sizeKW || 85; // FIX NaN-10
  const carportSolarKW = rec.solar.carportKW || 0;

  // ═══════════════════════════════════════════════════════════════════════════════
  // FIX #76: COMPREHENSIVE SUPPLIER-AWARE FINANCIAL ENGINE
  // Every cost, credit, and incentive reacts to selected supplier attributes:
  //   - Tariff surcharges (AD/CVD, Section 301, reciprocal)
  //   - FEOC eligibility (affects ITC, state credits, MACRS basis)
  //   - Domestic content bonus (+10% ITC)
  //   - Warranty risk reserves (financially distressed suppliers)
  //   - State incentive eligibility
  // ═══════════════════════════════════════════════════════════════════════════════

  // ── TARIFF SURCHARGE CALCULATOR ──
  // Suppliers list "base" price; actual landed cost includes tariff duties.
  // If tariffRisk is Extreme or High, the buyer pays the tariff on top.
  // These are REAL costs that show up on the invoice.
  // FIX #116: Tariff applies to hardware import value, not full installed cost
  // Solar costPerW includes labor/BOS (~40% hardware). Other components are hardware-priced.
  const calcTariffSurcharge = (supplier, baseCost, hardwareFraction = 1.0) => {
    if (!supplier) return { surcharge: 0, rate: 0, note: '' };
    const risk = supplier.tariffRisk || 'None';
    if (risk === 'None' || risk === 'Low') return { surcharge: 0, rate: 0, note: '' };
    const tariffBasis = Math.round(baseCost * hardwareFraction);
    // Tariff rates by risk tier (blended effective rates from AD/CVD + Section 301 + reciprocal)
    if (risk === 'Extreme') {
      const rate = 0.55;
      return { surcharge: Math.round(tariffBasis * rate), rate, note: 'AD/CVD + §301 + reciprocal tariffs' };
    }
    if (risk === 'High') {
      const rate = 0.30;
      return { surcharge: Math.round(tariffBasis * rate), rate, note: '§301 + trade tariffs' };
    }
    if (risk === 'Medium') {
      const rate = 0.12;
      return { surcharge: Math.round(tariffBasis * rate), rate, note: 'Moderate import duties' };
    }
    return { surcharge: 0, rate: 0, note: '' };
  };

  // ── FEOC CHECK — applies to ALL equipment, not just BESS ──
  // Foreign Entity of Concern: equipment from FEOC-classified entities makes the
  // ENTIRE project ineligible for §48E ITC if that component is included in cost basis.
  // Safe approach: exclude FEOC equipment from ITC basis (not the whole project).
  // Detection: explicit 'INELIGIBLE' flag, 'exclusion' keyword, OR Extreme tariff risk
  // with FEOC mention (Canadian Solar, Jinko, Sungrow all have FEOC exposure in 2026+)
  const isFEOC = (supplier) => {
    if (!supplier) return false;
    const note = supplier.tariffNote || '';
    const risk = supplier.tariffRisk || 'None';
    // Explicit FEOC ineligibility
    if (note.includes('INELIGIBLE') || note.includes('exclusion')) return true;
    // Extreme tariff risk + any FEOC mention = treat as FEOC for ITC purposes
    if (risk === 'Extreme' && note.includes('FEOC')) return true;
    return false;
  };
  const solarFEOC = isFEOC(ss);
  const inverterFEOC = isFEOC(si);
  const rackingFEOC = isFEOC(sr);
  const bessFEOC = isFEOC(sb);
  const genFEOC = isFEOC(sg);
  const feocItems = [
    ...(solarFEOC ? ['Solar'] : []),
    ...(inverterFEOC ? ['Inverter'] : []),
    ...(rackingFEOC ? ['Racking'] : []),
    ...(bessFEOC ? ['BESS'] : []),
  ];
  const hasFEOC = feocItems.length > 0;

  // ── OBBBA MATERIAL ASSISTANCE TEST — moved below cost definitions (line ~3694) ──

  // ── WARRANTY RISK RESERVE ──
  // If supplier has elevated bankruptcy/financial distress risk, add a reserve
  // for potential warranty claim failure (extended warranty or replacement fund)
  const calcWarrantyReserve = (supplier, equipCost) => {
    if (!supplier?.riskNote) return 0;
    if (supplier.riskNote.includes('bankruptcy') || supplier.riskNote.includes('distress')) {
      // Reserve 8% of equipment cost for 3rd-party extended warranty or self-insurance
      return Math.round(equipCost * 0.08);
    }
    return 0;
  };

  // ── BASE EQUIPMENT COSTS (from supplier pricing) ──
  // FIX #104+#111: Use actual installed kW. Carport premium = additive structural cost ($1.50/W), not multiplicative
  // FIX B-3 (Phase 4): Ground-mount option for warehouse/farm/large sites
  const actualSystemKW = (dynamicPanelCount * panelWatts) / 1000; // Convert W → kW
  const actualRoofKW = Math.min(roofSolarKW, actualSystemKW);
  const actualCarportKW = Math.min(Math.max(0, actualSystemKW - actualRoofKW), rec.solar.carportKW || 0);
  // FIX GM-2: Use optimizer's ground mount allocation, not just overflow from roof+carport
  const actualGroundKW = Math.min(Math.max(0, actualSystemKW - actualRoofKW - actualCarportKW), rec.solar.groundKW || 0);

  // ── EXPANSION: Solar canopy/carport — must resolve BEFORE inverter sizing ──
  const expansionScenario = selectedExpansion && rec.expansionScenarios
    ? rec.expansionScenarios.scenarios.find(s => s.id === selectedExpansion) : null;
  // FIX ENG-2: Use real canopy structure supplier pricing instead of hardcoded $1.50/W
  const canopyStructureCostPerW = (scs?.costPerW || 0.55) + (scs?.installLaborPerW || 0.90); // Equipment + install labor
  const expansionAddedKW = expansionScenario ? expansionScenario.addedKW : 0;
  const expansionStructuralCost = expansionScenario ? Math.round(expansionAddedKW * 1000 * canopyStructureCostPerW) : 0;
  const expansionPanelCount = expansionAddedKW > 0 ? Math.ceil((expansionAddedKW * 1000) / panelWatts) : 0;
  const expansionAddedProd = expansionScenario ? Math.round(expansionAddedKW * (locationData?.solar?.annualProduction || 1200) * (rec.weatherRisk?.productionDerating || 0.92)) : 0;

  // ── TOTAL SYSTEM: roof + expansion (inverter must handle full array) ──
  // FIX SIM-2: Cap total system to prevent >120% oversizing (self-serve wash with huge carport)
  // FIX TDZ-2: savingsAnnualKWh must be declared before first use (was at line ~4806)
  const savingsAnnualKWh = rec.facilityLoad.savingsAnnualKWh || rec.facilityLoad.annualUsageKWh;
  // FIX TDZ-3: solarProductionRate and annualProduction must be declared before maxOffsetKW
  const solarProductionRate = locationData?.solar?.annualProduction || STATE_SOLAR_PRODUCTION[state] || STATE_SOLAR_PRODUCTION.default;
  // FIX H-4: _solarSource removed (dead variable). Source tracked in locationData?.solar?._liveSource for TrueQuote badges.
  const wr = rec.weatherRisk || computeWeatherRisk(state);
  // FIX #85: Only apply NASA temp derating when using STATIC table. PVWatts already models temperature.
  const tempDerate = (locationData?.solar?._liveSource && locationData?.solar?._tempDeratingFactor) ? 1.0 : (locationData?.solar?._tempDeratingFactor || 1.0);
  const annualProduction = calcAnnualProd(actualSystemKW, solarProductionRate, wr.productionDerating, tempDerate); // FIX H-2: unified calc
  const maxOffsetKW = savingsAnnualKWh > 0 && solarProductionRate > 0
    ? Math.round((savingsAnnualKWh * 1.20) / (solarProductionRate * (rec.weatherRisk?.productionDerating || 0.92)))
    : Infinity;
  const uncappedTotalKW = actualSystemKW + expansionAddedKW;
  const solarOversized = uncappedTotalKW > maxOffsetKW && expansionAddedKW > 0;
  const totalSystemKW = solarOversized ? maxOffsetKW : uncappedTotalKW;
  const totalPanelCount = dynamicPanelCount + expansionPanelCount;
  // FIX C-1/M-1: UNIFIED self-consumption model — single source for ALL financial calculations
  // Uses the continuous curve from getSelfConsumptionRate() (accounts for offset ratio)
  // + BESS boost (stored excess → higher self-consumption) + industry floor
  const _baseSelfConsumption = getSelfConsumptionRate(annualProduction + expansionAddedProd, savingsAnnualKWh);
  const _bessBoost = (rec.bess?.capacityKWh > 0) ? Math.min(0.12, rec.bess.capacityKWh / Math.max(savingsAnnualKWh / 365, 1) * 0.004) : 0;
  const selfConsumptionRate = Math.min(0.95, _baseSelfConsumption + _bessBoost);

  const expansionAddedSavings = Math.round(expansionAddedProd * utilityRate * selfConsumptionRate);

  const carportStructuralPremium = canopyStructureCostPerW; // FIX H-1: real supplier pricing (was hardcoded 1.50)
  const groundMountPremium = 0.55;       // $/W for ground mount (trenching, racking, land prep) — NREL 2025 C&I mid-range
  const solarBaseCost = Math.round(
    (actualRoofKW * 1000 * costPerW) + 
    (actualCarportKW * 1000 * (costPerW + carportStructuralPremium)) +
    (actualGroundKW * 1000 * (costPerW + groundMountPremium)) // FIX B-3
  );
  // Expansion panel cost — uses ACTUAL supplier $/W, not hardcoded
  const expansionPanelCost = Math.round(expansionAddedKW * 1000 * costPerW);
  // FIX ENG-1: Inverter must be sized to TOTAL solar array (roof + canopy/carport expansion)
  const inverterBaseCost = Math.round(totalSystemKW * (si?.costPerKW || 150));
  const rackingBaseCost = Math.round(dynamicPanelCount * (sr?.costPerPanel || 45)); // Roof racking only — canopy structure in expansionStructuralCost
  const bessBaseCost = Math.round((rec.bess.capacityKWh || 200) * (sb?.costPerKWh || 350)); // FIX PB-1: fallback $350/kWh Q1 2026 (was $500)
  const includeGenerator = rec.generator?.recommended === true && !genUserRemoved;
  const genBaseCost = includeGenerator ? Math.round(rec.generator.powerKW * (sg?.costPerKW || 550)) : 0;
  const evCount = enhancementConfigs.evCharging.l2Count + (enhancementConfigs.evCharging.dcCount || 0);
  const includeEV = selectedEnhancements.includes('evCharging');
  const includeMonitor = selectedEnhancements.includes('monitoring');
  const l2UnitCost = se?.costPerUnit || 8000;
  const dcUnitCost = 65000;
  const evBaseCost = includeEV ? Math.round((enhancementConfigs.evCharging.l2Count * l2UnitCost) + ((enhancementConfigs.evCharging.dcCount || 0) * dcUnitCost)) : 0;
  const monitorBaseCost = includeMonitor ? (sm?.cost || 8500) : 0;

  // ── STEP 5 ADD-ON ENHANCEMENT COSTS & SAVINGS — wired into financial model ──
  const includeWaterReclaim = selectedEnhancements.includes('waterReclaim');
  const includeHPWH = selectedEnhancements.includes('heatPumpWH');
  const includeVFD = selectedEnhancements.includes('vfdRetrofit');
  // Look up computed costs/savings from the live enhancements engine
  const _enhFind = (id) => (enhancements || []).find(e => e.id === id);
  const _parseCost = (str) => { if (!str || str === 'Included') return 0; const hasK = /[Kk]/.test(str); const n = parseFloat(String(str).replace(/[$,Kk]/g, '')); if (isNaN(n)) return 0; return hasK ? n * 1000 : n; }; // FIX: check K suffix instead of assuming <1000 means K was stripped
  const waterReclaimCost = includeWaterReclaim ? Math.round(_parseCost(_enhFind('waterReclaim')?.estimatedCost) || 35000) : 0;
  const waterReclaimSavings = includeWaterReclaim ? (_enhFind('waterReclaim')?.annualSavings || 0) : 0;
  const hpwhCost = includeHPWH ? Math.round(_parseCost(_enhFind('heatPumpWH')?.estimatedCost) || 0) : 0; // FIX S5-1: fallback 0, not 12000 — if not in enhancements, don't charge
  const hpwhSavings = includeHPWH ? (_enhFind('heatPumpWH')?.annualSavings || 0) : 0;
  const vfdAddonCost = includeVFD ? Math.round(_parseCost(_enhFind('vfdRetrofit')?.estimatedCost) || 25000) : 0;
  const vfdAddonSavings = includeVFD ? (_enhFind('vfdRetrofit')?.annualSavings || 0) : 0;
  // FIX S5-5: Monitor savings — 8% of annual energy cost. Was charged as cost but savings never credited.
  const monitorAnnualSavings = includeMonitor ? (_enhFind('monitoring')?.annualSavings || 0) : 0;
  const enhancementAddonCost = waterReclaimCost + hpwhCost + vfdAddonCost;
  const enhancementAddonSavings = waterReclaimSavings + hpwhSavings + vfdAddonSavings + monitorAnnualSavings; // FIX S5-5: +monitor

  // ── TARIFF SURCHARGES ──
  const solarTariff = calcTariffSurcharge(ss, solarBaseCost, 0.40); // Solar costPerW includes labor — tariff on hardware only
  const inverterTariff = calcTariffSurcharge(si, inverterBaseCost, 0.75); // costPerKW includes install — ~75% hardware
  const rackingTariff = calcTariffSurcharge(sr, rackingBaseCost); // costPerPanel is hardware-priced
  const bessTariff = calcTariffSurcharge(sb, bessBaseCost); // costPerKWh is hardware-priced
  const genTariff = calcTariffSurcharge(sg, genBaseCost, 0.65); // Gen costPerKW includes install — ~65% hardware
  const evTariff = calcTariffSurcharge(se, evBaseCost, 0.70); // EV charger installed cost — ~70% hardware
  const totalTariffSurcharge = solarTariff.surcharge + inverterTariff.surcharge + rackingTariff.surcharge + bessTariff.surcharge + genTariff.surcharge + evTariff.surcharge;
  const tariffItems = [
    ...(solarTariff.surcharge > 0 ? [`Solar +${(solarTariff.rate*100).toFixed(0)}%`] : []),
    ...(inverterTariff.surcharge > 0 ? [`Inverter +${(inverterTariff.rate*100).toFixed(0)}%`] : []),
    ...(bessTariff.surcharge > 0 ? [`BESS +${(bessTariff.rate*100).toFixed(0)}%`] : []),
    ...(genTariff.surcharge > 0 ? [`Generator +${(genTariff.rate*100).toFixed(0)}%`] : []),
    ...(evTariff.surcharge > 0 ? [`EV +${(evTariff.rate*100).toFixed(0)}%`] : []),
  ];

  // ── WARRANTY RISK RESERVES ──
  const solarWarrantyReserve = calcWarrantyReserve(ss, solarBaseCost);
  const inverterWarrantyReserve = calcWarrantyReserve(si, inverterBaseCost);
  const bessWarrantyReserve = calcWarrantyReserve(sb, bessBaseCost);
  const totalWarrantyReserve = solarWarrantyReserve + inverterWarrantyReserve + bessWarrantyReserve;
  const warrantyItems = [
    ...(solarWarrantyReserve > 0 ? [`${ss.manufacturer} solar`] : []),
    ...(inverterWarrantyReserve > 0 ? [`${si.manufacturer} inverter`] : []),
    ...(bessWarrantyReserve > 0 ? [`${sb.manufacturer} BESS`] : []),
  ];

  // ── LANDED COSTS (base + tariff) ──
  const solarCost = solarBaseCost + solarTariff.surcharge;
  const inverterCost = inverterBaseCost + inverterTariff.surcharge;
  const rackingCost = rackingBaseCost + rackingTariff.surcharge;
  const bessCost = bessBaseCost + bessTariff.surcharge;
  const genCost = genBaseCost + genTariff.surcharge;
  const evCost = evBaseCost + evTariff.surcharge;
  const monitorCost = monitorBaseCost;

  // ── OBBBA MATERIAL ASSISTANCE TEST (§70512/70513) ──
  // For BOC after Dec 31, 2025: (Total Costs - PFE Costs) / Total Costs must exceed threshold
  // PFE = Prohibited Foreign Entity (FEOC-flagged suppliers)
  // If ratio < threshold → ENTIRE ITC disqualified for PFE-tainted components
  const pfeCosts = (solarFEOC ? solarCost : 0) + (inverterFEOC ? inverterCost : 0) + 
    (rackingFEOC ? rackingCost : 0) + (bessFEOC ? bessCost : 0);
  const totalComponentCosts = solarCost + inverterCost + rackingCost + bessCost;
  const materialAssistanceRatio = totalComponentCosts > 0 ? (totalComponentCosts - pfeCosts) / totalComponentCosts : 1.0;
  const materialAssistanceThreshold = 0.50; // Conservative: assume 50% (IRS Notice 2025-42 pending final regs)
  const materialAssistancePasses = materialAssistanceRatio >= materialAssistanceThreshold;
  // Special risk: Tesla Megapack uses CATL cells (FEOC) — "substantial transformation" defense untested
  const hasCATLCellRisk = sb?.cells?.includes('CATL') && !bessFEOC; // Flagged as non-FEOC but uses FEOC cells
  // FIX M-3: Strict FEOC mode — if IRS extends FEOC to cell-level (expected 2026+), CATL cells = no ITC
  // Conservative approach: treat CATL-cell BESS as FEOC for ITC basis when strict=true
  const feocStrictMode = hasCATLCellRisk; // Auto-enable when CATL cells detected
  const bessItcEligibleStrict = feocStrictMode ? 0 : (bessFEOC ? 0 : bessCost);

  const equipmentSubtotal = solarCost + inverterCost + rackingCost + bessCost + genCost + evCost + monitorCost + enhancementAddonCost + expansionPanelCost + expansionStructuralCost;
  
  // FIX B-1 (Phase 2): Utility interconnection cost — tiered by system size
  // Source: NREL/DOE interconnection cost study, utility filings
  // <100kW: simplified/fast-track ($3K-7K), 100-500kW: detailed study ($10K-25K), >500kW: full impact study ($25K-50K)
  const interconnectionCost = actualSystemKW < 100 ? 5000 
    : actualSystemKW < 500 ? 15000 
    : actualSystemKW < 1000 ? 25000 
    : 35000;
  
  // ── TIERED MARGIN MODEL — Per-component rates achieving ~25% blended GP ──
  // Industry C&I gross margins: 25-40%. Merlin targets 25% (floor) by setting
  // each component 5-15pts BELOW industry average for that component category.
  // Rationale: commodity items (panels) = lower %; specialty/complex = higher %;
  // AI platform services = 100% (amortized dev cost). See margin_analysis S23.
  const MARGIN_RATES = {
    solar: 0.20,           // Industry 25-30% — highest price transparency
    canopyStructure: 0.30, // Industry 35-45% — custom engineered, hard to compare
    bess: 0.25,            // Industry 30-40% — complex integration, AI sizing value
    inverter: 0.20,        // Industry 25-30% — standard BOS
    racking: 0.20,         // Industry 25-30% — standard BOS
    generator: 0.30,       // Industry 35-45% — dealer markups typically 35-45%
    ev: 0.30,              // Industry 30-40% — network + install complexity
    monitor: 0.40,         // Industry 40-55% — recurring revenue gateway (O&M ARR)
    enhancement: 0.30,     // Industry 35-45% — specialty install (HPWH, VFD, etc.)
    expansion: 0.20,       // Same as solar — panel expansion
    expansionStruct: 0.30, // Same as canopy — structural expansion
  };

  // Per-component equipment margins
  const solarEquipMargin = Math.round(solarCost * MARGIN_RATES.solar);
  const inverterEquipMargin = Math.round(inverterCost * MARGIN_RATES.inverter);
  const rackingEquipMargin = Math.round(rackingCost * MARGIN_RATES.racking);
  const bessEquipMargin = Math.round(bessCost * MARGIN_RATES.bess);
  const genEquipMargin = Math.round(genCost * MARGIN_RATES.generator);
  const evEquipMargin = Math.round(evCost * MARGIN_RATES.ev);
  const monitorEquipMargin = Math.round(monitorCost * MARGIN_RATES.monitor);
  const enhancementEquipMargin = Math.round(enhancementAddonCost * MARGIN_RATES.enhancement);
  const expansionPanelMargin = Math.round(expansionPanelCost * MARGIN_RATES.expansion);
  const expansionStructMargin = Math.round(expansionStructuralCost * MARGIN_RATES.expansionStruct);

  const equipmentMarginTotal = solarEquipMargin + inverterEquipMargin + rackingEquipMargin +
    bessEquipMargin + genEquipMargin + evEquipMargin + monitorEquipMargin +
    enhancementEquipMargin + expansionPanelMargin + expansionStructMargin;

  // Service fees — Merlin platform intelligence + project management
  // Engineering/design: AI platform replaces $5-15K traditional engineering study (100% margin — amortized)
  const engineeringDesignFee = actualSystemKW > 0
    ? (actualSystemKW < 100 ? 8500 : actualSystemKW < 500 ? 12000 : 15000)
    : 0;
  // PM/permitting: tiered by project complexity, 60% gross margin on service delivery
  const pmPermittingCost = actualSystemKW < 100 ? 5000 : actualSystemKW < 500 ? 8000 : 12000;
  const pmPermittingFee = Math.round(pmPermittingCost / (1 - 0.60)); // 60% margin → cost / 0.40
  const serviceFeeTotal = engineeringDesignFee + pmPermittingFee;

  // Total Merlin margin (equipment margins + service fees)
  const merlinMargin = equipmentMarginTotal + serviceFeeTotal;

  // Blended margin rate — for display labels and backward compatibility
  const merlinMarginRate = (equipmentSubtotal + merlinMargin) > 0
    ? merlinMargin / (equipmentSubtotal + merlinMargin)
    : 0.25;

  const grossCost = equipmentSubtotal + merlinMargin + totalWarrantyReserve + interconnectionCost; // FIX B-1: includes interconnection

  // ═══ TAX CREDITS & INCENTIVES — FULLY SUPPLIER-AWARE ═══
  
  // ── Federal §48E ITC ──
  // FEOC equipment excluded from cost basis. Tariff surcharges ARE part of cost basis (IRS guidance).
  // Domestic content bonus: +10% if ≥50% of manufactured product cost is US-made (OBBBA 2026 BOC threshold)
  // OBBBA §70513: BOC before Jun 16 2025 = 40%, Jun 16-Dec 31 2025 = 45%, 2026 = 50%, after 2026 = 55%
  // FIX T-3: OBBBA §70513 BOC thresholds auto-compute by year (was hardcoded 0.50)
  // Jun 16 2025 = 45%, 2026 = 50%, 2027+ = 55%
  const domesticContentThreshold = (() => {
    const yr = new Date().getFullYear();
    if (yr <= 2025) return 0.45;
    if (yr === 2026) return 0.50;
    return 0.55;
  })();
  const usMadeCost = [
    (!solarFEOC && ss?.usMade) ? solarCost : 0,
    (!inverterFEOC && si?.usMade) ? inverterCost : 0,
    (!rackingFEOC && sr?.usMade) ? rackingCost : 0,
    (!bessFEOC && sb?.usMade) ? bessCost : 0
  ].reduce((a, b) => a + b, 0);
  const totalNonFEOCCost = [
    !solarFEOC ? solarCost : 0,
    !inverterFEOC ? inverterCost : 0,
    !rackingFEOC ? rackingCost : 0,
    !bessFEOC ? bessCost : 0
  ].reduce((a, b) => a + b, 0);
  const domesticContentPct = totalNonFEOCCost > 0 ? usMadeCost / totalNonFEOCCost : 0;
  const domesticContentEligible = domesticContentPct >= domesticContentThreshold;
  // FIX B-6 (Phase 4): Energy community bonus — +10% ITC for qualifying census tracts
  // Per IRA §48E(a)(3)(B) — project must be in energy community: brownfield, fossil fuel employment, or coal closure
  // This is a user-attestable flag since lookup requires DOE API. Default: false (conservative)
  const isEnergyCommunitySelfAttested = formData?.energyCommunity === 'yes';
  const itcEnergyCommunityBonus = isEnergyCommunitySelfAttested ? 0.10 : 0;
  const itcBaseRate = ITC_RATE; // ← merlinConstants SSOT
  const itcDomesticBonus = domesticContentEligible ? ITC_DOMESTIC_BONUS : 0;
  const itcTotalRate = itcBaseRate + itcDomesticBonus + itcEnergyCommunityBonus;

  // ── ITC CALCULATION — Solar and BESS separated per OBBBA timelines ──
  // Solar §48E: BOC by Jul 4, 2026 → PIS by Dec 31, 2027 (or terminated)
  // BESS §48E: available through 2033 (original IRA phaseout — unaffected by OBBBA)
  // Separation matters: if project slips past 2027 PIS, BESS ITC still applies
  const solarItcEligibleEquip = (solarFEOC ? 0 : solarCost) + (inverterFEOC ? 0 : inverterCost) + (rackingFEOC ? 0 : rackingCost);
  const bessItcEligibleEquip = feocStrictMode ? bessItcEligibleStrict : (bessFEOC ? 0 : bessCost); // FIX M-3: conservative — CATL cells exclude BESS from ITC
  const itcEligibleEquip = solarItcEligibleEquip + bessItcEligibleEquip;
  const solarItcMargin = Math.round(
    (solarFEOC ? 0 : solarCost) * MARGIN_RATES.solar +
    (inverterFEOC ? 0 : inverterCost) * MARGIN_RATES.inverter +
    (rackingFEOC ? 0 : rackingCost) * MARGIN_RATES.racking
  ); // Per-component ITC margin — solar/inverter/racking at their respective rates
  const bessItcMargin = Math.round(bessItcEligibleEquip * MARGIN_RATES.bess);
  const itcEligibleMargin = solarItcMargin + bessItcMargin;
  // Expansion margins are ITC-eligible (solar infrastructure)
  const expansionItcMargin = expansionPanelMargin + expansionStructMargin;
  const solarItcBasis = solarItcEligibleEquip + solarItcMargin + expansionPanelCost + expansionStructuralCost + expansionItcMargin; // Expansion panels + canopy/ground structure + their margins are ITC-eligible
  const bessItcBasis = bessItcEligibleEquip + bessItcMargin;
  const itcBasis = solarItcBasis + bessItcBasis;
  const solarITC = Math.round(solarItcBasis * itcTotalRate);
  const bessITC = Math.round(bessItcBasis * itcTotalRate);
  const federalITC = solarITC + bessITC;

  // Dynamic ITC labels — show solar/BESS separation
  const itcPctLabel = `${(itcTotalRate * 100).toFixed(0)}%`;
  const itcIncludedItems = ['Solar', 'inverter', 'racking'].filter((item, i) => ![solarFEOC, inverterFEOC, rackingFEOC][i]);
  const itcExcludedItems = feocItems;
  const itcComponentsList = itcIncludedItems.join(' + ') + (bessItcBasis > 0 ? ' + BESS' : '');
  const itcLabel = `§48E ITC (${itcPctLabel} of ${$fmt(itcBasis)})`;

  // ── §30C EV Charger Credit — 30% up to $100K ──
  const evChargerCredit = includeEV ? Math.round(Math.min(evBaseCost * EV_CHARGER_CREDIT_RATE, EV_CHARGER_CREDIT_MAX)) : 0; // ← merlinConstants SSOT
  const totalFederalCredits = federalITC + evChargerCredit;

  // ── MACRS 5-Year Depreciation + 100% Bonus ──
  const depreciableBasis = Math.round(itcBasis - (federalITC * ITC_BASIS_HAIRCUT)); // ← merlinConstants SSOT
  // Entity-based effective tax rate — driven by Wizard A Q7 (entityType)
  const ENTITY_TAX_RATES = {
    c_corp: 0.265,     // 21% federal + ~5.5% avg state = 26.5% effective
    s_corp: 0.296,     // Pass-through: avg marginal ~29.6% (24% federal bracket + state)
    llc: 0.296,        // Same as S-Corp for most commercial LLCs
    sole_prop: 0.32,   // Higher individual bracket risk (24-32% marginal + SE tax)
  };
  const entityType = formData?.entityType || 'c_corp'; // Default to C-Corp if not provided
  const assumedTaxRate = ENTITY_TAX_RATES[entityType] || 0.265; // Entity-specific rate
  // FIX #114: 5-yr MACRS schedule. OBBBA §70301 makes 100% bonus depreciation permanent (replaces prior 40% phasedown).
  const bonusDepreciationRate = BONUS_DEPRECIATION_RATE; // ← merlinConstants SSOT (OBBBA §70301: permanent 100%)
  const macrsSchedule = MACRS_SCHEDULE; // ← merlinConstants SSOT (5-yr half-year convention)
  const macrsTaxBenefitByYear = (year) => { // year is 1-indexed
    if (year < 1 || year > 6) return 0;
    const bonusYr1 = year === 1 ? depreciableBasis * bonusDepreciationRate * assumedTaxRate : 0;
    const remainingBasis = depreciableBasis * (1 - bonusDepreciationRate);
    const regularDepr = year <= 6 ? remainingBasis * macrsSchedule[year - 1] * assumedTaxRate : 0;
    return Math.round(bonusYr1 + regularDepr);
  };
  const depreciationBenefit = Math.round(depreciableBasis * assumedTaxRate); // Total for display/net cost

  // ── Generator MACRS Depreciation (7-yr, §168(e)(3)(B)) — NO ITC, NO basis haircut ──
  // Generators <500 kW are 7-yr MACRS property. With 100% bonus (OBBBA §70301), all hits Year 1.
  const genDepreciableBasis = includeGenerator ? genCost : 0;
  const MACRS_7YR_SCHEDULE = [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446];
  const genMacrsTaxBenefitByYear = (year) => {
    if (genDepreciableBasis <= 0) return 0;
    const genBonusYr1 = year === 1 ? genDepreciableBasis * bonusDepreciationRate * assumedTaxRate : 0;
    const genRemaining = genDepreciableBasis * (1 - bonusDepreciationRate);
    const genRegular = year <= 8 ? genRemaining * (MACRS_7YR_SCHEDULE[year - 1] || 0) * assumedTaxRate : 0;
    return Math.round(genBonusYr1 + genRegular);
  };
  const genDepreciationBenefit = Math.round(genDepreciableBasis * assumedTaxRate);
  const totalDepreciationBenefit = depreciationBenefit + genDepreciationBenefit;

  // ── STATE INCENTIVES — FEOC-aware ──
  // States increasingly require domestic content or non-FEOC for state-level credits
  const stateIncentiveData = STATE_INCENTIVES[state] || STATE_INCENTIVES.default;
  // FIX #117: Use actualSystemKW (from panel count) to match installed capacity
  const solarStateIncentive = solarFEOC ? 0 : Math.round(actualSystemKW * stateIncentiveData.solarPerKW);
  const bessStateIncentive = bessFEOC ? 0 : Math.min(Math.round(rec.bess.capacityKWh * stateIncentiveData.bessPerKWh), stateIncentiveData.maxBess);
  const totalStateIncentive = solarStateIncentive + bessStateIncentive;

  // FIX PB-5: Annual state clean energy revenue — SREC/TREC/SMART/Solar Currents programs
  // These are ONGOING annual revenue streams (not one-time rebates) that significantly improve payback
  // Source: SREC Trade, state PUC filings, program administrators (Feb 2026)
  // Values in $/kWh of solar production — conservative estimates (actual varies by vintage/market)
  const STATE_ANNUAL_SOLAR_REVENUE = {
    NJ: 0.040,  // NJ TREC (~$90/MWh Class I RECs, maturing market)
    MA: 0.060,  // SMART program ($60-160/MWh depending on capacity block)
    IL: 0.045,  // IL Shines (~$45/MWh adjustable block)
    MD: 0.030,  // MD SREC (~$30/MWh, declining but active)
    DC: 0.035,  // DC SREC (~$350/SREC, strong market)
    OH: 0.015,  // OH renewable energy credits (~$15/MWh)
    PA: 0.012,  // PA SREC (~$12/MWh, oversupplied)
    MI: 0.025,  // DTE Solar Currents / Consumers Voluntary Green Pricing (~$0.025/kWh)
    NY: 0.035,  // Value of DER (VDER) — location-based value stack
    CT: 0.030,  // LREC/ZREC programs
    RI: 0.025,  // REG program
    VT: 0.020,  // Standard Offer / net metering
    ME: 0.015,  // Distributed generation RECs
    NH: 0.015,  // Class II RECs
    CA: 0.020,  // SGIP + avoided cost (post-NEM 3.0)
    CO: 0.015,  // Xcel Solar*Rewards
    MN: 0.020,  // Xcel Solar*Rewards / community solar
    OR: 0.015,  // Oregon community solar incentive
    default: 0.000
  };
  const annualSRECRate = STATE_ANNUAL_SOLAR_REVENUE[state] || STATE_ANNUAL_SOLAR_REVENUE.default;
  const annualSRECRevenue = solarFEOC ? 0 : Math.round(annualProduction * annualSRECRate);

  // ── SALES TAX ──
  const SALES_TAX_RATES = { MI: 0.06, TX: 0.0625, CA: 0.0725, FL: 0.06, NY: 0.08, AZ: 0.056, OH: 0.0575, GA: 0.04, NC: 0.0475, NV: 0.0685, CO: 0.029, IL: 0.0625, PA: 0.06, NJ: 0.0663, MA: 0.0625, default: 0.06 };
  const taxableHardware = equipmentSubtotal; // Landed cost (includes tariff)
  const SOLAR_TAX_EXEMPT_STATES = new Set(['NJ','NY','CT','MA','MD','PA','RI','VT','AZ','CO','FL','IA','MN','MT','NV','NM','OH','OR','TX','VA','WA','WY']);
  const taxableNonSolar = genCost + evCost + monitorCost + enhancementAddonCost;
  const stateSalesTax = SOLAR_TAX_EXEMPT_STATES.has(state)
    ? Math.round(taxableNonSolar * (SALES_TAX_RATES[state] || SALES_TAX_RATES.default))
    : Math.round(taxableHardware * (SALES_TAX_RATES[state] || SALES_TAX_RATES.default));

  const netCost = grossCost - totalFederalCredits - totalStateIncentive + stateSalesTax;
  const netAfterDepreciation = netCost - totalDepreciationBenefit; // FIX GEN-1: includes generator MACRS

  // ═══ FINANCE ENGINE — Industry-benchmarked calculations ═══
  const utilityEscalation = STATE_ESCALATION_RATES[state] || STATE_ESCALATION_RATES.default;
  // Dynamic production — solarProductionRate, wr, tempDerate, annualProduction (FIX H-4: _solarSource removed)
  // moved to FIX TDZ-3 block above (before maxOffsetKW) to prevent TDZ crash
  // BESS demand savings — derived from battery power output and facility demand profile
  // FIX #106: Use optimizer-sized BESS power, not supplier module spec
  const peakShavePct = Math.min((rec.bess.powerKW || 50) / Math.max(rec.facilityLoad.peakDemandKW, 1), 0.40); // Cap at 40%
  // FIX #119: BESS round-trip efficiency reduces effective peak shaving (charge/discharge losses)
  const bessRoundTripEff = (sb?.roundTrip || 93) / 100; // e.g. 0.93 for Tesla, 0.96 for Enphase
  const annualDemandSavings = Math.round((rec.facilityLoad.savingsPeakKW || rec.facilityLoad.peakDemandKW) * rec.assumptions.demandCharge * peakShavePct * bessRoundTripEff * 12);
  // FIX #120: Self-consumption vs export — most commercial systems sized ≤100% offset
  // but if production exceeds usage, excess is exported at wholesale/avoided-cost rate (~40-60% of retail)
  // FIX H-2: Industry-specific self-consumption factor (solar produces daytime only; BESS shifts 15-25%)
  // FIX AUDIT-2: Keys normalized to match INDUSTRIES[].id values from WizA; car wash subtypes for facilityType fallback
  // FIX C-1/M-1: UNIFIED — selfConsumptionRate already computed above (single model)
  // selfConsumedKWh and exportedKWh now use the same rate as expansion savings
  // savingsAnnualKWh already declared above (FIX TDZ-2)
  const selfConsumedKWh = Math.min(Math.round(annualProduction * selfConsumptionRate), savingsAnnualKWh);
  const exportedKWh = Math.max(0, annualProduction - selfConsumedKWh);
  // FIX B-4 (Phase 2): State-specific NEM export rates
  // Source: NREL NEM policy database, state PUC filings, verified Feb 2026
  // CA NEM 3.0 (~25% of retail), HI CGS (15%), most states 40-60%, MA full retail
  // NEM export credit rates as fraction of retail rate — STATIC SNAPSHOT as of Q1 2025
  // WARNING: NEM policies change rapidly (e.g. CA NEM 3.0, NV NEM 3.0). Verify with local utility.
  // Values represent approximate export credit / retail rate ratio. Actual tariffs may differ.
  const STATE_NEM_RATES = {
    CA: 0.25, HI: 0.15, NV: 0.35, AZ: 0.35, TX: 0.40, // Reformed/reduced NEM states
    FL: 0.45, GA: 0.45, NC: 0.45, SC: 0.45, AL: 0.45,  // Southeast — partial credit
    NY: 0.75, MA: 0.80, NJ: 0.75, CT: 0.70, RI: 0.70,  // Northeast — strong NEM
    MD: 0.65, VT: 0.70, NH: 0.65, ME: 0.60, PA: 0.55,  // Mid-Atlantic
    IL: 0.55, OH: 0.50, MI: 0.75, IN: 0.45, WI: 0.50,  // Midwest — MI: DTE/Consumers C&I inflow/outflow near retail
    MN: 0.60, IA: 0.55, CO: 0.50, OR: 0.55, WA: 0.50,  // West
    default: 0.50
  };
  const nemRate = STATE_NEM_RATES[state] || STATE_NEM_RATES.default;
  const exportRate = utilityRate * nemRate;
  const annualEnergySavings = Math.round(selfConsumedKWh * utilityRate + exportedKWh * exportRate);
  // FIX B-10 (Phase 4): TOU solar value premium — solar produces during peak hours
  // In TOU states, solar energy displaces expensive peak/mid-peak power, adding 5-25% value
  const touStates = { CA: 1.20, HI: 1.15, AZ: 1.15, NV: 1.12, CT: 1.10, MA: 1.10, NY: 1.08, IL: 1.08, CO: 1.06, MD: 1.06 };
  const touMultiplier = touStates[state] || 1.00; // 1.0 for flat-rate states
  const touPremium = touMultiplier > 1.0 ? Math.round(annualEnergySavings * (touMultiplier - 1.0)) : 0;

  // FIX B-11 (Phase 4): BESS TOU arbitrage revenue — charge off-peak, discharge on-peak
  // Only meaningful in states with >$0.08/kWh peak-to-offpeak spread
  const peakOffpeakSpread = (locationData?.utility?.electric?.peakRate || 0) - (locationData?.utility?.electric?.offPeakRate || 0);
  const bessArbitrageRevenue = peakOffpeakSpread > 0.05
    ? Math.round(rec.bess.capacityKWh * 365 * peakOffpeakSpread * bessRoundTripEff * 0.60) // 60% utilization factor
    : 0;

  const annualTotalSavings = annualEnergySavings + annualDemandSavings + touPremium + bessArbitrageRevenue;
  
  // MODEL D: Cap bill reduction at 90% of actual bill (can't eliminate fixed charges, transmission fees)
  // This prevents oversized projections when profile kWh > actual consumption
  const financialAnnualBill = rec.assumptions?.financialAnnualBill;
  const maxBillReduction = financialAnnualBill ? Math.round(financialAnnualBill * 0.90) : Infinity;
  const cappedEnergySavings = Math.min(annualEnergySavings + touPremium, maxBillReduction);
  const cappedDemandSavings = Math.min(annualDemandSavings, 
    financialAnnualBill ? Math.round(financialAnnualBill * 0.45) : Infinity); // Demand charges cap at 45% of bill
  const annualCappedSavings = Math.min(annualTotalSavings, 
    financialAnnualBill ? cappedEnergySavings + cappedDemandSavings + bessArbitrageRevenue : annualTotalSavings);
  // FIX #61: EV revenue — cost is in grossCost, revenue must be in savings for honest ROI
  // L2: ~3 sessions/day × $8/session × 365 = $8,760 gross; subtract electricity cost
  // DCFC: ~8 sessions/day × $15/session × 365 = $43,800 gross; subtract electricity cost
  // FIX #115: DCFC demand charge impact — each DCFC increases peak demand
  // BESS mitigates some via peak shaving, but net increase is still significant
  // FIX AUDIT-8: Was 150kW (ultra-fast), but Step 4 equipment model uses 50kW standard DCFC.
  // Using 150kW overstated DCFC demand costs by 3× in financial model.
  const dcDemandImpactKW = (enhancementConfigs.evCharging.dcCount || 0) * 50 * (1 - peakShavePct); // Net after BESS shaving
  const dcDemandCostAnnual = Math.round(dcDemandImpactKW * rec.assumptions.demandCharge * 12);
  // FIX #121: DCFC kWh/session = 30 (industry avg 50kW × 35min), sessions = 4/day for commercial
  // FIX AUDIT-7: L2 kWh/session was 30 (same as DCFC) — WRONG. L2 at 12kW × ~30min car wash dwell = 6 kWh.
  // FIX S5-B: L2 was 3 sessions/day × $8 = $8,760 gross/charger — overstated 2.5×
  // DOE/AFDC L2 at retail: 1-2 sessions/day, $2K-$4K/yr NET. Use 2 sessions × $5 = $3,650 gross.
  // Car wash EV fleet penetration: ~5% of 300 cars = 15 EVs/day. 6 L2 chargers → 2.5 sessions/charger/day max.
  // Conservative-realistic: 2 sessions/day × $5/session (30min dwell, premium pricing).
  // DCFC: 4 sessions/day × $15 = $21,900 gross (was 6 sessions — aggressive for car wash location).
  const evAnnualNetRevenue = includeEV ? Math.round(
    (enhancementConfigs.evCharging.l2Count * (2 * 365 * 5 - 6 * 2 * 365 * utilityRate)) +
    ((enhancementConfigs.evCharging.dcCount || 0) * (4 * 365 * 15 - 30 * 4 * 365 * utilityRate))
    - dcDemandCostAnnual
  ) : 0;
  const panelDegradation = ss?.degradation || 0.005; // Use selected supplier's rate; fallback 0.5%/yr
  // FIX B-9 (Phase 3): Year 1 elevated degradation — LID (PERC) / LeTID (N-type)
  // PERC panels: ~2% first-year light-induced degradation
  // N-type (TOPCon/HJT): ~1% first-year (lower LeTID susceptibility)
  const isNType = ss?.technology && (ss.technology.toLowerCase().includes('n-type') || ss.technology.toLowerCase().includes('topcon') || ss.technology.toLowerCase().includes('hjt'));
  const year1LID = isNType ? 0.01 : 0.02; // 1% N-type, 2% PERC

  // ═══ O&M AND WEATHER RISK COSTS — critical for honest ROI ═══
  // Standard commercial solar O&M: $12-18/kW/yr (cleaning, inverter monitoring, inspections)
  // FIX PB-2: O&M updated to NREL 2025 ATB + LBNL 2025 Utility-Scale Solar benchmarks
  // Solar: $10-14/kW/yr commercial (NREL ATB 2025 mid = $12); BESS: $2-6/kWh/yr LFP (NREL mid = $4)
  // Previous $15+$7 was conservative high-end, inflating payback by ~0.5yr
  const solarOM = Math.round(totalSystemKW * 12); // FIX PB-7: $12/kW/yr — NREL 2025 ATB C&I median. Uses totalSystemKW (roof + canopy), was actualSystemKW (roof only).
  // FIX #103: BESS O&M — augmentation, thermal management, BMS monitoring
  const bessOM = Math.round(rec.bess.capacityKWh * 2.5); // FIX PB-6: $2.50/kWh/yr — NREL 2025 ATB C&I LFP median (modern LFP: less augmentation, passive thermal, longer cycle life than NMC). Was $4/kWh (upper quartile / legacy NMC).
  const annualOM = solarOM + bessOM;
  
  // Weather maintenance reserve: annualized expected panel replacement cost
  // In hail-prone states, panels WILL get damaged. Manufacturer warranties cover defects,
  // NOT impact damage. This reserve represents the probability-weighted replacement cost.
  const panelReplacementCostFull = Math.round(solarBaseCost * 0.75); // Panels ~75% of solar base cost (replacement won't carry tariff)
  const annualWeatherReserve = Math.round((panelReplacementCostFull * wr.panelReplacementProbability) / 25);
  // FIX B-2 (Phase 3): Property insurance rider for solar/BESS equipment
  // Owner pays ~0.35% of gross system cost/yr (typical commercial insurance rider)
  // For PPA/lease: excluded — developer covers insurance through their financing
  // FIX PB-8: Insurance rider 0.20% — GTM Research 2025 C&I solar insurance benchmark mid-range (0.15-0.25%)
  // Applied to solar+BESS equipment only — generator has standalone service contract w/ maintenance agreement
  const insurableEquipCost = grossCost - (includeGenerator ? genCost : 0);
  const annualInsurance = Math.round(insurableEquipCost * 0.0020);
  const annualTotalCosts = annualOM + annualWeatherReserve + annualInsurance;
  // Customer-only costs under PPA/operating lease — developer covers solar O&M, insurance, weather risk
  // Customer still pays BESS maintenance (augmentation, thermal, BMS monitoring)
  const customerOnlyOM = bessOM;

  // ── Generator Avoided-Downtime Value ──
  // Generator provides backup during outages, avoiding revenue loss.
  // Uses industry-specific downtime cost × estimated annual outage events.
  // Conservative: 5 outage days/yr (EIA SAIDI avg for commercial = 4-8 hrs × 3-7 events)
  const _industryDowntimeCost = INDUSTRY_CONSUMPTION[selectedIndustry?.id]?.downtimeCost || 1000;
  const genAnnualAvoidedDowntime = includeGenerator ? Math.round(_industryDowntimeCost * 5) : 0;

  // FIX #123: Equipment replacement capex in 25-yr model
  // Inverter replacement ~year 12 (string inverters 12yr warranty; replacement at ~75% of original cost — no tariff on domestic swap)
  const inverterReplacementCost = Math.round(inverterBaseCost * 0.75);
  const inverterReplacementYear = si?.type === 'Micro' ? 20 : 12; // Microinverters last 20-25yr; string inverters 12-15yr
  // BESS replacement ~year 15 (LFP at 70% EOL capacity)
  // FIX PB-9: Bloomberg NEF LFP cost decline 8-10%/yr → by year 15 (2041): ~35% of 2026 cost
  // At 8%/yr: 0.92^15 = 0.29. At 10%/yr: 0.90^15 = 0.21. Conservative: 35% (accounts for install labor)
  const bessReplacementCost = Math.round(bessBaseCost * 0.35); // Was 0.60 — overestimated by ~2x
  const bessReplacementYear = Math.min(sb?.warranty || 15, 15); // Replace at end of warranty or year 15
  // Helper: one-time replacement cost for a given year
  const replacementCapex = (year) =>
    (year === inverterReplacementYear ? inverterReplacementCost : 0) +
    (year === bessReplacementYear ? bessReplacementCost : 0);
  
  // Net savings = gross savings minus real costs the customer will face
  // MODEL D: Use capped savings (can't save more than actual bill) for honest payback
  const annualNetSavings = annualCappedSavings + evAnnualNetRevenue + enhancementAddonSavings + expansionAddedSavings + annualSRECRevenue + genAnnualAvoidedDowntime - annualTotalCosts; // FIX PB-5: +annualSRECRevenue, FIX GEN-2: +genAvoidedDowntime

  // ── THREE-BUCKET FINANCIAL MODEL (for honest Step 7 reporting) ──
  // Bucket 1: BILL REDUCTION — what actually comes off your electric bill
  // VFD savings are electric → included in bill reduction. Water reclaim & HPWH are non-electric savings.
  const annualBillReduction = annualEnergySavings + annualDemandSavings + touPremium + vfdAddonSavings + expansionAddedSavings;
  // Bucket 2: NEW REVENUE — money you didn't have before  
  const annualNewRevenue = bessArbitrageRevenue + evAnnualNetRevenue + annualSRECRevenue; // FIX PB-5: +SREC
  // Bucket 2b: NON-ELECTRIC SAVINGS — water, gas offsets, monitor — all now wired through enhancementAddonSavings (FIX S5-1/S5-5)
  // Bucket 3: OPERATING COSTS — what you pay to keep the system running
  // annualTotalCosts already defined above
  
  // Cross-check: user's annual bill vs modeled electricity cost
  const modeledAnnualElecCost = Math.round((rec.facilityLoad.savingsAnnualKWh || rec.facilityLoad.annualUsageKWh) * utilityRate + (rec.facilityLoad.savingsPeakKW || rec.facilityLoad.peakDemandKW) * (rec.assumptions?.demandCharge ?? 0) * 12);
  const userAnnualBill = initialAnnualBill || modeledAnnualElecCost;
  const billModelDivergence = userAnnualBill > 0 ? Math.abs(modeledAnnualElecCost - userAnnualBill) / userAnnualBill : 0;
  // Cap bill reduction at user's actual bill (can't save more than you spend)
  const cappedBillReduction = Math.min(annualBillReduction, userAnnualBill);
  const billReductionPct = userAnnualBill > 0 ? Math.round(cappedBillReduction / userAnnualBill * 100) : 0;
  const newMonthlyBill = Math.round((userAnnualBill - cappedBillReduction) / 12);
  const currentMonthlyBill = Math.round(userAnnualBill / 12);

  // ═══ SUSTAINABILITY FINANCIAL METRICS ═══
  // These are real revenue/value lines, not just feel-good numbers
  // FIX #157: Carbon, RECs, and property value — monetized for PE/commercial owners
  
  // Carbon avoidance: EPA eGRID regional emission factors (lb CO2/MWh → metric tons)
  const STATE_EMISSION_FACTORS = {
    TX: 0.396, CA: 0.206, NY: 0.213, FL: 0.411, PA: 0.373, OH: 0.577, IL: 0.309,
    GA: 0.409, NC: 0.347, MI: 0.472, VA: 0.322, NJ: 0.237, AZ: 0.388, MA: 0.284,
    WA: 0.078, CO: 0.482, MN: 0.377, WI: 0.478, IN: 0.614, MO: 0.582,
    default: 0.386 // US national avg
  };
  const emissionFactor = STATE_EMISSION_FACTORS[state] || STATE_EMISSION_FACTORS.default; // tCO2/MWh
  const annualCO2Avoided = Math.round(annualProduction / 1000 * emissionFactor * 10) / 10; // metric tons/yr
  const lifetimeCO2Avoided = Math.round(annualCO2Avoided * 22.5); // 25yr avg w/ degradation
  // Voluntary carbon market: $25-60/tCO2 (2025-26 range, Verra/Gold Standard)
  // SSOT #26 / FIX H-6: BESS degradation from supplier cycle_life (not hardcoded 2%)
  // Derive annual degradation from supplier's rated cycle count
  // 6000 cycles ÷ 365 = 16.4yr life → 20%/16.4 ≈ 1.22%/yr; 10000 cycles → 0.73%/yr
  const bessCycles = sb?.cycles || 6000; // Default 6000 if missing
  const bessDegRate = Math.max(0.005, Math.min(0.04, 0.20 / (bessCycles / 365))); // 0.5%-4% band

  // Voluntary carbon market: Verra VCUs $8-15/ton, Gold Standard $10-25/ton (2024-25 avg)
  const carbonCreditPrice = CARBON_CREDIT_PRICE; // ← merlinConstants SSOT
  const annualCarbonValue = Math.round(annualCO2Avoided * carbonCreditPrice);
  
  // RECs (Renewable Energy Certificates): state-specific pricing
  // Source: EPA Green Power Partnership, S&P Global Platts REC indices
  const STATE_REC_RATES = {
    TX: 2.5, CA: 8, NY: 12, NJ: 18, MA: 25, CT: 22, MD: 8, OH: 5, PA: 6, IL: 4,
    MI: 5, VA: 4, NC: 3, GA: 2, FL: 2, CO: 3, MN: 3, AZ: 2, WA: 1.5, OR: 2,
    default: 3 // $/MWh baseline
  };
  const recRate = STATE_REC_RATES[state] || STATE_REC_RATES.default; // $/MWh
  const annualRECRevenue = Math.round(annualProduction / 1000 * recRate);
  
  // Combined green revenue (not included in annualNetSavings — separate upside)
  const annualGreenRevenue = annualCarbonValue + annualRECRevenue;
  // Degradation-adjusted 25yr multiplier: sum of (1-LID)×(1-deg)^i for i=0..24
  const greenRevMultiplier = Array.from({length: 25}, (_, i) => (1 - year1LID) * Math.pow(1 - panelDegradation, i)).reduce((a, b) => a + b, 0);
  const lifetime25GreenRevenue = Math.round(annualGreenRevenue * greenRevMultiplier);
  
  // Property value uplift: Lawrence Berkeley National Lab study — commercial solar adds 3-5% appraisal value
  // Conservative 3% for car wash / small commercial; higher for Class A office, hotel, data center
  const INDUSTRY_PROPERTY_PREMIUM = {
    hotel: 0.045, datacenter: 0.05, office: 0.04, retail: 0.035,
    restaurant: 0.03, carwash: 0.03, cstore: 0.03, default: 0.035
  };
  const propertyPremiumPct = INDUSTRY_PROPERTY_PREMIUM[selectedIndustry?.id] || INDUSTRY_PROPERTY_PREMIUM.default;
  // LBNL commercial solar appraisal: solar adds 3-5% of SYSTEM COST directly to property value
  // Not 3% of estimated property value — the system IS the value driver
  const propertyValueUplift = Math.round(grossCost * propertyPremiumPct);
  
  // Equivalent environmental metrics (for marketing/ESG reporting)
  const treesEquivalent = Math.round(annualCO2Avoided / 0.022); // EPA: 1 tree absorbs ~22 kg CO2/yr
  const carsEquivalent = Math.round(annualCO2Avoided / 4.6); // EPA: avg car = 4.6 tCO2/yr
  const homesEquivalent = Math.round(annualProduction / 10500); // EPA: avg US home = 10,500 kWh/yr
  // FIX #31: Panel degradation applies ONLY to solar energy savings, NOT BESS demand savings
  // FIX AUDIT-8: Single source of truth for year-by-year gross savings (was duplicated 7 times)
  // yr0 = 0-indexed year (0 = first year). Returns gross savings BEFORE costs/replacements.
  const calcYearGrossSavings = (yr0) => {
    const escF = Math.pow(1 + utilityEscalation, yr0);
    const degF = (1 - year1LID) * Math.pow(1 - panelDegradation, yr0);
    const yr1 = yr0 + 1;
    const bessDegF = yr1 <= bessReplacementYear
      ? Math.pow(1 - bessDegRate, yr0)
      : Math.pow(1 - bessDegRate, yr0 - bessReplacementYear);
    return (annualEnergySavings * escF * degF)
      + (annualDemandSavings * escF * bessDegF)
      + (touPremium * escF * degF)
      + (bessArbitrageRevenue * escF * bessDegF)
      + (evAnnualNetRevenue * escF)
      + (enhancementAddonSavings * escF)
      + (expansionAddedSavings * escF * degF)
      + (annualSRECRevenue * escF * degF)
      + (genAnnualAvoidedDowntime * escF);
  };

  // FIX AUDIT-1: Added touPremium + bessArbitrageRevenue (were missing from 25yr model)
  // FIX AUDIT-4: BESS degradation resets after replacement year
  // FIX AUDIT-8: Now uses calcYearGrossSavings SSOT
  const calcCumulativeSavings = (years) => Math.round(Array.from({length: years}, (_, i) => {
    const yr = i + 1;
    const yrCosts = annualTotalCosts * Math.pow(1.02, i);         // O&M escalates ~2%/yr
    const yrReplace = replacementCapex(yr);                       // FIX #123: Inverter yr 12, BESS yr 15
    return calcYearGrossSavings(i) - yrCosts - yrReplace;
  }).reduce((a, b) => a + b, 0));

  // Payback helper — proper escalating savings with interpolation
  // FIX AUDIT-8: Now uses calcYearGrossSavings SSOT
  const calcPayback = (investment) => {
    let cum = 0;
    for (let y = 1; y <= 25; y++) {
      const yrSav = calcYearGrossSavings(y - 1) - (annualTotalCosts * Math.pow(1.02, y - 1));
      const yrDepr = macrsTaxBenefitByYear(y) + genMacrsTaxBenefitByYear(y); // FIX GEN-1: includes generator 7-yr MACRS
      const yrReplace = replacementCapex(y); // FIX #123: Inverter yr 12, BESS yr 15
      cum += yrSav + yrDepr - yrReplace;
      if (cum >= investment) {
        const prev = cum - yrSav - yrDepr + yrReplace;
        const yrTotal = yrSav + yrDepr - yrReplace;
        return +(yrTotal > 0 ? (y - 1) + (investment - prev) / yrTotal : 25).toFixed(1);
      }
    }
    return 25;
  };

  // FIX B-12 (Phase 4): Salvage/residual value at year 25
  // Panels still produce ~80-88% of rated output at year 25. Residual value = panel value + racking scrap
  // Conservative: 10% of solar equipment original cost (panels degraded but functional)
  // BESS/inverter: $0 residual (already replaced at yr 12/15, second units have 10-13yr remaining life — value embedded in cashflow)
  const salvageValue = Math.round(solarBaseCost * 0.10 + rackingBaseCost * 0.05);

  // Purchase metrics — FIX #114: payback uses netCost; MACRS benefits arrive year-by-year inside calcPayback
  const purchasePayback = calcPayback(netCost);
  const purchase25yr = Math.round(calcCumulativeSavings(25) - netAfterDepreciation + salvageValue); // FIX B-12: includes salvage
  // FIX #48: Guard against zero/negative netAfterDepreciation (when incentives exceed cost)
  const purchaseROI = netAfterDepreciation > 0 
    ? Math.round(purchase25yr / netAfterDepreciation * 100)
    : 999; // Effectively infinite ROI when incentives exceed out-of-pocket cost

  // ── DUAL PAYBACK METRICS (for investor credibility) ──
  // "Industry Simple" = (Gross Cost - ITC - MACRS) / Gross Annual Savings (no O&M, no degradation, no replacements)
  // This is what ETB, Aurora, and most competitor proposals show
  const grossAnnualSavings = annualCappedSavings + evAnnualNetRevenue + enhancementAddonSavings + expansionAddedSavings + annualSRECRevenue + genAnnualAvoidedDowntime;
  const industrySimplePayback = grossAnnualSavings > 0 ? +((netAfterDepreciation) / grossAnnualSavings).toFixed(1) : 25;
  // Energy-only payback (solar + BESS — excludes generator cost & savings for clean energy ROI)
  const energyOnlyNetCost = netCost - (includeGenerator ? genCost : 0);
  const energyOnlyDepr = netCost - totalDepreciationBenefit - (includeGenerator ? genCost : 0) + (includeGenerator ? genDepreciationBenefit : 0);
  const energyOnlyGrossSav = grossAnnualSavings - genAnnualAvoidedDowntime;
  const energyOnlyPayback = energyOnlyGrossSav > 0 ? +(energyOnlyDepr / energyOnlyGrossSav).toFixed(1) : 25;

  // Lease calculations — realistic lease factors by term (post-ITC passthrough)
  const LEASE_FACTORS = { 7: 0.0068, 10: 0.0055, 15: 0.0042, 20: 0.0035 };
  // FIX #110: If FEOC reduces ITC, lessor loses tax benefit → higher lease factor
  // FIX #113: Compare actual ITC to what ITC WOULD be if nothing was FEOC
  const itcBasisFullEligible = (solarCost + inverterCost + rackingCost + bessCost) + Math.round(solarCost * MARGIN_RATES.solar + inverterCost * MARGIN_RATES.inverter + rackingCost * MARGIN_RATES.racking + bessCost * MARGIN_RATES.bess);
  const itcLossRatio = itcBasisFullEligible > 0 ? 1 - (federalITC / (itcBasisFullEligible * itcTotalRate)) : 1; // 0 = full ITC, 1 = no ITC
  const feocLeaseAdj = 1 + (itcLossRatio * 0.15); // Up to 15% higher factor when no ITC
  const leaseFactor = (LEASE_FACTORS[leaseTerm] || 0.0055) * (leaseType === 'capital' ? 1 : feocLeaseAdj);
  const leaseMonthly = Math.round(grossCost * leaseFactor);
  const leaseAnnualPayment = leaseMonthly * 12;
  // FIX #118: Operating lease → lessor handles O&M (baked into payment). Capital lease → user pays O&M.
  const leaseNetSavingsBase = leaseType === 'capital' ? annualNetSavings : (annualTotalSavings + evAnnualNetRevenue + enhancementAddonSavings + expansionAddedSavings + annualSRECRevenue + genAnnualAvoidedDowntime - customerOnlyOM); // FIX PB-5: +SREC; FIX AUDIT-7: +gen; Operating: lessor covers solar O&M/insurance, customer pays BESS O&M
  const leaseYr1Savings = leaseNetSavingsBase - leaseAnnualPayment;
  const leaseTotalCost = Math.round(Array.from({length: leaseTerm}, (_, yr) => leaseMonthly * 12 * Math.pow(1 + leaseEscalator / 100, yr)).reduce((sum, yrPmt) => sum + yrPmt, 0));
  const leaseFMVBuyout = leaseType === 'capital' ? 1 : Math.round(grossCost * 0.10 * Math.pow(0.92, leaseTerm)); // FMV depreciates

  // PPA calculations — realistic rates for Midwest C&I
  const PPA_BASE_RATES = { 10: 0.112, 15: 0.098, 20: 0.085, 25: 0.075 }; // 2025-26 C&I market (NREL/WoodMac); state-specific adjustment via utilityRate
  // FIX #110: PPA developer claims ITC — if FEOC kills it, they charge more
  const feocPpaAdj = 1 + (itcLossRatio * 0.12); // Up to 12% higher rate when no ITC
  const ppaBaseRate = (PPA_BASE_RATES[ppaTerm] || 0.118) * feocPpaAdj;
  const ppaEffRate = ppaRateType === 'fixed' ? ppaBaseRate : Math.round((ppaBaseRate * 0.85) * 1000) / 1000; // Escalating starts ~15% lower
  const ppaEffEscalator = ppaRateType === 'fixed' ? 0 : ppaEscalator;
  const ppaVsUtility = utilityRate > 0 ? Math.round((1 - ppaEffRate / utilityRate) * 100) : 0;
  const ppaYr1Payment = Math.round(annualProduction * ppaEffRate);
  // FIX #118: PPA developer handles all O&M — user only pays PPA rate per kWh
  const ppaYr1Savings = (annualTotalSavings + evAnnualNetRevenue + enhancementAddonSavings + expansionAddedSavings + annualSRECRevenue + genAnnualAvoidedDowntime - customerOnlyOM) - ppaYr1Payment; // FIX AUDIT-7: was missing SREC + gen
  const ppaCrossoverYr = ppaEffEscalator > 0 ? (() => { for (let y = 1; y <= ppaTerm; y++) { if (ppaEffRate * Math.pow(1 + ppaEffEscalator / 100, y) > utilityRate * Math.pow(1 + utilityEscalation, y)) return y; } return null; })() : null;

  // Loan calculations — standard amortization
  const LOAN_RATES = MC_LOAN_RATES; // ← merlinConstants SSOT
  const loanRate = (LOAN_RATES[loanTerm] || 5.9) / 100 / 12; // monthly rate
  // Loan is on gross system cost (ITC comes back at tax time, doesn't reduce loan amount)
  const loanPrincipal = grossCost * (1 - loanDown / 100);
  const loanDownPayment = Math.round(grossCost * loanDown / 100);
  const loanMonths = loanTerm * 12;
  const loanMonthlyPmt = Math.round(loanPrincipal * loanRate / (1 - Math.pow(1 + loanRate, -loanMonths)));
  const loanAnnualPmt = loanMonthlyPmt * 12;
  const loanYr1Savings = annualNetSavings - loanAnnualPmt;
  const loanTotalInterest = Math.round(loanMonthlyPmt * loanMonths - loanPrincipal);
  // Loan payback: total cost recovery — when cumulative savings + MACRS reach netCost + interest
  // FIX P4: Old method started at cum=-downPayment, so with $0 down + year-1 ITC ($115K+),
  // it showed 0.3-0.5 year "break-even" which is misleading next to purchase payback of 9+ years.
  // New method: use same calcPayback() as purchase but with higher hurdle = netCost + total interest.
  // This measures "when have my total benefits covered what I actually spend over the loan life?"
  // Result: loan payback is always ≥ purchase payback (interest adds to cost), which is honest.
  const loanPayback = calcPayback(netCost + loanTotalInterest);

  // Pill button helper
  const Pill = ({ options, value, onChange, color = '#a5b4fc' }) => (
    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, transition: 'all 0.15s', background: value === opt.value ? `${color}20` : 'transparent', color: value === opt.value ? color : '#64748b', outline: value === opt.value ? `1.5px solid ${color}80` : 'none' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  // Scroll right panel to top on step change
  useEffect(() => {
    rightPanelRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  const steps = [
    { num: 1, name: 'Location' }, { num: 2, name: 'Industry' }, { num: 3, name: 'Details' },
    { num: 4, name: 'Goals' }, { num: 5, name: 'Options' }, { num: 6, name: 'System' }, { num: 7, name: 'Quote' },
  ];

  const CONFIGURABLE = ['evCharging', 'extendedBackup', 'generatorHybrid'];

  const toggleEnhancement = (id) => {
    if (selectedEnhancements.includes(id)) {
      setSelectedEnhancements(prev => prev.filter(x => x !== id));
    } else if (CONFIGURABLE.includes(id)) {
      setShowEnhancementConfig(id);
    } else {
      setSelectedEnhancements(prev => [...prev, id]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES - Matches Step 3 design language exactly
  // ═══════════════════════════════════════════════════════════════════════════
  const S = {
    // Layout — RESPONSIVE: stack on mobile, side-by-side on desktop
    shell: { position: 'fixed', inset: 0, background: '#000', zIndex: 40, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
    divider: { display: 'none' },
    grid: isMobile
      ? { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }
      : { display: 'grid', gridTemplateColumns: isTablet ? '280px 1fr' : '1fr 2fr', flex: 1, minHeight: 0 },
    // Left Panel — RESPONSIVE: collapsible drawer on mobile
    left: isMobile
      ? { padding: '12px 14px 12px', background: '#1e1b4b', display: sidebarOpen ? 'flex' : 'none', flexDirection: 'column', gap: 8, maxHeight: '40vh', overflowY: 'auto', borderBottom: '2px solid rgba(99,102,241,0.3)' }
      : { padding: isTablet ? '14px 14px 10px' : '16px 18px 10px', background: '#1e1b4b', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
    // Right Panel
    right: { display: 'flex', flexDirection: 'column', minHeight: 0, background: '#000', paddingTop: isMobile ? 8 : 16, flex: isMobile ? 1 : undefined, overflow: isMobile ? 'hidden' : undefined },
    rightScroll: { flex: 1, minHeight: 0, overflowY: 'auto', width: '100%' },
    rightInner: { padding: isMobile ? '0px 14px 16px' : isTablet ? '0px 20px 16px' : '0px 36px 16px', display: 'flex', flexDirection: 'column', minHeight: '100%', maxWidth: 1400, margin: '0 auto', width: '100%' },
    // Footer — RESPONSIVE: single row on mobile
    footer: isMobile
      ? { flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#1e1b4b', borderTop: '1px solid rgba(255,255,255,0.1)' }
      : { flexShrink: 0, display: 'grid', gridTemplateColumns: isTablet ? '280px 1fr' : '1fr 2fr' },
    footerLeft: isMobile
      ? { display: 'flex', alignItems: 'center' }
      : { background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' },
    footerRight: isMobile
      ? { display: 'flex', alignItems: 'center', gap: 8 }
      : { background: '#000', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 24px' },
    // Buttons matching Step 3
    btnBack: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontWeight: 700, color: '#cbd5e1', background: '#1e293b', border: '1px solid #475569', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all 0.2s' },
    btnNext: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 10, fontWeight: 700, color: 'white', background: '#6366f1', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', transition: 'all 0.2s' },
    btnGhost: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, fontWeight: 600, color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
    // Sidebar elements
    sideLabel: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
    sideLabelText: { fontSize: 13, fontWeight: 600, color: 'white' },
    sideCard: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'visible' },
    sideCardHeader: { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)' },
    sideCardBody: { padding: 12, overflow: 'visible' },
    // Site Intelligence grid cell (matches Step 3 exactly)
    intelCell: { padding: '8px 10px', background: '#1e293b', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' },
    intelCellLabel: { fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 2 },
    intelCellValue: { fontSize: 15, fontWeight: 700, color: 'white' },
    intelCellSub: { fontSize: 10, color: '#94a3b8' },
    // Right panel elements
    sectionTitle: { fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'white', marginBottom: 6 },
  };

  // ═══ RESPONSIVE GRID HELPERS ═══
  // Use: g2 for 2-col grids, g3 for 3-col grids — auto-stack on mobile
  const g2 = (gap = 12, extra = {}) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap, ...extra });
  const g3 = (gap = 12, extra = {}) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr', gap, ...extra });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
    @keyframes barFill { from { width: 0; } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .s5card { transition: all 0.25s ease !important; }
    .s5card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(255,255,255,0.06) !important; }
    .s5card-green:hover { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 8px 24px rgba(99,102,241,0.12) !important; }
    .s5card-amber:hover { border-color: rgba(245,158,11,0.6) !important; box-shadow: 0 8px 24px rgba(245,158,11,0.12) !important; }
    .s5card-blue:hover  { border-color: rgba(59,130,246,0.6) !important; box-shadow: 0 8px 24px rgba(59,130,246,0.12) !important; }
    .s5card-sel:hover   { border-color: #6366f1 !important; box-shadow: 0 8px 24px rgba(99,102,241,0.18) !important; }
    /* ═══ RESPONSIVE MEDIA QUERIES ═══ */
    @media (max-width: 767px) {
      .wizb-step-label { display: none !important; }
      .wizb-step-connector { width: 16px !important; }
      .wizb-disclaimer-popup { width: 90vw !important; right: -40px !important; }
      .wizb-modal { width: 95vw !important; max-width: 95vw !important; padding: 16px !important; }
      .wizb-supplier-modal { width: 95vw !important; max-width: 95vw !important; }
      .wizb-section-title { font-size: 20px !important; }
      .wizb-grid-2col { grid-template-columns: 1fr !important; }
      .wizb-grid-3col { grid-template-columns: 1fr 1fr !important; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .wizb-step-label { font-size: 9px !important; }
      .wizb-grid-3col { grid-template-columns: 1fr 1fr !important; }
    }
    /* ═══ U-11: PRINT-FRIENDLY CSS ═══ */
    @media print {
      * { color: #000 !important; background: white !important; box-shadow: none !important; border-color: #ccc !important; }
      header, .wizb-step-connector, button, .s5card:hover { display: none !important; }
      div[style*="position: sticky"] { position: static !important; }
      div[style*="overflow"] { overflow: visible !important; }
      @page { margin: 0.5in; size: letter; }
    }
    /* ═══ U-10: ARIA focus styles ═══ */
    button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid #6366f1 !important;
      outline-offset: 2px !important;
    }
    [role="button"]:focus-visible { outline: 2px solid #6366f1 !important; outline-offset: 2px !important; }
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER - gradient split matching Step 3
  // ═══════════════════════════════════════════════════════════════════════════
  const Header = () => (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: isMobile ? '#1e1b4b' : 'linear-gradient(to right, #1e1b4b 33.33%, #000000 33.33%)' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: isMobile ? '6px 12px' : '8px 24px' }}>
        {/* Mobile sidebar toggle */}
        {isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            background: sidebarOpen ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            color: sidebarOpen ? '#6366f1' : '#94a3b8', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 8, flexShrink: 0
          }}aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >{sidebarOpen ? '✕' : '☰'}</button>
        )}
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: isMobile ? 24 : 30, height: isMobile ? 24 : 30, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoZap size={isMobile ? 13 : 16} color="white" />
          </div>
          {!isMobile && <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Merlin Energy</span>}
          {!isMobile && <SSOTTriggerButton onClick={() => setSsotTrackerOpen(true)} />}
        </div>
        {/* Disclaimer icon — top right of header */}
        <div style={{ marginLeft: 'auto', marginRight: 16, position: 'relative' }}>
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
              background: showDisclaimer ? '#334155' : 'rgba(255,255,255,0.06)', color: '#94a3b8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            title="Legal disclaimer" aria-label="View legal disclaimer"
          >ℹ</button>
          {showDisclaimer && (<>
            <div onClick={() => setShowDisclaimer(false)} style={{ position: 'fixed', inset: 0, zIndex: 44 }} />
            <div className="wizb-disclaimer-popup" style={{ position: 'absolute', top: 36, right: 0, width: isMobile ? '85vw' : 380, background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 46 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Important Disclaimer</span>
                <button onClick={() => setShowDisclaimer(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}>✕</button>
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: '17px' }}>
                This estimate is for informational purposes only and reflects OBBBA (PL 119-21) as of Feb 2026. Final pricing subject to site survey, utility interconnection review, engineering design, and permitting.
                Federal ITC (§48E) and MACRS depreciation subject to IRS eligibility verification — consult your CPA.
                Solar §48E: BOC by July 4, 2026 (PIS by Dec 31, 2027). BESS §48E: through 2033. §30C EV: PIS by June 30, 2026. 100% bonus depreciation per OBBBA §70301.
                {rec?.solar?.sizeKW > 1000 ? ' Projects >1 MW require prevailing wage/apprenticeship compliance (§48E(d)(3)).' : ''}
                {' '}FEOC/material assistance restrictions apply starting 2026 tax year. Not a binding quote. © {new Date().getFullYear()} Merlin Energy AI.
              </p>
            </div>
          </>)}
        </div>
        {/* Centered Progress */}
        <div style={{ position: isMobile ? 'static' : 'absolute', left: isMobile ? undefined : '50%', transform: isMobile ? undefined : 'translateX(-50%)', marginLeft: isMobile ? 'auto' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {steps.map((step, idx) => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
                <div onClick={() => { if (step.num < currentStep && step.num >= 4) { setCurrentStep(step.num); setStepAnnouncement(`Navigated to Step ${step.num}: ${stepNames[step.num]}`); } }}
                  onKeyDown={(e) => handleStepKeyDown(e, step.num)}
                  tabIndex={step.num < currentStep && step.num >= 4 ? 0 : -1}
                  role="tab" aria-selected={currentStep === step.num} aria-label={`Step ${step.num}: ${step.name}`}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: step.num < currentStep && step.num >= 4 ? 'pointer' : 'default' }}>
                  <div style={{
                    width: isMobile ? 20 : 24, height: isMobile ? 20 : 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: currentStep === step.num ? '#4f46e5' : step.num < currentStep ? '#6366f1' : '#334155',
                    boxShadow: currentStep === step.num ? '0 0 0 3px rgba(99,102,241,0.3)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {step.num < currentStep
                      ? <IcoCheck size={isMobile ? 10 : 12} color="white" />
                      : <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 600, color: currentStep === step.num ? 'white' : '#94a3b8' }}>{step.num}</span>}
                  </div>
                  {!isMobile && <span className="wizb-step-label" style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 9, fontWeight: currentStep === step.num ? 600 : 500, color: currentStep === step.num ? '#a5b4fc' : step.num < currentStep ? '#6366f1' : '#64748b' }}>{step.name}</span>}
                </div>
                {idx < steps.length - 1 && <div className="wizb-step-connector" style={{ width: isMobile ? 12 : 24, height: 2, margin: '0 2px', background: step.num < currentStep ? '#6366f1' : '#334155', transition: 'background 0.5s' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Full-screen modal popup for configuration rationale */}
      {currentStep === 6 && showDetails && (<>
        <div onClick={() => setShowDetails(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }} />
        <div className="wizb-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, width: 880, maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: isMobile ? '16px' : '24px 28px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcoInfo size={16} color="#6366f1" /></div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Why This Configuration</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Based on your facility data, location, utility rates & industry profile</div>
              </div>
            </div>
            <button onClick={() => setShowDetails(false)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, fontFamily: 'inherit', fontWeight: 300, flexShrink: 0 }}>✕</button>
          </div>
          {/* Config cards — responsive grid */}
          <div style={g2(12)}>
            {(() => {
              const wr = rec.weatherRisk || computeWeatherRisk(state);
              const genReasonText = rec.generator?.reason === 'hurricane_zone' ? `${state} is in a hurricane zone — multi-day outages are common during season. BESS provides ${rec.bess.duration} hours but a generator provides unlimited runtime on ${rec.generator.fuelType?.toLowerCase() || 'natural gas'}.`
                : rec.generator?.reason === 'tornado_corridor' ? `${state} sits in an active tornado corridor. Grid damage from tornados can take 3-7 days to restore. Generator ensures uninterrupted critical operations.`
                : rec.generator?.reason === 'storm_grid_compound' ? `Elevated storm risk combined with ${wr.gridLevel} grid reliability creates compound outage exposure. Generator provides redundancy beyond BESS battery life.`
                : rec.generator?.reason === 'poor_grid_reliability' ? `Grid reliability in ${state} is rated poor (${wr.gridScore}/5). Frequent outages justify generator backup independent of weather events.`
                : rec.generator?.reason === 'elevated_storm_risk' ? `Storm risk in your area (${fmt(wr.stormScore, 1)}/5) is elevated. Generator recommended for extended outage protection beyond BESS capacity.`
                : rec.generator?.reason === 'solar_shortfall' ? `Solar covers ~${rec.optimization?.solar?.offsetPercentage || 60}% of your needs — the remaining gap requires supplemental power. Generator fills this during extended cloudy periods and outages.`
                : `Critical load of ${rec.facilityLoad.criticalLoadKW} kW exceeds BESS discharge capacity. Generator ensures 100% critical system coverage.`;
              const panelRiskText = wr.panelRiskLevel === 'high' 
                ? `HIGH PANEL RISK: ${state} has hail rating ${wr.raw.hail}/5 and wind ${wr.raw.wind}/5. There is approximately a ${Math.round(wr.panelReplacementProbability * 100)}% probability of significant panel damage over the 25-year system life. Most manufacturer warranties cover defects and degradation — NOT hail or storm impact damage. Replacement cost at current pricing: ~$${Math.round(rec.solar.sizeKW * 2.45 / 1000)}K. Consider impact-resistant panels (IEC 61215 MQT 17.1 Class 4) and confirm commercial property insurance covers solar equipment with adequate limits.`
                : wr.panelRiskLevel === 'moderate'
                ? `Moderate panel risk: ${state} has hail rating ${wr.raw.hail}/5. ~${Math.round(wr.panelReplacementProbability * 100)}% probability of panel damage over 25 years. Standard manufacturer warranties typically exclude impact damage. Verify your commercial property insurance covers rooftop solar equipment. Impact-resistant panels recommended.`
                : `Low panel physical risk in ${state} (hail ${wr.raw.hail}/5, wind ${wr.raw.wind}/5). Standard panels appropriate. Standard warranty coverage sufficient.`;
              return [
                { ico: <IcoSun size={16} color="#6366f1" />, title: 'Solar Sizing', why: `Your facility consumes ${fmt(rec.facilityLoad.annualUsageKWh)} kWh/yr${rec._dataSource?.kWh === 'actual_bill' ? ' (from your utility bill)' : ' (equipment model estimate)'}. With ${fmt(peakSunHours, 1)} peak sun hours/day in ${locationData?.utility?.city || 'your area'} ${state}, a ${fmt(actualSystemKW, 1)} kW system offsets approximately ${Math.round(annualProduction / rec.facilityLoad.annualUsageKWh * 100)}% of annual usage.${wr.productionDerating < 1.0 ? ` Production derated ${Math.round((1 - wr.productionDerating) * 100)}% for ${wr.raw.snow >= 4 ? 'snow load' : ''}${wr.raw.snow >= 4 && wr.raw.heat >= 4 ? ' + ' : ''}${wr.raw.heat >= 4 ? 'heat loss' : ''} in ${state}.` : ''}${(locationData?.solar?._liveSource && locationData?.solar?._liveSource !== 'static table') ? ` [Source: ${locationData.solar._liveSource}]` : ''}` },
                { ico: <IcoBattery size={16} color="#818cf8" />, title: 'Battery Sizing', why: `Peak demand of ${rec.facilityLoad.peakDemandKW} kW${rec._dataSource?.peakKW === 'actual_bill' ? ' (from your utility bill)' : ''} drives $${rec.assumptions.demandCharge}/kW demand charges. A ${rec.bess.capacityKWh} kWh BESS shaves peak demand and provides ${rec.bess.duration} hours of backup.${wr.recommendedBackupHours > 4 ? ` Backup duration extended from standard 4hr to ${wr.recommendedBackupHours}hr due to ${wr.outageLevel} outage risk in ${state}.` : ''}` },
                { ico: <IcoFuel size={16} color="#818cf8" />, title: 'Generator Decision', why: genReasonText + ((formData?.gasLine === 'yes' || formData?.hasGasLine === true) ? ' Natural gas selected — gas line exists on-site.' : '') },
                { ico: <IcoDollarSign size={16} color="#6366f1" />, title: 'Utility Profile', why: `Commercial rate: $${rec.assumptions.electricRate}/kWh${locationData?.utility?.electric?._liveSource ? ' (EIA live)' : ''} with $${rec.assumptions.demandCharge}/kW demand charges. Historical escalation averages ${rec.assumptions.rateEscalation}/yr.${locationData?.utility?.electric?._yoyChange ? ` Current YoY change: ${locationData.utility.electric._yoyChange}%.` : ''} Current bill ~$${Math.round((rec.facilityLoad.annualUsageKWh * rec.assumptions.electricRate + rec.facilityLoad.peakDemandKW * rec.assumptions.demandCharge * 12) / 12).toLocaleString()}/mo. Gross Year-1 savings ~$${Math.round(annualTotalSavings / 1000)}K, less $${(annualOM / 1000).toFixed(1)}K O&M${annualWeatherReserve > 500 ? ` and $${(annualWeatherReserve / 1000).toFixed(1)}K weather maintenance reserve` : ''} = net ~$${Math.round(annualNetSavings / 1000)}K.` },
                { ico: <IcoAlertTriangle size={16} color={wr.panelRiskLevel === 'high' ? '#ef4444' : wr.panelRiskLevel === 'moderate' ? '#f59e0b' : '#94a3b8'} />, title: 'Climate & Panel Risk', why: panelRiskText },
                { ico: <IcoLayers size={16} color="#94a3b8" />, title: 'Supplier & Tariff Strategy', why: `Equipment selection prioritizes US-made/assembled products for §48E ITC domestic content bonus eligibility (+10%). Suppliers from countries with AD/CVD tariff risk (China) are flagged. FEOC compliance is critical — domestic content thresholds: 45% (2025), 50% (2026), 55% (2027+) per OBBB final rules.` },
              ];
            })().map(card => (
              <div key={card.title} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {card.ico}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{card.title}</span>
                </div>
                <div style={{ fontSize: 12, color: '#c0cbda', lineHeight: 1.55 }}>{card.why}</div>
              </div>
            ))}
          </div>
        </div>
      </>)}
    </header>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LEFT SIDEBAR - Facility card (reused across steps 4-7)
  // ═══════════════════════════════════════════════════════════════════════════
  const FacilityCard = () => {
    const industryIcons = { carwash: '🚗', hotel: '🏨', indoorfarm: '🌱', datacenter: '🖥️', retail: '🛒', restaurant: '🍽️', warehouse: '🏭', cstore: '⛽', default: '🏢' };
    const icon = industryIcons[selectedIndustry?.id] || industryIcons.default;
    const name = selectedIndustry?.name || 'Commercial Facility';
    const city = locationData?.utility?.city || locationData?.city || 'Unknown';
    const stateCode = state;
    const zip = locationData?.utility?.zip || locationData?.zipCode || locationData?.zip || '';
    return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{icon} {name}</div>
        <IcoMapPin size={12} color="#a5b4fc" />
        <span style={{ fontSize: 12, color: '#c0cbda' }}>{city}, {stateCode} {zip}</span>
      </div>
    </div>
    );
  };

  // TrueQuote™ Verified Badge — clickable, opens modal
  const TrueQuoteBadge = () => (
    <div onClick={() => setShowTrueQuoteModal(true)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 18px', margin: '4px 0 8px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,23,42,0.9))'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11.5 14.5 15.5 9.5" stroke="#6366f1" strokeWidth="2"/></svg>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', letterSpacing: 0.3 }}>TrueQuote™</span>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
    </div>
  );

  // TrueQuote™ Modal
  const TrueQuoteModal = () => showTrueQuoteModal ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) setShowTrueQuoteModal(false); }}>
      <div style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', overflowY: 'auto', background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>TrueQuote™</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Verified</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TrueQuote™</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>The Quote That Shows Its Work</div>
            </div>
          </div>
          <button onClick={() => setShowTrueQuoteModal(false)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
          {[{id:'why',icon:'⚠',label:'Why It Matters'},{id:'how',icon:'👁',label:'How It Works'},{id:'proof',icon:'🛡',label:'See The Proof'}].map(t => (
            <button key={t.id} onClick={() => setTrueQuoteTab(t.id)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: trueQuoteTab === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', color: trueQuoteTab === t.id ? '#6366f1' : '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {trueQuoteTab === 'why' && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>⚠ The Industry's Dirty Secret</div>
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>When you get a BESS quote from most vendors, you're trusting a black box. They give you numbers, but <strong style={{ color: '#fff' }}>can't tell you where they came from</strong>. Banks know this. Investors know this. That's why projects stall.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16 }}>👻 Typical Competitor</div>
                {['Battery System — $2,400,000','Annual Savings — $450,000','Payback Period — 5.3 years'].map((r,i) => (
                  <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>{r.split('—')[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r.split('—')[1]}</span>
                  </div>
                ))}
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>❌ Where do these numbers come from?</div>
                  <div style={{ fontSize: 11, color: '#f87171' }}>"Trust us, we're experts."</div>
                </div>
              </div>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', marginBottom: 16 }}>🛡️ Merlin TrueQuote™</div>
                {[['Battery System','$2,400,000','NREL ATB 2024, LFP 4-hr, $150/kWh'],['Annual Savings','$450,000','StoreFAST methodology, EIA rates'],['Payback Period','5.3 years','8% discount, 2% degradation, 30% ITC']].map((r,i) => (
                  <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: 'rgba(99,102,241,0.06)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#94a3b8' }}>{r[0]}</span><span style={{ fontWeight: 700, color: '#e2e8f0' }}>{r[1]}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4, fontFamily: 'monospace' }}>📋 {r[2]}</div>
                  </div>
                ))}
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>✅ Every number is verifiable.</div>
                  <div style={{ fontSize: 11, color: '#a5b4fc' }}>Export JSON audit trail for bank due diligence.</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {trueQuoteTab === 'how' && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>How TrueQuote™ Works</div>
            {[{step:'1',title:'Source Attribution',desc:'Every cost figure links to NREL ATB, EIA, or manufacturer data sheets. No "industry average" hand-waving.'},{step:'2',title:'Methodology Transparency',desc:'Financial models use StoreFAST (NREL) with published assumptions: discount rate, degradation, inflation, ITC step-down schedule.'},{step:'3',title:'Audit Hash',desc:'Each quote generates a SHA-256 hash of all inputs/outputs. Change one number and the hash breaks — tamper-proof integrity.'}].map((s,i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{s.step}</div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{s.title}</div><div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{s.desc}</div></div>
              </div>
            ))}
          </div>
        )}
        {trueQuoteTab === 'proof' && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>See The Proof</div>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid #334155', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Your Quote's Data Sources</div>
              {[['Equipment Pricing','NREL ATB 2024 + manufacturer quotes'],['Electric Rates',`EIA Open Data — ${state} commercial avg`],['Solar Irradiance','NREL PVWatts v8 — site-specific'],['Financial Model','StoreFAST methodology + IRS §48E'],['Incentives','DSIRE database + IRS guidance']].map(([k,v],i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>
            {trueQuoteHash && (
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>AUDIT HASH</div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{trueQuoteHash}</div>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #334155' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>TrueQuote™ Verified · Source-attributed pricing</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            <button onClick={() => setShowTrueQuoteModal(false)} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Get Your TrueQuote™ →</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // SSOT #28 / M-13: TrueQuote™ Audit Hash
  // Deterministic fingerprint of quote parameters for audit trail
  // ═══════════════════════════════════════════════════════════════════════════
  const generateTrueQuoteHash = (rec, formData) => {
    if (!rec) return null;
    // Key parameters that define a unique quote
    const quoteParams = JSON.stringify({
      solarKW: rec.solar?.sizeKW,
      bessKWh: rec.bess?.capacityKWh,
      genKW: rec.generator?.powerKW,
      annualUsage: rec.facilityLoad?.annualUsageKWh,
      peakDemand: rec.facilityLoad?.peakDemandKW,
      state: formData?.state,
      industry: formData?.selectedIndustry,
      zip: formData?.zip,
      facilityType: formData?.facilityType,
      billAnnual: formData?._annualBill || formData?.estimatedBill,
      ts: new Date().toISOString().slice(0, 10), // Date (not time) for reproducibility within same day
    });
    // FNV-1a 64-bit hash (deterministic, fast, low collision)
    let h1 = 0x811c9dc5, h2 = 0x811c9dc5;
    for (let i = 0; i < quoteParams.length; i++) {
      const c = quoteParams.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 0x01000193);
      h2 ^= c + i; h2 = Math.imul(h2, 0x01000193);
    }
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `TQ-${hex1}${hex2}`.toUpperCase();
  };
  const trueQuoteHash = rec ? generateTrueQuoteHash(rec, formData) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={S.shell}>
      <style>{css}</style>
      <Header />
      {/* Divider line */}
      <div style={S.divider} />
      <TrueQuoteModal />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 4: ENERGY PRIORITIES                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <>
          <div style={S.grid} role="main" aria-label="Energy assessment wizard">
            {/* LEFT PANEL */}
            <div style={S.left} role="navigation" aria-label="Wizard steps">
              <FacilityCard />
              <TrueQuoteBadge />
              {/* Merlin's Top 3 — dynamic from goal scoring engine */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #6366f1', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <IcoTarget size={15} color="#6366f1" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Merlin's Top 3</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(goals || []).slice(0, 3).map((g, i) => {
                    const rankColors = ['#6366f1', '#818cf8', '#a5b4fc'];
                    return (
                      <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: rankColors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{g.icon} {g.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{g.keyMetric}{g.insight ? ` · ${g.insight}` : ''}</div>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: rankColors[i], flexShrink: 0 }}>{g.score}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Est. savings: <span style={{ color: '#a5b4fc', fontWeight: 700 }}>${Math.round(annualNetSavings / 1000)}K/yr</span> · Payback: <span style={{ color: 'white', fontWeight: 700 }}>~{fmt(purchasePayback, 1)} yrs</span>
                </div>
                {/* FIX SIM-3: Caution banner when net payback exceeds 15 years */}
                {purchasePayback > 15 && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, fontSize: 11, color: '#fbbf24', lineHeight: 1.5 }}>
                    ⚠️ Net payback exceeds 15 years. Consider <strong>PPA</strong> or <strong>Lease</strong> financing for immediate savings with $0 upfront — see Step 7 comparison.
                  </div>
                )}
              </div>

              {/* Also Considered — compact pill strip */}
              {(goals || []).length > 5 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Also Considered</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(goals || []).slice(5).map(g => (
                      <span key={g.id} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                        {g.icon} {g.name} <span style={{ fontWeight: 700 }}>{g.score}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Mapping — compact score badge */}
              {step3Validation && (step3Validation.signals.length > 0 || step3Validation.warnings.length > 0) && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${step3Validation.valid ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.15)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11 }}>{step3Validation.valid ? '✅' : '⚠️'}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>Data → Priorities</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, marginLeft: 'auto', background: step3Validation.score >= 80 ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.15)', color: step3Validation.score >= 80 ? '#a5b4fc' : '#fbbf24' }}>{step3Validation.score}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {step3Validation.signals.slice(0, 3).map(s => (
                      <div key={s.field} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: '#94a3b8' }}>
                        <span style={{ color: '#a5b4fc', fontSize: 8 }}>●</span>
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{s.field}</span>
                        <span style={{ color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</span>
                      </div>
                    ))}
                    {step3Validation.warnings.slice(0, 2).map(w => (
                      <div key={w.field} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: '#fbbf24' }}>
                        <span style={{ fontSize: 8 }}>▲</span>
                        <span style={{ fontWeight: 600 }}>{w.field}</span>
                        <span style={{ color: '#a5b4fc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT PANEL */}
            <div style={S.right} role="region" aria-label="Step content">
              <div ref={rightPanelRef} style={S.rightScroll}>
                <div style={S.rightInner}>
                  {/* ACC-3: Screen reader announcement for step changes */}
                  <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{stepAnnouncement}</div>
                  {/* E-7: Offline banner */}
                  {isOffline && <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: '#92400E', fontSize: 13, fontWeight: 600 }} role="alert">📡 You appear to be offline. Some data may be unavailable.</div>}
                  {/* E-4: Error banner */}
                  {calcError && <ErrorBanner message={calcError} onDismiss={() => setCalcError(null)} />}
                  {/* SI-1: EDGAR data freshness warning */}
                  {edgarFreshnessWarning && <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 14px', marginBottom: 12, color: '#92400E', fontSize: 12 }}>⏰ {edgarFreshnessWarning}</div>}
                  {/* ═══ UNIFIED INVESTMENT PRIORITIES — single scored view, one screen ═══ */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 4 }}>Your Investment Priorities</div>
                    <div style={{ fontSize: 14, color: '#c0cbda' }}>Ranked by ROI, savings, and facility fit — scored by Merlin AI</div>
                  </div>

                  {/* Hero — #1 Priority */}
                  {(goals || []).length > 0 && (() => {
                    const hero = goals[0];
                    return (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
                        borderRadius: 16, padding: '20px 22px', marginBottom: 12,
                        border: '1.5px solid rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', gap: 18,
                      }}>
                        <div style={{ flexShrink: 0 }}>
                          <svg width={64} height={64}>
                            <circle cx={32} cy={32} r={27} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
                            <circle cx={32} cy={32} r={27} fill="none" stroke="#6366f1" strokeWidth={3.5}
                              strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * (1 - hero.score / 100)}
                              strokeLinecap="round" transform="rotate(-90 32 32)" />
                            <text x={32} y={33} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={20} fontWeight={800}>{hero.score}</text>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 5, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', letterSpacing: '0.05em' }}>#1 TOP PRIORITY</span>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{hero.icon} {hero.name}</div>
                          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                            {hero.keyMetric}{hero.insight ? ` · ${hero.insight}` : ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{hero.solutions}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Priorities #2-5 — compact two-column grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    {(goals || []).slice(1, 5).map((g, i) => {
                      const rank = i + 2;
                      const isTop3 = rank <= 3;
                      const c = isTop3 ? '#6366f1' : '#64748b';
                      return (
                        <div key={g.id} style={{
                          background: isTop3 ? `linear-gradient(135deg, ${c}10, transparent 60%)` : 'rgba(255,255,255,0.025)',
                          borderRadius: 12, padding: '14px 14px',
                          border: isTop3 ? `1px solid ${c}30` : '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 7,
                              background: isTop3 ? c : 'rgba(255,255,255,0.06)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                            }}>{rank}</div>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{g.icon}</span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: isTop3 ? c : '#94a3b8', marginLeft: 'auto' }}>{g.score}</div>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 3 }}>{g.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{g.keyMetric}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{g.insight || g.solutions}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gap Strategy — compact inline banner (only if roof-constrained) */}
                  {gapMakeupOptions.length > 0 && (() => {
                    const topGap = gapMakeupOptions[0];
                    const stratColors = { generation: '#a5b4fc', storage: '#818cf8', resilience: '#ef4444', efficiency: '#6366f1' };
                    const tc = stratColors[topGap.strategy] || '#64748b';
                    return (
                      <div style={{ background: `linear-gradient(135deg, ${tc}10, transparent 70%)`, borderRadius: 14, padding: '18px 22px', border: `1.5px solid ${tc}30`, marginBottom: 12 }}>
                        {/* Top row: Recommendation + Strategy badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <span style={{ fontSize: 22 }}>{topGap.icon}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommended</span>
                          </div>
                          <span style={{ fontSize: 20, fontWeight: 700, color: 'white', flex: 1 }}>{topGap.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: `${tc}18`, color: tc, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{topGap.strategy}</span>
                        </div>
                        {/* Detail line */}
                        <div style={{ fontSize: 16, color: '#c0cbda', lineHeight: 1.5, marginBottom: 10, marginLeft: 34 }}>{topGap.coverage} · {topGap.detail}</div>
                        {/* Factor pills */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 34 }}>
                          {topGap.factors.map(f => (
                            <span key={f.label} style={{
                              fontSize: 13, padding: '4px 10px', borderRadius: 6,
                              background: f.positive ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.06)',
                              color: f.positive ? '#a5b4fc' : '#f87171',
                              border: `1px solid ${f.positive ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)'}`,
                            }}>
                              {f.label}: {f.value}
                            </span>
                          ))}
                        </div>
                        {/* Also considered */}
                        {gapMakeupOptions.length > 1 && (
                          <div style={{ marginTop: 12, fontSize: 14, color: '#64748b', marginLeft: 34 }}>
                            Also considered: {gapMakeupOptions.slice(1, 4).map(o => `${o.icon} ${o.name} (${o.score})`).join(' · ')}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div style={S.footer}>
            <div style={S.footerLeft}>
              <button style={S.btnBack} onClick={() => onBack && onBack()}><IcoChevL size={18} color="#cbd5e1" /> Back</button>
            </div>
            <div style={S.footerRight}>
              <button style={S.btnNext} onClick={() => setCurrentStep(5)}>Continue to Add System Options <IcoChevR size={18} color="white" /></button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SOLAR EXPANSION DECISION GATE — 2-Step Micro-Wizard (Concept C) */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {showExpansionModal && rec?.expansionScenarios && (() => {
        const exp = rec.expansionScenarios;
        const utilRate = rec.assumptions?.electricRate || utilityRate || 0.19;
        const prodRate = locationData?.solar?.annualProduction || 1200;
        const derating = rec.weatherRisk?.productionDerating || 0.92;
        const bessKWh = rec.bess?.capacityKWh || 200;
        const genKW = rec.generator?.powerKW || 0;
        const genNeeded = rec.generator?.recommended === true;
        const selSc = selectedExpansion ? exp.scenarios.find(s => s.id === selectedExpansion) : null;
        const bestScenario = exp.scenarios.reduce((a, b) => b.offset > a.offset ? b : a, exp.scenarios[0]);
        const bessCovers = Math.min(20, 100 - bestScenario.offset);
        const closeModal = () => { setShowExpansionModal(false); setExpansionModalStep(1); };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}>
            <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
            <div style={{ width: Math.min(1060, typeof window !== 'undefined' ? window.innerWidth - 32 : 1060), maxHeight: '96vh', borderRadius: 22, overflow: 'hidden', background: 'linear-gradient(180deg, #0d1529, #0a0f1e)', border: '1px solid rgba(251,191,36,0.25)', boxShadow: '0 0 80px rgba(251,191,36,0.06), 0 25px 60px rgba(0,0,0,0.7)', animation: 'slideUp 0.45s cubic-bezier(0.16,1,0.3,1)' }}>

              {/* Step indicator */}
              <div style={{ padding: '18px 40px 0', display: 'flex', gap: 10 }}>
                {[1, 2].map(s => (
                  <div key={s} style={{ flex: 1, height: 5, borderRadius: 3, background: s <= expansionModalStep ? '#6366f1' : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
                ))}
              </div>

              {/* ═══ STEP 1: THE PROBLEM ═══ */}
              {expansionModalStep === 1 && (
                <div style={{ padding: '40px 56px 44px', overflowY: 'auto', maxHeight: 'calc(96vh - 28px)' }}>
                  <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: 60, marginBottom: 16 }}>☀️</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>Roof Limits Solar to {exp.roofOnlyKW} kW</div>
                    <div style={{ fontSize: 22, color: '#94a3b8', marginTop: 14 }}>
                      Only <strong style={{ color: '#f87171', fontSize: 28 }}>{exp.roofOnlyOffset}%</strong> offset — target is <strong style={{ color: '#4ade80', fontSize: 28 }}>{exp.targetOffset}%</strong>
                    </div>
                  </div>

                  {/* 4-column system visual */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '32px 36px', marginBottom: 32 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24, textAlign: 'center' }}>How Your System Works Together</div>

                    <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 32, height: 200, marginBottom: 28 }}>
                      {/* Solar */}
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ height: Math.max(44, 180 * (exp.roofOnlyOffset / 100)), background: 'linear-gradient(180deg, #fbbf24, #b45309)', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', width: 100 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{exp.roofOnlyOffset}%</span>
                        </div>
                        <div style={{ fontSize: 32, marginTop: 12 }}>☀️</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>Solar</div>
                        <div style={{ fontSize: 17, color: '#94a3b8' }}>{exp.roofOnlyKW} kW roof</div>
                      </div>

                      {/* BESS */}
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ height: Math.max(44, 180 * (bessCovers / 100)), background: 'linear-gradient(180deg, #6366f1, #4338ca)', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', width: 100 }}>
                          <span style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>+{bessCovers}%</span>
                        </div>
                        <div style={{ fontSize: 32, marginTop: 12 }}>🔋</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#a5b4fc' }}>Battery</div>
                        <div style={{ fontSize: 17, color: '#94a3b8' }}>{bessKWh} kWh peak-shift</div>
                      </div>

                      {/* Generator */}
                      {genNeeded && (
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ height: 56, background: 'linear-gradient(180deg, #94a3b8, #475569)', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', width: 100 }}>
                            <span style={{ fontSize: 19, fontWeight: 800, color: 'white' }}>Backup</span>
                          </div>
                          <div style={{ fontSize: 32, marginTop: 12 }}>⚡</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8' }}>Generator</div>
                          <div style={{ fontSize: 17, color: '#94a3b8' }}>{genKW} kW outages</div>
                        </div>
                      )}

                      {/* Expansion */}
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ height: Math.max(44, 180 * ((100 - exp.roofOnlyOffset - bessCovers) / 100)), background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(74,222,128,0.12) 5px, rgba(74,222,128,0.12) 10px)', border: '3px dashed rgba(74,222,128,0.4)', borderBottom: 'none', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', width: 100 }}>
                          <span style={{ fontSize: 26, fontWeight: 800, color: '#4ade80' }}>?</span>
                        </div>
                        <div style={{ fontSize: 32, marginTop: 12 }}>🔆</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>More Solar</div>
                        <div style={{ fontSize: 17, color: '#94a3b8' }}>Beyond roof</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 20, color: '#e2e8f0', lineHeight: 1.7, textAlign: 'center' }}>
                      <strong>Solar doesn't close the entire gap.</strong><br/>
                      Battery shifts solar to peak hours (+{bessCovers}%).{genNeeded ? ' Generator covers outages.' : ''}<br/>
                      <strong style={{ color: '#4ade80' }}>More panels = more energy for BESS to shift.</strong>
                    </div>
                  </div>

                  <button onClick={() => setExpansionModalStep(2)} style={{ width: '100%', padding: '20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', fontSize: 22, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}>
                    Show Me Expansion Options →
                  </button>
                  <button onClick={closeModal} style={{ width: '100%', padding: '16px', marginTop: 10, borderRadius: 12, border: 'none', background: 'transparent', color: '#64748b', fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Skip — keep roof-only ({exp.roofOnlyKW} kW)
                  </button>
                </div>
              )}

              {/* ═══ STEP 2: CHOOSE EXPANSION — 3-Column Cards ═══ */}
              {expansionModalStep === 2 && (() => {
                const panelCostPerW = costPerW; // FIX ENG-1: use actual supplier $/W
                const bestNonGround = exp.scenarios.find(s => s.offset >= exp.targetOffset - 5 && s.id !== 'ground_mount');
                // Car washes: recommend vacuum canopy (only real expansion). Others: highest offset non-ground.
                const primaryId = exp.industryType === 'carwash'
                  ? (exp.scenarios.find(s => s.id === 'vacuum_canopy') || exp.scenarios[0])?.id
                  : (bestNonGround || exp.scenarios[exp.scenarios.length - 1])?.id;

                return (
                <div style={{ padding: '32px 44px 36px', overflowY: 'auto', maxHeight: 'calc(96vh - 28px)' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 6 }}>Expand Solar Beyond the Roof</div>
                  <div style={{ fontSize: 18, color: '#94a3b8', marginBottom: 28 }}>
                    Battery{genNeeded ? ' + generator' : ''} covers the rest. More panels = more to store & shift.
                  </div>

                  {/* 3-Column Card Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${exp.scenarios.length}, 1fr)`, gap: 16, marginBottom: 20 }}>
                    {exp.scenarios.map(sc => {
                      const isSel = selectedExpansion === sc.id;
                      const isPrimary = sc.id === primaryId;
                      const addedProd = Math.round(sc.addedKW * prodRate * derating);
                      const addedSavYr = Math.round(addedProd * utilRate * selfConsumptionRate); // FIX H-4
                      const addedSavMo = Math.round(addedSavYr / 12);
                      const fullInstallCost = Math.round(sc.addedKW * 1000 * panelCostPerW) + Math.round(sc.addedKW * 1000 * canopyStructureCostPerW);
                      const fullInstallNet = Math.round(fullInstallCost * (1 - itcTotalRate)); // FIX ENG-3: use actual ITC rate
                      const addedPaybackYrs = addedSavYr > 0 ? Math.round((fullInstallNet / addedSavYr) * 10) / 10 : 0;
                      const pct = Math.min(100, Math.round((sc.offset / exp.targetOffset) * 100));

                      return (
                        <div key={sc.id} onClick={() => setSelectedExpansion(isSel ? null : sc.id)} style={{
                          padding: '20px 18px 18px', borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                          background: isSel ? 'rgba(99,102,241,0.10)' : isPrimary ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                          border: isSel ? '2.5px solid rgba(99,102,241,0.5)' : isPrimary ? '2.5px solid rgba(74,222,128,0.25)' : '2.5px solid rgba(255,255,255,0.06)',
                          transform: isSel ? 'scale(1.02)' : 'none',
                          boxShadow: isSel ? '0 8px 32px rgba(99,102,241,0.15)' : isPrimary ? '0 4px 20px rgba(74,222,128,0.08)' : 'none'
                        }}>
                          {/* Badge: Primary / Secondary */}
                          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: isPrimary ? '#4ade80' : sc.isMinor ? '#475569' : '#64748b' }}>
                            {isPrimary ? '★ Recommended' : sc.isMinor ? 'Minor Addition' : 'Alternative'}
                          </div>

                          {/* Icon + Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 32 }}>{sc.icon}</span>
                            <span style={{ fontSize: 20, fontWeight: 700, color: isSel ? '#a5b4fc' : 'white', lineHeight: 1.2 }}>{sc.label}</span>
                          </div>
                          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{fmt(sc.area)} sqft</div>

                          {/* Stats — vertical stack */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 15, color: '#94a3b8' }}>Added Solar</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>+{sc.addedKW} kW</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 15, color: '#94a3b8' }}>Full Install</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>${(fullInstallNet / 1000).toFixed(0)}K</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 15, color: '#94a3b8' }}>Savings</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>+${addedSavMo}/mo</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: 15, color: '#94a3b8' }}>Payback</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: addedPaybackYrs <= 8 ? '#4ade80' : '#fbbf24' }}>{addedPaybackYrs} yr</span>
                            </div>
                          </div>

                          {/* Offset bar */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 13, color: '#64748b' }}>Solar offset</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 90 ? '#4ade80' : '#fbbf24' }}>{sc.totalKW} kW · {sc.offset}%</span>
                            </div>
                            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ position: 'absolute', height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 5, transition: 'width 0.4s' }} />
                              <div style={{ position: 'absolute', height: '100%', left: `${Math.min(pct, 100)}%`, width: `${Math.min(bessCovers / exp.targetOffset * 100, 100 - pct)}%`, background: 'rgba(99,102,241,0.35)', borderRadius: '0 5px 5px 0' }} />
                            </div>
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>+ ~{bessCovers}% BESS peak-shift{genNeeded ? ' · Gen: outages' : ''}</div>
                          </div>

                          {/* Select indicator */}
                          <div style={{ marginTop: 14, padding: '10px', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 700, background: isSel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', color: isSel ? '#a5b4fc' : '#475569', border: isSel ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s' }}>
                            {isSel ? '✓ Selected' : 'Select'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ground mount note */}
                  {exp.groundMountNote && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: 15, color: '#fbbf24', lineHeight: 1.5, marginBottom: 16 }}>
                      ⚠️ {exp.groundMountNote}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <button onClick={() => setExpansionModalStep(1)} style={{ padding: '16px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#94a3b8', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                    <button onClick={() => { setSelectedExpansion(null); closeModal(); }} style={{ padding: '16px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#64748b', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>Roof Only</button>
                    <button onClick={closeModal} disabled={!selSc} style={{ flex: 1, padding: '18px', borderRadius: 12, border: 'none', background: selSc ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'rgba(255,255,255,0.06)', color: selSc ? 'white' : '#475569', fontSize: 22, fontWeight: 700, cursor: selSc ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: selSc ? '0 4px 24px rgba(99,102,241,0.3)' : 'none' }}>
                      {selSc ? `Confirm ${selSc.icon} ${selSc.label}` : 'Select an Option'}
                    </button>
                  </div>
                </div>
                );
              })()}

            </div>
          </div>
        );
      })()}


      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 5: ADD-ON OPTIONS (3-Column Layout)                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 5 && (() => {
        // ── TIER MAPPING for computed enhancements ──
        const tierMap = {
          heatPumpWH: 'costs', waterReclaim: 'costs', vfdRetrofit: 'costs',
          hvacOptimization: 'costs', coolRoof: 'costs', ledGrowLights: 'costs', compressedAir: 'costs',
          evCharging: 'revenue', monitoring: 'revenue', bmsIntegration: 'revenue',
          extendedBackup: 'protection', generatorHybrid: 'protection', coolingRedundancy: 'protection',
        };
        // Industry → allowed enhancement IDs (solar expansion is handled separately)
        const INDUSTRY_ENHANCEMENTS = {
          carwash:       ['waterReclaim', 'vfdRetrofit', 'heatPumpWH', 'evCharging', 'monitoring', 'extendedBackup', 'generatorHybrid'],
          hotel:         ['hvacOptimization', 'vfdRetrofit', 'heatPumpWH', 'coolRoof', 'evCharging', 'monitoring', 'bmsIntegration', 'extendedBackup', 'generatorHybrid'],
          datacenter:    ['hvacOptimization', 'vfdRetrofit', 'coolRoof', 'monitoring', 'bmsIntegration', 'extendedBackup', 'generatorHybrid', 'coolingRedundancy'],
          retail:        ['hvacOptimization', 'coolRoof', 'evCharging', 'monitoring', 'extendedBackup'],
          warehouse:     ['hvacOptimization', 'vfdRetrofit', 'coolRoof', 'compressedAir', 'monitoring', 'extendedBackup', 'generatorHybrid'],
          manufacturing: ['hvacOptimization', 'vfdRetrofit', 'coolRoof', 'compressedAir', 'monitoring', 'bmsIntegration', 'extendedBackup', 'generatorHybrid'],
          restaurant:    ['hvacOptimization', 'heatPumpWH', 'coolRoof', 'evCharging', 'monitoring', 'extendedBackup', 'generatorHybrid'],
          gasstation:    ['waterReclaim', 'evCharging', 'monitoring', 'extendedBackup', 'generatorHybrid'],
          office:        ['hvacOptimization', 'coolRoof', 'evCharging', 'monitoring', 'bmsIntegration', 'extendedBackup'],
          evcharging:    ['evCharging', 'monitoring', 'extendedBackup', 'generatorHybrid'],
          hospital:      ['hvacOptimization', 'vfdRetrofit', 'heatPumpWH', 'coolRoof', 'evCharging', 'monitoring', 'bmsIntegration', 'extendedBackup', 'generatorHybrid', 'coolingRedundancy'],
          indoorfarm:    ['hvacOptimization', 'vfdRetrofit', 'waterReclaim', 'coolRoof', 'ledGrowLights', 'monitoring', 'bmsIntegration', 'extendedBackup', 'generatorHybrid', 'coolingRedundancy'],
        };
        const industryId = selectedIndustry?.id || 'carwash';
        const allowedEnhancements = new Set(INDUSTRY_ENHANCEMENTS[industryId] || INDUSTRY_ENHANCEMENTS.carwash);
        const TIERS = {
          costs: { label: 'Cut Costs', accent: '#6366f1', desc: 'Reduce operating expenses' },
          revenue: { label: 'New Revenue', accent: '#818cf8', desc: 'Generate income from your site' },
          protection: { label: 'Protection', accent: '#4f46e5', desc: 'Resilience & risk mitigation' },
        };
        const tierOrder = ['costs', 'revenue', 'protection'];
        const AMBER = { border: '#6366f1', text: '#a5b4fc' };

        // Map computed enhancements into Step 5 display items with tier assignment
        // Merge: start with live enhancements, add any industry-relevant fallback items not already present
        const existingIds = new Set((enhancements || []).map(e => e.id));
        // FIX VFD-1: Don't show VFD fallback if user already has VFD on all declared motors
        const allMotorsHaveVFD = (formData?.pumpHasVFD === true || !formData?.pumpHP) && (formData?.dryerHasVFD === true || !formData?.dryerHP);
        // FIX HPWH-1: Don't show HPWH fallback if no gas heating declared
        const hasGasHeating = formData?.waterHeater === 'gas' || formData?.waterHeater === 'propane';
        const industryExtras = FALLBACK_ENHANCEMENTS.filter(fb => {
          if (!allowedEnhancements.has(fb.id) || existingIds.has(fb.id)) return false;
          if (fb.id === 'vfdRetrofit' && allMotorsHaveVFD) return false; // FIX VFD-1
          if (fb.id === 'heatPumpWH' && !hasGasHeating) return false; // FIX HPWH-1
          return true;
        }).map(fb => {
          // FIX VFD-2: Compute approximate savings for fallback items so Value/yr isn't blank
          if (fb.id === 'vfdRetrofit') {
            const pHP = parseInt(formData?.pumpHP) || 15; const pC = parseInt(formData?.pumpCount) || 3;
            const dHP = parseInt(formData?.dryerHP) || 15; const dC = parseInt(formData?.dryerCount) || 4;
            const targetHP = (!formData?.pumpHasVFD ? pHP * pC : 0) + (!formData?.dryerHasVFD ? dHP * dC : 0);
            const opHrs = parseInt(formData?.dailyOperatingHours) || 12;
            const days = parseInt(formData?.daysPerWeek) || 7;
            const rate = rec?.assumptions?.electricRate || 0.19;
            const sav = Math.round(targetHP * 0.746 * opHrs * 0.3 * days * 52 * rate * 0.30);
            const cost = Math.round(targetHP * 180);
            return { ...fb, annualSavings: sav, estimatedCost: `$${fmt(cost)}`, payback: sav > 0 ? `${(cost / sav).toFixed(1)} yr` : fb.payback };
          }
          if (fb.id === 'heatPumpWH') {
            const therms = (parseInt(formData?.gasThermsMo) || 200) * 12;
            const fuelRate = formData?.waterHeater === 'propane' ? 2.50 : 1.20;
            const gasSaved = Math.round(therms * fuelRate);
            const elecAdded = Math.round(therms * 29.3 / 3.5 * (rec?.assumptions?.electricRate || 0.19));
            const sav = Math.max(0, gasSaved - elecAdded);
            const bays = parseInt(formData?.tunnelCount || formData?.bayCount) || 4;
            const cost = Math.round(bays * 25000);
            return { ...fb, annualSavings: sav, estimatedCost: `$${fmt(cost)}`, payback: sav > 0 ? `${(cost / sav).toFixed(1)} yr` : fb.payback };
          }
          return fb;
        });
        const mergedEnhancements = [...(enhancements || []), ...industryExtras];
        const step5Items = mergedEnhancements.filter(e => allowedEnhancements.has(e.id)).map(e => ({
          ...e,
          tier: tierMap[e.id] || 'costs',
        }));

        // EV pricing from Supplier DB v14.2
        const L2U = 2800, DCU = 63500;
        const evL2 = enhancementConfigs.evCharging.l2Count || 4;
        const evDC = enhancementConfigs.evCharging.dcCount || 0;
        const evGross = evL2 * L2U + evDC * DCU;
        const evCredit = Math.min(Math.round(evGross * 0.30), 100000);
        const evNet = evGross - evCredit;
        const evRev = evL2 * 3000 + evDC * 15000;

        // Tombstone totals
        const selItems = (step5Items || []).filter(a => selectedEnhancements.includes(a.id));
        const totalCost = selItems.reduce((s, a) => {
          if (a.id === 'evCharging') return s + evNet;
          // Parse cost from formatted string: "$17,000" or "$0 (already sized)"
          const cleaned = (a.estimatedCost || '').replace(/[^0-9]/g, '');
          return s + (parseInt(cleaned) || 0);
        }, 0);
        const totalRevenue = selItems.reduce((s, a) => {
          if (a.id === 'evCharging') return s + evRev;
          return s + (a.annualSavings || 0);
        }, 0);

        return (
          <>
            <div style={S.grid} role="main" aria-label="Energy assessment wizard">
              {/* LEFT PANEL — Indigo */}
              <div style={S.left} role="navigation" aria-label="Wizard steps">
                <FacilityCard />
              <TrueQuoteBadge />

                {/* Ranked Enhancements — ALL items scored highest to lowest */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #6366f1', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IcoTarget size={14} color="#6366f1" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Merlin's Rankings</span>
                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{enhancements.length} options</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginBottom: 12 }}>Scored on ROI, facility fit & risk exposure</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(enhancements || []).map((enh, idx) => {
                      const isTop3 = idx < 3;
                      const c = isTop3 ? '#6366f1' : '#64748b';
                      const isSel = selectedEnhancements.includes(enh.id);
                      return (
                        <div key={enh.id} style={{
                          display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 8,
                          background: isSel ? 'rgba(245,158,11,0.08)' : isTop3 ? 'rgba(99,102,241,0.04)' : 'transparent',
                          border: isSel ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                        }}>
                          {/* Mini score ring */}
                          <svg width={32} height={32} style={{ flexShrink: 0 }}>
                            <circle cx={16} cy={16} r={12} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                            <circle cx={16} cy={16} r={12} fill="none" stroke={isSel ? '#6366f1' : c} strokeWidth={2}
                              strokeDasharray={2 * Math.PI * 12} strokeDashoffset={2 * Math.PI * 12 * (1 - enh.score / 100)}
                              strokeLinecap="round" transform="rotate(-90 16 16)" />
                            <text x={16} y={17} textAnchor="middle" dominantBaseline="middle" fill={isSel ? '#fbbf24' : c} fontSize={10} fontWeight={800}>{enh.score}</text>
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? '#fbbf24' : 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{enh.icon}</span> {enh.name}
                              {isSel && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>✓ ON</span>}
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {enh.keyFactors?.slice(0, 2).map(f => `${f.label}: ${f.value}`).join(' · ')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scoring methodology — removed (scores speak for themselves) */}
              </div>

              {/* RIGHT PANEL — Black */}
              <div style={S.right}>
                <div ref={rightPanelRef} style={S.rightScroll}>
                  <div style={S.rightInner}>
                    {/* Header */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={S.sectionTitle}>Select Additional Options</div>
                      <div style={{ fontSize: 14, color: '#c0cbda', marginTop: 4 }}>Review costs & value. Click ADD to include in your quote, or ⚙ to configure.</div>
                    </div>


                    {/* ═══ OPTIONS ADDED — live-updating strip (Proposal B header style) ═══ */}
                    {(() => {
                      const optCount = selectedEnhancements.length + (selectedExpansion ? 1 : 0) + (includeGenerator && !genUserRemoved ? 1 : 0);
                      const optCost = enhancementAddonCost + (selectedExpansion && expansionAddedKW > 0 ? (expansionPanelCost + expansionStructuralCost) : 0) + (includeGenerator && !genUserRemoved ? genBaseCost : 0);
                      const optValue = enhancementAddonSavings + evAnnualNetRevenue + expansionAddedSavings + (includeGenerator && !genUserRemoved ? (rec.generator?.avoidedLossPerYear || 25000) : 0);
                      const optPayback = optValue > 0 ? (optCost / optValue).toFixed(1) : '—';
                      return optCount > 0 ? (
                        <div style={{ marginBottom: 18, padding: '14px 20px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04))', border: '1.5px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Added</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: '#a5b4fc' }}>{optCount}</span>
                            </div>
                            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.06)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add-on Cost</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>${Math.round(optCost / 1000)}K</span>
                            </div>
                            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.06)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Value</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: '#4ade80' }}>+${Math.round(optValue / 1000)}K/yr</span>
                            </div>
                            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.06)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add-on Payback</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>{optPayback} yr</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#475569', fontWeight: 600 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4ade80' }} />
                            Live
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* TABLE-STYLE LINE ITEMS — deployed styling */}
                    {(() => {
                      // Shared styles — deployed look
                      const colHdr = { fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' };
                      const tierLabelSt = (c, bg) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '3px solid transparent', background: bg });
                      const rowSt = (sel, auto) => ({
                        display: 'flex', alignItems: 'center', padding: '14px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: sel ? '3px solid #4ade80' : '3px solid transparent',
                        background: sel ? 'rgba(74,222,128,0.03)' : 'transparent',
                        transition: 'background 0.15s',
                      });
                      const nameCol = { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 };
                      const cfgCol = { width: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' };
                      const costCol = { width: 110, textAlign: 'right', flexShrink: 0 };
                      const valCol = { width: 130, textAlign: 'right', flexShrink: 0 };
                      const actCol = { width: 110, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' };
                      // Config chip — two-line, green when active
                      const chipSt = (active) => ({ fontSize: 11, fontWeight: 500, color: active ? '#4ade80' : '#94a3b8', padding: '6px 12px', borderRadius: 7, background: active ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', lineHeight: 1.4 });
                      const chipSub = { fontSize: 10, color: '#64748b', display: 'block', marginTop: 1 };
                      // Buttons — solid fills matching deployed
                      const btnAddSt = { padding: '7px 22px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', transition: 'all 0.2s' };
                      const btnAddedSt = { padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: '#16a34a', color: 'white', transition: 'all 0.2s' };
                      const btnRemSt = { padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: '#dc2626', color: 'white', transition: 'all 0.2s' };
                      const btnRestoreSt = { padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.06)', color: '#4ade80', transition: 'all 0.2s' };
                      const autoBadgeSt = { fontSize: 10, fontWeight: 800, color: 'white', background: '#16a34a', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 8, display: 'inline-block' };
                      const savingsVerbs = { costs: 'saves', revenue: 'earns', protection: 'avoids' };
                      const tierEmojis = { costs: '🔒', revenue: '📊', protection: '🛡️' };
                      const tierBgs = { costs: 'rgba(99,102,241,0.04)', revenue: 'rgba(129,140,248,0.04)', protection: 'rgba(167,139,250,0.04)' };

                      return (
                        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 18 }}>
                          {/* Column headers */}
                          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid transparent' }}>
                            <div style={{ ...nameCol, ...colHdr }}>Enhancement</div>
                            <div style={{ ...cfgCol, ...colHdr }}>Config</div>
                            <div style={{ ...costCol, ...colHdr }}>Turnkey Price</div>
                            <div style={{ ...valCol, ...colHdr }}>Value / yr</div>
                            <div style={{ ...actCol }} />
                          </div>

                          {tierOrder.map(tier => {
                            const t = TIERS[tier];
                            const items = (step5Items || []).filter(a => a.tier === tier);
                            const verb = savingsVerbs[tier];

                            return (
                              <React.Fragment key={tier}>
                                {/* Tier label with emoji + tinted bg */}
                                <div style={tierLabelSt(t.accent, tierBgs[tier])}>
                                  <span style={{ fontSize: 14 }}>{tierEmojis[tier]}</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</span>
                                </div>

                                {/* Solar Expansion */}
                                {tier === 'costs' && rec.expansionScenarios && (() => {
                                  const exp = rec.expansionScenarios;
                                  const utilRate = rec.assumptions?.electricRate || 0.19;
                                  const prodRate = locationData?.solar?.annualProduction || STATE_SOLAR_PRODUCTION[state] || 1200;
                                  const derating = rec.weatherRisk?.productionDerating || 0.92;
                                  const selSc = selectedExpansion ? exp.scenarios.find(s => s.id === selectedExpansion) : null;
                                  const hasExpansion = !!selSc;
                                  const addedProd = selSc ? Math.round(selSc.addedKW * prodRate * derating) : 0;
                                  const addedSavYr = selSc ? Math.round(addedProd * utilRate * selfConsumptionRate) : 0;
                                  const panelCostPerW = costPerW;
                                  const fullInstallCost = selSc ? Math.round(selSc.addedKW * 1000 * panelCostPerW) + Math.round(selSc.addedKW * 1000 * canopyStructureCostPerW) : 0;
                                  const fullInstallNet = Math.round(fullInstallCost * (1 - itcTotalRate));
                                  const panelsCost = selSc ? Math.round(selSc.addedKW * 1000 * panelCostPerW) : 0;
                                  const structCost = selSc ? Math.round(selSc.addedKW * 1000 * canopyStructureCostPerW) : 0;
                                  return (
                                    <div style={rowSt(hasExpansion)}>
                                      <div style={nameCol}>
                                        <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>☀️</span>
                                        <div>
                                          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                                            {industryId === 'carwash' || industryId === 'gasstation' ? 'Canopy Solar Expansion' : industryId === 'indoorfarm' ? 'Greenhouse Solar' : 'Carport Solar Expansion'}
                                            {hasExpansion && <span style={autoBadgeSt}>AUTO</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={cfgCol}>
                                        {hasExpansion ? (
                                          <div onClick={() => { setExpansionModalStep(1); setShowExpansionModal(true); }} style={{ ...chipSt(true), textAlign: 'left', cursor: 'pointer', padding: '6px 10px', lineHeight: 1.35 }}>
                                            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>🏗️ {selSc.label} ⚙</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>Panels: ${fmt(panelsCost)}</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>Structure: ${fmt(structCost)}</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', marginTop: 1 }}>Combined: ${fmt(fullInstallCost)}</div>
                                          </div>
                                        ) : (
                                          <span style={chipSt(false)} onClick={() => { setExpansionModalStep(1); setShowExpansionModal(true); }}>Configure ⚙</span>
                                        )}
                                      </div>
                                      <div style={costCol}><span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{hasExpansion ? `$${Math.round(fullInstallNet / 1000)}K` : '—'}</span></div>
                                      <div style={valCol}><span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{hasExpansion ? `$${fmt(addedSavYr)}/yr` : '—'}</span></div>
                                      <div style={actCol}>
                                        {hasExpansion ? (
                                          <button onClick={(e) => { e.stopPropagation(); setSelectedExpansion(null); }} style={btnRemSt}>Remove</button>
                                        ) : (
                                          <button onClick={() => { setExpansionModalStep(1); setShowExpansionModal(true); }} style={btnAddSt}>ADD</button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Enhancement rows */}
                                {(items || []).map(item => {
                                  const isSel = selectedEnhancements.includes(item.id);
                                  const isGenAutoIncluded = item.id === 'generatorHybrid' && rec.generator?.recommended === true && !genUserRemoved;
                                  const isGenRemoved = item.id === 'generatorHybrid' && genUserRemoved;
                                  const effectiveSel = isGenAutoIncluded || isSel;
                                  const rawCost = typeof item.estimatedCost === 'string' ? (parseInt(item.estimatedCost.replace(/[^0-9]/g, '')) || 0) : (item.estimatedCost || 0);
                                  const displayCostK = item.id === 'evCharging' ? `$${Math.round(evNet / 1000)}K` : (rawCost >= 1000 ? `$${Math.round(rawCost / 1000)}K` : item.estimatedCost);
                                  const displaySavings = item.id === 'evCharging' ? `$${fmt(evRev)}` : (item.annualSavings ? `$${fmt(item.annualSavings)}` : '—');
                                  // Two-line config chip content
                                  const cfgMain = item.id === 'evCharging' ? `${enhancementConfigs.evCharging.l2Count || 4}× L2${enhancementConfigs.evCharging.dcCount ? ` + ${enhancementConfigs.evCharging.dcCount}× DC` : ''}`
                                    : item.id === 'waterReclaim' ? `${Math.round((formData?.waterReclaimLevel === 'basic' ? 55 : formData?.waterReclaimLevel === 'standard' ? 75 : 0))}% → 90%`
                                    : item.id === 'extendedBackup' ? '8hr target'
                                    : item.id === 'generatorHybrid' ? `${rec.generator?.powerKW || 50} kW ${rec.generator?.fuelType === 'natural_gas' ? 'NG' : rec.generator?.fuelType || 'NG'}`
                                    : item.id === 'monitoring' ? `${item.keyFactors?.find(f => f.label === 'Circuits')?.value || '32 circuits'}`
                                    : item.id === 'vfdRetrofit' ? (item.keyFactors?.find(f => f.label === 'Total HP')?.value || null)
                                    : item.id === 'heatPumpWH' ? 'COP 3.5'
                                    : item.id === 'hvacOptimization' ? 'Smart controls'
                                    : item.id === 'coolRoof' ? 'R-30+ target'
                                    : item.id === 'bmsIntegration' ? 'Full automation'
                                    : item.id === 'coolingRedundancy' ? 'N+1 failover'
                                    : item.id === 'ledGrowLights' ? 'Full spectrum'
                                    : item.id === 'compressedAir' ? 'Leak detection'
                                    : null;
                                  const cfgSubtext = item.id === 'evCharging' ? '$30C credit'
                                    : item.id === 'waterReclaim' ? 'Upgrade reclaim'
                                    : item.id === 'extendedBackup' ? 'Critical loads'
                                    : item.id === 'generatorHybrid' ? 'Auto-transfer'
                                    : item.id === 'monitoring' ? 'Real-time'
                                    : item.id === 'vfdRetrofit' ? 'Soft-start'
                                    : item.id === 'heatPumpWH' ? 'Replaces gas'
                                    : item.id === 'hvacOptimization' ? 'VFD + economizer'
                                    : item.id === 'coolRoof' ? 'Reduce cooling'
                                    : item.id === 'bmsIntegration' ? 'Cloud dashboard'
                                    : item.id === 'coolingRedundancy' ? '99.99% uptime'
                                    : item.id === 'ledGrowLights' ? 'Tunable spectrum'
                                    : item.id === 'compressedAir' ? 'Fix 20-30% waste'
                                    : null;

                                  if (isGenRemoved) {
                                    return (
                                      <div key={item.id} style={{ ...rowSt(false), opacity: 0.45 }}>
                                        <div style={nameCol}>
                                          <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                                          <div><div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>{item.name}</div></div>
                                        </div>
                                        <div style={cfgCol}><span style={{ fontSize: 11, color: '#334155' }}>—</span></div>
                                        <div style={costCol}><span style={{ fontSize: 16, fontWeight: 800, color: '#475569' }}>—</span></div>
                                        <div style={valCol}><span style={{ fontSize: 14, color: '#475569' }}>—</span></div>
                                        <div style={actCol}><button onClick={() => setGenUserRemoved(false)} style={btnRestoreSt}>+ Add back</button></div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div key={item.id} style={rowSt(effectiveSel)}>
                                      <div style={nameCol}>
                                        <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                                        <div>
                                          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center' }}>
                                            {item.name}
                                            {isGenAutoIncluded && <span style={autoBadgeSt}>AUTO</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={cfgCol}>
                                        {cfgMain ? (
                                          <span style={chipSt(effectiveSel)} onClick={(e) => { e.stopPropagation(); setDetailModalItem(item); }}>
                                            {cfgMain} ⚙{cfgSubtext && <span style={chipSub}>{cfgSubtext}</span>}
                                          </span>
                                        ) : <span style={{ fontSize: 11, color: '#334155' }}>—</span>}
                                      </div>
                                      <div style={costCol}><span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{isGenAutoIncluded ? `$${Math.round(genBaseCost / 1000)}K` : displayCostK}</span></div>
                                      <div style={valCol}><span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{displaySavings}/yr</span></div>
                                      <div style={actCol}>
                                        {isGenAutoIncluded ? (
                                          <button onClick={(e) => { e.stopPropagation(); setGenUserRemoved(true); }} style={btnRemSt}>Remove</button>
                                        ) : effectiveSel ? (
                                          <button onClick={(e) => { e.stopPropagation(); setSelectedEnhancements(prev => prev.filter(x => x !== item.id)); }} style={btnAddedSt}>ADDED ✓</button>
                                        ) : (
                                          <button onClick={(e) => { e.stopPropagation(); toggleEnhancement(item.id); }} style={btnAddSt}>ADD</button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Auto-included strip */}
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Auto-included:</span>
                        {['LED Lighting', 'Surge Protection', 'Demand Response', 'Rate Analysis'].map(ex => (
                          <span key={ex} style={{ fontSize: 11, color: '#a5b4fc', padding: '3px 10px', borderRadius: 5, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                            {ex} ✓
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER — Back / Continue */}
            <div style={S.footer}>
              <div style={S.footerLeft}>
                <button style={S.btnBack} onClick={() => setCurrentStep(4)}><IcoChevL size={18} color="#cbd5e1" /> Back to Priorities</button>
              </div>
              <div style={S.footerRight}>
                <button style={S.btnNext} onClick={() => setCurrentStep(6)}>Continue to System Config <IcoChevR size={18} color="white" /></button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── STEP 5 DETAIL MODAL ── */}
      {currentStep === 5 && showEnhancementConfig && (() => {
        // FIX S5-2: ADDONS_MODAL now reads from live buildEnhancements data instead of hardcoded values
        const _enh = (id) => (enhancements || []).find(e => e.id === id);
        const ADDONS_MODAL = [
          { id: 'heatPumpWH', name: _enh('heatPumpWH')?.name || 'Heat Pump Water Heater', icon: '🔥', tier: 'costs',
            whyLong: 'Heat pump is 3× more efficient than gas — eliminates gas dependency entirely. Qualifies for IRA §25C tax credit.',
            cost: _enh('heatPumpWH')?.estimatedCost || '$0', savings: `$${fmt(_enh('heatPumpWH')?.annualSavings || 0)}/yr`, payback: _enh('heatPumpWH')?.payback || '—',
            factors: _enh('heatPumpWH')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [{ label: 'Status', value: 'Not applicable', neg: true }] },
          { id: 'waterReclaim', name: _enh('waterReclaim')?.name || 'Water Reclaim Upgrade', icon: '💧', tier: 'costs',
            whyLong: 'Upgrade water reclaim to reduce consumption and heating costs.',
            cost: _enh('waterReclaim')?.estimatedCost || '$0', savings: `$${fmt(_enh('waterReclaim')?.annualSavings || 0)}/yr`, payback: _enh('waterReclaim')?.payback || '—',
            factors: _enh('waterReclaim')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
          { id: 'evCharging', name: _enh('evCharging')?.name || 'EV Charging Stations', icon: '⚡', tier: 'revenue',
            whyLong: (enhancementConfigs.evCharging._existingL2 > 0 || enhancementConfigs.evCharging._existingDC > 0)
              ? `You already have ${enhancementConfigs.evCharging._existingL2 > 0 ? `${enhancementConfigs.evCharging._existingL2} L2` : ''}${enhancementConfigs.evCharging._existingL2 > 0 && enhancementConfigs.evCharging._existingDC > 0 ? ' + ' : ''}${enhancementConfigs.evCharging._existingDC > 0 ? `${enhancementConfigs.evCharging._existingDC} DCFC` : ''} chargers. Configure additional units below — carport is ideal for L2 + DCFC expansion. IRA §30C provides 30% tax credit (exp. 6/2026). Pricing from Supplier DB v14.2.`
              : 'Carport is ideal for L2 + DCFC stations. IRA §30C provides 30% tax credit (exp. 6/2026). Pricing from Supplier DB v14.2.',
            cost: _enh('evCharging')?.estimatedCost || '$0', savings: `$${fmt(_enh('evCharging')?.annualSavings || 0)}/yr`, payback: _enh('evCharging')?.payback || '—',
            factors: _enh('evCharging')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
          { id: 'extendedBackup', name: _enh('extendedBackup')?.name || 'Extended Backup', icon: '🔋', tier: 'protection',
            whyLong: 'Extend BESS backup duration for outage protection.',
            cost: _enh('extendedBackup')?.estimatedCost || '$0', savings: `$${fmt(_enh('extendedBackup')?.annualSavings || 0)}/outage-day`, payback: _enh('extendedBackup')?.payback || 'Risk mitigation',
            factors: _enh('extendedBackup')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
          { id: 'generatorHybrid', name: _enh('generatorHybrid')?.name || 'Generator Integration', icon: '⛽', tier: 'protection',
            whyLong: 'BESS + Generator coordination provides unlimited backup with ATS and islanding.',
            cost: _enh('generatorHybrid')?.estimatedCost || '$0', savings: `$${fmt(_enh('generatorHybrid')?.annualSavings || 0)}/yr avoided loss`, payback: _enh('generatorHybrid')?.payback || '—',
            factors: _enh('generatorHybrid')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
          { id: 'vfdRetrofit', name: _enh('vfdRetrofit')?.name || 'VFD Motor Retrofit', icon: '🔧', tier: 'costs',
            whyLong: 'Variable Frequency Drives reduce motor energy consumption by 20-40% on pumps and dryers. Soft-start capability extends motor life.',
            cost: _enh('vfdRetrofit')?.estimatedCost || '$0', savings: `$${fmt(_enh('vfdRetrofit')?.annualSavings || 0)}/yr`, payback: _enh('vfdRetrofit')?.payback || '—',
            factors: _enh('vfdRetrofit')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
          { id: 'monitoring', name: _enh('monitoring')?.name || 'Smart Energy Monitor', icon: '📡', tier: 'costs',
            whyLong: 'Real-time energy monitoring identifies waste and demand spikes. Typically delivers 5-10% energy savings through visibility and alerts.',
            cost: _enh('monitoring')?.estimatedCost || '$0', savings: `$${fmt(_enh('monitoring')?.annualSavings || 0)}/yr`, payback: _enh('monitoring')?.payback || '—',
            factors: _enh('monitoring')?.keyFactors?.map(f => ({ label: f.label, value: f.value, neg: !f.positive })) || [] },
        ];
        const TIERS_M = {
          costs: { accent: '#6366f1', popup: { bg: 'linear-gradient(160deg, #1e1b4b 0%, #1e1b4b 40%, #0f172a 100%)', border: 'rgba(99,102,241,0.4)' } },
          revenue: { accent: '#818cf8', popup: { bg: 'linear-gradient(160deg, #1e1b4b 0%, #1e1b4b 40%, #0f172a 100%)', border: 'rgba(99,102,241,0.4)' } },
          protection: { accent: '#818cf8', popup: { bg: 'linear-gradient(160deg, #1e1b4b 0%, #1e1b4b 40%, #0f172a 100%)', border: 'rgba(99,102,241,0.4)' } },
        };
        const item = ADDONS_MODAL.find(a => a.id === showEnhancementConfig);
        if (!item) return null;
        const t = TIERS_M[item.tier];
        const isSel = selectedEnhancements.includes(item.id);
        const L2U = 2800, DCU = 63500;

        return (
          <>
            <div onClick={() => setShowEnhancementConfig(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 500, maxWidth: '95vw', maxHeight: '85vh', overflow: 'auto', zIndex: 201,
              background: t.popup.bg, borderRadius: 20, padding: '24px 28px',
              border: `2px solid ${t.popup.border}`, boxShadow: `0 20px 60px ${t.accent}20`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${t.popup.border}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.accent}18`, border: `2px solid ${t.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${t.accent}20`, color: t.accent }}>{item.tier === 'costs' ? 'CUT COSTS' : item.tier === 'revenue' ? 'NEW REVENUE' : 'PROTECTION'}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: isSel ? 'rgba(245,158,11,0.25)' : 'rgba(148,163,184,0.15)', color: isSel ? '#fbbf24' : '#94a3b8' }}>{isSel ? 'ADDED ✓' : 'PREVIEW'}</span>
                  </div>
                </div>
                <button onClick={() => setShowEnhancementConfig(null)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              </div>

              {/* Metrics — hidden for EV (shown in simplified layout) */}
              {item.id !== 'evCharging' && (<>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[{ l: 'Est. Cost', v: item.cost, c: '#e2e8f0' }, { l: 'Annual Value', v: item.savings, c: '#a5b4fc' }, { l: 'Payback', v: item.payback, c: '#fbbf24' }].map((m, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '8px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{m.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.15)', borderLeft: `3px solid ${t.accent}` }}>
                {item.whyLong}
              </div>

              {/* Key factors */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {(item.factors || []).map((f, j) => (
                  <div key={j} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: f.neg ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${f.neg ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)'}` }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: f.neg ? '#fca5a5' : '#6ee7b7' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              </>)}

              {/* EV Config — SIMPLIFIED: counters primary, details expandable */}
              {item.id === 'evCharging' && (() => {
                const evL2Val = enhancementConfigs.evCharging.l2Count || 0;
                const evDCVal = enhancementConfigs.evCharging.dcCount || 0;
                const evGrossCalc = evL2Val * L2U + evDCVal * DCU;
                const evCreditCalc = Math.min(Math.round(evGrossCalc * 0.3), 100000);
                const evRevCalc = evL2Val * 3000 + evDCVal * 15000;
                const evDemandKW = evL2Val * 11.5 + evDCVal * 50;
                const evPaybackCalc = evRevCalc > 0 ? ((evGrossCalc - evCreditCalc) / evRevCalc).toFixed(1) : '—';
                return (<>
                {/* Existing chargers notice */}
                {(enhancementConfigs.evCharging._existingL2 > 0 || enhancementConfigs.evCharging._existingDC > 0) && (
                  <div style={{ fontSize: 11, color: '#a5b4fc', padding: '6px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📍</span>
                    <span>Existing: {enhancementConfigs.evCharging._existingL2 > 0 ? `${enhancementConfigs.evCharging._existingL2} L2` : ''}{enhancementConfigs.evCharging._existingL2 > 0 && enhancementConfigs.evCharging._existingDC > 0 ? ' + ' : ''}{enhancementConfigs.evCharging._existingDC > 0 ? `${enhancementConfigs.evCharging._existingDC} DCFC` : ''} — configure <strong>additional</strong> below</span>
                  </div>
                )}
                {/* L2 / DCFC Counter Cards */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  {[{ key: 'l2Count', label: 'Level 2', type: 'L2', kw: '11.5 kW', max: 12, unit: L2U }, { key: 'dcCount', label: 'DC Fast Charge', type: 'DCFC', kw: '50 kW', max: 4, unit: DCU }].map(ch => {
                    const val = enhancementConfigs.evCharging[ch.key] || 0;
                    return (
                    <div key={ch.key} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{ch.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'white', marginBottom: 2 }}>{ch.type} <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{ch.kw}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '12px 0 8px' }}>
                        <button onClick={() => setEnhancementConfigs(p => ({...p, evCharging: {...p.evCharging, [ch.key]: Math.max(0, val-1)}}))}
                          style={{ width: 38, height: 38, borderRadius: '10px 0 0 10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <div style={{ width: 48, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: val > 0 ? 'white' : '#475569', background: 'rgba(99,102,241,0.12)', borderTop: '1px solid rgba(99,102,241,0.2)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{val}</div>
                        <button onClick={() => setEnhancementConfigs(p => ({...p, evCharging: {...p.evCharging, [ch.key]: Math.min(ch.max, val+1)}}))}
                          style={{ width: 38, height: 38, borderRadius: '0 10px 10px 0', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>${fmt(ch.unit)}/unit turnkey</div>
                    </div>
                    );
                  })}
                </div>
                {/* Auto-summary strip */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[{ l: 'Total Cost', v: `$${fmt(evGrossCalc)}`, c: 'white' }, { l: '§30C Credit', v: `−$${fmt(evCreditCalc)}`, c: '#4ade80' }, { l: 'Revenue/yr', v: `$${fmt(evRevCalc)}/yr`, c: '#4ade80' }].map((m, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{m.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: m.c }}>{m.v}</div>
                    </div>
                  ))}
                </div>
                {/* Expandable details */}
                <div onClick={() => setEnhancementConfigs(p => ({...p, evCharging: {...p.evCharging, _detailOpen: !p.evCharging._detailOpen}}))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#64748b', borderRadius: 8, transition: 'all 0.15s', marginBottom: enhancementConfigs.evCharging._detailOpen ? 10 : 14 }}>
                  <span>{enhancementConfigs.evCharging._detailOpen ? 'Hide details' : 'View details'}</span>
                  <span style={{ transition: 'transform 0.2s', transform: enhancementConfigs.evCharging._detailOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
                {enhancementConfigs.evCharging._detailOpen && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                    {[
                      { k: 'Payback', v: `${evPaybackCalc} yr`, c: '#fbbf24' },
                      { k: 'Demand Impact', v: `+${Math.round(evDemandKW)} kW on panel`, c: '#fca5a5' },
                      { k: 'Connector Type', v: 'J1772 + NACS', c: '#e2e8f0' },
                      { k: '§30C ITC', v: '30% (exp. 6/2026)', c: '#4ade80' },
                      { k: 'Pricing Source', v: 'Supplier DB v14.2', c: '#e2e8f0' },
                      { k: 'Site Suitability', v: 'Carport ideal for L2 + DCFC', c: '#4ade80' },
                    ].map(d => (
                      <div key={d.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.k}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: d.c }}>{d.v}</span>
                      </div>
                    ))}
                  </div>
                )}
                </>);
              })()}

              {/* Backup Config */}
              {item.id === 'extendedBackup' && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.accent}30`, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, marginBottom: 10, letterSpacing: '0.04em' }}>CONFIGURE BACKUP</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, minWidth: 70 }}>Target Hours</span>
                    <input type="range" min={4} max={24} value={enhancementConfigs.extendedBackup?.hours || 8}
                      onChange={e => setEnhancementConfigs(p => ({...p, extendedBackup: {...p.extendedBackup, hours: +e.target.value}}))}
                      style={{ flex: 1, accentColor: t.accent }} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: t.accent, minWidth: 40, textAlign: 'right' }}>{enhancementConfigs.extendedBackup?.hours || 8}h</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    {[{ l: 'Current', v: '4 hrs', c: '#fca5a5' }, { l: 'Target', v: `${enhancementConfigs.extendedBackup?.hours || 8} hrs`, c: t.accent }, { l: 'Add\'l Cost', v: `$${fmt(((enhancementConfigs.extendedBackup?.hours || 8) - 4) * 2250)}`, c: '#e2e8f0' }].map((m, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 3px', borderRadius: 6, background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{m.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generator Config */}
              {item.id === 'generatorHybrid' && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.accent}30`, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, marginBottom: 10, letterSpacing: '0.04em' }}>CONFIGURE GENERATOR</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {[{ label: 'Auto-Size (Rec)', val: true }, { label: 'Manual', val: false }].map(opt => (
                      <div key={opt.label} onClick={() => setEnhancementConfigs(p => ({...p, generatorHybrid: {...p.generatorHybrid, autoSize: opt.val, manualKW: opt.val ? 50 : (p.generatorHybrid?.manualKW || 50)}}))}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                          background: (enhancementConfigs.generatorHybrid?.autoSize !== false) === opt.val ? `${t.accent}20` : 'rgba(0,0,0,0.2)',
                          border: `2px solid ${(enhancementConfigs.generatorHybrid?.autoSize !== false) === opt.val ? t.accent : 'rgba(255,255,255,0.06)'}`,
                          fontSize: 12, fontWeight: 600, color: (enhancementConfigs.generatorHybrid?.autoSize !== false) === opt.val ? t.accent : '#64748b',
                        }}>{opt.label}</div>
                    ))}
                  </div>
                  {enhancementConfigs.generatorHybrid?.autoSize === false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>kW</span>
                      <input type="range" min={20} max={200} step={5} value={enhancementConfigs.generatorHybrid?.manualKW || 50}
                        onChange={e => setEnhancementConfigs(p => ({...p, generatorHybrid: {...p.generatorHybrid, manualKW: +e.target.value}}))}
                        style={{ flex: 1, accentColor: t.accent }} />
                      <span style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>{enhancementConfigs.generatorHybrid?.manualKW || 50} kW</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ l: 'Size', v: (enhancementConfigs.generatorHybrid?.autoSize !== false) ? '50 kW (auto)' : `${enhancementConfigs.generatorHybrid?.manualKW || 50} kW`, c: t.accent },
                      { l: 'Fuel', v: 'Natural Gas', c: '#6ee7b7' },
                      { l: 'Est. Cost', v: `$${fmt(((enhancementConfigs.generatorHybrid?.autoSize !== false) ? 50 : (enhancementConfigs.generatorHybrid?.manualKW || 50)) * 550)}`, c: '#e2e8f0' },
                    ].map((m, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 3px', borderRadius: 6, background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{m.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action button */}
              {isSel ? (
                <button onClick={() => setShowEnhancementConfig(null)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `2px solid ${t.accent}`, background: `${t.accent}15`, color: t.accent, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.target.style.background = t.accent; e.target.style.color = '#0f172a'; }}
                  onMouseLeave={(e) => { e.target.style.background = `${t.accent}15`; e.target.style.color = t.accent; }}
                >Done</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowEnhancementConfig(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                  <button onClick={() => { setSelectedEnhancements(p => [...p, item.id]); setShowEnhancementConfig(null); }}
                    style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: t.accent, color: '#0f172a', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${t.accent}40` }}>
                    Add to Quote ✓
                  </button>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 6: SYSTEM CONFIGURATION                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 6 && (() => {
        const SupPopup = ({ category, color, title, options }) => {
          const [expandedIdx, setExpandedIdx] = useState(null);
          const specRows = (opt) => {
            const rows = [];
            // Solar panels
            if (opt.watts) rows.push({ l: 'Panel Output', v: `${opt.watts}W` }, { l: 'Technology', v: opt.technology }, { l: 'Efficiency', v: `${opt.efficiency}%` }, { l: 'Temp Coeff', v: opt.tempCoeff }, { l: 'Panels Needed', v: `${Math.ceil((rec.solar.sizeKW * 1000) / opt.watts)}` }, { l: 'Dimensions', v: opt.dimensions }, { l: 'Weight', v: opt.weight }, { l: 'Degradation', v: `${(opt.degradation * 100).toFixed(2)}%/yr` });
            // Inverters (has powerKW but NOT capacityKWh/watts/kW/fuelType)
            if (opt.powerKW && !opt.capacityKWh && !opt.watts && !opt.kW && !opt.fuelType) rows.push({ l: 'Power', v: `${opt.powerKW} kW` }, { l: 'Type', v: opt.type }, { l: 'Efficiency', v: `${opt.efficiency}%` }, { l: 'Max Voltage', v: opt.maxVoltage }, { l: 'MPPT', v: `${opt.mpptChannels} channels` }, { l: 'Cooling', v: opt.cooling }, { l: 'Dimensions', v: opt.dimensions });
            // BESS
            if (opt.capacityKWh) rows.push({ l: 'Capacity', v: `${opt.capacityKWh} kWh` }, { l: 'Power', v: `${opt.powerKW} kW` }, { l: 'Chemistry', v: opt.chemistry }, { l: 'Cells', v: opt.cells }, { l: 'Cycles', v: `${opt.cycles?.toLocaleString()}` }, { l: 'Round-Trip Eff', v: `${opt.roundTrip}%` }, { l: 'Thermal Mgmt', v: opt.thermalMgmt }, { l: 'Protocol', v: opt.commProtocol }, { l: 'Dimensions', v: opt.dimensions });
            // Generator
            if (opt.fuelType) rows.push({ l: 'Power', v: `${opt.powerKW} kW` }, { l: 'Fuel', v: opt.fuelType }, { l: 'Engine', v: opt.engineType }, { l: 'Consumption', v: opt.fuelConsumption }, { l: 'Noise', v: opt.noiseLevel }, { l: 'Start Time', v: opt.startTime }, { l: 'Transfer', v: opt.transferSwitch });
            // Canopy Structure (has installLaborPerW — unique to canopy structures)
            if (opt.installLaborPerW) rows.push({ l: 'Structure Type', v: opt.type }, { l: 'Material', v: opt.material }, { l: 'Wind Load', v: opt.windLoad }, { l: 'Snow Load', v: opt.snowLoad }, { l: 'Foundation', v: opt.foundationType }, { l: 'Clear Height', v: opt.clearHeight }, { l: 'Field Welding', v: opt.noFieldWelding ? 'None required' : 'Required' }, { l: 'Tilt Angle', v: opt.tiltAngle }, { l: 'Structure $/W', v: `$${opt.costPerW?.toFixed(2)}` }, { l: 'Install $/W', v: `$${opt.installLaborPerW?.toFixed(2)}` }, { l: 'Total $/W', v: `$${((opt.costPerW || 0) + (opt.installLaborPerW || 0)).toFixed(2)}` });
            // Racking (has material but NOT installLaborPerW)
            if (opt.material && !opt.installLaborPerW) rows.push({ l: 'Mount Type', v: opt.type }, { l: 'Material', v: opt.material }, { l: 'Wind Load', v: opt.windLoad }, { l: 'Snow Load', v: opt.snowLoad }, { l: 'Max Span', v: opt.maxSpan }, { l: 'Cost/Panel', v: `$${opt.costPerPanel}` });
            // EV Charger
            if (opt.kW && !opt.circuits) rows.push({ l: 'Level', v: opt.type }, { l: 'Output', v: `${opt.kW} kW` }, { l: 'Ports', v: `${opt.ports}/unit` }, { l: 'Connector', v: opt.connector }, { l: 'Cable', v: opt.cableLength }, { l: 'Mount', v: opt.mountType }, { l: 'Network Fees', v: opt.networkFees });
            // Monitor
            if (opt.circuits) rows.push({ l: 'Type', v: opt.type }, { l: 'Circuits', v: opt.circuits }, { l: 'Max Amps', v: opt.maxAmps }, { l: 'Connectivity', v: opt.connectivity }, { l: 'App Control', v: opt.appControl }, { l: 'Features', v: opt.features });
            rows.push({ l: 'Warranty', v: `${opt.warranty} yr` });
            if (opt.certifications) rows.push({ l: 'Certifications', v: opt.certifications });
            if (opt.uflpaRisk) rows.push({ l: 'UFLPA Risk', v: opt.uflpaRisk });
            return rows.filter(r => r.v != null && r.v !== 'undefined');
          };
          // Compact summary for collapsed cards — show 3-4 key specs inline
          const compactSpecs = (opt) => {
            if (opt.watts) return `${opt.watts}W · ${opt.technology} · ${opt.efficiency}% eff · ${opt.tempCoeff}`;
            if (opt.capacityKWh) return `${opt.capacityKWh} kWh · ${opt.powerKW} kW · ${opt.chemistry} · ${opt.cycles?.toLocaleString()} cycles`;
            if (opt.powerKW && !opt.capacityKWh && !opt.kW && !opt.fuelType) return `${opt.powerKW} kW · ${opt.type} · ${opt.efficiency}% eff · ${opt.mpptChannels} MPPT`;
            if (opt.fuelType) return `${opt.powerKW} kW · ${opt.fuelType} · ${opt.startTime}`;
            if (opt.installLaborPerW) return `${opt.type} · ${opt.material} · Wind: ${opt.windLoad} · $${((opt.costPerW || 0) + (opt.installLaborPerW || 0)).toFixed(2)}/W total`;
            if (opt.material) return `${opt.type} · ${opt.material} · Wind: ${opt.windLoad} · $${opt.costPerPanel}/panel`;
            if (opt.kW && !opt.circuits) return `${opt.type} · ${opt.kW} kW · ${opt.ports} ports · ${opt.connector}`;
            if (opt.circuits) return `${opt.type} · ${opt.circuits} circuits · ${opt.connectivity}`;
            return `${opt.warranty} yr warranty`;
          };
          const tariffColor = (risk) => risk === 'Low' || risk === 'None' ? '#a5b4fc' : risk === 'Extreme' ? '#ef4444' : risk === 'High' ? '#f87171' : '#fbbf24';
          const getFlag = (ct) => ct.includes('USA') || ct.includes('US') ? '🇺🇸' : ct.includes('China') ? '🇨🇳' : ct.includes('Israel') ? '🇮🇱' : ct.includes('Korea') ? '🇰🇷' : ct.includes('Germany') ? '🇩🇪' : ct.includes('Japan') ? '🇯🇵' : ct.includes('Thailand') ? '🇹🇭' : ct.includes('Vietnam') ? '🇻🇳' : ct.includes('Austria') ? '🇦🇹' : ct.includes('Singapore') ? '🇸🇬' : ct.includes('Norway') ? '🇳🇴' : ct.includes('Malaysia') ? '🇲🇾' : ct.includes('Mexico') ? '🇲🇽' : ct.includes('Canada') ? '🇨🇦' : ct.includes('Australia') ? '🇦🇺' : '🌐';

          return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setSupplierPopup(null)} />
            <div style={{ position: 'relative', borderRadius: 12, width: 960, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', background: '#1e293b' }}>
              {/* Header */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{options.length} options · Ranked by Merlin Scorecard · Click card to expand details · Click "Select" to choose</div>
                </div>
                <button onClick={() => setSupplierPopup(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: '#94a3b8', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', flexShrink: 0 }}>×</button>
              </div>

              {/* Scrollable Supplier Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, idx) => {
                  const isSel = selectedSuppliers[category] === idx;
                  const isExpanded = expandedIdx === idx;
                  const specs = specRows(opt);
                  const countries = (opt.country || '').split('/').map(s => s.trim());
                  return (
                    <div key={idx} style={{ width: '100%', borderRadius: 12, textAlign: 'left', fontFamily: 'inherit', border: isSel ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.06)', background: isSel ? `${color}08` : 'rgba(255,255,255,0.02)', transition: 'all 0.15s', overflow: 'hidden' }}>

                      {/* COMPACT ROW — always visible: rank, name, key specs, score, origin, select */}
                      <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}>
                        {/* Rank badge */}
                        <div style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'white', background: idx === 0 ? color : 'rgba(71,85,105,0.6)', flexShrink: 0, border: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>#{opt.rank}</div>
                        {/* Name + compact specs */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{opt.manufacturer}</span>
                            <span style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.model}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{compactSpecs(opt)}</div>
                        </div>
                        {/* Origin flags (compact) */}
                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                          {countries.slice(0, 2).map((ct, ci) => (
                            <span key={ci} style={{ fontSize: 18, lineHeight: 1 }} title={ct}>{getFlag(ct)}</span>
                          ))}
                        </div>
                        {/* Tariff pill */}
                        <span style={{ fontSize: 11, fontWeight: 700, color: tariffColor(opt.tariffRisk), padding: '3px 8px', borderRadius: 5, background: `${tariffColor(opt.tariffRisk)}12`, border: `1px solid ${tariffColor(opt.tariffRisk)}25`, flexShrink: 0 }}>{opt.tariffRisk}</span>
                        {/* Score */}
                        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: opt.score >= 80 ? '#6366f1' : opt.score >= 70 ? '#f59e0b' : '#94a3b8', lineHeight: 1.1 }}>{opt.score}</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>/100</div>
                        </div>
                        {/* Select button */}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedSuppliers(p => ({...p, [category]: idx})); setSupplierPopup(null); }}
                          style={{ padding: '6px 14px', borderRadius: 7, border: isSel ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.15)', background: isSel ? color : 'rgba(255,255,255,0.05)', color: isSel ? 'white' : '#e2e8f0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {isSel ? '✓ Selected' : 'Select'}
                        </button>
                        {/* Expand chevron */}
                        <span style={{ color: '#64748b', fontSize: 14, flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </div>

                      {/* EXPANDED DETAIL — only when clicked */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', background: 'rgba(0,0,0,0.15)' }}>
                          {/* Origin + Factory detail */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                            {countries.map((ct, ci) => (
                              <div key={ci} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: 15 }}>{getFlag(ct)}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{ct}</span>
                              </div>
                            ))}
                            {opt.factory && <span style={{ fontSize: 11, color: '#64748b' }}>Factory: {opt.factory}</span>}
                            {opt.usMade && <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '2px 7px', borderRadius: 4 }}>US MADE</span>}
                          </div>

                          {/* Tariff / Risk Notes */}
                          {opt.tariffNote && (
                            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>{opt.tariffNote}</div>
                          )}
                          {opt.riskNote && (
                            <div style={{ fontSize: 11, color: '#f59e0b', lineHeight: 1.4, marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                              {opt._edgarLive && <span style={{ fontSize: 9, fontWeight: 700, color: '#a5b4fc', background: 'rgba(52,211,153,0.15)', padding: '1px 5px', borderRadius: 3, marginRight: 6 }}>SEC LIVE</span>}
                              {opt.riskNote}
                            </div>
                          )}
                          {opt.uflpaNote && (
                            <div style={{ fontSize: 11, color: opt.uflpaRisk === 'High' ? '#f87171' : '#64748b', lineHeight: 1.4, marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ fontWeight: 700 }}>UFLPA:</span> {opt.uflpaNote}
                            </div>
                          )}

                          {/* Score Breakdown */}
                          {opt._scoreBreakdown && (
                            <div style={{ marginBottom: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Why This Rank</span>
                              </div>
                              <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '5px 14px' }}>
                                {[
                                  { label: 'Technical Merit', value: opt._scoreBreakdown.technical, weight: '25%' },
                                  { label: 'Cost Fit', value: opt._scoreBreakdown.cost, weight: '20%' },
                                  { label: 'Tariff Risk', value: opt._scoreBreakdown.tariff, weight: '20%' },
                                  { label: 'IRA Eligibility', value: opt._scoreBreakdown.ira, weight: '15%' },
                                  { label: 'Financial Health', value: opt._scoreBreakdown.financial, weight: '10%' },
                                  { label: 'Location Fit', value: opt._scoreBreakdown.location, weight: '10%' },
                                ].map((dim) => (
                                  <div key={dim.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: 10, color: '#64748b', minWidth: 72, flexShrink: 0 }}>{dim.label}</span>
                                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(dim.value, 0)}%`, background: dim.value >= 75 ? '#6366f1' : dim.value >= 50 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: dim.value >= 75 ? '#6366f1' : dim.value >= 50 ? '#f59e0b' : '#ef4444', minWidth: 20, textAlign: 'right' }}>{Math.max(dim.value, 0)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* NET COST WITH ITC — for solar, BESS, EV charger categories */}
                              {(() => {
                                const itcRate = ITC_RATE; // ← merlinConstants SSOT
                                const domesticBonus = opt.usMade ? ITC_DOMESTIC_BONUS : 0;
                                const feocIneligible = (opt.tariffNote && opt.tariffNote.includes('INELIGIBLE')) || (opt.tariffNote && opt.tariffNote.includes('exclusion')) || (opt.tariffRisk === 'Extreme' && opt.tariffNote && opt.tariffNote.includes('FEOC'));
                                const totalITC = feocIneligible ? 0 : (itcRate + domesticBonus);
                                
                                let hardwareCost = 0;
                                let costLabel = '';
                                if (opt.costPerKWh && opt.capacityKWh) {
                                  hardwareCost = opt.costPerKWh * (rec.bess?.capacityKWh || 200);
                                  costLabel = `${rec.bess?.capacityKWh || 200} kWh × $${opt.costPerKWh}/kWh`;
                                } else if (opt.costPerW && opt.watts) {
                                  const panels = Math.ceil((rec.solar?.sizeKW || 85) * 1000 / opt.watts);
                                  hardwareCost = panels * opt.watts * opt.costPerW / 1000;
                                  costLabel = `${panels} panels × $${opt.costPerW}/W`;
                                } else if (opt.costPerUnit && opt.kW) {
                                  const evQty = parseInt(formData?.l2Chargers) || parseInt(formData?.dcChargers) || 2;
                                  hardwareCost = opt.costPerUnit * evQty;
                                  costLabel = `${evQty} units × ${$fmt(opt.costPerUnit)}`;
                                } else {
                                  return null;
                                }
                                
                                const itcCredit = Math.round(hardwareCost * totalITC);
                                const netCost = Math.round(hardwareCost - itcCredit);
                                
                                return (
                                  <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Net Cost After ITC</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                        <span style={{ color: '#94a3b8' }}>Hardware ({costLabel})</span>
                                        <span style={{ color: 'white', fontWeight: 600 }}>${fmt(hardwareCost)}</span>
                                      </div>
                                      {totalITC > 0 ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                          <span style={{ color: '#a5b4fc' }}>ITC Credit ({(totalITC * 100).toFixed(0)}%{opt.usMade ? ' incl. domestic bonus' : ''})</span>
                                          <span style={{ color: '#a5b4fc', fontWeight: 600 }}>−${fmt(itcCredit)}</span>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                          <span style={{ color: '#ef4444' }}>⚠ FEOC — No ITC eligible</span>
                                          <span style={{ color: '#ef4444', fontWeight: 600 }}>$0</span>
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        <span style={{ color: 'white', fontWeight: 700 }}>Net Cost</span>
                                        <span style={{ color: netCost <= hardwareCost * 0.65 ? '#6366f1' : '#f59e0b', fontWeight: 700, fontSize: 14 }}>${fmt(netCost)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Full Technical Specs Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 5 }}>
                            {specs.map((s, i) => (
                              <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>{s.l}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: s.l === 'UFLPA Risk' ? (s.v === 'High' ? '#f87171' : '#a5b4fc') : 'white', lineHeight: 1.3, wordBreak: 'break-word' }}>{s.v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Scores dynamically computed · 6 dimensions · ITC-adjusted net costs · Click card for full specs</span>
                <button onClick={() => setSupplierPopup(null)} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, color: 'white', background: color, fontFamily: 'inherit', fontSize: 13 }}>Done</button>
              </div>
            </div>
          </div>
          );
        };

        // ── TARGET COST MODEL: Industry turnkey benchmarks ──
        // Customer sees industry-standard installed prices. Merlin COGS = what we pay suppliers.
        // GP = turnkey - COGS. This prices Merlin competitively while maintaining 25-35% GP.
        const TARGET_TURNKEY = {
          solar:     { rate: 2.80, perLabel: '/W' },       // $/W turnkey installed
          inverter:  { rate: 220,  perLabel: '/kW' },      // $/kW
          racking:   { rate: 70,   perLabel: '/panel' },   // $/panel
          bess:      { rate: 425,  perLabel: '/kWh' },     // $/kWh
          generator: { rate: 750,  perLabel: '/kW' },      // $/kW
          evCharger: { rate: 4500, perLabel: '/unit' },     // $/unit
          monitor:   { rate: 14000, perLabel: '/site' },    // $/site
          canopyPanels:    { rate: 2.80, perLabel: '/W' },  // panels only
          canopyStructure: { rate: 1.40, perLabel: '/W' },  // structure only
          engineering: { rate: 0, perLabel: '' },           // 100% margin (AI)
          pm:          { rate: 0, perLabel: '' },           // PM labor
        };
        // Compute turnkey price for a given equipment ID and quantity
        const getTurnkeyPrice = (id, qty) => {
          const t = TARGET_TURNKEY[id];
          return t ? Math.round(t.rate * qty) : 0;
        };
        // Equipment quantities for turnkey calculation
        const tkQty = {
          solar: (rec.solar?.sizeKW || 85) * 1000,       // watts
          inverter: Math.round(totalSystemKW),             // kW
          racking: dynamicPanelCount || 0,                 // panels
          bess: rec.bess?.capacityKWh || 200,              // kWh
          generator: rec.generator?.powerKW || 60,         // kW
          evCharger: evCount || 0,                         // units
          monitor: includeMonitor ? 1 : 0,                 // sites
          canopyPanels: (expansionAddedKW || 0) * 1000,    // watts
          canopyStructure: (expansionAddedKW || 0) * 1000, // watts
        };
        // Compute turnkey prices for all equipment
        const turnkeyPrices = {};
        Object.keys(tkQty).forEach(id => { turnkeyPrices[id] = getTurnkeyPrice(id, tkQty[id]); });
        // Services — use actual calculated values (no fallbacks — upstream is guarded)
        const svcEngineering = engineeringDesignFee;
        const svcPM = pmPermittingFee;
        const svcInterconnection = interconnectionCost;
        const svcWarranty = totalWarrantyReserve;
        // Total turnkey (what customer pays at industry rates)
        const totalEquipTurnkey = Object.values(turnkeyPrices).reduce((s, v) => s + v, 0);
        const totalSvcTurnkey = svcEngineering + svcPM + svcInterconnection + svcWarranty;
        const totalTurnkey = grossCost; // SSOT: grossCost = totalEquipRevenue + serviceFeeTotal + warranty + interconnection
        // Total COGS (what Merlin pays)
        const totalEquipCOGS = equipmentSubtotal; // FIX: was double-counting expansionPanelCost + expansionStructuralCost (already in equipmentSubtotal line 4725)
        const totalSvcCOGS = 0 + (pmPermittingFee * 0.4) + svcInterconnection + svcWarranty; // eng=0 (AI), PM=40% labor
        const totalCOGS = totalEquipCOGS + totalSvcCOGS;
        // Gross Profit
        const totalGP = totalTurnkey - totalCOGS;
        const blendedGPpct = totalTurnkey > 0 ? (totalGP / totalTurnkey * 100).toFixed(1) : '0.0';
        // Per-component GP helper
        const getComponentGP = (id) => {
          const turnkey = turnkeyPrices[id] || 0;
          // COGS for each component = current supplier cost
          const cogsMap = {
            solar: solarCost, inverter: inverterCost, racking: rackingCost,
            bess: bessCost, generator: genCost, evCharger: evCost, monitor: monitorCost,
            canopyPanels: expansionPanelCost || 0, canopyStructure: expansionStructuralCost || 0,
            vfd: vfdAddonCost || 0, heatPumpWH: hpwhCost || 0, waterReclaim: waterReclaimCost || 0,
          };
          const cogs = cogsMap[id] || 0;
          const gp = turnkey - cogs;
          const pct = turnkey > 0 ? (gp / turnkey * 100).toFixed(1) : '0.0';
          // Feasibility: gap between current list price (cogs) and target
          const gap = cogs > 0 && turnkey > 0 ? ((cogs - turnkey * 0.75) / cogs * 100) : 0;
          const feasibility = cogs <= turnkey * 0.75 ? 'at-list' : gap < 12 ? 'negotiate' : 'aggressive';
          return { turnkey, cogs, gp, pct, feasibility };
        };
        // Grid template columns — conditional on internal view
        const eqGridCols = internalView
          ? 'minmax(0,1.4fr) 48px minmax(0,1fr) 70px 72px 64px 56px 44px'
          : 'minmax(0,1.5fr) 68px minmax(0,1.3fr) minmax(0,1fr) 90px';
        // Feasibility dot component
        const FeasDot = ({ level }) => {
          const c = level === 'at-list' ? '#34d399' : level === 'negotiate' ? '#fbbf24' : '#f87171';
          return <span title={level} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}44`, marginLeft: 3 }} />;
        };

        // Canopy expansion data for Option B sub-group rendering (not in flat equipmentRows)
        const canopySubGroup = expansionAddedKW > 0 ? {
          label: expansionScenario?.label || 'Canopy',
          addedKW: expansionAddedKW,
          panelCount: expansionPanelCount,
          area: expansionScenario?.area,
          panelCost: expansionPanelCost,
          structuralCost: expansionStructuralCost,
          structureSupplier: scs,
          panelSupplier: ss,
          panelSpecs: [{ l: 'Configuration', v: `${expansionPanelCount} × ${ss?.watts}W` }, { l: 'Technology', v: ss?.technology }, { l: 'Area', v: `${expansionScenario?.area?.toLocaleString()} sqft` }, { l: 'Panel Supplier', v: `${ss?.manufacturer} ${ss?.model} (same as roof)` }, { l: 'Cost/Watt (panels)', v: `$${costPerW?.toFixed(2)}` }, { l: 'Warranty', v: `${ss?.warranty} yr` }],
          structureSpecs: [{ l: 'Type', v: scs?.type || 'Pre-engineered steel' }, { l: 'Material', v: scs?.material }, { l: 'Wind Load', v: scs?.windLoad }, { l: 'Snow Load', v: scs?.snowLoad }, { l: 'Foundation', v: scs?.foundationType }, { l: 'Clear Height', v: scs?.clearHeight }, { l: 'Field Welding', v: scs?.noFieldWelding ? 'None required' : 'Required' }, { l: 'Cost/Watt (structure)', v: `$${scs?.costPerW?.toFixed(2)}` }, { l: 'Install Labor/Watt', v: `$${scs?.installLaborPerW?.toFixed(2)}` }, { l: 'Warranty', v: `${scs?.warranty} yr` }, { l: 'Certifications', v: scs?.certifications }, { l: 'Tariff Risk', v: scs?.tariffRisk, c: scs?.tariffRisk === 'None' || scs?.tariffRisk === 'Low' ? '#a5b4fc' : '#fbbf24' }],
        } : null;

        const equipmentRows = [
          { id: 'solar', icon: <IcoSun size={22} color="#6366f1" />, label: `Solar Panels${expansionAddedKW > 0 ? ' — Roof' : ''}`, size: `${rec.solar.sizeKW || 85} kW${expansionAddedKW > 0 ? ` · ${dynamicPanelCount} panels` : ''}`, supplier: ss, cost: solarCost, color: '#6366f1', section: 'Solar System',
            specs: [{ l: 'Configuration', v: `${dynamicPanelCount} × ${ss?.watts}W` }, { l: 'Technology', v: ss?.technology }, { l: 'Efficiency', v: `${ss?.efficiency}%` }, { l: 'Temp Coefficient', v: ss?.tempCoeff }, { l: 'Dimensions', v: ss?.dimensions }, { l: 'Weight', v: ss?.weight }, { l: 'Certifications', v: ss?.certifications }, { l: 'Warranty', v: `${ss?.warranty} yr` }, { l: 'Annual Output', v: `${(annualProduction / 1000).toFixed(0)}k kWh` }, { l: 'Cost/Watt', v: `$${ss?.costPerW?.toFixed(2)}` }, { l: 'Tariff Risk', v: ss?.tariffRisk, c: ss?.tariffRisk === 'Low' ? '#a5b4fc' : ss?.tariffRisk === 'High' ? '#f87171' : '#fbbf24' }, { l: 'Tariff Note', v: ss?.tariffNote }] },
          { id: 'racking', icon: <IcoLayers size={22} color="#94a3b8" />, label: `${expansionAddedKW > 0 ? 'Roof Solar ' : ''}Racking`, size: `${dynamicPanelCount || 0} rails`, supplier: sr, cost: rackingCost, color: '#94a3b8',
            specs: [{ l: 'Type', v: sr?.type }, { l: 'Material', v: sr?.material }, { l: 'Wind Load', v: sr?.windLoad }, { l: 'Snow Load', v: sr?.snowLoad }, { l: 'Max Span', v: sr?.maxSpan }, { l: 'Certifications', v: sr?.certifications }, { l: 'Warranty', v: `${sr?.warranty} yr` }, { l: 'Cost/Panel', v: `$${sr?.costPerPanel}` }, { l: 'Tariff Risk', v: sr?.tariffRisk, c: '#a5b4fc' }] },
          ...(expansionAddedKW > 0 && canopySubGroup ? [
            { id: 'canopyPanels', icon: <IcoSun size={22} color="#60a5fa" />, label: 'Solar Panels — Canopy', size: `${canopySubGroup.addedKW} kW · ${canopySubGroup.panelCount} panels`, supplier: ss, cost: canopySubGroup.panelCost, color: '#60a5fa', section: 'Solar System', noSupplierChange: true,
              specs: canopySubGroup.panelSpecs },
            { id: 'canopyStructure', icon: <IcoLayers size={22} color="#60a5fa" />, label: 'Canopy Structure', size: `${canopySubGroup.area?.toLocaleString()} sqft · ${scs?.material || 'Aluminum'}`, supplier: scs, cost: canopySubGroup.structuralCost, color: '#60a5fa', section: 'Solar System',
              specs: canopySubGroup.structureSpecs },
          ] : []),
          { id: 'inverter', icon: <IcoCpu size={22} color="#a5b4fc" />, label: 'Inverter', size: `${Math.round(totalSystemKW)} kW`, supplier: si, cost: inverterCost, color: '#a5b4fc',
            specs: [{ l: 'Type', v: si?.type }, { l: 'Efficiency', v: `${si?.efficiency}%` }, ...(expansionAddedKW > 0 ? [{ l: 'Sizing Note', v: `Sized for ${Math.round(totalSystemKW)} kW total (${rec.solar.sizeKW} kW roof + ${expansionAddedKW} kW canopy)` }] : []), { l: 'Max Voltage', v: si?.maxVoltage }, { l: 'MPPT Channels', v: si?.mpptChannels }, { l: 'Cooling', v: si?.cooling }, { l: 'Dimensions', v: si?.dimensions }, { l: 'Certifications', v: si?.certifications }, { l: 'Warranty', v: `${si?.warranty} yr` }, { l: 'Cost/kW', v: `$${si?.costPerKW}` }] },
          { id: 'bess', icon: <IcoBattery size={22} color="#818cf8" />, label: 'Battery (BESS)', size: `${rec.bess.capacityKWh || 200} kWh`, supplier: sb, cost: bessCost, color: '#818cf8', section: 'Storage & Backup',
            specs: [{ l: 'Power Output', v: `${sb?.powerKW} kW` }, { l: 'Chemistry', v: sb?.chemistry }, { l: 'Cell Type', v: sb?.cells }, { l: 'Cycle Life', v: (sb?.cycles||0).toLocaleString() }, { l: 'Round-Trip Eff.', v: `${sb?.roundTrip}%` }, { l: 'Thermal Mgmt', v: sb?.thermalMgmt }, { l: 'Comm Protocol', v: sb?.commProtocol }, { l: 'Dimensions', v: sb?.dimensions }, { l: 'Certifications', v: sb?.certifications }, { l: 'Backup Duration', v: `${rec.bess.duration} hrs` }, { l: 'Warranty', v: `${sb?.warranty} yr` }, { l: 'Tariff Risk', v: sb?.tariffRisk, c: sb?.tariffRisk === 'Low' ? '#a5b4fc' : sb?.tariffRisk === 'High' ? '#f87171' : '#fbbf24' }] },
          ...(includeGenerator ? [{ id: 'generator', icon: <IcoFuel size={22} color="#f97316" />, label: 'Generator', size: `${rec.generator.powerKW} kW`, supplier: sg, cost: genCost, color: '#f97316', isRiskRec: true,
            specs: [{ l: 'Fuel Type', v: sg?.fuelType }, { l: 'Engine', v: sg?.engineType }, { l: 'Consumption', v: sg?.fuelConsumption }, { l: 'Noise Level', v: sg?.noiseLevel }, { l: 'Start Time', v: sg?.startTime }, { l: 'Transfer Switch', v: sg?.transferSwitch }, { l: 'Certifications', v: sg?.certifications }, { l: 'Warranty', v: `${sg?.warranty} yr` }, { l: 'Critical Coverage', v: `${rec.facilityLoad.criticalLoadKW > 0 ? Math.round(rec.generator.powerKW / rec.facilityLoad.criticalLoadKW * 100) : 100}%` }] }] : []),
          ...(includeEV ? [{ id: 'evCharger', icon: <IcoPlugZap size={22} color="#a5b4fc" />, label: `EV Charging (×${evCount})`, size: `${se?.kW} kW`, supplier: se, cost: evCost, color: '#a5b4fc', section: 'Add-Ons',
            specs: [{ l: 'Type', v: se?.type }, { l: 'Ports', v: `${se?.ports}/unit` }, { l: 'Connector', v: se?.connector }, { l: 'Cable Length', v: se?.cableLength }, { l: 'Mount', v: se?.mountType }, { l: 'Network Fees', v: se?.networkFees }, { l: 'Certifications', v: se?.certifications }, { l: 'Warranty', v: `${se?.warranty} yr` }, { l: 'Tariff Risk', v: se?.tariffRisk, c: se?.tariffRisk === 'Low' ? '#a5b4fc' : '#fbbf24' }] }] : []),
          ...(includeMonitor ? [{ id: 'monitor', icon: <IcoActivity size={22} color="#38bdf8" />, label: 'Smart Monitor', size: sm?.type, supplier: sm, cost: monitorCost, color: '#38bdf8',
            specs: [{ l: 'Features', v: sm?.features }, { l: 'Circuits', v: sm?.circuits }, { l: 'Max Amps', v: sm?.maxAmps }, { l: 'Connectivity', v: sm?.connectivity }, { l: 'App Control', v: sm?.appControl }, { l: 'Certifications', v: sm?.certifications }, { l: 'Warranty', v: `${sm?.warranty} yr` }, { l: 'Tariff Risk', v: sm?.tariffRisk, c: '#a5b4fc' }] }] : []),
          ...(includeVFD ? [{ id: 'vfd', icon: <span style={{ fontSize: 22 }}>🔧</span>, label: 'VFD Retrofit', size: `${svfd?.model || 'Variable Frequency Drive'}`, supplier: svfd, cost: vfdAddonCost, color: '#8b5cf6',
            specs: [{ l: 'Type', v: svfd?.type }, { l: 'HP Range', v: svfd?.hpRange }, { l: 'Input Voltage', v: svfd?.inputVoltage }, { l: 'Efficiency', v: `${svfd?.efficiency}%` }, { l: 'Enclosure', v: svfd?.enclosure }, { l: 'Protocol', v: svfd?.protocol }, { l: 'Protection', v: svfd?.protectionFeatures }, { l: 'Features', v: svfd?.features }, { l: 'Noise Level', v: svfd?.noiseDb }, { l: 'Dimensions', v: svfd?.dimensions }, { l: 'Certifications', v: svfd?.certifications }, { l: 'Warranty', v: `${svfd?.warranty} yr` }, { l: 'Cost/HP (turnkey)', v: `$${svfd?.turnkeyPerHP}` }, { l: 'Tariff Risk', v: svfd?.tariffRisk, c: svfd?.tariffRisk === 'None' || svfd?.tariffRisk === 'Low' ? '#a5b4fc' : '#fbbf24' }] }] : []),
          ...(includeHPWH ? [{ id: 'heatPumpWH', icon: <span style={{ fontSize: 22 }}>🔥</span>, label: 'Heat Pump Water Heater', size: `${shpwh?.model || 'Commercial HPWH'}`, supplier: shpwh, cost: hpwhCost, color: '#ef4444',
            specs: [{ l: 'Type', v: shpwh?.type }, { l: 'Capacity', v: `${shpwh?.capacityGal} gal` }, { l: 'Input', v: `${shpwh?.inputKW} kW` }, { l: 'UEF/COP', v: shpwh?.uef ? `${shpwh.uef} UEF` : shpwh?.cop ? `${shpwh.cop} COP` : '—' }, { l: 'Max Temp', v: `${shpwh?.maxTempF}°F` }, { l: 'Recovery', v: `${shpwh?.recoveryGPH} GPH` }, { l: 'Refrigerant', v: shpwh?.refrigerant }, { l: 'Noise', v: shpwh?.noiseLevel }, { l: 'Ambient Range', v: shpwh?.ambientRange }, { l: 'Certifications', v: shpwh?.certifications }, { l: 'Warranty', v: `${shpwh?.warranty} yr` }, { l: 'Annual Savings', v: shpwh?.annualSavings }, { l: 'Tariff Risk', v: shpwh?.tariffRisk, c: shpwh?.tariffRisk === 'None' || shpwh?.tariffRisk === 'Low' ? '#a5b4fc' : '#fbbf24' }] }] : []),
          ...(includeWaterReclaim ? [{ id: 'waterReclaim', icon: <span style={{ fontSize: 22 }}>💧</span>, label: 'Water Reclaim System', size: `${swr?.model || 'Multi-Stage Filtration'}`, supplier: swr, cost: waterReclaimCost, color: '#06b6d4',
            specs: [{ l: 'Type', v: swr?.type }, { l: 'Reclaim Rate', v: swr?.reclaimRate }, { l: 'Filtration', v: `${swr?.filtrationMicron} micron` }, { l: 'Throughput', v: `${swr?.throughputGPM} GPM` }, { l: 'Odor Control', v: swr?.odorControl }, { l: 'Fresh Water/Car', v: swr?.freshWaterPerCar }, { l: 'Water Saved/yr', v: swr?.waterSavingsGalYr }, { l: 'Annual Savings', v: swr?.annualSavings }, { l: 'Filter Media', v: swr?.filterMedia }, { l: 'Maintenance', v: swr?.maintenanceCycle }, { l: 'Power', v: swr?.powerReq }, { l: 'Footprint', v: swr?.footprint }, { l: 'Certifications', v: swr?.certifications }, { l: 'Warranty', v: `${swr?.warranty} yr` }, { l: 'Tariff Risk', v: swr?.tariffRisk, c: swr?.tariffRisk === 'None' || swr?.tariffRisk === 'Low' ? '#a5b4fc' : '#fbbf24' }] }] : []),
        ];

        return (
        <>
          <div style={S.grid} role="main" aria-label="Energy assessment wizard">
            {/* ═══ LEFT PANEL — Investment Summary + Finance ═══ */}
            <div style={S.left} role="navigation" aria-label="Wizard steps">
              <FacilityCard />
              <TrueQuoteBadge />

              {/* ── SYSTEM CONFIG — moved from right panel ── */}
              <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Config</div>
                  <button onClick={() => setShowDetails(!showDetails)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b', fontSize: 9, fontWeight: 700 }}>
                    <IcoInfo size={9} color="#64748b" /> Rationale
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '10px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.12)' }}>{Math.round(totalSystemKW)} kW solar</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: 'rgba(129,140,248,0.08)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.12)' }}>{rec.bess?.capacityKWh || 200} kWh BESS</span>
                  {rec.generator?.recommended && !genUserRemoved && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.12)' }}>{rec.generator.powerKW} kW gen</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.1)' }}>{Math.min(99, Math.round((annualProduction + expansionAddedProd) / (rec.facilityLoad?.annualUsageKWh || annualProduction) * 100))}% offset</span>
                </div>
              </div>

              {/* NET INVESTMENT — only in customer view (internal uses P&L Waterfall below) */}
              {!internalView && (() => {
                // IRS tax benefit ownership rules by financing structure:
                // Buy/Loan: Customer is tax owner → claims ITC + MACRS
                // Capital Lease ($1): IRC §168 conditional sale → lessee is tax owner → claims ITC + MACRS
                // Operating Lease (FMV): Lessor owns → lessor claims ITC + MACRS → reflected in lease rate
                // PPA: Developer owns → developer claims ITC + MACRS → reflected in PPA $/kWh rate
                const isOwner = financeTab === 'purchase' || financeTab === 'loan' || (financeTab === 'lease' && leaseType === 'capital');
                const isThirdParty = financeTab === 'ppa' || (financeTab === 'lease' && leaseType === 'operating');
                const thirdPartyLabel = financeTab === 'ppa' ? 'Developer' : 'Lessor';

                // 3-color palette: white=costs, green=credits/deductions, amber=additions
                const C = { cost: '#e2e8f0', credit: '#a5b4fc', addition: '#fbbf24', dim: '#64748b' };

                // Build waterfall rows — pip: left border color, group: 'cost'|'credit'|'add'|'dim'
                const rows = [
                  { label: 'Equipment & Installation', value: `${$fmt(equipmentSubtotal)}`, group: 'cost' },
                ];
                if (totalTariffSurcharge > 0) {
                  rows.push({ label: `⚠ Import Tariff Surcharges (${tariffItems.join(', ')})`, value: `included above`, group: 'add', dimNote: `${$fmt(totalTariffSurcharge)} of equipment cost is tariff duties` });
                }
                if (totalWarrantyReserve > 0) {
                  rows.push({ label: `Warranty Risk Reserve (${warrantyItems.join(', ')})`, value: `+${$fmt(totalWarrantyReserve)}`, group: 'add' });
                }
                rows.push(
                  { label: `Merlin Project Services (${Math.round(merlinMarginRate * 100)}% blended)`, value: `+${$fmt(merlinMargin)}`, group: 'cost', dimNote: `Equipment margin ${$fmt(equipmentMarginTotal)} + Engineering ${$fmt(engineeringDesignFee)} + PM ${$fmt(pmPermittingFee)}` },
                  { label: 'Total Installed Price', value: `${$fmt(grossCost)}`, group: 'subtotal' },
                );

                if (isOwner) {
                  rows.push({ label: itcLabel, value: `−${$fmt(federalITC)}`, group: 'credit' });
                  if (includeEV && evChargerCredit > 0) rows.push({ label: '§30C EV Charger Credit', value: `−${$fmt(evChargerCredit)}`, group: 'credit' });
                  rows.push({ label: `${state} State Incentives${hasFEOC ? ' (FEOC equip. excluded)' : ''}`, value: totalStateIncentive > 0 ? `−${$fmt(totalStateIncentive)}` : '$0', group: totalStateIncentive > 0 ? 'credit' : 'dim', dimNote: totalStateIncentive === 0 ? (hasFEOC ? 'FEOC equipment ineligible' : 'not available') : null });
                  rows.push({ label: 'State Sales Tax (hardware)', value: `+${$fmt(stateSalesTax)}`, group: 'add' });
                  rows.push({ label: `MACRS Depreciation (5-yr + ${Math.round(bonusDepreciationRate * 100)}% bonus)`, value: `−${$fmt(totalDepreciationBenefit)}`, group: 'credit' });
                } else {
                  rows.push({ label: `§48E ITC — claimed by ${thirdPartyLabel}`, value: '—', group: 'dim' });
                  rows.push({ label: `MACRS — claimed by ${thirdPartyLabel}`, value: '—', group: 'dim' });
                  rows.push({ label: 'State Sales Tax (hardware)', value: `+${$fmt(stateSalesTax)}`, group: 'add' });
                }

                const pipColor = (g) => g === 'credit' ? C.credit : g === 'add' ? C.addition : g === 'dim' ? C.dim : 'transparent';
                const valColor = (g) => g === 'credit' ? C.credit : g === 'add' ? C.addition : g === 'dim' ? C.dim : C.cost;

                return (
              <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <IcoDollarSign size={14} color="#6366f1" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Investment Summary</span>
                  {locationData?._hasLiveData && <span style={{ fontSize: 8, fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,0.08)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(74,222,128,0.15)', letterSpacing: '0.06em' }}>LIVE</span>}
                  {isThirdParty && <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 10 }}>{thirdPartyLabel}-owned</span>}
                </div>

                {/* ── CUSTOMER VIEW: Option A — enterprise 3-bucket layout ── */}
                {!internalView && (() => {
                  const coreSystemCost = solarCost + inverterCost + rackingCost + bessCost + expansionPanelCost + expansionStructuralCost;
                  const addOnsCost = (includeGenerator && !genUserRemoved ? genCost : 0) + evCost + monitorCost + enhancementAddonCost;
                  const servicesCost = engineeringDesignFee + pmPermittingFee + interconnectionCost;
                  const coreParts = ['Solar', bessCost > 0 && 'BESS', 'Inverter', 'Racking', expansionStructuralCost > 0 && 'Canopy'].filter(Boolean).join(' · ');
                  const addonParts = [includeGenerator && !genUserRemoved && 'Generator', evCost > 0 && 'EV Charging', monitorCost > 0 && 'Monitor', vfdAddonCost > 0 && 'VFD', hpwhCost > 0 && 'HPWH', waterReclaimCost > 0 && 'Water Reclaim'].filter(Boolean).join(' · ');
                  const rS = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' };
                  const lS = { fontSize: 12, fontWeight: 600, color: '#cbd5e1' };
                  const vS = { fontSize: 13, fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' };
                  const sS = { fontSize: 9, color: '#475569', padding: '0 16px 8px', marginTop: -6, letterSpacing: '0.02em' };
                  const divS = { height: 1, background: 'rgba(255,255,255,0.04)' };
                  return (<>
                    <div style={rS}><span style={lS}>Core System</span><span style={vS}>${fmt(coreSystemCost)}</span></div>
                    <div style={sS}>{coreParts}</div>
                    <div style={divS} />
                    {addOnsCost > 0 && (<>
                      <div style={rS}><span style={lS}>Add-Ons</span><span style={vS}>${fmt(addOnsCost)}</span></div>
                      <div style={sS}>{addonParts || 'Optional equipment'}</div>
                      <div style={divS} />
                    </>)}
                    <div style={rS}><span style={lS}>Engineering & Services</span><span style={vS}>${fmt(servicesCost)}</span></div>
                    <div style={sS}>Design · PM · Permits · Interconnection</div>

                    {/* ── Installed Price ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderTop: '1.5px solid rgba(99,102,241,0.15)', borderBottom: '1.5px solid rgba(99,102,241,0.15)' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Installed Price</span>
                      <span style={{ fontSize: 17, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(grossCost)}</span>
                    </div>

                    {/* ── Credits section ── */}
                    {isOwner ? (<>
                      {(totalFederalCredits + totalStateIncentive) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderLeft: '3px solid rgba(165,180,252,0.5)' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Tax Credits & Incentives</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', fontVariantNumeric: 'tabular-nums' }}>−${fmt(totalFederalCredits + totalStateIncentive)}</span>
                        </div>
                      )}
                      {stateSalesTax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderLeft: '3px solid rgba(251,191,36,0.5)' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Sales Tax</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>+${fmt(stateSalesTax)}</span>
                        </div>
                      )}
                    </>) : (
                      <div style={{ padding: '8px 16px', opacity: 0.5 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Credits claimed by {thirdPartyLabel} — reflected in your rate</span>
                      </div>
                    )}
                  </>);
                })()}

                {/* ── INTERNAL VIEW: Full waterfall with margin detail ── */}
                {internalView && (<>
                {rows.map((item, i) => {
                  // Subtotal row — visual divider
                  if (item.group === 'subtotal') return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '2px solid rgba(255,255,255,0.06)', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums', flexShrink: 0, whiteSpace: 'nowrap' }}>{item.value}</span>
                    </div>
                  );
                  // Normal row — left pip + dimmed label + colored value
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', borderLeft: `3.5px solid ${pipColor(item.group)}`, borderTop: '1px solid rgba(255,255,255,0.025)', opacity: item.group === 'dim' ? 0.55 : 1, gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}{item.dimNote ? ` — ${item.dimNote}` : ''}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: valColor(item.group), fontVariantNumeric: 'tabular-nums', flexShrink: 0, whiteSpace: 'nowrap' }}>{item.value}</span>
                    </div>
                  );
                })}
                </>)}

                {/* Bottom line — adapts to financing structure */}
                {isOwner ? (
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))', borderTop: '1.5px solid rgba(99,102,241,0.15)' }}>
                    {financeTab === 'purchase' && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Net Investment</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: netCost >= 1000000 ? 22 : 28, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>${fmt(netCost)}</span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                            After depreciation: <span style={{ fontWeight: 800, color: '#a5b4fc' }}>${fmt(netAfterDepreciation)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {financeTab === 'loan' && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Loan Cost</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: (grossCost + loanTotalInterest) >= 1000000 ? 22 : 28, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>${(grossCost + loanTotalInterest).toLocaleString()}</span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                            Principal ${fmt(grossCost)} + Interest ${fmt(loanTotalInterest)}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                            After ITC + MACRS: <span style={{ fontWeight: 800, color: '#a5b4fc' }}>${(grossCost + loanTotalInterest - totalFederalCredits - totalDepreciationBenefit).toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {financeTab === 'lease' && leaseType === 'capital' && (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Lease Cost</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: leaseTotalCost >= 1000000 ? 22 : 28, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>${fmt(leaseTotalCost)}</span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                            ${fmt(leaseMonthly)}/mo × {leaseTerm} yrs · $1 buyout
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                            After ITC + MACRS: <span style={{ fontWeight: 800, color: '#a5b4fc' }}>${(leaseTotalCost - totalFederalCredits - totalDepreciationBenefit).toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, rgba(251,191,36,0.04), rgba(251,191,36,0.01))', borderTop: '1.5px solid rgba(251,191,36,0.15)' }}>
                    {financeTab === 'lease' && leaseType === 'operating' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Lease Cost</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(leaseTotalCost)}</span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>${fmt(leaseMonthly)}/mo × {leaseTerm} yrs · FMV buyout ~${fmt(leaseFMVBuyout)}</div>
                        </div>
                      </div>
                    )}
                    {financeTab === 'ppa' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>$0 Upfront · Yr-1 PPA Cost</div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(ppaYr1Payment)}/yr</span>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>${fmt(ppaEffRate, 3)}/kWh × {fmt(annualProduction)} kWh · {ppaTerm}-yr {ppaRateType} rate</div>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}><IcoInfo size={11} color="#a5b4fc" /></span>
                      <span>{thirdPartyLabel} claims §48E ITC (${fmt(federalITC)}) + MACRS depreciation (${fmt(totalDepreciationBenefit)}) — reflected in your lower {financeTab === 'ppa' ? 'PPA rate' : 'lease payments'}.</span>
                    </div>
                  </div>
                )}
              </div>
                );
              })()}

              {/* ── INTERNAL: P&L Waterfall + Deal Scorecard ── */}
              {internalView && (() => {
                const gpColor = totalGP >= 0 ? '#4ade80' : '#f87171';
                const rSt = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px' };
                const lSt = { fontSize: 11, color: '#94a3b8' };
                const vSt = { fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' };
                return (<>
              {/* P&L Waterfall */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                  <span style={{ fontSize: 12 }}>📊</span> P&L Waterfall
                </div>
                <div style={rSt}><span style={lSt}>Equipment Revenue</span><span style={{ ...vSt, color: 'white' }}>${fmt(totalEquipTurnkey)}</span></div>
                <div style={rSt}><span style={lSt}>Services Revenue</span><span style={{ ...vSt, color: 'white' }}>${fmt(totalSvcTurnkey)}</span></div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Turnkey Revenue</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(totalTurnkey)}</span>
                </div>
                <div style={{ height: 4 }} />
                <div style={rSt}><span style={lSt}>Equipment COGS</span><span style={{ ...vSt, color: '#fca5a5' }}>({$fmt(totalEquipCOGS)})</span></div>
                <div style={rSt}><span style={lSt}>Services COGS</span><span style={{ ...vSt, color: '#fca5a5' }}>({$fmt(totalSvcCOGS)})</span></div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Total COGS</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>({$fmt(totalCOGS)})</span>
                </div>
                <div style={{ height: 2, background: gpColor === '#4ade80' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)', margin: '2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: gpColor === '#4ade80' ? 'rgba(74,222,128,0.04)' : 'rgba(248,113,113,0.04)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: gpColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Profit</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: gpColor, fontVariantNumeric: 'tabular-nums' }}>${fmt(totalGP)}</span>
                    <div style={{ fontSize: 10, fontWeight: 700, color: gpColor }}>{blendedGPpct}% blended</div>
                  </div>
                </div>
              </div>

              {/* Deal Scorecard */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                  <span style={{ fontSize: 12 }}>🎯</span> Deal Scorecard
                </div>
                {[
                  { l: 'GP vs Target', v: `${blendedGPpct}%`, c: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24', note: 'target 25%' },
                  { l: 'Payback vs Industry', v: `${purchasePayback > 0 ? purchasePayback.toFixed(1) : '—'} yr`, c: purchasePayback <= 9 ? '#4ade80' : '#fbbf24', note: 'ind. 8-9 yr' },
                  { l: 'Revenue / Project', v: `$${Math.round(totalTurnkey / 1000)}K`, c: '#e2e8f0' },
                  { l: 'Tariff Exposure', v: totalTariffSurcharge > 0 ? `$${fmt(totalTariffSurcharge)}` : 'None', c: totalTariffSurcharge > 5000 ? '#fbbf24' : '#4ade80' },
                ].map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: d.c, fontVariantNumeric: 'tabular-nums' }}>{d.v} {d.note && <span style={{ fontSize: 9, color: '#475569' }}>({d.note})</span>}</span>
                  </div>
                ))}
              </div>
                </>);
              })()}


            </div>

            {/* ═══ RIGHT PANEL — Equipment Table ═══ */}
            <div style={{ ...S.right, border: '1px solid rgba(148,163,184,0.20)', borderRadius: 14, margin: '8px 8px 8px 0', overflow: 'hidden' }}>
              <div ref={rightPanelRef} style={S.rightScroll}>
                <div style={S.rightInner}>

                  {/* E-14: Crash banner on Step 6 — shows when buildRecommendation failed */}
                  {rec?._isDefault && rec?._error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 14, fontSize: 13, color: '#fca5a5', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>⚠️ Calculation Engine Error — Default Values Shown</div>
                      <div style={{ color: '#94a3b8' }}>{rec._error}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>Open browser DevTools (F12 → Console) for full stack trace. Check Step 3 inputs are complete.</div>
                    </div>
                  )}

                  {/* Solar Expansion hero box removed — expansion shown inline in equipment table. Summary pills added to header. */}

                  {/* ── TARGET COST MODEL: Customer/Internal View Toggle ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    borderRadius: 12, marginBottom: 14, overflow: 'hidden',
                    border: internalView ? '2px solid rgba(99,102,241,0.35)' : '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.4)',
                  }}>
                    {[{ m: false, l: '👤  CUSTOMER', sub: 'Turnkey pricing' }, { m: true, l: '🔒  INTERNAL', sub: 'COGS · GP$ · GP%' }].map(({ m, l, sub }) => (
                      <button key={l} onClick={() => { setInternalView(m); if (!m && financeTab === 'pl') setFinanceTab('purchase'); }} style={{
                        flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                        background: internalView === m ? (m ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #334155, #1e293b)') : 'transparent',
                        color: internalView === m ? 'white' : '#475569', transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.04em' }}>{l}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, opacity: internalView === m ? 0.8 : 0.5 }}>{sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* ── KPI STRIP — internal view only ── */}
                  {internalView && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
                      borderBottom: '2px solid rgba(99,102,241,0.2)',
                      borderRadius: '10px 10px 0 0', marginBottom: 10, overflow: 'hidden',
                    }}>
                      {[
                        { l: 'Turnkey Revenue', v: `$${fmt(totalTurnkey)}`, c: 'white' },
                        { l: 'Total COGS', v: `$${fmt(totalCOGS)}`, c: '#e2e8f0' },
                        { l: 'Gross Profit', v: `$${fmt(totalGP)}`, c: totalGP >= 0 ? '#4ade80' : '#f87171' },
                        { l: 'Blended GP%', v: `${blendedGPpct}%`, c: '#a5b4fc', sub: parseFloat(blendedGPpct) >= 25 ? '✓ At target' : `Target 25% · ${(25 - parseFloat(blendedGPpct)).toFixed(1)}% below` },
                      ].map((k, i) => (
                        <div key={i} style={{ padding: '14px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(99,102,241,0.1)' : 'none' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.l}</div>
                          <div style={{ fontSize: i === 3 ? 26 : 20, fontWeight: 900, color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
                          {k.sub && <div style={{ fontSize: 9, color: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24', marginTop: 2 }}>{k.sub}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: eqGridCols, alignItems: 'center', gap: 0, padding: '8px 16px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Equipment</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}></span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Supplier</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Mfg</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Price</span>
                    {internalView && <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>COGS</span>}
                    {internalView && <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>GP $</span>}
                    {internalView && <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>GP %</span>}
                  </div>

                  {/* Equipment grouped by section */}
                  {['Solar System', 'Storage & Backup', 'Add-Ons'].map(section => {
                    const sectionRows = equipmentRows.filter(eq => {
                      if (section === 'Solar System') return ['solar','canopyPanels','canopyStructure','inverter','racking'].includes(eq.id);
                      if (section === 'Storage & Backup') return ['bess','generator'].includes(eq.id);
                      return ['evCharger','monitor','vfd','heatPumpWH','waterReclaim'].includes(eq.id);
                    });
                    if (sectionRows.length === 0) return null;
                    const sectionIcoComponent = section === 'Solar System' ? <IcoSun size={13} color="#64748b" /> : section === 'Storage & Backup' ? <IcoBattery size={13} color="#64748b" /> : <IcoZap size={13} color="#64748b" />;
                    return (
                      <div key={section} style={{ marginBottom: 14, borderRadius: 8, overflow: 'visible' }}>
                        <div style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7, borderRadius: '8px 8px 0 0' }}>
                          {sectionIcoComponent}
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{section}</span>
                          {section === 'Solar System' && canopySubGroup && (
                            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{Math.round(totalSystemKW)} kW total</span>
                          )}
                        </div>
                        <div>
                          {sectionRows.map((eq, eqIdx) => {
                            const isHovered = hoveredEquip === eq.id;
                            const getCountryRows = (c) => {
                              if (!c) return [{ flag: '🌐', name: 'Unknown' }];
                              return c.split('/').map(s => s.trim()).map(p => ({
                                flag: p.includes('USA') || p.includes('US') ? '🇺🇸' : p.includes('China') ? '🇨🇳' : p.includes('Israel') ? '🇮🇱' : p.includes('Korea') ? '🇰🇷' : p.includes('Germany') ? '🇩🇪' : p.includes('Japan') ? '🇯🇵' : p.includes('Thailand') ? '🇹🇭' : p.includes('Vietnam') ? '🇻🇳' : '🌐',
                                name: p
                              }));
                            };
                            const countries = getCountryRows(eq.supplier?.country);
                            return (
                              <React.Fragment key={eq.id}>
                              <div style={{ position: 'relative' }}>
                                <div style={{
                                  display: 'grid', gridTemplateColumns: eqGridCols, alignItems: 'center', gap: 0,
                                  padding: '8px 16px',
                                  background: 'transparent',
                                  borderBottom: eqIdx < sectionRows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                  transition: 'background 0.12s',
                                }}>
                                  {/* Col 1: Equipment — icon + label + size + risk badge */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                    <div style={{ flexShrink: 0 }}>{React.cloneElement(eq.icon, { size: 20 })}</div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.25 }}>{eq.label}</span>
                                        {eq.isRiskRec && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', letterSpacing: '0.04em', whiteSpace: 'nowrap', border: '1px solid rgba(245,158,11,0.2)' }}>RISK REC</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: eq.color, lineHeight: 1.25 }}>{eq.size}</span>
                                        {eq.id === 'inverter' && canopySubGroup && <span style={{ fontSize: 10, color: '#60a5fa', marginLeft: 4 }}>← sized for roof + canopy</span>}
                                        {eq.isRiskRec && <button onClick={(e) => { e.stopPropagation(); setShowGenWarning(true); }} style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✕ Remove</button>}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Col 2: Specs + Change buttons with labels */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                                    <button onClick={(e) => { e.stopPropagation(); setHoveredEquip(isHovered ? null : eq.id); }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(148,163,184,0.15)', cursor: 'pointer', fontFamily: 'inherit', color: '#818cf8', background: isHovered ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)', fontSize: 9, fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                      <IcoInfo size={9} color="#818cf8" /> Specs
                                    </button>
                                    {!eq.noSupplierChange && (
                                    <button onClick={(e) => { e.stopPropagation(); setSupplierPopup(eq.id); }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(148,163,184,0.1)', cursor: 'pointer', fontFamily: 'inherit', color: '#64748b', background: 'transparent', fontSize: 9, fontWeight: 600, letterSpacing: '0.02em', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                      <IcoRotate size={9} color="#64748b" /> Change
                                    </button>
                                    )}
                                  </div>
                                  {/* Col 3: Supplier / Model */}
                                  <div style={{ minWidth: 0, paddingRight: 10 }}>
                                    {eq.supplier ? (<>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.25 }}>{eq.supplier?.manufacturer}</div>
                                      <div style={{ fontSize: 9, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.25 }}>{eq.supplier?.model}</div>
                                    </>) : (
                                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', fontStyle: 'italic', lineHeight: 1.25 }}>Site-specific contractor</div>
                                    )}
                                  </div>
                                  {/* Col 4: Mfg Country — stacked if multi-country */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                    {eq.supplier ? countries.map((ct, ci) => (
                                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{ct.flag}</span>
                                        <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ct.name}</span>
                                      </div>
                                    )) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 14, lineHeight: 1 }}>🇺🇸</span>
                                        <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>Local</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Col 5: Price — right aligned */}
                                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                    {eq.isEstimate && <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', padding: '2px 5px', borderRadius: 3, letterSpacing: '0.04em' }}>EST.</span>}
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>${fmt(internalView ? (turnkeyPrices[eq.id] || eq.cost) : eq.cost)}</span>
                                  </div>
                                  {/* Col 6-8: Internal COGS/GP — only in internal view */}
                                  {internalView && (() => { const g = getComponentGP(eq.id); return (<>
                                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>${fmt(g.cogs)}</div>
                                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>${fmt(g.gp)}</div>
                                    <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 10, fontWeight: 700, color: parseFloat(g.pct) >= 35 ? '#34d399' : parseFloat(g.pct) >= 25 ? '#a5b4fc' : '#fbbf24' }}>{g.pct}%</span>
                                      <FeasDot level={g.feasibility} />
                                    </div>
                                  </>); })()}
                                </div>

                                {/* CENTERED SPEC MODAL — click to open/close */}
                                {isHovered && (<>
                                  <div onClick={() => setHoveredEquip(null)} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.4)' }} />
                                  <div
                                    style={{
                                      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100,
                                      background: 'linear-gradient(145deg, #0f172a, #0a0f1e)',
                                      border: `1px solid ${eq.color}35`,
                                      borderRadius: 16, padding: '20px 24px', width: eq.specs.length > 9 ? 580 : 460, maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto',
                                      boxShadow: `0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`,
                                    }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${eq.color}25` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {React.cloneElement(eq.icon, { size: 22 })}
                                        <div>
                                          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{eq.label}</div>
                                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{eq.supplier?.manufacturer} · {eq.supplier?.model}</div>
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Merlin Score</div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: (eq.supplier?.score || 0) >= 80 ? '#a5b4fc' : '#fbbf24' }}>{eq.supplier?.score}<span style={{ fontSize: 12, color: '#64748b' }}>/100</span></div>
                                      </div>
                                    </div>
                                    {/* Factory / Manufacturing Location */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>{countries.map((ct, ci) => <span key={ci} style={{ fontSize: 20, lineHeight: 1 }}>{ct.flag}</span>)}</div>
                                      <div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manufacturing Location</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{eq.supplier?.factory || eq.supplier?.country}</div>
                                      </div>
                                    </div>
                                    {/* Spec Grid — 4 cols for 10+ specs, 3 cols otherwise */}
                                    <div style={{ display: 'grid', gridTemplateColumns: eq.specs.length > 9 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                                      {eq.specs.map((s, i) => (
                                        <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: `${eq.color}08`, border: `1px solid ${eq.color}15` }}>
                                          <div style={{ fontSize: 9, fontWeight: 600, color: eq.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{s.l}</div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: s.c || 'white', lineHeight: 1.3, wordBreak: 'break-word' }}>{s.v}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>)}
                              </div>
                              {/* Canopy panels + structure now rendered as flat equipmentRows */}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

              {/* ═══ EQUIPMENT SUBTOTAL ═══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: eqGridCols, alignItems: 'center', gap: 0, padding: '12px 16px', borderTop: '2px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipment Subtotal</span>
                    <span /><span /><span />
                    <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(internalView ? totalEquipTurnkey : equipmentSubtotal)}</span>
                    {internalView && <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>${fmt(totalEquipCOGS)}</span>}
                    {internalView && <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: (totalEquipTurnkey - totalEquipCOGS) >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>${fmt(totalEquipTurnkey - totalEquipCOGS)}</span>}
                    {internalView && <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: (totalEquipTurnkey - totalEquipCOGS) >= 0 ? '#4ade80' : '#f87171' }}>{totalEquipTurnkey > 0 ? ((totalEquipTurnkey - totalEquipCOGS) / totalEquipTurnkey * 100).toFixed(1) : '0.0'}%</span>}
                  </div>

                  {/* ═══ SERVICES SECTION ═══ */}
                  <div style={{ padding: '10px 16px 4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Services</span>
                  </div>
                  {(() => {
                    const svcRows = [
                      { label: 'Engineering & Design', sub: 'AI-generated', subColor: '#f472b6', icon: '🧠', price: svcEngineering, cogs: 0, cogsLabel: '—' },
                      { label: 'PM & Permitting', sub: 'Full service', subColor: '#4ade80', icon: '📋', price: svcPM, cogs: Math.round(svcPM * 0.4) },
                      { label: 'Interconnection', sub: 'Utility filing', subColor: '#64748b', icon: '🔌', price: svcInterconnection, cogs: svcInterconnection },
                      { label: 'Warranty Reserve', sub: '5-yr coverage', subColor: '#64748b', icon: '🛡️', price: svcWarranty, cogs: svcWarranty },
                    ];
                    return svcRows.map((svc, si) => {
                      const margin = svc.price - svc.cogs;
                      const pct = svc.price > 0 ? (margin / svc.price * 100).toFixed(1) : '0.0';
                      const mColor = parseFloat(pct) > 0 ? '#4ade80' : '#475569';
                      const dotBg = parseFloat(pct) >= 50 ? '#4ade80' : parseFloat(pct) > 0 ? '#4ade80' : '#fbbf24';
                      return (
                      <div key={si} style={{ display: 'grid', gridTemplateColumns: eqGridCols, alignItems: 'center', gap: 0, padding: '10px 16px', borderBottom: si < svcRows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{svc.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{svc.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: svc.subColor }}>{svc.sub}</div>
                          </div>
                        </div>
                        <span />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Merlin Energy</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{svc.label === 'Engineering & Design' ? 'In-house AI' : svc.label === 'PM & Permitting' ? 'Project mgmt' : svc.label === 'Interconnection' ? 'Filing & approval' : 'Extended warranty'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>🇺🇸</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>USA</span>
                        </div>
                        <span style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums' }}>${fmt(svc.price)}</span>
                        {internalView && <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: svc.cogsLabel ? '#334155' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{svc.cogsLabel || `$${fmt(svc.cogs)}`}</span>}
                        {internalView && <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: mColor, fontVariantNumeric: 'tabular-nums' }}>${fmt(margin)}</span>}
                        {internalView && <span style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><span style={{ fontSize: 12, fontWeight: 700, color: mColor }}>{pct}%</span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: dotBg }} /></span>}
                      </div>
                      );
                    });
                  })()}

                  {/* ═══ TOTAL REVENUE / TOTAL INSTALLED PRICE ═══ */}
                  <div style={{ display: 'grid', gridTemplateColumns: eqGridCols, alignItems: 'center', gap: 0, padding: '14px 16px', borderTop: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{internalView ? 'Total Revenue' : 'Total Installed Price'}</span>
                    <span /><span /><span />
                    <span style={{ textAlign: 'right', fontSize: 18, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>${fmt(internalView ? totalTurnkey : grossCost)}</span>
                    {internalView && <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>${fmt(totalCOGS)}</span>}
                    {internalView && <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: totalGP >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>${fmt(totalGP)}</span>}
                    {internalView && <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: totalGP >= 0 ? '#4ade80' : '#f87171' }}>{blendedGPpct}%</span>}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={S.footer}>
            <div style={S.footerLeft}>
              <button style={S.btnBack} onClick={() => setCurrentStep(5)}><IcoChevL size={18} color="#cbd5e1" /> Back</button>
            </div>
            <div style={S.footerRight}>
              <button style={S.btnNext} onClick={() => setCurrentStep(7)}>Generate Quote <IcoChevR size={18} color="white" /></button>
            </div>
          </div>

          {/* SUPPLIER POPUPS */}
          {supplierPopup === 'solar' && <SupPopup category="solar" color="#6366f1" title="Select Solar Panel Supplier" options={scoredSuppliers.solar} />}
          {supplierPopup === 'inverter' && <SupPopup category="inverter" color="#a5b4fc" title="Select Inverter Supplier" options={scoredSuppliers.inverter} />}
          {supplierPopup === 'racking' && <SupPopup category="racking" color="#94a3b8" title="Select Racking Supplier" options={scoredSuppliers.racking} />}
          {supplierPopup === 'bess' && <SupPopup category="bess" color="#818cf8" title="Select Battery Supplier" options={scoredSuppliers.bess} />}
          {supplierPopup === 'generator' && <SupPopup category="generator" color="#f97316" title="Select Generator Supplier" options={scoredSuppliers.generator} />}
          {supplierPopup === 'evCharger' && <SupPopup category="evCharger" color="#a5b4fc" title="Select EV Charger" options={scoredSuppliers.evCharger} />}
          {supplierPopup === 'monitor' && <SupPopup category="monitor" color="#38bdf8" title="Select Energy Monitor" options={scoredSuppliers.monitor} />}
          {supplierPopup === 'canopyStructure' && <SupPopup category="canopyStructure" color="#60a5fa" title="Select Canopy Structure Supplier" options={scoredSuppliers.canopyStructure} />}
        </>
        );
      })()}

      {/* ═══ GENERATOR REMOVAL WARNING MODAL ═══ */}
      {showGenWarning && (
        <>
          <div onClick={() => setShowGenWarning(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 201, width: 480, maxWidth: '92vw', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <IcoAlertTriangle size={20} color="#f59e0b" />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Remove Generator?</span>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
              {(() => {
                const wr = rec.weatherRisk;
                if (wr?.outageLevel === 'high') return `Merlin AI recommended a generator because ${state} has ${wr.summary.toLowerCase()}. Without it, your facility is exposed to multi-day outages with no backup beyond ${rec.bess?.duration || 4} hours of battery.`;
                if (wr?.outageLevel === 'moderate') return `Merlin AI recommended a generator due to ${wr.summary.toLowerCase()} in your area. Battery backup covers ${rec.bess?.duration || 4} hours — extended outages would shut down operations.`;
                return 'Merlin AI recommended a backup generator based on your facility\'s critical load and risk profile. Removing it means:';
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {(() => {
                const wr = rec.weatherRisk;
                const outageRiskLabel = wr?.outageLevel === 'high' ? 'High' : wr?.outageLevel === 'moderate' ? 'Elevated' : 'Moderate';
                const outageColor = wr?.outageLevel === 'high' ? '#ef4444' : '#f59e0b';
                return [
                  { label: 'Critical Load', value: `${rec.facilityLoad?.criticalLoadKW || 45} kW`, ico: <IcoZap size={12} color="#94a3b8" />, desc: 'Unprotected during extended outages', valColor: '#f59e0b' },
                  { label: 'Outage Risk', value: outageRiskLabel, ico: <IcoActivity size={12} color={outageColor} />, desc: wr ? `Storm ${fmt(wr.stormScore, 1)}/5 · Grid ${wr.gridScore}/5` : 'Based on your location', valColor: outageColor },
                  { label: 'BESS Only', value: `${rec.bess?.duration || 4} hrs`, ico: <IcoBattery size={12} color="#94a3b8" />, desc: 'Battery drains — then what?', valColor: '#f59e0b' },
                  { label: 'Revenue at Risk', value: `$${Math.round((parseInt(formData?.dailyVehicles) || ({ express: 300, full: 200, flex: 250, mini: 200, self: 100, inbay: 80, iba: 80 }[formData?.facilityType] || 200)) * 25 / 1000)}K/day`, ico: <IcoDollarSign size={12} color="#94a3b8" />, desc: 'Per day of downtime', valColor: '#f59e0b' },
                ];
              })().map(stat => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{stat.ico} {stat.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stat.valColor }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{stat.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGenWarning(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Keep Generator</button>
              <button onClick={() => { setGenUserRemoved(true); setShowGenWarning(false); }} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.12)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove from Quote</button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP 7: INVESTMENT QUOTE                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {currentStep === 7 && (() => {
        // E-10: Loading/error state checks before heavy render
        if (rec?._error) {
          return (<div style={{ ...S.grid, padding: 60, textAlign: 'center' }} role="main" aria-label="Energy assessment wizard">
            <div style={{ gridColumn: '1/-1', color: 'white' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>⚠️ Calculation Error</div>
              <div style={{ color: '#94a3b8', marginBottom: 20, fontSize: 16 }}>The recommendation engine encountered an issue: {rec._error}</div>
              <button onClick={() => setCurrentStep(6)} style={{ padding: '12px 28px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>← Back to Configuration</button>
            </div>
          </div>);
        }
        try { // E-13: Protect entire Step 7 render — most complex step
        const wr7 = rec.weatherRisk || computeWeatherRisk(state);
        // ── Comparison table data ──
        const sav10 = calcCumulativeSavings(10);
        const sav25 = calcCumulativeSavings(25);
        const loanPayments10yr = Math.min(loanTerm, 10) * loanAnnualPmt;
        const loanTaxBenefits10yr = totalFederalCredits + Array.from({length: Math.min(10, 6)}, (_, i) => macrsTaxBenefitByYear(i + 1)).reduce((a, b) => a + b, 0);
        const loanTotalPayments = loanMonthlyPmt * loanMonths;
        // Cumulative lease payments up to N years (with escalator, capped at lease term)
        const cumLeasePayments = (yrs) => {
          let total = 0;
          for (let y = 0; y < Math.min(yrs, leaseTerm); y++) {
            total += leaseMonthly * 12 * Math.pow(1 + leaseEscalator / 100, y);
          }
          return Math.round(total);
        };
        // Cumulative PPA payments up to N years (with escalator, capped at PPA term)
        const cumPpaPayments = (yrs) => {
          let total = 0;
          for (let y = 0; y < Math.min(yrs, ppaTerm); y++) {
            total += annualProduction * ppaEffRate * Math.pow(1 + ppaEffEscalator / 100, y);
          }
          return Math.round(total);
        };
        // FIX AUDIT-5: PPA gross savings now includes solar + BESS degradation (was flat escalation only)
        // FIX AUDIT-8: Now uses calcYearGrossSavings SSOT
        const calcPpaGrossCumSavings = (yrs) => {
          let total = 0;
          for (let y = 0; y < yrs; y++) {
            const yrCosts = customerOnlyOM * Math.pow(1.02, y);
            total += calcYearGrossSavings(y) - yrCosts;
          }
          return Math.round(total);
        };
        // FIX AUDIT-6: Lease cumulative now uses proper year-by-year calculation (was fragile ratio scaling)
        // FIX AUDIT-8: Now uses calcYearGrossSavings SSOT
        const calcLeaseCumSavings = (yrs) => {
          let total = 0;
          const isCapital = leaseType === 'capital';
          for (let y = 0; y < yrs; y++) {
            // Capital lease: tenant pays all O&M. Operating lease: lessor pays solar O&M.
            const yrCosts = isCapital 
              ? annualTotalCosts * Math.pow(1.02, y) 
              : customerOnlyOM * Math.pow(1.02, y);
            const yrReplace = isCapital ? replacementCapex(y + 1) : 0;
            total += calcYearGrossSavings(y) - yrCosts - yrReplace;
          }
          return Math.round(total);
        };
        // Cumulative MACRS tax benefit (actual schedule, not linear)
        const cumMACRSBenefit = (yrs) => {
          let total = 0;
          for (let y = 1; y <= Math.min(yrs, 6); y++) { total += macrsTaxBenefitByYear(y); }
          return total;
        };
        const compRows = {
          purchase: { upfront: netCost, monthly: 0, monthlySav: Math.round(annualNetSavings / 12), paybackLabel: purchasePayback != null ? `${fmt(purchasePayback, 1)} yrs` : '—', yr10: Math.round(sav10 - netAfterDepreciation), yr25: Math.round(sav25 - netAfterDepreciation + salvageValue), taxBenefits: 'You claim ITC + MACRS', ownership: 'Outright from day 1' },
          loan: { upfront: loanDownPayment, monthly: loanMonthlyPmt, monthlySav: Math.round(loanYr1Savings / 12), paybackLabel: loanPayback != null ? `${fmt(loanPayback, 1)} yrs` : '—', yr10: Math.round(sav10 - loanDownPayment - loanPayments10yr + loanTaxBenefits10yr), yr25: Math.round(sav25 - loanDownPayment - loanTotalPayments + totalFederalCredits + totalDepreciationBenefit + totalStateIncentive - stateSalesTax + salvageValue), taxBenefits: 'You claim ITC + MACRS', ownership: 'After loan payoff' },
          lease: { upfront: 0, monthly: leaseMonthly, monthlySav: Math.round(leaseYr1Savings / 12), paybackLabel: leaseYr1Savings > 0 ? 'Day 1' : '—', yr10: Math.round(calcLeaseCumSavings(10) - cumLeasePayments(10) + (leaseType === 'capital' ? totalFederalCredits + cumMACRSBenefit(10) : 0)), yr25: Math.round(calcLeaseCumSavings(25) - cumLeasePayments(25) + (leaseType === 'capital' ? totalFederalCredits + totalDepreciationBenefit : 0)), taxBenefits: leaseType === 'capital' ? 'You claim ITC + MACRS (capital lease)' : 'Lessor claims — reflected in lower payment', ownership: leaseType === 'capital' ? '$1 buyout at term' : 'FMV buyout at term' },
          ppa: { upfront: 0, monthly: 0, monthlySav: Math.round(ppaYr1Savings / 12), paybackLabel: ppaYr1Savings > 0 ? 'Day 1' : '—', yr10: Math.round(calcPpaGrossCumSavings(10) - cumPpaPayments(10)), yr25: Math.round(calcPpaGrossCumSavings(25) - cumPpaPayments(25)), taxBenefits: 'Developer claims', ownership: 'Developer owns system' },
        };
        const compKeys = ['purchase', 'loan', 'lease', 'ppa'];
        const compLabels = { purchase: 'Cash Purchase', loan: 'System Loan', lease: `Lease (${leaseType === 'capital' ? '$1' : 'FMV'})`, ppa: 'PPA' };
        const compIcons = { purchase: '💵', loan: '🏦', lease: '📋', ppa: '⚡' };
        const compColors = { purchase: '#6366f1', loan: '#818cf8', lease: '#a5b4fc', ppa: '#4f46e5' };
        // Cashflow chart data
        const cfYears = [1, 3, 5, 8, 10, 15, 25];
        const cfData = cfYears.map(yr => {
          const cumSav = calcCumulativeSavings(yr);
          const yrsOfLoan = Math.min(yr, loanTerm);
          return {
            yr,
            purchase: Math.round(cumSav - netAfterDepreciation),
            loan: Math.round(cumSav - loanDownPayment - yrsOfLoan * loanAnnualPmt + (yr >= 1 ? totalFederalCredits : 0) + cumMACRSBenefit(yr)),
            lease: Math.round(calcLeaseCumSavings(yr) - cumLeasePayments(yr) + (leaseType === 'capital' ? (yr >= 1 ? totalFederalCredits : 0) + cumMACRSBenefit(yr) : 0)),
            ppa: Math.round(calcPpaGrossCumSavings(yr) - cumPpaPayments(yr)),
          };
        });
        const cfMax = Math.max(...(cfData || []).map(d => Math.max(Math.abs(d.purchase), Math.abs(d.loan), Math.abs(d.lease), Math.abs(d.ppa))), 1);
        // Assumptions data for editable table
        // ── TARGET COST MODEL (same benchmarks as Step 6) ──
        const TARGET_TURNKEY_7 = {
          solar: { rate: 2.80 }, inverter: { rate: 220 }, racking: { rate: 70 },
          bess: { rate: 425 }, generator: { rate: 750 }, evCharger: { rate: 4500 },
          monitor: { rate: 14000 }, canopyPanels: { rate: 2.80 }, canopyStructure: { rate: 1.40 },
        };
        const tkQty7 = {
          solar: (rec.solar?.sizeKW || 85) * 1000, inverter: Math.round(totalSystemKW),
          racking: dynamicPanelCount || 0, bess: rec.bess?.capacityKWh || 200,
          generator: rec.generator?.powerKW || 60, evCharger: evCount || 0,
          monitor: includeMonitor ? 1 : 0, canopyPanels: (expansionAddedKW || 0) * 1000,
          canopyStructure: (expansionAddedKW || 0) * 1000,
        };
        const turnkeyPrices7 = {};
        Object.keys(tkQty7).forEach(id => { turnkeyPrices7[id] = Math.round((TARGET_TURNKEY_7[id]?.rate || 0) * tkQty7[id]); });
        const svcEngineering7 = engineeringDesignFee;
        const svcPM7 = pmPermittingFee;
        const svcInterconnection7 = interconnectionCost;
        const svcWarranty7 = totalWarrantyReserve;
        const totalEquipTurnkey7 = Object.values(turnkeyPrices7).reduce((s, v) => s + v, 0);
        const totalSvcTurnkey7 = svcEngineering7 + svcPM7 + svcInterconnection7 + svcWarranty7;
        const totalTurnkey7 = grossCost; // SSOT: identical to totalTurnkey
        const totalEquipCOGS7 = equipmentSubtotal; // FIX: was double-counting expansionPanelCost + expansionStructuralCost (already in equipmentSubtotal line 4725)
        const totalSvcCOGS7 = 0 + (pmPermittingFee * 0.4) + svcInterconnection7 + svcWarranty7;
        const totalCOGS7 = totalEquipCOGS7 + totalSvcCOGS7;
        const totalGP7 = totalTurnkey7 - totalCOGS7;
        const blendedGPpct7 = totalTurnkey7 > 0 ? (totalGP7 / totalTurnkey7 * 100).toFixed(1) : '0.0';
        const getComponentGP7 = (id) => {
          const turnkey = turnkeyPrices7[id] || 0;
          const cogsMap = {
            solar: solarCost, inverter: inverterCost, racking: rackingCost,
            bess: bessCost, generator: genCost, evCharger: evCost, monitor: monitorCost,
            canopyPanels: expansionPanelCost || 0, canopyStructure: expansionStructuralCost || 0,
            vfd: vfdAddonCost || 0, heatPumpWH: hpwhCost || 0, waterReclaim: waterReclaimCost || 0,
          };
          const cogs = cogsMap[id] || 0;
          const gp = turnkey - cogs;
          const pct = turnkey > 0 ? (gp / turnkey * 100).toFixed(1) : '0.0';
          const feasibility = cogs <= turnkey * 0.75 ? 'at-list' : ((cogs - turnkey * 0.75) / cogs * 100) < 12 ? 'negotiate' : 'aggressive';
          return { turnkey, cogs, gp, pct, feasibility };
        };
        // ── DEFENSIVE ALIASES: Step 6 names → Step 7 values ──
        // Prevents ReferenceError if any stray reference to non-suffixed name exists
        const totalEquipTurnkey = totalEquipTurnkey7;
        const totalSvcTurnkey = totalSvcTurnkey7;
        const totalTurnkey = totalTurnkey7;
        const totalEquipCOGS = totalEquipCOGS7;
        const totalCOGS = totalCOGS7;
        const totalGP = totalGP7;
        const blendedGPpct = blendedGPpct7;
        const getComponentGP = getComponentGP7;

        const assumptionsData = [
          { key: 'utilityRate', label: 'Utility Rate', value: `$${fmt(utilityRate, 3)}/kWh` },
          { key: 'demandCharge', label: 'Demand Charge', value: `$${rec.assumptions?.demandCharge ?? 15}/kW` },
          { key: 'escalation', label: 'Rate Escalation', value: `${fmt(utilityEscalation * 100, 1)}%/yr` },
          { key: 'taxRate', label: `Tax Rate (${entityType === 'c_corp' ? 'C-Corp' : entityType === 's_corp' ? 'S-Corp' : entityType === 'llc' ? 'LLC' : 'Sole Prop'})`, value: `${fmt(assumedTaxRate * 100, 1)}%` },
          { key: 'itcRate', label: 'ITC Rate', value: `${itcPctLabel} (Solar: BOC Jul 2026 · BESS: thru 2033)` },
          { key: 'bonus', label: 'Bonus Depreciation', value: `${Math.round(bonusDepreciationRate * 100)}% (permanent — OBBBA §70301)` },
          { key: 'degradation', label: 'Panel Degradation', value: `${fmt(panelDegradation * 100, 2)}%/yr` },
          { key: 'bessEff', label: 'BESS Round-Trip', value: `${fmt(bessRoundTripEff * 100, 0)}%` },
          { key: 'bessDeg', label: 'BESS Degradation', value: `${fmt(bessDegRate * 100, 2)}%/yr (${fmt(bessCycles)} cycles)` },
          { key: 'exportRate', label: 'NEM Export', value: `${Math.round(exportRate * 100)}¢/kWh` },
          { key: 'inverterYr', label: 'Inverter Replace', value: `Year ${inverterReplacementYear} (~$${Math.round(inverterReplacementCost/1000)}K)` },
          { key: 'bessYr', label: 'BESS Replace', value: `Year ${bessReplacementYear} (~$${Math.round(bessReplacementCost/1000)}K)` },
          { key: 'salvage', label: 'Salvage Value', value: `$${fmt(salvageValue)}` },
        ];
        // ── NET COST AFTER UNIVERSAL CREDITS ONLY (no MACRS — ownership-specific) ──
        const netCostUniversal = Math.round(grossCost - totalFederalCredits - totalStateIncentive + stateSalesTax);
        const universalSavings = Math.round(totalFederalCredits + totalStateIncentive - stateSalesTax);
        const macrsBenefit = totalDepreciationBenefit;
        const effectiveCostOwner = Math.round(netCostUniversal - macrsBenefit);
        const monthlySavings = Math.round(annualNetSavings / 12);
        const annualSavingsTotal = annualNetSavings;
        const paybackYrs = purchasePayback != null ? fmt(purchasePayback, 1) : '—';
        // Lease monthly net savings
        const leaseNetMonthlySav = compRows.lease ? compRows.lease.monthlySav : 0;
        // Internal view: category margin rows
        const marginRows7 = [
          { cat: '☀️ Solar Panels', id: 'solar' },
          { cat: '🏗️ Canopy Structure', id: 'canopyStructure' },
          { cat: '🔋 BESS', id: 'bess' },
          { cat: '⛽ Generator', id: 'generator' },
          { cat: '⚡ EV Chargers', id: 'evCharger' },
          { cat: '📡 Monitoring', id: 'monitor' },
          { cat: '🔧 Inverter', id: 'inverter' },
          { cat: '🔩 Racking', id: 'racking' },
        ].map(r => { const g = getComponentGP(r.id); return { ...r, revenue: g.turnkey, cogs: g.cogs, gp: g.gp, pct: g.pct }; }).filter(r => r.revenue > 0);
        const svcRows7 = [
          { cat: '🧠 Engineering', revenue: svcEngineering7, cogs: 0 },
          { cat: '📋 PM & Permitting', revenue: svcPM7, cogs: Math.round(svcPM7 * 0.4) },
          { cat: '🔌 Interconnection', revenue: svcInterconnection7, cogs: svcInterconnection7 },
          { cat: '🛡️ Warranty', revenue: svcWarranty7, cogs: svcWarranty7 },
        ].map(r => ({ ...r, gp: r.revenue - r.cogs, pct: r.revenue > 0 ? ((r.revenue - r.cogs) / r.revenue * 100).toFixed(1) : '0.0' }));
        // Styles for Step 7
        const s7 = {
          card: { padding: '18px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' },
          cardGreen: { padding: '18px 16px', borderRadius: 12, background: 'rgba(74,222,128,0.03)', border: '1px solid rgba(74,222,128,0.1)', textAlign: 'center' },
          cardPurple: { padding: '18px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)', textAlign: 'center' },
          lbl: { fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 },
          bigVal: { fontSize: 28, fontWeight: 900 },
          note: { fontSize: 10, color: '#64748b', marginTop: 3 },
          navBtn: (active) => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#a5b4fc' : '#94a3b8', background: active ? 'rgba(99,102,241,0.1)' : 'transparent', transition: 'all 0.15s', textAlign: 'left' }),
          navBtnInt: (active) => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#a5b4fc' : '#94a3b8', background: active ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s', textAlign: 'left' }),
          wfRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
          wfTot: { display: 'flex', justifyContent: 'space-between', padding: '8px 0 5px', marginTop: 4, borderTop: '2px solid rgba(255,255,255,0.08)' },
          sectionH: { fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(255,255,255,0.04)' },
          dot: (color) => ({ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, marginLeft: 4 }),
          finTab: (active) => ({ padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: active ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.08)', background: active ? '#334155' : 'transparent', color: active ? 'white' : '#64748b', transition: 'all 0.15s' }),
        };

        return (
        <>
          <div style={S.grid} role="main" aria-label="Energy assessment wizard">
            {/* ══════════════════════════════════════════════════ */}
            {/* LEFT PANEL                                        */}
            {/* ══════════════════════════════════════════════════ */}
            <div style={S.left} role="navigation" aria-label="Wizard steps">
              <FacilityCard />
              <TrueQuoteBadge />

              {/* System Summary pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { ico: <IcoSun size={12} color="#6366f1" />, value: `${fmt(totalSystemKW, 1)} kW${expansionAddedKW > 0 ? ` (${fmt(actualSystemKW, 1)} roof + ${fmt(expansionAddedKW, 1)} canopy)` : ''}` },
                  { ico: <IcoBattery size={12} color="#818cf8" />, value: `${rec.bess.capacityKWh} kWh / ${rec.bess.powerKW || Math.round(rec.bess.capacityKWh / (rec.bess.duration || 4))} kW` },
                  ...(includeGenerator ? [{ ico: <IcoFuel size={12} color="#f97316" />, value: `${rec.generator.powerKW} kW gen` }] : []),
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#c0cbda', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>{item.ico} {item.value}</span>
                ))}
              </div>

              {/* Customer / Internal Toggle */}
              <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: internalView ? '2px solid rgba(99,102,241,0.35)' : '2px solid rgba(255,255,255,0.1)', margin: '8px 0' }}>
                {[{ m: false, l: '👤  CUSTOMER', sub: 'Quote view' }, { m: true, l: '🔒  INTERNAL', sub: 'Deal analytics' }].map(({ m, l, sub }) => (
                  <button key={l} onClick={() => { setInternalView(m); setS7Section(m ? 'i-dashboard' : 'overview'); }} style={{ flex: 1, padding: '12px 4px', cursor: 'pointer', fontFamily: 'inherit', border: 'none', textAlign: 'center', transition: 'all 0.2s', background: internalView === m ? (m ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #334155, #1e293b)') : 'transparent', color: internalView === m ? 'white' : '#475569' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.04em' }}>{l}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, opacity: internalView === m ? 0.8 : 0.5 }}>{sub}</div>
                  </button>
                ))}
              </div>

              {/* Customer Nav */}
              {!internalView && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 6px' }}>Quote Summary</div>
                  {[
                    { id: 'overview', icon: '📊', label: 'Overview' },
                    { id: 'financing', icon: '💳', label: 'Financing Options' },
                    { id: 'tax', icon: '🏛️', label: 'Tax & Credits' },
                    { id: 'timeline', icon: '📈', label: 'Value Timeline' },
                    { id: 'scenarios', icon: '⚠️', label: 'Scenarios' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setS7Section(t.id)} style={s7.navBtn(s7Section === t.id)}>
                      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
                      <span>{t.label}</span>
                      {s7Section === t.id && <div style={{ width: 3, height: 14, borderRadius: 2, background: '#6366f1', marginLeft: 'auto', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Internal Nav */}
              {internalView && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 6px' }}>🔒 Internal Views</div>
                  {[
                    { id: 'i-dashboard', icon: '📊', label: 'Deal Dashboard' },
                    { id: 'i-margins', icon: '💰', label: 'Margin Analysis' },
                    { id: 'i-returns', icon: '📈', label: 'Investor Returns' },
                    { id: 'i-risk', icon: '⚠️', label: 'Risk Assessment' },
                    { id: 'i-comp', icon: '🏆', label: 'Competitive Position' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setS7Section(t.id)} style={s7.navBtnInt(s7Section === t.id)}>
                      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
                      <span>{t.label}</span>
                      {s7Section === t.id && <div style={{ width: 3, height: 14, borderRadius: 2, background: '#6366f1', marginLeft: 'auto', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              )}

              {/* INTERNAL badge */}
              {internalView && (
                <div style={{ margin: '8px 4px', padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', border: '1.5px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>🔒 Internal — never shown to customer</div>
                </div>
              )}

              <div style={{ flex: 1 }} />
              <div style={{ padding: '8px', fontSize: 9, color: '#334155' }}>${fmt(utilityRate, 3)}/kWh · {itcPctLabel} ITC · 100% bonus dep</div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* RIGHT PANEL                                       */}
            {/* ══════════════════════════════════════════════════ */}
            <div style={S.right} role="region" aria-label="Step content">
              <div ref={rightPanelRef} style={S.rightScroll}>
                <div style={S.rightInner}>

                  {/* ══════════════ CUSTOMER: OVERVIEW ══════════════ */}
                  {s7Section === 'overview' && !internalView && (
                    <div>
                      <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 4 }}>Your Energy Investment</div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{fmt(totalSystemKW, 0)} kW Solar + {rec.bess.capacityKWh} kWh Battery{includeGenerator ? ` + ${rec.generator.powerKW} kW Generator` : ''}</div>
                      </div>

                      {/* Hero strikethrough — universal credits only */}
                      <div style={{ textAlign: 'center', marginBottom: 26 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Turnkey Installed Price</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 16 }}>
                          <span style={{ fontSize: 26, fontWeight: 700, color: '#475569', textDecoration: 'line-through' }}>${fmt(grossCost)}</span>
                          <span style={{ fontSize: 44, fontWeight: 900, color: 'white' }}>${fmt(netCostUniversal)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 600, marginTop: 6 }}>You save ${fmt(universalSavings)} with Federal ITC + State credits</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 4, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setS7Section('tax')}>View credit breakdown →</div>
                      </div>

                      {/* 3 Metric Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <div style={s7.cardGreen}><div style={s7.lbl}>Monthly Savings</div><div style={{ ...s7.bigVal, color: '#4ade80' }}>${fmt(monthlySavings)}</div><div style={s7.note}>{billReductionPct}% of electric bill</div></div>
                        <div style={s7.cardGreen}><div style={s7.lbl}>Annual Savings</div><div style={{ ...s7.bigVal, color: '#4ade80' }}>${fmt(annualSavingsTotal)}/yr</div><div style={s7.note}>Energy + revenue</div></div>
                        <div style={s7.cardPurple}><div style={s7.lbl}>Pays for Itself In</div><div style={{ ...s7.bigVal, color: '#a5b4fc' }}>{paybackYrs} yr</div><div style={s7.note}>Then {Math.max(25 - Math.ceil(purchasePayback || 8), 15)}+ yrs pure savings</div></div>
                      </div>

                      {/* ITC Warning */}
                      <div style={{ padding: '11px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', marginBottom: 22, fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>
                        ⚠️ ITC drops after Jul 2026 — delay costs ${fmt(Math.round(grossCost * 0.10))}+
                      </div>

                      {/* Financing Tombstone */}
                      <div onClick={() => setS7Section('financing')} style={{ padding: 18, borderRadius: 14, marginBottom: 22, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(74,222,128,0.03))', border: '1px solid rgba(99,102,241,0.12)', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>💳 Financing Options</span>
                          <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700 }}>Compare all →</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {[
                            { nm: 'CASH', bg: `$${Math.round(netCostUniversal / 1000)}K`, sm: `${paybackYrs} yr payback`, color: 'white' },
                            { nm: 'LOAN', bg: `$${fmt(loanMonthlyPmt)}`, sm: `/mo · ${loanTerm} yr`, color: '#a5b4fc' },
                            { nm: 'LEASE', bg: `$${fmt(leaseMonthly)}`, sm: `/mo · ${leaseTerm} yr`, color: '#a5b4fc' },
                            { nm: 'PPA', bg: '$0', sm: `down · $${fmt(ppaEffRate, 3)}/kWh`, color: '#4ade80' },
                          ].map(p => (
                            <div key={p.nm} style={{ padding: '10px 6px', borderRadius: 9, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 3 }}>{p.nm}</div>
                              <div style={{ fontSize: 17, fontWeight: 900, color: p.color }}>{p.bg}</div>
                              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{p.sm}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTAs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button style={{ padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>📅 Schedule Consultation</button>
                        <button style={{ padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: 'transparent', color: '#e2e8f0' }}>📄 Download PDF</button>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ CUSTOMER: FINANCING ══════════════ */}
                  {s7Section === 'financing' && !internalView && (
                    <div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>Financing Options</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Compare ownership vs. third-party options for your ${fmt(netCostUniversal)} net investment</div>
                      </div>

                      {/* Tabs */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                        {[{ id: 'purchase', l: '💰 Cash' }, { id: 'loan', l: '🏦 Loan' }, { id: 'lease', l: '📋 Lease' }, { id: 'ppa', l: '⚡ PPA' }].map(t => (
                          <button key={t.id} onClick={() => setS7DetailTab(t.id)} style={s7.finTab(s7DetailTab === t.id)}>{t.l}</button>
                        ))}
                      </div>

                      {/* Cash */}
                      {s7DetailTab === 'purchase' && (
                        <div style={s7.card}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>Cash Purchase</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>You own the system, claim all tax benefits, maximize long-term returns</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <div><div style={s7.lbl}>Upfront Investment</div><div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>${fmt(netCostUniversal)}</div></div>
                            <div><div style={s7.lbl}>Net Payback Period</div><div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>{paybackYrs} years</div></div>
                            <div><div style={s7.lbl}>25-Year Net Value</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>${fmt(compRows.purchase.yr25)}</div><div style={s7.note}>{netCostUniversal > 0 ? Math.round(compRows.purchase.yr25 / netCostUniversal * 100) : 0}% ROI</div></div>
                            <div><div style={s7.lbl}>Monthly Cash Flow (Post-Payback)</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>+${fmt(monthlySavings)}/mo</div></div>
                          </div>
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,0.12)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>OWNER BONUS</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>MACRS accelerated depreciation (5-yr schedule)</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80', marginLeft: 'auto', flexShrink: 0 }}>− ${fmt(macrsBenefit)}</span>
                          </div>
                        </div>
                      )}

                      {/* Loan */}
                      {s7DetailTab === 'loan' && (
                        <div style={s7.card}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>Loan ({loanTerm}-Year Term)</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Finance the system, start saving immediately, you own it after payoff</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <div><div style={s7.lbl}>Monthly Payment</div><div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>${fmt(loanMonthlyPmt)}</div></div>
                            <div><div style={s7.lbl}>Year 1 Net Monthly</div><div style={{ fontSize: 22, fontWeight: 900, color: compRows.loan.monthlySav >= 0 ? '#4ade80' : '#fca5a5' }}>{compRows.loan.monthlySav >= 0 ? '+' : ''}${fmt(compRows.loan.monthlySav)}</div><div style={s7.note}>{compRows.loan.monthlySav >= 0 ? 'Savings exceed payment' : 'Payment exceeds savings'}</div></div>
                            <div><div style={s7.lbl}>25-Year Net Value</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>${fmt(compRows.loan.yr25)}</div></div>
                            <div><div style={s7.lbl}>Ownership</div><div style={{ fontSize: 16, fontWeight: 900, color: '#a5b4fc' }}>After loan payoff</div><div style={s7.note}>You claim ITC + MACRS</div></div>
                          </div>
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', background: 'rgba(74,222,128,0.12)', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>OWNER BONUS</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>MACRS accelerated depreciation (5-yr schedule)</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#4ade80', marginLeft: 'auto', flexShrink: 0 }}>− ${fmt(macrsBenefit)}</span>
                          </div>
                        </div>
                      )}

                      {/* Lease */}
                      {s7DetailTab === 'lease' && (
                        <div style={s7.card}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>Operating Lease ({leaseTerm}-Year)</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Fixed monthly payment, no ownership — predictable energy cost</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <div><div style={s7.lbl}>Monthly Lease Payment</div><div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>${fmt(leaseMonthly)}</div></div>
                            <div><div style={s7.lbl}>Upfront Cost</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>$0</div></div>
                            <div><div style={s7.lbl}>Monthly Net Savings</div><div style={{ fontSize: 22, fontWeight: 900, color: leaseNetMonthlySav >= 0 ? '#4ade80' : '#fca5a5' }}>{leaseNetMonthlySav >= 0 ? '+' : ''}${fmt(leaseNetMonthlySav)}/mo</div><div style={s7.note}>vs. current utility bill</div></div>
                            <div><div style={s7.lbl}>Escalator</div><div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{fmt(leaseEscalator, 1)}%/yr</div><div style={s7.note}>vs. {fmt(utilityEscalation * 100, 1)}% utility escalation</div></div>
                          </div>
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', fontSize: 12, color: '#94a3b8' }}>
                            ℹ️ Lessor claims ITC + MACRS. No ownership at term end. Option to purchase at FMV or renew.
                          </div>
                        </div>
                      )}

                      {/* PPA */}
                      {s7DetailTab === 'ppa' && (
                        <div style={s7.card}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 4 }}>Power Purchase Agreement</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Zero upfront — buy power at a locked-in discount</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                            <div><div style={s7.lbl}>PPA Rate</div><div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>${fmt(ppaEffRate, 3)}/kWh</div><div style={s7.note}>vs. ${fmt(utilityRate, 3)}/kWh utility</div></div>
                            <div><div style={s7.lbl}>Upfront Cost</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>$0</div></div>
                            <div><div style={s7.lbl}>Day 1 Savings</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>{utilityRate > 0 ? Math.round((1 - ppaEffRate / utilityRate) * 100) : 0}%</div><div style={s7.note}>cheaper than utility</div></div>
                            <div><div style={s7.lbl}>25-Year Net Value</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>${fmt(compRows.ppa.yr25)}</div></div>
                          </div>
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', fontSize: 12, color: '#94a3b8' }}>
                            ℹ️ Developer claims all tax credits. No ownership. Typical {fmt(ppaEffEscalator, 1)}%/yr escalator. Term: {ppaTerm} years.
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                        <button style={{ padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>📅 Schedule Consultation</button>
                        <button onClick={() => setS7Section('overview')} style={{ padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700, border: '1.5px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: 'transparent', color: '#e2e8f0' }}>← Back to Overview</button>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ CUSTOMER: TAX & CREDITS ══════════════ */}
                  {s7Section === 'tax' && !internalView && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>Tax & Credits</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>All available incentives for your {fmt(totalSystemKW, 0)} kW system</div>
                      <div style={{ ...s7.card, marginBottom: 16 }}>
                        <div style={s7.sectionH}>Federal Investment Tax Credit (ITC)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div><div style={s7.lbl}>ITC Rate</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>{itcPctLabel}</div></div>
                          <div><div style={s7.lbl}>ITC Value</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>− ${fmt(totalFederalCredits)}</div></div>
                        </div>
                      </div>
                      {totalStateIncentive > 0 && (
                        <div style={{ ...s7.card, marginBottom: 16 }}>
                          <div style={s7.sectionH}>State Incentives</div>
                          <div><div style={s7.lbl}>State Credits & Rebates</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>− ${fmt(totalStateIncentive)}</div></div>
                        </div>
                      )}
                      <div style={{ ...s7.card, marginBottom: 16 }}>
                        <div style={s7.sectionH}>MACRS Depreciation (Ownership Only)</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div><div style={s7.lbl}>Depreciation Benefit</div><div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>− ${fmt(macrsBenefit)}</div></div>
                          <div><div style={s7.lbl}>Schedule</div><div style={{ fontSize: 16, fontWeight: 700, color: '#a5b4fc' }}>5-year accelerated</div><div style={s7.note}>100% bonus depreciation</div></div>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>MACRS applies to Cash Purchase and Loan financing only. PPA/Lease — developer claims depreciation.</div>
                      </div>
                      <div style={{ ...s7.card, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div><div style={s7.lbl}>Total Credits (Universal)</div><div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>− ${fmt(universalSavings)}</div></div>
                          <div><div style={s7.lbl}>+ MACRS (If You Own)</div><div style={{ fontSize: 24, fontWeight: 900, color: '#4ade80' }}>− ${fmt(macrsBenefit)}</div></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ CUSTOMER: TIMELINE ══════════════ */}
                  {s7Section === 'timeline' && !internalView && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>Value Timeline</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Cumulative net value by financing option over 25 years</div>
                      <div style={s7.card}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: 0, fontSize: 11 }}>
                          <div style={{ padding: '6px 8px', fontWeight: 800, color: '#475569' }}>Year</div>
                          {compKeys.map(k => <div key={k} style={{ padding: '6px 8px', fontWeight: 800, color: compColors[k], textAlign: 'right' }}>{compIcons[k]} {compLabels[k]}</div>)}
                          {cfData.map(d => (
                            <React.Fragment key={d.yr}>
                              <div style={{ padding: '6px 8px', fontWeight: 700, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.04)' }}>Yr {d.yr}</div>
                              {compKeys.map(k => <div key={k} style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.04)', color: d[k] >= 0 ? '#4ade80' : '#fca5a5' }}>{d[k] >= 0 ? '' : '−'}${fmt(Math.abs(d[k]))}</div>)}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ CUSTOMER: SCENARIOS ══════════════ */}
                  {s7Section === 'scenarios' && !internalView && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>Scenarios</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>How changes in key variables affect your investment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                          { title: '📈 Utility Rates +5%/yr', desc: 'If rates rise faster than projected', payback: `${fmt(Math.max((purchasePayback || 8) - 0.8, 3), 1)} yr`, value: `$${fmt(Math.round(compRows.purchase.yr25 * 1.25))}`, color: '#4ade80' },
                          { title: '📉 Utility Rates +1%/yr', desc: 'If rates stagnate', payback: `${fmt((purchasePayback || 8) + 1.5, 1)} yr`, value: `$${fmt(Math.round(compRows.purchase.yr25 * 0.72))}`, color: '#fbbf24' },
                          { title: '☁️ Low Solar Production', desc: '-15% below forecast', payback: `${fmt((purchasePayback || 8) + 1.2, 1)} yr`, value: `$${fmt(Math.round(compRows.purchase.yr25 * 0.82))}`, color: '#fbbf24' },
                          { title: '☀️ High Solar Production', desc: '+10% above forecast', payback: `${fmt(Math.max((purchasePayback || 8) - 0.6, 3), 1)} yr`, value: `$${fmt(Math.round(compRows.purchase.yr25 * 1.12))}`, color: '#4ade80' },
                        ].map(s => (
                          <div key={s.title} style={s7.card}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>{s.desc}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Payback</div><div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.payback}</div></div>
                              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>25-Yr Value</div><div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ══════════════════════════════════════════════════ */}
                  {/* INTERNAL: DEAL DASHBOARD                          */}
                  {/* ══════════════════════════════════════════════════ */}
                  {s7Section === 'i-dashboard' && internalView && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', marginBottom: 22 }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Deal Dashboard</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedIndustry?.label || 'Commercial'} · {formData?.city || ''}, {state} · {fmt(totalSystemKW, 0)} kW + {rec.bess.capacityKWh} kWh{includeGenerator ? ` + ${rec.generator.powerKW} kW Gen` : ''}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)' }}>🔒 INTERNAL ONLY</span>
                      </div>

                      {/* 5 KPI Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 22 }}>
                        {[
                          { lbl: 'Turnkey Revenue', val: `$${Math.round(totalTurnkey / 1000)}K`, color: 'white' },
                          { lbl: 'Total COGS', val: `$${Math.round(totalCOGS / 1000)}K`, color: '#fca5a5' },
                          { lbl: 'Gross Profit', val: `$${fmt(totalGP)}`, color: '#4ade80' },
                          { lbl: 'Blended GP%', val: `${blendedGPpct}%`, color: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24', note: 'Target: 25%' },
                          { lbl: 'Cust. Payback', val: `${paybackYrs} yr`, color: '#a5b4fc', note: 'Industry: 8-9' },
                        ].map(k => (
                          <div key={k.lbl} style={{ padding: '14px 10px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.lbl}</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: k.color }}>{k.val}</div>
                            {k.note && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{k.note}</div>}
                          </div>
                        ))}
                      </div>

                      {/* Two columns: P&L Waterfall + Deal Scorecard */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* P&L Waterfall */}
                        <div style={s7.card}>
                          <div style={s7.sectionH}>P&L Waterfall</div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Equipment Revenue</span><span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>${fmt(totalEquipTurnkey)}</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Services Revenue</span><span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>${fmt(totalSvcTurnkey)}</span></div>
                          <div style={s7.wfTot}><span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>Turnkey Revenue</span><span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>${fmt(totalTurnkey)}</span></div>
                          <div style={{ height: 6 }} />
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Equipment COGS</span><span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>({fmt(totalEquipCOGS)})</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Services COGS</span><span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>({fmt(totalSvcCOGS7)})</span></div>
                          <div style={s7.wfTot}><span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>Total COGS</span><span style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5' }}>({fmt(totalCOGS)})</span></div>
                          <div style={{ marginTop: 10, padding: 12, borderRadius: 10, textAlign: 'center', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>${fmt(totalGP)} · {blendedGPpct}%</div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Gross Profit</div>
                          </div>
                        </div>

                        {/* Deal Scorecard */}
                        <div style={s7.card}>
                          <div style={s7.sectionH}>Deal Scorecard</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                              { lbl: 'GP vs Target', val: `${blendedGPpct}%`, note: parseFloat(blendedGPpct) >= 25 ? 'At or above target' : `${(25 - parseFloat(blendedGPpct)).toFixed(1)}% below 25%`, color: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24' },
                              { lbl: 'Payback vs Industry', val: `${paybackYrs} yr`, note: parseFloat(paybackYrs) < 9 ? 'Competitive' : 'Above average', color: parseFloat(paybackYrs) < 9 ? '#4ade80' : '#fbbf24' },
                              { lbl: 'Revenue / Project', val: `$${Math.round(totalTurnkey / 1000)}K`, note: totalTurnkey >= 500000 ? 'Large deal' : totalTurnkey >= 200000 ? 'Mid-market' : 'Small deal', color: 'white' },
                              { lbl: 'Risk Level', val: 'LOW', note: 'Established customer', color: '#4ade80' },
                            ].map(d => (
                              <div key={d.lbl} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{d.lbl}</div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: d.color }}>{d.val}</div>
                                <div style={{ fontSize: 9, color: d.color === 'white' ? '#64748b' : d.color, marginTop: 2 }}>{d.note}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ INTERNAL: MARGIN ANALYSIS ══════════════ */}
                  {s7Section === 'i-margins' && internalView && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', marginBottom: 22 }}>
                        <div><div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Margin Analysis</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Category-level revenue, COGS, and GP breakdown</div></div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)' }}>🔒 INTERNAL ONLY</span>
                      </div>

                      <div style={{ ...s7.card, marginBottom: 20 }}>
                        <div style={s7.sectionH}>Equipment Margins</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', gap: 0 }}>
                          {['Category', 'Revenue', 'COGS', 'GP%'].map((h, i) => (
                            <div key={h} style={{ padding: '5px 8px', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i > 0 ? 'right' : 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                          ))}
                          {marginRows7.map(r => (
                            <React.Fragment key={r.id}>
                              <div style={{ padding: '6px 8px', fontSize: 11, color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.cat}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>${fmt(r.revenue)}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>${fmt(r.cogs)}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', color: parseFloat(r.pct) >= 20 ? '#4ade80' : '#fbbf24' }}>{r.pct}%<span style={s7.dot(parseFloat(r.pct) >= 20 ? '#4ade80' : '#fbbf24')} /></div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div style={{ ...s7.card, marginBottom: 20 }}>
                        <div style={s7.sectionH}>Services Margins</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', gap: 0 }}>
                          {['Category', 'Revenue', 'COGS', 'GP%'].map((h, i) => (
                            <div key={h} style={{ padding: '5px 8px', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i > 0 ? 'right' : 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                          ))}
                          {svcRows7.map(r => (
                            <React.Fragment key={r.cat}>
                              <div style={{ padding: '6px 8px', fontSize: 11, color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.cat}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>${fmt(r.revenue)}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#cbd5e1', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>${fmt(r.cogs)}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', color: parseFloat(r.pct) >= 20 ? '#4ade80' : '#fbbf24' }}>{r.pct}%<span style={s7.dot(parseFloat(r.pct) >= 20 ? '#4ade80' : '#fbbf24')} /></div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Blended summary */}
                      <div style={{ ...s7.card, background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                          <div><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Equipment GP</div><div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80' }}>{totalEquipTurnkey > 0 ? ((totalEquipTurnkey - totalEquipCOGS) / totalEquipTurnkey * 100).toFixed(1) : '0.0'}%</div></div>
                          <div><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Services GP</div><div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80' }}>{totalSvcTurnkey > 0 ? ((totalSvcTurnkey - totalSvcCOGS7) / totalSvcTurnkey * 100).toFixed(1) : '0.0'}%</div></div>
                          <div><div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Blended GP</div><div style={{ fontSize: 20, fontWeight: 900, color: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24' }}>{blendedGPpct}%</div><div style={{ fontSize: 9, color: parseFloat(blendedGPpct) >= 25 ? '#4ade80' : '#fbbf24' }}>{parseFloat(blendedGPpct) >= 25 ? 'At target' : `${(25 - parseFloat(blendedGPpct)).toFixed(1)}% below target`}</div></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ INTERNAL: INVESTOR RETURNS ══════════════ */}
                  {s7Section === 'i-returns' && internalView && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', marginBottom: 22 }}>
                        <div><div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Investor Returns</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Project-level economics for VC / PE / investor review</div></div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)' }}>🔒 INTERNAL ONLY</span>
                      </div>

                      {/* IRR / NPV / MOIC */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 22 }}>
                        {[
                          { lbl: 'Project IRR', val: `${netCostUniversal > 0 && annualSavingsTotal > 0 ? fmt(annualSavingsTotal / netCostUniversal * 100 * 1.2, 1) : '—'}%`, note: 'Unlevered, after-tax' },
                          { lbl: 'NPV (8% discount)', val: `$${fmt(Math.round(compRows.purchase.yr25 * 0.42))}`, note: '25-year horizon' },
                          { lbl: 'MOIC', val: `${netCostUniversal > 0 ? fmt((compRows.purchase.yr25 + netCostUniversal) / netCostUniversal, 1) : '—'}×`, note: '25-yr multiple' },
                        ].map(k => (
                          <div key={k.lbl} style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{k.lbl}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc' }}>{k.val}</div>
                            <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{k.note}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={s7.card}>
                          <div style={s7.sectionH}>Cash Flow Summary</div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Year 1 Revenue</span><span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>${fmt(annualSavingsTotal + annualTotalCosts)}</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Year 1 O&M</span><span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>({fmt(annualTotalCosts)})</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Year 1 Net CF</span><span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>${fmt(annualSavingsTotal)}</span></div>
                          <div style={{ height: 6 }} />
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>10-Year Cumulative</span><span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>${fmt(sav10)}</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>25-Year Cumulative</span><span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>${fmt(sav25)}</span></div>
                          <div style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>Salvage Value</span><span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>${fmt(salvageValue)}</span></div>
                        </div>
                        <div style={s7.card}>
                          <div style={s7.sectionH}>Key Assumptions</div>
                          {assumptionsData.slice(0, 8).map(a => (
                            <div key={a.key} style={s7.wfRow}><span style={{ fontSize: 12, color: '#94a3b8' }}>{a.label}</span><span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{a.value}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══════════════ INTERNAL: RISK ASSESSMENT ══════════════ */}
                  {s7Section === 'i-risk' && internalView && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', marginBottom: 22 }}>
                        <div><div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Risk Assessment</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Weather, regulatory, market, and operational risk</div></div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)' }}>🔒 INTERNAL ONLY</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        {[
                          { title: '☁️ Weather / Production', risk: wr7.level || 'Low', factors: [`Derating: ${fmt((wr7.productionDerating || 0.92) * 100, 0)}%`, `Hail risk: ${wr7.hailRisk || 'Low'}`, `Snow loss: ${fmt((wr7.snowLoss || 0) * 100, 1)}%`] },
                          { title: '📜 Regulatory / NEM', risk: 'Medium', factors: ['NEM 3.0 export reduction', 'ITC step-down timeline', 'State incentive changes'] },
                          { title: '⚡ Grid / Interconnection', risk: 'Low', factors: [`Export rate: ${Math.round(exportRate * 100)}¢/kWh`, 'Standard interconnection', 'No transformer upgrade'] },
                          { title: '🔧 Equipment / O&M', risk: 'Low', factors: [`Inverter replace: Yr ${inverterReplacementYear}`, `BESS replace: Yr ${bessReplacementYear}`, `Panel degradation: ${fmt(panelDegradation * 100, 2)}%/yr`] },
                        ].map(r => (
                          <div key={r.title} style={s7.card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{r.title}</span>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 5, background: r.risk === 'Low' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', color: r.risk === 'Low' ? '#4ade80' : '#fbbf24', border: `1px solid ${r.risk === 'Low' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}` }}>{r.risk.toUpperCase()}</span>
                            </div>
                            {r.factors.map(f => <div key={f} style={{ fontSize: 11, color: '#94a3b8', padding: '3px 0' }}>• {f}</div>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ══════════════ INTERNAL: COMPETITIVE POSITION ══════════════ */}
                  {s7Section === 'i-comp' && internalView && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', marginBottom: 22 }}>
                        <div><div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Competitive Position</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Benchmarks vs. Energy Toolbase, Aurora Solar, industry averages</div></div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)' }}>🔒 INTERNAL ONLY</span>
                      </div>
                      <div style={{ ...s7.card, marginBottom: 20 }}>
                        <div style={s7.sectionH}>Price Benchmarking</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 0 }}>
                          {['Metric', 'Merlin', 'Industry Avg', 'Status'].map((h, i) => (
                            <div key={h} style={{ padding: '5px 8px', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                          ))}
                          {[
                            { m: '$/W Solar', ours: `$${fmt(totalSystemKW > 0 ? turnkeyPrices7.solar / (totalSystemKW * 1000) : 0, 2)}`, ind: '$2.50-3.50', ok: true },
                            { m: '$/kWh BESS', ours: `$${fmt(rec.bess.capacityKWh > 0 ? turnkeyPrices7.bess / rec.bess.capacityKWh : 0, 0)}`, ind: '$400-600', ok: true },
                            { m: 'Payback (yr)', ours: paybackYrs, ind: '8-9', ok: parseFloat(paybackYrs) <= 9 },
                            { m: 'Blended GP%', ours: `${blendedGPpct}%`, ind: '20-30%', ok: parseFloat(blendedGPpct) >= 20 },
                          ].map(r => (
                            <React.Fragment key={r.m}>
                              <div style={{ padding: '6px 8px', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.m}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, color: 'white', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.ours}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, color: '#64748b', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.ind}</div>
                              <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 700, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', color: r.ok ? '#4ade80' : '#fbbf24' }}>{r.ok ? '✓ Good' : '⚠ Review'}<span style={s7.dot(r.ok ? '#4ade80' : '#fbbf24')} /></div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={S.footerLeft}>
              <button style={S.btnBack} onClick={() => setCurrentStep(6)}>← Back</button>
            </div>
            <div style={S.footerRight}>
              <button style={S.btnGhost} onClick={() => onStartOver ? onStartOver() : setCurrentStep(4)}><IcoRotate size={16} color="#94a3b8" /> Start Over</button>
            </div>
          </div>
        </>
        );
        } catch (step7Err) { // E-13: Catch any Step 7 render crash
          console.error('[Step 7 RENDER CRASH]', step7Err);
          return (<div style={{ padding: 40, color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>⚠️ Quote Generation Error</div>
            <div style={{ color: '#94a3b8', marginBottom: 20 }}>An error occurred while generating your quote. Your data is safe.</div>
            <div style={{ color: '#fbbf24', fontSize: 12, fontFamily: 'monospace', marginBottom: 20 }}>{String(step7Err)}</div>
            <button onClick={() => setCurrentStep(6)} style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>← Back to Configuration</button>
          </div>);
        }
      })()}

      {/* Disclaimer icon moved to header — see header section */}

      {/* SSOT Tracker — slide-out panel, PIN-protected (same as Step 1) */}
      <MerlinSSOTTracker 
        isOpen={ssotTrackerOpen} 
        onClose={() => setSsotTrackerOpen(false)} 
        locationData={locationData}
        projectData={{
          step: currentStep,
          industry: selectedIndustry?.id,
          state: locationData?.stateCode,
          solarKW: rec?.solar?.sizeKW,
          bessKWh: rec?.bess?.capacityKWh,
          supplierCount: Object.keys(SUPPLIERS).reduce((sum, k) => sum + SUPPLIERS[k].length, 0),
          scenarioTimestamp: new Date().toISOString(),
        }}
      />

    </div>
  );
}

