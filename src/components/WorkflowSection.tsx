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
    <div className="rounded-[1.35rem] border border-white/12 bg-[#191A1E] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.38)] lg:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div
            className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500"
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
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-3 py-1 text-[11px] font-medium text-emerald-400">
          CFO-Approved
        </span>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Annual Savings", value: "$24,500", tone: "text-blue-500" },
          { label: "Payback Period", value: "5.2 Yrs", tone: "text-white/15" },
          { label: "Project NPV", value: "+$114,800", tone: "text-white" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/[0.06] bg-black/30 p-5 text-center"
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

      <div className="mt-10">
        <div
          className="mb-3 text-[11px] uppercase tracking-[0.12em] text-slate-500"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Optimal Hardware Configuration
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.08] p-4 text-sm">
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
        href="/wizard"
        className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-500 transition hover:border-blue-400 hover:bg-blue-500/16 hover:text-blue-400"
      >
        <Play size={15} fill="currentColor" /> Simulate Your Building Now
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(37,99,235,0.1),transparent_34%)]" />
      <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[12px] tracking-[0.12em] text-blue-500">
            Sophisticated Physics, Simple Decisions
          </div>
          <h2
            className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl"
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
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-500">
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
