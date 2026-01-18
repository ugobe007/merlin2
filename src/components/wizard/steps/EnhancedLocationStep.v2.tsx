/**
 * ENHANCED LOCATION STEP - V2
 * ============================
 *
 * NEW FLOW (Jan 15, 2026 - User Request):
 * 1. Zip code FIRST (required)
 * 2. Show state, utility rate, sun hours in MerlinBar immediately
 * 3. Optional address entry (for business detection)
 * 4. Energy goals selection (side-by-side with location)
 * 5. Can proceed with just zip (no address required)
 *
 * Layout: Two columns side-by-side
 * - Left: Location (zip → utility data → optional address)
 * - Right: Energy goals
 */

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Target,
  Sun,
  DollarSign,
} from "lucide-react";
import {
  detectBusinessFromAddress,
  type BusinessDetectionResult,
} from "@/services/businessDetectionService";
import { getStateUtilityData, getStateSolarData } from "@/data/utilityData";
import { getWeatherData } from "@/services/weatherService";
import { geocodeLocation } from "@/services/geocodingService";
import { useAdvisorPublisher } from "@/components/wizard/v6/advisor/AdvisorPublisher";

// ============================================
// CONSTANTS
// ============================================

// Energy goals
const ENERGY_GOALS = [
  {
    id: "reduce_costs",
    label: "Save Money",
    emoji: "💰",
    description: "Lower monthly energy bills",
  },
  {
    id: "backup_power",
    label: "Backup Power",
    emoji: "⚡",
    description: "Stay online during outages",
  },
  {
    id: "grid_independence",
    label: "Energy Resilience",
    emoji: "🛡️",
    description: "Reduce grid dependence",
  },
  { id: "sustainability", label: "Go Green", emoji: "🌱", description: "Reduce carbon footprint" },
  {
    id: "peak_shaving",
    label: "Balance Energy Loads",
    emoji: "📊",
    description: "Avoid peak demand charges",
  },
  {
    id: "generate_revenue",
    label: "Generate Revenue",
    emoji: "💵",
    description: "Sell power back to grid",
  },
];

// ZIP code to state mapping (comprehensive national coverage)
const ZIP_TO_STATE: Record<string, string> = {
  // Northeast
  "00": "Puerto Rico",
  "01": "Massachusetts",
  "02": "Massachusetts",
  "03": "New Hampshire",
  "04": "Maine",
  "05": "Vermont",
  "06": "Connecticut",
  "07": "New Jersey",
  "08": "New Jersey",
  "09": "New Jersey",
  "10": "New York",
  "11": "New York",
  "12": "New York",
  "13": "New York",
  "14": "New York",

  // Mid-Atlantic
  "15": "Pennsylvania",
  "16": "Pennsylvania",
  "17": "Pennsylvania",
  "18": "Pennsylvania",
  "19": "Pennsylvania",
  "20": "District of Columbia",
  "21": "Maryland",
  "22": "Virginia",
  "23": "Virginia",
  "24": "Virginia",
  "25": "West Virginia",
  "26": "West Virginia",

  // Southeast
  "27": "North Carolina",
  "28": "North Carolina",
  "29": "South Carolina",
  "30": "Georgia",
  "31": "Georgia",
  "32": "Florida",
  "33": "Florida",
  "34": "Florida",
  "35": "Alabama",
  "36": "Alabama",
  "37": "Tennessee",
  "38": "Mississippi",
  "39": "Kentucky",

  // Midwest
  "40": "Kentucky",
  "41": "Kentucky",
  "42": "Kentucky",
  "43": "Ohio",
  "44": "Ohio",
  "45": "Ohio",
  "46": "Indiana",
  "47": "Indiana",
  "48": "Michigan",
  "49": "Michigan",
  "50": "Iowa",
  "51": "Iowa",
  "52": "Iowa",
  "53": "Wisconsin",
  "54": "Wisconsin",
  "55": "Minnesota",
  "56": "Minnesota",
  "57": "South Dakota",
  "58": "North Dakota",
  "59": "Montana",

  // Central
  "60": "Illinois",
  "61": "Illinois",
  "62": "Illinois",
  "63": "Missouri",
  "64": "Missouri",
  "65": "Missouri",
  "66": "Kansas",
  "67": "Kansas",
  "68": "Nebraska",
  "69": "Nebraska",
  "70": "Louisiana",
  "71": "Louisiana",
  "72": "Arkansas",
  "73": "Oklahoma",
  "74": "Oklahoma",
  "75": "Texas",
  "76": "Texas",
  "77": "Texas",
  "78": "Texas",
  "79": "Texas",

  // Mountain West
  "80": "Colorado",
  "81": "Colorado",
  "82": "Wyoming",
  "83": "Idaho",
  "84": "Utah",
  "85": "Arizona",
  "86": "Arizona",
  "87": "New Mexico",
  "88": "Nevada",
  "89": "Nevada",

  // West Coast
  "90": "California",
  "91": "California",
  "92": "California",
  "93": "California",
  "94": "California",
  "95": "California",
  "96": "California",
  "97": "Oregon",
  "98": "Washington",
  "99": "Alaska",
};

