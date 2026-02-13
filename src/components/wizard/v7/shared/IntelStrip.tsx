/**
 * IntelStrip.tsx
 * 
 * Progressive hydration display for location intelligence.
 * Shows utility rate, demand charge, solar potential, weather - each with own status.
 * Appears immediately when user starts typing ZIP.
 *
 * Feb 6, 2026 — Redesigned with vivid accent colors, glowing icon badges, visual pop.
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

/* ── Accent themes per chip category ─────────────── */
type AccentTheme = {
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  text: string;
  bg: string;
  readyBg: string;
  readyBorder: string;
};

const ACCENTS: Record<string, AccentTheme> = {
  utility: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.10) 100%)",
    glow: "none",
    text: "rgba(251, 191, 36, 0.95)",
    bg: "rgba(251, 191, 36, 0.06)",
    readyBg: "rgba(251, 191, 36, 0.08)",
    readyBorder: "rgba(251, 191, 36, 0.20)",
  },
  demand: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.10) 100%)",
    glow: "none",
    text: "rgba(52, 211, 153, 0.95)",
    bg: "rgba(52, 211, 153, 0.06)",
    readyBg: "rgba(52, 211, 153, 0.08)",
    readyBorder: "rgba(52, 211, 153, 0.20)",
  },
  solar: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(234, 88, 12, 0.10) 100%)",
    glow: "none",
    text: "rgba(245, 158, 11, 0.95)",
    bg: "rgba(245, 158, 11, 0.06)",
    readyBg: "rgba(245, 158, 11, 0.08)",
    readyBorder: "rgba(245, 158, 11, 0.20)",
  },
  solarGrade: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(139, 92, 246, 0.10) 100%)",
    glow: "none",
    text: "rgba(167, 139, 250, 0.95)",
    bg: "rgba(167, 139, 250, 0.06)",
    readyBg: "rgba(167, 139, 250, 0.08)",
    readyBorder: "rgba(167, 139, 250, 0.20)",
  },
  weather: {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 110-14 5 5 0 019.5 3H18a3 3 0 010 6h-.5" />
        <path d="M22 10a3 3 0 00-3-3h-1" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.10) 100%)",
    glow: "none",
    text: "rgba(56, 189, 248, 0.95)",
    bg: "rgba(56, 189, 248, 0.06)",
    readyBg: "rgba(56, 189, 248, 0.08)",
    readyBorder: "rgba(56, 189, 248, 0.20)",
  },
};

/* ── Chip Component ──────────────────────────────── */

interface ChipProps {
  label: string;
  value?: string | number;
  unit?: string;
  status?: FetchStatus;
  error?: string;
  accent: AccentTheme;
}

function IntelChip({ label, value, unit, status, error, accent }: ChipProps) {
  const isLoading = status === "fetching";
  const isError = status === "error";
  const isReady = status === "ready" && value !== undefined;

  let chipBg = "rgba(28, 32, 58, 0.65)";
  let chipBorder = "1px solid rgba(255, 255, 255, 0.05)";
  let chipShadow = "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)";

  if (isError) {
    chipBg = "rgba(239, 68, 68, 0.08)";
    chipBorder = "1px solid rgba(239, 68, 68, 0.20)";
    chipShadow = "0 2px 8px rgba(239, 68, 68, 0.12)";
  } else if (isLoading) {
    chipBg = accent.bg;
    chipBorder = `1px solid ${accent.readyBorder}`;
    chipShadow = `0 2px 12px rgba(0, 0, 0, 0.15)`;
  } else if (isReady) {
    chipBg = accent.readyBg;
    chipBorder = `1px solid ${accent.readyBorder}`;
    chipShadow = `0 4px 16px rgba(0, 0, 0, 0.15), ${accent.glow}`;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 14,
        background: chipBg,
        border: chipBorder,
        boxShadow: chipShadow,
        minWidth: 120,
        flex: "1 1 120px",
        transition: "all 0.35s ease",
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: accent.gradient,
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "box-shadow 0.35s ease",
        }}
      >
        {accent.icon}
      </div>

      {/* Label + Value */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "rgba(232, 235, 243, 0.45)",
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: isReady ? accent.text : "rgba(232, 235, 243, 0.9)",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 1.2,
          }}
        >
          {isLoading ? (
            <span
              style={{
                color: accent.text,
                opacity: 0.7,
                animation: "merlin-intel-pulse 1.5s ease-in-out infinite",
              }}
            >
              ···
            </span>
          ) : isError ? (
            <span style={{ color: "rgba(239, 68, 68, 0.85)", fontSize: 12, fontWeight: 600 }} title={error}>
              unavailable
            </span>
          ) : isReady ? (
            <>
              {typeof value === "number" ? value.toFixed(2) : value}
              {unit && (
                <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 3, fontWeight: 600 }}>{unit}</span>
              )}
            </>
          ) : (
            <span style={{ color: "rgba(232, 235, 243, 0.2)" }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── IntelStrip Container ────────────────────────── */

export default function IntelStrip({ intel, compact = false }: IntelStripProps) {
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
        padding: compact ? 14 : 18,
        borderRadius: 16,
        background: "rgba(16, 20, 36, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.04)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
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
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ fontSize: 14 }}>◎</span>
          Location Intelligence
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.5px",
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(74, 222, 128, 0.12)",
            color: "rgba(74, 222, 128, 0.9)",
            textTransform: "uppercase",
          }}
        >
          Live
        </div>
      </div>

      {/* Chips Grid */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <IntelChip
          label="Utility Rate"
          value={intel.utilityRate}
          unit="$/kWh"
          status={intel.utilityStatus}
          error={intel.utilityError}
          accent={ACCENTS.utility}
        />
        <IntelChip
          label="Demand Charge"
          value={intel.demandCharge}
          unit="$/kW"
          status={intel.utilityStatus}
          error={intel.utilityError}
          accent={ACCENTS.demand}
        />
        <IntelChip
          label="Peak Sun"
          value={intel.peakSunHours}
          unit="hrs"
          status={intel.solarStatus}
          error={intel.solarError}
          accent={ACCENTS.solar}
        />
        <IntelChip
          label="Solar Grade"
          value={intel.solarGrade}
          status={intel.solarStatus}
          error={intel.solarError}
          accent={ACCENTS.solarGrade}
        />
        <IntelChip
          label="Weather"
          value={intel.weatherProfile}
          status={intel.weatherStatus}
          error={intel.weatherError}
          accent={ACCENTS.weather}
        />
      </div>

      {/* Provider attribution */}
      {intel.utilityProvider && intel.utilityStatus === "ready" && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "rgba(232, 235, 243, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ opacity: 0.6 }}>⚡</span> Provider: {intel.utilityProvider}
        </div>
      )}

      {/* Pulse animation for loading state */}
      <style>{`
        @keyframes merlin-intel-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
