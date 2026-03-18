/**
 * WIZARD V8 — EV CHARGING CONFIGURATION MODAL
 * ============================================================================
 * Allows user to configure EV charging infrastructure (Level 2 and DC Fast Chargers).
 *
 * SSOT Sources:
 * - EV adoption rates: State DMV registration data
 * - Revenue projections: ChargePoint Network averages 2024
 * - Equipment costs: Industry benchmarks (ChargePoint, EVgo)
 * ============================================================================
 */

import React, { useState } from "react";
import { X, Zap, Info, DollarSign, TrendingUp } from "lucide-react";
import type { WizardState } from "../wizardState";

interface Props {
  state: WizardState;
  onSave: (level2Count: number, dcfcCount: number) => void;
  onClose: () => void;
}

const T = {
  accent: "#3ECF8E",
  accentSoft: "rgba(62,207,142,0.10)",
  textPrimary: "rgba(232,235,243,0.98)",
  textSecondary: "rgba(232,235,243,0.64)",
  panel: "rgba(255,255,255,0.03)",
  panelBorder: "rgba(255,255,255,0.08)",
};

// EV adoption rates by state (2024 data)
const EV_ADOPTION_RATES: Record<string, number> = {
  CA: 0.24,
  AZ: 0.12,
  NV: 0.09,
  TX: 0.07,
  FL: 0.06,
  WA: 0.15,
  OR: 0.13,
  CO: 0.11,
  NY: 0.08,
  MA: 0.07,
};

// Charger specs
const LEVEL_2_SPECS = {
  power: 7.2, // kW
  installCost: 5000, // per charger
  monthlyRevenue: 300, // conservative estimate
};

const DCFC_SPECS = {
  power: 50, // kW
  installCost: 60000, // per charger
  monthlyRevenue: 1200, // conservative estimate
};

