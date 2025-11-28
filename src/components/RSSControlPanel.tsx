import React, { useState, useEffect } from 'react';
import { Rss, Play, Pause, RefreshCw, CheckCircle, XCircle, Activity, Database } from 'lucide-react';
import { 
  RSS_SOURCES, 
  runRSSFetchCycle, 
  scheduleRSSFetching,
  checkRSSFeedHealth,
  toggleRSSSource
} from '../services/rssAutoFetchService';
import { getAIDataStats } from '../services/rssToAIDatabase';

interface RSSControlPanelProps {
  onClose?: () => void;
}

const RSSControlPanel: React.FC<RSSControlPanelProps> = ({ onClose }) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [intervalHours, setIntervalHours] = useState(6);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fetchStatus, setFetchStatus] = useState<{
    articlesFound: number;
    alertsCreated: number;
    errors: number;
  } | null>(null);
  const [feedHealth, setFeedHealth] = useState<Array<{
    source: string;
    status: 'ok' | 'error';
    articlesFound?: number;
    error?: string;
  }>>([]);
  const [aiDataStats, setAIDataStats] = useState<{
    totalRecords: number;
    byType: { [key: string]: number };
    bySource: { [key: string]: number };
    lastUpdated: string;
  } | null>(null);
  const [stopSchedule, setStopSchedule] = useState<(() => void) | null>(null);

  // Check feed health and AI data stats on mount
  useEffect(() => {
    handleCheckHealth();
    loadAIDataStats();
  }, []);

  const loadAIDataStats = async () => {
    const stats = await getAIDataStats();
    setAIDataStats(stats);
  };

  const handleManualFetch = async () => {
    setIsFetching(true);
    try {
      const result = await runRSSFetchCycle();
      setFetchStatus(result);
      setLastFetch(new Date());
      // Refresh AI data stats after fetch
      await loadAIDataStats();
    } catch (error) {
      console.error('Manual fetch failed:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleStartSchedule = () => {
    const cleanup = scheduleRSSFetching(intervalHours);
    setStopSchedule(() => cleanup);
    setIsScheduled(true);
    setLastFetch(new Date());
  };

  const handleStopSchedule = () => {
    if (stopSchedule) {
      stopSchedule();
      setStopSchedule(null);
    }
    setIsScheduled(false);
  };

  const handleCheckHealth = async () => {
    const health = await checkRSSFeedHealth();
    setFeedHealth(health);
  };

  const handleToggleSource = (sourceName: string, enabled: boolean) => {
    toggleRSSSource(sourceName, enabled);
    handleCheckHealth(); // Refresh health status
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rss className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">RSS Auto-Fetch Control</h2>
                <p className="text-orange-100 text-sm">Automated industry news collection and price alert generation</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Fetch */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Manual Fetch
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Fetch and process articles immediately from all enabled RSS feeds.
              </p>
              <button
                onClick={handleManualFetch}
                disabled={isFetching}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  isFetching
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isFetching ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Fetch Now
                  </span>
                )}
              </button>

              {fetchStatus && (
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong>Last Fetch:</strong> {lastFetch?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Articles Found:</strong> {fetchStatus.articlesFound}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Alerts Created:</strong> {fetchStatus.alertsCreated}
                  </p>
                </div>
              )}
            </div>

            {/* Scheduled Fetch */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Scheduled Fetch
              </h3>
              <p className="text-sm text-green-800 mb-4">
                Automatically fetch news at regular intervals.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-green-900 mb-2">
                  Fetch Interval (hours)
                </label>
                <input
                  type="number"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(Number(e.target.value))}
                  min="1"
                  max="24"
                  disabled={isScheduled}
                  className="w-full px-4 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <button
                onClick={isScheduled ? handleStopSchedule : handleStartSchedule}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ${
                  isScheduled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isScheduled ? (
                  <span className="flex items-center justify-center gap-2">
                    <Pause className="w-5 h-5" />
                    Stop Scheduled Fetch
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Start Scheduled Fetch
                  </span>
                )}
              </button>

              {isScheduled && (
                <div className="mt-4 p-3 bg-white rounded border border-green-200">
                  <p className="text-sm text-green-800 font-semibold">
                    ✅ Active - Fetching every {intervalHours} hours
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Next fetch in approximately {intervalHours} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI/ML Database Stats */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              AI/ML Training Database
            </h3>
            <p className="text-sm text-purple-800 mb-4">
              Extracted data from RSS feeds for AI training and pricing intelligence
            </p>
            
            {aiDataStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">{aiDataStats.totalRecords}</div>
                    <div className="text-xs text-purple-600">Total Records</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-blue-900">{aiDataStats.byType.pricing || 0}</div>
                    <div className="text-xs text-blue-600">💰 Pricing Data</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-green-900">{aiDataStats.byType.configuration || 0}</div>
                    <div className="text-xs text-green-600">⚙️ Configurations</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-2xl font-bold text-orange-900">{aiDataStats.byType.market_trend || 0}</div>
                    <div className="text-xs text-orange-600">📈 Market Trends</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-gray-600 mb-2">
                    <strong>Last Updated:</strong> {new Date(aiDataStats.lastUpdated).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Data Types:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>💰 Pricing: $/kWh, $/kW, contract values</li>
                      <li>⚙️ Configurations: Product specs, capacities, warranties</li>
                      <li>📈 Trends: Price changes, new products, policy updates</li>
                    </ul>
                  </div>
                </div>
                
                <button
                  onClick={loadAIDataStats}
                  className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Stats
                </button>
              </>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                <p className="text-gray-600">Loading AI database statistics...</p>
              </div>
            )}
          </div>

          {/* RSS Sources */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Rss className="w-5 h-5" />
                RSS Sources ({RSS_SOURCES.length})
              </h3>
              <button
                onClick={handleCheckHealth}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Check Health
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RSS_SOURCES.map((source) => {
                const health = feedHealth.find(h => h.source === source.name);
                return (
                  <div
                    key={source.name}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      source.enabled
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{source.name}</h4>
                          {health && (
                            health.status === 'ok' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{source.url}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            source.category === 'market' ? 'bg-blue-100 text-blue-700' :
                            source.category === 'technology' ? 'bg-purple-100 text-purple-700' :
                            source.category === 'company' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {source.category}
                          </span>
                          {health?.articlesFound !== undefined && (
                            <span className="text-xs text-gray-600">
                              {health.articlesFound} articles
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={(e) => handleToggleSource(source.name, e.target.checked)}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 How it works:</strong> The RSS auto-fetch system monitors industry news sources, 
              extracts pricing information, and automatically creates price alerts. Articles are processed 
              in batches to avoid rate limiting, and only relevant content is forwarded to the AI service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSSControlPanel;
