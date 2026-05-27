/* Merlin Energy — Energy Stacking methodology section */

import { useEffect, useState } from "react";

const layers = [
  {
    title: "Utility Power",
    detail: "Your grid baseline, tariff structure, and utility exposure.",
    liveKey: "zip",
    color: "from-slate-500/30 to-slate-500/5",
    livePrefix: "Context:",
  },
  {
    title: "Battery Storage",
    detail: "Peak shaving and resilience capacity layered over utility service.",
    liveKey: "stackCandidate",
    color: "from-cyan-500/30 to-cyan-500/5",
    livePrefix: "Candidate:",
  },
  {
    title: "Solar",
    detail: "Daytime generation paired to load timing and site economics.",
    liveKey: "peakReductionPct",
    color: "from-amber-500/30 to-amber-500/5",
    livePrefix: "Impact:",
  },
  {
    title: "Generator Backup",
    detail: "Continuity layer for outages and critical operations coverage.",
    liveKey: "backupHours",
    color: "from-emerald-500/30 to-emerald-500/5",
    livePrefix: "Window:",
  },
  {
    title: "AI Load Optimization",
    detail: "Dispatch logic that adapts to peaks, tariffs, and risk posture.",
    liveKey: "peakReductionPct",
    color: "from-violet-500/30 to-violet-500/5",
    livePrefix: "Modeled shift:",
  },
  {
    title: "Dynamic Rate Arbitrage",
    detail: "Financial control from timing power flows against rate structures.",
    liveKey: "decisionPriority",
    color: "from-fuchsia-500/30 to-fuchsia-500/5",
    livePrefix: "Priority:",
  },
] as const;

type HeroModelPreview = {
  zip: string;
  gridRiskShift: string;
  peakReductionPct: string;
  stackCandidate: string;
  backupHours: string;
  decisionPriority: string;
};

const defaultPreview: HeroModelPreview = {
  zip: "pending",
  gridRiskShift: "Baseline pending",
  peakReductionPct: "16–24%",
  stackCandidate: "Solar + BESS + Utility",
  backupHours: "2–4 hr",
  decisionPriority: "Complete ZIP for localized modeling",
};

export default function EnergyStackingSection() {
  const [preview, setPreview] = useState<HeroModelPreview>(defaultPreview);

  useEffect(() => {
    const onPreview = (event: Event) => {
      const custom = event as CustomEvent<HeroModelPreview>;
      if (custom.detail) setPreview(custom.detail);
    };

    window.addEventListener("merlin:hero-model-preview", onPreview as EventListener);
    return () => {
      window.removeEventListener("merlin:hero-model-preview", onPreview as EventListener);
    };
  }, []);

  return (
    <section
      id="energy-stacking"
      className="relative overflow-hidden bg-[#060D1F] border-y border-white/[0.05] py-16 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(168,85,247,0.16),transparent_34%)]" />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-300/55 bg-cyan-300/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            Methodology
          </div>
          <h2
            className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Energy Stacking™
          </h2>
          <p
            className="mt-4 text-base leading-7 text-slate-300 sm:text-lg"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            One building is no longer one power source. Merlin orchestrates a modern Energy Stack™
            as an adaptive, software-native infrastructure system.
          </p>
        </div>

        <div className="relative mt-10 rounded-2xl border border-cyan-300/20 bg-[#0A1227]/90 p-5 shadow-[0_24px_90px_rgba(8,145,178,0.12)] sm:p-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer, index) => (
              <div key={layer.title} className="relative">
                <div
                  className={`h-full rounded-xl border border-white/15 bg-gradient-to-b ${layer.color} p-4 sm:p-5`}
                >
                  <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Layer {index + 1}
                  </div>
                  <div
                    className="mt-2 text-sm font-bold text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {layer.title}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{layer.detail}</div>
                  <div className="mt-3 border-t border-white/[0.16] pt-2 text-xs text-cyan-200/95">
                    {layer.livePrefix} {preview[layer.liveKey]}
                  </div>
                </div>
                {index < layers.length - 1 && (
                  <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-cyan-200 md:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-cyan-300/35 bg-cyan-400/10 p-4 text-sm leading-6 text-slate-100">
            <span className="font-semibold text-cyan-200">Output:</span> Decision-ready
            architecture, scenario comparatives, and risk-adjusted financial guidance.
          </div>
        </div>
      </div>
    </section>
  );
}
