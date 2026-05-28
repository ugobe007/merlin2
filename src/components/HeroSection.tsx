/* Merlin Energy — Agent-first homepage hero */

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Hotel,
  Layers3,
  Plane,
  ShieldAlert,
  Sparkles,
  TrendingUp,
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

const _telemetryRows: UseCase[] = [
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

function _UseCaseModal({ useCase, onClose }: { useCase: UseCase; onClose: () => void }) {
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

function AgentTelemetryPanel({
  modelPreview,
}: {
  modelPreview: {
    zip: string;
    gridRiskShift: string;
    peakReductionPct: string;
    stackCandidate: string;
    backupHours: string;
    decisionPriority: string;
  };
}) {
  const zipSeed = modelPreview.zip.length === 5 ? Number.parseInt(modelPreview.zip, 10) % 100 : 0;

  const adaptiveOutcomes = [
    {
      label: "Grid Dependence Risk",
      value: modelPreview.gridRiskShift,
      detail: `ZIP ${modelPreview.zip || "pending"} · ${modelPreview.decisionPriority}`,
      Icon: ShieldAlert,
      accent: "text-amber-300",
    },
    {
      label: "Peak Charge Exposure",
      value: modelPreview.peakReductionPct,
      detail: `Estimated reduction potential · ${modelPreview.backupHours} backup window`,
      Icon: TrendingUp,
      accent: "text-emerald-300",
    },
    {
      label: "Recommended Stack Architecture",
      value: modelPreview.stackCandidate,
      detail: "Co-optimized across utility, storage, and generation",
      Icon: Layers3,
      accent: "text-indigo-300",
    },
  ] as const;

  const hasZipContext = modelPreview.zip.length === 5;

  const intelligenceSignals = [
    {
      label: "Grid Stress Index",
      value: `${62 + (zipSeed % 18)}/100`,
      tone: "text-amber-300",
      confidence: hasZipContext
        ? zipSeed > 66
          ? "High"
          : zipSeed > 33
            ? "Medium"
            : "Low"
        : "Baseline",
    },
    {
      label: "Stack Fit Score",
      value: `${66 + (zipSeed % 15)}/100`,
      tone: "text-emerald-300",
      confidence: hasZipContext ? (zipSeed > 44 ? "High" : "Medium") : "Baseline",
    },
    {
      label: "Dispatch Readiness",
      value: `${74 + (zipSeed % 12)}%`,
      tone: "text-indigo-300",
      confidence: hasZipContext ? "High" : "Baseline",
    },
  ] as const;

  return (
    <div className="relative rounded-[1.35rem] border border-indigo-300/25 bg-[linear-gradient(155deg,rgba(17,13,39,0.98)_0%,rgba(15,27,67,0.96)_56%,rgba(29,34,50,0.95)_100%)] p-6 shadow-[0_42px_130px_rgba(2,6,23,0.72),0_0_0_1px_rgba(99,102,241,0.14)] lg:p-7">
      <div className="absolute inset-0 rounded-[1.35rem] bg-[radial-gradient(circle_at_14%_0%,rgba(99,102,241,0.16),transparent_40%),radial-gradient(circle_at_84%_10%,rgba(59,130,246,0.16),transparent_44%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 border-b border-white/12 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={MERLIN_ICON}
                alt="MERLIN"
                className="h-10 w-10 rounded-full border border-white/20 bg-white/10 object-contain p-1"
              />
              <span className="merlin-agent-signal absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#0A1223] bg-emerald-400" />
            </div>
            <div>
              <div
                className="text-sm font-bold text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Your Adaptive Energy Snapshot
              </div>
              <div className="mt-0.5 text-xs font-semibold text-indigo-200">
                Energy Stacking™ signal intelligence
              </div>
            </div>
          </div>
          <Layers3 size={16} className="mt-1 text-indigo-200/80" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <p className="text-sm leading-6 text-slate-200">
            Merlin translates load behavior, tariff variability, and resilience constraints into one
            orchestrated stack strategy with measurable operating signals.
          </p>
          <div
            aria-hidden="true"
            className="ml-auto flex h-28 w-20 items-end justify-center gap-1.5 border-l border-white/15 pl-3"
          >
            <div className="h-8 w-3 rounded-sm bg-amber-400/90 shadow-[0_0_14px_rgba(251,191,36,0.35)]" />
            <div className="h-14 w-3 rounded-sm bg-emerald-400/90 shadow-[0_0_14px_rgba(52,211,153,0.34)]" />
            <div className="h-11 w-3 rounded-sm bg-indigo-400/90 shadow-[0_0_14px_rgba(129,140,248,0.34)]" />
            <div className="h-20 w-3 rounded-sm bg-blue-400/90 shadow-[0_0_14px_rgba(96,165,250,0.35)]" />
            <div className="h-16 w-3 rounded-sm bg-violet-400/90 shadow-[0_0_14px_rgba(167,139,250,0.34)]" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {intelligenceSignals.map((signal) => (
            <div
              key={signal.label}
              className="border-b border-white/12 pb-2 last:border-b-0 sm:border-b-0"
            >
              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-300">
                {signal.label}
              </div>
              <div className={`mt-1 text-sm font-bold ${signal.tone}`}>{signal.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                Confidence: {signal.confidence}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          {hasZipContext
            ? `Localized to ZIP ${modelPreview.zip} for stack-specific signal modeling.`
            : "Showing baseline stack signals. Add ZIP to localize utility and dispatch exposure."}
        </div>

        <div className="mt-5">
          {adaptiveOutcomes.map((item) => (
            <div key={item.label} className="border-b border-white/[0.08] py-3 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <item.Icon size={14} className={item.accent} />
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-300">
                  {item.label}
                </div>
              </div>
              <div className={`mt-1 text-sm font-bold ${item.accent}`}>{item.value}</div>
              <div className="mt-0.5 text-xs text-slate-400">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const [zipCode, setZipCode] = useState("");

  const modelPreview = useMemo(() => {
    const zip = zipCode.replace(/\D/g, "").slice(0, 5);
    if (zip.length < 5) {
      return {
        zip,
        gridRiskShift: "Baseline → Select ZIP to localize",
        peakReductionPct: "16–24%",
        stackCandidate: "Solar + BESS + Utility",
        backupHours: "2–4 hr",
        decisionPriority: "Baseline stack profile",
      };
    }

    const seed = Number.parseInt(zip, 10) % 100;
    const peakLow = 14 + (seed % 6);
    const peakHigh = peakLow + 8;
    const backupLow = 2 + (seed % 3);
    const backupHigh = backupLow + 2;
    const stackCandidates = [
      "Solar + BESS + Utility",
      "BESS + Utility + Generator",
      "Solar + BESS + Generator",
    ] as const;

    return {
      zip,
      gridRiskShift: seed > 55 ? "High → Moderate" : "Moderate → Managed",
      peakReductionPct: `${peakLow}–${peakHigh}%`,
      stackCandidate: stackCandidates[seed % stackCandidates.length],
      backupHours: `${backupLow}–${backupHigh} hr`,
      decisionPriority: seed > 55 ? "Resilience-first" : "Cost-optimized hybrid",
    };
  }, [zipCode]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("merlin:hero-model-preview", {
        detail: modelPreview,
      })
    );
  }, [modelPreview]);

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
            className="text-5xl font-black leading-[0.96] tracking-[-0.045em] text-white antialiased sm:text-6xl lg:text-7xl"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              textShadow: "0 1px 0 rgba(255,255,255,0.08), 0 14px 36px rgba(2,6,23,0.42)",
            }}
          >
            Reduce Grid Dependence
            <br />
            <span
              className="text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #3FE8FF 0%, #22D3EE 35%, #A855F7 70%, #C084FC 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 10px 28px rgba(34,211,238,0.22)",
              }}
            >
              Through Energy Stacking.
            </span>
          </h1>

          <p
            className="mt-7 max-w-2xl text-lg leading-8 text-slate-400"
            style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
          >
            Merlin uses <span className="font-semibold text-slate-200">Energy Stacking™</span> to
            orchestrate utility, battery, solar, generator, and AI load optimization into one
            decision-ready infrastructure strategy.
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
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="Enter your facility's ZIP Code"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/70 bg-transparent px-5 py-3.5 text-sm font-semibold text-blue-300 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-200"
            >
              Activate Agent <ArrowRight size={16} />
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

        <AgentTelemetryPanel modelPreview={modelPreview} />
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
