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

function calcGen(key: GenTier["key"], sizeKw: number, fuelType: string, peakKW: number): GenTier {
  const coveragePct = peakKW > 0 ? sizeKw / peakKW : 0;
  const coverage =
    coveragePct >= 0.9
      ? "Full facility backup"
      : coveragePct >= 0.5
        ? "Partial backup"
        : "Essential loads only";
  const perKw = fuelType === "diesel" ? 800 : 700;
  const installCost = Math.round(sizeKw * perKw);
  const names: Record<GenTier["key"], string> = {
    essential: "Essential",
    standard: "Standard",
    full: "Full Backup",
  };
  const tags: Partial<Record<GenTier["key"], string>> = { standard: "Recommended" };
  return {
    key,
    name: names[key],
    sizeKw,
    tag: tags[key],
    coverage,
    fuelType: fuelType === "diesel" ? "Diesel" : "Natural Gas",
    runtimeHours: 72,
    installCost,
    netCostAfterITC: Math.round(installCost * 0.7), // 30% ITC
    annualMaintenance: Math.round(sizeKw * 15),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export function GeneratorCard({ peakLoadKW, currentAddOns, onRecalculate }: GeneratorCardProps) {
  // ── State (TrueQuoteTemp-first init: survives any parent re-render race) ──
  const [enabled, setEnabled] = useState<boolean>(() => {
    const tqt = TrueQuoteTemp.get();
    return tqt.updatedAt > 0 ? tqt.includeGenerator : (currentAddOns.includeGenerator ?? false);
  });
  const [tier, setTier] = useState<GenTier["key"]>("standard");
  const [isExpanded, setIsExpanded] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRef = useRef(true);

  // ── Tier options ──
  const tiers = useMemo((): Record<GenTier["key"], GenTier> => {
    const fullSizeKw = Math.max(300, Math.round((peakLoadKW * 1.1) / 50) * 50);
    return {
      essential: calcGen("essential", 150, "diesel", peakLoadKW),
      standard: calcGen("standard", 300, "natural-gas", peakLoadKW),
      full: calcGen("full", fullSizeKw, "natural-gas", peakLoadKW),
    };
  }, [peakLoadKW]);

  // Refs so the useEffect dep array stays stable — prevents render loop when
  // peakLoadKW fluctuates (which creates new tiers objects) or when the parent
  // recreates onRecalculate (when itcBonuses/actions change).
  const tiersRef = useRef(tiers);
  tiersRef.current = tiers;
  const onRecalculateRef = useRef(onRecalculate);
  onRecalculateRef.current = onRecalculate;

  const curTier = tiers[tier];

  // ── Write TrueQuoteTemp synchronously ──
  function writeTQT(nextEnabled: boolean, nextTier: GenTier["key"]) {
    const t = tiers[nextTier];
    const tqt = TrueQuoteTemp.get();
    TrueQuoteTemp.writeAddOns({
      ...tqt,
      includeGenerator: nextEnabled,
      generatorKW: nextEnabled ? t.sizeKw : 0,
      generatorFuelType: t.fuelType === "Diesel" ? "diesel" : "natural-gas",
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
              Keep the lights on during outages · natural gas or diesel
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
            🔥 Choose backup power (Peak: ~{Math.round(peakLoadKW)} kW):
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["essential", "standard", "full"] as const).map((k) => {
              const t = tiers[k];
              const isSel = tier === k && enabled;
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
                      ? "2px solid rgba(239,68,68,0.7)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isSel ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
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
                        background: "rgba(239,68,68,0.9)",
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
                      color: isSel ? "#f87171" : "rgba(232,235,243,0.7)",
                      marginBottom: 6,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: isSel ? "#f87171" : "rgba(232,235,243,0.9)",
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
