/**
 * Complete Hospital / Healthcare Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: hospital_load_v1 (requiredInputs: bedCount)
 *
 * Sections:
 *   1. Facility (Q1-4)    — facilityType, bedCount, squareFootage, buildingAge
 *   2. Operations (Q5-9)  — criticalSystems, operatingRooms, imagingEquipment, laundryOnSite, dataCenter
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, backupDuration
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const hospitalSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Type, size, and capacity', icon: '🏥' },
  { id: 'operations', title: 'Clinical Operations', description: 'Critical systems and departments', icon: '⚕️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and backup systems', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const hospitalQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'facilityType',
    type: 'buttons',
    section: 'facility',
    title: 'Healthcare facility type',
    subtitle: 'Type of facility determines critical load percentage and backup requirements',
    options: [
      { value: 'acute-care', label: 'Acute Care Hospital', icon: '🏥', description: 'Full-service with ER, surgery, ICU' },
      { value: 'community', label: 'Community Hospital', icon: '🏘️', description: 'General inpatient + outpatient' },
      { value: 'specialty', label: 'Specialty Hospital', icon: '🔬', description: 'Cancer center, cardiac, rehab' },
      { value: 'outpatient', label: 'Outpatient / Ambulatory', icon: '🚶', description: 'Clinics, surgery centers, urgent care' },
      { value: 'long-term', label: 'Long-Term Care', icon: '🛏️', description: 'Nursing facility, skilled nursing' },
    ],
    smartDefault: 'acute-care',
    merlinTip: 'Acute care hospitals have 85% critical load per NEC 517. Outpatient facilities are closer to 50% — dramatically different BESS sizing.',
    validation: { required: true },
    impactsCalculations: ['criticalLoadPct', 'backupCapacity', 'bessRequirements'],
  },
  {
    id: 'bedCount',
    type: 'slider',
    section: 'facility',
    title: 'Number of licensed beds',
    subtitle: 'Total beds including ICU, med-surg, and specialty units',
    range: { min: 10, max: 2000, step: 10 },
    smartDefault: 200,
    unit: ' beds',
    merlinTip: 'Average US hospital: 150-250 beds. Each bed adds ~3-5 kW to peak demand (including HVAC, monitoring, lighting).',
    validation: { required: true, min: 10, max: 2000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'bessCapacity'],
  },
  {
    id: 'squareFootage',
    type: 'range_buttons',
    section: 'facility',
    title: 'Total facility size',
    subtitle: 'Includes clinical, support, and administrative areas',
    rangeConfig: {
      ranges: [
        { label: 'Small (< 100K)', min: 25000, max: 100000 },
        { label: 'Medium (100-300K)', min: 100000, max: 300000 },
        { label: 'Large (300-750K)', min: 300000, max: 750000 },
        { label: 'Campus (750K+)', min: 750000, max: null },
      ],
      suffix: ' sq ft',
    },
    smartDefault: '200000',
    merlinTip: 'Rule of thumb: ~800-1,200 sq ft per bed for acute care hospitals.',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Building age / renovation status',
    subtitle: 'Older facilities have higher energy intensity per square foot',
    options: [
      { value: 'new', label: 'New Build', icon: '🏗️', description: 'Built in last 10 years' },
      { value: 'renovated', label: 'Recently Renovated', icon: '🔧', description: 'Major systems upgraded' },
      { value: 'aging', label: 'Aging Facility', icon: '🏚️', description: '20+ years, original HVAC' },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'lightingLoad'],
  },

  // ── SECTION 2: CLINICAL OPERATIONS (Q5-Q9) ──
  {
    id: 'criticalSystems',
    type: 'multiselect',
    section: 'operations',
    title: 'Critical systems that MUST stay powered',
    subtitle: 'Select all systems requiring uninterrupted power (NEC 517 / NFPA 99)',
    options: [
      { value: 'icu', label: 'ICU / Critical Care', icon: '🫀', description: 'Life support, ventilators, monitors' },
      { value: 'surgery', label: 'Operating Rooms', icon: '🔪', description: 'Surgical suites, anesthesia' },
      { value: 'imaging', label: 'Imaging / Radiology', icon: '📡', description: 'MRI, CT, X-ray, ultrasound' },
      { value: 'emergency', label: 'Emergency Department', icon: '🚑', description: 'ER, trauma bay' },
      { value: 'pharmacy', label: 'Pharmacy & Lab', icon: '💊', description: 'Medication storage, lab equipment' },
      { value: 'it-systems', label: 'IT / EHR Systems', icon: '💻', description: 'Electronic health records, PACS' },
    ],
    smartDefault: ['icu', 'surgery', 'emergency'],
    merlinTip: 'NEC 517 requires life safety and critical branches on emergency power. MRI alone draws 50-150 kW during a scan.',
    validation: { required: true },
    impactsCalculations: ['criticalLoadPct', 'backupCapacity'],
  },
  {
    id: 'operatingRooms',
    type: 'slider',
    section: 'operations',
    title: 'Number of operating rooms',
    subtitle: 'Each OR adds 30-50 kW of critical load',
    range: { min: 0, max: 50, step: 1 },
    smartDefault: 8,
    unit: ' ORs',
    merlinTip: 'Active ORs draw 30-50 kW each (HVAC, surgical lights, monitors, cautery). They are the highest per-room energy consumer.',
    validation: { required: true, min: 0, max: 50 },
    impactsCalculations: ['peakDemand', 'criticalLoadKW'],
  },
  {
    id: 'imagingEquipment',
    type: 'buttons',
    section: 'operations',
    title: 'Major imaging equipment on-site',
    subtitle: 'MRI, CT scanners, and linear accelerators have enormous peak draw',
    options: [
      { value: 'full', label: 'Full Suite (MRI + CT + Linear Acc)', icon: '📡', description: '200-500+ kW peak imaging load' },
      { value: 'standard', label: 'Standard (MRI + CT)', icon: '🔬', description: '100-300 kW peak imaging load' },
      { value: 'basic', label: 'Basic (CT + X-Ray)', icon: '📷', description: '50-100 kW peak imaging load' },
      { value: 'none', label: 'No Major Imaging', icon: '❌', description: 'Outsource imaging services' },
    ],
    smartDefault: 'standard',
    merlinTip: 'A single MRI machine draws 50-150 kW peak. Linear accelerators (cancer treatment) add 100-200 kW.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'criticalLoadKW'],
  },
  {
    id: 'laundryOnSite',
    type: 'buttons',
    section: 'operations',
    title: 'On-site laundry facility?',
    subtitle: 'Hospital laundry processes tons of linens daily',
    options: [
      { value: 'yes', label: 'Yes — On-Site Laundry', icon: '🧺', description: 'Industrial washers, dryers, pressing' },
      { value: 'no', label: 'No — Outsourced', icon: '🚛', description: 'Third-party linen service' },
    ],
    smartDefault: 'yes',
    merlinTip: 'On-site laundry adds 100-250 kW but provides supply chain resilience during emergencies.',
    validation: { required: false },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'dataCenter',
    type: 'buttons',
    section: 'operations',
    title: 'On-site IT / data center',
    subtitle: 'Hospital IT infrastructure including EHR, PACS, networking',
    options: [
      { value: 'full', label: 'Full On-Prem DC', icon: '🖥️', description: 'Server room with redundant power' },
      { value: 'hybrid', label: 'Hybrid (On-Prem + Cloud)', icon: '☁️', description: 'Local servers + cloud failover' },
      { value: 'cloud', label: 'Mostly Cloud', icon: '🌐', description: 'Minimal on-site IT equipment' },
    ],
    smartDefault: 'hybrid',
    merlinTip: 'EHR downtime costs hospitals $1,000-$3,000 per minute. BESS ensures IT stays up even during transfer to generators.',
    validation: { required: false },
    impactsCalculations: ['criticalLoadKW', 'bessCapacity'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄', description: 'Dual utility feeds (NEC 517 recommended)' },
      { value: 'on-grid', label: 'Single Feed', icon: '🔌', description: 'Standard single utility connection' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid cannot support expansion' },
    ],
    smartDefault: 'redundant',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Grid reliability in your area',
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
    subtitle: 'NEC 517 requires emergency power for hospitals',
    options: [
      { value: 'full', label: 'Full Coverage (NEC compliant)', icon: '🟢', description: '100% critical load + life safety' },
      { value: 'partial', label: 'Partial Coverage', icon: '🟡', description: 'Life safety only, not full critical' },
      { value: 'aging', label: 'Aging Generators', icon: '🟠', description: 'Compliant but past expected life' },
      { value: 'none', label: 'No Generators', icon: '❌', description: 'Non-compliant, needs immediate solution' },
    ],
    smartDefault: 'full',
    merlinTip: 'BESS can bridge the 10-30 second generator start gap — the most dangerous window for patient safety.',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'backupDuration',
    type: 'buttons',
    section: 'energy',
    title: 'Required backup power duration',
    subtitle: 'How long must critical systems run without utility',
    options: [
      { value: '4hr', label: '4 Hours', icon: '🕓', description: 'Short-duration bridge to restoration' },
      { value: '8hr', label: '8 Hours', icon: '🕗', description: 'Extended outage coverage' },
      { value: '24hr', label: '24 Hours', icon: '🕛', description: 'Full day of independence' },
      { value: '72hr', label: '72 Hours (CMS req)', icon: '📋', description: 'CMS/Joint Commission standard' },
    ],
    smartDefault: '24hr',
    merlinTip: 'CMS requires 96 hours of generator fuel on-site. BESS + solar can extend runtime indefinitely in some climates.',
    validation: { required: true },
    impactsCalculations: ['bessCapacity', 'duration'],
  },

  // ── SECTION 4: SOLAR & GOALS (Q14-Q18) ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 200000, step: 1000 },
    smartDefault: 60000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 200000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over parking?',
    subtitle: 'Patient and visitor parking canopy provides shade while generating solar power',
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
    options: [
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Panels on roof or carport' },
      { value: 'planned', label: 'Planned / Considering', icon: '📋', description: 'Solar + BESS together saves 15-20% more' },
      { value: 'none', label: 'No Solar Yet', icon: '🔌', description: 'BESS alone provides backup + demand savings' },
    ],
    smartDefault: 'none',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'solarCapacityKW',
    type: 'number',
    section: 'solar',
    title: 'Existing solar system size',
    subtitle: 'Approximate capacity of your current solar installation',
    placeholder: 'e.g., 300',
    suffix: 'kW',
    smartDefault: 300,
    helpText: 'Hospital rooftop solar systems typically range from 100-1,000 kW depending on roof area and shading.',
    validation: { required: false, min: 1, max: 10000 },
    impactsCalculations: ['solarSizing', 'bessMode'],
    conditionalLogic: {
      dependsOn: 'existingSolar',
      showIf: (value: unknown) => value === 'existing',
    },
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'resilience', label: 'Resilience & Patient Safety', icon: '🛡️', description: 'Uninterrupted power for critical care' },
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving, demand charge reduction' },
      { value: 'compliance', label: 'Regulatory Compliance', icon: '📋', description: 'Meet CMS, Joint Commission, NEC 517' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Carbon reduction commitments' },
      { value: 'generator-reduction', label: 'Reduce Generator Dependency', icon: '🔄', description: 'Fewer diesel generators, less fuel' },
    ],
    smartDefault: 'resilience',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'bessCapacity'],
  },
  {
    id: 'budgetTimeline',
    type: 'buttons',
    section: 'solar',
    title: 'Project timeline',
    options: [
      { value: 'urgent', label: 'ASAP (< 6 months)', icon: '🚨', description: 'Critical compliance need' },
      { value: 'planned', label: 'This Year', icon: '📅', description: 'Budgeted, procurement phase' },
      { value: 'budgeting', label: 'Next Budget Cycle', icon: '💼', description: '12-18 months' },
      { value: 'exploring', label: 'Just Exploring', icon: '🔍', description: 'Early research phase' },
    ],
    smartDefault: 'planned',
    validation: { required: false },
    impactsCalculations: [],
  },
];
