/**
 * EV CHARGING HUB WIZARD - For Dedicated Charging Station Operators
 * ==================================================================
 * 
 * THIS WIZARD IS FOR: Businesses whose PRIMARY purpose is EV charging
 *   ✅ Highway charging stations
 *   ✅ Urban charging hubs
 *   ✅ Destination charging lots
 *   ✅ Fleet depots
 *   ✅ Retail co-located stations
 *   ✅ Investors / PE firms evaluating EV charging
 * 
 * THIS WIZARD IS NOT FOR: Businesses adding EV charging as an AMENITY
 *   ❌ Hotels with guest chargers → Use HotelWizard
 *   ❌ Hospitals with patient/staff chargers → Use HospitalWizard
 *   ❌ Offices with employee chargers → Use OfficeWizard
 *   ❌ Car washes adding chargers → Use CarWashWizard
 * 
 * Architecture (Dec 2025 Refactor):
 * - Station Types: highway, urban, destination, fleet, retail
 * - User Roles: operator, investor, developer, explorer
 * - Auto-calculates optimal BESS + solar sizing for each station type
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 * - evChargingCalculations.ts for charger specs (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Gauge, DollarSign, Calendar, Download, CheckCircle, AlertCircle, 
  Sparkles, Car, TrendingDown, Phone, FileText, FileSpreadsheet, File, Bolt,
  BarChart3, Network, Building, Globe, Hotel, Hospital, GraduationCap, 
  Plane, ShoppingBag, Warehouse, Coffee, Settings, ChevronDown, ChevronUp,
  Users, ParkingCircle, Clock, Leaf, Trophy, Shield, HelpCircle, Target, Lightbulb
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { PowerGaugeWidget } from '@/components/wizard/widgets';
import { 
  EV_CHARGER_SPECS, 
  GRID_SERVICES, 
  V2G_CONFIG, 
  PROSUMER_MODES,
  calculateEVHubPower,
  calculateEVHubCosts,
  calculateEVHubBESSSize,
  calculateGridServicesRevenue,
  calculateV2GPotential,
  type EVChargerConfig,
} from '@/services/evChargingCalculations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';
import { quickCO2Estimate, calculateEVChargingCO2Impact } from '@/services/environmentalMetricsService';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';
import { WizardPowerProfile, WizardStepHelp, type StepHelpContent } from '@/components/wizard/shared';

// ============================================
// CONCIERGE SERVICE TIERS
// ============================================

const CONCIERGE_TIERS = {
  standard: {
    name: 'Quick Quote',
    description: 'Self-service quote builder',
    icon: '⚡',
    features: ['Instant recommendations', 'Download quote', 'Basic support'],
    color: 'emerald',
  },
  pro: {
    name: 'Concierge Pro',
    description: 'White-glove service with dedicated expert',
    icon: '👑',
    features: ['Dedicated energy advisor', 'Custom financing options', 'Site assessment', 'Priority installation', 'Extended warranty'],
    color: 'amber',
    badge: 'Premium',
  },
} as const;

// ============================================
// EV CHARGING STATION TYPES - FOR DEDICATED OPERATORS
// ============================================
// This wizard is for businesses whose PRIMARY purpose is EV charging
// NOT for hotels/hospitals/offices that want to ADD EV charging as an amenity

const STATION_TYPES = {
  highway: {
    name: 'Highway / Travel Corridor',
    icon: Car,
    description: 'Fast charging for road trippers',
    examples: 'I-95 corridor, rest stops, truck stops',
    defaultChargers: { level1: 0, level2: 4, dcfc: 8, hpc: 4 },
    avgDwellTime: '15-45 minutes',
    recommendation: 'Focus on DCFC & HPC - drivers want to charge fast and go!',
    gridServicesNote: 'High peak demand = big savings with BESS',
    peakDemandProfile: 'high',
    stepExplanation: 'Highway stations need high-power chargers. Drivers stop briefly, so DCFC (50-150 kW) and HPC (250-350 kW) are essential for fast turnarounds.',
  },
  urban: {
    name: 'Urban Charging Hub',
    icon: Building,
    description: 'City center fast charging',
    examples: 'Downtown parking, city lots, public stations',
    defaultChargers: { level1: 0, level2: 8, dcfc: 12, hpc: 0 },
    avgDwellTime: '30-90 minutes',
    recommendation: 'Mix of DCFC for quick stops + Level 2 for longer visits',
    gridServicesNote: 'Prime location for grid services revenue',
    peakDemandProfile: 'medium',
    stepExplanation: 'Urban hubs serve varied needs - quick top-ups during errands (DCFC) and longer charges while dining/shopping (Level 2).',
  },
  destination: {
    name: 'Destination Charging',
    icon: ParkingCircle,
    description: 'Where EVs park for hours',
    examples: 'Parking garages, park & ride, long-term lots',
    defaultChargers: { level1: 8, level2: 20, dcfc: 4, hpc: 0 },
    avgDwellTime: '2-8 hours',
    recommendation: 'Heavy on Level 1 & 2 - customers have time to charge',
    gridServicesNote: 'Great for demand response programs',
    peakDemandProfile: 'low',
    stepExplanation: 'Destination charging is about convenience, not speed. Level 1 (1.9 kW) for all-day parking, Level 2 (7-22 kW) for 2-4 hour visits.',
  },
  fleet: {
    name: 'Fleet Depot',
    icon: Warehouse,
    description: 'Commercial fleet charging',
    examples: 'Delivery hubs, bus depots, taxi/rideshare lots',
    defaultChargers: { level1: 0, level2: 16, dcfc: 8, hpc: 0 },
    avgDwellTime: 'Overnight + quick top-ups',
    recommendation: 'Level 2 for overnight, DCFC for midday top-ups',
    gridServicesNote: 'V2G potential with predictable schedules',
    peakDemandProfile: 'scheduled',
    stepExplanation: 'Fleet depots charge overnight with Level 2 (cheapest power) and use DCFC for midday opportunity charging between routes.',
  },
  retail: {
    name: 'Retail Co-Location',
    icon: ShoppingBag,
    description: 'Standalone station near retail',
    examples: 'Standalone lots near malls, big box stores',
    defaultChargers: { level1: 0, level2: 4, dcfc: 8, hpc: 2 },
    avgDwellTime: '20-60 minutes',
    recommendation: 'Fast chargers to match shopping duration',
    gridServicesNote: 'Revenue from charging + grid services',
    peakDemandProfile: 'medium',
    stepExplanation: 'Retail stations match shopping time - most visits are 20-60 minutes, ideal for DCFC. A few HPC for premium "grab and go" service.',
  },
} as const;

// Power Profile explanation helper
const POWER_PROFILE_EXPLANATIONS = {
  level1: {
    name: 'Level 1',
    power: '1.9 kW',
    icon: '🔌',
    description: 'Standard 120V outlet - overnight charging',
    bestFor: 'All-day parking: airports, park & ride, workplaces',
    chargeTime: '~5 miles/hour of charging',
    costPerUnit: '$1,500-2,500',
  },
  level2: {
    name: 'Level 2',
    power: '7-22 kW',
    icon: '⚡',
    description: '240V AC charging - standard public charger',
    bestFor: 'Destination charging: hotels, restaurants, parking',
    chargeTime: '~25-30 miles/hour of charging',
    costPerUnit: '$6,000-12,000',
  },
  dcfc: {
    name: 'DC Fast Charging',
    power: '50-150 kW',
    icon: '🔋',
    description: 'DC power direct to battery - rapid charging',
    bestFor: 'Quick stops: gas stations, highway, retail',
    chargeTime: '~150-200 miles in 30 min',
    costPerUnit: '$50,000-100,000',
  },
  hpc: {
    name: 'High Power Charging',
    power: '250-350 kW',
    icon: '⚡⚡',
    description: 'Ultra-fast DC - premium highway charging',
    bestFor: 'Highway corridors, fleet fast-turnaround',
    chargeTime: '~200+ miles in 15 min',
    costPerUnit: '$150,000-250,000',
  },
};

// User roles - Who is using this wizard?
const USER_ROLES = {
  operator: {
    name: 'Station Operator',
    icon: '⚡',
    description: 'I own/operate EV charging stations',
    helpText: 'Get detailed equipment and ROI analysis',
  },
  investor: {
    name: 'Investor / PE Firm',
    icon: '💼',
    description: 'Evaluating EV charging investments',
    helpText: 'Explore various configurations and returns',
  },
  developer: {
    name: 'Site Developer',
    icon: '🏗️',
    description: 'Planning new charging locations',
    helpText: 'Site planning with infrastructure costs',
  },
  explorer: {
    name: 'Just Exploring',
    icon: '🔍',
    description: 'Curious about the numbers',
    helpText: 'See what EV charging economics look like',
  },
} as const;

// Scale options in plain language
const SCALE_OPTIONS = {
  starter: {
    name: 'Getting Started',
    description: '2-4 chargers',
    parkingSpots: '< 50 spots',
    multiplier: 0.5,
    icon: '🌱',
  },
  growing: {
    name: 'Growing',
    description: '5-10 chargers', 
    parkingSpots: '50-200 spots',
    multiplier: 1.0,
    icon: '🌿',
  },
  established: {
    name: 'Established',
    description: '11-20 chargers',
    parkingSpots: '200-500 spots',
    multiplier: 2.0,
    icon: '🌳',
  },
  enterprise: {
    name: 'Enterprise',
    description: '20+ chargers',
    parkingSpots: '500+ spots',
    multiplier: 3.0,
    icon: '🏢',
  },
} as const;

// ============================================
// TYPES
// ============================================

export interface EVChargingWizardInputs {
  level2Ports: number;
  dcfcPorts: number;
  hpcPorts: number;
  state: string;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
}

interface EVChargingWizardProps {
  onClose: () => void;
  initialInputs?: Partial<EVChargingWizardInputs>;
  onComplete?: (quoteData: any) => void;
  onRequestConsultation?: () => void;
}

// ============================================
// STATION TYPES (Use Cases)
// ============================================

const CHARGER_TYPES = {
  'retail': { name: 'Retail / Shopping Center', dcfcSize: 150, hpcSize: 0, utilizationTarget: 35, icon: '🛒' },
  'highway': { name: 'Highway Travel Center', dcfcSize: 150, hpcSize: 350, utilizationTarget: 45, icon: '🛣️' },
  'fleet': { name: 'Fleet Depot', dcfcSize: 50, hpcSize: 0, utilizationTarget: 60, icon: '🚚' },
  'workplace': { name: 'Workplace / Office', dcfcSize: 0, hpcSize: 0, utilizationTarget: 40, icon: '🏢' },
  'hospitality': { name: 'Hotel / Hospitality', dcfcSize: 50, hpcSize: 0, utilizationTarget: 25, icon: '🏨' },
  'multifamily': { name: 'Multifamily / Residential', dcfcSize: 0, hpcSize: 0, utilizationTarget: 50, icon: '🏠' },
  'municipal': { name: 'Municipal / Public', dcfcSize: 150, hpcSize: 0, utilizationTarget: 30, icon: '🏛️' },
};

const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.22, demandCharge: 28 },
  'Texas': { rate: 0.12, demandCharge: 18 },
  'Florida': { rate: 0.14, demandCharge: 15 },
  'New York': { rate: 0.20, demandCharge: 25 },
  'Arizona': { rate: 0.13, demandCharge: 20 },
  'Nevada': { rate: 0.11, demandCharge: 18 },
  'Colorado': { rate: 0.12, demandCharge: 16 },
  'Washington': { rate: 0.10, demandCharge: 12 },
  'Oregon': { rate: 0.11, demandCharge: 14 },
  'Georgia': { rate: 0.12, demandCharge: 16 },
  'Other': { rate: 0.14, demandCharge: 18 },
};

// ============================================
// WIZARD STEPS - Simple & Clear
// ============================================

const WIZARD_STEPS = [
  { id: 'who', title: 'Who You Are', icon: Users },
  { id: 'what', title: 'Your Station', icon: Car },
  { id: 'how', title: 'Operations', icon: Clock },
  { id: 'goals', title: 'Your Goals', icon: Target },
  { id: 'quote', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// STEP HELP CONTENT - EV Charging Specific
// ============================================

const EV_CHARGING_STEP_HELP: Record<string, StepHelpContent> = {
  'who': {
    stepId: 'who',
    title: 'Tell Us About You',
    description: 'Your role and goals help us tailor recommendations to your specific needs.',
    tips: [
      { type: 'tip', text: 'Operators get detailed operational metrics. Investors see ROI-focused analysis.' },
      { type: 'info', text: 'Station type affects charger mix recommendations and BESS sizing.' },
    ],
  },
  'what': {
    stepId: 'what',
    title: 'Configure Your Station',
    description: 'Choose your charger types and quantities. Mix charger power levels based on expected dwell times.',
    tips: [
      { type: 'warning', text: 'NO "Level 3" - the industry uses DCFC (50-150 kW) and HPC (250-350 kW).' },
      { type: 'tip', text: 'Level 2 (7-22 kW) for destination/workplace. DCFC/HPC for highway/quick stops.' },
      { type: 'info', text: 'BESS helps manage peak demand and can provide grid services revenue.' },
    ],
    links: [
      { label: 'EV Charger Types Explained', url: '/docs/ev-charger-types' },
    ],
  },
  'how': {
    stepId: 'how',
    title: 'Operating Model',
    description: 'Your operating hours and expected utilization affect energy costs and BESS sizing.',
    tips: [
      { type: 'tip', text: '24/7 highway stations have different profiles than 9-5 workplace chargers.' },
      { type: 'info', text: 'Higher utilization = more revenue but also higher demand charges.' },
    ],
  },
  'goals': {
    stepId: 'goals',
    title: 'Your Business Goals',
    description: 'What matters most to you? This shapes our recommendations for BESS and solar.',
    tips: [
      { type: 'tip', text: 'Demand charge management often provides the fastest ROI for EV charging.' },
      { type: 'success', text: 'Grid services (frequency regulation, demand response) can generate $5-15K/MW annually.' },
    ],
    links: [
      { label: 'Grid Services Revenue Guide', url: '/docs/grid-services' },
      { label: 'V2G Explained', url: '/docs/v2g' },
    ],
  },
  'quote': {
    stepId: 'quote',
    title: 'Your Custom Quote',
    description: 'Review your EV charging hub quote with BESS, solar, and financial projections.',
    tips: [
      { type: 'success', text: '30% Federal ITC applies to battery storage - significantly improves ROI.' },
      { type: 'tip', text: 'Download and share with investors, partners, or financing providers.' },
    ],
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EVChargingWizard({ 
  onClose, 
  initialInputs = {}, 
  onComplete,
  onRequestConsultation 
}: EVChargingWizardProps) {
  const mergedInputs = {
    level2Ports: initialInputs.level2Ports ?? 4,
    dcfcPorts: initialInputs.dcfcPorts ?? 4,
    hpcPorts: initialInputs.hpcPorts ?? 0,
    state: initialInputs.state ?? 'California',
    businessName: initialInputs.businessName ?? '',
    ownerName: initialInputs.ownerName ?? '',
    email: initialInputs.email ?? '',
    phone: initialInputs.phone ?? '',
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Concierge Tier Selection
  const [conciergeTier, setConciergeTier] = useState<keyof typeof CONCIERGE_TIERS>('standard');
  
  // User Role Selection
  const [userRole, setUserRole] = useState<keyof typeof USER_ROLES>('operator');
  
  // Step 1: Station Type (for dedicated EV charging operators)
  const [stationType, setStationType] = useState<keyof typeof STATION_TYPES>('urban');
  const [businessName, setBusinessName] = useState(mergedInputs.businessName);
  
  // Step 2: Scale & Location (Simple!)
  const [scale, setScale] = useState<keyof typeof SCALE_OPTIONS>('growing');
  const [state, setState] = useState(mergedInputs.state);
  
  // Step 3: Smart Recommendation (Auto-calculated, with optional customize)
  const [wantsBatteryStorage, setWantsBatteryStorage] = useState(true);
  const [wantsSolarCanopy, setWantsSolarCanopy] = useState(true);
  const [wantsGridServices, setWantsGridServices] = useState(false); // Default off - it's advanced
  const [wantsPowerGenerator, setWantsPowerGenerator] = useState(false); // Backup power generator
  
  // Charger configuration - user can always adjust via sliders
  const [customChargers, setCustomChargers] = useState({
    level1: 0,
    level2: 0,
    dcfc: 0,
    hpc: 0,
  });
  
  // Initialize customChargers when station type or scale changes
  useEffect(() => {
    const station = STATION_TYPES[stationType];
    const scaleConfig = SCALE_OPTIONS[scale];
    setCustomChargers({
      level1: Math.round(station.defaultChargers.level1 * scaleConfig.multiplier),
      level2: Math.max(2, Math.round(station.defaultChargers.level2 * scaleConfig.multiplier)),
      dcfc: Math.round(station.defaultChargers.dcfc * scaleConfig.multiplier),
      hpc: Math.round(station.defaultChargers.hpc * scaleConfig.multiplier),
    });
  }, [stationType, scale]);
  
  // ============================================
  // SMART RECOMMENDATION ENGINE
  // ============================================
  
  // Auto-calculate recommended setup based on station type and scale
  const getSmartRecommendation = () => {
    const station = STATION_TYPES[stationType];
    const scaleConfig = SCALE_OPTIONS[scale];
    
    // Calculate charger counts based on station defaults * scale multiplier
    const level1Count = Math.round(station.defaultChargers.level1 * scaleConfig.multiplier);
    const level2Count = Math.round(station.defaultChargers.level2 * scaleConfig.multiplier);
    const dcfcCount = Math.round(station.defaultChargers.dcfc * scaleConfig.multiplier);
    const hpcCount = Math.round(station.defaultChargers.hpc * scaleConfig.multiplier);
    
    // Use customChargers directly - they're always initialized and updated by sliders
    const finalLevel1 = customChargers.level1 || level1Count;
    const finalLevel2 = customChargers.level2 || Math.max(2, level2Count);
    const finalDCFC = customChargers.dcfc;
    const finalHPC = customChargers.hpc;
    
    // Calculate power requirements (using industry-standard values)
    const level1Power = finalLevel1 * 1.9; // Level 1 is 1.9 kW (120V/16A)
    const level2Power = finalLevel2 * 11; // Average Level 2 is 11kW
    const dcfcPower = finalDCFC * 150; // Average DCFC is 150kW
    const hpcPower = finalHPC * 350; // HPC is 350kW
    const totalPowerKW = level1Power + level2Power + dcfcPower + hpcPower;
    const peakDemandKW = Math.round(totalPowerKW * 0.7); // 70% concurrency
    
    // Get state electricity rates
    const stateData = STATE_RATES[state] || STATE_RATES['Other'];
    
    // Calculate monthly costs WITHOUT battery
    const peakHours = 12; // Typical peak window
    const dailyKWh = peakDemandKW * 0.4 * peakHours; // 40% avg utilization
    const monthlyKWh = dailyKWh * 30;
    const monthlyDemandCharges = peakDemandKW * stateData.demandCharge;
    const monthlyEnergyCharges = monthlyKWh * stateData.rate;
    const monthlyElectricityCost = monthlyDemandCharges + monthlyEnergyCharges;
    
    // ============================================
    // GOAL-BASED RECOMMENDATIONS
    // Goals directly affect BESS sizing and savings!
    // ============================================
    
    // Base BESS sizing (varies by goals)
    let bessMultiplier = 0.5; // Default: cover 50% of peak
    let solarMultiplier = 0.3; // Default: 30% of load
    let additionalSavingsMultiplier = 1.0;
    
    // Adjust based on goals
    if (wantsBatteryStorage) {
      bessMultiplier = 0.5;
      if (wantsGridServices) {
        // Grid services require larger battery for frequency regulation
        bessMultiplier = 0.7; // 70% of peak for grid services participation
        additionalSavingsMultiplier = 1.2; // +20% savings from grid services
      }
    }
    
    if (wantsSolarCanopy) {
      solarMultiplier = 0.4; // Increase solar to 40% when user wants it
      if (wantsBatteryStorage) {
        // Solar + Storage synergy - can store solar for peak shaving
        additionalSavingsMultiplier *= 1.15; // +15% from solar+storage synergy
      }
    }
    
    if (wantsPowerGenerator) {
      // Backup power affects sizing but mainly provides resilience
      bessMultiplier = Math.max(bessMultiplier, 0.4); // At least 40% for backup
    }
    
    const bessKW = wantsBatteryStorage ? Math.round(peakDemandKW * bessMultiplier) : 0;
    const bessKWh = bessKW * 2; // 2-hour duration
    
    // Solar canopy estimate (if wanted)
    const solarKW = wantsSolarCanopy ? Math.round(totalPowerKW * solarMultiplier) : 0;
    
    // Generator size for backup (if wanted)
    const generatorKW = wantsPowerGenerator ? Math.round(peakDemandKW * 0.3) : 0; // 30% of peak for backup
    
    // ============================================
    // SAVINGS CALCULATIONS (Goal-Connected!)
    // ============================================
    
    // Demand charge savings from BESS (peak shaving)
    const demandChargeSavings = wantsBatteryStorage ? monthlyDemandCharges * 0.4 * additionalSavingsMultiplier : 0;
    
    // Solar savings (energy offset)
    const solarSavings = wantsSolarCanopy ? solarKW * 150 * additionalSavingsMultiplier : 0; // ~$150/kW/year
    
    // Grid services revenue (only if enabled)
    const gridServicesSavings = wantsGridServices && wantsBatteryStorage ? bessKW * 120 : 0; // ~$120/kW/year
    
    // Total annual savings
    const annualSavings = (demandChargeSavings * 12) + solarSavings + gridServicesSavings;
    
    return {
      chargers: {
        level1: finalLevel1,
        level2: finalLevel2,
        dcfc: finalDCFC,
        hpc: finalHPC,
        totalPowerKW,
        peakDemandKW,
      },
      costs: {
        monthlyElectricity: monthlyElectricityCost,
        monthlyDemandCharges,
      },
      recommendation: {
        bessKW,
        bessKWh,
        solarKW,
        generatorKW,
      },
      savings: {
        monthly: Math.round(annualSavings / 12),
        annual: Math.round(annualSavings),
        demandChargeReduction: Math.round(demandChargeSavings * 12),
        solarOffset: Math.round(solarSavings),
        gridServices: Math.round(gridServicesSavings),
      },
      stationInsight: station.recommendation,
      gridServicesNote: station.gridServicesNote,
      dwellTime: station.avgDwellTime,
      stepExplanation: station.stepExplanation,
    };
  };
  
  const recommendation = getSmartRecommendation();
  
  // Calculated values for compatibility
  const calculatedPower = {
    totalConnectedKW: recommendation.chargers.totalPowerKW,
    peakDemandKW: recommendation.chargers.peakDemandKW,
    monthlyDemandCharges: recommendation.costs.monthlyDemandCharges,
    monthlyEnergyCharges: recommendation.costs.monthlyElectricity - recommendation.costs.monthlyDemandCharges,
  };
  
  // Generate final quote using the smart recommendation
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      const storageSizeMW = recommendation.recommendation.bessKW / 1000;
      const durationHours = 2; // 2 hours for peak shaving
      
      const stateData = STATE_RATES[state] || STATE_RATES['Other'];
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: state,
        electricityRate: stateData.rate,
        useCase: 'ev-charging',
        solarMW: wantsSolarCanopy ? (recommendation.recommendation.solarKW / 1000) : 0,
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // Trigger quote generation when reaching the final step
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      generateQuote();
    }
  }, [currentStep]);
  
  // canProceed validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Who you are
      case 1: return true; // Station type & scale
      case 2: return true; // Charger configuration
      case 3: return true; // Goals - always allow proceeding to quote
      case 4: return quoteResult !== null; // Quote loaded (final step)
      default: return true;
    }
  };
  
  // Download functions - Using professional quoteExport utilities
  
  // Build standard QuoteData from wizard state
  const buildQuoteData = () => {
    if (!quoteResult) return null;
    return {
      storageSizeMW: recommendation.recommendation.bessKW / 1000,
      durationHours: recommendation.recommendation.bessKWh / recommendation.recommendation.bessKW || 4,
      solarMW: wantsSolarCanopy ? recommendation.recommendation.solarKW / 1000 : 0,
      windMW: 0,
      generatorMW: wantsPowerGenerator ? (recommendation.chargers.peakDemandKW * 0.5) / 1000 : 0,
      location: state || 'United States',
      industryTemplate: 'ev-charging',
      gridConnection: 'grid-tied',
      totalProjectCost: quoteResult.costs.totalProjectCost,
      annualSavings: quoteResult.financials.annualSavings,
      paybackYears: quoteResult.financials.paybackYears,
      taxCredit: quoteResult.costs.taxCredit,
      netCost: quoteResult.costs.netCost,
      installationOption: 'epc',
      shippingOption: 'standard',
      financingOption: 'cash',
      // Extra EV-specific data for enhanced exports
      businessName: businessName || STATION_TYPES[stationType].name,
      stationType: STATION_TYPES[stationType].name,
      scale: SCALE_OPTIONS[scale].name,
      chargers: {
        level1: recommendation.chargers.level1 || 0,
        level2: recommendation.chargers.level2,
        dcfc: recommendation.chargers.dcfc,
        hpc: recommendation.chargers.hpc || 0,
      },
      peakDemandKW: calculatedPower.peakDemandKW,
      totalConnectedKW: calculatedPower.totalConnectedKW,
    };
  };

  // Build equipment breakdown from quote result
  const buildEquipmentBreakdown = () => {
    if (!quoteResult) return null;
    return {
      batteries: quoteResult.equipment.batteries,
      inverters: quoteResult.equipment.inverters,
      transformers: quoteResult.equipment.transformers,
      installation: quoteResult.equipment.installation,
      // Add EV-specific equipment
      evChargers: {
        level1: { count: recommendation.chargers.level1 || 0, unitCost: 500, totalCost: (recommendation.chargers.level1 || 0) * 500 },
        level2: { count: recommendation.chargers.level2, unitCost: 6000, totalCost: recommendation.chargers.level2 * 6000 },
        dcfc: { count: recommendation.chargers.dcfc, unitCost: 35000, totalCost: recommendation.chargers.dcfc * 35000 },
        hpc: { count: recommendation.chargers.hpc || 0, unitCost: 150000, totalCost: (recommendation.chargers.hpc || 0) * 150000 },
      }
    };
  };
  
  function downloadQuote() {
    const quoteData = buildQuoteData();
    const equipment = buildEquipmentBreakdown();
    if (!quoteData || !equipment) return;
    
    generatePDF(quoteData, equipment);
    onComplete?.({ inputs: mergedInputs, recommendation, calculatedPower, quoteResult });
  }

  function downloadWord() {
    const quoteData = buildQuoteData();
    const equipment = buildEquipmentBreakdown();
    if (!quoteData || !equipment) return;
    
    generateWord(quoteData, equipment);
  }

  function downloadExcel() {
    const quoteData = buildQuoteData();
    const equipment = buildEquipmentBreakdown();
    if (!quoteData || !equipment) return;
    
    generateExcel(quoteData, equipment);
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-emerald-400/40 shadow-2xl shadow-emerald-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/50 via-teal-900/30 to-emerald-900/50 px-6 py-4 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white">Build Your EV Charging Quote</h2>
                <p className="text-sm text-emerald-300/70">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
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
                        ? 'bg-emerald-500 text-white' 
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
          
          {/* Power Profile - Shows real-time power metrics */}
          {calculatedPower.peakDemandKW > 0 && (
            <WizardPowerProfile
              data={{
                peakDemandKW: calculatedPower.peakDemandKW,
                totalStorageKWh: recommendation.recommendation.bessKWh,
                durationHours: recommendation.recommendation.bessKWh / (recommendation.recommendation.bessKW || 1),
                solarKW: recommendation.recommendation.solarKW,
              }}
              compact={true}
              colorScheme="emerald"
              className="mt-4"
            />
          )}
        </div>
        
        {/* Content - User-Friendly Steps */}
        <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          
          {/* ================================================
              STEP 0: WHO ARE YOU?
              - User Role (Owner / Investor / Developer / Explorer)
              - Location (State) ← CRITICAL: Determines pricing
              - [Optional] Concierge Tier
              ================================================ */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['who']} 
                colorScheme="emerald"
              />
              
              {/* User Role Selection */}
              <div>
                <label className="block text-sm text-emerald-200 mb-3">I am a...</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <button
                      key={key}
                      onClick={() => setUserRole(key as keyof typeof USER_ROLES)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        userRole === key 
                          ? 'border-emerald-500 bg-emerald-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{role.icon}</span>
                      <p className="font-bold text-white text-sm mt-2">{role.name}</p>
                      <p className="text-xs text-emerald-200/60 mt-1">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Location Selection */}
              <div>
                <label className="block text-sm text-emerald-200 mb-2">Where is your charging station located?</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-emerald-500 focus:outline-none"
                >
                  {Object.keys(STATE_RATES).map((st) => (
                    <option key={st} value={st} className="bg-gray-800">{st}</option>
                  ))}
                </select>
                <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-400/20">
                  <p className="text-sm text-emerald-200">
                    <span className="font-medium">📍 {state}</span> electricity rates:
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-white/70">
                    <span>Energy: ${(STATE_RATES[state]?.rate || 0.14).toFixed(2)}/kWh</span>
                    <span>Demand: ${STATE_RATES[state]?.demandCharge || 18}/kW</span>
                  </div>
                </div>
              </div>
              
              {/* Concierge Tier (Optional) */}
              <div>
                <label className="block text-sm text-emerald-200 mb-3">Choose your experience</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CONCIERGE_TIERS).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setConciergeTier(key as keyof typeof CONCIERGE_TIERS)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        conciergeTier === key 
                          ? key === 'pro' 
                            ? 'border-amber-500 bg-amber-500/20' 
                            : 'border-emerald-500 bg-emerald-500/20'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      {'badge' in tier && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{tier.icon}</span>
                        <span className="font-bold text-white">{tier.name}</span>
                      </div>
                      <p className="text-xs text-emerald-200/60">{tier.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Station Name (Optional) */}
              <div>
                <label className="block text-sm text-emerald-200 mb-2">Station name (optional)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Highway 101 Charging Hub"
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 border border-white/10 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 1: WHAT DO YOU HAVE?
              - Station Type (Highway / Urban / Destination / Fleet / Retail)
              - Scale (size/charger counts)
              ================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['what']} 
                colorScheme="emerald"
              />
              
              {/* Station Type Selection */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(STATION_TYPES).map(([key, station]) => {
                  const Icon = station.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setStationType(key as keyof typeof STATION_TYPES)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        stationType === key 
                          ? 'border-emerald-500 bg-emerald-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-6 h-6 ${stationType === key ? 'text-emerald-400' : 'text-white/60'}`} />
                        <div>
                          <p className="font-bold text-white">{station.name}</p>
                          <p className="text-xs text-emerald-200/60">{station.description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{station.examples}</p>
                    </button>
                  );
                })}
              </div>
              
              {/* Scale Selection */}
              <div>
                <label className="block text-sm text-emerald-200 mb-3">How big is your station?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(SCALE_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      onClick={() => setScale(key as keyof typeof SCALE_OPTIONS)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        scale === key 
                          ? 'border-emerald-500 bg-emerald-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <p className="font-bold text-white mt-1 text-sm">{option.name}</p>
                      <p className="text-xs text-emerald-200/70">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Station Type Info */}
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-400/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{STATION_TYPES[stationType].name}</p>
                    <p className="text-sm text-emerald-200/70 mt-1">{STATION_TYPES[stationType].recommendation}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {STATION_TYPES[stationType].defaultChargers.level1 > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                          L1: {STATION_TYPES[stationType].defaultChargers.level1}
                        </span>
                      )}
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-cyan-300">
                        L2: {STATION_TYPES[stationType].defaultChargers.level2}
                      </span>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-amber-300">
                        DCFC: {STATION_TYPES[stationType].defaultChargers.dcfc}
                      </span>
                      {STATION_TYPES[stationType].defaultChargers.hpc > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-purple-300">
                          HPC: {STATION_TYPES[stationType].defaultChargers.hpc}
                        </span>
                      )}
                      <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">
                        ⏱️ {STATION_TYPES[stationType].avgDwellTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 2: HOW DO YOU OPERATE?
              - Current setup preview
              - Peak demand
              - Monthly costs
              - POWER PROFILE WIDGET (Dynamic!)
              ================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['how']} 
                colorScheme="emerald"
              />
              
              {/* ✅ STEP EXPLANATION - What user needs to do */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">📋 What to do in this step:</p>
                    <p className="text-blue-200/80 text-sm mt-1">{STATION_TYPES[stationType].stepExplanation}</p>
                    <p className="text-blue-200/60 text-xs mt-2 italic">
                      💡 Tip: Use the sliders to see how your Power Profile changes in real-time!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ============================================
                  ⚡ POWER PROFILE WIDGET - Dynamic Visualization
                  Shows user exactly what energy they need!
                  ============================================ */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border-2 border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">⚡ Your Power Profile</h4>
                    <p className="text-emerald-200/70 text-sm">Real-time energy requirements based on your configuration</p>
                  </div>
                </div>
                
                {/* Power Bars - Visual breakdown */}
                <div className="space-y-3 mb-4">
                  {/* Level 1 Power */}
                  {(customChargers.level1 > 0 || stationType === 'destination') && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16">L1</span>
                      <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (customChargers.level1 * 1.9 / recommendation.chargers.totalPowerKW) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 w-20 text-right">{(customChargers.level1 * 1.9).toFixed(1)} kW</span>
                    </div>
                  )}
                  
                  {/* Level 2 Power */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cyan-400 w-16">L2</span>
                    <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.level2 || 0) * 11 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-cyan-300 w-20 text-right">{((customChargers.level2 || 0) * 11).toLocaleString()} kW</span>
                  </div>
                  
                  {/* DCFC Power */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-amber-400 w-16">DCFC</span>
                    <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.dcfc || 0) * 150 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-amber-300 w-20 text-right">{((customChargers.dcfc || 0) * 150).toLocaleString()} kW</span>
                  </div>
                  
                  {/* HPC Power */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-purple-400 w-16">HPC</span>
                    <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.hpc || 0) * 350 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-300 w-20 text-right">{((customChargers.hpc || 0) * 350).toLocaleString()} kW</span>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">{recommendation.chargers.totalPowerKW.toLocaleString()}</p>
                    <p className="text-xs text-emerald-200/70">Total kW Connected</p>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-amber-400">{recommendation.chargers.peakDemandKW.toLocaleString()}</p>
                    <p className="text-xs text-amber-200/70">Peak Demand (70%)</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">${recommendation.costs.monthlyDemandCharges.toLocaleString()}</p>
                    <p className="text-xs text-red-200/70">Monthly Demand $</p>
                  </div>
                </div>
                
                {/* What this means */}
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-white/70">
                    <span className="font-bold text-emerald-400">📊 What this means:</span> Your {(customChargers.level1 || 0) + (customChargers.level2 || 0) + (customChargers.dcfc || 0) + (customChargers.hpc || 0)} chargers will draw up to {recommendation.chargers.peakDemandKW.toLocaleString()} kW during peak times. 
                    Without battery storage, you'll pay <span className="text-red-400 font-bold">${recommendation.costs.monthlyDemandCharges.toLocaleString()}/month</span> in demand charges alone!
                  </p>
                </div>
              </div>
              
              {/* Interactive Charger Configuration with Sliders */}
              <div className="space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Configure Charger Counts
                </h4>
                
                {/* Level 1 Chargers - NEW! */}
                {(stationType === 'destination' || customChargers.level1 > 0) && (
                  <div className="bg-gradient-to-r from-gray-500/10 to-gray-500/5 rounded-xl p-4 border border-gray-400/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="font-medium text-white">Level 1 Chargers</span>
                        <span className="text-xs text-gray-300/60 bg-gray-500/20 px-2 py-0.5 rounded">1.9 kW each</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customChargers.level1}
                          onChange={(e) => setCustomChargers({...customChargers, level1: Math.min(100, parseInt(e.target.value) || 0)})}
                          className="w-20 bg-white/10 rounded px-2 py-1 text-right text-gray-300 font-bold text-xl border border-gray-400/30"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={Math.min(50, customChargers.level1)}
                      onChange={(e) => setCustomChargers({...customChargers, level1: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-900/30 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(Math.min(50, customChargers.level1) / 50) * 100}%, rgba(156, 163, 175, 0.2) ${(Math.min(50, customChargers.level1) / 50) * 100}%, rgba(156, 163, 175, 0.2) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>🔌 Best for all-day parking (airports, workplaces)</span>
                      <span>50</span>
                    </div>
                  </div>
                )}
                
                {/* Add Level 1 button if not showing */}
                {stationType !== 'destination' && customChargers.level1 === 0 && (
                  <button
                    onClick={() => setCustomChargers({...customChargers, level1: 4})}
                    className="w-full p-3 border-2 border-dashed border-gray-500/30 rounded-xl text-gray-400 hover:border-gray-400/50 hover:text-gray-300 transition-all text-sm"
                  >
                    + Add Level 1 Chargers (overnight/all-day parking)
                  </button>
                )}
                
                {/* Level 2 Chargers */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-xl p-4 border border-cyan-400/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                      <span className="font-medium text-white">Level 2 Chargers</span>
                      <span className="text-xs text-cyan-200/60 bg-cyan-500/20 px-2 py-0.5 rounded">7-22 kW each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={customChargers.level2 || recommendation.chargers.level2}
                        onChange={(e) => setCustomChargers({...customChargers, level2: Math.min(500, parseInt(e.target.value) || 0)})}
                        className="w-20 bg-white/10 rounded px-2 py-1 text-right text-cyan-400 font-bold text-xl border border-cyan-400/30"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={Math.min(200, customChargers.level2 || recommendation.chargers.level2)}
                    onChange={(e) => setCustomChargers({...customChargers, level2: parseInt(e.target.value)})}
                    className="w-full h-3 bg-cyan-900/30 rounded-lg appearance-none cursor-pointer slider-cyan"
                    style={{
                      background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(Math.min(200, customChargers.level2 || recommendation.chargers.level2) / 200) * 100}%, rgba(6, 182, 212, 0.2) ${(Math.min(200, customChargers.level2 || recommendation.chargers.level2) / 200) * 100}%, rgba(6, 182, 212, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-cyan-200/50 mt-1">
                    <span>0</span>
                    <span>⚡ Best for 2-4 hour visits (hotels, restaurants)</span>
                    <span>200</span>
                  </div>
                </div>
                
                {/* DCFC Chargers */}
                <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-xl p-4 border border-amber-400/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <span className="font-medium text-white">DC Fast Chargers</span>
                      <span className="text-xs text-amber-200/60 bg-amber-500/20 px-2 py-0.5 rounded">50-150 kW each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={customChargers.dcfc || recommendation.chargers.dcfc}
                        onChange={(e) => setCustomChargers({...customChargers, dcfc: Math.min(300, parseInt(e.target.value) || 0)})}
                        className="w-20 bg-white/10 rounded px-2 py-1 text-right text-amber-400 font-bold text-xl border border-amber-400/30"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.min(100, customChargers.dcfc || recommendation.chargers.dcfc)}
                    onChange={(e) => setCustomChargers({...customChargers, dcfc: parseInt(e.target.value)})}
                    className="w-full h-3 bg-amber-900/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(Math.min(100, customChargers.dcfc || recommendation.chargers.dcfc) / 100) * 100}%, rgba(245, 158, 11, 0.2) ${(Math.min(100, customChargers.dcfc || recommendation.chargers.dcfc) / 100) * 100}%, rgba(245, 158, 11, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-amber-200/50 mt-1">
                    <span>0</span>
                    <span>🔋 Best for quick stops (20-45 min)</span>
                    <span>100</span>
                  </div>
                </div>
                
                {/* HPC Chargers */}
                <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      <span className="font-medium text-white">High-Power Chargers</span>
                      <span className="text-xs text-purple-200/60 bg-purple-500/20 px-2 py-0.5 rounded">250-350 kW each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={customChargers.hpc || recommendation.chargers.hpc}
                        onChange={(e) => setCustomChargers({...customChargers, hpc: Math.min(100, parseInt(e.target.value) || 0)})}
                        className="w-20 bg-white/10 rounded px-2 py-1 text-right text-purple-400 font-bold text-xl border border-purple-400/30"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={Math.min(50, customChargers.hpc || recommendation.chargers.hpc)}
                    onChange={(e) => setCustomChargers({...customChargers, hpc: parseInt(e.target.value)})}
                    className="w-full h-3 bg-purple-900/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(Math.min(50, customChargers.hpc || recommendation.chargers.hpc) / 50) * 100}%, rgba(168, 85, 247, 0.2) ${(Math.min(50, customChargers.hpc || recommendation.chargers.hpc) / 50) * 100}%, rgba(168, 85, 247, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-purple-200/50 mt-1">
                    <span>0</span>
                    <span>⚡⚡ Premium highway charging (10-15 min)</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
              
              {/* Pro tip / Next Step Preview */}
              <div className="flex items-start gap-3 bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/20">
                <Lightbulb className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-emerald-200/80">{recommendation.stationInsight}</p>
                  <p className="text-xs text-emerald-200/60 mt-2">
                    <span className="font-bold">Next step:</span> Choose your goals (peak shaving, solar, backup power) to see how battery storage can reduce your ${recommendation.costs.monthlyDemandCharges.toLocaleString()}/month demand charges!
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 3: WHAT DO YOU WANT?
              - Goals (Cost savings, Backup, Sustainability)
              - Add-ons (Battery, Solar, Grid Services)
              - DYNAMIC Power Profile Impact!
              ================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['goals']} 
                colorScheme="emerald"
              />
              
              {/* ============================================
                  ⚡ LIVE POWER PROFILE - Shows Impact of Goals
                  ============================================ */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border-2 border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">⚡ Your Energy Solution</h4>
                    <p className="text-emerald-200/70 text-sm">Based on your charger configuration + selected goals</p>
                  </div>
                </div>
                
                {/* Visual Power Stack */}
                <div className="space-y-3 mb-4">
                  {/* Your Demand */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-red-400 w-20">Your Demand</span>
                    <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-400 w-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{recommendation.chargers.peakDemandKW.toLocaleString()} kW peak</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Battery Storage (if enabled) */}
                  {wantsBatteryStorage && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-400 w-20">🔋 Battery</span>
                      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, (recommendation.recommendation.bessKW / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-xs text-white font-bold">{recommendation.recommendation.bessKW} kW / {recommendation.recommendation.bessKWh} kWh</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Solar (if enabled) */}
                  {wantsSolarCanopy && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-400 w-20">☀️ Solar</span>
                      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, (recommendation.recommendation.solarKW / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-xs text-white font-bold">{recommendation.recommendation.solarKW} kW solar canopy</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Generator (if enabled) */}
                  {wantsPowerGenerator && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-orange-400 w-20">⚡ Backup</span>
                      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, ((recommendation.recommendation.generatorKW || 0) / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-xs text-white font-bold">{recommendation.recommendation.generatorKW || 0} kW generator</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Savings Impact - Dynamic! */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">${Math.round(recommendation.savings.annual / 12).toLocaleString()}</p>
                    <p className="text-xs text-emerald-200/70">Monthly Savings</p>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-amber-400">${recommendation.savings.annual.toLocaleString()}</p>
                    <p className="text-xs text-amber-200/70">Annual Savings</p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">{wantsBatteryStorage ? '40%' : '0%'}</p>
                    <p className="text-xs text-blue-200/70">Demand Reduction</p>
                  </div>
                </div>
              </div>
              
              {/* Energy Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Energy Solutions
                </h4>
                
                {/* Battery Storage */}
                <div className={`rounded-xl p-4 border cursor-pointer transition-all ${
                  wantsBatteryStorage ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`} onClick={() => setWantsBatteryStorage(!wantsBatteryStorage)}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsBatteryStorage}
                      onChange={(e) => setWantsBatteryStorage(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500"
                    />
                    <Battery className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <p className="font-medium text-white">Battery Storage (BESS)</p>
                      <p className="text-sm text-emerald-200/70">Reduce demand charges by up to 40%</p>
                    </div>
                    {wantsBatteryStorage && (
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{recommendation.recommendation.bessKW} kW</p>
                        <p className="text-xs text-emerald-200/60">{recommendation.recommendation.bessKWh} kWh</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Solar Canopy */}
                <div className={`rounded-xl p-4 border cursor-pointer transition-all ${
                  wantsSolarCanopy ? 'bg-amber-500/10 border-amber-400/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`} onClick={() => setWantsSolarCanopy(!wantsSolarCanopy)}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsSolarCanopy}
                      onChange={(e) => setWantsSolarCanopy(e.target.checked)}
                      className="w-5 h-5 accent-amber-500"
                    />
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div className="flex-1">
                      <p className="font-medium text-white">Solar Canopy</p>
                      <p className="text-sm text-amber-200/70">Shade for vehicles + free electricity</p>
                    </div>
                    {wantsSolarCanopy && (
                      <div className="text-right">
                        <p className="font-bold text-amber-400">{recommendation.recommendation.solarKW} kW</p>
                        <p className="text-xs text-amber-200/60">~${recommendation.savings.solarOffset.toLocaleString()}/yr</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Grid Services */}
                <div className={`rounded-xl p-4 border cursor-pointer transition-all ${
                  wantsGridServices ? 'bg-purple-500/10 border-purple-400/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`} onClick={() => wantsBatteryStorage && setWantsGridServices(!wantsGridServices)}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsGridServices}
                      disabled={!wantsBatteryStorage}
                      onChange={(e) => setWantsGridServices(e.target.checked)}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <Network className="w-5 h-5 text-purple-400" />
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        Grid Services 
                        <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">Bonus Revenue</span>
                      </p>
                      <p className="text-sm text-purple-200/70">
                        {wantsBatteryStorage ? 'Earn money by helping stabilize the grid' : 'Requires battery storage'}
                      </p>
                    </div>
                    {wantsGridServices && wantsBatteryStorage && (
                      <div className="text-right">
                        <p className="font-bold text-purple-400">+${recommendation.savings.gridServices.toLocaleString()}/yr</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Power Generator */}
                <div className={`rounded-xl p-4 border cursor-pointer transition-all ${
                  wantsPowerGenerator ? 'bg-orange-500/10 border-orange-400/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`} onClick={() => setWantsPowerGenerator(!wantsPowerGenerator)}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={wantsPowerGenerator}
                      onChange={(e) => setWantsPowerGenerator(e.target.checked)}
                      className="w-5 h-5 accent-orange-500"
                    />
                    <Zap className="w-5 h-5 text-orange-400" />
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        Backup Power Generator
                        <span className="ml-2 text-xs bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full">Resilience</span>
                      </p>
                      <p className="text-sm text-orange-200/70">Keep charging during grid outages</p>
                    </div>
                    {wantsPowerGenerator && (
                      <div className="text-right">
                        <p className="font-bold text-orange-400">{Math.round(recommendation.chargers.peakDemandKW * 0.5)} kW</p>
                        <p className="text-xs text-orange-200/60">Natural gas/diesel</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Grid Services Explanation */}
              {wantsBatteryStorage && (
                <div className="bg-white/5 rounded-lg p-3 text-xs text-white/60">
                  <p className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    {STATION_TYPES[stationType].gridServicesNote}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* ================================================
              STEP 4: YOUR QUOTE
              - Calculated results
              - Key metrics
              - Export & Contact
              ================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['quote']} 
                colorScheme="emerald"
              />
              
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold">Calculating your personalized quote...</p>
                  <p className="text-emerald-200/70 text-sm">Just a moment...</p>
                </div>
              ) : quoteResult ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {businessName ? `${businessName} - ` : ''}Your EV Charging Quote
                    </h3>
                    <p className="text-emerald-200/70">
                      {STATION_TYPES[stationType].name} • {SCALE_OPTIONS[scale].description} • {state}
                    </p>
                  </div>
                  
                  {/* ✨ WHAT YOU NEED - Configuration Summary */}
                  <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-400/30">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-cyan-400" />
                      What You Need - Your Configuration
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Chargers */}
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Bolt className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-white/60 uppercase">Chargers</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {(recommendation.chargers.level1 || 0) + recommendation.chargers.level2 + recommendation.chargers.dcfc + (recommendation.chargers.hpc || 0)}
                        </p>
                        <p className="text-xs text-cyan-200/70">
                          {recommendation.chargers.level1 > 0 && `${recommendation.chargers.level1} L1 • `}
                          {recommendation.chargers.level2} L2 • {recommendation.chargers.dcfc} DCFC
                          {recommendation.chargers.hpc > 0 && ` • ${recommendation.chargers.hpc} HPC`}
                        </p>
                      </div>
                      
                      {/* Peak Demand */}
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Gauge className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-white/60 uppercase">Peak Demand</span>
                        </div>
                        <p className="text-xl font-bold text-white">{Math.round(recommendation.chargers.peakDemandKW)} kW</p>
                        <p className="text-xs text-red-200/70">Maximum draw</p>
                      </div>
                      
                      {/* Battery System */}
                      {wantsBatteryStorage && (
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Battery className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-white/60 uppercase">Battery</span>
                          </div>
                          <p className="text-xl font-bold text-emerald-400">{recommendation.recommendation.bessKW} kW</p>
                          <p className="text-xs text-emerald-200/70">{recommendation.recommendation.bessKWh} kWh capacity</p>
                        </div>
                      )}
                      
                      {/* Solar Canopy */}
                      {wantsSolarCanopy && (
                        <div className="bg-white/5 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Sun className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-white/60 uppercase">Solar</span>
                          </div>
                          <p className="text-xl font-bold text-amber-400">{recommendation.recommendation.solarKW} kW</p>
                          <p className="text-xs text-amber-200/70">Canopy array</p>
                        </div>
                      )}
                      
                      {/* Demand Reduction */}
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-white/60 uppercase">Peak Shaving</span>
                        </div>
                        <p className="text-xl font-bold text-purple-400">{wantsBatteryStorage ? '40%' : '0%'}</p>
                        <p className="text-xs text-purple-200/70">Demand reduction</p>
                      </div>
                    </div>
                    
                    {/* Quick Summary */}
                    <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/70">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>
                          Your {STATION_TYPES[stationType].name.toLowerCase()} will handle 
                          {' '}<strong className="text-white">{Math.round(recommendation.chargers.peakDemandKW / 50)} fast-charge sessions/hour</strong>
                          {wantsBatteryStorage && (
                            <span> with <strong className="text-emerald-400">40% lower demand charges</strong></span>
                          )}
                          {wantsSolarCanopy && (
                            <span> and <strong className="text-amber-400">solar-powered savings</strong></span>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-6 h-6 text-amber-400" />
                      <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold">Annual Savings</p>
                    </div>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-emerald-200/70 mt-2">That's ${Math.round(quoteResult.financials.annualSavings / 12).toLocaleString()}/month back in your pocket</p>
                  </div>
                  
                  {/* Key Metrics Dashboard */}
                  <KeyMetricsDashboard
                    input={{
                      vertical: 'ev-charging',
                      systemSizeKW: recommendation.recommendation.bessKW,
                      systemSizeKWh: recommendation.recommendation.bessKWh,
                      annualSavings: quoteResult.financials.annualSavings,
                      paybackYears: quoteResult.financials.paybackYears,
                      roi10Year: quoteResult.financials.roi10Year,
                      roi25Year: quoteResult.financials.roi25Year,
                      netCost: quoteResult.costs.netCost,
                      totalChargers: recommendation.chargers.level2 + recommendation.chargers.dcfc,
                      peakDemandReduction: Math.round(recommendation.chargers.peakDemandKW * 0.4),
                      state: state,
                      annualKWhDisplaced: recommendation.recommendation.bessKWh * 365,
                    }}
                    layout="grid"
                    maxMetrics={6}
                    showCO2Details={true}
                  />
                  
                  {/* CO2 Badge */}
                  <div className="flex justify-center">
                    <CO2Badge
                      annualSavingsKWh={recommendation.recommendation.bessKWh * 365}
                      state={state}
                      systemType="ev-charging"
                    />
                  </div>
                  
                  {/* Investment Summary */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Investment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-200/70">Equipment (Battery + Chargers)</span>
                        <span className="text-white">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200/70">Installation</span>
                        <span className="text-white">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-white/10">
                        <span className="text-white font-medium">Total Project Cost</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" /> Federal Tax Credit (30%)
                        </span>
                        <span>-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-emerald-500/20 rounded-lg px-3 text-lg mt-2">
                        <span className="text-emerald-300 font-bold">Your Net Cost</span>
                        <span className="text-emerald-400 font-black">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-400/20">
                    <h4 className="font-bold text-white mb-3">What's included in your quote:</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        {recommendation.chargers.level2 + recommendation.chargers.dcfc} EV Chargers
                      </div>
                      {wantsBatteryStorage && (
                        <div className="flex items-center gap-2 text-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {recommendation.recommendation.bessKW} kW / {recommendation.recommendation.bessKWh} kWh Battery
                        </div>
                      )}
                      {wantsSolarCanopy && (
                        <div className="flex items-center gap-2 text-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {recommendation.recommendation.solarKW} kW Solar Canopy
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Installation & permitting
                      </div>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        10-year warranty
                      </div>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Monitoring & support
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Options */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3">Download Your Quote</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={downloadWord} className="flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <span className="text-sm">Word</span>
                      </button>
                      <button onClick={downloadExcel} className="flex flex-col items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                        <span className="text-sm">Excel</span>
                      </button>
                      <button onClick={downloadQuote} className="flex flex-col items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <File className="w-8 h-8 text-red-400" />
                        <span className="text-sm">HTML</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA - Different based on Concierge tier */}
                  {conciergeTier === 'pro' ? (
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">👑</span>
                        <div>
                          <p className="font-bold text-amber-400">Concierge Pro Benefits</p>
                          <p className="text-sm text-amber-200/70">Your dedicated advisor will contact you within 24 hours</p>
                        </div>
                      </div>
                      <ul className="grid grid-cols-2 gap-2 text-sm mb-4">
                        {CONCIERGE_TIERS.pro.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-amber-200">
                            <CheckCircle className="w-4 h-4 text-amber-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={onRequestConsultation}
                        className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Schedule VIP Consultation
                      </button>
                    </div>
                  ) : onRequestConsultation && (
                    <button
                      onClick={onRequestConsultation}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Talk to an Expert - Free Consultation
                    </button>
                  )}
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
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Floating Power Gauge Widget - Always visible in bottom right */}
      {calculatedPower.peakDemandKW > 0 && (
        <PowerGaugeWidget
          data={{
            bessKW: recommendation.recommendation.bessKW,
            bessKWh: recommendation.recommendation.bessKWh,
            peakDemandKW: calculatedPower.peakDemandKW,
            solarKW: recommendation.recommendation.solarKW,
            evChargersKW: calculatedPower.totalConnectedKW,
            generatorKW: recommendation.recommendation.generatorKW,
            powerGapKW: Math.max(0, calculatedPower.peakDemandKW - (
              recommendation.recommendation.bessKW +
              recommendation.recommendation.solarKW +
              recommendation.recommendation.generatorKW
            )),
            isGapMet: (
              recommendation.recommendation.bessKW +
              recommendation.recommendation.solarKW +
              recommendation.recommendation.generatorKW
            ) >= calculatedPower.peakDemandKW * 0.9,
          }}
          position="fixed"
        />
      )}
    </div>
  );
}
