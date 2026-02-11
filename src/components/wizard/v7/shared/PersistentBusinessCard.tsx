/**
 * PersistentBusinessCard — Follows user through all wizard steps
 *
 * Shows: Business name, location, and live financial estimates
 * that update as the wizard progresses (peak load → savings → ROI).
 *
 * Created: February 11, 2026
 */

import React, { useMemo } from "react";
import { MapPin, Building2, TrendingUp, Zap, DollarSign } from "lucide-react";
import type { WizardState as WizardV7State } from "@/wizard/v7/hooks/useWizardV7";
import { getIndustryMeta } from "@/wizard/v7/industryMeta";

type Props = {
  state: WizardV7State;
};

function fmtUSD(n?: number | null): string {
  if (n === null || n === undefined) return "—";
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

export function PersistentBusinessCard({ state }: Props) {
  const business = state.businessCard ?? state.business;

  // Don't show if no business was detected
  if (!business?.name) return null;

  const industryMeta = getIndustryMeta(state.industry);

  const location = useMemo(() => {
    if (business?.formattedAddress) return business.formattedAddress;
    const parts = [business?.city, business?.stateCode, business?.postal].filter(Boolean);
    if (parts.length) return parts.join(", ");
    if (state.location) {
      const locParts = [state.location.city, state.location.state, state.location.postalCode].filter(Boolean);
      return locParts.join(", ") || state.location.formattedAddress || "—";
    }
    return "—";
  }, [business, state.location]);

  // Live financial estimates from quote (updates as steps progress)
  const quote = state.quote;
  const hasPricing = quote?.pricingComplete;
  const annualSavings = hasPricing ? (quote?.annualSavingsUSD as number | null) : null;
  const roiYears = hasPricing ? (quote?.roiYears as number | null) : null;
  const peakLoadKW = quote?.peakLoadKW as number | null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-3 mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-3">
        {/* Business icon */}
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-lg flex-shrink-0">
          {industryMeta.icon || "🏢"}
        </div>

        {/* Name + location */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white truncate">{business.name}</div>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Live stats — right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {peakLoadKW != null && Number.isFinite(peakLoadKW) && peakLoadKW > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                <span className="text-xs font-bold tabular-nums">{Math.round(peakLoadKW)} kW</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase">Peak</div>
            </div>
          )}
          {annualSavings != null && Number.isFinite(annualSavings) && annualSavings > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-emerald-400">
                <DollarSign className="w-3 h-3" />
                <span className="text-xs font-bold tabular-nums">{fmtUSD(annualSavings)}</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase">Savings/yr</div>
            </div>
          )}
          {roiYears != null && Number.isFinite(roiYears) && roiYears > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-purple-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-bold tabular-nums">{Number(roiYears).toFixed(1)}yr</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase">Payback</div>
            </div>
          )}
          {!peakLoadKW && !annualSavings && (
            <div className="text-[10px] text-slate-500 italic">
              Estimates update as you go
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
