/**
 * Complete Indoor Farm / Vertical Farm Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const indoorFarmSections: Section[] = [
  { id: 'facility', title: 'Farm Profile', description: 'Type, size, and growing method', icon: '🌱' },
  { id: 'operations', title: 'Growing Systems & Climate', description: 'Lighting, HVAC, and irrigation', icon: '💡' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and energy management', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const indoorFarmQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'farmType',
    type: 'buttons',
    section: 'facility',
    title: 'Indoor farming type',
    options: [
      { value: 'vertical', label: 'Vertical Farm', icon: '🏢', description: 'Multi-tier stacked growing' },
      { value: 'greenhouse', label: 'Controlled-Environment Greenhouse', icon: '🏡', description: 'Supplemental lighting + climate control' },
      { value: 'container', label: 'Container Farm', icon: '📦', description: 'Shipping container-based growing' },
      { value: 'hybrid', label: 'Hybrid Indoor/Outdoor', icon: '🔄', description: 'Indoor starts, outdoor growing' },
    ],
    smartDefault: 'vertical',
    merlinTip: 'Vertical farms are the most energy-intensive agriculture — 30-60 W/sq ft of grow space, primarily from lighting. BESS enables off-peak electricity purchasing.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total growing area (sq ft)',
    subtitle: 'Canopy area, including stacked tiers',
    range: { min: 1000, max: 500000, step: 1000 },
    smartDefault: 20000,
    unit: ' sq ft',
    validation: { required: true, min: 1000, max: 500000 },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },
  {
    id: 'growingLevels',
    type: 'buttons',
    section: 'facility',
    title: 'Number of growing tiers/levels',
    subtitle: 'More tiers = more lighting load per sq ft of floor',
    options: [
      { value: '1', label: 'Single Layer', icon: '1️⃣', description: 'Greenhouse or single tier' },
      { value: '2-4', label: '2-4 Tiers', icon: '🔢', description: 'Standard vertical farm' },
      { value: '5-8', label: '5-8 Tiers', icon: '📊', description: 'High-density vertical farm' },
      { value: '9+', label: '9+ Tiers', icon: '🏢', description: 'Maximum density' },
    ],
    smartDefault: '2-4',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },
  {
    id: 'cropType',
    type: 'buttons',
    section: 'facility',
    title: 'Primary crop type',
    subtitle: 'Crop type determines light intensity (PPFD) requirements',
    options: [
      { value: 'leafy-greens', label: 'Leafy Greens / Herbs', icon: '🥬', description: 'Lower PPFD (200-400 µmol)' },
      { value: 'fruiting', label: 'Fruiting Crops (Tomato, Pepper)', icon: '🍅', description: 'Higher PPFD (400-600 µmol)' },
      { value: 'cannabis', label: 'Cannabis / Hemp', icon: '🌿', description: 'Highest PPFD (600-1000 µmol)' },
      { value: 'microgreens', label: 'Microgreens / Sprouts', icon: '🌱', description: 'Lower PPFD, fast cycle' },
    ],
    smartDefault: 'leafy-greens',
    merlinTip: 'Cannabis cultivation uses 2-3x more light intensity than leafy greens. A 20,000 sq ft cannabis grow can draw 500-1,500 kW from lighting alone.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'lightingSystem',
    type: 'buttons',
    section: 'operations',
    title: 'Grow lighting technology',
    subtitle: 'Lighting is 50-70% of total energy in indoor farms',
    options: [
      { value: 'led', label: 'LED (Full Spectrum)', icon: '💡', description: 'Most efficient, 2.5-3.0 µmol/J' },
      { value: 'hps', label: 'HPS (High Pressure Sodium)', icon: '🔆', description: 'Legacy, 1.5-1.7 µmol/J' },
      { value: 'hybrid', label: 'LED + HPS Mix', icon: '🔄', description: 'Transitioning to LED' },
      { value: 'supplemental', label: 'Supplemental Only', icon: '☀️', description: 'Greenhouse with natural light' },
    ],
    smartDefault: 'led',
    merlinTip: 'Full LED farms typically draw 25-40 W/sq ft of canopy. HPS is 40-60 W/sq ft. The switch to LED cuts energy 40-50% but the load is still massive.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },
  {
    id: 'lightSchedule',
    type: 'buttons',
    section: 'operations',
    title: 'Daily light schedule',
    subtitle: 'Light schedule determines peak demand timing',
    options: [
      { value: '18-6', label: '18/6 (18 hr on, 6 off)', icon: '🌅', description: 'Vegetative growth' },
      { value: '12-12', label: '12/12 (12 hr on, 12 off)', icon: '🌗', description: 'Flowering/fruiting' },
      { value: '16-8', label: '16/8 (16 hr on, 8 off)', icon: '🌤️', description: 'Leafy greens standard' },
      { value: 'mixed', label: 'Mixed Rooms/Zones', icon: '🔄', description: 'Different schedules per zone' },
    ],
    smartDefault: '16-8',
    merlinTip: 'Running lights during off-peak electricity hours (10pm-6am) can save 30-50% on energy costs. BESS enables this by providing power during transitions.',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },
  {
    id: 'hvacDehumidification',
    type: 'buttons',
    section: 'operations',
    title: 'HVAC & dehumidification',
    subtitle: 'Climate control is 20-30% of indoor farm energy',
    options: [
      { value: 'dedicated', label: 'Dedicated Grow HVAC', icon: '❄️', description: 'Purpose-built for high-humidity' },
      { value: 'standard', label: 'Standard Commercial HVAC', icon: '🌡️', description: 'Adapted for growing' },
      { value: 'minimal', label: 'Minimal (Greenhouse)', icon: '💨', description: 'Ventilation + evaporative' },
    ],
    smartDefault: 'dedicated',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'irrigationSystem',
    type: 'buttons',
    section: 'operations',
    title: 'Irrigation / nutrient system',
    options: [
      { value: 'nft', label: 'NFT (Nutrient Film)', icon: '💧', description: 'Continuous flow, pumps always on' },
      { value: 'dwc', label: 'DWC (Deep Water Culture)', icon: '🌊', description: 'Air pumps, lower water pumping' },
      { value: 'aeroponics', label: 'Aeroponics', icon: '💨', description: 'Misting pumps, highest precision' },
      { value: 'drip', label: 'Drip / Ebb-Flow', icon: '🚿', description: 'Timer-based, moderate pumping' },
    ],
    smartDefault: 'nft',
    validation: { required: false },
    impactsCalculations: ['baseLoad'],
  },
  {
    id: 'waterTreatment',
    type: 'buttons',
    section: 'operations',
    title: 'Water treatment on-site',
    options: [
      { value: 'ro', label: 'Reverse Osmosis', icon: '🔬', description: 'RO system for water purification' },
      { value: 'basic', label: 'Basic Filtration', icon: '💧' },
      { value: 'none', label: 'Municipal Water', icon: '🚰' },
    ],
    smartDefault: 'basic',
    validation: { required: false },
    impactsCalculations: ['baseLoad'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️' },
      { value: 'off-grid', label: 'Off-Grid / Remote', icon: '🏜️' },
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
    merlinTip: 'Even a 2-hour power outage can stress plants and reduce yield by 10-20%. Extended outages destroy entire crop cycles worth $50K-500K.',
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

  // ── SECTION 4: SOLAR & GOALS ──
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
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Shift lighting to off-peak hours' },
      { value: 'resilience', label: 'Crop Protection', icon: '🛡️', description: 'Prevent crop loss from outages' },
      { value: 'sustainability', label: 'Sustainable Agriculture', icon: '🌿', description: 'Reduce carbon footprint' },
      { value: 'off-grid', label: 'Off-Grid / Remote Growing', icon: '🏜️', description: 'Grow where there\'s no grid' },
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
