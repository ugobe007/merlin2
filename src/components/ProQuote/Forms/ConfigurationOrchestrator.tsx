/**
 * CONFIGURATION ORCHESTRATOR - PROQUOTE FINAL SECTIONS
 *
 * Contains bottom sections of custom config view:
 * - ProQuote Badge + Financial Summary panel
 * - System Summary (MW/MWh, cost, application)
 * - Action buttons (back, generate quote)
 * - Configuration guidelines help section
 *
 * Phase 1G Part 2c Operation 6 - Final extraction
 */

import badgeIcon from "@/assets/images/badge_icon.jpg";

interface ConfigurationOrchestratorProps {
  // Financial data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  financialMetrics: any;
  isCalculating: boolean;
  localSystemCost: number;
  estimatedAnnualSavings: number;
  paybackYears: number;

  // System specs
  storageSizeMW: number;
  storageSizeMWh: number;
  durationHours: number;
  applicationType: string;
  useCase: string;

  // Project metadata
  projectName: string;
  location: string;
  chemistry: string;
  installationType: string;
  gridConnection: string;
  inverterEfficiency: number;
  roundTripEfficiency: number;
  cyclesPerYear: number;
  utilityRate: number;
  demandCharge: number;
  warrantyYears: number;

  // Actions
  setShowFinancialSummary: (show: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setViewMode: (mode: any) => void;
  onGenerateQuote?: () => void;
  onClose: () => void;
}

export default function ConfigurationOrchestrator({
  financialMetrics,
  isCalculating,
  localSystemCost,
  estimatedAnnualSavings,
  paybackYears,
  storageSizeMW,
  storageSizeMWh,
  durationHours,
  applicationType,
  useCase,
  projectName,
  location,
  chemistry,
  installationType,
  gridConnection,
  inverterEfficiency,
  roundTripEfficiency,
  cyclesPerYear,
  utilityRate,
  demandCharge,
  warrantyYears,
  setShowFinancialSummary,
  setViewMode,
  onGenerateQuote,
  onClose,
}: ConfigurationOrchestratorProps) {
  return (
    <>
      {/* ProQuote™ Badge + Financial Summary */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(59,130,246,0.04)",
          border: "1px solid rgba(59,130,246,0.12)",
        }}
      >
        {/* Badge row */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src={badgeIcon}
            alt="ProQuote"
            className="w-10 h-10 object-contain"
            style={{ filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.35))" }}
          />
          <div>
            <span className="text-base font-bold text-white tracking-tight">ProQuote™</span>
            <span
              className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(59,130,246,0.2)",
                color: "rgb(147,197,253)",
              }}
            >
              VERIFIED
            </span>
          </div>
        </div>

