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
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(16,185,129,0.1)" }}
          >
            <DollarSign className="w-5 h-5" style={{ color: "#34d399" }} />
          </div>
          Financial Parameters
          <span
            className="text-xs font-normal ml-auto"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Rates & costs for ROI calculation
          </span>
        </h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Utility Rate
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "rgba(16,185,129,0.6)" }}
              >
                $
              </span>
              <input
                type="number"
                value={utilityRate}
                onChange={(e) => setUtilityRate(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-full pl-7 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                /kWh
              </span>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Demand Charge
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "rgba(16,185,129,0.6)" }}
              >
                $
              </span>
              <input
                type="number"
                value={demandCharge}
                onChange={(e) => setDemandCharge(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                /kW
              </span>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Cycles / Year
            </label>
            <div className="relative">
              <input
                type="number"
                value={cyclesPerYear}
                onChange={(e) => setCyclesPerYear(parseFloat(e.target.value) || 1)}
                className="w-full px-3 pr-14 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                cyc/yr
              </span>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Warranty
            </label>
            <div className="relative">
              <input
                type="number"
                value={warrantyYears}
                onChange={(e) => setWarrantyYears(parseFloat(e.target.value) || 10)}
                className="w-full px-3 pr-12 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
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

        {/* Advanced Financials Link */}
        <div
          className="mt-6 p-4 rounded-xl"
          style={{
            background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5" style={{ color: "#34d399" }} />
              <div>
                <p className="text-sm font-semibold text-white">
                  Need Bank-Ready Financials?
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  3-Statement Model, DSCR, IRR, MACRS, Revenue Stacking
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode("professional-model")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#34d399",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              Open Pro Model
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
