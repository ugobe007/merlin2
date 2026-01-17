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
 * NEW January 14, 2026: Added SavingsPreviewPanel for business lookup
 * - Shows estimated savings (NOT SSOT!) when business is found
 * - Clearly labeled as ESTIMATE
 * - Real TrueQuote™ numbers come in Steps 4-6
 * 
 * SSOT: Imports location data from @/services/data
 * NOTE: MerlinAdvisor is now rendered at WizardV6 level (unified advisor)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Globe, Zap, Sun, Star, ChevronDown, Check, Search, Building2, Loader2 } from 'lucide-react';
import type { WizardState, EnergyGoal } from '../types';

// SSOT Imports - All location data comes from centralized data files
import { 
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

// Component imports
import { SavingsPreviewPanel } from '../components/SavingsPreviewPanel';

// ✅ NEW: Teaser Preview Service (Jan 16, 2026)
import { 
  calculateTeaserPreview, 
  computeTeaserHash,
  formatROISmart,
  type TeaserInput 
} from '@/services/teaserPreviewService';

// ✅ NEW: Advisor Publisher Hook (Jan 16, 2026)
import { useAdvisorPublisher } from '../advisor/AdvisorPublisher';

// ============================================================================
// ENERGY GOALS - Updated Jan 15, 2026
// ============================================================================

const ENERGY_GOALS: { id: EnergyGoal; label: string; description: string; emoji: string }[] = [
  { id: 'reduce_costs', label: 'Save Money', description: 'Lower monthly energy bills', emoji: '💰' },
  { id: 'backup_power', label: 'Backup Power', description: 'Stay online during outages', emoji: '⚡' },
  { id: 'grid_independence', label: 'Energy Resilience', description: 'Reduce grid dependence', emoji: '🛡️' },
  { id: 'sustainability', label: 'Go Green', description: 'Reduce carbon footprint', emoji: '🌱' },
  { id: 'peak_shaving', label: 'Balance Energy Loads', description: 'Avoid peak demand charges', emoji: '📊' },
  { id: 'generate_revenue', label: 'Generate Revenue', description: 'Sell power back to grid', emoji: '💵' },
];

const MIN_GOALS_REQUIRED = 2;

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
  onNext?: () => void;
  onGoToStep2?: () => void;
}

