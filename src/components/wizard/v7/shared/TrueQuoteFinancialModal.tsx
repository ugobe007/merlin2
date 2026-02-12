/**
 * TrueQuoteFinancialModal.tsx
 * ===========================
 * 
 * TrueQuote™ Financial Summary popup — reuses the proven financialProjections.ts
 * service from V6's TrueQuoteVerifyBadge Financials tab.
 * 
 * Shows: 10-year financial projection with summary cards, year-by-year cash flow,
 * key assumptions, and sensitivity analysis.
 * 
 * @version 1.0.0
 * @date February 2026
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Info,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import {
  calculateFinancialProjection,
  formatProjectionForDisplay,
  runSensitivityAnalysis,
  type FinancialInputs,
} from "@/services/financialProjections";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrueQuoteFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;

  /** Total upfront investment (before ITC) */
  totalInvestment: number;
  /** Federal ITC amount */
  federalITC: number;
  /** Net cost after ITC */
  netInvestment: number;
  /** Year 1 annual savings */
  annualSavings: number;

  /** Optional: BESS capacity in kWh */
  bessKWh?: number;
  /** Optional: Solar capacity in kW */
  solarKW?: number;

  /** Optional: Industry name for display */
  industry?: string;
  /** Optional: Location for display */
  location?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TrueQuoteFinancialModal({
  isOpen,
  onClose,
  totalInvestment,
  federalITC,
  netInvestment,
  annualSavings,
  bessKWh,
  solarKW,
  industry,
  location,
}: TrueQuoteFinancialModalProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
      document.body.style.overflow = "hidden";
    } else {
      setAnimateIn(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Build financial inputs from props
  const financialInputs: FinancialInputs = useMemo(
    () => ({
      totalInvestment,
      federalITC,
      netInvestment,
      annualSavings,
      bessKWh,
      solarKW,
    }),
    [totalInvestment, federalITC, netInvestment, annualSavings, bessKWh, solarKW]
  );

  // 10-year projection
  const projection = useMemo(
    () => calculateFinancialProjection(financialInputs, 10),
    [financialInputs]
  );

  const { summaryCards, yearlyTable } = useMemo(
    () => formatProjectionForDisplay(projection),
    [projection]
  );

  // Sensitivity analysis (lazy)
  const sensitivity = useMemo(
    () => (showSensitivity ? runSensitivityAnalysis(financialInputs) : []),
    [financialInputs, showSensitivity]
  );

  if (!isOpen) return null;

  const fmtUSD = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col 
          bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900
          border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20
          transition-all duration-500 overflow-hidden
          ${animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"}`}
      >
        {/* ═══ HEADER ═══ */}
        <div className="relative px-8 pt-6 pb-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/40 to-indigo-900/30 flex-shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-emerald-500/20 border border-purple-500/30">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                TrueQuote™ Financial Projection
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                10-year cash flow analysis with degradation, escalation, and present value
                {industry && ` • ${industry}`}
                {location && ` • ${location}`}
              </p>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-slate-500">Investment</span>
              <span className="text-white font-bold ml-2">{fmtUSD(totalInvestment)}</span>
            </div>
            <div>
              <span className="text-slate-500">ITC</span>
              <span className="text-emerald-400 font-bold ml-2">-{fmtUSD(federalITC)}</span>
            </div>
            <div>
              <span className="text-slate-500">Net Cost</span>
              <span className="text-white font-bold ml-2">{fmtUSD(netInvestment)}</span>
            </div>
            <div>
              <span className="text-slate-500">Yr 1 Savings</span>
              <span className="text-emerald-400 font-bold ml-2">{fmtUSD(annualSavings)}</span>
            </div>
          </div>
        </div>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {summaryCards.map((card, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20"
              >
                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                {card.subtext && <p className="text-xs text-slate-500">{card.subtext}</p>}
              </div>
            ))}
          </div>

          {/* Year-by-Year Cash Flow Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              Year-by-Year Cash Flow
            </h3>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Annual Savings
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Cumulative
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {yearlyTable.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          row.status.includes("Profit")
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                            : "hover:bg-white/5"
                        }
                      >
                        <td className="px-4 py-3 text-sm font-medium text-white">Year {row.year}</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-300">{row.savings}</td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-semibold ${
                            row.cumulative.startsWith("+") ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {row.cumulative}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              row.status.includes("Profit")
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/5 text-slate-400"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Key Assumptions */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Key Assumptions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-400">
              <div>
                <span className="text-slate-500">Electricity Escalation:</span>
                <span className="text-white ml-1">3%/year</span>
              </div>
              <div>
                <span className="text-slate-500">Discount Rate:</span>
                <span className="text-white ml-1">8%</span>
              </div>
              <div>
                <span className="text-slate-500">Battery Degradation:</span>
                <span className="text-white ml-1">2%/year</span>
              </div>
              <div>
                <span className="text-slate-500">Solar Degradation:</span>
                <span className="text-white ml-1">0.5%/year</span>
              </div>
            </div>
          </div>

          {/* Sensitivity Analysis (expandable) */}
          <button
            onClick={() => setShowSensitivity(!showSensitivity)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-purple-300">
              <BarChart3 className="w-4 h-4" />
              Sensitivity Analysis
            </span>
            {showSensitivity ? (
              <ChevronUp className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {showSensitivity && sensitivity.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                      Scenario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                      Payback
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                      NPV
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                      IRR
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {sensitivity.map((row, i) => (
                    <tr key={i} className={i === 0 ? "bg-purple-500/5" : "hover:bg-white/5"}>
                      <td className="px-4 py-3 text-sm text-slate-300 font-medium">{row.scenario}</td>
                      <td className="px-4 py-3 text-sm text-right text-white">
                        {row.paybackYears.toFixed(1)} yr
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-white">{fmtUSD(row.npv)}</td>
                      <td className="px-4 py-3 text-sm text-right text-white">{row.irr}%</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-400">{row.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-8 py-4 flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-purple-900/30 border-t border-purple-500/20 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4" />
            <span>TrueQuote™ Verified • Generated {new Date().toLocaleString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
