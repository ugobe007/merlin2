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

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Droplets, Wind, Gauge, DollarSign, Calendar, Download,
  CheckCircle, AlertCircle, Info, Sparkles, Car, TrendingDown, Phone,
  FileText, FileSpreadsheet, File, Building, BarChart3, MapPin, Target, Leaf, Clock
} from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { useCarWashLimits, type CarWashUILimits } from '@/services/uiConfigService';
import { 
  calculateCarWashEquipmentPower,
  type CarWashPowerInput,
  type CarWashAutomationLevel,
} from '@/services/useCasePowerCalculations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';
import { WizardPowerProfile, WizardStepHelp, COMMON_STEP_HELP, type StepHelpContent } from '@/components/wizard/shared';
import { PowerGaugeWidget, type PowerGaugeData } from '@/components/wizard/widgets';

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
  
  // Automation systems power by level
  // Legacy = older electromechanical, Standard = current PLC-based, Modern = AI/vision
  automation: {
    legacy: {
      plcController: 0.5,
      sensorBasic: 0.2,
      relayLogic: 0.3,
    },
    standard: {
      plcController: 0.8,
      sensorArray: 0.5,
      hmiDisplay: 0.3,
      networkSwitch: 0.2,
    },
    modern: {
      plcController: 1.2,
      visionSystem: 1.2, // Per camera
      aiProcessor: 2.0,
      sensorArray: 0.5,
      edgeComputing: 1.5,
    },
  },
};

// ============================================
// CAR WASH BRAND PROFILES
// ============================================
// Top 20 car wash chains with their typical equipment and power profiles
// Source: DRB Top 50 Car Washes (2024), industry research, company specs

const CAR_WASH_BRANDS = {
  // ========== TOP 10 BRANDS ==========
  'mister-car-wash': {
    name: 'Mister Car Wash',
    rank: 1,
    description: 'Largest US car wash chain',
    headquarters: 'Tucson, AZ',
    siteCount: 522,
    logo: '🚗',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 8,
      hasWindBlade: true,
      highPressurePumps: 3,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 140, max: 180 },
    avgDemandKW: { min: 90, max: 120 },
    notes: 'Full-tunnel express exterior focus',
  },
  'whistle-express': {
    name: 'Whistle Express Car Wash',
    rank: 2,
    description: 'Rapid growth express chain',
    headquarters: 'Charlotte, NC',
    siteCount: 545,
    logo: '🎵',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 120, max: 160 },
    avgDemandKW: { min: 80, max: 110 },
    notes: 'Southeast US focused, rapid expansion',
  },
  'club-car-wash': {
    name: 'Club Car Wash / EWC',
    rank: 3,
    description: 'Membership-focused express',
    headquarters: 'Columbia, MO',
    siteCount: 385,
    logo: '🏆',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'Strong membership model',
  },
  'tidal-wave': {
    name: 'Tidal Wave Auto Spa',
    rank: 4,
    description: 'Premium express experience',
    headquarters: 'Thomaston, GA',
    siteCount: 311,
    logo: '🌊',
    typicalWashType: 'express-exterior',
    automationLevel: 'modern',
    defaultEquipment: {
      standardBlowers: 8,
      hasWindBlade: true,
      hasHighPerformanceDryer: true,
      highPressurePumps: 3,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 160, max: 200 },
    avgDemandKW: { min: 100, max: 140 },
    notes: 'Premium equipment, modern automation',
  },
  'quick-quack': {
    name: 'Quick Quack Car Wash',
    rank: 5,
    description: 'Fun branding, fast service',
    headquarters: 'Sacramento, CA',
    siteCount: 340,
    logo: '🦆',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'California-based, eco-focused',
  },
  'zips': {
    name: 'Zips Car Wash',
    rank: 6,
    description: 'Value-focused express',
    headquarters: 'Plano, TX',
    siteCount: 295,
    logo: '⚡',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 6,
      hasWindBlade: false,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 110, max: 150 },
    avgDemandKW: { min: 70, max: 100 },
    notes: 'Efficient operations, value pricing',
  },
  'tommys-express': {
    name: "Tommy's Express Car Wash",
    rank: 7,
    description: 'High-tech express tunnel',
    headquarters: 'Holland, MI',
    siteCount: 259,
    logo: '🔴',
    typicalWashType: 'express-exterior',
    automationLevel: 'modern',
    defaultEquipment: {
      standardBlowers: 8,
      hasWindBlade: true,
      hasHighPerformanceDryer: true,
      highPressurePumps: 3,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 150, max: 190 },
    avgDemandKW: { min: 95, max: 130 },
    notes: 'Modern equipment, 3-min wash',
  },
  'spotless-brands': {
    name: 'Spotless Brands',
    rank: 8,
    description: 'Multi-brand portfolio',
    headquarters: 'Oakbrook Terrace, IL',
    siteCount: 205,
    logo: '✨',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'Operates multiple brands',
  },
  'go-car-wash': {
    name: 'GO Car Wash',
    rank: 9,
    description: 'Growing express chain',
    headquarters: 'Denver, CO',
    siteCount: 154,
    logo: '🟢',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 6,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 120, max: 160 },
    avgDemandKW: { min: 80, max: 110 },
    notes: 'Rapid expansion in western US',
  },
  'mammoth-holdings': {
    name: 'Mammoth Holdings',
    rank: 10,
    description: 'Multi-state operator',
    headquarters: 'Dallas, TX',
    siteCount: 152,
    logo: '🦣',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'Texas-based expansion',
  },
  // ========== BRANDS 11-20 ==========
  'whitewater-express': {
    name: 'Whitewater Express Car Wash',
    rank: 11,
    description: 'Houston-based express',
    headquarters: 'Houston, TX',
    siteCount: 130,
    logo: '💧',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 125, max: 165 },
    avgDemandKW: { min: 80, max: 110 },
    notes: 'Texas Gulf Coast focus',
  },
  'modwash': {
    name: 'ModWash Car Wash',
    rank: 12,
    description: 'Modern express concept',
    headquarters: 'Chattanooga, TN',
    siteCount: 122,
    logo: '🔷',
    typicalWashType: 'express-exterior',
    automationLevel: 'modern',
    defaultEquipment: {
      standardBlowers: 8,
      hasWindBlade: true,
      hasHighPerformanceDryer: true,
      highPressurePumps: 3,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 145, max: 185 },
    avgDemandKW: { min: 95, max: 125 },
    notes: 'Modern equipment, tech-forward',
  },
  'super-star': {
    name: 'Super Star Car Wash',
    rank: 13,
    description: 'Arizona market leader',
    headquarters: 'Phoenix, AZ',
    siteCount: 113,
    logo: '⭐',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'Southwest US focus',
  },
  'autobell': {
    name: 'Autobell Car Wash',
    rank: 14,
    description: 'Full-service tradition',
    headquarters: 'Charlotte, NC',
    siteCount: 90,
    logo: '🔔',
    typicalWashType: 'full-service',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 8,
      hasWindBlade: true,
      highPressurePumps: 3,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
      hasVacuumStations: true,
    },
    peakDemandKW: { min: 160, max: 220 },
    avgDemandKW: { min: 100, max: 150 },
    notes: 'Full-service with interior cleaning',
  },
  'luv-car-wash': {
    name: 'LUV Car Wash',
    rank: 15,
    description: 'Arizona express chain',
    headquarters: 'Gilbert, AZ',
    siteCount: 74,
    logo: '💜',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 6,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 115, max: 155 },
    avgDemandKW: { min: 75, max: 105 },
    notes: 'Growing Arizona presence',
  },
  'true-blue-wash': {
    name: 'True Blue Wash (Circle K)',
    rank: 16,
    description: 'C-store chain car wash',
    headquarters: 'Tempe, AZ',
    siteCount: 68,
    logo: '🔵',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 5,
      hasWindBlade: false,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 100, max: 140 },
    avgDemandKW: { min: 65, max: 95 },
    notes: 'Owned by Circle K convenience stores',
  },
  'caseys-express': {
    name: "Casey's Express Wash",
    rank: 17,
    description: 'Midwest c-store chain',
    headquarters: 'Ankeny, IA',
    siteCount: 66,
    logo: '🌽',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 5,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: false,
    },
    peakDemandKW: { min: 105, max: 145 },
    avgDemandKW: { min: 70, max: 100 },
    notes: 'Co-located with convenience stores',
  },
  'caliber-car-wash': {
    name: 'Caliber Car Wash',
    rank: 18,
    description: 'Atlanta-based express',
    headquarters: 'Atlanta, GA',
    siteCount: 64,
    logo: '🎯',
    typicalWashType: 'express-exterior',
    automationLevel: 'modern',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 135, max: 175 },
    avgDemandKW: { min: 85, max: 120 },
    notes: 'Southeast expansion',
  },
  'blue-wave-xpress': {
    name: 'Blue Wave Xpress',
    rank: 19,
    description: 'California express chain',
    headquarters: 'San Rafael, CA',
    siteCount: 63,
    logo: '🌀',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'Northern California focus',
  },
  'el-car-wash': {
    name: 'El Car Wash',
    rank: 20,
    description: 'South Florida express',
    headquarters: 'Miami, FL',
    siteCount: 62,
    logo: '☀️',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: {
      standardBlowers: 7,
      hasWindBlade: true,
      highPressurePumps: 2,
      hasWaterReclaim: true,
      hasReverseOsmosis: true,
    },
    peakDemandKW: { min: 130, max: 170 },
    avgDemandKW: { min: 85, max: 115 },
    notes: 'South Florida market leader',
  },
  // ========== INDEPENDENT OPTION ==========
  'independent': {
    name: 'Independent Car Wash',
    rank: null,
    description: 'Independent or regional car wash business',
    headquarters: null,
    siteCount: null,
    logo: '🏢',
    typicalWashType: 'express-exterior',
    automationLevel: 'standard',
    defaultEquipment: null, // Use manual entry
    peakDemandKW: null, // Calculate from equipment
    avgDemandKW: null,
    notes: 'Configure your equipment profile',
    allowBrandSubmission: true, // Flag to show brand submission form
  },
};

// ============================================
// CONCIERGE SERVICE TIERS
// ============================================
const CONCIERGE_TIERS = {
  'standard': {
    name: 'Standard',
    description: 'Self-service with AI recommendations',
    icon: '🤖',
    features: [
      'AI-powered equipment recommendations',
      'Industry benchmarking data',
      'Automated quote generation',
      'Email support',
    ],
    price: 'Free',
    badge: null as string | null,
  },
  'pro': {
    name: 'Concierge Pro',
    description: 'White-glove service for PE firms & multi-site operators',
    icon: '👔',
    features: [
      'Dedicated energy analyst',
      'Custom equipment recommendations',
      'Site audit coordination',
      'Multi-site portfolio management',
      'Quarterly performance reviews',
      'Priority phone support',
      'Custom integrations',
    ],
    price: 'Contact Sales',
    badge: 'PE Firms' as string | null,
  },
};

// ============================================
// PERFORMANCE METRICS CONFIG
// ============================================
// Data layer for tracking energy performance
// Key insight: Data = Energy - better data drives better savings
const PERFORMANCE_METRICS = {
  energyPerCar: {
    name: 'Energy per Car',
    unit: 'kWh/car',
    description: 'Energy consumed per vehicle washed',
    benchmark: { excellent: 0.5, good: 0.65, average: 0.8 },
  },
  peakReduction: {
    name: 'Peak Demand Reduction',
    unit: '%',
    description: 'Reduction in peak demand with BESS',
    benchmark: { excellent: 40, good: 30, average: 20 },
  },
  monthlyEnergySavings: {
    name: 'Monthly Energy Savings',
    unit: '$',
    description: 'Monthly cost savings from energy optimization',
    benchmark: null, // Varies by site
  },
  equipmentUtilization: {
    name: 'Equipment Utilization',
    unit: '%',
    description: 'Percentage of time equipment is actively washing',
    benchmark: { excellent: 70, good: 55, average: 40 },
  },
  waterRecoveryRate: {
    name: 'Water Recovery Rate',
    unit: '%',
    description: 'Percentage of water recycled',
    benchmark: { excellent: 85, good: 70, average: 50 },
  },
  carsPerKWh: {
    name: 'Throughput Efficiency',
    unit: 'cars/kWh',
    description: 'Number of cars washed per kWh',
    benchmark: { excellent: 2.0, good: 1.5, average: 1.2 },
  },
};

// Automation level configurations
const AUTOMATION_LEVELS = {
  'legacy': {
    name: 'Legacy',
    description: 'Older electromechanical systems (pre-2010)',
    powerMultiplier: 0.85, // Less efficient, but simpler
    additionalKW: 2, // Basic controls
  },
  'standard': {
    name: 'Standard',
    description: 'Current PLC-based automation (2010-2020)',
    powerMultiplier: 1.0,
    additionalKW: 4, // PLC + sensors + HMI
  },
  'modern': {
    name: 'Modern/AI',
    description: 'AI vision systems, real-time adaptation (2020+)',
    powerMultiplier: 1.08, // Slightly more for AI processing
    additionalKW: 8, // Vision + AI + edge computing
  },
};

// Wash type configurations (REMOVED robotic-automated - redundant)
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

// Simplified wash type categories for Step 0
const SIMPLIFIED_WASH_TYPES = {
  'automated-tunnel': {
    name: 'Automated Tunnel',
    description: 'Express exterior or full-service tunnel wash',
    icon: '🚗',
    peakDemandKW: { min: 120, max: 250 },
    avgMonthlyKWh: { min: 25000, max: 60000 },
    typicalBill: { min: 3500, max: 12000 },
    detailedTypes: ['express-exterior', 'full-service'],
  },
  'self-service-bay': {
    name: 'Self-Service Bay',
    description: 'Customer-operated wash bays with coin/card payment',
    icon: '🧽',
    peakDemandKW: { min: 8, max: 60 }, // scales with bays
    avgMonthlyKWh: { min: 2000, max: 15000 },
    typicalBill: { min: 500, max: 3000 },
    detailedTypes: ['self-service', 'in-bay-automatic'],
  },
};

// Energy goals for Step 0
const ENERGY_GOALS_OPTIONS = {
  'solar-bess': {
    name: 'Solar + Battery',
    description: 'Maximum savings with solar generation and battery storage',
    icon: Sun,
    color: 'amber',
    targetReduction: 50,
    features: ['Solar panels on roof/carport', 'Battery stores excess solar', 'Lowest long-term cost'],
  },
  'bess-only': {
    name: 'Battery Only',
    description: 'Peak shaving and demand charge reduction without solar',
    icon: Battery,
    color: 'cyan',
    targetReduction: 35,
    features: ['No roof modifications', 'Immediate demand savings', 'Faster installation'],
  },
  'hybrid-generator': {
    name: 'Hybrid + Generator',
    description: 'Battery plus natural gas generator for backup and peak shaving',
    icon: Zap,
    color: 'purple',
    targetReduction: 45,
    features: ['Mainspring linear generator', 'Fuel flexibility', 'Grid independence'],
  },
};

