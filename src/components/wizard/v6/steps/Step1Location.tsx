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
import { MapPin, Globe, Zap, Sun, Star, ChevronDown, Check, Search, Building2, Loader2 } from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';
import { MerlinGuide, MERLIN_MESSAGES } from '../MerlinGuide';

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

import {
  lookupBusinessByAddress,
  getStaticMapUrl,
  INDUSTRY_NAMES,
  type PlaceLookupResult
} from '@/services/googlePlacesService';

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

const MIN_GOALS_REQUIRED = 2;

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
  
  // Address lookup state
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [businessLookup, setBusinessLookup] = useState<PlaceLookupResult | null>(null);
  const [showAddressField, setShowAddressField] = useState(false);

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

  // Handle address lookup
  const handleAddressLookup = async () => {
    if (!businessNameInput.trim() && !streetAddress.trim()) return;
    
    // Combine business name + address + location for best results
    const searchQuery = region === 'us' 
      ? `${businessNameInput}${streetAddress ? ', ' + streetAddress : ''}, ${zipInput}`
      : `${businessNameInput}${streetAddress ? ', ' + streetAddress : ''}, ${selectedCity}, ${selectedCountry}`;
    
    setIsLookingUp(true);
    try {
      const result = await lookupBusinessByAddress(searchQuery.trim());
      setBusinessLookup(result);
      
      // If business found, update state with business info
      if (result.found && result.businessName) {
        updateState({
          businessName: result.businessName,
          businessAddress: result.formattedAddress,
          businessPhotoUrl: result.photoUrl,
          businessPlaceId: result.placeId,
          detectedIndustry: result.industrySlug,
          businessLat: result.lat,
          businessLng: result.lng,
        });
      }
    } catch (error) {
      console.error('Address lookup failed:', error);
      setBusinessLookup({ found: false });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Clear business lookup when zip changes
  useEffect(() => {
    if (businessLookup) {
      setBusinessLookup(null);
      setBusinessNameInput('');
      setStreetAddress('');
      updateState({
        businessName: undefined,
        businessAddress: undefined,
        businessPhotoUrl: undefined,
        businessPlaceId: undefined,
        detectedIndustry: undefined,
        businessLat: undefined,
        businessLng: undefined,
      });
    }
  }, [zipInput, selectedCity]);

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
    <div className="relative">
      {/* Merlin Advisor - Fixed Position */}
      <MerlinGuide message={MERLIN_MESSAGES.step1} />
      
      {/* MERLIN'S LOCATION INSIGHTS PANEL */}
      {locationData && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-800 via-slate-800/95 to-slate-800 border border-amber-500/30 shadow-xl shadow-amber-500/10">
          <div className="flex items-start gap-4">
            {/* Merlin Avatar */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-amber-300">
                <span className="text-3xl">🧙</span>
              </div>
            </div>
            
            {/* Recommendation Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 font-bold text-lg">Merlin's Analysis</span>
                <span className="text-slate-400">•</span>
                <span className="text-white font-medium">
                  {region === 'us' 
                    ? `${US_STATE_DATA[state.state]?.name || state.state}, ${state.state}`
                    : `${selectedCity}, ${selectedCountry}`
                  }
                </span>
              </div>
              
              {/* Smart Recommendation Message */}
              <div className="text-slate-200 text-sm mb-4 leading-relaxed">
                {locationData.sunHours >= 5.5 ? (
                  <>
                    <span className="text-green-400 font-semibold">☀️ Great news!</span> Your location has excellent solar potential with{' '}
                    <span className="text-amber-300 font-bold">{locationData.sunHours} peak sun hours/day</span>.
                    {locationData.electricityRate > 0.12 ? (
                      <> Your utility rate of <span className="text-red-400 font-bold">${locationData.electricityRate.toFixed(4)}/kWh</span> is above average — <span className="text-green-300">solar + BESS will maximize your savings!</span></>
                    ) : locationData.electricityRate > 0.08 ? (
                      <> With a rate of <span className="text-amber-300">${locationData.electricityRate.toFixed(4)}/kWh</span>, you'll see solid returns on solar + battery storage.</>
                    ) : (
                      <> Your low rate of <span className="text-green-300">${locationData.electricityRate.toFixed(4)}/kWh</span> means BESS for peak shaving and backup power is your best strategy.</>
                    )}
                  </>
                ) : locationData.sunHours >= 4.5 ? (
                  <>
                    <span className="text-amber-400 font-semibold">🌤️ Good potential!</span> Your location has{' '}
                    <span className="text-amber-300 font-bold">{locationData.sunHours} peak sun hours/day</span>.
                    {locationData.electricityRate > 0.15 ? (
                      <> Your high utility rate of <span className="text-red-400 font-bold">${locationData.electricityRate.toFixed(4)}/kWh</span> makes <span className="text-purple-300">BESS + solar a smart investment</span> for demand charge reduction.</>
                    ) : (
                      <> Solar paired with battery storage will help reduce your energy costs and provide backup power.</>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-blue-400 font-semibold">⚡ Consider hybrid power.</span> Your location has{' '}
                    <span className="text-amber-300">{locationData.sunHours} peak sun hours/day</span> — solar output may be limited.
                    <span className="text-purple-300"> I recommend a <span className="font-semibold">generator + BESS combination</span> for reliable power, peak shaving, and backup during outages.</span>
                  </>
                )}
              </div>
              
              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">{locationData.sunHours} hrs/day</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm font-medium">${locationData.electricityRate.toFixed(4)}/kWh</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  locationData.solarRating === 'A' ? 'bg-green-500/10 border border-green-500/30' :
                  locationData.solarRating === 'B' ? 'bg-amber-500/10 border border-amber-500/30' :
                  'bg-blue-500/10 border border-blue-500/30'
                }`}>
                  <Star className={`w-4 h-4 ${
                    locationData.solarRating === 'A' ? 'text-green-400' :
                    locationData.solarRating === 'B' ? 'text-amber-400' :
                    'text-blue-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    locationData.solarRating === 'A' ? 'text-green-200' :
                    locationData.solarRating === 'B' ? 'text-amber-200' :
                    'text-blue-200'
                  }`}>{locationData.solarRating} - {locationData.solarLabel}</span>
                </div>
              </div>
              
              {/* What Merlin Does - Explanation */}
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <p className="text-slate-300 text-xs leading-relaxed">
                  <span className="text-amber-400 font-semibold">How Merlin helps:</span> Based on your location's solar irradiance, utility rates, and weather patterns, 
                  I'll design an optimal energy system combining <span className="text-purple-300">battery storage (BESS)</span>, 
                  <span className="text-amber-300"> solar panels</span>, and <span className="text-blue-300">backup generators</span> — 
                  tailored to maximize your savings and ensure reliable power for your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* LEFT COLUMN: Your Location */}
      <div className="bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-slate-600">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Your Location</h2>
        </div>

        {/* Region Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRegion('us')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              region === 'us'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-500'
            }`}
          >
            🇺🇸 United States
          </button>
          <button
            onClick={() => setRegion('international')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              region === 'international'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-500'
            }`}
          >
            <Globe className="w-4 h-4 inline mr-2" />
            International
          </button>
        </div>

        {/* US Zip Code Input */}
        {region === 'us' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
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
              className={`w-full px-4 py-4 rounded-xl border-2 text-xl font-bold text-center tracking-widest ${
                zipError 
                  ? 'border-red-400 bg-red-900/30 text-red-300 placeholder-red-400/50' 
                  : zipInput.length === 5 
                    ? 'border-green-400 bg-green-900/30 text-green-300' 
                    : 'border-purple-400 bg-slate-700 text-white placeholder-slate-400'
              } focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all`}
            />
            {zipError && (
              <p className="mt-2 text-sm text-red-400 font-medium">{zipError}</p>
            )}
            
            {/* Address Lookup Section - shown after valid zip */}
            {zipInput.length === 5 && !zipError && (
              <div className="mt-4">
                {!showAddressField && !businessLookup?.found && (
                  <button
                    onClick={() => setShowAddressField(true)}
                    className="w-full py-4 px-4 rounded-xl border-2 border-purple-400 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 hover:text-white transition-all text-base font-medium shadow-lg shadow-purple-500/20"
                  >
                    <Building2 className="w-5 h-5 inline mr-2" />
                    🏢 Add your business name & address for personalized recommendations
                  </button>
                )}
                
                {showAddressField && !businessLookup?.found && (
                  <div className="space-y-4">
                    {/* Business Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Business Name <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessNameInput}
                        onChange={(e) => setBusinessNameInput(e.target.value)}
                        placeholder="e.g., WOW Carwash, Hilton Hotel, Starbucks"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-lg"
                        autoFocus
                      />
                    </div>
                    
                    {/* Street Address Field */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Street Address <span className="text-slate-500">(optional, improves accuracy)</span>
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="e.g., 9860 S Maryland Pkwy"
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddressLookup()}
                      />
                    </div>
                    
                    {/* Search Button */}
                    <button
                      onClick={handleAddressLookup}
                      disabled={isLookingUp || !businessNameInput.trim()}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Finding your business...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Find My Business</span>
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-slate-400 text-center">
                      🧙 Merlin will identify your business and customize your energy solution
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Business Found Display */}
            {businessLookup?.found && (
              <div className="mt-4 rounded-xl overflow-hidden border border-green-500/50 shadow-lg shadow-green-500/10">
                {/* Header with Merlin */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🧙</span>
                      <span className="text-white font-bold">Found your business!</span>
                    </div>
                    {locationData && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-100">⚡ ${locationData.electricityRate.toFixed(4)}/kWh</span>
                        <span className="text-green-100">☀️ {locationData.sunHours} hrs/day</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-start gap-4">
                    {/* Business Photo or Map */}
                    <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700 border-2 border-green-500/50">
                      {businessLookup.photoUrl ? (
                        <img 
                          src={businessLookup.photoUrl} 
                          alt={businessLookup.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : businessLookup.lat && businessLookup.lng ? (
                        <img 
                          src={getStaticMapUrl(businessLookup.lat, businessLookup.lng, 17)}
                          alt="Location map"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-slate-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {businessLookup.businessName}
                      </h3>
                      {/* Show a note if name looks like an address */}
                      {businessLookup.businessName && businessLookup.businessName.match(/^\d+\s/) && (
                        <p className="text-amber-300 text-xs mb-1">
                          💡 Tip: If this isn't your business name, you can still select your industry in the next step
                        </p>
                      )}
                      {businessLookup.industrySlug && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/50 mb-2">
                          <span className="text-purple-300 text-sm font-medium">
                            {INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType}
                          </span>
                        </div>
                      )}
                      <p className="text-slate-300 text-sm">
                        {businessLookup.formattedAddress}
                      </p>
                      
                      {/* What Merlin will do */}
                      <p className="text-emerald-300 text-xs mt-2 italic">
                        "I'll configure an energy system optimized for {businessLookup.industrySlug ? (INDUSTRY_NAMES[businessLookup.industrySlug] || 'your business').toLowerCase() + ' operations' : 'your business'}!"
                      </p>
                    </div>
                  </div>
                  
                  {/* Confirmation Buttons */}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        // Confirm and set industry
                        if (businessLookup.industrySlug) {
                          updateState({ 
                            industry: businessLookup.industrySlug,
                            industryName: INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType || ''
                          });
                        }
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30"
                    >
                      ✓ Yes, that's my business
                    </button>
                    <button
                      onClick={() => {
                        setBusinessLookup(null);
                        setBusinessNameInput('');
                        setStreetAddress('');
                        setShowAddressField(true);
                        updateState({
                          businessName: undefined,
                          businessAddress: undefined,
                          detectedIndustry: undefined,
                        });
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-600 text-white hover:bg-slate-500 transition-all"
                    >
                      Not mine
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* International Dropdowns */}
        {region === 'international' && (
          <div className="space-y-4 mb-6">
            {/* Country Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Country
              </label>
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-700 text-white flex items-center justify-between hover:border-purple-400 transition-all"
              >
                <span className={selectedCountry ? 'text-white' : 'text-gray-400'}>
                  {selectedCountryData
                    ? `${selectedCountryData.flag} ${selectedCountryData.name}`
                    : 'Select a country...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {countryDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {INTERNATIONAL_DATA.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country.code);
                        setSelectedCity('');
                        setCountryDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-600 flex items-center gap-3 transition-colors"
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-white">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City Dropdown */}
            {selectedCountryData && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select City
                </label>
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-slate-700 text-white flex items-center justify-between hover:border-purple-400 transition-all"
                >
                  <span className={selectedCity ? 'text-white' : 'text-gray-400'}>
                    {selectedCity || 'Select a city...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {cityDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {selectedCountryData.cities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setSelectedCity(city.name);
                          setCityDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-600 transition-colors"
                      >
                        <span className="text-white">{city.name}</span>
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
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-5 border border-purple-400/30">
            <h3 className="font-semibold text-white mb-4">
              📍 {region === 'us' ? `${state.city || state.state}, ${state.state}` : `${selectedCity}, ${selectedCountryData?.name}`}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Electricity Rate</div>
                  <div className="font-semibold text-white">
                    ${locationData.electricityRate.toFixed(4)}/kWh
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Sun className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Sun Hours</div>
                  <div className="font-semibold text-white">
                    {locationData.sunHours} hrs/day
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  locationData.solarRating === 'A' ? 'bg-green-100' :
                  locationData.solarRating === 'B' ? 'bg-blue-100' :
                  locationData.solarRating === 'C' ? 'bg-yellow-500/20' : 'bg-gray-100'
                }`}>
                  <Star className={`w-5 h-5 ${
                    locationData.solarRating === 'A' ? 'text-green-600' :
                    locationData.solarRating === 'B' ? 'text-blue-600' :
                    locationData.solarRating === 'C' ? 'text-yellow-600' : 'text-slate-400'
                  }`} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Solar Potential</div>
                  <div className="font-semibold text-white">
                    {locationData.solarRating} - {locationData.solarLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Your Goals */}
      <div className="bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-slate-600">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Your Goals</h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasEnoughGoals ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
          }`}>
            {selectedGoalsCount}/{MIN_GOALS_REQUIRED} selected
          </div>
        </div>

        {/* Always visible instruction - prominent */}
        <div className={`mb-5 p-4 rounded-xl text-center ${
          hasEnoughGoals 
            ? 'bg-green-500/20 border-2 border-green-500/50' 
            : 'bg-purple-500/20 border-2 border-purple-400/50 animate-pulse'
        }`}>
          <p className={`text-base font-semibold ${hasEnoughGoals ? 'text-green-300' : 'text-purple-300'}`}>
            {hasEnoughGoals 
              ? `✓ Great! You've selected ${selectedGoalsCount} goals` 
              : `👆 Select ${MIN_GOALS_REQUIRED - selectedGoalsCount} more goal${MIN_GOALS_REQUIRED - selectedGoalsCount > 1 ? 's' : ''} to continue`
            }
          </p>
        </div>

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
                    ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-purple-400/50 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                      {goal.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
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
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
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
    </div>
  );
}
