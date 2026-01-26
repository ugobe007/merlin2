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

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Search,
  Building2,
  Loader2,
  Check,
  Sparkles,
  ChevronDown,
  Activity,
  Info,
  AlertCircle,
  X,
} from "lucide-react";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import type { WizardState, EnergyGoal } from "../types";

// Live API Services
import {
  enrichLocationData,
  type EnrichedLocationData,
} from "@/services/locationEnrichmentService";
import {
  lookupZipCode,
  getQuickStateFromZip,
  type ZipCodeResult,
} from "@/services/zipCodeLookupService";
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

// ============================================================================
// GOALS CONFIGURATION
// ============================================================================

const DEFAULT_GOALS: EnergyGoal[] = ["reduce_costs", "peak_shaving"];

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
  updateState: (
    updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)
  ) => void;
  onNext?: () => void;
  onGoToStep2?: () => void;
}

export function Step1AdvisorLed({ state, updateState, onNext: _onNext, onGoToStep2: _onGoToStep2 }: Props) {
  // ✅ FIX (Jan 25, 2026): Prefix unused callbacks with _ (parent WizardV6 handles navigation)
  // These props exist for API consistency but aren't used in this step
  
  // 🔎 DEV MARKER: Prove this component is actually running (Jan 25, 2026)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("✅ RUNNING Step1AdvisorLed.tsx (DEV MARKER) —", new Date().toISOString());
  }
  
  // TrueQuote modal state
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // Facility refine toggle state (unused after Jan 20 refactor, kept for future use)
  const [_showFacilityRefine, _setShowFacilityRefine] = useState(false);

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
  const [zipLookupResult, setZipLookupResult] = useState<ZipCodeResult | null>(null);
  const [businessLookup, setBusinessLookup] = useState<PlaceLookupResult | null>(null);

  // 🔎 DEBUG: Track business state changes (Jan 25, 2026)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🔎 Step1 business state:", {
        businessName: state.businessName,
        businessAddress: state.businessAddress,
        businessLookup,
        businessNameInput,
      });
    }
  }, [state.businessName, state.businessAddress, businessLookup, businessNameInput]);

  // 🔎 WATCHER: Detect if wizard state gets overwritten (Jan 25, 2026)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🧠 wizard business fields changed:", {
        businessName: state.businessName,
        businessAddress: state.businessAddress,
        detectedIndustry: (state as any).detectedIndustry,
        industry: state.industry,
      });
    }
  }, [state.businessName, state.businessAddress, (state as any).detectedIndustry, state.industry]);

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

  // Handle ZIP c5, 2026): 3-Tier lookup: Database → Google Maps → Hardcoded
  useEffect(() => {
    if (region === "us" && zipInput.length === 5) {
      setIsEnriching(true);
      setZipError(null);

      // ✅ OPTIMISTIC UPDATE: Set quick state from hardcoded ranges
      const quickState = getQuickStateFromZip(zipInput);
      updateState({
        zipCode: zipInput,
        state: quickState || "",
        country: "US",
        currency: "USD",
      });

      // ✅ TIER 1-3: Database → Google Maps → Hardcoded (parallel with enrichment)
      Promise.all([
        lookupZipCode(zipInput),
        enrichLocationData(zipInput)
      ])
        .then(([zipResult, enriched]) => {
          // Save ZIP lookup result
          if (zipResult) {
            setZipLookupResult(zipResult);
          }

          // Save enrichment data
          if (enriched) {
            setEnrichedData(enriched);
            setZipError(null);
            
            // Update with full enriched data + energy metrics
            updateState({
              zipCode: zipInput,
              state: enriched.stateCode,
              city: enriched.city,
              country: "US",
              electricityRate: enriched.utility.rate,
              solarData: { sunHours: enriched.solar.sunHours, rating: enriched.solar.label },
              currency: "USD",
              weatherData: {
                profile: enriched.weather.profile,
                extremes: enriched.weather.extremes,
                source: "visual-crossing" as const,
              },
              // ✅ NEW: Populate energy metrics for persistent header display
              energyMetrics: {
                utilityRate: enriched.utility.rate,
                demandCharge: enriched.utility.demandCharge,
                solarRating: enriched.solar.label,
                solarHours: enriched.solar.sunHours,
                hasTOU: enriched.utility.hasTOU,
                utilityName: enriched.utility.name,
                location: `${enriched.city}, ${enriched.stateCode}`,
              },
            });
          } else if (zipResult) {
            // ZIP lookup succeeded but enrichment failed - use ZIP data
            updateState({
              zipCode: zipInput,
              state: zipResult.state,
              city: zipResult.city,
              country: "US",
              currency: "USD",
            });
            setZipError(null);
          } else {
            // Both failed
            setZipError("Unable to find location data for this ZIP code");
          }
        })
        .catch((err) => {
          console.error("ZIP lookup/enrichment error:", err);
          setZipError("Error looking up ZIP code");
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

    if (extremeStr.includes("heat") || extremeStr.includes("hot")) {
      CLIMATE_GOAL_MAP.extreme_heat.forEach((g) => autoGoals.add(g));
    }
    if (extremeStr.includes("hurricane") || extremeStr.includes("storm")) {
      CLIMATE_GOAL_MAP.hurricane.forEach((g) => autoGoals.add(g));
    }
    if (extremeStr.includes("cold") || extremeStr.includes("freeze")) {
      CLIMATE_GOAL_MAP.extreme_cold.forEach((g) => autoGoals.add(g));
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

    const searchQuery =
      region === "us"
        ? `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${zipInput}`
        : `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${selectedCity}, ${selectedCountry}`;

    setIsLookingUp(true);
    try {
      const result = await lookupBusinessByAddress(searchQuery.trim());
      setBusinessLookup(result);

      // ✅ VINEET FIX (Jan 25, 2026): Loosen gate - persist even if businessName missing
      // Use input as fallback to ensure we don't lose data
      if (result.found) {
        const patch: Partial<typeof state> = {
          businessName: result.businessName || businessNameInput.trim() || "",
          businessAddress: result.formattedAddress || "",
          businessPhotoUrl: result.photoUrl,
          businessPlaceId: result.placeId,
          detectedIndustry: result.industrySlug,
          businessLat: result.lat,
          businessLng: result.lng,
        };

        // Only set industry fields if we have a valid slug (prevents "" writes)
        if (result.industrySlug) {
          patch.industry = result.industrySlug;
          patch.industryName = INDUSTRY_NAMES[result.industrySlug] || result.businessType || "";
        }

        updateState(patch);
        
        // 🔎 DEBUG: Verify SSOT persistence happened (Jan 25, 2026)
        if (import.meta.env.DEV) {
          console.log("✅ persisted business to wizard state", {
            name: patch.businessName,
            addr: patch.businessAddress,
            industry: result?.industrySlug || "(not detected)",
            patchKeys: Object.keys(patch),
          });
        }
      }
    } catch (error) {
      console.error("❌ Address lookup failed:", error);
      setBusinessLookup({ found: false });
      
      // ✅ FALLBACK MODE (Jan 25, 2026): Save business name even if API fails
      // This allows manual entry when Google Places API key is missing
      if (import.meta.env.DEV) {
        console.warn("⚠️  Google Places API unavailable - using fallback mode");
        console.log("💡 Add VITE_GOOGLE_PLACES_API_KEY to .env for full business lookup");
      }
      
      // Save what we have from user input
      updateState({
        businessName: businessNameInput.trim(),
        businessAddress: searchQuery.trim(),
      });
      
      if (import.meta.env.DEV) {
        console.log("✅ saved business name (fallback mode):", {
          name: businessNameInput.trim(),
          addr: searchQuery.trim(),
        });
      }
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

  // ✅ Navigation handled by parent WizardV6 via _canProceed() function (line 2305)
  // WizardV6 checks: state.zipCode.length === 5 && state.state !== "" && state.goals.length >= 2
  
  const selectedCountryData = selectedCountry ? getCountryData(selectedCountry) : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="px-6 lg:px-10 max-w-6xl mx-auto">
      <div className="max-w-[1000px] mx-auto">
        {/* Welcome & Introduction */}
        <div className="mb-4">
          {/* TrueQuote Badge - Clickable */}
          <div onClick={() => setShowTrueQuoteModal(true)} className="inline-block mb-2 cursor-pointer">
            <TrueQuoteBadgeCanonical showTooltip={false} />
          </div>
          
          {/* Identity Line - What is this product */}
          <div className="text-xs text-slate-500 mb-6 font-medium">
            Source-backed energy savings model
          </div>

          {/* Compact Instrument Header (≤64px total) */}
          <h1 className="text-3xl font-black text-white mb-1 leading-tight">
            Start saving on your energy bill.
          </h1>
          <p className="text-sm text-slate-400">
            Enter your location to load local rates and estimate your savings.
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
                  Every number in your quote is traceable to authoritative sources (NREL, EIA, IEEE
                  standards). No black-box estimates.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                    <div className="text-emerald-400 text-xs font-semibold mb-1">
                      ✓ Source-Backed
                    </div>
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
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">
                  1
                </div>
                <div className="text-white text-sm font-semibold mb-1">Your Location</div>
                <div className="text-slate-500 text-xs">Live utility & solar data</div>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">
                  2
                </div>
                <div className="text-white text-sm font-semibold mb-1">Your Industry</div>
                <div className="text-slate-500 text-xs">Custom power profile</div>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold mx-auto mb-2">
                  3
                </div>
                <div className="text-white text-sm font-semibold mb-1">TrueQuote™</div>
                <div className="text-slate-500 text-xs">Source-backed pricing</div>
              </div>
            </div>
          </div>

          {/* Location Input Header - REMOVED */}
          <div className="hidden">
            <h2 className="text-2xl font-black text-white mb-2">
              Let's start with your site location
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              I'll fetch live utility rates, solar potential, and weather data
            </p>
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

          {/* Business Display Box - Shown when business is found */}
          {region === "us" && businessLookup?.found && (
            <div className="mb-6 bg-gradient-to-br from-slate-700/40 via-slate-800/50 to-blue-900/30 border-2 border-blue-500/30 rounded-xl overflow-hidden shadow-xl shadow-blue-500/10">
              {/* Header with photo and basic info */}
              <div className="p-6 border-b border-blue-400/20">
                <div className="flex items-start gap-4">
                  {businessLookup.photoUrl ? (
                    <img
                      src={businessLookup.photoUrl}
                      alt=""
                      className="w-24 h-24 rounded-xl object-cover border-2 border-blue-400/30 shadow-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border-2 border-blue-400/30 flex-shrink-0">
                      <Building2 className="w-12 h-12 text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-2xl font-black text-white mb-1">
                          {businessLookup.businessName}
                        </div>
                        {businessLookup.businessType && (
                          <div className="text-xs text-slate-400 mb-2">
                            {businessLookup.businessType}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-1">{businessLookup.formattedAddress}</span>
                    </div>
                    {businessLookup.industrySlug && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-400/30 rounded-full text-sm font-semibold text-violet-300">
                          <Activity className="w-4 h-4" />
                          {INDUSTRY_NAMES[businessLookup.industrySlug] ||
                            businessLookup.businessType}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setBusinessLookup(null);
                      setBusinessNameInput("");
                      setStreetAddress("");
                    }}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-all flex-shrink-0"
                    title="Clear business"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="px-6 py-4 bg-slate-900/30">
                <div className="grid grid-cols-3 gap-3">
                  {/* Location verified */}
                  <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <div className="text-xs font-semibold text-slate-400">LOCATION</div>
                    </div>
                    <div className="text-sm font-bold text-white">Verified</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {enrichedData?.city}, {enrichedData?.stateCode}
                    </div>
                  </div>

                  {/* Industry match */}
                  <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      <div className="text-xs font-semibold text-slate-400">INDUSTRY</div>
                    </div>
                    <div className="text-sm font-bold text-white">Matched</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {businessLookup.industrySlug ? "Auto-detected" : "Manual entry"}
                    </div>
                  </div>

                  {/* Accuracy boost */}
                  <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <div className="text-xs font-semibold text-slate-400">ACCURACY</div>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">Building-level</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      95%+ precision
                    </div>
                  </div>
                </div>

                {/* Info banner */}
                <div className="mt-3 bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                  <p className="text-xs text-blue-200 leading-relaxed">
                    <strong>Great!</strong> Building-level data loaded. We'll use this to refine power
                    profiles, load patterns, and utility assumptions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* US ZIP Input - Hero Command Bar (64px) */}
          {region === "us" && (
            <div className="w-full">
              <div
                className={`zip-hero-input ${enrichedData ? "validated" : ""} flex items-center px-6 ${
                  zipError ? "!border-red-500/40" : ""
                }`}
              >
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

              {zipError && (
                <p className="mt-3 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {zipError}
                </p>
              )}

              {/* Validation Micro-Feedback (single line, calm) */}
              {enrichedData && (
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Local utility + climate data loaded
                </div>
              )}

              {/* ✅ BUSINESS IDENTITY CARD (Jan 25, 2026) - Promoted to top */}
              {(state.businessName || state.businessAddress) && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-emerald-400 font-semibold mb-1">
                        ✓ Recognized Business
                      </div>
                      <div className="text-lg font-bold text-white">{state.businessName}</div>
                      {state.businessAddress && (
                        <div className="text-sm text-slate-300 mt-1">{state.businessAddress}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        // ✅ Clear both SSOT state and local lookup (Jan 25, 2026)
                        updateState({
                          businessName: "",
                          businessAddress: "",
                          detectedIndustry: "",
                          // Don't clear industry/industryName if user manually selected later
                        });
                        setBusinessNameInput("");
                        setBusinessLookup(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded border border-slate-600 hover:border-slate-400"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* ✨ ENERGY OPPORTUNITY PANEL (Jan 25, 2026) */}
              {enrichedData && (
                <div className="mt-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-400/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-400/30">
                      <Activity className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Energy Opportunities
                        <span className="text-xs font-normal text-violet-300">
                          {enrichedData.city}, {enrichedData.stateCode}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Location-specific savings analysis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Utility Rate */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="text-xs text-slate-400 mb-1">Utility Rate</div>
                      <div className="text-lg font-bold text-white">
                        ${enrichedData.utility.rate.toFixed(2)}/kWh
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {enrichedData.utility.rate > 0.18 ? '⚡ High - Great for BESS' : 
                         enrichedData.utility.rate > 0.12 ? '✓ Good for savings' : 
                         '○ Moderate rates'}
                      </div>
                    </div>

                    {/* Demand Charge */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="text-xs text-slate-400 mb-1">Demand Charge</div>
                      <div className="text-lg font-bold text-white">
                        ${enrichedData.utility.demandCharge}/kW
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {enrichedData.utility.demandCharge > 20 ? '⚡ High - Peak shaving ROI' : 
                         enrichedData.utility.demandCharge > 12 ? '✓ Good opportunity' : 
                         '○ Standard'}
                      </div>
                    </div>

                    {/* Solar Potential */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="text-xs text-slate-400 mb-1">Solar Potential</div>
                      <div className="text-lg font-bold text-white flex items-center gap-1.5">
                        ☀️ {enrichedData.solar.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {enrichedData.solar.sunHours.toFixed(1)} hrs/day peak sun
                      </div>
                    </div>

                    {/* TOU Arbitrage */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="text-xs text-slate-400 mb-1">Energy Arbitrage</div>
                      <div className="text-lg font-bold text-white">
                        {enrichedData.utility.hasTOU ? '✓ Available' : '○ Limited'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {enrichedData.utility.hasTOU 
                          ? `${enrichedData.utility.name}`
                          : 'No TOU rates'}
                      </div>
                    </div>
                  </div>

                  {/* Overall Opportunity Score */}
                  {(() => {
                    const score = 
                      (enrichedData.utility.rate > 0.18 ? 3 : enrichedData.utility.rate > 0.12 ? 2 : 1) +
                      (enrichedData.utility.demandCharge > 20 ? 3 : enrichedData.utility.demandCharge > 12 ? 2 : 1) +
                      (enrichedData.solar.sunHours > 5.0 ? 3 : enrichedData.solar.sunHours > 4.0 ? 2 : 1) +
                      (enrichedData.utility.hasTOU ? 2 : 0);
                    
                    const rating = score >= 9 ? 'Excellent' : score >= 6 ? 'Good' : 'Fair';
                    const color = score >= 9 ? 'emerald' : score >= 6 ? 'blue' : 'slate';
                    
                    return (
                      <div className={`bg-${color}-500/10 border border-${color}-400/30 rounded-lg p-3`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white">
                              💡 {rating} Location for Energy Storage
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {score >= 9 
                                ? 'High utility costs + TOU rates + strong solar = compelling economics'
                                : score >= 6 
                                ? 'Good fundamentals for BESS + solar hybrid systems'
                                : 'Moderate opportunity - focus on peak shaving and backup power'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Address + Business Name - Always Visible After ZIP */}
              {enrichedData && !businessLookup?.found && (
                <div className="mt-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-600/30 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-blue-400/30">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Refine Your Savings Model <span className="text-xs text-slate-500 font-normal">(Recommended)</span></h3>
                      <p className="text-xs text-slate-400">Load building type and utility profile for higher accuracy</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Business / Facility Name
                    </label>
                    <input
                      type="text"
                      value={businessNameInput}
                      onChange={(e) => setBusinessNameInput(e.target.value)}
                      placeholder="e.g., WOW Carwash, Marriott, Walmart"
                      onKeyDown={(e) =>
                        e.key === "Enter" && businessNameInput.trim() && handleAddressLookup()
                      }
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-blue-500/30 bg-slate-800/50 text-white placeholder-slate-500 focus:border-blue-400/50 focus:bg-slate-800/70 outline-none transition-all hover:border-blue-500/40 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Street Address <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="123 Main St"
                      onKeyDown={(e) =>
                        e.key === "Enter" && businessNameInput.trim() && handleAddressLookup()
                      }
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-600/30 bg-slate-800/50 text-white placeholder-slate-500 focus:border-slate-500/50 focus:bg-slate-800/70 outline-none transition-all hover:border-slate-600/40 shadow-inner"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Improves location precision for utility rates and solar yield
                    </p>
                  </div>

                  {businessNameInput.trim() && (
                    <button
                      onClick={handleAddressLookup}
                      disabled={isLookingUp}
                      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:from-blue-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 text-lg"
                    >
                      {isLookingUp ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Find My Business
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* International Dropdowns - Full Width */}
          {region === "international" && (
            <div className="w-full space-y-3">
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="w-full px-5 py-4 rounded-xl border-2 border-indigo-500/30 bg-slate-800/40 text-white flex items-center justify-between hover:border-indigo-500/40 transition-all shadow-lg backdrop-blur-sm"
              >
                <span className={selectedCountry ? "text-white font-semibold" : "text-slate-500"}>
                  {selectedCountryData
                    ? `${selectedCountryData.flag} ${selectedCountryData.name}`
                    : "Select country..."}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {selectedCountryData && (
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/50 text-white flex items-center justify-between hover:border-slate-600/50 transition-all shadow-lg"
                >
                  <span className={selectedCity ? "text-white font-semibold" : "text-slate-500"}>
                    {selectedCity || "Select city..."}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                  />
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

        {/* Refine with Your Facility section removed - Jan 20, 2026 */}

        {/* Continue Button - REMOVED: Use bottom nav instead to avoid duplicate CTAs
        {/* Continue Button - REMOVED: Use bottom nav instead to avoid duplicate CTAs */}
      </div>

      {/* TrueQuote Modal */}
      {showTrueQuoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTrueQuoteModal(false)}
        >
          <div
            className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-violet-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20">
                  ✨
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">What is TrueQuote™?</h2>
                  <p className="text-sm text-violet-300">
                    Every number is traceable to authoritative sources
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrueQuoteModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Explainer Card */}
            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 rounded-xl p-6 mb-6">
              <p className="text-slate-300 leading-relaxed mb-4">
                Every number in your quote is traceable to authoritative sources (NREL, EIA, IEEE
                standards). No black-box estimates.
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
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">
                    1
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">Your Location</div>
                  <div className="text-xs text-slate-400">Live utility & solar data</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">
                    2
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">Your Industry</div>
                  <div className="text-xs text-slate-400">Custom power profile</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 border-2 border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-lg mx-auto mb-3">
                    3
                  </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCountryDropdownOpen(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-4 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCityDropdownOpen(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-4 max-w-md w-full max-h-96 overflow-y-auto shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
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
