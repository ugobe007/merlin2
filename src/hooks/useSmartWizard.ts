/**
 * useSmartWizard Hook
 * ===================
 * Clean, fully-typed wizard state management
 * Built from scratch 2025-11-24
 * 
 * PRINCIPLES:
 * - Single source of truth
 * - All actions defined here
 * - No missing functions
 * - Type-safe by default
 */

import { useState, useCallback, useReducer, useMemo, useEffect } from 'react';
import type {
  SmartWizardState,
  WizardActions,
  UseSmartWizardReturn,
  QuoteConfiguration,
  BessSizing,
  UseCaseAnswers,
  EVConfiguration
} from '@/types/wizard.types';

// Import services
import { calculateDatabaseBaseline } from '@/services/baselineService';
import { buildQuote } from '@/application/workflows/buildQuote';
import { useCaseService } from '@/services/useCaseService';
import { calculatePowerGap as calculateGap } from '@/services/powerGapAnalysis';

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_CONFIG: QuoteConfiguration = {
  useCaseSlug: null,
  useCaseAnswers: {},
  sizing: {
    storageSizeMW: 0.1,
    durationHours: 4,
    solarMW: 0,
    solarMWp: 0,
    windMW: 0,
    generatorMW: 0
  },
  location: 'California',
  electricityRate: 0.15,
  wantsSolar: false,
  solarSpaceAcres: 0,
  wantsEV: false,
  evConfig: {
    enabled: false,
    chargers: 0,
    kwPerCharger: 50,
    totalMW: 0
  },
  gridConnection: 'reliable'
};

