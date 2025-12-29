/**
 * Price Alert System Demo
 * Demonstrates how to use the energy price alert system
 */

import { 
  extractPricingFromArticle, 
  savePriceAlert, 
  getRecentPriceAlerts, 
  getExcellentDeals,
  processNewsForPriceAlerts,
  type NewsArticle,
  type EnergyPriceAlert
} from '../services/priceAlertService';

// =====================================================
// DEMO 1: Extract pricing from a single article
// =====================================================

async function demo1_extractPricing() {
  console.log('📰 DEMO 1: Extract Pricing from News Article\n');
  
  const article: NewsArticle = {
    title: 'Discovery Energy Announces Record-Low $118.50/kWh Battery Pricing for 50MW California Project',
    url: 'https://energystoragenews.com/discovery-118-kwh-deal',
    publisher: 'Energy Storage News',
    publishDate: new Date().toISOString(),
    content: `
      Discovery Energy today announced a landmark deal providing 50MW/200MWh 
      battery storage at just $118.50/kWh for a California community solar project. 
      This pricing represents a 15% reduction from previous California deals and 
      signals continued cost reduction in LFP battery systems.
      
      The project, located in Fresno County, will provide grid services to PG&E 
      and is expected to be operational by Q2 2026. Discovery Energy's PowerBlock 2MW 
      system was selected for its proven reliability and competitive pricing.
    `,
    summary: 'Discovery Energy secured 50MW battery deal at $118.50/kWh in California'
  };
  
  const alerts = extractPricingFromArticle(article);
  
  console.log(`Found ${alerts.length} pricing alerts:\n`);
  
  alerts.forEach((alert, index) => {
    console.log(`Alert #${index + 1}:`);
    console.log(`  Type: ${alert.alertType}`);
    console.log(`  Level: ${alert.alertLevel}`);
    console.log(`  Price: $${alert.priceValue}/${alert.priceUnit.toUpperCase()}`);
    console.log(`  Vendor: ${alert.vendorCompany || 'Unknown'}`);
    console.log(`  Location: ${alert.projectLocation || 'Unknown'}`);
    console.log(`  Project Size: ${alert.projectSizeMw || 'N/A'} MW`);
    console.log(`  Baseline: $${alert.baselinePrice}/kWh`);
    console.log(`  Difference: ${alert.priceDifferencePercent?.toFixed(1)}%`);
    console.log(`  Below Market: ${alert.isBelowMarket ? 'Yes ✅' : 'No'}`);
    console.log(`  Relevance: ${alert.relevanceScore}/100`);
    console.log(`  Summary: ${alert.dealSummary}`);
    console.log('');
  });
}

// =====================================================
// DEMO 2: Save alert to database
// =====================================================

async function demo2_saveAlert() {
  console.log('💾 DEMO 2: Save Price Alert to Database\n');
  
  const alert: EnergyPriceAlert = {
    alertType: 'battery_kwh',
    alertLevel: 'excellent_deal',
    priceValue: 118.50,
    priceUnit: 'kwh',
    currency: 'USD',
    dealName: 'California Community Solar + Storage',
    projectSizeMw: 50.0,
    projectLocation: 'Fresno County, California, USA',
    vendorCompany: 'Discovery Energy',
    sourceTitle: 'Discovery Energy Announces Record-Low $118.50/kWh Battery Pricing',
    sourceUrl: 'https://energystoragenews.com/discovery-118-kwh-deal',
    sourcePublisher: 'Energy Storage News',
    publishDate: new Date().toISOString(),
    dealSummary: 'Discovery Energy secured a landmark deal providing 50MW/200MWh battery storage at $118.50/kWh',
    marketImpact: 'Significant - This pricing undercuts previous California deals by 15%',
    priceTrend: 'declining',
    relevanceScore: 95,
    industrySector: 'utility',
    technologyType: 'lfp',
    baselinePrice: 140.0,
    priceDifferencePercent: -15.36,
    isBelowMarket: true,
    verified: false
  };
  
  const result = await savePriceAlert(alert);
  
  if (result.success) {
    console.log(`✅ Alert saved successfully!`);
    console.log(`   Alert ID: ${result.id}`);
  } else {
    console.log(`❌ Error saving alert: ${result.error}`);
  }
}

