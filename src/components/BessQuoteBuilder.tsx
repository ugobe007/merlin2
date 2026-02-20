/**
 * @deprecated This component is deprecated. Use QuoteEngine.generateQuote() instead.
 * Scheduled for removal in v3.0.0
 *
 * Migration guide:
 * - For hotel quotes: Use HotelWizard or QuoteEngine.generateQuote({ useCase: 'hotel', ... })
 * - For car wash quotes: Use CarWashWizard or QuoteEngine.generateQuote({ useCase: 'car-wash', ... })
 * - For EV quotes: Use EVChargingWizard or QuoteEngine.generateQuote({ useCase: 'ev-charging', ... })
 * - For generic quotes: Use StreamlinedWizard or QuoteEngine.generateQuote({ ... })
 * - For advanced configuration: Use AdvancedQuoteBuilder
 */
import React, { useState, useEffect } from "react";
import { buildModalManagerProps } from "../utils/modalProps";
import { useBessQuoteBuilder } from "../hooks/useBessQuoteBuilder";
// import { saveAs } from "file-saver"; // Unused
// import { UTILITY_RATES } from "../utils/energyCalculations"; // Unused
import { authService } from "@/services/authService";
// import WordExportService from "../services/export/WordExportService"; // Unused
import HeroSection from "./sections/HeroSection";
import MainQuoteForm from "./forms/MainQuoteForm";
import ModalManager from "./modals/ModalManager";
import QuotePreviewModal from "./modals/QuotePreviewModal";
// import AboutMerlin from "./AboutMerlin"; // Unused
// import VendorPortal from "./VendorPortal"; // Unused
// import EnergyNewsTicker from "./EnergyNewsTicker"; // Unused
import PublicProfileViewer from "./PublicProfileViewer";
// import UseCaseTemplates from "./UseCaseTemplates"; // Unused
import { UseCaseAdminDashboard } from "./admin/UseCaseAdminDashboard";
// import EnhancedBESSAnalytics from "./EnhancedBESSAnalytics"; // Unused
// import FinancingCalculator from "./FinancingCalculator"; // Unused
// import AIChatModal from "./modals/AIChatModal"; // Unused
// import type { ProfileData } from "./modals/AccountSetup"; // Unused
import AboutView from "./views/AboutView";
import VendorPortalView from "./views/VendorPortalView";
// Import NREL-based pricing from unified service
import {
  getBatteryPricing,
  getSolarPricing,
  getWindPricing,
  getGeneratorPricing,
} from "@/services/unifiedPricingService";

// NEW: Clean unified Advanced Quote Builder component
import AdvancedQuoteBuilder from "./AdvancedQuoteBuilder";

