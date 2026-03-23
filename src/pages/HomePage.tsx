/**
 * MERLIN HOME PAGE
 * ================
 * Marketing landing page at /home (and / when no other route matches)
 * Supabase-inspired dark design with #3ECF8E green accent
 */

import React, { useState } from "react";
import { MerlinBatteryLogo } from "@/components/shared/MerlinBatteryLogo";
import {
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Battery,
  Sun,
  ChevronRight,
  Star,
  CheckCircle,
  BarChart3,
  Globe,
} from "lucide-react";

const DATA_SOURCES = [
  "NREL ATB 2024",
  "IRA 2022 ITC",
  "Live EIA Utility Rates",
  "IEEE 446-1995",
  "CBECS 2018",
  "ASHRAE 90.1",
  "LBNL Commercial",
  "DOE DSIRE Database",
  "SAM v2024.1",
  "S&P LCOE Index",
  "NFPA 855-2023",
  "UL 9540A",
  "NREL ATB 2024",
  "IRA 2022 ITC",
  "Live EIA Utility Rates",
  "IEEE 446-1995",
  "CBECS 2018",
  "ASHRAE 90.1",
  "LBNL Commercial",
  "DOE DSIRE Database",
  "SAM v2024.1",
  "S&P LCOE Index",
  "NFPA 855-2023",
  "UL 9540A",
];

const INDUSTRIES = [
  { slug: "/hotel", label: "Hotel", icon: "🏨", savings: "$180K/yr" },
  { slug: "/car-wash", label: "Car Wash", icon: "🚗", savings: "$95K/yr" },
  { slug: "/data-center", label: "Data Center", icon: "🖥️", savings: "$420K/yr" },
  { slug: "/hospital", label: "Hospital", icon: "🏥", savings: "$310K/yr" },
  { slug: "/ev-charging", label: "EV Charging", icon: "⚡", savings: "$140K/yr" },
  { slug: "/manufacturing", label: "Manufacturing", icon: "🏭", savings: "$250K/yr" },
  { slug: "/retail", label: "Retail", icon: "🛍️", savings: "$120K/yr" },
  { slug: "/warehouse", label: "Warehouse", icon: "📦", savings: "$160K/yr" },
  { slug: "/office", label: "Office", icon: "🏢", savings: "$110K/yr" },
  { slug: "/gas-station", label: "Gas Station", icon: "⛽", savings: "$75K/yr" },
  { slug: "/cold-storage", label: "Cold Storage", icon: "🧊", savings: "$200K/yr" },
  { slug: "/shopping-center", label: "Shopping Center", icon: "🛒", savings: "$340K/yr" },
  { slug: "/casino", label: "Casino", icon: "🎰", savings: "$480K/yr" },
  { slug: "/airport", label: "Airport", icon: "✈️", savings: "$560K/yr" },
  { slug: "/college", label: "College", icon: "🎓", savings: "$290K/yr" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us about your facility",
    desc: "Select your industry and answer a few quick questions about size, hours, and energy goals.",
    color: "text-[#3ECF8E]",
    border: "border-[#3ECF8E]/20",
    bg: "bg-[#3ECF8E]/5",
  },
  {
    step: "02",
    title: "Get a TrueQuote™ in seconds",
    desc: "Our engine runs NREL ATB 2024 benchmarks, IRA 2022 ITC, and real utility rates for your zip code.",
    color: "text-violet-400",
    border: "border-violet-400/20",
    bg: "bg-violet-400/5",
  },
  {
    step: "03",
    title: "Download, share, or request a bid",
    desc: "Export a PDF, share a public link, or connect with a certified BESS installer — all in one click.",
    color: "text-sky-400",
    border: "border-sky-400/20",
    bg: "bg-sky-400/5",
  },
];

