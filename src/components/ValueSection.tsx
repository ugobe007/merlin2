/* Merlin Energy — Our Story / About Section
   Founder narrative. Always fully expanded. No toggle.
   Placement: bottom of home page, above Footer.              */

const SHIELD_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-gold_53d77804.png";
const SHIELD_BLUE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663452998285/mKEEa8r3K6343KtBgXXzFc/shield-blue_6e564263.png";

export default function ValueSection() {
  return (
    <section className="py-16 bg-[#060D1F] border-t border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-5 h-px bg-sky-500/40" />
          <span
            className="text-[10px] text-sky-400/60 uppercase tracking-[0.25em] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Our story
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-12 xl:gap-20 items-start">
          {/* ── Left: Founder narrative ── */}
          <div>
            <h2
              className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-6"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              We've been inside these projects.
              <br className="hidden lg:block" />
              That's why we built this.
            </h2>

            <div className="space-y-5">
              <p
                className="text-slate-300 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                We came from large battery manufacturers and chemical companies — and spent years
                designing and deploying megawatt-scale battery energy storage systems across North
                America, Europe, and Asia-Pacific. We understood the technology at the cell and
                system level: the BMS logic, inverter configurations, transformer sizing, ESS
                control software, and how every variable shifts when the load profile of the
                facility changes. What we couldn't understand was why the decision to deploy was
                still so hard.
              </p>

              <p
                className="text-slate-400 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                The energy equation is not simple. BESS is the core — but it never operates alone.
                It has to be sized against peak demand, calibrated to the utility rate structure,
                stacked with solar if the roof supports it, and extended with backup generation when
                grid reliability is the constraint. EV charging infrastructure adds both a revenue
                layer and an additional load that reshapes the entire power profile. For data
                centers, the calculation is existential: power grids are strained, utility pricing
                is rising, and a resilient on-site energy strategy is no longer optional.
              </p>

              <p
                className="text-slate-400 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                The deeper problem: no one has mapped this complexity into a coherent workflow that
                a facility operator can actually use. A hotel is not a hospital. A car wash is not a
                data center. An airport is a small city — with terminal loads, operations loads, and
                concession loads that behave independently but share the same utility
                infrastructure. A college campus is the same. Each building, each department, each
                use case demands a different energy configuration — and the variables compound fast:
                inverter topology, transformer capacity, battery chemistry, state-of-charge
                strategy, demand response windows, generator dispatch logic. Getting it wrong costs
                millions. Getting it right requires cross-industry knowledge most operators will
                never have access to.
              </p>

              <p
                className="text-slate-400 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                We looked at what AI could do and found a critical gap: general AI systems are not
                trained on energy physics, utility tariff structures, BMS control logic, or the
                demand profiles that separate a 450 kW car wash from a 2 MW data center. They
                generate plausible-sounding text. They don't do the engineering. So we built{" "}
                <span className="text-yellow-400 font-semibold">TrueQuote</span> — an AI-enabled
                orchestration engine designed specifically for the complexity of commercial and
                industrial energy projects. It models BESS, solar, wind, backup generation, and EV
                infrastructure together — configured to the specific load profile of each industry,
                sized against live utility data, and delivered as an EPC-ready project model in
                minutes. The kind of analysis that once required an engineering firm, six vendor
                proposals, and fourteen months of calendar — produced before the first meeting.
              </p>

              <p
                className="text-slate-400 text-base leading-relaxed"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                This is the first platform built to orchestrate that level of complexity through a
                simple interface. Not because the engineering is simple — it isn't. But because
                we've spent years doing it the hard way, and we know exactly what needs to be
                abstracted and what needs to be preserved.
              </p>
            </div>
          </div>

          {/* ── Right: Products + scope ── */}
          <div className="space-y-4">
            {/* Product badges */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080F1E] overflow-hidden">
              <div className="h-[3px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-transparent" />
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p
                  className="text-[10px] text-sky-400/60 uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  What we built
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                  <img
                    src={SHIELD_GOLD}
                    alt="TrueQuote"
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <div>
                    <div
                      className="text-sm font-bold text-yellow-400"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      TrueQuote™
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      EPC-ready energy project models for facility operators
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                  <img
                    src={SHIELD_BLUE}
                    alt="ProQuote"
                    className="w-8 h-8 object-contain flex-shrink-0"
                  />
                  <div>
                    <div
                      className="text-sm font-bold text-blue-400"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      ProQuote™
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">
                      Precision response tools for EPC vendors &amp; integrators
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What Merlin sizes */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080F1E] px-5 py-4 space-y-3">
              <p
                className="text-[9px] text-sky-400/50 uppercase tracking-widest font-semibold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                What TrueQuote sizes
              </p>
              {[
                { label: "BESS", note: "Battery energy storage — the core" },
                { label: "Solar + Wind", note: "Generation stacked to the load" },
                { label: "Backup generation", note: "Diesel, linear, emerging nuclear" },
                { label: "EV charging", note: "Revenue layer + load management" },
                { label: "Power infrastructure", note: "Inverters, transformers, switches" },
                { label: "BMS / ESS software", note: "Control logic & dispatch strategy" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/60 mt-1.5 flex-shrink-0" />
                  <div>
                    <span
                      className="text-[12px] text-white font-semibold"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-[12px] text-slate-500 ml-1.5"
                      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    >
                      — {item.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Background */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080F1E] px-5 py-4 space-y-3">
              <p
                className="text-[9px] text-sky-400/50 uppercase tracking-widest font-semibold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Our background
              </p>
              {[
                "Battery manufacturing & electrochemistry",
                "Global BESS deployments — NA, EU, APAC",
                "EV charging infrastructure & operations",
                "AI tuned to energy physics, not general text",
              ].map((c) => (
                <div key={c} className="flex items-start gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-sky-400/50 mt-1.5 flex-shrink-0" />
                  <span
                    className="text-[12px] text-slate-400 leading-snug"
                    style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                  >
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
