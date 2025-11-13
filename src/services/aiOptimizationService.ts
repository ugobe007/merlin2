/**
 * AI Optimization Service
 * 
 * Provides intelligent configuration suggestions using centralized calculations.
 * This ensures AI recommendations are CONSISTENT with wizard calculations.
 * 
 * Key Principle: AI uses the SAME database-driven calculations as the wizard,
 * not separate hardcoded formulas.
 */

import { calculateFinancialMetrics } from './centralizedCalculations';
import { calculateDatabaseBaseline } from './baselineService';

export interface AIOptimizationInput {
  storageSizeMW: number;
  durationHours: number;
  useCase: string;
  location?: string;
  electricityRate?: number;
  solarMW?: number;
  windMW?: number;
  useCaseData?: Record<string, any>; // EV charger counts, hotel rooms, etc.
}

export interface AIOptimizationSuggestion {
  storageSizeMW: number;
  durationHours: number;
  reasoning: string;
  costImpact: string; // e.g., "Saves $3.2M" or "Adds $1.5M"
  roiImpact: string; // e.g., "Improves payback by 0.8 years"
  confidence: 'high' | 'medium' | 'low';
}

export interface AIOptimizationResult {
  isOptimal: boolean;
  currentMetrics?: {
    totalCost: number;
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
  };
  suggestion?: AIOptimizationSuggestion;
  benchmarkComparison?: {
    percentile: number; // 0-100
    comparison: string; // e.g., "Top 20% for similar facilities"
  };
}

/**
 * Analyze current configuration and provide AI optimization suggestions
 * 
 * Uses centralized calculations to ensure consistency with wizard
 */
export async function getAIOptimization(
  input: AIOptimizationInput
): Promise<AIOptimizationResult> {
  try {
    console.log('🤖 AI Optimization analyzing configuration...', input);

    // DON'T recalculate baseline - the user's storageSizeMW was already correctly 
    // calculated based on their inputs (e.g., 150 rooms for hotels)
    // If we recalculate here with scale=1.0, we'd use wrong assumptions
    
    // Instead, treat the CURRENT config as the baseline to optimize FROM
    // We're looking for improvements to THEIR chosen size, not comparing to a generic baseline

    // Calculate metrics for current configuration
    const currentMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    console.log('💰 Current config metrics:', currentMetrics);

    // Test alternative configurations for optimization opportunities
    // 1. Try increasing duration for better ROI
    const longerDurationMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours + 2,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    // 2. Try increasing power for better coverage
    const largerSizeMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW * 1.2,
      durationHours: input.durationHours,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    console.log('📈 Alternative config metrics:', { longerDurationMetrics, largerSizeMetrics });

    // Find best alternative (shortest payback or highest ROI)
    let bestAlternative = currentMetrics;
    let bestConfig = { storageSizeMW: input.storageSizeMW, durationHours: input.durationHours };
    let improvement = '';

    if (longerDurationMetrics.paybackYears < currentMetrics.paybackYears - 0.3) {
      bestAlternative = longerDurationMetrics;
      bestConfig = { storageSizeMW: input.storageSizeMW, durationHours: input.durationHours + 2 };
      improvement = 'longer duration';
    }

    if (largerSizeMetrics.roi10Year > currentMetrics.roi10Year * 1.15) {
      if (!improvement || largerSizeMetrics.paybackYears < bestAlternative.paybackYears) {
        bestAlternative = largerSizeMetrics;
        bestConfig = { storageSizeMW: input.storageSizeMW * 1.2, durationHours: input.durationHours };
        improvement = 'larger capacity';
      }
    }

    // Determine if current config is optimal (no better alternative found)
    const isOptimal = !improvement;

    if (isOptimal) {
      console.log('✅ Configuration is already optimal!');
      return {
        isOptimal: true,
        currentMetrics: {
          totalCost: currentMetrics.netCost,
          annualSavings: currentMetrics.annualSavings,
          paybackYears: currentMetrics.paybackYears,
          roi10Year: currentMetrics.roi10Year
        },
        benchmarkComparison: calculateBenchmarkPercentile(currentMetrics, input.useCase)
      };
    }

    // Generate optimization suggestion based on best alternative found
    const roiDiff = currentMetrics.paybackYears - bestAlternative.paybackYears;
    const costDiff = bestAlternative.netCost - currentMetrics.netCost;
    
    const suggestion: AIOptimizationSuggestion = {
      storageSizeMW: bestConfig.storageSizeMW,
      durationHours: bestConfig.durationHours,
      reasoning: `By ${improvement}, you could improve your ROI by ${Math.abs(roiDiff).toFixed(1)} years payback time`,
      costImpact: formatCostImpact(costDiff),
      roiImpact: formatROIImpact(roiDiff),
      confidence: 'medium' as const
    };

    console.log('💡 AI Suggestion:', suggestion);

    return {
      isOptimal: false,
      currentMetrics: {
        totalCost: currentMetrics.netCost,
        annualSavings: currentMetrics.annualSavings,
        paybackYears: currentMetrics.paybackYears,
        roi10Year: currentMetrics.roi10Year
      },
      suggestion,
      benchmarkComparison: calculateBenchmarkPercentile(currentMetrics, input.useCase)
    };

  } catch (error) {
    console.error('❌ AI Optimization error:', error);
    // Return neutral result on error
    return {
      isOptimal: true, // Don't confuse user with suggestions if analysis fails
    };
  }
}

