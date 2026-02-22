import React from "react";
import {
  X,
  ArrowLeft,
  Landmark,
  Sliders,
  Calculator,
  FileSpreadsheet,
  Eye,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  Banknote,
} from "lucide-react";
import {
  generateProfessionalModel,
  type ProfessionalModelResult,
} from "@/services/professionalFinancialModel";

/**
 * ProfessionalModelView Component
 *
 * Bank-Ready Financial Model generator and display for BESS projects.
 *
 * Features:
 * - Model configuration (system size, ISO region, leverage, interest rate)
 * - Example output preview (before generation)
 * - Full 3-statement financial model (Income Statement, Balance Sheet, Cash Flow)
 * - Revenue breakdown by stream (arbitrage, frequency regulation, capacity, etc.)
 * - DSCR analysis and debt schedule
 * - Export to Excel/PDF (placeholder buttons)
 *
 * SSOT Compliance:
 * - Uses BESS_MARKET_RATE_2025 = $125/kWh for CapEx estimates
 * - Equity = CapEx × (1 - leverage)
 * - Delegates all financial modeling to professionalFinancialModel.ts
 *
 * @component
 */

interface ProfessionalModelViewProps {
  projectInfo: {
    projectName?: string;
    projectLocation?: string;
    projectGoals?: string;
    projectSchedule?: string;
    userName?: string;
    email?: string;
    userId?: string;
  } | null;
  professionalModel: ProfessionalModelResult | null;
  setProfessionalModel: (model: ProfessionalModelResult | null) => void;
  isGeneratingModel: boolean;
  setIsGeneratingModel: (generating: boolean) => void;
  storageSizeMW: number;
  durationHours: number;
  selectedISORegion: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | "SPP";
  setSelectedISORegion: (
    region: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | "SPP"
  ) => void;
  projectLeverage: number;
  setProjectLeverage: (leverage: number) => void;
  interestRate: number;
  setInterestRate: (rate: number) => void;
  loanTermYears: number;
  location: string;
  utilityRate: number;
  demandCharge: number;
  onClose: () => void;
  onNavigateToLanding: () => void;
}

