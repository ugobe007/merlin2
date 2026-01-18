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

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Globe,
  Zap,
  Sun,
  Star,
  ChevronDown,
  Check,
  Search,
  Building2,
  Loader2,
} from "lucide-react";
import type { WizardState, EnergyGoal } from "../types";

// SSOT Imports - All location data comes from centralized data files
import { getStateFromZip, getStateData } from "@/services/data/stateElectricityRates";
import {
  INTERNATIONAL_DATA,
  getCountryData,
  getCityData,
} from "@/services/data/internationalRates";

import {
  lookupBusinessByAddress,
  getStaticMapUrl,
  INDUSTRY_NAMES,
  type PlaceLookupResult,
} from "@/services/googlePlacesService";

// Component imports
import { SavingsPreviewPanel } from "../components/SavingsPreviewPanel";

// ✅ NEW: Teaser Preview Service (Jan 16, 2026)
import {
  calculateTeaserPreview,
  computeTeaserHash,
  formatROISmart,
  type TeaserInput,
} from "@/services/teaserPreviewService";

// ✅ NEW: Advisor Publisher Hook (Jan 16, 2026)
import { useAdvisorPublisher } from "../advisor/AdvisorPublisher";

// ✅ PHASE 2A: Intelligence Panel Component (Jan 18, 2026)
import { IntelligencePanel } from "../shared/IntelligencePanel";
import type { IntelligenceContext } from "@/types/intelligence.types";

// ============================================================================
// ENERGY GOALS - Updated Jan 15, 2026
// ============================================================================

const ENERGY_GOALS: { id: EnergyGoal; label: string; description: string; emoji: string }[] = [
  {
    id: "reduce_costs",
    label: "Save Money",
    description: "Lower monthly energy bills",
    emoji: "💰",
  },
  {
    id: "backup_power",
    label: "Backup Power",
    description: "Stay online during outages",
    emoji: "⚡",
  },
  {
    id: "grid_independence",
    label: "Energy Resilience",
    description: "Reduce grid dependence",
    emoji: "🛡️",
  },
  { id: "sustainability", label: "Go Green", description: "Reduce carbon footprint", emoji: "🌱" },
  {
    id: "peak_shaving",
    label: "Balance Energy Loads",
    description: "Avoid peak demand charges",
    emoji: "📊",
  },
  {
    id: "generate_revenue",
    label: "Generate Revenue",
    description: "Sell power back to grid",
    emoji: "💵",
  },
];

const MIN_GOALS_REQUIRED = 2;

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (
    updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)
  ) => void;
  intelligence?: IntelligenceContext; // ✅ PHASE 2A: Intelligence data (Jan 18, 2026)
  onNext?: () => void;
  onGoToStep2?: () => void;
}

