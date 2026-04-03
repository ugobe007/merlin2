/* Merlin Energy — Our Story / About Section
   Founder narrative replacing the pull-quote ValueSection.
   Placement: bottom of home page, above Footer.              */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

export default function ValueSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-16 bg-[#060D1F] border-t border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-5 h-px bg-sky-500/40" />
          <span
            className="text-[10px] text-sky-400/60 uppercase tracking-[0.25em] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Our story
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-12 xl:gap-20 items-start">
          {/* ── Left: Founder narrative ── */}
          <div>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-6"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              We've been inside these projects.
              <br className="hidden lg:block" /> That's why we built this.
            </h2>

            <div className="space-y-5">
              <p
                className="text-slate-300 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                We came from large battery manufacturers and chemical companies — and spent years
                managing megawatt-scale storage deployments across North America, Europe, and
                Asia-Pacific. We understood the technology. What we couldn't understand was why
                getting a project off the ground was still so hard.
              </p>

              <p
                className="text-slate-400 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Every facility we worked with was stuck in the same cycle: competing vendor
                proposals that disagreed by six figures, engineering studies that took months and
                cost $85,000 to confirm what the numbers already suggested, and procurement
                timelines that burned through a year of utility bills before a single panel was
                installed. The technology was ready. The decision process wasn't.
              </p>

              {/* Expandable continuation */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out space-y-5 ${
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p
                  className="text-slate-400 text-base leading-relaxed"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  We looked at what AI could do and found a critical gap: general AI systems aren't
                  trained on energy physics, utility rate structures, IRA incentive calculations, or
                  the specific demand profiles that separate a car wash from a hotel from a data
                  center. They generate text. They don't do the engineering.
                </p>
                <p
                  className="text-slate-400 text-base leading-relaxed"
                  style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  So we built <span className="text-yellow-400 font-semibold">TrueQuote</span> — a
                  decision engine designed specifically for commercial energy projects. It runs
                  physics-based solar and storage sizing, applies live utility rate data, factors
                  current incentive structures, and delivers an EPC-ready project model your team
                  can act on. The same quality of analysis that once required months of vendor
                  meetings, an engineering firm, and a procurement team — in minutes, for any
                  facility.
                </p>
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-sky-400/70 hover:text-sky-300 transition-colors"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                {isExpanded ? "Read less" : "Read more"}
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* ── Right: Product + credentials ── */}
          <div className="space-y-4">
            {/* Product badges */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080F1E] overflow-hidden">
              <div className="h-[3px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-transparent" />
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p
                  className="text-[10px] text-sky-400/60 uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  What we built
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                  <img
                    src={SHIELD_GOLD}
                    alt="TrueQuote"
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <div>
                    <div
                      className="text-sm font-bold text-yellow-400"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      TrueQuote™
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      EPC-ready project models for facility operators
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                  <img
                    src={SHIELD_BLUE}
                    alt="ProQuote"
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <div>
                    <div
                      className="text-sm font-bold text-blue-400"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      ProQuote™
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Precision response tools for EPC vendors
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080F1E] px-5 py-4 space-y-3">
              <p
                className="text-[9px] text-sky-400/50 uppercase tracking-widest font-semibold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Background
              </p>
              {[
                "Battery manufacturing & electrochemistry",
                "Global BESS deployments — NA, EU, APAC",
                "Built for industry-specific energy workflows",
                "AI tuned to energy physics, not general text",
              ].map((c) => (
                <div key={c} className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/60 mt-1.5 flex-shrink-0" />
                  <span
                    className="text-[12px] text-slate-400 leading-snug"
                    style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                  >
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
