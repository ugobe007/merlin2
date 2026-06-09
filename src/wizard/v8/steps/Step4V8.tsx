/**
 * STEP 4 — BUILD YOUR ENERGY STACK™
 * Split-pane live configurator.
 *   LEFT  — Stack components + optimization strategy slider
 *   RIGHT — Live financial model (sticky): savings, cost, payback, breakdown, tradeoffs
 *
 * Strategy slider: 0-33 → tiers[0], 34-66 → tiers[1], 67-100 → tiers[2]
 */

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { WizardActions, WizardState, WizardStep, QuoteTier } from "../wizardState";
import { trackWizardEvent } from "@/services/analyticsService";

const C = {
  panel: "#111a3e",
  panelBorder: "rgba(99,120,255,0.18)",
  text: "rgba(232,235,243,0.98)",
  textSub: "rgba(232,235,243,0.64)",
  textMuted: "rgba(232,235,243,0.42)",
  purple: "#9b6dff",
  purpleSoft: "rgba(155,109,255,0.08)",
  purpleBorder: "rgba(130,100,255,0.45)",
  amber: "#fbbf24",
  amberHot: "#f97316",
  sky: "#4f8aff",
  green: "#34d399",
  red: "#f87171",
};

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function sliderToTierIndex(v: number): 0 | 1 | 2 {
  if (v <= 33) return 0;
  if (v <= 66) return 1;
  return 2;
}

const STRATEGY: Record<0 | 1 | 2, { label: string; sub: string }> = {
  0: { label: "Cost-Focused", sub: "Smaller system, faster payback, lower upfront investment" },
  1: { label: "Balanced", sub: "Optimal mix of savings, resilience, and investment size" },
  2: {
    label: "Resilience-First",
    sub: "Maximum grid independence, peak shaving, and outage coverage",
  },
};

function deriveTradeoffs(tier: QuoteTier, peakKW: number) {
  const peakExposure = Math.max(
    0,
    Math.min(100, 100 - Math.round((tier.bessKW / Math.max(peakKW, 1)) * 120))
  );
  const solarFraction = peakKW > 0 ? Math.min(100, Math.round((tier.solarKW / peakKW) * 100)) : 0;
  const gridIndependence = Math.min(
    100,
    Math.round(solarFraction * 0.6 + (tier.bessKW > 0 ? 40 : 0))
  );
  const savingsPotential = Math.min(100, Math.round(tier.roi10Year / 4));
  return { peakExposure, gridIndependence, savingsPotential };
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        color: color ?? "rgba(232,235,243,0.90)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.panelBorder}`,
        borderRadius: 14,
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StackRow({
  icon,
  name,
  spec,
  sub,
  active,
}: {
  icon: string;
  name: string;
  spec: string;
  sub: string;
  active: boolean;
}) {
  if (!active) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 0",
        borderBottom: `1px solid ${C.panelBorder}`,
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 11, color: C.textSub }}>{sub}</div>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: C.purple,
          fontVariantNumeric: "tabular-nums" as const,
          whiteSpace: "nowrap" as const,
        }}
      >
        {spec}
      </div>
    </div>
  );
}

