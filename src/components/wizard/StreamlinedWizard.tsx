/**
 * STREAMLINED SMART WIZARD (Refactored)
 * ======================================
 * 
 * December 2025 Refactor: Lean orchestrator using modular components.
 * 
 * Architecture:
 * - useStreamlinedWizard hook manages all state
 * - Section components render UI
 * - This file is now ~350 lines (down from 4,677)
 * 
 * Flow:
 * 1. Welcome + Location (Section 0) - auto-advances when location selected
 * 2. Industry Selection (Section 1) - auto-advances when industry selected
 * 3. Facility Details (Section 2) - custom questions per industry
 * 4. Goals & Add-ons (Section 3) - what user wants to achieve
 * 5. System Configuration (Section 4) - battery + solar sizing
 * 6. Quote Results (Section 5) - final quote with downloads
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { X, Sparkles, MapPin, Building2, Target, Settings, FileText, Wand2, Battery, Zap, HelpCircle, Sun, Award, AlertTriangle, CheckCircle, Lightbulb, Menu, Calculator, Search, Home, ChevronLeft, ChevronRight } from 'lucide-react';

// Modular components
import { useStreamlinedWizard } from './hooks';
import { TrueQuoteBadge } from '../shared/TrueQuoteBadge';
import { AcceptCustomizeModal } from './shared';
import { SavingsScoutNavbar } from './indicators/SavingsScoutWidget';
import {
  WelcomeLocationSection,
  IndustrySection,
  FacilityDetailsSection,
  FacilityDetailsSectionV2,
  GoalsSection,
  GoalsSectionV2,
  QuoteResultsSection,
  ScenarioComparison,
  ScenarioSection,
  ConfigurationComparison,
} from './sections';
import ScenarioSectionV2 from './sections/ScenarioSectionV2';
import { ConfigurationConfirmModal } from './modals';
import FloatingWidgets from './FloatingWidgets';
import merlinImage from '@/assets/images/new_Merlin.png';

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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Branding */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebarMenu(!showSidebarMenu)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Clickable Merlin Assistant */}
              <button
                onClick={() => setShowMerlinRecommendation(true)}
                className="flex items-center gap-3 hover:bg-white/5 rounded-xl px-2 py-1 transition-all group"
                title="Click for Merlin's help and recommendations"
              >
                <div className="relative">
                  <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-purple-900 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg group-hover:text-purple-200 transition-colors">Merlin Energy</h1>
                  <p className="text-emerald-400 text-xs font-semibold group-hover:text-emerald-300 transition-colors">
                    Click for help
                  </p>
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Solar Opportunity - Clickable sun icons - ALWAYS show if state is selected */}
              {(() => {
                // Use geo data if available, otherwise estimate from state
                const geoSolarHours = wizard.wizardState.geoRecommendations?.profile?.avgSolarHoursPerDay || 0;
                const hasState = !!wizard.wizardState.state;
                
                // Default solar hours by region if geo not available
                const getDefaultSolarHours = (state: string): number => {
                  const highSolarStates = ['Arizona', 'California', 'Nevada', 'New Mexico', 'Texas', 'Florida', 'Hawaii'];
                  const medSolarStates = ['Colorado', 'Utah', 'Georgia', 'North Carolina', 'Oklahoma', 'Kansas'];
                  if (highSolarStates.some(s => state.toLowerCase().includes(s.toLowerCase()))) return 6;
                  if (medSolarStates.some(s => state.toLowerCase().includes(s.toLowerCase()))) return 5;
                  return 4.5; // Default for other states
                };
                
                const solarHours = geoSolarHours > 0 ? geoSolarHours : (hasState ? getDefaultSolarHours(wizard.wizardState.state) : 0);
                
                // Calculate sun rating (1-5 based on solar hours: 3h=1, 4h=2, 5h=3, 6h=4, 7h+=5)
                const sunRating = hasState ? Math.min(5, Math.max(1, Math.round(solarHours - 2))) : 0;
                
                if (!hasState) return null;
                
                return (
                  <button
                    onClick={() => setShowSolarOpportunity(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-400/30"
                    title={`${solarHours.toFixed(1)} hours avg solar - Click for details`}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Sun 
                        key={i}
                        className={`w-5 h-5 transition-all ${
                          i <= sunRating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-amber-400/20'
                        }`}
                      />
                    ))}
                  </button>
                );
              })()}
              
              {/* Power Profile - Total System Power (Battery + Solar + Generator) */}
              {(() => {
                // ONLY show user-configured values, no fallbacks to recommended
                // This keeps header and configuration section in sync
                const batteryKW = wizard.wizardState.batteryKW || 0;
                const batteryKWh = wizard.wizardState.batteryKWh || 0;
                const solarKW = wizard.wizardState.solarKW || 0;
                const generatorKW = wizard.wizardState.generatorKW || 0;
                
                // Totals - Show BATTERY STORAGE ONLY (not daily solar production)
                const totalPowerKW = batteryKW + solarKW + generatorKW;
                const totalStorageKWh = batteryKWh; // Battery storage capacity
                
                // Format the display
                const formatEnergy = (kwh: number) => {
                  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`;
                  return `${Math.round(kwh)} kWh`;
                };
                const formatPower = (kw: number) => {
                  if (kw >= 1000) return `${(kw / 1000).toFixed(1)} MW`;
                  return `${Math.round(kw)} kW`;
                };
                
                // Show "calculating" state if no data yet
                const hasData = totalPowerKW > 0 || totalStorageKWh > 0;
                
                return (
                  <button
                    onClick={() => setShowPowerProfileExplainer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 rounded-xl hover:from-emerald-500/40 hover:to-teal-500/40 transition-all shadow-lg"
                  >
                    <Battery className="w-5 h-5 text-emerald-400" />
                    <div className="flex flex-col items-start">
                      <span className="text-emerald-300 font-black text-lg leading-tight">
                        {hasData ? formatEnergy(totalStorageKWh) : '—'}
                      </span>
                      <span className="text-emerald-400/70 text-[10px] leading-tight">
                        {hasData ? `${formatPower(totalPowerKW)} total` : 'Configure system'}
                      </span>
                    </div>
                    <HelpCircle className="w-4 h-4 text-emerald-400/60" />
                  </button>
                );
              })()}
              
              {/* Power Gap - PROMINENTLY LARGER with pulse when underpowered */}
              {(() => {
                // Get peak demand from centralized calculations
                const calc = wizard.centralizedState?.calculated || {};
                
                // ONLY use totalPeakDemandKW - never fall back to recommendedBatteryKW
                const peakDemandKW = calc.totalPeakDemandKW || 0;
                
                // Get configured power - use ONLY user-configured values
                // Don't auto-fill from recommended, only use what user has explicitly set
                const batteryKW = wizard.wizardState.batteryKW || 0;
                const solarKW = wizard.wizardState.solarKW || 0;
                const generatorKW = wizard.wizardState.generatorKW || 0;
                const totalConfiguredKW = batteryKW + solarKW + generatorKW;
                
                // Debug logging
                console.log('🔌 [PowerGap Header]:', {
                  peakDemandKW,
                  totalConfiguredKW,
                  batteryKW,
                  solarKW,
                  generatorKW,
                  calc,
                });
                
                // Calculate coverage percentage - cap at 200% for display sanity
                const rawCoverage = peakDemandKW > 0 
                  ? Math.round((totalConfiguredKW / peakDemandKW) * 100)
                  : 0;
                const coverage = Math.min(rawCoverage, 200); // Cap display at 200%
                const isCovered = rawCoverage >= 100;
                const isPartial = rawCoverage >= 50 && rawCoverage < 100;
                const isCritical = rawCoverage > 0 && rawCoverage < 50; // Severely underpowered!
                const hasIndustry = !!wizard.wizardState.selectedIndustry;
                const hasPeakDemand = peakDemandKW > 0;
                const hasPowerConfig = totalConfiguredKW > 0;
                const hasData = hasPeakDemand && hasPowerConfig;
                
                // Don't show power gap until user has configured something
                if (!hasPowerConfig) return null;
                
                // Determine the status message
                const statusMessage = (() => {
                  if (!hasIndustry) return 'Select industry first';
                  if (!hasPeakDemand) return 'Complete facility details';
                  if (!hasPowerConfig) return `Need ${Math.round(peakDemandKW).toLocaleString()} kW`;
                  if (isCovered) return '✓ Power covered';
                  if (isCritical) return `⚠ Need ${Math.round(peakDemandKW - totalConfiguredKW).toLocaleString()} kW more!`;
                  return `Need ${Math.round(peakDemandKW - totalConfiguredKW).toLocaleString()} kW more`;
                })();
                
                // Show warning state when we know demand but have no power configured
                const showWarning = hasPeakDemand && !hasPowerConfig;
                
                return (
                  <button
                    onClick={() => setShowPowerProfileExplainer(true)}
                    className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all shadow-xl ${
                      isCritical || showWarning ? 'animate-pulse' : ''
                    } ${
                      !hasData && !showWarning
                        ? 'bg-gradient-to-r from-slate-500/30 to-gray-500/30 border-slate-400/50'
                        : showWarning
                          ? 'bg-gradient-to-r from-amber-500/40 to-orange-500/40 border-amber-400/60'
                          : isCovered
                            ? 'bg-gradient-to-r from-emerald-500/40 to-green-500/40 border-emerald-400/60'
                            : isPartial
                              ? 'bg-gradient-to-r from-amber-500/40 to-yellow-500/40 border-amber-400/60'
                              : 'bg-gradient-to-r from-red-500/50 to-orange-500/50 border-red-400/70 shadow-red-500/40 shadow-2xl'
                    }`}
                  >
                    {/* MUCH Larger icon with warning indicator for critical */}
                    <div className="relative">
                      <Zap className={`w-10 h-10 ${
                        !hasData && !showWarning ? 'text-slate-400' : showWarning ? 'text-amber-400' : isCovered ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      {(isCritical || showWarning) && (
                        <AlertTriangle className="absolute -top-1.5 -right-1.5 w-5 h-5 text-amber-300 animate-bounce" />
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-3">
                        {/* MUCH Larger Progress bar */}
                        <div className="w-36 h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              !hasData && !showWarning
                                ? 'bg-slate-400'
                                : showWarning
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                  : isCovered 
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-400'
                                    : isPartial
                                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                                      : 'bg-gradient-to-r from-red-400 to-orange-400'
                            }`}
                            style={{ width: hasData ? `${Math.min(100, coverage)}%` : showWarning ? '5%' : '0%' }}
                          />
                        </div>
                        <span className={`text-2xl font-black ${
                          !hasData && !showWarning ? 'text-slate-300' : showWarning ? 'text-amber-300' : isCovered ? 'text-emerald-300' : isPartial ? 'text-amber-300' : 'text-red-300'
                        }`}>
                          {hasData ? `${coverage}%` : showWarning ? '0%' : '—'}
                        </span>
                      </div>
                      <span className={`text-sm leading-tight font-bold ${
                        !hasData && !showWarning ? 'text-slate-400/70' : showWarning ? 'text-amber-400/80' : isCovered ? 'text-emerald-400/80' : isPartial ? 'text-amber-400/80' : 'text-red-300'
                      }`}>
                        {statusMessage}
                      </span>
                    </div>
                  </button>
                );
              })()}
              
              {/* Energy Opportunity Widget - Fire icons for savings opportunities */}
              {(() => {
                const geo = wizard.wizardState.geoRecommendations;
                const calc = wizard.centralizedState?.calculated || {};
                const hasData = wizard.wizardState.state && (geo || calc.totalPeakDemandKW > 0);
                
                if (!hasData) return null;
                
                return (
                  <div className="hidden lg:block">
                    <SavingsScoutNavbar
                      state={wizard.wizardState.state}
                      industryProfile={wizard.wizardState.selectedIndustry || 'hotel'}
                      peakDemandKW={calc.totalPeakDemandKW || 200}
                      facilityDetails={{
                        rooms: wizard.wizardState.useCaseData?.rooms || wizard.wizardState.useCaseData?.roomCount || 100,
                        hasEVChargers: wizard.wizardState.useCaseData?.hasEVChargers || false,
                        evChargerCount: wizard.wizardState.useCaseData?.evChargerCount || 0,
                        evChargersL2: wizard.wizardState.evChargersL2 || 0,
                        evChargersDCFC: wizard.wizardState.evChargersDCFC || 0,
                        gridConnection: wizard.wizardState.gridConnection as any || 'on-grid',
                      }}
                      onGetQuote={() => wizard.setCurrentSection(5)}
                      onFullAnalysis={() => wizard.setCurrentSection(3)}
                    />
                  </div>
                );
              })()}
              
              {/* Points Badge (smaller now) */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300 font-bold text-xs">{wizard.totalPoints}</span>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
              
              {/* Wizard Sections */}
              <p className="text-xs text-purple-300 uppercase tracking-wider px-4 mb-2">Wizard Steps</p>
              
              {['Location', 'Industry', 'Facility Details', 'Goals', 'Configuration', 'Quote'].map((step, index) => (
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
      <div className="h-full pt-16">
        {/* Scrollable Content Area - Now full width */}
        <main
          ref={containerRef}
          className="h-full overflow-y-auto scroll-smooth"
        >
          <div className={`transition-opacity duration-300 ${wizard.isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Section 0: Welcome + Location + Goals */}
            <WelcomeLocationSection
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              onZipChange={wizard.handleZipCodeChange}
              onStateSelect={wizard.handleStateSelect}
              onInternationalSelect={wizard.handleInternationalSelect}
              onContinue={() => {
                wizard.completeSection('location');
                wizard.advanceToSection(1);
              }}
              onOpenAdvanced={onOpenAdvanced}
              isHidden={wizard.currentSection !== 0}
            />

            {/* Section 1: Industry Selection */}
            <IndustrySection
              wizardState={wizard.wizardState}
              availableUseCases={wizard.availableUseCases}
              isLoadingUseCases={wizard.isLoadingUseCases}
              groupedUseCases={wizard.groupedUseCases}
              onIndustrySelect={wizard.handleIndustrySelect}
              onBack={() => wizard.advanceToSection(0)}
              isHidden={wizard.currentSection !== 1}
            />

            {/* Section 2: Facility Details */}
            {/* Use V2 for hotel vertical (smart dropdowns + pill buttons) */}
            {wizard.wizardState.selectedIndustry === 'hotel' ? (
              <FacilityDetailsSectionV2
                wizardState={wizard.wizardState}
                setWizardState={wizard.setWizardState}
                currentSection={wizard.currentSection}
                initializedFromVertical={wizard.initializedFromVertical}
                sectionRef={(el) => { sectionRefs.current[2] = el; }}
                onBack={() => wizard.advanceToSection(1)}
                onContinue={() => {
                  wizard.completeSection('facility');
                  // Go to Goals/Preferences (Section 3)
                  wizard.advanceToSection(3);
                }}
              />
            ) : (
              <FacilityDetailsSection
                wizardState={wizard.wizardState}
                setWizardState={wizard.setWizardState}
                currentSection={wizard.currentSection}
                initializedFromVertical={wizard.initializedFromVertical}
                sectionRef={(el) => { sectionRefs.current[2] = el; }}
                onBack={() => wizard.advanceToSection(1)}
                onContinue={() => {
                  wizard.completeSection('facility');
                  // Go to Goals/Preferences (Section 3)
                  wizard.advanceToSection(3);
                }}
              />
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MAGIC FIT FLOW (Dec 16, 2025 - CORRECTED):
                
                Section 3: GOALS/PREFERENCES - User tells us what matters
                Section 4: MAGIC FIT (3 cards) - "Here are 3 ways to save"
                    → User picks: Savings Focus, Balanced, or Resilient
                    → selectScenario() triggers AcceptCustomizeModal
                Section 5: TWO-COLUMN (if Customize) - Fine-tune the details
                Section 6: QUOTE RESULTS - Final savings estimate
                
                Why this order? 
                1. User preferences INFORM scenario generation
                2. Magic Fit presents 3 strategies to CHOOSE from
                3. AcceptCustomizeModal offers Accept (skip) or Customize (fine-tune)
                4. Two-column lets user adjust within chosen strategy
            ═══════════════════════════════════════════════════════════════ */}
            
            {/* Section 3: GOALS/PREFERENCES (BEFORE Magic Fit) */}
            {/* User tells us what matters: savings, backup, solar, etc. */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || 0;
              const batteryKW = wizard.wizardState.batteryKW || 0;
              const solarKW = wizard.wizardState.solarKW || 0;
              const generatorKW = wizard.wizardState.generatorKW || 0;
              const totalConfiguredKW = batteryKW + solarKW + generatorKW;
              const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 100;
              
              // Dec 16, 2025 - SSOT FIX: Use calculated financial estimates instead of hardcoded values
              // Financial estimates now come from QuoteEngine.quickEstimate() via useWizardState
              const annualSavings = calc.estimatedAnnualSavings || 0;
              const paybackYears = calc.estimatedPaybackYears || 0;
              const estimatedCost = calc.estimatedCost || 0;
              // ROI = (10yr savings - cost) / cost * 100
              const roi10Year = estimatedCost > 0 
                ? Math.round(((annualSavings * 10) - estimatedCost) / estimatedCost * 100)
                : 0;
              
              // Pass calculated recommendation from SSOT (no more hardcoded values!)
              const merlinRecommendation = calc.recommendedBatteryKW ? {
                batteryKW: calc.recommendedBatteryKW || 0,
                batteryKWh: calc.recommendedBatteryKWh || 0,
                durationHours: calc.recommendedBackupHours || 4,
                solarKW: calc.recommendedSolarKW || 0,
                windKW: 0,
                generatorKW: Math.round(peakDemandKW * 0.25),
                pcsKW: calc.recommendedBatteryKW || 0,
                transformerKVA: Math.round(peakDemandKW * 0.5),
                totalProductionKW: (calc.recommendedBatteryKW || 0) + (calc.recommendedSolarKW || 0),
                totalStorageKWh: calc.recommendedBatteryKWh || 0,
                dailyProductionKWh: Math.round((calc.recommendedSolarKW || 0) * 4.5),
                // SSOT values - no more hardcoded 3.5 years or 285% ROI!
                annualSavings: annualSavings,
                paybackYears: paybackYears,
                roi10Year: roi10Year,
                currency: 'USD',
              } : undefined;
              
              // Show Goals section (Section 3 - user tells us what matters)
              // Dec 17, 2025: Using GoalsSectionV2 with high-fidelity UI components
              return wizard.currentSection === 3 ? (
                <GoalsSectionV2
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={3}
                  sectionRef={(el) => { sectionRefs.current[3] = el; }}
                  onBack={() => wizard.advanceToSection(2)}
                  onContinue={() => {
                    // Dec 16, 2025 - Go to Configuration Comparison (Section 4)
                    console.log('🎯 [GOALS] Continue clicked - going to Config Comparison');
                    wizard.completeSection('preferences');
                    wizard.advanceToSection(4); // Config Comparison (User vs Merlin)
                  }}
                  onGenerateScenarios={wizard.generateAllScenarios}
                  isGeneratingScenarios={wizard.isGeneratingScenarios}
                  powerCoverage={powerCoverage}
                  peakDemandKW={peakDemandKW}
                  merlinRecommendation={merlinRecommendation}
                />
              ) : null;
            })()}

            {/* Section 4: CONFIGURATION COMPARISON (User vs Merlin) - NEW Dec 16, 2025 */}
            {/* Shows side-by-side: User's config (from Goals) vs Merlin's AI recommendation */}
            <ConfigurationComparison
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              centralizedState={wizard.centralizedState}
              currentSection={wizard.currentSection}
              sectionRef={(el) => { sectionRefs.current[4] = el; }}
              onBack={() => wizard.advanceToSection(3)}
              onContinue={() => {
                // After selecting a config, go to Scenario Planner (3 cards)
                console.log('🎯 [CONFIG COMPARISON] Config selected - going to Scenario Planner');
                wizard.advanceToSection(5);
              }}
            />

            {/* Section 5: MAGIC FIT / SCENARIO PLANNER (3 Cards) - Pick your strategy */}
            {/* Dec 16, 2025 - REPOSITIONED: Now AFTER Config Comparison */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 500;
              const batteryKW = wizard.wizardState.batteryKW || 0;
              const solarKW = wizard.wizardState.solarKW || 0;
              const generatorKW = wizard.wizardState.generatorKW || 0;
              const totalConfiguredKW = batteryKW + solarKW + generatorKW;
              const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 0;
              
              return wizard.currentSection === 5 ? (
                <ScenarioSection
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={5}
                  sectionRef={(el) => { sectionRefs.current[5] = el; }}
                  onBack={() => wizard.advanceToSection(4)}
                  onContinue={() => {
                    // After selecting a Magic Fit strategy, go to fine-tuning or quote
                    console.log('🎯 [SCENARIO PLANNER] Strategy selected');
                    wizard.advanceToSection(6);
                  }}
                  scenarioResult={wizard.wizardState.scenarioResult}
                  isGenerating={wizard.isGeneratingScenarios}
                  onGenerateScenarios={wizard.generateAllScenarios}
                  peakDemandKW={peakDemandKW}
                  powerCoverage={powerCoverage}
                  onOpenAdvanced={onOpenAdvanced}
                  onSelectScenario={wizard.selectScenario}
                />
              ) : null;
            })()}

            {/* Section 6: TWO-COLUMN FINE-TUNING (Optional - if user chose "Customize") */}
            {/* Dec 16, 2025 - RENUMBERED: Now Section 6 (was Section 5) */}
            {(() => {
              const calc = wizard.centralizedState?.calculated || {};
              const peakDemandKW = calc.totalPeakDemandKW || calc.recommendedBatteryKW || 500;
              const batteryKW = wizard.wizardState.batteryKW || 0;
              const solarKW = wizard.wizardState.solarKW || 0;
              const generatorKW = wizard.wizardState.generatorKW || 0;
              const totalConfiguredKW = batteryKW + solarKW + generatorKW;
              const powerCoverage = peakDemandKW > 0 ? Math.round((totalConfiguredKW / peakDemandKW) * 100) : 0;
              
              return wizard.currentSection === 6 ? (
                <ScenarioSectionV2
                  wizardState={wizard.wizardState}
                  setWizardState={wizard.setWizardState}
                  currentSection={6}
                  sectionRef={(el) => { sectionRefs.current[6] = el; }}
                  onBack={() => wizard.advanceToSection(5)}
                  onContinue={() => {
                    // After fine-tuning, go to final quote
                    wizard.completeSection('configuration');
                    wizard.advanceToSection(7);
                  }}
                  scenarioResult={wizard.wizardState.scenarioResult}
                  isGenerating={wizard.isGeneratingScenarios}
                  onGenerateScenarios={wizard.generateAllScenarios}
                  peakDemandKW={peakDemandKW}
                  powerCoverage={powerCoverage}
                  onOpenAdvanced={onOpenAdvanced}
                />
              ) : null;
            })()}

            {/* Section 7: Quote Results - RENUMBERED (was Section 6) */}
            <QuoteResultsSection
              wizardState={wizard.wizardState}
              setWizardState={wizard.setWizardState}
              currentSection={wizard.currentSection}
              sectionRef={(el) => { sectionRefs.current[7] = el; }}
              premiumConfig={wizard.premiumConfig}
              premiumComparison={wizard.premiumComparison}
              onBack={() => wizard.advanceToSection(wizard.userQuoteChoice === 'customize' ? 6 : 5)}
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

      {/* SIDEBAR TRUEQUOTE BUTTON - Higher on left side */}
      <div className="fixed left-4 top-32 z-[9998] flex flex-col gap-3">
        {/* TrueQuote Logo Button - Exact replica from image */}
        <button
          onClick={() => {
            setShowTrueQuoteExplainer(true);
            setShowCalculations(true);
          }}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full shadow-2xl hover:shadow-amber-300/50 hover:scale-105 transition-all border-2 border-amber-200"
          title="TrueQuote™ - See how we calculate your quote"
        >
          {/* Shield Icon - Orange/Amber */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 2L4 6v6c0 5.5 3.84 10.66 8 12 4.16-1.34 8-6.5 8-12V6l-8-4z" 
              fill="#EA580C"
              stroke="#C2410C"
              strokeWidth="1.5"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* TrueQuote Text - Brown */}
          <span className="font-bold text-lg text-amber-900">
            TrueQuote<sup className="text-xs">™</sup>
          </span>
        </button>
        
        {/* Merlin Energy Button - Below TrueQuote */}
        <button
          onClick={() => setShowMerlinRecommendation(true)}
          className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full shadow-xl hover:shadow-purple-300/50 hover:scale-105 transition-all border-2 border-purple-300"
          title="Click for Merlin's help"
        >
          <img src={merlinImage} alt="Merlin" className="w-6 h-6" />
          <span className="font-bold text-sm text-purple-900">Merlin Energy</span>
        </button>
        
        {/* How to Use Button - Below Merlin Energy */}
        <button
          onClick={() => setShowMerlinRecommendation(true)}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full shadow-lg hover:shadow-emerald-300/50 hover:scale-105 transition-all border-2 border-emerald-300"
          title="Learn how to use the wizard"
        >
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-sm text-emerald-800">How to Use</span>
        </button>
        
        {/* Real-time Calculations Widget - Only show when toggled */}
        {showCalculations && (() => {
          // CRITICAL: Read from latest centralizedState which updates with ALL facility changes
          const calc = wizard.centralizedState?.calculated || {};
          const hasData = calc.totalPeakDemandKW > 0 || calc.recommendedBatteryKW > 0;
          
          if (!hasData) {
            return (
              <div className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-xl border border-indigo-400/30 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-indigo-300" />
                  <span className="text-indigo-200 font-bold text-xs">Live Calculations</span>
                </div>
                <p className="text-indigo-300/60 text-xs">Complete facility details to see calculations</p>
              </div>
            );
          }
          
          return (
            <div className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-xl border border-indigo-400/30 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 max-w-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-300" />
                  <span className="text-indigo-200 font-bold text-xs">Live Calculations</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <button
                  onClick={() => setShowCalculations(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-indigo-300 hover:text-white" />
                </button>
              </div>
              
              <div className="space-y-2 text-xs">
                {/* Peak Demand */}
                {calc.totalPeakDemandKW > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-indigo-400/20">
                    <span className="text-indigo-300/80">Peak Demand</span>
                    <span className="text-white font-bold">
                      {calc.totalPeakDemandKW >= 1000 
                        ? `${(calc.totalPeakDemandKW / 1000).toFixed(2)} MW`
                        : `${Math.round(calc.totalPeakDemandKW)} kW`
                      }
                    </span>
                  </div>
                )}
                
                {/* Battery Recommendation */}
                {calc.recommendedBatteryKW > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-indigo-400/20">
                    <span className="text-indigo-300/80">Battery Power</span>
                    <span className="text-emerald-300 font-bold">
                      {calc.recommendedBatteryKW >= 1000 
                        ? `${(calc.recommendedBatteryKW / 1000).toFixed(2)} MW`
                        : `${Math.round(calc.recommendedBatteryKW)} kW`
                      }
                    </span>
                  </div>
                )}
                
                {/* Battery Energy */}
                {calc.recommendedBatteryKWh > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-indigo-400/20">
                    <span className="text-indigo-300/80">Battery Storage</span>
                    <span className="text-emerald-300 font-bold">
                      {calc.recommendedBatteryKWh >= 1000 
                        ? `${(calc.recommendedBatteryKWh / 1000).toFixed(2)} MWh`
                        : `${Math.round(calc.recommendedBatteryKWh)} kWh`
                      }
                    </span>
                  </div>
                )}
                
                {/* Solar Recommendation */}
                {calc.recommendedSolarKW > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-indigo-400/20">
                    <span className="text-indigo-300/80">Solar Array</span>
                    <span className="text-amber-300 font-bold">
                      {calc.recommendedSolarKW >= 1000 
                        ? `${(calc.recommendedSolarKW / 1000).toFixed(2)} MW`
                        : `${Math.round(calc.recommendedSolarKW)} kW`
                      }
                    </span>
                  </div>
                )}
                
                {/* Annual Savings */}
                {calc.estimatedAnnualSavings > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-indigo-300/80">Annual Savings</span>
                    <span className="text-green-300 font-bold">
                      ${(calc.estimatedAnnualSavings / 1000).toFixed(0)}k
                    </span>
                  </div>
                )}
                
                {/* Methodology note */}
                <div className="mt-2 pt-2 border-t border-indigo-400/20">
                  <p className="text-indigo-300/60 text-[10px] leading-tight">
                    Calculations updating live from facility details (rooms, elevators, etc.)
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      
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
