/**
 * WIZARD V8 — SOLAR CONFIGURATION MODAL
 * ============================================================================
 * Allows user to configure solar array size with intelligent guidance.
 *
 * SSOT Sources:
 * - solarPhysicalCapKW: getFacilityConstraints() → useCasePowerCalculations.ts
 * - peakSunHours: NREL PVWatts API → wizardAPI.ts
 * - Solar costs: NREL ATB 2024 → unifiedQuoteCalculator.ts
 * ============================================================================
 */

import React, { useState } from "react";
import { X, Sun, Info, Zap } from "lucide-react";
import type { WizardState } from "../wizardState";

interface Props {
  state: WizardState;
  onSave: (solarKW: number) => void;
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

export default function SolarConfigModal({ state, onSave, onClose }: Props) {
  // Get SSOT values from state
  const { solarPhysicalCapKW, peakLoadKW, intel, location } = state;

  // Extract from intel object (with defaults)
  const peakSunHours = intel?.peakSunHours || 4.0;
  const solarGrade = intel?.solarGrade || "B";

  // Estimate annual consumption from peak load (rough approximation)
  const annualConsumption = peakLoadKW * 8760 * 0.6; // 60% capacity factor

  // US state from location
  const usState = location?.state || "CA";

  // Calculate intelligent default based on sun exposure
  // SSOT: NREL PVWatts methodology for sun factor
  const sunFactor = (peakSunHours - 3.0) / 2.5; // Normalized 0-1 for PSH range 3-5.5
  const optimalKW = Math.round((solarPhysicalCapKW * sunFactor * 0.85) / 5) * 5; // 85% utilization, rounded to 5kW

  const [selectedKW, setSelectedKW] = useState(state.solarKW > 0 ? state.solarKW : optimalKW);
  const [installType, setInstallType] = useState<"roof" | "carport">("roof");

  // Financial calculations
  // SSOT: NREL ATB 2024 for equipment costs
  const baseInstallCostPerW = 2.5; // $/W for roof-mounted
  const carportPremium = 0.75; // +$0.75/W for carport/ground-mount
  const installCostPerW =
    installType === "carport" ? baseInstallCostPerW + carportPremium : baseInstallCostPerW;

  const totalInstallCost = selectedKW * 1000 * installCostPerW;

  // SSOT: NREL PVWatts production estimates by grade
  const productionPerKWPerYear =
    solarGrade === "A" || solarGrade === "A-"
      ? 1750
      : solarGrade === "B+" || solarGrade === "B"
        ? 1550
        : solarGrade === "B-" || solarGrade === "C+"
          ? 1400
          : 1300;

  const annualProduction = selectedKW * productionPerKWPerYear;
  const productionCoverage =
    annualConsumption > 0 ? (annualProduction / annualConsumption) * 100 : 0;

  // Financial metrics
  // SSOT: IRS IRA 2022 - 30% Investment Tax Credit
  const federalTaxCredit = totalInstallCost * 0.3;
  const netCost = totalInstallCost - federalTaxCredit;

  // SSOT: Average utility rates by state (EIA 2024)
  const utilityRatePerKWh =
    usState === "CA"
      ? 0.28
      : usState === "AZ"
        ? 0.13
        : usState === "NV"
          ? 0.12
          : usState === "TX"
            ? 0.12
            : 0.14; // Default

  const annualSavings = annualProduction * utilityRatePerKWh;
  const simplePayback = annualSavings > 0 ? netCost / annualSavings : 0;
  const tenYearROI = annualSavings > 0 ? ((annualSavings * 10 - netCost) / netCost) * 100 : 0;

  const handleSave = () => {
    onSave(selectedKW);
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
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${T.accent}20` }}>
              <Sun size={24} style={{ color: T.accent }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: T.textPrimary }}>
                Configure Solar Array
              </h2>
              <p className="text-sm" style={{ color: T.textSecondary }}>
                {solarPhysicalCapKW > 0
                  ? `Roof capacity: ${solarPhysicalCapKW} kW • ${solarGrade} grade (${peakSunHours.toFixed(1)} PSH)`
                  : `Sun quality: ${solarGrade} grade (${peakSunHours.toFixed(1)} PSH) • Limited roof space`}
              </p>
            </div>
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
              backgroundColor: `${T.accent}10`,
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
                  {solarPhysicalCapKW === 0 ? (
                    <>
                      Your facility type typically has <strong>limited roof space</strong> for solar
                      installation. Consider ground-mount or carport options if land is available.
                    </>
                  ) : peakSunHours < 3.5 ? (
                    <>
                      Your location receives{" "}
                      <strong>{peakSunHours.toFixed(1)} peak sun hours</strong> per day (
                      {solarGrade} grade). This is below the recommended 3.5 PSH minimum for
                      cost-effective solar. Consider focusing on storage and demand management
                      instead.
                    </>
                  ) : (
                    <>
                      Your location receives{" "}
                      <strong>{peakSunHours.toFixed(1)} peak sun hours</strong> per day (
                      {solarGrade} grade). Based on your {solarPhysicalCapKW}kW roof capacity and
                      sun exposure, we recommend <strong>{optimalKW}kW</strong> of solar to maximize
                      ROI while staying within physical constraints.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Solar Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: T.textPrimary }}>
                SOLAR ARRAY SIZE (kW)
              </label>
              <span className="text-2xl font-bold" style={{ color: T.accent }}>
                {selectedKW} kW
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={solarPhysicalCapKW}
              step={5}
              value={selectedKW}
              onChange={(e) => setSelectedKW(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${T.accent} 0%, ${T.accent} ${(selectedKW / solarPhysicalCapKW) * 100}%, rgba(255,255,255,0.1) ${(selectedKW / solarPhysicalCapKW) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div
              className="flex items-center justify-between mt-2 text-xs"
              style={{ color: T.textSecondary }}
            >
              <span>0 kW NO SOLAR</span>
              <span
                className="px-2 py-1 rounded"
                style={{ backgroundColor: T.accentSoft, color: T.accent }}
              >
                {optimalKW} kW RECOMMENDED
              </span>
              <span>{solarPhysicalCapKW} kW MAX</span>
            </div>
          </div>

          {/* Installation Type */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: T.textPrimary }}>
              INSTALLATION TYPE
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "roof",
                  name: "Roof-Mounted",
                  costPerW: baseInstallCostPerW,
                  desc: "Standard installation",
                },
                {
                  id: "carport",
                  name: "Carport/Ground",
                  costPerW: baseInstallCostPerW + carportPremium,
                  desc: "+$0.75/W premium",
                },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setInstallType(type.id as "roof" | "carport")}
                  className="p-4 rounded-lg border text-left transition-all"
                  style={{
                    backgroundColor: installType === type.id ? T.accentSoft : T.panel,
                    borderColor: installType === type.id ? T.accent : T.panelBorder,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold" style={{ color: T.textPrimary }}>
                      {type.name}
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: installType === type.id ? T.accent : T.panelBorder }}
                    >
                      {installType === type.id && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: T.accent }}
                        />
                      )}
                    </div>
                  </div>
                  <div
                    className="text-xs px-2 py-0.5 rounded inline-block mb-1"
                    style={{
                      backgroundColor: T.accentSoft,
                      color: T.accent,
                    }}
                  >
                    ${type.costPerW}/W
                  </div>
                  <div className="text-sm" style={{ color: T.textSecondary }}>
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Production & Financial Summary */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={20} style={{ color: T.accent }} />
              <h3 className="font-semibold" style={{ color: T.textPrimary }}>
                PRODUCTION & FINANCIAL SUMMARY
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div style={{ color: T.textSecondary }}>Annual Production</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {Math.round(annualProduction).toLocaleString()} kWh/yr
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Coverage</div>
                <div
                  className="font-semibold"
                  style={{ color: productionCoverage > 100 ? "#f59e0b" : T.textPrimary }}
                >
                  {productionCoverage.toFixed(0)}% of usage
                  {productionCoverage > 100 && " ⚠️"}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Install Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${Math.round(totalInstallCost).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Federal Tax Credit (30%)</div>
                <div className="font-semibold" style={{ color: "#10b981" }}>
                  -${Math.round(federalTaxCredit).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Net Cost</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  ${Math.round(netCost).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Annual Savings</div>
                <div className="font-semibold" style={{ color: "#10b981" }}>
                  ${Math.round(annualSavings).toLocaleString()}/yr
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>Simple Payback</div>
                <div className="font-semibold" style={{ color: T.textPrimary }}>
                  {simplePayback > 0 ? `${simplePayback.toFixed(1)} years` : "N/A"}
                </div>
              </div>
              <div>
                <div style={{ color: T.textSecondary }}>10-Year ROI</div>
                <div
                  className="font-semibold"
                  style={{ color: tenYearROI > 0 ? "#10b981" : T.textPrimary }}
                >
                  {tenYearROI > 0 ? `+${tenYearROI.toFixed(0)}%` : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Warning if over-producing */}
          {productionCoverage > 100 && (
            <div
              className="p-3 rounded border text-sm"
              style={{
                backgroundColor: "rgba(245,158,11,0.10)",
                borderColor: "#f59e0b",
                color: T.textPrimary,
              }}
            >
              ⚠️ <strong>Note:</strong> This solar array will produce more than your annual
              consumption. Consider net metering or battery storage to maximize value.
            </div>
          )}

          {/* Source Attribution */}
          <div
            className="text-xs p-3 rounded border"
            style={{
              backgroundColor: T.panel,
              borderColor: T.panelBorder,
              color: T.textSecondary,
            }}
          >
            📊 <strong>Sources:</strong> NREL ATB 2024 (equipment costs), PVWatts (production), IRS
            IRA 2022 (30% ITC)
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
              backgroundColor: T.panel,
              border: `1px solid ${T.panelBorder}`,
              color: T.textSecondary,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: T.accent,
              color: "#0D0D0D",
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
