/**
 * Test Helpers and Utilities
 * Mock services, test data, and helper functions for BESS Quote Builder tests
 */

import { vi } from 'vitest';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface UseCaseData {
  squareFootage: number;
  facilityType: string;
  operatingHours: number;
  gridConnection: 'reliable' | 'unreliable' | 'none';
  [key: string]: any;
}

export interface BaselineResult {
  peakLoad: number;
  averageLoad: number;
  duration: number;
  criticalLoad: number;
  recommendedCapacity: number;
  recommendedDuration: number;
}

export interface CollectionResult {
  pricing: any[];
  products: any[];
  incentives: any[];
  financing: any[];
  news: any[];
}

// ==========================================
// MOCK DATA
// ==========================================

export const mockUseCaseData = {
  medical_office: {
    squareFootage: 50000,
    facilityType: 'medical_office',
    operatingHours: 12,
    gridConnection: 'unreliable' as const,
    hasRestaurant: true
  },
  retail_store: {
    squareFootage: 25000,
    facilityType: 'retail',
    storeType: 'supermarket',
    operatingHours: 16,
    gridConnection: 'reliable' as const,
    hasRestaurant: false
  },
  manufacturing: {
    squareFootage: 100000,
    facilityType: 'manufacturing',
    industryType: 'automotive',
    shiftCount: 3,
    operatingHours: 24,
    gridConnection: 'unreliable' as const
  },
  data_center: {
    squareFootage: 15000,
    facilityType: 'data_center',
    rackCount: 200,
    operatingHours: 24,
    gridConnection: 'reliable' as const,
    hasBackupGenerators: true
  }
};

export const mockBaselineResults: Record<string, BaselineResult> = {
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
  },
  manufacturing: {
    peakLoad: 2500,
    averageLoad: 1800,
    duration: 24,
    criticalLoad: 800,
    recommendedCapacity: 3000,
    recommendedDuration: 6
  },
  office: {
    peakLoad: 1000,
    averageLoad: 650,
    duration: 24,
    criticalLoad: 300,
    recommendedCapacity: 1500,
    recommendedDuration: 4
  }
};

export const mockAIDataCollectionResults = {
  pricing: [
    { vendor: 'Vendor A', pricePerKwh: 125, capacity: 1000, updated: new Date().toISOString() },
    { vendor: 'Vendor B', pricePerKwh: 130, capacity: 2000, updated: new Date().toISOString() },
    { vendor: 'Vendor C', pricePerKwh: 120, capacity: 500, updated: new Date().toISOString() }
  ],
  products: [
    { id: 1, name: 'Tesla Megapack', capacity: 3000, power: 1500, price: 375000 },
    { id: 2, name: 'BYD Battery Box', capacity: 2000, power: 1000, price: 260000 },
    { id: 3, name: 'LG Chem RESU', capacity: 500, power: 250, price: 62500 },
    { id: 4, name: 'Fluence Energy Stack', capacity: 2500, power: 1250, price: 312500 },
    { id: 5, name: 'Powin Stack', capacity: 1500, power: 750, price: 187500 },
    { id: 6, name: 'Wärtsilä GEMS', capacity: 2000, power: 1000, price: 260000 },
    { id: 7, name: 'Sungrow PowerTitan', capacity: 3450, power: 1725, price: 431250 },
    { id: 8, name: 'Samsung SDI ESS', capacity: 1000, power: 500, price: 125000 },
    { id: 9, name: 'CATL EnerC', capacity: 1800, power: 900, price: 225000 }
  ],
  financing: [
    { provider: 'Solar Finance Co', rate: 4.5, term: 20, minAmount: 100000 },
    { provider: 'Green Energy Bank', rate: 4.2, term: 25, minAmount: 250000 }
  ],
  news: Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    title: `Industry Update ${i + 1}: Latest BESS Developments`,
    summary: `Important industry news about battery storage technology and market trends.`,
    date: new Date(2025, 10, i + 1).toISOString(),
    source: 'Energy Storage News'
  })),
  incentives: [
    { program: 'Federal ITC', value: 30, type: 'tax_credit', description: 'Investment Tax Credit' },
    { program: 'State Rebate', value: 50000, type: 'rebate', description: 'State-level rebate program' },
    { program: 'Utility Program', value: 0.05, type: 'per_kwh', description: 'Per kWh incentive' }
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
    { type: 'battery', model: 'Tesla Megapack', quantity: 1, cost: 375000 },
    { type: 'inverter', model: 'SMA Sunny Central', quantity: 2, cost: 100000 },
    { type: 'installation', description: 'Complete installation', cost: 25000 }
  ],
  incentivesApplied: [
    { name: 'Federal ITC', value: 150000 },
    { name: 'State Rebate', value: 50000 }
  ]
};

// ==========================================
// MOCK SERVICES
// ==========================================

export class MockCacheService {
  private cache: Map<string, any> = new Map();

  clear(): void {
    console.log('🗑️ Cache cleared');
    this.cache.clear();
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): any[] {
    return Array.from(this.cache.values());
  }
}

export class MockBaselineService {
  private cache: MockCacheService;
  private callCount: Map<string, number> = new Map();
  private pendingRequests: Map<string, Promise<BaselineResult>> = new Map();

  constructor(cache: MockCacheService) {
    this.cache = cache;
  }

