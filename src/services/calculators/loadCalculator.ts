/**
 * LOAD CALCULATOR
 * Calculates peak demand and energy consumption based on facility data
 *
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type { Industry } from "../contracts";
import { calculateTruckStopLoad } from "../industries/truckStopIndustry";

export interface LoadCalculationInput {
  industry: Industry;
   
  useCaseData: Record<string, any>;
}

export interface LoadCalculationResult {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  averageDailyKWh: number;
  loadFactor: number; // 0-1, ratio of average to peak
  loadProfile: "flat" | "peaky" | "seasonal";
  calculationMethod: string;
  breakdown: {
    category: string;
    kW: number;
    percentage: number;
  }[];
}

// Industry-specific watts per unit
const INDUSTRY_LOAD_FACTORS: Record<
  string,
  {
    method: "per_unit" | "per_sqft" | "fixed" | "custom";
    unitName?: string;
    wattsPerUnit?: number;
    wattsPerSqft?: number;
    baseKW?: number;
    loadFactor: number;
    profile: "flat" | "peaky" | "seasonal";
  }
> = {
  hotel: {
    method: "per_unit",
    unitName: "rooms",
    wattsPerUnit: 2500, // 2.5 kW per room average
    loadFactor: 0.45,
    profile: "peaky",
  },
  car_wash: {
    method: "custom", // Uses equipment-based calculation
    loadFactor: 0.35,
    profile: "peaky",
  },
  heavy_duty_truck_stop: {
    method: "custom", // Uses calculateTruckStopLoad function
    loadFactor: 0.65,
    profile: "peaky",
  },
  data_center: {
    method: "custom", // Uses IT load directly (kW) instead of sqft
    loadFactor: 0.85,
    profile: "flat",
  },
  manufacturing: {
    method: "per_sqft",
    wattsPerSqft: 30,
    loadFactor: 0.55,
    profile: "peaky",
  },
  hospital: {
    method: "per_unit",
    unitName: "beds",
    wattsPerUnit: 8000, // 8 kW per bed
    loadFactor: 0.65,
    profile: "flat",
  },
  retail: {
    method: "per_sqft",
    wattsPerSqft: 15,
    loadFactor: 0.4,
    profile: "peaky",
  },
  office: {
    method: "per_sqft",
    wattsPerSqft: 12,
    loadFactor: 0.35,
    profile: "peaky",
  },
  warehouse: {
    method: "per_sqft",
    wattsPerSqft: 8,
    loadFactor: 0.5,
    profile: "flat",
  },
  restaurant: {
    method: "per_sqft",
    wattsPerSqft: 50, // High due to kitchen equipment
    loadFactor: 0.3,
    profile: "peaky",
  },
  college: {
    method: "per_sqft",
    wattsPerSqft: 18,
    loadFactor: 0.4,
    profile: "seasonal",
  },
  ev_charging: {
    method: "fixed",
    baseKW: 500, // Will be overridden by charger count
    loadFactor: 0.25,
    profile: "peaky",
  },
  // ========== ADDED: Missing industries (Dec 2025 audit) ==========
  airport: {
    method: "per_sqft",
    wattsPerSqft: 25, // Terminals, lighting, HVAC, security systems
    loadFactor: 0.6,
    profile: "peaky",
  },
  casino: {
    method: "per_sqft",
    wattsPerSqft: 40, // Gaming floor, HVAC, lighting, 24/7 operation
    loadFactor: 0.7,
    profile: "flat",
  },
  apartment: {
    method: "per_unit",
    unitName: "units",
    wattsPerUnit: 1500, // 1.5 kW per unit average
    loadFactor: 0.4,
    profile: "peaky",
  },
  cold_storage: {
    method: "per_sqft",
    wattsPerSqft: 45, // High refrigeration load
    loadFactor: 0.75,
    profile: "flat",
  },
  "cold-storage": {
    method: "per_sqft",
    wattsPerSqft: 45,
    loadFactor: 0.75,
    profile: "flat",
  },
  indoor_farm: {
    method: "per_sqft",
    wattsPerSqft: 80, // LED grow lights, climate control
    loadFactor: 0.8,
    profile: "flat",
  },
  "indoor-farm": {
    method: "per_sqft",
    wattsPerSqft: 80,
    loadFactor: 0.8,
    profile: "flat",
  },
  agricultural: {
    method: "per_sqft",
    wattsPerSqft: 10, // Processing, irrigation pumps
    loadFactor: 0.35,
    profile: "seasonal",
  },
  gas_station: {
    method: "per_unit",
    unitName: "dispensers",
    wattsPerUnit: 5000, // Lighting, pumps, convenience store
    loadFactor: 0.35,
    profile: "peaky",
  },
  "gas-station": {
    method: "per_unit",
    unitName: "dispensers",
    wattsPerUnit: 5000,
    loadFactor: 0.35,
    profile: "peaky",
  },
  shopping_center: {
    method: "per_sqft",
    wattsPerSqft: 18, // Common areas, anchor stores, HVAC
    loadFactor: 0.45,
    profile: "peaky",
  },
  "shopping-center": {
    method: "per_sqft",
    wattsPerSqft: 18,
    loadFactor: 0.45,
    profile: "peaky",
  },
  government: {
    method: "per_sqft",
    wattsPerSqft: 15, // Office-like, some specialized
    loadFactor: 0.4,
    profile: "peaky",
  },
  microgrid: {
    method: "fixed",
    baseKW: 1000, // Highly variable, needs custom input
    loadFactor: 0.5,
    profile: "flat",
  },
  residential: {
    method: "per_sqft",
    wattsPerSqft: 4, // Home electrical load
    loadFactor: 0.3,
    profile: "peaky",
  },
};

/**
 * Calculate car wash load from equipment (SSOT)
 * Based on actual equipment power ratings, not generic per-sqft
 */
