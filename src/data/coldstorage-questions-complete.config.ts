/**
 * Complete Cold Storage Questionnaire Configuration
 *
 * 18 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const coldStorageSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Size, type, and temperature zones', icon: '🧊' },
  { id: 'operations', title: 'Refrigeration & Operations', description: 'Compressors, docks, and throughput', icon: '❄️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand profile', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const coldStorageQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'facilityType',
    type: 'buttons',
    section: 'facility',
    title: 'Cold storage facility type',
    options: [
      { value: 'distribution', label: 'Cold Distribution Center', icon: '📦', description: 'Receive, store, ship temperature-controlled goods' },
      { value: 'processing', label: 'Food Processing + Cold Storage', icon: '🏭', description: 'On-site processing with cold rooms' },
      { value: 'pharmaceutical', label: 'Pharmaceutical Cold Chain', icon: '💊', description: 'Strict temperature compliance' },
      { value: 'blast-freezing', label: 'Blast Freezing Facility', icon: '🧊', description: 'Rapid freeze operations' },
    ],
    smartDefault: 'distribution',
    merlinTip: 'Cold storage is the most energy-intensive commercial building type. Refrigeration alone draws 5-15 W/sq ft — 3-5x more than standard warehouse.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total facility square footage',
    range: { min: 5000, max: 1000000, step: 5000 },
    smartDefault: 50000,
    unit: ' sq ft',
    validation: { required: true, min: 5000, max: 1000000 },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },
  {
    id: 'temperatureZones',
    type: 'buttons',
    section: 'facility',
    title: 'Temperature zones',
    subtitle: 'Lower temperatures = exponentially higher energy consumption',
    options: [
      { value: 'cooler-only', label: 'Cooler Only (34-40°F)', icon: '❄️', description: 'Produce, dairy, beverages' },
      { value: 'freezer-only', label: 'Freezer Only (-10 to 0°F)', icon: '🧊', description: 'Frozen goods' },
      { value: 'multi-temp', label: 'Multi-Temperature', icon: '🌡️', description: 'Cooler + freezer + ambient zones' },
      { value: 'ultra-low', label: 'Ultra-Low (-40°F or below)', icon: '❄️', description: 'Pharma, specialty foods' },
    ],
    smartDefault: 'multi-temp',
    merlinTip: 'Freezer zones consume 2-3x more energy than cooler zones. Ultra-low (-40°F) uses 4-5x more. Temperature set-point is the #1 energy cost driver.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },
  {
    id: 'dockDoors',
    type: 'buttons',
    section: 'facility',
    title: 'Number of dock doors',
    subtitle: 'Dock activity causes massive infiltration losses',
    options: [
      { value: 'small', label: '1-5 Doors', icon: '🚪' },
      { value: 'medium', label: '6-15 Doors', icon: '🚛' },
      { value: 'large', label: '15-30 Doors', icon: '🏭' },
      { value: 'mega', label: '30+ Doors', icon: '🌐' },
    ],
    smartDefault: 'medium',
    merlinTip: 'Each open dock door lets in warm air that the compressors must remove. Fast-acting doors and dock seals reduce infiltration 60-80%.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'infiltrationLoad'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'compressorSystem',
    type: 'buttons',
    section: 'operations',
    title: 'Refrigeration compressor system',
    subtitle: 'System type determines efficiency, peak draw, and BESS compatibility',
    options: [
      { value: 'ammonia-central', label: 'Central Ammonia (NH3)', icon: '🏭', description: 'Industrial, most efficient, 100+ ton' },
      { value: 'freon-distributed', label: 'Distributed Freon/HFC', icon: '❄️', description: 'Multiple packaged units' },
      { value: 'cascade', label: 'Cascade System', icon: '🔄', description: 'Multi-stage for ultra-low temp' },
      { value: 'co2-transcritical', label: 'CO2 Transcritical', icon: '🌿', description: 'Natural refrigerant, newer tech' },
    ],
    smartDefault: 'ammonia-central',
    merlinTip: 'Ammonia systems are the most efficient but draw 300-1,000+ kW at peak. Compressor cycling creates significant demand spikes that BESS can smooth.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'operations',
    title: 'Shipping/receiving hours',
    options: [
      { value: '1-shift', label: '1 Shift (8 hr)', icon: '🌅' },
      { value: '2-shift', label: '2 Shifts (16 hr)', icon: '🌆' },
      { value: '3-shift', label: '3 Shifts (24/7)', icon: '🌐' },
    ],
    smartDefault: '2-shift',
    merlinTip: 'Refrigeration runs 24/7 regardless of operating hours. But shipping/receiving activity drives demand peaks through dock door infiltration and forklift charging.',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },
  {
    id: 'defrostCycles',
    type: 'buttons',
    section: 'operations',
    title: 'Defrost cycle management',
    subtitle: 'Defrost cycles create predictable demand spikes',
    options: [
      { value: 'electric', label: 'Electric Defrost', icon: '⚡', description: 'Highest demand spike impact' },
      { value: 'hot-gas', label: 'Hot Gas Defrost', icon: '🔥', description: 'Moderate impact' },
      { value: 'scheduled', label: 'Scheduled / Off-Peak', icon: '⏰', description: 'Already managed for demand' },
    ],
    smartDefault: 'electric',
    merlinTip: 'Electric defrost cycles can spike demand by 50-200 kW for 15-30 minutes. BESS can absorb these spikes, saving $1,000-5,000/month in demand charges.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'demandCharges'],
  },
  {
    id: 'materialHandling',
    type: 'buttons',
    section: 'operations',
    title: 'Material handling equipment',
    options: [
      { value: 'electric-fleet', label: 'Electric Forklift Fleet', icon: '🔋', description: 'Battery-powered cold-rated forklifts' },
      { value: 'automated', label: 'Automated Systems (ASRS)', icon: '🤖', description: 'Automated storage/retrieval' },
      { value: 'manual', label: 'Mostly Manual / Propane', icon: '👷' },
    ],
    smartDefault: 'electric-fleet',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'chargingLoad'],
  },
  {
    id: 'throughput',
    type: 'buttons',
    section: 'operations',
    title: 'Daily throughput volume',
    subtitle: 'Higher throughput = more dock activity = more demand spikes',
    options: [
      { value: 'high', label: 'High (50+ trucks/day)', icon: '🚛' },
      { value: 'medium', label: 'Medium (15-50 trucks/day)', icon: '🚛' },
      { value: 'low', label: 'Low (< 15 trucks/day)', icon: '📦' },
    ],
    smartDefault: 'medium',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'infiltrationLoad'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Utility can\'t support expansion' },
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
    merlinTip: 'Cold storage can lose $100K-1M in product per extended outage. Pharmaceutical cold chain losses can be catastrophic. BESS provides instant bridge power.',
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
    merlinTip: 'Cold storage facilities often have the highest demand charges in commercial real estate. BESS ROI in cold storage is typically 2-4 year payback.',
    validation: { required: true },
    impactsCalculations: ['demandChargeSavings', 'payback'],
  },

  // ── SECTION 4: SOLAR & GOALS ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 150000, step: 1000 },
    smartDefault: 60000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 150000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over yard/loading areas?',
    subtitle: 'Loading dock or staging area canopy solar generation',
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
      { value: 'cost', label: 'Reduce Demand Charges', icon: '💰', description: 'Peak shaving on compressor spikes' },
      { value: 'resilience', label: 'Product Protection', icon: '🛡️', description: 'Prevent cold chain breaks' },
      { value: 'capacity', label: 'Support Expansion', icon: '🔌', description: 'Grow without grid upgrade' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Carbon reduction goals' },
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
