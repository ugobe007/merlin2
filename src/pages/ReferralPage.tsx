/**
 * REFERRAL LANDING PAGE — /r/:handle
 * =====================================
 * Personalized landing page for referral links.
 * Tracks handle in localStorage + passes as UTM to wizard.
 * Feb 25, 2026
 */

import React, { useEffect } from "react";
import { MerlinBatteryLogo } from "@/components/shared/MerlinBatteryLogo";
import { Zap, ArrowRight, Battery, Check, Users, Gift } from "lucide-react";

const FEATURES = [
  "BESS quotes in 90 seconds — free",
  "TrueQuote™: every number cites NREL, IRA 2022, IEEE",
  "15 commercial industries with real power profiles",
  "Dynamic ITC calculator (6–70% per IRA 2022)",
  "Full IRR, NPV, Monte Carlo P10/P50/P90",
  "Export PDF, Word, Excel — bank-ready models",
];

export default function ReferralPage() {
  const handle = window.location.pathname.split("/")[2] || "friend";
  const displayHandle = handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    // Persist referral handle for attribution
    if (handle && handle !== "friend") {
      localStorage.setItem("merlin_ref", handle);
      localStorage.setItem("merlin_ref_ts", Date.now().toString());
    }
  }, [handle]);

  const wizardUrl = `/wizard?ref=${encodeURIComponent(handle)}&src=referral`;

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
            href={wizardUrl}
            className="h-8 px-4 rounded-lg bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold text-sm flex items-center gap-1.5 transition-colors"
          >
            Try Free <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-14">
        {/* ── Referral banner ── */}
        <div
          className="rounded-2xl border border-[#3ECF8E]/20 p-5 flex items-center gap-4"
          style={{ background: "rgba(62,207,142,0.04)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-[#3ECF8E]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {displayHandle !== "Friend" ? (
                <>
                  <span className="text-[#3ECF8E]">{displayHandle}</span> invited you to try Merlin
                </>
              ) : (
                "You've been invited to try Merlin"
              )}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              Sign up free — no credit card required. Your first BESS quote takes under 90 seconds.
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="text-center space-y-6">
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
            is <span className="text-white font-semibold">TrueQuote™ verified</span> — every number
            traces to a published source. No consultants. No spreadsheets.{" "}
            <span className="text-[#3ECF8E]">Free.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={wizardUrl}
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

        {/* ── Stats ── */}
        <div className="flex flex-wrap justify-center gap-8 py-6 border-y border-white/[0.05]">
          {[
            { value: "< 90s", label: "Quote generation" },
            { value: "15", label: "Industry verticals" },
            { value: "NREL", label: "Primary data source" },
            { value: "Free", label: "Forever tier" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl font-black text-white tabular-nums">{m.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <div className="grid sm:grid-cols-2 gap-2">
          {FEATURES.map((f) => (
            <div
              key={f}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <Check className="w-4 h-4 text-[#3ECF8E] flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-300 leading-snug">{f}</span>
            </div>
          ))}
        </div>

        {/* ── Referral CTA ── */}
        <div
          className="rounded-2xl border border-[#3ECF8E]/20 p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(62,207,142,0.05) 0%, rgba(12,12,12,0) 100%)",
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-[#3ECF8E]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to try it?</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            {displayHandle !== "Friend"
              ? `${displayHandle} thinks Merlin will save you hours on your next BESS project. Prove them right.`
              : "Your first BESS quote takes under 90 seconds. No account needed."}
          </p>
          <a
            href={wizardUrl}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm transition-colors"
            style={{ boxShadow: "0 0 30px rgba(62,207,142,0.2)" }}
          >
            <Battery className="w-4 h-4" />
            Start Free BESS Quote
          </a>
        </div>

        {/* ── Spread the word ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Have colleagues who could use this? Send them your own referral link:
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white/60 font-mono truncate">
              https://merlinenergy.net/r/{handle}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(`https://merlinenergy.net/r/${handle}`)}
              className="px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white/50 hover:text-white font-semibold transition-colors whitespace-nowrap"
            >
              Copy
            </button>
          </div>
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
