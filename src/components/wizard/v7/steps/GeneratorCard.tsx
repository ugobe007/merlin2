/**
 * GENERATOR CARD — Step 4 core quote option
 * ==========================================
 * Generator = part of the core BESS quote (additional power when needed).
 * Simple: enabled toggle + 3 size tiers. No solar/EV complexity here.
 *
 * Solar, Wind, EV are post-quote add-ons shown in Step 6.
 *
 * Feb 2026 — Extracted from SystemAddOnsCards as dedicated component.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import type { SystemAddOns, WizardState } from "@/wizard/v7/hooks/useWizardV7";
import { TrueQuoteTemp } from "@/wizard/v7/trueQuoteTemp";

// ── Types ──────────────────────────────────────────────────────────────────

interface GenTier {
  key: "essential" | "standard" | "full";
  name: string;
  sizeKw: number;
  tag?: string;
  coverage: string;
  fuelType: string;
  runtimeHours: number;
  installCost: number;
  netCostAfterITC: number;
  annualMaintenance: number;
}

interface GeneratorCardProps {
  state: WizardState;
  peakLoadKW: number;
  /** Industry-calculated critical load kW (from getCriticalLoadWithSource in Step4). */
  criticalLoadKW?: number;
  /** Industry slug — drives default fuel type and coverage copy. */
  industryType?: string;
  currentAddOns: SystemAddOns;
  onRecalculate?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// Hospitals and life-safety facilities use diesel for proven reliability in emergencies.
// All others default to natural gas — quieter, lower emissions, better for customer-facing.
const INDUSTRY_FUEL_DEFAULTS: Record<string, "diesel" | "natural-gas"> = {
  hospital: "diesel",
  healthcare: "diesel",
  default: "natural-gas",
};

