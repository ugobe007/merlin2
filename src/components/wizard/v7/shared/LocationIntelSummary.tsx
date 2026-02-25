/**
 * LocationIntelSummary.tsx
 *
 * Compact card for the Merlin Advisor rail showing location intelligence
 * gathered in Step 1: utility rate, solar hours, weather, temperature.
 *
 * Appears in the left rail for all steps AFTER Step 1 so users can see
 * their location context throughout the wizard.
 *
 * Feb 25, 2026 — Post-Step-1 advisor persistence.
 */

import React from "react";
import { Sun, Zap, Thermometer, MapPin, Snowflake } from "lucide-react";
import type { LocationCard, LocationIntel } from "@/wizard/v7/hooks/useWizardV7";

interface Props {
  location?: LocationCard | null;
  intel?: LocationIntel | null;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "yellow" | "green" | "blue" | "orange" | "default";
}

const TONE_COLORS: Record<string, string> = {
  yellow: "rgba(251, 191, 36, 0.9)",
  green: "rgba(52, 211, 153, 0.9)",
  blue: "rgba(147, 197, 253, 0.9)",
  orange: "rgba(251, 146, 60, 0.9)",
  default: "rgba(232, 235, 243, 0.7)",
};

function StatRow({ icon, label, value, tone = "default" }: StatRowProps) {
  const color = TONE_COLORS[tone];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color.replace("0.9", "0.10")}`,
          border: `1px solid ${color.replace("0.9", "0.20")}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "rgba(232, 235, 243, 0.35)",
            lineHeight: 1,
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function LocationIntelSummary({ location, intel }: Props) {
  const hasLocation = !!(location?.city || location?.state || location?.postalCode);
  const hasIntel = !!(
    intel?.utilityRate !== undefined ||
    intel?.peakSunHours !== undefined ||
    intel?.weatherProfile ||
    intel?.avgTempF !== undefined
  );

  if (!hasLocation && !hasIntel) return null;

  const locationLabel = [location?.city, location?.state].filter(Boolean).join(", ");
  const locationSub = location?.postalCode ?? location?.formattedAddress;

  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        border: "1px solid rgba(62, 207, 142, 0.12)",
        background: "rgba(62, 207, 142, 0.03)",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: "9px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#3ECF8E",
            boxShadow: "0 0 5px rgba(62,207,142,0.5)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            color: "rgba(62, 207, 142, 0.75)",
          }}
        >
          Location Summary
        </span>
      </div>

      {/* Stats */}
      <div style={{ padding: "8px 14px 4px" }}>
        {/* Location row */}
        {hasLocation && (
          <StatRow
            icon={<MapPin size={13} />}
            label="Location"
            value={
              locationLabel ? (
                <>
                  {locationLabel}
                  {locationSub && (
                    <span
                      style={{
                        color: "rgba(232,235,243,0.35)",
                        fontWeight: 400,
                        marginLeft: 5,
                        fontSize: 11,
                      }}
                    >
                      {locationSub}
                    </span>
                  )}
                </>
              ) : (
                (locationSub ?? "—")
              )
            }
            tone="green"
          />
        )}

        {/* Utility rate + demand */}
        {intel?.utilityRate !== undefined && (
          <StatRow
            icon={<Zap size={13} />}
            label="Utility Rate"
            value={
              <>
                ${intel.utilityRate.toFixed(3)}/kWh
                {intel.demandCharge !== undefined && (
                  <span
                    style={{
                      color: "rgba(251,191,36,0.55)",
                      fontWeight: 400,
                      marginLeft: 6,
                      fontSize: 11,
                    }}
                  >
                    · ${intel.demandCharge}/kW demand
                  </span>
                )}
              </>
            }
            tone="yellow"
          />
        )}

        {/* Solar */}
        {intel?.peakSunHours !== undefined && (
          <StatRow
            icon={<Sun size={13} />}
            label="Solar Potential"
            value={
              <>
                {intel.peakSunHours} peak sun hrs
                {intel.solarGrade && (
                  <span
                    style={{
                      color: "rgba(167,139,250,0.75)",
                      fontWeight: 700,
                      marginLeft: 6,
                      fontSize: 11,
                    }}
                  >
                    Grade {intel.solarGrade}
                  </span>
                )}
              </>
            }
            tone="yellow"
          />
        )}

        {/* Weather */}
        {(intel?.weatherProfile || intel?.avgTempF !== undefined) && (
          <StatRow
            icon={
              intel.weatherProfile?.toLowerCase().includes("cold") ||
              intel.weatherProfile?.toLowerCase().includes("snow") ? (
                <Snowflake size={13} />
              ) : (
                <Thermometer size={13} />
              )
            }
            label="Climate"
            value={
              <>
                {intel.weatherProfile ?? ""}
                {intel.avgTempF !== undefined && (
                  <span
                    style={{
                      color: "rgba(251,146,60,0.75)",
                      fontWeight: 600,
                      marginLeft: intel.weatherProfile ? 6 : 0,
                      fontSize: 11,
                    }}
                  >
                    avg {Math.round(intel.avgTempF)}°F
                  </span>
                )}
              </>
            }
            tone="orange"
          />
        )}

        {/* Utility provider in fine print */}
        {intel?.utilityProvider && (
          <div
            style={{
              fontSize: 10,
              color: "rgba(232,235,243,0.22)",
              padding: "4px 0 6px",
              fontWeight: 500,
            }}
          >
            Utility: {intel.utilityProvider}
          </div>
        )}
      </div>
    </div>
  );
}
