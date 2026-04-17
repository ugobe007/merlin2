/* Merlin Energy — Hero Section (April 2026 rebuild)
   Strategy:
   - Lead with the user's PROBLEM, not the product name
   - Single dominant CTA: TrueQuote™ (ProQuote demoted to nav)
   - Right panel: static mockup of actual TrueQuote output — show what they GET
   - Kill the calculator widget (generic benchmarks undercut the real-data story)
   - Story arc: problem → Merlin does the work → here's the output
*/

import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sun,
  Battery,
  TrendingDown,
} from "lucide-react";

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";

const trustItems = ["NREL Data", "DOE Frameworks", "Sandia Logic", "UL / IEEE"];

// ── Industry scenarios that cycle in the mockup ──────────────────────────────
const SCENARIOS = [
  {
    industry: "Hotel",
    name: "Grand Sierra Resort · Reno, NV",
    savings: "$218,400",
    utility: "NV Energy · $0.11/kWh",
    solar: { value: "680 kW", sub: "2,176 panels" },
    bess: { value: "500 kWh", sub: "2-hr dispatch" },
    demand: { value: "38%", sub: "$14,200/mo" },
    payback: "5.8 yrs",
    npv: "$2.1M",
    irr: "18.4%",
    sources: ["NREL irradiance", "NV Energy EG-1", "DOE BESS sizing", "30% ITC (IRA §48)"],
  },
  {
    industry: "Manufacturing",
    name: "Apex Fabrication · Dallas, TX",
    savings: "$342,000",
    utility: "Oncor · $0.09/kWh",
    solar: { value: "1.2 MW", sub: "3,840 panels" },
    bess: { value: "800 kWh", sub: "4-hr dispatch" },
    demand: { value: "44%", sub: "$21,800/mo" },
    payback: "4.9 yrs",
    npv: "$3.8M",
    irr: "21.2%",
    sources: ["NREL irradiance", "Oncor TOU tariff", "DOE BESS sizing", "30% ITC (IRA §48)"],
  },
  {
    industry: "Data Center",
    name: "CloudEdge Facility · Phoenix, AZ",
    savings: "$487,200",
    utility: "APS · $0.13/kWh",
    solar: { value: "2.1 MW", sub: "6,720 panels" },
    bess: { value: "2 MWh", sub: "4-hr dispatch" },
    demand: { value: "51%", sub: "$38,400/mo" },
    payback: "4.2 yrs",
    npv: "$5.6M",
    irr: "24.8%",
    sources: ["NREL irradiance", "APS R-3 tariff", "DOE BESS sizing", "30% ITC (IRA §48)"],
  },
  {
    industry: "Car Wash",
    name: "SpeedyClean Group · Atlanta, GA",
    savings: "$84,600",
    utility: "Georgia Power · $0.12/kWh",
    solar: { value: "280 kW", sub: "896 panels" },
    bess: { value: "200 kWh", sub: "2-hr dispatch" },
    demand: { value: "29%", sub: "$5,600/mo" },
    payback: "6.8 yrs",
    npv: "$0.9M",
    irr: "14.6%",
    sources: ["NREL irradiance", "GA Power TOU-GS", "DOE BESS sizing", "30% ITC (IRA §48)"],
  },
];

