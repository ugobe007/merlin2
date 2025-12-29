import { useState, useRef } from 'react';

/**
 * Custom hook for managing wizard navigation state and transitions
 * 
 * Handles:
 * - Step transitions (forward/backward)
 * - Intro screen and completion page states
 * - AI wizard modal state
 * - Quickstart mode tracking
 * - Step validation
 * - Smooth scrolling on navigation
 * 
 * @param skipIntro - Whether to skip the intro screen and start at step 0
 * @returns Navigation state and control functions
 */
export function useWizardNavigation(skipIntro: boolean = false) {
  // Navigation state
  const [step, setStep] = useState(skipIntro ? 0 : -1); // -1 = intro, 0-5 = wizard steps
  const [showIntro, setShowIntro] = useState(!skipIntro);
  const [showCompletePage, setShowCompletePage] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [isQuickstart, setIsQuickstart] = useState(false);
  const [wizardInitialized, setWizardInitialized] = useState(false);
  
  // Ref for scrollable content (used by modal wrapper)
  const modalContentRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to top of wizard (smooth behavior)
   * Uses window scroll by default, but can target modal content if needed
   */
  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Navigate to next step with validation
   * @param validateFn - Optional validation function that returns boolean
   * @param onComplete - Callback function when reaching final step
   */
  const handleNext = async (
    validateFn?: () => boolean,
    onComplete?: () => void | Promise<void>
  ) => {
    // Validate current step if validator provided
    if (validateFn && !validateFn()) {
      return;
    }

    scrollToTop();

    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // Final step - show completion page
      setShowCompletePage(true);
      if (onComplete) {
        await onComplete();
      }
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    scrollToTop();
    
    if (step > 0) {
      setStep(step - 1);
    }
  };

  /**
   * Navigate directly to a specific step
   * @param targetStep - Step number to navigate to
   */
  const goToStep = (targetStep: number) => {
    scrollToTop();
    setStep(targetStep);
  };

  /**
   * Start the wizard from intro screen
   */
  const startWizard = () => {
    setShowIntro(false);
    setStep(0);
    setWizardInitialized(true);
  };

  /**
   * Enable quickstart mode (skip advanced features)
   */
  const enableQuickstart = () => {
    setIsQuickstart(true);
  };

  /**
   * Show/hide AI optimization wizard
   */
  const toggleAIWizard = (show?: boolean) => {
    setShowAIWizard(show !== undefined ? show : !showAIWizard);
  };

  /**
   * Reset wizard to initial state
   */
  const resetWizard = () => {
    setStep(skipIntro ? 0 : -1);
    setShowIntro(!skipIntro);
    setShowCompletePage(false);
    setShowAIWizard(false);
    setIsQuickstart(false);
    setWizardInitialized(false);
  };

  /**
   * Get step validation status based on current wizard state
   * Note: Validation logic should be provided by the component using this hook
   */
  const getStepValidationStatus = (
    currentStep: number,
    validationRules: Record<number, boolean>
  ): boolean => {
    return validationRules[currentStep] ?? false;
  };

  /**
   * Get step title by step number
   */
  const getStepTitle = (stepNumber: number = step): string => {
    const titles = [
      'Choose Your Industry',           // Step 0
      'Tell Us About Your Operation',   // Step 1
      'Configure Your System',          // Step 2
      'Power Generation Options',       // Step 3
      'Location & Pricing',             // Step 4
      'Review Your Quote'               // Step 5
    ];
    return titles[stepNumber] || '';
  };

  /**
   * Get step progress percentage
   */
  const getProgressPercentage = (): number => {
    // Intro screen (-1) = 0%, Steps 0-5 = 0-100%
    if (step < 0) return 0;
    return Math.round((step / 5) * 100);
  };

  /**
   * Check if on first step
   */
  const isFirstStep = (): boolean => {
    return step === 0;
  };

  /**
   * Check if on last step
   */
  const isLastStep = (): boolean => {
    return step === 5;
  };

  /**
   * Check if intro is showing
   */
  const isShowingIntro = (): boolean => {
    return step === -1 || showIntro;
  };

  return {
    // State
    step,
    showIntro,
    showCompletePage,
    showAIWizard,
    isQuickstart,
    wizardInitialized,
    modalContentRef,
    
    // Actions
    handleNext,
    handleBack,
    goToStep,
    startWizard,
    enableQuickstart,
    toggleAIWizard,
    resetWizard,
    scrollToTop,
    
    // Utilities
    getStepTitle,
    getProgressPercentage,
    getStepValidationStatus,
    isFirstStep,
    isLastStep,
    isShowingIntro,
    
    // Direct setters (for advanced use cases)
    setStep,
    setShowIntro,
    setShowCompletePage,
    setShowAIWizard,
    setIsQuickstart,
    setWizardInitialized
  };
}

export type WizardNavigation = ReturnType<typeof useWizardNavigation>;
