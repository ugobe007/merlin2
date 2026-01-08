import React, { useState, useEffect } from "react";
import {
  calculateAdvancedFinancialMetrics,
  type AdvancedFinancialMetrics,
  type FinancialCalculationInput,
} from "../services/centralizedCalculations";

interface ProfessionalFinancialModelingProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
    quoteName: string;
    powerMW: number;
    durationHours: number;
    totalCapEx: number;
    annualSavings: number;
    electricityRate?: number;
    location?: string;
    batteryLifeYears?: number;
    discountRate?: number;
  };
  userTier?: "free" | "professional" | "enterprise"; // For freemium gating
  onUpgradeClick?: () => void; // Callback when user clicks upgrade
}

type TabType = "basic" | "sensitivity" | "risk" | "scenarios";

const ProfessionalFinancialModeling: React.FC<ProfessionalFinancialModelingProps> = ({
  isOpen,
  onClose,
  projectData,
  userTier = "free",
  onUpgradeClick,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedFinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaidUser = userTier === "professional" || userTier === "enterprise";

  // Fetch advanced metrics when modal opens
  useEffect(() => {
    if (isOpen && !advancedMetrics) {
      fetchAdvancedMetrics();
    }
  }, [isOpen]);

  const fetchAdvancedMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const input: FinancialCalculationInput = {
        storageSizeMW: projectData.powerMW,
        durationHours: projectData.durationHours,
        location: projectData.location || "United States",
        electricityRate: projectData.electricityRate || 0.12,
        equipmentCost: projectData.totalCapEx,
        projectLifetimeYears: projectData.batteryLifeYears || 25,
        discountRate: projectData.discountRate || 0.08,
        priceEscalationRate: 0.02,
        includeNPV: true,
      };

      const options = {
        includeMIRR: true,
        includeSensitivity: isPaidUser, // Free users get preview only
        includeRiskAnalysis: isPaidUser,
        includeScenarios: true, // Always include for preview
        numMonteCarloSims: isPaidUser ? 1000 : 100, // Reduced for free users
        sensitivityParameters: [
          "electricityRate",
          "storageSizeMW",
          "discountRate",
          "projectLifetimeYears",
        ],
      };

      const metrics = await calculateAdvancedFinancialMetrics(input, options);
      setAdvancedMetrics(metrics);
    } catch (err) {
      console.error("Error calculating advanced metrics:", err);
      setError("Failed to calculate advanced financial metrics");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl">🎓</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">Professional Financial Modeling</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    {projectData.quoteName} • {projectData.powerMW}MW / {projectData.durationHours}
                    hr
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-purple-200 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tier indicator for free users */}
            {!isPaidUser && (
              <div className="mt-4 bg-purple-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-300 text-xl">✨</span>
                  <span className="text-white font-medium">You're viewing a preview</span>
                </div>
                <button
                  onClick={onUpgradeClick}
                  className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold px-6 py-2 rounded-lg transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50 px-8">
            <TabButton
              icon="📊"
              label="Basic Metrics"
              active={activeTab === "basic"}
              onClick={() => setActiveTab("basic")}
              locked={false}
            />
            <TabButton
              icon="📈"
              label="Sensitivity Analysis"
              active={activeTab === "sensitivity"}
              onClick={() => setActiveTab("sensitivity")}
              locked={!isPaidUser}
            />
            <TabButton
              icon="🎲"
              label="Risk Analysis"
              active={activeTab === "risk"}
              onClick={() => setActiveTab("risk")}
              locked={!isPaidUser}
            />
            <TabButton
              icon="🔮"
              label="Scenarios"
              active={activeTab === "scenarios"}
              onClick={() => setActiveTab("scenarios")}
              locked={false}
            />
          </div>

          {/* Tab Content */}
          <div className="px-8 py-6 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : advancedMetrics ? (
              <>
                {activeTab === "basic" && <BasicMetricsTab metrics={advancedMetrics} />}
                {activeTab === "sensitivity" && (
                  <SensitivityTab
                    analysis={advancedMetrics.sensitivityAnalysis}
                    isPaidUser={isPaidUser}
                    onUpgradeClick={onUpgradeClick}
                  />
                )}
                {activeTab === "risk" && (
                  <RiskAnalysisTab
                    analysis={advancedMetrics.riskAnalysis}
                    isPaidUser={isPaidUser}
                    onUpgradeClick={onUpgradeClick}
                  />
                )}
                {activeTab === "scenarios" && (
                  <ScenariosTab
                    analysis={advancedMetrics.scenarioAnalysis}
                    isPaidUser={isPaidUser}
                    onUpgradeClick={onUpgradeClick}
                  />
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Powered by centralizedCalculations.ts • Database-driven formulas
            </div>
            <div className="flex space-x-3">
              {isPaidUser && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Export Report (PDF)
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface TabButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  locked: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, active, onClick, locked }) => (
  <button
    onClick={onClick}
    disabled={locked}
    className={`
      relative px-6 py-4 font-medium transition-all border-b-2 flex items-center space-x-2
      ${
        active
          ? "border-purple-600 text-purple-600 bg-white"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }
      ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>
    {locked && (
      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
        PRO
      </span>
    )}
  </button>
);

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
    <p className="text-gray-600 font-medium">Calculating advanced financial metrics...</p>
    <p className="text-gray-400 text-sm mt-2">Running Monte Carlo simulations</p>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <span className="text-6xl mb-4">⚠️</span>
    <p className="text-red-600 font-medium">{message}</p>
  </div>
);

// ============================================
// BASIC METRICS TAB
// ============================================

interface BasicMetricsTabProps {
  metrics: AdvancedFinancialMetrics;
}

const BasicMetricsTab: React.FC<BasicMetricsTabProps> = ({ metrics }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Net Present Value"
          value={formatCurrency(metrics.npv || 0)}
          icon="💰"
          trend={metrics.npv && metrics.npv > 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Internal Rate of Return"
          value={formatPercent(metrics.irr || 0)}
          icon="📈"
          trend="positive"
        />
        <MetricCard
          label="Modified IRR (MIRR)"
          value={formatPercent(metrics.mirr || 0)}
          icon="🎯"
          subtitle="More realistic than IRR"
        />
        <MetricCard
          label="Payback Period"
          value={`${metrics.paybackYears.toFixed(1)} years`}
          icon="⏱️"
        />
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-bold text-lg text-blue-900 mb-4">📊 Financial Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Project Cost</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(metrics.totalProjectCost)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Annual Savings</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(metrics.annualSavings)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">25-Year ROI</p>
            <p className="text-xl font-bold text-purple-600">{formatPercent(metrics.roi25Year)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Levelized Cost of Storage</p>
            <p className="text-xl font-bold text-indigo-600">
              {metrics.levelizedCostOfStorage
                ? `$${metrics.levelizedCostOfStorage.toFixed(2)}/MWh`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {metrics.degradationProfile && (
        <div className="bg-amber-50 rounded-lg p-6">
          <h3 className="font-bold text-lg text-amber-900 mb-4">🔋 Battery Degradation Profile</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Effective Life</p>
              <p className="text-xl font-bold text-gray-900">
                {metrics.degradationProfile.effectiveLifeYears} years
              </p>
              <p className="text-xs text-gray-500 mt-1">Until 80% capacity</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Degradation</p>
              <p className="text-xl font-bold text-amber-600">
                {formatPercent(metrics.degradationProfile.averageAnnualDegradation)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year 10 Capacity</p>
              <p className="text-xl font-bold text-green-600">
                {formatPercent(metrics.degradationProfile.yearlyCapacityRetention[10])}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SENSITIVITY ANALYSIS TAB
// ============================================

interface SensitivityTabProps {
  analysis: any;
  isPaidUser: boolean;
  onUpgradeClick?: () => void;
}

const SensitivityTab: React.FC<SensitivityTabProps> = ({
  analysis,
  isPaidUser,
  onUpgradeClick,
}) => {
  if (!isPaidUser) {
    return (
      <FreemiumPreview
        title="Sensitivity Analysis Preview"
        description="See how changes in key parameters affect your project's NPV and IRR"
        features={[
          "Interactive tornado chart showing parameter impacts",
          "Test parameter variations with live updates",
          "Identify which factors matter most for your project",
          "Export sensitivity reports to PDF/Excel",
        ]}
        previewImage="📈"
        onUpgradeClick={onUpgradeClick}
      />
    );
  }

  if (!analysis) {
    return <div className="text-center py-10 text-gray-500">No sensitivity analysis available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="font-bold text-lg text-indigo-900 mb-4">🎯 Most Sensitive Parameters</h3>
        <div className="space-y-3">
          {analysis.tornadoChart.map((item: any, index: number) => (
            <div key={item.parameter} className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.parameterLabel}</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className={`h-3 rounded-full ${
                      item.direction === "positive" ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (item.impact / analysis.tornadoChart[0].impact) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">NPV Impact</p>
                <p className="font-bold text-gray-900">${(item.impact / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">📊 Parameter Details</h3>
        <div className="space-y-4">
          {Object.entries(analysis.parameters).map(([key, data]: [string, any]) => (
            <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
              <p className="font-medium text-gray-800 mb-2">{formatParameterLabel(key)}</p>
              <p className="text-sm text-gray-600">
                Base value: <span className="font-mono">{data.baseValue.toFixed(3)}</span>
              </p>
              <p className="text-sm text-gray-600">
                Elasticity: <span className="font-mono">{data.elasticity.toFixed(2)}</span>
                <span className="text-xs text-gray-400 ml-2">
                  (% change in NPV per % change in parameter)
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// RISK ANALYSIS TAB
// ============================================

interface RiskAnalysisTabProps {
  analysis: any;
  isPaidUser: boolean;
  onUpgradeClick?: () => void;
}

const RiskAnalysisTab: React.FC<RiskAnalysisTabProps> = ({
  analysis,
  isPaidUser,
  onUpgradeClick,
}) => {
  if (!isPaidUser) {
    return (
      <FreemiumPreview
        title="Risk Analysis Preview"
        description="Monte Carlo simulation with 1,000 scenarios to quantify project risk"
        features={[
          "Probability distribution of NPV outcomes",
          "Value at Risk (VaR) at 95% and 99% confidence",
          "Probability of investment success",
          "Best/worst case scenario analysis",
          "Expected shortfall calculations",
        ]}
        previewImage="🎲"
        onUpgradeClick={onUpgradeClick}
      />
    );
  }

  if (!analysis) {
    return <div className="text-center py-10 text-gray-500">No risk analysis available</div>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Success Probability */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <h3 className="font-bold text-lg text-emerald-900 mb-4">✅ Probability of Success</h3>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-emerald-600">
              {(analysis.probabilityOfSuccess * 100).toFixed(1)}%
            </div>
            <p className="text-gray-600 mt-2">Chance of positive NPV</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Mean NPV</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(analysis.statistics.meanNPV)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Median NPV</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(analysis.statistics.medianNPV)}
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Standard Deviation</p>
          <p className="text-2xl font-bold text-amber-900">
            {formatCurrency(analysis.statistics.stdDevNPV)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Coefficient of Variation</p>
          <p className="text-2xl font-bold text-red-900">
            {(analysis.statistics.coefficientOfVariation * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Value at Risk */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h3 className="font-bold text-lg text-red-900 mb-4">⚠️ Value at Risk (VaR)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">VaR (95%)</p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(analysis.valueAtRisk.var95)}
            </p>
            <p className="text-xs text-gray-500 mt-1">5% chance of worse outcome</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">VaR (99%)</p>
            <p className="text-xl font-bold text-red-800">
              {formatCurrency(analysis.valueAtRisk.var99)}
            </p>
            <p className="text-xs text-gray-500 mt-1">1% chance of worse outcome</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Expected Shortfall</p>
            <p className="text-xl font-bold text-red-900">
              {formatCurrency(analysis.valueAtRisk.expectedShortfall)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Average of worst 5%</p>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">📊 Best/Worst Cases</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Best Case</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(analysis.scenarios.best.npv)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              IRR: {(analysis.scenarios.best.irr * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Median Case</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(analysis.scenarios.median.npv)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              IRR: {(analysis.scenarios.median.irr * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Worst Case</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(analysis.scenarios.worst.npv)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              IRR: {(analysis.scenarios.worst.irr * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SCENARIOS TAB
// ============================================

interface ScenariosTabProps {
  analysis: any;
  isPaidUser: boolean;
  onUpgradeClick?: () => void;
}

const ScenariosTab: React.FC<ScenariosTabProps> = ({ analysis, isPaidUser, onUpgradeClick }) => {
  if (!analysis) {
    return <div className="text-center py-10 text-gray-500">No scenario analysis available</div>;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {!isPaidUser && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-medium text-gray-900">Preview Mode</p>
              <p className="text-sm text-gray-600">
                Upgrade to edit assumptions and run custom scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg"
          >
            Upgrade
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Optimistic Scenario */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">🚀</span>
            <h3 className="font-bold text-lg text-green-900">Optimistic</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">NPV</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(analysis.optimistic.npv)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IRR</p>
              <p className="text-xl font-bold text-green-600">
                {formatPercent(analysis.optimistic.irr)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payback</p>
              <p className="text-lg font-bold text-green-600">
                {analysis.optimistic.paybackYears.toFixed(1)} years
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-xs font-medium text-green-900 mb-2">Assumptions:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              {analysis.optimistic.assumptions.map((assumption: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Base Scenario */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">📊</span>
            <h3 className="font-bold text-lg text-blue-900">Base Case</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">NPV</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(analysis.base.npv)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IRR</p>
              <p className="text-xl font-bold text-blue-600">{formatPercent(analysis.base.irr)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payback</p>
              <p className="text-lg font-bold text-blue-600">
                {analysis.base.paybackYears.toFixed(1)} years
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs font-medium text-blue-900 mb-2">Assumptions:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              {analysis.base.assumptions.map((assumption: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-blue-500 mr-1">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pessimistic Scenario */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">⚠️</span>
            <h3 className="font-bold text-lg text-red-900">Pessimistic</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">NPV</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(analysis.pessimistic.npv)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IRR</p>
              <p className="text-xl font-bold text-red-600">
                {formatPercent(analysis.pessimistic.irr)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payback</p>
              <p className="text-lg font-bold text-red-600">
                {analysis.pessimistic.paybackYears.toFixed(1)} years
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-xs font-medium text-red-900 mb-2">Assumptions:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              {analysis.pessimistic.assumptions.map((assumption: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-red-500 mr-1">•</span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">📏 Scenario Comparison</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">NPV Range</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(analysis.comparisons.npvSpread)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Optimistic - Pessimistic</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">IRR Range</p>
            <p className="text-xl font-bold text-gray-900">
              {formatPercent(analysis.comparisons.irrSpread)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Optimistic - Pessimistic</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Payback Range</p>
            <p className="text-xl font-bold text-gray-900">
              {analysis.comparisons.paybackSpread.toFixed(1)} years
            </p>
            <p className="text-xs text-gray-500 mt-1">Pessimistic - Optimistic</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HELPER COMPONENTS
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: "positive" | "negative";
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, trend, subtitle }) => (
  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
    <p
      className={`text-2xl font-bold ${
        trend === "positive"
          ? "text-green-600"
          : trend === "negative"
            ? "text-red-600"
            : "text-gray-900"
      }`}
    >
      {value}
    </p>
    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

interface FreemiumPreviewProps {
  title: string;
  description: string;
  features: string[];
  previewImage: string;
  onUpgradeClick?: () => void;
}

const FreemiumPreview: React.FC<FreemiumPreviewProps> = ({
  title,
  description,
  features,
  previewImage,
  onUpgradeClick,
}) => (
  <div className="relative">
    {/* Blurred background */}
    <div className="filter blur-sm opacity-50 pointer-events-none">
      <div className="bg-gray-100 rounded-lg p-20 text-center">
        <span className="text-9xl">{previewImage}</span>
      </div>
    </div>

    {/* Upgrade CTA overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg border-4 border-purple-300">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🎓</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{description}</p>

          <div className="bg-purple-50 rounded-lg p-4 mb-6 text-left">
            <p className="font-medium text-purple-900 mb-3">Unlock Professional Features:</p>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm text-gray-700">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onUpgradeClick}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transition-all transform hover:scale-105"
          >
            Upgrade to Professional
          </button>

          <p className="text-xs text-gray-500 mt-4">Starting at $99/month • Cancel anytime</p>
        </div>
      </div>
    </div>
  </div>
);

// Helper function for parameter labels
function formatParameterLabel(paramName: string): string {
  const labels: Record<string, string> = {
    electricityRate: "Electricity Rate",
    storageSizeMW: "Storage Size",
    discountRate: "Discount Rate",
    projectLifetimeYears: "Project Lifetime",
    priceEscalationRate: "Price Escalation",
  };
  return labels[paramName] || paramName;
}

export default ProfessionalFinancialModeling;
