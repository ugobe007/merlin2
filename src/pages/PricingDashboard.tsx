/**
 * Equipment Pricing Dashboard
 * 
 * Real-time visualization of collected equipment pricing data from RSS feeds
 * Shows price trends, extraction rates, source reliability
 * 
 * Created: March 20, 2026
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { TrendingUp, TrendingDown, Activity, Database, Rss, DollarSign } from 'lucide-react';

interface PriceData {
  equipment_type: string;
  price_per_unit: number;
  unit: string;
  price_date: string;
  source_name: string;
  confidence_score: number;
}

interface SourceStats {
  name: string;
  total_articles: number;
  prices_extracted: number;
  reliability_score: number;
  last_fetch_at: string;
  is_active: boolean;
}

interface PriceTrend {
  equipment: string;
  current_avg: number;
  prev_avg: number;
  change_pct: number;
  unit: string;
  sample_count: number;
}

export default function PricingDashboard() {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sources, setSources] = useState<SourceStats[]>([]);
  const [trends, setTrends] = useState<PriceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalPrices, setTotalPrices] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    try {
      // Get total articles
      const { count: articleCount } = await supabase
        .from('scraped_articles')
        .select('*', { count: 'exact', head: true });
      setTotalArticles(articleCount || 0);

      // Get total prices
      const { count: priceCount } = await supabase
        .from('collected_market_prices')
        .select('*', { count: 'exact', head: true });
      setTotalPrices(priceCount || 0);

      // Get recent prices
      const { data: prices } = await supabase
        .from('collected_market_prices')
        .select(`
          equipment_type,
          price_per_unit,
          unit,
          price_date,
          confidence_score,
          market_data_sources (name)
        `)
        .order('price_date', { ascending: false })
        .limit(100);

      if (prices) {
        setPriceData(
          prices.map((p: any) => ({
            ...p,
            source_name: p.market_data_sources?.name || 'Unknown',
          }))
        );
      }

      // Get source stats
      const { data: sourceData } = await supabase
        .from('market_data_sources')
        .select('id, name, reliability_score, last_fetch_at, is_active')
        .order('reliability_score', { ascending: false });

      if (sourceData) {
        // Get article counts per source
        const sourceStats = await Promise.all(
          sourceData.map(async (source) => {
            const { count: articleCount } = await supabase
              .from('scraped_articles')
              .select('*', { count: 'exact', head: true })
              .eq('source_id', source.id);

            const { count: priceCount } = await supabase
              .from('collected_market_prices')
              .select('*', { count: 'exact', head: true })
              .eq('source_id', source.id);

            return {
              ...source,
              total_articles: articleCount || 0,
              prices_extracted: priceCount || 0,
              reliability_score: source.reliability_score ?? 0,
              last_fetch_at: source.last_fetch_at ?? '',
              is_active: source.is_active ?? false,
            };
          })
        );
        setSources(sourceStats);
      }

      // Calculate price trends
      if (prices && prices.length > 0) {
        const equipmentTypes = [...new Set(prices.map((p: any) => p.equipment_type))];
        const trendData: PriceTrend[] = [];

        for (const equipment of equipmentTypes) {
          const equipmentPrices = prices.filter((p: any) => p.equipment_type === equipment);
          const unit = equipmentPrices[0]?.unit || '';

          // Current month average
          const now = new Date();
          const currentMonth = equipmentPrices.filter((p: any) => {
            const priceDate = new Date(p.price_date);
            return priceDate.getMonth() === now.getMonth() && 
                   priceDate.getFullYear() === now.getFullYear();
          });

          // Previous month average
          const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevMonth = equipmentPrices.filter((p: any) => {
            const priceDate = new Date(p.price_date);
            return priceDate.getMonth() === prevMonthDate.getMonth() &&
                   priceDate.getFullYear() === prevMonthDate.getFullYear();
          });

          if (currentMonth.length > 0 && prevMonth.length > 0) {
            const currentAvg = currentMonth.reduce((sum: number, p: any) => sum + p.price_per_unit, 0) / currentMonth.length;
            const prevAvg = prevMonth.reduce((sum: number, p: any) => sum + p.price_per_unit, 0) / prevMonth.length;
            const changePct = ((currentAvg - prevAvg) / prevAvg) * 100;

            trendData.push({
              equipment,
              current_avg: currentAvg,
              prev_avg: prevAvg,
              change_pct: changePct,
              unit,
              sample_count: currentMonth.length,
            });
          }
        }

        setTrends(trendData.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Pricing Intelligence</h1>
          <p className="text-gray-600 mt-1">Real-time market data from {sources.length} RSS feeds</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{totalArticles.toLocaleString()}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prices Extracted</p>
              <p className="text-2xl font-bold text-gray-900">{totalPrices.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sources</p>
              <p className="text-2xl font-bold text-gray-900">
                {sources.filter(s => s.is_active).length}
              </p>
            </div>
            <Rss className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Extraction Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalArticles > 0 ? ((totalPrices / totalArticles) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Price Trends */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Price Trends (Month-over-Month)</h2>
        </div>
        <div className="p-6">
          {trends.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No trend data available yet. Need at least 2 months of data.
            </p>
          ) : (
            <div className="space-y-4">
              {trends.map((trend) => (
                <div
                  key={trend.equipment}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">
                      {trend.equipment.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${trend.current_avg.toFixed(2)}/{trend.unit} (avg from {trend.sample_count} samples)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {trend.change_pct > 0 ? (
                      <TrendingUp className="w-5 h-5 text-red-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    )}
                    <span
                      className={`text-lg font-semibold ${
                        trend.change_pct > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {trend.change_pct > 0 ? '+' : ''}
                      {trend.change_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">RSS Source Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reliability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Fetch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map((source, idx) => (
                <tr key={idx} className={source.is_active ? '' : 'opacity-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {source.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {source.total_articles}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {source.prices_extracted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${source.reliability_score}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{source.reliability_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {source.last_fetch_at
                      ? new Date(source.last_fetch_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        source.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Prices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Price Extractions</h2>
        </div>
        <div className="overflow-x-auto">
          {priceData.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No prices extracted yet. Improve regex patterns in marketDataParser.ts
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {priceData.slice(0, 20).map((price, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {price.equipment_type.replace('-', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${price.price_per_unit.toFixed(2)}/{price.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {price.source_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          price.confidence_score > 0.8
                            ? 'bg-green-100 text-green-800'
                            : price.confidence_score > 0.6
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {(price.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(price.price_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
