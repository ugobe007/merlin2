/**
 * Centralized Industry Standards Configuration
 * 
 * Single source of truth for all industry-specific energy storage system configurations.
 * This file consolidates configurations previously scattered across multiple locations
 * to ensure consistency across Smart Wizard, AI Wizard, and template defaults.
 * 
 * Data Sources:
 * - NREL ATB 2024: National Renewable Energy Laboratory Annual Technology Baseline
 *   URL: https://atb.nrel.gov/
 * - ASHRAE 90.1: Energy Standard for Buildings Except Low-Rise Residential Buildings
 *   URL: https://www.ashrae.org/technical-resources/bookstore/standard-90-1
 * - IEEE 2450: IEEE Standard for Energy Storage Systems
 *   URL: https://standards.ieee.org/standard/2450-2019.html
 * - DOE/EIA CBECS: Commercial Buildings Energy Consumption Survey
 *   URL: https://www.eia.gov/consumption/commercial/
 * - APPA: Association of Physical Plant Administrators (Higher Education)
 *   URL: https://www.appa.org/
 * - Uptime Institute: Data Center Standards
 *   URL: https://uptimeinstitute.com/
 * 
 * Last Updated: 2025-Q4
 * Next Review: 2026-Q1
 */

export interface IndustryProfile {
  /** Base power requirement in MW per unit scale */
  basePowerMW: number;
  /** Recommended battery duration in hours */
  baseDurationHrs: number;
  /** Solar to battery power ratio (solar MW = battery MW * solarRatio) */
  solarRatio: number;
  /** Scaling factor for converting user input to power requirements */
  scaleFactor: number;
  /** Unit of measurement for scaling (e.g., 'rooms', 'beds', 'chargers') */
  scaleUnit: string;
  /** Primary data source for power sizing */
  powerSource: string;
  /** Primary data source for equipment/load characteristics */
  equipmentSource: string;
  /** Date of last validation/update */
  lastUpdated: string;
}

