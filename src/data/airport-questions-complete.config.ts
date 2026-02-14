/**
 * Complete Airport Questionnaire Configuration
 *
 * 16 questions across 4 sections.
 * Calculator: generic_ssot_v1 (accepts any inputs)
 *
 * Sections:
 *   1. Facility (Q1-4)    — airportClass, annualPassengers, terminalSqFt, terminals
 *   2. Operations (Q5-9)  — jetBridges, parkingStructure, groundTransport, evChargers, cargoFacility
 *   3. Energy (Q10-13)    — gridConnection, gridReliability, existingGenerator, cogeneration
 *   4. Solar & Goals (Q14-16) — existingSolar, primaryGoal, budgetTimeline
 *
 * Created: Feb 2026
 */

import type { Question, Section } from './hotel-questions-complete.config';

export type { Question, Section };

export const airportSections: Section[] = [
  { id: 'facility', title: 'Airport Profile', description: 'Size, classification, and throughput', icon: '✈️' },
  { id: 'operations', title: 'Operations & Ground Systems', description: 'Jet bridges, ground transport, and cargo', icon: '🛬' },
  { id: 'energy', title: 'Power & Grid', description: 'Grid connection, reliability, and backup', icon: '⚡' },
  { id: 'solar', title: 'Solar & Goals', description: 'Renewable interest and project goals', icon: '☀️' },
];

