/**
 * ENHANCED INDUSTRY SELECTION (Step 2)
 * =====================================
 *
 * Step 2 of WizardV6 with opportunity previews.
 *
 * Features:
 * - Opportunity preview on each card (typical savings)
 * - Solar fit rating (⭐⭐⭐⭐⭐)
 * - Skip-confirmation if business auto-detected
 * - Industry comparison in bottom panel
 * - Same visual design as current Step2Industry
 *
 * Created: Jan 15, 2026
 * Part of: Bottom panel + smart detection initiative
 */

import React, { useState } from "react";
import { Check, Sparkles, Sun } from "lucide-react";
import type { WizardState, BusinessSizeTier, QuestionnaireDepth } from "../types";
import { INDUSTRY_NAMES } from "@/services/googlePlacesService";
import { BusinessSizePanel } from "../components/BusinessSizePanel";

// Industry images
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import carWashImg from "@/assets/images/Car_Wash_PitStop.jpg";
import evChargingImg from "@/assets/images/ev_charging_hub2.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import hospitalImg from "@/assets/images/hospital_1.jpg";
import retailImg from "@/assets/images/retail_2.jpg";
import officeImg from "@/assets/images/office_building1.jpg";
import collegeImg from "@/assets/images/college_1.jpg";
import warehouseImg from "@/assets/images/logistics_1.jpg";
import agricultureImg from "@/assets/images/agriculture_1.jpg";
import truckStopImg from "@/assets/images/truck_stop.jpg";
import airportImg from "@/assets/images/airport_11.jpeg";
import indoorFarmImg from "@/assets/images/indoor_farm1.jpg";
import shoppingCenterImg from "@/assets/images/shopping_center.jpg";
import coldStorageImg from "@/assets/images/cold_storage.jpg";
import apartmentImg from "@/assets/images/apartment_building.jpg";
import residentialImg from "@/assets/images/residential.jpg";
import restaurantImg from "@/assets/images/restaurant_1.jpg";
import casinoImg from "@/assets/images/casino_gaming1.jpg";

// ============================================
// OPPORTUNITY DATA (for previews)
// ============================================

interface IndustryOpportunity {
  slug: string;
  name: string;
  image: string;
  savingsLow: number;
  savingsHigh: number;
  solarFit: 1 | 2 | 3 | 4 | 5; // Star rating
  paybackYears: number;
}

