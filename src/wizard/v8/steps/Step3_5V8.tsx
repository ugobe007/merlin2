/**
 * WIZARD V8 — STEP 3.5: ADD-ON CONFIGURATION (v2 Design)
 * ============================================================================
 * Solar recommendation is derived from the user's roof area (step 3).
 * Generator recommendation is driven by grid reliability (step 1).
 * EV Charging uses 3 specific packages with annual revenue estimates.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import type { WizardState, WizardActions, WizardStep } from "../wizardState";
import {
  estimateSolarKW,
  estimateGenKW,
  getEffectiveSolarCapKW,
  defaultGeneratorScope,
} from "../addonSizing";
import {
  getFacilityConstraints,
  getCarWashSolarCapacity,
  computeSolarWattsPerSqft,
} from "@/services/useCasePowerCalculations";
import { getLastSelectedPanelSync } from "@/services/solarPanelSelectionService";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

function fmtKW(kw: number): string {
  return kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${kw} kW`;
}
function fmtAbsK(dollars: number): string {
  const k = Math.round(Math.abs(dollars) / 1000);
  return k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}K`;
}

type FuelType = "diesel" | "natural-gas" | "dual-fuel";

// ── Stepper Button ────────────────────────────────────────────────────────────
function StepperBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        border: "1.5px solid rgba(255,255,255,0.14)",
        color: "rgba(255,255,255,0.85)",
        fontSize: 20,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Addon Slider (Solar / Generator) ─────────────────────────────────────────
function AddonSlider({
  value,
  min,
  max,
  color,
  onChange,
  isAtRec = false,
}: {
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
  isAtRec?: boolean;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div
      style={{
        position: "relative",
        height: 44,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.08)",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          height: 5,
          width: `${pct}%`,
          borderRadius: 3,
          background: color,
          transition: "width 0.06s",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${pct}% - 10px)`,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: color,
          boxShadow: isAtRec
            ? `0 0 0 3px ${color}55, 0 0 18px ${color}cc, 0 0 4px ${color}55`
            : `0 0 12px ${color}99, 0 0 4px ${color}55`,
          transition: "left 0.06s",
          pointerEvents: "none",
          zIndex: 1,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 900,
          color: "#0D1117",
        }}
      >
        {isAtRec && "✓"}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          margin: 0,
          zIndex: 2,
          WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

// ── EV Slider Row — kept for potential future use ─────────────────────────────
function _EVSliderRow({
  label,
  value,
  max,
  color,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 15, color: "rgba(203,213,225,0.85)" }}>{label}</span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#f1f5f9",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 44,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.07)",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            height: 5,
            width: `${pct}%`,
            borderRadius: 3,
            background: color,
            transition: "width 0.06s",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 9px)`,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 10px ${color}99`,
            transition: "left 0.06s",
            pointerEvents: "none",
            zIndex: 1,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
            zIndex: 2,
            WebkitAppearance: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Confirm Button ────────────────────────────────────────────────────────────
function ConfirmBtn({
  confirmed,
  needsConfirm = false,
  label,
  confirmedLabel,
  onClick,
}: {
  confirmed: boolean;
  needsConfirm?: boolean;
  label: string;
  confirmedLabel: string;
  onClick: () => void;
}) {
  // Inject @keyframes once into <head> so the animation name is available for inline style
  useEffect(() => {
    const id = "merlin-confirm-pulse-style";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        @keyframes confirmGlow {
          0%, 100% {
            box-shadow: none;
            border-color: rgba(52,211,153,0.55);
            color: rgba(52,211,153,0.7);
            text-shadow: none;
          }
          50% {
            box-shadow: 0 0 0 2px rgba(52,211,153,0.25), 0 0 18px 4px rgba(52,211,153,0.35);
            border-color: rgba(52,211,153,1.0);
            color: #34d399;
            text-shadow: 0 0 8px rgba(52,211,153,0.6);
          }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  if (confirmed) {
    // Compact success badge — not a big CTA, just a status indicator
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "9px 14px",
          borderRadius: 8,
          background: "rgba(62,207,142,0.10)",
          border: "2px solid #3ECF8E",
          boxShadow: "0 0 0 3px rgba(62,207,142,0.12), 0 0 14px rgba(62,207,142,0.28)",
          fontSize: 13,
          fontWeight: 700,
          color: "#3ECF8E",
          letterSpacing: "0.04em",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#3ECF8E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 900,
            color: "#0D1117",
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        {confirmedLabel}
        <button
          onClick={onClick}
          style={{
            marginLeft: 6,
            padding: "2px 8px",
            borderRadius: 5,
            border: "1px solid rgba(62,207,142,0.3)",
            background: "transparent",
            color: "rgba(62,207,142,0.6)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: needsConfirm ? "14px 16px" : "11px 16px",
        borderRadius: 10,
        border: needsConfirm ? "2px solid #3ECF8E" : "1.5px solid rgba(52,211,153,0.3)",
        background: needsConfirm ? "#3ECF8E" : "transparent",
        cursor: "pointer",
        fontSize: needsConfirm ? 14 : 13,
        fontWeight: 800,
        letterSpacing: "0.07em",
        textTransform: "uppercase" as const,
        color: needsConfirm ? "#0D1117" : "#34d399",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
        boxShadow: needsConfirm
          ? "0 0 0 3px rgba(52,211,153,0.25), 0 2px 12px rgba(52,211,153,0.35)"
          : "none",
        animation: "none",
        position: "relative" as const,
      }}
      onMouseEnter={(e) => {
        if (needsConfirm) {
          (e.currentTarget as HTMLButtonElement).style.background = "#34d399";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 4px rgba(52,211,153,0.3), 0 4px 16px rgba(52,211,153,0.45)";
        } else {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,211,153,1.0)";
          (e.currentTarget as HTMLButtonElement).style.color = "#34d399";
        }
      }}
      onMouseLeave={(e) => {
        if (needsConfirm) {
          (e.currentTarget as HTMLButtonElement).style.background = "#3ECF8E";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 3px rgba(52,211,153,0.25), 0 2px 12px rgba(52,211,153,0.35)";
        } else {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(52,211,153,0.3)";
          (e.currentTarget as HTMLButtonElement).style.color = "#34d399";
        }
      }}
    >
      {needsConfirm ? `✓ ${label}` : label}
    </button>
  );
}

// ── Summary Pill ──────────────────────────────────────────────────────────────
function SummaryPill({
  icon,
  label,
  value,
  savingsK,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  savingsK: number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "9px 10px",
        borderRadius: 8,
        background: `${color}0d`,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          marginBottom: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#f1f5f9",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {savingsK > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "#3ECF8E",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          -{fmtAbsK(savingsK * 1000)}
        </div>
      )}
    </div>
  );
}

// ── Config Summary Bar ────────────────────────────────────────────────────────
function ConfigSummaryBar({
  city,
  industry,
  peakLoadKW,
  totalInvestmentK,
  solarKW,
  solarSavingsK,
  genKW,
  genSavingsK,
  evPorts,
  evRevenueK,
  solarFeasible,
  annualSavingsK,
  paybackYears,
  roi10YrK,
}: {
  city: string;
  industry: string;
  peakLoadKW: number;
  totalInvestmentK: number;
  solarKW: number;
  solarSavingsK: number;
  genKW: number;
  genSavingsK: number;
  evPorts: number;
  evRevenueK: number;
  solarFeasible: boolean;
  annualSavingsK: number;
  paybackYears: string;
  roi10YrK: number;
}) {
  return (
    <div
      style={{
        background: "rgba(15,17,23,0.85)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(62,207,142,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🧙
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Your Configuration</div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.55)",
                marginTop: 2,
              }}
            >
              {city}
              {industry ? ` • ${industry}` : ""}
              {peakLoadKW > 0 ? ` • ${peakLoadKW.toLocaleString()} kW peak` : ""}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(148,163,184,0.5)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            Add-ons Investment
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${totalInvestmentK.toLocaleString()}K
          </div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,0.4)", marginTop: 2 }}>
            BESS system cost added at quote
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {solarFeasible && solarKW > 0 && (
          <SummaryPill
            icon="⭐"
            label="Solar"
            value={`${Math.round(solarKW).toLocaleString()} kW`}
            savingsK={solarSavingsK}
            color="#fbbf24"
          />
        )}
        {genKW > 0 && (
          <SummaryPill
            icon="🔥"
            label="Generator"
            value={`${Math.round(genKW).toLocaleString()} kW`}
            savingsK={genSavingsK}
            color="#fb923c"
          />
        )}
        {evPorts > 0 && (
          <SummaryPill
            icon="⚡"
            label="EV Charging"
            value={`${evPorts} port${evPorts !== 1 ? "s" : ""}`}
            savingsK={evRevenueK}
            color="#38bdf8"
          />
        )}
      </div>

      {/* ── Live ROI Strip ── */}
      {annualSavingsK > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 9,
            background: "rgba(62,207,142,0.07)",
            border: "1px solid rgba(62,207,142,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          <div style={{ fontSize: 14, marginRight: 8, flexShrink: 0 }}>🧙</div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#3ECF8E",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginRight: 10,
              flexShrink: 0,
            }}
          >
            Merlin ROI
          </div>
          <div style={{ display: "flex", gap: 14, flex: 1, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Annual Savings
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#3ECF8E",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                }}
              >
                ${annualSavingsK.toLocaleString()}K/yr
              </span>
            </div>
            <div
              style={{
                width: 1,
                background: "rgba(255,255,255,0.07)",
                alignSelf: "stretch",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Payback
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                }}
              >
                {paybackYears} yrs
              </span>
            </div>
            <div
              style={{
                width: 1,
                background: "rgba(255,255,255,0.07)",
                alignSelf: "stretch",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(148,163,184,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                10-yr Value
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: roi10YrK > 0 ? "#3ECF8E" : "#f87171",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                }}
              >
                {roi10YrK >= 0 ? "+" : ""}${Math.abs(roi10YrK).toLocaleString()}K
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Shell ────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: "rgba(15,17,23,0.7)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function CardDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.05)",
        margin: "0 16px",
      }}
    />
  );
}

