#!/bin/bash

# Script to replace modal state setters with useModalManager calls
FILE="src/components/BessQuoteBuilder.tsx"

# Define modal replacements
declare -A modals=(
    ["setShowUserProfile"]="'showUserProfile'"
    ["setShowSmartWizard"]="'showSmartWizard'"
    ["setShowVendorManager"]="'showVendorManager'"
    ["setShowPricingPlans"]="'showPricingPlans'"
    ["setShowWelcomeModal"]="'showWelcomeModal'"
    ["setShowAccountSetup"]="'showAccountSetup'"
    ["setShowEnhancedProfile"]="'showEnhancedProfile'"
    ["setShowAnalytics"]="'showAnalytics'"
    ["setShowEnhancedAnalytics"]="'showEnhancedAnalytics'"
    ["setShowEnhancedBESSAnalytics"]="'showEnhancedBESSAnalytics'"
    ["setShowFinancing"]="'showFinancing'"
    ["setShowTemplates"]="'showTemplates'"
    ["setShowAbout"]="'showAbout'"
    ["setShowVendorPortal"]="'showVendorPortal'"
    ["setShowPortfolio"]="'showPortfolio'"
    ["setShowCalculationModal"]="'showCalculationModal'"
    ["setShowSaveProjectModal"]="'showSaveProjectModal'"
    ["setShowLoadProjectModal"]="'showLoadProjectModal'"
    ["setShowPricingDataCapture"]="'showPricingDataCapture'"
    ["setShowMarketIntelligence"]="'showMarketIntelligence'"
    ["setShowVendorSponsorship"]="'showVendorSponsorship'"
    ["setShowPrivacyPolicy"]="'showPrivacyPolicy'"
    ["setShowTermsOfService"]="'showTermsOfService'"
    ["setShowSecuritySettings"]="'showSecuritySettings'"
    ["setShowSystemHealth"]="'showSystemHealth'"
    ["setShowStatusPage"]="'showStatusPage'"
    ["setShowUtilityRates"]="'showUtilityRates'"
    ["setShowQuoteTemplates"]="'showQuoteTemplates'"
    ["setShowPricingPresets"]="'showPricingPresets'"
    ["setShowReviewWorkflow"]="'showReviewWorkflow'"
    ["setShowQuotePreview"]="'showQuotePreview'"
    ["setShowLayoutPreferenceModal"]="'showLayoutPreferenceModal'"
)

# Replace true/false setters
for setter in "${!modals[@]}"; do
    modal_name=${modals[$setter]}
    sed -i '' "s/${setter}(true)/openModal(${modal_name})/g" "$FILE"
    sed -i '' "s/${setter}(false)/closeModal(${modal_name})/g" "$FILE"
done

echo "Modal setter replacement complete!"