/**
 * Complete Warehouse & Logistics Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: warehouse_load_v1 (requiredInputs: squareFootage)
 *
 * Sections:
 *   1. Facility (Q1-4)    — warehouseType, squareFootage, ceilingHeight, dockDoors
 *   2. Operations (Q5-9)  — operatingHours, refrigeration, materialHandling, automationLevel, evFleet
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, demandCharges
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const warehouseSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Warehouse type and configuration', icon: '📦' },
  { id: 'operations', title: 'Operations & Equipment', description: 'Material handling and automation', icon: '🏗️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand profile', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const warehouseQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'warehouseType',
    type: 'buttons',
    section: 'facility',
    title: 'Warehouse type',
    subtitle: 'Facility type determines energy intensity and load profile',
    options: [
      { value: 'distribution', label: 'Distribution Center', icon: '📦', description: 'High throughput, sorting, shipping' },
      { value: 'fulfillment', label: 'E-Commerce Fulfillment', icon: '🛒', description: 'Pick/pack/ship, automation' },
      { value: 'cold-storage', label: 'Cold / Frozen Storage', icon: '🧊', description: 'Temperature-controlled' },
      { value: 'general', label: 'General Storage', icon: '🏢', description: 'Dry goods, low activity' },
      { value: '3pl', label: '3PL / Multi-Client', icon: '🔄', description: 'Third-party logistics hub' },
    ],
    smartDefault: 'distribution',
    merlinTip: 'Cold storage warehouses use 3-5x more energy than general storage. Fulfillment centers have high automation loads.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total facility square footage',
    subtitle: 'Include all warehouse, office, and dock areas',
    range: { min: 10000, max: 2000000, step: 10000 },
    smartDefault: 200000,
    unit: ' sq ft',
    merlinTip: 'Standard warehouse: 1.5-3 W/sq ft. Cold storage: 5-10 W/sq ft. Fulfillment: 3-6 W/sq ft.',
    validation: { required: true, min: 10000, max: 2000000 },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },
  {
    id: 'ceilingHeight',
    type: 'buttons',
    section: 'facility',
    title: 'Clear ceiling height',
    subtitle: 'Height affects HVAC volume and lighting requirements',
    options: [
      { value: 'standard', label: '20-28 ft', icon: '📏', description: 'Standard warehouse' },
      { value: 'high', label: '28-36 ft', icon: '📐', description: 'High-bay racking' },
      { value: 'mega', label: '36+ ft', icon: '🏗️', description: 'Mega distribution center' },
    ],
    smartDefault: 'standard',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },
  {
    id: 'dockDoors',
    type: 'buttons',
    section: 'facility',
    title: 'Number of loading dock doors',
    subtitle: 'Dock activity drives ventilation and material handling loads',
    options: [
      { value: 'small', label: '1-10 Doors', icon: '🚪', description: 'Small operation' },
      { value: 'medium', label: '10-50 Doors', icon: '🚛', description: 'Mid-size distribution' },
      { value: 'large', label: '50-100 Doors', icon: '🏭', description: 'Large distribution center' },
      { value: 'mega', label: '100+ Doors', icon: '🌐', description: 'Mega cross-dock facility' },
    ],
    smartDefault: 'medium',
    validation: { required: false },
    impactsCalculations: ['ventilationLoad'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'operations',
    title: 'Operating schedule',
    options: [
      { value: '1-shift', label: '1 Shift (8 hr)', icon: '🌅', description: 'Day operations only' },
      { value: '2-shift', label: '2 Shifts (16 hr)', icon: '🌆', description: 'Day + evening' },
      { value: '3-shift', label: '3 Shifts (24/7)', icon: '🌐', description: 'Continuous operation' },
      { value: 'seasonal', label: 'Seasonal Peaks', icon: '📊', description: 'Holiday surge periods' },
    ],
    smartDefault: '2-shift',
    merlinTip: 'E-commerce fulfillment centers often surge to 24/7 during holiday season. BESS helps manage seasonal demand spikes.',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },
  {
    id: 'refrigeration',
    type: 'buttons',
    section: 'operations',
    title: 'Refrigeration requirements',
    subtitle: 'Refrigeration can be 60-70% of a cold storage facility\'s energy use',
    options: [
      { value: 'none', label: 'No Refrigeration', icon: '🏢', description: 'Ambient temperature only' },
      { value: 'cooler', label: 'Cooler Only (35-45°F)', icon: '❄️', description: 'Produce, dairy, beverages' },
      { value: 'freezer', label: 'Freezer (-10 to 0°F)', icon: '🧊', description: 'Frozen goods' },
      { value: 'both', label: 'Cooler + Freezer', icon: '🌡️', description: 'Multi-temperature zones' },
    ],
    smartDefault: 'none',
    merlinTip: 'Freezer compressors are the #1 demand charge driver in cold storage. BESS can save $50K-200K/year in demand charges.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad', 'demandCharges'],
  },
  {
    id: 'materialHandling',
    type: 'buttons',
    section: 'operations',
    title: 'Material handling equipment',
    subtitle: 'Forklifts, conveyors, and sorting systems',
    options: [
      { value: 'electric-forklifts', label: 'Electric Forklifts', icon: '🔋', description: 'Battery-powered fleet' },
      { value: 'conveyors', label: 'Conveyor Systems', icon: '🔄', description: 'Automated sortation' },
      { value: 'both', label: 'Forklifts + Conveyors', icon: '⚙️', description: 'Full automation' },
      { value: 'manual', label: 'Mostly Manual', icon: '👷', description: 'Minimal powered equipment' },
    ],
    smartDefault: 'electric-forklifts',
    merlinTip: 'A fleet of 20 electric forklifts charging simultaneously draws 100-200 kW. Smart BESS scheduling can spread this load.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'chargingLoad'],
  },
  {
    id: 'automationLevel',
    type: 'buttons',
    section: 'operations',
    title: 'Automation level',
    subtitle: 'Robotics and automation increase electrical load significantly',
    options: [
      { value: 'minimal', label: 'Minimal Automation', icon: '👷', description: 'Mostly manual labor' },
      { value: 'moderate', label: 'Moderate Automation', icon: '🤖', description: 'Some automated sorting/picking' },
      { value: 'high', label: 'Highly Automated', icon: '🏭', description: 'Robots, AGVs, automated storage' },
    ],
    smartDefault: 'moderate',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'evFleet',
    type: 'buttons',
    section: 'operations',
    title: 'Electric vehicle fleet (delivery trucks)',
    subtitle: 'Fleet electrification is the fastest-growing warehouse load',
    options: [
      { value: 'yes-large', label: 'Large EV Fleet (20+)', icon: '🚛', description: 'Major depot charging' },
      { value: 'yes-small', label: 'Small EV Fleet (1-20)', icon: '🔋', description: 'Growing EV adoption' },
      { value: 'planned', label: 'Planned Electrification', icon: '📋', description: 'Transitioning to EVs' },
      { value: 'none', label: 'No EV Fleet', icon: '⛽', description: 'Conventional vehicles' },
    ],
    smartDefault: 'none',
    merlinTip: 'Fleet depot charging can add 1-10 MW of peak load. BESS enables overnight charging without utility upgrades.',
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
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid can\'t support growth' },
      { value: 'off-grid', label: 'Remote / Off-Grid', icon: '🏜️', description: 'No utility connection' },
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
    subtitle: 'Peak demand charges are often 30-50% of warehouse electric bills',
    options: [
      { value: 'high', label: 'High ($15-30+/kW)', icon: '🔴', description: 'Excellent BESS ROI' },
      { value: 'moderate', label: 'Moderate ($8-15/kW)', icon: '🟡', description: 'Good BESS opportunity' },
      { value: 'low', label: 'Low (< $8/kW)', icon: '🟢', description: 'Marginal benefit' },
      { value: 'unknown', label: "Don't Know", icon: '❓', description: "We'll estimate from location" },
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
    range: { min: 0, max: 300000, step: 5000 },
    smartDefault: 100000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 300000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over dock/yard areas?',
    subtitle: 'Loading dock or truck staging area canopy solar generation',
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
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Rooftop solar panels' },
      { value: 'planned', label: 'Planned / Considering', icon: '📋', description: 'Pair with BESS for maximum ROI' },
      { value: 'none', label: 'No Solar Yet', icon: '🔌', description: 'Warehouse roofs are ideal for solar' },
    ],
    smartDefault: 'none',
    merlinTip: 'Warehouses have the best solar ROI in commercial real estate — massive, flat, unobstructed roofs. A 200,000 sq ft roof can host 1-2 MW of solar.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'solarCapacityKW',
    type: 'number_input',
    section: 'solar',
    title: 'Existing solar system size',
    subtitle: 'Approximate capacity of your current solar installation',
    placeholder: 'e.g., 750',
    suffix: 'kW',
    smartDefault: 750,
    helpText: 'Large warehouse rooftops can support 500 kW to 2+ MW of solar. Check your solar inverter or monitoring portal.',
    validation: { required: false, min: 1, max: 20000 },
    impactsCalculations: ['solarSizing', 'bessMode'],
    conditionalLogic: {
      dependsOn: 'existingSolar',
      showIf: (value: unknown) => value === 'existing',
    },
  },
];
