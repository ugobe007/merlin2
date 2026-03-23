/**
 * Complete Government & Public Facilities Questionnaire Configuration
 *
 * 18 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const governmentSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Building type and size', icon: '🏛️' },
  { id: 'operations', title: 'Operations & Systems', description: 'Critical systems and operations', icon: '🔧' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and resilience', icon: '⚡' },
  { id: 'solar', title: 'Sustainability & Goals', description: 'Mandates, solar, and procurement goals', icon: '☀️' },
];

export const governmentQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'facilityType',
    type: 'buttons',
    section: 'facility',
    title: 'Facility type',
    options: [
      { value: 'office', label: 'Administrative Office', icon: '🏢', description: 'City hall, federal office' },
      { value: 'public-safety', label: 'Public Safety', icon: '🚔', description: 'Police, fire, 911 center' },
      { value: 'water-treatment', label: 'Water / Wastewater', icon: '💧', description: 'Treatment plant, pump station' },
      { value: 'courthouse', label: 'Courthouse / Civic', icon: '⚖️' },
      { value: 'military', label: 'Military / Defense', icon: '🎖️' },
      { value: 'transit', label: 'Transit / Transportation', icon: '🚌' },
      { value: 'community-center', label: 'Community / Recreation', icon: '🏟️', description: 'Community center, library, park' },
      { value: 'school', label: 'K-12 School', icon: '🏫' },
    ],
    smartDefault: 'office',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'criticalLoads'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total facility square footage',
    range: { min: 5000, max: 500000, step: 5000 },
    smartDefault: 50000,
    unit: ' sq ft',
    merlinTip: 'Federal buildings average 30,000-100,000 sq ft. Larger campuses with multiple buildings should sum all conditioned space.',
    validation: { required: true, min: 5000, max: 500000 },
    impactsCalculations: ['peakDemand', 'annualConsumption'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / condition',
    options: [
      { value: 'new', label: 'New / Modern (< 10 yr)', icon: '🏗️', description: 'LEED compliant, efficient' },
      { value: 'mid-age', label: 'Mid-Age (10-30 yr)', icon: '🏢', description: 'May need upgrades' },
      { value: 'historic', label: 'Older / Historic (30+ yr)', icon: '🏛️', description: 'May have preservation rules' },
    ],
    smartDefault: 'mid-age',
    merlinTip: 'Many government buildings are 30+ years old. EO 14057 requires federal buildings to achieve net-zero emissions by 2045.',
    validation: { required: false },
    impactsCalculations: ['installCost', 'energyEfficiency'],
  },
  {
    id: 'campusOrStandalone',
    type: 'buttons',
    section: 'facility',
    title: 'Campus or standalone',
    options: [
      { value: 'standalone', label: 'Single Building', icon: '🏢' },
      { value: 'campus', label: 'Multi-Building Campus', icon: '🏘️', description: '3+ buildings, shared infrastructure' },
      { value: 'distributed', label: 'Distributed Sites', icon: '📍', description: 'Multiple separate locations' },
    ],
    smartDefault: 'standalone',
    validation: { required: false },
    impactsCalculations: ['systemSize', 'microgrid'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'criticalOperations',
    type: 'buttons',
    section: 'operations',
    title: 'Critical infrastructure priority',
    subtitle: 'Government facilities often have essential service mandates',
    options: [
      { value: 'tier-1', label: 'Tier 1 — Life Safety', icon: '🚨', description: '911, hospitals, emergency ops' },
      { value: 'tier-2', label: 'Tier 2 — Essential Services', icon: '⚠️', description: 'Water, police, fire, courts' },
      { value: 'tier-3', label: 'Tier 3 — Standard Government', icon: '🏢', description: 'Admin offices, DMV, parks' },
    ],
    smartDefault: 'tier-3',
    merlinTip: 'FEMA critical facility tiers determine required backup duration: Tier 1 needs 72+ hours, Tier 2 needs 48 hours, Tier 3 needs 24 hours.',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'bessMode'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'operations',
    title: 'Operating schedule',
    options: [
      { value: '24-7', label: '24/7 Operations', icon: '🕐', description: 'Always staffed (911, jail, water plant)' },
      { value: 'extended', label: 'Extended Hours (6am-10pm)', icon: '📅' },
      { value: 'business', label: 'Business Hours (8am-5pm)', icon: '🏢' },
      { value: 'school-hours', label: 'School Hours (7am-4pm)', icon: '🏫' },
    ],
    smartDefault: 'business',
    validation: { required: true },
    impactsCalculations: ['loadProfile', 'touArbitrage'],
  },
  {
    id: 'dataCenter',
    type: 'buttons',
    section: 'operations',
    title: 'Data center or server room',
    options: [
      { value: 'datacenter', label: 'Data Center / Server Room', icon: '🖥️', description: '50+ kW IT load' },
      { value: 'comms', label: 'Communications Center', icon: '📡', description: 'Radio tower, 911 dispatch' },
      { value: 'server-closet', label: 'Small Server Closet', icon: '🗄️', description: '< 20 kW IT load' },
      { value: 'none', label: 'No Significant IT', icon: '❌' },
    ],
    smartDefault: 'server-closet',
    merlinTip: 'Government IT systems often require N+1 redundancy. BESS provides clean backup without transfer switch delays.',
    validation: { required: false },
    impactsCalculations: ['baseLoad', 'criticalLoads'],
  },
  {
    id: 'evFleet',
    type: 'buttons',
    section: 'operations',
    title: 'Electric fleet vehicles / charging',
    subtitle: 'Federal fleet electrification mandate: 100% ZEV by 2035',
    options: [
      { value: 'fleet-active', label: 'Fleet Charging Active', icon: '🚗', description: '5+ EVs in fleet' },
      { value: 'fleet-planned', label: 'Planning Fleet EVs', icon: '📋' },
      { value: 'public-chargers', label: 'Public Chargers on Site', icon: '⚡' },
      { value: 'none', label: 'No EV Infrastructure', icon: '🚫' },
    ],
    smartDefault: 'none',
    merlinTip: 'Executive Order 14057 requires federal agencies to acquire 100% zero-emission vehicles by 2035. Fleet charging adds 100-500 kW.',
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
      { value: 'on-grid', label: 'Grid Connected', icon: '🔌' },
      { value: 'limited', label: 'Grid-Limited / Constrained', icon: '⚠️', description: 'Capacity constraints' },
      { value: 'off-grid', label: 'Off-Grid / Remote Site', icon: '🏜️' },
    ],
    smartDefault: 'on-grid',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Power reliability requirement',
    options: [
      { value: 'reliable', label: 'Standard Reliability', icon: '✅' },
      { value: 'occasional', label: 'Occasional Outages', icon: '⚡' },
      { value: 'unreliable', label: 'Frequent / Severe Weather', icon: '🌪️', description: 'Hurricane, ice storm risk' },
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
      { value: 'diesel', label: 'Diesel Generators', icon: '⛽', description: 'Traditional backup' },
      { value: 'natural-gas', label: 'Natural Gas Generators', icon: '🔥' },
      { value: 'both', label: 'Multiple Generators', icon: '🏭' },
      { value: 'none', label: 'No Backup Generation', icon: '❌' },
    ],
    smartDefault: 'diesel',
    merlinTip: 'Many government facilities still rely on aging diesel generators. BESS provides instant switchover (< 20ms) vs. generator start-up (10-30 seconds).',
    validation: { required: true },
    impactsCalculations: ['generatorSizing', 'hybridSystem'],
  },
  {
    id: 'demandCharges',
    type: 'buttons',
    section: 'energy',
    title: 'Demand charges on utility bill',
    options: [
      { value: 'high', label: 'Significant ($15+/kW)', icon: '💰', description: 'Peak shaving opportunity' },
      { value: 'moderate', label: 'Moderate ($5-15/kW)', icon: '📊' },
      { value: 'low', label: 'Low (< $5/kW)', icon: '📉' },
      { value: 'unknown', label: "Don't Know", icon: '❓' },
    ],
    smartDefault: 'unknown',
    validation: { required: true },
    impactsCalculations: ['peakShaving', 'payback'],
  },

  // ── SECTION 4: SOLAR & GOALS ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 100000, step: 1000 },
    smartDefault: 30000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 100000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over public parking?',
    subtitle: 'Public parking shade structures with solar — common for government ESG goals',
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
    title: 'Existing on-site solar',
    options: [
      { value: 'existing', label: 'Solar Installed', icon: '☀️' },
      { value: 'planned', label: 'Solar Planned / RFP', icon: '📋' },
      { value: 'ppa', label: 'PPA / Community Solar', icon: '📄', description: 'Virtual or offsite solar' },
      { value: 'none', label: 'No Solar', icon: '❌' },
    ],
    smartDefault: 'none',
    merlinTip: 'Federal agencies must deploy 10 GW of new solar by 2035 (EO 14057). Many state/local governments have similar mandates. BESS maximizes solar value.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'sustainabilityMandate',
    type: 'buttons',
    section: 'solar',
    title: 'Sustainability or energy mandate',
    subtitle: 'Government mandates can unlock additional funding',
    options: [
      { value: 'executive-order', label: 'Federal EO / State Mandate', icon: '📜', description: 'EO 14057, state clean energy law' },
      { value: 'climate-plan', label: 'Climate Action Plan', icon: '🌍' },
      { value: 'resilience', label: 'Resilience / Continuity Plan', icon: '🛡️' },
      { value: 'none', label: 'No Specific Mandate', icon: '📊' },
    ],
    smartDefault: 'none',
    merlinTip: 'Government BESS projects often qualify for enhanced ITC (30-50%), FEMA BRIC grants, DOE rebates, and state resilience funding.',
    validation: { required: true },
    impactsCalculations: ['incentives', 'itc'],
  },
];
