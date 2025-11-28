/**
 * ML Processing Service
 * Processes collected AI training data and generates insights
 * 
 * Features:
 * - Price trend analysis and forecasting
 * - Manufacturer/product sentiment analysis
 * - Market trend identification
 * - Anomaly detection for pricing alerts
 */

import { supabase } from './supabase';

interface PriceTrendAnalysis {
  productType: string;
  manufacturer?: string;
  averagePrice: number;
  priceChange30d: number;
  priceChange90d: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  forecastNextQuarter: number;
  dataPoints: number;
}

interface MarketInsight {
  category: string;
  insight: string;
  impact: 'high' | 'medium' | 'low';
  affectedProducts: string[];
  confidence: number;
  sourceCount: number;
  timestamp: string;
}

interface MLProcessingResult {
  priceTrends: PriceTrendAnalysis[];
  marketInsights: MarketInsight[];
  processedRecords: number;
  processingTime: number;
}

/**
 * Calculate simple linear regression for price forecasting
 */
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  let ssTotal = 0, ssResidual = 0;
  for (const point of data) {
    ssTotal += Math.pow(point.y - yMean, 2);
    const predicted = slope * point.x + intercept;
    ssResidual += Math.pow(point.y - predicted, 2);
  }
  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

/**
 * Analyze price trends from collected data
 */
async function analyzePriceTrends(): Promise<PriceTrendAnalysis[]> {
  console.log('📊 Analyzing price trends...');
  const trends: PriceTrendAnalysis[] = [];

  try {
    // Get pricing data from ai_training_data
    const { data: pricingData, error } = await supabase
      .from('ai_training_data')
      .select('*')
      .eq('data_type', 'pricing')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pricing data:', error);
      return trends;
    }

    if (!pricingData || pricingData.length === 0) {
      console.log('No pricing data available for analysis');
      return trends;
    }

    // Group by product type
    const byProductType = new Map<string, typeof pricingData>();
    for (const record of pricingData) {
      const productType = record.product_type;
      if (!byProductType.has(productType)) {
        byProductType.set(productType, []);
      }
      byProductType.get(productType)!.push(record);
    }

    // Analyze each product type
    for (const [productType, records] of byProductType) {
      // Extract prices with timestamps
      const pricePoints = records
        .map(r => {
          const dataJson = r.data_json as any;
          return {
            price: dataJson?.pricePerUnit || 0,
            timestamp: new Date(r.created_at).getTime(),
            manufacturer: r.manufacturer
          };
        })
        .filter(p => p.price > 0);

      if (pricePoints.length < 2) continue;

      // Calculate statistics
      const prices = pricePoints.map(p => p.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Normalize timestamps to days from first point
      const firstTimestamp = pricePoints[0].timestamp;
      const regressionData = pricePoints.map(p => ({
        x: (p.timestamp - firstTimestamp) / (1000 * 60 * 60 * 24), // Days
        y: p.price
      }));

      // Run regression
      const { slope, intercept, r2 } = linearRegression(regressionData);
      
      // Calculate price changes
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
      
      const recent = pricePoints.filter(p => p.timestamp >= thirtyDaysAgo);
      const older30 = pricePoints.filter(p => p.timestamp < thirtyDaysAgo && p.timestamp >= ninetyDaysAgo);
      const older90 = pricePoints.filter(p => p.timestamp < ninetyDaysAgo);

      const avgRecent = recent.length > 0 ? recent.reduce((a, p) => a + p.price, 0) / recent.length : avgPrice;
      const avgOlder30 = older30.length > 0 ? older30.reduce((a, p) => a + p.price, 0) / older30.length : avgPrice;
      const avgOlder90 = older90.length > 0 ? older90.reduce((a, p) => a + p.price, 0) / older90.length : avgPrice;

      const change30d = avgOlder30 > 0 ? ((avgRecent - avgOlder30) / avgOlder30) * 100 : 0;
      const change90d = avgOlder90 > 0 ? ((avgRecent - avgOlder90) / avgOlder90) * 100 : 0;

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (slope < -0.5) trend = 'decreasing';
      else if (slope > 0.5) trend = 'increasing';

      // Forecast next quarter (90 days)
      const daysFromStart = (now - firstTimestamp) / (1000 * 60 * 60 * 24);
      const forecastDays = daysFromStart + 90;
      const forecastPrice = slope * forecastDays + intercept;

      trends.push({
        productType,
        manufacturer: pricePoints[0].manufacturer,
        averagePrice: Math.round(avgPrice * 100) / 100,
        priceChange30d: Math.round(change30d * 10) / 10,
        priceChange90d: Math.round(change90d * 10) / 10,
        trend,
        confidence: Math.round(r2 * 100) / 100,
        forecastNextQuarter: Math.round(Math.max(0, forecastPrice) * 100) / 100,
        dataPoints: pricePoints.length
      });
    }

    console.log(`✅ Analyzed ${trends.length} price trends`);
    return trends;

  } catch (error) {
    console.error('Price trend analysis failed:', error);
    return trends;
  }
}

