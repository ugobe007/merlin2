/**
 * Complete Office Building Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: office_load_v1 (requiredInputs: squareFootage)
 *
 * Sections:
 *   1. Facility (Q1-4)    — buildingClass, squareFootage, floors, buildingAge
 *   2. Operations (Q5-9)  — occupancyType, operatingHours, hvacSystem, tenantCount, parkingGarage
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, demandCharges
 *   4. Solar & Goals (Q14-16) — existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const officeSections: Section[] = [
  { id: 'facility', title: 'Building Profile', description: 'Class, size, and configuration', icon: '🏢' },
  { id: 'operations', title: 'Operations & Tenants', description: 'Occupancy, HVAC, and tenant mix', icon: '⚙️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and demand profile', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const officeQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'buildingClass',
    type: 'buttons',
    section: 'facility',
    title: 'Building class',
    subtitle: 'BOMA classification affects energy intensity and tenant expectations',
    options: [
      { value: 'class-a', label: 'Class A', icon: '🏛️', description: 'Premium, newest, best location' },
      { value: 'class-b', label: 'Class B', icon: '🏢', description: 'Good quality, well-maintained' },
      { value: 'class-c', label: 'Class C', icon: '🏗️', description: 'Functional, older, value-oriented' },
      { value: 'flex', label: 'Flex / Creative', icon: '🎨', description: 'Converted warehouse, mixed-use' },
    ],
    smartDefault: 'class-b',
    merlinTip: 'Class A buildings use 20-30% more energy per sq ft due to premium HVAC, lighting, and amenities. They also command tenants who expect resilience.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Total rentable square footage',
    subtitle: 'Gross leasable area including common spaces',
    range: { min: 5000, max: 1000000, step: 5000 },
    smartDefault: 50000,
    unit: ' sq ft',
    merlinTip: 'CBECS data: Office buildings average 4.5-6.5 W/sq ft for HVAC + lighting + plug loads.',
    validation: { required: true, min: 5000, max: 1000000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'floors',
    type: 'buttons',
    section: 'facility',
    title: 'Number of floors',
    subtitle: 'Height affects elevator load and HVAC distribution',
    options: [
      { value: '1-3', label: '1-3 Floors', icon: '🟢', description: 'Low-rise, no elevator needed' },
      { value: '4-10', label: '4-10 Floors', icon: '🟡', description: 'Mid-rise, elevator + central HVAC' },
      { value: '11-25', label: '11-25 Floors', icon: '🟠', description: 'High-rise, significant vertical transport' },
      { value: '25+', label: '25+ Floors', icon: '🔴', description: 'Skyscraper, complex MEP systems' },
    ],
    smartDefault: '4-10',
    merlinTip: 'Each elevator bank adds 30-75 kW. High-rises typically have 6-12 elevators.',
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / renovation status',
    options: [
      { value: 'new', label: 'New Build (< 5 yr)', icon: '🏗️', description: 'Modern MEP, LED, high-efficiency HVAC' },
      { value: 'renovated', label: 'Recently Renovated', icon: '🔧', description: 'Major systems upgraded in last 10 years' },
      { value: 'aging', label: 'Aging (20+ yr)', icon: '🏚️', description: 'Original systems, higher energy intensity' },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'occupancyType',
    type: 'buttons',
    section: 'operations',
    title: 'Occupancy type',
    subtitle: 'Single tenant vs multi-tenant affects metering and load profiles',
    options: [
      { value: 'single', label: 'Single Tenant', icon: '🏢', description: 'One organization, unified operations' },
      { value: 'multi', label: 'Multi-Tenant', icon: '🏘️', description: 'Multiple tenants, shared base building' },
      { value: 'owner-occupied', label: 'Owner-Occupied', icon: '🔑', description: 'Owner uses entire building' },
      { value: 'coworking', label: 'Coworking / Flex', icon: '💻', description: 'Shared workspace, variable occupancy' },
    ],
    smartDefault: 'multi',
    merlinTip: 'Multi-tenant buildings benefit most from BESS peak shaving — the landlord pays demand charges on the whole building\'s peak.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'demandCharges'],
  },
  {
    id: 'operatingHours',
    type: 'buttons',
    section: 'operations',
    title: 'Operating hours',
    subtitle: 'When is the building actively occupied',
    options: [
      { value: 'standard', label: 'Standard (8am-6pm)', icon: '🌅', description: 'M-F business hours' },
      { value: 'extended', label: 'Extended (7am-10pm)', icon: '🌆', description: 'Early/late tenants, evening events' },
      { value: '24-7', label: '24/7 Operations', icon: '🌐', description: 'Always occupied (call centers, etc.)' },
      { value: 'variable', label: 'Variable / Seasonal', icon: '📊', description: 'Occupancy varies significantly' },
    ],
    smartDefault: 'standard',
    merlinTip: 'Standard hours = sharp morning ramp-up (great for peak shaving). 24/7 = flatter profile (better for arbitrage).',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand'],
  },
  {
    id: 'hvacSystem',
    type: 'buttons',
    section: 'operations',
    title: 'HVAC system type',
    subtitle: 'HVAC is typically 40-60% of total building energy',
    options: [
      { value: 'central-chiller', label: 'Central Chiller Plant', icon: '❄️', description: 'Large central system with AHUs' },
      { value: 'vrf', label: 'VRF / Mini-Split', icon: '🔄', description: 'Variable refrigerant, zone control' },
      { value: 'rooftop', label: 'Rooftop Units (RTU)', icon: '📦', description: 'Packaged units, common in low-rise' },
      { value: 'mixed', label: 'Mixed Systems', icon: '🔧', description: 'Combination of system types' },
    ],
    smartDefault: 'central-chiller',
    merlinTip: 'Central chiller plants draw 200-800 kW at peak. VRF is 20-40% more efficient but harder to retrofit.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'tenantCount',
    type: 'buttons',
    section: 'operations',
    title: 'Number of tenants (if multi-tenant)',
    subtitle: 'More tenants = more diverse load profile = better peak shaving opportunity',
    options: [
      { value: '1-5', label: '1-5 Tenants', icon: '🏢', description: 'Large floor-plate tenants' },
      { value: '6-20', label: '6-20 Tenants', icon: '🏘️', description: 'Mix of sizes' },
      { value: '20+', label: '20+ Tenants', icon: '🏙️', description: 'Many small tenants, diverse load' },
    ],
    smartDefault: '6-20',
    conditionalLogic: {
      dependsOn: 'occupancyType',
      showIf: (val: string) => val === 'multi' || val === 'coworking',
    },
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'parkingGarage',
    type: 'buttons',
    section: 'operations',
    title: 'Parking structure',
    subtitle: 'EV charging + lighting in parking = growing load',
    options: [
      { value: 'underground', label: 'Underground Garage', icon: '🅿️', description: 'Ventilation + lighting load' },
      { value: 'above-ground', label: 'Above-Ground Structure', icon: '🏗️', description: 'Lighting, some ventilation' },
      { value: 'surface', label: 'Surface Lot', icon: '🚗', description: 'Minimal energy, solar carport potential' },
      { value: 'none', label: 'No Parking', icon: '🚶', description: 'Urban, transit-oriented' },
    ],
    smartDefault: 'underground',
    merlinTip: 'Parking structures are ideal for EV charger deployment. Solar carports can generate 100-500 kW on large lots.',
    validation: { required: false },
    impactsCalculations: ['solarPotential', 'evCharging'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌', description: 'Normal utility connection' },
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄', description: 'Dual utility feeds' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid cannot support growth' },
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
    title: 'Existing backup generators',
    options: [
      { value: 'yes', label: 'Yes — Generator On-Site', icon: '⛽', description: 'Diesel or gas backup' },
      { value: 'no', label: 'No Backup Generation', icon: '❌', description: 'No generators installed' },
    ],
    smartDefault: 'no',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'demandCharges',
    type: 'buttons',
    section: 'energy',
    title: 'Demand charges on your utility bill?',
    subtitle: 'Demand charges are often 30-50% of commercial electric bills',
    options: [
      { value: 'high', label: 'High ($15-30+/kW)', icon: '🔴', description: 'Excellent BESS ROI opportunity' },
      { value: 'moderate', label: 'Moderate ($8-15/kW)', icon: '🟡', description: 'Good ROI with peak shaving' },
      { value: 'low', label: 'Low (< $8/kW)', icon: '🟢', description: 'Marginal peak shaving benefit' },
      { value: 'unknown', label: "Don't Know", icon: '❓', description: "We'll estimate from your location" },
    ],
    smartDefault: 'unknown',
    merlinTip: 'BESS peak shaving typically saves 20-40% on demand charges. The higher the $/kW rate, the faster the payback.',
    validation: { required: true },
    impactsCalculations: ['demandChargeSavings', 'payback'],
  },

  // ── SECTION 4: SOLAR & GOALS (Q14-Q16) ──
  {
    id: 'existingSolar',
    type: 'buttons',
    section: 'solar',
    title: 'Any existing or planned solar?',
    options: [
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Rooftop or carport solar' },
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
    options: [
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving + TOU arbitrage' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Green building certification' },
      { value: 'resilience', label: 'Backup Power', icon: '🛡️', description: 'Business continuity protection' },
      { value: 'tenant-attraction', label: 'Tenant Attraction', icon: '🏢', description: 'Modern, green building amenity' },
      { value: 'ev-readiness', label: 'EV Charging Readiness', icon: '🔌', description: 'Support growing EV demand' },
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
