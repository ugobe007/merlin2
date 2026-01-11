import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, Sparkles, RotateCcw, X } from 'lucide-react';

import type { WizardState } from './types';
import { INITIAL_WIZARD_STATE, WIZARD_STEPS, POWER_LEVELS } from './types';
import RequestQuoteModal from '@/components/modals/RequestQuoteModal';

import { Step1Location } from './steps/Step1Location';
import { Step2Industry } from './steps/Step2Industry';
import { Step3Details } from '@/components/wizard/Step3Details';
import { Step3HotelEnergy } from './steps/Step3HotelEnergy';
import { Step4Options } from './steps/Step4Options';
import { Step5MagicFit } from './steps/Step5MagicFit';
import { Step6Quote } from './steps/Step6Quote';
import { ValueTicker } from './components/ValueTicker';
import { FloatingBatteryIcon } from '@/components/wizard/FloatingBatteryIcon';

// ============================================================================
// START OVER CONFIRMATION MODAL
// ============================================================================

interface StartOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function StartOverModal({ isOpen, onClose, onConfirm }: StartOverModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Start Over?
        </h2>
        <p className="text-slate-400 text-center mb-6">
          Your progress will be reset and you'll return to Industry Selection.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            Yes, Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function WizardV6() {
  // Removed collapsible navigation - now always visible and compact
  
  // ✅ FIXED: Check URL parameter to force fresh start
  // If ?fresh=true or wizard is accessed directly, clear all persisted state
  const shouldStartFresh = (() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('fresh') === 'true' || urlParams.get('new') === 'true';
  })();
  
  // ✅ FIXED: Clear persisted state on mount if this is a fresh start
  // This ensures "Get my free quote" always starts at Step 1
  React.useEffect(() => {
    if (shouldStartFresh && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('merlin-wizard-state');
        sessionStorage.removeItem('merlin-wizard-step');
        console.log('✅ Cleared persisted wizard state for fresh start');
      } catch (e) {
        console.error('Failed to clear persisted state:', e);
      }
    }
  }, [shouldStartFresh]);
  
  // Load state from localStorage on mount
  const [state, setState] = useState<WizardState>(() => {
    // If starting fresh, always use initial state
    if (shouldStartFresh) {
      return INITIAL_WIZARD_STATE;
    }
    
    try {
      const saved = localStorage.getItem('merlin-wizard-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that parsed state has required fields
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_WIZARD_STATE, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load saved wizard state:', e);
    }
    return INITIAL_WIZARD_STATE;
  });
  
  const [currentStep, setCurrentStep] = useState(() => {
    // ✅ FIXED: Always start at Step 1 for fresh starts
    if (shouldStartFresh) {
      return 1;
    }
    
    // Only restore step if we have valid persisted state
    try {
      const hasValidState = localStorage.getItem('merlin-wizard-state');
      if (hasValidState) {
        const saved = sessionStorage.getItem('merlin-wizard-step');
        if (saved) {
          const step = parseInt(saved, 10);
          if (step >= 1 && step <= 6) return step;
        }
      } else {
        // Clear sessionStorage if no valid state (fresh start)
        sessionStorage.removeItem('merlin-wizard-step');
      }
    } catch (e) {
      console.error('Failed to load saved wizard step:', e);
    }
    return 1; // Always default to Step 1
  });
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('merlin-wizard-state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save wizard state:', e);
    }
  }, [state]);

  // Save current step to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('merlin-wizard-step', currentStep.toString());
    } catch (e) {
      console.error('Failed to save wizard step:', e);
    }
  }, [currentStep]);

  // FIXED: Use functional updates to prevent race conditions with nested objects
  const updateState = useCallback((updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => {
    setState(prev => {
      const updatesObj = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...updatesObj };
    });
  }, []);

  const goNext = () => setCurrentStep(prev => {
    const next = prev + 1;
    // Skip Step 2 (Industry Selection) if industry was auto-detected from business lookup
    if (prev === 1 && state.detectedIndustry && state.industry) {
      console.log('🧙 Skipping Step 2 - Industry auto-detected:', state.industry);
      return 3; // Go directly to Step 3 (Details)
    }
    return Math.min(next, 6);
  });
  
  const goBack = () => setCurrentStep(prev => {
    const back = prev - 1;
    // When going back from Step 3, skip Step 2 if industry was auto-detected
    if (prev === 3 && state.detectedIndustry && state.industry) {
      console.log('🧙 Skipping Step 2 on back - Industry auto-detected');
      return 1; // Go back to Step 1
    }
    return Math.max(back, 1);
  });
  const goToStep = (step: number) => setCurrentStep(step);

  // Calculate values for ValueTicker
  const tickerValues = useMemo(() => {
    // Base data from Step 3 (useCaseData)
    const annualUsage = state.useCaseData?.estimatedAnnualKwh || 0;
    const peakDemand = state.useCaseData?.peakDemandKw || 0;
    
    // Utility rates from calculations (Step 5) or defaults
    // SSOT: Use rate from calculations (set by Step5MagicFit from utilityRateService)
    // Fallback to EIA 2024 national average commercial rate
    const utilityRate = state.calculations?.utilityRate || 0.12;
    const demandRate = state.calculations?.demandCharge || 15; // $/kW typical commercial rate
    
    // Calculate annual energy spend and peak demand charges
    const annualEnergySpend = annualUsage * utilityRate;
    const peakDemandCharges = peakDemand * demandRate * 12; // Annual (monthly × 12)
    
    // Get system sizes from state (Step 4 custom values or Step 5 calculations)
    // CRITICAL: Use calculations from Step 5 if available (most accurate)
    // Fallback to custom values from Step 4, then to 0
    const solarKw = state.calculations?.solarKW || state.customSolarKw || 0;
    const bessKwh = state.calculations?.bessKWh || 0;
    const generatorKw = state.calculations?.generatorKW || state.customGeneratorKw || 0;
    
    // EV charger counts - use calculations if available, otherwise custom values
    const calculatedEvChargers = state.calculations?.evChargers || 0;
    const evL2Count = calculatedEvChargers > 0 ? Math.floor(calculatedEvChargers * 0.7) : (state.customEvL2 || 0);
    const evDcfcCount = calculatedEvChargers > 0 ? Math.ceil(calculatedEvChargers * 0.3) : (state.customEvDcfc || 0);
    
    // Flags based on selectedOptions (set in Step 4) OR calculations (Step 5)
    // If we have calculations, use those to determine flags (more accurate)
    const hasSolar = state.calculations?.solarKW > 0 || state.selectedOptions?.includes('solar') || false;
    const hasGenerator = state.calculations?.generatorKW > 0 || state.selectedOptions?.includes('generator') || false;
    const hasEv = state.calculations?.evChargers > 0 || state.selectedOptions?.includes('ev') || false;
    
    return {
      annualEnergySpend,
      peakDemandCharges,
      annualUsageKwh: annualUsage,
      solarKw,
      bessKwh,
      generatorKw,
      generatorFuel: state.generatorFuel || 'natural-gas',
      evL2Count,
      evDcfcCount,
      hasSolar,
      hasGenerator,
      hasEv,
      industryType: state.industryName
    };
  }, [state]);

  // Start Over: Reset state and go to Step 2
  const handleStartOver = () => {
    setState(INITIAL_WIZARD_STATE);
    setCurrentStep(1); // Go back to Location (Step 1)
    setShowStartOverModal(false);
    // Clear persisted state
    try {
      localStorage.removeItem('merlin-wizard-state');
      sessionStorage.removeItem('merlin-wizard-step');
    } catch (e) {
      console.error('Failed to clear persisted state:', e);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return state.zipCode.length === 5 && state.state !== ''; // Only require ZIP code and state (goals are in Step 2)
      case 2: return state.industry !== '';
      case 3: {
        // Step 3 requires ALL questions to be answered before continuing
        if (!state.useCaseData || !state.useCaseData.inputs) return false;
        
        const answeredCount = Object.keys(state.useCaseData.inputs).filter(key => {
          const value = state.useCaseData.inputs[key];
          if (value === undefined || value === null || value === '') return false;
          if (typeof value === 'object' && 'value' in value) {
            return value.value !== undefined && value.value !== null && value.value !== '';
          }
          return true;
        }).length;
        
        // Check if we have total question count stored
        const totalQuestions = state.useCaseData._totalQuestions;
        if (totalQuestions && totalQuestions > 0) {
          // Require all questions to be answered
          return answeredCount >= totalQuestions;
        }
        
        // Fallback: require at least 3 answers (reasonable minimum for any use case)
        return answeredCount >= 3;
      }
      case 4: 
        // Step 4 requires selectedOptions to be set (user must make decisions)
        return !!(state.selectedOptions && state.selectedOptions.length > 0);
      case 5: return state.selectedPowerLevel !== null;
      case 6: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Location state={state} updateState={updateState} />;
      case 2: return <Step2Industry state={state} updateState={updateState} />;
      case 3: return state.industry === 'hotel' ? <Step3HotelEnergy state={state} updateState={updateState} /> : <Step3Details state={state} updateState={updateState} onNext={() => goToStep(4)} />;
      case 4: return <Step4Options state={state} updateState={updateState} />;
      case 5: return <Step5MagicFit state={state} updateState={updateState} goToStep={goToStep} />;
      case 6: return <Step6Quote state={state} />;
      default: return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 overflow-y-auto" 
      style={{ 
        background: 'linear-gradient(to bottom right, rgb(15 23 42), rgb(30 41 59), rgb(15 23 42))',
        width: '100%',
        minHeight: '100vh'
      }}
    >
      {/* Floating Battery Icon - Upper Right */}
      <FloatingBatteryIcon currentStep={currentStep} />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER - Fixed at top with z-index 100
          ═══════════════════════════════════════════════════════════════════════ */}
      <header 
        className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20"
        style={{ zIndex: 100, marginBottom: 0 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Start Over */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <Home className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Merlin</span>
            </a>
            
            {/* Start Over Button */}
            <button
              onClick={() => setShowStartOverModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          </div>
          
          {/* Right: Step indicator */}
          <div className="text-purple-300 text-sm">Step {currentStep} of 6</div>
        </div>
        
        {/* Step Navigation - Larger text, more spacing */}
        <div className="max-w-6xl mx-auto px-4 py-3 border-t border-purple-500/20">
          <div className="flex justify-between text-base items-center gap-4">
            {WIZARD_STEPS.map((step) => (
              <button
                key={step.number}
                onClick={() => step.number < currentStep && goToStep(step.number)}
                className={`transition-colors px-4 py-2 rounded-lg font-medium ${
                  step.number === currentStep 
                    ? 'text-white font-semibold bg-purple-600/20' 
                    : step.number < currentStep 
                      ? 'text-purple-400 hover:text-purple-300 cursor-pointer hover:bg-purple-600/10' 
                      : 'text-slate-500'
                }`}
              >
                {step.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          VALUE TICKER - Sticky at top, floats above content
          ═══════════════════════════════════════════════════════════════════════ */}
      <ValueTicker
        currentStep={currentStep}
        {...tickerValues}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Full width, scrollable area with padding for fixed footer
          ═══════════════════════════════════════════════════════════════════════ */}
      <main 
        className="w-full min-h-screen"
        style={{ paddingBottom: '140px' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          {renderStep()}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER - Fixed at bottom with HIGH z-index, larger buttons
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-purple-500/30"
        style={{ zIndex: 9999 }}
      >
        <div className="w-full px-6 py-5 flex items-center justify-between">
          {/* Back Button - Larger */}
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              currentStep === 1 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-700 text-white hover:bg-slate-600 hover:scale-105'
            }`}
          >
            <ArrowLeft className="w-6 h-6" /> Back
          </button>
          
          {/* Step Indicator */}
          <div className="text-slate-400 text-base">Step {currentStep} of 6</div>
          
          {/* Continue / Get Quote Button - Larger */}
          {currentStep < 6 ? (
            <button
              onClick={() => {
                // CRITICAL FIX: For Step 3, explicitly check all questions are answered before advancing
                if (currentStep === 3 && state.useCaseData) {
                  const inputs = state.useCaseData.inputs || {};
                  const totalQuestions = state.useCaseData._totalQuestions || 0;
                  const answeredCount = Object.keys(inputs).filter(key => {
                    const value = inputs[key];
                    if (value === undefined || value === null || value === '') return false;
                    if (typeof value === 'object' && 'value' in value) {
                      return value.value !== undefined && value.value !== null && value.value !== '';
                    }
                    return true;
                  }).length;
                  
                  if (totalQuestions > 0 && answeredCount < totalQuestions) {
                    console.warn(`⚠️ Cannot advance: Only ${answeredCount} of ${totalQuestions} questions answered`);
                    return;
                  }
                }
                
                // Proceed with navigation (only if all validation passes)
                goNext();
              }}
              disabled={!canProceed()}
              className={`flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-lg transition-all ${
                canProceed() 
                  ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600 text-white hover:from-purple-500 hover:via-purple-400 hover:to-cyan-500 shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              style={canProceed() ? {
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.3)'
              } : {}}
            >
              {currentStep === 5 ? 'View Quote' : 'Continue'} <ArrowRight className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Sparkles className="w-6 h-6" /> Get Official Quote
            </button>
          )}
        </div>
      </footer>
      

      {/* Start Over Confirmation Modal */}
      <StartOverModal
        isOpen={showStartOverModal}
        onClose={() => setShowStartOverModal(false)}
        onConfirm={handleStartOver}
      />

      {/* Request Quote Modal - only show when on step 6 */}
      {currentStep === 6 && state.calculations && state.selectedPowerLevel && (
        <RequestQuoteModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          quoteData={{
            storageSizeMW: state.calculations.bessKW / 1000,
            durationHours: POWER_LEVELS.find(l => l.id === state.selectedPowerLevel)?.durationHours || 4,
            energyCapacity: state.calculations.bessKWh / 1000,
            solarMW: state.calculations.solarKW > 0 ? state.calculations.solarKW / 1000 : 0,
            totalCost: state.calculations.totalInvestment,
            industryName: state.industryName,
            location: `${state.city || ''} ${state.state || ''}`.trim() || state.zipCode,
          }}
        />
      )}
    </div>
  );
}
