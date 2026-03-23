/**
 * Complete Agricultural Questionnaire Configuration
 *
 * 18 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const agricultureSections: Section[] = [
  { id: 'facility', title: 'Farm Profile', description: 'Operation type, size, and irrigation', icon: '🌾' },
  { id: 'operations', title: 'Equipment & Processing', description: 'Irrigation, cold chain, and machinery', icon: '🚜' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and energy sources', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const agricultureQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'farmType',
    type: 'buttons',
    section: 'facility',
    title: 'Agricultural operation type',
    options: [
      { value: 'row-crop', label: 'Row Crop / Field Farming', icon: '🌾', description: 'Corn, soy, wheat, cotton' },
      { value: 'specialty-crop', label: 'Specialty / High-Value Crop', icon: '🍇', description: 'Vineyard, orchard, berries' },
      { value: 'dairy', label: 'Dairy Farm', icon: '🐄', description: 'Milking, cooling, processing' },
      { value: 'livestock', label: 'Livestock / Poultry', icon: '🐔', description: 'Barns, feed systems, ventilation' },
      { value: 'mixed', label: 'Mixed Operation', icon: '🌻', description: 'Multiple enterprise types' },
    ],
    smartDefault: 'row-crop',
    merlinTip: 'Dairy farms are the highest energy users in agriculture: milking parlors, milk cooling, ventilation draw 100-500 kW for a mid-size operation.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'acreage',
    type: 'slider',
    section: 'facility',
    title: 'Total irrigated acreage',
    subtitle: 'Irrigated land requiring pump energy',
    range: { min: 10, max: 50000, step: 100 },
    smartDefault: 500,
    unit: ' acres',
    merlinTip: 'Center pivot irrigation: 25-75 HP pump per pivot (200-300 acres each). Total pump load scales directly with irrigated acreage.',
    validation: { required: true, min: 10, max: 50000 },
    impactsCalculations: ['peakDemand', 'irrigationLoad'],
  },
  {
    id: 'irrigationType',
    type: 'buttons',
    section: 'facility',
    title: 'Primary irrigation method',
    subtitle: 'Irrigation pumping is often the #1 agricultural electricity cost',
    options: [
      { value: 'center-pivot', label: 'Center Pivot', icon: '🔄', description: 'Large-scale, 25-75 HP per pivot' },
      { value: 'drip', label: 'Drip / Micro-Irrigation', icon: '💧', description: 'High-pressure, efficient' },
      { value: 'flood', label: 'Flood / Furrow', icon: '🌊', description: 'Gravity-fed, lower energy' },
      { value: 'sprinkler', label: 'Sprinkler / Travelling Gun', icon: '🚿', description: 'High-pressure, variable' },
      { value: 'none', label: 'Dryland / No Irrigation', icon: '☀️' },
    ],
    smartDefault: 'center-pivot',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'irrigationLoad'],
  },
  {
    id: 'buildingsSqFt',
    type: 'slider',
    section: 'facility',
    title: 'Total building area',
    subtitle: 'Barns, shops, processing buildings, offices',
    range: { min: 1000, max: 500000, step: 1000 },
    smartDefault: 10000,
    unit: ' sq ft',
    validation: { required: true, min: 1000, max: 500000 },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'coldStorage',
    type: 'buttons',
    section: 'operations',
    title: 'On-farm cold storage / packing',
    subtitle: 'Post-harvest cooling is critical for quality and represents significant load',
    options: [
      { value: 'large', label: 'Large Cold Storage', icon: '🧊', description: '10,000+ sq ft, processing line' },
      { value: 'small', label: 'Walk-In Cooler(s)', icon: '❄️', description: 'Basic post-harvest cooling' },
      { value: 'none', label: 'No Cold Storage', icon: '❌' },
    ],
    smartDefault: 'none',
    merlinTip: 'On-farm cold storage (forced-air cooling, hydrocooling) can add 50-300 kW of peak demand. BESS smooths these intermittent loads.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },
  {
    id: 'processing',
    type: 'buttons',
    section: 'operations',
    title: 'On-farm processing',
    options: [
      { value: 'full', label: 'Full Processing Line', icon: '🏭', description: 'Sorting, washing, packaging' },
      { value: 'basic', label: 'Basic Sorting/Grading', icon: '📦' },
      { value: 'none', label: 'No On-Farm Processing', icon: '❌' },
    ],
    smartDefault: 'none',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'dairyMilking',
    type: 'buttons',
    section: 'operations',
    title: 'Dairy operations (if applicable)',
    options: [
      { value: 'parlor-large', label: 'Large Milking Parlor (500+ head)', icon: '🐄' },
      { value: 'parlor-small', label: 'Milking Parlor (< 500 head)', icon: '🐮' },
      { value: 'robotic', label: 'Robotic Milking', icon: '🤖' },
      { value: 'none', label: 'No Dairy Operations', icon: '❌' },
    ],
    smartDefault: 'none',
    conditionalLogic: {
      dependsOn: 'farmType',
      showIf: (val: string) => val === 'dairy' || val === 'mixed',
    },
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'grainDrying',
    type: 'buttons',
    section: 'operations',
    title: 'Grain drying / storage',
    options: [
      { value: 'large-system', label: 'Large Dryer System', icon: '🌾', description: 'Continuous flow or batch dryer' },
      { value: 'bins', label: 'Bin Drying / Aeration', icon: '📦', description: 'Low-energy aeration fans' },
      { value: 'none', label: 'No Grain Drying', icon: '❌' },
    ],
    smartDefault: 'none',
    conditionalLogic: {
      dependsOn: 'farmType',
      showIf: (val: string) => val === 'row-crop' || val === 'mixed',
    },
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'seasonalLoad'],
  },
  {
    id: 'evEquipment',
    type: 'buttons',
    section: 'operations',
    title: 'Electric farm vehicles / equipment',
    options: [
      { value: 'yes', label: 'Yes — Electric Tractors/UTVs', icon: '🔋' },
      { value: 'planned', label: 'Planning to Electrify', icon: '📋' },
      { value: 'none', label: 'All Diesel/Gas', icon: '⛽' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'limited', label: 'Limited / Single Phase', icon: '⚠️', description: 'Rural, limited capacity' },
      { value: 'off-grid', label: 'Off-Grid / Remote', icon: '🏜️', description: 'No utility connection' },
    ],
    smartDefault: 'on-grid',
    merlinTip: 'Many farms are on single-phase power with limited capacity. BESS can provide three-phase power for large motors without expensive utility upgrades.',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Grid reliability',
    options: [
      { value: 'reliable', label: 'Very Reliable', icon: '✅' },
      { value: 'occasional', label: 'Occasional Issues', icon: '⚡' },
      { value: 'frequent', label: 'Frequent Outages', icon: '⚠️' },
    ],
    smartDefault: 'occasional',
    merlinTip: 'Rural areas have longer outage durations. A 4-hour outage during peak irrigation season can cost $10K-50K in crop damage.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generation',
    options: [
      { value: 'yes', label: 'Yes — Generator(s)', icon: '⛽' },
      { value: 'no', label: 'No Backup', icon: '❌' },
    ],
    smartDefault: 'yes',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'seasonalProfile',
    type: 'buttons',
    section: 'energy',
    title: 'Energy demand seasonality',
    subtitle: 'Seasonal demand patterns affect BESS sizing strategy',
    options: [
      { value: 'highly-seasonal', label: 'Highly Seasonal', icon: '📈', description: 'Peak during irrigation/harvest' },
      { value: 'moderate', label: 'Moderate Variation', icon: '📊', description: 'Year-round with seasonal peaks' },
      { value: 'flat', label: 'Relatively Flat', icon: '📉', description: 'Consistent year-round (dairy, indoor)' },
    ],
    smartDefault: 'highly-seasonal',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'bessCapacity'],
  },

  // ── SECTION 4: SOLAR & GOALS ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 60000, step: 500 },
    smartDefault: 20000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 60000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over equipment areas?',
    subtitle: 'Equipment shelter or field edge canopy solar structures',
    options: [
      { value: 'yes', label: 'Yes, Interested', icon: '🏗️', description: 'Generates solar + provides shade' },
      { value: 'learn_more', label: 'Tell Me More', icon: '💡', description: 'Want to learn the benefits' },
      { value: 'no', label: 'Not Now', icon: '❌', description: 'Roof solar only for now' },
    ],
    smartDefault: 'learn_more',
    validation: { required: false },
    impactsCalculations: ['carportSolar', 'solarCapacity'],
  },
  {
    id: 'existingSolar',
    type: 'buttons',
    section: 'solar',
    title: 'Existing or planned solar',
    options: [
      { value: 'existing', label: 'Already Installed', icon: '☀️' },
      { value: 'planned', label: 'Planned / Agrivoltaics', icon: '📋', description: 'Dual-use solar + farming' },
      { value: 'none', label: 'No Solar', icon: '❌' },
    ],
    smartDefault: 'none',
    merlinTip: 'Agrivoltaics (solar panels above crops) can reduce water use 20-30% from shading while generating clean energy. Ideal for specialty crops.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
];
