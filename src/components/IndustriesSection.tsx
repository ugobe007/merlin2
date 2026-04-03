/* Merlin Energy — Industries Section
   Unified "Your industry. Your numbers." section.
   Top: horizontal estimate bar (full-width, synced to active industry tab).
   Bottom: industry tabs + card panel.
   Estimate calls POST /api/quote — same engine as TrueQuote.               */

import { useState, useEffect, useRef } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, RotateCcw, Zap } from "lucide-react";

// ── Animated rolling number ───────────────────────────────────────────────────
function RollingNumber({
  target,
  prefix = "",
  duration = 1400,
}: {
  target: number;
  prefix?: string;
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
      const progress = Math.min((ts - startTimeRef.current) / duration, 1);
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
    </span>
  );
}

// ── Industry data ─────────────────────────────────────────────────────────────
const industries = [
  {
    id: "hotels",
    label: "Hotels",
    engineKey: "hotel",
    description:
      "Reduce utility costs, add resilience, and turn a large recurring energy expense into a clearer project decision with real ROI and savings data.",
    systemSize: "1.2 MW / 4.8 MWh",
    annualSavings: "$412K",
    payback: "2.3 yrs",
    output: "ROI + RFP",
    defaultBill: 55000,
    defaultKW: 500,
  },
  {
    id: "carwash",
    label: "Car Wash",
    engineKey: "car_wash",
    description:
      "High daytime energy loads make car wash facilities ideal candidates for solar + storage. Fast payback, strong IRR.",
    systemSize: "162 kW / 324 kWh",
    annualSavings: "$50K",
    payback: "7.0 yrs",
    output: "ROI + RFP",
    defaultBill: 18000,
    defaultKW: 450,
  },
  {
    id: "ev",
    label: "EV Charging",
    engineKey: "ev_charging",
    description:
      "Battery storage paired with EV charging stations dramatically reduces demand spikes and utility costs.",
    systemSize: "300 kW / 1.2 MWh",
    annualSavings: "$145K",
    payback: "4.2 yrs",
    output: "ROI + RFP",
    defaultBill: 28000,
    defaultKW: 300,
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    engineKey: "manufacturing",
    description:
      "Large roof and land footprints plus consistent load profiles make manufacturing a top-tier solar candidate.",
    systemSize: "2.5 MW / 10 MWh",
    annualSavings: "$680K",
    payback: "5.1 yrs",
    output: "ROI + RFP",
    defaultBill: 75000,
    defaultKW: 800,
  },
  {
    id: "multifamily",
    label: "Multifamily",
    engineKey: "default",
    description:
      "Community solar and shared storage models unlock savings for multifamily properties of all sizes.",
    systemSize: "400 kW / 1.6 MWh",
    annualSavings: "$112K",
    payback: "5.8 yrs",
    output: "ROI + RFP",
    defaultBill: 22000,
    defaultKW: 300,
  },
  {
    id: "datacenters",
    label: "Data Centers",
    engineKey: "data_center",
    description:
      "24/7 load profiles and sustainability mandates are driving aggressive energy investment in data centers.",
    systemSize: "5 MW / 20 MWh",
    annualSavings: "$1.4M",
    payback: "6.5 yrs",
    output: "ROI + RFP",
    defaultBill: 200000,
    defaultKW: 2000,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuoteResult {
  ok: boolean;
  error?: string;
  location: { formattedAddress: string };
  tiers: {
    recommended: {
      equipment: { solarKW: number; bessKW: number; bessKWh: number };
      costs: { netInvestment: number };
      savings: { netAnnualSavings: number };
      roi: { paybackYears: number; roi10Year: number };
    };
  };
}
type Phase = "idle" | "loading" | "result" | "error";

// ── Component ─────────────────────────────────────────────────────────────────
export default function IndustriesSection() {
  const [activeId, setActiveId] = useState("hotels");
  const active = industries.find((i) => i.id === activeId)!;

  // Estimate bar state
  const [zip, setZip] = useState("90210");
  const [monthlyBill, setBill] = useState(String(active.defaultBill));
  const [peakKW, setPeakKW] = useState(String(active.defaultKW));
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultsVisible, setResultsVisible] = useState(false);

  // When tab changes → sync bill/kW defaults, clear prior estimate
  useEffect(() => {
    setBill(String(active.defaultBill));
    setPeakKW(String(active.defaultKW));
    setPhase("idle");
    setResult(null);
    setResultsVisible(false);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fade-in results after they arrive
  useEffect(() => {
    if (phase === "result") {
      const t = setTimeout(() => setResultsVisible(true), 80);
      return () => clearTimeout(t);
    } else {
      setResultsVisible(false);
    }
  }, [phase]);

  const isReady = /^\d{5}$/.test(zip) && Number(monthlyBill) > 0 && Number(peakKW) > 0;

  const handleEstimate = async () => {
    if (!isReady) return;
    setPhase("loading");
    try {
      const peakKWNum = Number(peakKW);
      const billNum = Number(monthlyBill);
      const estimatedKwhPerMonth = peakKWNum * 0.4 * 730;
      const electricityRate = Math.min(0.35, Math.max(0.08, billNum / estimatedKwhPerMonth));
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: active.engineKey,
          location: zip,
          peakLoadKW: peakKWNum,
          electricityRate: Math.round(electricityRate * 1000) / 1000,
          bessApplication: "peak_shaving",
        }),
      });
      const data: QuoteResult = await res.json();
      if (!data.ok) throw new Error(data.error || "Quote failed");
      setResult(data);
      setPhase("result");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setPhase("error");
    }
  };

  const rec = result?.tiers.recommended;

  return (
    <section id="industries" className="py-20 bg-[#060D1F]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* ── Section header with narrative ──────────────────────────────── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400/70 text-[10px] font-semibold tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            No signup · No sales call
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2
                className="text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Your industry. Your numbers.
              </h2>
              <p
                className="text-slate-400 text-base max-w-2xl"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Pick your vertical, enter two numbers from your utility bill, and Merlin runs the
                same engine powering our enterprise quotes — real NREL data, real ITC credits, real
                payback math.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] text-slate-600 font-mono">Powered by</p>
              <p className="text-[11px] text-emerald-600 font-mono">NREL · IEEE · IRA 2022</p>
            </div>
          </div>
        </div>

        {/* ── Horizontal Estimate Bar ─────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: "linear-gradient(160deg, #0C1829 0%, #080F1E 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 0 1px rgba(16,185,129,0.06), 0 20px 60px rgba(0,0,0,0.4)",
            animation: "industryHeartbeat 4s ease-in-out infinite",
          }}
        >
          {/* Top accent line */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          {/* Bar header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span
                className="text-emerald-400 text-[13px] font-bold tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Quick Estimate
              </span>
              <span className="text-[10px] text-slate-600 font-mono ml-1">· {active.label}</span>
            </div>
            <div className="flex items-center gap-3">
              {phase === "result" && (
                <button
                  onClick={() => {
                    setPhase("idle");
                    setResult(null);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono font-semibold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                LIVE ENGINE
              </span>
            </div>
          </div>

          {/* ── Input row ── */}
          {phase !== "result" && (
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_180px_160px_auto] gap-3 items-end">
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
                      letterSpacing: "0.06em",
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
                      onChange={(e) => setBill(e.target.value)}
                      placeholder="18,000"
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-6 pr-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                  </div>
                </div>

                {/* Peak Demand */}
                <div>
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
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 pr-10 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[11px] font-mono">
                      kW
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-700 mt-1 font-mono">From your utility bill</p>
                </div>

                {/* CTA */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleEstimate}
                    disabled={!isReady || phase === "loading"}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                      phase === "loading"
                        ? "bg-emerald-500/20 text-emerald-400/50 cursor-wait"
                        : isReady
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-emerald-500/20"
                          : "bg-white/5 text-white/30 border border-white/[0.08]"
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {phase === "loading" ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                        Calculating…
                      </>
                    ) : (
                      <>
                        Estimate {active.label} savings
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {phase === "error" && (
                <div className="flex items-center gap-2 mt-3">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400 font-mono">{errorMsg}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Results row (expands inline) ── */}
          {phase === "result" && rec && (
            <div className="px-6 py-5" style={{ animation: "industryFadeIn 0.4s ease-out" }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 font-mono">
                  {result?.location.formattedAddress} · {active.label} · Recommended system
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                {/* Annual Savings */}
                <div className="bg-black/40 border border-emerald-500/20 rounded-xl px-5 py-4">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    Annual Savings
                  </div>
                  <div
                    className="text-2xl font-extrabold text-emerald-400 tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {resultsVisible ? (
                      <RollingNumber target={rec.savings.netAnnualSavings} prefix="$" />
                    ) : (
                      "$0"
                    )}
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">per year</div>
                </div>

                {/* Payback */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl px-5 py-4">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    Payback
                  </div>
                  <div
                    className="text-2xl font-extrabold text-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {rec.roi.paybackYears}y
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">simple payback</div>
                </div>

                {/* Net Cost */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl px-5 py-4">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    Net Cost
                  </div>
                  <div
                    className="text-2xl font-extrabold text-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {rec.costs.netInvestment >= 1_000_000
                      ? `$${(rec.costs.netInvestment / 1_000_000).toFixed(1)}M`
                      : `$${Math.round(rec.costs.netInvestment / 1_000)}K`}
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">after 30% ITC</div>
                </div>

                {/* 10yr ROI */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl px-5 py-4">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    10-yr ROI
                  </div>
                  <div
                    className="text-2xl font-extrabold text-emerald-400"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {rec.roi.roi10Year > 0 ? "+" : ""}
                    {rec.roi.roi10Year}%
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                    {rec.equipment.bessKW} kW / {rec.equipment.bessKWh} kWh BESS
                    {rec.equipment.solarKW > 0 && ` · ${rec.equipment.solarKW} kW solar`}
                  </div>
                </div>

                {/* Build full quote CTA */}
                <div className="flex flex-col gap-2">
                  <a
                    href={`/wizard?industry=${active.engineKey}&zip=${zip}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-yellow-500/20 whitespace-nowrap"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Build full TrueQuote™
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <p className="text-[9px] text-slate-700 text-center font-mono">
                    Rough estimate · NREL + EIA data
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Industry tab pills ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6 mt-8">
          {industries.map((ind) => {
            const isActive = ind.id === activeId;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveId(ind.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-transparent border-emerald-400 text-emerald-400"
                    : "border-white/15 text-slate-400 hover:text-white hover:border-white/30 bg-transparent"
                }`}
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* ── Full-width industry card ────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0A1628]/60 overflow-hidden mb-4">
          <div className="grid lg:grid-cols-[1fr_auto] gap-0">
            {/* Left: industry info */}
            <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <h3
                className="text-3xl font-extrabold text-emerald-400 mb-3"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {active.label}
              </h3>
              <p
                className="text-slate-400 text-base leading-relaxed mb-6 max-w-md"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                {active.description}
              </p>
              <a
                href={`/wizard?industry=${active.engineKey}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/40 text-sm font-semibold text-emerald-400 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Start my {active.label} quote →
              </a>
            </div>

            {/* Right: metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 lg:w-[420px]">
              {[
                { label: "TYPICAL SYSTEM", value: active.systemSize, green: false },
                { label: "ANNUAL SAVINGS", value: active.annualSavings, green: true },
                { label: "PAYBACK", value: active.payback, green: false },
                { label: "OUTPUT", value: active.output, green: false },
              ].map((m, i) => (
                <div
                  key={m.label}
                  className={`p-7 ${i < 2 ? "border-b" : ""} ${
                    i % 2 === 0 ? "border-r" : ""
                  } border-white/[0.06]`}
                >
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-medium">
                    {m.label}
                  </p>
                  <p
                    className={`text-2xl font-extrabold ${
                      m.green ? "text-emerald-400" : "text-white"
                    }`}
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes industryHeartbeat {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.06), 0 20px 60px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 0 0 1px rgba(16,185,129,0.18), 0 20px 60px rgba(0,0,0,0.4); }
        }
        @keyframes industryFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
