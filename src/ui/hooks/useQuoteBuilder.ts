/**
 * useQuoteBuilder Hook
 * =====================
 * UI layer - React hook for quote building in wizards.
 * 
 * This hook provides a clean interface for UI components to:
 * - Build quotes using the application workflow
 * - Manage wizard state
 * - Handle loading and errors
 * 
 * Replaces direct service calls from components.
 */

import { useState, useCallback } from 'react';
import { 
  buildQuote, 
  getUseCasesForSelection, 
  getUseCaseDetails,
  type BuildQuoteInput,
  type QuoteResult 
} from '@/application/workflows/buildQuote';
import { calculateDatabaseBaseline } from '@/services/baselineService';
import type { UseCaseResponse } from '@/core/domain';

interface QuoteBuilderState {
  // Quote data
  currentQuote: QuoteResult | null;
  
  // Wizard state
  selectedUseCaseSlug: string | null;
  useCaseAnswers: UseCaseResponse;
  location: string;
  electricityRate: number;
  
  // Sizing (calculated from baseline or user overrides)
  storageSizeMW: number | null;
  durationHours: number | null;
  solarMW: number | null;
  includeRenewables: boolean;
  solarMWp: number | null;
  windMW: number | null;
  generatorMW: number | null;
  
  // Solar/EV Decision (Step 4)
  wantsSolar: boolean;
  wantsEV: boolean;
  
  // EV Configuration (Step 5)
  evChargers: number;
  evKWperCharger: number;
  evTotalMW: number;
  
  // Solar Configuration (Step 5)
  solarSpaceAcres: number;
  
  // Grid Connection
  gridConnection: 'reliable' | 'unreliable' | 'off-grid';
  
  // UI state
  isBuilding: boolean;
  isCalculatingBaseline: boolean;
  error: string | null;
  availableUseCases: any[];
  useCaseDetails: any | null;
}

