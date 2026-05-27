/* Merlin Energy — Energy Stacking methodology section */

import { useEffect, useState } from "react";

const layers = [
  {
    title: "Demand Baseline",
    detail: "Facility load profile and tariff exposure baseline.",
    liveKey: "zip",
    color: "from-slate-500/30 to-slate-500/5",
  },
  {
    title: "Supply Mix",
    detail: "Utility, storage, generation, and renewable composition.",
    liveKey: "stackCandidate",
    color: "from-cyan-500/30 to-cyan-500/5",
  },
  {
    title: "Dispatch Logic",
    detail: "Peak-shaving strategy and resilience dispatch controls.",
    liveKey: "peakReductionPct",
    color: "from-emerald-500/30 to-emerald-500/5",
  },
  {
    title: "Financial Outcome",
    detail: "Risk-adjusted economics and operating continuity value.",
    liveKey: "decisionPriority",
    color: "from-violet-500/30 to-violet-500/5",
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
      className="bg-[#060D1F] border-y border-white/[0.05] py-16 sm:py-20"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
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
            Merlin evaluates portfolio energy strategy as an integrated system. Demand, supply,
            dispatch, and economics are modeled together before procurement is initiated.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#0A1227] p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-4">
            {layers.map((layer, index) => (
              <div key={layer.title} className="relative">
                <div
                  className={`h-full rounded-xl border border-white/[0.08] bg-gradient-to-b ${layer.color} p-4 sm:p-5`}
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
                  <div className="mt-3 border-t border-white/[0.1] pt-2 text-xs text-cyan-200/90">
                    Live model: {preview[layer.liveKey]}
                  </div>
                </div>
                {index < layers.length - 1 && (
                  <div className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-cyan-300/80 md:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4 text-sm leading-6 text-slate-200">
            <span className="font-semibold text-cyan-200">Output:</span> Decision-ready
            architecture, scenario comparatives, and risk-adjusted financial guidance.
          </div>
        </div>
      </div>
    </section>
  );
}
