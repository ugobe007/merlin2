import React, { useState } from "react";
import { calculateRealWorldPrice } from "../utils/bessPricing";

interface MarketIntelligenceDashboardProps {
  onClose: () => void;
  userTier?: "free" | "starter" | "pro" | "advanced" | "business";
}

interface PricingTrend {
  month: string;
  avgPricePerKWh: number;
  avgPricePerKW: number;
  dataPoints: number;
}

interface RegionalPricing {
  region: string;
  avgPricePerKWh: number;
  avgPricePerKW: number;
  sampleSize: number;
  trend: "up" | "down" | "stable";
}

interface ManufacturerData {
  name: string;
  avgPricePerKWh: number;
  marketShare: number;
  avgWarranty: number;
}

const MarketIntelligenceDashboard: React.FC<MarketIntelligenceDashboardProps> = ({
  onClose,
  userTier = "free",
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trends" | "regional" | "manufacturers" | "breakdown"
  >("overview");
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("6M");

  // Mock data - in production, this would come from your API
  const [pricingTrends] = useState<PricingTrend[]>([
    { month: "May 2025", avgPricePerKWh: 456, avgPricePerKW: 925, dataPoints: 145 },
    { month: "Jun 2025", avgPricePerKWh: 448, avgPricePerKW: 915, dataPoints: 167 },
    { month: "Jul 2025", avgPricePerKWh: 442, avgPricePerKW: 905, dataPoints: 189 },
    { month: "Aug 2025", avgPricePerKWh: 438, avgPricePerKW: 895, dataPoints: 203 },
    { month: "Sep 2025", avgPricePerKWh: 435, avgPricePerKW: 890, dataPoints: 221 },
    { month: "Oct 2025", avgPricePerKWh: 431, avgPricePerKW: 885, dataPoints: 234 },
  ]);

  const [regionalData] = useState<RegionalPricing[]>([
    {
      region: "West Coast (US)",
      avgPricePerKWh: 425,
      avgPricePerKW: 870,
      sampleSize: 87,
      trend: "down",
    },
    {
      region: "Southwest (US)",
      avgPricePerKWh: 438,
      avgPricePerKW: 895,
      sampleSize: 64,
      trend: "stable",
    },
    {
      region: "Northeast (US)",
      avgPricePerKWh: 442,
      avgPricePerKW: 905,
      sampleSize: 52,
      trend: "down",
    },
    {
      region: "Texas (US)",
      avgPricePerKWh: 435,
      avgPricePerKW: 890,
      sampleSize: 71,
      trend: "down",
    },
    { region: "Europe", avgPricePerKWh: 465, avgPricePerKW: 950, sampleSize: 43, trend: "stable" },
    {
      region: "Asia Pacific",
      avgPricePerKWh: 410,
      avgPricePerKW: 840,
      sampleSize: 38,
      trend: "down",
    },
  ]);

  const [manufacturerData] = useState<ManufacturerData[]>([
    { name: "Tesla", avgPricePerKWh: 383, marketShare: 28, avgWarranty: 10 },
    { name: "BYD", avgPricePerKWh: 395, marketShare: 22, avgWarranty: 10 },
    { name: "CATL", avgPricePerKWh: 405, marketShare: 18, avgWarranty: 10 },
    { name: "LG Energy", avgPricePerKWh: 425, marketShare: 15, avgWarranty: 10 },
    { name: "Samsung SDI", avgPricePerKWh: 435, marketShare: 12, avgWarranty: 10 },
    { name: "Others", avgPricePerKWh: 450, marketShare: 5, avgWarranty: 8 },
  ]);

  const installedPrice = calculateRealWorldPrice();

  const [marketStats] = useState({
    totalDataPoints: 1159,
    avgPricePerKWh: installedPrice,
    avgPricePerKW: 885,
    priceChange30d: -1.8,
    priceChange90d: -4.2,
    dataQualityScore: 8.7,
  });

  // Check if user has access to premium features
  const hasPremiumAccess = userTier !== "free";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-3xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl" style={{ background: '#0c1631', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="p-6 flex-shrink-0 rounded-t-3xl" style={{ background: '#060d1f', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                📊 Market Intelligence Dashboard
              </h2>
              <p className="text-gray-400">
                Real-time BESS pricing data from {marketStats.totalDataPoints.toLocaleString()}{" "}
                validated quotes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-3xl transition-all"
              title="Close (ESC)"
            >
              ×
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">💰 Installed Price</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${marketStats.avgPricePerKWh}/kWh
              </p>
              <p
                className={`text-xs ${marketStats.priceChange30d < 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {marketStats.priceChange30d}% (30d)
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">Average $/kW</p>
              <p className="text-2xl font-bold text-amber-400">${marketStats.avgPricePerKW}</p>
              <p
                className={`text-xs ${marketStats.priceChange90d < 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {marketStats.priceChange90d}% (90d)
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">Data Points</p>
              <p className="text-2xl font-bold text-blue-400">
                {marketStats.totalDataPoints.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">+45 this week</p>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs text-gray-400 mb-1">Quality Score</p>
              <p className="text-2xl font-bold text-amber-400">{marketStats.dataQualityScore}/10</p>
              <p className="text-xs text-gray-500">Excellent</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <button
            onClick={() => setActiveTab("breakdown")}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "breakdown"
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            💰 Cost Breakdown
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === "trends"
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            📉 Price Trends
          </button>
          <button
            onClick={() => setActiveTab("regional")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "regional"
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🌍 Regional
          </button>
          <button
            onClick={() => setActiveTab("manufacturers")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "manufacturers"
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🏭 Manufacturers
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
          {/* Cost Breakdown Tab */}
          {activeTab === "breakdown" && (
            <div className="space-y-6">
              <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-2xl font-bold text-white mb-4">
                  💰 Installed Price Breakdown
                </h3>
                <p className="text-gray-400 mb-6">
                  This shows how we calculate the realistic "Installed Price" that buyers actually
                  pay for turnkey BESS systems. Based on Q4 2024 BNEF data and industry standards.
                </p>

                <div className="rounded-lg p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="font-semibold text-white">Battery Packs (Cells)</p>
                        <p className="text-sm text-gray-500">BNEF Q4 2024 pricing data</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">$132/kWh</p>
                    </div>

                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="font-semibold text-white">PCS (Power Conversion System)</p>
                        <p className="text-sm text-gray-500">~22% of battery cost</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-400">$29/kWh</p>
                    </div>

                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="font-semibold text-white">
                          Microgrid Controller & EMS Software
                        </p>
                        <p className="text-sm text-gray-500">$50-80k fixed cost amortized</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-400">$17/kWh</p>
                    </div>

                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="font-semibold text-white">BOS (Balance of System)</p>
                        <p className="text-sm text-gray-500">
                          Wiring, enclosures, HVAC, fire suppression (~12%)
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">$16/kWh</p>
                    </div>

                    <div className="flex justify-between items-center pb-3" style={{ borderBottom: '2px solid rgba(255,255,255,0.12)' }}>
                      <div>
                        <p className="font-semibold text-white">Integration & Commissioning</p>
                        <p className="text-sm text-gray-500">~5% of subtotal</p>
                      </div>
                      <p className="text-2xl font-bold text-cyan-400">$11/kWh</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 -mx-6 px-6 py-4 rounded-b-lg" style={{ background: 'rgba(251,191,36,0.08)' }}>
                      <div>
                        <p className="font-bold text-xl text-white">Total Installed Price</p>
                        <p className="text-sm text-gray-400">Turnkey system ready for operation</p>
                      </div>
                      <p className="text-3xl font-bold text-amber-400">~$205/kWh</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg p-4" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
                  <p className="text-sm text-gray-400">
                    <strong className="text-gray-300">Note:</strong> This price includes small daily market fluctuations (±2%)
                    to reflect real-time market conditions. It represents what commercial/industrial
                    buyers actually pay for fully installed, turnkey BESS systems in 2024-2025.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-4 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-xs font-bold text-blue-400 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-300">BNEF Battery Pack Pricing</p>
                  </a>
                  <a
                    href="https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-4 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-xs font-bold text-emerald-400 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-300">NREL ATB 2024</p>
                  </a>
                  <a
                    href="https://www.highjoule.com/blog/battery-energy-storage-system-bess-costs-in-2024-2025-the-ultimate-guide-to-lcos-market-trends.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-4 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-xs font-bold text-amber-400 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-300">HighJoule BESS Guide</p>
                  </a>
                </div>
              </div>
            </div>
          )}

          {!hasPremiumAccess && activeTab !== "breakdown" && (
            <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔒</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-2">
                    Unlock Full Market Intelligence
                  </h3>
                  <p className="text-gray-400 mb-3">
                    Upgrade to Professional or higher to access detailed pricing trends, regional
                    analysis, and manufacturer comparisons. Get the data you need to stay
                    competitive.
                  </p>
                  <button className="bg-amber-500 hover:bg-amber-400 text-gray-900 px-6 py-2 rounded-lg font-bold transition-all shadow-lg">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Distribution */}
                <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-bold text-xl mb-4 text-white">Price Distribution ($/kWh)</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">$300-$350</span>
                        <span className="font-semibold text-gray-300">8%</span>
                      </div>
                      <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="bg-emerald-500 rounded-full h-3"
                          style={{ width: "8%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">$350-$400</span>
                        <span className="font-semibold text-gray-300">25%</span>
                      </div>
                      <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="bg-blue-500 rounded-full h-3"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">$400-$450</span>
                        <span className="font-semibold text-gray-300">42%</span>
                      </div>
                      <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="bg-amber-500 rounded-full h-3"
                          style={{ width: "42%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">$450-$500</span>
                        <span className="font-semibold text-gray-300">18%</span>
                      </div>
                      <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="bg-orange-500 rounded-full h-3"
                          style={{ width: "18%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">$500+</span>
                        <span className="font-semibold text-gray-300">7%</span>
                      </div>
                      <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="bg-red-500 rounded-full h-3" style={{ width: "7%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Size Breakdown */}
                <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-bold text-xl mb-4 text-white">By System Size</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                      <div>
                        <p className="font-semibold text-white">Small (0-1 MWh)</p>
                        <p className="text-sm text-gray-400">Avg: $495/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">23%</p>
                        <p className="text-xs text-gray-500">of market</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                      <div>
                        <p className="font-semibold text-white">Medium (1-5 MWh)</p>
                        <p className="text-sm text-gray-400">Avg: $432/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-400">48%</p>
                        <p className="text-xs text-gray-500">of market</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
                      <div>
                        <p className="font-semibold text-white">Large (5+ MWh)</p>
                        <p className="text-sm text-gray-400">Avg: $385/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">29%</p>
                        <p className="text-xs text-gray-500">of market</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-bold text-xl mb-4 text-white">🔍 Key Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📉</span>
                    <div>
                      <p className="font-semibold text-white">Prices declining steadily</p>
                      <p className="text-sm text-gray-400">
                        Average $/kWh down 5.5% over last 6 months
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌟</span>
                    <div>
                      <p className="font-semibold text-white">Larger systems = better value</p>
                      <p className="text-sm text-gray-400">
                        5+ MWh systems averaging 22% lower $/kWh
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className="font-semibold text-white">Regional variations significant</p>
                      <p className="text-sm text-gray-400">
                        Up to 13% price difference by geography
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-semibold text-white">Supply chain improving</p>
                      <p className="text-sm text-gray-400">
                        Lead times down to 8-12 weeks on average
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className={hasPremiumAccess ? "" : "blur-sm pointer-events-none"}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl text-white">Historical Price Trends</h3>
                <div className="flex gap-2">
                  {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        timeRange === range
                          ? "bg-amber-500 text-gray-900"
                          : "text-gray-400 hover:text-white"
                      }`}
                      style={timeRange !== range ? { background: 'rgba(255,255,255,0.06)' } : {}}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="space-y-4">
                  {pricingTrends.map((trend, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="w-32 font-semibold text-gray-300">{trend.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-500">$/kWh</span>
                              <span className="font-bold text-blue-400">
                                ${trend.avgPricePerKWh}
                              </span>
                            </div>
                            <div className="rounded-full h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-full h-2"
                                style={{ width: `${(trend.avgPricePerKWh / 500) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-500">$/kW</span>
                              <span className="font-bold text-amber-400">
                                ${trend.avgPricePerKW}
                              </span>
                            </div>
                            <div className="rounded-full h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div
                                className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-full h-2"
                                style={{ width: `${(trend.avgPricePerKW / 1000) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 w-24 text-right">
                        {trend.dataPoints} quotes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Regional Tab */}
          {activeTab === "regional" && (
            <div className={hasPremiumAccess ? "" : "blur-sm pointer-events-none"}>
              <h3 className="font-bold text-2xl mb-6 text-white">Regional Price Comparison</h3>
              <div className="space-y-4">
                {regionalData.map((region, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-6 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white">{region.region}</h4>
                        <p className="text-sm text-gray-500">{region.sampleSize} data points</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          region.trend === "down"
                            ? "text-emerald-400"
                            : region.trend === "up"
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        {region.trend === "down" ? "↓" : region.trend === "up" ? "↑" : "→"}{" "}
                        {region.trend}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg p-4" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                        <p className="text-sm text-gray-400 mb-1">Average $/kWh</p>
                        <p className="text-3xl font-bold text-blue-400">${region.avgPricePerKWh}</p>
                      </div>
                      <div className="rounded-lg p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <p className="text-sm text-gray-400 mb-1">Average $/kW</p>
                        <p className="text-3xl font-bold text-amber-400">
                          ${region.avgPricePerKW}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manufacturers Tab */}
          {activeTab === "manufacturers" && (
            <div className={hasPremiumAccess ? "" : "blur-sm pointer-events-none"}>
              <h3 className="font-bold text-2xl mb-6 text-white">Manufacturer Pricing & Market Share</h3>
              <div className="space-y-4">
                {manufacturerData.map((mfg, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl p-6 hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ background: 'linear-gradient(135deg, #1e3a5f, #0c1631)' }}>
                          {mfg.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-white">{mfg.name}</h4>
                          <p className="text-sm text-gray-500">Market Share: {mfg.marketShare}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-amber-400">${mfg.avgPricePerKWh}</p>
                        <p className="text-sm text-gray-500">per kWh</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Market Position</span>
                          <span className="font-semibold text-gray-300">{mfg.marketShare}%</span>
                        </div>
                        <div className="rounded-full h-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-full h-3"
                            style={{ width: `${mfg.marketShare * 3}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 font-semibold">
                        {mfg.avgWarranty} yr warranty
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 rounded-b-3xl flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>Data updated: October 22, 2025 • Next update in 2 hours</p>
            <button className="text-amber-400 hover:text-amber-300 font-semibold">
              📊 Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligenceDashboard;