// ── Solar PV Array Card ───────────────────────────────────────────────────────
function SolarCard({
  maxKW,
  recKW,
  initialKW,
  peakSunHours,
  utilityRate,
  peakLoadKW,
  solarGrade,
  onConfig,
  canopyPotentialKW = 0,
  canopyInterest,
  onCanopyChange,
  isCarWash = false,
  roofOnlyKW = 0,
  withCanopyKW = 0,
  pendingExternalKW,
  onPendingConsumed,
  onCarportToggle,
}: {
  maxKW: number;
  recKW: number;
  initialKW: number;
  peakSunHours: number;
  utilityRate: number;
  peakLoadKW: number;
  solarGrade?: string | null;
  onConfig: (kw: number) => void;
  canopyPotentialKW?: number;
  canopyInterest?: string;
  onCanopyChange?: (value: string) => void;
  isCarWash?: boolean;
  roofOnlyKW?: number;
  withCanopyKW?: number;
  pendingExternalKW?: number | null;
  onPendingConsumed?: () => void;
  /** Parent-computed: fires BEFORE onCanopyChange, updates both solar kW and slider */
  onCarportToggle?: (nextVal: string, targetKW: number) => void;
}) {
  const safeMax = maxKW > 0 ? maxKW : 2000;
  // solarMin must always be < safeMax; 10% of max, floored at 1 kW
  const solarMin = Math.max(1, Math.min(Math.round(safeMax * 0.1), safeMax - 1));
  const stepKW = safeMax <= 100 ? 5 : safeMax <= 500 ? 25 : safeMax <= 2000 ? 50 : 100;
  const safeRec = recKW > 0 ? recKW : Math.round(safeMax * 0.8);
  const [sliderKW, setSliderKW] = useState(() =>
    Math.max(solarMin, Math.min(safeMax, initialKW > 0 ? initialKW : safeRec))
  );
  const [confirmed, setConfirmed] = useState(false);
  // When canopy interest changes → recKW & maxKW update → snap slider to new rec.
  useEffect(() => {
    if (!confirmed && recKW > 0) {
      const clamped = Math.max(solarMin, Math.min(safeMax, recKW));
      setSliderKW(clamped);
      onConfig(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recKW, safeMax]);

  // External force-update from banner actions ("Add solar carport →", "Apply X kW →").
  // Fires even when recKW/safeMax haven't changed (e.g. canopyInterest already 'yes').
  // NOTE: Do NOT clamp to safeMax here — safeMax is stale (old cap) on the same render as the
  // carport toggle. The parent already bounds targetKW to the post-toggle cap. Floor at solarMin only.
  useEffect(() => {
    if (pendingExternalKW == null) return;
    const clamped = Math.max(solarMin, pendingExternalKW);
    setSliderKW(clamped);
    setConfirmed(false);
    onPendingConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingExternalKW]);

  const pct = peakLoadKW > 0 ? Math.min(100, Math.round((sliderKW / peakLoadKW) * 100)) : null;
  // NREL methodology: kW × PSH × 365 × PR(0.77) × rate — matches pricingServiceV45
  const savingsK = Math.round((sliderKW * peakSunHours * 365 * 0.77 * utilityRate) / 1000);
  const isOptimal = safeRec > 0 && Math.abs(sliderKW - safeRec) / safeRec < 0.12;
  const recPct = safeMax > solarMin ? ((safeRec - solarMin) / (safeMax - solarMin)) * 100 : 50;

  const handleChange = (v: number) => {
    const c = Math.max(solarMin, Math.min(safeMax, v));
    setSliderKW(c);
    setConfirmed(false);
    onConfig(c);
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "rgba(251,191,36,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            flexShrink: 0,
          }}
        >
          ☀️
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Solar PV Array</div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(148,163,184,0.6)",
              marginTop: 2,
            }}
          >
            {peakLoadKW > 0 ? `${peakLoadKW.toLocaleString()} kW peak` : ""}
            {peakLoadKW > 0 && safeMax > 0 ? " • " : ""}
            {safeMax > 0 ? `Max: ${safeMax.toLocaleString()} kW` : ""}
            {solarGrade ? ` • ${solarGrade}` : ""}
          </div>
        </div>
        {isOptimal && (
          <div
            style={{
              padding: "3px 9px",
              borderRadius: 5,
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              fontSize: 10,
              fontWeight: 800,
              color: "#3ECF8E",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            OPTIMAL
          </div>
        )}
      </div>
      <CardDivider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 14px",
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 15,
            color: "rgba(203,213,225,0.8)",
            fontWeight: 600,
          }}
        >
          Solar Capacity
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StepperBtn onClick={() => handleChange(sliderKW - stepKW)}>−</StepperBtn>
          <div style={{ textAlign: "center", minWidth: 110 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.3px",
                }}
              >
                {sliderKW.toLocaleString()} kW
              </span>
              {confirmed && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#3ECF8E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#0D1117",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 3,
                flexWrap: "wrap",
              }}
            >
              {pct !== null && (
                <span style={{ fontSize: 13, color: "rgba(148,163,184,0.6)" }}>{pct}%</span>
              )}
              {savingsK > 0 && (
                <span style={{ fontSize: 13, color: "#3ECF8E", fontWeight: 600 }}>
                  +${savingsK}K
                </span>
              )}
            </div>
          </div>
          <StepperBtn onClick={() => handleChange(sliderKW + stepKW)}>+</StepperBtn>
        </div>
      </div>
      <div style={{ padding: "0 16px 18px" }}>
        <AddonSlider
          value={sliderKW}
          min={solarMin}
          max={safeMax}
          color="#fbbf24"
          onChange={handleChange}
          isAtRec={isOptimal}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(148,163,184,0.45)" }}>{fmtKW(solarMin)}</span>
          <span style={{ fontSize: 11, color: "rgba(148,163,184,0.45)" }}>{fmtKW(safeMax)}</span>
        </div>
        {safeRec > 0 && safeRec >= solarMin && safeRec <= safeMax && (
          <div style={{ position: "relative", height: 22, marginTop: 4 }}>
            <div
              style={{
                position: "absolute",
                left: `${Math.max(8, Math.min(92, recPct))}%`,
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 20,
                background: "rgba(251,191,36,0.13)",
                border: "1px solid rgba(251,191,36,0.28)",
                fontSize: 11,
                fontWeight: 600,
                color: "#fbbf24",
                whiteSpace: "nowrap",
              }}
            >
              🧙 rec: {safeRec.toLocaleString()} kW
            </div>
          </div>
        )}
      </div>

      {/* ── Carport / Canopy Toggle ── */}
      {canopyPotentialKW > 0 && onCanopyChange && (
        <>
          <style>{`
            @keyframes carportGlow {
              0%,100% {
                box-shadow: none;
                border-color: rgba(251,191,36,0.5);
              }
              50% {
                box-shadow: 0 0 0 3px rgba(251,191,36,0.22), 0 0 16px 3px rgba(251,191,36,0.15);
                border-color: rgba(251,191,36,0.95);
              }
            }
          `}</style>
          <div
            style={{
              padding: "12px 16px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(148,163,184,0.85)",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                marginBottom: 8,
              }}
            >
              {isCarWash ? "☀️ Solar Coverage" : "☀️ Solar Coverage"}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {/* ── Rooftop — always included, active-confirmed badge ── */}
              <div
                style={{
                  flex: 1,
                  padding: "12px 6px 10px",
                  borderRadius: 10,
                  border: "2px solid rgba(52,211,153,0.75)",
                  background: "transparent",
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                <div style={{ fontSize: 22, lineHeight: 1 }}>🏠</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(52,211,153,0.95)",
                    marginTop: 5,
                    lineHeight: 1.2,
                  }}
                >
                  Rooftop
                </div>
                {/* Show the slider's current value (what gets quoted), not the roof capacity cap */}
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#fff",
                    marginTop: 3,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {canopyInterest === "yes"
                    ? roofOnlyKW > 0
                      ? `${roofOnlyKW.toLocaleString()} kW`
                      : "—"
                    : sliderKW > 0
                      ? `${sliderKW.toLocaleString()} kW`
                      : "—"}
                </div>
                {/* When no carport: show roof max as subtext so user knows the ceiling */}
                {canopyInterest !== "yes" && roofOnlyKW > 0 && sliderKW < roofOnlyKW && (
                  <div style={{ fontSize: 10, color: "rgba(52,211,153,0.5)", marginTop: 1 }}>
                    of {roofOnlyKW.toLocaleString()} kW max
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: "#34d399",
                    fontWeight: 700,
                    marginTop: 4,
                    background: "transparent",
                    border: "1px solid rgba(52,211,153,0.5)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    display: "inline-block",
                  }}
                >
                  ✓ Included
                </div>
              </div>

              {/* ── Carport — optional add-on toggle ── */}
              {(() => {
                const carportActive = canopyInterest === "yes";
                const additiveKW = withCanopyKW - roofOnlyKW;
                return (
                  <button
                    onClick={() => {
                      const nextVal = carportActive ? "no" : "yes";
                      if (onCarportToggle) {
                        onCarportToggle(nextVal, 0);
                      } else {
                        onCanopyChange?.(nextVal);
                      }
                      setConfirmed(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "12px 6px 10px",
                      borderRadius: 10,
                      border: carportActive
                        ? "2px solid rgba(251,191,36,1.0)"
                        : "2px solid rgba(251,191,36,0.55)",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      animation: carportActive ? "none" : "carportGlow 1.8s ease-in-out infinite",
                      boxShadow: carportActive
                        ? "0 0 0 3px rgba(251,191,36,0.18), 0 0 12px 2px rgba(251,191,36,0.1)"
                        : undefined,
                    }}
                  >
                    <div style={{ fontSize: 22, lineHeight: 1 }}>🏗️</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: carportActive ? "#fbbf24" : "rgba(251,191,36,0.95)",
                        marginTop: 5,
                        lineHeight: 1.2,
                      }}
                    >
                      {carportActive
                        ? `✓ ${isCarWash ? "Carport" : "Canopy"} Added`
                        : `+ Add ${isCarWash ? "Carport" : "Canopy"}`}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: carportActive ? "#fbbf24" : "#fbbf24",
                        marginTop: 3,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {additiveKW > 0 ? `+${additiveKW.toLocaleString()} kW` : "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        marginTop: 4,
                        background: "transparent",
                        border: `1px solid ${carportActive ? "rgba(251,191,36,0.6)" : "rgba(251,191,36,0.4)"}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        display: "inline-block",
                        color: carportActive ? "#fbbf24" : "rgba(251,191,36,0.8)",
                      }}
                    >
                      {carportActive ? `${withCanopyKW.toLocaleString()} kW total` : "Tap to add →"}
                    </div>
                  </button>
                );
              })()}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "rgba(148,163,184,0.5)",
                marginTop: 7,
                lineHeight: 1.5,
              }}
            >
              {canopyInterest === "yes"
                ? (() => {
                    const roofPortion = Math.min(sliderKW, roofOnlyKW);
                    const canopyPortion = Math.max(0, sliderKW - roofOnlyKW);
                    return canopyPortion > 0
                      ? `${roofPortion.toLocaleString()} kW rooftop + ${canopyPortion.toLocaleString()} kW ${isCarWash ? "carport canopy" : "parking canopy"} = ${sliderKW.toLocaleString()} kW configured. Tap carport to remove it.`
                      : `${roofPortion.toLocaleString()} kW rooftop (carport not yet needed at this size). Tap carport to remove it.`;
                  })()
                : `Rooftop solar is always included. Tap "+ Add ${isCarWash ? "Carport" : "Canopy"}" to also cover your ${isCarWash ? "vacuum station canopies" : "parking area"} for +${(withCanopyKW - roofOnlyKW).toLocaleString()} kW more capacity.`}
            </div>
          </div>
        </>
      )}

      <div style={{ padding: "0 16px 14px" }}>
        <ConfirmBtn
          confirmed={confirmed}
          needsConfirm={!confirmed}
          label="Confirm Solar Capacity"
          confirmedLabel={`${sliderKW.toLocaleString()} kW confirmed`}
          onClick={() => {
            onConfig(sliderKW);
            setConfirmed(true);
          }}
        />
      </div>

      <div
        style={{
          padding: "10px 16px 12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <div
            style={{
              fontSize: 16,
              color: "rgba(203,213,225,0.9)",
              lineHeight: 1.65,
            }}
          >
            <span style={{ fontSize: 18 }}>🧙 </span>
            <strong style={{ color: "#fbbf24", fontWeight: 700 }}>
              Merlin: {safeRec.toLocaleString()} kW recommended
            </strong>{" "}
            based on{" "}
            {canopyInterest === "yes"
              ? `roof + ${isCarWash ? "carport" : "canopy"} (${safeMax.toLocaleString()} kW total)`
              : safeMax > 0
                ? `${safeMax.toLocaleString()} kW roof space`
                : "available roof area"}
            {peakLoadKW > 0 ? ` and ${peakLoadKW.toLocaleString()} kW peak load` : ""}.
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Panel Assessment Modal ────────────────────────────────────────────────────
type ServiceType = "single-phase-208" | "three-phase-208" | "three-phase-480" | "unknown";
type UpgradeType =
  | "none"
  | "circuit_breakers"
  | "service_upgrade"
  | "transformer"
  | "standalone_panel";

interface PanelAssessment {
  upgradeType: UpgradeType;
  upgradeCost: number;
  canHandle: boolean;
  headline: string;
  detail: string;
}

function assessElectricalPanel(
  dcfcCount: number,
  serviceType: ServiceType,
  panelAmps: number
): PanelAssessment {
  // NEC 125% continuous load rule at 480V 3-phase
  // Each 50 kW DCFC draws 50,000 / (480 × 1.732) × 1.25 ≈ 75.4 A
  const ampsPerDCFC = Math.ceil((50000 / (480 * 1.732)) * 1.25);
  const totalDCFCAmps = dcfcCount * ampsPerDCFC;

  if (serviceType === "single-phase-208" || serviceType === "unknown") {
    // Needs a brand-new 3-phase service entry — biggest upgrade
    const cost = 25000 + dcfcCount * 4000;
    return {
      upgradeType: "standalone_panel",
      upgradeCost: cost,
      canHandle: false,
      headline: "New 3-phase service required",
      detail: `DC Fast Chargers require 480V 3-phase power. Your current single-phase service cannot support DCFC. A dedicated standalone 3-phase service panel is needed (~$${(cost / 1000).toFixed(0)}K). Alternatively, L2 chargers work on your existing single-phase 208/240V service.`,
    };
  }

  if (serviceType === "three-phase-208") {
    // Has 3-phase but wrong voltage — needs transformer to step up to 480V
    const cost = 18000 + dcfcCount * 3000;
    return {
      upgradeType: "transformer",
      upgradeCost: cost,
      canHandle: false,
      headline: "Transformer needed (208V → 480V)",
      detail: `You have 3-phase power but at 208V. DCFC needs 480V 3-phase. A step-up transformer is required (~$${(cost / 1000).toFixed(0)}K). OR: DCFC units can be connected to a new standalone 480V service from the utility.`,
    };
  }

  // three-phase-480V: check if existing panel has capacity
  if (serviceType === "three-phase-480") {
    const knownAmps = panelAmps > 0 ? panelAmps : 400; // conservative default if unknown
    const availableAmps = Math.floor(knownAmps * 0.8); // 80% rule for available capacity

    if (totalDCFCAmps <= availableAmps) {
      // Panel can handle it — just needs DCFC circuit breakers
      const cost = dcfcCount * 1200; // $1,200/DCFC for breaker + termination
      return {
        upgradeType: "circuit_breakers",
        upgradeCost: cost,
        canHandle: true,
        headline: "✓ Panel can handle DCFC",
        detail: `Your ${panelAmps > 0 ? panelAmps + "A" : "existing"} 480V 3-phase panel has sufficient capacity for ${dcfcCount} DCFC charger${dcfcCount > 1 ? "s" : ""} (${totalDCFCAmps}A required, ${availableAmps}A available). Dedicated breaker(s) and termination needed (~$${(cost / 1000).toFixed(0)}K).`,
      };
    } else if (totalDCFCAmps <= availableAmps * 1.5) {
      // Panel is tight — service upgrade recommended
      const cost = 12000 + dcfcCount * 2000;
      return {
        upgradeType: "service_upgrade",
        upgradeCost: cost,
        canHandle: false,
        headline: "Panel upgrade recommended",
        detail: `Your panel needs ${totalDCFCAmps}A for DCFC but only ~${availableAmps}A is available. A service upgrade (larger main breaker + new sub-panel) is recommended (~$${(cost / 1000).toFixed(0)}K). Alternatively, add a separate standalone 480V DCFC panel.`,
      };
    } else {
      // Panel is maxed — standalone 3-phase panel for DCFC
      const cost = 20000 + dcfcCount * 4000;
      return {
        upgradeType: "standalone_panel",
        upgradeCost: cost,
        canHandle: false,
        headline: "Standalone DCFC panel needed",
        detail: `Your current panel is at capacity (${totalDCFCAmps}A needed, only ${availableAmps}A available). Best path: add a new dedicated 480V 3-phase panel fed directly from the utility transformer for DCFC (~$${(cost / 1000).toFixed(0)}K). This is the most scalable solution.`,
      };
    }
  }

  return {
    upgradeType: "none",
    upgradeCost: 0,
    canHandle: true,
    headline: "Assessment pending",
    detail: "",
  };
}

function PanelAssessmentModal({
  dcfcCount,
  onDone,
  onCancel,
}: {
  dcfcCount: number;
  onDone: (serviceType: ServiceType, panelAmps: number, assessment: PanelAssessment) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"service" | "amps" | "result">("service");
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [panelAmps, setPanelAmps] = useState<number>(0);
  const [assessment, setAssessment] = useState<PanelAssessment | null>(null);

  const doAssess = (svc: ServiceType, amps: number) => {
    const result = assessElectricalPanel(dcfcCount, svc, amps);
    setAssessment(result);
    setStep("result");
  };

  const SERVICE_OPTIONS: { value: ServiceType; label: string; sub: string; icon: string }[] = [
    {
      value: "single-phase-208",
      label: "Single-phase",
      sub: "120/208V or 120/240V — most small commercial",
      icon: "🔌",
    },
    {
      value: "three-phase-208",
      label: "3-phase 208V",
      sub: "208Y/120V 3-phase — common in urban buildings",
      icon: "⚡",
    },
    {
      value: "three-phase-480",
      label: "3-phase 480V",
      sub: "480Y/277V 3-phase — ideal for DCFC",
      icon: "🏭",
    },
    {
      value: "unknown",
      label: "Not sure",
      sub: "Merlin will assume worst-case for budget accuracy",
      icon: "❓",
    },
  ];

  const AMP_OPTIONS = [200, 400, 600, 800, 1200];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.80)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0f1923",
          border: "1px solid rgba(167,139,250,0.30)",
          borderRadius: 16,
          boxShadow: "0 0 60px rgba(167,139,250,0.20)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                Electrical Panel Check
              </div>
              <div style={{ fontSize: 13, color: "rgba(148,163,184,0.65)", marginTop: 2 }}>
                DCFC requires 480V 3-phase — let's verify your service
              </div>
            </div>
          </div>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {["service", "amps", "result"].map((s) => (
              <div
                key={s}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background:
                    step === s
                      ? "#a78bfa"
                      : (["result"].includes(step) && s === "amps") || step === "result"
                        ? "rgba(167,139,250,0.40)"
                        : "rgba(255,255,255,0.10)",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {step === "service" && (
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(203,213,225,0.9)",
                  marginBottom: 14,
                }}
              >
                What electrical service does your facility have?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SERVICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setServiceType(opt.value);
                      setStep("amps");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(167,139,250,0.20)",
                      background: "rgba(167,139,250,0.06)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.55)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.12)";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.20)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.06)";
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(148,163,184,0.60)", marginTop: 2 }}>
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "amps" && serviceType && (
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(203,213,225,0.9)",
                  marginBottom: 6,
                }}
              >
                What is your main panel amperage rating?
              </div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.50)", marginBottom: 14 }}>
                Found on the main breaker label or utility meter paperwork.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {AMP_OPTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setPanelAmps(a);
                      doAssess(serviceType, a);
                    }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "1px solid rgba(167,139,250,0.25)",
                      background: "rgba(167,139,250,0.07)",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#e2e8f0",
                    }}
                  >
                    {a}A
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPanelAmps(0);
                    doAssess(serviceType, 0);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid rgba(148,163,184,0.20)",
                    background: "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(148,163,184,0.70)",
                  }}
                >
                  Not sure
                </button>
              </div>
              <button
                onClick={() => setStep("service")}
                style={{
                  fontSize: 12,
                  color: "rgba(148,163,184,0.50)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Back
              </button>
            </div>
          )}

          {step === "result" && assessment && serviceType && (
            <div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  marginBottom: 14,
                  background: assessment.canHandle
                    ? "rgba(52,211,153,0.08)"
                    : "rgba(251,191,36,0.08)",
                  border: `1px solid ${assessment.canHandle ? "rgba(52,211,153,0.30)" : "rgba(251,191,36,0.30)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: assessment.canHandle ? "#34d399" : "#fbbf24",
                    marginBottom: 6,
                  }}
                >
                  {assessment.headline}
                </div>
                <div style={{ fontSize: 13, color: "rgba(203,213,225,0.80)", lineHeight: 1.6 }}>
                  {assessment.detail}
                </div>
              </div>

              {assessment.upgradeCost > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(148,163,184,0.75)" }}>
                    Electrical upgrade est.
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>
                    +${Math.round(assessment.upgradeCost / 1000)}K
                  </span>
                </div>
              )}

              {!assessment.canHandle && assessment.upgradeType === "standalone_panel" && (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(148,163,184,0.55)",
                    lineHeight: 1.5,
                    marginBottom: 14,
                    padding: "0 2px",
                  }}
                >
                  💡{" "}
                  <strong style={{ color: "rgba(203,213,225,0.7)" }}>
                    Standalone panel advantage:
                  </strong>{" "}
                  A separate 3-phase panel for DCFC keeps it independent from your facility's main
                  electrical system, making it easier to scale EV charging later without touching
                  your main service.
                </div>
              )}

              <button
                onClick={() => onDone(serviceType, panelAmps, assessment)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Got it — add to my quote
              </button>
              <button
                onClick={onCancel}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  color: "rgba(148,163,184,0.50)",
                  fontSize: 13,
                  cursor: "pointer",
                  marginTop: 6,
                }}
              >
                Cancel — keep L2 only
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EV Charging Card ──────────────────────────────────────────────────────────
function EVChargingCard({
  peakLoadKW,
  initialL2,
  initialDcfc,
  initialHpc,
  initialPanelAmps,
  initialServiceType,
  onConfig,
  onPanelAssessed,
}: {
  peakLoadKW: number;
  initialL2: number;
  initialDcfc: number;
  initialHpc: number;
  initialPanelAmps: number;
  initialServiceType: ServiceType;
  onConfig: (l2: number, dcfc: number, hpc: number) => void;
  onPanelAssessed: (svc: ServiceType, amps: number, assessment: PanelAssessment) => void;
}) {
  const recL2 = Math.min(12, Math.max(2, peakLoadKW > 0 ? Math.round(peakLoadKW / 150) : 4));
  const [l2, setL2] = useState(initialL2 > 0 ? initialL2 : recL2);
  const [dcfc, setDcfc] = useState(initialDcfc > 0 ? initialDcfc : 0);
  const [hpc, setHpc] = useState(initialHpc > 0 ? initialHpc : 0);
  const [confirmed, setConfirmed] = useState(false);
  const [showDCFC, setShowDCFC] = useState(true); // Level 3 Fast Charging always visible
  const [showPanel, setShowPanel] = useState(false);
  const [panelAssessed, setPanelAssessed] = useState(
    initialPanelAmps > 0 || initialServiceType !== "unknown"
  );
  const [panelResult, setPanelResult] = useState<PanelAssessment | null>(
    initialPanelAmps > 0 && initialServiceType !== "unknown"
      ? assessElectricalPanel(initialDcfc, initialServiceType, initialPanelAmps)
      : null
  );
  // pending DCFC count when panel modal is triggered
  const [pendingDcfc, setPendingDcfc] = useState(0);

  const totalKW = l2 * 7.2 + dcfc * 50 + hpc * 250;

  const bump = (which: "l2" | "dcfc" | "hpc", dir: 1 | -1, max: number) => {
    setConfirmed(false);
    if (which === "l2") {
      const nv = Math.max(0, Math.min(max, l2 + dir));
      setL2(nv);
      onConfig(nv, dcfc, hpc);
    } else if (which === "dcfc") {
      const nv = Math.max(0, Math.min(max, dcfc + dir));
      if (dir > 0 && dcfc === 0 && !panelAssessed) {
        // First DCFC added — trigger panel check
        setPendingDcfc(nv);
        setShowPanel(true);
      } else {
        setDcfc(nv);
        onConfig(l2, nv, hpc);
      }
    } else {
      const nv = Math.max(0, Math.min(max, hpc + dir));
      setHpc(nv);
      onConfig(l2, dcfc, nv);
    }
  };

  const handlePanelDone = (svc: ServiceType, amps: number, result: PanelAssessment) => {
    setPanelAssessed(true);
    setPanelResult(result);
    setShowPanel(false);
    setDcfc(pendingDcfc);
    onConfig(l2, pendingDcfc, hpc);
    onPanelAssessed(svc, amps, result);
  };

  const handlePanelCancel = () => {
    setShowPanel(false);
    setPendingDcfc(0);
    // Revert DCFC to 0 if cancelled
    setDcfc(0);
    onConfig(l2, 0, hpc);
  };

  // Stepper row helper
  const StepperRow = ({
    label,
    sub,
    color,
    icon,
    value,
    max,
    which,
  }: {
    label: string;
    sub: string;
    color: string;
    icon: string;
    value: number;
    max: number;
    which: "l2" | "dcfc" | "hpc";
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
          marginRight: 12,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{label}</div>
        <div style={{ fontSize: 11, color: "rgba(148,163,184,0.55)", marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <button
          onClick={() => bump(which, -1, max)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "8px 0 0 8px",
            border: `1px solid ${color}40`,
            background: `${color}12`,
            color: value > 0 ? color : "rgba(255,255,255,0.15)",
            fontSize: 18,
            fontWeight: 700,
            cursor: value > 0 ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <div
          style={{
            width: 36,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${color}30`,
            borderLeft: "none",
            borderRight: "none",
            background: `${color}08`,
            fontSize: 16,
            fontWeight: 800,
            color: value > 0 ? "#fff" : "rgba(255,255,255,0.25)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <button
          onClick={() => bump(which, 1, max)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "0 8px 8px 0",
            border: `1px solid ${color}40`,
            background: `${color}12`,
            color,
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showPanel && (
        <PanelAssessmentModal
          dcfcCount={pendingDcfc}
          onDone={handlePanelDone}
          onCancel={handlePanelCancel}
        />
      )}
      <Card>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 14px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "rgba(56,189,248,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 21,
              flexShrink: 0,
            }}
          >
            ⚡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>EV Charging</div>
            <div style={{ fontSize: 14, color: "rgba(148,163,184,0.6)", marginTop: 2 }}>
              Employee &amp; customer charging
            </div>
          </div>
          {totalKW > 0 && (
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#38bdf8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Math.round(totalKW)} kW
            </div>
          )}
        </div>

        {/* Merlin recommendation pill */}
        <div
          style={{
            margin: "0 16px 14px",
            padding: "9px 12px",
            borderRadius: 8,
            background: "rgba(56,189,248,0.07)",
            border: "1px solid rgba(56,189,248,0.18)",
            display: "flex",
            gap: 7,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🧙</span>
          <div style={{ fontSize: 13, color: "rgba(203,213,225,0.85)", lineHeight: 1.55 }}>
            <strong style={{ color: "#38bdf8" }}>Merlin recommends {recL2} Level 2</strong> for your
            facility. <strong style={{ color: "#a78bfa" }}>Level 3 Fast Charging</strong> adds
            $18K/yr revenue per charger (480V 3-phase required).
          </div>
        </div>

        {/* L2 section */}
        <StepperRow
          which="l2"
          label="Level 2"
          sub="7–22 kW each · works on existing 240V service"
          color="#22d3ee"
          icon="🔌"
          value={l2}
          max={12}
        />

        {/* DCFC toggle + section */}
        {!showDCFC ? (
          <button
            onClick={() => setShowDCFC(true)}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: "rgba(167,139,250,0.05)",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18, color: "#a78bfa" }}>⚡</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#a78bfa" }}>
                + Add Fast Charging (Level 3 · DCFC)
              </span>
              <span style={{ fontSize: 12, color: "rgba(148,163,184,0.45)", marginLeft: 8 }}>
                $18K/yr revenue per unit
              </span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(167,139,250,0.50)" }}>Tap →</span>
          </button>
        ) : (
          <>
            <StepperRow
              which="dcfc"
              label="Fast Charging (Level 3)"
              sub="50 kW each · DC Fast Charge · 480V 3-phase · $18K/yr revenue"
              color="#a78bfa"
              icon="⚡"
              value={dcfc}
              max={8}
            />
            {/* Panel assessment status */}
            {dcfc > 0 && panelResult && (
              <div
                style={{
                  margin: "0 16px 8px",
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginTop: 8,
                  background: panelResult.canHandle
                    ? "rgba(52,211,153,0.07)"
                    : "rgba(251,191,36,0.07)",
                  border: `1px solid ${panelResult.canHandle ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: panelResult.canHandle ? "#34d399" : "#fbbf24",
                    }}
                  >
                    {panelResult.headline}
                  </div>
                  {panelResult.upgradeCost > 0 && (
                    <div style={{ fontSize: 12, color: "rgba(148,163,184,0.60)", marginTop: 2 }}>
                      Electrical upgrade: +${Math.round(panelResult.upgradeCost / 1000)}K added to
                      quote
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPanel(true)}
                  style={{
                    fontSize: 11,
                    color: "rgba(167,139,250,0.70)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginLeft: 8,
                  }}
                >
                  Re-assess →
                </button>
              </div>
            )}
            {dcfc > 0 && !panelResult && (
              <button
                onClick={() => {
                  setPendingDcfc(dcfc);
                  setShowPanel(true);
                }}
                style={{
                  width: "100%",
                  margin: "8px 0 0",
                  padding: "10px 16px",
                  background: "rgba(251,191,36,0.08)",
                  border: "none",
                  borderTop: "1px solid rgba(251,191,36,0.20)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>
                  Panel check required for Level 3 Fast Charging — tap to assess
                </span>
              </button>
            )}
          </>
        )}

        {/* HPC section (advanced, always collapsed behind accordion) */}
        <details style={{ margin: "8px 16px 8px" }}>
          <summary
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,0.40)",
              cursor: "pointer",
              listStyle: "none",
              padding: "4px 0",
            }}
          >
            ▸ High-Power Charging (HPC 250+ kW) — advanced
          </summary>
          <div style={{ marginTop: 8 }}>
            <StepperRow
              which="hpc"
              label="High Power (HPC)"
              sub="250 kW+ each · dedicated transformer req. · $60K/yr revenue"
              color="#f59e0b"
              icon="🚀"
              value={hpc}
              max={4}
            />
          </div>
        </details>

        {/* Revenue summary */}
        {(l2 > 0 || dcfc > 0 || hpc > 0) && (
          <div
            style={{
              margin: "4px 16px 12px",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(56,189,248,0.05)",
              border: "1px solid rgba(56,189,248,0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(148,163,184,0.70)" }}>
              Est. annual revenue
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#38bdf8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ${Math.round((l2 * 1350 + dcfc * 18000 + hpc * 60000) / 1000)}K/yr
            </span>
          </div>
        )}

        <div style={{ padding: "0 16px 16px" }}>
          <ConfirmBtn
            confirmed={confirmed}
            needsConfirm={!confirmed}
            label="Confirm EV Charging"
            confirmedLabel={`${Math.round(totalKW).toLocaleString()} kW · ${l2 + dcfc + hpc} ports confirmed`}
            onClick={() => {
              onConfig(l2, dcfc, hpc);
              setConfirmed(true);
            }}
          />
        </div>
      </Card>
    </>
  );
}

// ── Backup Generator Card ─────────────────────────────────────────────────────

// ── Backup Generator Card ─────────────────────────────────────────────────────
function BackupGeneratorCard({
  peakLoadKW,
  criticalLoadPct,
  minKW,
  maxKW,
  recKW,
  initialKW,
  fuelType,
  onFuelChange,
  gridReliability,
  utilityRate: _utilityRate,
  onConfig,
}: {
  peakLoadKW: number;
  criticalLoadPct: number;
  minKW: number;
  maxKW: number;
  recKW: number;
  initialKW: number;
  fuelType: FuelType;
  onFuelChange: (f: FuelType) => void;
  gridReliability?: string;
  utilityRate: number;
  onConfig: (kw: number) => void;
}) {
  const safeMax = maxKW > 0 ? maxKW : peakLoadKW > 0 ? peakLoadKW * 2 : 2000;
  const safeMin = minKW > 0 ? minKW : peakLoadKW > 0 ? Math.round(peakLoadKW * 0.5) : 0;
  const stepKW = safeMax <= 1000 ? 50 : safeMax <= 4000 ? 100 : 200;
  const safeRec = recKW > 0 ? recKW : Math.round(peakLoadKW * 1.25);
  const [sliderKW, setSliderKW] = useState(() =>
    Math.max(safeMin, Math.min(safeMax, initialKW > 0 ? initialKW : safeRec))
  );
  const [confirmed, setConfirmed] = useState(false);

  const criticalKW = Math.round(peakLoadKW * (criticalLoadPct || 0.5));
  // Generator backup value is qualitative (avoided downtime) — not monetized per pricingServiceV45
  const savingsK = 0;
  const coveragePct = peakLoadKW > 0 ? Math.round((sliderKW / peakLoadKW) * 100) : 0;
  const isFullBackup = peakLoadKW > 0 && sliderKW >= peakLoadKW * 1.1;

  const handleChange = (v: number) => {
    const c = Math.max(safeMin, Math.min(safeMax, v));
    setSliderKW(c);
    setConfirmed(false);
    onConfig(c);
  };

  const fuelOptions: {
    key: FuelType;
    icon: string;
    label: string;
    desc: string;
  }[] = [
    {
      key: "diesel",
      icon: "🛢️",
      label: "Diesel",
      desc: "Reliable • Higher operating cost",
    },
    {
      key: "natural-gas",
      icon: "🔥",
      label: "Natural Gas",
      desc: "Cleaner emissions • Lower operating cost",
    },
    {
      key: "dual-fuel",
      icon: "⚡",
      label: "Dual Fuel",
      desc: "Flexible • Redundant fuel source",
    },
  ];
  const selectedFuel = fuelOptions.find((f) => f.key === fuelType) ?? fuelOptions[1];

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "rgba(249,115,22,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            flexShrink: 0,
          }}
        >
          🏭
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Backup Generator</div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(148,163,184,0.6)",
              marginTop: 2,
            }}
          >
            Critical load protection
            {criticalKW > 0 ? ` • ${criticalKW.toLocaleString()} kW critical` : ""}
          </div>
        </div>
      </div>
      <CardDivider />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 14px",
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 15,
            color: "rgba(203,213,225,0.8)",
            fontWeight: 600,
          }}
        >
          Generator Capacity
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StepperBtn onClick={() => handleChange(sliderKW - stepKW)}>−</StepperBtn>
          <div style={{ textAlign: "center", minWidth: 130 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.3px",
                }}
              >
                {sliderKW.toLocaleString()} kW
              </span>
              {confirmed && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#3ECF8E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#0D1117",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
              )}
              {savingsK > 0 && (
                <span style={{ fontSize: 13, color: "#3ECF8E", fontWeight: 700 }}>
                  +${savingsK}K
                </span>
              )}
            </div>
            {coveragePct > 0 && (
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(148,163,184,0.6)",
                  marginTop: 3,
                }}
              >
                {coveragePct}% of peak load
              </div>
            )}
          </div>
          <StepperBtn onClick={() => handleChange(sliderKW + stepKW)}>+</StepperBtn>
        </div>
      </div>
      <div style={{ padding: "0 16px 18px" }}>
        <AddonSlider
          value={sliderKW}
          min={safeMin}
          max={safeMax}
          color="#fb923c"
          onChange={handleChange}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(148,163,184,0.45)" }}>
            {fmtKW(safeMin)}
            {peakLoadKW > 0 ? ` (${Math.round((safeMin / peakLoadKW) * 100)}% of peak)` : ""}
          </span>
          <span style={{ fontSize: 11, color: "rgba(148,163,184,0.45)" }}>
            {fmtKW(safeMax)}
            {peakLoadKW > 0 ? ` (${Math.round((safeMax / peakLoadKW) * 100)}% of peak)` : ""}
          </span>
        </div>
      </div>
      <CardDivider />
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "rgba(203,213,225,0.75)",
            marginBottom: 10,
            letterSpacing: "0.03em",
          }}
        >
          Fuel Type
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {fuelOptions.map((opt) => {
            const isSel = fuelType === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onFuelChange(opt.key)}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  borderRadius: 8,
                  border: isSel
                    ? "1.5px solid rgba(249,115,22,0.45)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isSel ? "rgba(249,115,22,0.11)" : "rgba(255,255,255,0.03)",
                  color: isSel ? "#fb923c" : "rgba(203,213,225,0.65)",
                  fontSize: 14,
                  fontWeight: isSel ? 700 : 500,
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }}>{opt.icon}</span>
                {opt.label}
                {isSel && (
                  <div
                    style={{
                      position: "absolute",
                      top: -7,
                      right: -7,
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      background: "#fb923c",
                      border: "2px solid #0D1117",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 900,
                      color: "#0D1117",
                    }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(148,163,184,0.5)",
            marginTop: 8,
          }}
        >
          {selectedFuel.desc}
        </div>
      </div>
      <div style={{ padding: "0 16px 14px" }}>
        <ConfirmBtn
          confirmed={confirmed}
          needsConfirm={!confirmed}
          label="Confirm Generator Setup"
          confirmedLabel={`${sliderKW.toLocaleString()} kW confirmed`}
          onClick={() => {
            onConfig(sliderKW);
            setConfirmed(true);
          }}
        />
      </div>
      <div
        style={{
          padding: "11px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <div
            style={{
              fontSize: 16,
              color: "rgba(203,213,225,0.9)",
              lineHeight: 1.65,
            }}
          >
            <span style={{ fontSize: 18 }}>🧙 </span>
            <strong style={{ color: "#fb923c", fontWeight: 700 }}>
              Merlin suggests {safeRec.toLocaleString()} kW for power generation
            </strong>{" "}
            {peakLoadKW > 0
              ? `to cover your ${peakLoadKW.toLocaleString()} kW peak load with 1.25× reserve margin.`
              : "based on your facility requirements."}
            {isFullBackup && (
              <div style={{ marginTop: 6 }}>
                <strong style={{ color: "rgba(203,213,225,0.9)" }}>Full Backup Sizing: </strong>
                Generator sized with 1.25× reserve margin per NREL/WPP guidelines.
                {gridReliability === "frequent-outages" || gridReliability === "unreliable"
                  ? " This facility requires full backup power for critical operations (life-safety, data integrity, or process continuity)."
                  : " Provides full facility backup with headroom for load growth."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── ROI Intelligence Banner ─────────────────────────────────────────────────
type RoiHint = {
  id: string;
  icon: string;
  color: "amber" | "blue" | "rose";
  text: string;
  /** Label for the one-tap action button, if applicable */
  actionLabel?: string;
  /** Callback fired when the user taps the action button */
  onAction?: () => void;
};

function RoiIntelBanner({
  peakSunHours,
  utilityRate,
  hasTOU,
  peakRate,
  liveSolarKW,
  solarMaxKW,
  solarRecKW,
  canopyInterest,
  canopyPotentialKW,
  isCarWash,
  solarFeasible,
  onApplySolarRec,
}: {
  peakSunHours: number;
  utilityRate: number;
  hasTOU: boolean;
  peakRate: number;
  liveSolarKW: number;
  solarMaxKW: number;
  solarRecKW: number;
  canopyInterest?: string;
  canopyPotentialKW: number;
  isCarWash: boolean;
  solarFeasible: boolean;
  /** Fires handleSolarConfig(solarRecKW) in the parent — snaps slider to recommended */
  onApplySolarRec?: () => void;
}) {
  const hints: RoiHint[] = [];

  // 1. Car wash: vacuum station / carport solar opportunity
  if (isCarWash && canopyPotentialKW > 0 && canopyInterest !== "yes") {
    const extraK = Math.round((canopyPotentialKW * peakSunHours * 365 * 0.77 * utilityRate) / 1000);
    hints.push({
      id: "carport_vacuum",
      icon: "☀️",
      color: "amber",
      text: `Vacuum station canopies can support ${canopyPotentialKW} kW of additional solar (+$${extraK}K/yr est.). Use the Solar Carport toggle below to include them.`,
    });
  }

  // 2. Non-car-wash: parking canopy opportunity
  if (!isCarWash && canopyPotentialKW > 0 && canopyInterest !== "yes") {
    const extraK = Math.round((canopyPotentialKW * peakSunHours * 365 * 0.77 * utilityRate) / 1000);
    hints.push({
      id: "canopy_general",
      icon: "🏗️",
      color: "amber",
      text: `A solar canopy over your parking area unlocks ${canopyPotentialKW} kW of additional capacity (+$${extraK}K/yr est.). Use the Solar Carport toggle below to include it.`,
    });
  }

  // 3. Solar set below recommended — show before headroom hint so it takes priority
  if (solarFeasible && solarRecKW > 0 && liveSolarKW < solarRecKW * 0.85) {
    const deltaKW = Math.round(solarRecKW - liveSolarKW);
    const deltaK = Math.round((deltaKW * peakSunHours * 365 * 0.77 * utilityRate) / 1000);
    if (deltaK > 0) {
      hints.push({
        id: "solar_below_rec",
        icon: "📈",
        color: "amber",
        text: `Raising solar to the recommended ${solarRecKW} kW (currently ${Math.round(liveSolarKW)} kW) adds ~$${deltaK}K/yr est. and shortens payback. Tap to apply.`,
        actionLabel: `Apply ${solarRecKW} kW →`,
        onAction: onApplySolarRec,
      });
    }
  }

  // 4. Good sun with unused capacity headroom
  if (solarFeasible && peakSunHours >= 5.0 && solarMaxKW > 0 && liveSolarKW < solarMaxKW * 0.75) {
    const headroom = Math.round(solarMaxKW - liveSolarKW);
    hints.push({
      id: "good_sun_headroom",
      icon: "⚡",
      color: "blue",
      text: `${peakSunHours} hrs/day sun — ${headroom} kW of unused roof capacity available. More solar means shorter payback at this location.`,
    });
  }

  // 5. TOU rates detected — informational only, no user action needed
  if (hasTOU && peakRate > utilityRate) {
    const spreadCents = Math.round((peakRate - utilityRate) * 100);
    hints.push({
      id: "tou_available",
      icon: "🔋",
      color: "blue",
      text: `Time-of-Use rates detected (${spreadCents}¢ peak/off-peak spread). BESS will shift load off-peak — TOU arbitrage savings appear on your quote in Step 5.`,
    });
  }

  // 6. Low utility rate warning
  if (utilityRate < 0.1) {
    hints.push({
      id: "low_rate",
      icon: "⚠️",
      color: "rose",
      text: `At ${Math.round(utilityRate * 100)}¢/kWh, solar energy savings are limited here. EV charging revenue or demand charge reduction typically offers stronger ROI at this rate.`,
    });
  }

  const shown = hints.slice(0, 2);
  if (shown.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {shown.map((hint) => {
        const isAmber = hint.color === "amber";
        const isBlue = hint.color === "blue";
        const bg = isAmber
          ? "rgba(245,158,11,0.07)"
          : isBlue
            ? "rgba(56,189,248,0.07)"
            : "rgba(239,68,68,0.07)";
        const border = isAmber
          ? "1px solid rgba(245,158,11,0.22)"
          : isBlue
            ? "1px solid rgba(56,189,248,0.22)"
            : "1px solid rgba(239,68,68,0.22)";
        const labelColor = isAmber ? "#fbbf24" : isBlue ? "#38bdf8" : "#f87171";
        const label = isAmber ? "ROI Tip" : isBlue ? "Solar Intel" : "Rate Alert";
        return (
          <div
            key={hint.id}
            style={{
              borderRadius: 10,
              background: bg,
              border,
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{hint.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: hint.actionLabel ? 6 : 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: labelColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginRight: 6,
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: 13, color: "rgba(203,213,225,0.75)", lineHeight: 1.5 }}>
                  {hint.text}
                </span>
              </div>
              {hint.actionLabel && hint.onAction && (
                <button
                  onClick={hint.onAction}
                  style={{
                    marginTop: 4,
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: `1px solid ${labelColor}55`,
                    background: `${labelColor}14`,
                    color: labelColor,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  {hint.actionLabel}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Step3_5V8({ state, actions }: Props) {
  const solarFeasible =
    (state.intel?.solarFeasible ?? false) ||
    state.solarPhysicalCapKW > 0 ||
    !!(state.step3Answers?.roofArea as number | undefined);

  const isFirstVisit = !state.step3Answers?.step3_5Visited;

  const [fuelType, setFuelType] = useState<FuelType>(
    (state.generatorFuelType as FuelType) ?? "natural-gas"
  );
  // Generator is OPT-IN — defaults OFF unless grid is unreliable or user previously enabled it
  const [wantsGenerator, setWantsGenerator] = useState<boolean>(
    () =>
      state.wantsGenerator === true ||
      state.gridReliability === "frequent-outages" ||
      state.gridReliability === "unreliable"
  );
  // EV charging is OPT-IN — defaults OFF unless user previously enabled it
  const [wantsEV, setWantsEV] = useState<boolean>(() => state.wantsEVCharging === true);
  // Linear generator is OPT-IN — continuous baseload bridge for extended outages (Phase 2)
  const [wantsLinearGen, setWantsLinearGen] = useState<boolean>(
    () => (state.linearGeneratorKW ?? 0) > 0
  );
  // pendingSolarKW — set by banner actions to force-update the SolarCard slider
  // when canopyInterest hasn't changed in value (e.g. already 'yes' from step 3)
  // or when the slider needs to sync from an external button click.
  const [pendingSolarKW, setPendingSolarKW] = useState<number | null>(null);

  useEffect(() => {
    if (!isFirstVisit) return;
    if (solarFeasible) {
      actions.setAddonPreference("solar", true);
      const recKW = estimateSolarKW("roof_canopy", state);
      if (recKW > 0) actions.setAddonConfig({ solarKW: recKW });
    }
    // EV is NOT auto-enabled — user must opt in
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSolarConfig = (kw: number) => actions.setAddonConfig({ solarKW: kw });
  const handleGeneratorConfig = (kw: number) => actions.setAddonConfig({ generatorKW: kw });
  const handleEVConfig = (l2: number, dcfc: number, hpc: number) => {
    actions.setAnswer("evScope", "custom");
    actions.setAddonConfig({
      level2Chargers: l2,
      dcfcChargers: dcfc,
      hpcChargers: hpc,
    });
  };
  const handlePanelAssessed = (svc: ServiceType, amps: number, assessment: PanelAssessment) => {
    if (actions.setPanelInfo) {
      actions.setPanelInfo(amps, svc, assessment.upgradeCost, assessment.upgradeType);
    }
  };
  const handleFuelType = (fuel: FuelType) => {
    setFuelType(fuel);
    actions.setAddonConfig({ generatorFuelType: fuel });
  };
  const handleAddGenerator = () => {
    setWantsGenerator(true);
    actions.setAddonPreference("generator", true);
    const recKW = estimateGenKW(defaultGeneratorScope(state), state);
    if (recKW > 0) actions.setAddonConfig({ generatorKW: recKW });
  };
  const handleRemoveGenerator = () => {
    setWantsGenerator(false);
    actions.setAddonPreference("generator", false);
    actions.setAddonConfig({ generatorKW: 0 });
  };
  const handleAddEV = () => {
    setWantsEV(true);
    actions.setAddonPreference("ev", true);
    actions.setAnswer("evScope", "custom");
    const rl2 = Math.min(
      12,
      Math.max(2, state.peakLoadKW > 0 ? Math.round(state.peakLoadKW / 150) : 4)
    );
    // Default to L2-only — DCFC requires explicit panel assessment first
    actions.setAddonConfig({ level2Chargers: rl2, dcfcChargers: 0, hpcChargers: 0 });
  };
  const handleRemoveEV = () => {
    setWantsEV(false);
    actions.setAddonPreference("ev", false);
    actions.setAddonConfig({ level2Chargers: 0, dcfcChargers: 0, hpcChargers: 0 });
  };

  // Linear generator sizing — sized to output above base load so net BESS charging occurs
  const linearGenRecKW =
    state.baseLoadKW > 0
      ? Math.max(10, Math.round(state.baseLoadKW * 1.2))
      : Math.max(50, Math.round(state.peakLoadKW * 0.3));
  const linearGenMaxKW = Math.max(250, linearGenRecKW * 2);
  const linearGenMinKW = 10;
  const handleAddLinearGen = () => {
    setWantsLinearGen(true);
    actions.setAddonConfig({ linearGeneratorKW: linearGenRecKW });
  };
  const handleRemoveLinearGen = () => {
    setWantsLinearGen(false);
    actions.setAddonConfig({ linearGeneratorKW: 0 });
  };
  const handleLinearGenConfig = (kw: number) => {
    actions.setAddonConfig({
      linearGeneratorKW: Math.max(linearGenMinKW, Math.min(linearGenMaxKW, kw)),
    });
  };

  const effectiveSolarCapKW = getEffectiveSolarCapKW(state);
  const solarMaxKW = effectiveSolarCapKW > 0 ? effectiveSolarCapKW : 2000;
  const solarRecKW = estimateSolarKW("roof_canopy", state);
  const genRecKW = estimateGenKW("full", state);
  const genMaxKW = state.peakLoadKW > 0 ? Math.round(state.peakLoadKW * 2) : 2000;
  const genMinKW = state.peakLoadKW > 0 ? Math.round(state.peakLoadKW * 0.5) : 0;
  const utilityRate = state.intel?.utilityRate ?? 0.14;
  const peakSunHours = state.intel?.peakSunHours ?? 4.5;

  // Canopy / carport toggle — drives solar cap reactively via useWizardV8 effect
  const isCarWash = state.industry === "car_wash";
  const canopyFieldKey = isCarWash ? "carportInterest" : "canopyInterest";
  const canopyInterest = state.step3Answers?.[canopyFieldKey] as string | undefined;
  const constraints = getFacilityConstraints(state.industry ?? "");
  const canopyPotentialKW = constraints?.canopyPotentialKW ?? 0;
  const roofArea = Number(state.step3Answers?.roofArea ?? 0);
  const usablePct = constraints?.usableRoofPercent ?? 0.4;

  // Button label kW — must use the SAME formula as the actual slider max so they match.
  // Car wash uses getCarWashSolarCapacity (Vineet 10 W/sqft model) not the generic 15 W/sqft.
  // roofOnlyCapKW = building roof + vacuum only (no carport), regardless of current selection.
  // Pass cached panel spec so density is consistent with what buildTiers uses.
  const _cachedPanelSpec = getLastSelectedPanelSync();
  // Dynamic density for all non-car-wash industries — scales with supplier DB panel
  const _solarWPerSqft = computeSolarWattsPerSqft(_cachedPanelSpec);
  const roofOnlyCapKW = isCarWash
    ? getCarWashSolarCapacity(
        { ...(state.step3Answers ?? {}), carportInterest: "no" },
        _cachedPanelSpec ?? undefined
      ) ||
      (constraints?.maxRooftopSolarKW ?? 0)
    : roofArea > 0
      ? Math.round((roofArea * usablePct * _solarWPerSqft) / 1000)
      : (constraints?.maxRooftopSolarKW ?? 0);
  // withCanopyCapKW = roof + canopyPotentialKW (SSOT default when no area entered)
  const withCanopyCapKW = roofOnlyCapKW + canopyPotentialKW;

  // Synchronous effective max — slider max updates immediately on toggle click,
  // without waiting for the useWizardV8 reactive effect to propagate.
  const solarEffectiveMaxKW =
    canopyInterest === "yes"
      ? withCanopyCapKW
      : canopyInterest === "no"
        ? roofOnlyCapKW
        : solarMaxKW; // unanswered → fall back to state.solarPhysicalCapKW

  // Recommended kW for the new max — prevents stale low rec when max jumps up
  const sunFactor =
    peakSunHours >= 2.5 ? Math.max(0.4, Math.min(1.0, (peakSunHours - 2.5) / 2.0)) : 0;
  const solarEffectiveRecKW =
    solarEffectiveMaxKW > 0 && sunFactor > 0
      ? Math.round(solarEffectiveMaxKW * sunFactor * 0.8)
      : solarRecKW;

  const handleCanopyChange = (value: string) => actions.setAnswer(canopyFieldKey, value);

  // Carport toggle handler — lives in parent so it uses parent-scope sunFactor,
  // withCanopyCapKW, roofOnlyCapKW (no stale closure risk inside SolarCard).
  // targetKW is always ADDITIVE: rooftop-only cap → rooftop+carport cap (never subtract).
  const handleCarportToggle = (nextVal: string) => {
    // Additive toggle: preserve the user's current kW setting, just add/remove the carport kW.
    // Adding carport:   currentKW + canopyPotentialKW  (e.g. 75 + 54 = 129)
    // Removing carport: currentKW - canopyPotentialKW  (e.g. 129 - 54 = 75), floored at roofOnlyRec
    const currentKW = state.solarKW > 0 ? state.solarKW : solarEffectiveRecKW;
    const delta = canopyPotentialKW > 0 ? canopyPotentialKW : withCanopyCapKW - roofOnlyCapKW;
    const postToggleCap = nextVal === "yes" ? withCanopyCapKW : roofOnlyCapKW;
    const sf = sunFactor > 0 ? sunFactor : 1;
    const roofRec = Math.max(1, Math.round(roofOnlyCapKW * sf * 0.8));
    const targetKW =
      nextVal === "yes"
        ? Math.min(withCanopyCapKW, Math.max(1, currentKW + delta)) // add carport kW
        : Math.max(roofRec, Math.min(postToggleCap, currentKW - delta)); // remove: floor at roof rec
    handleSolarConfig(targetKW);
    setPendingSolarKW(targetKW); // drives slider via pendingExternalKW path
    handleCanopyChange(nextVal);
  };

  const liveSolarKW = state.solarKW > 0 ? state.solarKW : solarFeasible ? solarRecKW : 0;
  const liveGenKW = wantsGenerator ? (state.generatorKW > 0 ? state.generatorKW : genRecKW) : 0;
  const liveLinearGenKW = wantsLinearGen
    ? (state.linearGeneratorKW ?? 0) > 0
      ? (state.linearGeneratorKW ?? 0)
      : linearGenRecKW
    : 0;
  const liveL2 = state.level2Chargers || 0;
  const liveDcfc = state.dcfcChargers || 0;
  const liveHpc = state.hpcChargers || 0;
  const totalPorts = liveL2 + liveDcfc + liveHpc;

  // NREL methodology: kW × PSH × 365 × PR(0.77) × rate — matches pricingServiceV45
  const solarSavingsK = Math.round((liveSolarKW * peakSunHours * 365 * 0.77 * utilityRate) / 1000);
  // Generator backup value is qualitative (avoided downtime) — not monetized per pricingServiceV45
  const genSavingsK = 0;
  // DOE/EVI benchmarks: L2=$1,350/yr, DCFC=$18,000/yr, HPC=$60,000/yr — matches pricingServiceV45
  const evRevenueK = Math.round((liveL2 * 1350 + liveDcfc * 18000 + liveHpc * 60000) / 1000);
  const genCostPerKW = fuelType === "diesel" ? 690 : 500;
  const linearGenCostPerKW = 550; // Mainspring-class linear generator: ~$550/kW installed
  const totalInvestmentK =
    Math.round((liveSolarKW * 1400) / 1000) +
    Math.round((liveGenKW * genCostPerKW) / 1000) +
    Math.round((liveLinearGenKW * linearGenCostPerKW) / 1000) +
    Math.round((liveL2 * 9000 + liveDcfc * 55000 + liveHpc * 130000) / 1000);
  const annualSavingsK = solarSavingsK + genSavingsK + evRevenueK;
  const paybackYears =
    annualSavingsK > 0 && totalInvestmentK > 0
      ? (totalInvestmentK / annualSavingsK).toFixed(1)
      : "—";
  const roi10YrK = annualSavingsK * 10 - totalInvestmentK;

  const city =
    state.location?.city ??
    (state.locationRaw ? state.locationRaw.split(",")[0].trim() : "Your Facility");
  const industryDisplay = state.industry
    ? state.industry.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ConfigSummaryBar
        city={city}
        industry={industryDisplay}
        peakLoadKW={state.peakLoadKW}
        totalInvestmentK={totalInvestmentK}
        solarKW={liveSolarKW}
        solarSavingsK={solarSavingsK}
        genKW={liveGenKW}
        genSavingsK={genSavingsK}
        evPorts={totalPorts}
        evRevenueK={evRevenueK}
        solarFeasible={solarFeasible}
        annualSavingsK={annualSavingsK}
        paybackYears={paybackYears}
        roi10YrK={roi10YrK}
      />
      <div style={{ textAlign: "center", padding: "6px 0 10px" }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          Configure Your Add-ons
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "rgba(148,163,184,0.65)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Fine-tune solar, EV charging, and backup generator
        </p>
      </div>
      <RoiIntelBanner
        peakSunHours={peakSunHours}
        utilityRate={utilityRate}
        hasTOU={state.intel?.hasTOU ?? false}
        peakRate={state.intel?.peakRate ?? 0}
        liveSolarKW={liveSolarKW}
        solarMaxKW={solarEffectiveMaxKW}
        solarRecKW={solarEffectiveRecKW}
        canopyInterest={canopyInterest}
        canopyPotentialKW={canopyPotentialKW}
        isCarWash={isCarWash}
        solarFeasible={solarFeasible}
        onApplySolarRec={() => {
          const kw = solarEffectiveRecKW;
          handleSolarConfig(kw);
          setPendingSolarKW(kw);
        }}
      />
      {solarFeasible && (
        <SolarCard
          maxKW={solarEffectiveMaxKW}
          recKW={solarEffectiveRecKW}
          initialKW={state.solarKW > 0 ? state.solarKW : solarEffectiveRecKW}
          peakSunHours={peakSunHours}
          utilityRate={utilityRate}
          peakLoadKW={state.peakLoadKW}
          solarGrade={state.intel?.solarGrade ? `Grade ${state.intel.solarGrade}` : null}
          onConfig={handleSolarConfig}
          canopyPotentialKW={canopyPotentialKW}
          canopyInterest={canopyInterest}
          onCanopyChange={handleCanopyChange}
          isCarWash={isCarWash}
          roofOnlyKW={roofOnlyCapKW}
          withCanopyKW={withCanopyCapKW}
          pendingExternalKW={pendingSolarKW}
          onPendingConsumed={() => setPendingSolarKW(null)}
          onCarportToggle={handleCarportToggle}
        />
      )}
      {wantsEV ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleRemoveEV}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(56,189,248,0.25)",
                background: "transparent",
                color: "rgba(56,189,248,0.65)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✕ Remove EV Charging
            </button>
          </div>
          <EVChargingCard
            peakLoadKW={state.peakLoadKW}
            initialL2={state.level2Chargers}
            initialDcfc={state.dcfcChargers}
            initialHpc={state.hpcChargers}
            initialPanelAmps={(state as { electricalPanelAmps?: number }).electricalPanelAmps ?? 0}
            initialServiceType={
              (state as { electricalServiceType?: ServiceType }).electricalServiceType ?? "unknown"
            }
            onConfig={handleEVConfig}
            onPanelAssessed={handlePanelAssessed}
          />
        </>
      ) : (
        <div
          style={{
            borderRadius: 12,
            background: "rgba(15,17,23,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "rgba(56,189,248,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(203,213,225,0.85)" }}>
                EV Charging
              </div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.5)", marginTop: 2 }}>
                Optional add-on · Customer &amp; fleet charging revenue
              </div>
            </div>
          </div>
          <button
            onClick={handleAddEV}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid rgba(56,189,248,0.4)",
              background: "transparent",
              color: "#38bdf8",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + Add EV Charging
          </button>
        </div>
      )}
      {wantsGenerator ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleRemoveGenerator}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(249,115,22,0.25)",
                background: "transparent",
                color: "rgba(249,115,22,0.65)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✕ Remove Generator
            </button>
          </div>
          <BackupGeneratorCard
            peakLoadKW={state.peakLoadKW}
            criticalLoadPct={state.criticalLoadPct}
            minKW={genMinKW}
            maxKW={genMaxKW}
            recKW={genRecKW}
            initialKW={state.generatorKW > 0 ? state.generatorKW : genRecKW}
            fuelType={fuelType}
            onFuelChange={handleFuelType}
            gridReliability={state.gridReliability ?? undefined}
            utilityRate={utilityRate}
            onConfig={handleGeneratorConfig}
          />
        </>
      ) : (
        <div
          style={{
            borderRadius: 12,
            background: "rgba(15,17,23,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "rgba(249,115,22,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              🏭
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(203,213,225,0.85)" }}>
                Backup Generator
              </div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.5)", marginTop: 2 }}>
                Optional resilience add-on · Does not affect solar/BESS ROI
              </div>
            </div>
          </div>
          <button
            onClick={handleAddGenerator}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid rgba(249,115,22,0.4)",
              background: "transparent",
              color: "#fb923c",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + Add Generator
          </button>
        </div>
      )}

      {/* ── Phase 2: Linear Generator ── */}
      {wantsLinearGen ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleRemoveLinearGen}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "1px solid rgba(34,211,238,0.25)",
                background: "transparent",
                color: "rgba(34,211,238,0.65)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✕ Remove Linear Generator
            </button>
          </div>
          <div
            style={{
              borderRadius: 12,
              background: "rgba(8,25,38,0.8)",
              border: "1px solid rgba(34,211,238,0.20)",
              padding: "20px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(34,211,238,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🔄
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#67e8f9" }}>
                  Linear Generator
                </div>
                <div style={{ fontSize: 12, color: "rgba(148,163,184,0.6)", marginTop: 2 }}>
                  Continuous baseload output · trickle-charges BESS · 72h fuel endurance
                </div>
              </div>
            </div>

            {/* kW Slider */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(148,163,184,0.7)" }}>Output</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#67e8f9" }}>
                  {(state.linearGeneratorKW ?? 0) > 0
                    ? (state.linearGeneratorKW ?? 0)
                    : linearGenRecKW}{" "}
                  kW continuous
                </span>
              </div>
              <input
                type="range"
                min={linearGenMinKW}
                max={linearGenMaxKW}
                step={10}
                value={
                  (state.linearGeneratorKW ?? 0) > 0
                    ? (state.linearGeneratorKW ?? 0)
                    : linearGenRecKW
                }
                onChange={(e) => handleLinearGenConfig(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#22d3ee" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "rgba(100,116,139,0.7)",
                  marginTop: 4,
                }}
              >
                <span>{linearGenMinKW} kW min</span>
                <span style={{ color: "rgba(34,211,238,0.5)" }}>✦ Rec: {linearGenRecKW} kW</span>
                <span>{linearGenMaxKW} kW max</span>
              </div>
            </div>

            {/* How it works */}
            <div
              style={{
                borderRadius: 8,
                background: "rgba(34,211,238,0.05)",
                border: "1px solid rgba(34,211,238,0.12)",
                padding: "10px 12px",
                fontSize: 11,
                color: "rgba(148,163,184,0.7)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "rgba(103,232,249,0.8)" }}>How it works:</strong> Runs at
              rated capacity continuously. Serves base load first; any excess output trickles into
              the BESS. During a grid outage the BESS covers peak demand while the linear gen keeps
              it charged — enabling 72h+ autonomy without refuelling large tanks. Fuel: natural gas
              (pipeline or on-site storage). Quieter and lower-emission than rotary diesel
              alternatives.
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            borderRadius: 12,
            background: "rgba(15,17,23,0.7)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "rgba(34,211,238,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 21,
                flexShrink: 0,
              }}
            >
              🔄
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(203,213,225,0.85)" }}>
                Linear Generator
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgba(34,211,238,0.7)",
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  72h endurance
                </span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,0.5)", marginTop: 2 }}>
                Continuous baseload bridge · trickle-charges BESS during extended outages
              </div>
            </div>
          </div>
          <button
            onClick={handleAddLinearGen}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1.5px solid rgba(34,211,238,0.4)",
              background: "transparent",
              color: "#22d3ee",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            + Add Linear Gen
          </button>
        </div>
      )}

      {/* ── Bottom CTA: mirrors shell nav so users don't need to scroll ── */}
      <button
        type="button"
        onClick={() => {
          actions.setAnswer("step3_5Visited", true);
          actions.goToStep(5 as WizardStep);
        }}
        style={{
          width: "100%",
          padding: "17px 24px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #3ECF8E 0%, #2aad70 100%)",
          color: "#080B10",
          fontSize: 16,
          fontWeight: 900,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 4px 20px rgba(16,185,129,0.40)",
          marginTop: 8,
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(16,185,129,0.55)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(16,185,129,0.40)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        🧙 Build My Tiers →
      </button>
    </div>
  );
}