export const ProfessionalModelView: React.FC<ProfessionalModelViewProps> = ({
  professionalModel,
  setProfessionalModel,
  isGeneratingModel,
  setIsGeneratingModel,
  storageSizeMW,
  durationHours,
  selectedISORegion,
  setSelectedISORegion,
  projectLeverage,
  setProjectLeverage,
  interestRate,
  setInterestRate,
  loanTermYears,
  location,
  utilityRate,
  demandCharge,
  onClose,
  onNavigateToLanding,
}) => {
  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "rgba(15,17,23,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateToLanding}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="h-8 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div
                className="p-2 rounded-lg"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <Landmark className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Bank-Ready Financial Model</h1>
                <p className="text-slate-500 text-xs">
                  Professional 3-Statement Pro-Forma for Investors
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Configuration Panel */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            Model Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* System Size (from parent) */}
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                System Size (MW)
              </label>
              <div
                className="rounded-lg px-4 py-3 text-white font-mono text-lg"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {storageSizeMW.toFixed(2)} MW / {durationHours}h
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {/* SSOT: Unit conversion only (MW × hours × 1000 = kWh) - not pricing */}
                {(storageSizeMW * durationHours * 1000).toLocaleString()} kWh total
              </p>
            </div>

            {/* ISO Region */}
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">ISO Region</label>
              <select
                value={selectedISORegion}
                onChange={(e) => setSelectedISORegion(e.target.value as typeof selectedISORegion)}
                className="w-full rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="CAISO">CAISO (California)</option>
                <option value="ERCOT">ERCOT (Texas)</option>
                <option value="PJM">PJM (Mid-Atlantic)</option>
                <option value="NYISO">NYISO (New York)</option>
                <option value="ISO-NE">ISO-NE (New England)</option>
                <option value="MISO">MISO (Midwest)</option>
                <option value="SPP">SPP (Southwest)</option>
              </select>
            </div>

            {/* Leverage */}
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Debt Ratio: {projectLeverage}%
              </label>
              <input
                type="range"
                min="0"
                max="80"
                value={projectLeverage}
                onChange={(e) => setProjectLeverage(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0% (All Equity)</span>
                <span>80% (Leveraged)</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">
                Interest Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="3"
                  max="15"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Example Output Preview - Shows users what to expect */}
          {!professionalModel && (
            <div
              className="mt-6 rounded-xl p-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                Example Output Preview
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Based on your {storageSizeMW.toFixed(2)} MW / {durationHours}h system, here's an
                estimate of what your Bank-Ready Model will include:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">Est. CapEx</p>
                  {/* SSOT: Using BESS_MARKET_RATE_2025 = $125/kWh from market data */}
                  <p className="text-lg font-bold text-white">
                    ${((storageSizeMW * durationHours * 1000 * 125) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">Est. Equity</p>
                  {/* SSOT: Equity = CapEx × (1 - leverage) */}
                  <p className="text-lg font-bold text-emerald-400">
                    $
                    {(
                      (storageSizeMW * durationHours * 1000 * 125 * (1 - projectLeverage / 100)) /
                      1000000
                    ).toFixed(1)}
                    M
                  </p>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">Target IRR</p>
                  <p className="text-lg font-bold text-emerald-400">12-18%</p>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">DSCR Target</p>
                  <p className="text-lg font-bold text-blue-400">≥1.25x</p>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">Payback</p>
                  <p className="text-lg font-bold text-slate-300">6-10 yrs</p>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500">Project Life</p>
                  <p className="text-lg font-bold text-slate-300">25 yrs</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-white font-semibold text-sm mb-2">📊 3-Statement Model</p>
                  <ul className="text-slate-500 text-xs space-y-1">
                    <li>• Income Statement (25 years)</li>
                    <li>• Balance Sheet</li>
                    <li>• Cash Flow Statement</li>
                  </ul>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-white font-semibold text-sm mb-2">💰 Revenue Stacking</p>
                  <ul className="text-slate-500 text-xs space-y-1">
                    <li>• Energy Arbitrage</li>
                    <li>• Frequency Regulation</li>
                    <li>• Capacity Payments</li>
                  </ul>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-white font-semibold text-sm mb-2">🏦 Bank Metrics</p>
                  <ul className="text-slate-500 text-xs space-y-1">
                    <li>• DSCR Analysis</li>
                    <li>• Levered/Unlevered IRR</li>
                    <li>• MACRS Depreciation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={async () => {
                setIsGeneratingModel(true);
                try {
                  const result = await generateProfessionalModel({
                    storageSizeMW,
                    durationHours,
                    location: location || "California",
                    isoRegion: selectedISORegion,
                    debtEquityRatio: projectLeverage / 100,
                    interestRate: interestRate / 100,
                    loanTermYears,
                    electricityRate: utilityRate,
                    demandChargeRate: demandCharge,
                    revenueStreams: {
                      energyArbitrage: true,
                      demandChargeReduction: true,
                      frequencyRegulation: true,
                      spinningReserve: true,
                      capacityPayments: true,
                      resourceAdequacy: true,
                    },
                  });
                  setProfessionalModel(result);
                } catch (error) {
                  console.error("Error generating model:", error);
                } finally {
                  setIsGeneratingModel(false);
                }
              }}
              disabled={isGeneratingModel}
              className="flex items-center gap-3 font-semibold px-8 py-3.5 rounded-lg transition-all disabled:opacity-50"
              style={{
                background: "transparent",
                color: "#34d399",
                border: "1px solid rgba(16,185,129,0.35)",
              }}
            >
              {isGeneratingModel ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Generating Model...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Generate Bank-Ready Model
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {professionalModel && (
          <div className="space-y-8">
            {/* Executive Summary */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Executive Summary
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Key Metrics */}
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Total CapEx</p>
                  <p className="text-2xl font-bold text-white">
                    ${(professionalModel.summary.totalCapex / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    Equity Investment
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${(professionalModel.summary.equityInvestment / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Levered IRR</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {(professionalModel.summary.leveredIRR * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Unlevered IRR</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {(professionalModel.summary.unleveredIRR * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">NPV (25yr)</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    ${(professionalModel.summary.npv / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">MOIC</p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {professionalModel.summary.moic.toFixed(2)}x
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">LCOS</p>
                  <p className="text-2xl font-bold text-cyan-300">
                    ${professionalModel.summary.lcos.toFixed(0)}/MWh
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Min DSCR</p>
                  <p
                    className={`text-2xl font-bold ${professionalModel.summary.minimumDSCR >= 1.25 ? "text-emerald-300" : "text-red-400"}`}
                  >
                    {professionalModel.summary.minimumDSCR.toFixed(2)}x
                  </p>
                  <p className="text-xs text-slate-500">Target: ≥1.25x</p>
                </div>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Avg DSCR</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {professionalModel.summary.averageDSCR.toFixed(2)}x
                  </p>
                </div>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Simple Payback</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {professionalModel.summary.simplePayback.toFixed(1)} yrs
                  </p>
                </div>
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Y1 Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${(professionalModel.summary.totalAnnualRevenue / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Streams */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Year 1 Revenue Breakdown ({selectedISORegion})
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {professionalModel.revenueProjection?.[0] &&
                  Object.entries(professionalModel.revenueProjection[0])
                    .filter(([key]) => key !== "year" && key !== "totalRevenue")
                    .map(([stream, value]) => (
                      <div
                        key={stream}
                        className="rounded-lg p-4"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <p className="text-xs text-slate-500 capitalize">
                          {stream.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-lg font-bold text-emerald-300">
                          ${typeof value === "number" ? (value / 1000).toFixed(0) : 0}k
                        </p>
                      </div>
                    ))}
              </div>
            </div>

            {/* 3-Statement Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Income Statement */}
              <div
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Income Statement (Y1)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Revenue</span>
                    <span className="font-mono">
                      $
                      {(
                        professionalModel.incomeStatements?.[0]?.totalRevenue / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Operating Costs</span>
                    <span className="font-mono text-red-300">
                      -$
                      {(professionalModel.incomeStatements?.[0]?.totalOpex / 1000000 || 0).toFixed(
                        2
                      )}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300 border-t border-slate-600 pt-2">
                    <span>EBITDA</span>
                    <span className="font-mono text-emerald-300">
                      ${(professionalModel.incomeStatements?.[0]?.ebitda / 1000000 || 0).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Depreciation</span>
                    <span className="font-mono text-slate-400">
                      -$
                      {(
                        professionalModel.incomeStatements?.[0]?.depreciation / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Interest</span>
                    <span className="font-mono text-red-300">
                      -$
                      {(
                        professionalModel.incomeStatements?.[0]?.interestExpense / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                    <span>Net Income</span>
                    <span className="font-mono text-emerald-400">
                      $
                      {(professionalModel.incomeStatements?.[0]?.netIncome / 1000000 || 0).toFixed(
                        2
                      )}
                      M
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance Sheet */}
              <div
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Balance Sheet (Y1)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Assets</span>
                    <span className="font-mono">
                      $
                      {(professionalModel.balanceSheets?.[0]?.totalAssets / 1000000 || 0).toFixed(
                        2
                      )}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Liabilities</span>
                    <span className="font-mono text-red-300">
                      $
                      {(
                        professionalModel.balanceSheets?.[0]?.totalLiabilities / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Equity</span>
                    <span className="font-mono text-blue-300">
                      $
                      {(professionalModel.balanceSheets?.[0]?.totalEquity / 1000000 || 0).toFixed(
                        2
                      )}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                    <span>D/E Ratio</span>
                    <span className="font-mono">
                      {(
                        (professionalModel.balanceSheets?.[0]?.totalLiabilities || 0) /
                        (professionalModel.balanceSheets?.[0]?.totalEquity || 1)
                      ).toFixed(2)}
                      x
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Flow */}
              <div
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Cash Flow (Y1)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Operating CF</span>
                    <span className="font-mono text-emerald-300">
                      $
                      {(
                        professionalModel.cashFlowStatements?.[0]?.operatingCashFlow / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Principal Repayment</span>
                    <span className="font-mono text-red-300">
                      -$
                      {(
                        professionalModel.cashFlowStatements?.[0]?.principalRepayment / 1000000 || 0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>DSCR</span>
                    <span
                      className={`font-mono ${(professionalModel.debtSchedule?.[0]?.dscr || 0) >= 1.25 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {(professionalModel.debtSchedule?.[0]?.dscr || 0).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-600 pt-2">
                    <span>Free Cash Flow</span>
                    <span className="font-mono text-emerald-400">
                      $
                      {(
                        professionalModel.cashFlowStatements?.[0]?.freeCashFlowToEquity / 1000000 ||
                        0
                      ).toFixed(2)}
                      M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DSCR & Debt Schedule Chart (simplified table) */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Debt Service Coverage Ratio (DSCR) by Year
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2">Year</th>
                      {[1, 2, 3, 4, 5, 10, 15, 20, 25].map((y) => (
                        <th key={y} className="text-right py-2">
                          {y}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-white">
                      <td className="py-2 font-medium">DSCR</td>
                      {[0, 1, 2, 3, 4, 9, 14, 19, 24].map((i, idx) => (
                        <td
                          key={idx}
                          className={`text-right py-2 font-mono ${
                            (professionalModel.debtSchedule?.[i]?.dscr || 0) >= 1.25
                              ? "text-emerald-400"
                              : (professionalModel.debtSchedule?.[i]?.dscr || 0) >= 1.0
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {(professionalModel.debtSchedule?.[i]?.dscr || 0).toFixed(2)}x
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <span className="text-emerald-400">●</span> ≥1.25x (Bankable) |
                <span className="text-yellow-400 ml-2">●</span> 1.0-1.25x (Marginal) |
                <span className="text-red-400 ml-2">●</span> &lt;1.0x (Below Threshold)
              </p>
            </div>

            {/* Export Options */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => {
                  // Export to Excel (placeholder)
                  alert(
                    "Excel export coming soon! This will generate a full 25-year financial model workbook."
                  );
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  color: "rgb(52,211,153)",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export to Excel
              </button>
              <button
                onClick={() => {
                  // Export to PDF (placeholder)
                  alert("PDF export coming soon! This will generate a bank-ready investment memo.");
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  color: "rgb(96,165,250)",
                  border: "1px solid rgba(59,130,246,0.3)",
                }}
              >
                <FileText className="w-5 h-5" />
                Export to PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
