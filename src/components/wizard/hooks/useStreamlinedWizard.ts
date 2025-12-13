/**
 * STREAMLINED WIZARD HOOK
 * ========================
 * 
 * Extracted from StreamlinedWizard.tsx - Dec 2025 Refactor
 * Centralizes all wizard state management, effects, and callbacks.
 * 
 * Purpose:
 * - Manages all 20+ useState hooks
 * - Handles state synchronization with centralized state
 * - Provides callbacks for section navigation
 * - Manages use case loading and vertical initialization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WizardState, RFQFormState, PremiumComparison } from '../types/wizardTypes';
import { DEFAULT_WIZARD_STATE } from '../types/wizardTypes';
import { FACILITY_PRESETS, INTERNATIONAL_REGIONS } from '../constants/wizardConstants';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { useCaseService } from '@/services/useCaseService';
import { 
  getGeographicRecommendations, 
  getStateFromZipCode,
  getRegionalElectricityRate,
  type GeographicRecommendation 
} from '@/services/geographicIntelligenceService';
import { 
  generatePremiumConfiguration, 
  calculatePremiumComparison,
  type PremiumConfiguration 
} from '@/services/premiumConfigurationService';
import { useWizardState } from '@/hooks/useWizardState';

// ============================================
// HOOK PROPS & RETURN TYPES
// ============================================

export interface UseStreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
  initialUseCase?: string;
  initialState?: string;
  initialData?: Record<string, any>;
}

export interface UseStreamlinedWizardReturn {
  // Section navigation
  currentSection: number;
  setCurrentSection: React.Dispatch<React.SetStateAction<number>>;
  completedSections: string[];
  setCompletedSections: React.Dispatch<React.SetStateAction<string[]>>;
  totalPoints: number;
  setTotalPoints: React.Dispatch<React.SetStateAction<number>>;
  
  // Vertical initialization
  initializedFromVertical: boolean;
  verticalInitComplete: boolean;
  
  // Wizard state
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  
  // Use cases
  availableUseCases: any[];
  isLoadingUseCases: boolean;
  groupedUseCases: Record<string, any[]>;
  
  // Premium state
  showPremiumView: boolean;
  setShowPremiumView: React.Dispatch<React.SetStateAction<boolean>>;
  premiumConfig: PremiumConfiguration | null;
  premiumComparison: PremiumComparison | null;
  
  // RFQ state
  showRFQModal: boolean;
  setShowRFQModal: React.Dispatch<React.SetStateAction<boolean>>;
  rfqForm: RFQFormState;
  setRfqForm: React.Dispatch<React.SetStateAction<RFQFormState>>;
  rfqType: 'standard' | 'premium';
  setRfqType: React.Dispatch<React.SetStateAction<'standard' | 'premium'>>;
  rfqSubmitting: boolean;
  rfqSuccess: string | null;
  setRfqSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setRfqSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Centralized state - using any to avoid strict type conflicts with hook return types
  centralizedState: any;
  updateSection: any;
  updateExistingInfra: any;
  updateEVChargers: any;
  updateNewEVChargers: any;
  
  // Animation state
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Callbacks
  completeSection: (sectionId: string) => void;
  advanceToSection: (index: number) => void;
  handleZipCodeChange: (zip: string) => Promise<void>;
  handleStateSelect: (state: string) => void;
  handleInternationalSelect: (regionCode: string) => void;
  handleIndustrySelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
  generateQuote: () => Promise<void>;
  generatePremiumQuote: () => void;
}

// ============================================
// HELPER: Get international region data by code
// ============================================

function getInternationalRegionData(regionCode: string) {
  return INTERNATIONAL_REGIONS.find(r => r.code === regionCode) || null;
}

// ============================================
// MAIN HOOK
// ============================================

export function useStreamlinedWizard({
  show,
  onClose,
  onFinish,
  onOpenAdvanced,
  initialUseCase,
  initialState,
  initialData,
}: UseStreamlinedWizardProps): UseStreamlinedWizardReturn {
  
  // ═══════════════════════════════════════════════════════════════
  // SECTION NAVIGATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // ═══════════════════════════════════════════════════════════════
  // VERTICAL INITIALIZATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [initializedFromVertical, setInitializedFromVertical] = useState(false);
  const [verticalInitComplete, setVerticalInitComplete] = useState(false);
  const verticalInitDoneRef = useRef(false);
  const prevShowRef = useRef(show);
  
  // ═══════════════════════════════════════════════════════════════
  // MAIN WIZARD STATE
  // ═══════════════════════════════════════════════════════════════
  const [wizardState, setWizardState] = useState<WizardState>(DEFAULT_WIZARD_STATE);
  
  // ═══════════════════════════════════════════════════════════════
  // USE CASES FROM DATABASE
  // ═══════════════════════════════════════════════════════════════
  const [availableUseCases, setAvailableUseCases] = useState<any[]>([]);
  const [isLoadingUseCases, setIsLoadingUseCases] = useState(true);
  
  // ═══════════════════════════════════════════════════════════════
  // PREMIUM & RFQ STATE
  // ═══════════════════════════════════════════════════════════════
  const [showPremiumView, setShowPremiumView] = useState(false);
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfiguration | null>(null);
  const [premiumComparison, setPremiumComparison] = useState<PremiumComparison | null>(null);
  
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [rfqType, setRfqType] = useState<'standard' | 'premium'>('standard');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [rfqForm, setRfqForm] = useState<RFQFormState>({
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectTimeline: 'immediate',
  });
  
  // ═══════════════════════════════════════════════════════════════
  // ANIMATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════
  // CENTRALIZED STATE INTEGRATION
  // ═══════════════════════════════════════════════════════════════
  const {
    wizardState: centralizedState,
    setWizardState: setCentralizedState,
    updateSection,
    updateExistingInfra,
    updateEVChargers,
    updateNewEVChargers,
    resetState: resetCentralizedState,
  } = useWizardState();
  
  // ═══════════════════════════════════════════════════════════════
  // GROUPED USE CASES (memoized)
  // ═══════════════════════════════════════════════════════════════
  const groupedUseCases = availableUseCases.reduce((acc: Record<string, any[]>, useCase: any) => {
    const category = useCase.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(useCase);
    return acc;
  }, {});
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Reset wizard state when opening fresh
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const wasHidden = !prevShowRef.current;
    const isNowShown = show;
    prevShowRef.current = show;
    
    if (!isNowShown) {
      verticalInitDoneRef.current = false;
      return;
    }
    
    if (wasHidden && isNowShown && !initialUseCase) {
      console.log('🔄 [Wizard Hook] Opening fresh - resetting state');
      setCurrentSection(0);
      setCompletedSections([]);
      setTotalPoints(0);
      setInitializedFromVertical(false);
      setVerticalInitComplete(false);
      setWizardState(DEFAULT_WIZARD_STATE);
      resetCentralizedState();
    }
  }, [show, initialUseCase, resetCentralizedState]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Load use cases from database
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const loadUseCases = async () => {
      setIsLoadingUseCases(true);
      try {
        const useCases = await useCaseService.getAllUseCases();
        setAvailableUseCases(useCases);
      } catch (error) {
        console.error('[Wizard Hook] Failed to load use cases:', error);
      } finally {
        setIsLoadingUseCases(false);
      }
    };
    
    if (show) {
      loadUseCases();
    }
  }, [show]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Handle vertical initialization (hotel, car-wash, ev-charging)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!show || !initialUseCase || verticalInitDoneRef.current || isLoadingUseCases) {
      return;
    }
    
    const initFromVertical = async () => {
      console.log('🚀 [Wizard Hook] Initializing from vertical:', initialUseCase);
      verticalInitDoneRef.current = true;
      setInitializedFromVertical(true);
      
      // Find the use case in loaded data
      const useCase = availableUseCases.find(uc => 
        uc.slug === initialUseCase || 
        uc.id === initialUseCase ||
        uc.slug?.toLowerCase() === initialUseCase.toLowerCase()
      );
      
      if (useCase) {
        // Load custom questions for this use case
        const questions = await useCaseService.getCustomQuestionsByUseCaseId(useCase.id);
        
        setWizardState(prev => ({
          ...prev,
          selectedIndustry: useCase.slug,
          industryName: useCase.name,
          useCaseId: useCase.id,
          customQuestions: questions || [],
          state: initialState || prev.state,
          useCaseData: initialData || {},
        }));
        
        // Mark location and industry as complete
        setCompletedSections(['location', 'industry']);
        setTotalPoints(200);
        
        // Jump to Section 2 (Facility Details)
        setCurrentSection(2);
      }
      
      setVerticalInitComplete(true);
    };
    
    initFromVertical();
  }, [show, initialUseCase, initialState, initialData, availableUseCases, isLoadingUseCases]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync facility size to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const hasCustomQuestionData = wizardState.customQuestions.length > 0 && 
      Object.keys(wizardState.useCaseData).length > 0;
    
    if (hasCustomQuestionData) return;
    
    const roomBasedIndustries = ['hotel', 'hotel-hospitality', 'apartment', 'senior-living'];
    const isRoomBased = roomBasedIndustries.includes(wizardState.selectedIndustry.toLowerCase());
    
    if (isRoomBased) {
      updateSection('facility', { roomCount: wizardState.facilitySize, squareFeet: 0 });
    } else {
      updateSection('facility', { squareFeet: wizardState.facilitySize, roomCount: 0 });
    }
  }, [wizardState.facilitySize, wizardState.selectedIndustry, wizardState.customQuestions, wizardState.useCaseData, updateSection]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync useCaseData to centralized state
  // This is CRITICAL for the Power Gap indicator to update when
  // the user changes facility details (MRI, surgical suites, etc.)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const data = wizardState.useCaseData;
    
    // FULL SYNC: Pass ALL useCaseData to centralized state
    // This ensures SSOT calculations see hospital equipment, grid status, etc.
    setCentralizedState(prev => ({
      ...prev,
      useCaseData: { ...prev.useCaseData, ...data },
    }));
    
    if (!data || Object.keys(data).length === 0) return;
    
    // Extract common facility fields for backwards compatibility
    const roomCount = data.roomCount || data.numberOfRooms || data.rooms || 0;
    const bedCount = data.bedCount || data.beds || 0;
    const rackCount = data.rackCount || data.racks || data.itLoadKW || 0;
    const squareFeet = data.squareFeet || data.facilitySqFt || data.buildingSqFt || 0;
    const bayCount = data.washBays || data.bayCount || data.numBays || 0;
    const unitCount = data.unitCount || data.numUnits || data.apartments || 0;
    
    // Hospital-specific equipment (for Power Gap calculation)
    const surgicalSuites = data.surgicalSuites || data.operatingRooms || 0;
    const mriCount = data.mriCount || data.mriMachines || 0;
    const ctScannerCount = data.ctScannerCount || data.ctScanners || 0;
    const icuBeds = data.icuBeds || data.icuBedCount || 0;
    
    updateSection('facility', {
      roomCount: roomCount || undefined,
      squareFeet: squareFeet || undefined,
      bedCount: bedCount || undefined,
      rackCount: rackCount || undefined,
      bayCount: bayCount || undefined,
      unitCount: unitCount || undefined,
      // Add hospital equipment to facility for Power Gap calculation
      surgicalSuites: surgicalSuites || undefined,
      mriCount: mriCount || undefined,
      ctScannerCount: ctScannerCount || undefined,
      icuBeds: icuBeds || undefined,
    });
    
    console.log('📊 [SYNC] useCaseData → centralizedState:', {
      rawData: data,
      extractedFacility: { roomCount, bedCount, squareFeet, surgicalSuites, mriCount, ctScannerCount, icuBeds },
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8)
    });
  }, [wizardState.useCaseData, updateSection, setCentralizedState]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync industry to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    updateSection('industry', { type: wizardState.selectedIndustry });
  }, [wizardState.selectedIndustry, updateSection]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync EV chargers to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const newL2Power = wizardState.evChargersL2 * 11;
    const newDCFCPower = wizardState.evChargersDCFC * 100;
    const newHPCPower = wizardState.evChargersHPC * 350;
    const totalNewEVPower = newL2Power + newDCFCPower + newHPCPower;
    const hasNewEVChargers = wizardState.evChargersL2 > 0 || wizardState.evChargersDCFC > 0 || wizardState.evChargersHPC > 0;
    
    updateEVChargers('L1', { count: wizardState.existingEVL1 || 0, powerKW: 1.4 });
    updateEVChargers('L2', { count: wizardState.existingEVL2 || 0, powerKW: 11 });
    updateEVChargers('L3', { count: wizardState.existingEVL3 || 0, powerKW: 100 });
    
    const totalFastChargerCount = wizardState.evChargersDCFC + wizardState.evChargersHPC;
    const avgFastChargerPower = totalFastChargerCount > 0 
      ? (newDCFCPower + newHPCPower) / totalFastChargerCount 
      : 150;
    
    updateNewEVChargers('L2', { count: wizardState.evChargersL2, powerKW: 11 });
    updateNewEVChargers('L3', { count: totalFastChargerCount, powerKW: Math.round(avgFastChargerPower) });
    updateSection('goals', { addEVChargers: hasNewEVChargers });
  }, [
    wizardState.existingEVL1, wizardState.existingEVL2, wizardState.existingEVL3,
    wizardState.evChargersL2, wizardState.evChargersDCFC, wizardState.evChargersHPC,
    updateEVChargers, updateNewEVChargers, updateSection
  ]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync grid connection to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    updateExistingInfra('gridConnection', wizardState.gridConnection);
  }, [wizardState.gridConnection, updateExistingInfra]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync solar to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const hasSolar = wizardState.wantsSolar && wizardState.solarKW > 0;
    updateSection('goals', { 
      addSolar: hasSolar,
      solarKW: wizardState.solarKW || 0,
    });
  }, [wizardState.wantsSolar, wizardState.solarKW, updateSection]);
  
  // ═══════════════════════════════════════════════════════════════
  // EFFECT: Sync wind/generator to centralized state
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const hasWind = wizardState.wantsWind && wizardState.windTurbineKW > 0;
    const hasGenerator = wizardState.wantsGenerator && wizardState.generatorKW > 0;
    
    updateSection('goals', { 
      addWind: hasWind,
      windKW: wizardState.windTurbineKW || 0,
      addGenerator: hasGenerator,
      generatorKW: wizardState.generatorKW || 0,
    });
  }, [wizardState.wantsWind, wizardState.windTurbineKW, wizardState.wantsGenerator, wizardState.generatorKW, updateSection]);
  
  // ═══════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════
  
  const completeSection = useCallback((sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
      setTotalPoints(prev => prev + 100);
    }
  }, [completedSections]);
  
  const advanceToSection = useCallback((index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSection(index);
      setIsTransitioning(false);
    }, 300);
  }, []);
  
  // Handle zip code change - NO auto-advance (user clicks Continue button)
  const handleZipCodeChange = useCallback(async (zip: string) => {
    setWizardState(prev => ({ ...prev, zipCode: zip }));
    
    if (zip.length === 5) {
      try {
        const state = await getStateFromZipCode(zip);
        if (state) {
          const rate = await getRegionalElectricityRate(state);
          const recommendations = await getGeographicRecommendations(state);
          
          setWizardState(prev => ({
            ...prev,
            state,
            electricityRate: rate,
            geoRecommendations: recommendations,
          }));
          
          // NOTE: Removed auto-advance - user will click Continue button
        }
      } catch (error) {
        console.error('[Wizard] Zip code lookup failed:', error);
      }
    }
  }, []);
  
  // Handle US state selection - NO auto-advance (user clicks Continue button)
  const handleStateSelect = useCallback(async (state: string) => {
    try {
      const rate = await getRegionalElectricityRate(state);
      const recommendations = await getGeographicRecommendations(state);
      
      setWizardState(prev => ({
        ...prev,
        state,
        electricityRate: rate,
        geoRecommendations: recommendations,
      }));
      
      // NOTE: Removed auto-advance - user will click Continue button
    } catch (error) {
      console.error('[Wizard] State selection failed:', error);
    }
  }, []);
  
  // Handle international region selection
  const handleInternationalSelect = useCallback((regionCode: string) => {
    // Import the regions from constants (they're defined in wizardConstants.ts)
    // For now, we'll construct the geo recommendations based on the region data
    const region = getInternationalRegionData(regionCode);
    
    if (region) {
      setWizardState(prev => ({
        ...prev,
        state: region.name,
        zipCode: '', // Clear zip for international
        electricityRate: region.avgElectricityRate,
        geoRecommendations: {
          state: region.name,
          profile: {
            avgSolarHoursPerDay: region.avgSolarHours,
            avgElectricityRate: region.avgElectricityRate,
            avgDemandCharge: region.avgDemandCharge,
            gridReliabilityScore: region.gridReliability,
            windCapacityFactor: 0.25, // Default for international
          },
          recommendations: {
            batteryStorage: {
              recommended: region.avgDemandCharge > 8 || region.gridReliability < 95,
              reason: region.avgDemandCharge > 8 
                ? 'High demand charges make peak shaving valuable'
                : 'Battery storage provides backup and optimization',
            },
            solar: {
              recommended: region.avgSolarHours >= 4.5,
              reason: region.avgSolarHours >= 4.5 
                ? `${region.avgSolarHours} average sun hours - excellent for solar`
                : 'Moderate solar potential for your region',
            },
            wind: {
              recommended: false,
              reason: 'Wind assessment requires site-specific data',
            },
            generator: {
              recommended: region.gridReliability < 90,
              reason: region.gridReliability < 90
                ? 'Backup generator recommended for grid reliability concerns'
                : 'Generator optional for backup power',
            },
          },
        },
      }));
    }
  }, []);
  
  const handleIndustrySelect = useCallback(async (slug: string, name: string, useCaseId?: string) => {
    try {
      const questions = useCaseId ? await useCaseService.getCustomQuestionsByUseCaseId(useCaseId) : [];
      const preset = FACILITY_PRESETS[slug] || FACILITY_PRESETS['default'];
      
      setWizardState(prev => ({
        ...prev,
        selectedIndustry: slug,
        industryName: name,
        useCaseId: useCaseId || '',
        customQuestions: questions || [],
        facilitySize: preset.default,
        useCaseData: {},
      }));
      
      completeSection('industry');
      advanceToSection(2);
    } catch (error) {
      console.error('[Wizard] Industry selection failed:', error);
    }
  }, [completeSection, advanceToSection]);
  
  const generateQuote = useCallback(async () => {
    setWizardState(prev => ({ ...prev, isCalculating: true }));
    
    try {
      // Map fuel type to valid API values
      const fuelTypeMap: Record<string, 'diesel' | 'natural-gas' | 'dual-fuel'> = {
        'diesel': 'diesel',
        'natural-gas': 'natural-gas',
        'propane': 'natural-gas', // Propane maps to natural-gas for API
      };
      
      // Map grid connection to valid API values
      const gridMap: Record<string, 'on-grid' | 'off-grid' | 'limited'> = {
        'on-grid': 'on-grid',
        'off-grid': 'off-grid',
        'limited': 'limited',
        'unreliable': 'limited',
        'expensive': 'on-grid',
      };
      
      // Use recommended values as fallback if user hasn't set custom values
      const calc = centralizedState?.calculated || {};
      const effectiveBatteryKW = wizardState.batteryKW || calc.recommendedBatteryKW || 100; // Minimum 100 kW
      const effectiveBatteryKWh = wizardState.batteryKWh || calc.recommendedBatteryKWh || (effectiveBatteryKW * 4);
      const effectiveDuration = wizardState.durationHours || 4;
      
      console.log('🧙 [generateQuote] Using values:', {
        effectiveBatteryKW,
        effectiveBatteryKWh,
        effectiveDuration,
        fromWizardState: { batteryKW: wizardState.batteryKW, batteryKWh: wizardState.batteryKWh },
        fromCalc: { recommendedBatteryKW: calc.recommendedBatteryKW, recommendedBatteryKWh: calc.recommendedBatteryKWh }
      });
      
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, effectiveBatteryKW / 1000), // Minimum 0.1 MW
        durationHours: effectiveDuration,
        location: wizardState.state,
        electricityRate: wizardState.electricityRate,
        useCase: wizardState.selectedIndustry,
        solarMW: wizardState.solarKW / 1000,
        windMW: wizardState.windTurbineKW / 1000,
        generatorMW: wizardState.generatorKW / 1000,
        generatorFuelType: fuelTypeMap[wizardState.generatorFuel] || 'natural-gas',
        gridConnection: gridMap[wizardState.gridConnection] || 'on-grid',
      });
      
      // Update wizardState with the effective values used in the quote
      // This ensures System Specs displays the correct battery size
      setWizardState(prev => ({
        ...prev,
        batteryKW: effectiveBatteryKW,
        batteryKWh: effectiveBatteryKWh,
        durationHours: effectiveDuration,
        quoteResult: result,
        isCalculating: false,
      }));
      
      completeSection('configuration');
      advanceToSection(5);
    } catch (error) {
      console.error('[Wizard] Quote generation failed:', error);
      setWizardState(prev => ({ ...prev, isCalculating: false }));
    }
  }, [wizardState, centralizedState, completeSection, advanceToSection]);
  
  const generatePremiumQuote = useCallback(() => {
    if (!wizardState.quoteResult) return;
    
    try {
      const config = generatePremiumConfiguration(
        wizardState.selectedIndustry,
        wizardState.batteryKW / 1000,
        wizardState.durationHours,
        wizardState.solarKW / 1000
      );
      setPremiumConfig(config);
      
      // calculatePremiumComparison expects: (useCase, storageSizeMW, durationHours, solarMW)
      const comparison = calculatePremiumComparison(
        wizardState.selectedIndustry,
        wizardState.batteryKW / 1000,
        wizardState.durationHours,
        wizardState.solarKW / 1000
      );
      setPremiumComparison(comparison);
      
      setShowPremiumView(true);
    } catch (error) {
      console.error('[Wizard] Premium quote generation failed:', error);
    }
  }, [wizardState]);
  
  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════
  return {
    // Section navigation
    currentSection,
    setCurrentSection,
    completedSections,
    setCompletedSections,
    totalPoints,
    setTotalPoints,
    
    // Vertical initialization
    initializedFromVertical,
    verticalInitComplete,
    
    // Wizard state
    wizardState,
    setWizardState,
    
    // Use cases
    availableUseCases,
    isLoadingUseCases,
    groupedUseCases,
    
    // Premium state
    showPremiumView,
    setShowPremiumView,
    premiumConfig,
    premiumComparison,
    
    // RFQ state
    showRFQModal,
    setShowRFQModal,
    rfqForm,
    setRfqForm,
    rfqType,
    setRfqType,
    rfqSubmitting,
    rfqSuccess,
    setRfqSuccess,
    setRfqSubmitting,
    
    // Centralized state
    centralizedState,
    updateSection,
    updateExistingInfra,
    updateEVChargers,
    updateNewEVChargers,
    
    // Animation state
    isTransitioning,
    setIsTransitioning,
    
    // Callbacks
    completeSection,
    advanceToSection,
    handleZipCodeChange,
    handleStateSelect,
    handleInternationalSelect,
    handleIndustrySelect,
    generateQuote,
    generatePremiumQuote,
  };
}

export default useStreamlinedWizard;
