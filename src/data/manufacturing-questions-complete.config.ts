/**
 * Complete Manufacturing Facility Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: manufacturing_load_v1 (requiredInputs: squareFootage)
 *
 * Sections:
 *   1. Facility (Q1-4)    — facilityType, squareFootage, shifts, buildingAge
 *   2. Operations (Q5-9)  — processLoads, compressedAir, heavyMachinery, cleanRoom, refrigeration
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, powerQuality
 *   4. Solar & Goals (Q14-18) — roofArea, canopyInterest, existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const manufacturingSections: Section[] = [
  { id: 'facility', title: 'Facility Profile', description: 'Type, size, and shift patterns', icon: '🏭' },
  { id: 'operations', title: 'Process & Equipment', description: 'Key loads and production systems', icon: '⚙️' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and power quality needs', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const manufacturingQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY (Q1-Q4) ──
  {
    id: 'facilityType',
    type: 'buttons',
    section: 'facility',
    title: 'Manufacturing type',
    subtitle: 'Process type determines energy intensity profile',
    options: [
      { value: 'light-assembly', label: 'Light Assembly', icon: '🔩', description: 'Electronics, packaging, light industrial' },
      { value: 'heavy-manufacturing', label: 'Heavy Manufacturing', icon: '⚒️', description: 'Metalworking, welding, machining' },
      { value: 'food-beverage', label: 'Food & Beverage', icon: '🍽️', description: 'Processing, cooking, refrigeration' },
      { value: 'chemical', label: 'Chemical / Pharma', icon: '🧪', description: 'Process heating, clean rooms, batch' },
      { value: 'automotive', label: 'Automotive / Aerospace', icon: '🚗', description: 'Assembly lines, paint booths' },
    ],
    smartDefault: 'light-assembly',
    merlinTip: 'Heavy manufacturing typically draws 8-15 W/sq ft vs 3-5 W/sq ft for light assembly. The process load dominates.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Facility square footage',
    subtitle: 'Total production + warehouse floor area',
    range: { min: 10000, max: 2000000, step: 10000 },
    smartDefault: 100000,
    unit: ' sq ft',
    merlinTip: 'Energy intensity: Light assembly 3-5 W/sq ft, heavy manufacturing 8-15 W/sq ft, food processing 6-12 W/sq ft.',
    validation: { required: true, min: 10000, max: 2000000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'shifts',
    type: 'buttons',
    section: 'facility',
    title: 'Production shift schedule',
    subtitle: 'Shift pattern determines load profile shape and duration',
    options: [
      { value: '1-shift', label: '1 Shift (8 hr)', icon: '🌅', description: 'Day shift only' },
      { value: '2-shift', label: '2 Shifts (16 hr)', icon: '🌆', description: 'Day + evening' },
      { value: '3-shift', label: '3 Shifts (24/7)', icon: '🌐', description: 'Continuous operation' },
      { value: 'variable', label: 'Variable / Seasonal', icon: '📊', description: 'Production varies by demand' },
    ],
    smartDefault: '2-shift',
    merlinTip: '3-shift operations have a flatter load profile. BESS benefits shift from peak shaving to energy arbitrage and power quality.',
    validation: { required: true },
    impactsCalculations: ['dutyCycle', 'peakDemand', 'operatingHours'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Facility age / condition',
    options: [
      { value: 'new', label: 'Built < 5 Years Ago', icon: '🏗️', description: 'Modern electrical systems' },
      { value: 'renovated', label: 'Recently Modernized', icon: '🔧', description: 'Electrical upgraded in last 10 years' },
      { value: 'aging', label: 'Aging (20+ Years)', icon: '🏚️', description: 'May need electrical upgrades' },
    ],
    smartDefault: 'renovated',
    validation: { required: false },
    impactsCalculations: ['efficiency', 'installCost'],
  },

  // ── SECTION 2: OPERATIONS (Q5-Q9) ──
  {
    id: 'processLoads',
    type: 'buttons',
    section: 'operations',
    title: 'Primary process electrical loads',
    subtitle: 'Largest single load category in your facility',
    options: [
      { value: 'motors-drives', label: 'Motors & Drives', icon: '⚡', description: 'Conveyors, pumps, compressors' },
      { value: 'heating', label: 'Process Heating', icon: '🔥', description: 'Ovens, furnaces, kilns' },
      { value: 'cnc', label: 'CNC / Machining', icon: '🔧', description: 'CNC mills, lathes, grinders' },
      { value: 'robotic', label: 'Robotic Assembly', icon: '🤖', description: 'Automated assembly lines' },
      { value: 'mixed', label: 'Mixed / Distributed', icon: '🔄', description: 'No single dominant load' },
    ],
    smartDefault: 'motors-drives',
    merlinTip: 'Motor loads create inrush currents 5-8x their rated draw. BESS can smooth these spikes and save on demand charges.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'powerQuality'],
  },
  {
    id: 'compressedAir',
    type: 'buttons',
    section: 'operations',
    title: 'Compressed air system',
    subtitle: 'Compressors are often the 2nd largest electrical load after HVAC',
    options: [
      { value: 'large', label: 'Large System (100+ HP)', icon: '💨', description: 'Plant-wide compressed air' },
      { value: 'small', label: 'Small System (< 100 HP)', icon: '🌬️', description: 'Point-of-use tools' },
      { value: 'none', label: 'No Compressed Air', icon: '❌', description: 'Not used in process' },
    ],
    smartDefault: 'small',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'processLoad'],
  },
  {
    id: 'heavyMachinery',
    type: 'buttons',
    section: 'operations',
    title: 'Heavy machinery / inrush loads',
    subtitle: 'Large motors starting creates demand spikes that BESS can shave',
    options: [
      { value: 'yes-frequent', label: 'Yes — Frequent Cycling', icon: '🔴', description: 'Multiple large starts per hour' },
      { value: 'yes-occasional', label: 'Yes — Occasional', icon: '🟡', description: 'Large loads start a few times per day' },
      { value: 'no', label: 'No Heavy Inrush', icon: '🟢', description: 'Smooth, steady loads' },
    ],
    smartDefault: 'yes-occasional',
    merlinTip: 'A single 200 HP motor starting can spike demand by 150-300 kW for 15-30 seconds. BESS eliminates these demand peaks.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'powerQuality', 'demandCharges'],
  },
  {
    id: 'cleanRoom',
    type: 'buttons',
    section: 'operations',
    title: 'Clean room or controlled environment',
    subtitle: 'Clean rooms add significant HVAC and filtration load',
    options: [
      { value: 'yes', label: 'Yes — Clean Room', icon: '🧪', description: 'ISO class clean room' },
      { value: 'controlled', label: 'Controlled Environment', icon: '🌡️', description: 'Temperature/humidity controlled' },
      { value: 'no', label: 'Standard Environment', icon: '🏭', description: 'No special requirements' },
    ],
    smartDefault: 'no',
    validation: { required: false },
    impactsCalculations: ['hvacLoad', 'peakDemand'],
  },
  {
    id: 'refrigeration',
    type: 'buttons',
    section: 'operations',
    title: 'Refrigeration / cold storage on-site',
    subtitle: 'Walk-in coolers, freezers, or process cooling',
    options: [
      { value: 'large', label: 'Large Cold Storage', icon: '🧊', description: '5,000+ sq ft refrigerated' },
      { value: 'small', label: 'Walk-in Coolers Only', icon: '❄️', description: 'Small-scale refrigeration' },
      { value: 'none', label: 'No Refrigeration', icon: '❌', description: 'Ambient process only' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'baseLoad'],
  },

  // ── SECTION 3: ENERGY & GRID (Q10-Q13) ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection status',
    options: [
      { value: 'on-grid', label: 'Standard Grid', icon: '🔌', description: 'Normal utility connection' },
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄', description: 'Dual utility feeds for reliability' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid can\'t support expansion' },
    ],
    smartDefault: 'on-grid',
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
    merlinTip: 'Manufacturing downtime costs $10,000-50,000/hour on average. Even short outages cause batch losses, equipment damage, and quality issues.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generation',
    options: [
      { value: 'yes', label: 'Yes — Generator(s)', icon: '⛽', description: 'Diesel or gas backup' },
      { value: 'no', label: 'No Backup Generation', icon: '❌', description: 'No generators installed' },
    ],
    smartDefault: 'no',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'powerQuality',
    type: 'buttons',
    section: 'energy',
    title: 'Power quality concerns',
    subtitle: 'Voltage sags, harmonics, and transients affect production quality',
    options: [
      { value: 'critical', label: 'Critical — Causes Losses', icon: '🔴', description: 'Frequent sags/harmonics cause waste' },
      { value: 'moderate', label: 'Some Issues', icon: '🟡', description: 'Occasional voltage events' },
      { value: 'fine', label: 'No Issues', icon: '🟢', description: 'Power quality is adequate' },
    ],
    smartDefault: 'fine',
    merlinTip: 'BESS can provide instant voltage support, eliminating the sags that cause PLC trips and batch losses.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'powerQuality'],
  },

  // ── SECTION 4: SOLAR & GOALS (Q14-Q18) ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 200000, step: 1000 },
    smartDefault: 75000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 200000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in solar canopy over parking/yard?',
    subtitle: 'Employee parking or shipping yard canopy solar generation',
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
      { value: 'existing', label: 'Already Installed', icon: '☀️', description: 'Rooftop or ground-mount' },
      { value: 'planned', label: 'Planned / Considering', icon: '📋', description: 'In evaluation' },
      { value: 'none', label: 'No Solar', icon: '❌', description: 'Not currently planned' },
    ],
    smartDefault: 'none',
    merlinTip: 'Manufacturing facilities with large, flat roofs are ideal for solar. 100,000 sq ft = ~750 kW solar potential.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving + demand management' },
      { value: 'resilience', label: 'Production Continuity', icon: '🛡️', description: 'Prevent costly downtime' },
      { value: 'power-quality', label: 'Power Quality', icon: '⚡', description: 'Voltage support, harmonics mitigation' },
      { value: 'sustainability', label: 'Sustainability / ESG', icon: '🌿', description: 'Carbon reduction, green manufacturing' },
      { value: 'capacity', label: 'Grid Capacity', icon: '🔌', description: 'Avoid costly utility upgrades' },
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
