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
  ChevronDown, ExternalLink, Car, Hotel, Droplets, TrendingDown, TrendingUp,
  Shield, Clock, Download, Phone, Leaf, Gauge, Plus, Minus,
  AlertTriangle, Info, FileSpreadsheet, Mail, Wind, Fuel, Upload, Wand2
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
import { PowerDashboardWidget, type PowerDashboardData } from './widgets';
import { DataCenterQuestionnaire, type DataCenterConfig } from '@/components/modals/DataCenterQuestionnaire';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// PHASE 1: CENTRALIZED STATE (Migration in progress)
// Import new hook - will gradually replace existing useState calls
// ============================================
import { useWizardState } from '@/hooks/useWizardState';
import type { WizardState as CentralizedWizardState } from '@/types/wizardState';

// ============================================
// TYPES
// ============================================

interface StreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
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
  
  // Wind turbines
  windTurbineKW: number; // Total wind capacity
  
  // Backup generator
  generatorKW: number;   // Generator capacity
  generatorFuel: 'diesel' | 'natural-gas' | 'propane';
  generatorType: 'traditional' | 'linear'; // Traditional (Cummins/Cat) vs Linear (Mainspring)
  
  // Grid connection status (for SSOT compliance)
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
  // Section 5: Configuration
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  durationHours: number;
  
  // EV Chargers - NEW STRUCTURE (Q1: Existing, Q2: New)
  hasExistingEVChargers: boolean;  // Q1: Do you have existing?
  wantsNewEVChargers: boolean;     // Q2: Want to add new?
  
  // Existing EV Chargers (from Q1)
  existingEV: {
    L1: { count: number; powerKW: number };   // Level 1: 1.4 kW
    L2: { count: number; powerKW: number };   // Level 2: 7/11/19 kW options
    L3: { count: number; powerKW: number };   // Level 3 (DCFC/HPC): 50/150/350 kW
  };
  
  // New EV Chargers to add (from Q2)
  newEV: {
    L1: { count: number; powerKW: number };
    L2: { count: number; powerKW: number };
    L3: { count: number; powerKW: number };
  };
  
  // Legacy fields (for backwards compatibility - calculated from above)
  evChargersL2: number;   // Level 2 chargers (7-22 kW)
  evChargersDCFC: number; // DC Fast Chargers (50-150 kW)
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
  onOpenAdvanced 
}: StreamlinedWizardProps) {
  // ════════════════════════════════════════════════════════════════
  // PHASE 1: CENTRALIZED STATE HOOK (Migration in progress)
  // This hook will gradually replace individual useState calls below
  // For now, both coexist - we'll migrate section by section
  // ════════════════════════════════════════════════════════════════
  const {
    wizardState: centralizedState,
    updateSection: updateCentralizedSection,
    updateExistingInfra,
    updateEVChargers: updateCentralizedEVChargers,
    updateNewEVChargers,
    resetState: resetCentralizedState,
    getLoadFactorInfo,
  } = useWizardState();
  
  // Log centralized state for debugging during migration
  // TODO: Remove after migration complete
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WizardState Migration] Centralized state:', centralizedState.calculated);
    }
  }, [centralizedState.calculated]);
  
  // ════════════════════════════════════════════════════════════════
  // PHASE 2: SYNC BRIDGE - Legacy state syncs TO centralized state
  // This allows new UI components to read from centralized state
  // while existing components continue to write to legacy state
  // TODO: Remove after full migration to centralized state
  // ════════════════════════════════════════════════════════════════
  
  // We need to track wizardState for sync - use a ref to avoid dependency issues
  const wizardStateRef = useRef<WizardState | null>(null);
  
  // ════════════════════════════════════════════════════════════════
  // LEGACY STATE (Will be migrated to centralizedState in Phase 2)
  // ════════════════════════════════════════════════════════════════
  
  // Current section (0-5)
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Wizard data state - LEGACY (to be migrated)
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
    wantsSolar: true,
    wantsWind: false,
    wantsGenerator: false,
    wantsBackupPower: false,
    wantsEVCharging: false,
    windTurbineKW: 0,
    generatorKW: 0,
    generatorFuel: 'natural-gas',
    generatorType: 'traditional',
    gridConnection: 'on-grid',
    batteryKW: 0,
    batteryKWh: 0,
    solarKW: 0,
    durationHours: 4,
    hasExistingEVChargers: false,
    wantsNewEVChargers: false,
    existingEV: {
      L1: { count: 0, powerKW: 1.4 },
      L2: { count: 0, powerKW: 11 },
      L3: { count: 0, powerKW: 150 },
    },
    newEV: {
      L1: { count: 0, powerKW: 1.4 },
      L2: { count: 0, powerKW: 11 },
      L3: { count: 0, powerKW: 150 },
    },
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
      installation: 0,
      total: 0,
    },
  });
  
  // ════════════════════════════════════════════════════════════════
  // PHASE 2: SYNC EFFECTS - Sync legacy state TO centralized state
  // ════════════════════════════════════════════════════════════════
  
  // Update ref when wizardState changes (for dependency-free access)
  useEffect(() => {
    wizardStateRef.current = wizardState;
  }, [wizardState]);
  
  // Sync Location section (legacy → centralized)
  useEffect(() => {
    updateCentralizedSection('location', {
      zipCode: wizardState.zipCode,
      state: wizardState.state,
      utilityRate: wizardState.electricityRate,
      solarHours: wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay || 5,
    });
  }, [wizardState.zipCode, wizardState.state, wizardState.electricityRate, wizardState.geoRecommendations, updateCentralizedSection]);
  
  // Sync Industry section (legacy → centralized)
  useEffect(() => {
    updateCentralizedSection('industry', {
      type: wizardState.selectedIndustry,
    });
  }, [wizardState.selectedIndustry, updateCentralizedSection]);
  
  // Sync Facility section (legacy → centralized)
  useEffect(() => {
    // Determine if this is rooms-based or sqft-based
    const isRoomBased = ['hotel', 'hotel-hospitality', 'apartment-building'].includes(wizardState.selectedIndustry);
    
    updateCentralizedSection('facility', {
      squareFeet: isRoomBased ? undefined : wizardState.facilitySize,
      roomCount: isRoomBased ? wizardState.facilitySize : undefined,
      operatingHours: 24, // Default for most industries
      occupancy: 75, // Default percentage
    });
  }, [wizardState.facilitySize, wizardState.selectedIndustry, updateCentralizedSection]);
  
  // Sync Existing Infrastructure - EV chargers (legacy → centralized)
  // Note: Legacy uses evChargersL2, evChargersDCFC, evChargersHPC; centralized uses L1, L2, L3
  useEffect(() => {
    // Map DCFC/HPC to L3 (industry standard DCFC = DC Fast Charging = Level 3)
    const totalDCFastChargers = wizardState.evChargersDCFC + wizardState.evChargersHPC;
    
    updateCentralizedEVChargers('L2', { count: wizardState.evChargersL2 });
    updateCentralizedEVChargers('L3', { count: totalDCFastChargers });
    
    // Update solar, generator, and grid connection
    updateExistingInfra('solar', {
      hasExisting: wizardState.wantsSolar,
      capacityKW: wizardState.solarKW,
    });
    updateExistingInfra('generator', {
      hasExisting: wizardState.wantsGenerator,
      capacityKW: wizardState.generatorKW,
      fuelType: (wizardState.generatorFuel as 'diesel' | 'natural-gas' | 'propane' | 'dual-fuel') || 'diesel',
    });
    updateExistingInfra('gridConnection', wizardState.gridConnection as 'on-grid' | 'off-grid' | 'limited');
  }, [
    wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC,
    wizardState.wantsSolar, wizardState.solarKW,
    wizardState.wantsGenerator, wizardState.generatorKW, wizardState.generatorFuel,
    wizardState.gridConnection,
    updateCentralizedEVChargers, updateExistingInfra
  ]);
  
  // Sync Goals section (legacy → centralized)
  useEffect(() => {
    // Map legacy goals array to primary goal
    let primaryGoal: 'backup' | 'savings' | 'sustainability' | 'peak-shaving' = 'backup';
    if (wizardState.goals?.includes('demand-charge-reduction')) primaryGoal = 'peak-shaving';
    else if (wizardState.goals?.includes('lower-bills')) primaryGoal = 'savings';
    else if (wizardState.goals?.includes('green-energy')) primaryGoal = 'sustainability';
    else if (wizardState.goals?.includes('backup-power')) primaryGoal = 'backup';
    
    updateCentralizedSection('goals', {
      primaryGoal,
      addSolar: wizardState.wantsSolar,
      solarKW: wizardState.solarKW,
      addWind: wizardState.wantsWind,
      windKW: wizardState.windTurbineKW,
      addGenerator: wizardState.wantsGenerator,
      generatorKW: wizardState.generatorKW,
      generatorFuel: (wizardState.generatorFuel as 'diesel' | 'natural-gas' | 'propane' | 'dual-fuel') || 'natural-gas',
      addEVChargers: wizardState.wantsEVCharging,
    });
  }, [wizardState.goals, wizardState.wantsSolar, wizardState.solarKW,
      wizardState.wantsWind, wizardState.windTurbineKW,
      wizardState.wantsGenerator, wizardState.generatorKW, wizardState.generatorFuel,
      wizardState.wantsEVCharging, updateCentralizedSection]);
  
  // Debug: Log sync status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sync Bridge] Legacy → Centralized sync complete', {
        legacyZip: wizardState.zipCode,
        centralizedZip: centralizedState.location.zipCode,
        legacyIndustry: wizardState.selectedIndustry,
        centralizedIndustry: centralizedState.industry.type,
        calculatedPeakKW: centralizedState.calculated.totalPeakDemandKW,
      });
    }
  }, [wizardState.zipCode, wizardState.selectedIndustry, centralizedState]);
  
  // ════════════════════════════════════════════════════════════════
  // OTHER STATE VARIABLES
  // ════════════════════════════════════════════════════════════════
  
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
  
  // Data Center Questionnaire modal state
  const [showDataCenterModal, setShowDataCenterModal] = useState(false);
  
  // Load use cases on mount
  useEffect(() => {
    const loadUseCases = async () => {
      try {
        const useCases = await useCaseService.getAllUseCases();
        setAvailableUseCases(useCases || []);
      } catch (error) {
        console.error('Failed to load use cases:', error);
      } finally {
        setIsLoadingUseCases(false);
      }
    };
    loadUseCases();
  }, []);
  
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
    // Check if data center was selected - open specialized modal
    if (slug === 'data-center' || slug === 'datacenter' || slug === 'edge-data-center') {
      setShowDataCenterModal(true);
    }
    
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
        // ═══════════════════════════════════════════════════════════════
        const solarPricing = await getSolarPricing();
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
        const evCostResult = calculateEVHubCosts({
          // Use legacy field names for backward compatibility
          level2Count: wizardState.evChargersL2,
          dcFastCount: wizardState.evChargersDCFC,
          // Map HPC to 350kW chargers
          hpc_350kw: wizardState.evChargersHPC,
        });
        const totalEVCost = evCostResult.totalCostUSD;
        
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
  }, [wizardState.batteryKWh, wizardState.batteryKW, wizardState.durationHours, wizardState.solarKW, wizardState.windTurbineKW, wizardState.generatorKW, wizardState.generatorFuel, wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC]);
  
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
              systemSize={wizardState.batteryKW}
              systemKWh={wizardState.batteryKWh}
              durationHours={wizardState.durationHours}
              onShowExplainer={() => setShowPowerProfileExplainer(true)}
              onSectionClick={(index) => setCurrentSection(index)}
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
                systemSize={wizardState.batteryKW}
                systemKWh={wizardState.batteryKWh}
                durationHours={wizardState.durationHours}
                compact
                onShowExplainer={() => setShowPowerProfileExplainer(true)}
                onSectionClick={(index) => setCurrentSection(index)}
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
          
          {/* Power Dashboard Widget - Nav Bar Position */}
          <div className="hidden md:flex items-center">
            <PowerDashboardWidget
              data={{
                utilityRate: wizardState.electricityRate || 0.12,
                demandCharge: 15, // Default demand charge
                state: wizardState.state || undefined,
                peakDemandKW: wizardState.batteryKW || 0,
                storageKWh: wizardState.batteryKWh || 0,
                durationHours: wizardState.durationHours || 4,
                solarKW: wizardState.wantsSolar ? (wizardState.solarKW || 0) : 0,
                windKW: wizardState.wantsWind ? 0 : 0,  // windKW not in state yet
                generatorKW: wizardState.wantsGenerator ? (wizardState.generatorKW || 0) : 0,
              }}
              compact={true}
              colorScheme="purple"
              onDetailsClick={() => setShowPowerProfileExplainer(true)}
            />
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
              {/* Section Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentSection(1)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Industry
                </button>
                <div className="text-sm text-gray-400">Step 3 of 6</div>
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
                  Tell us about your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">{wizardState.industryName || 'facility'}</span>
                </h2>
                <p className="text-gray-500">This helps Merlin size your system accurately</p>
              </div>
              
              {/* Dynamic Custom Questions from Database */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-200 shadow-xl">
                {(() => {
                  // Filter out redundant grid/utility questions that are handled in other sections
                  const excludedFields = [
                    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
                    'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
                    'wantsSolar', 'hasEVCharging', 'evChargerCount' // Handled in Goals section
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
                                type="number"
                                min={question.min_value}
                                max={question.max_value}
                                value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                                onChange={(e) => setWizardState(prev => ({
                                  ...prev,
                                  useCaseData: {
                                    ...prev.useCaseData,
                                    [question.field_name]: parseFloat(e.target.value) || 0
                                  }
                                }))}
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
                                type="number"
                                value={wizardState.facilitySize}
                                onChange={(e) => setWizardState(prev => ({ ...prev, facilitySize: parseInt(e.target.value) || 0 }))}
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
                      const estimatedRoofNeeded = solarKW * 100; // 1 kW = ~100 sq ft
                      const estimatedRoofAvailable = sqFt * 0.6; // 60% of floor space
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
                          const step = current > 10000 ? 5000 : current > 1000 ? 1000 : 100;
                          setWizardState(prev => ({ ...prev, generatorKW: Math.max(100, current - step) }));
                        }}
                        className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="100"
                          max="500000"
                          step="100"
                          value={wizardState.generatorKW || 0}
                          onChange={(e) => setWizardState(prev => ({ ...prev, generatorKW: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const current = wizardState.generatorKW || 0;
                          const step = current >= 100000 ? 10000 : current >= 10000 ? 5000 : current >= 1000 ? 1000 : 100;
                          setWizardState(prev => ({ ...prev, generatorKW: Math.min(500000, current + step) }));
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
                  
                  // Merge facilitySize into useCaseData for calculation
                  const calculationData = {
                    ...wizardState.useCaseData,
                    squareFeet: wizardState.facilitySize, // For office, retail, warehouse
                    facilitySqFt: wizardState.facilitySize, // For datacenter
                  };
                  
                  // Get industry-specific power calculation
                  const powerResult = calculateUseCasePower(
                    wizardState.selectedIndustry,
                    calculationData
                  );
                  
                  // Convert MW to kW
                  const baseKW = Math.round(powerResult.powerMW * 1000);
                  
                  // Use calculated duration from industry standards, or adjust for backup goal
                  const durationHours = wizardState.goals.includes('backup-power') 
                    ? Math.max(powerResult.durationHrs, 6) // At least 6 hrs for backup
                    : powerResult.durationHrs;
                  
                  const solarKW = wizardState.wantsSolar ? Math.round(baseKW * 1.2) : 0;
                  
                  setWizardState(prev => ({
                    ...prev,
                    batteryKW: baseKW,
                    batteryKWh: baseKW * durationHours,
                    durationHours,
                    solarKW,
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
                    {(wizardState.evChargersL2 + wizardState.evChargersDCFC + wizardState.evChargersHPC) > 0 && (
                      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm border border-emerald-300">
                        <Car className="w-4 h-4" />
                        <span className="font-bold">
                          {wizardState.evChargersL2 > 0 && `${wizardState.evChargersL2} L2`}
                          {wizardState.evChargersDCFC > 0 && ` ${wizardState.evChargersDCFC} DCFC`}
                          {wizardState.evChargersHPC > 0 && ` ${wizardState.evChargersHPC} HPC`}
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
                        <span><span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-1"></span>EV Chargers: ${wizardState.estimatedCost.evChargers.toLocaleString()}</span>
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
                          <div className="text-3xl font-black text-red-500">
                            ${currentMonthlyBill.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">After BESS</div>
                          <div className="text-3xl font-black text-green-500">
                            ${projectedMonthlyBill.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">/month</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
                          Save ${monthlySavings.toLocaleString()}/month
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
                  POWER PROFILE - Real-time Demand/Supply Dashboard
                  ═══════════════════════════════════════════════════════════════ */}
              {(() => {
                // Calculate all demand components
                const baseBuildingKW = Math.round((wizardState.facilitySize || 25000) * 0.004); // ~4W/sqft default
                const existingEVLoadKW = (wizardState.existingEV?.L1?.count || 0) * (wizardState.existingEV?.L1?.powerKW || 1.4) +
                                          (wizardState.existingEV?.L2?.count || 0) * (wizardState.existingEV?.L2?.powerKW || 11) +
                                          (wizardState.existingEV?.L3?.count || 0) * (wizardState.existingEV?.L3?.powerKW || 150);
                const newEVLoadKW = (wizardState.newEV?.L1?.count || 0) * (wizardState.newEV?.L1?.powerKW || 1.4) +
                                    (wizardState.newEV?.L2?.count || 0) * (wizardState.newEV?.L2?.powerKW || 11) +
                                    (wizardState.newEV?.L3?.count || 0) * (wizardState.newEV?.L3?.powerKW || 150);
                const totalEVLoadKW = existingEVLoadKW + newEVLoadKW;
                const otherEquipmentKW = 0; // Placeholder for future
                const totalPeakDemandKW = baseBuildingKW + totalEVLoadKW + otherEquipmentKW;
                
                // Calculate supply
                const batteryKWh = wizardState.batteryKWh || 0;
                const batteryKW = wizardState.batteryKW || 0;
                const solarKW = wizardState.solarKW || 0;
                const windKW = wizardState.windTurbineKW || 0;
                const generatorKW = wizardState.generatorKW || 0;
                const totalSupplyKW = batteryKW + solarKW + windKW + generatorKW;
                
                // Calculate backup duration
                const backupDurationHrs = totalPeakDemandKW > 0 ? (batteryKWh / totalPeakDemandKW) : 0;
                
                // Grid status
                const gridConnection = wizardState.gridConnection || 'on-grid';
                const isGridUnreliable = gridConnection === 'unreliable' || gridConnection === 'limited' || gridConnection === 'off-grid';
                const recommendedBackupHours = isGridUnreliable ? 6 : 4;
                
                // Calculate percentage met (supply vs demand)
                const percentMet = totalPeakDemandKW > 0 ? Math.min(100, Math.round((totalSupplyKW / totalPeakDemandKW) * 100)) : 0;
                
                // Get gauge color
                const getGaugeColor = (pct: number) => {
                  if (pct >= 100) return 'from-green-500 to-emerald-500';
                  if (pct >= 75) return 'from-lime-500 to-green-500';
                  if (pct >= 50) return 'from-yellow-500 to-lime-500';
                  if (pct >= 25) return 'from-orange-500 to-yellow-500';
                  return 'from-red-500 to-orange-500';
                };
                
                // EV charger count string
                const evChargerCount = (wizardState.existingEV?.L2?.count || 0) + (wizardState.newEV?.L2?.count || 0) +
                                       (wizardState.existingEV?.L3?.count || 0) + (wizardState.newEV?.L3?.count || 0);
                const evChargerString = evChargerCount > 0 ? `(${evChargerCount}×${Math.round(totalEVLoadKW / Math.max(1, evChargerCount))}kW avg)` : '';
                
                return (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border-2 border-slate-600 mb-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        Power Profile
                      </h3>
                      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${percentMet >= 100 ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                        {percentMet >= 100 ? '✓ Balanced' : '⚠ Unbalanced'}
                      </div>
                    </div>
                    
                    {/* Gauge + Percentage */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative w-48 h-28">
                        {/* Gauge Background */}
                        <svg viewBox="0 0 200 120" className="w-full h-full">
                          {/* Background arc */}
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="16"
                            strokeLinecap="round"
                          />
                          {/* Colored arc based on percentage */}
                          <defs>
                            <linearGradient id="powerGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="25%" stopColor="#f97316" />
                              <stop offset="50%" stopColor="#eab308" />
                              <stop offset="75%" stopColor="#84cc16" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#powerGauge)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={`${percentMet * 2.51} 251`}
                          />
                          {/* Needle */}
                          <g transform={`rotate(${-90 + (percentMet / 100) * 180} 100 100)`}>
                            <line x1="100" y1="100" x2="100" y2="35" stroke="white" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="100" cy="100" r="8" fill="white" />
                          </g>
                        </svg>
                        {/* Percentage display */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                          <div className={`text-4xl font-black bg-gradient-to-r ${getGaugeColor(percentMet)} text-transparent bg-clip-text`}>
                            {percentMet}%
                          </div>
                          <div className="text-xs text-gray-400">Supply/Demand</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* DEMAND BREAKDOWN */}
                      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Demand Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-purple-400" />
                              Base Building
                            </span>
                            <span className="font-bold text-white">{baseBuildingKW.toLocaleString()} kW</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Car className="w-4 h-4 text-emerald-400" />
                              EV Chargers {evChargerString}
                            </span>
                            <span className="font-bold text-white">{Math.round(totalEVLoadKW).toLocaleString()} kW</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-gray-400" />
                              Other Equipment
                            </span>
                            <span className="font-bold text-white">{otherEquipmentKW.toLocaleString()} kW</span>
                          </div>
                          <div className="flex items-center justify-between py-2 bg-red-500/10 rounded-lg px-3 -mx-1">
                            <span className="text-red-400 font-bold flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              TOTAL PEAK
                            </span>
                            <span className="font-black text-red-400 text-lg">{totalPeakDemandKW.toLocaleString()} kW</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* SUPPLY */}
                      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Battery className="w-4 h-4" />
                          Supply
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Battery className="w-4 h-4 text-purple-400" />
                              Battery
                            </span>
                            <span className="font-bold text-white">{batteryKWh.toLocaleString()} kWh</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Sun className="w-4 h-4 text-amber-400" />
                              Solar
                            </span>
                            <span className="font-bold text-white">{solarKW.toLocaleString()} kW</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Fuel className="w-4 h-4 text-slate-400" />
                              Generator
                            </span>
                            <span className="font-bold text-white">{generatorKW.toLocaleString()} kW</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-300 flex items-center gap-2">
                              <Zap className={`w-4 h-4 ${isGridUnreliable ? 'text-amber-400' : 'text-green-400'}`} />
                              Grid
                            </span>
                            <span className={`font-bold flex items-center gap-1 ${isGridUnreliable ? 'text-amber-400' : 'text-green-400'}`}>
                              {gridConnection === 'on-grid' ? 'Reliable ✓' : 
                               gridConnection === 'off-grid' ? 'Off-Grid' :
                               gridConnection === 'unreliable' ? 'Unreliable ⚠️' :
                               gridConnection === 'expensive' ? 'Expensive 💰' : 'Limited ⚠️'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Backup Duration */}
                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Backup Duration</div>
                          <div className="text-3xl font-black text-white">
                            {backupDurationHrs.toFixed(1)} <span className="text-lg text-gray-400">hours</span>
                          </div>
                          <div className="text-xs text-gray-500">(Based on {totalPeakDemandKW.toLocaleString()} kW demand)</div>
                        </div>
                        {isGridUnreliable && backupDurationHrs < recommendedBackupHours && (
                          <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 max-w-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-amber-400 font-bold text-sm">Grid Unreliable</div>
                                <div className="text-amber-300/80 text-xs">Recommend {recommendedBackupHours}+ hours backup</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isGridUnreliable && backupDurationHrs >= 4 && (
                          <div className="bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              <div className="text-green-400 font-bold text-sm">Adequate Backup</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Configuration Cards Grid */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Battery Configuration */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-purple-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Battery Storage</h3>
                      <p className="text-sm text-gray-500">Power capacity & duration</p>
                    </div>
                  </div>
                  
                  {/* Battery Power */}
                  <div className="mb-6">
                    <label className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Power Rating</span>
                      <span className="text-purple-600 font-bold">
                        {wizardState.batteryKW >= 1000000 
                          ? `${(wizardState.batteryKW / 1000000).toFixed(1)} GW`
                          : wizardState.batteryKW >= 1000 
                            ? `${(wizardState.batteryKW / 1000).toFixed(1)} MW` 
                            : `${wizardState.batteryKW} kW`}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={100}
                      max={3000000}
                      step={100}
                      value={wizardState.batteryKW}
                      onChange={(e) => {
                        const kw = parseInt(e.target.value);
                        setWizardState(prev => ({
                          ...prev,
                          batteryKW: kw,
                          batteryKWh: kw * prev.durationHours,
                        }));
                      }}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>100 kW</span>
                      <span className="text-purple-500 font-medium">3 GW (Data Center Scale)</span>
                    </div>
                  </div>
                  
                  {/* Duration */}
                  <div className="mb-6">
                    <label className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Backup Duration (Industry Standard)</span>
                      <span className="text-purple-600 font-bold">{wizardState.durationHours} hours</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 4, 6, 10].map((hours) => (
                        <button
                          key={hours}
                          onClick={() => setWizardState(prev => ({
                            ...prev,
                            durationHours: hours,
                            batteryKWh: prev.batteryKW * hours,
                          }))}
                          className={`py-2 rounded-lg font-medium transition-all ${
                            wizardState.durationHours === hours
                              ? 'bg-purple-500 text-white'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {hours}hr
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Total Storage */}
                  <div className="bg-purple-100 rounded-xl p-4 text-center border border-purple-200">
                    <div className="text-3xl font-black text-purple-600">
                      {wizardState.batteryKWh >= 1000000 
                        ? `${(wizardState.batteryKWh / 1000000).toFixed(1)} GWh`
                        : wizardState.batteryKWh >= 1000 
                          ? `${(wizardState.batteryKWh / 1000).toFixed(1)} MWh` 
                          : `${wizardState.batteryKWh.toLocaleString()} kWh`}
                    </div>
                    <div className="text-sm text-gray-500">Total Storage Capacity</div>
                    <div className="text-lg text-purple-500 mt-1">
                      {wizardState.estimatedCost.battery >= 1000000000 
                        ? `$${(wizardState.estimatedCost.battery / 1000000000).toFixed(2)}B`
                        : wizardState.estimatedCost.battery >= 1000000 
                          ? `$${(wizardState.estimatedCost.battery / 1000000).toFixed(1)}M` 
                          : `$${wizardState.estimatedCost.battery.toLocaleString()}`}
                    </div>
                  </div>
                </div>
                
                {/* Solar Configuration */}
                <div className={`bg-white/90 backdrop-blur-sm rounded-3xl p-6 border shadow-lg ${wizardState.wantsSolar ? 'border-amber-300' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${wizardState.wantsSolar ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gray-200'}`}>
                      <Sun className={`w-6 h-6 ${wizardState.wantsSolar ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Solar Generation</h3>
                      <p className="text-sm text-gray-500">{wizardState.wantsSolar ? 'On-site power generation' : 'Click to add solar'}</p>
                    </div>
                    <label className="ml-auto flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizardState.wantsSolar}
                        onChange={(e) => setWizardState(prev => ({ ...prev, wantsSolar: e.target.checked, solarKW: e.target.checked ? Math.round(prev.batteryKW * 1.2) : 0 }))}
                        className="w-5 h-5 rounded accent-amber-500"
                      />
                    </label>
                  </div>
                  
                  {wizardState.wantsSolar ? (
                    <>
                      <div className="mb-6">
                        <label className="flex justify-between text-sm text-gray-500 mb-2">
                          <span>Solar Capacity</span>
                          <span className="text-amber-600 font-bold">
                            {wizardState.solarKW >= 1000000 
                              ? `${(wizardState.solarKW / 1000000).toFixed(1)} GW`
                              : wizardState.solarKW >= 1000 
                                ? `${(wizardState.solarKW / 1000).toFixed(1)} MW` 
                                : `${wizardState.solarKW} kW`}
                          </span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={1000000}
                          step={100}
                          value={wizardState.solarKW}
                          onChange={(e) => setWizardState(prev => ({ ...prev, solarKW: parseInt(e.target.value) }))}
                          className="w-full accent-amber-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0 kW</span>
                          <span className="text-amber-500 font-medium">1 GW (Utility Scale)</span>
                        </div>
                      </div>
                      
                      <div className="bg-amber-100 rounded-xl p-4 text-center border border-amber-200">
                        <div className="text-3xl font-black text-amber-600">
                          {(() => {
                            const dailyKWh = Math.round(wizardState.solarKW * (wizardState.geoRecommendations?.profile.avgSolarHoursPerDay || 5));
                            return dailyKWh >= 1000000 
                              ? `~${(dailyKWh / 1000000).toFixed(1)} GWh/day`
                              : dailyKWh >= 1000 
                                ? `~${(dailyKWh / 1000).toFixed(0)} MWh/day` 
                                : `~${dailyKWh.toLocaleString()} kWh/day`;
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">Estimated Daily Generation</div>
                        <div className="text-lg text-amber-500 mt-1">
                          {wizardState.estimatedCost.solar >= 1000000000 
                            ? `$${(wizardState.estimatedCost.solar / 1000000000).toFixed(2)}B`
                            : wizardState.estimatedCost.solar >= 1000000 
                              ? `$${(wizardState.estimatedCost.solar / 1000000).toFixed(0)}M` 
                              : `$${wizardState.estimatedCost.solar.toLocaleString()}`}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Sun className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Enable solar to add on-site generation</p>
                      <p className="text-xs mt-1 text-gray-500">Reduce grid dependence & save more</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* EV Charging Configuration - NEW Q1/Q2 FLOW */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 mb-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">EV Charging Infrastructure</h3>
                    <p className="text-sm text-gray-500">Configure existing and new charging stations</p>
                  </div>
                </div>
                
                {/* Q1: Do you have EXISTING EV chargers? */}
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-gray-800">Q1: Do you have EXISTING EV chargers?</h4>
                      <p className="text-sm text-gray-500">On-site chargers you already own</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWizardState(prev => ({ ...prev, hasExistingEVChargers: true }))}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${wizardState.hasExistingEVChargers ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setWizardState(prev => ({ 
                          ...prev, 
                          hasExistingEVChargers: false,
                          existingEV: { L1: { count: 0, powerKW: 1.4 }, L2: { count: 0, powerKW: 11 }, L3: { count: 0, powerKW: 150 } }
                        }))}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${!wizardState.hasExistingEVChargers ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  
                  {/* Existing EV Chargers Breakdown */}
                  {wizardState.hasExistingEVChargers && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <h5 className="font-bold text-emerald-800 mb-4">How many existing chargers of each type?</h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Level 1 */}
                        <div className="bg-white rounded-lg p-3 border border-emerald-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 1</h6>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">1.4 kW</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">120V • Overnight (8-12+ hrs)</p>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L1: { ...prev.existingEV.L1, count: Math.max(0, prev.existingEV.L1.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.existingEV.L1.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L1: { ...prev.existingEV.L1, count: prev.existingEV.L1.count + 1 } } }))}
                              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-emerald-600 mt-1 font-medium">
                            {(wizardState.existingEV.L1.count * 1.4).toFixed(1)} kW load
                          </div>
                        </div>
                        
                        {/* Level 2 */}
                        <div className="bg-white rounded-lg p-3 border border-emerald-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 2</h6>
                            <select 
                              value={wizardState.existingEV.L2.powerKW}
                              onChange={(e) => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L2: { ...prev.existingEV.L2, powerKW: Number(e.target.value) } } }))}
                              className="text-xs bg-gray-100 border border-gray-300 rounded px-2 py-0.5"
                            >
                              <option value={7}>7 kW</option>
                              <option value={11}>11 kW</option>
                              <option value={19}>19 kW</option>
                            </select>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">240V • Standard (4-8 hrs)</p>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L2: { ...prev.existingEV.L2, count: Math.max(0, prev.existingEV.L2.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.existingEV.L2.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L2: { ...prev.existingEV.L2, count: prev.existingEV.L2.count + 1 } } }))}
                              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-emerald-600 mt-1 font-medium">
                            {wizardState.existingEV.L2.count * wizardState.existingEV.L2.powerKW} kW load
                          </div>
                        </div>
                        
                        {/* Level 3 (DCFC/HPC) */}
                        <div className="bg-white rounded-lg p-3 border border-emerald-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 3 (DC Fast)</h6>
                            <select 
                              value={wizardState.existingEV.L3.powerKW}
                              onChange={(e) => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L3: { ...prev.existingEV.L3, powerKW: Number(e.target.value) } } }))}
                              className="text-xs bg-gray-100 border border-gray-300 rounded px-2 py-0.5"
                            >
                              <option value={50}>50 kW</option>
                              <option value={150}>150 kW</option>
                              <option value={350}>350 kW</option>
                            </select>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">480V+ • Rapid (15-45 min)</p>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L3: { ...prev.existingEV.L3, count: Math.max(0, prev.existingEV.L3.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.existingEV.L3.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, existingEV: { ...prev.existingEV, L3: { ...prev.existingEV.L3, count: prev.existingEV.L3.count + 1 } } }))}
                              className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-emerald-600 mt-1 font-medium">
                            {wizardState.existingEV.L3.count * wizardState.existingEV.L3.powerKW} kW load
                          </div>
                        </div>
                      </div>
                      
                      {/* Existing Total */}
                      {(wizardState.existingEV.L1.count > 0 || wizardState.existingEV.L2.count > 0 || wizardState.existingEV.L3.count > 0) && (
                        <div className="mt-4 pt-3 border-t border-emerald-200 flex justify-between items-center">
                          <span className="text-sm text-emerald-700 font-medium">Existing EV Load:</span>
                          <span className="text-lg font-bold text-emerald-700">
                            {(wizardState.existingEV.L1.count * wizardState.existingEV.L1.powerKW + 
                              wizardState.existingEV.L2.count * wizardState.existingEV.L2.powerKW + 
                              wizardState.existingEV.L3.count * wizardState.existingEV.L3.powerKW).toLocaleString()} kW
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Q2: Do you want to ADD NEW EV chargers? */}
                <div className="mb-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-gray-800">Q2: Do you want to ADD NEW EV chargers?</h4>
                      <p className="text-sm text-gray-500">New stations to install with this project</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWizardState(prev => ({ 
                          ...prev, 
                          wantsNewEVChargers: true,
                          wantsEVCharging: true,
                          // Set reasonable defaults
                          newEV: { L1: { count: 0, powerKW: 1.4 }, L2: { count: 4, powerKW: 11 }, L3: { count: 1, powerKW: 150 } }
                        }))}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${wizardState.wantsNewEVChargers ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setWizardState(prev => ({ 
                          ...prev, 
                          wantsNewEVChargers: false,
                          wantsEVCharging: prev.hasExistingEVChargers, // Keep wantsEVCharging if has existing
                          newEV: { L1: { count: 0, powerKW: 1.4 }, L2: { count: 0, powerKW: 11 }, L3: { count: 0, powerKW: 150 } }
                        }))}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${!wizardState.wantsNewEVChargers ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  
                  {/* New EV Chargers Breakdown */}
                  {wizardState.wantsNewEVChargers && (
                    <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
                      <h5 className="font-bold text-teal-800 mb-4">How many NEW chargers to add?</h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        {/* Level 1 */}
                        <div className="bg-white rounded-lg p-3 border border-teal-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 1</h6>
                            <span className="text-xs text-teal-600 font-bold">~$500/ea</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">120V • 1.4 kW</p>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L1: { ...prev.newEV.L1, count: Math.max(0, prev.newEV.L1.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.newEV.L1.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L1: { ...prev.newEV.L1, count: prev.newEV.L1.count + 1 } } }))}
                              className="w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-teal-600 mt-1 font-medium">
                            {(wizardState.newEV.L1.count * 1.4).toFixed(1)} kW load
                          </div>
                        </div>
                        
                        {/* Level 2 */}
                        <div className="bg-white rounded-lg p-3 border border-teal-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 2</h6>
                            <span className="text-xs text-teal-600 font-bold">~$8K/ea</span>
                          </div>
                          <div className="mb-2">
                            <select 
                              value={wizardState.newEV.L2.powerKW}
                              onChange={(e) => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L2: { ...prev.newEV.L2, powerKW: Number(e.target.value) } } }))}
                              className="w-full text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1"
                            >
                              <option value={7}>7 kW (Basic)</option>
                              <option value={11}>11 kW (Standard)</option>
                              <option value={19}>19 kW (Fast)</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L2: { ...prev.newEV.L2, count: Math.max(0, prev.newEV.L2.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.newEV.L2.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L2: { ...prev.newEV.L2, count: prev.newEV.L2.count + 1 } } }))}
                              className="w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-teal-600 mt-1 font-medium">
                            {wizardState.newEV.L2.count * wizardState.newEV.L2.powerKW} kW load
                          </div>
                        </div>
                        
                        {/* Level 3 (DCFC/HPC) */}
                        <div className="bg-white rounded-lg p-3 border border-teal-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-bold text-gray-800">Level 3 (DC Fast)</h6>
                            <span className="text-xs text-teal-600 font-bold">~$85-180K/ea</span>
                          </div>
                          <div className="mb-2">
                            <select 
                              value={wizardState.newEV.L3.powerKW}
                              onChange={(e) => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L3: { ...prev.newEV.L3, powerKW: Number(e.target.value) } } }))}
                              className="w-full text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1"
                            >
                              <option value={50}>50 kW (DCFC Basic)</option>
                              <option value={150}>150 kW (DCFC Standard)</option>
                              <option value={350}>350 kW (HPC Ultra-fast)</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L3: { ...prev.newEV.L3, count: Math.max(0, prev.newEV.L3.count - 1) } } }))}
                              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold"
                            >−</button>
                            <span className="flex-1 text-center text-xl font-bold">{wizardState.newEV.L3.count}</span>
                            <button 
                              onClick={() => setWizardState(prev => ({ ...prev, newEV: { ...prev.newEV, L3: { ...prev.newEV.L3, count: prev.newEV.L3.count + 1 } } }))}
                              className="w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded flex items-center justify-center text-white font-bold"
                            >+</button>
                          </div>
                          <div className="text-center text-xs text-teal-600 mt-1 font-medium">
                            {wizardState.newEV.L3.count * wizardState.newEV.L3.powerKW} kW load
                          </div>
                        </div>
                      </div>
                      
                      {/* New Total + Estimated Cost */}
                      {(wizardState.newEV.L1.count > 0 || wizardState.newEV.L2.count > 0 || wizardState.newEV.L3.count > 0) && (
                        <div className="mt-4 pt-3 border-t border-teal-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-teal-700 font-medium">New EV Load:</span>
                            <span className="text-lg font-bold text-teal-700">
                              {(wizardState.newEV.L1.count * wizardState.newEV.L1.powerKW + 
                                wizardState.newEV.L2.count * wizardState.newEV.L2.powerKW + 
                                wizardState.newEV.L3.count * wizardState.newEV.L3.powerKW).toLocaleString()} kW
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Estimated Equipment Cost:</span>
                            <span className="font-bold text-teal-600">
                              ${(
                                wizardState.newEV.L1.count * 500 + 
                                wizardState.newEV.L2.count * 8000 + 
                                wizardState.newEV.L3.count * (wizardState.newEV.L3.powerKW >= 250 ? 180000 : 85000)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Total EV Load Summary */}
                {(wizardState.hasExistingEVChargers || wizardState.wantsNewEVChargers) && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border-2 border-emerald-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">Total EV Load → Power Profile</h5>
                          <p className="text-xs text-gray-600">Existing + New chargers combined</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                          {(() => {
                            const existingLoad = wizardState.existingEV.L1.count * wizardState.existingEV.L1.powerKW + 
                                                  wizardState.existingEV.L2.count * wizardState.existingEV.L2.powerKW + 
                                                  wizardState.existingEV.L3.count * wizardState.existingEV.L3.powerKW;
                            const newLoad = wizardState.newEV.L1.count * wizardState.newEV.L1.powerKW + 
                                            wizardState.newEV.L2.count * wizardState.newEV.L2.powerKW + 
                                            wizardState.newEV.L3.count * wizardState.newEV.L3.powerKW;
                            const totalKW = existingLoad + newLoad;
                            return totalKW >= 1000 ? `${(totalKW / 1000).toFixed(1)} MW` : `${totalKW.toLocaleString()} kW`;
                          })()}
                        </div>
                        <p className="text-xs text-gray-500">Added to peak demand</p>
                      </div>
                    </div>
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
                    <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-5 py-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Quote Complete!</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                      Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500">Custom Quote</span>
                    </h2>
                    <p className="text-gray-500">{wizardState.industryName} • {wizardState.state} • {wizardState.facilitySize.toLocaleString()} {FACILITY_PRESETS[wizardState.selectedIndustry]?.unit || 'sq ft'}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-purple-50 rounded-3xl p-8 border-2 border-emerald-300 text-center mb-8 shadow-lg">
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
                  <div className="grid md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        // Simple HTML download
                        const html = `<!DOCTYPE html><html><head><title>Merlin Quote</title></head><body><h1>Your Merlin Energy Quote</h1><p>Annual Savings: $${Math.round(wizardState.quoteResult!.financials.annualSavings).toLocaleString()}</p><p>Net Cost: $${Math.round(wizardState.quoteResult!.costs.netCost).toLocaleString()}</p><p>Payback: ${wizardState.quoteResult!.financials.paybackYears.toFixed(1)} years</p></body></html>`;
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Merlin_Quote_${new Date().toISOString().split('T')[0]}.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download Quote
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
                      Request Consultation
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
                          windTurbineKW: 0,
                          generatorKW: 0,
                          generatorFuel: 'natural-gas',
                          generatorType: 'traditional',
                          gridConnection: 'on-grid',
                          batteryKW: 0,
                          batteryKWh: 0,
                          solarKW: 0,
                          durationHours: 4,
                          hasExistingEVChargers: false,
                          wantsNewEVChargers: false,
                          existingEV: {
                            L1: { count: 0, powerKW: 1.4 },
                            L2: { count: 0, powerKW: 11 },
                            L3: { count: 0, powerKW: 150 },
                          },
                          newEV: {
                            L1: { count: 0, powerKW: 1.4 },
                            L2: { count: 0, powerKW: 11 },
                            L3: { count: 0, powerKW: 150 },
                          },
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
      
      {/* Data Center Questionnaire Modal */}
      {showDataCenterModal && (
        <DataCenterQuestionnaire
          isOpen={showDataCenterModal}
          onClose={() => setShowDataCenterModal(false)}
          onComplete={(config: DataCenterConfig) => {
            // Calculate battery sizing from data center config
            const totalPowerMW = (config.rackCount * config.avgPowerPerRack / 1000) * config.currentPUE;
            const batteryKW = Math.round(totalPowerMW * 1000);
            const batteryKWh = Math.round(batteryKW * config.backupDurationHours);
            
            // Pre-fill wizard with config values
            setWizardState(prev => ({
              ...prev,
              batteryKW,
              batteryKWh,
              durationHours: config.backupDurationHours,
              facilitySize: config.totalSquareFeet,
              useCaseData: {
                ...prev.useCaseData,
                itLoadKW: config.rackCount * config.avgPowerPerRack,
                rackCount: config.rackCount,
                avgPowerPerRack: config.avgPowerPerRack,
                pue: config.currentPUE,
                uptimeRequirement: config.uptimeRequirement,
                workloadType: config.workloadType,
                tier: config.facilityTier,
              },
              // Auto-enable generator for high-reliability data centers
              wantsGenerator: config.uptimeRequirement === '99.99' || config.uptimeRequirement === '99.999' || config.uptimeRequirement === '99.9999',
              generatorKW: config.uptimeRequirement === '99.999' || config.uptimeRequirement === '99.9999' 
                ? batteryKW // Match battery power for full backup
                : Math.round(batteryKW * 0.5), // 50% for Tier III
              // Set grid connection based on reliability (map to SSOT values)
              gridConnection: config.gridReliability === 'none' ? 'off-grid' : 
                             config.gridReliability === 'unreliable' ? 'limited' : 'on-grid',
              // Auto-enable solar for renewable targets
              wantsSolar: config.renewableTargetPercent > 25,
              solarKW: config.renewableTargetPercent > 25 
                ? Math.round(batteryKW * (config.renewableTargetPercent / 100) * 1.5) 
                : 0,
            }));
            
            setShowDataCenterModal(false);
            
            // Skip to configuration section since we have all the data
            advanceToSection(4);
          }}
        />
      )}
      
      {/* Development-only Debug Panel for State Migration */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900/95 text-xs text-white p-3 rounded-lg shadow-xl max-w-sm z-50 border border-purple-500/30">
          <div className="font-bold text-purple-400 mb-2 flex items-center justify-between">
            <span>🔧 State Sync Debug</span>
            <span className="text-green-400 text-[10px]">Phase 2</span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">ZIP:</span>
              <span className={centralizedState.location.zipCode === wizardState.zipCode ? 'text-green-400' : 'text-red-400'}>
                {wizardState.zipCode || '-'} → {centralizedState.location.zipCode || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Industry:</span>
              <span className={centralizedState.industry.type === wizardState.selectedIndustry ? 'text-green-400' : 'text-red-400'}>
                {wizardState.selectedIndustry || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Facility:</span>
              <span>{wizardState.facilitySize?.toLocaleString() || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rate:</span>
              <span>${wizardState.electricityRate}/kWh</span>
            </div>
            <div className="border-t border-gray-700 pt-1 mt-1">
              <div className="text-yellow-400 font-semibold">Calculated (Centralized):</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Peak kW:</span>
                <span className="text-cyan-400">{centralizedState.calculated.totalPeakDemandKW.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base Load:</span>
                <span className="text-cyan-400">{centralizedState.calculated.baseBuildingLoadKW.toLocaleString()} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">BESS kW:</span>
                <span className="text-cyan-400">{centralizedState.calculated.recommendedBatteryKW.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">EV Load:</span>
                <span className="text-cyan-400">{(centralizedState.calculated.existingEVLoadKW + centralizedState.calculated.newEVLoadKW).toLocaleString()} kW</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
