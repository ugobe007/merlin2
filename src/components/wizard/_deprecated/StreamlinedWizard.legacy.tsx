/**
 * STREAMLINED SMART WIZARD
 * =========================
 * 
 * NEW UX: Auto-advancing sections without "Next" buttons
 * Combines Welcome + Location into seamless first experience
 * 
 * Flow:
 * 1. Welcome + Location (combined) - auto-advances when location selected
 * 2. Industry Selection - auto-advances when industry selected
 * 3. Facility Details - custom questions per industry
 * 4. Goals & Add-ons - what user wants to achieve
 * 5. System Configuration - battery + solar sizing
 * 6. Quote Results - final quote with downloads
 * 
 * Features:
 * - Fixed PowerProfileTracker sidebar
 * - Smooth transitions between sections
 * - Gamification: points, levels, achievements
 * - "Powered by Merlin" branding
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Sparkles, MapPin, Building2, Target, Settings, FileText,
  CheckCircle, ArrowRight, ArrowLeft, Zap, Sun, Battery, DollarSign,
  ChevronDown, ExternalLink, Car, Hotel, Droplets, TrendingDown,
  Shield, Clock, Download, Phone, Leaf, Gauge, Plus, Minus,
  AlertTriangle, Info, FileSpreadsheet, Mail, Wind, Fuel, Upload, Wand2,
  Crown, Star
} from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { calculateUseCasePower, type PowerCalculationResult } from '@/services/useCasePowerCalculations';
import { calculateEVHubCosts } from '@/services/evChargingCalculations';
import { 
  getBatteryPricing,
  getSolarPricing,
  getWindPricing,
  getGeneratorPricing
} from '@/services/unifiedPricingService';
import { useCaseService } from '@/services/useCaseService';
import { 
  getGeographicRecommendations, 
  getStateFromZipCode,
  getRegionalElectricityRate,
  type GeographicRecommendation 
} from '@/services/geographicIntelligenceService';
import PowerProfileTracker, { WIZARD_SECTIONS } from './PowerProfileTracker';
import PowerGapIndicator from './PowerGapIndicator';
import { PowerDashboardWidget, type PowerDashboardData } from './widgets';
// NOTE: DataCenterQuestionnaire removed Dec 9, 2025 - Data centers now use standard wizard flow
// import { DataCenterQuestionnaire, type DataCenterConfig } from '@/components/modals/DataCenterQuestionnaire';
import { useWizardState } from '@/hooks/useWizardState';
import { 
  generatePremiumConfiguration, 
  calculatePremiumComparison,
  type PremiumConfiguration 
} from '@/services/premiumConfigurationService';
import { createRFQ, type CreateRFQData } from '@/services/vendorService';
import { generatePDF, generateWord, generateExcel } from '@/utils/quoteExport';
import { QuoteComplianceFooter, MethodologyStatement } from '@/components/shared/IndustryComplianceBadges';
import { TrueQuoteBadge, TrueQuoteBanner } from '@/components/shared/TrueQuoteBadge';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// TYPES
// ============================================

interface StreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
  // Support for vertical landing pages (hotel, car-wash, ev-charging)
  // When provided, wizard auto-selects the use case and skips to Section 3
  initialUseCase?: string;  // e.g., 'hotel', 'car-wash', 'ev-charging'
  initialState?: string;    // US state (e.g., 'California')
  initialData?: Record<string, any>;  // Pre-filled answers (e.g., { numberOfRooms: 150 })
}

interface WizardState {
  // Section 1: Location
  zipCode: string;
  state: string;
  geoRecommendations: GeographicRecommendation | null;
  electricityRate: number;
  
  // Section 2: Industry
  selectedIndustry: string;
  industryName: string;
  useCaseId: string; // UUID from database
  
  // Section 3: Facility Details - dynamic from database
  customQuestions: any[]; // Fetched from custom_questions table
  useCaseData: Record<string, any>; // Answers to custom questions
  facilitySize: number; // sq ft or rooms or kW depending on industry
  
  // Section 4: Goals
  goals: string[];
  wantsSolar: boolean;
  wantsWind: boolean;
  wantsGenerator: boolean;
  wantsBackupPower: boolean;
  wantsEVCharging: boolean;
  
  // Existing EV chargers (current infrastructure)
  hasExistingEV: boolean | null;
  existingEVL1: number;
  existingEVL2: number;
  existingEVL3: number;
  existingEVPowerSource: 'grid' | 'solar-grid' | 'solar-only' | 'generator';
  
  // Wind turbines
  windTurbineKW: number; // Total wind capacity
  
  // Backup generator
  generatorKW: number;   // Generator capacity
  generatorFuel: 'diesel' | 'natural-gas' | 'propane'; // Default: 'natural-gas' (Dec 2025 SSOT)
  generatorType: 'traditional' | 'linear'; // Traditional (Cummins/Cat) vs Linear (Mainspring)
  
  // Grid connection status (for SSOT compliance)
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
  // Section 5: Configuration
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  durationHours: number;
  
  // EV Chargers
  evChargersL1: number;   // Level 1 chargers (1.4 kW)
  evChargersL2: number;   // Level 2 chargers (7-22 kW)
  evChargersDCFC: number; // DC Fast Chargers / Level 3 (50-150 kW)
  evChargersHPC: number;  // High Power Chargers (250-350 kW)
  
  // Section 6: Quote
  quoteResult: QuoteResult | null;
  isCalculating: boolean;
  
  // Real-time cost estimates
  estimatedCost: {
    battery: number;
    solar: number;
    wind: number;
    generator: number;
    evChargers: number;
    evChargersL1: number;  // Itemized L1 cost
    evChargersL2: number;  // Itemized L2 cost
    evChargersDCFC: number; // Itemized DCFC cost
    evChargersHPC: number;  // Itemized HPC cost
    installation: number;
    total: number;
  };
}

// ============================================
// GOAL OPTIONS
// ============================================

const GOAL_OPTIONS = [
  { id: 'cost-savings', label: 'Cut Energy Costs', icon: TrendingDown, description: 'Reduce demand charges & energy bills' },
  { id: 'backup-power', label: 'Backup Power', icon: Shield, description: 'Keep operations running during outages' },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, description: 'Meet ESG goals & reduce carbon footprint' },
  { id: 'grid-independence', label: 'Grid Independence', icon: Zap, description: 'Reduce reliance on utility grid' },
  { id: 'demand-management', label: 'Peak Shaving', icon: Gauge, description: 'Flatten peak demand spikes' },
];

// ============================================
// FACILITY SIZE PRESETS BY INDUSTRY
// ============================================

const FACILITY_PRESETS: Record<string, { label: string; unit: string; presets: number[]; default: number }> = {
  'office': { label: 'Office Size', unit: 'sq ft', presets: [10000, 25000, 50000, 100000], default: 25000 },
  'datacenter': { label: 'IT Load', unit: 'kW', presets: [100, 500, 1000, 5000], default: 500 },
  'hotel': { label: 'Number of Rooms', unit: 'rooms', presets: [50, 100, 200, 400], default: 150 },
  'manufacturing': { label: 'Facility Size', unit: 'sq ft', presets: [25000, 50000, 100000, 250000], default: 50000 },
  'retail': { label: 'Store Size', unit: 'sq ft', presets: [5000, 15000, 30000, 75000], default: 15000 },
  'airport': { label: 'Annual Passengers', unit: 'million', presets: [1, 5, 15, 40], default: 5 },
  'car-wash': { label: 'Wash Bays', unit: 'bays', presets: [2, 4, 6, 10], default: 4 },
  'ev-charging': { label: 'Charging Ports', unit: 'ports', presets: [4, 10, 20, 50], default: 10 },
  'hospital': { label: 'Beds', unit: 'beds', presets: [50, 150, 300, 600], default: 150 },
  'college': { label: 'Students', unit: 'students', presets: [1000, 5000, 15000, 40000], default: 5000 },
  'data-center': { label: 'IT Load', unit: 'kW', presets: [100, 500, 1000, 5000], default: 500 },
  'default': { label: 'Facility Size', unit: 'sq ft', presets: [10000, 25000, 50000, 100000], default: 25000 },
};

// ============================================
// US STATES LIST
// ============================================

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// ============================================
// SPECIALIZED VERTICALS
// ============================================

const SPECIALIZED_VERTICALS = [
  { 
    id: 'car-wash', 
    name: 'Car Wash', 
    icon: Droplets, 
    url: '/carwashenergy',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-400',
    description: 'Bay-specific calculations'
  },
  { 
    id: 'ev-charging', 
    name: 'EV Charging Hub', 
    icon: Car, 
    url: '/evchargingenergy',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-400',
    description: 'DCFC demand solutions'
  },
  { 
    id: 'hotel', 
    name: 'Hotel & Hospitality', 
    icon: Hotel, 
    url: '/hotelenergy',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-400',
    description: 'Guest experience + backup'
  },
];

// ============================================
// INDUSTRY ICONS
// ============================================

const INDUSTRY_ICONS: Record<string, React.ElementType> = {
  'datacenter': Battery,
  'office': Building2,
  'manufacturing': Settings,
  'retail': DollarSign,
  'default': Zap,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format power value with intelligent kW/MW display
 * Shows kW for values under 1000, MW for larger values
 */
const formatPower = (kw: number): string => {
  if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
  return `${kw.toFixed(0)} kW`;
};

/**
 * Get appropriate step size based on current value
 * Provides more granular control at smaller values
 */
const getStepSize = (current: number): number => {
  if (current < 100) return 10;
  if (current < 500) return 25;
  if (current < 1000) return 50;
  if (current < 5000) return 100;
  if (current < 10000) return 250;
  if (current < 50000) return 500;
  return 1000;
};

/**
 * SOLAR/WIND POWER PRESETS
 * BUG FIX: Using preset breakpoints instead of linear slider (0-1,000,000 was too compressed)
 * This gives much better UX for selecting realistic power values in kW range
 */
// SOLAR PRESETS: 74% kW options for SMB, 26% MW options for commercial/utility
const SOLAR_POWER_PRESETS = [
  { label: '5 kW', value: 5 },
  { label: '10 kW', value: 10 },
  { label: '15 kW', value: 15 },
  { label: '20 kW', value: 20 },
  { label: '25 kW', value: 25 },
  { label: '30 kW', value: 30 },
  { label: '40 kW', value: 40 },
  { label: '50 kW', value: 50 },
  { label: '75 kW', value: 75 },
  { label: '100 kW', value: 100 },
  { label: '150 kW', value: 150 },
  { label: '200 kW', value: 200 },
  { label: '250 kW', value: 250 },
  { label: '300 kW', value: 300 },
  { label: '400 kW', value: 400 },
  { label: '500 kW', value: 500 },
  { label: '750 kW', value: 750 },
  { label: '1 MW', value: 1000 },
  { label: '2 MW', value: 2000 },
  { label: '5 MW', value: 5000 },
  { label: '10 MW', value: 10000 },
  { label: '25 MW', value: 25000 },
  { label: '50 MW', value: 50000 },
];

// WIND PRESETS: Similar granularity for small-scale wind
const WIND_POWER_PRESETS = [
  { label: '5 kW', value: 5 },
  { label: '10 kW', value: 10 },
  { label: '15 kW', value: 15 },
  { label: '20 kW', value: 20 },
  { label: '25 kW', value: 25 },
  { label: '50 kW', value: 50 },
  { label: '75 kW', value: 75 },
  { label: '100 kW', value: 100 },
  { label: '150 kW', value: 150 },
  { label: '200 kW', value: 200 },
  { label: '250 kW', value: 250 },
  { label: '500 kW', value: 500 },
  { label: '750 kW', value: 750 },
  { label: '1 MW', value: 1000 },
  { label: '2 MW', value: 2000 },
  { label: '5 MW', value: 5000 },
  { label: '10 MW', value: 10000 },
  { label: '25 MW', value: 25000 },
];

/**
 * Find the closest preset index for a given value
 */
