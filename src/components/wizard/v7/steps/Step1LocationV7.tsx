/**
 * Step 1: Location (V7) — CANONICAL FIX + TrueQuote Integration
 *
 * Updates (Jan 23, 2026):
 * - TrueQuote modal integration via window event bus
 * - Location Intelligence odometer (peakSunHours, utilityRate, weatherRisk, solarGrade)
 * - Displays real metrics from locationIntel prop
 */

import React, { useState } from "react";
import AdvisorHeader from "../shared/AdvisorHeader";

// Industry image fallback map
const INDUSTRY_IMAGE_MAP: Record<string, string> = {
  "car-wash": "/assets/images/car_wash_1.jpg",
  "hotel": "/assets/images/hotel_motel_holidayinn_1.jpg",
  "office": "/assets/images/office_building2.jpg",
  "data-center": "/assets/images/data-center-1.jpg",
  "manufacturing": "/assets/images/manufacturing_1.jpg",
  "hospital": "/assets/images/hospital_1.jpg",
  "cold-storage": "/assets/images/cold_storage.jpg",
  "ev-charging": "/assets/images/ev_charging_station.jpg",
  "restaurant": "/assets/images/restaurant.jpg",
  "retail": "/assets/images/retail.jpg",
  "shopping-center": "/assets/images/shopping_center.jpg",
  "warehouse": "/assets/images/warehouse_1.jpg",
  "apartment": "/assets/images/apartment.jpg",
  "college": "/assets/images/college_1.jpg",
  "airport": "/assets/images/airport_1.jpg",
  "gas-station": "/assets/images/gas_station.jpg",
  "indoor-farm": "/assets/images/indoor_farm.jpg",
  "casino": "/assets/images/casino.jpg",
};

interface LocationIntel {
  peakSunHours: number | null;
  utilityRate: number | null;
  weatherRisk: 'Low' | 'Med' | 'High' | string | null;
  solarGrade: string | null;
  riskDrivers: string[];
  sourceLabel?: string;
}

interface Step1LocationV7Props {
  location: {
    zipCode: string;
    businessName: string;
    streetAddress: string;
    region: string;
    state?: string;
    city?: string;
    businessConfirmed?: boolean;
    business?: {
      name: string;
      address: string;
      city?: string;
      state?: string;
      postal?: string;
      category?: string;
      website?: string | null;
      photoUrl?: string;
      logoUrl?: string;
      industrySlug?: string;
      rating?: number;
      userRatingsTotal?: number;
      phone?: string | null;
      placeId?: string;
      types?: string[];
    };
  } | null;
  setLocation: (location: any) => void;
  industry: string | null;
  setIndustry: (industry: string | null) => void;
  locationIntel?: LocationIntel;
}

type BusinessInfo = {
  name: string;
  address: string;
  city?: string;
  state?: string;
  postal?: string;
  category?: string;
  website?: string;
  photoUrl?: string;   // Google Places photo
  logoUrl?: string;    // Website logo or favicon
  industrySlug?: string; // car-wash, hotel, office, etc.
};

type BusinessCandidate = {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  photoRef?: string | null;
};

