import React, { useMemo } from "react";
import type { IndustrySlug, WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";
import { INDUSTRY_META, type IndustryMetaEntry } from "@/wizard/v7/industryMeta";

// Vite requires static image imports — map canonical slug → resolved asset
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
import gasStationImg from "@/assets/images/truck_stop.png";
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Merlin Dark Theme Tokens (matching Step 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DARK = {
  bgGradient: "transparent",
  cardBg: "rgba(255,255,255,0.03)",
  cardBorder: "rgba(255,255,255,0.05)",
  cardHoverBg: "rgba(255,255,255,0.05)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.35)",
  accent: "#3ECF8E",
  accentGlow: "none",
  buttonBg: "rgba(62,207,142,0.10)",
  buttonBorder: "rgba(62,207,142,0.25)",
  buttonHoverBg: "rgba(62,207,142,0.15)",
  successGreen: "#3ECF8E",
};

type Props = {
  state: WizardV7State;
  actions: {
    goBack: () => void;
    selectIndustry: (industry: IndustrySlug) => Promise<void>;
  };
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 12,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Build the display list from INDUSTRY_META (SSOT).
 * Order is explicit — we control the grid position here, not in the registry.
 */
const DISPLAY_ORDER: string[] = [
  "car_wash",
  "ev_charging",
  "hotel",
  "restaurant",
  "retail",
  "warehouse",
  "manufacturing",
  "office",
  "healthcare",
  "data_center",
  "gas_station",
  "airport",
  "casino",
  "college",
  "apartment",
  "residential",
  "cold_storage",
  "indoor_farm",
  "agriculture",
  "other",
];

const INDUSTRIES: Array<{
  slug: IndustrySlug;
  label: string;
  desc: string;
  emoji: string;
  image: string;
}> = DISPLAY_ORDER.map((slug) => {
  const meta: IndustryMetaEntry = INDUSTRY_META[slug] ?? INDUSTRY_META.other;
  return {
    slug: slug as IndustrySlug,
    label: meta.label,
    desc: meta.description ?? "",
    emoji: meta.icon,
    image: IMAGE_MAP[slug] ?? "",
  };
});

export default function Step2IndustryV7({ state, actions }: Props) {
  const locationLine = useMemo(() => {
    if (!state.location) return "No location set.";
    const parts = [state.location.city, state.location.state, state.location.postalCode].filter(
      Boolean
    );
    return parts.length ? parts.join(", ") : state.location.formattedAddress;
  }, [state.location]);

  const disabled = !state.location || state.isBusy;

  return (
    <div
      style={{
        padding: "0",
        color: DARK.textPrimary,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 20 }}>
        {/* Inline guidance */}
        <div>
          <div style={{ fontSize: 14, color: DARK.textSecondary, lineHeight: 1.6 }}>
            Select your industry
            <span style={{ color: "rgba(232,235,243,0.25)", margin: "0 8px" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(232,235,243,0.35)" }}>📍 {locationLine}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(232,235,243,0.35)", marginTop: 4 }}>
            This determines your facility's energy profile and custom questions.
          </div>
        </div>

        {/* Industries Grid */}
        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              color: DARK.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Select Industry
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {INDUSTRIES.map((it) => (
              <button
                key={it.slug}
                data-testid={`industry-card-${it.slug.replace(/_/g, "-")}`}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) {
                    actions.selectIndustry(it.slug);
                  }
                }}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${DARK.cardBorder}`,
                  padding: 0,
                  background: DARK.cardBg,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.background = DARK.cardHoverBg;
                    e.currentTarget.style.borderColor = DARK.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = DARK.cardBg;
                  e.currentTarget.style.borderColor = DARK.cardBorder;
                }}
              >
                {/* Image Section */}
                {it.image ? (
                  <div
                    style={{
                      height: 120,
                      overflow: "hidden",
                      borderBottom: `1px solid ${DARK.cardBorder}`,
                    }}
                  >
                    <img
                      src={it.image}
                      alt={it.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: 120,
                      background: `linear-gradient(135deg, ${DARK.accent}33 0%, ${DARK.cardBg} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      borderBottom: `1px solid ${DARK.cardBorder}`,
                    }}
                  >
                    {it.emoji}
                  </div>
                )}
                {/* Text Section */}
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: DARK.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{it.emoji}</span> {it.label}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: DARK.textMuted }}>{it.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
