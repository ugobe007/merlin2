/**
 * IntelStrip.tsx
 * 
 * Progressive hydration display for location intelligence.
 * Shows utility rate, demand charge, solar potential, weather - each with own status.
 * Appears immediately when user starts typing ZIP.
 */

import React from "react";

export type FetchStatus = "idle" | "fetching" | "ready" | "error";

export interface IntelData {
  // Utility
  utilityRate?: number;
  utilityStatus?: FetchStatus;
  utilityError?: string;
  utilityProvider?: string;
  demandCharge?: number;

  // Solar
  peakSunHours?: number;
  solarGrade?: string;
  solarStatus?: FetchStatus;
  solarError?: string;

  // Weather
  weatherProfile?: string;
  weatherRisk?: string;
  weatherStatus?: FetchStatus;
  weatherError?: string;
}

interface IntelStripProps {
  intel: IntelData | null;
  compact?: boolean;
}

interface ChipProps {
  label: string;
  value?: string | number;
  unit?: string;
  status?: FetchStatus;
  error?: string;
}

function IntelChip({ label, value, unit, status, error }: ChipProps) {
  const isLoading = status === "fetching";
  const isError = status === "error";
  const isReady = status === "ready" && value !== undefined;

  let bgColor = "rgba(28, 32, 58, 0.7)";
  let shadowColor = "rgba(0, 0, 0, 0.2)";

  if (isError) {
    bgColor = "rgba(239, 68, 68, 0.1)";
    shadowColor = "rgba(239, 68, 68, 0.15)";
  } else if (isLoading) {
    bgColor = "rgba(79, 140, 255, 0.08)";
    shadowColor = "rgba(79, 140, 255, 0.15)";
  } else if (isReady) {
    bgColor = "rgba(74, 222, 128, 0.08)";
    shadowColor = "rgba(74, 222, 128, 0.12)";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 14px",
        borderRadius: 12,
        background: bgColor,
        boxShadow: `0 2px 8px ${shadowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
        minWidth: 100,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          color: "rgba(232, 235, 243, 0.5)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "rgba(232, 235, 243, 0.95)",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        {isLoading ? (
          <span
            style={{
              color: "rgba(79, 140, 255, 0.8)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            ...
          </span>
        ) : isError ? (
          <span style={{ color: "rgba(239, 68, 68, 0.9)", fontSize: 12 }} title={error}>
            error
          </span>
        ) : isReady ? (
          <>
            {typeof value === "number" ? value.toFixed(2) : value}
            {unit && (
              <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>{unit}</span>
            )}
          </>
        ) : (
          <span style={{ color: "rgba(232, 235, 243, 0.25)" }}>—</span>
        )}
      </div>
    </div>
  );
}

export default function IntelStrip({ intel, compact = false }: IntelStripProps) {
  // Don't render if no intel at all
  if (!intel) return null;

  // Check if any status is non-idle (meaning hydration has started)
  const hasActivity =
    intel.utilityStatus ||
    intel.solarStatus ||
    intel.weatherStatus ||
    intel.utilityRate !== undefined ||
    intel.peakSunHours !== undefined;

  if (!hasActivity) return null;

  return (
    <div
      style={{
        padding: compact ? 12 : 16,
        borderRadius: 14,
        background: "rgba(28, 32, 58, 0.5)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(232, 235, 243, 0.85)",
          }}
        >
          📡 Location Intelligence
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.5px",
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(79, 140, 255, 0.15)",
            boxShadow: "0 2px 6px rgba(79, 140, 255, 0.12)",
            color: "rgba(79, 140, 255, 0.9)",
            textTransform: "uppercase",
          }}
        >
          Live SSOT
        </div>
      </div>

      {/* Chips */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <IntelChip
          label="⚡ Utility Rate"
          value={intel.utilityRate}
          unit="$/kWh"
          status={intel.utilityStatus}
          error={intel.utilityError}
        />
        <IntelChip
          label="💰 Demand"
          value={intel.demandCharge}
          unit="$/kW"
          status={intel.utilityStatus}
          error={intel.utilityError}
        />
        <IntelChip
          label="☀️ Peak Sun"
          value={intel.peakSunHours}
          unit="hrs"
          status={intel.solarStatus}
          error={intel.solarError}
        />
        <IntelChip
          label="📈 Solar Grade"
          value={intel.solarGrade}
          status={intel.solarStatus}
          error={intel.solarError}
        />
        <IntelChip
          label="🌤️ Weather"
          value={intel.weatherProfile}
          status={intel.weatherStatus}
          error={intel.weatherError}
        />
      </div>

      {/* Provider attribution if available */}
      {intel.utilityProvider && intel.utilityStatus === "ready" && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "rgba(232, 235, 243, 0.45)",
          }}
        >
          Provider: {intel.utilityProvider}
        </div>
      )}
    </div>
  );
}
