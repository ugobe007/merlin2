/**
 * useSmartWizardV2 - Custom Hook
 * ================================
 * Extracted from SmartWizardV2.tsx monolith
 * Handles ALL state management and business logic
 * 
 * Architecture:
 * - State management (30+ state variables)
 * - Business logic (calculations, validation)
 * - Side effects (useEffect hooks)
 * - Event handlers
 * 
 * Component only handles rendering
 */

import { useState, useEffect, useRef } from 'react';
import { calculateDatabaseBaseline } from '@/services/baselineService';
import { calculateAutomatedSolarSizing } from '@/utils/solarSizingUtils';
import { aiStateService } from '@/services/aiStateService';
import { useCaseService } from '@/services/useCaseService';

export interface SmartWizardV2State {
  // Navigation
  step: number;
  showIntro: boolean;
  showCompletePage: boolean;
  showAIWizard: boolean;
  isQuickstart: boolean;
  wizardInitialized: boolean;
  modalContentRef: React.RefObject<HTMLDivElement>;
  
  // Step 0: Industry Template
  selectedTemplate: string;
  useTemplate: boolean;
  availableUseCases: any[];
  
  // Step 1: Use Case Data
  useCaseData: { [key: string]: any };
  previousTemplate: string | null;
  aiUseCaseRecommendation: {
    message: string;
    savings: string;
    roi: string;
    configuration: string;
  } | null;
  
  // Step 2-3: Configuration
  storageSizeMW: number;
  durationHours: number;
  isCalculatingBaseline: boolean;
  baselineResult: {
    generationRequired?: boolean;
    generationRecommendedMW?: number;
    generationReason?: string;
    gridConnection?: string;
    gridCapacity?: number;
    peakDemandMW?: number;
  } | undefined;
  
  // Step 3: Renewables
  includeRenewables: boolean;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  generatorsExplicitlyAdded: boolean;
  solarSpaceConfig: {
    spaceType: 'rooftop' | 'ground' | 'canopy' | 'mixed';
    rooftopSqFt?: number;
    groundAcres?: number;
    useAI: boolean;
  };
  evChargerConfig: {
    level2_11kw: number;
    level2_19kw: number;
    dcfast_50kw: number;
    dcfast_150kw: number;
    dcfast_350kw: number;
  };
  windConfig: {
    turbineSize: '2.5' | '3.0' | '5.0';
    numberOfTurbines: number;
    useAI: boolean;
  };
  generatorConfig: {
    generatorType: 'diesel' | 'natural-gas' | 'dual-fuel';
    numberOfUnits: number;
    sizePerUnit: number;
    useAI: boolean;
  };
  
  // Step 4: Location & Pricing
  location: string;
  electricityRate: number;
  knowsRate: boolean;
  
  // Step 5: Options
  selectedInstallation: string;
  selectedShipping: string;
  selectedFinancing: string;
  
  // Calculated Results
  costs: {
    equipmentCost: number;
    installationCost: number;
    shippingCost: number;
    tariffCost: number;
    totalProjectCost: number;
    taxCredit: number;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
  };
  equipmentBreakdown: any;
  
  // AI Features
  aiSuggestions: Array<{
    type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
    title: string;
    description: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
    savings?: string;
    action: () => void;
  }>;
  aiBaseline: {
    optimalPowerMW: number;
    optimalDurationHrs: number;
    optimalSolarMW: number;
    improvementText: string;
  } | null;
  
  // Advanced Analytics
  showAdvancedAnalytics: boolean;
  loadPatternAnalysis: any;
  optimizationResults: any;
  controlStrategy: any;
  forecastData: any;
  batteryModelData: any;
  mpcStrategy: any;
  analyticsConfidence: number;
}

export interface SmartWizardV2Actions {
  // Navigation
  setStep: (step: number) => void;
  setShowIntro: (show: boolean) => void;
  setShowCompletePage: (show: boolean) => void;
  setShowAIWizard: (show: boolean) => void;
  
  // Step 0
  setSelectedTemplate: (template: string) => void;
  setUseTemplate: (use: boolean) => void;
  