export const airportQuestionsComplete: Question[] = [
  // ── SECTION 1: FACILITY ──
  {
    id: 'airportClass',
    type: 'buttons',
    section: 'facility',
    title: 'Airport classification',
    subtitle: 'Size class determines energy intensity and critical load requirements',
    options: [
      { value: 'large-hub', label: 'Large Hub', icon: '🌐', description: '10M+ passengers/year' },
      { value: 'medium-hub', label: 'Medium Hub', icon: '✈️', description: '2.5M-10M passengers/year' },
      { value: 'small-hub', label: 'Small Hub', icon: '🛩️', description: '500K-2.5M passengers/year' },
      { value: 'regional', label: 'Regional / General Aviation', icon: '🏢', description: '< 500K passengers/year' },
    ],
    smartDefault: 'medium-hub',
    merlinTip: 'FAA requires 100% critical system backup. BESS provides instant transfer (vs 10-15 sec generator startup), satisfying FAA Advisory Circular 150/5340-26.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'criticalLoad'],
  },
  {
    id: 'annualPassengers',
    type: 'slider',
    section: 'facility',
    title: 'Annual passenger throughput',
    subtitle: 'Enplanements + deplanements',
    range: { min: 100000, max: 50000000, step: 100000 },
    smartDefault: 5000000,
    unit: ' passengers',
    merlinTip: 'Energy intensity: ~2.5 kWh per passenger for mid-size airports, scaling down to ~1.5 kWh for large hubs (economy of scale).',
    validation: { required: true, min: 100000, max: 50000000 },
    impactsCalculations: ['peakDemand', 'annualConsumption'],
  },
  {
    id: 'terminalSqFt',
    type: 'slider',
    section: 'facility',
    title: 'Terminal building area',
    subtitle: 'Total conditioned terminal space',
    range: { min: 50000, max: 10000000, step: 50000 },
    smartDefault: 500000,
    unit: ' sq ft',
    validation: { required: true, min: 50000, max: 10000000 },
    impactsCalculations: ['peakDemand', 'hvacLoad', 'lightingLoad'],
  },
  {
    id: 'terminals',
    type: 'buttons',
    section: 'facility',
    title: 'Number of terminal buildings',
    options: [
      { value: '1', label: '1 Terminal', icon: '1️⃣' },
      { value: '2-3', label: '2-3 Terminals', icon: '🔢' },
      { value: '4+', label: '4+ Terminals', icon: '🏗️' },
    ],
    smartDefault: '1',
    validation: { required: false },
    impactsCalculations: ['distribution'],
  },

  // ── SECTION 2: OPERATIONS ──
  {
    id: 'jetBridges',
    type: 'buttons',
    section: 'operations',
    title: 'Number of gates with jet bridges',
    subtitle: 'Each jet bridge draws 15-30 kW for HVAC pre-conditioning',
    options: [
      { value: 'small', label: '1-10 Gates', icon: '🚪' },
      { value: 'medium', label: '10-30 Gates', icon: '🛬' },
      { value: 'large', label: '30-60 Gates', icon: '✈️' },
      { value: 'mega', label: '60+ Gates', icon: '🌐' },
    ],
    smartDefault: 'medium',
    merlinTip: 'Pre-conditioned air (PCA) for gates eliminates APU usage, saving airlines fuel while adding electrical load. BESS can smooth these intermittent peaks.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'jetBridgeLoad'],
  },
  {
    id: 'parkingStructure',
    type: 'buttons',
    section: 'operations',
    title: 'Parking facilities',
    options: [
      { value: 'large-garage', label: 'Large Garage (5,000+ spaces)', icon: '🅿️', description: 'Multi-level parking structure' },
      { value: 'small-garage', label: 'Smaller Garage', icon: '🏗️', description: '1,000-5,000 spaces' },
      { value: 'surface', label: 'Surface Lots Only', icon: '🚗', description: 'Open air parking' },
    ],
    smartDefault: 'large-garage',
    validation: { required: false },
    impactsCalculations: ['lightingLoad', 'solarPotential', 'evCharging'],
  },
  {
    id: 'groundTransport',
    type: 'buttons',
    section: 'operations',
    title: 'Ground transportation electrification',
    subtitle: 'Shuttle buses, people movers, electric GSE',
    options: [
      { value: 'heavy', label: 'Heavy Electrification', icon: '🔋', description: 'Electric buses, people movers, GSE' },
      { value: 'moderate', label: 'Some Electric GSE', icon: '⚡', description: 'Partial ground support electrification' },
      { value: 'minimal', label: 'Mostly Diesel/Gas', icon: '⛽', description: 'Traditional ground fleet' },
    ],
    smartDefault: 'moderate',
    merlinTip: 'Airport ground support equipment (GSE) electrification is mandated in many states. BESS enables depot charging without utility upgrades.',
    validation: { required: true },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },
  {
    id: 'evChargers',
    type: 'buttons',
    section: 'operations',
    title: 'Public EV charging (parking areas)',
    options: [
      { value: 'yes-extensive', label: 'Extensive (50+ stations)', icon: '⚡' },
      { value: 'yes-some', label: 'Some (10-50)', icon: '🔌' },
      { value: 'planned', label: 'Planned / Evaluating', icon: '📋' },
      { value: 'none', label: 'None', icon: '❌' },
    ],
    smartDefault: 'yes-some',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'evCharging'],
  },
  {
    id: 'cargoFacility',
    type: 'buttons',
    section: 'operations',
    title: 'Cargo / freight facility',
    subtitle: 'Cargo warehouses add refrigeration and material handling load',
    options: [
      { value: 'major', label: 'Major Cargo Hub', icon: '📦', description: 'Dedicated cargo terminal, cold chain' },
      { value: 'moderate', label: 'Moderate Cargo', icon: '🚛', description: 'Belly freight + some cargo' },
      { value: 'minimal', label: 'Minimal / No Cargo', icon: '❌' },
    ],
    smartDefault: 'moderate',
    validation: { required: false },
    impactsCalculations: ['peakDemand', 'refrigerationLoad'],
  },

  // ── SECTION 3: ENERGY ──
  {
    id: 'gridConnection',
    type: 'buttons',
    section: 'energy',
    title: 'Grid connection configuration',
    options: [
      { value: 'on-grid', label: 'Standard Grid Feed', icon: '🔌' },
      { value: 'redundant', label: 'Redundant Feeds', icon: '🔄', description: 'Dual or triple utility feeds' },
      { value: 'limited', label: 'Limited Capacity', icon: '⚠️', description: 'Grid constraining growth' },
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
    merlinTip: 'Airports require 99.99% uptime for airfield lighting (FAA). Even a 1-second gap can shut down operations. BESS provides instant (< 20ms) backup.',
    validation: { required: true },
    impactsCalculations: ['bessMode', 'backupCapacity'],
  },
  {
    id: 'existingGenerator',
    type: 'buttons',
    section: 'energy',
    title: 'Existing backup generation',
    options: [
      { value: 'yes-extensive', label: 'Extensive (N+1 or N+2)', icon: '⛽', description: 'Full airport backup' },
      { value: 'yes-partial', label: 'Partial Backup', icon: '🔋', description: 'Critical systems only' },
      { value: 'minimal', label: 'Minimal / Outdated', icon: '⚠️' },
    ],
    smartDefault: 'yes-extensive',
    validation: { required: true },
    impactsCalculations: ['backupCapacity', 'generatorSizing'],
  },
  {
    id: 'cogeneration',
    type: 'buttons',
    section: 'energy',
    title: 'On-site power generation',
    subtitle: 'Central utility plants, cogeneration, or microgrids',
    options: [
      { value: 'cogen', label: 'CHP / Cogeneration', icon: '🏭', description: 'Combined heat and power' },
      { value: 'microgrid', label: 'Airport Microgrid', icon: '🔌', description: 'Independent power system' },
      { value: 'none', label: 'Grid Power Only', icon: '⚡', description: 'No on-site generation' },
    ],
    smartDefault: 'none',
    validation: { required: false },
    impactsCalculations: ['bessMode', 'gridConnection'],
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
    merlinTip: 'Airports have massive flat roof and parking areas. Denver International has a 4 MW solar array. Many airports are pursuing net-zero targets.',
    validation: { required: true },
    impactsCalculations: ['solarSizing', 'bessMode'],
  },
  {
    id: 'primaryGoal',
    type: 'buttons',
    section: 'solar',
    title: 'Primary project goal',
    options: [
      { value: 'resilience', label: 'Critical Infrastructure Resilience', icon: '🛡️', description: 'FAA compliance, zero-gap transfer' },
      { value: 'cost', label: 'Reduce Energy Costs', icon: '💰', description: 'Peak shaving, demand management' },
      { value: 'sustainability', label: 'Net-Zero / Carbon Neutral', icon: '🌿', description: 'ACI net-zero carbon targets' },
      { value: 'capacity', label: 'Grid Capacity for Growth', icon: '🔌', description: 'Electrification without upgrades' },
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
