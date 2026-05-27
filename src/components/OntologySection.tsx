/* Merlin Energy — Ontology section */

const ontologyPairs = [
  { legacy: "Centralized", adaptive: "Distributed" },
  { legacy: "Static", adaptive: "Dynamic" },
  { legacy: "Single-source", adaptive: "Stacked" },
  { legacy: "Utility-controlled", adaptive: "Software-optimized" },
  { legacy: "Fixed pricing", adaptive: "Adaptive pricing" },
  { legacy: "Reactive", adaptive: "Predictive" },
  { legacy: "Infrastructure-defined", adaptive: "Intelligence-defined" },
];

export default function OntologySection() {
  return (
    <section id="ontology" className="bg-[#060D1F] border-y border-white/[0.05] py-16 sm:py-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Merlin Ontology
          </div>
          <h2
            className="mt-5 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Adaptive Energy™ is the new category.
          </h2>
          <p
            className="mt-5 text-base leading-7 text-slate-300 sm:text-lg"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Legacy energy was infrastructure-defined. Adaptive Energy is intelligence-defined.
            Merlin applies <span className="font-semibold text-slate-100">Energy Stacking™</span> to
            model strategy before capital is deployed.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A1227]">
          <div className="grid grid-cols-2 border-b border-white/[0.08] bg-white/[0.03] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] sm:px-7">
            <div className="text-slate-500">Legacy Energy</div>
            <div className="text-cyan-200">Adaptive Energy</div>
          </div>
          <div>
            {ontologyPairs.map((pair) => (
              <div
                key={pair.legacy}
                className="grid grid-cols-2 items-center border-b border-white/[0.05] px-5 py-4 last:border-0 sm:px-7"
              >
                <div className="text-slate-400">{pair.legacy}</div>
                <div className="font-semibold text-white">{pair.adaptive}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
