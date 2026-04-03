/* Merlin Energy — Status Quo Section
   The story of why the current commercial energy process is broken.
   No bullet points. No CTAs. Just the honest narrative.
   Placement: between HeroSection and IndustriesSection.               */

export default function StatusQuoSection() {
  return (
    <section className="bg-[#06101F] border-y border-white/[0.05]">
      {/* Top label + main grid */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-10 pb-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-px bg-sky-500/40" />
          <span
            className="text-[10px] text-sky-400/60 uppercase tracking-[0.25em] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            The problem we exist to solve
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-10 xl:gap-16 items-start">
          {/* ── Left: Narrative prose ──────────────────────────────────── */}
          <div>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-5"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              The way commercial facilities buy energy projects hasn't changed in 30 years.
            </h2>

            {/* Scene 1 */}
            <div className="mb-5">
              <p
                className="text-[10px] text-amber-500/60 uppercase tracking-widest font-semibold mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 1 — The vendor call
              </p>
              <p
                className="text-slate-300 text-base leading-relaxed mb-2"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                A hotel GM in Phoenix suspects she's overpaying on electricity. Peak demand charges
                alone: $28,000 a month. She calls three solar vendors. Three weeks apart, three
                47-page proposals land in her inbox — all using different assumptions. They disagree
                by $400,000. Same building. Same utility. Same roof.
              </p>
              <p
                className="text-slate-500 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Nobody can explain the gap. So she can't decide.
              </p>
            </div>

            {/* Scene 2 */}
            <div className="mb-5">
              <p
                className="text-[10px] text-amber-500/60 uppercase tracking-widest font-semibold mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 2 — The engineering study
              </p>
              <p
                className="text-slate-300 text-base leading-relaxed mb-2"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                She hires an energy engineering firm to get numbers she can trust. Four months.
                $85,000. The 120-page study comes back: yes, it pencils out. 1.1 MW solar / 4.4 MWh
                BESS. Payback: 6.1 years.
              </p>
              <p
                className="text-slate-500 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                She already knew the answer. She just had no way to prove it to herself — or her CFO
                — without paying someone else to do the math.
              </p>
            </div>

            {/* Scene 3 */}
            <div className="mb-6">
              <p
                className="text-[10px] text-amber-500/60 uppercase tracking-widest font-semibold mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scene 3 — EPC procurement
              </p>
              <p
                className="text-slate-300 text-base leading-relaxed mb-2"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Now she needs a builder — an EPC firm to design and install the system. Another RFP.
                Another six months of procurement and negotiation. Ground breaks fourteen months
                after that first phone call.
              </p>
              <p
                className="text-slate-500 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                The project is real. But she paid{" "}
                <span className="text-red-400 font-semibold">$600,000 in utility bills</span> during
                the evaluation period alone.
              </p>
            </div>

            {/* Pivot */}
            <div className="border-l-2 border-emerald-500/40 pl-5 py-0.5">
              <p
                className="text-white text-base leading-relaxed font-medium"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                This is not an edge case. It is the standard commercial energy decision process —
                slow, expensive, and tilted at every step toward whoever is selling something.
              </p>
              <p
                className="text-emerald-400 text-base leading-relaxed font-semibold mt-2"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Merlin compresses that entire evaluation phase into minutes — and delivers an
                EPC-ready project model your team can act on.
              </p>
            </div>
          </div>

          {/* ── Right: By the Numbers ────────────────────────────────────── */}
          <div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #0C0810 0%, #100810 100%)",
                border: "1px solid rgba(239,68,68,0.12)",
              }}
            >
              {/* Header */}
              <div className="px-5 py-3 border-b border-red-900/30">
                <p
                  className="text-[10px] text-red-400/70 uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  By the numbers
                </p>
              </div>

              {/* 4 stats — 2×2 grid */}
              <div className="grid grid-cols-2 border-b border-red-900/20">
                {[
                  { n: "$112K", label: "avg. soft costs before ground breaks" },
                  { n: "14 mo", label: "inquiry to construction start, typically" },
                  { n: "3–5", label: "vendor proposals per project — all different" },
                  { n: "67%", label: "of projects stall during evaluation" },
                ].map((s, i) => (
                  <div
                    key={s.n}
                    className={`px-5 py-4 ${
                      i % 2 === 0 ? "border-r border-red-900/20" : ""
                    } ${i < 2 ? "border-b border-red-900/20" : ""}`}
                  >
                    <p
                      className="text-[22px] font-extrabold text-red-400 mb-0.5"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      {s.n}
                    </p>
                    <p
                      className="text-[11px] text-slate-500 leading-snug"
                      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Phase breakdown */}
              <div className="px-5 py-4 border-b border-red-900/20">
                <p
                  className="text-[9px] text-slate-600 uppercase tracking-widest mb-3 font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Where the time and money go
                </p>
                <div className="space-y-2">
                  {[
                    { phase: "Vendor proposals", time: "6–8 wks", cost: '"free" — biased' },
                    { phase: "Engineering study", time: "3–5 months", cost: "$50K–$150K" },
                    { phase: "EPC procurement", time: "5–7 months", cost: "$25K–$75K" },
                  ].map((row) => (
                    <div key={row.phase} className="flex items-center justify-between gap-2">
                      <span
                        className="text-[12px] text-slate-400 flex-1"
                        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                      >
                        {row.phase}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono w-20 text-right">
                        {row.time}
                      </span>
                      <span className="text-[10px] text-red-400/70 font-mono w-24 text-right">
                        {row.cost}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-red-900/20">
                    <span
                      className="text-[12px] text-white font-bold flex-1"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      Total
                    </span>
                    <span className="text-[10px] text-red-400 font-mono font-bold w-20 text-right">
                      14–18 mo
                    </span>
                    <span className="text-[10px] text-red-400 font-mono font-bold w-24 text-right">
                      $75K–$225K
                    </span>
                  </div>
                </div>
              </div>

              {/* Merlin contrast */}
              <div className="px-5 py-4">
                <p
                  className="text-[9px] text-emerald-400/60 uppercase tracking-widest mb-2 font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  With Merlin — same decision quality
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className="text-[22px] font-extrabold text-emerald-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    15 min
                  </span>
                  <span className="text-slate-600 font-mono">·</span>
                  <span
                    className="text-[22px] font-extrabold text-emerald-400"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    $0
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-1">
                  Independent · No vendor bias · Same math
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-8">
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
