/* Merlin Energy — Industries Section
   Design: Horizontal tab pills + full-width card panel
   Matches reference: "Begin with your industry" layout */

import { useState } from "react";

const industries = [
  {
    id: "hotels",
    label: "Hotels",
    description:
      "Reduce utility costs, add resilience, and turn a large recurring energy expense into a clearer project decision with real ROI and savings data.",
    systemSize: "1.2 MW / 4.8 MWh",
    annualSavings: "$412K",
    payback: "2.3 yrs",
    output: "ROI + RFP",
  },
  {
    id: "carwash",
    label: "Car Wash",
    description:
      "High daytime energy loads make car wash facilities ideal candidates for solar + storage. Fast payback, strong IRR.",
    systemSize: "150 kW / 600 kWh",
    annualSavings: "$68K",
    payback: "3.8 yrs",
    output: "ROI + RFP",
  },
  {
    id: "ev",
    label: "EV Charging",
    description:
      "Battery storage paired with EV charging stations dramatically reduces demand spikes and utility costs.",
    systemSize: "300 kW / 1.2 MWh",
    annualSavings: "$145K",
    payback: "4.2 yrs",
    output: "ROI + RFP",
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    description:
      "Large roof and land footprints plus consistent load profiles make manufacturing a top-tier solar candidate.",
    systemSize: "2.5 MW / 10 MWh",
    annualSavings: "$680K",
    payback: "5.1 yrs",
    output: "ROI + RFP",
  },
  {
    id: "multifamily",
    label: "Multifamily",
    description:
      "Community solar and shared storage models unlock savings for multifamily properties of all sizes.",
    systemSize: "400 kW / 1.6 MWh",
    annualSavings: "$112K",
    payback: "5.8 yrs",
    output: "ROI + RFP",
  },
  {
    id: "datacenters",
    label: "Data Centers",
    description:
      "24/7 load profiles and sustainability mandates are driving aggressive energy investment in data centers.",
    systemSize: "5 MW / 20 MWh",
    annualSavings: "$1.4M",
    payback: "6.5 yrs",
    output: "ROI + RFP",
  },
];

export default function IndustriesSection() {
  const [activeId, setActiveId] = useState("hotels");
  const active = industries.find((i) => i.id === activeId)!;

  return (
    <section id="industries" className="py-28 bg-[#060D1F]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-10">
          <h2
            className="text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Begin with your industry
          </h2>
          <p
            className="text-slate-400 text-base max-w-2xl"
            style={{ fontFamily: "'Nunito Sans', sans-serif" }}
          >
            Merlin supports 22 industries. The homepage surfaces the highest-interest paths first so
            users can quickly see themselves in the platform.
          </p>
        </div>

        {/* Horizontal tab pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {industries.map((ind) => {
            const isActive = ind.id === activeId;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveId(ind.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-transparent border-emerald-400 text-emerald-400"
                    : "border-white/15 text-slate-400 hover:text-white hover:border-white/30 bg-transparent"
                }`}
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* Full-width industry card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0A1628]/60 overflow-hidden mb-4">
          <div className="grid lg:grid-cols-[1fr_auto] gap-0">
            {/* Left: industry info */}
            <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <h3
                className="text-3xl font-extrabold text-emerald-400 mb-3"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {active.label}
              </h3>
              <p
                className="text-slate-400 text-base leading-relaxed mb-6 max-w-md"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                {active.description}
              </p>
              <a
                href="/wizard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/40 text-sm font-semibold text-emerald-400 hover:border-emerald-400 hover:text-emerald-300 transition-all duration-200"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Build a quote
              </a>
            </div>

            {/* Right: metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 lg:w-[420px]">
              {[
                { label: "TYPICAL SYSTEM", value: active.systemSize, green: false },
                { label: "ANNUAL SAVINGS", value: active.annualSavings, green: true },
                { label: "PAYBACK", value: active.payback, green: false },
                { label: "OUTPUT", value: active.output, green: false },
              ].map((m, i) => (
                <div
                  key={m.label}
                  className={`p-7 ${i < 2 ? "border-b" : ""} ${i % 2 === 0 ? "border-r" : ""} border-white/[0.06]`}
                >
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-medium">
                    {m.label}
                  </p>
                  <p
                    className={`text-2xl font-extrabold ${m.green ? "text-emerald-400" : "text-white"}`}
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
