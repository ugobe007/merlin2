import { useEffect, useState } from "react";
import { QuoteEngine } from "@/core/calculations";
import type { FinancialCalculationResult } from "@/services/centralizedCalculations";

interface SystemCalculationParams {
  storageSizeMW: number;
  durationHours: number;
  solarPVIncluded: boolean;
  solarCapacityKW: number;
  windTurbineIncluded: boolean;
  windCapacityKW: number;
  generatorIncluded: boolean;
  generatorCapacityKW: number;
  generatorFuelTypeSelected: string;
  fuelCellIncluded: boolean;
  fuelCellCapacityKW: number;
  fuelType: string;
  location: string;
  utilityRate: number;
  gridConnection: string;
  useCase: string;
  onSystemCostChange: (cost: number) => void;
}

/**
 * SYSTEM CALCULATION HOOK
 *
 * Custom hook for SSOT-compliant system calculations using QuoteEngine.
 * Orchestrates equipment costs and financial metrics calculation.
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1F, Feb 2026)
 *
 * @returns financialMetrics - Complete financial analysis
 * @returns isCalculating - Loading state
 */
export function useSystemCalculation(params: SystemCalculationParams) {
  const {
    storageSizeMW,
    durationHours,
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    generatorIncluded,
    generatorCapacityKW,
    generatorFuelTypeSelected,
    fuelCellIncluded,
    fuelCellCapacityKW,
    fuelType,
    location,
    utilityRate,
    gridConnection,
    useCase,
    onSystemCostChange,
  } = params;

  const [financialMetrics, setFinancialMetrics] = useState<FinancialCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ✅ SSOT: Use QuoteEngine.generateQuote() - THE TRUE SINGLE ENTRY POINT
  useEffect(() => {
    const calculateFromSSoT = async () => {
      // Guard: Don't calculate until user has configured BESS size
      if (storageSizeMW <= 0 || durationHours <= 0) {
        setFinancialMetrics(null);
        return;
      }

      setIsCalculating(true);
      try {
        // Calculate solar/wind/generator MW from kW if included
        const solarMWFromConfig = solarPVIncluded ? solarCapacityKW / 1000 : 0;
        const windMWFromConfig = windTurbineIncluded ? windCapacityKW / 1000 : 0;
        const generatorMWFromConfig = generatorIncluded ? generatorCapacityKW / 1000 : 0;
        const fuelCellMWFromConfig = fuelCellIncluded ? fuelCellCapacityKW / 1000 : 0;

        // Determine generator fuel type from unified selector
        const generatorFuelTypeForQuote =
          generatorFuelTypeSelected === "linear"
            ? ("natural-gas" as const)
            : (generatorFuelTypeSelected as "diesel" | "natural-gas" | "dual-fuel");

        // Map fuelType state to FuelCellType for SSOT
        const fuelCellTypeForQuote =
          fuelType === "natural-gas"
            ? ("natural-gas-fc" as const)
            : fuelType === "solid-oxide"
              ? ("solid-oxide" as const)
              : ("hydrogen" as const);

        // Map gridConnection to valid type
        const mappedGridConnection =
          gridConnection === "hybrid"
            ? "limited"
            : gridConnection === "ac-coupled" || gridConnection === "dc-coupled"
              ? "on-grid"
              : (gridConnection as "on-grid" | "off-grid" | "limited");

        // ✅ SINGLE SOURCE OF TRUTH: QuoteEngine.generateQuote()
        const quoteResult = await QuoteEngine.generateQuote({
          storageSizeMW,
          durationHours,
          solarMW: solarMWFromConfig,
          windMW: windMWFromConfig,
          generatorMW: generatorMWFromConfig,
          generatorFuelType: generatorFuelTypeForQuote,
          fuelCellMW: fuelCellMWFromConfig,
          fuelCellType: fuelCellTypeForQuote,
          location: location || "United States",
          electricityRate: utilityRate,
          gridConnection: mappedGridConnection,
          useCase: useCase,
        });

        // Map QuoteResult to FinancialCalculationResult for compatibility
        setFinancialMetrics({
          ...quoteResult.financials,
          equipmentCost: quoteResult.costs.equipmentCost,
          installationCost: quoteResult.costs.installationCost,
          shippingCost: 0,
          tariffCost: 0,
          totalProjectCost: quoteResult.costs.totalProjectCost,
          taxCredit: quoteResult.costs.taxCredit,
          netCost: quoteResult.costs.netCost,
        } as FinancialCalculationResult);

        // Notify parent component
        onSystemCostChange(quoteResult.costs.totalProjectCost);
      } catch (error) {
        console.error("❌ Error calculating from SSOT:", error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateFromSSoT();
  }, [
    storageSizeMW,
    durationHours,
    solarPVIncluded,
    solarCapacityKW,
    windTurbineIncluded,
    windCapacityKW,
    generatorIncluded,
    generatorCapacityKW,
    generatorFuelTypeSelected,
    fuelCellIncluded,
    fuelCellCapacityKW,
    fuelType,
    location,
    utilityRate,
    gridConnection,
    useCase,
    onSystemCostChange,
  ]);

  return { financialMetrics, isCalculating };
}
