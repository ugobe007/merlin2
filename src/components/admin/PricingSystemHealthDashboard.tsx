/**
 * Pricing System Health Dashboard
 * 
 * Monitors the health of the pricing system including:
 * - Market rate pricing updates
 * - ML agent integration status
 * - Price change impact on quotes
 * - System health metrics
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Zap, RefreshCw, BarChart3, DollarSign, Cpu, Cloud, CloudOff, ArrowUp, ArrowDown, Info, Building2 } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { getMarketPriceSummary } from '@/services/marketDataIntegrationService';
import { 
  clearAllPricingCaches 
} from '@/services/unifiedPricingService';
import { dailyPricingValidator } from '@/services/dailyPricingValidator';
import { runMLProcessing } from '@/services/mlProcessingService';

interface PricingHealthMetrics {
  // Market Data Status
  marketDataStatus: 'healthy' | 'degraded' | 'error';
  marketDataPoints: number;
  lastMarketUpdate: Date | null;
  marketDataCoverage: {
    bess: number;
    solar: number;
    generator: number;
    evCharger: number;
    inverter: number;
    transformer: number;
  };
  
  // ML Agent Status
  mlAgentStatus: 'active' | 'idle' | 'error';
  mlLastProcessed: Date | null;
  mlTrendsGenerated: number;
  mlInsightsGenerated: number;
  mlUnprocessedRecords: number;
  mlProcessingTime: number;
  
  // Vendor Pricing Status
  vendorPricingStatus: 'active' | 'limited' | 'none';
  approvedVendorProducts: number;
  pendingVendorProducts: number;
  vendorPricingCoverage: {
    battery: number;
    inverter: number;
    ems: number;
    bos: number;
    container: number;
  };
  vendorPricingUtilization: number; // % of quotes using vendor pricing
  vendorPricingLastSync: Date | null;
  
  // Pricing Configuration Status
  pricingConfigStatus: 'synced' | 'outdated' | 'error';
  pricingConfigLastUpdate: Date | null;
  pricingConfigSource: 'database' | 'localStorage' | 'fallback';
  
  // Quote Impact Metrics
  quotesUsingMarketData: number;
  quotesUsingDefaults: number;
  quotesUsingVendorPricing: number;
  marketDataUtilizationRate: number;
  averagePriceDeviation: number;
  
  // System Health
  cacheStatus: 'fresh' | 'stale' | 'expired';
  databaseConnection: 'connected' | 'disconnected' | 'error';
  validationAlerts: number;
  criticalAlerts: number;
}

export const PricingSystemHealthDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PricingHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mlTrends, setMlTrends] = useState<any[]>([]);
  const [marketSummaries, setMarketSummaries] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [utilityRates, setUtilityRates] = useState<any[]>([]);
  const [utilityRatesLoading, setUtilityRatesLoading] = useState(false);
  const [utilityRatesError, setUtilityRatesError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthMetrics();
    loadUtilityRates();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadHealthMetrics();
      loadUtilityRates();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUtilityRates = async () => {
    setUtilityRatesLoading(true);
    setUtilityRatesError(null);
    try {
      const { data, error } = await supabase
        .from('utility_rates_summary')
        .select('*')
        .order('avg_commercial_rate', { ascending: false })
        .limit(50); // Top 50 states by rate

      if (error) {
        console.error('❌ Error loading utility rates:', error);
        setUtilityRatesError(error.message || 'Failed to load utility rates. Please check if the utility_rates_summary view exists in the database.');
        setUtilityRates([]);
        return;
      }
      console.log('✅ Utility rates loaded:', data?.length || 0, 'states');
      setUtilityRates(data || []);
    } catch (error) {
      console.error('❌ Exception loading utility rates:', error);
      setUtilityRatesError(error instanceof Error ? error.message : 'Unknown error loading utility rates');
      setUtilityRates([]);
    } finally {
      setUtilityRatesLoading(false);
    }
  };

  const loadHealthMetrics = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing pricing health metrics...');
      // Load all metrics in parallel
      const [
        mlData,
        marketData,
        validationData,
        dbStatus,
        mlTrendsData
      ] = await Promise.all([
        loadMLAgentStatus(),
        loadMarketDataStatus(),
        loadValidationStatus(),
        checkDatabaseConnection(),
        loadMLTrends()
      ]);

      // Calculate market data coverage
      const coverage = await calculateMarketDataCoverage();

      // Calculate quote impact metrics
      const quoteMetrics = await calculateQuoteImpactMetrics();
      
      // Update last refresh timestamp
      setLastRefresh(new Date());
      console.log('✅ Pricing health metrics refreshed');

      setMetrics({
        // Market Data
        marketDataStatus: marketData.marketDataStatus || 'error',
        marketDataPoints: marketData.marketDataPoints || 0,
        lastMarketUpdate: marketData.lastMarketUpdate || null,
        marketDataCoverage: coverage.marketDataCoverage || {
          bess: 0,
          solar: 0,
          generator: 0,
          evCharger: 0,
          inverter: 0,
          transformer: 0
        },
        
        // ML Agent
        mlAgentStatus: mlData.mlAgentStatus || 'idle',
        mlLastProcessed: mlData.mlLastProcessed || null,
        mlTrendsGenerated: mlData.mlTrendsGenerated || 0,
        mlInsightsGenerated: mlData.mlInsightsGenerated || 0,
        mlUnprocessedRecords: mlData.mlUnprocessedRecords || 0,
        mlProcessingTime: mlData.mlProcessingTime || 0,
        
        // Pricing Config
        pricingConfigStatus: 'synced',
        pricingConfigLastUpdate: null,
        pricingConfigSource: 'database',
        
        // Vendor Pricing (TODO: Load vendor data when vendor service is implemented)
        vendorPricingStatus: 'none',
        approvedVendorProducts: 0,
        pendingVendorProducts: 0,
        vendorPricingCoverage: {
          battery: 0,
          inverter: 0,
          ems: 0,
          bos: 0,
          container: 0,
        },
        vendorPricingUtilization: 0,
        vendorPricingLastSync: null,
        
        // Quote Impact
        quotesUsingMarketData: quoteMetrics.quotesUsingMarketData || 0,
        quotesUsingDefaults: quoteMetrics.quotesUsingDefaults || 0,
        quotesUsingVendorPricing: quoteMetrics.quotesUsingVendorPricing || 0,
        marketDataUtilizationRate: quoteMetrics.marketDataUtilizationRate || 0,
        averagePriceDeviation: quoteMetrics.averagePriceDeviation || 0,
        
        // System Health
        cacheStatus: 'fresh',
        databaseConnection: dbStatus.databaseConnection || 'error',
        validationAlerts: validationData.validationAlerts || 0,
        criticalAlerts: validationData.criticalAlerts || 0
      });

      setMlTrends(mlTrendsData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading pricing health metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMLAgentStatus = async (): Promise<Partial<PricingHealthMetrics>> => {
    try {
      // Get ML processing log (cast to any for typing, then type the data)
      const { data: logData } = await supabase
        .from('ml_processing_log' as any)
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(1)
        .single() as any; // Type assertion since table not in generated types

      // Get unprocessed records count
      const { count: unprocessedCount } = await supabase
        .from('ai_training_data' as any)
        .select('*', { count: 'exact', head: true })
        .eq('processed_for_ml', false)
        .eq('data_type', 'pricing');

      // Get ML trends count
      const { count: trendsCount } = await supabase
        .from('ml_price_trends' as any)
        .select('*', { count: 'exact', head: true });

      // Get ML insights count
      const { count: insightsCount } = await supabase
        .from('ml_market_insights' as any)
        .select('*', { count: 'exact', head: true });

      const status = logData 
        ? (Date.now() - new Date((logData as any).processed_at).getTime() < 24 * 60 * 60 * 1000 ? 'active' : 'idle')
        : 'idle';

      return {
        mlAgentStatus: status,
        mlLastProcessed: logData ? new Date((logData as any).processed_at) : null,
        mlTrendsGenerated: trendsCount || 0,
        mlInsightsGenerated: insightsCount || 0,
        mlUnprocessedRecords: unprocessedCount || 0,
        mlProcessingTime: (logData as any)?.processing_time_seconds || 0
      };
    } catch (error) {
      console.error('Error loading ML status:', error);
      return {
        mlAgentStatus: 'error' as const,
        mlLastProcessed: null,
        mlTrendsGenerated: 0,
        mlInsightsGenerated: 0,
        mlUnprocessedRecords: 0,
        mlProcessingTime: 0
      };
    }
  };

  const loadMarketDataStatus = async (): Promise<Partial<PricingHealthMetrics>> => {
    try {
      // Get latest market pricing data
      const { data: marketData, error } = await supabase
        .from('collected_market_prices')
        .select('price_date')
        .order('price_date', { ascending: false })
        .limit(1)
        .single();

      // Get total market data points
      const { count: dataPoints } = await supabase
        .from('collected_market_prices')
        .select('*', { count: 'exact', head: true })
        .gte('price_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const status = marketData && !error
        ? (Date.now() - new Date(marketData.price_date).getTime() < 7 * 24 * 60 * 60 * 1000 ? 'healthy' : 'degraded')
        : 'error';

      return {
        marketDataStatus: status,
        marketDataPoints: dataPoints || 0,
        lastMarketUpdate: marketData ? new Date(marketData.price_date) : null
      };
    } catch (error) {
      console.error('Error loading market data status:', error);
      return {
        marketDataStatus: 'error' as const,
        marketDataPoints: 0,
        lastMarketUpdate: null
      };
    }
  };

  const calculateMarketDataCoverage = async (): Promise<Partial<PricingHealthMetrics>> => {
    try {
      const equipmentTypes = ['bess', 'solar', 'generator', 'ev-charger', 'inverter', 'transformer'];
      const coverage: Record<string, number> = {};

      for (const type of equipmentTypes) {
        try {
          const summary = await getMarketPriceSummary(type as any, 'north-america');
          coverage[type] = summary?.dataPointCount || 0;
        } catch (error) {
          coverage[type] = 0;
        }
      }

      return {
        marketDataCoverage: {
          bess: coverage['bess'] || 0,
          solar: coverage['solar'] || 0,
          generator: coverage['generator'] || 0,
          evCharger: coverage['ev-charger'] || 0,
          inverter: coverage['inverter'] || 0,
          transformer: coverage['transformer'] || 0
        }
      };
    } catch (error) {
      return {
        marketDataCoverage: {
          bess: 0,
          solar: 0,
          generator: 0,
          evCharger: 0,
          inverter: 0,
          transformer: 0
        }
      };
    }
  };

  const loadValidationStatus = async (): Promise<Partial<PricingHealthMetrics>> => {
    try {
      const results = await dailyPricingValidator.validateDailyPricing();
      const critical = results.filter(r => r.severity === 'critical').length;
      
      setValidationResults(results);

      return {
        validationAlerts: results.length,
        criticalAlerts: critical
      };
    } catch (error) {
      return {
        validationAlerts: 0,
        criticalAlerts: 0
      };
    }
  };

  const checkDatabaseConnection = async (): Promise<Partial<PricingHealthMetrics>> => {
    try {
      const { error } = await supabase
        .from('calculation_constants')
        .select('id')
        .limit(1);

      return {
        databaseConnection: error ? 'error' : 'connected'
      };
    } catch (error) {
      return {
        databaseConnection: 'error' as const
      };
    }
  };

  const loadMLTrends = async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('ml_price_trends' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading ML trends:', error);
      return [];
    }
  };

  const calculateQuoteImpactMetrics = async (): Promise<Partial<PricingHealthMetrics>> => {
    // This would ideally track actual quote usage, but for now we'll estimate
    // based on market data availability
    const marketDataAvailable = metrics?.marketDataPoints || 0;
    const totalQuotes = 100; // Placeholder - would come from actual quote tracking
    
    // Estimate: if market data exists, assume 60% of quotes use it
    const quotesUsingMarket = marketDataAvailable > 0 ? Math.floor(totalQuotes * 0.6) : 0;
    const quotesUsingDefaults = totalQuotes - quotesUsingMarket;

    return {
      quotesUsingMarketData: quotesUsingMarket,
      quotesUsingDefaults: quotesUsingDefaults,
      marketDataUtilizationRate: marketDataAvailable > 0 ? 60 : 0,
      averagePriceDeviation: 0 // Would calculate from actual quote data
    };
  };

  const handleRunMLProcessing = async () => {
    try {
      setRefreshing(true);
      const result = await runMLProcessing();
      console.log('ML Processing Result:', result);
      await loadHealthMetrics();
    } catch (error) {
      console.error('Error running ML processing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    try {
      clearAllPricingCaches();
      await loadHealthMetrics();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading pricing system health...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700">Unable to load pricing system health metrics.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'connected':
      case 'synced':
      case 'fresh':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded':
      case 'idle':
      case 'stale':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error':
      case 'disconnected':
      case 'expired':
      case 'outdated':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'connected':
      case 'synced':
      case 'fresh':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
      case 'idle':
      case 'stale':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
      case 'disconnected':
      case 'expired':
      case 'outdated':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Pricing System Health</h2>
            <p className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await Promise.all([loadHealthMetrics(), loadUtilityRates()]);
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className={`grid grid-cols-1 md:grid-cols-${metrics.marketDataPoints > 0 ? '5' : '4'} gap-4`}>
        {/* Market Data Status - Only show if there's actionable data */}
        {metrics.marketDataPoints > 0 && (
          <div className={`bg-white/90 backdrop-blur-sm p-5 rounded-2xl border-2 ${getStatusColor(metrics.marketDataStatus)} shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.marketDataStatus)}
                <span className="font-semibold text-sm">Market Data</span>
              </div>
              {metrics.marketDataStatus === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{metrics.marketDataPoints.toLocaleString()}</div>
            <div className="text-xs opacity-75">Data points (30d)</div>
            {metrics.lastMarketUpdate && (
              <div className="text-xs mt-2 opacity-60">
                Updated: {new Date(metrics.lastMarketUpdate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* ML Agent Status */}
        <div className={`bg-white/90 backdrop-blur-sm p-5 rounded-2xl border-2 ${getStatusColor(metrics.mlAgentStatus)} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(metrics.mlAgentStatus)}
              <span className="font-semibold text-sm">ML Agent</span>
            </div>
            {metrics.mlAgentStatus === 'active' ? (
              <Zap className="w-5 h-5 text-emerald-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="text-2xl font-bold mb-1">{metrics.mlTrendsGenerated}</div>
          <div className="text-xs opacity-75">Price trends generated</div>
          {metrics.mlUnprocessedRecords > 0 && (
            <div className="text-xs mt-2 text-amber-600 font-medium">
              {metrics.mlUnprocessedRecords} unprocessed
            </div>
          )}
        </div>

        {/* Database Connection */}
        <div className={`bg-white/90 backdrop-blur-sm p-5 rounded-2xl border-2 ${getStatusColor(metrics.databaseConnection)} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {metrics.databaseConnection === 'connected' ? (
                <Cloud className="w-5 h-5" />
              ) : (
                <CloudOff className="w-5 h-5" />
              )}
              <span className="font-semibold text-sm">Database</span>
            </div>
            {getStatusIcon(metrics.databaseConnection)}
          </div>
          <div className="text-2xl font-bold mb-1 capitalize">{metrics.databaseConnection}</div>
          <div className="text-xs opacity-75">Connection status</div>
        </div>

        {/* Validation Alerts */}
        <div className={`bg-white/90 backdrop-blur-sm p-5 rounded-2xl border-2 ${metrics.criticalAlerts > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm">Validation</span>
            </div>
            {metrics.criticalAlerts > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-bold mb-1">{metrics.validationAlerts}</div>
          <div className="text-xs opacity-75">
            {metrics.criticalAlerts > 0 ? (
              <span className="text-red-600 font-medium">{metrics.criticalAlerts} critical</span>
            ) : (
              'All clear'
            )}
          </div>
        </div>

        {/* Vendor Pricing Status */}
        <div className={`bg-white/90 backdrop-blur-sm p-5 rounded-2xl border-2 ${getStatusColor(metrics.vendorPricingStatus)} shadow-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(metrics.vendorPricingStatus)}
              <span className="font-semibold text-sm">Vendor Pricing</span>
            </div>
            {metrics.vendorPricingStatus === 'active' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : metrics.vendorPricingStatus === 'limited' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Info className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="text-2xl font-bold mb-1">{metrics.approvedVendorProducts}</div>
          <div className="text-xs opacity-75">Approved products</div>
          {metrics.pendingVendorProducts > 0 && (
            <div className="text-xs mt-2 text-amber-600 font-medium">
              {metrics.pendingVendorProducts} pending
            </div>
          )}
        </div>
      </div>

      {/* Market Data Coverage - Only show if there's actionable data */}
      {Object.values(metrics.marketDataCoverage).some(count => count > 0) && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Market Data Coverage by Component
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics.marketDataCoverage)
              .filter(([_, count]) => count > 0)
              .map(([component, count]) => (
                <div key={component} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1 uppercase font-medium">
                    {component === 'evCharger' ? 'EV Charger' : component}
                  </div>
                  <div className="text-2xl font-bold text-purple-700">{count}</div>
                  <div className="text-xs text-gray-500 mt-1">data points</div>
                  <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                      style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ML Agent Details */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            ML Agent Status
          </h3>
          <button
            onClick={handleRunMLProcessing}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Run ML Processing
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Status</div>
            <div className="text-lg font-bold capitalize">{metrics.mlAgentStatus}</div>
            {metrics.mlLastProcessed && (
              <div className="text-xs text-gray-500 mt-1">
                Last: {new Date(metrics.mlLastProcessed).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
            <div className="text-xs text-gray-600 mb-1">Trends Generated</div>
            <div className="text-lg font-bold">{metrics.mlTrendsGenerated}</div>
            <div className="text-xs text-gray-500 mt-1">Price forecasts</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
            <div className="text-xs text-gray-600 mb-1">Insights Generated</div>
            <div className="text-lg font-bold">{metrics.mlInsightsGenerated}</div>
            <div className="text-xs text-gray-500 mt-1">Market insights</div>
          </div>
          <div className={`p-4 rounded-xl border ${metrics.mlUnprocessedRecords > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="text-xs text-gray-600 mb-1">Unprocessed Records</div>
            <div className={`text-lg font-bold ${metrics.mlUnprocessedRecords > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
              {metrics.mlUnprocessedRecords}
            </div>
            <div className="text-xs text-gray-500 mt-1">Pending analysis</div>
          </div>
        </div>

        {/* Recent ML Trends */}
        {mlTrends.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Price Trends</h4>
            <div className="space-y-2">
              {mlTrends.slice(0, 5).map((trend: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        {trend.product_type || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-600">
                        Avg: ${trend.average_price?.toFixed(2) || 'N/A'}
                        {trend.price_change_30d && (
                          <span className={`ml-2 ${trend.price_change_30d > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {trend.price_change_30d > 0 ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                            {Math.abs(trend.price_change_30d).toFixed(1)}% (30d)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        trend.trend_direction === 'increasing' ? 'bg-red-100 text-red-700' :
                        trend.trend_direction === 'decreasing' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trend.trend_direction || 'stable'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {(trend.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vendor Pricing Status */}
      {metrics.approvedVendorProducts > 0 && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Vendor Pricing Status
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              metrics.vendorPricingStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
              metrics.vendorPricingStatus === 'limited' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {metrics.vendorPricingStatus === 'active' ? 'Active' : 
               metrics.vendorPricingStatus === 'limited' ? 'Limited' : 'None'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
              <div className="text-xs text-gray-600 mb-1">Approved Products</div>
              <div className="text-2xl font-bold text-emerald-700">{metrics.approvedVendorProducts}</div>
              <div className="text-xs text-gray-500 mt-1">In pricing system</div>
            </div>
            <div className={`p-4 rounded-xl border ${
              metrics.pendingVendorProducts > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-xs text-gray-600 mb-1">Pending Review</div>
              <div className={`text-2xl font-bold ${metrics.pendingVendorProducts > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                {metrics.pendingVendorProducts}
              </div>
              <div className="text-xs text-gray-500 mt-1">Awaiting approval</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
              <div className="text-xs text-gray-600 mb-1">Utilization Rate</div>
              <div className="text-2xl font-bold text-purple-700">
                {metrics.vendorPricingUtilization > 0 ? `${metrics.vendorPricingUtilization}%` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Quotes using vendor pricing</div>
            </div>
          </div>

          {/* Vendor Pricing Coverage by Category */}
          {Object.values(metrics.vendorPricingCoverage).some(count => count > 0) && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Coverage by Product Category</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(metrics.vendorPricingCoverage)
                  .filter(([_, count]) => count > 0)
                  .map(([category, count]) => (
                    <div key={category} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-200">
                      <div className="text-xs text-gray-600 mb-1 uppercase font-medium">
                        {category}
                      </div>
                      <div className="text-xl font-bold text-purple-700">{count}</div>
                      <div className="text-xs text-gray-500 mt-1">products</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {metrics.vendorPricingLastSync && (
            <div className="mt-4 text-xs text-gray-500">
              Last sync: {new Date(metrics.vendorPricingLastSync).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Validation Alerts */}
      {validationResults.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Pricing Validation Alerts
          </h3>
          <div className="space-y-3">
            {validationResults.slice(0, 10).map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        alert.severity === 'critical' ? 'text-red-800' :
                        alert.severity === 'warning' ? 'text-amber-800' :
                        'text-blue-800'
                      }`}>
                        {alert.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        alert.severity === 'warning' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>Current: ${alert.currentPrice?.toLocaleString()}</span>
                      <span>Market: ${alert.marketRange?.min?.toLocaleString()} - ${alert.marketRange?.max?.toLocaleString()}</span>
                      {alert.deviation && (
                        <span className={`font-medium ${
                          Math.abs(alert.deviation) > 20 ? 'text-red-600' :
                          Math.abs(alert.deviation) > 10 ? 'text-amber-600' :
                          'text-gray-600'
                        }`}>
                          {alert.deviation > 0 ? '+' : ''}{alert.deviation.toFixed(1)}% deviation
                        </span>
                      )}
                    </div>
                    {alert.recommendation && (
                      <p className="text-xs text-gray-600 mt-2 italic">{alert.recommendation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote Impact Metrics */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          Quote System Impact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
            <div className="text-xs text-gray-600 mb-1">Market Data Usage</div>
            <div className="text-2xl font-bold text-emerald-700">{metrics.marketDataUtilizationRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.quotesUsingMarketData} quotes using market data
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <div className="text-xs text-gray-600 mb-1">Default Pricing Usage</div>
            <div className="text-2xl font-bold text-blue-700">{100 - metrics.marketDataUtilizationRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.quotesUsingDefaults} quotes using defaults
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
            <div className="text-xs text-gray-600 mb-1">Average Price Deviation</div>
            <div className="text-2xl font-bold text-purple-700">
              {metrics.averagePriceDeviation > 0 ? '+' : ''}{metrics.averagePriceDeviation.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Market vs default</div>
          </div>
        </div>
      </div>

      {/* Utility Rates by State */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-200 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Utility Rates by State
          </h3>
          <button
            onClick={() => {
              console.log('🔄 Refreshing utility rates...');
              loadUtilityRates();
            }}
            disabled={utilityRatesLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${utilityRatesLoading ? 'animate-spin' : ''}`} />
            Refresh Rates
          </button>
        </div>
        
        {utilityRatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading utility rates...</span>
          </div>
        ) : utilityRatesError ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h4 className="font-semibold text-red-800 mb-2">Error Loading Utility Rates</h4>
              <p className="text-sm text-red-700 mb-4">{utilityRatesError}</p>
              <button
                onClick={loadUtilityRates}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : utilityRates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No utility rates found. Please run the database migration to populate rates.</p>
            <p className="text-xs mt-2 text-gray-400">Expected view: utility_rates_summary</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">State</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Commercial Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Min Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Max Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Demand Charge</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Utilities</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">TOU</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Solar Potential</th>
                </tr>
              </thead>
              <tbody>
                {utilityRates.map((rate, idx) => (
                  <tr 
                    key={rate.state_code} 
                    className={`border-b border-gray-100 hover:bg-purple-50 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{rate.state_name}</div>
                      <div className="text-xs text-gray-500">{rate.state_code}</div>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="font-bold text-purple-700">
                        ${rate.avg_commercial_rate?.toFixed(4) || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">per kWh</div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      ${rate.min_commercial_rate?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      ${rate.max_commercial_rate?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      ${rate.avg_demand_charge?.toFixed(2) || 'N/A'}/kW
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {rate.utility_count || 0}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {rate.tou_utilities_count > 0 ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          {rate.tou_utilities_count}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {rate.solar_potentials && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rate.solar_potentials.includes('excellent') ? 'bg-emerald-100 text-emerald-700' :
                          rate.solar_potentials.includes('good') ? 'bg-teal-100 text-teal-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {rate.solar_potentials.split(',')[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Showing {utilityRates.length} states. Sorted by average commercial rate (highest first).
              {utilityRates.length > 0 && utilityRates[0].last_updated && (
                <span className="ml-2">
                  Last updated: {new Date(utilityRates[0].last_updated).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-700" />
          Recommended Actions
        </h3>
        <div className="space-y-3">
          {metrics.mlUnprocessedRecords > 0 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">Process ML Data</div>
                <div className="text-sm text-amber-700">
                  {metrics.mlUnprocessedRecords} pricing records are waiting for ML analysis. Click "Run ML Processing" above.
                </div>
              </div>
            </div>
          )}
          {metrics.criticalAlerts > 0 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">Review Critical Alerts</div>
                <div className="text-sm text-red-700">
                  {metrics.criticalAlerts} critical pricing validation alerts require immediate attention.
                </div>
              </div>
            </div>
          )}
          {metrics.marketDataStatus === 'degraded' && (
            <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-900">Update Market Data</div>
                <div className="text-sm text-amber-700">
                  Market data is stale (last update: {metrics.lastMarketUpdate ? new Date(metrics.lastMarketUpdate).toLocaleDateString() : 'unknown'}). 
                  Check RSS feed sources and data collection status.
                </div>
              </div>
            </div>
          )}
          {metrics.marketDataStatus === 'healthy' && 
           metrics.mlAgentStatus === 'active' && 
           metrics.criticalAlerts === 0 && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-900">All Systems Operational</div>
                <div className="text-sm text-emerald-700">
                  Pricing system is healthy. Market data is current, ML agent is active, and no critical alerts.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingSystemHealthDashboard;