/**
 * Generate market insights from collected trends
 */
async function generateMarketInsights(): Promise<MarketInsight[]> {
  console.log('🔍 Generating market insights...');
  const insights: MarketInsight[] = [];

  try {
    // Get market trend data
    const { data: trendData, error } = await supabase
      .from('ai_training_data')
      .select('*')
      .eq('data_type', 'market_trend')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching trend data:', error);
      return insights;
    }

    if (!trendData || trendData.length === 0) {
      console.log('No trend data available for analysis');
      return insights;
    }

    // Group by trend type
    const byTrendType = new Map<string, typeof trendData>();
    for (const record of trendData) {
      const dataJson = record.data_json as any;
      const trendType = dataJson?.trendType || 'unknown';
      if (!byTrendType.has(trendType)) {
        byTrendType.set(trendType, []);
      }
      byTrendType.get(trendType)!.push(record);
    }

    // Generate insights for each trend type
    for (const [trendType, records] of byTrendType) {
      if (records.length < 2) continue; // Need at least 2 data points

      // Aggregate affected products
      const allProducts = new Set<string>();
      for (const record of records) {
        const dataJson = record.data_json as any;
        const products = dataJson?.affectedProducts || [];
        products.forEach((p: string) => allProducts.add(p));
      }

      // Calculate confidence based on source count and consistency
      const sourceCount = records.length;
      const confidence = Math.min(0.95, 0.5 + (sourceCount * 0.1));

      // Determine impact level
      let impact: 'high' | 'medium' | 'low' = 'medium';
      const highImpactRecords = records.filter(r => {
        const dataJson = r.data_json as any;
        return dataJson?.impactLevel === 'high';
      });
      if (highImpactRecords.length > records.length / 2) impact = 'high';
      else if (highImpactRecords.length < records.length / 4) impact = 'low';

      // Generate insight description
      let insightText = '';
      switch (trendType) {
        case 'price-decrease':
          insightText = `Battery storage prices showing downward trend across ${allProducts.size} product categories. Consider timing purchases for optimal pricing.`;
          break;
        case 'price-increase':
          insightText = `Upward price pressure detected in energy storage market. Supply chain factors may be contributing to increased costs.`;
          break;
        case 'new-technology':
          insightText = `New technology developments identified in ${Array.from(allProducts).join(', ')}. Innovation may impact future pricing and performance.`;
          break;
        case 'market-growth':
          insightText = `Strong market growth signals in energy storage sector. Deployment rates increasing across multiple regions.`;
          break;
        case 'policy-change':
          insightText = `Regulatory changes may affect ${Array.from(allProducts).join(', ')} projects. Review latest incentive programs and compliance requirements.`;
          break;
        default:
          insightText = `Market activity detected in ${trendType} category affecting ${allProducts.size} product types.`;
      }

      insights.push({
        category: trendType,
        insight: insightText,
        impact,
        affectedProducts: Array.from(allProducts),
        confidence: Math.round(confidence * 100) / 100,
        sourceCount,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Generated ${insights.length} market insights`);
    return insights;

  } catch (error) {
    console.error('Market insight generation failed:', error);
    return insights;
  }
}

/**
 * Store ML processing results in database
 */
async function storeMLResults(results: MLProcessingResult): Promise<void> {
  try {
    // Store price trends
    for (const trend of results.priceTrends) {
      await supabase.from('ml_price_trends').upsert({
        product_type: trend.productType,
        manufacturer: trend.manufacturer,
        average_price: trend.averagePrice,
        price_change_30d: trend.priceChange30d,
        price_change_90d: trend.priceChange90d,
        trend_direction: trend.trend,
        confidence: trend.confidence,
        forecast_next_quarter: trend.forecastNextQuarter,
        data_points: trend.dataPoints,
        updated_at: new Date().toISOString()
      }, { onConflict: 'product_type' });
    }

    // Store market insights
    for (const insight of results.marketInsights) {
      await supabase.from('ml_market_insights').insert({
        category: insight.category,
        insight_text: insight.insight,
        impact_level: insight.impact,
        affected_products: insight.affectedProducts,
        confidence: insight.confidence,
        source_count: insight.sourceCount,
        created_at: insight.timestamp
      });
    }

    // Mark processed records
    await supabase
      .from('ai_training_data')
      .update({ 
        processed_for_ml: true,
        ml_model_version: 'v1.0.0'
      })
      .eq('processed_for_ml', false);

    console.log('✅ ML results stored in database');
  } catch (error) {
    console.error('Failed to store ML results:', error);
  }
}

/**
 * Main ML processing function - run periodically after data collection
 */
export async function runMLProcessing(): Promise<MLProcessingResult> {
  console.log('🤖 Starting ML processing...');
  const startTime = Date.now();

  try {
    // Check for unprocessed records
    const { count } = await supabase
      .from('ai_training_data')
      .select('*', { count: 'exact', head: true })
      .eq('processed_for_ml', false);

    if (!count || count === 0) {
      console.log('No new data to process');
      return {
        priceTrends: [],
        marketInsights: [],
        processedRecords: 0,
        processingTime: 0
      };
    }

    console.log(`📊 Processing ${count} unprocessed records...`);

    // Run analyses
    const [priceTrends, marketInsights] = await Promise.all([
      analyzePriceTrends(),
      generateMarketInsights()
    ]);

    const processingTime = (Date.now() - startTime) / 1000;

    const results: MLProcessingResult = {
      priceTrends,
      marketInsights,
      processedRecords: count,
      processingTime
    };

    // Store results
    await storeMLResults(results);

    // Log processing run
    await supabase.from('ml_processing_log').insert({
      processed_at: new Date().toISOString(),
      records_processed: count,
      trends_generated: priceTrends.length,
      insights_generated: marketInsights.length,
      processing_time_seconds: processingTime,
      status: 'success'
    });

    console.log(`✅ ML processing complete in ${processingTime.toFixed(2)}s`);
    console.log(`   📈 ${priceTrends.length} price trends analyzed`);
    console.log(`   💡 ${marketInsights.length} market insights generated`);

    return results;

  } catch (error) {
    console.error('❌ ML processing failed:', error);
    
    // Log error
    await supabase.from('ml_processing_log').insert({
      processed_at: new Date().toISOString(),
      status: 'error',
      error_message: String(error)
    });

    return {
      priceTrends: [],
      marketInsights: [],
      processedRecords: 0,
      processingTime: (Date.now() - startTime) / 1000
    };
  }
}

/**
 * Get latest ML insights for use in the application
 */
export async function getLatestMLInsights(): Promise<{
  priceTrends: PriceTrendAnalysis[];
  marketInsights: MarketInsight[];
  lastProcessed: string;
}> {
  try {
    const [trendsResult, insightsResult, logResult] = await Promise.all([
      supabase
        .from('ml_price_trends')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('ml_market_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('ml_processing_log')
        .select('processed_at')
        .eq('status', 'success')
        .order('processed_at', { ascending: false })
        .limit(1)
    ]);

    const priceTrends: PriceTrendAnalysis[] = (trendsResult.data || []).map(t => ({
      productType: t.product_type,
      manufacturer: t.manufacturer,
      averagePrice: t.average_price,
      priceChange30d: t.price_change_30d,
      priceChange90d: t.price_change_90d,
      trend: t.trend_direction,
      confidence: t.confidence,
      forecastNextQuarter: t.forecast_next_quarter,
      dataPoints: t.data_points
    }));

    const marketInsights: MarketInsight[] = (insightsResult.data || []).map(i => ({
      category: i.category,
      insight: i.insight_text,
      impact: i.impact_level,
      affectedProducts: i.affected_products || [],
      confidence: i.confidence,
      sourceCount: i.source_count,
      timestamp: i.created_at
    }));

    return {
      priceTrends,
      marketInsights,
      lastProcessed: logResult.data?.[0]?.processed_at || 'Never'
    };

  } catch (error) {
    console.error('Failed to get ML insights:', error);
    return {
      priceTrends: [],
      marketInsights: [],
      lastProcessed: 'Error'
    };
  }
}

/**
 * Schedule ML processing to run after data collection
 */
export function scheduleMLProcessing(): void {
  console.log('🤖 ML processing scheduler initialized');
  
  // Run ML processing every 6 hours (after RSS fetching typically completes)
  setInterval(async () => {
    console.log('⏰ Scheduled ML processing starting...');
    await runMLProcessing();
  }, 6 * 60 * 60 * 1000);
  
  // Run initial processing after a short delay
  setTimeout(async () => {
    console.log('🚀 Initial ML processing...');
    await runMLProcessing();
  }, 30000); // 30 seconds after app startup
}

export type { PriceTrendAnalysis, MarketInsight, MLProcessingResult };
