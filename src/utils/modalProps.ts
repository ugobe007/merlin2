import type { ProfileData } from '../components/modals/AccountSetup';

export interface ModalManagerProps {
  // Modal state flags
  showUserProfile: boolean;
  showPortfolio: boolean;
  showAuthModal: boolean;
  showVendorManager: boolean;
  showPricingPlans: boolean;
  showWelcomeModal: boolean;
  showAccountSetup: boolean;
  showEnhancedProfile: boolean;
  showJoinModal: boolean;
  showSmartWizard: boolean;
  showCalculationModal: boolean;
  showSaveProjectModal: boolean;
  showLoadProjectModal: boolean;
  showAnalytics: boolean;
  showBESSAnalytics: boolean;
  showFinancing: boolean;
  showTemplates: boolean;
  showChatModal: boolean;
  showPricingDataCapture: boolean;
  showMarketIntelligence: boolean;
  showVendorSponsorship: boolean;
  showPrivacyPolicy: boolean;
  showTermsOfService: boolean;
  showSecuritySettings: boolean;
  showSystemHealth: boolean;
  showStatusPage: boolean;
  showUtilityRates: boolean;
  showQuoteTemplates: boolean;
  showPricingPresets: boolean;
  showReviewWorkflow: boolean;
  showPowerAdjustmentModal: boolean;
  selectedUseCaseForAdjustment: any;
  showCostSavingsModal: boolean;
  showRevenueModal: boolean;
  showSustainabilityModal: boolean;

  // Modal setters
  setShowUserProfile: (show: boolean) => void;
  setShowPortfolio: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setShowVendorManager: (show: boolean) => void;
  setShowPricingPlans: (show: boolean) => void;
  setShowWelcomeModal: (show: boolean) => void;
  setShowAccountSetup: (show: boolean) => void;
  setShowEnhancedProfile: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
  setShowSmartWizard: (show: boolean) => void;
  setShowCalculationModal: (show: boolean) => void;
  setShowSaveProjectModal: (show: boolean) => void;
  setShowLoadProjectModal: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowBESSAnalytics: (show: boolean) => void;
  setShowFinancing: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setShowChatModal: (show: boolean) => void;
  setShowPricingDataCapture: (show: boolean) => void;
  setShowMarketIntelligence: (show: boolean) => void;
  setShowVendorSponsorship: (show: boolean) => void;
  setShowPrivacyPolicy: (show: boolean) => void;
  setShowTermsOfService: (show: boolean) => void;
  setShowSecuritySettings: (show: boolean) => void;
  setShowSystemHealth: (show: boolean) => void;
  setShowStatusPage: (show: boolean) => void;
  setShowUtilityRates: (show: boolean) => void;
  setShowQuoteTemplates: (show: boolean) => void;
  setShowPricingPresets: (show: boolean) => void;
  setShowReviewWorkflow: (show: boolean) => void;
  setShowPowerAdjustmentModal: (show: boolean) => void;
  setSelectedUseCaseForAdjustment: (useCase: any) => void;
  setShowCostSavingsModal: (show: boolean) => void;
  setShowRevenueModal: (show: boolean) => void;
  setShowSustainabilityModal: (show: boolean) => void;

  // Data and handlers
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  handleLoginSuccess: () => void;
  handleGoHome: () => void;
  handleProfileSetup: () => void;
  handleStartWizard: () => void;
  handleProfileComplete: (profileData: ProfileData) => void;
  handleContinueToEnhancedProfile: () => void;
  handleEnhancedProfileClose: () => void;
  loadProjectFromStorage: (quote: any) => void;
  handleUploadProject: () => void;
  handleCreateWithWizard: () => void;
  handleUploadFromComputer: () => void;
  handleUploadFromPortfolio: () => void;
  handleApplyTemplate: (template: any) => void;
  handleApplyUseCaseTemplate: (useCase: any) => void;
  isFirstTimeProfile: boolean;

  // Project data
  quoteName: string;
  powerMW: number;
  standbyHours: number;
  solarMWp: number;
  windMW: number;
  generatorMW: number;
  batteryKwh: number;
  pcsKw: number;
  bosPercent: number;
  epcPercent: number;
  genKw: number;
  solarKwp: number;
  windKw: number;
  location: string;
  grandCapEx: number;
  annualSavings: number;
  valueKwh: number;
  warranty: string;
  currentQuoteStatus: 'draft' | 'in-review' | 'approved' | 'rejected' | 'shared';
  
  // Setters for wizard data
  setPowerMW: (power: number) => void;
  setStandbyHours: (hours: number) => void;
  setUseCase: (useCase: string) => void;
  setWarranty: (warranty: string) => void;
  setSolarMWp: (solar: number) => void;
  setWindMW: (wind: number) => void;
  setGeneratorMW: (generator: number) => void;
  setValueKwh: (value: number) => void;
  setCurrentQuoteStatus: (status: 'draft' | 'in-review' | 'approved' | 'rejected' | 'shared') => void;
}

