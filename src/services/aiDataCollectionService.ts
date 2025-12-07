/**
 * AI Data Collection Service
 * 
 * Background service that collects and updates data for AI models:
 * - Battery pricing data (BNEF, NREL)
 * - Product specifications (Tesla, BYD, LG, etc.)
 * - System configurations (best practices)
 * - Financing options (rates, incentives, programs)
 * - Industry news and trends
 * 
 * Runs daily updates and stores in database for AI model training
 */

import { supabase } from './supabase';

export interface BatteryPricingData {
  date: string;
  source: string; // 'bnef', 'nrel', 'lazard', 'wood-mackenzie'
  systemSize: 'small' | 'medium' | 'large' | 'utility'; // <2MWh, 2-15MWh, 15-100MWh, >100MWh
  pricePerKWh: number;
  chemistry: 'lfp' | 'nmc' | 'lto' | 'sodium-ion';
  region: string; // 'us', 'eu', 'china', 'global'
  includes: string[]; // ['battery', 'pcs', 'bos', 'installation']
}

export interface ProductData {
  manufacturer: string;
  model: string;
  category: 'battery' | 'inverter' | 'pcs' | 'ems' | 'container';
  capacity?: number; // MWh for batteries
  power?: number; // MW for inverters/PCS
  chemistry?: string;
  efficiency?: number;
  warranty: number; // years
  cycleLife: number;
  price?: number;
  availability: 'in-stock' | 'lead-time' | 'discontinued';
  leadTimeDays?: number;
  certifications: string[]; // ['ul9540', 'ul1973', 'ieee1547', 'iec62619']
  lastUpdated: string;
}

export interface FinancingOption {
  provider: string;
  type: 'loan' | 'lease' | 'ppa' | 'saas' | 'ownership';
  interestRate?: number;
  term: number; // years
  minProjectSize?: number; // million USD
  maxProjectSize?: number;
  region: string[];
  sector: string[]; // ['commercial', 'industrial', 'utility', 'residential']
  requirements: string[];
  incentivesIncluded: string[]; // ['itc', 'macrs', 'sgip']
  lastUpdated: string;
}

export interface IncentiveProgram {
  name: string;
  state?: string;
  region: string;
  type: 'tax-credit' | 'rebate' | 'grant' | 'performance-payment';
  value: number | string; // dollar amount or percentage
  eligibility: string[];
  deadline?: string;
  status: 'active' | 'paused' | 'expired';
  applicationLink?: string;
  lastUpdated: string;
}

export interface IndustryNews {
  title: string;
  source: string;
  category: 'pricing' | 'deployment' | 'regulation' | 'technology' | 'market';
  summary: string;
  url: string;
  publishDate: string;
  relevanceScore: number; // 0-100, how relevant to BESS industry
}

export interface ConfigurationBestPractice {
  useCase: string;
  industryStandard: string; // e.g., "IEEE 1547-2018"
  recommendedPowerMW: { min: number; max: number; typical: number };
  recommendedDurationHrs: { min: number; max: number; typical: number };
  recommendedChemistry: string[];
  safetyFactor: number;
  cyclesPerYear: number;
  roundTripEfficiency: number;
  source: string; // 'nrel', 'epri', 'ieee', 'industry-survey'
  lastUpdated: string;
}

/**
 * Fetch latest battery pricing data from multiple sources
 */
