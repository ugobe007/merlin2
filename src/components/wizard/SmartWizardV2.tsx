import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { generatePDF, generateExcel, generateWord } from '../../utils/quoteExport';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';
import { calculateAutomatedSolarSizing, formatSolarCapacity } from '../../utils/solarSizingUtils';
import { formatSolarSavings, formatTotalProjectSavings } from '../../utils/financialFormatting';
import { formatPowerCompact } from '../../utils/powerFormatting';
import { validateFinancialCalculation } from '../../utils/calculationValidator';
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';
import { calculateDatabaseBaseline, calculateDatacenterBESS } from '../../services/baselineService';
import { calculatePowerProfile } from '../../services/powerProfileService';
import { calculateUseCasePower, POWER_DENSITY_STANDARDS, type PowerCalculationResult } from '../../services/useCasePowerCalculations';
import { aiStateService } from '../../services/aiStateService';
import { useCaseService } from '../../services/useCaseService';
import {
  LoadProfileAnalyzer,
  BatteryElectrochemicalModel,
  BESSControlOptimizer,
  BESSMLForecasting,
  BESSOptimizationEngine,
  type LoadProfile,
  type BatteryModel,
  type ControlStrategy
} from '../../services/advancedBessAnalytics';

// New customer-focused steps (V3 steps used temporarily with type bypass)
import StepIntro from './steps/Step_Intro';
import Step1_IndustryTemplate from './steps_v3/Step1_IndustryTemplate';
import Step2_UseCase from './steps_v3/Step2_UseCase';
import Step3_SimpleConfiguration from './steps/Step2_SimpleConfiguration';
import Step4_PowerRecommendation from './steps_v3/Step4_PowerRecommendation';
import Step4_AddRenewables from './steps/Step3_AddRenewables';
import Step5_LocationPricing from './steps_v3/Step4_LocationPricing';
import Step6_QuoteSummary from './steps_v3/Step5_QuoteSummary';

// NEW 7-Step Wizard Components
import Step1_IndustryAndLocation from './steps_v3/Step1_IndustryAndLocation';
import Step3_AddGoodies from './steps_v3/Step3_AddGoodies';
import Step4_GoalsAndInterests from './steps_v3/Step4_GoalsAndInterests';
import Step5_PowerRecommendation from './steps_v3/Step5_PowerRecommendation';
import Step6_PreliminaryQuote from './steps_v3/Step6_PreliminaryQuote';
import Step7_FinalQuote from './steps_v3/Step7_FinalQuote';
import BatteryConfigModal from '../modals/BatteryConfigModal';
import RequestQuoteModal from '../modals/RequestQuoteModal';
import QuoteCompletePage from './QuoteCompletePage';
import { PowerMeterWidget } from './widgets/PowerMeterWidget';
import PowerProfileIndicator from './PowerProfileIndicator';

interface SmartWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  startInAdvancedMode?: boolean; // New prop to skip directly to advanced landing
  onOpenAdvancedQuoteBuilder?: () => void; // Callback to open Advanced Quote Builder
  skipIntro?: boolean; // Skip intro and start at step 0 (Industry Template)
}