// State electricity rates
const STATE_RATES: Record<string, { rate: number; demandCharge: number; peakRate: number }> = {
  'Alabama': { rate: 0.13, demandCharge: 12, peakRate: 0.19 },
  'Alaska': { rate: 0.22, demandCharge: 15, peakRate: 0.30 },
  'Arizona': { rate: 0.13, demandCharge: 18, peakRate: 0.22 },
  'Arkansas': { rate: 0.10, demandCharge: 11, peakRate: 0.15 },
  'California': { rate: 0.22, demandCharge: 25, peakRate: 0.35 },
  'Colorado': { rate: 0.12, demandCharge: 14, peakRate: 0.19 },
  'Connecticut': { rate: 0.21, demandCharge: 20, peakRate: 0.32 },
  'Delaware': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Florida': { rate: 0.14, demandCharge: 12, peakRate: 0.20 },
  'Georgia': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Hawaii': { rate: 0.33, demandCharge: 30, peakRate: 0.45 },
  'Idaho': { rate: 0.10, demandCharge: 10, peakRate: 0.14 },
  'Illinois': { rate: 0.13, demandCharge: 14, peakRate: 0.20 },
  'Indiana': { rate: 0.12, demandCharge: 12, peakRate: 0.18 },
  'Iowa': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Kansas': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Kentucky': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Louisiana': { rate: 0.10, demandCharge: 12, peakRate: 0.15 },
  'Maine': { rate: 0.17, demandCharge: 15, peakRate: 0.25 },
  'Maryland': { rate: 0.14, demandCharge: 15, peakRate: 0.21 },
  'Massachusetts': { rate: 0.22, demandCharge: 22, peakRate: 0.34 },
  'Michigan': { rate: 0.16, demandCharge: 16, peakRate: 0.24 },
  'Minnesota': { rate: 0.13, demandCharge: 13, peakRate: 0.19 },
  'Mississippi': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Missouri': { rate: 0.11, demandCharge: 12, peakRate: 0.17 },
  'Montana': { rate: 0.11, demandCharge: 10, peakRate: 0.16 },
  'Nebraska': { rate: 0.10, demandCharge: 11, peakRate: 0.15 },
  'Nevada': { rate: 0.11, demandCharge: 16, peakRate: 0.18 },
  'New Hampshire': { rate: 0.19, demandCharge: 18, peakRate: 0.28 },
  'New Jersey': { rate: 0.16, demandCharge: 17, peakRate: 0.24 },
  'New Mexico': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'New York': { rate: 0.20, demandCharge: 22, peakRate: 0.32 },
  'North Carolina': { rate: 0.11, demandCharge: 12, peakRate: 0.17 },
  'North Dakota': { rate: 0.10, demandCharge: 10, peakRate: 0.14 },
  'Ohio': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Oklahoma': { rate: 0.10, demandCharge: 11, peakRate: 0.15 },
  'Oregon': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Pennsylvania': { rate: 0.14, demandCharge: 14, peakRate: 0.21 },
  'Rhode Island': { rate: 0.21, demandCharge: 20, peakRate: 0.32 },
  'South Carolina': { rate: 0.12, demandCharge: 12, peakRate: 0.18 },
  'South Dakota': { rate: 0.11, demandCharge: 10, peakRate: 0.16 },
  'Tennessee': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Texas': { rate: 0.12, demandCharge: 15, peakRate: 0.18 },
  'Utah': { rate: 0.10, demandCharge: 12, peakRate: 0.15 },
  'Vermont': { rate: 0.18, demandCharge: 16, peakRate: 0.26 },
  'Virginia': { rate: 0.12, demandCharge: 13, peakRate: 0.18 },
  'Washington': { rate: 0.10, demandCharge: 10, peakRate: 0.14 },
  'West Virginia': { rate: 0.11, demandCharge: 11, peakRate: 0.16 },
  'Wisconsin': { rate: 0.13, demandCharge: 13, peakRate: 0.19 },
  'Wyoming': { rate: 0.10, demandCharge: 10, peakRate: 0.14 },
  'Other': { rate: 0.13, demandCharge: 15, peakRate: 0.20 },
};

