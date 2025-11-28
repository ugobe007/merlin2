/**
 * SmartWizardV3 - Clean Rebuild
 * ==============================
 * Built from scratch 2025-11-24
 * 
 * PRINCIPLES:
 * - Component ONLY handles rendering
 * - All logic in useSmartWizard hook
 * - No missing functions
 * - Type-safe by default
 * - Clean, readable, maintainable
 */

import React, { useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSmartWizard } from '@/hooks/useSmartWizard';
import type { SmartWizardV3Props } from './SmartWizardV3.types';

// Step components (V3 - Clean rebuild)
import StepIntro from './steps_v3/Step_Intro';
import Step1_IndustryTemplate from './steps_v3/Step1_IndustryTemplate';
import Step2_UseCase from './steps_v3/Step2_UseCase';
import Step3_PowerGapResolution from './steps_v3/Step3_PowerGapResolution';
import Step4_LocationPricing from './steps_v3/Step4_LocationPricing';
import Step3_Configuration from './steps_v3/Step3_Configuration';
import Step6_QuoteSummary from './steps_v3/Step5_QuoteSummary';
import QuoteCompletePage from './QuoteCompletePage';

// Power Gap Visualization (used in Step 3)
import { PowerGapVisualization } from './PowerGapVisualization';

// ============================================================================
// COMPONENT
// ============================================================================

