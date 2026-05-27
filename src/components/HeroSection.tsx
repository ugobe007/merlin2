/* Merlin Energy — Agent-first homepage hero */

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Hotel,
  Plane,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

const MERLIN_ICON = "/merlin-icon.png";

type UseCase = {
  type: string;
  location: string;
  status: string;
  savings: string;
  active: boolean;
  Icon: typeof Building2;
  opportunity: string;
  modeledAssets: string[];
  risk: string;
  brief: string;
  recommendation: string;
  quoteRange: string;
  payback: string;
  roiNote: string;
};

const telemetryRows: UseCase[] = [
  {
    type: "Hotel",
    location: "Atlanta, GA",
    status: "Optimizing TOU-GS tariff...",
    savings: "$18,400/yr",
    active: true,
    Icon: Hotel,
    opportunity:
      "Peak demand charges, HVAC runtime, laundry loads, and backup resilience often hide the fastest savings path.",
    modeledAssets: [
      "Solar canopy + rooftop PV",
      "Lobby/guest-room load profile",
      "Battery demand-charge dispatch",
    ],
    risk: "High occupancy days can spike demand charges before operators see the bill.",
    brief:
      "MERLIN turns room count, ZIP, tariff, and monthly bill into an owner-ready savings brief.",
    recommendation: "Rooftop/canopy solar + battery demand-charge control",
    quoteRange: "$170K–$240K",
    payback: "5.1–6.4 yrs",
    roiNote: "Prioritize demand-charge reduction before sizing generation.",
  },
  {
    type: "Car Wash",
    location: "Phoenix, AZ",
    status: "Modeling 80 kW solar array...",
    savings: "$9,200/yr",
    active: false,
    Icon: Building2,
    opportunity:
      "Daytime pump, dryer, vacuum, and water-heating loads line up well with solar production.",
    modeledAssets: [
      "PV production curve",
      "Pump and dryer demand profile",
      "Battery peak clipping",
    ],
    risk: "Demand spikes can erase margin on high-volume wash days.",
    brief:
      "MERLIN compares solar-only, solar + storage, and load-control paths before a vendor proposal.",
    recommendation: "Solar-first quote with optional battery peak clipping",
    quoteRange: "$75K–$115K",
    payback: "4.8–6.0 yrs",
    roiNote: "Best fit when daytime volume overlaps solar production.",
  },
  {
    type: "Airport",
    location: "Las Vegas, NV",
    status: "Mapping campus microgrid zones...",
    savings: "$315,000/yr",
    active: false,
    Icon: Plane,
    opportunity:
      "Airports behave like small cities: terminals, concessions, parking, ground support, and critical operations.",
    modeledAssets: ["Campus load segmentation", "Microgrid dispatch", "Critical-load resilience"],
    risk: "Grid constraints and outage exposure can cascade across passenger, vendor, and operations systems.",
    brief:
      "MERLIN frames phased infrastructure decisions before expensive engineering studies begin.",
    recommendation: "Phased campus microgrid and critical-load segmentation",
    quoteRange: "$3.8M–$6.2M",
    payback: "6.5–8.2 yrs",
    roiNote: "Separate resilience value from pure utility-bill savings.",
  },
  {
    type: "EV Charging Hub",
    location: "Riverside, CA",
    status: "Testing demand-control strategy...",
    savings: "$76,500/yr",
    active: false,
    Icon: Zap,
    opportunity:
      "Fast charging creates intense peaks; storage and solar can protect margins and reduce interconnection pressure.",
    modeledAssets: [
      "Charger utilization curve",
      "Battery peak shaving",
      "Solar + grid import blend",
    ],
    risk: "Demand charges and upgrade costs can break a charging hub's unit economics.",
    brief:
      "MERLIN shows whether the site needs storage, load controls, or a different charging mix.",
    recommendation: "Demand-managed fast charging + BESS dispatch",
    quoteRange: "$620K–$1.1M",
    payback: "4.9–6.7 yrs",
    roiNote: "Storage protects utilization upside from peak-demand penalties.",
  },
  {
    type: "Data Center",
    location: "Ashburn, VA",
    status: "Evaluating grid capacity exposure...",
    savings: "$1.4M/yr",
    active: false,
    Icon: DatabaseZap,
    opportunity:
      "Always-on load, utility constraints, and power availability make energy strategy existential for AI infrastructure.",
    modeledAssets: ["24/7 load profile", "On-site generation mix", "Storage and backup resilience"],
    risk: "Power availability, rate-case pressure, and interconnection delays can slow growth.",
    brief:
      "MERLIN helps teams compare grid dependency, on-site energy, and resilience economics by location.",
    recommendation: "On-site generation mix + storage resilience screen",
    quoteRange: "$18M–$42M",
    payback: "5.8–8.0 yrs",
    roiNote: "Treat grid access as a growth constraint, not just a utility line item.",
  },
];

const proofItems = ["Free & Instant", "No Utility Login Required", "CFO-Ready Report"];

