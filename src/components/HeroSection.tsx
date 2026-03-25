/* Merlin Energy — Hero Section
   Design: Asymmetric split — left headline + path selector (55%), right CalculationCard theater (45%)

   Right card = CALCULATION THEATER, not a marketing mockup.
   Shows utility rates resolving, demand estimating, savings computing live.
   Auto-demos 6 representative use cases when user hasn't interacted yet.
   Bloomberg terminal meets energy calculator.

   Auto-demo logic:
   - Cycles: Manufacturing (NY) → Hotel (BH) → Data Center (DC) → Car Wash (Austin)
             → Multifamily (Chicago) → EV Charging (Atlanta)
   - Timing: locating 600ms → fetching 900ms → resolved 2800ms → fade 400ms = ~5.2s/cycle
   - User focus/type immediately pauses demo; input clear restarts after 1.2s
*/

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, CheckCircle2, Zap, Building2, Sliders, Cpu, BarChart3 } from "lucide-react";

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

const trustItems = [
  "NREL Data",
  "DOE Frameworks",
  "Sandia-Aligned Logic",
  "UL / IEEE",
  "TrueQuote Financial Engine",
];

// Animated rolling number — eased cubic, counts up from previous value
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

  const formatted =
    display >= 1_000_000
      ? `${(display / 1_000_000).toFixed(1)}M`
      : display >= 1_000
        ? `${Math.round(display / 1_000)}K`
        : display.toString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// Live wall clock — signals the card is LIVE, not a static mockup
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>{time}</span>;
}

// ── Demo data — one entry per use case, drives all 5 steps ───────────────────
interface DemoCase {
  zip: string;
  industry: string;
  industryEmoji: string;
  city: string;
  state: string;
  utility: string;
  rate: number;
  // Step 3 profile answers (2 key questions shown)
  profileQ1: string;
  profileA1: string;
  profileQ2: string;
  profileA2: string;
  // Step 4 add-ons chosen
  addOns: string[];
  solarKW: number;
  bessKWh: number;
  // Step 5 results
  annualSavings: number;
  paybackYears: number;
  co2Tons: number;
  irr: number;
}

const DEMO_CASES: DemoCase[] = [
  {
    zip: "10001",
    industry: "Manufacturing",
    industryEmoji: "🏭",
    city: "New York",
    state: "NY",
    utility: "Con Edison",
    rate: 0.22,
    profileQ1: "Monthly energy bill",
    profileA1: "$18,400",
    profileQ2: "Facility sq. footage",
    profileA2: "42,000 sq ft",
    addOns: ["BESS", "Solar", "Demand Response"],
    solarKW: 480,
    bessKWh: 1200,
    annualSavings: 621000,
    paybackYears: 4.2,
    co2Tons: 310,
    irr: 24,
  },
  {
    zip: "90210",
    industry: "Hotel",
    industryEmoji: "🏨",
    city: "Beverly Hills",
    state: "CA",
    utility: "SCE",
    rate: 0.28,
    profileQ1: "Number of rooms",
    profileA1: "214 rooms",
    profileQ2: "Monthly energy bill",
    profileA2: "$31,200",
    addOns: ["BESS", "Solar", "EV Charging"],
    solarKW: 620,
    bessKWh: 1800,
    annualSavings: 412000,
    paybackYears: 5.1,
    co2Tons: 198,
    irr: 19,
  },
  {
    zip: "20001",
    industry: "Data Center",
    industryEmoji: "🖥️",
    city: "Washington",
    state: "DC",
    utility: "Pepco",
    rate: 0.14,
    profileQ1: "IT load (kW)",
    profileA1: "2,400 kW",
    profileQ2: "Uptime requirement",
    profileA2: "99.999% (Tier III)",
    addOns: ["BESS", "Backup Generator", "UPS Integration"],
    solarKW: 0,
    bessKWh: 4000,
    annualSavings: 534000,
    paybackYears: 3.8,
    co2Tons: 440,
    irr: 26,
  },
  {
    zip: "78701",
    industry: "Car Wash",
    industryEmoji: "🚗",
    city: "Austin",
    state: "TX",
    utility: "Austin Energy",
    rate: 0.11,
    profileQ1: "Cars washed per day",
    profileA1: "380 cars",
    profileQ2: "Monthly energy bill",
    profileA2: "$4,100",
    addOns: ["BESS", "Solar"],
    solarKW: 120,
    bessKWh: 300,
    annualSavings: 187000,
    paybackYears: 6.3,
    co2Tons: 88,
    irr: 16,
  },
  {
    zip: "60601",
    industry: "Multifamily",
    industryEmoji: "🏢",
    city: "Chicago",
    state: "IL",
    utility: "ComEd",
    rate: 0.12,
    profileQ1: "Number of units",
    profileA1: "186 units",
    profileQ2: "Common-area bill",
    profileA2: "$9,800 / mo",
    addOns: ["BESS", "Solar", "EV Charging"],
    solarKW: 260,
    bessKWh: 720,
    annualSavings: 298000,
    paybackYears: 5.7,
    co2Tons: 162,
    irr: 18,
  },
  {
    zip: "30301",
    industry: "EV Charging",
    industryEmoji: "⚡",
    city: "Atlanta",
    state: "GA",
    utility: "Georgia Power",
    rate: 0.1,
    profileQ1: "Number of stalls",
    profileA1: "24 Level 2 / 6 DC Fast",
    profileQ2: "Peak charging demand",
    profileA2: "~480 kW",
    addOns: ["BESS", "Solar", "Grid Services"],
    solarKW: 200,
    bessKWh: 600,
    annualSavings: 156000,
    paybackYears: 6.8,
    co2Tons: 74,
    irr: 15,
  },
];

