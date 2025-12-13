/**
 * WIZARD CONSTANTS
 * ================
 * 
 * Centralized constants for the StreamlinedWizard and its components.
 * Extracted from StreamlinedWizard.tsx during December 2025 refactor.
 */

import {
  TrendingDown, Shield, Leaf, Zap, Gauge,
  Droplets, Car, Hotel, Battery, Building2, Settings, DollarSign
} from 'lucide-react';
import type React from 'react';

// ============================================
// GOAL OPTIONS
// ============================================

export interface GoalOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: 'cost-savings', label: 'Cut Energy Costs', icon: TrendingDown, description: 'Reduce demand charges & energy bills' },
  { id: 'backup-power', label: 'Backup Power', icon: Shield, description: 'Keep operations running during outages' },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, description: 'Meet ESG goals & reduce carbon footprint' },
  { id: 'grid-independence', label: 'Grid Independence', icon: Zap, description: 'Reduce reliance on utility grid' },
  { id: 'demand-management', label: 'Peak Shaving', icon: Gauge, description: 'Flatten peak demand spikes' },
];

// ============================================
// FACILITY SIZE PRESETS BY INDUSTRY
// ============================================

export interface FacilityPreset {
  label: string;
  unit: string;
  presets: number[];
  default: number;
}

export const FACILITY_PRESETS: Record<string, FacilityPreset> = {
  'office': { label: 'Office Size', unit: 'sq ft', presets: [10000, 25000, 50000, 100000], default: 25000 },
  'datacenter': { label: 'IT Load', unit: 'kW', presets: [100, 500, 1000, 5000], default: 500 },
  'hotel': { label: 'Number of Rooms', unit: 'rooms', presets: [50, 100, 200, 400], default: 150 },
  'manufacturing': { label: 'Facility Size', unit: 'sq ft', presets: [25000, 50000, 100000, 250000], default: 50000 },
  'retail': { label: 'Store Size', unit: 'sq ft', presets: [5000, 15000, 30000, 75000], default: 15000 },
  'airport': { label: 'Annual Passengers', unit: 'million', presets: [1, 5, 15, 40], default: 5 },
  'car-wash': { label: 'Wash Bays', unit: 'bays', presets: [2, 4, 6, 10], default: 4 },
  'ev-charging': { label: 'Charging Ports', unit: 'ports', presets: [4, 10, 20, 50], default: 10 },
  'hospital': { label: 'Beds', unit: 'beds', presets: [50, 150, 300, 600], default: 150 },
  'college': { label: 'Students', unit: 'students', presets: [1000, 5000, 15000, 40000], default: 5000 },
  'data-center': { label: 'IT Load', unit: 'kW', presets: [100, 500, 1000, 5000], default: 500 },
  'default': { label: 'Facility Size', unit: 'sq ft', presets: [10000, 25000, 50000, 100000], default: 25000 },
};

// ============================================
// US STATES LIST
// ============================================

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// ============================================
// INTERNATIONAL REGIONS & COUNTRIES
// ============================================

export interface InternationalRegion {
  code: string;
  name: string;
  currency: string;
  avgElectricityRate: number; // $/kWh equivalent
  avgDemandCharge: number; // $/kW equivalent
  avgSolarHours: number;
  gridReliability: number; // 0-100
  flag: string;
}

