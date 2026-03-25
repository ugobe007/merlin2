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
}: {
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
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
          boxShadow: `0 0 12px ${color}99, 0 0 4px ${color}55`,
          transition: "left 0.06s",
          pointerEvents: "none",
          zIndex: 1,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      />
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

// ── EV Slider Row ─────────────────────────────────────────────────────────────
function EVSliderRow({
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
  label,
  confirmedLabel,
  onClick,
}: {
  confirmed: boolean;
  label: string;
  confirmedLabel: string;
  onClick: () => void;
}) {
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
          border: "1.5px solid rgba(62,207,142,0.35)",
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
        padding: "11px 16px",
        borderRadius: 8,
        border: "1.5px solid rgba(62,207,142,0.4)",
        background: "transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        color: "#3ECF8E",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(62,207,142,0.08)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(62,207,142,0.65)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(62,207,142,0.4)";
      }}
    >
      {label}
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
}: {
  maxKW: number;
  recKW: number;
  initialKW: number;
  peakSunHours: number;
  utilityRate: number;
  peakLoadKW: number;
  solarGrade?: string | null;
  onConfig: (kw: number) => void;
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

  const pct = peakLoadKW > 0 ? Math.min(100, Math.round((sliderKW / peakLoadKW) * 100)) : null;
  const savingsK = Math.round((sliderKW * peakSunHours * 365 * utilityRate * 6.0) / 1000);
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
              ⭐ {safeRec.toLocaleString()} kW
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "0 16px 14px" }}>
        <ConfirmBtn
          confirmed={confirmed}
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
            {safeMax > 0 ? `${safeMax.toLocaleString()} kW roof space` : "available roof area"}
            {peakLoadKW > 0 ? ` and ${peakLoadKW.toLocaleString()} kW peak load` : ""}.
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── EV Charging Card ──────────────────────────────────────────────────────────
function EVChargingCard({
  peakLoadKW,
  initialL2,
  initialDcfc,
  initialHpc,
  onConfig,
}: {
  peakLoadKW: number;
  initialL2: number;
  initialDcfc: number;
  initialHpc: number;
  onConfig: (l2: number, dcfc: number, hpc: number) => void;
}) {
  const recL2 = Math.min(12, Math.max(4, peakLoadKW > 0 ? Math.round(peakLoadKW / 150) : 6));
  const recDcfc = Math.min(8, Math.max(0, peakLoadKW > 0 ? Math.round(peakLoadKW / 600) : 2));
  const recHpc = Math.min(4, Math.max(0, peakLoadKW > 0 ? Math.round(peakLoadKW / 1200) : 0));
  const [l2, setL2] = useState(initialL2 > 0 ? initialL2 : recL2);
  const [dcfc, setDcfc] = useState(initialDcfc > 0 ? initialDcfc : recDcfc);
  const [hpc, setHpc] = useState(initialHpc > 0 ? initialHpc : recHpc);
  const [confirmed, setConfirmed] = useState(false);
  const totalKW = l2 * 11 + dcfc * 100 + hpc * 300;

  const handleChange = (nl2: number, nd: number, nh: number) => {
    setConfirmed(false);
    onConfig(nl2, nd, nh);
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
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>EV Charging</div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(148,163,184,0.6)",
              marginTop: 2,
            }}
          >
            Employee &amp; customer charging
          </div>
        </div>
      </div>
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
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
        <div
          style={{
            fontSize: 16,
            color: "rgba(203,213,225,0.9)",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontSize: 18 }}>🧙 </span>
          <strong style={{ color: "#38bdf8", fontWeight: 700 }}>
            Merlin: {recL2} L2 chargers recommended
            {recDcfc > 0 ? ` + ${recDcfc} DC Fast` : ""}
          </strong>{" "}
          for employee daily charging.
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <EVSliderRow
          label="Level 2 (7–22 kW)"
          value={l2}
          max={12}
          color="#22d3ee"
          onChange={(v) => {
            setL2(v);
            handleChange(v, dcfc, hpc);
          }}
        />
        <EVSliderRow
          label="DC Fast (50–150 kW)"
          value={dcfc}
          max={8}
          color="#a78bfa"
          onChange={(v) => {
            setDcfc(v);
            handleChange(l2, v, hpc);
          }}
        />
        <EVSliderRow
          label="High Power (250–350 kW)"
          value={hpc}
          max={4}
          color="#c084fc"
          onChange={(v) => {
            setHpc(v);
            handleChange(l2, dcfc, v);
          }}
        />
      </div>
      <div
        style={{
          margin: "0 16px 14px",
          padding: "11px 14px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 15,
            color: "rgba(203,213,225,0.75)",
            fontWeight: 600,
          }}
        >
          Total Capacity:
        </span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#38bdf8",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.3px",
          }}
        >
          {totalKW.toLocaleString()} kW
        </span>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <ConfirmBtn
          confirmed={confirmed}
          label="Confirm EV Charging"
          confirmedLabel={`${l2 + dcfc + hpc} ports confirmed`}
          onClick={() => {
            onConfig(l2, dcfc, hpc);
            setConfirmed(true);
          }}
        />
      </div>
    </Card>
  );
}

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
  utilityRate,
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
  const savingsK = Math.round((sliderKW * utilityRate * 8760 * 0.015 * 6.0) / 1000);
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

  useEffect(() => {
    if (!isFirstVisit) return;
    if (solarFeasible) {
      actions.setAddonPreference("solar", true);
      const recKW = estimateSolarKW("roof_canopy", state);
      if (recKW > 0) actions.setAddonConfig({ solarKW: recKW });
    }
    actions.setAddonPreference("generator", true);
    const recGenKW = estimateGenKW(defaultGeneratorScope(state), state);
    if (recGenKW > 0) actions.setAddonConfig({ generatorKW: recGenKW });
    actions.setAddonPreference("ev", true);
    actions.setAnswer("evScope", "custom");
    const rl2 = Math.min(
      12,
      Math.max(4, state.peakLoadKW > 0 ? Math.round(state.peakLoadKW / 150) : 6)
    );
    const rdcfc = Math.min(
      8,
      Math.max(0, state.peakLoadKW > 0 ? Math.round(state.peakLoadKW / 600) : 2)
    );
    const rhpc = Math.min(
      4,
      Math.max(0, state.peakLoadKW > 0 ? Math.round(state.peakLoadKW / 1200) : 0)
    );
    actions.setAddonConfig({
      level2Chargers: rl2,
      dcfcChargers: rdcfc,
      hpcChargers: rhpc,
    });
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
  const handleFuelType = (fuel: FuelType) => {
    setFuelType(fuel);
    actions.setAddonConfig({ generatorFuelType: fuel });
  };

  const effectiveSolarCapKW = getEffectiveSolarCapKW(state);
  const solarMaxKW = effectiveSolarCapKW > 0 ? effectiveSolarCapKW : 2000;
  const solarRecKW = estimateSolarKW("roof_canopy", state);
  const genRecKW = estimateGenKW("full", state);
  const genMaxKW = state.peakLoadKW > 0 ? Math.round(state.peakLoadKW * 2) : 2000;
  const genMinKW = state.peakLoadKW > 0 ? Math.round(state.peakLoadKW * 0.5) : 0;
  const utilityRate = state.intel?.utilityRate ?? 0.14;
  const peakSunHours = state.intel?.peakSunHours ?? 4.5;

  const liveSolarKW = state.solarKW > 0 ? state.solarKW : solarFeasible ? solarRecKW : 0;
  const liveGenKW = state.generatorKW > 0 ? state.generatorKW : genRecKW;
  const liveL2 = state.level2Chargers || 0;
  const liveDcfc = state.dcfcChargers || 0;
  const liveHpc = state.hpcChargers || 0;
  const liveTotalEVKW = liveL2 * 11 + liveDcfc * 100 + liveHpc * 300;
  const totalPorts = liveL2 + liveDcfc + liveHpc;

  const solarSavingsK = Math.round((liveSolarKW * peakSunHours * 365 * utilityRate * 6.0) / 1000);
  const genSavingsK = Math.round((liveGenKW * utilityRate * 8760 * 0.015 * 5.0) / 1000);
  const evRevenueK = Math.round((liveTotalEVKW * 0.12 * 8760 * 0.25) / 1000);
  const genCostPerKW = fuelType === "diesel" ? 690 : 500;
  const totalInvestmentK =
    Math.round((liveSolarKW * 1400) / 1000) +
    Math.round((liveGenKW * genCostPerKW) / 1000) +
    Math.round((liveL2 * 9000 + liveDcfc * 55000 + liveHpc * 130000) / 1000);

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
      {solarFeasible && (
        <SolarCard
          maxKW={solarMaxKW}
          recKW={solarRecKW}
          initialKW={state.solarKW > 0 ? state.solarKW : solarRecKW}
          peakSunHours={peakSunHours}
          utilityRate={utilityRate}
          peakLoadKW={state.peakLoadKW}
          solarGrade={state.intel?.solarGrade ? `Grade ${state.intel.solarGrade}` : null}
          onConfig={handleSolarConfig}
        />
      )}
      <EVChargingCard
        peakLoadKW={state.peakLoadKW}
        initialL2={state.level2Chargers}
        initialDcfc={state.dcfcChargers}
        initialHpc={state.hpcChargers}
        onConfig={handleEVConfig}
      />
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
