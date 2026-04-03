/* Merlin Energy — Workflow Section
   Design: Collapsible section — compact header bar, expands to show full timeline
   Auto-expands when navigated to via hash link */

import { useState, useEffect } from "react";
import {
  SplitSquareHorizontal,
  ClipboardList,
  Cpu,
  TrendingUp,
  FileCheck,
  ChevronDown,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: SplitSquareHorizontal,
    title: "Choose your product",
    body: "Select TrueQuote to evaluate a project as a customer, or ProQuote to build a vendor proposal.",
    align: "right",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Enter key inputs",
    body: "Provide your facility type, location, utility data, and project goals. No engineering degree required.",
    align: "left",
  },
  {
    number: "03",
    icon: Cpu,
    title: "Merlin builds the model",
    body: "Our platform runs the financial and technical logic automatically using real data sources.",
    align: "right",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Review cost, savings & ROI",
    body: "See a complete breakdown of project costs, annual savings, payback period, and return on investment.",
    align: "left",
  },
  {
    number: "05",
    icon: FileCheck,
    title: "Save, share & build",
    body: "Save your quote profile, export an RFP-ready document, or invite vendors to respond.",
    align: "right",
  },
];

export default function WorkflowSection() {
  const [open, setOpen] = useState(false);

  // Auto-expand when hash navigation points here
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#workflow") {
        setOpen(true);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <section id="workflow" className="bg-[#080F22] border-y border-white/[0.06]">
      {/* Collapsible toggle bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-5 group transition-all duration-200 hover:opacity-80"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-xs text-cyan-400 font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            How It Works
          </span>
          <span
            className="text-white font-semibold text-base"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Simple in front. Powerful underneath.
          </span>
          {/* Step pills — always visible */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            {steps.map((s) => (
              <span
                key={s.number}
                className="text-[10px] text-slate-600 font-bold tracking-widest px-2 py-0.5 rounded border border-white/[0.06]"
              >
                {s.number}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <span className="hidden sm:inline" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {open ? "Collapse" : "See all 5 steps"}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expandable timeline */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-16 pt-4">
          {/* Timeline */}
          <div className="relative">
            {/* Center vertical line — desktop */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden lg:block">
              <div className="h-full bg-gradient-to-b from-blue-500/40 via-cyan-500/20 to-transparent" />
            </div>
            {/* Mobile left line */}
            <div className="absolute left-6 top-0 bottom-0 w-px lg:hidden bg-gradient-to-b from-blue-500/40 via-cyan-500/20 to-transparent" />

            <div className="space-y-12 lg:space-y-0">
              {steps.map((step) => {
                const Icon = step.icon;
                const isRight = step.align === "right";

                return (
                  <div
                    key={step.number}
                    className="relative lg:grid lg:grid-cols-2 lg:gap-12 lg:mb-14"
                  >
                    {isRight ? (
                      <>
                        <div className="hidden lg:block" />
                        <div className="relative pl-10 lg:pl-8">
                          <div className="absolute left-[-21px] top-4 w-[42px] h-[42px] rounded-full bg-[#080F22] border-2 border-blue-500/40 items-center justify-center hidden lg:flex">
                            <Icon size={18} className="text-blue-400" />
                          </div>
                          <StepCard step={step} Icon={Icon} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative pr-8 text-right hidden lg:block">
                          <div className="absolute right-[-21px] top-4 w-[42px] h-[42px] rounded-full bg-[#080F22] border-2 border-cyan-500/40 flex items-center justify-center">
                            <Icon size={18} className="text-cyan-400" />
                          </div>
                          <StepCard step={step} Icon={Icon} reversed />
                        </div>
                        <div className="hidden lg:block" />
                      </>
                    )}

                    {/* Mobile */}
                    <div className="lg:hidden pl-14 relative">
                      <div className="absolute left-3 top-3 w-8 h-8 rounded-full bg-[#080F22] border-2 border-blue-500/40 flex items-center justify-center">
                        <Icon size={14} className="text-blue-400" />
                      </div>
                      <StepCard step={step} Icon={Icon} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  reversed = false,
}: {
  step: (typeof steps)[0];
  Icon: React.ElementType;
  reversed?: boolean;
}) {
  return (
    <div className={`${reversed ? "ml-auto" : ""} max-w-xs`}>
      <div className={`flex items-center gap-2 mb-2 ${reversed ? "justify-end" : ""}`}>
        <span
          className="text-[10px] text-slate-600 font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Step {step.number}
        </span>
      </div>
      <h3
        className="text-lg font-bold text-white mb-2"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {step.title}
      </h3>
      <p
        className="text-slate-500 text-sm leading-relaxed"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {step.body}
      </p>
    </div>
  );
}