function calculateCarWashLoad(
   
  useCaseData: Record<string, any>,
  breakdown: LoadCalculationResult["breakdown"]
): number {
  // Equipment power ratings (kW) - from BESS Sizing Questionnaire
  const EQUIPMENT_KW = {
    // Tunnel equipment
    conveyorMotor: 7.5,
    highPressurePump: 15,
    boosterPump: 5,

    // Wash equipment
    rotatingBrush: 3,
    highPressureArch: 5,
    foamApplicator: 2,
    triplefoam: 3,
    wheelBlaster: 5,

    // Drying
    blowerMotor: 15, // per blower
    heatedDryer: 10,

    // Water heating
    electricWaterHeater: 36, // per unit
    gasWaterHeater: 2, // just controls/pumps

    // Support
    vacuumStation: 3, // per station
    airCompressor: 7.5,
    lighting: 5,
    reclaimSystem: 15,
    roSystem: 3,
    controls: 2,
  };

  let totalKW = 0;

  // Base tunnel/bay equipment
  const bayCount = parseInt(useCaseData.bayCount || useCaseData.washBays || "1") || 1;
  const washType = useCaseData.washType || useCaseData.facilitySubtype || "tunnel";

  // Base equipment (always present)
  totalKW += EQUIPMENT_KW.conveyorMotor;
  totalKW += EQUIPMENT_KW.highPressurePump;
  totalKW += EQUIPMENT_KW.boosterPump;
  totalKW += EQUIPMENT_KW.controls;
  totalKW += EQUIPMENT_KW.lighting;
  breakdown.push({ category: "Base Equipment", kW: totalKW, percentage: 0 });

  // Wash equipment
  const washKW =
    EQUIPMENT_KW.rotatingBrush * 4 + // Typical 4 brushes
    EQUIPMENT_KW.highPressureArch * 2 +
    EQUIPMENT_KW.foamApplicator +
    EQUIPMENT_KW.triplefoam +
    EQUIPMENT_KW.wheelBlaster;
  totalKW += washKW;
  breakdown.push({ category: "Wash Equipment", kW: washKW, percentage: 0 });

  // Drying - based on blower count
  const blowerCount = parseInt(useCaseData.blowerCount || useCaseData.dryerCount || "4") || 4;
  const blowerType = useCaseData.blowerType || useCaseData.dryerType || "standard";
  const blowerMultiplier = blowerType === "premium" || blowerCount >= 6 ? 1.5 : 1;
  const dryingKW = blowerCount * EQUIPMENT_KW.blowerMotor * blowerMultiplier;
  totalKW += dryingKW;
  breakdown.push({ category: "Drying System", kW: dryingKW, percentage: 0 });

  // Water heating
  const waterHeaterType = useCaseData.waterHeaterType || useCaseData.heaterType || "gas";
  const waterHeaterKW =
    waterHeaterType === "electric" ? EQUIPMENT_KW.electricWaterHeater : EQUIPMENT_KW.gasWaterHeater;
  totalKW += waterHeaterKW;
  breakdown.push({ category: "Water Heating", kW: waterHeaterKW, percentage: 0 });

  // Vacuum stations
  const vacuumCount = parseInt(useCaseData.vacuumStations || useCaseData.vacuumCount || "6") || 6;
  const vacuumKW = vacuumCount * EQUIPMENT_KW.vacuumStation;
  totalKW += vacuumKW;
  breakdown.push({ category: "Vacuum Stations", kW: vacuumKW, percentage: 0 });

  // Water reclaim (if enabled)
  const hasReclaim =
    useCaseData.waterReclaim === "full" ||
    useCaseData.hasWaterReclaim === "true" ||
    useCaseData.hasWaterReclaim === true;
  if (hasReclaim) {
    totalKW += EQUIPMENT_KW.reclaimSystem + EQUIPMENT_KW.roSystem;
    breakdown.push({
      category: "Water Reclaim",
      kW: EQUIPMENT_KW.reclaimSystem + EQUIPMENT_KW.roSystem,
      percentage: 0,
    });
  }

  // Air compressor
  totalKW += EQUIPMENT_KW.airCompressor;
  breakdown.push({ category: "Air Compressor", kW: EQUIPMENT_KW.airCompressor, percentage: 0 });

  // Peak demand factor (not all equipment runs simultaneously)
  // Car washes typically see 70-80% of connected load at peak
  const peakFactor = 0.75;
  const peakDemandKW = Math.round(totalKW * peakFactor);

  if (import.meta.env.DEV) console.log("🚗 [loadCalculator] Car Wash Equipment Calculation:", {
    bayCount,
    washType,
    blowerCount,
    vacuumCount,
    waterHeaterType,
    hasReclaim,
    totalConnectedKW: totalKW,
    peakFactor,
    peakDemandKW,
  });

  // Sanity check: Car wash peak should be 50-200 kW typically
  return Math.max(50, Math.min(250, peakDemandKW));
}