  // Step 1
  setUseCaseData: (data: { [key: string]: any }) => void;
  setAiUseCaseRecommendation: (rec: any) => void;
  
  // Step 2-3
  setStorageSizeMW: (mw: number) => void;
  setDurationHours: (hours: number) => void;
  
  // Step 3
  setIncludeRenewables: (include: boolean) => void;
  setSolarMW: (mw: number) => void;
  setWindMW: (mw: number) => void;
  setGeneratorMW: (mw: number) => void;
  setGeneratorsExplicitlyAdded: (added: boolean) => void;
  setSolarSpaceConfig: (config: any) => void;
  setEVChargerConfig: (config: any) => void;
  setWindConfig: (config: any) => void;
  setGeneratorConfig: (config: any) => void;
  
  // Step 4
  setLocation: (loc: string) => void;
  setElectricityRate: (rate: number) => void;
  setKnowsRate: (knows: boolean) => void;
  
  // Step 5
  setSelectedInstallation: (inst: string) => void;
  setSelectedShipping: (ship: string) => void;
  setSelectedFinancing: (fin: string) => void;
  
  // Costs
  setCosts: (costs: any) => void;
  setEquipmentBreakdown: (breakdown: any) => void;
  
  // AI
  setAiSuggestions: (suggestions: any[]) => void;
  
  // Advanced Analytics
  setShowAdvancedAnalytics: (show: boolean) => void;
  
  // Utility
  getPowerDensity: (buildingType: string, subType?: string) => number;
}