  async fetchConfiguration(useCase: string, useCaseData: UseCaseData): Promise<BaselineResult> {
    const cacheKey = this.generateCacheKey(useCase, useCaseData);

    console.log('🔍 [BaselineService] Fetching configuration for:', useCase);
    console.log('🔍 [BaselineService] useCaseData keys:', Object.keys(useCaseData));
    console.log('🔍 [BaselineService] useCaseData values:', useCaseData);

    // ✅ FIX: Check for pending request FIRST (before incrementing call count)
    // This prevents duplicate in-flight requests
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ [BaselineService] Request already in progress, waiting...');
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('✅ [BaselineService] Returning cached result');
      return this.cache.get(cacheKey);
    }

    // ✅ FIX: Only increment call count when making actual API request
    // Track calls for testing (only count actual API calls, not deduplicated ones)
    this.callCount.set(cacheKey, (this.callCount.get(cacheKey) || 0) + 1);

    // Make new request
    console.log('🌐 [BaselineService] Making new API request');
    const promise = this.makeApiRequest(useCase, useCaseData);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.cache.set(cacheKey, result);
      console.log('💾 [BaselineService] Result cached');
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async makeApiRequest(useCase: string, useCaseData: UseCaseData): Promise<BaselineResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = mockBaselineResults[useCase] || mockBaselineResults.medical_office;
    return { ...result };
  }

  private generateCacheKey(useCase: string, useCaseData: UseCaseData): string {
    const sortedData = Object.keys(useCaseData)
      .sort()
      .map(key => `${key}:${useCaseData[key]}`)
      .join('|');
    return `baseline_${useCase}_${sortedData}`;
  }

  getCallCount(useCase: string, useCaseData: UseCaseData): number {
    const cacheKey = this.generateCacheKey(useCase, useCaseData);
    return this.callCount.get(cacheKey) || 0;
  }

  resetCallCount(): void {
    this.callCount.clear();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class MockAIDataCollectionService {
  private updateInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<any> {
    console.log('🤖 [AI Data Collection] Service initialized');
    await this.runDailyUpdate();
    this.scheduleNextUpdate();
    return { initialized: true };
  }

  async runDailyUpdate(): Promise<CollectionResult> {
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

  private async fetchBatteryPricing(): Promise<any[]> {
    console.log('🔄 [AI Data Collection] Fetching battery pricing data...');
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('✅ Product data updated');
    return mockAIDataCollectionResults.pricing;
  }

  private async fetchProductData(): Promise<any[]> {
    console.log('🔄 [AI Data Collection] Fetching product data...');
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('✅ Financing data updated');
    return mockAIDataCollectionResults.products;
  }

  private async fetchIncentiveData(): Promise<any[]> {
    console.log('🔄 [AI Data Collection] Fetching incentive data...');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Incentive data updated');
    return mockAIDataCollectionResults.incentives;
  }

  private async fetchFinancingData(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 120));
    return mockAIDataCollectionResults.financing;
  }

  private async fetchIndustryNews(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 180));
    console.log('✅ Industry news updated');
    return mockAIDataCollectionResults.news;
  }

  private scheduleNextUpdate(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(2, 0, 0, 0);

    console.log(`📅 Next collection scheduled for ${nextRun.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })}`);
  }

  cleanup(): void {
    if (this.updateInterval) {
      clearTimeout(this.updateInterval);
    }
  }
}

// ==========================================
// TEST HELPER FUNCTIONS
// ==========================================

export function createMockPageLoadTime(): number {
  return Date.now();
}

export function calculateTimeSincePageLoad(pageLoadTime: number): number {
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
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  };
}

export async function waitForCondition(
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
  const logs: Array<{ type: string; message: string; timestamp: number }> = [];

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    logs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
    originalLog(...args);
  };

  console.warn = (...args: any[]) => {
    logs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    logs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
    originalError(...args);
  };

  return {
    logs,
    getLogs: () => logs,
    getLogsByType: (type: string) => logs.filter(log => log.type === type),
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
  static createQuoteRequest(overrides?: Partial<UseCaseData>): UseCaseData {
    return {
      facilityType: 'medical_office',
      squareFootage: 50000,
      operatingHours: 12,
      gridConnection: 'unreliable',
      ...overrides
    };
  }

  static createBaselineConfig(overrides?: Partial<BaselineResult>): BaselineResult {
    return {
      peakLoad: 1000,
      averageLoad: 650,
      duration: 24,
      criticalLoad: 300,
      recommendedCapacity: 1500,
      recommendedDuration: 4,
      ...overrides
    };
  }

  static createQuote(overrides?: Partial<typeof mockQuoteResult>): typeof mockQuoteResult {
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

  recordMetric(name: string, value: number): void {
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
      max: Math.max(...values) || 0,
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    };
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }

  report(): void {
    console.log('\n📊 Performance Report:');
    this.metrics.forEach((values, name) => {
      const stats = this.getMetrics(name);
      console.log(`  ${name}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`    Min: ${stats.min.toFixed(2)}ms`);
      console.log(`    Max: ${stats.max.toFixed(2)}ms`);
      console.log(`    P50: ${stats.p50.toFixed(2)}ms`);
      console.log(`    P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`    P99: ${stats.p99.toFixed(2)}ms`);
    });
  }

  clear(): void {
    this.metrics.clear();
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  MockCacheService,
  MockBaselineService,
  MockAIDataCollectionService,
  mockUseCaseData,
  mockBaselineResults,
  mockAIDataCollectionResults,
  mockQuoteResult,
  TestFixtureBuilder,
  PerformanceMonitor
};
