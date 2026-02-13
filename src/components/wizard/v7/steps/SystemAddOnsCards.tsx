/**
 * SYSTEM ADD-ONS CARDS — Solar / EV Charging / Generator
 * =====================================================
 * Rich preset card system with Starter / Recommended / Maximum tiers.
 * This is the V7 adaptation of V6's Step4Options design.
 *
 * SSOT: Uses step4PreviewService for all preview calculations.
 * Integration: Calls recalculateWithAddOns() to update the quote.
 *
 * Feb 2026 — Restored from V6 OptionCard + TierCard design.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { SystemAddOns, PricingStatus, WizardState } from "@/wizard/v7/hooks/useWizardV7";
import {
  calculateSolarPreview,
  calculateEvPreview,
  calculateGeneratorPreview,
} from "@/services/step4PreviewService";

// ============================================================================
// TYPES
// ============================================================================

interface SolarTier {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  coveragePercent: number;
  panelCount: number;
  annualProductionKwh: number;
  annualSavings: number;
  installCost: number;
  netCostAfterITC: number;
  paybackYears: number;
  co2OffsetTons: number;
  tag?: string;
}

interface EvTier {
  name: string;
  l2Count: number;
  dcfcCount: number;
  totalPowerKw: number;
  chargersLabel: string;
  carsPerDay: string;
  monthlyRevenue: number;
  installCost: number;
  tenYearRevenue: number;
  tag?: string;
}

interface GeneratorTier {
  name: string;
  sizeKw: number;
  sizeLabel: string;
  fuelType: string;
  runtimeHours: number;
  installCost: number;
  netCostAfterITC: number;
  annualMaintenance: number;
  coverage: string;
  tag?: string;
}

type Metric = {
  label: string;
  value: string;
  highlight?: boolean;
  color?: "emerald" | "amber" | "cyan" | "red";
};

// ============================================================================
// SSOT CALCULATION WRAPPERS
// ============================================================================

function calcSolar(name: string, pct: number, usage: number, sun: number): SolarTier {
  const result = calculateSolarPreview(
    { annualUsageKwh: usage, sunHoursPerDay: sun, coveragePercent: pct },
    name
  );
  return { ...result };
}

function calcEv(name: string, l2: number, dc: number): EvTier {
  const result = calculateEvPreview({ l2Count: l2, dcfcCount: dc }, name);
  return { ...result };
}

function calcGen(
  name: string,
  kw: number,
  fuel: "diesel" | "natural-gas"
): GeneratorTier {
  const result = calculateGeneratorPreview({ sizeKw: kw, fuelType: fuel }, name);
  return { ...result };
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

// ============================================================================
// ACCENT PALETTE
// ============================================================================

const ACCENT = {
  amber: {
    ring: "rgba(251,191,36,0.5)",
    border: "rgba(251,191,36,0.3)",
    bg: "rgba(251,191,36,0.08)",
    text: "#fbbf24",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  cyan: {
    ring: "rgba(6,182,212,0.5)",
    border: "rgba(6,182,212,0.3)",
    bg: "rgba(6,182,212,0.08)",
    text: "#06b6d4",
    gradient: "linear-gradient(135deg, #06b6d4, #0284c7)",
  },
  red: {
    ring: "rgba(239,68,68,0.5)",
    border: "rgba(239,68,68,0.3)",
    bg: "rgba(239,68,68,0.08)",
    text: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
} as const;

type AccentKey = keyof typeof ACCENT;

const TAG_COLORS: Record<string, string> = {
  "Best ROI": "rgba(139,92,246,0.9)",
  "Max Savings": "rgba(6,182,212,0.9)",
  "Most Popular": "rgba(139,92,246,0.9)",
  "EV Destination": "rgba(6,182,212,0.9)",
  Recommended: "rgba(139,92,246,0.9)",
  "Full Coverage": "rgba(239,68,68,0.9)",
};

const HIGHLIGHT_COLORS: Record<string, string> = {
  emerald: "#34d399",
  amber: "#fbbf24",
  cyan: "#22d3ee",
  red: "#f87171",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SystemAddOnsCardsProps {
  state: WizardState;
  currentAddOns: SystemAddOns;
  onRecalculate?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
  pricingStatus: PricingStatus;
  showGenerateButton?: boolean;
  /** Merlin Memory data — preferred over state.quote for cross-step reads */
  merlinData?: {
    peakLoadKW: number;
    energyKWhPerDay: number;
    peakSunHours: number;
    industry: string;
  };
}

