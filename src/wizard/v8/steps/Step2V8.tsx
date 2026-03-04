/**
 * WIZARD V8 — STEP 2: INDUSTRY SELECTION
 *
 * Ported directly from Step2IndustryV7 — same photo card grid, same DARK tokens.
 * V8 difference: clicking a card calls setIndustry + goToStep(3) (self-advances).
 */

import React from "react";
import type { WizardState, WizardActions, IndustrySlug } from "../wizardState";
import { INDUSTRY_META } from "@/wizard/v7/industryMeta";

// Vite requires static image imports
import carWashImg from "@/assets/images/car_wash_1.jpg";
import evChargingImg from "@/assets/images/ev_charging_station.jpg";
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import restaurantImg from "@/assets/images/restaurant_1.jpg";
import retailImg from "@/assets/images/retail_1.jpg";
import logisticsImg from "@/assets/images/logistics_1.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import officeImg from "@/assets/images/office_building1.jpg";
import healthcareImg from "@/assets/images/hospital_1.jpg";
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import gasStationImg from "@/assets/images/truck_stop.jpg";
import airportImg from "@/assets/images/airport_1.jpg";
import casinoImg from "@/assets/images/casino_gaming1.jpg";
import collegeImg from "@/assets/images/college_1.jpg";
import apartmentImg from "@/assets/images/apartment_building.jpg";
import residentialImg from "@/assets/images/Residential1.jpg";
import coldStorageImg from "@/assets/images/cold_storage.jpg";
import indoorFarmImg from "@/assets/images/indoor_farm1.jpg";
import agricultureImg from "@/assets/images/agriculture_1.jpg";

const IMAGE_MAP: Record<string, string> = {
  car_wash: carWashImg,
  ev_charging: evChargingImg,
  hotel: hotelImg,
  restaurant: restaurantImg,
  retail: retailImg,
  warehouse: logisticsImg,
  manufacturing: manufacturingImg,
  office: officeImg,
  hospital: healthcareImg,
  healthcare: healthcareImg,
  data_center: dataCenterImg,
  gas_station: gasStationImg,
  airport: airportImg,
  casino: casinoImg,
  college: collegeImg,
  apartment: apartmentImg,
  residential: residentialImg,
  cold_storage: coldStorageImg,
  indoor_farm: indoorFarmImg,
  agriculture: agricultureImg,
};

const DARK = {
  cardBg: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.09)",
  cardHoverBg: "rgba(255,255,255,0.08)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.35)",
  accent: "#3ECF8E",
};

const DISPLAY_ORDER = [
  "car_wash", "ev_charging", "hotel", "restaurant", "retail", "warehouse",
  "manufacturing", "office", "healthcare", "data_center", "gas_station",
  "airport", "casino", "college", "apartment", "residential",
  "cold_storage", "indoor_farm", "agriculture", "other",
];

const INDUSTRIES = DISPLAY_ORDER.map((slug) => {
  const meta = INDUSTRY_META[slug] ?? INDUSTRY_META.other;
  return {
    slug,
    label: meta.label,
    desc: meta.description ?? "",
    emoji: meta.icon,
    image: IMAGE_MAP[slug] ?? "",
  };
});

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export function Step2V8({ state, actions }: Props) {
  const locationLine = state.location
    ? [state.location.city, state.location.state, state.location.zip].filter(Boolean).join(", ")
    : "";

  return (
    <div style={{ padding: "0", color: DARK.textPrimary }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }} className="grid gap-4 sm:gap-5 px-1 sm:px-0">

        {/* Guidance row */}
        <div>
          <div style={{ fontSize: 14, color: DARK.textSecondary, lineHeight: 1.6 }}>
            Select your industry
            {locationLine && (
              <>
                <span style={{ color: "rgba(232,235,243,0.25)", margin: "0 8px" }} className="hidden sm:inline">·</span>
                <span style={{ fontSize: 13, color: "rgba(232,235,243,0.35)" }} className="hidden sm:inline">
                  📍 {locationLine}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,235,243,0.35)", marginTop: 4 }}>
            This determines your facility's energy profile and custom questions.
          </div>
        </div>

        {/* Grid header */}
        <div
          style={{
            fontSize: 13, fontWeight: 600, marginBottom: 4,
            color: DARK.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px",
          }}
        >
          Select Industry
        </div>

        {/* Industry card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {INDUSTRIES.map((it) => {
            const isSelected = state.industry === it.slug;
            return (
              <button
                key={it.slug}
                data-testid={`industry-card-v8-${it.slug.replace(/_/g, "-")}`}
                onClick={() => {
                  actions.setIndustry(it.slug as IndustrySlug);
                  actions.goToStep(3);
                }}
                className="rounded-xl text-left overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                style={{
                  border: `${isSelected ? "1.5px" : "1px"} solid ${
                    isSelected ? "rgba(62,207,142,0.65)" : DARK.cardBorder
                  }`,
                  padding: 0,
                  background: isSelected ? "rgba(62,207,142,0.08)" : DARK.cardBg,
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(62,207,142,0.12), 0 0 28px rgba(62,207,142,0.14)"
                    : "none",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = DARK.cardHoverBg;
                    e.currentTarget.style.borderColor = DARK.accent;
                    e.currentTarget.style.boxShadow =
                      "0 0 0 1px rgba(62,207,142,0.10), 0 4px 18px rgba(0,0,0,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = DARK.cardBg;
                    e.currentTarget.style.borderColor = DARK.cardBorder;
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute", top: 8, right: 8,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(62,207,142,0.90)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#0f1117",
                      zIndex: 10, boxShadow: "0 0 10px rgba(62,207,142,0.55)",
                    }}
                  >
                    ✓
                  </div>
                )}

                {/* Photo */}
                {it.image ? (
                  <div
                    className="relative h-20 sm:h-28 md:h-[120px] overflow-hidden"
                    style={{
                      borderBottom: `1px solid ${
                        isSelected ? "rgba(62,207,142,0.35)" : DARK.cardBorder
                      }`,
                    }}
                  >
                    <img src={it.image} alt={it.label} className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 65%)" }}
                    />
                  </div>
                ) : (
                  <div
                    className="h-20 sm:h-28 md:h-[120px] flex items-center justify-center text-3xl sm:text-5xl"
                    style={{
                      background: `linear-gradient(135deg, ${DARK.accent}33 0%, ${DARK.cardBg} 100%)`,
                      borderBottom: `1px solid ${DARK.cardBorder}`,
                    }}
                  >
                    {it.emoji}
                  </div>
                )}

                {/* Label + description */}
                <div className="p-2.5 sm:p-4">
                  <div
                    className="text-xs sm:text-sm md:text-base font-semibold flex items-center gap-1.5 sm:gap-2"
                    style={{ color: DARK.textPrimary }}
                  >
                    <span className="text-sm sm:text-base">{it.emoji}</span> {it.label}
                  </div>
                  <div
                    className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs md:text-[13px] line-clamp-2"
                    style={{ color: DARK.textMuted }}
                  >
                    {it.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Step2V8;