export async function collectBatteryPricing(): Promise<BatteryPricingData[]> {
  if (import.meta.env.DEV) { console.log('🔄 [AI Data Collection] Fetching battery pricing data...'); }
  
  // In production, this would fetch from:
  // - BloombergNEF API
  // - NREL ATB database
  // - Lazard LCOS reports
  // - Wood Mackenzie data feeds
  
  const mockPricingData: BatteryPricingData[] = [
    {
      date: new Date().toISOString(),
      source: 'bnef',
      systemSize: 'small',
      pricePerKWh: 168,
      chemistry: 'lfp',
      region: 'us',
      includes: ['battery', 'pcs', 'bos', 'installation']
    },
    {
      date: new Date().toISOString(),
      source: 'bnef',
      systemSize: 'medium',
      pricePerKWh: 138,
      chemistry: 'lfp',
      region: 'us',
      includes: ['battery', 'pcs', 'bos', 'installation']
    },
    {
      date: new Date().toISOString(),
      source: 'bnef',
      systemSize: 'large',
      pricePerKWh: 118,
      chemistry: 'lfp',
      region: 'us',
      includes: ['battery', 'pcs', 'bos', 'installation']
    }
  ];
  
  // Store in database
  try {
    const { error } = await supabase
      .from('battery_pricing')
      .upsert(mockPricingData, { onConflict: 'date,source,systemSize' });
    
    if (error) {
      console.error('Error storing pricing data:', error);
    } else {
      if (import.meta.env.DEV) { console.log('✅ Battery pricing data updated'); }
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  
  return mockPricingData;
}

/**
 * Fetch latest product specifications
 */
export async function collectProductData(): Promise<ProductData[]> {
  if (import.meta.env.DEV) { console.log('🔄 [AI Data Collection] Fetching product data...'); }
  
  // In production, scrape/API from:
  // - Tesla Energy
  // - BYD Battery-Box
  // - LG Chem
  // - CATL
  // - Samsung SDI
  // - Fluence
  // - Powin
  
  const mockProducts: ProductData[] = [
    {
      manufacturer: 'Tesla',
      model: 'Megapack 2XL',
      category: 'battery',
      capacity: 3.9, // MWh
      power: 1.9, // MW
      chemistry: 'lfp',
      efficiency: 92.5,
      warranty: 15,
      cycleLife: 4000,
      availability: 'lead-time',
      leadTimeDays: 180,
      certifications: ['ul9540', 'ul1973', 'ieee1547'],
      lastUpdated: new Date().toISOString()
    },
    {
      manufacturer: 'BYD',
      model: 'Battery-Box Premium HVS',
      category: 'battery',
      capacity: 0.0025, // 2.5 kWh module
      chemistry: 'lfp',
      efficiency: 95,
      warranty: 10,
      cycleLife: 6000,
      availability: 'in-stock',
      certifications: ['ul9540', 'iec62619'],
      lastUpdated: new Date().toISOString()
    }
  ];
  
  try {
    const { error } = await supabase
      .from('product_catalog')
      .upsert(mockProducts, { onConflict: 'manufacturer,model' });
    
    if (error) {
      console.error('Error storing product data:', error);
    } else {
      if (import.meta.env.DEV) { console.log('✅ Product data updated'); }
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  
  return mockProducts;
}

/**
 * Fetch latest financing options and rates
 */
export async function collectFinancingData(): Promise<FinancingOption[]> {
  if (import.meta.env.DEV) { console.log('🔄 [AI Data Collection] Fetching financing data...'); }
  
  // In production, API from:
  // - Generate Capital
  // - Sunrun (commercial)
  // - Key Finance
  // - Mosaic
  // - CleanFund
  
  const mockFinancing: FinancingOption[] = [
    {
      provider: 'Generate Capital',
      type: 'saas',
      term: 20,
      minProjectSize: 2,
      region: ['us'],
      sector: ['commercial', 'industrial'],
      requirements: ['investment-grade credit', 'long-term PPA'],
      incentivesIncluded: ['itc', 'macrs'],
      lastUpdated: new Date().toISOString()
    },
    {
      provider: 'Key Finance',
      type: 'loan',
      interestRate: 5.2,
      term: 10,
      minProjectSize: 0.5,
      maxProjectSize: 20,
      region: ['us'],
      sector: ['commercial', 'industrial'],
      requirements: ['good credit', 'collateral'],
      incentivesIncluded: ['itc'],
      lastUpdated: new Date().toISOString()
    }
  ];
  
  try {
    const { error } = await supabase
      .from('financing_options')
      .upsert(mockFinancing, { onConflict: 'provider,type' });
    
    if (error) {
      console.error('Error storing financing data:', error);
    } else {
      if (import.meta.env.DEV) { console.log('✅ Financing data updated'); }
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  
  return mockFinancing;
}

/**
 * Fetch latest industry news
 */
export async function collectIndustryNews(): Promise<IndustryNews[]> {
  if (import.meta.env.DEV) { console.log('🔄 [AI Data Collection] Fetching industry news...'); }
  
  // In production, fetch from:
  // - Energy Storage News API
  // - Greentech Media
  // - PV Magazine
  // - Utility Dive
  // - Bloomberg Energy
  // - NREL press releases
  
  const mockNews: IndustryNews[] = [
    {
      title: 'Tesla completes 730 MWh Megapack installation at Moss Landing, CA',
      source: 'Energy Storage News',
      category: 'deployment',
      summary: 'World\'s largest battery system now operational, providing grid stability services',
      url: 'https://www.energy-storage.news/tesla-moss-landing',
      publishDate: new Date().toISOString(),
      relevanceScore: 95
    },
    {
      title: 'LFP battery prices drop 12% YoY to $95/kWh at cell level',
      source: 'BloombergNEF',
      category: 'pricing',
      summary: 'Lithium iron phosphate battery costs continue declining, approaching $80/kWh by 2026',
      url: 'https://www.bnef.com/battery-prices-2024',
      publishDate: new Date().toISOString(),
      relevanceScore: 100
    },
    {
      title: 'California mandates 52 GW of energy storage by 2045',
      source: 'Utility Dive',
      category: 'regulation',
      summary: 'CPUC finalizes storage procurement targets to support renewable integration',
      url: 'https://www.utilitydive.com/california-storage-mandate',
      publishDate: new Date().toISOString(),
      relevanceScore: 90
    }
  ];
  
  try {
    const { error } = await supabase
      .from('industry_news')
      .upsert(mockNews, { onConflict: 'title,source' });
    
    if (error) {
      console.error('Error storing news data:', error);
    } else {
      if (import.meta.env.DEV) { console.log('✅ Industry news updated'); }
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  
  return mockNews;
}

/**
 * Fetch latest incentive programs
 */
export async function collectIncentiveData(): Promise<IncentiveProgram[]> {
  if (import.meta.env.DEV) { console.log('🔄 [AI Data Collection] Fetching incentive data...'); }
  
  // In production, scrape/API from:
  // - DSIRE database (NC Clean Energy)
  // - State energy offices
  // - SGIP (California)
  // - ConnectedSolutions (Massachusetts)
  // - NYSERDA (New York)
  
  const mockIncentives: IncentiveProgram[] = [
    {
      name: 'Federal Investment Tax Credit (ITC)',
      region: 'national',
      type: 'tax-credit',
      value: '30%',
      eligibility: ['solar+storage', 'standalone storage (after 2023)'],
      status: 'active',
      applicationLink: 'https://www.irs.gov/forms-pubs/about-form-5695',
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'SGIP (Self-Generation Incentive Program)',
      state: 'CA',
      region: 'california',
      type: 'rebate',
      value: '$200-400/kWh',
      eligibility: ['energy storage', 'behind-the-meter', 'california utility customers'],
      status: 'active',
      deadline: '2026-12-31',
      applicationLink: 'https://www.selfgenca.com',
      lastUpdated: new Date().toISOString()
    },
    {
      name: 'ConnectedSolutions',
      state: 'MA',
      region: 'massachusetts',
      type: 'performance-payment',
      value: '$225-275/kW/summer',
      eligibility: ['demand response', 'storage', 'massachusetts residents'],
      status: 'active',
      applicationLink: 'https://www.nationalgridus.com/connected-solutions',
      lastUpdated: new Date().toISOString()
    }
  ];
  
  try {
    const { error } = await supabase
      .from('incentive_programs')
      .upsert(mockIncentives, { onConflict: 'name,region' });
    
    if (error) {
      console.error('Error storing incentive data:', error);
    } else {
      if (import.meta.env.DEV) { console.log('✅ Incentive data updated'); }
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  
  return mockIncentives;
}

/**
 * Run daily data collection - updates all data sources
 */
export async function runDailyDataCollection(): Promise<void> {
  if (import.meta.env.DEV) { console.log('🤖 [AI Data Collection] Starting daily update...'); }
  const startTime = Date.now();
  
  try {
    // Run all collections in parallel
    const results = await Promise.allSettled([
      collectBatteryPricing(),
      collectProductData(),
      collectFinancingData(),
      collectIndustryNews(),
      collectIncentiveData()
    ]);
    
    // Log results
    results.forEach((result, index) => {
      const sources = ['pricing', 'products', 'financing', 'news', 'incentives'];
      if (result.status === 'fulfilled') {
        if (import.meta.env.DEV) { console.log(`✅ ${sources[index]}: ${result.value.length} items collected`); }
      } else {
        console.error(`❌ ${sources[index]} failed:`, result.reason);
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    if (import.meta.env.DEV) { console.log(`✅ [AI Data Collection] Daily update complete in ${duration}s`); }
    
    // Store collection metadata
    await supabase.from('data_collection_log').insert({
      collection_date: new Date().toISOString(),
      duration_seconds: parseFloat(duration),
      status: 'success',
      items_collected: results.filter(r => r.status === 'fulfilled').length
    });
    
  } catch (error) {
    console.error('❌ [AI Data Collection] Fatal error:', error);
    
    // Log error
    await supabase.from('data_collection_log').insert({
      collection_date: new Date().toISOString(),
      status: 'error',
      error_message: String(error)
    });
  }
}

/**
 * Initialize data collection service
 * - Runs on app startup
 * - Schedules daily updates
 */
export function initializeAIDataCollection(): void {
  if (import.meta.env.DEV) { console.log('🤖 [AI Data Collection] Service initialized'); }
  
  // Run initial collection
  runDailyDataCollection();
  
  // Schedule daily updates at 2 AM
  const now = new Date();
  const next2AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    2,
    0,
    0,
    0
  );
  const msUntil2AM = next2AM.getTime() - now.getTime();
  
  setTimeout(() => {
    runDailyDataCollection();
    // Then every 24 hours
    setInterval(runDailyDataCollection, 24 * 60 * 60 * 1000);
  }, msUntil2AM);
  
  if (import.meta.env.DEV) { console.log(`📅 Next collection scheduled for ${next2AM.toLocaleString()}`); }
}

/**
 * Get latest data for AI model usage
 */
export async function getLatestAIData() {
  const [pricing, products, financing, news, incentives] = await Promise.all([
    supabase.from('battery_pricing').select('*').order('date', { ascending: false }).limit(10),
    supabase.from('product_catalog').select('*').eq('availability', 'in-stock'),
    supabase.from('financing_options').select('*').order('lastUpdated', { ascending: false }),
    supabase.from('industry_news').select('*').order('publishDate', { ascending: false }).limit(20),
    supabase.from('incentive_programs').select('*').eq('status', 'active')
  ]);
  
  return {
    pricing: pricing.data || [],
    products: products.data || [],
    financing: financing.data || [],
    news: news.data || [],
    incentives: incentives.data || []
  };
}
