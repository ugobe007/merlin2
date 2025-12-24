/**
 * WIZARD NAVIGATION BUTTONS
 * 
 * Standardized Back/Continue/Skip buttons for wizard navigation.
 * Ensures consistent UX across all wizard sections.
 * 
 * Dependencies: None (pure UI component)
 * Used by: All wizard sections
 */

import React from 'react';
import { ArrowLeft, ArrowRight, SkipForward, Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface WizardNavButtonsProps {
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  backLabel?: string;
  continueLabel?: string;
  skipLabel?: string;
  /** Disable continue button */
  continueDisabled?: boolean;
  /** Show loading spinner on continue */
  isLoading?: boolean;
  /** Hide back button */
  hideBack?: boolean;
  /** Show skip option */
  showSkip?: boolean;
  /** Custom class for container */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WizardNavButtons({
  onBack,
  onContinue,
  onSkip,
  backLabel = 'Back',
  continueLabel = 'Continue',
  skipLabel = 'Skip',
  continueDisabled = false,
  isLoading = false,
  hideBack = false,
  showSkip = false,
  className = '',
}: WizardNavButtonsProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Left side - Back button */}
      <div className="flex-1">
        {!hideBack && onBack && (
          <BackButton onClick={onBack} label={backLabel} />
        )}
      </div>
      
      {/* Center - Skip button (optional) */}
      {showSkip && onSkip && (
        <button
          onClick={onSkip}
          className="flex items-center gap-1 px-3 py-2 text-purple-300 hover:text-white text-sm transition-colors"
        >
          {skipLabel}
          <SkipForward className="w-4 h-4" />
        </button>
      )}
      
      {/* Right side - Continue button */}
      <div className="flex-1 flex justify-end">
        <ContinueButton
          onClick={onContinue}
          label={continueLabel}
          disabled={continueDisabled}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

// ============================================
// INDIVIDUAL BUTTON COMPONENTS
// ============================================

export interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = 'Back', className = '' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

export interface ContinueButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'success';
}

export function ContinueButton({
  onClick,
  label = 'Continue',
  disabled = false,
  isLoading = false,
  className = '',
  variant = 'primary',
}: ContinueButtonProps) {
  const baseClasses = 'flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    success: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}

export default WizardNavButtons;
