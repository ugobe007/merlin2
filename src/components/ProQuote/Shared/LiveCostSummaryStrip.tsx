/**
 * LiveCostSummaryStrip - Real-time cost metrics bar
 * Sticky top bar showing live pricing calculations
 * Used in: custom-config, professional-model views
 */

import React from "react";
import type { FinancialCalculationResult } from "@/services/centralizedCalculations";

interface LiveCostSummaryStripProps {
  financialMetrics: FinancialCalculationResult | null;
  isCalculating: boolean;
  storageSizeMW: number;
  durationHours: number;
  storageSizeMWh: number;
}

export const LiveCostSummaryStrip = React.memo(function LiveCostSummaryStrip({
  financialMetrics,
  isCalculating,
  storageSizeMW,
  durationHours,
  storageSizeMWh,
}: LiveCostSummaryStripProps) {
  return (
    <div className="sticky top-[64px] z-20 -mx-4 px-4">
      <div
        className="rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-500"
        style={{
          background: financialMetrics ? "rgba(15,17,23,0.95)" : "rgba(15,17,23,0.85)",
          border: financialMetrics
            ? "1px solid rgba(52,211,153,0.25)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: financialMetrics
            ? "0 0 0 1px rgba(52,211,153,0.1), 0 4px 32px rgba(0,0,0,0.5), 0 0 60px rgba(52,211,153,0.06)"
            : "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top accent gradient bar */}
        <div
          className="h-[2px] w-full"
          style={{
            background: financialMetrics
              ? "linear-gradient(90deg, #34d399 0%, #38bdf8 25%, #6ee7b7 50%, #38bdf8 75%, #34d399 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 100%)",
          }}
        />

        <div className="px-5 py-3">
          {/* Metrics row */}
          {financialMetrics ? (
            <div className="flex items-center justify-center gap-3 lg:gap-5 overflow-x-auto scrollbar-none">
              {/* System badge - left */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isCalculating ? "bg-blue-400 animate-pulse" : "bg-emerald-400"}`}
                  style={{
                    boxShadow: isCalculating
                      ? "0 0 8px rgba(59,130,246,0.5)"
                      : "0 0 8px rgba(52,211,153,0.5)",
                  }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline"
                  style={{ color: "rgba(52,211,153,0.7)" }}
                >
                  {isCalculating ? "Updating" : "Live"}
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Total Cost */}
              <div className="flex flex-col items-center shrink-0 px-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Total
                </span>
                <span className="text-lg font-extrabold tabular-nums text-white leading-tight">
                  {Math.abs(financialMetrics.totalProjectCost ?? 0) >= 1_000_000
                    ? `$${((financialMetrics.totalProjectCost ?? 0) / 1_000_000).toFixed(2)}M`
                    : `$${((financialMetrics.totalProjectCost ?? 0) / 1_000).toFixed(0)}K`}
                </span>
              </div>

              {/* After ITC */}
              {(financialMetrics.netCost ?? 0) > 0 &&
                (financialMetrics.netCost ?? 0) !== (financialMetrics.totalProjectCost ?? 0) && (
                  <>
                    <div
                      className="w-px h-8 shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <div className="flex flex-col items-center shrink-0 px-2">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        After ITC
                      </span>
                      <span
                        className="text-lg font-extrabold tabular-nums leading-tight"
                        style={{ color: "#34d399" }}
                      >
                        {Math.abs(financialMetrics.netCost ?? 0) >= 1_000_000
                          ? `$${((financialMetrics.netCost ?? 0) / 1_000_000).toFixed(2)}M`
                          : `$${((financialMetrics.netCost ?? 0) / 1_000).toFixed(0)}K`}
                      </span>
                    </div>
                  </>
                )}

              {/* $/kWh */}
              <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex flex-col items-center shrink-0 px-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  $/kWh
                </span>
                <span
                  className="text-lg font-extrabold tabular-nums leading-tight"
                  style={{ color: "#38bdf8" }}
                >
                  {storageSizeMWh > 0
                    ? `$${((financialMetrics.totalProjectCost ?? 0) / (storageSizeMWh * 1000)).toFixed(0)}`
                    : "—"}
                </span>
              </div>

              {/* Payback */}
              <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex flex-col items-center shrink-0 px-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Payback
                </span>
                <span
                  className="text-lg font-extrabold tabular-nums leading-tight"
                  style={{ color: "#34d399" }}
                >
                  {financialMetrics.paybackYears != null
                    ? `${financialMetrics.paybackYears.toFixed(1)} yr`
                    : "—"}
                </span>
              </div>

              {/* Annual Savings */}
              <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="flex flex-col items-center shrink-0 px-2">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Savings
                </span>
                <span
                  className="text-lg font-extrabold tabular-nums leading-tight"
                  style={{ color: "#a78bfa" }}
                >
                  {(financialMetrics.annualSavings ?? 0) > 0
                    ? (financialMetrics.annualSavings ?? 0) >= 1_000_000
                      ? `$${((financialMetrics.annualSavings ?? 0) / 1_000_000).toFixed(2)}M/yr`
                      : `$${((financialMetrics.annualSavings ?? 0) / 1_000).toFixed(0)}K/yr`
                    : "—"}
                </span>
              </div>

              {/* ROI */}
              {financialMetrics.roi10Year != null && (
                <>
                  <div
                    className="w-px h-8 shrink-0 hidden lg:block"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div className="flex flex-col items-center shrink-0 px-2 hidden lg:flex">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      10yr ROI
                    </span>
                    <span
                      className="text-lg font-extrabold tabular-nums leading-tight"
                      style={{ color: "#34d399" }}
                    >
                      {financialMetrics.roi10Year.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="w-px h-8 shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* System badge - right */}
              <div className="flex items-center shrink-0">
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide"
                  style={{
                    background: "rgba(52,211,153,0.08)",
                    color: "rgba(52,211,153,0.6)",
                    border: "1px solid rgba(52,211,153,0.15)",
                  }}
                >
                  {storageSizeMW > 0 ? `${storageSizeMW.toFixed(1)} MW` : "—"} /{" "}
                  {durationHours > 0 ? `${durationHours}h` : "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="w-2 h-2 rounded-full bg-white/15" />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                Set your BESS power and duration to see real-time pricing
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {storageSizeMW > 0 ? `${storageSizeMW.toFixed(1)} MW` : "—"} /{" "}
                {durationHours > 0 ? `${durationHours}h` : "—"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
