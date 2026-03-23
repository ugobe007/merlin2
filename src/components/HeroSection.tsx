/* Merlin Energy — Hero Section
   Design: Asymmetric split — left-aligned headline (55%), right animated rotating quote card (45%)
   Three POP improvements:
   1. "Energy ROI" in bright green — aggressive, on-brand
   2. Quote card rotates through 3 industry examples every 4s with live pulse indicator
   3. Social proof strip below path selector */

import React, { useState, useEffect, useRef } from "react";

const SHIELD_GOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

const trustItems = [
  "NREL Data",
  "DOE Frameworks",
  "Sandia-Aligned Logic",
  "UL / IEEE",
  "TrueQuote Financial Engine",
];

// Rotating industry examples for the live card
const quoteExamples = [
  {
    industry: "Hotel",
    location: "Nevada",
    roi: "186%",
    savings: "$420K",
    payback: "3.7y",
  },
  {
    industry: "Car Wash",
    location: "Texas",
    roi: "214%",
    savings: "$180K",
    payback: "2.9y",
  },
  {
    industry: "Data Center",
    location: "Virginia",
    roi: "162%",
    savings: "$1.2M",
    payback: "4.1y",
  },
];

function QuotePreviewCard() {
  const [industryIndex, setIndustryIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [zipText, setZipText] = useState("");
  const [businessText, setBusinessText] = useState("");
  const [showZipCheck, setShowZipCheck] = useState(false);
  const [showBusinessCheck, setShowBusinessCheck] = useState(false);
  const [showPlacesLookup, setShowPlacesLookup] = useState(false);

  // Industry scenarios
  const industries = [
    {
      icon: "🏨",
      name: "Hotel",
      zip: "90210",
      business: "Sunset Hotel Beverly",
      location: "Beverly Hills, CA",
      roi: 186,
      savings: 420000,
      payback: "3.7 years"
    },
    {
      icon: "🚗",
      name: "Car Wash",
      zip: "85001",
      business: "Desert Shine Car Wash",
      location: "Phoenix, AZ",
      roi: 214,
      savings: 180000,
      payback: "2.9 years"
    },
    {
      icon: "💾",
      name: "Data Center",
      zip: "22201",
      business: "CloudEdge Data Center",
      location: "Arlington, VA",
      roi: 162,
      savings: 1200000,
      payback: "4.1 years"
    },
    {
      icon: "🏥",
      name: "Hospital",
      zip: "60601",
      business: "Metro Health Hospital",
      location: "Chicago, IL",
      roi: 178,
      savings: 890000,
      payback: "3.5 years"
    }
  ];

  const currentIndustry = industries[industryIndex];

  // ── Option E: 3D card tilt ─────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const nx = (e.clientY - rect.top) / rect.height - 0.5;
    const ny = (e.clientX - rect.left) / rect.width - 0.5;
    setTilt({ x: -nx * 8, y: ny * 8 });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  // ── Option A: API fetch loader (steps 2–4) ──────────────────────
  const [apiLoader, setApiLoader] = useState(false);
  const apiMessages = [
    "",
    "",
    "Loading NREL industry benchmarks...",
    "Running MagicFit™ · NREL ATB · EIA · IRA 2022...",
    "Compiling TrueQuote™ report...",
  ];
  useEffect(() => {
    if (step >= 2) {
      setApiLoader(true);
      const t = setTimeout(() => setApiLoader(false), 680);
      return () => clearTimeout(t);
    }
  }, [step]);

  // ── Option B: Energy bars (step 3) ─────────────────────────────
  const barTargets = [72, 58, 84];
  const [barsActive, setBarsActive] = useState([false, false, false]);
  useEffect(() => {
    if (step === 3) {
      setBarsActive([false, false, false]);
      [0, 1, 2].forEach((i) => {
        setTimeout(() => {
          setBarsActive((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 780 + i * 480);
      });
    }
  }, [step]);

  // Animation control
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    // Step 1: ZIP CODE (3s total)
    if (step === 0) {
      setZipText("");
      setShowZipCheck(false);
      
      const zipChars = currentIndustry.zip.split("");
      let charIndex = 0;
      typingInterval = setInterval(() => {
        if (charIndex < zipChars.length) {
          setZipText(zipChars.slice(0, charIndex + 1).join(""));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => setShowZipCheck(true), 200);
        }
      }, 100);
      
      timer = setTimeout(() => setStep(1), 3000);
      return () => { clearInterval(typingInterval); clearTimeout(timer); };
    }

    // Step 2: BUSINESS NAME + GOOGLE PLACES (3.5s total)
    if (step === 1) {
      setBusinessText("");
      setShowBusinessCheck(false);
      setShowPlacesLookup(false);
      
      const businessChars = currentIndustry.business.split("");
      let charIndex = 0;
      typingInterval = setInterval(() => {
        if (charIndex < businessChars.length) {
          setBusinessText(businessChars.slice(0, charIndex + 1).join(""));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setShowPlacesLookup(true);
            setTimeout(() => setShowBusinessCheck(true), 800);
          }, 300);
        }
      }, 80);
      
      timer = setTimeout(() => setStep(2), 3500);
      return () => { clearInterval(typingInterval); clearTimeout(timer); };
    }

    // Step 3: INDUSTRY (2.5s)
    if (step === 2) {
      timer = setTimeout(() => setStep(3), 2500);
      return () => clearTimeout(timer);
    }

    // Step 4: MAGICFIT (3.5s — bars need time to fill)
    if (step === 3) {
      timer = setTimeout(() => setStep(4), 3500);
      return () => clearTimeout(timer);
    }

    // Step 5: QUOTE READY (3.5s)
    if (step === 4) {
      timer = setTimeout(() => {
        setStep(0);
        setIndustryIndex((prev) => (prev + 1) % industries.length);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step, industryIndex]);

  return (
    <div
      ref={cardRef}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.6s ease" : "transform 0.08s ease",
        willChange: "transform",
      }}
    >
      {/* Multi-layer outer glow */
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-yellow-500/25 via-emerald-500/10 to-blue-600/10 blur-2xl" />
      <div className="absolute -inset-6 rounded-3xl bg-yellow-400/8 blur-3xl" />

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: "linear-gradient(145deg, #1a2235 0%, #0d1525 60%, #0a1020 100%)",
          border: "1px solid rgba(234,179,8,0.30)",
          boxShadow: "0 0 0 1px rgba(234,179,8,0.08), 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src={SHIELD_GOLD} alt="TrueQuote" className="w-8 h-8 object-contain drop-shadow-lg" />
            <span className="text-yellow-400 text-lg font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              TrueQuote
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">Live</span>
            <span className="text-slate-600 mx-1">·</span>
            <span className="text-slate-300 text-[11px] font-medium">{currentIndustry.name} — {currentIndustry.location.split(",")[1]?.trim() ?? currentIndustry.location}</span>
          </div>
        </div>

        {/* Animation Container */}
        <div className="px-6 py-6 min-h-[310px] flex items-center justify-center">

          {/* API FETCH LOADER — steps 2–4 */}
          {apiLoader && step >= 2 && (
            <div className="w-full animate-fade-in">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                </span>
                <span className="text-[11px] text-blue-400 font-mono font-semibold tracking-wider">{apiMessages[step]}</span>
              </div>
              <div className="space-y-3">
                {[68, 44, 58].map((w, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full animate-pulse"
                    style={{ background: "rgba(59,130,246,0.10)", width: `${w}%`, animationDelay: `${i * 130}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: ZIP CODE */
          {step === 0 && (
            <div className="w-full animate-fade-in">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-semibold mb-1">Step 1 of 5</p>
              <h4 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                📍 Where is your facility?
              </h4>
              <div className="relative">
                <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">ZIP Code</label>
                <input
                  type="text"
                  value={zipText}
                  readOnly
                  className="w-full px-4 py-3.5 rounded-xl text-white text-lg font-mono focus:outline-none pointer-events-none transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `2px solid ${showZipCheck ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: showZipCheck ? "0 0 12px rgba(16,185,129,0.2)" : "none"
                  }}
                  placeholder="Enter ZIP"
                />
                {showZipCheck && (
                  <div className="absolute right-4 top-[2.6rem] text-emerald-400 text-xl animate-scale-in font-bold">✓</div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS NAME + GOOGLE PLACES */}
          {step === 1 && (
            <div className="w-full animate-fade-in">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-semibold mb-1">Step 2 of 5</p>
              <h4 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🏢 What's your business?
              </h4>
              <div className="space-y-3">
                <div className="relative">
                  <label className="block text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">Business Name</label>
                  <input
                    type="text"
                    value={businessText}
                    readOnly
                    className="w-full px-4 py-3.5 rounded-xl text-white text-sm focus:outline-none pointer-events-none transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `2px solid ${showBusinessCheck ? "#10b981" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: showBusinessCheck ? "0 0 12px rgba(16,185,129,0.2)" : "none"
                    }}
                    placeholder="Enter business name"
                  />
                  {showBusinessCheck && (
                    <div className="absolute right-4 top-[2.6rem] text-emerald-400 text-xl animate-scale-in font-bold">✓</div>
                  )}
                </div>
                {showPlacesLookup && (
                  <div className="p-3.5 rounded-xl animate-fade-in" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-xs text-blue-400 font-semibold">Looking up on Google Places...</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Found: {currentIndustry.name} · {currentIndustry.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Verified location &amp; business type</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INDUSTRY */}
          {step === 2 && !apiLoader && (
            <div className="w-full animate-fade-in">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-semibold mb-1">Step 3 of 5</p>
              <h4 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {currentIndustry.icon} Select your industry
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                {industries.map((industry, i) => (
                  <div
                    key={industry.name}
                    className="relative p-3.5 rounded-xl transition-all duration-300 cursor-default"
                    style={{
                      background: i === industryIndex ? "rgba(234,179,8,0.10)" : "rgba(255,255,255,0.03)",
                      border: `2px solid ${i === industryIndex ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.06)"}`,
                      transform: i === industryIndex ? "scale(1.06)" : "scale(1)",
                      boxShadow: i === industryIndex ? "0 0 16px rgba(234,179,8,0.2)" : "none"
                    }}
                  >
                    <div className="text-2xl mb-1">{industry.icon}</div>
                    <div className={`text-[10px] font-bold leading-tight ${i === industryIndex ? "text-yellow-400" : "text-slate-600"}`}>
                      {industry.name}
                    </div>
                    {i === industryIndex && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-black animate-scale-in shadow-lg shadow-emerald-500/40">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: MAGICFIT — animated energy bars */}
          {step === 3 && !apiLoader && (
            <div className="w-full animate-fade-in">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-semibold mb-1">Step 4 of 5</p>
              <h4 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ⚡ AI-powered optimization
              </h4>
              {/* MagicFit active badge */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.10),rgba(59,130,246,0.06))", border: "1.5px solid rgba(16,185,129,0.25)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚡</span>
                  <span className="text-sm font-bold text-white">MagicFit™ Energy Model</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Active</span>
              </div>
              {/* Animated energy bars */}
              <div className="space-y-3.5">
                {[
                  { label: "Peak Demand Offset", target: barTargets[0], color: "#facc15", glow: "rgba(250,204,21,0.45)" },
                  { label: "Solar Production",    target: barTargets[1], color: "#10b981", glow: "rgba(16,185,129,0.45)" },
                  { label: "BESS Dispatch",       target: barTargets[2], color: "#3b82f6", glow: "rgba(59,130,246,0.45)" },
                ].map((bar, i) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">{bar.label}</span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: bar.color }}>
                        {barsActive[i] ? <AnimatedNumber value={bar.target} suffix="%" className="" /> : "—"}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          width: barsActive[i] ? `${bar.target}%` : "0%",
                          background: bar.color,
                          boxShadow: barsActive[i] ? `0 0 10px ${bar.glow}` : "none",
                          transition: "width 0.75s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Data sources */}
              <div className="flex gap-1.5 mt-4">
                {["NREL ATB", "EIA", "IRA 2022"].map((src) => (
                  <span key={src} className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.22)", color: "rgba(147,197,253,0.9)" }}>{src}</span>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: QUOTE READY */}
          {step === 4 && !apiLoader && (
            <div className="w-full animate-fade-in">
              {/* Hero ROI metric */}
              <div className="text-center px-4 py-5 rounded-2xl mb-3" style={{ background: "linear-gradient(160deg,rgba(16,185,129,0.12) 0%,rgba(16,185,129,0.04) 100%)", border: "1px solid rgba(16,185,129,0.22)", boxShadow: "0 0 30px rgba(16,185,129,0.10)" }}>
                <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest font-bold mb-1">10-Year ROI</p>
                <AnimatedNumber value={currentIndustry.roi} suffix="%" className="text-5xl font-black text-emerald-400 tabular-nums" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textShadow: "0 0 30px rgba(16,185,129,0.5)" }} />
                <p className="text-[10px] text-slate-600 mt-1 font-medium">Modeled by MagicFit™</p>
              </div>
              {/* Secondary metrics */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="p-3.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Annual Savings</p>
                  <AnimatedNumber value={currentIndustry.savings} prefix="$" className="text-xl font-black text-white tabular-nums" />
                  <p className="text-[10px] text-slate-600 mt-0.5">Estimated reduction</p>
                </div>
                <div className="p-3.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Payback</p>
                  <span className="text-xl font-black text-white">{currentIndustry.payback}</span>
                  <p className="text-[10px] text-slate-600 mt-0.5">Full system ROI</p>
                </div>
              </div>
              {/* Data sources strip */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {["NREL ATB", "DOE", "Sandia", "EIA", "IRA 2022"].map(src => (
                  <span key={src} className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider" style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.22)", color: "rgba(147,197,253,0.9)" }}>{src}</span>
                ))}
              </div>
              {/* Verified badge */}
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl mb-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
                <span className="text-emerald-400 font-black text-sm">✓</span>
                <span className="text-xs text-emerald-400 font-bold">TrueQuote Verified</span>
                <span className="text-xs text-slate-500">· utility rates, solar production &amp; incentives</span>
              </div>
              {/* CTA */}
              <a
                href="/wizard"
                className="inline-flex items-center justify-center w-full px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{ background: "linear-gradient(135deg,#eab308,#ca8a04)", color: "#0a0f1a", boxShadow: "0 4px 20px rgba(234,179,8,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(234,179,8,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(234,179,8,0.35)")}
              >
                See full quote →
              </a>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-5 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  flex: i === step ? "2" : "1",
                  background: i === step
                    ? "#facc15"
                    : i < step
                      ? "#10b981"
                      : "rgba(255,255,255,0.08)",
                  boxShadow: i === step ? "0 0 8px rgba(250,204,21,0.6)" : "none"
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-600 text-center font-medium">{currentIndustry.name} · {currentIndustry.location}</p>
        </div>
      </div>
    </div>
  );
}

// Animated number counter
function AnimatedNumber({ value, prefix = "", suffix = "", className = "", style }: { value: number; prefix?: string; suffix?: string; className?: string; style?: React.CSSProperties }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const formatted = value >= 1000
    ? displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : displayValue.toFixed(value < 100 ? 1 : 0);

  return (
    <span className={className} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

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
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
<div className="grid lg:grid-cols-[50%_50%] gap-8 lg:gap-10 items-center">

          {/* Left: headline */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              TrueQuote + ProQuote · MerlinAI powered
            </div>

            {/* Headline — "Energy ROI" in bright green */}
            <h1
              className="animate-fade-up-delay-1 text-6xl sm:text-7xl md:text-8xl font-extrabold leading-[0.92] tracking-tight mb-7"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span className="text-emerald-400">Energy ROI</span>
              <br />
              <span className="text-white">in minutes.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up-delay-1 text-xl sm:text-2xl text-white leading-relaxed max-w-xl mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <strong>Real costs. Real savings. Real decisions.</strong>{" "}
              <span className="text-slate-400">Build a TrueQuote or ProQuote and know what to build before you build it.</span>
            </p>

            {/* Technology tags */}
            <div className="animate-fade-up-delay-2 flex flex-wrap gap-x-4 gap-y-1 mb-8">
              {["SOLAR", "BESS", "BACKUP POWER", "EV CHARGING"].map((tag, i) => (
                <span key={tag} className="flex items-center gap-2 text-xs font-semibold tracking-widest text-blue-400 uppercase">
                  {i > 0 && <span className="text-slate-700">•</span>}
                  {tag}
                </span>
              ))}
            </div>

            {/* Choose your path */}
            <div className="animate-fade-up-delay-3 mb-5">
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium mb-3">Choose your path</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/wizard"
                  className="flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-200 group"
                  style={{
                    background: "linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.08) 100%)",
                    border: "1.5px solid rgba(234,179,8,0.55)",
                    boxShadow: "0 0 24px rgba(234,179,8,0.12)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(234,179,8,0.28) 0%, rgba(234,179,8,0.14) 100%)";
                    e.currentTarget.style.boxShadow = "0 0 32px rgba(234,179,8,0.22)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.08) 100%)";
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(234,179,8,0.12)";
                  }}
                >
                  <img src={SHIELD_GOLD} alt="TrueQuote" className="w-11 h-11 object-contain flex-shrink-0 drop-shadow-lg" />
                  <div>
                    <div className="text-lg font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TrueQuote</div>
                    <div className="text-sm text-slate-400">For facility owners &amp; operators</div>
                  </div>
                  <svg className="ml-auto text-yellow-500/50 group-hover:text-yellow-400 transition-colors flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
                <a
                  href="/proquote"
                  className="flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-200 group"
                  style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.06) 100%)",
                    border: "1.5px solid rgba(59,130,246,0.40)",
                    boxShadow: "0 0 24px rgba(59,130,246,0.08)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.10) 100%)";
                    e.currentTarget.style.boxShadow = "0 0 32px rgba(59,130,246,0.18)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.06) 100%)";
                    e.currentTarget.style.boxShadow = "0 0 24px rgba(59,130,246,0.08)";
                  }}
                >
                  <img src={SHIELD_BLUE} alt="ProQuote" className="w-11 h-11 object-contain flex-shrink-0 drop-shadow-lg" />
                  <div>
                    <div className="text-lg font-bold text-blue-400 group-hover:text-blue-300 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ProQuote</div>
                    <div className="text-sm text-slate-400">For vendors &amp; EPCs</div>
                  </div>
                  <svg className="ml-auto text-blue-500/50 group-hover:text-blue-400 transition-colors flex-shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>

            {/* Social proof strip */}
            <div className="animate-fade-up-delay-3 flex items-center gap-3 mb-10 pl-1">
              {/* Avatar stack */}
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
              <p className="text-xs text-slate-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                <span className="text-slate-300 font-semibold">340+ quotes</span> built by facility owners &amp; EPCs across 18 states
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
                    <span className="w-1 h-1 rounded-full bg-blue-500/50" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: animated rotating quote card — hidden on mobile */}
          <div className="hidden lg:flex items-center justify-end">
            <QuotePreviewCard />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#060D1F] to-transparent" />
    </section>
  );
}
