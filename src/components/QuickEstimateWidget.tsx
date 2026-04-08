/**
 * QuickEstimateWidget.tsx
 *
 * Hero-section instant savings calculator.
 * Inputs: Industry + State (required) + Monthly Bill (optional refinement)
 *
 * All math is synchronous — no API call, results appear the moment both
 * required fields are filled. Uses STATE_RATES (EIA 2024) and NREL CBECS
 * typical peak demand values by vertical.
 *
 * Savings = energy arbitrage + demand charge reduction + solar offset.
 * Net cost after 30% federal ITC.
 *
 * CTA: "Build My TrueQuote™" → /wizard?industry=X&state=Y[&bill=Z]
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, BatteryFull, Sun, TrendingUp, Zap } from "lucide-react";
import { STATE_RATES, STATE_NAMES } from "@/config/stateRates";

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";

// ── Industry sizing — NREL CBECS/ASHRAE typical commercial peak demand ─────────
const INDUSTRY_SIZING: Record<
  string,
  { peakKW: number; label: string; icon: string; loadFactor: number }
> = {
  hotel: { peakKW: 450, label: "Hotel / Resort", icon: "🏨", loadFactor: 0.55 },
  restaurant: { peakKW: 180, label: "Restaurant", icon: "🍽️", loadFactor: 0.6 },
  retail: { peakKW: 280, label: "Retail", icon: "🏪", loadFactor: 0.5 },
  office: { peakKW: 320, label: "Office Building", icon: "🏢", loadFactor: 0.55 },
  warehouse: { peakKW: 350, label: "Warehouse", icon: "🏭", loadFactor: 0.45 },
  manufacturing: { peakKW: 600, label: "Manufacturing", icon: "⚙️", loadFactor: 0.65 },
  healthcare: { peakKW: 520, label: "Healthcare / Clinic", icon: "🏥", loadFactor: 0.65 },
  grocery: { peakKW: 380, label: "Grocery / Supermarket", icon: "🛒", loadFactor: 0.65 },
  gym: { peakKW: 160, label: "Gym / Fitness", icon: "💪", loadFactor: 0.55 },
  school: { peakKW: 240, label: "K-12 School", icon: "🏫", loadFactor: 0.4 },
  data_center: { peakKW: 800, label: "Data Center", icon: "🖥️", loadFactor: 0.85 },
  ev_charging: { peakKW: 500, label: "EV Charging Hub", icon: "⚡", loadFactor: 0.45 },
  car_wash: { peakKW: 200, label: "Car Wash", icon: "🚗", loadFactor: 0.5 },
  cannabis: { peakKW: 420, label: "Cannabis Facility", icon: "🌿", loadFactor: 0.8 },
  multifamily: { peakKW: 300, label: "Multifamily / Apt.", icon: "🏘️", loadFactor: 0.5 },
  cold_storage: { peakKW: 450, label: "Cold Storage", icon: "❄️", loadFactor: 0.75 },
  self_storage: { peakKW: 80, label: "Self Storage", icon: "📦", loadFactor: 0.35 },
  hospitality: { peakKW: 380, label: "Event / Hospitality", icon: "🎪", loadFactor: 0.4 },
};

const INDUSTRY_ORDER = [
  "hotel",
  "restaurant",
  "retail",
  "office",
  "warehouse",
  "manufacturing",
  "healthcare",
  "grocery",
  "gym",
  "school",
  "data_center",
  "ev_charging",
  "car_wash",
  "cannabis",
  "multifamily",
  "cold_storage",
  "self_storage",
  "hospitality",
];

// ── Rolling number counter ─────────────────────────────────────────────────────
function RollingNumber({
  target,
  prefix = "",
  suffix = "",
  duration = 1200,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;
    const animate = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startRef.current + (target - startRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt =
    display >= 1_000_000
      ? `${(display / 1_000_000).toFixed(1)}M`
      : display >= 1_000
        ? `${Math.round(display / 1_000)}K`
        : display.toString();

  return (
    <span>
      {prefix}
      {fmt}
      {suffix}
    </span>
  );
}

// ── Savings calculation — synchronous, no API call ─────────────────────────────
function calcSavings(industry: string, state: string, monthlyBill?: number) {
  const meta = INDUSTRY_SIZING[industry];
  if (!meta) return null;
  const stateData = STATE_RATES[state] || STATE_RATES["Other"];
  const { rate, demandCharge } = stateData;

  // Estimate peak kW — back-calculate from bill if provided, else use industry default
  let peakKW = meta.peakKW;
  if (monthlyBill && monthlyBill > 500) {
    // Monthly bill ≈ peakKW × (loadFactor × 730h × $/kWh + $/kW demand)
    const derived = monthlyBill / (meta.loadFactor * 730 * rate + demandCharge);
    // Sanity-clamp: 25%–300% of CBECS default
    peakKW = Math.min(meta.peakKW * 3, Math.max(meta.peakKW * 0.25, derived));
  }

  // BESS sizing — 40% peak shaving, 4-hour duration
  const bessKW = peakKW * 0.4;
  const bessKWh = bessKW * 4;
  const solarKW = bessKW * 0.8; // solar sized to recharge battery daily

  // Annual savings
  const energySavings = bessKWh * 0.35 * rate * 340; // 340 cycles/yr, 35% price delta
  const demandSavings = bessKW * demandCharge * 12 * 0.72; // 72% capture efficiency
  const solarSavings = solarKW * 1250 * rate; // 1250 kWh/kW/yr avg production
  const annual = energySavings + demandSavings + solarSavings;

  // System cost — installed commercial 2025, after 30% ITC
  const grossCost = bessKWh * 650 + solarKW * 1900;
  const netCost = grossCost * 0.7;

  return {
    peakKW: Math.round(peakKW),
    bessKW: Math.round(bessKW),
    bessKWh: Math.round(bessKWh),
    solarKW: Math.round(solarKW),
    savingsLow: Math.round(annual * 0.85),
    savingsHigh: Math.round(annual * 1.15),
    annual: Math.round(annual),
    netCost: Math.round(netCost),
    payback: Math.round((netCost / annual) * 10) / 10,
    rate,
    demandCharge,
  };
}

// ── Reusable select field ──────────────────────────────────────────────────────
function SelectField({
  label,
  value,
  placeholder,
  onChange,
  children,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-[0.18em] text-slate-600 font-semibold mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.09] hover:border-white/20 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white transition-all appearance-none cursor-pointer focus:outline-none"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <option value="" disabled style={{ background: "#0A1628" }}>
            {placeholder}
          </option>
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        {value && (
          <div className="absolute inset-0 rounded-xl ring-1 ring-emerald-500/20 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function QuickEstimateWidget() {
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [bill, setBill] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [resultsIn, setResultsIn] = useState(false);

  const billNum = bill ? parseFloat(bill.replace(/,/g, "")) : undefined;
  const hasInputs = state.length > 0 && industry.length > 0;
  const stateData = state ? STATE_RATES[state] : null;
  const indMeta = industry ? INDUSTRY_SIZING[industry] : null;

  // Instant synchronous calculation
  const est = useMemo(
    () => (hasInputs ? calcSavings(industry, state, billNum) : null),
    [industry, state, billNum] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Animate results panel in after both fields are filled
  useEffect(() => {
    if (est) {
      const t = setTimeout(() => setResultsIn(true), 60);
      return () => clearTimeout(t);
    } else {
      setResultsIn(false);
      return undefined;
    }
  }, [!!est]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctaUrl =
    `/wizard?industry=${encodeURIComponent(industry)}&state=${encodeURIComponent(state)}` +
    (billNum ? `&bill=${billNum}` : "");

  return (
    <div
      className="relative w-full max-w-[460px] mx-auto rounded-2xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(150deg, #0B1628 0%, #070E1D 100%)",
        boxShadow: hasInputs
          ? "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(62,207,142,0.15), 0 0 60px rgba(62,207,142,0.04)"
          : "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)",
        transition: "box-shadow 0.6s ease",
      }}
    >
      {/* Top accent line — pulses emerald once both fields are filled */}
      <div
        className="h-[2px] w-full transition-all duration-700"
        style={{
          background: hasInputs
            ? "linear-gradient(90deg, transparent, #3ECF8E 50%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)",
        }}
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span
              className="block text-white text-[14px] font-bold leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Instant Savings Estimate
            </span>
            <span className="block text-[9px] text-slate-600 font-mono tracking-wide">
              No commitment · ~20 seconds
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-500 font-mono font-semibold">LIVE</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-5 pt-4 pb-5">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Industry — full width */}
          <div className="col-span-2">
            <SelectField
              label="Industry"
              value={industry}
              placeholder="Select your industry…"
              onChange={setIndustry}
            >
              {INDUSTRY_ORDER.map((key) => {
                const m = INDUSTRY_SIZING[key];
                return (
                  <option key={key} value={key} style={{ background: "#0A1628" }}>
                    {m.icon}
                    {"  "}
                    {m.label}
                  </option>
                );
              })}
            </SelectField>
          </div>

          {/* State — full width + live rate callout */}
          <div className="col-span-2">
            <SelectField
              label="State"
              value={state}
              placeholder="Select state…"
              onChange={setState}
            >
              {STATE_NAMES.map((s) => (
                <option key={s} value={s} style={{ background: "#0A1628" }}>
                  {s}
                </option>
              ))}
            </SelectField>
            {stateData && (
              <div
                className="flex items-center gap-1.5 mt-1.5 ml-0.5"
                style={{ animation: "qeIn 0.3s ease-out" }}
              >
                <span className="text-[9px] text-emerald-600 font-mono">
                  ${stateData.rate.toFixed(3)}/kWh
                </span>
                <span className="text-slate-700 text-[9px]">·</span>
                <span className="text-[9px] text-slate-600 font-mono">
                  ${stateData.demandCharge}/kW demand
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optional bill refinement toggle */}
        {hasInputs && !showBill && (
          <button
            onClick={() => setShowBill(true)}
            className="w-full text-[10px] text-slate-500 hover:text-slate-300 font-mono mb-4 flex items-center justify-center gap-1.5 transition-colors"
            style={{ animation: "qeIn 0.3s ease-out" }}
          >
            <span className="text-emerald-700 text-[12px] leading-none">+</span>
            Add monthly bill for a more accurate estimate
          </button>
        )}

        {showBill && (
          <div className="mb-4" style={{ animation: "qeIn 0.3s ease-out" }}>
            <label className="block text-[9px] uppercase tracking-[0.18em] text-slate-600 font-semibold mb-1.5">
              Monthly Utility Bill{" "}
              <span className="text-slate-700 normal-case tracking-normal font-normal">
                (optional — improves accuracy)
              </span>
            </label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={bill}
                onChange={(e) => setBill(e.target.value.replace(/[^\d,]/g, ""))}
                placeholder="18,000"
                autoFocus
                className="w-full bg-white/[0.04] border border-white/[0.09] focus:border-emerald-500/50 rounded-xl pl-7 pr-16 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono">
                /mo
              </span>
            </div>
          </div>
        )}

        {/* ── Results panel — instant, no loading state ── */}
        {est ? (
          <div
            style={{
              opacity: resultsIn ? 1 : 0,
              transform: resultsIn ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {/* Savings hero */}
            <div
              className="rounded-xl p-4 mb-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(62,207,142,0.08) 0%, rgba(62,207,142,0.03) 100%)",
                border: "1px solid rgba(62,207,142,0.18)",
              }}
            >
              <div className="text-[9px] text-emerald-700 uppercase tracking-widest font-semibold mb-2">
                Estimated Annual Savings
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[26px] font-extrabold leading-none text-emerald-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <RollingNumber key={`lo-${est.savingsLow}`} target={est.savingsLow} prefix="$" />
                </span>
                <span className="text-slate-500 text-lg leading-none">–</span>
                <span
                  className="text-[26px] font-extrabold leading-none text-emerald-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <RollingNumber
                    key={`hi-${est.savingsHigh}`}
                    target={est.savingsHigh}
                    prefix="$"
                    suffix="/yr"
                  />
                </span>
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-1.5">
                Based on{" "}
                {billNum && billNum > 500
                  ? `~${est.peakKW}kW estimated peak`
                  : `${indMeta?.peakKW}kW typical peak`}{" "}
                · {state}
              </div>
            </div>

            {/* 4-metric grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                {
                  icon: <BatteryFull className="w-3 h-3" />,
                  label: "BESS",
                  value: `${est.bessKW}kW`,
                  sub: `${est.bessKWh}kWh`,
                },
                {
                  icon: <Sun className="w-3 h-3" />,
                  label: "Solar",
                  value: `${est.solarKW}kW`,
                  sub: "rooftop",
                },
                {
                  icon: <TrendingUp className="w-3 h-3" />,
                  label: "Payback",
                  value: `${est.payback}yr`,
                  sub: "after ITC",
                },
                {
                  icon: <Zap className="w-3 h-3" />,
                  label: "Net Cost",
                  value:
                    est.netCost >= 1_000_000
                      ? `$${(est.netCost / 1_000_000).toFixed(1)}M`
                      : `$${Math.round(est.netCost / 1_000)}K`,
                  sub: "after 30% ITC",
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white/[0.025] border border-white/[0.05] rounded-lg p-2 text-center"
                  style={{ animation: `qeIn 0.35s ${i * 0.07}s ease-out both` }}
                >
                  <div className="flex items-center justify-center text-slate-600 mb-1">
                    {m.icon}
                  </div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest leading-none mb-1">
                    {m.label}
                  </div>
                  <div
                    className="text-[13px] font-extrabold text-white leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {m.value}
                  </div>
                  <div className="text-[7px] text-slate-700 font-mono mt-0.5 leading-tight">
                    {m.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-[9px] text-slate-700 font-mono text-center mb-4 leading-relaxed">
              Rough estimate · NREL CBECS 2018 + EIA 2024 commercial rates · 30% ITC applied
            </p>

            {/* CTA */}
            <a
              href={ctaUrl}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #F5A623 0%, #F0AB3D 100%)",
                color: "#000",
                boxShadow: "0 8px 28px rgba(245,166,35,0.28)",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <img src={SHIELD_GOLD} alt="" className="w-4 h-4 object-contain" />
              Build My TrueQuote™
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          /* Placeholder when inputs incomplete */
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-9 h-9 rounded-full bg-white/[0.025] border border-white/[0.05] flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-[11px] text-slate-700 font-mono text-center leading-relaxed">
              Select industry + state
              <br />
              to see your savings instantly
            </p>
          </div>
        )}
      </div>

      {/* Bottom progress bar */}
      <div className="h-[2px] bg-white/[0.025]">
        <div
          className="h-full bg-emerald-500/50 transition-all duration-700"
          style={{ width: est ? "100%" : hasInputs ? "55%" : "0%" }}
        />
      </div>

      <style>{`
        @keyframes qeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
