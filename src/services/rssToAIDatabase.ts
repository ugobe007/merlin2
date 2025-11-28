/**
 * RSS to AI/ML Database Integration Service
 * Parses RSS feed data and updates AI training database with:
 * - Pricing intelligence
 * - Product configurations
 * - Market trends
 * - New product announcements
 */

import { supabase } from './supabase';

export interface RSSArticle {
  title: string;
  link: string;
  pubDate: Date;
  content: string;
  source: string;
  category: string;
}

export interface ExtractedPricingData {
  productType: 'bess' | 'solar' | 'wind' | 'generator' | 'inverter' | 'ev-charger' | 'other';
  manufacturer?: string;
  modelName?: string;
  capacity?: number; // MW or MWh
  capacityUnit?: 'MW' | 'MWh' | 'kW' | 'kWh';
  pricePerUnit?: number;
  priceUnit?: '$/kWh' | '$/kW' | '$/MW' | '$/unit';
  contractValue?: number; // Total project cost
  projectSize?: number;
  location?: string;
  year: number;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

export interface ExtractedConfigData {
  productType: string;
  manufacturer?: string;
  modelName?: string;
  specifications: {
    power?: string;
    energy?: string;
    voltage?: string;
    efficiency?: string;
    warrantyYears?: number;
    cycleLife?: number;
    chemistry?: string;
    [key: string]: any;
  };
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
}

export interface ExtractedMarketTrend {
  trendType: 'price-decrease' | 'price-increase' | 'new-technology' | 'market-growth' | 'policy-change';
  description: string;
  impactLevel: 'high' | 'medium' | 'low';
  timeframe?: string;
  affectedProducts: string[];
  rawText: string;
}

/**
 * Extract pricing information from article using keyword patterns
 */
function extractPricingData(article: RSSArticle): ExtractedPricingData[] {
  const pricingData: ExtractedPricingData[] = [];
  const text = `${article.title} ${article.content}`.toLowerCase();
  
  // Price patterns
  const pricePatterns = [
    // $/kWh pattern (most common for BESS)
    /\$(\d+(?:\.\d+)?)\s*(?:per|\/)\s*kwh/gi,
    /(\d+(?:\.\d+)?)\s*\$\/kwh/gi,
    
    // $/kW pattern (generators, inverters)
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:per|\/)\s*kw/gi,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\$\/kw/gi,
    
    // Total contract values
    /\$(\d+(?:\.\d+)?)\s*(million|m|billion|b)/gi,
    /contract.*?\$(\d+(?:\.\d+)?)\s*(million|m)/gi,
    
    // Capacity + cost patterns
    /(\d+(?:\.\d+)?)\s*mwh.*?\$(\d+(?:\.\d+)?)/gi,
    /(\d+(?:\.\d+)?)\s*mw.*?\$(\d+(?:\.\d+)?)/gi,
  ];
  
  // Product type detection
  let productType: ExtractedPricingData['productType'] = 'other';
  if (text.includes('bess') || text.includes('battery') || text.includes('energy storage')) {
    productType = 'bess';
  } else if (text.includes('solar') || text.includes('pv')) {
    productType = 'solar';
  } else if (text.includes('wind')) {
    productType = 'wind';
  } else if (text.includes('generator') || text.includes('genset')) {
    productType = 'generator';
  } else if (text.includes('inverter')) {
    productType = 'inverter';
  } else if (text.includes('ev charg')) {
    productType = 'ev-charger';
  }
  
  // Manufacturer detection
  const manufacturers = [
    'tesla', 'fluence', 'wartsila', 'powin', 'energy vault',
    'lg', 'samsung', 'catl', 'byd', 'panasonic',
    'eaton', 'schneider', 'abb', 'ge', 'siemens',
    'sungrow', 'huawei', 'sma', 'enphase', 'solaredge',
    'vestas', 'ge renewable', 'siemens gamesa',
    'great power', 'dynapower', 'sinexcel'
  ];
  
  let detectedManufacturer: string | undefined;
  for (const mfg of manufacturers) {
    if (text.includes(mfg)) {
      detectedManufacturer = mfg.charAt(0).toUpperCase() + mfg.slice(1);
      break;
    }
  }
  
  // Extract pricing instances
  pricePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const priceValue = parseFloat(match[1].replace(',', ''));
      
