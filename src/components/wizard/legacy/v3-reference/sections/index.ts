/**
 * WIZARD SECTIONS INDEX
 * =====================
 * 
 * DEPRECATED Dec 21, 2025 - USE V5 WIZARD INSTEAD
 * 
 * The V5 wizard is in: src/components/wizard/v5/
 * This sections folder has broken imports from missing modules.
 * 
 * DO NOT USE THESE COMPONENTS - they have unresolved dependencies.
 */

// Only export files that exist and compile
// Most section files have broken imports to missing modules like:
// - ../types/wizardTypes (doesn't exist)
// - ../constants/wizardConstants (doesn't exist)
// - ../ui/* (missing components)

// Placeholder exports to prevent import errors in StreamlinedWizard
export const Step1LocationGoals: React.FC<any> = () => null;
export const Step2IndustrySize: React.FC<any> = () => null;
export const Step3FacilityDetails: React.FC<any> = () => null;
export const Step4ReviewConfigure: React.FC<any> = () => null;
export const Step5MagicFit: React.FC<any> = () => null;
export const GoalsSectionV3: React.FC<any> = () => null;
export const QuoteResultsSection: React.FC<any> = () => null;

import React from 'react';
