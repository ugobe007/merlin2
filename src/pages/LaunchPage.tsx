/**
 * LAUNCH PAGE — /launch
 * =====================
 * Product Hunt / HN launch page.
 * Supabase-dark design, punchy copy, PH upvote badge slot.
 */

import React from "react";
import { MerlinBatteryLogo } from "@/components/shared/MerlinBatteryLogo";
import { Zap, ArrowRight, Battery, CheckCircle } from "lucide-react";

const FEATURES = [
  "TrueQuote™ — every number traces to NREL, IEEE, or IRA 2022",
  "15 commercial industries with ASHRAE/CBECS power profiles",
  "Live utility rates by zip code (EIA data, 31 major utilities)",
  "Dynamic ITC: 6–70% based on IRA 2022 prevailing wage rules",
  "Full IRR, NPV, discounted payback, Monte Carlo P10/P50/P90",
  "Margin Policy Engine — single insertion point, no double-margin",
  "Battery degradation by chemistry (LFP, NMC, NCA, Flow, Na-Ion)",
  "NREL PVWatts integration for location-specific solar production",
  "Export PDF, Word, Excel — bank-ready 3-statement model",
  "Share quotes with public URL + password protection",
];

const METRICS = [
  { value: "< 90s", label: "Quote generation" },
  { value: "15", label: "Industry verticals" },
  { value: "NREL", label: "Primary data source" },
  { value: "Free", label: "Forever tier" },
];

export default function LaunchPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#0c0c0c", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(12,12,12,0.85)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MerlinBatteryLogo size={28} />
            <span className="font-bold text-base tracking-tight">Merlin Energy</span>
          </div>
          <a
            href="/wizard"
            className="h-8 px-4 rounded-lg bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold text-sm flex items-center gap-1.5 transition-colors"
          >
            Try Free
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* ── Hero ── */}
        <div className="text-center space-y-6">
          {/* PH Badge slot */}
          <div className="flex justify-center mb-4">
            <a
              href="https://www.producthunt.com/posts/merlin-energy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=merlin-energy&theme=dark"
                alt="Merlin Energy — BESS quotes in 90 seconds | Product Hunt"
                className="h-14 w-auto"
                onError={(e) => {
                  // Fallback if PH image not yet live
                  const el = e.currentTarget.parentElement!;
                  el.innerHTML = `<div class="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-orange-500/30 bg-orange-500/[0.06] hover:bg-orange-500/[0.1] transition-colors"><span class="text-2xl">🚀</span><div class="text-left"><div class="text-orange-400 font-bold text-sm">Live on Product Hunt</div><div class="text-orange-300/60 text-xs">Click to upvote ↗</div></div></div>`;
                }}
              />
            </a>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3ECF8E]/25 bg-[#3ECF8E]/5">
            <div className="w-1.5 h-1.5 bg-[#3ECF8E] rounded-full animate-pulse" />
            <span className="text-[#3ECF8E] text-xs font-semibold uppercase tracking-wider">
              Free beta · Open now
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
            BESS quotes in{" "}
            <span
              className="text-[#3ECF8E]"
              style={{ textShadow: "0 0 40px rgba(62,207,142,0.3)" }}
            >
              60 seconds
            </span>
            <br />
            backed by NREL + IRA data
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Merlin is an instant BESS financial analysis tool for commercial facilities. Every quote
            is TrueQuote™ verified — every number traces to a published source. No consultants. No
            spreadsheets. Free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href="/wizard"
              className="h-12 px-8 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              style={{ boxShadow: "0 0 30px rgba(62,207,142,0.25)" }}
            >
              <Zap className="w-4 h-4" />
              Try It Free — 90 Seconds
            </a>
            <a
              href="/home"
              className="h-12 px-8 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* ── Metrics bar ── */}
        <div className="flex flex-wrap justify-center gap-8 py-6 border-y border-white/[0.05]">
          {METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl font-black text-white tabular-nums">{m.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature list ── */}
        <div className="grid sm:grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div
              key={f}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <CheckCircle className="w-4 h-4 text-[#3ECF8E] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-300 leading-snug">{f}</span>
            </div>
          ))}
        </div>

        {/* ── Maker note ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">👋</span>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">Hey, I'm the founder</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                I built Merlin because every BESS quote I saw was a black box — opaque assumptions,
                hardcoded spreadsheets, $5K+ consultant fees. TrueQuote™ means you can see exactly
                where every number comes from. NREL said $X/kWh. IRA 2022 says 30% ITC. IEEE
                446-1995 says your critical load is 40% of peak. All of it, cited. All of it, free.
              </p>
              <div className="mt-3 flex items-center gap-4 flex-wrap">
                <a
                  href="https://twitter.com/Merlin_Energy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-[#3ECF8E] transition-colors"
                >
                  @Merlin_Energy on X/Twitter ↗
                </a>
                <a
                  href="/press"
                  className="text-xs text-slate-500 hover:text-[#3ECF8E] transition-colors"
                >
                  Press &amp; promo kit →
                </a>
                <span className="text-xs text-slate-700">merlinenergy.net</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-white mb-3">Try it now — it's free</h2>
          <p className="text-slate-500 mb-6 text-sm">
            No account needed. Your first quote takes under 90 seconds.
          </p>
          <a
            href="/wizard"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm transition-colors"
            style={{ boxShadow: "0 0 30px rgba(62,207,142,0.2)" }}
          >
            <Battery className="w-4 h-4" />
            Start Free BESS Quote
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-700">© {new Date().getFullYear()} Merlin Energy</span>
          <div className="flex gap-5">
            {[
              { label: "Home", href: "/home" },
              { label: "Pricing", href: "/pricing" },
              { label: "Wizard", href: "/wizard" },
              { label: "Support", href: "/support" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
