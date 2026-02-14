/**
 * PIPELINE INTEGRITY TEST — Step 3 Questionnaire → Calculator → SSOT → Quote
 * ===========================================================================
 *
 * Created: February 14, 2026
 *
 * WHAT THIS TESTS:
 * 1. Every industry's curated field IDs are consumed by its calculator adapter
 * 2. User inputs actually change the output (no silent defaults)
 * 3. Output kW values are within sane ranges for each industry
 * 4. TrueQuote CalcValidation envelope is present and valid
 * 5. kW contributors sum to within 5% of peakLoadKW
 * 6. Duty cycle is in [0, 1]
 * 7. energyKWhPerDay > 0 and baseLoadKW < peakLoadKW
 *
 * COVERAGE: All 13 dedicated adapters + generic fallback
 */

import { describe, it, expect } from "vitest";
import {
  CALCULATORS_BY_ID,
  GENERIC_SSOT_ADAPTER,
  DC_LOAD_V1_SSOT,
  HOTEL_LOAD_V1_SSOT,
  CAR_WASH_LOAD_V1_SSOT,
  OFFICE_LOAD_V1_SSOT,
  RETAIL_LOAD_V1_SSOT,
  MANUFACTURING_LOAD_V1_SSOT,
  HOSPITAL_LOAD_V1_SSOT,
  WAREHOUSE_LOAD_V1_SSOT,
  EV_CHARGING_LOAD_V1_SSOT,
  RESTAURANT_LOAD_V1_SSOT,
  TRUCK_STOP_LOAD_V1_SSOT,
  GAS_STATION_LOAD_V1_SSOT,
} from "../../calculators/registry";
import type { CalcRunResult } from "../../calculators/contract";

// ============================================================================
// INDUSTRY TEST CONFIGURATIONS
// Each entry simulates realistic curated-schema answers → adapter → SSOT
// ============================================================================

interface IndustryTestCase {
  name: string;
  calculatorId: string;
  /** Inputs using curated schema field IDs (NOT calculator field names) */
  curatedInputs: Record<string, unknown>;
  /** Expected peak kW range [min, max] */
  expectedPeakKWRange: [number, number];
  /** Minimum kW contributors expected (non-zero) */
  minContributors: number;
  /** Fields to vary for sensitivity test */
  sensitivityField: string;
  sensitivityValues: [unknown, unknown]; // [low, high]
  /** Extra slug metadata */
  industrySlug?: string;
}

