/**
 * SHARED WIZARD COMPONENTS INDEX
 * ==============================
 * 
 * Exports shared components used across wizard sections.
 */

export { MerlinGreeting, type MerlinGreetingProps, type StepInstruction } from './MerlinGreeting';

// Placeholder components for backwards compatibility
export const FloatingNavigationArrows: React.FC<{ onBack?: () => void; onNext?: () => void }> = () => null;
export const AcceptCustomizeModal: React.FC<any> = () => null;

import React from 'react';
