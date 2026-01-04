/**
 * STEP 1: LOCATION - Vineet's Two-Column Design
 * ==============================================
 * 
 * Layout:
 * - LEFT: Your Location (region toggle, dropdowns, location details)
 * - RIGHT: Your Goals (6 cards in 2x3 grid, progress bar)
 * 
 * Design: Purple theme with gradient cards
 * Updated: January 2026
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Globe, Zap, Sun, Star, ChevronDown, Check } from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';

// ============================================================================
// INTERNATIONAL LOCATION DATA
// ============================================================================

interface CountryData {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  cities: CityData[];
}

interface CityData {
  name: string;
  electricityRate: number;
  sunHours: number;
  solarRating: 'A' | 'B' | 'C' | 'D';
  solarLabel: string;
}

const INTERNATIONAL_DATA: CountryData[] = [
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'SAR',
    cities: [
      { name: 'Riyadh', electricityRate: 0.04, sunHours: 6.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Jeddah', electricityRate: 0.04, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Dammam', electricityRate: 0.04, sunHours: 6.4, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Mecca', electricityRate: 0.04, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Medina', electricityRate: 0.04, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    cities: [
      { name: 'Dubai', electricityRate: 0.08, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Abu Dhabi', electricityRate: 0.07, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Sharjah', electricityRate: 0.08, sunHours: 6.1, solarRating: 'A', solarLabel: 'Excellent' },
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    cities: [
      { name: 'London', electricityRate: 0.28, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Manchester', electricityRate: 0.27, sunHours: 3.5, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Birmingham', electricityRate: 0.27, sunHours: 3.6, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Edinburgh', electricityRate: 0.28, sunHours: 3.3, solarRating: 'C', solarLabel: 'Moderate' },
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Berlin', electricityRate: 0.35, sunHours: 3.5, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Munich', electricityRate: 0.34, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Frankfurt', electricityRate: 0.35, sunHours: 3.6, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Hamburg', electricityRate: 0.35, sunHours: 3.3, solarRating: 'C', solarLabel: 'Moderate' },
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    cities: [
      { name: 'Sydney', electricityRate: 0.25, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Melbourne', electricityRate: 0.26, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Brisbane', electricityRate: 0.24, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Perth', electricityRate: 0.28, sunHours: 6.0, solarRating: 'A', solarLabel: 'Excellent' },
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    currencySymbol: '¥',
    cities: [
      { name: 'Tokyo', electricityRate: 28, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Osaka', electricityRate: 27, sunHours: 4.4, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Nagoya', electricityRate: 27, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    cities: [
      { name: 'Singapore', electricityRate: 0.22, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
    ]
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    cities: [
      { name: 'Mumbai', electricityRate: 8.5, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Delhi', electricityRate: 7.5, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Bangalore', electricityRate: 7.0, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Chennai', electricityRate: 6.5, sunHours: 5.6, solarRating: 'A', solarLabel: 'Excellent' },
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    currencySymbol: '$',
    cities: [
      { name: 'Mexico City', electricityRate: 1.8, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Guadalajara', electricityRate: 1.7, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Monterrey', electricityRate: 1.9, sunHours: 5.6, solarRating: 'A', solarLabel: 'Excellent' },
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
    cities: [
      { name: 'Toronto', electricityRate: 0.13, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Vancouver', electricityRate: 0.11, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Calgary', electricityRate: 0.12, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Montreal', electricityRate: 0.07, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
    ]
  },
];

// ============================================================================
// US STATE DATA
// ============================================================================

interface USStateData {
  name: string;
  abbreviation: string;
  electricityRate: number;
  sunHours: number;
  solarRating: 'A' | 'B' | 'C' | 'D';
  solarLabel: string;
}

const US_STATE_DATA: Record<string, USStateData> = {
  'NV': { name: 'Nevada', abbreviation: 'NV', electricityRate: 0.0934, sunHours: 6.4, solarRating: 'A', solarLabel: 'Excellent' },
  'CA': { name: 'California', abbreviation: 'CA', electricityRate: 0.2250, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  'AZ': { name: 'Arizona', abbreviation: 'AZ', electricityRate: 0.1150, sunHours: 6.6, solarRating: 'A', solarLabel: 'Excellent' },
  'TX': { name: 'Texas', abbreviation: 'TX', electricityRate: 0.1180, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  'FL': { name: 'Florida', abbreviation: 'FL', electricityRate: 0.1280, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
  'NY': { name: 'New York', abbreviation: 'NY', electricityRate: 0.1950, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'CO': { name: 'Colorado', abbreviation: 'CO', electricityRate: 0.1280, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  'WA': { name: 'Washington', abbreviation: 'WA', electricityRate: 0.0980, sunHours: 4.0, solarRating: 'C', solarLabel: 'Moderate' },
  'MA': { name: 'Massachusetts', abbreviation: 'MA', electricityRate: 0.2200, sunHours: 4.3, solarRating: 'B', solarLabel: 'Very Good' },
  'IL': { name: 'Illinois', abbreviation: 'IL', electricityRate: 0.1350, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'GA': { name: 'Georgia', abbreviation: 'GA', electricityRate: 0.1200, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
  'NC': { name: 'North Carolina', abbreviation: 'NC', electricityRate: 0.1100, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'NJ': { name: 'New Jersey', abbreviation: 'NJ', electricityRate: 0.1650, sunHours: 4.4, solarRating: 'B', solarLabel: 'Very Good' },
  'PA': { name: 'Pennsylvania', abbreviation: 'PA', electricityRate: 0.1400, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'OH': { name: 'Ohio', abbreviation: 'OH', electricityRate: 0.1250, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
  'MI': { name: 'Michigan', abbreviation: 'MI', electricityRate: 0.1550, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
  'NM': { name: 'New Mexico', abbreviation: 'NM', electricityRate: 0.1200, sunHours: 6.5, solarRating: 'A', solarLabel: 'Excellent' },
  'UT': { name: 'Utah', abbreviation: 'UT', electricityRate: 0.1050, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  'OR': { name: 'Oregon', abbreviation: 'OR', electricityRate: 0.1100, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'HI': { name: 'Hawaii', abbreviation: 'HI', electricityRate: 0.3500, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
};

function getStateFromZip(zip: string): string | null {
  const prefix = parseInt(zip.substring(0, 3));
  if (prefix >= 889 && prefix <= 898) return 'NV';
  if (prefix >= 900 && prefix <= 961) return 'CA';
  if (prefix >= 850 && prefix <= 865) return 'AZ';
  if (prefix >= 750 && prefix <= 799) return 'TX';
  if (prefix >= 320 && prefix <= 349) return 'FL';
  if (prefix >= 100 && prefix <= 149) return 'NY';
  if (prefix >= 800 && prefix <= 816) return 'CO';
  if (prefix >= 980 && prefix <= 994) return 'WA';
  if (prefix >= 10 && prefix <= 27) return 'MA';
  if (prefix >= 600 && prefix <= 629) return 'IL';
  if (prefix >= 300 && prefix <= 319) return 'GA';
  if (prefix >= 270 && prefix <= 289) return 'NC';
  if (prefix >= 70 && prefix <= 89) return 'NJ';
  if (prefix >= 150 && prefix <= 196) return 'PA';
  if (prefix >= 430 && prefix <= 459) return 'OH';
  if (prefix >= 480 && prefix <= 499) return 'MI';
  if (prefix >= 870 && prefix <= 884) return 'NM';
  if (prefix >= 840 && prefix <= 847) return 'UT';
  if (prefix >= 970 && prefix <= 979) return 'OR';
  if (prefix >= 967 && prefix <= 968) return 'HI';
  return null;
}

// ============================================================================
// ENERGY GOALS
// ============================================================================

const ENERGY_GOALS: { id: EnergyGoal; label: string; description: string; emoji: string }[] = [
  { id: 'reduce_costs', label: 'Cut Energy Costs', description: 'Reduce monthly electricity bills', emoji: '✂️' },
  { id: 'backup_power', label: 'Backup Power', description: 'Stay powered during outages', emoji: '🔋' },
  { id: 'sustainability', label: 'Sustainability', description: 'Reduce carbon footprint', emoji: '🌱' },
  { id: 'grid_independence', label: 'Grid Independence', description: 'Less reliance on utilities', emoji: '🏠' },
  { id: 'peak_shaving', label: 'Peak Shaving', description: 'Avoid peak rate charges', emoji: '⚡' },
  { id: 'generate_revenue', label: 'Generate Revenue', description: 'Sell excess power back', emoji: '💵' },
];

const MIN_GOALS_REQUIRED = 3;

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
}

export function Step1Location({ state, updateState }: Props) {
  const [region, setRegion] = useState<'us' | 'international'>('us');
  const [zipInput, setZipInput] = useState(state.zipCode || '');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const locationData = useMemo(() => {
    if (region === 'us' && zipInput.length >= 5) {
      const stateCode = getStateFromZip(zipInput);
      if (stateCode && US_STATE_DATA[stateCode]) {
        const stateData = US_STATE_DATA[stateCode];
        return {
          displayName: `${stateData.name}, USA`,
          electricityRate: stateData.electricityRate,
          currencySymbol: '$',
          sunHours: stateData.sunHours,
          solarRating: stateData.solarRating,
          solarLabel: stateData.solarLabel,
          stateCode,
        };
      }
    }
    
    if (region === 'international' && selectedCountry && selectedCity) {
      const country = INTERNATIONAL_DATA.find(c => c.code === selectedCountry);
      if (country) {
        const city = country.cities.find(c => c.name === selectedCity);
        if (city) {
          return {
            displayName: `${city.name}, ${country.name}`,
            electricityRate: city.electricityRate,
            currencySymbol: country.currencySymbol,
            sunHours: city.sunHours,
            solarRating: city.solarRating,
            solarLabel: city.solarLabel,
            countryCode: country.code,
          };
        }
      }
    }
    
    return null;
  }, [region, zipInput, selectedCountry, selectedCity]);

  useEffect(() => {
    if (region === 'us' && zipInput.length >= 5) {
      const stateCode = getStateFromZip(zipInput);
      console.log('💾 Step 1: Saving zipCode to state', { zipCode: zipInput, stateCode: stateCode || 'US (default)' });
      updateState({
        zipCode: zipInput,
        state: stateCode || 'US',
        city: '',
        solarData: locationData ? { sunHours: locationData.sunHours, rating: locationData.solarLabel } : undefined
      });
    } else if (region === 'us' && zipInput.length > 0 && zipInput.length < 5) {
      if (state.zipCode && state.zipCode.length >= 5) {
        updateState(prev => ({ ...prev, zipCode: '', state: '' }));
      }
    }
    
    if (region === 'international' && selectedCountry && selectedCity) {
      updateState({
        zipCode: '',
        state: selectedCountry,
        city: selectedCity,
        solarData: locationData ? { sunHours: locationData.sunHours, rating: locationData.solarLabel } : undefined
      });
    }
  }, [region, zipInput, selectedCountry, selectedCity, locationData, updateState, state.zipCode]);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipInput(value);
  };

  const toggleGoal = (goalId: EnergyGoal) => {
    const currentGoals = state.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(g => g !== goalId)
      : [...currentGoals, goalId];
    updateState({ goals: newGoals });
  };

  const selectedGoalsCount = state.goals?.length || 0;
  const goalsRemaining = Math.max(0, MIN_GOALS_REQUIRED - selectedGoalsCount);

  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    const country = INTERNATIONAL_DATA.find(c => c.code === selectedCountry);
    return country?.cities || [];
  }, [selectedCountry]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
      {/* LEFT COLUMN: YOUR LOCATION */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <h2 className="text-xl font-bold text-white">Your Location</h2>
            <p className="text-slate-400 text-sm">Select your region to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setRegion('us'); setSelectedCountry(''); setSelectedCity(''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              region === 'us' ? 'bg-purple-500/20 border-purple-400/60' : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500'
            }`}
          >
            <span className="text-3xl">🇺🇸</span>
            <span className={`font-medium text-sm ${region === 'us' ? 'text-white' : 'text-slate-300'}`}>United States</span>
          </button>

          <button
            onClick={() => { setRegion('international'); setZipInput(''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              region === 'international' ? 'bg-gradient-to-br from-purple-500/30 to-violet-500/30 border-purple-400/60' : 'bg-slate-800/50 border-slate-600/30 hover:border-slate-500'
            }`}
          >
            <Globe className={`w-8 h-8 ${region === 'international' ? 'text-purple-300' : 'text-slate-400'}`} />
            <span className={`font-medium text-sm ${region === 'international' ? 'text-white' : 'text-slate-300'}`}>International</span>
          </button>
        </div>

        <div className="space-y-4">
          {region === 'us' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Enter ZIP Code</label>
              <input
                type="text"
                value={zipInput}
                onChange={handleZipChange}
                placeholder="e.g., 89052"
                className="w-full px-4 py-3 text-lg bg-purple-500/20 border border-purple-400/40 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Select Country</label>
                <button
                  onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCityDropdownOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-left hover:border-purple-400/50 transition-all"
                >
                  {selectedCountry ? (
                    <span className="flex items-center gap-3 text-white">
                      <span className="text-xl">{INTERNATIONAL_DATA.find(c => c.code === selectedCountry)?.flag}</span>
                      {INTERNATIONAL_DATA.find(c => c.code === selectedCountry)?.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">Choose a country</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {countryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {INTERNATIONAL_DATA.map(country => (
                      <button
                        key={country.code}
                        onClick={() => { setSelectedCountry(country.code); setSelectedCity(''); setCountryDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-500/20 text-left transition-colors"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-white">{country.name}</span>
                        {selectedCountry === country.code && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCountry && (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 border border-green-500/30 rounded-xl">
                  <span className="text-2xl">{INTERNATIONAL_DATA.find(c => c.code === selectedCountry)?.flag}</span>
                  <div>
                    <span className="text-green-400 font-medium">{INTERNATIONAL_DATA.find(c => c.code === selectedCountry)?.name}</span>
                    <div className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3 h-3" />Selected</div>
                  </div>
                </div>
              )}

              {selectedCountry && (
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Select City</label>
                  <button
                    onClick={() => { setCityDropdownOpen(!cityDropdownOpen); setCountryDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-left hover:border-purple-400/50 transition-all"
                  >
                    {selectedCity ? <span className="text-white">{selectedCity}</span> : <span className="text-slate-400">Choose a city</span>}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {cityDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {availableCities.map(city => (
                        <button
                          key={city.name}
                          onClick={() => { setSelectedCity(city.name); setCityDropdownOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-500/20 text-left transition-colors"
                        >
                          <span className="text-white">{city.name}</span>
                          {selectedCity === city.name && <Check className="w-4 h-4 text-green-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {locationData && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="font-medium">Location Details</span>
              </div>
              <span className="text-purple-300 font-medium text-sm">{locationData.displayName}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-3 text-center">
                <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] text-emerald-300 uppercase tracking-wide mb-1">Commercial<br/>Electricity Rate</div>
                <div className="text-lg font-bold text-white">{locationData.currencySymbol}{locationData.electricityRate.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-300">per kWh</div>
              </div>

              <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-3 text-center">
                <Sun className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-[10px] text-amber-300 uppercase tracking-wide mb-1">Peak<br/>Sun Hours</div>
                <div className="text-lg font-bold text-white">{locationData.sunHours}</div>
                <div className="text-[10px] text-amber-300">hrs/day</div>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-[10px] text-blue-300 uppercase tracking-wide mb-1">Solar<br/>Rating</div>
                <div className="text-base font-bold text-white mb-1">{locationData.solarLabel}</div>
                <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">{locationData.solarRating}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: YOUR GOALS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h2 className="text-xl font-bold text-white">Your Goals</h2>
            <p className="text-slate-400 text-sm">Select at least 3 priorities</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ENERGY_GOALS.map((goal) => {
            const isSelected = state.goals?.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                  isSelected ? 'bg-purple-500/40 border-2 border-purple-400/60' : 'bg-purple-500/20 border-2 border-purple-400/20 hover:border-purple-400/40'
                }`}
              >
                <span className="text-3xl mb-2">{goal.emoji}</span>
                <h3 className={`text-sm font-semibold mb-1 text-center ${isSelected ? 'text-white' : 'text-slate-200'}`}>{goal.label}</h3>
                <p className={`text-xs text-center ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>{goal.description}</p>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${goalsRemaining > 0 ? 'text-slate-400' : 'text-green-400'}`}>
              {goalsRemaining > 0 ? `Select ${goalsRemaining} more goal${goalsRemaining > 1 ? 's' : ''}` : '✓ Ready to continue'}
            </span>
            <span className={`font-medium ${selectedGoalsCount >= MIN_GOALS_REQUIRED ? 'text-green-400' : 'text-slate-400'}`}>{selectedGoalsCount}/6</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${selectedGoalsCount >= MIN_GOALS_REQUIRED ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'}`}
              style={{ width: `${(selectedGoalsCount / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Step1Location;
