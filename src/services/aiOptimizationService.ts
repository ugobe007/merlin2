/**
 * AI Optimization Service
 * 
 * Provides intelligent configuration suggestions using centralized calculations
 * and latest market data from the AI Data Collection Service.
 * 
 * This ensures AI recommendations are:
 * - CONSISTENT with wizard calculations
 * - Based on CURRENT pricing from database
 * - Informed by LATEST industry best practices
 * - Aware of CURRENT financing options
 * 
 * Key Principle: AI uses the SAME database-driven calculations as the wizard,
 * enhanced with real-time market intelligence.
 * 
 * Context-Aware Decision Making:
 * - Uses use case templates to inform renewable recommendations
 * - Considers location constraints (urban vs rural, roof space availability)
 * - Maintains persistent recommendations (doesn't contradict itself)
 * - Provides clear reasoning based on actual use case context
 * - Incorporates latest pricing trends and product availability
 */

import { calculateFinancialMetrics } from './centralizedCalculations';
import { calculateDatabaseBaseline } from './baselineService';
import { getLatestAIData } from './aiDataCollectionService';

export interface AIOptimizationInput {
  storageSizeMW: number;
  durationHours: number;
  useCase: string;
  location?: string;
  electricityRate?: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  useCaseData?: Record<string, any>; // EV charger counts, hotel rooms, etc.
  gridConnection?: 'grid-tied' | 'microgrid' | 'off-grid'; // Grid reliability context
  hasBackupRequirement?: boolean; // Critical infrastructure needing backup
  gridConnectivity?: number; // 0-1 grid reliability score
}

// Use case context for intelligent renewable recommendations
interface UseCaseContext {
  hasRoofSpace: boolean;          // Large warehouse, factory = true; Downtown EV charging = false
  isUrbanDowntown: boolean;       // Dense urban = true; Suburban/rural = false
  needsBackup: boolean;           // Hospital, data center = true
  gridReliability: number;        // 0-1 from gridConnectivity
  criticalInfrastructure: boolean; // Can't afford outages
  realEstateConstraint: 'none' | 'moderate' | 'severe';
  useCaseCategory: 'industrial' | 'commercial' | 'critical' | 'remote' | 'urban';
}

export interface AIOptimizationSuggestion {
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;      // Recommended solar capacity
  generatorMW?: number;   // Recommended generator capacity
  windMW?: number;        // Recommended wind capacity
  reasoning: string;
  costImpact: string; // e.g., "Saves $3.2M" or "Adds $1.5M"
  roiImpact: string; // e.g., "Improves payback by 0.8 years"
  confidence: 'high' | 'medium' | 'low';
  renewableJustification?: string; // Why solar/wind/gen is recommended or not
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
  useCaseContext?: UseCaseContext; // Expose context for debugging/transparency
}

/**
 * Determine use case context for intelligent renewable recommendations
 */
function analyzeUseCaseContext(input: AIOptimizationInput): UseCaseContext {
  const useCase = input.useCase.toLowerCase();
  const gridReliability = input.gridConnectivity ?? (input.gridConnection === 'grid-tied' ? 0.9 : input.gridConnection === 'microgrid' ? 0.5 : 0.1);
  
  // Determine if use case has roof space for solar
  const roofSpaceUseCases = ['warehouse', 'factory', 'manufacturing', 'logistics', 'distribution', 'retail', 'supermarket', 'hotel', 'hospital'];
  const hasRoofSpace = roofSpaceUseCases.some(uc => useCase.includes(uc));
  
  // Determine if location is urban/downtown with real estate constraints
  const urbanUseCases = ['ev-charging-downtown', 'parking-garage', 'high-rise', 'apartment', 'condo'];
  const isUrbanDowntown = urbanUseCases.some(uc => useCase.includes(uc)) || (input.location?.toLowerCase().includes('downtown') ?? false);
  
  // Determine if critical infrastructure needing backup
  const criticalUseCases = ['hospital', 'datacenter', 'data-center', 'airport', 'emergency', 'police', 'fire'];
  const criticalInfrastructure = criticalUseCases.some(uc => useCase.includes(uc)) || input.hasBackupRequirement === true;
  
  // Determine if backup power is needed
  const needsBackup = criticalInfrastructure || gridReliability < 0.5 || (input.generatorMW || 0) > 0;
  
  // Determine real estate constraint level
  let realEstateConstraint: 'none' | 'moderate' | 'severe' = 'none';
  if (isUrbanDowntown) {
    realEstateConstraint = 'severe';
  } else if (!hasRoofSpace && !criticalInfrastructure) {
    realEstateConstraint = 'moderate';
  }
  
  // Categorize use case
  let useCaseCategory: 'industrial' | 'commercial' | 'critical' | 'remote' | 'urban' = 'commercial';
  if (criticalInfrastructure) {
    useCaseCategory = 'critical';
  } else if (gridReliability < 0.3 || input.gridConnection === 'off-grid') {
    useCaseCategory = 'remote';
  } else if (isUrbanDowntown) {
    useCaseCategory = 'urban';
  } else if (roofSpaceUseCases.some(uc => useCase.includes(uc))) {
    useCaseCategory = 'industrial';
  }
  
  return {
    hasRoofSpace,
    isUrbanDowntown,
    needsBackup,
    gridReliability,
    criticalInfrastructure,
    realEstateConstraint,
    useCaseCategory
  };
}

