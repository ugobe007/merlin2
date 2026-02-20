/**
 * ITC BONUS QUALIFICATION CARD — IRA 2022 Tax Credit Optimizer
 * =============================================================
 * Compact card letting users indicate which IRA 2022 ITC bonuses
 * their project qualifies for. Drives dynamic ITC rate (6–70%).
 *
 * Created: Feb 2026
 * Source: IRA 2022 (Public Law 117-169), IRS Notice 2023-29/38
 */

import React from "react";
import { DollarSign, Check, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { ITCBonuses } from "@/wizard/v7/hooks/useWizardV7";

interface ITCBonusCardProps {
  bonuses: ITCBonuses;
  onChange: (bonuses: ITCBonuses) => void;
  capacityMW?: number;
}

/** Estimate the ITC rate from bonus selections (mirrors itcCalculator logic) */
function estimateRate(b: ITCBonuses, mw: number): number {
  let rate = b.prevailingWage || mw < 1 ? 0.30 : 0.06;
  if (b.energyCommunity) rate += 0.10;
  if (b.domesticContent) rate += 0.10;
  if (b.lowIncome && mw < 5) {
    rate += b.lowIncome === "serves" ? 0.20 : 0.10;
  }
  return Math.min(rate, 0.70);
}

export default function ITCBonusCard({ bonuses, onChange, capacityMW = 1 }: ITCBonusCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const rate = estimateRate(bonuses, capacityMW);
  const rateStr = `${Math.round(rate * 100)}%`;

  const toggle = (field: keyof ITCBonuses, value?: ITCBonuses[keyof ITCBonuses]) => {
    onChange({
      ...bonuses,
      [field]: value !== undefined ? value : !bonuses[field],
    });
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-200">
              Federal ITC Qualification
            </span>
            <span className="text-xs text-slate-500 ml-2">IRA 2022</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold tabular-nums ${
            rate > 0.30 ? "text-emerald-400" : "text-slate-300"
          }`}>
            {rateStr}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded qualifications */}
      {expanded && (
        <div className="px-5 pb-4 pt-1 space-y-3 border-t border-white/[0.04]">
          <p className="text-xs text-slate-500 leading-relaxed">
            Select which IRA 2022 bonus qualifications your project meets.
            Each bonus increases your Investment Tax Credit rate.
          </p>

          {/* Prevailing Wage & Apprenticeship (+24%) */}
          <BonusToggle
            checked={bonuses.prevailingWage}
            onChange={() => toggle("prevailingWage")}
            label="Prevailing Wage & Apprenticeship"
            bonus="+24%"
            hint={capacityMW < 1
              ? "Waived for projects under 1 MW"
              : "Davis-Bacon wages + registered apprenticeship program"
            }
            disabled={capacityMW < 1}
          />

          {/* Energy Community (+10%) */}
          <BonusToggle
            checked={!!bonuses.energyCommunity}
            onChange={() => toggle("energyCommunity")}
            label="Energy Community"
            bonus="+10%"
            hint="Coal closure area, brownfield, or fossil fuel employment community"
          />

          {/* Domestic Content (+10%) */}
          <BonusToggle
            checked={!!bonuses.domesticContent}
            onChange={() => toggle("domesticContent")}
            label="Domestic Content"
            bonus="+10%"
            hint="100% US steel + ≥40% US manufactured components"
          />

          {/* Low-Income Community (+10-20%) — only for <5 MW */}
          {capacityMW < 5 && (
            <BonusToggle
              checked={!!bonuses.lowIncome}
              onChange={() => toggle("lowIncome", bonuses.lowIncome ? false : "located-in")}
              label="Low-Income Community"
              bonus="+10–20%"
              hint="Located in or serves a low-income community (< 5 MW only)"
            />
          )}

          {/* Rate summary */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
            <span className="text-xs text-slate-500">Estimated ITC Rate</span>
            <span className={`text-sm font-bold ${
              rate > 0.30 ? "text-emerald-400" : "text-slate-300"
            }`}>
              {rateStr}
              {rate > 0.30 && (
                <span className="text-xs font-normal text-emerald-500/60 ml-1">
                  (vs 30% standard)
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Toggle sub-component ──

function BonusToggle({
  checked,
  onChange,
  label,
  bonus,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  bonus: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
        checked
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : "border-white/[0.04] bg-transparent hover:border-white/[0.08]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
        checked
          ? "bg-emerald-500 border-emerald-500"
          : "border-slate-600 bg-transparent"
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Label + hint */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${checked ? "text-slate-200" : "text-slate-400"}`}>
            {label}
          </span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            checked ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-slate-500"
          }`}>
            {bonus}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>
      </div>

      <HelpCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1" />
    </button>
  );
}
