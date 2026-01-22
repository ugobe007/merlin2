/**
 * =============================================================================
 * CAR WASH 16Q CALCULATOR TEST SUITE
 * =============================================================================
 * 
 * Tests the 11-step calculation pipeline with realistic scenarios
 * Validates equipment load reconstruction, motor surge, service constraints
 */

import { calculateCarWash16Q, type CarWash16QInput } from '../carWash16QCalculator';

describe('Car Wash 16Q Calculator', () => {
  
  // =============================================================================
  // TEST SCENARIO 1: Small Self-Serve (1 Bay, Minimal Equipment)
  // =============================================================================
  describe('Small Self-Serve Car Wash', () => {
    const input: CarWash16QInput = {
      carWashType: 'self_serve',
      bayTunnelCount: '1',
      electricalServiceSize: '200',
      voltageLevel: '120_208',
      primaryEquipment: ['high_pressure_pumps', 'lighting', 'pos_controls'],
      largestMotorSize: '10-25',
      simultaneousEquipment: '1-2',
      averageWashesPerDay: '20-50',
      peakHourThroughput: '5-10',
      washCycleDuration: '3-5',
      operatingHours: '8-12',
      monthlyElectricitySpend: '1000-3000',
      utilityRateStructure: 'flat',
      powerQualityIssues: ['none'],
      outageSensitivity: 'operations_stop',
      expansionPlans: ['none'],
    };
    
    it('should calculate correct peak demand for minimal equipment', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: 15 + 5 + 2 = 22 kW equipment + ~16 kW motor surge = ~38 kW peak
      expect(result.peakDemandKW).toBeGreaterThan(30);
      expect(result.peakDemandKW).toBeLessThan(50);
    });
    
    it('should recommend modest BESS sizing (60% of peak)', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: ~23 kW BESS (60% of ~38 kW peak)
      expect(result.bessRecommendedKW).toBeGreaterThan(20);
      expect(result.bessRecommendedKW).toBeLessThan(30);
      
      // Expected: 2-hour duration
      expect(result.bessDurationHours).toBeCloseTo(2, 0);
    });
    
    it('should show low service utilization', () => {
      const result = calculateCarWash16Q(input);
      
      // 200A service = ~69 kW capacity
      // Peak ~38 kW = ~55% utilization
      expect(result.serviceUtilization).toBeLessThan(0.70);
      expect(result.serviceLimitReached).toBe(false);
    });
    
    it('should report "estimate" confidence with minimal inputs', () => {
      const result = calculateCarWash16Q(input);
      
      expect(result.confidence).toBe('estimate');
      expect(result.uncertaintyCount).toBeGreaterThan(0);
    });
  });
  
  // =============================================================================
  // TEST SCENARIO 2: Medium Automatic (3 Bays, Standard Equipment)
  // =============================================================================
  describe('Medium Automatic Car Wash', () => {
    const input: CarWash16QInput = {
      carWashType: 'automatic_inbay',
      bayTunnelCount: '2-3',
      electricalServiceSize: '400',
      voltageLevel: '277_480',
      primaryEquipment: [
        'high_pressure_pumps',
        'blowers_dryers',
        'water_reclaim',
        'lighting',
        'hvac',
        'pos_controls',
      ],
      largestMotorSize: '25-50',
      simultaneousEquipment: '3-4',
      averageWashesPerDay: '75-150',
      peakHourThroughput: '10-25',
      washCycleDuration: '3-5',
      operatingHours: '12-16',
      monthlyElectricitySpend: '3000-7500',
      utilityRateStructure: 'demand',
      powerQualityIssues: ['voltage_sag'],
      outageSensitivity: 'immediate_recovery',
      expansionPlans: ['bay_tunnel_expansion'],
    };
    
    it('should calculate correct peak demand for standard equipment', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: 15+30+25+5+20+2 = 97 kW equipment × 0.65 = 63 kW
      // Plus motor surge ~52 kW = ~115 kW peak
      expect(result.peakDemandKW).toBeGreaterThan(100);
      expect(result.peakDemandKW).toBeLessThan(150);
    });
    
    it('should recommend BESS with backup runtime', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: ~69 kW BESS (60% of ~115 kW peak)
      expect(result.bessRecommendedKW).toBeGreaterThan(60);
      expect(result.bessRecommendedKW).toBeLessThan(80);
      
      // Expected: 1-hour backup runtime
      expect(result.backupRuntimeHours).toBeCloseTo(1, 0);
    });
    
    it('should calculate demand charge savings', () => {
      const result = calculateCarWash16Q(input);
      
      // With demand charge structure, savings should be significant
      expect(result.demandChargeSavings).toBeGreaterThan(0);
      expect(result.totalAnnualSavings).toBeGreaterThan(10000);
    });
    
    it('should identify expansion headroom needs', () => {
      const result = calculateCarWash16Q(input);
      
      // With bay/tunnel expansion planned
      expect(result.expansionHeadroomKW).toBeGreaterThan(0);
      expect(result.futureLoadKW).toBeGreaterThan(result.peakDemandKW);
    });
  });
  
  // =============================================================================
  // TEST SCENARIO 3: Large Tunnel (Conveyor, Full Equipment Suite)
  // =============================================================================
  describe('Large Tunnel Car Wash', () => {
    const input: CarWash16QInput = {
      carWashType: 'tunnel_conveyor',
      bayTunnelCount: '1',
      electricalServiceSize: '800+',
      voltageLevel: '480',
      primaryEquipment: [
        'conveyor_motor',
        'high_pressure_pumps',
        'blowers_dryers',
        'water_reclaim',
        'water_heating',
        'chemical_systems',
        'lighting',
        'hvac',
        'pos_controls',
      ],
      largestMotorSize: '100+',
      simultaneousEquipment: '5+',
      averageWashesPerDay: '200+',
      peakHourThroughput: '50+',
      washCycleDuration: '<3',
      operatingHours: '16+',
      monthlyElectricitySpend: '15000+',
      utilityRateStructure: 'tou',
      powerQualityIssues: ['voltage_sag', 'harmonics'],
      outageSensitivity: 'critical_operations',
      expansionPlans: ['equipment_upgrades', 'additional_services'],
    };
    
    it('should calculate high peak demand for full equipment', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: 40+15+30+25+30+15+5+20+2 = 182 kW equipment × 1.0 = 182 kW
      // Plus motor surge ~150 kW = ~332 kW peak
      expect(result.peakDemandKW).toBeGreaterThan(300);
    });
    
    it('should recommend large BESS for peak shaving', () => {
      const result = calculateCarWash16Q(input);
      
      // Expected: ~200 kW BESS (60% of ~332 kW peak)
      expect(result.bessRecommendedKW).toBeGreaterThan(180);
      expect(result.bessRecommendedKW).toBeLessThan(220);
      
      // Expected: 4-hour duration for critical operations
      expect(result.bessDurationHours).toBeCloseTo(4, 0);
    });
    
    it('should show high service utilization', () => {
      const result = calculateCarWash16Q(input);
      
      // 800A service = ~555 kW capacity
      // Peak ~332 kW = ~60% utilization
      expect(result.serviceUtilization).toBeGreaterThan(0.50);
      expect(result.serviceUtilization).toBeLessThan(0.70);
    });
    
    it('should calculate substantial annual savings with TOU rates', () => {
      const result = calculateCarWash16Q(input);
      
      // TOU rates should show 1.2x multiplier
      expect(result.savingsMultiplier).toBeCloseTo(1.2, 1);
      expect(result.totalAnnualSavings).toBeGreaterThan(50000);
    });
    
    it('should identify medium power quality risk', () => {
      const result = calculateCarWash16Q(input);
      
      // With voltage sag + harmonics
      expect(result.powerQualityRisk).toBe('medium');
    });
  });
  
  // =============================================================================
  // TEST SCENARIO 4: Service Capacity Exceeded
  // =============================================================================
  describe('Service Capacity Edge Case', () => {
    const input: CarWash16QInput = {
      carWashType: 'tunnel_conveyor',
      bayTunnelCount: '1',
      electricalServiceSize: '200', // TOO SMALL for tunnel!
      voltageLevel: '277_480',
      primaryEquipment: [
        'conveyor_motor',
        'high_pressure_pumps',
        'blowers_dryers',
        'water_reclaim',
        'water_heating',
        'chemical_systems',
        'lighting',
        'hvac',
        'pos_controls',
      ],
      largestMotorSize: '100+',
      simultaneousEquipment: '5+',
      averageWashesPerDay: '200+',
      peakHourThroughput: '50+',
      washCycleDuration: '<3',
      operatingHours: '16+',
      monthlyElectricitySpend: '15000+',
      utilityRateStructure: 'demand',
      powerQualityIssues: ['voltage_sag'],
      outageSensitivity: 'critical_operations',
      expansionPlans: ['none'],
    };
    
    it('should constrain peak to 95% of service capacity', () => {
      const result = calculateCarWash16Q(input);
      
      // 200A service = ~69 kW capacity
      // Peak should be capped at ~66 kW (95% of capacity)
      expect(result.peakDemandKW).toBeLessThanOrEqual(69);
      expect(result.serviceLimitReached).toBe(true);
    });
    
    it('should flag service capacity warning', () => {
      const result = calculateCarWash16Q(input);
      
      // Service utilization should be at/near 95%
      expect(result.serviceUtilization).toBeGreaterThan(0.90);
      expect(result.serviceLimitReached).toBe(true);
    });
  });
  
  // =============================================================================
  // TEST SCENARIO 5: Confidence Tracking
  // =============================================================================
  describe('Confidence Assessment', () => {
    it('should report "estimate" with multiple "not_sure" answers', () => {
      const input: CarWash16QInput = {
        carWashType: 'not_sure',
        bayTunnelCount: '1',
        electricalServiceSize: 'not_sure',
        voltageLevel: '277_480',
        primaryEquipment: ['high_pressure_pumps', 'not_sure'],
        largestMotorSize: 'not_sure',
        simultaneousEquipment: 'not_sure',
        averageWashesPerDay: '75-150',
        peakHourThroughput: '10-25',
        washCycleDuration: '3-5',
        operatingHours: '8-12',
        monthlyElectricitySpend: 'not_sure',
        utilityRateStructure: 'not_sure',
        powerQualityIssues: ['none'],
        outageSensitivity: 'operations_stop',
        expansionPlans: ['none'],
      };
      
      const result = calculateCarWash16Q(input);
      
      expect(result.confidence).toBe('estimate');
      expect(result.uncertaintyCount).toBeGreaterThan(3);
    });
    
    it('should report "verified" with all specific answers', () => {
      const input: CarWash16QInput = {
        carWashType: 'automatic_inbay',
        bayTunnelCount: '2-3',
        electricalServiceSize: '400',
        voltageLevel: '277_480',
        primaryEquipment: ['high_pressure_pumps', 'blowers_dryers', 'lighting'],
        largestMotorSize: '25-50',
        simultaneousEquipment: '3-4',
        averageWashesPerDay: '75-150',
        peakHourThroughput: '10-25',
        washCycleDuration: '3-5',
        operatingHours: '12-16',
        monthlyElectricitySpend: '3000-7500',
        utilityRateStructure: 'demand',
        powerQualityIssues: ['none'],
        outageSensitivity: 'immediate_recovery',
        expansionPlans: ['none'],
      };
      
      const result = calculateCarWash16Q(input);
      
      expect(result.confidence).toBe('verified');
      expect(result.uncertaintyCount).toBe(0);
    });
  });
  
  // =============================================================================
  // TEST SCENARIO 6: TrueQuote™ Source Attribution
  // =============================================================================
  describe('TrueQuote™ Source Attribution', () => {
    const input: CarWash16QInput = {
      carWashType: 'automatic_inbay',
      bayTunnelCount: '1',
      electricalServiceSize: '400',
      voltageLevel: '277_480',
      primaryEquipment: ['high_pressure_pumps', 'blowers_dryers', 'lighting'],
      largestMotorSize: '25-50',
      simultaneousEquipment: '3-4',
      averageWashesPerDay: '75-150',
      peakHourThroughput: '10-25',
      washCycleDuration: '3-5',
      operatingHours: '12-16',
      monthlyElectricitySpend: '3000-7500',
      utilityRateStructure: 'demand',
      powerQualityIssues: ['none'],
      outageSensitivity: 'operations_stop',
      expansionPlans: ['none'],
    };
    
    it('should include authoritative sources', () => {
      const result = calculateCarWash16Q(input);
      
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      
      // Check for key sources
      const sourceNames = result.sources.map(s => s.source);
      expect(sourceNames).toContain('ICA 2024 Industry Study');
      expect(sourceNames).toContain('NREL ATB 2024');
      expect(sourceNames).toContain('IEEE 446-1995 (Orange Book)');
    });
    
    it('should provide citations for all calculations', () => {
      const result = calculateCarWash16Q(input);
      
      result.sources.forEach(source => {
        expect(source.source).toBeDefined();
        expect(source.value).toBeDefined();
        expect(source.citation).toBeDefined();
      });
    });
  });
});