export default function Step1LocationV7({
  location,
  setLocation,
  industry,
  setIndustry,
  locationIntel,
}: Step1LocationV7Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [candidates, setCandidates] = useState<BusinessCandidate[]>([]);
  const [confirmedBusiness, setConfirmedBusiness] = useState<BusinessInfo | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Calculate dynamic savings estimate based on location intel and industry
  function calculateEstimatedSavings(): { annualSavings: number; paybackYears: number } | null {
    // Need at least utility rate and industry to provide estimate
    if (!locationIntel?.utilityRate || !location?.business?.industrySlug) {
      return null;
    }

    const rate = locationIntel.utilityRate;
    const solarGrade = locationIntel.solarGrade;
    const industrySlug = location.business.industrySlug;

    // Industry-specific baseline system sizes (kW) and usage patterns
    const industryProfiles: Record<string, { bessKW: number; solarKW: number; usageFactor: number }> = {
      'car-wash': { bessKW: 150, solarKW: 100, usageFactor: 1.2 },
      'hotel': { bessKW: 300, solarKW: 200, usageFactor: 1.0 },
      'office': { bessKW: 200, solarKW: 150, usageFactor: 0.9 },
      'hospital': { bessKW: 500, solarKW: 300, usageFactor: 1.3 },
      'data-center': { bessKW: 1000, solarKW: 500, usageFactor: 1.5 },
      'manufacturing': { bessKW: 400, solarKW: 250, usageFactor: 1.1 },
      'ev-charging': { bessKW: 250, solarKW: 200, usageFactor: 1.0 },
      'retail': { bessKW: 150, solarKW: 100, usageFactor: 0.85 },
      'shopping-center': { bessKW: 400, solarKW: 300, usageFactor: 1.0 },
      'restaurant': { bessKW: 120, solarKW: 80, usageFactor: 0.95 },
      'warehouse': { bessKW: 250, solarKW: 180, usageFactor: 0.8 },
      'apartment': { bessKW: 180, solarKW: 120, usageFactor: 0.75 },
      'college': { bessKW: 600, solarKW: 400, usageFactor: 1.1 },
      'airport': { bessKW: 2000, solarKW: 1000, usageFactor: 1.4 },
      'gas-station': { bessKW: 100, solarKW: 60, usageFactor: 0.9 },
      'indoor-farm': { bessKW: 350, solarKW: 250, usageFactor: 1.35 },
      'casino': { bessKW: 800, solarKW: 400, usageFactor: 1.25 },
      'cold-storage': { bessKW: 300, solarKW: 200, usageFactor: 1.3 },
    };

    const profile = industryProfiles[industrySlug] || { bessKW: 200, solarKW: 150, usageFactor: 1.0 };

    // Peak shaving savings (demand charge reduction)
    const demandCharge = rate > 0.15 ? 20 : 15; // $/kW/month estimate
    const monthlyDemandSavings = profile.bessKW * demandCharge * 0.7; // 70% peak reduction
    const annualDemandSavings = monthlyDemandSavings * 12;

    // Energy arbitrage savings (time-of-use optimization)
    const dailyCycles = 1.2; // Average daily charge/discharge cycles
    const durationHours = 4;
    const arbitrageDelta = rate * 0.4; // Assume 40% rate difference between peak/off-peak
    const annualArbitrageSavings = profile.bessKW * durationHours * dailyCycles * arbitrageDelta * 365 * 0.85; // 85% efficiency

    // Solar self-consumption savings
    const solarCapacityFactor = solarGrade === 'A' || solarGrade === 'Excellent' ? 0.21 : 0.18;
    const annualSolarProduction = profile.solarKW * 8760 * solarCapacityFactor;
    const selfConsumptionRate = 0.75; // 75% self-consumed with BESS
    const annualSolarSavings = annualSolarProduction * selfConsumptionRate * rate;

    // Total annual savings with usage factor
    const totalAnnualSavings = (annualDemandSavings + annualArbitrageSavings + annualSolarSavings) * profile.usageFactor;

    // System cost estimate ($/kW)
    const bessCostPerKW = 1200;
    const solarCostPerKW = 1500;
    const totalSystemCost = (profile.bessKW * bessCostPerKW) + (profile.solarKW * solarCostPerKW);
    
    // Apply 30% ITC
    const netCost = totalSystemCost * 0.7;
    
    const paybackYears = netCost / totalAnnualSavings;

    return {
      annualSavings: Math.round(totalAnnualSavings / 100) * 100, // Round to nearest $100
      paybackYears: Math.round(paybackYears * 10) / 10, // Round to 1 decimal
    };
  }

  const savingsEstimate = calculateEstimatedSavings();

  // Build odometer metrics from locationIntel prop
  const locationMetrics = [
    { 
      label: "Peak Sun", 
      value: locationIntel?.peakSunHours?.toFixed(1) || "—", 
      unit: "hrs/day", 
      color: "#f59e0b" 
    },
    { 
      label: "Electricity Rate", 
      value: locationIntel?.utilityRate ? `$${locationIntel.utilityRate.toFixed(2)}` : "—", 
      unit: "per kWh", 
      color: "#22c55e" 
    },
    { 
      label: "Weather Risk", 
      value: locationIntel?.weatherRisk || "—", 
      unit: "", 
      color: locationIntel?.weatherRisk === 'Low' ? "#22c55e" : locationIntel?.weatherRisk === 'Med' ? "#f59e0b" : "#ef4444",
      highlight: true 
    },
    { 
      label: "Solar Grade", 
      value: locationIntel?.solarGrade || "—", 
      unit: locationIntel?.solarGrade ? "Excellent" : "", 
      color: "#f59e0b" 
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setLocation({ ...location, [field]: value });
    // Reset candidates and error if user changes key fields
    // IMPORTANT: do NOT clear confirmed business - let user explicitly change it
    if (field === "businessName" || field === "zipCode" || field === "streetAddress") {
      setCandidates([]);
      setLookupError(null);
    }
  };

  const isZipReady =
    !!location?.zipCode &&
    (location?.region === "US"
      ? String(location.zipCode).length >= 5
      : String(location.zipCode).length >= 3);

  // Lookup business - returns candidates for user confirmation
  async function lookupBusiness() {
    setLookupError(null);
    setIsLookingUp(true);
    setCandidates([]);
    setConfirmedBusiness(null);

    // Build search query
    const queryParts = [
      location?.businessName,
      location?.streetAddress,
      location?.zipCode,
    ].filter(Boolean);
    const query = queryParts.join(" ");

    try {
      const response = await fetch("/api/places/lookup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || "Lookup failed");
      }

      if (!data.results || data.results.length === 0) {
        setLookupError("No matches found. Try a more complete address or business name.");
        return;
      }

      setCandidates(data.results);
    } catch (e: any) {
      setLookupError(e.message || "Lookup failed. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  }

  // Confirm business selection - gets full details
  async function confirmBusiness(placeId: string) {
    setIsLookingUp(true);
    setLookupError(null);
    
    try {
      const response = await fetch("/api/places/place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || "Details lookup failed");
      }

      // Map to BusinessInfo format
      const businessInfo: BusinessInfo = {
        name: data.name,
        address: data.formattedAddress,
        city: data.city,
        state: data.state,
        postal: data.postal,
        category: data.types?.[0] || "Business",
        website: data.website,
        photoUrl: data.photoRef ? `/api/places/photo/${data.photoRef}` : undefined,
        industrySlug: guessIndustrySlug(data.types),
      };

      setConfirmedBusiness(businessInfo);
      setCandidates([]); // Clear candidates after confirmation
      
      // Update location state with confirmed data
      setLocation((prev: any) => ({
        ...prev,
        businessName: data.name,
        streetAddress: data.formattedAddress.split(",")[0], // First part is usually street
        city: data.city,
        state: data.state,
        zipCode: data.postal || prev?.zipCode,
        business: {
          ...businessInfo,
          placeId, // Keep placeId for tracking
          types: data.types || [], // Keep types for industry inference
        },
        businessConfirmed: true, // ✅ Mark as confirmed to enable auto-skip
      }));
    } catch (e: any) {
      setLookupError(e.message || "Couldn't load business details.");
    } finally {
      setIsLookingUp(false);
    }
  }

  // Guess industry from Google Place types
  function guessIndustrySlug(types: string[] = []): string | undefined {
    const typeMap: Record<string, string> = {
      "car_wash": "car-wash",
      "lodging": "hotel",
      "hospital": "hospital",
      "doctor": "hospital",
      "charging_station": "ev-charging",
      "electric_vehicle_charging_station": "ev-charging",
      "office": "office",
      "restaurant": "restaurant",
      "cafe": "restaurant",
      "food": "restaurant",
      "shopping_mall": "shopping-center",
      "store": "retail",
      "department_store": "retail",
      "supermarket": "retail",
      "factory": "manufacturing",
      "warehouse": "warehouse",
      "storage": "warehouse",
      "apartment_building": "apartment",
      "real_estate": "apartment",
      "university": "college",
      "school": "college",
      "college": "college",
      "airport": "airport",
      "gas_station": "gas-station",
      "petrol_station": "gas-station",
      "casino": "casino",
      "night_club": "casino",
      "bar": "restaurant",
      "cold_storage": "cold-storage",
      "refrigerated_warehouse": "cold-storage",
    };

    for (const type of types) {
      if (typeMap[type]) return typeMap[type];
    }
    return undefined;
  }

  return (
    <div className="h-full min-h-0 grid grid-cols-2">
      {/* LEFT COLUMN */}
      <div className="min-h-0 border-r border-white/5 flex flex-col">
        <div className="px-12 pt-12 pb-8">
          <div className="text-center">
            {/* replace pin vibe with globe vibe */}
            <div className="text-6xl mb-5">🌍</div>
            <h2 className="text-3xl font-bold text-white mb-3">Your Location</h2>
            <p className="text-lg text-slate-400">
              Enter your ZIP/postal code to load local energy conditions.
            </p>
          </div>

          {/* Region Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex bg-white/5 rounded-xl p-1.5">
              <button
                onClick={() => handleInputChange("region", "US")}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  location?.region === "US"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-lg">🇺🇸</span> United States
              </button>
              <button
                onClick={() => handleInputChange("region", "Intl")}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  location?.region === "Intl"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-lg">🌐</span> International
              </button>
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-12 pb-12">
          <div className="space-y-6">
            {/* Business Card (shows when confirmed) */}
            {location?.business && location?.businessConfirmed && (
              <div className="mb-2 rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur-sm p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  {/* Photo/Logo with Glow Ring */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 blur-md opacity-70" />
                    <div className="relative h-16 w-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      {location.business.photoUrl ? (
                        <img
                          src={location.business.photoUrl}
                          alt={location.business.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Fallback to industry image
                            if (location.business?.industrySlug && INDUSTRY_IMAGE_MAP[location.business.industrySlug]) {
                              (e.currentTarget as HTMLImageElement).src = INDUSTRY_IMAGE_MAP[location.business.industrySlug];
                            }
                          }}
                        />
                      ) : location.business.logoUrl ? (
                        <img
                          src={location.business.logoUrl}
                          alt={`${location.business.name} logo`}
                          className="h-full w-full object-contain p-1 bg-white"
                          onError={(e) => {
                            // Fallback to industry image
                            if (location.business?.industrySlug && INDUSTRY_IMAGE_MAP[location.business.industrySlug]) {
                              (e.currentTarget as HTMLImageElement).src = INDUSTRY_IMAGE_MAP[location.business.industrySlug];
                            }
                          }}
                        />
                      ) : location.business.industrySlug && INDUSTRY_IMAGE_MAP[location.business.industrySlug] ? (
                        <img
                          src={INDUSTRY_IMAGE_MAP[location.business.industrySlug]}
                          alt={location.business.category || location.business.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                          <span className="text-xl font-bold text-white/90">
                            {location.business.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold text-white mb-1">
                      {location.business.name}
                    </div>
                    <div className="text-sm text-slate-300 mb-1">
                      {location.business.address}
                    </div>
                    {/* City, State, ZIP */}
                    {(location.business.city || location.business.state || location.business.postal) && (
                      <div className="text-sm text-slate-300 mb-1">
                        {[location.business.city, location.business.state].filter(Boolean).join(', ')}
                        {location.business.postal && ` ${location.business.postal}`}
                      </div>
                    )}
                    {location.business.category && (
                      <div className="text-xs text-slate-400 mb-2">
                        {location.business.category}
                      </div>
                    )}
                    
                    {/* Verified Badge */}
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('truequote:open', { detail: { mode: 'about' } }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      <span className="text-emerald-400">✓</span>
                      TrueQuote™ Verified
                    </button>

                    {/* ROI Preview Card - Dynamic Estimate */}
                    {savingsEstimate && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2 font-semibold">
                          Estimated Savings Preview
                        </div>
                        <div className="text-3xl font-extrabold text-white mb-1">
                          ${savingsEstimate.annualSavings.toLocaleString()}<span className="text-lg text-slate-400">/yr</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          Expected reduction via BESS + Solar (starter model)
                        </div>
                        <div className="text-sm font-semibold text-purple-300">
                          Payback ~ {savingsEstimate.paybackYears} yrs
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="text-[10px] text-slate-500 leading-relaxed">
                            Based on ${locationIntel?.utilityRate?.toFixed(2)}/kWh rate, {locationIntel?.solarGrade} solar grade, and typical {location.business.industrySlug} energy usage. Final quote calculated in next steps.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {location?.region === "US" ? "ZIP Code" : "Postal Code"}
              </label>
              <input
                type="text"
                value={location?.zipCode || ""}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder={location?.region === "US" ? "94102" : "SW1A 1AA"}
                maxLength={location?.region === "US" ? 5 : 10}
                className={[
                  "w-full bg-white/5 border-2 rounded-xl text-white placeholder-slate-500",
                  "focus:border-purple-500 focus:bg-white/10 transition-all text-center font-mono",
                  "px-6 py-5 font-bold",
                  "text-3xl tracking-[0.35em] md:text-4xl md:tracking-[0.45em]",
                  "border-purple-500/30",
                ].join(" ")}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Business Name
              </label>
              <input
                type="text"
                value={location?.businessName || ""}
                onChange={(e) => handleInputChange("businessName", e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Street Address <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={location?.streetAddress || ""}
                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-base text-white placeholder-slate-500 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                placeholder="123 Main Street"
              />
            </div>

            {/* Find My Business Button */}
            {!location?.businessConfirmed && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={lookupBusiness}
                  disabled={!isZipReady || !location?.businessName || isLookingUp}
                  className="w-full rounded-xl px-5 py-4 font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.25),0_12px_40px_rgba(168,85,247,0.18)] hover:shadow-[0_0_0_1px_rgba(168,85,247,0.35),0_16px_50px_rgba(168,85,247,0.25)]"
                >
                  {isLookingUp ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Finding your business…
                    </span>
                  ) : (
                    "Find My Business"
                  )}
                </button>

                {/* Error Display */}
                {lookupError && (
                  <p className="mt-3 text-sm text-rose-300 text-center">
                    {lookupError}
                  </p>
                )}

                {/* Candidate Selection UI */}
                {candidates.length > 0 && (
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-sm font-semibold text-white mb-3">
                      Confirm your business
                    </div>
                    <div className="space-y-2">
                      {candidates.slice(0, 3).map((c) => (
                        <button
                          key={c.placeId}
                          onClick={() => confirmBusiness(c.placeId)}
                          disabled={isLookingUp}
                          className="w-full text-left rounded-xl p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-white font-semibold">{c.name}</div>
                          <div className="text-slate-300 text-sm mt-1">{c.formattedAddress}</div>
                          {c.rating && (
                            <div className="text-slate-400 text-xs mt-1">
                              ⭐ {c.rating} ({c.userRatingsTotal || 0} reviews)
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LEFT PANEL hint — DO NOT duplicate the right panel copy */}
            {!isZipReady && (
              <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-slate-300">
                  Tip: a full ZIP/postal code unlocks the live Merlin analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="min-h-0 flex flex-col bg-gradient-to-br from-slate-900/30 to-slate-950/50">
        <div className="px-8 pt-8 pb-4">
          <AdvisorHeader subtitle="Live Analysis" />
        </div>

        {/* MERLIN INTERIOR PANEL (rounded + glow) — CANONICAL STYLE */}
        <div className="flex-1 min-h-0 overflow-y-auto px-10 pb-10">
          <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/55 to-slate-950/40 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_90px_rgba(120,40,200,0.18)] relative overflow-hidden">
            {/* Outer + inner glow layers */}
            <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-purple-600/20 blur-2xl opacity-60" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.16),transparent_55%)]" />

            {/* content */}
            <div className="relative p-8">

              {!isZipReady ? (
                <div className="text-center max-w-md mx-auto pt-6">
                  <h3 className="text-3xl font-bold text-white leading-tight mb-6">
                    You are steps away from lower <span className="text-emerald-400">energy bills</span>
                  </h3>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                    <p className="text-base text-slate-300 leading-relaxed">
                      Confirm your business so TrueQuote™ can load your utility rate, solar potential, and weather risk — then I'll recommend the highest-ROI starter system.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-7">
                  {/* Location Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🔍</span>
                      <span className="text-base font-semibold text-white">
                        Location Analysis
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {locationMetrics.map((metric, i) => (
                        <div
                          key={i}
                          className={`${
                            metric.highlight
                              ? "bg-emerald-500/10 border-emerald-500/25"
                              : "bg-white/5 border-white/10"
                          } border-2 rounded-2xl p-6 text-center`}
                        >
                          <div className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wide">
                            {metric.label}
                          </div>
                          <div className="text-xl font-bold" style={{ color: metric.color }}>
                            {metric.value}
                          </div>
                          {metric.unit && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{metric.unit}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weather Risk */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌤️</span>
                        <span className="text-base font-semibold text-white">Weather Risk</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-400">Low</span>
                    </div>
                    <div className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-2xl p-6">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Minimal weather concerns. Strong conditions for solar + storage deployment.
                      </p>
                      <div className="mt-3 text-xs text-slate-400">
                        Verified context via TrueQuote™ methodology
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">✨</span>
                      <span className="text-base font-semibold text-white">Recommendation</span>
                    </div>

                    <div
                      className="bg-gradient-to-br from-purple-600/10 to-purple-800/5 border-2 border-purple-500/30 rounded-3xl p-7"
                      style={{ animation: "pulsate 2s ease-in-out infinite" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">
                          Optimal Starting System
                        </span>
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600">
                          BESS + Solar
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Based on your solar conditions and rates, pairing battery storage with solar
                        maximizes ROI.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
