/**
 * Smart Wizard V3 - Clean Architecture Implementation
 * =====================================================
 * This is the NEW wizard using the useQuoteBuilder hook.
 * 
 * ✅ BENEFITS vs SmartWizardV2:
 * - Reduced from 2314 lines → ~500 lines (78% reduction)
 * - Replaced 50+ useState → 1 useQuoteBuilder hook
 * - No direct service calls → All through application layer
 * - Clean separation → UI only handles rendering
 * - Easier testing → Business logic in workflow layer
 * 
 * @see src/ui/hooks/useQuoteBuilder.ts - State management
 * @see src/application/workflows/buildQuote.ts - Business logic
 * @see src/ui/hooks/useQuoteBuilder.example.tsx - Migration guide
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useQuoteBuilder } from '@/ui/hooks';
import { generatePDF, generateExcel, generateWord } from '@/utils/quoteExport';
import { createSafeConfigUpdaters, validateConfigUpdaters } from '@/utils/safeConfigUpdaters';
import { 
  validateSmartWizardConfigs, 
  ensureCompleteConfigs,
  logValidationResults,
  getDefaultConfigs
} from '@/utils/smartWizardConfigValidator';

// Wizard step components (reuse existing ones)
import StepIntro from './steps/Step_Intro';
import Step1_IndustryTemplate from './steps/Step1_IndustryTemplate';
import Step2_UseCase from './steps/Step2_UseCase';
import Step3_SimpleConfiguration from './steps/Step2_SimpleConfiguration';
import Step3_AddRenewables from './steps/Step3_AddRenewables';
import Step4_SolarEVDecision from './steps/Step4_SolarEVDecision';
import Step5_PowerProfileReview from './steps/Step5_PowerProfileReview';
import Step4_LocationPricing from './steps/Step4_LocationPricing';
import Step5_QuoteSummary from './steps/Step4_QuoteSummary';
import QuoteCompletePage from './QuoteCompletePage';
import AIStatusIndicator from './AIStatusIndicator';

interface SmartWizardV3Props {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  startInAdvancedMode?: boolean;
  onOpenAdvancedQuoteBuilder?: () => void;
  skipIntro?: boolean;
}

const SmartWizardV3: React.FC<SmartWizardV3Props> = ({ 
  show, 
  onClose, 
  onFinish,
  startInAdvancedMode = false,
  onOpenAdvancedQuoteBuilder,
  skipIntro = false 
}) => {
  // ✅ CLEAN STATE MANAGEMENT - Single hook replaces 50+ useState calls
  const {
    // State
    currentQuote,
    availableUseCases,
    selectedUseCaseSlug,
    useCaseAnswers,
    location,
    electricityRate,
    sizing,
    wantsSolar,
    wantsEV,
    evConfig,
    solarSpaceAcres,
    gridConnection,
    isBuilding,
    error,
    
    // Actions
    loadUseCases,
    selectUseCase,
    updateAnswers,
    updateLocation,
    updateSizing,
    updateSolarEVDecision,
    updateEVConfig,
    updateSolarConfig,
    updateGridConnection,
    buildQuote,
    reset
  } = useQuoteBuilder();

  // Create safe config updaters to prevent ReferenceErrors
  // Only pass actual config update functions, not workflow functions
  const safeUpdaters = createSafeConfigUpdaters({
    updateSolarConfig,
    // Other config updaters can be added here as they become available
    // updateGeneratorConfig, updateWindConfig, updateBessConfig
  });

  // Validate configs on mount
  useEffect(() => {
    const defaults = getDefaultConfigs();
    const configs = {
      solarConfig: defaults.solarConfig,
      generatorConfig: defaults.generatorConfig,
      windConfig: defaults.windConfig,
      bessConfig: sizing ? {
        capacityMWh: sizing.storageSizeMW * sizing.durationHours || 1,
        powerMW: sizing.storageSizeMW || 1,
        durationHours: sizing.durationHours || 1,
      } : defaults.bessConfig,
    };
    
    const validation = validateSmartWizardConfigs(configs);
    if (process.env.NODE_ENV === 'development') {
      logValidationResults(validation);
    }
  }, [sizing]);

  // UI-specific state (not business logic)
  const [step, setStep] = React.useState(-1);
  const [showIntro, setShowIntro] = React.useState(true);
  const [showCompletePage, setShowCompletePage] = React.useState(false);
  const [wizardInitialized, setWizardInitialized] = React.useState(false);
  const [hasSelectedTemplate, setHasSelectedTemplate] = React.useState(false);
  const lastSelectedUseCase = useRef<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Removed excessive debug logging

  // Scroll to top on step change
  useEffect(() => {
    if (step >= 0 && modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [step]);

  // Initialize wizard when opened
  useEffect(() => {
    if (show && !wizardInitialized) {
      // Removed debug logging

      // Load use cases from database
      loadUseCases();

      // Set initial step
      if (skipIntro) {
        setStep(0);
        setShowIntro(false);
      } else {
        setStep(-1);
        setShowIntro(true);
      }

      setShowCompletePage(false);
      setWizardInitialized(true);

      // Handle quickstart data (from use case templates)
      const quickstartData = localStorage.getItem('merlin_wizard_quickstart');
      if (quickstartData) {
        try {
          const wizardData = JSON.parse(quickstartData);
          console.log('🚀 [SmartWizardV3] Quickstart data found:', wizardData);

          // Pre-select use case
          if (wizardData.selectedTemplate) {
            selectUseCase(wizardData.selectedTemplate);
          }

          // Pre-fill location and rate
          if (wizardData.location) {
            updateLocation({ location: wizardData.location });
          }
          if (wizardData.electricityRate) {
            updateLocation({ electricityRate: wizardData.electricityRate });
          }

          // Pre-fill sizing
          if (wizardData.storageSizeMW && wizardData.durationHours) {
            updateSizing({
              storageSizeMW: wizardData.storageSizeMW,
              durationHours: wizardData.durationHours
            });
          }

          // Jump to specified step
          if (wizardData.jumpToStep !== undefined) {
            setStep(wizardData.jumpToStep);
            setShowIntro(false);
          }

          localStorage.removeItem('merlin_wizard_quickstart');
        } catch (e) {
          console.warn('[SmartWizardV3] Failed to parse quickstart data:', e);
          localStorage.removeItem('merlin_wizard_quickstart');
        }
      }
    }

    // Cleanup when wizard closes
    if (!show && wizardInitialized) {
      console.log('🔄 [SmartWizardV3] Wizard closed, resetting...');
      setWizardInitialized(false);
      reset();
    }
  }, [show, wizardInitialized, skipIntro, loadUseCases, selectUseCase, updateLocation, updateSizing, reset]);

  // Navigation handlers
  const handleNext = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Calculate baseline when moving from Step 1 (questions) to Step 2 (system config)
    if (step === 1 && selectedUseCaseSlug && Object.keys(useCaseAnswers).length > 0) {
      try {
        // Import baselineService
        const { calculateDatabaseBaseline } = await import('@/services/baselineService');
        
        // Calculate baseline from template slug and answers
        const baseline = await calculateDatabaseBaseline(
          selectedUseCaseSlug,  // Pass template slug, not template object
          1,                     // Scale factor (default 1)
          useCaseAnswers        // User's answers
        );
        
        // Update sizing state with calculated baseline
        updateSizing({
          storageSizeMW: baseline.powerMW,
          durationHours: baseline.durationHrs,
          solarMWp: baseline.solarMW || 0
        });
        
        console.log('[SmartWizardV3] Baseline calculated:', {
          powerMW: baseline.powerMW,
          durationHrs: baseline.durationHrs,
          solarMW: baseline.solarMW
        });
      } catch (error) {
        console.error('[SmartWizardV3] Failed to calculate baseline:', error);
        // Continue anyway - user can adjust manually
      }
    }

    // Build quote at Step 6 (after preliminary review)
    if (step < 6) {
      setStep(step + 1);
    } else if (step === 6) {
      // Build final quote
      setShowCompletePage(true);
      try {
        await buildQuote();
      } catch (error) {
        console.error('[SmartWizardV3] Quote building failed:', error);
      }
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // Validation for navigation
  const canProceed = () => {
    switch (step) {
      case 0: return hasSelectedTemplate; // Use case selected (local state)
      case 1: return Object.keys(useCaseAnswers).length > 0; // Questions answered
      case 2: return sizing.storageSizeMW > 0 && sizing.durationHours > 0; // Sizing configured
      case 3: return true; // Solar/EV decision (optional)
      case 4: return true; // Power profile review (always can proceed)
      case 5: return !!location && electricityRate > 0; // Location configured
      case 6: return true; // Quote summary
      default: return false;
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!currentQuote) return;
    try {
      await generatePDF(currentQuote);
    } catch (error) {
      console.error('[SmartWizardV3] PDF export failed:', error);
    }
  };

  const handleExportExcel = async () => {
    if (!currentQuote) return;
    try {
      await generateExcel(currentQuote);
    } catch (error) {
      console.error('[SmartWizardV3] Excel export failed:', error);
    }
  };

  const handleExportWord = async () => {
    if (!currentQuote) return;
    try {
      await generateWord(currentQuote);
    } catch (error) {
      console.error('[SmartWizardV3] Word export failed:', error);
    }
  };

  // Intro screen handler
  const handleStartWizard = () => {
    setShowIntro(false);
    setStep(0);
  };

  // Show loading state
  if (isBuilding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-semibold text-gray-900">Building your quote...</p>
              <p className="text-sm text-gray-600">This may take a few seconds</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-center font-semibold text-gray-900 mb-2">Something went wrong</p>
          <p className="text-center text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              reset();
              setStep(0);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  if (!show) return null;

  // Show intro screen
  if (showIntro && step === -1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
          <StepIntro
            onStart={handleStartWizard}
            onSkipToAdvanced={onClose}
          />
        </div>
      </div>
    );
  }

  // Show complete page
  if (showCompletePage && currentQuote) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <QuoteCompletePage
            quote={currentQuote}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onExportWord={handleExportWord}
            onClose={() => {
              setShowCompletePage(false);
              reset();
              onClose();
            }}
            onStartNew={() => {
              setShowCompletePage(false);
              reset();
              setStep(0);
            }}
          />
        </div>
      </div>
    );
  }

  // Main wizard modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Smart Quote Wizard</h2>
              <p className="text-sm text-gray-600">Step {step + 1} of 7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={modalContentRef} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 0: Industry Template Selection */}
          {step === 0 && (
            <Step1_IndustryTemplate
              selectedTemplate={selectedUseCaseSlug || ''}
              setSelectedTemplate={(template) => {
                // Prevent duplicate calls in StrictMode
                if (lastSelectedUseCase.current === template) return;
                lastSelectedUseCase.current = template;
                setHasSelectedTemplate(true);
                selectUseCase(template);
              }}
              useTemplate={true}
              setUseTemplate={() => {}}
              onOpenAdvancedQuoteBuilder={onOpenAdvancedQuoteBuilder}
            />
          )}

          {/* Step 1: Use Case Questions */}
          {step === 1 && selectedUseCaseSlug && (
            <Step2_UseCase
              selectedIndustry={selectedUseCaseSlug}
              useCaseData={useCaseAnswers}
              setUseCaseData={(data) => updateAnswers(data)}
              aiRecommendation={null}
              setStorageSizeMW={(mw) => updateSizing({ storageSizeMW: mw })}
              setDurationHours={(hours) => updateSizing({ durationHours: hours })}
              onAdvanceToConfiguration={() => setStep(2)}
            />
          )}

          {/* Step 2: Simple Configuration (Battery Sizing) */}
          {step === 2 && (
            <Step3_SimpleConfiguration
              storageSizeMW={sizing.storageSizeMW || 0}
              setStorageSizeMW={(mw) => updateSizing({ storageSizeMW: mw })}
              durationHours={sizing.durationHours || 0}
              setDurationHours={(hours) => updateSizing({ durationHours: hours })}
              industryTemplate={selectedUseCaseSlug || ''}
              aiRecommendation={undefined}
            />
          )}

          {/* Step 3: Solar/EV Decision (Simple YES/NO) */}
          {step === 3 && (
            <Step4_SolarEVDecision
              wantsSolar={wantsSolar}
              setWantsSolar={(wants) => updateSolarEVDecision({ wantsSolar: wants })}
              wantsEV={wantsEV}
              setWantsEV={(wants) => updateSolarEVDecision({ wantsEV: wants })}
            />
          )}

          {/* Step 4: Power Profile Review (with configuration) */}
          {step === 4 && (
            <Step5_PowerProfileReview
              peakDemandMW={sizing.storageSizeMW || 0}
              batteryMW={sizing.storageSizeMW || 0}
              batteryDurationHours={sizing.durationHours || 0}
              wantsSolar={wantsSolar}
              solarMW={sizing.solarMW || 0}
              setSolarMW={(mw) => updateSizing({ solarMW: mw })}
              solarSpaceAcres={solarSpaceAcres}
              setSolarSpaceAcres={(acres) => safeUpdaters.updateSolarConfig({ solarSpaceAcres: acres })}
              wantsEV={wantsEV}
              evChargers={evConfig.evChargers}
              setEVChargers={(count) => updateEVConfig({ evChargers: count })}
              evKWperCharger={evConfig.evKWperCharger}
              setEVKWperCharger={(kw) => updateEVConfig({ evKWperCharger: kw })}
              windMW={sizing.windMW || 0}
              setWindMW={(mw) => updateSizing({ windMW: mw })}
              generatorMW={sizing.generatorMW || 0}
              setGeneratorMW={(mw) => updateSizing({ generatorMW: mw })}
              gridConnection={gridConnection}
            />
          )}

          {/* Step 5: Location & Pricing */}
          {step === 5 && (
            <Step4_LocationPricing
              location={location}
              setLocation={(loc) => updateLocation({ location: loc })}
              electricityRate={electricityRate}
              setElectricityRate={(rate) => updateLocation({ electricityRate: rate })}
              knowsRate={true}
              setKnowsRate={() => {}}
            />
          )}

          {/* Step 6: Preliminary Quote (Review before final) */}
          {step === 6 && currentQuote && (
            <Step5_QuoteSummary
              quote={currentQuote}
              onEdit={(stepToEdit) => setStep(stepToEdit)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <AIStatusIndicator />

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>{step === 6 ? 'Finish' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartWizardV3;