function calcGen(key: GenTier["key"], sizeKw: number, fuelType: "diesel" | "natural-gas"): GenTier {
  const perKw = fuelType === "diesel" ? 800 : 700;
  const installCost = Math.round(sizeKw * perKw);
  const names: Record<GenTier["key"], string> = {
    essential: "Essential",
    standard: "Recommended",
    full: "Full Backup",
  };
  // Coverage copy is tied to what the tier means, not a raw ratio
  const coverageText: Record<GenTier["key"], string> = {
    essential: "Critical systems only",
    standard: "Critical + 25% reserve",
    full: "Full facility coverage",
  };
  const tags: Partial<Record<GenTier["key"], string>> = { standard: "✦ Merlin Pick" };
  return {
    key,
    name: names[key],
    sizeKw,
    tag: tags[key],
    coverage: coverageText[key],
    fuelType: fuelType === "diesel" ? "Diesel" : "Natural Gas",
    runtimeHours: 72,
    installCost,
    netCostAfterITC: Math.round(installCost * 0.7), // 30% ITC
    annualMaintenance: Math.round(sizeKw * 15),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export function GeneratorCard({
  peakLoadKW,
  criticalLoadKW = 0,
  industryType = "default",
  currentAddOns,
  onRecalculate,
}: GeneratorCardProps) {
  // ── State (TrueQuoteTemp-first init: survives any parent re-render race) ──
  const [enabled, setEnabled] = useState<boolean>(() => {
    const tqt = TrueQuoteTemp.get();
    return tqt.updatedAt > 0 ? tqt.includeGenerator : (currentAddOns.includeGenerator ?? false);
  });
  const [tier, setTier] = useState<GenTier["key"]>("standard");
  const [isExpanded, setIsExpanded] = useState(true);
  // Brief confirmation state: shows '✓ Added to quote' for 1.5s after a tier click
  const [confirmingTier, setConfirmingTier] = useState<GenTier["key"] | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRef = useRef(true);

  // ── Tier options — sized to actual critical load (IEEE 446 method) ──
  // - Essential  = critical load only (no reserve)
  // - Recommended = critical load × 1.25 (25% reserve per IEEE 446 / WPP Guide)
  // - Full Backup = full facility (peak × 1.1)
  // Falls back to 40% of peak if criticalLoadKW not yet available.
  const tiers = useMemo((): Record<GenTier["key"], GenTier> => {
    const base = criticalLoadKW > 0 ? criticalLoadKW : Math.round(peakLoadKW * 0.4);
    const essentialKw = Math.max(50, Math.round(base / 50) * 50);
    const standardKw = Math.max(100, Math.round((base * 1.25) / 50) * 50);
    const fullKw = Math.max(300, Math.round((peakLoadKW * 1.1) / 50) * 50);
    const fuel = INDUSTRY_FUEL_DEFAULTS[industryType] ?? "natural-gas";
    return {
      essential: calcGen("essential", essentialKw, fuel),
      standard: calcGen("standard", standardKw, fuel),
      full: calcGen("full", fullKw, fuel),
    };
  }, [peakLoadKW, criticalLoadKW, industryType]);

  // Refs so the useEffect dep array stays stable — prevents render loop when
  // peakLoadKW fluctuates (which creates new tiers objects) or when the parent
  // recreates onRecalculate (when itcBonuses/actions change).
  const tiersRef = useRef(tiers);
  tiersRef.current = tiers;
  const onRecalculateRef = useRef(onRecalculate);
  onRecalculateRef.current = onRecalculate;

  const curTier = tiers[tier];

  // ── Write TrueQuoteTemp synchronously ──
  // Explicit set of every add-on field — no ...tqt spread.
  // Spreading tqt would silently preserve stale includeEV/includeSolar
  // values from a previous session, which leaks into Step 5's snapshot.
  function writeTQT(nextEnabled: boolean, nextTier: GenTier["key"]) {
    const t = tiers[nextTier];
    TrueQuoteTemp.writeAddOns({
      includeSolar: false,
      solarKW: 0,
      includeGenerator: nextEnabled,
      generatorKW: nextEnabled ? t.sizeKw : 0,
      generatorFuelType: t.fuelType === "Diesel" ? "diesel" : "natural-gas",
      includeWind: false,
      windKW: 0,
      includeEV: false,
      evChargerKW: 0,
      evInstallCost: 0,
      evMonthlyRevenue: 0,
    });
  }

  // ── Debounced recalculate — only fires on real user interaction ──
  // tiers + onRecalculate accessed via refs; NOT in dep array.
  // This prevents the loop: peakLoadKW change → new tiers ref → effect fires
  // → recalculate → new peakLoadKW → new tiers ref → repeat.
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    if (!onRecalculateRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const t = tiersRef.current[tier];
    timerRef.current = setTimeout(async () => {
      await onRecalculateRef.current!({
        includeSolar: false,
        solarKW: 0,
        includeGenerator: enabled,
        generatorKW: enabled ? t.sizeKw : 0,
        generatorFuelType: t.fuelType === "Diesel" ? "diesel" : "natural-gas",
        includeWind: false,
        windKW: 0,
        includeEV: false,
        evChargerKW: 0,
      });
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, tier]); // Only user-interaction deps — no tiers/onRecalculate

  // ── Handlers ──
  function handleToggle() {
    const next = !enabled;
    writeTQT(next, tier); // synchronous before state update
    setEnabled(next);
  }

  function handleTierClick(k: GenTier["key"]) {
    writeTQT(true, k); // selecting a tier implicitly enables
    setTier(k);
    if (!enabled) setEnabled(true);
    // Show '✓ Added to quote' confirmation for 1.5 s
    setConfirmingTier(k);
    setTimeout(() => setConfirmingTier((prev) => (prev === k ? null : prev)), 1500);
  }

  // ── Render ──
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${enabled ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: enabled ? "0 0 0 1px rgba(239,68,68,0.15)" : "none",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded((x) => !x)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px",
          cursor: "pointer",
          background: enabled ? "rgba(239,68,68,0.06)" : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(135deg,#ef4444,#b91c1c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🔋
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(232,235,243,0.95)" }}>
                Backup Generator
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 6,
                  background: "rgba(239,68,68,0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                OPTIONAL ⭐
              </span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(232,235,243,0.45)", marginTop: 3 }}>
              Sized to your{" "}
              {criticalLoadKW > 0
                ? `${criticalLoadKW.toLocaleString()} kW critical load`
                : "industry standard critical load"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right", marginRight: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(232,235,243,0.4)" }}>Install cost</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: enabled ? "#34d399" : "rgba(248,113,113,0.8)",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {fmtUSD(curTier.installCost)}
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: enabled ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.1)",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              background: "transparent",
              color: enabled ? "#34d399" : "rgba(232,235,243,0.5)",
            }}
          >
            {enabled ? "✓ Added" : "+ Add"}
          </button>

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

      {/* Tier selection */}
      {isExpanded && (
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ fontSize: 13, color: "rgba(232,235,243,0.5)", marginBottom: 10 }}>
            Select backup capacity — critical load{" "}
            {criticalLoadKW > 0
              ? `${criticalLoadKW.toLocaleString()} kW`
              : `~${Math.round(peakLoadKW * 0.4)} kW`}
            :
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["essential", "standard", "full"] as const).map((k) => {
              const t = tiers[k];
              const isSel = tier === k && enabled;
              const isConfirming = confirmingTier === k;
              return (
                <div
                  key={k}
                  onClick={() => handleTierClick(k)}
                  style={{
                    position: "relative",
                    padding: isSel ? "13px 11px" : "14px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: isSel
                      ? "2px solid rgba(62,207,142,0.7)" // emerald when selected
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isSel ? "rgba(62,207,142,0.06)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
                    boxShadow: isSel ? "0 0 0 1px rgba(62,207,142,0.15)" : "none",
                  }}
                >
                  {t.tag && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 9,
                        fontWeight: 800,
                        background:
                          t.key === "standard" ? "rgba(62,207,142,0.9)" : "rgba(239,68,68,0.9)",
                        color: "#fff",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.tag}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isSel ? "#34d399" : "rgba(232,235,243,0.7)",
                      marginBottom: 6,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: isSel ? "#34d399" : "rgba(232,235,243,0.9)",
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {t.sizeKw.toLocaleString()} kW
                  </div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { label: "Coverage", value: t.coverage },
                      { label: "Fuel", value: t.fuelType },
                      { label: "Runtime", value: `${t.runtimeHours} hrs` },
                      { label: "Install", value: fmtUSD(t.installCost) },
                      { label: "After ITC", value: fmtUSD(t.netCostAfterITC), highlight: true },
                      { label: "Maintenance", value: `${fmtUSD(t.annualMaintenance)}/yr` },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            color: "rgba(232,235,243,0.35)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {m.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: m.highlight ? "#34d399" : "rgba(232,235,243,0.7)",
                          }}
                        >
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Confirmation label — shows immediately on click, stays while selected */}
                  {(isSel || isConfirming) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 10,
                        padding: "5px 8px",
                        borderRadius: 6,
                        background: "rgba(62,207,142,0.1)",
                        border: "1px solid rgba(62,207,142,0.25)",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#34d399" }}>✓</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#34d399" }}>
                        Added to quote
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!enabled && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(232,235,243,0.3)",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              Toggle above to include a generator in your quote
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default GeneratorCard;
