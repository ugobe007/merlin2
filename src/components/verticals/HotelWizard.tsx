/**
 * HOTEL WIZARD - Detailed Quote Builder
 * ======================================
 * 
 * Guided wizard for hotel owners to build a detailed BESS quote.
 * Pre-populated with data from the HotelEnergy landing page calculator.
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Gauge, DollarSign, Calendar, Download, CheckCircle, AlertCircle, 
  Sparkles, TrendingDown, TrendingUp, Phone, FileText, FileSpreadsheet, File, 
  Building2, Waves, Coffee, Dumbbell, Car, Thermometer, Wind, Users, Target,
  MapPin, Settings, Upload, Clock, Activity, Receipt, ShoppingCart
} from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { 
  calculateHotelPowerDetailed,
  HOTEL_CLASS_PROFILES,
  HOTEL_AMENITY_SPECS,
  type HotelPowerInput,
  type HotelAmenity,
  type HotelClass
} from '@/services/useCasePowerCalculations';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';
import { WizardPowerProfile, WizardStepHelp, type StepHelpContent } from '@/components/wizard/shared';
import { PowerGaugeWidget } from '@/components/wizard/widgets';
import { QuoteComplianceFooter } from '@/components/shared/IndustryComplianceBadges';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';

// ============================================
// TYPES
// ============================================

export interface HotelWizardInputs {
  numberOfRooms: number;
  hotelClass: 'economy' | 'midscale' | 'upscale' | 'luxury';
  state: string;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
}

interface HotelWizardProps {
  onClose: () => void;
  initialInputs?: Partial<HotelWizardInputs>;
  onComplete?: (quoteData: any) => void;
  onRequestConsultation?: () => void;
}

// ============================================
// HOTEL SPECIFICATIONS - FROM SSOT
// ============================================
// HOTEL_CLASS_PROFILES and HOTEL_AMENITY_SPECS imported from useCasePowerCalculations.ts
// DO NOT duplicate here - update the SSOT service if values need to change

// Icons for amenities (UI-only, not part of SSOT power calculations)
const AMENITY_ICONS: Record<HotelAmenity, React.ComponentType<any>> = {
  pool: Waves,
  restaurant: Coffee,
  spa: Thermometer,
  fitnessCenter: Dumbbell,
  evCharging: Car,
  laundry: Wind,
  conferenceCenter: Building2,
};

// Helper to get amenity with icon for UI
const getAmenityWithIcon = (key: HotelAmenity) => ({
  ...HOTEL_AMENITY_SPECS[key],
  icon: AMENITY_ICONS[key],
});

const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.20, demandCharge: 22 },
  'Florida': { rate: 0.13, demandCharge: 14 },
  'Texas': { rate: 0.11, demandCharge: 12 },
  'New York': { rate: 0.18, demandCharge: 20 },
  'Nevada': { rate: 0.12, demandCharge: 15 },
  'Arizona': { rate: 0.12, demandCharge: 16 },
  'Colorado': { rate: 0.11, demandCharge: 13 },
  'Hawaii': { rate: 0.35, demandCharge: 30 },
  'Massachusetts': { rate: 0.22, demandCharge: 18 },
  'Washington': { rate: 0.10, demandCharge: 10 },
  'Other': { rate: 0.13, demandCharge: 15 },
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
    description: 'White-glove service for hotel groups & REITs',
    icon: '👔',
    features: [
      'Dedicated energy analyst',
      'Custom equipment recommendations',
      'Site audit coordination',
      'Multi-property portfolio management',
      'Quarterly performance reviews',
      'Priority phone support',
      'Custom integrations',
    ],
    price: 'Contact Sales',
    badge: 'Hotel Groups' as string | null,
  },
};

// ============================================
// WIZARD STEPS
// ============================================

const WIZARD_STEPS = [
  { id: 'who', title: 'Who Are You?', icon: Users },
  { id: 'what', title: 'Your Hotel', icon: Building2 },
  { id: 'how', title: 'Operations', icon: Settings },
  { id: 'goals', title: 'Your Goals', icon: Target },
  { id: 'quote', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// STEP HELP CONTENT - Hotel Specific
// ============================================

const HOTEL_STEP_HELP: Record<string, StepHelpContent> = {
  'who': {
    stepId: 'who',
    title: 'Tell Us About You',
    description: 'Your role helps us customize the analysis for your specific decision-making needs.',
    tips: [
      { type: 'tip', text: 'Property owners see ROI analysis. Brand managers see portfolio-level insights.' },
      { type: 'info', text: 'Location determines utility rates - this significantly affects savings.' },
    ],
  },
  'what': {
    stepId: 'what',
    title: 'Your Hotel Profile',
    description: 'Hotel class and size determine baseline energy consumption and peak demand.',
    tips: [
      { type: 'tip', text: 'Luxury hotels use 3x more energy per room than economy properties.' },
      { type: 'info', text: 'Amenities like pools, spas, and restaurants significantly increase energy use.' },
    ],
  },
  'how': {
    stepId: 'how',
    title: 'Operating Profile',
    description: 'Occupancy patterns and seasonal variation help us size the battery optimally.',
    tips: [
      { type: 'tip', text: 'Hotels with high peak/off-peak variation benefit most from battery storage.' },
      { type: 'info', text: 'Conference facilities can add 50-100 kW during events.' },
    ],
  },
  'goals': {
    stepId: 'goals',
    title: 'Your Energy Goals',
    description: 'What matters most? Cost savings, sustainability, or backup power for guests?',
    tips: [
      { type: 'tip', text: 'Demand charge reduction typically provides 30-50% of total savings.' },
      { type: 'success', text: 'LEED and sustainability certifications attract eco-conscious travelers.' },
    ],
    links: [
      { label: 'Hotel Energy Efficiency Guide', url: '/docs/hotel-energy' },
      { label: 'ENERGY STAR for Hotels', url: 'https://www.energystar.gov/buildings/resources_audience/hospitality' },
    ],
  },
  'quote': {
    stepId: 'quote',
    title: 'Your Custom Quote',
    description: 'Review your hotel BESS quote with costs, savings projections, and environmental impact.',
    tips: [
      { type: 'success', text: '30% Federal ITC makes battery storage more affordable than ever.' },
      { type: 'tip', text: 'Share this quote with your ownership group or brand energy team.' },
    ],
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function HotelWizard({ 
  onClose, 
  initialInputs = {}, 
  onComplete,
  onRequestConsultation 
}: HotelWizardProps) {
  const mergedInputs = {
    numberOfRooms: initialInputs.numberOfRooms ?? 150,
    hotelClass: initialInputs.hotelClass ?? 'midscale',
    state: initialInputs.state ?? 'Florida',
    businessName: initialInputs.businessName ?? '',
    ownerName: initialInputs.ownerName ?? '',
    email: initialInputs.email ?? '',
    phone: initialInputs.phone ?? '',
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // ════════════════════════════════════════════════════════════════
  // QUOTE BUILDING MODE - Pro vs Guided
  // ════════════════════════════════════════════════════════════════
  // 'select' = Show mode selector (initial state)
  // 'pro' = Direct input mode for professionals with specs
  // 'guided' = Step-by-step wizard for those who need guidance
  const [quoteMode, setQuoteMode] = useState<'select' | 'pro' | 'guided'>('select');
  
  // Pro Mode Direct Inputs (when user has their own specs)
  const [proModeInputs, setProModeInputs] = useState({
    peakDemandKW: 0,
    bessKW: 0,
    bessKWh: 0,
    solarKW: 0,
    generatorKW: 0,
    monthlyBill: 0,
    electricityRate: 0.12,
    demandChargeRate: 15,
    location: 'Florida',
  });
  
  // Step 0: WHO ARE YOU?
  const [userRole, setUserRole] = useState('owner');
  
  // Grid Connection Status - key question from Microsoft AI advisor
  const [gridConnection, setGridConnection] = useState({
    status: 'grid-tied' as 'grid-tied' | 'off-grid' | 'grid-backup-only',
    gridReliability: 'reliable' as 'reliable' | 'occasional-outages' | 'frequent-outages' | 'unreliable',
    gridCostConcern: false, // True if grid is too expensive
    wantGridIndependence: false, // True if they want to reduce grid dependency
  });
  
  // Document Upload for Merlin AI Analysis
  const [uploadedDocs, setUploadedDocs] = useState<{name: string, type: string, size: number}[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  // Advanced Mode - reveals advanced options for power users
  const [powerMode, setPowerMode] = useState(false);
  
  // Equipment Cart Dashboard - shopping cart showing selections vs needs
  const [showPowerProfile, setShowPowerProfile] = useState(false);
  
  // Energy Metrics Dashboard - shows energy costs and charges
  const [showEnergyMetrics, setShowEnergyMetrics] = useState(false);
  
  // Concierge - optional help, not a tier selection
  const [showConciergeHelp, setShowConciergeHelp] = useState(false);
  
  // Step 1: YOUR HOTEL (Type, Size, Amenities)
  const [hotelDetails, setHotelDetails] = useState({
    numberOfRooms: mergedInputs.numberOfRooms,
    hotelClass: mergedInputs.hotelClass as keyof typeof HOTEL_CLASS_PROFILES,
    state: mergedInputs.state,
    buildingAge: 'modern' as 'new' | 'modern' | 'older' | 'historic',
    hvacType: 'ptac' as 'ptac' | 'central' | 'vrf' | 'chiller',
  });
  
  // Step 1 continued: Amenities
  const [amenities, setAmenities] = useState({
    pool: true,
    restaurant: true,
    spa: false,
    fitnessCenter: true,
    evCharging: false,
    laundry: true,
    conferenceCenter: false,
  });
  
  // EV Charging Configuration - only used when evCharging amenity is enabled
  const [evConfig, setEvConfig] = useState({
    numLevel1Ports: 0,      // Level 1: 1.4 kW (standard outlet)
    numLevel2Ports: 8,      // Level 2: 7-22 kW
    numDCFCPorts: 0,        // DC Fast Charging: 50-350 kW
    level2Power: 11 as 7 | 11 | 19 | 22, // kW per port
    dcfcPower: 50 as 50 | 150 | 350, // kW per port
    chargingStrategy: 'guest-amenity' as 'guest-amenity' | 'revenue-generating' | 'fleet',
  });
  
  // Step 2: OPERATIONS
  const [operations, setOperations] = useState({
    avgOccupancy: 70,
    peakHoursStart: 6, // 6 AM (morning + evening peaks)
    peakHoursEnd: 22, // 10 PM
    seasonality: 'moderate' as 'low' | 'moderate' | 'high',
    hasBackupGenerator: false,
    generatorKW: 200,
  });
  
  // Step 3: YOUR GOALS
  const [energyGoals, setEnergyGoals] = useState({
    primaryGoal: 'cost-savings' as 'cost-savings' | 'backup-power' | 'sustainability' | 'all',
    targetSavingsPercent: 35,
    interestInSolar: true,
    solarKW: 200, // Direct kW input, max 2000 kW (2 MW)
    budgetRange: 'moderate' as 'tight' | 'moderate' | 'flexible',
  });
  
  // Calculated values - comprehensive energy metrics
  const [calculatedPower, setCalculatedPower] = useState({
    basePeakKW: 0,
    amenityPeakKW: 0,
    totalPeakKW: 0,
    dailyKWh: 0,
    monthlyKWh: 0,
    monthlyDemandCharges: 0,
    monthlyEnergyCharges: 0,
    totalMonthlyCharges: 0,
    // Seasonality impact
    seasonalMultiplier: 1.0,
    peakSeasonMonthlyKWh: 0,
    offSeasonMonthlyKWh: 0,
    // Peak hours arbitrage
    peakHoursDuration: 0,
    peakEnergyKWh: 0,      // Energy used during peak hours (BESS discharge opportunity)
    offPeakEnergyKWh: 0,   // Energy used during off-peak (BESS charge opportunity)
    arbitrageSavingsPotential: 0, // $ saved by time-shifting energy
  });
  
  // Calculate power using SSOT
  useEffect(() => {
    // Get state-specific rates
    const stateData = STATE_RATES[hotelDetails.state] || STATE_RATES['Other'];
    
    // Build input for SSOT function
    const input: HotelPowerInput = {
      rooms: hotelDetails.numberOfRooms,
      hotelClass: hotelDetails.hotelClass,
      buildingAge: hotelDetails.buildingAge,
      avgOccupancy: operations.avgOccupancy,
      amenities: amenities as Partial<Record<HotelAmenity, boolean>>,
      evChargingConfig: amenities.evCharging ? {
        numLevel1Ports: evConfig.numLevel1Ports,
        numLevel2Ports: evConfig.numLevel2Ports,
        level2Power: evConfig.level2Power,
        numDCFCPorts: evConfig.numDCFCPorts,
        dcfcPower: evConfig.dcfcPower,
      } : undefined,
      operations: {
        seasonality: operations.seasonality,
        peakHoursStart: operations.peakHoursStart,
        peakHoursEnd: operations.peakHoursEnd,
      },
      electricityRate: stateData.rate,
      demandCharge: stateData.demandCharge,
    };
    
    // Call SSOT function
    const calc = calculateHotelPowerDetailed(input);
    setCalculatedPower(calc);
  }, [hotelDetails, amenities, evConfig, operations]);
  
  // Generate quote
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      const targetReduction = energyGoals.targetSavingsPercent / 100;
      const batteryPowerKW = calculatedPower.totalPeakKW * targetReduction;
      const storageSizeMW = batteryPowerKW / 1000;
      const durationHours = energyGoals.primaryGoal === 'backup-power' ? 6 : 4;
      
      const stateData = STATE_RATES[hotelDetails.state] || STATE_RATES['Other'];
      
      // Calculate generator MW if hotel has backup generator
      const generatorMW = operations.hasBackupGenerator ? (operations.generatorKW / 1000) : 0;
      
      // Map grid connection status
      const gridConnectionType = gridConnection.status === 'off-grid' ? 'off-grid' : 
                                 gridConnection.status === 'grid-backup-only' ? 'limited' : 'on-grid';
      
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: hotelDetails.state,
        electricityRate: stateData.rate,
        useCase: 'hotel',
        solarMW: energyGoals.interestInSolar ? (energyGoals.solarKW / 1000) : 0,
        generatorMW,
        generatorFuelType: 'natural-gas', // Hotels use natural gas generators
        gridConnection: gridConnectionType,
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // ============================================
  // QUOTE EXPORT - USING SHARED UTILITIES
  // ============================================
  
  // Helper to convert quote result to shared QuoteData format
  function getQuoteDataForExport() {
    if (!quoteResult) return null;
    
    const storageSizeMW = Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) / 1000;
    const needsBackup = energyGoals.primaryGoal === 'backup-power' || energyGoals.primaryGoal === 'all';
    
    return {
      storageSizeMW,
      durationHours: 4, // Standard 4-hour duration for hotels
      solarMW: energyGoals.interestInSolar ? (energyGoals.solarKW / 1000) : 0,
      windMW: 0,
      generatorMW: needsBackup ? 0.25 : 0,
      location: hotelDetails.state,
      industryTemplate: 'hotel',
      gridConnection: gridConnection.status === 'off-grid' ? 'off-grid' : 
                      gridConnection.status === 'grid-backup-only' ? 'limited' : 'on-grid',
      totalProjectCost: quoteResult.costs.totalProjectCost,
      annualSavings: quoteResult.financials.annualSavings,
      paybackYears: quoteResult.financials.paybackYears,
      taxCredit: quoteResult.costs.taxCredit,
      netCost: quoteResult.costs.netCost,
      installationOption: 'epc',
      shippingOption: 'standard',
      financingOption: 'purchase',
      // New detailed cost breakdown
      equipmentCost: quoteResult.costs.equipmentCost,
      installationCost: quoteResult.costs.installationCost,
    };
  }
  
  // Helper to get equipment breakdown for export
  function getEquipmentBreakdownForExport() {
    if (!quoteResult) return null;
    
    // Transform equipment to the format expected by quoteExport
    const equipment = quoteResult.equipment;
    return {
      batteries: equipment?.batteries ? [equipment.batteries] : [],
      inverters: equipment?.inverters ? [equipment.inverters] : [],
      transformers: equipment?.transformers ? [equipment.transformers] : [],
      switchgear: equipment?.switchgear ? [equipment.switchgear] : [],
      solar: equipment?.solar,
      generators: equipment?.generators,
    };
  }
  
  function handleDownloadPDF() {
    const quoteData = getQuoteDataForExport();
    const equipment = getEquipmentBreakdownForExport();
    if (!quoteData || !equipment) return;
    
    generatePDF(quoteData, equipment);
    onComplete?.({ inputs: mergedInputs, hotelDetails, amenities, operations, energyGoals, calculatedPower, quoteResult });
  }
  
  async function handleDownloadWord() {
    const quoteData = getQuoteDataForExport();
    const equipment = getEquipmentBreakdownForExport();
    if (!quoteData || !equipment) return;
    
    await generateWord(quoteData, equipment);
  }
  
  function handleDownloadExcel() {
    const quoteData = getQuoteDataForExport();
    const equipment = getEquipmentBreakdownForExport();
    if (!quoteData || !equipment) return;
    
    generateExcel(quoteData, equipment);
  }

  // Run quote calculation when reaching final step
  // Always recalculate when entering final step to pick up any changes from previous steps
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      generateQuote();
    }
  }, [currentStep]);
  
  // Clear quote result when user navigates back from final step
  // This ensures slider changes will trigger a fresh calculation
  useEffect(() => {
    if (currentStep < WIZARD_STEPS.length - 1 && quoteResult) {
      setQuoteResult(null);
    }
  }, [currentStep]);
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return hotelDetails.numberOfRooms > 0;
      case 1: return true;
      case 2: return operations.avgOccupancy > 0;
      case 3: return true;
      case 4: return quoteResult !== null;
      default: return true;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl w-full max-w-4xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 16px)', height: '100%' }}>
        {/* Header - HIGH CONTRAST */}
        <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/30 to-purple-900/50 px-6 py-5 border-b-2 border-purple-500/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/20 rounded-xl border-2 border-purple-500/40 shadow-lg shadow-purple-500/20">
                <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  {quoteMode === 'select' ? 'Hotel Energy Quote Builder' : 
                   quoteMode === 'pro' ? 'Pro Mode: Direct Input' : 
                   'Build Your Hotel Quote'}
                </h2>
                <p className="text-base text-purple-300 font-medium">
                  {quoteMode === 'select' ? 'Choose how you want to build your quote' :
                   quoteMode === 'pro' ? 'Enter your specifications directly' :
                   `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* NEXT STEP BUTTON IN HEADER - Only show in guided mode */}
              {quoteMode === 'guided' && currentStep < WIZARD_STEPS.length - 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 border border-emerald-400/50"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {/* Advanced Options Toggle - Only show in guided mode */}
              {quoteMode === 'guided' && (
                <button
                  onClick={() => setPowerMode(!powerMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                    powerMode 
                      ? 'bg-amber-500/30 border-amber-400/60 text-amber-300 shadow-lg shadow-amber-500/20' 
                      : 'bg-gray-800/60 border-gray-600 text-gray-300 hover:border-amber-400/40 hover:text-amber-300'
                  }`}
                  title="Show advanced options for precise control"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Advanced</span>
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-gray-800/60 hover:bg-red-500/30 rounded-xl transition-all border border-gray-600 hover:border-red-500/50">
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
          
          {/* Progress Steps - Only show in guided mode */}
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-500/30 font-bold' 
                        : isComplete 
                          ? 'bg-purple-500/20 text-purple-300 cursor-pointer hover:bg-purple-500/30 border-purple-500/40 font-medium'
                          : 'bg-gray-800/40 text-gray-500 border-gray-700'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-sm hidden sm:inline">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isComplete ? 'bg-purple-500/60' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              ADVANCED OPTIONS PANEL - Shows when Advanced button is clicked
              Only visible in guided mode
              ═══════════════════════════════════════════════════════════════ */}
          {quoteMode === 'guided' && powerMode && (
            <div className="mt-3 bg-gradient-to-r from-amber-900/30 to-orange-900/20 rounded-xl p-4 border border-amber-500/40">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-amber-300">Advanced Options</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <label className="text-xs text-gray-400 mb-1 block">BESS Duration</label>
                  <select 
                    className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-600"
                    defaultValue="4"
                  >
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="6">6 hours</option>
                    <option value="8">8 hours</option>
                  </select>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <label className="text-xs text-gray-400 mb-1 block">Grid Services</label>
                  <select 
                    className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-600"
                    defaultValue="none"
                  >
                    <option value="none">None</option>
                    <option value="demand-response">Demand Response</option>
                    <option value="frequency-reg">Frequency Regulation</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <label className="text-xs text-gray-400 mb-1 block">Financing</label>
                  <select 
                    className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-600"
                    defaultValue="cash"
                  >
                    <option value="cash">Cash Purchase</option>
                    <option value="loan">Equipment Loan</option>
                    <option value="ppa">PPA / Lease</option>
                    <option value="pace">C-PACE</option>
                  </select>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <label className="text-xs text-gray-400 mb-1 block">ITC Credit</label>
                  <select 
                    className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1.5 border border-gray-600"
                    defaultValue="30"
                  >
                    <option value="0">None (0%)</option>
                    <option value="30">Standard (30%)</option>
                    <option value="40">+ Domestic (40%)</option>
                    <option value="50">+ Energy Community (50%)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-amber-200/60 mt-3">💡 These options affect your quote calculations and financing projections.</p>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              EQUIPMENT CART + ENERGY METRICS - Two separate buttons
              Only visible in guided mode when power is calculated
              ═══════════════════════════════════════════════════════════════ */}
          {quoteMode === 'guided' && calculatedPower.totalPeakKW > 0 && (
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
                    <span className="text-sm font-bold text-white">${calculatedPower.totalMonthlyCharges.toLocaleString()}/mo</span>
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
                  onClick={() => setShowPowerProfile(!showPowerProfile)}
                  className={`flex-1 flex items-center justify-between gap-2 bg-gray-800/60 hover:bg-gray-800/80 rounded-xl px-3 py-2 border transition-all ${
                    showPowerProfile ? 'border-purple-400/60 shadow-lg shadow-purple-500/20' : 'border-gray-700/50 hover:border-purple-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</span>
                    <span className="text-xs text-gray-400">selected</span>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-600/40 px-2 py-1 rounded-lg border border-purple-400/50">
                    <span className="text-xs font-bold text-purple-200">Cart</span>
                    <div className={`transition-transform ${showPowerProfile ? 'rotate-180' : ''}`}>
                      <ArrowRight className="w-3 h-3 text-purple-300 rotate-90" />
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
                    <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/30 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-purple-300 font-medium">Daily Usage</span>
                      </div>
                      <p className="text-2xl font-black text-white">{calculatedPower.dailyKWh.toLocaleString()} <span className="text-sm text-purple-300">kWh</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-xl p-4 border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm text-indigo-300 font-medium">Monthly Usage</span>
                      </div>
                      <p className="text-2xl font-black text-white">{calculatedPower.monthlyKWh.toLocaleString()} <span className="text-sm text-indigo-300">kWh</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/30 rounded-xl p-4 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                        <span className="text-sm text-amber-300 font-medium">Demand Charges</span>
                      </div>
                      <p className="text-2xl font-black text-white">${calculatedPower.monthlyDemandCharges.toLocaleString()}<span className="text-sm text-amber-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-300 font-medium">Energy Charges</span>
                      </div>
                      <p className="text-2xl font-black text-white">${calculatedPower.monthlyEnergyCharges.toLocaleString()}<span className="text-sm text-emerald-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-900/40 to-pink-900/30 rounded-xl p-4 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-red-300 font-medium">Total Bill</span>
                      </div>
                      <p className="text-2xl font-black text-white">${calculatedPower.totalMonthlyCharges.toLocaleString()}<span className="text-sm text-red-300">/mo</span></p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Battery className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-cyan-300 font-medium">BESS Arbitrage</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-400">+${calculatedPower.arbitrageSavingsPotential.toLocaleString()}<span className="text-sm text-cyan-300">/mo</span></p>
                    </div>
                  </div>
                  
                  {/* Peak Hours & Seasonality */}
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Peak Hours & Seasonality Impact
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Peak Hours</p>
                        <p className="text-lg font-bold text-amber-300">{operations.peakHoursStart}:00 - {operations.peakHoursEnd}:00</p>
                        <p className="text-xs text-gray-500">{calculatedPower.peakHoursDuration} hrs/day</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Peak Energy</p>
                        <p className="text-lg font-bold text-orange-300">{calculatedPower.peakEnergyKWh} kWh</p>
                        <p className="text-xs text-emerald-400">BESS discharges</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Off-Peak Energy</p>
                        <p className="text-lg font-bold text-blue-300">{calculatedPower.offPeakEnergyKWh} kWh</p>
                        <p className="text-xs text-cyan-400">BESS charges</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Seasonality</p>
                        <p className={`text-lg font-bold ${operations.seasonality === 'high' ? 'text-red-400' : operations.seasonality === 'moderate' ? 'text-yellow-400' : 'text-green-400'}`}>
                          {operations.seasonality.charAt(0).toUpperCase() + operations.seasonality.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">±{Math.round((calculatedPower.seasonalMultiplier - 1) * 100)}% swing</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* EQUIPMENT CART Popup - Shopping Cart Style */}
              {showPowerProfile && (
                <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl shadow-purple-500/30 p-5 z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Equipment Cart</h3>
                        <p className="text-xs text-gray-400">Your selections vs what you need</p>
                      </div>
                    </div>
                    <button onClick={() => setShowPowerProfile(false)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  
                  {/* Shopping Cart Grid - What You Need vs What You've Selected */}
                  <div className="space-y-4">
                    {/* Target (What You Need) */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-amber-400" />
                        <span className="text-sm font-bold text-amber-300">WHAT YOU NEED (Based on your hotel)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Peak Demand</p>
                          <p className="text-xl font-black text-white">{calculatedPower.totalPeakKW} kW</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Recommended BESS</p>
                          <p className="text-xl font-black text-amber-400">{Math.round(calculatedPower.totalPeakKW * 0.5)} kW</p>
                          <p className="text-xs text-gray-500">50% coverage</p>
                        </div>
                        <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Storage Capacity</p>
                          <p className="text-xl font-black text-amber-400">{Math.round(calculatedPower.totalPeakKW * 0.5 * 4)} kWh</p>
                          <p className="text-xs text-gray-500">4-hour duration</p>
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
                        {/* BESS */}
                        <div className="text-center p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                          <Battery className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 mb-1">BESS Power</p>
                          <p className="text-xl font-black text-emerald-400">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</p>
                          <p className="text-xs text-emerald-300">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100 * 4)} kWh</p>
                        </div>
                        
                        {/* Solar */}
                        {energyGoals.interestInSolar && (
                          <div className="text-center p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
                            <Sun className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">Solar Array</p>
                            <p className="text-xl font-black text-amber-400">{energyGoals.solarKW} kW</p>
                            <p className="text-xs text-amber-300">{(energyGoals.solarKW / 1000).toFixed(2)} MW</p>
                          </div>
                        )}
                        
                        {/* Generator */}
                        {operations.hasBackupGenerator && (
                          <div className="text-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
                            <Zap className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">Generator</p>
                            <p className="text-xl font-black text-orange-400">{operations.generatorKW} kW</p>
                            <p className="text-xs text-orange-300">Backup power</p>
                          </div>
                        )}
                        
                        {/* EV Chargers */}
                        {amenities.evCharging && (evConfig.numLevel1Ports + evConfig.numLevel2Ports + evConfig.numDCFCPorts > 0) && (
                          <div className="text-center p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                            <Car className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500 mb-1">EV Chargers</p>
                            <p className="text-xl font-black text-cyan-400">{evConfig.numLevel1Ports + evConfig.numLevel2Ports + evConfig.numDCFCPorts}</p>
                            <p className="text-xs text-cyan-300">ports total</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Coverage Progress Bar */}
                    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">Peak Demand Coverage</span>
                        <span className={`text-sm font-bold ${
                          (Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
                          (energyGoals.interestInSolar ? energyGoals.solarKW : 0) +
                          (operations.hasBackupGenerator ? operations.generatorKW : 0)) >= calculatedPower.totalPeakKW * 0.9
                            ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {Math.round((
                            (Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
                            (energyGoals.interestInSolar ? energyGoals.solarKW : 0) +
                            (operations.hasBackupGenerator ? operations.generatorKW : 0)) / calculatedPower.totalPeakKW
                          ) * 100)}% of {calculatedPower.totalPeakKW} kW
                        </span>
                      </div>
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
                            (energyGoals.interestInSolar ? energyGoals.solarKW : 0) +
                            (operations.hasBackupGenerator ? operations.generatorKW : 0)) >= calculatedPower.totalPeakKW * 0.9
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500' 
                              : 'bg-gradient-to-r from-amber-600 to-orange-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.round((
                              (Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
                              (energyGoals.interestInSolar ? energyGoals.solarKW : 0) +
                              (operations.hasBackupGenerator ? operations.generatorKW : 0)) / calculatedPower.totalPeakKW
                            ) * 100))}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>BESS: {Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</span>
                        {energyGoals.interestInSolar && <span>Solar: {energyGoals.solarKW} kW</span>}
                        {operations.hasBackupGenerator && <span>Generator: {operations.generatorKW} kW</span>}
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
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Get your quote in 30 seconds</span>
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
                  className="group relative bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-purple-900/30 rounded-3xl p-8 border-2 border-purple-500/40 hover:border-purple-400 transition-all transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 text-left"
                >
                  <div className="absolute top-4 right-4 bg-purple-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-purple-300">GUIDED</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-3">Help Me Build My Specs</h4>
                  <p className="text-purple-200/80 mb-4">
                    Answer simple questions about your hotel and we'll calculate your power requirements automatically.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Step-by-step guided experience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Smart recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Perfect for first-timers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Learn as you go</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-purple-400 font-bold group-hover:translate-x-2 transition-transform">
                    <span>Start Guided Wizard</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
              
              {/* Helper Text */}
              <div className="text-center mt-8">
                <p className="text-gray-500 text-sm">
                  💡 Not sure? The <span className="text-purple-400 font-medium">Guided Wizard</span> will help you discover what you need.
                  <br/>
                  Already have a site survey or utility data? Try <span className="text-amber-400 font-medium">Pro Mode</span> for faster quotes.
                </p>
              </div>
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════════
              PRO MODE - Redirect to Advanced Builder
              Shows a clean transition screen before redirecting
              ════════════════════════════════════════════════════════════════ */}
          {quoteMode === 'pro' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
              {/* Pro Mode Redirect Screen */}
              <div className="text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-amber-500/40">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full mb-4">
                  <span className="text-amber-300 font-bold">PRO MODE</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-3">Advanced Quote Builder</h3>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  You'll be taken to our full-featured quote builder where you can enter exact specifications, 
                  upload documents, and access advanced financial modeling.
                </p>
              </div>
              
              {/* Feature List */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-white font-medium">Direct Input</p>
                  <p className="text-xs text-gray-500">Enter kW, kWh, rates</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-white font-medium">Upload Bills</p>
                  <p className="text-xs text-gray-500">Auto-extract data</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                  <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-white font-medium">Financial Models</p>
                  <p className="text-xs text-gray-500">NPV, IRR, DSCR</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
                  <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white font-medium">Export Reports</p>
                  <p className="text-xs text-gray-500">Word, Excel, PDF</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setQuoteMode('select')}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all border border-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => {
                    // Close wizard and redirect to Advanced Quote Builder - Custom Config view
                    onClose();
                    // Navigate to main page with advanced=true and view=custom-config
                    window.location.href = '/?advanced=true&vertical=hotel&view=custom-config';
                  }}
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 border border-amber-400/50"
                >
                  <span>Open Advanced Builder</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-500 text-sm">
                💡 Your hotel vertical preferences will be pre-loaded
              </p>
            </div>
          )}
          
          {/* ════════════════════════════════════════════════════════════════
              GUIDED MODE - Original Step-by-Step Wizard
              ════════════════════════════════════════════════════════════════ */}
          {quoteMode === 'guided' && (
            <>
          {/* Step 0: WHO ARE YOU? - Simple and Clean */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['who']} 
                colorScheme="purple"
              />

              {/* User Role Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  I am a...
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'owner', icon: '🏨', name: 'Owner/Operator', desc: 'I own or manage a hotel' },
                    { key: 'investor', icon: '💼', name: 'Investor / REIT', desc: 'Evaluating investments' },
                    { key: 'developer', icon: '🏗️', name: 'Developer', desc: 'Planning new properties' },
                    { key: 'explorer', icon: '🔍', name: 'Just Exploring', desc: 'Curious about the numbers' },
                  ].map((role) => (
                    <button
                      key={role.key}
                      onClick={() => setUserRole(role.key)}
                      className={`p-4 rounded-xl border-2 text-center transition-all transform hover:scale-[1.02] ${
                        userRole === role.key 
                          ? 'border-purple-400 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 shadow-lg shadow-purple-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                      }`}
                    >
                      <span className="text-3xl">{role.icon}</span>
                      <p className="font-bold text-white text-base mt-2">{role.name}</p>
                      <p className="text-sm text-gray-400">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Location Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10">
                <label className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <MapPin className="w-6 h-6 text-indigo-400" />
                  </div>
                  Hotel Location (State)
                </label>
                <select
                  value={hotelDetails.state}
                  onChange={(e) => setHotelDetails({...hotelDetails, state: e.target.value})}
                  className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl px-4 py-4 text-white text-lg font-medium focus:border-indigo-400 focus:outline-none"
                >
                  {Object.keys(STATE_RATES).map((state) => (
                    <option key={state} value={state} className="bg-slate-800">{state}</option>
                  ))}
                </select>
                <div className="mt-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-sm text-gray-300">
                    💡 <span className="text-indigo-400 font-bold">${STATE_RATES[hotelDetails.state as keyof typeof STATE_RATES]?.rate.toFixed(2)}/kWh</span> electricity rate • 
                    <span className="text-purple-400 font-bold"> ${STATE_RATES[hotelDetails.state as keyof typeof STATE_RATES]?.demandCharge}/kW</span> demand charge
                  </p>
                </div>
              </div>
              
              {/* ⚡ GRID CONNECTION STATUS - Key question from Microsoft AI Head */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  Grid Connection Status
                </h4>
                <p className="text-gray-300 text-sm mb-4">How does your hotel currently connect to the electrical grid?</p>
                
                {/* Connection Type */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { key: 'grid-tied', icon: '🔌', name: 'Grid-Tied', desc: 'Connected to utility grid' },
                    { key: 'grid-backup-only', icon: '🔋', name: 'Grid as Backup', desc: 'Grid for emergencies only' },
                    { key: 'off-grid', icon: '🏝️', name: 'Off-Grid', desc: 'No grid connection' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setGridConnection({...gridConnection, status: option.key as any})}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        gridConnection.status === option.key 
                          ? 'border-amber-400 bg-amber-600/20 shadow-lg shadow-amber-500/20' 
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <p className="font-bold text-white text-sm mt-1">{option.name}</p>
                      <p className="text-xs text-gray-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
                
                {/* Grid Reliability - Only show if grid-tied */}
                {gridConnection.status === 'grid-tied' && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <p className="text-white font-bold text-sm">How reliable is your grid connection?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { key: 'reliable', label: '✅ Very Reliable', desc: 'Rarely any outages' },
                        { key: 'occasional-outages', label: '⚠️ Occasional Issues', desc: 'Few outages/year' },
                        { key: 'frequent-outages', label: '🔴 Frequent Outages', desc: 'Monthly issues' },
                        { key: 'unreliable', label: '❌ Unreliable', desc: 'Constant problems' },
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setGridConnection({...gridConnection, gridReliability: option.key as any})}
                          className={`p-2 rounded-lg border text-center transition-all text-xs ${
                            gridConnection.gridReliability === option.key 
                              ? 'border-amber-400 bg-amber-600/20' 
                              : 'border-gray-600 hover:border-gray-500 bg-gray-800/60'
                          }`}
                        >
                          <p className="font-bold text-white">{option.label}</p>
                          <p className="text-gray-400">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                    
                    {/* Grid concerns checkboxes */}
                    <div className="flex flex-wrap gap-4 mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gridConnection.gridCostConcern}
                          onChange={(e) => setGridConnection({...gridConnection, gridCostConcern: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-white text-sm">💰 Grid electricity is too expensive</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gridConnection.wantGridIndependence}
                          onChange={(e) => setGridConnection({...gridConnection, wantGridIndependence: e.target.checked})}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-white text-sm">🔓 I want more energy independence</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 📄 DOCUMENT UPLOAD - For Merlin AI Analysis */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                <h4 className="text-xl font-black text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <FileText className="w-6 h-6 text-cyan-400" />
                  </div>
                  Upload Documents (Optional)
                </h4>
                <p className="text-gray-300 text-sm mb-4">
                  Help Merlin give you a more accurate quote by uploading your utility bills, equipment specs, or site plans.
                </p>
                
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-cyan-500/40 rounded-xl p-6 text-center hover:border-cyan-400 hover:bg-cyan-500/5 transition-all cursor-pointer"
                  onClick={() => document.getElementById('doc-upload')?.click()}
                >
                  <input
                    id="doc-upload"
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        const newDocs = Array.from(files).map(f => ({
                          name: f.name,
                          type: f.type,
                          size: f.size
                        }));
                        setUploadedDocs([...uploadedDocs, ...newDocs]);
                      }
                    }}
                  />
                  <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                  <p className="text-white font-bold">Click to upload or drag & drop</p>
                  <p className="text-gray-400 text-sm mt-1">PDF, Excel, Word, or images up to 10MB</p>
                </div>
                
                {/* Uploaded Files List */}
                {uploadedDocs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-cyan-300 font-bold">Uploaded files:</p>
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span className="text-white text-sm">{doc.name}</span>
                          <span className="text-gray-500 text-xs">({(doc.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => setUploadedDocs(uploadedDocs.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Document types hint */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-center">
                    <span className="text-cyan-400">📊</span>
                    <p className="text-gray-300">Utility Bills</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-center">
                    <span className="text-cyan-400">📋</span>
                    <p className="text-gray-300">Equipment Specs</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-center">
                    <span className="text-cyan-400">🗺️</span>
                    <p className="text-gray-300">Site Plans</p>
                  </div>
                </div>
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 0 */}
              <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-purple-300/50 animate-pulse hover:animate-none"
                >
                  <span>🏨 Continue to Hotel Details</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-purple-300 text-sm mt-3 font-medium">
                  Step 1 of 5 • Takes about 2 minutes
                </p>
              </div>
            </div>
          )}
          
          {/* Step 1: YOUR HOTEL (Type, Size, Amenities) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['what']} 
                colorScheme="purple"
              />
              
              {/* Hotel Class - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                  Hotel Class
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(HOTEL_CLASS_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setHotelDetails({...hotelDetails, hotelClass: key as any})}
                      className={`p-5 rounded-2xl text-left transition-all transform hover:scale-[1.02] ${
                        hotelDetails.hotelClass === key
                          ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-400 shadow-lg shadow-purple-500/20'
                          : 'bg-gray-800/60 border-2 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className="font-black text-white text-lg">{profile.name}</p>
                      <p className="text-sm text-gray-300 mt-1">{profile.kWhPerRoom} kWh/room/day</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Number of Rooms - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10">
                <h4 className="text-xl font-black text-white mb-4">🏨 Number of Rooms</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={25}
                    max={500}
                    step={25}
                    value={hotelDetails.numberOfRooms}
                    onChange={(e) => setHotelDetails({...hotelDetails, numberOfRooms: parseInt(e.target.value)})}
                    className="flex-1 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="bg-gray-800/80 rounded-xl px-5 py-3 text-center min-w-[120px] border-2 border-indigo-500/40">
                    <span className="text-4xl font-black text-indigo-400">{hotelDetails.numberOfRooms}</span>
                    <span className="text-indigo-300 text-base ml-2 font-medium">rooms</span>
                  </div>
                </div>
              </div>
              
              {/* Building Age - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                <h4 className="text-xl font-black text-white mb-4">🏗️ Building Age / Efficiency</h4>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'new', label: 'New (2015+)', efficiency: 'Very Efficient' },
                    { id: 'modern', label: 'Modern (2000-2014)', efficiency: 'Efficient' },
                    { id: 'older', label: 'Older (1980-1999)', efficiency: 'Average' },
                    { id: 'historic', label: 'Historic (<1980)', efficiency: 'Less Efficient' },
                  ].map((age) => (
                    <button
                      key={age.id}
                      onClick={() => setHotelDetails({...hotelDetails, buildingAge: age.id as any})}
                      className={`p-3 rounded-xl text-center transition-all border-2 ${
                        hotelDetails.buildingAge === age.id
                          ? 'bg-cyan-600/30 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800/60 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{age.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Power Summary - HIGH CONTRAST */}
              <div className="bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-pink-600/20 rounded-2xl p-5 border-2 border-purple-500/40 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">Room Base Load</p>
                    <p className="text-3xl font-black text-white">{calculatedPower.basePeakKW} kW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">Amenities</p>
                    <p className="text-3xl font-black text-purple-400">+{calculatedPower.amenityPeakKW} kW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-medium">Total Peak</p>
                    <p className="text-3xl font-black text-pink-400">{calculatedPower.totalPeakKW} kW</p>
                  </div>
                </div>
              </div>
              
              {/* Amenity Selection - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
                <h4 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  Select Your Amenities
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(HOTEL_AMENITY_SPECS).map(([key, spec]) => {
                    const Icon = AMENITY_ICONS[key as HotelAmenity];
                    const isEnabled = amenities[key as keyof typeof amenities];
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setAmenities({...amenities, [key]: !isEnabled})}
                        className={`p-4 rounded-xl text-left transition-all flex items-center gap-4 transform hover:scale-[1.01] ${
                          isEnabled
                            ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                            : 'bg-gray-800/60 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-gray-700'}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white text-base">{spec.name}</p>
                          <p className="text-sm text-gray-400">+{spec.peakKW} kW peak</p>
                        </div>
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-emerald-400 bg-emerald-500' : 'border-gray-500 bg-gray-700'}`}>
                          {isEnabled && <Check className="w-5 h-5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* ═══════════════════════════════════════════════════════════════
                    EV CHARGING CONFIGURATION - Shows when EV Charging is selected
                    ═══════════════════════════════════════════════════════════════ */}
                {amenities.evCharging && (
                  <div className="mt-6 p-5 bg-gradient-to-br from-cyan-900/30 to-teal-900/20 rounded-xl border-2 border-cyan-500/40">
                    <h5 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <Car className="w-5 h-5 text-cyan-400" />
                      Configure Your EV Charging
                    </h5>
                    
                    {/* Charging Strategy */}
                    <div className="mb-4">
                      <label className="text-sm text-cyan-200 font-medium mb-2 block">What's your charging strategy?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'guest-amenity', label: 'Guest Amenity', desc: 'Free for guests' },
                          { key: 'revenue-generating', label: 'Paid Charging', desc: 'Revenue source' },
                          { key: 'fleet', label: 'Fleet/Shuttle', desc: 'Hotel vehicles' },
                        ].map(option => (
                          <button
                            key={option.key}
                            onClick={() => setEvConfig({...evConfig, chargingStrategy: option.key as any})}
                            className={`p-3 rounded-lg text-center transition-all ${
                              evConfig.chargingStrategy === option.key
                                ? 'bg-cyan-600/40 border-2 border-cyan-400 text-white'
                                : 'bg-gray-800/60 border border-gray-600 text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            <p className="font-bold text-sm">{option.label}</p>
                            <p className="text-xs text-gray-400">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Level 1 Chargers (Basic) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-cyan-200 font-medium">Level 1 Ports (Basic - 1.4 kW)</label>
                        <span className="text-xs text-gray-400">Best for: Overnight guests, employee parking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={evConfig.numLevel1Ports}
                          onChange={(e) => setEvConfig({...evConfig, numLevel1Ports: parseInt(e.target.value)})}
                          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <span className="text-xl font-black text-white w-12 text-right">{evConfig.numLevel1Ports}</span>
                      </div>
                      {evConfig.numLevel1Ports > 0 && (
                        <p className="text-xs text-green-400 mt-1">
                          {(evConfig.numLevel1Ports * 1.4).toFixed(1)} kW total • ~{evConfig.numLevel1Ports * 8} kWh daily (overnight charging)
                        </p>
                      )}
                    </div>
                    
                    {/* Level 2 Chargers */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-cyan-200 font-medium mb-2 block">Level 2 Charger Ports (7-22 kW)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={evConfig.numLevel2Ports}
                            onChange={(e) => setEvConfig({...evConfig, numLevel2Ports: parseInt(e.target.value)})}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <span className="text-xl font-black text-white w-12 text-right">{evConfig.numLevel2Ports}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-cyan-200 font-medium mb-2 block">Power per L2 Port</label>
                        <div className="grid grid-cols-4 gap-1">
                          {[7, 11, 19, 22].map(kw => (
                            <button
                              key={kw}
                              onClick={() => setEvConfig({...evConfig, level2Power: kw as any})}
                              className={`py-2 px-2 rounded text-sm font-bold transition-all ${
                                evConfig.level2Power === kw
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {kw} kW
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* DC Fast Chargers */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-cyan-200 font-medium mb-2 block">DC Fast Charger Ports (50-350 kW)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={evConfig.numDCFCPorts}
                            onChange={(e) => setEvConfig({...evConfig, numDCFCPorts: parseInt(e.target.value)})}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <span className="text-xl font-black text-white w-12 text-right">{evConfig.numDCFCPorts}</span>
                        </div>
                      </div>
                      {evConfig.numDCFCPorts > 0 && (
                        <div>
                          <label className="text-sm text-cyan-200 font-medium mb-2 block">DCFC Power</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[50, 150, 350].map(kw => (
                              <button
                                key={kw}
                                onClick={() => setEvConfig({...evConfig, dcfcPower: kw as any})}
                                className={`py-2 px-3 rounded text-sm font-bold transition-all ${
                                  evConfig.dcfcPower === kw
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {kw} kW
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* EV Summary */}
                    <div className="mt-4 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total EV Power Demand:</span>
                        <span className="font-bold text-cyan-400">
                          {((evConfig.numLevel1Ports * 1.4) + (evConfig.numLevel2Ports * evConfig.level2Power) + (evConfig.numDCFCPorts * evConfig.dcfcPower)).toFixed(1)} kW
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-400">Estimated Daily Usage:</span>
                        <span className="font-bold text-white">
                          {Math.round((evConfig.numLevel1Ports * 1.4 * 8) + (evConfig.numLevel2Ports * evConfig.level2Power * 4) + (evConfig.numDCFCPorts * evConfig.dcfcPower * 2))} kWh
                        </span>
                      </div>
                      {(evConfig.numLevel1Ports > 0 || evConfig.numLevel2Ports > 0 || evConfig.numDCFCPorts > 0) && (
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                          {evConfig.numLevel1Ports > 0 && <span className="mr-3">L1: {evConfig.numLevel1Ports} ports</span>}
                          {evConfig.numLevel2Ports > 0 && <span className="mr-3">L2: {evConfig.numLevel2Ports} ports</span>}
                          {evConfig.numDCFCPorts > 0 && <span>DCFC: {evConfig.numDCFCPorts} ports</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 1 */}
              <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-purple-300/50"
                >
                  <span>⚙️ Continue to Operations</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-purple-300 text-sm mt-3 font-medium">
                  Step 2 of 5 • Almost there!
                </p>
              </div>
            </div>
          )}
          
          {/* Step 2: Operations - HIGH CONTRAST */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['how']} 
                colorScheme="purple"
              />
              
              {/* Occupancy - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h4 className="text-xl font-black text-white mb-4">📊 Average Occupancy Rate</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={30}
                    max={95}
                    step={5}
                    value={operations.avgOccupancy}
                    onChange={(e) => setOperations({...operations, avgOccupancy: parseInt(e.target.value)})}
                    className="flex-1 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="bg-gray-800/80 rounded-xl px-5 py-3 text-center min-w-[100px] border-2 border-purple-500/40">
                    <span className="text-4xl font-black text-purple-400">{operations.avgOccupancy}</span>
                    <span className="text-purple-300 text-lg ml-1">%</span>
                  </div>
                </div>
              </div>
              
              {/* Seasonality - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10">
                <h4 className="text-xl font-black text-white mb-4">🌡️ Seasonal Demand Variation</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'low', label: 'Low', desc: 'Steady year-round' },
                    { id: 'moderate', label: 'Moderate', desc: 'Some seasonal peaks' },
                    { id: 'high', label: 'High', desc: 'Strong seasonal swings' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setOperations({...operations, seasonality: s.id as any})}
                      className={`p-4 rounded-xl text-center transition-all border-2 transform hover:scale-[1.02] ${
                        operations.seasonality === s.id
                          ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-800/60 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <p className="font-bold text-white text-lg">{s.label}</p>
                      <p className="text-sm text-gray-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Existing Generator - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                <label className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={operations.hasBackupGenerator}
                    onChange={(e) => setOperations({...operations, hasBackupGenerator: e.target.checked})}
                    className="w-6 h-6 accent-amber-500 rounded"
                  />
                  <div>
                    <span className="text-lg font-bold text-white">⚡ Has Existing Backup Generator</span>
                    <p className="text-sm text-gray-400">Battery can supplement or replace diesel generators</p>
                  </div>
                </label>
                
                {operations.hasBackupGenerator && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <label className="text-sm text-gray-300 font-medium">Generator Capacity (kW)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={operations.generatorKW || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOperations({...operations, generatorKW: Math.min(2000, parseInt(val) || 0)});
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-gray-800 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-lg font-medium mt-2 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
              
              {/* Cost Preview - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl p-6 border-2 border-pink-500/40 shadow-xl">
                <h4 className="font-black text-white text-lg mb-4">💰 Current Monthly Energy Costs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-pink-500/30">
                    <p className="text-3xl font-black text-pink-400">${calculatedPower.monthlyDemandCharges.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Demand Charges</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-indigo-500/30">
                    <p className="text-3xl font-black text-indigo-400">${calculatedPower.monthlyEnergyCharges.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-1">Energy Charges</p>
                  </div>
                </div>
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 2 */}
              <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-purple-300/50"
                >
                  <span>🎯 Continue to Energy Goals</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-purple-300 text-sm mt-3 font-medium">
                  Step 3 of 5 • Set your savings targets
                </p>
              </div>
            </div>
          )}
          
          {/* Step 3: Energy Goals */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <WizardStepHelp
                content={HOTEL_STEP_HELP['goals']}
                colorScheme="indigo"
              />
              {/* Energy Goals Header - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10">
                <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Target className="w-7 h-7 text-purple-400" />
                  </div>
                  Energy Goals
                </h3>
                <p className="text-gray-300">What matters most to your hotel?</p>
              
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {[
                    { id: 'cost-savings', label: 'Cut Energy Costs', desc: 'Reduce demand charges 30-40%', icon: TrendingDown },
                    { id: 'backup-power', label: 'Backup Power', desc: 'Never lose power to guests', icon: Battery },
                    { id: 'sustainability', label: 'Sustainability', desc: 'Meet ESG goals & guest expectations', icon: Sun },
                    { id: 'all', label: 'All of the Above', desc: 'Maximum value from storage', icon: Sparkles },
                  ].map((goal) => {
                    const Icon = goal.icon;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setEnergyGoals({...energyGoals, primaryGoal: goal.id as any})}
                        className={`p-5 rounded-xl text-left transition-all transform hover:scale-[1.02] ${
                          energyGoals.primaryGoal === goal.id 
                            ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-400 shadow-lg shadow-purple-500/20' 
                            : 'bg-gray-800/60 border-2 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${energyGoals.primaryGoal === goal.id ? 'bg-purple-500' : 'bg-gray-700'}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{goal.label}</p>
                            <p className="text-sm text-gray-400">{goal.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Target Savings - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10">
                <h4 className="text-xl font-black text-white mb-4">🎯 Target Savings</h4>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={20}
                    max={60}
                    step={5}
                    value={energyGoals.targetSavingsPercent}
                    onChange={(e) => setEnergyGoals({...energyGoals, targetSavingsPercent: parseInt(e.target.value)})}
                    className="flex-1 h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="bg-gray-800/80 rounded-xl px-5 py-3 text-center min-w-[100px] border-2 border-indigo-500/40">
                    <span className="text-4xl font-black text-indigo-400">{energyGoals.targetSavingsPercent}</span>
                    <span className="text-indigo-300 text-lg ml-1">%</span>
                  </div>
                </div>
              </div>
              
              {/* Solar Option - HIGH CONTRAST */}
              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                <label className="flex items-center gap-4 mb-4">
                  <input
                    type="checkbox"
                    checked={energyGoals.interestInSolar}
                    onChange={(e) => setEnergyGoals({...energyGoals, interestInSolar: e.target.checked})}
                    className="w-6 h-6 accent-amber-500 rounded"
                  />
                  <div>
                    <span className="text-lg font-bold text-white">☀️ Add Solar Panels</span>
                    <p className="text-sm text-gray-400">Generate your own power, appeal to eco-conscious guests</p>
                  </div>
                </label>
                
                {energyGoals.interestInSolar && (
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <label className="text-sm text-gray-300 font-medium">Available Roof Area (sq ft)</label>
                    <div className="flex items-center gap-4 mt-2">
                      <input
                        type="range"
                        min={10}
                        max={2000}
                        step={10}
                        value={energyGoals.solarKW}
                        onChange={(e) => setEnergyGoals({...energyGoals, solarKW: parseInt(e.target.value)})}
                        className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{energyGoals.solarKW.toLocaleString()} kW</p>
                        <p className="text-amber-400 font-bold">{(energyGoals.solarKW / 1000).toFixed(2)} MW solar</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* PROMINENT NEXT BUTTON - Step 3 */}
              <div className="mt-8 pt-6 border-t-2 border-purple-500/30">
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
          
          {/* Step 4: Review Quote */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <WizardStepHelp
                content={HOTEL_STEP_HELP['quote']}
                colorScheme="indigo"
              />
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold text-lg">Calculating your custom quote...</p>
                </div>
              ) : quoteResult ? (
                <>
                  {/* Quote Header */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <h3 className="text-3xl font-black text-white">Your Hotel Battery Storage Quote</h3>
                      <TrueQuoteBadge size="md" />
                    </div>
                    <p className="text-gray-300 text-lg">{hotelDetails.numberOfRooms} rooms • {HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name} • {hotelDetails.state}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-purple-600/40 via-indigo-600/30 to-pink-600/40 rounded-2xl p-8 border-4 border-purple-400 text-center shadow-2xl shadow-purple-500/30">
                    <p className="text-purple-200 uppercase tracking-widest text-sm font-black mb-3">🏨 Annual Savings</p>
                    <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 drop-shadow-lg">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      BASELINE COMPARISON - Grid Only vs BESS vs BESS+Solar
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-blue-500/40 shadow-xl shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Gauge className="w-7 h-7 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Compare Your Options</h4>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full font-bold">BASELINE COMPARISON</span>
                    </div>
                    
                    {/* Comparison Grid - 3 Options */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Option 1: Grid Only (Current State) */}
                      <div className="bg-gray-800/60 rounded-xl p-5 border-2 border-gray-600 relative">
                        <div className="absolute -top-3 left-4 bg-gray-600 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                          CURRENT
                        </div>
                        <div className="text-center pt-2">
                          <span className="text-4xl">🔌</span>
                          <h5 className="font-black text-white text-lg mt-2">Grid Only</h5>
                          <p className="text-gray-400 text-sm">No changes</p>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Demand:</span>
                            <span className="text-red-400 font-bold">${calculatedPower.monthlyDemandCharges.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Energy:</span>
                            <span className="text-red-400 font-bold">${calculatedPower.monthlyEnergyCharges.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-700">
                            <span className="text-gray-300 font-bold">Annual Cost:</span>
                            <span className="text-red-400 font-black text-lg">
                              ${((calculatedPower.monthlyDemandCharges + calculatedPower.monthlyEnergyCharges) * 12).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-2 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
                          <p className="text-red-300 text-xs">❌ No savings • No backup • No ESG</p>
                        </div>
                      </div>
                      
                      {/* Option 2: BESS Only */}
                      <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-xl p-5 border-2 border-purple-500/50 relative">
                        <div className="absolute -top-3 left-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          BESS
                        </div>
                        <div className="text-center pt-2">
                          <span className="text-4xl">🔋</span>
                          <h5 className="font-black text-white text-lg mt-2">Battery Storage</h5>
                          <p className="text-purple-300 text-sm">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW / {Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100 * 4)} kWh</p>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Demand:</span>
                            <span className="text-emerald-400 font-bold">
                              ${Math.round(calculatedPower.monthlyDemandCharges * (1 - energyGoals.targetSavingsPercent/100)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Energy:</span>
                            <span className="text-emerald-400 font-bold">
                              ${Math.round(calculatedPower.monthlyEnergyCharges * 0.85).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-purple-500/30">
                            <span className="text-gray-300 font-bold">Annual Savings:</span>
                            <span className="text-emerald-400 font-black text-lg">
                              ${Math.round(quoteResult.financials.annualSavings * (energyGoals.interestInSolar ? 0.7 : 1)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30 text-center">
                          <p className="text-purple-300 text-xs">✅ Peak shaving • ✅ Backup • ⚡ Arbitrage</p>
                        </div>
                      </div>
                      
                      {/* Option 3: BESS + Solar (RECOMMENDED) */}
                      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-xl p-5 border-2 border-emerald-400 relative shadow-lg shadow-emerald-500/20">
                        <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> RECOMMENDED
                        </div>
                        <div className="text-center pt-2">
                          <span className="text-4xl">☀️🔋</span>
                          <h5 className="font-black text-white text-lg mt-2">BESS + Solar</h5>
                          <p className="text-emerald-300 text-sm">
                            {energyGoals.interestInSolar ? `${Math.round(energyGoals.solarKW)} kW solar` : 'Add solar for max savings'}
                          </p>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Demand:</span>
                            <span className="text-emerald-400 font-bold">
                              ${Math.round(calculatedPower.monthlyDemandCharges * (1 - energyGoals.targetSavingsPercent/100) * 0.9).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Monthly Energy:</span>
                            <span className="text-emerald-400 font-bold">
                              ${Math.round(calculatedPower.monthlyEnergyCharges * 0.6).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-emerald-500/30">
                            <span className="text-gray-300 font-bold">Annual Savings:</span>
                            <span className="text-emerald-400 font-black text-lg">
                              ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-center">
                          <p className="text-emerald-300 text-xs">✅ All benefits • ✅ ESG • ✅ Max ROI</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 25-Year Comparison */}
                    <div className="mt-5 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <p className="text-white font-bold text-center mb-3">25-Year Cost Comparison</p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-red-400 font-black text-xl">
                            ${((calculatedPower.monthlyDemandCharges + calculatedPower.monthlyEnergyCharges) * 12 * 25 / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-gray-400 text-xs">Grid Only</p>
                        </div>
                        <div>
                          <p className="text-purple-400 font-black text-xl">
                            ${(((calculatedPower.monthlyDemandCharges + calculatedPower.monthlyEnergyCharges) * 12 - quoteResult.financials.annualSavings * 0.7) * 25 / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-gray-400 text-xs">BESS Only</p>
                        </div>
                        <div>
                          <p className="text-emerald-400 font-black text-xl">
                            ${(((calculatedPower.monthlyDemandCharges + calculatedPower.monthlyEnergyCharges) * 12 - quoteResult.financials.annualSavings) * 25 / 1000000).toFixed(1)}M
                          </p>
                          <p className="text-gray-400 text-xs">BESS + Solar</p>
                        </div>
                      </div>
                      <p className="text-center text-emerald-300 font-bold mt-3">
                        💰 Save ${(quoteResult.financials.annualSavings * 25 / 1000000).toFixed(1)}M over 25 years with BESS + Solar
                      </p>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      QUOTE NAMEPLATE - Professional Header
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 border border-white/20 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Merlin BESS Quote</p>
                        <h3 className="text-xl font-bold text-white mt-1">
                          {mergedInputs.businessName || 'Hotel'} Energy Storage Project
                        </h3>
                        <p className="text-sm text-purple-200/70 mt-1">
                          {hotelDetails.state} • {HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name} • {hotelDetails.numberOfRooms} rooms
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-purple-200/50">Quote Date</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                        <p className="text-xs text-purple-200/50 mt-2">Quote ID</p>
                        <p className="text-purple-400 font-mono text-sm">HT-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    {/* Nameplate Key Specs */}
                    <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">
                          {Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW
                        </p>
                        <p className="text-xs text-white/60">BESS Power</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-400">
                          {quoteResult.equipment.batteries.unitEnergyMWh >= 1 
                            ? `${quoteResult.equipment.batteries.unitEnergyMWh.toFixed(1)} MWh` 
                            : `${Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000)} kWh`}
                        </p>
                        <p className="text-xs text-white/60">Storage</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-400">
                          {energyGoals.interestInSolar ? `${Math.round(energyGoals.solarKW)} kW` : '—'}
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
                      BESS EQUIPMENT BREAKDOWN
                      ═══════════════════════════════════════════════════════════════ */}
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
                          <span className="text-xl font-black text-purple-400">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Energy Capacity:</span>
                          <span className="text-xl font-black text-indigo-400">
                            {quoteResult.equipment.batteries.unitEnergyMWh >= 1 
                              ? `${quoteResult.equipment.batteries.unitEnergyMWh.toFixed(2)} MWh` 
                              : `${Math.round(quoteResult.equipment.batteries.unitEnergyMWh * 1000)} kWh`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 font-medium">Runtime at Peak:</span>
                          <span className="text-lg font-bold text-white">4 hours</span>
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
                          <span className="text-gray-300 font-medium">Warranty:</span>
                          <span className="text-lg font-bold text-emerald-400">10 Years</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      SAVINGS BREAKDOWN
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
                      <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                            <span className="text-lg font-bold text-white">Demand Charge Reduction</span>
                          </div>
                          <span className="text-2xl font-black text-purple-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.50).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-4 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~50% of total • Peak shaving during high-demand periods</p>
                      </div>
                      
                      {/* Energy Arbitrage */}
                      <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-800/20 rounded-xl p-4 border border-indigo-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                            <span className="text-lg font-bold text-white">Energy Arbitrage (TOU)</span>
                          </div>
                          <span className="text-2xl font-black text-indigo-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.30).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-4 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~30% of total • Charge off-peak, discharge on-peak</p>
                      </div>
                      
                      {/* Backup Power Value */}
                      <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/20 rounded-xl p-4 border border-pink-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50"></div>
                            <span className="text-lg font-bold text-white">Backup Power / Resilience</span>
                          </div>
                          <span className="text-2xl font-black text-pink-400">
                            ${Math.round(quoteResult.financials.annualSavings * 0.20).toLocaleString()}/yr
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-pink-600 to-pink-400 h-4 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-medium">~20% of total • Critical systems during outages</p>
                      </div>
                    </div>
                    
                    {/* Total Savings */}
                    <div className="bg-gradient-to-r from-emerald-800/40 to-green-700/30 rounded-xl p-5 border-2 border-emerald-400/50 flex justify-between items-center">
                      <span className="text-xl font-black text-white">Total Annual Savings</span>
                      <span className="text-4xl font-black text-emerald-400">
                        ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}/yr
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats Grid - ROI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-center border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10">
                      <p className="text-4xl font-black text-indigo-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-sm text-indigo-200 font-medium">Year Payback</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-center border-2 border-purple-500/50 shadow-lg shadow-purple-500/10">
                      <p className="text-4xl font-black text-purple-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                      <p className="text-sm text-purple-200 font-medium">25-Year ROI</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-center border-2 border-pink-500/50 shadow-lg shadow-pink-500/10">
                      <p className="text-4xl font-black text-pink-400">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</p>
                      <p className="text-sm text-pink-200 font-medium">Battery Size</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-center border-2 border-amber-500/50 shadow-lg shadow-amber-500/10">
                      <p className="text-4xl font-black text-amber-400">${Math.round(quoteResult.costs.netCost).toLocaleString()}</p>
                      <p className="text-sm text-amber-200 font-medium">Net Cost</p>
                    </div>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/10">
                    <h4 className="font-black text-xl text-white mb-4">💰 Investment Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-300">Equipment Cost</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-300">Installation</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-t-2 border-gray-700 text-xl">
                        <span className="text-white font-bold">Total Project Cost</span>
                        <span className="text-white font-black">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg text-emerald-400">
                        <span className="font-medium">Federal Tax Credit (30%)</span>
                        <span className="font-bold">-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-4 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-xl px-4 text-xl border-2 border-purple-400/50">
                        <span className="text-purple-200 font-black">NET COST</span>
                        <span className="text-purple-300 font-black text-2xl">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ═══════════════════════════════════════════════════════════════
                      EQUIPMENT AMORTIZATION / DEPRECIATION
                      ═══════════════════════════════════════════════════════════════ */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <TrendingDown className="w-7 h-7 text-amber-400" />
                      </div>
                      <h4 className="text-xl font-black text-white">Equipment Depreciation & Tax Benefits</h4>
                    </div>
                    
                    {/* MACRS 5-Year Depreciation Schedule */}
                    <div className="mb-6">
                      <h5 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">MACRS 5-Year Depreciation (Solar/BESS)</h5>
                      <div className="bg-gray-800/60 rounded-xl p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-gray-400 font-medium">Year</th>
                              <th className="text-right py-2 text-gray-400 font-medium">Rate</th>
                              <th className="text-right py-2 text-gray-400 font-medium">Depreciation</th>
                              <th className="text-right py-2 text-gray-400 font-medium">Tax Savings*</th>
                              <th className="text-right py-2 text-gray-400 font-medium">Book Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { year: 1, rate: 20.00, name: 'Year 1' },
                              { year: 2, rate: 32.00, name: 'Year 2' },
                              { year: 3, rate: 19.20, name: 'Year 3' },
                              { year: 4, rate: 11.52, name: 'Year 4' },
                              { year: 5, rate: 11.52, name: 'Year 5' },
                              { year: 6, rate: 5.76, name: 'Year 6' }
                            ].reduce((acc, item, idx) => {
                              const depreciableBasis = quoteResult.costs.totalProjectCost * 0.85; // 85% depreciable after ITC
                              const depreciation = depreciableBasis * (item.rate / 100);
                              const taxSavings = depreciation * 0.21; // 21% corporate tax rate
                              const cumDepreciation = acc.length > 0 
                                ? acc[idx - 1].cumDep + depreciation 
                                : depreciation;
                              const bookValue = depreciableBasis - cumDepreciation;
                              acc.push({ ...item, depreciation, taxSavings, bookValue, cumDep: cumDepreciation });
                              return acc;
                            }, [] as any[]).map((row, idx) => (
                              <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                <td className="py-2 text-white font-medium">{row.name}</td>
                                <td className="py-2 text-right text-gray-300">{row.rate.toFixed(2)}%</td>
                                <td className="py-2 text-right text-amber-400 font-medium">${Math.round(row.depreciation).toLocaleString()}</td>
                                <td className="py-2 text-right text-emerald-400 font-medium">${Math.round(row.taxSavings).toLocaleString()}</td>
                                <td className="py-2 text-right text-gray-400">${Math.round(row.bookValue).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-amber-500/30">
                              <td className="py-3 text-amber-300 font-bold">Total</td>
                              <td className="py-3 text-right text-gray-300">100%</td>
                              <td className="py-3 text-right text-amber-400 font-bold">${Math.round(quoteResult.costs.totalProjectCost * 0.85).toLocaleString()}</td>
                              <td className="py-3 text-right text-emerald-400 font-bold">${Math.round(quoteResult.costs.totalProjectCost * 0.85 * 0.21).toLocaleString()}</td>
                              <td className="py-3 text-right text-gray-500">$0</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">*Tax savings assume 21% corporate tax rate. Actual savings depend on your tax situation.</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/20 rounded-xl p-4 border border-amber-500/30">
                        <p className="text-sm text-amber-300 font-medium">Depreciable Basis</p>
                        <p className="text-2xl font-black text-white">${Math.round(quoteResult.costs.totalProjectCost * 0.85).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">85% of cost (after 30% ITC)</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-xl p-4 border border-emerald-500/30">
                        <p className="text-sm text-emerald-300 font-medium">Total Tax Savings</p>
                        <p className="text-2xl font-black text-emerald-400">${Math.round(quoteResult.costs.totalProjectCost * 0.85 * 0.21).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Over 6-year MACRS period</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 rounded-xl p-4 border border-indigo-500/30">
                        <p className="text-sm text-indigo-300 font-medium">Effective Cost Reduction</p>
                        <p className="text-2xl font-black text-indigo-400">
                          ${Math.round(quoteResult.costs.taxCredit + quoteResult.costs.totalProjectCost * 0.85 * 0.21).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">ITC + Depreciation benefits</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Options - HIGH CONTRAST */}
                  <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl p-6 border-2 border-gray-600 shadow-xl">
                    <h4 className="font-black text-xl text-white mb-4">📥 Download Your Quote</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <button onClick={handleDownloadPDF} className="flex flex-col items-center gap-3 bg-red-600/30 hover:bg-red-600/50 border-2 border-red-400 text-white py-5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/20">
                        <File className="w-10 h-10 text-red-400" />
                        <span className="font-bold">PDF</span>
                      </button>
                      <button onClick={handleDownloadWord} className="flex flex-col items-center gap-3 bg-blue-600/30 hover:bg-blue-600/50 border-2 border-blue-400 text-white py-5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
                        <FileText className="w-10 h-10 text-blue-400" />
                        <span className="font-bold">Word</span>
                      </button>
                      <button onClick={handleDownloadExcel} className="flex flex-col items-center gap-3 bg-emerald-600/30 hover:bg-emerald-600/50 border-2 border-emerald-400 text-white py-5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20">
                        <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
                        <span className="font-bold">Excel</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA - ULTRA HIGH CONTRAST */}
                  {onRequestConsultation && (
                    <button
                      onClick={onRequestConsultation}
                      className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white py-5 rounded-xl font-black text-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-white/20"
                    >
                      <Phone className="w-6 h-6" />
                      Schedule a Consultation
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
            </>
          )}
        </div>
        
        {/* Footer Navigation - HIGH CONTRAST */}
        <div className="border-t-2 border-purple-500/30 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              if (quoteMode === 'select') {
                onClose();
              } else if (quoteMode === 'pro') {
                setQuoteMode('select');
              } else if (currentStep === 0) {
                setQuoteMode('select');
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
            className="flex items-center gap-2 px-5 py-3 text-white hover:text-purple-300 transition-colors font-medium border-2 border-gray-700 hover:border-purple-500/50 rounded-xl bg-gray-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
            {quoteMode === 'select' ? 'Cancel' : quoteMode === 'pro' ? 'Back' : currentStep === 0 ? 'Back' : 'Back'}
          </button>
          
          <div className="flex items-center gap-4">
            {/* Concierge Help Button */}
            <button
              onClick={() => setShowConciergeHelp(true)}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600/30 hover:bg-purple-600/50 border-2 border-purple-400 text-purple-300 hover:text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20"
              title="Need help? Talk to our concierge"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">Need Help?</span>
            </button>
            
            {quoteMode === 'guided' && currentStep < WIZARD_STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 border-2 border-purple-400/50 disabled:border-gray-600"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Concierge Help Modal - HIGH CONTRAST */}
        {showConciergeHelp && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 p-6">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 rounded-2xl p-8 max-w-md border-2 border-purple-400 shadow-2xl shadow-purple-500/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-400">
                  <Sparkles className="w-7 h-7 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Merlin Concierge</h3>
                  <p className="text-purple-200 text-sm font-medium">We're here to help</p>
                </div>
              </div>
              <p className="text-white text-lg mb-5">
                Need guidance? Our energy experts can help you:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-purple-100 font-medium">
                  <Check className="w-5 h-5 text-emerald-400" /> Understand your hotel's energy profile
                </li>
                <li className="flex items-center gap-3 text-purple-100 font-medium">
                  <Check className="w-5 h-5 text-emerald-400" /> Size your battery system correctly
                </li>
                <li className="flex items-center gap-3 text-purple-100 font-medium">
                  <Check className="w-5 h-5 text-emerald-400" /> Navigate financing & incentives
                </li>
                <li className="flex items-center gap-3 text-purple-100 font-medium">
                  <Check className="w-5 h-5 text-emerald-400" /> Connect with vetted installers
                </li>
              </ul>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConciergeHelp(false)}
                  className="flex-1 px-5 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition-colors border-2 border-gray-600 font-bold"
                >
                  Continue on my own
                </button>
                <button
                  onClick={() => {
                    setShowConciergeHelp(false);
                    onRequestConsultation?.();
                  }}
                  className="flex-1 px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black transition-colors border-2 border-purple-400 shadow-lg shadow-purple-500/30"
                >
                  Talk to Expert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Power Gauge Widget - Always visible in bottom right */}
      {calculatedPower.totalPeakKW > 0 && (
        <PowerGaugeWidget
          data={{
            bessKW: Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100),
            bessKWh: Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100 * 4), // 4hr duration for hotels
            peakDemandKW: calculatedPower.totalPeakKW,
            solarKW: energyGoals.interestInSolar ? Math.round(energyGoals.solarKW) : 0,
            generatorKW: operations.hasBackupGenerator ? operations.generatorKW : 0,
            powerGapKW: Math.max(0, calculatedPower.totalPeakKW - (
              Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
              (energyGoals.interestInSolar ? Math.round(energyGoals.solarKW) : 0) +
              (operations.hasBackupGenerator ? operations.generatorKW : 0)
            )),
            isGapMet: (
              Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
              (energyGoals.interestInSolar ? Math.round(energyGoals.solarKW) : 0) +
              (operations.hasBackupGenerator ? operations.generatorKW : 0)
            ) >= calculatedPower.totalPeakKW * 0.9,
          }}
          position="fixed"
        />
      )}
    </div>
  );
}