const INITIAL_STATE: SmartWizardState = {
  config: INITIAL_CONFIG,
  ui: {
    currentStep: -1,
    showIntro: true,
    showCompletePage: false,
    isInitialized: false,
    isLoading: false,
    error: null
  },
  currentQuote: null,
  powerGapAnalysis: null,
  availableUseCases: [],
  useCaseDetails: null
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSmartWizard(): UseSmartWizardReturn {
  const [state, setState] = useState<SmartWizardState>(INITIAL_STATE);

  // =========================================================================
  // AUTOMATIC BASELINE CALCULATION (THE MAGIC FROM V2!)
  // =========================================================================
  // When user answers questions, automatically calculate baseline
  // This is what made V2 work smoothly - it's REACTIVE, not manual
  useEffect(() => {
    const autoCalculateBaseline = async () => {
      const { useCaseSlug, useCaseAnswers } = state.config;
      const { useCaseDetails } = state;
      
      // Only calculate if we have a use case selected AND questions answered
      if (!useCaseSlug || !useCaseDetails) return;
      
      // Check if we have any answers (user has started answering questions)
      const hasAnswers = Object.keys(useCaseAnswers).length > 0;
      if (!hasAnswers) return;
      
      // Check if all required questions are answered
      const requiredQuestions = useCaseDetails.custom_questions?.filter((q: any) => q.required) || [];
      const allRequiredAnswered = requiredQuestions.every((q: any) => {
        const answer = useCaseAnswers[q.question_key];
        return answer !== undefined && answer !== null && answer !== '';
      });
      
      if (!allRequiredAnswered) return;
      
      // All conditions met - calculate baseline automatically!
      try {
        const baseline = await calculateDatabaseBaseline(
          useCaseSlug,
          1, // scale
          useCaseAnswers
        );
        
        setState(prev => ({
          ...prev,
          config: {
            ...prev.config,
            sizing: {
              ...prev.config.sizing,
              storageSizeMW: baseline.powerMW,
              durationHours: baseline.durationHrs,
              solarMW: baseline.solarMW || 0,
              solarMWp: baseline.solarMW || 0
            }
          }
        }));
      } catch (error) {
        console.error('[useSmartWizard] Auto-calculate baseline failed:', error);
      }
    };
    
    autoCalculateBaseline();
  }, [state.config.useCaseSlug, state.config.useCaseAnswers, state.useCaseDetails]);

  // =========================================================================
  // NAVIGATION ACTIONS
  // =========================================================================

  const goToStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, currentStep: step }
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, currentStep: prev.ui.currentStep + 1 }
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, currentStep: Math.max(-1, prev.ui.currentStep - 1) }
    }));
  }, []);

  const skipIntro = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        showIntro: false,
        currentStep: 0
      }
    }));
  }, []);

  // =========================================================================
  // USE CASE ACTIONS
  // =========================================================================

  const selectUseCase = useCallback(async (slug: string) => {
    console.log('[useSmartWizard] 🎯 Selecting use case:', slug);
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        useCaseSlug: slug
      },
      ui: { ...prev.ui, isLoading: true }
    }));

    try {
      console.log('[useSmartWizard] 📡 Fetching use case details from database...');
      const details = await useCaseService.getUseCaseBySlug(slug);
      console.log('[useSmartWizard] ✅ Use case details loaded:', details?.name);
      
      if (!details) {
        throw new Error(`Use case "${slug}" not found in database`);
      }
      
      setState(prev => ({
        ...prev,
        useCaseDetails: details,
        ui: { ...prev.ui, isLoading: false }
      }));
      console.log('[useSmartWizard] ✅ Use case details set in state:', {
        slug: details.slug,
        name: details.name,
        hasQuestions: !!details.custom_questions
      });
      
      return true; // Success
    } catch (error) {
      console.error('[useSmartWizard] ❌ Failed to load use case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          isLoading: false,
          error: `Failed to load use case details: ${errorMessage}`
        }
      }));
      return false; // Failure
    }
  }, []);

  const updateAnswers = useCallback((answers: Partial<UseCaseAnswers>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        useCaseAnswers: {
          ...prev.config.useCaseAnswers,
          ...answers
        }
      }
    }));
  }, []);

  const calculateBaseline = useCallback(async () => {
    if (!state.config.useCaseSlug || !state.useCaseDetails) {
      console.warn('[useSmartWizard] Cannot calculate baseline: missing use case');
      return;
    }

    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, isLoading: true }
    }));

    try {
      const baseline = await calculateDatabaseBaseline(
        state.config.useCaseSlug,
        1, // scale
        state.config.useCaseAnswers
      );

      setState(prev => ({
        ...prev,
        config: {
          ...prev.config,
          sizing: {
            ...prev.config.sizing,
            storageSizeMW: baseline.powerMW,
            durationHours: baseline.durationHrs,
            solarMW: baseline.solarMW
          }
        },
        ui: { ...prev.ui, isLoading: false }
      }));
    } catch (error) {
      console.error('[useSmartWizard] Baseline calculation failed:', error);
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          isLoading: false,
          error: 'Failed to calculate baseline'
        }
      }));
    }
  }, [state.config.useCaseSlug, state.useCaseDetails, state.config.useCaseAnswers]);

  const calculatePowerGap = useCallback(async () => {
    if (!state.config.useCaseSlug) {
      console.warn('[useSmartWizard] Cannot calculate power gap: no use case selected');
      return;
    }

    console.log('[useSmartWizard] 🔍 Calculating power gap analysis...');
    console.log('[useSmartWizard] Current state:', {
      useCaseSlug: state.config.useCaseSlug,
      answers: state.config.useCaseAnswers,
      useCaseDetails: state.useCaseDetails
    });

    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, isLoading: true }
    }));

    try {
      // First calculate baseline if not already done
      console.log('[useSmartWizard] Calculating baseline first...');
      const baseline = await calculateDatabaseBaseline(
        state.config.useCaseSlug,
        1,
        state.config.useCaseAnswers
      );
      
      console.log('[useSmartWizard] Baseline result:', baseline);

      // Now calculate the power gap
      console.log('[useSmartWizard] Now calculating power gap...');
      const gapAnalysis = await calculateGap(
        state.config.useCaseSlug,
        state.config.useCaseAnswers,
        baseline
      );

      console.log('[useSmartWizard] ✅ Power gap analysis complete:', {
        recommendation: gapAnalysis.recommendation,
        powerGap: gapAnalysis.powerGapKW,
        confidence: gapAnalysis.confidenceLevel
      });

      setState(prev => ({
        ...prev,
        powerGapAnalysis: gapAnalysis,
        config: {
          ...prev.config,
          sizing: {
            ...prev.config.sizing,
            storageSizeMW: baseline.powerMW,
            durationHours: baseline.durationHrs,
            solarMW: baseline.solarMW
          }
        },
        ui: { ...prev.ui, isLoading: false }
      }));
    } catch (error) {
      console.error('[useSmartWizard] ❌ Power gap calculation failed:', error);
      console.error('[useSmartWizard] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          isLoading: false,
          error: `Failed to calculate power gap analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
      // Re-throw so the wizard doesn't proceed
      throw error;
    }
  }, [state.config.useCaseSlug, state.config.useCaseAnswers]);

  // =========================================================================
  // SIZING ACTIONS
  // =========================================================================

  const updateSizing = useCallback((updates: Partial<BessSizing>) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sizing: {
          ...prev.config.sizing,
          ...updates
        }
      }
    }));
  }, []);

  // =========================================================================
  // LOCATION ACTIONS
  // =========================================================================

  const updateLocation = useCallback((location: string) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        location
      }
    }));
  }, []);

  const updateElectricityRate = useCallback((rate: number) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        electricityRate: rate
      }
    }));
  }, []);

  // =========================================================================
  // RENEWABLES ACTIONS
  // =========================================================================

  const toggleSolar = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        wantsSolar: enabled
      }
    }));
  }, []);

  const updateSolarSpaceAcres = useCallback((acres: number) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        solarSpaceAcres: acres
      }
    }));
  }, []);

  const toggleEV = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        wantsEV: enabled,
        evConfig: {
          ...prev.config.evConfig,
          enabled
        }
      }
    }));
  }, []);

  const updateEVConfig = useCallback((updates: Partial<EVConfiguration>) => {
    setState(prev => {
      const newConfig = { ...prev.config.evConfig, ...updates };
      const totalMW = (newConfig.chargers * newConfig.kwPerCharger) / 1000;

      return {
        ...prev,
        config: {
          ...prev.config,
          evConfig: {
            ...newConfig,
            totalMW
          }
        }
      };
    });
  }, []);

  // =========================================================================
  // GRID ACTIONS
  // =========================================================================

  const updateGridConnection = useCallback((connection: 'reliable' | 'unreliable' | 'none') => {
    setState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        gridConnection: connection
      }
    }));
  }, []);

  // =========================================================================
  // QUOTE ACTIONS
  // =========================================================================

  const buildCurrentQuote = useCallback(async () => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, isLoading: true }
    }));

    try {
      const quote = await buildQuote({
        useCaseSlug: state.config.useCaseSlug!,
        answers: state.config.useCaseAnswers as Record<string, string | number | boolean>,
        location: { state: state.config.location },
        electricityRate: state.config.electricityRate,
        storageSizeMW: state.config.sizing.storageSizeMW,
        durationHours: state.config.sizing.durationHours,
        solarMW: state.config.sizing.solarMW,
        windMW: state.config.sizing.windMW,
        generatorMW: state.config.sizing.generatorMW
      });

      setState(prev => ({
        ...prev,
        currentQuote: quote,
        ui: { ...prev.ui, isLoading: false }
      }));
    } catch (error) {
      console.error('[useSmartWizard] Quote building failed:', error);
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          isLoading: false,
          error: 'Failed to build quote'
        }
      }));
      throw error;
    }
  }, [state.config]);

  const reset = useCallback(() => {
    console.log('[useSmartWizard] 🔄 Resetting wizard to initial state');
    setState(INITIAL_STATE);
  }, []);

  // =========================================================================
  // LIFECYCLE ACTIONS
  // =========================================================================

  const initialize = useCallback(async () => {
    console.log('[useSmartWizard] 🚀 Starting initialization...');
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, isLoading: true }
    }));

    try {
      console.log('[useSmartWizard] 📡 Fetching use cases...');
      const useCases = await useCaseService.getAllUseCases();
      console.log('[useSmartWizard] ✅ Received use cases:', useCases.length);
      
      if (useCases.length === 0) {
        throw new Error('No use cases available. Please check database connection.');
      }
      
      setState(prev => ({
        ...prev,
        availableUseCases: useCases,
        ui: {
          ...prev.ui,
          isInitialized: true,
          isLoading: false
        }
      }));
      console.log('[useSmartWizard] ✅ Initialization complete');
    } catch (error) {
      console.error('[useSmartWizard] ❌ Initialization failed:', error);
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          isLoading: false,
          error: 'Failed to initialize wizard'
        }
      }));
    }
  }, []);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  const computed = useMemo(() => ({
    canGoNext: state.ui.currentStep < 5 && !state.ui.isLoading,
    canGoPrevious: state.ui.currentStep > -1,
    isStepValid: true, // Future: Add validation logic
    totalSteps: 6
  }), [state.ui.currentStep, state.ui.isLoading]);

  // =========================================================================
  // RETURN HOOK API
  // =========================================================================

  const actions: WizardActions = {
    goToStep,
    nextStep,
    previousStep,
    skipIntro,
    selectUseCase,
    updateAnswers,
    calculateBaseline,
    calculatePowerGap,
    updateSizing,
    updateLocation,
    updateElectricityRate,
    toggleSolar,
    updateSolarSpaceAcres,
    toggleEV,
    updateEVConfig,
    updateGridConnection,
    buildQuote: buildCurrentQuote,
    reset,
    initialize
  };

  return {
    state,
    actions,
    computed
  };
}
