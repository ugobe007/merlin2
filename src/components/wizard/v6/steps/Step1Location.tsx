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
import type { WizardState } from '../types';

// SSOT Imports - All location data comes from centralized data files
import { 
  US_STATE_DATA, 
  getStateFromZip, 
  getStateData 
} from '@/services/data/stateElectricityRates';
import { 
  INTERNATIONAL_DATA, 
  getCountryData, 
  getCityData 
} from '@/services/data/internationalRates';

import {
  lookupBusinessByAddress,
  getStaticMapUrl,
  INDUSTRY_NAMES,
  type PlaceLookupResult
} from '@/services/googlePlacesService';

import merlinProfileImage from '@/assets/images/new_small_profile_.png';


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
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [merlinAssessmentExpanded, setMerlinAssessmentExpanded] = useState(false);

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
    // Allow lookup with just address OR business name (not both required)
    if (!businessNameInput.trim() && !streetAddress.trim()) return;
    
    // Combine business name + address + location for best results
    const searchQuery = region === 'us' 
      ? `${businessNameInput}${streetAddress ? ', ' + streetAddress : ''}, ${zipInput}`
      : `${businessNameInput}${streetAddress ? ', ' + streetAddress : ''}, ${selectedCity}, ${selectedCountry}`;
    
    setIsLookingUp(true);
    try {
      const result = await lookupBusinessByAddress(searchQuery.trim());
      setBusinessLookup(result);
      
      // If business found, update state with business info AND auto-set industry
      if (result.found && result.businessName) {
        updateState({
          businessName: result.businessName,
          businessAddress: result.formattedAddress,
          businessPhotoUrl: result.photoUrl,
          businessPlaceId: result.placeId,
          detectedIndustry: result.industrySlug,
          businessLat: result.lat,
          businessLng: result.lng,
          // AUTO-SET industry - user can change it on Step 2 if wrong
          industry: result.industrySlug || '',
          industryName: result.industrySlug ? (INDUSTRY_NAMES[result.industrySlug] || result.businessType || '') : '',
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

  const selectedCountryData = selectedCountry ? getCountryData(selectedCountry) : null;

  // Weather risk assessment helper (simplified - can be enhanced with real data)
  const getWeatherRisks = () => {
    // Simplified weather risk based on state (can be enhanced with real weather data)
    const stateCode = state.state || '';
    const isHighRiskState = ['TX', 'OK', 'KS', 'NE', 'CO', 'FL', 'LA', 'MS', 'AL'].includes(stateCode);
    const isMedRiskState = ['CA', 'AZ', 'NM', 'NV', 'UT', 'WY', 'MT', 'ND', 'SD'].includes(stateCode);
    
    return [
      [
        { icon: '🌩️', level: isHighRiskState ? 'Med' : 'Low', label: 'Thunder', color: isHighRiskState ? '#f59e0b' : '#22c55e', bg: isHighRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🌪️', level: isHighRiskState ? 'High' : 'Low', label: 'Tornado', color: isHighRiskState ? '#ef4444' : '#22c55e', bg: isHighRiskState ? 'linear-gradient(135deg,rgba(127,29,29,0.6),rgba(185,28,28,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🌀', level: isHighRiskState ? 'High' : 'Low', label: 'Hurricane', color: isHighRiskState ? '#ef4444' : '#22c55e', bg: isHighRiskState ? 'linear-gradient(135deg,rgba(127,29,29,0.6),rgba(185,28,28,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '💨', level: isMedRiskState ? 'Med' : 'Low', label: 'Wind', color: isMedRiskState ? '#f59e0b' : '#22c55e', bg: isMedRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '⚡', level: isHighRiskState ? 'Med' : 'Low', label: 'Lightning', color: isHighRiskState ? '#f59e0b' : '#22c55e', bg: isHighRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
      ],
      [
        { icon: '🔥', level: isMedRiskState ? 'High' : 'Low', label: 'Heat', color: isMedRiskState ? '#ef4444' : '#22c55e', bg: isMedRiskState ? 'linear-gradient(135deg,rgba(127,29,29,0.6),rgba(185,28,28,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🥶', level: 'Low', label: 'Cold', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🧊', level: 'Low', label: 'Ice', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '❄️', level: 'Low', label: 'Blizzard', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🏜️', level: isMedRiskState ? 'Med' : 'Low', label: 'Drought', color: isMedRiskState ? '#f59e0b' : '#22c55e', bg: isMedRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
      ],
      [
        { icon: '🌧️', level: 'Low', label: 'Rain', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🌊', level: isHighRiskState ? 'Med' : 'Low', label: 'Flood', color: isHighRiskState ? '#f59e0b' : '#22c55e', bg: isHighRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🌨️', level: 'Low', label: 'Hail', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🔥', level: isMedRiskState ? 'Med' : 'Low', label: 'Wildfire', color: isMedRiskState ? '#f59e0b' : '#22c55e', bg: isMedRiskState ? 'linear-gradient(135deg,rgba(120,53,15,0.5),rgba(180,83,9,0.3))' : 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
        { icon: '🌊', level: 'Low', label: 'Tsunami', color: '#22c55e', bg: 'linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))' },
      ],
    ];
  };

  // Get location metrics for display
  const locationMetrics = locationData ? [
    { label: 'Peak Sun', value: locationData.sunHours.toFixed(1), unit: 'hrs/day', color: '#f59e0b' },
    { label: 'Electricity Rate', value: `$${locationData.electricityRate.toFixed(2)}`, unit: 'per kWh', color: '#22c55e' },
    { label: 'Weather Risk', value: 'Low', unit: '', color: '#22c55e', highlight: true },
    { label: 'Solar Grade', value: locationData.solarRating, unit: locationData.solarLabel, color: '#f59e0b' },
  ] : [];

  // Get Merlin's assessment
  const getMerlinAssessment = () => {
    if (!locationData) return null;
    
    const sunExposure = locationData.sunHours >= 5.5 ? 'Excellent' : locationData.sunHours >= 4.5 ? 'Good' : 'Fair';
    const electricityRates = locationData.electricityRate > 0.12 ? 'High' : locationData.electricityRate > 0.08 ? 'Competitive' : 'Low';
    const weatherRisk = 'Low'; // Can be enhanced with real weather data
    const systemConfig = locationData.sunHours >= 5.5 && locationData.electricityRate > 0.10 ? 'BESS + Solar' : locationData.sunHours >= 4.5 ? 'BESS + Solar' : 'BESS + Generator';
    
    const comment = locationData.sunHours >= 5.5 
      ? 'Solar + battery storage maximizes your ROI without backup generator costs.'
      : locationData.sunHours >= 4.5
      ? 'Solar paired with battery storage will help reduce energy costs and provide backup power.'
      : 'Consider a generator + BESS combination for reliable power, peak shaving, and backup during outages.';
    
    return { sunExposure, electricityRates, weatherRisk, systemConfig, comment };
  };

  const assessment = getMerlinAssessment();
  const weatherRisks = getWeatherRisks();
  const locationName = region === 'us' 
    ? `${US_STATE_DATA[state.state]?.name || state.state}, ${state.state}`
    : `${selectedCity}, ${selectedCountry}`;

  return (
    <div className="grid grid-cols-2 flex-1 overflow-hidden pb-16 items-stretch">
      {/* LEFT COLUMN: Your Location */}
      <div className="p-5 px-7 flex flex-col overflow-y-auto">
        {/* Section Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-600/10 border-2 border-blue-600/40 flex items-center justify-center">
            <span className="text-2xl">📍</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Your Location</h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">Tell us where you are so we can help optimize your energy savings...</p>
          </div>
        </div>

        {/* Region Toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4 shrink-0">
          <button 
            onClick={() => setRegion('us')}
            className={`flex-1 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all ${
              region === 'us'
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl">🇺🇸</span> US
          </button>
          <button 
            onClick={() => setRegion('international')}
            className={`flex-1 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all ${
              region === 'international'
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl">🌐</span> Intl
          </button>
        </div>

        {/* ZIP Code Input */}
        {region === 'us' && (
          <div className="mb-4 shrink-0">
            <label className="block text-xs text-slate-200 mb-2 uppercase tracking-wider">ZIP Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={zipInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                setZipInput(value);
              }}
              onKeyDown={(e) => {
                // Allow backspace, delete, tab, escape, enter, and arrow keys
                if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true)) {
                  return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault();
                }
              }}
              className={`w-full p-3.5 text-2xl font-semibold text-center tracking-[8px] bg-blue-600/10 border-2 rounded-xl outline-none font-mono focus:ring-2 focus:ring-purple-500/30 transition-all ${
                zipError 
                  ? 'border-red-400 text-red-300 focus:border-red-400' 
                  : zipInput.length === 5 
                    ? 'border-green-400 text-green-300 focus:border-green-400' 
                    : 'border-blue-600/30 text-slate-400 focus:border-purple-500'
              }`}
              placeholder="89052"
              autoComplete="postal-code"
            />
            {zipError && (
              <p className="mt-2 text-xs text-red-400">{zipError}</p>
            )}
          </div>
        )}

            {/* Business Name */}
        {region === 'us' && zipInput.length === 5 && !zipError && (
          <>
            {/* Business Confirmed Card - Show ABOVE search button if found */}
            {businessLookup?.found && (
              <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex flex-col shrink-0">
                <div className="flex gap-3.5">
                  <div className="w-20 h-16 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 shrink-0 flex items-center justify-center">
                    {businessLookup.photoUrl ? (
                      <img src={businessLookup.photoUrl} alt={businessLookup.businessName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-[10px] text-slate-500">Photo</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-semibold mb-2 text-white">{businessLookup.businessName}</div>
                    {businessLookup.industrySlug && (
                      <span className="text-sm text-blue-400 bg-blue-600/15 px-3 py-1.5 rounded-md">
                        {INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType} ✓
                      </span>
                    )}
                    <div className="text-base text-slate-400 mt-2.5">📍 {businessLookup.formattedAddress}</div>
                  </div>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setBusinessLookup(null);
                    setBusinessNameInput('');
                    setStreetAddress('');
                    updateState({
                      businessName: undefined,
                      businessAddress: undefined,
                      detectedIndustry: undefined,
                      industry: '',
                      industryName: '',
                    });
                  }}
                  className="text-sm text-slate-500 bg-transparent border-none underline cursor-pointer self-start mt-3"
                >
                  Not your business? Search again
                </button>
              </div>
            )}

            <div className="mb-4 shrink-0">
              <label className="block text-xs text-slate-200 mb-2 uppercase tracking-wider">
                Business Name <span className="text-[9px] text-slate-500 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={businessNameInput}
                onChange={(e) => setBusinessNameInput(e.target.value)}
                className="w-full p-3 text-sm bg-blue-600/10 border-2 border-blue-600/30 rounded-xl text-slate-400 outline-none"
                placeholder="e.g., WOW Carwash"
              />
            </div>

            {/* Street Address */}
            <div className="mb-4 shrink-0">
              <label className="block text-xs text-slate-200 mb-2 uppercase tracking-wider">
                Street Address <span className="text-[9px] text-slate-500 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full p-3 text-sm bg-blue-600/10 border border-blue-600/25 rounded-xl text-slate-400 outline-none"
                placeholder="e.g., 3405 St Rose Pkwy"
              />
            </div>

            {/* Find My Business Button */}
            <button
              onClick={handleAddressLookup}
              disabled={isLookingUp || (!businessNameInput.trim() && !streetAddress.trim())}
              className="w-full p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white text-base font-semibold flex items-center justify-center gap-2.5 mb-2.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finding...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find My Business</span>
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 text-center mb-4 shrink-0">
              🧙 Merlin will identify your business and customize your energy solution
            </p>
          </>
        )}

        {/* International Dropdowns */}
        {region === 'international' && (
          <div className="space-y-4 mb-4 shrink-0">
            {/* Country Dropdown */}
            <div className="relative">
              <label className="block text-xs text-slate-200 mb-2 uppercase tracking-wider">Country</label>
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full p-3 text-sm bg-blue-600/10 border-2 border-blue-600/30 rounded-xl text-slate-400 flex items-center justify-between"
              >
                <span>{selectedCountryData ? `${selectedCountryData.flag} ${selectedCountryData.name}` : 'Select a country...'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
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
                <label className="block text-xs text-slate-200 mb-2 uppercase tracking-wider">City</label>
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="w-full p-3 text-sm bg-blue-600/10 border-2 border-blue-600/30 rounded-xl text-slate-400 flex items-center justify-between"
                >
                  <span>{selectedCity || 'Select a city...'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
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

      </div>

      {/* RIGHT COLUMN: Merlin Advisor */}
      <div className="flex flex-col p-5 px-7 overflow-y-auto">
        {/* Welcome Panel - Expanded with Stroke and Glow */}
        <div 
          className="mb-6 shrink-0 relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
            boxShadow: `
              0 0 30px rgba(168, 85, 247, 0.3),
              0 0 60px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            border: '1px solid',
            borderColor: 'rgba(168, 85, 247, 0.4)',
            padding: '24px'
          }}
        >
          {/* Glow effect overlay */}
          <div 
            className="absolute inset-0 opacity-50 rounded-3xl"
            style={{
              background: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15), transparent 60%)',
              pointerEvents: 'none'
            }}
          />
      
          {/* Content */}
          <div className="relative z-10">
            {/* Advisor Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-3 border-purple-500/60 flex items-center justify-center relative shrink-0 overflow-hidden"
                style={{
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
                }}
              >
                <img 
                  src={merlinProfileImage}
                  alt="Merlin AI Energy Advisor"
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-3 border-[#0f172a] z-10" 
                  style={{
                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(168, 85, 247, 0.3)' }}>
                  Welcome to Merlin Energy
                </h3>
                <p className="text-base text-slate-200 leading-relaxed mb-3">
                  I'm <span className="font-semibold text-purple-300">MerlinAI</span>, your Energy Advisor. Let me help you <span className="font-semibold text-emerald-400">maximize your energy savings</span> and find the perfect energy solution for your business.
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  I'll analyze your location, assess your energy needs, and recommend a customized system that reduces costs, provides backup power, and maximizes your return on investment.
                </p>
              </div>
            </div>

            {/* MerlinAI Assessment - Collapsible */}
            {assessment && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setMerlinAssessmentExpanded(!merlinAssessmentExpanded)}
                  className="w-full flex items-center justify-between gap-2.5 mb-3 p-2 hover:bg-white/5 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🧙</span>
                    <span className="text-base font-semibold text-white">MerlinAI Assessment</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${merlinAssessmentExpanded ? 'rotate-180' : ''} group-hover:text-white`} />
                </button>
                {merlinAssessmentExpanded && (
                  <div 
                    className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 border border-purple-700/30 rounded-xl p-3 px-4 shadow-lg shadow-purple-900/20 transition-all duration-300"
                    style={{ animation: 'pulsate 2s ease-in-out infinite' }}
                  >
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">☀️</span>
                        <span className="text-sm text-white">Sun Exposure</span>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-md text-green-400 bg-green-500/15">{assessment.sunExposure}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">⚡</span>
                        <span className="text-sm text-white">Electricity Rates</span>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-md text-green-400 bg-green-500/15">{assessment.electricityRates}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🌤️</span>
                        <span className="text-sm text-white">Weather Risk</span>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-md text-green-400 bg-green-500/15">{assessment.weatherRisk}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm text-white">System Configuration Initial Assessment</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                        {assessment.systemConfig}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">💬</span>
                        <div>
                          <span className="text-xs text-slate-400 font-medium">Comment</span>
                          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{assessment.comment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Location Analysis */}
          {locationData && (
            <div className="shrink-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-lg">🔍</span>
                <span className="text-base font-semibold text-white">Location Analysis</span>
                <span className="ml-auto text-sm text-yellow-400 bg-yellow-400/15 px-3 py-1 rounded-lg font-semibold">{locationName}</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {locationMetrics.map((metric, i) => (
                  <div 
                    key={i} 
                    className={`${metric.highlight ? 'bg-green-500/10 border-green-500/15' : 'bg-white/5 border-white/5'} border rounded-xl p-3 text-center`}
                  >
                    <div className="text-xs text-white mb-1">{metric.label}</div>
                    <div className="text-xl font-bold" style={{ color: metric.color }}>{metric.value}</div>
                    {metric.unit && <div className="text-[10px] text-white">{metric.unit}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Weather Risk Assessment - Collapsible, Below Merlin Assessment */}
          {locationData && (
            <div className="shrink-0">
              <button
                onClick={() => setWeatherExpanded(!weatherExpanded)}
                className="w-full flex items-center justify-between gap-2.5 mb-3 p-2 hover:bg-slate-800/30 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⛈️</span>
                  <span className="text-base font-semibold text-white">Location Weather Risk Assessment</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${weatherExpanded ? 'rotate-180' : ''}`} />
              </button>
              {weatherExpanded && (
                <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                  {weatherRisks.map((row, rowIdx) => (
                    <div key={rowIdx} className={`grid grid-cols-5 gap-1.5 ${rowIdx < 2 ? 'mb-1.5' : ''}`}>
                      {row.map((risk, i) => (
                        <div key={i} className="text-center p-1.5 rounded-md" style={{ background: risk.bg }}>
                          <div className="text-base">{risk.icon}</div>
                          <div className="text-[10px] font-semibold mt-0.5" style={{ color: risk.color }}>{risk.level}</div>
                          <div className="text-[9px] text-white">{risk.label}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
