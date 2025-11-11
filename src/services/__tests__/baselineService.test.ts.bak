/**
 * Unit Tests for Baseline Service
 * 
 * Tests the shared baseline calculation service to ensure:
 * - Database queries work correctly
 * - EV charging calculations are accurate
 * - Fallback mechanisms work
 * - Scale factors are applied properly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateDatabaseBaseline, calculateEVChargingBaseline } from '../baselineService';
import { useCaseService } from '../useCaseService';

// Mock the useCaseService
vi.mock('../useCaseService', () => ({
  useCaseService: {
    getUseCaseBySlug: vi.fn()
  }
}));

describe('baselineService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDatabaseBaseline', () => {
    it('should calculate hotel baseline correctly', async () => {
      // Mock database response
      const mockUseCase = {
        id: '1',
        name: 'Hotel/Resort',
        slug: 'hotel',
        configurations: [{
          id: '1',
          typical_load_kw: 2930,
          peak_load_kw: 3500,
          preferred_duration_hours: 4,
          is_default: true
        }]
      };

      vi.mocked(useCaseService.getUseCaseBySlug).mockResolvedValue(mockUseCase as any);

      const result = await calculateDatabaseBaseline('hotel', 1.0);

      expect(result.powerMW).toBe(2.9); // 2930 kW / 1000 * 1.0 scale, rounded
      expect(result.durationHrs).toBe(4);
      expect(result.solarMW).toBe(2.9); // 1:1 ratio
      expect(result.dataSource).toBe('database');
      expect(result.description).toContain('50 rooms');
    });

    it('should apply scale factor correctly', async () => {
      const mockUseCase = {
        id: '1',
        name: 'Hotel/Resort',
        slug: 'hotel',
        configurations: [{
          id: '1',
          typical_load_kw: 2930,
          peak_load_kw: 3500,
          preferred_duration_hours: 4,
          is_default: true
        }]
      };

      vi.mocked(useCaseService.getUseCaseBySlug).mockResolvedValue(mockUseCase as any);

      const result = await calculateDatabaseBaseline('hotel', 2.0); // 100 rooms (2x scale)

      expect(result.powerMW).toBe(5.9); // 2930 * 2 / 1000, rounded
      expect(result.description).toContain('100 rooms');
    });

    it('should use fallback for missing database configuration', async () => {
      vi.mocked(useCaseService.getUseCaseBySlug).mockRejectedValue(new Error('Not found'));

      const result = await calculateDatabaseBaseline('hotel', 1.0);

      expect(result.powerMW).toBeGreaterThan(0);
      expect(result.dataSource).toBe('fallback');
      expect(result.description).toContain('fallback');
    });

    it('should handle array template format', async () => {
      const mockUseCase = {
        id: '1',
        name: 'Hotel/Resort',
        slug: 'hotel',
        configurations: [{
          id: '1',
          typical_load_kw: 2930,
          peak_load_kw: 3500,
          preferred_duration_hours: 4,
          is_default: true
        }]
      };

      vi.mocked(useCaseService.getUseCaseBySlug).mockResolvedValue(mockUseCase as any);

      const result = await calculateDatabaseBaseline(['hotel', 'resort'], 1.0);

      expect(result.powerMW).toBe(2.9);
      expect(useCaseService.getUseCaseBySlug).toHaveBeenCalledWith('hotel');
    });
  });

  describe('calculateEVChargingBaseline', () => {
    it('should calculate EV charging with L2 chargers only', async () => {
      const useCaseData = {
        level2Chargers: '100',
        level2Power: '11',
        dcFastChargers: '0',
        dcFastPower: '150'
      };

      const result = await calculateDatabaseBaseline('ev-charging', 1.0, useCaseData);

      // 100 * 11kW = 1.1 MW total
      // With concurrency factor: ~0.7-0.9 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(0.7);
      expect(result.powerMW).toBeLessThanOrEqual(1.1);
      expect(result.durationHrs).toBe(2); // EV charging uses 2 hours
      expect(result.dataSource).toBe('calculated');
    });

    it('should calculate EV charging with mixed chargers', async () => {
      const useCaseData = {
        level2Chargers: '100',
        level2Power: '11',
        dcFastChargers: '20',
        dcFastPower: '150'
      };

      const result = await calculateDatabaseBaseline('ev-charging', 1.0, useCaseData);

      // L2: 100 * 11kW = 1.1 MW
      // DC Fast: 20 * 150kW = 3.0 MW
      // Total: 4.1 MW, with concurrency: ~1.7-2.0 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(1.5);
      expect(result.powerMW).toBeLessThanOrEqual(3.5);
      expect(result.durationHrs).toBe(2);
      expect(result.description).toContain('120 chargers');
    });

    it('should handle DC Fast chargers only', async () => {
      const useCaseData = {
        level2Chargers: '0',
        level2Power: '11',
        dcFastChargers: '50',
        dcFastPower: '150'
      };

      const result = await calculateDatabaseBaseline('ev-charging', 1.0, useCaseData);

      // 50 * 150kW = 7.5 MW total
      // With concurrency: ~5-6 MW
      expect(result.powerMW).toBeGreaterThanOrEqual(4.0);
      expect(result.powerMW).toBeLessThanOrEqual(7.5);
    });

    it('should respect minimum 0.5 MW floor', async () => {
      const useCaseData = {
        level2Chargers: '5',
        level2Power: '11',
        dcFastChargers: '0',
        dcFastPower: '150'
      };

      const result = await calculateDatabaseBaseline('ev-charging', 1.0, useCaseData);

      expect(result.powerMW).toBeGreaterThanOrEqual(0.5); // Minimum floor
    });

    it('should apply concurrency factor correctly', async () => {
      const useCaseData = {
        level2Chargers: '200',
        level2Power: '11',
        dcFastChargers: '0',
        dcFastPower: '150'
      };

      const result = await calculateDatabaseBaseline('ev-charging', 1.0, useCaseData);

      // 200 * 11kW = 2.2 MW total capacity
      // Concurrency should reduce this (70% factor)
      expect(result.powerMW).toBeLessThan(2.2); // Should be less than max
      expect(result.powerMW).toBeGreaterThanOrEqual(1.0); // But still reasonable
    });
  });

  describe('fallback mechanisms', () => {
    it('should provide hotel fallback', async () => {
      vi.mocked(useCaseService.getUseCaseBySlug).mockRejectedValue(new Error('DB error'));

      const result = await calculateDatabaseBaseline('hotel', 1.0);

      expect(result.powerMW).toBe(2.93); // Hotel fallback
      expect(result.durationHrs).toBe(4);
      expect(result.dataSource).toBe('fallback');
    });

    it('should provide data center fallback', async () => {
      vi.mocked(useCaseService.getUseCaseBySlug).mockRejectedValue(new Error('DB error'));

      const result = await calculateDatabaseBaseline('data-center', 1.0);

      expect(result.powerMW).toBe(5.0); // Data center fallback
      expect(result.durationHrs).toBe(4);
      expect(result.dataSource).toBe('fallback');
    });

    it('should provide generic fallback for unknown use case', async () => {
      vi.mocked(useCaseService.getUseCaseBySlug).mockRejectedValue(new Error('DB error'));

      const result = await calculateDatabaseBaseline('unknown-industry', 1.0);

      expect(result.powerMW).toBe(2.0); // Generic fallback
      expect(result.durationHrs).toBe(4);
      expect(result.dataSource).toBe('fallback');
    });
  });

  describe('edge cases', () => {
    it('should handle zero scale factor', async () => {
      const mockUseCase = {
        id: '1',
        name: 'Hotel/Resort',
        slug: 'hotel',
        configurations: [{
          id: '1',
          typical_load_kw: 2930,
          preferred_duration_hours: 4,
          is_default: true
        }]
      };

      vi.mocked(useCaseService.getUseCaseBySlug).mockResolvedValue(mockUseCase as any);

      const result = await calculateDatabaseBaseline('hotel', 0);

      expect(result.powerMW).toBe(0.5); // Minimum floor applied
    });

    it('should handle very large scale factor', async () => {
      const mockUseCase = {
        id: '1',
        name: 'Hotel/Resort',
        slug: 'hotel',
        configurations: [{
          id: '1',
          typical_load_kw: 2930,
          preferred_duration_hours: 4,
          is_default: true
        }]
      };

      vi.mocked(useCaseService.getUseCaseBySlug).mockResolvedValue(mockUseCase as any);

      const result = await calculateDatabaseBaseline('hotel', 100); // 5000 rooms

      expect(result.powerMW).toBeGreaterThan(100); // Should scale up
      expect(result.powerMW).toBeLessThan(500); // But within reason
    });

    it('should handle missing useCaseData for EV charging', async () => {
      const result = await calculateDatabaseBaseline('ev-charging', 1.0);

      // Should fall back to database or generic fallback
      expect(result.powerMW).toBeGreaterThan(0);
      expect(result.dataSource).toMatch(/database|fallback/);
    });
  });
});