// ── TrueQuote output mockup — example output for a hotel in Reno, NV ──────────
function TrueQuoteMockup() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % SCENARIOS.length);
        setVisible(true);
      }, 380);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  const s = SCENARIOS[activeIndex];

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #0d1420 0%, #080d18 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(62,207,142,0.08)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        width: "100%",
      }}
    >
      {/* Header bar — static chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={SHIELD_GOLD} alt="TrueQuote" style={{ width: 24, height: 24 }} />
          <span
            style={{ fontSize: 16, fontWeight: 700, color: "#F5F0E8", letterSpacing: "0.01em" }}
          >
            TrueQuote™
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#3ECF8E",
              background: "rgba(62,207,142,0.12)",
              border: "1px solid rgba(62,207,142,0.25)",
              borderRadius: 6,
              padding: "2px 7px",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            Verified
          </span>
        </div>
        {/* Facility name fades with content */}
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.30)",
            transition: "opacity 0.38s ease",
            opacity: visible ? 1 : 0,
          }}
        >
          {s.name}
        </div>
      </div>

      {/* ── Animated content block ── */}
      <div style={{ transition: "opacity 0.38s ease", opacity: visible ? 1 : 0 }}>
        {/* Hero savings row */}
        <div
          style={{
            padding: "28px 28px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, rgba(234,179,8,0.07) 0%, transparent 60%)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "rgba(234,179,8,0.80)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              marginBottom: 8,
            }}
          >
            Projected Annual Savings
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#EAB308",
                lineHeight: 1,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                letterSpacing: "-2px",
              }}
            >
              {s.savings}
            </span>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>
              /yr
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.38)" }}>
            After 30% federal ITC · {s.utility}
          </div>
        </div>

        {/* System breakdown */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              {
                icon: <Sun size={13} />,
                label: "Solar",
                value: s.solar.value,
                sub: s.solar.sub,
                color: "#F59E0B",
              },
              {
                icon: <Battery size={13} />,
                label: "BESS",
                value: s.bess.value,
                sub: s.bess.sub,
                color: "#3B82F6",
              },
              {
                icon: <TrendingDown size={13} />,
                label: "Demand Cut",
                value: s.demand.value,
                sub: s.demand.sub,
                color: "#3ECF8E",
              },
            ].map(({ icon, label, value, sub, color }) => (
              <div
                key={label}
                style={{
                  padding: "16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, color }}
                >
                  {icon}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.92)",
                    lineHeight: 1.1,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payback + IRR row */}
        <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
              textAlign: "center" as const,
            }}
          >
            {[
              { label: "Payback", value: s.payback },
              { label: "25-yr NPV", value: s.npv },
              { label: "IRR", value: s.irr },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.92)",
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 3,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data sources */}
        <div
          style={{
            padding: "11px 28px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap" as const,
          }}
        >
          <ShieldCheck size={11} style={{ color: "rgba(62,207,142,0.50)", flexShrink: 0 }} />
          {s.sources.map((src, i) => (
            <React.Fragment key={src}>
              {i > 0 && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)" }}>·</span>}
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>
                {src}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* end animated block */}

      {/* ── Industry tabs — always visible, clickable ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "12px 28px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.15)",
          flexWrap: "wrap" as const,
        }}
      >
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.industry}
            onClick={() => {
              setVisible(false);
              setTimeout(() => {
                setActiveIndex(i);
                setVisible(true);
              }, 200);
            }}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid",
              borderColor: i === activeIndex ? "rgba(234,179,8,0.45)" : "rgba(255,255,255,0.08)",
              color: i === activeIndex ? "#EAB308" : "rgba(255,255,255,0.30)",
              background: i === activeIndex ? "rgba(234,179,8,0.10)" : "transparent",
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "0.03em",
              transition: "all 0.2s ease",
            }}
          >
            {sc.industry}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          {SCENARIOS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === activeIndex ? "#EAB308" : "rgba(255,255,255,0.12)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HeroSection ────────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-[#060D1F]"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(62,207,142,0.07)_0%,transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full py-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          {/* ── Left: story + CTA ─────────────────────────────────────────── */}
          <div className="w-full">
            {/* Problem framing badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-400 text-[11px] font-medium tracking-wide mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Real savings. Real numbers. Free to start.
            </div>

            {/* Headline — lead with the problem */}
            <h1
              className="animate-fade-up-delay-1 font-bold leading-[1.02] tracking-normal mb-4"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
                fontSize: "clamp(48px, 6.5vw, 92px)",
              }}
            >
              <span className="text-white">Your energy project,</span>
              <br />
              <span className="text-emerald-400">sized &amp; priced</span>
              <br />
              <span className="text-white">in 90 seconds.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="animate-fade-up-delay-1 text-[18px] text-slate-400 leading-relaxed mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif", fontWeight: 400 }}
            >
              ZIP code. Facility type. Merlin runs a{" "}
              <span className="text-white font-semibold">real financial model</span> — live utility
              rates, solar irradiance, demand charges, and power generation potential — and returns
              your exact savings, payback, and generation capacity.{" "}
              <span className="text-emerald-400/80">Free. ~90 seconds.</span>
            </p>

            {/* What you get */}
            <div className="animate-fade-up-delay-2 flex flex-col gap-2 mb-5">
              {[
                "Annual savings projection, payback period & 25-yr NPV",
                "Solar, BESS, backup power & generator sizing for your facility",
                "Demand charge reduction based on your actual utility tariff",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400/70 mt-0.5 flex-shrink-0" />
                  <span
                    className="text-[16px] text-slate-300"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* PRIMARY CTA — single, dominant */}
            <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
              <a
                href="/wizard"
                className="group inline-flex items-center gap-4 px-10 py-6 rounded-2xl font-bold text-[19px] transition-all duration-200"
                style={{
                  background: "transparent",
                  color: "#EAB308",
                  border: "1.5px solid #EAB308",
                  boxShadow: "0 0 20px rgba(234,179,8,0.12)",
                  fontFamily: "'Outfit', sans-serif",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 36px rgba(234,179,8,0.28)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(234,179,8,0.06)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 20px rgba(234,179,8,0.12)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <img src={SHIELD_GOLD} alt="TrueQuote" style={{ width: 24, height: 24 }} />
                Start your free TrueQuote™
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </a>
              <span
                className="text-[12px] text-slate-600"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                ~90 sec · No account · Begin saving today
              </span>
            </div>

            {/* Trust bar */}
            <div className="animate-fade-up-delay-4">
              <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-1.5 font-semibold">
                Built on trusted data sources
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {trustItems.map((item) => (
                  <span key={item} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Zap size={9} className="text-emerald-500/40" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: TrueQuote output mockup — show what they GET ─────── */}
          <div className="hidden lg:flex flex-col items-start gap-3">
            <div
              className="text-[10px] font-semibold tracking-widest uppercase text-slate-600"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ↓ This is what you'll receive
            </div>
            <TrueQuoteMockup />
            <div
              className="text-[10px] text-slate-700 text-center max-w-xs leading-relaxed"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Example output for a 450-room hotel in Reno, NV. Your numbers are calculated from live
              utility data for your actual location and facility type.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060D1F] to-transparent" />
    </section>
  );
}
