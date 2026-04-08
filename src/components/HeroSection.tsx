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

import React from "react";
import { ChevronRight, Zap } from "lucide-react";
import QuickEstimateWidget from "./QuickEstimateWidget";

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

// ── HeroSection ────────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-[#060D1F]"
    >
      {/* Background: very faint grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(59,130,246,0.10)_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left: headline + path selector ─────────────────────────────── */}
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/[0.08] text-blue-300/80 text-[11px] font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              TrueQuote + ProQuote · MerlinAI powered
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up-delay-1 text-6xl sm:text-7xl lg:text-[82px] xl:text-[96px] font-extrabold leading-[0.92] tracking-tight mb-7"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="text-emerald-400">Energy ROI</span>
              <br />
              <span className="text-white">in minutes.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="animate-fade-up-delay-1 text-[17px] text-slate-400 leading-relaxed max-w-xl mb-6"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="text-white font-semibold">
                Real costs. Real savings. Real decisions.
              </span>{" "}
              Build a TrueQuote or ProQuote and know what to build before you build it.
            </p>

            {/* Technology tags */}
            <div className="animate-fade-up-delay-2 flex flex-wrap gap-x-4 gap-y-1 mb-8">
              {["SOLAR", "BESS", "BACKUP POWER", "EV CHARGING"].map((tag, i) => (
                <span
                  key={tag}
                  className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-blue-400/70 uppercase"
                >
                  {i > 0 && <span className="text-slate-700">•</span>}
                  {tag}
                </span>
              ))}
            </div>

            {/* Path selector */}
            <div className="animate-fade-up-delay-3 mb-5">
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

            {/* Social proof */}
            <div className="animate-fade-up-delay-3 flex items-center gap-3 mb-8 pl-1">
              <div className="flex -space-x-2">
                {["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"].map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[#060D1F] flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {["JL", "MR", "AK", "TS"][i]}
                  </div>
                ))}
              </div>
              <p
                className="text-[11px] text-slate-400 font-medium"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <span className="text-slate-200 font-semibold">340+ quotes</span> built across 18
                states
              </p>
            </div>

            {/* Trust bar */}
            <div className="animate-fade-up-delay-4">
              <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-2.5 font-semibold">
                Built on trusted data sources
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {trustItems.map((item) => (
                  <span key={item} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Zap size={9} className="text-blue-500/40" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: instant savings widget — hidden on mobile ─────────────── */}
          <div className="hidden lg:flex items-center justify-center">
            <QuickEstimateWidget />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060D1F] to-transparent" />
    </section>
  );
}