const INDUSTRIES: IndustryOpportunity[] = [
  // Commercial
  {
    slug: "hotel",
    name: "Hotel / Hospitality",
    image: hotelImg,
    savingsLow: 150000,
    savingsHigh: 400000,
    solarFit: 5,
    paybackYears: 5.5,
  },
  {
    slug: "car-wash",
    name: "Car Wash",
    image: carWashImg,
    savingsLow: 80000,
    savingsHigh: 200000,
    solarFit: 5,
    paybackYears: 4.2,
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    image: restaurantImg,
    savingsLow: 40000,
    savingsHigh: 120000,
    solarFit: 4,
    paybackYears: 6.0,
  },
  {
    slug: "retail",
    name: "Retail / Commercial",
    image: retailImg,
    savingsLow: 80000,
    savingsHigh: 250000,
    solarFit: 5,
    paybackYears: 5.8,
  },
  {
    slug: "shopping-center",
    name: "Shopping Center / Mall",
    image: shoppingCenterImg,
    savingsLow: 200000,
    savingsHigh: 600000,
    solarFit: 5,
    paybackYears: 5.0,
  },
  {
    slug: "office",
    name: "Office Building",
    image: officeImg,
    savingsLow: 100000,
    savingsHigh: 300000,
    solarFit: 5,
    paybackYears: 6.2,
  },
  {
    slug: "casino",
    name: "Casino & Gaming",
    image: casinoImg,
    savingsLow: 300000,
    savingsHigh: 900000,
    solarFit: 4,
    paybackYears: 4.8,
  },

  // Transportation & Logistics
  {
    slug: "heavy_duty_truck_stop",
    name: "Truck Stop / Travel Center",
    image: truckStopImg,
    savingsLow: 120000,
    savingsHigh: 350000,
    solarFit: 5,
    paybackYears: 5.5,
  },
  {
    slug: "ev-charging",
    name: "EV Charging Hub",
    image: evChargingImg,
    savingsLow: 50000,
    savingsHigh: 150000,
    solarFit: 5,
    paybackYears: 7.0,
  },
  {
    slug: "warehouse",
    name: "Warehouse / Logistics",
    image: warehouseImg,
    savingsLow: 100000,
    savingsHigh: 300000,
    solarFit: 5,
    paybackYears: 5.2,
  },
  {
    slug: "airport",
    name: "Airport",
    image: airportImg,
    savingsLow: 500000,
    savingsHigh: 1500000,
    solarFit: 4,
    paybackYears: 6.5,
  },

  // Industrial
  {
    slug: "manufacturing",
    name: "Manufacturing",
    image: manufacturingImg,
    savingsLow: 200000,
    savingsHigh: 600000,
    solarFit: 4,
    paybackYears: 5.0,
  },
  {
    slug: "data-center",
    name: "Data Center",
    image: dataCenterImg,
    savingsLow: 500000,
    savingsHigh: 2000000,
    solarFit: 3,
    paybackYears: 6.0,
  },
  {
    slug: "cold-storage",
    name: "Cold Storage",
    image: coldStorageImg,
    savingsLow: 150000,
    savingsHigh: 450000,
    solarFit: 4,
    paybackYears: 5.5,
  },

  // Institutional
  {
    slug: "hospital",
    name: "Hospital / Healthcare",
    image: hospitalImg,
    savingsLow: 300000,
    savingsHigh: 800000,
    solarFit: 4,
    paybackYears: 6.8,
  },
  {
    slug: "college",
    name: "College / University",
    image: collegeImg,
    savingsLow: 250000,
    savingsHigh: 700000,
    solarFit: 5,
    paybackYears: 7.0,
  },

  // Agricultural
  {
    slug: "agricultural",
    name: "Agriculture",
    image: agricultureImg,
    savingsLow: 100000,
    savingsHigh: 300000,
    solarFit: 5,
    paybackYears: 6.5,
  },
  {
    slug: "indoor-farm",
    name: "Indoor / Vertical Farm",
    image: indoorFarmImg,
    savingsLow: 150000,
    savingsHigh: 400000,
    solarFit: 5,
    paybackYears: 5.0,
  },

  // Residential
  {
    slug: "apartment",
    name: "Apartment Complex",
    image: apartmentImg,
    savingsLow: 80000,
    savingsHigh: 250000,
    solarFit: 5,
    paybackYears: 7.5,
  },
  {
    slug: "residential",
    name: "Residential",
    image: residentialImg,
    savingsLow: 20000,
    savingsHigh: 60000,
    solarFit: 5,
    paybackYears: 8.0,
  },
];

// ============================================
// RENDER SOLAR FIT STARS
// ============================================

const _SolarFitStars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Sun
          key={star}
          className={`w-3 h-3 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"
          }`}
        />
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext?: () => void;
}