export function useQuoteBuilder() {
  const [state, setState] = useState<QuoteBuilderState>({
    currentQuote: null,
    selectedUseCaseSlug: null,
    useCaseAnswers: {},
    location: 'California',
    electricityRate: 0.15,
    storageSizeMW: null,
    durationHours: null,
    solarMW: null,
    includeRenewables: false,
    solarMWp: null,
    windMW: null,
    generatorMW: null,
    wantsSolar: false,
    wantsEV: false,
    evChargers: 0,
    evKWperCharger: 50,
    evTotalMW: 0,
    solarSpaceAcres: 0,
    gridConnection: 'reliable',
    isBuilding: false,
    isCalculatingBaseline: false,
    error: null,
    availableUseCases: [],
    useCaseDetails: null
  });

  /**
   * Load available use cases
   */
  const loadUseCases = useCallback(async (_options?: {
    category?: string;
    tier?: string;
  }) => {
    try {
      const useCases = await getUseCasesForSelection();
      setState(prev => ({
        ...prev,
        availableUseCases: useCases,
        error: null
      }));
      return useCases;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load use cases';
      console.error('[useQuoteBuilder] Failed to load use cases:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  /**
   * Select a use case and load its details
   */
  const selectUseCase = useCallback(async (useCaseSlug: string) => {
    try {
      const details = await getUseCaseDetails(useCaseSlug);
      setState(prev => ({
        ...prev,
        selectedUseCaseSlug: useCaseSlug,
        useCaseDetails: details,
        useCaseAnswers: {}, // Reset answers when changing use case
        storageSizeMW: null, // Reset sizing
        durationHours: null,
        solarMW: null,
        error: null
      }));
      return details;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load use case details';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  /**
   * Update use case answers
   */
  const updateAnswers = useCallback((answers: Partial<UseCaseResponse>) => {
    setState(prev => {
      const filteredAnswers = Object.fromEntries(
        Object.entries(answers).filter(([_, v]) => v !== undefined)
      ) as UseCaseResponse;
      
      const newAnswers: UseCaseResponse = {
        ...prev.useCaseAnswers,
        ...filteredAnswers
      };
      return {
        ...prev,
        useCaseAnswers: newAnswers
      };
    });
  }, []);

  /**
   * Calculate baseline sizing from use case template and answers
   * This is called after Step 2 (questions) to populate Step 3 (configuration)
   */
  const calculateBaseline = useCallback(async () => {
    if (!state.selectedUseCaseSlug || !state.useCaseDetails) {
      console.warn('[useQuoteBuilder] Cannot calculate baseline: missing use case or details');
      return null;
    }

    setState(prev => ({ ...prev, isCalculatingBaseline: true, error: null }));

    try {
      const baseline = await calculateDatabaseBaseline(
        state.useCaseDetails.slug,
        1,
        state.useCaseAnswers
      );

      setState(prev => ({
        ...prev,
        storageSizeMW: baseline.powerMW,
        durationHours: baseline.durationHrs,
        solarMW: baseline.solarMW,
        solarMWp: baseline.solarMW, // Alias for compatibility
        isCalculatingBaseline: false,
        error: null
      }));

      return baseline;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate baseline';
      console.error('[useQuoteBuilder] Baseline calculation failed:', error);
      setState(prev => ({
        ...prev,
        isCalculatingBaseline: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [state.selectedUseCaseSlug, state.useCaseDetails, state.useCaseAnswers]);

  /**
   * Update location and pricing
   */
  const updateLocation = useCallback((updates: {
    location?: string;
    electricityRate?: number;
  }) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Update size overrides and renewables
   */
  const updateSizing = useCallback((updates: {
    storageSizeMW?: number;
    durationHours?: number;
    solarMW?: number;
    solarMWp?: number;
    includeRenewables?: boolean;
    windMW?: number;
    generatorMW?: number;
  }) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Build the complete quote
   */
  const buildCurrentQuote = useCallback(async () => {
    if (!state.selectedUseCaseSlug) {
      throw new Error('No use case selected');
    }

    setState(prev => ({ ...prev, isBuilding: true, error: null }));

    try {
      const input: BuildQuoteInput = {
        useCaseSlug: state.selectedUseCaseSlug,
        answers: state.useCaseAnswers,
        location: { state: state.location },
        electricityRate: state.electricityRate,
        solarMW: state.solarMW ?? undefined,
        windMW: state.windMW ?? undefined,
        generatorMW: state.generatorMW ?? undefined,
        storageSizeMW: state.storageSizeMW ?? undefined,
        durationHours: state.durationHours ?? undefined
      };

      const quote = await buildQuote(input);

      setState(prev => ({
        ...prev,
        currentQuote: quote,
        isBuilding: false,
        error: null
      }));

      return quote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to build quote';
      setState(prev => ({
        ...prev,
        isBuilding: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [state.selectedUseCaseSlug, state.useCaseAnswers, state.location, state.electricityRate, state.storageSizeMW, state.durationHours, state.solarMW, state.windMW, state.generatorMW]);

  /**
   * Reset the quote builder
   */
  const reset = useCallback(() => {
    setState({
      currentQuote: null,
      selectedUseCaseSlug: null,
      useCaseAnswers: {},
      location: 'California',
      electricityRate: 0.15,
      storageSizeMW: null,
      durationHours: null,
      solarMW: null,
      includeRenewables: false,
      solarMWp: null,
      windMW: null,
      generatorMW: null,
      wantsSolar: false,
      wantsEV: false,
      evChargers: 0,
      evKWperCharger: 50,
      evTotalMW: 0,
      solarSpaceAcres: 0,
      gridConnection: 'reliable',
      isBuilding: false,
      isCalculatingBaseline: false,
      error: null,
      availableUseCases: [],
      useCaseDetails: null
    });
  }, []);

  /**
   * Update Solar/EV decision
   */
  const updateSolarEVDecision = useCallback((updates: {
    wantsSolar?: boolean;
    wantsEV?: boolean;
  }) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Update EV configuration
   */
  const updateEVConfig = useCallback((updates: {
    evChargers?: number;
    evKWperCharger?: number;
  }) => {
    setState(prev => {
      const evChargers = updates.evChargers ?? prev.evChargers;
      const evKWperCharger = updates.evKWperCharger ?? prev.evKWperCharger;
      const evTotalMW = (evChargers * evKWperCharger) / 1000;
      
      return {
        ...prev,
        evChargers,
        evKWperCharger,
        evTotalMW,
        ...updates
      };
    });
  }, []);

  /**
   * Update Solar configuration
   */
  const updateSolarConfig = useCallback((updates: {
    solarSpaceAcres?: number;
    solarMW?: number;
    solarMWp?: number;
    includeRenewables?: boolean;
  }) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Update grid connection type
   */
  const updateGridConnection = useCallback((connection: 'reliable' | 'unreliable' | 'off-grid') => {
    setState(prev => ({
      ...prev,
      gridConnection: connection
    }));
  }, []);

  return {
    // State
    currentQuote: state.currentQuote,
    selectedUseCaseSlug: state.selectedUseCaseSlug,
    useCaseDetails: state.useCaseDetails,
    availableUseCases: state.availableUseCases,
    useCaseAnswers: state.useCaseAnswers,
    location: state.location,
    electricityRate: state.electricityRate,
    sizing: {
      storageSizeMW: state.storageSizeMW,
      durationHours: state.durationHours,
      solarMW: state.solarMW,
      solarMWp: state.solarMWp,
      includeRenewables: state.includeRenewables,
      windMW: state.windMW,
      generatorMW: state.generatorMW
    },
    wantsSolar: state.wantsSolar,
    wantsEV: state.wantsEV,
    evConfig: {
      evChargers: state.evChargers,
      evKWperCharger: state.evKWperCharger,
      evTotalMW: state.evTotalMW
    },
    solarSpaceAcres: state.solarSpaceAcres,
    gridConnection: state.gridConnection,
    
    // UI state
    isBuilding: state.isBuilding,
    isCalculatingBaseline: state.isCalculatingBaseline,
    error: state.error,
    
    // Actions
    loadUseCases,
    selectUseCase,
    updateAnswers,
    calculateBaseline,
    updateLocation,
    updateSizing,
    updateSolarEVDecision,
    updateEVConfig,
    updateSolarConfig,
    updateGridConnection,
    buildQuote: buildCurrentQuote,
    reset
  };
}
