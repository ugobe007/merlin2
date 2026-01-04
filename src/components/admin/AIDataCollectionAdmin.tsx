import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { runDailyDataCollection } from '../../services/aiDataCollectionService';
import { runMLProcessing, getLatestMLInsights, type PriceTrendAnalysis, type MarketInsight } from '../../services/mlProcessingService';
import { runRSSFetchCycle, checkRSSFeedHealth, RSS_SOURCES, toggleRSSSource } from '../../services/rssAutoFetchService';
import { Database, TrendingUp, RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Package, DollarSign, Zap, Rss, Brain, AlertTriangle, ArrowUp, ArrowDown, Minus, Plus, Edit2, Trash2, Globe, ExternalLink, Save, X } from 'lucide-react';

// RSS Feed interface for management
interface ManagedRSSFeed {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  category: 'market' | 'technology' | 'policy' | 'company';
  enabled: boolean;
  isCustom?: boolean;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'rss' | 'ml' | 'feeds'>('overview');
  const [rssFeedStatus, setRssFeedStatus] = useState<RSSFeedStatus[]>([]);
  const [priceTrends, setPriceTrends] = useState<PriceTrendAnalysis[]>([]);
  
  // RSS Feed Management State
  const [managedFeeds, setManagedFeeds] = useState<ManagedRSSFeed[]>([]);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [editingFeed, setEditingFeed] = useState<ManagedRSSFeed | null>(null);
  const [newFeed, setNewFeed] = useState({ name: '', url: '', feedUrl: '', category: 'market' as const });
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [lastMLProcessed, setLastMLProcessed] = useState<string>('Never');

  useEffect(() => {
    loadCollectionData();
    loadMLData();
    loadManagedFeeds();
  }, []);

  function loadManagedFeeds() {
    // Initialize with RSS_SOURCES from rssAutoFetchService
    const initialFeeds: ManagedRSSFeed[] = RSS_SOURCES.map((source, index) => ({
      id: `builtin-${index}`,
      name: source.name,
      url: source.url,
      feedUrl: source.feedUrl,
      category: source.category,
      enabled: source.enabled,
      isCustom: false
    }));
    
    // Load custom feeds from localStorage (in production, this would be Supabase)
    const customFeedsJson = localStorage.getItem('merlin_custom_rss_feeds');
    if (customFeedsJson) {
      try {
        const customFeeds = JSON.parse(customFeedsJson);
        initialFeeds.push(...customFeeds.map((f: any) => ({ ...f, isCustom: true })));
      } catch (e) {
        console.error('Error loading custom feeds:', e);
      }
    }
    
    setManagedFeeds(initialFeeds);
  }

  function saveCustomFeeds(feeds: ManagedRSSFeed[]) {
    const customFeeds = feeds.filter(f => f.isCustom);
    localStorage.setItem('merlin_custom_rss_feeds', JSON.stringify(customFeeds));
  }

  function handleAddFeed() {
    if (!newFeed.name || !newFeed.feedUrl) return;
    
    const feed: ManagedRSSFeed = {
      id: `custom-${Date.now()}`,
      name: newFeed.name,
      url: newFeed.url || newFeed.feedUrl.replace('/feed/', '').replace('/rss', ''),
      feedUrl: newFeed.feedUrl,
      category: newFeed.category,
      enabled: true,
      isCustom: true
    };
    
    const updatedFeeds = [...managedFeeds, feed];
    setManagedFeeds(updatedFeeds);
    saveCustomFeeds(updatedFeeds);
    setNewFeed({ name: '', url: '', feedUrl: '', category: 'market' });
    setShowAddFeed(false);
  }

  function handleUpdateFeed(feed: ManagedRSSFeed) {
    const updatedFeeds = managedFeeds.map(f => f.id === feed.id ? feed : f);
    setManagedFeeds(updatedFeeds);
    saveCustomFeeds(updatedFeeds);
    setEditingFeed(null);
  }

  function handleDeleteFeed(feedId: string) {
    const updatedFeeds = managedFeeds.filter(f => f.id !== feedId);
    setManagedFeeds(updatedFeeds);
    saveCustomFeeds(updatedFeeds);
  }

