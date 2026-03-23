/**
 * Complete Residential Questionnaire Configuration
 *
 * 18 questions across 4 sections.
 * Calculator: generic_ssot_v1
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const residentialSections: Section[] = [
  { id: 'facility', title: 'Home Profile', description: 'Type, size, and age', icon: '🏠' },
  { id: 'operations', title: 'Systems & Appliances', description: 'HVAC, EV, pool, and major appliances', icon: '🔌' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection and utility rates', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Existing solar and project motivation', icon: '☀️' },
];

export const residentialQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'homeType',
    type: 'buttons',
    section: 'facility',
    title: 'Home type',
    options: [
      { value: 'single-family', label: 'Single Family Home', icon: '🏠' },
      { value: 'townhome', label: 'Townhome / Rowhouse', icon: '🏘️' },
      { value: 'condo', label: 'Condo / Co-op', icon: '🏢' },
      { value: 'estate', label: 'Estate / Large Home', icon: '🏛️', description: '4,000+ sq ft' },
    ],
    smartDefault: 'single-family',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'systemSize'],
  },
  {
    id: 'squareFootage',
    type: 'slider',
    section: 'facility',
    title: 'Home square footage',
    range: { min: 500, max: 10000, step: 100 },
    smartDefault: 2000,
    unit: ' sq ft',
    merlinTip: 'Average US home: 2,261 sq ft consuming ~10,500 kWh/year. Homes 3,000+ sq ft typically benefit most from BESS + solar.',
    validation: { required: true, min: 500, max: 10000 },
    impactsCalculations: ['peakDemand', 'annualConsumption'],
  },
  {
    id: 'occupants',
    type: 'buttons',
    section: 'facility',
    title: 'Number of occupants',
    options: [
      { value: '1-2', label: '1-2 People', icon: '👤' },
      { value: '3-4', label: '3-4 People', icon: '👨‍👩‍👧' },
      { value: '5+', label: '5+ People', icon: '👨‍👩‍👧‍👦' },
    ],
    smartDefault: '3-4',
    validation: { required: true },
    impactsCalculations: ['annualConsumption'],
  },
  {
    id: 'buildingAge',
    type: 'buttons',
    section: 'facility',
    title: 'Home age / condition',
    options: [
      { value: 'new', label: 'New Build (< 5 yr)', icon: '🏗️', description: 'Modern codes, efficient' },
      { value: 'renovated', label: 'Renovated / Updated', icon: '🔧' },
      { value: 'aging', label: 'Older Home (20+ yr)', icon: '🏚️', description: 'May need panel upgrade' },
    ],
    smartDefault: 'renovated',
    merlinTip: 'Older homes may need a panel upgrade (200A) to support BESS + EV charging. Budget $2,000-4,000 for panel upgrade if needed.',
    validation: { required: false },
    impactsCalculations: ['installCost'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'hvacType',
    type: 'buttons',
    section: 'operations',
    title: 'Primary HVAC system',
    subtitle: 'HVAC is 40-60% of residential energy consumption',
    options: [
      { value: 'heat-pump', label: 'Heat Pump (Mini-Split/Central)', icon: '🔄', description: 'All-electric, efficient' },
      { value: 'central-ac-gas', label: 'Central AC + Gas Heat', icon: '❄️', description: 'AC + gas furnace' },
      { value: 'central-ac-electric', label: 'Central AC + Electric Heat', icon: '⚡', description: 'Highest winter peaks' },
      { value: 'window-units', label: 'Window / Portable Units', icon: '📦', description: 'No central system' },
    ],
    smartDefault: 'central-ac-gas',
    merlinTip: 'All-electric homes (heat pump + EV + induction) are the ideal BESS customer — no gas bill means maximum benefit from TOU optimization.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'hvacLoad'],
  },
  {
    id: 'evCharging',
    type: 'buttons',
    section: 'operations',
    title: 'Electric vehicle charging',
    subtitle: 'An EV adds 30-40% to household electricity consumption',
    options: [
      { value: 'level2', label: 'Level 2 Charger (240V)', icon: '⚡', description: '32-48A, 7-11 kW' },
      { value: 'level1', label: 'Level 1 (Standard Outlet)', icon: '🔌', description: '120V, 1.4 kW slow charge' },
      { value: 'planned', label: 'Planning to Get EV', icon: '📋' },
      { value: 'none', label: 'No EV', icon: '🚗' },
    ],
    smartDefault: 'none',
    merlinTip: 'A Level 2 charger adds 7-11 kW of peak demand. BESS can charge the car overnight from stored solar, avoiding peak TOU rates.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },
  {
    id: 'pool',
    type: 'buttons',
    section: 'operations',
    title: 'Swimming pool or hot tub',
    options: [
      { value: 'pool-heated', label: 'Heated Pool', icon: '🏊', description: 'Electric or heat pump pool heater' },
      { value: 'pool-unheated', label: 'Unheated Pool', icon: '💧', description: 'Pump and filter only' },
      { value: 'hot-tub', label: 'Hot Tub / Spa', icon: '♨️' },
      { value: 'both', label: 'Pool + Hot Tub', icon: '🏖️' },
      { value: 'none', label: 'None', icon: '❌' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['baseLoad', 'peakDemand'],
  },
  {
    id: 'waterHeater',
    type: 'buttons',
    section: 'operations',
    title: 'Water heater type',
    options: [
      { value: 'heat-pump-wh', label: 'Heat Pump Water Heater', icon: '🔄', description: 'Most efficient electric' },
      { value: 'electric-tank', label: 'Electric Tank', icon: '🔥', description: '4.5 kW elements, high peak' },
      { value: 'gas', label: 'Gas Water Heater', icon: '⛽', description: 'No electric load' },
      { value: 'tankless-electric', label: 'Tankless Electric', icon: '⚡', description: '18-36 kW peak draw!' },
    ],
    smartDefault: 'gas',
    merlinTip: 'Tankless electric water heaters draw 18-36 kW instantaneously — more than most residential solar arrays can produce! BESS smooths this peak.',
    validation: { required: true },
    impactsCalculations: ['peakDemand'],
  },
  {
    id: 'cooking',
    type: 'buttons',
    section: 'operations',
    title: 'Cooking appliances',
    options: [
      { value: 'induction', label: 'Induction / Electric Range', icon: '🍳', description: 'All-electric kitchen' },
      { value: 'gas', label: 'Gas Range / Oven', icon: '🔥' },
      { value: 'mixed', label: 'Mix of Gas + Electric', icon: '🔄' },
    ],
    smartDefault: 'gas',
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
      { value: 'off-grid', label: 'Off-Grid / Considering', icon: '🏜️' },
    ],
    smartDefault: 'on-grid',
    validation: { required: true },
    impactsCalculations: ['gridConnection', 'bessMode'],
  },
  {
    id: 'gridReliability',
    type: 'buttons',
    section: 'energy',
    title: 'Power outage frequency',
    options: [
      { value: 'reliable', label: 'Rarely (< 1/year)', icon: '✅' },
      { value: 'occasional', label: 'Occasional (2-5/year)', icon: '⚡' },
      { value: 'frequent', label: 'Frequent (6+/year)', icon: '⚠️' },
    ],
    smartDefault: 'reliable',
    merlinTip: 'In outage-prone areas, BESS provides 8-12 hours of backup for essential loads. Much quieter and cleaner than a generator.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'utilityRateStructure',
    type: 'buttons',
    section: 'energy',
    title: 'Utility rate structure',
    subtitle: 'TOU rates make BESS economics dramatically better',
    options: [
      { value: 'tou', label: 'Time-of-Use (TOU)', icon: '⏰', description: 'Peak/off-peak pricing' },
      { value: 'flat', label: 'Flat Rate', icon: '📊', description: 'Same rate all day' },
      { value: 'tiered', label: 'Tiered / Baseline', icon: '📈', description: 'Price increases with usage' },
      { value: 'unknown', label: "Don't Know", icon: '❓' },
    ],
    smartDefault: 'unknown',
    merlinTip: 'TOU rates with a $0.20+/kWh peak-to-off-peak spread make BESS highly profitable. CA, HI, AZ, and many states have aggressive TOU rates.',
    validation: { required: true },
    impactsCalculations: ['touArbitrage', 'payback'],
  },
  {
    id: 'monthlyBill',
    type: 'buttons',
    section: 'energy',
    title: 'Average monthly electric bill',
    options: [
      { value: 'low', label: '< $100/month', icon: '🟢' },
      { value: 'moderate', label: '$100-200/month', icon: '🟡' },
      { value: 'high', label: '$200-400/month', icon: '🟠' },
      { value: 'very-high', label: '$400+/month', icon: '🔴' },
    ],
    smartDefault: 'moderate',
    merlinTip: 'Homes spending $200+/month on electricity see the best BESS payback. Solar + BESS can eliminate 70-90% of electricity costs.',
    validation: { required: true },
    impactsCalculations: ['annualConsumption', 'payback'],
  },

  // ── SECTION 4: SOLAR & GOALS ──
  {
    id: 'roofArea',
    type: 'slider',
    section: 'solar',
    title: 'Approximate building roof area?',
    subtitle: 'Building footprint / roof space — we\'ll calculate usable solar area',
    range: { min: 0, max: 5000, step: 50 },
    smartDefault: 2000,
    unit: ' sq ft',
    helpText: 'Don\'t worry about exact numbers — industry-standard usability factors are applied automatically',
    validation: { required: false, min: 0, max: 5000 },
    impactsCalculations: ['roofSolar', 'solarCapacity'],
  },
  {
    id: 'canopyInterest',
    type: 'buttons',
    section: 'solar',
    title: 'Interested in a solar carport or pergola?',
    subtitle: 'Driveway carport or patio pergola with integrated solar panels',
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
    title: 'Existing solar panels',
    options: [
      { value: 'existing', label: 'Yes — Solar Installed', icon: '☀️', description: 'Already generating solar power' },
      { value: 'planned', label: 'Want Solar + Storage', icon: '📋', description: 'Best residential value combo' },
      { value: 'none', label: 'Storage Only', icon: '🔋', description: 'Backup power + TOU savings' },
    ],
    smartDefault: 'planned',
    merlinTip: 'Solar + storage is the best residential value. Store daytime solar for evening use, backup power, and TOU arbitrage.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'solarCapacityKW',
    type: 'number_input',
    section: 'solar',
    title: 'Solar system size',
    subtitle: 'How large is your existing solar installation?',
    placeholder: 'e.g., 8',
    suffix: 'kW',
    smartDefault: 8,
    helpText: 'Typical residential solar systems are 5-15 kW. Check your solar app or installer documentation.',
    validation: { required: false, min: 1, max: 100 },
    impactsCalculations: ['solarSizing', 'bessMode'],
    conditionalLogic: {
      dependsOn: 'existingSolar',
      showIf: (value: unknown) => value === 'existing',
    },
  },
];