export function EnhancedStep2Industry({ state, updateState, onNext }: Props) {
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [pendingIndustry, setPendingIndustry] = useState<{ slug: string; name: string } | null>(
    null
  );

  const hasPresetSize = state.businessName && state.businessSizeTier;

  const selectIndustry = (slug: string, name: string) => {
    // ✅ FIX (Jan 25, 2026): Validate industry before allowing navigation
    if (!slug || !name) {
      console.error("Step2: Cannot select industry without slug and name");
      return;
    }

    updateState({ industry: slug, industryName: name });

    if (hasPresetSize) {
      if (onNext) setTimeout(onNext, 500);
      return;
    }

    setPendingIndustry({ slug, name });
    setShowSizePanel(true);
  };

  const handleSizeSelect = (size: BusinessSizeTier, depth: QuestionnaireDepth) => {
    // ✅ CRITICAL FIX (Jan 25, 2026): Normalize and validate industry slug before committing
    const normalizeIndustry = (raw: string): string => {
      return raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    };

    const slug = normalizeIndustry(
      (typeof state.industry === "string" && state.industry) ||
      (state as any).industrySlug ||
      (state as any).detectedIndustry ||
      ""
    );

    const name = state.industryName || slug;

    if (!slug || slug === "unknown") {
      console.error("❌ Step2: Cannot advance - industry slug is missing or invalid:", slug);
      setShowSizePanel(false);
      return;
    }

    // Atomic SSOT update: commit ALL Step 2 fields before advancing
    updateState({
      industry: slug,
      industryName: name,
      businessSizeTier: size,
      questionnaireDepth: depth,
    });

    if (import.meta.env.DEV) {
      console.log("✅ Step2: Committing to state:", { industry: slug, industryName: name, businessSizeTier: size, questionnaireDepth: depth });
    }

    setShowSizePanel(false);
    if (onNext) setTimeout(onNext, 300);
  };

  const normalizeSlug = (slug: string) => slug?.replace(/-/g, "_");
  const detectedSlug = state.detectedIndustry ? normalizeSlug(state.detectedIndustry) : null;

  return (
    <div className="relative space-y-8 pb-8">
      {/* Pre-detected Industry Banner */}
      {state.businessName && detectedSlug && (
        <div className="max-w-3xl mx-auto mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border border-green-500/50 shadow-lg shadow-green-500/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 font-bold">
                    🧙 Merlin detected your business!
                  </span>
                </div>
                <p className="text-white">
                  <span className="font-semibold">{state.businessName}</span>
                  {state.businessAddress && (
                    <span className="text-slate-400 text-sm ml-2">• {state.businessAddress}</span>
                  )}
                </p>
                <p className="text-emerald-300 text-sm mt-1">
                  Industry:{" "}
                  <span className="font-semibold">
                    {INDUSTRY_NAMES[state.detectedIndustry || ""] ||
                      state.industryName ||
                      "Unknown"}
                  </span>{" "}
                  — Confirm below or select a different industry
                </p>
              </div>
              {state.businessPhotoUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500/50 flex-shrink-0">
                  <img
                    src={state.businessPhotoUrl}
                    alt={state.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-3">
          {state.businessName ? "Confirm Your Industry" : "Select Your Industry"}
        </h1>
        <p className="text-purple-300 text-lg">
          See typical savings and solar fit for each industry
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {INDUSTRIES.map((industry) => {
          const isSelected =
            state.industry === industry.slug ||
            normalizeSlug(state.industry) === industry.slug ||
            state.industry === industry.slug.replace(/_/g, "-");
          return (
            <button
              key={industry.slug}
              onClick={() => selectIndustry(industry.slug, industry.name)}
              className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                isSelected
                  ? "ring-4 ring-purple-500 scale-105 shadow-xl shadow-purple-500/30"
                  : "hover:scale-102 hover:shadow-lg"
              }`}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={industry.image}
                  alt={industry.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isSelected ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
              </div>

              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity ${
                  isSelected ? "opacity-95" : "opacity-80 group-hover:opacity-90"
                }`}
              />

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Label + Payback */}
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                <p
                  className={`font-bold text-base sm:text-lg text-center leading-tight ${
                    isSelected ? "text-white" : "text-white/95"
                  }`}
                >
                  {industry.name}
                </p>
                <p className="text-emerald-300 text-xs text-center font-medium">
                  {industry.paybackYears}yr payback
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {state.industry && !showSizePanel && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium text-lg">
            ✓ Selected: <strong>{state.industryName}</strong>
          </p>
          {state.businessSizeTier && (
            <p className="text-emerald-300 text-sm mt-1">
              Size:{" "}
              <strong className="capitalize">{state.businessSizeTier.replace("_", " ")}</strong> •
              Questionnaire: <strong className="capitalize">{state.questionnaireDepth}</strong>
            </p>
          )}
        </div>
      )}

      {/* Business Size Selection Panel */}
      {showSizePanel && (
        <BusinessSizePanel
          industry={pendingIndustry?.slug || state.industry || ""}
          industryName={pendingIndustry?.name || state.industryName || ""}
          selectedSize={state.businessSizeTier}
          onSelectSize={handleSizeSelect}
          onSkip={() => {
            handleSizeSelect("medium", "standard");
          }}
          onClose={() => setShowSizePanel(false)}
        />
      )}
    </div>
  );
}

export default EnhancedStep2Industry;
