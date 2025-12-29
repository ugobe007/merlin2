
// ============================================================================
// CONFIGURATION SECTION (Section 3)
// Modern UI/UX: panels, sliders, icons, drop shadows, actionable popups
// Extracted and refactored for Merlin V5 (Dec 2025)
// ============================================================================

import React from 'react';
import { getStepColors } from '../constants';
import { StepExplanation, PrimaryButton, SecondaryButton } from '../ui';
import type { ConfigurationSectionProps } from '../types/wizardTypes';

// TODO: Import icons, shared constants, and types as needed

const step3Colors = getStepColors(3);

export function ConfigurationSection({
  wizardState,
  setWizardState,
  currentSection = 3,
  sectionRef,
  onBack,
  onContinue,
}: ConfigurationSectionProps & { currentSection?: number; onBack?: () => void; onContinue?: () => void }) {
  // TODO: Implement configuration logic, sliders, and popups
  return (
    <div ref={sectionRef} className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 3 ? 'hidden' : ''}`}>
      <div className="max-w-3xl mx-auto">
        <StepExplanation
          stepNumber={3}
          totalSteps={5}
          title="Configure Your System"
          description="Adjust battery size, solar, EV chargers, and backup options. Use sliders and buttons for a tailored solution."
          estimatedTime="2 minutes"
        />
        {/* TODO: Add configuration panels, sliders, icons, and actionable popups here */}
        <div className={`${step3Colors.panelBgGradient} rounded-3xl p-8 border-2 ${step3Colors.panelBorder} shadow-xl mt-8`}>
          <p className="text-lg text-gray-700">Configuration controls coming soon...</p>
        </div>
        <div className="flex justify-between mt-8">
          {onBack && <SecondaryButton onClick={onBack}>Back</SecondaryButton>}
          {onContinue && <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>}
        </div>
      </div>
    </div>
  );
}

export default ConfigurationSection;
