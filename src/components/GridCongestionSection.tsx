/* Merlin Energy — Grid congestion intelligence module */

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  MapPin,
  RadioTower,
  ShieldCheck,
  Zap,
} from "lucide-react";

const exposureSignals = [
  { label: "Mega-load clusters", value: "AI / data centers", tone: "text-red-300" },
  { label: "Utility filings", value: "Rate-case pressure", tone: "text-orange-300" },
  { label: "Local response", value: "Solar + storage strategy", tone: "text-emerald-300" },
];

const solutionSteps = [
  "Check ZIP-level grid congestion and rate-pressure signals",
  "Estimate how utility upgrade costs could affect facility energy exposure",
  "Model solar, storage, demand control, and resilience options that reduce dependency",
];

export default function GridCongestionSection() {
  return (
    <section
      id="grid-exposure"
      className="relative overflow-hidden bg-[#050608] px-4 py-12 text-white sm:px-6 lg:px-8 xl:px-12"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,rgba(239,68,68,0.12),transparent_28%),radial-gradient(circle_at_92%_45%,rgba(37,99,235,0.1),transparent_30%)]" />
      <div className="relative mx-auto max-w-screen-2xl">
        <div className="overflow-hidden rounded-[1.35rem] border border-red-500/18 bg-red-950/18 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10 xl:p-12">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/35 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-red-300">
                <AlertTriangle size={14} className="text-yellow-300" /> AI Grid Congestion Alert
              </div>

              <h2
                className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                AI data centers are reshaping the grid.
                <br className="hidden sm:block" /> Is your business paying the price?
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                New mega-loads can accelerate transmission upgrades, grid congestion, and rate-case
                pressure. MERLIN helps local businesses see whether their ZIP is exposed, then
                models practical ways to reduce dependency on an increasingly constrained grid.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {exposureSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-xl border border-white/[0.07] bg-black/22 p-4"
                  >
                    <div
                      className="text-[10px] uppercase tracking-[0.14em] text-slate-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {signal.label}
                    </div>
                    <div className={`mt-2 text-sm font-bold ${signal.tone}`}>{signal.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-inner shadow-black/40 sm:p-6">
              <div
                className="text-[11px] uppercase tracking-[0.18em] text-slate-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Check your ZIP's grid exposure
              </div>

              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  window.location.href = "/wizard";
                }}
              >
                <label className="sr-only" htmlFor="grid-zip">
                  ZIP Code
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/12 bg-white/[0.07] px-4 py-3.5 text-slate-400 transition focus-within:border-red-300/70 focus-within:ring-4 focus-within:ring-red-500/10">
                  <MapPin size={16} className="shrink-0 text-slate-500" />
                  <input
                    id="grid-zip"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    placeholder="Enter 5-digit ZIP"
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(239,68,68,0.25)] transition hover:-translate-y-0.5 hover:bg-red-400"
                >
                  Check Exposure <ArrowRight size={16} />
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {solutionSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/12 text-blue-400">
                      {index === 0 ? (
                        <RadioTower size={15} />
                      ) : index === 1 ? (
                        <Zap size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                    </div>
                    <div className="text-sm leading-6 text-slate-300">{step}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/8 p-4 text-sm leading-6 text-slate-400">
                <Building2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                <span>
                  MERLIN turns grid exposure into an action plan: energy savings, load flexibility,
                  backup resilience, and an owner-ready Energy Brief.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