/**
 * Calculate facility load based on industry and facility data
 */
export function calculateLoad(input: LoadCalculationInput): LoadCalculationResult {
  const config = INDUSTRY_LOAD_FACTORS[input.industry] || {
    method: "per_sqft",
    wattsPerSqft: 15,
    loadFactor: 0.4,
    profile: "flat" as const,
  };

  let peakDemandKW = 0;
  let calculationMethod = "";
  const breakdown: LoadCalculationResult["breakdown"] = [];

  // Calculate base load based on method
  switch (config.method) {
    case "per_unit": {
      const units = extractUnitCount(input.industry, input.useCaseData);
      peakDemandKW = (units * (config.wattsPerUnit || 2500)) / 1000;
      calculationMethod = `${units} ${config.unitName} × ${config.wattsPerUnit} W`;
      breakdown.push({
        category: `Base (${config.unitName})`,
        kW: peakDemandKW,
        percentage: 100,
      });
      break;
    }
    case "per_sqft": {
      // Check ALL field name variations from questionnaires (23 industries)
      // Priority order: industry-specific → generic → fallback
      const sqft =
        // Industry-specific sqft field names (from DB custom_questions)
        parseFloat(input.useCaseData.warehouseSqFt || "0") ||      // warehouse
        parseFloat(input.useCaseData.manufacturingSqFt || "0") ||  // manufacturing
        parseFloat(input.useCaseData.officeSqFt || "0") ||         // office
        parseFloat(input.useCaseData.retailSqFt || "0") ||         // retail
        parseFloat(input.useCaseData.storeSqFt || "0") ||          // retail
        parseFloat(input.useCaseData.mallSqFt || "0") ||           // shopping-center
        parseFloat(input.useCaseData.governmentSqFt || "0") ||     // government
        parseFloat(input.useCaseData.terminalSqFt || "0") ||       // airport
        parseFloat(input.useCaseData.gamingFloorSqFt || "0") ||    // casino
        parseFloat(input.useCaseData.growingAreaSqFt || "0") ||    // indoor-farm
        parseFloat(input.useCaseData.buildingSqFt || "0") ||       // generic
        parseFloat(input.useCaseData.facilitySqFt || "0") ||       // generic
        parseFloat(input.useCaseData.totalFacilitySqFt || "0") ||  // generic
        // Legacy/generic field names
        parseFloat(input.useCaseData.squareFootage || "0") ||
        parseFloat(input.useCaseData.squareFeet || "0") ||
        parseFloat(input.useCaseData.totalSqFt || "0") ||
        parseFloat(input.useCaseData.sqFt || "0") ||
        parseFloat(input.useCaseData.facilitySize || "0") ||
        parseFloat(input.useCaseData.buildingSize || "0") ||
        parseFloat(input.useCaseData.warehouseSize || "0") ||
        parseFloat(input.useCaseData.storeSize || "0") ||
        50000; // Default fallback
      peakDemandKW = (sqft * (config.wattsPerSqft || 15)) / 1000;
      calculationMethod = `${sqft.toLocaleString()} sqft × ${config.wattsPerSqft} W/sqft`;
      breakdown.push({
        category: "Base (sqft)",
        kW: peakDemandKW,
        percentage: 100,
      });
      break;
    }
    case "fixed": {
      peakDemandKW = config.baseKW || 500;
      calculationMethod = `Fixed base: ${peakDemandKW} kW`;
      break;
    }
    case "custom": {
      // Industry-specific custom calculations
      if (input.industry === "car_wash") {
        peakDemandKW = calculateCarWashLoad(input.useCaseData, breakdown);
        calculationMethod = "Equipment-based car wash calculation";
      } else if (input.industry === "data_center") {
        // Data centers use IT load directly (kW), not sqft
        // Field priority: totalITLoad > powerCapacity (MW) > squareFootage fallback
        const itLoadKW =
          parseFloat(input.useCaseData.totalITLoad || "0") ||
          parseFloat(input.useCaseData.powerCapacity || "0") * 1000 || // MW to kW
          0;

        if (itLoadKW > 0) {
          // PUE (Power Usage Effectiveness) adds cooling/overhead
          // Check both pue and pueTarget field names (DB uses pueTarget)
          const pue = parseFloat(input.useCaseData.pue || input.useCaseData.pueTarget || "1.5") || 1.5;
          peakDemandKW = Math.round(itLoadKW * pue);
          calculationMethod = `IT Load: ${itLoadKW} kW × PUE ${pue} = ${peakDemandKW} kW`;
          breakdown.push({ category: "IT Equipment", kW: itLoadKW, percentage: 0 });
          breakdown.push({
            category: "Cooling/Infrastructure",
            kW: peakDemandKW - itLoadKW,
            percentage: 0,
          });
        } else {
          // Fallback to sqft-based calculation
          const sqft =
            parseFloat(
              input.useCaseData.squareFootage || input.useCaseData.facilitySize || "50000"
            ) || 50000;
          peakDemandKW = Math.round((sqft * 150) / 1000); // 150 W/sqft typical DC
          calculationMethod = `Square footage fallback: ${sqft.toLocaleString()} sqft × 150 W/sqft`;
          breakdown.push({ category: "Base (sqft estimate)", kW: peakDemandKW, percentage: 100 });
        }

        if (import.meta.env.DEV) console.log("🖥️ [loadCalculator] Data Center Calculation:", {
          totalITLoad: input.useCaseData.totalITLoad,
          powerCapacity: input.useCaseData.powerCapacity,
          squareFootage: input.useCaseData.squareFootage,
          pue: input.useCaseData.pue,
          peakDemandKW,
        });
      } else if (input.industry === "heavy_duty_truck_stop") {
        const truckStopResult = calculateTruckStopLoad({
          mcsChargers: parseInt(input.useCaseData.mcsChargers || "0") || 0,
          dcfc350:
            parseInt(input.useCaseData.dcfc350 || input.useCaseData.dcFastChargers || "0") || 0,
          level2:
            parseInt(input.useCaseData.level2 || input.useCaseData.level2Chargers || "0") || 0,
          serviceBays: parseInt(input.useCaseData.serviceBays || "0") || 0,
          truckWashBays: parseInt(input.useCaseData.truckWashBays || "0") || 0,
          restaurantSeats: parseInt(input.useCaseData.restaurantSeats || "0") || 0,
          hasShowers:
            input.useCaseData.hasShowers === true || input.useCaseData.hasShowers === "true",
          hasLaundry:
            input.useCaseData.hasLaundry === true || input.useCaseData.hasLaundry === "true",
          parkingLotAcres: parseFloat(input.useCaseData.parkingLotAcres || "5") || 5,
          climateZone: (input.useCaseData.climateZone || "moderate") as "hot" | "moderate" | "cold",
        });
        peakDemandKW = truckStopResult.peakDemandKW;

        // Convert breakdown to format expected by LoadCalculationResult
        Object.entries(truckStopResult.breakdown).forEach(([category, kW]) => {
          breakdown.push({ category, kW, percentage: 0 });
        });

        calculationMethod = "Equipment-based truck stop calculation (travel center curve)";
      } else {
        // Fallback for other custom industries
        peakDemandKW = 100;
        calculationMethod = "Default custom calculation";
      }
      break;
    }
  }

  // Apply industry-specific modifiers
  peakDemandKW = applyModifiers(peakDemandKW, input.industry, input.useCaseData, breakdown);

  // Calculate consumption
  const hoursPerYear = 8760;
  const annualConsumptionKWh = peakDemandKW * hoursPerYear * config.loadFactor;
  const averageDailyKWh = annualConsumptionKWh / 365;

  // Normalize breakdown percentages
  const totalKW = breakdown.reduce((sum, b) => sum + b.kW, 0);
  breakdown.forEach((b) => {
    b.percentage = Math.round((b.kW / totalKW) * 100);
  });

  return {
    peakDemandKW: Math.round(peakDemandKW),
    annualConsumptionKWh: Math.round(annualConsumptionKWh),
    averageDailyKWh: Math.round(averageDailyKWh),
    loadFactor: config.loadFactor,
    loadProfile: config.profile,
    calculationMethod,
    breakdown,
  };
}

