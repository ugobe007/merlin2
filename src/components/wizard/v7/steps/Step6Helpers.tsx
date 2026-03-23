import React from "react";
import { formatCurrency } from "@/services/internationalService";

/** Stat item — compact inline readout with no card chrome */
export function StatItem({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={accent || "text-slate-500"}>{icon}</span>
      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Safe currency formatter — handles null/undefined/NaN/Infinity and international currencies.
 */
export function fmtUSD(n?: number | null, countryCode?: string): string {
  if (n === null || n === undefined) return "—";
  if (!Number.isFinite(n)) return "—";
  try {
    return formatCurrency(n, countryCode || "US");
  } catch {
    return `$${Math.round(n)}`;
  }
}

/** Safe number formatter for non-currency values */
export function fmtNum(n?: number | null, fallback = "—"): string {
  if (n === null || n === undefined) return fallback;
  if (!Number.isFinite(n)) return fallback;
  return String(n);
}