  function handleToggleFeed(feedId: string) {
    const feed = managedFeeds.find(f => f.id === feedId);
    if (feed) {
      // For built-in feeds, use the toggle function from the service
      if (!feed.isCustom) {
        toggleRSSSource(feed.name, !feed.enabled);
      }
      const updatedFeeds = managedFeeds.map(f => 
        f.id === feedId ? { ...f, enabled: !f.enabled } : f
      );
      setManagedFeeds(updatedFeeds);
      saveCustomFeeds(updatedFeeds);
    }
  }

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">AI Data Collection & ML System</h2>
            <p className="text-xs text-gray-500">Automated data gathering and machine learning insights</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRSSFetch}
            disabled={isFetchingRSS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isFetchingRSS
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/20'
            }`}
          >
            <Rss className={`w-3.5 h-3.5 ${isFetchingRSS ? 'animate-pulse' : ''}`} />
            {isFetchingRSS ? 'Fetching...' : 'Fetch RSS'}
          </button>
          <button
            onClick={handleMLProcessing}
            disabled={isRunningML}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isRunningML
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20'
            }`}
          >
            <Brain className={`w-3.5 h-3.5 ${isRunningML ? 'animate-spin' : ''}`} />
            {isRunningML ? 'Processing...' : 'Run ML'}
          </button>
          <button
            onClick={handleManualCollection}
            disabled={isCollecting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isCollecting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCollecting ? 'animate-spin' : ''}`} />
            {isCollecting ? 'Collecting...' : 'Collect Data'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { key: 'overview', label: '📊 Overview', icon: BarChart3 },
          { key: 'feeds', label: '⚙️ Manage Feeds', icon: Globe },
          { key: 'rss', label: '📰 RSS Status', icon: Rss },
          { key: 'ml', label: '🤖 ML Insights', icon: Brain }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/80 text-gray-600 hover:text-purple-700 hover:bg-purple-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Manage Feeds Tab - NEW */}
      {activeTab === 'feeds' && (
        <>
          {/* Add Feed Form */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-emerald-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add News Source
              </h3>
              <button
                onClick={() => setShowAddFeed(!showAddFeed)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showAddFeed 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {showAddFeed ? 'Cancel' : '+ Add RSS Feed'}
              </button>
            </div>
            
            {showAddFeed && (
              <div className="grid md:grid-cols-4 gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Feed Name *</label>
                  <input
                    type="text"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bloomberg Energy"
                    className="w-full mt-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">RSS Feed URL *</label>
                  <input
                    type="url"
                    value={newFeed.feedUrl}
                    onChange={(e) => setNewFeed(prev => ({ ...prev, feedUrl: e.target.value }))}
                    placeholder="https://example.com/feed/"
                    className="w-full mt-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Category</label>
                  <select
                    value={newFeed.category}
                    onChange={(e) => setNewFeed(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full mt-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
                  >
                    <option value="market">📈 Market</option>
                    <option value="technology">🔧 Technology</option>
                    <option value="policy">📋 Policy</option>
                    <option value="company">🏢 Company</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddFeed}
                    disabled={!newFeed.name || !newFeed.feedUrl}
                    className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Add Feed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feed List */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-purple-100/50 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Rss className="w-4 h-4 text-purple-500" />
              Configured News Sources ({managedFeeds.length})
            </h3>
            
            <div className="space-y-2">
              {managedFeeds.map((feed) => (
                <div 
                  key={feed.id}
                  className={`p-3 rounded-lg border transition-all ${
                    feed.enabled 
                      ? 'bg-white border-gray-200 hover:border-purple-300' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  {editingFeed?.id === feed.id ? (
                    // Edit Mode
                    <div className="grid md:grid-cols-5 gap-2 items-center">
                      <input
                        type="text"
                        value={editingFeed.name}
                        onChange={(e) => setEditingFeed({ ...editingFeed, name: e.target.value })}
                        className="px-2 py-1 text-sm bg-white border border-purple-300 rounded focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                      <input
                        type="url"
                        value={editingFeed.feedUrl}
                        onChange={(e) => setEditingFeed({ ...editingFeed, feedUrl: e.target.value })}
                        className="px-2 py-1 text-sm bg-white border border-purple-300 rounded focus:ring-2 focus:ring-purple-100 outline-none"
                      />
                      <select
                        value={editingFeed.category}
                        onChange={(e) => setEditingFeed({ ...editingFeed, category: e.target.value as any })}
                        className="px-2 py-1 text-sm bg-white border border-purple-300 rounded focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        <option value="market">Market</option>
                        <option value="technology">Technology</option>
                        <option value="policy">Policy</option>
                        <option value="company">Company</option>
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateFeed(editingFeed)}
                          className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingFeed(null)}
                          className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleFeed(feed.id)}
                          className={`w-10 h-5 rounded-full transition-all ${
                            feed.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            feed.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{feed.name}</span>
                            <span className={`px-1.5 py-0.5 text-xs rounded ${
                              feed.category === 'market' ? 'bg-blue-100 text-blue-700' :
                              feed.category === 'technology' ? 'bg-purple-100 text-purple-700' :
                              feed.category === 'policy' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {feed.category}
                            </span>
                            {feed.isCustom && (
                              <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">Custom</span>
                            )}
                          </div>
                          <a 
                            href={feed.feedUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1"
                          >
                            {feed.feedUrl.substring(0, 50)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {feed.isCustom && (
                          <>
                            <button
                              onClick={() => setEditingFeed(feed)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFeed(feed.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <a
                          href={feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {managedFeeds.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Rss className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No RSS feeds configured</p>
              </div>
            )}
          </div>
          
          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700 text-sm">
              <strong>💡 Tips for adding RSS feeds:</strong><br/>
              • Look for RSS/Atom icons on news sites, or try adding <code className="bg-blue-100 px-1 rounded">/feed/</code> or <code className="bg-blue-100 px-1 rounded">/rss</code> to the site URL<br/>
              • Good sources: Energy Storage News, Utility Dive, PV Magazine, CleanTechnica, Reuters Energy<br/>
              • Custom feeds are stored locally and will be included in automated fetching
            </p>
          </div>
        </>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Status Overview */}
          <div className="grid md:grid-cols-4 gap-4">
        {/* Last Collection */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-blue-100/50 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <p className="text-blue-600 text-xs font-semibold uppercase">Last Collection</p>
          </div>
          {lastCollection ? (
            <>
              <p className="text-gray-800 text-xl font-bold">{getTimeAgo(lastCollection.collection_date)}</p>
              <p className="text-blue-500 text-xs mt-1">
                {formatDuration(lastCollection.duration_seconds)} duration
              </p>
            </>
          ) : (
            <p className="text-gray-600 text-lg">No data yet</p>
          )}
        </div>

        {/* Success Rate */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-emerald-100/50 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <p className="text-emerald-600 text-xs font-semibold uppercase">Success Rate</p>
          </div>
          <p className="text-gray-800 text-xl font-bold">{successRate}%</p>
          <p className="text-emerald-500 text-xs mt-1">
            {collectionLogs.filter(log => log.status === 'success').length}/{collectionLogs.length} successful
          </p>
        </div>

        {/* Total Items */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-purple-100/50 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <p className="text-purple-600 text-xs font-semibold uppercase">Total Records</p>
          </div>
          <p className="text-gray-800 text-xl font-bold">
            {Object.values(dataStats).reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
          <p className="text-purple-500 text-xs mt-1">Across all sources</p>
        </div>

        {/* Status */}
        <div className={`bg-white/80 backdrop-blur-md p-4 rounded-xl border shadow-lg ${
          lastCollection?.status === 'success'
            ? 'border-emerald-100/50'
            : 'border-red-100/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              lastCollection?.status === 'success'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                : 'bg-gradient-to-br from-red-500 to-rose-500'
            }`}>
              {lastCollection?.status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <XCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <p className={`text-xs font-semibold uppercase ${
              lastCollection?.status === 'success' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              System Status
            </p>
          </div>
          <p className="text-gray-800 text-xl font-bold capitalize">
            {lastCollection?.status || 'Unknown'}
          </p>
          <p className={`text-xs mt-1 ${
            lastCollection?.status === 'success' ? 'text-emerald-500' : 'text-red-500'
          }`}>
            All systems operational
          </p>
        </div>
      </div>

      {/* Data Source Statistics */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-purple-100/50 shadow-lg">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          Data Source Statistics
        </h3>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-gray-600 text-xs">Battery Pricing</p>
            </div>
            <p className="text-gray-800 text-lg font-bold">{dataStats.batteryPricing.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">price points</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <p className="text-gray-600 text-xs">Products</p>
            </div>
            <p className="text-gray-800 text-lg font-bold">{dataStats.products.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">catalog items</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-200/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-gray-600 text-xs">Financing</p>
            </div>
            <p className="text-gray-800 text-lg font-bold">{dataStats.financing.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">options</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
              <p className="text-gray-600 text-xs">Industry News</p>
            </div>
            <p className="text-gray-800 text-lg font-bold">{dataStats.news.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">articles</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-gray-600 text-xs">Incentives</p>
            </div>
            <p className="text-gray-800 text-lg font-bold">{dataStats.incentives.toLocaleString()}</p>
            <p className="text-gray-400 text-xs mt-0.5">programs</p>
          </div>
        </div>
      </div>

      {/* Collection History */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-purple-100/50 shadow-lg">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Collection History</h3>
        <div className="space-y-2">
          {collectionLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No collection logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-purple-50/50">
                      <td className="py-3 text-gray-800">
                        {new Date(log.collection_date).toLocaleString()}
                        <span className="text-gray-400 text-sm ml-2">
                          ({getTimeAgo(log.collection_date)})
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {formatDuration(log.duration_seconds)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {log.items_collected || 'N/A'}
                      </td>
                      <td className="py-3 text-red-600 text-sm max-w-xs truncate">
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          <strong>ℹ️ Auto-Collection:</strong> The system automatically collects data daily at 2:00 AM. 
          You can manually trigger a collection at any time using the buttons above.
        </p>
      </div>
        </>
      )}

      {activeTab === 'rss' && (
        <>
          {/* RSS Feed Status */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-orange-200/50 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Rss className="w-4 h-4 text-orange-500" />
              RSS Feed Sources
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              10 industry feeds configured for automated content extraction and ML training.
            </p>
            
            {rssFeedStatus.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {rssFeedStatus.map((feed, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    feed.status === 'ok' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 text-sm font-medium">{feed.source}</span>
                      {feed.status === 'ok' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {feed.status === 'ok' ? (
                      <p className="text-emerald-600 text-xs mt-1">{feed.articlesFound} articles found</p>
                    ) : (
                      <p className="text-red-600 text-xs mt-1">{feed.error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Rss className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Click "Fetch RSS" to check feed status</p>
              </div>
            )}
          </div>

          {/* AI Training Data */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-purple-100/50 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              AI Training Data Extracted
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200/50 text-center">
                <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-800">{dataStats.aiTrainingData}</p>
                <p className="text-gray-500 text-xs">Total Training Records</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200/50 text-center">
                <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-800">{priceTrends.length}</p>
                <p className="text-gray-500 text-xs">Price Trends Analyzed</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200/50 text-center">
                <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-800">{marketInsights.length}</p>
                <p className="text-gray-500 text-xs">Market Insights Generated</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ml' && (
        <>
          {/* ML Processing Status */}
          <div className="bg-gradient-to-br from-purple-100 to-violet-100 p-5 rounded-xl border border-purple-200/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                ML Processing Status
              </h3>
              <span className="text-xs text-gray-500">
                Last processed: {lastMLProcessed === 'Never' ? 'Never' : getTimeAgo(lastMLProcessed)}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white/80 p-3 rounded-lg border border-purple-200/50">
                <p className="text-purple-600 text-xs font-semibold mb-1">PRICE TREND ANALYSIS</p>
                <p className="text-gray-700 text-sm">Linear regression on pricing data to forecast trends</p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-pink-200/50">
                <p className="text-pink-600 text-xs font-semibold mb-1">MARKET INSIGHTS</p>
                <p className="text-gray-700 text-sm">Pattern detection across news and trends</p>
              </div>
            </div>
          </div>

          {/* Price Trends */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-blue-200/50 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Price Trends
            </h3>
            {priceTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-200">
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
                      <tr key={index} className="border-b border-gray-100 hover:bg-purple-50/50">
                        <td className="py-3 text-gray-800 font-medium">{trend.productType}</td>
                        <td className="py-3 text-emerald-600">${trend.averagePrice.toFixed(2)}</td>
                        <td className={`py-3 flex items-center gap-1 ${
                          trend.priceChange30d < 0 ? 'text-emerald-600' : trend.priceChange30d > 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {trend.priceChange30d < 0 ? <ArrowDown className="w-4 h-4" /> : 
                           trend.priceChange30d > 0 ? <ArrowUp className="w-4 h-4" /> : 
                           <Minus className="w-4 h-4" />}
                          {Math.abs(trend.priceChange30d).toFixed(1)}%
                        </td>
                        <td className={`py-3 ${
                          trend.priceChange90d < 0 ? 'text-emerald-600' : trend.priceChange90d > 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {trend.priceChange90d > 0 ? '+' : ''}{trend.priceChange90d.toFixed(1)}%
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trend.trend === 'decreasing' ? 'bg-emerald-100 text-emerald-700' :
                            trend.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {trend.trend.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-blue-600">${trend.forecastNextQuarter.toFixed(2)}</td>
                        <td className="py-3 text-gray-600">{(trend.confidence * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No price trends available. Run ML processing to generate insights.</p>
              </div>
            )}
          </div>

          {/* Market Insights */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-xl border border-amber-200/50 shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Market Insights
            </h3>
            {marketInsights.length > 0 ? (
              <div className="space-y-3">
                {marketInsights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.impact === 'high' ? 'bg-red-50 border-red-500' :
                    insight.impact === 'medium' ? 'bg-amber-50 border-amber-500' :
                    'bg-emerald-50 border-emerald-500'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {insight.impact.toUpperCase()} IMPACT
                      </span>
                      <span className="text-gray-400 text-xs">
                        {insight.sourceCount} sources • {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm">{insight.insight}</p>
                    {insight.affectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {insight.affectedProducts.map((product, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
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
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No market insights available. Run ML processing to generate insights.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
