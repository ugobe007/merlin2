import React, { Suspense } from 'react';
import EditableUserProfile from '../EditableUserProfile';
import Portfolio from '../Portfolio';
import AuthModal from '../AuthModal';

// Lazy load modal components to improve initial bundle size
const JoinMerlinModal = React.lazy(() => import('./JoinMerlinModal'));
const LayoutPreferenceModal = React.lazy(() => import('./LayoutPreferenceModal'));
const CalculationModal = React.lazy(() => import('./CalculationModal'));
const VendorManager = React.lazy(() => import('../VendorManager'));
const PricingPlans = React.lazy(() => import('../PricingPlans'));
const WelcomeModal = React.lazy(() => import('./WelcomeModal'));
const AccountSetup = React.lazy(() => import('./AccountSetup'));
const EnhancedProfile = React.lazy(() => import('../EnhancedProfile'));
const AdvancedAnalytics = React.lazy(() => import('../AdvancedAnalytics'));
const EnhancedBESSAnalytics = React.lazy(() => import('../EnhancedBESSAnalytics'));
const FinancingCalculator = React.lazy(() => import('../FinancingCalculator'));
const UseCaseTemplates = React.lazy(() => import('../UseCaseTemplates'));
const PricingDataCapture = React.lazy(() => import('../PricingDataCapture'));
const MarketIntelligenceDashboard = React.lazy(() => import('../MarketIntelligenceDashboard'));
const VendorSponsorship = React.lazy(() => import('../VendorSponsorship'));
const PrivacyPolicy = React.lazy(() => import('../PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('../TermsOfService'));
const SecurityPrivacySettings = React.lazy(() => import('../SecurityPrivacySettings'));
const SystemHealth = React.lazy(() => import('../SystemHealth'));
const StatusPage = React.lazy(() => import('../StatusPage'));
const UtilityRatesManager = React.lazy(() => import('../UtilityRatesManager'));
const QuoteTemplates = React.lazy(() => import('../QuoteTemplates'));
const PricingPresets = React.lazy(() => import('../PricingPresets'));
const QuoteReviewWorkflow = React.lazy(() => import('../QuoteReviewWorkflow'));
const UseCaseROI = React.lazy(() => import('../UseCaseROI'));
// V7 Wizard (Feb 2026 - V7 is now default)
const WizardV7Page = React.lazy(() => import('../../pages/WizardV7Page'));
const SaveProjectModal = React.lazy(() => import('./SaveProjectModal'));
const LoadProjectModal = React.lazy(() => import('./LoadProjectModal'));
const QuotePreviewModal = React.lazy(() => import('./QuotePreviewModal'));
const AboutMerlin = React.lazy(() => import('../AboutMerlin'));
const VendorPortal = React.lazy(() => import('../VendorPortal'));

// Loading component for lazy-loaded modals
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="text-gray-700">Loading...</span>
    </div>
  </div>
);

interface ModalRendererProps {
  // Modal state management
  isModalOpen: (modalName: string) => boolean;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  
  // Authentication handlers
  handleLoginSuccess: () => void;
  handleGoHome: () => void;
  handleProfileSetup: () => void;
  handleStartWizard: () => void;
  handleProfileComplete: (profileData?: any) => void;
  handleContinueToEnhancedProfile: () => void;
  handleEnhancedProfileClose: () => void;
  handleCreateWithWizard: () => void;
  handleUploadProject: () => void;
  handleUploadFromComputer: () => void;
  handleUploadFromPortfolio: () => void;
  handleUtilityRateUpdate: (rates: any) => void;
  loadProjectFromStorage: (projectId: string) => void;
  handleApplyTemplate: (template: any) => void;
  
  // User state
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
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
  grandCapEx: number;
  annualSavings: number;
  useCase: string;
  selectedCountry: string;
  applicationType: string;
  energyCapacity: number;
  dailyEnergyTariff: number;
  monthlyPeakDemandTariff: number;
  currency: string;
  location: string;
  valueKwh: number;
  warranty: number;
  actualDuration: number;
  
  // Current state values
  currentQuoteStatus: string;
  setCurrentQuoteStatus: (status: any) => void;
  setPowerMW: (value: number) => void;
  setStandbyHours: (value: number) => void;
  setUseCase: (value: string) => void;
  setWarranty: (value: number) => void;
  setSolarMWp: (value: number) => void;
  setWindMW: (value: number) => void;
  setGeneratorMW: (value: number) => void;
  setValueKwh: (value: number) => void;
  
  // Auth service reference
  authService: any;
}

const ModalRenderer: React.FC<ModalRendererProps> = ({
  isModalOpen,
  openModal,
  closeModal,
  handleLoginSuccess,
  handleGoHome,
  handleProfileSetup,
  handleStartWizard,
  handleProfileComplete,
  handleContinueToEnhancedProfile,
  handleEnhancedProfileClose,
  handleCreateWithWizard,
  handleUploadProject,
  handleUploadFromComputer,
  handleUploadFromPortfolio,
  handleUtilityRateUpdate,
  loadProjectFromStorage,
  handleApplyTemplate,
  isLoggedIn,
  setIsLoggedIn,
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
  grandCapEx,
  annualSavings,
  useCase,
  selectedCountry,
  applicationType,
  energyCapacity,
  dailyEnergyTariff,
  monthlyPeakDemandTariff,
  currency,
  location,
  valueKwh,
  warranty,
  actualDuration,
  currentQuoteStatus,
  setCurrentQuoteStatus,
  setPowerMW,
  setStandbyHours,
  setUseCase,
  setWarranty,
  setSolarMWp,
  setWindMW,
  setGeneratorMW,
  setValueKwh,
  authService,
}) => {
  return (
    <Suspense fallback={<ModalLoader />}>
      {/* Basic Modals */}
      {isModalOpen('showUserProfile') && (
        <EditableUserProfile 
          onClose={() => closeModal('showUserProfile')} 
          onLoginSuccess={handleLoginSuccess} 
          onLogout={() => setIsLoggedIn(false)} 
          isLoggedIn={isLoggedIn}
          onShowQuoteTemplates={() => openModal('showQuoteTemplates')}
          onShowPricingPresets={() => openModal('showPricingPresets')}
          onShowVendorLeads={() => openModal('showVendorSponsorship')}
        />
      )}

      {isModalOpen('showPortfolio') && (
        <Portfolio 
          onClose={() => closeModal('showPortfolio')} 
          onLoadQuote={(quote: any) => loadProjectFromStorage(quote)} 
        />
      )}

      {isModalOpen('showAuthModal') && (
        <AuthModal 
          isOpen={isModalOpen('showAuthModal')} 
          onClose={() => closeModal('showAuthModal')} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}

      {isModalOpen('showVendorManager') && (
        <VendorManager 
          isOpen={isModalOpen('showVendorManager')} 
          onClose={() => closeModal('showVendorManager')} 
        />
      )}

      {isModalOpen('showPricingPlans') && (
        <PricingPlans 
          onClose={() => closeModal('showPricingPlans')} 
          onSignUp={() => {
            closeModal('showPricingPlans');
            openModal('showAuthModal');
          }}
          currentTier="free" 
        />
      )}
      
      {/* Welcome and Account Setup Modals */}
      {isModalOpen('showWelcomeModal') && (
        <WelcomeModal
          onClose={handleGoHome}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          onSetupProfile={handleProfileSetup}
          onStartWizard={handleStartWizard}
          onGoHome={handleGoHome}
        />
      )}

      {isModalOpen('showAccountSetup') && (
        <AccountSetup
          onClose={() => closeModal('showAccountSetup')}
          onComplete={handleProfileComplete}
          onContinueToProfile={handleContinueToEnhancedProfile}
          userName={authService.getCurrentUser()?.firstName || 'User'}
          accountType={authService.getCurrentUser()?.accountType || 'individual'}
        />
      )}

      {isModalOpen('showEnhancedProfile') && (
        <EnhancedProfile
          onClose={() => closeModal('showEnhancedProfile')}
          isFirstTime={isFirstTimeProfile}
        />
      )}

      {/* Smart Wizard - V7 (Feb 2026 - V7 is now default) */}
      {isModalOpen('showSmartWizard') && (
        <WizardV7Page />
      )}

      {/* Project Management Modals */}
      {isModalOpen('showSaveProjectModal') && (
        <SaveProjectModal
          isOpen={isModalOpen('showSaveProjectModal')}
          onClose={() => closeModal('showSaveProjectModal')}
          onUploadProject={handleUploadProject}
          onCreateWithWizard={handleCreateWithWizard}
        />
      )}

      {isModalOpen('showLoadProjectModal') && (
        <LoadProjectModal
          isOpen={isModalOpen('showLoadProjectModal')}
          onClose={() => closeModal('showLoadProjectModal')}
          onUploadFromComputer={handleUploadFromComputer}
          onUploadFromPortfolio={handleUploadFromPortfolio}
        />
      )}

      {/* Analytics Modals */}
      {isModalOpen('showAnalytics') && (
        <AdvancedAnalytics
          isOpen={isModalOpen('showAnalytics')}
          onClose={() => closeModal('showAnalytics')}
          projectData={{
            quoteName,
            powerMW,
            durationHours: standbyHours,
            totalCapEx: grandCapEx,
            annualSavings,
          }}
        />
      )}

      {isModalOpen('showEnhancedAnalytics') && (() => {
        try {
          return (
            <AdvancedAnalytics 
              isOpen={isModalOpen('showEnhancedAnalytics')}
              onClose={() => closeModal('showEnhancedAnalytics')}
              projectData={{
                quoteName: `${applicationType || 'Enhanced'} Project`,
                powerMW: powerMW,
                durationHours: standbyHours,
                totalCapEx: grandCapEx,
                annualSavings: annualSavings,
                batteryLifeYears: 15,
                discountRate: 0.08,
              }}
            />
          );
        } catch (error) {
          return <div>Error loading Enhanced Analytics</div>;
        }
      })()}

      {isModalOpen('showEnhancedBESSAnalytics') && (() => {
        try {
          return (
            <EnhancedBESSAnalytics
              isOpen={isModalOpen('showEnhancedBESSAnalytics')}
              onClose={() => closeModal('showEnhancedBESSAnalytics')}
              projectData={{
                quoteName,
                storageSizeMW: powerMW,
                durationHours: actualDuration,
                useCase,
                location: selectedCountry,
              }}
            />
          );
        } catch (error) {
          return <div>Error loading BESS Analytics</div>;
        }
      })()}

      {/* Financing Calculator Modal */}
      {isModalOpen('showFinancing') && (
        <FinancingCalculator
          isOpen={isModalOpen('showFinancing')}
          onClose={() => closeModal('showFinancing')}
          projectData={{
            quoteName,
            totalCapEx: grandCapEx,
            annualSavings,
            powerMW,
            durationHours: standbyHours,
          }}
        />
      )}

      {/* Templates and Configuration */}
      {isModalOpen('showTemplates') && (
        <UseCaseTemplates
          isOpen={isModalOpen('showTemplates')}
          onClose={() => closeModal('showTemplates')}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {isModalOpen('showPricingDataCapture') && (
        <PricingDataCapture
          onClose={() => closeModal('showPricingDataCapture')}
          userEmail={authService.getCurrentUser()?.email || ''}
        />
      )}

      {/* Utility Management */}
      {isModalOpen('showUtilityRates') && (
        <UtilityRatesManager
          onClose={() => closeModal('showUtilityRates')}
          onSelectRate={(rate, rateType) => {
            handleUtilityRateUpdate({ rate, rateType });
          }}
          currentRate={dailyEnergyTariff}
        />
      )}

      {/* Vendor and Marketplace */}
            {isModalOpen('showVendorSponsorship') && (
        <VendorSponsorship
          onClose={() => closeModal('showVendorSponsorship')}
        />
      )}

      {/* Quote Management */}
            {isModalOpen('showQuoteTemplates') && (
        <QuoteTemplates
          onClose={() => closeModal('showQuoteTemplates')}
          onSelectTemplate={() => closeModal('showQuoteTemplates')}
          userId={authService.getCurrentUser()?.id}
        />
      )}

      {isModalOpen('showPricingPresets') && (
        <PricingPresets
          onClose={() => closeModal('showPricingPresets')}
          onSelectPreset={() => closeModal('showPricingPresets')}
          userId={authService.getCurrentUser()?.id}
        />
      )}

      {isModalOpen('showReviewWorkflow') && (
        <QuoteReviewWorkflow
          onClose={() => closeModal('showReviewWorkflow')}
          quoteId={`quote-${quoteName.replace(/\s+/g, '-').toLowerCase()}`}
          quoteName={quoteName}
          userId={authService.getCurrentUser()?.email || 'guest'}
          userName={authService.getCurrentUser()?.email || 'Guest User'}
          onStatusChange={(status) => {
            setCurrentQuoteStatus(status);
          }}
        />
      )}

      {/* Legal and Support */}
      {isModalOpen('showPrivacyPolicy') && (
        <PrivacyPolicy
          onClose={() => closeModal('showPrivacyPolicy')}
        />
      )}

      {isModalOpen('showTermsOfService') && (
        <TermsOfService
          onClose={() => closeModal('showTermsOfService')}
        />
      )}

      {/* System Modals */}
      {isModalOpen('showSecurityPrivacy') && (
        <SecurityPrivacySettings
          onClose={() => closeModal('showSecurityPrivacy')}
        />
      )}

      {isModalOpen('showSystemHealth') && (
        <SystemHealth
          onClose={() => closeModal('showSystemHealth')}
        />
      )}

      {isModalOpen('showStatusPage') && (
        <StatusPage
          onClose={() => closeModal('showStatusPage')}
        />
      )}

      {/* ROI and Cost Analysis */}
            {isModalOpen('showUseCaseROI') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto m-4 relative">
            <button
              onClick={() => closeModal('showUseCaseROI')}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <UseCaseROI
              onLoadTemplate={(template) => {
                handleApplyTemplate(template);
                closeModal('showUseCaseROI');
              }}
              autoRotate={true}
            />
          </div>
        </div>
      )}

      {/* Layout and Preferences */}
      {isModalOpen('showLayoutPreference') && (
        <LayoutPreferenceModal
          isOpen={isModalOpen('showLayoutPreference')}
          onClose={() => closeModal('showLayoutPreference')}
          onSelect={() => {
            closeModal('showLayoutPreference');
          }}
        />
      )}

      {/* Join and Marketing Modals */}
      {isModalOpen('showJoinModal') && (
        <JoinMerlinModal
          isOpen={isModalOpen('showJoinModal')}
          onClose={() => closeModal('showJoinModal')}
          onViewPricing={() => {
            closeModal('showJoinModal');
            openModal('showPricingPlans');
          }}
        />
      )}
    </Suspense>
  );
};

export default ModalRenderer;