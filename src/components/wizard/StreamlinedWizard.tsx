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
import { X, Sparkles, MapPin, Building2, Target, Settings, FileText, Wand2, Battery, Zap, HelpCircle, Sun, Award, AlertTriangle, CheckCircle, Lightbulb, Menu, Calculator, Search, Home, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

// Modular components
import { useStreamlinedWizard } from './hooks';
import { TrueQuoteBadge } from '../shared/TrueQuoteBadge';
import { TrueQuoteModal } from '../shared/TrueQuoteModal';
import { FloatingNavWidget, WizardBottomNav, ConfigurationSummary, SignupForm } from './shared';
import { SavingsScoutNavbar } from './indicators/SavingsScoutWidget';
import {
  WelcomeLocationSection,
  Step1LocationGoals,  // NEW: Dec 18, 2025 - Two-column Location + Goals
  Step2IndustrySize,   // NEW: Dec 18, 2025 - Industry + Key Size + Educational Merlin
  Step3FacilityDetails, // NEW: Dec 18, 2025 - Redesigned Facility Details
  IndustrySection,
  FacilityDetailsSection,
  FacilityDetailsSectionV2,
  GoalsSection,
  GoalsSectionV2,
  GoalsSectionV3,
  Step4MagicFit,
  QuoteResultsSection,
  ScenarioComparison,
  ScenarioSection,
  ConfigurationComparison,
} from './sections';
import ScenarioSectionV2 from './sections/ScenarioSectionV2';
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
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
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
      {/* Floating Nav Widget - Option 1 (Recommended) - Replaces top nav bar */}
      <FloatingNavWidget
        wizardState={wizard.wizardState}
        centralizedState={wizard.centralizedState}
        onOpenSidebarMenu={() => setShowSidebarMenu(!showSidebarMenu)}
        onOpenTrueQuote={() => setShowTrueQuoteModal(true)}
        onOpenSolarOpportunity={() => setShowSolarOpportunity(true)}
        onOpenPowerProfileExplainer={() => setShowPowerProfileExplainer(true)}
        onClose={onClose}
        onNavigateToSection={(section) => wizard.advanceToSection(section)}
        currentSection={wizard.currentSection}
      />
      
      {/* REMOVED: Old top nav bar - replaced by FloatingNavWidget above */}
      {/* Header - Collapsible - REMOVED */}
      {/* <header className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${
        showTopNavBar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}> */}

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
              
              {/* Wizard Sections - SIMPLIFIED to 5 steps (Dec 18, 2025) */}
              <p className="text-xs text-purple-300 uppercase tracking-wider px-4 mb-2">Wizard Steps</p>
              
              {['Location', 'Industry', 'Facility Details', 'Goals & Config', 'Your Quote'].map((step, index) => (
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

      {/* Progress Bar - REMOVED per user request - top purple nav bar was irritating */}

      {/* Main Content - FULL WIDTH (no top nav bar, using FloatingNavWidget) */}
      <div className="min-h-full pt-6 pb-[120px]">
        {/* Scrollable Content Area - Now full width */}
        <main
          ref={containerRef}
          className="min-h-full"
        >
          {/* No transition overlay - immediate navigation */}
          <div>
            {/* Section 0: Location + Goals (Two-Column Layout) - NEW Dec 18, 2025 */}
            <Step1LocationGoals
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              onZipChange={wizard.handleZipCodeChange}
              onStateSelect={wizard.handleStateSelect}
              onInternationalSelect={wizard.handleInternationalSelect}
              onContinue={() => {
                console.log('🎯 [Step1] Continue clicked - advancing to Step 2 (Industry Selection)');
                console.log('🎯 [Step1] Current section BEFORE advance:', wizard.currentSection);
                wizard.completeSection('location');
                wizard.advanceToSection(1);
                // Log after a brief delay to see the actual state
                setTimeout(() => {
                  console.log('🎯 [Step1] Current section AFTER advance (delayed check):', wizard.currentSection);
                }, 50);
              }}
              onOpenProQuote={onOpenAdvanced}
              onOpenTrueQuote={() => setShowTrueQuoteModal(true)}
              isHidden={wizard.currentSection !== 0}
            />

            {/* Section 1: Industry + Key Size (NEW Dec 18, 2025 - Educational Merlin) */}
            <Step2IndustrySize
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              availableUseCases={wizard.availableUseCases}
              isLoadingUseCases={wizard.isLoadingUseCases}
              onIndustrySelect={wizard.handleIndustrySelect}
              onBack={() => {
                console.log('🎯 [StreamlinedWizard] Step 2 back clicked - going to Step 1');
                wizard.advanceToSection(0);
              }}
              onHome={undefined}
              onContinue={() => {
                console.log('🎯 [StreamlinedWizard] Step 2 onContinue called - advancing to Section 2 (Facility Details)');
                wizard.completeSection('industry');
                wizard.advanceToSection(2);
                console.log('🎯 [StreamlinedWizard] Current section after advance:', wizard.currentSection);
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
              onHome={undefined}
              onContinue={async () => {
                wizard.completeSection('facility');
                // Advance immediately - don't block UI
                console.log('🎯 [FACILITY] Continue clicked - advancing to Magic Fit immediately...');
                wizard.advanceToSection(3);
                // Generate scenarios in background (Step 4 will show loading state)
                wizard.generateAllScenarios().catch(err => {
                  console.error('❌ [FACILITY] Failed to generate scenarios:', err);
                });
              }}
              isHidden={wizard.currentSection !== 2}
              currentSection={wizard.currentSection}
            />

            {/* ═══════════════════════════════════════════════════════════════
                SIMPLIFIED FLOW (Dec 20, 2025):
                Section 0: Location & Goals
                Section 1: Industry Selection
                Section 2: Facility Details
                Section 3: Magic Fit (3 cards) - with inline customization (solar/generator only)
                Section 4: Quote Results
            ═══════════════════════════════════════════════════════════════ */}
            
            {/* Section 3: Magic Fit - 3 Preconfigured Options with Inline Customization */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || 0;
              const batteryKW = wizard.wizardState.batteryKW || 0;
              const solarKW = wizard.wizardState.solarKW || 0;
              const generatorKW = wizard.wizardState.generatorKW || 0;
              const totalConfiguredKW = batteryKW + solarKW + generatorKW;
              const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 100;
              
              return wizard.currentSection === 3 ? (
                <Step4MagicFit
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={3}
                  sectionRef={(el) => { sectionRefs.current[3] = el; }}
                  onBack={() => wizard.advanceToSection(2)}
                  onContinue={async () => {
                    // Advance immediately - don't block UI
                    console.log('🎯 [MAGIC FIT] Continue clicked - advancing to Quote Results immediately...');
                    wizard.completeSection('configuration');
                    wizard.advanceToSection(4); // Quote Results
                    // Generate quote in background (Step 5 will show loading state)
                    wizard.generateQuote().catch(err => {
                      console.error('❌ [MAGIC FIT] Failed to generate quote:', err);
                    });
                  }}
                  onOpenProQuote={onOpenAdvanced}
                  scenarioResult={wizard.wizardState.scenarioResult || null}
                  isGenerating={wizard.isGeneratingScenarios}
                  onGenerateScenarios={wizard.generateAllScenarios}
                  peakDemandKW={peakDemandKW}
                  powerCoverage={powerCoverage}
                  onSelectScenario={(scenario) => {
                    wizard.setWizardState(prev => ({
                      ...prev,
                      selectedScenario: scenario,
                      batteryKW: scenario.batteryKW,
                      batteryKWh: scenario.batteryKWh,
                      durationHours: scenario.durationHours,
                      solarKW: scenario.solarKW || 0,
                      generatorKW: scenario.generatorKW || 0,
                    }));
                    // No modal - user proceeds directly to quote results
                  }}
                />
              ) : null;
            })()}

            {/* Section 4: Quote Results - THE FINAL STEP */}
            {wizard.currentSection === 4 && wizard.wizardState.quoteResult && !wizard.wizardState.isCalculating && (
              <QuoteResultsSection
                wizardState={wizard.wizardState}
                setWizardState={wizard.setWizardState}
                currentSection={wizard.currentSection}
                sectionRef={(el) => { sectionRefs.current[4] = el; }}
                premiumConfig={wizard.premiumConfig}
                premiumComparison={wizard.premiumComparison}
                onBack={() => wizard.advanceToSection(3)}
                onHome={undefined}
                onStartNew={() => {
                  wizard.setCurrentSection(0);
                  wizard.setCompletedSections([]);
                  wizard.setTotalPoints(0);
                }}
                onOpenAdvanced={onOpenAdvanced}
              />
            )}
            {wizard.currentSection === 4 && !wizard.wizardState.quoteResult && (
              <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-white font-bold text-xl">Generating your quote...</p>
                  <p className="text-gray-400 mt-2">This takes just a moment</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      <WizardBottomNav
        currentStep={wizard.currentSection}
        totalSteps={5}
        stepName={
          wizard.currentSection === 0 ? 'Location & Goals' :
          wizard.currentSection === 1 ? 'Industry Selection' :
          wizard.currentSection === 2 ? 'Facility Details' :
          wizard.currentSection === 3 ? 'Choose Strategy' :
          'Your Quote'
        }
        canGoBack={wizard.currentSection > 0}
        canGoForward={
          wizard.currentSection === 0 ? (!!wizard.wizardState.state && wizard.wizardState.goals.length > 0) :
          wizard.currentSection === 1 ? !!wizard.wizardState.selectedIndustry :
          wizard.currentSection === 2 ? true : // Facility details validation handled internally
          wizard.currentSection === 3 ? !!wizard.wizardState.selectedScenario :
          false
        }
        onBack={() => wizard.advanceToSection(wizard.currentSection - 1)}
        onForward={() => {
          if (wizard.currentSection === 0) {
            wizard.completeSection('location');
            wizard.advanceToSection(1);
          } else if (wizard.currentSection === 1) {
            wizard.completeSection('industry');
            wizard.advanceToSection(2);
          } else if (wizard.currentSection === 2) {
            wizard.completeSection('facility');
            wizard.generateAllScenarios().then(() => {
              wizard.advanceToSection(3);
            });
          } else if (wizard.currentSection === 3) {
            // Advance immediately, generate in background
            wizard.advanceToSection(4);
            wizard.generateQuote().catch(err => {
              console.error('❌ [WizardBottomNav] Failed to generate quote:', err);
            });
          }
        }}
        forwardLabel={
          wizard.currentSection === 3 ? 'See My Results' :
          wizard.currentSection === 4 ? undefined :
          'Continue'
        }
        // Step 3 progress ring props
        answeredCount={
          wizard.currentSection === 2 
            ? (() => {
                const excludedFields = [
                  'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
                  'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
                  'wantsSolar', 'hasEVCharging', 'evChargerCount', 'existingEVChargers', 
                  'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
                ];
                const filteredQuestions = (wizard.wizardState.customQuestions || []).filter(
                  (q: any) => q && !excludedFields.includes(q.field_name)
                );
                let count = 0;
                filteredQuestions.forEach((q: any) => {
                  const value = wizard.wizardState.useCaseData?.[q.field_name];
                  if (value !== undefined && value !== null && value !== '') count++;
                });
                return count;
              })()
            : undefined
        }
        totalQuestions={
          wizard.currentSection === 2
            ? (() => {
                const excludedFields = [
                  'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
                  'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
                  'wantsSolar', 'hasEVCharging', 'evChargerCount', 'existingEVChargers', 
                  'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
                ];
                return (wizard.wizardState.customQuestions || []).filter(
                  (q: any) => q && !excludedFields.includes(q.field_name)
                ).length;
              })()
            : undefined
        }
      />
      
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
      
      {/* Solar Opportunity Modal */}
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
                
                const ratingDescriptions: Record<number, { label: string; color: string; description: string }> = {
                  1: { label: 'Limited', color: 'text-gray-500', description: 'Solar can still offset 30-40% of energy use' },
                  2: { label: 'Fair', color: 'text-blue-500', description: 'Good for commercial solar installations' },
                  3: { label: 'Good', color: 'text-emerald-500', description: 'Strong solar potential - recommended' },
                  4: { label: 'Excellent', color: 'text-amber-500', description: 'Outstanding solar resource - highly recommended' },
                  5: { label: 'Exceptional', color: 'text-orange-500', description: 'Premium solar location - maximize your array!' },
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
      
      {/* PERSISTENT MERLIN RECOMMENDATION BANNER - Only show on Step 3 (Facility Details) */}
      {showMerlinBanner && merlinRecommendation && wizard.currentSection === 2 && !showMerlinRecommendation && (
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

      {/* AcceptCustomizeModal removed - Step 4 now goes directly to Step 5 (Quote Results) */}

      {/* TrueQuote Modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        onGetQuote={() => {
          setShowTrueQuoteModal(false);
        }}
      />
      
      {/* Configuration Summary - Floating Sidebar - REMOVED per user request */}
      {/* User found the side panel cluttering the UI - commenting out
      <ConfigurationSummary
        currentStep={wizard.currentSection}
        location={{
          state: wizard.wizardState.state,
          zipCode: wizard.wizardState.zipCode,
          utilityRate: wizard.wizardState.electricityRate,
        }}
        goals={wizard.wizardState.goals}
        industry={{
          name: wizard.wizardState.industryName,
          id: wizard.wizardState.selectedIndustry,
        }}
        facilitySize={{
          rooms: wizard.wizardState.useCaseData?.roomCount || wizard.wizardState.useCaseData?.rooms,
          squareFootage: wizard.wizardState.useCaseData?.squareFootage,
          bayCount: wizard.wizardState.useCaseData?.bayCount,
        }}
        amenities={(() => {
          // Extract amenities from useCaseData
          const amenities: Array<{ name: string; category?: string }> = [];
          const data = wizard.wizardState.useCaseData || {};
          if (data.hasPool) amenities.push({ name: 'Pool', category: 'Aquatics' });
          if (data.hasGym) amenities.push({ name: 'Gym', category: 'Fitness' });
          if (data.hasRestaurant) amenities.push({ name: 'Restaurant', category: 'Dining' });
          if (data.hasEVChargers || data.hasEVCharging) amenities.push({ name: 'EV Chargers', category: 'Transportation' });
          return amenities;
        })()}
        selectedStrategy={wizard.wizardState.selectedScenario ? {
          name: wizard.wizardState.selectedScenario.name || 'Selected Strategy',
          batteryKW: wizard.wizardState.selectedScenario.batteryKW,
          batteryKWh: wizard.wizardState.selectedScenario.batteryKWh,
          solarKW: wizard.wizardState.selectedScenario.solarKW,
          generatorKW: wizard.wizardState.selectedScenario.generatorKW,
          annualSavings: wizard.wizardState.selectedScenario.annualSavings,
        } : undefined}
        quoteSummary={wizard.wizardState.quoteResult ? {
          annualSavings: wizard.wizardState.quoteResult.financials?.annualSavings,
          paybackYears: wizard.wizardState.quoteResult.financials?.paybackYears,
          totalCost: wizard.wizardState.quoteResult.costs?.totalProjectCost || wizard.wizardState.quoteResult.costs?.netCost,
        } : undefined}
      />
      */}
      
      {/* Signup Form - Only on Step 5 */}
      {wizard.currentSection === 4 && wizard.wizardState.quoteResult && (
        <SignupForm
          onSignup={async (data) => {
            // TODO: Implement actual signup API call
            console.log('User signup:', data);
            // For now, just log it
            return Promise.resolve();
          }}
        />
      )}
    </div>
  );
}