      if (!isNaN(priceValue) && priceValue > 0 && priceValue < 10000) {
        // Context extraction (50 chars before and after)
        const matchIndex = text.indexOf(match[0]);
        const contextStart = Math.max(0, matchIndex - 50);
        const contextEnd = Math.min(text.length, matchIndex + 100);
        const context = text.slice(contextStart, contextEnd);
        
        pricingData.push({
          productType,
          manufacturer: detectedManufacturer,
          pricePerUnit: priceValue,
          priceUnit: match[0].includes('kwh') ? '$/kWh' : match[0].includes('kw') ? '$/kW' : '$/MW',
          year: article.pubDate.getFullYear(),
          confidence: detectedManufacturer ? 'high' : 'medium',
          rawText: context
        });
      }
    });
  });
  
  return pricingData;
}

/**
 * Extract product configuration data from article
 */
function extractConfigData(article: RSSArticle): ExtractedConfigData[] {
  const configData: ExtractedConfigData[] = [];
  const text = `${article.title} ${article.content}`;
  
  // Configuration patterns
  const patterns = {
    power: /(\d+(?:\.\d+)?)\s*(mw|kw|gw)\s*(?:power|capacity|output)/gi,
    energy: /(\d+(?:\.\d+)?)\s*(mwh|kwh|gwh)\s*(?:energy|storage|capacity)/gi,
    efficiency: /(\d+(?:\.\d+)?)\s*%\s*(?:efficiency|round-trip)/gi,
    voltage: /(\d+(?:\.\d+)?)\s*(?:v|kv|mv)\s*(?:voltage|volt)/gi,
    warranty: /(\d+)\s*(?:year|yr)\s*warranty/gi,
    cycles: /(\d+(?:,\d{3})*)\s*(?:cycles|cycle life)/gi,
    chemistry: /(lfp|nmc|nca|lithium[- ]ion|li[- ]ion)/gi,
  };
  
  // Check if article contains configuration information
  if (!text.match(/specif|config|technical|model|product|launch|announc/i)) {
    return configData;
  }
  
  const specs: ExtractedConfigData['specifications'] = {};
  let foundSpecs = false;
  
  // Extract specifications
  Object.entries(patterns).forEach(([key, pattern]) => {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      foundSpecs = true;
      if (key === 'warranty' || key === 'cycles') {
        specs[key === 'warranty' ? 'warrantyYears' : 'cycleLife'] = parseInt(matches[0][1].replace(',', ''));
      } else if (key === 'chemistry') {
        specs.chemistry = matches[0][1].toUpperCase();
      } else {
        specs[key] = `${matches[0][1]} ${matches[0][2] || ''}`.trim();
      }
    }
  });
  
  if (foundSpecs) {
    // Detect product type and manufacturer (similar logic as pricing)
    let productType = 'unknown';
    if (text.match(/bess|battery|energy storage/i)) productType = 'BESS';
    else if (text.match(/solar|pv/i)) productType = 'Solar';
    else if (text.match(/wind/i)) productType = 'Wind';
    else if (text.match(/generator/i)) productType = 'Generator';
    else if (text.match(/inverter/i)) productType = 'Inverter';
    
    // Extract model name (look for capitalized product names)
    const modelMatch = text.match(/\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\s+\d+[A-Z]*)\b/);
    
    configData.push({
      productType,
      modelName: modelMatch?.[1],
      specifications: specs,
      confidence: Object.keys(specs).length > 3 ? 'high' : 'medium',
      rawText: text.slice(0, 300)
    });
  }
  
  return configData;
}

/**
 * Extract market trends from article
 */
