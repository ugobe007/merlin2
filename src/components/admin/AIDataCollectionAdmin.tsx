import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { runDailyDataCollection, getLatestAIData } from '../../services/aiDataCollectionService';
import { runMLProcessing, getLatestMLInsights, type PriceTrendAnalysis, type MarketInsight } from '../../services/mlProcessingService';
import { runRSSFetchCycle, checkRSSFeedHealth } from '../../services/rssAutoFetchService';
import { Database, TrendingUp, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Package, DollarSign, Zap, Rss, Brain, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface CollectionLog {
  id: string;
  collection_date: string;
  duration_seconds: number;
  status: 'success' | 'error';
  items_collected?: number;
  error_message?: string;
}

interface DataStats {
  batteryPricing: number;
  products: number;
  financing: number;
  news: number;
  incentives: number;
  aiTrainingData: number;
}

interface RSSFeedStatus {
  source: string;
  status: 'ok' | 'error';
  articlesFound?: number;
  error?: string;
}

export default function AIDataCollectionAdmin() {
  const [collectionLogs, setCollectionLogs] = useState<CollectionLog[]>([]);
  const [dataStats, setDataStats] = useState<DataStats>({
    batteryPricing: 0,
    products: 0,
    financing: 0,
    news: 0,
    incentives: 0,
    aiTrainingData: 0
  });
  const [isCollecting, setIsCollecting] = useState(false);
  const [isFetchingRSS, setIsFetchingRSS] = useState(false);
  const [isRunningML, setIsRunningML] = useState(false);
  const [lastCollection, setLastCollection] = useState<CollectionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rss' | 'ml'>('overview');
  const [rssFeedStatus, setRssFeedStatus] = useState<RSSFeedStatus[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrendAnalysis[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [lastMLProcessed, setLastMLProcessed] = useState<string>('Never');

  useEffect(() => {
    loadCollectionData();
    loadMLData();
  }, []);

  async function loadMLData() {
    try {
      const insights = await getLatestMLInsights();
      setPriceTrends(insights.priceTrends);
      setMarketInsights(insights.marketInsights);
      setLastMLProcessed(insights.lastProcessed);
    } catch (error) {
      console.error('Error loading ML data:', error);
    }
  }

  async function loadCollectionData() {
    setLoading(true);
    try {
      // Load collection logs
      const { data: logs, error: logsError } = await supabase
        .from('data_collection_log')
        .select('*')
        .order('collection_date', { ascending: false })
        .limit(10);

      if (logsError) {
        console.error('Error loading collection logs:', logsError);
      } else {
        setCollectionLogs(logs || []);
        setLastCollection(logs?.[0] || null);
      }

      // Load data statistics
      const [pricingCount, productsCount, financingCount, newsCount, incentivesCount, aiTrainingCount] = await Promise.all([
        supabase.from('battery_pricing').select('*', { count: 'exact', head: true }),
        supabase.from('product_catalog').select('*', { count: 'exact', head: true }),
        supabase.from('financing_options').select('*', { count: 'exact', head: true }),
        supabase.from('industry_news').select('*', { count: 'exact', head: true }),
        supabase.from('incentive_programs').select('*', { count: 'exact', head: true }),
        supabase.from('ai_training_data').select('*', { count: 'exact', head: true })
      ]);

      setDataStats({
        batteryPricing: pricingCount.count || 0,
        products: productsCount.count || 0,
        financing: financingCount.count || 0,
        news: newsCount.count || 0,
        incentives: incentivesCount.count || 0,
        aiTrainingData: aiTrainingCount.count || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCollection() {
    setIsCollecting(true);
    try {
      await runDailyDataCollection();
      setTimeout(() => {
        loadCollectionData();
        setIsCollecting(false);
      }, 2000);
    } catch (error) {
      console.error('Manual collection failed:', error);
      setIsCollecting(false);
    }
  }

  async function handleRSSFetch() {
    setIsFetchingRSS(true);
    try {
      const result = await runRSSFetchCycle();
      if (import.meta.env.DEV) { console.log('RSS Fetch result:', result); }
      // Check feed health
      const health = await checkRSSFeedHealth();
      setRssFeedStatus(health);
      await loadCollectionData();
    } catch (error) {
      console.error('RSS fetch failed:', error);
    } finally {
      setIsFetchingRSS(false);
    }
  }

  async function handleMLProcessing() {
    setIsRunningML(true);
    try {
      await runMLProcessing();
      await loadMLData();
      await loadCollectionData();
    } catch (error) {
      console.error('ML processing failed:', error);
    } finally {
      setIsRunningML(false);
    }
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading AI data collection stats...</div>
      </div>
    );
  }

  const successRate = collectionLogs.length > 0
    ? ((collectionLogs.filter(log => log.status === 'success').length / collectionLogs.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-400" />
          AI Data Collection & ML System
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleRSSFetch}
            disabled={isFetchingRSS}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isFetchingRSS
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
            }`}
          >
            <Rss className={`w-4 h-4 ${isFetchingRSS ? 'animate-pulse' : ''}`} />
            {isFetchingRSS ? 'Fetching...' : 'Fetch RSS'}
          </button>
          <button
            onClick={handleMLProcessing}
            disabled={isRunningML}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isRunningML
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            }`}
          >
            <Brain className={`w-4 h-4 ${isRunningML ? 'animate-spin' : ''}`} />
            {isRunningML ? 'Processing...' : 'Run ML'}
          </button>
          <button
            onClick={handleManualCollection}
            disabled={isCollecting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isCollecting
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isCollecting ? 'animate-spin' : ''}`} />
            {isCollecting ? 'Collecting...' : 'Collect Data'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { key: 'overview', label: '📊 Overview', icon: BarChart3 },
          { key: 'rss', label: '📰 RSS Feeds', icon: Rss },
          { key: 'ml', label: '🤖 ML Insights', icon: Brain }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Status Overview */}
          <div className="grid md:grid-cols-4 gap-6">
        {/* Last Collection */}
        <div className="bg-gradient-to-br from-blue-600/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-300" />
            <p className="text-blue-300 text-sm font-semibold">LAST COLLECTION</p>
          </div>
          {lastCollection ? (
            <>
              <p className="text-white text-2xl font-bold">{getTimeAgo(lastCollection.collection_date)}</p>
              <p className="text-blue-200 text-sm mt-2">
                {formatDuration(lastCollection.duration_seconds)} duration
              </p>
            </>
          ) : (
            <p className="text-white text-xl">No data yet</p>
          )}
        </div>

        {/* Success Rate */}
        <div className="bg-gradient-to-br from-green-600/30 to-green-800/30 p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-300" />
            <p className="text-green-300 text-sm font-semibold">SUCCESS RATE</p>
          </div>
          <p className="text-white text-2xl font-bold">{successRate}%</p>
          <p className="text-green-200 text-sm mt-2">
            {collectionLogs.filter(log => log.status === 'success').length}/{collectionLogs.length} successful
          </p>
        </div>

        {/* Total Items */}
        <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-purple-300" />
            <p className="text-purple-300 text-sm font-semibold">TOTAL RECORDS</p>
          </div>
          <p className="text-white text-2xl font-bold">
            {Object.values(dataStats).reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
          <p className="text-purple-200 text-sm mt-2">Across all sources</p>
        </div>

        {/* Status */}
        <div className={`bg-gradient-to-br ${
          lastCollection?.status === 'success'
            ? 'from-green-600/30 to-green-800/30 border-green-500/30'
            : 'from-red-600/30 to-red-800/30 border-red-500/30'
        } p-6 rounded-xl border`}>
          <div className="flex items-center gap-3 mb-2">
            {lastCollection?.status === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-300" />
            ) : (
              <XCircle className="w-6 h-6 text-red-300" />
            )}
            <p className={`text-sm font-semibold ${
              lastCollection?.status === 'success' ? 'text-green-300' : 'text-red-300'
            }`}>
              SYSTEM STATUS
            </p>
          </div>
          <p className="text-white text-2xl font-bold capitalize">
            {lastCollection?.status || 'Unknown'}
          </p>
          <p className={`text-sm mt-2 ${
            lastCollection?.status === 'success' ? 'text-green-200' : 'text-red-200'
          }`}>
            All systems operational
          </p>
        </div>
      </div>

      {/* Data Source Statistics */}
      <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-400" />
          Data Source Statistics
        </h3>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <p className="text-gray-300 text-sm">Battery Pricing</p>
            </div>
            <p className="text-white text-2xl font-bold">{dataStats.batteryPricing.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">price points</p>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-400" />
              <p className="text-gray-300 text-sm">Products</p>
            </div>
            <p className="text-white text-2xl font-bold">{dataStats.products.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">catalog items</p>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <p className="text-gray-300 text-sm">Financing</p>
            </div>
            <p className="text-white text-2xl font-bold">{dataStats.financing.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">options</p>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-300 text-sm">Industry News</p>
            </div>
            <p className="text-white text-2xl font-bold">{dataStats.news.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">articles</p>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <p className="text-gray-300 text-sm">Incentives</p>
            </div>
            <p className="text-white text-2xl font-bold">{dataStats.incentives.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-1">programs</p>
          </div>
        </div>
      </div>

      {/* Collection History */}
      <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Collection History</h3>
        <div className="space-y-2">
          {collectionLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No collection logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-slate-700/30">
                      <td className="py-3 text-white">
                        {new Date(log.collection_date).toLocaleString()}
                        <span className="text-gray-400 text-sm ml-2">
                          ({getTimeAgo(log.collection_date)})
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {formatDuration(log.duration_seconds)}
                      </td>
                      <td className="py-3 text-gray-300">
                        {log.items_collected || 'N/A'}
                      </td>
                      <td className="py-3 text-red-300 text-sm max-w-xs truncate">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>ℹ️ Auto-Collection:</strong> The system automatically collects data daily at 2:00 AM. 
          You can manually trigger a collection at any time using the buttons above.
        </p>
      </div>
        </>
      )}

      {activeTab === 'rss' && (
        <>
          {/* RSS Feed Status */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-orange-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Rss className="w-6 h-6 text-orange-400" />
              RSS Feed Sources
            </h3>
            <p className="text-gray-400 mb-4">
              10 industry feeds configured for automated content extraction and ML training.
            </p>
            
            {rssFeedStatus.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {rssFeedStatus.map((feed, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    feed.status === 'ok' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{feed.source}</span>
                      {feed.status === 'ok' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    {feed.status === 'ok' ? (
                      <p className="text-green-300 text-sm mt-1">{feed.articlesFound} articles found</p>
                    ) : (
                      <p className="text-red-300 text-sm mt-1">{feed.error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Rss className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Click "Fetch RSS" to check feed status</p>
              </div>
            )}
          </div>

          {/* AI Training Data */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              AI Training Data Extracted
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dataStats.aiTrainingData}</p>
                <p className="text-gray-400 text-sm">Total Training Records</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{priceTrends.length}</p>
                <p className="text-gray-400 text-sm">Price Trends Analyzed</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{marketInsights.length}</p>
                <p className="text-gray-400 text-sm">Market Insights Generated</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ml' && (
        <>
          {/* ML Processing Status */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                ML Processing Status
              </h3>
              <span className="text-sm text-gray-400">
                Last processed: {lastMLProcessed === 'Never' ? 'Never' : getTimeAgo(lastMLProcessed)}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-purple-300 text-sm font-semibold mb-2">PRICE TREND ANALYSIS</p>
                <p className="text-white">Linear regression on pricing data to forecast trends</p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <p className="text-pink-300 text-sm font-semibold mb-2">MARKET INSIGHTS</p>
                <p className="text-white">Pattern detection across news and trends</p>
              </div>
            </div>
          </div>

          {/* Price Trends */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Price Trends
            </h3>
            {priceTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                      <th className="pb-3">Product Type</th>
                      <th className="pb-3">Avg Price</th>
                      <th className="pb-3">30d Change</th>
                      <th className="pb-3">90d Change</th>
                      <th className="pb-3">Trend</th>
                      <th className="pb-3">Forecast (90d)</th>
                      <th className="pb-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceTrends.map((trend, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-slate-700/30">
                        <td className="py-3 text-white font-medium">{trend.productType}</td>
                        <td className="py-3 text-green-300">${trend.averagePrice.toFixed(2)}</td>
                        <td className={`py-3 flex items-center gap-1 ${
                          trend.priceChange30d < 0 ? 'text-green-400' : trend.priceChange30d > 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {trend.priceChange30d < 0 ? <ArrowDown className="w-4 h-4" /> : 
                           trend.priceChange30d > 0 ? <ArrowUp className="w-4 h-4" /> : 
                           <Minus className="w-4 h-4" />}
                          {Math.abs(trend.priceChange30d).toFixed(1)}%
                        </td>
                        <td className={`py-3 ${
                          trend.priceChange90d < 0 ? 'text-green-400' : trend.priceChange90d > 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {trend.priceChange90d > 0 ? '+' : ''}{trend.priceChange90d.toFixed(1)}%
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trend.trend === 'decreasing' ? 'bg-green-500/20 text-green-300' :
                            trend.trend === 'increasing' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {trend.trend.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-blue-300">${trend.forecastNextQuarter.toFixed(2)}</td>
                        <td className="py-3 text-gray-300">{(trend.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No price trends available. Run ML processing to generate insights.</p>
              </div>
            )}
          </div>

          {/* Market Insights */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-yellow-500/30">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Market Insights
            </h3>
            {marketInsights.length > 0 ? (
              <div className="space-y-4">
                {marketInsights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.impact === 'high' ? 'bg-red-500/10 border-red-500' :
                    insight.impact === 'medium' ? 'bg-yellow-500/10 border-yellow-500' :
                    'bg-green-500/10 border-green-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        insight.impact === 'high' ? 'bg-red-500/30 text-red-300' :
                        insight.impact === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                        'bg-green-500/30 text-green-300'
                      }`}>
                        {insight.impact.toUpperCase()} IMPACT
                      </span>
                      <span className="text-gray-400 text-xs">
                        {insight.sourceCount} sources • {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-white">{insight.insight}</p>
                    {insight.affectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insight.affectedProducts.map((product, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-600 rounded text-xs text-gray-300">
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No market insights available. Run ML processing to generate insights.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