/**
 * Extract unit count based on industry
 * Handles ALL field name variations from 23 industries
 */
 
function extractUnitCount(industry: Industry, data: Record<string, any>): number {
  switch (industry) {
    case "hotel":
      return parseInt(data.roomCount || data.numberOfRooms || data.rooms || data.guestRooms || "100") || 100;
    case "hospital":
      return parseInt(data.bedCount || data.beds || data.licensedBeds || "200") || 200;
    case "college":
      return parseInt(data.studentCount || data.studentEnrollment || data.students || data.enrollment || "5000") || 5000;
    case "apartment":
      return parseInt(data.unitCount || data.units || data.apartments || "100") || 100;
    case "airport":
      // Use annual passengers in millions as a proxy for load (1M passengers ≈ 500 kW base)
      return parseInt(data.annualPassengers || data.gateCount || "10") || 10;
    case "casino":
      // Gaming machines as proxy (each machine ≈ 0.5 kW)
      return parseInt(data.gamingMachines || data.slotMachines || "500") || 500;
    case "gas_station":
      return parseInt(data.dispenserCount || data.fuelDispensers || data.pumps || "8") || 8;
    case "residential":
      return parseInt(data.squareFootage || data.sqFt || "2500") || 2500;
    default:
      return 100;
  }
}