/**
 * Generate human-readable reasoning for suggestion
 */
function generateReasoning(
  current: AIOptimizationInput,
  baseline: any,
  currentMetrics: any,
  baselineMetrics: any,
  roiDiff: number
): string {
  const isOversized = current.storageSizeMW > baseline.powerMW;
  const isUndersized = current.storageSizeMW < baseline.powerMW;
  const sizeDiff = Math.abs(current.storageSizeMW - baseline.powerMW);

  if (isOversized && roiDiff > 0.5) {
    return `Your ${current.storageSizeMW}MW configuration is oversized for this use case. Reducing to ${baseline.powerMW}MW would save $${(Math.abs(currentMetrics.netCost - baselineMetrics.netCost) / 1000000).toFixed(1)}M in upfront cost while maintaining similar revenue, improving payback by ${Math.abs(roiDiff).toFixed(1)} years.`;
  }

  if (isUndersized) {
    return `Your ${current.storageSizeMW}MW configuration may be undersized. Increasing to ${baseline.powerMW}MW would add $${((currentMetrics.netCost - baselineMetrics.netCost) / 1000000).toFixed(1)}M cost but generate $${((baselineMetrics.annualSavings - currentMetrics.annualSavings) / 1000).toFixed(0)}K more annual revenue, improving overall ROI.`;
  }

  if (current.durationHours !== baseline.durationHrs) {
    return `Adjusting duration from ${current.durationHours}hr to ${baseline.durationHrs}hr would better match industry standards for ${current.useCase}, optimizing the power-to-energy ratio for maximum efficiency.`;
  }

  return `The ${baseline.powerMW}MW / ${baseline.durationHrs}hr configuration is optimized based on ${current.useCase} industry benchmarks, providing the best balance of cost, revenue, and ROI.`;
}

/**
 * Format cost impact as readable string
 */
function formatCostImpact(costDiff: number): string {
  const absDiff = Math.abs(costDiff);
  const millions = (absDiff / 1000000).toFixed(1);

  if (costDiff > 0) {
    return `Adds $${millions}M to project cost`;
  } else if (costDiff < 0) {
    return `Saves $${millions}M in project cost`;
  } else {
    return 'Similar project cost';
  }
}

/**
 * Format ROI impact as readable string
 */
function formatROIImpact(roiDiff: number): string {
  const absDiff = Math.abs(roiDiff).toFixed(1);

  if (roiDiff > 0.3) {
    return `Improves payback by ${absDiff} years`;
  } else if (roiDiff < -0.3) {
    return `Extends payback by ${absDiff} years`;
  } else {
    return 'Similar payback period';
  }
}

/**
 * Determine confidence level in suggestion
 */
function determineConfidence(sizeDiffPercent: number, roiDiff: number): 'high' | 'medium' | 'low' {
  if (sizeDiffPercent > 50 || Math.abs(roiDiff) > 2) {
    return 'high'; // Large differences = high confidence suggestion is beneficial
  } else if (sizeDiffPercent > 25 || Math.abs(roiDiff) > 1) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Calculate percentile ranking compared to industry benchmarks
 */
function calculateBenchmarkPercentile(
  metrics: any,
  useCase: string
): { percentile: number; comparison: string } {
  // Simplified percentile calculation based on ROI
  // In production, this would compare against historical data
  const roi10Year = metrics.roi10Year;
  const paybackYears = metrics.paybackYears;

  let percentile = 50; // Default to median

  // Excellent performance
  if (roi10Year > 150 && paybackYears < 4) {
    percentile = 90;
  } else if (roi10Year > 120 && paybackYears < 5) {
    percentile = 75;
  } else if (roi10Year > 100 && paybackYears < 6) {
    percentile = 60;
  } else if (roi10Year < 80 || paybackYears > 7) {
    percentile = 30;
  }

  let comparison = '';
  if (percentile >= 80) {
    comparison = `Top ${100 - percentile}% for ${useCase} installations`;
  } else if (percentile >= 60) {
    comparison = `Above average for ${useCase} installations`;
  } else if (percentile >= 40) {
    comparison = `Average performance for ${useCase} installations`;
  } else {
    comparison = `Below average for ${useCase} installations`;
  }

  return { percentile, comparison };
}

/**
 * Quick validation check - returns simple yes/no if config is reasonable
 */
export async function validateConfiguration(
  input: AIOptimizationInput
): Promise<{ isValid: boolean; warning?: string }> {
  try {
    const baseline = await calculateDatabaseBaseline(input.useCase, 1.0, input.useCaseData);
    const sizeDiffPercent = Math.abs((input.storageSizeMW - baseline.powerMW) / baseline.powerMW) * 100;

    if (sizeDiffPercent > 100) {
      return {
        isValid: false,
        warning: `⚠️ Configuration is ${sizeDiffPercent.toFixed(0)}% different from industry standard. Consider using the recommended ${baseline.powerMW}MW size.`
      };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: true }; // Don't block on validation errors
  }
}