function UseCaseModal({ useCase, onClose }: { useCase: UseCase; onClose: () => void }) {
  const Icon = useCase.Icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="use-case-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/12 bg-[#111217] p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.13),transparent_30%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue-500/30 bg-blue-500/12 text-blue-400">
                <Icon size={24} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-blue-400">
                  Sample MERLIN Energy Brief
                </div>
                <h3
                  id="use-case-title"
                  className="mt-1 text-2xl font-black tracking-[-0.03em] text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {useCase.type} quote + ROI preview
                </h3>
                <div className="mt-1 text-sm text-slate-500">
                  Example market: {useCase.location}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:text-white"
              aria-label="Close use case details"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Estimated Savings
              </div>
              <div className="mt-2 text-xl font-black text-blue-400">{useCase.savings}</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4 sm:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                First-Pass Quote Range
              </div>
              <div className="mt-2 text-xl font-black text-white">{useCase.quoteRange}</div>
              <div className="mt-1 text-xs text-slate-500">
                Illustrative installed-cost range before vendor bids.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Payback Window
              </div>
              <div className="mt-2 text-lg font-black text-emerald-300">{useCase.payback}</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Recommended Path
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{useCase.recommendation}</div>
            </div>
          </div>

          <p className="mt-6 text-base leading-7 text-slate-300">{useCase.opportunity}</p>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Primary risk MERLIN checks
            </div>
            <div className="text-sm leading-6 text-slate-300">{useCase.risk}</div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">
              What MERLIN models
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {useCase.modeledAssets.map((asset) => (
                <div
                  key={asset}
                  className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-sm text-slate-300"
                >
                  {asset}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-400/18 bg-emerald-400/8 p-4 text-sm leading-6 text-slate-300">
            <span className="font-bold text-emerald-300">MERLIN output:</span> {useCase.brief}{" "}
            <span className="text-emerald-200">{useCase.roiNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTelemetryPanel() {
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);

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
                MERLIN Energy Briefs
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-blue-500">
                <Zap size={12} /> Quote + ROI previews
              </div>
            </div>
          </div>
          <div className="rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[10px] font-medium text-blue-500">
            Agent-Generated Examples
          </div>
        </div>

        <div className="mt-7">
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Click a facility type
          </div>
          <div className="space-y-3">
            {telemetryRows.map((row) => (
              <button
                type="button"
                key={`${row.type}-${row.location}`}
                className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-blue-500/45 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/45 ${
                  row.active
                    ? "border-blue-500/45 bg-blue-500/12 shadow-[0_0_30px_rgba(37,99,235,0.16)]"
                    : "border-white/[0.05] bg-black/18 opacity-70"
                }`}
                onClick={() => setSelectedUseCase(row)}
                aria-label={`View ${row.type} use case details`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      row.active
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-white/[0.04] text-slate-500 group-hover:text-blue-400"
                    }`}
                  >
                    <row.Icon size={15} />
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
                  <div className="text-sm font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                    {row.savings}
                  </div>
                  <div className="text-[10px] text-slate-500 group-hover:text-slate-400">
                    {row.payback}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.07] p-4 text-sm leading-relaxed text-slate-400">
          <span className="font-bold text-slate-300">How MERLIN bypasses friction:</span> instead of
          demanding weeks of electric bills and engineering site visits, MERLIN uses independent
          tariff, solar, and facility benchmark data to draft a first-pass quote and ROI case
          instantly.
        </div>
      </div>

      {selectedUseCase && (
        <UseCaseModal useCase={selectedUseCase} onClose={() => setSelectedUseCase(null)} />
      )}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#050608] pt-20 text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(128,90,213,0.07)_1px,transparent_1px),linear-gradient(rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_62%,rgba(168,85,247,0.13),transparent_28%),radial-gradient(circle_at_74%_36%,rgba(99,102,241,0.10),transparent_32%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050608] to-transparent" />

      <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 xl:px-12">
        <div className="max-w-3xl">
          <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-[12px] font-medium tracking-[0.12em] text-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.18)]">
            <Sparkles size={13} className="text-purple-400" /> Independent B2B Energy Intelligence
          </div>

          <h1
            className="text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
          >
            The operating system for
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(34,211,238,0.28)]">
              energy independence.
            </span>
          </h1>

          <p
            className="mt-7 max-w-2xl text-lg leading-8 text-slate-400"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            The grid is getting more expensive. Merlin models your solar, storage, generator, and
            utility options before you start.
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
              See My Energy Options <ArrowRight size={16} />
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

      <style>{`
        @keyframes merlinAgentSignal {
          0%, 100% { opacity: 0.34; transform: scale(0.96); }
          50% { opacity: 0.72; transform: scale(1.06); }
        }

        .merlin-agent-signal {
          animation: merlinAgentSignal 4.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .merlin-agent-signal {
            animation: none;
            opacity: 0.36;
          }
        }
      `}</style>
    </section>
  );
}
