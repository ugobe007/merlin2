import React, { useMemo } from "react";
import type { IndustrySlug, WizardState } from "@/wizard/v7/hooks/useWizardV7";

type Props = {
  state: WizardState;
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
        border: "1px solid rgba(0,0,0,0.10)",
        background: "white",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
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
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.12)",
        background: subtle ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.06)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 800,
        opacity: disabled ? 0.6 : 1,
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
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.08)",
        fontSize: 12,
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

const INDUSTRIES: Array<{
  slug: IndustrySlug;
  label: string;
  desc: string;
  emoji: string;
}> = [
  {
    slug: "car_wash",
    label: "Car Wash",
    desc: "Tunnel / in-bay / single-site operators",
    emoji: "🚿",
  },
  {
    slug: "ev_charging",
    label: "EV Charging Hub",
    desc: "Depot / public charging sites",
    emoji: "⚡",
  },
  { slug: "hotel", label: "Hotel / Hospitality", desc: "Hotels, resorts, properties", emoji: "🏨" },
  { slug: "restaurant", label: "Restaurant", desc: "Quick service, full service", emoji: "🍽️" },
  { slug: "retail", label: "Retail", desc: "Stores, malls, chain locations", emoji: "🛍️" },
  {
    slug: "warehouse",
    label: "Warehouse / Logistics",
    desc: "Distribution, light industrial",
    emoji: "📦",
  },
  {
    slug: "manufacturing",
    label: "Manufacturing",
    desc: "Industrial loads, production lines",
    emoji: "🏭",
  },
  { slug: "office", label: "Office", desc: "Commercial office buildings", emoji: "🏢" },
  { slug: "healthcare", label: "Healthcare", desc: "Clinics, hospitals, labs", emoji: "🏥" },
  { slug: "data_center", label: "Data Center", desc: "Critical loads + redundancy", emoji: "🖥️" },
  { slug: "other", label: "Other", desc: "If none fit, pick this", emoji: "✨" },
];

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
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.2px" }}>
              Step 2 — Choose your industry
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
              SSOT couldn't infer your industry with high confidence, so choose it here.
            </div>
          </div>
          <Pill>📍 {locationLine}</Pill>
        </div>

        <div style={{ marginTop: 12 }}>
          <Button onClick={actions.goBack} subtle>
            ← Back to location
          </Button>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>Industries</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 10,
          }}
        >
          {INDUSTRIES.map((it) => (
            <div
              key={it.slug}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.10)",
                padding: 12,
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75 }}>{it.emoji}</div>
              <div style={{ marginTop: 6, fontSize: 15, fontWeight: 900 }}>{it.label}</div>
              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.72 }}>{it.desc}</div>

              <div style={{ marginTop: 10 }}>
                <button
                  disabled={disabled}
                  onClick={() => actions.selectIndustry(it.slug)}
                  style={{
                    width: "100%",
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: disabled ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.06)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: 900,
                  }}
                >
                  Choose {it.label}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
          Note: Industry inference lives in SSOT (useWizardV7). This page is intentionally dumb.
        </div>
      </Card>
    </div>
  );
}
