/**
 * HVAC Type Micro-Prompt
 * ======================
 * Collects HVAC type to apply load multiplier.
 *
 * Different HVAC systems have significantly different electrical loads:
 * - Chillers: Higher electrical load (+15%)
 * - Heat pumps: More efficient (-10%)
 * - RTUs: Baseline
 *
 * Created: January 21, 2026
 */

import React from "react";
import { Thermometer, HelpCircle } from "lucide-react";
import { type HVACTypeOption, HVAC_TYPE_MULTIPLIERS } from "../types";

interface HVACTypePromptProps {
  value?: HVACTypeOption;
  onChange: (value: HVACTypeOption) => void;
  compact?: boolean;
}

const HVAC_OPTIONS: {
  value: HVACTypeOption;
  label: string;
  hint: string;
  multiplier: number;
  icon: string;
}[] = [
  {
    value: "rtu",
    label: "Packaged Rooftop (RTU)",
    hint: "Standard commercial HVAC",
    multiplier: 1.0,
    icon: "🏢",
  },
  {
    value: "chiller",
    label: "Central Chiller System",
    hint: "Large buildings, higher load",
    multiplier: 1.15,
    icon: "❄️",
  },
  {
    value: "heat-pump",
    label: "Heat Pumps (VRF/Mini-split)",
    hint: "More efficient, lower load",
    multiplier: 0.9,
    icon: "♻️",
  },
  {
    value: "not-sure",
    label: "Not sure",
    hint: "Use standard assumptions",
    multiplier: 1.0,
    icon: "🤔",
  },
];

export function HVACTypePrompt({ value, onChange, compact = false }: HVACTypePromptProps) {
  // Get selected option details (used for displaying multiplier badge)
  const _selectedOption = HVAC_OPTIONS.find((opt) => opt.value === value);
  const multiplier = value ? HVAC_TYPE_MULTIPLIERS[value] : null;

  return (
    <div
      className={`rounded-xl border border-violet-500/20 bg-slate-800/50 ${compact ? "p-3" : "p-4"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Thermometer className="w-4 h-4 text-cyan-400" />
        <span className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
          Primary HVAC type?
        </span>
        <div className="group relative ml-auto">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-56 p-2 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
            <div className="text-[10px] text-slate-300 leading-relaxed">
              HVAC type affects your electrical load profile. Chillers use more power, heat pumps
              use less.
            </div>
          </div>
        </div>
      </div>
      {/* Rationale: Why this matters */}
      <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        This affects your daily load curve — HVAC is typically 30-50% of commercial loads.
      </div>

      {/* Options */}
      <div className={`space-y-2 ${compact ? "space-y-1.5" : ""}`}>
        {HVAC_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              w-full text-left rounded-lg transition-all duration-150
              ${compact ? "px-3 py-2" : "px-4 py-2.5"}
              ${
                value === opt.value
                  ? "bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
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
              {opt.value !== "not-sure" && opt.multiplier !== 1.0 && (
                <div
                  className={`
                  px-2 py-0.5 rounded text-[10px] font-semibold
                  ${
                    opt.multiplier > 1
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }
                `}
                >
                  {opt.multiplier > 1 ? "+" : ""}
                  {((opt.multiplier - 1) * 100).toFixed(0)}%
                </div>
              )}
              {value === opt.value && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Load Impact Display */}
      {multiplier && multiplier !== 1.0 && value !== "not-sure" && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            multiplier > 1
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}
        >
          <div
            className={`text-[10px] font-semibold mb-1 uppercase tracking-wide ${
              multiplier > 1 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            Load Impact
          </div>
          <div className={`text-xs ${multiplier > 1 ? "text-amber-200" : "text-emerald-200"}`}>
            {multiplier > 1
              ? `Chiller systems typically add ~15% to electrical load. Merlin will adjust peak demand estimates accordingly.`
              : `Heat pumps are ~10% more efficient than conventional HVAC. Merlin will adjust estimates down.`}
          </div>
        </div>
      )}
    </div>
  );
}

export default HVACTypePrompt;