const STATS = [
  { value: "15", label: "Industries" },
  { value: "30%+", label: "Avg ITC Credit" },
  { value: "5.5yr", label: "Avg Payback" },
  { value: "NREL", label: "Data Source" },
];

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleEmailCTA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Redirect to wizard with email prefill
    window.location.href = `/wizard?email=${encodeURIComponent(email)}`;
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#080B10", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(12,12,12,0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MerlinBatteryLogo size={28} />
            <span className="font-bold text-base tracking-tight">Merlin</span>
            <span className="text-[10px] font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 px-1.5 py-0.5 rounded-full ml-1">
              ENERGY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing"
              className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
              Pricing
            </a>
            <a href="/wizard"
              className="h-8 px-4 rounded-lg bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-semibold text-sm flex items-center gap-1.5 transition-colors">
              Free Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div
          className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/5 mb-8 overflow-hidden truequote-glow"
        >
          {/* shimmer sweep */}
          <span
            className="truequote-shimmer pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(62,207,142,0.22) 50%, transparent 100%)",
            }}
          />
          {/* live dot */}
          <span className="relative z-10 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ECF8E] opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3ECF8E]" />
          </span>
          <span className="text-[#3ECF8E] text-xs font-semibold tracking-wider uppercase relative z-10">
            TrueQuote™ — Every number is sourced
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6">
          BESS quotes in{" "}
          <span
            className="text-[#3ECF8E]"
            style={{ textShadow: "0 0 40px rgba(62,207,142,0.35)" }}
          >
            60 seconds
          </span>
          <br />
          backed by real data
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Instant battery energy storage quotes for commercial facilities — powered by NREL ATB 2024,
          IRA 2022 tax credits, and live utility rates. No spreadsheets. No consultants. Free.
        </p>

        {/* Email CTA */}
        <form onSubmit={handleEmailCTA} className="flex gap-2 max-w-sm mx-auto mb-6">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-11 px-4 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-slate-600 text-sm outline-none focus:border-[#3ECF8E]/50 transition-colors"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            Get Quote
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-slate-600">
          No credit card · No account required · Export PDF free
        </p>

        {/* Stats bar */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white tabular-nums">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TrueQuote™ Data Sources Marquee ──────────────────────── */}
      <div className="border-y border-white/[0.05] overflow-hidden" style={{ background: "rgba(255,255,255,0.01)" }}>
        {/* top label */}
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
          <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[#3ECF8E]/40">Verified data sources</span>
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(62,207,142,0.12) 0%, transparent 100%)" }} />
        </div>
        {/* scrolling strip */}
        <div className="flex whitespace-nowrap pb-2.5 animate-marquee-scroll">
          {DATA_SOURCES.map((src, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-5 text-[11px] font-medium"
              style={{ color: i % 2 === 0 ? "rgba(148,163,184,0.55)" : "rgba(148,163,184,0.38)" }}
            >
              <span style={{ color: "rgba(62,207,142,0.45)", fontSize: 8 }}>✦</span>
              {src}
            </span>
          ))}
        </div>
      </div>

      {/* ── Industries Grid ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Built for every commercial facility</h2>
          <p className="text-slate-500 text-sm">
            Each vertical uses industry-specific power profiles from ASHRAE, IEEE, and CBECS
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {INDUSTRIES.map((ind) => (
            <a
              key={ind.slug}
              href={ind.slug}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#3ECF8E]/25 hover:bg-[#3ECF8E]/[0.03] transition-all cursor-pointer"
            >
              <span className="text-2xl">{ind.icon}</span>
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                {ind.label}
              </span>
              <span className="text-[10px] text-[#3ECF8E]/70 font-medium tabular-nums">
                {ind.savings}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
            <p className="text-slate-500 text-sm">From zero to bankable BESS quote in under 2 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step}
                className={`p-6 rounded-xl border ${step.border} ${step.bg}`}>
                <div className={`text-4xl font-black tabular-nums mb-4 ${step.color}`}>
                  {step.step}
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Features strip ──────────────────────────────── */}
      <section className="border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Shield className="w-5 h-5 text-[#3ECF8E]" />,
                title: "TrueQuote™ Verified",
                desc: "Every number traces to an authoritative source (NREL, IEEE, IRA 2022)",
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-violet-400" />,
                title: "IRR, NPV, Payback",
                desc: "Full financial model: 25-year projection, discounted payback, Monte Carlo",
              },
              {
                icon: <Globe className="w-5 h-5 text-sky-400" />,
                title: "Live Utility Rates",
                desc: "Auto-fetches real rates by zip code from EIA — no manual entry needed",
              },
              {
                icon: <Battery className="w-5 h-5 text-amber-400" />,
                title: "Right-sized BESS",
                desc: "IEEE 446-1995, NREL ATB 2024 sizing ratios with confidence intervals",
              },
            ].map((f) => (
              <div key={f.title}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="mb-3">{f.icon}</div>
                <div className="font-semibold text-white text-sm mb-1">{f.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ─────────────────────────────────────────── */}
      <section className="border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-slate-500 text-xs ml-1">Trusted by commercial operators</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            Ready to see your BESS ROI?
          </h2>
          <p className="text-slate-400 mb-8">
            Free. Takes 90 seconds. No consultant required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/wizard"
              className="h-12 px-8 rounded-xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              style={{ boxShadow: "0 0 30px rgba(62,207,142,0.25)" }}>
              <Zap className="w-4 h-4" />
              Start Free Quote
            </a>
            <a href="/pricing"
              className="h-12 px-8 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.06] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              View Pricing
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] bg-black/20">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3ECF8E] flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold text-slate-400">Merlin Energy</span>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "Pricing", href: "/pricing" },
              { label: "Wizard", href: "/wizard" },
              { label: "Launch", href: "/launch" },
              { label: "Support", href: "/support" },
            ].map((l) => (
              <a key={l.label} href={l.href}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="text-xs text-slate-700">
            © {new Date().getFullYear()} Merlin Energy · merlinenergy.net
          </div>
        </div>
      </footer>
    </div>
  );
}
