/**
 * NEW Step 1: Location-First + Industry Selection
 * ==============================================
 * REDESIGNED: Location-first flow with geographic intelligence
 * 
 * Flow: Zip Code → State (auto-detected) → Smart Recommendations → Industry Selection
 * 
 * Features:
 * - Geographic intelligence integration
 * - Auto-detection of state from zip code
 * - Smart energy recommendations based on location
 * - Visual energy potential indicators
 * - ENHANCED: Scroll indicators and floating Next button for better UX
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Building2, Factory, Store, Zap, Car, Hotel, Server, MapPin, Sun, Wind, Battery, AlertTriangle, CheckCircle, Droplets, ExternalLink, Sparkles, ChevronDown, ArrowDown, ArrowRight } from 'lucide-react';
import { 
  getGeographicRecommendations, 
  getRecommendedAddOns,
  getRegionalElectricityRate,
  getStateFromZipCode,
  type StateEnergyProfile,
  type GeographicRecommendation
} from '@/services/geographicIntelligenceService';

interface Step1Props {
  selectedTemplate: string | null;
  availableUseCases: any[];
  location: string;
  zipCode?: string;
  onSelectTemplate: (slug: string) => void;
  onUpdateLocation: (location: string) => void;
  onUpdateZipCode?: (zip: string) => void;
  onUpdateGeographicData?: (data: GeographicRecommendation | null) => void;
  onNext: () => void;
  onBack: () => void;
}

const INDUSTRY_ICONS: Record<string, any> = {
  'ev-charging': Car,
  'datacenter': Server,
  'hotel': Hotel,
  'office': Building2,
  'manufacturing': Factory,
  'retail': Store,
  'car-wash': Droplets,
  'default': Zap
};

// Special verticals that redirect to dedicated sites
const VERTICAL_REDIRECTS: Record<string, string> = {
  'car-wash': '/carwashenergy',
  'ev-charging': '/evchargingenergy',
  'hotel': '/hotelenergy',
};

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Energy potential indicator component
const EnergyPotentialBar: React.FC<{ label: string; value: number; max: number; icon: any; color: string }> = ({ 
  label, value, max, icon: Icon, color 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value.toFixed(1)} / {max}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Step1_IndustryAndLocation: React.FC<Step1Props> = ({
  selectedTemplate,
  availableUseCases = [],
  location,
  zipCode = '',
  onSelectTemplate,
  onUpdateLocation,
  onUpdateZipCode,
  onUpdateGeographicData,
  onNext,
  onBack
}) => {
  // Local state for zip code input
  const [localZip, setLocalZip] = useState(zipCode);
  const [zipError, setZipError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Geographic intelligence data
  const [geoRecommendations, setGeoRecommendations] = useState<GeographicRecommendation | null>(null);
  const [recommendedAddOns, setRecommendedAddOns] = useState<string[]>([]);
  const [regionalRate, setRegionalRate] = useState<number | null>(null);
  
  // UX Enhancement: Show scroll indicator and toast
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showNextToast, setShowNextToast] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  // Group use cases by industry
  const groupedUseCases = useMemo(() => {
    return (availableUseCases || []).reduce((acc: Record<string, any[]>, useCase: any) => {
      const industry = useCase.industry || 'Other';
      if (!acc[industry]) {
        acc[industry] = [];
      }
      acc[industry].push(useCase);
      return acc;
    }, {} as Record<string, any[]>);
  }, [availableUseCases]);

  // Show scroll hint when location is confirmed
  useEffect(() => {
    if (location && !selectedTemplate) {
      setShowScrollHint(true);
      // Auto-scroll to industry section after a brief delay
      setTimeout(() => {
        industryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [location, selectedTemplate]);
  
  // Show toast when industry is selected
  useEffect(() => {
    if (selectedTemplate && location) {
      setShowNextToast(true);
      setShowScrollHint(false);
      // Auto-scroll to next button
      setTimeout(() => {
        nextButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      // Hide toast after 5 seconds
      const timer = setTimeout(() => setShowNextToast(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for all code paths
  }, [selectedTemplate, location]);

  // Handle zip code input and auto-detect state
  const handleZipChange = async (zip: string) => {
    // Only allow numbers
    const cleanZip = zip.replace(/\D/g, '').slice(0, 5);
    setLocalZip(cleanZip);
    setZipError(null);
    onUpdateZipCode?.(cleanZip);

    // Auto-detect state when we have 5 digits
    if (cleanZip.length === 5) {
      setIsLoadingLocation(true);
      try {
        const detectedState = getStateFromZipCode(cleanZip);
        if (detectedState) {
          onUpdateLocation(detectedState);
          
          // Get geographic recommendations
          const recommendations = getGeographicRecommendations(detectedState);
          setGeoRecommendations(recommendations);
          onUpdateGeographicData?.(recommendations);
          
          // Get add-on suggestions
          const addOns = getRecommendedAddOns(detectedState);
          setRecommendedAddOns(addOns);
          
          // Get regional electricity rate
          const rate = getRegionalElectricityRate(detectedState);
          setRegionalRate(rate);
        } else {
          setZipError('Unable to detect state from zip code');
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        setZipError('Error detecting location');
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      // Clear geo data if zip is incomplete
      setGeoRecommendations(null);
      setRecommendedAddOns([]);
      setRegionalRate(null);
    }
  };

  // Handle state selection manually
  const handleStateSelect = (state: string) => {
    onUpdateLocation(state);
    
    if (state) {
      const recommendations = getGeographicRecommendations(state);
      setGeoRecommendations(recommendations);
      onUpdateGeographicData?.(recommendations);
      
      const addOns = getRecommendedAddOns(state);
      setRecommendedAddOns(addOns);
      
      const rate = getRegionalElectricityRate(state);
      setRegionalRate(rate);
    } else {
      setGeoRecommendations(null);
      setRecommendedAddOns([]);
      setRegionalRate(null);
    }
  };

  const handleSelect = async (slug: string) => {
    // Check if this is a vertical redirect
    if (VERTICAL_REDIRECTS[slug]) {
      window.location.href = VERTICAL_REDIRECTS[slug];
      return;
    }
    
    console.log('[Step1] Selected template:', slug);
    await onSelectTemplate(slug);
    console.log('[Step1] Template loaded');
  };

  const canProceed = !!selectedTemplate && !!location;

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-5xl">📍</span>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Where's Your Project?
            </h2>
            <p className="text-gray-600 mt-2">
              We'll customize recommendations based on your location
            </p>
          </div>
        </div>
      </div>

      {/* LOCATION FIRST - Zip Code Input */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-amber-50 rounded-2xl border-2 border-blue-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Step 1: Enter Your Location
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Zip Code Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📮 Zip Code (fastest)
            </label>
            <input
              type="text"
              value={localZip}
              onChange={(e) => handleZipChange(e.target.value)}
              placeholder="Enter 5-digit zip code"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center text-xl font-mono"
              maxLength={5}
            />
            {zipError && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {zipError}
              </p>
            )}
            {isLoadingLocation && (
              <p className="mt-2 text-sm text-blue-500 animate-pulse">
                Detecting location...
              </p>
            )}
          </div>

          {/* State Dropdown (Manual Override) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏛️ Or Select State
            </label>
            <select
              value={location}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
            >
              <option value="">Select your state...</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Confirmed Badge */}
        {location && (
          <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-2 border border-green-200">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Location: {location}</span>
            {localZip && <span className="text-gray-500">({localZip})</span>}
          </div>
        )}
      </div>

      {/* GEOGRAPHIC INTELLIGENCE - Smart Recommendations */}
      {geoRecommendations && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-green-200 p-6 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Smart Energy Analysis for {location}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Energy Potential Indicators */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Energy Potential</h4>
              <EnergyPotentialBar 
                label="Solar Potential" 
                value={geoRecommendations.profile.avgSolarHoursPerDay} 
                max={8} 
                icon={Sun} 
                color="text-amber-500" 
              />
              <EnergyPotentialBar 
                label="Wind Potential" 
                value={geoRecommendations.profile.windCapacityFactor * 10} 
                max={5} 
                icon={Wind} 
                color="text-blue-500" 
              />
              <EnergyPotentialBar 
                label="Grid Reliability" 
                value={geoRecommendations.profile.gridReliabilityScore} 
                max={100} 
                icon={Battery} 
                color="text-purple-500" 
              />
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recommended for You</h4>
              
              {/* Battery Storage */}
              <div className={`p-3 rounded-lg border ${
                geoRecommendations.recommendations.batteryStorage.recommended 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Battery className={`w-5 h-5 ${geoRecommendations.recommendations.batteryStorage.recommended ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Battery Storage</span>
                  {geoRecommendations.recommendations.batteryStorage.recommended && (
                    <span className="ml-auto text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">{geoRecommendations.recommendations.batteryStorage.reason}</p>
              </div>

              {/* Solar */}
              <div className={`p-3 rounded-lg border ${
                geoRecommendations.recommendations.solar.recommended 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sun className={`w-5 h-5 ${geoRecommendations.recommendations.solar.recommended ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Solar Integration</span>
                  {geoRecommendations.recommendations.solar.recommended && (
                    <span className="ml-auto text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">{geoRecommendations.recommendations.solar.reason}</p>
              </div>

              {/* Regional Rate Info */}
              {regionalRate && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Estimated Electricity Rate</span>
                    <span className="font-bold text-blue-700">${regionalRate.toFixed(2)}/kWh</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add-on Suggestions */}
          {recommendedAddOns.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Add-ons for {location}:</h4>
              <div className="flex flex-wrap gap-2">
                {recommendedAddOns.map((addon) => (
                  <span key={addon} className="px-3 py-1 bg-white rounded-full text-sm border border-green-300 text-green-700">
                    ✓ {addon}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INDUSTRY SELECTION - Step 2 */}
      <div ref={industryRef} className="scroll-mt-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          Step 2: Select Your Industry
          {!selectedTemplate && location && (
            <span className="ml-2 text-sm font-normal text-purple-600 bg-purple-100 px-3 py-1 rounded-full animate-pulse">
              👇 Choose one below
            </span>
          )}
        </h3>
        
        {/* Special Verticals - Dedicated Sites */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Specialized Solutions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Car Wash - Dedicated Site */}
            <a
              href="/carwashenergy"
              className="p-5 rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 text-left transition-all hover:shadow-xl hover:scale-105 hover:border-cyan-500 group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Dedicated Site
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">
                    Car Wash
                  </h4>
                  <p className="text-sm text-gray-500">Bay-specific calculations</p>
                </div>
              </div>
            </a>
            
            {/* EV Charging - Dedicated Site */}
            <a
              href="/evchargingenergy"
              className="p-5 rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-left transition-all hover:shadow-xl hover:scale-105 hover:border-emerald-500 group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Dedicated Site
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    EV Charging Hub
                  </h4>
                  <p className="text-sm text-gray-500">DCFC demand charge solutions</p>
                </div>
              </div>
            </a>
            
            {/* Hotel - Dedicated Site */}
            <a
              href="/hotelenergy"
              className="p-5 rounded-xl border-2 border-indigo-400 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-left transition-all hover:shadow-xl hover:scale-105 hover:border-indigo-500 group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Dedicated Site
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
                  <Hotel className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    Hotel & Hospitality
                  </h4>
                  <p className="text-sm text-gray-500">Guest experience + backup power</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Standard Use Cases */}
        <div className="space-y-6">
          {Object.entries(groupedUseCases).map(([industry, useCases]) => (
            <div key={industry}>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">{industry}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase) => {
                  const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default;
                  const isSelected = selectedTemplate === useCase.slug;

                  return (
                    <button
                      key={useCase.slug}
                      onClick={() => handleSelect(useCase.slug)}
                      className={`
                        p-5 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-purple-600 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 shadow-lg ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50/50 hover:via-blue-50/50 hover:to-amber-50/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${isSelected 
                            ? 'bg-gradient-to-br from-purple-600 via-blue-500 to-amber-500 text-white' 
                            : 'bg-gradient-to-br from-purple-100 via-blue-100 to-amber-100 text-purple-700'}
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h5 className={`font-semibold ${isSelected ? 'text-purple-800' : 'text-gray-900'}`}>
                          {useCase.name}
                        </h5>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <button
          ref={nextButtonRef}
          onClick={onNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next →
        </button>
      </div>
      
      {/* Floating Scroll Indicator - Shows when location confirmed but no industry selected */}
      {showScrollHint && !selectedTemplate && location && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={() => industryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="font-semibold">Scroll down to select your industry</span>
          </button>
        </div>
      )}
      
      {/* Floating "Ready to Continue" Toast - Shows when both location AND industry are selected */}
      {showNextToast && canProceed && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">Great choice!</p>
              <p className="text-sm text-white/90">Click Next to continue →</p>
            </div>
            <button
              onClick={onNext}
              className="ml-2 bg-white text-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-50 transition-colors flex items-center gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Floating Next Button - Always visible when ready */}
      {canProceed && !showNextToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={onNext}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            <span className="font-semibold">Continue to Next Step</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Step1_IndustryAndLocation;
