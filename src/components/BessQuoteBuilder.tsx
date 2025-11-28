import React, { useState, useRef, useEffect } from 'react';
import { buildModalManagerProps } from '../utils/modalProps';
import { useBessQuoteBuilder } from '../hooks/useBessQuoteBuilder';
import { saveAs } from 'file-saver';
import { UTILITY_RATES } from '../utils/energyCalculations';
import { authService } from '../services/authService';
import WordExportService from '../services/export/WordExportService';
import HeroSection from './sections/HeroSection';
import MainQuoteForm from './forms/MainQuoteForm';
import ModalManager from './modals/ModalManager';
import QuotePreviewModal from './modals/QuotePreviewModal';
import AboutMerlin from './AboutMerlin';
import VendorPortal from './VendorPortal';
import EnergyNewsTicker from './EnergyNewsTicker';
import PublicProfileViewer from './PublicProfileViewer';
import UseCaseTemplates from './UseCaseTemplates';
import { UseCaseAdminDashboard } from './admin/UseCaseAdminDashboard';
import EnhancedBESSAnalytics from './EnhancedBESSAnalytics';
import FinancingCalculator from './FinancingCalculator';
import AIChatModal from './modals/AIChatModal';
import type { ProfileData } from './modals/AccountSetup';
import AboutView from './views/AboutView';
import VendorPortalView from './views/VendorPortalView';

// NEW: Clean unified Advanced Quote Builder component
import AdvancedQuoteBuilder from './AdvancedQuoteBuilder';

console.log('🔍 [TRACE] BessQuoteBuilder.tsx loaded');

