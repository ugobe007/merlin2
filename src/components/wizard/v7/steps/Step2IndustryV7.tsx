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
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Merlin Dark Theme Tokens (matching Step 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DARK = {
  bgGradient: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  cardHoverBg: "rgba(255,255,255,0.08)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.7)",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#a855f7",
  accentGlow: "rgba(168,85,247,0.4)",
  buttonBg: "rgba(168,85,247,0.2)",
  buttonBorder: "rgba(168,85,247,0.3)",
  buttonHoverBg: "rgba(168,85,247,0.3)",
  successGreen: "#22c55e",
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
        borderRadius: 16,
        border: `1px solid ${DARK.cardBorder}`,
        background: DARK.cardBg,
        padding: 20,
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  subtle,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        borderRadius: 14,
        border: subtle ? `1px solid ${DARK.cardBorder}` : `1px solid ${DARK.buttonBorder}`,
        background: subtle ? DARK.cardBg : DARK.buttonBg,
        color: DARK.textPrimary,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(34,197,94,0.15)",
        border: "1px solid rgba(34,197,94,0.3)",
        fontSize: 12,
        color: DARK.successGreen,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
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
        {/* Header Card */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.5px", color: DARK.textPrimary }}>
                Choose Your Industry
              </div>
              <div style={{ marginTop: 8, fontSize: 16, color: DARK.textSecondary }}>
                Select the industry that best describes your facility so we can customize your energy recommendations.
              </div>
            </div>
            <Pill>📍 {locationLine}</Pill>
          </div>

          <div style={{ marginTop: 16 }}>
            <Button onClick={actions.goBack} subtle>
              ← Back to location
            </Button>
          </div>
        </Card>

        {/* Industries Grid */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: DARK.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                  borderRadius: 16,
                  border: `1px solid ${DARK.cardBorder}`,
                  padding: 0,
                  background: DARK.cardBg,
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.background = DARK.cardHoverBg;
                    e.currentTarget.style.borderColor = DARK.accent;
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 30px ${DARK.accentGlow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = DARK.cardBg;
                  e.currentTarget.style.borderColor = DARK.cardBorder;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Image Section */}
                {it.image ? (
                  <div
                    style={{
                      height: 120,
                      background: `url(${it.image}) center/cover no-repeat`,
                      borderBottom: `1px solid ${DARK.cardBorder}`,
                    }}
                  />
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: DARK.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
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
