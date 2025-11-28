/**
 * MOCK BASELINE SERVICE
 * 
 * Mock implementation of BaselineService for testing
 * Includes request deduplication and call tracking
 */

export interface BaselineResult {
  peakLoad: number;
  averageLoad: number;
  duration: number;
  criticalLoad: number;
  recommendedCapacity: number;
  recommendedDuration: number;
}

export interface UseCaseData {
  [key: string]: any;
}

// Mock data for different use cases
const mockBaselineResults: Record<string, BaselineResult> = {
  'medical_office': {
    peakLoad: 1000,
    averageLoad: 650,
    duration: 12,
    criticalLoad: 300,
    recommendedCapacity: 1500,
    recommendedDuration: 4
  },
  'retail': {
    peakLoad: 1500,
    averageLoad: 1000,
    duration: 16,
    criticalLoad: 500,
    recommendedCapacity: 2000,
    recommendedDuration: 4
  },
  'manufacturing': {
    peakLoad: 2500,
    averageLoad: 1800,
    duration: 24,
    criticalLoad: 800,
    recommendedCapacity: 3000,
    recommendedDuration: 6
  },
  'office': {
    peakLoad: 1000,
    averageLoad: 650,
    duration: 24,
    criticalLoad: 300,
    recommendedCapacity: 1500,
    recommendedDuration: 4
  },
  'car-wash': {
    peakLoad: 53,
    averageLoad: 38,
    duration: 12,
    criticalLoad: 20,
    recommendedCapacity: 70,
    recommendedDuration: 3
  },
  'grocery': {
    peakLoad: 800,
    averageLoad: 600,
    duration: 18,
    criticalLoad: 400,
    recommendedCapacity: 1000,
    recommendedDuration: 4
  },
  'restaurant': {
    peakLoad: 120,
    averageLoad: 80,
    duration: 14,
    criticalLoad: 50,
    recommendedCapacity: 150,
    recommendedDuration: 3
  },
  'ev-charging': {
    peakLoad: 500,
    averageLoad: 300,
    duration: 24,
    criticalLoad: 200,
    recommendedCapacity: 600,
    recommendedDuration: 4
  },
  'datacenter': {
    peakLoad: 2000,
    averageLoad: 1800,
    duration: 24,
    criticalLoad: 1500,
    recommendedCapacity: 2500,
    recommendedDuration: 24
  },
  'hotel': {
    peakLoad: 1200,
    averageLoad: 800,
    duration: 24,
    criticalLoad: 400,
    recommendedCapacity: 1500,
    recommendedDuration: 6
  },
  'casino': {
    peakLoad: 5000,
    averageLoad: 4000,
    duration: 24,
    criticalLoad: 2000,
    recommendedCapacity: 6000,
    recommendedDuration: 8
  },
  'hospital': {
    peakLoad: 4000,
    averageLoad: 3000,
    duration: 24,
    criticalLoad: 2500,
    recommendedCapacity: 5000,
    recommendedDuration: 48
  },
  'warehouse': {
    peakLoad: 2000,
    averageLoad: 1500,
    duration: 24,
    criticalLoad: 800,
    recommendedCapacity: 2500,
    recommendedDuration: 8
  },
  'farm': {
    peakLoad: 300,
    averageLoad: 200,
    duration: 24,
    criticalLoad: 150,
    recommendedCapacity: 400,
    recommendedDuration: 8
  },
  'mining-camp': {
    peakLoad: 1000,
    averageLoad: 800,
    duration: 24,
    criticalLoad: 600,
    recommendedCapacity: 1200,
    recommendedDuration: 12
  },
  'microgrid': {
    peakLoad: 800,
    averageLoad: 500,
    duration: 24,
    criticalLoad: 400,
    recommendedCapacity: 1000,
    recommendedDuration: 10
  },
  'school': {
    peakLoad: 600,
    averageLoad: 400,
    duration: 10,
    criticalLoad: 200,
    recommendedCapacity: 800,
    recommendedDuration: 4
  },
  'university': {
    peakLoad: 5000,
    averageLoad: 3500,
    duration: 24,
    criticalLoad: 2000,
    recommendedCapacity: 6000,
    recommendedDuration: 8
  },
  'residential': {
    peakLoad: 12,
    averageLoad: 8,
    duration: 24,
    criticalLoad: 5,
    recommendedCapacity: 15,
    recommendedDuration: 8
  },
  'multifamily': {
    peakLoad: 400,
    averageLoad: 280,
    duration: 24,
    criticalLoad: 150,
    recommendedCapacity: 500,
    recommendedDuration: 6
  }
};

export class MockBaselineService {
  private cache: Map<string, BaselineResult> = new Map();
  private callCount: Map<string, number> = new Map();
  private pendingRequests: Map<string, Promise<BaselineResult>> = new Map();

  async fetchConfiguration(useCase: string, useCaseData: UseCaseData): Promise<BaselineResult> {
    const cacheKey = this.generateCacheKey(useCase, useCaseData);

    console.log('🔍 [BaselineService] Fetching configuration for:', useCase);
    console.log('🔍 [BaselineService] useCaseData keys:', Object.keys(useCaseData));
    console.log('🔍 [BaselineService] useCaseData values:', useCaseData);

    // ✅ Check for pending request FIRST (before incrementing call count)
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ [BaselineService] Request already in progress, waiting...');
      return this.pendingRequests.get(cacheKey)!;
    }

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('✅ [BaselineService] Returning cached result');
      return this.cache.get(cacheKey)!;
    }

    // ✅ Only increment call count when making actual API request
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

    const baseResult = mockBaselineResults[useCase] || mockBaselineResults.medical_office;
    
    // ✅ Scale power based on facility size (squareFootage)
    let scalingFactor = 1.0;
    if (useCaseData.squareFootage) {
      // Scale linearly with square footage
      // Base assumption: 50000 sq ft = 1.0x
      const baseSqFt = 50000;
      scalingFactor = useCaseData.squareFootage / baseSqFt;
    }
    
    // Apply scaling to power metrics
    return {
      peakLoad: Math.round(baseResult.peakLoad * scalingFactor),
      averageLoad: Math.round(baseResult.averageLoad * scalingFactor),
      duration: baseResult.duration,
      criticalLoad: Math.round(baseResult.criticalLoad * scalingFactor),
      recommendedCapacity: Math.round(baseResult.recommendedCapacity * scalingFactor),
      recommendedDuration: baseResult.recommendedDuration
    };
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