const findClosestPresetIndex = (value: number, presets: typeof SOLAR_POWER_PRESETS): number => {
  let closestIndex = 0;
  let closestDiff = Math.abs(presets[0].value - value);
  
  for (let i = 1; i < presets.length; i++) {
    const diff = Math.abs(presets[i].value - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function StreamlinedWizard({ 
  show, 
  onClose, 
  onFinish,
  onOpenAdvanced,
  initialUseCase,
  initialState,
  initialData
}: StreamlinedWizardProps) {
  // Current section (0-5)
  // If initialUseCase provided, start at Section 3 (Facility Details) = index 2
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Track if we initialized from vertical landing page
  const [initializedFromVertical, setInitializedFromVertical] = useState(false);
  const [verticalInitComplete, setVerticalInitComplete] = useState(false);
  
  // Wizard data state
  const [wizardState, setWizardState] = useState<WizardState>({
    zipCode: '',
    state: '',
    geoRecommendations: null,
    electricityRate: 0.12,
    selectedIndustry: '',
    industryName: '',
    useCaseId: '',
    customQuestions: [],
    useCaseData: {},
    facilitySize: 25000,
    goals: [],
    wantsSolar: false,
    wantsWind: false,
    wantsGenerator: false,
    wantsBackupPower: false,
    wantsEVCharging: false,
    hasExistingEV: null,
    existingEVL1: 0,
    existingEVL2: 0,
    existingEVL3: 0,
    existingEVPowerSource: 'grid',
    windTurbineKW: 0,
    generatorKW: 0,
    generatorFuel: 'natural-gas',
    generatorType: 'traditional',
    gridConnection: 'on-grid',
    batteryKW: 0,
    batteryKWh: 0,
    solarKW: 0,
    durationHours: 4,
    evChargersL1: 0,
    evChargersL2: 0,
    evChargersDCFC: 0,
    evChargersHPC: 0,
    quoteResult: null,
    isCalculating: false,
    estimatedCost: {
      battery: 0,
      solar: 0,
      wind: 0,
      generator: 0,
      evChargers: 0,
      evChargersL1: 0,
      evChargersL2: 0,
      evChargersDCFC: 0,
      evChargersHPC: 0,
      installation: 0,
      total: 0,
    },
  });
  
  // Available use cases from database
  const [availableUseCases, setAvailableUseCases] = useState<any[]>([]);
  const [isLoadingUseCases, setIsLoadingUseCases] = useState(true);
  
  // Refs for auto-scroll
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Power Profile Explainer modal state
  const [showPowerProfileExplainer, setShowPowerProfileExplainer] = useState(false);
  
  // NOTE: DataCenterQuestionnaire modal removed Dec 9, 2025 - Data centers now use standard wizard flow
  // const [showDataCenterModal, setShowDataCenterModal] = useState(false);
  
  // MERLIN Premium state
  const [showPremiumView, setShowPremiumView] = useState(false);
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfiguration | null>(null);
  const [premiumComparison, setPremiumComparison] = useState<{
    standard: { totalCost: number; breakdown: Record<string, number> };
    premium: { totalCost: number; breakdown: Record<string, number> };
    delta: { totalCost: number; percentage: number };
    valueProposition: string[];
  } | null>(null);
  
  // RFQ (Vendor Quote Request) state - SSOT workflow
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [rfqType, setRfqType] = useState<'standard' | 'premium'>('standard');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [rfqForm, setRfqForm] = useState({
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectTimeline: 'immediate' as 'immediate' | '3-months' | '6-months' | '12-months'
  });
  
  // ════════════════════════════════════════════════════════════════
  // CENTRALIZED STATE INTEGRATION
  // This provides calculated values for Power Profile display
  // ════════════════════════════════════════════════════════════════
  const {
    wizardState: centralizedState,
    setWizardState: setCentralizedState,
    updateSection,
    updateExistingInfra,
    updateEVChargers,
    updateNewEVChargers,
    resetState: resetCentralizedState,
  } = useWizardState();
  
  // Track previous show state to detect open/close transitions
  const prevShowRef = useRef(show);
  
  // Track if vertical initialization has been done (prevents infinite loops)
  const verticalInitDoneRef = useRef(false);
  
  // Reset wizard state ONLY when opening fresh (show changes false→true)
  // NOT on every render where show=true
  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    const isNowShown = show;
    prevShowRef.current = show;
    
    // Reset vertical init flag when wizard closes (so it can re-init on next open)
    if (!isNowShown) {
      verticalInitDoneRef.current = false;
      return;
    }
    
    // Only reset when transitioning from closed to open
    // AND when NOT coming from a vertical landing page (which has its own init)
    if (wasHidden && isNowShown && !initialUseCase) {
      console.log('🔄 [Wizard] Opening fresh - resetting state');
      setCurrentSection(0);
      setCompletedSections([]);
      setTotalPoints(0);
      setInitializedFromVertical(false);
      setVerticalInitComplete(false);
      setWizardState({
        zipCode: '',
        state: '',
        geoRecommendations: null,
        electricityRate: 0.12,
        selectedIndustry: '',
        industryName: '',
        useCaseId: '',
        customQuestions: [],
        useCaseData: {},
        facilitySize: 25000,
        goals: [],
        wantsSolar: false,
        wantsWind: false,
        wantsGenerator: false,
        wantsBackupPower: false,
        wantsEVCharging: false,
        hasExistingEV: null,
        existingEVL1: 0,
        existingEVL2: 0,
        existingEVL3: 0,
        existingEVPowerSource: 'grid',
        windTurbineKW: 0,
        generatorKW: 0,
        generatorFuel: 'natural-gas',
        generatorType: 'traditional',
        gridConnection: 'on-grid',
        batteryKW: 0,
        batteryKWh: 0,
        solarKW: 0,
        durationHours: 4,
        evChargersL1: 0,
        evChargersL2: 0,
        evChargersDCFC: 0,
        evChargersHPC: 0,
        quoteResult: null,
        isCalculating: false,
        estimatedCost: {
          battery: 0,
          solar: 0,
          wind: 0,
          generator: 0,
          evChargers: 0,
          evChargersL1: 0,
          evChargersL2: 0,
          evChargersDCFC: 0,
          evChargersHPC: 0,
          installation: 0,
          total: 0,
        },
      });
      resetCentralizedState();
    }
  }, [show, initialUseCase, resetCentralizedState]);
  
  // Sync facility size to centralized state (only when NOT using custom questions)
  useEffect(() => {
    // Skip if custom questions are providing the data
    // Custom questions write to useCaseData, which has its own sync effect
    const hasCustomQuestionData = wizardState.customQuestions.length > 0 && 
      Object.keys(wizardState.useCaseData).length > 0;
    
    if (hasCustomQuestionData) {
      console.log('📊 [SYNC] Facility size skipped - using useCaseData instead');
      return;
    }
    
    const roomBasedIndustries = ['hotel', 'hotel-hospitality', 'apartment', 'senior-living'];
    const isRoomBased = roomBasedIndustries.includes(wizardState.selectedIndustry.toLowerCase());
    
    console.log('📊 [SYNC] Facility size changing (no custom questions):', {
      facilitySize: wizardState.facilitySize,
      selectedIndustry: wizardState.selectedIndustry,
      isRoomBased,
      targetField: isRoomBased ? 'roomCount' : 'squareFeet',
    });
    
    if (isRoomBased) {
      updateSection('facility', {
        roomCount: wizardState.facilitySize,
        squareFeet: 0,
      });
    } else {
      updateSection('facility', {
        squareFeet: wizardState.facilitySize,
        roomCount: 0,
      });
    }
  }, [wizardState.facilitySize, wizardState.selectedIndustry, wizardState.customQuestions, wizardState.useCaseData, updateSection]);
  
  // ════════════════════════════════════════════════════════════════
  // SYNC: useCaseData (custom questions) → centralized state
  // This handles industries that use custom questions (hotel, hospital, etc.)
  // ════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Map custom question fields to centralized state fields
    const data = wizardState.useCaseData;
    
    console.log('📊 [SYNC] useCaseData changing:', {
      useCaseData: data,
      selectedIndustry: wizardState.selectedIndustry,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Sync FULL useCaseData to centralized state
    // This ensures industry-specific fields (annualPassengers, gamingSpaceSqFt)
    // are available to calculateBuildingLoad() in useWizardState
    // ═══════════════════════════════════════════════════════════════════════
    setCentralizedState(prev => ({
      ...prev,
      useCaseData: { ...prev.useCaseData, ...data },
    }));
    
    // Only sync individual fields if we have useCaseData (from custom questions)
    if (!data || Object.keys(data).length === 0) return;
    
    // Extract room count (hotels, apartments, senior living)
    const roomCount = data.roomCount || data.numberOfRooms || data.rooms || 0;
    
    // Extract bed count (hospitals)
    const bedCount = data.bedCount || data.beds || 0;
    
    // Extract rack count (data centers)
    const rackCount = data.rackCount || data.racks || data.itLoadKW || 0;
    
    // Extract square feet (offices, retail, etc.)
    const squareFeet = data.squareFeet || data.facilitySqFt || data.buildingSqFt || 0;
    
    // Extract bay count (car wash)
    const bayCount = data.washBays || data.bayCount || data.numBays || 0;
    
    // Extract unit count (apartments)
    const unitCount = data.unitCount || data.numUnits || data.apartments || 0;
    
    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL: Extract EV charger counts from template questions
    // This syncs template inputs → wizardState.evChargers* → Power Profile
    // Field names in database vary - check all possible names
    // ═══════════════════════════════════════════════════════════════════════
    const dcfcCount = data.numberOfDCFastChargers || data.dcfc_chargers || data.dcfcChargers || data.dcFastChargers || data.dc_fast_chargers || data.numDCFC || 0;
    const level2Count = data.numberOfLevel2Chargers || data.level2_chargers || data.l2Chargers || data.level2Chargers || data.numL2 || data.level_2_chargers || 0;
    const level1Count = data.numberOfLevel1Chargers || data.level1_chargers || data.l1Chargers || data.level1Chargers || 0;
    const hpcCount = data.hpc_chargers || data.hpcChargers || data.numHPC || 0;
    
    console.log('📊 [SYNC] Extracted from useCaseData:', {
      roomCount, bedCount, rackCount, squareFeet, bayCount, unitCount,
      evChargers: { dcfcCount, level2Count, level1Count, hpcCount }
    });
    
    // Update centralized state with ALL extracted values
    // The SSOT will use whichever is appropriate for the industry
    updateSection('facility', {
      roomCount: roomCount || undefined,
      squareFeet: squareFeet || undefined,
      bedCount: bedCount || undefined,
      rackCount: rackCount || undefined,
      bayCount: bayCount || undefined,
      unitCount: unitCount || undefined,
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // Sync EV charger counts from template questions to wizard state
    // CRITICAL FIX Dec 2025: For ev-charging use case, template chargers are 
    // EXISTING infrastructure, NOT new chargers to add. For other use cases,
    // chargers specified in templates are NEW additions (e.g., hotel adding EV).
    // ═══════════════════════════════════════════════════════════════════════
    const isEVChargingUseCase = wizardState.selectedIndustry === 'ev-charging' || 
                                wizardState.selectedIndustry === 'ev_charging' ||
                                wizardState.industryName?.toLowerCase().includes('ev charging');
    
    if (dcfcCount > 0 || level2Count > 0 || level1Count > 0 || hpcCount > 0) {
      if (isEVChargingUseCase) {
        // For EV Charging Station use case: chargers are EXISTING infrastructure
        // - Pre-fill "existing" charger fields (L1, L2, L3/DCFC)
        // - Mark hasExistingEV = true to skip the redundant question
        // - Do NOT set evChargersL2/DCFC (those are for NEW chargers to add)
        console.log('📊 [EV-CHARGING] Treating template chargers as EXISTING infrastructure');
        setWizardState(prev => ({
          ...prev,
          hasExistingEV: true,
          existingEVL1: level1Count || prev.existingEVL1,
          existingEVL2: level2Count || prev.existingEVL2,
          existingEVL3: (dcfcCount + hpcCount) || prev.existingEVL3, // DCFC + HPC go to L3
          // Don't touch evChargersL2, evChargersDCFC, evChargersHPC - those are NEW
        }));
      } else {
        // For non-EV use cases (hotel, office, etc.): chargers are NEW additions
        setWizardState(prev => ({
          ...prev,
          evChargersDCFC: dcfcCount || prev.evChargersDCFC,
          evChargersL2: level2Count || prev.evChargersL2,
          evChargersHPC: hpcCount || prev.evChargersHPC,
        }));
      }
    }
    
  }, [wizardState.useCaseData, wizardState.selectedIndustry, wizardState.industryName, updateSection]);
  
  // Sync industry to centralized state
  useEffect(() => {
    console.log('📊 [SYNC] Industry changing:', {
      selectedIndustry: wizardState.selectedIndustry,
      industryName: wizardState.industryName,
    });
    updateSection('industry', {
      type: wizardState.selectedIndustry,
    });
  }, [wizardState.selectedIndustry, updateSection]);
  
  // Sync EV chargers to centralized state (BOTH existing and new)
  // ⚠️ CRITICAL: Must set addEVChargers flag AND calculate power correctly!
  useEffect(() => {
    // Calculate actual NEW EV power (DCFC=100kW, HPC=350kW - NOT combined!)
    const newL2Power = wizardState.evChargersL2 * 11;
    const newDCFCPower = wizardState.evChargersDCFC * 100;
    const newHPCPower = wizardState.evChargersHPC * 350;
    const totalNewEVPower = newL2Power + newDCFCPower + newHPCPower;
    const hasNewEVChargers = wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0;
    
    console.log('📊 [SYNC] EV chargers changing:', {
      existing: { L1: wizardState.existingEVL1, L2: wizardState.existingEVL2, L3: wizardState.existingEVL3 },
      new: { L2: wizardState.evChargersL2, DCFC: wizardState.evChargersDCFC, HPC: wizardState.evChargersHPC },
      calculatedPower: { newL2Power, newDCFCPower, newHPCPower, totalNewEVPower },
      addEVChargersFlag: hasNewEVChargers,
    });
    
    // Sync EXISTING chargers to existingInfrastructure
    updateEVChargers('L1', { count: wizardState.existingEVL1 || 0, powerKW: 1.4 });
    updateEVChargers('L2', { count: wizardState.existingEVL2 || 0, powerKW: 11 });
    updateEVChargers('L3', { count: wizardState.existingEVL3 || 0, powerKW: 100 });
    
    // ⚠️ FIX: Set addEVChargers flag AND calculate L2/L3 power correctly
    // L2 chargers stay as L2 (11 kW each)
    // DCFC + HPC must be converted to equivalent L3 count at weighted average power
    // To preserve accuracy: store total power, not count × fixed rate
    const totalFastChargerCount = wizardState.evChargersDCFC + wizardState.evChargersHPC;
    const avgFastChargerPower = totalFastChargerCount > 0 
      ? (newDCFCPower + newHPCPower) / totalFastChargerCount 
      : 150; // default if none
    
    updateNewEVChargers('L2', { count: wizardState.evChargersL2, powerKW: 11 });
    updateNewEVChargers('L3', { count: totalFastChargerCount, powerKW: Math.round(avgFastChargerPower) });
    
    // ⚠️ CRITICAL FIX: Set the addEVChargers flag so calculateNewEVLoad() doesn't return 0!
    updateSection('goals', { addEVChargers: hasNewEVChargers });
    
  }, [
    wizardState.existingEVL1, wizardState.existingEVL2, wizardState.existingEVL3,
    wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC,
    updateEVChargers, updateNewEVChargers, updateSection
  ]);
  
  // Sync gridConnection to centralized state - affects backup sizing recommendations
  useEffect(() => {
    console.log('📊 [SYNC] Grid connection changing:', wizardState.gridConnection);
    
    // Update existing infrastructure with grid status
    updateExistingInfra('gridConnection', wizardState.gridConnection);
  }, [wizardState.gridConnection, updateExistingInfra]);
  
  // Sync solar to centralized state - affects BESS sizing for energy storage
  useEffect(() => {
    const hasSolar = wizardState.wantsSolar && wizardState.solarKW > 0;
    
    console.log('📊 [SYNC] Solar changing:', {
      wantsSolar: wizardState.wantsSolar,
      solarKW: wizardState.solarKW,
      addSolarFlag: hasSolar,
    });
    
    // Update goals with solar configuration
    updateSection('goals', { 
      addSolar: hasSolar,
      solarKW: wizardState.solarKW || 0,
    });
  }, [wizardState.wantsSolar, wizardState.solarKW, updateSection]);
  
  // Sync wind/generator to centralized state
  useEffect(() => {
    const hasWind = wizardState.wantsWind && wizardState.windTurbineKW > 0;
    const hasGenerator = wizardState.wantsGenerator && wizardState.generatorKW > 0;
    
    console.log('📊 [SYNC] Wind/Generator changing:', {
      wantsWind: wizardState.wantsWind,
      windKW: wizardState.windTurbineKW,
      wantsGenerator: wizardState.wantsGenerator,
      generatorKW: wizardState.generatorKW,
    });
    
    updateSection('goals', { 
      addWind: hasWind,
      windKW: wizardState.windTurbineKW || 0,
      addGenerator: hasGenerator,
      generatorKW: wizardState.generatorKW || 0,
      generatorFuel: wizardState.generatorFuel || 'natural-gas', // SSOT Dec 2025
    });
  }, [
    wizardState.wantsWind, wizardState.windTurbineKW,
    wizardState.wantsGenerator, wizardState.generatorKW, wizardState.generatorFuel,
    updateSection
  ]);
  
  // ⚠️ AUTO-SYNC: Populate local wizard state with SSOT recommendations
  // This ensures the user sees the calculated values, not arbitrary defaults
  useEffect(() => {
    const rec = centralizedState.calculated;
    
    // Only auto-populate if SSOT has meaningful values and user hasn't manually adjusted
    if (rec.totalPeakDemandKW > 0 && rec.recommendedBatteryKW > 0) {
      const shouldUpdate = 
        // Update if local values are at default or much smaller than recommendation
        wizardState.batteryKW < 200 || // Default is usually 150
        Math.abs(wizardState.batteryKW - rec.recommendedBatteryKW) / rec.recommendedBatteryKW > 0.9; // More than 90% different
      
      if (shouldUpdate) {
        console.log('🔄 [AUTO-SYNC] Updating local state with SSOT recommendations:', {
          oldBatteryKW: wizardState.batteryKW,
          newBatteryKW: rec.recommendedBatteryKW,
          recommendedBackupHours: rec.recommendedBackupHours,
        });
        
        setWizardState(prev => ({
          ...prev,
          batteryKW: rec.recommendedBatteryKW,
          batteryKWh: rec.recommendedBatteryKWh,
          durationHours: rec.recommendedBackupHours || prev.durationHours,
        }));
      }
    }
  }, [
    centralizedState.calculated.recommendedBatteryKW,
    centralizedState.calculated.recommendedBatteryKWh,
    centralizedState.calculated.recommendedBackupHours,
    centralizedState.calculated.totalPeakDemandKW,
  ]);
  
  // DEBUG: Log centralized state changes for Power Profile
  useEffect(() => {
    console.log('📊 [PowerProfile] centralizedState.calculated:', centralizedState.calculated);
    console.log('📊 [PowerProfile] systemSize being used:', 
      centralizedState.calculated.totalPeakDemandKW || wizardState.batteryKW,
      '(centralized:', centralizedState.calculated.totalPeakDemandKW, ', fallback:', wizardState.batteryKW, ')'
    );
  }, [centralizedState.calculated, wizardState.batteryKW]);
  
  // Load use cases on mount
  useEffect(() => {
    // Prevent infinite loop - only initialize vertical once
    if (initialUseCase && verticalInitDoneRef.current) {
      console.log('🛑 [StreamlinedWizard] Vertical init already done - skipping');
      return;
    }
    
    const loadUseCases = async () => {
      try {
        const useCases = await useCaseService.getAllUseCases();
        
        // ═══════════════════════════════════════════════════════════════
        // DEDUPE: Filter out duplicate hotel templates
        // We keep 'hotel' as the canonical slug, filter out 'hotel-hospitality', 'hotel-resort'
        // ═══════════════════════════════════════════════════════════════
        const DUPLICATE_SLUGS_TO_HIDE = ['hotel-hospitality', 'hotel-resort'];
        const dedupedUseCases = (useCases || []).filter(
          (uc: any) => !DUPLICATE_SLUGS_TO_HIDE.includes(uc.slug)
        );
        
        setAvailableUseCases(dedupedUseCases);
        
        // ═══════════════════════════════════════════════════════════════
        // VERTICAL LANDING PAGE INITIALIZATION
        // If initialUseCase is provided, auto-select it and fetch questions
        // Only runs ONCE per wizard open (tracked by verticalInitDoneRef)
        // ═══════════════════════════════════════════════════════════════
        if (initialUseCase && dedupedUseCases.length > 0 && !verticalInitDoneRef.current) {
          verticalInitDoneRef.current = true; // Mark as done IMMEDIATELY to prevent re-runs
          
          const matchingUseCase = dedupedUseCases.find(
            (uc: any) => uc.slug === initialUseCase || uc.slug === `${initialUseCase}-hospitality`
          );
          
          if (matchingUseCase) {
            console.log('🎯 [StreamlinedWizard] Auto-selecting use case:', matchingUseCase.slug);
            
            // Set state and location from props
            const stateToUse = initialState || 'California';
            const rate = getRegionalElectricityRate(stateToUse);
            const recommendations = getGeographicRecommendations(stateToUse);
            
            // Fetch custom questions for this use case
            let customQuestions: any[] = [];
            let defaultData: Record<string, any> = {};
            
            if (matchingUseCase.id) {
              try {
                customQuestions = await useCaseService.getCustomQuestionsByUseCaseId(matchingUseCase.id);
                customQuestions.forEach((q: any) => {
                  if (q.default_value) {
                    defaultData[q.field_name] = q.question_type === 'number' 
                      ? parseFloat(q.default_value) 
                      : q.default_value;
                  }
                });
              } catch (error) {
                console.error('Failed to fetch custom questions:', error);
              }
            }
            
            // Merge initialData over defaults
            const mergedData = { ...defaultData, ...initialData };
            
            setWizardState(prev => ({
              ...prev,
              state: stateToUse,
              electricityRate: rate,
              geoRecommendations: recommendations,
              selectedIndustry: matchingUseCase.slug,
              industryName: matchingUseCase.name,
              useCaseId: matchingUseCase.id || '',
              customQuestions,
              useCaseData: mergedData,
            }));
            
            // ═══════════════════════════════════════════════════════════════
            // SKIP TO SECTION 3 (Facility Details) for vertical landing pages
            // Mark location & industry as complete, award their points
            // ═══════════════════════════════════════════════════════════════
            setCurrentSection(2); // Section 3 = index 2
            setCompletedSections(['location', 'industry']);
            setTotalPoints(200); // 100 + 100 for location & industry
            setInitializedFromVertical(true);
            setVerticalInitComplete(true);
            
            console.log('🎯 [StreamlinedWizard] Vertical init complete - skipping to Section 3');
          }
        }
      } catch (error) {
        console.error('Failed to load use cases:', error);
      } finally {
        setIsLoadingUseCases(false);
      }
    };
    loadUseCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUseCase, initialState]); // Removed initialData - it causes infinite loops
  
  // Complete a section and award points
  const completeSection = useCallback((sectionId: string) => {
    if (completedSections.includes(sectionId)) return;
    
    const section = WIZARD_SECTIONS.find(s => s.id === sectionId);
    if (section) {
      setCompletedSections(prev => [...prev, sectionId]);
      setTotalPoints(prev => prev + section.pointsAwarded);
    }
  }, [completedSections]);
  
  // Auto-advance to next section with animation
  const advanceToSection = useCallback((sectionIndex: number) => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentSection(sectionIndex);
      setIsTransitioning(false);
      
      // Scroll to new section
      setTimeout(() => {
        sectionRefs.current[sectionIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }, 300);
  }, []);
  
  // Handle zip code change - auto-detect state
  const handleZipChange = async (zip: string) => {
    const cleanZip = zip.replace(/\D/g, '').slice(0, 5);
    setWizardState(prev => ({ ...prev, zipCode: cleanZip }));
    
    if (cleanZip.length === 5) {
      const detectedState = getStateFromZipCode(cleanZip);
      if (detectedState) {
        const recommendations = getGeographicRecommendations(detectedState);
        const rate = getRegionalElectricityRate(detectedState);
        
        setWizardState(prev => ({
          ...prev,
          state: detectedState,
          geoRecommendations: recommendations,
          electricityRate: rate,
        }));
        
        // Auto-complete location section and advance
        completeSection('location');
        setTimeout(() => advanceToSection(1), 800);
      }
    }
  };
  
  // Handle state selection
  const handleStateSelect = (state: string) => {
    if (!state) return;
    
    const recommendations = getGeographicRecommendations(state);
    const rate = getRegionalElectricityRate(state);
    
    setWizardState(prev => ({
      ...prev,
      state,
      geoRecommendations: recommendations,
      electricityRate: rate,
    }));
    
    // Auto-complete and advance
    completeSection('location');
    setTimeout(() => advanceToSection(1), 600);
  };
  
  // Handle industry selection - fetch custom questions from database
  const handleIndustrySelect = async (slug: string, name: string, useCaseId?: string) => {
    // NOTE: Data Center now uses the standard wizard flow like all other industries
    // The DataCenterQuestionnaire modal was removed to maintain SSOT/AAD compliance
    // All industries should follow the same wizard sections for consistent UX
    
    // Set basic state first
    setWizardState(prev => ({
      ...prev,
      selectedIndustry: slug,
      industryName: name,
      useCaseId: useCaseId || '',
      customQuestions: [], // Will be populated async
    }));
    
    // Fetch custom questions from database
    if (useCaseId) {
      try {
        const questions = await useCaseService.getCustomQuestionsByUseCaseId(useCaseId);
        
        // Initialize useCaseData with default values from questions
        const defaultData: Record<string, any> = {};
        questions.forEach((q: any) => {
          if (q.default_value) {
            defaultData[q.field_name] = q.question_type === 'number' 
              ? parseFloat(q.default_value) 
              : q.default_value;
          }
        });
        
        setWizardState(prev => ({
          ...prev,
          customQuestions: questions,
          useCaseData: { ...prev.useCaseData, ...defaultData },
        }));
      } catch (error) {
        console.error('Failed to fetch custom questions:', error);
      }
    }
    
    // Auto-complete and advance
    completeSection('industry');
    setTimeout(() => advanceToSection(2), 600);
  };
  
  // Group use cases by industry
  const groupedUseCases = React.useMemo(() => {
    return availableUseCases.reduce((acc: Record<string, any[]>, useCase: any) => {
      const industry = useCase.industry || 'Other';
      if (!acc[industry]) acc[industry] = [];
      acc[industry].push(useCase);
      return acc;
    }, {});
  }, [availableUseCases]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME COST CALCULATION - USES SINGLE SOURCE OF TRUTH PRICING SERVICES
  // ═══════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    const calculateCostsFromServices = async () => {
      try {
        // Convert kW to MW for service calls
        const powerMW = wizardState.batteryKW / 1000 || 0.1;
        
        // ═══════════════════════════════════════════════════════════════
        // BATTERY PRICING - from unifiedPricingService (database-driven)
        // ═══════════════════════════════════════════════════════════════
        const batteryPricing = await getBatteryPricing(powerMW, wizardState.durationHours || 4);
        const batteryCost = wizardState.batteryKWh * batteryPricing.pricePerKWh;
        
        // ═══════════════════════════════════════════════════════════════
        // SOLAR PRICING - from unifiedPricingService (database-driven)
        // Now uses scale-based pricing: < 5 MW = commercial, ≥ 5 MW = utility
        // ═══════════════════════════════════════════════════════════════
        const solarMW = wizardState.solarKW / 1000;  // Convert kW to MW for scale-based pricing
        const solarPricing = await getSolarPricing(solarMW);
        const solarCost = wizardState.solarKW * 1000 * solarPricing.pricePerWatt; // pricePerWatt
        
        // ═══════════════════════════════════════════════════════════════
        // WIND PRICING - from unifiedPricingService (database-driven)
        // ═══════════════════════════════════════════════════════════════
        const windPricing = await getWindPricing();
        const windCost = wizardState.windTurbineKW * windPricing.pricePerKW;
        
        // ═══════════════════════════════════════════════════════════════
        // GENERATOR PRICING - from unifiedPricingService (database-driven)
        // ═══════════════════════════════════════════════════════════════
        const generatorPricing = await getGeneratorPricing();
        const generatorCost = wizardState.generatorKW * generatorPricing.pricePerKW;
        
        // ═══════════════════════════════════════════════════════════════
        // EV CHARGER COSTS - from evChargingCalculations (SINGLE SOURCE OF TRUTH)
        // ═══════════════════════════════════════════════════════════════
        // Level 1 costs (simple calculation - $2K hardware + $1K install each)
        const l1Cost = wizardState.evChargersL1 * 3000;
        
        const evCostResult = calculateEVHubCosts({
          // Use legacy field names for backward compatibility
          level2Count: wizardState.evChargersL2,
          dcFastCount: wizardState.evChargersDCFC,
          // Map HPC to 350kW chargers
          hpc_350kw: wizardState.evChargersHPC,
        });
        
        // Calculate itemized costs for display
        const l2Cost = wizardState.evChargersL2 * 10000; // ~$10K each (hardware + install)
        const dcfcCost = wizardState.evChargersDCFC * 85000; // ~$85K each
        const hpcCost = wizardState.evChargersHPC * 180000; // ~$180K each
        
        const totalEVCost = l1Cost + evCostResult.totalCostUSD;
        
        // Installation: ~20% of equipment (this could also be from a service)
        const equipmentTotal = batteryCost + solarCost + windCost + generatorCost + totalEVCost;
        const installationCost = equipmentTotal * 0.20;
        
        setWizardState(prev => ({
          ...prev,
          estimatedCost: {
            battery: batteryCost,
            solar: solarCost,
            wind: windCost,
            generator: generatorCost,
            evChargers: totalEVCost,
            evChargersL1: l1Cost,
            evChargersL2: l2Cost,
            evChargersDCFC: dcfcCost,
            evChargersHPC: hpcCost,
            installation: installationCost,
            total: equipmentTotal + installationCost,
          }
        }));
      } catch (error) {
        console.error('[StreamlinedWizard] Error calculating costs from services:', error);
        // Fallback handled by service defaults
      }
    };
    
    calculateCostsFromServices();
  }, [wizardState.batteryKWh, wizardState.batteryKW, wizardState.durationHours, wizardState.solarKW, wizardState.windTurbineKW, wizardState.generatorKW, wizardState.generatorFuel, wizardState.evChargersL1, wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC]);
  
  if (!show) return null;
  
  return (
    <>
      {/* Dark backdrop overlay - keeps user on main page context */}
      <div 
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container - Centered popup, not full page */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 z-50 flex flex-col rounded-3xl overflow-hidden shadow-2xl" 
        style={{ 
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
          boxShadow: '0 25px 100px rgba(91,33,182,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
        }}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Power Profile Tracker - Desktop Sidebar */}
          <div className="hidden lg:block">
            <PowerProfileTracker
              currentSection={currentSection}
              completedSections={completedSections}
              totalPoints={totalPoints}
              level={Math.floor(totalPoints / 25) + 1}
              selectedLocation={wizardState.state}
              selectedIndustry={wizardState.industryName}
              systemSize={wizardState.batteryKW || centralizedState.calculated.totalPeakDemandKW || 0}
              systemKWh={wizardState.batteryKWh || centralizedState.calculated.recommendedBatteryKWh || 0}
              durationHours={wizardState.durationHours || centralizedState.calculated.recommendedBackupHours || 4}
              onShowExplainer={() => setShowPowerProfileExplainer(true)}
              onSectionClick={(index) => setCurrentSection(index)}
              // PowerGap props - show target vs current
              neededPowerKW={centralizedState.calculated.recommendedBatteryKW || 0}
              neededEnergyKWh={centralizedState.calculated.recommendedBatteryKWh || 0}
              neededDurationHours={centralizedState.calculated.recommendedBackupHours || 4}
              onAcceptRecommendation={() => {
                // Apply Merlin's recommendation
                setWizardState(prev => ({
                  ...prev,
                  batteryKW: centralizedState.calculated.recommendedBatteryKW || prev.batteryKW,
                  batteryKWh: centralizedState.calculated.recommendedBatteryKWh || prev.batteryKWh,
                  durationHours: centralizedState.calculated.recommendedBackupHours || prev.durationHours,
                }));
              }}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Power Profile - Top Bar */}
            <div className="lg:hidden">
              <PowerProfileTracker
                currentSection={currentSection}
                completedSections={completedSections}
                totalPoints={totalPoints}
                level={Math.floor(totalPoints / 25) + 1}
                selectedLocation={wizardState.state}
                selectedIndustry={wizardState.industryName}
                systemSize={wizardState.batteryKW || centralizedState.calculated.totalPeakDemandKW || 0}
                systemKWh={wizardState.batteryKWh || centralizedState.calculated.recommendedBatteryKWh || 0}
                durationHours={wizardState.durationHours || centralizedState.calculated.recommendedBackupHours || 4}
                compact
                onShowExplainer={() => setShowPowerProfileExplainer(true)}
                onSectionClick={(index) => setCurrentSection(index)}
                // PowerGap props
                neededPowerKW={centralizedState.calculated.recommendedBatteryKW || 0}
                neededEnergyKWh={centralizedState.calculated.recommendedBatteryKWh || 0}
                neededDurationHours={centralizedState.calculated.recommendedBackupHours || 4}
              />
            </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Back to Home Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <div className="w-px h-8 bg-gray-200"></div>
            <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-800">Merlin Quote Builder</h1>
              <p className="text-xs text-purple-600">Guided energy storage sizing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {onOpenAdvanced && (
              <button
                onClick={onOpenAdvanced}
                className="hidden lg:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-purple-700 bg-gradient-to-r from-slate-200 via-white to-slate-200 border-2 border-purple-400 rounded-xl shadow-lg shadow-purple-400/30 hover:shadow-xl hover:shadow-purple-500/50 hover:border-purple-500 hover:scale-105 transition-all duration-300"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                Advanced Mode
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
        >
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 0: WELCOME + LOCATION (Combined)
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[0] = el; }}
            className={`min-h-[calc(100vh-120px)] flex items-center justify-center p-8 ${currentSection !== 0 ? 'hidden' : ''}`}
          >
            <div className="max-w-3xl w-full">
              {/* Welcome Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-5 py-2 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-700 text-sm font-semibold">AI-Powered Quote Builder</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600">Merlin</span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-2">
                  Let's build your perfect energy storage solution
                </p>
                <p className="text-gray-500">
                  Just answer a few questions • Get instant results • No credit card required
                </p>
              </div>
              
              {/* Location Input Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-200 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Where's your project?</h2>
                    <p className="text-sm text-gray-500">We'll customize recommendations for your area</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Zip Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      📮 Zip Code (fastest)
                    </label>
                    <input
                      type="text"
                      value={wizardState.zipCode}
                      onChange={(e) => handleZipChange(e.target.value)}
                      placeholder="Enter 5-digit zip"
                      className="w-full px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-mono placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      maxLength={5}
                    />
                  </div>
                  
                  {/* State Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      🏛️ Or select state
                    </label>
                    <select
                      value={wizardState.state}
                      onChange={(e) => handleStateSelect(e.target.value)}
                      className="w-full px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-white">Select your state...</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state} className="bg-white">{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Location Confirmed */}
                {wizardState.state && (
                  <div className="mt-6 flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-5 py-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                    <div>
                      <span className="text-emerald-300 font-medium">{wizardState.state}</span>
                      {wizardState.zipCode && (
                        <span className="text-gray-500 ml-2">({wizardState.zipCode})</span>
                      )}
                    </div>
                    {wizardState.electricityRate > 0 && (
                      <span className="ml-auto text-sm text-gray-500">
                        ~${wizardState.electricityRate.toFixed(2)}/kWh
                      </span>
                    )}
                  </div>
                )}
                
                {/* Geographic Insights - PROMINENT LOCATION RECOMMENDATIONS */}
                {wizardState.geoRecommendations && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 border-2 border-purple-400/50 rounded-2xl shadow-lg shadow-purple-500/10">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-500" />
                      Smart Recommendations for {wizardState.state}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-amber-300 shadow-sm">
                        <Sun className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-amber-600">
                          {wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Avg Sun Hours/Day</div>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-purple-300 shadow-sm">
                        <Battery className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-purple-600">
                          {wizardState.geoRecommendations.recommendations.batteryStorage.recommended ? '✓ Yes' : 'Optional'}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Battery Recommended</div>
                      </div>
                      <div className="bg-white/80 rounded-xl p-4 text-center border border-blue-300 shadow-sm">
                        <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-blue-600">
                          {wizardState.geoRecommendations.profile.gridReliabilityScore}/100
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Grid Reliability</div>
                      </div>
                    </div>
                    
                    {/* Why These Recommendations */}
                    <div className="bg-white/60 rounded-xl p-4 border border-purple-200">
                      <h4 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Why This Matters for Your Project
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {wizardState.geoRecommendations.profile.avgSolarHoursPerDay >= 5 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span><strong>Excellent solar potential</strong> - {wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)} sun-hours/day is above average</span>
                          </li>
                        )}
                        {wizardState.geoRecommendations.recommendations.batteryStorage.recommended && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span><strong>Battery storage recommended</strong> - Capture peak demand savings & backup power</span>
                          </li>
                        )}
                        {wizardState.electricityRate > 0.12 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span><strong>High utility rates</strong> (${wizardState.electricityRate.toFixed(2)}/kWh) make storage valuable</span>
                          </li>
                        )}
                        {wizardState.geoRecommendations.profile.gridReliabilityScore < 85 && (
                          <li className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span><strong>Grid reliability concerns</strong> - Backup power provides peace of mind</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Path Fork: Upload vs Guided (show after location selected) */}
              {wizardState.state && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-700 text-center mb-6">
                    How would you like to proceed?
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Path A: Upload Specs */}
                    {onOpenAdvanced && (
                      <button
                        onClick={onOpenAdvanced}
                        className="group p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-300/50 rounded-2xl hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left"
                      >
                        <Upload className="w-10 h-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Upload Your Specs</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Have utility bills, equipment lists, or load data? Upload them and let AI extract the details automatically.
                        </p>
                        <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                          <span>Open Advanced Builder</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    )}
                    
                    {/* Path B: Guided Wizard */}
                    <button
                      onClick={() => setCurrentSection(1)}
                      className="group p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-300/50 rounded-2xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left"
                    >
                      <Wand2 className="w-10 h-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xl font-bold text-gray-800 mb-2">Guided Builder</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Answer a few questions about your facility and goals. We'll recommend the optimal BESS configuration.
                      </p>
                      <div className="mt-4 flex items-center text-emerald-600 text-sm font-medium">
                        <span>Continue with Questions</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Scroll hint */}
              {!wizardState.state && (
                <div className="text-center mt-8 text-gray-500 animate-bounce">
                  <ChevronDown className="w-6 h-6 mx-auto" />
                  <span className="text-sm">Enter your location to continue</span>
                </div>
              )}
            </div>
          </div>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: INDUSTRY SELECTION
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[1] = el; }}
            className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 1 ? 'hidden' : ''}`}
          >
            <div className="max-w-5xl mx-auto">
              {/* Section Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentSection(0)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Location
                </button>
                <div className="text-sm text-gray-400">Step 2 of 6</div>
              </div>
              
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-5 py-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">Location: {wizardState.state}</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  What type of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">facility</span>?
                </h2>
                <p className="text-gray-500">
                  Select your industry for tailored recommendations
                </p>
              </div>
              
              {/* Specialized Verticals */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Specialized Solutions
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {SPECIALIZED_VERTICALS.map((vertical) => {
                    const Icon = vertical.icon;
                    return (
                      <a
                        key={vertical.id}
                        href={vertical.url}
                        className={`relative p-6 rounded-2xl border-2 ${vertical.borderColor} bg-gradient-to-br ${vertical.bgColor} text-left transition-all hover:shadow-xl hover:scale-105 group overflow-hidden`}
                      >
                        <div className="absolute top-2 right-2 bg-gradient-to-r ${vertical.color} text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Dedicated Site
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${vertical.color} text-white shadow-lg`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                              {vertical.name}
                            </h4>
                            <p className="text-sm text-gray-500">{vertical.description}</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
              
              {/* Standard Industries */}
              {isLoadingUseCases ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-500">Loading industries...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedUseCases).map(([industry, useCases]) => (
                    <div key={industry}>
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">{industry}</h3>
                      <div className="grid md:grid-cols-3 gap-3">
                        {(useCases as any[]).map((useCase) => {
                          const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default;
                          const isSelected = wizardState.selectedIndustry === useCase.slug;
                          
                          return (
                            <button
                              key={useCase.slug}
                              onClick={() => handleIndustrySelect(useCase.slug, useCase.name, useCase.id)}
                              className={`p-5 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  isSelected 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-purple-100 text-purple-600'
                                }`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <span className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                                  {useCase.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: FACILITY DETAILS
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[2] = el; }}
            className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 2 ? 'hidden' : ''}`}
          >
            <div className="max-w-3xl mx-auto">
              {/* Vertical Landing Page Welcome Banner */}
              {initializedFromVertical && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-700">Welcome from {wizardState.industryName}!</h4>
                      <p className="text-sm text-emerald-600">
                        We've imported your info. Let's confirm a few details to build your custom quote.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section Navigation - Hide "Back" for vertical users on first visit */}
              <div className="flex items-center justify-between mb-6">
                {!initializedFromVertical ? (
                  <button
                    onClick={() => setCurrentSection(1)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Industry
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600">
                    <Sparkles className="w-4 h-4" />
                    <span>Pre-filled from your calculator</span>
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  {initializedFromVertical ? 'Step 1 of 4' : 'Step 3 of 6'}
                </div>
              </div>
              
              {/* Progress badges */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">{wizardState.state}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-4 py-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 text-sm">{wizardState.industryName}</span>
                </div>
              </div>
              
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  {initializedFromVertical 
                    ? <>Confirm your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">{wizardState.industryName || 'facility'}</span> details</>
                    : <>Tell us about your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">{wizardState.industryName || 'facility'}</span></>
                  }
                </h2>
                <p className="text-gray-500">
                  {initializedFromVertical 
                    ? 'Review the values below - adjust if needed, then continue'
                    : 'This helps Merlin size your system accurately'
                  }
                </p>
              </div>
              
              {/* Dynamic Custom Questions from Database */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-200 shadow-xl">
                {(() => {
                  // Filter out redundant grid/utility questions that are handled in other sections
                  const excludedFields = [
                    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
                    'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
                    'wantsSolar', 'hasEVCharging', 'evChargerCount',
                    // EV chargers - now handled in Section 5 with dedicated L1/L2/L3/DCFC/HPC UI
                    'existingEVChargers', 'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
                  ];
                  const filteredQuestions = wizardState.customQuestions.filter(
                    (q: any) => !excludedFields.includes(q.field_name)
                  );
                  
                  return filteredQuestions.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                        <Info className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Industry-Specific Details</h3>
                        <p className="text-sm text-gray-500">{filteredQuestions.length} questions to accurately size your system</p>
                      </div>
                    </div>
                    
                    {/* Render each custom question dynamically */}
                    <div className="space-y-6">
                      {filteredQuestions.map((question: any, index: number) => (
                        <div key={question.field_name} className="bg-purple-50/50 rounded-xl p-5 border border-purple-100">
                          <label className="block text-gray-700 font-medium mb-2">
                            {question.question_text}
                            {question.is_required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          
                          {question.help_text && (
                            <p className="text-sm text-gray-500 mb-3">{question.help_text}</p>
                          )}
                          
                          {/* Render different input types */}
                          {question.question_type === 'number' && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                                  const step = question.max_value > 100 ? 10 : 1;
                                  setWizardState(prev => ({
                                    ...prev,
                                    useCaseData: {
                                      ...prev.useCaseData,
                                      [question.field_name]: Math.max(question.min_value || 0, currentVal - step)
                                    }
                                  }));
                                }}
                                className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                              >
                                <Minus className="w-5 h-5 text-purple-600" />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                  setWizardState(prev => ({
                                    ...prev,
                                    useCaseData: {
                                      ...prev.useCaseData,
                                      [question.field_name]: parseFloat(val) || 0
                                    }
                                  }));
                                }}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 px-5 py-4 bg-white border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                              />
                              <button
                                onClick={() => {
                                  const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                                  const step = question.max_value > 100 ? 10 : 1;
                                  setWizardState(prev => ({
                                    ...prev,
                                    useCaseData: {
                                      ...prev.useCaseData,
                                      [question.field_name]: Math.min(question.max_value || 999999, currentVal + step)
                                    }
                                  }));
                                }}
                                className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                              >
                                <Plus className="w-5 h-5 text-purple-600" />
                              </button>
                            </div>
                          )}
                          
                          {question.question_type === 'select' && question.options && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option: any) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                const isSelected = wizardState.useCaseData[question.field_name] === optionValue;
                                
                                return (
                                  <button
                                    key={optionValue}
                                    onClick={() => setWizardState(prev => ({
                                      ...prev,
                                      useCaseData: { ...prev.useCaseData, [question.field_name]: optionValue }
                                    }))}
                                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                                      isSelected
                                        ? 'bg-purple-500 text-white shadow-lg'
                                        : 'bg-white border-2 border-purple-200 text-gray-700 hover:border-purple-400'
                                    }`}
                                  >
                                    {optionLabel}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {question.question_type === 'text' && (
                            <input
                              type="text"
                              value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                              onChange={(e) => setWizardState(prev => ({
                                ...prev,
                                useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                              }))}
                              placeholder={question.placeholder || ''}
                              className="w-full px-5 py-4 bg-white border-2 border-purple-200 rounded-xl text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                          )}
                          
                          {question.question_type === 'boolean' && (
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={wizardState.useCaseData[question.field_name] === true || wizardState.useCaseData[question.field_name] === 'true'}
                                onChange={(e) => setWizardState(prev => ({
                                  ...prev,
                                  useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.checked }
                                }))}
                                className="w-6 h-6 rounded accent-purple-500"
                              />
                              <span className="text-gray-700">Yes</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Fallback to facility size presets if no custom questions */
                  <>
                    {(() => {
                      const preset = FACILITY_PRESETS[wizardState.selectedIndustry] || FACILITY_PRESETS.default;
                      return (
                        <>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                              <Gauge className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{preset.label}</h3>
                              <p className="text-sm text-gray-500">Select or enter your size in {preset.unit}</p>
                            </div>
                          </div>
                          
                          {/* Preset buttons */}
                          <div className="grid grid-cols-4 gap-3 mb-6">
                            {preset.presets.map((size) => (
                              <button
                                key={size}
                                onClick={() => setWizardState(prev => ({ ...prev, facilitySize: size }))}
                                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                                  wizardState.facilitySize === size
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                              >
                                {size.toLocaleString()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Custom input */}
                          <div className="mb-8">
                            <label className="block text-sm text-gray-500 mb-2">Or enter custom value:</label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setWizardState(prev => ({ ...prev, facilitySize: Math.max(1000, prev.facilitySize - 5000) }))}
                                className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                              >
                                <Minus className="w-5 h-5 text-purple-600" />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={wizardState.facilitySize || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setWizardState(prev => ({ ...prev, facilitySize: parseInt(val) || 0 }));
                                }}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                              />
                              <button
                                onClick={() => setWizardState(prev => ({ ...prev, facilitySize: prev.facilitySize + 5000 }))}
                                className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                              >
                                <Plus className="w-5 h-5 text-purple-600" />
                              </button>
                            </div>
                            <p className="text-center text-gray-500 mt-2">{preset.unit}</p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                );
                })()}
                
                {/* Continue button */}
                <button
                  onClick={() => {
                    completeSection('details');
                    advanceToSection(3);
                  }}
                  disabled={wizardState.customQuestions.length > 0 
                    ? wizardState.customQuestions.some((q: any) => q.is_required && !wizardState.useCaseData[q.field_name])
                    : wizardState.facilitySize <= 0
                  }
                  className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: GOALS & PREFERENCES
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[3] = el; }}
            className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 3 ? 'hidden' : ''}`}
          >
            <div className="max-w-3xl mx-auto">
              {/* Section Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentSection(2)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Details
                </button>
                <div className="text-sm text-gray-400">Step 4 of 6</div>
              </div>
              
              {/* Progress badges */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">{wizardState.state}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">{wizardState.industryName}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-sm">{wizardState.facilitySize.toLocaleString()} {FACILITY_PRESETS[wizardState.selectedIndustry]?.unit || 'sq ft'}</span>
                </div>
              </div>
              
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  What are your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">goals</span>?
                </h2>
                <p className="text-gray-500">Select all that apply - this helps us optimize your system</p>
              </div>
              
              {/* Goals Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {GOAL_OPTIONS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = wizardState.goals.includes(goal.id);
                  
                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        setWizardState(prev => ({
                          ...prev,
                          goals: isSelected
                            ? prev.goals.filter(g => g !== goal.id)
                            : [...prev.goals, goal.id]
                        }));
                      }}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-100 shadow-lg shadow-amber-500/20'
                          : 'border-gray-200 bg-white hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${isSelected ? 'bg-amber-500' : 'bg-purple-100'}`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold ${isSelected ? 'text-amber-600' : 'text-gray-800'}`}>
                            {goal.label}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-500' : 'border-gray-500'
                        }`}>
                          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* ═══════════════════════════════════════════════════════════
                  EXISTING EV CHARGERS - What do you HAVE?
                  For ev-charging use case: Show summary (already entered on landing)
                  For other use cases: Show Yes/No question
                  ═══════════════════════════════════════════════════════════ */}
              {(wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging') ? (
                /* EV Charging Station: Show summary with ability to adjust */
                <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-emerald-500">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">Your EV Charging Infrastructure</h4>
                      <p className="text-sm text-gray-500">Pre-filled from your earlier selections - adjust if needed</p>
                    </div>
                  </div>
                  
                  {/* Charger Level Inputs - Always visible for ev-charging use case */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Level 1 */}
                    <div className="bg-white rounded-xl p-4 border border-emerald-100">
                      <h5 className="font-medium text-gray-700 mb-1">Level 1</h5>
                      <p className="text-xs text-gray-500 mb-3">1.4 kW each</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL1: Math.max(0, (prev.existingEVL1 || 0) - 1) }))}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL1 || 0}</span>
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL1: (prev.existingEVL1 || 0) + 1 }))}
                          className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                        >+</button>
                      </div>
                      <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL1 || 0) * 1.4).toFixed(1)} kW</p>
                    </div>
                    
                    {/* Level 2 */}
                    <div className="bg-white rounded-xl p-4 border border-emerald-100">
                      <h5 className="font-medium text-gray-700 mb-1">Level 2</h5>
                      <p className="text-xs text-gray-500 mb-3">7-11 kW each</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL2: Math.max(0, (prev.existingEVL2 || 0) - 1) }))}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL2 || 0}</span>
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL2: (prev.existingEVL2 || 0) + 1 }))}
                          className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                        >+</button>
                      </div>
                      <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL2 || 0) * 11)} kW</p>
                    </div>
                    
                    {/* DCFC */}
                    <div className="bg-white rounded-xl p-4 border border-emerald-100">
                      <h5 className="font-medium text-gray-700 mb-1">DCFC</h5>
                      <p className="text-xs text-gray-500 mb-3">50-150 kW each</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL3: Math.max(0, (prev.existingEVL3 || 0) - 1) }))}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                        >-</button>
                        <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL3 || 0}</span>
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVL3: (prev.existingEVL3 || 0) + 1 }))}
                          className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                        >+</button>
                      </div>
                      <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL3 || 0) * 100)} kW</p>
                    </div>
                  </div>
                  
                  {/* Power Source */}
                  <div className="mt-4 bg-white/50 rounded-xl p-4">
                    <h5 className="font-medium text-gray-700 mb-3">How are your chargers powered?</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'grid', label: 'Grid only', icon: '🔌' },
                        { id: 'solar-grid', label: 'Solar + Grid', icon: '☀️' },
                        { id: 'solar-only', label: 'Solar only', icon: '🌞' },
                        { id: 'generator', label: 'Generator backup', icon: '⚡' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setWizardState(prev => ({ ...prev, existingEVPowerSource: option.id as 'grid' | 'solar-grid' | 'solar-only' | 'generator' }))}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            wizardState.existingEVPowerSource === option.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-1">{option.icon}</span> {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Total Load Summary */}
                  <div className="mt-4 bg-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-emerald-700">Total EV Load</p>
                    <p className="text-2xl font-black text-emerald-600">
                      {(((wizardState.existingEVL1 || 0) * 1.4) + ((wizardState.existingEVL2 || 0) * 11) + ((wizardState.existingEVL3 || 0) * 100)).toFixed(1)} kW
                    </p>
                  </div>
                </div>
              ) : (
                /* Non-EV use cases: Show the Yes/No question */
                <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
                wizardState.hasExistingEV 
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 shadow-lg' 
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${wizardState.hasExistingEV ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <Car className={`w-6 h-6 ${wizardState.hasExistingEV ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">Do you have EXISTING EV chargers?</h4>
                    <p className="text-sm text-gray-500">Current charging infrastructure at your facility</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWizardState(prev => ({ ...prev, hasExistingEV: true }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        wizardState.hasExistingEV === true
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setWizardState(prev => ({ 
                        ...prev, 
                        hasExistingEV: false,
                        existingEVL1: 0,
                        existingEVL2: 0,
                        existingEVL3: 0,
                        existingEVPowerSource: 'grid',
                      }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        wizardState.hasExistingEV === false
                          ? 'bg-gray-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                
                {/* Expanded when YES */}
                {wizardState.hasExistingEV && (
                  <div className="mt-4 pt-4 border-t border-emerald-200 space-y-4">
                    {/* Charger Level Inputs */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Level 1 */}
                      <div className="bg-white rounded-xl p-4 border border-emerald-100">
                        <h5 className="font-medium text-gray-700 mb-1">Level 1</h5>
                        <p className="text-xs text-gray-500 mb-3">1.4 kW each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL1: Math.max(0, (prev.existingEVL1 || 0) - 1) }))}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                          >-</button>
                          <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL1 || 0}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL1: (prev.existingEVL1 || 0) + 1 }))}
                            className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                          >+</button>
                        </div>
                        <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL1 || 0) * 1.4).toFixed(1)} kW</p>
                      </div>
                      
                      {/* Level 2 */}
                      <div className="bg-white rounded-xl p-4 border border-emerald-100">
                        <h5 className="font-medium text-gray-700 mb-1">Level 2</h5>
                        <p className="text-xs text-gray-500 mb-3">7-11 kW each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL2: Math.max(0, (prev.existingEVL2 || 0) - 1) }))}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                          >-</button>
                          <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL2 || 0}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL2: (prev.existingEVL2 || 0) + 1 }))}
                            className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                          >+</button>
                        </div>
                        <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL2 || 0) * 11)} kW</p>
                      </div>
                      
                      {/* Level 3 / DCFC */}
                      <div className="bg-white rounded-xl p-4 border border-emerald-100">
                        <h5 className="font-medium text-gray-700 mb-1">DCFC</h5>
                        <p className="text-xs text-gray-500 mb-3">50-150 kW each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL3: Math.max(0, (prev.existingEVL3 || 0) - 1) }))}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold"
                          >-</button>
                          <span className="text-2xl font-bold text-gray-800 w-12 text-center">{wizardState.existingEVL3 || 0}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVL3: (prev.existingEVL3 || 0) + 1 }))}
                            className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center font-bold"
                          >+</button>
                        </div>
                        <p className="text-xs text-emerald-600 text-center mt-2">{((wizardState.existingEVL3 || 0) * 100)} kW</p>
                      </div>
                    </div>
                    
                    {/* Power Source */}
                    <div className="bg-white/50 rounded-xl p-4">
                      <h5 className="font-medium text-gray-700 mb-3">How are your chargers powered?</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'grid', label: 'Grid only', icon: '🔌' },
                          { id: 'solar-grid', label: 'Solar + Grid', icon: '☀️' },
                          { id: 'solar-only', label: 'Solar only', icon: '🌞' },
                          { id: 'generator', label: 'Generator backup', icon: '⚡' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setWizardState(prev => ({ ...prev, existingEVPowerSource: option.id as 'grid' | 'solar-grid' | 'solar-only' | 'generator' }))}
                            className={`p-3 rounded-lg text-sm font-medium transition-all ${
                              wizardState.existingEVPowerSource === option.id
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="mr-1">{option.icon}</span> {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Total Load Summary */}
                    <div className="bg-emerald-100 rounded-xl p-4 text-center">
                      <p className="text-sm text-emerald-700">Total Existing EV Load</p>
                      <p className="text-2xl font-black text-emerald-600">
                        {(((wizardState.existingEVL1 || 0) * 1.4) + ((wizardState.existingEVL2 || 0) * 11) + ((wizardState.existingEVL3 || 0) * 100)).toFixed(1)} kW
                      </p>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  NEW EV CHARGERS - What do you WANT to add?
                  ═══════════════════════════════════════════════════════════ */}
              <div className={`rounded-2xl p-6 border-2 transition-all mb-4 ${
                wizardState.wantsEVCharging 
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-lg' 
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${wizardState.wantsEVCharging ? 'bg-blue-500' : 'bg-gray-200'}`}>
                    <Car className={`w-6 h-6 ${wizardState.wantsEVCharging ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">
                      {(wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging')
                        ? 'Do you want to EXPAND your charging capacity?'
                        : 'Do you WANT to add NEW EV chargers?'
                      }
                    </h4>
                    <p className="text-sm text-gray-500">
                      {(wizardState.selectedIndustry === 'ev-charging' || wizardState.selectedIndustry === 'ev_charging')
                        ? 'Add more chargers beyond your current setup'
                        : 'Plan for future charging infrastructure'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWizardState(prev => ({ ...prev, wantsEVCharging: true }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        wizardState.wantsEVCharging === true
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setWizardState(prev => ({ 
                        ...prev, 
                        wantsEVCharging: false,
                        evChargersL2: 0,
                        evChargersDCFC: 0,
                        evChargersHPC: 0,
                      }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        wizardState.wantsEVCharging === false
                          ? 'bg-gray-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                
                {/* Expanded when YES */}
                {wizardState.wantsEVCharging && (
                  <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
                    {/* Charger Level Inputs - Now with 4 levels */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Level 1 */}
                      <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Level 1</h5>
                        <p className="text-xs text-gray-500 mb-1">1.4 kW each</p>
                        <p className="text-xs text-blue-600 mb-2">~$3K each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersL1: Math.max(0, (prev.evChargersL1 || 0) - 1) }))}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >-</button>
                          <span className="text-xl font-bold text-gray-800 w-10 text-center">{wizardState.evChargersL1 || 0}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersL1: (prev.evChargersL1 || 0) + 1 }))}
                            className="w-7 h-7 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >+</button>
                        </div>
                        <p className="text-xs text-blue-600 text-center mt-1">{((wizardState.evChargersL1 || 0) * 1.4).toFixed(1)} kW</p>
                      </div>
                      
                      {/* Level 2 */}
                      <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Level 2</h5>
                        <p className="text-xs text-gray-500 mb-1">11 kW each</p>
                        <p className="text-xs text-blue-600 mb-2">~$10K each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersL2: Math.max(0, prev.evChargersL2 - 1) }))}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >-</button>
                          <span className="text-xl font-bold text-gray-800 w-10 text-center">{wizardState.evChargersL2}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersL2: prev.evChargersL2 + 1 }))}
                            className="w-7 h-7 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >+</button>
                        </div>
                        <p className="text-xs text-blue-600 text-center mt-1">{wizardState.evChargersL2 * 11} kW</p>
                      </div>
                      
                      {/* Level 3 / DCFC */}
                      <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Level 3 <span className="text-gray-400 text-xs">(DCFC)</span></h5>
                        <p className="text-xs text-gray-500 mb-1">100 kW each</p>
                        <p className="text-xs text-blue-600 mb-2">~$85K each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersDCFC: Math.max(0, prev.evChargersDCFC - 1) }))}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >-</button>
                          <span className="text-xl font-bold text-gray-800 w-10 text-center">{wizardState.evChargersDCFC}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersDCFC: prev.evChargersDCFC + 1 }))}
                            className="w-7 h-7 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >+</button>
                        </div>
                        <p className="text-xs text-blue-600 text-center mt-1">{wizardState.evChargersDCFC * 100} kW</p>
                      </div>
                      
                      {/* High Power */}
                      <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Ultra-Fast <span className="text-gray-400 text-xs">(HPC)</span></h5>
                        <p className="text-xs text-gray-500 mb-1">350 kW each</p>
                        <p className="text-xs text-blue-600 mb-2">~$180K each</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersHPC: Math.max(0, prev.evChargersHPC - 1) }))}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >-</button>
                          <span className="text-xl font-bold text-gray-800 w-10 text-center">{wizardState.evChargersHPC}</span>
                          <button
                            onClick={() => setWizardState(prev => ({ ...prev, evChargersHPC: prev.evChargersHPC + 1 }))}
                            className="w-7 h-7 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center font-bold text-sm"
                          >+</button>
                        </div>
                        <p className="text-xs text-blue-600 text-center mt-1">{wizardState.evChargersHPC * 350} kW</p>
                      </div>
                    </div>
                    
                    {/* Cost & Load Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-blue-700">New EV Load</p>
                        <p className="text-2xl font-black text-blue-600">
                          {(((wizardState.evChargersL1 || 0) * 1.4) + (wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 100) + (wizardState.evChargersHPC * 350)).toFixed(0)} kW
                        </p>
                      </div>
                      <div className="bg-blue-100 rounded-xl p-4 text-center">
                        <p className="text-sm text-blue-700">Estimated Cost</p>
                        <p className="text-2xl font-black text-blue-600">
                          ${(((wizardState.evChargersL1 || 0) * 3000) + (wizardState.evChargersL2 * 10000) + (wizardState.evChargersDCFC * 85000) + (wizardState.evChargersHPC * 180000)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Solar Toggle with AI Recommendation */}
              <div className={`rounded-2xl p-6 border-2 mb-4 transition-all ${
                wizardState.wantsSolar 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-lg shadow-amber-500/20' 
                  : 'bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200'
              }`}>
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizardState.wantsSolar}
                    onChange={(e) => {
                      const batteryKW = wizardState.batteryKW || 500;
                      setWizardState(prev => ({ 
                        ...prev, 
                        wantsSolar: e.target.checked,
                        solarKW: e.target.checked ? Math.round(batteryKW * 1.2) : 0 
                      }));
                    }}
                    className="w-6 h-6 rounded accent-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-gray-800">Add Solar Panels</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Generate your own power & maximize savings</p>
                  </div>
                  {wizardState.geoRecommendations && (
                    <div className="text-right">
                      <div className="text-amber-500 font-bold">{wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)}h</div>
                      <div className="text-xs text-gray-500">solar/day</div>
                    </div>
                  )}
                </label>
                
                {/* Expanded Configuration when enabled */}
                {wizardState.wantsSolar && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
                    {/* AI Recommendation Badge */}
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-700 font-medium">Merlin recommends:</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-xs">
                        {Math.round((wizardState.batteryKW || 500) * 1.2)} kW
                      </span>
                      <span className="text-gray-500 text-xs">(120% of battery power for optimal charging)</span>
                    </div>
                    
                    {/* Power Adjustment - USING PRESETS FOR BETTER UX */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-20">Solar kW:</span>
                      <button
                        onClick={() => {
                          const currentIndex = findClosestPresetIndex(wizardState.solarKW || 0, SOLAR_POWER_PRESETS);
                          const newIndex = Math.max(0, currentIndex - 1);
                          setWizardState(prev => ({ ...prev, solarKW: SOLAR_POWER_PRESETS[newIndex].value }));
                        }}
                        className="w-10 h-10 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center justify-center text-amber-700 font-bold"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={0}
                          max={SOLAR_POWER_PRESETS.length - 1}
                          step={1}
                          value={findClosestPresetIndex(wizardState.solarKW || 0, SOLAR_POWER_PRESETS)}
                          onChange={(e) => {
                            const index = parseInt(e.target.value);
                            setWizardState(prev => ({ ...prev, solarKW: SOLAR_POWER_PRESETS[index].value }));
                          }}
                          className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        {/* Preset markers - updated for new range */}
                        <div className="flex justify-between text-[10px] text-amber-600 mt-1 px-1">
                          <span>5kW</span>
                          <span>100kW</span>
                          <span>1MW</span>
                          <span>50MW</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const currentIndex = findClosestPresetIndex(wizardState.solarKW || 0, SOLAR_POWER_PRESETS);
                          const newIndex = Math.min(SOLAR_POWER_PRESETS.length - 1, currentIndex + 1);
                          setWizardState(prev => ({ ...prev, solarKW: SOLAR_POWER_PRESETS[newIndex].value }));
                        }}
                        className="w-10 h-10 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center justify-center text-amber-700 font-bold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <div className="w-28 text-right">
                        {(wizardState.solarKW || 0) >= 1000 ? (
                          <>
                            <span className="text-2xl font-black text-amber-600">{((wizardState.solarKW || 0) / 1000).toFixed(1)}</span>
                            <span className="text-sm text-gray-500 ml-1">MW</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-amber-600">{wizardState.solarKW || 0}</span>
                            <span className="text-sm text-gray-500 ml-1">kW</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* FIX 2: Roof Space Warning for Solar */}
                    {(() => {
                      const solarKW = wizardState.solarKW || 0;
                      const sqFt = wizardState.facilitySize || 0;
                      const estimatedRoofNeeded = solarKW * 100; // Industry standard: 1 kW = ~100 sq ft
                      // SSOT CONSTANT: ROOF_USABLE_FACTOR = 0.6 (60% of floor space typically available)
                      const ROOF_USABLE_FACTOR = 0.6;
                      const estimatedRoofAvailable = sqFt * ROOF_USABLE_FACTOR;
                      const isOversized = solarKW > 0 && sqFt > 0 && estimatedRoofNeeded > estimatedRoofAvailable;
                      
                      return isOversized ? (
                        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded-lg mb-4">
                          <div className="flex items-start gap-2 text-yellow-800 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong>Space Consideration:</strong> {solarKW >= 1000 ? `${(solarKW/1000).toFixed(1)} MW` : `${solarKW} kW`} solar typically needs ~{estimatedRoofNeeded.toLocaleString()} sq ft of roof space.
                              Your {sqFt.toLocaleString()} sq ft building has ~{Math.round(estimatedRoofAvailable).toLocaleString()} sq ft available.
                              <span className="block mt-1 text-yellow-700">
                                💡 Consider ground-mount, carport solar, or reducing capacity to {Math.round(estimatedRoofAvailable / 100)} kW.
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Specs Info */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Est. Annual Gen</div>
                        <div className="font-bold text-amber-700">
                          {Math.round((wizardState.solarKW || 0) * (wizardState.geoRecommendations?.profile.avgSolarHoursPerDay || 5) * 365 / 1000).toLocaleString()} MWh
                        </div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Voltage</div>
                        <div className="font-bold text-amber-700">480V 3-Phase</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Est. Cost</div>
                        <div className="font-bold text-amber-700">${((wizardState.solarKW || 0) * 1200).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Wind Power Toggle with AI Recommendation */}
              <div className={`rounded-2xl p-6 border-2 mb-4 transition-all ${
                wizardState.wantsWind 
                  ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400 shadow-lg shadow-sky-500/20' 
                  : 'bg-gradient-to-br from-sky-50/50 to-blue-50/50 border-sky-200'
              }`}>
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizardState.wantsWind}
                    onChange={(e) => {
                      const batteryKW = wizardState.batteryKW || 500;
                      setWizardState(prev => ({ 
                        ...prev, 
                        wantsWind: e.target.checked,
                        windTurbineKW: e.target.checked ? Math.round(batteryKW * 0.5) : 0 
                      }));
                    }}
                    className="w-6 h-6 rounded accent-sky-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wind className="w-5 h-5 text-sky-500" />
                      <span className="font-bold text-gray-800">Add Wind Turbines</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Harness wind energy for 24/7 renewable generation</p>
                  </div>
                  {wizardState.geoRecommendations && (
                    <div className="text-right">
                      <div className="text-sky-500 font-bold">~{Math.round((wizardState.geoRecommendations.profile.windCapacityFactor || 0.25) * 30)} mph</div>
                      <div className="text-xs text-gray-500">avg wind</div>
                    </div>
                  )}
                </label>
                
                {/* Expanded Configuration when enabled */}
                {wizardState.wantsWind && (
                  <div className="mt-4 pt-4 border-t border-sky-200 space-y-4">
                    {/* AI Recommendation Badge */}
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-sky-500" />
                      <span className="text-sky-700 font-medium">Merlin recommends:</span>
                      <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-xs">
                        {Math.round((wizardState.batteryKW || 500) * 0.5)} kW
                      </span>
                      <span className="text-gray-500 text-xs">(50% of battery for wind supplement)</span>
                    </div>
                    
                    {/* Power Adjustment - USING PRESETS FOR BETTER UX */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-20">Wind kW:</span>
                      <button
                        onClick={() => {
                          const currentIndex = findClosestPresetIndex(wizardState.windTurbineKW || 0, WIND_POWER_PRESETS);
                          const newIndex = Math.max(0, currentIndex - 1);
                          setWizardState(prev => ({ ...prev, windTurbineKW: WIND_POWER_PRESETS[newIndex].value }));
                        }}
                        className="w-10 h-10 bg-sky-100 hover:bg-sky-200 rounded-lg flex items-center justify-center text-sky-700 font-bold"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={0}
                          max={WIND_POWER_PRESETS.length - 1}
                          step={1}
                          value={findClosestPresetIndex(wizardState.windTurbineKW || 0, WIND_POWER_PRESETS)}
                          onChange={(e) => {
                            const index = parseInt(e.target.value);
                            setWizardState(prev => ({ ...prev, windTurbineKW: WIND_POWER_PRESETS[index].value }));
                          }}
                          className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        {/* Preset markers - updated for new range */}
                        <div className="flex justify-between text-[10px] text-sky-600 mt-1 px-1">
                          <span>5kW</span>
                          <span>100kW</span>
                          <span>1MW</span>
                          <span>25MW</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const currentIndex = findClosestPresetIndex(wizardState.windTurbineKW || 0, WIND_POWER_PRESETS);
                          const newIndex = Math.min(WIND_POWER_PRESETS.length - 1, currentIndex + 1);
                          setWizardState(prev => ({ ...prev, windTurbineKW: WIND_POWER_PRESETS[newIndex].value }));
                        }}
                        className="w-10 h-10 bg-sky-100 hover:bg-sky-200 rounded-lg flex items-center justify-center text-sky-700 font-bold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <div className="w-28 text-right">
                        {(wizardState.windTurbineKW || 0) >= 1000 ? (
                          <>
                            <span className="text-2xl font-black text-sky-600">{((wizardState.windTurbineKW || 0) / 1000).toFixed(1)}</span>
                            <span className="text-sm text-gray-500 ml-1">MW</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-sky-600">{wizardState.windTurbineKW || 0}</span>
                            <span className="text-sm text-gray-500 ml-1">kW</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Specs Info */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Capacity Factor</div>
                        <div className="font-bold text-sky-700">~25-35%</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Voltage</div>
                        <div className="font-bold text-sky-700">480V 3-Phase</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Est. Cost</div>
                        <div className="font-bold text-sky-700">${((wizardState.windTurbineKW || 0) * 1800).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Backup Generator Toggle with AI Recommendation + Types */}
              <div className={`rounded-2xl p-6 border-2 mb-6 transition-all ${
                wizardState.wantsGenerator 
                  ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-400 shadow-lg shadow-slate-500/20' 
                  : 'bg-gradient-to-br from-slate-50/50 to-gray-50/50 border-slate-200'
              }`}>
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizardState.wantsGenerator}
                    onChange={(e) => {
                      const batteryKW = wizardState.batteryKW || 500;
                      setWizardState(prev => ({ 
                        ...prev, 
                        wantsGenerator: e.target.checked,
                        generatorKW: e.target.checked ? Math.round(batteryKW * 0.75) : 0 
                      }));
                    }}
                    className="w-6 h-6 rounded accent-slate-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-5 h-5 text-slate-600" />
                      <span className="font-bold text-gray-800">Add Backup Generator</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Extended backup for critical operations during prolonged outages</p>
                  </div>
                  {wizardState.wantsGenerator && (
                    <div className="text-right">
                      <select 
                        value={wizardState.generatorFuel}
                        onChange={(e) => setWizardState(prev => ({ ...prev, generatorFuel: e.target.value as any }))}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-purple-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
                      >
                        <option value="natural-gas">Natural Gas</option>
                        <option value="diesel">Diesel</option>
                        <option value="propane">Propane</option>
                      </select>
                    </div>
                  )}
                </label>
                
                {/* Expanded Configuration when enabled */}
                {wizardState.wantsGenerator && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                    {/* Generator Type Selection */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-medium">Generator Type:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Traditional Generator */}
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'traditional' }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            wizardState.generatorType !== 'linear' 
                              ? 'border-slate-400 bg-slate-100' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⚙️</span>
                            <span className="font-bold text-sm text-gray-800">Traditional</span>
                          </div>
                          <p className="text-xs text-gray-500">Diesel/NG engines (Cummins, Caterpillar)</p>
                          <p className="text-xs text-slate-600 mt-1">Lower upfront cost, proven reliability</p>
                        </button>
                        
                        {/* Linear Generator */}
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, generatorType: 'linear' }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            wizardState.generatorType === 'linear' 
                              ? 'border-emerald-400 bg-emerald-50' 
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🔋</span>
                            <span className="font-bold text-sm text-gray-800">Linear Generator</span>
                          </div>
                          <p className="text-xs text-gray-500">Mainspring, Bloom Energy</p>
                          <p className="text-xs text-emerald-600 mt-1">Higher efficiency, lower emissions</p>
                        </button>
                      </div>
                    </div>
                    
                    {/* AI Recommendation Badge */}
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700 font-medium">Merlin recommends:</span>
                      <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold text-xs">
                        {Math.round((wizardState.batteryKW || 500) * 0.75)} kW
                      </span>
                      <span className="text-gray-500 text-xs">(75% of battery for backup redundancy)</span>
                    </div>
                    
                    {/* Power Adjustment */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-24">Generator:</span>
                      <button
                        onClick={() => {
                          const current = wizardState.generatorKW || 0;
                          // Finer step sizes for smaller values
                          const step = current > 5000 ? 500 : current > 1000 ? 250 : current > 500 ? 100 : 50;
                          setWizardState(prev => ({ ...prev, generatorKW: Math.max(50, current - step) }));
                        }}
                        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="50"
                          max="20000"
                          step="50"
                          value={wizardState.generatorKW || 0}
                          onChange={(e) => setWizardState(prev => ({ ...prev, generatorKW: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const current = wizardState.generatorKW || 0;
                          // Finer step sizes - 50kW at small, up to 500kW for large
                          const step = current >= 10000 ? 1000 : current >= 5000 ? 500 : current >= 1000 ? 250 : current >= 500 ? 100 : 50;
                          setWizardState(prev => ({ ...prev, generatorKW: Math.min(20000, current + step) }));
                        }}
                        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <div className="w-32 text-right">
                        {(wizardState.generatorKW || 0) >= 1000 ? (
                          <>
                            <span className="text-2xl font-black text-slate-700">{((wizardState.generatorKW || 0) / 1000).toFixed(1)}</span>
                            <span className="text-sm text-gray-500 ml-1">MW</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-slate-700">{wizardState.generatorKW || 0}</span>
                            <span className="text-sm text-gray-500 ml-1">kW</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Specs Info */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Fuel Type</div>
                        <div className="font-bold text-slate-700 capitalize">{wizardState.generatorFuel.replace('-', ' ')}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Voltage</div>
                        <div className="font-bold text-slate-700">480V 3Φ</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Amperage</div>
                        <div className="font-bold text-slate-700">{Math.round((wizardState.generatorKW || 0) / 0.48 / 1.732)}A</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-xs text-gray-500">Est. Cost</div>
                        <div className="font-bold text-slate-700">${((wizardState.generatorKW || 0) * (wizardState.generatorType === 'linear' ? 2500 : 800)).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {/* Linear Generator Info */}
                    {wizardState.generatorType === 'linear' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 text-emerald-700 font-medium mb-1">
                          <Info className="w-4 h-4" />
                          <span>About Linear Generators</span>
                        </div>
                        <p className="text-emerald-600 text-xs">
                          Linear generators (like Mainspring) use a free-piston linear engine that converts fuel directly to electricity 
                          with ~90% efficiency, significantly reducing emissions and fuel costs compared to traditional rotary engines.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Grid Connection Status */}
              <div className="rounded-2xl p-6 border-2 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gray-100">
                    <Zap className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Grid Connection Status</h4>
                    <p className="text-sm text-gray-500">How is your facility connected to the power grid?</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { 
                      id: 'on-grid' as const, 
                      label: 'Grid-Tied', 
                      description: 'Reliable connection',
                      icon: '🔌'
                    },
                    { 
                      id: 'unreliable' as const, 
                      label: 'Unreliable Grid', 
                      description: 'Frequent outages',
                      icon: '⚠️'
                    },
                    { 
                      id: 'expensive' as const, 
                      label: 'Grid Too Expensive', 
                      description: 'High rates',
                      icon: '💰'
                    },
                    { 
                      id: 'limited' as const, 
                      label: 'Limited Grid', 
                      description: 'Constrained capacity',
                      icon: '📉'
                    },
                    { 
                      id: 'off-grid' as const, 
                      label: 'Off-Grid', 
                      description: 'No utility',
                      icon: '🏝️'
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setWizardState(prev => ({ ...prev, gridConnection: option.id }))}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        wizardState.gridConnection === option.id
                          ? 'border-purple-400 bg-purple-50 shadow-lg shadow-purple-500/20'
                          : 'border-gray-200 bg-white hover:border-purple-400/50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className={`font-bold text-sm ${
                        wizardState.gridConnection === option.id ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
                
                {/* Contextual info based on selection */}
                {wizardState.gridConnection !== 'on-grid' && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    wizardState.gridConnection === 'off-grid'
                      ? 'bg-amber-50 border border-amber-200 text-amber-700'
                      : wizardState.gridConnection === 'expensive'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : wizardState.gridConnection === 'unreliable'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {wizardState.gridConnection === 'off-grid'
                          ? 'Off-grid systems require larger battery capacity and backup generation for reliability.'
                          : wizardState.gridConnection === 'expensive'
                          ? 'BESS + solar can dramatically reduce your energy costs by avoiding peak rates and demand charges.'
                          : wizardState.gridConnection === 'unreliable'
                          ? 'We\'ll recommend backup power and longer battery duration for outage protection.'
                          : 'Limited grid connection means we\'ll size your system for greater self-reliance.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Continue button */}
              <button
                onClick={() => {
                  completeSection('goals');
                  
                  // ═══════════════════════════════════════════════════════════════
                  // USE INDUSTRY-SPECIFIC POWER CALCULATIONS (SINGLE SOURCE OF TRUTH)
                  // See: useCasePowerCalculations.ts
                  // ═══════════════════════════════════════════════════════════════
                  
                  // Merge facilitySize AND EV charger counts into useCaseData for calculation
                  // This ensures EV chargers configured in Goals section are included in sizing
                  const calculationData = {
                    ...wizardState.useCaseData,
                    squareFeet: wizardState.facilitySize, // For office, retail, warehouse
                    facilitySqFt: wizardState.facilitySize, // For datacenter
                    // ═══════════════════════════════════════════════════════════════
                    // CRITICAL: Pass EV charger counts from Goals section to sizing
                    // These override any template question values if set
                    // ═══════════════════════════════════════════════════════════════
                    numberOfLevel2Chargers: wizardState.evChargersL2 || wizardState.useCaseData.numberOfLevel2Chargers || 0,
                    numberOfDCFastChargers: wizardState.evChargersDCFC || wizardState.useCaseData.numberOfDCFastChargers || 0,
                    level2Count: wizardState.evChargersL2 || wizardState.useCaseData.level2Count || 0,
                    dcFastCount: wizardState.evChargersDCFC || wizardState.useCaseData.dcFastCount || 0,
                    // HPC chargers (if using advanced EV charging)
                    hpc_350kw: wizardState.evChargersHPC || 0,
                  };
                  
                  console.log('🔋 [BESS Sizing] Calculation data:', calculationData);
                  
                  // Get industry-specific power calculation
                  const powerResult = calculateUseCasePower(
                    wizardState.selectedIndustry,
                    calculationData
                  );
                  
                  console.log('🔋 [BESS Sizing] Power result:', powerResult);
                  
                  // Convert MW to kW
                  const baseKW = Math.round(powerResult.powerMW * 1000);
                  
                  // Use calculated duration from industry standards, or adjust for backup goal
                  const durationHours = wizardState.goals.includes('backup-power') 
                    ? Math.max(powerResult.durationHrs, 6) // At least 6 hrs for backup
                    : powerResult.durationHrs;
                  
                  // ═══════════════════════════════════════════════════════════════
                  // FIX: PRESERVE USER INPUTS! Only auto-calculate defaults if user
                  // hasn't already set values. This prevents overwriting slider inputs.
                  // ═══════════════════════════════════════════════════════════════
                  const userSetSolarKW = wizardState.solarKW > 0;
                  const userSetWindKW = wizardState.windTurbineKW > 0;
                  const userSetGeneratorKW = wizardState.generatorKW > 0;
                  
                  // Only auto-calculate solar if user enabled it but hasn't adjusted the slider
                  const defaultSolarKW = Math.round(baseKW * 1.2);
                  const solarKW = wizardState.wantsSolar 
                    ? (userSetSolarKW ? wizardState.solarKW : defaultSolarKW)
                    : 0;
                  
                  console.log('🔋 [BESS Sizing] Preserving user inputs:', {
                    userSetSolarKW,
                    existingSolarKW: wizardState.solarKW,
                    defaultSolarKW,
                    finalSolarKW: solarKW,
                  });
                  
                  setWizardState(prev => ({
                    ...prev,
                    batteryKW: baseKW,
                    batteryKWh: baseKW * durationHours,
                    durationHours,
                    // PRESERVE user's solar input if they set it, otherwise use default
                    solarKW: prev.wantsSolar 
                      ? (prev.solarKW > 0 ? prev.solarKW : defaultSolarKW)
                      : 0,
                    // PRESERVE other user inputs
                    windTurbineKW: prev.windTurbineKW,
                    generatorKW: prev.generatorKW,
                  }));
                  
                  advanceToSection(4);
                }}
                disabled={wizardState.goals.length === 0}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
              
              {wizardState.goals.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-3">Select at least one goal to continue</p>
              )}
            </div>
          </div>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: SYSTEM CONFIGURATION
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[4] = el; }}
            className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 4 ? 'hidden' : ''}`}
          >
            <div className="max-w-6xl mx-auto">
              {/* Section Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentSection(3)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Goals
                </button>
                <div className="text-sm text-gray-400">Step 5 of 6</div>
              </div>
              
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-5 py-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 text-sm">AI-Optimized Recommendation</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">System</span> Configuration
                </h2>
                <p className="text-gray-500">Adjust if needed, or continue with our recommendation</p>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════
                  REAL-TIME COST SUMMARY - ALWAYS VISIBLE
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="bg-gradient-to-r from-white via-purple-50 to-white backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200 mb-8 sticky top-4 z-10 shadow-lg">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="text-center lg:text-left">
                    <p className="text-purple-600 text-sm font-semibold uppercase tracking-wider">Estimated Project Cost</p>
                    <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500">
                      ${wizardState.estimatedCost.total >= 1000000 
                        ? (wizardState.estimatedCost.total / 1000000).toFixed(2) + 'M' 
                        : wizardState.estimatedCost.total.toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Configuration Summary Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {wizardState.batteryKWh > 0 && (
                      <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm border border-purple-300">
                        <Battery className="w-4 h-4" />
                        <span className="font-bold">{wizardState.batteryKWh.toLocaleString()} kWh</span>
                        <span className="text-purple-500">Battery</span>
                      </div>
                    )}
                    {wizardState.solarKW > 0 && (
                      <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm border border-amber-300">
                        <Sun className="w-4 h-4" />
                        <span className="font-bold">{wizardState.solarKW} kW</span>
                        <span className="text-amber-500">Solar</span>
                      </div>
                    )}
                    {wizardState.windTurbineKW > 0 && (
                      <div className="flex items-center gap-2 bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full text-sm border border-sky-300">
                        <Wind className="w-4 h-4" />
                        <span className="font-bold">{wizardState.windTurbineKW} kW</span>
                        <span className="text-sky-500">Wind</span>
                      </div>
                    )}
                    {wizardState.generatorKW > 0 && (
                      <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm border border-slate-300">
                        <Fuel className="w-4 h-4" />
                        <span className="font-bold">{wizardState.generatorKW} kW</span>
                        <span className="text-slate-500">Generator</span>
                      </div>
                    )}
                    {(wizardState.evChargersL1 + wizardState.evChargersL2 + wizardState.evChargersDCFC + wizardState.evChargersHPC) > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm border border-emerald-300">
                        <Car className="w-4 h-4" />
                        <span className="font-bold">
                          {wizardState.evChargersL1 > 0 && `${wizardState.evChargersL1} L1`}
                          {wizardState.evChargersL2 > 0 && ` ${wizardState.evChargersL2} L2`}
                          {wizardState.evChargersDCFC > 0 && ` ${wizardState.evChargersDCFC} L3`}
                          {wizardState.evChargersHPC > 0 && ` ${wizardState.evChargersHPC} Ultra`}
                        </span>
                        <span className="text-emerald-500">Chargers</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cost Breakdown Bar */}
                {wizardState.estimatedCost.total > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
                      {wizardState.estimatedCost.battery > 0 && (
                        <div 
                          className="bg-purple-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.battery / wizardState.estimatedCost.total) * 100}%` }}
                          title={`Battery: $${wizardState.estimatedCost.battery.toLocaleString()}`}
                        />
                      )}
                      {wizardState.estimatedCost.solar > 0 && (
                        <div 
                          className="bg-amber-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.solar / wizardState.estimatedCost.total) * 100}%` }}
                          title={`Solar: $${wizardState.estimatedCost.solar.toLocaleString()}`}
                        />
                      )}
                      {wizardState.estimatedCost.wind > 0 && (
                        <div 
                          className="bg-sky-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.wind / wizardState.estimatedCost.total) * 100}%` }}
                          title={`Wind: $${wizardState.estimatedCost.wind.toLocaleString()}`}
                        />
                      )}
                      {wizardState.estimatedCost.generator > 0 && (
                        <div 
                          className="bg-slate-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.generator / wizardState.estimatedCost.total) * 100}%` }}
                          title={`Generator: $${wizardState.estimatedCost.generator.toLocaleString()}`}
                        />
                      )}
                      {wizardState.estimatedCost.evChargers > 0 && (
                        <div 
                          className="bg-emerald-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.evChargers / wizardState.estimatedCost.total) * 100}%` }}
                          title={`EV Chargers: $${wizardState.estimatedCost.evChargers.toLocaleString()}`}
                        />
                      )}
                      {wizardState.estimatedCost.installation > 0 && (
                        <div 
                          className="bg-cyan-500 h-full" 
                          style={{ width: `${(wizardState.estimatedCost.installation / wizardState.estimatedCost.total) * 100}%` }}
                          title={`Installation: $${wizardState.estimatedCost.installation.toLocaleString()}`}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
                      {wizardState.estimatedCost.battery > 0 && (
                        <span><span className="w-2 h-2 inline-block rounded-full bg-purple-500 mr-1"></span>Battery: ${wizardState.estimatedCost.battery.toLocaleString()}</span>
                      )}
                      {wizardState.estimatedCost.solar > 0 && (
                        <span><span className="w-2 h-2 inline-block rounded-full bg-amber-500 mr-1"></span>Solar: ${wizardState.estimatedCost.solar.toLocaleString()}</span>
                      )}
                      {wizardState.estimatedCost.wind > 0 && (
                        <span><span className="w-2 h-2 inline-block rounded-full bg-sky-500 mr-1"></span>Wind: ${wizardState.estimatedCost.wind.toLocaleString()}</span>
                      )}
                      {wizardState.estimatedCost.generator > 0 && (
                        <span><span className="w-2 h-2 inline-block rounded-full bg-slate-500 mr-1"></span>Generator: ${wizardState.estimatedCost.generator.toLocaleString()}</span>
                      )}
                      {wizardState.estimatedCost.evChargers > 0 && (
                        <>
                          <span className="font-semibold text-emerald-700">EV Chargers: ${wizardState.estimatedCost.evChargers.toLocaleString()}</span>
                          {wizardState.evChargersL1 > 0 && (
                            <span className="text-emerald-600 ml-2">({wizardState.evChargersL1} L1)</span>
                          )}
                          {wizardState.evChargersL2 > 0 && (
                            <span className="text-emerald-600 ml-2">({wizardState.evChargersL2} L2)</span>
                          )}
                          {wizardState.evChargersDCFC > 0 && (
                            <span className="text-emerald-600 ml-2">({wizardState.evChargersDCFC} DCFC)</span>
                          )}
                          {wizardState.evChargersHPC > 0 && (
                            <span className="text-emerald-600 ml-2">({wizardState.evChargersHPC} HPC)</span>
                          )}
                        </>
                      )}
                      {wizardState.estimatedCost.installation > 0 && (
                        <span><span className="w-2 h-2 inline-block rounded-full bg-cyan-500 mr-1"></span>Installation: ${wizardState.estimatedCost.installation.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════
                  BEFORE/AFTER UTILITY IMPACT - FIX 4
                  ═══════════════════════════════════════════════════════════════ */}
              {(() => {
                // Calculate utility impact based on configuration
                const batteryKW = wizardState.batteryKW || 0;
                const solarKW = wizardState.solarKW || 0;
                const electricityRate = wizardState.electricityRate || 0.12;
                const peakDemandKW = batteryKW * 1.5; // Estimate peak demand
                const demandChargeRate = 15; // $/kW average
                
                // Before: Current utility costs
                const monthlyEnergyConsumption = peakDemandKW * 720 * 0.3; // 30% load factor
                const currentEnergyCost = Math.round(monthlyEnergyConsumption * electricityRate);
                const currentDemandCharges = Math.round(peakDemandKW * demandChargeRate);
                const currentMonthlyBill = currentEnergyCost + currentDemandCharges;
                
                // After: With BESS
                const solarOffset = solarKW > 0 ? Math.min(0.4, (solarKW / peakDemandKW) * 0.5) : 0;
                const peakShavingPercent = batteryKW > 0 ? Math.min(0.35, batteryKW / peakDemandKW * 0.3) : 0;
                const projectedEnergyCost = Math.round(currentEnergyCost * (1 - solarOffset));
                const projectedDemandCharges = Math.round(currentDemandCharges * (1 - peakShavingPercent));
                const projectedMonthlyBill = projectedEnergyCost + projectedDemandCharges;
                const monthlySavings = currentMonthlyBill - projectedMonthlyBill;
                
                return currentMonthlyBill > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Before/After Utility Comparison */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-green-500" />
                        Utility Impact Comparison
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                          <div className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-1">Before BESS</div>
                          <div className="text-xl sm:text-2xl md:text-3xl font-black text-red-500 truncate">
                            ${currentMonthlyBill >= 1000000 
                              ? `${(currentMonthlyBill / 1000000).toFixed(1)}M`
                              : currentMonthlyBill >= 10000 
                                ? `${Math.round(currentMonthlyBill / 1000)}K`
                                : currentMonthlyBill.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">After BESS</div>
                          <div className="text-xl sm:text-2xl md:text-3xl font-black text-green-500 truncate">
                            ${projectedMonthlyBill >= 1000000 
                              ? `${(projectedMonthlyBill / 1000000).toFixed(1)}M`
                              : projectedMonthlyBill >= 10000 
                                ? `${Math.round(projectedMonthlyBill / 1000)}K`
                                : projectedMonthlyBill.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <div className="text-lg sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                          Save ${monthlySavings >= 1000000 
                            ? `${(monthlySavings / 1000000).toFixed(1)}M`
                            : monthlySavings >= 10000 
                              ? `${Math.round(monthlySavings / 1000)}K`
                              : monthlySavings.toLocaleString()}/month
                        </div>
                        <div className="text-sm text-gray-500">
                          ({currentMonthlyBill > 0 ? Math.round((monthlySavings / currentMonthlyBill) * 100) : 0}% reduction • ${(monthlySavings * 12).toLocaleString()}/year)
                        </div>
                      </div>
                    </div>
                    
                    {/* Why This Configuration - FIX 5 */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Why This Configuration?
                      </h3>
                      <ul className="space-y-3">
                        {solarKW > 0 && wizardState.geoRecommendations && (
                          <li className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gray-800">Solar recommended:</span>
                              <span className="text-gray-600"> {wizardState.state} averages {wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)} sun-hours/day</span>
                            </div>
                          </li>
                        )}
                        {batteryKW > 0 && (
                          <li className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gray-800">Battery storage:</span>
                              <span className="text-gray-600"> Capture ~{Math.round(peakShavingPercent * 100)}% peak demand savings</span>
                            </div>
                          </li>
                        )}
                        {electricityRate > 0.12 && (
                          <li className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gray-800">High utility rates:</span>
                              <span className="text-gray-600"> ${electricityRate.toFixed(2)}/kWh makes storage valuable</span>
                            </div>
                          </li>
                        )}
                        {(wizardState.selectedIndustry === 'data-center' || wizardState.selectedIndustry === 'hospital') && (
                          <li className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gray-800">Critical facility:</span>
                              <span className="text-gray-600"> Extended backup ({wizardState.durationHours}+ hours) recommended</span>
                            </div>
                          </li>
                        )}
                        {wizardState.geoRecommendations?.profile.gridReliabilityScore && wizardState.geoRecommendations.profile.gridReliabilityScore < 85 && (
                          <li className="flex items-start gap-3 text-sm">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-gray-800">Grid reliability:</span>
                              <span className="text-gray-600"> Score {wizardState.geoRecommendations.profile.gridReliabilityScore}/100 - backup power valuable</span>
                            </div>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* ═══════════════════════════════════════════════════════════════
                  REVIEW & CUSTOMIZE - MERLIN'S RECOMMENDATIONS vs YOUR SELECTIONS
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 border-2 border-purple-300 mb-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Review & Customize</h3>
                      <p className="text-sm text-gray-500">Compare Merlin's recommendation with your selections</p>
                    </div>
                  </div>
                  
                  {/* PROMINENT: Use Merlin's Recommendation Button - Always visible at top */}
                  <button
                    onClick={() => {
                      setWizardState(prev => ({
                        ...prev,
                        batteryKW: centralizedState.calculated.recommendedBatteryKW || prev.batteryKW,
                        durationHours: centralizedState.calculated.recommendedBackupHours || prev.durationHours,
                        batteryKWh: (centralizedState.calculated.recommendedBatteryKW || prev.batteryKW) * 
                                    (centralizedState.calculated.recommendedBackupHours || prev.durationHours),
                        solarKW: wizardState.wantsSolar ? (centralizedState.calculated.recommendedSolarKW || prev.solarKW) : prev.solarKW,
                      }));
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Use Merlin's Recommendation
                  </button>
                </div>
                
                {/* Recommendation Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column: Merlin's SSOT Recommendation */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
                      <h4 className="font-bold text-purple-700">Merlin's Recommendation</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {/* BESS Recommendation */}
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">Battery Storage</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-700">
                            {centralizedState.calculated.recommendedBatteryKW >= 1000 
                              ? `${(centralizedState.calculated.recommendedBatteryKW/1000).toFixed(1)} MW`
                              : `${centralizedState.calculated.recommendedBatteryKW || 0} kW`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {centralizedState.calculated.recommendedBatteryKWh >= 1000 
                              ? `${(centralizedState.calculated.recommendedBatteryKWh/1000).toFixed(1)} MWh`
                              : `${centralizedState.calculated.recommendedBatteryKWh || 0} kWh`} storage
                          </div>
                        </div>
                      </div>
                      
                      {/* Backup Hours Recommendation */}
                      <div className="flex justify-between items-center py-2 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-600">Backup Duration</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-700">
                            {centralizedState.calculated.recommendedBackupHours || 4} hours
                          </div>
                          <div className="text-xs text-gray-500">
                            Based on {wizardState.gridConnection === 'unreliable' ? 'unreliable grid' : 
                                     wizardState.gridConnection === 'off-grid' ? 'off-grid setup' :
                                     wizardState.gridConnection === 'limited' ? 'limited grid' : 'your grid status'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Solar Recommendation (if enabled) */}
                      {wizardState.wantsSolar && (
                        <div className="flex justify-between items-center py-2 border-b border-purple-100">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-600">Solar</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-600">
                              {centralizedState.calculated.recommendedSolarKW >= 1000 
                                ? `${(centralizedState.calculated.recommendedSolarKW/1000).toFixed(1)} MW`
                                : `${centralizedState.calculated.recommendedSolarKW || 0} kW`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {wizardState.geoRecommendations?.profile.avgSolarHoursPerDay.toFixed(1) || 5} sun-hours/day
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Peak Demand Summary */}
                      <div className="flex justify-between items-center py-2 bg-purple-50 rounded-lg px-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-700 font-medium">Total Peak Demand</span>
                        </div>
                        <div className="font-bold text-purple-800">
                          {centralizedState.calculated.totalPeakDemandKW >= 1000 
                            ? `${(centralizedState.calculated.totalPeakDemandKW/1000).toFixed(1)} MW`
                            : `${Math.round(centralizedState.calculated.totalPeakDemandKW || 0)} kW`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Your Selection with Adjustment */}
                  <div className="bg-white/80 rounded-2xl p-5 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Settings className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-emerald-700">Your Selection (Adjustable)</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {/* BESS Power Slider */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Battery Power</span>
                          <span className="font-bold text-emerald-700">
                            {wizardState.batteryKW >= 1000 
                              ? `${(wizardState.batteryKW/1000).toFixed(1)} MW`
                              : `${wizardState.batteryKW} kW`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={10000}
                          step={10}
                          value={wizardState.batteryKW}
                          onChange={(e) => {
                            const newKW = parseInt(e.target.value);
                            setWizardState(prev => ({ 
                              ...prev, 
                              batteryKW: newKW,
                              batteryKWh: newKW * prev.durationHours 
                            }));
                          }}
                          className="w-full accent-emerald-500"
                        />
                        {wizardState.batteryKW !== centralizedState.calculated.recommendedBatteryKW && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Different from recommendation ({centralizedState.calculated.recommendedBatteryKW} kW)
                          </div>
                        )}
                      </div>
                      
                      {/* Duration Slider */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Backup Duration</span>
                          <span className="font-bold text-emerald-700">{wizardState.durationHours} hours</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={12}
                          step={0.5}
                          value={wizardState.durationHours}
                          onChange={(e) => {
                            const newHours = parseFloat(e.target.value);
                            setWizardState(prev => ({ 
                              ...prev, 
                              durationHours: newHours,
                              batteryKWh: prev.batteryKW * newHours 
                            }));
                          }}
                          className="w-full accent-emerald-500"
                        />
                        {wizardState.durationHours !== centralizedState.calculated.recommendedBackupHours && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Different from recommendation ({centralizedState.calculated.recommendedBackupHours} hrs)
                          </div>
                        )}
                      </div>
                      
                      {/* Solar Slider (if enabled) */}
                      {wizardState.wantsSolar && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Solar Capacity</span>
                            <span className="font-bold text-amber-600">
                              {wizardState.solarKW >= 1000 
                                ? `${(wizardState.solarKW/1000).toFixed(1)} MW`
                                : `${wizardState.solarKW} kW`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(10000, wizardState.solarKW * 2)}
                            step={10}
                            value={wizardState.solarKW}
                            onChange={(e) => setWizardState(prev => ({ ...prev, solarKW: parseInt(e.target.value) }))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      )}
                      
                      {/* EV Charger Summary (if any) */}
                      {(wizardState.existingEVL1 > 0 || wizardState.existingEVL2 > 0 || wizardState.existingEVL3 > 0 ||
                        wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
                        <div className="bg-emerald-50 rounded-lg p-3 mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-emerald-700">EV Chargers</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {(wizardState.existingEVL1 > 0 || wizardState.existingEVL2 > 0 || wizardState.existingEVL3 > 0) && (
                              <div className="text-gray-600">
                                <span className="font-medium">Existing:</span>{' '}
                                {((wizardState.existingEVL1 || 0) * 1.4 + (wizardState.existingEVL2 || 0) * 11 + (wizardState.existingEVL3 || 0) * 100).toFixed(0)} kW
                              </div>
                            )}
                            {(wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
                              <div className="text-gray-600">
                                <span className="font-medium">New:</span>{' '}
                                {(wizardState.evChargersL2 * 11 + wizardState.evChargersDCFC * 100 + wizardState.evChargersHPC * 350)} kW
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Grid Status Impact Notice */}
                {wizardState.gridConnection && wizardState.gridConnection !== 'on-grid' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-xl">
                        {wizardState.gridConnection === 'unreliable' ? '⚠️' : 
                         wizardState.gridConnection === 'off-grid' ? '🏝️' :
                         wizardState.gridConnection === 'expensive' ? '💰' : '📉'}
                      </div>
                      <div>
                        <div className="font-bold text-amber-800">
                          {wizardState.gridConnection === 'unreliable' ? 'Unreliable Grid Detected' : 
                           wizardState.gridConnection === 'off-grid' ? 'Off-Grid Configuration' :
                           wizardState.gridConnection === 'expensive' ? 'High Electricity Costs' : 'Limited Grid Capacity'}
                        </div>
                        <div className="text-sm text-amber-700">
                          {wizardState.gridConnection === 'unreliable' 
                            ? `Merlin recommends ${centralizedState.calculated.recommendedBackupHours || 6} hours of backup for reliability.`
                            : wizardState.gridConnection === 'off-grid'
                              ? `Off-grid systems need ${centralizedState.calculated.recommendedBackupHours || 8} hours minimum backup.`
                              : wizardState.gridConnection === 'expensive'
                                ? 'Battery storage helps reduce peak demand charges.'
                                : 'Battery can help manage grid capacity constraints.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ═══════════════════════════════════════════════════════════════
                    POWER GAP INDICATOR - Shows if current selection meets needs
                    Red → Yellow → Green as user adjusts configuration
                ═══════════════════════════════════════════════════════════════ */}
                {centralizedState.calculated.recommendedBatteryKW > 0 && (
                  <div className="mt-6">
                    <PowerGapIndicator
                      selectedPowerKW={wizardState.batteryKW}
                      selectedEnergyKWh={wizardState.batteryKWh}
                      selectedDurationHours={wizardState.durationHours}
                      neededPowerKW={centralizedState.calculated.recommendedBatteryKW}
                      neededEnergyKWh={centralizedState.calculated.recommendedBatteryKWh}
                      neededDurationHours={centralizedState.calculated.recommendedBackupHours || 4}
                      showDetails={true}
                      showResolutionOptions={true}
                      useCaseName={wizardState.industryName || 'your facility'}
                      onAcceptRecommendation={(type) => {
                        // Handle different resolution types
                        if (type === 'optimal_mix' || type === 'upgrade_battery') {
                          // Apply Merlin's full recommendation
                          setWizardState(prev => ({
                            ...prev,
                            batteryKW: centralizedState.calculated.recommendedBatteryKW || prev.batteryKW,
                            batteryKWh: centralizedState.calculated.recommendedBatteryKWh || prev.batteryKWh,
                            durationHours: centralizedState.calculated.recommendedBackupHours || prev.durationHours,
                          }));
                        } else if (type === 'add_solar') {
                          // Add solar to cover the gap
                          const gap = Math.max(0, (centralizedState.calculated.recommendedBatteryKW || 0) - wizardState.batteryKW);
                          setWizardState(prev => ({
                            ...prev,
                            wantsSolar: true,
                            solarKW: Math.round(gap * 1.2), // 20% extra solar to account for variability
                          }));
                        } else if (type === 'add_generator') {
                          // Add generator for backup
                          const gap = Math.max(0, (centralizedState.calculated.recommendedBatteryKW || 0) - wizardState.batteryKW);
                          setWizardState(prev => ({
                            ...prev,
                            wantsGenerator: true,
                            generatorKW: Math.round(gap),
                          }));
                        }
                      }}
                      onShowExplainer={() => setShowPowerProfileExplainer(true)}
                    />
                  </div>
                )}
              </div>
              
              {/* Generate Quote Button */}
              <button
                onClick={async () => {
                  setWizardState(prev => ({ ...prev, isCalculating: true }));
                  completeSection('configuration');
                  
                  try {
                    // Map grid connection to SSOT-compatible values
                    // 'unreliable' and 'expensive' map to 'limited' for sizing purposes
                    const gridConnectionForQuote: 'on-grid' | 'off-grid' | 'limited' = 
                      wizardState.gridConnection === 'off-grid' ? 'off-grid' :
                      wizardState.gridConnection === 'on-grid' ? 'on-grid' : 'limited';
                    
                    const result = await QuoteEngine.generateQuote({
                      storageSizeMW: wizardState.batteryKW / 1000,
                      durationHours: wizardState.durationHours,
                      location: wizardState.state,
                      electricityRate: wizardState.electricityRate,
                      useCase: wizardState.selectedIndustry,
                      solarMW: wizardState.solarKW / 1000,
                      windMW: wizardState.windTurbineKW / 1000,
                      generatorMW: wizardState.generatorKW / 1000,
                      generatorFuelType: wizardState.generatorFuel === 'propane' ? 'diesel' : wizardState.generatorFuel,
                      gridConnection: gridConnectionForQuote,
                    });
                    
                    // Generate MERLIN Premium configuration and comparison
                    // Parameters: useCase, storageSizeMW, durationHours, solarMW
                    const premium = generatePremiumConfiguration(
                      wizardState.selectedIndustry || 'commercial',
                      wizardState.batteryKW / 1000, // Convert kW to MW
                      wizardState.durationHours,
                      wizardState.solarKW > 0 ? wizardState.solarKW / 1000 : 0 // Convert kW to MW
                    );
                    setPremiumConfig(premium);
                    
                    const comparison = calculatePremiumComparison(
                      wizardState.selectedIndustry || 'commercial',
                      wizardState.batteryKW / 1000, // storageSizeMW
                      wizardState.durationHours,
                      wizardState.solarKW > 0 ? wizardState.solarKW / 1000 : 0
                    );
                    setPremiumComparison(comparison);
                    setShowPremiumView(false); // Reset to standard view
                    
                    setWizardState(prev => ({ ...prev, quoteResult: result, isCalculating: false }));
                    advanceToSection(5);
                  } catch (error) {
                    console.error('Quote calculation error:', error);
                    setWizardState(prev => ({ ...prev, isCalculating: false }));
                  }
                }}
                disabled={wizardState.isCalculating}
                className="w-full mt-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                {wizardState.isCalculating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating Your Quote...
                  </>
                ) : (
                  <>
                    Generate My Quote <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5: QUOTE RESULTS
              ══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={el => { sectionRefs.current[5] = el; }}
            className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 5 ? 'hidden' : ''}`}
          >
            <div className="max-w-5xl mx-auto">
              {/* Section Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentSection(4)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Configuration
                </button>
                <div className="text-sm text-gray-400">Step 6 of 6 • Final Quote</div>
              </div>
              
              {wizardState.quoteResult ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-5 py-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Quote Complete!</span>
                      </div>
                      <TrueQuoteBadge size="md" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                      Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500">Custom Quote</span>
                    </h2>
                    <p className="text-gray-500">{wizardState.industryName} • {wizardState.state} • {wizardState.facilitySize.toLocaleString()} {FACILITY_PRESETS[wizardState.selectedIndustry]?.unit || 'sq ft'}</p>
                  </div>
                  
                  {/* TrueQuote™ Banner - Shows transparency message */}
                  <TrueQuoteBanner variant="compact" />
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 rounded-3xl p-8 border-2 border-emerald-300 text-center mb-8 mt-6 shadow-lg">
                    <p className="text-emerald-600 uppercase tracking-widest text-sm font-bold mb-2">💰 Estimated Annual Savings</p>
                    <p className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500">
                      ${Math.round(wizardState.quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-gray-500 mt-2">per year</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 text-center border border-purple-200 shadow-md">
                      <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-800">{wizardState.quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">Year Payback</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 text-center border border-emerald-200 shadow-md">
                      <TrendingDown className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-800">{Math.round(wizardState.quoteResult.financials.roi25Year)}%</p>
                      <p className="text-sm text-gray-500">25-Year ROI</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 text-center border border-blue-200 shadow-md">
                      <Battery className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-800">{wizardState.batteryKWh.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">kWh Storage</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 text-center border border-amber-200 shadow-md">
                      <DollarSign className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-800">${Math.round(wizardState.quoteResult.costs.netCost / 1000)}K</p>
                      <p className="text-sm text-gray-500">Net Cost</p>
                    </div>
                  </div>
                  
                  {/* EV Charger Energy Analysis - Only show if EV chargers are configured */}
                  {(wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0) && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 mb-8">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        EV Charger Energy Analysis
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Charger Demand */}
                        <div className="bg-white rounded-xl p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Peak Charger Demand</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {((wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 150) + (wizardState.evChargersHPC * 350)).toLocaleString()} kW
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {wizardState.evChargersL2 > 0 && `${wizardState.evChargersL2} L2 (${wizardState.evChargersL2 * 11} kW)`}
                            {wizardState.evChargersDCFC > 0 && ` • ${wizardState.evChargersDCFC} DCFC (${wizardState.evChargersDCFC * 150} kW)`}
                            {wizardState.evChargersHPC > 0 && ` • ${wizardState.evChargersHPC} HPC (${wizardState.evChargersHPC * 350} kW)`}
                          </p>
                        </div>
                        
                        {/* Battery Support */}
                        <div className="bg-white rounded-xl p-4 border border-emerald-200">
                          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Battery Coverage</p>
                          {(() => {
                            const chargerPeakKW = (wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 150) + (wizardState.evChargersHPC * 350);
                            const batteryHours = chargerPeakKW > 0 ? wizardState.batteryKWh / chargerPeakKW : 0;
                            const coveragePercent = wizardState.batteryKW > 0 ? Math.min(100, (wizardState.batteryKW / chargerPeakKW) * 100) : 0;
                            return (
                              <>
                                <p className={`text-2xl font-bold ${coveragePercent >= 80 ? 'text-emerald-600' : coveragePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {coveragePercent.toFixed(0)}% Peak
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {batteryHours >= 1 ? `${batteryHours.toFixed(1)} hrs at full demand` : 'Consider larger battery for extended support'}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Solar Offset */}
                        <div className="bg-white rounded-xl p-4 border border-amber-200">
                          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Solar Offset</p>
                          {(() => {
                            const dailyChargerKWh = ((wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 150) + (wizardState.evChargersHPC * 350)) * 8 * 0.3; // 8 hrs at 30% utilization
                            const dailySolarKWh = wizardState.solarKW * 5; // Avg 5 sun hours
                            const offsetPercent = dailyChargerKWh > 0 ? Math.min(100, (dailySolarKWh / dailyChargerKWh) * 100) : 0;
                            return (
                              <>
                                <p className={`text-2xl font-bold ${wizardState.solarKW > 0 ? (offsetPercent >= 50 ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-400'}`}>
                                  {wizardState.solarKW > 0 ? `${offsetPercent.toFixed(0)}%` : 'No Solar'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {wizardState.solarKW > 0 
                                    ? `~${Math.round(dailySolarKWh)} kWh/day from ${wizardState.solarKW} kW solar`
                                    : 'Add solar to offset charging costs'}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Recommendation message */}
                      {(() => {
                        const chargerPeakKW = (wizardState.evChargersL2 * 11) + (wizardState.evChargersDCFC * 150) + (wizardState.evChargersHPC * 350);
                        const coveragePercent = wizardState.batteryKW > 0 ? (wizardState.batteryKW / chargerPeakKW) * 100 : 0;
                        
                        if (coveragePercent < 50) {
                          return (
                            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-sm text-amber-700">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>
                                  <strong>Sizing Recommendation:</strong> Your current battery ({wizardState.batteryKW} kW) covers only {coveragePercent.toFixed(0)}% of charger peak demand ({chargerPeakKW} kW). 
                                  Consider increasing battery size to at least {Math.round(chargerPeakKW * 0.8)} kW for effective demand charge management.
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  
                  {/* Cost Breakdown */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-md">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Investment Summary
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Equipment Cost</span>
                          <span className="text-gray-800">${Math.round(wizardState.quoteResult.costs.equipmentCost).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Installation</span>
                          <span className="text-gray-800">${Math.round(wizardState.quoteResult.costs.installationCost).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t border-gray-200">
                          <span className="text-gray-800 font-medium">Total Project Cost</span>
                          <span className="text-gray-800 font-bold">${Math.round(wizardState.quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Federal Tax Credit (30%)</span>
                          <span>-${Math.round(wizardState.quoteResult.costs.taxCredit).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-emerald-100 rounded-lg px-3 text-lg">
                          <span className="text-emerald-700 font-bold">Net Cost</span>
                          <span className="text-emerald-600 font-black">${Math.round(wizardState.quoteResult.costs.netCost).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Premium Option - Clickable to expand */}
                      {premiumComparison && premiumConfig && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowPremiumView(!showPremiumView)}
                            className="w-full text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <span className="font-semibold text-amber-700">MERLIN Premium</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-600">
                                  ${Math.round(premiumComparison.premium.totalCost * 0.7).toLocaleString()}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-amber-500 transition-transform ${showPremiumView ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              +${Math.round(premiumComparison.delta.totalCost * 0.7).toLocaleString()} for premium equipment • Click to see what's included
                            </p>
                          </button>
                          
                          {/* Expandable Premium Details */}
                          {showPremiumView && (
                            <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 animate-in slide-in-from-top-2 duration-200">
                              <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-3">
                                  <Battery className="w-5 h-5 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-gray-800">{premiumConfig.battery.manufacturer} {premiumConfig.battery.model}</p>
                                    <p className="text-gray-600">{premiumConfig.battery.warrantyYears}-year warranty • {premiumConfig.battery.cycleLife.toLocaleString()} cycles • {(premiumConfig.battery.roundTripEfficiency * 100).toFixed(0)}% efficiency</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-gray-800">{premiumConfig.inverter.manufacturer} {premiumConfig.inverter.model}</p>
                                    <p className="text-gray-600">{(premiumConfig.inverter.efficiency * 100).toFixed(1)}% efficiency • {premiumConfig.inverter.gridServices.slice(0, 2).join(', ')}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Settings className="w-5 h-5 text-amber-600 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-gray-800">{premiumConfig.microgridController.manufacturer} Controller</p>
                                    <p className="text-gray-600">{premiumConfig.microgridController.features.slice(0, 2).join(', ')}</p>
                                  </div>
                                </div>
                                
                                {/* Premium Value Summary */}
                                <div className="mt-3 pt-3 border-t border-amber-200">
                                  <p className="font-semibold text-amber-800 mb-2">Why Premium?</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {premiumComparison.valueProposition.slice(0, 4).map((benefit, i) => (
                                      <div key={i} className="flex items-center gap-1 text-amber-700">
                                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{benefit}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Get Premium Quote Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRfqType('premium');
                                    setRfqForm(prev => ({
                                      ...prev,
                                      projectName: `${wizardState.industryName} - Premium BESS Project`
                                    }));
                                    setShowRFQModal(true);
                                  }}
                                  className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                  <Crown className="w-4 h-4" />
                                  Get Premium Vendor Quotes
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-md">
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        System Specifications
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Battery Power</span>
                          <span className="text-gray-800 font-medium">{wizardState.batteryKW} kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Storage Capacity</span>
                          <span className="text-gray-800 font-medium">{wizardState.batteryKWh.toLocaleString()} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration</span>
                          <span className="text-gray-800 font-medium">{wizardState.durationHours} hours</span>
                        </div>
                        {wizardState.solarKW > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Solar Capacity</span>
                            <span className="text-amber-600 font-medium">{wizardState.solarKW} kW</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location</span>
                          <span className="text-gray-800 font-medium">{wizardState.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Electricity Rate</span>
                          <span className="text-gray-800 font-medium">${wizardState.electricityRate.toFixed(2)}/kWh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Export Dropdown */}
                    <div className="relative group">
                      <button
                        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Export Quote
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                        <button
                          onClick={() => {
                            const quoteData = {
                              storageSizeMW: wizardState.batteryKW / 1000,
                              durationHours: wizardState.durationHours,
                              solarMW: wizardState.solarKW / 1000,
                              windMW: wizardState.windTurbineKW / 1000,
                              generatorMW: wizardState.generatorKW / 1000,
                              location: wizardState.state,
                              industryTemplate: wizardState.selectedIndustry || 'bess',
                              gridConnection: wizardState.gridConnection,
                              totalProjectCost: wizardState.quoteResult!.costs.totalProjectCost,
                              annualSavings: wizardState.quoteResult!.financials.annualSavings,
                              paybackYears: wizardState.quoteResult!.financials.paybackYears,
                              taxCredit: wizardState.quoteResult!.costs.taxCredit || 0,
                              netCost: wizardState.quoteResult!.costs.netCost,
                              installationOption: 'epc',
                              shippingOption: 'standard',
                              financingOption: 'cash',
                            };
                            generatePDF(quoteData, wizardState.quoteResult!.equipment);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border-b border-gray-100"
                        >
                          <FileText className="w-5 h-5 text-red-500" />
                          <div>
                            <div className="font-semibold">PDF Document</div>
                            <div className="text-xs text-gray-500">Professional quote for stakeholders</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const quoteData = {
                              storageSizeMW: wizardState.batteryKW / 1000,
                              durationHours: wizardState.durationHours,
                              solarMW: wizardState.solarKW / 1000,
                              windMW: wizardState.windTurbineKW / 1000,
                              generatorMW: wizardState.generatorKW / 1000,
                              location: wizardState.state,
                              industryTemplate: wizardState.selectedIndustry || 'bess',
                              gridConnection: wizardState.gridConnection,
                              totalProjectCost: wizardState.quoteResult!.costs.totalProjectCost,
                              annualSavings: wizardState.quoteResult!.financials.annualSavings,
                              paybackYears: wizardState.quoteResult!.financials.paybackYears,
                              taxCredit: wizardState.quoteResult!.costs.taxCredit || 0,
                              netCost: wizardState.quoteResult!.costs.netCost,
                              installationOption: 'epc',
                              shippingOption: 'standard',
                              financingOption: 'cash',
                            };
                            generateWord(quoteData, wizardState.quoteResult!.equipment);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors border-b border-gray-100"
                        >
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <div className="font-semibold">Word Document</div>
                            <div className="text-xs text-gray-500">Editable proposal template</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const quoteData = {
                              storageSizeMW: wizardState.batteryKW / 1000,
                              durationHours: wizardState.durationHours,
                              solarMW: wizardState.solarKW / 1000,
                              windMW: wizardState.windTurbineKW / 1000,
                              generatorMW: wizardState.generatorKW / 1000,
                              location: wizardState.state,
                              industryTemplate: wizardState.selectedIndustry || 'bess',
                              gridConnection: wizardState.gridConnection,
                              totalProjectCost: wizardState.quoteResult!.costs.totalProjectCost,
                              annualSavings: wizardState.quoteResult!.financials.annualSavings,
                              paybackYears: wizardState.quoteResult!.financials.paybackYears,
                              taxCredit: wizardState.quoteResult!.costs.taxCredit || 0,
                              netCost: wizardState.quoteResult!.costs.netCost,
                              installationOption: 'epc',
                              shippingOption: 'standard',
                              financingOption: 'cash',
                            };
                            generateExcel(quoteData, wizardState.quoteResult!.equipment);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                          <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                          <div>
                            <div className="font-semibold">Excel Spreadsheet</div>
                            <div className="text-xs text-gray-500">Detailed financial model</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setRfqType('standard');
                        setRfqForm(prev => ({
                          ...prev,
                          projectName: `${wizardState.industryName} - BESS Project`
                        }));
                        setShowRFQModal(true);
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      Get Vendor Quotes
                    </button>
                    
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent('Merlin Energy Quote Request');
                        const body = encodeURIComponent(`Hi,\n\nI completed a quote on Merlin Energy and would like to discuss next steps.\n\nQuote Details:\n- Industry: ${wizardState.industryName}\n- Location: ${wizardState.state}\n- Battery: ${wizardState.batteryKWh} kWh\n- Annual Savings: $${Math.round(wizardState.quoteResult!.financials.annualSavings).toLocaleString()}\n- Net Cost: $${Math.round(wizardState.quoteResult!.costs.netCost).toLocaleString()}\n\nPlease contact me to schedule a consultation.\n\nThank you!`);
                        window.open(`mailto:sales@merlinenergy.com?subject=${subject}&body=${body}`);
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Consultation
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentSection(0);
                        setCompletedSections([]);
                        setTotalPoints(0);
                        setWizardState({
                          zipCode: '',
                          state: '',
                          geoRecommendations: null,
                          electricityRate: 0.12,
                          selectedIndustry: '',
                          industryName: '',
                          useCaseId: '',
                          customQuestions: [],
                          useCaseData: {},
                          facilitySize: 25000,
                          goals: [],
                          wantsSolar: true,
                          wantsWind: false,
                          wantsGenerator: false,
                          wantsBackupPower: false,
                          wantsEVCharging: false,
                          hasExistingEV: false,
                          existingEVL1: 0,
                          existingEVL2: 0,
                          existingEVL3: 0,
                          existingEVPowerSource: 'grid',
                          windTurbineKW: 0,
                          generatorKW: 0,
                          generatorFuel: 'natural-gas',
                          generatorType: 'traditional',
                          gridConnection: 'on-grid',
                          batteryKW: 0,
                          batteryKWh: 0,
                          solarKW: 0,
                          durationHours: 4,
                          evChargersL1: 0,
                          evChargersL2: 0,
                          evChargersDCFC: 0,
                          evChargersHPC: 0,
                          quoteResult: null,
                          isCalculating: false,
                          estimatedCost: {
                            battery: 0,
                            solar: 0,
                            wind: 0,
                            generator: 0,
                            evChargers: 0,
                            evChargersL1: 0,
                            evChargersL2: 0,
                            evChargersDCFC: 0,
                            evChargersHPC: 0,
                            installation: 0,
                            total: 0,
                          },
                        });
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Start New Quote
                    </button>
                  </div>
                  
                  {/* Industry Compliance & Methodology */}
                  <QuoteComplianceFooter 
                    methodologyVersion="1.0.0"
                    className="mb-6"
                  />
                  
                  {/* Powered by Merlin */}
                  <div className="text-center mt-12 pt-8 border-t border-purple-200">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                      <div className="text-left">
                        <p className="text-gray-800 font-bold">Powered by Merlin Energy</p>
                        <p className="text-xs text-gray-500">AI-Optimized Battery Storage Solutions</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-gray-800 font-bold text-xl">Generating your quote...</p>
                  <p className="text-gray-500 mt-2">This takes just a moment</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Powered by Merlin Footer - Desktop */}
        <div className="hidden lg:flex items-center justify-center gap-2 py-3 border-t border-purple-200 bg-white/80 text-xs text-gray-500">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>Powered by</span>
          <span className="font-bold text-purple-400">Merlin Energy</span>
          <span className="mx-2">•</span>
          <span>AI-Optimized Battery Storage Solutions</span>
        </div>
      </div>
      </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          POWER PROFILE EXPLAINER MODAL
          Explains what Power Profile is and why it helps users
          ═══════════════════════════════════════════════════════════════════════ */}
      {showPowerProfileExplainer && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowPowerProfileExplainer(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div 
            className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Merlin */}
            <div className="relative p-6 pb-4 border-b border-purple-500/20">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowPowerProfileExplainer(false)}
                  className="w-8 h-8 bg-purple-800/50 hover:bg-purple-700/50 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-amber-500 to-cyan-500 rounded-full blur-lg opacity-40 animate-pulse" />
                  <img src={merlinImage} alt="Merlin" className="relative w-16 h-16 drop-shadow-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">What is Power Profile?</h2>
                  <p className="text-purple-300/70 text-sm">Your path to smarter energy decisions</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Hero Statement */}
              <div className="text-center py-4">
                <p className="text-lg text-purple-200 leading-relaxed">
                  Power Profile turns complex energy calculations into a <span className="text-amber-400 font-bold">guided journey</span> — 
                  helping you build better quotes <span className="text-emerald-400 font-bold">faster</span> than doing it alone.
                </p>
              </div>
              
              {/* Three Benefits */}
              <div className="grid gap-4">
                {/* Smarter */}
                <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-purple-500/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Smarter</h3>
                    <p className="text-purple-300/80 text-sm">
                      AI analyzes 30+ industry profiles, local utility rates, and equipment specs — calculations that would take hours to research on your own.
                    </p>
                  </div>
                </div>
                
                {/* Faster */}
                <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-amber-500/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Faster</h3>
                    <p className="text-purple-300/80 text-sm">
                      Get a professional, bank-ready quote in 5 minutes. No vendor calls, no waiting for proposals, no back-and-forth emails.
                    </p>
                  </div>
                </div>
                
                {/* Better Results */}
                <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-emerald-500/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Better Results</h3>
                    <p className="text-purple-300/80 text-sm">
                      Optimized for maximum savings with peak shaving, TOU arbitrage, and revenue stacking — strategies most quotes miss entirely.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Gamification Explanation */}
              <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 rounded-2xl p-4 border border-purple-400/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🎮</span>
                  <h4 className="font-bold text-white">Track Your Progress</h4>
                </div>
                <p className="text-purple-300/80 text-sm mb-3">
                  As you complete each section, you earn points and level up your Power Profile. It's not just fun — 
                  it helps you understand exactly what goes into building the perfect energy system.
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full" />
                    <span className="text-emerald-300">Completed sections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-400 rounded-full" />
                    <span className="text-amber-300">Points earned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-400 rounded-full" />
                    <span className="text-purple-300">Level progression</span>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <button 
                onClick={() => setShowPowerProfileExplainer(false)}
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-900 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Got it! Let's build my quote</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* NOTE: DataCenterQuestionnaire modal REMOVED - Dec 9, 2025
          Data centers now use the standard wizard flow like all other industries
          This maintains SSOT/AAD compliance and consistent UX across all use cases */}
      
      {/* RFQ Modal - Vendor Quote Request (SSOT Workflow) */}
      {showRFQModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`p-6 border-b ${rfqType === 'premium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  {rfqType === 'premium' ? <Crown className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                  <div>
                    <h2 className="text-xl font-bold">
                      {rfqType === 'premium' ? 'Request Premium Vendor Quotes' : 'Get Vendor Quotes'}
                    </h2>
                    <p className="text-sm opacity-90">
                      Verified vendors will respond within {rfqType === 'premium' ? '14' : '7'} days
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRFQModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {rfqSuccess ? (
              // Success state
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Quote Request Submitted!</h3>
                <p className="text-gray-600 mb-6">{rfqSuccess}</p>
                <button
                  onClick={() => {
                    setShowRFQModal(false);
                    setRfqSuccess(null);
                  }}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              // Form state
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRfqSubmitting(true);
                  
                  // Prepare RFQ data using SSOT (calculateQuote results)
                  const rfqData: CreateRFQData = {
                    projectName: rfqForm.projectName,
                    systemSizeMW: wizardState.batteryKW / 1000,
                    durationHours: wizardState.durationHours,
                    solarMW: wizardState.solarKW / 1000,
                    windMW: wizardState.windTurbineKW / 1000,
                    generatorMW: wizardState.generatorKW / 1000,
                    location: wizardState.state,
                    useCase: wizardState.selectedIndustry,
                    isPremium: rfqType === 'premium',
                    
                    // Customer info
                    customerEmail: rfqForm.customerEmail,
                    customerName: rfqForm.customerName,
                    customerPhone: rfqForm.customerPhone,
                    
                    // Requirements from premium config
                    requirements: rfqType === 'premium' && premiumConfig ? {
                      batteryManufacturer: premiumConfig.battery.manufacturer,
                      batteryModel: premiumConfig.battery.model,
                      inverterManufacturer: premiumConfig.inverter.manufacturer,
                      inverterModel: premiumConfig.inverter.model,
                      minWarrantyYears: premiumConfig.battery.warrantyYears,
                      minCycleLife: premiumConfig.battery.cycleLife,
                    } : undefined,
                    
                    // SSOT pricing data
                    standardQuoteCost: wizardState.quoteResult?.costs.totalProjectCost || 0,
                    premiumQuoteCost: premiumComparison?.premium.totalCost,
                    
                    projectTimeline: rfqForm.projectTimeline
                  };
                  
                  // Submit to vendor service
                  const result = await createRFQ(rfqData);
                  
                  setRfqSubmitting(false);
                  
                  if (result.success) {
                    setRfqSuccess(result.message || 'Your quote request has been submitted to our vendor network.');
                  } else {
                    alert(result.error || 'Failed to submit quote request. Please try again.');
                  }
                }}
                className="p-6 space-y-4"
              >
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={rfqForm.projectName}
                    onChange={(e) => setRfqForm(prev => ({ ...prev, projectName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="My BESS Project"
                    required
                  />
                </div>
                
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={rfqForm.customerName}
                      onChange={(e) => setRfqForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={rfqForm.customerPhone}
                      onChange={(e) => setRfqForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={rfqForm.customerEmail}
                    onChange={(e) => setRfqForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@company.com"
                    required
                  />
                </div>
                
                {/* Project Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Timeline</label>
                  <select
                    value={rfqForm.projectTimeline}
                    onChange={(e) => setRfqForm(prev => ({ ...prev, projectTimeline: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="immediate">Ready to start immediately</option>
                    <option value="3-months">Within 3 months</option>
                    <option value="6-months">Within 6 months</option>
                    <option value="12-months">Within 12 months</option>
                  </select>
                </div>
                
                {/* Quote Summary */}
                <div className={`rounded-xl p-4 ${rfqType === 'premium' ? 'bg-amber-50 border border-amber-200' : 'bg-purple-50 border border-purple-200'}`}>
                  <h4 className={`font-bold mb-2 ${rfqType === 'premium' ? 'text-amber-800' : 'text-purple-800'}`}>
                    {rfqType === 'premium' ? '🌟 Premium Quote Summary' : '📋 Quote Summary'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">System Size:</div>
                    <div className="font-medium">{wizardState.batteryKWh.toLocaleString()} kWh</div>
                    <div className="text-gray-600">Location:</div>
                    <div className="font-medium">{wizardState.state}</div>
                    <div className="text-gray-600">Use Case:</div>
                    <div className="font-medium">{wizardState.industryName}</div>
                    <div className="text-gray-600">Budget Range:</div>
                    <div className="font-medium">
                      ${Math.round((wizardState.quoteResult?.costs.totalProjectCost || 0) * 0.9 / 1000)}K - 
                      ${Math.round((rfqType === 'premium' && premiumComparison ? premiumComparison.premium.totalCost * 1.1 : (wizardState.quoteResult?.costs.totalProjectCost || 0) * 1.1) / 1000)}K
                    </div>
                  </div>
                  {rfqType === 'premium' && premiumConfig && (
                    <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700">
                      <strong>Premium specs:</strong> {premiumConfig.battery.manufacturer} battery, {premiumConfig.battery.warrantyYears}yr warranty, {premiumConfig.battery.cycleLife.toLocaleString()} cycles
                    </div>
                  )}
                </div>
                
                {/* Submit */}
                <button
                  type="submit"
                  disabled={rfqSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2
                    ${rfqType === 'premium' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'}
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {rfqSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Submit Quote Request
                    </>
                  )}
                </button>
                
                <p className="text-xs text-center text-gray-500">
                  By submitting, you agree to receive quotes from our verified vendor network.
                  Your information is protected and never sold.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
