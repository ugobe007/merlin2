import React from 'react';
import { createPortal } from 'react-dom';
import { authService } from '../../services/authService';
import EditableUserProfile from '../EditableUserProfile';
import Portfolio from '../Portfolio';
import AuthModal from '../AuthModal';
import VendorManager from '../VendorManager';
import PricingPlans from '../PricingPlans';
import WelcomeModal from './WelcomeModal';
import AccountSetup from './AccountSetup';
import EnhancedProfile from '../EnhancedProfile';
import JoinMerlinModal from './JoinMerlinModal';
import StreamlinedWizard from '../wizard/StreamlinedWizard';
import CalculationModal from './CalculationModal';
import SaveProjectModal from './SaveProjectModal';
import LoadProjectModal from './LoadProjectModal';
import AdvancedAnalytics from '../AdvancedAnalytics';
import ProfessionalFinancialModeling from '../ProfessionalFinancialModeling';
import EnhancedBESSAnalytics from '../EnhancedBESSAnalytics';
import FinancingCalculator from '../FinancingCalculator';
import UseCaseTemplates from '../UseCaseTemplates';
import PricingDataCapture from '../PricingDataCapture';
import MarketIntelligenceDashboard from '../MarketIntelligenceDashboard';
import VendorSponsorship from '../VendorSponsorship';
import PrivacyPolicy from '../PrivacyPolicy';
import TermsOfService from '../TermsOfService';
import SecurityPrivacySettings from '../SecurityPrivacySettings';
import SystemHealth from '../SystemHealth';
import StatusPage from '../StatusPage';
import UtilityRatesManager from '../UtilityRatesManager';
import QuoteTemplates from '../QuoteTemplates';
import PricingPresets from '../PricingPresets';
import QuoteReviewWorkflow from '../QuoteReviewWorkflow';
import CostSavingsModal from './CostSavingsModal';
import RevenueGenerationModal from './RevenueGenerationModal';
import SustainabilityModal from './SustainabilityModal';
import PowerAdjustmentModal from './PowerAdjustmentModal';
import AIChatModal from './AIChatModal';
import { generateCalculationBreakdown } from '../../utils/calculationFormulas';
import type { ProfileData } from './AccountSetup';

interface ModalManagerProps {
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
  showProfessionalAnalytics: boolean;
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
  setShowProfessionalAnalytics: (show: boolean) => void;
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
  
  // Advanced mode props
  startWizardInAdvancedMode?: boolean;
  setStartWizardInAdvancedMode?: (value: boolean) => void;
  setShowAdvancedQuoteBuilderModal?: (show: boolean) => void;
  setAdvancedQuoteBuilderInitialView?: (view: 'landing' | 'custom-config') => void;
  skipWizardIntro?: boolean;
  setSkipWizardIntro?: (value: boolean) => void;
}

