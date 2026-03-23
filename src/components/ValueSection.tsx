/* Merlin Energy — Value Section
   Design: Full-bleed dark section, large pull quote with inline narrative
   "Why Merlin" as expandable panel with proper product badges */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const SHIELD_GOLD = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

export default function ValueSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-24 bg-[#060D1F] relative overflow-hidden">
      {/* Decorative background letter */}
      <div
        className="absolute -bottom-8 -right-8 text-[280px] font-extrabold text-white/[0.015] select-none pointer-events-none leading-none"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        M
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-start gap-6 lg:gap-10">
          {/* Vertical label */}
          <div className="hidden lg:flex flex-col items-center gap-3 pt-3 flex-shrink-0">
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-blue-500/40" />
            <span
              className="text-[10px] text-slate-700 uppercase tracking-[0.2em] font-medium"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Why Merlin
            </span>
          </div>

          <div className="flex-1 max-w-5xl">
            {/* The big statement with badges */}
            <div className="mb-8">
              <blockquote
                className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-8"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                "Start with the quote.
                <br />
                <span className="gradient-text">Build after."</span>
              </blockquote>

              {/* Product badges inline */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <img src={SHIELD_GOLD} alt="TrueQuote" className="w-7 h-7 object-contain" />
                  <div>
                    <div className="text-sm font-bold text-yellow-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      TrueQuote
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">For Customers</div>
                  </div>
                </div>
                
                <span className="text-slate-600 text-2xl">+</span>
                
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <img src={SHIELD_BLUE} alt="ProQuote" className="w-7 h-7 object-contain" />
                  <div>
                    <div className="text-sm font-bold text-blue-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ProQuote
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">For Vendors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable toggle button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3 px-5 py-3 rounded-xl border border-blue-500/40 hover:border-blue-400 transition-all duration-300 mb-6 group"
            >
              <span className="text-sm font-semibold text-blue-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {isExpanded ? "Hide Details" : "Why this approach?"}
              </span>
              <ChevronDown 
                size={16} 
                className={`text-blue-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable content */}
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="grid lg:grid-cols-2 gap-6 max-w-4xl pt-2">
                <p className="text-slate-400 text-base leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Too many energy projects stall, fail, or never start — not because the economics are bad, but because the decision process is broken. Customers can't get clear numbers. Vendors can't respond fast enough. Merlin puts{" "}
                  <span className="text-slate-300 font-medium">ROI first</span>, delivering financial clarity in minutes, not months.
                </p>
                <p className="text-slate-400 text-base leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  We give customers the{" "}
                  <span className="text-slate-300 font-medium">clarity and structure</span> to make confident decisions, and vendors the tools to respond with{" "}
                  <span className="text-slate-300 font-medium">speed and precision</span>. From first question to buildable project — without friction, without guesswork, without momentum lost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