// ============================================
// ZIP CODE TO STATE MAPPING
// ============================================
// First 3 digits of ZIP code → State
const ZIP_TO_STATE: Record<string, string> = {
  // Alabama (350-369)
  '350': 'Alabama', '351': 'Alabama', '352': 'Alabama', '354': 'Alabama', '355': 'Alabama', 
  '356': 'Alabama', '357': 'Alabama', '358': 'Alabama', '359': 'Alabama', '360': 'Alabama',
  '361': 'Alabama', '362': 'Alabama', '363': 'Alabama', '364': 'Alabama', '365': 'Alabama', '366': 'Alabama', '367': 'Alabama', '368': 'Alabama', '369': 'Alabama',
  // Alaska (995-999)
  '995': 'Alaska', '996': 'Alaska', '997': 'Alaska', '998': 'Alaska', '999': 'Alaska',
  // Arizona (850-865)
  '850': 'Arizona', '851': 'Arizona', '852': 'Arizona', '853': 'Arizona', '855': 'Arizona', 
  '856': 'Arizona', '857': 'Arizona', '859': 'Arizona', '860': 'Arizona', '863': 'Arizona', '864': 'Arizona', '865': 'Arizona',
  // Arkansas (716-729)
  '716': 'Arkansas', '717': 'Arkansas', '718': 'Arkansas', '719': 'Arkansas', '720': 'Arkansas',
  '721': 'Arkansas', '722': 'Arkansas', '723': 'Arkansas', '724': 'Arkansas', '725': 'Arkansas',
  '726': 'Arkansas', '727': 'Arkansas', '728': 'Arkansas', '729': 'Arkansas',
  // California (900-961)
  '900': 'California', '901': 'California', '902': 'California', '903': 'California', '904': 'California',
  '905': 'California', '906': 'California', '907': 'California', '908': 'California', '910': 'California',
  '911': 'California', '912': 'California', '913': 'California', '914': 'California', '915': 'California',
  '916': 'California', '917': 'California', '918': 'California', '919': 'California', '920': 'California',
  '921': 'California', '922': 'California', '923': 'California', '924': 'California', '925': 'California',
  '926': 'California', '927': 'California', '928': 'California', '930': 'California', '931': 'California',
  '932': 'California', '933': 'California', '934': 'California', '935': 'California', '936': 'California',
  '937': 'California', '938': 'California', '939': 'California', '940': 'California', '941': 'California',
  '942': 'California', '943': 'California', '944': 'California', '945': 'California', '946': 'California',
  '947': 'California', '948': 'California', '949': 'California', '950': 'California', '951': 'California',
  '952': 'California', '953': 'California', '954': 'California', '955': 'California', '956': 'California',
  '957': 'California', '958': 'California', '959': 'California', '960': 'California', '961': 'California',
  // Colorado (800-816)
  '800': 'Colorado', '801': 'Colorado', '802': 'Colorado', '803': 'Colorado', '804': 'Colorado',
  '805': 'Colorado', '806': 'Colorado', '807': 'Colorado', '808': 'Colorado', '809': 'Colorado',
  '810': 'Colorado', '811': 'Colorado', '812': 'Colorado', '813': 'Colorado', '814': 'Colorado',
  '815': 'Colorado', '816': 'Colorado',
  // Connecticut (060-069)
  '060': 'Connecticut', '061': 'Connecticut', '062': 'Connecticut', '063': 'Connecticut', '064': 'Connecticut',
  '065': 'Connecticut', '066': 'Connecticut', '067': 'Connecticut', '068': 'Connecticut', '069': 'Connecticut',
  // Delaware (197-199)
  '197': 'Delaware', '198': 'Delaware', '199': 'Delaware',
  // Florida (320-349)
  '320': 'Florida', '321': 'Florida', '322': 'Florida', '323': 'Florida', '324': 'Florida',
  '325': 'Florida', '326': 'Florida', '327': 'Florida', '328': 'Florida', '329': 'Florida',
  '330': 'Florida', '331': 'Florida', '332': 'Florida', '333': 'Florida', '334': 'Florida',
  '335': 'Florida', '336': 'Florida', '337': 'Florida', '338': 'Florida', '339': 'Florida',
  '340': 'Florida', '341': 'Florida', '342': 'Florida', '344': 'Florida', '346': 'Florida', '347': 'Florida', '349': 'Florida',
  // Georgia (300-319, 398-399)
  '300': 'Georgia', '301': 'Georgia', '302': 'Georgia', '303': 'Georgia', '304': 'Georgia',
  '305': 'Georgia', '306': 'Georgia', '307': 'Georgia', '308': 'Georgia', '309': 'Georgia',
  '310': 'Georgia', '311': 'Georgia', '312': 'Georgia', '313': 'Georgia', '314': 'Georgia',
  '315': 'Georgia', '316': 'Georgia', '317': 'Georgia', '318': 'Georgia', '319': 'Georgia', '398': 'Georgia', '399': 'Georgia',
  // Hawaii (967-968)
  '967': 'Hawaii', '968': 'Hawaii',
  // Idaho (832-838)
  '832': 'Idaho', '833': 'Idaho', '834': 'Idaho', '835': 'Idaho', '836': 'Idaho', '837': 'Idaho', '838': 'Idaho',
  // Illinois (600-629)
  '600': 'Illinois', '601': 'Illinois', '602': 'Illinois', '603': 'Illinois', '604': 'Illinois',
  '605': 'Illinois', '606': 'Illinois', '607': 'Illinois', '608': 'Illinois', '609': 'Illinois',
  '610': 'Illinois', '611': 'Illinois', '612': 'Illinois', '613': 'Illinois', '614': 'Illinois',
  '615': 'Illinois', '616': 'Illinois', '617': 'Illinois', '618': 'Illinois', '619': 'Illinois',
  '620': 'Illinois', '622': 'Illinois', '623': 'Illinois', '624': 'Illinois', '625': 'Illinois',
  '626': 'Illinois', '627': 'Illinois', '628': 'Illinois', '629': 'Illinois',
  // Indiana (460-479)
  '460': 'Indiana', '461': 'Indiana', '462': 'Indiana', '463': 'Indiana', '464': 'Indiana',
  '465': 'Indiana', '466': 'Indiana', '467': 'Indiana', '468': 'Indiana', '469': 'Indiana',
  '470': 'Indiana', '471': 'Indiana', '472': 'Indiana', '473': 'Indiana', '474': 'Indiana',
  '475': 'Indiana', '476': 'Indiana', '477': 'Indiana', '478': 'Indiana', '479': 'Indiana',
  // Iowa (500-528)
  '500': 'Iowa', '501': 'Iowa', '502': 'Iowa', '503': 'Iowa', '504': 'Iowa',
  '505': 'Iowa', '506': 'Iowa', '507': 'Iowa', '508': 'Iowa', '509': 'Iowa',
  '510': 'Iowa', '511': 'Iowa', '512': 'Iowa', '513': 'Iowa', '514': 'Iowa',
  '515': 'Iowa', '516': 'Iowa', '520': 'Iowa', '521': 'Iowa', '522': 'Iowa',
  '523': 'Iowa', '524': 'Iowa', '525': 'Iowa', '526': 'Iowa', '527': 'Iowa', '528': 'Iowa',
  // Kansas (660-679)
  '660': 'Kansas', '661': 'Kansas', '662': 'Kansas', '664': 'Kansas', '665': 'Kansas',
  '666': 'Kansas', '667': 'Kansas', '668': 'Kansas', '669': 'Kansas', '670': 'Kansas',
  '671': 'Kansas', '672': 'Kansas', '673': 'Kansas', '674': 'Kansas', '675': 'Kansas',
  '676': 'Kansas', '677': 'Kansas', '678': 'Kansas', '679': 'Kansas',
  // Kentucky (400-427)
  '400': 'Kentucky', '401': 'Kentucky', '402': 'Kentucky', '403': 'Kentucky', '404': 'Kentucky',
  '405': 'Kentucky', '406': 'Kentucky', '407': 'Kentucky', '408': 'Kentucky', '409': 'Kentucky',
  '410': 'Kentucky', '411': 'Kentucky', '412': 'Kentucky', '413': 'Kentucky', '414': 'Kentucky',
  '415': 'Kentucky', '416': 'Kentucky', '417': 'Kentucky', '418': 'Kentucky', '420': 'Kentucky',
  '421': 'Kentucky', '422': 'Kentucky', '423': 'Kentucky', '424': 'Kentucky', '425': 'Kentucky',
  '426': 'Kentucky', '427': 'Kentucky',
  // Louisiana (700-714)
  '700': 'Louisiana', '701': 'Louisiana', '703': 'Louisiana', '704': 'Louisiana', '705': 'Louisiana',
  '706': 'Louisiana', '707': 'Louisiana', '708': 'Louisiana', '710': 'Louisiana', '711': 'Louisiana',
  '712': 'Louisiana', '713': 'Louisiana', '714': 'Louisiana',
  // Maine (039-049)
  '039': 'Maine', '040': 'Maine', '041': 'Maine', '042': 'Maine', '043': 'Maine',
  '044': 'Maine', '045': 'Maine', '046': 'Maine', '047': 'Maine', '048': 'Maine', '049': 'Maine',
  // Maryland (206-219)
  '206': 'Maryland', '207': 'Maryland', '208': 'Maryland', '209': 'Maryland', '210': 'Maryland',
  '211': 'Maryland', '212': 'Maryland', '214': 'Maryland', '215': 'Maryland', '216': 'Maryland',
  '217': 'Maryland', '218': 'Maryland', '219': 'Maryland',
  // Massachusetts (010-027)
  '010': 'Massachusetts', '011': 'Massachusetts', '012': 'Massachusetts', '013': 'Massachusetts', '014': 'Massachusetts',
  '015': 'Massachusetts', '016': 'Massachusetts', '017': 'Massachusetts', '018': 'Massachusetts', '019': 'Massachusetts',
  '020': 'Massachusetts', '021': 'Massachusetts', '022': 'Massachusetts', '023': 'Massachusetts', '024': 'Massachusetts',
  '025': 'Massachusetts', '026': 'Massachusetts', '027': 'Massachusetts',
  // Michigan (480-499)
  '480': 'Michigan', '481': 'Michigan', '482': 'Michigan', '483': 'Michigan', '484': 'Michigan',
  '485': 'Michigan', '486': 'Michigan', '487': 'Michigan', '488': 'Michigan', '489': 'Michigan',
  '490': 'Michigan', '491': 'Michigan', '492': 'Michigan', '493': 'Michigan', '494': 'Michigan',
  '495': 'Michigan', '496': 'Michigan', '497': 'Michigan', '498': 'Michigan', '499': 'Michigan',
  // Minnesota (550-567)
  '550': 'Minnesota', '551': 'Minnesota', '553': 'Minnesota', '554': 'Minnesota', '555': 'Minnesota',
  '556': 'Minnesota', '557': 'Minnesota', '558': 'Minnesota', '559': 'Minnesota', '560': 'Minnesota',
  '561': 'Minnesota', '562': 'Minnesota', '563': 'Minnesota', '564': 'Minnesota', '565': 'Minnesota',
  '566': 'Minnesota', '567': 'Minnesota',
  // Mississippi (386-397)
  '386': 'Mississippi', '387': 'Mississippi', '388': 'Mississippi', '389': 'Mississippi', '390': 'Mississippi',
  '391': 'Mississippi', '392': 'Mississippi', '393': 'Mississippi', '394': 'Mississippi', '395': 'Mississippi',
  '396': 'Mississippi', '397': 'Mississippi',
  // Missouri (630-658)
  '630': 'Missouri', '631': 'Missouri', '633': 'Missouri', '634': 'Missouri', '635': 'Missouri',
  '636': 'Missouri', '637': 'Missouri', '638': 'Missouri', '639': 'Missouri', '640': 'Missouri',
  '641': 'Missouri', '644': 'Missouri', '645': 'Missouri', '646': 'Missouri', '647': 'Missouri',
  '648': 'Missouri', '649': 'Missouri', '650': 'Missouri', '651': 'Missouri', '652': 'Missouri',
  '653': 'Missouri', '654': 'Missouri', '655': 'Missouri', '656': 'Missouri', '657': 'Missouri', '658': 'Missouri',
  // Montana (590-599)
  '590': 'Montana', '591': 'Montana', '592': 'Montana', '593': 'Montana', '594': 'Montana',
  '595': 'Montana', '596': 'Montana', '597': 'Montana', '598': 'Montana', '599': 'Montana',
  // Nebraska (680-693)
  '680': 'Nebraska', '681': 'Nebraska', '683': 'Nebraska', '684': 'Nebraska', '685': 'Nebraska',
  '686': 'Nebraska', '687': 'Nebraska', '688': 'Nebraska', '689': 'Nebraska', '690': 'Nebraska',
  '691': 'Nebraska', '692': 'Nebraska', '693': 'Nebraska',
  // Nevada (889-898)
  '889': 'Nevada', '890': 'Nevada', '891': 'Nevada', '893': 'Nevada', '894': 'Nevada',
  '895': 'Nevada', '897': 'Nevada', '898': 'Nevada',
  // New Hampshire (030-038)
  '030': 'New Hampshire', '031': 'New Hampshire', '032': 'New Hampshire', '033': 'New Hampshire', '034': 'New Hampshire',
  '035': 'New Hampshire', '036': 'New Hampshire', '037': 'New Hampshire', '038': 'New Hampshire',
  // New Jersey (070-089)
  '070': 'New Jersey', '071': 'New Jersey', '072': 'New Jersey', '073': 'New Jersey', '074': 'New Jersey',
  '075': 'New Jersey', '076': 'New Jersey', '077': 'New Jersey', '078': 'New Jersey', '079': 'New Jersey',
  '080': 'New Jersey', '081': 'New Jersey', '082': 'New Jersey', '083': 'New Jersey', '084': 'New Jersey',
  '085': 'New Jersey', '086': 'New Jersey', '087': 'New Jersey', '088': 'New Jersey', '089': 'New Jersey',
  // New Mexico (870-884)
  '870': 'New Mexico', '871': 'New Mexico', '873': 'New Mexico', '874': 'New Mexico', '875': 'New Mexico',
  '877': 'New Mexico', '878': 'New Mexico', '879': 'New Mexico', '880': 'New Mexico', '881': 'New Mexico',
  '882': 'New Mexico', '883': 'New Mexico', '884': 'New Mexico',
  // New York (100-149)
  '100': 'New York', '101': 'New York', '102': 'New York', '103': 'New York', '104': 'New York',
  '105': 'New York', '106': 'New York', '107': 'New York', '108': 'New York', '109': 'New York',
  '110': 'New York', '111': 'New York', '112': 'New York', '113': 'New York', '114': 'New York',
  '115': 'New York', '116': 'New York', '117': 'New York', '118': 'New York', '119': 'New York',
  '120': 'New York', '121': 'New York', '122': 'New York', '123': 'New York', '124': 'New York',
  '125': 'New York', '126': 'New York', '127': 'New York', '128': 'New York', '129': 'New York',
  '130': 'New York', '131': 'New York', '132': 'New York', '133': 'New York', '134': 'New York',
  '135': 'New York', '136': 'New York', '137': 'New York', '138': 'New York', '139': 'New York',
  '140': 'New York', '141': 'New York', '142': 'New York', '143': 'New York', '144': 'New York',
  '145': 'New York', '146': 'New York', '147': 'New York', '148': 'New York', '149': 'New York',
  // North Carolina (270-289)
  '270': 'North Carolina', '271': 'North Carolina', '272': 'North Carolina', '273': 'North Carolina', '274': 'North Carolina',
  '275': 'North Carolina', '276': 'North Carolina', '277': 'North Carolina', '278': 'North Carolina', '279': 'North Carolina',
  '280': 'North Carolina', '281': 'North Carolina', '282': 'North Carolina', '283': 'North Carolina', '284': 'North Carolina',
  '285': 'North Carolina', '286': 'North Carolina', '287': 'North Carolina', '288': 'North Carolina', '289': 'North Carolina',
  // North Dakota (580-588)
  '580': 'North Dakota', '581': 'North Dakota', '582': 'North Dakota', '583': 'North Dakota', '584': 'North Dakota',
  '585': 'North Dakota', '586': 'North Dakota', '587': 'North Dakota', '588': 'North Dakota',
  // Ohio (430-458)
  '430': 'Ohio', '431': 'Ohio', '432': 'Ohio', '433': 'Ohio', '434': 'Ohio',
  '435': 'Ohio', '436': 'Ohio', '437': 'Ohio', '438': 'Ohio', '439': 'Ohio',
  '440': 'Ohio', '441': 'Ohio', '442': 'Ohio', '443': 'Ohio', '444': 'Ohio',
  '445': 'Ohio', '446': 'Ohio', '447': 'Ohio', '448': 'Ohio', '449': 'Ohio',
  '450': 'Ohio', '451': 'Ohio', '452': 'Ohio', '453': 'Ohio', '454': 'Ohio',
  '455': 'Ohio', '456': 'Ohio', '457': 'Ohio', '458': 'Ohio',
  // Oklahoma (730-749)
  '730': 'Oklahoma', '731': 'Oklahoma', '734': 'Oklahoma', '735': 'Oklahoma', '736': 'Oklahoma',
  '737': 'Oklahoma', '738': 'Oklahoma', '739': 'Oklahoma', '740': 'Oklahoma', '741': 'Oklahoma',
  '743': 'Oklahoma', '744': 'Oklahoma', '745': 'Oklahoma', '746': 'Oklahoma', '747': 'Oklahoma',
  '748': 'Oklahoma', '749': 'Oklahoma',
  // Oregon (970-979)
  '970': 'Oregon', '971': 'Oregon', '972': 'Oregon', '973': 'Oregon', '974': 'Oregon',
  '975': 'Oregon', '976': 'Oregon', '977': 'Oregon', '978': 'Oregon', '979': 'Oregon',
  // Pennsylvania (150-196)
  '150': 'Pennsylvania', '151': 'Pennsylvania', '152': 'Pennsylvania', '153': 'Pennsylvania', '154': 'Pennsylvania',
  '155': 'Pennsylvania', '156': 'Pennsylvania', '157': 'Pennsylvania', '158': 'Pennsylvania', '159': 'Pennsylvania',
  '160': 'Pennsylvania', '161': 'Pennsylvania', '162': 'Pennsylvania', '163': 'Pennsylvania', '164': 'Pennsylvania',
  '165': 'Pennsylvania', '166': 'Pennsylvania', '167': 'Pennsylvania', '168': 'Pennsylvania', '169': 'Pennsylvania',
  '170': 'Pennsylvania', '171': 'Pennsylvania', '172': 'Pennsylvania', '173': 'Pennsylvania', '174': 'Pennsylvania',
  '175': 'Pennsylvania', '176': 'Pennsylvania', '177': 'Pennsylvania', '178': 'Pennsylvania', '179': 'Pennsylvania',
  '180': 'Pennsylvania', '181': 'Pennsylvania', '182': 'Pennsylvania', '183': 'Pennsylvania', '184': 'Pennsylvania',
  '185': 'Pennsylvania', '186': 'Pennsylvania', '187': 'Pennsylvania', '188': 'Pennsylvania', '189': 'Pennsylvania',
  '190': 'Pennsylvania', '191': 'Pennsylvania', '192': 'Pennsylvania', '193': 'Pennsylvania', '194': 'Pennsylvania',
  '195': 'Pennsylvania', '196': 'Pennsylvania',
  // Rhode Island (028-029)
  '028': 'Rhode Island', '029': 'Rhode Island',
  // South Carolina (290-299)
  '290': 'South Carolina', '291': 'South Carolina', '292': 'South Carolina', '293': 'South Carolina', '294': 'South Carolina',
  '295': 'South Carolina', '296': 'South Carolina', '297': 'South Carolina', '298': 'South Carolina', '299': 'South Carolina',
  // South Dakota (570-577)
  '570': 'South Dakota', '571': 'South Dakota', '572': 'South Dakota', '573': 'South Dakota', '574': 'South Dakota',
  '575': 'South Dakota', '576': 'South Dakota', '577': 'South Dakota',
  // Tennessee (370-385)
  '370': 'Tennessee', '371': 'Tennessee', '372': 'Tennessee', '373': 'Tennessee', '374': 'Tennessee',
  '376': 'Tennessee', '377': 'Tennessee', '378': 'Tennessee', '379': 'Tennessee', '380': 'Tennessee',
  '381': 'Tennessee', '382': 'Tennessee', '383': 'Tennessee', '384': 'Tennessee', '385': 'Tennessee',
  // Texas (750-799, 885)
  '750': 'Texas', '751': 'Texas', '752': 'Texas', '753': 'Texas', '754': 'Texas',
  '755': 'Texas', '756': 'Texas', '757': 'Texas', '758': 'Texas', '759': 'Texas',
  '760': 'Texas', '761': 'Texas', '762': 'Texas', '763': 'Texas', '764': 'Texas',
  '765': 'Texas', '766': 'Texas', '767': 'Texas', '768': 'Texas', '769': 'Texas',
  '770': 'Texas', '772': 'Texas', '773': 'Texas', '774': 'Texas', '775': 'Texas',
  '776': 'Texas', '777': 'Texas', '778': 'Texas', '779': 'Texas', '780': 'Texas',
  '781': 'Texas', '782': 'Texas', '783': 'Texas', '784': 'Texas', '785': 'Texas',
  '786': 'Texas', '787': 'Texas', '788': 'Texas', '789': 'Texas', '790': 'Texas',
  '791': 'Texas', '792': 'Texas', '793': 'Texas', '794': 'Texas', '795': 'Texas',
  '796': 'Texas', '797': 'Texas', '798': 'Texas', '799': 'Texas', '885': 'Texas',
  // Utah (840-847)
  '840': 'Utah', '841': 'Utah', '842': 'Utah', '843': 'Utah', '844': 'Utah',
  '845': 'Utah', '846': 'Utah', '847': 'Utah',
  // Vermont (050-059)
  '050': 'Vermont', '051': 'Vermont', '052': 'Vermont', '053': 'Vermont', '054': 'Vermont',
  '055': 'Vermont', '056': 'Vermont', '057': 'Vermont', '058': 'Vermont', '059': 'Vermont',
  // Virginia (220-246)
  '220': 'Virginia', '221': 'Virginia', '222': 'Virginia', '223': 'Virginia', '224': 'Virginia',
  '225': 'Virginia', '226': 'Virginia', '227': 'Virginia', '228': 'Virginia', '229': 'Virginia',
  '230': 'Virginia', '231': 'Virginia', '232': 'Virginia', '233': 'Virginia', '234': 'Virginia',
  '235': 'Virginia', '236': 'Virginia', '237': 'Virginia', '238': 'Virginia', '239': 'Virginia',
  '240': 'Virginia', '241': 'Virginia', '242': 'Virginia', '243': 'Virginia', '244': 'Virginia',
  '245': 'Virginia', '246': 'Virginia',
  // Washington (980-994)
  '980': 'Washington', '981': 'Washington', '982': 'Washington', '983': 'Washington', '984': 'Washington',
  '985': 'Washington', '986': 'Washington', '988': 'Washington', '989': 'Washington', '990': 'Washington',
  '991': 'Washington', '992': 'Washington', '993': 'Washington', '994': 'Washington',
  // West Virginia (247-268)
  '247': 'West Virginia', '248': 'West Virginia', '249': 'West Virginia', '250': 'West Virginia', '251': 'West Virginia',
  '252': 'West Virginia', '253': 'West Virginia', '254': 'West Virginia', '255': 'West Virginia', '256': 'West Virginia',
  '257': 'West Virginia', '258': 'West Virginia', '259': 'West Virginia', '260': 'West Virginia', '261': 'West Virginia',
  '262': 'West Virginia', '263': 'West Virginia', '264': 'West Virginia', '265': 'West Virginia', '266': 'West Virginia', '267': 'West Virginia', '268': 'West Virginia',
  // Wisconsin (530-549)
  '530': 'Wisconsin', '531': 'Wisconsin', '532': 'Wisconsin', '534': 'Wisconsin', '535': 'Wisconsin',
  '537': 'Wisconsin', '538': 'Wisconsin', '539': 'Wisconsin', '540': 'Wisconsin', '541': 'Wisconsin',
  '542': 'Wisconsin', '543': 'Wisconsin', '544': 'Wisconsin', '545': 'Wisconsin', '546': 'Wisconsin',
  '547': 'Wisconsin', '548': 'Wisconsin', '549': 'Wisconsin',
  // Wyoming (820-831)
  '820': 'Wyoming', '821': 'Wyoming', '822': 'Wyoming', '823': 'Wyoming', '824': 'Wyoming',
  '825': 'Wyoming', '826': 'Wyoming', '827': 'Wyoming', '828': 'Wyoming', '829': 'Wyoming',
  '830': 'Wyoming', '831': 'Wyoming',
  // DC (200-205)
  '200': 'Other', '201': 'Other', '202': 'Other', '203': 'Other', '204': 'Other', '205': 'Other',
};

/**
 * Get state from ZIP code prefix (first 3 digits)
 */
function getStateFromZip(zip: string): string | null {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  return ZIP_TO_STATE[prefix] || null;
}

// ============================================
// WIZARD STEPS
// ============================================

