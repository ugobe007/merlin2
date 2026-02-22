/**
 * FinancialSection - Financial parameters and rate inputs
 * Utility rate, demand charge, cycles/year, warranty
 * Includes Bank-Ready Model CTA
 * Part of Custom Config view
 */

import React from "react";
import { DollarSign, Landmark, ArrowRight } from "lucide-react";
import { SectionHeader } from "../../Shared/SectionHeader";

interface FinancialSectionProps {
  utilityRate: number;
  setUtilityRate: (value: number) => void;
  demandCharge: number;
  setDemandCharge: (value: number) => void;
  cyclesPerYear: number;
  setCyclesPerYear: (value: number) => void;
  warrantyYears: number;
  setWarrantyYears: (value: number) => void;
  onOpenProfessionalModel: () => void;
}

export const FinancialSection = React.memo(function FinancialSection({
  utilityRate,
  setUtilityRate,
  demandCharge,
  setDemandCharge,
  cyclesPerYear,
  setCyclesPerYear,
  warrantyYears,
  setWarrantyYears,
  onOpenProfessionalModel,
}: FinancialSectionProps) {
  return (
    <div
      data-section="financial"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <SectionHeader
        icon={DollarSign}
        iconColor="#34d399"
        iconBgColor="rgba(16,185,129,0.1)"
        title="Financial Parameters"
        subtitle="Rates & costs for ROI calculation"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Utility Rate */}
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

          {/* Demand Charge */}
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

          {/* Cycles / Year */}
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

          {/* Warranty */}
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

        {/* Bank-Ready Model CTA */}
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
                <p className="text-sm font-semibold text-white">Need Bank-Ready Financials?</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  3-Statement Model, DSCR, IRR, MACRS, Revenue Stacking
                </p>
              </div>
            </div>
            <button
              onClick={onOpenProfessionalModel}
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
});
