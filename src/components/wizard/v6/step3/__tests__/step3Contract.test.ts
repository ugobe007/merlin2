/**
 * STEP 3 CONTRACT UNIT TESTS
 * Created: Jan 24, 2026
 * 
 * These tests lock in the "cannot lie" invariants so Step 3 never regresses.
 * If these pass, you can ship changes fearlessly.
 */

import { describe, it, expect } from 'vitest';
import { 
  toNum, 
  clamp, 
  normalizeIndustry, 
  getMinimumPeakKW, 
  estimatePeakDemandKW 
} from '../buildStep3Snapshot';
import { validateStep3Contract } from '../validateStep3Contract';
import type { WizardState } from '../../types';

describe('toNum() - Defensive Number Parsing', () => {
  
  it('should parse dollar amounts', () => {
    expect(toNum("$4,200")).toBe(4200);
    expect(toNum("$1,234.56")).toBe(1234.56);
    expect(toNum("$ 100")).toBe(100);
  });
  
  it('should strip units from strings', () => {
    expect(toNum("16 hrs")).toBe(16);
    expect(toNum("50 kW")).toBe(50);
    expect(toNum("1200 sqft")).toBe(1200);
  });
  
  it('should handle garbage inputs', () => {
    expect(toNum("abc")).toBe(0);
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
    expect(toNum("")).toBe(0);
  });
  
  it('should pass through valid numbers', () => {
    expect(toNum(42)).toBe(42);
    expect(toNum(123.45)).toBe(123.45);
  });
  
  it('should return 0 for NaN', () => {
    expect(toNum(NaN)).toBe(0);
    expect(toNum(Infinity)).toBe(0);
  });
});

describe('clamp() - Safe Value Clamping', () => {
  
  it('should clamp value too low', () => {
    expect(clamp(0.02, 0.04, 0.60)).toBe(0.04);
  });
  
  it('should pass through value in range', () => {
    expect(clamp(0.12, 0.04, 0.60)).toBe(0.12);
  });
  
  it('should clamp value too high', () => {
    expect(clamp(0.75, 0.04, 0.60)).toBe(0.60);
  });
  
  it('should handle NaN by returning min', () => {
    expect(clamp(NaN, 0.04, 0.60)).toBe(0.04);
    expect(clamp(Infinity, 0.04, 0.60)).toBe(0.04);
    expect(clamp(-Infinity, 0.04, 0.60)).toBe(0.04);
  });
});

describe('normalizeIndustry() - Industry Type Normalization', () => {
  
  it('should normalize car wash variations', () => {
    expect(normalizeIndustry("Car Wash")).toBe("car_wash");
    expect(normalizeIndustry("carwash")).toBe("car_wash");
    expect(normalizeIndustry("car-wash")).toBe("car_wash");
    expect(normalizeIndustry("car_wash")).toBe("car_wash");
  });
  
  it('should normalize data center variations', () => {
    expect(normalizeIndustry("Data Center")).toBe("data_center");
    expect(normalizeIndustry("datacenter")).toBe("data_center");
    expect(normalizeIndustry("data-center")).toBe("data_center");
  });
  
  it('should normalize EV charging variations', () => {
    expect(normalizeIndustry("EV Charging")).toBe("ev_charging");
    expect(normalizeIndustry("evcharging")).toBe("ev_charging");
    expect(normalizeIndustry("ev-charging")).toBe("ev_charging");
  });
  
  it('should normalize truck stop variations', () => {
    expect(normalizeIndustry("Truck Stop")).toBe("truck_stop");
    expect(normalizeIndustry("truckstop")).toBe("truck_stop");
  });
  
  it('should handle unknown industries', () => {
    expect(normalizeIndustry("Unknown Industry")).toBe("unknown_industry");
    expect(normalizeIndustry("")).toBe("");
  });
});

describe('getMinimumPeakKW() - Smart Tier/Industry Minimums', () => {
  
  it('should use industry minimum over tier for high-power industries', () => {
    // Car wash always 50 kW minimum (even if tier is small)
    expect(getMinimumPeakKW("car_wash", "small")).toBe(50);
    expect(getMinimumPeakKW("car_wash", "medium")).toBe(50);
    
    // Data center always 50 kW minimum
    expect(getMinimumPeakKW("data_center", "small")).toBe(50);
    
    // Hospital always 100 kW minimum
    expect(getMinimumPeakKW("hospital", "small")).toBe(100);
  });
  
  it('should use tier minimum for unknown/generic industries', () => {
    expect(getMinimumPeakKW("office", "small")).toBe(10);
    expect(getMinimumPeakKW("office", "medium")).toBe(25);
    expect(getMinimumPeakKW("office", "large")).toBe(100);
    expect(getMinimumPeakKW("unknown", "small")).toBe(10);
  });
  
  it('should default to 25 kW for unknown industry + unknown tier', () => {
    expect(getMinimumPeakKW("unknown", undefined)).toBe(25);
    expect(getMinimumPeakKW("", "")).toBe(25);
  });
});

