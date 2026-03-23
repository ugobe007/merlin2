/* Merlin Energy — Hero Section
   Design: Asymmetric split — left-aligned headline (55%), right animated rotating quote card (45%)
   Three POP improvements:
   1. "Energy ROI" in bright green — aggressive, on-brand
   2. Quote card rotates through 3 industry examples every 4s with live pulse indicator
   3. Social proof strip below path selector */

import React, { useState, useEffect } from "react";

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

    // Step 4: MAGICFIT (2s)
    if (step === 3) {
      timer = setTimeout(() => setStep(4), 2000);
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
    <div className="relative w-full max-w-lg mx-auto">
      {/* Multi-layer outer glow */}
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

          {/* STEP 1: ZIP CODE */}
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
          {step === 2 && (
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

          {/* STEP 4: MAGICFIT */}
          {step === 3 && (
            <div className="w-full animate-fade-in">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-semibold mb-1">Step 4 of 5</p>
              <h4 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ⚡ AI-powered optimization
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(59,130,246,0.08))", border: "1.5px solid rgba(16,185,129,0.30)", boxShadow: "0 0 20px rgba(16,185,129,0.12)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(16,185,129,0.15)" }}>⚡</div>
                    <span className="text-sm font-bold text-white">MagicFit Auto-Sizing</span>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-lg shadow-emerald-500/40">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                {[
                  { text: `Analyzing ${currentIndustry.name} energy profile`, delay: "100ms" },
                  { text: "Optimizing for peak demand", delay: "350ms" },
                  { text: "Calculating ROI & incentives", delay: "600ms" }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-emerald-400 font-medium animate-fade-in px-4 py-2.5 rounded-lg"
                    style={{ background: "rgba(16,185,129,0.05)", animationDelay: item.delay }}
                  >
                    <span className="text-base font-bold">✓</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: QUOTE READY */}
          {step === 4 && (
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
                style={{ background: "linear-gradient(135deg,#d97706,#b45309)", color: "#fff", boxShadow: "0 4px 20px rgba(217,119,6,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(217,119,6,0.55)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(217,119,6,0.35)")}
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
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
<div className="grid lg:grid-cols-[55%_45%] gap-8 lg:gap-12 items-center">

          {/* Left: headline */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              TrueQuote + ProQuote · MerlinAI powered
            </div>

            {/* Headline — "Energy ROI" in bright green */}
            <h1
              className="animate-fade-up-delay-1 text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[0.95] tracking-tight mb-7"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span className="text-emerald-400">Energy ROI</span>
              <br />
              <span className="text-white">in minutes.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up-delay-1 text-lg text-white leading-relaxed max-w-xl mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
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
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/wizard"
                  className="flex items-center gap-3 px-5 py-4 rounded-xl border border-yellow-500/25 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all duration-200 group"
                >
                  <img src={SHIELD_GOLD} alt="TrueQuote" className="w-8 h-8 object-contain flex-shrink-0" />
                  <div>
                    <div className="text-base font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>TrueQuote</div>
                    <div className="text-xs text-slate-500">For facility owners &amp; operators</div>
                  </div>
                </a>
                <a
                  href="/proquote"
                  className="flex items-center gap-3 px-5 py-4 rounded-xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-200 group"
                >
                  <img src={SHIELD_BLUE} alt="ProQuote" className="w-8 h-8 object-contain flex-shrink-0" />
                  <div>
                    <div className="text-base font-bold text-blue-400 group-hover:text-blue-300 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ProQuote</div>
                    <div className="text-xs text-slate-500">For vendors &amp; EPCs</div>
                  </div>
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