export default function BessQuoteBuilder() {
  // ⚠️ DEPRECATION WARNING
  useEffect(() => {
    console.warn(
      "⚠️ DEPRECATED: BessQuoteBuilder is deprecated and will be removed in v3.0.0. " +
        "Please migrate to QuoteEngine.generateQuote() or use AdvancedQuoteBuilder."
    );
  }, []);

  // Local state to track if wizard should start in advanced mode
  const [startWizardInAdvancedMode, setStartWizardInAdvancedMode] = useState(false);
  // Local state to track if wizard should skip intro
  const [showProfessionalAnalytics, setShowProfessionalAnalytics] = useState(false);
  const [skipWizardIntro, setSkipWizardIntro] = useState(false);
  // Local state to track the initial view for Advanced Quote Builder
  const [advancedQuoteBuilderInitialView, setAdvancedQuoteBuilderInitialView] = useState<
    "landing" | "custom-config" | "interactive-dashboard" | "professional-model"
  >("landing");

  // Use custom hook for all state management
  const { state, actions, exchangeRates: _exchangeRates } = useBessQuoteBuilder();

  // Destructure commonly used state values for easier access
  const {
    viewMode,
    publicProfileSlug,
    showAdvancedQuoteBuilder: _showAdvancedQuoteBuilder,
    userLayoutPreference: _userLayoutPreference,
    showLayoutPreferenceModal: _showLayoutPreferenceModal,
    energyCapacity,
    powerRating,
    showAdvancedOptions,
    quoteName,
    showUserProfile,
    showSmartWizard,
    showAdvancedQuoteBuilderModal,
    showVendorManager,
    showJoinModal,
    showAuthModal,
    showPricingPlans,
    showWelcomeModal,
    showAccountSetup,
    showEnhancedProfile,
    isFirstTimeProfile,
    isLoggedIn,
    showAnalytics,
    showBESSAnalytics,
    showFinancing,
    showTemplates,
    showChatModal,
    showAbout,
    showVendorPortal,
    showPortfolio,
    showCalculationModal,
    showSaveProjectModal,
    showLoadProjectModal,
    showPricingDataCapture,
    showMarketIntelligence,
    showVendorSponsorship,
    showPrivacyPolicy,
    showCostSavingsModal,
    showRevenueModal,
    showSustainabilityModal,
    showTermsOfService,
    showSecuritySettings,
    showSystemHealth,
    showStatusPage,
    showUtilityRates,
    showQuoteTemplates,
    showPricingPresets,
    showReviewWorkflow,
    showPowerAdjustmentModal,
    selectedUseCaseForAdjustment,
    currentQuoteStatus,
    currentQuote,
    showQuotePreview,
    powerMW,
    standbyHours,
    gridMode,
    useCase,
    generatorMW,
    solarMWp,
    windMW,
    valueKwh,
    utilization: _utilization,
    warranty,
    location,
    selectedCountry,
    currency,
    energyUnit,
    powerUnit,
    applicationType,
    batteryKwh,
    pcsKw,
    bosPercent,
    epcPercent,
    offGridPcsFactor: _offGridPcsFactor,
    onGridPcsFactor: _onGridPcsFactor,
    genKw,
    solarKwp,
    windKw,
    tariffPercent: _tariffPercent,
  } = state;

  // Destructure commonly used actions for easier access
  const {
    setViewMode,
    setPublicProfileSlug,
    setShowAdvancedQuoteBuilder: _setShowAdvancedQuoteBuilder,
    setUserLayoutPreference: _setUserLayoutPreference,
    setShowLayoutPreferenceModal: _setShowLayoutPreferenceModal,
    setEnergyCapacity,
    setPowerRating,
    setShowAdvancedOptions,
    setQuoteName: _setQuoteName,
    setShowUserProfile,
    setShowSmartWizard,
    setShowAdvancedQuoteBuilderModal,
    setShowVendorManager,
    setShowJoinModal,
    setShowAuthModal,
    setShowPricingPlans,
    setShowWelcomeModal,
    setShowAccountSetup,
    setShowEnhancedProfile,
    setIsFirstTimeProfile: _setIsFirstTimeProfile,
    setIsLoggedIn,
    setShowAnalytics,
    setShowBESSAnalytics,
    setShowFinancing,
    setShowTemplates,
    setShowChatModal,
    setShowAbout,
    setShowVendorPortal,
    setShowPortfolio,
    setShowCalculationModal,
    setShowSaveProjectModal,
    setShowLoadProjectModal,
    setShowPricingDataCapture,
    setShowMarketIntelligence,
    setShowVendorSponsorship,
    setShowPrivacyPolicy,
    setShowCostSavingsModal,
    setShowRevenueModal,
    setShowSustainabilityModal,
    setShowTermsOfService,
    setShowSecuritySettings,
    setShowSystemHealth,
    setShowStatusPage,
    setShowUtilityRates,
    setShowQuoteTemplates,
    setShowPricingPresets,
    setShowReviewWorkflow,
    setShowPowerAdjustmentModal,
    setSelectedUseCaseForAdjustment,
    setCurrentQuoteStatus,
    setCurrentQuote,
    setShowQuotePreview,
    setPowerMW,
    setStandbyHours,
    setGridMode: _setGridMode,
    setUseCase,
    setGeneratorMW,
    setSolarMWp,
    setWindMW,
    setValueKwh,
    setUtilization: _setUtilization,
    setWarranty,
    setLocation: _setLocation,
    setSelectedCountry: _setSelectedCountry,
    setCurrency: _setCurrency,
    setEnergyUnit,
    setPowerUnit,
    setApplicationType,
    setBatteryKwh: _setBatteryKwh,
    setPcsKw: _setPcsKw,
    setBosPercent: _setBosPercent,
    setEpcPercent: _setEpcPercent,
    setOffGridPcsFactor: _setOffGridPcsFactor,
    setOnGridPcsFactor: _setOnGridPcsFactor,
    setGenKw: _setGenKw,
    setSolarKwp: _setSolarKwp,
    setWindKw: _setWindKw,
    setTariffPercent: _setTariffPercent,
    // Handler functions from the hook
    handleLoginSuccess,
    handleProfileSetup,
    handleStartWizard,
    handleGoHome,
    handleAdvancedQuoteBuilder: _handleAdvancedQuoteBuilder,
    handleLayoutPreference: _handleLayoutPreference,
    handleSaveLayoutPreference: _handleSaveLayoutPreference,
    handleProfileComplete,
    handleContinueToEnhancedProfile,
    handleEnhancedProfileClose,
    handleSaveProject,
    handleUploadProject,
    handleCreateWithWizard,
    handleSaveToPortfolio: _handleSaveToPortfolio,
    handleLoadProject: _handleLoadProject,
    handleUploadFromComputer,
    handleUploadFromPortfolio,
    handlePortfolio: _handlePortfolio,
    handleUserProfile: _handleUserProfile,
    handleResetToDefaults: _handleResetToDefaults,
    handleExportCalculations: _handleExportCalculations,
    handleApplyTemplate,
    handleApplyUseCaseTemplate,
    handleExportWord: _handleExportWord,
    convertCurrency: _convertCurrency,
    loadProjectData: _loadProjectData,
    loadProjectFromStorage,
  } = actions;

  // ✅ USE SSOT: State for battery pricing from unifiedPricingService
  // MUST be declared before any early returns to comply with React hooks rules
  const [batteryPricePerKwh, setBatteryPricePerKwh] = useState(155); // Default NREL ATB 2024
  const [solarPricePerKw, setSolarPricePerKw] = useState(850);
  const [windPricePerKw, setWindPricePerKw] = useState(1200);
  const [genPricePerKw, setGenPricePerKw] = useState(500);

  // Check for URL parameters OR /quote-builder path to open Advanced Quote Builder directly
  // MUST be before any early returns to comply with React hooks rules
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const advancedParam = urlParams.get("advanced");
    const verticalParam = urlParams.get("vertical");
    const viewParam = urlParams.get("view"); // New: specify initial view
    const isQuoteBuilderPath = window.location.pathname === "/quote-builder";

    if (advancedParam === "true" || isQuoteBuilderPath) {
      // Set the use case if coming from a vertical
      if (verticalParam) {
        setUseCase(verticalParam);
      }
      // Set the initial view if specified (e.g., 'landing', 'custom-config')
      if (
        viewParam === "landing" ||
        viewParam === "custom-config" ||
        viewParam === "interactive-dashboard" ||
        viewParam === "professional-model"
      ) {
        setAdvancedQuoteBuilderInitialView(
          viewParam as "landing" | "custom-config" | "interactive-dashboard" | "professional-model"
        );
      }
      setShowAdvancedQuoteBuilderModal(true);
      // Clean up URL to root
      window.history.replaceState({}, "", "/");
    }
  }, [setUseCase, setAdvancedQuoteBuilderInitialView, setShowAdvancedQuoteBuilderModal]);

  useEffect(() => {
    // Simple routing check - look for /profile/ in URL
    const path = window.location.pathname;
    if (path.startsWith("/profile/")) {
      const slug = path.split("/profile/")[1];
      setPublicProfileSlug(slug);
      setViewMode("public-profile");
    }
  }, [setPublicProfileSlug, setViewMode]);

  // Effects and handlers go here
  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());

    // Load user layout preference
    const user = authService.getCurrentUser();
    if (user && user.preferences?.layoutPreference) {
      _setUserLayoutPreference(user.preferences.layoutPreference);
    }
  }, [setIsLoggedIn, _setUserLayoutPreference]);

  // Check if user needs to complete profile after login
  useEffect(() => {
    if (isLoggedIn) {
      const user = authService.getCurrentUser();
      if (user && !user.profileCompleted) {
        setShowWelcomeModal(true);
      }
    }
  }, [isLoggedIn, setShowWelcomeModal]);

  // Fetch SSOT pricing on mount and when size changes
  // MUST be before any early returns to comply with React hooks rules
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const _totalMWh = powerMW * standbyHours;
        const batteryPricing = await getBatteryPricing(
          powerMW,
          standbyHours,
          selectedCountry || "United States"
        );
        setBatteryPricePerKwh(batteryPricing.pricePerKWh);

        // Use scale-based solar pricing: < 5 MW = commercial, ≥ 5 MW = utility
        const solarMW = solarKwp / 1000; // Convert kWp to MW for scale-based pricing
        const solar = await getSolarPricing(solarMW);
        setSolarPricePerKw(solar.pricePerWatt * 1000); // Convert $/W to $/kW

        const wind = await getWindPricing();
        setWindPricePerKw(wind.pricePerKW);

        const gen = await getGeneratorPricing();
        setGenPricePerKw(gen.pricePerKW);
      } catch (error) {
        console.error("Error fetching pricing:", error);
      }
    };
    fetchPricing();
  }, [powerMW, standbyHours, selectedCountry, solarKwp, generatorMW, setBatteryPricePerKwh, setSolarPricePerKw, setWindPricePerKw, setGenPricePerKw]);

  // If viewing a public profile, show that instead - check early but after all hooks
  if (viewMode === "public-profile" && publicProfileSlug) {
    const _handleNavigateToApp = () => {
      window.history.pushState({}, "", "/");
      setViewMode("app");
      setShowAuthModal(true);
    };
    return <PublicProfileViewer profileSlug={publicProfileSlug} onSignUp={_handleNavigateToApp} />;
  }

  const _handleNavigateToApp2 = () => {
    window.history.pushState({}, "", "/");
    setViewMode("app");
    setShowAuthModal(true);
  };

  // Generic modal opener function
  const openModal = (modalName: string) => {
    switch (modalName) {
      case "showChatModal":
        setShowChatModal(true);
        break;
      case "showEnhancedAnalytics":
        setShowAnalytics(true);
        break;
      case "bessAnalytics":
        setShowBESSAnalytics(true);
        break;
      case "showTemplates":
        setShowTemplates(true);
        break;
      default:
        // Unknown modal
        break;
    }
  };

  // Render main quote form for advanced interface
  const _renderMainQuoteForm = () => (
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


  // NOTE: Legacy calculation logic removed - now using centralizedCalculations.ts via SmartWizardV3
  // Previously used quoteCalculations.ts → advancedFinancialModeling.ts → databaseCalculations.ts
  // All financial calculations now handled by SmartWizardV3 using centralizedCalculations.ts

  // Placeholder values for legacy components (analytics, financing modals)
  // These are deprecated and will be removed in future versions
  // Note: These placeholders exist for backward compatibility. Component deprecated in v3.0

  // Basic CapEx calculation for Advanced Quote Builder using SSOT pricing
  const totalMWh = powerMW * standbyHours;
  const effectiveBatteryKwh = totalMWh * 1000;

  // Calculate base BESS cost using SSOT pricing
  const bessCapEx = effectiveBatteryKwh * batteryPricePerKwh;

  // Add BOS and EPC costs (balance of system and engineering/procurement/construction)
  const bosMultiplier = 1 + bosPercent / 100;
  const epcMultiplier = 1 + epcPercent / 100;

  // Renewable costs using SSOT pricing
  const solarCost = solarKwp * solarPricePerKw;
  const windCost = windKw * windPricePerKw;
  const genCost = genKw * genPricePerKw;

  const grandCapEx = bessCapEx * bosMultiplier * epcMultiplier + solarCost + windCost + genCost;

  const annualSavings = 0;
  const _roiYears = 0;
  const _actualDuration = standbyHours;
  const _annualEnergyMWh = totalMWh * 365;
  const _pcsKW = powerMW * 1000;

  // Helper function for currency symbols (moved from deleted quoteCalculations.ts)
  const _getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
      INR: "₹",
      AUD: "A$",
      CAD: "C$",
      CHF: "CHF",
      SEK: "kr",
      NOK: "kr",
      DKK: "kr",
      RUB: "₽",
      BRL: "R$",
      ZAR: "R",
      AED: "د.إ",
      SAR: "﷼",
      KRW: "₩",
    };
    return symbols[currencyCode] || currencyCode;
  };

  const _inputStyle =
    "w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-blue-50";
  const _labelStyle = "block text-base font-semibold text-gray-800 mb-2 tracking-wide";
  const _cardStyle =
    "bg-gradient-to-b from-white via-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-8 shadow-xl relative overflow-hidden";

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
      showUserProfile,
      showPortfolio,
      showAuthModal,
      showVendorManager,
      showPricingPlans,
      showWelcomeModal,
      showAccountSetup,
      showEnhancedProfile,
      showJoinModal,
      showSmartWizard,
      showCalculationModal,
      showSaveProjectModal,
      showLoadProjectModal,
      showAnalytics,
      showProfessionalAnalytics,
      showBESSAnalytics,
      showFinancing,
      showTemplates,
      showChatModal,
      showPricingDataCapture,
      showMarketIntelligence,
      showVendorSponsorship,
      showPrivacyPolicy,
      showTermsOfService,
      showSecuritySettings,
      showSystemHealth,
      showStatusPage,
      showUtilityRates,
      showQuoteTemplates,
      showPricingPresets,
      showReviewWorkflow,
      showCostSavingsModal,
      showRevenueModal,
      showSustainabilityModal,
      showPowerAdjustmentModal,
    },
    // Modal setters
    {
      setShowUserProfile,
      setShowPortfolio,
      setShowAuthModal,
      setShowVendorManager,
      setShowPricingPlans,
      setShowWelcomeModal,
      setShowAccountSetup,
      setShowEnhancedProfile,
      setShowJoinModal,
      setShowSmartWizard,
      setShowCalculationModal,
      setShowSaveProjectModal,
      setShowLoadProjectModal,
      setShowAnalytics,
      setShowProfessionalAnalytics,
      setShowBESSAnalytics,
      setShowFinancing,
      setShowTemplates,
      setShowChatModal,
      setShowPricingDataCapture,
      setShowMarketIntelligence,
      setShowVendorSponsorship,
      setShowPrivacyPolicy,
      setShowTermsOfService,
      setShowSecuritySettings,
      setShowSystemHealth,
      setShowStatusPage,
      setShowUtilityRates,
      setShowQuoteTemplates,
      setShowPricingPresets,
      setShowReviewWorkflow,
      setShowCostSavingsModal,
      setShowRevenueModal,
      setShowSustainabilityModal,
      setShowPowerAdjustmentModal,
      setSelectedUseCaseForAdjustment,
    },
    // Application data
    {
      isLoggedIn,
      isFirstTimeProfile,
      quoteName,
      powerMW,
      standbyHours,
      solarMWp,
      windMW,
      generatorMW,
      batteryKwh,
      pcsKw,
      bosPercent,
      epcPercent,
      genKw,
      solarKwp,
      windKw,
      location,
      grandCapEx,
      annualSavings,
      valueKwh,
      warranty,
      currentQuoteStatus,
      currency,
      selectedCountry,
      applicationType,
      energyCapacity,
      selectedUseCaseForAdjustment,
    },
    // Handlers
    {
      handleLoginSuccess,
      handleGoHome,
      handleProfileSetup,
      handleStartWizard,
      handleProfileComplete,
      handleContinueToEnhancedProfile,
      handleEnhancedProfileClose,
      loadProjectFromStorage,
      handleUploadProject,
      handleCreateWithWizard,
      handleUploadFromComputer,
      handleUploadFromPortfolio,
      handleApplyTemplate,
      handleApplyUseCaseTemplate,
      setPowerMW,
      setStandbyHours,
      setUseCase,
      setWarranty,
      setSolarMWp,
      setWindMW,
      setGeneratorMW,
      setValueKwh,
      setCurrentQuoteStatus,
      setIsLoggedIn,
    }
  );

  return (
    <>
      <div
        className="min-h-screen"
        style={{
          background:
            "linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)",
        }}
      >
        <main>
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
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.8)",
              }}
            >
              <QuotePreviewModal
                isOpen={showQuotePreview}
                onClose={() => setShowQuotePreview(false)}
                quoteData={currentQuote}
              />
            </div>
          )}

          {/* Footer — Supabase-clean */}
          <footer
            className="mt-0 py-8 px-6"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "#070a12",
            }}
          >
            <div className="max-w-5xl mx-auto">
              {/* Primary links */}
              <div className="flex items-center justify-center gap-5 mb-4 flex-wrap">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Privacy
                </button>
                <button
                  onClick={() => setShowTermsOfService(true)}
                  className="text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Terms
                </button>
                <button
                  onClick={() => setShowSecuritySettings(true)}
                  className="text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Security
                </button>
                <a
                  href="/support"
                  className="text-sm transition-colors no-underline"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Support & FAQ
                </a>
                {isLoggedIn && (
                <button
                  onClick={() => setShowVendorManager(true)}
                  className="text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Admin
                </button>
                )}
                <a
                  href="/pricing"
                  className="text-sm transition-colors no-underline"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                >
                  Pricing
                </a>
                <a
                  href="/vendor"
                  className="text-[13px] font-medium no-underline transition-all duration-200 px-4 py-1.5 rounded-md border"
                  style={{
                    color: "rgba(56,189,248,0.7)",
                    borderColor: "rgba(56,189,248,0.25)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgba(56,189,248,1)";
                    e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)";
                    e.currentTarget.style.background = "rgba(56,189,248,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(56,189,248,0.7)";
                    e.currentTarget.style.borderColor = "rgba(56,189,248,0.25)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  For Vendors
                </a>
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      alert("You have been logged out successfully");
                    }}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
              {/* Copyright */}
              <p
                className="text-center text-xs"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                © 2026 Merlin Energy. All rights reserved.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* MODAL MANAGER - Always rendered regardless of showAdvancedQuoteBuilder state */}
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
      <AdvancedQuoteBuilder
        show={showAdvancedQuoteBuilderModal}
        initialView={advancedQuoteBuilderInitialView}
        onClose={() => {
          setShowAdvancedQuoteBuilderModal(false);
          // Reset to landing view for next open
          setAdvancedQuoteBuilderInitialView("landing");
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
        onSystemCostChange={(_cost) => {
          // System cost changes might affect grandCapEx calculation
          // For now, no-op - full integration would need more complex state management
        }}
        onGenerateQuote={() => {
          // Generate quote with current configuration
          const batteryMWh = powerMW * standbyHours;
          const batterySystemCost = batteryMWh * 200000; // $200/kWh for batteries
          const pcsCost = powerMW * 80000; // $80k/MW for PCS
          const bosCost = grandCapEx * (bosPercent / 100);
          const epcCost = grandCapEx * (epcPercent / 100);

          // Create complete quote object for QuotePreviewModal
          const generatedQuote = {
            clientName: "Custom Configuration",
            projectName: `${powerMW} MW / ${standbyHours}hr BESS System`,
            bessPowerMW: powerMW,
            duration: standbyHours,
            batteryMWh: batteryMWh,
            solarMW: solarMWp || 0,
            windMW: windMW || 0,
            generatorMW: generatorMW || 0,
            gridConnection: gridMode || "On-grid",
            application: useCase || "Commercial",
            location: location || "United States",
            warranty: warranty || "10 years",
            pcsIncluded: true,
            costs: {
              batterySystem: batterySystemCost,
              pcs: pcsCost,
              transformers: powerMW * 25000,
              inverters: powerMW * 15000,
              switchgear: powerMW * 20000,
              microgridControls: 50000,
              solar: (solarMWp || 0) * 850000,
              solarInverters: (solarMWp || 0) * 50000,
              wind: (windMW || 0) * 1200000,
              windConverters: (windMW || 0) * 100000,
              generator: (generatorMW || 0) * 200000,
              generatorControls: (generatorMW || 0) > 0 ? 25000 : 0,
              bos: bosCost,
              epc: epcCost,
              tariffs: grandCapEx * 0.05,
              shipping: grandCapEx * 0.03,
              grandTotal: grandCapEx,
            },
            annualSavings: batteryMWh * 365 * 0.15 * 1000, // Estimated savings
            paybackPeriod: grandCapEx / (batteryMWh * 365 * 0.15 * 1000),
          };

          // Set the quote and open preview
          setCurrentQuote(generatedQuote);
          setShowAdvancedQuoteBuilderModal(false);
          setShowQuotePreview(true);
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
