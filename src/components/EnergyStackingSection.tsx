/**
 * EnergyStackingSection — Interactive Energy Architecture explorer
 * Design: definition + score model + layer inspector + architecture output footer
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
  storage: "M0,13 C15,13 18,5 28,7 S42,11 52,7 S68,3 78,7 S92,11 102,6 S112,4 120,7",
  generation: "M0,14 C18,14 28,3 44,2 S60,5 74,3 S88,2 102,5 S112,9 120,11",
  dispatchable: "M0,9 L28,9 C34,9 36,2 42,9 L68,9 C74,9 76,2 82,9 L120,9",
  flexible: "M0,11 C8,9 14,7 20,9 S28,13 34,9 S44,5 54,9 S64,13 74,7 S84,9 94,11 S108,7 120,9",
  intelligence: "M0,9 C14,11 18,7 28,9 S38,13 48,9 S58,5 68,9 S78,11 88,7 S104,9 120,9",
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
    label: "Utility",
    code: "L01",
    sub: "Grid power · capacity · demand charges · TOU pricing",
    detail:
      "Every architecture starts with the utility layer: available capacity, demand charges, time-of-use pricing, reliability, interconnection delays, and exposure to rate-case pressure.",
    defaultVal: 100,
    unit: "%",
    color: P.textSub,
    sliderLabel: "Utility Dependence",
    sliderMin: 20,
    sliderMax: 100,
    sliderStep: 5,
    bulletPoint:
      "Defines the baseline risk, cost, and capacity constraint every other layer must solve around.",
  },
  {
    id: "storage",
    label: "Storage",
    code: "L02",
    sub: "BESS · peak shaving · backup · arbitrage · demand response",
    detail:
      "The storage layer adds a physical buffer for peak shaving, backup coverage, tariff arbitrage, demand response, and solar self-consumption.",
    defaultVal: 150,
    unit: "kWh",
    color: P.purple,
    sliderLabel: "Storage Capacity",
    sliderMin: 25,
    sliderMax: 500,
    sliderStep: 25,
    bulletPoint:
      "Creates optionality: shift energy in time, protect operations, and monetize rate windows.",
  },
  {
    id: "generation",
    label: "Generation",
    code: "L03",
    sub: "Solar · wind · fuel cell · small nuclear",
    detail:
      "The generation layer offsets purchased energy and can improve sustainability, capacity planning, and long-term economics when paired with the right load profile.",
    defaultVal: 250,
    unit: "kW",
    color: P.amber,
    sliderLabel: "On-Site Generation",
    sliderMin: 25,
    sliderMax: 500,
    sliderStep: 25,
    bulletPoint:
      "Tests whether on-site production should reduce energy cost, reduce demand, or support a resilience objective.",
  },
  {
    id: "dispatchable",
    label: "Dispatchable Generation",
    code: "L04",
    sub: "Natural gas · diesel · emergency operation · grid independence",
    detail:
      "Dispatchable generation adds controllable power for emergency operation, extended outages, utility constraints, and higher independence requirements.",
    defaultVal: 3,
    unit: "hr",
    color: P.green,
    sliderLabel: "Backup Runtime",
    sliderMin: 1,
    sliderMax: 12,
    sliderStep: 1,
    bulletPoint:
      "Determines whether backup power is a compliance item, a resilience strategy, or a path toward grid independence.",
  },
  {
    id: "flexible",
    label: "Flexible Loads",
    code: "L05",
    sub: "EV charging · HVAC · data centers · manufacturing",
    detail:
      "Flexible loads reveal what can move, what can shed, and what can be optimized before adding more equipment. This layer often changes the economics of the entire architecture.",
    defaultVal: 85,
    unit: "%",
    color: P.blue,
    sliderLabel: "Load Flexibility",
    sliderMin: 50,
    sliderMax: 99,
    sliderStep: 1,
    bulletPoint: "Identifies operational flexibility before capital is spent on more hardware.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    code: "L06",
    sub: "Merlin · orchestration · scoring · architecture recommendation",
    detail:
      "Merlin is the orchestration layer. It ranks architecture options across cost, reliability, deployment speed, independence, and sustainability so the customer sees the right system before the quote.",
    defaultVal: 78,
    unit: "%",
    color: P.fuchsia,
    sliderLabel: "Architecture Confidence",
    sliderMin: 40,
    sliderMax: 100,
    sliderStep: 1,
    bulletPoint: "Turns individual technologies into an Energy Architecture recommendation.",
  },
];

const SCORE_FACTORS = [
  { label: "Cost", weight: "20%" },
  { label: "Reliability", weight: "20%" },
  { label: "Deployment Speed", weight: "20%" },
  { label: "Independence", weight: "20%" },
  { label: "Sustainability", weight: "20%" },
];

const ARCHITECTURE_OUTPUTS = [
  "Lowest Cost Architecture",
  "Fastest Deployment Architecture",
  "Maximum Resilience Architecture",
  "Maximum Independence Architecture",
  "Balanced Architecture",
];

function computeOutput(vals: Record<string, number>) {
  const utility = vals.utility ?? 100;
  const storage = vals.storage ?? 150;
  const generation = vals.generation ?? 250;
  const dispatchable = vals.dispatchable ?? 3;
  const flexible = vals.flexible ?? 85;
  const intelligence = vals.intelligence ?? 78;
  const hasGeneration = generation > 75;
  const hasStorage = storage > 50;
  const hasDispatchable = dispatchable >= 4;
  const arch =
    hasGeneration && hasStorage && hasDispatchable
      ? "Solar + BESS + Generator"
      : hasGeneration && hasStorage
        ? "Solar + BESS"
        : hasStorage
          ? "Utility + BESS"
          : "Utility Only";
  const cost = Math.max(
    1,
    Math.min(10, 9 - generation / 180 - storage / 450 + (100 - utility) / 45)
  );
  const reliability = Math.max(1, Math.min(10, 4.8 + storage / 95 + dispatchable * 0.55));
  const speed = Math.max(
    1,
    Math.min(10, 10 - generation / 160 - dispatchable * 0.25 + flexible / 85)
  );
  const independence = Math.max(
    1,
    Math.min(10, 1 + generation / 80 + storage / 115 + dispatchable * 0.8)
  );
  const sustainability = Math.max(
    1,
    Math.min(10, 2.5 + generation / 70 + storage / 165 - dispatchable * 0.15)
  );
  const energyScore = Math.round(
    ((cost + reliability + speed + independence + sustainability) / 5) * 10
  );
  const priority =
    energyScore >= 78
      ? "Balanced Architecture"
      : reliability >= 8
        ? "Maximum Resilience Architecture"
        : speed >= 8
          ? "Fastest Deployment Architecture"
          : cost >= 7
            ? "Lowest Cost Architecture"
            : "Maximum Independence Architecture";
  const annualValue = Math.round(
    (storage / 150) * 16500 +
      (hasGeneration ? (generation / 250) * 21000 : 0) +
      (flexible / 85) * 8500 +
      intelligence * 420
  );
  return { arch, energyScore, priority, annualValue };
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
              style={{ fontSize: 15, color: P.textSub, lineHeight: 1.65, margin: 0, maxWidth: 680 }}
            >
              Energy Stacking is the process of combining multiple energy resources into a single
              optimized architecture that balances cost, reliability, deployment speed, resilience,
              independence, and sustainability.
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 16,
            marginBottom: 28,
          }}
          className="es-grid"
        >
          <div
            style={{
              border: `1px solid ${P.border}`,
              borderRadius: 16,
              background: "rgba(17,26,62,0.62)",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: P.fuchsia,
                marginBottom: 10,
              }}
            >
              The Energy Stacking Score
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
                gap: 8,
              }}
            >
              {SCORE_FACTORS.map((factor) => (
                <div
                  key={factor.label}
                  style={{
                    border: `1px solid ${P.border}`,
                    borderRadius: 10,
                    background: P.panelDeep,
                    padding: "10px 8px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: P.text, lineHeight: 1.2 }}>
                    {factor.label}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11, color: P.green, fontWeight: 800 }}>
                    {factor.weight}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              border: `1px solid rgba(130,100,255,0.28)`,
              borderRadius: 16,
              background: "linear-gradient(145deg, rgba(79,138,255,0.10), rgba(124,58,237,0.12))",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: P.blue,
                marginBottom: 10,
              }}
            >
              Merlin ranks architectures
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ARCHITECTURE_OUTPUTS.map((outputLabel) => (
                <span
                  key={outputLabel}
                  style={{
                    border: `1px solid rgba(255,255,255,0.10)`,
                    borderRadius: 999,
                    background: "rgba(8,13,36,0.62)",
                    color: P.textSub,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "6px 10px",
                  }}
                >
                  {outputLabel}
                </span>
              ))}
            </div>
          </div>
        </div>

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

        {/* ── ENERGY ARCHITECTURE OUTPUT strip ────────────────────── */}
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
                Energy Architecture Output
              </div>
              <div style={{ fontSize: 11, color: P.textSub, maxWidth: 200, lineHeight: 1.4 }}>
                Merlin translates layered resources into a ranked architecture before the quote.
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
                label: "Architecture Score",
                value: `${output.energyScore}/100`,
                color: P.green,
                size: 20,
              },
              {
                label: "Recommended Lens",
                value: output.priority,
                color: P.amber,
                size: 14,
              },
              {
                label: "Financial Outcome",
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