function TradeoffRow({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const goodness = invert ? 100 - value : value;
  const barColor = goodness >= 66 ? C.green : goodness >= 33 ? C.amber : C.red;
  const textLabel = goodness >= 66 ? "HIGH" : goodness >= 33 ? "MED" : "LOW";
  const descriptor =
    goodness >= 66
      ? invert
        ? "Well covered"
        : "Strong"
      : goodness >= 33
        ? invert
          ? "Moderate exposure"
          : "Moderate"
        : invert
          ? "High exposure"
          : "Low";
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}
      >
        <span style={{ color: C.textSub, fontWeight: 600 }}>{label}</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{textLabel}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.textMuted }}>{descriptor}</span>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${goodness}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            borderRadius: 6,
            transition: "width 0.4s ease",
            boxShadow: `0 0 10px ${barColor}66`,
          }}
        />
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  if (amount === 0) return null;
  const pct = Math.max(4, Math.min(100, Math.round((Math.abs(amount) / Math.max(total, 1)) * 100)));
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 5,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{pct}% of gross cost</div>
        </div>
        <span
          style={{
            fontSize: 13,
            color,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums" as const,
          }}
        >
          {fmt$(amount)}
        </span>
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            borderRadius: 6,
            transition: "width 0.4s ease",
            boxShadow: `0 0 10px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  state: WizardState;
  actions: WizardActions;
}

export function Step4V8({ state, actions }: Props) {
  const {
    tiers,
    tiersStatus,
    selectedTierIndex,
    wantsSolar,
    wantsEVCharging,
    wantsGenerator,
    level2Chargers,
    dcfcChargers,
    intel,
    baseLoadKW,
    peakLoadKW,
    industry,
  } = state;

  const [strategyValue, setStrategyValue] = useState<number>(() => {
    if (selectedTierIndex === 0) return 15;
    if (selectedTierIndex === 2) return 85;
    return 50;
  });
  const [stackConfirmed, setStackConfirmed] = useState(false);

  useEffect(() => {
    if (tiersStatus === "ready" && tiers && selectedTierIndex === null) {
      actions.selectTier(1);
    }
  }, [tiersStatus, tiers, selectedTierIndex, actions]);

  const handleStrategyChange = (v: number) => {
    setStrategyValue(v);
    const idx = sliderToTierIndex(v);
    actions.selectTier(idx);
    void trackWizardEvent("stack_strategy_adjusted", {
      sliderValue: v,
      tierIndex: idx,
      label: STRATEGY[idx].label,
    });
  };

  if (tiersStatus === "fetching" || tiersStatus === "idle") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          gap: 16,
          color: C.text,
        }}
      >
        <Loader2
          style={{ width: 36, height: 36, color: C.purple, animation: "spin 1s linear infinite" }}
        />
        <div style={{ fontSize: 16, fontWeight: 600 }}>Modeling your energy stack…</div>
        <div style={{ fontSize: 13, color: C.textSub }}>
          Calculating sizing, financials, and tradeoffs
        </div>
        <style>
          {
            "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
          }
        </style>
      </div>
    );
  }

  if (tiersStatus === "error" || !tiers) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center" as const,
          color: C.textSub,
          fontSize: 14,
        }}
      >
        Could not load stack model. Please go back and try again.
      </div>
    );
  }

  const tierIdx = sliderToTierIndex(strategyValue);
  const tier = tiers[tierIdx];
  const strategyInfo = STRATEGY[tierIdx];
  const peakKW = peakLoadKW || baseLoadKW || 1;
  const tradeoffs = deriveTradeoffs(tier, peakKW);

  const bd = tier.itcBasisBreakdown;
  const solarCost = bd?.solarEligible ?? (tier.solarKW > 0 ? tier.grossCost * 0.35 : 0);
  const bessCost = bd?.bessEligible ?? tier.grossCost * 0.45;
  const evCost = bd?.evChargingCost ?? 0;
  const genCost = bd?.generatorCost ?? (tier.generatorKW > 0 ? tier.grossCost * 0.15 : 0);
  const breakdownTotal = solarCost + bessCost + evCost + genCost;
  const quoteDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const evSpec =
    level2Chargers > 0 && dcfcChargers > 0
      ? `${level2Chargers} L2 · ${dcfcChargers} DCFC`
      : level2Chargers > 0
        ? `${level2Chargers} × L2`
        : dcfcChargers > 0
          ? `${dcfcChargers} × DCFC`
          : "Configured";

  const industryLabel = industry?.replace(/_/g, " ") ?? "your facility";
  const quoteId = `MER-${(industry ?? "SITE").replace(/_/g, "").slice(0, 4).toUpperCase()}-${Math.max(1, Math.round(tier.netCost / 1000))}`;
  const monthlySavings = Math.max(0, Math.round(tier.annualSavings / 12));
  const savingsDrivers = [
    {
      label: "Generate cheaper power on-site",
      text:
        tier.solarKW > 0
          ? `${tier.solarKW.toLocaleString()} kW solar offsets daytime utility energy before it hits the meter.`
          : "Solar is not included in this stack, so savings rely primarily on storage and tariff optimization.",
    },
    {
      label: "Store energy and shave peaks",
      text: `${tier.bessKWh.toLocaleString()} kWh battery storage discharges during expensive peak windows and reduces demand spikes.`,
    },
    {
      label: "Use the grid as backup, not default",
      text: `${intel?.utilityProvider ?? "The utility grid"} stays connected while Merlin shifts usage toward the lowest-cost mix of solar, storage, and grid power.`,
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "0 4px 40px",
        color: C.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          padding: "22px 24px",
          borderRadius: 18,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(17,26,62,0.86) 54%, rgba(31,20,58,0.86))",
          border: "1px solid rgba(99,120,255,0.28)",
          boxShadow: "0 22px 60px rgba(2,6,23,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
                color: C.purple,
                marginBottom: 6,
              }}
            >
              Official Energy Stack™ Quote
            </div>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: C.text,
                margin: 0,
                letterSpacing: "-0.8px",
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              }}
            >
              Merlin Energy Stack Proposal
            </h1>
            <div
              style={{
                fontSize: 16,
                color: "rgba(248,250,252,0.90)",
                marginTop: 12,
                lineHeight: 1.58,
                maxWidth: 680,
                padding: "14px 16px",
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, rgba(79,138,255,0.14), rgba(52,211,153,0.09), rgba(155,109,255,0.10))",
                border: "1px solid rgba(148,163,184,0.24)",
                boxShadow: "inset 3px 0 0 rgba(52,211,153,0.78)",
              }}
            >
              One operating system for solar, battery storage, and grid optimization — built to cut
              utility spend by{" "}
              <span style={{ color: C.green, fontWeight: 900 }}>
                {fmt$(tier.annualSavings)}/year
              </span>
              , improve peak load control, and keep {industryLabel} operations connected to
              resilient backup power.
            </div>
          </div>
          <div
            style={{
              minWidth: 190,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(2,6,23,0.28)",
              border: "1px solid rgba(148,163,184,0.14)",
              textAlign: "right" as const,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.textMuted,
                fontWeight: 800,
                letterSpacing: "0.10em",
                textTransform: "uppercase" as const,
              }}
            >
              Quote ID
            </div>
            <div style={{ fontSize: 16, color: C.text, fontWeight: 900, marginTop: 4 }}>
              {quoteId}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{quoteDate}</div>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 800, marginTop: 8 }}>
              Preliminary · Ready to select
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            marginTop: 18,
          }}
        >
          {[
            {
              label: "Annual Savings",
              value: fmt$(tier.annualSavings),
              sub: `~${fmt$(monthlySavings)}/mo`,
              color: C.green,
            },
            {
              label: "Net Investment",
              value: fmt$(tier.netCost),
              sub: `after ${Math.round(tier.itcRate * 100)}% ITC`,
              color: C.text,
            },
            {
              label: "Payback",
              value: `${tier.paybackYears.toFixed(1)} yrs`,
              sub: "simple payback",
              color: C.amber,
            },
            {
              label: "10-Year ROI",
              value: `${Math.round(tier.roi10Year)}%`,
              sub: "net return",
              color: tier.roi10Year >= 0 ? C.green : C.red,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(2,6,23,0.24)",
                border: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  marginBottom: 5,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: item.color,
                  fontWeight: 900,
                  letterSpacing: "-0.4px",
                  fontVariantNumeric: "tabular-nums" as const,
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}
        className="stack-builder-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <SectionLabel color={C.sky}>🔧 Quoted System</SectionLabel>
            <StackRow
              icon="☀️"
              name="Solar PV"
              spec={`${tier.solarKW.toLocaleString()} kW`}
              sub={`${Math.round((tier.solarKW / peakKW) * 100)}% of base load covered`}
              active={tier.solarKW > 0 && (wantsSolar ?? false)}
            />
            <StackRow
              icon="🔋"
              name="Battery Storage"
              spec={`${tier.bessKWh.toLocaleString()} kWh`}
              sub={`${tier.bessKW} kW · ${tier.durationHours}h discharge`}
              active={tier.bessKWh > 0}
            />
            <StackRow
              icon="⚡"
              name="EV Charging"
              spec={evSpec}
              sub="On-site charging infrastructure"
              active={(wantsEVCharging ?? false) && (level2Chargers > 0 || dcfcChargers > 0)}
            />
            <StackRow
              icon="🔌"
              name="Backup Generator"
              spec={`${tier.generatorKW.toLocaleString()} kW`}
              sub={`${(tier as QuoteTier & { generatorFuelType?: string }).generatorFuelType ?? "diesel"} · extended outage coverage`}
              active={(wantsGenerator ?? false) && tier.generatorKW > 0}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🏭</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                  Utility Grid
                </div>
                <div style={{ fontSize: 11, color: C.textSub }}>
                  {intel?.utilityProvider ?? "Local utility"} ·{" "}
                  {intel?.utilityRate != null
                    ? `$${intel.utilityRate.toFixed(3)}/kWh`
                    : "rate on file"}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub }}>Always on</div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}` }}>
              <button
                type="button"
                onClick={() => actions.goToStep(3.5 as WizardStep)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: `1px solid rgba(125,211,252,0.28)`,
                  borderRadius: 8,
                  color: C.sky,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "8px 14px",
                  width: "100%",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.green;
                  e.currentTarget.style.borderColor = "rgba(62,207,142,0.50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.sky;
                  e.currentTarget.style.borderColor = "rgba(125,211,252,0.28)";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M8 10L4 6.5L8 3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Change system components
              </button>
            </div>
          </Panel>

          <Panel
            style={{
              background: "linear-gradient(135deg, rgba(62,207,142,0.07), rgba(56,189,248,0.045))",
              border: "1px solid rgba(62,207,142,0.22)",
            }}
          >
            <SectionLabel color={C.green}>How this stack saves money</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savingsDrivers.map((driver, index) => (
                <div
                  key={driver.label}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      background: "rgba(62,207,142,0.12)",
                      border: "1px solid rgba(62,207,142,0.28)",
                      color: C.green,
                      fontSize: 12,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 800, marginBottom: 2 }}>
                      {driver.label}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>
                      {driver.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            style={{
              border: "1.5px solid rgba(79,138,255,0.30)",
              background: "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <SectionLabel color={C.sky}>Stack Optimization Slider</SectionLabel>
            </div>
            <p
              style={{
                fontSize: 11,
                color: C.textSub,
                lineHeight: 1.55,
                marginBottom: 12,
                marginTop: -4,
              }}
            >
              The slider changes the Energy Stack recommendation before you select the quote. Move
              left to lower system size and upfront cost; move right to increase storage coverage,
              peak shaving, and outage resilience.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                { label: "Left", text: "Lower cost", color: C.sky },
                { label: "Middle", text: "Balanced ROI", color: C.amber },
                { label: "Right", text: "More resilience", color: C.purple },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: `1px solid ${item.color}40`,
                    borderRadius: 9,
                    padding: "8px 9px",
                    background: `${item.color}0f`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: item.color,
                      fontWeight: 900,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>{item.text}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: C.textSub,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              <span>Cost-Focused</span>
              <span>Resilience-First</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={strategyValue}
              onChange={(e) => handleStrategyChange(Number(e.target.value))}
              className="amber-range"
              style={{
                width: "100%",
                background: `linear-gradient(to right, #4f8aff 0%, #9b6dff ${strategyValue}%, rgba(255,255,255,0.14) ${strategyValue}%, rgba(255,255,255,0.14) 100%)`,
              }}
            />
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 10,
                background: "transparent",
                border: `1px solid rgba(125,211,252,0.24)`,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: C.amber,
                  marginBottom: 5,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: "-0.2px",
                }}
              >
                {strategyInfo.label}
              </div>
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.55 }}>
                {strategyInfo.sub}
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}
            >
              {[
                { label: "BESS", value: `${tier.bessKWh} kWh`, color: C.purple },
                {
                  label: "Solar",
                  value: tier.solarKW > 0 ? `${tier.solarKW} kW` : "—",
                  color: C.sky,
                },
                {
                  label: "Generator",
                  value: tier.generatorKW > 0 ? `${tier.generatorKW} kW` : "—",
                  color: C.green,
                },
              ].map(({ label, value, color }) => (
                <div
                  key={`${label}-${tierIdx}`}
                  className="tier-chip-animate"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.panelBorder}`,
                    borderRadius: 8,
                    padding: "10px 10px",
                    textAlign: "center" as const,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      marginBottom: 4,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color,
                      fontVariantNumeric: "tabular-nums" as const,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "sticky",
            top: 16,
            alignSelf: "start",
          }}
        >
          <Panel
            style={{ border: `1px solid ${C.purpleBorder}`, background: "rgba(155,109,255,0.05)" }}
          >
            <SectionLabel color={C.purple}>💰 Quote Summary</SectionLabel>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
            >
              {[
                {
                  label: "Annual Savings",
                  value: fmt$(tier.annualSavings),
                  color: C.green,
                  sub: "/year net",
                },
                {
                  label: "Net Cost",
                  value: fmt$(tier.netCost),
                  color: C.text,
                  sub: `after ${Math.round(tier.itcRate * 100)}% ITC`,
                },
                {
                  label: "Payback",
                  value: `${tier.paybackYears.toFixed(1)} yrs`,
                  color: C.text,
                  sub: "simple payback",
                },
                {
                  label: "10-Year ROI",
                  value: `${Math.round(tier.roi10Year)}%`,
                  color: tier.roi10Year >= 0 ? C.green : C.red,
                  sub: "net return",
                },
              ].map(({ label, value, color, sub }) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      marginBottom: 4,
                      fontWeight: 600,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: label === "Annual Savings" || label === "Net Cost" ? 26 : 20,
                      fontWeight: 800,
                      color,
                      letterSpacing: "-0.3px",
                      fontVariantNumeric: "tabular-nums" as const,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.textMuted,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 7,
                lineHeight: 1.5,
              }}
            >
              ITC credit {fmt$(tier.itcAmount)} · Gross {fmt$(tier.grossCost)} · Based on{" "}
              {industryLabel} load profile
            </div>
          </Panel>

          <Panel>
            <SectionLabel color={C.sky}>📊 Stack Cost Breakdown</SectionLabel>
            <BreakdownRow
              label="Solar PV"
              amount={solarCost}
              total={breakdownTotal}
              color="rgba(251,191,36,0.85)"
            />
            <BreakdownRow
              label="Battery Storage"
              amount={bessCost}
              total={breakdownTotal}
              color={C.purple}
            />
            <BreakdownRow
              label="EV Charging"
              amount={evCost}
              total={breakdownTotal}
              color={C.sky}
            />
            <BreakdownRow
              label="Generator"
              amount={genCost}
              total={breakdownTotal}
              color="rgba(148,163,184,0.70)"
            />
            <div
              style={{
                borderTop: `1px solid ${C.panelBorder}`,
                marginTop: 10,
                paddingTop: 10,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span style={{ color: C.textSub }}>ITC tax credit</span>
              <span style={{ color: C.green, fontWeight: 700 }}>−{fmt$(tier.itcAmount)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 700,
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${C.panelBorder}`,
              }}
            >
              <span style={{ color: C.text }}>Net investment</span>
              <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" as const }}>
                {fmt$(tier.netCost)}
              </span>
            </div>
          </Panel>

          <Panel>
            <SectionLabel color={C.green}>⚖️ Stack Tradeoffs</SectionLabel>
            <TradeoffRow label="Peak Grid Exposure" value={tradeoffs.peakExposure} invert />
            <TradeoffRow label="Grid Independence" value={tradeoffs.gridIndependence} />
            <TradeoffRow label="Savings Potential" value={tradeoffs.savingsPotential} />
          </Panel>
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          padding: "18px 20px",
          borderRadius: 18,
          background: stackConfirmed
            ? "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(15,23,42,0.90))"
            : "linear-gradient(135deg, rgba(79,138,255,0.16), rgba(155,109,255,0.12), rgba(15,23,42,0.92))",
          border: stackConfirmed
            ? "2px solid rgba(62,207,142,0.78)"
            : "2px solid rgba(79,138,255,0.58)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap" as const,
          boxShadow: stackConfirmed
            ? "0 0 34px rgba(62,207,142,0.22), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "0 18px 45px rgba(2,6,23,0.26), 0 0 34px rgba(79,138,255,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase" as const,
              color: stackConfirmed ? C.green : C.sky,
              marginBottom: 5,
            }}
          >
            Next step
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>
            Select this Energy Stack to generate your StackQuote™
          </div>
          <div style={{ fontSize: 13.5, color: "rgba(232,235,243,0.78)", lineHeight: 1.5 }}>
            Includes financing options, incentives, and installer recommendations.
          </div>
        </div>
        <label
          onClick={() => {
            if (stackConfirmed) return;
            setStackConfirmed(true);
            void trackWizardEvent("stack_confirmed", {
              tierIndex: tierIdx,
              strategy: strategyInfo.label,
              annualSavings: tier.annualSavings,
              netCost: tier.netCost,
            });
            window.setTimeout(() => actions.goToStep(6 as WizardStep), 220);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            minWidth: 210,
            padding: "15px 24px",
            borderRadius: 999,
            background: stackConfirmed
              ? "rgba(52,211,153,0.14)"
              : "linear-gradient(135deg, #4f8aff, #9b6dff)",
            border: stackConfirmed ? `2px solid ${C.green}` : "2px solid rgba(191,219,254,0.82)",
            color: stackConfirmed ? C.green : "#ffffff",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            letterSpacing: "0.03em",
            transition: "all 0.18s ease",
            boxShadow: stackConfirmed
              ? "0 0 24px rgba(52,211,153,0.24)"
              : "0 16px 34px rgba(79,138,255,0.34), 0 0 0 4px rgba(79,138,255,0.12)",
          }}
          onMouseEnter={(e) => {
            if (!stackConfirmed) {
              e.currentTarget.style.borderColor = "rgba(209,250,229,0.95)";
              e.currentTarget.style.boxShadow =
                "0 18px 40px rgba(79,138,255,0.42), 0 0 0 5px rgba(52,211,153,0.16)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!stackConfirmed) {
              e.currentTarget.style.borderColor = "rgba(191,219,254,0.82)";
              e.currentTarget.style.boxShadow =
                "0 16px 34px rgba(79,138,255,0.34), 0 0 0 4px rgba(79,138,255,0.12)";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: `2px solid ${stackConfirmed ? C.green : "rgba(255,255,255,0.92)"}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: stackConfirmed ? C.green : "#ffffff",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {stackConfirmed ? "✓" : "→"}
          </span>
          <input type="checkbox" checked={stackConfirmed} readOnly style={{ display: "none" }} />
          <span>{stackConfirmed ? "Stack selected" : "Select Stack"}</span>
        </label>
      </div>

      <style>{`
        @media (max-width: 720px) { .stack-builder-grid { grid-template-columns: 1fr !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes chip-flash { 0% { box-shadow: 0 0 0 0 rgba(79,138,255,0.48); background: rgba(79,138,255,0.14); } 60% { box-shadow: 0 0 0 6px rgba(79,138,255,0); } 100% { background: rgba(255,255,255,0.03); box-shadow: none; } }
        .tier-chip-animate { animation: chip-flash 0.55s ease-out forwards; }
        input.amber-range { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 4px; outline: none; cursor: pointer; }
        input.amber-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 12px rgba(251,191,36,0.54), 0 2px 6px rgba(0,0,0,0.40); cursor: pointer; border: 2px solid rgba(255,255,255,0.25); transition: transform 0.15s, box-shadow 0.15s; }
        input.amber-range::-webkit-slider-thumb:hover { transform: scale(1.16); box-shadow: 0 0 18px rgba(251,191,36,0.72), 0 2px 8px rgba(0,0,0,0.50); }
        input.amber-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 12px rgba(251,191,36,0.54); cursor: pointer; border: 2px solid rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
}

export default Step4V8;