        {/* Financial metrics strip */}
        {financialMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Gross Cost */}
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Total Investment
              </p>
              <p className="text-xl font-bold text-white">
                {localSystemCost >= 1_000_000
                  ? `$${(localSystemCost / 1_000_000).toFixed(2)}M`
                  : `$${(localSystemCost / 1_000).toFixed(0)}K`}
              </p>
            </div>
            {/* ITC Credit */}
            {(financialMetrics.taxCredit ?? 0) > 0 && (
              <div>
                <p
                  className="text-[11px] font-medium uppercase tracking-wider mb-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Federal ITC (30%)
                </p>
                <p className="text-xl font-bold text-emerald-400">
                  −
                  {financialMetrics.taxCredit >= 1_000_000
                    ? `$${(financialMetrics.taxCredit / 1_000_000).toFixed(2)}M`
                    : `$${(financialMetrics.taxCredit / 1_000).toFixed(0)}K`}
                </p>
              </div>
            )}
            {/* Net Cost */}
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Net Cost
              </p>
              <p className="text-xl font-bold text-blue-400">
                {(financialMetrics.netCost ?? localSystemCost) >= 1_000_000
                  ? `$${((financialMetrics.netCost ?? localSystemCost) / 1_000_000).toFixed(2)}M`
                  : `$${((financialMetrics.netCost ?? localSystemCost) / 1_000).toFixed(0)}K`}
              </p>
            </div>
            {/* Annual Savings */}
            <div>
              <p
                className="text-[11px] font-medium uppercase tracking-wider mb-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Annual Savings
              </p>
              <p className="text-xl font-bold text-emerald-400">
                {estimatedAnnualSavings >= 1_000_000
                  ? `$${(estimatedAnnualSavings / 1_000_000).toFixed(2)}M`
                  : `$${(estimatedAnnualSavings / 1_000).toFixed(0)}K`}
              </p>
            </div>
          </div>
        )}

        {/* Payback + ROI row */}
        {financialMetrics && (
          <div
            className="flex items-center gap-6 mt-4 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Payback
              </span>
              <span className="text-sm font-bold text-white">{paybackYears.toFixed(1)} yrs</span>
            </div>
            {(financialMetrics.npv ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  NPV
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  ${((financialMetrics.npv ?? 0) / 1_000_000).toFixed(1)}M
                </span>
              </div>
            )}
            {(financialMetrics.irr ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  IRR
                </span>
                <span className="text-sm font-bold text-blue-400">
                  {(financialMetrics.irr ?? 0).toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                25yr ROI
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {(financialMetrics.roi25Year ?? 0).toFixed(0)}%
              </span>
            </div>
            <button
              onClick={() => setShowFinancialSummary(true)}
              className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-md transition-colors"
              style={{
                color: "rgb(147,197,253)",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              View Full Breakdown →
            </button>
          </div>
        )}

        {/* Loading state */}
        {!financialMetrics && isCalculating && (
          <div className="flex items-center gap-3 py-4">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Calculating financials…
            </span>
          </div>
        )}
      </div>

      {/* System Summary */}
      <div
        className="rounded-xl p-8"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
          📊 System Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <p className="text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              System Rating
            </p>
            <p className="text-3xl font-bold text-blue-400">{storageSizeMW.toFixed(1)} MW</p>
            <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>
              {storageSizeMWh.toFixed(1)} MWh
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <p className="text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Total Cost
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              ${(localSystemCost / 1000000).toFixed(2)}M
            </p>
            <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
              ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <p className="text-sm mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Application
            </p>
            <p className="text-xl font-bold text-emerald-400 capitalize">{applicationType}</p>
            <p className="text-sm font-bold capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>
              {useCase.replace("-", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={() => setViewMode("landing")}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          ← Back to Tools
        </button>
        <button
          onClick={() => {
            const _configData = {
              projectName,
              location,
              storageSizeMW,
              durationHours,
              storageSizeMWh,
              systemCost: localSystemCost,
              applicationType,
              useCase,
              chemistry,
              installationType,
              gridConnection,
              inverterEfficiency,
              roundTripEfficiency,
              cyclesPerYear,
              utilityRate,
              demandCharge,
              warrantyYears,
            };
            onGenerateQuote?.();
            onClose();
          }}
          className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
          style={{
            background: "transparent",
            color: "#34d399",
            border: "1px solid rgba(16,185,129,0.35)",
          }}
        >
          Generate Detailed Quote →
        </button>
      </div>

      {/* Help Section */}
      <div
        className="mt-8 rounded-xl p-6"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
          💡 Configuration Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-white mb-1">Power & Duration:</p>
            <ul className="space-y-1 ml-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li>• Peak shaving: 0.5-2 MW, 2-4 hrs</li>
              <li>• Backup power: 0.5-5 MW, 4-8 hrs</li>
              <li>• Utility scale: 10-100 MW, 2-4 hrs</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Battery Chemistry:</p>
            <ul className="space-y-1 ml-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li>• LFP: Best for daily cycling, safest</li>
              <li>• NMC: Higher energy density, premium cost</li>
              <li>• LTO: 20,000+ cycles, fastest charge</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
