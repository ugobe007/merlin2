/**
 * STEP 1: ADVISOR-LED DESIGN - PROFESSIONAL (January 19, 2026)
 * ============================================================
 *
 * SINGLE SIDEBAR + MAIN WORKSPACE:
 * - Left: Dark blue sidebar with Merlin identity, progress tracker
 * - Main: Professional slate background with purple highlights
 * - Purple used ONLY for accents, badges, active states
 * - Card-based layout with depth and visual hierarchy
 * - SSOT/TrueQuote compliant
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin,
  Globe,
  Zap,
  Sun,
  Search,
  Building2,
  Loader2,
  Battery,
  TrendingUp,
  Check,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Thermometer,
  Shield,
  Leaf,
  DollarSign,
  Activity,
  Info,
  AlertCircle,
  X,
} from "lucide-react";
import type { WizardState, EnergyGoal } from "../types";

// Live API Services
import { enrichLocationData, type EnrichedLocationData } from "@/services/locationEnrichmentService";
import {
  INTERNATIONAL_DATA,
  getCountryData,
  getCityData,
} from "@/services/data/internationalRates";
import {
  lookupBusinessByAddress,
  INDUSTRY_NAMES,
  type PlaceLookupResult,
} from "@/services/googlePlacesService";

// SSOT Service
import { getIndustryTeaserProfile } from "@/services/industryTeaserService";

import type { IntelligenceContext } from "@/types/intelligence.types";

// ============================================================================
// GOALS CONFIGURATION
// ============================================================================

const ALL_GOALS: { id: EnergyGoal; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "reduce_costs", label: "Cost Savings", description: "Lower your energy bills", icon: DollarSign },
  { id: "backup_power", label: "Backup Power", description: "Stay online during outages", icon: Shield },
  { id: "peak_shaving", label: "Peak Shaving", description: "Reduce demand charges", icon: TrendingUp },
  { id: "sustainability", label: "ESG / Carbon", description: "Reduce carbon footprint", icon: Leaf },
  { id: "grid_independence", label: "Resilience", description: "Grid independence", icon: Battery },
  { id: "generate_revenue", label: "Grid Revenue", description: "Sell to grid", icon: Activity },
];

const DEFAULT_GOALS: EnergyGoal[] = ["reduce_costs"];

// ============================================================================
// CLIMATE RISK MAPPING
// ============================================================================

const CLIMATE_GOAL_MAP: Record<string, EnergyGoal[]> = {
  extreme_heat: ["reduce_costs", "peak_shaving"],
  hurricane: ["backup_power", "grid_independence"],
  extreme_cold: ["backup_power", "reduce_costs"],
  wildfire: ["backup_power", "grid_independence"],
  flooding: ["backup_power", "grid_independence"],
};

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
  intelligence?: IntelligenceContext;
  onNext?: () => void;
  onGoToStep2?: () => void;
}

export function Step1AdvisorLed({ state, updateState, intelligence, onNext, onGoToStep2 }: Props) {
  // TrueQuote modal state
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  
  // Facility refine toggle state
  const [showFacilityRefine, setShowFacilityRefine] = useState(false);
  
  // Region state
  const [region, setRegion] = useState<"us" | "international">("us");
  
  // US location state
  const [zipInput, setZipInput] = useState(state.zipCode || "");
  const [zipError, setZipError] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedLocationData | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // International location state
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  
  // Business lookup state
  const [businessNameInput, setBusinessNameInput] = useState("");
  
  // Sync business name to state as user types (for live header update)
  useEffect(() => {
    if (businessNameInput.trim()) {
      updateState({ businessName: businessNameInput.trim() });
    }
  }, [businessNameInput]); // eslint-disable-line
  const [streetAddress, setStreetAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [businessLookup, setBusinessLookup] = useState<PlaceLookupResult | null>(null);

  // Derived location data
  const locationData = useMemo(() => {
    if (enrichedData) {
      return {
        city: enrichedData.city,
        stateCode: enrichedData.stateCode,
        electricityRate: enrichedData.utility.rate,
        sunHours: enrichedData.solar.sunHours,
        solarLabel: enrichedData.solar.label,
        demandCharge: enrichedData.utility.demandCharge,
        utilityName: enrichedData.utility.name,
        climate: enrichedData.weather.profile,
        extremes: enrichedData.weather.extremes,
      };
    }
    
    if (region === "international" && selectedCountry && selectedCity) {
      const cityData = getCityData(selectedCountry, selectedCity);
      const countryData = getCountryData(selectedCountry);
      if (cityData && countryData) {
        return {
          city: selectedCity,
          stateCode: countryData.code,
          electricityRate: cityData.electricityRate,
          sunHours: cityData.sunHours,
          solarLabel: cityData.solarLabel,
          demandCharge: 15,
          utilityName: `${countryData.name} Grid`,
          climate: "Moderate",
          extremes: null,
        };
      }
    }
    
    return null;
  }, [enrichedData, region, selectedCountry, selectedCity]);

  // Handle ZIP code validation and enrichment
  useEffect(() => {
    if (region === "us" && zipInput.length === 5) {
      setIsEnriching(true);
      setZipError(null);
      
      enrichLocationData(zipInput)
        .then((data) => {
          if (data) {
            setEnrichedData(data);
            setZipError(null);
            updateState({
              zipCode: zipInput,
              state: data.stateCode,
              city: data.city,
              country: "US",
              electricityRate: data.utility.rate,
              solarData: { sunHours: data.solar.sunHours, rating: data.solar.label },
              currency: "USD",
              weatherData: {
                profile: data.weather.profile,
                extremes: data.weather.extremes,
                source: 'visual-crossing' as const,
              },
            });
          } else {
            setZipError("Please enter a valid US ZIP code");
            setEnrichedData(null);
          }
        })
        .catch(() => {
          setZipError("Unable to validate ZIP code");
          setEnrichedData(null);
        })
        .finally(() => setIsEnriching(false));
    } else if (region === "us" && zipInput.length > 0 && zipInput.length < 5) {
      setZipError(null);
      setEnrichedData(null);
    }
  }, [zipInput, region, updateState]);

  // Handle international location
  useEffect(() => {
    if (region === "international" && selectedCountry && selectedCity) {
      const country = getCountryData(selectedCountry);
      const city = getCityData(selectedCountry, selectedCity);
      if (country && city) {
        updateState({
          zipCode: "",
          state: selectedCity,
          city: selectedCity,
          country: selectedCountry,
          electricityRate: city.electricityRate,
          solarData: { sunHours: city.sunHours, rating: city.solarLabel },
          currency: country.currency,
        });
      }
    }
  }, [selectedCountry, selectedCity, region, updateState]);

  // Pre-select default goals on mount
  useEffect(() => {
    if (!state.goals || state.goals.length === 0) {
      updateState({ goals: DEFAULT_GOALS });
    }
  }, []); // eslint-disable-line

  // Auto-select goals based on climate
  useEffect(() => {
    if (!locationData?.extremes) return;
    
    const autoGoals = new Set<EnergyGoal>(DEFAULT_GOALS);
    const extremeStr = locationData.extremes.toLowerCase();
    
    if (extremeStr.includes('heat') || extremeStr.includes('hot')) {
      CLIMATE_GOAL_MAP.extreme_heat.forEach(g => autoGoals.add(g));
    }
    if (extremeStr.includes('hurricane') || extremeStr.includes('storm')) {
      CLIMATE_GOAL_MAP.hurricane.forEach(g => autoGoals.add(g));
    }
    if (extremeStr.includes('cold') || extremeStr.includes('freeze')) {
      CLIMATE_GOAL_MAP.extreme_cold.forEach(g => autoGoals.add(g));
    }
    
    const newGoals = Array.from(autoGoals);
    const currentGoals = state.goals || [];
    if (JSON.stringify(currentGoals.sort()) !== JSON.stringify(newGoals.sort())) {
      updateState({ goals: newGoals });
    }
  }, [locationData?.extremes]); // eslint-disable-line

  // Handle business lookup
  const handleAddressLookup = async () => {
    if (!businessNameInput.trim()) return;
    
    const searchQuery = region === "us"
      ? `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${zipInput}`
      : `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${selectedCity}, ${selectedCountry}`;
    
    setIsLookingUp(true);
    try {
      const result = await lookupBusinessByAddress(searchQuery.trim());
      setBusinessLookup(result);
      
      if (result.found && result.businessName) {
        updateState({
          businessName: result.businessName,
          businessAddress: result.formattedAddress,
          businessPhotoUrl: result.photoUrl,
          businessPlaceId: result.placeId,
          detectedIndustry: result.industrySlug,
          businessLat: result.lat,
          businessLng: result.lng,
          industry: result.industrySlug || "",
          industryName: result.industrySlug ? INDUSTRY_NAMES[result.industrySlug] || result.businessType || "" : "",
        });
      }
    } catch (error) {
      console.error("Address lookup failed:", error);
      setBusinessLookup({ found: false });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Clear business on location change
  useEffect(() => {
    if (businessLookup) {
      setBusinessLookup(null);
      setBusinessNameInput("");
      setStreetAddress("");
    }
  }, [zipInput, selectedCity]); // eslint-disable-line

  // Toggle goal
  const toggleGoal = useCallback((goalId: EnergyGoal) => {
    const currentGoals = state.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter((g) => g !== goalId)
      : [...currentGoals, goalId];
    if (newGoals.length > 0) {
      updateState({ goals: newGoals });
    }
  }, [state.goals, updateState]);

  // Compute teaser savings preview (SSOT-compliant, non-binding)
  const teaserPreview = useMemo(() => {
    if (!locationData) return null;
    const profile = getIndustryTeaserProfile(state.detectedIndustry || state.industry || null);

    const demand = locationData.demandCharge || 20;
    const rate = locationData.electricityRate || 0.12;
    const sun = locationData.sunHours || 5;

    const peakShaving = Math.round(profile.avgPeakKW * profile.peakShavingPct * demand * 12 * 0.20);
    const solarPotential = Math.round(profile.typicalSolarKW * sun * 365 * rate * 0.10);
    const backupValue = Math.round(profile.typicalBESSKW * 60);

    const low = Math.round(peakShaving * 0.8 + solarPotential * 0.6);
    const high = Math.round(peakShaving * 1.2 + solarPotential * 0.9);

    const paybackYears = Math.round((profile.typicalBESSKW * 800 + profile.typicalSolarKW * 1200) / ((low + high) / 2) * 10) / 10;

    return {
      rangeLow: low,
      rangeHigh: high,
      peakShaving,
      solarPotential,
      backupValue,
      bessKW: profile.typicalBESSKW,
      solarKW: profile.typicalSolarKW,
      durationHrs: profile.durationHrs,
      paybackYears,
      roiEstimate: Math.round(((low + high) / 2) / ((profile.typicalBESSKW * 800 + profile.typicalSolarKW * 1200) / 100) * 10),
      industryLabel: state.detectedIndustry ? (INDUSTRY_NAMES[state.detectedIndustry] || state.detectedIndustry) : "typical averages",
      dataSource: profile.dataSource,
    };
  }, [locationData, state.detectedIndustry, state.industry]);

  const canProceed = locationData !== null && !zipError;
  const selectedCountryData = selectedCountry ? getCountryData(selectedCountry) : null;
  const goalsSelected = (state.goals || []).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="px-6 lg:px-10 max-w-6xl mx-auto">
        <div className="max-w-[1000px] mx-auto">
          {/* Welcome & Introduction */}
          <div className="mb-4">
            {/* TrueQuote Badge - Clickable */}
            <button
              onClick={() => setShowTrueQuoteModal(true)}
              className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 rounded-full px-4 py-2 text-sm font-semibold text-violet-300 mb-4 hover:bg-violet-500/20 hover:border-violet-500/35 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              TrueQuote™ — Source-backed estimates
            </button>
            
            {/* Compact Instrument Header (≤64px total) */}
            <h1 className="text-3xl font-black text-white mb-1 leading-tight">
              Start saving on your energy bill.
            </h1>
            <p className="text-sm text-slate-400">
              Enter your location to load utility rates, solar yield, and climate risk.
            </p>

            {/* TrueQuote Explanation Card - REMOVED, now in modal */}
            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 rounded-xl p-6 mb-8 hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20 flex-shrink-0">
                  ✨
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">What is TrueQuote™?</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Every number in your quote is traceable to authoritative sources (NREL, EIA, IEEE standards). No black-box estimates.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-emerald-400 text-xs font-semibold mb-1">✓ Source-Backed</div>
                      <div className="text-slate-400 text-xs">NREL, EIA data</div>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-emerald-400 text-xs font-semibold mb-1">✓ Transparent</div>
                      <div className="text-slate-400 text-xs">Full methodology</div>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-emerald-400 text-xs font-semibold mb-1">✓ Accurate</div>
                      <div className="text-slate-400 text-xs">Industry verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Steps - REMOVED, now in modal */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-8 hidden">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-violet-400" />
                How It Works
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">1</div>
                  <div className="text-white text-sm font-semibold mb-1">Your Location</div>
                  <div className="text-slate-500 text-xs">Live utility & solar data</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">2</div>
                  <div className="text-white text-sm font-semibold mb-1">Your Industry</div>
                  <div className="text-slate-500 text-xs">Custom power profile</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">3</div>
                  <div className="text-white text-sm font-semibold mb-1">TrueQuote™</div>
                  <div className="text-slate-500 text-xs">Source-backed pricing</div>
                </div>
              </div>
            </div>

            {/* Location Input Header - REMOVED */}
            <div className="hidden">
            <h2 className="text-2xl font-black text-white mb-2">Let's start with your site location</h2>
            <p className="text-slate-400 text-sm mb-6">I'll fetch live utility rates, solar potential, and weather data</p>
            </div>
          </div>

          {/* Location Input Section */}
          <section className="mb-6 mt-3">
            {/* US / International Toggle */}
            <div className="inline-flex bg-blue-900/30 rounded-xl p-1 border border-blue-500/30 mb-8 shadow-lg">
              <button
                onClick={() => setRegion("us")}
                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  region === "us"
                    ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇺🇸 United States
              </button>
              <button
                onClick={() => setRegion("international")}
                className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                  region === "international"
                    ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🌐 International
              </button>
            </div>

            {/* US ZIP Input - Hero Command Bar (64px) */}
            {region === "us" && (
              <div className="w-full">
                <div className={`zip-hero-input ${enrichedData ? 'validated' : ''} flex items-center px-6 ${
                  zipError ? "!border-red-500/40" : ""
                }`}>
                  <MapPin className="w-5 h-5 text-slate-500 mr-4 flex-shrink-0" />
                  <input
                    type="text"
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="ZIP code (e.g., 89052)"
                    autoComplete="off"
                    disabled={isEnriching}
                    className="flex-1 bg-transparent border-none outline-none text-[18px] font-semibold text-white placeholder-slate-500 tracking-wide"
                  />
                  {isEnriching && <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />}
                  {enrichedData && !isEnriching && <Check className="w-6 h-6 text-emerald-400" />}
                </div>
                
                {zipError && <p className="mt-3 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{zipError}</p>}
                
                {/* Validation Micro-Feedback (3-line confirmation) */}
                {enrichedData && (
                  <div className="validation-feedback">
                    <div className="validation-line">
                      <Check className="w-3.5 h-3.5" />
                      {enrichedData.city}, {enrichedData.stateCode} detected
                    </div>
                    <div className="validation-line">
                      <Check className="w-3.5 h-3.5" />
                      {enrichedData.utility.name} commercial territory
                    </div>
                    <div className="validation-line">
                      <Check className="w-3.5 h-3.5" />
                      Climate + solar data loaded
                    </div>
                  </div>
                )}

                {/* Address + Business Name - Always Visible After ZIP */}
                {enrichedData && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Street Address <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="123 Main St"
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-500/30 bg-slate-800/40 text-white placeholder-slate-500 focus:border-indigo-400/50 focus:bg-slate-800/60 outline-none transition-all hover:border-indigo-500/40"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Improves accuracy (utility + solar + load assumptions).
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Business / Facility Name <span className="text-slate-500 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={businessNameInput}
                        onChange={(e) => setBusinessNameInput(e.target.value)}
                        placeholder="Acme Corporation"
                        onKeyDown={(e) => e.key === "Enter" && businessNameInput.trim() && handleAddressLookup()}
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-indigo-500/30 bg-slate-800/40 text-white placeholder-slate-500 focus:border-indigo-400/50 focus:bg-slate-800/60 outline-none transition-all hover:border-indigo-500/40"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Helps match building type and typical load profile.
                      </p>
                      {businessNameInput.trim() && (
                        <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Building-level accuracy loaded
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* International Dropdowns - Full Width */}
            {region === "international" && (
              <div className="w-full space-y-3">
                <button
                  onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white flex items-center justify-between hover:border-slate-600/50 transition-all shadow-lg"
                >
                  <span className={selectedCountry ? "text-white font-semibold" : "text-slate-500"}>
                    {selectedCountryData ? `${selectedCountryData.flag} ${selectedCountryData.name}` : "Select country..."}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {selectedCountryData && (
                  <button
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white flex items-center justify-between hover:border-slate-600/50 transition-all shadow-lg"
                  >
                    <span className={selectedCity ? "text-white font-semibold" : "text-slate-500"}>
                      {selectedCity || "Select city..."}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                )}

                {selectedCity && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-sm font-medium text-emerald-400">
                    <Check className="w-4 h-4" />
                    {selectedCity}, {selectedCountryData?.name}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Refine with Your Facility (Recommended) - collapsed by default */}
          {locationData && (
            <section className="mb-6">
              <button
                type="button"
                onClick={() => setShowFacilityRefine((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Search className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-white">
                      Refine with Your Facility <span className="text-violet-400">(Recommended)</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      Improve accuracy by loading building type and utility profile
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showFacilityRefine ? "rotate-180" : ""}`} />
              </button>

              {showFacilityRefine && (
                <div className="mt-4 animate-fade-in">
                  <div className="max-w-[600px] space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessNameInput}
                    onChange={(e) => setBusinessNameInput(e.target.value)}
                    placeholder="e.g., Marriott, Walmart, Your Company Name"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500/50 focus:bg-slate-800/70 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Street Address <span className="text-slate-600">(optional)</span></label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500/50 focus:bg-slate-800/70 outline-none transition-all"
                    onKeyDown={(e) => e.key === "Enter" && businessNameInput.trim() && handleAddressLookup()}
                  />
                </div>
                
                {businessNameInput.trim() && !businessLookup?.found && (
                  <button
                    onClick={handleAddressLookup}
                    disabled={isLookingUp}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold hover:from-violet-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                  >
                    {isLookingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Find Business
                      </>
                    )}
                  </button>
                )}
                
                {businessLookup?.found && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-4">
                      {businessLookup.photoUrl ? (
                        <img src={businessLookup.photoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-emerald-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <div className="text-lg font-bold text-white">{businessLookup.businessName}</div>
                        </div>
                        <div className="text-sm text-slate-400 mb-2">{businessLookup.formattedAddress}</div>
                        {businessLookup.industrySlug && (
                          <span className="inline-block px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs font-semibold text-violet-300">
                            {INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setBusinessLookup(null);
                          setBusinessNameInput("");
                          setStreetAddress("");
                        }}
                        className="text-slate-500 hover:text-white text-sm underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Show Details Toggle - Now positioned after dashboard */}
          {locationData && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06]"
              >
                {showDetails ? "Hide details" : "Show details"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}

          {/* System Snapshot Cards (4-card grid) */}
          {showDetails && locationData && (
            <div className="snapshot-grid">
              <div className="snapshot-card">
                <div className="flex items-center gap-2 text-amber-400 text-sm mb-3">
                  <Sun className="w-4 h-4" />
                  <span className="font-semibold">Peak Sun</span>
                </div>
                <div className="text-white text-3xl font-bold mb-1">{locationData.sunHours.toFixed(1)}</div>
                <div className="text-slate-500 text-xs">hrs/day • {locationData.solarLabel}</div>
              </div>

              <div className="snapshot-card">
                <div className="flex items-center gap-2 text-cyan-400 text-sm mb-3">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Electricity</span>
                </div>
                <div className="text-white text-3xl font-bold mb-1">${locationData.electricityRate.toFixed(3)}</div>
                <div className="text-slate-500 text-xs">per kWh • Commercial avg</div>
              </div>

              <div className="snapshot-card">
                <div className="flex items-center gap-2 text-rose-400 text-sm mb-3">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-semibold">Weather Risk</span>
                </div>
                <div className="text-white text-3xl font-bold mb-1">{locationData.climate.includes('heat') ? 'Moderate' : 'Low'}</div>
                <div className="text-slate-500 text-xs">{locationData.climate}</div>
              </div>

              <div className="snapshot-card">
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">Solar Grade</span>
                </div>
                <div className="text-white text-3xl font-bold mb-1">{locationData.solarLabel}</div>
                <div className="text-slate-500 text-xs">A+ rating</div>
              </div>
            </div>
          )}

          {/* Merlin Strategic Insight Panel */}
          {showDetails && locationData && (
            <div className="insight-panel">
              <div className="insight-title">MERLIN'S EARLY INSIGHT</div>
              <p className="insight-text">
                {locationData.stateCode === 'NV' ? (
                  "Southern Nevada is a top-tier solar market. Because electricity rates are moderate here, your primary savings drivers will be demand charges and peak timing, not raw consumption reduction."
                ) : locationData.sunHours > 5.5 ? (
                  `${locationData.city} has excellent solar potential with ${locationData.sunHours.toFixed(1)} peak sun hours. Combined with your ${locationData.electricityRate >= 0.15 ? 'elevated' : 'moderate'} electricity rates, battery storage can optimize both solar self-consumption and demand charge reduction.`
                ) : locationData.electricityRate >= 0.15 ? (
                  `With commercial electricity at $${locationData.electricityRate.toFixed(3)}/kWh, your primary value driver will be peak demand management through strategic battery discharge during high-cost periods.`
                ) : (
                  `In your market, battery storage value comes primarily from demand charge reduction and backup power resilience, rather than energy arbitrage. We'll focus on peak shaving strategies.`
                )}
              </p>
            </div>
          )}

          {/* Savings Sneak Preview */}
          {showDetails && locationData && teaserPreview && (
            <div className="mb-10">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border-b border-orange-500/20 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h2 className="text-lg font-black text-white">Savings Sneak Preview</h2>
                      <span className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">ESTIMATE</span>
                    </div>
                    <div className="text-slate-400 text-xs">Based on {teaserPreview.industryLabel}</div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Business Info */}
                  {businessLookup?.found && (
                    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-700/50">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center text-xl shadow-lg">
                        {businessLookup.photoUrl ? <img src={businessLookup.photoUrl} alt="" className="w-full h-full rounded-lg object-cover" /> : "🏢"}
                      </div>
                      <div>
                        <div className="text-white font-bold">{businessLookup.businessName}</div>
                        <div className="text-slate-500 text-xs">{businessLookup.formattedAddress}</div>
                      </div>
                    </div>
                  )}

                  {/* Savings Range */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-6 mb-5 shadow-lg">
                    <div className="text-emerald-300 text-sm mb-2 font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      POTENTIAL ANNUAL SAVINGS*
                    </div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-3">
                      ${Math.round(teaserPreview.rangeLow/1000)}K-${Math.round(teaserPreview.rangeHigh/1000)}K
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-400">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>*Estimate based on typical profiles. TrueQuote™ verified in Step 5. Source: {teaserPreview.dataSource}</span>
                    </div>
                  </div>

                  {/* Breakdown Metrics */}
                  <div className="grid grid-cols-5 gap-3 mb-5">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wide">Peak Shaving</div>
                      <div className="text-white text-lg font-black">~${Math.round(teaserPreview.peakShaving/1000)}K</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wide">Solar Potential</div>
                      <div className="text-white text-lg font-black">~${Math.round(teaserPreview.solarPotential/1000)}K</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wide">Backup Value</div>
                      <div className="text-white text-lg font-black">~${Math.round(teaserPreview.backupValue/1000)}K</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wide">Payback</div>
                      <div className="text-white text-lg font-black">~{teaserPreview.paybackYears}yr</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-slate-500 text-[10px] mb-1 uppercase tracking-wide">10yr ROI</div>
                      <div className="text-white text-lg font-black">~{teaserPreview.roiEstimate}%</div>
                    </div>
                  </div>

                  {/* System Specs */}
                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4 text-violet-400" />
                      <span>BESS: <strong className="text-white">~{teaserPreview.bessKW} kW</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Solar: <strong className="text-white">~{teaserPreview.solarKW} kW</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Duration: <strong className="text-white">{teaserPreview.durationHrs} hrs</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continue Button */}
          {canProceed && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  if (state.detectedIndustry && onNext) {
                    onNext();
                  } else if (onGoToStep2) {
                    onGoToStep2();
                  } else if (onNext) {
                    onNext();
                  }
                }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg font-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                Continue to Industry
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      {/* TrueQuote Modal */}
      {showTrueQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowTrueQuoteModal(false)}>
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-violet-500/30" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20">
                  ✨
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">What is TrueQuote™?</h2>
                  <p className="text-sm text-violet-300">Every number is traceable to authoritative sources</p>
                </div>
              </div>
              <button onClick={() => setShowTrueQuoteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Explainer Card */}
            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 rounded-xl p-6 mb-6">
              <p className="text-slate-300 leading-relaxed mb-4">
                Every number in your quote is traceable to authoritative sources (NREL, EIA, IEEE standards). No black-box estimates.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-emerald-400 text-sm font-semibold mb-1">✓ Source-Backed</div>
                  <div className="text-xs text-slate-400">NREL, EIA data</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 text-sm font-semibold mb-1">✓ Transparent</div>
                  <div className="text-xs text-slate-400">Full methodology</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 text-sm font-semibold mb-1">✓ Accurate</div>
                  <div className="text-xs text-slate-400">Industry verified</div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">How It Works</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">1</div>
                  <div className="text-sm font-semibold text-white mb-1">Your Location</div>
                  <div className="text-xs text-slate-400">Live utility & solar data</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">2</div>
                  <div className="text-sm font-semibold text-white mb-1">Your Industry</div>
                  <div className="text-xs text-slate-400">Custom power profile</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">3</div>
                  <div className="text-sm font-semibold text-white mb-1">TrueQuote™</div>
                  <div className="text-xs text-slate-400">Source-backed pricing</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowTrueQuoteModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Dropdowns */}
      {countryDropdownOpen && region === "international" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCountryDropdownOpen(false)}>
          <div className="bg-slate-800 rounded-xl p-4 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
            {INTERNATIONAL_DATA.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  setSelectedCountry(country.code);
                  setSelectedCity("");
                  setCountryDropdownOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-violet-500/20 rounded-lg flex items-center gap-3 transition-colors"
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="text-white font-semibold">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cityDropdownOpen && selectedCountryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCityDropdownOpen(false)}>
          <div className="bg-slate-800 rounded-xl p-4 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl border border-slate-700" onClick={(e) => e.stopPropagation()}>
            {selectedCountryData.cities.map((city) => (
              <button
                key={city.name}
                onClick={() => {
                  setSelectedCity(city.name);
                  setCityDropdownOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-violet-500/20 rounded-lg transition-colors"
              >
                <span className="text-white font-semibold">{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Step1AdvisorLed;
