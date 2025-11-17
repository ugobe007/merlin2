import React from 'react';
import type { ViewMode } from '../../utils/advancedBuilderConstants';
import { AdvancedBuilderHeader } from './AdvancedBuilderHeader';
import { PricingIntelligencePanel } from './PricingIntelligencePanel';
import { ToolCardsGrid } from './ToolCardsGrid';

/**
 * Advanced Builder Landing Page
 * 
 * Main landing view combining header, pricing intelligence, and tool cards.
 * First screen users see when opening Advanced Quote Builder.
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.4)
 */

interface AdvancedBuilderLandingProps {
  onClose: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenSmartWizard?: () => void;
  onOpenFinancing?: () => void;
  onOpenMarketIntel?: () => void;
  onOpenQuoteTemplates?: () => void;
  setShowQuotePreview?: (show: boolean) => void;
  setSkipWizardIntro?: (skip: boolean) => void;
}

export function AdvancedBuilderLanding({
  onClose,
  onViewModeChange,
  onOpenSmartWizard,
  onOpenFinancing,
  onOpenMarketIntel,
  onOpenQuoteTemplates,
  setShowQuotePreview,
  setSkipWizardIntro,
}: AdvancedBuilderLandingProps) {
  return (
    <>
      {/* Header */}
      <AdvancedBuilderHeader
        viewMode="landing"
        onClose={onClose}
        onViewModeChange={onViewModeChange}
      />

      {/* BESS Market Pricing Intelligence */}
      <PricingIntelligencePanel />

      {/* Tool Cards Grid */}
      <ToolCardsGrid
        onViewModeChange={onViewModeChange}
        onClose={onClose}
        onOpenSmartWizard={onOpenSmartWizard}
        onOpenFinancing={onOpenFinancing}
        onOpenMarketIntel={onOpenMarketIntel}
        onOpenQuoteTemplates={onOpenQuoteTemplates}
        setShowQuotePreview={setShowQuotePreview}
        setSkipWizardIntro={setSkipWizardIntro}
      />
    </>
  );
}