// ============================================
// TYPES
// ============================================

interface LocationStepProps {
  onNext: (data: LocationData) => void;
  onUtilityDataUpdate?: (data: {
    state: string;
    rate: number;
    sunHours: number;
    arbitrage: string;
    weatherData?: {
      profile: string;
      extremes: string;
      avgTempF?: number;
      avgHighF?: number;
      avgLowF?: number;
      heatingDegreeDays?: number;
      coolingDegreeDays?: number;
      source: "visual-crossing" | "nws" | "cache";
    };
  }) => void;
  initialData?: Partial<LocationData>;
}

export interface LocationData {
  zipCode: string;
  state: string;
  city: string;
  address: string;
  businessName: string;
  utilityRate: number;
  sunHours: number;
  detectedInfo?: BusinessDetectionResult;
  goals: string[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EnhancedLocationStep: React.FC<LocationStepProps> = ({
  onNext,
  onUtilityDataUpdate,
  initialData,
}) => {
  // Advisor publisher for headline
  const { publish } = useAdvisorPublisher();

  // State
  const [zipCode, setZipCode] = useState(initialData?.zipCode || "");
  const [stateCode, setStateCode] = useState(initialData?.state || "");
  const [utilityData, setUtilityData] = useState<{
    name: string;
    rate: number;
    sunHours: number;
    arbitrage: string;
    demandCharge: number;
    hasTOU: boolean;
  } | null>(null);
  const [_isLoadingUtility, setIsLoadingUtility] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [addressQuery, setAddressQuery] = useState(initialData?.address || "");
  const [isSearching, setIsSearching] = useState(false);
  const [detectionResult, setDetectionResult] = useState<BusinessDetectionResult | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialData?.goals || []);

  // ============================================
  // PUBLISH STEP 1 HEADLINE ON MOUNT
  // ============================================

  useEffect(() => {
    publish({
      step: 1,
      key: "step-1-headline",
      mode: "estimate",
      headline: "Slash your energy costs.",
      subline: "Methodically. Intelligently.\nOne step at a time.",
      cards: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // ZIP CODE HANDLER - Lookup utility data from comprehensive national database
  // ============================================

  useEffect(() => {
    async function fetchUtilityData() {
      if (zipCode.length === 5) {
        setIsLoadingUtility(true);

        try {
          // Get state from ZIP code prefix
          const zipPrefix = zipCode.substring(0, 2);
          const stateName = ZIP_TO_STATE[zipPrefix];

          if (!stateName) {
            console.warn(`[LocationStep] No state mapping for ZIP prefix ${zipPrefix}`);
            setUtilityData(null);
            setIsLoadingUtility(false);
            return;
          }

          // Get utility data from comprehensive database
          const utilityInfo = getStateUtilityData(stateName);
          const solarInfo = getStateSolarData(stateName);

          // Determine arbitrage potential based on TOU rates and prices
          let arbitrage = "Low";
          const hasTOU = utilityInfo.peakRate && utilityInfo.offPeakRate;

          if (hasTOU && utilityInfo.electricityRate > 0.18) {
            arbitrage = "High";
          } else if (hasTOU && utilityInfo.electricityRate > 0.14) {
            arbitrage = "Medium";
          } else if (utilityInfo.electricityRate > 0.16) {
            arbitrage = "Medium";
          }

          setStateCode(stateName);
          setUtilityData({
            name: utilityInfo.utilityName,
            rate: utilityInfo.electricityRate,
            sunHours: solarInfo.peakSunHours,
            arbitrage,
            demandCharge: utilityInfo.demandChargePerKW,
            hasTOU: !!hasTOU,
          });
          setShowAddressSearch(true); // Reveal address input

          // Geocode ZIP to get city name and precise coordinates
          geocodeLocation(zipCode)
            .then((geocode) => {
              if (geocode) {
                console.log("[LocationStep] Geocoded:", geocode);

                // Fetch weather data with precise coordinates
                getWeatherData(zipCode, geocode.lat, geocode.lon)
                  .then((weather) => {
                    if (weather) {
                      console.log("[LocationStep] Weather data fetched:", weather);
                      // Update parent state with weather data
                      if (onUtilityDataUpdate) {
                        onUtilityDataUpdate({
                          state: stateName,
                          rate: utilityInfo.electricityRate,
                          sunHours: solarInfo.peakSunHours,
                          arbitrage,
                          weatherData: weather,
                        });
                      }
                    }
                  })
                  .catch((err) => {
                    console.warn("[LocationStep] Weather fetch failed:", err);
                  });
              }
            })
            .catch((err) => {
              console.warn("[LocationStep] Geocoding failed:", err);

              // Fallback: fetch weather without precise coordinates
              getWeatherData(zipCode)
                .then((weather) => {
                  if (weather) {
                    console.log("[LocationStep] Weather data fetched (fallback):", weather);
                    if (onUtilityDataUpdate) {
                      onUtilityDataUpdate({
                        state: stateName,
                        rate: utilityInfo.electricityRate,
                        sunHours: solarInfo.peakSunHours,
                        arbitrage,
                        weatherData: weather,
                      });
                    }
                  }
                })
                .catch((weatherErr) => {
                  console.warn("[LocationStep] Weather fetch failed:", weatherErr);
                });
            });

          // Update MerlinBar via callback (immediate utility data)
          if (onUtilityDataUpdate) {
            onUtilityDataUpdate({
              state: stateName,
              rate: utilityInfo.electricityRate,
              sunHours: solarInfo.peakSunHours,
              arbitrage,
            });
          }
        } catch (error) {
          console.error("[LocationStep] Failed to fetch utility data:", error);
          setUtilityData(null);
        } finally {
          setIsLoadingUtility(false);
        }
      } else {
        setUtilityData(null);
        setShowAddressSearch(false);
      }
    }

    fetchUtilityData();
  }, [zipCode, onUtilityDataUpdate]);

  // ============================================
  // ADDRESS SEARCH (Optional)
  // ============================================

  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) return;

    setIsSearching(true);

    try {
      const result = await detectBusinessFromAddress(addressQuery);

      if (result) {
        setDetectionResult(result);
      }
    } catch (error) {
      console.error("Detection error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // ============================================
  // GOALS HANDLER
  // ============================================

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  // ============================================
  // CONTINUE HANDLER
  // ============================================

  const handleContinue = () => {
    if (zipCode.length !== 5) {
      alert("Please enter a valid 5-digit zip code");
      return;
    }

    const locationData: LocationData = {
      zipCode,
      state: stateCode,
      city: detectionResult?.city || "",
      address: addressQuery || "",
      businessName: detectionResult?.name || "",
      utilityRate: utilityData?.rate || 0.15,
      sunHours: utilityData?.sunHours || 5.0,
      detectedInfo: detectionResult || undefined,
      goals: selectedGoals,
    };

    onNext(locationData);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full py-6 px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-3">
          <span className="text-white">Tell me about your </span>
          <span className="text-violet-300">location</span>
        </h1>
        <p className="text-lg text-slate-300">
          I'll analyze your utility rates, solar potential, and energy savings opportunities
        </p>
      </div>

      {/* Two Column Layout - Wrapped in shared stage card */}
      <div className="rounded-2xl border border-[#223453]/60 bg-[#0f1e34] shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 md:p-7 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT COLUMN: Location */}
          <div className="space-y-6">
            {/* Zip Code Input */}
            <div className="bg-gradient-to-b from-white/6 to-white/2 rounded-2xl p-6 border border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Your Zip Code</h3>
              </div>

              <input
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-[#223453]/60 text-white placeholder-slate-400 rounded-xl text-lg text-center font-semibold tracking-wide focus:border-violet-300/60 focus:ring-2 focus:ring-violet-500/30 focus:outline-none transition-all shadow-[0_12px_40px_rgba(0,0,0,0.22)] hover:border-[#33507a]/70"
                placeholder="e.g., 94102"
                maxLength={5}
                value={zipCode}
                onChange={(e) => {
                  const zip = e.target.value.replace(/\D/g, "");
                  setZipCode(zip);
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />

              {/* Before Zip: What We'll Analyze */}
              {!utilityData && zipCode.length < 5 && (
                <div className="mt-4 space-y-4 animate-in fade-in">
                  <div className="flex items-start gap-3 p-4 bg-slate-900/40 border border-slate-700/50 rounded-lg">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 mb-2">
                        We'll instantly analyze:
                      </h4>
                      <ul className="text-sm text-slate-400 space-y-1.5">
                        <li className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          Your state's electricity rates
                        </li>
                        <li className="flex items-center gap-2">
                          <Sun className="w-3.5 h-3.5 text-yellow-400" />
                          Local solar potential (sun hours/day)
                        </li>
                        <li className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          Energy arbitrage opportunities
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          Utility incentives & programs
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Preview Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Rate
                      </div>
                      <div className="text-slate-600 text-lg font-semibold">$-.--</div>
                    </div>
                    <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                        <Sun className="w-3 h-3" />
                        Sun Hours
                      </div>
                      <div className="text-slate-600 text-lg font-semibold">-.--</div>
                    </div>
                    <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        State
                      </div>
                      <div className="text-slate-600 text-lg font-semibold">--</div>
                    </div>
                    <div className="p-3 bg-slate-900/20 border border-slate-700/30 rounded-lg">
                      <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Arbitrage
                      </div>
                      <div className="text-slate-600 text-lg font-semibold">---</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Your data is private and never shared
                  </div>
                </div>
              )}

              {/* Utility Data Display */}
              {utilityData && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-slate-300">Detected State:</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{utilityData.name}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-slate-300">Utility Rate:</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      ${utilityData.rate}/kWh
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-slate-300">Peak Sun Hours:</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {utilityData.sunHours} hrs/day
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-slate-300">Arbitrage Potential:</span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        utilityData.arbitrage === "High"
                          ? "text-emerald-400"
                          : utilityData.arbitrage === "Medium"
                            ? "text-yellow-400"
                            : "text-slate-400"
                      }`}
                    >
                      {utilityData.arbitrage}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Address Search */}
            {showAddressSearch && (
              <div className="bg-white/4 rounded-2xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Business Address (Optional)</h3>
                </div>

                <p className="text-sm text-slate-400 mb-4">
                  Add your address to auto-detect facility details and pre-fill questions
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="e.g., 123 Main St, San Francisco, CA"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddressSearch();
                    }}
                  />
                  <button
                    onClick={handleAddressSearch}
                    disabled={isSearching || !addressQuery.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* Detection Result */}
                {detectionResult && (
                  <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white">{detectionResult.name}</p>
                        <p className="text-sm text-slate-400">{detectionResult.address}</p>
                        <p className="text-xs text-emerald-400 mt-1">
                          Pre-filled {Object.keys(detectionResult.prefilledAnswers).length}{" "}
                          questions
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Energy Goals */}
          <div className="bg-gradient-to-b from-white/4 to-white/2 rounded-2xl p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.30)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Energy goals</h3>
                <p className="text-sm text-slate-400">Select all that apply</p>
              </div>
            </div>

            <div className="space-y-3">
              {ENERGY_GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "bg-violet-500/10 border-violet-300/30 shadow-[0_12px_40px_rgba(124,58,237,0.18)]"
                        : "bg-white/3 border-white/10 hover:border-[#33507a]/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{goal.emoji}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{goal.label}</div>
                        <div className="text-sm text-slate-400">{goal.description}</div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedGoals.length > 0 && (
              <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30 text-center">
                <p className="text-sm text-purple-300 font-medium">
                  ✓ {selectedGoals.length} goal{selectedGoals.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={zipCode.length !== 5}
          className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-lg font-bold shadow-lg shadow-violet-500/25 transition-all transform hover:scale-105 disabled:transform-none"
        >
          Continue to Industry Selection →
        </button>
      </div>

      {/* Reminder */}
      {zipCode.length === 5 && selectedGoals.length === 0 && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <p className="text-sm text-amber-300">Don't forget to select your energy goals!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationStep;