export function Step1Location({
  state,
  updateState,
  intelligence,
  onNext: _onNext,
  onGoToStep2,
}: Props) {
  // ✅ NEW: Access advisor publisher for teaser (Jan 16, 2026)
  const { publish: publishToAdvisor } = useAdvisorPublisher();

  const [region, setRegion] = useState<"us" | "international">("us");
  const [zipInput, setZipInput] = useState(state.zipCode || "");
  const [zipError, setZipError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Address lookup state
  const [businessNameInput, setBusinessNameInput] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [businessLookup, setBusinessLookup] = useState<PlaceLookupResult | null>(null);
  const [showAddressField, setShowAddressField] = useState(false);

  const locationData = useMemo(() => {
    if (region === "us" && state.state) {
      const stateData = getStateData(state.state);
      if (stateData) {
        return {
          electricityRate: stateData.electricityRate,
          sunHours: stateData.sunHours,
          solarRating: stateData.solarRating,
          solarLabel: stateData.solarLabel,
        };
      }
    } else if (region === "international" && selectedCountry && selectedCity) {
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
    const searchQuery =
      region === "us"
        ? `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${zipInput}`
        : `${businessNameInput}${streetAddress ? ", " + streetAddress : ""}, ${selectedCity}, ${selectedCountry}`;

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
          industry: result.industrySlug || "",
          industryName: result.industrySlug
            ? INDUSTRY_NAMES[result.industrySlug] || result.businessType || ""
            : "",
        });

        // ✅ NEW: Generate teaser preview (Jan 16, 2026)
        if (result.industrySlug && locationData) {
          try {
            const teaserInput: TeaserInput = {
              zipCode: zipInput,
              state: state.state,
              city: state.city,
              industrySlug: result.industrySlug,
              businessSizeTier:
                state.businessSizeTier && state.businessSizeTier !== "enterprise"
                  ? state.businessSizeTier
                  : "medium", // Default to medium if undefined or enterprise
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
              key: "step-1-teaser",
              mode: "estimate",
              headline: "🔮 Sneak Peek",
              subline: "Quick preview based on your location and industry",
              cards: [
                {
                  id: "solar-bess",
                  type: "discovery",
                  title: "☀️ Save Money",
                  body: `$${(teaser.solarBess.annualSavings / 1000).toFixed(0)}k/year\nTypical payback: ${formatROISmart(teaser.solarBess.roiYears, teaser.solarBess.roiCapped)}\n\n${teaser.solarBess.systemSize}`,
                  badge: "Estimate",
                },
                {
                  id: "generator-bess",
                  type: "discovery",
                  title: "🔥 Resilience",
                  body: `${Math.floor(teaser.generatorBess.resilienceHours)} hrs backup\n${teaser.generatorBess.roiCapped ? "Cost recovery primarily from uptime value" : `Typical savings: $${(teaser.generatorBess.annualSavings / 1000).toFixed(0)}k/year`}\n\n${teaser.generatorBess.systemSize}`,
                  badge: "Estimate",
                },
              ],
              disclaimer: teaser.disclaimer,
              debug: {
                source: "Step1Location",
                ts: new Date().toISOString(),
              },
            });
          } catch (error) {
            console.error("⚠️ Teaser preview calculation failed:", error);
            // Don't block user experience if teaser fails
          }
        }
      }
    } catch (error) {
      console.error("Address lookup failed:", error);
      setBusinessLookup({ found: false });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Clear business lookup when zip changes
  useEffect(() => {
    if (businessLookup) {
      setBusinessLookup(null);
      setBusinessNameInput("");
      setStreetAddress("");
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
    if (region === "us" && zipInput.length === 5) {
      const stateCode = getStateFromZip(zipInput);
      if (stateCode) {
        const stateData = getStateData(stateCode);
        if (stateData) {
          setZipError(null);
          updateState({
            zipCode: zipInput,
            state: stateCode,
            city: stateData.name,
            country: "US",
            electricityRate: stateData.electricityRate,
            solarData: {
              sunHours: stateData.sunHours,
              rating: stateData.solarLabel,
            },
            currency: "USD",
          });
        } else {
          setZipError("Please enter a valid US zip code");
        }
      } else {
        setZipError("Please enter a valid US zip code");
      }
    } else if (region === "us" && zipInput.length > 0 && zipInput.length < 5) {
      // Clear error while typing
      setZipError(null);
    }
  }, [zipInput, region, updateState]);

  // Handle international location changes
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
      ? currentGoals.filter((g) => g !== goalId)
      : [...currentGoals, goalId];
    updateState({ goals: newGoals });
  };

  const selectedGoalsCount = state.goals?.length || 0;
  const hasEnoughGoals = selectedGoalsCount >= MIN_GOALS_REQUIRED;

  const selectedCountryData = selectedCountry ? getCountryData(selectedCountry) : null;

  // Removed: canContinueLocation, canContinue, handleContinue, PROOF_TILES (tight headline only)

  return (
    <div className="text-white">
      {/* HERO (headline ABOVE panels) */}
      <div className="stepHeaderGlow mb-7 px-4">
        <div className="stepHero">
          <h1 className="stepHero__title">Slash your energy costs.</h1>

          <div className="stepHero__stack">
            <div className="stepHero__line stepHero__line--accent">
              Methodically. Intelligently.
            </div>
            <div className="stepHero__line stepHero__line--muted">One step at a time.</div>
          </div>

          <div className="stepHero__micro">Location → rates → savings model → payback estimate</div>
        </div>
      </div>

      {/* 🔮 SAVINGS SNEAK PREVIEW (between hero and panels) */}
      {businessLookup?.found && businessLookup.industrySlug && locationData && (
        <div className="mb-8 px-4">
          <SavingsPreviewPanel
            businessName={businessLookup.businessName || ""}
            industrySlug={businessLookup.industrySlug}
            industryName={
              INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType || ""
            }
            electricityRate={locationData.electricityRate}
            demandCharge={15}
            sunHours={locationData.sunHours}
            state={state.state}
            onContinue={() => {
              const goalsSection = document.getElementById("goals-section");
              if (goalsSection) {
                goalsSection.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            onChangeIndustry={() => {
              if (onGoToStep2) onGoToStep2();
            }}
          />
        </div>
      )}

      {/* COMPACT LOCATION PILLS (tightened spacing) */}
      {locationData && (
        <div className="mb-5 flex flex-wrap gap-3 justify-center px-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200 text-sm font-medium">
              {locationData.sunHours} hrs/day
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-200 text-sm font-medium">
              ${locationData.electricityRate.toFixed(4)}/kWh
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              locationData.solarRating === "A"
                ? "bg-green-500/10 border border-green-500/30"
                : locationData.solarRating === "B"
                  ? "bg-amber-500/10 border border-amber-500/30"
                  : "bg-blue-500/10 border border-blue-500/30"
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                locationData.solarRating === "A"
                  ? "text-green-400"
                  : locationData.solarRating === "B"
                    ? "text-amber-400"
                    : "text-blue-400"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                locationData.solarRating === "A"
                  ? "text-green-200"
                  : locationData.solarRating === "B"
                    ? "text-amber-200"
                    : "text-blue-200"
              }`}
            >
              {locationData.solarRating} - {locationData.solarLabel}
            </span>
          </div>
        </div>
      )}

      {/* PANELS GRID (tightened spacing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Your Location */}
        <div>
          <div className="relative p-5 card-tier-1 rounded-2xl shadow-tight">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Your Location</h2>
            </div>

            {/* Region Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setRegion("us")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  region === "us"
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/7 border border-white/10"
                }`}
              >
                🇺🇸 United States
              </button>
              <button
                onClick={() => setRegion("international")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                  region === "international"
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/7 border border-white/10"
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                International
              </button>
            </div>

            {/* US Zip Code Input */}
            {region === "us" && (
              <div className="mb-6">
                {/* Only show ZIP input prominently if business not found yet */}
                {!businessLookup?.found && (
                  <>
                    <label className="block text-sm font-semibold text-slate-200 mb-2.5">
                      Enter your zip code
                    </label>
                    <input
                      type="text"
                      value={zipInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                        setZipInput(value);
                      }}
                      placeholder="e.g., 89101"
                      className={`w-full px-4 py-4 rounded-xl text-xl font-bold text-center tracking-widest card-tier-2 transition-all ${
                        zipError
                          ? "border-red-400/40 bg-red-900/30 text-red-300 placeholder-red-400/50"
                          : zipInput.length === 5
                            ? "border-emerald-400/40 bg-emerald-900/30 text-emerald-300 shadow-glow"
                            : "text-white placeholder-slate-400 u-hover-lift"
                      } focus:border-amber-400/60 focus:ring-2 focus:ring-amber-500/40 focus:shadow-glow outline-none`}
                    />
                    {zipError && (
                      <p className="mt-2 text-sm text-red-400 font-medium">{zipError}</p>
                    )}
                  </>
                )}

                {/* ✅ PHASE 2A: Intelligence Panels After Valid ZIP (Jan 18, 2026) */}
                {zipInput.length === 5 && !zipError && !businessLookup?.found && (
                  <div className="mt-5 space-y-4">
                    <IntelligencePanel
                      type="valueTeaser"
                      data={intelligence?.valueTeaser || null}
                    />
                    <IntelligencePanel
                      type="weatherImpact"
                      data={intelligence?.weatherImpact || null}
                    />
                  </div>
                )}

                {/* Address Lookup Section - shown after valid zip, hidden when business found */}
                {zipInput.length === 5 && !zipError && !businessLookup?.found && (
                  <div className="mt-4">
                    {!showAddressField && (
                      <button
                        onClick={() => setShowAddressField(true)}
                        className="w-full py-4 px-4 rounded-xl border-2 border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:text-white transition-all text-base font-medium shadow-lg shadow-amber-500/20"
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
                            className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-slate-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/30 outline-none transition-all text-lg"
                            autoFocus
                          />
                        </div>

                        {/* Street Address Field */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Street Address{" "}
                            <span className="text-slate-500">(optional, improves accuracy)</span>
                          </label>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="e.g., 9860 S Maryland Pkwy"
                            className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-slate-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleAddressLookup()}
                          />
                        </div>

                        {/* Search Button */}
                        <button
                          onClick={handleAddressLookup}
                          disabled={isLookingUp || !businessNameInput.trim()}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
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
                            <span className="text-green-100">
                              ⚡ ${locationData.electricityRate.toFixed(4)}/kWh
                            </span>
                            <span className="text-green-100">
                              ☀️ {locationData.sunHours} hrs/day
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 p-5">
                      <div className="flex items-start gap-4">
                        {/* Business Photo or Map */}
                        <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border-2 border-green-500/50 shadow-lg">
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/30 border border-amber-400 mb-3">
                              <span className="text-amber-200 font-semibold">
                                {INDUSTRY_NAMES[businessLookup.industrySlug] ||
                                  businessLookup.businessType}
                              </span>
                              <Check className="w-4 h-4 text-green-400" />
                            </div>
                          )}

                          <p className="text-slate-300 text-sm mb-3">
                            📍 {businessLookup.formattedAddress}
                          </p>

                          {/* Merlin's commitment */}
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-emerald-300 text-sm">
                              🧙 <span className="font-semibold">Merlin says:</span> "I'll design a
                              custom energy solution for {businessLookup.businessName}. Select your
                              goals and click Continue!"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ✅ PHASE 2A: Industry Detection Intelligence (Jan 18, 2026) */}
                      {intelligence?.inferredIndustry && (
                        <div className="mt-4">
                          <IntelligencePanel
                            type="industryHint"
                            data={intelligence.inferredIndustry}
                          />
                        </div>
                      )}

                      {/* Wrong business link - subtle, not a big button */}
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => {
                            setBusinessLookup(null);
                            setBusinessNameInput("");
                            setStreetAddress("");
                            setShowAddressField(true);
                            updateState({
                              businessName: undefined,
                              businessAddress: undefined,
                              detectedIndustry: undefined,
                              industry: "",
                              industryName: "",
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
            {region === "international" && (
              <div className="space-y-4 mb-6">
                {/* Country Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Country
                  </label>
                  <button
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white flex items-center justify-between hover:border-amber-400/50 transition-all"
                  >
                    <span className={selectedCountry ? "text-white" : "text-gray-400"}>
                      {selectedCountryData
                        ? `${selectedCountryData.flag} ${selectedCountryData.name}`
                        : "Select a country..."}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {countryDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {INTERNATIONAL_DATA.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country.code);
                            setSelectedCity("");
                            setCountryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-amber-500/20 flex items-center gap-3 transition-colors"
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white flex items-center justify-between hover:border-amber-400/50 transition-all"
                    >
                      <span className={selectedCity ? "text-white" : "text-gray-400"}>
                        {selectedCity || "Select a city..."}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {cityDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {selectedCountryData.cities.map((city) => (
                          <button
                            key={city.name}
                            onClick={() => {
                              setSelectedCity(city.name);
                              setCityDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors"
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
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-5 border border-amber-400/30">
                <h3 className="font-semibold text-white mb-4">
                  📍{" "}
                  {region === "us"
                    ? `${state.city || state.state}, ${state.state}`
                    : `${selectedCity}, ${selectedCountryData?.name}`}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-400" />
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
                      <Sun className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Sun Hours</div>
                      <div className="font-semibold text-white">
                        {locationData.sunHours} hrs/day
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 col-span-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        locationData.solarRating === "A"
                          ? "bg-green-500/20"
                          : locationData.solarRating === "B"
                            ? "bg-blue-500/20"
                            : locationData.solarRating === "C"
                              ? "bg-yellow-500/20"
                              : "bg-gray-500/20"
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          locationData.solarRating === "A"
                            ? "text-green-400"
                            : locationData.solarRating === "B"
                              ? "text-blue-400"
                              : locationData.solarRating === "C"
                                ? "text-yellow-400"
                                : "text-slate-400"
                        }`}
                      />
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
        </div>

        {/* RIGHT COLUMN: Your Goals */}
        <div>
          <div
            id="goals-section"
            className="relative p-5 card-tier-1 rounded-2xl shadow-tight scroll-mt-4"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Your Goals</h2>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hasEnoughGoals
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                }`}
              >
                {selectedGoalsCount}/{MIN_GOALS_REQUIRED} selected
              </div>
            </div>

            {/* ✅ PHASE 2A: Suggested Goals Intelligence (Jan 18, 2026) */}
            {intelligence?.suggestedGoals && intelligence.suggestedGoals.length > 0 && (
              <div className="mb-5">
                <IntelligencePanel type="suggestedGoals" data={intelligence.suggestedGoals} />
              </div>
            )}

            {/* Always visible instruction - prominent */}
            <div
              className={`mb-5 p-4 rounded-xl text-center ${
                hasEnoughGoals
                  ? "bg-green-500/20 border-2 border-green-500/50"
                  : "bg-amber-500/20 border-2 border-amber-400/50 animate-pulse"
              }`}
            >
              <p
                className={`text-base font-semibold ${hasEnoughGoals ? "text-green-300" : "text-amber-300"}`}
              >
                {hasEnoughGoals
                  ? `✓ Great! You've selected ${selectedGoalsCount} goals`
                  : `👆 Select ${MIN_GOALS_REQUIRED - selectedGoalsCount} more goal${MIN_GOALS_REQUIRED - selectedGoalsCount > 1 ? "s" : ""} to continue`}
              </p>
            </div>

            {/* Goals Grid - Decision cards with left accent bar */}
            <div className="grid grid-cols-2 gap-2.5">
              {ENERGY_GOALS.map((goal) => {
                const isSelected = state.goals?.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`relative p-3.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-2 border-amber-400/60 shadow-glow u-hover-glow"
                        : "card-tier-1 u-hover-lift hover:bg-slate-700/40"
                    }`}
                  >
                    {/* Left accent bar when selected */}
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r" />
                    )}

                    <div className="flex items-start gap-2.5">
                      <span className="text-xl flex-shrink-0">{goal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold text-sm leading-tight mb-1 ${
                            isSelected ? "text-amber-100" : "text-white"
                          }`}
                        >
                          {goal.label}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {goal.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
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
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hasEnoughGoals ? "bg-green-500" : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedGoalsCount / MIN_GOALS_REQUIRED) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
