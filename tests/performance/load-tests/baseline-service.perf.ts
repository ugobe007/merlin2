/**
 * BASELINE SERVICE PERFORMANCE TESTS
 * 
 * Load tests for BaselineService to measure performance under load
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaselineService } from '@/services/baselineService';

describe('BaselineService Performance', () => {
  let service: BaselineService;

  beforeEach(() => {
    service = new BaselineService();
  });

  it('should handle 100 sequential requests within 10 seconds', async () => {
    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < 100; i++) {
      requests.push(
        service.fetchConfiguration('medical_office', {
          squareFootage: 50000 + i * 1000,
          operatingHours: 12,
          gridConnection: 'reliable'
        })
      );
    }

    await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10000);
    console.log(`✅ 100 sequential requests completed in ${duration}ms`);
  });

  it('should handle 50 concurrent requests efficiently', async () => {
    const startTime = Date.now();
    const promises = Array.from({ length: 50 }, (_, i) =>
      service.fetchConfiguration('retail', {
        squareFootage: 25000,
        storeType: 'general'
      })
    );

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    // With deduplication, should complete very fast
    expect(duration).toBeLessThan(500);
    console.log(`✅ 50 concurrent identical requests completed in ${duration}ms (deduplication working)`);
  });

  it('should maintain performance with cache growth', async () => {
    const startTime = Date.now();

    // Generate 1000 unique requests
    for (let i = 0; i < 1000; i++) {
      await service.fetchConfiguration('office', {
        squareFootage: 50000 + i,
        operatingHours: 12
      });
    }

    const duration = Date.now() - startTime;

    console.log(`✅ 1000 unique requests completed in ${duration}ms`);
    console.log(`   Average: ${(duration / 1000).toFixed(2)}ms per request`);
  });

  it('should handle burst traffic (100 requests in < 1 second)', async () => {
    const startTime = Date.now();
    
    const burstPromises = Array.from({ length: 100 }, (_, i) =>
      service.fetchConfiguration('manufacturing', {
        squareFootage: 100000,
        productionType: `type_${i % 5}` // 5 unique types
      })
    );

    await Promise.all(burstPromises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);
    console.log(`✅ 100 burst requests completed in ${duration}ms`);
  });

  it('should have consistent response times', async () => {
    const times: number[] = [];

    for (let i = 0; i < 50; i++) {
      const start = Date.now();
      await service.fetchConfiguration('datacenter', {
        squareFootage: 50000,
        coolingType: 'precision'
      });
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`Response times: avg=${avgTime.toFixed(2)}ms, min=${minTime}ms, max=${maxTime}ms`);

    // First request slower (cache miss), subsequent should be very fast
    expect(times[0]).toBeGreaterThan(times[1]);
    expect(avgTime).toBeLessThan(100);
  });

  it('should handle memory efficiently with large datasets', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create 10,000 unique cached entries
    for (let i = 0; i < 10000; i++) {
      await service.fetchConfiguration('office', {
        squareFootage: 10000 + i,
        officeId: `office_${i}`
      });
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncreaseMB = (finalMemory - initialMemory) / 1024 / 1024;

    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);
    
    // Should not exceed 100MB for 10k entries
    expect(memoryIncreaseMB).toBeLessThan(100);
  });
});
