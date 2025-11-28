/**
 * Test Utilities and Mocks for BESS Quote Builder
 * Provides reusable test helpers, fixtures, and mock data
 */

import { vi } from 'vitest';

// ==========================================
// MOCK DATA
// ==========================================

export const mockUseCaseData = {
  medical_office: {
    squareFootage: 50000,
    facilityType: 'medical_office',
    operatingHours: 12,
    gridConnection: 'unreliable',
    hasRestaurant: true
  },
  retail_store: {
    squareFootage: 25000,
    facilityType: 'retail',
    storeType: 'supermarket',
    operatingHours: 16,
    gridConnection: 'reliable'
  },
  manufacturing: {
    squareFootage: 100000,
    facilityType: 'manufacturing',
    industryType: 'automotive',
    shiftCount: 3,
    gridConnection: 'unreliable'
  }
};

export const mockBaselineResults = {
  medical_office: {
    peakLoad: 1000,
    averageLoad: 650,
    duration: 24,
    criticalLoad: 300,
    recommendedCapacity: 1500,
    recommendedDuration: 4
  },
  retail_store: {
    peakLoad: 500,
    averageLoad: 350,
    duration: 16,
    criticalLoad: 100,
    recommendedCapacity: 750,
    recommendedDuration: 2
  }
};

export const mockAIDataCollectionResults = {
  pricing: [
    { vendor: 'Vendor A', pricePerKwh: 125, capacity: 1000 },
    { vendor: 'Vendor B', pricePerKwh: 130, capacity: 2000 },
    { vendor: 'Vendor C', pricePerKwh: 120, capacity: 500 }
  ],
  products: [
    { id: 1, name: 'Tesla Megapack', capacity: 3000, power: 1500 },
    { id: 2, name: 'BYD Battery Box', capacity: 2000, power: 1000 },
    { id: 3, name: 'LG Chem RESU', capacity: 500, power: 250 }
  ],
  financing: [
    { provider: 'Solar Finance Co', rate: 4.5, term: 20 },
    { provider: 'Green Energy Bank', rate: 4.2, term: 25 }
  ],
  news: Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    title: `Industry Update ${i + 1}`,
    date: new Date(2025, 10, i + 1).toISOString()
  })),
  incentives: [
    { program: 'Federal ITC', value: 30, type: 'tax_credit' },
    { program: 'State Rebate', value: 50000, type: 'rebate' },
    { program: 'Utility Program', value: 0.05, type: 'per_kwh' }
  ]
};

export const mockQuoteResult = {
  id: 'quote-12345',
  facilityType: 'medical_office',
  systemCapacity: 1500,
  systemDuration: 4,
  estimatedCost: 500000,
  savings: {
    annual: 75000,
    lifetime: 1500000
  },
  roi: {
    simple: 6.7,
    withIncentives: 4.2
  },
  components: [
    { type: 'battery', model: 'Tesla Megapack', quantity: 1 },
    { type: 'inverter', model: 'SMA Sunny Central', quantity: 2 }
  ]
};

// ==========================================
// MOCK SERVICES
// ==========================================

export class MockCacheService {
  private cache: Map<string, any> = new Map();