export default function EVChargingConfigModal({ state, onSave, onClose }: Props) {
  const stateCode = state.location?.state || "CA";
  const evAdoptionRate = EV_ADOPTION_RATES[stateCode] || 0.05;

  const [level2Count, setLevel2Count] = useState(state.level2Chargers || 4);
  const [dcfcCount, setDcfcCount] = useState(state.dcfcChargers || 0);

  // Calculate totals
  const totalPowerKW = level2Count * LEVEL_2_SPECS.power + dcfcCount * DCFC_SPECS.power;
  const totalInstallCost =
    level2Count * LEVEL_2_SPECS.installCost + dcfcCount * DCFC_SPECS.installCost;
  const monthlyRevenue =
    level2Count * LEVEL_2_SPECS.monthlyRevenue + dcfcCount * DCFC_SPECS.monthlyRevenue;
  const annualRevenue = monthlyRevenue * 12;
  const paybackYears = annualRevenue > 0 ? totalInstallCost / annualRevenue : 99;
  const roi5Year =
    annualRevenue > 0 ? ((annualRevenue * 5 - totalInstallCost) / totalInstallCost) * 100 : 0;

  // Calculate revenue breakdown percentages for visual
  const l2RevenuePercent =
    monthlyRevenue > 0 ? ((level2Count * LEVEL_2_SPECS.monthlyRevenue) / monthlyRevenue) * 100 : 0;

  const handleSave = () => {
    onSave(level2Count, dcfcCount);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          backgroundColor: "#0D0D0D",
          border: `1px solid ${T.panelBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{
            backgroundColor: "#0D0D0D",
            borderColor: T.panelBorder,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: T.accentSoft }}>
              <Zap size={24} style={{ color: T.accent }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: T.textPrimary }}>
              Configure EV Charging
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: T.textSecondary }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Merlin's Guidance */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: T.accentSoft,
              borderColor: T.accent,
            }}
          >
            <div className="flex items-start gap-3">
              <Info size={20} style={{ color: T.accent, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: T.accent }}>
                  🧠 MERLIN'S GUIDANCE
                </p>
                <p className="text-sm" style={{ color: T.textPrimary }}>
                  <strong>{stateCode}</strong> has{" "}
                  <strong>{(evAdoptionRate * 100).toFixed(0)}% EV adoption</strong> rate. Your{" "}
                  {state.industry?.replace(/-/g, " ")} location provides ideal dwell time for
                  charging. Level 2 chargers serve daily drivers (2-4 hour sessions). DC Fast
                  Chargers attract highway travelers and fleet vehicles (20-30 min sessions).
                </p>
              </div>
            </div>
          </div>

          {/* Level 2 Chargers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium block" style={{ color: T.textPrimary }}>
                  LEVEL 2 CHARGERS (7.2kW each)
                </label>
                <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
                  Daily drivers, 2-4 hour charging sessions
                </p>
              </div>
              <span className="text-2xl font-bold" style={{ color: T.accent }}>
                {level2Count}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={level2Count}
              onChange={(e) => setLevel2Count(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${T.accent} 0%, ${T.accent} ${(level2Count / 20) * 100}%, rgba(255,255,255,0.1) ${(level2Count / 20) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />

            <div
              className="flex items-center justify-between mt-2 text-xs"
              style={{ color: T.textSecondary }}
            >
              <span>0</span>
              <span>20 MAX</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Install Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${(level2Count * LEVEL_2_SPECS.installCost).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Monthly Revenue</div>
                <div className="font-semibold" style={{ color: T.accent }}>
                  ${(level2Count * LEVEL_2_SPECS.monthlyRevenue).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Total Power</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {level2Count * LEVEL_2_SPECS.power}kW
                </div>
              </div>
            </div>
          </div>

          {/* DC Fast Chargers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium block" style={{ color: T.textPrimary }}>
                  DC FAST CHARGERS (50kW each)
                </label>
                <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
                  Highway travelers, 20-30 min rapid charging
                </p>
              </div>
              <span className="text-2xl font-bold" style={{ color: T.accent }}>
                {dcfcCount}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={dcfcCount}
              onChange={(e) => setDcfcCount(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${T.accent} 0%, ${T.accent} ${(dcfcCount / 10) * 100}%, rgba(255,255,255,0.1) ${(dcfcCount / 10) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />

            <div
              className="flex items-center justify-between mt-2 text-xs"
              style={{ color: T.textSecondary }}
            >
              <span>0</span>
              <span>10 MAX</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Install Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${(dcfcCount * DCFC_SPECS.installCost).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Monthly Revenue</div>
                <div className="font-semibold" style={{ color: T.accent }}>
                  ${(dcfcCount * DCFC_SPECS.monthlyRevenue).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: T.panel }}>
                <div style={{ color: T.textSecondary }}>Total Power</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {dcfcCount * DCFC_SPECS.power}kW
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          {monthlyRevenue > 0 && (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: T.panel,
                borderColor: T.panelBorder,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} style={{ color: T.accent }} />
                <h3 className="font-semibold" style={{ color: T.textPrimary }}>
                  REVENUE BREAKDOWN
                </h3>
              </div>

              <div className="h-3 rounded-full overflow-hidden flex mb-3">
                {level2Count > 0 && (
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: T.accent,
                      width: `${l2RevenuePercent}%`,
                    }}
                  />
                )}
                {dcfcCount > 0 && (
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: "#f59e0b",
                      width: `${100 - l2RevenuePercent}%`,
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: T.accent }} />
                  <div>
                    <div style={{ color: T.textSecondary }}>Level 2</div>
                    <div className="font-semibold" style={{ color: T.textPrimary }}>
                      ${(level2Count * LEVEL_2_SPECS.monthlyRevenue).toLocaleString()}/mo (
                      {l2RevenuePercent.toFixed(0)}%)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
                  <div>
                    <div style={{ color: T.textSecondary }}>DC Fast</div>
                    <div className="font-semibold" style={{ color: T.textPrimary }}>
                      ${(dcfcCount * DCFC_SPECS.monthlyRevenue).toLocaleString()}/mo (
                      {(100 - l2RevenuePercent).toFixed(0)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} style={{ color: T.accent }} />
              <h3 className="font-semibold" style={{ color: T.textPrimary }}>
                FINANCIAL SUMMARY
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div style={{ color: T.textSecondary }}>Total Install Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${totalInstallCost.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Total Power</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {totalPowerKW.toFixed(1)} kW
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Annual Revenue</div>
                <div className="font-semibold" style={{ color: T.accent }}>
                  ${annualRevenue.toLocaleString()}/year
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Simple Payback</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {paybackYears.toFixed(1)} years
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>5-Year ROI</div>
                <div
                  className="font-semibold"
                  style={{ color: roi5Year > 0 ? T.accent : T.textPrimary }}
                >
                  {roi5Year.toFixed(0)}%
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>EV Adoption ({stateCode})</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {(evAdoptionRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Source Attribution */}
          <div
            className="text-xs p-3 rounded border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
              color: T.textSecondary,
            }}
          >
            📊 <strong>Sources:</strong> State DMV EV registrations 2024, ChargePoint Network
            revenue averages, EVgo equipment costs
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 p-6 border-t flex items-center justify-end gap-3"
          style={{
            backgroundColor: "#0D0D0D",
            borderColor: T.panelBorder,
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              color: T.textSecondary,
              backgroundColor: T.panel,
              border: `1px solid ${T.panelBorder}`,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg font-medium transition-all"
            style={{
              color: "#0D0D0D",
              backgroundColor: T.accent,
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
