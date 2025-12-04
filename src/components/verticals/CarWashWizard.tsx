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
  FileText, FileSpreadsheet, File, Building, BarChart3
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { useCarWashLimits, type CarWashUILimits } from '@/services/uiConfigService';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';

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
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
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
  
  // Performance Metrics (data layer)
  const [trackPerformance, setTrackPerformance] = useState(true);
  
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
  
  // Calculate power based on equipment selections
  useEffect(() => {
    const calc = calculateEquipmentPower();
    setCalculatedPower(calc);
  }, [equipment, operations, washType, automationLevel, initialInputs]);
  
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
    
    // Automation Systems (based on level)
    const autoLevel = AUTOMATION_LEVELS[automationLevel];
    peakKW += autoLevel.additionalKW;
    
    // Apply automation efficiency multiplier
    peakKW *= autoLevel.powerMultiplier;
    
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
      
      // Only include solar when user explicitly selects solar-related goals
      // The solar slider is only visible/adjustable when primaryGoal is 'solar-storage', 'solar-generator', or 'all'
      const includeSolar = energyGoals.primaryGoal === 'solar-storage' || 
        energyGoals.primaryGoal === 'solar-generator' || 
        energyGoals.primaryGoal === 'all';
      const solarMW = includeSolar ? (energyGoals.solarRoofArea * 0.015 / 1000) : 0; // ~15W/sqft
      
      console.log('🌞 Solar calculation:', {
        primaryGoal: energyGoals.primaryGoal,
        includeSolar,
        solarRoofArea: energyGoals.solarRoofArea,
        solarMW,
        solarKW: solarMW * 1000,
      });
      
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
      
      console.log('⚡ Generator calculation:', {
        primaryGoal: energyGoals.primaryGoal,
        includeGenerator,
        generatorSizeKW: energyGoals.generatorSizeKW,
        generatorMW,
        generatorKW: generatorMW * 1000,
      });
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: mergedInputs.state,
        electricityRate: stateData.rate,
        useCase: 'car-wash',
        solarMW,
        generatorMW,
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
        <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Step 0: Brand & Wash Type Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Concierge Tier Selection */}
              <div className="bg-gradient-to-r from-purple-500/10 to-amber-500/10 rounded-xl p-4 border border-purple-400/20">
                <h4 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Choose Your Experience
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(CONCIERGE_TIERS).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setConciergeTier(key as keyof typeof CONCIERGE_TIERS)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        conciergeTier === key 
                          ? key === 'pro' ? 'border-amber-500 bg-amber-500/20' : 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute top-2 right-2 text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{tier.icon}</span>
                        <div>
                          <p className="font-bold text-white">{tier.name}</p>
                          <p className="text-xs text-cyan-200/70">{tier.description}</p>
                        </div>
                      </div>
                      <ul className="space-y-1 mt-3">
                        {tier.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="text-xs text-cyan-200/60 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" /> {feature}
                          </li>
                        ))}
                        {tier.features.length > 4 && (
                          <li className="text-xs text-purple-300">+ {tier.features.length - 4} more features</li>
                        )}
                      </ul>
                      <p className="text-sm font-bold text-white mt-3">{tier.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Role Selection */}
              <div className="mb-6">
                <h4 className="text-md font-bold text-white mb-3">I am a...</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'owner', icon: '🏢', name: 'Owner/Operator', desc: 'I own or operate a car wash' },
                    { key: 'investor', icon: '💼', name: 'Investor / PE', desc: 'Evaluating investments' },
                    { key: 'developer', icon: '🏗️', name: 'Site Developer', desc: 'Planning new locations' },
                    { key: 'explorer', icon: '🔍', name: 'Just Exploring', desc: 'Curious about the numbers' },
                  ].map((role) => (
                    <button
                      key={role.key}
                      onClick={() => setUserRole(role.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        userRole === role.key 
                          ? 'border-cyan-500 bg-cyan-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{role.icon}</span>
                      <p className="font-bold text-white text-sm mt-1">{role.name}</p>
                      <p className="text-xs text-cyan-200/60">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Selection with Autocomplete */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Car Wash Brand</h3>
                <p className="text-cyan-200/70 text-sm mb-3">
                  Start typing to search 20+ brands, or continue with "Independent Car Wash"
                </p>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={brandSearchQuery}
                    onChange={(e) => setBrandSearchQuery(e.target.value)}
                    placeholder="🔍 Search brands (e.g., Mister, Tommy's, Zips...)"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 text-white border border-white/20 focus:border-cyan-400/50 focus:outline-none placeholder-white/40"
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
                      {Object.entries(CAR_WASH_BRANDS)
                        .filter(([key, brand]) => 
                          key !== 'independent' && 
                          (brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                           brand.description?.toLowerCase().includes(brandSearchQuery.toLowerCase()))
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
                      {Object.entries(CAR_WASH_BRANDS)
                        .filter(([key, brand]) => 
                          key !== 'independent' && 
                          (brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
                           brand.description?.toLowerCase().includes(brandSearchQuery.toLowerCase()))
                        ).length === 0 && (
                          <div className="p-3 text-center text-cyan-200/60 text-sm">
                            No brands found. Try "Independent Car Wash" below.
                          </div>
                        )}
                    </div>
                  )}
                </div>
                
                {/* Quick Selection Buttons */}
                <div className="grid md:grid-cols-2 gap-3">
                  {/* Independent Car Wash - Primary Default */}
                  <button
                    onClick={() => setSelectedBrand('independent')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedBrand === 'independent' 
                        ? 'border-emerald-500 bg-emerald-500/20' 
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏢</span>
                      <div>
                        <p className="font-bold text-white">Independent Car Wash</p>
                        <p className="text-xs text-cyan-200/70">Single location or regional chain</p>
                        <p className="text-xs text-emerald-400 mt-1">✓ Configure your own equipment</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Show Selected Brand if not independent */}
                  {selectedBrand !== 'independent' ? (
                    <button
                      onClick={() => setSelectedBrand(selectedBrand)}
                      className="p-4 rounded-xl border-2 border-purple-500 bg-purple-500/20 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{CAR_WASH_BRANDS[selectedBrand].logo}</span>
                        <div>
                          <p className="font-bold text-white">{CAR_WASH_BRANDS[selectedBrand].name}</p>
                          <p className="text-xs text-cyan-200/70">{CAR_WASH_BRANDS[selectedBrand].siteCount}+ locations</p>
                          <p className="text-xs text-purple-300 mt-1">
                            Typical: {CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.min}-{CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.max} kW peak
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    /* Popular Brands Quick Pick */
                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <p className="text-xs text-cyan-200/60 mb-2">🏆 Popular brands:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(CAR_WASH_BRANDS)
                          .filter(([_, brand]) => brand.rank && brand.rank <= 5)
                          .sort((a, b) => (a[1].rank || 99) - (b[1].rank || 99))
                          .map(([key, brand]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedBrand(key as keyof typeof CAR_WASH_BRANDS)}
                              className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full text-white/80 transition-all"
                            >
                              {brand.logo} {brand.name.split(' ')[0]}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Brand Submission Form (for independent) */}
              {selectedBrand === 'independent' && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-400/30">
                  <h4 className="text-md font-bold text-white mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5 text-emerald-400" />
                    Your Car Wash Details (Optional)
                  </h4>
                  <p className="text-xs text-cyan-200/70 mb-4">Help us improve recommendations for independent operators.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-cyan-200 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={brandSubmission.brandName}
                        onChange={(e) => setBrandSubmission({...brandSubmission, brandName: e.target.value})}
                        placeholder="Your Car Wash Name"
                        className="w-full bg-white/10 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cyan-200 mb-1">Number of Sites</label>
                      <input
                        type="number"
                        min={1}
                        value={brandSubmission.numberOfSites}
                        onChange={(e) => setBrandSubmission({...brandSubmission, numberOfSites: parseInt(e.target.value) || 1})}
                        className="w-full bg-white/10 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cyan-200 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={brandSubmission.zipCode}
                        onChange={(e) => setBrandSubmission({...brandSubmission, zipCode: e.target.value})}
                        placeholder="12345"
                        className="w-full bg-white/10 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cyan-200 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={brandSubmission.contactEmail}
                        onChange={(e) => setBrandSubmission({...brandSubmission, contactEmail: e.target.value})}
                        placeholder="you@example.com"
                        className="w-full bg-white/10 rounded-lg px-3 py-2 text-white text-sm border border-white/10 focus:border-emerald-400/50"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Brand Info Banner (for branded selections) */}
              {selectedBrand !== 'independent' && (
                <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-200">Selected Brand #{CAR_WASH_BRANDS[selectedBrand].rank}</p>
                      <p className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">{CAR_WASH_BRANDS[selectedBrand].logo}</span>
                        {CAR_WASH_BRANDS[selectedBrand].name}
                      </p>
                      <p className="text-xs text-cyan-200/70 mt-1">
                        {CAR_WASH_BRANDS[selectedBrand].headquarters} • {CAR_WASH_BRANDS[selectedBrand].siteCount}+ locations
                      </p>
                      <p className="text-xs text-cyan-200/60 mt-1">{CAR_WASH_BRANDS[selectedBrand].notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-cyan-200">Typical Peak Demand</p>
                      <p className="text-xl font-bold text-cyan-400">
                        {CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.min}-{CAR_WASH_BRANDS[selectedBrand].peakDemandKW?.max} kW
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Wash Type Selection */}
              <div>
                <h4 className="text-md font-bold text-white mb-2">Wash Type</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(WASH_TYPES).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setWashType(key as keyof typeof WASH_TYPES)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        washType === key 
                          ? 'border-cyan-500 bg-cyan-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <p className="font-bold text-white text-sm">{type.name}</p>
                      <p className="text-xs text-cyan-200/70">{type.description}</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-emerald-400">{type.carsPerHour} cars/hr</span>
                        <span className="text-purple-400">{type.peakDemandKW.min}-{type.peakDemandKW.max} kW</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Automation Level */}
              <div>
                <h4 className="text-md font-bold text-white mb-2">Automation Level</h4>
                <p className="text-xs text-cyan-200/70 mb-3">What generation of automation does your equipment use?</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(AUTOMATION_LEVELS).map(([key, level]) => (
                    <button
                      key={key}
                      onClick={() => setAutomationLevel(key as keyof typeof AUTOMATION_LEVELS)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        automationLevel === key 
                          ? 'border-amber-500 bg-amber-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <p className="font-bold text-white text-sm">{level.name}</p>
                      <p className="text-xs text-cyan-200/70 mt-1">{level.description}</p>
                      <p className="text-xs text-amber-400 mt-1">+{level.additionalKW} kW controls</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bays OR Tunnel Length - Context-Specific */}
              <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/20">
                {/* For Self-Service and In-Bay: Show NUMBER OF BAYS */}
                {(washType === 'self-service' || washType === 'in-bay-automatic') && (
                  <>
                    <label className="block text-sm text-cyan-200 mb-2">
                      Number of {washType === 'self-service' ? 'Self-Service' : 'In-Bay'} Wash Bays
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-white">{numberOfBays}</span>
                      <span className="text-cyan-300 text-lg">bays</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={washType === 'self-service' ? 20 : 8}
                      step={1}
                      value={numberOfBays}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        console.log('🔧 Bays slider changed:', newValue);
                        setNumberOfBays(newValue);
                      }}
                      className="w-full accent-cyan-500 mt-3"
                    />
                    <div className="flex justify-between text-xs text-cyan-300/50 mt-1">
                      <span>1 bay</span>
                      <span>{washType === 'self-service' ? '20' : '8'} bays</span>
                    </div>
                    <p className="text-xs text-cyan-200/60 mt-2">
                      💡 Peak demand: ~{WASH_TYPES[washType].peakDemandKW.min * numberOfBays}-{WASH_TYPES[washType].peakDemandKW.max * numberOfBays} kW total
                    </p>
                  </>
                )}
                
                {/* For Tunnel Types: Show TUNNEL LENGTH */}
                {(washType === 'express-exterior' || washType === 'full-service') && (
                  <>
                    <label className="block text-sm text-cyan-200 mb-2">
                      Tunnel Length ({washType === 'express-exterior' ? 'Express Exterior' : 'Full-Service'})
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-white">{tunnelLength}</span>
                      <span className="text-purple-300 text-lg">feet</span>
                    </div>
                    <input
                      type="range"
                      min={limits?.tunnelLength?.min ?? 60}
                      max={limits?.tunnelLength?.max ?? 300}
                      step={limits?.tunnelLength?.step ?? 10}
                      value={tunnelLength}
                      onChange={(e) => setTunnelLength(parseInt(e.target.value))}
                      className="w-full accent-purple-500 mt-3"
                    />
                    <div className="flex justify-between text-xs text-purple-300/50 mt-1">
                      <span>{limits?.tunnelLength?.min ?? 60} ft (small)</span>
                      <span>{limits?.tunnelLength?.max ?? 300} ft (large)</span>
                    </div>
                    <p className="text-xs text-cyan-200/60 mt-2">
                      💡 Typical throughput: {WASH_TYPES[washType].carsPerHour} cars/hour • Peak demand: {WASH_TYPES[washType].peakDemandKW.min}-{WASH_TYPES[washType].peakDemandKW.max} kW
                    </p>
                  </>
                )}
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
              
              {/* Automation Level Power Impact Note */}
              {automationLevel && automationLevel !== 'standard' && (
                <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-400/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-300 font-medium">
                      {AUTOMATION_LEVELS[automationLevel].name} Automation
                    </span>
                    <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">
                      {AUTOMATION_LEVELS[automationLevel].powerMultiplier > 1 ? '+' : ''}
                      {((AUTOMATION_LEVELS[automationLevel].powerMultiplier - 1) * 100).toFixed(0)}% power
                    </span>
                  </div>
                  <p className="text-xs text-cyan-200/70 mt-2">
                    {AUTOMATION_LEVELS[automationLevel].description}
                  </p>
                </div>
              )}
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
                      { id: 'solar-generator', label: 'Solar + Nat Gas Generator', desc: 'Solar + backup generator for extended outages', icon: Zap },
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
                
                {(energyGoals.primaryGoal === 'solar-storage' || energyGoals.primaryGoal === 'solar-generator' || energyGoals.primaryGoal === 'all') && (
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
                
                {/* Natural Gas Generator Options */}
                {(energyGoals.primaryGoal === 'backup-power' || energyGoals.primaryGoal === 'solar-generator' || energyGoals.primaryGoal === 'all') && (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-red-400" />
                      <h4 className="font-bold text-red-300">Natural Gas Generator</h4>
                      <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded text-red-300">Extended Backup</span>
                    </div>
                    <p className="text-xs text-cyan-200/70 mb-3">
                      A natural gas generator provides backup power during extended outages beyond battery capacity. 
                      Automatically sized based on your peak demand.
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={energyGoals.includeGenerator}
                          onChange={(e) => setEnergyGoals({
                            ...energyGoals, 
                            includeGenerator: e.target.checked,
                            generatorSizeKW: e.target.checked ? Math.round(calculatedPower.peakDemandKW * 0.8) : 0
                          })}
                          className="accent-red-500"
                        />
                        <span className="text-white text-sm">Include Natural Gas Generator</span>
                      </label>
                      
                      {energyGoals.includeGenerator && (
                        <div>
                          <label className="block text-sm text-red-200 mb-2">
                            Generator Size: <span className="text-red-400 font-bold">{energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)} kW</span>
                          </label>
                          <input
                            type="range"
                            min={Math.round(calculatedPower.peakDemandKW * 0.5)}
                            max={Math.round(calculatedPower.peakDemandKW * 1.2)}
                            step={10}
                            value={energyGoals.generatorSizeKW || Math.round(calculatedPower.peakDemandKW * 0.8)}
                            onChange={(e) => setEnergyGoals({...energyGoals, generatorSizeKW: parseInt(e.target.value)})}
                            className="w-full accent-red-500"
                          />
                          <div className="flex justify-between text-xs text-red-200/50">
                            <span>50% peak ({Math.round(calculatedPower.peakDemandKW * 0.5)} kW)</span>
                            <span>120% peak ({Math.round(calculatedPower.peakDemandKW * 1.2)} kW)</span>
                          </div>
                          <p className="text-xs text-cyan-200/50 mt-2">
                            Recommended: 80% of peak demand ({Math.round(calculatedPower.peakDemandKW * 0.8)} kW) provides backup for all critical loads
                          </p>
                        </div>
                      )}
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
