import React, { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Home, Sparkles } from 'lucide-react';

import type { WizardState, PowerLevel } from './types';
import { INITIAL_WIZARD_STATE, WIZARD_STEPS } from './types';

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
      case 4: return true;
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
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">Merlin</span>
          </div>
          <div className="text-purple-300 text-sm">Step {currentStep} of 6</div>
        </div>
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300" style={{ width: `${(currentStep / 6) * 100}%` }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between text-xs">
          {WIZARD_STEPS.map((step) => (
            <button
              key={step.number}
              onClick={() => step.number < currentStep && goToStep(step.number)}
              className={`transition-colors ${step.number === currentStep ? 'text-white font-semibold' : step.number < currentStep ? 'text-purple-400 hover:text-purple-300 cursor-pointer' : 'text-slate-500'}`}
            >
              {step.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{renderStep()}</main>

      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="text-slate-400 text-sm">Step {currentStep} of 6</div>
          {currentStep < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${canProceed() ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
            >
              {currentStep === 5 ? 'View Quote' : 'Continue'} <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5" /> Get Official Quote
            </button>
          )}
        </div>
      </footer>
      <MerlinGuide step={currentStep} industry={state.industryName} state={state.state} />
      <div className="h-24" />
    </div>
  );
}