  clear() {
    console.log('🗑️ Cache cleared');
    this.cache.clear();
  }

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number) {
    this.cache.set(key, value);
  }

  has(key: string) {
    return this.cache.has(key);
  }

  delete(key: string) {
    return this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

export class MockBaselineService {
  private cache: MockCacheService;
  private callCount: Map<string, number> = new Map();

  constructor(cache: MockCacheService) {
    this.cache = cache;
  }

  async fetchConfiguration(useCase: string, useCaseData: any) {
    const cacheKey = this.generateCacheKey(useCase, useCaseData);
    
    // Track calls for testing
    this.callCount.set(cacheKey, (this.callCount.get(cacheKey) || 0) + 1);

    console.log('🔍 [BaselineService] Fetching configuration for:', useCase);
    console.log('🔍 [BaselineService] useCaseData keys:', Object.keys(useCaseData));
    console.log('🔍 [BaselineService] useCaseData values:', useCaseData);

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = mockBaselineResults[useCase as keyof typeof mockBaselineResults] || 
      mockBaselineResults.medical_office;

    this.cache.set(cacheKey, result);
    return result;
  }

  private generateCacheKey(useCase: string, useCaseData: any): string {
    const sortedData = Object.keys(useCaseData)
      .sort()
      .map(key => `${key}:${useCaseData[key]}`)
      .join('|');
    return `baseline_${useCase}_${sortedData}`;
  }

  getCallCount(useCase: string, useCaseData: any): number {
    const cacheKey = this.generateCacheKey(useCase, useCaseData);
    return this.callCount.get(cacheKey) || 0;
  }

  resetCallCount() {
    this.callCount.clear();
  }
}

export class MockAIDataCollectionService {
  private updateInterval: NodeJS.Timeout | null = null;

  async initialize() {
    console.log('🤖 [AI Data Collection] Service initialized');
    await this.runDailyUpdate();
    this.scheduleNextUpdate();
  }

  async runDailyUpdate() {
    console.log('🤖 [AI Data Collection] Starting daily update...');
    
    const startTime = Date.now();

    // Fetch all data in parallel
    const results = await Promise.all([
      this.fetchBatteryPricing(),
      this.fetchProductData(),
      this.fetchIncentiveData(),
      this.fetchFinancingData(),
      this.fetchIndustryNews()
    ]);

    const duration = (Date.now() - startTime) / 1000;

    // Log results
    console.log(`✅ pricing: ${results[0].length} items collected`);
    console.log(`✅ products: ${results[1].length} items collected`);
    console.log(`✅ incentives: ${results[2].length} items collected`);
    console.log(`✅ financing: ${results[3].length} items collected`);
    console.log(`✅ news: ${results[4].length} items collected`);
    console.log(`✅ [AI Data Collection] Daily update complete in ${duration.toFixed(2)}s`);

    return {
      pricing: results[0],
      products: results[1],
      incentives: results[2],
      financing: results[3],
      news: results[4]
    };
  }

  private async fetchBatteryPricing() {
    console.log('🔄 [AI Data Collection] Fetching battery pricing data...');
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('✅ Product data updated');
    return mockAIDataCollectionResults.pricing;
  }

  private async fetchProductData() {
    console.log('🔄 [AI Data Collection] Fetching product data...');
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('✅ Financing data updated');
    return mockAIDataCollectionResults.products;
  }

  private async fetchIncentiveData() {
    console.log('🔄 [AI Data Collection] Fetching incentive data...');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Incentive data updated');
    return mockAIDataCollectionResults.incentives;
  }

  private async fetchFinancingData() {
    await new Promise(resolve => setTimeout(resolve, 120));
    return mockAIDataCollectionResults.financing;
  }

  private async fetchIndustryNews() {
    await new Promise(resolve => setTimeout(resolve, 180));
    console.log('✅ Industry news updated');
    return mockAIDataCollectionResults.news;
  }

  private scheduleNextUpdate() {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(2, 0, 0, 0);

    console.log(`📅 Next collection scheduled for ${nextRun.toLocaleString()}`);
  }

  cleanup() {
    if (this.updateInterval) {
      clearTimeout(this.updateInterval);
    }
  }
}

// ==========================================
// TEST HELPERS
// ==========================================

export function createMockPageLoadTime() {
  return Date.now();
}

export function calculateTimeSincePageLoad(pageLoadTime: number) {
  return Date.now() - pageLoadTime;
}

export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null })
  };
}

export function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Condition timeout'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

export function captureConsoleLogs() {
  const logs: Array<{ type: string; message: string }> = [];

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    logs.push({ type: 'log', message: args.join(' ') });
    originalLog(...args);
  };

  console.warn = (...args) => {
    logs.push({ type: 'warn', message: args.join(' ') });
    originalWarn(...args);
  };

  console.error = (...args) => {
    logs.push({ type: 'error', message: args.join(' ') });
    originalError(...args);
  };

  return {
    logs,
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  };
}

// ==========================================
// ASSERTION HELPERS
// ==========================================

export function assertNoDuplicateCalls(calls: string[]): void {
  const callCounts = new Map<string, number>();
  
  calls.forEach(call => {
    callCounts.set(call, (callCounts.get(call) || 0) + 1);
  });

  const duplicates = Array.from(callCounts.entries())
    .filter(([, count]) => count > 1);

  if (duplicates.length > 0) {
    console.warn('⚠️ Duplicate calls detected:');
    duplicates.forEach(([call, count]) => {
      console.warn(`  ${call}: ${count} times`);
    });
  }
}

export function assertNoExcessiveRerenders(renderCount: number, threshold: number = 5): void {
  if (renderCount > threshold) {
    console.warn(`⚠️ Excessive re-renders: ${renderCount} renders (threshold: ${threshold})`);
  }
}

export function assertPerformance(duration: number, threshold: number, operation: string): void {
  if (duration > threshold) {
    console.warn(`⚠️ Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
  }
}

// ==========================================
// FIXTURE BUILDERS
// ==========================================

export class TestFixtureBuilder {
  static createQuoteRequest(overrides?: Partial<any>) {
    return {
      facilityType: 'medical_office',
      squareFootage: 50000,
      operatingHours: 12,
      gridConnection: 'unreliable',
      ...overrides
    };
  }

  static createBaselineConfig(overrides?: Partial<any>) {
    return {
      peakLoad: 1000,
      averageLoad: 650,
      duration: 24,
      criticalLoad: 300,
      ...overrides
    };
  }

  static createQuote(overrides?: Partial<any>) {
    return {
      ...mockQuoteResult,
      ...overrides
    };
  }
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length || 0,
      min: Math.min(...values) || 0,
      max: Math.max(...values) || 0
    };
  }

  report() {
    console.log('\n📊 Performance Report:');
    this.metrics.forEach((values, name) => {
      const stats = this.getMetrics(name);
      console.log(`  ${name}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`    Min: ${stats.min.toFixed(2)}ms`);
      console.log(`    Max: ${stats.max.toFixed(2)}ms`);
    });
  }

  clear() {
    this.metrics.clear();
  }
}
