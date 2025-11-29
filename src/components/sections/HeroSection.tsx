import React, { useState } from 'react';
import UseCaseROI from '../UseCaseROI';
import type { UseCaseData } from '../UseCaseROI';
import QuoteBuilderLanding from '../wizard/QuoteBuilderLanding';
import RealWorldApplicationModal from '../modals/RealWorldApplicationModal';
import { calculateBESSPricing } from '../../utils/bessPricing';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';
import merlinImage from "../../assets/images/new_Merlin.png";

interface HeroSectionProps {
  setShowAbout: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
  setShowSmartWizard: (show: boolean) => void;
  setShowAdvancedQuoteBuilder: (show: boolean) => void;
  setShowCostSavingsModal: (show: boolean) => void;
  setShowRevenueModal: (show: boolean) => void;
  setShowSustainabilityModal: (show: boolean) => void;
  setCurrentQuote: (quote: any) => void;
  setShowQuotePreview: (show: boolean) => void;
  selectedCountry: string;
  bosPercent: number;
  epcPercent: number;
  pcsKw: number;
  // Power adjustment modal props
  setShowPowerAdjustmentModal?: (show: boolean) => void;
  setSelectedUseCaseForAdjustment?: (useCase: UseCaseData) => void;
}

export default function HeroSection({
  setShowAbout,
  setShowJoinModal,
  setShowSmartWizard,
  setShowAdvancedQuoteBuilder,
  setShowCostSavingsModal,
  setShowRevenueModal,
  setShowSustainabilityModal,
  setCurrentQuote,
  setShowQuotePreview,
  selectedCountry,
  bosPercent,
  epcPercent,
  pcsKw,
  setShowPowerAdjustmentModal,
  setSelectedUseCaseForAdjustment
}: HeroSectionProps) {
  const [showQuoteBuilderLanding, setShowQuoteBuilderLanding] = useState(false);
  const [selectedUseCaseForQuote, setSelectedUseCaseForQuote] = useState<UseCaseData | null>(null);
  const [showRealWorldModal, setShowRealWorldModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<'hotel' | 'data-center' | 'ev-charging'>('hotel');

  const handleLoadTemplate = (useCase: UseCaseData) => {
    console.log('🎯🎯🎯 HeroSection handleLoadTemplate called with:', useCase.industry);
    console.log('🚀 Opening QuoteBuilderLanding modal for:', useCase.industry);
    
    // Set the selected use case and show the QuoteBuilderLanding modal
    setSelectedUseCaseForQuote(useCase);
    setShowQuoteBuilderLanding(true);
  };

  const handleGenerateQuote = () => {
    if (!selectedUseCaseForQuote) return;
    
    console.log('📄 Generating quote for:', selectedUseCaseForQuote.industry);
    
    // Store use case data and jump to quote generation (step 5)
    const wizardData = {
      selectedTemplate: selectedUseCaseForQuote.industry.toLowerCase().replace(/ /g, '-'),
      storageSizeMW: selectedUseCaseForQuote.systemSizeMW,
      durationHours: selectedUseCaseForQuote.duration,
      location: selectedCountry,
      jumpToStep: 5, // Go directly to quote summary
      useCase: selectedUseCaseForQuote
    };
    
    localStorage.setItem('merlin_wizard_quickstart', JSON.stringify(wizardData));
    setShowQuoteBuilderLanding(false);
    setShowSmartWizard(true);
  };

  const handleCustomizeSystem = () => {
    if (!selectedUseCaseForQuote) return;
    
    console.log('⚙️ Customizing system for:', selectedUseCaseForQuote.industry);
    
    // Store use case data and start from step 1
    const wizardData = {
      selectedTemplate: selectedUseCaseForQuote.industry.toLowerCase().replace(/ /g, '-'),
      storageSizeMW: selectedUseCaseForQuote.systemSizeMW,
      durationHours: selectedUseCaseForQuote.duration,
      location: selectedCountry,
      jumpToStep: 1, // Start from beginning for customization
      useCase: selectedUseCaseForQuote
    };
    
    localStorage.setItem('merlin_wizard_quickstart', JSON.stringify(wizardData));
    setShowQuoteBuilderLanding(false);
    setShowSmartWizard(true);
  };

  const handleCancelQuoteBuilder = () => {
    console.log('❌ Quote builder cancelled');
    setShowQuoteBuilderLanding(false);
    setSelectedUseCaseForQuote(null);
  };

  const handleLoadTemplate_OLD = (useCase: UseCaseData) => {
    console.log('🎯🎯🎯 NEW SECTIONS/HeroSection handleLoadTemplate called with:', useCase.industry);
    console.log('🎯🎯🎯 About to set Smart Wizard quickstart data');
    
    // Store use case data in localStorage for wizard to pick up
    const wizardData = {
      selectedTemplate: useCase.industry.toLowerCase().replace(' ', '-'),
      storageSizeMW: useCase.systemSizeMW,
      durationHours: useCase.duration,
      location: selectedCountry,
      jumpToStep: 5, // Go directly to quote summary
      useCase: useCase
    };
    
    console.log('🚀🚀🚀 Storing wizard quickstart data:', wizardData);
    localStorage.setItem('merlin_wizard_quickstart', JSON.stringify(wizardData));
    console.log('🚀🚀🚀 Starting Smart Wizard for use case:', useCase.industry);
    setShowSmartWizard(true);
  };

  return (
    <>
      {/* NEW CUSTOMER-FOCUSED HERO SECTION */}
      <section className="my-6 rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400 bg-gradient-to-br from-white via-purple-50 to-blue-100">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-600/20 animate-pulse"></div>
          
          {/* Top Right Button - Join Now */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              className="bg-gradient-to-b from-blue-100 to-blue-200 text-blue-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:from-blue-200 hover:to-blue-300 transition-colors border-2 border-blue-300"
              onClick={() => setShowJoinModal(true)}
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
                  <span className="text-3xl">🧙‍♂️</span>
                  Start Saving with SmartWizard
                </h3>
                <div className="mb-4 pb-4 border-b border-white/20">
                  <p className="text-lg text-white/90 mb-2">
                    Merlin's AI calculates actual costs and savings for businesses like yours
                  </p>
                  <div className="flex items-center gap-2 text-sm text-cyan-200 cursor-pointer hover:text-cyan-100 transition-colors">
                    <span>👉</span>
                    <span>Click here to explore real world savings</span>
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
                    onClick={() => setShowSmartWizard(true)}
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
                      console.log('🎯🎯🎯 HERO ADVANCED TOOLS BUTTON CLICKED!');
                      console.log('About to call setShowAdvancedQuoteBuilder(true)');
                      setShowAdvancedQuoteBuilder(true);
                      console.log('✅ setShowAdvancedQuoteBuilder(true) called successfully');
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
                {/* Merlin's Magic Tooltip - Smaller with Purple to Silver Gradient */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                  <div className="bg-gradient-to-r from-purple-500 to-gray-300 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-purple-300">
                    ✨ Merlin's Magic
                  </div>
                  <div className="w-3 h-3 bg-purple-500 transform rotate-45 mx-auto -mt-1.5 border-b border-r border-purple-300"></div>
                </div>

                {/* Glow effect behind Merlin */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/50 via-purple-400/50 to-blue-400/50 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                
                <div 
                  onClick={() => setShowAbout(true)}
                  className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border-4 border-white/30 shadow-2xl cursor-pointer hover:scale-105 transition-transform hover:border-yellow-300"
                >
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

        {/* Three Value Pillars - HORIZONTAL LAYOUT WITH COLORS */}
        <div className="flex justify-center gap-6 px-8 py-12">
          {/* Cost Savings Card - DEEP PURPLE */}
          <div 
            onClick={() => setShowCostSavingsModal(true)}
            className="group relative flex-1 max-w-md bg-gradient-to-br from-purple-600 to-purple-900 rounded-3xl p-6 shadow-2xl hover:shadow-[0_25px_70px_rgba(147,51,234,0.5)] transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl">💰</div>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold mb-2">Reduce Energy Costs</h3>
                <p className="text-purple-100 text-sm mb-3">Cut electricity bills by 30-50%</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                  <span className="text-3xl font-black text-white">$50K+</span>
                  <span className="text-xs text-white/90 ml-2">avg annual savings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Generation Card - LIGHT BLUE */}
          <div 
            onClick={() => setShowRevenueModal(true)}
            className="group relative flex-1 max-w-md bg-gradient-to-br from-sky-300 to-blue-500 rounded-3xl p-6 shadow-2xl hover:shadow-[0_25px_70px_rgba(56,189,248,0.5)] transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl">📈</div>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold mb-2">Generate Revenue</h3>
                <p className="text-sky-100 text-sm mb-3">Turn batteries into profit centers</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                  <span className="text-3xl font-black text-white">$30K+</span>
                  <span className="text-xs text-white/90 ml-2">extra revenue/year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability Card - AMBER ORANGE */}
          <div 
            onClick={() => setShowSustainabilityModal(true)}
            className="group relative flex-1 max-w-md bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl p-6 shadow-2xl hover:shadow-[0_25px_70px_rgba(251,191,36,0.5)] transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl">🌱</div>
              <div className="flex-1 text-white">
                <h3 className="text-xl font-bold mb-2">Achieve Sustainability</h3>
                <p className="text-amber-100 text-sm mb-3">Reach environmental goals</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 inline-block">
                  <span className="text-3xl font-black text-white">100%</span>
                  <span className="text-xs text-white/90 ml-2">clean energy potential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REAL-WORLD APPLICATIONS - PHOTO-BASED REDESIGN */}
      <section className="my-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Real-World Applications
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how businesses save money and go green with battery storage
          </p>
        </div>

        {/* Photo Grid with Metrics Overlay */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Hotel Card */}
          <div className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
               onClick={() => {
                 console.log('🏨 Hotel card clicked');
                 setSelectedApplication('hotel');
                 setShowRealWorldModal(true);
               }}>
            <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80)' }}>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-2">Luxury Hotel</h3>
              <div className="grid grid-cols-2 gap-3 text-white text-sm">
                <div>
                  <div className="text-green-400 font-bold text-lg">$1.38M/yr</div>
                  <div className="text-xs opacity-80">Cost Savings</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold text-lg">9 months</div>
                  <div className="text-xs opacity-80">Payback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Center Card */}
          <div className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
               onClick={() => {
                 console.log('💾 Data Center card clicked');
                 setSelectedApplication('data-center');
                 setShowRealWorldModal(true);
               }}>
            <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&q=80)' }}>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-2">Cloud Data Center</h3>
              <div className="grid grid-cols-2 gap-3 text-white text-sm">
                <div>
                  <div className="text-green-400 font-bold text-lg">$250K/yr</div>
                  <div className="text-xs opacity-80">Cost Savings</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold text-lg">3.5 years</div>
                  <div className="text-xs opacity-80">Payback</div>
                </div>
              </div>
            </div>
          </div>

          {/* EV Charging Card */}
          <div className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
               onClick={() => {
                 console.log('⚡ EV Charging card clicked');
                 setSelectedApplication('ev-charging');
                 setShowRealWorldModal(true);
               }}>
            <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80)' }}>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <h3 className="text-white font-bold text-xl mb-2">Fast Charging Hub</h3>
              <div className="grid grid-cols-2 gap-3 text-white text-sm">
                <div>
                  <div className="text-green-400 font-bold text-lg">$8.7M/yr</div>
                  <div className="text-xs opacity-80">Cost Savings</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold text-lg">6 months</div>
                  <div className="text-xs opacity-80">Payback</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-2 font-medium">These are real examples with actual ROI data</p>
          <p className="text-sm text-gray-500">Click any card to see full case study →</p>
        </div>
      </section>

      {/* Original rotating carousel below */}
      <section className="my-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Explore More Industries
          </h3>
        </div>
        {/* Use Case Showcase */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <UseCaseROI 
              autoRotate={true}
              rotationInterval={10000}
              onLoadTemplate={handleLoadTemplate}
            />
          </div>
        </div>
      </section>

      {/* Quote Builder Landing Modal */}
      {showQuoteBuilderLanding && selectedUseCaseForQuote && (
        <QuoteBuilderLanding
          useCase={selectedUseCaseForQuote}
          onGenerateQuote={handleGenerateQuote}
          onCustomize={handleCustomizeSystem}
          onCancel={handleCancelQuoteBuilder}
        />
      )}

      {/* Real World Applications Modal */}
      <RealWorldApplicationModal
        show={showRealWorldModal}
        onClose={() => setShowRealWorldModal(false)}
        application={selectedApplication}
        onStartWizard={() => setShowSmartWizard(true)}
      />
    </>
  );
}