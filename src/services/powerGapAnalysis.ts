/**
 * Power Gap Analysis Service
 * 
 * The intelligence behind Merlin - calculates the gap between what a customer NEEDS
 * versus what they currently have or are considering. This is the "aha moment" that
 * demonstrates expertise and drives smart recommendations.
 * 
 * Core Calculation:
 * - NEEDED Power: Based on use case + customer answers (critical loads, backup hours, growth)
 * - SELECTED Power: Current system sizing from baseline calculation
 * - GAP: The shortfall or surplus
 * - RECOMMENDATION: What action to take
 */

import type { UseCaseAnswers } from '@/components/wizard/SmartWizardV3.types';
import type { BaselineCalculationResult } from '@/services/baselineService';

export interface PowerGapAnalysis {
  // Current state
  selectedPowerKW: number;
  selectedEnergyKWh: number;
  selectedDurationHours: number;
  
  // Requirements
  neededPowerKW: number;
  neededEnergyKWh: number;
  neededDurationHours: number;
  
  // Gap analysis
  powerGapKW: number;  // Negative = need more, Positive = surplus
  energyGapKWh: number;
  durationGapHours: number;
  
  // Status
  hasSufficientPower: boolean;
  hasSufficientEnergy: boolean;
  hasSufficientDuration: boolean;
  
  // Recommendations
  recommendation: 'sufficient' | 'add_power' | 'add_energy' | 'add_both';
  recommendationText: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // Context
  useCaseSlug: string;
  calculationNotes: string[];
}

/**
 * Calculate power gap between needed and selected capacity
 * 
 * This is the secret sauce - industry-specific logic that understands
 * what customers ACTUALLY need, not just what they ask for.
 */
export async function calculatePowerGap(
  useCaseSlug: string,
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): Promise<PowerGapAnalysis> {
  
  const notes: string[] = [];
  
  // Get selected capacity from baseline (convert MW to kW)
  const selectedPowerKW = baseline.powerMW * 1000;
  const selectedEnergyKWh = baseline.powerMW * baseline.durationHrs * 1000; // MW * hrs * 1000 = kWh
  const selectedDurationHours = baseline.durationHrs;
  
  notes.push(`Baseline sizing: ${selectedPowerKW}kW / ${selectedEnergyKWh}kWh / ${selectedDurationHours}hrs`);
  
  // Calculate needed capacity based on use case
  const needed = calculateNeededCapacity(useCaseSlug, answers, baseline);
  
  notes.push(`Required capacity: ${needed.powerKW}kW / ${needed.energyKWh}kWh / ${needed.durationHours}hrs`);
  
  // Calculate gaps
  const powerGapKW = selectedPowerKW - needed.powerKW;
  const energyGapKWh = selectedEnergyKWh - needed.energyKWh;
  const durationGapHours = selectedDurationHours - needed.durationHours;
  
  // Determine sufficiency (with 10% safety margin)
  const powerMargin = 0.9;
  const hasSufficientPower = selectedPowerKW >= (needed.powerKW * powerMargin);
  const hasSufficientEnergy = selectedEnergyKWh >= (needed.energyKWh * powerMargin);
  const hasSufficientDuration = selectedDurationHours >= (needed.durationHours * powerMargin);
  
  // Generate recommendation
  const recommendation = generateRecommendation(
    hasSufficientPower,
    hasSufficientEnergy,
    hasSufficientDuration,
    powerGapKW,
    energyGapKWh
  );
  
  const recommendationText = generateRecommendationText(
    recommendation,
    powerGapKW,
    energyGapKWh,
    durationGapHours,
    useCaseSlug
  );
  
  // Assess confidence based on data quality
  const confidenceLevel = assessConfidence(answers, useCaseSlug);
  
  notes.push(`Recommendation: ${recommendation} (${confidenceLevel} confidence)`);
  
  return {
    selectedPowerKW,
    selectedEnergyKWh,
    selectedDurationHours,
    
    neededPowerKW: needed.powerKW,
    neededEnergyKWh: needed.energyKWh,
    neededDurationHours: needed.durationHours,
    
    powerGapKW,
    energyGapKWh,
    durationGapHours,
    
    hasSufficientPower,
    hasSufficientEnergy,
    hasSufficientDuration,
    
    recommendation,
    recommendationText,
    confidenceLevel,
    
    useCaseSlug,
    calculationNotes: notes,
  };
}

