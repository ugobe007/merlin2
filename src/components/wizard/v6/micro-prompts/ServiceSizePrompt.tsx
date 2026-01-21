/**
 * Service Size Micro-Prompt
 * =========================
 * Collects electrical service size to infer grid capacity & peak demand band.
 *
 * UX Philosophy:
 * - Single question, takes < 3 seconds to answer
 * - Shows inferred values immediately
 * - "Unsure" option uses industry heuristics
 *
 * Created: January 21, 2026
 */

import React from "react";
import { Zap, HelpCircle } from "lucide-react";
import { type ServiceSizeOption, SERVICE_SIZE_TO_CAPACITY } from "../types";

interface ServiceSizePromptProps {
  value?: ServiceSizeOption;
  onChange: (value: ServiceSizeOption) => void;
  industry?: string; // For industry-specific hints
  compact?: boolean; // Compact mode for inline display
}

const SERVICE_OPTIONS: {
  value: ServiceSizeOption;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    value: "200A-single",
    label: "200A Single Phase",
    hint: "~48 kW • Small retail, small office",
    icon: "🏪",
  },
  {
    value: "400A-three",
    label: "400A Three Phase",
    hint: "~275 kW • Medium commercial",
    icon: "🏢",
  },
  {
    value: "800A-three",
    label: "800A Three Phase",
    hint: "~550 kW • Large commercial, hotels",
    icon: "🏨",
  },
  {
    value: "1000A-plus",
    label: "1000A+ / Dedicated Feeder",
    hint: "750+ kW • Industrial, data centers",
    icon: "🏭",
  },
  {
    value: "unsure",
    label: "Not sure",
    hint: "Merlin will estimate from industry data",
    icon: "🤔",
  },
];

export function ServiceSizePrompt({
  value,
  onChange,
  industry,
  compact = false,
}: ServiceSizePromptProps) {
  // Get inferred values if a concrete option is selected
  const inference = value && value !== "unsure" ? SERVICE_SIZE_TO_CAPACITY[value] : null;

  return (
    <div
      className={`rounded-xl border border-violet-500/20 bg-slate-800/50 ${compact ? "p-3" : "p-4"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-violet-400" />
        <span className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
          What is your main electrical service size?
        </span>
        <div className="group relative ml-auto">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
            <div className="text-[10px] text-slate-300 leading-relaxed">
              Check your main breaker panel or utility bill. This helps Merlin calculate your grid
              capacity limits.
            </div>
          </div>
        </div>
      </div>
      {/* Rationale: Why this matters */}
      <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        This determines how much power your grid can deliver — critical for BESS sizing.
      </div>

      {/* Options */}
      <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
        {SERVICE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              w-full text-left rounded-lg transition-all duration-150
              ${compact ? "px-3 py-2" : "px-4 py-2.5"}
              ${
                value === opt.value
                  ? "bg-violet-500/20 border border-violet-400/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                  : "bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60 hover:border-slate-500/50"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-white font-medium ${compact ? "text-xs" : "text-sm"}`}>
                  {opt.label}
                </div>
                <div className={`text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                  {opt.hint}
                </div>
              </div>
              {value === opt.value && (
                <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Inferred Values Display */}
      {inference && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-wide">
            Inferred Power Profile
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-slate-400">Peak Demand</div>
              <div className="text-sm font-bold text-white">
                {inference.peakDemandBand[0]}–{inference.peakDemandBand[1]} kW
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Grid Capacity</div>
              <div className="text-sm font-bold text-white">{inference.gridCapacityKW} kW</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">{inference.typicalUse}</div>
        </div>
      )}

      {/* Unsure hint */}
      {value === "unsure" && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-200">
            <strong>No problem!</strong> Merlin will estimate based on your industry
            {industry ? ` (${industry})` : ""} and facility details.
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceSizePrompt;
