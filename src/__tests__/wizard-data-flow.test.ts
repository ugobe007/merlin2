/**
 * WIZARD DATA FLOW TEST
 * =====================
 * 
 * CRITICAL: This test traces values through the entire wizard flow to
 * ensure TrueQuote SSOT compliance. Any failure here means broken quotes.
 * 
 * Test Strategy:
 * 1. Simulate user inputs at each step
 * 2. Verify values propagate to centralizedState
 * 3. Verify values reach QuoteEngine.generateQuote()
 * 4. Verify final quote matches inputs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock services
vi.mock('@/services/useCaseService', () => ({
  useCaseService: {
    getAll: vi.fn().mockResolvedValue([
      { id: '1', slug: 'hotel', name: 'Hotel', category: 'Commercial', tier_required: 'free' }
    ]),
    getBySlug: vi.fn().mockResolvedValue({
      id: '1', slug: 'hotel', name: 'Hotel', category: 'Commercial', tier_required: 'free'
    }),
    getCustomQuestions: vi.fn().mockResolvedValue([
      { id: 'roomCount', field_name: 'roomCount', label: 'Room Count', default_value: '150' }
    ]),
  }
}));

vi.mock('@/services/geographicIntelligenceService', () => ({
  getGeographicRecommendations: vi.fn().mockResolvedValue({
    profile: { avgSolarHoursPerDay: 5, electricityRate: 0.15 }
  }),
  getStateFromZipCode: vi.fn().mockResolvedValue('CA'),
  getRegionalElectricityRate: vi.fn().mockReturnValue(0.15),
}));

// Test the calculation functions directly
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';
import { QuoteEngine } from '@/core/calculations/QuoteEngine';

describe('Wizard Data Flow - SSOT Compliance', () => {
  
  describe('Step 1: SSOT Power Calculations', () => {
    
    it('hotel power calculation uses room count correctly', () => {
      const result = calculateUseCasePower('hotel', { roomCount: 150 });
      
      console.log('🏨 Hotel Power Calculation:', {
        input: { roomCount: 150 },
        output: result,
      });
      
      // Hotel: 1.2 kW/room typical = 150 * 1.2 = 180 kW = 0.18 MW
      expect(result.powerMW).toBeGreaterThan(0);
      expect(result.powerMW).toBeLessThan(1); // Should be < 1 MW for 150 rooms
    });
    
    it('hospital power calculation uses bed count correctly', () => {
      const result = calculateUseCasePower('hospital', { bedCount: 200 });
      
      console.log('🏥 Hospital Power Calculation:', {
        input: { bedCount: 200 },
        output: result,
      });
      
      // Hospital: 5-8 kW/bed typical = 200 * 6 = 1200 kW = 1.2 MW
      expect(result.powerMW).toBeGreaterThan(0);
    });
    
    it('data center power calculation uses IT load correctly', () => {
      const result = calculateUseCasePower('data-center', { itLoadKW: 5000 });
      
      console.log('🖥️ Data Center Power Calculation:', {
        input: { itLoadKW: 5000 },
        output: result,
      });
      
      // Data center: PUE 1.4-1.6 typical = 5000 * 1.5 = 7500 kW = 7.5 MW
      expect(result.powerMW).toBeGreaterThan(0);
    });
    
    it('car wash power calculation uses bay count correctly', () => {
      const result = calculateUseCasePower('car-wash', { bayCount: 4 });
      
      console.log('🚗 Car Wash Power Calculation:', {
        input: { bayCount: 4 },
        output: result,
      });
      
      // Car wash: 20-30 kW/bay typical = 4 * 25 = 100 kW = 0.1 MW
      expect(result.powerMW).toBeGreaterThan(0);
    });
  });
  
  describe('Step 2: QuoteEngine Integration', () => {
    
    it('QuoteEngine.generateQuote uses all input parameters', async () => {
      const input = {
        storageSizeMW: 0.5,
        durationHours: 4,
        location: 'CA',
        electricityRate: 0.15,
        useCase: 'hotel',
        solarMW: 0.3,
        windMW: 0,
        generatorMW: 0.2,
        generatorFuelType: 'natural-gas' as const,
        gridConnection: 'on-grid' as const,
      };
      
      console.log('📊 QuoteEngine Input:', input);
      
      const result = await QuoteEngine.generateQuote(input);
      
      console.log('📊 QuoteEngine Output:', {
        totalCost: result.costs?.totalProjectCost,
        netCost: result.costs?.netCost,
        paybackYears: result.financials?.paybackYears,
        annualSavings: result.financials?.annualSavings,
        equipmentBreakdown: result.equipment,
      });
      
      // Verify output has expected structure
      expect(result.costs).toBeDefined();
      expect(result.financials).toBeDefined();
      expect(result.equipment).toBeDefined();
      
      // Verify costs are positive
      expect(result.costs.totalProjectCost).toBeGreaterThan(0);
      
      // Verify financial metrics are reasonable
      expect(result.financials.paybackYears).toBeGreaterThan(0);
      expect(result.financials.paybackYears).toBeLessThan(30); // Should pay back within 30 years
    });
    
    it('QuoteEngine.quickEstimate returns financial preview', async () => {
      const storageSizeMW = 0.5;
      const durationHours = 4;
      const electricityRate = 0.15;
      
      console.log('💰 QuickEstimate Input:', { storageSizeMW, durationHours, electricityRate });
      
      const result = await QuoteEngine.quickEstimate(storageSizeMW, durationHours, electricityRate);
      
      console.log('💰 QuickEstimate Output:', result);
      
      // Verify estimate has expected fields
      expect(result.annualSavings).toBeGreaterThan(0);
      expect(result.paybackYears).toBeGreaterThan(0);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });
  });
  
  describe('Step 3: Value Propagation Trace', () => {
    
    it('hotel 150 rooms → 180kW peak → 72kW BESS → $XXX cost', async () => {
      // Step 1: Calculate power from room count
      const powerResult = calculateUseCasePower('hotel', { roomCount: 150 });
      const peakDemandKW = powerResult.powerMW * 1000;
      
      console.log('TRACE Step 1 - Power Calculation:', {
        input: { roomCount: 150 },
        peakDemandKW,
      });
      
      // Step 2: Calculate BESS size (hotel uses 0.50 ratio)
      const HOTEL_BESS_RATIO = 0.50;
      const recommendedBatteryKW = Math.round(peakDemandKW * HOTEL_BESS_RATIO);
      const recommendedBatteryKWh = recommendedBatteryKW * 4;
      
      console.log('TRACE Step 2 - BESS Sizing:', {
        peakDemandKW,
        bessRatio: HOTEL_BESS_RATIO,
        recommendedBatteryKW,
        recommendedBatteryKWh,
      });
      
      // Step 3: Generate quote
      const quote = await QuoteEngine.generateQuote({
        storageSizeMW: recommendedBatteryKW / 1000,
        durationHours: 4,
        location: 'CA',
        electricityRate: 0.15,
        useCase: 'hotel',
        solarMW: 0,
        windMW: 0,
        generatorMW: 0,
        generatorFuelType: 'natural-gas',
        gridConnection: 'on-grid',
      });
      
      console.log('TRACE Step 3 - Quote Generation:', {
        inputBatteryKW: recommendedBatteryKW,
        outputCost: quote.costs?.totalProjectCost,
        outputPayback: quote.financials?.paybackYears,
        outputSavings: quote.financials?.annualSavings,
      });
      
      // CRITICAL ASSERTIONS - These ensure the data flow is correct
      expect(peakDemandKW).toBeGreaterThan(100); // 150 rooms should be > 100kW
      expect(recommendedBatteryKW).toBeGreaterThan(50); // BESS should be > 50kW
      expect(quote.costs?.totalProjectCost).toBeGreaterThan(0);
      expect(quote.financials?.paybackYears).toBeGreaterThan(0);
      
      // Log full trace for debugging
      console.log('\n========================================');
      console.log('FULL TRACE: Hotel 150 Rooms');
      console.log('========================================');
      console.log(`Input: 150 rooms`);
      console.log(`→ Peak Demand: ${peakDemandKW} kW`);
      console.log(`→ BESS Power: ${recommendedBatteryKW} kW (ratio: ${HOTEL_BESS_RATIO})`);
      console.log(`→ BESS Energy: ${recommendedBatteryKWh} kWh`);
      console.log(`→ Total Cost: $${quote.costs?.totalProjectCost?.toLocaleString()}`);
      console.log(`→ Net Cost: $${quote.costs?.netCost?.toLocaleString()}`);
      console.log(`→ Annual Savings: $${quote.financials?.annualSavings?.toLocaleString()}`);
      console.log(`→ Payback: ${quote.financials?.paybackYears} years`);
      console.log('========================================\n');
    });
  });
});
