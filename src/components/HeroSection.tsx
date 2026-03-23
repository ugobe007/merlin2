/* Merlin Energy — Hero Section
   Design: Asymmetric split — left-aligned headline (55%), right animated rotating quote card (45%)
   Three POP improvements:
   1. "Energy ROI" in bright green — aggressive, on-brand
   2. Quote card rotates through 3 industry examples every 4s with live pulse indicator
   3. Social proof strip below path selector */

import { useState, useEffect } from "react";

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
      {/* Glow */}
      <div className="absolute -inset-4 rounded-3xl bg-yellow-500/5 blur-2xl" />

      {/* Card */}
      <div className="relative rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src={SHIELD_GOLD} alt="TrueQuote" className="w-7 h-7 object-contain" />
            <span className="text-yellow-400 text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              TrueQuote
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            Live Demo
          </span>
        </div>

        {/* Animation Container */}
        <div className="px-7 py-8 min-h-[300px] flex items-center justify-center">
          
          {/* STEP 1: ZIP CODE */}
          {step === 0 && (
            <div className="w-full animate-fade-in">
              <h4 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                📍 Where is your facility?
              </h4>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wide">ZIP Code</label>
                  <input
                    type="text"
                    value={zipText}
                    readOnly
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-800/50 border-2 border-slate-700 text-white text-lg font-mono focus:outline-none pointer-events-none transition-all duration-200"
                    style={{ borderColor: showZipCheck ? '#10b981' : '' }}
                    placeholder="Enter ZIP"
                  />
                  {showZipCheck && (
                    <div className="absolute right-4 top-11 text-emerald-400 text-2xl animate-scale-in">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS NAME + GOOGLE PLACES */}
          {step === 1 && (
            <div className="w-full animate-fade-in">
              <h4 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                🏢 What's your business?
              </h4>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wide">Business Name</label>
                  <input
                    type="text"
                    value={businessText}
                    readOnly
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-800/50 border-2 border-slate-700 text-white text-base focus:outline-none pointer-events-none transition-all duration-200"
                    style={{ borderColor: showBusinessCheck ? '#10b981' : '' }}
                    placeholder="Enter business name"
                  />
                  {showBusinessCheck && (
                    <div className="absolute right-4 top-11 text-emerald-400 text-2xl animate-scale-in">
                      ✓
                    </div>
                  )}
                </div>

                {/* Google Places Lookup Animation */}
                {showPlacesLookup && (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-400 font-medium">Looking up on Google Places...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400">✓</span>
                        <span>Found: {currentIndustry.name} · {currentIndustry.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400">✓</span>
                        <span>Verified location & business type</span>
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
              <h4 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {currentIndustry.icon} Select your industry
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {industries.map((industry, i) => (
                  <div
                    key={industry.name}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      i === industryIndex
                        ? "bg-yellow-500/10 border-yellow-400 scale-105 shadow-lg shadow-yellow-500/20"
                        : "bg-slate-800/30 border-slate-700/40"
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-3xl mb-1.5">{industry.icon}</div>
                    <div className={`text-[10px] font-bold ${i === industryIndex ? "text-yellow-400" : "text-slate-600"}`}>
                      {industry.name}
                    </div>
                    {i === industryIndex && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-scale-in">
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
              <h4 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ⚡ AI-powered optimization
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">
                      ⚡
                    </div>
                    <span className="text-base font-bold text-white">MagicFit Auto-Sizing</span>
                  </div>
                  <div className="w-14 h-7 bg-emerald-500 rounded-full relative animate-slide-in shadow-lg shadow-emerald-500/50">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
                  </div>
                </div>
                {[
                  { icon: "✓", text: `Analyzing ${currentIndustry.name} energy profile`, delay: "200ms" },
                  { icon: "✓", text: "Optimizing for peak demand", delay: "400ms" },
                  { icon: "✓", text: "Calculating ROI & incentives", delay: "600ms" }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-base text-emerald-400 font-medium animate-fade-in p-3 rounded-lg bg-emerald-500/5"
                    style={{ animationDelay: item.delay }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: QUOTE READY */}
          {step === 4 && (
            <div className="w-full animate-fade-in">
              <h4 className="text-2xl font-bold text-emerald-400 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ✨ Your TrueQuote is ready!
              </h4>
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/10 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20">
                  <span className="text-sm font-medium text-slate-300">10-Year ROI</span>
                  <AnimatedNumber value={currentIndustry.roi} suffix="%" className="text-3xl font-black text-emerald-400" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <span className="text-sm text-slate-400">Annual Savings</span>
                  <AnimatedNumber value={currentIndustry.savings} prefix="$" className="text-xl font-bold text-white" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <span className="text-sm text-slate-400">Payback Period</span>
                  <span className="text-lg font-bold text-white">{currentIndustry.payback}</span>
                </div>
              </div>
              <a
                href="/wizard"
                className="inline-flex items-center justify-center w-full px-6 py-4 rounded-xl text-base font-bold text-yellow-400 border-2 border-yellow-400 hover:bg-yellow-400 hover:text-slate-900 transition-all duration-200 animate-pulse-slow shadow-lg shadow-yellow-500/30"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Build your TrueQuote now →
              </a>
            </div>
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 px-7 py-5 border-t border-white/[0.06]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-10 bg-yellow-400 shadow-lg shadow-yellow-400/50"
                  : i < step
                    ? "w-2 bg-emerald-400"
                    : "w-2 bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Animated number counter
function AnimatedNumber({ value, prefix = "", suffix = "", className = "" }: { value: number; prefix?: string; suffix?: string; className?: string }) {
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
    <span className={className}>
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