const SmartWizardV3: React.FC<SmartWizardV3Props> = ({
  show,
  onClose,
  onFinish,
  startInAdvancedMode = false,
  onOpenAdvancedQuoteBuilder,
  skipIntro = false
}) => {
  // =========================================================================
  // HOOK - All state and logic here
  // =========================================================================
  
  const { state, actions, computed } = useSmartWizard();
  
  const {
    config,
    ui,
    currentQuote,
    powerGapAnalysis,
    availableUseCases,
    useCaseDetails
  } = state;
  
  const {
    goToStep,
    nextStep,
    previousStep,
    skipIntro: skipIntroAction,
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
    buildQuote,
    reset,
    initialize
  } = actions;

  // =========================================================================
  // LIFECYCLE - Initialize wizard
  // =========================================================================

  useEffect(() => {
    console.log('[SmartWizardV3] Show changed:', show, 'isInitialized:', ui.isInitialized, 'currentStep:', ui.currentStep);
    if (show && !ui.isInitialized) {
      console.log('[SmartWizardV3] Calling initialize...');
      initialize();
      
      if (skipIntro) {
        console.log('[SmartWizardV3] Skipping intro...');
        skipIntroAction();
      }
    }
  }, [show, ui.isInitialized, skipIntro, initialize, skipIntroAction]);

  // Reset on close
  useEffect(() => {
    if (!show) {
      console.log('[SmartWizardV3] Modal closed, resetting...');
      // Delay reset to allow closing animation
      const timer = setTimeout(() => {
        reset();
      }, 300);
      return () => clearTimeout(timer);
    }
    return; // Satisfy TypeScript when show is true
  }, [show, reset]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  const handleFinish = () => {
    if (currentQuote) {
      onFinish(currentQuote);
      goToStep(-1);
      setTimeout(() => {
        reset();
      }, 300);
    }
    return; // Ensure all code paths return
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
    }, 300);
  };

  // =========================================================================
  // RENDER GUARDS
  // =========================================================================

  if (!show) return null;

  if (ui.isLoading && !ui.isInitialized) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading Smart Wizard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (ui.error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
          <p className="text-gray-600 mb-4">{ui.error}</p>
          <button
            onClick={handleClose}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  // Don't render anything until modal is actually shown (prevents flash)
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-purple-200">
        {/* Header - Merlin branded with Power Gap Status */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 border-b border-purple-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  ✨ Smart Wizard
                </h2>
                {ui.currentStep >= 0 && ui.currentStep <= 5 && (
                  <p className="text-sm text-purple-100 mt-1">
                    Step {ui.currentStep + 1} of 6
                  </p>
                )}
              </div>
              
              {/* Power Gap Visual Status Icon - Red to Green */}
              {(() => {
                const shouldShow = powerGapAnalysis && ui.currentStep >= 2 && ui.currentStep <= 5;
                return shouldShow ? (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                    <div className="relative">
                      {/* Animated pulsing circle */}
                      <div className={`w-4 h-4 rounded-full ${
                        powerGapAnalysis.recommendation === 'sufficient' 
                          ? 'bg-green-400 shadow-green-400' 
                          : powerGapAnalysis.powerGapKW > -100 
                          ? 'bg-yellow-400 shadow-yellow-400 animate-pulse' 
                          : 'bg-red-400 shadow-red-400 animate-pulse'
                      } shadow-lg`}></div>
                    </div>
                    <span className="text-white text-sm font-medium">
                      {powerGapAnalysis.recommendation === 'sufficient' 
                        ? '✓ Power Sufficient' 
                        : powerGapAnalysis.powerGapKW > -100
                        ? '⚠️ Review Power'
                        : '⚡ Power Gap'}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              aria-label="Close wizard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" key={`step-${ui.currentStep}`}>
          {/* Intro Screen */}
          {ui.showIntro && ui.currentStep === -1 && (
            <StepIntro
              onStart={() => {
                skipIntroAction(); // This already sets currentStep to 0
                // DO NOT call nextStep() here - it skips Step 0!
              }}
              onSkipToAdvanced={onOpenAdvancedQuoteBuilder}
            />
          )}

          {/* Step 1: Industry Template */}
          {ui.currentStep === 0 && (
            <Step1_IndustryTemplate
              availableUseCases={availableUseCases}
              selectedTemplate={config.useCaseSlug}
              onSelectTemplate={selectUseCase}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {/* Step 2: Use Case Questions */}
          {ui.currentStep === 1 && config.useCaseSlug && (
            <>
              {ui.isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading use case details...</p>
                </div>
              ) : useCaseDetails ? (
                <Step2_UseCase
                  useCase={useCaseDetails}
                  answers={config.useCaseAnswers}
                  onUpdateAnswers={updateAnswers}
                  onNext={async () => {
                    nextStep();
                  }}
                  onBack={previousStep}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">
                    Failed to load use case details
                    {config.useCaseSlug && <span className="block text-sm mt-2">(Slug: {config.useCaseSlug})</span>}
                  </p>
                  <button
                    onClick={previousStep}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          )}

          {/* If on step 1 but no use case selected, show error */}
          {ui.currentStep === 1 && !config.useCaseSlug && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4 text-xl font-bold">
                ⚠️ No use case selected
              </p>
              <p className="text-gray-600 mb-6">
                Please go back and select a use case to continue.
              </p>
              <button
                onClick={previousStep}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                ← Back to Use Case Selection
              </button>
            </div>
          )}

          {/* Step 2: Solar & EV Configuration */}
          {ui.currentStep === 2 && (
            <Step3_Configuration
              sizing={config.sizing}
              onUpdateSizing={updateSizing}
              wantsSolar={config.wantsSolar}
              onToggleSolar={toggleSolar}
              wantsEV={config.wantsEV}
              onToggleEV={toggleEV}
              evConfig={config.evConfig}
              onUpdateEVConfig={updateEVConfig}
              onNext={async () => {
                await calculatePowerGap();
                nextStep();
              }}
              onBack={previousStep}
            />
          )}

          {/* Step 3: Location & Pricing */}
          {ui.currentStep === 3 && (
            <Step4_LocationPricing
              location={config.location}
              onUpdateLocation={updateLocation}
              electricityRate={config.electricityRate}
              onUpdateRate={updateElectricityRate}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {/* Step 4: Power Gap Resolution - Resolve Before Quote! */}
          {ui.currentStep === 4 && (
            <Step3_PowerGapResolution
              analysis={powerGapAnalysis}
              currentConfig={{
                solarMW: config.sizing.solarMW || 0,
                windMW: config.sizing.windMW || 0,
                generatorMW: config.sizing.generatorMW || 0
              }}
              onUpdateConfig={(updates) => {
                updateSizing({
                  ...config.sizing,
                  ...updates
                });
              }}
              onNext={async () => {
                console.log('[SmartWizardV3] 📦 Building quote before advancing...');
                await buildQuote();
                console.log('[SmartWizardV3] ✅ Quote built, advancing to Step 5');
                nextStep();
              }}
              onBack={previousStep}
            />
          )}

          {/* Step 5: Preliminary Quote */}
          {ui.currentStep === 5 && (
            <>
              {ui.isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Building your quote...</p>
                </div>
              ) : currentQuote && currentQuote.baseline ? (
                <Step6_QuoteSummary
                  quote={currentQuote}
                  onEdit={(step) => goToStep(step)}
                  onNext={() => {
                    goToStep(6);
                  }}
                  onBack={previousStep}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">Failed to generate quote</p>
                  <button
                    onClick={previousStep}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 6: Complete Page */}
          {ui.currentStep === 6 && (
            <>
              {currentQuote && currentQuote.baseline ? (
                <QuoteCompletePage
                  quoteData={{
                    storageSizeMW: config.sizing.storageSizeMW,
                    durationHours: config.sizing.durationHours,
                    solarMW: config.sizing.solarMW || 0,
                    windMW: config.sizing.windMW || 0,
                    generatorMW: config.sizing.generatorMW || 0,
                    location: config.location,
                    industryTemplate: config.useCaseSlug || '',
                    electricityRate: config.electricityRate,
                    totalProjectCost: currentQuote.pricing?.totalProject || 0,
                    annualSavings: currentQuote.financials?.annualSavings || 0,
                    paybackYears: currentQuote.financials?.paybackYears || 0,
                    taxCredit: currentQuote.financials?.taxCredit || 0,
                    netCost: (currentQuote.pricing?.totalProject || 0) - (currentQuote.financials?.taxCredit || 0),
                    installationOption: 'standard',
                    shippingOption: 'standard',
                    financingOption: 'cash'
                  }}
                  onDownloadPDF={() => {}}
                  onDownloadExcel={() => {}}
                  onDownloadWord={() => {}}
                  onEmailQuote={() => {}}
                  onSaveProject={() => {}}
                  onRequestConsultation={() => {}}
                  onClose={handleFinish}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">Quote data not available</p>
                  <button
                    onClick={() => goToStep(3)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Rebuild Quote
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Progress indicators with Merlin colors */}
        {ui.currentStep >= 0 && ui.currentStep < 6 && (
          <div className="border-t p-4 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <button
                onClick={previousStep}
                disabled={!computed.canGoPrevious}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i <= ui.currentStep 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={!computed.canGoNext || ui.isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                {ui.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartWizardV3;
