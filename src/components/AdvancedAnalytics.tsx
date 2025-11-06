import React, { useState, useMemo } from 'react';

interface AdvancedAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: {
    quoteName: string;
    powerMW: number;
    durationHours: number;
    totalCapEx: number;
    annualSavings: number;
    batteryLifeYears?: number;
    discountRate?: number;
  };
}

interface FinancialMetrics {
  npv: number;
  irr: number;
  paybackPeriod: number;
  roi10Year: number;
  roi20Year: number;
  breakEvenYear: number;
  totalLifetimeSavings: number;
  averageAnnualReturn: number;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [batteryLifeYears, setBatteryLifeYears] = useState(projectData.batteryLifeYears || 15);
  const [discountRate, setDiscountRate] = useState(projectData.discountRate || 0.08);
  const [degradationRate, setDegradationRate] = useState(0.02); // 2% per year
  const [inflationRate, setInflationRate] = useState(0.03); // 3% inflation
  const [operatingCostsPercent, setOperatingCostsPercent] = useState(0.025); // 2.5% O&M

  // Calculate advanced financial metrics
  const metrics = useMemo((): FinancialMetrics => {
    const { totalCapEx, annualSavings } = projectData;
    
    // NPV Calculation with degradation and inflation
    let npv = -totalCapEx;
    let cumulativeCashFlow = -totalCapEx;
    let breakEvenYear = 0;
    let totalSavings = 0;
    
    for (let year = 1; year <= batteryLifeYears; year++) {
      // Degradation reduces savings over time
      const degradationFactor = Math.pow(1 - degradationRate, year - 1);
      // Inflation increases energy costs (benefits BESS)
      const inflationFactor = Math.pow(1 + inflationRate, year - 1);
      // Operating costs
      const operatingCosts = totalCapEx * operatingCostsPercent;
      
      const yearSavings = (annualSavings * degradationFactor * inflationFactor) - operatingCosts;
      const discountFactor = Math.pow(1 + discountRate, year);
      const presentValue = yearSavings / discountFactor;
      
      npv += presentValue;
      cumulativeCashFlow += yearSavings;
      totalSavings += yearSavings;
      
      if (cumulativeCashFlow > 0 && breakEvenYear === 0) {
        breakEvenYear = year;
      }
    }

    // Simple Payback Period
    const paybackPeriod = totalCapEx / annualSavings;

    // IRR Calculation (iterative approximation)
    let irr = 0;
    let testRate = 0.05;
    let increment = 0.01;
    
    for (let i = 0; i < 100; i++) {
      let testNPV = -totalCapEx;
      for (let year = 1; year <= batteryLifeYears; year++) {
        const degradationFactor = Math.pow(1 - degradationRate, year - 1);
        const inflationFactor = Math.pow(1 + inflationRate, year - 1);
        const operatingCosts = totalCapEx * operatingCostsPercent;
        const yearSavings = (annualSavings * degradationFactor * inflationFactor) - operatingCosts;
        testNPV += yearSavings / Math.pow(1 + testRate, year);
      }
      
      if (Math.abs(testNPV) < 1000) {
        irr = testRate;
        break;
      }
      
      if (testNPV > 0) {
        testRate += increment;
      } else {
        testRate -= increment;
        increment /= 2;
      }
    }

    // ROI Calculations
    const savings10Year = calculateTotalSavings(10);
    const roi10Year = ((savings10Year - totalCapEx) / totalCapEx) * 100;
    
    const savings20Year = calculateTotalSavings(20);
    const roi20Year = ((savings20Year - totalCapEx) / totalCapEx) * 100;

    function calculateTotalSavings(years: number): number {
      let total = 0;
      for (let year = 1; year <= years; year++) {
        const degradationFactor = Math.pow(1 - degradationRate, year - 1);
        const inflationFactor = Math.pow(1 + inflationRate, year - 1);
        const operatingCosts = totalCapEx * operatingCostsPercent;
        total += (annualSavings * degradationFactor * inflationFactor) - operatingCosts;
      }
      return total;
    }

    const averageAnnualReturn = (totalSavings / batteryLifeYears / totalCapEx) * 100;

    return {
      npv,
      irr: irr * 100,
      paybackPeriod,
      roi10Year,
      roi20Year,
      breakEvenYear,
      totalLifetimeSavings: totalSavings,
      averageAnnualReturn,
    };
  }, [projectData, batteryLifeYears, discountRate, degradationRate, inflationRate, operatingCostsPercent]);

