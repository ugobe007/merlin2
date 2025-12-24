/**
 * STREAMLINED SMART WIZARD (Refactored)
 * ======================================
 * 
 * December 18, 2025 SIMPLIFICATION: Reduced from 8 confusing steps to 5 clear steps.
 * 
 * Architecture:
 * - useStreamlinedWizard hook manages all state
 * - Section components render UI
 * 
 * SIMPLIFIED FLOW (5 steps):
 * 0. Welcome + Location - Select your state/region
 * 1. Industry Selection - What type of facility?
 * 2. Facility Details - Custom questions per industry
 * 3. Goals & Configuration - Set preferences (solar, backup, etc.)
 * 4. Quote Results - Final TrueQuote™ with option to fine-tune
 * 
 * REMOVED (redundant steps that confused users):
 * - ConfigurationComparison (User vs Merlin) - REMOVED
 * - ScenarioSection (3 strategy cards) - REMOVED  
 * - ScenarioSectionV2 (fine-tuning) - REMOVED
 * 
 * User now goes directly from Goals → Quote Results
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { X, Sparkles, MapPin, Building2, Target, Settings, FileText, Wand2, Battery, Zap, HelpCircle, Sun, Award, AlertTriangle, CheckCircle, Lightbulb, Menu, Calculator, Search, Home, ChevronLeft, ChevronRight } from 'lucide-react';

// Modular components
import { useStreamlinedWizard } from './hooks';
import { TrueQuoteBadge } from '../shared/TrueQuoteBadge';
import { AcceptCustomizeModal } from './shared';
// Active section components - Redesigned 5-step wizard (Dec 21, 2025)
// Flow: Location → Industry → Facility → Review & Configure → Magic Fit
import {
  Step1LocationGoals,     // Step 0: Location + Goals
  Step2IndustrySize,      // Step 1: Industry + Size
  Step3FacilityDetails,   // Step 2: Facility Details (V2 with smart dropdowns)
  Step4ReviewConfigure,   // Step 3: Review & Configure (NEW - presets + sliders)
  Step5MagicFit,          // Step 4: Magic Fit Results (3 strategy cards)
  QuoteResultsSection,    // Quote details (embedded in Step5)
} from './sections';
import { ConfigurationConfirmModal } from './modals';
import FloatingWidgets from './FloatingWidgets';
import merlinImage from '@/assets/images/new_profile_merlin.png';

// ============================================
// TYPES
// ============================================

interface StreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
  initialUseCase?: string;
  initialState?: string;
  initialData?: Record<string, any>;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StreamlinedWizard({
  show,
  onClose,
  onFinish,
  onOpenAdvanced,
  initialUseCase,
  initialState,
  initialData,
}: StreamlinedWizardProps) {
  // Use the centralized hook for all state management
  const wizard = useStreamlinedWizard({
    show,
    onClose,
    onFinish,
    onOpenAdvanced,
    initialUseCase,
    initialState,
    initialData,
  });

  // Local UI state
  const [showPowerProfileExplainer, setShowPowerProfileExplainer] = useState(false);
  const [showSolarOpportunity, setShowSolarOpportunity] = useState(false);
  const [showTrueQuoteExplainer, setShowTrueQuoteExplainer] = useState(false);
  const [showMerlinRecommendation, setShowMerlinRecommendation] = useState(false);
  const [hasSeenRecommendation, setHasSeenRecommendation] = useState(false);
  const [showMerlinBanner, setShowMerlinBanner] = useState(false); // Persistent recommendation banner
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Collapsible sidebar buttons

  // Home navigation - navigates to the appropriate vertical landing page
  const handleGoHome = useCallback(() => {
    // Map initialUseCase to the correct landing page URL
    const homeUrls: Record<string, string> = {
      'hotel': '/hotel-energy',
      'car-wash': '/carwashenergy',
      'ev-charging': '/evchargingenergy',
      'ev_charging': '/evchargingenergy',
      // Default: main site
    };
    const url = homeUrls[initialUseCase || ''] || '/';
    window.location.href = url;
  }, [initialUseCase]);
  const [showWizardHelp, setShowWizardHelp] = useState(false); // How to Use wizard help modal
  const [merlinRecommendation, setMerlinRecommendation] = useState<{batteryKW: number; batteryKWh: number; solarKW: number; peakKW: number} | null>(null);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false); // Collapsible calculations widget
  
  // Confirmation Modal state (Dec 2025 - Phase 3)
  const [showConfigConfirmModal, setShowConfigConfirmModal] = useState(false);

  // Section refs for scrolling
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to section when it changes
  useEffect(() => {
    if (sectionRefs.current[wizard.currentSection]) {
      sectionRefs.current[wizard.currentSection]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [wizard.currentSection]);
  
  // Debug: Log when calculations update (helps debug elevator/facility changes)
  useEffect(() => {
    const calc = wizard.centralizedState?.calculated;
    if (calc?.totalPeakDemandKW) {
      console.log('🔄 [StreamlinedWizard] Calculations updated:', {
        peakDemand: calc.totalPeakDemandKW,
        batteryKW: calc.recommendedBatteryKW,
        batteryKWh: calc.recommendedBatteryKWh,
        solarKW: calc.recommendedSolarKW,
        savings: calc.estimatedAnnualSavings,
      });
    }
  }, [wizard.centralizedState?.calculated]);
  
  // Show Merlin recommendation popup when user finishes facility details (section 2 → section 3)
  // Store the recommendation for persistent banner display
  useEffect(() => {
    const calc = wizard.centralizedState?.calculated || {};
    const hasRecommendations = calc.recommendedBatteryKW > 0 || calc.totalPeakDemandKW > 0;
    
    if (wizard.currentSection === 3 && !hasSeenRecommendation && hasRecommendations) {
      // Store the recommendation values for the persistent banner
      setMerlinRecommendation({
        batteryKW: calc.recommendedBatteryKW || 0,
        batteryKWh: calc.recommendedBatteryKWh || 0,
        solarKW: calc.recommendedSolarKW || 0,
        peakKW: calc.totalPeakDemandKW || calc.recommendedBatteryKW || 0,
      });
      
      // Dec 14, 2025 - DISABLED intermediate Merlin's Insight modal
      // User will see full recommendation in AcceptCustomizeModal after Section 3
      // This reduces noise - one clear decision point instead of multiple popups
      setHasSeenRecommendation(true);
      setShowMerlinBanner(false); // Disable banner too
    }
    return undefined;
  }, [wizard.currentSection, hasSeenRecommendation, wizard.centralizedState?.calculated]);

  // Don't render if not showing
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 overflow-y-auto">
      {/* Minimal Header - Just close button (Dec 21, 2025) */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white/80 hover:text-white transition-all shadow-lg hover:shadow-xl border border-white/20"
          title="Close wizard"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* REMOVED: Complex nav bar with metrics - now handled within steps */}
      {/* Header nav bar removed Dec 21, 2025 - cleaner fullscreen experience */}

      {/* HAMBURGER MENU SIDEBAR - Dec 17, 2025 */}
      {showSidebarMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => setShowSidebarMenu(false)}
          />
          {/* Sidebar Panel */}
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 z-[9999] shadow-2xl border-r border-purple-500/30">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                  <span className="font-bold text-white text-lg">Merlin Energy</span>
                </div>
                <button
                  onClick={() => setShowSidebarMenu(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              {/* Home */}
              <button
                onClick={() => {
                  setShowSidebarMenu(false);
                  window.location.href = '/';
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Home className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Home</span>
              </button>
              
              {/* Hotel Energy */}
              <button
                onClick={() => {
                  setShowSidebarMenu(false);
                  window.location.href = '/hotel-energy';
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span className="font-medium">Hotel Energy</span>
              </button>
              
              {/* Divider */}
              <div className="border-t border-white/10 my-4" />
              
              {/* Wizard Steps - Redesigned 5-step flow (Dec 21, 2025) */}
              <p className="text-xs text-purple-300 uppercase tracking-wider px-4 mb-2">Wizard Steps</p>
              
              {['Location & Goals', 'Industry', 'Facility Details', 'Review & Configure', 'Magic Fit Results'].map((step, index) => (
                <button
                  key={step}
                  onClick={() => {
                    setShowSidebarMenu(false);
                    wizard.advanceToSection(index);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                    wizard.currentSection === index
                      ? 'bg-purple-600/40 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    wizard.currentSection === index
                      ? 'bg-purple-500 text-white'
                      : wizard.currentSection > index
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-white/60'
                  }`}>
                    {wizard.currentSection > index ? '✓' : index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </button>
              ))}
              
              {/* Divider */}
              <div className="border-t border-white/10 my-4" />
              
              {/* Close Wizard */}
              <button
                onClick={() => {
                  setShowSidebarMenu(false);
                  onClose?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
                <span className="font-medium">Close Wizard</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main Content - FULL WIDTH (sidebar removed Dec 17, 2025) */}
      <div className="min-h-full pt-16 pb-8">
        {/* Scrollable Content Area - Now full width */}
        <main
          ref={containerRef}
          className="min-h-full"
        >
          {/* Loading Overlay during transitions */}
          {wizard.isTransitioning && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-[#060F76] via-[#1a237e] to-[#0d1952]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-[#7DD3FC]/30 border-t-[#7DD3FC] rounded-full animate-spin"></div>
                <p className="text-white/80 text-lg font-medium">Loading next step...</p>
              </div>
            </div>
          )}
          
          <div className={`transition-opacity duration-300 ${wizard.isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Section 0: Location + Goals (Two-Column Layout) - NEW Dec 18, 2025 */}
            <Step1LocationGoals
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              onZipChange={wizard.handleZipCodeChange}
              onStateSelect={wizard.handleStateSelect}
              onInternationalSelect={wizard.handleInternationalSelect}
              onContinue={() => {
                wizard.completeSection('location');
                wizard.advanceToSection(1);
              }}
              onOpenProQuote={onOpenAdvanced}
              isHidden={wizard.currentSection !== 0}
            />

            {/* Section 1: Industry + Key Size (NEW Dec 18, 2025 - Educational Merlin) */}
            <Step2IndustrySize
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              availableUseCases={wizard.availableUseCases}
              isLoadingUseCases={wizard.isLoadingUseCases}
              onIndustrySelect={wizard.handleIndustrySelect}
              onBack={() => wizard.advanceToSection(0)}
              onHome={handleGoHome}
              onContinue={() => {
                wizard.completeSection('industry');
                wizard.advanceToSection(2);
              }}
              onOpenProQuote={onOpenAdvanced}
              isHidden={wizard.currentSection !== 1}
            />

            {/* Section 2: Facility Details - NEW DESIGN Dec 18, 2025 */}
            <Step3FacilityDetails
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              initializedFromVertical={wizard.initializedFromVertical}
              sectionRef={(el) => { sectionRefs.current[2] = el; }}
              onBack={() => wizard.advanceToSection(1)}
              onHome={handleGoHome}
              onContinue={() => {
                wizard.completeSection('facility');
                // Go to Goals/Preferences (Section 3)
                wizard.advanceToSection(3);
              }}
              isHidden={wizard.currentSection !== 2}
            />

            {/* ═══════════════════════════════════════════════════════════════
                REDESIGNED 5-STEP FLOW (Dec 21, 2025):
                
                Step 0: LOCATION + GOALS - User selects state and priorities
                Step 1: INDUSTRY + SIZE - What type of facility, key sizing
                Step 2: FACILITY DETAILS - Custom questions per industry  
                Step 3: REVIEW & CONFIGURE - Presets + sliders with Merlin guidance
                Step 4: MAGIC FIT RESULTS - 3 strategy cards with SuperSize option
                
                KEY CHANGES (Dec 21, 2025):
                - Step 3 = NEW Review & Configure with presets [Conservative/Optimized/Maximum]
                - Step 4 = Magic Fit 3 cards (moved from old Step 4)
                - Merlin warns when user makes suboptimal slider choices
                - Values persist throughout all steps
            ═══════════════════════════════════════════════════════════════ */}
            
            {/* Step 3: Review & Configure (NEW Dec 21, 2025) */}
            {/* User reviews system config, chooses preset or adjusts sliders */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || 0;
              
              // Recommended values from SSOT
              const recommendedBatteryKW = calc.recommendedBatteryKW || Math.round(peakDemandKW * 0.8);
              const recommendedBatteryKWh = calc.recommendedBatteryKWh || recommendedBatteryKW * 4;
              const recommendedSolarKW = calc.recommendedSolarKW || Math.round(peakDemandKW * 0.5);
              const recommendedGeneratorKW = Math.round(peakDemandKW * 0.25);
              
              return wizard.currentSection === 3 ? (
                <Step4ReviewConfigure
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={3}
                  sectionRef={(el: HTMLDivElement | null) => { sectionRefs.current[3] = el; }}
                  onBack={() => wizard.advanceToSection(2)}
                  onContinue={async () => {
                    // Dec 21, 2025: Go to Magic Fit (Step 4)
                    console.log('🎯 [REVIEW] Continue clicked - going to Magic Fit...');
                    wizard.completeSection('configuration');
                    
                    // Generate scenarios for Magic Fit
                    await wizard.generateAllScenarios();
                    
                    console.log('✅ [REVIEW] Scenarios generated - advancing to Step 4');
                    wizard.advanceToSection(4); // Magic Fit
                  }}
                  recommendedBatteryKW={recommendedBatteryKW}
                  recommendedBatteryKWh={recommendedBatteryKWh}
                  recommendedSolarKW={recommendedSolarKW}
                  recommendedGeneratorKW={recommendedGeneratorKW}
                  peakDemandKW={peakDemandKW}
                />
              ) : null;
            })()}

            {/* ═══════════════════════════════════════════════════════════════
                Step 4: Magic Fit - 3 Strategy Cards
            ═══════════════════════════════════════════════════════════════ */}

            {/* Step 4: Magic Fit Results */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || 0;
              const batteryKW = wizard.wizardState.batteryKW || 0;
              const solarKW = wizard.wizardState.solarKW || 0;
              const generatorKW = wizard.wizardState.generatorKW || 0;
              const totalConfiguredKW = batteryKW + solarKW + generatorKW;
              const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 100;
              
              return wizard.currentSection === 4 ? (
                <Step5MagicFit
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={4}
                  sectionRef={(el: HTMLDivElement | null) => { sectionRefs.current[4] = el; }}
                  onBack={() => wizard.advanceToSection(3)}
                  onContinue={async () => {
                    // Generate final quote and finish
                    console.log('🎯 [MAGIC FIT] Continue clicked - generating final quote...');
                    await wizard.generateQuote();
                    // Show quote results or finish
                    wizard.completeSection('magicfit');
                    wizard.advanceToSection(5);
                  }}
                  onOpenProQuote={onOpenAdvanced}
                  scenarioResult={wizard.wizardState.scenarioResult}
                  isGenerating={wizard.isGeneratingScenarios}
                  onGenerateScenarios={wizard.generateAllScenarios}
                  peakDemandKW={peakDemandKW}
                  powerCoverage={powerCoverage}
                  onSelectScenario={wizard.selectScenario}
                />
              ) : null;
            })()}

            {/* ═══════════════════════════════════════════════════════════════
                Step 5: Quote Results - Final TrueQuote™
            ═══════════════════════════════════════════════════════════════ */}

            {/* Step 5: Quote Results - THE FINAL STEP */}
            <QuoteResultsSection
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              currentSection={wizard.currentSection}
              sectionRef={(el: HTMLDivElement | null) => { sectionRefs.current[5] = el; }}
              premiumConfig={wizard.premiumConfig}
              premiumComparison={wizard.premiumComparison}
              onBack={() => wizard.advanceToSection(4)}
              onHome={handleGoHome}
              onStartNew={() => {
                wizard.setCurrentSection(0);
                wizard.setCompletedSections([]);
                wizard.setTotalPoints(0);
              }}
              onOpenAdvanced={onOpenAdvanced}
            />
          </div>
        </main>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING WIDGETS (Dec 17, 2025)
          Replaces sidebar with floating action buttons + overlay panels
          ═══════════════════════════════════════════════════════════════════ */}
      <FloatingWidgets
        peakDemandKW={wizard.centralizedState?.calculated?.totalPeakDemandKW || 200}
        state={wizard.wizardState.state}
        industryProfile={wizard.wizardState.selectedIndustry || 'hotel'}
        industryName={wizard.wizardState.industryName}
        currentConfig={wizard.wizardState.batteryKW > 0 ? {
          batteryKW: wizard.wizardState.batteryKW,
          batteryKWh: wizard.wizardState.batteryKWh,
          solarKW: wizard.wizardState.solarKW || 0,
          generatorKW: wizard.wizardState.generatorKW || 0,
          annualSavings: wizard.centralizedState?.calculated?.estimatedAnnualSavings || 0,
          paybackYears: wizard.centralizedState?.calculated?.estimatedPaybackYears,
        } : undefined}
        onNavigateToSection={(section) => wizard.advanceToSection(section)}
        merlinRecommendation={wizard.centralizedState?.calculated?.recommendedBatteryKW ? {
          batteryKW: wizard.centralizedState.calculated.recommendedBatteryKW,
          batteryKWh: wizard.centralizedState.calculated.recommendedBatteryKWh || 0,
          solarKW: wizard.centralizedState.calculated.recommendedSolarKW || 0,
        } : undefined}
        facilityDetails={{
          rooms: wizard.wizardState.useCaseData?.rooms || wizard.wizardState.useCaseData?.roomCount || 100,
          hasEVChargers: wizard.wizardState.useCaseData?.hasEVChargers || false,
          evChargerCount: wizard.wizardState.useCaseData?.evChargerCount || 0,
          evChargersL2: wizard.wizardState.evChargersL2 || 0,
          evChargersDCFC: wizard.wizardState.evChargersDCFC || 0,
          gridConnection: wizard.wizardState.gridConnection as 'on-grid' | 'off-grid' | 'limited' || 'on-grid',
        }}
      />
      
      {/* Configuration Confirm Modal - Shows before advancing to final quote */}
      {(() => {
        const calc = wizard.centralizedState?.calculated || {};
        const peakDemandKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 500;
        const batteryKW = wizard.wizardState.batteryKW || 0;
        const totalConfiguredKW = batteryKW + (wizard.wizardState.solarKW || 0) + (wizard.wizardState.generatorKW || 0);
        const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 100;
        
        return (
          <ConfigurationConfirmModal
            isOpen={showConfigConfirmModal}
            onClose={() => setShowConfigConfirmModal(false)}
            onConfirm={async () => {
              setShowConfigConfirmModal(false);
              // Generate the final quote and advance to Section 5
              await wizard.generateQuote();
              wizard.advanceToSection(5);
            }}
            onAdjust={() => {
              setShowConfigConfirmModal(false);
              // Go back to scenarios to pick a different strategy
              wizard.advanceToSection(3);
            }}
            wizardState={wizard.wizardState}
            selectedScenario={wizard.wizardState.selectedScenario}
            powerCoverage={powerCoverage}
            peakDemandKW={peakDemandKW}
          />
        );
      })()}
      
      {/* Power Profile Explainer Modal */}
      {showPowerProfileExplainer && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Understanding Your Power</h3>
                <button
                  onClick={() => setShowPowerProfileExplainer(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Current Values - using same logic as header */}
              {(() => {
                const calc = wizard.centralizedState?.calculated || {};
                
                // Battery: user-configured OR recommended
                const batteryKW = wizard.wizardState.batteryKW > 0 
                  ? wizard.wizardState.batteryKW 
                  : (calc.recommendedBatteryKW || 0);
                const batteryKWh = wizard.wizardState.batteryKWh > 0 
                  ? wizard.wizardState.batteryKWh 
                  : (calc.recommendedBatteryKWh || batteryKW * (wizard.wizardState.durationHours || 4));
                
                // Solar & Generator
                const solarKW = wizard.wizardState.solarKW > 0 
                  ? wizard.wizardState.solarKW 
                  : (wizard.wizardState.wantsSolar ? (calc.recommendedSolarKW || 0) : 0);
                const generatorKW = wizard.wizardState.generatorKW || 0;
                
                // Peak demand and coverage
                const peakDemandKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 0;
                const totalConfiguredKW = batteryKW + solarKW + generatorKW;
                const coverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 0;
                const hasData = peakDemandKW > 0 || batteryKWh > 0;
                
                const formatEnergy = (kwh: number) => kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;
                const formatPower = (kw: number) => kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
                
                return (
                  <div className="mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-gray-800 mb-3">Your Current Configuration</h4>
                    {!hasData ? (
                      <p className="text-sm text-gray-500 italic">Select an industry to see calculated values</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className="text-2xl font-black text-emerald-600">
                              {formatEnergy(batteryKWh)}
                            </div>
                            <div className="text-xs text-gray-500">Energy Storage</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg">
                            <div className={`text-2xl font-black ${coverage >= 100 ? 'text-emerald-600' : coverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {coverage}%
                            </div>
                            <div className="text-xs text-gray-500">Power Coverage</div>
                          </div>
                        </div>
                        
                        {/* Component Breakdown */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">🔋 Battery:</span>
                            <span className="font-bold text-gray-800">{formatPower(batteryKW)}</span>
                          </div>
                          {solarKW > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">☀️ Solar:</span>
                              <span className="font-bold text-gray-800">{formatPower(solarKW)}</span>
                            </div>
                          )}
                          {generatorKW > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">⚡ Generator:</span>
                              <span className="font-bold text-gray-800">{formatPower(generatorKW)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-600 font-medium">Total Power:</span>
                            <span className="font-black text-indigo-600">{formatPower(totalConfiguredKW)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Peak Demand:</span>
                            <span className="font-bold text-gray-800">{formatPower(peakDemandKW)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              
              {/* Power Profile Explanation */}
              <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <Battery className="w-6 h-6 text-emerald-600" />
                  <h4 className="font-bold text-emerald-800">Power Profile (kWh)</h4>
                </div>
                <p className="text-sm text-emerald-700 mb-3">
                  Your <strong>Power Profile</strong> shows your total energy storage capacity:
                </p>
                <ul className="text-sm text-emerald-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">⚡</span>
                    <span><strong>kW (Power)</strong> = How much you can draw at once</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">🔋</span>
                    <span><strong>kWh (Energy)</strong> = Power × Hours = Total capacity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">⏱️</span>
                    <span><strong>Duration</strong> = How long at full power ({wizard.wizardState.durationHours || 4}hr)</span>
                  </li>
                </ul>
              </div>
              
              {/* Power Gap Explanation */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-6 h-6 text-amber-600" />
                  <h4 className="font-bold text-amber-800">Power Gap (% Coverage)</h4>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  The <strong>Power Gap</strong> shows if your battery covers your peak demand:
                </p>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span><strong>100%+</strong> = Full coverage, battery handles all peak loads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">⚠</span>
                    <span><strong>&lt;100%</strong> = Gap exists, need grid during peaks</span>
                  </li>
                </ul>
                <p className="text-xs text-amber-600 mt-3 italic">
                  Tip: Grid-connected = small gap OK. Off-grid = need 100%+.
                </p>
              </div>
              
              <button
                onClick={() => setShowPowerProfileExplainer(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold transition-colors hover:from-purple-600 hover:to-indigo-600"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Solar Opportunity Modal - Enhanced with Apply Recommendation (Dec 21, 2025) */}
      {showSolarOpportunity && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Solar Opportunity</h3>
                </div>
                <button
                  onClick={() => setShowSolarOpportunity(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {(() => {
                const solarHours = wizard.wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay || 0;
                const hasLocation = wizard.wizardState.state && solarHours > 0;
                const sunRating = hasLocation ? Math.min(5, Math.max(1, Math.round(solarHours - 2))) : 0;
                
                // Calculate recommended solar based on peak demand
                const calc = wizard.centralizedState?.calculated || {};
                const peakDemandKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 200;
                const recommendedSolarKW = calc.recommendedSolarKW || Math.round(peakDemandKW * 0.6);
                const currentSolarKW = wizard.wizardState.solarKW || 0;
                
                const ratingDescriptions: Record<number, { label: string; color: string; description: string; solarMultiplier: number }> = {
                  1: { label: 'Limited', color: 'text-gray-500', description: 'Solar can still offset 30-40% of energy use', solarMultiplier: 0.4 },
                  2: { label: 'Fair', color: 'text-blue-500', description: 'Good for commercial solar installations', solarMultiplier: 0.5 },
                  3: { label: 'Good', color: 'text-emerald-500', description: 'Strong solar potential - recommended', solarMultiplier: 0.6 },
                  4: { label: 'Excellent', color: 'text-amber-500', description: 'Outstanding solar resource - highly recommended', solarMultiplier: 0.8 },
                  5: { label: 'Exceptional', color: 'text-orange-500', description: 'Premium solar location - maximize your array!', solarMultiplier: 1.0 },
                };
                
                const rating = ratingDescriptions[sunRating] || ratingDescriptions[3];
                
                return (
                  <>
                    {/* Sun Rating Display */}
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Sun 
                          key={i}
                          className={`w-10 h-10 transition-all ${
                            i <= sunRating 
                              ? 'text-amber-400 fill-amber-400 drop-shadow-lg' 
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {hasLocation ? (
                      <>
                        <div className="text-center mb-4">
                          <span className={`text-2xl font-black ${rating.color}`}>{rating.label}</span>
                          <p className="text-sm text-gray-600 mt-1">{solarHours.toFixed(1)} peak sun hours/day</p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 mb-4">
                          <p className="text-sm text-amber-800">{rating.description}</p>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">📍</span>
                            <div>
                              <div className="font-bold text-gray-800">{wizard.wizardState.state}</div>
                              <div className="text-gray-500">Your selected location</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">💰</span>
                            <div>
                              <div className="font-bold text-gray-800">
                                ~{Math.round(solarHours * 365 * 0.15 * 100) / 100}¢/kWh effective
                              </div>
                              <div className="text-gray-500">Estimated solar LCOE</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Solar Recommendation - Apply Button (Dec 21, 2025) */}
                        {peakDemandKW > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-emerald-800">Merlin's Recommendation</span>
                              <span className="text-emerald-600 font-black">{Math.round(recommendedSolarKW)} kW</span>
                            </div>
                            <p className="text-xs text-emerald-700 mb-3">
                              Based on your {Math.round(peakDemandKW)} kW peak demand and {rating.label.toLowerCase()} solar potential
                            </p>
                            {currentSolarKW !== recommendedSolarKW && (
                              <button
                                onClick={() => {
                                  wizard.setWizardState(prev => ({
                                    ...prev,
                                    solarKW: recommendedSolarKW,
                                    wantsSolar: true,
                                  }));
                                  setShowSolarOpportunity(false);
                                }}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors"
                              >
                                Apply {Math.round(recommendedSolarKW)} kW Solar
                              </button>
                            )}
                            {currentSolarKW === recommendedSolarKW && (
                              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                Already applied!
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Select a location to see your solar opportunity</p>
                      </div>
                    )}
                  </>
                );
              })()}
              
              <button
                onClick={() => setShowSolarOpportunity(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-bold transition-colors hover:from-amber-600 hover:to-yellow-600"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MERLIN RECOMMENDATION POPUP - INFORMATIONAL ONLY (No decision required) */}
      {showMerlinRecommendation && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMerlinRecommendation(false)} // Click outside to close
        >
          <div 
            className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl shadow-2xl max-w-2xl w-full border border-purple-500/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Header with Merlin - LARGER */}
            <div className="relative p-8 pb-6">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowMerlinRecommendation(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={merlinImage} alt="Merlin" className="w-20 h-20" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-3 border-purple-900">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">Merlin's Insight</h3>
                  <p className="text-purple-300 text-base">Here's what I've calculated based on your facility</p>
                </div>
              </div>
            </div>
            
            {/* Recommendation Content - LARGER */}
            <div className="px-8 pb-8">
              {(() => {
                const calc = wizard.centralizedState?.calculated || {};
                const selectedUseCase = wizard.availableUseCases?.find((uc: any) => uc.slug === wizard.wizardState.selectedIndustry);
                const industryName = selectedUseCase?.name || wizard.wizardState.selectedIndustry || 'your facility';
                
                // Dec 14, 2025 - Critical Fix #4: Use ACTUAL calculated values from user inputs
                // Don't show modal if calculations haven't been populated (still using defaults)
                const basePeakKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 0;
                const peakKW = basePeakKW;
                
                // Use recommended values from calculations (NOT fallback formulas)
                const recBatteryKW = calc.recommendedBatteryKW || 0;
                const recBatteryKWh = calc.recommendedBatteryKWh || 0;
                const recSolarKW = calc.recommendedSolarKW || 0;
                const solarHours = wizard.wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay || 5;
                
                // If values are still 0, user hasn't completed form - don't show misleading data
                if (recBatteryKW === 0 && peakKW === 0) {
                  console.warn('⚠️ Merlin Insight: No calculated values available, modal should not be shown');
                  return null;
                }
                
                return (
                  <>
                    {/* Key insight - LARGER */}
                    <div className="p-5 bg-white/10 rounded-2xl mb-5 border border-white/20">
                      <p className="text-white text-lg leading-relaxed">
                        Based on <span className="text-amber-300 font-bold">{industryName}</span> industry standards, 
                        I estimate your facility needs approximately <span className="text-emerald-300 font-black text-xl">{Math.round(peakKW).toLocaleString()} kW</span> of 
                        peak power capacity.
                      </p>
                    </div>
                    
                    {/* Recommendations grid - LARGER */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      {/* Battery Recommendation */}
                      <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-400/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Battery className="w-6 h-6 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Battery Storage</span>
                        </div>
                        <p className="text-3xl font-black text-white mb-1">
                          {recBatteryKWh >= 1000 ? `${(recBatteryKWh / 1000).toFixed(1)} MWh` : `${Math.round(recBatteryKWh)} kWh`}
                        </p>
                        <p className="text-emerald-400/70 text-sm">
                          {recBatteryKW >= 1000 ? `${(recBatteryKW / 1000).toFixed(1)} MW` : `${Math.round(recBatteryKW)} kW`} power @ 4hr duration
                        </p>
                      </div>
                      
                      {/* Solar or Peak Demand */}
                      {recSolarKW > 0 ? (
                        <div className="p-5 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl border border-amber-400/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="w-6 h-6 text-amber-400" />
                            <span className="text-amber-300 font-bold">Solar Array</span>
                          </div>
                          <p className="text-3xl font-black text-white mb-1">
                            {recSolarKW >= 1000 ? `${(recSolarKW / 1000).toFixed(1)} MW` : `${Math.round(recSolarKW)} kW`}
                          </p>
                          <p className="text-amber-400/70 text-sm">
                            ~{solarHours.toFixed(1)} hours avg sunlight in your area
                          </p>
                        </div>
                      ) : (
                        <div className="p-5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl border border-purple-400/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-6 h-6 text-purple-400" />
                            <span className="text-purple-300 font-bold">Peak Demand</span>
                          </div>
                          <p className="text-3xl font-black text-white mb-1">
                            {peakKW >= 1000 ? `${(peakKW / 1000).toFixed(1)} MW` : `${Math.round(peakKW)} kW`}
                          </p>
                          <p className="text-purple-400/70 text-sm">
                            Estimated peak electrical load
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Info box - Reassuring message */}
                    <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-400/30 mb-5">
                      <p className="text-indigo-200 text-sm leading-relaxed">
                        <span className="font-bold">📌 This is just a starting point!</span> You can adjust these values in the 
                        Configuration step. At the end, I'll show you my final recommendation and you can decide what works best for your needs.
                      </p>
                    </div>
                    
                    {/* Why this size */}
                    <div className="p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
                      <p className="text-purple-200 text-sm leading-relaxed">
                        <span className="font-bold">💡 How I calculated this:</span> Industry data shows {industryName.toLowerCase()} facilities 
                        typically operate at 70-85% of peak capacity. This estimate ensures adequate coverage for peak shaving, 
                        demand charge reduction, and backup power scenarios.
                      </p>
                    </div>
                  </>
                );
              })()}
              
              {/* Single action button - Just continue, no decision needed */}
              <button
                onClick={() => setShowMerlinRecommendation(false)}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold text-lg transition-all hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3"
              >
                <Sparkles className="w-5 h-5" />
                Got it, let's continue!
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PERSISTENT MERLIN RECOMMENDATION BANNER - Shows until final quote */}
      {showMerlinBanner && merlinRecommendation && wizard.currentSection < 5 && !showMerlinRecommendation && (
        <div className="fixed bottom-4 left-4 z-[9998] max-w-sm">
          <div className="bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-4">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Merlin's Recommendation</p>
                <p className="text-purple-300 text-xs">
                  {merlinRecommendation.batteryKW >= 1000 
                    ? `${(merlinRecommendation.batteryKW / 1000).toFixed(1)} MW` 
                    : `${Math.round(merlinRecommendation.batteryKW)} kW`} battery
                  {merlinRecommendation.solarKW > 0 && (
                    <> + {merlinRecommendation.solarKW >= 1000 
                      ? `${(merlinRecommendation.solarKW / 1000).toFixed(1)} MW` 
                      : `${Math.round(merlinRecommendation.solarKW)} kW`} solar</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowMerlinRecommendation(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="View details"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => setShowMerlinBanner(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR REMOVED - Merlin guidance is now integrated into the wizard flow */}
      
      {/* TRUEQUOTE EXPLAINER MODAL */}
      {showTrueQuoteExplainer && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">TrueQuote™ Methodology</h3>
                    <p className="text-sm text-gray-500">Every number is traceable to an authoritative source</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrueQuoteExplainer(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* What is TrueQuote */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h4 className="font-bold text-indigo-800 mb-2">What is TrueQuote™?</h4>
                <p className="text-sm text-gray-700">
                  TrueQuote™ ensures every cost estimate, financial projection, and recommendation in your quote 
                  is backed by verifiable industry data. Unlike generic calculators, we show you <strong>exactly where 
                  our numbers come from</strong> - government databases, industry benchmarks, and real market data.
                </p>
              </div>
              
              {/* Data Sources */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-3">Our Data Sources</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="font-bold text-emerald-700 text-sm mb-1">🏛️ Government</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• NREL ATB 2024 (battery costs)</li>
                      <li>• IRA 2022 (tax credits)</li>
                      <li>• EIA state electricity rates</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-bold text-blue-700 text-sm mb-1">📊 Industry Research</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• NREL Cost Benchmark (solar)</li>
                      <li>• ASHRAE (building loads)</li>
                      <li>• CBECS (commercial energy)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="font-bold text-amber-700 text-sm mb-1">🏭 Market Data</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• Vendor pricing sheets</li>
                      <li>• Regional market rates</li>
                      <li>• Demand charge averages</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="font-bold text-purple-700 text-sm mb-1">📍 Geographic</div>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      <li>• Solar irradiance data</li>
                      <li>• Grid reliability scores</li>
                      <li>• State incentive programs</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* How We Calculate */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-3">How We Calculate Your Quote</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">1</div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">Power Demand Analysis</div>
                      <p className="text-xs text-gray-600">We calculate your peak demand using industry standards (ASHRAE, CBECS) for your facility type, then validate against your utility bill data.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">2</div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">Equipment Sizing</div>
                      <p className="text-xs text-gray-600">Battery capacity is sized to cover peak demand + runtime hours. Solar is sized based on your location's irradiance data and available space.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">3</div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">Cost Estimation</div>
                      <p className="text-xs text-gray-600">Equipment costs use NREL benchmarks ($100-175/kWh for batteries, $0.65-0.85/W for solar) adjusted for your region and scale.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">4</div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">Financial Projections</div>
                      <p className="text-xs text-gray-600">ROI and payback use your actual electricity rates, demand charges, and applicable incentives (30% ITC from IRA 2022, state rebates).</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-600">100%</div>
                  <div className="text-xs text-gray-500">Transparent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600">50+</div>
                  <div className="text-xs text-gray-500">Data Sources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-purple-600">Real</div>
                  <div className="text-xs text-gray-500">Market Data</div>
                </div>
              </div>
              
              <button
                onClick={() => setShowTrueQuoteExplainer(false)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-xl font-bold transition-colors hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700"
              >
                Got it - Show Me My Quote!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How to Use Wizard Help Modal */}
      {showWizardHelp && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWizardHelp(false)} />
          <div className="relative bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-cyan-900/95 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-emerald-400/30 animate-in zoom-in duration-200">
            <button
              onClick={() => setShowWizardHelp(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">How to Use This Wizard</h3>
                <p className="text-sm text-emerald-300">Get the best results in 5 easy steps</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center text-purple-300 font-bold">1</div>
                <div>
                  <p className="text-white font-semibold">Select Your Location</p>
                  <p className="text-sm text-gray-300">Choose your state for accurate electricity rates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center text-purple-300 font-bold">2</div>
                <div>
                  <p className="text-white font-semibold">Choose Your Industry</p>
                  <p className="text-sm text-gray-300">Pick the type that best matches your facility</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center text-purple-300 font-bold">3</div>
                <div>
                  <p className="text-white font-semibold">Enter Facility Details</p>
                  <p className="text-sm text-gray-300">Merlin calculates your energy needs in real-time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center text-purple-300 font-bold">4</div>
                <div>
                  <p className="text-white font-semibold">Set Your Goals</p>
                  <p className="text-sm text-gray-300">Tell us what you want to achieve with energy storage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-300 font-bold">5</div>
                <div>
                  <p className="text-white font-semibold">Get Your Quote</p>
                  <p className="text-sm text-gray-300">Review Merlin's recommendation or customize your system</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <p className="font-bold text-amber-300">Pro Tip</p>
              </div>
              <p className="text-sm text-amber-100">
                Click the <strong>TrueQuote™</strong> button on the left to see exactly how we calculate your quote - every number is backed by industry sources!
              </p>
            </div>
            
            <button
              onClick={() => setShowWizardHelp(false)}
              className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-xl font-bold transition-colors hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Accept/Customize Modal - Dec 14, 2025 CRITICAL FIX #2 */}
      {wizard.showAcceptCustomizeModal && wizard.wizardState.quoteResult && (
        <AcceptCustomizeModal
          isOpen={wizard.showAcceptCustomizeModal}
          onClose={() => wizard.setShowAcceptCustomizeModal(false)}
          onAccept={wizard.handleAcceptAI}
          onCustomize={wizard.handleCustomize}
          quoteResult={wizard.wizardState.quoteResult}
          verticalName={
            wizard.wizardState.selectedIndustry 
              ? wizard.wizardState.selectedIndustry.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
              : 'Your Facility'
          }
          facilityDetails={{
            name: wizard.wizardState.industryName || 'Your Facility',
            size: wizard.centralizedState?.calculated?.totalPeakDemandKW 
              ? `${Math.round(wizard.centralizedState.calculated.totalPeakDemandKW)} kW Peak Demand`
              : undefined,
            location: wizard.wizardState.state || undefined,
          }}
          systemSummary={{
            bessKW: wizard.centralizedState?.calculated?.recommendedBatteryKW || 0,
            bessKWh: wizard.centralizedState?.calculated?.recommendedBatteryKWh || 0,
            solarKW: wizard.centralizedState?.calculated?.recommendedSolarKW || 0,
            paybackYears: wizard.wizardState.quoteResult.financials?.paybackYears || 0,
            annualSavings: wizard.wizardState.quoteResult.financials?.annualSavings || 0,
          }}
          colorScheme="purple"
        />
      )}
    </div>
  );
}