// =====================================================
// DEMO 3: Fetch recent alerts
// =====================================================

async function demo3_fetchRecentAlerts() {
  console.log('📊 DEMO 3: Fetch Recent Price Alerts\n');
  
  const alerts = await getRecentPriceAlerts(5, undefined, false);
  
  console.log(`Found ${alerts.length} recent alerts:\n`);
  
  alerts.forEach((alert, index) => {
    console.log(`${index + 1}. ${alert.sourceTitle}`);
    console.log(`   Price: $${alert.priceValue}/${alert.priceUnit.toUpperCase()}`);
    console.log(`   Level: ${alert.alertLevel}`);
    console.log(`   ${alert.priceDifferencePercent?.toFixed(1)}% vs baseline`);
    console.log(`   ${alert.vendorCompany || 'Unknown vendor'} | ${alert.projectLocation || 'Unknown location'}`);
    console.log('');
  });
}

// =====================================================
// DEMO 4: Fetch excellent deals only
// =====================================================

async function demo4_fetchExcellentDeals() {
  console.log('💎 DEMO 4: Fetch Excellent Deals (20%+ Below Market)\n');
  
  const deals = await getExcellentDeals(3);
  
  console.log(`Found ${deals.length} excellent deals:\n`);
  
  deals.forEach((deal, index) => {
    console.log(`${index + 1}. ${deal.dealName || deal.sourceTitle}`);
    console.log(`   Price: $${deal.priceValue}/${deal.priceUnit.toUpperCase()}`);
    console.log(`   Savings: ${Math.abs(deal.priceDifferencePercent || 0).toFixed(1)}% below market`);
    console.log(`   Vendor: ${deal.vendorCompany || 'Unknown'}`);
    console.log(`   Location: ${deal.projectLocation || 'Unknown'}`);
    console.log(`   Relevance: ${deal.relevanceScore}/100`);
    console.log('');
  });
}

// =====================================================
// DEMO 5: Batch process multiple news articles
// =====================================================

async function demo5_batchProcess() {
  console.log('🔄 DEMO 5: Batch Process Multiple News Articles\n');
  
  const articles: NewsArticle[] = [
    {
      title: 'LiON Energy Wins $48.5M Texas BESS Contract',
      url: 'https://utilitydive.com/lion-texas-contract',
      publisher: 'Utility Dive',
      publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      content: `
        LiON Energy has been awarded a contract for a 100MW/400MWh battery system 
        at $485,000 per MWh total installed cost for ERCOT grid services. The project 
        includes a 15-year warranty and performance guarantees. LiON's SafeLiFe 2MW 
        systems will be deployed across multiple sites in West Texas.
      `
    },
    {
      title: 'SimpliPhi Powers 50-Building Portfolio in NYC',
      url: 'https://commercialobserver.com/simpliphi-nyc',
      publisher: 'Commercial Observer',
      publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      content: `
        SimpliPhi Power has deployed 5MW of modular battery storage across 50 commercial 
        buildings in New York City at $165/kWh. The systems will provide demand response 
        and backup power for the portfolio, which includes office buildings and retail spaces.
      `
    },
    {
      title: 'Tesla Megapack 2XL Pricing Drops to $135/kWh for Utility Projects',
      url: 'https://pv-magazine.com/tesla-pricing-2025',
      publisher: 'PV Magazine',
      publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      content: `
        Tesla Energy has reduced pricing for its Megapack 2XL to $135/kWh for utility-scale 
        projects over 100MW. The company cites improved manufacturing efficiency and higher 
        production volumes at its Nevada Gigafactory. A 200MW/800MWh project in Arizona was 
        recently contracted at this new pricing level.
      `
    }
  ];
  
  console.log(`Processing ${articles.length} news articles...\n`);
  
  const alertsCreated = await processNewsForPriceAlerts(articles);
  
  console.log(`\n✅ Created ${alertsCreated} price alerts from ${articles.length} articles`);
  console.log(`   ${(alertsCreated / articles.length * 100).toFixed(0)}% success rate`);
}

