/* Merlin Energy — Agent-first homepage hero */

import { ArrowRight, Building2, CheckCircle2, Sparkles, Zap } from "lucide-react";

const MERLIN_ICON = "/merlin-icon.png";

const telemetryRows = [
  {
    type: "Hotel",
    location: "Atlanta, GA",
    status: "Optimizing TOU-GS tariff...",
    savings: "$18,400/yr",
    active: true,
  },
  {
    type: "Car Wash",
    location: "Phoenix, AZ",
    status: "Modeling 80 kW solar array...",
    savings: "$9,200/yr",
    active: false,
  },
  {
    type: "Manufacturing",
    location: "Grand Rapids, MI",
    status: "Sizing 150 kWh BESS system...",
    savings: "$42,100/yr",
    active: false,
  },
  {
    type: "Supermarket",
    location: "Dallas, TX",
    status: "Applying IRA Section 48 ITC...",
    savings: "$28,700/yr",
    active: false,
  },
];

const proofItems = ["Free & Instant", "No Utility Login Required", "CFO-Ready Report"];

function AgentTelemetryPanel() {
  return (
    <div className="relative rounded-[1.35rem] border border-white/10 bg-[#18191D] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.48),0_0_0_1px_rgba(37,99,235,0.18)] lg:p-7">
      <div className="absolute inset-0 rounded-[1.35rem] bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.14),transparent_42%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={MERLIN_ICON}
                alt="MERLIN"
                className="h-10 w-10 rounded-full border border-white/20 bg-white/10 object-contain p-1"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#18191D] bg-emerald-400" />
            </div>
            <div>
              <div
                className="text-sm font-bold text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                MERLIN Agent Active
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-blue-500">
                <Zap size={12} /> Live Processing
              </div>
            </div>
          </div>
          <div className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[10px] font-medium text-blue-500">
            NREL API Connected
          </div>
        </div>

        <div className="mt-7">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Live Agent Telemetry
          </div>
          <div className="space-y-3">
            {telemetryRows.map((row) => (
              <div
                key={`${row.type}-${row.location}`}
                className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all ${
                  row.active
                    ? "border-blue-500/45 bg-blue-500/12 shadow-[0_0_30px_rgba(37,99,235,0.16)]"
                    : "border-white/[0.05] bg-black/18 opacity-55"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      row.active ? "bg-blue-500/20 text-blue-500" : "bg-white/[0.04] text-slate-500"
                    }`}
                  >
                    <Building2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {row.type} <span className="text-[11px] text-slate-500">{row.location}</span>
                    </div>
                    <div
                      className="truncate text-[11px] text-slate-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.status}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-blue-500">{row.savings}</div>
                  <div className="text-[10px] text-slate-500">Est. Savings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.07] p-4 text-sm leading-relaxed text-slate-400">
          <span className="font-bold text-slate-300">How MERLIN bypasses friction:</span> instead of
          demanding weeks of electric bills and engineering site visits, MERLIN uses independent
          tariff, solar, and facility benchmark data to estimate your energy structure instantly.
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#050608] pt-20 text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_62%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_74%_36%,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 xl:px-12">
        <div className="max-w-3xl">
          <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[12px] font-medium tracking-[0.12em] text-blue-500">
            <Sparkles size={13} /> Independent B2B Energy Intelligence
          </div>

          <h1
            className="text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
          >
            Cut your business
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              energy bills
            </span>{" "}
            <span className="text-emerald-400/30">by 30%.</span>
          </h1>

          <p
            className="mt-7 max-w-2xl text-lg leading-8 text-slate-400"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            Meet <span className="font-bold text-slate-200">MERLIN</span>, your autonomous Energy
            Intelligence Agent. Give MERLIN 90 seconds, your ZIP, and your monthly bill. It maps
            your facility against utility tariffs and solar data to build your savings blueprint.
          </p>

          <form
            className="mt-9 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = "/wizard";
            }}
          >
            <label className="sr-only" htmlFor="hero-zip">
              Facility ZIP Code
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/12 bg-white/[0.07] px-4 py-3.5 text-slate-400 shadow-inner shadow-black/20 transition focus-within:border-blue-500/70 focus-within:ring-4 focus-within:ring-blue-500/10">
              <Building2 size={16} className="shrink-0 text-slate-500" />
              <input
                id="hero-zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                pattern="[0-9]{5}"
                placeholder="Enter your facility's ZIP Code"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Activate MERLIN <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
            {proofItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 size={15} className="text-blue-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <AgentTelemetryPanel />
      </div>
    </section>
  );
}