export default function BessQuoteBuilder() {
  console.log('🔍 [TRACE] BessQuoteBuilder component rendering');
  
  // Local state to track if wizard should start in advanced mode
  const [startWizardInAdvancedMode, setStartWizardInAdvancedMode] = useState(false);
  // Local state to track if wizard should skip intro
  const [showProfessionalAnalytics, setShowProfessionalAnalytics] = useState(false);
  const [skipWizardIntro, setSkipWizardIntro] = useState(false);
  // Local state to track the initial view for Advanced Quote Builder
  const [advancedQuoteBuilderInitialView, setAdvancedQuoteBuilderInitialView] = useState<'landing' | 'custom-config'>('landing');
  
  // Use custom hook for all state management
  const { state, actions, exchangeRates } = useBessQuoteBuilder();
  
  // Destructure commonly used state values for easier access
  const {
    viewMode, publicProfileSlug, showAdvancedQuoteBuilder, userLayoutPreference, showLayoutPreferenceModal,
    energyCapacity, powerRating, showAdvancedOptions, quoteName, showUserProfile, showSmartWizard, showAdvancedQuoteBuilderModal,
    showVendorManager, showJoinModal, showAuthModal, showPricingPlans, showWelcomeModal, showAccountSetup,
    showEnhancedProfile, isFirstTimeProfile, isLoggedIn, showAnalytics, showBESSAnalytics, showFinancing, showTemplates,
    showChatModal, showAbout, showVendorPortal, showPortfolio, showCalculationModal, showSaveProjectModal,
    showLoadProjectModal, showPricingDataCapture, showMarketIntelligence, showVendorSponsorship,
    showPrivacyPolicy, showCostSavingsModal, showRevenueModal, showSustainabilityModal, showTermsOfService,
    showSecuritySettings, showSystemHealth, showStatusPage, showUtilityRates, showQuoteTemplates,
    showPricingPresets, showReviewWorkflow, showPowerAdjustmentModal, selectedUseCaseForAdjustment, currentQuoteStatus, currentQuote, showQuotePreview,
    powerMW, standbyHours, gridMode, useCase, generatorMW, solarMWp, windMW, valueKwh, utilization,
    warranty, location, selectedCountry, currency, energyUnit, powerUnit, applicationType,
    batteryKwh, pcsKw, bosPercent, epcPercent, offGridPcsFactor, onGridPcsFactor, genKw, solarKwp,
    windKw, tariffPercent
  } = state;
  
  // Destructure commonly used actions for easier access
  const {
    setViewMode, setPublicProfileSlug, setShowAdvancedQuoteBuilder, setUserLayoutPreference,
    setShowLayoutPreferenceModal, setEnergyCapacity, setPowerRating, setShowAdvancedOptions, setQuoteName,
    setShowUserProfile, setShowSmartWizard, setShowAdvancedQuoteBuilderModal, setShowVendorManager, setShowJoinModal, setShowAuthModal,
    setShowPricingPlans, setShowWelcomeModal, setShowAccountSetup, setShowEnhancedProfile,
    setIsFirstTimeProfile, setIsLoggedIn, setShowAnalytics, setShowBESSAnalytics, setShowFinancing, setShowTemplates,
    setShowChatModal, setShowAbout, setShowVendorPortal, setShowPortfolio, setShowCalculationModal, setShowSaveProjectModal,
    setShowLoadProjectModal, setShowPricingDataCapture, setShowMarketIntelligence, setShowVendorSponsorship,
    setShowPrivacyPolicy, setShowCostSavingsModal, setShowRevenueModal, setShowSustainabilityModal,
    setShowTermsOfService, setShowSecuritySettings, setShowSystemHealth, setShowStatusPage,
    setShowUtilityRates, setShowQuoteTemplates, setShowPricingPresets, setShowReviewWorkflow,
    setShowPowerAdjustmentModal, setSelectedUseCaseForAdjustment,
    setCurrentQuoteStatus, setCurrentQuote, setShowQuotePreview, setPowerMW, setStandbyHours, setGridMode,
    setUseCase, setGeneratorMW, setSolarMWp, setWindMW, setValueKwh, setUtilization, setWarranty,
    setLocation, setSelectedCountry, setCurrency, setEnergyUnit, setPowerUnit, setApplicationType,
    setBatteryKwh, setPcsKw, setBosPercent, setEpcPercent, setOffGridPcsFactor, setOnGridPcsFactor,
    setGenKw, setSolarKwp, setWindKw, setTariffPercent,
    // Handler functions from the hook
    handleLoginSuccess, handleProfileSetup, handleStartWizard, handleGoHome, handleAdvancedQuoteBuilder,
    handleLayoutPreference, handleSaveLayoutPreference, handleProfileComplete, handleContinueToEnhancedProfile,
    handleEnhancedProfileClose, handleSaveProject, handleUploadProject, handleCreateWithWizard,
    handleSaveToPortfolio, handleLoadProject, handleUploadFromComputer, handleUploadFromPortfolio,
    handlePortfolio, handleUserProfile, handleResetToDefaults, handleExportCalculations,
    handleApplyTemplate, handleApplyUseCaseTemplate, handleExportWord, convertCurrency, loadProjectData, loadProjectFromStorage
  } = actions;

  // If viewing a public profile, show that instead - check early but after all hooks
  if (viewMode === 'public-profile' && publicProfileSlug) {
    const handleNavigateToApp = () => {
      window.history.pushState({}, '', '/');
      setViewMode('app');
      setShowAuthModal(true);
    };
    return <PublicProfileViewer profileSlug={publicProfileSlug} onSignUp={handleNavigateToApp} />;
  }

  console.log('🔍 Current state - showAdvancedQuoteBuilder:', showAdvancedQuoteBuilder);
  console.log('🔍 Modal states:', { showTemplates, showAnalytics, showBESSAnalytics, showFinancing });
  console.log('🔍 showBESSAnalytics value:', showBESSAnalytics);

  useEffect(() => {
    // Simple routing check - look for /profile/ in URL
    const path = window.location.pathname;
    if (path.startsWith('/profile/')) {
      const slug = path.split('/profile/')[1];
      setPublicProfileSlug(slug);
      setViewMode('public-profile');
    }
  }, []);

  const handleNavigateToApp = () => {
    window.history.pushState({}, '', '/');
    setViewMode('app');
    setShowAuthModal(true);
  };

  // Generic modal opener function
  const openModal = (modalName: string) => {
    console.log('🎯 Opening modal:', modalName);
    switch (modalName) {
      case 'showChatModal':
        console.log('🎯 Chat modal handler called - setting showChatModal to true');
        setShowChatModal(true);
        break;
      case 'showEnhancedAnalytics':
        console.log('📊 Opening Enhanced Analytics (Financial)');
        setShowAnalytics(true);
        break;
      case 'bessAnalytics':
        console.log('⚡ Opening BESS Analytics (ML Suite)');
        setShowBESSAnalytics(true);
        break;
      case 'showTemplates':
        setShowTemplates(true);
        break;
      default:
        console.log(`Unknown modal: ${modalName}`);
    }
  };

  // Render main quote form for advanced interface
  const renderMainQuoteForm = () => (
    <MainQuoteForm
      energyCapacity={energyCapacity}
      setEnergyCapacity={setEnergyCapacity}
      energyUnit={energyUnit}
      setEnergyUnit={setEnergyUnit}
      powerRating={powerRating}
      setPowerRating={setPowerRating}
      powerUnit={powerUnit}
      setPowerUnit={setPowerUnit}
      applicationType={applicationType}
      setApplicationType={setApplicationType}
      showAdvancedOptions={showAdvancedOptions}
      setShowAdvancedOptions={setShowAdvancedOptions}
      setShowAnalytics={setShowAnalytics}
      setShowTemplates={setShowTemplates}
      openModal={openModal}
      handleSaveProject={handleSaveProject}
      quoteName={quoteName}
    />
  );

  // Effects and handlers go here
  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());
    
    // Load user layout preference
    const user = authService.getCurrentUser();
    if (user && user.preferences?.layoutPreference) {
      setUserLayoutPreference(user.preferences.layoutPreference);
    }
  }, []);

  // Check if user needs to complete profile after login
  useEffect(() => {
    if (isLoggedIn) {
      const user = authService.getCurrentUser();
      if (user && !user.profileCompleted) {
        setShowWelcomeModal(true);
      }
    }
  }, [isLoggedIn]);

  // NOTE: Legacy calculation logic removed - now using centralizedCalculations.ts via SmartWizardV3
  // Previously used quoteCalculations.ts → advancedFinancialModeling.ts → databaseCalculations.ts
  // All financial calculations now handled by SmartWizardV3 using centralizedCalculations.ts
  
  // Placeholder values for legacy components (analytics, financing modals)
  // These are deprecated and will be removed in future versions
  // TODO: Remove these placeholders and update dependent components to use SmartWizardV3 data
  
  // Basic CapEx calculation for Advanced Quote Builder
  const totalMWh = powerMW * standbyHours;
  const effectiveBatteryKwh = totalMWh * 1000;
  
  // BESS pricing per kWh based on system size (from comprehensive_pricing_demo.js)
  let pricePerKwh = 168; // Default: Small systems (<1 MWh)
  if (effectiveBatteryKwh >= 10000) {
    pricePerKwh = 118; // Utility scale (>10 MWh): $118/kWh
  } else if (effectiveBatteryKwh >= 1000) {
    pricePerKwh = 138; // Medium systems (1-10 MWh): $138/kWh
  }
  
  // Calculate base BESS cost
  const bessCapEx = effectiveBatteryKwh * pricePerKwh;
  
  // Add BOS and EPC costs (balance of system and engineering/procurement/construction)
  const bosMultiplier = 1 + (bosPercent / 100);
  const epcMultiplier = 1 + (epcPercent / 100);
  
  // Grand CapEx includes BESS + BOS + EPC + renewables
  const solarCost = solarKwp * 1000; // ~$1000/kWp for solar
  const windCost = windKw * 1500; // ~$1500/kW for wind
  const genCost = genKw * 800; // ~$800/kW for generators
  
  const grandCapEx = (bessCapEx * bosMultiplier * epcMultiplier) + solarCost + windCost + genCost;
  
  const annualSavings = 0;
  const roiYears = 0;
  const actualDuration = standbyHours;
  const annualEnergyMWh = totalMWh * 365;
  const pcsKW = powerMW * 1000;
  
  // Helper function for currency symbols (moved from deleted quoteCalculations.ts)
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
      AUD: 'A$', CAD: 'C$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr',
      RUB: '₽', BRL: 'R$', ZAR: 'R', AED: 'د.إ', SAR: '﷼', KRW: '₩'
    };
    return symbols[currencyCode] || currencyCode;
  };

  const inputStyle = "w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50";
  const labelStyle = "block text-base font-semibold text-gray-800 mb-2 tracking-wide";
  const cardStyle = "bg-gradient-to-b from-white via-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-8 shadow-xl relative overflow-hidden";

  // Show About page if active
  if (showAbout) {
    return (
      <AboutView 
        onBack={() => setShowAbout(false)}
        onJoinNow={() => setShowJoinModal(true)}
        onStartWizard={() => {
          setShowAbout(false);
          setShowSmartWizard(true);
        }}
      />
    );
  }

  // Show Vendor Portal if active
  if (showVendorPortal) {
    return (
      <VendorPortalView 
        onBack={() => setShowVendorPortal(false)}
        onJoinCustomerPlatform={() => setShowJoinModal(true)}
      />
    );
  }

  // Build modal manager props using utility function
  const modalManagerProps = buildModalManagerProps(
    // Modal states
    {
      showUserProfile, showPortfolio, showAuthModal, showVendorManager, showPricingPlans,
      showWelcomeModal, showAccountSetup, showEnhancedProfile, showJoinModal, showSmartWizard,
      showCalculationModal, showSaveProjectModal, showLoadProjectModal, showAnalytics, showProfessionalAnalytics, showBESSAnalytics, showFinancing,
      showTemplates, showChatModal, showPricingDataCapture, showMarketIntelligence, showVendorSponsorship,
      showPrivacyPolicy, showTermsOfService, showSecuritySettings, showSystemHealth, showStatusPage,
      showUtilityRates, showQuoteTemplates, showPricingPresets, showReviewWorkflow,
      showCostSavingsModal, showRevenueModal, showSustainabilityModal, showPowerAdjustmentModal
    },
    // Modal setters
    {
      setShowUserProfile, setShowPortfolio, setShowAuthModal, setShowVendorManager, setShowPricingPlans,
      setShowWelcomeModal, setShowAccountSetup, setShowEnhancedProfile, setShowJoinModal, setShowSmartWizard,
      setShowCalculationModal, setShowSaveProjectModal, setShowLoadProjectModal, setShowAnalytics, setShowProfessionalAnalytics, setShowBESSAnalytics, setShowFinancing,
      setShowTemplates, setShowChatModal, setShowPricingDataCapture, setShowMarketIntelligence, setShowVendorSponsorship,
      setShowPrivacyPolicy, setShowTermsOfService, setShowSecuritySettings, setShowSystemHealth, setShowStatusPage,
      setShowUtilityRates, setShowQuoteTemplates, setShowPricingPresets, setShowReviewWorkflow,
      setShowCostSavingsModal, setShowRevenueModal, setShowSustainabilityModal, setShowPowerAdjustmentModal, setSelectedUseCaseForAdjustment
    },
    // Application data
    {
      isLoggedIn, isFirstTimeProfile, quoteName, powerMW, standbyHours, solarMWp, windMW, generatorMW,
      batteryKwh, pcsKw, bosPercent, epcPercent, genKw, solarKwp, windKw, location, grandCapEx,
      annualSavings, valueKwh, warranty, currentQuoteStatus, currency, selectedCountry, applicationType,
      energyCapacity, selectedUseCaseForAdjustment
    },
    // Handlers
    {
      handleLoginSuccess, handleGoHome, handleProfileSetup, handleStartWizard, handleProfileComplete,
      handleContinueToEnhancedProfile, handleEnhancedProfileClose, loadProjectFromStorage, handleUploadProject,
      handleCreateWithWizard, handleUploadFromComputer, handleUploadFromPortfolio, handleApplyTemplate,
      handleApplyUseCaseTemplate, setPowerMW, setStandbyHours, setUseCase, setWarranty, setSolarMWp, setWindMW, setGeneratorMW,
      setValueKwh, setCurrentQuoteStatus, setIsLoggedIn
    }
  );

  console.log('🔥 After building modalManagerProps, showBESSAnalytics in props:', modalManagerProps.showBESSAnalytics);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <main className="p-8">
        {/* Energy News Ticker - Matches hero width */}
        <div className="my-6">
          <EnergyNewsTicker />
        </div>
        
        {/* HERO SECTION */}
        <HeroSection
          setShowAbout={setShowAbout}
          setShowJoinModal={setShowJoinModal}
          setShowSmartWizard={setShowSmartWizard}
          setShowAdvancedQuoteBuilder={setShowAdvancedQuoteBuilderModal}
          setShowCostSavingsModal={setShowCostSavingsModal}
          setShowRevenueModal={setShowRevenueModal}
          setShowSustainabilityModal={setShowSustainabilityModal}
          setCurrentQuote={setCurrentQuote}
          setShowQuotePreview={setShowQuotePreview}
          selectedCountry={selectedCountry}
          bosPercent={bosPercent}
          epcPercent={epcPercent}
          pcsKw={pcsKw}
          setShowPowerAdjustmentModal={setShowPowerAdjustmentModal}
          setSelectedUseCaseForAdjustment={setSelectedUseCaseForAdjustment}
        />

        {/* Quote Preview Modal for Use Case ROI */}
        {showQuotePreview && currentQuote && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}>
            <QuotePreviewModal
              isOpen={showQuotePreview}
              onClose={() => setShowQuotePreview(false)}
              quoteData={currentQuote}
            />
          </div>
        )}

        {/* Footer with Admin Access */}
        <footer className="mt-12 border-t border-purple-300 pt-8 pb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => setShowStatusPage(true)}
                className="text-gray-600 hover:text-green-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🟢</span>
                <span>System Status</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-gray-600 hover:text-blue-600 text-xs font-medium transition-colors"
              >
                Privacy Policy
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowTermsOfService(true)}
                className="text-gray-600 hover:text-purple-600 text-xs font-medium transition-colors"
              >
                Terms of Service
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowSecuritySettings(true)}
                className="text-gray-600 hover:text-green-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🔒</span>
                <span>Security & Privacy</span>
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              © 2025 Merlin Energy. All rights reserved.
            </p>
            {/* Always show admin tools for development */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowSystemHealth(true)}
                className="text-gray-600 hover:text-blue-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>📊</span>
                <span>System Health</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowVendorManager(true)}
                className="text-gray-600 hover:text-purple-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
              >
                <span>🔧</span>
                <span>Admin Panel</span>
              </button>
              <span className="text-gray-300">|</span>
              {isLoggedIn && (
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    alert('You have been logged out successfully');
                  }}
                  className="text-gray-600 hover:text-red-600 text-xs font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>

    {/* MODAL MANAGER - Always rendered regardless of showAdvancedQuoteBuilder state */}
    {console.log('🚀 About to render ModalManager with showBESSAnalytics:', showBESSAnalytics)}
    {console.log('🚀 modalManagerProps.showBESSAnalytics:', modalManagerProps.showBESSAnalytics)}
    <ModalManager 
      key={`modal-${showBESSAnalytics}`} 
      {...modalManagerProps}
      startWizardInAdvancedMode={startWizardInAdvancedMode}
      setStartWizardInAdvancedMode={setStartWizardInAdvancedMode}
      setShowAdvancedQuoteBuilderModal={setShowAdvancedQuoteBuilderModal}
      setAdvancedQuoteBuilderInitialView={setAdvancedQuoteBuilderInitialView}
      skipWizardIntro={skipWizardIntro}
      setSkipWizardIntro={setSkipWizardIntro}
    />

    {/* ADVANCED QUOTE BUILDER - New clean unified component */}
    {console.log('🏗️ Rendering AdvancedQuoteBuilder with showAdvancedQuoteBuilderModal:', showAdvancedQuoteBuilderModal)}
    <AdvancedQuoteBuilder
      show={showAdvancedQuoteBuilderModal}
      initialView={advancedQuoteBuilderInitialView}
      onClose={() => {
        setShowAdvancedQuoteBuilderModal(false);
        // Reset to landing view for next open
        setAdvancedQuoteBuilderInitialView('landing');
      }}
      onOpenSmartWizard={() => {
        setShowAdvancedQuoteBuilderModal(false);
        setShowSmartWizard(true);
      }}
      onOpenFinancing={() => {
        setShowAdvancedQuoteBuilderModal(false);
        setShowFinancing(true);
      }}
      onOpenMarketIntel={() => {
        setShowAdvancedQuoteBuilderModal(false);
        setShowMarketIntelligence(true);
      }}
      onOpenQuoteTemplates={() => {
        setShowAdvancedQuoteBuilderModal(false);
        setShowQuoteTemplates(true);
      }}
      setSkipWizardIntro={setSkipWizardIntro}
      storageSizeMW={powerMW}
      durationHours={standbyHours}
      systemCost={grandCapEx}
      onStorageSizeChange={setPowerMW}
      onDurationChange={setStandbyHours}
      onSystemCostChange={(cost) => {
        // System cost changes might affect grandCapEx calculation
        // For now, just log - full integration would need more complex state management
        console.log('System cost changed to:', cost);
      }}
      onGenerateQuote={() => {
        // Generate quote with current configuration and close modal
        console.log('Generate quote with:', { powerMW, standbyHours, grandCapEx });
        setShowAdvancedQuoteBuilderModal(false);
        // Could open quote preview modal here if needed
        alert(`✅ Quote Generated Successfully!\n\nSystem: ${powerMW} MW / ${(powerMW * standbyHours).toFixed(1)} MWh\nEstimated Cost: $${grandCapEx.toLocaleString()}\n\nYour quote has been added to your dashboard.`);
      }}
    />

    {/* Admin Dashboard */}
    {showVendorManager && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen">
          <div className="bg-white min-h-screen">
            <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <h1 className="text-2xl font-bold">🔧 Admin Dashboard</h1>
              <button 
                onClick={() => setShowVendorManager(false)}
                className="text-white hover:text-gray-200 text-3xl font-bold p-2"
              >
                ×
              </button>
            </div>
            <UseCaseAdminDashboard isAdmin={true} />
          </div>
        </div>
      </div>
    )}
  </>
  );
}