/**
 * Calculate needed capacity based on use case and customer answers
 * 
 * Industry-specific logic that understands real requirements
 */
function calculateNeededCapacity(
  useCaseSlug: string,
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  switch (useCaseSlug) {
    case 'office':
      return calculateOfficeNeeds(answers, baseline);
    
    case 'ev-charging':
      return calculateEVChargingNeeds(answers, baseline);
    
    case 'hotel':
      return calculateHotelNeeds(answers, baseline);
    
    case 'datacenter':
      return calculateDatacenterNeeds(answers, baseline);
    
    case 'apartment':
      return calculateApartmentNeeds(answers, baseline);
    
    case 'retail':
      return calculateRetailNeeds(answers, baseline);
    
    default:
      // Generic calculation for other use cases
      return {
        powerKW: baseline.powerMW * 1000,
        energyKWh: baseline.powerMW * baseline.durationHrs * 1000,
        durationHours: baseline.durationHrs,
      };
  }
}

/**
 * Office building power needs calculation
 */
function calculateOfficeNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // Base needs from baseline (convert MW to kW)
  let neededPowerKW = baseline.powerMW * 1000;
  let neededDurationHours = baseline.durationHrs;
  
  // Adjust based on critical load level
  const criticalLoad = answers.critical_loads as string;
  if (criticalLoad === 'data_critical') {
    // Data centers within offices need 20% more capacity
    neededPowerKW *= 1.2;
    neededDurationHours = Math.max(neededDurationHours, 4); // Minimum 4 hours
  } else if (criticalLoad === 'full_building') {
    // Full building backup needs 10% more
    neededPowerKW *= 1.1;
  }
  
  // Check if they have existing solar
  const hasSolar = answers.has_solar as boolean;
  const solarSizeKW = (answers.solar_size_kw as number) || 0;
  
  if (hasSolar && solarSizeKW > 0) {
    // With solar, they need storage to match for resilience
    const solarBackupNeeds = solarSizeKW * 0.5; // 50% of solar for evening/backup
    neededPowerKW = Math.max(neededPowerKW, solarBackupNeeds);
  }
  
  // Check backup duration requirements
  const desiredBackupHours = (answers.backup_hours as number) || neededDurationHours;
  neededDurationHours = Math.max(neededDurationHours, desiredBackupHours);
  
  // Calculate energy needs
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * EV Charging power needs calculation
 */
function calculateEVChargingNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // For EV charging, power is king
  // User specifies exact kW needs, respect that
  const userSpecifiedKW = answers.charging_power_kw as number;
  
  let neededPowerKW = userSpecifiedKW || (baseline.powerMW * 1000);
  
  // Standard EV charging needs 4-6 hours of peak power
  const neededDurationHours = 5;
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * Hotel power needs calculation
 */
function calculateHotelNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // Hotels need reliable backup for guest safety
  let neededPowerKW = baseline.powerMW * 1000;
  let neededDurationHours = baseline.durationHrs;
  
  // Minimum 4 hours for guest safety and comfort
  neededDurationHours = Math.max(neededDurationHours, 4);
  
  // If they have critical systems (elevators, fire safety), add 15%
  const criticalSystems = answers.critical_systems as string;
  if (criticalSystems === 'full' || criticalSystems === 'life_safety') {
    neededPowerKW *= 1.15;
  }
  
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * Data center power needs calculation
 */
function calculateDatacenterNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // Data centers have ZERO tolerance for downtime
  let neededPowerKW = baseline.powerMW * 1000;
  
  // Add 20% safety margin for data centers (N+1 redundancy concept)
  neededPowerKW *= 1.2;
  
  // Minimum 4 hours backup until generators stabilize
  const neededDurationHours = Math.max(baseline.durationHrs, 4);
  
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * Apartment/Multi-family power needs calculation
 */
function calculateApartmentNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // Apartments need coverage for common areas + optional tenant backup
  let neededPowerKW = baseline.powerMW * 1000;
  let neededDurationHours = baseline.durationHrs;
  
  // Check if providing tenant backup
  const tenantBackup = answers.tenant_backup as boolean;
  if (tenantBackup) {
    // Add 30% for in-unit essential loads
    neededPowerKW *= 1.3;
    neededDurationHours = Math.max(neededDurationHours, 4);
  }
  
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * Retail power needs calculation
 */
function calculateRetailNeeds(
  answers: UseCaseAnswers,
  baseline: BaselineCalculationResult
): { powerKW: number; energyKWh: number; durationHours: number } {
  
  // Retail needs backup for POS, refrigeration, security
  let neededPowerKW = baseline.powerMW * 1000;
  let neededDurationHours = baseline.durationHrs;
  
  // Check for refrigeration (requires continuous power)
  const hasRefrigeration = answers.has_refrigeration as boolean;
  if (hasRefrigeration) {
    // Need 6+ hours to prevent spoilage
    neededDurationHours = Math.max(neededDurationHours, 6);
  }
  
  const neededEnergyKWh = neededPowerKW * neededDurationHours;
  
  return {
    powerKW: neededPowerKW,
    energyKWh: neededEnergyKWh,
    durationHours: neededDurationHours,
  };
}

/**
 * Generate recommendation based on gap analysis
 */
function generateRecommendation(
  hasSufficientPower: boolean,
  hasSufficientEnergy: boolean,
  hasSufficientDuration: boolean,
  powerGapKW: number,
  energyGapKWh: number
): 'sufficient' | 'add_power' | 'add_energy' | 'add_both' {
  
  if (hasSufficientPower && hasSufficientEnergy && hasSufficientDuration) {
    return 'sufficient';
  }
  
  const needsMorePower = !hasSufficientPower;
  const needsMoreEnergy = !hasSufficientEnergy || !hasSufficientDuration;
  
  if (needsMorePower && needsMoreEnergy) {
    return 'add_both';
  }
  
  if (needsMorePower) {
    return 'add_power';
  }
  
  return 'add_energy';
}

/**
 * Generate human-readable recommendation text
 */
function generateRecommendationText(
  recommendation: string,
  powerGapKW: number,
  energyGapKWh: number,
  durationGapHours: number,
  useCaseSlug: string
): string {
  
  const absGapKW = Math.abs(powerGapKW);
  const absGapKWh = Math.abs(energyGapKWh);
  const absGapHours = Math.abs(durationGapHours);
  
  switch (recommendation) {
    case 'sufficient':
      return `✅ Your current configuration provides sufficient power and energy capacity for ${useCaseSlug.replace('-', ' ')} operations. You have ${powerGapKW > 0 ? Math.round(powerGapKW) + 'kW surplus' : 'adequate power'}.`;
    
    case 'add_power':
      return `⚠️ Your system needs ${Math.round(absGapKW)}kW more power capacity to meet peak demand requirements. Consider increasing inverter capacity or adding more battery modules.`;
    
    case 'add_energy':
      return `⚠️ Your system needs ${Math.round(absGapKWh)}kWh more energy storage to provide ${Math.round(absGapHours)} additional hours of backup. Consider adding more battery capacity or extending duration.`;
    
    case 'add_both':
      return `⚠️ Your system needs both more power (${Math.round(absGapKW)}kW) and more energy (${Math.round(absGapKWh)}kWh) to meet your requirements. We recommend upgrading both inverter and battery capacity.`;
    
    default:
      return 'Analyzing your power requirements...';
  }
}

/**
 * Assess confidence in recommendation based on data quality
 */
function assessConfidence(answers: UseCaseAnswers, useCaseSlug: string): 'high' | 'medium' | 'low' {
  
  // Count how many key questions were answered
  const keyFields = [
    'peak_demand_kw',
    'monthly_bill',
    'operating_hours',
    'backup_hours',
    'critical_loads',
  ];
  
  let answeredCount = 0;
  let totalKey = 0;
  
  for (const field of keyFields) {
    totalKey++;
    if (answers[field] !== undefined && answers[field] !== null && answers[field] !== '') {
      answeredCount++;
    }
  }
  
  const completeness = answeredCount / totalKey;
  
  if (completeness >= 0.8) {
    return 'high';
  } else if (completeness >= 0.5) {
    return 'medium';
  } else {
    return 'low';
  }
}