export function Step1Location({ state, updateState, onNext: _onNext, onGoToStep2 }: Props) {
  // ✅ NEW: Access advisor publisher for teaser (Jan 16, 2026)
  const { publish: publishToAdvisor } = useAdvisorPublisher();
  
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
        
        // ✅ NEW: Generate teaser preview (Jan 16, 2026)
        if (result.industrySlug && locationData) {
          try {
            const teaserInput: TeaserInput = {
              zipCode: zipInput,
              state: state.state,
              city: state.city,
              industrySlug: result.industrySlug,
              businessSizeTier: state.businessSizeTier && state.businessSizeTier !== 'enterprise' 
                ? state.businessSizeTier 
                : 'medium', // Default to medium if undefined or enterprise
              electricityRate: locationData.electricityRate,
              demandCharge: 15, // Typical commercial demand charge
              sunHours: locationData.sunHours,
              goals: state.goals,
            };
            
            // Check if inputs changed (prevents recompute churn)
            const nextHash = computeTeaserHash(teaserInput);
            const needsRecalculation = state.teaserPreview?.teaserHash !== nextHash;
            
            const teaser = needsRecalculation 
              ? calculateTeaserPreview(teaserInput)
              : state.teaserPreview!;
            
            // Save to state (only if recalculation occurred)
            if (needsRecalculation) {
              updateState({
                teaserPreview: teaser,
                teaserPreviewVersion: teaser.version,
                teaserLastUpdatedAt: teaser.createdAt,
                teaserIsEstimateOnly: true,
              });
            }
            
            // Publish to Advisor Rail
            publishToAdvisor({
              step: 1,
              key: 'step-1-teaser',
              mode: 'estimate',
              headline: '🔮 Sneak Peek',
              subline: 'Quick preview based on your location and industry',
              cards: [
                {
                  id: 'solar-bess',
                  type: 'discovery',
                  title: '☀️ Save Money',
                  body: `$${(teaser.solarBess.annualSavings / 1000).toFixed(0)}k/year\nTypical payback: ${formatROISmart(teaser.solarBess.roiYears, teaser.solarBess.roiCapped)}\n\n${teaser.solarBess.systemSize}`,
                  badge: 'Estimate',
                },
                {
                  id: 'generator-bess',
                  type: 'discovery',
                  title: '🔥 Resilience',
                  body: `${Math.floor(teaser.generatorBess.resilienceHours)} hrs backup\n${teaser.generatorBess.roiCapped ? 'Cost recovery primarily from uptime value' : `Typical savings: $${(teaser.generatorBess.annualSavings / 1000).toFixed(0)}k/year`}\n\n${teaser.generatorBess.systemSize}`,
                  badge: 'Estimate',
                },
              ],
              disclaimer: teaser.disclaimer,
              debug: {
                source: 'Step1Location',
                ts: new Date().toISOString(),
              },
            });
          } catch (error) {
            console.error('⚠️ Teaser preview calculation failed:', error);
            // Don't block user experience if teaser fails
          }
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* NOTE: MerlinBar is now rendered at WizardV6 level with unified messaging */}
      
      {/* 🔮 SAVINGS SNEAK PREVIEW - Shows ABOVE input panels when business found */}
      {businessLookup?.found && businessLookup.industrySlug && locationData && (
        <div className="mb-6">
          <SavingsPreviewPanel
            businessName={businessLookup.businessName || ''}
            industrySlug={businessLookup.industrySlug}
            industryName={INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType || ''}
            electricityRate={locationData.electricityRate}
            demandCharge={15}
            sunHours={locationData.sunHours}
            state={state.state}
            onContinue={() => {
              // Scroll to goals section
              const goalsSection = document.getElementById('goals-section');
              if (goalsSection) {
                goalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            onChangeIndustry={() => {
              if (onGoToStep2) onGoToStep2();
            }}
          />
        </div>
      )}

      {/* COMPACT LOCATION STATS - Shows quick stats after location selected */}
      {locationData && (
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">{locationData.sunHours} hrs/day</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-200 text-sm font-medium">${locationData.electricityRate.toFixed(4)}/kWh</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
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
            {/* Only show ZIP input prominently if business not found yet */}
            {!businessLookup?.found && (
              <>
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
              </>
            )}
            
            {/* Address Lookup Section - shown after valid zip, hidden when business found */}
            {zipInput.length === 5 && !zipError && !businessLookup?.found && (
              <div className="mt-4">
                {!showAddressField && (
                  <button
                    onClick={() => setShowAddressField(true)}
                    className="w-full py-4 px-4 rounded-xl border-2 border-purple-400 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 hover:text-white transition-all text-base font-medium shadow-lg shadow-purple-500/20"
                  >
                    <Building2 className="w-5 h-5 inline mr-2" />
                    🏢 Add your business name & address for personalized recommendations
                  </button>
                )}
                
                {showAddressField && (
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
            
            {/* Business Found Display - Auto-confirmed, user can change on Step 2 */}
            {businessLookup?.found && (
              <div className="mt-4 rounded-xl overflow-hidden border-2 border-green-500 shadow-xl shadow-green-500/20">
                {/* Header with Success Message */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✅</span>
                      <span className="text-white font-bold text-lg">Business Confirmed!</span>
                    </div>
                    {locationData && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-100">⚡ ${locationData.electricityRate.toFixed(4)}/kWh</span>
                        <span className="text-green-100">☀️ {locationData.sunHours} hrs/day</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 p-5">
                  <div className="flex items-start gap-4">
                    {/* Business Photo or Map */}
                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-slate-700 border-2 border-green-500/50 shadow-lg">
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
                          <Building2 className="w-12 h-12 text-slate-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {businessLookup.businessName}
                      </h3>
                      
                      {businessLookup.industrySlug && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/30 border border-purple-400 mb-3">
                          <span className="text-purple-200 font-semibold">
                            {INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType}
                          </span>
                          <Check className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                      
                      <p className="text-slate-300 text-sm mb-3">
                        📍 {businessLookup.formattedAddress}
                      </p>
                      
                      {/* Merlin's commitment */}
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600">
                        <p className="text-emerald-300 text-sm">
                          🧙 <span className="font-semibold">Merlin says:</span> "I'll design a custom energy solution for {businessLookup.businessName}. Select your goals and click Continue!"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wrong business link - subtle, not a big button */}
                  <div className="mt-4 text-center">
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
                          industry: '',
                          industryName: '',
                        });
                      }}
                      className="text-slate-400 text-sm hover:text-white transition-colors underline"
                    >
                      Not your business? Search again
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
      <div id="goals-section" className="bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-slate-600 scroll-mt-4">
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
