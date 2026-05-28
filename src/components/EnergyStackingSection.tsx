/**
 * EnergyStackingSection — Interactive 6-layer stack explorer
 * Design: list rows (left) + live inspector panel (right) + CO-OPTIMIZED OUTPUT footer
 * Palette: wizard standard (violet/blue, no cyan)
 */

import { useState, useCallback } from "react";

const P = {
  bg: "#080d24",
  panel: "#111a3e",
  panelDeep: "#0d1230",
  border: "rgba(99,120,255,0.18)",
  activeBorder: "rgba(130,100,255,0.50)",
  purple: "#9b6dff",
  violet: "#7c3aed",
  blue: "#4f8aff",
  green: "#34d399",
  amber: "#f59e0b",
  fuchsia: "#c084fc",
  text: "rgba(232,235,243,0.98)",
  textSub: "rgba(232,235,243,0.64)",
  textMuted: "rgba(232,235,243,0.38)",
};

const SPARKS: Record<string, string> = {
  utility: "M0,9 L20,9 L40,9 L60,9 L80,9 L100,9 L120,9",
  bess: "M0,13 C15,13 18,5 28,7 S42,11 52,7 S68,3 78,7 S92,11 102,6 S112,4 120,7",
  solar: "M0,14 C18,14 28,3 44,2 S60,5 74,3 S88,2 102,5 S112,9 120,11",
  generator: "M0,9 L28,9 C34,9 36,2 42,9 L68,9 C74,9 76,2 82,9 L120,9",
  ai: "M0,11 C8,9 14,7 20,9 S28,13 34,9 S44,5 54,9 S64,13 74,7 S84,9 94,11 S108,7 120,9",
  arbitrage: "M0,9 C14,11 18,7 28,9 S38,13 48,9 S58,5 68,9 S78,11 88,7 S104,9 120,9",
};

interface LayerDef {
  id: string;
  label: string;
  code: string;
  sub: string;
  detail: string;
  defaultVal: number;
  unit: string;
  color: string;
  sliderLabel: string;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  bulletPoint: string;
}

const LAYERS: LayerDef[] = [
  {
    id: "utility",
    label: "Utility Power Grid",
    code: "L01",
    sub: "Layer 1 — Interconnection Baseline",
    detail:
      "Your grid connection provides the baseline service level. Tariff structure, demand charges, and time-of-use windows are modeled from your utility rate schedule and peak load profile.",
    defaultVal: 100,
    unit: "%",
    color: P.textSub,
    sliderLabel: "Grid Dependency",
    sliderMin: 20,
    sliderMax: 100,
    sliderStep: 5,
    bulletPoint: "Sets baseline demand charges and grid exposure risk across all layers.",
  },
  {
    id: "bess",
    label: "Battery Storage (BESS)",
    code: "L02",
    sub: "Layer 2 — Physical Buffer & Peak Shaving",
    detail:
      "Chemical energy buffer providing instantaneous peak demand reduction, emergency back-up support, and solar self-consumption optimization. Sized to your facility's peak load and critical coverage window.",
    defaultVal: 150,
    unit: "kWh",
    color: P.purple,
    sliderLabel: "Battery Reserve Capacity",
    sliderMin: 25,
    sliderMax: 500,
    sliderStep: 25,
    bulletPoint: "Reduces peak demand charges by storing and dispatching at critical rate windows.",
  },
  {
    id: "solar",
    label: "Solar Generation",
    code: "L03",
    sub: "Layer 3 — Photovoltaic Production Harvest",
    detail:
      "Daytime generation paired to load timing and site economics. Solar production offsets utility consumption and charges battery storage during peak production windows, compressing net load and demand exposure.",
    defaultVal: 250,
    unit: "kW",
    color: P.amber,
    sliderLabel: "Array Size",
    sliderMin: 25,
    sliderMax: 500,
    sliderStep: 25,
    bulletPoint: "Offsets daytime consumption and feeds battery storage for dispatch during peak.",
  },
  {
    id: "generator",
    label: "Generator Backup",
    code: "L04",
    sub: "Layer 4 — Emergency Continuity Reserve",
    detail:
      "Continuity layer for outages and critical operations coverage. Generator runtime is sized to bridge grid outages beyond battery storage duration, ensuring uninterrupted operations.",
    defaultVal: 3,
    unit: "hr",
    color: P.green,
    sliderLabel: "Runtime Window",
    sliderMin: 1,
    sliderMax: 12,
    sliderStep: 1,
    bulletPoint: "Bridges extended outages beyond battery storage capacity.",
  },
  {
    id: "ai",
    label: "AI Load Optimization",
    code: "L05",
    sub: "Layer 5 — Merlin Signal Intelligence",
    detail:
      "Merlin's core signal intelligence translates load behavior, tariff variability, and resilience constraints into one orchestrated stack strategy — adapting in real time to demand events and rate signals.",
    defaultVal: 85,
    unit: "%",
    color: P.blue,
    sliderLabel: "Optimization Efficiency",
    sliderMin: 50,
    sliderMax: 99,
    sliderStep: 1,
    bulletPoint: "Dispatch logic that adapts to peaks, tariffs, and risk posture in real time.",
  },
  {
    id: "arbitrage",
    label: "Dynamic Rate Arbitrage",
    code: "L06",
    sub: "Layer 6 — Financial Timing Dispatch",
    detail:
      "Financial control from timing power flows against rate structures. Charges storage during off-peak low-cost windows, dispatches during on-peak high-cost windows to extract maximum tariff spread.",
    defaultVal: 18,
    unit: "%",
    color: P.fuchsia,
    sliderLabel: "Arbitrage Window",
    sliderMin: 5,
    sliderMax: 35,
    sliderStep: 1,
    bulletPoint: "Times charge/discharge cycles against real-time tariff differentials.",
  },
];