// Step timing (ms) — each step gets a dwell period then advances
//   Step 1 (ZIP):       locating 600 → fetching 900 → resolved 1200 → advance
//   Step 2 (Industry):  show 1400 → advance
//   Step 3 (Profile):   type q1 600 → show a1 800 → type q2 600 → show a2 800 → advance
//   Step 4 (Add-ons):   reveal chips 1200 → show sizing 800 → advance
//   Step 5 (Results):   count up 1800 → show metrics 800 → hold 1200 → cycle
const S1_LOCATING = 1000;
const S1_FETCHING = 1600;
const S1_RESOLVED = 2200;
const S2_DWELL = 2400;
const S3_TYPE_Q = 900;
const S3_SHOW_A = 1200;
const S4_CHIPS = 2000;
const S4_SIZE = 1400;
const S5_COUNTERS = 2800;
const S5_METRICS = 1400;
const S5_HOLD = 2400;
const FADE_BETWEEN = 500;

// Total per cycle (approx):
// 600+900+1200 + 350 + 1400 + 350 + 500+700+500+700 + 350 + 1200+800 + 350 + 1800+800+1400 = ~14.6s

// ── CalculationCard ────────────────────────────────────────────────────────────
function CalculationCard() {
  const [zip, setZip] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = zip.length === 5 && /^\d{5}$/.test(zip);

  // Demo orchestration
  const [demoCase, setDemoCase] = useState(0);
  const [demoStep, setDemoStep] = useState(1); // 1–5
  const [demoPhase, setDemoPhase] = useState<"idle" | "locating" | "fetching" | "resolved">("idle");
  const [demoZip, setDemoZip] = useState("");
  const [s3Phase, setS3Phase] = useState(0); // 0=blank 1=q1 2=a1 3=q2 4=a2
  const [s4Phase, setS4Phase] = useState(0); // 0=blank 1=chips 2=chips+size
  const [s5Phase, setS5Phase] = useState(0); // 0=blank 1=counting 2=metrics
  const [userActive, setUserActive] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  const runCycle = useCallback(
    (caseIdx: number) => {
      clearTimers();
      const c = DEMO_CASES[caseIdx % DEMO_CASES.length];

      // ─── STEP 1 ───────────────────────────────────────────────────────────
      setDemoStep(1);
      setDemoPhase("idle");
      setDemoZip("");
      setS3Phase(0);
      setS4Phase(0);
      setS5Phase(0);

      let t = 120;
      schedule(() => {
        setDemoZip(c.zip.slice(0, 3) + "··");
        setDemoPhase("locating");
      }, t);

      t += S1_LOCATING;
      schedule(() => {
        setDemoZip(c.zip);
        setDemoPhase("fetching");
      }, t);

      t += S1_FETCHING;
      schedule(() => {
        setDemoPhase("resolved");
      }, t);

      t += S1_RESOLVED + FADE_BETWEEN;

      // ─── STEP 2 ───────────────────────────────────────────────────────────
      schedule(() => {
        setDemoStep(2);
      }, t);

      t += S2_DWELL + FADE_BETWEEN;

      // ─── STEP 3 ───────────────────────────────────────────────────────────
      schedule(() => {
        setDemoStep(3);
        setS3Phase(1);
      }, t); // show q1 label

      t += S3_TYPE_Q;
      schedule(() => {
        setS3Phase(2);
      }, t); // show a1

      t += S3_SHOW_A;
      schedule(() => {
        setS3Phase(3);
      }, t); // show q2 label

      t += S3_TYPE_Q;
      schedule(() => {
        setS3Phase(4);
      }, t); // show a2

      t += S3_SHOW_A + FADE_BETWEEN;

      // ─── STEP 4 ───────────────────────────────────────────────────────────
      schedule(() => {
        setDemoStep(4);
        setS4Phase(1);
      }, t); // add-on chips appear

      t += S4_CHIPS;
      schedule(() => {
        setS4Phase(2);
      }, t); // sizing numbers appear

      t += S4_SIZE + FADE_BETWEEN;

      // ─── STEP 5 ───────────────────────────────────────────────────────────
      schedule(() => {
        setDemoStep(5);
        setS5Phase(1);
      }, t); // counters start

      t += S5_COUNTERS;
      schedule(() => {
        setS5Phase(2);
      }, t); // payback/CO2/IRR appear

      t += S5_METRICS + S5_HOLD;

      // ─── advance to next case ─────────────────────────────────────────────
      schedule(() => {
        setDemoCase((i) => (i + 1) % DEMO_CASES.length);
      }, t);
    },
    [clearTimers, schedule]
  );

  // Re-run whenever demoCase changes (and user hasn't taken over)
  useEffect(() => {
    if (userActive) return;
    runCycle(demoCase);
    return clearTimers;
  }, [demoCase, userActive, runCycle, clearTimers]);

  // User interaction management
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (zip.length > 0) {
      setUserActive(true);
      clearTimers();
      setDemoStep(1);
      setDemoPhase("idle");
      setDemoZip("");
      setS3Phase(0);
      setS4Phase(0);
      setS5Phase(0);
    } else if (!zip && userActive) {
      t = setTimeout(() => {
        setUserActive(false);
        setDemoCase(0);
      }, 1200);
    }
    return () => {
      if (t !== undefined) clearTimeout(t);
    };
  }, [zip, userActive, clearTimers]);

  const dc = DEMO_CASES[demoCase % DEMO_CASES.length];
  const activeStep = userActive ? 1 : demoStep;
  const activeZip = userActive ? zip : demoZip;

  const handleStart = useCallback(() => {
    if (isValid) window.location.href = "/wizard";
    else inputRef.current?.focus();
  }, [isValid]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValid) handleStart();
    },
    [isValid, handleStart]
  );
  const handleFocus = useCallback(() => {
    if (!userActive) {
      setUserActive(true);
      clearTimers();
      setDemoStep(1);
      setDemoPhase("idle");
      setDemoZip("");
    }
  }, [userActive, clearTimers]);

  const stepLabels = ["Location", "Industry", "Profile", "Add-ons", "Results"];
  const stepIcons = [
    <Zap key="1" size={12} className="text-yellow-400 flex-shrink-0" />,
    <Building2 key="2" size={12} className="text-yellow-400 flex-shrink-0" />,
    <Sliders key="3" size={12} className="text-yellow-400 flex-shrink-0" />,
    <Cpu key="4" size={12} className="text-yellow-400 flex-shrink-0" />,
    <BarChart3 key="5" size={12} className="text-yellow-400 flex-shrink-0" />,
  ];

  return (
    <div
      className="relative w-full max-w-[380px] rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0C1829 0%, #080F1E 100%)",
        animation: "heartbeatBorder 4s ease-in-out infinite",
        boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Top accent */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <img src={SHIELD_GOLD} alt="" className="w-7 h-7 object-contain" />
          <span
            className="text-yellow-400 text-[15px] font-bold tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            TrueQuote
          </span>
          <span className="text-[11px] text-slate-500 font-semibold ml-1 uppercase tracking-widest">
            Engine
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            LIVE
          </span>
          <span className="text-[10px] text-slate-600">
            <LiveClock />
          </span>
        </div>
      </div>

      {/* Step progress bar — 5 segments */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-[3px] w-full rounded-full transition-all duration-500 ${
                  s < activeStep
                    ? "bg-yellow-500"
                    : s === activeStep
                      ? "bg-yellow-400"
                      : "bg-white/8"
                }`}
              />
              <span
                className={`text-[8px] font-mono transition-colors duration-300 ${
                  s === activeStep
                    ? "text-yellow-400"
                    : s < activeStep
                      ? "text-yellow-600/50"
                      : "text-slate-700"
                }`}
              >
                {stepLabels[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP CONTENT ── */}
      <div className="px-5 pb-2" style={{ minHeight: 260 }}>
        {/* STEP 1 — Location / ZIP */}
        {activeStep === 1 && (
          <div key="step1" style={{ animation: "truequote-fadein 0.35s ease-out" }}>
            <div className="flex items-center gap-2 mb-3">
              {stepIcons[0]}
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Where is your facility?
              </h3>
            </div>
            <label className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-semibold block mb-1.5">
              ZIP Code
            </label>
            <div className="relative mb-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={userActive ? zip : activeZip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder="e.g. 90210"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-base font-bold placeholder:text-slate-700 focus:outline-none focus:border-yellow-500/40 transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}
                readOnly={!userActive}
              />
              {demoPhase === "resolved" && !userActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </div>
            <div className="h-5">
              {demoPhase === "locating" && (
                <p
                  className="text-[11px] font-mono text-slate-500"
                  style={{ animation: "truequote-fadein 0.3s ease-out" }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5 animate-pulse" />
                  Locating facility...
                </p>
              )}
              {demoPhase === "fetching" && (
                <p
                  className="text-[11px] font-mono text-slate-500"
                  style={{ animation: "truequote-fadein 0.3s ease-out" }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5 animate-pulse" />
                  Fetching utility rates for {activeZip}...
                </p>
              )}
              {demoPhase === "resolved" && !userActive && (
                <p
                  key="resolved"
                  className="text-[11px] font-mono text-emerald-400"
                  style={{ animation: "truequote-fadein 0.3s ease-out" }}
                >
                  {dc.utility} · ${dc.rate.toFixed(2)}/kWh · {dc.city}, {dc.state}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — Industry */}
        {activeStep === 2 && (
          <div key="step2" style={{ animation: "truequote-fadein 0.35s ease-out" }}>
            <div className="flex items-center gap-2 mb-3">
              {stepIcons[1]}
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                What type of facility?
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CASES.map((c, i) => (
                <div
                  key={c.industry}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-300 ${
                    c.industry === dc.industry
                      ? "border-yellow-500/40 bg-yellow-500/[0.08]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                  style={{ animation: `truequote-fadein 0.3s ease-out ${i * 60}ms both` }}
                >
                  <span className="text-base leading-none">{c.industryEmoji}</span>
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      c.industry === dc.industry ? "text-yellow-300" : "text-slate-500"
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {c.industry}
                  </span>
                  {c.industry === dc.industry && (
                    <CheckCircle2 className="w-3 h-3 text-yellow-400 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Profile questions */}
        {activeStep === 3 && (
          <div key="step3" style={{ animation: "truequote-fadein 0.35s ease-out" }}>
            <div className="flex items-center gap-2 mb-4">
              {stepIcons[2]}
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Tell us about your {dc.industry.toLowerCase()}
              </h3>
            </div>
            <div className="space-y-3">
              {/* Q1 */}
              <div
                className={`transition-all duration-400 ${s3Phase >= 1 ? "opacity-100" : "opacity-0"}`}
              >
                <label className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold block mb-1">
                  {dc.profileQ1}
                </label>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span
                    className="text-sm font-bold text-white"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: s3Phase >= 2 ? 1 : 0,
                      transition: "opacity 0.4s",
                    }}
                  >
                    {dc.profileA1}
                  </span>
                  {s3Phase >= 2 && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              </div>
              {/* Q2 */}
              <div
                className={`transition-all duration-400 ${s3Phase >= 3 ? "opacity-100" : "opacity-0"}`}
              >
                <label className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold block mb-1">
                  {dc.profileQ2}
                </label>
                <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <span
                    className="text-sm font-bold text-white"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: s3Phase >= 4 ? 1 : 0,
                      transition: "opacity 0.4s",
                    }}
                  >
                    {dc.profileA2}
                  </span>
                  {s3Phase >= 4 && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              </div>
              {/* Progress hint */}
              <p className="text-[10px] text-slate-700 font-mono">
                {s3Phase >= 4
                  ? "✓ Profile complete — continuing..."
                  : "Analyzing facility profile..."}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — Add-ons */}
        {activeStep === 4 && (
          <div key="step4" style={{ animation: "truequote-fadein 0.35s ease-out" }}>
            <div className="flex items-center gap-2 mb-4">
              {stepIcons[3]}
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Recommended add-ons
              </h3>
            </div>
            {/* Add-on chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {dc.addOns.map((a, i) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/[0.08] text-[11px] font-semibold text-blue-300"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    opacity: s4Phase >= 1 ? 1 : 0,
                    transition: `opacity 0.3s ${i * 120}ms`,
                  }}
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  {a}
                </span>
              ))}
            </div>
            {/* Sizing numbers */}
            <div
              className="grid grid-cols-2 gap-2"
              style={{ opacity: s4Phase >= 2 ? 1 : 0, transition: "opacity 0.5s" }}
            >
              {dc.solarKW > 0 && (
                <div className="bg-black/30 border border-white/[0.06] rounded-lg p-3">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    Solar
                  </div>
                  <div
                    className="text-lg font-extrabold text-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {dc.solarKW} kW
                  </div>
                </div>
              )}
              {dc.bessKWh > 0 && (
                <div
                  className={`bg-black/30 border border-white/[0.06] rounded-lg p-3 ${dc.solarKW === 0 ? "col-span-2" : ""}`}
                >
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                    BESS Storage
                  </div>
                  <div
                    className="text-lg font-extrabold text-white"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {dc.bessKWh.toLocaleString()} kWh
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5 — Results */}
        {activeStep === 5 && (
          <div key="step5" style={{ animation: "truequote-fadein 0.35s ease-out" }}>
            <div className="flex items-center gap-2 mb-3">
              {stepIcons[4]}
              <h3
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Your TrueQuote results
              </h3>
            </div>
            {/* Primary: annual savings */}
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 mb-3">
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                Est. Annual Savings · {dc.industry}, {dc.city}
              </div>
              <div
                className="text-3xl font-extrabold text-emerald-400 tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {s5Phase >= 1 ? (
                  <RollingNumber
                    key={`${dc.city}-savings`}
                    target={dc.annualSavings}
                    prefix="$"
                    duration={1600}
                  />
                ) : (
                  "$0"
                )}
              </div>
              <div className="text-[9px] text-slate-600 font-mono mt-0.5">per year</div>
            </div>
            {/* Secondary metrics */}
            <div
              className="grid grid-cols-3 gap-2"
              style={{ opacity: s5Phase >= 2 ? 1 : 0, transition: "opacity 0.5s" }}
            >
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                  Payback
                </div>
                <div
                  className="text-sm font-extrabold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {dc.paybackYears}y
                </div>
              </div>
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
                  CO₂ / yr
                </div>
                <div
                  className="text-sm font-extrabold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {dc.co2Tons}T
                </div>
              </div>
              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-2.5 text-center">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">IRR</div>
                <div
                  className="text-sm font-extrabold text-emerald-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {dc.irr}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div className="px-5 pb-5 pt-3">
        <button
          onClick={handleStart}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
            isValid
              ? "bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow-500/20"
              : activeStep === 5
                ? "bg-yellow-500/20 text-yellow-400/70 border border-yellow-500/20 cursor-default"
                : "bg-white/5 text-white/30 border border-white/[0.08]"
          }`}
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {isValid
            ? "Build my TrueQuote"
            : activeStep === 5
              ? "Enter your ZIP to get started"
              : "Enter ZIP to begin"}
          {isValid && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom progress track — tied to step */}
      <div className="h-[2px] bg-white/[0.03]">
        <div
          className="h-full bg-yellow-500/60 transition-all duration-700"
          style={{ width: `${(activeStep / 5) * 100}%` }}
        />
      </div>

      {/* Demo case indicator dots */}
      {!userActive && (
        <div className="absolute bottom-3 right-4 flex gap-1">
          {DEMO_CASES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === demoCase % DEMO_CASES.length ? 14 : 4,
                height: 4,
                background:
                  i === demoCase % DEMO_CASES.length
                    ? "rgba(245,158,11,0.55)"
                    : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes truequote-fadein {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartbeatBorder {
          0%, 100% { box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08); }
          50%       { box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.12); }
        }
      `}</style>
    </div>
  );
}

// ── HeroSection ────────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-x-hidden pt-16 bg-[#060D1F]"
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 hero-glow" />

      {/* Faint grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-8 w-full">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_500px] gap-6 xl:gap-10 items-center">
          {/* ── Left: headline + path selector ─────────────────────────────── */}
          <div>
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wide mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              TrueQuote + ProQuote · MerlinAI powered
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up-delay-1 text-7xl sm:text-8xl md:text-9xl font-extrabold leading-[0.88] tracking-tight mb-5"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="text-emerald-400">Energy ROI</span>
              <br />
              <span className="text-white">in minutes.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="animate-fade-up-delay-1 text-2xl sm:text-3xl text-white leading-relaxed max-w-2xl mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <strong>Real costs. Real savings. Real decisions.</strong>{" "}
              <span className="text-slate-400">
                Build a TrueQuote or ProQuote and know what to build before you build it.
              </span>
            </p>

            {/* Technology tags */}
            <div className="animate-fade-up-delay-2 flex flex-wrap gap-x-4 gap-y-1 mb-5">
              {["SOLAR", "BESS", "BACKUP POWER", "EV CHARGING"].map((tag, i) => (
                <span
                  key={tag}
                  className="flex items-center gap-2 text-xs font-semibold tracking-widest text-blue-400 uppercase"
                >
                  {i > 0 && <span className="text-slate-700">•</span>}
                  {tag}
                </span>
              ))}
            </div>

            {/* Path selector */}
            <div className="animate-fade-up-delay-3 mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium mb-3">
                Choose your path
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <a
                  href="/wizard"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.04] hover:bg-yellow-500/[0.08] hover:border-yellow-500/35 transition-all duration-200 group flex-1"
                >
                  <img
                    src={SHIELD_GOLD}
                    alt="TrueQuote"
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold text-yellow-400/90 group-hover:text-yellow-300 transition-colors"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      TrueQuote
                    </div>
                    <div className="text-[11px] text-slate-600">
                      For facility owners &amp; operators
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-yellow-400/50 transition-colors flex-shrink-0" />
                </a>
                <a
                  href="/proquote"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] hover:bg-blue-500/[0.08] hover:border-blue-500/35 transition-all duration-200 group flex-1"
                >
                  <img
                    src={SHIELD_BLUE}
                    alt="ProQuote"
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold text-blue-400/90 group-hover:text-blue-300 transition-colors"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      ProQuote
                    </div>
                    <div className="text-[11px] text-slate-600">For vendors &amp; EPCs</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-blue-400/50 transition-colors flex-shrink-0" />
                </a>
              </div>
            </div>

            {/* Social proof strip */}
            <div className="animate-fade-up-delay-3 flex items-center gap-3 mb-6 pl-1">
              <div className="flex -space-x-2">
                {["#10B981", "#3ECF8E", "#06B6D4", "#8B5CF6"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#060D1F] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {["JL", "MR", "AK", "TS"][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-slate-300 font-semibold">340+ quotes</span> built by facility
                owners &amp; EPCs across 18 states
              </p>
            </div>

            {/* Trust bar */}
            <div className="animate-fade-up-delay-4">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 font-medium">
                Built on trusted data sources
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {trustItems.map((item) => (
                  <span key={item} className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Zap size={9} className="text-blue-500/40" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: calculation theater — hidden on mobile ────────────────── */}
          <div className="hidden lg:flex items-center justify-center">
            <CalculationCard />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060D1F] to-transparent" />
    </section>
  );
}