export function useSmartWizardV2(
  show: boolean,
  skipIntro: boolean = false
): {
  state: SmartWizardV2State;
  actions: SmartWizardV2Actions;
} {
  // =========================================================================
  // STATE
  // =========================================================================
  
  // Navigation state
  const [step, setStep] = useState(-1);
  const [showIntro, setShowIntro] = useState(true);
  const [showCompletePage, setShowCompletePage] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [isQuickstart, setIsQuickstart] = useState(false);
  const [wizardInitialized, setWizardInitialized] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // Step 0: Industry Template
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [availableUseCases, setAvailableUseCases] = useState<any[]>([]);
  
  // Step 1: Use Case Data
  const [useCaseData, setUseCaseData] = useState<{ [key: string]: any }>({});
  const [previousTemplate, setPreviousTemplate] = useState<string | null>(null);
  const [aiUseCaseRecommendation, setAiUseCaseRecommendation] = useState<any>(null);
  
  // Step 2-3: Configuration
  const [storageSizeMW, setStorageSizeMW] = useState<number>(0.1);
  const [durationHours, setDurationHours] = useState(4);
  const [isCalculatingBaseline, setIsCalculatingBaseline] = useState(false);
  const [baselineResult, setBaselineResult] = useState<any>(undefined);
  
  // Step 3: Renewables
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);
  const [generatorsExplicitlyAdded, setGeneratorsExplicitlyAdded] = useState(false);
  const [solarSpaceConfig, setSolarSpaceConfig] = useState<any>({
    spaceType: 'rooftop',
    useAI: true
  });
  const [evChargerConfig, setEVChargerConfig] = useState({
    level2_11kw: 0,
    level2_19kw: 0,
    dcfast_50kw: 0,
    dcfast_150kw: 0,
    dcfast_350kw: 0
  });
  const [windConfig, setWindConfig] = useState<any>({
    turbineSize: '2.5',
    numberOfTurbines: 0,
    useAI: true
  });
  const [generatorConfig, setGeneratorConfig] = useState<any>({
    generatorType: 'diesel',
    numberOfUnits: 0,
    sizePerUnit: 0.25,
    useAI: true
  });
  
  // Step 4: Location & Pricing
  const [location, setLocation] = useState('');
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [knowsRate, setKnowsRate] = useState(false);
  
  // Step 5: Options
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');
  
  // Calculated Results
  const [costs, setCosts] = useState({
    equipmentCost: 0,
    installationCost: 0,
    shippingCost: 0,
    tariffCost: 0,
    totalProjectCost: 0,
    taxCredit: 0,
    netCost: 0,
    annualSavings: 0,
    paybackYears: 0
  });
  const [equipmentBreakdown, setEquipmentBreakdown] = useState<any>(null);
  
  // AI Features
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiBaseline, setAiBaseline] = useState<any>(null);
  
  // Advanced Analytics
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [loadPatternAnalysis, setLoadPatternAnalysis] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [controlStrategy, setControlStrategy] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [batteryModelData, setBatteryModelData] = useState<any>(null);
  const [mpcStrategy, setMpcStrategy] = useState<any>(null);
  const [analyticsConfidence, setAnalyticsConfidence] = useState(0);
  
  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================
  
  const getPowerDensity = (buildingType: string, subType?: string): number => {
    switch (buildingType) {
      case 'hotel': return 9;
      case 'datacenter': return 150;
      case 'tribal-casino': return 15;
      case 'logistics-center':
        if (subType === 'cold-storage') return 25;
        if (subType === 'fulfillment') return 8;
        return 5;
      case 'shopping-center': return 10;
      case 'office': return 6;
      case 'retail': return 8;
      case 'indoor-farm': return 35;
      default: return 7;
    }
  };
  
  // =========================================================================
  // EFFECTS
  // =========================================================================
  
  // Scroll to top on step change
  useEffect(() => {
    if (step >= 0 && modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
      if (import.meta.env.DEV) {
        console.log('🔝 Scrolled to top for step:', step);
      }
    }
  }, [step]);
  
  // Fetch use cases on mount
  useEffect(() => {
    const fetchUseCases = async () => {
      try {
        const useCases = await useCaseService.getAllUseCases();
        console.log('📋 Loaded use cases:', useCases);
        setAvailableUseCases(useCases);
      } catch (error) {
        console.error('❌ Failed to load use cases:', error);
        setAvailableUseCases([]);
      }
    };
    
    if (show) {
      fetchUseCases();
    }
  }, [show]);
  
  // Initialize wizard
  useEffect(() => {
    if (show && !wizardInitialized) {
      if (import.meta.env.DEV) {
        console.log('🎬 Initializing wizard');
      }
      
      if (skipIntro) {
        setStep(0);
        setShowIntro(false);
      } else {
        setStep(-1);
        setShowIntro(true);
      }
      
      setShowCompletePage(false);
      setAiSuggestions([]);
      setShowAIWizard(false);
      setWizardInitialized(true);
      
      aiStateService.resetForNewSession();
      
      // Handle quickstart
      const quickstartData = localStorage.getItem('merlin_wizard_quickstart');
      if (quickstartData) {
        try {
          const wizardData = JSON.parse(quickstartData);
          setIsQuickstart(true);
          setSelectedTemplate(wizardData.selectedTemplate || '');
          setUseTemplate(true);
          setStorageSizeMW(wizardData.storageSizeMW || 2);
          setDurationHours(wizardData.durationHours || 4);
          setLocation(wizardData.location || 'California');
          setElectricityRate(0.15);
          
          if (wizardData.selectedTemplate === 'ev-charging') {
            setUseCaseData({
              numberOfChargers: 8,
              chargingType: 'mixed',
              level2Chargers: 8,
              dcFastChargers: 4
            });
          }
          
          if (wizardData.jumpToStep) {
            setStep(wizardData.jumpToStep);
            setShowIntro(false);
          }
          
          localStorage.removeItem('merlin_wizard_quickstart');
          setTimeout(() => setIsQuickstart(false), 1000);
        } catch (e) {
          console.warn('Failed to parse quickstart data:', e);
          localStorage.removeItem('merlin_wizard_quickstart');
        }
      }
    }
    
    if (!show && wizardInitialized) {
      setWizardInitialized(false);
    }
  }, [show, wizardInitialized, skipIntro]);
  
  // Clear use case data when template changes
  useEffect(() => {
    if (selectedTemplate && previousTemplate && selectedTemplate !== previousTemplate) {
      console.log(`🔄 Template changed, clearing data`);
      setUseCaseData({});
    }
    if (selectedTemplate) {
      setPreviousTemplate(selectedTemplate);
    }
  }, [selectedTemplate, previousTemplate]);
  
  // Auto-calculate configuration
  useEffect(() => {
    const calculateConfig = async () => {
      if (selectedTemplate && Object.keys(useCaseData).length > 0 && !isQuickstart) {
        setIsCalculatingBaseline(true);
        
        // Extract scale from use case data
        let scale = 1;
        switch (selectedTemplate) {
          case 'hotel':
            scale = parseInt(useCaseData.numberOfRooms || useCaseData.numRooms) || 100;
            break;
          case 'datacenter':
          case 'data-center':
            const dcCapacity = parseFloat(useCaseData.capacity) || 5;
            const dcSquareFootage = parseFloat(useCaseData.squareFootage) || 0;
            scale = dcSquareFootage > 0 ? (dcSquareFootage * 150) / 1000000 : dcCapacity;
            break;
          // Add other cases as needed
          default:
            scale = 1;
        }
        
        const baseline = await calculateDatabaseBaseline(selectedTemplate, scale, useCaseData);
        
        setStorageSizeMW(baseline.powerMW);
        setDurationHours(baseline.durationHrs);
        
        if (baseline.solarMW > 0) {
          setSolarMW(baseline.solarMW);
        }
        
        setBaselineResult({
          generationRequired: baseline.generationRequired,
          generationRecommendedMW: baseline.generationRecommendedMW,
          generationReason: baseline.generationReason,
          gridConnection: baseline.gridConnection,
          gridCapacity: baseline.gridCapacity,
          peakDemandMW: baseline.peakDemandMW
        });
        
        setIsCalculatingBaseline(false);
      }
    };
    
    if ((step === 1 || step === 2) && Object.keys(useCaseData).length > 0) {
      const timeoutId = setTimeout(calculateConfig, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTemplate, step, isQuickstart, useCaseData]);
  
  // =========================================================================
  // RETURN
  // =========================================================================
  
  return {
    state: {
      step,
      showIntro,
      showCompletePage,
      showAIWizard,
      isQuickstart,
      wizardInitialized,
      modalContentRef,
      selectedTemplate,
      useTemplate,
      availableUseCases,
      useCaseData,
      previousTemplate,
      aiUseCaseRecommendation,
      storageSizeMW,
      durationHours,
      isCalculatingBaseline,
      baselineResult,
      includeRenewables,
      solarMW,
      windMW,
      generatorMW,
      generatorsExplicitlyAdded,
      solarSpaceConfig,
      evChargerConfig,
      windConfig,
      generatorConfig,
      location,
      electricityRate,
      knowsRate,
      selectedInstallation,
      selectedShipping,
      selectedFinancing,
      costs,
      equipmentBreakdown,
      aiSuggestions,
      aiBaseline,
      showAdvancedAnalytics,
      loadPatternAnalysis,
      optimizationResults,
      controlStrategy,
      forecastData,
      batteryModelData,
      mpcStrategy,
      analyticsConfidence
    },
    actions: {
      setStep,
      setShowIntro,
      setShowCompletePage,
      setShowAIWizard,
      setSelectedTemplate,
      setUseTemplate,
      setUseCaseData,
      setAiUseCaseRecommendation,
      setStorageSizeMW,
      setDurationHours,
      setIncludeRenewables,
      setSolarMW,
      setWindMW,
      setGeneratorMW,
      setGeneratorsExplicitlyAdded,
      setSolarSpaceConfig,
      setEVChargerConfig,
      setWindConfig,
      setGeneratorConfig,
      setLocation,
      setElectricityRate,
      setKnowsRate,
      setSelectedInstallation,
      setSelectedShipping,
      setSelectedFinancing,
      setCosts,
      setEquipmentBreakdown,
      setAiSuggestions,
      setShowAdvancedAnalytics,
      getPowerDensity
    }
  };
}
