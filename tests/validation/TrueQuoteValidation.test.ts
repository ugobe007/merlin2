/**
 * TrueQuote Validation Test
 * 
 * @deprecated This test uses the legacy TrueQuoteEngine (v1).
 * For new tests, use TrueQuoteEngineV2 via the Porsche 911 architecture.
 * 
 * Tests the TrueQuote Engine against known-correct benchmarks
 */

import { describe, it, expect } from 'vitest';
// @deprecated - Using legacy TrueQuoteEngine for backward compatibility
import { calculateTrueQuote } from '@/services/_deprecated/TrueQuoteEngine';
import {
  BENCHMARKS,
  validateAgainstBenchmark
} from './TrueQuoteValidationSuite';

describe('TrueQuote Engine Validation', () => {
  
  describe('Data Center Benchmarks', () => {
    it('should pass Tier III Data Center (400 racks) benchmark', () => {
      const benchmark = BENCHMARKS['data-center-tier-3-400-racks'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {}
      });
      
      const validation = validateAgainstBenchmark('data-center-tier-3-400-racks', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        bessEnergyKWh: result.results.bess.energyKWh,
        generatorEnabled: result.results.generator !== undefined,
        generatorKW: result.results.generator?.capacityKW,
        totalInvestment: result.results.financial.totalInvestment,
        annualSavings: result.results.financial.annualSavings,
        paybackYears: result.results.financial.paybackYears
      });
      
      console.log('\n=== Tier III Data Center Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
    
    it('should pass Tier II Data Center (100 racks) benchmark', () => {
      const benchmark = BENCHMARKS['data-center-tier-2-100-racks'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {}
      });
      
      const validation = validateAgainstBenchmark('data-center-tier-2-100-racks', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        bessEnergyKWh: result.results.bess.energyKWh,
        generatorEnabled: result.results.generator !== undefined,
        generatorKW: result.results.generator?.capacityKW
      });
      
      console.log('\n=== Tier II Data Center Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
  });
  
  describe('Hospital Benchmarks', () => {
    it('should pass Regional Hospital (300 beds) benchmark', () => {
      const benchmark = BENCHMARKS['hospital-regional-300-beds'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {}
      });
      
      const validation = validateAgainstBenchmark('hospital-regional-300-beds', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        generatorEnabled: result.results.generator !== undefined,
        generatorKW: result.results.generator?.capacityKW
      });
      
      console.log('\n=== Regional Hospital Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
  });
  
  describe('Hotel Benchmarks', () => {
    it('should pass Upscale Hotel (200 rooms) benchmark', () => {
      const benchmark = BENCHMARKS['hotel-upscale-200-rooms'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {}
      });
      
      const validation = validateAgainstBenchmark('hotel-upscale-200-rooms', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        generatorEnabled: result.results.generator !== undefined
      });
      
      console.log('\n=== Upscale Hotel Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
  });
  
  describe('EV Charging Benchmarks', () => {
    it('should pass Medium EV Charging Hub benchmark', () => {
      const benchmark = BENCHMARKS['ev-charging-medium-hub'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {
          evChargingEnabled: true,
          level2Chargers: benchmark.inputs.facilityData.level2Chargers,
          dcFastChargers: benchmark.inputs.facilityData.dcFastChargers,
          ultraFastChargers: benchmark.inputs.facilityData.ultraFastChargers
        }
      });
      
      const validation = validateAgainstBenchmark('ev-charging-medium-hub', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        generatorEnabled: result.results.generator !== undefined
      });
      
      console.log('\n=== EV Charging Hub Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
  });
  
  describe('Car Wash Benchmarks', () => {
    it('should pass Express Car Wash (4 bays) benchmark', () => {
      const benchmark = BENCHMARKS['car-wash-express-4-bay'];
      const result = calculateTrueQuote({
        location: {
          zipCode: benchmark.inputs.zipCode,
          state: benchmark.inputs.state
        },
        industry: {
          type: benchmark.inputs.industry,
          subtype: benchmark.inputs.subtype,
          facilityData: benchmark.inputs.facilityData
        },
        options: {}
      });
      
      const validation = validateAgainstBenchmark('car-wash-express-4-bay', {
        peakDemandKW: result.results.peakDemandKW,
        bessPowerKW: result.results.bess.powerKW,
        generatorEnabled: result.results.generator !== undefined
      });
      
      console.log('\n=== Car Wash Validation ===');
      console.log(validation.summary);
      validation.checks.forEach(check => {
        const icon = check.severity === 'pass' ? '✓' : check.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${icon} ${check.message}`);
      });
      
      expect(validation.passed).toBe(true);
      expect(validation.score).toBeGreaterThanOrEqual(70);
    });
  });
  
});
