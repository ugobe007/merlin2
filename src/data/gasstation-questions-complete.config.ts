/**
 * Complete Gas Station / Convenience Store Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: gas_station_load_v1 (requiredInputs: squareFootage)
 *
 * Sections:
 *   1. Facility (Q1-4)    — stationType, squareFootage, fuelPumps, operatingHours
 *   2. Operations (Q5-9)  — convenienceStore, foodService, carWash, evChargers, signage
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, demandCharges
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const gasStationSections: Section[] = [
  { id: 'facility', title: 'Station Profile', description: 'Type, size, and configuration', icon: '⛽' },
  { id: 'operations', title: 'Services & Amenities', description: 'C-store, food, car wash, and EV charging', icon: '🏪' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand profile', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const gasStationQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'stationType',
    type: 'buttons',
    section: 'facility',
    title: 'Station type',
    subtitle: 'Station configuration determines energy profile',
    options: [
      { value: 'standard', label: 'Standard Gas Station', icon: '⛽', description: 'Pumps + small shop' },
      { value: 'travel-center', label: 'Travel Center / Truck Stop', icon: '🚛', description: 'Full service, showers, restaurant' },
      { value: 'convenience-plus', label: 'C-Store Focus', icon: '🏪', description: 'Large convenience store, pumps secondary' },
      { value: 'ev-transition', label: 'EV Transition Station', icon: '🔌', description: 'Adding EV charging to existing station' },
    ],
    smartDefault: 'convenience-plus',
    merlinTip: 'Travel centers use 3-5x the energy of standard stations due to food service, showers, and truck idling reduction.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Building square footage',
    subtitle: 'Convenience store / building footprint',
    range: { min: 500, max: 30000, step: 500 },
    smartDefault: 3000,
    unit: ' sq ft',
    merlinTip: 'Standard c-store: 1,500-3,000 sq ft. Travel center: 5,000-15,000 sq ft.',
    validation: { required: true, min: 500, max: 30000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'fuelPumps',
    type: 'buttons',
    section: 'facility',
    title: 'Number of fuel dispensers',
    subtitle: 'Pump lights and electronics draw modest but continuous load',
    options: [
      { value: 'small', label: '2-4 Dispensers', icon: '⛽', description: 'Small station' },
      { value: 'medium', label: '6-10 Dispensers', icon: '⛽', description: 'Standard station' },
      { value: 'large', label: '12-20 Dispensers', icon: '⛽', description: 'Large station / travel center' },
      { value: 'mega', label: '20+ Dispensers', icon: '⛽', description: 'Major travel plaza' },
    ],
    smartDefault: 'medium',
    validation: { required: true },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'facility',
    title: 'Operating hours',
    options: [
      { value: '24-7', label: '24/7 Operation', icon: '🌐', description: 'Always open' },
      { value: 'extended', label: 'Extended (5am-12am)', icon: '🌆', description: 'Long hours' },
      { value: 'standard', label: 'Standard (6am-10pm)', icon: '🌅', description: 'Day hours' },
    ],
    smartDefault: '24-7',
    merlinTip: 'Most gas stations operate 24/7. Canopy and lot lighting runs all night — BESS + solar offsets this base load.',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'convenienceStore',
    type: 'buttons',
    section: 'operations',
    title: 'Convenience store scope',
    subtitle: 'C-store refrigeration and food warmers are major loads',
    options: [
      { value: 'full', label: 'Full C-Store', icon: '🏪', description: 'Walk-in coolers, hot food, coffee' },
      { value: 'limited', label: 'Limited Selection', icon: '🥤', description: 'Beverages, snacks, small cooler' },
      { value: 'none', label: 'No Store / Kiosk Only', icon: '📦', description: 'Pay-at-pump only' },
    ],
    smartDefault: 'full',
    merlinTip: 'A full c-store with walk-in coolers and hot food equipment draws 30-60 kW continuously. Refrigeration alone is 15-30 kW.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'refrigerationLoad', 'baseLoad'],
  },
  {
    id: 'foodService',
    type: 'buttons',
    section: 'operations',
    title: 'Food service level',
    subtitle: 'Kitchen equipment significantly increases peak demand',
    options: [
      { value: 'full-kitchen', label: 'Full Kitchen / Restaurant', icon: '🍔', description: 'Fryers, ovens, grill' },
      { value: 'quick-serve', label: 'Quick Serve / Roller Grill', icon: '🌭', description: 'Hot dogs, pizza, warmers' },
      { value: 'coffee-only', label: 'Coffee / Beverages Only', icon: '☕', description: 'Coffee machines, fountain drinks' },
      { value: 'none', label: 'No Food Service', icon: '❌', description: 'Pre-packaged only' },
    ],
    smartDefault: 'quick-serve',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'carWash',
    type: 'buttons',
    section: 'operations',
    title: 'Car wash on-site',
    subtitle: 'Car wash adds 50-150 kW of intermittent peak load',
    options: [
      { value: 'tunnel', label: 'Tunnel Car Wash', icon: '🚿', description: 'High-volume, highest load' },
      { value: 'automatic', label: 'Automatic In-Bay', icon: '🚗', description: 'Single bay, moderate load' },
      { value: 'self-service', label: 'Self-Service Bays', icon: '💧', description: 'Pressure washers, lower load' },
      { value: 'none', label: 'No Car Wash', icon: '❌', description: 'Fuel + c-store only' },
    ],
    smartDefault: 'none',
    merlinTip: 'A tunnel car wash can spike demand by 100-150 kW. BESS absorbs these peaks, saving $500-1,500/month in demand charges.',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'demandCharges'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'EV charging infrastructure',
    subtitle: 'Gas stations are rapidly adding EV charging — the future revenue stream',
    options: [
      { value: 'dcfc-multiple', label: 'Multiple DC Fast (4+)', icon: '⚡', description: '150-350 kW chargers' },
      { value: 'dcfc-few', label: '1-3 DC Fast Chargers', icon: '🔋', description: 'Initial DCFC deployment' },
      { value: 'l2-only', label: 'Level 2 Only', icon: '🔌', description: 'Slower charging, lower load' },
      { value: 'planned', label: 'Planned / Evaluating', icon: '📋', description: 'Want to add EV charging' },
      { value: 'none', label: 'No EV Charging', icon: '⛽', description: 'Fuel only' },
    ],
    smartDefault: 'planned',
    merlinTip: 'A single 350 kW charger can double a gas station\'s peak demand. BESS is essential to avoid $50K+ in utility upgrade costs.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'evCharging', 'gridCapacity'],
  },
  {
    id: 'signage',
    type: 'buttons',
    section: 'operations',
    title: 'Exterior signage and canopy lighting',
    subtitle: 'Large LED signs and canopy lighting run 12-24 hours',
    options: [
      { value: 'large', label: 'Large LED Sign + Full Canopy', icon: '🔆', description: 'Highway-visible branding' },
      { value: 'standard', label: 'Standard Signage', icon: '💡', description: 'Normal brand signage' },
      { value: 'minimal', label: 'Minimal', icon: '🔅', description: 'Small sign, basic lighting' },
    ],
    smartDefault: 'standard',
    validation: { required: false },
    impactsCalculations: ['lightingLoad', 'baseLoad'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid can\'t support EV charging growth' },
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
      { value: 'reliable', label: 'Very Reliable', icon: '✅' },
      { value: 'occasional', label: 'Occasional Issues', icon: '⚡' },
      { value: 'frequent', label: 'Frequent Outages', icon: '⚠️' },
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
    title: 'Demand charges on utility bill',
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
    range: { min: 0, max: 10000, step: 100 },
    smartDefault: 3000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 10000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over pump islands?',
    subtitle: 'Pump island canopy generates solar power while providing weather cover for customers',
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
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Canopy or carport solar' },
      { value: 'planned', label: 'Planned / Considering', icon: '📋' },
      { value: 'none', label: 'No Solar', icon: '❌' },
    ],
    smartDefault: 'none',
    merlinTip: 'Fuel canopies are perfect for solar panels — already elevated, weather-protected, and visible to customers.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
];
