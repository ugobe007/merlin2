/**
 * IntelStripInline.tsx
 *
 * Clean inline version of location intelligence data.
 * Replaces the heavy glowing-chip IntelStrip with a compact data row
 * that matches the Merlin inline text design language.
 *
 * Feb 12, 2026 — Designed for consistency with Step 4/5/6 inline guidance.
 */

import React from "react";

/** Fetch status for individual intel data points */
type FetchStatus = "idle" | "fetching" | "ready" | "error";

/** Location intelligence data used for inline display */
interface IntelData {
  utilityRate?: number;
  demandCharge?: number;
  peakSunHours?: number;
  solarGrade?: string;
  weatherProfile?: string;
  utilityProvider?: string;
  utilityStatus?: FetchStatus;
  solarStatus?: FetchStatus;
  weatherStatus?: FetchStatus;
}

interface Props {
  intel: IntelData | null;
}

function Dot() {
  return <span style={{ color: "rgba(232, 235, 243, 0.18)", margin: "0 6px" }}>·</span>;
}

function Datum({
  label,
  value,
  unit,
  color,
  status,
}: {
  label: string;
  value?: string | number;
  unit?: string;
  color: string;
  status?: FetchStatus;
}) {
  const isLoading = status === "fetching";
  const isReady = status === "ready" && value !== undefined;

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span style={{ color: "rgba(232, 235, 243, 0.38)" }}>{label} </span>
      {isLoading ? (
        <span
          style={{
            color,
            opacity: 0.5,
            animation: "intel-inline-pulse 1.5s ease-in-out infinite",
          }}
        >
          ···
        </span>
      ) : isReady ? (
        <span style={{ color, fontWeight: 600 }}>
          {typeof value === "number" ? value.toFixed(2) : value}
          {unit && (
            <span
              style={{
                color: "rgba(232, 235, 243, 0.3)",
                fontWeight: 400,
                marginLeft: 2,
                fontSize: "0.85em",
              }}
            >
              {unit}
            </span>
          )}
        </span>
      ) : (
        <span style={{ color: "rgba(232, 235, 243, 0.18)" }}>—</span>
      )}
    </span>
  );
}

export default function IntelStripInline({ intel }: Props) {
  if (!intel) return null;

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
        fontSize: 13,
        lineHeight: 1.6,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "2px 0",
      }}
    >
      <Datum
        label="Rate"
        value={intel.utilityRate}
        unit="$/kWh"
        color="rgba(251, 191, 36, 0.9)"
        status={intel.utilityStatus}
      />
      <Dot />
      <Datum
        label="Demand"
        value={intel.demandCharge}
        unit="$/kW"
        color="rgba(52, 211, 153, 0.9)"
        status={intel.utilityStatus}
      />
      <Dot />
      <Datum
        label="Sun"
        value={intel.peakSunHours}
        unit="hrs"
        color="rgba(245, 158, 11, 0.9)"
        status={intel.solarStatus}
      />
      {intel.solarGrade && (
        <>
          <Dot />
          <Datum
            label="Grade"
            value={intel.solarGrade}
            color="rgba(167, 139, 250, 0.9)"
            status={intel.solarStatus}
          />
        </>
      )}
      {intel.weatherProfile && (
        <>
          <Dot />
          <Datum
            label=""
            value={intel.weatherProfile}
            color="rgba(56, 189, 248, 0.85)"
            status={intel.weatherStatus}
          />
        </>
      )}
      {intel.utilityProvider && intel.utilityStatus === "ready" && (
        <>
          <Dot />
          <span style={{ color: "rgba(232, 235, 243, 0.25)", fontSize: 12 }}>
            {intel.utilityProvider}
          </span>
        </>
      )}

      <style>{`
        @keyframes intel-inline-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
