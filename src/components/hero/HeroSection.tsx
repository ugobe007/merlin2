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
              
              {/* Power Profile & Smart Wizard Benefits */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/20">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">⚡</span>
                  Discover Your Power Profile™
                </h3>
                <div className="mb-4 pb-4 border-b border-white/20">
                  <p className="text-lg text-white/90 mb-2">
                    Our AI-powered system that grows with you
                  </p>
                  <div className="flex items-center gap-2 text-sm text-cyan-200">
                    <span>🎯</span>
                    <span>Level up from Apprentice to Grand Wizard as you unlock:</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="font-bold">Optimized Savings</p>
                      <p className="text-xs text-white/80">AI learns your needs for better results</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">🏗️</span>
                    <div>
                      <p className="font-bold">Resource Ecosystem</p>
                      <p className="text-xs text-white/80">EPCs, integrators, financing & more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="font-bold">Industry Intelligence</p>
                      <p className="text-xs text-white/80">Trends, microgrids, hybrid systems</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="font-bold">AI That Learns</p>
                      <p className="text-xs text-white/80">Your usage improves the platform</p>
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
                    data-testid="smart-wizard-launch-button"
                    onClick={() => openModal('showSmartWizard')}
                    className="relative bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white px-16 py-7 rounded-3xl font-extrabold text-3xl shadow-2xl border-4 border-purple-400 hover:scale-105 transition-transform hover:from-purple-800 hover:via-indigo-900 hover:to-purple-950"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-5xl animate-bounce">⚡</span>
                      <div className="text-left">
                        <div className="text-3xl">Smart Wizard</div>
                        <div className="text-sm font-normal text-purple-200 mt-1">7 simple steps • 3 minutes • No signup</div>
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
                      <span className="text-2xl">🔧</span>
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

        {/* Three Value Pillars - REDESIGNED WITH VISUAL ENERGY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
          {/* Cost Savings Card - GREEN ENERGY THEME */}
          <div 
            onClick={() => openModal('showCostSavingsModal')}
            className="group relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-3xl p-8 shadow-2xl border-2 border-green-300 hover:shadow-green-500/50 hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-emerald-400/0 to-green-500/10 group-hover:from-green-400/20 group-hover:via-emerald-400/10 group-hover:to-green-500/20 transition-all duration-500"></div>
            
            {/* Decorative corner glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-400/30 rounded-full blur-3xl group-hover:bg-green-400/50 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-6 text-center transform group-hover:scale-110 transition-transform duration-300">💰</div>
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-4 text-center group-hover:from-green-500 group-hover:to-emerald-500 transition-all">
                Reduce Energy Costs
              </h3>
              <p className="text-gray-700 mb-6 text-center font-medium leading-relaxed">
                Cut electricity bills by 30-50% with intelligent energy storage
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-green-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Store cheap off-peak energy</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-green-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Avoid expensive peak rates</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-green-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Reduce demand charges</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-green-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Lower bills permanently</span>
                </li>
              </ul>
              <div className="mt-8 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-green-200">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">$50K+</span>
                <p className="text-sm text-gray-600 font-semibold mt-1">Average annual savings</p>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg group-hover:from-green-500 group-hover:to-emerald-500 group-hover:shadow-xl transition-all">
                  <span className="text-xl">💰</span>
                  Explore Cost Savings
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Generation Card - BLUE INNOVATION THEME */}
          <div 
            onClick={() => openModal('showRevenueModal')}
            className="group relative bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 rounded-3xl p-8 shadow-2xl border-2 border-blue-300 hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-cyan-400/0 to-blue-500/10 group-hover:from-blue-400/20 group-hover:via-cyan-400/10 group-hover:to-blue-500/20 transition-all duration-500"></div>
            
            {/* Decorative corner glow */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl group-hover:bg-blue-400/50 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-6 text-center transform group-hover:scale-110 transition-transform duration-300">📈</div>
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-4 text-center group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">
                Generate Revenue
              </h3>
              <p className="text-gray-700 mb-6 text-center font-medium leading-relaxed">
                Transform batteries into profit centers with grid services
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-blue-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Frequency regulation services</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-blue-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Demand response programs</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-blue-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Energy arbitrage opportunities</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-blue-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Capacity market payments</span>
                </li>
                </ul>
              <div className="mt-8 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-200">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">3-5 years</span>
                <p className="text-sm text-gray-600 font-semibold mt-1">Typical ROI timeline</p>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg group-hover:from-blue-500 group-hover:to-cyan-500 group-hover:shadow-xl transition-all">
                  <span className="text-xl">📈</span>
                  Explore Revenue
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability Card - EMERALD ECO THEME */}
          <div 
            onClick={() => openModal('showSustainabilityModal')}
            className="group relative bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 rounded-3xl p-8 shadow-2xl border-2 border-emerald-300 hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-teal-400/0 to-emerald-500/10 group-hover:from-emerald-400/20 group-hover:via-teal-400/10 group-hover:to-emerald-500/20 transition-all duration-500"></div>
            
            {/* Decorative corner glow */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/30 rounded-full blur-3xl group-hover:bg-emerald-400/50 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-6 text-center transform group-hover:scale-110 transition-transform duration-300">🌱</div>
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-4 text-center group-hover:from-emerald-500 group-hover:to-teal-500 transition-all">
                Achieve Sustainability
              </h3>
              <p className="text-gray-700 mb-6 text-center font-medium leading-relaxed">
                Reach environmental goals while qualifying for tax incentives
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-emerald-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Reduce carbon footprint</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-emerald-500 text-xl font-bold">✓</span>
                  <span className="font-medium">Maximize solar/wind usage</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-emerald-500 text-xl font-bold">✓</span>
                  <span className="font-medium">30% Federal tax credit (ITC)</span>
                </li>
                <li className="flex items-start gap-3 group/item hover:translate-x-1 transition-transform">
                  <span className="text-emerald-500 text-xl font-bold">✓</span>
                  <span className="font-medium">State & local incentives</span>
                </li>
              </ul>
              <div className="mt-8 text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-emerald-200">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Net Zero</span>
                <p className="text-sm text-gray-600 font-semibold mt-1">Energy independence ready</p>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:shadow-xl transition-all">
                  <span className="text-xl">🌱</span>
                  Explore Sustainability
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REAL-WORLD APPLICATIONS SECTION - REDESIGNED WITH VISUAL ENERGY */}
      <section className="my-12">
        {/* Section Header - Enhanced with Motion */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 relative">
            <span className="text-5xl animate-pulse">💡</span>
            <div className="absolute -inset-2 bg-yellow-300/30 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 mb-4">
            Real-World Applications
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            See how businesses are using energy storage to{' '}
            <span className="relative inline-block">
              <span className="text-green-600 font-bold">reduce costs</span>
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full"></span>
            </span>
            ,{' '}
            <span className="relative inline-block">
              <span className="text-blue-600 font-bold">generate revenue</span>
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></span>
            </span>
            , and{' '}
            <span className="relative inline-block">
              <span className="text-purple-600 font-bold">go green</span>
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></span>
            </span>
          </p>
        </div>

        {/* Use Case Showcase - Enhanced with Depth & Motion */}
        <div className="relative group">
          {/* Main container with enhanced depth */}
          <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 rounded-3xl shadow-2xl border-2 border-blue-300 p-12 overflow-hidden transition-all duration-500 group-hover:shadow-blue-500/30">
            {/* Animated corner glows */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
            
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
          
          {/* Subtle 3D lift effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-200/50 rounded-3xl transform translate-y-1 -z-10 blur-sm"></div>
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