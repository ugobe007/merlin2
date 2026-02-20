/**
 * ProQuoteFinancialModal.tsx
 *
 * Supabase-style financial summary modal for ProQuote™.
 * Mirrors TrueQuoteFinancialModal but tailored for the ProQuote context:
 * shows detailed equipment breakdown, bank-ready metrics, sensitivity analysis.
 *
 * @version 1.0.0 (Feb 2026)
 */

import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  ArrowDown,
  BarChart3,
  DollarSign,
  Clock,
  Percent,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ProQuoteFinancialData {
  // Equipment costs
  equipmentBreakdown?: {
    label: string;
    cost: number;
    notes?: string;
  }[];
  totalEquipmentCost?: number;
  installationCost?: number;
  totalProjectCost?: number;

  // Financial metrics
  netCost?: number;
  itcCredit?: number;
  itcRate?: number;
  annualSavings?: number;
  paybackYears?: number;
  npv?: number;
  irr?: number;
  roi25Year?: number;
  lcoe?: number;

  // Cash flow
  cashFlowProjection?: {
    year: number;
    savings: number;
    cumulative: number;
  }[];

  // Sensitivity
  sensitivity?: {
    variable: string;
    low: number;
    base: number;
    high: number;
    unit: string;
  }[];
}

interface ProQuoteFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProQuoteFinancialData;
  systemLabel?: string;
}

function fmtM(val: number | undefined): string {
  if (val == null) return "—";
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function fmtPct(val: number | undefined): string {
  if (val == null) return "—";
  return `${(val * 100).toFixed(1)}%`;
}

export default function ProQuoteFinancialModal({
  isOpen,
  onClose,
  data,
  systemLabel,
}: ProQuoteFinancialModalProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setAnimateIn(true), 50);
    else setAnimateIn(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const metrics = [
    { label: "NPV", value: fmtM(data.npv), icon: TrendingUp, positive: data.npv != null && data.npv > 0 },
    { label: "IRR", value: data.irr != null ? `${(data.irr * 100).toFixed(1)}%` : "—", icon: Percent, positive: data.irr != null && data.irr > 0.08 },
    { label: "Payback", value: data.paybackYears != null ? `${data.paybackYears.toFixed(1)} yrs` : "—", icon: Clock, positive: data.paybackYears != null && data.paybackYears < 10 },
    { label: "25-Year ROI", value: data.roi25Year != null ? `${(data.roi25Year * 100).toFixed(0)}%` : "—", icon: BarChart3, positive: data.roi25Year != null && data.roi25Year > 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                ProQuote™ <span className="text-amber-400">Financial Summary</span>
              </h2>
              <p className="text-sm text-slate-500">
                {systemLabel || "BESS Project"} · Bank-ready metrics
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {metrics.map((m, i) => (
              <div
                key={i}
                className="p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500">{m.label}</span>
                </div>
                <span className={`text-sm font-semibold ${m.positive ? "text-emerald-400" : "text-slate-300"}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white mb-3">Cost Summary</h3>
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span>Item</span>
                <span>Amount</span>
              </div>

              {/* Equipment line */}
              <div
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                onClick={() => setShowEquipment(!showEquipment)}
              >
                <span className="text-sm text-slate-300 flex items-center gap-2">
                  Equipment Cost
                  {data.equipmentBreakdown && data.equipmentBreakdown.length > 0 && (
                    showEquipment
                      ? <ChevronUp className="w-3 h-3 text-slate-500" />
                      : <ChevronDown className="w-3 h-3 text-slate-500" />
                  )}
                </span>
                <span className="text-sm text-slate-300">{fmtM(data.totalEquipmentCost)}</span>
              </div>

              {/* Expanded equipment breakdown */}
              {showEquipment && data.equipmentBreakdown?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-1.5 pl-8"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.01)" }}
                >
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className="text-xs text-slate-500">{fmtM(item.cost)}</span>
                </div>
              ))}

              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-sm text-slate-300">Installation</span>
                <span className="text-sm text-slate-300">{fmtM(data.installationCost)}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-sm font-medium text-white">Total Project Cost</span>
                <span className="text-sm font-medium text-white">{fmtM(data.totalProjectCost)}</span>
              </div>

              {data.itcCredit != null && data.itcCredit > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3" />
                    ITC Credit ({data.itcRate != null ? `${(data.itcRate * 100).toFixed(0)}%` : "30%"})
                  </span>
                  <span className="text-sm text-emerald-400">−{fmtM(data.itcCredit)}</span>
                </div>
              )}

              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
              >
                <span className="text-sm font-semibold text-white">Net Cost (After Incentives)</span>
                <span className="text-sm font-semibold text-amber-400">{fmtM(data.netCost)}</span>
              </div>
            </div>
          </div>

          {/* Cash Flow Table */}
          {data.cashFlowProjection && data.cashFlowProjection.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white mb-3">10-Year Cash Flow</h3>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium text-slate-500" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span>Year</span>
                  <span className="text-right">Annual Savings</span>
                  <span className="text-right">Cumulative</span>
                </div>
                {data.cashFlowProjection.slice(0, 10).map((row) => (
                  <div
                    key={row.year}
                    className="grid grid-cols-3 px-4 py-2 text-sm hover:bg-white/[0.02] transition-colors"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-slate-400">Year {row.year}</span>
                    <span className="text-right text-emerald-400">{fmtM(row.savings)}</span>
                    <span className={`text-right ${row.cumulative >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtM(row.cumulative)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensitivity Analysis */}
          {data.sensitivity && data.sensitivity.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                Sensitivity Analysis
                <span className="text-[10px] text-slate-500 font-normal">(±15% scenario)</span>
              </h3>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="grid grid-cols-4 px-4 py-2 text-xs font-medium text-slate-500" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span>Variable</span>
                  <span className="text-right">Low</span>
                  <span className="text-right">Base</span>
                  <span className="text-right">High</span>
                </div>
                {data.sensitivity.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 px-4 py-2 text-sm"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="text-slate-400">{s.variable}</span>
                    <span className="text-right text-red-400">
                      {s.unit === "$" ? fmtM(s.low) : `${s.low.toFixed(1)}${s.unit}`}
                    </span>
                    <span className="text-right text-slate-300">
                      {s.unit === "$" ? fmtM(s.base) : `${s.base.toFixed(1)}${s.unit}`}
                    </span>
                    <span className="text-right text-emerald-400">
                      {s.unit === "$" ? fmtM(s.high) : `${s.high.toFixed(1)}${s.unit}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank-Ready Notice */}
          <div className="rounded-lg p-4" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-white">Bank-Ready Financial Model</span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  ProQuote financials include 3-statement modeling, DSCR coverage, MACRS depreciation,
                  and IRA 2022 compliant tax credit calculations. Export to Word or Excel for
                  financing applications and investor presentations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
        >
          <span className="text-xs text-slate-600">TrueQuote™ verified · NREL ATB 2024 · IRA 2022</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