export const INDUSTRY_STANDARDS: { [key: string]: IndustryProfile } = {
  // TRANSPORTATION & LOGISTICS
  'ev-charging': {
    basePowerMW: 0.5,
    baseDurationHrs: 2,
    solarRatio: 1.0,
    scaleFactor: 1.0,
    scaleUnit: 'chargers',
    powerSource: 'NREL EV Infrastructure Study 2024',
    equipmentSource: 'SAE J1772/CCS Standards',
    lastUpdated: '2025-Q4'
  },
  'airport': {
    basePowerMW: 4.0,
    baseDurationHrs: 6,
    solarRatio: 1.2,
    scaleFactor: 1.0,
    scaleUnit: 'million_passengers',
    powerSource: 'FAA Airport Energy Study 2024',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'logistics': {
    basePowerMW: 1.5,
    baseDurationHrs: 4,
    solarRatio: 1.5,
    scaleFactor: 1.0,
    scaleUnit: 'sq_ft_thousands',
    powerSource: 'DOE Warehouse Energy Study',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },

  // HOSPITALITY & COMMERCIAL
  'hotel': {
    basePowerMW: 1.5,
    baseDurationHrs: 5,
    solarRatio: 1.4,
    scaleFactor: 1.0,
    scaleUnit: 'rooms',
    powerSource: 'NREL Commercial Reference Buildings 2024',
    equipmentSource: 'ASHRAE 90.1-2019 Hospitality',
    lastUpdated: '2025-Q4'
  },
  'casino': {
    basePowerMW: 2.0,
    baseDurationHrs: 8,
    solarRatio: 0.6,
    scaleFactor: 1.0,
    scaleUnit: 'gaming_floor_sq_ft',
    powerSource: 'Gaming Industry Energy Benchmarks',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'retail': {
    basePowerMW: 0.25,
    baseDurationHrs: 4,
    solarRatio: 1.3,
    scaleFactor: 1.0,
    scaleUnit: 'sq_ft_thousands',
    powerSource: 'DOE/EIA CBECS 2024 Retail',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'car-wash': {
    basePowerMW: 0.3,
    baseDurationHrs: 3,
    solarRatio: 1.8,
    scaleFactor: 1.0,
    scaleUnit: 'wash_bays',
    powerSource: 'Industry Load Analysis',
    equipmentSource: 'Manufacturer Specifications',
    lastUpdated: '2025-Q4'
  },

  // HEALTHCARE & EDUCATION
  'hospital': {
    basePowerMW: 2.5,
    baseDurationHrs: 8,
    solarRatio: 1.0,
    scaleFactor: 1.0,
    scaleUnit: 'beds',
    powerSource: 'NREL Healthcare Baseline 2024',
    equipmentSource: 'ASHRAE 90.1-2019 Healthcare + NFPA 99',
    lastUpdated: '2025-Q4'
  },
  'university': {
    basePowerMW: 2.0,
    baseDurationHrs: 5,
    solarRatio: 1.3,
    scaleFactor: 1.0,
    scaleUnit: 'students_thousands',
    powerSource: 'APPA Campus Energy Benchmarks 2024',
    equipmentSource: 'ASHRAE 90.1-2019 Education',
    lastUpdated: '2025-Q4'
  },

  // INDUSTRIAL & TECHNOLOGY
  'manufacturing': {
    basePowerMW: 2.0,
    baseDurationHrs: 4,
    solarRatio: 1.2,
    scaleFactor: 1.0,
    scaleUnit: 'production_lines',
    powerSource: 'NREL Industrial Baseline 2024',
    equipmentSource: 'DOE Better Plants Program',
    lastUpdated: '2025-Q4'
  },
  'data-center': {
    basePowerMW: 2.0,
    baseDurationHrs: 6,
    solarRatio: 0.8,
    scaleFactor: 1.0,
    scaleUnit: 'IT_load_MW',
    powerSource: 'Uptime Institute Tier Standards',
    equipmentSource: 'ASHRAE TC 9.9',
    lastUpdated: '2025-Q4'
  },
  'datacenter': { // Alias for compatibility
    basePowerMW: 2.0,
    baseDurationHrs: 6,
    solarRatio: 0.8,
    scaleFactor: 1.0,
    scaleUnit: 'IT_load_MW',
    powerSource: 'Uptime Institute Tier Standards',
    equipmentSource: 'ASHRAE TC 9.9',
    lastUpdated: '2025-Q4'
  },
  'cold-storage': {
    basePowerMW: 1.0,
    baseDurationHrs: 8,
    solarRatio: 1.5,
    scaleFactor: 1.0,
    scaleUnit: 'storage_volume',
    powerSource: 'Cold Chain Energy Study',
    equipmentSource: 'ASHRAE Refrigeration Handbook',
    lastUpdated: '2025-Q4'
  },
  'warehouse': {
    basePowerMW: 1.0,
    baseDurationHrs: 4,
    solarRatio: 1.5,
    scaleFactor: 1.0,
    scaleUnit: 'sq_ft_hundred_thousands',
    powerSource: 'DOE/EIA CBECS 2024 Warehouse',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },

  // RESIDENTIAL & MULTI-TENANT
  'apartment': {
    basePowerMW: 1.0,
    baseDurationHrs: 4,
    solarRatio: 1.2,
    scaleFactor: 1.0,
    scaleUnit: 'units',
    powerSource: 'DOE/EIA RECS Multifamily 2024',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'microgrid': {
    basePowerMW: 0.5,
    baseDurationHrs: 8,
    solarRatio: 2.0,
    scaleFactor: 1.0,
    scaleUnit: 'buildings',
    powerSource: 'DOE Microgrid Initiative',
    equipmentSource: 'IEEE 2030.7',
    lastUpdated: '2025-Q4'
  },

  // AGRICULTURE & SPECIALTY
  'agricultural': {
    basePowerMW: 1.0,
    baseDurationHrs: 6,
    solarRatio: 2.0,
    scaleFactor: 1.0,
    scaleUnit: 'acres_thousands',
    powerSource: 'USDA Agricultural Energy Study 2024',
    equipmentSource: 'ASABE Standards',
    lastUpdated: '2025-Q4'
  },
  'agriculture': { // Alias for compatibility
    basePowerMW: 1.0,
    baseDurationHrs: 6,
    solarRatio: 2.0,
    scaleFactor: 1.0,
    scaleUnit: 'acres_thousands',
    powerSource: 'USDA Agricultural Energy Study 2024',
    equipmentSource: 'ASABE Standards',
    lastUpdated: '2025-Q4'
  },
  'indoor-farm': {
    basePowerMW: 1.5,
    baseDurationHrs: 4,
    solarRatio: 1.0,
    scaleFactor: 1.0,
    scaleUnit: 'growing_area_sq_ft',
    powerSource: 'CEA Industry Benchmarks',
    equipmentSource: 'ASABE LED Lighting Standards',
    lastUpdated: '2025-Q4'
  },

  // OFFICES (Small Scale)
  'office': {
    basePowerMW: 0.15,
    baseDurationHrs: 3,
    solarRatio: 0.8,
    scaleFactor: 1.0,
    scaleUnit: 'sq_ft_thousands',
    powerSource: 'DOE/EIA CBECS 2024 Office',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'small-office': {
    basePowerMW: 0.08,
    baseDurationHrs: 2,
    solarRatio: 0.5,
    scaleFactor: 1.0,
    scaleUnit: 'employees',
    powerSource: 'DOE/EIA CBECS 2024 Small Office',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  },
  'medical-office': {
    basePowerMW: 0.10,
    baseDurationHrs: 2,
    solarRatio: 0.6,
    scaleFactor: 1.0,
    scaleUnit: 'exam_rooms',
    powerSource: 'Healthcare Practice Energy Study',
    equipmentSource: 'ASHRAE 90.1-2019 Healthcare',
    lastUpdated: '2025-Q4'
  },
  'dental-office': {
    basePowerMW: 0.12,
    baseDurationHrs: 2,
    solarRatio: 0.6,
    scaleFactor: 1.0,
    scaleUnit: 'chairs',
    powerSource: 'Dental Practice Energy Study',
    equipmentSource: 'ADA Facility Guidelines',
    lastUpdated: '2025-Q4'
  }
};

/**
 * AI Wizard optimal recommendations (typically higher than baseline for comprehensive coverage)
 */
export const AI_OPTIMAL_STANDARDS: { [key: string]: { powerMW: number; durationHrs: number; solarRatio: number } } = {
  'manufacturing': { powerMW: 3.5, durationHrs: 4, solarRatio: 1.2 },
  'office': { powerMW: 0.15, durationHrs: 3, solarRatio: 0.8 },
  'small-office': { powerMW: 0.08, durationHrs: 2, solarRatio: 0.5 },
  'medical-office': { powerMW: 0.10, durationHrs: 2, solarRatio: 0.6 },
  'datacenter': { powerMW: 8.0, durationHrs: 6, solarRatio: 0.8 },
  'data-center': { powerMW: 8.0, durationHrs: 6, solarRatio: 0.8 },
  'warehouse': { powerMW: 2.5, durationHrs: 4, solarRatio: 1.5 },
  'hotel': { powerMW: 3.0, durationHrs: 5, solarRatio: 1.4 },
  'retail': { powerMW: 1.5, durationHrs: 4, solarRatio: 1.3 },
  'agriculture': { powerMW: 2.0, durationHrs: 6, solarRatio: 2.0 },
  'agricultural': { powerMW: 2.0, durationHrs: 6, solarRatio: 2.0 },
  'car-wash': { powerMW: 0.8, durationHrs: 3, solarRatio: 1.8 },
  'ev-charging': { powerMW: 5.0, durationHrs: 2, solarRatio: 1.0 },
  'apartment': { powerMW: 2.0, durationHrs: 4, solarRatio: 1.2 },
  'university': { powerMW: 4.0, durationHrs: 5, solarRatio: 1.3 },
  'indoor-farm': { powerMW: 3.0, durationHrs: 12, solarRatio: 1.8 },
  'dental-office': { powerMW: 0.12, durationHrs: 2, solarRatio: 0.6 },
  'hospital': { powerMW: 5.0, durationHrs: 8, solarRatio: 1.0 },
  'cold-storage': { powerMW: 2.0, durationHrs: 8, solarRatio: 1.5 },
};

/**
 * Template initial values (used when user first selects an industry)
 */
export const TEMPLATE_DEFAULTS: { [key: string]: { mw: number; hours: number } } = {
  'manufacturing': { mw: 3.5, hours: 4 },
  'office': { mw: 0.15, hours: 3 },
  'small-office': { mw: 0.08, hours: 2 },
  'medical-office': { mw: 0.10, hours: 2 },
  'datacenter': { mw: 8.0, hours: 6 },
  'data-center': { mw: 8.0, hours: 6 },
  'warehouse': { mw: 2.5, hours: 4 },
  'hotel': { mw: 3.0, hours: 5 },
  'retail': { mw: 1.5, hours: 4 },
  'agriculture': { mw: 2.0, hours: 6 },
  'agricultural': { mw: 2.0, hours: 6 },
  'car-wash': { mw: 0.8, hours: 3 },
  'ev-charging': { mw: 5.0, hours: 2 },
  'apartment': { mw: 2.0, hours: 4 },
  'university': { mw: 4.0, hours: 5 },
  'indoor-farm': { mw: 3.0, hours: 4 },
  'hospital': { mw: 5.0, hours: 8 },
  'dental-office': { mw: 0.12, hours: 2 }
};

/**
 * Helper function to get industry profile with fallback
 */
export function getIndustryProfile(industry: string): IndustryProfile {
  return INDUSTRY_STANDARDS[industry] || {
    basePowerMW: 2.0,
    baseDurationHrs: 4,
    solarRatio: 1.0,
    scaleFactor: 1.0,
    scaleUnit: 'generic',
    powerSource: 'Generic Baseline',
    equipmentSource: 'ASHRAE 90.1-2019',
    lastUpdated: '2025-Q4'
  };
}

/**
 * Helper function to get AI optimal standards with fallback
 */
export function getAIOptimalStandards(industry: string): { powerMW: number; durationHrs: number; solarRatio: number } {
  return AI_OPTIMAL_STANDARDS[industry] || { powerMW: 2.0, durationHrs: 4, solarRatio: 1.0 };
}

/**
 * Helper function to get template defaults with fallback
 */
export function getTemplateDefaults(industry: string): { mw: number; hours: number } {
  return TEMPLATE_DEFAULTS[industry] || { mw: 2.0, hours: 4 };
}
