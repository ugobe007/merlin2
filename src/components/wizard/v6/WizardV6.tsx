import React, { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Home, Sparkles } from 'lucide-react';

import type { WizardState, PowerLevel } from './types';
import { INITIAL_WIZARD_STATE, WIZARD_STEPS, POWER_LEVELS } from './types';
import RequestQuoteModal from '@/components/modals/RequestQuoteModal';

import { Step1Location } from './steps/Step1Location';
import { Step2Industry } from './steps/Step2Industry';
import { Step3Details } from './steps/Step3Details';
import { Step4Opportunities } from './steps/Step4Opportunities';
import { Step5MagicFit } from './steps/Step5MagicFit';
import { Step3HotelEnergy } from "./steps/Step3HotelEnergy";
import { Step4Options } from "./steps/Step4Options";
import { Step6Quote } from './steps/Step6Quote';
import { MerlinGuide } from './components/MerlinGuide';

export default function WizardV6() {
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step: number) => setCurrentStep(step);

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
      case 4: return <Step4Options state={state} updateState={updateState} />;
      case 5: return <Step5MagicFit state={state} updateState={updateState} />;
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
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">Merlin</span>
          </div>
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
          MAIN CONTENT - Scrollable area with padding for fixed footer
          ═══════════════════════════════════════════════════════════════════════ */}
      <main 
        className="max-w-6xl mx-auto px-4 py-8"
        style={{ paddingBottom: '120px' }} // Extra padding for fixed footer
      >
        {renderStep()}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER - Fixed at bottom with HIGH z-index (above all content)
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer 
        className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-purple-500/30"
        style={{ zIndex: 9999 }} // Very high z-index to stay above all content
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
      <MerlinGuide step={currentStep} industry={state.industryName} state={state.state} />

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
