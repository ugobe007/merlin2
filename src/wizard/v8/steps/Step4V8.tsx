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
  amber: "#f59e0b",
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
          Review your system components, then use the strategy slider to balance cost vs.
          resilience. When the financial model reflects your goals, confirm your stack to see your
          full quote.
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
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(245,158,11,0.07)",
                  border: `1px solid rgba(245,158,11,0.28)`,
                  borderRadius: 8,
                  color: C.amber,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "8px 14px",
                  width: "100%",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(245,158,11,0.14)";
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(245,158,11,0.07)";
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.28)";
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
              border: "1.5px solid rgba(245,158,11,0.35)",
              background: "rgba(245,158,11,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <SectionLabel>Optimization Strategy</SectionLabel>
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
              Drag the slider to adjust your energy stack optimization — shift left for faster
              payback, right for maximum grid resilience.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: C.amber,
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
              style={{ width: "100%", accentColor: C.amber, cursor: "pointer", height: 6 }}
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
            style={{ border: `1px solid ${C.purpleBorder}`, background: "rgba(155,109,255,0.05)" }}
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

      <div
        style={{
          marginTop: 28,
          padding: "20px 24px",
          borderRadius: 14,
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,138,255,0.08) 100%)",
          border: "1.5px solid rgba(124,58,237,0.35)",
          display: "flex",
          flexDirection: "column" as const,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(124,58,237,0.18)",
              border: "1px solid rgba(124,58,237,0.40)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 16,
            }}
          >
            ✅
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3 }}>
              Ready to confirm your stack?
            </div>
            <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.55 }}>
              Once confirmed, Merlin generates your full TrueQuote™ — including financing options,
              incentives, and matched installer recommendations.
            </div>
          </div>
        </div>
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
            width: "100%",
            padding: "15px 32px",
            borderRadius: 10,
            background: "transparent",
            border: `2px solid #7c3aed`,
            color: "#c4b5fd",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 0 20px rgba(124,58,237,0.22)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#9b6dff";
            e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.40)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.22)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>Confirm Your Energy Stack</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p style={{ fontSize: 11, color: C.textMuted, textAlign: "center" as const, margin: 0 }}>
          You can revisit and adjust your stack at any time before finalizing.
        </p>
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
