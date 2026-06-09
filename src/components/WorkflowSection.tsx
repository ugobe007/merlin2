/* Merlin Energy — Under-the-hood proof section */

import { BarChart3, DollarSign, Globe2, Play } from "lucide-react";

const capabilities = [
  {
    icon: Globe2,
    title: "Micro-Climate Irradiance Modeling",
    body: "MERLIN pulls meteorological and solar resource data based on facility location to estimate true solar yield, including local climate and seasonal production patterns.",
  },
  {
    icon: BarChart3,
    title: "8,760 Hourly Dispatch Simulation",
    body: "We model a building's annual energy profile hour by hour to estimate demand-charge reduction, solar self-consumption, and battery charge/discharge value.",
  },
  {
    icon: DollarSign,
    title: "Federal, State, & Utility Incentive Mapping",
    body: "MERLIN applies federal ITC assumptions, depreciation rules, and utility program logic to translate technical options into business-ready financial outcomes.",
  },
];

function BriefExampleCard() {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#3FE8FF]/22 bg-[#0a0c18]/92 p-6 shadow-[0_34px_110px_rgba(0,0,0,0.52),0_0_70px_rgba(168,85,247,0.14)] lg:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(63,232,255,0.72),rgba(34,211,238,0.58),rgba(168,85,247,0.64),rgba(192,132,252,0.5))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(63,232,255,0.14),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.16),transparent_34%),linear-gradient(145deg,rgba(63,232,255,0.045),rgba(88,28,135,0.11)_52%,rgba(96,165,250,0.045))]" />
      <div className="relative flex items-start justify-between gap-4 border-b border-[#3FE8FF]/14 pb-5">
        <div>
          <div
            className="mb-2 text-[10px] uppercase tracking-[0.18em] text-cyan-300/70"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Redesigned Output Example
          </div>
          <h3
            className="text-base font-bold text-white sm:text-lg"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Merlin Energy Brief: Phoenix Hotel
          </h3>
        </div>
        <span className="rounded-full border border-[#A855F7]/35 bg-transparent px-3 py-1 text-[11px] font-medium text-[#C084FC]">
          CFO-Approved
        </span>
      </div>

      <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Annual Savings", value: "$24,500", tone: "text-cyan-300" },
          { label: "Payback Period", value: "5.2 Yrs", tone: "text-[#A855F7]" },
          { label: "Project NPV", value: "+$114,800", tone: "text-[#C084FC]" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[#3FE8FF]/12 bg-black/28 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <div
              className="mb-2 text-[10px] tracking-[0.12em] text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {metric.label}
            </div>
            <div
              className={`text-xl font-black tracking-wide ${metric.tone}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-10">
        <div
          className="mb-3 text-[11px] uppercase tracking-[0.12em] text-cyan-300/70"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Optimal Hardware Configuration
        </div>
        <div className="rounded-xl border border-[#A855F7]/18 bg-white/[0.045] p-4 text-sm">
          {[
            ["Solar PV Array:", "120 kW DC"],
            ["Battery Storage (BESS):", "60 kW / 120 kWh"],
            ["Est. First Year Generation:", "192,400 kWh"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-1 text-slate-400"
            >
              <span>{label}</span>
              <span className="font-bold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <a
        href="/news"
        className="relative mt-9 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#3FE8FF]/45 bg-transparent px-4 py-3 text-sm font-medium text-cyan-200 transition hover:border-[#A855F7]/70 hover:text-white"
      >
        <Play size={15} fill="currentColor" /> Read the Brief
      </a>
      <a
        href="/workflow"
        className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#A855F7]/45 bg-transparent px-4 py-3 text-sm font-medium text-[#C084FC] transition hover:border-[#3FE8FF]/70 hover:text-cyan-100"
      >
        View Merlin Energy OS
      </a>
    </div>
  );
}

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden bg-[#050608] py-20 text-white lg:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(168,85,247,0.11),transparent_34%),radial-gradient(circle_at_24%_58%,rgba(63,232,255,0.07),transparent_30%)]" />
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex rounded-md border border-[#3FE8FF]/30 bg-transparent px-3 py-1 text-[12px] tracking-[0.12em] text-cyan-300">
            Sophisticated Physics, Simple Decisions
          </div>
          <h2
            className="bg-[linear-gradient(90deg,#3FE8FF_0%,#22D3EE_35%,#A855F7_72%,#C084FC_100%)] bg-clip-text text-4xl font-black tracking-[-0.04em] text-transparent sm:text-5xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Under the hood of the MERLIN engine.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            What used to require an engineering firm, weeks of back-and-forth, and thousands in
            upfront analysis, MERLIN compresses into a guided 90-second first pass.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[0.9fr_1fr] xl:gap-20">
          <div className="space-y-9">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-5">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#3FE8FF]/24 bg-[#0a0c18]/70 text-[#3FE8FF] shadow-[0_0_28px_rgba(168,85,247,0.12)]">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-bold text-white"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-400">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <BriefExampleCard />
        </div>
      </div>
    </section>
  );
}