const WIZARD_STEPS = [
  { id: 'basics', title: 'Location & Goals', icon: MapPin },
  { id: 'details', title: 'Your Details', icon: Building },
  { id: 'equipment', title: 'Equipment', icon: Gauge },
  { id: 'energy-profile', title: 'Energy Profile', icon: Zap },
  { id: 'review', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// STEP HELP CONTENT - Car Wash Specific
// ============================================

const CAR_WASH_STEP_HELP: Record<string, StepHelpContent> = {
  'basics': {
    stepId: 'basics',
    title: 'Location & Energy Goals',
    description: 'Your location determines utility rates and solar potential. Your goals shape the BESS recommendation.',
    tips: [
      { type: 'tip', text: 'States like California, Hawaii, and New York have highest electricity costs - BESS ROI is best there.' },
      { type: 'info', text: 'Selecting "Solar + BESS" can reduce energy costs by 50-70% for car washes.' },
    ],
  },
  'details': {
    stepId: 'details',
    title: 'Your Car Wash Details',
    description: 'Tell us about your operation so we can pre-fill equipment and calculate accurate savings.',
    tips: [
      { type: 'tip', text: 'Brand selection pre-fills typical equipment specs - you can customize in the next step.' },
      { type: 'info', text: 'Express tunnels typically use 120-180 kW peak. Full-service can reach 150-250 kW.' },
    ],
  },
  'equipment': {
    stepId: 'equipment',
    title: 'Your Equipment Profile',
    description: 'Tell us what equipment you have installed. Drying systems typically account for 30-40% of total energy use.',
    tips: [
      { type: 'warning', text: 'Drying blowers are the biggest energy consumers - each 10HP blower uses ~7.5 kW.' },
      { type: 'tip', text: 'Central vacuum systems (30+ kW) vs standalone stations (3.6 kW each) - know what you have!' },
    ],
  },
  'energy-profile': {
    stepId: 'energy-profile',
    title: 'Your Energy Profile',
    description: 'Review your calculated power requirements and monthly costs. This drives your BESS sizing.',
    tips: [
      { type: 'tip', text: 'Peak hours (usually 10 AM - 2 PM) have highest demand - this is where BESS saves the most.' },
      { type: 'success', text: 'Demand charge reduction often provides the fastest ROI - typically 30-50% of your bill.' },
    ],
  },
  'review': {
    stepId: 'review',
    title: 'Your Custom Quote',
    description: 'Review your personalized BESS quote with equipment costs, financial projections, and ROI analysis.',
    tips: [
      { type: 'success', text: 'The 30% Federal ITC significantly reduces your net cost - factor this into your ROI.' },
      { type: 'tip', text: 'Download your quote to share with partners, banks, or other stakeholders.' },
    ],
  },
};

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
    numberOfBays: initialInputs.numberOfBays ?? limits?.numberOfBays?.default ?? 1,
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
  
  // Use transition for smoother step changes
  const [isPending, startTransition] = useTransition();
  
  const [currentStep, setCurrentStepRaw] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // Wrapper for step changes to make them non-blocking
  const setCurrentStep = (step: number) => {
    startTransition(() => {
      setCurrentStepRaw(step);
    });
  };
  
  // Local state for editable inputs
  const [numberOfBays, setNumberOfBays] = useState(
    initialInputs.numberOfBays ?? 1
  );
  const [carsPerDay, setCarsPerDay] = useState(
    initialInputs.carsPerDay ?? 150
  );
  
  // Step 0: Brand Selection (NEW - concierge experience)
  const [selectedBrand, setSelectedBrand] = useState<keyof typeof CAR_WASH_BRANDS>('independent');
  const [automationLevel, setAutomationLevel] = useState<keyof typeof AUTOMATION_LEVELS>('standard');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('owner');
  
  // Brand Submission for independent washes
  const [brandSubmission, setBrandSubmission] = useState({
    brandName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    zipCode: '',
    streetAddress: '', // Optional
    numberOfSites: 1,
  });
  
  // Concierge Tier Selection
  const [conciergeTier, setConciergeTier] = useState<keyof typeof CONCIERGE_TIERS>('standard');
  
  // Quote Mode: 'select' = mode chooser, 'pro' = direct input, 'guided' = step-by-step
  const [quoteMode, setQuoteMode] = useState<'select' | 'pro' | 'guided'>('select');
  
  // Grid Connection Status - key question for accurate calculations
  const [gridConnection, setGridConnection] = useState({
    status: 'grid-tied' as 'grid-tied' | 'off-grid' | 'grid-backup-only',
    gridReliability: 'reliable' as 'reliable' | 'occasional-outages' | 'frequent-outages' | 'unreliable',
    gridCostConcern: false, // True if grid is too expensive
    wantGridIndependence: false, // True if they want to reduce grid dependency
  });
  
  // Performance Metrics (data layer)
  const [trackPerformance, setTrackPerformance] = useState(true);
  
  // Step 1: Wash Type
  const [washType, setWashType] = useState<keyof typeof WASH_TYPES>('express-exterior');
  const [tunnelLength, setTunnelLength] = useState(120); // feet
  
  // Step 0: Simplified selections (NEW)
  const [simplifiedWashType, setSimplifiedWashType] = useState<keyof typeof SIMPLIFIED_WASH_TYPES>('automated-tunnel');
  const [selectedEnergyGoal, setSelectedEnergyGoal] = useState<keyof typeof ENERGY_GOALS_OPTIONS>('solar-bess');
  const [targetReductionPercent, setTargetReductionPercent] = useState(40);
  const [selectedState, setSelectedState] = useState(initialInputs.state ?? 'California');
  const [zipCode, setZipCode] = useState('');
  
  // Sync simplifiedWashType to detailed washType
  useEffect(() => {
    if (simplifiedWashType === 'automated-tunnel') {
      setWashType('express-exterior');
    } else {
      setWashType('self-service');
    }
  }, [simplifiedWashType]);
  
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
    
    // Vacuum - uses local numberOfBays state
    vacuumStations: mergedInputs.includesVacuums ? numberOfBays * 2 : 0,
    hasCentralVacuum: mergedInputs.includesVacuums && numberOfBays >= 4,
    
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
  
  // Update equipment when numberOfBays changes
  useEffect(() => {
    setEquipment(prev => ({
      ...prev,
      vacuumStations: mergedInputs.includesVacuums ? numberOfBays * 2 : 0,
      hasCentralVacuum: mergedInputs.includesVacuums && numberOfBays >= 4,
    }));
  }, [numberOfBays, mergedInputs.includesVacuums]);
  
  // Auto-populate equipment when brand is selected
  useEffect(() => {
    const brand = CAR_WASH_BRANDS[selectedBrand];
    if (brand && brand.defaultEquipment) {
      setEquipment(prev => ({
        ...prev,
        ...brand.defaultEquipment,
      }));
      if (brand.automationLevel) {
        setAutomationLevel(brand.automationLevel as keyof typeof AUTOMATION_LEVELS);
      }
      if (brand.typicalWashType) {
        setWashType(brand.typicalWashType as keyof typeof WASH_TYPES);
      }
    }
  }, [selectedBrand]);
  
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
    primaryGoal: 'demand-reduction' as 'demand-reduction' | 'backup-power' | 'solar-storage' | 'solar-generator' | 'all',
    targetSavingsPercent: 40,
    interestInSolar: true,
    solarRoofArea: 5000, // sq ft available
    includeGenerator: false, // Natural gas generator for backup/peak shaving
    generatorSizeKW: 0, // Auto-calculated based on peak power if enabled
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
  
  // Memoize brand entries to prevent re-computation on every render
  const brandEntries = useMemo(() => Object.entries(CAR_WASH_BRANDS), []);
  const filteredBrands = useMemo(() => 
    brandEntries.filter(([key]) => key !== 'independent'),
    [brandEntries]
  );
  
  // Calculate power using SSOT
  useEffect(() => {
    // Get state-specific rates
    const stateData = STATE_RATES[mergedInputs.state] || STATE_RATES['Other'];
    
    // Build input for SSOT function
    const input: CarWashPowerInput = {
      equipment: {
        hasConveyor: equipment.hasConveyor,
        conveyorHP: equipment.conveyorHP,
        topBrushes: equipment.topBrushes,
        wrapAroundBrushes: equipment.wrapAroundBrushes,
        mitterCurtains: equipment.mitterCurtains,
        wheelBrushes: equipment.wheelBrushes,
        highPressurePumps: equipment.highPressurePumps,
        hasUndercarriage: equipment.hasUndercarriage,
        standardBlowers: equipment.standardBlowers,
        hasWindBlade: equipment.hasWindBlade,
        hasHighPerformanceDryer: equipment.hasHighPerformanceDryer,
        hasCentralVacuum: equipment.hasCentralVacuum,
        vacuumStations: equipment.vacuumStations,
        chemicalStations: equipment.chemicalStations,
        hasTireShine: equipment.hasTireShine,
        hasWaterReclaim: equipment.hasWaterReclaim,
        hasReverseOsmosis: equipment.hasReverseOsmosis,
        waterHeatingType: equipment.waterHeatingType,
        airCompressorHP: equipment.airCompressorHP,
      },
      operations: {
        hoursPerDay: operations.hoursPerDay,
        daysPerWeek: operations.daysPerWeek,
        peakHoursStart: operations.peakHoursStart,
        peakHoursEnd: operations.peakHoursEnd,
      },
      automationLevel: automationLevel as CarWashAutomationLevel,
      electricityRate: stateData.rate,
      demandCharge: stateData.demandCharge,
    };
    
    // Call SSOT function
    const calc = calculateCarWashEquipmentPower(input);
    setCalculatedPower(calc);
  }, [equipment, operations, washType, automationLevel, initialInputs, mergedInputs.state]);
  
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
      
      // Only include solar when user explicitly selects solar-related goals
      // The solar slider is only visible/adjustable when primaryGoal is 'solar-storage', 'solar-generator', or 'all'
      const includeSolar = energyGoals.primaryGoal === 'solar-storage' || 
        energyGoals.primaryGoal === 'solar-generator' || 
        energyGoals.primaryGoal === 'all';
      const solarMW = includeSolar ? (energyGoals.solarRoofArea * 0.015 / 1000) : 0; // ~15W/sqft
      
      // Include natural gas generator when user selects backup-power, solar-generator, or all goals
      // Generator is sized to cover peak demand for extended outages
      const includeGenerator = energyGoals.includeGenerator || 
        energyGoals.primaryGoal === 'backup-power' || 
        energyGoals.primaryGoal === 'solar-generator' || 
        energyGoals.primaryGoal === 'all';
      const generatorMW = includeGenerator 
        ? (energyGoals.generatorSizeKW > 0 
            ? energyGoals.generatorSizeKW / 1000 
            : calculatedPower.peakDemandKW * 0.8 / 1000) // Default: 80% of peak for backup
        : 0;
      
      // Map grid connection status for SSOT compliance
      const gridConnectionType = gridConnection.status === 'off-grid' ? 'off-grid' : 
                                 gridConnection.status === 'grid-backup-only' ? 'limited' : 'on-grid';
      
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: mergedInputs.state,
        electricityRate: stateData.rate,
        useCase: 'car-wash',
        solarMW,
        generatorMW,
        generatorFuelType: 'natural-gas', // Car washes typically use natural gas generators (cleaner)
        gridConnection: gridConnectionType,
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
  ${numberOfBays} Wash Bays • ${mergedInputs.carsPerDay} cars/day • ${mergedInputs.state}</p>
  
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
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${numberOfBays} wash bays`, size: BODY_SIZE, color: DARK_GRAY, font: 'Helvetica' })] })] }),
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
      ['Wash Bays', numberOfBays],
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
  // Always recalculate when entering step 4 to pick up any changes from previous steps
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      generateQuote();
    }
  }, [currentStep]);
  
  // Clear quote result when user navigates back from final step
  // This ensures slider changes in step 3 will trigger a fresh calculation
  useEffect(() => {
    if (currentStep < WIZARD_STEPS.length - 1 && quoteResult) {
      setQuoteResult(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden p-4">
      <div className="bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 rounded-3xl w-full max-w-4xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/30 flex flex-col" style={{ maxHeight: 'calc(100vh - 32px)', height: 'auto' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-800/80 via-teal-700/60 to-cyan-800/80 px-6 py-4 border-b border-cyan-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {quoteMode === 'select' ? 'Car Wash Energy Quote Builder' : 
                   quoteMode === 'pro' ? 'Pro Mode: Direct Input' : 
                   `Build Your Car Wash Quote`}
                </h2>
                <p className="text-sm text-cyan-300/70">
                  {quoteMode === 'select' ? 'Choose how you want to build your quote' :
                   quoteMode === 'pro' ? 'Enter your specifications directly' :
                   `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          
          {/* Progress Steps - Only show in guided mode */}
          {quoteMode === 'guided' && (
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
          )}
          
          {/* Power Profile - Shows real-time power metrics */}
          {quoteMode === 'guided' && calculatedPower.peakDemandKW > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <WizardPowerProfile
                  data={{
                    peakDemandKW: calculatedPower.peakDemandKW,
                    totalStorageKWh: calculatedPower.peakDemandKW * (energyGoals.targetSavingsPercent / 100) * Math.min(operations.peakHoursEnd - operations.peakHoursStart, 4),
                    durationHours: Math.min(operations.peakHoursEnd - operations.peakHoursStart, 4),
                    monthlyUsageKWh: calculatedPower.monthlyKWh,
                    solarKW: energyGoals.interestInSolar ? energyGoals.solarRoofArea * 0.015 : 0,
                    generatorKW: energyGoals.includeGenerator ? (energyGoals.generatorSizeKW || calculatedPower.peakDemandKW * 0.8) : 0,
                  }}
                  compact={true}
                  colorScheme="cyan"
                />
              </div>
              {/* Power Gauge Widget - Inline in header */}
              <PowerGaugeWidget
                data={{
                  bessKW: Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100),
                  bessKWh: Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100 * 2),
                  peakDemandKW: calculatedPower.peakDemandKW,
                  solarKW: energyGoals.interestInSolar ? Math.round(energyGoals.solarRoofArea * 0.015) : 0,
                  generatorKW: energyGoals.includeGenerator ? (energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)) : 0,
                  powerGapKW: Math.max(0, calculatedPower.peakDemandKW - (
                    Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100) +
                    (energyGoals.interestInSolar ? Math.round(energyGoals.solarRoofArea * 0.015) : 0) +
                    (energyGoals.includeGenerator ? (energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)) : 0)
                  )),
                  isGapMet: (
                    Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100) +
                    (energyGoals.interestInSolar ? Math.round(energyGoals.solarRoofArea * 0.015) : 0) +
                    (energyGoals.includeGenerator ? (energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)) : 0)
                  ) >= calculatedPower.peakDemandKW * 0.9,
                }}
                position="inline"
              />
            </div>
          )}
        </div>
        
        {/* Content - Scrollable with dynamic height */}
        <div className={`flex-1 overflow-y-auto overscroll-contain p-6 pb-8 transition-opacity duration-150 ${isPending ? 'opacity-60' : 'opacity-100'}`} style={{ minHeight: 0 }}>
          {/* Loading indicator during step transition */}
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════════
              MODE SELECTOR - First screen: How do you want to build your quote?
              ════════════════════════════════════════════════════════════════ */}
          {quoteMode === 'select' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-white mb-3">How would you like to build your quote?</h3>
                <p className="text-gray-400 text-lg">Choose the path that fits your needs</p>
              </div>
              
              {/* Two Path Options */}
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* PRO MODE - I Have Specs */}
                <button
                  onClick={() => setQuoteMode('pro')}
                  className="group relative bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-amber-900/30 rounded-3xl p-8 border-2 border-amber-500/40 hover:border-amber-400 transition-all transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 text-left"
                >
                  <div className="absolute top-4 right-4 bg-amber-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-amber-300">PRO</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-3">I Have My Specs</h4>
                  <p className="text-amber-200/80 mb-4">
                    Enter your power requirements directly. Perfect for professionals with site surveys, utility data, or engineering specs.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Direct input: kW, kWh, solar, rates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Upload utility bills for auto-populate</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Skip the guided questions</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-amber-400 font-bold group-hover:translate-x-2 transition-transform">
                    <span>Enter Specs Directly</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
                
                {/* GUIDED MODE - Build My Specs */}
                <button
                  onClick={() => setQuoteMode('guided')}
                  className="group relative bg-gradient-to-br from-cyan-900/30 via-teal-900/20 to-cyan-900/30 rounded-3xl p-8 border-2 border-cyan-500/40 hover:border-cyan-400 transition-all transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20 text-left"
                >
                  <div className="absolute top-4 right-4 bg-cyan-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-cyan-300">GUIDED</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-3">Help Me Build My Specs</h4>
                  <p className="text-cyan-200/80 mb-4">
                    Answer simple questions about your car wash and we'll calculate your power requirements automatically.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Step-by-step guided experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Smart equipment recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Perfect for first-timers</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-cyan-400 font-bold group-hover:translate-x-2 transition-transform">
                    <span>Start Guided Wizard</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
              
              {/* Helper Text */}
              <div className="text-center mt-8">
                <p className="text-gray-500 text-sm">
                  💡 Not sure? The <span className="text-cyan-400 font-medium">Guided Wizard</span> will help you discover what you need.
                  <br/>
                  Already have a site survey or utility data? Try <span className="text-amber-400 font-medium">Pro Mode</span> for faster quotes.
                </p>
              </div>
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════════
              PRO MODE - Redirect to Advanced Builder
              ════════════════════════════════════════════════════════════════ */}
          {quoteMode === 'pro' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-amber-500/40">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-4">
                  <span className="text-amber-300 font-bold">PRO MODE</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-3">Advanced Quote Builder</h3>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  You'll be taken to our full-featured quote builder where you can enter exact specifications.
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setQuoteMode('select')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = '/quote-builder?vertical=car-wash';
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  Open Advanced Builder
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════════
              GUIDED MODE - Step-by-Step Wizard
              ════════════════════════════════════════════════════════════════ */}
          
          {/* Step 0: Location & Energy Goals (SIMPLIFIED) */}
          {quoteMode === 'guided' && currentStep === 0 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={CAR_WASH_STEP_HELP['basics']} 
                colorScheme="cyan"
              />
              
              {/* Location Section - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                <h4 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <MapPin className="w-7 h-7 text-blue-400" />
                  </div>
                  Your Location
                </h4>
                <p className="text-base text-gray-300 mb-6">
                  Location determines utility rates, solar potential, and available incentives.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* State Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    >
                      {Object.keys(STATE_RATES).map(state => (
                        <option key={state} value={state} className="bg-gray-900">{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">ZIP Code (auto-detects state)</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => {
                        const newZip = e.target.value.replace(/\D/g, ''); // Only digits
                        setZipCode(newZip);
                        // Auto-select state when 3+ digits entered
                        if (newZip.length >= 3) {
                          const detectedState = getStateFromZip(newZip);
                          if (detectedState && STATE_RATES[detectedState]) {
                            setSelectedState(detectedState);
                          }
                        }
                      }}
                      placeholder="e.g., 90210"
                      maxLength={5}
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 placeholder-gray-500"
                    />
                    {zipCode.length >= 3 && getStateFromZip(zipCode) && (
                      <p className="text-sm font-bold text-emerald-400 mt-2">✓ Detected: {getStateFromZip(zipCode)}</p>
                    )}
                  </div>
                </div>
                
                {/* Utility Rate Preview */}
                {selectedState && STATE_RATES[selectedState] && (
                  <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 border-2 border-cyan-500/30">
                    <p className="text-sm font-bold text-gray-300 mb-3">Estimated utility rates for {selectedState}:</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-2xl font-black text-cyan-400">${STATE_RATES[selectedState].rate.toFixed(2)}</p>
                        <p className="text-sm text-gray-400 font-medium">per kWh</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-2xl font-black text-purple-400">${STATE_RATES[selectedState].demandCharge}</p>
                        <p className="text-sm text-gray-400 font-medium">per kW demand</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-2xl font-black text-amber-400">${STATE_RATES[selectedState].peakRate.toFixed(2)}</p>
                        <p className="text-sm text-gray-400 font-medium">peak rate</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Simplified Wash Type Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Car className="w-7 h-7 text-purple-400" />
                  </div>
                  Wash Type
                </h4>
                <p className="text-base text-gray-300 mb-6">
                  What type of car wash do you operate?
                </p>
                
                <div className="grid md:grid-cols-2 gap-5">
                  {Object.entries(SIMPLIFIED_WASH_TYPES).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setSimplifiedWashType(key as keyof typeof SIMPLIFIED_WASH_TYPES)}
                      className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                        simplifiedWashType === key 
                          ? 'border-purple-400 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 ring-4 ring-purple-400/30 shadow-lg shadow-purple-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-5xl">{type.icon}</span>
                        <div>
                          <p className="text-xl font-black text-white">{type.name}</p>
                          <p className="text-sm text-gray-300">{type.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-purple-500/30">
                          <p className="text-xl font-black text-purple-400">{type.peakDemandKW.min}-{type.peakDemandKW.max} kW</p>
                          <p className="text-sm text-gray-400 font-medium">Peak Power</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-emerald-500/30">
                          <p className="text-xl font-black text-emerald-400">${type.typicalBill.min.toLocaleString()}-${type.typicalBill.max.toLocaleString()}</p>
                          <p className="text-sm text-gray-400 font-medium">Monthly Bill</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Energy Goals Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <h4 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Target className="w-7 h-7 text-emerald-400" />
                  </div>
                  Your Energy Goals
                </h4>
                <p className="text-base text-gray-300 mb-6">
                  What are you trying to achieve? This helps us recommend the right solution.
                </p>
                
                <div className="grid md:grid-cols-3 gap-5">
                  {/* Solar + Battery */}
                  <button
                    onClick={() => {
                      setSelectedEnergyGoal('solar-bess');
                      setTargetReductionPercent(50);
                      setEnergyGoals(prev => ({
                        ...prev,
                        interestInSolar: true,
                        includeGenerator: false,
                        targetSavingsPercent: 50,
                      }));
                    }}
                    className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                      selectedEnergyGoal === 'solar-bess' 
                        ? 'border-amber-400 bg-gradient-to-br from-amber-900/40 to-orange-900/40 ring-4 ring-amber-400/30 shadow-lg shadow-amber-500/20' 
                        : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Sun className="w-8 h-8 text-amber-400" />
                      <p className="text-xl font-black text-white">Solar + Battery</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">Maximum savings with solar generation and battery storage</p>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Solar panels on roof/carport
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Battery stores excess solar
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Lowest long-term cost
                      </li>
                    </ul>
                    <div className="bg-amber-950/50 rounded-xl p-3 text-center border border-amber-500/30">
                      <p className="text-3xl font-black text-amber-400">50%</p>
                      <p className="text-sm text-amber-200/80 font-medium">Target Savings</p>
                    </div>
                  </button>
                  
                  {/* Battery Only */}
                  <button
                    onClick={() => {
                      setSelectedEnergyGoal('bess-only');
                      setTargetReductionPercent(35);
                      setEnergyGoals(prev => ({
                        ...prev,
                        interestInSolar: false,
                        includeGenerator: false,
                        targetSavingsPercent: 35,
                      }));
                    }}
                    className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                      selectedEnergyGoal === 'bess-only' 
                        ? 'border-cyan-400 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 ring-4 ring-cyan-400/30 shadow-lg shadow-cyan-500/20' 
                        : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Battery className="w-8 h-8 text-cyan-400" />
                      <p className="text-xl font-black text-white">Battery Only</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">Peak shaving and demand charge reduction without solar</p>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> No roof modifications
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Immediate demand savings
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Faster installation
                      </li>
                    </ul>
                    <div className="bg-cyan-950/50 rounded-xl p-3 text-center border border-cyan-500/30">
                      <p className="text-3xl font-black text-cyan-400">35%</p>
                      <p className="text-sm text-cyan-200/80 font-medium">Target Savings</p>
                    </div>
                  </button>
                  
                  {/* Hybrid + Generator */}
                  <button
                    onClick={() => {
                      setSelectedEnergyGoal('hybrid-generator');
                      setTargetReductionPercent(45);
                      setEnergyGoals(prev => ({
                        ...prev,
                        interestInSolar: true,
                        includeGenerator: true,
                        targetSavingsPercent: 45,
                      }));
                    }}
                    className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                      selectedEnergyGoal === 'hybrid-generator' 
                        ? 'border-purple-400 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 ring-4 ring-purple-400/30 shadow-lg shadow-purple-500/20' 
                        : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="w-8 h-8 text-purple-400" />
                      <p className="text-xl font-black text-white">Hybrid + Generator</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">Battery plus natural gas generator for backup and peak shaving</p>
                    <ul className="space-y-2 mb-4">
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Mainspring linear generator
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Fuel flexibility
                      </li>
                      <li className="text-sm text-emerald-400 flex items-center gap-2 font-medium">
                        <Check className="w-4 h-4" /> Grid independence
                      </li>
                    </ul>
                    <div className="bg-purple-950/50 rounded-xl p-3 text-center border border-purple-500/30">
                      <p className="text-3xl font-black text-purple-400">45%</p>
                      <p className="text-sm text-purple-200/80 font-medium">Target Savings</p>
                    </div>
                  </button>
                </div>
                
                {/* Target Reduction Slider - HIGH CONTRAST */}
                <div className="mt-6 bg-gradient-to-r from-slate-800 to-gray-800 rounded-xl p-5 border-2 border-emerald-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-lg font-bold text-white">Target Energy Cost Reduction</label>
                    <span className="text-4xl font-black text-emerald-400">{targetReductionPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={70}
                    step={5}
                    value={targetReductionPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setTargetReductionPercent(value);
                      setEnergyGoals(prev => ({ ...prev, targetSavingsPercent: value }));
                    }}
                    className="w-full h-3 accent-emerald-500 cursor-pointer"
                    style={{ background: 'linear-gradient(to right, #10b981 0%, #10b981 ' + ((targetReductionPercent - 20) / 50 * 100) + '%, rgba(255,255,255,0.2) ' + ((targetReductionPercent - 20) / 50 * 100) + '%, rgba(255,255,255,0.2) 100%)' }}
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2 font-medium">
                    <span>Conservative (20%)</span>
                    <span>Aggressive (70%)</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-3 bg-emerald-900/30 p-2 rounded-lg">
                    💡 Most car washes achieve 30-50% reduction with BESS. Solar+BESS can reach 50-70%.
                  </p>
                </div>
                
                {/* Auto-Advance Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                  >
                    Continue to Your Details
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 1: Your Details (Brand, Contact) */}
          {quoteMode === 'guided' && currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={CAR_WASH_STEP_HELP['details']} 
                colorScheme="cyan"
              />
              
              {/* Brand Selection with Typeahead - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Building className="w-7 h-7 text-purple-400" />
                  </div>
                  Car Wash Brand
                </h4>
                <p className="text-base text-gray-300 mb-6">
                  Select your brand to pre-fill typical equipment specs, or choose "Independent" to customize.
                </p>
                
                {/* Search Input with Typeahead */}
                <div className="relative mb-5">
                  <input
                    type="text"
                    value={brandSearchQuery}
                    onChange={(e) => setBrandSearchQuery(e.target.value)}
                    placeholder="🔍 Search brands (e.g., Mister, Tommy's, Zips...)"
                    className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30 placeholder-gray-500"
                  />
                  {brandSearchQuery && (
                    <button 
                      onClick={() => setBrandSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Search Results Dropdown */}
                  {brandSearchQuery.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-900/95 border border-white/20 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {filteredBrands
                        .filter(([key, brand]) => 
                          brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                          brand.description?.toLowerCase().includes(brandSearchQuery.toLowerCase())
                        )
                        .slice(0, 8)
                        .map(([key, brand]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedBrand(key as keyof typeof CAR_WASH_BRANDS);
                              setBrandSearchQuery('');
                            }}
                            className="w-full p-3 text-left hover:bg-white/10 flex items-center gap-3 border-b border-white/10 last:border-0"
                          >
                            <span className="text-xl">{brand.logo}</span>
                            <div className="flex-1">
                              <p className="font-bold text-white text-sm">{brand.name}</p>
                              <p className="text-xs text-cyan-200/60">{brand.siteCount}+ locations</p>
                            </div>
                            {brand.rank && brand.rank <= 10 && (
                              <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                                Top {brand.rank}
                              </span>
                            )}
                          </button>
                        ))}
                      {filteredBrands
                        .filter(([key, brand]) => 
                          brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                          brand.description?.toLowerCase().includes(brandSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <div className="p-3 text-center text-cyan-200/60 text-sm">
                            No brands found. Try "Independent Car Wash" below.
                          </div>
                        )}
                    </div>
                  )}
                </div>
                
                {/* Quick Selection Cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  {/* Independent */}
                  <button
                    onClick={() => setSelectedBrand('independent')}
                    className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                      selectedBrand === 'independent' 
                        ? 'border-emerald-400 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 ring-4 ring-emerald-400/30 shadow-lg shadow-emerald-500/20' 
                        : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🏢</span>
                      <div>
                        <p className="text-xl font-black text-white">Independent Car Wash</p>
                        <p className="text-sm text-gray-300">Single location or regional chain</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Show Selected Brand if not independent */}
                  {selectedBrand !== 'independent' ? (
                    <div className="p-5 rounded-2xl border-3 border-purple-400 bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 shadow-lg shadow-purple-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{CAR_WASH_BRANDS[selectedBrand].logo}</span>
                        <div>
                          <p className="text-xl font-black text-white">{CAR_WASH_BRANDS[selectedBrand].name}</p>
                          <p className="text-sm text-gray-300">{CAR_WASH_BRANDS[selectedBrand].siteCount}+ locations</p>
                          <p className="text-sm font-bold text-purple-400">
                            {CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.min}-{CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.max} kW typical
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl border-2 border-gray-600 bg-gradient-to-br from-gray-800/60 to-gray-700/40">
                      <p className="text-sm font-bold text-gray-300 mb-3">🏆 Top 5 Brands:</p>
                      <div className="flex flex-wrap gap-2">
                        {filteredBrands
                          .filter(([_, brand]) => brand.rank && brand.rank <= 5)
                          .sort((a, b) => (a[1].rank || 99) - (b[1].rank || 99))
                          .map(([key, brand]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedBrand(key as keyof typeof CAR_WASH_BRANDS)}
                              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full text-white font-medium border border-gray-500"
                            >
                              {brand.logo} {brand.name.split(' ')[0]}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Detailed Wash Type (if tunnel) - HIGH CONTRAST */}
              {simplifiedWashType === 'automated-tunnel' && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                  <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Car className="w-6 h-6 text-blue-400" />
                    </div>
                    Tunnel Type
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setWashType('express-exterior')}
                      className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                        washType === 'express-exterior' 
                          ? 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 ring-4 ring-blue-400/30' 
                          : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                      }`}
                    >
                      <p className="text-lg font-black text-white">Express Exterior</p>
                      <p className="text-sm text-gray-300">High-throughput exterior only</p>
                      <p className="text-base font-bold text-blue-400 mt-2">120-180 kW typical</p>
                    </button>
                    <button
                      onClick={() => setWashType('full-service')}
                      className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                        washType === 'full-service' 
                          ? 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 ring-4 ring-blue-400/30' 
                          : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                      }`}
                    >
                      <p className="text-lg font-black text-white">Full-Service</p>
                      <p className="text-sm text-gray-300">Complete wash with interior</p>
                      <p className="text-base font-bold text-blue-400 mt-2">150-250 kW typical</p>
                    </button>
                  </div>
                  
                  {/* Tunnel Length */}
                  <div className="mt-5 bg-gray-800/60 rounded-xl p-5 border-2 border-purple-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-base font-bold text-gray-300">Tunnel Length</label>
                      <span className="text-3xl font-black text-purple-400">{tunnelLength} ft</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      step={10}
                      value={tunnelLength}
                      onChange={(e) => setTunnelLength(parseInt(e.target.value))}
                      className="w-full accent-purple-500 h-3"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>50 ft (compact)</span>
                      <span>200 ft (express)</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Bays (if self-service) - HIGH CONTRAST */}
              {simplifiedWashType === 'self-service-bay' && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                  <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Car className="w-6 h-6 text-blue-400" />
                    </div>
                    Bay Configuration
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-5">
                    <button
                      onClick={() => setWashType('self-service')}
                      className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                        washType === 'self-service' 
                          ? 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 ring-4 ring-blue-400/30' 
                          : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                      }`}
                    >
                      <p className="text-lg font-black text-white">Self-Service Bays</p>
                      <p className="text-sm text-gray-300">Customer-operated</p>
                    </button>
                    <button
                      onClick={() => setWashType('in-bay-automatic')}
                      className={`p-5 rounded-2xl border-3 text-left transition-all transform hover:scale-[1.02] ${
                        washType === 'in-bay-automatic' 
                          ? 'border-blue-400 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 ring-4 ring-blue-400/30' 
                          : 'border-gray-600 hover:border-gray-500 bg-gradient-to-br from-gray-800/60 to-gray-700/40'
                      }`}
                    >
                      <p className="text-lg font-black text-white">In-Bay Automatic</p>
                      <p className="text-sm text-gray-300">Rollover system</p>
                    </button>
                  </div>
                  
                  {/* Number of Bays */}
                  <div className="bg-gray-800/60 rounded-xl p-5 border-2 border-cyan-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-base font-bold text-gray-300">Number of Bays</label>
                      <span className="text-3xl font-black text-cyan-400">{numberOfBays}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={washType === 'self-service' ? 20 : 8}
                      step={1}
                      value={numberOfBays}
                      onChange={(e) => setNumberOfBays(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 h-3"
                    />
                    <p className="text-sm font-medium text-gray-400 mt-3">
                      Est. Peak: <span className="font-bold text-cyan-400">{WASH_TYPES[washType].peakDemandKW.min * numberOfBays}-{WASH_TYPES[washType].peakDemandKW.max * numberOfBays} kW</span>
                    </p>
                  </div>
                </div>
              )}
              
              {/* Contact Information - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <h4 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Phone className="w-7 h-7 text-emerald-400" />
                  </div>
                  Contact Information
                </h4>
                <p className="text-base text-gray-300 mb-6">
                  Optional - for saving your quote and receiving follow-up.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={brandSubmission.brandName}
                      onChange={(e) => setBrandSubmission({...brandSubmission, brandName: e.target.value})}
                      placeholder="Your Car Wash Name"
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={brandSubmission.contactName}
                      onChange={(e) => setBrandSubmission({...brandSubmission, contactName: e.target.value})}
                      placeholder="Your Name"
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={brandSubmission.contactEmail}
                      onChange={(e) => setBrandSubmission({...brandSubmission, contactEmail: e.target.value})}
                      placeholder="you@example.com"
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={brandSubmission.contactPhone}
                      onChange={(e) => setBrandSubmission({...brandSubmission, contactPhone: e.target.value})}
                      placeholder="(555) 123-4567"
                      className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-lg font-medium border-2 border-gray-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Continue Button for Step 1 */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  Continue to Equipment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 2: Equipment */}
          {quoteMode === 'guided' && currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={CAR_WASH_STEP_HELP['equipment']} 
                colorScheme="cyan"
              />
              
              {/* Power Summary - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-purple-300 mb-1">Estimated Peak Demand</p>
                    <p className="text-4xl font-black text-white">{calculatedPower.peakDemandKW} <span className="text-xl text-gray-400">kW</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-cyan-300 mb-1">Monthly Usage</p>
                    <p className="text-4xl font-black text-cyan-400">{calculatedPower.monthlyKWh.toLocaleString()} <span className="text-xl text-gray-400">kWh</span></p>
                  </div>
                </div>
              </div>
              
              {/* Equipment Categories - Reordered: Water → Pressure → Drying → Vacuum - HIGH CONTRAST */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* 1. Water Systems - First because it's the start of the wash */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-5 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Droplets className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-black text-emerald-300">Water Systems</h4>
                    <span className="text-sm bg-emerald-500/30 px-3 py-1 rounded-full text-emerald-200 font-bold">Step 1</span>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasWaterReclaim}
                        onChange={(e) => setEquipment({...equipment, hasWaterReclaim: e.target.checked})}
                        className="accent-emerald-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">Water Reclamation System</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasReverseOsmosis}
                        onChange={(e) => setEquipment({...equipment, hasReverseOsmosis: e.target.checked})}
                        className="accent-emerald-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">Reverse Osmosis (Spot-Free)</span>
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">Water Heating:</span>
                      <select
                        value={equipment.waterHeatingType}
                        onChange={(e) => setEquipment({...equipment, waterHeatingType: e.target.value as any})}
                        className="bg-gray-700 rounded-lg px-3 py-2 text-white font-medium border border-gray-600"
                      >
                        <option value="gas">Natural Gas</option>
                        <option value="electric">Electric (25 kW)</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* 2. High Pressure - Second because pressure washing comes next */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-5 border-2 border-blue-500/40 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Droplets className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-black text-blue-300">High-Pressure Systems</h4>
                    <span className="text-sm bg-blue-500/30 px-3 py-1 rounded-full text-blue-200 font-bold">Step 2</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">{limits?.highPressurePumps?.label || 'HP Pump Stations'} ({limits?.highPressurePumps?.powerKW ?? 11} kW each)</span>
                      <input
                        type="number"
                        min={limits?.highPressurePumps?.min ?? 0}
                        max={limits?.highPressurePumps?.max ?? 8}
                        value={equipment.highPressurePumps}
                        onChange={(e) => setEquipment({...equipment, highPressurePumps: parseInt(e.target.value) || 0})}
                        className="w-20 bg-gray-700 rounded-lg px-3 py-2 text-white text-center font-bold border-2 border-gray-600 focus:border-blue-400"
                      />
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasUndercarriage}
                        onChange={(e) => setEquipment({...equipment, hasUndercarriage: e.target.checked})}
                        className="accent-blue-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">Undercarriage Wash</span>
                    </label>
                  </div>
                </div>
                
                {/* 3. Drying - Third, after washing is complete */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-5 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Wind className="w-6 h-6 text-amber-400" />
                    </div>
                    <h4 className="text-lg font-black text-amber-300">Drying Systems</h4>
                    <span className="text-sm bg-amber-500/30 px-3 py-1 rounded-full text-amber-200 font-bold">30-40% of usage</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">{limits?.standardBlowers?.label || 'Standard Blowers'} ({limits?.standardBlowers?.powerKW ?? 7.5} kW each)</span>
                      <input
                        type="number"
                        min={limits?.standardBlowers?.min ?? 0}
                        max={limits?.standardBlowers?.max ?? 20}
                        value={equipment.standardBlowers}
                        onChange={(e) => setEquipment({...equipment, standardBlowers: parseInt(e.target.value) || 0})}
                        className="w-20 bg-gray-700 rounded-lg px-3 py-2 text-white text-center font-bold border-2 border-gray-600 focus:border-amber-400"
                      />
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasWindBlade}
                        onChange={(e) => setEquipment({...equipment, hasWindBlade: e.target.checked})}
                        className="accent-amber-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">Wind Blade (15 kW)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasHighPerformanceDryer}
                        onChange={(e) => setEquipment({...equipment, hasHighPerformanceDryer: e.target.checked})}
                        className="accent-amber-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">High-Performance Dryer (33.5 kW)</span>
                    </label>
                  </div>
                </div>
                
                {/* 4. Vacuum - Last, after the car exits */}
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-5 border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-500/20 rounded-xl">
                      <Gauge className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h4 className="text-lg font-black text-cyan-300">Vacuum Systems</h4>
                    <span className="text-sm bg-cyan-500/30 px-3 py-1 rounded-full text-cyan-200 font-bold">Post-Wash</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                      <span className="text-white font-medium">{limits?.vacuumStations?.label || 'Vacuum Stations'} ({limits?.vacuumStations?.powerKW ?? 3} kW each)</span>
                      <input
                        type="number"
                        min={limits?.vacuumStations?.min ?? 0}
                        max={limits?.vacuumStations?.max ?? 40}
                        value={equipment.vacuumStations}
                        onChange={(e) => setEquipment({...equipment, vacuumStations: parseInt(e.target.value) || 0})}
                        className="w-20 bg-gray-700 rounded-lg px-3 py-2 text-white text-center font-bold border-2 border-gray-600 focus:border-cyan-400"
                      />
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.hasCentralVacuum}
                        onChange={(e) => setEquipment({...equipment, hasCentralVacuum: e.target.checked})}
                        className="accent-cyan-500 w-5 h-5"
                      />
                      <span className="text-white font-medium">Central Vacuum System (30 kW)</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Automation Level Power Impact Note - HIGH CONTRAST */}
              {automationLevel && automationLevel !== 'standard' && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-5 border-2 border-purple-500/40 shadow-lg shadow-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-lg font-black text-purple-300">
                      {AUTOMATION_LEVELS[automationLevel].name} Automation
                    </span>
                    <span className="text-sm bg-purple-500/30 px-3 py-1 rounded-full text-purple-200 font-bold">
                      {AUTOMATION_LEVELS[automationLevel].powerMultiplier > 1 ? '+' : ''}
                      {((AUTOMATION_LEVELS[automationLevel].powerMultiplier - 1) * 100).toFixed(0)}% power
                    </span>
                  </div>
                  <p className="text-base text-gray-300 mt-3">
                    {AUTOMATION_LEVELS[automationLevel].description}
                  </p>
                </div>
              )}
              
              {/* Continue Button for Step 2 */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  Continue to Energy Profile
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Energy Profile (was Operations) */}
          {quoteMode === 'guided' && currentStep === 3 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={CAR_WASH_STEP_HELP['energy-profile']} 
                colorScheme="cyan"
              />
              
              {/* Operations Settings - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Clock className="w-7 h-7 text-purple-400" />
                  </div>
                  Operating Hours
                </h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-base font-bold text-gray-300 mb-3">Hours Open Per Day</label>
                      <input
                        type="range"
                        min="6"
                        max="24"
                        value={operations.hoursPerDay}
                        onChange={(e) => setOperations({...operations, hoursPerDay: parseInt(e.target.value)})}
                        className="w-full accent-purple-500 h-3"
                      />
                      <p className="text-center text-3xl font-black text-white mt-3">{operations.hoursPerDay} <span className="text-lg text-gray-400">hours/day</span></p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-base font-bold text-gray-300 mb-3">Days Open Per Week</label>
                      <div className="flex gap-3">
                        {[5, 6, 7].map((d) => (
                          <button
                            key={d}
                            onClick={() => setOperations({...operations, daysPerWeek: d})}
                            className={`flex-1 py-3 rounded-xl font-black text-lg transition-all transform hover:scale-[1.02] ${
                              operations.daysPerWeek === d 
                                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white ring-4 ring-purple-400/30' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                            }`}
                          >
                            {d} days
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-base font-bold text-gray-300 mb-3">Peak Hours (Busiest Time)</label>
                      <div className="flex items-center gap-3">
                        <select
                          value={operations.peakHoursStart}
                          onChange={(e) => setOperations({...operations, peakHoursStart: parseInt(e.target.value)})}
                          className="flex-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-bold text-lg border-2 border-gray-600 focus:border-purple-400"
                        >
                          {Array.from({length: 12}, (_, i) => i + 6).map((h) => (
                            <option key={h} value={h}>{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</option>
                          ))}
                        </select>
                        <span className="text-white font-bold text-lg">to</span>
                        <select
                          value={operations.peakHoursEnd}
                          onChange={(e) => setOperations({...operations, peakHoursEnd: parseInt(e.target.value)})}
                          className="flex-1 bg-gray-700 rounded-xl px-4 py-3 text-white font-bold text-lg border-2 border-gray-600 focus:border-purple-400"
                        >
                          {Array.from({length: 12}, (_, i) => i + 12).map((h) => (
                            <option key={h} value={h}>{h > 12 ? h - 12 : h} PM</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-base font-bold text-purple-400 mt-3">
                        {operations.peakHoursEnd - operations.peakHoursStart} hours of peak demand
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <label className="block text-base font-bold text-gray-300 mb-3">Seasonal Variation</label>
                      <div className="flex gap-3">
                        {(['low', 'moderate', 'high'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setOperations({...operations, seasonalVariation: s})}
                            className={`flex-1 py-3 rounded-xl text-base font-black transition-all transform hover:scale-[1.02] ${
                              operations.seasonalVariation === s 
                                ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white ring-4 ring-cyan-400/30' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                            }`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Operations Summary - Combined Energy Cost - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                <h4 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <DollarSign className="w-7 h-7 text-cyan-400" />
                  </div>
                  Your Current Energy Costs
                </h4>
                <div className="text-center mb-5">
                  <p className="text-6xl font-black text-white">
                    ${(calculatedPower.demandCharges + calculatedPower.energyCharges).toLocaleString()}
                  </p>
                  <p className="text-lg text-gray-300 mt-2">Estimated Monthly Electric Bill</p>
                </div>
                <div className="grid grid-cols-2 gap-5 text-center border-t-2 border-gray-700 pt-5">
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
                    <p className="text-3xl font-black text-purple-400">${calculatedPower.demandCharges.toLocaleString()}</p>
                    <p className="text-base text-gray-300 font-medium">Demand Charges ({Math.round(calculatedPower.demandCharges / (calculatedPower.demandCharges + calculatedPower.energyCharges) * 100) || 0}%)</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl p-4 border border-emerald-500/30">
                    <p className="text-3xl font-black text-emerald-400">${calculatedPower.energyCharges.toLocaleString()}</p>
                    <p className="text-base text-gray-300 font-medium">Energy Charges ({Math.round(calculatedPower.energyCharges / (calculatedPower.demandCharges + calculatedPower.energyCharges) * 100) || 0}%)</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4 text-center">
                  Based on {calculatedPower.monthlyKWh.toLocaleString()} kWh/month × {STATE_RATES[selectedState]?.rate || 0.13}/kWh + {calculatedPower.peakDemandKW} kW × ${STATE_RATES[selectedState]?.demandCharge || 15}/kW
                </p>
              </div>
              
              {/* Solar Options (if selected in Step 0) - HIGH CONTRAST */}
              {(selectedEnergyGoal === 'solar-bess' || selectedEnergyGoal === 'hybrid-generator') && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Sun className="w-7 h-7 text-amber-400" />
                    </div>
                    <h4 className="text-2xl font-black text-amber-300">Solar Configuration</h4>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-5">
                    <label className="block text-base font-bold text-gray-300 mb-3">Available Roof/Carport Area for Solar</label>
                    <input
                      type="range"
                      min={0}
                      max={50000}
                      step={500}
                      value={energyGoals.solarRoofArea}
                      onChange={(e) => setEnergyGoals({...energyGoals, solarRoofArea: parseInt(e.target.value)})}
                      className="w-full accent-amber-500 h-3"
                    />
                    <div className="flex justify-between mt-4">
                      <span className="text-2xl font-black text-white">{energyGoals.solarRoofArea.toLocaleString()} <span className="text-lg text-gray-400">sq ft</span></span>
                      <span className="text-2xl font-black text-amber-400">~{Math.round(energyGoals.solarRoofArea * 0.015)} <span className="text-lg text-gray-400">kW solar</span></span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generator Options (if selected in Step 0) - HIGH CONTRAST */}
              {selectedEnergyGoal === 'hybrid-generator' && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-orange-500/40 shadow-xl shadow-orange-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-xl">
                      <Zap className="w-7 h-7 text-orange-400" />
                    </div>
                    <h4 className="text-2xl font-black text-orange-300">Generator Configuration</h4>
                    <span className="text-sm bg-orange-500/30 px-3 py-1 rounded-full text-orange-200 font-bold">Mainspring Linear Generator</span>
                  </div>
                  <p className="text-base text-gray-300 mb-5">
                    Natural gas generator for extended backup and peak shaving. Auto-sized based on your peak demand.
                  </p>
                  <div className="bg-gray-800/50 rounded-xl p-5">
                    <label className="block text-base font-bold text-gray-300 mb-3">
                      Generator Size: <span className="text-orange-400 font-black text-2xl">{energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)} kW</span>
                    </label>
                    <input
                      type="range"
                      min={Math.max(25, Math.round(calculatedPower.peakDemandKW * 0.5))}
                      max={Math.max(100, Math.round(calculatedPower.peakDemandKW * 1.2))}
                      step={10}
                      value={energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)}
                      onChange={(e) => setEnergyGoals({...energyGoals, includeGenerator: true, generatorSizeKW: parseInt(e.target.value)})}
                      className="w-full accent-orange-500 h-3"
                    />
                    <p className="text-sm text-gray-400 mt-3">
                      Recommended: 80% of peak demand ({Math.round(calculatedPower.peakDemandKW * 0.8)} kW)
                    </p>
                  </div>
                </div>
              )}
              
              {/* Grid Connection Status - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-gray-500/40 shadow-xl shadow-gray-500/10">
                <h4 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
                  <div className="p-2 bg-gray-500/20 rounded-xl">
                    <Zap className="w-7 h-7 text-gray-400" />
                  </div>
                  Grid Connection Status
                </h4>
                <p className="text-base text-gray-300 mb-5">
                  How is your car wash connected to the power grid?
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'grid-tied' as const, label: 'Grid-Tied', desc: 'Connected to utility', icon: '🔌' },
                    { id: 'grid-backup-only' as const, label: 'Limited Grid', desc: 'Unreliable connection', icon: '⚡' },
                    { id: 'off-grid' as const, label: 'Off-Grid', desc: 'No utility connection', icon: '🏝️' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setGridConnection(prev => ({ ...prev, status: option.id }))}
                      className={`p-5 rounded-2xl text-center transition-all transform hover:scale-[1.02] ${
                        gridConnection.status === option.id 
                          ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-3 border-purple-400 ring-4 ring-purple-400/30' 
                          : 'bg-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <p className="text-lg font-black text-white">{option.label}</p>
                      <p className="text-sm text-gray-400 font-medium">{option.desc}</p>
                    </button>
                  ))}
                </div>
                
                {/* Contextual info based on selection */}
                {gridConnection.status !== 'grid-tied' && (
                  <div className={`mt-4 p-4 rounded-xl text-sm ${
                    gridConnection.status === 'off-grid'
                      ? 'bg-amber-500/20 border border-amber-400/30 text-amber-200'
                      : 'bg-blue-500/20 border border-blue-400/30 text-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <span>
                        {gridConnection.status === 'off-grid'
                          ? 'Off-grid systems require larger battery capacity and backup generation for reliability.'
                          : 'Limited grid connection means we\'ll size your system for greater self-reliance.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Financing Preference - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <h4 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <DollarSign className="w-7 h-7 text-emerald-400" />
                  </div>
                  Financing Preference
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { id: 'cash', label: 'Cash', desc: 'Full purchase' },
                    { id: 'loan', label: 'Loan', desc: '7yr @ 7% APR' },
                    { id: 'ppa', label: 'PPA', desc: '$0.08/kWh' },
                    { id: 'lease', label: 'Lease', desc: '10yr term' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEnergyGoals({...energyGoals, financingPreference: f.id as any})}
                      className={`p-5 rounded-2xl text-center transition-all transform hover:scale-[1.02] ${
                        energyGoals.financingPreference === f.id 
                          ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-3 border-emerald-400 ring-4 ring-emerald-400/30' 
                          : 'bg-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-lg font-black text-white">{f.label}</p>
                      <p className="text-sm text-gray-400 font-medium">{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Generate Quote Button */}
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    generateQuote();
                    setCurrentStep(4);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Your Quote
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Review Quote */}
          {quoteMode === 'guided' && currentStep === 4 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={CAR_WASH_STEP_HELP['review']} 
                colorScheme="emerald"
              />
              
              {/* Recalculate Button - Always visible */}
              <div className="flex justify-end">
                <button
                  onClick={() => generateQuote()}
                  disabled={isCalculating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 text-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isCalculating ? 'Recalculating...' : 'Recalculate Quote'}
                </button>
              </div>
              
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
                    <p className="text-cyan-200/70">{mergedInputs.businessName || 'Your Car Wash'} • {numberOfBays} Bays • {mergedInputs.state}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-purple-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                    <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold mb-2">💰 Annual Savings</p>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-cyan-200/70 mt-2">per year</p>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      QUOTE NAMEPLATE - Professional Header
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Merlin BESS Quote</p>
                        <h3 className="text-xl font-bold text-white mt-1">
                          {brandSubmission.brandName || CAR_WASH_BRANDS[selectedBrand]?.name || 'Car Wash'} Energy Storage Project
                        </h3>
                        <p className="text-sm text-cyan-200/70 mt-1">
                          {selectedState}{zipCode ? `, ${zipCode}` : ''} • {WASH_TYPES[washType]?.name || 'Automated Tunnel'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-cyan-200/50">Quote Date</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-cyan-200/50 mt-2">Quote ID</p>
                        <p className="text-cyan-400 font-mono text-sm">CW-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    {/* Nameplate Key Specs */}
                    <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-400">
                          {Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)} kW
                        </p>
                        <p className="text-xs text-white/60">BESS Power</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">
                          {quoteResult.equipment.batteries.unitEnergyMWh >= 1 
                            ? `${quoteResult.equipment.batteries.unitEnergyMWh.toFixed(1)} MWh` 
                            : `${Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000)} kWh`}
                        </p>
                        <p className="text-xs text-white/60">Storage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-400">
                          {energyGoals.interestInSolar ? `${Math.round(energyGoals.solarRoofArea * 0.015)} kW` : '—'}
                        </p>
                        <p className="text-xs text-white/60">Solar</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                          {quoteResult.financials.paybackYears.toFixed(1)} yr
                        </p>
                        <p className="text-xs text-white/60">Payback</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      SAVINGS BREAKDOWN - Line Items (HIGH CONTRAST)
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <TrendingDown className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Savings Breakdown</h4>
                    </div>
                    
                    {/* Savings Sources - LARGER AND BOLDER */}
                    <div className="space-y-5 mb-6">
                      {/* Demand Charge Reduction */}
                      <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                            <span className="text-lg font-bold text-white">Demand Charge Reduction</span>
                          </div>
                          <span className="text-2xl font-black text-purple-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.55).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-4 rounded-full shadow-lg shadow-purple-500/30" style={{ width: '55%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~55% of total • Peak shaving during {operations.peakHoursStart > 12 ? operations.peakHoursStart - 12 : operations.peakHoursStart}{operations.peakHoursStart >= 12 ? 'PM' : 'AM'}-{operations.peakHoursEnd > 12 ? operations.peakHoursEnd - 12 : operations.peakHoursEnd}PM</p>
                      </div>
                      
                      {/* Energy Arbitrage */}
                      <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 rounded-xl p-4 border border-cyan-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
                            <span className="text-lg font-bold text-white">Energy Arbitrage (TOU)</span>
                          </div>
                          <span className="text-2xl font-black text-cyan-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.25).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-4 rounded-full shadow-lg shadow-cyan-500/30" style={{ width: '25%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~25% of total • Charge off-peak, discharge on-peak</p>
                      </div>
                      
                      {/* Solar Savings (if applicable) */}
                      {energyGoals.interestInSolar && (
                        <div className="bg-gradient-to-r from-amber-900/30 to-orange-800/20 rounded-xl p-4 border border-amber-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
                              <span className="text-lg font-bold text-white">Solar Generation Offset</span>
                            </div>
                            <span className="text-2xl font-black text-amber-400">
                              ${Math.round(quoteResult.financials.annualSavings * 0.15).toLocaleString()}/yr
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-4 rounded-full shadow-lg shadow-amber-500/30" style={{ width: '15%' }}></div>
                          </div>
                          <p className="text-sm text-gray-400 mt-2 font-medium">~15% of total • {Math.round(energyGoals.solarRoofArea * 0.015 * 1500)} kWh/yr estimated</p>
                        </div>
                      )}
                      
                      {/* Avoided Demand Spikes */}
                      <div className="bg-gradient-to-r from-emerald-900/30 to-green-800/20 rounded-xl p-4 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                            <span className="text-lg font-bold text-white">Avoided Demand Spikes</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-400">
                            ${Math.round(quoteResult.financials.annualSavings * (energyGoals.interestInSolar ? 0.05 : 0.20)).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-4 rounded-full shadow-lg shadow-emerald-500/30" style={{ width: energyGoals.interestInSolar ? '5%' : '20%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~{energyGoals.interestInSolar ? '5' : '20'}% of total • Smoothing inrush current spikes</p>
                      </div>
                    </div>
                    
                    {/* Total Savings Summary - PROMINENT */}
                    <div className="bg-gradient-to-r from-emerald-800/40 to-green-700/30 rounded-xl p-5 border-2 border-emerald-400/50 flex justify-between items-center">
                      <span className="text-xl font-black text-white">Total Annual Savings</span>
                      <span className="text-4xl font-black text-emerald-400">
                        ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}/yr
                      </span>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      ROI & PAYBACK VISUALIZATION - HIGH CONTRAST
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <BarChart3 className="w-7 h-7 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Return on Investment</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-5 mb-5">
                      {/* Payback Period */}
                      <div className="bg-gradient-to-br from-emerald-900/30 to-green-800/20 rounded-xl p-5 text-center border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                        <p className="text-5xl font-black text-emerald-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                        <p className="text-base font-bold text-white mt-2">Years to Payback</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">After 30% ITC</p>
                      </div>
                      
                      {/* 10-Year ROI */}
                      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-800/20 rounded-xl p-5 text-center border-2 border-blue-500/40 shadow-lg shadow-blue-500/10">
                        <p className="text-5xl font-black text-blue-400">{Math.round(quoteResult.financials.roi10Year)}%</p>
                        <p className="text-base font-bold text-white mt-2">10-Year ROI</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">${Math.round(quoteResult.financials.annualSavings * 10).toLocaleString()} total</p>
                      </div>
                      
                      {/* 25-Year ROI */}
                      <div className="bg-gradient-to-br from-purple-900/30 to-fuchsia-800/20 rounded-xl p-5 text-center border-2 border-purple-500/40 shadow-lg shadow-purple-500/10">
                        <p className="text-5xl font-black text-purple-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                        <p className="text-base font-bold text-white mt-2">25-Year ROI</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">${Math.round(quoteResult.financials.annualSavings * 25).toLocaleString()} total</p>
                      </div>
                    </div>
                    
                    {/* Payback Timeline Visual */}
                    <div className="bg-gray-800/50 rounded-xl p-5">
                      <p className="text-base font-bold text-gray-300 mb-3">Investment Recovery Timeline</p>
                      <div className="relative h-10 bg-gray-700 rounded-full overflow-hidden">
                        {/* Payback marker */}
                        <div 
                          className="absolute top-0 h-full bg-gradient-to-r from-red-500 to-emerald-500 opacity-80"
                          style={{ width: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                        {/* Break-even line */}
                        <div 
                          className="absolute top-0 h-full w-1 bg-white z-10"
                          style={{ left: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                        {/* Profit zone */}
                        <div 
                          className="absolute top-0 right-0 h-full bg-emerald-500/30"
                          style={{ left: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-cyan-200/60 mt-1">
                        <span>Year 0</span>
                        <span className="text-emerald-400 font-bold">← Break-even: Year {quoteResult.financials.paybackYears.toFixed(1)}</span>
                        <span>Year 10</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      ENVIRONMENTAL IMPACT - HIGH CONTRAST
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-green-500/40 shadow-xl shadow-green-500/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-500/20 rounded-xl">
                        <Leaf className="w-7 h-7 text-green-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Environmental Impact</h4>
                      <span className="text-sm bg-green-500/30 px-3 py-1 rounded-full text-green-200 font-bold">Annual</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {/* CO2 Avoided */}
                      <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 rounded-xl p-4 text-center border-2 border-green-500/30 shadow-lg shadow-green-500/10">
                        <p className="text-4xl font-black text-green-400">
                          {Math.round((quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365 * 0.5) / 1000 * 0.417)}
                        </p>
                        <p className="text-sm text-white font-bold mt-2">Metric Tons CO₂</p>
                        <p className="text-xs text-gray-400">Avoided annually</p>
                      </div>
                      
                      {/* Trees Equivalent */}
                      <div className="bg-gradient-to-br from-emerald-900/30 to-teal-800/20 rounded-xl p-4 text-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                        <p className="text-4xl font-black text-emerald-400">
                          {Math.round((quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365 * 0.5) / 1000 * 0.417 * 24)}
                        </p>
                        <p className="text-sm text-white font-bold mt-2">Trees Planted</p>
                        <p className="text-xs text-gray-400">Equivalent/year</p>
                      </div>
                      
                      {/* Miles Not Driven */}
                      <div className="bg-gradient-to-br from-cyan-900/30 to-blue-800/20 rounded-xl p-4 text-center border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                        <p className="text-4xl font-black text-cyan-400">
                          {Math.round((quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365 * 0.5) / 1000 * 0.417 * 2481).toLocaleString()}
                        </p>
                        <p className="text-sm text-white font-bold mt-2">Miles Not Driven</p>
                        <p className="text-xs text-gray-400">Gas car equivalent</p>
                      </div>
                      
                      {/* Homes Powered */}
                      <div className="bg-gradient-to-br from-amber-900/30 to-orange-800/20 rounded-xl p-4 text-center border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
                        <p className="text-4xl font-black text-amber-400">
                          {Math.round((quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365 * 0.5) / 10000 * 10) / 10}
                        </p>
                        <p className="text-sm text-white font-bold mt-2">Homes Powered</p>
                        <p className="text-xs text-gray-400">For a year (equiv.)</p>
                      </div>
                    </div>
                    
                    {/* ESG Callout */}
                    <div className="mt-5 bg-gradient-to-r from-green-800/30 to-emerald-700/20 rounded-xl p-4 border-2 border-green-400/30">
                      <p className="text-base text-green-200">
                        🌱 <span className="font-black">ESG Impact:</span> This BESS installation supports sustainability goals and can contribute to LEED certification, corporate carbon neutrality commitments, and green marketing initiatives.
                      </p>
                    </div>
                  </div>
                  
                  {/* Key Metrics Dashboard */}
                  <KeyMetricsDashboard
                    input={{
                      vertical: 'car-wash',
                      systemSizeKW: Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100),
                      systemSizeKWh: Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000),
                      annualSavings: quoteResult.financials.annualSavings,
                      paybackYears: quoteResult.financials.paybackYears,
                      roi10Year: quoteResult.financials.roi10Year,
                      roi25Year: quoteResult.financials.roi25Year,
                      netCost: quoteResult.costs.netCost,
                      peakDemandReduction: Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100),
                      state: mergedInputs.state,
                      annualKWhDisplaced: Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365),
                    }}
                    layout="grid"
                    maxMetrics={6}
                    showCO2Details={true}
                  />
                  
                  {/* CO2 Badge */}
                  <div className="flex justify-center">
                    <CO2Badge
                      annualSavingsKWh={Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000 * 365)}
                      state={mergedInputs.state}
                      systemType="bess"
                    />
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      EQUIPMENT BREAKDOWN - DETAILED - HIGH CONTRAST
                      ═══════════════════════════════════════════════════════════════ */}
                  
                  {/* Battery Energy Storage System */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <Battery className="w-7 h-7 text-purple-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Battery Energy Storage System (BESS)</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Power Rating:</span>
                          <span className="text-xl font-black text-purple-400">{Math.round(calculatedPower.peakDemandKW * energyGoals.targetSavingsPercent / 100)} kW</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Energy Capacity:</span>
                          <span className="text-xl font-black text-cyan-400">
                            {quoteResult.equipment.batteries.unitEnergyMWh >= 1 
                              ? `${quoteResult.equipment.batteries.unitEnergyMWh.toFixed(2)} MWh` 
                              : `${Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000)} kWh`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Runtime at Peak:</span>
                          <span className="text-lg font-bold text-white">{(operations.peakHoursEnd - operations.peakHoursStart).toFixed(0)} hours</span>
                        </div>
                      </div>
                      <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Battery Type:</span>
                          <span className="text-lg font-bold text-white">{quoteResult.equipment.batteries.model}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Manufacturer:</span>
                          <span className="text-lg font-bold text-white">{quoteResult.equipment.batteries.manufacturer}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Battery Cost:</span>
                          <span className="text-2xl font-black text-purple-400">${Math.round(quoteResult.equipment.batteries.totalCost).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t-2 border-gray-700 text-sm text-gray-400">
                      <span className="font-bold text-purple-400">${quoteResult.equipment.batteries.pricePerKWh}/kWh</span> • Source: {quoteResult.equipment.batteries.marketIntelligence?.dataSource || 'NREL ATB 2024'}
                    </div>
                  </div>

                  {/* Solar (if requested) - HIGH CONTRAST */}
                  {quoteResult.equipment.solar && (
                    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                          <Sun className="w-7 h-7 text-amber-400" />
                        </div>
                        <h4 className="text-xl font-black text-white">Solar Power System</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">System Size:</span>
                            <span className="text-xl font-black text-amber-400">
                              {quoteResult.equipment.solar.totalMW >= 1 
                                ? `${quoteResult.equipment.solar.totalMW.toFixed(2)} MW` 
                                : `${Math.round(quoteResult.equipment.solar.totalMW * 1000)} kW`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Solar Panels:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.solar.panelQuantity.toLocaleString()} panels</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Est. Annual Generation:</span>
                            <span className="text-lg font-bold text-yellow-400">{Math.round(quoteResult.equipment.solar.totalMW * 1500).toLocaleString()} MWh/yr</span>
                          </div>
                        </div>
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Roof Space Needed:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.solar.spaceRequirements.rooftopAreaSqFt.toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Price Category:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.solar.priceCategory}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Solar Cost:</span>
                            <span className="text-2xl font-black text-amber-400">${Math.round(quoteResult.equipment.solar.totalCost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t-2 border-gray-700 text-sm text-gray-400">
                        <span className="font-bold text-amber-400">${quoteResult.equipment.solar.costPerWatt.toFixed(2)}/W</span> installed • Includes panels, inverters & racking
                      </div>
                    </div>
                  )}

                  {/* Generator (if off-grid or requested) - HIGH CONTRAST */}
                  {quoteResult.equipment.generators && (
                    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-orange-500/40 shadow-xl shadow-orange-500/10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-orange-500/20 rounded-xl">
                          <Zap className="w-7 h-7 text-orange-400" />
                        </div>
                        <h4 className="text-xl font-black text-white">Backup Generator System</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Generator Power:</span>
                            <span className="text-xl font-black text-orange-400">{(quoteResult.equipment.generators.unitPowerMW * quoteResult.equipment.generators.quantity * 1000).toFixed(0)} kW</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Units:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.generators.quantity}x {quoteResult.equipment.generators.unitPowerMW} MW</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Fuel Type:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.generators.fuelType}</span>
                          </div>
                        </div>
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Runtime:</span>
                            <span className="text-lg font-bold text-white">24+ hours (with fuel)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Manufacturer:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.generators.manufacturer}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Generator Cost:</span>
                            <span className="text-2xl font-black text-orange-400">${Math.round(quoteResult.equipment.generators.totalCost).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t-2 border-gray-700 text-sm text-gray-400">
                        <span className="font-bold text-orange-400">${quoteResult.equipment.generators.costPerKW}/kW</span> • Includes automatic transfer switch (ATS)
                      </div>
                    </div>
                  )}

                  {/* Power Electronics - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Gauge className="w-7 h-7 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Power Electronics & Switchgear</h4>
                    </div>
                    <div className="space-y-4">
                      {/* Inverters */}
                      <div className="bg-gradient-to-br from-blue-900/30 to-indigo-800/20 rounded-xl p-4 border border-blue-500/30">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-blue-300">Bi-Directional Inverter</span>
                          <span className="text-2xl font-black text-blue-400">${Math.round(quoteResult.equipment.inverters.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                          <span className="font-medium">{quoteResult.equipment.inverters.quantity}x {quoteResult.equipment.inverters.unitPowerMW} MW units</span>
                          <span className="text-right font-medium">{quoteResult.equipment.inverters.manufacturer} {quoteResult.equipment.inverters.model}</span>
                        </div>
                      </div>
                      
                      {/* Transformer */}
                      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-800/20 rounded-xl p-4 border border-indigo-500/30">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-indigo-300">Step-Up Transformer</span>
                          <span className="text-2xl font-black text-indigo-400">${Math.round(quoteResult.equipment.transformers.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                          <span className="font-medium">{quoteResult.equipment.transformers.quantity}x {quoteResult.equipment.transformers.unitPowerMVA} MVA</span>
                          <span className="text-right font-medium">{quoteResult.equipment.transformers.voltage}</span>
                        </div>
                      </div>
                      
                      {/* Switchgear */}
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-800/20 rounded-xl p-4 border border-purple-500/30">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-purple-300">Medium Voltage Switchgear</span>
                          <span className="text-2xl font-black text-purple-400">${Math.round(quoteResult.equipment.switchgear.totalCost).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                          <span className="font-medium">{quoteResult.equipment.switchgear.quantity}x {quoteResult.equipment.switchgear.type}</span>
                          <span className="text-right font-medium">{quoteResult.equipment.switchgear.voltage} rated</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Installation & Turnkey Costs - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Turnkey Installation Package</h4>
                    </div>
                    <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-700">
                        <span className="text-gray-300 font-medium">Balance of System (BOS)</span>
                        <span className="text-xl font-bold text-white">${Math.round(quoteResult.equipment.installation.bos).toLocaleString()}</span>
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

                  {/* Cost Summary - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Investment Summary</h4>
                    </div>
                    <div className="space-y-3 bg-gray-800/50 rounded-xl p-4">
                      <div className="flex justify-between py-3 border-b-2 border-gray-700">
                        <span className="text-gray-300 font-medium">Total Equipment Cost</span>
                        <span className="text-xl font-bold text-white">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b-2 border-gray-700">
                        <span className="text-gray-300 font-medium">Total Installation Cost</span>
                        <span className="text-xl font-bold text-white">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b-2 border-gray-700">
                        <span className="text-white font-bold text-lg">Total Project Cost</span>
                        <span className="text-2xl font-black text-white">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b-2 border-gray-700">
                        <span className="text-emerald-300 font-medium">Federal Tax Credit (30% ITC)</span>
                        <span className="text-xl font-bold text-emerald-400">-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-4 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 rounded-xl px-4 -mx-1 border-2 border-emerald-500/50">
                        <span className="text-emerald-200 font-bold text-lg">Net Cost After Incentives</span>
                        <span className="text-3xl font-black text-emerald-400">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t-2 border-gray-700 grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 font-medium mb-1">Financing Option</p>
                        <p className="text-xl font-black text-white">{energyGoals.financingPreference.toUpperCase()}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <p className="text-sm text-gray-400 font-medium mb-1">Est. Monthly Payment</p>
                        <p className="text-xl font-black text-white">
                          {energyGoals.financingPreference === 'cash' ? (
                            'N/A'
                          ) : energyGoals.financingPreference === 'loan' ? (
                            // 7-year loan at 7% APR: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
                            `$${Math.round((quoteResult.costs.netCost * (0.07/12) * Math.pow(1 + 0.07/12, 84)) / (Math.pow(1 + 0.07/12, 84) - 1)).toLocaleString()}/mo`
                          ) : energyGoals.financingPreference === 'ppa' ? (
                            // PPA: $0.08/kWh estimated rate
                            `$0.08/kWh`
                          ) : (
                            // Lease: 10-year term with 1% monthly factor
                            `$${Math.round(quoteResult.costs.netCost * 0.01).toLocaleString()}/mo`
                          )}
                          {energyGoals.financingPreference === 'loan' && <span className="text-sm text-gray-400 font-medium"> (7yr @ 7%)</span>}
                          {energyGoals.financingPreference === 'lease' && <span className="text-sm text-gray-400 font-medium"> (10yr lease)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Options - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-3 bg-cyan-500/20 rounded-xl">
                        <Download className="w-7 h-7 text-cyan-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Download Your Quote</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={downloadWord}
                        className="flex flex-col items-center gap-3 bg-gradient-to-br from-blue-600/30 to-purple-600/30 hover:from-blue-500/50 hover:to-purple-500/50 border-2 border-blue-400/50 text-white py-5 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
                      >
                        <FileText className="w-10 h-10 text-blue-400" />
                        <span className="text-base font-bold">Word (.docx)</span>
                      </button>
                      <button
                        onClick={downloadExcel}
                        className="flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-600/30 to-green-600/30 hover:from-emerald-500/50 hover:to-green-500/50 border-2 border-emerald-400/50 text-white py-5 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30"
                      >
                        <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
                        <span className="text-base font-bold">Excel (.csv)</span>
                      </button>
                      <button
                        onClick={downloadPDF}
                        className="flex flex-col items-center gap-3 bg-gradient-to-br from-red-600/30 to-orange-600/30 hover:from-red-500/50 hover:to-orange-500/50 border-2 border-red-400/50 text-white py-5 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                      >
                        <File className="w-10 h-10 text-red-400" />
                        <span className="text-base font-bold">PDF (Print)</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Performance Metrics Panel - Data Layer */}
                  {trackPerformance && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-400/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                          <h4 className="font-bold text-white">Performance Metrics</h4>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Data Layer</span>
                        </div>
                        <span className="text-xs text-cyan-200/50">PE Firm Ready</span>
                      </div>
                      <p className="text-xs text-cyan-200/70 mb-4">
                        Track these KPIs to demonstrate ROI to investors and optimize energy efficiency.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Energy per Car */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-cyan-200/70">Energy per Car</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {(calculatedPower.dailyKWh / carsPerDay).toFixed(2)} kWh
                          </p>
                          <p className="text-[10px] text-cyan-200/50">Benchmark: 0.5-0.8 kWh</p>
                        </div>
                        {/* Peak Reduction */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-cyan-200/70">Peak Reduction</p>
                          <p className="text-xl font-bold text-purple-400">
                            {energyGoals.targetSavingsPercent}%
                          </p>
                          <p className="text-[10px] text-cyan-200/50">Benchmark: 30-40%</p>
                        </div>
                        {/* Monthly Savings */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-cyan-200/70">Monthly Savings</p>
                          <p className="text-xl font-bold text-amber-400">
                            ${Math.round(quoteResult.financials.annualSavings / 12).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-cyan-200/50">From BESS optimization</p>
                        </div>
                        {/* Equipment Utilization */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-cyan-200/70">Est. Utilization</p>
                          <p className="text-xl font-bold text-cyan-400">
                            {Math.round((operations.hoursPerDay * operations.daysPerWeek / 168) * 100 * 0.7)}%
                          </p>
                          <p className="text-[10px] text-cyan-200/50">Benchmark: 55-70%</p>
                        </div>
                        {/* Throughput */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-cyan-200/70">Daily Throughput</p>
                          <p className="text-xl font-bold text-emerald-400">
                            {carsPerDay} cars
                          </p>
                          <p className="text-[10px] text-cyan-200/50">{Math.round(carsPerDay / numberOfBays)} cars/bay</p>
                        </div>
                        {/* Water Recovery */}
                        {equipment.hasWaterReclaim && (
                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-cyan-200/70">Water Recovery</p>
                            <p className="text-xl font-bold text-blue-400">~70%</p>
                            <p className="text-[10px] text-cyan-200/50">Reclaim system active</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 text-xs text-cyan-200/50 flex items-center justify-between">
                        <span>📊 Data = Energy efficiency = Better returns</span>
                        {conciergeTier === 'pro' && (
                          <span className="text-amber-400">👔 Quarterly reviews included with Pro</span>
                        )}
                      </div>
                    </div>
                  )}
                  
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
        
        {/* Footer Navigation - Back only (Continue is inline in each step) */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep === 0 ? onClose() : setCurrentStep(currentStep - 1)}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {/* Step indicator */}
          <span className="text-sm text-cyan-300/60">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </span>
        </div>
      </div>
      
      {/* Power Gauge Widget - Moved to header area, rendered inline */}
    </div>
  );
}
