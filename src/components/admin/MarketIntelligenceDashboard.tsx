/**
 * MARKET INTELLIGENCE DASHBOARD
 * =============================
 * 
 * Displays market inference analysis results:
 * - Market and price trends
 * - BESS configuration patterns
 * - Customer decision indicators
 * - Emerging opportunities
 * - Industry adoption rates
 * 
 * Created: January 3, 2025
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Zap, Lightbulb, Building2, RefreshCw, AlertCircle, DollarSign, Activity, Target, ExternalLink } from 'lucide-react';
import { runMarketInference, type MarketInference, type MarketTrend, type BESSConfigurationPattern, type CustomerDecisionIndicator, type EmergingOpportunity, type IndustryAdoptionRate, type PricingUpdateRecommendation } from '@/services/marketInferenceEngine';
import { supabase } from '@/services/supabaseClient';
import MarketIntelligenceDetailModal from './MarketIntelligenceDetailModal';

const MarketIntelligenceDashboard: React.FC = () => {
  const [inference, setInference] = useState<MarketInference | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'configs' | 'indicators' | 'opportunities' | 'adoption' | 'pricing'>('overview');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'trend' | 'config' | 'indicator' | 'opportunity' | 'adoption' | 'pricing';
    data: any;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadLatestInference();
    loadPendingApprovals();
  }, []);

  const loadLatestInference = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('market_inferences')
        .select('*')
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        // Check if it's a "table doesn't exist" error
        if (fetchError.message?.includes('does not exist') || fetchError.code === '42P01') {
          setError('Database table does not exist. Please run the migration: database/migrations/20250103_market_inference_tables.sql');
          return;
        }
        // For other errors, just log and continue (table might be empty)
        console.warn('Could not load inference:', fetchError.message);
        return;
      }

      if (data) {
        // If loaded data is empty or insufficient, generate sample data
        const hasData = (data.market_trends?.length || 0) > 0 && 
                       (data.bess_configurations?.length || 0) > 0 && 
                       (data.industry_adoption?.length || 0) > 0;
        
        if (!hasData) {
          // Data is incomplete - don't show placeholder data
          console.log('📊 Existing data is incomplete. Run analysis to generate insights.');
        } else {
          setInference({
            analysisDate: data.analysis_date,
            marketTrends: data.market_trends || [],
            bessConfigurations: data.bess_configurations || [],
            decisionIndicators: data.decision_indicators || [],
            emergingOpportunities: data.emerging_opportunities || [],
            industryAdoption: data.industry_adoption || [],
            overallMarketSentiment: data.overall_sentiment,
            confidence: data.confidence,
            dataPointsAnalyzed: data.data_points_analyzed,
            sources: data.sources || [],
            requiresPricingUpdate: data.requires_pricing_update,
            pricingUpdateRecommendations: data.pricing_update_recommendations || [],
          });
        }
      } else {
        // No data in database - don't show placeholder data
        console.log('📊 No existing inference data found. Run analysis to generate insights.');
      }
    } catch (err) {
      console.error('Error loading inference:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load market intelligence';
      if (errorMessage.includes('does not exist')) {
        setError('Database table does not exist. Please run the migration: database/migrations/20250103_market_inference_tables.sql');
      } else {
        setError(errorMessage);
      }
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data } = await supabase
        .from('pricing_update_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      setPendingApprovals(data || []);
    } catch (err) {
      console.error('Error loading approvals:', err);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runMarketInference(90);
      setInference(result);
      await loadPendingApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (type: 'trend' | 'config' | 'indicator' | 'opportunity' | 'adoption' | 'pricing', data: any) => {
    console.log('🔍 Opening detail modal:', { type, data });
    if (!data) {
      console.error('❌ No data provided to modal!');
      alert('No data available for this item.');
      return;
    }
    setSelectedItem({ type, data });
    setIsModalOpen(true);
  };

  const handleEdit = async (updatedData: any) => {
    if (!inference || !selectedItem) return;

    try {
      // Update the inference object
      const updatedInference = { ...inference };
      
      switch (selectedItem.type) {
        case 'trend':
          updatedInference.marketTrends = inference.marketTrends.map((t: MarketTrend, idx: number) => 
            t === selectedItem.data ? updatedData : t
          );
          break;
        case 'config':
          updatedInference.bessConfigurations = inference.bessConfigurations.map((c: BESSConfigurationPattern, idx: number) => 
            c === selectedItem.data ? updatedData : c
          );
          break;
        case 'indicator':
          updatedInference.decisionIndicators = inference.decisionIndicators.map((i: CustomerDecisionIndicator, idx: number) => 
            i === selectedItem.data ? updatedData : i
          );
          break;
        case 'opportunity':
          updatedInference.emergingOpportunities = inference.emergingOpportunities.map((o: EmergingOpportunity, idx: number) => 
            o === selectedItem.data ? updatedData : o
          );
          break;
        case 'adoption':
          updatedInference.industryAdoption = inference.industryAdoption.map((a: IndustryAdoptionRate, idx: number) => 
            a === selectedItem.data ? updatedData : a
          );
          break;
        case 'pricing':
          updatedInference.pricingUpdateRecommendations = (inference.pricingUpdateRecommendations || []).map((p: PricingUpdateRecommendation, idx: number) => 
            p === selectedItem.data ? updatedData : p
          );
          break;
      }

      // Save to database
      const { error } = await supabase
        .from('market_inferences')
        .update({
          market_trends: updatedInference.marketTrends,
          bess_configurations: updatedInference.bessConfigurations,
          decision_indicators: updatedInference.decisionIndicators,
          emerging_opportunities: updatedInference.emergingOpportunities,
          industry_adoption: updatedInference.industryAdoption,
          pricing_update_recommendations: updatedInference.pricingUpdateRecommendations,
          updated_at: new Date().toISOString(),
        })
        .eq('analysis_date', new Date(updatedInference.analysisDate).toISOString().split('T')[0]);

      if (error) throw error;

      setInference(updatedInference);
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error updating inference:', err);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!inference || !selectedItem || !confirm('Are you sure you want to delete this item?')) return;

    try {
      const updatedInference = { ...inference };
      
      switch (selectedItem.type) {
        case 'trend':
          updatedInference.marketTrends = inference.marketTrends.filter((t: MarketTrend) => t !== selectedItem.data);
          break;
        case 'config':
          updatedInference.bessConfigurations = inference.bessConfigurations.filter((c: BESSConfigurationPattern) => c !== selectedItem.data);
          break;
        case 'indicator':
          updatedInference.decisionIndicators = inference.decisionIndicators.filter((i: CustomerDecisionIndicator) => i !== selectedItem.data);
          break;
        case 'opportunity':
          updatedInference.emergingOpportunities = inference.emergingOpportunities.filter((o: EmergingOpportunity) => o !== selectedItem.data);
          break;
        case 'adoption':
          updatedInference.industryAdoption = inference.industryAdoption.filter((a: IndustryAdoptionRate) => a !== selectedItem.data);
          break;
        case 'pricing':
          updatedInference.pricingUpdateRecommendations = (inference.pricingUpdateRecommendations || []).filter((p: PricingUpdateRecommendation) => p !== selectedItem.data);
          break;
      }

      // Save to database
      const { error } = await supabase
        .from('market_inferences')
        .update({
          market_trends: updatedInference.marketTrends,
          bess_configurations: updatedInference.bessConfigurations,
          decision_indicators: updatedInference.decisionIndicators,
          emerging_opportunities: updatedInference.emergingOpportunities,
          industry_adoption: updatedInference.industryAdoption,
          pricing_update_recommendations: updatedInference.pricingUpdateRecommendations,
          updated_at: new Date().toISOString(),
        })
        .eq('analysis_date', new Date(updatedInference.analysisDate).toISOString().split('T')[0]);

      if (error) throw error;

      setInference(updatedInference);
      setIsModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'bearish':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Market Intelligence Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered market analysis from signals, news, and installations
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-700 to-slate-600 text-white rounded-lg hover:from-purple-800 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                {pendingApprovals.length} Pricing Update{pendingApprovals.length > 1 ? 's' : ''} Pending Approval
              </span>
            </div>
            <button
              onClick={() => setActiveTab('pricing')}
              className="text-amber-700 hover:text-amber-900 font-medium"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {!inference && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-4">Run your first market analysis to see insights</p>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            Run Analysis
          </button>
        </div>
      )}

      {inference && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Market Sentiment</span>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <div className={`text-2xl font-bold mb-1 ${getSentimentColor(inference.overallMarketSentiment).split(' ')[0]}`}>
                {inference.overallMarketSentiment.charAt(0).toUpperCase() + inference.overallMarketSentiment.slice(1)}
              </div>
              <div className="text-xs text-gray-500">
                Confidence: {(inference.confidence * 100).toFixed(0)}%
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Data Points</span>
                <BarChart3 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {inference.dataPointsAnalyzed.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {inference.sources.length} sources
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Market Trends</span>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {inference.marketTrends.length}
              </div>
              <div className="text-xs text-gray-500">
                Active trends
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pricing Updates</span>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {inference.pricingUpdateRecommendations?.length || 0}
              </div>
              <div className="text-xs text-gray-500">
                {inference.requiresPricingUpdate ? 'Pending' : 'None'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'trends', label: 'Market Trends', icon: TrendingUp },
                { key: 'configs', label: 'BESS Configs', icon: Zap },
                { key: 'indicators', label: 'Decision Indicators', icon: Target },
                { key: 'opportunities', label: 'Opportunities', icon: Lightbulb },
                { key: 'adoption', label: 'Industry Adoption', icon: Building2 },
                { key: 'pricing', label: 'Pricing Updates', icon: DollarSign },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-purple-700 text-purple-700 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && <OverviewTab inference={inference} onItemClick={handleItemClick} />}
              {activeTab === 'trends' && <TrendsTab trends={inference.marketTrends} onItemClick={handleItemClick} />}
              {activeTab === 'configs' && <ConfigsTab configs={inference.bessConfigurations} onItemClick={handleItemClick} />}
              {activeTab === 'indicators' && <IndicatorsTab indicators={inference.decisionIndicators} onItemClick={handleItemClick} />}
              {activeTab === 'opportunities' && <OpportunitiesTab opportunities={inference.emergingOpportunities} onItemClick={handleItemClick} />}
              {activeTab === 'adoption' && <AdoptionTab adoption={inference.industryAdoption} onItemClick={handleItemClick} />}
              {activeTab === 'pricing' && (
                <PricingTab 
                  recommendations={inference.pricingUpdateRecommendations || []}
                  pendingApprovals={pendingApprovals}
                  onApprovalUpdate={loadPendingApprovals}
                  onItemClick={handleItemClick}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <MarketIntelligenceDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          type={selectedItem.type}
          data={selectedItem.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// ============================================================================
// TAB COMPONENTS
// ============================================================================

const OverviewTab: React.FC<{ 
  inference: MarketInference; 
  onItemClick: (type: 'trend' | 'config' | 'adoption', data: any) => void;
}> = ({ inference, onItemClick }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-gray-600 mb-1">Overall Sentiment</div>
            <div className="text-2xl font-bold text-purple-700 capitalize">
              {inference.overallMarketSentiment}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on {inference.marketTrends.length} trend analyses
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Analysis Confidence</div>
            <div className="text-2xl font-bold text-blue-700">
              {(inference.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {inference.dataPointsAnalyzed.toLocaleString()} data points analyzed
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-3">
          <button
            onClick={() => inference.marketTrends[0] && onItemClick('trend', inference.marketTrends[0])}
            disabled={!inference.marketTrends[0]}
            className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border transition-all ${
              inference.marketTrends[0] 
                ? 'hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer group' 
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                Top Market Trend
                {inference.marketTrends[0] && (
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {inference.marketTrends[0]?.category || 'N/A'}: {inference.marketTrends[0]?.direction || 'N/A'}
              </div>
            </div>
          </button>

          <button
            onClick={() => inference.bessConfigurations[0] && onItemClick('config', inference.bessConfigurations[0])}
            disabled={!inference.bessConfigurations[0]}
            className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border transition-all ${
              inference.bessConfigurations[0] 
                ? 'hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer group' 
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <Zap className="w-5 h-5 text-purple-500 mt-0.5" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                Most Common BESS Config
                {inference.bessConfigurations[0] && (
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {inference.bessConfigurations[0]?.configuration || 'N/A'}
              </div>
            </div>
          </button>

          <button
            onClick={() => inference.industryAdoption[0] && onItemClick('adoption', inference.industryAdoption[0])}
            disabled={!inference.industryAdoption[0]}
            className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border transition-all ${
              inference.industryAdoption[0] 
                ? 'hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer group' 
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <Building2 className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                Fastest Adopting Industry
                {inference.industryAdoption[0] && (
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {inference.industryAdoption[0]?.industry || 'N/A'} (#{inference.industryAdoption[0]?.ranking || 'N/A'})
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const TrendsTab: React.FC<{ trends: MarketTrend[]; onItemClick: (type: 'trend', data: MarketTrend) => void }> = ({ trends, onItemClick }) => {
  return (
    <div className="space-y-4">
      {trends.map((trend, index) => (
        <button
          key={index}
          onClick={() => onItemClick('trend', trend)}
          className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {trend.direction === 'increasing' ? <TrendingUp className="w-5 h-5 text-green-500" /> :
               trend.direction === 'decreasing' ? <TrendingDown className="w-5 h-5 text-red-500" /> :
               <Minus className="w-5 h-5 text-gray-500" />}
              <span className="font-semibold text-gray-900 capitalize">{trend.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                trend.direction === 'increasing' ? 'bg-green-100 text-green-700' :
                trend.direction === 'decreasing' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend.direction}
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Magnitude: {trend.magnitude.toFixed(1)}% | Confidence: {(trend.confidence * 100).toFixed(0)}% | {trend.timeframe} term
          </div>
          <div className="text-xs text-gray-500">
            {trend.evidence.join(' • ')}
          </div>
        </button>
      ))}
    </div>
  );
};

const ConfigsTab: React.FC<{ configs: BESSConfigurationPattern[]; onItemClick: (type: 'config', data: BESSConfigurationPattern) => void }> = ({ configs, onItemClick }) => {
  return (
    <div className="space-y-4">
      {configs.slice(0, 10).map((config, index) => (
        <button
          key={index}
          onClick={() => onItemClick('config', config)}
          className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">{config.configuration}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{config.frequency} instances</span>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Avg Price: ${config.avgPrice.toLocaleString()} | Range: ${config.priceRange.min.toLocaleString()} - ${config.priceRange.max.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Industries: {config.industries.join(', ') || 'N/A'} | Use Cases: {config.useCases.join(', ') || 'N/A'}
          </div>
        </button>
      ))}
    </div>
  );
};

const IndicatorsTab: React.FC<{ indicators: CustomerDecisionIndicator[]; onItemClick: (type: 'indicator', data: CustomerDecisionIndicator) => void }> = ({ indicators, onItemClick }) => {
  return (
    <div className="space-y-4">
      {indicators.slice(0, 10).map((indicator, index) => (
        <button
          key={index}
          onClick={() => onItemClick('indicator', indicator)}
          className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">{indicator.indicator}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{indicator.frequency} mentions</span>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Correlation: {(indicator.correlation * 100).toFixed(0)}% | Trend: {indicator.trend}
          </div>
          <div className="text-xs text-gray-500">
            Industries: {indicator.industries.join(', ') || 'N/A'}
          </div>
        </button>
      ))}
    </div>
  );
};

const OpportunitiesTab: React.FC<{ opportunities: EmergingOpportunity[]; onItemClick: (type: 'opportunity', data: EmergingOpportunity) => void }> = ({ opportunities, onItemClick }) => {
  return (
    <div className="space-y-4">
      {opportunities.map((opp, index) => (
        <button
          key={index}
          onClick={() => onItemClick('opportunity', opp)}
          className="w-full text-left bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">{opp.opportunity}</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                opp.marketSize === 'large' || opp.marketSize === 'very-large' ? 'bg-green-100 text-green-700' :
                opp.marketSize === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {opp.marketSize}
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">{opp.description}</div>
          <div className="text-sm text-gray-600 mb-2">
            Growth: {opp.growthRate.toFixed(1)}% | Confidence: {(opp.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">
            Industries: {opp.industries.join(', ') || 'N/A'}
          </div>
        </button>
      ))}
    </div>
  );
};

const AdoptionTab: React.FC<{ adoption: IndustryAdoptionRate[]; onItemClick: (type: 'adoption', data: IndustryAdoptionRate) => void }> = ({ adoption, onItemClick }) => {
  return (
    <div className="space-y-4">
      {adoption.map((industry, index) => (
        <button
          key={index}
          onClick={() => onItemClick('adoption', industry)}
          className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-700">#{industry.ranking}</span>
              <span className="font-semibold text-gray-900 capitalize">{industry.industry}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {industry.adoptionRate.toFixed(1)}% adoption
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Growth: {industry.growthRate.toFixed(1)}% YoY | Avg System: {industry.avgSystemSize.power.toFixed(0)}kW / {industry.avgSystemSize.energy.toFixed(0)}kWh
          </div>
          <div className="text-xs text-gray-500">
            Use Cases: {industry.primaryUseCases.join(', ') || 'N/A'}
          </div>
        </button>
      ))}
    </div>
  );
};

const PricingTab: React.FC<{ 
  recommendations: PricingUpdateRecommendation[];
  pendingApprovals: any[];
  onApprovalUpdate: () => void;
  onItemClick: (type: 'pricing', data: PricingUpdateRecommendation) => void;
}> = ({ recommendations, pendingApprovals, onApprovalUpdate, onItemClick }) => {
  const handleApprove = async (approvalId: string) => {
    // This would trigger the pricing update workflow
    // For now, just update status
    const { error } = await supabase
      .from('pricing_update_approvals')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', approvalId);

    if (!error) {
      onApprovalUpdate();
    }
  };

  const handleReject = async (approvalId: string, reason: string) => {
    const { error } = await supabase
      .from('pricing_update_approvals')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason,
        approved_at: new Date().toISOString() 
      })
      .eq('id', approvalId);

    if (!error) {
      onApprovalUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {pendingApprovals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">{approval.component}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      approval.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                      approval.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {approval.urgency}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleReject(approval.id, reason);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Current: ${approval.current_value.toFixed(2)} → Recommended: ${approval.recommended_value.toFixed(2)} ({approval.change_percent > 0 ? '+' : ''}{approval.change_percent.toFixed(1)}%)
                </div>
                <div className="text-xs text-gray-500">{approval.reasoning}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <button
              key={index}
              onClick={() => onItemClick('pricing', rec)}
              className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{rec.component}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                    rec.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.urgency}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                ${rec.currentValue.toFixed(2)} → ${rec.recommendedValue.toFixed(2)} ({rec.changePercent > 0 ? '+' : ''}{rec.changePercent.toFixed(1)}%)
              </div>
              <div className="text-xs text-gray-500">{rec.reasoning}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligenceDashboard;

