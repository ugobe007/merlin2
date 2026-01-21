/**
 * Backup Generator Micro-Prompt
 * =============================
 * Collects backup generator info for resilience modeling.
 *
 * Only shown for high-criticality industries:
 * - Hospital, Data Center, Casino, Airport
 * - Cold Storage, Manufacturing
 *
 * Created: January 21, 2026
 */

import React from "react";
import { Power, HelpCircle } from "lucide-react";
import { type GeneratorCapacityBand, GENERATOR_BAND_TO_KW } from "../types";

// Re-export for backward compatibility (used by ProgressiveModelPanel)
export { GENERATOR_RELEVANT_INDUSTRIES } from "../types";

interface BackupGeneratorPromptProps {
  hasGenerator?: "yes" | "no" | "planned";
  capacityBand?: GeneratorCapacityBand;
  onHasGeneratorChange: (value: "yes" | "no" | "planned") => void;
  onCapacityBandChange: (value: GeneratorCapacityBand) => void;
  industry?: string; // For context
  compact?: boolean;
}

const HAS_GENERATOR_OPTIONS: {
  value: "yes" | "no" | "planned";
  label: string;
  icon: string;
}[] = [
  { value: "yes", label: "Yes", icon: "✓" },
  { value: "no", label: "No", icon: "✗" },
  { value: "planned", label: "Planned", icon: "📅" },
];

const CAPACITY_OPTIONS: {
  value: GeneratorCapacityBand;
  label: string;
  hint: string;
}[] = [
  { value: "under-100", label: "Under 100 kW", hint: "Small backup" },
  { value: "100-500", label: "100–500 kW", hint: "Medium backup" },
  { value: "500-plus", label: "500+ kW", hint: "Large/industrial backup" },
  { value: "not-sure", label: "Not sure", hint: "Estimate from industry" },
];

export function BackupGeneratorPrompt({
  hasGenerator,
  capacityBand,
  onHasGeneratorChange,
  onCapacityBandChange,
  industry: _industry, // Prefixed with _ to indicate intentionally unused (future: industry-specific hints)
  compact = false,
}: BackupGeneratorPromptProps) {
  // Get capacity details if selected
  const capacityDetails =
    capacityBand && capacityBand !== "not-sure" ? GENERATOR_BAND_TO_KW[capacityBand] : null;

  return (
    <div
      className={`rounded-xl border border-violet-500/20 bg-slate-800/50 ${compact ? "p-3" : "p-4"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Power className="w-4 h-4 text-orange-400" />
        <span className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
          Do you have backup generators?
        </span>
        <div className="group relative ml-auto">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-60 p-2 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
            <div className="text-[10px] text-slate-300 leading-relaxed">
              Existing generators affect BESS sizing. BESS can work alongside generators or
              potentially replace them for cleaner backup power.
            </div>
          </div>
        </div>
      </div>

      {/* Yes/No/Planned Options */}
      <div className="flex gap-2 mb-3">
        {HAS_GENERATOR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onHasGeneratorChange(opt.value)}
            className={`
              flex-1 py-2 px-3 rounded-lg text-center transition-all duration-150
              ${
                hasGenerator === opt.value
                  ? "bg-orange-500/20 border border-orange-400/50"
                  : "bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60"
              }
            `}
          >
            <div
              className={`font-medium ${compact ? "text-xs" : "text-sm"} ${
                hasGenerator === opt.value ? "text-orange-300" : "text-slate-300"
              }`}
            >
              <span className="mr-1">{opt.icon}</span> {opt.label}
            </div>
          </button>
        ))}
      </div>

      {/* Capacity Question (only if "yes") */}
      {hasGenerator === "yes" && (
        <>
          <div className={`font-semibold text-white mb-2 ${compact ? "text-xs" : "text-sm"}`}>
            Approximate generator capacity?
          </div>
          <div className="space-y-1.5">
            {CAPACITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onCapacityBandChange(opt.value)}
                className={`
                  w-full text-left rounded-lg transition-all duration-150
                  ${compact ? "px-3 py-1.5" : "px-4 py-2"}
                  ${
                    capacityBand === opt.value
                      ? "bg-orange-500/20 border border-orange-400/50"
                      : "bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${compact ? "text-xs" : "text-sm"} ${
                      capacityBand === opt.value ? "text-orange-300" : "text-white"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className={`${compact ? "text-[10px]" : "text-xs"} text-slate-400`}>
                    {opt.hint}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Capacity Details Display */}
      {capacityDetails && (
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="text-[10px] text-orange-400 font-semibold mb-1.5 uppercase tracking-wide">
            Generator Profile
          </div>
          <div className="text-sm font-bold text-white mb-1">~{capacityDetails.midpoint} kW</div>
          <div className="text-[10px] text-slate-400">
            Range: {capacityDetails.range[0]}–{capacityDetails.range[1]} kW
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            💡 BESS can work with your generator for seamless failover, or potentially reduce
            generator runtime.
          </div>
        </div>
      )}

      {/* No generator hint */}
      {hasGenerator === "no" && (
        <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div className="text-xs text-slate-300">
            <strong>No problem!</strong> BESS can provide backup power without a generator. Merlin
            will size for resilience based on your critical load needs.
          </div>
        </div>
      )}

      {/* Planned generator hint */}
      {hasGenerator === "planned" && (
        <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-200">
            <strong>Great!</strong> BESS + generator is a powerful combo. We'll include generator
            integration in your quote.
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupGeneratorPrompt;