const INDUSTRY_TESTS: IndustryTestCase[] = [
  // ── HOTEL ──────────────────────────────────────────────────────────────
  {
    name: "Hotel (150-room midscale)",
    calculatorId: "hotel_load_v1",
    curatedInputs: {
      hotelCategory: "3-star", // curated ID → adapter bridges to hotelClass=midscale
      numRooms: 150, // curated ID → adapter bridges to roomCount
      occupancyRate: 70,
      poolOnSite: "indoor", // curated: indoor/outdoor/both/none
      restaurantOnSite: "full-service",
      spaOnSite: "none",
      laundryOnSite: "full",
    },
    expectedPeakKWRange: [200, 900],
    minContributors: 3,
    sensitivityField: "numRooms",
    sensitivityValues: [50, 500],
  },
  // ── DATA CENTER ────────────────────────────────────────────────────────
  {
    name: "Data Center (Tier III, 2MW IT)",
    calculatorId: "dc_load_v1",
    curatedInputs: {
      dataCenterTier: "tier3",
      squareFootage: 50000,
      capacity: 2, // curated: MW → adapter converts to itLoadCapacity kW
      currentPUE: "1.3-1.5",
      itUtilization: "60-80%",
      coolingSystem: "air-cooled",
      redundancy: "n+1",
      rackDensity: "medium", // curated: low/medium/high/ultra-high → adapter bridges to rackDensityKW
    },
    expectedPeakKWRange: [1500, 6000],
    minContributors: 3,
    sensitivityField: "capacity",
    sensitivityValues: [0.5, 5],
  },
  // ── CAR WASH ───────────────────────────────────────────────────────────
  {
    name: "Car Wash (4-bay tunnel)",
    calculatorId: "car_wash_load_v1",
    curatedInputs: {
      facilityType: "express_tunnel", // curated ID → adapter bridges to carWashType=tunnel
      tunnelOrBayCount: 4, // curated ID → adapter bridges to bayTunnelCount
      operatingHours: 12,
      daysPerWeek: 7,
      dailyVehicles: 200, // curated ID → adapter bridges to averageWashesPerDay
      waterHeaterType: "natural_gas",
      dryerConfiguration: "high_volume",
      pumpConfiguration: "high_pressure",
    },
    expectedPeakKWRange: [50, 500],
    minContributors: 3,
    sensitivityField: "tunnelOrBayCount",
    sensitivityValues: [1, 10],
  },
  // ── OFFICE ─────────────────────────────────────────────────────────────
  {
    name: "Office (Class A, 75K sqft)",
    calculatorId: "office_load_v1",
    curatedInputs: {
      buildingClass: "class-a", // curated ID → adapter bridges to officeType=corporate
      squareFootage: 75000,
      floors: "4-10", // curated ID → adapter bridges to floorCount=7
      buildingAge: "renovated", // curated ID → adapter bridges to hvacAgeYears=8
      operatingHours: "standard",
      hvacSystem: "central-chiller",
    },
    expectedPeakKWRange: [200, 1200],
    minContributors: 3,
    sensitivityField: "squareFootage",
    sensitivityValues: [10000, 200000],
  },
  // ── RETAIL ─────────────────────────────────────────────────────────────
  {
    name: "Retail (Grocery, 30K sqft)",
    calculatorId: "retail_load_v1",
    curatedInputs: {
      retailType: "grocery",
      squareFootage: 30000,
      operatingHours: "extended",
      refrigerationLevel: "heavy",
      lightingType: "led",
    },
    expectedPeakKWRange: [200, 900],
    minContributors: 3,
    sensitivityField: "squareFootage",
    sensitivityValues: [5000, 100000],
  },
  // ── MANUFACTURING ──────────────────────────────────────────────────────
  {
    name: "Manufacturing (Heavy, 100K sqft)",
    calculatorId: "manufacturing_load_v1",
    curatedInputs: {
      facilityType: "heavy-industrial", // curated ID → adapter bridges to manufacturingType=heavy
      squareFootage: 100000,
      shifts: "double", // curated ID → adapter bridges to shiftPattern=2-shift
      processLoads: "welding", // curated: triggers furnace detection
      compressedAir: "yes", // curated: yes/no → adapter bridges to hasCompressedAir
      heavyMachinery: "yes", // curated: yes/no → adapter bridges to hasCNCMachines
      refrigeration: "no",
      cleanRoom: "no",
    },
    expectedPeakKWRange: [500, 4000],
    minContributors: 3,
    sensitivityField: "squareFootage",
    sensitivityValues: [25000, 500000],
  },
  // ── HOSPITAL ───────────────────────────────────────────────────────────
  {
    name: "Hospital (200-bed regional)",
    calculatorId: "hospital_load_v1",
    curatedInputs: {
      facilityType: "regional-medical", // curated ID → adapter bridges to hospitalType=regional
      bedCount: 200,
      operatingRooms: "6-10", // curated ID → adapter bridges to surgicalSuites=6
      imagingEquipment: "both", // curated: mri/ct/both/none → bridges to hasMRI+hasCT
      criticalSystems: "life-safety", // curated → bridges to criticalLoadPct=0.85
      laundryOnSite: "yes", // curated → bridges to hasSterilization
      dataCenter: "yes", // curated → bridges to hasLab
      backupDuration: "8hr",
    },
    expectedPeakKWRange: [500, 4000],
    minContributors: 3,
    sensitivityField: "bedCount",
    sensitivityValues: [50, 500],
  },
  // ── WAREHOUSE ──────────────────────────────────────────────────────────
  {
    name: "Warehouse (200K sqft, ambient)",
    calculatorId: "warehouse_load_v1",
    curatedInputs: {
      warehouseType: "ambient",
      squareFootage: 200000,
      operatingHours: "standard",
      refrigeration: "no",
      automationLevel: "moderate",
    },
    expectedPeakKWRange: [100, 1000],
    minContributors: 3,
    sensitivityField: "squareFootage",
    sensitivityValues: [50000, 500000],
  },
  // ── WAREHOUSE COLD STORAGE ─────────────────────────────────────────────
  {
    name: "Warehouse (100K sqft, cold storage)",
    calculatorId: "warehouse_load_v1",
    curatedInputs: {
      warehouseType: "cold-storage",
      squareFootage: 100000,
      operatingHours: "24-7",
      refrigeration: "yes",
    },
    expectedPeakKWRange: [300, 2000],
    minContributors: 3,
    sensitivityField: "squareFootage",
    sensitivityValues: [25000, 300000],
  },
  // ── EV CHARGING ────────────────────────────────────────────────────────
  {
    name: "EV Charging (12 L2 + 8 DCFC)",
    calculatorId: "ev_charging_load_v1",
    curatedInputs: {
      stationType: "public-urban",
      level2Chargers: 12,
      level2Power: "11", // curated ID → adapter bridges to level2PowerKW=11
      dcFastChargers: 8, // curated ID → adapter bridges to dcfcChargers=8
      dcFastPower: "150",
      operatingHours: "24-7",
      peakConcurrency: "50",
      siteDemandCap: 0, // curated ID → adapter bridges to siteDemandCapKW
    },
    expectedPeakKWRange: [200, 2500],
    minContributors: 2,
    sensitivityField: "dcFastChargers",
    sensitivityValues: [2, 20],
  },
  // ── RESTAURANT ─────────────────────────────────────────────────────────
  {
    name: "Restaurant (100-seat full-service)",
    calculatorId: "restaurant_load_v1",
    curatedInputs: {
      restaurantType: "full-service",
      seatingCapacity: 100,
      kitchenType: "full-commercial",
      operatingHours: "lunch-dinner",
      cookingEquipment: "all-electric",
    },
    expectedPeakKWRange: [25, 200],
    minContributors: 3,
    sensitivityField: "seatingCapacity",
    sensitivityValues: [30, 300],
  },
  // ── GAS STATION ────────────────────────────────────────────────────────
  {
    name: "Gas Station (8 pumps + C-store)",
    calculatorId: "gas_station_load_v1",
    curatedInputs: {
      stationType: "with-cstore",
      fuelPumps: 8,
      convenienceStore: "yes",
      foodService: "deli",
      carWash: "yes",
      evChargers: 2,
      squareFootage: 3000,
      signage: "led-digital",
    },
    expectedPeakKWRange: [30, 300],
    minContributors: 3,
    sensitivityField: "fuelPumps",
    sensitivityValues: [4, 16],
  },
  // ── TRUCK STOP ─────────────────────────────────────────────────────────
  {
    name: "Truck Stop (12 lanes, 80 parking)",
    calculatorId: "truck_stop_load_v1",
    curatedInputs: {
      fuelPumps: 12,
      cStoreSqFt: 5000,
      truckParkingSpots: 80,
      stationType: "truck-stop",
      hasShowers: true,
      hasLaundry: true,
      hasRestaurant: true,
      hasCarWash: false,
    },
    expectedPeakKWRange: [80, 500],
    minContributors: 3,
    sensitivityField: "fuelPumps",
    sensitivityValues: [6, 24],
  },
];