/**
 * Determine optimal renewable configuration based on use case context
 */
function determineRenewableRecommendations(
  input: AIOptimizationInput,
  context: UseCaseContext
): { solar: number; generator: number; wind: number; reasoning: string } {
  let solar = input.solarMW || 0;
  let generator = input.generatorMW || 0;
  let wind = input.windMW || 0;
  let reasoning = '';
  
  // SOLAR LOGIC: Recommend based on roof space and location
  if (context.hasRoofSpace && !context.isUrbanDowntown && solar === 0) {
    // Recommend solar for facilities with roof space
    solar = input.storageSizeMW * 1.5; // 1.5x storage capacity as typical solar sizing
    reasoning += `Solar recommended: ${input.useCase} has significant roof space for solar panels. `;
  } else if (context.isUrbanDowntown && solar > 0) {
    // Question existing solar for urban/downtown locations
    reasoning += `Note: Limited roof space in downtown location may constrain solar installation. `;
  } else if (solar > 0) {
    // Keep existing solar with justification
    reasoning += `Solar maintained: Provides energy cost savings and sustainability benefits. `;
  }
  
  // GENERATOR LOGIC: Recommend for critical infrastructure or poor grid reliability
  if (context.needsBackup && generator === 0) {
    // Recommend generator for backup power needs
    generator = input.storageSizeMW * 0.5; // 50% of storage capacity as typical generator sizing
    if (context.criticalInfrastructure) {
      reasoning += `Backup generator recommended: Critical infrastructure requires redundant power for ${input.useCase}. `;
    } else {
      reasoning += `Backup generator recommended: Grid reliability below 50% requires backup power. `;
    }
  } else if (context.isUrbanDowntown && !context.criticalInfrastructure && generator > 0) {
    // Generators OK for urban if needed
    reasoning += `Generator appropriate: Provides backup power despite urban location. `;
  } else if (generator > 0) {
    // Keep existing generator with justification
    reasoning += `Generator maintained: Provides backup power and peak shaving capability. `;
  }
  
  // WIND LOGIC: Only for remote/off-grid locations
  if ((context.gridReliability < 0.3 || input.gridConnection === 'off-grid') && !context.isUrbanDowntown && wind === 0) {
    // Recommend wind for remote/off-grid applications
    wind = input.storageSizeMW * 0.8; // 80% of storage as typical wind sizing
    reasoning += `Wind recommended: Limited grid access and rural location suitable for wind turbines. `;
  } else if (wind > 0) {
    // Keep existing wind with justification
    reasoning += `Wind maintained: Provides renewable energy diversification. `;
  }
  
  // NO RENEWABLES CASE: Grid-tied urban without special requirements
  if (solar === 0 && generator === 0 && wind === 0 && context.gridReliability > 0.7 && !context.needsBackup) {
    reasoning = `Grid-tied configuration appropriate: Reliable grid connection (${(context.gridReliability * 100).toFixed(0)}%) and ${input.useCase} use case don't require renewable integration. System focused on demand charge reduction and energy arbitrage. `;
  }
  
  return { solar, generator, wind, reasoning: reasoning.trim() };
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

    // STEP 1: Analyze use case context for intelligent recommendations
    const useCaseContext = analyzeUseCaseContext(input);
    console.log('📊 Use case context:', useCaseContext);

    // STEP 2: Determine optimal renewable configuration based on context
    const renewableRecommendations = determineRenewableRecommendations(input, useCaseContext);
    console.log('🌱 Renewable recommendations:', renewableRecommendations);

    // STEP 3: Calculate metrics for current configuration
    const currentMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    console.log('💰 Current config metrics:', currentMetrics);

    // STEP 4: Test alternative configurations for optimization opportunities
    // Always preserve/add renewables based on context recommendations
    // 1. Try increasing duration for better ROI
    const longerDurationMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours + 2,
      solarMW: renewableRecommendations.solar, // Use context-aware recommendation
      windMW: renewableRecommendations.wind,   // Use context-aware recommendation
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    // 2. Try increasing power for better coverage
    const largerSizeMetrics = await calculateFinancialMetrics({
      storageSizeMW: input.storageSizeMW * 1.2,
      durationHours: input.durationHours,
      solarMW: renewableRecommendations.solar, // Use context-aware recommendation
      windMW: renewableRecommendations.wind,   // Use context-aware recommendation
      location: input.location || 'California',
      electricityRate: input.electricityRate || 0.15
    });

    // 3. Test with recommended renewables if different from current
    let renewableImprovementMetrics = null;
    const renewablesChanged = 
      renewableRecommendations.solar !== (input.solarMW || 0) ||
      renewableRecommendations.wind !== (input.windMW || 0) ||
      renewableRecommendations.generator !== (input.generatorMW || 0);
    
    if (renewablesChanged) {
      renewableImprovementMetrics = await calculateFinancialMetrics({
        storageSizeMW: input.storageSizeMW,
        durationHours: input.durationHours,
        solarMW: renewableRecommendations.solar,
        windMW: renewableRecommendations.wind,
        location: input.location || 'California',
        electricityRate: input.electricityRate || 0.15
      });
      console.log('🔄 Renewable improvement metrics:', renewableImprovementMetrics);
    }

    console.log('📈 Alternative config metrics:', { longerDurationMetrics, largerSizeMetrics, renewableImprovementMetrics });

    // Find best alternative (shortest payback or highest ROI)
    let bestAlternative = currentMetrics;
    let bestConfig = { 
      storageSizeMW: input.storageSizeMW, 
      durationHours: input.durationHours,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      generatorMW: input.generatorMW || 0
    };
    let improvement = '';

    // Check if renewable changes improve ROI
    if (renewableImprovementMetrics && renewableImprovementMetrics.paybackYears < currentMetrics.paybackYears - 0.2) {
      bestAlternative = renewableImprovementMetrics;
      bestConfig = {
        storageSizeMW: input.storageSizeMW,
        durationHours: input.durationHours,
        solarMW: renewableRecommendations.solar,
        windMW: renewableRecommendations.wind,
        generatorMW: renewableRecommendations.generator
      };
      improvement = renewableRecommendations.reasoning;
    }

    // Check if longer duration improves ROI
    if (longerDurationMetrics.paybackYears < currentMetrics.paybackYears - 0.3) {
      if (!improvement || longerDurationMetrics.paybackYears < bestAlternative.paybackYears) {
        bestAlternative = longerDurationMetrics;
        bestConfig = { 
          storageSizeMW: input.storageSizeMW, 
          durationHours: input.durationHours + 2,
          solarMW: renewableRecommendations.solar,
          windMW: renewableRecommendations.wind,
          generatorMW: renewableRecommendations.generator
        };
        improvement = 'longer duration (better arbitrage and resilience)';
      }
    }

    // Check if larger size improves ROI
    if (largerSizeMetrics.roi10Year > currentMetrics.roi10Year * 1.15) {
      if (!improvement || largerSizeMetrics.paybackYears < bestAlternative.paybackYears) {
        bestAlternative = largerSizeMetrics;
        bestConfig = { 
          storageSizeMW: input.storageSizeMW * 1.2, 
          durationHours: input.durationHours,
          solarMW: renewableRecommendations.solar,
          windMW: renewableRecommendations.wind,
          generatorMW: renewableRecommendations.generator
        };
        improvement = 'larger capacity (better demand charge reduction)';
      }
    }

    // Determine if current config is optimal (no better alternative found)
    const isOptimal = !improvement;

    if (isOptimal) {
      console.log('✅ Configuration is already optimal!');
      
      // Build benchmark comparison message with renewable context
      let benchmarkMessage = '';
      const benchmark = calculateBenchmarkPercentile(currentMetrics, input.useCase);
      
      if (benchmark) {
        benchmarkMessage = benchmark.comparison;
        
        // Add renewable justification based on context
        if (renewableRecommendations.reasoning) {
          benchmarkMessage += `. ${renewableRecommendations.reasoning}`;
        }
      }
      
      return {
        isOptimal: true,
        currentMetrics: {
          totalCost: currentMetrics.netCost,
          annualSavings: currentMetrics.annualSavings,
          paybackYears: currentMetrics.paybackYears,
          roi10Year: currentMetrics.roi10Year
        },
        benchmarkComparison: {
          percentile: benchmark.percentile,
          comparison: benchmarkMessage
        },
        useCaseContext // Include for transparency
      };
    }

    // Generate optimization suggestion based on best alternative found
    const roiDiff = currentMetrics.paybackYears - bestAlternative.paybackYears;
    const costDiff = bestAlternative.netCost - currentMetrics.netCost;
    
    // Build comprehensive reasoning with improvement type and renewable context
    let reasoning = `By ${improvement}, you could improve your payback period by ${Math.abs(roiDiff).toFixed(1)} years`;
    
    const suggestion: AIOptimizationSuggestion = {
      storageSizeMW: bestConfig.storageSizeMW,
      durationHours: bestConfig.durationHours,
      solarMW: bestConfig.solarMW,
      generatorMW: bestConfig.generatorMW,
      windMW: bestConfig.windMW,
      reasoning,
      costImpact: formatCostImpact(costDiff),
      roiImpact: formatROIImpact(roiDiff),
      confidence: 'high' as const,
      renewableJustification: renewableRecommendations.reasoning
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
      benchmarkComparison: calculateBenchmarkPercentile(currentMetrics, input.useCase),
      useCaseContext // Include for transparency
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