export default function ModalManager(props: ModalManagerProps) {
  if (import.meta.env.DEV) { console.log('🔧 ModalManager received showBESSAnalytics:', props.showBESSAnalytics); }
  if (import.meta.env.DEV) { console.log('🔧 ModalManager received ALL PROPS:', props); }
  
  const {
    // Modal states
    showUserProfile, showPortfolio, showAuthModal, showVendorManager, showPricingPlans,
    showWelcomeModal, showAccountSetup, showEnhancedProfile, showJoinModal, showSmartWizard,
    showCalculationModal, showSaveProjectModal, showLoadProjectModal, showAnalytics, showProfessionalAnalytics, showBESSAnalytics, showFinancing,
    showTemplates, showChatModal, showPricingDataCapture, showMarketIntelligence, showVendorSponsorship,
    showPrivacyPolicy, showTermsOfService, showSecuritySettings, showSystemHealth, showStatusPage,
    showUtilityRates, showQuoteTemplates, showPricingPresets, showReviewWorkflow,
    showCostSavingsModal, showRevenueModal, showSustainabilityModal, showPowerAdjustmentModal, selectedUseCaseForAdjustment,
    
    // Advanced mode
    startWizardInAdvancedMode, setStartWizardInAdvancedMode, setShowAdvancedQuoteBuilderModal,
    setAdvancedQuoteBuilderInitialView, skipWizardIntro, setSkipWizardIntro,

    // Modal setters
    setShowUserProfile, setShowPortfolio, setShowAuthModal, setShowVendorManager, setShowPricingPlans,
    setShowWelcomeModal, setShowAccountSetup, setShowEnhancedProfile, setShowJoinModal, setShowSmartWizard,
    setShowCalculationModal, setShowSaveProjectModal, setShowLoadProjectModal, setShowAnalytics, setShowProfessionalAnalytics, setShowBESSAnalytics, setShowFinancing,
    setShowTemplates, setShowChatModal, setShowPricingDataCapture, setShowMarketIntelligence, setShowVendorSponsorship,
    setShowPrivacyPolicy, setShowTermsOfService, setShowSecuritySettings, setShowSystemHealth, setShowStatusPage,
    setShowUtilityRates, setShowQuoteTemplates, setShowPricingPresets, setShowReviewWorkflow,
    setShowCostSavingsModal, setShowRevenueModal, setShowSustainabilityModal, setShowPowerAdjustmentModal, setSelectedUseCaseForAdjustment,

    // Data and handlers
    isLoggedIn, setIsLoggedIn, handleLoginSuccess, handleGoHome, handleProfileSetup, handleStartWizard,
    handleProfileComplete, handleContinueToEnhancedProfile, handleEnhancedProfileClose,
    loadProjectFromStorage, handleUploadProject, handleCreateWithWizard, handleUploadFromComputer,
    handleUploadFromPortfolio, handleApplyTemplate, handleApplyUseCaseTemplate, isFirstTimeProfile,

    // Project data
    quoteName, powerMW, standbyHours, solarMWp, windMW, generatorMW, batteryKwh, pcsKw,
    bosPercent, epcPercent, genKw, solarKwp, windKw, location, grandCapEx, annualSavings,
    valueKwh, warranty, currentQuoteStatus,

    // Setters
    setPowerMW, setStandbyHours, setUseCase, setWarranty, setSolarMWp, setWindMW, setGeneratorMW,
    setValueKwh, setCurrentQuoteStatus
  } = props;

  return (
    <>
      {/* Modals */}
      {showUserProfile && (
        <EditableUserProfile 
          onClose={() => setShowUserProfile(false)} 
          onLoginSuccess={handleLoginSuccess} 
          onLogout={() => setIsLoggedIn(false)} 
          isLoggedIn={isLoggedIn}
          onShowQuoteTemplates={() => setShowQuoteTemplates(true)}
          onShowPricingPresets={() => setShowPricingPresets(true)}
          onShowVendorLeads={() => setShowVendorSponsorship(true)}
        />
      )}
      {showPortfolio && <Portfolio onClose={() => setShowPortfolio(false)} onLoadQuote={loadProjectFromStorage} />}
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} />}
      {showVendorManager && <VendorManager isOpen={showVendorManager} onClose={() => setShowVendorManager(false)} />}
      {showPricingPlans && (
        <PricingPlans 
          onClose={() => setShowPricingPlans(false)} 
          onSignUp={() => {
            setShowPricingPlans(false);
            setShowAuthModal(true);
          }}
          currentTier="free" 
        />
      )}
      
      {/* Welcome and Account Setup Modals */}
      {showWelcomeModal && (
        <WelcomeModal
          onClose={handleGoHome}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          onSetupProfile={handleProfileSetup}
          onStartWizard={handleStartWizard}
          onGoHome={handleGoHome}
        />
      )}
      {showAccountSetup && (
        <AccountSetup
          onClose={() => setShowAccountSetup(false)}
          onComplete={handleProfileComplete}
          onContinueToProfile={handleContinueToEnhancedProfile}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          accountType={authService.getCurrentUser()?.accountType || 'individual'}
          companyName={authService.getCurrentUser()?.company}
        />
      )}
      {showEnhancedProfile && (
        <EnhancedProfile
          onClose={handleEnhancedProfileClose}
          isFirstTime={isFirstTimeProfile}
        />
      )}
  
      {/* Join Merlin Modal - Shows benefits first */}
      <JoinMerlinModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onViewPricing={() => {
          setShowJoinModal(false);
          setShowPricingPlans(true);
        }}
      />
      
      {/* Streamlined Wizard - New UX */}
      <StreamlinedWizard
        show={showSmartWizard}
        onClose={() => {
          setShowSmartWizard(false);
          // Reset advanced mode flag when closing
          if (setStartWizardInAdvancedMode) {
            setStartWizardInAdvancedMode(false);
          }
          // Reset skip intro flag when closing
          if (setSkipWizardIntro) {
            setSkipWizardIntro(false);
          }
        }}
        onOpenAdvanced={() => {
          // Close wizard and open Advanced Quote Builder in custom-config mode
          if (import.meta.env.DEV) { console.log('🔥 ModalManager: onOpenAdvanced called'); }
          setShowSmartWizard(false);
          if (setShowAdvancedQuoteBuilderModal) {
            if (import.meta.env.DEV) { console.log('🔥 Setting showAdvancedQuoteBuilderModal to true'); }
            if (setAdvancedQuoteBuilderInitialView) {
              setAdvancedQuoteBuilderInitialView('custom-config');
            }
            setShowAdvancedQuoteBuilderModal(true);
          }
        }}
        onFinish={(wizardData) => {
          // Map wizard data to the main form
          setPowerMW(wizardData.storageSizeMW || 1);
          setStandbyHours(wizardData.durationHours || 2);
          
          // Map application to use case
          const applicationMap: { [key: string]: string } = {
            'ev-charging': 'EV Charging Stations',
            'data-center': 'Data Centers',
            'manufacturing': 'Manufacturing',
            'commercial': 'Commercial Buildings',
            'utility': 'Utility Scale',
            'resiliency': 'Critical Infrastructure',
          };
          setUseCase(applicationMap[wizardData.primaryApplication] || 'EV Charging Stations');
          
          // Set warranty
          setWarranty(`${wizardData.warranty} years`);
          
          // Set renewable energy and generator values from wizard
          setSolarMWp(wizardData.solarMW || 0);
          setWindMW(wizardData.windMW || 0);
          setGeneratorMW(wizardData.generatorMW || 0);
          
          // Close wizard and show success message
          setShowSmartWizard(false);
          
          // Scroll to top to show the updated configuration
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          // Show success notification
          setTimeout(() => {
            alert(`🎉 Configuration Applied Successfully!\n\n` +
                  `BESS Power: ${wizardData.power} MW\n` +
                  `Duration: ${wizardData.duration} hours\n` +
                  `Solar: ${wizardData.solarMW || 0} MW\n` +
                  `Wind: ${wizardData.windMW || 0} MW\n` +
                  `Generator: ${wizardData.generatorMW || 0} MW\n` +
                  `Grid: ${wizardData.gridConnection === 'behind' ? 'Behind the meter' : 'Front of meter'}\n` +
                  `Application: ${applicationMap[wizardData.primaryApplication]}\n\n` +
                  `Your quote has been updated. Review the details below and click "Generate Quote" when ready.`);
          }, 500);
        }}
      />

      {/* Calculation Modal */}
      {showCalculationModal && (
        <CalculationModal
          isOpen={showCalculationModal}
          onClose={() => setShowCalculationModal(false)}
          calculations={generateCalculationBreakdown(
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
            location
          )}
          projectName={quoteName}
        />
      )}

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={showSaveProjectModal}
        onClose={() => setShowSaveProjectModal(false)}
        onUploadProject={handleUploadProject}
        onCreateWithWizard={handleCreateWithWizard}
      />

      {/* Load Project Modal */}
      <LoadProjectModal
        isOpen={showLoadProjectModal}
        onClose={() => setShowLoadProjectModal(false)}
        onUploadFromComputer={handleUploadFromComputer}
        onUploadFromPortfolio={handleUploadFromPortfolio}
      />

      {/* Advanced Analytics Modal */}
      {showAnalytics && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ 
            zIndex: 9999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] overflow-auto">
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
        </div>,
        document.body
      )}

      {/* Professional Financial Modeling Modal */}
      {showProfessionalAnalytics && createPortal(
        <ProfessionalFinancialModeling
          isOpen={showProfessionalAnalytics}
          onClose={() => setShowProfessionalAnalytics(false)}
          projectData={{
            quoteName,
            powerMW,
            durationHours: standbyHours,
            totalCapEx: grandCapEx,
            annualSavings,
            electricityRate: valueKwh || 0.12,
            location: location || 'United States',
            batteryLifeYears: 25,
            discountRate: 0.08
          }}
          userTier="free"
          onUpgradeClick={() => {
            setShowProfessionalAnalytics(false);
            setShowPricingPlans(true);
          }}
        />,
        document.body
      )}

      {/* BESS Analytics Modal - Clean presentation with transparent backdrop */}
      {showBESSAnalytics && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            zIndex: 9999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'transparent'
          }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setShowBESSAnalytics(false);
            }
          }}
        >
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] overflow-auto">
            <EnhancedBESSAnalytics
              isOpen={showBESSAnalytics}
              onClose={() => setShowBESSAnalytics(false)}
              projectData={{
                quoteName,
                storageSizeMW: powerMW,
                durationHours: standbyHours,
                useCase: 'commercial',
                location: location || 'United States',
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Financing Calculator Modal */}
      {showFinancing && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
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
        </div>,
        document.body
      )}

      {/* Use Case Templates Modal */}
      {showTemplates && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <UseCaseTemplates
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Pricing Data Capture Modal */}
      {showPricingDataCapture && (
        <PricingDataCapture
          onClose={() => setShowPricingDataCapture(false)}
          userEmail={authService.getCurrentUser()?.email}
        />
      )}

      {/* Market Intelligence Dashboard */}
      {showMarketIntelligence && (
        <MarketIntelligenceDashboard
          onClose={() => setShowMarketIntelligence(false)}
          userTier={authService.getCurrentUser()?.tier as 'free' | 'professional' | 'enterprise_pro' | 'business'}
        />
      )}

      {/* Vendor Sponsorship Marketplace */}
      {showVendorSponsorship && (
        <VendorSponsorship
          onClose={() => setShowVendorSponsorship(false)}
        />
      )}

      {/* Privacy Policy */}
      {showPrivacyPolicy && (
        <PrivacyPolicy
          onClose={() => setShowPrivacyPolicy(false)}
        />
      )}

      {/* Terms of Service */}
      {showTermsOfService && (
        <TermsOfService
          onClose={() => setShowTermsOfService(false)}
        />
      )}

      {/* Security & Privacy Settings */}
      {showSecuritySettings && (
        <SecurityPrivacySettings
          onClose={() => setShowSecuritySettings(false)}
        />
      )}

      {/* System Health Dashboard */}
      {showSystemHealth && (
        <SystemHealth
          onClose={() => setShowSystemHealth(false)}
        />
      )}

      {/* Public Status Page */}
      {showStatusPage && (
        <StatusPage
          onClose={() => setShowStatusPage(false)}
        />
      )}

      {/* Utility Rates Manager */}
      {showUtilityRates && (
        <UtilityRatesManager
          onClose={() => setShowUtilityRates(false)}
          onSelectRate={(rate, rateType) => {
            // Apply selected utility rate to the quote
            const selectedRate = rateType === 'residential' ? rate.residentialRate :
                                rateType === 'commercial' ? rate.commercialRate :
                                rate.industrialRate;
            setValueKwh(selectedRate);
            alert(`Utility rate updated to $${selectedRate.toFixed(3)}/kWh from ${rate.utility}`);
          }}
          currentRate={valueKwh}
        />
      )}

      {/* Quote Templates */}
      {showQuoteTemplates && (
        <QuoteTemplates
          onClose={() => setShowQuoteTemplates(false)}
          onSelectTemplate={(template) => {
            alert(`Template "${template.name}" selected! Quote generation will use this template.`);
            // Template will be used when generating the quote document
          }}
          userId={authService.getCurrentUser()?.email || 'guest'}
        />
      )}

      {/* Pricing Presets */}
      {showPricingPresets && (
        <PricingPresets
          onClose={() => setShowPricingPresets(false)}
          onSelectPreset={(preset) => {
            // Apply preset pricing to quote builder
            alert(`Pricing preset "${preset.name}" applied!\n\nBattery: $${preset.battery.pricePerKWh}/kWh\nInverter: $${preset.inverter.pricePerKW}/kW\n${preset.epc.enabled ? 'EPC fees included' : ''}`);
            // Pricing will be applied to calculations
          }}
          userId={authService.getCurrentUser()?.email || 'guest'}
        />
      )}

      {/* Quote Review Workflow */}
      {showReviewWorkflow && (
        <QuoteReviewWorkflow
          onClose={() => setShowReviewWorkflow(false)}
          quoteId={`quote-${quoteName.replace(/\s+/g, '-').toLowerCase()}`}
          quoteName={quoteName}
          userId={authService.getCurrentUser()?.email || 'guest'}
          userName={authService.getCurrentUser()?.email || 'Guest User'}
          onStatusChange={(status) => {
            setCurrentQuoteStatus(status);
          }}
        />
      )}

      {/* Cost Savings Benefits Modal */}
      <CostSavingsModal
        isOpen={showCostSavingsModal}
        onClose={() => setShowCostSavingsModal(false)}
        onShowSmartWizard={() => setShowSmartWizard(true)}
      />

      {/* Revenue Generation Benefits Modal */}
      <RevenueGenerationModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        onShowSmartWizard={() => setShowSmartWizard(true)}
      />

      {/* Sustainability Benefits Modal */}
      <SustainabilityModal
        isOpen={showSustainabilityModal}
        onClose={() => setShowSustainabilityModal(false)}
        onShowSmartWizard={() => setShowSmartWizard(true)}
      />

      {/* Power Adjustment Modal */}
      <PowerAdjustmentModal
        isOpen={showPowerAdjustmentModal}
        onClose={() => setShowPowerAdjustmentModal(false)}
        useCase={selectedUseCaseForAdjustment}
        onConfirm={(adjustedUseCase) => {
          // Handle the adjusted use case - trigger template loading with the new handler
          if (handleApplyUseCaseTemplate) {
            handleApplyUseCaseTemplate(adjustedUseCase);
          }
          setShowPowerAdjustmentModal(false);
        }}
      />

      {/* AI Chat Assistant Modal */}
      <AIChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </>
  );
}