export function SystemAddOnsCards({
  state,
  currentAddOns,
  onRecalculate,
  pricingStatus,
  showGenerateButton: _showGenerateButton = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  merlinData,
}: SystemAddOnsCardsProps) {
  // Selections
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (currentAddOns.includeSolar) s.add("solar");
    if (currentAddOns.includeGenerator) s.add("generator");
    return s;
  });
  const [solarTier, setSolarTier] = useState<string>("recommended");
  const [evTier, setEvTier] = useState<string>("standard");
  const [generatorTier, setGeneratorTier] = useState<string>("standard");
  // ✅ All cards start expanded by default
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set(["solar", "ev", "generator"]));
  const [busy, setBusy] = useState(false);

  // ── Auto-apply add-on changes (Feb 11, 2026) ──
  // When user toggles an option or changes a tier, auto-recalculate after a brief debounce
  const autoApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Skip auto-apply on first render (initial state matches currentAddOns)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!onRecalculate || busy || pricingStatus === "pending") return;

    // Clear previous timer
    if (autoApplyTimerRef.current) clearTimeout(autoApplyTimerRef.current);

    autoApplyTimerRef.current = setTimeout(async () => {
      const addOns: SystemAddOns = {
        includeSolar: selectedOptions.has("solar"),
        solarKW: selectedOptions.has("solar") ? (curSolar?.sizeKw ?? 0) : 0,
        includeGenerator: selectedOptions.has("generator"),
        generatorKW: selectedOptions.has("generator") ? (curGen?.sizeKw ?? 0) : 0,
        generatorFuelType: curGen?.fuelType === "Diesel" ? "diesel" : "natural-gas",
        includeWind: false,
        windKW: 0,
      };
      if (selectedOptions.has("ev") && curEv) {
        addOns.solarKW = Math.max(addOns.solarKW, curEv.totalPowerKw);
      }
      setBusy(true);
      await onRecalculate(addOns);
      setBusy(false);
    }, 600);

    return () => {
      if (autoApplyTimerRef.current) clearTimeout(autoApplyTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions, solarTier, evTier, generatorTier]);

  // ✅ MERLIN MEMORY: Pull from Memory first, fall back to state
  const peakLoadKW = merlinData?.peakLoadKW || state.quote?.peakLoadKW || 300;
  const energyKWhDay = merlinData?.energyKWhPerDay || state.quote?.energyKWhPerDay || peakLoadKW * 10;
  const annualUsageKwh = energyKWhDay * 365;
  const sunHours = merlinData?.peakSunHours || state.locationIntel?.peakSunHours || 5.5;
  const industryLabel =
    (merlinData?.industry || state.industry || "")
      .replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    || "Commercial";

  // ── Compute tiers ──
  const solarOpts = useMemo(
    () => ({
      starter: calcSolar("Starter", 0.15, annualUsageKwh, sunHours),
      recommended: {
        ...calcSolar("Recommended", 0.3, annualUsageKwh, sunHours),
        tag: "Best ROI",
      },
      maximum: {
        ...calcSolar("Maximum", 0.5, annualUsageKwh, sunHours),
        tag: "Max Savings",
      },
    }),
    [annualUsageKwh, sunHours]
  );

  const evOpts = useMemo(
    () => ({
      basic: calcEv("Basic", 4, 0),
      standard: { ...calcEv("Standard", 6, 2), tag: "Most Popular" },
      premium: { ...calcEv("Premium", 8, 4), tag: "EV Destination" },
    }),
    []
  );

  const genOpts = useMemo(
    () => ({
      essential: calcGen("Essential", 150, "diesel"),
      standard: { ...calcGen("Standard", 300, "natural-gas"), tag: "Recommended" },
      full: {
        ...calcGen(
          "Full Backup",
          Math.round((peakLoadKW * 1.1) / 50) * 50 || 500,
          "natural-gas"
        ),
        tag: "Full Coverage",
      },
    }),
    [peakLoadKW]
  );

  // Current selections
  const curSolar = selectedOptions.has("solar")
    ? solarOpts[solarTier as keyof typeof solarOpts]
    : null;
  const curEv = selectedOptions.has("ev")
    ? evOpts[evTier as keyof typeof evOpts]
    : null;
  const curGen = selectedOptions.has("generator")
    ? genOpts[generatorTier as keyof typeof genOpts]
    : null;

  // 10-year combined value
  const tenYearValue = // eslint-disable-line @typescript-eslint/no-unused-vars
    (curSolar ? curSolar.annualSavings * 10 : 0) +
    (curEv ? curEv.tenYearRevenue : 0);

  // Max potential for stats
  const maxSolarSavings = solarOpts.maximum.annualSavings;
  const maxEvRevenue = evOpts.premium.monthlyRevenue * 12; // eslint-disable-line @typescript-eslint/no-unused-vars

  // ── Toggle handler ──
  const toggleOption = useCallback(
    (id: string) => {
      setSelectedOptions((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
          // Auto-expand when first selected
          setExpandedCards(prev => new Set(prev).add(id));
        }
        return next;
      });
    },
    []
  );

  // ── Apply selections → recalculateWithAddOns ──
  const handleApply = useCallback(async () => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!onRecalculate || busy) return;
    setBusy(true);

    const addOns: SystemAddOns = {
      includeSolar: selectedOptions.has("solar"),
      solarKW: curSolar?.sizeKw ?? 0,
      includeGenerator: selectedOptions.has("generator"),
      generatorKW: curGen?.sizeKw ?? 0,
      generatorFuelType:
        curGen?.fuelType === "Diesel" ? "diesel" : "natural-gas",
      includeWind: false,
      windKW: 0,
    };

    // Include EV as solar capacity bump (EV chargers drive solar sizing up)
    if (selectedOptions.has("ev") && curEv) {
      addOns.solarKW = Math.max(addOns.solarKW, curEv.totalPowerKw);
    }

    await onRecalculate(addOns);
    setBusy(false);
  }, [onRecalculate, busy, selectedOptions, curSolar, curGen, curEv]);

  // Has changes that need applying?
  const needsApply = // eslint-disable-line @typescript-eslint/no-unused-vars
    selectedOptions.has("solar") !== currentAddOns.includeSolar ||
    (curSolar?.sizeKw ?? 0) !== currentAddOns.solarKW ||
    selectedOptions.has("generator") !== currentAddOns.includeGenerator ||
    (curGen?.sizeKw ?? 0) !== currentAddOns.generatorKW;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Option Cards */}
      <div style={{ display: "grid", gap: 12 }}>
        {/* ── SOLAR ── */}
        <OptionCard
          id="solar"
          icon="☀️"
          iconGradient={ACCENT.amber.gradient}
          title="Add Solar Array"
          subtitle={`${industryLabel} facilities with solar see 15-25% energy cost reduction`}
          badge="High Opportunity"
          badgeColor="rgba(52,211,153,0.9)"
          badgeBg="rgba(52,211,153,0.12)"
          value={curSolar ? fmtUSD(curSolar.annualSavings) : fmtUSD(maxSolarSavings)}
          valueLabel={curSolar ? "Selected" : "Up to"}
          valueSuffix="/yr"
          accent="amber"
          isSelected={selectedOptions.has("solar")}
          isExpanded={expandedCards.has("solar")}
          onToggle={() => toggleOption("solar")}
          onExpand={() => setExpandedCards(prev => { const n = new Set(prev); if (n.has("solar")) { n.delete("solar"); } else { n.add("solar"); } return n; })}
        >
          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(232,235,243,0.5)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📈 Choose configuration based on {(annualUsageKwh / 1e6).toFixed(2)}M kWh usage:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["starter", "recommended", "maximum"] as const).map((k) => {
                const o = solarOpts[k];
                return (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={solarTier === k && selectedOptions.has("solar")}
                    onClick={() => {
                      setSolarTier(k);
                      if (!selectedOptions.has("solar")) toggleOption("solar");
                    }}
                    accent="amber"
                    metrics={[
                      { label: "Coverage", value: `${Math.round(o.coveragePercent * 100)}%` },
                      { label: "Production", value: `${o.annualProductionKwh.toLocaleString()} kWh` },
                      { label: "Savings", value: fmtUSD(o.annualSavings), highlight: true, color: "emerald" },
                      { label: "Payback", value: `${o.paybackYears} years` },
                      { label: "Cost", value: fmtUSD(o.installCost) },
                      { label: "After ITC", value: fmtUSD(o.netCostAfterITC), highlight: true, color: "amber" },
                    ]}
                  />
                );
              })}
            </div>
          </div>
        </OptionCard>

        {/* ── EV CHARGING ── */}
        <OptionCard
          id="ev"
          icon="⚡"
          iconGradient={ACCENT.cyan.gradient}
          title="Add EV Charging"
          subtitle="Properties with EV charging report 23% higher occupancy & revenue"
          badge="Revenue Generator"
          badgeColor="rgba(52,211,153,0.9)"
          badgeBg="rgba(52,211,153,0.12)"
          value={
            curEv
              ? fmtK(curEv.tenYearRevenue)
              : fmtK(evOpts.premium.tenYearRevenue) + "+"
          }
          valueLabel={curEv ? "10yr Revenue" : "Up to 10yr"}
          accent="cyan"
          isSelected={selectedOptions.has("ev")}
          isExpanded={expandedCards.has("ev")}
          onToggle={() => toggleOption("ev")}
          onExpand={() => setExpandedCards(prev => { const n = new Set(prev); if (n.has("ev")) { n.delete("ev"); } else { n.add("ev"); } return n; })}
        >
          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(232,235,243,0.5)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⚡ Choose charging setup for your {industryLabel.toLowerCase()} property:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["basic", "standard", "premium"] as const).map((k) => {
                const o = evOpts[k];
                return (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={evTier === k && selectedOptions.has("ev")}
                    onClick={() => {
                      setEvTier(k);
                      if (!selectedOptions.has("ev")) toggleOption("ev");
                    }}
                    accent="cyan"
                    sizeLabel={o.chargersLabel}
                    metrics={[
                      { label: "Power", value: `${o.totalPowerKw} kW` },
                      { label: "Cars/Day", value: o.carsPerDay },
                      { label: "Monthly Rev", value: fmtUSD(o.monthlyRevenue), highlight: true, color: "emerald" },
                      { label: "Install Cost", value: fmtUSD(o.installCost) },
                      { label: "10yr Revenue", value: fmtK(o.tenYearRevenue), highlight: true, color: "cyan" },
                    ]}
                  />
                );
              })}
            </div>
            {/* Charger Types Info */}
            <div
              style={{
                marginTop: 14,
                padding: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(232,235,243,0.7)", marginBottom: 10 }}>
                ⚡ Charger Types
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 11 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#06b6d4" }}>Level 2 (L2)</div>
                  <div style={{ color: "rgba(232,235,243,0.4)" }}>7.7 kW • 4-8 hr charge</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#06b6d4" }}>DC Fast (DCFC)</div>
                  <div style={{ color: "rgba(232,235,243,0.4)" }}>62.5 kW • 30-60 min</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#06b6d4" }}>Revenue Est.</div>
                  <div style={{ color: "rgba(232,235,243,0.4)" }}>L2: ~$150/mo • DCFC: ~$800/mo</div>
                </div>
              </div>
            </div>
          </div>
        </OptionCard>

        {/* ── GENERATOR ── */}
        <OptionCard
          id="generator"
          icon="🔥"
          iconGradient={ACCENT.red.gradient}
          title="Backup Generator"
          subtitle="Protect against outages • Critical for 24/7 operations"
          badge="Business Continuity"
          badgeColor="rgba(251,191,36,0.9)"
          badgeBg="rgba(251,191,36,0.12)"
          value={curGen ? fmtUSD(curGen.netCostAfterITC) : fmtK(genOpts.essential.netCostAfterITC)}
          valueLabel={curGen ? "Selected" : "From"}
          accent="red"
          isSelected={selectedOptions.has("generator")}
          isExpanded={expandedCards.has("generator")}
          onToggle={() => toggleOption("generator")}
          onExpand={() => setExpandedCards(prev => { const n = new Set(prev); if (n.has("generator")) { n.delete("generator"); } else { n.add("generator"); } return n; })}
        >
          <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(232,235,243,0.5)",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🔥 Choose backup power (Peak: ~{Math.round(peakLoadKW)} kW):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {(["essential", "standard", "full"] as const).map((k) => {
                const o = genOpts[k];
                return (
                  <TierCard
                    key={k}
                    tier={o}
                    isSelected={generatorTier === k && selectedOptions.has("generator")}
                    onClick={() => {
                      setGeneratorTier(k);
                      if (!selectedOptions.has("generator")) toggleOption("generator");
                    }}
                    accent="red"
                    metrics={[
                      { label: "Coverage", value: o.coverage },
                      { label: "Fuel", value: o.fuelType },
                      { label: "Runtime", value: `${o.runtimeHours} hrs` },
                      { label: "Install", value: fmtUSD(o.installCost) },
                      { label: "After Credits", value: fmtUSD(o.netCostAfterITC), highlight: true, color: "emerald" },
                      { label: "Maintenance", value: `${fmtUSD(o.annualMaintenance)}/yr` },
                    ]}
                  />
                );
              })}
            </div>
            {/* Why Backup Info */}
            <div
              style={{
                marginTop: 14,
                padding: 14,
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 6 }}>
                ⚠️ Why Backup Power?
              </div>
              <div style={{ fontSize: 11, color: "rgba(232,235,243,0.5)" }}>
                Commercial facilities lose $5,000–15,000/hour during outages. A properly sized
                generator provides peace of mind and may qualify for insurance discounts.
              </div>
            </div>
          </div>
        </OptionCard>
      </div>

      {/* ── Selections are confirmed via shell bottom nav — no re-confirmation needed ── */}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function _StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "0 20px", flex: 1 }}>
      <div
        style={{
          fontSize: 10,
          color: "rgba(232,235,243,0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "Outfit, sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function _Divider() {
  return (
    <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
  );
}

function _SelectionItem({
  label,
  title,
  value,
  valueColor,
}: {
  label: string;
  title: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: "rgba(232,235,243,0.4)" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(232,235,243,0.95)", marginTop: 2 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// OPTION CARD — Collapsible card with Add/Remove + expand
// ============================================================================

interface OptionCardProps {
  id: string;
  icon: string;
  iconGradient: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  value: string;
  valueLabel: string;
  valueSuffix?: string;
  accent: AccentKey;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  children: React.ReactNode;
}

function OptionCard({
  icon,
  iconGradient,
  title,
  subtitle,
  badge,
  badgeColor,
  badgeBg,
  value,
  valueLabel,
  valueSuffix,
  accent,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
  children,
}: OptionCardProps) {
  const a = ACCENT[accent];

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        transition: "all 0.2s",
        border: `1px solid ${isSelected ? a.border : "rgba(255,255,255,0.08)"}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${a.ring}`
          : "none",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {/* Header */}
      <div
        onClick={onExpand}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          cursor: "pointer",
          transition: "background 0.2s",
          background: isSelected ? a.bg : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Icon */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: iconGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "none",
            }}
          >
            {icon}
          </div>
          {/* Title + Badge */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "rgba(232,235,243,0.95)",
                }}
              >
                {title}
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 6,
                  background: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}33`,
                }}
              >
                {badge} ⭐
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(232,235,243,0.45)", marginTop: 3 }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Right: Value + Toggle + Chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Value */}
          <div style={{ textAlign: "right", marginRight: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(232,235,243,0.4)" }}>{valueLabel}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: isSelected ? "#34d399" : a.text,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {value}
              {valueSuffix && (
                <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(232,235,243,0.4)" }}>
                  {valueSuffix}
                </span>
              )}
            </div>
          </div>

          {/* Add/Remove Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: isSelected ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.01em",
              cursor: "pointer",
              transition: "all 0.2s",
              background: isSelected
                ? "transparent"
                : "transparent",
              color: isSelected ? "#34d399" : "rgba(232,235,243,0.5)",
              boxShadow: "none",
            }}
          >
            {isSelected ? "✓ Added" : "+ Add"}
          </button>

          {/* Chevron */}
          <span
            style={{
              fontSize: 14,
              color: "rgba(232,235,243,0.4)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Content — always shown when expanded (tiers visible for browsing) */}
      {isExpanded && children}
    </div>
  );
}

// ============================================================================
// TIER CARD — Starter / Recommended / Maximum selection
// ============================================================================

interface TierCardProps {
  tier: { name: string; sizeLabel?: string; tag?: string };
  isSelected: boolean;
  onClick: () => void;
  accent: AccentKey;
  sizeLabel?: string;
  metrics: Metric[];
}

function TierCard({
  tier,
  isSelected,
  onClick,
  accent,
  sizeLabel,
  metrics,
}: TierCardProps) {
  const a = ACCENT[accent];

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        padding: isSelected ? "13px 11px" : "14px 12px",
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.2s",
        background: isSelected
          ? `${a.bg}` : "transparent",
        border: isSelected
          ? `2px solid ${a.border}`
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isSelected ? `0 0 12px ${a.border}40` : "none",
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div style={{
          position: "absolute",
          top: 6,
          left: 6,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: a.border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#fff",
          fontWeight: 900,
        }}>✓</div>
      )}

      {/* Tag */}
      {tier.tag && (
        <div
          style={{
            position: "absolute",
            top: -9,
            right: 10,
            padding: "2px 8px",
            borderRadius: 6,
            background: TAG_COLORS[tier.tag] ?? "rgba(139,92,246,0.9)",
            fontSize: 9,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          {tier.tag}
        </div>
      )}

      {/* Name */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(232,235,243,0.5)" }}>
        {tier.name}
      </div>

      {/* Size */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: a.text,
          margin: "6px 0",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {sizeLabel ?? tier.sizeLabel ?? "—"}
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gap: 5, fontSize: 11 }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "rgba(232,235,243,0.4)" }}>{m.label}</span>
            <span
              style={{
                fontWeight: 700,
                color: m.highlight
                  ? HIGHLIGHT_COLORS[m.color ?? "emerald"]
                  : "rgba(232,235,243,0.7)",
              }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SystemAddOnsCards;
