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

// Merlin Greeting Component (NEW - Dec 2025)
export { MerlinGreeting } from './MerlinGreeting';
export type { MerlinGreetingProps } from './MerlinGreeting';

// Floating Navigation Arrows (NEW - Dec 2025)
export { FloatingNavigationArrows } from './FloatingNavigationArrows';
export type { FloatingNavigationArrowsProps } from './FloatingNavigationArrows';

// Floating Nav Widget (NEW - Dec 20, 2025 - Option 1)
export { FloatingNavWidget } from './FloatingNavWidget';
export type { FloatingNavWidgetProps } from './FloatingNavWidget';

// Wizard Progress Bar (NEW - Dec 20, 2025 - Simple Navigation)
export { WizardProgressBar } from './WizardProgressBar';

// Wizard Bottom Navigation (NEW - Dec 20, 2025 - Simple Navigation)
export { WizardBottomNav } from './WizardBottomNav';

// Progress Ring (NEW - Dec 20, 2025)
export { ProgressRing } from './ProgressRing';

// Configuration Summary (NEW - Floating Sidebar)
export { ConfigurationSummary } from './ConfigurationSummary';
export type { ConfigurationSummaryProps } from './ConfigurationSummary';

// Signup Form (NEW - User Registration)
export { SignupForm } from './SignupForm';
export type { SignupFormProps } from './SignupForm';

// Floating Solar Button (NEW - Solar Opportunity Indicator)
export { FloatingSolarButton } from './FloatingSolarButton';
export type { FloatingSolarButtonProps } from './FloatingSolarButton';
