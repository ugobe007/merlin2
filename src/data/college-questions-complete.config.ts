/**
 * Complete College & University Questionnaire Configuration
 *
 * 18 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const collegeSections: Section[] = [
  { id: 'facility', title: 'Campus Profile', description: 'Size, type, and enrollment', icon: '🎓' },
  { id: 'operations', title: 'Buildings & Systems', description: 'Research, housing, and facilities', icon: '🏫' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and energy management', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const collegeQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'institutionType',
    type: 'buttons',
    section: 'facility',
    title: 'Institution type',
    options: [
      { value: 'research-university', label: 'Research University (R1/R2)', icon: '🔬', description: 'Major research, labs, data centers' },
      { value: 'teaching-university', label: 'Teaching University', icon: '🎓', description: 'Focus on instruction, some labs' },
      { value: 'community-college', label: 'Community College', icon: '📚', description: 'Commuter campus, standard buildings' },
      { value: 'vocational', label: 'Vocational / Technical', icon: '🔧', description: 'Workshops, specialized equipment' },
    ],
    smartDefault: 'teaching-university',
    merlinTip: 'Research universities consume 3-5x more energy than teaching institutions due to lab equipment, clean rooms, and data centers running 24/7.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'campusSqFt',
    type: 'slider',
    section: 'facility',
    title: 'Total campus building area',
    subtitle: 'All buildings combined (academic, admin, housing)',
    range: { min: 50000, max: 20000000, step: 50000 },
    smartDefault: 2000000,
    unit: ' sq ft',
    validation: { required: true, min: 50000, max: 20000000 },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'enrollment',
    type: 'slider',
    section: 'facility',
    title: 'Student enrollment (FTE)',
    range: { min: 500, max: 80000, step: 500 },
    smartDefault: 10000,
    unit: ' students',
    validation: { required: true, min: 500, max: 80000 },
    impactsCalculations: ['peakDemand', 'dutyCycle'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Average building age',
    options: [
      { value: 'modern', label: 'Mostly Modern (< 20 yr)', icon: '🏗️' },
      { value: 'mixed', label: 'Mix of Old and New', icon: '🔄' },
      { value: 'historic', label: 'Mostly Historic (50+ yr)', icon: '🏛️' },
    ],
    smartDefault: 'mixed',
    validation: { required: false },
    impactsCalculations: ['efficiency'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'researchLabs',
    type: 'buttons',
    section: 'operations',
    title: 'Research laboratory facilities',
    subtitle: 'Labs are energy hogs: fume hoods, freezers, equipment',
    options: [
      { value: 'extensive', label: 'Extensive (100K+ sq ft labs)', icon: '🔬', description: 'Bio, chem, physics labs' },
      { value: 'moderate', label: 'Moderate Lab Space', icon: '🧪', description: 'Some science labs' },
      { value: 'minimal', label: 'Teaching Labs Only', icon: '📐', description: 'Basic instructional labs' },
      { value: 'none', label: 'No Labs', icon: '❌' },
    ],
    smartDefault: 'moderate',
    merlinTip: 'A single fume hood runs 24/7 and consumes as much energy as 3 houses. A research building can use 6-10x more energy per sq ft than a classroom.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'studentHousing',
    type: 'buttons',
    section: 'operations',
    title: 'On-campus student housing',
    options: [
      { value: 'large', label: 'Large (3,000+ beds)', icon: '🏢', description: 'Major residential campus' },
      { value: 'medium', label: 'Medium (500-3,000 beds)', icon: '🏘️' },
      { value: 'small', label: 'Small (< 500 beds)', icon: '🏠' },
      { value: 'none', label: 'Commuter Campus', icon: '🚗', description: 'No on-campus housing' },
    ],
    smartDefault: 'medium',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'dataCenterHPC',
    type: 'buttons',
    section: 'operations',
    title: 'Data center / HPC facility',
    subtitle: 'Campus IT and research computing',
    options: [
      { value: 'hpc', label: 'HPC / Supercomputer', icon: '🖥️', description: 'Major research computing' },
      { value: 'datacenter', label: 'Institutional Data Center', icon: '🏢', description: 'Central IT services' },
      { value: 'server-rooms', label: 'Distributed Server Rooms', icon: '📦', description: 'Department-level IT' },
      { value: 'cloud', label: 'Cloud-Based IT', icon: '☁️', description: 'Minimal on-campus compute' },
    ],
    smartDefault: 'datacenter',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },
  {
    id: 'athleticFacilities',
    type: 'buttons',
    section: 'operations',
    title: 'Athletic / recreation facilities',
    options: [
      { value: 'major', label: 'Major (Stadium, Arena, Aquatic)', icon: '🏟️' },
      { value: 'standard', label: 'Standard (Gym, Fields, Pool)', icon: '🏊' },
      { value: 'basic', label: 'Basic Fitness Center', icon: '🏋️' },
      { value: 'none', label: 'Minimal', icon: '❌' },
    ],
    smartDefault: 'standard',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'intermittentLoad'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'EV charging on campus',
    options: [
      { value: 'yes-many', label: 'Many (20+ stations)', icon: '⚡' },
      { value: 'yes-few', label: 'Some (1-20)', icon: '🔌' },
      { value: 'planned', label: 'Planned / Mandated', icon: '📋' },
      { value: 'none', label: 'None', icon: '❌' },
    ],
    smartDefault: 'yes-few',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Campus power configuration',
    options: [
      { value: 'on-grid', label: 'Standard Utility', icon: '🔌', description: 'Single or multiple utility feeds' },
      { value: 'campus-microgrid', label: 'Campus Microgrid / CHP', icon: '🔄', description: 'On-campus generation' },
      { value: 'limited', label: 'Constrained Grid', icon: '⚠️', description: 'Utility can\'t support growth' },
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
      { value: 'yes-extensive', label: 'Extensive (Campus-wide)', icon: '⛽' },
      { value: 'yes-partial', label: 'Partial (Critical buildings)', icon: '🔋' },
      { value: 'none', label: 'No Backup', icon: '❌' },
    ],
    smartDefault: 'yes-partial',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'energyManagement',
    type: 'buttons',
    section: 'energy',
    title: 'Energy management sophistication',
    options: [
      { value: 'advanced', label: 'Advanced BMS + Analytics', icon: '📊', description: 'Real-time monitoring, optimization' },
      { value: 'basic', label: 'Basic BMS', icon: '🖥️', description: 'Building management system' },
      { value: 'manual', label: 'Manual / Legacy', icon: '🔧', description: 'Limited automation' },
    ],
    smartDefault: 'basic',
    validation: { required: false },
    impactsCalculations: ['bessIntegration'],
  },

  // ── SECTION 4: SOLAR & GOALS ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 250000, step: 5000 },
    smartDefault: 50000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 250000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over campus parking?',
    subtitle: 'Parking lot canopy solar — educational showcase + generation',
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
    merlinTip: 'Hundreds of universities have committed to carbon neutrality by 2030-2050. Solar + BESS is the fastest path to Scope 2 emission reductions.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'sustainability', label: 'Carbon Neutrality', icon: '🌿', description: 'Climate action plan compliance' },
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Budget relief from rising rates' },
      { value: 'resilience', label: 'Research Continuity', icon: '🛡️', description: 'Protect critical research data/samples' },
      { value: 'capacity', label: 'Growth Support', icon: '🔌', description: 'New buildings without grid upgrade' },
    ],
    smartDefault: 'sustainability',
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