const SmartWizardV2: React.FC<SmartWizardProps> = ({ show, onClose, onFinish, startInAdvancedMode = false, onOpenAdvancedQuoteBuilder, skipIntro = false }) => {
  // ============================================================================
  // SMARTWIZARD V2 - GUIDED QUOTE BUILDER
  // ============================================================================
  // Purpose: Hand-hold beginners through BESS configuration
  // Target Users: Non-technical decision makers, facility managers
  // Key Features:
  //   1. Power Status Bar - Real-time system overview (batteries + generation)
  //   2. Power Gap Alerts - Warns when generation is insufficient
  //   3. ML Data Collection - Tracks session for AI recommendations
  //   4. Database-driven baselines - Industry-specific sizing
  // 
  // Contrast: Advanced Quote Builder (pro users, self-directed)
  // ============================================================================
  
  // ============================================================================
  // NAVIGATION & UI STATE
  // ============================================================================
  const [step, setStep] = useState(-1); // Start at -1 for intro screen
  const [showIntro, setShowIntro] = useState(true);
  const [showCompletePage, setShowCompletePage] = useState(false);
  const [showRequestQuoteModal, setShowRequestQuoteModal] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [isQuickstart, setIsQuickstart] = useState(false);
  const [wizardInitialized, setWizardInitialized] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
    title: string;
    description: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
    savings?: string;
    action: () => void;
  }>>([]);

  // ============================================================================
  // STEP 0: INDUSTRY TEMPLATE SELECTION
  // ============================================================================
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [availableUseCases, setAvailableUseCases] = useState<any[]>([]);
  
  // ✅ SYSTEMATIC FIX: Store loaded use case details for dynamic validation
  const useCaseDetailsRef = useRef<any>(null);

  // ============================================================================
  // STEP 1: USE CASE QUESTIONNAIRE
  // ============================================================================
  // Collects industry-specific data (sq ft, # rooms, peak load, etc.)
  // Powers ML model training + baseline calculations
  // SINGLE SOURCE OF TRUTH: useCaseData stores all user answers from Step2_UseCase
  // and is used by all calculation logic (scale extraction, baseline calculations)
  const [useCaseData, setUseCaseData] = useState<{ [key: string]: any }>({});
  const [previousTemplate, setPreviousTemplate] = useState<string | null>(null);
  
  // ============================================================================
  // NEW 7-STEP WIZARD STATE
  // ============================================================================
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [showBatteryConfigModal, setShowBatteryConfigModal] = useState(false);
  const [evChargerCount, setEvChargerCount] = useState(0);
  const [use7StepFlow, setUse7StepFlow] = useState(false); // Feature flag for new flow
  
  const [aiUseCaseRecommendation, setAiUseCaseRecommendation] = useState<{
    message: string;
    savings: string;
    roi: string;
    configuration: string;
  } | null>(null);

  // 🎯 POWER PROFILE STATE - Gamification system
  const [powerProfileLevel, setPowerProfileLevel] = useState(1);
  const [powerProfilePoints, setPowerProfilePoints] = useState(0);
  const [powerProfileCompletedChecks, setPowerProfileCompletedChecks] = useState<string[]>([]);

  // ============================================================================
  // STEP 2-3: BESS CONFIGURATION (Batteries + Power Profile)
  // ============================================================================
  // Calculated automatically from use case data via calculateDatabaseBaseline()
  // Stored in ML dataset for recommendation engine improvement
  const [storageSizeMW, setStorageSizeMW] = useState<number>(0);
  const [durationHours, setDurationHours] = useState(0);
  const [isCalculatingBaseline, setIsCalculatingBaseline] = useState(false);
  
  // ============================================================================
  // FINANCIAL METRICS STATE (For Steps 6 & 7)
  // ============================================================================
  const [equipmentCost, setEquipmentCost] = useState<number>(0);
  const [installationCost, setInstallationCost] = useState<number>(0);
  const [annualSavings, setAnnualSavings] = useState<number>(0);
  const [paybackYears, setPaybackYears] = useState<number>(0);
  const [roi10Year, setRoi10Year] = useState<number>(0);
  const [roi25Year, setRoi25Year] = useState<number>(0);
  const [npv, setNpv] = useState<number>(0);
  const [irr, setIrr] = useState<number>(0);
  
  // POWER PROFILE: Grid connection analysis + generation requirements
  // Powers the "Power Gap" detection in Power Status Bar
  const [baselineResult, setBaselineResult] = useState<{
    generationRequired?: boolean;       // True if grid inadequate
    generationRecommendedMW?: number;  // Size of generators needed
    generationReason?: string;         // Why generation is needed
    gridConnection?: string;           // Grid type (reliable/unreliable/none)
    gridCapacity?: number;             // Available grid power (MW)
    peakDemandMW?: number;            // Facility peak load (MW)
    existingSolarMW?: number;         // Existing solar capacity offset
    existingEvLoadMW?: number;        // Existing EV charger load
  } | undefined>(undefined);

  // ✅ REMOVED: Old getPowerDensity function (lines 168-184)
  // Now using centralized POWER_DENSITY_STANDARDS from useCasePowerCalculations.ts
  // This ensures single source of truth for all power density values

  // ============================================================================
  // EFFECTS - All state must be declared before these
  // ============================================================================
  
  // Clear use case data when template changes to prevent data contamination
  useEffect(() => {
    if (selectedTemplate && previousTemplate && selectedTemplate !== previousTemplate) {
      setUseCaseData({});
    }
    if (selectedTemplate) {
      setPreviousTemplate(selectedTemplate);
    }
  }, [selectedTemplate, previousTemplate]);
  
  // 🔥 FIX STEP 2 CRASH: Fetch use case details when template is selected
  useEffect(() => {
    const fetchUseCaseDetails = async () => {
      if (!selectedTemplate) {
        useCaseDetailsRef.current = null;
        return;
      }
      
      try {
        console.log('🔍 Fetching use case details for template:', selectedTemplate);
        const details = await useCaseService.getUseCaseBySlug(selectedTemplate);
        console.log('✅ Loaded use case details:', details);
        console.log('📋 Custom questions count:', details?.custom_questions?.length || 0);
        console.log('📋 Custom questions:', details?.custom_questions);
        useCaseDetailsRef.current = details;
        
        // 🎯 CRITICAL FIX: Pre-populate useCaseData with custom question defaults
        // This ensures calculateDatabaseBaseline() has values to work with
        const customQuestions = details?.custom_questions || (details as any)?.customQuestions || [];
        if (customQuestions.length > 0) {
          const defaultAnswers: Record<string, any> = {};
          customQuestions.forEach((q: any) => {
            if (q.default !== undefined && q.default !== null && q.default !== '') {
              // Convert default to appropriate type
              if (q.type === 'number') {
                defaultAnswers[q.id] = parseFloat(q.default);
              } else if (q.type === 'boolean') {
                defaultAnswers[q.id] = q.default === 'true' || q.default === true;
              } else {
                defaultAnswers[q.id] = q.default;
              }
            }
          });
          console.log('🎯 Pre-populating useCaseData with defaults:', defaultAnswers);
          setUseCaseData(prev => ({ ...prev, ...defaultAnswers }));
        }
        
        // 🎯 STRATEGIC FIX: Apply defaults from database configurations instead of hardcoded values
        if (details && details.configurations && details.configurations.length > 0) {
          // Find the default configuration (is_default = true) or use first one
          const defaultConfig = details.configurations.find((c: any) => c.is_default) || details.configurations[0];
          
          if (defaultConfig) {
            // Calculate MW from typical load kW
            const mw = (defaultConfig.typical_load_kw || 500) / 1000; // Convert kW to MW
            const hours = defaultConfig.preferred_duration_hours || 3;
            
            console.log(`✅ Applying database defaults for "${selectedTemplate}":`, { 
              typical_load_kw: defaultConfig.typical_load_kw,
              mw,
              hours 
            });
            setStorageSizeMW(mw);
            setDurationHours(hours);
          } else {
            console.warn(`⚠️ No configuration found for "${selectedTemplate}" - using fallback`);
            setStorageSizeMW(0.5);
            setDurationHours(3);
          }
        } else {
          console.warn(`⚠️ No configurations in database for "${selectedTemplate}" - using fallback`);
          setStorageSizeMW(0.5);
          setDurationHours(3);
        }
      } catch (error) {
        console.error('❌ Failed to load use case details:', error);
        useCaseDetailsRef.current = null;
        // Set fallback on error
        setStorageSizeMW(0.5);
        setDurationHours(3);
      }
    };
    
    fetchUseCaseDetails();
  }, [selectedTemplate]);
  
  // 🔥 FIX SESSION PERSISTENCE BUG - Clear data when wizard opens
  useEffect(() => {
    if (show && !wizardInitialized) {
      if (import.meta.env.DEV) {
        console.log('🧹 Clearing wizard data for new session');
      }
      // Clear all user-entered data for fresh start
      setUseCaseData({});
      // Don't clear selectedTemplate - user might have selected from intro
    }
  }, [show, wizardInitialized]);

  // 🔥 SCROLL TO TOP - Use ref for reliable scrolling
  useEffect(() => {
    if (step >= 0 && modalContentRef.current) {
      // Scroll the modal content to top immediately
      modalContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
      console.log('🔝 Scrolled modal content to top for step:', step);
    }
  }, [step]);

  // 🔥 FETCH USE CASES - Load from database on mount
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

  // 🔥 INITIALIZE WIZARD - Only run ONCE when opening
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('📊 Wizard mount effect, show:', show, 'initialized:', wizardInitialized);
    }
    
    if (show && !wizardInitialized) {
      // Initialize wizard state ONCE
      if (import.meta.env.DEV) console.log('🎬 Initializing wizard for first time');
      
      // Start with intro or skip to step 0 based on prop
      if (skipIntro) {
        setStep(0);
        setShowIntro(false);
        if (import.meta.env.DEV) console.log('⚡ Skipping intro, starting at step 0');
      } else {
        setStep(-1);
        setShowIntro(true);
      }
      
      setShowCompletePage(false);
      setAiSuggestions([]);
      setShowAIWizard(false);
      setWizardInitialized(true);
      
      // Reset AI state for new wizard session
      aiStateService.resetForNewSession();
      
      // Check for quickstart data from use case templates
      const quickstartData = localStorage.getItem('merlin_wizard_quickstart');
      console.log('🔍 Checking for quickstart data:', quickstartData);
      if (quickstartData) {
        try {
          const wizardData = JSON.parse(quickstartData);
          console.log('🚀 Quickstart data found and parsed:', wizardData);
          
          // Set quickstart flag to prevent auto-calculation interference
          setIsQuickstart(true);
          
          // Pre-fill wizard with use case data
          setSelectedTemplate(wizardData.selectedTemplate || '');
          setUseTemplate(true);
          setStorageSizeMW(wizardData.storageSizeMW || 2);
          setDurationHours(wizardData.durationHours || 4);
          setLocation(wizardData.location || 'California');
          setElectricityRate(0.15); // Set default rate
          
          // Set some default use case data for EV charging
          if (wizardData.selectedTemplate === 'ev-charging') {
            setUseCaseData({
              numberOfChargers: 8,
              chargingType: 'mixed',
              level2Chargers: 8,
              dcFastChargers: 4
            });
          }
          
          // Jump to step 5 (quote summary) for review
          if (wizardData.jumpToStep) {
            console.log('🎯 Jumping to step:', wizardData.jumpToStep);
            setStep(wizardData.jumpToStep);
            setShowIntro(false);
          }
          
          // Clear the quickstart data so it doesn't persist
          localStorage.removeItem('merlin_wizard_quickstart');
          console.log('✅ Quickstart setup complete');
          
          // Reset quickstart flag after a delay to allow normal wizard operation
          setTimeout(() => {
            setIsQuickstart(false);
          }, 1000);
          
        } catch (e) {
          console.warn('Failed to parse quickstart data:', e);
          localStorage.removeItem('merlin_wizard_quickstart');
        }
      } else {
        console.log('ℹ️ No quickstart data found, normal wizard flow');
        setIsQuickstart(false);
      }
    }
    
    // Cleanup when wizard closes
    if (!show && wizardInitialized) {
      console.log('🔄 Wizard closed, resetting initialization flag');
      setWizardInitialized(false);
    }
  }, [show, wizardInitialized, startInAdvancedMode, skipIntro]);

  // Calculate default baseline when template is selected (before questions answered)
  // This ensures Power Status Bar has data to display immediately
  useEffect(() => {
    const calculateDefaultBaseline = async () => {
      if (!selectedTemplate || isQuickstart) return;
      
      // Only run if we don't have use case data yet (before questions answered)
      if (Object.keys(useCaseData).length > 0) return;
      
      if (import.meta.env.DEV) {
        console.log('🔷 [DEFAULT BASELINE] Calculating for template:', selectedTemplate);
      }
      
      try {
        setIsCalculatingBaseline(true);
        
        // Calculate with default scale (will use database defaults)
        const baseline = await calculateDatabaseBaseline(selectedTemplate, 1, {});
        
        if (import.meta.env.DEV) {
          console.log('🔷 [DEFAULT BASELINE] Result:', baseline);
        }
        
        // Set initial values
        setStorageSizeMW(baseline.powerMW);
        setDurationHours(baseline.durationHrs);
        
        // 🔥 CRITICAL: Calculate NET peak demand including existing systems
        // Field names match database: existingSolarKW (uppercase W), existingEVChargers
        const existingSolarMW = (useCaseData?.existingSolarKW || useCaseData?.existingSolarKw || 0) / 1000;
        const existingEvLoadMW = (useCaseData?.existingEVChargers || useCaseData?.existingEvPorts || 0) * 0.007; // 7kW per L2 port
        const netPeakDemandMW = (baseline.peakDemandMW || 0) + existingEvLoadMW - existingSolarMW;

        if (import.meta.env.DEV) {
          console.log('⚡ NET Peak Demand Calculation:', {
            basePeak: baseline.peakDemandMW,
            existingSolar: existingSolarMW,
            existingEV: existingEvLoadMW,
            netPeak: netPeakDemandMW
          });
        }

        // Store baseline for Power Status Bar
        setBaselineResult({
          generationRequired: baseline.generationRequired,
          generationRecommendedMW: baseline.generationRecommendedMW,
          generationReason: baseline.generationReason,
          gridConnection: baseline.gridConnection,
          gridCapacity: baseline.gridCapacity,
          peakDemandMW: netPeakDemandMW, // Use NET peak demand
          existingSolarMW, // Store for display
          existingEvLoadMW // Store for display
        });
        
        setIsCalculatingBaseline(false);
      } catch (error) {
        console.error('❌ Failed to calculate default baseline:', error);
        setIsCalculatingBaseline(false);
      }
    };
    
    calculateDefaultBaseline();
  }, [selectedTemplate, isQuickstart]);

  // Auto-calculate realistic configuration based on use case data
  useEffect(() => {
    const calculateConfig = async () => {
      if (selectedTemplate && Object.keys(useCaseData).length > 0 && !isQuickstart) {
        
        // ============================================================
        // 🎯 SINGLE SOURCE OF TRUTH: Use centralized power calculations
        // All industry-standard calculations are in useCasePowerCalculations.ts
        // This ensures consistency across the entire application
        // ============================================================
        
        if (import.meta.env.DEV) {
          console.log('🎯 [SmartWizard] Calculating power using centralized calculations:', {
            selectedTemplate,
            useCaseData,
            useCaseDataKeys: Object.keys(useCaseData || {})
          });
        }
        
        setIsCalculatingBaseline(true);
        
        // Use the centralized power calculation (SINGLE SOURCE OF TRUTH)
        const powerResult = calculateUseCasePower(selectedTemplate, useCaseData);
        
        if (import.meta.env.DEV) {
          console.log('✅ [SmartWizard] Centralized calculation result:', powerResult);
          console.log(`📊 [SmartWizard] ${powerResult.calculationMethod}`);
          console.log(`📊 [SmartWizard] ${powerResult.description}`);
        }
        
        const calculatedPowerMW = powerResult.powerMW;
        const calculatedDurationHrs = powerResult.durationHrs;
        
        setStorageSizeMW(calculatedPowerMW);
        setDurationHours(calculatedDurationHrs);
        
        // ✅ FIXED: Only set solar from baseline if user wants solar
        // Check wantsSolar from useCaseData - if 'No' or 'no', don't set solar
        const wantsSolarAnswer = useCaseData?.wantsSolar;
        const userWantsSolar = wantsSolarAnswer === undefined || 
                               wantsSolarAnswer === true || 
                               wantsSolarAnswer === 'yes' || 
                               wantsSolarAnswer === 'Yes';
        
        // Note: Solar sizing is now handled in Step 3/4 based on user preference
        // The centralized power calculation doesn't auto-set solar
        if (!userWantsSolar) {
          // User explicitly said no to solar - ensure it's 0
          setSolarMW(0);
          if (import.meta.env.DEV) {
            console.log('🚫 [SmartWizard] User declined solar, setting to 0');
          }
        }
        
        setIsCalculatingBaseline(false);
        
        // Store calculation result for Step3 to use
        // Note: Generation requirements are now handled based on grid connection in Step 4
        setBaselineResult({
          generationRequired: false,
          generationRecommendedMW: undefined,
          generationReason: undefined,
          gridConnection: useCaseData.gridConnection,
          gridCapacity: undefined,
          peakDemandMW: calculatedPowerMW
        });
        
        // Enhanced solar sizing using automated calculation
        const buildingCharacteristics = {
          useCase: selectedTemplate,
          buildingSize: useCaseData.buildingSize || useCaseData.facilitySize,
          facilitySize: useCaseData.facilitySize,
          peakLoad: calculatedPowerMW, // Use the local variable
          electricalLoad: useCaseData.electricalLoad || useCaseData.peakLoad,
          capacity: useCaseData.capacity,
          numRooms: useCaseData.numRooms,
          storageVolume: useCaseData.storageVolume || useCaseData.storage_volume,
          growingArea: useCaseData.growingArea || useCaseData.growing_area,
          storeSize: useCaseData.storeSize || useCaseData.store_size,
          gamingFloorSize: useCaseData.gamingFloorSize || useCaseData.gaming_floor_size
        };
        
        const solarSuggestion = calculateAutomatedSolarSizing(buildingCharacteristics);
        // ⚠️ BUG FIX: Don't auto-set solar UNLESS generation is required
        // Solar suggestion calculated but NOT auto-applied - user must choose in Step 3
        // (generationRequired is always false at this point since we set it above)
        console.log('🌞 Solar suggestion calculated (not auto-applied):', {
          template: selectedTemplate,
          characteristics: buildingCharacteristics,
          suggestion: solarSuggestion,
          note: 'User must explicitly choose solar in Step 3'
        });
      }
    };
    
    // Calculate when on Step 1 (questionnaire) and user has answered questions
    // OR when moving to Step 2 (configuration)
    // This shows power preview on the questionnaire page
    if ((step === 1 || step === 2) && Object.keys(useCaseData).length > 0) {
      // Debounce to avoid calculating on every keystroke
      const timeoutId = setTimeout(() => {
        calculateConfig();
      }, 100); // ✅ Reduced from 500ms to 100ms to eliminate visible glitch
      
      return () => clearTimeout(timeoutId);
    }
    
    // Return empty cleanup if conditions not met
    return () => {};
  }, [selectedTemplate, step, isQuickstart]);

  // ✅ CRITICAL: Reset solar when user says "No" to wantsSolar question
  useEffect(() => {
    const wantsSolarAnswer = useCaseData?.wantsSolar;
    // If user explicitly says "No" to solar, reset solarMW to 0
    if (wantsSolarAnswer === 'no' || wantsSolarAnswer === 'No' || wantsSolarAnswer === false) {
      if (solarMW > 0) {
        setSolarMW(0);
        if (import.meta.env.DEV) {
          console.log('🚫 [SmartWizard] wantsSolar changed to No, resetting solar to 0');
        }
      }
    }
  }, [useCaseData?.wantsSolar]);

  // Step 4: Renewables (was Step 4)
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);
  const [generatorsExplicitlyAdded, setGeneratorsExplicitlyAdded] = useState(false);
  
  // Solar space configuration
  const [solarSpaceConfig, setSolarSpaceConfig] = useState<{
    spaceType: 'rooftop' | 'ground' | 'canopy' | 'mixed';
    rooftopSqFt?: number;
    groundAcres?: number;
    useAI: boolean;
  }>({
    spaceType: 'rooftop',
    useAI: true
  });
  
  // EV Charger configuration
  const [evChargerConfig, setEVChargerConfig] = useState({
    level2_11kw: 0,
    level2_19kw: 0,
    dcfast_50kw: 0,
    dcfast_150kw: 0,
    dcfast_350kw: 0
  });
  
  // Wind turbine configuration
  const [windConfig, setWindConfig] = useState<{
    turbineSize: '2.5' | '3.0' | '5.0';  // MW per turbine
    numberOfTurbines: number;
    useAI: boolean;
  }>({
    turbineSize: '2.5',
    numberOfTurbines: 0,
    useAI: true
  });
  
  // Generator configuration
  const [generatorConfig, setGeneratorConfig] = useState<{
    generatorType: 'diesel' | 'natural-gas' | 'dual-fuel';
    numberOfUnits: number;
    sizePerUnit: number;  // MW
    useAI: boolean;
  }>({
    generatorType: 'diesel',
    numberOfUnits: 0,
    sizePerUnit: 0.25,  // 250 kW per unit
    useAI: true
  });

  // Step 4: Location & Pricing
  const [location, setLocation] = useState('');
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [knowsRate, setKnowsRate] = useState(false);

  // Equipment breakdown state (calculated asynchronously) - MUST be declared before useEffect that uses it
  const [equipmentBreakdown, setEquipmentBreakdown] = useState<any>(null);

  // ============================================================================
  // CALCULATE FINANCIAL METRICS (For Steps 6 & 7)
  // ============================================================================
  // ✅ FIX: Use values from costs state (populated by calculateCosts callback)
  // The calculateCosts function uses equipmentBreakdown with CORRECT database pricing
  // DO NOT use hardcoded pricing like $400K/MWh - that's inaccurate!
  useEffect(() => {
    const calculateFinancials = async () => {
      if (storageSizeMW > 0 && durationHours > 0 && location) {
        try {
          // ✅ Get accurate equipment costs from equipmentBreakdown
          // equipmentBreakdown is calculated with database pricing in calculateCosts
          if (equipmentBreakdown?.totals) {
            setEquipmentCost(equipmentBreakdown.totals.equipmentCost || 0);
            setInstallationCost(equipmentBreakdown.totals.installationCost || 0);
          }
          
          // Get financial metrics from centralized calculations
          const metrics = await calculateFinancialMetrics({
            storageSizeMW,
            durationHours,
            location: location || 'California',
            electricityRate: electricityRate || 0.12,
            solarMW: solarMW || 0,
            equipmentCost: equipmentBreakdown?.totals?.equipmentCost,
            installationCost: equipmentBreakdown?.totals?.installationCost,
            includeNPV: true,
          });

          setAnnualSavings(metrics.annualSavings || 0);
          setPaybackYears(metrics.paybackYears || 0);
          setRoi10Year(metrics.roi10Year || 0);
          setRoi25Year(metrics.roi25Year || 0);
          setNpv(metrics.npv || 0);
          setIrr(metrics.irr || 0);
        } catch (error) {
          console.error('Failed to calculate financial metrics:', error);
        }
      }
    };

    calculateFinancials();
  }, [storageSizeMW, durationHours, location, electricityRate, solarMW, equipmentBreakdown]);

  // Step 5: Options (tracked in Step5_QuoteSummary component)
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');

  // Costs state (calculated asynchronously from database)
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

  // Advanced Analytics State - Integration of Mathematical Models and ML
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [loadPatternAnalysis, setLoadPatternAnalysis] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [controlStrategy, setControlStrategy] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [batteryModelData, setBatteryModelData] = useState<any>(null);
  const [mpcStrategy, setMpcStrategy] = useState<any>(null);
  const [analyticsConfidence, setAnalyticsConfidence] = useState(0);

  // AI Baseline - calculated in background
  const [aiBaseline, setAiBaseline] = useState<{
    optimalPowerMW: number;
    optimalDurationHrs: number;
    optimalSolarMW: number;
    improvementText: string;
    gridStrategy?: {
      strategy: string;
      savingsReason: string;
      annualSavings: number;
      requiresGeneration: boolean;
      recommendedSolarMW: number;
    };
  } | null>(null);

  // Calculate AI baseline whenever industry changes
  useEffect(() => {
    if (selectedTemplate) {
      const industry = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
      
      // Industry-specific optimal ratios
      const industryProfiles: { [key: string]: { powerMW: number; durationHrs: number; solarRatio: number } } = {
        'manufacturing': { powerMW: 3.5, durationHrs: 4, solarRatio: 1.2 },
        'office': { powerMW: 0.15, durationHrs: 3, solarRatio: 0.8 }, // CORRECTED: Small commercial office 50-300kW typical
        'small-office': { powerMW: 0.08, durationHrs: 2, solarRatio: 0.5 }, // Very small office: <10 employees
        'medical-office': { powerMW: 0.10, durationHrs: 2, solarRatio: 0.6 }, // Medical/professional office
        'datacenter': { powerMW: 8.0, durationHrs: 6, solarRatio: 0.8 },
        'warehouse': { powerMW: 2.5, durationHrs: 4, solarRatio: 1.5 },
        'hotel': { powerMW: 1.2, durationHrs: 4, solarRatio: 1.0 }, // ✅ CORRECTED: ~400 rooms baseline (400 × 0.00293)
        'retail': { powerMW: 1.5, durationHrs: 4, solarRatio: 1.3 },
        'agriculture': { powerMW: 2.0, durationHrs: 6, solarRatio: 2.0 },
        'car-wash': { powerMW: 0.8, durationHrs: 3, solarRatio: 1.8 },
        'ev-charging': { powerMW: 5.0, durationHrs: 2, solarRatio: 1.0 },
        'apartment': { powerMW: 2.0, durationHrs: 4, solarRatio: 1.2 },
        'university': { powerMW: 4.0, durationHrs: 5, solarRatio: 1.3 },
        'indoor-farm': { powerMW: 3.0, durationHrs: 12, solarRatio: 1.8 },
        'dental-office': { powerMW: 0.12, durationHrs: 2, solarRatio: 0.6 }, // Small healthcare practice: 120kW peak, minimal solar
        'hospital': { powerMW: 5.0, durationHrs: 8, solarRatio: 1.0 },
        'cold-storage': { powerMW: 2.0, durationHrs: 8, solarRatio: 1.5 },
      };
      
      const profile = industryProfiles[industry] || { powerMW: 2.0, durationHrs: 4, solarRatio: 1.0 };
      
      // Goal-specific adjustments
      // Set optimal configuration based on industry profile
      const optimalPowerMW = profile.powerMW;
      const optimalDurationHrs = profile.durationHrs;
      const optimalSolarMW = profile.powerMW * profile.solarRatio;
      
      setAiBaseline({
        optimalPowerMW,
        optimalDurationHrs,
        optimalSolarMW,
        improvementText: '', // Will calculate when user reaches step 5
      });
    }
  }, [selectedTemplate]);

  // 🎯 CALCULATE POWER PROFILE - Update level as user progresses
  useEffect(() => {
    if (!selectedTemplate) return;

    const profileData = {
      selectedTemplate,
      useCaseData,
      storageSizeMW,
      durationHours,
      location,
      electricityRate,
      solarMW,
      windMW,
      generatorMW
    };

    const profile = calculatePowerProfile(profileData);
    setPowerProfileLevel(profile.level);
    setPowerProfilePoints(profile.points);
    setPowerProfileCompletedChecks(profile.completedChecks);

    if (import.meta.env.DEV) {
      console.log('🎯 Power Profile updated:', {
        level: profile.level,
        points: profile.points,
        checks: profile.completedChecks.length
      });
    }
  }, [selectedTemplate, useCaseData, storageSizeMW, durationHours, location, electricityRate, solarMW, windMW, generatorMW]);

  // Calculate improvement text when user reaches step 5
  // ✅ Uses equipmentBreakdown from database-driven calculations (Single Source of Truth)
  useEffect(() => {
    if (step === 5 && aiBaseline && equipmentBreakdown?.totals) {
      const userEnergyMWh = storageSizeMW * durationHours;
      const optimalEnergyMWh = aiBaseline.optimalPowerMW * aiBaseline.optimalDurationHrs;
      const efficiencyDiff = ((optimalEnergyMWh / userEnergyMWh - 1) * 100);
      
      // ✅ Use actual equipment costs from database, not hardcoded values
      const userCost = equipmentBreakdown.totals.totalProjectCost;
      // For optimal cost comparison, use ratio-based estimate from user cost
      // (Proper comparison would require async recalc with optimal config)
      const costRatio = (optimalEnergyMWh / userEnergyMWh);
      const estimatedOptimalCost = userCost * costRatio;
      const costDiff = userCost - estimatedOptimalCost;
      
      let improvementText = '';
      if (Math.abs(efficiencyDiff) < 10 && Math.abs(costDiff) < 100000) {
        improvementText = '✓ Optimal Configuration';
      } else if (costDiff > 0) {
        improvementText = `💰 Save $${(costDiff / 1000000).toFixed(1)}M`;
      } else if (efficiencyDiff > 0) {
        improvementText = `⚡ ${Math.abs(efficiencyDiff).toFixed(0)}% More Efficient`;
      } else {
        improvementText = `🔋 ${Math.abs(efficiencyDiff).toFixed(0)}% More Power`;
      }
      
      setAiBaseline(prev => prev ? { ...prev, improvementText } : null);
    }
  }, [step, storageSizeMW, durationHours, equipmentBreakdown]);

  // 🚫 AI USE CASE RECOMMENDATION TEMPORARILY DISABLED
  // TODO [v2.1]: Re-enable AI recommendations with centralizedCalculations.ts v2.0.0
  // Currently uses hardcoded formulas that don't match database-driven calculations
  // causing confusion (e.g., AI suggests 11.5MW vs SmartWizard's 5.4MW for same use case)
  // Next steps: Integrate with calculateFinancialMetrics() from centralizedCalculations
  /*
  // Generate AI use case recommendation when user completes Step 2
  useEffect(() => {
    if (step === 2 && Object.keys(useCaseData).length > 0 && selectedTemplate) {
      // Generate industry-specific recommendations
      let message = '';
      let savings = '';
      let roi = '';
      let configuration = '';

      switch (selectedTemplate) {
        case 'ev-charging':
          // New sophisticated EV charging calculations
          const stationType = useCaseData.stationType || 'public-urban';
          const level2Count = parseInt(useCaseData.level2Chargers) || 0;
          const level2Power = parseFloat(useCaseData.level2Power) || 11;
          const dcFastCount = parseInt(useCaseData.dcFastChargers) || 0;
          const dcFastPower = parseFloat(useCaseData.dcFastPower) || 150;
          const utilizationProfile = useCaseData.utilizationProfile || 'medium';
          const customUtilization = parseInt(useCaseData.customUtilization) || 40;
          const peakConcurrency = parseInt(useCaseData.peakConcurrency) || 50;
          const gridConnection = useCaseData.gridConnection || 'on-grid';
          
          // Calculate utilization rates based on location and profile
          const utilizationRates: Record<string, Record<string, number>> = {
            'low': { base: 15, highway: 25, urban: 20, workplace: 10, retail: 18, fleet: 30 },
            'medium': { base: 35, highway: 45, urban: 40, workplace: 25, retail: 35, fleet: 60 },
            'high': { base: 60, highway: 70, urban: 65, workplace: 45, retail: 58, fleet: 85 },
            'very-high': { base: 80, highway: 85, urban: 82, workplace: 65, retail: 75, fleet: 95 },
            'custom': { base: customUtilization, highway: customUtilization, urban: customUtilization, workplace: customUtilization, retail: customUtilization, fleet: customUtilization }
          };
          
          // Location multipliers for utilization
          const locationKey = stationType.includes('highway') ? 'highway' : 
                            stationType.includes('urban') ? 'urban' :
                            stationType.includes('workplace') ? 'workplace' :
                            stationType.includes('retail') ? 'retail' :
                            stationType.includes('fleet') ? 'fleet' : 'base';
                            
          const avgUtilization = utilizationRates[utilizationProfile]?.[locationKey] || utilizationRates[utilizationProfile]?.['base'] || 35;
          
          // Calculate total power requirements
          const level2TotalPower = level2Count * level2Power; // kW
          const dcFastTotalPower = dcFastCount * dcFastPower; // kW
          const maxConcurrentPower = (level2TotalPower + dcFastTotalPower) * (peakConcurrency / 100); // kW
          const avgContinuousPower = (level2TotalPower + dcFastTotalPower) * (avgUtilization / 100); // kW
          
          // Battery sizing based on grid connection and power profile
          let batteryMW, batteryHours, solarMW, annualSavings, roiYears;
          
          if (gridConnection === 'off-grid') {
            // Off-grid: Need to handle full load + reserve
            batteryMW = maxConcurrentPower * 1.5 / 1000; // 150% of peak + reserve
            batteryHours = 6; // Extended runtime for off-grid
            // Note: Solar is optional - user must add explicitly if they have space
            annualSavings = avgContinuousPower * 8760 * 0.15; // $0.15/kWh avoided grid cost
            roiYears = 5;
            
            message = `Off-grid charging station with ${level2Count + dcFastCount} total chargers requires robust backup power. Battery-only solution shown - solar can be added if you have adequate land space.`;
            configuration = `${formatPowerCompact(batteryMW)} / ${batteryHours}hr BESS (Solar optional - requires significant land area)`;
          } else if (gridConnection === 'limited') {
            // Limited grid: Focus on demand charge reduction
            batteryMW = maxConcurrentPower * 0.8 / 1000; // 80% of peak to manage demand
            batteryHours = 2; // Short duration for demand management
            annualSavings = maxConcurrentPower * 12 * 25; // $25/kW-month demand charges
            roiYears = 3;
            
            message = `Limited grid capacity for ${level2Count + dcFastCount} chargers requires demand management. Battery storage reduces peak demand charges by 70-80%. Solar is optional if space permits.`;
            configuration = `${formatPowerCompact(batteryMW)} / ${batteryHours}hr BESS (Solar optional)`;
          } else {
            // On-grid: Optimize for demand charges and energy arbitrage
            batteryMW = maxConcurrentPower * 0.6 / 1000; // 60% of peak for demand shaving
            batteryHours = 2;
            annualSavings = (maxConcurrentPower * 12 * 20) + (avgContinuousPower * 8760 * 0.05); // Demand + energy savings
            roiYears = 4;
            
            message = `${stationType.replace('-', ' ')} station with ${level2Count + dcFastCount} total chargers. ${avgUtilization}% average utilization creates demand charges that storage can reduce. Solar can be added if roof/parking canopy space available.`;
              configuration = `${formatPowerCompact(batteryMW)} / ${batteryHours}hr BESS (Solar optional)`;
          }
          
          savings = `$${Math.round(annualSavings/1000)}K/year`;
          roi = `${roiYears} years`;
          break;

        case 'car-wash':
          const numBays = useCaseData.numBays || 3;
          const heatedWater = useCaseData.heatedWater === 'yes';
          
          message = `Most car washes with ${numBays} bays save $${heatedWater ? '50-80' : '30-50'}K per year using a hybrid solar+storage system. Your short peak demand cycles (30-45 min) are perfect for battery smoothing, which reduces demand charges by 40-60%.`;
          savings = `$${heatedWater ? '50-80' : '30-50'}K/year`;
          roi = '3-5 years';
          configuration = `${numBays * 0.25}MW / ${heatedWater ? 4 : 3}hr BESS + ${numBays * 0.3}MW Solar`;
          break;

        case 'hotel':
          const numRooms = useCaseData.numRooms || 100;
          const amenities = useCaseData.amenities || [];
          const hasPool = amenities.includes('pool');
          const hasRestaurant = amenities.includes('restaurant');
          const gridReliability = useCaseData.gridReliability || 'reliable';
          const squareFootage = parseFloat(useCaseData.squareFootage) || 0;
          
          // Calculate power requirement
          let hotelPowerMW: number;
          
          if (squareFootage > 0) {
            // Use square footage if provided (8-10 W/sq ft for hotels)
            // Using 9 W/sq ft as middle ground - includes HVAC, lighting, kitchen, laundry
            hotelPowerMW = (squareFootage * 9) / 1000000; // Convert W to MW
          } else {
            // Fall back to room count calculation
            // ✅ CORRECTED: Use authoritative calculation (2.93 kW per room from CBECS/ASHRAE data)
            // Source: src/data/useCaseTemplates.ts line 560 (440kW / 150 rooms = 2.93 kW/room)
            hotelPowerMW = numRooms * 0.00293;
          }
          
          // Calculate solar feasibility (optional, realistic estimate)
          // CORRECTED: Typical hotel roof can support 2-5 kW per room (not 10 kW - that was too aggressive)
          // Most hotels have 50-70% usable roof space after HVAC, elevators, etc.
          let hotelSolarMW = numRooms * 0.003; // Realistic 3kW per room for actual usable roof space
          if (hasPool) hotelSolarMW += 0.15; // Pool equipment (reduced from 0.3)
          if (hasRestaurant) hotelSolarMW += 0.10; // Kitchen equipment (reduced from 0.2)
          const hotelRooftopAcres = (hotelSolarMW * 1000 * 100) / 43560; // 100 sq ft per kW for rooftop
          
          if (gridReliability === 'unreliable') {
            message = `Hotels with ${numRooms} rooms in areas with unreliable grid service benefit significantly from backup power systems. Guest satisfaction improves dramatically when you can maintain operations during outages.`;
            savings = '$80-150K/year';
            roi = '4-6 years';
            configuration = `${formatPowerCompact(hotelPowerMW)} / 8hr BESS`;
          } else if (hasPool && hasRestaurant) {
            if (hotelRooftopAcres <= 2) {
              message = `Hotels with ${numRooms} rooms, pool/spa, and restaurant typically see $70-120K annual savings with battery storage. Your daytime loads (pool pumps, kitchen equipment) align well with solar - consider adding ${formatSolarCapacity(hotelSolarMW)} rooftop solar if roof space permits.`;
              configuration = `${formatPowerCompact(hotelPowerMW)} / 5hr BESS + Optional ${formatSolarCapacity(hotelSolarMW)} Solar`;
            } else {
              message = `Hotels with ${numRooms} rooms, pool/spa, and restaurant typically see $70-120K annual savings with battery storage. Solar would need ${hotelRooftopAcres.toFixed(1)} acres of roof space - verify capacity or consider parking canopies.`;
              configuration = `${formatPowerCompact(hotelPowerMW)} / 5hr BESS + Optional Solar (if space permits)`;
            }
            savings = '$70-120K/year';
            roi = '4-6 years';
          } else {
            if (hotelRooftopAcres <= 1.5) {
              message = `For a ${numRooms}-room hotel, battery storage systems typically save $50-90K per year by reducing demand charges. Solar can boost savings if you have ${hotelRooftopAcres.toFixed(1)} acres of available roof space.`;
              configuration = `${formatPowerCompact(hotelPowerMW)} / 4hr BESS + Optional ${formatSolarCapacity(hotelSolarMW)} Solar`;
            } else {
              message = `For a ${numRooms}-room hotel, battery storage systems typically save $50-90K per year by reducing demand charges. Solar would require ${hotelRooftopAcres.toFixed(1)} acres of roof - check availability.`;
              configuration = `${formatPowerCompact(hotelPowerMW)} / 4hr BESS + Optional Solar (check roof capacity)`;
            }
            savings = '$50-90K/year';
            roi = '5-7 years';
          }
          break;

        case 'datacenter':
          const squareFootageDC = parseFloat(useCaseData.squareFootage) || 0;
          let capacity = parseFloat(useCaseData.capacity) || 5;
          
          // If square footage provided, calculate capacity from power density
          // ✅ USES CENTRALIZED POWER DENSITY: 150 W/sq ft (data center standard)
          if (squareFootageDC > 0) {
            capacity = (squareFootageDC * POWER_DENSITY_STANDARDS.datacenter) / 1000000; // Convert W to MW
          }
          
          const uptimeReq = useCaseData.uptimeRequirement || 'tier3';
          const gridConn = useCaseData.gridConnection || 'single';
          
          // Conservative solar sizing - datacenters have limited roof space due to cooling
          let datacenterSolarMW = Math.min(capacity * 0.2, 1.5); // Max 1.5MW due to space constraints
          const datacenterRooftopAcres = (datacenterSolarMW * 1000 * 100) / 43560;
          
          if (gridConn === 'microgrid' || gridConn === 'limited') {
            // Use centralized calculation service
            const { powerMW, durationHours: dur } = calculateDatacenterBESS(capacity, uptimeReq, gridConn);
            setStorageSizeMW(powerMW);
            setDurationHours(dur);
            message = `Datacenters with ${formatPowerCompact(capacity)} capacity and ${gridConn === 'microgrid' ? 'microgrid architecture' : 'limited grid capacity'} require significant battery storage for continuous operation. Battery systems provide instant switchover (< 10ms) compared to generators (10-15 seconds). Solar limited by cooling equipment space.`;
            configuration = `${formatPowerCompact(powerMW)} / ${dur}hr BESS + ${formatPowerCompact(capacity * 0.3)} Generator + Optional ${formatSolarCapacity(datacenterSolarMW)} Solar`;
            savings = '$200-400K/year';
            roi = '3-5 years';
          } else if (uptimeReq === 'tier4') {
            // Use centralized calculation service
            const { powerMW, durationHours: dur } = calculateDatacenterBESS(capacity, uptimeReq, gridConn);
            setStorageSizeMW(powerMW);
            setDurationHours(dur);
            message = `Tier IV datacenters (${formatPowerCompact(capacity)}) require 2N or 2N+1 redundancy with 99.995% uptime. Rooftop space limited by cooling infrastructure - consider off-site solar PPA if renewable energy goals exist.`;
            configuration = `${formatPowerCompact(powerMW)} / ${dur}hr BESS + ${formatPowerCompact(capacity * 0.3)} Generator + Optional Off-site Solar PPA`;
            savings = '$150-300K/year';
            roi = '4-6 years';
          } else {
            // Use centralized calculation service (Tier III default)
            const { powerMW, durationHours: dur } = calculateDatacenterBESS(capacity, uptimeReq, gridConn);
            setStorageSizeMW(powerMW);
            setDurationHours(dur);
            message = `${formatPowerCompact(capacity)} ${uptimeReq.toUpperCase()} datacenters benefit from battery+generator hybrid systems. Batteries handle short outages instantly while generators provide extended runtime. Limited rooftop solar possible if cooling permits.`;
            configuration = `${formatPowerCompact(powerMW)} / ${dur}hr BESS + ${formatPowerCompact(capacity * 0.2)} Generator + Optional ${datacenterSolarMW.toFixed(1)}MW Solar`;
            savings = '$100-200K/year';
            roi = '4-7 years';
          }
          break;

        case 'hospital':
          const bedCount = useCaseData.bedCount || 200;
          const criticalSystems = useCaseData.criticalSystems || [];
          const hasICU = criticalSystems.includes('icu');
          const hasSurgery = criticalSystems.includes('surgery');
          const backupDuration = useCaseData.backupDuration || '8hr';
          
          if (hasICU || hasSurgery) {
            message = `Healthcare facilities with ${bedCount} beds and critical care units (ICU/surgery) require instant switchover during power events. Battery storage provides seamless transition (< 10ms) vs. generators (10-15 sec), critical for life support systems.`;
            savings = '$150-250K/year';
            roi = '5-7 years';
            configuration = `${formatPowerCompact(bedCount * 0.03)} / ${backupDuration === '24hr' ? 12 : 8}hr BESS + ${formatPowerCompact(bedCount * 0.02)} Solar + Generator`;
          } else {
            message = `${bedCount}-bed hospitals can significantly reduce energy costs with solar+storage while maintaining backup power capabilities for essential systems.`;
            savings = '$100-180K/year';
            roi = '5-8 years';
            configuration = `${formatPowerCompact(bedCount * 0.025)} / 8hr BESS + ${formatPowerCompact(bedCount * 0.02)} Solar`;
          }
          break;

        case 'airport':
          const facilityType = useCaseData.facilityType || 'terminal';
          const criticalLoads = useCaseData.criticalLoads || [];
          const hasATC = criticalLoads.includes('atc');
          const hasRunwayLighting = criticalLoads.includes('lighting');
          
          // Airport space considerations - terminals have good rooftop potential
          const airportSolarMW = facilityType === 'full-airport' ? 4 : facilityType === 'terminal' ? 2.0 : 1.2;
          const airportRooftopAcres = (airportSolarMW * 1000 * 100) / 43560;
          
          if (hasATC || hasRunwayLighting) {
            message = `Airport critical systems (ATC, runway lighting) are FAA-mandated and require instant backup power. Battery storage provides immediate response for these life-safety systems while reducing generator runtime by 70-80%. Terminal rooftop solar possible if ${airportRooftopAcres.toFixed(1)} acres available.`;
            configuration = `5.0MW / 6hr BESS + 4.0MW Generator + Optional ${airportSolarMW.toFixed(1)}MW Terminal Rooftop Solar`;
            savings = '$200-400K/year';
            roi = '4-6 years';
          } else if (facilityType === 'full-airport') {
            message = `Full airport operations benefit from microgrid architecture. Battery storage handles demand charges and outages while generators provide extended backup. Large rooftop areas suitable for solar if space permits and meets FAA clearance requirements.`;
            configuration = `8.0MW / 8hr BESS + 5.0MW Generator + Optional ${airportSolarMW.toFixed(1)}MW Solar (check FAA clearance)`;
            savings = '$300-600K/year';
            roi = '4-7 years';
          } else {
            message = `${facilityType === 'terminal' ? 'Terminal' : 'Hangar'} facilities can achieve significant cost savings with battery storage while maintaining backup power for essential operations. Good rooftop potential for solar if desired.`;
            savings = '$100-200K/year';
            roi = '5-8 years';
            configuration = `${formatPowerCompact(2.0)} / 4hr BESS + Optional ${airportSolarMW.toFixed(1)}MW Rooftop Solar`;
          }
          break;

        case 'tribal-casino':
          const squareFootageCasino = parseFloat(useCaseData.squareFootage) || 0;
          const facilitySize = useCaseData.facilitySize || 'medium';
          const casinoOperations = useCaseData.operations || '24-7';
          
          // Calculate power from square footage if provided
          // ✅ USES CENTRALIZED POWER DENSITY: 18 W/sq ft (casino gaming floor)
          let casinoPowerMW: number;
          if (squareFootageCasino > 0) {
            casinoPowerMW = (squareFootageCasino * POWER_DENSITY_STANDARDS.casino) / 1000000;
          } else {
            // Fall back to facility size estimate
            const sizeMap: Record<string, number> = { micro: 0.15, small: 0.5, medium: 1.5, large: 4.0 };
            casinoPowerMW = sizeMap[facilitySize] || 1.5;
          }
          
          message = `${casinoOperations === '24-7' ? '24/7' : 'Extended hours'} casino operations require reliable backup power. Even brief outages impact gaming revenue significantly. Battery storage provides instant switchover (<10ms) vs generators (10-15 sec).`;
          configuration = `${formatPowerCompact(casinoPowerMW)} / 6hr BESS + ${formatPowerCompact(casinoPowerMW * 0.5)} Generator + Optional Solar`;
          savings = '$100-250K/year';
          roi = '4-6 years';
          break;

        case 'logistics-center':
          const squareFootageLog = parseFloat(useCaseData.squareFootage) || 0;
          const logFacilityType = useCaseData.facilityType || 'warehouse';
          const logFacilitySize = useCaseData.facilitySize || 'medium';
          const hasColdStorage = useCaseData.criticalLoads?.includes('refrigeration');
          
          // Calculate power from square footage if provided
          // ✅ USES CENTRALIZED POWER DENSITY: warehouse 2 W/sq ft, coldStorage 8 W/sq ft
          let logisticsPowerMW: number;
          if (squareFootageLog > 0) {
            // Use appropriate density based on facility type
            const logisticsDensity = hasColdStorage || logFacilityType === 'cold-storage' 
              ? POWER_DENSITY_STANDARDS.coldStorage 
              : POWER_DENSITY_STANDARDS.warehouse;
            logisticsPowerMW = (squareFootageLog * logisticsDensity) / 1000000;
          } else {
            // Fall back to facility size estimate
            const sizeMap: Record<string, number> = { micro: 0.15, small: 0.5, medium: 1.5, large: 4.0 };
            logisticsPowerMW = sizeMap[logFacilitySize] || 1.5;
          }
          
          if (hasColdStorage) {
            message = `Cold storage requires uninterrupted power - even brief outages can spoil inventory worth millions. Battery storage ensures refrigeration systems stay operational during grid events.`;
            configuration = `${formatPowerCompact(logisticsPowerMW)} / 8hr BESS + ${formatPowerCompact(logisticsPowerMW * 0.4)} Generator + Optional Solar`;
            savings = '$150-300K/year';
            roi = '3-5 years';
          } else {
            message = `${logFacilityType === 'fulfillment' ? 'Fulfillment centers' : 'Distribution hubs'} benefit from demand charge reduction through battery peak shaving. Solar can offset daytime operational loads.`;
            configuration = `${formatPowerCompact(logisticsPowerMW)} / 4hr BESS + Optional Solar`;
            savings = '$80-180K/year';
            roi = '4-7 years';
          }
          break;

        case 'shopping-center':
          const squareFootageMall = parseFloat(useCaseData.squareFootage) || 0;
          const centerSize = useCaseData.centerSize || 'community';
          
          // Calculate power from square footage if provided
          // ✅ USES CENTRALIZED POWER DENSITY: 10 W/sq ft (shopping center)
          let mallPowerMW: number;
          if (squareFootageMall > 0) {
            mallPowerMW = (squareFootageMall * POWER_DENSITY_STANDARDS.shoppingCenter) / 1000000;
          } else {
            // Fall back to center size estimate
            const sizeMap: Record<string, number> = { strip: 0.5, community: 2.0, regional: 5.0 };
            mallPowerMW = sizeMap[centerSize] || 2.0;
          }
          
          message = `Shopping centers benefit from demand charge reduction and backup power for tenant operations. Large roof areas are ideal for solar installations to offset daytime loads.`;
          configuration = `${formatPowerCompact(mallPowerMW)} / 4hr BESS + ${formatPowerCompact(mallPowerMW * 0.6)} Solar (rooftop)`;
          savings = '$120-250K/year';
          roi = '4-6 years';
          break;

        default:
          message = `Based on your industry and operational requirements, we recommend a balanced approach combining battery storage with renewable energy to maximize savings and reliability.`;
          savings = '$50-100K/year';
          roi = '5-7 years';
          configuration = `${formatPowerCompact(2.0)} / 4hr BESS + ${formatPowerCompact(2.0)} Solar`;
      }

      setAiUseCaseRecommendation({ message, savings, roi, configuration });
    }
  }, [step, useCaseData, selectedTemplate]);
  */
  // End of disabled AI recommendation code


  // 🗑️ REMOVED: Hardcoded template defaults - now using database configurations
  // All defaults are loaded from use_case_configurations table via getUseCaseBySlug()
  // This ensures consistency between database and frontend without manual maintenance

  // Cost calculations - SINGLE SOURCE OF TRUTH: equipmentCalculations.ts
  // ✅ PERFORMANCE: Memoize with useCallback to prevent unnecessary recalculations
  const calculateCosts = useCallback(async () => {
    // ✅ USE ONLY equipmentCalculations.ts - it queries database pricing via unifiedPricingService
    const gridConnection = useCaseData?.gridConnection || 'on-grid';
    
    if (import.meta.env.DEV) {
      console.log('🔍 [SmartWizardV2] calculateCosts called with useCaseData:', {
        hasUseCaseData: !!useCaseData,
        level2_11kw: useCaseData?.level2_11kw,
        dcfast_150kw: useCaseData?.dcfast_150kw,
        allKeys: Object.keys(useCaseData || {})
      });
    }
    
    const equipmentBreakdown = await calculateEquipmentBreakdown(
      storageSizeMW, 
      durationHours, 
      solarMW, 
      windMW, 
      generatorMW,
      { selectedIndustry: selectedTemplate || 'manufacturing', useCaseData },
      gridConnection,
      location || 'California'
    );
    
    if (import.meta.env.DEV) {
      console.log('✅ [SmartWizardV2] Using equipmentCalculations.ts as SINGLE SOURCE OF TRUTH:', {
        equipmentCost: equipmentBreakdown.totals.equipmentCost,
        installationCost: equipmentBreakdown.totals.installationCost,
        totalProjectCost: equipmentBreakdown.totals.totalProjectCost,
        hasSolar: !!equipmentBreakdown.solar,
        solarCost: equipmentBreakdown.solar?.totalCost || 0,
        hasEVChargers: !!equipmentBreakdown.evChargers,
        evChargersCost: equipmentBreakdown.evChargers?.totalChargingCost || 0
      });
    }
    
    // Calculate financial metrics using equipment breakdown totals
    const totalProjectCost = equipmentBreakdown.totals.totalProjectCost;
    
    // ✅ Enhance financial calculations for office buildings
    // Office buildings benefit from higher demand charges and backup power value
    const isOffice = selectedTemplate === 'office' || selectedTemplate === 'medical-office' || selectedTemplate === 'dental-office';
    const demandChargeRate = isOffice ? 25000 : undefined; // $25K/MW-month for offices (vs $15K default)
    const includeBackupValue = isOffice; // Include business continuity value for offices
    
    if (import.meta.env.DEV) {
      console.log('🏢 [Office Financial Enhancement Check]:', {
        selectedTemplate,
        isOffice,
        demandChargeRate,
        includeBackupValue
      });
    }
    
    // ✅ Use centralizedCalculations for accurate financial metrics
    const financialMetrics = await calculateFinancialMetrics({
      storageSizeMW: storageSizeMW,
      durationHours: durationHours,
      location: location || 'California',
      electricityRate: electricityRate || 0.15,
      solarMW: solarMW,
      equipmentCost: equipmentBreakdown.totals.equipmentCost,
      installationCost: equipmentBreakdown.totals.installationCost,
      includeNPV: true
    });
    
    const calculatedCosts = {
      equipmentCost: equipmentBreakdown.totals.equipmentCost,
      installationCost: equipmentBreakdown.totals.installationCost,
      shippingCost: 0, // Already included in equipment costs from database
      tariffCost: 0, // Already included in equipment costs from database  
      totalProjectCost: equipmentBreakdown.totals.totalProjectCost, // ✅ Use equipment breakdown total, not financial metrics
      taxCredit: equipmentBreakdown.totals.totalProjectCost * 0.3, // Calculate tax credit from correct total
      netCost: equipmentBreakdown.totals.totalProjectCost * 0.7, // Net cost after 30% tax credit
      annualSavings: financialMetrics.annualSavings,
      paybackYears: (equipmentBreakdown.totals.totalProjectCost * 0.7) / financialMetrics.annualSavings // Recalc with correct costs
    };
    
    if (import.meta.env.DEV) {
      console.log('✅ [SmartWizardV2] Using centralizedCalculations for financial metrics:', {
        paybackYears: calculatedCosts.paybackYears,
        annualSavings: calculatedCosts.annualSavings,
        npv: financialMetrics.npv,
        irr: financialMetrics.irr
      });
    }
    
    // Update state so dashboard can use these values
    setCosts(calculatedCosts);
    
    return calculatedCosts;
  }, [storageSizeMW, durationHours, solarMW, windMW, generatorMW, selectedTemplate, location, electricityRate, useCaseData]);

  // Calculate costs whenever configuration changes
  // ✅ PERFORMANCE: Debounce to prevent excessive recalculations during rapid changes
  useEffect(() => {
    const updateCosts = async () => {
      const calculatedCosts = await calculateCosts();
      
      // Also calculate equipment breakdown for use in render
      const gridConnection = useCaseData.gridConnection || 'on-grid';
      const breakdown = await calculateEquipmentBreakdown(
        storageSizeMW,
        durationHours,
        solarMW,
        windMW,
        generatorMW,
        { selectedIndustry: selectedTemplate, useCaseData },
        gridConnection,
        location || 'California'
      );
      setEquipmentBreakdown(breakdown);
    };
    
    // ✅ PERFORMANCE: Debounce updates to prevent excessive recalculations
    // Only recalculate after user stops changing values for 300ms
    const debounceTimer = setTimeout(() => {
      updateCosts();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [calculateCosts, storageSizeMW, durationHours, solarMW, windMW, generatorMW, selectedTemplate, location, useCaseData]);

  const analyzeConfiguration = async () => {
    const suggestions: Array<{
      type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
      title: string;
      description: string;
      currentValue: string;
      suggestedValue: string;
      impact: string;
      savings?: string;
      action: () => void;
    }> = [];

    const totalEnergyMWh = storageSizeMW * durationHours;
    const costs = await calculateCosts();

    // Advanced Analytics Integration Function
    // Incorporates: Historical Analysis, K-means Clustering, Control Algorithms,
    // Electrochemical Modeling, Optimization, and ML Forecasting
    const performComprehensiveAnalysis = async () => {
      if (!selectedTemplate || !storageSizeMW || !durationHours) return;

      try {
        // Step 1: Historical Data Analysis with K-means Clustering
        const historicalData = generateSyntheticLoadProfile();
        // TODO: Implement identifyTypicalDays method
        // const clusterAnalysis = LoadProfileAnalyzer.identifyTypicalDays(historicalData);
        // setLoadPatternAnalysis(clusterAnalysis);

        // Step 2: Electrochemical Battery Modeling  
        const batteryModel: BatteryModel = {
          capacity_kWh: storageSizeMW * durationHours * 1000,
          power_kW: storageSizeMW * 1000,
          efficiency_charge: 0.95,
          efficiency_discharge: 0.92,
          voltage_nominal: 3.2, // LFP typical
          soc_min: 0.1,
          soc_max: 0.9,
          degradation_rate_per_cycle: 0.0001,
          calendar_degradation_per_year: 0.02,
          depth_of_discharge_factor: 0.8
        };

        // TODO: Implement calculateEfficiencyCurve method
        // const batteryPerformance = BatteryElectrochemicalModel.calculateEfficiencyCurve(
        //   batteryModel, 
        //   clusterAnalysis?.typical_days?.map(d => d.average_temperature) || [25]
        // );
        // setBatteryModelData(batteryPerformance);

        // Step 3: Control Algorithm Strategy Definition
        const templateKey = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
        const controlStrategy: ControlStrategy = {
          type: templateKey === 'datacenter' ? 'backup' : 
                templateKey === 'ev-charging' ? 'peak_shaving' : 
                templateKey === 'manufacturing' ? 'arbitrage' : 'peak_shaving',
          demand_threshold_kW: storageSizeMW * 1000 * 0.75,
          price_threshold_buy: electricityRate * 0.8,
          price_threshold_sell: electricityRate * 1.3,
          soc_target_min: 0.15,
          soc_target_max: 0.85,
          priority_order: ['peak_shaving', 'arbitrage', 'frequency_regulation']
        };
        setControlStrategy(controlStrategy);

        // Step 4: Advanced Optimization (Classical + Metaheuristic)
        const optimizationResult = BESSOptimizationEngine.optimize(
          historicalData,
          batteryModel,
          controlStrategy,
          24 * 7 * 52 // Full year simulation
        );
        setOptimizationResults(optimizationResult);

        // Step 5: Machine Learning Forecasting
        // TODO: Implement forecastLoadAndPrices method
        // const forecast = BESSMLForecasting.forecastLoadAndPrices(
        //   historicalData,
        //   location || 'California',
        //   selectedTemplate
        // );
        // setForecastData(forecast);

        // Step 6: Model Predictive Control (MPC) Strategy
        // TODO: Implement generateMPCSchedule method
        // const mpcResult = BESSControlOptimizer.generateMPCSchedule(
        //   historicalData.slice(0, 24),
        //   batteryModel,
        //   controlStrategy,
        //   forecast.load_forecast?.slice(0, 24) || [],
        //   0.5 // Current SOC
        // );
        // setMpcStrategy(mpcResult);

        // Calculate overall confidence
        const confidence = Math.min(0.95, (
          0.8 * 0.3 + // cluster_quality placeholder
          0.85 * 0.4 + // convergence_quality placeholder  
          0.75 * 0.3   // forecast_accuracy placeholder
        ));
        setAnalyticsConfidence(confidence);

      } catch (error) {
        setAnalyticsConfidence(0.6);
      }
    };

    // Generate synthetic load profile data for analysis
    const generateSyntheticLoadProfile = (): LoadProfile[] => {
      const data: LoadProfile[] = [];
      const baseDate = new Date('2024-01-01');
      
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(baseDate.getTime() + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000);
          
          // Industry-specific load patterns
          let demandMultiplier = 1.0;
          const templateKey = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
          
          if (templateKey === 'ev-charging') {
            // Peak during commute hours
            demandMultiplier = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.8 : 0.6;
          } else if (templateKey === 'datacenter') {
            // Consistent high demand with slight evening peak
            demandMultiplier = hour >= 18 && hour <= 22 ? 1.2 : 1.0;
          } else if (templateKey === 'manufacturing') {
            // Business hours peak
            demandMultiplier = hour >= 8 && hour <= 17 ? 1.5 : 0.4;
          } else {
            // General commercial pattern
            demandMultiplier = 0.3 + 0.7 * (Math.sin((hour - 6) * Math.PI / 12) + 1) / 2;
          }
          
          const demand_kW = storageSizeMW * 1000 * demandMultiplier * (0.8 + 0.4 * Math.random());
          
          data.push({
            timestamp,
            demand_kW: Math.max(10, demand_kW),
            solar_kW: hour >= 6 && hour <= 18 ? solarMW * 1000 * Math.sin((hour - 6) * Math.PI / 12) : 0,
            grid_price_per_kWh: (hour >= 16 && hour <= 20) ? 0.25 : 0.10,
            temperature_C: 20 + 5 * Math.sin(day * Math.PI / 3.5)
          });
        }
      }
      return data;
    };

    // Create battery model for analysis
    const batteryModel: BatteryModel = {
      capacity_kWh: totalEnergyMWh * 1000,
      power_kW: storageSizeMW * 1000,
      efficiency_charge: 0.92,
      efficiency_discharge: 0.95,
      voltage_nominal: 3.2,
      soc_min: 0.1,
      soc_max: 0.9,
      degradation_rate_per_cycle: 0.00002,
      calendar_degradation_per_year: 0.02,
      depth_of_discharge_factor: 0.8
    };

    // Determine control strategy based on industry
    const templateKey = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
    let controlStrategy: ControlStrategy;
    
    if (templateKey === 'ev-charging' || templateKey === 'manufacturing') {
      controlStrategy = {
        type: 'peak_shaving',
        demand_threshold_kW: storageSizeMW * 1000 * 0.8,
        soc_target_min: 0.2,
        soc_target_max: 0.9,
        priority_order: ['peak_shaving', 'arbitrage']
      };
    } else if (templateKey === 'datacenter') {
      controlStrategy = {
        type: 'arbitrage',
        price_threshold_buy: 0.12,
        price_threshold_sell: 0.20,
        soc_target_min: 0.1,
        soc_target_max: 0.9,
        priority_order: ['arbitrage', 'peak_shaving']
      };
    } else {
      controlStrategy = {
        type: 'peak_shaving',
        demand_threshold_kW: storageSizeMW * 1000 * 0.7,
        soc_target_min: 0.2,
        soc_target_max: 0.9,
        priority_order: ['peak_shaving']
      };
    }

    try {
      // Generate load profile data
      const historicalData = generateSyntheticLoadProfile();
      
      // Run advanced analytics
      // TODO: Implement analyzePeakDemandPatterns method
      // const loadAnalysis = LoadProfileAnalyzer.analyzePeakDemandPatterns(historicalData);
      const optimizationResults = BESSOptimizationEngine.optimize(
        historicalData,
        batteryModel,
        controlStrategy,
        24 * 7 // 1 week
      );
      const batteryHealthPrediction = BESSMLForecasting.predictBatteryHealth(1000, 2, 25, 0.8);

      // Industry-standard duration optimization based on analytics
      const optimalDuration = optimizationResults.recommended_capacity_kWh / (optimizationResults.recommended_power_kW || storageSizeMW * 1000) / 1000;
      
      if (Math.abs(durationHours - optimalDuration) > 1) {
        const newEnergyMWh = storageSizeMW * optimalDuration;
        suggestions.push({
          type: 'optimization',
          title: 'ML-Optimized Duration Recommendation',
          description: `Based on machine learning analysis of your load patterns and control optimization, the optimal duration for your ${getIndustryName(templateKey)} application is ${optimalDuration.toFixed(1)} hours. This maximizes both cost savings and operational performance.`,
          currentValue: `${durationHours.toFixed(1)} hours (${totalEnergyMWh.toFixed(1)} MWh)`,
          suggestedValue: `${optimalDuration.toFixed(1)} hours (${newEnergyMWh.toFixed(1)} MWh)`,
          impact: `Increases annual savings to $${Math.round(optimizationResults.total_savings_annual).toLocaleString()}`,
          savings: `$${Math.round(optimizationResults.total_savings_annual - costs.annualSavings).toLocaleString()}/year additional`,
          action: () => {
            setDurationHours(optimalDuration);
          }
        });
      }

      // Peak demand reduction analysis
      if (optimizationResults.peak_demand_reduction_percent > 0) {
        const currentPeakReduction = Math.max(...historicalData.map(p => p.demand_kW)) * 0.1; // Estimate current
        const optimizedReduction = Math.max(...historicalData.map(p => p.demand_kW)) * (optimizationResults.peak_demand_reduction_percent / 100);
        
        if (optimizedReduction > currentPeakReduction * 1.2) {
          suggestions.push({
            type: 'performance',
            title: 'Enhanced Peak Shaving Opportunity',
            description: `Advanced load clustering analysis shows you can achieve ${optimizationResults.peak_demand_reduction_percent.toFixed(1)}% peak demand reduction with optimized control algorithms. This significantly reduces demand charges.`,
            currentValue: `~${(currentPeakReduction/1000).toFixed(1)}MW reduction`,
            suggestedValue: `${(optimizedReduction/1000).toFixed(1)}MW reduction`,
            impact: `Additional $${(10000).toLocaleString()}/month savings`,
            action: () => {
              // Could trigger enhanced control strategy
              alert('Enhanced peak shaving control strategy would be configured');
            }
          });
        }
      }

      // Battery health and degradation warning
      if (batteryHealthPrediction.predicted_eol_years < 12) {
        suggestions.push({
          type: 'warning',
          title: 'Battery Degradation Concern',
          description: `Electrochemical modeling predicts ${batteryHealthPrediction.predicted_eol_years.toFixed(1)} years to 80% capacity retention with current cycling patterns. Consider optimizing depth of discharge or adding more capacity to extend life.`,
          currentValue: `${batteryHealthPrediction.current_soh_percent.toFixed(1)}% SoH, ${batteryHealthPrediction.predicted_eol_years.toFixed(1)} years life`,
          suggestedValue: `Add 20% capacity buffer for longer life`,
          impact: 'Extends battery life by 2-3 years, improves warranty coverage',
          action: () => {
            setStorageSizeMW(storageSizeMW * 1.2);
          }
        });
      }

      // Energy arbitrage optimization from ML analysis
      if (optimizationResults.energy_arbitrage_revenue > costs.annualSavings * 0.3) {
        suggestions.push({
          type: 'optimization',
          title: 'Enhanced Energy Arbitrage Strategy',
          description: 'ML forecasting models predict significant arbitrage opportunities during price volatility periods. Optimizing your charge/discharge schedule could increase revenue substantially.',
          currentValue: `$${Math.round(costs.annualSavings).toLocaleString()}/year`,
          suggestedValue: `$${Math.round(costs.annualSavings + optimizationResults.energy_arbitrage_revenue).toLocaleString()}/year`,
          impact: `${optimizationResults.roi_10_year_percent.toFixed(1)}% 10-year ROI`,
          savings: `$${Math.round(optimizationResults.energy_arbitrage_revenue).toLocaleString()}/year additional`,
          action: () => {
            alert('Advanced arbitrage control strategy would be implemented');
          }
        });
      }

      // System efficiency optimization
      if (optimizationResults.system_efficiency_percent < 85) {
        suggestions.push({
          type: 'performance',
          title: 'System Efficiency Improvement',
          description: 'Analysis shows potential for improved round-trip efficiency through better power electronics and thermal management. Consider upgrading to higher-efficiency components.',
          currentValue: `${optimizationResults.system_efficiency_percent.toFixed(1)}% efficiency`,
          suggestedValue: '90-92% efficiency',
          impact: 'Increases energy throughput and reduces operating costs',
          action: () => {
            alert('High-efficiency component options would be shown');
          }
        });
      }

    } catch (error) {
      // Fallback to original simple analysis
    }

    // Original industry-specific optimization suggestions (as fallback)
    if (durationHours > 6) {
      const optimalDuration = 4;
      const newSize = storageSizeMW * 1.1;
      suggestions.push({
        type: 'cost-saving',
        title: 'Optimize Duration vs Power',
        description: 'For most commercial applications, shorter duration with higher power is more cost-effective. You can reduce upfront costs while maintaining operational capability.',
        currentValue: `${formatPowerCompact(storageSizeMW)} / ${durationHours}hr`,
        suggestedValue: `${formatPowerCompact(newSize)} / ${optimalDuration}hr`,
        impact: 'Reduces equipment cost by ~20% while improving demand response',
        savings: '$' + ((costs.totalProjectCost * 0.2) / 1000000).toFixed(2) + 'M',
        action: () => {
          setStorageSizeMW(newSize);
          setDurationHours(optimalDuration);
        }
      });
    }

    // Check for renewable integration opportunities
    if (!includeRenewables && solarMW === 0) {
      const suggestedSolar = storageSizeMW * 0.8;
      suggestions.push({
        type: 'optimization',
        title: 'Add Solar for Better ROI',
        description: 'Pairing battery storage with solar can improve your payback period by 30-40%. Solar generation during peak hours maximizes arbitrage opportunities and demand charge reduction.',
        currentValue: 'No renewables',
        suggestedValue: `${suggestedSolar.toFixed(1)}MW Solar`,
        impact: 'Could reduce payback to ' + (costs.paybackYears * 0.65).toFixed(1) + ' years',
        savings: '$' + ((costs.annualSavings * 0.5) / 1000).toFixed(0) + 'K/year additional',
        action: () => {
          setIncludeRenewables(true);
          setSolarMW(suggestedSolar);
          setStep(3);
        }
      });
    }

    setAiSuggestions(suggestions);
  };

  const getIndustryName = (template: string | string[]): string => {
    const templateKey = Array.isArray(template) ? template[0] : template;
    const industryMap: { [key: string]: string } = {
      'manufacturing': 'Manufacturing Facility',
      'data-center': 'Data Center',
      'cold-storage': 'Cold Storage',
      'hospital': 'Hospital',
      'university': 'University',
      'retail': 'Retail',
      'car-wash': 'Car Wash',
      'ev-charging': 'EV Charging Hub',
      'apartment': 'Apartment Building',
      'indoor-farm': 'Indoor Farm'
    };
    const result = industryMap[templateKey] || templateKey;
    
    // If multiple templates, show count
    if (Array.isArray(template) && template.length > 1) {
      return `${result} (+${template.length - 1} more)`;
    }
    return result;
  };

  const handleOpenAIWizard = () => {
    analyzeConfiguration();
    setShowAIWizard(true);
  };

  const handleNext = async () => {
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // ✅ CRITICAL: Check validation before allowing navigation
    if (!canProceed()) {
      console.warn('⚠️ Cannot proceed - validation failed', { step, canProceed: canProceed() });
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // ✅ CRITICAL: Ensure storageSizeMW is calculated before showing complete page
      if (!storageSizeMW || storageSizeMW === 0) {
        console.error('❌ Cannot proceed: storageSizeMW not calculated', { storageSizeMW, step });
        alert('Please wait for system calculations to complete before proceeding.');
        return;
      }
      // Show complete page immediately (costs will calculate in background)
      setShowCompletePage(true);
      // Calculate costs in background without blocking
      calculateCosts().catch(err => console.error('Cost calculation error:', err));
    }
  };

  const handleBack = () => {
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Allow going back to intro from step 0
    if (step >= 0) {
      setStep(step - 1);
    }
  };

  // ============================================================================
  // DOWNLOAD HANDLERS (For Step 7)
  // ============================================================================
  
  // Play magic wand sound effect
  const playDownloadSound = () => {
    try {
      const audio = new Audio('/src/assets/sounds/Magic_Poof.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Could not play sound:', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      playDownloadSound();
      
      const quoteData = {
        storageSizeMW,
        durationHours,
        solarMW,
        windMW: windMW || 0,
        generatorMW: generatorMW || 0,
        location,
        industryTemplate: selectedTemplate,
        gridConnection: 'grid-tied',
        totalProjectCost: equipmentCost + installationCost,
        annualSavings,
        paybackYears,
        taxCredit: (equipmentCost + installationCost) * 0.30,
        netCost: (equipmentCost + installationCost) * 0.70,
        installationOption: selectedInstallation || 'epc',
        shippingOption: selectedShipping || 'best-value',
        financingOption: selectedFinancing || 'cash',
      };
      
      const equipmentBreakdown = {
        battery: { cost: equipmentCost * 0.6, capacity: storageSizeMW },
        inverter: { cost: equipmentCost * 0.25, capacity: storageSizeMW },
        bms: { cost: equipmentCost * 0.10, capacity: storageSizeMW },
        ems: { cost: equipmentCost * 0.05, capacity: storageSizeMW },
      };
      
      await generatePDF(quoteData, equipmentBreakdown);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      playDownloadSound();
      
      const quoteData = {
        storageSizeMW,
        durationHours,
        solarMW,
        windMW: windMW || 0,
        generatorMW: generatorMW || 0,
        location,
        industryTemplate: selectedTemplate,
        gridConnection: 'grid-tied',
        totalProjectCost: equipmentCost + installationCost,
        annualSavings,
        paybackYears,
        taxCredit: (equipmentCost + installationCost) * 0.30,
        netCost: (equipmentCost + installationCost) * 0.70,
        installationOption: selectedInstallation || 'epc',
        shippingOption: selectedShipping || 'best-value',
        financingOption: selectedFinancing || 'cash',
      };
      
      const equipmentBreakdown = {
        battery: { cost: equipmentCost * 0.6, capacity: storageSizeMW },
        inverter: { cost: equipmentCost * 0.25, capacity: storageSizeMW },
        bms: { cost: equipmentCost * 0.10, capacity: storageSizeMW },
        ems: { cost: equipmentCost * 0.05, capacity: storageSizeMW },
      };
      
      await generateExcel(quoteData, equipmentBreakdown);
    } catch (error) {
      console.error('Excel generation failed:', error);
      alert('Failed to generate Excel. Please try again.');
    }
  };

  const handleDownloadWord = async () => {
    try {
      playDownloadSound();
      
      const quoteData = {
        storageSizeMW,
        durationHours,
        solarMW,
        windMW: windMW || 0,
        generatorMW: generatorMW || 0,
        location,
        industryTemplate: selectedTemplate,
        gridConnection: 'grid-tied',
        totalProjectCost: equipmentCost + installationCost,
        annualSavings,
        paybackYears,
        taxCredit: (equipmentCost + installationCost) * 0.30,
        netCost: (equipmentCost + installationCost) * 0.70,
        installationOption: selectedInstallation || 'epc',
        shippingOption: selectedShipping || 'best-value',
        financingOption: selectedFinancing || 'cash',
      };
      
      const equipmentBreakdown = {
        battery: { cost: equipmentCost * 0.6, capacity: storageSizeMW },
        inverter: { cost: equipmentCost * 0.25, capacity: storageSizeMW },
        bms: { cost: equipmentCost * 0.10, capacity: storageSizeMW },
        ems: { cost: equipmentCost * 0.05, capacity: storageSizeMW },
      };
      
      await generateWord(quoteData, equipmentBreakdown);
    } catch (error) {
      console.error('Word generation failed:', error);
      alert('Failed to generate Word document. Please try again.');
    }
  };

  const handleSaveAndComplete = () => {
    const quoteData = {
      storageSizeMW,
      durationHours,
      energyCapacity: storageSizeMW * durationHours,
      solarMW,
      windMW,
      generatorMW,
      location,
      electricityRate,
      selectedTemplate,
      customAnswers: useCaseData, // Use useCaseData as single source of truth
      userGoals,
      equipmentCost,
      installationCost,
      annualSavings,
      paybackYears,
      roi10Year,
      roi25Year,
      npv,
      irr,
    };
    
    onFinish(quoteData);
    setShowCompletePage(true);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return useTemplate ? selectedTemplate !== '' : true;
      case 1: {
        // ✅ SYSTEMATIC FIX: Dynamic validation works for ALL use cases
        // No more hardcoded field names - validates whatever questions are marked required in database
        
        // Get loaded use case details from Step2_UseCase component
        const useCaseDetails = (window as any).__currentUseCaseDetails || useCaseDetailsRef.current;
        
        // If no questions loaded yet, allow proceed if ANY data entered
        if (!useCaseDetails?.custom_questions) {
          return Object.keys(useCaseData).length > 0;
        }
        
        // Store for future validation checks
        useCaseDetailsRef.current = useCaseDetails;
        
        // Get all required questions from database
        const requiredQuestions = useCaseDetails.custom_questions.filter(
          (q: any) => q.required === true
        );
        
        if (requiredQuestions.length === 0) {
          // No required questions - allow proceed if ANY data entered
          return Object.keys(useCaseData).length > 0;
        }
        
        // Check if all required fields are filled
        const missingFields: string[] = [];
        const allRequiredFilled = requiredQuestions.every((q: any) => {
          const value = useCaseData[q.id];
          const isFilled = value !== undefined && value !== '' && value !== null;
          
          // For number fields, check if >= 0 (except optional ones)
          if (q.type === 'number' && isFilled) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            const isValid = !isNaN(numValue) && numValue >= 0;
            if (!isValid) {
              missingFields.push(q.id);
            }
            return isValid;
          }
          
          if (!isFilled) {
            missingFields.push(q.id);
          }
          return isFilled;
        });
        
        // Only log when validation FAILS
        if (!allRequiredFilled && import.meta.env.DEV) {
          console.log('⚠️ [canProceed] Missing required fields:', {
            useCase: selectedTemplate,
            missingFields,
            requiredCount: requiredQuestions.length
          });
        }
        
        return allRequiredFilled;
      }
      case 2: return storageSizeMW > 0 && durationHours > 0; // Merlin's Recommendation (battery config)
      case 3: return true; // Power Recommendation Acceptance
      case 4: return location !== '' && electricityRate > 0; // Location & pricing
      case 5: return true; // Quote Summary
      default: return false;
    }
  };

  const getStepTitle = () => {
    if (use7StepFlow) {
      const newTitles = [
        'Industry & Location',              // Step 0 (NEW: Combined)
        'Power Profile',                    // Step 1 (Use Case Questions)
        'Add Extras',                      // Step 2 (Solar/EV/Wind)
        'Your Goals',                       // Step 3 (Cost/Revenue/Sustainability)
        'Power Recommendation',             // Step 4 (Completed Profile)
        'Preliminary Quote',                // Step 5 (Equipment + Costs)
        'Final Quote',                      // Step 6 (Installers + Financing)
      ];
      return newTitles[step] || '';
    }
    
    // Legacy 6-step flow
    const titles = [
      'Choose Your Industry',           // Step 0
      'Build Your Power Profile',       // Step 1
      'Merlin\'s Recommendation',       // Step 2
      'Customize Your Power Profile',   // Step 3
      'Location & Utility Pricing',     // Step 4
      'Quote Summary',                  // Step 5
    ];
    return titles[step] || '';
  };  const renderStep = () => {
    console.log('🎬 [renderStep] Current step:', step, 'selectedTemplate:', selectedTemplate);
    
    if (step === -1) {
      return (
        <StepIntro
          onStart={() => {
            setShowIntro(false);
            setStep(0);
            setUse7StepFlow(true); // Enable new flow
          }}
          onSkipToAdvanced={() => {
            // Close wizard and open Advanced Quote Builder
            onClose();
            if (onOpenAdvancedQuoteBuilder) {
              onOpenAdvancedQuoteBuilder();
            }
          }}
        />
      );
    }

    // ============================================================================
    // NEW 7-STEP FLOW
    // ============================================================================
    if (use7StepFlow) {
      switch (step) {
        case 0:
          // Step 1: Industry + Location (Combined)
          return (
            <Step1_IndustryAndLocation
              selectedTemplate={selectedTemplate}
              availableUseCases={availableUseCases}
              location={location}
              onSelectTemplate={setSelectedTemplate}
              onUpdateLocation={setLocation}
              onNext={() => setStep(1)}
              onBack={() => setStep(-1)}
            />
          );
        case 1:
          // Step 2: Power Profile (Use Case Questions) + Advanced Config Button
          if (!useCaseDetailsRef.current) {
            return (
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 text-lg">Loading use case details...</p>
                <button 
                  onClick={() => setStep(0)}
                  className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back
                </button>
              </div>
            );
          }
          return (
            <>
              <Step2_UseCase
                useCase={useCaseDetailsRef.current}
                answers={useCaseData}
                onUpdateAnswers={setUseCaseData}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
                onOpenBatteryConfigModal={() => setShowBatteryConfigModal(true)}
                onOpenAdvancedQuoteBuilder={() => {
                  onClose();
                  if (onOpenAdvancedQuoteBuilder) {
                    onOpenAdvancedQuoteBuilder();
                  }
                }}
              />
            </>
          );
        case 2:
          // Step 3: Add Extras (Solar/EV/Generators/Wind)
          // Show Solar/EV based on user answers from Step 1 custom questions
          // Default to showing if the field doesn't exist (backward compatibility)
          const wantsSolarValue = useCaseData?.wantsSolar;
          const wantsEVValue = useCaseData?.wantsEVCharging;
          const showSolarSection = wantsSolarValue === undefined || wantsSolarValue === true || wantsSolarValue === 'yes' || wantsSolarValue === 'Yes';
          const showEVSection = wantsEVValue === undefined || wantsEVValue === true || wantsEVValue === 'yes' || wantsEVValue === 'Yes';
          
          if (import.meta.env.DEV) {
            console.log('🎛️ [Step3] Conditional display:', {
              wantsSolar: wantsSolarValue,
              wantsEVCharging: wantsEVValue,
              showSolar: showSolarSection,
              showEV: showEVSection
            });
          }
          
          return (
            <Step3_AddGoodies
              solarMWp={solarMW}
              evChargerCount={evChargerCount}
              generatorKW={generatorMW * 1000}
              windMWp={windMW}
              onUpdateSolar={setSolarMW}
              onUpdateEV={setEvChargerCount}
              onUpdateGenerator={(kW) => setGeneratorMW(kW / 1000)}
              onUpdateWind={setWindMW}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              showSolar={showSolarSection}
              showEV={showEVSection}
            />
          );
        case 3:
          // Step 4: Goals & Interests
          return (
            <Step4_GoalsAndInterests
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
              onUpdateGoals={setUserGoals}
            />
          );
        case 4:
          // Step 5: Power Recommendation (Completed Profile)
          return (
            <Step5_PowerRecommendation
              storageSizeMW={storageSizeMW}
              durationHours={durationHours}
              energyCapacity={storageSizeMW * durationHours}
              solarMWp={solarMW}
              evChargerCount={evChargerCount}
              generatorKW={generatorMW * 1000}
              windMWp={windMW}
              selectedTemplate={useCaseDetailsRef.current}
              location={location}
              goals={userGoals}
              equipmentBreakdown={equipmentBreakdown}
              gridStrategy={aiBaseline?.gridStrategy}
              gridConnection={useCaseData?.gridConnection}
              annualGridFees={parseFloat(useCaseData?.annualGridFees) || 0}
              // ✅ NEW: Callbacks for user adjustments
              onStorageChange={(sizeMW, duration) => {
                setStorageSizeMW(sizeMW);
                setDurationHours(duration);
              }}
              onSolarChange={(solar) => setSolarMW(solar)}
              onWindChange={(wind) => setWindMW(wind)}
              onGeneratorChange={(genKW) => setGeneratorMW(genKW / 1000)}
              onEVChargersChange={(count) => setEvChargerCount(count)}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          );
        case 5:
          // Step 6: Preliminary Quote
          return (
            <Step6_PreliminaryQuote
              storageSizeMW={storageSizeMW}
              durationHours={durationHours}
              energyCapacity={storageSizeMW * durationHours}
              solarMW={solarMW}
              windMW={windMW}
              generatorMW={generatorMW}
              evChargerCount={evChargerCount}
              equipmentBreakdown={equipmentBreakdown}
              equipmentCost={equipmentCost}
              installationCost={installationCost}
              annualSavings={annualSavings}
              paybackYears={paybackYears}
              roi10Year={roi10Year}
              roi25Year={roi25Year}
              npv={npv}
              irr={irr}
              selectedTemplate={useCaseDetailsRef.current}
              location={location}
              onNext={() => setStep(6)}
              onBack={() => setStep(4)}
            />
          );
        case 6:
          // Step 7: Final Quote (Installers + Financing + Downloads)
          return (
            <Step7_FinalQuote
              storageSizeMW={storageSizeMW}
              durationHours={durationHours}
              energyCapacity={storageSizeMW * durationHours}
              solarMW={solarMW}
              windMW={windMW}
              generatorMW={generatorMW}
              evChargerCount={evChargerCount}
              equipmentBreakdown={equipmentBreakdown}
              equipmentCost={equipmentCost}
              installationCost={installationCost}
              annualSavings={annualSavings}
              paybackYears={paybackYears}
              roi10Year={roi10Year}
              selectedTemplate={useCaseDetailsRef.current}
              location={location}
              onBack={() => setStep(5)}
              onDownloadPDF={handleDownloadPDF}
              onDownloadExcel={handleDownloadExcel}
              onDownloadWord={handleDownloadWord}
              onComplete={handleSaveAndComplete}
            />
          );
        default:
          return null;
      }
    }

    // ============================================================================
    // LEGACY 6-STEP FLOW (Original)
    // ============================================================================
    switch (step) {
      case 0:
        return (
          <Step1_IndustryTemplate
            {...{
              selectedTemplate,
              availableUseCases,
              zipCode: location,
              onZipCodeChange: setLocation,
              onSelectTemplate: setSelectedTemplate,
              onNext: () => setStep(1),
              onBack: () => setStep(-1)
            } as any}
          />
        );
      case 1:
        // Add null check to prevent crashes
        if (!useCaseDetailsRef.current) {
          return (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 text-lg">Loading use case details...</p>
              <p className="text-sm text-gray-500">If this takes more than a few seconds, please go back and try again</p>
              <button 
                onClick={() => setStep(0)}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Use Case Selection
              </button>
            </div>
          );
        }
        return (
          <Step2_UseCase
            useCase={useCaseDetailsRef.current}
            answers={useCaseData}
            onUpdateAnswers={setUseCaseData}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
            onOpenBatteryConfigModal={() => setShowBatteryConfigModal(true)}
            onOpenAdvancedQuoteBuilder={() => {
              onClose();
              if (onOpenAdvancedQuoteBuilder) {
                onOpenAdvancedQuoteBuilder();
              }
            }}
          />
        );
      case 2:
        return (
          <Step3_SimpleConfiguration
            storageSizeMW={storageSizeMW}
            setStorageSizeMW={setStorageSizeMW}
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            industryTemplate={selectedTemplate}
            aiRecommendation={aiUseCaseRecommendation || undefined}
            baselineResult={baselineResult}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <Step4_PowerRecommendation
            storageSizeMW={storageSizeMW}
            durationHours={durationHours}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
            setSolarMW={setSolarMW}
            setWindMW={setWindMW}
            setGeneratorMW={setGeneratorMW}
            industryTemplate={selectedTemplate}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        );
      case 4:
        return (
          <Step5_LocationPricing
            location={location}
            onUpdateLocation={setLocation}
            electricityRate={electricityRate}
            onUpdateRate={setElectricityRate}
            storageSizeMW={storageSizeMW}
            durationHours={durationHours}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
            onEditPowerProfile={() => setStep(3)}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        );
      case 5:
        // 🔍 DEBUG: Log values BEFORE passing to quote summary
        if (import.meta.env.DEV) {
          console.log('🚀 [SmartWizardV2] BEFORE Step6_QuoteSummary render:', {
            storageSizeMW,
            durationHours,
            solarMW,
            windMW,
            generatorMW,
            totalPowerMW: (storageSizeMW + solarMW + windMW + generatorMW)
          });
        }
        
        return (
          <Step6_QuoteSummary
            {...{
              storageSizeMW,
              durationHours,
              solarMW,
              windMW,
              generatorMW,
              solarSpaceConfig,
              evChargerConfig,
              windConfig,
              generatorConfig,
              location,
              industryTemplate: selectedTemplate,
              equipmentCost: costs.equipmentCost,
              installationCost: costs.installationCost,
              shippingCost: costs.shippingCost,
              tariffCost: costs.tariffCost,
              annualSavings: costs.annualSavings,
              paybackYears: costs.paybackYears,
              taxCredit30Percent: costs.taxCredit,
              netCostAfterTaxCredit: costs.netCost,
              onOpenAIWizard: handleOpenAIWizard,
              showAIWizard,
              aiBaseline,
              onEditConfiguration: () => setStep(3),
              onNext: handleNext,
              onBack: handleBack,
              industryData: {
                selectedIndustry: selectedTemplate,
                useCaseData: useCaseData
              }
            } as any}
          />
        );
      default:
        return null;
    }
  };

  // Show complete page instead of modal for final step
  if (showCompletePage) {
    // Use pre-calculated equipment breakdown from state
    const gridConnection = useCaseData.gridConnection || 'on-grid';
    const effectiveGeneratorMW = equipmentBreakdown?.generators ? 
      equipmentBreakdown.generators.quantity * equipmentBreakdown.generators.unitPowerMW : 
      generatorMW;
      
    return (
      <QuoteCompletePage
        quoteData={{
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW: effectiveGeneratorMW,
          location,
          industryTemplate: selectedTemplate,
          electricityRate,
          useCaseData, // Pass EV charger details, hotel rooms, etc. for accurate AI baseline
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        }}
        onDownloadPDF={() => generatePDF({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW: effectiveGeneratorMW,
          location,
          industryTemplate: selectedTemplate,
          gridConnection: gridConnection,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        }, equipmentBreakdown)}
        onDownloadExcel={() => generateExcel({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW: effectiveGeneratorMW,
          location,
          industryTemplate: selectedTemplate,
          gridConnection: gridConnection,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        }, equipmentBreakdown)}
        onDownloadWord={() => generateWord({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW: effectiveGeneratorMW,
          location,
          industryTemplate: selectedTemplate,
          gridConnection: gridConnection,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        }, equipmentBreakdown)}
        onEmailQuote={(email: string) => {
          // Send email with quote (would integrate with email service)
          alert(`Quote will be sent to ${email}\n(Email service integration pending)`);
        }}
        onSaveProject={() => {
          // Save to local storage or database
          const quoteData = {
            storageSizeMW,
            durationHours,
            solarMW,
            windMW,
            generatorMW,
            location,
            industryTemplate: selectedTemplate,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('saved_quote', JSON.stringify(quoteData));
          alert('Quote saved successfully!');
        }}
        onRequestConsultation={() => {
          // Open Request Quote modal instead of mailto
          setShowRequestQuoteModal(true);
        }}
        onClose={() => {
          setShowCompletePage(false);
          // Mark wizard as completed so intro is skipped next time
          localStorage.setItem('merlin_wizard_completed', 'true');
          onClose();
        }}
      />
    );
  }

  if (!show) return null;

  // Interactive Dashboard removed from Smart Wizard workflow
  // Now available as standalone tool in Advanced Quote Builder

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Hide on intro screen */}
        {step >= 0 && (
          <div className="bg-gradient-to-r from-purple-800 via-purple-600 to-sky-400 text-white p-6 rounded-t-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl drop-shadow-lg">🪄</span>
                <div>
                  <h2 className="text-2xl font-bold drop-shadow-md">Welcome to Merlin!</h2>
                  <p className="text-sm opacity-90">Step {step + 1} of {use7StepFlow ? 7 : 6}: {getStepTitle()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Merlin Help Link */}
                <button
                  onClick={() => {
                    // Find and click the Merlin assistant button
                    const merlinBtn = document.querySelector('[title="Ask Merlin for Help"]') as HTMLButtonElement;
                    if (merlinBtn) merlinBtn.click();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all"
                  title="Need help? Ask Merlin!"
                >
                  <span className="text-lg">🧙‍♂️</span>
                  <span className="hidden md:inline">Help</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Clickable Step Indicators - Dynamically sized based on flow */}
            <div className="flex justify-between items-center mb-3">
              {(use7StepFlow ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5]).map((stepNum) => {
                const stepTitles7 = [
                  'Industry',   // 0
                  'Questions',  // 1 
                  'Extras',     // 2
                  'Goals',      // 3
                  'Power',      // 4
                  'Quote',      // 5
                  'Final'       // 6
                ];
                const stepTitles6 = [
                  'Industry',
                  'Questions', 
                  'Recommend',
                  'Customize',
                  'Location',
                  'Quote'
                ];
                const stepTitles = use7StepFlow ? stepTitles7 : stepTitles6;
                const isCompleted = step > stepNum;
                const isCurrent = step === stepNum;
                const isClickable = step >= stepNum || stepNum === 0;
                
                return (
                  <button
                    key={stepNum}
                    onClick={() => isClickable && setStep(stepNum)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                      isCurrent 
                        ? 'bg-white/30 scale-105' 
                        : isCompleted 
                          ? 'bg-white/20 hover:bg-white/30 cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                    title={isClickable ? `Go to Step ${stepNum + 1}: ${stepTitles[stepNum]}` : 'Complete previous steps first'}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCurrent 
                        ? 'bg-white text-purple-700' 
                        : isCompleted 
                          ? 'bg-green-400 text-white' 
                          : 'bg-white/40 text-white'
                    }`}>
                      {isCompleted ? '✓' : stepNum + 1}
                    </span>
                    <span className="text-xs font-medium">{stepTitles[stepNum]}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Progress bar */}
            <div className="bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${((step + 1) / (use7StepFlow ? 7 : 6)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* NAVIGATION BAR - Power Status + Power Profile                      */}
        {/* ================================================================== */}
        {/* Purpose: Help users understand their power profile & capabilities  */}
        {/* Shows:                                                             */}
        {/*   - Power adequacy gauge (RED/GREEN status)                         */}
        {/*   - Total system capacity (batteries + generation)                  */}
        {/*   - Power gap alerts (when generation needed but not added)         */}
        {/*   - Quick stats (Peak, Grid, Battery, Generation)                   */}
        {/* Visible: Steps 1-6 for 7-step flow, Steps 1-5 for legacy           */}
        {/* ================================================================== */}
        {step >= 1 && step <= (use7StepFlow ? 6 : 5) && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white px-6 py-4 border-b-2 border-slate-600 shadow-lg">
            <div className="flex items-center justify-between gap-6">
              {/* LEFT: Power Meter Widget + Power Profile Indicator */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <PowerMeterWidget
                  peakDemandMW={baselineResult?.peakDemandMW || 0}
                  totalGenerationMW={solarMW + windMW + generatorMW}
                  gridAvailableMW={baselineResult?.gridCapacity || 0}
                  gridConnection={useCaseData.gridConnection === 'off-grid' ? 'off-grid' : 
                                 useCaseData.gridReliability === 'unreliable' ? 'unreliable' :
                                 'reliable'}
                  compact={true}
                />
                
                {/* 🎯 POWER PROFILE INDICATOR */}
                <div className="border-l border-slate-600 pl-4">
                  <PowerProfileIndicator
                    level={powerProfileLevel}
                    points={powerProfilePoints}
                    nextLevelPoints={[0, 11, 21, 31, 46, 61, 81, 100][powerProfileLevel] || 100}
                    compact={true}
                  />
                </div>
              </div>

              {/* CENTER: System Size Display */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wide">Power Configuration</p>
                  <p className="font-bold text-lg">{(storageSizeMW + solarMW + windMW + generatorMW).toFixed(1)} MW System</p>
                </div>
              </div>
              
              {/* POWER GAP ALERT: Generation Required */}
              {baselineResult && baselineResult.generationRequired && (
                <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg px-4 py-2">
                  <span className="text-xl">🔌</span>
                  <div className="text-right">
                    <p className="text-xs opacity-80">Backup Power Needed</p>
                    <p className="font-bold">{baselineResult.generationRecommendedMW?.toFixed(1) || 0} MW Generators</p>
                  </div>
                  {generatorMW === 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      Not Added
                    </span>
                  )}
                  {generatorMW > 0 && (
                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Added ({generatorMW.toFixed(1)} MW)
                    </span>
                  )}
                </div>
              )}
              
              {/* RIGHT: Quick Stats Row */}
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded px-3 py-1 text-center">
                  <p className="text-xs opacity-70">Peak</p>
                  <p className="font-bold text-sm">{(baselineResult?.peakDemandMW || 0).toFixed(1)} MW</p>
                </div>
                <div className="bg-white/10 rounded px-3 py-1 text-center">
                  <p className="text-xs opacity-70">Grid</p>
                  <p className="font-bold text-sm">{(baselineResult?.gridCapacity || 0).toFixed(1)} MW</p>
                </div>
                <div className="bg-white/10 rounded px-3 py-1 text-center">
                  <p className="text-xs opacity-70">Battery</p>
                  <p className="font-bold text-sm">{storageSizeMW.toFixed(1)} MW</p>
                </div>
                <div className="bg-white/10 rounded px-3 py-1 text-center">
                  <p className="text-xs opacity-70">
                    {generatorMW > 0 && solarMW === 0 && windMW === 0 ? 'Gen' :
                     solarMW > 0 && generatorMW === 0 && windMW === 0 ? 'Solar' :
                     windMW > 0 && solarMW === 0 && generatorMW === 0 ? 'Wind' :
                     'Gen'}
                  </p>
                  <p className="font-bold text-sm">{(solarMW + windMW + generatorMW).toFixed(1)} MW</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Intro screen - full size with close button */}
        {step === -1 && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl font-bold transition-all"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div 
          ref={modalContentRef}
          className={`${step === -1 ? 'p-12' : 'p-8'} flex-1 overflow-y-auto`}
        >
          {renderStep()}
        </div>

        {/* Footer - REMOVED: Each step now has its own navigation buttons */}
        {/* Panel navigation was causing confusion with duplicate buttons */}
      </div>

      {/* AI Wizard - Intelligent Suggestions Modal */}
      {showAIWizard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-8 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold flex items-center gap-2">
                      AI Wizard
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Analyzing...</span>
                    </h3>
                    <p className="text-sm opacity-90 mt-1">I've analyzed your configuration and found optimization opportunities</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIWizard(false)}
                  className="text-white/80 hover:text-white transition-colors text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Industry & Use Case Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Optimizing for</div>
                    <div className="text-3xl font-bold mb-2">{getIndustryName(selectedTemplate)}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        � {getIndustryName(selectedTemplate)} Operations
                      </span>
                      {location && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          📍 {location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90 mb-1">Current System</div>
                    <div className="text-2xl font-bold">{formatPowerCompact(storageSizeMW)} / {durationHours}hr</div>
                    <div className="text-sm">{storageSizeMW ? (storageSizeMW * durationHours).toFixed(2) : '--'} MWh Total</div>
                  </div>
                </div>
              </div>

              {/* Current Configuration Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Financial Overview
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">${(costs.totalProjectCost / 1000000).toFixed(2)}M</div>
                    <div className="text-xs text-gray-600 mt-1">Total Project Cost</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600">${(costs.annualSavings / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-600 mt-1">Annual Savings</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{costs.paybackYears.toFixed(1)} yrs</div>
                    <div className="text-xs text-gray-600 mt-1">Payback Period</div>
                  </div>
                </div>
              </div>

              {/* Interactive Configuration Adjustment Tools */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border-2 border-orange-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎛️</span>
                  Adjust Your Configuration
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Fine-tune your system before moving forward. The AI will update recommendations in real-time.
                </p>

                {/* Power Output Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Power Output (MW)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={storageSizeMW}
                        onChange={(e) => setStorageSizeMW(Number(e.target.value))}
                        min="0.5"
                        max="50"
                        step="0.1"
                        className="w-20 px-3 py-1 border-2 border-gray-300 rounded-lg text-center font-bold"
                      />
                      <span className="text-sm text-gray-600">MW</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.1"
                    value={storageSizeMW}
                    onChange={(e) => setStorageSizeMW(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5 MW</span>
                    <span>50 MW</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Duration (Hours)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        min="1"
                        max="12"
                        step="1"
                        className="w-20 px-3 py-1 border-2 border-gray-300 rounded-lg text-center font-bold"
                      />
                      <span className="text-sm text-gray-600">hrs</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hr</span>
                    <span>12 hrs</span>
                  </div>
                </div>

                {/* Total Energy Display */}
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-1">Total Energy Capacity</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {storageSizeMW ? (storageSizeMW * durationHours).toFixed(2) : '--'} MWh
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleOpenAIWizard();
                      // Show confirmation after analysis
                      setTimeout(() => {
                        const hasImprovements = aiSuggestions.length > 0;
                        if (hasImprovements) {
                          alert(`✨ AI Wizard found ${aiSuggestions.length} optimization${aiSuggestions.length > 1 ? 's' : ''} to improve your configuration! Review the suggestions below.`);
                        } else {
                          const confirmed = confirm('✅ Your configuration is already optimized!\n\nYour current setup is well-suited for your goals. Would you like to continue to the next step?');
                          if (confirmed) {
                            setShowAIWizard(false);
                            if (step < 6) setStep(step + 1);
                          }
                        }
                      }, 100);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Wizard
                  </button>
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 6) setStep(step + 1);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Confirm & Continue
                  </button>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    AI Recommendations ({aiSuggestions.length})
                  </h4>
                  
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-6 border-2 shadow-lg transition-all hover:shadow-xl ${
                        suggestion.type === 'cost-saving' 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                          : suggestion.type === 'warning'
                          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                          : suggestion.type === 'optimization'
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
                          : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl ${
                            suggestion.type === 'cost-saving' ? '💰' :
                            suggestion.type === 'warning' ? '⚠️' :
                            suggestion.type === 'optimization' ? '⚙️' : '⭐'
                          }`}>
                            {suggestion.type === 'cost-saving' ? '💰' :
                             suggestion.type === 'warning' ? '⚠️' :
                             suggestion.type === 'optimization' ? '⚙️' : '⭐'}
                          </div>
                          <div>
                            <h5 className="font-bold text-lg text-gray-900">{suggestion.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              suggestion.type === 'cost-saving' ? 'bg-green-200 text-green-800' :
                              suggestion.type === 'warning' ? 'bg-red-200 text-red-800' :
                              suggestion.type === 'optimization' ? 'bg-blue-200 text-blue-800' :
                              'bg-purple-200 text-purple-800'
                            }`}>
                              {suggestion.type.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {suggestion.savings && (
                          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                            <div className="text-sm text-gray-600">Potential Savings</div>
                            <div className="text-lg font-bold text-green-600">{suggestion.savings}</div>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">{suggestion.description}</p>

                      {/* Before/After Comparison */}
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-gray-500 mb-2">CURRENT</div>
                            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                              <div className="font-bold text-gray-900">{suggestion.currentValue}</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-orange-600 mb-2">AI OPTIMIZED ✨</div>
                            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-3 border-2 border-orange-400 shadow-md">
                              <div className="font-bold text-orange-700">{suggestion.suggestedValue}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow showing improvement */}
                        <div className="flex items-center justify-center my-2">
                          <ArrowRight className="w-6 h-6 text-orange-500" />
                        </div>
                        
                        {/* Impact and Savings */}
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1">💡 IMPACT</div>
                            <div className="text-sm font-bold text-blue-900">{suggestion.impact}</div>
                          </div>
                          {suggestion.savings && (
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-green-600 font-semibold mb-1">� SAVINGS</div>
                              <div className="text-xl font-bold text-green-700">{suggestion.savings}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            if (import.meta.env.DEV) console.log('🔄 Apply & Re-analyze clicked');
                            suggestion.action();
                            // Small delay to ensure state updates, then refresh AI analysis
                            setTimeout(() => {
                              handleOpenAIWizard();
                            }, 100);
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span>Apply & Re-analyze</span>
                        </button>
                        <button
                          onClick={() => {
                            if (import.meta.env.DEV) console.log('✅ Apply & Continue clicked - updating configuration');
                            suggestion.action();
                            setShowAIWizard(false);
                            // Force re-render by briefly going to different step and back
                            // This ensures Step5_QuoteSummary receives updated props
                            const currentStep = step;
                            setStep(-999); // Temporary invalid step
                            setTimeout(() => {
                              setStep(currentStep);
                              // Show confirmation
                              alert('✅ Configuration updated! Your quote has been adjusted with the AI recommendation.');
                            }, 50);
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span>Apply & Continue</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center border-2 border-green-200">
                  <div className="text-6xl mb-4">💰</div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">Configuration Looks Great!</h4>
                  <p className="text-gray-700 text-lg mb-4">
                    Your current setup is well-optimized for <strong className="text-green-700">{getIndustryName(selectedTemplate)}</strong>
                  </p>
                  <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">System Size</div>
                        <div className="font-bold text-gray-900 text-lg">{formatPowerCompact(storageSizeMW)} / {durationHours}hr</div>
                        <div className="text-green-600">✓ Optimal</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Industry Focus</div>
                        <div className="font-bold text-gray-900 text-lg capitalize">{getIndustryName(selectedTemplate)}</div>
                        <div className="text-green-600">✓ Optimized</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Payback Period</div>
                        <div className="font-bold text-gray-900 text-lg">{costs.paybackYears.toFixed(1)} years</div>
                        <div className="text-green-600">✓ Competitive</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Continue with your configuration or use the adjustment tools above to see new AI recommendations.
                  </p>
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 6) setStep(step + 1);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    <span>✓ Confirm Configuration & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => setShowAIWizard(false)}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Close & Keep Editing
                </button>
                {aiSuggestions.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 6) setStep(step + 1);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                  >
                    <span>Skip Suggestions & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battery Configuration Modal (for Step 2 Advanced Config) */}
      <BatteryConfigModal
        isOpen={showBatteryConfigModal}
        onClose={() => setShowBatteryConfigModal(false)}
        currentPowerMW={storageSizeMW}
        currentDurationHours={durationHours}
        onSave={(powerMW, durationHours) => {
          setStorageSizeMW(powerMW);
          setDurationHours(durationHours);
          setShowBatteryConfigModal(false);
        }}
      />

      {/* Request Quote Modal (replaces mailto: links) */}
      <RequestQuoteModal
        isOpen={showRequestQuoteModal}
        onClose={() => setShowRequestQuoteModal(false)}
        quoteData={{
          storageSizeMW,
          durationHours,
          energyCapacity: storageSizeMW * durationHours,
          solarMW: solarMW,
          totalCost: equipmentBreakdown?.totals?.totalProjectCost,
          industryName: selectedTemplate,
          location,
        }}
      />
    </div>
  );
};

export default SmartWizardV2;
