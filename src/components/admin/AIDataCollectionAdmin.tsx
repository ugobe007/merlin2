import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { runDailyDataCollection, getLatestAIData } from '../../services/aiDataCollectionService';
import { Database, TrendingUp, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Package, DollarSign, Zap } from 'lucide-react';

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
}

export default function AIDataCollectionAdmin() {
  const [collectionLogs, setCollectionLogs] = useState<CollectionLog[]>([]);
  const [dataStats, setDataStats] = useState<DataStats>({
    batteryPricing: 0,
    products: 0,
    financing: 0,
    news: 0,
    incentives: 0
  });
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastCollection, setLastCollection] = useState<CollectionLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollectionData();
  }, []);

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
      const [pricingCount, productsCount, financingCount, newsCount, incentivesCount] = await Promise.all([
        supabase.from('battery_pricing').select('*', { count: 'exact', head: true }),
        supabase.from('product_catalog').select('*', { count: 'exact', head: true }),
        supabase.from('financing_options').select('*', { count: 'exact', head: true }),
        supabase.from('industry_news').select('*', { count: 'exact', head: true }),
        supabase.from('incentive_programs').select('*', { count: 'exact', head: true })
      ]);

      setDataStats({
        batteryPricing: pricingCount.count || 0,
        products: productsCount.count || 0,
        financing: financingCount.count || 0,
        news: newsCount.count || 0,
        incentives: incentivesCount.count || 0
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
          AI Data Collection System
        </h2>
        <button
          onClick={handleManualCollection}
          disabled={isCollecting}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isCollecting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${isCollecting ? 'animate-spin' : ''}`} />
          {isCollecting ? 'Collecting...' : 'Run Collection Now'}
        </button>
      </div>

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
          You can manually trigger a collection at any time using the "Run Collection Now" button above.
        </p>
      </div>
    </div>
  );
}
