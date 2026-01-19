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
  Battery,
  Clock,
  Info,
  TrendingUp,
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
import { GridStressIndicator } from "../shared/GridStressIndicator";
import { calculateGridStress } from "@/services/gridStressCalculator";
import type { IntelligenceContext } from "@/types/intelligence.types";

// ============================================================================
// ENERGY GOALS - Updated Jan 18, 2026
// Primary goal pre-selected, others are optional
// ============================================================================

// PRIMARY GOAL - Everyone wants this, pre-selected
const PRIMARY_GOAL = {
  id: "reduce_costs" as EnergyGoal,
  label: "Save on Energy Costs",
  description: "Lower your monthly bills with intelligent energy management",
  emoji: "💰",
};

// OPTIONAL GOALS - User can add if they want
const OPTIONAL_GOALS: { id: EnergyGoal; label: string; emoji: string }[] = [
  { id: "backup_power", label: "Backup Power", emoji: "⚡" },
  { id: "grid_independence", label: "Energy Resilience", emoji: "🛡️" },
  { id: "sustainability", label: "Go Green", emoji: "🌱" },
  { id: "peak_shaving", label: "Peak Shaving", emoji: "📊" },
  { id: "generate_revenue", label: "Sell to Grid", emoji: "💵" },
];

// Legacy array for compatibility (prefixed as unused)
const _ENERGY_GOALS: { id: EnergyGoal; label: string; description: string; emoji: string }[] = [
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

const MIN_GOALS_REQUIRED = 1; // Only need 1 now (primary is pre-selected)

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
  onGoToStep2: _onGoToStep2,
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
  const [_showAddressField, setShowAddressField] = useState(false);

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

  // Pre-select PRIMARY_GOAL on mount (Jan 18, 2026)
  useEffect(() => {
    const currentGoals = state.goals || [];
    if (!currentGoals.includes(PRIMARY_GOAL.id)) {
      updateState({ goals: [PRIMARY_GOAL.id, ...currentGoals] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Removed: siteMode state - enterprise feature, not needed for MVP

  // Removed: canContinueLocation, canContinue, handleContinue, PROOF_TILES (tight headline only)

  // Calculate savings preview for combined panel
  const savingsPreview =
    businessLookup?.found && businessLookup.industrySlug && locationData
      ? (() => {
          // Import the calculator inline to avoid adding to imports
          const normalized = businessLookup.industrySlug.replace(/-/g, "_");
          const INDUSTRY_AVERAGES: Record<
            string,
            {
              avgPeakKW: number;
              peakShavingPercent: number;
              solarFitPercent: number;
              backupValueMultiplier: number;
              typicalBESSKW: number;
              typicalSolarKW: number;
            }
          > = {
            hotel: {
              avgPeakKW: 350,
              peakShavingPercent: 0.25,
              solarFitPercent: 0.3,
              backupValueMultiplier: 1.2,
              typicalBESSKW: 150,
              typicalSolarKW: 200,
            },
            car_wash: {
              avgPeakKW: 200,
              peakShavingPercent: 0.35,
              solarFitPercent: 0.4,
              backupValueMultiplier: 0.8,
              typicalBESSKW: 100,
              typicalSolarKW: 150,
            },
            ev_charging: {
              avgPeakKW: 500,
              peakShavingPercent: 0.4,
              solarFitPercent: 0.35,
              backupValueMultiplier: 1.0,
              typicalBESSKW: 250,
              typicalSolarKW: 300,
            },
            manufacturing: {
              avgPeakKW: 800,
              peakShavingPercent: 0.3,
              solarFitPercent: 0.25,
              backupValueMultiplier: 1.5,
              typicalBESSKW: 400,
              typicalSolarKW: 500,
            },
            data_center: {
              avgPeakKW: 2000,
              peakShavingPercent: 0.2,
              solarFitPercent: 0.15,
              backupValueMultiplier: 2.0,
              typicalBESSKW: 1000,
              typicalSolarKW: 800,
            },
            hospital: {
              avgPeakKW: 1500,
              peakShavingPercent: 0.2,
              solarFitPercent: 0.2,
              backupValueMultiplier: 2.5,
              typicalBESSKW: 750,
              typicalSolarKW: 600,
            },
            retail: {
              avgPeakKW: 250,
              peakShavingPercent: 0.3,
              solarFitPercent: 0.35,
              backupValueMultiplier: 0.7,
              typicalBESSKW: 100,
              typicalSolarKW: 150,
            },
            office: {
              avgPeakKW: 400,
              peakShavingPercent: 0.25,
              solarFitPercent: 0.3,
              backupValueMultiplier: 0.8,
              typicalBESSKW: 200,
              typicalSolarKW: 250,
            },
          };
          const DEFAULT = {
            avgPeakKW: 300,
            peakShavingPercent: 0.28,
            solarFitPercent: 0.3,
            backupValueMultiplier: 1.0,
            typicalBESSKW: 150,
            typicalSolarKW: 200,
          };
          const avg = INDUSTRY_AVERAGES[normalized] || DEFAULT;
          const demandCharge = 15;
          const peakShaving = Math.round(
            avg.avgPeakKW * demandCharge * 12 * avg.peakShavingPercent
          );
          const solarKW = avg.avgPeakKW * avg.solarFitPercent;
          const solarAnnual = solarKW * locationData.sunHours * 365 * 0.8;
          const solarPotential = Math.round(solarAnnual * locationData.electricityRate);
          const backupValue = Math.round(avg.avgPeakKW * 100 * avg.backupValueMultiplier);
          const baseTotal = peakShaving + solarPotential;
          const bessCapex = avg.typicalBESSKW * 4 * 150;
          const solarCapex = avg.typicalSolarKW * 1500;
          const avgSavings = baseTotal * 1.05;
          return {
            low: Math.round(baseTotal * 0.7),
            high: Math.round(baseTotal * 1.4),
            peakShaving,
            solarPotential,
            backupValue,
            bessKW: avg.typicalBESSKW,
            solarKW: avg.typicalSolarKW,
            payback: Math.round(((bessCapex + solarCapex) / avgSavings) * 10) / 10,
            roi: Math.round(((avgSavings * 10) / (bessCapex + solarCapex) - 1) * 100),
          };
        })()
      : null;

  const formatCurrency = (v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${v}`);

  return (
    <div className="text-white">
      {/* 🎯 COMBINED BUSINESS + SAVINGS PANEL - Full Width when business found */}
      {businessLookup?.found && savingsPreview && (
        <div className="mb-6 px-4">
          <div className="rounded-xl overflow-hidden border-2 border-green-500 shadow-xl shadow-green-500/20">
            {/* Header Bar - Green theme with ESTIMATE badge */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <span className="text-white font-bold text-lg">{businessLookup.businessName}</span>
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-green-100 text-xs font-medium">
                  ESTIMATE
                </span>
              </div>
              {locationData && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-100">
                    ⚡ ${locationData.electricityRate.toFixed(4)}/kWh
                  </span>
                  <span className="text-green-100">☀️ {locationData.sunHours} hrs/day</span>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-5">
              {/* Top Row: Business Info + Main Savings */}
              <div className="flex items-start gap-5 mb-4">
                {/* Business Photo */}
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border-2 border-green-500/40 shadow-lg">
                  {businessLookup.photoUrl ? (
                    <img
                      src={businessLookup.photoUrl}
                      alt={businessLookup.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : businessLookup.lat && businessLookup.lng ? (
                    <img
                      src={getStaticMapUrl(businessLookup.lat, businessLookup.lng, 17)}
                      alt="Location"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Business Details + Savings Hero */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {businessLookup.industrySlug && (
                      <span className="px-3 py-1.5 rounded-full bg-green-500/30 border border-green-400 text-green-200 text-sm font-semibold">
                        {INDUSTRY_NAMES[businessLookup.industrySlug] || businessLookup.businessType}{" "}
                        ✓
                      </span>
                    )}
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
                      className="text-slate-400 text-xs hover:text-white transition-colors underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">
                    📍 {businessLookup.formattedAddress}
                  </p>

                  {/* Savings Hero - Prominent */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-300 text-base">Potential Savings:</span>
                    <span className="text-3xl font-black text-green-300">
                      {formatCurrency(savingsPreview.low)}
                    </span>
                    <span className="text-green-400 text-xl font-bold">-</span>
                    <span className="text-3xl font-black text-green-300">
                      {formatCurrency(savingsPreview.high)}
                    </span>
                    <span className="text-green-200/70 text-base">/yr*</span>
                  </div>
                </div>
              </div>

              {/* Savings Breakdown - Compact Grid */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-cyan-300 font-bold text-base">
                    ~{formatCurrency(savingsPreview.peakShaving)}
                  </p>
                  <p className="text-slate-400 text-xs">Peak Shaving</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-300 font-bold text-base">
                    ~{formatCurrency(savingsPreview.solarPotential)}
                  </p>
                  <p className="text-slate-400 text-xs">Solar Potential</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <Battery className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-emerald-300 font-bold text-base">
                    ~{formatCurrency(savingsPreview.backupValue)}
                  </p>
                  <p className="text-slate-400 text-xs">Backup Value</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <Clock className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                  <p className="text-violet-300 font-bold text-base">~{savingsPreview.payback}yr</p>
                  <p className="text-slate-400 text-xs">Payback</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-emerald-300 font-bold text-base">~{savingsPreview.roi}%</p>
                  <p className="text-slate-400 text-xs">10yr ROI</p>
                </div>
              </div>

              {/* System Specs Bar */}
              <div className="flex items-center justify-center gap-6 py-2.5 bg-white/5 rounded-lg border border-white/10 mb-3">
                <span className="text-slate-300 text-sm">
                  🔋 BESS:{" "}
                  <span className="text-green-300 font-semibold">~{savingsPreview.bessKW} kW</span>
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 text-sm">
                  ☀️ Solar:{" "}
                  <span className="text-green-300 font-semibold">~{savingsPreview.solarKW} kW</span>
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 text-sm">
                  ⚡ Duration: <span className="text-green-300 font-semibold">4 hrs</span>
                </span>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center gap-2 text-xs text-green-200/60">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>
                  *Estimate based on typical{" "}
                  {INDUSTRY_NAMES[businessLookup.industrySlug || ""] || "industry"} profiles.
                  TrueQuote™ verified in Step 5.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 SITE INTELLIGENCE SNAPSHOT - Only show when NO business found */}
      {!businessLookup?.found && (
        <div className="stepHeaderGlow mb-7 px-4">
          <div className="stepHero">
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-violet-300/80 mb-1.5 tracking-wide uppercase">
                Step 1 of 6
              </div>
              <h1 className="stepHero__title mb-2">Where is your site?</h1>
              <div className="text-[15px] text-slate-300/70 font-medium">
                Enter your location to unlock verified utility rates and solar potential
              </div>
            </div>

            {/* COCKPIT DIALS - Only show when NO business found */}
            {locationData && (
              <div className="mt-5 flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-[10px] font-bold text-amber-300/90">RATE</div>
                    <div className="text-sm font-extrabold text-white">
                      ${locationData.electricityRate.toFixed(4)}/kWh
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-400/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="text-[10px] font-bold text-violet-300/90">DEMAND</div>
                    <div className="text-sm font-extrabold text-white">$15/kW</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                  <Sun className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-[10px] font-bold text-sky-300/90">SUN</div>
                    <div className="text-sm font-extrabold text-white">
                      {locationData.sunHours} hrs/day
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Removed: COMPACT LOCATION PILLS - Now in header as cockpit dials */}
      {/* Removed: Separate SavingsPreviewPanel - Now integrated into combined header panel */}

      {/* PANELS GRID (tightened spacing) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4">
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
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-form-type="other"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      name="merlin-zip-input"
                      id="merlin-zip-input"
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

                    {/* 🏢 BUSINESS ADDRESS - Right after ZIP for better flow (Jan 19, 2026) */}
                    {zipInput.length === 5 && !zipError && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-400/30">
                        <label className="block text-sm font-semibold text-amber-200 mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Find your business for personalized recommendations
                        </label>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={businessNameInput}
                            onChange={(e) => setBusinessNameInput(e.target.value)}
                            placeholder="Business name (e.g., Hilton Hotel)"
                            autoComplete="new-password"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="merlin-business-name"
                            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                          />
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Street address (optional)"
                            autoComplete="new-password"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="merlin-street-address"
                            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                            onKeyDown={(e) =>
                              e.key === "Enter" && businessNameInput.trim() && handleAddressLookup()
                            }
                          />
                          <button
                            onClick={handleAddressLookup}
                            disabled={isLookingUp || !businessNameInput.trim()}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                          >
                            {isLookingUp ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Finding...
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4" />
                                Find My Business
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ✨ LOCATION CONFIRMED + STATE STATS - Shows immediately after valid ZIP (Jan 19, 2026) */}
                {locationData && !businessLookup?.found && (
                  <div className="mt-4 bg-gradient-to-br from-purple-500/15 to-violet-500/10 rounded-xl p-5 border border-purple-400/40">
                    {/* Location Header with Solar Rating */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        {state.city || state.state}, {state.state}
                      </h3>
                      <div
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${
                          locationData.solarRating === "A"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                            : locationData.solarRating === "B"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-400/30"
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        {locationData.solarRating} - {locationData.solarLabel}
                      </div>
                    </div>

                    {/* STATE ENERGY STATISTICS */}
                    <div className="pt-3 border-t border-purple-400/20">
                      <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                        <span>📊</span> {state.state} Energy Market
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-slate-400 text-xs">Commercial Rate</div>
                          <div className="text-white font-semibold">
                            ${(locationData.electricityRate * 1.15).toFixed(4)}/kWh
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-slate-400 text-xs">Peak Demand</div>
                          <div className="text-white font-semibold">$12-18/kW</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-slate-400 text-xs">Net Metering</div>
                          <div className="text-emerald-400 font-semibold">✓ Available</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-slate-400 text-xs">Federal ITC</div>
                          <div className="text-emerald-400 font-semibold">30% Credit</div>
                        </div>
                      </div>

                      {/* Quick insight */}
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="text-xs text-amber-200 flex items-start gap-2">
                          <span className="text-sm">💡</span>
                          <span>
                            {locationData.electricityRate > 0.12
                              ? `${state.state} has above-average electricity rates, making solar+storage highly attractive for ROI.`
                              : locationData.sunHours > 5.5
                                ? `${state.state}'s excellent solar resources (${locationData.sunHours} hrs/day) maximize system performance.`
                                : `${state.state} offers strong incentives for commercial energy storage projects.`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ PHASE 2A: Intelligence Panels After Valid ZIP (Jan 18, 2026) */}
                {zipInput.length === 5 && !zipError && !businessLookup?.found && (
                  <div className="mt-5 space-y-4">
                    {/* Grid Stress Index - Automated Output (Task 5) */}
                    {state.state &&
                      (() => {
                        const gridStress = calculateGridStress(state.state);
                        return (
                          <GridStressIndicator
                            stressLevel={gridStress.stressLevel}
                            confidence={gridStress.confidence}
                          />
                        );
                      })()}

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

                {/* Industry Detection Intelligence (Jan 18, 2026) - Show when business found */}
                {businessLookup?.found && intelligence?.inferredIndustry && (
                  <div className="mt-4">
                    <IntelligencePanel type="industryHint" data={intelligence.inferredIndustry} />
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

            {/* Location Details Card moved to show immediately after valid ZIP input above */}
          </div>
        </div>

        {/* RIGHT COLUMN: Your Goals - Simplified (Jan 18, 2026) */}
        <div>
          <div
            id="goals-section"
            className="relative p-5 card-tier-1 rounded-2xl shadow-tight scroll-mt-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Goals</h2>
              {selectedGoalsCount > 1 && (
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  +{selectedGoalsCount - 1} more
                </div>
              )}
            </div>

            {/* PRIMARY GOAL - Pre-selected, always at top */}
            <div className="mb-4">
              <button
                onClick={() => toggleGoal(PRIMARY_GOAL.id)}
                className={`w-full relative p-4 rounded-xl text-left transition-all ${
                  state.goals?.includes(PRIMARY_GOAL.id)
                    ? "bg-gradient-to-r from-purple-500/20 to-violet-500/10 border-2 border-purple-400/60 shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                    : "bg-white/5 border-2 border-white/10 hover:border-purple-400/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PRIMARY_GOAL.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-base text-white mb-0.5">
                      {PRIMARY_GOAL.label}
                    </div>
                    <div className="text-xs text-slate-400">{PRIMARY_GOAL.description}</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      state.goals?.includes(PRIMARY_GOAL.id)
                        ? "bg-purple-500"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    {state.goals?.includes(PRIMARY_GOAL.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* OPTIONAL GOALS - Smaller buttons */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Optional Goals
              </div>
              <div className="flex flex-wrap gap-2">
                {OPTIONAL_GOALS.map((goal) => {
                  const isSelected = state.goals?.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300"
                          : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-400/30"
                      }`}
                    >
                      <span className="text-base">{goal.emoji}</span>
                      <span>{goal.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status - Only show if no goals selected */}
            {!hasEnoughGoals && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 text-center">
                <p className="text-sm text-amber-300">👆 Select at least one goal to continue</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    hasEnoughGoals ? "bg-purple-500" : "bg-amber-500"
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