function computeOutput(vals: Record<string, number>) {
  const bess = vals.bess ?? 150;
  const solar = vals.solar ?? 250;
  const ai = vals.ai ?? 85;
  const arb = vals.arbitrage ?? 18;
  const gen = vals.generator ?? 3;
  const hasSolar = solar > 50;
  const hasBess = bess > 50;
  const arch =
    hasSolar && hasBess
      ? "Solar + BESS Hybrid"
      : hasBess
        ? "BESS + Utility"
        : hasSolar
          ? "Solar + Utility"
          : "Utility Only";
  const carbonOffset = Math.round((solar / 500) * 62 + (bess / 500) * 18);
  const payback = Math.max(
    2.5,
    Math.min(
      9.5,
      6.2 -
        ((ai - 50) / 100) * 1.8 -
        (arb / 100) * 1.1 -
        (hasSolar ? 0.6 : 0) -
        (gen >= 3 ? 0.1 : 0)
    )
  ).toFixed(1);
  const annualValue = Math.round(
    (bess / 150) * 19500 + (hasSolar ? (solar / 250) * 23000 : 0) + (ai / 85) * 7500 + arb * 480
  );
  return { arch, carbonOffset, payback, annualValue };
}

function Sparkline({ path, color }: { path: string; color: string }) {
  return (
    <svg
      width="80"
      height="18"
      viewBox="0 0 120 18"
      fill="none"
      style={{ flexShrink: 0, opacity: 0.85 }}
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function EnergyStackingSection() {
  const [activeId, setActiveId] = useState<string>("bess");
  const [sliderVals, setSliderVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(LAYERS.map((l) => [l.id, l.defaultVal]))
  );

  const setVal = useCallback((id: string, v: number) => {
    setSliderVals((prev) => ({ ...prev, [id]: v }));
  }, []);

  const reset = useCallback(() => {
    setSliderVals(Object.fromEntries(LAYERS.map((l) => [l.id, l.defaultVal])));
    setActiveId("bess");
  }, []);

  const active = LAYERS.find((l) => l.id === activeId) ?? LAYERS[1];
  const output = computeOutput(sliderVals);

  return (
    <section
      id="energy-stacking"
      style={{
        background: P.bg,
        borderTop: `1px solid ${P.border}`,
        borderBottom: `1px solid ${P.border}`,
        padding: "64px 0 56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 12% 30%, rgba(124,58,237,0.13) 0%, transparent 40%), radial-gradient(circle at 88% 20%, rgba(79,138,255,0.10) 0%, transparent 38%)",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative" }}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: P.purple,
                  border: `1px solid rgba(155,109,255,0.35)`,
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                Orchestrated Signal Intelligence
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: P.green,
                  border: `1px solid rgba(52,211,153,0.30)`,
                  background: "rgba(52,211,153,0.08)",
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                ● Active Optimization
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 44px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: P.text,
                margin: "0 0 10px",
                lineHeight: 1.08,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Energy Stacking™
            </h2>
            <p
              style={{ fontSize: 15, color: P.textSub, lineHeight: 1.65, margin: 0, maxWidth: 560 }}
            >
              One building is no longer one power source. Merlin orchestrates a modern Energy Stack™
              as an adaptive, software-native infrastructure system.
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: `1px solid ${P.border}`,
              borderRadius: 8,
              color: P.textSub,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: "8px 14px",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,120,255,0.40)";
              e.currentTarget.style.color = P.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = P.border;
              e.currentTarget.style.color = P.textSub;
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32M9.68 1v2.32H12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reset Baseline
          </button>
        </div>

        <div style={{ height: 1, background: P.border, marginBottom: 28 }} />

        {/* ── Body: layer list + inspector ───────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 20,
            alignItems: "start",
          }}
          className="es-grid"
        >
          {/* Left: layer list */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: P.textMuted,
                }}
              >
                Infrastructure Layers
              </span>
              <span style={{ fontSize: 11, color: P.textMuted, fontStyle: "italic" }}>
                Click any layer to inspect parameters
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {LAYERS.map((layer) => {
                const isActive = layer.id === activeId;
                const val = sliderVals[layer.id];
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveId(layer.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: isActive ? "rgba(130,100,255,0.07)" : "transparent",
                      border: isActive
                        ? `1.5px solid ${P.activeBorder}`
                        : "1.5px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textAlign: "left",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(99,120,255,0.04)";
                        e.currentTarget.style.borderColor = P.border;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                  >
                    {/* Indicator dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: isActive ? layer.color : "transparent",
                        border: `2px solid ${isActive ? layer.color : "rgba(255,255,255,0.20)"}`,
                        boxShadow: isActive ? `0 0 8px ${layer.color}80` : "none",
                        transition: "all 0.2s ease",
                      }}
                    />

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isActive ? P.text : "rgba(232,235,243,0.82)",
                          }}
                        >
                          {layer.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: isActive ? layer.color : P.textMuted,
                            border: `1px solid ${isActive ? layer.color + "55" : "rgba(255,255,255,0.10)"}`,
                            borderRadius: 4,
                            padding: "1px 5px",
                          }}
                        >
                          {layer.code}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: P.textMuted }}>{layer.sub}</div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline
                      path={SPARKS[layer.id]}
                      color={isActive ? layer.color : "rgba(255,255,255,0.20)"}
                    />

                    {/* Value */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64 }}>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: isActive ? layer.color : P.textSub,
                          fontVariantNumeric: "tabular-nums",
                          transition: "color 0.2s",
                        }}
                      >
                        {val}
                      </span>
                      <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 3 }}>
                        {layer.unit}
                      </span>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      style={{ flexShrink: 0, opacity: isActive ? 0.7 : 0.25 }}
                    >
                      <path
                        d="M5 10.5L9 7L5 3.5"
                        stroke={isActive ? layer.color : "currentColor"}
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: inspector panel */}
          <div
            style={{
              background: P.panel,
              border: `1px solid ${P.activeBorder}`,
              borderRadius: 16,
              padding: "20px 22px",
              position: "sticky",
              top: 16,
              boxShadow: "0 0 40px rgba(130,100,255,0.12)",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: `${active.color}18`,
                  border: `1px solid ${active.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="2"
                    y="2"
                    width="3"
                    height="12"
                    rx="1"
                    fill={active.color}
                    opacity="0.7"
                  />
                  <rect
                    x="6.5"
                    y="4"
                    width="3"
                    height="10"
                    rx="1"
                    fill={active.color}
                    opacity="0.85"
                  />
                  <rect x="11" y="1" width="3" height="13" rx="1" fill={active.color} />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: P.textMuted,
                    marginBottom: 2,
                  }}
                >
                  Layer Inspector · {active.code}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: P.text, lineHeight: 1.2 }}>
                  {active.label}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: P.green,
                  background: "rgba(52,211,153,0.10)",
                  border: "1px solid rgba(52,211,153,0.28)",
                  borderRadius: 6,
                  padding: "3px 8px",
                }}
              >
                Active
              </span>
            </div>

            <p style={{ fontSize: 12, color: P.textSub, lineHeight: 1.65, margin: "0 0 14px" }}>
              {active.detail}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                background: P.panelDeep,
                borderRadius: 8,
                border: `1px solid ${P.border}`,
                padding: "10px 12px",
                marginBottom: 20,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="7" cy="7" r="6" stroke={active.color} strokeWidth="1.2" opacity="0.6" />
                <circle cx="7" cy="7" r="2.5" fill={active.color} opacity="0.8" />
              </svg>
              <span style={{ fontSize: 11, color: P.textSub, lineHeight: 1.5 }}>
                {active.bulletPoint}
              </span>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: P.textMuted,
                  }}
                >
                  {active.sliderLabel}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: active.color,
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.2s",
                  }}
                >
                  {sliderVals[active.id]}
                  <span
                    style={{ fontSize: 11, fontWeight: 500, color: P.textMuted, marginLeft: 3 }}
                  >
                    {active.unit}
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={active.sliderMin}
                max={active.sliderMax}
                step={active.sliderStep}
                value={sliderVals[active.id]}
                onChange={(e) => setVal(active.id, Number(e.target.value))}
                style={{ width: "100%", accentColor: active.color, cursor: "pointer", height: 4 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: P.textMuted }}>
                  Min: {active.sliderMin} {active.unit}
                </span>
                <span style={{ fontSize: 10, color: P.textMuted }}>
                  Max: {active.sliderMax} {active.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CO-OPTIMIZED OUTPUT strip ───────────────────────────── */}
        <div
          style={{
            marginTop: 24,
            borderRadius: 14,
            background: "rgba(17,26,62,0.80)",
            border: `1px solid rgba(99,120,255,0.22)`,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: "rgba(124,58,237,0.18)",
                border: "1px solid rgba(124,58,237,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L3 5.5V10.5C3 13 5.5 15 8 15.5C10.5 15 13 13 13 10.5V5.5L8 2Z"
                  stroke={P.purple}
                  strokeWidth="1.3"
                  fill={P.purple}
                  fillOpacity="0.15"
                />
                <path
                  d="M6 8.5L7.5 10L10.5 7"
                  stroke={P.green}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: P.purple,
                  marginBottom: 2,
                }}
              >
                Co-Optimized Output
              </div>
              <div style={{ fontSize: 11, color: P.textSub, maxWidth: 200, lineHeight: 1.4 }}>
                Merlin dynamically translates physical layer parameters into optimal business
                metrics.
              </div>
            </div>
          </div>

          <div
            style={{ width: 1, height: 44, background: P.border, flexShrink: 0 }}
            className="es-divider"
          />

          {(
            [
              { label: "Recommended Stack", value: output.arch, color: P.text, size: 14 },
              {
                label: "Carbon Offset",
                value: `${output.carbonOffset}%`,
                color: P.green,
                size: 20,
              },
              {
                label: "Estimated Payback",
                value: `${output.payback} Yrs`,
                color: P.amber,
                size: 20,
              },
              {
                label: "Annual Value Forecast",
                value: `$${output.annualValue.toLocaleString()} / yr`,
                color: P.blue,
                size: 17,
              },
            ] as const
          ).map(({ label, value, color, size }, i, arr) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: P.textMuted,
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: size,
                    fontWeight: 800,
                    color,
                    fontVariantNumeric: "tabular-nums",
                    transition: "all 0.35s ease",
                  }}
                >
                  {value}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{ width: 1, height: 36, background: P.border, flexShrink: 0 }}
                  className="es-divider"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .es-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .es-divider { display: none !important; } }
      `}</style>
    </section>
  );
}
