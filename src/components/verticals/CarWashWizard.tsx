/**
 * CAR WASH WIZARD - Detailed Quote Builder
 * =========================================
 * 
 * Guided wizard for car wash owners to build a detailed BESS quote.
 * Pre-populated with data from the CarWashEnergy landing page calculator.
 * 
 * Equipment power data sourced from industry specifications (Nov 2025).
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 * - useCarWashLimits() from uiConfigService (DATABASE-DRIVEN LIMITS)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Droplets, Wind, Gauge, DollarSign, Calendar, Download,
  CheckCircle, AlertCircle, Info, Sparkles, Car, TrendingDown, Phone,
  FileText, FileSpreadsheet, File
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { useCarWashLimits, type CarWashUILimits } from '@/services/uiConfigService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// TYPES
// ============================================

export interface CarWashWizardInputs {
  // From landing page calculator
  numberOfBays: number;
  carsPerDay: number;
  state: string;
  monthlyBill?: number;
  
  // Optional - wizard will ask for these if not provided
  includesVacuums?: boolean;
  includesDryers?: boolean;
  
  // Contact info from lead form (optional)
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
}

interface CarWashWizardProps {
  onClose: () => void;
  initialInputs?: Partial<CarWashWizardInputs>;
  onComplete?: (quoteData: any) => void;
  onRequestConsultation?: () => void;
}

// ============================================
// CAR WASH EQUIPMENT POWER SPECIFICATIONS
// ============================================
// Source: Industry specifications document (Nov 2025)

const EQUIPMENT_POWER = {
  // Conveyor Systems (4-8 kW total)
  conveyor: {
    primary: 5, // 5 HP = 3.7 kW average
    rollerCallUp: 0.5,
    controls: 0.5,
  },
  
  // Washing Equipment (20-35 kW total)
  washing: {
    topBrush: 4, // 3.7-4.5 kW per unit
    wrapAroundBrush: 3.7, // per unit, 2-4 typical
    mitterCurtain: 1, // 0.75-1 kW per unit
    wheelBrush: 0.6, // 0.5-0.75 kW per unit
  },
  
  // High-Pressure Systems (15-25 kW total)
  highPressure: {
    pumpStation: 11, // 15 HP = 11 kW
    undercarriageWash: 2.5, // 2-5 HP
  },
  
  // Chemical Application (3-8 kW total)
  chemical: {
    pumpStation: 1.5, // per station, 2-4 typical
    foamGenerator: 0.5,
    tireShine: 0.3,
  },
  
  // Drying Systems (30-90 kW total) - LARGEST CONSUMER
  drying: {
    standardBlower: 7.5, // 10 HP = 7.5 kW per unit, 4-8 typical
    highPerformance: 33.5, // 45 HP large dryer
    windBlade: 15, // 20 HP
    sideMounted: 9, // 10-15 HP per side
  },
  
  // Vacuum Systems (15-60 kW depending on config)
  vacuum: {
    standAlone3Motor: 3.6, // 4.8 HP total
    centralSystem: 30, // 10-75 HP turbine
    detailing: 4.5, // 4-8 HP
  },
  
  // Water Heating (electric components only)
  waterHeating: {
    controls: 1,
    recircPump: 0.75,
    tankless: 25, // 9-47 kW if electric
  },
  
  // Air Compression (4-12 kW)
  airCompression: {
    compressor: 7.5, // 5-15 HP
    dryer: 0.75,
  },
  
  // Water Reclamation (3-10 kW)
  waterReclaim: {
    reclaimPump: 4, // 3-7.5 HP
    filtration: 1.5,
  },
  
  // HVAC & Facility (5-20 kW)
  facility: {
    lighting: 6, // 2-12 kW tunnel
    controls: 0.5,
    pos: 0.5,
    security: 0.3,
    gates: 0.75,
  },
  
  // Specialty (5-15 kW)
  specialty: {
    reverseOsmosis: 2.5, // 2-5 HP
    wheelBlaster: 1.5, // per unit
  },
};

// Wash type configurations
const WASH_TYPES = {
  'express-exterior': {
    name: 'Express Exterior Tunnel',
    description: 'High-throughput exterior wash only',
    carsPerHour: '30-60',
    peakDemandKW: { min: 120, max: 180 },
    avgDemandKW: { min: 80, max: 120 },
    kWhPerCar: { min: 0.6, max: 0.75 },
    typicalEquipment: ['conveyor', 'highPressure', 'washing', 'drying', 'chemical'],
  },
  'full-service': {
    name: 'Full-Service Tunnel',
    description: 'Complete wash with interior cleaning',
    carsPerHour: '50-100',
    peakDemandKW: { min: 150, max: 250 },
    avgDemandKW: { min: 100, max: 160 },
    kWhPerCar: { min: 0.65, max: 0.8 },
    typicalEquipment: ['conveyor', 'highPressure', 'washing', 'drying', 'chemical', 'vacuum', 'detailing'],
  },
  'self-service': {
    name: 'Self-Service Bays',
    description: 'Customer-operated wash bays',
    carsPerHour: '2-4 per bay',
    peakDemandKW: { min: 8, max: 15 }, // per bay
    avgDemandKW: { min: 2, max: 5 },
    kWhPerCar: { min: 0.5, max: 0.8 },
    typicalEquipment: ['highPressure', 'vacuum'],
  },
  'in-bay-automatic': {
    name: 'In-Bay Automatic (Rollover)',
    description: 'Single-bay automatic system',
    carsPerHour: '6-10',
    peakDemandKW: { min: 30, max: 60 },
    avgDemandKW: { min: 20, max: 40 },
    kWhPerCar: { min: 0.7, max: 1.2 },
    typicalEquipment: ['highPressure', 'washing', 'drying', 'chemical'],
  },
};

// State electricity rates
const STATE_RATES: Record<string, { rate: number; demandCharge: number; peakRate: number }> = {
  'California': { rate: 0.22, demandCharge: 25, peakRate: 0.35 },
  'Texas': { rate: 0.12, demandCharge: 15, peakRate: 0.18 },
  'Florida': { rate: 0.14, demandCharge: 12, peakRate: 0.20 },
  'New York': { rate: 0.20, demandCharge: 22, peakRate: 0.32 },
  'Arizona': { rate: 0.13, demandCharge: 18, peakRate: 0.22 },
  'Nevada': { rate: 0.11, demandCharge: 16, peakRate: 0.18 },
  'Colorado': { rate: 0.12, demandCharge: 14, peakRate: 0.19 },
  'Washington': { rate: 0.10, demandCharge: 10, peakRate: 0.14 },
  'Oregon': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Georgia': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Other': { rate: 0.13, demandCharge: 15, peakRate: 0.20 },
};

// ============================================
// WIZARD STEPS
// ============================================

const WIZARD_STEPS = [
  { id: 'wash-type', title: 'Wash Type', icon: Car },
  { id: 'equipment', title: 'Equipment', icon: Gauge },
  { id: 'operations', title: 'Operations', icon: Calendar },
  { id: 'energy-goals', title: 'Energy Goals', icon: Zap },
  { id: 'review', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function CarWashWizard({ 
  onClose, 
  initialInputs = {}, 
  onComplete,
  onRequestConsultation 
}: CarWashWizardProps) {
  // Database-driven UI limits
  const { limits, loading: limitsLoading } = useCarWashLimits();
  
  // Merge initial inputs with defaults (updated from database when available)
  const mergedInputs = {
    numberOfBays: initialInputs.numberOfBays ?? limits?.numberOfBays?.default ?? 4,
    carsPerDay: initialInputs.carsPerDay ?? limits?.carsPerDay?.default ?? 150,
    state: initialInputs.state ?? 'California',
    monthlyBill: initialInputs.monthlyBill ?? limits?.currentMonthlyBill?.default ?? 5000,
    includesVacuums: initialInputs.includesVacuums ?? true,
    includesDryers: initialInputs.includesDryers ?? true,
    businessName: initialInputs.businessName ?? '',
    ownerName: initialInputs.ownerName ?? '',
    email: initialInputs.email ?? '',
    phone: initialInputs.phone ?? '',
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // Step 1: Wash Type
  const [washType, setWashType] = useState<keyof typeof WASH_TYPES>('express-exterior');
  const [tunnelLength, setTunnelLength] = useState(120); // feet
  
  // Step 2: Equipment (pre-populated from landing page)
  const [equipment, setEquipment] = useState({
    // Conveyor
    hasConveyor: true,
    conveyorHP: 5,
    
    // Washing
    topBrushes: 2,
    wrapAroundBrushes: 4,
    mitterCurtains: 2,
    wheelBrushes: 4,
    
    // High Pressure
    highPressurePumps: 2,
    hasUndercarriage: true,
    
    // Drying - THE BIG ONE
    standardBlowers: mergedInputs.includesDryers ? 6 : 0,
    hasWindBlade: mergedInputs.includesDryers,
    hasHighPerformanceDryer: false,
    
    // Vacuum
    vacuumStations: mergedInputs.includesVacuums ? mergedInputs.numberOfBays * 2 : 0,
    hasCentralVacuum: mergedInputs.includesVacuums && mergedInputs.numberOfBays >= 4,
    
    // Chemical
    chemicalStations: 4,
    hasTireShine: true,
    
    // Water
    hasWaterReclaim: true,
    hasReverseOsmosis: true,
    waterHeatingType: 'gas' as 'gas' | 'electric' | 'none',
    
    // Air
    airCompressorHP: 10,
  });
  
  // Step 3: Operations
  const [operations, setOperations] = useState({
    hoursPerDay: 12,
    daysPerWeek: 7,
    peakHoursStart: 10, // 10 AM
    peakHoursEnd: 14, // 2 PM
    seasonalVariation: 'moderate' as 'low' | 'moderate' | 'high',
    winterHeatingNeeded: true,
  });
  
  // Step 4: Energy Goals
  const [energyGoals, setEnergyGoals] = useState({
    primaryGoal: 'demand-reduction' as 'demand-reduction' | 'backup-power' | 'solar-storage' | 'all',
    targetSavingsPercent: 40,
    interestInSolar: true,
    solarRoofArea: 5000, // sq ft available
    budgetRange: 'flexible' as 'tight' | 'moderate' | 'flexible',
    financingPreference: 'loan' as 'cash' | 'loan' | 'ppa' | 'lease',
  });
  
  // Calculated values
  const [calculatedPower, setCalculatedPower] = useState({
    peakDemandKW: 0,
    avgDemandKW: 0,
    dailyKWh: 0,
    monthlyKWh: 0,
    demandCharges: 0,
    energyCharges: 0,
  });
  
  // Calculate power based on equipment selections
  useEffect(() => {
    const calc = calculateEquipmentPower();
    setCalculatedPower(calc);
  }, [equipment, operations, washType, initialInputs]);
  
  function calculateEquipmentPower() {
    let peakKW = 0;
    
    // Conveyor
    if (equipment.hasConveyor) {
      peakKW += equipment.conveyorHP * 0.746; // HP to kW
      peakKW += EQUIPMENT_POWER.conveyor.rollerCallUp;
      peakKW += EQUIPMENT_POWER.conveyor.controls;
    }
    
    // Washing Equipment
    peakKW += equipment.topBrushes * EQUIPMENT_POWER.washing.topBrush;
    peakKW += equipment.wrapAroundBrushes * EQUIPMENT_POWER.washing.wrapAroundBrush;
    peakKW += equipment.mitterCurtains * EQUIPMENT_POWER.washing.mitterCurtain;
    peakKW += equipment.wheelBrushes * EQUIPMENT_POWER.washing.wheelBrush;
    
    // High Pressure
    peakKW += equipment.highPressurePumps * EQUIPMENT_POWER.highPressure.pumpStation;
    if (equipment.hasUndercarriage) {
      peakKW += EQUIPMENT_POWER.highPressure.undercarriageWash;
    }
    
    // Drying - LARGEST CONSUMER (30-40% of total)
    peakKW += equipment.standardBlowers * EQUIPMENT_POWER.drying.standardBlower;
    if (equipment.hasWindBlade) {
      peakKW += EQUIPMENT_POWER.drying.windBlade;
    }
    if (equipment.hasHighPerformanceDryer) {
      peakKW += EQUIPMENT_POWER.drying.highPerformance;
    }
    
    // Vacuum - Central system and standalone stations can coexist
    if (equipment.hasCentralVacuum) {
      peakKW += EQUIPMENT_POWER.vacuum.centralSystem;
    }
    // Standalone vacuum stations (in parking lot / self-serve bays)
    peakKW += equipment.vacuumStations * EQUIPMENT_POWER.vacuum.standAlone3Motor;
    
    // Chemical
    peakKW += equipment.chemicalStations * EQUIPMENT_POWER.chemical.pumpStation;
    peakKW += EQUIPMENT_POWER.chemical.foamGenerator;
    if (equipment.hasTireShine) {
      peakKW += EQUIPMENT_POWER.chemical.tireShine;
    }
    
    // Water
    if (equipment.hasWaterReclaim) {
      peakKW += EQUIPMENT_POWER.waterReclaim.reclaimPump;
      peakKW += EQUIPMENT_POWER.waterReclaim.filtration;
    }
    if (equipment.hasReverseOsmosis) {
      peakKW += EQUIPMENT_POWER.specialty.reverseOsmosis;
    }
    if (equipment.waterHeatingType === 'electric') {
      peakKW += EQUIPMENT_POWER.waterHeating.tankless;
    } else {
      peakKW += EQUIPMENT_POWER.waterHeating.controls;
      peakKW += EQUIPMENT_POWER.waterHeating.recircPump;
    }
    
    // Air Compression
    peakKW += equipment.airCompressorHP * 0.746;
    peakKW += EQUIPMENT_POWER.airCompression.dryer;
    
    // Facility
    peakKW += EQUIPMENT_POWER.facility.lighting;
    peakKW += EQUIPMENT_POWER.facility.controls;
    peakKW += EQUIPMENT_POWER.facility.pos;
    peakKW += EQUIPMENT_POWER.facility.security;
    peakKW += EQUIPMENT_POWER.facility.gates;
    
    // Load diversity factor (not all equipment runs simultaneously)
    const diversityFactor = 0.7; // 70% typical
    const avgKW = peakKW * diversityFactor;
    
    // Daily energy
    const peakHours = operations.peakHoursEnd - operations.peakHoursStart;
    const offPeakHours = operations.hoursPerDay - peakHours;
    const dailyKWh = (peakKW * peakHours * 0.85) + (avgKW * offPeakHours * 0.6);
    
    // Monthly
    const monthlyKWh = dailyKWh * operations.daysPerWeek * 4.33;
    
    // Costs
    const stateData = STATE_RATES[mergedInputs.state] || STATE_RATES['Other'];
    const demandCharges = peakKW * stateData.demandCharge;
    const energyCharges = monthlyKWh * stateData.rate;
    
    return {
      peakDemandKW: Math.round(peakKW),
      avgDemandKW: Math.round(avgKW),
      dailyKWh: Math.round(dailyKWh),
      monthlyKWh: Math.round(monthlyKWh),
      demandCharges: Math.round(demandCharges),
      energyCharges: Math.round(energyCharges),
    };
  }
  
  // Generate final quote
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      // Size battery to shave peak demand
      const targetPeakReduction = energyGoals.targetSavingsPercent / 100;
      const batteryPowerKW = calculatedPower.peakDemandKW * targetPeakReduction;
      const storageSizeMW = batteryPowerKW / 1000;
      
      // Duration based on peak hours
      const peakHours = operations.peakHoursEnd - operations.peakHoursStart;
      const durationHours = Math.min(peakHours, 4); // Max 4 hours typically
      
      const stateData = STATE_RATES[mergedInputs.state] || STATE_RATES['Other'];
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: mergedInputs.state,
        electricityRate: stateData.rate,
        useCase: 'car-wash',
        solarMW: energyGoals.interestInSolar ? (energyGoals.solarRoofArea * 0.015 / 1000) : 0, // ~15W/sqft
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // Download quote as formatted HTML document
  function downloadQuote() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const formatKW = (n: number) => n >= 1000 ? `${(n/1000).toFixed(2)} MW` : `${Math.round(n)} kW`;
    const formatKWh = (n: number) => n >= 1000 ? `${(n/1000).toFixed(2)} MWh` : `${Math.round(n)} kWh`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Car Wash Energy Quote - ${mergedInputs.businessName || 'Your Car Wash'}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    h1 { color: #0891b2; border-bottom: 3px solid #0891b2; padding-bottom: 10px; }
    h2 { color: #6366f1; margin-top: 30px; }
    h3 { color: #059669; margin-top: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
    .date { color: #64748b; }
    .summary-box { background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .savings { font-size: 48px; font-weight: bold; color: #059669; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
    .card h4 { margin: 0 0 10px 0; color: #475569; font-size: 14px; text-transform: uppercase; }
    .card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; color: #475569; }
    .total-row { background: #ecfdf5; font-weight: bold; }
    .icon { display: inline-block; width: 24px; height: 24px; margin-right: 8px; vertical-align: middle; }
    .highlight { background: #fef3c7; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    .section { margin-bottom: 30px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">&#9889; Merlin Energy</div>
    <div class="date">Quote Date: ${new Date().toLocaleDateString()}</div>
  </div>
  
  <h1>Car Wash Energy Storage Quote</h1>
  
  <p><strong>${mergedInputs.businessName || 'Car Wash Business'}</strong><br>
  ${mergedInputs.numberOfBays} Wash Bays • ${mergedInputs.carsPerDay} cars/day • ${mergedInputs.state}</p>
  
  <div class="summary-box">
    <div style="font-size: 14px; color: #059669; margin-bottom: 5px;">&#36; ESTIMATED ANNUAL SAVINGS</div>
    <div class="savings">${formatCurrency(quoteResult.financials.annualSavings)}</div>
    <div style="color: #64748b; margin-top: 5px;">per year</div>
  </div>
  
  <div class="grid">
    <div class="card"><h4>Payback Period</h4><div class="value">${quoteResult.financials.paybackYears.toFixed(1)} years</div></div>
    <div class="card"><h4>25-Year ROI</h4><div class="value">${Math.round(quoteResult.financials.roi25Year)}%</div></div>
    <div class="card"><h4>Net Cost (after ITC)</h4><div class="value">${formatCurrency(quoteResult.costs.netCost)}</div></div>
    <div class="card"><h4>System Size</h4><div class="value">${formatKW(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)}</div></div>
  </div>
  
  <div class="section">
    <h2>BATTERY ENERGY STORAGE SYSTEM</h2>
    <table>
      <tr><th>Specification</th><th>Value</th></tr>
      <tr><td>Power Rating</td><td>${formatKW(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)}</td></tr>
      <tr><td>Energy Capacity</td><td>${formatKWh(quoteResult.equipment.batteries.unitEnergyMWh * 1000)}</td></tr>
      <tr><td>Runtime at Peak</td><td>${operations.peakHoursEnd - operations.peakHoursStart} hours</td></tr>
      <tr><td>Battery Type</td><td>${quoteResult.equipment.batteries.model}</td></tr>
      <tr><td>Manufacturer</td><td>${quoteResult.equipment.batteries.manufacturer}</td></tr>
      <tr class="highlight"><td><strong>Battery Cost</strong></td><td><strong>${formatCurrency(quoteResult.equipment.batteries.totalCost)}</strong></td></tr>
    </table>
  </div>
  
  ${quoteResult.equipment.solar ? `
  <div class="section">
    <h2>SOLAR POWER SYSTEM</h2>
    <table>
      <tr><th>Specification</th><th>Value</th></tr>
      <tr><td>System Size</td><td>${quoteResult.equipment.solar.totalMW >= 1 ? `${quoteResult.equipment.solar.totalMW.toFixed(2)} MW` : `${Math.round(quoteResult.equipment.solar.totalMW * 1000)} kW`}</td></tr>
      <tr><td>Solar Panels</td><td>${quoteResult.equipment.solar.panelQuantity.toLocaleString()} panels</td></tr>
      <tr><td>Est. Annual Generation</td><td>${Math.round(quoteResult.equipment.solar.totalMW * 1500).toLocaleString()} MWh/yr</td></tr>
      <tr><td>Roof Space Required</td><td>${quoteResult.equipment.solar.spaceRequirements.rooftopAreaSqFt.toLocaleString()} sq ft</td></tr>
      <tr class="highlight"><td><strong>Solar Cost</strong></td><td><strong>${formatCurrency(quoteResult.equipment.solar.totalCost)}</strong></td></tr>
    </table>
  </div>
  ` : ''}
  
  ${quoteResult.equipment.generators ? `
  <div class="section">
    <h2>BACKUP GENERATOR</h2>
    <table>
      <tr><th>Specification</th><th>Value</th></tr>
      <tr><td>Generator Power</td><td>${(quoteResult.equipment.generators.unitPowerMW * quoteResult.equipment.generators.quantity * 1000).toFixed(0)} kW</td></tr>
      <tr><td>Configuration</td><td>${quoteResult.equipment.generators.quantity}x ${quoteResult.equipment.generators.unitPowerMW} MW units</td></tr>
      <tr><td>Fuel Type</td><td>${quoteResult.equipment.generators.fuelType}</td></tr>
      <tr><td>Manufacturer</td><td>${quoteResult.equipment.generators.manufacturer}</td></tr>
      <tr class="highlight"><td><strong>Generator Cost</strong></td><td><strong>${formatCurrency(quoteResult.equipment.generators.totalCost)}</strong></td></tr>
    </table>
  </div>
  ` : ''}
  
  <div class="section">
    <h2>POWER ELECTRONICS &amp; SWITCHGEAR</h2>
    <table>
      <tr><th>Equipment</th><th>Specs</th><th>Cost</th></tr>
      <tr><td>Bi-Directional Inverter</td><td>${quoteResult.equipment.inverters.quantity}x ${quoteResult.equipment.inverters.unitPowerMW} MW - ${quoteResult.equipment.inverters.manufacturer}</td><td>${formatCurrency(quoteResult.equipment.inverters.totalCost)}</td></tr>
      <tr><td>Step-Up Transformer</td><td>${quoteResult.equipment.transformers.quantity}x ${quoteResult.equipment.transformers.unitPowerMVA} MVA - ${quoteResult.equipment.transformers.voltage}</td><td>${formatCurrency(quoteResult.equipment.transformers.totalCost)}</td></tr>
      <tr><td>Medium Voltage Switchgear</td><td>${quoteResult.equipment.switchgear.quantity}x ${quoteResult.equipment.switchgear.voltage}</td><td>${formatCurrency(quoteResult.equipment.switchgear.totalCost)}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h2>INSTALLATION &amp; TURNKEY PACKAGE</h2>
    <table>
      <tr><th>Item</th><th>Cost</th></tr>
      <tr><td>Balance of System (BOS)</td><td>${formatCurrency(quoteResult.equipment.installation.bos)}</td></tr>
      <tr><td>EPC (Engineering, Procurement, Construction)</td><td>${formatCurrency(quoteResult.equipment.installation.epc)}</td></tr>
      <tr><td>Contingency & Permitting</td><td>${formatCurrency(quoteResult.equipment.installation.contingency)}</td></tr>
      <tr class="highlight"><td><strong>Total Installation</strong></td><td><strong>${formatCurrency(quoteResult.equipment.installation.totalInstallation)}</strong></td></tr>
    </table>
    <p style="color: #64748b; font-size: 12px;">Includes: Site prep, electrical work, grid interconnection, commissioning & testing</p>
  </div>
  
  <div class="section">
    <h2>INVESTMENT SUMMARY</h2>
    <table>
      <tr><td>Total Equipment Cost</td><td>${formatCurrency(quoteResult.costs.equipmentCost)}</td></tr>
      <tr><td>Total Installation Cost</td><td>${formatCurrency(quoteResult.costs.installationCost)}</td></tr>
      <tr style="font-size: 18px;"><td><strong>Total Project Cost</strong></td><td><strong>${formatCurrency(quoteResult.costs.totalProjectCost)}</strong></td></tr>
      <tr style="color: #059669;"><td>Federal Tax Credit (30% ITC)</td><td>-${formatCurrency(quoteResult.costs.taxCredit)}</td></tr>
      <tr class="total-row" style="font-size: 20px;"><td><strong>Net Cost After Incentives</strong></td><td><strong>${formatCurrency(quoteResult.costs.netCost)}</strong></td></tr>
    </table>
  </div>
  
  <div class="section">
    <h3>Financial Analysis</h3>
    <div class="grid">
      <div class="card"><h4>Annual Savings</h4><div class="value">${formatCurrency(quoteResult.financials.annualSavings)}</div></div>
      <div class="card"><h4>Simple Payback</h4><div class="value">${quoteResult.financials.paybackYears.toFixed(1)} years</div></div>
      <div class="card"><h4>10-Year ROI</h4><div class="value">${Math.round(quoteResult.financials.roi10Year)}%</div></div>
      <div class="card"><h4>25-Year ROI</h4><div class="value">${Math.round(quoteResult.financials.roi25Year)}%</div></div>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>Disclaimer:</strong> This quote is an estimate based on the information provided. Actual costs may vary based on site conditions, permitting requirements, and market conditions. Contact us for a detailed engineering assessment.</p>
    <p>Generated by Merlin Energy • ${new Date().toLocaleString()} • www.merlin.energy</p>
  </div>
</body>
</html>`;
    
    // Create blob and download with proper UTF-8 encoding
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CarWash_Quote_${mergedInputs.businessName?.replace(/\s+/g, '_') || 'Quote'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also call onComplete if provided
    onComplete?.({ 
      inputs: mergedInputs, 
      equipment, 
      operations, 
      energyGoals, 
      calculatedPower, 
      quoteResult 
    });
  }

  // Download as Word document - Enhanced Merlin Template
  async function downloadWord() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const formatKW = (n: number) => n >= 1000 ? `${(n/1000).toFixed(2)} MW` : `${Math.round(n)} kW`;
    const formatKWh = (n: number) => n >= 1000 ? `${(n/1000).toFixed(2)} MWh` : `${Math.round(n)} kWh`;
    const batteryKW = Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100);
    
    // Colors: Purple (7C3AED), Dark Gray (374151), Light Gray (6B7280), Black (000000)
    const PURPLE = '7C3AED';
    const DARK_GRAY = '374151';
    const LIGHT_GRAY = '6B7280';
    const GREEN = '059669';
    
    // Font sizes: 12pt = 24 half-points, 14pt = 28 half-points
    const BODY_SIZE = 24;      // 12pt
    const HEADER_SIZE = 28;    // 14pt
    const TITLE_SIZE = 48;     // 24pt
    const BIG_NUMBER = 72;     // 36pt
    
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Helvetica', size: BODY_SIZE, color: DARK_GRAY },
          },
        },
      },
      sections: [{
        children: [
          // ═══════════════════════════════════════════════════════════════
          // HEADER - Bold Purple Branding
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '⚡ ', size: TITLE_SIZE }),
              new TextRun({ text: 'MERLIN', bold: true, size: TITLE_SIZE, color: PURPLE, font: 'Helvetica' }),
              new TextRun({ text: ' ENERGY', bold: true, size: TITLE_SIZE, color: DARK_GRAY, font: 'Helvetica' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Battery Energy Solutions', size: HEADER_SIZE, color: LIGHT_GRAY, font: 'Helvetica', italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          
          // Divider line (using underscores)
          new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: PURPLE, size: 16 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          
          // Quote Title
          new Paragraph({
            children: [new TextRun({ text: 'CAR WASH ENERGY STORAGE QUOTE', bold: true, size: 36, color: PURPLE, font: 'Helvetica' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          
          // Quote metadata
          new Paragraph({
            children: [
              new TextRun({ text: 'Quote #', size: BODY_SIZE, color: LIGHT_GRAY, font: 'Helvetica' }),
              new TextRun({ text: `MER-${Date.now().toString().slice(-6)}`, bold: true, size: BODY_SIZE, color: PURPLE, font: 'Helvetica' }),
              new TextRun({ text: '  |  ', size: BODY_SIZE, color: LIGHT_GRAY }),
              new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // ═══════════════════════════════════════════════════════════════
          // CUSTOMER INFORMATION - Clean Table
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'CUSTOMER INFORMATION', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: 'Business Name', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], 
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { fill: 'F3F4F6' },
                }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mergedInputs.businessName || 'Car Wash Business', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Location', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mergedInputs.state, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Facility Size', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${mergedInputs.numberOfBays} wash bays`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Daily Volume', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${mergedInputs.carsPerDay} vehicles/day`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Peak Demand', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${calculatedPower.peakDemandKW} kW`, size: BODY_SIZE, color: PURPLE, bold: true, font: 'Helvetica' })] })] }),
              ]}),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 300 } }),

          // ═══════════════════════════════════════════════════════════════
          // SAVINGS HIGHLIGHT - Big Impact Number
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: GREEN, size: 16 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '💰 ESTIMATED ANNUAL SAVINGS', bold: true, size: HEADER_SIZE, color: DARK_GRAY, font: 'Helvetica' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: formatCurrency(quoteResult.financials.annualSavings), bold: true, size: BIG_NUMBER, color: GREEN, font: 'Helvetica' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'per year', size: BODY_SIZE, color: LIGHT_GRAY, font: 'Helvetica', italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: GREEN, size: 16 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // ═══════════════════════════════════════════════════════════════
          // KEY METRICS - Quick Overview Cards
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'KEY FINANCIAL METRICS', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ 
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Payback Period', bold: true, size: BODY_SIZE, color: LIGHT_GRAY, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: `${quoteResult.financials.paybackYears.toFixed(1)} years`, bold: true, size: 32, color: PURPLE, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                  ],
                  shading: { fill: 'F5F3FF' },
                }),
                new TableCell({ 
                  children: [
                    new Paragraph({ children: [new TextRun({ text: '25-Year ROI', bold: true, size: BODY_SIZE, color: LIGHT_GRAY, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: `${Math.round(quoteResult.financials.roi25Year)}%`, bold: true, size: 32, color: PURPLE, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                  ],
                  shading: { fill: 'F5F3FF' },
                }),
                new TableCell({ 
                  children: [
                    new Paragraph({ children: [new TextRun({ text: 'Net Investment', bold: true, size: BODY_SIZE, color: LIGHT_GRAY, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.netCost), bold: true, size: 32, color: GREEN, font: 'Helvetica' })], alignment: AlignmentType.CENTER }),
                  ],
                  shading: { fill: 'ECFDF5' },
                }),
              ]}),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 400 } }),

          // ═══════════════════════════════════════════════════════════════
          // BATTERY SYSTEM
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'BATTERY ENERGY STORAGE SYSTEM', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Specification', bold: true, size: BODY_SIZE, color: 'FFFFFF', font: 'Helvetica' })] })], shading: { fill: PURPLE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true, size: BODY_SIZE, color: 'FFFFFF', font: 'Helvetica' })] })], shading: { fill: PURPLE } }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Power Rating', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatKW(batteryKW), bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Energy Capacity', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatKWh(quoteResult.equipment.batteries.unitEnergyMWh * 1000), bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Runtime at Peak', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${operations.peakHoursEnd - operations.peakHoursStart} hours`, bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Battery Technology', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: quoteResult.equipment.batteries.model, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Manufacturer', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: quoteResult.equipment.batteries.manufacturer, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Battery System Cost', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F5F3FF' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.batteries.totalCost), bold: true, size: BODY_SIZE, color: PURPLE, font: 'Helvetica' })] })], shading: { fill: 'F5F3FF' } }),
              ]}),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 300 } }),

          // ═══════════════════════════════════════════════════════════════
          // POWER ELECTRONICS
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'POWER ELECTRONICS & SWITCHGEAR', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Equipment', bold: true, size: BODY_SIZE, color: 'FFFFFF', font: 'Helvetica' })] })], shading: { fill: PURPLE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Specifications', bold: true, size: BODY_SIZE, color: 'FFFFFF', font: 'Helvetica' })] })], shading: { fill: PURPLE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Cost', bold: true, size: BODY_SIZE, color: 'FFFFFF', font: 'Helvetica' })] })], shading: { fill: PURPLE } }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Bi-Directional Inverter', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${quoteResult.equipment.inverters.quantity}x ${quoteResult.equipment.inverters.unitPowerMW} MW - ${quoteResult.equipment.inverters.manufacturer}`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.inverters.totalCost), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Step-Up Transformer', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${quoteResult.equipment.transformers.quantity}x ${quoteResult.equipment.transformers.unitPowerMVA} MVA - ${quoteResult.equipment.transformers.voltage}`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.transformers.totalCost), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'MV Switchgear', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${quoteResult.equipment.switchgear.quantity}x ${quoteResult.equipment.switchgear.type} - ${quoteResult.equipment.switchgear.voltage}`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.switchgear.totalCost), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 300 } }),

          // ═══════════════════════════════════════════════════════════════
          // INSTALLATION
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'TURNKEY INSTALLATION PACKAGE', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Balance of System (BOS)', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.installation.bos), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Engineering, Procurement, Construction (EPC)', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.installation.epc), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Contingency & Permitting', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.installation.contingency), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL INSTALLATION', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F5F3FF' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.equipment.installation.totalInstallation), bold: true, size: BODY_SIZE, color: PURPLE, font: 'Helvetica' })] })], shading: { fill: 'F5F3FF' } }),
              ]}),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Includes: Site preparation, electrical work, grid interconnection, commissioning & testing', size: 20, color: LIGHT_GRAY, font: 'Helvetica', italics: true })],
            spacing: { before: 100, after: 300 },
          }),

          // ═══════════════════════════════════════════════════════════════
          // INVESTMENT SUMMARY - The Money Slide
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [
              new TextRun({ text: '▶ ', color: PURPLE, size: HEADER_SIZE }),
              new TextRun({ text: 'INVESTMENT SUMMARY', bold: true, size: HEADER_SIZE, color: PURPLE, font: 'Helvetica' }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Equipment Cost', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.equipmentCost), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Installation Cost', size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'F9FAFB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.installationCost), size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL PROJECT COST', bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'E5E7EB' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.totalProjectCost), bold: true, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })], shading: { fill: 'E5E7EB' } }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Federal Tax Credit (30% ITC)', size: BODY_SIZE, color: GREEN, font: 'Helvetica' })] })], shading: { fill: 'ECFDF5' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `-${formatCurrency(quoteResult.costs.taxCredit)}`, bold: true, size: BODY_SIZE, color: GREEN, font: 'Helvetica' })] })], shading: { fill: 'ECFDF5' } }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '✓ NET COST AFTER INCENTIVES', bold: true, size: 28, color: GREEN, font: 'Helvetica' })] })], shading: { fill: 'D1FAE5' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.netCost), bold: true, size: 28, color: GREEN, font: 'Helvetica' })] })], shading: { fill: 'D1FAE5' } }),
              ]}),
            ],
          }),

          new Paragraph({ text: '', spacing: { after: 400 } }),

          // ═══════════════════════════════════════════════════════════════
          // FOOTER
          // ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: LIGHT_GRAY, size: 16 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'This quote is an estimate based on the information provided. Actual costs may vary based on site conditions, permitting requirements, and market conditions.', size: 18, color: LIGHT_GRAY, font: 'Helvetica', italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Generated by ', size: 18, color: LIGHT_GRAY, font: 'Helvetica' }),
              new TextRun({ text: 'Merlin Energy', bold: true, size: 18, color: PURPLE, font: 'Helvetica' }),
              new TextRun({ text: ` | ${new Date().toLocaleString()} | merlin.energy`, size: 18, color: LIGHT_GRAY, font: 'Helvetica' }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CarWash_Quote_${mergedInputs.businessName?.replace(/\s+/g, '_') || 'Quote'}_${new Date().toISOString().split('T')[0]}.docx`);
  }

  // Download as Excel (CSV format for compatibility)
  function downloadExcel() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => Math.round(n);
    const batteryKW = Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100);
    const batteryKWh = Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000);
    
    // Create CSV content
    const csvRows = [
      ['MERLIN ENERGY - Car Wash Battery Storage Quote'],
      [''],
      ['Quote Date', new Date().toLocaleDateString()],
      [''],
      ['BUSINESS INFORMATION'],
      ['Business Name', mergedInputs.businessName || 'Car Wash Business'],
      ['Location', mergedInputs.state],
      ['Wash Bays', mergedInputs.numberOfBays],
      ['Daily Volume', `${mergedInputs.carsPerDay} cars/day`],
      [''],
      ['SYSTEM SPECIFICATIONS'],
      ['Power Rating (kW)', batteryKW],
      ['Energy Capacity (kWh)', batteryKWh],
      ['Runtime at Peak (hours)', operations.peakHoursEnd - operations.peakHoursStart],
      ['Battery Type', quoteResult.equipment.batteries.model],
      ['Manufacturer', quoteResult.equipment.batteries.manufacturer],
      [''],
      ['EQUIPMENT COSTS'],
      ['Battery System', formatCurrency(quoteResult.equipment.batteries.totalCost)],
      ['Inverters', formatCurrency(quoteResult.equipment.inverters.totalCost)],
      ['Transformers', formatCurrency(quoteResult.equipment.transformers.totalCost)],
      ['Switchgear', formatCurrency(quoteResult.equipment.switchgear.totalCost)],
      ...(quoteResult.equipment.solar ? [['Solar System', formatCurrency(quoteResult.equipment.solar.totalCost)]] : []),
      ...(quoteResult.equipment.generators ? [['Generator System', formatCurrency(quoteResult.equipment.generators.totalCost)]] : []),
      [''],
      ['INSTALLATION COSTS'],
      ['Balance of System (BOS)', formatCurrency(quoteResult.equipment.installation.bos)],
      ['EPC', formatCurrency(quoteResult.equipment.installation.epc)],
      ['Contingency & Permitting', formatCurrency(quoteResult.equipment.installation.contingency)],
      ['Total Installation', formatCurrency(quoteResult.equipment.installation.totalInstallation)],
      [''],
      ['INVESTMENT SUMMARY'],
      ['Total Equipment Cost', formatCurrency(quoteResult.costs.equipmentCost)],
      ['Total Installation Cost', formatCurrency(quoteResult.costs.installationCost)],
      ['Total Project Cost', formatCurrency(quoteResult.costs.totalProjectCost)],
      ['Federal Tax Credit (30% ITC)', -formatCurrency(quoteResult.costs.taxCredit)],
      ['Net Cost After Incentives', formatCurrency(quoteResult.costs.netCost)],
      [''],
      ['FINANCIAL ANALYSIS'],
      ['Annual Savings', formatCurrency(quoteResult.financials.annualSavings)],
      ['Simple Payback (years)', quoteResult.financials.paybackYears.toFixed(1)],
      ['10-Year ROI (%)', Math.round(quoteResult.financials.roi10Year)],
      ['25-Year ROI (%)', Math.round(quoteResult.financials.roi25Year)],
    ];
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `CarWash_Quote_${mergedInputs.businessName?.replace(/\s+/g, '_') || 'Quote'}_${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Download as PDF (opens HTML in new window for printing)
  function downloadPDF() {
    if (!quoteResult) return;
    
    // First download as HTML, then user can print to PDF
    downloadQuote();
    
    // Show instruction
    setTimeout(() => {
      alert('To save as PDF:\\n\\n1. Open the downloaded HTML file\\n2. Press Ctrl+P (or Cmd+P on Mac)\\n3. Select "Save as PDF" as the printer\\n4. Click Save');
    }, 500);
  }

  // Run quote calculation when reaching final step
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1 && !quoteResult) {
      generateQuote();
    }
  }, [currentStep]);
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Wash type always valid
      case 1: return calculatedPower.peakDemandKW > 0;
      case 2: return operations.hoursPerDay > 0;
      case 3: return true; // Goals always valid
      case 4: return quoteResult !== null;
      default: return true;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-cyan-400/40 shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-800/80 via-teal-700/60 to-cyan-800/80 px-6 py-4 border-b border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white">Build Your Car Wash Quote</h2>
                <p className="text-sm text-cyan-300/70">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                      isActive 
                        ? 'bg-purple-500 text-white' 
                        : isComplete 
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30'
                          : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-medium hidden sm:inline">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 0: Wash Type */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">What type of car wash do you operate?</h3>
                <p className="text-cyan-200/70 text-sm">This helps us calculate your typical power consumption.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(WASH_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setWashType(key as keyof typeof WASH_TYPES)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      washType === key 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <p className="font-bold text-white">{type.name}</p>
                    <p className="text-sm text-cyan-200/70 mt-1">{type.description}</p>
                    <div className="flex gap-4 mt-3 text-xs">
                      <span className="text-emerald-400">{type.carsPerHour} cars/hr</span>
                      <span className="text-purple-400">{type.peakDemandKW.min}-{type.peakDemandKW.max} kW peak</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/20">
                <label className="block text-sm text-cyan-200 mb-2">Number of Wash Bays / Tunnel Length</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-3xl font-bold text-white">{mergedInputs.numberOfBays}</span>
                    <span className="text-cyan-300 ml-2">bays</span>
                  </div>
                  {washType !== 'self-service' && (
                    <div className="flex-1">
                      <input
                        type="range"
                        min={limits?.tunnelLength?.min ?? 60}
                        max={limits?.tunnelLength?.max ?? 300}
                        step={limits?.tunnelLength?.step ?? 10}
                        value={tunnelLength}
                        onChange={(e) => setTunnelLength(parseInt(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <p className="text-sm text-center text-purple-300">{tunnelLength} {limits?.tunnelLength?.unit || 'ft'} tunnel</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 1: Equipment */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Tell us about your equipment</h3>
                <p className="text-cyan-200/70 text-sm">Check all equipment currently installed. Drying systems typically account for 30-40% of energy use.</p>
              </div>
              
              {/* Power Summary */}
              <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-200">Estimated Peak Demand</p>
                    <p className="text-3xl font-bold text-white">{calculatedPower.peakDemandKW} kW</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-200">Monthly Usage</p>
                    <p className="text-2xl font-bold text-cyan-400">{calculatedPower.monthlyKWh.toLocaleString()} kWh</p>
                  </div>
                </div>
              </div>
              
              {/* Equipment Categories */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Drying - Highlight as biggest consumer */}
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Wind className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-amber-300">Drying Systems</h4>
                    <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">30-40% of usage</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{limits?.standardBlowers?.label || 'Standard Blowers'} ({limits?.standardBlowers?.powerKW ?? 7.5} kW each)</span>
                      <input
                        type="number"
                        min={limits?.standardBlowers?.min ?? 0}
                        max={limits?.standardBlowers?.max ?? 20}
                        value={equipment.standardBlowers}
                        onChange={(e) => setEquipment({...equipment, standardBlowers: parseInt(e.target.value) || 0})}
                        className="w-16 bg-white/10 rounded px-2 py-1 text-white text-center"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasWindBlade}
                        onChange={(e) => setEquipment({...equipment, hasWindBlade: e.target.checked})}
                        className="accent-amber-500"
                      />
                      <span className="text-white text-sm">Wind Blade (15 kW)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasHighPerformanceDryer}
                        onChange={(e) => setEquipment({...equipment, hasHighPerformanceDryer: e.target.checked})}
                        className="accent-amber-500"
                      />
                      <span className="text-white text-sm">High-Performance Dryer (33.5 kW)</span>
                    </label>
                  </div>
                </div>
                
                {/* Vacuum */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white">Vacuum Systems</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{limits?.vacuumStations?.label || 'Vacuum Stations'} ({limits?.vacuumStations?.powerKW ?? 3} kW each)</span>
                      <input
                        type="number"
                        min={limits?.vacuumStations?.min ?? 0}
                        max={limits?.vacuumStations?.max ?? 40}
                        value={equipment.vacuumStations}
                        onChange={(e) => setEquipment({...equipment, vacuumStations: parseInt(e.target.value) || 0})}
                        className="w-16 bg-white/10 rounded px-2 py-1 text-white text-center"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasCentralVacuum}
                        onChange={(e) => setEquipment({...equipment, hasCentralVacuum: e.target.checked})}
                        className="accent-cyan-500"
                      />
                      <span className="text-white text-sm">Central Vacuum System (30 kW)</span>
                    </label>
                  </div>
                </div>
                
                {/* High Pressure */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-white">High-Pressure Systems</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{limits?.highPressurePumps?.label || 'HP Pump Stations'} ({limits?.highPressurePumps?.powerKW ?? 11} kW each)</span>
                      <input
                        type="number"
                        min={limits?.highPressurePumps?.min ?? 0}
                        max={limits?.highPressurePumps?.max ?? 8}
                        value={equipment.highPressurePumps}
                        onChange={(e) => setEquipment({...equipment, highPressurePumps: parseInt(e.target.value) || 0})}
                        className="w-16 bg-white/10 rounded px-2 py-1 text-white text-center"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasUndercarriage}
                        onChange={(e) => setEquipment({...equipment, hasUndercarriage: e.target.checked})}
                        className="accent-blue-500"
                      />
                      <span className="text-white text-sm">Undercarriage Wash</span>
                    </label>
                  </div>
                </div>
                
                {/* Water Systems */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-white">Water Systems</h4>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasWaterReclaim}
                        onChange={(e) => setEquipment({...equipment, hasWaterReclaim: e.target.checked})}
                        className="accent-emerald-500"
                      />
                      <span className="text-white text-sm">Water Reclamation System</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={equipment.hasReverseOsmosis}
                        onChange={(e) => setEquipment({...equipment, hasReverseOsmosis: e.target.checked})}
                        className="accent-emerald-500"
                      />
                      <span className="text-white text-sm">Reverse Osmosis (Spot-Free)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">Water Heating:</span>
                      <select
                        value={equipment.waterHeatingType}
                        onChange={(e) => setEquipment({...equipment, waterHeatingType: e.target.value as any})}
                        className="bg-white/10 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="gas">Natural Gas</option>
                        <option value="electric">Electric (25 kW)</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Operations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Tell us about your operations</h3>
                <p className="text-cyan-200/70 text-sm">This helps optimize battery sizing for your peak hours.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-cyan-200 mb-2">Hours Open Per Day</label>
                    <input
                      type="range"
                      min="6"
                      max="24"
                      value={operations.hoursPerDay}
                      onChange={(e) => setOperations({...operations, hoursPerDay: parseInt(e.target.value)})}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-center text-white font-bold">{operations.hoursPerDay} hours/day</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-cyan-200 mb-2">Days Open Per Week</label>
                    <div className="flex gap-2">
                      {[5, 6, 7].map((d) => (
                        <button
                          key={d}
                          onClick={() => setOperations({...operations, daysPerWeek: d})}
                          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                            operations.daysPerWeek === d 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-cyan-200 mb-2">Peak Hours (Busiest Time)</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={operations.peakHoursStart}
                        onChange={(e) => setOperations({...operations, peakHoursStart: parseInt(e.target.value)})}
                        className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        {Array.from({length: 12}, (_, i) => i + 6).map((h) => (
                          <option key={h} value={h}>{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</option>
                        ))}
                      </select>
                      <span className="text-white">to</span>
                      <select
                        value={operations.peakHoursEnd}
                        onChange={(e) => setOperations({...operations, peakHoursEnd: parseInt(e.target.value)})}
                        className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white"
                      >
                        {Array.from({length: 12}, (_, i) => i + 12).map((h) => (
                          <option key={h} value={h}>{h > 12 ? h - 12 : h} PM</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-purple-300 mt-1">
                      {operations.peakHoursEnd - operations.peakHoursStart} hours of peak demand
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-cyan-200 mb-2">Seasonal Variation</label>
                    <div className="flex gap-2">
                      {(['low', 'moderate', 'high'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setOperations({...operations, seasonalVariation: s})}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            operations.seasonalVariation === s 
                              ? 'bg-cyan-500 text-white' 
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Operations Summary */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl p-4 border border-cyan-400/30">
                <h4 className="font-bold text-white mb-2">Estimated Monthly Energy Profile</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{calculatedPower.monthlyKWh.toLocaleString()}</p>
                    <p className="text-xs text-cyan-200/70">kWh/month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">${calculatedPower.demandCharges.toLocaleString()}</p>
                    <p className="text-xs text-purple-200/70">Demand Charges</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">${calculatedPower.energyCharges.toLocaleString()}</p>
                    <p className="text-xs text-emerald-200/70">Energy Charges</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Energy Goals */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">What are your energy goals?</h3>
                <p className="text-cyan-200/70 text-sm">This helps us optimize your system for maximum savings.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cyan-200 mb-3">Primary Goal</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { id: 'demand-reduction', label: 'Reduce Demand Charges', desc: 'Cut peak demand by 30-50%', icon: TrendingDown },
                      { id: 'backup-power', label: 'Backup Power', desc: 'Keep washing during outages', icon: Battery },
                      { id: 'solar-storage', label: 'Solar + Storage', desc: 'Generate & store your own power', icon: Sun },
                      { id: 'all', label: 'All of the Above', desc: 'Maximum savings & resilience', icon: Sparkles },
                    ].map((goal) => {
                      const Icon = goal.icon;
                      return (
                        <button
                          key={goal.id}
                          onClick={() => setEnergyGoals({...energyGoals, primaryGoal: goal.id as any})}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            energyGoals.primaryGoal === goal.id 
                              ? 'border-purple-500 bg-purple-500/20' 
                              : 'border-white/10 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6 text-purple-400" />
                            <div>
                              <p className="font-bold text-white">{goal.label}</p>
                              <p className="text-xs text-cyan-200/70">{goal.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">
                    {limits?.targetSavingsPercent?.label || 'Target Demand Reduction'}: <span className="text-purple-400 font-bold">{energyGoals.targetSavingsPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min={limits?.targetSavingsPercent?.min ?? 10}
                    max={limits?.targetSavingsPercent?.max ?? 80}
                    step={limits?.targetSavingsPercent?.step ?? 5}
                    value={energyGoals.targetSavingsPercent}
                    onChange={(e) => setEnergyGoals({...energyGoals, targetSavingsPercent: parseInt(e.target.value)})}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-cyan-200/50">
                    <span>Conservative ({limits?.targetSavingsPercent?.min ?? 10}%)</span>
                    <span>Aggressive ({limits?.targetSavingsPercent?.max ?? 80}%)</span>
                  </div>
                </div>
                
                {(energyGoals.primaryGoal === 'solar-storage' || energyGoals.primaryGoal === 'all') && (
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Sun className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-amber-300">Solar Options</h4>
                    </div>
                    <div>
                      <label className="block text-sm text-amber-200 mb-2">{limits?.solarRoofArea?.label || 'Available Roof Area for Solar'}</label>
                      <input
                        type="range"
                        min={limits?.solarRoofArea?.min ?? 0}
                        max={limits?.solarRoofArea?.max ?? 50000}
                        step={limits?.solarRoofArea?.step ?? 500}
                        value={energyGoals.solarRoofArea}
                        onChange={(e) => setEnergyGoals({...energyGoals, solarRoofArea: parseInt(e.target.value)})}
                        className="w-full accent-amber-500"
                      />
                      <p className="text-center text-white font-bold">
                        {energyGoals.solarRoofArea.toLocaleString()} {limits?.solarRoofArea?.unit || 'sq ft'} 
                        <span className="text-amber-400 ml-2">
                          (~{Math.round(energyGoals.solarRoofArea * 0.015)} kW solar)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">Financing Preference</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'cash', label: 'Cash Purchase' },
                      { id: 'loan', label: 'Loan/Finance' },
                      { id: 'ppa', label: 'PPA' },
                      { id: 'lease', label: 'Lease' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setEnergyGoals({...energyGoals, financingPreference: f.id as any})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          energyGoals.financingPreference === f.id 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Review Quote */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold">Calculating your custom quote...</p>
                  <p className="text-cyan-200/70 text-sm">Analyzing {calculatedPower.peakDemandKW} kW peak demand</p>
                </div>
              ) : quoteResult ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Your Custom Car Wash Quote</h3>
                    <p className="text-cyan-200/70">{mergedInputs.businessName || 'Your Car Wash'} • {mergedInputs.numberOfBays} Bays • {mergedInputs.state}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-purple-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                    <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold mb-2">💰 Annual Savings</p>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-cyan-200/70 mt-2">per year</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-cyan-500/20">
                      <p className="text-2xl font-bold text-cyan-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-xs text-cyan-200/70">Year Payback</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-purple-500/20">
                      <p className="text-2xl font-bold text-purple-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                      <p className="text-xs text-purple-200/70">25-Year ROI</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-emerald-500/20">
                      <p className="text-2xl font-bold text-emerald-400">{Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)} kW</p>
                      <p className="text-xs text-emerald-200/70">Battery Size</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-amber-500/20">
                      <p className="text-2xl font-bold text-amber-400">${Math.round(quoteResult.costs.netCost).toLocaleString()}</p>
                      <p className="text-xs text-amber-200/70">Net Cost (after ITC)</p>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      EQUIPMENT BREAKDOWN - DETAILED
                      ═══════════════════════════════════════════════════════════════ */}
                  
                  {/* Battery Energy Storage System */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-400/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Battery className="w-5 h-5 text-purple-400" />
                      <h4 className="font-bold text-white">Battery Energy Storage System (BESS)</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Power Rating:</span>
                          <span className="text-white font-medium">{Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Energy Capacity:</span>
                          <span className="text-white font-medium">
                            {quoteResult.equipment.batteries.unitEnergyMWh >= 1 
                              ? `${quoteResult.equipment.batteries.unitEnergyMWh.toFixed(2)} MWh` 
                              : `${Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000)} kWh`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Runtime at Peak:</span>
                          <span className="text-white font-medium">{(operations.peakHoursEnd - operations.peakHoursStart).toFixed(0)} hours</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Battery Type:</span>
                          <span className="text-white font-medium">{quoteResult.equipment.batteries.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Manufacturer:</span>
                          <span className="text-white font-medium">{quoteResult.equipment.batteries.manufacturer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-200/70">Battery Cost:</span>
                          <span className="text-purple-400 font-bold">${Math.round(quoteResult.equipment.batteries.totalCost).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-cyan-200/50">
                      Pricing: ${quoteResult.equipment.batteries.pricePerKWh}/kWh • Source: {quoteResult.equipment.batteries.marketIntelligence?.dataSource || 'NREL ATB 2024'}
                    </div>
                  </div>

                  {/* Solar (if requested) */}
                  {quoteResult.equipment.solar && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-xl p-4 border border-amber-400/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Sun className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-white">Solar Power System</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">System Size:</span>
                            <span className="text-white font-medium">
                              {quoteResult.equipment.solar.totalMW >= 1 
                                ? `${quoteResult.equipment.solar.totalMW.toFixed(2)} MW` 
                                : `${Math.round(quoteResult.equipment.solar.totalMW * 1000)} kW`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Solar Panels:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.solar.panelQuantity.toLocaleString()} panels</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Est. Annual Generation:</span>
                            <span className="text-white font-medium">{Math.round(quoteResult.equipment.solar.totalMW * 1500).toLocaleString()} MWh/yr</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Roof Space Needed:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.solar.spaceRequirements.rooftopAreaSqFt.toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Price Category:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.solar.priceCategory}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Solar Cost:</span>
                            <span className="text-amber-400 font-bold">${Math.round(quoteResult.equipment.solar.totalCost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-cyan-200/50">
                        ${quoteResult.equipment.solar.costPerWatt.toFixed(2)}/W installed • Includes panels, inverters & racking
                      </div>
                    </div>
                  )}

                  {/* Generator (if off-grid or requested) */}
                  {quoteResult.equipment.generators && (
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-400/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-red-400" />
                        <h4 className="font-bold text-white">Backup Generator System</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Generator Power:</span>
                            <span className="text-white font-medium">{(quoteResult.equipment.generators.unitPowerMW * quoteResult.equipment.generators.quantity * 1000).toFixed(0)} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Units:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.generators.quantity}x {quoteResult.equipment.generators.unitPowerMW} MW</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Fuel Type:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.generators.fuelType}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Runtime:</span>
                            <span className="text-white font-medium">24+ hours (with fuel)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Manufacturer:</span>
                            <span className="text-white font-medium">{quoteResult.equipment.generators.manufacturer}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyan-200/70">Generator Cost:</span>
                            <span className="text-red-400 font-bold">${Math.round(quoteResult.equipment.generators.totalCost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-cyan-200/50">
                        ${quoteResult.equipment.generators.costPerKW}/kW • Includes automatic transfer switch (ATS)
                      </div>
                    </div>
                  )}

                  {/* Power Electronics */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-400/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Gauge className="w-5 h-5 text-blue-400" />
                      <h4 className="font-bold text-white">Power Electronics & Switchgear</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      {/* Inverters */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 font-medium">Bi-Directional Inverter</span>
                          <span className="text-white font-bold">${Math.round(quoteResult.equipment.inverters.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-cyan-200/70">
                          <span>{quoteResult.equipment.inverters.quantity}x {quoteResult.equipment.inverters.unitPowerMW} MW units</span>
                          <span className="text-right">{quoteResult.equipment.inverters.manufacturer} {quoteResult.equipment.inverters.model}</span>
                        </div>
                      </div>
                      
                      {/* Transformer */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 font-medium">Step-Up Transformer</span>
                          <span className="text-white font-bold">${Math.round(quoteResult.equipment.transformers.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-cyan-200/70">
                          <span>{quoteResult.equipment.transformers.quantity}x {quoteResult.equipment.transformers.unitPowerMVA} MVA</span>
                          <span className="text-right">{quoteResult.equipment.transformers.voltage}</span>
                        </div>
                      </div>
                      
                      {/* Switchgear */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 font-medium">Medium Voltage Switchgear</span>
                          <span className="text-white font-bold">${Math.round(quoteResult.equipment.switchgear.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-cyan-200/70">
                          <span>{quoteResult.equipment.switchgear.quantity}x {quoteResult.equipment.switchgear.type}</span>
                          <span className="text-right">{quoteResult.equipment.switchgear.voltage} rated</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Installation & Turnkey Costs */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-emerald-400/30">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-white">Turnkey Installation Package</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-cyan-200/70">Balance of System (BOS)</span>
                        <span className="text-white font-medium">${Math.round(quoteResult.equipment.installation.bos).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-cyan-200/70">EPC (Engineering, Procurement, Construction)</span>
                        <span className="text-white font-medium">${Math.round(quoteResult.equipment.installation.epc).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-cyan-200/70">Contingency & Permitting</span>
                        <span className="text-white font-medium">${Math.round(quoteResult.equipment.installation.contingency).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 text-base">
                        <span className="text-emerald-300 font-medium">Total Installation</span>
                        <span className="text-emerald-400 font-bold">${Math.round(quoteResult.equipment.installation.totalInstallation).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-cyan-200/50">
                      Includes: Site prep, electrical work, grid interconnection, commissioning & testing
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-4 border border-white/20">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Investment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-cyan-200/70">Total Equipment Cost</span>
                        <span className="text-white font-medium">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-cyan-200/70">Total Installation Cost</span>
                        <span className="text-white font-medium">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10 text-lg">
                        <span className="text-white font-medium">Total Project Cost</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-emerald-300">Federal Tax Credit (30% ITC)</span>
                        <span className="text-emerald-400 font-bold">-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 text-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg px-3 -mx-1">
                        <span className="text-emerald-300 font-bold">Net Cost After Incentives</span>
                        <span className="text-emerald-400 font-black">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-cyan-200/50">Financing Option</p>
                        <p className="text-white font-bold">{energyGoals.financingPreference.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cyan-200/50">Est. Monthly Payment</p>
                        <p className="text-white font-bold">
                          ${Math.round(quoteResult.costs.netCost / (energyGoals.financingPreference === 'cash' ? 1 : 84)).toLocaleString()}
                          {energyGoals.financingPreference !== 'cash' && <span className="text-xs text-cyan-200/50">/mo (7yr)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Options */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyan-400" />
                      Download Your Quote
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={downloadWord}
                        className="flex flex-col items-center gap-2 bg-gradient-to-br from-blue-600/30 to-purple-600/30 hover:from-blue-500/40 hover:to-purple-500/40 border border-blue-400/40 text-white py-4 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        <FileText className="w-8 h-8 text-blue-400" />
                        <span className="text-sm">Word (.docx)</span>
                      </button>
                      <button
                        onClick={downloadExcel}
                        className="flex flex-col items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white py-4 rounded-xl font-medium transition-all hover:scale-105"
                      >
                        <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                        <span className="text-sm">Excel (.csv)</span>
                      </button>
                      <button
                        onClick={downloadPDF}
                        className="flex flex-col items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-white py-4 rounded-xl font-medium transition-all hover:scale-105"
                      >
                        <File className="w-8 h-8 text-red-400" />
                        <span className="text-sm">PDF (Print)</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {onRequestConsultation && (
                      <button
                        onClick={onRequestConsultation}
                        className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2 border border-purple-400/30"
                      >
                        <Phone className="w-5 h-5" />
                        Schedule a Consultation
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-red-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Error calculating quote. Please try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Navigation */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep === 0 ? onClose() : setCurrentStep(currentStep - 1)}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < WIZARD_STEPS.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-purple-500/30"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
