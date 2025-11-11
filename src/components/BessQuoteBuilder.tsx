import React, { useState, useRef, useEffect } from 'react';
import { buildModalManagerProps } from '../utils/modalProps';
import { useBessQuoteBuilder } from '../hooks/useBessQuoteBuilder';
import { saveAs } from 'file-saver';
import { UTILITY_RATES } from '../utils/energyCalculations';
// REMOVED: generateCalculationBreakdown, exportCalculationsToText - not used (now in quoteCalculations)
// REMOVED: calculateBESSPricing, calculateSystemCost - not used (now using databaseCalculations via quoteCalculations)
import { authService } from '../services/authService';
import WordExportService from '../services/export/WordExportService';
import HeroSection from './sections/HeroSection';
import AdvancedQuoteBuilderSection from './sections/AdvancedQuoteBuilderSection';
import MainQuoteForm from './forms/MainQuoteForm';
import ModalManager from './modals/ModalManager';
import QuotePreviewModal from './modals/QuotePreviewModal';
import AboutMerlin from './AboutMerlin';
import VendorPortal from './VendorPortal';
import EnergyNewsTicker from './EnergyNewsTicker';
import PublicProfileViewer from './PublicProfileViewer';
import UseCaseTemplates from './UseCaseTemplates';
import AdvancedAnalytics from './AdvancedAnalytics';
import { UseCaseAdminDashboard } from './admin/UseCaseAdminDashboard';
import EnhancedBESSAnalytics from './EnhancedBESSAnalytics';
import FinancingCalculator from './FinancingCalculator';
import AIChatModal from './modals/AIChatModal';
import type { ProfileData } from './modals/AccountSetup';
import { calculateBessQuote, getCurrencySymbol } from '../services/quoteCalculations';
import AboutView from './views/AboutView';
import VendorPortalView from './views/VendorPortalView';
import AdvancedQuoteBuilderView from './views/AdvancedQuoteBuilderView';


