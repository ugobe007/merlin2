/**
 * Financial Parameters Section
 * Phase 1G Part 2c Operation 4 (Feb 2026)
 *
 * Financial rates and costs for ROI calculation
 * Extracted from AdvancedQuoteBuilder.tsx (~196 lines)
 *
 * Features:
 * - Utility rate input ($/kWh) with currency formatting
 * - Demand charge input ($/kW) with currency formatting
 * - Annual cycles input (cyc/yr)
 * - Warranty period input (years)
 * - Advanced financials CTA button
 * - Professional Model integration
 */

import { DollarSign, Landmark, ArrowRight } from "lucide-react";
import type { ViewMode } from "@/hooks/useProQuoteState";

export interface FinancialParametersSectionProps {
  utilityRate: number;
  demandCharge: number;
  cyclesPerYear: number;
  warrantyYears: number;
  setUtilityRate: (value: number) => void;
  setDemandCharge: (value: number) => void;
  setCyclesPerYear: (value: number) => void;
  setWarrantyYears: (value: number) => void;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
}

export default function FinancialParametersSection({
  utilityRate,
  demandCharge,
  cyclesPerYear,
  warrantyYears,
  setUtilityRate,
  setDemandCharge,
  setCyclesPerYear,
  setWarrantyYears,
  setViewMode,
}: FinancialParametersSectionProps) {
  return (
    <div
      data-section="financial"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
            <DollarSign className="w-5 h-5" style={{ color: "#34d399" }} />
          </div>
          Financial Parameters
          <span className="text-xs font-normal ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
            Rates & costs for ROI calculation
          </span>
        </h3>
      </div>

      <div className="p-6">
        {/* Helper bar */}
        <p
          className="text-[11px] mb-4 px-3 py-2 rounded-lg"
          style={{
            background: "rgba(52,211,153,0.05)",
            border: "1px solid rgba(52,211,153,0.12)",
            color: "rgba(52,211,153,0.7)",
          }}
        >
          ℹ️&nbsp; Initial values are set from your location’s utility data. Adjust any field to
          match your actual rates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Utility Rate */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Utility Rate
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Default · $0.12–$0.18 / kWh commercial
            </p>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "rgba(52,211,153,0.6)" }}
              >
                $
              </span>
              <input
                type="number"
                value={utilityRate}
                onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-full pl-7 pr-14 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                /kWh
              </span>
            </div>
          </div>

          {/* Demand Charge */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Demand Charge
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Default · $10–$20 / kW per month
            </p>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "rgba(52,211,153,0.6)" }}
              >
                $
              </span>
              <input
                type="number"
                value={demandCharge}
                onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-12 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                /kW
              </span>
            </div>
          </div>

          {/* Cycles / Year */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Cycles / Year
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Default · 365 (daily cycling) — LFP target
            </p>
            <div className="relative">
              <input
                type="number"
                value={cyclesPerYear}
                onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                className="w-full px-3 pr-16 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                cyc/yr
              </span>
            </div>
          </div>

          {/* Warranty */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Warranty
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Default · 10 yr (LFP min) — 15 yr available
            </p>
            <div className="relative">
              <input
                type="number"
                value={warrantyYears}
                onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 10)}
                className="w-full px-3 pr-14 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                years
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Financials CTA */}
        <div
          className="mt-6 p-4 rounded-xl"
          style={{
            background: "transparent",
            border: "1px solid rgba(34,211,238,0.18)",
            boxShadow: "0 0 16px rgba(34,211,238,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="w-4 h-4" style={{ color: "#67e8f9" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#67e8f9" }}>
                  Need Bank-Ready Financials?
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  3-Statement Model · DSCR · IRR · MACRS · Revenue Stacking
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode("professional-model")}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-150"
              style={{
                background: "transparent",
                border: "1px solid rgba(34,211,238,0.55)",
                color: "#67e8f9",
                boxShadow: "0 0 10px rgba(34,211,238,0.14), inset 0 0 5px rgba(34,211,238,0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34,211,238,0.06)";
                e.currentTarget.style.boxShadow = "0 0 18px rgba(34,211,238,0.24)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow =
                  "0 0 10px rgba(34,211,238,0.14), inset 0 0 5px rgba(34,211,238,0.04)";
              }}
            >
              Open Pro Model
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
