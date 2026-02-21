/**
 * Auto-Save Hook — Save & Resume Progress
 * 
 * Automatically saves wizard progress to localStorage every 30 seconds.
 * Shows "Resume Progress" banner when user returns.
 * 
 * Storage Strategy:
 * - localStorage for client-side persistence (7 day expiry)
 * - Optional: Supabase for logged-in users (future)
 * 
 * What's Saved:
 * - Current step
 * - Location data
 * - Industry selection
 * - Step 3 answers
 * - Step 4 add-ons (solar/generator/wind)
 * - Timestamp
 */

import { useEffect, useRef, useCallback } from 'react';
import type { WizardV7State } from './useWizardV7';

const STORAGE_KEY = 'merlin_v7_progress';
const SAVE_INTERVAL_MS = 30000; // 30 seconds
const EXPIRY_DAYS = 7;

export interface SavedProgress {
  version: 'v7.1';
  timestamp: number;
  expiresAt: number;
  step: string;
  location?: {
    formattedAddress: string;
    city?: string;
    state?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
  industry?: string;
  step3Answers?: Record<string, unknown>;
  goals?: string[];
  addOns?: {
    solarMW?: number;
    generatorMW?: number;
    generatorFuelType?: string;
    windMW?: number;
  };
}

export interface UseAutoSaveReturn {
  /** Whether saved progress exists */
  hasSavedProgress: boolean;
  /** Saved progress data */
  savedProgress: SavedProgress | null;
  /** Restore progress to wizard */
  restoreProgress: () => void;
  /** Clear saved progress */
  clearProgress: () => void;
  /** Manually trigger save */
  saveNow: () => void;
}

export function useAutoSave(
  state: WizardV7State,
  actions: {
    goToStep: (step: string) => void;
    selectIndustry: (industry: string) => void;
    setStep3Answers: (answers: Record<string, unknown>) => void;
    updateLocationRaw: (input: string) => void;
  }
): UseAutoSaveReturn {
  const saveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSaveRef = useRef<string>('');

  // Check for existing saved progress on mount
  const getSavedProgress = useCallback((): SavedProgress | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const progress: SavedProgress = JSON.parse(saved);

      // Check expiry
      if (Date.now() > progress.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Validate version
      if (progress.version !== 'v7.1') {
        console.warn('[AutoSave] Outdated progress version, clearing');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return progress;
    } catch (error) {
      console.error('[AutoSave] Failed to load progress:', error);
      return null;
    }
  }, []); // Empty deps - only runs on mount

  // Save current progress
  const saveProgress = useCallback(() => {
    // Don't save if on results step (quote complete)
    if (state.step === 'results') return;

    // Don't save if still on welcome panel
    if (!state.location && !state.industry) return;

    const progress: SavedProgress = {
      version: 'v7.1',
      timestamp: Date.now(),
      expiresAt: Date.now() + (EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      step: state.step,
      location: state.location ? {
        formattedAddress: state.location.formattedAddress,
        city: state.location.city,
        state: state.location.state,
        postalCode: state.location.postalCode,
        lat: state.location.lat,
        lng: state.location.lng,
      } : undefined,
      industry: state.industry !== 'auto' ? state.industry : undefined,
      step3Answers: state.step3Answers,
      goals: state.goals,
      addOns: {
        solarMW: (state as any).solarMW || 0,
        generatorMW: (state as any).generatorMW || 0,
        generatorFuelType: (state as any).generatorFuelType || 'natural-gas',
        windMW: (state as any).windMW || 0,
      },
    };

    const serialized = JSON.stringify(progress);

    // Skip save if nothing changed
    if (serialized === lastSaveRef.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, serialized);
      lastSaveRef.current = serialized;
      if (import.meta.env.DEV) {
        console.log('[AutoSave] Progress saved:', state.step);
      }
    } catch (error) {
      console.error('[AutoSave] Failed to save progress:', error);
    }
  }, [state]);

  // Restore progress
  const restoreProgress = useCallback(() => {
    const saved = getSavedProgress();
    if (!saved) return;

    try {
      // Restore location
      if (saved.location) {
        actions.updateLocationRaw(saved.location.formattedAddress);
      }

      // Restore industry
      if (saved.industry) {
        actions.selectIndustry(saved.industry);
      }

      // Restore step 3 answers
      if (saved.step3Answers && Object.keys(saved.step3Answers).length > 0) {
        actions.setStep3Answers(saved.step3Answers);
      }

      // Navigate to saved step
      actions.goToStep(saved.step);

      if (import.meta.env.DEV) {
        console.log('[AutoSave] Progress restored:', saved.step);
      }
    } catch (error) {
      console.error('[AutoSave] Failed to restore progress:', error);
    }
  }, [actions, getSavedProgress]);

  // Clear progress
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      lastSaveRef.current = '';
      if (import.meta.env.DEV) {
        console.log('[AutoSave] Progress cleared');
      }
    } catch (error) {
      console.error('[AutoSave] Failed to clear progress:', error);
    }
  }, []);

  // Auto-save interval
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      saveProgress();
    }, SAVE_INTERVAL_MS);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  // Clear progress when quote completes
  useEffect(() => {
    if (state.step === 'results' && state.quote?.pricingComplete) {
      clearProgress();
    }
  }, [state.step, state.quote, clearProgress]);

  const savedProgress = getSavedProgress();

  return {
    hasSavedProgress: !!savedProgress,
    savedProgress,
    restoreProgress,
    clearProgress,
    saveNow: saveProgress,
  };
}
