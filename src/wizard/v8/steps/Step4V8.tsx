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
  panel: "rgba(255,255,255,0.03)",
  panelBorder: "rgba(255,255,255,0.08)",
  text: "rgba(232,235,243,0.96)",
  textSub: "rgba(232,235,243,0.55)",
  textMuted: "rgba(232,235,243,0.32)",
  purple: "#8B5CF6",
  purpleSoft: "rgba(139,92,246,0.08)",
  purpleBorder: "rgba(139,92,246,0.35)",
  amber: "#F59E0B",
  sky: "#38BDF8",
  green: "#34D399",
  red: "#F87171",
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color: C.textMuted,
        marginBottom: 10,
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
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}
      >
        <span style={{ color: C.textSub }}>{label}</span>
        <span style={{ color: barColor, fontWeight: 600 }}>{textLabel}</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${goodness}%`,
            background: barColor,
            borderRadius: 3,
            transition: "width 0.4s ease",
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
    <div style={{ marginBottom: 10 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}
      >
        <span style={{ color: C.textSub }}>{label}</span>
        <span style={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" as const }}>
          {fmt$(amount)}
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
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

  const evSpec =
    level2Chargers > 0 && dcfcChargers > 0
      ? `${level2Chargers} L2 · ${dcfcChargers} DCFC`
      : level2Chargers > 0
        ? `${level2Chargers} × L2`
        : dcfcChargers > 0
          ? `${dcfcChargers} × DCFC`
          : "Configured";

  const industryLabel = industry?.replace(/_/g, " ") ?? "your facility";

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 4px 40px", color: C.text }}>
      <div style={{ marginBottom: 28, paddingTop: 4 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: C.purple,
            marginBottom: 6,
          }}
        >
          Energy Stacking™
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: C.text,
            margin: 0,
            letterSpacing: "-0.4px",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Build Your Energy Stack™
        </h1>
        <p
          style={{ fontSize: 13, color: C.textSub, marginTop: 6, lineHeight: 1.55, maxWidth: 600 }}
        >
          Adjust the optimization strategy and watch your financial model update in real time.
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}
        className="stack-builder-grid"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel>
            <SectionLabel>Stack Components</SectionLabel>
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
                  background: "transparent",
                  border: "none",
                  color: C.textMuted,
                  fontSize: 11,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                ← Adjust component scope
              </button>
            </div>
          </Panel>

          <Panel>
            <SectionLabel>Optimization Strategy</SectionLabel>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 8,
                fontWeight: 600,
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
              style={{ width: "100%", accentColor: C.purple, cursor: "pointer" }}
            />
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 10,
                background: C.purpleSoft,
                border: `1px solid ${C.purpleBorder}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 4 }}>
                {strategyInfo.label}
              </div>
              <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>
                {strategyInfo.sub}
              </div>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}
            >
              {[
                { label: "BESS", value: `${tier.bessKWh} kWh` },
                { label: "Solar", value: tier.solarKW > 0 ? `${tier.solarKW} kW` : "—" },
                {
                  label: "Generator",
                  value: tier.generatorKW > 0 ? `${tier.generatorKW} kW` : "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.panelBorder}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    textAlign: "center" as const,
                  }}
                >
                  <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>{label}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.text,
                      fontVariantNumeric: "tabular-nums" as const,
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
            style={{ border: `1px solid ${C.purpleBorder}`, background: "rgba(139,92,246,0.05)" }}
          >
            <SectionLabel>Live Financial Model</SectionLabel>
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
            <SectionLabel>Stack Cost Breakdown</SectionLabel>
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
            <SectionLabel>Stack Tradeoffs</SectionLabel>
            <TradeoffRow label="Peak Grid Exposure" value={tradeoffs.peakExposure} invert />
            <TradeoffRow label="Grid Independence" value={tradeoffs.gridIndependence} />
            <TradeoffRow label="Savings Potential" value={tradeoffs.savingsPotential} />
          </Panel>
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => {
            void trackWizardEvent("stack_confirmed", {
              tierIndex: tierIdx,
              strategy: strategyInfo.label,
              annualSavings: tier.annualSavings,
              netCost: tier.netCost,
            });
            actions.goToStep(6 as WizardStep);
          }}
          style={{
            padding: "14px 32px",
            borderRadius: 10,
            background: "transparent",
            border: `1.5px solid ${C.purple}`,
            color: C.purple,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.20)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Deploy Your Stack →
        </button>
      </div>

      <style>
        {
          "@media (max-width: 720px) { .stack-builder-grid { grid-template-columns: 1fr !important; } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
        }
      </style>
    </div>
  );
}

export default Step4V8;
