/**
 * Demand Charge Micro-Prompt
 * ==========================
 * Collects demand charge presence and band for ROI accuracy.
 *
 * This is CRITICAL for BESS economics. Without demand charges,
 * peak shaving ROI calculations will be wildly inaccurate.
 *
 * Created: January 21, 2026
 */

import React from "react";
import { DollarSign, HelpCircle } from "lucide-react";
import { type DemandChargeBand, DEMAND_CHARGE_BAND_TO_RATE } from "../types";

interface DemandChargePromptProps {
  hasDemandCharge?: "yes" | "no" | "not-sure";
  demandChargeBand?: DemandChargeBand;
  onHasDemandChargeChange: (value: "yes" | "no" | "not-sure") => void;
  onBandChange: (value: DemandChargeBand) => void;
  estimatedPeakKW?: number; // For monthly impact calculation
  compact?: boolean;
}

const HAS_DEMAND_OPTIONS: {
  value: "yes" | "no" | "not-sure";
  label: string;
  icon: string;
}[] = [
  { value: "yes", label: "Yes", icon: "✓" },
  { value: "no", label: "No", icon: "✗" },
  { value: "not-sure", label: "Not sure", icon: "?" },
];

const BAND_OPTIONS: {
  value: DemandChargeBand;
  label: string;
  hint: string;
}[] = [
  { value: "under-10", label: "Under $10/kW", hint: "Low impact" },
  { value: "10-20", label: "$10–$20/kW", hint: "Moderate impact" },
  { value: "20-plus", label: "$20+/kW", hint: "Strong BESS ROI potential" },
  { value: "not-sure", label: "Not sure", hint: "Use regional average" },
];

export function DemandChargePrompt({
  hasDemandCharge,
  demandChargeBand,
  onHasDemandChargeChange,
  onBandChange,
  estimatedPeakKW,
  compact = false,
}: DemandChargePromptProps) {
  // Calculate monthly impact if we have enough data
  const monthlyImpact =
    demandChargeBand && demandChargeBand !== "not-sure" && estimatedPeakKW
      ? estimatedPeakKW * DEMAND_CHARGE_BAND_TO_RATE[demandChargeBand].rate
      : null;

  // Get band details
  const bandDetails =
    demandChargeBand && demandChargeBand !== "not-sure"
      ? DEMAND_CHARGE_BAND_TO_RATE[demandChargeBand]
      : null;

  return (
    <div
      className={`rounded-xl border border-violet-500/20 bg-slate-800/50 ${compact ? "p-3" : "p-4"}`}
    >
      {/* Question 1: Do you pay demand charges? */}
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-4 h-4 text-amber-400" />
        <span className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
          Do you pay a demand charge on your utility bill?
        </span>
        <div className="group relative ml-auto">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-60 p-2 rounded-lg bg-slate-900 border border-indigo-500/30 shadow-xl z-50">
            <div className="text-[10px] text-slate-300 leading-relaxed">
              Demand charges are based on your highest power draw (kW), not total energy (kWh).
              Check your utility bill for "demand charge" or "capacity charge".
            </div>
          </div>
        </div>
      </div>
      {/* Rationale: Why this matters */}
      <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        This unlocks accurate peak shaving savings — often the #1 ROI driver for BESS.
      </div>

      {/* Yes/No/Not Sure Options */}
      <div className="flex gap-2 mb-3">
        {HAS_DEMAND_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onHasDemandChargeChange(opt.value)}
            className={`
              flex-1 py-2 px-3 rounded-lg text-center transition-all duration-150
              ${
                hasDemandCharge === opt.value
                  ? "bg-violet-500/20 border border-violet-400/50"
                  : "bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60"
              }
            `}
          >
            <div
              className={`font-medium ${compact ? "text-xs" : "text-sm"} ${
                hasDemandCharge === opt.value ? "text-violet-300" : "text-slate-300"
              }`}
            >
              <span className="mr-1">{opt.icon}</span> {opt.label}
            </div>
          </button>
        ))}
      </div>

      {/* Question 2: What band? (only if "yes") */}
      {hasDemandCharge === "yes" && (
        <>
          <div className={`font-semibold text-white mb-2 ${compact ? "text-xs" : "text-sm"}`}>
            Approximate demand charge per kW?
          </div>
          <div className="space-y-1.5">
            {BAND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onBandChange(opt.value)}
                className={`
                  w-full text-left rounded-lg transition-all duration-150
                  ${compact ? "px-3 py-1.5" : "px-4 py-2"}
                  ${
                    demandChargeBand === opt.value
                      ? "bg-amber-500/20 border border-amber-400/50"
                      : "bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium ${compact ? "text-xs" : "text-sm"} ${
                      demandChargeBand === opt.value ? "text-amber-300" : "text-white"
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

      {/* Monthly Impact Display */}
      {monthlyImpact && bandDetails && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-[10px] text-amber-400 font-semibold mb-1.5 uppercase tracking-wide">
            Estimated Demand Charge Impact
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-black text-white">${monthlyImpact.toLocaleString()}</div>
            <div className="text-xs text-slate-400">/month</div>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Based on {estimatedPeakKW?.toLocaleString()} kW peak × ${bandDetails.rate}/kW
          </div>
          {bandDetails.impact === "high" && (
            <div className="mt-2 text-[10px] text-emerald-400">
              💡 High demand charges = strong BESS peak shaving ROI
            </div>
          )}
        </div>
      )}

      {/* Not sure hint */}
      {hasDemandCharge === "not-sure" && (
        <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div className="text-xs text-slate-300">
            <strong>Tip:</strong> Check your utility bill for "demand charge", "capacity charge", or
            "kW charge". Most commercial rates include demand charges.
          </div>
        </div>
      )}

      {/* No demand charge */}
      {hasDemandCharge === "no" && (
        <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
          <div className="text-xs text-slate-300">
            Without demand charges, BESS value comes from energy arbitrage and backup power rather
            than peak shaving.
          </div>
        </div>
      )}
    </div>
  );
}

export default DemandChargePrompt;