export const INTERNATIONAL_REGIONS: InternationalRegion[] = [
  // United Kingdom
  { code: 'UK-ENG', name: 'England', currency: 'GBP', avgElectricityRate: 0.34, avgDemandCharge: 12, avgSolarHours: 4.2, gridReliability: 99, flag: '🇬🇧' },
  { code: 'UK-SCO', name: 'Scotland', currency: 'GBP', avgElectricityRate: 0.32, avgDemandCharge: 11, avgSolarHours: 3.8, gridReliability: 98, flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'UK-WAL', name: 'Wales', currency: 'GBP', avgElectricityRate: 0.33, avgDemandCharge: 11, avgSolarHours: 4.0, gridReliability: 98, flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'UK-NIR', name: 'Northern Ireland', currency: 'GBP', avgElectricityRate: 0.30, avgDemandCharge: 10, avgSolarHours: 3.6, gridReliability: 97, flag: '🇬🇧' },
  
  // Europe
  { code: 'DE', name: 'Germany', currency: 'EUR', avgElectricityRate: 0.40, avgDemandCharge: 15, avgSolarHours: 4.5, gridReliability: 99, flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', avgElectricityRate: 0.25, avgDemandCharge: 10, avgSolarHours: 5.0, gridReliability: 99, flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', currency: 'EUR', avgElectricityRate: 0.28, avgDemandCharge: 12, avgSolarHours: 6.5, gridReliability: 98, flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', currency: 'EUR', avgElectricityRate: 0.35, avgDemandCharge: 14, avgSolarHours: 5.8, gridReliability: 97, flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', avgElectricityRate: 0.38, avgDemandCharge: 13, avgSolarHours: 4.0, gridReliability: 99, flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', avgElectricityRate: 0.36, avgDemandCharge: 12, avgSolarHours: 4.2, gridReliability: 99, flag: '🇧🇪' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', avgElectricityRate: 0.22, avgDemandCharge: 9, avgSolarHours: 6.2, gridReliability: 98, flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', avgElectricityRate: 0.35, avgDemandCharge: 12, avgSolarHours: 3.8, gridReliability: 99, flag: '🇮🇪' },
  { code: 'AT', name: 'Austria', currency: 'EUR', avgElectricityRate: 0.30, avgDemandCharge: 11, avgSolarHours: 4.8, gridReliability: 99, flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', avgElectricityRate: 0.22, avgDemandCharge: 10, avgSolarHours: 4.6, gridReliability: 99, flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', avgElectricityRate: 0.18, avgDemandCharge: 8, avgSolarHours: 4.0, gridReliability: 99, flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', currency: 'NOK', avgElectricityRate: 0.15, avgDemandCharge: 7, avgSolarHours: 3.5, gridReliability: 99, flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', avgElectricityRate: 0.42, avgDemandCharge: 15, avgSolarHours: 4.2, gridReliability: 99, flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', currency: 'EUR', avgElectricityRate: 0.20, avgDemandCharge: 9, avgSolarHours: 3.8, gridReliability: 99, flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', currency: 'PLN', avgElectricityRate: 0.22, avgDemandCharge: 8, avgSolarHours: 4.2, gridReliability: 96, flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', avgElectricityRate: 0.25, avgDemandCharge: 9, avgSolarHours: 4.3, gridReliability: 98, flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', currency: 'EUR', avgElectricityRate: 0.28, avgDemandCharge: 10, avgSolarHours: 6.8, gridReliability: 95, flag: '🇬🇷' },
  
  // Australia & New Zealand
  { code: 'AU-NSW', name: 'New South Wales', currency: 'AUD', avgElectricityRate: 0.28, avgDemandCharge: 12, avgSolarHours: 5.8, gridReliability: 97, flag: '🇦🇺' },
  { code: 'AU-VIC', name: 'Victoria', currency: 'AUD', avgElectricityRate: 0.26, avgDemandCharge: 11, avgSolarHours: 5.2, gridReliability: 97, flag: '🇦🇺' },
  { code: 'AU-QLD', name: 'Queensland', currency: 'AUD', avgElectricityRate: 0.24, avgDemandCharge: 10, avgSolarHours: 6.2, gridReliability: 96, flag: '🇦🇺' },
  { code: 'AU-SA', name: 'South Australia', currency: 'AUD', avgElectricityRate: 0.35, avgDemandCharge: 14, avgSolarHours: 6.5, gridReliability: 94, flag: '🇦🇺' },
  { code: 'AU-WA', name: 'Western Australia', currency: 'AUD', avgElectricityRate: 0.30, avgDemandCharge: 12, avgSolarHours: 6.8, gridReliability: 96, flag: '🇦🇺' },
  { code: 'AU-TAS', name: 'Tasmania', currency: 'AUD', avgElectricityRate: 0.28, avgDemandCharge: 11, avgSolarHours: 4.5, gridReliability: 97, flag: '🇦🇺' },
  { code: 'AU-NT', name: 'Northern Territory', currency: 'AUD', avgElectricityRate: 0.26, avgDemandCharge: 10, avgSolarHours: 7.0, gridReliability: 92, flag: '🇦🇺' },
  { code: 'AU-ACT', name: 'Australian Capital Territory', currency: 'AUD', avgElectricityRate: 0.25, avgDemandCharge: 10, avgSolarHours: 5.5, gridReliability: 98, flag: '🇦🇺' },
  { code: 'NZ-NI', name: 'New Zealand - North Island', currency: 'NZD', avgElectricityRate: 0.22, avgDemandCharge: 10, avgSolarHours: 5.0, gridReliability: 98, flag: '🇳🇿' },
  { code: 'NZ-SI', name: 'New Zealand - South Island', currency: 'NZD', avgElectricityRate: 0.20, avgDemandCharge: 9, avgSolarHours: 4.8, gridReliability: 98, flag: '🇳🇿' },
  
  // Asia Pacific
  { code: 'JP-KAN', name: 'Japan - Kanto (Tokyo)', currency: 'JPY', avgElectricityRate: 0.26, avgDemandCharge: 14, avgSolarHours: 4.5, gridReliability: 99, flag: '🇯🇵' },
  { code: 'JP-KIN', name: 'Japan - Kinki (Osaka)', currency: 'JPY', avgElectricityRate: 0.24, avgDemandCharge: 13, avgSolarHours: 4.8, gridReliability: 99, flag: '🇯🇵' },
  { code: 'JP-CHU', name: 'Japan - Chubu (Nagoya)', currency: 'JPY', avgElectricityRate: 0.25, avgDemandCharge: 13, avgSolarHours: 4.6, gridReliability: 99, flag: '🇯🇵' },
  { code: 'JP-KYU', name: 'Japan - Kyushu', currency: 'JPY', avgElectricityRate: 0.23, avgDemandCharge: 12, avgSolarHours: 5.0, gridReliability: 99, flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', avgElectricityRate: 0.11, avgDemandCharge: 8, avgSolarHours: 4.5, gridReliability: 99, flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', avgElectricityRate: 0.22, avgDemandCharge: 15, avgSolarHours: 4.8, gridReliability: 99, flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', avgElectricityRate: 0.15, avgDemandCharge: 12, avgSolarHours: 4.5, gridReliability: 99, flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD', avgElectricityRate: 0.09, avgDemandCharge: 6, avgSolarHours: 4.2, gridReliability: 98, flag: '🇹🇼' },
  
  // India
  { code: 'IN-MH', name: 'India - Maharashtra (Mumbai)', currency: 'INR', avgElectricityRate: 0.10, avgDemandCharge: 8, avgSolarHours: 5.5, gridReliability: 85, flag: '🇮🇳' },
  { code: 'IN-DL', name: 'India - Delhi NCR', currency: 'INR', avgElectricityRate: 0.09, avgDemandCharge: 7, avgSolarHours: 5.8, gridReliability: 88, flag: '🇮🇳' },
  { code: 'IN-KA', name: 'India - Karnataka (Bangalore)', currency: 'INR', avgElectricityRate: 0.08, avgDemandCharge: 6, avgSolarHours: 5.6, gridReliability: 90, flag: '🇮🇳' },
  { code: 'IN-TN', name: 'India - Tamil Nadu (Chennai)', currency: 'INR', avgElectricityRate: 0.07, avgDemandCharge: 5, avgSolarHours: 5.4, gridReliability: 87, flag: '🇮🇳' },
  { code: 'IN-GJ', name: 'India - Gujarat', currency: 'INR', avgElectricityRate: 0.08, avgDemandCharge: 6, avgSolarHours: 6.0, gridReliability: 92, flag: '🇮🇳' },
  { code: 'IN-RJ', name: 'India - Rajasthan', currency: 'INR', avgElectricityRate: 0.09, avgDemandCharge: 7, avgSolarHours: 6.5, gridReliability: 85, flag: '🇮🇳' },
  
  // Middle East
  { code: 'AE', name: 'UAE (Dubai/Abu Dhabi)', currency: 'AED', avgElectricityRate: 0.08, avgDemandCharge: 10, avgSolarHours: 7.5, gridReliability: 99, flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', avgElectricityRate: 0.05, avgDemandCharge: 6, avgSolarHours: 7.8, gridReliability: 98, flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', currency: 'ILS', avgElectricityRate: 0.16, avgDemandCharge: 10, avgSolarHours: 6.8, gridReliability: 99, flag: '🇮🇱' },
  
  // Canada
  { code: 'CA-ON', name: 'Canada - Ontario', currency: 'CAD', avgElectricityRate: 0.13, avgDemandCharge: 12, avgSolarHours: 4.2, gridReliability: 99, flag: '🇨🇦' },
  { code: 'CA-BC', name: 'Canada - British Columbia', currency: 'CAD', avgElectricityRate: 0.10, avgDemandCharge: 8, avgSolarHours: 4.5, gridReliability: 99, flag: '🇨🇦' },
  { code: 'CA-AB', name: 'Canada - Alberta', currency: 'CAD', avgElectricityRate: 0.12, avgDemandCharge: 10, avgSolarHours: 5.0, gridReliability: 98, flag: '🇨🇦' },
  { code: 'CA-QC', name: 'Canada - Quebec', currency: 'CAD', avgElectricityRate: 0.07, avgDemandCharge: 6, avgSolarHours: 4.0, gridReliability: 99, flag: '🇨🇦' },
  
  // Latin America
  { code: 'MX', name: 'Mexico', currency: 'MXN', avgElectricityRate: 0.10, avgDemandCharge: 8, avgSolarHours: 6.2, gridReliability: 94, flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', avgElectricityRate: 0.14, avgDemandCharge: 10, avgSolarHours: 5.5, gridReliability: 92, flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', currency: 'CLP', avgElectricityRate: 0.16, avgDemandCharge: 12, avgSolarHours: 6.8, gridReliability: 96, flag: '🇨🇱' },
];

// Group international regions by continent
export const REGION_GROUPS = {
  'North America': US_STATES.slice(0, 3).map(s => s), // Show first 3 US states as preview
  'United Kingdom': INTERNATIONAL_REGIONS.filter(r => r.code.startsWith('UK-')),
  'Europe': INTERNATIONAL_REGIONS.filter(r => ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'PT', 'IE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'GR'].includes(r.code)),
  'Australia & NZ': INTERNATIONAL_REGIONS.filter(r => r.code.startsWith('AU-') || r.code.startsWith('NZ-')),
  'Japan': INTERNATIONAL_REGIONS.filter(r => r.code.startsWith('JP-')),
  'Asia Pacific': INTERNATIONAL_REGIONS.filter(r => ['KR', 'SG', 'HK', 'TW'].includes(r.code)),
  'India': INTERNATIONAL_REGIONS.filter(r => r.code.startsWith('IN-')),
  'Middle East': INTERNATIONAL_REGIONS.filter(r => ['AE', 'SA', 'IL'].includes(r.code)),
  'Canada': INTERNATIONAL_REGIONS.filter(r => r.code.startsWith('CA-')),
  'Latin America': INTERNATIONAL_REGIONS.filter(r => ['MX', 'BR', 'CL'].includes(r.code)),
};

// ============================================
// SPECIALIZED VERTICALS
// ============================================

export interface SpecializedVertical {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const SPECIALIZED_VERTICALS: SpecializedVertical[] = [
  { 
    id: 'car-wash', 
    name: 'Car Wash', 
    icon: Droplets, 
    url: '/carwashenergy',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-400',
    description: 'Bay-specific calculations'
  },
  { 
    id: 'ev-charging', 
    name: 'EV Charging Hub', 
    icon: Car, 
    url: '/evchargingenergy',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-400',
    description: 'DCFC demand solutions'
  },
  { 
    id: 'hotel', 
    name: 'Hotel & Hospitality', 
    icon: Hotel, 
    url: '/hotelenergy',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-400',
    description: 'Guest experience + backup'
  },
];

// ============================================
// INDUSTRY ICONS
// ============================================

export const INDUSTRY_ICONS: Record<string, React.ElementType> = {
  'datacenter': Battery,
  'office': Building2,
  'manufacturing': Settings,
  'retail': DollarSign,
  'default': Zap,
};

// ============================================
// POWER PRESETS
// ============================================

export interface PowerPreset {
  label: string;
  value: number;
}

// SOLAR PRESETS: 74% kW options for SMB, 26% MW options for commercial/utility
export const SOLAR_POWER_PRESETS: PowerPreset[] = [
  { label: '5 kW', value: 5 },
  { label: '10 kW', value: 10 },
  { label: '15 kW', value: 15 },
  { label: '20 kW', value: 20 },
  { label: '25 kW', value: 25 },
  { label: '30 kW', value: 30 },
  { label: '40 kW', value: 40 },
  { label: '50 kW', value: 50 },
  { label: '75 kW', value: 75 },
  { label: '100 kW', value: 100 },
  { label: '150 kW', value: 150 },
  { label: '200 kW', value: 200 },
  { label: '250 kW', value: 250 },
  { label: '300 kW', value: 300 },
  { label: '400 kW', value: 400 },
  { label: '500 kW', value: 500 },
  { label: '750 kW', value: 750 },
  { label: '1 MW', value: 1000 },
  { label: '2 MW', value: 2000 },
  { label: '5 MW', value: 5000 },
  { label: '10 MW', value: 10000 },
  { label: '25 MW', value: 25000 },
  { label: '50 MW', value: 50000 },
];

// WIND PRESETS: Similar granularity for small-scale wind
export const WIND_POWER_PRESETS: PowerPreset[] = [
  { label: '5 kW', value: 5 },
  { label: '10 kW', value: 10 },
  { label: '15 kW', value: 15 },
  { label: '20 kW', value: 20 },
  { label: '25 kW', value: 25 },
  { label: '50 kW', value: 50 },
  { label: '75 kW', value: 75 },
  { label: '100 kW', value: 100 },
  { label: '150 kW', value: 150 },
  { label: '200 kW', value: 200 },
  { label: '250 kW', value: 250 },
  { label: '500 kW', value: 500 },
  { label: '750 kW', value: 750 },
  { label: '1 MW', value: 1000 },
  { label: '2 MW', value: 2000 },
  { label: '5 MW', value: 5000 },
  { label: '10 MW', value: 10000 },
  { label: '25 MW', value: 25000 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format power value with intelligent kW/MW display
 * Shows kW for values under 1000, MW for larger values
 */
export const formatPower = (kw: number): string => {
  if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
  return `${kw.toFixed(0)} kW`;
};

/**
 * Get appropriate step size based on current value
 * Provides more granular control at smaller values
 */
export const getStepSize = (current: number): number => {
  if (current < 100) return 10;
  if (current < 500) return 25;
  if (current < 1000) return 50;
  if (current < 5000) return 100;
  if (current < 10000) return 250;
  if (current < 50000) return 500;
  return 1000;
};

/**
 * Find the closest preset index for a given value
 */
export const findClosestPresetIndex = (value: number, presets: PowerPreset[]): number => {
  let closestIndex = 0;
  let closestDiff = Math.abs(presets[0].value - value);
  
  for (let i = 1; i < presets.length; i++) {
    const diff = Math.abs(presets[i].value - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
};

// ============================================
// GRID CONNECTION OPTIONS
// ============================================

export type GridConnectionType = 'on-grid' | 'off-grid' | 'limited';

export const GRID_CONNECTION_OPTIONS = [
  { value: 'on-grid' as const, label: 'Grid-Tied', description: 'Connected to utility grid' },
  { value: 'off-grid' as const, label: 'Off-Grid', description: 'Fully independent' },
  { value: 'limited' as const, label: 'Limited Grid', description: 'Backup only connection' },
];

// ============================================
// GENERATOR FUEL OPTIONS
// ============================================

export type GeneratorFuelType = 'natural-gas' | 'diesel' | 'dual-fuel';

export const GENERATOR_FUEL_OPTIONS = [
  { value: 'natural-gas' as const, label: 'Natural Gas', description: 'Clean, lower emissions' },
  { value: 'diesel' as const, label: 'Diesel', description: 'Traditional, reliable' },
  { value: 'dual-fuel' as const, label: 'Dual Fuel', description: 'Flexible fuel options' },
];

// ============================================
// GENERATOR TYPE OPTIONS
// ============================================

export type GeneratorType = 'traditional' | 'linear' | 'fuel-cell';

export const GENERATOR_TYPE_OPTIONS = [
  { value: 'traditional' as const, label: 'Traditional Generator', description: 'Combustion engine' },
  { value: 'linear' as const, label: 'Linear Generator (Mainspring)', description: 'High efficiency, low emissions' },
  { value: 'fuel-cell' as const, label: 'Fuel Cell', description: 'Zero direct emissions' },
];

// ============================================
// DURATION PRESETS
// ============================================

export const DURATION_PRESETS = [
  { hours: 2, label: '2 hours', description: 'Peak shaving' },
  { hours: 4, label: '4 hours', description: 'Standard backup' },
  { hours: 6, label: '6 hours', description: 'Extended backup' },
  { hours: 8, label: '8 hours', description: 'Full shift' },
  { hours: 12, label: '12 hours', description: 'Half day' },
];

// ============================================
// EV CHARGER SPECS (for cost display)
// ============================================

export const EV_CHARGER_DISPLAY_INFO = {
  l1: { label: 'Level 1', power: '1.4 kW', cost: '$3,000', description: 'Standard outlet' },
  l2: { label: 'Level 2', power: '7-19 kW', cost: '$10,000', description: 'AC fast charging' },
  dcfc: { label: 'DC Fast', power: '50-150 kW', cost: '$85,000', description: 'Rapid charging' },
  hpc: { label: 'HPC', power: '250-350 kW', cost: '$180,000', description: 'Ultra-fast charging' },
};

// ============================================
// BESS SIZING RATIOS v2.0 - BENCHMARK-BACKED
// ============================================
// Sources: IEEE 4538388, MDPI Energies 11(8):2048, NREL ATB 2024, LADWP
// Methodology: https://github.com/merlin/docs/BESS_SIZING_v2.md
//
// Peak shaving targets top 20-40% of demand peaks for optimal economics
// Resilience covers critical loads during outages
// Microgrid provides full islanding capability

/**
 * BESS Power to Peak Demand Ratios by Use Case
 * 
 * | Use Case       | Ratio | Description                          | Source                    |
 * |----------------|-------|--------------------------------------|---------------------------|
 * | peak_shaving   | 0.40  | Shave top demand peaks only          | IEEE/MDPI optimization    |
 * | arbitrage      | 0.50  | Peak shaving + TOU energy shifting   | Industry practice         |
 * | resilience     | 0.70  | Cover critical loads during outages  | Critical load analysis    |
 * | microgrid      | 1.00  | Full islanding capability            | Microgrid design standards|
 * 
 * Source: IEEE 4538388, MDPI Energies 11(8):2048
 */
export const BESS_POWER_RATIOS = {
  peak_shaving: 0.40,     // 40% - optimal economic sizing for demand charge reduction
  arbitrage: 0.50,        // 50% - peak shaving + time-of-use shifting
  resilience: 0.70,       // 70% - cover critical loads during outages
  microgrid: 1.00,        // 100% - full island capability
  demand_response: 0.50,  // 50% - utility DR program participation
  default: 0.40,          // Default to peak_shaving (most common use case)
};

/**
 * Critical Load Percentages by Industry
 * 
 * Generator sizing = criticalLoad × 1.25 (reserve margin)
 * 
 * Sources: LADWP Backup Power Guide, NEC 700/701/702/708, WPP Sizing Guide
 * 
 * | Industry          | Critical % | Rationale                              |
 * |-------------------|------------|----------------------------------------|
 * | data_center       | 1.00       | 100% uptime, all loads critical        |
 * | hospital          | 0.85       | Life safety, some deferrable           |
 * | airport           | 0.55       | FAA systems, security, lighting        |
 * | hotel             | 0.50       | Life safety, refrigeration, limited HVAC|
 * | casino            | 0.60       | Gaming floor, security, vault          |
 * | manufacturing     | 0.60       | Process-dependent, some deferrable     |
 * | warehouse         | 0.35       | Refrigeration, security, minimal       |
 * | retail            | 0.40       | POS, security, refrigeration           |
 * | office            | 0.45       | IT, emergency lighting, elevators      |
 * | ev_charging       | 0.30       | Can defer non-critical charging        |
 * | car_wash          | 0.25       | Can close during outage, minimal       |
 * | agriculture       | 0.50       | Irrigation, refrigeration              |
 * | university        | 0.50       | Research, residence halls              |
 */
export const CRITICAL_LOAD_PERCENTAGES: Record<string, number> = {
  // Tier 1: Mission Critical (85-100%)
  'data-center': 1.00,    // 100% uptime requirement, all loads critical
  'hospital': 0.85,       // Life safety systems, some deferrable loads
  
  // Tier 2: High Priority (55-70%)
  'government': 0.60,     // Essential services, emergency operations
  'casino': 0.60,         // Gaming floor, security, vault systems
  'tribal-casino': 0.60,  // Same as casino
  'manufacturing': 0.60,  // Process continuity, some lines deferrable
  'airport': 0.55,        // FAA-required systems, security, lighting
  
  // Tier 3: Moderate (45-55%)
  'hotel': 0.50,          // Life safety, refrigeration, limited HVAC
  'agriculture': 0.50,    // Irrigation pumps, refrigeration
  'agricultural': 0.50,   // Alias for agriculture
  'indoor-farm': 0.50,    // Growing systems, climate control
  'college': 0.50,        // Research facilities, residence halls
  'university': 0.50,     // Alias for college
  
  // Tier 4: Lower Priority (35-45%)
  'office': 0.45,         // IT, elevators, emergency lighting
  'retail': 0.40,         // POS, security, refrigeration
  'shopping-center': 0.40,// Common areas, anchor stores
  'logistics-center': 0.40,// Loading docks, minimal critical
  'warehouse': 0.35,      // Refrigeration (if any), security, minimal
  
  // Tier 5: Minimal (25-35%)
  'ev-charging': 0.30,    // Can defer non-critical charging
  'ev_charging_hub': 0.30,// Alias
  'apartment': 0.30,      // Common areas, elevators
  'residential': 0.25,    // Essential circuits only
  'car-wash': 0.25,       // Can close during outage, minimal critical
  
  // Special Cases
  'cold-storage': 0.70,   // Perishable inventory protection
  'microgrid': 1.00,      // Full island by definition
  'gas-station': 0.55,    // Fuel pumps, POS, canopy lights
  
  // Default fallback
  'commercial': 0.50,     // Generic commercial fallback
  'default': 0.50,        // Unknown use cases
};

/**
 * Solar-to-Battery Ratio (ILR-Based)
 * 
 * Based on NREL's Inverter Loading Ratio (ILR) convention.
 * DC-coupled systems benefit from capturing clipped energy.
 * 
 * | Coupling Type        | Ratio | Notes                            |
 * |----------------------|-------|----------------------------------|
 * | dc_coupled (default) | 1.40  | Captures clipped energy          |
 * | dc_coupled_aggressive| 1.70  | Higher yield, more clipping      |
 * | ac_coupled           | 1.00  | Separate inverters, no clipping  |
 * 
 * Source: NREL ATB 2024, EIA Today in Energy
 */
export const SOLAR_BATTERY_RATIOS = {
  dc_coupled: 1.40,           // Default - captures clipped energy
  dc_coupled_aggressive: 1.70,// Higher energy yield
  ac_coupled: 1.00,           // No clipping benefit
};

// Convenience export for default ratio
export const SOLAR_TO_BESS_RATIO = SOLAR_BATTERY_RATIOS.dc_coupled;

/**
 * Wind to BESS Ratio
 * Lower than solar due to capacity factor differences and variability
 */
export const WIND_TO_BESS_RATIO = 0.6; // 60% of BESS capacity

/**
 * Generator Reserve Margin
 * 
 * 25% reserve for motor starting currents and load growth.
 * Source: LADWP, NEC 700/701/702, WPP Generator Sizing Guide
 */
export const GENERATOR_RESERVE_MARGIN = 1.25;

// Alias for backward compatibility
export const GENERATOR_SAFETY_FACTOR = GENERATOR_RESERVE_MARGIN;

/**
 * Validation limits for sizing parameters
 */
export const SIZING_VALIDATION = {
  peakDemand_kW: { min: 10, max: 500000 },
  batteryDuration_hours: { min: 0.5, max: 12 },
  bess_peak_ratio: { min: 0.1, max: 1.5 },
  solar_battery_ratio: { min: 0.5, max: 3.0 },
  critical_load_pct: { min: 0.1, max: 1.0 },
  generator_reserve_margin: { min: 1.0, max: 1.5 },
};

/**
 * Get the appropriate BESS power ratio based on use case
 * @param useCase - 'peak_shaving' | 'arbitrage' | 'resilience' | 'microgrid'
 */
export function getBESSPowerRatio(useCase: string): number {
  return BESS_POWER_RATIOS[useCase as keyof typeof BESS_POWER_RATIOS] 
    || BESS_POWER_RATIOS.default;
}

/**
 * Get the appropriate BESS power ratio based on user goals (wizard UI)
 * Maps wizard goal selections to use cases
 */
export function getBESSPowerRatioFromGoals(goals: string[]): number {
  if (goals.includes('grid-independence')) return BESS_POWER_RATIOS.microgrid;
  if (goals.includes('backup-power')) return BESS_POWER_RATIOS.resilience;
  if (goals.includes('demand-management')) return BESS_POWER_RATIOS.peak_shaving;
  if (goals.includes('cost-savings')) return BESS_POWER_RATIOS.arbitrage;
  return BESS_POWER_RATIOS.default;
}

/**
 * Get critical load percentage for an industry/use case
 * @param industryType - Industry slug (e.g., 'hotel', 'data-center')
 */
export function getCriticalLoadPercentage(industryType: string): number {
  // Normalize slug (handle both dash and underscore variants)
  const normalized = industryType.toLowerCase().replace(/_/g, '-');
  return CRITICAL_LOAD_PERCENTAGES[normalized] 
    || CRITICAL_LOAD_PERCENTAGES['default'];
}

/**
 * Calculate complete system sizing based on facility parameters
 * All ratios traceable to NREL ATB, IEEE, and industry benchmarks
 * 
 * @param params - Facility parameters
 * @returns Sized system components with metadata
 */
export interface SystemSizingParams {
  peakDemand_kW: number;
  useCase?: 'peak_shaving' | 'arbitrage' | 'resilience' | 'microgrid';
  industryType?: string;
  batteryDuration_hours?: number;
  couplingType?: 'dc_coupled' | 'dc_coupled_aggressive' | 'ac_coupled';
  includeSolar?: boolean;
  includeGenerator?: boolean;
}

export interface SystemSizingResult {
  bessPower_kW: number;
  bessEnergy_kWh: number;
  solarPower_kW: number;
  generatorPower_kW: number;
  criticalLoad_kW: number;
  sizing_metadata: {
    methodology_version: string;
    bess_ratio_applied: number;
    bess_ratio_source: string;
    solar_ratio_applied: number | null;
    solar_ratio_source: string;
    critical_load_pct_applied: number;
    generator_reserve_margin: number;
    generator_source: string;
  };
}

export function calculateSystemSizing(params: SystemSizingParams): SystemSizingResult {
  const {
    peakDemand_kW,
    useCase = 'peak_shaving',
    industryType = 'commercial',
    batteryDuration_hours = 4,
    couplingType = 'dc_coupled',
    includeSolar = true,
    includeGenerator = true,
  } = params;

  // --- BESS Sizing ---
  const bessRatio = getBESSPowerRatio(useCase);
  const bessPower_kW = peakDemand_kW * bessRatio;
  const bessEnergy_kWh = bessPower_kW * batteryDuration_hours;

  // --- Solar Sizing (relative to BESS, not peak demand) ---
  const solarRatio = SOLAR_BATTERY_RATIOS[couplingType] || SOLAR_BATTERY_RATIOS.dc_coupled;
  const solarPower_kW = includeSolar ? bessPower_kW * solarRatio : 0;

  // --- Generator Sizing (based on critical load) ---
  const criticalLoadPct = getCriticalLoadPercentage(industryType);
  const criticalLoad_kW = peakDemand_kW * criticalLoadPct;
  const generatorPower_kW = includeGenerator 
    ? criticalLoad_kW * GENERATOR_RESERVE_MARGIN 
    : 0;

  return {
    bessPower_kW: Math.round(bessPower_kW),
    bessEnergy_kWh: Math.round(bessEnergy_kWh),
    solarPower_kW: Math.round(solarPower_kW),
    generatorPower_kW: Math.round(generatorPower_kW),
    criticalLoad_kW: Math.round(criticalLoad_kW),
    sizing_metadata: {
      methodology_version: '2.0.0',
      bess_ratio_applied: bessRatio,
      bess_ratio_source: 'IEEE 4538388, MDPI Energies 11(8):2048',
      solar_ratio_applied: includeSolar ? solarRatio : null,
      solar_ratio_source: 'NREL ATB 2024 Utility-Scale PV-Plus-Battery',
      critical_load_pct_applied: criticalLoadPct,
      generator_reserve_margin: GENERATOR_RESERVE_MARGIN,
      generator_source: 'LADWP, NEC 700/701/702, WPP Sizing Guide',
    },
  };
}