export function buildModalManagerProps(
  modalStates: Record<string, boolean>,
  modalSetters: Record<string, (show: boolean) => void>,
  applicationData: Record<string, any>,
  handlers: Record<string, any>
): ModalManagerProps {
  return {
    // Extract modal states
    showUserProfile: modalStates.showUserProfile,
    showPortfolio: modalStates.showPortfolio,
    showAuthModal: modalStates.showAuthModal,
    showVendorManager: modalStates.showVendorManager,
    showPricingPlans: modalStates.showPricingPlans,
    showWelcomeModal: modalStates.showWelcomeModal,
    showAccountSetup: modalStates.showAccountSetup,
    showEnhancedProfile: modalStates.showEnhancedProfile,
    showJoinModal: modalStates.showJoinModal,
    showSmartWizard: modalStates.showSmartWizard,
    showCalculationModal: modalStates.showCalculationModal,
    showSaveProjectModal: modalStates.showSaveProjectModal,
    showLoadProjectModal: modalStates.showLoadProjectModal,
    showAnalytics: modalStates.showAnalytics,
    showBESSAnalytics: modalStates.showBESSAnalytics,
    showFinancing: modalStates.showFinancing,
    showTemplates: modalStates.showTemplates,
    showChatModal: modalStates.showChatModal,
    showPricingDataCapture: modalStates.showPricingDataCapture,
    showMarketIntelligence: modalStates.showMarketIntelligence,
    showVendorSponsorship: modalStates.showVendorSponsorship,
    showPrivacyPolicy: modalStates.showPrivacyPolicy,
    showTermsOfService: modalStates.showTermsOfService,
    showSecuritySettings: modalStates.showSecuritySettings,
    showSystemHealth: modalStates.showSystemHealth,
    showStatusPage: modalStates.showStatusPage,
    showUtilityRates: modalStates.showUtilityRates,
    showQuoteTemplates: modalStates.showQuoteTemplates,
    showPricingPresets: modalStates.showPricingPresets,
    showReviewWorkflow: modalStates.showReviewWorkflow,
    showPowerAdjustmentModal: modalStates.showPowerAdjustmentModal,
    selectedUseCaseForAdjustment: applicationData.selectedUseCaseForAdjustment,
    showCostSavingsModal: modalStates.showCostSavingsModal,
    showRevenueModal: modalStates.showRevenueModal,
    showSustainabilityModal: modalStates.showSustainabilityModal,

    // Extract modal setters
    setShowUserProfile: modalSetters.setShowUserProfile,
    setShowPortfolio: modalSetters.setShowPortfolio,
    setShowAuthModal: modalSetters.setShowAuthModal,
    setShowVendorManager: modalSetters.setShowVendorManager,
    setShowPricingPlans: modalSetters.setShowPricingPlans,
    setShowWelcomeModal: modalSetters.setShowWelcomeModal,
    setShowAccountSetup: modalSetters.setShowAccountSetup,
    setShowEnhancedProfile: modalSetters.setShowEnhancedProfile,
    setShowJoinModal: modalSetters.setShowJoinModal,
    setShowSmartWizard: modalSetters.setShowSmartWizard,
    setShowCalculationModal: modalSetters.setShowCalculationModal,
    setShowSaveProjectModal: modalSetters.setShowSaveProjectModal,
    setShowLoadProjectModal: modalSetters.setShowLoadProjectModal,
    setShowAnalytics: modalSetters.setShowAnalytics,
    setShowBESSAnalytics: modalSetters.setShowBESSAnalytics,
    setShowFinancing: modalSetters.setShowFinancing,
    setShowTemplates: modalSetters.setShowTemplates,
    setShowChatModal: modalSetters.setShowChatModal,
    setShowPricingDataCapture: modalSetters.setShowPricingDataCapture,
    setShowMarketIntelligence: modalSetters.setShowMarketIntelligence,
    setShowVendorSponsorship: modalSetters.setShowVendorSponsorship,
    setShowPrivacyPolicy: modalSetters.setShowPrivacyPolicy,
    setShowTermsOfService: modalSetters.setShowTermsOfService,
    setShowSecuritySettings: modalSetters.setShowSecuritySettings,
    setShowSystemHealth: modalSetters.setShowSystemHealth,
    setShowStatusPage: modalSetters.setShowStatusPage,
    setShowUtilityRates: modalSetters.setShowUtilityRates,
    setShowQuoteTemplates: modalSetters.setShowQuoteTemplates,
    setShowPricingPresets: modalSetters.setShowPricingPresets,
    setShowReviewWorkflow: modalSetters.setShowReviewWorkflow,
    setShowPowerAdjustmentModal: modalSetters.setShowPowerAdjustmentModal,
    setSelectedUseCaseForAdjustment: modalSetters.setSelectedUseCaseForAdjustment,
    setShowCostSavingsModal: modalSetters.setShowCostSavingsModal,
    setShowRevenueModal: modalSetters.setShowRevenueModal,
    setShowSustainabilityModal: modalSetters.setShowSustainabilityModal,

    // Extract application data and handlers
    ...applicationData,
    ...handlers
  } as ModalManagerProps;
}