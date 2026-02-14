/**
 * Complete Apartment Complex Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const apartmentSections: Section[] = [
  { id: 'facility', title: 'Property Profile', description: 'Size, type, and unit count', icon: '🏢' },
  { id: 'operations', title: 'Amenities & Systems', description: 'Common areas, HVAC, and amenities', icon: '🏊' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and metering', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const apartmentQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'propertyType',
    type: 'buttons',
    section: 'facility',
    title: 'Property type',
    options: [
      { value: 'garden', label: 'Garden Style (1-3 floors)', icon: '🏘️', description: 'Walk-up, no elevator' },
      { value: 'midrise', label: 'Mid-Rise (4-8 floors)', icon: '🏢', description: 'Elevator, central corridors' },
      { value: 'highrise', label: 'High-Rise (9+ floors)', icon: '🏙️', description: 'Elevator banks, central plant' },
      { value: 'mixed-use', label: 'Mixed-Use (Retail + Residential)', icon: '🏪', description: 'Ground-floor retail' },
    ],
    smartDefault: 'midrise',
    merlinTip: 'High-rise apartments have central plant HVAC and elevators — BESS peak shaving is most effective here. Garden style benefits more from solar + storage.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacType'],
  },
  {
    id: 'unitCount',
    type: 'slider',
    section: 'facility',
    title: 'Number of units',
    subtitle: 'Total residential units in the complex',
    range: { min: 10, max: 1000, step: 10 },
    smartDefault: 100,
    unit: ' units',
    merlinTip: 'Common area electrical load scales with unit count. At 100+ units, demand charges become the dominant cost driver.',
    validation: { required: true, min: 10, max: 1000 },
    impactsCalculations: ['peakDemand', 'commonAreaLoad'],
  },
  {
    id: 'avgUnitSize',
    type: 'buttons',
    section: 'facility',
    title: 'Average unit size',
    options: [
      { value: 'studio', label: 'Studio / Micro (< 600 sq ft)', icon: '🛏️' },
      { value: '1br', label: '1 Bedroom (600-900 sq ft)', icon: '🏠' },
      { value: '2br', label: '2 Bedroom (900-1,200 sq ft)', icon: '🏡' },
      { value: 'large', label: 'Large (1,200+ sq ft)', icon: '🏘️' },
    ],
    smartDefault: '1br',
    validation: { required: true },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / condition',
    options: [
      { value: 'new', label: 'New Build (< 5 yr)', icon: '🏗️' },
      { value: 'renovated', label: 'Recently Renovated', icon: '🔧' },
      { value: 'aging', label: 'Aging (20+ yr)', icon: '🏚️' },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['efficiency'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'hvacType',
    type: 'buttons',
    section: 'operations',
    title: 'HVAC system type',
    subtitle: 'Central vs individual unit systems affect the common-area load profile',
    options: [
      { value: 'central-plant', label: 'Central Plant (Chiller/Boiler)', icon: '❄️', description: 'Building-wide central system' },
      { value: 'ptac', label: 'PTAC / Through-Wall', icon: '📦', description: 'Individual unit packaged units' },
      { value: 'vrf', label: 'VRF / Mini-Split', icon: '🔄', description: 'Heat pump, zone control' },
      { value: 'mixed', label: 'Mixed Systems', icon: '🔧', description: 'Combination' },
    ],
    smartDefault: 'ptac',
    merlinTip: 'Central plant buildings pay all HVAC on one meter — highest BESS value. PTAC buildings have lower common-area load but higher per-unit peaks.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'commonAmenities',
    type: 'buttons',
    section: 'operations',
    title: 'Common area amenities',
    options: [
      { value: 'luxury', label: 'Full Luxury (Pool, Gym, Clubhouse, etc.)', icon: '🏊' },
      { value: 'standard', label: 'Standard (Gym, Laundry, Lobby)', icon: '🏢' },
      { value: 'basic', label: 'Basic (Lobby, Laundry Only)', icon: '🧺' },
      { value: 'minimal', label: 'Minimal Amenities', icon: '🏠' },
    ],
    smartDefault: 'standard',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'commonAreaLoad'],
  },
  {
    id: 'laundry',
    type: 'buttons',
    section: 'operations',
    title: 'Laundry facilities',
    subtitle: 'Common laundry rooms are a significant electrical load',
    options: [
      { value: 'central', label: 'Central Laundry Room(s)', icon: '🧺', description: 'Shared machines, high-draw cycles' },
      { value: 'in-unit', label: 'In-Unit Washer/Dryer', icon: '🏠', description: 'Individual unit appliances' },
      { value: 'none', label: 'No Laundry', icon: '❌' },
    ],
    smartDefault: 'central',
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'EV charging for residents',
    subtitle: 'Resident EV charging is the fastest-growing apartment load',
    options: [
      { value: 'yes-many', label: 'Many (20+ stations)', icon: '⚡' },
      { value: 'yes-few', label: 'Some (1-20 stations)', icon: '🔌' },
      { value: 'planned', label: 'Planned / Required by Code', icon: '📋' },
      { value: 'none', label: 'None', icon: '❌' },
    ],
    smartDefault: 'none',
    merlinTip: 'EV-ready building codes now require 20-40% of parking spaces to be EV-capable. BESS prevents costly transformer upgrades.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },
  {
    id: 'elevators',
    type: 'buttons',
    section: 'operations',
    title: 'Elevator count',
    options: [
      { value: 'none', label: 'No Elevators', icon: '🚶', description: 'Walk-up only' },
      { value: '1-2', label: '1-2 Elevators', icon: '🛗' },
      { value: '3-4', label: '3-4 Elevators', icon: '🏢' },
      { value: '5+', label: '5+ Elevators', icon: '🏙️' },
    ],
    smartDefault: '1-2',
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid can\'t support EV growth' },
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
    id: 'metering',
    type: 'buttons',
    section: 'energy',
    title: 'Metering configuration',
    subtitle: 'Master-metered buildings pay one bill — highest BESS value for the owner',
    options: [
      { value: 'master', label: 'Master Metered', icon: '📊', description: 'Owner pays all electric' },
      { value: 'sub-metered', label: 'Sub-Metered', icon: '📏', description: 'Owner tracks per-unit but pays utility' },
      { value: 'individual', label: 'Individual Meters', icon: '🔌', description: 'Tenants have own utility accounts' },
    ],
    smartDefault: 'individual',
    merlinTip: 'Master-metered buildings get the highest BESS ROI — the owner captures all demand charge savings. Individual-metered buildings benefit from common-area BESS.',
    validation: { required: true },
    impactsCalculations: ['demandChargeSavings', 'bessMode'],
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
      { value: 'cost', label: 'Reduce Common-Area Costs', icon: '💰' },
      { value: 'resilience', label: 'Resident Safety (Backup)', icon: '🛡️', description: 'Elevator, lighting, fire systems' },
      { value: 'ev-readiness', label: 'EV Charging Capacity', icon: '🔌', description: 'Support EV adoption without grid upgrade' },
      { value: 'sustainability', label: 'Green Building / ESG', icon: '🌿', description: 'LEED, Energy Star certification' },
      { value: 'tenant-attraction', label: 'Attract Tenants', icon: '🏢', description: 'Modern, sustainable amenity' },
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
