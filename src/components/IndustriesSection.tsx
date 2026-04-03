/* Merlin Energy — Industries Section
   Unified "Your industry. Your numbers." section.
   Top: horizontal estimate bar (full-width, synced to active industry tab).
   Bottom: industry tabs + card panel.
   Estimate calls POST /api/quote — same engine as TrueQuote.               */

import { useState, useEffect, useRef } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

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
    <section id="industries" className="py-10 bg-[#060D1F]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* ── Section header ──────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-emerald-500" />
            <span
              className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.22em]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Free · No Signup · Instant
            </span>
          </div>
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Run a quick estimate for your facility.
          </h2>
          <p className="text-slate-300 text-sm" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>
            Two numbers from your utility bill. Same engine powering enterprise TrueQuotes. No
            signup.
          </p>
        </div>

        {/* ── Estimate form — clean bordered strip ── */}
        <div className="rounded-xl border border-emerald-500/25 overflow-hidden shadow-lg shadow-emerald-500/5">
          {/* Emerald top accent stripe */}
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />
          {/* Input strip */}
          {phase !== "result" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_120px_160px_130px_auto] gap-3 items-end">
                {/* Industry */}
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                    Facility Type
                  </label>
                  <select
                    value={activeId}
                    onChange={(e) => setActiveId(e.target.value)}
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500/40 transition-colors cursor-pointer appearance-none"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ZIP */}
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                    ZIP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="90210"
                    className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}
                  />
                </div>

                {/* Monthly Bill */}
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                    Monthly Bill
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
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
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg pl-6 pr-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                  </div>
                </div>

                {/* Peak kW */}
                <div>
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold block mb-1.5">
                    Peak kW
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={peakKW}
                      onChange={(e) => setPeakKW(e.target.value)}
                      placeholder="450"
                      className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-3 pr-9 py-2.5 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-mono">
                      kW
                    </span>
                  </div>
                </div>

                {/* Button */}
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleEstimate}
                    disabled={!isReady || phase === "loading"}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                      phase === "loading"
                        ? "bg-emerald-500/20 text-emerald-400/50 cursor-wait"
                        : isReady
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-500/20"
                          : "bg-white/5 text-white/20 border border-white/[0.07] cursor-not-allowed"
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
                        Calculate savings <ChevronRight className="w-4 h-4" />
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

          {/* ── Results (inline) ── */}
          {phase === "result" && rec && (
            <div className="p-5" style={{ animation: "industryFadeIn 0.4s ease-out" }}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {result?.location.formattedAddress} · {active.label} · Recommended
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPhase("idle");
                    setResult(null);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-5 py-4">
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

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4">
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

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4">
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

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4">
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

                <div className="flex flex-col gap-2">
                  <a
                    href={`/wizard?industry=${active.engineKey}&zip=${zip}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-black transition-all duration-200 hover:scale-[1.01] shadow-lg shadow-yellow-500/20 whitespace-nowrap"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Build full TrueQuote™ <ChevronRight className="w-4 h-4" />
                  </a>
                  <p className="text-[9px] text-slate-700 text-center font-mono">
                    Rough estimate only
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 font-mono text-center mt-3">
          NREL · EIA · IRA 2022 · Rough estimate · Not a binding quote
        </p>
      </div>

      <style>{`
        @keyframes industryFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