function extractMarketTrends(article: RSSArticle): ExtractedMarketTrend[] {
  const trends: ExtractedMarketTrend[] = [];
  const text = `${article.title} ${article.content}`.toLowerCase();
  
  // Trend patterns
  const trendPatterns = [
    {
      type: 'price-decrease' as const,
      keywords: ['price drop', 'cost decline', 'cheaper', 'price fell', 'decrease', 'reduction'],
      impactLevel: 'high' as const
    },
    {
      type: 'price-increase' as const,
      keywords: ['price increase', 'cost rise', 'more expensive', 'price surge', 'inflation'],
      impactLevel: 'medium' as const
    },
    {
      type: 'new-technology' as const,
      keywords: ['breakthrough', 'new technology', 'innovation', 'next-generation', 'revolutionary'],
      impactLevel: 'high' as const
    },
    {
      type: 'market-growth' as const,
      keywords: ['market growth', 'expanding', 'deployment increase', 'capacity addition', 'record'],
      impactLevel: 'medium' as const
    },
    {
      type: 'policy-change' as const,
      keywords: ['policy', 'regulation', 'incentive', 'subsidy', 'tax credit', 'ira', 'legislation'],
      impactLevel: 'high' as const
    }
  ];
  
  trendPatterns.forEach(({ type, keywords, impactLevel }) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // Extract affected products
        const affectedProducts: string[] = [];
        if (text.includes('bess') || text.includes('battery')) affectedProducts.push('BESS');
        if (text.includes('solar')) affectedProducts.push('Solar');
        if (text.includes('wind')) affectedProducts.push('Wind');
        if (text.includes('ev charg')) affectedProducts.push('EV Charging');
        
        if (affectedProducts.length > 0) {
          trends.push({
            trendType: type,
            description: article.title,
            impactLevel,
            affectedProducts,
            rawText: text.slice(0, 200)
          });
        }
      }
    });
  });
  
  return trends;
}

/**
 * Store extracted pricing data in AI training database
 */
export async function storePricingData(
  articleId: string,
  pricingData: ExtractedPricingData[]
): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - storing pricing data locally');
    localStorage.setItem(`pricing_${articleId}`, JSON.stringify(pricingData));
    return;
  }
  
  try {
    for (const data of pricingData) {
      const { error } = await supabase
        .from('ai_training_data')
        .insert({
          data_type: 'pricing',
          product_type: data.productType,
          manufacturer: data.manufacturer,
          model_name: data.modelName,
          data_json: {
            capacity: data.capacity,
            capacityUnit: data.capacityUnit,
            pricePerUnit: data.pricePerUnit,
            priceUnit: data.priceUnit,
            contractValue: data.contractValue,
            projectSize: data.projectSize,
            location: data.location,
            year: data.year,
            confidence: data.confidence,
            rawText: data.rawText,
            sourceArticle: articleId
          },
          source: 'rss_feed',
          confidence_score: data.confidence === 'high' ? 0.9 : data.confidence === 'medium' ? 0.7 : 0.5,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing pricing data:', error);
      }
    }
    
    console.log(`✅ Stored ${pricingData.length} pricing data points`);
  } catch (error) {
    console.error('Failed to store pricing data:', error);
  }
}

/**
 * Store extracted configuration data in AI training database
 */
export async function storeConfigData(
  articleId: string,
  configData: ExtractedConfigData[]
): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - storing config data locally');
    localStorage.setItem(`config_${articleId}`, JSON.stringify(configData));
    return;
  }
  
  try {
    for (const data of configData) {
      const { error } = await supabase
        .from('ai_training_data')
        .insert({
          data_type: 'configuration',
          product_type: data.productType,
          manufacturer: data.manufacturer,
          model_name: data.modelName,
          data_json: {
            specifications: data.specifications,
            confidence: data.confidence,
            rawText: data.rawText,
            sourceArticle: articleId
          },
          source: 'rss_feed',
          confidence_score: data.confidence === 'high' ? 0.9 : data.confidence === 'medium' ? 0.7 : 0.5,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing config data:', error);
      }
    }
    
    console.log(`✅ Stored ${configData.length} configuration data points`);
  } catch (error) {
    console.error('Failed to store config data:', error);
  }
}

/**
 * Store extracted market trends in AI training database
 */
export async function storeMarketTrends(
  articleId: string,
  trends: ExtractedMarketTrend[]
): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - storing trends locally');
    localStorage.setItem(`trends_${articleId}`, JSON.stringify(trends));
    return;
  }
  
  try {
    for (const trend of trends) {
      const { error } = await supabase
        .from('ai_training_data')
        .insert({
          data_type: 'market_trend',
          product_type: trend.affectedProducts.join(','),
          data_json: {
            trendType: trend.trendType,
            description: trend.description,
            impactLevel: trend.impactLevel,
            timeframe: trend.timeframe,
            affectedProducts: trend.affectedProducts,
            rawText: trend.rawText,
            sourceArticle: articleId
          },
          source: 'rss_feed',
          confidence_score: trend.impactLevel === 'high' ? 0.9 : trend.impactLevel === 'medium' ? 0.7 : 0.5,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing market trend:', error);
      }
    }
    
    console.log(`✅ Stored ${trends.length} market trends`);
  } catch (error) {
    console.error('Failed to store market trends:', error);
  }
}

