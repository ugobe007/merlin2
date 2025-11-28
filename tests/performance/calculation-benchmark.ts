/**
 * Calculation Performance Benchmark
 * ==================================
 * Tests all calculation services for performance bottlenecks
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  functionName: string;
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  status: 'FAST' | 'ACCEPTABLE' | 'SLOW';
}

class CalculationBenchmark {
  private results: BenchmarkResult[] = [];
  
  async benchmark(
    functionName: string,
    fn: () => Promise<any>,
    iterations: number = 10,
    acceptableAvg: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const totalTime = times.reduce((a, b) => a + b, 0);
    
    const status = avgTime < acceptableAvg ? 'FAST' :
                   avgTime < acceptableAvg * 2 ? 'ACCEPTABLE' : 'SLOW';
    
    const result: BenchmarkResult = {
      functionName,
      iterations,
      avgTime: Math.round(avgTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      status
    };
    
    this.results.push(result);
    return result;
  }
  
  printReport() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           CALCULATION PERFORMANCE BENCHMARK               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'FAST' ? '🚀' :
                   result.status === 'ACCEPTABLE' ? '✅' : '⚠️';
      
      console.log(`${icon} Function ${index + 1}: ${result.functionName}`);
      console.log(`   Iterations: ${result.iterations}`);
      console.log(`   Avg: ${result.avgTime}ms | Min: ${result.minTime}ms | Max: ${result.maxTime}ms`);
      console.log(`   Total: ${result.totalTime}ms | Status: ${result.status}`);
      console.log('');
    });
    
    const slow = this.results.filter(r => r.status === 'SLOW');
    if (slow.length > 0) {
      console.log('⚠️ SLOW CALCULATIONS:');
      slow.forEach(r => console.log(`   - ${r.functionName}: ${r.avgTime}ms avg`));
      console.log('');
    }
    
    console.log('═════════════════════════════════════════════════════════════\n');
  }
}

async function runCalculationBenchmarks() {
  const benchmark = new CalculationBenchmark();
  
  console.log('🧮 Benchmarking Calculation Functions...\n');
  
  // Benchmark 1: Baseline Calculation
  await benchmark.benchmark(
    'calculateDatabaseBaseline',
    async () => {
      const { calculateDatabaseBaseline } = await import('../../src/services/baselineService');
      return calculateDatabaseBaseline('office', 1, {
        squareFootage: 50000,
        facilityType: 'medical_office'
      });
    },
    10,
    200 // 200ms acceptable
  );
  
  // Benchmark 2: Financial Metrics (Simple)
  await benchmark.benchmark(
    'calculateFinancialMetrics (Simple)',
    async () => {
      const { calculateFinancialMetrics } = await import('../../src/services/centralizedCalculations');
      return calculateFinancialMetrics({
        storageSizeMW: 0.4,
        durationHours: 4,
        electricityRate: 0.15,
        solarMW: 0,
        location: 'California',
        includeNPV: false // Faster without NPV
      });
    },
    10,
    100
  );
  
  // Benchmark 3: Financial Metrics (With NPV/IRR)
  await benchmark.benchmark(
    'calculateFinancialMetrics (Full NPV/IRR)',
    async () => {
      const { calculateFinancialMetrics } = await import('../../src/services/centralizedCalculations');
      return calculateFinancialMetrics({
        storageSizeMW: 0.4,
        durationHours: 4,
        electricityRate: 0.15,
        solarMW: 0,
        location: 'California',
        includeNPV: true // Full calculation
      });
    },
    10,
    300 // NPV/IRR is more expensive
  );
  
  // Benchmark 4: Equipment Pricing
  await benchmark.benchmark(
    'getBatteryPricing',
    async () => {
      const { getBatteryPricing } = await import('../../src/services/unifiedPricingService');
      return getBatteryPricing(400);
    },
    10,
    150
  );
  
  // Benchmark 5: Solar Sizing
  await benchmark.benchmark(
    'calculateSolarSizing',
    async () => {
      const { calculateSolarCapacity } = await import('../../src/utils/solarSizingUtils');
      return calculateSolarCapacity(0.4, 4, 12);
    },
    10,
    50
  );
  
  benchmark.printReport();
}

if (require.main === module) {
  runCalculationBenchmarks().catch(console.error);
}

export { runCalculationBenchmarks };
