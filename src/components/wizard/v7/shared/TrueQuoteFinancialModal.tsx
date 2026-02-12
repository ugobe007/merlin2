/**
 * TrueQuoteFinancialModal.tsx
 * ===========================
 *
 * Supabase-style 10-Year Financial Projection modal.
 * Clean dark design, minimal gradients, typographic hierarchy.
 *
 * @version 2.0.0 — Supabase redesign (Feb 2026)
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  Info,
  Shield,
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

export interface TrueQuoteFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalInvestment: number;
  federalITC: number;
  netInvestment: number;
  annualSavings: number;
  bessKWh?: number;
  solarKW?: number;
  industry?: string;
  location?: string;
}

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

  const financialInputs: FinancialInputs = useMemo(
    () => ({ totalInvestment, federalITC, netInvestment, annualSavings, bessKWh, solarKW }),
    [totalInvestment, federalITC, netInvestment, annualSavings, bessKWh, solarKW]
  );

  const projection = useMemo(() => calculateFinancialProjection(financialInputs, 10), [financialInputs]);
  const { summaryCards, yearlyTable } = useMemo(() => formatProjectionForDisplay(projection), [projection]);
  const sensitivity = useMemo(() => (showSensitivity ? runSensitivityAnalysis(financialInputs) : []), [financialInputs, showSensitivity]);

  if (!isOpen) return null;

  const fmtUSD = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toLocaleString()}`;

  const contextLine = [industry, location].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden transition-all duration-500 ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        }`}
        style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* ── HEADER ── */}
        <div className="relative px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Financial Projection</h2>
              <p className="text-xs text-slate-500">
                10-year cash flow with degradation, escalation, and present value
                {contextLine && ` · ${contextLine}`}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 text-sm">
            {[
              { label: "Investment", value: fmtUSD(totalInvestment), color: "text-slate-300" },
              { label: "ITC", value: `-${fmtUSD(federalITC)}`, color: "text-emerald-400" },
              { label: "Net Cost", value: fmtUSD(netInvestment), color: "text-slate-300" },
              { label: "Yr 1 Savings", value: fmtUSD(annualSavings), color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label}>
                <span className="text-slate-600 text-xs">{s.label}</span>
                <span className={`ml-1.5 font-semibold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {summaryCards.map((card, i) => (
              <div
                key={i}
                className="p-4 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[11px] text-slate-500 mb-1 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-white">{card.value}</p>
                {card.subtext && <p className="text-[11px] text-slate-600 mt-0.5">{card.subtext}</p>}
              </div>
            ))}
          </div>

          {/* Year-by-Year Cash Flow Table */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Year-by-Year Cash Flow
            </h3>
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Year", "Annual Savings", "Cumulative", "Status"].map((h, i) => (
                      <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? "text-left" : i === 3 ? "text-center" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearlyTable.map((row, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      className={row.status.includes("Profit") ? "bg-emerald-500/[0.03]" : ""}
                    >
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-300">Year {row.year}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-slate-400">{row.savings}</td>
                      <td className={`px-4 py-2.5 text-sm text-right font-semibold ${row.cumulative.startsWith("+") ? "text-emerald-400" : "text-slate-500"}`}>
                        {row.cumulative}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            row.status.includes("Profit")
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-slate-500 bg-white/5"
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

          {/* Key Assumptions */}
          <div className="p-4 rounded-lg mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Key Assumptions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                ["Electricity Escalation", "3%/year"],
                ["Discount Rate", "8%"],
                ["Battery Degradation", "2%/year"],
                ["Solar Degradation", "0.5%/year"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-slate-600">{label}</span>
                  <span className="text-slate-300 ml-1 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sensitivity Analysis */}
          <button
            onClick={() => setShowSensitivity(!showSensitivity)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Sensitivity Analysis
            </span>
            {showSensitivity ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showSensitivity && sensitivity.length > 0 && (
            <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Scenario", "Payback", "NPV", "IRR", "Change"].map((h, i) => (
                      <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase ${i === 0 ? "text-left" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className={i === 0 ? "bg-emerald-500/[0.03]" : ""}>
                      <td className="px-4 py-2.5 text-sm text-slate-300 font-medium">{row.scenario}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-slate-400">{row.paybackYears.toFixed(1)} yr</td>
                      <td className="px-4 py-2.5 text-sm text-right text-slate-300">{fmtUSD(row.npv)}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-slate-300">{row.irr}%</td>
                      <td className="px-4 py-2.5 text-sm text-right text-slate-500">{row.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-3.5 flex items-center justify-between flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Shield className="w-3.5 h-3.5" />
            <span>TrueQuote™ Verified · {new Date().toLocaleDateString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
