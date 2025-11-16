import React from 'react';

/**
 * Wizard Footer Component
 * Extracted from SmartWizardV2 for better maintainability
 * Handles navigation buttons and step progress
 */

interface WizardFooterProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isLastStep: boolean;
  show: boolean;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canProceed,
  isLastStep,
  show
}) => {
  if (!show) return null;

  return (
    <div className="bg-gray-50 p-6 rounded-b-2xl border-t-2 border-gray-200 flex items-center justify-between">
      <button
        onClick={onBack}
        disabled={currentStep === 0}
        className={`px-6 py-3 rounded-xl font-bold transition-all ${
          currentStep === 0
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
        }`}
      >
        ← Back
      </button>

      <div className="text-sm text-gray-500">
        Step {currentStep + 1} of {totalSteps}
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`px-8 py-3 rounded-xl font-bold transition-all ${
          canProceed
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLastStep ? 'Get My Quote →' : 'Next →'}
      </button>
    </div>
  );
};
