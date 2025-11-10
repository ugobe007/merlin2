import React, { Suspense } from 'react';
import merlinImage from "../../assets/images/new_Merlin.png";
import UseCaseROI from '../UseCaseROI';
import type { UseCaseData } from '../UseCaseROI';
import { calculateBESSPricing } from '../../utils/bessPricing';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';

// Lazy load modal component
const QuotePreviewModal = React.lazy(() => import('../modals/QuotePreviewModal'));

// Define the list of all modals used in BessQuoteBuilder
type ModalName = 
  | 'showJoinModal'
  | 'showAuthModal'
  | 'showUserProfile'
  | 'showSmartWizard'
  | 'showVendorManager'
  | 'showPricingPlans'
  | 'showWelcomeModal'
  | 'showAccountSetup'
  | 'showEnhancedProfile'
  | 'showAnalytics'
  | 'showEnhancedAnalytics'
  | 'showEnhancedBESSAnalytics'
  | 'showFinancing'
  | 'showTemplates'
  | 'showAbout'
  | 'showVendorPortal'
  | 'showChatModal'
  | 'showPortfolio'
  | 'showCalculationModal'
  | 'showSaveProjectModal'
  | 'showLoadProjectModal'
  | 'showPricingDataCapture'
  | 'showMarketIntelligence'
  | 'showVendorSponsorship'
  | 'showPrivacyPolicy'
  | 'showCostSavingsModal'
  | 'showRevenueModal'
  | 'showSustainabilityModal'
  | 'showQuotePreview';

interface HeroSectionProps {
  // Modal management
  openModal: (modalName: ModalName) => void;
  
  // State management
  setShowAdvancedQuoteBuilderPersisted: (value: boolean) => void;
  setCurrentQuote: (quote: any) => void;
  setShowQuotePreview: (show: boolean) => void;
  
  // Configuration data
  selectedCountry: string;
  bosPercent: number;
  epcPercent: number;
  pcsKw: number;
  