// =====================================================
// DEMO 6: Show pricing trends analysis
// =====================================================

async function demo6_pricingTrends() {
  console.log('📈 DEMO 6: Analyze Pricing Trends\n');
  
  const alerts = await getRecentPriceAlerts(20, 'battery_kwh', true);
  
  if (alerts.length === 0) {
    console.log('No alerts available for analysis');
    return;
  }
  
  // Calculate statistics
  const prices = alerts.map(a => a.priceValue);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  const decliningCount = alerts.filter(a => a.priceTrend === 'declining').length;
  const stableCount = alerts.filter(a => a.priceTrend === 'stable').length;
  const risingCount = alerts.filter(a => a.priceTrend === 'rising').length;
  
  const belowMarketCount = alerts.filter(a => a.isBelowMarket).length;
  
  console.log('Battery kWh Pricing Analysis:');
  console.log(`  Sample Size: ${alerts.length} alerts`);
  console.log(`  Average Price: $${avgPrice.toFixed(2)}/kWh`);
  console.log(`  Price Range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}/kWh`);
  console.log('');
  console.log('Trend Distribution:');
  console.log(`  Declining: ${decliningCount} (${(decliningCount / alerts.length * 100).toFixed(0)}%)`);
  console.log(`  Stable: ${stableCount} (${(stableCount / alerts.length * 100).toFixed(0)}%)`);
  console.log(`  Rising: ${risingCount} (${(risingCount / alerts.length * 100).toFixed(0)}%)`);
  console.log('');
  console.log('Market Comparison:');
  console.log(`  Below Market: ${belowMarketCount} deals (${(belowMarketCount / alerts.length * 100).toFixed(0)}%)`);
  console.log(`  Above Market: ${alerts.length - belowMarketCount} deals`);
  console.log('');
  
  // Top vendors
  const vendorCounts: Record<string, number> = {};
  alerts.forEach(a => {
    if (a.vendorCompany) {
      vendorCounts[a.vendorCompany] = (vendorCounts[a.vendorCompany] || 0) + 1;
    }
  });
  
  const topVendors = Object.entries(vendorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  if (topVendors.length > 0) {
    console.log('Top Vendors:');
    topVendors.forEach(([vendor, count], index) => {
      console.log(`  ${index + 1}. ${vendor}: ${count} deals`);
    });
  }
}

// =====================================================
// RUN ALL DEMOS
// =====================================================

async function runAllDemos() {
  console.log('🚀 Energy Price Alert System - Demo\n');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    await demo1_extractPricing();
    console.log('='.repeat(60));
    console.log('');
    
    await demo2_saveAlert();
    console.log('='.repeat(60));
    console.log('');
    
    await demo3_fetchRecentAlerts();
    console.log('='.repeat(60));
    console.log('');
    
    await demo4_fetchExcellentDeals();
    console.log('='.repeat(60));
    console.log('');
    
    await demo5_batchProcess();
    console.log('='.repeat(60));
    console.log('');
    
    await demo6_pricingTrends();
    console.log('='.repeat(60));
    console.log('');
    
    console.log('✅ All demos completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Export for use in other files
export {
  demo1_extractPricing,
  demo2_saveAlert,
  demo3_fetchRecentAlerts,
  demo4_fetchExcellentDeals,
  demo5_batchProcess,
  demo6_pricingTrends,
  runAllDemos
};

// Run demos if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos();
}