export default function BessQuoteBuilder() {
  console.log('🏗️ BessQuoteBuilder component rendering');
  
  // Use custom hook for all state management
  const { state, actions, exchangeRates } = useBessQuoteBuilder();
  
  // Destructure commonly used state values for easier access
  const {
    viewMode, publicProfileSlug, showAdvancedQuoteBuilder, userLayoutPreference, showLayoutPreferenceModal,
    energyCapacity, powerRating, showAdvancedOptions, quoteName, showUserProfile, showSmartWizard,
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
    setShowUserProfile, setShowSmartWizard, setShowVendorManager, setShowJoinModal, setShowAuthModal,
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

  // CALCULATIONS - Using Async Database-Backed Calculation Service
  const [calculationResults, setCalculationResults] = useState<any>({
    totalMWh: 0, actualDuration: 0, pcsKW: 0, adjustedPcsKw: 0,
    batterySubtotal: 0, pcsSubtotal: 0, bosAmount: 0, epcAmount: 0, bessCapEx: 0,
    generatorSubtotal: 0, solarSubtotal: 0, windSubtotal: 0,
    batteryTariff: 0, otherTariff: 0, totalTariffs: 0, grandCapEx: 0,
    annualEnergyMWh: 0, peakShavingValue: 0, peakShavingSavings: 0,
    demandChargeSavings: 0, annualSavings: 0, roiYears: 0,
    dynamicBatteryKwh: 0, effectiveBatteryKwh: 0
  });

  // Calculate quote whenever inputs change
  useEffect(() => {
    const calculate = async () => {
      const results = await calculateBessQuote({
        powerMW,
        standbyHours,
        selectedCountry,
        useCase,
        gridMode,
        batteryKwh,
        pcsKw,
        bosPercent,
        epcPercent,
        offGridPcsFactor,
        onGridPcsFactor,
        generatorMW,
        genKw,
        solarMWp,
        solarKwp,
        windMW,
        windKw
      });
      setCalculationResults(results);
    };
    calculate();
  }, [powerMW, standbyHours, selectedCountry, useCase, gridMode, batteryKwh, pcsKw, bosPercent, epcPercent, offGridPcsFactor, onGridPcsFactor, generatorMW, genKw, solarMWp, solarKwp, windMW, windKw]);

  // Destructure calculation results for easier access
  const {
    totalMWh, actualDuration, pcsKW, adjustedPcsKw,
    batterySubtotal, pcsSubtotal, bosAmount, epcAmount, bessCapEx,
    generatorSubtotal, solarSubtotal, windSubtotal,
    batteryTariff, otherTariff, totalTariffs, grandCapEx,
    annualEnergyMWh, peakShavingValue, peakShavingSavings,
    demandChargeSavings, annualSavings, roiYears,
    dynamicBatteryKwh, effectiveBatteryKwh
  } = calculationResults;

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

  // If showing advanced quote builder
  if (showAdvancedQuoteBuilder) {
    console.log('✅ Rendering advanced quote builder interface');
    console.log('showAdvancedQuoteBuilder value:', showAdvancedQuoteBuilder);
    return (
      <>
        {/* Clean interface without opacity changes */}
        <div>
          <AdvancedQuoteBuilderView 
            onBackToHome={() => {
              console.log('🏠 onBackToHome called - closing Advanced Quote Builder');
              setShowAdvancedQuoteBuilder(false);
            }}
            onShowSmartWizard={() => {
              console.log('🧙 onShowSmartWizard called');
            setShowAdvancedQuoteBuilder(false);
            setShowSmartWizard(true);
          }}
          onShowTemplates={() => {
            console.log('🎯 Templates handler called - setting showTemplates to true');
            setShowTemplates(true);
          }}
          onShowAnalytics={() => {
            console.log('🎯 Analytics handler called - setting showAnalytics to true');
            setShowAnalytics(true);
          }}
          onShowFinancing={() => {
            console.log('🎯 Financing handler called - setting showFinancing to true');
            setShowFinancing(true);
          }}
          renderMainQuoteForm={renderMainQuoteForm}
        />
        </div> {/* End of Advanced Configuration Panel wrapper */}
        
        {/* Render modals directly here when in Advanced Mode */}
        {showTemplates && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UseCaseTemplates
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        )}
        
        {showAnalytics && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AdvancedAnalytics
              isOpen={showAnalytics}
              onClose={() => setShowAnalytics(false)}
              projectData={{
                quoteName,
                powerMW,
                durationHours: standbyHours,
                totalCapEx: grandCapEx,
                annualSavings,
              }}
            />
          </div>
        )}
        
        {showFinancing && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FinancingCalculator
              isOpen={showFinancing}
              onClose={() => setShowFinancing(false)}
              projectData={{
                quoteName,
                totalCapEx: grandCapEx,
                annualSavings,
                powerMW,
                durationHours: standbyHours,
              }}
            />
          </div>
        )}
        
        {showChatModal && (
          <AIChatModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
          />
        )}

        {/* MODAL MANAGER - Include within Advanced Quote Builder */}
        {console.log('🚀 About to render ModalManager (INSIDE Advanced QB) with showBESSAnalytics:', showBESSAnalytics)}
        <ModalManager 
          key={`modal-advanced-${showBESSAnalytics}`}
          showUserProfile={showUserProfile} 
          showPortfolio={showPortfolio} 
          showAuthModal={showAuthModal} 
          showVendorManager={showVendorManager} 
          showPricingPlans={showPricingPlans}
          showWelcomeModal={showWelcomeModal} 
          showAccountSetup={showAccountSetup} 
          showEnhancedProfile={showEnhancedProfile} 
          showJoinModal={showJoinModal} 
          showSmartWizard={showSmartWizard}
          showCalculationModal={showCalculationModal} 
          showSaveProjectModal={showSaveProjectModal} 
          showLoadProjectModal={showLoadProjectModal} 
          showAnalytics={showAnalytics} 
          showBESSAnalytics={showBESSAnalytics} 
          showFinancing={showFinancing}
          showTemplates={showTemplates} 
          showChatModal={showChatModal} 
          showPricingDataCapture={showPricingDataCapture} 
          showMarketIntelligence={showMarketIntelligence} 
          showVendorSponsorship={showVendorSponsorship}
          showPrivacyPolicy={showPrivacyPolicy} 
          showTermsOfService={showTermsOfService} 
          showSecuritySettings={showSecuritySettings} 
          showSystemHealth={showSystemHealth} 
          showStatusPage={showStatusPage}
          showUtilityRates={showUtilityRates} 
          showQuoteTemplates={showQuoteTemplates} 
          showPricingPresets={showPricingPresets} 
          showReviewWorkflow={showReviewWorkflow}
          showCostSavingsModal={showCostSavingsModal} 
          showRevenueModal={showRevenueModal} 
          showSustainabilityModal={showSustainabilityModal}
          showPowerAdjustmentModal={showPowerAdjustmentModal}
          selectedUseCaseForAdjustment={selectedUseCaseForAdjustment}
          setShowUserProfile={setShowUserProfile} 
          setShowPortfolio={setShowPortfolio} 
          setShowAuthModal={setShowAuthModal} 
          setShowVendorManager={setShowVendorManager} 
          setShowPricingPlans={setShowPricingPlans}
          setShowWelcomeModal={setShowWelcomeModal} 
          setShowAccountSetup={setShowAccountSetup} 
          setShowEnhancedProfile={setShowEnhancedProfile} 
          setShowJoinModal={setShowJoinModal} 
          setShowSmartWizard={setShowSmartWizard}
          setShowCalculationModal={setShowCalculationModal} 
          setShowSaveProjectModal={setShowSaveProjectModal} 
          setShowLoadProjectModal={setShowLoadProjectModal} 
          setShowAnalytics={setShowAnalytics} 
          setShowBESSAnalytics={setShowBESSAnalytics} 
          setShowFinancing={setShowFinancing}
          setShowTemplates={setShowTemplates} 
          setShowChatModal={setShowChatModal} 
          setShowPricingDataCapture={setShowPricingDataCapture} 
          setShowMarketIntelligence={setShowMarketIntelligence} 
          setShowVendorSponsorship={setShowVendorSponsorship}
          setShowPrivacyPolicy={setShowPrivacyPolicy} 
          setShowTermsOfService={setShowTermsOfService} 
          setShowSecuritySettings={setShowSecuritySettings} 
          setShowSystemHealth={setShowSystemHealth} 
          setShowStatusPage={setShowStatusPage}
          setShowUtilityRates={setShowUtilityRates} 
          setShowQuoteTemplates={setShowQuoteTemplates} 
          setShowPricingPresets={setShowPricingPresets} 
          setShowReviewWorkflow={setShowReviewWorkflow}
          setShowCostSavingsModal={setShowCostSavingsModal} 
          setShowRevenueModal={setShowRevenueModal} 
          setShowSustainabilityModal={setShowSustainabilityModal}
          setShowPowerAdjustmentModal={setShowPowerAdjustmentModal}
          setSelectedUseCaseForAdjustment={setSelectedUseCaseForAdjustment}
          isLoggedIn={isLoggedIn} 
          setIsLoggedIn={setIsLoggedIn} 
          handleLoginSuccess={handleLoginSuccess} 
          handleGoHome={handleGoHome} 
          handleProfileSetup={handleProfileSetup} 
          handleStartWizard={handleStartWizard}
          handleProfileComplete={handleProfileComplete} 
          handleContinueToEnhancedProfile={handleContinueToEnhancedProfile} 
          handleEnhancedProfileClose={handleEnhancedProfileClose} 
          loadProjectFromStorage={loadProjectFromStorage} 
          handleUploadProject={handleUploadProject}
          handleCreateWithWizard={handleCreateWithWizard} 
          handleUploadFromComputer={handleUploadFromComputer} 
          handleUploadFromPortfolio={handleUploadFromPortfolio} 
          handleApplyTemplate={handleApplyTemplate} 
          handleApplyUseCaseTemplate={handleApplyUseCaseTemplate}
          isFirstTimeProfile={isFirstTimeProfile}
          quoteName={quoteName} 
          powerMW={powerMW} 
          standbyHours={standbyHours} 
          solarMWp={solarMWp} 
          windMW={windMW} 
          generatorMW={generatorMW}
          batteryKwh={batteryKwh} 
          pcsKw={pcsKw} 
          bosPercent={bosPercent} 
          epcPercent={epcPercent} 
          genKw={genKw} 
          solarKwp={solarKwp} 
          windKw={windKw} 
          location={location} 
          grandCapEx={grandCapEx}
          annualSavings={annualSavings} 
          valueKwh={valueKwh} 
          warranty={warranty} 
          currentQuoteStatus={currentQuoteStatus}
          setPowerMW={setPowerMW} 
          setStandbyHours={setStandbyHours} 
          setUseCase={setUseCase} 
          setWarranty={setWarranty} 
          setSolarMWp={setSolarMWp} 
          setWindMW={setWindMW} 
          setGeneratorMW={setGeneratorMW}
          setValueKwh={setValueKwh} 
          setCurrentQuoteStatus={setCurrentQuoteStatus}
        />
      </>
    );
  }

  // Build modal manager props using utility function
  const modalManagerProps = buildModalManagerProps(
    // Modal states
    {
      showUserProfile, showPortfolio, showAuthModal, showVendorManager, showPricingPlans,
      showWelcomeModal, showAccountSetup, showEnhancedProfile, showJoinModal, showSmartWizard,
      showCalculationModal, showSaveProjectModal, showLoadProjectModal, showAnalytics, showBESSAnalytics, showFinancing,
      showTemplates, showChatModal, showPricingDataCapture, showMarketIntelligence, showVendorSponsorship,
      showPrivacyPolicy, showTermsOfService, showSecuritySettings, showSystemHealth, showStatusPage,
      showUtilityRates, showQuoteTemplates, showPricingPresets, showReviewWorkflow,
      showCostSavingsModal, showRevenueModal, showSustainabilityModal, showPowerAdjustmentModal
    },
    // Modal setters
    {
      setShowUserProfile, setShowPortfolio, setShowAuthModal, setShowVendorManager, setShowPricingPlans,
      setShowWelcomeModal, setShowAccountSetup, setShowEnhancedProfile, setShowJoinModal, setShowSmartWizard,
      setShowCalculationModal, setShowSaveProjectModal, setShowLoadProjectModal, setShowAnalytics, setShowBESSAnalytics, setShowFinancing,
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
          setShowAdvancedQuoteBuilder={setShowAdvancedQuoteBuilder}
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

        {/* Advanced Quote Builder Toggle - Show only when not already shown */}
        {!showAdvancedQuoteBuilder && (
          <section className="my-6">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
              {/* Advanced Quote Builder Button */}
              <button
                onClick={() => setShowAdvancedQuoteBuilder(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl transition-all inline-flex items-center gap-4"
              >
                <span className="text-3xl">🔧</span>
                <div className="text-left">
                  <div>Advanced Quote Builder</div>
                  <div className="text-sm font-normal opacity-90">Customize every detail of your system</div>
                </div>
              </button>

              {/* Vendor & Contact Buttons */}
              <div className="flex gap-3">
                <button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                  onClick={() => setShowVendorPortal(true)}
                >
                  <span className="text-xl">🏢</span>
                  <div className="text-left">
                    <div className="text-sm">Vendor Portal</div>
                    <div className="text-xs opacity-90">For suppliers & partners</div>
                  </div>
                </button>
                <a 
                  href="mailto:info@merlinenergy.com"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span className="text-xl">📧</span>
                  <div className="text-left">
                    <div className="text-sm">Contact Us</div>
                    <div className="text-xs opacity-90">Get in touch</div>
                  </div>
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">For technical users who want full control over pricing and configuration</p>
          </section>
        )}

        {/* Technical Quote Building Sections - Only shown in Advanced Mode */}
        <AdvancedQuoteBuilderSection
          // Display state
          showAdvancedQuoteBuilder={showAdvancedQuoteBuilder}
          setShowAdvancedQuoteBuilder={setShowAdvancedQuoteBuilder}
          
          // Project data
          quoteName={quoteName}
          setQuoteName={setQuoteName}
          powerMW={powerMW}
          setPowerMW={setPowerMW}
          standbyHours={standbyHours}
          setStandbyHours={setStandbyHours}
          gridMode={gridMode}
          setGridMode={setGridMode}
          useCase={useCase}
          setUseCase={setUseCase}
          generatorMW={generatorMW}
          setGeneratorMW={setGeneratorMW}
          solarMWp={solarMWp}
          setSolarMWp={setSolarMWp}
          windMW={windMW}
          setWindMW={setWindMW}
          utilization={utilization}
          setUtilization={setUtilization}
          warranty={warranty}
          setWarranty={setWarranty}
          
          // Pricing configuration
          batteryKwh={batteryKwh}
          setBatteryKwh={setBatteryKwh}
          pcsKw={pcsKw}
          setPcsKw={setPcsKw}
          bosPercent={bosPercent}
          setBosPercent={setBosPercent}
          epcPercent={epcPercent}
          setEpcPercent={setEpcPercent}
          tariffPercent={tariffPercent}
          setTariffPercent={setTariffPercent}
          solarKwp={solarKwp}
          setSolarKwp={setSolarKwp}
          windKw={windKw}
          setWindKw={setWindKw}
          genKw={genKw}
          setGenKw={setGenKw}
          onGridPcsFactor={onGridPcsFactor}
          setOnGridPcsFactor={setOnGridPcsFactor}
          offGridPcsFactor={offGridPcsFactor}
          setOffGridPcsFactor={setOffGridPcsFactor}
          
          // Financial data
          currency={currency}
          setCurrency={setCurrency}
          bessCapEx={bessCapEx}
          grandCapEx={grandCapEx}
          annualSavings={annualSavings}
          roiYears={roiYears}
          currentQuoteStatus={currentQuoteStatus}
          
          // Calculated values
          actualDuration={actualDuration}
          totalMWh={totalMWh}
          annualEnergyMWh={annualEnergyMWh}
          effectiveBatteryKwh={effectiveBatteryKwh}
          pcsKW={pcsKW}
          
          // Handlers
          handleSaveProject={handleSaveProject}
          handleLoadProject={handleLoadProject}
          handlePortfolio={handlePortfolio}
          handleResetToDefaults={handleResetToDefaults}
          getCurrencySymbol={() => getCurrencySymbol(currency)}
          convertCurrency={convertCurrency}
          handleExportWord={handleExportWord}
          setShowCalculationModal={setShowCalculationModal}
          handleExportCalculations={handleExportCalculations}
          setShowAnalytics={setShowAnalytics}
          setShowFinancing={setShowFinancing}
          setShowTemplates={setShowTemplates}
          setShowUtilityRates={setShowUtilityRates}
          setShowQuoteTemplates={setShowQuoteTemplates}
          setShowPricingPresets={setShowPricingPresets}
          setShowReviewWorkflow={setShowReviewWorkflow}
          renderMainQuoteForm={renderMainQuoteForm}
          
          // Styles
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />

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
    <ModalManager key={`modal-${showBESSAnalytics}`} {...modalManagerProps} />

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
