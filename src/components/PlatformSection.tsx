/* Merlin Energy — Platform Section
   Design: Full-width with large left-edge vertical "THE PLATFORM" label
   Content in an offset 2-col grid — feels architectural */

import { useState } from "react";
import { ChevronDown, BarChart3, Calculator, GitCompare, FileText } from "lucide-react";

const items = [
  {
    icon: BarChart3,
    title: "Price projects with real structure",
    body: "Merlin uses NREL data, DOE frameworks, and Sandia-aligned logic to build project costs from the ground up — not estimates, not averages. Every number has a source.",
  },
  {
    icon: Calculator,
    title: "Model savings without spreadsheet drag",
    body: "Stop building custom Excel models for every project. Merlin runs the financial logic automatically — utility rates, demand charges, incentives, depreciation — and delivers a clean output in minutes.",
  },
  {
    icon: GitCompare,
    title: "Compare paths before you commit",
    body: "Solar only? Solar + storage? EV charging? Merlin lets you model multiple project configurations side by side so you can compare ROI, payback, and risk before spending a dollar.",
  },
  {
    icon: FileText,
    title: "Build strategy, profiles, and RFP-ready assets",
    body: "Save your quote as a strategy profile. Share it with your team. Export it as an RFP-ready document. Merlin turns a quote into a buildable plan — not just a number.",
  },
];

export default function PlatformSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="platform" className="py-28 bg-[#080F22] relative overflow-hidden">
      {/* Decorative large background text */}
      <div
        className="absolute top-12 right-0 text-[160px] font-extrabold text-white/[0.018] select-none pointer-events-none leading-none"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        PLATFORM
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid lg:grid-cols-[80px_1fr_1fr] gap-8 lg:gap-12 items-start">

          {/* Left: vertical label */}
          <div className="hidden lg:flex flex-col items-center gap-4 pt-2">
            <div className="w-px h-16 bg-gradient-to-b from-transparent to-cyan-500/40" />
            <span
              className="text-[10px] text-slate-600 uppercase tracking-[0.25em] font-medium"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              The Platform
            </span>
            <div className="w-px flex-1 bg-gradient-to-b from-cyan-500/20 to-transparent" />
          </div>

          {/* Center: copy */}
          <div className="lg:sticky lg:top-28">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-4 lg:hidden">
              The Platform
            </p>
            <h2
              className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              More than a quote.
              <br />
              <span className="gradient-text">A faster way to decide.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Merlin is not a calculator. It is not just quoting. It is not engineering software. It is a decision, quoting, and planning platform — built to move energy projects from idea to action.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Decision Platform", "Quoting Engine", "Planning Tool", "RFP Builder"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-cyan-500/20 bg-cyan-500/5 text-cyan-400"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: accordion */}
          <div className="space-y-3">
            {items.map((item, i) => {
              const Icon = item.icon;
              const isOpen = openIndex === i;
              return (
                <div
                  key={item.title}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-cyan-500/25 bg-cyan-500/5"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOpen ? "bg-cyan-500/15 text-cyan-400" : "bg-white/[0.05] text-slate-500"
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    <span
                      className={`flex-1 text-sm font-semibold transition-colors ${
                        isOpen ? "text-white" : "text-slate-300"
                      }`}
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {item.title}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-600 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <div className="pl-[52px]">
                        <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {item.body}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
