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
 * 
 * SSOT: Imports location data from @/services/data
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Globe, Zap, Sun, Star, ChevronDown, Check } from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';

// SSOT Imports - All location data comes from centralized data files
import { 
  US_STATE_DATA, 
  getStateFromZip, 
  getStateData,
  isValidUSZip,
  type StateElectricityData 
} from '@/services/data/stateElectricityRates';
import { 
  INTERNATIONAL_DATA, 
  getCountryData, 
  getCityData,
  type InternationalCountry,
  type InternationalCity 
} from '@/services/data/internationalRates';

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
  const [zipError, setZipError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const locationData = useMemo(() => {
    if (region === 'us' && state.state) {
      const stateData = getStateData(state.state);
      if (stateData) {
        return {
          electricityRate: stateData.electricityRate,
          sunHours: stateData.sunHours,
          solarRating: stateData.solarRating,
          solarLabel: stateData.solarLabel,
        };
      }
    } else if (region === 'international' && selectedCountry && selectedCity) {
      const cityData = getCityData(selectedCountry, selectedCity);
      if (cityData) {
        return {
          electricityRate: cityData.electricityRate,
          sunHours: cityData.sunHours,
          solarRating: cityData.solarRating,
          solarLabel: cityData.solarLabel,
        };
      }
    }
    return null;
  }, [region, state.state, selectedCountry, selectedCity]);

  // Handle zip code changes with validation
  useEffect(() => {
    if (region === 'us' && zipInput.length === 5) {
      const stateCode = getStateFromZip(zipInput);
      if (stateCode) {
        const stateData = getStateData(stateCode);
        if (stateData) {
          setZipError(null);
          updateState({
            zipCode: zipInput,
            state: stateCode,
            city: stateData.name,
            country: 'US',
            electricityRate: stateData.electricityRate,
            solarData: {
              sunHours: stateData.sunHours,
              rating: stateData.solarLabel,
            },
            currency: 'USD',
          });
        } else {
          setZipError('Please enter a valid US zip code');
        }
      } else {
        setZipError('Please enter a valid US zip code');
      }
    } else if (region === 'us' && zipInput.length > 0 && zipInput.length < 5) {
      // Clear error while typing
      setZipError(null);
    }
  }, [zipInput, region, updateState]);

  // Handle international location changes
  useEffect(() => {
    if (region === 'international' && selectedCountry && selectedCity) {
      const country = getCountryData(selectedCountry);
      const city = getCityData(selectedCountry, selectedCity);
      
      if (country && city) {
        updateState({
          zipCode: '',
          state: selectedCity,
          city: selectedCity,
          country: selectedCountry,
          electricityRate: city.electricityRate,
          solarData: {
            sunHours: city.sunHours,
            rating: city.solarLabel,
          },
          currency: country.currency,
        });
      }
    }
  }, [selectedCountry, selectedCity, region, updateState]);

  // Toggle goal selection
  const toggleGoal = (goalId: EnergyGoal) => {
    const currentGoals = state.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(g => g !== goalId)
      : [...currentGoals, goalId];
    updateState({ goals: newGoals });
  };

  const selectedGoalsCount = state.goals?.length || 0;
  const hasEnoughGoals = selectedGoalsCount >= MIN_GOALS_REQUIRED;

  const selectedCountryData = selectedCountry ? getCountryData(selectedCountry) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: Your Location */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Your Location</h2>
        </div>

        {/* Region Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRegion('us')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              region === 'us'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🇺🇸 United States
          </button>
          <button
            onClick={() => setRegion('international')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              region === 'international'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            International
          </button>
        </div>

        {/* US Zip Code Input */}
        {region === 'us' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your zip code
            </label>
            <input
              type="text"
              value={zipInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                setZipInput(value);
              }}
              placeholder="e.g., 89101"
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                zipError ? 'border-red-300 bg-red-50' : 'border-gray-200'
              } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-lg`}
            />
            {zipError && (
              <p className="mt-2 text-sm text-red-600">{zipError}</p>
            )}
          </div>
        )}

        {/* International Dropdowns */}
        {region === 'international' && (
          <div className="space-y-4 mb-6">
            {/* Country Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Country
              </label>
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-between hover:border-purple-300 transition-all"
              >
                <span className={selectedCountry ? 'text-gray-800' : 'text-gray-400'}>
                  {selectedCountryData
                    ? `${selectedCountryData.flag} ${selectedCountryData.name}`
                    : 'Select a country...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {countryDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {INTERNATIONAL_DATA.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country.code);
                        setSelectedCity('');
                        setCountryDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center gap-3 transition-colors"
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-gray-800">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City Dropdown */}
            {selectedCountryData && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select City
                </label>
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-between hover:border-purple-300 transition-all"
                >
                  <span className={selectedCity ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedCity || 'Select a city...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {cityDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {selectedCountryData.cities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setSelectedCity(city.name);
                          setCityDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors"
                      >
                        <span className="text-gray-800">{city.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location Details Card */}
        {locationData && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
            <h3 className="font-semibold text-gray-800 mb-4">
              📍 {region === 'us' ? `${state.city || state.state}, ${state.state}` : `${selectedCity}, ${selectedCountryData?.name}`}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Electricity Rate</div>
                  <div className="font-semibold text-gray-800">
                    ${locationData.electricityRate.toFixed(4)}/kWh
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Sun className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Sun Hours</div>
                  <div className="font-semibold text-gray-800">
                    {locationData.sunHours} hrs/day
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  locationData.solarRating === 'A' ? 'bg-green-100' :
                  locationData.solarRating === 'B' ? 'bg-blue-100' :
                  locationData.solarRating === 'C' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Star className={`w-5 h-5 ${
                    locationData.solarRating === 'A' ? 'text-green-600' :
                    locationData.solarRating === 'B' ? 'text-blue-600' :
                    locationData.solarRating === 'C' ? 'text-yellow-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Solar Potential</div>
                  <div className="font-semibold text-gray-800">
                    {locationData.solarRating} - {locationData.solarLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Your Goals */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Your Goals</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasEnoughGoals ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {selectedGoalsCount}/{MIN_GOALS_REQUIRED} selected
          </div>
        </div>

        {!hasEnoughGoals && (
          <p className="text-sm text-gray-500 mb-4">
            Select at least {MIN_GOALS_REQUIRED} goals to continue
          </p>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-2 gap-3">
          {ENERGY_GOALS.map((goal) => {
            const isSelected = state.goals?.includes(goal.id);
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                      {goal.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {goal.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                hasEnoughGoals ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, (selectedGoalsCount / MIN_GOALS_REQUIRED) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
