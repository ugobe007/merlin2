#!/bin/bash

# Script to fix all modal references in BessQuoteBuilder.tsx
# This converts from individual useState to useModalManager hook

FILE_PATH="src/components/BessQuoteBuilder.tsx"

echo "Fixing all modal references in $FILE_PATH..."

# Fix remaining setters first
sed -i '' '
s/setShowChatModal(true)/openModal('\''showChatModal'\'')/g
s/setShowChatModal(false)/closeModal('\''showChatModal'\'')/g
s/setShowEnhancedAnalytics(true)/openModal('\''showEnhancedAnalytics'\'')/g
s/setShowEnhancedAnalytics(false)/closeModal('\''showEnhancedAnalytics'\'')/g
s/setShowWelcomeModal(true)/openModal('\''showWelcomeModal'\'')/g
s/setShowWelcomeModal(false)/closeModal('\''showWelcomeModal'\'')/g
s/setShowAccountSetup(true)/openModal('\''showAccountSetup'\'')/g
s/setShowAccountSetup(false)/closeModal('\''showAccountSetup'\'')/g
s/setShowEnhancedProfile(true)/openModal('\''showEnhancedProfile'\'')/g
s/setShowEnhancedProfile(false)/closeModal('\''showEnhancedProfile'\'')/g
s/setShowLoadProjectModal(true)/openModal('\''showLoadProjectModal'\'')/g
s/setShowLoadProjectModal(false)/closeModal('\''showLoadProjectModal'\'')/g
s/setShowPortfolio(true)/openModal('\''showPortfolio'\'')/g
s/setShowPortfolio(false)/closeModal('\''showPortfolio'\'')/g
s/setShowAbout(true)/openModal('\''showAbout'\'')/g
s/setShowAbout(false)/closeModal('\''showAbout'\'')/g
s/setShowVendorPortal(true)/openModal('\''showVendorPortal'\'')/g
s/setShowVendorPortal(false)/closeModal('\''showVendorPortal'\'')/g
s/setShowFinancing(true)/openModal('\''showFinancing'\'')/g
s/setShowFinancing(false)/closeModal('\''showFinancing'\'')/g
' "$FILE_PATH"

# Fix state variable references to use isModalOpen
sed -i '' '
s/showTemplates/isModalOpen('\''showTemplates'\'')/g
s/showEnhancedAnalytics/isModalOpen('\''showEnhancedAnalytics'\'')/g
s/showEnhancedBESSAnalytics/isModalOpen('\''showEnhancedBESSAnalytics'\'')/g
s/showFinancing/isModalOpen('\''showFinancing'\'')/g
s/showAbout/isModalOpen('\''showAbout'\'')/g
s/showVendorPortal/isModalOpen('\''showVendorPortal'\'')/g
s/showChatModal/isModalOpen('\''showChatModal'\'')/g
s/showUserProfile/isModalOpen('\''showUserProfile'\'')/g
s/showPortfolio/isModalOpen('\''showPortfolio'\'')/g
s/showAuthModal/isModalOpen('\''showAuthModal'\'')/g
s/showVendorManager/isModalOpen('\''showVendorManager'\'')/g
s/showPricingPlans/isModalOpen('\''showPricingPlans'\'')/g
s/showWelcomeModal/isModalOpen('\''showWelcomeModal'\'')/g
s/showAccountSetup/isModalOpen('\''showAccountSetup'\'')/g
s/showEnhancedProfile/isModalOpen('\''showEnhancedProfile'\'')/g
s/showSmartWizard/isModalOpen('\''showSmartWizard'\'')/g
' "$FILE_PATH"

echo "Phase 1 complete. Continuing with more setters..."

# Continue with more setters
sed -i '' '
s/setShowCostSavingsModal(true)/openModal('\''showCostSavingsModal'\'')/g
s/setShowCostSavingsModal(false)/closeModal('\''showCostSavingsModal'\'')/g
s/setShowRevenueModal(true)/openModal('\''showRevenueModal'\'')/g
s/setShowRevenueModal(false)/closeModal('\''showRevenueModal'\'')/g
s/setShowSustainabilityModal(true)/openModal('\''showSustainabilityModal'\'')/g
s/setShowSustainabilityModal(false)/closeModal('\''showSustainabilityModal'\'')/g
s/setShowQuotePreview(true)/openModal('\''showQuotePreview'\'')/g
s/setShowQuotePreview(false)/closeModal('\''showQuotePreview'\'')/g
s/setShowPricingDataCapture(true)/openModal('\''showPricingDataCapture'\'')/g
s/setShowPricingDataCapture(false)/closeModal('\''showPricingDataCapture'\'')/g
s/setShowCalculationModal(true)/openModal('\''showCalculationModal'\'')/g
s/setShowCalculationModal(false)/closeModal('\''showCalculationModal'\'')/g
s/setShowAnalytics(true)/openModal('\''showAnalytics'\'')/g
s/setShowAnalytics(false)/closeModal('\''showAnalytics'\'')/g
' "$FILE_PATH"

