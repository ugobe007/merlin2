/* Merlin Energy — Audience Strip
   Compact 2-path signpost. Answers "who is this for?" in one breath.
   Replaces the heavier TwoSidedSection. No bullet lists, no big cards.
   Placement: between StatusQuoSection and IndustriesSection.           */

import { ArrowRight } from "lucide-react";

export default function AudienceStrip() {
  return (
    <section className="bg-[#060D1F] border-b border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Label */}
          <span
            className="text-[10px] text-slate-600 uppercase tracking-[0.22em] font-semibold whitespace-nowrap flex-shrink-0 sm:pr-4 sm:border-r sm:border-white/[0.07]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Who it's for
          </span>

          {/* Path 1 — Facility owners */}
          <a
            href="/wizard"
            className="group flex-1 flex items-center justify-between gap-3 px-5 py-3 rounded-xl transition-all duration-200"
            style={{
              background: "rgba(62,207,142,0.05)",
              border: "1px solid rgba(62,207,142,0.14)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(62,207,142,0.09)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(62,207,142,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(62,207,142,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(62,207,142,0.14)";
            }}
          >
            <div>
              <span
                className="text-[13px] font-bold text-white block"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Facility Owners &amp; Operators
              </span>
              <span className="text-[12px] text-slate-500">
                Free TrueQuote™ · No account · ~90 seconds
              </span>
            </div>
            <ArrowRight
              size={15}
              className="text-emerald-500/60 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
            />
          </a>

          {/* Path 2 — EPCs */}
          <a
            href="/widget"
            className="group flex-1 flex items-center justify-between gap-3 px-5 py-3 rounded-xl transition-all duration-200"
            style={{
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.12)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.25)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.04)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(56,189,248,0.12)";
            }}
          >
            <div>
              <span
                className="text-[13px] font-bold text-white block"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                EPCs, Developers &amp; Integrators
              </span>
              <span className="text-[12px] text-slate-500">
                Embed TrueQuote™ on your site · Free API key · No credit card
              </span>
            </div>
            <ArrowRight
              size={15}
              className="text-sky-500/60 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all flex-shrink-0"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
