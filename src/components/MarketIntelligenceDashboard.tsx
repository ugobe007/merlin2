import React, { useState, useEffect } from 'react';
import { calculateRealWorldPrice } from '../utils/bessPricing';

interface MarketIntelligenceDashboardProps {
  onClose: () => void;
  userTier?: 'free' | 'professional' | 'enterprise_pro' | 'business';
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
  trend: 'up' | 'down' | 'stable';
}

interface ManufacturerData {
  name: string;
  avgPricePerKWh: number;
  marketShare: number;
  avgWarranty: number;
}

const MarketIntelligenceDashboard: React.FC<MarketIntelligenceDashboardProps> = ({ 
  onClose, 
  userTier = 'free' 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'regional' | 'manufacturers' | 'breakdown'>('overview');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');

  // Mock data - in production, this would come from your API
  const [pricingTrends] = useState<PricingTrend[]>([
    { month: 'May 2025', avgPricePerKWh: 456, avgPricePerKW: 925, dataPoints: 145 },
    { month: 'Jun 2025', avgPricePerKWh: 448, avgPricePerKW: 915, dataPoints: 167 },
    { month: 'Jul 2025', avgPricePerKWh: 442, avgPricePerKW: 905, dataPoints: 189 },
    { month: 'Aug 2025', avgPricePerKWh: 438, avgPricePerKW: 895, dataPoints: 203 },
    { month: 'Sep 2025', avgPricePerKWh: 435, avgPricePerKW: 890, dataPoints: 221 },
    { month: 'Oct 2025', avgPricePerKWh: 431, avgPricePerKW: 885, dataPoints: 234 },
  ]);

  const [regionalData] = useState<RegionalPricing[]>([
    { region: 'West Coast (US)', avgPricePerKWh: 425, avgPricePerKW: 870, sampleSize: 87, trend: 'down' },
    { region: 'Southwest (US)', avgPricePerKWh: 438, avgPricePerKW: 895, sampleSize: 64, trend: 'stable' },
    { region: 'Northeast (US)', avgPricePerKWh: 442, avgPricePerKW: 905, sampleSize: 52, trend: 'down' },
    { region: 'Texas (US)', avgPricePerKWh: 435, avgPricePerKW: 890, sampleSize: 71, trend: 'down' },
    { region: 'Europe', avgPricePerKWh: 465, avgPricePerKW: 950, sampleSize: 43, trend: 'stable' },
    { region: 'Asia Pacific', avgPricePerKWh: 410, avgPricePerKW: 840, sampleSize: 38, trend: 'down' },
  ]);

  const [manufacturerData] = useState<ManufacturerData[]>([
    { name: 'Tesla', avgPricePerKWh: 383, marketShare: 28, avgWarranty: 10 },
    { name: 'BYD', avgPricePerKWh: 395, marketShare: 22, avgWarranty: 10 },
    { name: 'CATL', avgPricePerKWh: 405, marketShare: 18, avgWarranty: 10 },
    { name: 'LG Energy', avgPricePerKWh: 425, marketShare: 15, avgWarranty: 10 },
    { name: 'Samsung SDI', avgPricePerKWh: 435, marketShare: 12, avgWarranty: 10 },
    { name: 'Others', avgPricePerKWh: 450, marketShare: 5, avgWarranty: 8 },
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
  const hasPremiumAccess = userTier !== 'free';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border-4 border-purple-400/60 ring-4 ring-purple-500/20">
        {/* Header */}
        <div className="p-6 border-b-4 border-purple-400/50 flex-shrink-0 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                📊 Market Intelligence Dashboard
              </h2>
              <p className="text-purple-200">
                Real-time BESS pricing data from {marketStats.totalDataPoints.toLocaleString()} validated quotes
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
            <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg p-4 shadow-lg border-2 border-emerald-400/50 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-1">💰 Installed Price</p>
              <p className="text-2xl font-bold text-emerald-300">${marketStats.avgPricePerKWh}/kWh</p>
              <p className={`text-xs ${marketStats.priceChange30d < 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                {marketStats.priceChange30d}% (30d)
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-lg p-4 shadow-lg border-2 border-purple-400/50 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-1">Average $/kW</p>
              <p className="text-2xl font-bold text-purple-300">${marketStats.avgPricePerKW}</p>
              <p className={`text-xs ${marketStats.priceChange90d < 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                {marketStats.priceChange90d}% (90d)
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-lg p-4 shadow-lg border-2 border-blue-400/50 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-1">Data Points</p>
              <p className="text-2xl font-bold text-blue-300">{marketStats.totalDataPoints.toLocaleString()}</p>
              <p className="text-xs text-blue-200">+45 this week</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-lg p-4 shadow-lg border-2 border-amber-400/50 backdrop-blur-sm">
              <p className="text-xs text-white/80 mb-1">Quality Score</p>
              <p className="text-2xl font-bold text-amber-300">{marketStats.dataQualityScore}/10</p>
              <p className="text-xs text-amber-200">Excellent</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-purple-400/50 px-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'breakdown'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 Cost Breakdown
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === 'trends'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📉 Price Trends
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'regional'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌍 Regional
          </button>
          <button
            onClick={() => setActiveTab('manufacturers')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'manufacturers'
                ? 'border-b-2 border-purple-400 text-purple-300'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏭 Manufacturers
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          {/* Cost Breakdown Tab */}
          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">💰 Installed Price Breakdown</h3>
                <p className="text-gray-700 mb-6">
                  This shows how we calculate the realistic "Installed Price" that buyers actually pay for turnkey BESS systems.
                  Based on Q4 2024 BNEF data and industry standards.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-gray-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">Battery Packs (Cells)</p>
                        <p className="text-sm text-gray-600">BNEF Q4 2024 pricing data</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">$132/kWh</p>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">PCS (Power Conversion System)</p>
                        <p className="text-sm text-gray-600">~22% of battery cost</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">$29/kWh</p>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">Microgrid Controller & EMS Software</p>
                        <p className="text-sm text-gray-600">$50-80k fixed cost amortized</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">$17/kWh</p>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">BOS (Balance of System)</p>
                        <p className="text-sm text-gray-600">Wiring, enclosures, HVAC, fire suppression (~12%)</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">$16/kWh</p>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b-2 border-gray-300">
                      <div>
                        <p className="font-semibold text-gray-900">Integration & Commissioning</p>
                        <p className="text-sm text-gray-600">~5% of subtotal</p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600">$11/kWh</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 bg-green-50 -mx-6 px-6 py-4 rounded-b-lg">
                      <div>
                        <p className="font-bold text-xl text-gray-900">Total Installed Price</p>
                        <p className="text-sm text-gray-600">Turnkey system ready for operation</p>
                      </div>
                      <p className="text-3xl font-bold text-green-700">~$205/kWh</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> This price includes small daily market fluctuations (±2%) to reflect real-time market conditions.
                    It represents what commercial/industrial buyers actually pay for fully installed, turnkey BESS systems in 2024-2025.
                  </p>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <p className="text-xs font-bold text-blue-700 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-900">BNEF Battery Pack Pricing</p>
                  </a>
                  <a 
                    href="https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <p className="text-xs font-bold text-green-700 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-900">NREL ATB 2024</p>
                  </a>
                  <a 
                    href="https://www.highjoule.com/blog/battery-energy-storage-system-bess-costs-in-2024-2025-the-ultimate-guide-to-lcos-market-trends.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-purple-200 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <p className="text-xs font-bold text-purple-700 mb-1">🔗 Source:</p>
                    <p className="text-sm text-gray-900">HighJoule BESS Guide</p>
                  </a>
                </div>
              </div>
            </div>
          )}

          {!hasPremiumAccess && activeTab !== 'breakdown' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔒</div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    Unlock Full Market Intelligence
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Upgrade to Professional or higher to access detailed pricing trends, regional analysis, 
                    and manufacturer comparisons. Get the data you need to stay competitive.
                  </p>
                  <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Distribution */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-xl mb-4">Price Distribution ($/kWh)</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>$300-$350</span>
                        <span className="font-semibold">8%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div className="bg-green-500 rounded-full h-3" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>$350-$400</span>
                        <span className="font-semibold">25%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 rounded-full h-3" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>$400-$450</span>
                        <span className="font-semibold">42%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div className="bg-purple-500 rounded-full h-3" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>$450-$500</span>
                        <span className="font-semibold">18%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div className="bg-orange-500 rounded-full h-3" style={{ width: '18%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>$500+</span>
                        <span className="font-semibold">7%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div className="bg-red-500 rounded-full h-3" style={{ width: '7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Size Breakdown */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-xl mb-4">By System Size</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Small (0-1 MWh)</p>
                        <p className="text-sm text-gray-600">Avg: $495/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">23%</p>
                        <p className="text-xs text-gray-600">of market</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Medium (1-5 MWh)</p>
                        <p className="text-sm text-gray-600">Avg: $432/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">48%</p>
                        <p className="text-xs text-gray-600">of market</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Large (5+ MWh)</p>
                        <p className="text-sm text-gray-600">Avg: $385/kWh</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">29%</p>
                        <p className="text-xs text-gray-600">of market</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="font-bold text-xl mb-4">🔍 Key Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📉</span>
                    <div>
                      <p className="font-semibold text-gray-900">Prices declining steadily</p>
                      <p className="text-sm text-gray-700">Average $/kWh down 5.5% over last 6 months</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌟</span>
                    <div>
                      <p className="font-semibold text-gray-900">Larger systems = better value</p>
                      <p className="text-sm text-gray-700">5+ MWh systems averaging 22% lower $/kWh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <p className="font-semibold text-gray-900">Regional variations significant</p>
                      <p className="text-sm text-gray-700">Up to 13% price difference by geography</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-semibold text-gray-900">Supply chain improving</p>
                      <p className="text-sm text-gray-700">Lead times down to 8-12 weeks on average</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className={hasPremiumAccess ? '' : 'blur-sm pointer-events-none'}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl">Historical Price Trends</h3>
                <div className="flex gap-2">
                  {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        timeRange === range
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  {pricingTrends.map((trend, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                      <div className="w-32 font-semibold text-gray-700">{trend.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">$/kWh</span>
                              <span className="font-bold text-blue-600">${trend.avgPricePerKWh}</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-2" 
                                style={{ width: `${(trend.avgPricePerKWh / 500) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">$/kW</span>
                              <span className="font-bold text-purple-600">${trend.avgPricePerKW}</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full h-2" 
                                style={{ width: `${(trend.avgPricePerKW / 1000) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 w-24 text-right">
                        {trend.dataPoints} quotes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Regional Tab */}
          {activeTab === 'regional' && (
            <div className={hasPremiumAccess ? '' : 'blur-sm pointer-events-none'}>
              <h3 className="font-bold text-2xl mb-6">Regional Price Comparison</h3>
              <div className="space-y-4">
                {regionalData.map((region, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{region.region}</h4>
                        <p className="text-sm text-gray-600">{region.sampleSize} data points</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        region.trend === 'down' ? 'bg-green-100 text-green-700' :
                        region.trend === 'up' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {region.trend === 'down' ? '↓' : region.trend === 'up' ? '↑' : '→'} {region.trend}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Average $/kWh</p>
                        <p className="text-3xl font-bold text-blue-600">${region.avgPricePerKWh}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Average $/kW</p>
                        <p className="text-3xl font-bold text-purple-600">${region.avgPricePerKW}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manufacturers Tab */}
          {activeTab === 'manufacturers' && (
            <div className={hasPremiumAccess ? '' : 'blur-sm pointer-events-none'}>
              <h3 className="font-bold text-2xl mb-6">Manufacturer Pricing & Market Share</h3>
              <div className="space-y-4">
                {manufacturerData.map((mfg, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          {mfg.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{mfg.name}</h4>
                          <p className="text-sm text-gray-600">Market Share: {mfg.marketShare}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600">${mfg.avgPricePerKWh}</p>
                        <p className="text-sm text-gray-600">per kWh</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Market Position</span>
                          <span className="font-semibold">{mfg.marketShare}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-3" 
                            style={{ width: `${mfg.marketShare * 3}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">
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
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>Data updated: October 22, 2025 • Next update in 2 hours</p>
            <button className="text-purple-600 hover:text-purple-800 font-semibold">
              📊 Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligenceDashboard;