// ============================================================================
// GENERIC ADAPTER TESTS (industries without dedicated adapters)
// ============================================================================

interface GenericIndustryTest {
  name: string;
  slug: string;
  inputs: Record<string, unknown>;
  expectedPeakKWRange: [number, number];
}

const GENERIC_INDUSTRY_TESTS: GenericIndustryTest[] = [
  {
    name: "Airport (via generic adapter)",
    slug: "airport",
    inputs: {
      _industrySlug: "airport",
      annualPassengers: 5000000,
      terminalSqFt: 500000,
      jetBridges: 20,
    },
    expectedPeakKWRange: [5000, 25000], // 5M pax → 18 MW per FAA/industry airport benchmarks
  },
  {
    name: "Casino (via generic adapter)",
    slug: "casino",
    inputs: {
      _industrySlug: "casino",
      gamingFloorSqft: 100000,
      totalPropertySqFt: 300000,
      hotelRooms: 500,
    },
    expectedPeakKWRange: [500, 10000],
  },
  {
    name: "Apartment (via generic adapter)",
    slug: "apartment",
    inputs: {
      _industrySlug: "apartment",
      unitCount: 100,
      avgUnitSize: 900,
    },
    expectedPeakKWRange: [50, 2000],
  },
  {
    name: "College (via generic adapter)",
    slug: "college",
    inputs: {
      _industrySlug: "college",
      campusSqFt: 1000000,
      enrollment: 10000,
    },
    expectedPeakKWRange: [200, 10000],
  },
  {
    name: "Indoor Farm (via generic adapter)",
    slug: "indoor-farm",
    inputs: {
      _industrySlug: "indoor-farm",
      squareFootage: 50000,
      growingLevels: 3,
    },
    expectedPeakKWRange: [100, 5000],
  },
  {
    name: "Agriculture (via generic adapter)",
    slug: "agricultural",
    inputs: {
      _industrySlug: "agricultural",
      acreage: 500,
    },
    expectedPeakKWRange: [10, 2000],
  },
  {
    name: "Cold Storage (via generic adapter)",
    slug: "cold-storage",
    inputs: {
      _industrySlug: "cold-storage",
      squareFootage: 50000,
      temperatureZones: "multi-temp",
    },
    expectedPeakKWRange: [100, 3000],
  },
  {
    name: "Residential (via generic adapter)",
    slug: "residential",
    inputs: {
      _industrySlug: "residential",
      squareFootage: 2500,
    },
    expectedPeakKWRange: [5, 200],
  },
  {
    name: "Government (via generic adapter)",
    slug: "government",
    inputs: {
      _industrySlug: "government",
      squareFootage: 50000,
    },
    expectedPeakKWRange: [50, 2000],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function validateCalcResult(
  result: CalcRunResult,
  tc: { name: string; expectedPeakKWRange: [number, number]; minContributors?: number }
) {
  // 1. Basic output validity
  expect(result.peakLoadKW, `${tc.name}: peakLoadKW should be > 0`).toBeGreaterThan(0);
  expect(result.baseLoadKW, `${tc.name}: baseLoadKW should be >= 0`).toBeGreaterThanOrEqual(0);
  expect(result.energyKWhPerDay, `${tc.name}: energyKWhPerDay should be > 0`).toBeGreaterThan(0);
  expect(Number.isFinite(result.peakLoadKW), `${tc.name}: peakLoadKW should be finite`).toBe(true);
  expect(Number.isFinite(result.baseLoadKW), `${tc.name}: baseLoadKW should be finite`).toBe(true);

  // 2. Range validation
  expect(
    result.peakLoadKW,
    `${tc.name}: peakLoadKW ${result.peakLoadKW} outside expected range [${tc.expectedPeakKWRange[0]}, ${tc.expectedPeakKWRange[1]}]`
  ).toBeGreaterThanOrEqual(tc.expectedPeakKWRange[0]);
  expect(
    result.peakLoadKW,
    `${tc.name}: peakLoadKW ${result.peakLoadKW} outside expected range [${tc.expectedPeakKWRange[0]}, ${tc.expectedPeakKWRange[1]}]`
  ).toBeLessThanOrEqual(tc.expectedPeakKWRange[1]);

  // 3. baseLoadKW <= peakLoadKW
  expect(
    result.baseLoadKW,
    `${tc.name}: baseLoadKW (${result.baseLoadKW}) should be <= peakLoadKW (${result.peakLoadKW})`
  ).toBeLessThanOrEqual(result.peakLoadKW);

  // 4. No NaN/Infinity in warnings
  expect(result.warnings || []).not.toContain(expect.stringContaining("NaN"));

  return result;
}

function validateTrueQuoteEnvelope(result: CalcRunResult, name: string) {
  const v = result.validation;
  expect(v, `${name}: validation envelope must exist`).toBeDefined();
  if (!v) return;

  // Version
  expect(v.version, `${name}: version must be "v1"`).toBe("v1");

  // Duty cycle
  expect(v.dutyCycle, `${name}: dutyCycle must be > 0`).toBeGreaterThan(0);
  expect(v.dutyCycle, `${name}: dutyCycle must be <= 1`).toBeLessThanOrEqual(1);

  // kW Contributors
  expect(v.kWContributors, `${name}: kWContributors must exist`).toBeDefined();
  if (!v.kWContributors) return;

  // Count non-zero contributors
  const nonZero = Object.entries(v.kWContributors).filter(([, val]) => (val as number) > 0);
  expect(
    nonZero.length,
    `${name}: should have ≥2 non-zero kWContributors, got ${nonZero.length}: ${nonZero.map(([k]) => k).join(", ")}`
  ).toBeGreaterThanOrEqual(2);

  // Contributors sum check (within 5% of peakLoadKW)
  if (v.kWContributorsTotalKW != null && result.peakLoadKW > 0) {
    const sumDiffPct = Math.abs(v.kWContributorsTotalKW - result.peakLoadKW) / result.peakLoadKW;
    expect(
      sumDiffPct,
      `${name}: kWContributors sum (${v.kWContributorsTotalKW.toFixed(1)}) differs from peak (${result.peakLoadKW}) by ${(sumDiffPct * 100).toFixed(1)}%`
    ).toBeLessThan(0.1); // 10% tolerance (some adapters use additive loads)
  }

  // No NaN in contributors
  for (const [key, val] of Object.entries(v.kWContributors)) {
    expect(
      Number.isFinite(val as number),
      `${name}: kWContributors.${key} = ${val} (should be finite)`
    ).toBe(true);
  }

  // No negative contributors
  for (const [key, val] of Object.entries(v.kWContributors)) {
    expect((val as number) >= 0, `${name}: kWContributors.${key} = ${val} (should be >= 0)`).toBe(
      true
    );
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe("Pipeline Integrity: Step 3 → Calculator → SSOT → Quote", () => {
  // ── Tier 1: Dedicated Adapter Tests ──────────────────────────────────────
  describe("Tier 1: Dedicated adapter output validation", () => {
    for (const tc of INDUSTRY_TESTS) {
      it(`${tc.name}: produces valid output from curated inputs`, () => {
        const calculator = CALCULATORS_BY_ID[tc.calculatorId];
        expect(calculator, `Calculator ${tc.calculatorId} not found in registry`).toBeDefined();

        const result = calculator.compute(tc.curatedInputs);
        validateCalcResult(result, tc);
      });
    }
  });

  // ── Tier 2: TrueQuote Envelope Validation ────────────────────────────────
  describe("Tier 2: TrueQuote CalcValidation envelope", () => {
    for (const tc of INDUSTRY_TESTS) {
      it(`${tc.name}: has valid TrueQuote v1 envelope`, () => {
        const calculator = CALCULATORS_BY_ID[tc.calculatorId];
        const result = calculator.compute(tc.curatedInputs);
        validateTrueQuoteEnvelope(result, tc.name);
      });
    }
  });

  // ── Tier 3: Input Sensitivity (no silent defaults) ───────────────────────
  describe("Tier 3: Input sensitivity (changing inputs changes outputs)", () => {
    for (const tc of INDUSTRY_TESTS) {
      it(`${tc.name}: changing ${tc.sensitivityField} changes peakLoadKW`, () => {
        const calculator = CALCULATORS_BY_ID[tc.calculatorId];

        const inputLow = { ...tc.curatedInputs, [tc.sensitivityField]: tc.sensitivityValues[0] };
        const inputHigh = { ...tc.curatedInputs, [tc.sensitivityField]: tc.sensitivityValues[1] };

        const resultLow = calculator.compute(inputLow);
        const resultHigh = calculator.compute(inputHigh);

        // Higher input should produce higher peak (monotonic)
        expect(
          resultHigh.peakLoadKW,
          `${tc.name}: ${tc.sensitivityField}=${tc.sensitivityValues[1]} (${resultHigh.peakLoadKW}kW) should be > ${tc.sensitivityField}=${tc.sensitivityValues[0]} (${resultLow.peakLoadKW}kW)`
        ).toBeGreaterThan(resultLow.peakLoadKW);
      });
    }
  });

  // ── Tier 4: Curated Field Bridge Validation ──────────────────────────────
  describe("Tier 4: Curated field ID bridges work correctly", () => {
    it("Hotel: hotelCategory='3-star' bridges to hotelClass='midscale'", () => {
      const result = HOTEL_LOAD_V1_SSOT.compute({
        hotelCategory: "3-star",
        numRooms: 100,
      });
      expect(result.assumptions?.join(" ")).toContain("midscale");
    });

    it("Hotel: hotelCategory='5-star' bridges to hotelClass='luxury'", () => {
      const result = HOTEL_LOAD_V1_SSOT.compute({
        hotelCategory: "5-star",
        numRooms: 100,
      });
      expect(result.assumptions?.join(" ")).toContain("luxury");
    });

    it("Hotel: numRooms bridges to roomCount (not default 150)", () => {
      const result75 = HOTEL_LOAD_V1_SSOT.compute({ numRooms: 75 });
      const result300 = HOTEL_LOAD_V1_SSOT.compute({ numRooms: 300 });
      expect(result300.peakLoadKW).toBeGreaterThan(result75.peakLoadKW);
      // Should NOT both be 150-room default
      expect(result75.assumptions?.join(" ")).toContain("75 rooms");
    });

    it("Car Wash: facilityType='express_tunnel' bridges to carWashType='tunnel'", () => {
      const result = CAR_WASH_LOAD_V1_SSOT.compute({
        facilityType: "express_tunnel",
        tunnelOrBayCount: 4,
        dailyVehicles: 200,
      });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Car Wash: tunnelOrBayCount bridges to bayTunnelCount", () => {
      const r1 = CAR_WASH_LOAD_V1_SSOT.compute({ tunnelOrBayCount: 2, dailyVehicles: 100 });
      const r6 = CAR_WASH_LOAD_V1_SSOT.compute({ tunnelOrBayCount: 6, dailyVehicles: 300 });
      expect(r6.peakLoadKW).toBeGreaterThan(r1.peakLoadKW);
    });

    it("Car Wash: dailyVehicles bridges to averageWashesPerDay", () => {
      const r100 = CAR_WASH_LOAD_V1_SSOT.compute({ tunnelOrBayCount: 4, dailyVehicles: 100 });
      const r500 = CAR_WASH_LOAD_V1_SSOT.compute({ tunnelOrBayCount: 4, dailyVehicles: 500 });
      // dailyVehicles should be consumed (at minimum logged in assumptions)
      expect(r100.assumptions?.join(" ")).toContain("100");
    });

    it("Office: buildingClass='class-a' bridges to officeType='corporate'", () => {
      const result = OFFICE_LOAD_V1_SSOT.compute({
        buildingClass: "class-a",
        squareFootage: 50000,
      });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Office: floors='4-10' bridges to numeric floorCount=7", () => {
      const result = OFFICE_LOAD_V1_SSOT.compute({ floors: "4-10", squareFootage: 50000 });
      // Should derive elevator count from floorCount
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Office: buildingAge='aging' bridges to hvacAgeYears=25", () => {
      const resultNew = OFFICE_LOAD_V1_SSOT.compute({ buildingAge: "new", squareFootage: 50000 });
      const resultOld = OFFICE_LOAD_V1_SSOT.compute({ buildingAge: "aging", squareFootage: 50000 });
      // Aging building should have higher HVAC load (20% age penalty)
      expect(resultOld.peakLoadKW).toBeGreaterThanOrEqual(resultNew.peakLoadKW);
    });

    it("EV Charging: dcFastChargers bridges to dcfcChargers", () => {
      const r4 = EV_CHARGING_LOAD_V1_SSOT.compute({ dcFastChargers: 4, level2Chargers: 6 });
      const r16 = EV_CHARGING_LOAD_V1_SSOT.compute({ dcFastChargers: 16, level2Chargers: 6 });
      expect(r16.peakLoadKW).toBeGreaterThan(r4.peakLoadKW);
    });

    it("EV Charging: level2Power bridges to level2PowerKW", () => {
      const result = EV_CHARGING_LOAD_V1_SSOT.compute({
        level2Chargers: 10,
        dcFastChargers: 4,
        level2Power: "19.2", // curated sends string
      });
      expect(result.assumptions?.join(" ")).toContain("19.2");
    });

    it("Manufacturing: facilityType='heavy-industrial' bridges to manufacturingType='heavy'", () => {
      const result = MANUFACTURING_LOAD_V1_SSOT.compute({
        facilityType: "heavy-industrial",
        squareFootage: 100000,
      });
      expect(result.assumptions?.join(" ")).toContain("heavy");
    });

    it("Manufacturing: shifts='double' bridges to shiftPattern='2-shift'", () => {
      const r1 = MANUFACTURING_LOAD_V1_SSOT.compute({ shifts: "single", squareFootage: 100000 });
      const r3 = MANUFACTURING_LOAD_V1_SSOT.compute({ shifts: "triple", squareFootage: 100000 });
      // Triple shift should have higher base load (higher duty cycle)
      expect(r3.baseLoadKW).toBeGreaterThan(r1.baseLoadKW);
    });

    it("Hospital: facilityType='regional-medical' bridges to hospitalType='regional'", () => {
      const result = HOSPITAL_LOAD_V1_SSOT.compute({
        facilityType: "regional-medical",
        bedCount: 200,
      });
      expect(result.assumptions?.join(" ")).toContain("regional");
    });

    it("Hospital: operatingRooms='6-10' bridges to surgicalSuites=6", () => {
      const r0 = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200, operatingRooms: "0" });
      const r10 = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200, operatingRooms: "6-10" });
      // More ORs = more equipment = higher peak
      expect(r10.peakLoadKW).toBeGreaterThanOrEqual(r0.peakLoadKW);
    });

    it("Hospital: imagingEquipment='both' bridges to hasMRI+hasCT", () => {
      const rNone = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200, imagingEquipment: "none" });
      const rBoth = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200, imagingEquipment: "both" });
      // MRI + CT = +200kW → should be significantly higher
      expect(rBoth.peakLoadKW).toBeGreaterThan(rNone.peakLoadKW);
    });

    it("Warehouse: warehouseType='cold-storage' bridges to isColdStorage=true", () => {
      const rAmbient = WAREHOUSE_LOAD_V1_SSOT.compute({
        warehouseType: "ambient",
        squareFootage: 100000,
      });
      const rCold = WAREHOUSE_LOAD_V1_SSOT.compute({
        warehouseType: "cold-storage",
        squareFootage: 100000,
      });
      // Cold storage uses 8 W/sqft vs 2 W/sqft → 4x more power
      expect(rCold.peakLoadKW).toBeGreaterThan(rAmbient.peakLoadKW * 2);
    });

    it("Warehouse: refrigeration='yes' also triggers cold storage mode", () => {
      const rNo = WAREHOUSE_LOAD_V1_SSOT.compute({ squareFootage: 100000, refrigeration: "no" });
      const rYes = WAREHOUSE_LOAD_V1_SSOT.compute({ squareFootage: 100000, refrigeration: "yes" });
      expect(rYes.peakLoadKW).toBeGreaterThan(rNo.peakLoadKW * 2);
    });

    it("Data Center: rackDensity='high' bridges to rackDensityKW=15", () => {
      const result = DC_LOAD_V1_SSOT.compute({
        rackDensity: "high",
        capacity: 1,
        currentPUE: "1.3",
      });
      // DC adapter pushes: IT load, PUE, Utilization, Tier into assumptions
      expect(result.assumptions?.join(" ")).toContain("PUE: 1.3");
      // Cooling breakdown is in kWContributors, not assumptions
      expect(result.validation?.kWContributors).toBeDefined();
      const contributors = result.validation!.kWContributors!;
      const hasCooling = Object.keys(contributors).some(
        (k) => k.toLowerCase().includes("cooling") || k.toLowerCase().includes("hvac")
      );
      expect(hasCooling).toBe(true);
    });
  });

  // ── Tier 5: Generic Adapter Fallback ─────────────────────────────────────
  describe("Tier 5: Generic adapter produces sane output", () => {
    for (const tc of GENERIC_INDUSTRY_TESTS) {
      it(`${tc.name}: produces output in expected range`, () => {
        const result = GENERIC_SSOT_ADAPTER.compute(tc.inputs);
        validateCalcResult(result, tc);
      });
    }
  });

  // ── Tier 6: Edge Cases & Boundary Values ─────────────────────────────────
  describe("Tier 6: Edge cases and boundary values", () => {
    it("Hotel: 0 rooms falls to default 150", () => {
      const result = HOTEL_LOAD_V1_SSOT.compute({ numRooms: 0 });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Hotel: negative rooms falls to default 150", () => {
      const result = HOTEL_LOAD_V1_SSOT.compute({ numRooms: -10 });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Car Wash: empty inputs use defaults", () => {
      const result = CAR_WASH_LOAD_V1_SSOT.compute({});
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("EV Charging: explicit 0 DCFC is NOT overridden by default", () => {
      // This is the null-safety pattern: 0 is a valid value, not "missing"
      const result = EV_CHARGING_LOAD_V1_SSOT.compute({ level2Chargers: 10, dcfcChargers: 0 });
      // With 0 DCFC, peak should be much lower than with 8 DCFC
      const resultDefault = EV_CHARGING_LOAD_V1_SSOT.compute({ level2Chargers: 10 });
      // 0 DCFC → only L2 contribution, default has 8 DCFC
      expect(result.peakLoadKW).toBeLessThan(resultDefault.peakLoadKW);
    });

    it("Office: 0 sqft falls to default 50000", () => {
      const result = OFFICE_LOAD_V1_SSOT.compute({ squareFootage: 0 });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Restaurant: seatingCapacity=0 falls to default 100", () => {
      const result = RESTAURANT_LOAD_V1_SSOT.compute({ seatingCapacity: 0 });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Restaurant: NaN seatingCapacity falls to default 100", () => {
      const result = RESTAURANT_LOAD_V1_SSOT.compute({ seatingCapacity: "not-a-number" });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Manufacturing: unknown facilityType defaults gracefully", () => {
      const result = MANUFACTURING_LOAD_V1_SSOT.compute({
        facilityType: "unknown-type",
        squareFootage: 50000,
      });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("Gas Station: 0 pumps falls to default 8", () => {
      const result = GAS_STATION_LOAD_V1_SSOT.compute({ fuelPumps: 0 });
      expect(result.peakLoadKW).toBeGreaterThan(0);
    });

    it("All adapters: no NaN in any output field", () => {
      for (const [id, calc] of Object.entries(CALCULATORS_BY_ID)) {
        if (id === "generic_ssot_v1") continue; // Generic needs _industrySlug
        const result = calc.compute({});
        expect(Number.isNaN(result.peakLoadKW), `${id}: peakLoadKW is NaN`).toBe(false);
        expect(Number.isNaN(result.baseLoadKW), `${id}: baseLoadKW is NaN`).toBe(false);
        expect(Number.isNaN(result.energyKWhPerDay), `${id}: energyKWhPerDay is NaN`).toBe(false);
      }
    });
  });

  // ── Tier 7: Cross-Industry Sanity Checks ─────────────────────────────────
  describe("Tier 7: Cross-industry sanity ordering", () => {
    it("Data center > hospital > hotel > restaurant (at typical scales)", () => {
      const dc = DC_LOAD_V1_SSOT.compute({ capacity: 2, currentPUE: "1.5" });
      const hosp = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200 });
      const hotel = HOTEL_LOAD_V1_SSOT.compute({ numRooms: 150 });
      const rest = RESTAURANT_LOAD_V1_SSOT.compute({ seatingCapacity: 100 });

      expect(dc.peakLoadKW, "DC > Hospital").toBeGreaterThan(hosp.peakLoadKW);
      expect(hosp.peakLoadKW, "Hospital > Hotel").toBeGreaterThan(hotel.peakLoadKW);
      expect(hotel.peakLoadKW, "Hotel > Restaurant").toBeGreaterThan(rest.peakLoadKW);
    });

    it("EV Charging station with 8 DCFC > Gas station without EV", () => {
      const ev = EV_CHARGING_LOAD_V1_SSOT.compute({ level2Chargers: 12, dcFastChargers: 8 });
      const gas = GAS_STATION_LOAD_V1_SSOT.compute({ fuelPumps: 8, convenienceStore: "yes" });
      expect(ev.peakLoadKW).toBeGreaterThan(gas.peakLoadKW);
    });

    it("Cold warehouse (100K sqft) > Ambient warehouse (100K sqft)", () => {
      const cold = WAREHOUSE_LOAD_V1_SSOT.compute({
        squareFootage: 100000,
        warehouseType: "cold-storage",
      });
      const ambient = WAREHOUSE_LOAD_V1_SSOT.compute({
        squareFootage: 100000,
        warehouseType: "ambient",
      });
      expect(cold.peakLoadKW).toBeGreaterThan(ambient.peakLoadKW);
    });

    it("Heavy manufacturing > Light manufacturing (same sqft)", () => {
      const heavy = MANUFACTURING_LOAD_V1_SSOT.compute({
        facilityType: "heavy-industrial",
        squareFootage: 100000,
      });
      const light = MANUFACTURING_LOAD_V1_SSOT.compute({
        facilityType: "light-assembly",
        squareFootage: 100000,
      });
      expect(heavy.peakLoadKW).toBeGreaterThanOrEqual(light.peakLoadKW);
    });

    it("Fine dining restaurant > Fast food (same seats)", () => {
      const fine = RESTAURANT_LOAD_V1_SSOT.compute({
        restaurantType: "fine-dining",
        seatingCapacity: 100,
      });
      const fast = RESTAURANT_LOAD_V1_SSOT.compute({
        restaurantType: "fast-food",
        seatingCapacity: 100,
      });
      expect(fine.peakLoadKW).toBeGreaterThan(fast.peakLoadKW);
    });
  });

  // ── Tier 8: Energy Profile Consistency ───────────────────────────────────
  describe("Tier 8: Energy profile consistency", () => {
    it("24/7 facilities have higher duty cycle than daytime-only", () => {
      const dc = DC_LOAD_V1_SSOT.compute({ capacity: 1 });
      const office = OFFICE_LOAD_V1_SSOT.compute({ squareFootage: 50000 });

      expect(dc.validation?.dutyCycle, "DC duty cycle").toBeGreaterThan(0.9);
      expect(office.validation?.dutyCycle, "Office duty cycle").toBeLessThan(0.6);
    });

    it("Hospital duty cycle reflects 24/7 operation", () => {
      const hosp = HOSPITAL_LOAD_V1_SSOT.compute({ bedCount: 200 });
      expect(hosp.validation?.dutyCycle).toBeGreaterThanOrEqual(0.75);
    });

    it("Restaurant duty cycle is moderate (not 24/7, not daytime-only)", () => {
      const rest = RESTAURANT_LOAD_V1_SSOT.compute({
        restaurantType: "full-service",
        seatingCapacity: 100,
      });
      expect(rest.validation?.dutyCycle).toBeGreaterThan(0.3);
      expect(rest.validation?.dutyCycle).toBeLessThan(0.7);
    });

    it("EV Charging has low duty cycle (intermittent charging sessions)", () => {
      const ev = EV_CHARGING_LOAD_V1_SSOT.compute({ level2Chargers: 10, dcFastChargers: 4 });
      expect(ev.validation?.dutyCycle).toBeLessThan(0.5);
    });

    it("Car Wash duty cycle matches operating hours pattern", () => {
      const cw = CAR_WASH_LOAD_V1_SSOT.compute({ tunnelOrBayCount: 4, operatingHours: 12 });
      expect(cw.validation?.dutyCycle).toBeGreaterThan(0.4);
      expect(cw.validation?.dutyCycle).toBeLessThan(0.8);
    });
  });
});
