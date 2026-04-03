/* Merlin Energy — Status Quo Section
   The story of why the current commercial energy process is broken.
   No bullet points. No CTAs. Just the honest narrative.
   Placement: between HeroSection and IndustriesSection.               */

export default function StatusQuoSection() {
  return (
    <section className="bg-[#06101F] border-y border-white/[0.05]">
      {/* Top label */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-16 pb-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-5 h-px bg-red-500/60" />
          <span
            className="text-[10px] text-red-400/70 uppercase tracking-[0.25em] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The problem we exist to solve
          </span>
        </div>
      </div>

      {/* Main grid: prose left, old-way timeline right */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-0">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 xl:gap-24 items-start">
          {/* ── Left: Narrative prose ──────────────────────────────────── */}
          <div>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-8"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              The way commercial facilities buy energy projects hasn't changed in 30 years.
            </h2>

            {/* Scene 1 */}
            <div className="mb-8">
              <p
                className="text-[11px] text-red-400/60 uppercase tracking-widest font-semibold mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 1 — The vendor call
              </p>
              <p
                className="text-slate-300 text-[17px] leading-relaxed mb-4"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                A hotel GM in Phoenix suspects she's overpaying on electricity. Peak demand charges
                alone: $28,000 a month. She calls a solar vendor. Three weeks later, a 47-page
                proposal lands in her inbox — custom branding, a big savings number on the cover,
                and assumptions buried on page 31 that explain everything.
              </p>
              <p
                className="text-slate-400 text-[17px] leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                She calls two more vendors. The proposals disagree by $400,000. Same building. Same
                utility. Same roof. Nobody can explain the gap.
              </p>
            </div>

            {/* Scene 2 */}
            <div className="mb-8">
              <p
                className="text-[11px] text-red-400/60 uppercase tracking-widest font-semibold mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 2 — The engineering study
              </p>
              <p
                className="text-slate-300 text-[17px] leading-relaxed mb-4"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                She can't move forward without clarity she can trust. So she hires an energy
                engineering firm. Four months. $85,000. The consultants audit the utility bills, run
                a load analysis, and produce a 120-page study.
              </p>
              <p
                className="text-slate-400 text-[17px] leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Conclusion: yes, solar and battery storage pencil out. Recommended system: 1.1 MW
                solar / 4.4 MWh BESS. Payback: 6.1 years. She already knew the answer. She just
                needed numbers she could trust.
              </p>
            </div>

            {/* Scene 3 */}
            <div className="mb-10">
              <p
                className="text-[11px] text-red-400/60 uppercase tracking-widest font-semibold mb-3"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 3 — The EPC
              </p>
              <p
                className="text-slate-300 text-[17px] leading-relaxed mb-4"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Now she needs an EPC firm to actually build it. Another RFP. Another six months of
                procurement and negotiation. Ground breaks fourteen months after that first phone
                call.
              </p>
              <p
                className="text-slate-400 text-[17px] leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                The project is real — but she paid $600,000 in utility bills during the evaluation
                period alone.
              </p>
            </div>

            {/* Pivot statement */}
            <div className="border-l-2 border-emerald-500/40 pl-6 py-1">
              <p
                className="text-white text-[17px] leading-relaxed font-medium"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                This is not an unusual story. It is the standard path for commercial energy
                decisions — slow, expensive, and biased at every step toward whoever is selling
                something.
              </p>
              <p
                className="text-emerald-400 text-[17px] leading-relaxed font-semibold mt-3"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Merlin was built to replace the first six months of that process.
              </p>
            </div>
          </div>

          {/* ── Right: Old-way timeline ──────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #0C0810 0%, #100810 100%)",
                border: "1px solid rgba(239,68,68,0.12)",
              }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-red-900/30">
                <p
                  className="text-[10px] text-red-400/70 uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  The old way — typical commercial project
                </p>
              </div>

              {/* Timeline steps */}
              <div className="px-6 py-6 space-y-0">
                {[
                  {
                    step: "01",
                    label: "Suspect you're overpaying",
                    detail: "Peak demand charges. Rising rates. A hunch.",
                    time: "Month 0",
                    cost: "$0",
                    costColor: "text-slate-500",
                  },
                  {
                    step: "02",
                    label: "Collect vendor proposals",
                    detail: "3–5 vendors. 3–6 weeks each. All using different assumptions.",
                    time: "Month 1–2",
                    cost: '"Free" — but biased',
                    costColor: "text-red-400/70",
                  },
                  {
                    step: "03",
                    label: "Proposals don't agree",
                    detail:
                      "Numbers vary by hundreds of thousands. No independent baseline to judge them against.",
                    time: "Month 2–3",
                    cost: "Stalled",
                    costColor: "text-red-400/70",
                  },
                  {
                    step: "04",
                    label: "Hire an engineering firm",
                    detail: "Independent load study, feasibility analysis, system design.",
                    time: "+4 months",
                    cost: "$50K–$150K",
                    costColor: "text-red-400",
                  },
                  {
                    step: "05",
                    label: "Engineering study delivered",
                    detail: "120 pages confirming what the math always suggested.",
                    time: "Month 6–8",
                    cost: "Report only",
                    costColor: "text-slate-500",
                  },
                  {
                    step: "06",
                    label: "Run EPC procurement",
                    detail: "RFP, shortlisting, negotiation, contract. Another round of proposals.",
                    time: "+6 months",
                    cost: "$25K–$75K",
                    costColor: "text-red-400",
                  },
                  {
                    step: "07",
                    label: "Ground breaks",
                    detail: "Construction begins. Finally.",
                    time: "Month 14–18",
                    cost: "",
                    costColor: "",
                  },
                ].map((item, i, arr) => (
                  <div key={item.step} className="flex gap-4">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center flex-shrink-0 w-8">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                          i === arr.length - 1
                            ? "border border-emerald-500/40 text-emerald-400"
                            : "border border-red-500/25 text-red-400/60"
                        }`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {item.step}
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          className="w-px flex-1 bg-red-900/30 my-1"
                          style={{ minHeight: "28px" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-5 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p
                          className="text-white text-[13px] font-semibold leading-snug"
                          style={{ fontFamily: "'Nunito', sans-serif" }}
                        >
                          {item.label}
                        </p>
                        <span className="text-[10px] text-slate-600 font-mono flex-shrink-0 pt-0.5">
                          {item.time}
                        </span>
                      </div>
                      <p
                        className="text-slate-500 text-[12px] leading-snug mb-1"
                        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                      >
                        {item.detail}
                      </p>
                      {item.cost && (
                        <span className={`text-[11px] font-mono font-semibold ${item.costColor}`}>
                          {item.cost}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mx-6 mb-6 rounded-xl bg-red-950/40 border border-red-900/30 px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[10px] text-red-400/60 uppercase tracking-widest font-semibold"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Total before ground breaks
                  </span>
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className="text-2xl font-extrabold text-red-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    14–18 months
                  </span>
                  <span className="text-slate-600 text-sm font-mono">·</span>
                  <span
                    className="text-2xl font-extrabold text-red-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    $75K–$225K
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-1">
                  In soft costs — before a single panel is installed
                </p>
              </div>

              {/* Merlin contrast */}
              <div className="mx-6 mb-6 rounded-xl bg-emerald-950/30 border border-emerald-800/30 px-5 py-4">
                <p
                  className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-semibold mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  With Merlin — same output
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className="text-2xl font-extrabold text-emerald-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    15 minutes
                  </span>
                  <span className="text-slate-600 text-sm font-mono">·</span>
                  <span
                    className="text-2xl font-extrabold text-emerald-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    $0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-1">
                  Independent · No vendor bias · Same math as the engineering study
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom transition — bridge into the estimate section */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-14 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.04]" />
          <span
            className="text-[11px] text-slate-700 uppercase tracking-widest font-medium"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            See what your facility could save — in the next 90 seconds
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </div>
    </section>
  );
}
