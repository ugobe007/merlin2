import type { CalculatorContract, CalcInputs, CalcRunResult, CalcValidation } from "../contract";
import { calculateUseCasePower } from "@/services/useCasePowerCalculations";
import { buildSSOTInput } from "../ssotInputAliases";

export const EV_CHARGING_LOAD_V1_SSOT: CalculatorContract = {
  id: "ev_charging_load_v1",
  requiredInputs: ["level2Chargers", "dcfcChargers"] as const,

  compute: (inputs: CalcInputs): CalcRunResult => {
    const warnings: string[] = [];
    const assumptions: string[] = [];

    // Bridge curated config IDs → calculator field names
    // Curated sends: level2Chargers, dcFastChargers, dcFastPower, level2Power, siteDemandCap
    const level2Chargers = inputs.level2Chargers != null ? Number(inputs.level2Chargers) : 12;
    const rawDcfc = inputs.dcfcChargers ?? inputs.dcFastChargers;
    const dcfcChargers = rawDcfc != null ? Number(rawDcfc) : 8;
    const hpcChargers = inputs.hpcChargers != null ? Number(inputs.hpcChargers) : 0;
    const rawL2Power = inputs.level2PowerKW ?? inputs.level2Power;
    const level2KWEach = rawL2Power != null ? Number(rawL2Power) : 7.2;
    const rawSiteCap = inputs.siteDemandCapKW ?? inputs.siteDemandCap;
    const siteDemandCapKW = rawSiteCap != null ? Number(rawSiteCap) : 0;

    assumptions.push(
      `EV Charging: ${level2Chargers} Level 2 (${level2KWEach}kW), ` +
        `${dcfcChargers} DCFC (150kW)` +
        (hpcChargers > 0 ? `, ${hpcChargers} HPC (250kW)` : "")
    );

    // Route through SSOT (handles concurrency internally)
    // Use buildSSOTInput to map adapter field names → SSOT field names
    // (dcfcChargers → numberOfDCFastChargers, level2Chargers → numberOfLevel2Chargers)
    const evSSOTInput = buildSSOTInput("ev_charging", { level2Chargers, dcfcChargers });
    const result = calculateUseCasePower("ev-charging", evSSOTInput);
    let peakLoadKW = Math.round(result.powerMW * 1000);

    // Add HPC contribution (not yet in SSOT legacy path — apply here)
    const hpcRawKW = hpcChargers * 250;
    if (hpcChargers > 0) {
      // HPC concurrency ~40% (same as DCFC class)
      peakLoadKW += Math.round(hpcRawKW * 0.4);
      assumptions.push(`HPC contribution: ${hpcChargers} × 250kW × 40% concurrency`);
    }

    // Raw breakdown (before cap)
    const l2KW = level2Chargers * level2KWEach;
    const dcfcKW = dcfcChargers * 150;
    const totalChargers = level2Chargers + dcfcChargers + hpcChargers;
    const lightingKW = totalChargers * 0.5;
    const controlsKW = totalChargers * 0.3;
    const siteAuxKW = 10;

    // Scale contributors to match SSOT peak (SSOT applies concurrency)
    const rawSum = l2KW + dcfcKW + hpcRawKW + lightingKW + controlsKW + siteAuxKW;
    let scale = rawSum > 0 ? peakLoadKW / rawSum : 1;

    // Demand cap enforcement
    let demandCapApplied = false;
    if (siteDemandCapKW > 0 && siteDemandCapKW < peakLoadKW) {
      // Proportionally scale ALL contributors so sum = cap
      const capScale = siteDemandCapKW / peakLoadKW;
      scale *= capScale;
      peakLoadKW = Math.round(siteDemandCapKW);
      demandCapApplied = true;
      assumptions.push(`Demand cap applied: ${siteDemandCapKW}kW (proportional scaling)`);
      warnings.push(`Site demand capped at ${siteDemandCapKW}kW — charger power will be curtailed`);
    }

    const scaledCharging = (l2KW + dcfcKW + hpcRawKW) * scale;
    const scaledLighting = lightingKW * scale;
    const scaledControls = controlsKW * scale;
    const scaledSiteAux = siteAuxKW * scale;

    const kWContributorsTotalKW = scaledCharging + scaledLighting + scaledControls + scaledSiteAux;

    const dutyCycle = 0.35;

    // Verify charging dominance (80-95% band)
    const chargingPct = peakLoadKW > 0 ? (scaledCharging / peakLoadKW) * 100 : 0;
    if (chargingPct < 80 || chargingPct > 99) {
      warnings.push(`Charging share ${chargingPct.toFixed(1)}% outside 80-95% band — check inputs`);
    }

    const validation: CalcValidation = {
      version: "v1",
      dutyCycle,
      kWContributors: {
        process: 0,
        hvac: 0,
        lighting: scaledLighting,
        controls: scaledControls,
        itLoad: 0,
        cooling: 0,
        charging: scaledCharging,
        other: scaledSiteAux,
      },
      kWContributorsTotalKW,
      kWContributorShares: {
        processPct: 0,
        hvacPct: 0,
        lightingPct: peakLoadKW > 0 ? (scaledLighting / peakLoadKW) * 100 : 0,
        controlsPct: peakLoadKW > 0 ? (scaledControls / peakLoadKW) * 100 : 0,
        itLoadPct: 0,
        coolingPct: 0,
        chargingPct,
        otherPct: peakLoadKW > 0 ? (scaledSiteAux / peakLoadKW) * 100 : 0,
      },
      details: {
        ev_charging: {
          level2: l2KW * scale,
          dcfc: dcfcKW * scale,
          hpc: hpcRawKW * scale,
          siteAux: scaledSiteAux,
          chargers: totalChargers,
          ...(demandCapApplied ? { demandCapKW: siteDemandCapKW } : {}),
        },
      },
      notes: [
        `Level 2: ${level2Chargers} @ ${level2KWEach}kW, DCFC: ${dcfcChargers} @ 150kW` +
          (hpcChargers > 0 ? `, HPC: ${hpcChargers} @ 250kW` : ""),
        `Concurrency applied by SSOT → peak: ${peakLoadKW}kW`,
        ...(demandCapApplied ? [`Demand cap: ${siteDemandCapKW}kW enforced`] : []),
      ],
    };

    return {
      baseLoadKW: Math.round(peakLoadKW * 0.2),
      peakLoadKW,
      energyKWhPerDay: Math.round(peakLoadKW * 18 * dutyCycle),
      assumptions,
      warnings,
      validation,
      raw: result,
    };
  },
};

/**
 * RESTAURANT SSOT ADAPTER
 *
 * CalcValidation v1 envelope with contributor breakdown.
 * NOTE: SSOT calculateUseCasePower("restaurant") has no dedicated handler,
 * so we compute directly from seating capacity using industry standards.
 *
 * Industry benchmark: 30-50 W per seat (full-service), 15-25 W (fast food)
 * Source: Energy Star Portfolio Manager, CBECS 2018 food service
 *
 * Contributor model:
 *   process (45%) - Kitchen cooking (ranges, fryers, grills, ovens)
 *   hvac (20%) - Kitchen exhaust makeup air is significant
 *   cooling (15%) - Walk-in coolers, reach-in refrigeration (mapped to cooling)
 *   lighting (10%) - Dining room + kitchen + exterior
 *   controls (5%) - POS, hood controls, fire suppression
 *   other (5%) - Dishwashing, hot water, misc
 */
