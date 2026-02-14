/**
 * Complete Casino & Gaming Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const casinoSections: Section[] = [
  { id: 'facility', title: 'Property Profile', description: 'Size, type, and floor space', icon: '🎰' },
  { id: 'operations', title: 'Operations & Amenities', description: 'Gaming floor, hotel, restaurants, entertainment', icon: '🎲' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand profile', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const casinoQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'casinoType',
    type: 'buttons',
    section: 'facility',
    title: 'Property type',
    options: [
      { value: 'resort-casino', label: 'Resort / Integrated Casino', icon: '🏨', description: 'Hotel + gaming + entertainment + dining' },
      { value: 'standalone', label: 'Standalone Casino', icon: '🎰', description: 'Gaming floor, bars, restaurants only' },
      { value: 'tribal', label: 'Tribal Casino', icon: '🏛️', description: 'Tribal gaming operation' },
      { value: 'racino', label: 'Racino / Slots Parlor', icon: '🏇', description: 'Racing + gaming, smaller scale' },
    ],
    smartDefault: 'resort-casino',
    merlinTip: 'Resort casinos consume 5-15 MW due to 24/7 lighting, HVAC, and entertainment systems. They\'re some of the highest energy-intensity buildings in the US.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'gamingFloorSqft',
    type: 'slider',
    section: 'facility',
    title: 'Gaming floor area',
    subtitle: 'Total slot + table game floor space',
    range: { min: 5000, max: 500000, step: 5000 },
    smartDefault: 100000,
    unit: ' sq ft',
    merlinTip: 'Gaming floors: 8-12 W/sq ft (24/7 lighting, HVAC, slot machines, displays). Much higher than typical office (4-6 W/sq ft).',
    validation: { required: true, min: 5000, max: 500000 },
    impactsCalculations: ['peakDemand', 'lightingLoad'],
  },
  {
    id: 'totalPropertySqFt',
    type: 'slider',
    section: 'facility',
    title: 'Total property square footage',
    subtitle: 'Including hotel towers, convention space, back of house',
    range: { min: 20000, max: 5000000, step: 10000 },
    smartDefault: 500000,
    unit: ' sq ft',
    validation: { required: true, min: 20000, max: 5000000 },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'hotelRooms',
    type: 'buttons',
    section: 'facility',
    title: 'Hotel rooms (if resort)',
    options: [
      { value: 'none', label: 'No Hotel', icon: '❌' },
      { value: 'small', label: '< 500 Rooms', icon: '🏨' },
      { value: 'medium', label: '500-1,500 Rooms', icon: '🏢' },
      { value: 'large', label: '1,500-3,000 Rooms', icon: '🏙️' },
      { value: 'mega', label: '3,000+ Rooms', icon: '🌐', description: 'Vegas-scale resort' },
    ],
    smartDefault: 'medium',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'restaurants',
    type: 'buttons',
    section: 'operations',
    title: 'Number of restaurants / food outlets',
    options: [
      { value: '1-3', label: '1-3 Venues', icon: '🍽️' },
      { value: '4-8', label: '4-8 Venues', icon: '🍔' },
      { value: '9-15', label: '9-15 Venues', icon: '🥘' },
      { value: '15+', label: '15+ Venues', icon: '🌐', description: 'Major resort food hall' },
    ],
    smartDefault: '4-8',
    merlinTip: 'Casino restaurants and kitchens run 18-24 hours. Each full-service kitchen draws 75-200 kW.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'kitchenLoad'],
  },
  {
    id: 'entertainmentVenues',
    type: 'buttons',
    section: 'operations',
    title: 'Entertainment / convention space',
    subtitle: 'Showrooms, arenas, convention halls',
    options: [
      { value: 'arena', label: 'Arena / Large Showroom', icon: '🎭', description: '2,000+ seats, major shows' },
      { value: 'showroom', label: 'Showroom / Theater', icon: '🎬', description: '500-2,000 seat venue' },
      { value: 'convention', label: 'Convention Center', icon: '🏛️', description: 'Large meeting/convention space' },
      { value: 'lounge', label: 'Lounges / Bars Only', icon: '🍸', description: 'Smaller entertainment spaces' },
      { value: 'none', label: 'No Major Venues', icon: '❌' },
    ],
    smartDefault: 'showroom',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'intermittentLoad'],
  },
  {
    id: 'poolSpa',
    type: 'buttons',
    section: 'operations',
    title: 'Pool / spa complex',
    options: [
      { value: 'large', label: 'Large Pool Complex', icon: '🏊', description: 'Multiple pools, lazy river, club' },
      { value: 'standard', label: 'Standard Pool + Spa', icon: '💆' },
      { value: 'none', label: 'No Pool / Spa', icon: '❌' },
    ],
    smartDefault: 'standard',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'parkingGarage',
    type: 'buttons',
    section: 'operations',
    title: 'Parking facilities',
    options: [
      { value: 'large-garage', label: 'Large Garage (3,000+ spaces)', icon: '🅿️' },
      { value: 'small-garage', label: 'Smaller Garage', icon: '🏗️' },
      { value: 'surface', label: 'Surface Lots', icon: '🚗' },
    ],
    smartDefault: 'large-garage',
    validation: { required: false },
    impactsCalculations: ['lightingLoad', 'solarPotential', 'evCharging'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'EV charging for guests',
    options: [
      { value: 'yes-dcfc', label: 'DC Fast + Level 2', icon: '⚡' },
      { value: 'yes-l2', label: 'Level 2 Only', icon: '🔌' },
      { value: 'planned', label: 'Planned / Evaluating', icon: '📋' },
      { value: 'none', label: 'None', icon: '❌' },
    ],
    smartDefault: 'yes-l2',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️' },
    ],
    smartDefault: 'redundant',
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
    merlinTip: 'Casinos lose $100K-500K per hour of downtime in gaming revenue alone. BESS provides instant transfer that generators can\'t match.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generation',
    options: [
      { value: 'yes-extensive', label: 'Extensive Backup', icon: '⛽', description: 'Full property coverage' },
      { value: 'yes-partial', label: 'Partial Backup', icon: '🔋', description: 'Critical systems only' },
      { value: 'none', label: 'No Backup', icon: '❌' },
    ],
    smartDefault: 'yes-extensive',
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
    merlinTip: 'Many casino resorts in Nevada and Arizona are deploying MW-scale solar + storage. MGM\'s Mandalay Bay has a 6.3 MW rooftop array.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving on massive demand charges' },
      { value: 'resilience', label: 'Business Continuity', icon: '🛡️', description: 'Zero downtime for gaming operations' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Green gaming certification' },
      { value: 'capacity', label: 'Expansion Support', icon: '🔌', description: 'New tower/venue without grid upgrade' },
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