  // Current quote data
  currentQuote: any;
  isModalOpen: (modalName: ModalName) => boolean;
  closeModal: (modalName: ModalName) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  openModal,
  setShowAdvancedQuoteBuilderPersisted,
  setCurrentQuote,
  setShowQuotePreview,
  selectedCountry,
  bosPercent,
  epcPercent,
  pcsKw,
  currentQuote,
  isModalOpen,
  closeModal
}) => {

  return (
    <>
      {/* NEW CUSTOMER-FOCUSED HERO SECTION */}
      <section className="my-6 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400 bg-gradient-to-br from-white via-purple-50 to-blue-100">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-600/20 animate-pulse"></div>
          
          {/* Top Right Buttons - Customer Focused */}
          <div className="absolute top-6 right-6 z-20 flex gap-3">
            <button 
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-white/20 transition-colors border border-white/30"
              onClick={() => openModal('showAbout')}
            >
              About Merlin
            </button>
            <button 
              className="bg-gradient-to-b from-blue-100 to-blue-200 text-blue-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:from-blue-200 hover:to-blue-300 transition-colors border-2 border-blue-300"
              onClick={() => openModal('showJoinModal')}
            >
              ✨ Join Now
            </button>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="lg:col-span-8 text-left">
              <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
                Cut Energy Costs. Earn Revenue. Go Green.
              </h1>
              <p className="text-2xl mb-8 font-light">
                Get a custom energy storage quote in 3 minutes
              </p>
              
              {/* Smart Wizard Benefits */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/20">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  Smart Wizard Benefits:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-bold text-lg">See Your Savings</p>
                      <p className="text-sm text-white/80">Instant ROI calculation with payback timeline</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-bold text-lg">Personalized Configuration</p>
                      <p className="text-sm text-white/80">Sized perfectly for your energy needs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-bold text-lg">Compare Options</p>
                      <p className="text-sm text-white/80">Installation, shipping & financing side-by-side</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-bold text-lg">Download Your Quote</p>
                      <p className="text-sm text-white/80">PDF & Excel formats ready to share</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Primary CTAs - Smart Wizard & Advanced Tools */}
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                {/* Smart Wizard Button */}
                <div className="relative inline-block">
                  {/* Glow effect behind button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-70 animate-pulse"></div>
                  
                  <button 
                    onClick={() => openModal('showSmartWizard')}
                    className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white px-12 py-5 rounded-3xl font-extrabold text-2xl shadow-2xl border-4 border-cyan-300 hover:scale-105 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl animate-bounce">🎯</span>
                      <div className="text-left">
                        <div className="text-2xl">Smart Wizard</div>
                        <div className="text-xs font-normal text-cyan-100 mt-1">7 simple steps • 3 minutes • No signup</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Advanced Quote Builder Button */}
                <div className="relative inline-block">
                  {/* Glow effect behind button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                  
                  <button 
                    onClick={() => {
                      setShowAdvancedQuoteBuilderPersisted(true);
                    }}
                    className="relative bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl border-2 border-amber-300 hover:scale-105 transition-transform z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      <div className="text-left">
                        <div className="text-lg">Advanced Tools</div>
                        <div className="text-xs font-normal text-amber-100 mt-1">Power users • Full control</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Side - Merlin Mascot */}
            <div className="lg:col-span-4 flex justify-center items-center">
              <div className="relative">
                {/* Glow effect behind Merlin */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 via-purple-400/50 to-blue-400/50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border-4 border-white/30 shadow-2xl">
                  <img 
                    src={merlinImage} 
                    alt="Merlin - Your Energy Advisor" 
                    className="w-64 h-64 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] filter brightness-110"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-lg font-light italic opacity-90 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                      "Let me guide you to the perfect energy solution"
                    </p>
                    <p className="text-sm font-bold mt-2 text-cyan-200">
                      - Merlin, Your Energy Advisor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          {/* Cost Savings Card */}
          <div 
            onClick={() => openModal('showCostSavingsModal')}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-4 text-center">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Reduce Energy Costs</h3>
            <p className="text-gray-600 mb-4 text-center">
              Cut your electricity bills by 30-50% with smart energy storage and peak shaving
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Store cheap off-peak energy</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Avoid expensive peak rates</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Reduce demand charges</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Lower utility bills permanently</span>
              </li>
            </ul>
            <div className="mt-6 text-center">
              <span className="text-3xl font-bold text-green-600">$50K+</span>
              <p className="text-sm text-gray-500">Average annual savings</p>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-green-700 transition-colors">
                <span className="text-lg">🎯</span>
                Explore Cost Savings
              </div>
            </div>
          </div>

          {/* Revenue Generation Card */}
          <div 
            onClick={() => openModal('showRevenueModal')}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-4 text-center">🎯</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Generate Revenue</h3>
            <p className="text-gray-600 mb-4 text-center">
              Turn your battery into a profit center with grid services and energy arbitrage
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Frequency regulation services</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Demand response programs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Energy arbitrage opportunities</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span>Capacity market payments</span>
              </li>
            </ul>
            <div className="mt-6 text-center">
              <span className="text-3xl font-bold text-blue-600">3-5 year</span>
              <p className="text-sm text-gray-500">Typical ROI timeline</p>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors">
                <span className="text-lg">🎯</span>
                Explore Revenue
              </div>
            </div>
          </div>

          {/* Sustainability Card */}
          <div 
            onClick={() => openModal('showSustainabilityModal')}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-400 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <div className="text-5xl mb-4 text-center">🌱</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Achieve Sustainability</h3>
            <p className="text-gray-600 mb-4 text-center">
              Meet your environmental goals and qualify for valuable tax incentives
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Reduce carbon footprint</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>Maximize solar/wind usage</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>30% Federal tax credit (ITC)</span>
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">✓</span>
                <span>State & local incentives</span>
              </li>
            </ul>
            <div className="mt-6 text-center">
              <span className="text-3xl font-bold text-emerald-600">Net Zero</span>
              <p className="text-sm text-gray-500">Energy independence ready</p>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-emerald-700 transition-colors">
                <span className="text-lg">🌱</span>
                Explore Sustainability
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE CONFIGURATIONS SECTION - Use Case ROI Showcase */}
      <section className="my-8">
        {/* Section Header - Tightened */}
        <div className="text-center mb-6">
          <div className="inline-block mb-2">
            <span className="text-4xl">🎯</span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 mb-2">
            Real-World Applications
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            See how businesses are using energy storage to 
            <span className="text-green-600 font-bold"> reduce costs</span>, 
            <span className="text-blue-600 font-bold"> generate revenue</span>, and 
            <span className="text-purple-600 font-bold"> go green</span>
          </p>
        </div>

        {/* Use Case Showcase - Enhanced Visual Design */}
        <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-2xl border-2 border-blue-200 p-10">
          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
        <UseCaseROI 
          autoRotate={true}
          rotationInterval={10000}
          onLoadTemplate={(useCase: UseCaseData) => {
            console.log('🎯 HeroSection onLoadTemplate called with:', useCase.industry);
            // Store use case data in localStorage for wizard to pick up
            const wizardData = {
              selectedTemplate: useCase.industry.toLowerCase().replace(' ', '-'),
              storageSizeMW: useCase.systemSizeMW,
              durationHours: useCase.duration,
              location: selectedCountry,
              jumpToStep: 5, // Go directly to quote summary
              useCase: useCase
            };
            
            console.log('🚀 Storing wizard quickstart data:', wizardData);
            localStorage.setItem('merlin_wizard_quickstart', JSON.stringify(wizardData));
            console.log('🚀 Starting Smart Wizard for use case:', useCase.industry);
            openModal('showSmartWizard');
          }}
        />
          </div>
        </div>
        
        {/* Quote Preview Modal - Triggered by Use Case ROI */}
        {currentQuote && (
          <div className="fixed inset-0 z-50">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading quote preview...</p>
                </div>
              </div>
            }>
              <QuotePreviewModal 
                isOpen={isModalOpen('showQuotePreview')}
                onClose={() => closeModal('showQuotePreview')}
                quoteData={currentQuote}
              />
            </Suspense>
          </div>
        )}
      </section>
    </>
  );
};

export default HeroSection;