/**
 * Apply industry-specific modifiers to base load
 */
function applyModifiers(
  baseKW: number,
  industry: Industry,
   
  data: Record<string, any>,
  breakdown: LoadCalculationResult["breakdown"]
): number {
  let total = baseKW;

  // Hotel modifiers
  if (industry === "hotel") {
    if (data.hasRestaurant || data.restaurant) {
      const restaurantKW = baseKW * 0.15;
      total += restaurantKW;
      breakdown.push({ category: "Restaurant", kW: restaurantKW, percentage: 0 });
    }
    if (data.hasPool || data.pool) {
      const poolKW = baseKW * 0.08;
      total += poolKW;
      breakdown.push({ category: "Pool", kW: poolKW, percentage: 0 });
    }
    if (data.hasSpa || data.spa) {
      const spaKW = baseKW * 0.05;
      total += spaKW;
      breakdown.push({ category: "Spa", kW: spaKW, percentage: 0 });
    }
    if (data.conferenceRooms || data.meetingSpaces) {
      const confKW = baseKW * 0.1;
      total += confKW;
      breakdown.push({ category: "Conference", kW: confKW, percentage: 0 });
    }
  }

  // Car wash modifiers
  if (industry === "car_wash") {
    const tunnels = data.tunnelCount || data.bays || 1;
    if (tunnels > 1) {
      total *= 1 + (tunnels - 1) * 0.4; // Each additional tunnel adds 40%
    }
    if (data.hasVacuums || data.vacuumStations) {
      const vacKW = 15 * (data.vacuumStations || 10);
      total += vacKW;
      breakdown.push({ category: "Vacuums", kW: vacKW, percentage: 0 });
    }
  }

  // Hospital modifiers
  if (industry === "hospital") {
    if (data.operatingRooms) {
      const orKW = data.operatingRooms * 50; // 50 kW per OR
      total += orKW;
      breakdown.push({ category: "Operating Rooms", kW: orKW, percentage: 0 });
    }
    if (data.icuBeds) {
      const icuKW = data.icuBeds * 15; // 15 kW per ICU bed
      total += icuKW;
      breakdown.push({ category: "ICU", kW: icuKW, percentage: 0 });
    }
    if (data.imagingEquipment) {
      const imgKW = 100; // CT, MRI, etc.
      total += imgKW;
      breakdown.push({ category: "Imaging", kW: imgKW, percentage: 0 });
    }
  }

  // Data center modifiers
  if (industry === "data_center") {
    const pue = data.pue || 1.5; // Power Usage Effectiveness
    total *= pue;
  }

  return total;
}