echo "Phase 2 complete. Continuing with utility and management setters..."

# More utility and management setters
sed -i '' '
s/setShowUtilityRates(true)/openModal('\''showUtilityRates'\'')/g
s/setShowUtilityRates(false)/closeModal('\''showUtilityRates'\'')/g
s/setShowQuoteTemplates(true)/openModal('\''showQuoteTemplates'\'')/g
s/setShowQuoteTemplates(false)/closeModal('\''showQuoteTemplates'\'')/g
s/setShowPricingPresets(true)/openModal('\''showPricingPresets'\'')/g
s/setShowPricingPresets(false)/closeModal('\''showPricingPresets'\'')/g
s/setShowReviewWorkflow(true)/openModal('\''showReviewWorkflow'\'')/g
s/setShowReviewWorkflow(false)/closeModal('\''showReviewWorkflow'\'')/g
s/setShowStatusPage(true)/openModal('\''showStatusPage'\'')/g
s/setShowStatusPage(false)/closeModal('\''showStatusPage'\'')/g
s/setShowPrivacyPolicy(true)/openModal('\''showPrivacyPolicy'\'')/g
s/setShowPrivacyPolicy(false)/closeModal('\''showPrivacyPolicy'\'')/g
s/setShowTermsOfService(true)/openModal('\''showTermsOfService'\'')/g
s/setShowTermsOfService(false)/closeModal('\''showTermsOfService'\'')/g
s/setShowSecuritySettings(true)/openModal('\''showSecuritySettings'\'')/g
s/setShowSecuritySettings(false)/closeModal('\''showSecuritySettings'\'')/g
s/setShowSystemHealth(true)/openModal('\''showSystemHealth'\'')/g
s/setShowSystemHealth(false)/closeModal('\''showSystemHealth'\'')/g
s/setShowVendorManager(true)/openModal('\''showVendorManager'\'')/g
s/setShowVendorManager(false)/closeModal('\''showVendorManager'\'')/g
' "$FILE_PATH"

echo "Phase 3 complete. Fixing remaining state variable references..."

# Fix remaining state variable references
sed -i '' '
s/showCalculationModal/isModalOpen('\''showCalculationModal'\'')/g
s/showSaveProjectModal/isModalOpen('\''showSaveProjectModal'\'')/g
s/showLoadProjectModal/isModalOpen('\''showLoadProjectModal'\'')/g
s/showAnalytics/isModalOpen('\''showAnalytics'\'')/g
s/showPricingDataCapture/isModalOpen('\''showPricingDataCapture'\'')/g
s/showMarketIntelligence/isModalOpen('\''showMarketIntelligence'\'')/g
s/showVendorSponsorship/isModalOpen('\''showVendorSponsorship'\'')/g
s/showPrivacyPolicy/isModalOpen('\''showPrivacyPolicy'\'')/g
s/showTermsOfService/isModalOpen('\''showTermsOfService'\'')/g
s/showSecuritySettings/isModalOpen('\''showSecuritySettings'\'')/g
s/showSystemHealth/isModalOpen('\''showSystemHealth'\'')/g
s/showStatusPage/isModalOpen('\''showStatusPage'\'')/g
s/showUtilityRates/isModalOpen('\''showUtilityRates'\'')/g
s/showQuoteTemplates/isModalOpen('\''showQuoteTemplates'\'')/g
s/showPricingPresets/isModalOpen('\''showPricingPresets'\'')/g
s/showReviewWorkflow/isModalOpen('\''showReviewWorkflow'\'')/g
s/showCostSavingsModal/isModalOpen('\''showCostSavingsModal'\'')/g
s/showRevenueModal/isModalOpen('\''showRevenueModal'\'')/g
s/showSustainabilityModal/isModalOpen('\''showSustainabilityModal'\'')/g
s/showQuotePreview/isModalOpen('\''showQuotePreview'\'')/g
' "$FILE_PATH"

echo "All modal references have been updated!"