describe('estimatePeakDemandKW() - Peak Estimation Logic', () => {
  
  it('should use direct peak input when valid', () => {
    const result = estimatePeakDemandKW("hotel", { peakDemandKW: 250 }, "medium");
    expect(result).toBe(250);
  });
  
  it('should calculate bill-based estimate with clamped parameters', () => {
    const result = estimatePeakDemandKW("office", {
      monthlyElectricBill: 3000,
      electricityRate: "abc" // Should clamp to 0.12
    }, "medium");
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(25); // Medium tier minimum
  });
  
  it('should estimate car wash self-serve correctly', () => {
    const result = estimatePeakDemandKW("car_wash", {
      bayCount: 4,
      carWashType: "self_serve"
    }, "medium");
    // 4 × 12 kW/bay = 48 kW, but car wash industry minimum is 50 kW
    expect(result).toBe(50); // Industry minimum wins
  });
  
  it('should estimate car wash express tunnel correctly', () => {
    const result = estimatePeakDemandKW("car_wash", {
      bayCount: 4,
      carWashType: "express_tunnel"
    }, "medium");
    expect(result).toBeCloseTo(270, 1); // 150 base + 4×30
  });
  
  it('should estimate hotel by room count', () => {
    const result = estimatePeakDemandKW("hotel", {
      roomCount: 100
    }, "medium");
    expect(result).toBeCloseTo(250, 1); // 100 × 2.5 kW/room
  });
  
  it('should use tier fallback when no inputs', () => {
    const small = estimatePeakDemandKW("unknown", {}, "small");
    expect(small).toBe(100); // Small tier default
    
    const medium = estimatePeakDemandKW("unknown", {}, "medium");
    expect(medium).toBe(500); // Medium tier default
  });
  
  it('should never return 0, NaN, or Infinity', () => {
    // Test with completely empty inputs
    const result = estimatePeakDemandKW("unknown", {}, undefined);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).not.toBeNaN();
  });
  
  it('should respect industry minimum for small tier', () => {
    // Car wash small tier should be 50 kW (industry minimum), not 10 kW (tier minimum)
    const result = estimatePeakDemandKW("car_wash", {
      bayCount: 1,
      carWashType: "self_serve"
    }, "small");
    expect(result).toBeGreaterThanOrEqual(50); // Industry minimum wins
  });
});

describe('validateStep3Contract() - Contract Validation', () => {
  
  it('should require bayCount for car wash', () => {
    const result = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "car_wash",
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          operatingHours: 16
          // Missing bayCount
        }
      }
    } as WizardState);
    expect(result.ok).toBe(false);
    expect(result.missingRequired).toContain("facility.bayCount");
  });
  
  it('should accept detectedIndustry when industry is empty', () => {
    const result = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "", // Empty
      detectedIndustry: "car_wash", // Auto-detected
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          bayCount: 4,
          operatingHours: 16,
          monthlyElectricBill: 2000
        }
      }
    } as WizardState);
    expect(result.ok).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });
  
  it('should validate complete hotel state', () => {
    const result = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "hotel",
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          roomCount: 50,
          operatingHours: 24,
          monthlyElectricBill: 3000
        }
      }
    } as WizardState);
    expect(result.ok).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
    expect(result.completenessPct).toBe(100);
    expect(result.hasLoadAnchor).toBe(true);
  });
  
  it('should block when load anchor missing', () => {
    const result = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "unknown",
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          operatingHours: 10
          // No peak, no bill, no sqft, no industry anchor
        }
      }
    } as WizardState);
    expect(result.ok).toBe(false);
    expect(result.hasLoadAnchor).toBe(false);
    expect(result.missingRequired).toContain("calculated.loadAnchor");
  });
  
  it('should keep completeness stable when adding optional fields', () => {
    // Base state with only required fields
    const baseResult = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "hotel",
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          roomCount: 50,
          operatingHours: 24,
          monthlyElectricBill: 2000 // Satisfies load anchor
        }
      }
    } as WizardState);
    
    // Add optional field (HVAC type)
    const withOptional = validateStep3Contract({
      zipCode: "94102",
      state: "CA",
      industry: "hotel",
      goals: ["peak_shaving"],
      useCaseData: {
        inputs: {
          roomCount: 50,
          operatingHours: 24,
          monthlyElectricBill: 2000,
          hvacType: "central" // Optional confidence booster
        }
      }
    } as WizardState);
    
    // Completeness should be stable (100% both times)
    expect(baseResult.completenessPct).toBe(100);
    expect(withOptional.completenessPct).toBe(100);
    
    // But confidence should increase
    expect(withOptional.confidencePct).toBeGreaterThan(baseResult.confidencePct);
  });
});

/**
 * TO RUN THESE TESTS:
 * 
 * 1. Install Jest (if not already):
 *    npm install --save-dev jest @types/jest ts-jest
 * 
 * 2. Configure Jest in package.json or jest.config.js:
 *    {
 *      "preset": "ts-jest",
 *      "testEnvironment": "node"
 *    }
 * 
 * 3. Export the utility functions from buildStep3Snapshot.ts:
 *    export { toNum, clamp, normalizeIndustry, getMinimumPeakKW, estimatePeakDemandKW };
 * 
 * 4. Run tests:
 *    npm test step3Contract.test.ts
 */
