/**
 * Step 2.5: Power Gap Analysis Display
 * Shows the intelligent power gap analysis after use case questions
 */

import React from 'react';
import { PowerGapVisualization } from '../PowerGapVisualization';
import type { BaseStepProps } from '../SmartWizardV3.types';
import type { PowerGapAnalysis } from '@/services/powerGapAnalysis';

interface Step25PowerGapProps extends BaseStepProps {
  analysis: PowerGapAnalysis | null;
  isLoading?: boolean;
}

const Step25_PowerGap: React.FC<Step25PowerGapProps> = ({
  analysis,
  isLoading = false,
  onNext,
  onBack
}) => {
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Analyzing Your Power Requirements...
        </h3>
        <p className="text-gray-600">
          Merlin is calculating the perfect configuration for your needs
        </p>
      </div>
    );
  }
  
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">
          Power gap analysis unavailable
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PowerGapVisualization
        analysis={analysis}
        onContinue={onNext}
        onAdjust={onBack}
      />
    </div>
  );
};

export default Step25_PowerGap;
