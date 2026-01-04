import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ProfileData } from "../components/modals/AccountSetup";

// Define all modal state types
interface ModalStates {
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
  showFinancing: boolean;
  showTemplates: boolean;
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
  showCostSavingsModal: boolean;
  showRevenueModal: boolean;
  showSustainabilityModal: boolean;
}

interface ApplicationData {
  // Authentication state
  isLoggedIn: boolean;
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
  currentQuoteStatus: "draft" | "in-review" | "approved" | "rejected" | "shared";
}

interface ModalHandlers {
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
}

interface ApplicationSetters {
  setIsLoggedIn: (loggedIn: boolean) => void;
  setPowerMW: (power: number) => void;
  setStandbyHours: (hours: number) => void;
  setUseCase: (useCase: string) => void;
  setWarranty: (warranty: string) => void;
  setSolarMWp: (solar: number) => void;
  setWindMW: (wind: number) => void;
  setGeneratorMW: (generator: number) => void;
  setValueKwh: (value: number) => void;
  setCurrentQuoteStatus: (
    status: "draft" | "in-review" | "approved" | "rejected" | "shared"
  ) => void;
}

interface ModalContextType {
  // Modal states
  modals: ModalStates;

  // Application data
  data: ApplicationData;

  // Modal actions
  openModal: (modalName: keyof ModalStates) => void;
  closeModal: (modalName: keyof ModalStates) => void;
  closeAllModals: () => void;

  // Application handlers
  handlers: ModalHandlers;

  // Application setters
  setters: ApplicationSetters;
}

const initialModalState: ModalStates = {
  showUserProfile: false,
  showPortfolio: false,
  showAuthModal: false,
  showVendorManager: false,
  showPricingPlans: false,
  showWelcomeModal: false,
  showAccountSetup: false,
  showEnhancedProfile: false,
  showJoinModal: false,
  showSmartWizard: false,
  showCalculationModal: false,
  showSaveProjectModal: false,
  showLoadProjectModal: false,
  showAnalytics: false,
  showFinancing: false,
  showTemplates: false,
  showPricingDataCapture: false,
  showMarketIntelligence: false,
  showVendorSponsorship: false,
  showPrivacyPolicy: false,
  showTermsOfService: false,
  showSecuritySettings: false,
  showSystemHealth: false,
  showStatusPage: false,
  showUtilityRates: false,
  showQuoteTemplates: false,
  showPricingPresets: false,
  showReviewWorkflow: false,
  showCostSavingsModal: false,
  showRevenueModal: false,
  showSustainabilityModal: false,
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
  initialData: ApplicationData;
  handlers: ModalHandlers;
  setters: ApplicationSetters;
}

export function ModalProvider({ children, initialData, handlers, setters }: ModalProviderProps) {
  const [modals, setModals] = useState<ModalStates>(initialModalState);

  const openModal = (modalName: keyof ModalStates) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof ModalStates) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  const closeAllModals = () => {
    setModals(initialModalState);
  };

  const contextValue: ModalContextType = {
    modals,
    data: initialData,
    openModal,
    closeModal,
    closeAllModals,
    handlers,
    setters,
  };

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>;
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
}
