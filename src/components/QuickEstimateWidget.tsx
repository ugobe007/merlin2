/**
 * QuickEstimateWidget.tsx
 *
 * Home page quick-estimate calculator.
 * Visual DNA matches the CalculationCard in HeroSection — same card shell,
 * heartbeatBorder, JetBrains Mono numbers, RollingNumber counter, emerald accent.
 *
 * Calls POST /api/quote directly — same endpoint as Discord + MCP.
 * Placement: between HeroSection and DailyDealCard on the Home page.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, CheckCircle2, Zap, AlertCircle, RotateCcw, Mail } from "lucide-react";

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";

// ── Animated rolling number (same impl as CalculationCard) ────────────────────
function RollingNumber({
  target,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

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
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

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

// ── Industry list — same slugs the /api/quote engine accepts ─────────────────
const INDUSTRIES = [
  { label: "Car Wash", value: "car_wash", emoji: "🚗" },
  { label: "Hotel", value: "hotel", emoji: "🏨" },
  { label: "Restaurant", value: "restaurant", emoji: "🍽️" },
  { label: "Retail", value: "retail", emoji: "🏪" },
  { label: "Warehouse", value: "warehouse", emoji: "🏭" },
  { label: "Office", value: "office", emoji: "🏢" },
  { label: "Manufacturing", value: "manufacturing", emoji: "⚙️" },
  { label: "Healthcare", value: "healthcare", emoji: "🏥" },
  { label: "School", value: "school", emoji: "🏫" },
  { label: "Gym / Fitness", value: "gym", emoji: "💪" },
  { label: "Data Center", value: "data_center", emoji: "🖥️" },
  { label: "EV Charging Hub", value: "ev_charging", emoji: "⚡" },
];

type Phase = "input" | "loading" | "result" | "error";

interface QuoteResult {
  location: { formattedAddress: string };
  tiers: {
    recommended: {
      equipment: {
        solarKW: number;
        bessKW: number;
        bessKWh: number;
        durationHrs: number;
      };
      costs: { netInvestment: number };
      savings: { netAnnualSavings: number };
      roi: { paybackYears: number; npv25Year: number; roi10Year: number };
    };
  };
}

export default function QuickEstimateWidget() {
  const [phase, setPhase] = useState<Phase>("input");
  const [industry, setIndustry] = useState("");
  const [zip, setZip] = useState("");
  const [monthlyBill, setMonthlyBill] = useState("");
  const [peakKW, setPeakKW] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultsVisible, setResultsVisible] = useState(false);

  // Stagger result animation in after the card appears
  useEffect(() => {
    if (phase === "result") {
      const t = setTimeout(() => setResultsVisible(true), 100);
      return () => clearTimeout(t);
    } else {
      setResultsVisible(false);
    }
  }, [phase]);

  const isReady =
    industry.length > 0 && /^\d{5}$/.test(zip) && Number(monthlyBill) > 0 && Number(peakKW) > 0;

  const handleEstimate = useCallback(async () => {
    if (!isReady) return;
    setPhase("loading");
    try {
      const peakKWNum = Number(peakKW);
      const billNum = Number(monthlyBill);
      // Same electricity rate estimation as MCP server (mcp-server/src/index.ts)
      const estimatedKwhPerMonth = peakKWNum * 0.4 * 730;
      const electricityRate = Math.min(0.35, Math.max(0.08, billNum / estimatedKwhPerMonth));

      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          location: zip,
          peakLoadKW: peakKWNum,
          electricityRate: Math.round(electricityRate * 1000) / 1000,
          bessApplication: "peak_shaving",
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Quote failed");
      setResult(data);
      setPhase("result");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setPhase("error");
    }
  }, [industry, zip, monthlyBill, peakKW, isReady]);

  const handleReset = () => {
    setPhase("input");
    setResult(null);
    setErrorMsg("");
  };

  const rec = result?.tiers.recommended;
  const industryLabel = INDUSTRIES.find((i) => i.value === industry)?.label ?? industry;

  return (
    <div
      className="relative w-full max-w-[480px] mx-auto rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0C1829 0%, #080F1E 100%)",
        animation: "qeHeartbeat 4s ease-in-out infinite",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Top accent — emerald to distinguish from yellow TrueQuote card */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <img src={SHIELD_GOLD} alt="" className="w-7 h-7 object-contain" />
          <span
            className="text-emerald-400 text-[15px] font-bold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Quick Estimate
          </span>
          <span className="text-[11px] text-slate-500 font-semibold ml-1 uppercase tracking-widest">
            ~10 sec
          </span>
        </div>
        <div className="flex items-center gap-3">
          {phase === "result" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>
      </div>

      {/* ── 2-phase progress bar ── */}
      <div className="px-5 pt-3 pb-0">
        <div className="flex items-center gap-1 mb-3">
          {(["Inputs", "Results"] as const).map((label, i) => {
            const isActive =
              (i === 0 && phase === "input") ||
              (i === 1 && (phase === "result" || phase === "loading"));
            const isDone = i === 0 && (phase === "result" || phase === "loading");
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-[3px] w-full rounded-full transition-all duration-500 ${
                    isDone ? "bg-emerald-500" : isActive ? "bg-emerald-400" : "bg-white/[0.08]"
                  }`}
                />
                <span
                  className={`text-[8px] font-mono transition-colors duration-300 ${
                    isActive
                      ? "text-emerald-400"
                      : isDone
                        ? "text-emerald-600/50"
                        : "text-slate-700"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-5 pb-2" style={{ minHeight: 268 }}>
        {/* INPUT PHASE */}
        {phase === "input" && (
          <div style={{ animation: "qeFadeIn 0.35s ease-out" }}>
            <div className="grid grid-cols-2 gap-3">
              {/* Industry — full width */}
              <div className="col-span-2">
                <label className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                  Industry
                </label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500/40 transition-colors appearance-none cursor-pointer"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    <option value="" disabled style={{ background: "#0C1829" }}>
                      Select your industry…
                    </option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value} style={{ background: "#0C1829" }}>
                        {ind.emoji} {ind.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* ZIP */}
              <div>
                <label className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                  ZIP Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="e.g. 90210"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    letterSpacing: "0.08em",
                  }}
                />
              </div>

              {/* Monthly Bill */}
              <div>
                <label className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                  Monthly Bill
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(e.target.value)}
                    placeholder="18,000"
                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-6 pr-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Peak Demand — full width */}
              <div className="col-span-2">
                <label className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                  Peak Demand
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={peakKW}
                    onChange={(e) => setPeakKW(e.target.value)}
                    placeholder="450"
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 pr-12 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[11px] font-mono">
                    kW
                  </span>
                </div>
                <p className="text-[9px] text-slate-700 mt-1 font-mono">
                  On your utility bill under "Demand" or "kW"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOADING PHASE */}
        {phase === "loading" && (
          <div
            className="flex flex-col items-center justify-center h-full py-10 gap-4"
            style={{ animation: "qeFadeIn 0.3s ease-out" }}
          >
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400"
                style={{ animation: "qeSpin 0.8s linear infinite" }}
              />
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-center">
              <p
                className="text-sm text-white font-semibold mb-1"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Building your estimate…
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Fetching NREL solar data for {zip}
              </p>
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && rec && (
          <div style={{ animation: "qeFadeIn 0.35s ease-out" }}>
            {/* Location context line */}
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 font-mono truncate">
                {result?.location.formattedAddress} · {industryLabel}
              </span>
            </div>

            {/* Primary — annual savings with rolling counter */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 mb-3">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                Est. Annual Savings · Recommended System
              </div>
              <div
                className="text-3xl font-extrabold text-emerald-400 tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {resultsVisible ? (
                  <RollingNumber
                    key="savings"
                    target={rec.savings.netAnnualSavings}
                    prefix="$"
                    duration={1400}
                  />
                ) : (
                  "$0"
                )}
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                per year · net of operating reserves
              </div>
            </div>

            {/* 3 metric boxes */}
            <div
              className="grid grid-cols-3 gap-2 mb-3"
              style={{
                opacity: resultsVisible ? 1 : 0,
                transition: "opacity 0.5s 0.3s",
              }}
            >
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                  Payback
                </div>
                <div
                  className="text-sm font-extrabold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {rec.roi.paybackYears}y
                </div>
              </div>
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                  Net Cost
                </div>
                <div
                  className="text-sm font-extrabold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {rec.costs.netInvestment >= 1_000_000
                    ? `$${(rec.costs.netInvestment / 1_000_000).toFixed(1)}M`
                    : `$${Math.round(rec.costs.netInvestment / 1_000)}K`}
                </div>
              </div>
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                  10yr ROI
                </div>
                <div
                  className="text-sm font-extrabold text-emerald-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {rec.roi.roi10Year > 0 ? "+" : ""}
                  {rec.roi.roi10Year}%
                </div>
              </div>
            </div>

            {/* System summary line */}
            <div
              className="text-[10px] text-slate-600 font-mono text-center"
              style={{
                opacity: resultsVisible ? 1 : 0,
                transition: "opacity 0.5s 0.5s",
              }}
            >
              {rec.equipment.solarKW > 0 && `${rec.equipment.solarKW} kW solar · `}
              {rec.equipment.bessKW} kW / {rec.equipment.bessKWh} kWh BESS · 30% ITC applied
            </div>
          </div>
        )}

        {/* ERROR PHASE */}
        {phase === "error" && (
          <div
            className="flex flex-col items-center justify-center h-full py-10 gap-3"
            style={{ animation: "qeFadeIn 0.3s ease-out" }}
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p
              className="text-sm text-slate-300 text-center max-w-xs"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {errorMsg}
            </p>
            <button onClick={handleReset} className="text-[11px] text-emerald-400 hover:underline">
              Try again
            </button>
          </div>
        )}
      </div>

      {/* ── CTA buttons ── */}
      <div className="px-5 pb-5 pt-3 space-y-2">
        {(phase === "input" || phase === "error") && (
          <button
            onClick={handleEstimate}
            disabled={!isReady}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
              isReady
                ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-500/20"
                : "bg-white/5 text-white/30 border border-white/[0.08]"
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {isReady ? "Estimate My Savings" : "Fill in all 4 fields"}
            {isReady && <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        {phase === "result" && (
          <>
            <a
              href={`/wizard?industry=${industry}&zip=${zip}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow-500/20"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <img src={SHIELD_GOLD} alt="" className="w-4 h-4 object-contain" />
              Build Full TrueQuote™
              <ChevronRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                /* TODO: email capture modal */
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all duration-200"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <Mail className="w-3.5 h-3.5" />
              Email me this estimate
            </button>
          </>
        )}
      </div>

      {/* Bottom progress track */}
      <div className="h-[2px] bg-white/[0.03]">
        <div
          className="h-full bg-emerald-500/60 transition-all duration-700"
          style={{
            width: phase === "result" ? "100%" : phase === "loading" ? "50%" : "0%",
          }}
        />
      </div>

      {/* Disclaimer — only when showing results */}
      {phase === "result" && (
        <div className="px-5 py-2.5 border-t border-white/[0.04]">
          <p className="text-[9px] text-slate-700 text-center font-mono">
            Rough estimate · NREL + EIA data · Not a final engineering quote
          </p>
        </div>
      )}

      <style>{`
        @keyframes qeFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qeHeartbeat {
          0%, 100% { box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08); }
          50%       { box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.15); }
        }
        @keyframes qeSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
