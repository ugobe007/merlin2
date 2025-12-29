/**
 * SHARED WIZARD COMPONENTS INDEX
 * ==============================
 * 
 * Exports shared components used across wizard sections.
 */

import React from 'react';

// Placeholder types for backwards compatibility
export interface StepInstruction {
  text: string;
  icon?: React.ReactNode;
}

export interface StepInstruction {
  text: string;
  highlight?: string;
}

export interface MerlinGreetingProps {
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  estimatedTime?: string;
  actionInstructions?: string[];
  nextStepPreview?: string;
  isComplete?: boolean;
  onCompleteMessage?: string;
  state?: string;
  utilityRate?: number;
  solarOpportunity?: { rating: string; hours: number };
  savings?: { min: number; max: number };
  onOpenTrueQuote?: () => void;
  acknowledgment?: string;
  instructions?: StepInstruction[];
  recommendation?: {
    title: string;
    content: React.ReactNode;
  };
  proTip?: {
    title: string;
    content: string;
  };
  showMerlinAvatar?: boolean;
  className?: string;
}

// Placeholder components for backwards compatibility
export const MerlinGreeting: React.FC<MerlinGreetingProps> = () => null;
export const FloatingNavigationArrows: React.FC<{ 
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void; 
  onForward?: () => void;
  backLabel?: string;
  forwardLabel?: string;
}> = () => null;
export const AcceptCustomizeModal: React.FC<any> = () => null;
