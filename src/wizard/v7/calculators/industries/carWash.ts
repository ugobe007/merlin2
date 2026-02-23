import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const CAR_WASH_LOAD_V1_SSOT: CalculatorContract = {
  id: "car_wash_load_v1",
  requiredInputs: ["bayTunnelCount", "averageWashesPerDay", "operatingHours"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // 1. Parse combined bayTunnelCount field (handles both formats)
    const parseBayTunnel = (combined: unknown): number => {
      // Handle plain number (from template: bay_count → number)
      const asNum = Number(combined);
      if (!isNaN(asNum) && asNum > 0) return Math.round(asNum);
      // Handle formatted string (from database: "4 bays, 1 tunnel")
      const str = String(combined || "4 bays");
      const bayMatch = str.match(/(\d+)\s*bay/i);
      const tunnelMatch = str.match(/(\d+)\s*tunnel/i);
      return (
        (bayMatch ? parseInt(bayMatch[1]) : 0) || (tunnelMatch ? parseInt(tunnelMatch[1]) : 0) || 1
      );
    };

    // Bridge curated config IDs → calculator field names
    // Curated sends: tunnelOrBayCount, dailyVehicles, facilityType, operatingHours
    const rawBayTunnel = inputs.bayTunnelCount ?? inputs.tunnelOrBayCount;
    const bayTunnelStr = String(rawBayTunnel || "4 bays");
    const bayCount = parseBayTunnel(rawBayTunnel);
    const _rawCarsPerDay = inputs.averageWashesPerDay ?? inputs.dailyVehicles;
    const carsPerDay = _rawCarsPerDay != null ? (Number(_rawCarsPerDay) || 200) : 200;
    const _rawOpHours = inputs.operatingHours;
    const operatingHours = _rawOpHours != null ? (Number(_rawOpHours) || 12) : 12;
    // Curated facilityType values: express_tunnel, mini_tunnel, in_bay_automatic, self_serve
    // Calculator expects: tunnel, automatic, selfService, fullService
    const rawWashType = String(inputs.carWashType ?? inputs.facilityType ?? "tunnel");
    const WASH_TYPE_MAP: Record<string, string> = {
      express_tunnel: "tunnel",
      mini_tunnel: "tunnel",
      tunnel: "tunnel",
      in_bay_automatic: "automatic",
      automatic: "automatic",
      self_serve: "selfService",
      selfService: "selfService",
      full_service: "fullService",
      fullService: "fullService",
    };
    const carWashType = WASH_TYPE_MAP[rawWashType] || rawWashType;
    const primaryEquipment = Array.isArray(inputs.primaryEquipment) ? inputs.primaryEquipment : [];

    // 2. Map to SSOT parameters (use buildSSOTInput for field name safety)
    const useCaseData = buildSSOTInput("car_wash", { bayTunnelCount: bayCount });
    // Pass through extra fields SSOT may read
    Object.assign(useCaseData, {
      carsPerDay,
      operatingHours,
      carWashType,
      primaryEquipment,
    });

    assumptions.push(`Wash positions: ${bayTunnelStr} (${bayCount} total)`);
    assumptions.push(`Washes/day: ${carsPerDay}`);
    assumptions.push(`Operating hours: ${operatingHours}h/day`);

    // 3. Delegate to SSOT (NO calculation logic here!)
    const result = calculateUseCasePower("car-wash", useCaseData);

    // 4. Convert to contract format
    const powerKW = result.powerMW * 1000;
    const peakLoadKW = Math.round(powerKW);

    // 4a. Compute contributor breakdown (industry-standard ratios)
    // Source: NREL Commercial Building benchmarks + car wash industry standards
    const dryersKW = peakLoadKW * 0.625; // 62.5% - Blowers/dryers (dominant load)
    const waterPumpsKW = peakLoadKW * 0.208; // 20.8% - High-pressure wash pumps
    const vacuumsKW = peakLoadKW * 0.083; // 8.3% - Self-serve vacuum stations
    const lightingKW = peakLoadKW * 0.042; // 4.2% - Facility lighting
    const hvacKW = peakLoadKW * 0.021; // 2.1% - Climate control
    const controlsKW = peakLoadKW * 0.021; // 2.1% - PLC/controls/payment systems
    const otherKW = 0; // 0% - Miscellaneous

    const kWContributorsTotalKW =
      dryersKW + waterPumpsKW + vacuumsKW + lightingKW + hvacKW + controlsKW + otherKW;

    // Validate sum matches peak (within 1% tolerance)
    const sumDiff = Math.abs(kWContributorsTotalKW - peakLoadKW);
    if (sumDiff / peakLoadKW > 0.01) {
      warnings.push(
        `⚠️ Contributors sum (${kWContributorsTotalKW.toFixed(1)}kW) ` +
          `doesn't match peak (${peakLoadKW}kW) - diff: ${sumDiff.toFixed(1)}kW`
      );
    }

    // Base load = always-on contributors (lights, HVAC, controls)
    const baseLoadKW = Math.round(lightingKW + hvacKW + controlsKW);

    // Duty cycle: intermittent loads (not all equipment runs simultaneously)
    const dutyCycle = 0.6; // 60% typical for car wash (wash cycles + idle time)
    const energyKWhPerDay = Math.round(peakLoadKW * operatingHours * dutyCycle);

    // 4b. Build computed object with kWContributors (TrueQuote compliance)
    const _computed = {
      kWContributors: {
        drying: dryersKW, // Match harness invariant key name
        waterPumps: waterPumpsKW, // Match harness invariant key name
        vacuums: vacuumsKW,
        lighting: lightingKW,
        hvac: hvacKW,
        controls: controlsKW,
        other: otherKW,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        dryingPct: (dryersKW / peakLoadKW) * 100,
        waterPumpsPct: (waterPumpsKW / peakLoadKW) * 100,
        vacuumsPct: (vacuumsKW / peakLoadKW) * 100,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        hvacPct: (hvacKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      dutyCycle,
      assumptions,
      warnings,
    };

    // 4c. Build validation envelope with canonical contributor keys (TrueQuote compliance)
    // Car wash process loads: drying (blowers) + waterPumps (wash system) + vacuums
    const processKW = dryersKW + waterPumpsKW + vacuumsKW;

    const validation: CalcValidation = {
      version: "v1", // Versioned contract (prevents silent drift)
      dutyCycle,
      kWContributors: {
        process: processKW, // Canonical: car wash-specific loads (dryers+pumps+vacuums)
        hvac: hvacKW, // Canonical: climate control
        lighting: lightingKW, // Canonical: facility lighting
        controls: controlsKW, // Canonical: PLC/payment/controls
        itLoad: 0, // Canonical: IT equipment (not applicable)
        cooling: 0, // Canonical: dedicated cooling (not applicable)
        charging: 0, // Canonical: EV charging (not applicable)
        other: otherKW, // Canonical: miscellaneous
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: (processKW / peakLoadKW) * 100,
        hvacPct: (hvacKW / peakLoadKW) * 100,
        lightingPct: (lightingKW / peakLoadKW) * 100,
        controlsPct: (controlsKW / peakLoadKW) * 100,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct: 0,
        otherPct: (otherKW / peakLoadKW) * 100,
      },
      details: {
        car_wash: {
          dryers: dryersKW,
          pumps: waterPumpsKW,
          vacuums: vacuumsKW,
        },
      },
      notes: [
        `Process breakdown: dryers=${dryersKW.toFixed(1)}kW (${((dryersKW / peakLoadKW) * 100).toFixed(0)}%), pumps=${waterPumpsKW.toFixed(1)}kW (${((waterPumpsKW / peakLoadKW) * 100).toFixed(0)}%), vacuums=${vacuumsKW.toFixed(1)}kW (${((vacuumsKW / peakLoadKW) * 100).toFixed(0)}%)`,
      ],
    };

    return {
      baseLoadKW,
      peakLoadKW,
      energyKWhPerDay,
      assumptions,
      warnings,
      validation, // TrueQuote validation envelope (namespaced, clean)
      raw: result,
    };
  },
};

/**
 * OFFICE SSOT ADAPTER
 *
 * Template-backed (office.v1.json) with additive loads.
 * SSOT: calculateUseCasePower("office", ...) → 6 W/sqft base (ASHRAE 90.1)
 *
 * Base power from SSOT (sqft-driven), then enriched with:
 * - Server room IT load (additive)
 * - Elevator demand (additive)
 * - EV charger load (additive)
 * - Lighting type modifier (LED reduces lighting share)
 * - Office type modifier (tech offices have higher plug loads)
 *
 * Contributor model (CBECS 2018 commercial office):
 *   hvac (40% base) - Primary load, affected by HVAC age
 *   lighting (25% base, reduced if LED) - Overhead + task
 *   process (20% base, elevated for tech) - Plug loads (computers, monitors)
 *   itLoad - Server room (additive, not percentage-based)
 *   controls (5%) - BMS, security, fire panel
 *   charging - EV chargers (additive)
 *   other - Elevators + common areas (additive + remainder)
 */
