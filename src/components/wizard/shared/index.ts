/**
 * WIZARD SHARED COMPONENTS - Index
 * =================================
 * 
 * Shared components used across all vertical wizards.
 * Import from this index for cleaner imports.
 * 
 * Usage:
 * import { WizardPowerProfile, WizardStepHelp, COMMON_STEP_HELP } from '@/components/wizard/shared';
 * 
 * Version: 1.0.0
 * Date: December 2025
 */

// Power Profile Component
export { default as WizardPowerProfile } from './WizardPowerProfile';
export type { 
  PowerProfileData, 
  WizardPowerProfileProps 
} from './WizardPowerProfile';
export { formatEnergy, formatPower, formatCurrency } from './WizardPowerProfile';

// Step Help Component
export { default as WizardStepHelp } from './WizardStepHelp';
export type { 
  StepHelpContent, 
  HelpTip, 
  HelpLink,
  WizardStepHelpProps 
} from './WizardStepHelp';
export { COMMON_STEP_HELP } from './WizardStepHelp';

// Mode Selector Component (Pro vs Guided)
export { default as WizardModeSelector, WizardModeSelector as ModeSelector } from './WizardModeSelector';
export type { 
  WizardMode, 
  VerticalType, 
  WizardModeSelectorProps 
} from './WizardModeSelector';

// Accept/Customize Modal Component (NEW - Dec 2025)
export { AcceptCustomizeModal } from './AcceptCustomizeModal';
export type { AcceptCustomizeModalProps } from './AcceptCustomizeModal';
