// wizardV6PowerCalc.ts
// Real-time power estimate calculation, extracted from WizardV6.tsx (Op5 Feb 2026)
// Pure function — accepts WizardState, returns estimated peak demand metrics

import type { WizardState } from "./types";

export type EstimatedPowerMetrics = {
  peakDemandKW: number;
  bessKW: number;
  source: "truequote" | "user-input" | "estimate";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeEstimatedPowerMetrics(state: WizardState): EstimatedPowerMetrics {
    const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;
    const industry = state.industry || state.detectedIndustry || "";

    // Default: Use TrueQuote values if available (post-Step 5)
    if (state.calculations?.base?.peakDemandKW && state.calculations.base.peakDemandKW > 0) {
      return {
        peakDemandKW: state.calculations.base.peakDemandKW,
        bessKW: state.calculations.selected?.bessKW || state.calculations.base.peakDemandKW * 0.4,
        source: "truequote" as const,
      };
    }

    // ========================================================================
    // TRUEQUOTE™ PRIORITY 1: User-provided peak demand (highest confidence)
    // If user knows their actual peak demand, trust it directly
    // ========================================================================
    const userPeakDemand = Number(inputs.peakDemand || inputs.peakDemandKW || 0);
    if (userPeakDemand > 10 && userPeakDemand < 500000) {
      // Sanity check: 10 kW minimum, 500 MW maximum
      return {
        peakDemandKW: userPeakDemand,
        bessKW: Math.round(userPeakDemand * 0.4),
        source: "user-input" as const,
      };
    }

    // ========================================================================
    // TRUEQUOTE™ PRIORITY 2: Grid capacity ceiling
    // User can't draw more than their grid connection allows
    // ========================================================================
    let gridCapacityCeiling = Number(inputs.gridCapacity || inputs.gridCapacityKW || 0);

    // ========================================================================
    // PROGRESSIVE MODEL ENHANCEMENT (Jan 21, 2026)
    // Use micro-prompt answers to refine grid capacity if not directly provided
    // This enables TrueQuote™ to become a real financial model
    // ========================================================================
    const SERVICE_SIZE_CAPACITY: Record<string, number> = {
      "200A-single": 48, // 48 kW (200A × 240V single-phase)
      "400A-three": 277, // 277 kW (400A × 400V three-phase)
      "800A-three": 553, // 553 kW (800A × 400V three-phase)
      "1000A-plus": 1000, // 1000+ kW (industrial service)
    };

    // If serviceSize from progressive model, use it to infer grid capacity
    if (!gridCapacityCeiling && state.serviceSize && state.serviceSize !== "unsure") {
      gridCapacityCeiling = SERVICE_SIZE_CAPACITY[state.serviceSize] || 0;
      if (import.meta.env.DEV && gridCapacityCeiling > 0) {
        console.log(
          `[ProgressiveModel] Grid capacity inferred from serviceSize: ${state.serviceSize} → ${gridCapacityCeiling} kW`
        );
      }
    }

    // HVAC type from progressive model (if not in Step 3 inputs)
    const progressiveHvacType = state.hvacType;

    // Demand charge tracking from progressive model (used for future ROI calculations)
    const _hasDemandCharge = state.hasDemandCharge;
    const _demandChargeBand = state.demandChargeBand;

    // ========================================================================
    // TRUEQUOTE™ HELPER: Estimate peak from monthly bill (fallback reference)
    // Average US commercial: $0.12/kWh, 730 hrs/month, 40% load factor
    // ========================================================================
    const monthlyBill = Number(
      inputs.monthlyElectricBill || inputs.averageMonthlyBill || inputs.monthlyBill || 0
    );
    const billEstimatedPeakKW = monthlyBill > 0 ? Math.round(monthlyBill / 0.12 / 730 / 0.4) : 0;

    // ==== HELPER: HVAC multiplier based on type ====
    // Checks both Step 3 questionnaire input AND progressive model micro-prompt
    const getHvacMultiplier = (hvacType: unknown): number => {
      // First check progressive model (higher confidence from micro-prompt)
      if (progressiveHvacType && progressiveHvacType !== "not-sure") {
        const progressiveMultipliers: Record<string, number> = {
          rtu: 1.0, // Rooftop units (baseline)
          chiller: 1.15, // Central chiller (higher load)
          "heat-pump": 0.9, // Heat pumps (more efficient)
        };
        return progressiveMultipliers[progressiveHvacType] || 1.0;
      }

      // Fall back to Step 3 questionnaire input
      if (!hvacType) return 1.0;
      const type = String(hvacType).toLowerCase();
      if (type.includes("central") || type.includes("chiller")) return 1.3;
      if (type.includes("split") || type.includes("vrf")) return 1.15;
      if (type.includes("ptac") || type.includes("window")) return 1.1;
      if (type.includes("geothermal") || type.includes("heat_pump")) return 0.9;
      return 1.0;
    };

    // ==== HELPER: Equipment tier multiplier ====
    const getEquipmentTierMultiplier = (tier: unknown): number => {
      if (!tier) return 1.0;
      const t = String(tier).toLowerCase();
      if (t.includes("premium") || t.includes("high")) return 1.2;
      if (t.includes("standard") || t.includes("mid")) return 1.0;
      if (t.includes("basic") || t.includes("low") || t.includes("efficient")) return 0.85;
      return 1.0;
    };

    // ==== HELPER: Operating hours factor (base assumes 12 hrs/day) ====
    const getOperatingHoursFactor = (hours: unknown): number => {
      if (!hours) return 1.0;
      const h = typeof hours === "number" ? hours : parseInt(String(hours), 10);
      if (isNaN(h)) return 1.0;
      if (h >= 24) return 1.2; // 24/7 ops
      if (h >= 16) return 1.1; // Extended hours
      if (h >= 10) return 1.0; // Standard
      if (h >= 6) return 0.85; // Part-time
      return 0.7;
    };

    // ==== HELPER: Add existing solar/EV adjustments ====
    const getExistingLoadAdjustment = (): number => {
      let adjustment = 0;
      // Existing solar reduces apparent load (already offset)
      if (inputs.hasExistingSolar && inputs.existingSolarKW) {
        adjustment -= Number(inputs.existingSolarKW) * 0.2; // 20% capacity factor solar offset
      }
      // Existing EV chargers add load
      if (inputs.hasExistingEV && inputs.existingEVChargers) {
        adjustment += Number(inputs.existingEVChargers) * 7.2 * 0.3; // L2 @ 30% utilization
      }
      return adjustment;
    };

    let estimatedPeakKW = 0;

    // ========================================================================
    // HOTEL: roomCount, hotelCategory + ALL power-relevant fields
    // DB fields: roomCount, hotelCategory, floorCount, operatingHours, hvacType,
    //   equipmentTier, elevatorCount, efficientElevators, poolType, parkingType,
    //   exteriorLoads, hasExistingSolar, existingSolarKW, gridCapacity
    // ========================================================================
    if (industry.includes("hotel")) {
      const rooms = Number(inputs.roomCount || 150);
      const hotelClass = String(inputs.hotelCategory || "midscale").toLowerCase();
      const floorCount = Number(inputs.floorCount || 5);
      const elevatorCount = Number(inputs.elevatorCount || Math.ceil(floorCount / 3));
      const efficientElevators = Boolean(inputs.efficientElevators);
      const poolType = String(inputs.poolType || "none").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const operatingHours = inputs.operatingHours;
      const exteriorLoads = Boolean(inputs.exteriorLoads);

      // Base kW per room by hotel class
      const kWPerRoom = hotelClass.includes("luxury")
        ? 4.5
        : hotelClass.includes("upscale")
          ? 3.5
          : hotelClass.includes("midscale")
            ? 2.5
            : 2.0;

      let basePeakKW = rooms * kWPerRoom;

      // Elevator load: 20-40 kW per elevator
      const elevatorKW = efficientElevators ? 20 : 35;
      basePeakKW += elevatorCount * elevatorKW;

      // Pool load: indoor heated 50 kW, outdoor heated 30 kW, none 0
      if (poolType.includes("indoor")) basePeakKW += 50;
      else if (poolType.includes("outdoor") && poolType.includes("heat")) basePeakKW += 30;
      else if (poolType.includes("outdoor")) basePeakKW += 15;

      // Exterior loads (signage, parking lights): +10%
      if (exteriorLoads) basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.75; // 75% diversity factor
    }

    // ========================================================================
    // HOSPITAL: bedCount, hospitalType + ALL power-relevant fields
    // DB fields: bedCount, hospitalType, buildingCount, operatingRooms, icuBeds,
    //   imagingEquipment, hvacType, equipmentTier, generatorCapacity, operatingHours,
    //   totalSqFt, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("hospital")) {
      const beds = Number(inputs.bedCount || 200);
      const icuBeds = Number(inputs.icuBeds || Math.ceil(beds * 0.1));
      const operatingRooms = Number(inputs.operatingRooms || Math.ceil(beds / 25));
      const buildingCount = Number(inputs.buildingCount || 1);
      const imagingEquipment = inputs.imagingEquipment as string[] | string | undefined;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const operatingHours = inputs.operatingHours || 24;
      const _totalSqFt = Number(inputs.totalSqFt || beds * 800);

      // Base: 7-10 kW per bed
      let basePeakKW = beds * 8;

      // ICU beds: additional 5 kW/bed (life support, monitoring)
      basePeakKW += icuBeds * 5;

      // Operating rooms: 50-80 kW each
      basePeakKW += operatingRooms * 65;

      // Imaging equipment loads
      const imagingArray = Array.isArray(imagingEquipment)
        ? imagingEquipment
        : typeof imagingEquipment === "string"
          ? imagingEquipment.split(",").map((s) => s.trim())
          : [];
      const imagingPower: Record<string, number> = {
        mri: 150,
        ct: 100,
        xray: 30,
        pet: 80,
        ultrasound: 5,
        mammography: 15,
      };
      imagingArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z]/g, "");
        basePeakKW += imagingPower[key] || 30;
      });

      // Multi-building adds interconnect loads
      if (buildingCount > 1) basePeakKW *= 1 + buildingCount * 0.05;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.85; // 85% diversity (critical facility)
    }

    // ========================================================================
    // DATA CENTER: itLoadKW, tierLevel + ALL power-relevant fields
    // DB fields: itLoadKW, currentPUE, rackCount, tierLevel, dcType, workloadTypes,
    //   generatorCapacity, powerInfrastructure, freeCooling, hvacType, equipmentTier,
    //   operatingHours, whitespaceSquareFeet, squareFeet, upsConfig, aisleContainment,
    //   batteryInterest, needsBackupPower, utilityConfig
    // TRUEQUOTE™ FIXED: Jan 2026 - Added missing DB field readings
    // ========================================================================
    else if (industry.includes("data") && industry.includes("center")) {
      const itLoadKW = Number(inputs.itLoadKW || 0);
      const rackCount = Number(inputs.rackCount || 0);
      const currentPUE = Number(inputs.currentPUE || 1.5);
      const tierLevel = String(inputs.tierLevel || "tier_3").toLowerCase();
      const dcType = String(inputs.dcType || "enterprise").toLowerCase();
      const freeCooling = Boolean(inputs.freeCooling);
      const aisleContainment = Boolean(inputs.aisleContainment);
      const whitespaceSquareFeet = Number(inputs.whitespaceSquareFeet || 0);
      const squareFeet = Number(inputs.squareFeet || 0);
      const generatorCapacity = Number(inputs.generatorCapacity || 0);
      const workloadTypes = inputs.workloadTypes as string[] | string | undefined;
      const _powerInfrastructure = String(inputs.powerInfrastructure || "utility").toLowerCase();
      const upsConfig = String(inputs.upsConfig || "n+1").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const operatingHours = inputs.operatingHours || 24;
      const _needsBackupPower = Boolean(inputs.needsBackupPower);

      // PRIORITY: Calculate IT load from best available data
      let calculatedItLoad = 0;
      if (itLoadKW > 0) {
        // User provided direct IT load - highest confidence
        calculatedItLoad = itLoadKW;
      } else if (rackCount > 0) {
        // Estimate from rack count: average 5-10 kW per rack
        const kWPerRack = dcType.includes("hyperscale") ? 15 : dcType.includes("hpc") ? 20 : 7;
        calculatedItLoad = rackCount * kWPerRack;
      } else if (whitespaceSquareFeet > 0) {
        // Estimate from whitespace: 100-200 W/sqft typical
        calculatedItLoad = whitespaceSquareFeet * 0.15;
      } else if (squareFeet > 0) {
        // Total sqft includes support areas: ~50 W/sqft
        calculatedItLoad = squareFeet * 0.05;
      } else if (generatorCapacity > 0) {
        // Generator sized for full load: estimate IT at 60% of generator
        calculatedItLoad = generatorCapacity * 0.6;
      } else {
        // Default enterprise data center: 5 MW IT load
        calculatedItLoad = 5000;
      }

      // Adjust PUE based on tier and cooling features
      let effectivePUE = currentPUE;
      if (freeCooling && effectivePUE > 1.2) effectivePUE -= 0.1;
      if (aisleContainment && effectivePUE > 1.2) effectivePUE -= 0.05;
      if (tierLevel.includes("4")) effectivePUE += 0.1; // Higher redundancy = more overhead
      if (tierLevel.includes("1")) effectivePUE -= 0.1; // Basic = less overhead

      // Workload type affects power density
      const workloadArray = Array.isArray(workloadTypes)
        ? workloadTypes
        : typeof workloadTypes === "string"
          ? workloadTypes.split(",").map((s) => s.trim())
          : [];
      let densityMultiplier = 1.0;
      if (
        workloadArray.some(
          (w) =>
            w.toLowerCase().includes("ai") ||
            w.toLowerCase().includes("gpu") ||
            w.toLowerCase().includes("ml")
        )
      ) {
        densityMultiplier = 1.5; // AI/ML workloads = 50% higher density
      }
      if (
        workloadArray.some(
          (w) => w.toLowerCase().includes("hpc") || w.toLowerCase().includes("compute")
        )
      ) {
        densityMultiplier = Math.max(densityMultiplier, 1.3);
      }
      if (
        workloadArray.some(
          (w) => w.toLowerCase().includes("storage") || w.toLowerCase().includes("archive")
        )
      ) {
        densityMultiplier = Math.min(densityMultiplier, 0.8); // Storage = lower density
      }

      // DC type multiplier
      const dcMultiplier = dcType.includes("hyperscale")
        ? 1.1
        : dcType.includes("colocation")
          ? 1.05
          : dcType.includes("edge")
            ? 0.9
            : 1.0;

      // UPS configuration affects overhead
      const upsMultiplier = upsConfig.includes("2n") ? 1.1 : upsConfig.includes("n+1") ? 1.05 : 1.0;

      let basePeakKW =
        calculatedItLoad * effectivePUE * dcMultiplier * densityMultiplier * upsMultiplier;

      // Apply standard multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      // No diversity - data centers run at designed capacity
      estimatedPeakKW = basePeakKW;
    }

    // ========================================================================
    // CAR WASH: bayCount, facilityType + ALL power-relevant fields
    // DB fields: bayCount, facilityType, operatingModel, operatingHours, blowerType,
    //   waterHeaterType, lightingType, conveyorMotorType, equipmentTier, roofSqFt,
    //   hvacType, hasNaturalGas, evL2Count, evDcfcCount, hasExistingSolar
    // ========================================================================
    else if (industry.includes("car") && industry.includes("wash")) {
      const bays = Number(inputs.bayCount || 4);
      const facilityType = String(
        inputs.facilityType || inputs.operatingModel || "automatic"
      ).toLowerCase();
      const blowerType = String(inputs.blowerType || "standard").toLowerCase();
      const waterHeaterType = String(inputs.waterHeaterType || "electric").toLowerCase();
      const conveyorMotorType = String(inputs.conveyorMotorType || "standard").toLowerCase();
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const operatingHours = inputs.operatingHours;
      const hasNaturalGas = Boolean(inputs.hasNaturalGas);
      const evL2Count = Number(inputs.evL2Count || 0);
      const evDcfcCount = Number(inputs.evDcfcCount || 0);

      // Base kW per bay by type
      const kWPerBay = facilityType.includes("tunnel")
        ? 100
        : facilityType.includes("express")
          ? 80
          : facilityType.includes("automatic") || facilityType.includes("in_bay")
            ? 50
            : facilityType.includes("self")
              ? 25
              : 40;

      let basePeakKW = bays * kWPerBay;

      // Blower type: high-powered adds 15 kW/bay
      if (blowerType.includes("high") || blowerType.includes("turbo")) basePeakKW += bays * 15;

      // Water heater: gas reduces electric by 30%
      if (!hasNaturalGas && waterHeaterType.includes("electric")) basePeakKW += bays * 10;

      // High-efficiency conveyor motors: -10%
      if (conveyorMotorType.includes("vfd") || conveyorMotorType.includes("efficient"))
        basePeakKW *= 0.9;

      // On-site EV charging
      basePeakKW += evL2Count * 7.2 + evDcfcCount * 150;

      // Apply multipliers
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.85; // 85% diversity
    }

    // ========================================================================
    // EV CHARGING: charger counts by type + ALL power-relevant fields
    // DB fields: level2Count, dcfc50Count, dcfcHighCount, dcfc350, ultraFastCount, megawattCount,
    //   hubType, hubSize, stationSize, siteSqFt, operatingHours, serviceVoltage,
    //   gridCapacity, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("ev") || industry.includes("charging")) {
      const l2 = Number(inputs.level2Count || inputs.level2 || 12);
      const dcfc50 = Number(inputs.dcfc50Count || 0);
      const dcfcHigh = Number(inputs.dcfcHighCount || inputs.dcFastCount || 0);
      // CRITICAL: dcfc350 is the field name for 350 kW chargers in truck stops and some EV stations
      const ultraFast = Number(inputs.ultraFastCount || inputs.dcfc350 || 0);
      const megawatt = Number(inputs.megawattCount || inputs.mcsChargers || 0);
      const hubType = String(inputs.hubType || "public").toLowerCase();
      const _serviceVoltage = String(inputs.serviceVoltage || "480").toLowerCase();
      const gridCapacity = Number(inputs.gridCapacity || inputs.gridCapacityKW || 0);
      const operatingHours = inputs.operatingHours || 24;

      // Calculate total by charger type
      let basePeakKW = 0;
      basePeakKW += l2 * 7.2; // Level 2: 7.2 kW
      basePeakKW += dcfc50 * 50; // DCFC 50 kW
      basePeakKW += dcfcHigh * 150; // DCFC 150 kW
      basePeakKW += ultraFast * 350; // Ultra-fast 350 kW
      basePeakKW += megawatt * 1250; // Megawatt (MCS trucking) 1.25 MW each

      // Hub type affects concurrency
      let concurrency = 0.6;
      if (hubType.includes("fleet") || hubType.includes("depot")) concurrency = 0.8;
      if (hubType.includes("highway") || hubType.includes("travel")) concurrency = 0.7;
      if (hubType.includes("workplace")) concurrency = 0.4;
      if (hubType.includes("residential")) concurrency = 0.3;

      // Service voltage affects transformer sizing (no direct kW impact, but flagged)

      basePeakKW *= concurrency;
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      // If grid capacity is specified and lower, use as ceiling
      if (gridCapacity > 0 && basePeakKW > gridCapacity) {
        basePeakKW = gridCapacity;
      }

      estimatedPeakKW = basePeakKW;
    }

    // ========================================================================
    // MANUFACTURING: sqft + ALL power-relevant fields
    // DB fields: manufacturingSqFt, facilitySqFt, manufacturingType, shiftsPerDay,
    //   operatingHours, powerQualitySensitivity, hvacType, equipmentTier, majorEquipment,
    //   powerFactor, hasExistingSolar, existingSolarKW, evFleet
    // ========================================================================
    else if (industry.includes("manufacturing") || industry.includes("industrial")) {
      const sqft = Number(inputs.manufacturingSqFt || inputs.facilitySqFt || 100000);
      const manufacturingType = String(inputs.manufacturingType || "general").toLowerCase();
      const shiftsPerDay = Number(inputs.shiftsPerDay || 1);
      const operatingHours = inputs.operatingHours || shiftsPerDay * 8;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const majorEquipment = inputs.majorEquipment as string[] | string | undefined;
      const powerFactor = Number(inputs.powerFactor || 0.9);
      const evFleet = Number(inputs.evFleet || 0);

      // Base W/sqft by manufacturing type
      const wPerSqft = manufacturingType.includes("heavy")
        ? 40
        : manufacturingType.includes("precision") || manufacturingType.includes("electronics")
          ? 35
          : manufacturingType.includes("food") || manufacturingType.includes("pharmaceutical")
            ? 30
            : manufacturingType.includes("light") || manufacturingType.includes("assembly")
              ? 20
              : 25;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Major equipment additions
      const equipmentArray = Array.isArray(majorEquipment)
        ? majorEquipment
        : typeof majorEquipment === "string"
          ? majorEquipment.split(",").map((s) => s.trim())
          : [];
      const majorEquipPower: Record<string, number> = {
        cnc: 50,
        press: 100,
        injection_molding: 150,
        welding: 80,
        furnace: 200,
        compressor: 75,
        conveyor: 20,
        packaging: 30,
      };
      equipmentArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z_]/g, "_");
        basePeakKW += majorEquipPower[key] || 50;
      });

      // Shift multiplier
      if (shiftsPerDay >= 3) basePeakKW *= 1.15;
      else if (shiftsPerDay >= 2) basePeakKW *= 1.05;

      // Power factor adjustment (poor PF = higher apparent power)
      if (powerFactor < 0.9) basePeakKW *= 0.9 / powerFactor;

      // EV fleet charging
      basePeakKW += evFleet * 7.2 * 0.3;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.8; // 80% diversity
    }

    // ========================================================================
    // WAREHOUSE: sqft + ALL power-relevant fields
    // DB fields: warehouseSqFt, facilitySqFt, warehouseType, shiftsPerDay,
    //   operatingHours, automationLevel, mheEquipment, fleetSize, hvacType,
    //   equipmentTier, lightingType, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("warehouse") || industry.includes("logistics")) {
      const sqft = Number(inputs.warehouseSqFt || inputs.facilitySqFt || 200000);
      const warehouseType = String(inputs.warehouseType || "general").toLowerCase();
      const shiftsPerDay = Number(inputs.shiftsPerDay || 1);
      const automationLevel = String(inputs.automationLevel || "standard").toLowerCase();
      const mheEquipment = inputs.mheEquipment as string[] | string | undefined;
      const fleetSize = Number(inputs.fleetSize || 0);
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const operatingHours = inputs.operatingHours || shiftsPerDay * 8;

      // Base W/sqft by warehouse type
      const coldStorage =
        warehouseType.includes("cold") ||
        warehouseType.includes("refrigerat") ||
        warehouseType.includes("frozen");
      const wPerSqft = coldStorage
        ? 25
        : warehouseType.includes("distribution")
          ? 10
          : warehouseType.includes("fulfillment")
            ? 12
            : 8;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Automation level
      if (automationLevel.includes("high") || automationLevel.includes("robotic"))
        basePeakKW *= 1.4;
      else if (automationLevel.includes("medium") || automationLevel.includes("partial"))
        basePeakKW *= 1.2;

      // Material handling equipment
      const mheArray = Array.isArray(mheEquipment)
        ? mheEquipment
        : typeof mheEquipment === "string"
          ? mheEquipment.split(",").map((s) => s.trim())
          : [];
      const mhePower: Record<string, number> = {
        forklift: 10,
        conveyor: 15,
        agv: 5,
        sortation: 50,
        picker: 20,
        palletizer: 30,
      };
      mheArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z]/g, "");
        basePeakKW += mhePower[key] || 15;
      });

      // Fleet charging (electric forklifts, delivery EVs)
      basePeakKW += fleetSize * 10;

      // Lighting: LED is 30% more efficient
      if (!lightingType.includes("led")) basePeakKW *= 1.15;

      // Shift multiplier
      if (shiftsPerDay >= 3) basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.75; // 75% diversity
    }

    // ========================================================================
    // OFFICE: sqft + ALL power-relevant fields
    // DB fields: officeSqFt, totalSqFt, buildingSqFt, buildingClass, floorCount,
    //   operatingHours, elevatorCount, lightingType, hvacType, equipmentTier,
    //   tenantTypes, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("office")) {
      const sqft = Number(inputs.officeSqFt || inputs.totalSqFt || inputs.buildingSqFt || 50000);
      const buildingClass = String(inputs.buildingClass || "class_b").toLowerCase();
      const floorCount = Number(inputs.floorCount || 5);
      const elevatorCount = Number(inputs.elevatorCount || Math.ceil(floorCount / 4));
      const operatingHours = inputs.operatingHours || 10;
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const tenantTypes = String(inputs.tenantTypes || "general").toLowerCase();

      // Base W/sqft by building class
      const wPerSqft = buildingClass.includes("class_a")
        ? 15
        : buildingClass.includes("class_b")
          ? 12
          : 10;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Elevator load
      basePeakKW += elevatorCount * 25;

      // Tenant type adjustments
      if (tenantTypes.includes("tech") || tenantTypes.includes("data")) basePeakKW *= 1.2;
      if (tenantTypes.includes("medical") || tenantTypes.includes("lab")) basePeakKW *= 1.3;

      // Lighting efficiency
      if (!lightingType.includes("led")) basePeakKW *= 1.12;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.7; // 70% diversity (office buildings)
    }

    // ========================================================================
    // RETAIL/SHOPPING: sqft + ALL power-relevant fields
    // DB fields: retailSqFt, storeSqFt, mallSqFt, glaSqFt, totalSqFt, retailType,
    //   specialEquipment, refrigeration, operatingHours, equipmentTier, parkingType,
    //   hvacType, lightingType, locationCount, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("retail") || industry.includes("shopping")) {
      const sqft = Number(
        inputs.retailSqFt ||
          inputs.storeSqFt ||
          inputs.mallSqFt ||
          inputs.glaSqFt ||
          inputs.totalSqFt ||
          100000
      );
      const retailType = String(inputs.retailType || "general").toLowerCase();
      const specialEquipment = inputs.specialEquipment as string[] | string | undefined;
      const refrigeration = String(inputs.refrigeration || "none").toLowerCase();
      const operatingHours = inputs.operatingHours || 12;
      const parkingType = String(inputs.parkingType || "surface").toLowerCase();
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const locationCount = Number(inputs.locationCount || 1);

      // Base W/sqft by retail type
      const wPerSqft =
        retailType.includes("grocery") || retailType.includes("supermarket")
          ? 35
          : retailType.includes("mall") || retailType.includes("department")
            ? 30
            : retailType.includes("big_box")
              ? 20
              : retailType.includes("convenience")
                ? 40
                : 25;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Refrigeration load
      if (refrigeration.includes("extensive") || refrigeration.includes("walk_in"))
        basePeakKW *= 1.4;
      else if (refrigeration.includes("standard") || refrigeration.includes("reach_in"))
        basePeakKW *= 1.2;

      // Special equipment
      const equipArray = Array.isArray(specialEquipment)
        ? specialEquipment
        : typeof specialEquipment === "string"
          ? specialEquipment.split(",").map((s) => s.trim())
          : [];
      const specialPower: Record<string, number> = {
        bakery: 30,
        deli: 20,
        pharmacy: 10,
        photo: 5,
        auto: 50,
      };
      equipArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z]/g, "");
        basePeakKW += specialPower[key] || 15;
      });

      // Parking structure adds load
      if (parkingType.includes("garage") || parkingType.includes("structure"))
        basePeakKW += sqft * 0.005;

      // Multiple locations
      if (locationCount > 1) basePeakKW *= locationCount * 0.95; // 5% efficiency per location

      // Lighting efficiency
      if (!lightingType.includes("led")) basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.8; // 80% diversity
    }

    // ========================================================================
    // COLLEGE/UNIVERSITY: students + ALL power-relevant fields
    // DB fields: studentPopulation, studentEnrollment, studentCount, totalSqFt,
    //   institutionType, buildingCount, hvacAge, hvacType, equipmentTier,
    //   operatingHours, facilityTypes, evInfrastructure, backupPowerStatus,
    //   hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("college") || industry.includes("university")) {
      const students = Number(
        inputs.studentPopulation || inputs.studentEnrollment || inputs.studentCount || 10000
      );
      const _totalSqFt = Number(inputs.totalSqFt || students * 100);
      const institutionType = String(inputs.institutionType || "public_university").toLowerCase();
      const buildingCount = Number(inputs.buildingCount || Math.ceil(students / 2000));
      const hvacAge = Number(inputs.hvacAge || 15);
      const facilityTypes = inputs.facilityTypes as string[] | string | undefined;
      const evInfrastructure = String(inputs.evInfrastructure || "limited").toLowerCase();
      const operatingHours = inputs.operatingHours || 16;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base: 1.5 kW per student
      let basePeakKW = students * 1.5;

      // Institution type multiplier
      if (institutionType.includes("research")) basePeakKW *= 1.3;
      if (institutionType.includes("medical") || institutionType.includes("hospital"))
        basePeakKW *= 1.5;

      // Facility types
      const facilityArray = Array.isArray(facilityTypes)
        ? facilityTypes
        : typeof facilityTypes === "string"
          ? facilityTypes.split(",").map((s) => s.trim())
          : [];
      const facilityPower: Record<string, number> = {
        lab: 100,
        data_center: 200,
        stadium: 500,
        arena: 300,
        pool: 50,
        dorm: 0.5 * students,
      };
      facilityArray.forEach((fac) => {
        const key = fac.toLowerCase().replace(/[^a-z_]/g, "_");
        basePeakKW += facilityPower[key] || 50;
      });

      // HVAC age (older = less efficient)
      if (hvacAge > 20) basePeakKW *= 1.15;
      else if (hvacAge > 10) basePeakKW *= 1.05;

      // EV infrastructure
      if (evInfrastructure.includes("extensive")) basePeakKW += 200;
      else if (evInfrastructure.includes("moderate")) basePeakKW += 100;
      else if (evInfrastructure.includes("limited")) basePeakKW += 30;

      // Multi-building adds distribution loss
      basePeakKW *= 1 + buildingCount * 0.02;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.65; // 65% diversity (campus spread)
    }

    // ========================================================================
    // AIRPORT: passengers + ALL power-relevant fields
    // DB fields: annualPassengers, terminalSqFt, gateCount, airportType,
    //   terminalCount, publicEvChargers, operatingHours, equipmentTier, hvacType,
    //   hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("airport")) {
      const passengers = Number(inputs.annualPassengers || 5000000);
      const terminalSqFt = Number(inputs.terminalSqFt || passengers / 50);
      const gateCount = Number(inputs.gateCount || Math.ceil(passengers / 200000));
      const airportType = String(inputs.airportType || "commercial").toLowerCase();
      const terminalCount = Number(inputs.terminalCount || 1);
      const publicEvChargers = Number(inputs.publicEvChargers || 0);
      const operatingHours = inputs.operatingHours || 20;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base: 2W per annual passenger OR 30W/sqft terminal, whichever higher
      const passengerPower = passengers / 500;
      const terminalPower = terminalSqFt * 0.03;
      let basePeakKW = Math.max(passengerPower, terminalPower);

      // Gate power: 50 kW per gate (jet bridges, ground power)
      basePeakKW += gateCount * 50;

      // Airport type
      if (airportType.includes("international") || airportType.includes("hub")) basePeakKW *= 1.2;
      if (airportType.includes("cargo")) basePeakKW *= 1.1;

      // Multi-terminal
      if (terminalCount > 1) basePeakKW *= 1 + (terminalCount - 1) * 0.15;

      // EV chargers for public/staff
      basePeakKW += publicEvChargers * 7.2 * 0.4;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.75; // 75% diversity
    }

    // ========================================================================
    // CASINO: gaming sqft + ALL power-relevant fields
    // DB fields: gamingFloorSqFt, gamingFloorSize, totalSqFt, hotelRooms,
    //   slotMachines, casinoType, operatingHours, equipmentTier, hvacType,
    //   parkingType, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("casino")) {
      const sqft = Number(
        inputs.gamingFloorSqFt || inputs.gamingFloorSize || inputs.totalSqFt || 100000
      );
      const hotelRooms = Number(inputs.hotelRooms || 0);
      const slotMachines = Number(inputs.slotMachines || Math.ceil(sqft / 50));
      const casinoType = String(inputs.casinoType || "resort").toLowerCase();
      const operatingHours = inputs.operatingHours || 24;
      const parkingType = String(inputs.parkingType || "surface").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base: 50 W/sqft gaming floor
      let basePeakKW = sqft * 0.05;

      // Slot machines: 0.5 kW each
      basePeakKW += slotMachines * 0.5;

      // Hotel rooms if integrated
      basePeakKW += hotelRooms * 3;

      // Casino type
      if (casinoType.includes("resort") || casinoType.includes("destination")) basePeakKW *= 1.3;
      if (casinoType.includes("racino")) basePeakKW *= 1.1;

      // Parking garage
      if (parkingType.includes("garage") || parkingType.includes("structure"))
        basePeakKW += sqft * 0.008;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.85; // 85% diversity (24/7 ops)
    }

    // ========================================================================
    // RESTAURANT: sqft + ALL power-relevant fields
    // DB fields: squareFootage, restaurantType, seatCount, hasWalkInFreezer,
    //   hasKitchenHood, kitchenEquipment, refrigerationCount, operatingHours,
    //   hvacType, hasOutdoorSeating, hasBarService, dishwasherType
    // ========================================================================
    else if (industry.includes("restaurant")) {
      const sqft = Number(inputs.squareFootage || 3000);
      const seats = Number(inputs.seatCount || 80);
      const restaurantType = String(inputs.restaurantType || "casual_dining").toLowerCase();
      const operatingHours = inputs.operatingHours || 12;
      const hvacType = inputs.hvacType as string | undefined;
      const hasOutdoorSeating = Boolean(inputs.hasOutdoorSeating);
      const hasBarService = Boolean(inputs.hasBarService);
      const dishwasherType = String(inputs.dishwasherType || "standard").toLowerCase();

      // Base: 50W/sqft for HVAC + lighting
      let basePeakKW = sqft * 0.05;

      // Restaurant type affects kitchen intensity
      const typeMultiplier =
        restaurantType.includes("fine") || restaurantType.includes("steakhouse")
          ? 1.4
          : restaurantType.includes("fast_food") || restaurantType.includes("qsr")
            ? 1.2
            : restaurantType.includes("cafe") || restaurantType.includes("coffee")
              ? 0.8
              : 1.0;
      basePeakKW *= typeMultiplier;

      // Kitchen equipment loads
      const cookingEquipment = (inputs.kitchenEquipment || inputs.primaryCookingEquipment) as
        | string[]
        | string
        | undefined;
      const equipmentArray = Array.isArray(cookingEquipment)
        ? cookingEquipment
        : typeof cookingEquipment === "string"
          ? cookingEquipment.split(",").map((s) => s.trim())
          : [];

      const equipmentPower: Record<string, number> = {
        gas_range: 15,
        electric_range: 25,
        fryers: 20,
        flat_griddle: 15,
        pizza_oven: 30,
        convection_oven: 12,
        commercial_oven: 20,
        grill: 15,
        steamer: 10,
        wok: 25,
        broiler: 20,
        salamander: 8,
      };

      equipmentArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z_]/g, "_");
        basePeakKW += equipmentPower[key] || 10;
      });

      // Kitchen hood exhaust: 5-10 kW
      if (inputs.hasKitchenHood || inputs.hasCommercialKitchenHood) basePeakKW += 8;

      // Walk-in refrigeration
      if (inputs.hasWalkInFreezer || inputs.hasWalkInRefrigeration) basePeakKW += 6;
      if (inputs.hasWalkInCooler) basePeakKW += 4;

      // Refrigeration count
      const refrigCount = Number(inputs.refrigerationCount || 0);
      if (refrigCount > 0) basePeakKW += refrigCount * 3;

      // Outdoor seating: additional HVAC/heating
      if (hasOutdoorSeating) basePeakKW += 15;

      // Bar service: ice machines, draft systems
      if (hasBarService) basePeakKW += 10;

      // Dishwasher type
      if (dishwasherType.includes("high_temp") || dishwasherType.includes("conveyor"))
        basePeakKW += 15;
      else if (dishwasherType.includes("standard")) basePeakKW += 8;

      // Seat count scaling
      const seatMultiplier = seats > 150 ? 1.3 : seats > 75 ? 1.1 : 1.0;

      // Apply multipliers
      basePeakKW *= seatMultiplier;
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.8; // 80% diversity
    }

    // ========================================================================
    // APARTMENT/RESIDENTIAL: units + ALL power-relevant fields
    // DB fields: totalUnits, homeSqFt, avgUnitSize, buildingCount, propertyType,
    //   waterHeating, hvacType, elevatorCount, inUnitLaundry, parkingType,
    //   communityAmenities, evChargingInterest, equipmentTier, operatingHours,
    //   hasExistingSolar, existingSolarKW, hasExistingEV, existingEVChargers
    // ========================================================================
    else if (industry.includes("apartment") || industry.includes("residential")) {
      const units = Number(inputs.totalUnits || 100);
      const homeSqFt = Number(inputs.homeSqFt || 0);
      const _avgUnitSize = Number(inputs.avgUnitSize || 900);
      const buildingCount = Number(inputs.buildingCount || 1);
      const propertyType = String(inputs.propertyType || "garden").toLowerCase();
      const waterHeating = String(inputs.waterHeating || "individual").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const elevatorCount = Number(inputs.elevatorCount || 0);
      const inUnitLaundry = Boolean(inputs.inUnitLaundry);
      const communityAmenities = inputs.communityAmenities as string[] | string | undefined;
      const evChargingInterest = String(inputs.evChargingInterest || "none").toLowerCase();
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Single family home
      if (homeSqFt > 0 && units <= 1) {
        let basePeakKW = homeSqFt * 0.01; // 10 W/sqft
        basePeakKW *= getHvacMultiplier(hvacType);
        basePeakKW += getExistingLoadAdjustment();
        estimatedPeakKW = basePeakKW * 0.6; // 60% diversity single home
      } else {
        // Multi-unit calculation
        const kWPerUnit =
          propertyType.includes("high_rise") || propertyType.includes("luxury")
            ? 5
            : propertyType.includes("mid_rise")
              ? 4
              : propertyType.includes("garden")
                ? 3.5
                : 4;

        let basePeakKW = units * kWPerUnit;

        // Water heating: central electric adds load
        if (waterHeating.includes("central") && waterHeating.includes("electric"))
          basePeakKW += units * 0.5;

        // Elevators
        basePeakKW += elevatorCount * 25;

        // In-unit laundry
        if (inUnitLaundry) basePeakKW += units * 0.3;

        // Community amenities
        const amenityArray = Array.isArray(communityAmenities)
          ? communityAmenities
          : typeof communityAmenities === "string"
            ? communityAmenities.split(",").map((s) => s.trim())
            : [];
        const amenityPower: Record<string, number> = {
          pool: 40,
          gym: 20,
          clubhouse: 30,
          sauna: 15,
          business_center: 10,
        };
        amenityArray.forEach((am) => {
          const key = am.toLowerCase().replace(/[^a-z_]/g, "_");
          basePeakKW += amenityPower[key] || 10;
        });

        // EV charging interest
        if (evChargingInterest.includes("high")) basePeakKW += units * 0.5;
        else if (evChargingInterest.includes("moderate")) basePeakKW += units * 0.3;

        // Multi-building
        if (buildingCount > 1) basePeakKW *= 1 + (buildingCount - 1) * 0.05;

        // Apply multipliers
        basePeakKW *= getHvacMultiplier(hvacType);
        basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
        basePeakKW += getExistingLoadAdjustment();

        estimatedPeakKW = basePeakKW * 0.55; // 55% diversity multi-unit
      }
    }

    // ========================================================================
    // COLD STORAGE: sqft + ALL power-relevant fields
    // DB fields: totalSqFt, refrigeratedSqFt, storageCapacity, palletCapacity,
    //   facilityType, productTypes, refrigerationSystem, operatingHours,
    //   hvacType, equipmentTier, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("cold") && industry.includes("storage")) {
      const sqft = Number(inputs.refrigeratedSqFt || inputs.totalSqFt || 50000);
      const palletCapacity = Number(inputs.palletCapacity || 0);
      const facilityType = String(inputs.facilityType || "frozen").toLowerCase();
      const productTypes = inputs.productTypes as string[] | string | undefined;
      const refrigerationSystem = String(inputs.refrigerationSystem || "ammonia").toLowerCase();
      const operatingHours = inputs.operatingHours || 24;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base W/sqft by facility type
      const wPerSqft =
        facilityType.includes("deep_freeze") || facilityType.includes("blast")
          ? 60
          : facilityType.includes("frozen")
            ? 45
            : facilityType.includes("refrigerat") || facilityType.includes("cooler")
              ? 30
              : 40;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Pallet capacity: alternative sizing if sqft not provided
      if (palletCapacity > 0 && sqft <= 0) {
        basePeakKW = palletCapacity * 0.15; // ~0.15 kW per pallet position
      }

      // Product types affect temperature requirements
      const productArray = Array.isArray(productTypes)
        ? productTypes
        : typeof productTypes === "string"
          ? productTypes.split(",").map((s) => s.trim())
          : [];
      if (
        productArray.some(
          (p) => p.toLowerCase().includes("pharma") || p.toLowerCase().includes("vaccine")
        )
      ) {
        basePeakKW *= 1.3; // Precise temp control
      }
      if (
        productArray.some(
          (p) => p.toLowerCase().includes("ice_cream") || p.toLowerCase().includes("deep")
        )
      ) {
        basePeakKW *= 1.2; // Deep freeze
      }

      // Refrigeration system efficiency
      if (refrigerationSystem.includes("co2") || refrigerationSystem.includes("cascade"))
        basePeakKW *= 1.1;
      if (refrigerationSystem.includes("ammonia")) basePeakKW *= 0.95; // More efficient

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.9; // 90% diversity (refrigeration continuous)
    }

    // ========================================================================
    // GAS STATION: dispensers + ALL power-relevant fields
    // DB fields: dispenserCount, storeSqFt, stationType, fuelTypes, refrigeration,
    //   lightingType, operatingHours, equipmentTier, hvacType, locationCount,
    //   existingEvCharging, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("gas") && industry.includes("station")) {
      const dispensers = Number(inputs.dispenserCount || 8);
      const storeSqFt = Number(inputs.storeSqFt || 2000);
      const stationType = String(inputs.stationType || "convenience").toLowerCase();
      const fuelTypes = inputs.fuelTypes as string[] | string | undefined;
      const refrigeration = String(inputs.refrigeration || "standard").toLowerCase();
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const operatingHours = inputs.operatingHours || 24;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const existingEvCharging = Number(inputs.existingEvCharging || 0);

      // Base: 2 kW per dispenser + convenience store
      let basePeakKW = dispensers * 2;
      basePeakKW += storeSqFt * 0.025; // 25 W/sqft store

      // Station type
      if (stationType.includes("truck_stop") || stationType.includes("travel")) basePeakKW *= 1.5;
      if (stationType.includes("car_wash")) basePeakKW += 100; // Integrated car wash

      // Fuel types: EV charging on-site
      const fuelArray = Array.isArray(fuelTypes)
        ? fuelTypes
        : typeof fuelTypes === "string"
          ? fuelTypes.split(",").map((s) => s.trim())
          : [];
      if (
        fuelArray.some(
          (f) => f.toLowerCase().includes("ev") || f.toLowerCase().includes("electric")
        )
      ) {
        basePeakKW += 100; // DCFC capability
      }

      // Existing EV charging
      basePeakKW += existingEvCharging * 50; // Assume DCFC

      // Refrigeration level (coolers, freezers)
      if (refrigeration.includes("extensive")) basePeakKW += 30;
      else if (refrigeration.includes("standard")) basePeakKW += 15;

      // Canopy lighting
      if (!lightingType.includes("led")) basePeakKW += 10;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.8; // 80% diversity
    }

    // ========================================================================
    // GOVERNMENT: sqft + ALL power-relevant fields
    // DB fields: totalSqFt, governmentSqFt, facilitySqFt, buildingCount,
    //   facilityType, governmentLevel, fleetSize, operatingHours, equipmentTier,
    //   backupPower, hvacType, lightingType, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("government")) {
      const sqft = Number(
        inputs.totalSqFt || inputs.governmentSqFt || inputs.facilitySqFt || 100000
      );
      const buildingCount = Number(inputs.buildingCount || 1);
      const facilityType = String(inputs.facilityType || "office").toLowerCase();
      const governmentLevel = String(inputs.governmentLevel || "municipal").toLowerCase();
      const fleetSize = Number(inputs.fleetSize || 0);
      const operatingHours = inputs.operatingHours || 10;
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base W/sqft by facility type
      const wPerSqft =
        facilityType.includes("data") || facilityType.includes("command")
          ? 30
          : facilityType.includes("courthouse") || facilityType.includes("police")
            ? 20
            : facilityType.includes("library") || facilityType.includes("community")
              ? 15
              : facilityType.includes("vehicle") || facilityType.includes("maintenance")
                ? 25
                : 15;

      let basePeakKW = sqft * (wPerSqft / 1000);

      // Government level (federal tends to be larger, more critical)
      if (governmentLevel.includes("federal")) basePeakKW *= 1.2;

      // Fleet charging (EVs for government vehicles)
      basePeakKW += fleetSize * 7.2 * 0.3;

      // Multi-building campus
      if (buildingCount > 1) basePeakKW *= 1 + (buildingCount - 1) * 0.08;

      // Lighting efficiency
      if (!lightingType.includes("led")) basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.7; // 70% diversity (office-like)
    }

    // ========================================================================
    // INDOOR FARM: sqft + ALL power-relevant fields
    // DB fields: growingAreaSqFt, farmType, growingLevels, lightingLoadPercent,
    //   cropTypes, operatingSchedule, automationLevel, lightingType, operatingHours,
    //   hvacType, equipmentTier, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("indoor") && industry.includes("farm")) {
      const sqft = Number(inputs.growingAreaSqFt || 20000);
      const levels = Number(inputs.growingLevels || 1);
      const lightingLoadPercent = Number(inputs.lightingLoadPercent || 70);
      const farmType = String(inputs.farmType || "vertical").toLowerCase();
      const cropTypes = inputs.cropTypes as string[] | string | undefined;
      const automationLevel = String(inputs.automationLevel || "standard").toLowerCase();
      const lightingType = String(inputs.lightingType || "led").toLowerCase();
      const operatingSchedule = String(inputs.operatingSchedule || "16_hour").toLowerCase();
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;

      // Base: 60 W/sqft for lighting-intensive farming
      const baseWPerSqft = lightingType.includes("led") ? 50 : 70;
      let basePeakKW = sqft * levels * (baseWPerSqft / 1000);

      // Lighting load percentage
      basePeakKW *= lightingLoadPercent / 100 + 0.3; // Min 30% for climate control

      // Farm type
      if (farmType.includes("cannabis") || farmType.includes("marijuana")) basePeakKW *= 1.4;
      if (farmType.includes("research")) basePeakKW *= 1.2;

      // Crop types affect climate needs
      const cropArray = Array.isArray(cropTypes)
        ? cropTypes
        : typeof cropTypes === "string"
          ? cropTypes.split(",").map((s) => s.trim())
          : [];
      if (
        cropArray.some(
          (c) => c.toLowerCase().includes("tomato") || c.toLowerCase().includes("pepper")
        )
      ) {
        basePeakKW *= 1.1; // Higher light needs
      }

      // Automation
      if (automationLevel.includes("high") || automationLevel.includes("robotic"))
        basePeakKW *= 1.15;

      // Operating schedule
      if (operatingSchedule.includes("24") || operatingSchedule.includes("continuous"))
        basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.9; // 90% diversity (continuous ops)
    }

    // ========================================================================
    // AGRICULTURAL: acres + ALL power-relevant fields
    // DB fields: totalAcres, irrigationType, majorEquipment, farmType,
    //   operatingHours, equipmentTier, hvacType, gridCapacity, needsBackupPower,
    //   backupPower, hasExistingSolar, existingSolarKW
    // ========================================================================
    else if (industry.includes("agricult")) {
      const acres = Number(inputs.totalAcres || 100);
      const irrigationType = String(inputs.irrigationType || "none").toLowerCase();
      const farmType = String(inputs.farmType || "mixed").toLowerCase();
      const majorEquipment = inputs.majorEquipment as string[] | string | undefined;
      const operatingHours = inputs.operatingHours || 10;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const needsBackupPower = Boolean(inputs.needsBackupPower);

      // Base kW per acre based on irrigation
      const kWPerAcre = irrigationType.includes("drip")
        ? 0.3
        : irrigationType.includes("center_pivot") || irrigationType.includes("sprinkler")
          ? 0.5
          : irrigationType.includes("flood")
            ? 0.2
            : 0.1;

      let basePeakKW = acres * kWPerAcre;

      // Farm type
      if (farmType.includes("dairy")) basePeakKW += 50; // Milking equipment
      if (farmType.includes("poultry")) basePeakKW += 30; // Ventilation
      if (farmType.includes("greenhouse")) basePeakKW += acres * 0.5; // Climate control

      // Major equipment
      const equipArray = Array.isArray(majorEquipment)
        ? majorEquipment
        : typeof majorEquipment === "string"
          ? majorEquipment.split(",").map((s) => s.trim())
          : [];
      const farmEquipPower: Record<string, number> = {
        grain_dryer: 100,
        cold_storage: 50,
        processing: 75,
        pump: 30,
        ventilation: 20,
      };
      equipArray.forEach((eq) => {
        const key = eq.toLowerCase().replace(/[^a-z_]/g, "_");
        basePeakKW += farmEquipPower[key] || 25;
      });

      // Backup power needs suggest critical loads
      if (needsBackupPower) basePeakKW *= 1.1;

      // Apply multipliers
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      estimatedPeakKW = basePeakKW * 0.7; // 70% diversity
    }

    // ========================================================================
    // TRUCK STOP: chargers + ALL power-relevant fields
    // DB fields: mcsChargers, dcfc350, level2, truckWashBays, serviceBays, peakDemandKW,
    //   gridCapacityKW, operatingHours, hasShowers, hasLaundry, existingSolarKW
    // ========================================================================
    else if (industry.includes("truck") && industry.includes("stop")) {
      // If peakDemandKW directly provided, use it
      if (inputs.peakDemandKW) {
        estimatedPeakKW = Number(inputs.peakDemandKW);
      } else {
        const mcsChargers = Number(inputs.mcsChargers || 0);
        // CRITICAL: dcfc350 = 350 kW DC Fast Chargers (question #13 in UI)
        const dcfc350Chargers = Number(inputs.dcfc350 || inputs.dcFastChargers || 0);
        const l2Chargers = Number(inputs.level2 || 0);
        const truckWash = Number(inputs.truckWashBays || 0);
        const serviceBays = Number(inputs.serviceBays || 0);
        const hasShowers = Boolean(inputs.hasShowers);
        const hasLaundry = Boolean(inputs.hasLaundry);
        const operatingHours = inputs.operatingHours || 24;

        let basePeakKW = 0;
        basePeakKW += mcsChargers * 1250; // MCS: 1.25 MW each (NEC 2023)
        basePeakKW += dcfc350Chargers * 350; // DCFC 350 kW each (CRITICAL FIX)
        basePeakKW += l2Chargers * 19.2; // Level 2: 19.2 kW (truck stop spec)
        basePeakKW += truckWash * 100;
        basePeakKW += serviceBays * 20;

        // Amenities
        if (hasShowers) basePeakKW += 30; // Water heating
        if (hasLaundry) basePeakKW += 20; // Commercial laundry

        basePeakKW *= getOperatingHoursFactor(operatingHours);
        basePeakKW += getExistingLoadAdjustment();

        // Apply diversity factor: 85% for truck stops (high simultaneous usage)
        estimatedPeakKW = basePeakKW * 0.85;
      }
    }

    // ========================================================================
    // MICROGRID: direct load + ALL power-relevant fields
    // DB fields: sitePeakLoad, criticalLoadPercent, microgridScale, connectedBuildings,
    //   existingCapacity, existingStorage, plannedSolar, plannedStorage, islandDuration,
    //   gridConnection, criticalLoads, primaryDriver, hvacType, equipmentTier, operatingHours
    // TRUEQUOTE™ FIXED: Jan 2026 - Added missing DB field readings
    // ========================================================================
    else if (industry.includes("microgrid")) {
      const sitePeakLoad = Number(inputs.sitePeakLoad || 0);
      const existingCapacity = Number(inputs.existingCapacity || 0);
      const criticalLoadPercent = Number(inputs.criticalLoadPercent || 50);
      const connectedBuildings = Number(inputs.connectedBuildings || 1);
      const microgridScale = String(inputs.microgridScale || "facility").toLowerCase();
      const microgridApplication = String(
        inputs.microgridApplication || inputs.primaryDriver || "resilience"
      ).toLowerCase();
      const _islandDuration = Number(inputs.islandDuration || 4); // hours needed
      const _plannedSolar = Number(inputs.plannedSolar || 0);
      const _plannedStorage = Number(inputs.plannedStorage || 0);
      const _existingStorage = Number(inputs.existingStorage || 0);
      const squareFeet = Number(inputs.squareFeet || 0);
      const criticalLoads = inputs.criticalLoads as string[] | string | undefined;
      const hvacType = inputs.hvacType as string | undefined;
      const equipmentTier = inputs.equipmentTier as string | undefined;
      const operatingHours = inputs.operatingHours || 24;

      // PRIORITY 1: If user provides peak load directly, use it
      let basePeakKW = 0;
      if (sitePeakLoad > 0) {
        basePeakKW = sitePeakLoad;
      } else if (existingCapacity > 0) {
        // Use existing infrastructure capacity as reference
        basePeakKW = existingCapacity;
      } else if (squareFeet > 0) {
        // Estimate from square footage (commercial building average: 15 W/sqft)
        basePeakKW = squareFeet * 0.015;
      } else {
        // Scale-based defaults (industry benchmarks)
        const scaleDefaults: Record<string, number> = {
          community: 500,
          campus: 2000,
          facility: 1000,
          commercial: 1500,
          industrial: 3000,
          utility: 10000,
        };
        basePeakKW = scaleDefaults[microgridScale] || 1000;
      }

      // Application affects sizing approach
      if (microgridApplication.includes("island") || microgridApplication.includes("off_grid")) {
        // Full island mode = 100% of peak load
        basePeakKW *= 1.0;
      } else if (
        microgridApplication.includes("resilience") ||
        microgridApplication.includes("backup")
      ) {
        // Resilience = critical loads only
        basePeakKW *= criticalLoadPercent / 100;
      } else if (
        microgridApplication.includes("cost") ||
        microgridApplication.includes("arbitrage")
      ) {
        // Cost optimization = partial load (peak shaving)
        basePeakKW *= 0.5;
      }

      // Critical loads array adds specific equipment
      const criticalArray = Array.isArray(criticalLoads)
        ? criticalLoads
        : typeof criticalLoads === "string"
          ? criticalLoads.split(",").map((s) => s.trim())
          : [];
      const criticalPower: Record<string, number> = {
        hvac: 100,
        refrigeration: 50,
        lighting: 30,
        security: 20,
        data_center: 200,
        elevator: 50,
        fire_safety: 25,
        communications: 15,
        water_treatment: 75,
        medical: 100,
      };
      criticalArray.forEach((load) => {
        const key = load.toLowerCase().replace(/[^a-z_]/g, "_");
        basePeakKW += criticalPower[key] || 25;
      });

      // Multi-building increases load (distribution losses + diversity)
      if (connectedBuildings > 1) {
        basePeakKW *= 1 + (connectedBuildings - 1) * 0.15;
      }

      // Apply standard multipliers
      basePeakKW *= getHvacMultiplier(hvacType);
      basePeakKW *= getEquipmentTierMultiplier(equipmentTier);
      basePeakKW *= getOperatingHoursFactor(operatingHours);
      basePeakKW += getExistingLoadAdjustment();

      // Microgrid = NO diversity factor (must handle full critical load)
      estimatedPeakKW = basePeakKW;
    }

    // ========================================================================
    // DEFAULT FALLBACK: businessSizeTier-based estimate
    // ========================================================================
    else {
      const tierDefaults: Record<string, number> = {
        small: 100,
        medium: 500,
        large: 2000,
        enterprise: 10000,
      };
      estimatedPeakKW = tierDefaults[state.businessSizeTier || "medium"] || 500;
    }

    // Ensure minimum reasonable value
    estimatedPeakKW = Math.max(50, estimatedPeakKW);

    // ========================================================================
    // TRUEQUOTE™ FINAL CHECK: Apply grid capacity ceiling
    // User can't draw more power than their grid connection allows
    // ========================================================================
    if (gridCapacityCeiling > 0 && estimatedPeakKW > gridCapacityCeiling) {
      if (import.meta.env.DEV) {
        console.warn(
          `[PowerGauge] ${industry}: Capped from ${Math.round(estimatedPeakKW)} kW to grid capacity ${gridCapacityCeiling} kW`
        );
      }
      estimatedPeakKW = gridCapacityCeiling;
    }

    // ========================================================================
    // TRUEQUOTE™ SANITY CHECK: Compare with bill estimate if available
    // If our calculation is wildly different from bill estimate, log warning
    // ========================================================================
    if (billEstimatedPeakKW > 0 && import.meta.env.DEV) {
      const ratio = estimatedPeakKW / billEstimatedPeakKW;
      if (ratio < 0.3 || ratio > 3.0) {
        console.warn(
          `[PowerGauge] ${industry}: Bill-based estimate ${billEstimatedPeakKW} kW differs significantly from calculated ${Math.round(estimatedPeakKW)} kW (ratio: ${ratio.toFixed(2)})`
        );
      }
    }

    // BESS sizing: typically 30-50% of peak demand for peak shaving
    const bessKW = estimatedPeakKW * 0.4;

    // DEV: Log power estimates for debugging
    if (import.meta.env.DEV && industry) {
      console.log("[PowerGauge] Estimated:", {
        industry,
        peakDemandKW: Math.round(estimatedPeakKW),
        bessKW: Math.round(bessKW),
        inputKeys: Object.keys(inputs),
        inputs: inputs,
      });
    }

    return {
      peakDemandKW: Math.round(estimatedPeakKW),
      bessKW: Math.round(bessKW),
      source: "estimate" as const,
    };
}
