/**
 * Cache Statistics Dashboard
 * 
 * Displays performance metrics for the caching system:
 * - Hit rates for each cache type
 * - Cache sizes and capacities
 * - Controls to clear caches
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Database, Zap, Trash2, RefreshCw } from 'lucide-react';
import { baselineCache, useCaseCache, calculationCache } from '../../services/cacheService';

interface CacheStats {
  name: string;
  stats: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  capacity: number;
  description: string;
}

export default function CacheStatistics() {
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = () => {
    setRefreshing(true);
    
    const stats: CacheStats[] = [
      {
        name: 'Baseline Cache',
        stats: baselineCache.getStats(),
        capacity: 50,
        description: 'Baseline calculations for use cases (10 min TTL)'
      },
      {
        name: 'Use Case Cache',
        stats: useCaseCache.getStats(),
        capacity: 100,
        description: 'Use case data from database (30 min TTL)'
      },
      {
        name: 'Calculation Cache',
        stats: calculationCache.getStats(),
        capacity: 200,
        description: 'Financial calculations and results (5 min TTL)'
      }
    ];

    setCacheStats(stats);
    
    setTimeout(() => setRefreshing(false), 300);
  };

  useEffect(() => {
    loadStats();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const clearCache = (cacheName: string) => {
    if (!confirm(`Clear all entries in ${cacheName}?`)) return;
    
    switch (cacheName) {
      case 'Baseline Cache':
        baselineCache.clear();
        break;
      case 'Use Case Cache':
        useCaseCache.clear();
        break;
      case 'Calculation Cache':
        calculationCache.clear();
        break;
    }
    
    loadStats();
  };

  const clearAllCaches = () => {
    if (!confirm('Clear ALL caches? This will temporarily reduce performance.')) return;
    
    baselineCache.clear();
    useCaseCache.clear();
    calculationCache.clear();
    
    loadStats();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-600" />
            Cache Performance
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage the caching layer for optimized performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={clearAllCaches}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Cache Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cacheStats.map((cache) => {
          const utilizationPercent = (cache.stats.size / cache.capacity) * 100;
          const isHighUtilization = utilizationPercent > 80;
          const isLowHitRate = cache.stats.hitRate < 50;
          
          return (
            <div
              key={cache.name}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{cache.name}</h3>
                  <Database className="w-6 h-6" />
                </div>
                <p className="text-blue-100 text-sm mt-1">{cache.description}</p>
              </div>

              {/* Stats */}
              <div className="p-6">
                {/* Hit Rate */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Hit Rate</span>
                    <span className={`text-2xl font-bold ${
                      isLowHitRate ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {cache.stats.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isLowHitRate ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${cache.stats.hitRate}%` }}
                    />
                  </div>
                </div>

                {/* Hits & Misses */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Hits</div>
                    <div className="text-2xl font-bold text-green-700">
                      {cache.stats.hits.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Misses</div>
                    <div className="text-2xl font-bold text-red-700">
                      {cache.stats.misses.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Utilization */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Utilization</span>
                    <span className={`text-lg font-bold ${
                      isHighUtilization ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {cache.stats.size} / {cache.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isHighUtilization ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>
                </div>

                {/* Clear Button */}
                <button
                  onClick={() => clearCache(cache.name)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear {cache.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Performance Insights
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
            <div>
              <p className="text-gray-700">
                <strong>Cache Hit Rate:</strong> Higher is better. Rates above 80% indicate excellent caching performance.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />
            <div>
              <p className="text-gray-700">
                <strong>TTL Strategy:</strong> Baseline (10 min), Use Case (30 min), Calculations (5 min).
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
            <div>
              <p className="text-gray-700">
                <strong>Auto-Pruning:</strong> Expired entries are automatically removed every 5 minutes.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-600 rounded-full mt-2" />
            <div>
              <p className="text-gray-700">
                <strong>Eviction:</strong> When at capacity, least recently used (LRU) entries are removed first.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
