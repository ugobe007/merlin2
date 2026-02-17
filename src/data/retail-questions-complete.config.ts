/**
 * Complete Retail & Commercial Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: retail_load_v1 (requiredInputs: squareFootage)
 *
 * Sections:
 *   1. Facility (Q1-4)    — retailType, squareFootage, operatingHours, buildingAge
 *   2. Operations (Q5-9)  — refrigerationLevel, cookingOnSite, lightingType, parkingLot, evChargers
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, demandCharges
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const retailSections: Section[] = [
  { id: 'facility', title: 'Store Profile', description: 'Retail type, size, and hours', icon: '🏪' },
  { id: 'operations', title: 'Operations & Systems', description: 'Refrigeration, lighting, and equipment', icon: '🛒' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const retailQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'retailType',
    type: 'buttons',
    section: 'facility',
    title: 'Retail facility type',
    subtitle: 'Facility type determines energy intensity and peak patterns',
    options: [
      { value: 'big-box', label: 'Big Box / Superstore', icon: '🏬', description: 'Walmart, Target, Costco type' },
      { value: 'grocery', label: 'Grocery / Supermarket', icon: '🛒', description: 'Heavy refrigeration load' },
      { value: 'strip-mall', label: 'Strip Mall / Plaza', icon: '🏪', description: 'Multi-tenant retail center' },
      { value: 'department', label: 'Department Store', icon: '👔', description: 'Multi-floor retail' },
      { value: 'specialty', label: 'Specialty Retail', icon: '🎯', description: 'Boutique, electronics, pharmacy' },
      { value: 'shopping-center', label: 'Shopping Center / Mall', icon: '🏢', description: 'Enclosed mall, multi-anchor' },
    ],
    smartDefault: 'big-box',
    merlinTip: 'Grocery stores use 2-3x more energy than general retail due to refrigeration. They also have the highest demand charge exposure.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total retail space (sq ft)',
    subtitle: 'Sales floor + back-of-house areas',
    range: { min: 1000, max: 500000, step: 1000 },
    smartDefault: 25000,
    unit: ' sq ft',
    merlinTip: 'Retail energy intensity: General 3-5 W/sq ft, Grocery 6-10 W/sq ft, Big box 4-7 W/sq ft.',
    validation: { required: true, min: 1000, max: 500000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'facility',
    title: 'Operating hours',
    options: [
      { value: 'standard', label: 'Standard (9am-9pm)', icon: '🌅', description: 'Typical retail hours' },
      { value: 'extended', label: 'Extended (7am-11pm)', icon: '🌆', description: 'Long hours, early/late' },
      { value: '24-7', label: '24/7 Operation', icon: '🌐', description: 'Always open (Walmart, etc.)' },
      { value: 'limited', label: 'Limited Hours', icon: '⏰', description: 'Boutique, specialty (< 8 hrs)' },
    ],
    smartDefault: 'standard',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / condition',
    options: [
      { value: 'new', label: 'New Build (< 5 yr)', icon: '🏗️', description: 'Modern systems, LED, efficient HVAC' },
      { value: 'renovated', label: 'Recently Renovated', icon: '🔧', description: 'Major systems upgraded' },
      { value: 'aging', label: 'Aging (20+ yr)', icon: '🏚️', description: 'Older systems, less efficient' },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['efficiency'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'refrigerationLevel',
    type: 'buttons',
    section: 'operations',
    title: 'Refrigeration requirements',
    subtitle: 'Refrigeration is the #1 energy consumer in grocery and food retail',
    options: [
      { value: 'heavy', label: 'Heavy (Grocery/Food)', icon: '🧊', description: 'Walk-in coolers, freezers, display cases' },
      { value: 'moderate', label: 'Moderate (Some Coolers)', icon: '❄️', description: 'Beverage coolers, deli case' },
      { value: 'light', label: 'Light (Minimal)', icon: '🌡️', description: 'A few small coolers' },
      { value: 'none', label: 'None', icon: '❌', description: 'No refrigeration needed' },
    ],
    smartDefault: 'moderate',
    merlinTip: 'A typical grocery store has 150-400 kW of refrigeration load. Anti-condensate heaters add 10-20% on top of that.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad', 'refrigerationLoad'],
  },
  {
    id: 'cookingOnSite',
    type: 'buttons',
    section: 'operations',
    title: 'Food preparation / cooking on-site',
    subtitle: 'In-store bakeries, delis, and restaurants add significant load',
    options: [
      { value: 'full-kitchen', label: 'Full Kitchen / Bakery', icon: '🍕', description: 'Electric ovens, fryers, prep' },
      { value: 'light-prep', label: 'Light Prep / Deli', icon: '🥪', description: 'Warming, assembly, minimal cooking' },
      { value: 'none', label: 'No Food Prep', icon: '❌', description: 'No cooking equipment' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'lightingType',
    type: 'buttons',
    section: 'operations',
    title: 'Lighting system',
    subtitle: 'Retail lighting is 15-30% of total energy consumption',
    options: [
      { value: 'led', label: 'LED Throughout', icon: '💡', description: 'Fully upgraded, energy-efficient' },
      { value: 'mixed', label: 'Mix of LED + Legacy', icon: '🔄', description: 'Partial LED retrofit' },
      { value: 'legacy', label: 'Fluorescent / HID', icon: '💡', description: 'Older lighting technology' },
    ],
    smartDefault: 'mixed',
    validation: { required: false },
    impactsCalculations: ['lightingLoad'],
  },
  {
    id: 'parkingLot',
    type: 'buttons',
    section: 'operations',
    title: 'Parking lot size',
    subtitle: 'Parking lots = solar carport opportunity + EV charging potential',
    options: [
      { value: 'large', label: 'Large (200+ spaces)', icon: '🅿️', description: 'Big box parking field' },
      { value: 'medium', label: 'Medium (50-200)', icon: '🚗', description: 'Standard strip mall lot' },
      { value: 'small', label: 'Small (< 50)', icon: '🏘️', description: 'Urban, limited parking' },
      { value: 'none', label: 'No Parking', icon: '🚶', description: 'Walk-up / street parking' },
    ],
    smartDefault: 'large',
    merlinTip: 'A 200-space parking lot can host 500-750 kW of solar carports, generating shade for customers AND clean energy.',
    validation: { required: false },
    impactsCalculations: ['solarPotential'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'EV charging for customers',
    subtitle: 'Customer-facing EV chargers are becoming a retail differentiator',
    options: [
      { value: 'yes-dcfc', label: 'Yes — Fast Chargers', icon: '⚡', description: 'DC fast charging (150+ kW)' },
      { value: 'yes-l2', label: 'Yes — Level 2 Only', icon: '🔌', description: '7-22 kW chargers' },
      { value: 'planned', label: 'Planned / Evaluating', icon: '📋', description: 'Want to add chargers' },
      { value: 'none', label: 'No EV Charging', icon: '❌', description: 'Not currently planned' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌', description: 'Normal utility connection' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid can\'t support expansion' },
    ],
    smartDefault: 'on-grid',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Grid reliability',
    options: [
      { value: 'reliable', label: 'Very Reliable', icon: '✅', description: '< 1 outage per year' },
      { value: 'occasional', label: 'Occasional Issues', icon: '⚡', description: '2-5 outages per year' },
      { value: 'frequent', label: 'Frequent Outages', icon: '⚠️', description: '6+ outages per year' },
    ],
    smartDefault: 'reliable',
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
    smartDefault: 'no',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'demandCharges',
    type: 'buttons',
    section: 'energy',
    title: 'Demand charge awareness',
    options: [
      { value: 'high', label: 'High ($15-30+/kW)', icon: '🔴' },
      { value: 'moderate', label: 'Moderate ($8-15/kW)', icon: '🟡' },
      { value: 'low', label: 'Low (< $8/kW)', icon: '🟢' },
      { value: 'unknown', label: "Don't Know", icon: '❓' },
    ],
    smartDefault: 'unknown',
    validation: { required: true },
    impactsCalculations: ['demandChargeSavings', 'payback'],
  },

  // ── SECTION 4: SOLAR & GOALS (Q14-Q18) ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 200000, step: 1000 },
    smartDefault: 50000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 200000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over customer parking?',
    subtitle: 'Customer parking shade structures with integrated solar panels',
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
      { value: 'planned', label: 'Planned / Considering', icon: '📋' },
      { value: 'none', label: 'No Solar', icon: '❌' },
    ],
    smartDefault: 'none',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving + demand management' },
      { value: 'resilience', label: 'Business Continuity', icon: '🛡️', description: 'Keep doors open during outages' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Corporate green goals' },
      { value: 'ev-readiness', label: 'EV Charging Support', icon: '🔌', description: 'Enable customer EV charging' },
    ],
    smartDefault: 'cost',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'bessCapacity'],
  },
  {
    id: 'budgetTimeline',
    type: 'buttons',
    section: 'solar',
    title: 'Project timeline',
    options: [
      { value: 'urgent', label: 'ASAP (< 6 months)', icon: '🚨' },
      { value: 'planned', label: 'This Year', icon: '📅' },
      { value: 'budgeting', label: 'Next Budget Cycle', icon: '💼' },
      { value: 'exploring', label: 'Just Exploring', icon: '🔍' },
    ],
    smartDefault: 'planned',
    validation: { required: false },
    impactsCalculations: [],
  },
];
