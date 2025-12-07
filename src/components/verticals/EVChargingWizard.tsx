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
  Sparkles, Car, TrendingDown, TrendingUp, Phone, FileText, FileSpreadsheet, File, Bolt,
  BarChart3, Network, Building, Globe, Hotel, Hospital, GraduationCap, 
  Plane, ShoppingBag, Warehouse, Coffee, Settings, ChevronDown, ChevronUp,
  Users, ParkingCircle, Clock, Leaf, Trophy, Shield, HelpCircle, Target, Lightbulb,
  ShoppingCart, Activity, Receipt, Info
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
  calculateEVStationRecommendation,
  EV_STATION_TYPES,
  EV_SCALE_OPTIONS,
  type EVChargerConfig,
  type EVStationType,
  type EVScaleOption,
  type EVStationRecommendationInput,
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
  
  // Equipment Cart - shopping cart showing selections vs needs (like Amazon)
  const [showEquipmentCart, setShowEquipmentCart] = useState(false);
  
  // Energy Metrics Dashboard - shows energy costs and charges
  const [showEnergyMetrics, setShowEnergyMetrics] = useState(false);
  
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
  // SMART RECOMMENDATION ENGINE - Uses SSOT
  // ============================================
  
  // Map local station type to SSOT station type
  const mapStationType = (localType: keyof typeof STATION_TYPES): EVStationType => {
    // Direct mapping - local types match SSOT types
    const mapping: Record<keyof typeof STATION_TYPES, EVStationType> = {
      highway: 'highway',
      urban: 'urban',
      destination: 'destination',
      fleet: 'fleet',
      retail: 'retail',
    };
    return mapping[localType];
  };
  
  // Map local scale to SSOT scale
  const mapScale = (localScale: keyof typeof SCALE_OPTIONS): EVScaleOption => {
    // Direct mapping - local scales match SSOT scales
    const mapping: Record<keyof typeof SCALE_OPTIONS, EVScaleOption> = {
      starter: 'starter',
      growing: 'growing',
      established: 'established',
      enterprise: 'enterprise',
    };
    return mapping[localScale];
  };
  
  // Get recommendation using SSOT
  const getSmartRecommendation = () => {
    const stateData = STATE_RATES[state] || STATE_RATES['Other'];
    const station = STATION_TYPES[stationType];
    
    // Build input for SSOT function
    const input: EVStationRecommendationInput = {
      stationType: mapStationType(stationType),
      scale: mapScale(scale),
      customChargers: {
        level1: customChargers.level1,
        level2: customChargers.level2,
        dcfc: customChargers.dcfc,
        hpc: customChargers.hpc,
      },
      goals: {
        wantsBatteryStorage,
        wantsSolarCanopy,
        wantsGridServices,
        wantsPowerGenerator,
      },
      electricityRate: stateData.rate,
      demandCharge: stateData.demandCharge,
    };
    
    // Get recommendation from SSOT
    const ssotResult = calculateEVStationRecommendation(input);
    
    // Override station-specific text from local constants (they have more UI details)
    return {
      ...ssotResult,
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
      
      // Calculate generator MW if user wants backup power
      const generatorMW = wantsPowerGenerator ? (recommendation.chargers.peakDemandKW * 0.3 / 1000) : 0;
      
      // Map grid connection status for SSOT compliance
      const gridConnectionType = gridConnection.status === 'off-grid' ? 'off-grid' : 
                                 gridConnection.status === 'grid-backup-only' ? 'limited' : 'on-grid';
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: state,
        electricityRate: stateData.rate,
        useCase: 'ev-charging',
        solarMW: wantsSolarCanopy ? (recommendation.recommendation.solarKW / 1000) : 0,
        generatorMW,
        generatorFuelType: 'natural-gas', // EV charging stations prefer natural gas (cleaner, quieter)
        gridConnection: gridConnectionType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden p-4">
      <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 rounded-3xl w-full max-w-4xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30 flex flex-col" style={{ maxHeight: 'calc(100vh - 32px)', height: 'auto' }}>
        {/* Header - HIGH CONTRAST */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-900/40 to-slate-900 px-6 py-5 border-b-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  {quoteMode === 'select' ? 'EV Charging Hub Quote Builder' : 
                   quoteMode === 'pro' ? 'Pro Mode: Direct Input' : 
                   `Build Your EV Charging Quote`}
                </h2>
                <p className="text-sm text-emerald-300 font-medium">
                  {quoteMode === 'select' ? 'Choose how you want to build your quote' :
                   quoteMode === 'pro' ? 'Enter your specifications directly' :
                   `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-gray-600 hover:border-gray-500">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Progress Steps - HIGH CONTRAST - Only show in guided mode */}
          {quoteMode === 'guided' && (
          <div className="flex items-center gap-2 mt-5">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30' 
                        : isComplete 
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-pointer hover:bg-emerald-500/30 border-emerald-500/50'
                          : 'bg-gray-800/50 text-gray-400 border-gray-700'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-bold hidden sm:inline">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isComplete ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              EQUIPMENT CART + ENERGY METRICS - Two separate buttons
              ═══════════════════════════════════════════════════════════════ */}
          {quoteMode === 'guided' && calculatedPower.peakDemandKW > 0 && (
            <div className="mt-3 space-y-2">
              {/* Two Button Row */}
              <div className="flex gap-2">
                {/* ENERGY METRICS Button */}
                <button
                  onClick={() => setShowEnergyMetrics(!showEnergyMetrics)}
                  className={`flex-1 flex items-center justify-between gap-2 bg-gray-800/60 hover:bg-gray-800/80 rounded-xl px-3 py-2 border transition-all ${
                    showEnergyMetrics ? 'border-emerald-400/60 shadow-lg shadow-emerald-500/20' : 'border-gray-700/50 hover:border-emerald-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">${(recommendation.costs.monthlyElectricity).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-600/40 px-2 py-1 rounded-lg border border-emerald-400/50">
                    <span className="text-xs font-bold text-emerald-200">Energy</span>
                    <div className={`transition-transform ${showEnergyMetrics ? 'rotate-180' : ''}`}>
                      <ArrowRight className="w-3 h-3 text-emerald-300 rotate-90" />
                    </div>
                  </div>
                </button>
                
                {/* EQUIPMENT CART Button - Like Amazon shopping cart */}
                <button
                  onClick={() => setShowEquipmentCart(!showEquipmentCart)}
                  className={`flex-1 flex items-center justify-between gap-2 bg-gray-800/60 hover:bg-gray-800/80 rounded-xl px-3 py-2 border transition-all ${
                    showEquipmentCart ? 'border-teal-400/60 shadow-lg shadow-teal-500/20' : 'border-gray-700/50 hover:border-teal-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-bold text-white">{recommendation.recommendation.bessKW} kW</span>
                    <span className="text-xs text-gray-400">BESS</span>
                  </div>
                  <div className="flex items-center gap-1 bg-teal-600/40 px-2 py-1 rounded-lg border border-teal-400/50">
                    <span className="text-xs font-bold text-teal-200">Cart</span>
                    <div className={`transition-transform ${showEquipmentCart ? 'rotate-180' : ''}`}>
                      <ArrowRight className="w-3 h-3 text-teal-300 rotate-90" />
                    </div>
                  </div>
                </button>
              </div>
              
              {/* ENERGY METRICS Popup */}
              {showEnergyMetrics && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30 p-5 z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Activity className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Energy Metrics</h3>
                        <p className="text-xs text-gray-400">Your electricity costs and usage</p>
                      </div>
                    </div>
                    <button onClick={() => setShowEnergyMetrics(false)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  
                  {/* Energy Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-300 font-medium">Total Connected</span>
                      </div>
                      <p className="text-2xl font-black text-white">{calculatedPower.totalConnectedKW.toLocaleString()} <span className="text-sm text-emerald-300">kW</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/30 rounded-xl p-4 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                        <span className="text-sm text-amber-300 font-medium">Peak Demand</span>
                      </div>
                      <p className="text-2xl font-black text-white">{calculatedPower.peakDemandKW.toLocaleString()} <span className="text-sm text-amber-300">kW</span></p>
                      <p className="text-xs text-gray-500">70% concurrency factor</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-900/40 to-orange-900/30 rounded-xl p-4 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-red-300 font-medium">Demand Charges</span>
                      </div>
                      <p className="text-2xl font-black text-white">${calculatedPower.monthlyDemandCharges.toLocaleString()}<span className="text-sm text-red-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/30 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">Energy Charges</span>
                      </div>
                      <p className="text-2xl font-black text-white">${calculatedPower.monthlyEnergyCharges.toLocaleString()}<span className="text-sm text-purple-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-rose-900/40 to-pink-900/30 rounded-xl p-4 border border-rose-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5 text-rose-400" />
                        <span className="text-sm text-rose-300 font-medium">Total Monthly</span>
                      </div>
                      <p className="text-2xl font-black text-white">${recommendation.costs.monthlyElectricity.toLocaleString()}<span className="text-sm text-rose-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Battery className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-cyan-300 font-medium">BESS Savings</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-400">+${recommendation.savings.monthly.toLocaleString()}<span className="text-sm text-cyan-300">/mo</span></p>
                    </div>
                  </div>
                  
                  {/* State Rates */}
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                    <h4 className="text-sm font-bold text-white mb-2">📍 {state} Electricity Rates</h4>
                    <div className="flex gap-6 text-sm">
                      <span className="text-emerald-300">Energy: <span className="text-white font-bold">${(STATE_RATES[state]?.rate || 0.14).toFixed(2)}/kWh</span></span>
                      <span className="text-amber-300">Demand: <span className="text-white font-bold">${STATE_RATES[state]?.demandCharge || 18}/kW</span></span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* EQUIPMENT CART Popup - Shopping Cart Style */}
              {showEquipmentCart && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl border-2 border-teal-500/50 shadow-2xl shadow-teal-500/30 p-5 z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500/20 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Equipment Cart</h3>
                        <p className="text-xs text-gray-400">Your selections vs what you need</p>
                      </div>
                    </div>
                    <button onClick={() => setShowEquipmentCart(false)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  
                  {/* Shopping Cart Grid */}
                  <div className="space-y-4">
                    {/* Target (What You Need) */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-amber-400" />
                        <span className="text-sm font-bold text-amber-300">WHAT YOU NEED (Based on your station)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Peak Demand</p>
                          <p className="text-xl font-black text-white">{calculatedPower.peakDemandKW} kW</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Recommended BESS</p>
                          <p className="text-xl font-black text-amber-400">{Math.round(calculatedPower.peakDemandKW * 0.5)} kW</p>
                          <p className="text-xs text-gray-500">50% coverage</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Storage Capacity</p>
                          <p className="text-xl font-black text-amber-400">{Math.round(calculatedPower.peakDemandKW * 0.5 * 2)} kWh</p>
                          <p className="text-xs text-gray-500">2-hour duration</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selected (What's in Your Cart) */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-300">YOUR SELECTIONS (In Cart)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* EV Chargers */}
                        <div className="text-center p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                          <Car className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 mb-1">EV Chargers</p>
                          <p className="text-xl font-black text-cyan-400">{customChargers.level1 + customChargers.level2 + customChargers.dcfc + customChargers.hpc}</p>
                          <p className="text-xs text-cyan-300">{calculatedPower.totalConnectedKW} kW total</p>
                        </div>
                        
                        {/* BESS */}
                        {wantsBatteryStorage && (
                          <div className="text-center p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                            <Battery className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">BESS Power</p>
                            <p className="text-xl font-black text-emerald-400">{recommendation.recommendation.bessKW} kW</p>
                            <p className="text-xs text-emerald-300">{recommendation.recommendation.bessKWh} kWh</p>
                          </div>
                        )}
                        
                        {/* Solar */}
                        {wantsSolarCanopy && (
                          <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                            <Sun className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">Solar Canopy</p>
                            <p className="text-xl font-black text-amber-400">{recommendation.recommendation.solarKW} kW</p>
                            <p className="text-xs text-amber-300">{(recommendation.recommendation.solarKW / 1000).toFixed(2)} MW</p>
                          </div>
                        )}
                        
                        {/* Generator */}
                        {wantsPowerGenerator && (
                          <div className="text-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
                            <Zap className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">Generator</p>
                            <p className="text-xl font-black text-orange-400">{recommendation.recommendation.generatorKW} kW</p>
                            <p className="text-xs text-orange-300">Backup power</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Coverage Progress Bar */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">Peak Demand Coverage</span>
                        <span className={`text-sm font-bold ${
                          (recommendation.recommendation.bessKW + recommendation.recommendation.solarKW + recommendation.recommendation.generatorKW) >= calculatedPower.peakDemandKW * 0.5
                            ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {Math.round((
                            (recommendation.recommendation.bessKW + recommendation.recommendation.solarKW + recommendation.recommendation.generatorKW) / calculatedPower.peakDemandKW
                          ) * 100)}% of {calculatedPower.peakDemandKW} kW
                        </span>
                      </div>
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (recommendation.recommendation.bessKW + recommendation.recommendation.solarKW + recommendation.recommendation.generatorKW) >= calculatedPower.peakDemandKW * 0.5
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500' 
                              : 'bg-gradient-to-r from-amber-600 to-orange-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.round((
                              (recommendation.recommendation.bessKW + recommendation.recommendation.solarKW + recommendation.recommendation.generatorKW) / calculatedPower.peakDemandKW
                            ) * 100))}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        {wantsBatteryStorage && <span>BESS: {recommendation.recommendation.bessKW} kW</span>}
                        {wantsSolarCanopy && <span>Solar: {recommendation.recommendation.solarKW} kW</span>}
                        {wantsPowerGenerator && <span>Generator: {recommendation.recommendation.generatorKW} kW</span>}
                      </div>
                    </div>
                    
                    {/* Charger Breakdown */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                      <h4 className="text-sm font-bold text-white mb-3">⚡ EV Charger Breakdown</h4>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className={`p-2 rounded-lg ${customChargers.level1 > 0 ? 'bg-gray-600/30' : 'bg-gray-800/30'}`}>
                          <p className="text-xs text-gray-400">Level 1</p>
                          <p className="text-lg font-bold text-gray-300">{customChargers.level1}</p>
                          <p className="text-xs text-gray-500">1.9kW ea</p>
                        </div>
                        <div className={`p-2 rounded-lg ${customChargers.level2 > 0 ? 'bg-cyan-600/30' : 'bg-gray-800/30'}`}>
                          <p className="text-xs text-cyan-300">Level 2</p>
                          <p className="text-lg font-bold text-cyan-400">{customChargers.level2}</p>
                          <p className="text-xs text-gray-500">11kW ea</p>
                        </div>
                        <div className={`p-2 rounded-lg ${customChargers.dcfc > 0 ? 'bg-amber-600/30' : 'bg-gray-800/30'}`}>
                          <p className="text-xs text-amber-300">DCFC</p>
                          <p className="text-lg font-bold text-amber-400">{customChargers.dcfc}</p>
                          <p className="text-xs text-gray-500">150kW ea</p>
                        </div>
                        <div className={`p-2 rounded-lg ${customChargers.hpc > 0 ? 'bg-purple-600/30' : 'bg-gray-800/30'}`}>
                          <p className="text-xs text-purple-300">HPC</p>
                          <p className="text-lg font-bold text-purple-400">{customChargers.hpc}</p>
                          <p className="text-xs text-gray-500">350kW ea</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Content - Scrollable with dynamic height */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-8" style={{ minHeight: 0 }}>
          
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
                    Enter your power requirements directly. Perfect for site developers with utility data or engineering specs.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Direct input: chargers, kW, BESS size</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Advanced financial modeling</span>
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
                  className="group relative bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-emerald-900/30 rounded-3xl p-8 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 text-left"
                >
                  <div className="absolute top-4 right-4 bg-emerald-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-emerald-300">GUIDED</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-3">Help Me Build My Specs</h4>
                  <p className="text-emerald-200/80 mb-4">
                    Answer simple questions about your station and we'll calculate the optimal charger mix and BESS sizing.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Step-by-step guided experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Smart charger recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Perfect for first-timers</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-emerald-400 font-bold group-hover:translate-x-2 transition-transform">
                    <span>Start Guided Wizard</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
              
              {/* Helper Text */}
              <div className="text-center mt-8">
                <p className="text-gray-500 text-sm">
                  💡 Not sure? The <span className="text-emerald-400 font-medium">Guided Wizard</span> will help you discover what you need.
                  <br/>
                  Already have a site plan or utility data? Try <span className="text-amber-400 font-medium">Pro Mode</span> for faster quotes.
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
                    window.location.href = '/quote-builder?vertical=ev-charging';
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
          
          {/* ================================================
              STEP 0: WHO ARE YOU?
              - User Role (Owner / Investor / Developer / Explorer)
              - Location (State) ← CRITICAL: Determines pricing
              - [Optional] Concierge Tier
              ================================================ */}
          {quoteMode === 'guided' && currentStep === 0 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['who']} 
                colorScheme="emerald"
              />
              
              {/* User Role Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <label className="block text-lg font-bold text-white mb-4">👤 I am a...</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <button
                      key={key}
                      onClick={() => setUserRole(key as keyof typeof USER_ROLES)}
                      className={`p-5 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02] ${
                        userRole === key 
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 shadow-lg shadow-emerald-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                      }`}
                    >
                      <span className="text-3xl">{role.icon}</span>
                      <p className="font-bold text-white text-base mt-3">{role.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Location Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl shadow-teal-500/10">
                <label className="block text-lg font-bold text-white mb-3">📍 Where is your charging station?</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-gray-800 rounded-xl px-4 py-4 text-white text-lg border-2 border-gray-600 focus:border-emerald-500 focus:outline-none"
                >
                  {Object.keys(STATE_RATES).map((st) => (
                    <option key={st} value={st} className="bg-gray-800">{st}</option>
                  ))}
                </select>
                <div className="mt-4 p-4 bg-emerald-600/20 rounded-xl border-2 border-emerald-500/40">
                  <p className="text-base text-white font-bold mb-2">
                    📍 {state} Electricity Rates
                  </p>
                  <div className="flex gap-6 text-sm">
                    <span className="text-emerald-300 font-medium">Energy: <span className="text-white font-bold">${(STATE_RATES[state]?.rate || 0.14).toFixed(2)}/kWh</span></span>
                    <span className="text-emerald-300 font-medium">Demand: <span className="text-white font-bold">${STATE_RATES[state]?.demandCharge || 18}/kW</span></span>
                  </div>
                </div>
              </div>
              
              {/* Concierge Tier - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                <label className="block text-lg font-bold text-white mb-4">✨ Choose your experience</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(CONCIERGE_TIERS).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setConciergeTier(key as keyof typeof CONCIERGE_TIERS)}
                      className={`p-5 rounded-xl border-2 text-left transition-all relative transform hover:scale-[1.02] ${
                        conciergeTier === key 
                          ? key === 'pro' 
                            ? 'border-amber-400 bg-gradient-to-br from-amber-600/30 to-orange-600/30 shadow-lg shadow-amber-500/20' 
                            : 'border-emerald-400 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 shadow-lg shadow-emerald-500/20'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                      }`}
                    >
                      {'badge' in tier && (
                        <span className="absolute -top-3 -right-3 bg-amber-500 text-black text-sm font-black px-3 py-1 rounded-full shadow-lg">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{tier.icon}</span>
                        <span className="font-black text-white text-lg">{tier.name}</span>
                      </div>
                      <p className="text-sm text-gray-300">{tier.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Station Name - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-gray-600 shadow-xl">
                <label className="block text-lg font-bold text-white mb-3">🏢 Station name (optional)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Highway 101 Charging Hub"
                  className="w-full bg-gray-800 rounded-xl px-4 py-4 text-white text-lg placeholder-gray-500 border-2 border-gray-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 0 */}
              <div className="mt-8 pt-6 border-t-2 border-emerald-500/30">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-emerald-300/50 animate-pulse hover:animate-none"
                >
                  <span>⚡ Continue to Station Type</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-emerald-300 text-sm mt-3 font-medium">
                  Step 1 of 5 • Takes about 2 minutes
                </p>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 1: WHAT DO YOU HAVE?
              - Station Type (Highway / Urban / Destination / Fleet / Retail)
              - Scale (size/charger counts)
              ================================================ */}
          {quoteMode === 'guided' && currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['what']} 
                colorScheme="emerald"
              />
              
              {/* Station Type Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <label className="block text-lg font-bold text-white mb-4">🚗 What type of station?</label>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(STATION_TYPES).map(([key, station]) => {
                    const Icon = station.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setStationType(key as keyof typeof STATION_TYPES)}
                        className={`p-5 rounded-xl border-2 text-left transition-all transform hover:scale-[1.02] ${
                          stationType === key 
                            ? 'border-emerald-400 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 shadow-lg shadow-emerald-500/20' 
                            : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stationType === key ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-base">{station.name}</p>
                            <p className="text-sm text-gray-400">{station.description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{station.examples}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Scale Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl shadow-teal-500/10">
                <label className="block text-lg font-bold text-white mb-4">📏 How big is your station?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(SCALE_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      onClick={() => setScale(key as keyof typeof SCALE_OPTIONS)}
                      className={`p-5 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02] ${
                        scale === key 
                          ? 'border-teal-400 bg-gradient-to-br from-teal-600/30 to-cyan-600/30 shadow-lg shadow-teal-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                      }`}
                    >
                      <span className="text-3xl">{option.icon}</span>
                      <p className="font-bold text-white mt-2">{option.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Station Type Info - HIGH CONTRAST */}
              <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-2xl p-5 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{STATION_TYPES[stationType].name}</p>
                    <p className="text-emerald-100 mt-2">{STATION_TYPES[stationType].recommendation}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {STATION_TYPES[stationType].defaultChargers.level1 > 0 && (
                        <span className="text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300 font-medium border border-gray-600">
                          L1: {STATION_TYPES[stationType].defaultChargers.level1}
                        </span>
                      )}
                      <span className="text-sm bg-cyan-600/30 px-3 py-1.5 rounded-lg text-cyan-300 font-bold border border-cyan-500/50">
                        L2: {STATION_TYPES[stationType].defaultChargers.level2}
                      </span>
                      <span className="text-sm bg-amber-600/30 px-3 py-1.5 rounded-lg text-amber-300 font-bold border border-amber-500/50">
                        DCFC: {STATION_TYPES[stationType].defaultChargers.dcfc}
                      </span>
                      {STATION_TYPES[stationType].defaultChargers.hpc > 0 && (
                        <span className="text-sm bg-purple-600/30 px-3 py-1.5 rounded-lg text-purple-300 font-bold border border-purple-500/50">
                          HPC: {STATION_TYPES[stationType].defaultChargers.hpc}
                        </span>
                      )}
                      <span className="text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-white font-medium border border-gray-600">
                        ⏱️ {STATION_TYPES[stationType].avgDwellTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 1 */}
              <div className="mt-8 pt-6 border-t-2 border-emerald-500/30">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-emerald-300/50"
                >
                  <span>⚙️ Continue to Charger Config</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-emerald-300 text-sm mt-3 font-medium">
                  Step 2 of 5 • Configure your chargers
                </p>
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
          {quoteMode === 'guided' && currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['how']} 
                colorScheme="emerald"
              />
              
              {/* ✅ STEP EXPLANATION - HIGH CONTRAST */}
              <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-2xl p-5 border-2 border-blue-400/50 shadow-lg shadow-blue-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0 border border-blue-400/50">
                    <Lightbulb className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-black text-white text-lg">📋 What to do in this step:</p>
                    <p className="text-blue-100 mt-2">{STATION_TYPES[stationType].stepExplanation}</p>
                    <p className="text-blue-200 text-sm mt-3">
                      💡 <strong>Tip:</strong> Use the sliders to see how your Power Profile changes in real-time!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ============================================
                  ⚡ POWER PROFILE WIDGET - HIGH CONTRAST
                  ============================================ */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/30">
                    <Gauge className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">⚡ Your Power Profile</h4>
                    <p className="text-emerald-200 text-sm font-medium">Real-time energy requirements based on your configuration</p>
                  </div>
                </div>
                
                {/* Power Bars - Visual breakdown */}
                <div className="space-y-4 mb-5">
                  {/* Level 1 Power */}
                  {(customChargers.level1 > 0 || stationType === 'destination') && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-300 w-16">L1</span>
                      <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="h-full bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (customChargers.level1 * 1.9 / recommendation.chargers.totalPowerKW) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-200 w-24 text-right">{(customChargers.level1 * 1.9).toFixed(1)} kW</span>
                    </div>
                  )}
                  
                  {/* Level 2 Power */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-cyan-400 w-16">L2</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.level2 || 0) * 11 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-cyan-300 w-24 text-right">{((customChargers.level2 || 0) * 11).toLocaleString()} kW</span>
                  </div>
                  
                  {/* DCFC Power */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-amber-400 w-16">DCFC</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.dcfc || 0) * 150 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-amber-300 w-24 text-right">{((customChargers.dcfc || 0) * 150).toLocaleString()} kW</span>
                  </div>
                  
                  {/* HPC Power */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-purple-400 w-16">HPC</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, ((customChargers.hpc || 0) * 350 / Math.max(1, recommendation.chargers.totalPowerKW)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-purple-300 w-24 text-right">{((customChargers.hpc || 0) * 350).toLocaleString()} kW</span>
                  </div>
                </div>
                
                {/* Summary Stats - HIGH CONTRAST */}
                <div className="grid grid-cols-3 gap-4 pt-5 border-t-2 border-gray-700">
                  <div className="text-center p-4 bg-emerald-600/20 rounded-xl border-2 border-emerald-500/40">
                    <p className="text-3xl font-black text-emerald-400">{recommendation.chargers.totalPowerKW.toLocaleString()}</p>
                    <p className="text-sm text-emerald-200 font-medium">Total kW Connected</p>
                  </div>
                  <div className="text-center p-4 bg-amber-600/20 rounded-xl border-2 border-amber-500/40">
                    <p className="text-3xl font-black text-amber-400">{recommendation.chargers.peakDemandKW.toLocaleString()}</p>
                    <p className="text-sm text-amber-200 font-medium">Peak Demand (70%)</p>
                  </div>
                  <div className="text-center p-4 bg-red-600/20 rounded-xl border-2 border-red-500/40">
                    <p className="text-3xl font-black text-red-400">${recommendation.costs.monthlyDemandCharges.toLocaleString()}</p>
                    <p className="text-sm text-red-200 font-medium">Monthly Demand $</p>
                  </div>
                </div>
                
                {/* What this means - HIGH CONTRAST */}
                <div className="mt-5 p-4 bg-gray-800/80 rounded-xl border-2 border-gray-600">
                  <p className="text-white">
                    <span className="font-black text-emerald-400">📊 What this means:</span> Your {(customChargers.level1 || 0) + (customChargers.level2 || 0) + (customChargers.dcfc || 0) + (customChargers.hpc || 0)} chargers will draw up to <span className="font-bold">{recommendation.chargers.peakDemandKW.toLocaleString()} kW</span> during peak times. 
                    Without battery storage, you'll pay <span className="text-red-400 font-black">${recommendation.costs.monthlyDemandCharges.toLocaleString()}/month</span> in demand charges alone!
                  </p>
                </div>
              </div>
              
              {/* Interactive Charger Configuration - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl shadow-teal-500/10">
                <h4 className="font-black text-xl text-white flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-teal-400" />
                  </div>
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
                      max={100}
                      value={Math.min(100, customChargers.level1)}
                      onChange={(e) => setCustomChargers({...customChargers, level1: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gray-900/30 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #9ca3af 0%, #9ca3af ${(Math.min(100, customChargers.level1) / 100) * 100}%, rgba(156, 163, 175, 0.2) ${(Math.min(100, customChargers.level1) / 100) * 100}%, rgba(156, 163, 175, 0.2) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>🔌 Best for all-day parking (airports, workplaces)</span>
                      <span>100</span>
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
                    max={100}
                    value={Math.min(100, customChargers.hpc || recommendation.chargers.hpc)}
                    onChange={(e) => setCustomChargers({...customChargers, hpc: parseInt(e.target.value)})}
                    className="w-full h-3 bg-purple-900/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(Math.min(100, customChargers.hpc || recommendation.chargers.hpc) / 100) * 100}%, rgba(168, 85, 247, 0.2) ${(Math.min(100, customChargers.hpc || recommendation.chargers.hpc) / 100) * 100}%, rgba(168, 85, 247, 0.2) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-purple-200/50 mt-1">
                    <span>0</span>
                    <span>⚡⚡ Premium highway charging (10-15 min)</span>
                    <span>100</span>
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
              
              {/* PROMINENT NEXT BUTTON - Step 2 */}
              <div className="mt-8 pt-6 border-t-2 border-emerald-500/30">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-emerald-300/50"
                >
                  <span>🎯 Continue to Your Goals</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-emerald-300 text-sm mt-3 font-medium">
                  Step 3 of 5 • Set your savings targets
                </p>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 3: WHAT DO YOU WANT?
              - Goals (Cost savings, Backup, Sustainability)
              - Add-ons (Battery, Solar, Grid Services)
              - DYNAMIC Power Profile Impact!
              ================================================ */}
          {quoteMode === 'guided' && currentStep === 3 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['goals']} 
                colorScheme="emerald"
              />
              
              {/* ============================================
                  ⚡ LIVE POWER PROFILE - HIGH CONTRAST
                  ============================================ */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/30">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xl">⚡ Your Energy Solution</h4>
                    <p className="text-emerald-200 font-medium">Based on your charger configuration + selected goals</p>
                  </div>
                </div>
                
                {/* Visual Power Stack */}
                <div className="space-y-4 mb-5">
                  {/* Your Demand */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-red-400 w-24">Your Demand</span>
                    <div className="flex-1 h-7 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-400 w-full flex items-center justify-center">
                        <span className="text-sm text-white font-bold">{recommendation.chargers.peakDemandKW.toLocaleString()} kW peak</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Battery Storage (if enabled) */}
                  {wantsBatteryStorage && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-emerald-400 w-24">🔋 Battery</span>
                      <div className="flex-1 h-7 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, (recommendation.recommendation.bessKW / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-sm text-white font-bold">{recommendation.recommendation.bessKW} kW / {recommendation.recommendation.bessKWh} kWh</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Solar (if enabled) */}
                  {wantsSolarCanopy && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-amber-400 w-24">☀️ Solar</span>
                      <div className="flex-1 h-7 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, (recommendation.recommendation.solarKW / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-sm text-white font-bold">{recommendation.recommendation.solarKW} kW solar canopy</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Generator (if enabled) */}
                  {wantsPowerGenerator && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-orange-400 w-24">⚡ Backup</span>
                      <div className="flex-1 h-7 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center transition-all duration-500"
                          style={{ width: `${Math.min(100, ((recommendation.recommendation.generatorKW || 0) / recommendation.chargers.peakDemandKW) * 100)}%` }}
                        >
                          <span className="text-sm text-white font-bold">{recommendation.recommendation.generatorKW || 0} kW generator</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Savings Impact - HIGH CONTRAST */}
                <div className="grid grid-cols-3 gap-4 pt-5 border-t-2 border-gray-700">
                  <div className="text-center p-4 bg-emerald-600/20 rounded-xl border-2 border-emerald-500/40">
                    <p className="text-3xl font-black text-emerald-400">${Math.round(recommendation.savings.annual / 12).toLocaleString()}</p>
                    <p className="text-sm text-emerald-200 font-medium">Monthly Savings</p>
                  </div>
                  <div className="text-center p-4 bg-amber-600/20 rounded-xl border-2 border-amber-500/40">
                    <p className="text-3xl font-black text-amber-400">${recommendation.savings.annual.toLocaleString()}</p>
                    <p className="text-sm text-amber-200 font-medium">Annual Savings</p>
                  </div>
                  <div className="text-center p-4 bg-blue-600/20 rounded-xl border-2 border-blue-500/40">
                    <p className="text-3xl font-black text-blue-400">{wantsBatteryStorage ? '40%' : '0%'}</p>
                    <p className="text-sm text-blue-200 font-medium">Demand Reduction</p>
                  </div>
                </div>
              </div>
              
              {/* Energy Options - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl shadow-teal-500/10">
                <h4 className="font-black text-xl text-white flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-teal-400" />
                  </div>
                  Energy Solutions
                </h4>
                
                <div className="space-y-4">
                  {/* Battery Storage */}
                  <div className={`rounded-xl p-5 border-2 cursor-pointer transition-all transform hover:scale-[1.01] ${
                    wantsBatteryStorage ? 'bg-emerald-600/20 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-gray-800/60 border-gray-600 hover:border-gray-500'
                  }`} onClick={() => setWantsBatteryStorage(!wantsBatteryStorage)}>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={wantsBatteryStorage}
                        onChange={(e) => setWantsBatteryStorage(e.target.checked)}
                        className="w-6 h-6 accent-emerald-500 rounded"
                      />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wantsBatteryStorage ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                        <Battery className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">Battery Storage (BESS)</p>
                        <p className="text-gray-400">Reduce demand charges by up to 40%</p>
                      </div>
                      {wantsBatteryStorage && (
                        <div className="text-right">
                          <p className="font-black text-emerald-400 text-xl">{recommendation.recommendation.bessKW} kW</p>
                          <p className="text-emerald-200">{recommendation.recommendation.bessKWh} kWh</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Solar Canopy */}
                  <div className={`rounded-xl p-5 border-2 cursor-pointer transition-all transform hover:scale-[1.01] ${
                    wantsSolarCanopy ? 'bg-amber-600/20 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-gray-800/60 border-gray-600 hover:border-gray-500'
                  }`} onClick={() => setWantsSolarCanopy(!wantsSolarCanopy)}>
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={wantsSolarCanopy}
                        onChange={(e) => setWantsSolarCanopy(e.target.checked)}
                        className="w-6 h-6 accent-amber-500 rounded"
                      />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wantsSolarCanopy ? 'bg-amber-500' : 'bg-gray-700'}`}>
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">Solar Canopy</p>
                        <p className="text-gray-400">Shade for vehicles + free electricity</p>
                      </div>
                      {wantsSolarCanopy && (
                        <div className="text-right">
                          <p className="font-black text-amber-400 text-xl">{recommendation.recommendation.solarKW} kW</p>
                          <p className="text-amber-200">~${recommendation.savings.solarOffset.toLocaleString()}/yr</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Grid Services */}
                <div className={`rounded-xl p-5 border-2 cursor-pointer transition-all transform hover:scale-[1.01] mt-4 ${
                  wantsGridServices ? 'bg-purple-600/20 border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-gray-800/60 border-gray-600 hover:border-gray-500'
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
              
              {/* Grid Connection Status - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-gray-500/40 shadow-xl shadow-gray-500/10">
                <h4 className="font-black text-xl text-white flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-gray-400" />
                  </div>
                  Grid Connection Status
                </h4>
                <p className="text-sm text-gray-300 mb-4">
                  How is your charging station connected to the power grid?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'grid-tied' as const, label: 'Grid-Tied', desc: 'Connected to utility', icon: '🔌' },
                    { id: 'grid-backup-only' as const, label: 'Limited Grid', desc: 'Unreliable connection', icon: '⚡' },
                    { id: 'off-grid' as const, label: 'Off-Grid', desc: 'No utility', icon: '🏝️' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setGridConnection(prev => ({ ...prev, status: option.id }))}
                      className={`p-4 rounded-xl text-center transition-all transform hover:scale-[1.02] ${
                        gridConnection.status === option.id 
                          ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-2 border-purple-400 ring-4 ring-purple-400/30' 
                          : 'bg-gray-800/50 border-2 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <p className="text-sm font-black text-white">{option.label}</p>
                      <p className="text-xs text-gray-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
                
                {/* Contextual info based on selection */}
                {gridConnection.status !== 'grid-tied' && (
                  <div className={`mt-4 p-3 rounded-lg text-xs ${
                    gridConnection.status === 'off-grid'
                      ? 'bg-amber-500/20 border border-amber-400/30 text-amber-200'
                      : 'bg-blue-500/20 border border-blue-400/30 text-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {gridConnection.status === 'off-grid'
                          ? 'Off-grid EV charging requires larger battery + generator for 24/7 operation.'
                          : 'Limited grid means we\'ll size your system for greater self-reliance.'}
                      </span>
                    </div>
                  </div>
                )}
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
              
              {/* PROMINENT NEXT BUTTON - Step 3 */}
              <div className="mt-8 pt-6 border-t-2 border-emerald-500/30">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-emerald-300/50 animate-pulse hover:animate-none"
                >
                  <span>📊 Generate My Quote</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-emerald-300 text-sm mt-3 font-medium">
                  Step 4 of 5 • See your savings!
                </p>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 4: YOUR QUOTE
              - Calculated results
              - Key metrics
              - Export & Contact
              ================================================ */}
          {quoteMode === 'guided' && currentStep === 4 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={EV_CHARGING_STEP_HELP['quote']} 
                colorScheme="emerald"
              />
              
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold text-lg">Calculating your personalized quote...</p>
                  <p className="text-emerald-200 text-sm">Just a moment...</p>
                </div>
              ) : quoteResult ? (
                <>
                  {/* Quote Header - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 text-center">
                    <h3 className="text-3xl font-black text-white mb-2">
                      {businessName ? `${businessName} - ` : ''}Your EV Charging Quote
                    </h3>
                    <p className="text-gray-300 text-lg">
                      {STATION_TYPES[stationType].name} • {SCALE_OPTIONS[scale].description} • {state}
                    </p>
                  </div>
                  
                  {/* Main Savings Card - ULTRA HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-emerald-600/40 via-teal-600/30 to-cyan-600/40 rounded-2xl p-8 border-4 border-emerald-400 text-center shadow-2xl shadow-emerald-500/30">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Trophy className="w-8 h-8 text-amber-400" />
                      <p className="text-emerald-200 uppercase tracking-widest text-lg font-black">Annual Savings</p>
                    </div>
                    <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 drop-shadow-lg">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-emerald-100 mt-3 text-lg">That's <strong>${Math.round(quoteResult.financials.annualSavings / 12).toLocaleString()}/month</strong> back in your pocket</p>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      QUOTE NAMEPLATE - Professional Header
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Merlin EV Charging Quote</p>
                        <h3 className="text-xl font-bold text-white mt-1">
                          {businessName || 'EV Charging'} Energy Storage Project
                        </h3>
                        <p className="text-sm text-emerald-200/70 mt-1">
                          {state} • {STATION_TYPES[stationType].name} • {SCALE_OPTIONS[scale].description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-200/50">Quote Date</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-emerald-200/50 mt-2">Quote ID</p>
                        <p className="text-emerald-400 font-mono text-sm">EV-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    {/* Nameplate Key Specs */}
                    <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                          {recommendation.recommendation.bessKW} kW
                        </p>
                        <p className="text-xs text-white/60">BESS Power</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-teal-400">
                          {recommendation.recommendation.bessKWh} kWh
                        </p>
                        <p className="text-xs text-white/60">Storage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-400">
                          {wantsSolarCanopy ? `${recommendation.recommendation.solarKW} kW` : '—'}
                        </p>
                        <p className="text-xs text-white/60">Solar</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-400">
                          {quoteResult.financials.paybackYears.toFixed(1)} yr
                        </p>
                        <p className="text-xs text-white/60">Payback</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✨ WHAT YOU NEED - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                    <h4 className="font-black text-xl text-white mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/30 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-cyan-400" />
                      </div>
                      What You Need - Your Configuration
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Chargers */}
                      <div className="bg-gray-800/80 rounded-xl p-4 text-center border-2 border-yellow-500/40">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Bolt className="w-5 h-5 text-yellow-400" />
                          <span className="text-sm text-white font-bold uppercase">Chargers</span>
                        </div>
                        <p className="text-3xl font-black text-white">
                          {(recommendation.chargers.level1 || 0) + recommendation.chargers.level2 + recommendation.chargers.dcfc + (recommendation.chargers.hpc || 0)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {recommendation.chargers.level1 > 0 && `${recommendation.chargers.level1} L1 • `}
                          {recommendation.chargers.level2} L2 • {recommendation.chargers.dcfc} DCFC
                          {recommendation.chargers.hpc > 0 && ` • ${recommendation.chargers.hpc} HPC`}
                        </p>
                      </div>
                      
                      {/* Peak Demand */}
                      <div className="bg-gray-800/80 rounded-xl p-4 text-center border-2 border-red-500/40">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Gauge className="w-5 h-5 text-red-400" />
                          <span className="text-sm text-white font-bold uppercase">Peak Demand</span>
                        </div>
                        <p className="text-3xl font-black text-red-400">{Math.round(recommendation.chargers.peakDemandKW)} kW</p>
                        <p className="text-sm text-red-200">Maximum draw</p>
                      </div>
                      
                      {/* Battery System */}
                      {wantsBatteryStorage && (
                        <div className="bg-gray-800/80 rounded-xl p-4 text-center border-2 border-emerald-500/40">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Battery className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-white font-bold uppercase">Battery</span>
                          </div>
                          <p className="text-3xl font-black text-emerald-400">{recommendation.recommendation.bessKW} kW</p>
                          <p className="text-sm text-emerald-200">{recommendation.recommendation.bessKWh} kWh capacity</p>
                        </div>
                      )}
                      
                      {/* Solar Canopy */}
                      {wantsSolarCanopy && (
                        <div className="bg-gray-800/80 rounded-xl p-4 text-center border-2 border-amber-500/40">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Sun className="w-5 h-5 text-amber-400" />
                            <span className="text-sm text-white font-bold uppercase">Solar</span>
                          </div>
                          <p className="text-3xl font-black text-amber-400">{recommendation.recommendation.solarKW} kW</p>
                          <p className="text-sm text-amber-200">Canopy array</p>
                        </div>
                      )}
                      
                      {/* Demand Reduction */}
                      <div className="bg-gray-800/80 rounded-xl p-4 text-center border-2 border-purple-500/40">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <TrendingDown className="w-5 h-5 text-purple-400" />
                          <span className="text-sm text-white font-bold uppercase">Peak Shaving</span>
                        </div>
                        <p className="text-3xl font-black text-purple-400">{wantsBatteryStorage ? '40%' : '0%'}</p>
                        <p className="text-sm text-purple-200">Demand reduction</p>
                      </div>
                    </div>
                    
                    {/* Quick Summary */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-700 text-white">
                      <p className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span>
                          Your {STATION_TYPES[stationType].name.toLowerCase()} will handle 
                          {' '}<strong className="text-emerald-400">{Math.round(recommendation.chargers.peakDemandKW / 50)} fast-charge sessions/hour</strong>
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
                  
                  {/* Main Savings Card - ULTRA HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-emerald-600/40 via-teal-600/30 to-cyan-600/40 rounded-2xl p-8 border-4 border-emerald-400 text-center shadow-2xl shadow-emerald-500/30">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Trophy className="w-8 h-8 text-amber-400" />
                      <p className="text-emerald-200 uppercase tracking-widest text-lg font-black">Annual Savings</p>
                    </div>
                    <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 drop-shadow-lg">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-emerald-100 mt-3 text-lg">That's <strong>${Math.round(quoteResult.financials.annualSavings / 12).toLocaleString()}/month</strong> back in your pocket</p>
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
                    
                    <div className="space-y-5 mb-6">
                      {/* Demand Charge Reduction */}
                      <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-xl p-4 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                            <span className="text-lg font-bold text-white">Demand Charge Reduction</span>
                          </div>
                          <span className="text-2xl font-black text-emerald-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.55).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-4 rounded-full shadow-lg shadow-emerald-500/30" style={{ width: '55%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~55% of total • Peak shaving during high-demand charging periods</p>
                      </div>
                      
                      {/* Energy Arbitrage */}
                      <div className="bg-gradient-to-r from-teal-900/30 to-teal-800/20 rounded-xl p-4 border border-teal-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-teal-500 rounded-full shadow-lg shadow-teal-500/50"></div>
                            <span className="text-lg font-bold text-white">Energy Arbitrage (TOU)</span>
                          </div>
                          <span className="text-2xl font-black text-teal-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.25).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-4 rounded-full shadow-lg shadow-teal-500/30" style={{ width: '25%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~25% of total • Charge off-peak, discharge on-peak</p>
                      </div>
                      
                      {/* Solar Savings (if applicable) */}
                      {wantsSolarCanopy && (
                        <div className="bg-gradient-to-r from-amber-900/30 to-orange-800/20 rounded-xl p-4 border border-amber-500/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></div>
                              <span className="text-lg font-bold text-white">Solar Canopy Generation</span>
                            </div>
                            <span className="text-2xl font-black text-amber-400">
                              ${Math.round(quoteResult.financials.annualSavings * 0.15).toLocaleString()}/yr
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-4 rounded-full shadow-lg shadow-amber-500/30" style={{ width: '15%' }}></div>
                          </div>
                          <p className="text-sm text-gray-400 mt-2 font-medium">~15% of total • Clean energy from solar canopy</p>
                        </div>
                      )}
                      
                      {/* Grid Services */}
                      <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 rounded-xl p-4 border border-cyan-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
                            <span className="text-lg font-bold text-white">Grid Services / Avoided Spikes</span>
                          </div>
                          <span className="text-2xl font-black text-cyan-400">
                            ${Math.round(quoteResult.financials.annualSavings * (wantsSolarCanopy ? 0.05 : 0.20)).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-4 rounded-full shadow-lg shadow-cyan-500/30" style={{ width: wantsSolarCanopy ? '5%' : '20%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~{wantsSolarCanopy ? '5' : '20'}% of total • Smoothing fast-charger demand spikes</p>
                      </div>
                    </div>
                    
                    {/* Total Savings Summary */}
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
                        <div 
                          className="absolute top-0 h-full bg-gradient-to-r from-red-500 to-emerald-500 opacity-80"
                          style={{ width: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                        <div 
                          className="absolute top-0 h-full w-1 bg-white z-10"
                          style={{ left: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                        <div 
                          className="absolute top-0 right-0 h-full bg-emerald-500/30"
                          style={{ left: `${Math.min((quoteResult.financials.paybackYears / 10) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-emerald-200/60 mt-1">
                        <span>Year 0</span>
                        <span className="text-emerald-400 font-bold">← Break-even: Year {quoteResult.financials.paybackYears.toFixed(1)}</span>
                        <span>Year 10</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      BESS EQUIPMENT BREAKDOWN
                      ═══════════════════════════════════════════════════════════════ */}
                  {wantsBatteryStorage && (
                    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                          <Battery className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h4 className="text-xl font-black text-white">Battery Energy Storage System (BESS)</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Power Rating:</span>
                            <span className="text-xl font-black text-emerald-400">{recommendation.recommendation.bessKW} kW</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Energy Capacity:</span>
                            <span className="text-xl font-black text-teal-400">{recommendation.recommendation.bessKWh} kWh</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Runtime at Peak:</span>
                            <span className="text-lg font-bold text-white">4 hours</span>
                          </div>
                        </div>
                        <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Battery Type:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.batteries?.model || 'LFP'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Manufacturer:</span>
                            <span className="text-lg font-bold text-white">{quoteResult.equipment.batteries?.manufacturer || 'Tesla / BYD'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">Warranty:</span>
                            <span className="text-lg font-bold text-emerald-400">10 Years</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      EV CHARGER EQUIPMENT BREAKDOWN
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-yellow-500/20 rounded-xl">
                        <Bolt className="w-7 h-7 text-yellow-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">EV Charging Equipment</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Level 2 Chargers:</span>
                          <span className="text-xl font-black text-blue-400">{recommendation.chargers.level2} units</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">DCFC (50-150 kW):</span>
                          <span className="text-xl font-black text-orange-400">{recommendation.chargers.dcfc} units</span>
                        </div>
                        {recommendation.chargers.hpc > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">HPC (250+ kW):</span>
                            <span className="text-xl font-black text-red-400">{recommendation.chargers.hpc} units</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4 bg-gray-800/50 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Total Chargers:</span>
                          <span className="text-lg font-bold text-white">{recommendation.chargers.level2 + recommendation.chargers.dcfc + (recommendation.chargers.hpc || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Peak Demand:</span>
                          <span className="text-xl font-black text-red-400">{Math.round(recommendation.chargers.peakDemandKW)} kW</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Concurrent Sessions:</span>
                          <span className="text-lg font-bold text-emerald-400">{Math.round(recommendation.chargers.peakDemandKW / 50)}/hr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Investment Summary - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl shadow-teal-500/10">
                    <h4 className="font-black text-xl text-white mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-teal-400" />
                      </div>
                      Investment Summary
                    </h4>
                    <div className="space-y-3 text-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Equipment (Battery + Chargers)</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Installation</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
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
                        className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-white py-5 rounded-xl font-black text-xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-amber-400/50"
                      >
                        <Phone className="w-6 h-6" />
                        Schedule VIP Consultation
                      </button>
                    </div>
                  ) : onRequestConsultation && (
                    <button
                      onClick={onRequestConsultation}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-5 rounded-xl font-black text-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-emerald-400/50"
                    >
                      <Phone className="w-6 h-6" />
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
        
        {/* Footer Navigation - HIGH CONTRAST */}
        <div className="border-t-2 border-emerald-500/30 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => currentStep === 0 ? onClose() : setCurrentStep(currentStep - 1)}
            className="flex items-center gap-2 px-5 py-3 text-white hover:text-emerald-300 transition-colors font-medium border-2 border-gray-700 hover:border-emerald-500/50 rounded-xl bg-gray-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < WIZARD_STEPS.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 border-2 border-emerald-400/50 disabled:border-gray-600"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
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
