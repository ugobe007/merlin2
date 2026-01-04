import { useState } from "react";

// Define the list of all modals used in BessQuoteBuilder
type ModalName =
  | "showJoinModal"
  | "showAuthModal"
  | "showUserProfile"
  | "showSmartWizard"
  | "showVendorManager"
  | "showPricingPlans"
  | "showWelcomeModal"
  | "showAccountSetup"
  | "showEnhancedProfile"
  | "showAnalytics"
  | "showEnhancedAnalytics"
  | "showEnhancedBESSAnalytics"
  | "showFinancing"
  | "showTemplates"
  | "showAbout"
  | "showVendorPortal"
  | "showChatModal"
  | "showPortfolio"
  | "showCalculationModal"
  | "showSaveProjectModal"
  | "showLoadProjectModal"
  | "showPricingDataCapture"
  | "showMarketIntelligence"
  | "showVendorSponsorship"
  | "showPrivacyPolicy"
  | "showCostSavingsModal"
  | "showRevenueModal"
  | "showSustainabilityModal"
  | "showTermsOfService"
  | "showSecuritySettings"
  | "showSystemHealth"
  | "showStatusPage"
  | "showUtilityRates"
  | "showQuoteTemplates"
  | "showPricingPresets"
  | "showReviewWorkflow"
  | "showQuotePreview"
  | "showLayoutPreferenceModal"
  | "showVerticalRedirect";

type ModalState = Record<ModalName, boolean>;

/**
 * Custom hook to manage modal state
 * Replaces the need for 30+ individual useState hooks
 */
export const useModalManager = () => {
  const [modals, setModals] = useState<ModalState>({
    showJoinModal: false,
    showAuthModal: false,
    showUserProfile: false,
    showSmartWizard: false,
    showVendorManager: false,
    showPricingPlans: false,
    showWelcomeModal: false,
    showAccountSetup: false,
    showEnhancedProfile: false,
    showAnalytics: false,
    showEnhancedAnalytics: false,
    showEnhancedBESSAnalytics: false,
    showFinancing: false,
    showTemplates: false,
    showAbout: false,
    showVendorPortal: false,
    showChatModal: false,
    showPortfolio: false,
    showCalculationModal: false,
    showSaveProjectModal: false,
    showLoadProjectModal: false,
    showPricingDataCapture: false,
    showMarketIntelligence: false,
    showVendorSponsorship: false,
    showPrivacyPolicy: false,
    showCostSavingsModal: false,
    showRevenueModal: false,
    showSustainabilityModal: false,
    showTermsOfService: false,
    showSecuritySettings: false,
    showSystemHealth: false,
    showStatusPage: false,
    showUtilityRates: false,
    showQuoteTemplates: false,
    showPricingPresets: false,
    showReviewWorkflow: false,
    showQuotePreview: false,
    showLayoutPreferenceModal: false,
    showVerticalRedirect: false,
  });

  // Open a specific modal
  const openModal = (modalName: ModalName) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  // Close a specific modal
  const closeModal = (modalName: ModalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  // Close all modals (useful for global close actions)
  const closeAllModals = () => {
    setModals((prev) => {
      const closedModals: ModalState = {} as ModalState;
      Object.keys(prev).forEach((key) => {
        closedModals[key as ModalName] = false;
      });
      return closedModals;
    });
  };

  // Toggle a modal
  const toggleModal = (modalName: ModalName) => {
    setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
  };

  // Check if a modal is open
  const isModalOpen = (modalName: ModalName) => modals[modalName];

  // Get count of open modals
  const openModalCount = Object.values(modals).filter(Boolean).length;

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,
    isModalOpen,
    openModalCount,
  };
};

export type { ModalName };