/**
 * Process a single RSS article and extract all relevant data
 */
export async function processArticleForAI(article: RSSArticle): Promise<{
  pricingData: number;
  configData: number;
  trends: number;
}> {
  console.log(`📰 Processing: ${article.title}`);
  
  // Generate unique article ID
  const articleId = `${article.source}_${article.pubDate.getTime()}`;
  
  // Extract all data types
  const pricingData = extractPricingData(article);
  const configData = extractConfigData(article);
  const trends = extractMarketTrends(article);
  
  console.log(`   💰 Found ${pricingData.length} pricing points`);
  console.log(`   ⚙️  Found ${configData.length} config specs`);
  console.log(`   📈 Found ${trends.length} market trends`);
  
  // Store in database
  if (pricingData.length > 0) {
    await storePricingData(articleId, pricingData);
  }
  
  if (configData.length > 0) {
    await storeConfigData(articleId, configData);
  }
  
  if (trends.length > 0) {
    await storeMarketTrends(articleId, trends);
  }
  
  return {
    pricingData: pricingData.length,
    configData: configData.length,
    trends: trends.length
  };
}

/**
 * Process multiple RSS articles in batch
 */
export async function processBatchForAI(articles: RSSArticle[]): Promise<{
  totalArticles: number;
  pricingDataPoints: number;
  configDataPoints: number;
  trendDataPoints: number;
}> {
  console.log(`🚀 Processing ${articles.length} articles for AI database...`);
  
  let totalPricing = 0;
  let totalConfig = 0;
  let totalTrends = 0;
  
  for (const article of articles) {
    try {
      const result = await processArticleForAI(article);
      totalPricing += result.pricingData;
      totalConfig += result.configData;
      totalTrends += result.trends;
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error processing article: ${article.title}`, error);
    }
  }
  
  console.log('✅ Batch processing complete!');
  console.log(`   📊 Total: ${totalPricing} pricing, ${totalConfig} configs, ${totalTrends} trends`);
  
  return {
    totalArticles: articles.length,
    pricingDataPoints: totalPricing,
    configDataPoints: totalConfig,
    trendDataPoints: totalTrends
  };
}

/**
 * Get AI training data statistics
 */
export async function getAIDataStats(): Promise<{
  totalRecords: number;
  byType: { [key: string]: number };
  bySource: { [key: string]: number };
  lastUpdated: string;
}> {
  if (!supabase) {
    // Return local storage stats
    const keys = Object.keys(localStorage).filter(k => k.startsWith('pricing_') || k.startsWith('config_') || k.startsWith('trends_'));
    return {
      totalRecords: keys.length,
      byType: {
        pricing: keys.filter(k => k.startsWith('pricing_')).length,
        configuration: keys.filter(k => k.startsWith('config_')).length,
        market_trend: keys.filter(k => k.startsWith('trends_')).length
      },
      bySource: { rss_feed: keys.length },
      lastUpdated: new Date().toISOString()
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('ai_training_data')
      .select('data_type, source, created_at')
      .eq('source', 'rss_feed');
    
    if (error) throw error;
    
    const byType: { [key: string]: number } = {};
    const bySource: { [key: string]: number } = {};
    let lastUpdated = new Date(0);
    
    data?.forEach(record => {
      byType[record.data_type] = (byType[record.data_type] || 0) + 1;
      bySource[record.source] = (bySource[record.source] || 0) + 1;
      
      const recordDate = new Date(record.created_at);
      if (recordDate > lastUpdated) {
        lastUpdated = recordDate;
      }
    });
    
    return {
      totalRecords: data?.length || 0,
      byType,
      bySource,
      lastUpdated: lastUpdated.toISOString()
    };
  } catch (error) {
    console.error('Failed to get AI data stats:', error);
    return {
      totalRecords: 0,
      byType: {},
      bySource: {},
      lastUpdated: new Date().toISOString()
    };
  }
}
