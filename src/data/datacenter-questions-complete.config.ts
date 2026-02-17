/**
 * Complete Data Center Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: dc_load_v1 (requiredInputs: itLoadCapacity, currentPUE, itUtilization, dataCenterTier)
 *
 * Sections:
 *   1. Facility (Q1-4)    — dataCenterTier, squareFootage, itLoadCapacity, currentPUE
 *   2. Operations (Q5-9)  — itUtilization, coolingSystem, redundancy, rackDensity, requiredRuntime
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, existingUPS
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

// ============================================================================
// SECTIONS
// ============================================================================

export const datacenterSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Tier, capacity, and infrastructure', icon: '🖥️' },
  { id: 'operations', title: 'Operations & Cooling', description: 'IT load, PUE, and redundancy', icon: '❄️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and backup systems', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

// ============================================================================
// QUESTIONS (16)
// ============================================================================

export const datacenterQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'dataCenterTier',
    type: 'buttons',
    section: 'facility',
    title: 'Uptime Institute tier classification',
    subtitle: 'Tier level determines redundancy, uptime SLA, and backup requirements',
    options: [
      { value: 'tier_1', label: 'Tier I', icon: '🟢', description: '99.671% uptime — basic, non-redundant' },
      { value: 'tier_2', label: 'Tier II', icon: '🟡', description: '99.741% uptime — redundant capacity components' },
      { value: 'tier_3', label: 'Tier III', icon: '🟠', description: '99.982% uptime — concurrently maintainable' },
      { value: 'tier_4', label: 'Tier IV', icon: '🔴', description: '99.995% uptime — fault-tolerant 2N+1' },
    ],
    smartDefault: 'tier_3',
    merlinTip: 'Tier III is the most common for enterprise colocation. Tier IV adds 30-50% to infrastructure cost but provides near-zero downtime.',
    validation: { required: true },
    impactsCalculations: ['redundancy', 'backupCapacity', 'bessRequirements'],
  },
  {
    id: 'squareFootage',
    type: 'range_buttons',
    section: 'facility',
    title: 'Total data center floor area',
    subtitle: 'White space + support infrastructure',
    rangeConfig: {
      ranges: [
        { label: 'Edge (< 5K)', min: 1000, max: 5000 },
        { label: 'Small (5-25K)', min: 5000, max: 25000 },
        { label: 'Medium (25-100K)', min: 25000, max: 100000 },
        { label: 'Large (100K+)', min: 100000, max: null },
      ],
      suffix: ' sq ft',
    },
    smartDefault: '50000',
    merlinTip: 'A typical enterprise colocation is 25-100K sq ft. Hyperscale campuses exceed 500K sq ft.',
    validation: { required: false },
    impactsCalculations: ['coolingLoad', 'lightingLoad'],
  },
  {
    id: 'itLoadCapacity',
    type: 'slider',
    section: 'facility',
    title: 'Total IT critical load capacity',
    subtitle: 'Aggregate power draw of all IT equipment (servers, storage, networking)',
    range: { min: 50, max: 50000, step: 50 },
    smartDefault: 2000,
    unit: ' kW',
    merlinTip: 'Average rack draws 5-8 kW. High-density AI/GPU racks can draw 30-60 kW each. A 200-rack facility typically needs 1-4 MW.',
    validation: { required: true, min: 50, max: 50000 },
    impactsCalculations: ['peakDemand', 'bessCapacity', 'coolingLoad'],
  },
  {
    id: 'currentPUE',
    type: 'buttons',
    section: 'facility',
    title: 'Current Power Usage Effectiveness (PUE)',
    subtitle: 'Total facility power ÷ IT equipment power',
    options: [
      { value: '1.1-1.3', label: 'Excellent (1.1-1.3)', icon: '🟢', description: 'Modern, highly optimized cooling' },
      { value: '1.3-1.5', label: 'Good (1.3-1.5)', icon: '🟡', description: 'Industry average, efficient operations' },
      { value: '1.5-1.8', label: 'Average (1.5-1.8)', icon: '🟠', description: 'Older infrastructure, room to improve' },
      { value: '1.8-2.5', label: 'Poor (1.8-2.5)', icon: '🔴', description: 'Significant cooling inefficiency' },
    ],
    smartDefault: '1.3-1.5',
    merlinTip: 'Google runs at 1.10 PUE. Industry average is ~1.58. Every 0.1 PUE reduction saves 5-7% on total energy costs.',
    validation: { required: true },
    impactsCalculations: ['coolingLoad', 'totalFacilityPower', 'annualEnergy'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'itUtilization',
    type: 'buttons',
    section: 'operations',
    title: 'Average IT utilization',
    subtitle: 'How much of your IT capacity is actively used',
    options: [
      { value: '20-40%', label: 'Low (20-40%)', icon: '📉', description: 'Under-utilized, significant headroom' },
      { value: '40-60%', label: 'Moderate (40-60%)', icon: '📊', description: 'Typical enterprise deployment' },
      { value: '60-80%', label: 'High (60-80%)', icon: '📈', description: 'Well-utilized, planning expansion' },
      { value: '80-95%', label: 'Near Capacity (80-95%)', icon: '🔥', description: 'Approaching limits, expansion needed' },
    ],
    smartDefault: '60-80%',
    merlinTip: 'Higher utilization means BESS must cover closer to full IT load during outages.',
    validation: { required: true },
    impactsCalculations: ['averageLoadKW', 'bessCapacity'],
  },
  {
    id: 'coolingSystem',
    type: 'buttons',
    section: 'operations',
    title: 'Primary cooling system',
    subtitle: 'Cooling is typically the largest non-IT power consumer',
    options: [
      { value: 'air', label: 'Air-Cooled (CRAC/CRAH)', icon: '💨', description: 'Traditional raised-floor cooling' },
      { value: 'chilled-water', label: 'Chilled Water', icon: '💧', description: 'Central plant with chillers' },
      { value: 'liquid', label: 'Direct Liquid Cooling', icon: '🔵', description: 'Rack-level liquid (GPU/AI workloads)' },
      { value: 'hybrid', label: 'Hybrid Air + Liquid', icon: '🔄', description: 'Mixed cooling for varied densities' },
      { value: 'free-cooling', label: 'Free Cooling / Economizer', icon: '🌿', description: 'Outside air + evaporative assist' },
    ],
    smartDefault: 'chilled-water',
    merlinTip: 'Liquid cooling can reduce PUE by 0.2-0.4 vs air cooling. Free cooling works well in cool climates.',
    validation: { required: true },
    impactsCalculations: ['coolingLoad', 'pue'],
  },
  {
    id: 'redundancy',
    type: 'buttons',
    section: 'operations',
    title: 'Power redundancy configuration',
    subtitle: 'Level of power distribution redundancy',
    options: [
      { value: 'N', label: 'N (No Redundancy)', icon: '1️⃣', description: 'Single path, any failure = downtime' },
      { value: 'N+1', label: 'N+1', icon: '🔧', description: 'One extra component per group' },
      { value: '2N', label: '2N (Fully Redundant)', icon: '🔒', description: 'Completely parallel systems' },
      { value: '2N+1', label: '2N+1', icon: '🛡️', description: 'Fully redundant + one spare' },
    ],
    smartDefault: 'N+1',
    merlinTip: '2N redundancy doubles infrastructure cost but ensures zero single points of failure.',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'bessRequirements'],
  },
  {
    id: 'rackDensity',
    type: 'buttons',
    section: 'operations',
    title: 'Average rack power density',
    subtitle: 'Power draw per rack — AI/GPU workloads are much higher',
    options: [
      { value: 'low', label: 'Low (3-5 kW)', icon: '🟢', description: 'Storage, network, light compute' },
      { value: 'standard', label: 'Standard (5-10 kW)', icon: '🟡', description: 'General purpose compute' },
      { value: 'high', label: 'High (10-20 kW)', icon: '🟠', description: 'Dense compute, moderate GPU' },
      { value: 'ultra', label: 'Ultra (20-60 kW)', icon: '🔴', description: 'AI/ML training, HPC clusters' },
    ],
    smartDefault: 'standard',
    merlinTip: 'AI/GPU racks at 40-60 kW each drive massive cooling and power requirements. A single rack can use as much as a house.',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'coolingLoad'],
  },
  {
    id: 'requiredRuntime',
    type: 'buttons',
    section: 'operations',
    title: 'Required backup runtime (no utility)',
    subtitle: 'How long must the facility run on stored energy alone',
    options: [
      { value: '5min', label: '5 Minutes', icon: '⏱️', description: 'UPS bridge to generator start' },
      { value: '15min', label: '15 Minutes', icon: '⏱️', description: 'Standard UPS + transfer time' },
      { value: '1hr', label: '1 Hour', icon: '🕐', description: 'Extended ride-through for short outages' },
      { value: '4hr', label: '4 Hours', icon: '🕓', description: 'Full BESS backup for grid instability' },
      { value: '8hr+', label: '8+ Hours', icon: '🔋', description: 'Complete grid independence capability' },
    ],
    smartDefault: '15min',
    merlinTip: 'Traditional UPS provides 5-15 min. BESS can extend to 4-8+ hours, replacing generators entirely.',
    validation: { required: true },
    impactsCalculations: ['bessCapacity', 'duration'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    subtitle: 'Your current utility/grid infrastructure',
    options: [
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄', description: 'Two or more independent utility feeds' },
      { value: 'on-grid', label: 'Single Feed', icon: '🔌', description: 'Standard single utility connection' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid cannot support expansion needs' },
      { value: 'off-grid', label: 'Off-Grid / Microgrid', icon: '🏭', description: 'Isolated power system' },
    ],
    smartDefault: 'redundant',
    merlinTip: 'Redundant utility feeds are standard for Tier III+. Limited grid capacity is the #1 driver for on-site BESS at data centers.',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Grid reliability in your area',
    subtitle: 'How often does your facility experience utility outages',
    options: [
      { value: 'reliable', label: 'Very Reliable', icon: '✅', description: '< 1 outage per year' },
      { value: 'occasional', label: 'Occasional Issues', icon: '⚡', description: '2-5 outages per year' },
      { value: 'frequent', label: 'Frequent Outages', icon: '⚠️', description: '6+ outages per year' },
      { value: 'unstable', label: 'Unreliable Grid', icon: '🔴', description: 'Regular brownouts, voltage issues' },
    ],
    smartDefault: 'reliable',
    merlinTip: 'Even one 15-minute outage can cost a data center $100K-$1M. BESS provides instant switchover (< 10ms) vs generators (10-30 seconds).',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generators',
    subtitle: 'Current diesel/gas generator infrastructure',
    options: [
      { value: 'full', label: 'Full N+1 Generators', icon: '🟢', description: 'Covers 100%+ of IT load' },
      { value: 'partial', label: 'Partial Coverage', icon: '🟡', description: 'Covers critical load only' },
      { value: 'none', label: 'No Generators', icon: '❌', description: 'No backup generation on-site' },
    ],
    smartDefault: 'full',
    merlinTip: 'BESS can reduce generator dependency by 40-70%, eliminating fuel logistics, emissions, and maintenance costs.',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'existingUPS',
    type: 'buttons',
    section: 'energy',
    title: 'Existing UPS system',
    subtitle: 'Current uninterruptible power supply infrastructure',
    options: [
      { value: 'lead-acid', label: 'Lead-Acid UPS', icon: '🔋', description: 'Traditional VRLA batteries, 5-10 min runtime' },
      { value: 'lithium', label: 'Lithium UPS', icon: '⚡', description: 'Modern Li-ion UPS, longer runtime' },
      { value: 'flywheel', label: 'Flywheel', icon: '🔄', description: 'Kinetic energy storage, 15-30 sec' },
      { value: 'none', label: 'No UPS', icon: '❌', description: 'No UPS installed' },
    ],
    smartDefault: 'lead-acid',
    merlinTip: 'Replacing lead-acid UPS with lithium BESS can triple runtime, cut floor space 70%, and eliminate toxic battery disposal.',
    validation: { required: false },
    impactsCalculations: ['bessCapacity', 'duration'],
  },

  // ── SECTION 4: SOLAR & GOALS (Q14-Q18) ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 100000, step: 1000 },
    smartDefault: 40000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 100000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over parking areas?',
    subtitle: 'Solar canopy over employee/visitor parking can offset 5-15% of facility load',
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
    title: 'Any existing or planned solar?',
    subtitle: 'On-site solar can offset 10-30% of data center energy at favorable sites',
    options: [
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Panels on roof or carport' },
      { value: 'planned', label: 'Planned / Considering', icon: '📋', description: 'In design or evaluation' },
      { value: 'none', label: 'No Solar', icon: '❌', description: 'Not currently planned' },
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
    subtitle: 'What is the #1 reason you are exploring BESS?',
    options: [
      { value: 'uptime', label: 'Maximize Uptime', icon: '🛡️', description: 'Zero-downtime protection' },
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving + TOU arbitrage' },
      { value: 'sustainability', label: 'Sustainability Goals', icon: '🌿', description: 'Reduce carbon, ESG reporting' },
      { value: 'grid-constraint', label: 'Grid Capacity Limit', icon: '⚡', description: 'Cannot get more utility power' },
      { value: 'generator-replacement', label: 'Replace Generators', icon: '🔄', description: 'Eliminate diesel dependency' },
    ],
    smartDefault: 'uptime',
    merlinTip: 'BESS provides instant power (< 10ms switchover) vs 10-30 seconds for diesel generators — eliminating the "gap" that causes IT crashes.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'bessCapacity'],
  },
  {
    id: 'budgetTimeline',
    type: 'buttons',
    section: 'solar',
    title: 'Project timeline',
    subtitle: 'When do you need the system operational?',
    options: [
      { value: 'urgent', label: 'ASAP (< 6 months)', icon: '🚨', description: 'Critical need, fast deployment' },
      { value: 'planned', label: 'This Year', icon: '📅', description: '6-12 month planning horizon' },
      { value: 'budgeting', label: 'Next Budget Cycle', icon: '💼', description: '12-18 months, needs capex approval' },
      { value: 'exploring', label: 'Just Exploring', icon: '🔍', description: 'Early research phase' },
    ],
    smartDefault: 'planned',
    validation: { required: false },
    impactsCalculations: [],
  },
];
