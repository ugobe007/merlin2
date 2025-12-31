import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Home, Sparkles, RotateCcw, X } from 'lucide-react';

import type { WizardState, PowerLevel } from './types';
import { INITIAL_WIZARD_STATE, WIZARD_STEPS, POWER_LEVELS } from './types';
import RequestQuoteModal from '@/components/modals/RequestQuoteModal';

import { Step1Location } from './steps/Step1Location';
import { Step2Industry } from './steps/Step2Industry';
import { Step3Details } from './steps/Step3Details';
import { Step3HotelEnergy } from './steps/Step3HotelEnergy';
import { Step4Options } from './steps/Step4Options';
import { Step5MagicFit } from './steps/Step5MagicFit';
import { Step6Quote } from './steps/Step6Quote';
import { MerlinGuide } from './components/MerlinGuide';
import { ValueTicker } from './components/ValueTicker';

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
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);
  
  // Step 4 state for MerlinGuide triggers
  const [step4State, setStep4State] = useState({
    solarDecision: 'undecided' as 'undecided' | 'yes' | 'no',
    generatorDecision: 'undecided' as 'undecided' | 'yes' | 'no',
    evDecision: 'undecided' as 'undecided' | 'yes' | 'no',
    solarMode: 'undecided' as 'undecided' | 'recommended' | 'customize',
    generatorMode: 'undecided' as 'undecided' | 'recommended' | 'customize',
    evMode: 'undecided' as 'undecided' | 'recommended' | 'customize',
  });

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

  // Calculate values for ValueTicker
  const tickerValues = useMemo(() => {
    // Base data from Step 3 (useCaseData)
    const annualUsage = state.useCaseData?.estimatedAnnualKwh || 0;
    const peakDemand = state.useCaseData?.peakDemandKw || 0;
    
    // Utility rates from calculations (Step 5) or defaults
    const utilityRate = state.calculations?.utilityRate || 0.12;
    const demandRate = state.calculations?.demandCharge || 15; // $/kW typical commercial rate
    
    // Calculate annual energy spend and peak demand charges
    const annualEnergySpend = annualUsage * utilityRate;
    const peakDemandCharges = peakDemand * demandRate * 12; // Annual (monthly × 12)
    
    // Get system sizes from state (Step 4 custom values or Step 5 calculations)
    const solarKw = state.customSolarKw || state.calculations?.solarKW || 0;
    const bessKwh = state.calculations?.bessKWh || 0;
    const generatorKw = state.customGeneratorKw || 0;
    const evL2Count = state.customEvL2 || 0;
    const evDcfcCount = state.customEvDcfc || 0;
    
    // Flags based on selectedOptions (set in Step 4)
    const hasSolar = state.selectedOptions?.includes('solar') || false;
    const hasGenerator = state.selectedOptions?.includes('generator') || false;
    const hasEv = state.selectedOptions?.includes('ev') || false;
    
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
    setCurrentStep(2); // Go to Industry Selection
    setShowStartOverModal(false);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return state.zipCode.length >= 5 && state.goals.length > 0;
      case 2: return state.industry !== '';
      case 3: return true; // Database-driven questions handle their own validation
      case 4: return true; // Step4Options handles its own validation with forced decisions
      case 5: return state.selectedPowerLevel !== null;
      case 6: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Location state={state} updateState={updateState} />;
      case 2: return <Step2Industry state={state} updateState={updateState} />;
      case 3: return state.industry === 'hotel' ? <Step3HotelEnergy state={state} updateState={updateState} /> : <Step3Details state={state} updateState={updateState} />;
      case 4: return <Step4Options state={state} updateState={updateState} onStep4StateChange={setStep4State} />;
      case 5: return <Step5MagicFit state={state} updateState={updateState} goToStep={goToStep} />;
      case 6: return <Step6Quote state={state} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER - Fixed at top with z-index 100
          ═══════════════════════════════════════════════════════════════════════ */}
      <header 
        className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20"
        style={{ zIndex: 100 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Start Over */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Merlin</span>
            </div>
            
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
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300" 
            style={{ width: `${(currentStep / 6) * 100}%` }} 
          />
        </div>
        
        {/* Step Navigation */}
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between text-xs">
          {WIZARD_STEPS.map((step) => (
            <button
              key={step.number}
              onClick={() => step.number < currentStep && goToStep(step.number)}
              className={`transition-colors ${
                step.number === currentStep 
                  ? 'text-white font-semibold' 
                  : step.number < currentStep 
                    ? 'text-purple-400 hover:text-purple-300 cursor-pointer' 
                    : 'text-slate-500'
              }`}
            >
              {step.name}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          VALUE TICKER - Shows on Steps 3-6
          ═══════════════════════════════════════════════════════════════════════ */}
      {currentStep >= 3 && (
        <div className="max-w-6xl mx-auto px-4">
          <ValueTicker
            currentStep={currentStep}
            {...tickerValues}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Scrollable area with padding for fixed footer
          ═══════════════════════════════════════════════════════════════════════ */}
      <main 
        className="max-w-6xl mx-auto px-4 py-8"
        style={{ paddingBottom: '120px' }}
      >
        {renderStep()}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER - Fixed at bottom with HIGH z-index
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-purple-500/30"
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          
          {/* Step Indicator */}
          <div className="text-slate-400 text-sm">Step {currentStep} of 6</div>
          
          {/* Continue / Get Quote Button */}
          {currentStep < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed() 
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 5 ? 'View Quote' : 'Continue'} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Sparkles className="w-5 h-5" /> Get Official Quote
            </button>
          )}
        </div>
      </footer>
      
      {/* Merlin Guide (floating assistant) */}
      <MerlinGuide 
        currentStep={currentStep}
        industrySelected={state.industry !== ''}
        industryName={state.industryName}
        stateName={state.state}
        solarDecision={step4State.solarDecision}
        generatorDecision={step4State.generatorDecision}
        evDecision={step4State.evDecision}
        solarMode={step4State.solarMode}
        generatorMode={step4State.generatorMode}
        evMode={step4State.evMode}
      />

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