  // Sensitivity Analysis Data
  const sensitivityData = useMemo(() => {
    const variations = [-30, -20, -10, 0, 10, 20, 30];
    const baseAnnualSavings = projectData.annualSavings;
    const baseCapEx = projectData.totalCapEx;

    return variations.map(percent => {
      const adjustedSavings = baseAnnualSavings * (1 + percent / 100);
      const adjustedCapEx = baseCapEx * (1 + percent / 100);
      const payback = adjustedCapEx / adjustedSavings;
      const roi10 = ((adjustedSavings * 10 - adjustedCapEx) / adjustedCapEx) * 100;

      return {
        percent,
        payback,
        roi10,
      };
    });
  }, [projectData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border-4 border-blue-400">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span>📊</span>
                Advanced Financial Analytics
              </h2>
              <p className="text-blue-100 mt-1">{projectData.quoteName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg px-4 py-2 transition-all text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border-2 border-green-400 shadow-lg">
              <p className="text-sm font-semibold text-green-700 mb-1">Net Present Value (NPV)</p>
              <p className={`text-3xl font-bold ${metrics.npv > 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${(metrics.npv / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-600 mt-2">@ {(discountRate * 100).toFixed(1)}% discount rate</p>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border-2 border-blue-400 shadow-lg">
              <p className="text-sm font-semibold text-blue-700 mb-1">Internal Rate of Return (IRR)</p>
              <p className="text-3xl font-bold text-blue-700">{metrics.irr.toFixed(2)}%</p>
              <p className="text-xs text-gray-600 mt-2">Annual return rate</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-xl border-2 border-purple-400 shadow-lg">
              <p className="text-sm font-semibold text-purple-700 mb-1">Payback Period</p>
              <p className="text-3xl font-bold text-purple-700">{metrics.paybackPeriod.toFixed(1)} yrs</p>
              <p className="text-xs text-gray-600 mt-2">Break-even: Year {metrics.breakEvenYear}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl border-2 border-orange-400 shadow-lg">
              <p className="text-sm font-semibold text-orange-700 mb-1">Lifetime Savings</p>
              <p className="text-3xl font-bold text-orange-700">
                ${(metrics.totalLifetimeSavings / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-600 mt-2">Over {batteryLifeYears} years</p>
            </div>
          </div>

          {/* ROI Timeline */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Return on Investment Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <p className="text-sm font-semibold text-gray-700">5-Year ROI</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(((projectData.annualSavings * 5 - projectData.totalCapEx) / projectData.totalCapEx) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <p className="text-sm font-semibold text-gray-700">10-Year ROI</p>
                <p className="text-2xl font-bold text-green-700">{metrics.roi10Year.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <p className="text-sm font-semibold text-gray-700">20-Year ROI</p>
                <p className="text-2xl font-bold text-purple-700">{metrics.roi20Year.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Assumptions Panel */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-400 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">⚙️ Financial Assumptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Life (years)</label>
                <input
                  type="number"
                  value={batteryLifeYears}
                  onChange={(e) => setBatteryLifeYears(parseFloat(e.target.value) || 15)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  min="5"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Rate (%)</label>
                <input
                  type="number"
                  value={(discountRate * 100).toFixed(1)}
                  onChange={(e) => setDiscountRate((parseFloat(e.target.value) || 8) / 100)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  step="0.1"
                  min="0"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Degradation Rate (%/year)</label>
                <input
                  type="number"
                  value={(degradationRate * 100).toFixed(1)}
                  onChange={(e) => setDegradationRate((parseFloat(e.target.value) || 2) / 100)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Inflation Rate (%/year)</label>
                <input
                  type="number"
                  value={(inflationRate * 100).toFixed(1)}
                  onChange={(e) => setInflationRate((parseFloat(e.target.value) || 3) / 100)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">O&M Costs (% of CapEx)</label>
                <input
                  type="number"
                  value={(operatingCostsPercent * 100).toFixed(2)}
                  onChange={(e) => setOperatingCostsPercent((parseFloat(e.target.value) || 2.5) / 100)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avg Annual Return</label>
                <div className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-800">
                  {metrics.averageAnnualReturn.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Sensitivity Analysis */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🎯 Sensitivity Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">Impact of ±30% changes in annual savings on key metrics:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-bold text-gray-700">Savings Change</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">Payback Period</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700">10-Year ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivityData.map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-200 ${row.percent === 0 ? 'bg-blue-100 font-bold' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <span className={row.percent > 0 ? 'text-green-700' : row.percent < 0 ? 'text-red-700' : 'text-gray-800'}>
                          {row.percent > 0 ? '+' : ''}{row.percent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{row.payback.toFixed(2)} years</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={row.roi10 > 100 ? 'text-green-700' : row.roi10 < 0 ? 'text-red-700' : 'text-gray-800'}>
                          {row.roi10.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash Flow Visualization (Simple Text-Based) */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🎯 Cumulative Cash Flow</h3>
            <div className="space-y-2">
              {Array.from({ length: Math.min(batteryLifeYears, 20) }, (_, year) => {
                const degradationFactor = Math.pow(1 - degradationRate, year);
                const inflationFactor = Math.pow(1 + inflationRate, year);
                const operatingCosts = projectData.totalCapEx * operatingCostsPercent;
                const yearSavings = (projectData.annualSavings * degradationFactor * inflationFactor) - operatingCosts;
                const cumulativeFlow = (yearSavings * (year + 1)) - projectData.totalCapEx;
                const maxValue = projectData.totalCapEx * 2;
                const barWidth = Math.abs(cumulativeFlow) / maxValue * 100;

                return (
                  <div key={year} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 w-16">Year {year + 1}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cumulativeFlow > 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                        style={{ width: `${Math.min(barWidth, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                        ${(cumulativeFlow / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
