import React, { useState, useEffect } from 'react';
import UseCaseROI from '../UseCaseROI';
import type { UseCaseData } from '../UseCaseROI';
import QuoteBuilderLanding from '../wizard/QuoteBuilderLanding';
import RealWorldApplicationModal from '../modals/RealWorldApplicationModal';
import { calculateBESSPricing } from '../../utils/bessPricing';
import { calculateEquipmentBreakdown } from '../../utils/equipmentCalculations';
import { QuoteEngine } from '@/core/calculations';
import merlinImage from "../../assets/images/new_Merlin.png";
import { MethodologyStatement, TrustBadgesInline } from '../shared/IndustryComplianceBadges';
import { TrueQuoteBadge } from '../shared/TrueQuoteBadge';
import { TrueQuoteModal } from '../shared/TrueQuoteModal';

// Marketing constants for display-only calculations (hero stats, not quotes)
import { DISPLAY_PRICING, COST_MULTIPLIERS } from '@/constants/marketing';

// Import use case images
import carWashImage from "../../assets/images/car_wash_1.jpg";
import carWashPitStop from "../../assets/images/Car_Wash_PitStop.jpg";
import carWashPitStop1 from "../../assets/images/Car_Wash_PitStop1.jpg";
import carWashPitStop2 from "../../assets/images/Car_Wash_PitStop2.jpg";
import carWashPitStop3 from "../../assets/images/Car_Wash_PitStop3.jpg";
import carWashPitStop4 from "../../assets/images/Car_Wash_PitStop4.jpg";
import carWashPitStop5 from "../../assets/images/Car_Wash_PitStop5.jpg";
import carWashPreen from "../../assets/images/Car_Wash_Preen.jpg";
import carWashRobot from "../../assets/images/car_wash_robot.jpg";
import carWashTunnel from "../../assets/images/car_wash_tunnel.jpg";
import carWashAuto from "../../assets/images/Car_Wash_Auto.jpg";
import carWash1 from "../../assets/images/carwash1.jpg";
import hospitalImage from "../../assets/images/hospital_1.jpg";
import evChargingStationImage from "../../assets/images/ev_charging_station.png";
import evChargingHotelImage from "../../assets/images/ev_charging_hotel.webp";
import hotelImage from "../../assets/images/hotel_1.avif";
import airportImage from "../../assets/images/airports_1.jpg";
// Holiday Inn hotel images
import hotelHolidayInn1 from "../../assets/images/hotel_motel_holidayinn_1.jpg";
import hotelHolidayInn2 from "../../assets/images/hotel_motel_holidayinn_2.jpg";
import hotelHolidayInn3 from "../../assets/images/hotel_motel_holidayinn_3.jpg";
import hotelHolidayInn4 from "../../assets/images/hotel_motel_holidayinn_4.jpg";

// Hero use cases with real financial data - Car Wash Focus (Key Market)
const heroUseCases = [
  {
    id: 'car-wash-express',
    name: 'Express Car Wash',
    image: carWashPitStop,
    savings: '$98K',
    payback: '2.4 yrs',
    roi: '420%',
    systemSize: '0.4 MW / 1.6 MWh'
  },
  {
    id: 'car-wash-auto',
    name: 'Automated Car Wash',
    image: carWashAuto,
    savings: '$145K',
    payback: '1.9 yrs',
    roi: '530%',
    systemSize: '0.6 MW / 2.4 MWh'
  },
  {
    id: 'car-wash-tunnel',
    name: 'Tunnel Car Wash',
    image: carWashTunnel,
    savings: '$156K',
    payback: '1.8 yrs',
    roi: '560%',
    systemSize: '0.65 MW / 2.6 MWh'
  },
  {
    id: 'car-wash-full-service',
    name: 'Full Service Car Wash',
    image: carWashPreen,
    savings: '$142K',
    payback: '2.0 yrs',
    roi: '505%',
    systemSize: '0.55 MW / 2.2 MWh'
  },
  {
    id: 'car-wash-premium',
    name: 'Premium Car Wash',
    image: carWashPitStop2,
    savings: '$135K',
    payback: '2.1 yrs',
    roi: '490%',
    systemSize: '0.52 MW / 2.1 MWh'
  },
  {
    id: 'car-wash-robot',
    name: 'Robotic Car Wash',
    image: carWashRobot,
    savings: '$118K',
    payback: '2.2 yrs',
    roi: '460%',
    systemSize: '0.45 MW / 1.8 MWh'
  },
  {
    id: 'hotel-luxury',
    name: 'Luxury Hotel',
    image: hotelHolidayInn2,
    savings: '$1.2M',
    payback: '1.1 yrs',
    roi: '920%',
    systemSize: '2.0 MW / 8 MWh'
  },
  {
    id: 'car-wash-eco',
    name: 'Eco Car Wash',
    image: carWash1,
    savings: '$109K',
    payback: '2.3 yrs',
    roi: '440%',
    systemSize: '0.42 MW / 1.7 MWh'
  },
  {
    id: 'hospital',
    name: 'Hospital',
    image: hospitalImage,
    savings: '$890K',
    payback: '1.8 yrs',
    roi: '560%',
    systemSize: '1.5 MW / 6 MWh'
  },
  {
    id: 'car-wash-solar',
    name: 'Solar Car Wash',
    image: carWashPitStop4,
    savings: '$145K',
    payback: '1.8 yrs',
    roi: '550%',
    systemSize: '0.58 MW / 2.3 MWh'
  },
  {
    id: 'airport',
    name: 'Airport',
    image: airportImage,
    savings: '$2.1M',
    payback: '1.4 yrs',
    roi: '720%',
    systemSize: '4.0 MW / 16 MWh'
  },
  {
    id: 'car-wash-pitstop2',
    name: 'Premium Car Wash',
    image: carWashPitStop2,
    savings: '$135K',
    payback: '2.1 yrs',
    roi: '490%',
    systemSize: '0.52 MW / 2.1 MWh'
  },
  {
    id: 'ev-hotel',
    name: 'Hotel + EV Charging',
    image: evChargingHotelImage,
    savings: '$560K',
    payback: '1.2 yrs',
    roi: '830%',
    systemSize: '1.2 MW / 4.8 MWh'
  },
  {
    id: 'car-wash-pitstop3',
    name: 'Eco Car Wash',
    image: carWashPitStop3,
    savings: '$109K',
    payback: '2.3 yrs',
    roi: '440%',
    systemSize: '0.42 MW / 1.7 MWh'
  },
  {
    id: 'car-wash-pitstop4',
    name: 'Solar Car Wash',
    image: carWashPitStop4,
    savings: '$145K',
    payback: '1.8 yrs',
    roi: '550%',
    systemSize: '0.58 MW / 2.3 MWh'
  },
  {
    id: 'car-wash-pitstop5',
    name: 'Quick Shine Wash',
    image: carWashPitStop5,
    savings: '$88K',
    payback: '2.5 yrs',
    roi: '400%',
    systemSize: '0.35 MW / 1.4 MWh'
  },
  {
    id: 'car-wash-pitstop1',
    name: 'Auto Spa',
    image: carWashPitStop1,
    savings: '$122K',
    payback: '2.2 yrs',
    roi: '470%',
    systemSize: '0.48 MW / 1.9 MWh'
  }
];

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
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showUseCaseDetail, setShowUseCaseDetail] = useState(false);
  const [selectedHeroUseCase, setSelectedHeroUseCase] = useState<typeof heroUseCases[0] | null>(null);
  
  // Merlin Intelligence Engine popup states
  const [activeInfoPopup, setActiveInfoPopup] = useState<string | null>(null);
  const [showMerlinVideo, setShowMerlinVideo] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // Auto-rotate through use case images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroUseCases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLoadTemplate = (useCase: UseCaseData) => {
    // Set the selected use case and show the QuoteBuilderLanding modal
    setSelectedUseCaseForQuote(useCase);
    setShowQuoteBuilderLanding(true);
  };

  const handleGenerateQuote = async () => {
    if (!selectedUseCaseForQuote) return;
    
    const uc = selectedUseCaseForQuote;
    
    // ✅ SSOT: Use QuoteEngine.generateQuote() for actual quote generation
    // This ensures quote preview matches what user would get from wizard
    try {
      const quoteResult = await QuoteEngine.generateQuote({
        storageSizeMW: uc.systemSizeMW,
        durationHours: uc.duration,
        location: selectedCountry || 'United States',
        electricityRate: 0.15, // Default rate - QuoteEngine handles regional adjustments
        useCase: uc.industry.toLowerCase().replace(/ /g, '-'),
        gridConnection: 'on-grid',
        solarMW: 0,
        windMW: 0,
        generatorMW: 0,
      });
      
      // Create quote object from SSOT result
      // Map equipment breakdown to cost structure expected by QuotePreviewModal
      const generatedQuote = {
        clientName: uc.industry,
        projectName: `${uc.industry} - ${uc.systemSizeMW} MW / ${uc.duration}hr BESS`,
        bessPowerMW: uc.systemSizeMW,
        duration: uc.duration,
        batteryMWh: uc.systemSizeMW * uc.duration,
        solarMW: 0,
        windMW: 0,
        generatorMW: 0,
        gridConnection: 'On-grid',
        application: uc.industry,
        location: selectedCountry || 'United States',
        warranty: '10 years',
        pcsIncluded: true,
        costs: {
          batterySystem: quoteResult.equipment.batteries.totalCost,
          pcs: quoteResult.equipment.inverters.totalCost,
          transformers: quoteResult.equipment.transformers.totalCost,
          inverters: quoteResult.equipment.inverters.totalCost,
          switchgear: quoteResult.equipment.switchgear.totalCost,
          microgridControls: Math.round(quoteResult.costs.installationCost * 0.1), // ~10% of installation
          solar: 0,
          solarInverters: 0,
          wind: 0,
          windConverters: 0,
          generator: 0,
          generatorControls: 0,
          bos: Math.round(quoteResult.costs.equipmentCost * (bosPercent / 100)),
          epc: Math.round(quoteResult.costs.equipmentCost * (epcPercent / 100)),
          tariffs: Math.round(quoteResult.costs.totalProjectCost * (COST_MULTIPLIERS.tariffPercent / 100)),
          shipping: Math.round(quoteResult.costs.totalProjectCost * (COST_MULTIPLIERS.shippingPercent / 100)),
          grandTotal: quoteResult.costs.netCost
        },
        annualSavings: quoteResult.financials.annualSavings,
        paybackPeriod: quoteResult.financials.paybackYears
      };
      
      // Close landing modal and show quote preview with download option
      setShowQuoteBuilderLanding(false);
      setCurrentQuote(generatedQuote);
      setShowQuotePreview(true);
    } catch (error) {
      console.error('Error generating quote:', error);
      // Fallback: redirect to wizard for proper quote generation
      handleCustomizeSystem();
    }
  };

  const handleCustomizeSystem = () => {
    if (!selectedUseCaseForQuote) return;
    
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
    setShowQuoteBuilderLanding(false);
    setSelectedUseCaseForQuote(null);
  };

  const handleLoadTemplate_OLD = (useCase: UseCaseData) => {
    // Store use case data in localStorage for wizard to pick up
    const wizardData = {
      selectedTemplate: useCase.industry.toLowerCase().replace(' ', '-'),
      storageSizeMW: useCase.systemSizeMW,
      durationHours: useCase.duration,
      location: selectedCountry,
      jumpToStep: 5, // Go directly to quote summary
      useCase: useCase
    };
    
    localStorage.setItem('merlin_wizard_quickstart', JSON.stringify(wizardData));
    setShowSmartWizard(true);
  };

  return (
    <>
      {/* ========== MERLIN HERO - POLISHED PROFESSIONAL DESIGN ========== */}
      <section className="relative py-8 px-4 md:px-8 lg:px-12">
        
        {/* Hero Card with rounded corners and drop shadow */}
        <div 
          className="relative min-h-[85vh] overflow-hidden rounded-3xl"
          style={{
            boxShadow: '0 25px 80px rgba(0,0,0,0.4), 0 10px 30px rgba(91,33,182,0.3)'
          }}
        >
        
        {/* Purple gradient background - Merlin brand */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 rounded-3xl"></div>
        
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
            
            {/* ========== LEFT HALF - Content ========== */}
            <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 xl:px-24 py-20 lg:py-0 pt-8 lg:pt-16">
              
              {/* Welcome Text - with top padding for breathing room */}
              <p className="text-purple-300/80 text-lg mb-4 mt-4">
                Welcome to <span className="text-amber-300 font-semibold">Merlin Energy</span>, an advanced AI energy service.
              </p>
              
              {/* Main Headline - ENERGY SAVINGS focused */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                Slash Your
                <span className="block bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-transparent bg-clip-text">
                  Energy Costs
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl text-purple-200/90 mb-8 max-w-lg leading-relaxed">
                Get your custom energy savings quote in 5 minutes. See exactly how much you'll save with battery storage.
              </p>

              {/* CTA Button - Purple-Pink Gradient with Smooth Animation */}
              <style>{`
                @keyframes spinButton {
                  0% { transform: scale(1) rotate(0deg); }
                  25% { transform: scale(1.05) rotate(5deg); }
                  50% { transform: scale(1.1) rotate(0deg); }
                  75% { transform: scale(1.05) rotate(-5deg); }
                  100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes gradientShift {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes floatGlow {
                  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
                  50% { transform: scale(1.1) rotate(180deg); opacity: 0.9; }
                }
                .gradient-button {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%);
                  background-size: 300% 300%;
                  animation: gradientShift 3s ease infinite;
                }
                .spin-button:hover {
                  animation: spinButton 0.6s ease-in-out;
                }
                .gradient-button:hover {
                  background-size: 400% 400%;
                  animation: gradientShift 2s ease infinite;
                }
                .float-glow {
                  animation: floatGlow 3s ease-in-out infinite;
                }
              `}</style>
              <button 
                onClick={() => setShowSmartWizard(true)}
                className="gradient-button spin-button group relative w-full max-w-md px-8 py-4 rounded-full font-bold text-xl transition-all duration-300 mb-6 overflow-hidden"
                style={{
                  boxShadow: '0 0 40px rgba(102,126,234,0.6), 0 0 80px rgba(118,75,162,0.4), 0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                {/* Floating glow ring */}
                <div className="float-glow absolute -inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl opacity-60" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-full" />
                <span className="relative flex items-center justify-center gap-2 text-white">
                  <span className="text-2xl animate-pulse">✨</span>
                  <span className="text-xl font-black whitespace-nowrap">Get My Free Quote</span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                </span>
              </button>

              {/* Advanced Builder - MATCHING WIDTH */}
              <button 
                onClick={() => setShowAdvancedQuoteBuilder(true)}
                className="group flex items-center justify-center gap-3 mb-4 w-full max-w-md px-8 py-4 rounded-full border-2 border-purple-400/50 hover:border-amber-400 hover:bg-purple-800/30 transition-all"
              >
                <span className="text-xl">⚡</span>
                <span className="text-white font-semibold text-lg">Advanced Quote Builder</span>
                <span className="text-purple-300 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">→</span>
              </button>

              {/* TrueQuote™ Badge - Clickable for marketing modal */}
              <div className="flex items-center justify-center gap-2 mb-10">
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="hover:scale-105 transition-transform cursor-pointer"
                >
                  <TrueQuoteBadge size="md" />
                </button>
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="text-purple-300 text-sm hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Every number has a source →
                </button>
              </div>

              {/* Industry Compliance - Transparent, Auditable Pricing */}
              <MethodologyStatement 
                variant="hero" 
                darkMode={true} 
                message="All quotes use NREL ATB 2024 pricing and DOE-aligned methodology. Every calculation is traceable."
                className="mb-6"
              />
              
              {/* How it Works - with wizard icon */}
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-3 text-purple-300 hover:text-amber-300 transition-colors"
              >
                <img src={merlinImage} alt="" className="w-6 h-6" />
                <span>See how Merlin works his magic</span>
                <span>→</span>
              </button>
            </div>

            {/* ========== RIGHT HALF - Infinity Pool Image ========== */}
            <div className="relative lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-1/2">
              
              {/* Images that bleed to edge */}
              <div className="relative w-full h-[50vh] lg:h-full">
                {heroUseCases.map((useCase, index) => (
                  <div
                    key={useCase.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* Full-bleed image - no rounded corners on right edge */}
                    <img 
                      src={useCase.image} 
                      alt={useCase.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient overlay - fades into purple on left */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to right, rgba(76,29,149,1) 0%, rgba(76,29,149,0.6) 15%, transparent 40%), linear-gradient(to top, rgba(30,15,60,0.9) 0%, transparent 50%)'
                      }}
                    />
                    
                    {/* Financial overlay card - CLICKABLE */}
                    <div 
                      className="absolute bottom-8 left-8 right-8 lg:left-12 lg:right-12 cursor-pointer group/card"
                      onClick={() => {
                        setSelectedHeroUseCase(useCase);
                        setShowUseCaseDetail(true);
                      }}
                    >
                      <div 
                        className="backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:border-amber-400/50 transition-all hover:scale-[1.02] hover:shadow-2xl"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        {/* Click hint */}
                        <div className="absolute top-3 right-3 text-xs text-purple-300/50 group-hover/card:text-amber-300 transition-colors flex items-center gap-1">
                          <span>Click for details</span>
                          <span>→</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-white">{useCase.name}</h3>
                          <span className="text-xs text-purple-200 bg-white/10 px-3 py-1.5 rounded-full">
                            {useCase.systemSize}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-black text-amber-400">{useCase.savings}</div>
                            <div className="text-xs text-purple-300/70 mt-1">Annual Savings</div>
                          </div>
                          <div className="text-center border-x border-white/10 px-2">
                            <div className="text-3xl font-black text-purple-300">{useCase.payback}</div>
                            <div className="text-xs text-purple-300/70 mt-1">Payback</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-cyan-400">{useCase.roi}</div>
                            <div className="text-xs text-purple-300/70 mt-1">25-Year ROI</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex gap-2 z-20">
                {heroUseCases.map((uc, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-amber-400 w-8' 
                        : 'bg-white/30 hover:bg-white/50 w-2'
                    }`}
                    title={uc.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ========== THE MERLIN INTELLIGENCE ENGINE ========== */}
      <section className="py-24 px-4 md:px-8 lg:px-12 relative overflow-hidden">
        {/* Deep purple gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #4c1d95 0%, #6b21a8 30%, #7c3aed 60%, #8b5cf6 100%)'
          }}
        />
        
        {/* Animated grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Glowing orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-amber-500/20 backdrop-blur-sm rounded-full px-5 py-2 mb-8 border border-purple-400/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-purple-200 text-sm font-medium tracking-wide">POWERED BY ADVANCED AI</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              The Merlin Intelligence
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400">
                Engine
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-purple-200/80 max-w-3xl mx-auto leading-relaxed mb-8">
              Stop guessing. Stop calling multiple vendors. Our AI analyzes <span className="text-amber-300 font-semibold">30+ industry configurations</span>, 
              real utility rates, and <span className="text-cyan-300 font-semibold">NREL-validated pricing</span> to build your optimal energy system in minutes.
            </p>
            
            {/* Industry Compliance Badges - Inline */}
            <div className="flex justify-center">
              <TrustBadgesInline 
                sources={['nrel', 'doe', 'sandia', 'ul', 'ieee', 'eia']}
                size="md"
                label="Data sourced from:"
                darkMode={true}
              />
            </div>
          </div>

          {/* Main Visual: AI System Diagram */}
          <div className="relative mb-20">
            
            {/* Central AI Hub */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
              
              {/* Left Side - Inputs */}
              <div className="flex flex-col gap-6 lg:w-1/3">
                {/* Input 1: Your Business */}
                <div className="group relative">
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'facility' ? null : 'facility')}
                    className="relative bg-gradient-to-br from-purple-900/90 to-indigo-950/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-amber-400/50 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ boxShadow: '0 0 30px rgba(139,92,246,0.15)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(139,92,246,0.5))' }}>🏢</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Your Facility</h4>
                        <p className="text-purple-300/70 text-sm">Industry type, square footage, operating hours, peak demand</p>
                      </div>
                    </div>
                    {/* Click indicator */}
                    <div className="absolute top-2 right-2 text-purple-400/60 text-xs">Click to learn more</div>
                    {/* Connection line */}
                    <div className="hidden lg:block absolute right-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" style={{ transform: 'translateX(100%)' }} />
                  </div>
                  {/* Popup for Facility */}
                  {activeInfoPopup === 'facility' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-purple-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">How Facility Analysis Works</h5>
                      <p className="text-purple-200 text-sm mb-3">Merlin uses industry-specific power profiles from ASHRAE, CBECS, and Energy Star databases to understand your energy needs:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Industry Type:</span> 30+ pre-configured profiles (hospitals, hotels, data centers, EV charging, manufacturing...)</li>
                        <li>• <span className="text-white">Square Footage:</span> Calculates base load using industry W/sqft standards</li>
                        <li>• <span className="text-white">Operating Hours:</span> Determines peak demand windows and TOU optimization</li>
                        <li>• <span className="text-white">Peak Demand:</span> Sizes battery for maximum demand charge reduction</li>
                      </ul>
                      <div className="mt-3 text-xs text-cyan-300">💡 We know a hospital needs different power than a car wash!</div>
                    </div>
                  )}
                </div>

                {/* Input 2: Location & Rates */}
                <div className="group relative">
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'location' ? null : 'location')}
                    className="relative bg-gradient-to-br from-purple-900/90 to-indigo-950/90 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 hover:border-amber-400/50 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ boxShadow: '0 0 30px rgba(6,182,212,0.15)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(6,182,212,0.5))' }}>📍</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Location & Utility</h4>
                        <p className="text-purple-300/70 text-sm">Local utility rates, demand charges, TOU schedules</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-cyan-400/60 text-xs">Click to learn more</div>
                    <div className="hidden lg:block absolute right-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent" style={{ transform: 'translateX(100%)' }} />
                  </div>
                  {/* Popup for Location */}
                  {activeInfoPopup === 'location' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-cyan-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">How Location & Utility Works</h5>
                      <p className="text-purple-200 text-sm mb-3">Your location directly impacts savings potential and ROI:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Utility Rates:</span> We pull actual $/kWh rates for your region (CA has higher rates = bigger savings!)</li>
                        <li>• <span className="text-white">Demand Charges:</span> $/kW charges that battery storage can dramatically reduce</li>
                        <li>• <span className="text-white">TOU Schedules:</span> Time-of-use pricing lets you buy low, use high—battery arbitrage</li>
                        <li>• <span className="text-white">Incentives:</span> State and local rebates stacked on top of 30% federal ITC</li>
                      </ul>
                      <div className="mt-3 text-xs text-emerald-300">📊 A facility in California vs. Texas can see 2-3x different savings!</div>
                    </div>
                  )}
                </div>

                {/* Input 3: Goals */}
                <div className="group relative">
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'goals' ? null : 'goals')}
                    className="relative bg-gradient-to-br from-purple-900/90 to-indigo-950/90 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 hover:border-amber-400/50 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{ boxShadow: '0 0 30px rgba(16,185,129,0.15)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(16,185,129,0.5))' }}>🎯</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Your Goals</h4>
                        <p className="text-purple-300/70 text-sm">Cost savings, backup power, sustainability, EV charging</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-emerald-400/60 text-xs">Click to learn more</div>
                    <div className="hidden lg:block absolute right-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" style={{ transform: 'translateX(100%)' }} />
                  </div>
                  {/* Popup for Goals */}
                  {activeInfoPopup === 'goals' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-emerald-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">How Goal Optimization Works</h5>
                      <p className="text-purple-200 text-sm mb-3">Different goals require different system configurations:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Cost Savings:</span> Optimize for peak shaving + TOU arbitrage = maximum ROI</li>
                        <li>• <span className="text-white">Backup Power:</span> Size battery for critical load hours (4-8 hour backup typical)</li>
                        <li>• <span className="text-white">Sustainability:</span> Pair with solar for net-zero goals, carbon reduction metrics</li>
                        <li>• <span className="text-white">EV Charging:</span> Level 2, DCFC, or HPC—we calculate infrastructure needs</li>
                      </ul>
                      <div className="mt-3 text-xs text-amber-300">⚡ Multi-goal optimization: save money AND go green AND add EV charging!</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Merlin AI Core - LARGER, NO CIRCLE */}
              <div className="lg:w-1/3 flex justify-center py-8 lg:py-0">
                <div className="relative">
                  {/* Ambient glow behind Merlin */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 bg-gradient-to-r from-purple-500/40 via-amber-500/30 to-cyan-500/40 rounded-full blur-[80px] animate-pulse" />
                  </div>
                  
                  {/* Floating magical particles around Merlin */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-8 left-12 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s' }} />
                    <div className="absolute top-16 right-8 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    <div className="absolute bottom-20 left-8 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    <div className="absolute bottom-12 right-16 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-50" style={{ animationDuration: '2.2s', animationDelay: '0.8s' }} />
                  </div>
                  
                  {/* Core container - CLICKABLE - NO HARD CIRCLE EDGE */}
                  <div 
                    onClick={() => setShowMerlinVideo(true)}
                    className="relative flex flex-col items-center justify-center cursor-pointer group transition-transform hover:scale-105 active:scale-95 py-8"
                  >
                    {/* Click glow effect - expands on click */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-active:from-amber-500/30 group-active:via-amber-500/40 group-active:to-amber-500/30 transition-all duration-300 blur-xl scale-90 group-active:scale-125" />
                    
                    {/* Merlin Image - MUCH LARGER and FLOATING with STRONG DROP SHADOW */}
                    <img 
                      src={merlinImage} 
                      alt="Merlin AI" 
                      className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 mb-2 object-contain animate-float relative z-10"
                      style={{ 
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 60px rgba(139,92,246,0.4))'
                      }}
                    />
                    
                    {/* Text below Merlin */}
                    <div className="text-center relative z-10 mt-4">
                      <div className="text-amber-400 font-black text-2xl tracking-wide drop-shadow-lg">MERLIN AI</div>
                      <div className="text-purple-300/80 text-sm mt-1 flex items-center gap-2 justify-center">
                        <span className="w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center text-xs">▶</span>
                        <span>Click to see the magic</span>
                      </div>
                    </div>
                    
                    {/* Processing indicators - BELOW */}
                    <div className="flex gap-2 mt-6 relative z-10">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                      <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-500/50" style={{ animationDelay: '0.2s' }} />
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500/50" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                  
                  {/* Data flow labels around Merlin */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-950/90 px-4 py-1.5 rounded-full border border-purple-500/30 shadow-lg">
                    <span className="text-purple-300 text-sm font-medium">30+ Industry Configs</span>
                  </div>
                  <div className="absolute top-1/2 -left-28 -translate-y-1/2 bg-purple-950/90 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg hidden xl:block">
                    <span className="text-cyan-300 text-sm font-medium">NREL ATB 2024</span>
                  </div>
                  <div className="absolute top-1/2 -right-28 -translate-y-1/2 bg-purple-950/90 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-lg hidden xl:block">
                    <span className="text-amber-300 text-sm font-medium">Real-time Pricing</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Outputs */}
              <div className="flex flex-col gap-6 lg:w-1/3">
                {/* Output 1: Optimal System */}
                <div className="group relative">
                  <div className="hidden lg:block absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-l from-amber-500 to-transparent" style={{ transform: 'translateX(-100%)' }} />
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'system' ? null : 'system')}
                    className="relative bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/40 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ boxShadow: '0 0 30px rgba(251,191,36,0.15)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(251,191,36,0.5))' }}>⚡</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Perfect System Size</h4>
                        <p className="text-purple-300/70 text-sm">Battery kWh, inverter capacity, duration optimized for your load</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-amber-400/60 text-xs">Click to learn more</div>
                  </div>
                  {/* Popup for System Size */}
                  {activeInfoPopup === 'system' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-amber-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">Perfect System Sizing</h5>
                      <p className="text-purple-200 text-sm mb-3">Merlin calculates your optimal BESS size based on your actual load profile:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Battery kWh:</span> Sized to shave peak demand while maximizing ROI</li>
                        <li>• <span className="text-white">Inverter Capacity:</span> Power rating matched to discharge requirements</li>
                        <li>• <span className="text-white">Duration:</span> 2-4 hour systems most common; we recommend based on your TOU schedule</li>
                      </ul>
                      <div className="mt-3 text-xs text-emerald-300">🔋 No oversizing = lower cost. No undersizing = captured savings!</div>
                    </div>
                  )}
                </div>

                {/* Output 2: Add-ons */}
                <div className="group relative">
                  <div className="hidden lg:block absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-l from-amber-500 to-transparent" style={{ transform: 'translateX(-100%)' }} />
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'addons' ? null : 'addons')}
                    className="relative bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/40 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ boxShadow: '0 0 30px rgba(251,191,36,0.15)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(251,191,36,0.5))' }}>☀️</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Solar & Generation</h4>
                        <p className="text-purple-300/70 text-sm">Exact solar kWp, generator sizing, EV charger specs</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-amber-400/60 text-xs">Click to learn more</div>
                  </div>
                  {/* Popup for Add-ons */}
                  {activeInfoPopup === 'addons' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-amber-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">Smart Add-on Recommendations</h5>
                      <p className="text-purple-200 text-sm mb-3">Merlin suggests complementary systems to maximize value:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Solar PV:</span> Sized to offset load + charge batteries during cheap hours</li>
                        <li>• <span className="text-white">EV Charging:</span> Level 2, DCFC, or HPC infrastructure recommendations</li>
                        <li>• <span className="text-white">Generators:</span> Backup power sizing for critical loads during outages</li>
                        <li>• <span className="text-white">Grid Services:</span> Frequency regulation, demand response revenue streams</li>
                      </ul>
                      <div className="mt-3 text-xs text-cyan-300">💡 Solar + Storage can double your savings vs. storage alone!</div>
                    </div>
                  )}
                </div>

                {/* Output 3: Full Financial */}
                <div className="group relative">
                  <div className="hidden lg:block absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-l from-emerald-500 to-transparent" style={{ transform: 'translateX(-100%)' }} />
                  <div 
                    onClick={() => setActiveInfoPopup(activeInfoPopup === 'financial' ? null : 'financial')}
                    className="relative bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/40 cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(16,185,129,0.5))' }}>💰</span>
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">Complete Quote</h4>
                        <p className="text-purple-300/70 text-sm">ROI, payback, NPV, 30% ITC, exportable reports</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-emerald-400/60 text-xs">Click to learn more</div>
                  </div>
                  {/* Popup for Financial */}
                  {activeInfoPopup === 'financial' && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-purple-950/95 backdrop-blur-xl rounded-xl p-5 border border-emerald-500/50 shadow-2xl">
                      <h5 className="text-amber-400 font-bold mb-2">Bank-Ready Financial Analysis</h5>
                      <p className="text-purple-200 text-sm mb-3">Professional-grade financials you can take to investors:</p>
                      <ul className="text-purple-300/80 text-sm space-y-2">
                        <li>• <span className="text-white">Simple Payback:</span> Years to recover investment from savings</li>
                        <li>• <span className="text-white">NPV & IRR:</span> Net present value and internal rate of return</li>
                        <li>• <span className="text-white">30% Federal ITC:</span> Investment Tax Credit automatically included</li>
                        <li>• <span className="text-white">Revenue Stacking:</span> Peak shaving + TOU + grid services combined</li>
                        <li>• <span className="text-white">Export:</span> Word, Excel, or PDF reports for financing applications</li>
                      </ul>
                      <div className="mt-3 text-xs text-amber-300">📊 DSCR, MACRS depreciation, and 25-year cash flows included!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Value Proposition Cards - Enhanced with animated illustrations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* No Guesswork - with visual diagram */}
            <div 
              className="group bg-gradient-to-br from-purple-900/80 to-indigo-950/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 text-center hover:border-purple-400/40 transition-all hover:-translate-y-1"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            >
              {/* Animated Icon Container */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                {/* Animated rings */}
                <div className="absolute inset-0 border-2 border-dashed border-purple-500/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
                <div className="absolute inset-2 border border-purple-400/20 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                {/* Center icon with glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-purple-500/30 rounded-full blur-lg group-hover:bg-purple-400/40 transition-colors" />
                    <span className="relative text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.5))' }}>🎯</span>
                  </div>
                </div>
                {/* Mini data points around */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                <div className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Zero Guesswork</h4>
              <p className="text-purple-300/70 text-sm leading-relaxed mb-4">
                Industry-tested formulas from ASHRAE, CBECS, and Energy Star calculate exactly what you need.
              </p>
              {/* Visual detail - mini formula */}
              <div className="text-xs text-purple-400/60 font-mono bg-purple-900/50 rounded-lg py-2 px-3 inline-block">
                Peak kW × Duration = Optimal Size
              </div>
            </div>

            {/* No Vendor Calls - with phone/time visual */}
            <div 
              className="group bg-gradient-to-br from-purple-900/80 to-indigo-950/80 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20 text-center hover:border-amber-400/40 transition-all hover:-translate-y-1"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            >
              {/* Animated Icon Container */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                {/* Background glow */}
                <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-pulse" />
                {/* Crossed out phone animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-amber-500/30 rounded-full blur-lg group-hover:bg-amber-400/40 transition-colors" />
                    <span className="relative text-5xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(251,191,36,0.5))' }}>📞</span>
                    {/* X mark overlay - animated */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-0.5 bg-red-500 rotate-45 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
                {/* Time saved indicators */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Save 10+ hours
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Skip the Vendor Calls</h4>
              <p className="text-purple-300/70 text-sm leading-relaxed mb-4">
                Get accurate quotes instantly. Real market pricing from NREL benchmarks, not sales tactics.
              </p>
              {/* Comparison bar */}
              <div className="flex items-center justify-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500/60 rounded-full" />
                  <span className="text-red-300/70 line-through">5 vendor calls</span>
                </div>
                <span className="text-purple-400">→</span>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-emerald-300">1 Merlin quote</span>
                </div>
              </div>
            </div>

            {/* Maximum Savings - with chart animation */}
            <div 
              className="group bg-gradient-to-br from-purple-900/80 to-indigo-950/80 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 text-center hover:border-emerald-400/40 transition-all hover:-translate-y-1"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            >
              {/* Animated Chart Visual */}
              <div className="relative w-24 h-24 mx-auto mb-5">
                {/* Background glow */}
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse" />
                {/* Mini bar chart rising animation */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-12">
                  <div className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm animate-pulse" style={{ height: '40%', animationDelay: '0s' }} />
                  <div className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }} />
                  <div className="w-3 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm animate-pulse" style={{ height: '100%', animationDelay: '0.4s' }} />
                </div>
                {/* Up arrow */}
                <div className="absolute top-2 right-2 text-emerald-400 animate-bounce" style={{ animationDuration: '1.5s' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                {/* $ indicator */}
                <div className="absolute top-2 left-2 text-amber-400 font-bold text-lg">$</div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Maximum Savings</h4>
              <p className="text-purple-300/70 text-sm leading-relaxed mb-4">
                AI optimizes peak shaving, demand reduction, and TOU arbitrage to maximize ROI.
              </p>
              {/* Savings breakdown mini */}
              <div className="flex justify-center gap-2 text-xs">
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">Peak Shaving</span>
                <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">TOU</span>
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">Grid</span>
              </div>
            </div>
          </div>

          {/* Stats Bar - Enhanced with animated counters and icons */}
          <div 
            className="relative bg-gradient-to-r from-purple-900/60 via-purple-900/40 to-purple-900/60 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 mb-16 overflow-hidden"
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
          >
            {/* Animated background shimmer */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent"
              style={{ animation: 'shimmer 4s ease-in-out infinite' }}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
              <div className="group">
                <div className="flex justify-center mb-2">
                  <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">🏢</span>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-2 group-hover:scale-110 transition-transform">30+</div>
                <div className="text-purple-300/70 text-sm">Industry Templates</div>
              </div>
              <div className="group">
                <div className="flex justify-center mb-2">
                  <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">💰</span>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 mb-2 group-hover:scale-110 transition-transform">$2M+</div>
                <div className="text-purple-300/70 text-sm">Savings Calculated</div>
              </div>
              <div className="group">
                <div className="flex justify-center mb-2">
                  <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">⚡</span>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 mb-2 group-hover:scale-110 transition-transform">5 min</div>
                <div className="text-purple-300/70 text-sm">Average Quote Time</div>
              </div>
              <div className="group">
                <div className="flex justify-center mb-2">
                  <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">🎁</span>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500 mb-2 group-hover:scale-110 transition-transform">30%</div>
                <div className="text-purple-300/70 text-sm">Federal Tax Credit</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button 
              onClick={() => setShowSmartWizard(true)}
              className="group relative inline-flex items-center gap-4 px-12 py-5 rounded-full font-bold text-xl transition-all hover:scale-105 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
                boxShadow: '0 0 50px rgba(139,92,246,0.5), 0 10px 40px rgba(0,0,0,0.3)'
              }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <img src={merlinImage} alt="" className="w-8 h-8 relative z-10" />
              <span className="text-white relative z-10">Start SmartWizard</span>
              <span className="text-amber-300 relative z-10 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <p className="text-purple-300/50 mt-4 text-sm">No signup required • Get your quote in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* ========== REAL-WORLD SUCCESS STORIES ========== */}
      <section className="py-20 px-4 md:px-8 lg:px-12 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real-World <span className="text-amber-400">Success Stories</span>
            </h3>
            <p className="text-purple-200/70 text-lg">See how businesses like yours are saving with Merlin</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Center */}
            <div 
              className="group cursor-pointer"
              onClick={() => setShowSmartWizard(true)}
            >
              <div 
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={carWashImage} 
                    alt="Car Wash Success Story" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/50 to-transparent" />
                  
                  {/* Savings Badge */}
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $127K/yr savings
                  </div>
                </div>
                
                {/* Content */}
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
                  <h4 className="text-xl font-bold text-white mb-2">Multi-Bay Car Wash</h4>
                  <p className="text-purple-200/70 text-sm mb-4">500 kW peak demand • 32% energy savings</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-amber-400">1.2yr</div>
                      <div className="text-xs text-purple-300">Payback</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-cyan-400">840%</div>
                      <div className="text-xs text-purple-300">ROI</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-white">20 MWh</div>
                      <div className="text-xs text-purple-300">System</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300">Click for similar quote</span>
                    <span className="text-amber-400 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel */}
            <div 
              className="group cursor-pointer"
              onClick={() => setShowSmartWizard(true)}
            >
              <div 
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={hotelImage} 
                    alt="Luxury Hotel" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/50 to-transparent" />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $89K/yr savings
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
                  <h4 className="text-xl font-bold text-white mb-2">Luxury Hotel</h4>
                  <p className="text-purple-200/70 text-sm mb-4">350 rooms • High HVAC demand</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-amber-400">3.2yr</div>
                      <div className="text-xs text-purple-300">Payback</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-cyan-400">312%</div>
                      <div className="text-xs text-purple-300">ROI</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-white">1.5 MWh</div>
                      <div className="text-xs text-purple-300">System</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300">Click for similar quote</span>
                    <span className="text-amber-400 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>

            {/* EV Charging */}
            <div 
              className="group cursor-pointer"
              onClick={() => setShowSmartWizard(true)}
            >
              <div 
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={evChargingStationImage} 
                    alt="EV Charging Hub" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-purple-900/50 to-transparent" />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $215K/yr savings
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
                  <h4 className="text-xl font-bold text-white mb-2">EV Charging Hub</h4>
                  <p className="text-purple-200/70 text-sm mb-4">12 DCFC chargers • High demand spikes</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-amber-400">2.8yr</div>
                      <div className="text-xs text-purple-300">Payback</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-cyan-400">428%</div>
                      <div className="text-xs text-purple-300">ROI</div>
                    </div>
                    <div className="text-center bg-white/10 rounded-xl py-2">
                      <div className="text-lg font-bold text-white">3 MWh</div>
                      <div className="text-xs text-purple-300">System</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300">Click for similar quote</span>
                    <span className="text-amber-400 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW MERLIN WORKS POPUP ========== */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHowItWorks(false)}>
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
                <h2 className="text-3xl font-bold text-white">How Merlin Works</h2>
              </div>
              <button onClick={() => setShowHowItWorks(false)} className="text-purple-300 hover:text-white text-2xl">×</button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Tell Us About Your Business</h3>
                  <p className="text-purple-200/70">Answer a few quick questions about your facility, energy usage, and goals.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Merlin Analyzes Your Needs</h3>
                  <p className="text-purple-200/70">Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the optimal energy solution.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Get Your Custom Quote</h3>
                  <p className="text-purple-200/70">Receive a detailed, bank-ready proposal with ROI projections and equipment specs—all with traceable sources.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Start Saving Money</h3>
                  <p className="text-purple-200/70">Connect with certified installers and start cutting your energy costs.</p>
                </div>
              </div>
            </div>
            
            {/* Industry Compliance Statement */}
            <div className="mt-6 pt-4 border-t border-purple-500/30">
              <MethodologyStatement 
                variant="compact" 
                darkMode={true}
                message="NREL ATB 2024 & DOE StoreFAST aligned"
              />
            </div>
            
            <button 
              onClick={() => { setShowHowItWorks(false); setShowSmartWizard(true); }}
              className="w-full mt-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-900 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              🪄 Start My Free Quote →
            </button>
          </div>
        </div>
      )}

      {/* ========== MERLIN ANIMATION/VIDEO MODAL - DYNAMIC FLOW ========== */}
      {showMerlinVideo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowMerlinVideo(false)}>
          <div 
            className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-indigo-950 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - More Compact */}
            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={merlinImage} alt="Merlin" className="w-12 h-12 drop-shadow-xl animate-float" />
                <div>
                  <h2 className="text-xl font-bold text-white">The Power of Merlin AI</h2>
                  <p className="text-purple-300/60 text-xs">Your energy savings journey</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMerlinVideo(false)} 
                className="w-8 h-8 bg-purple-800/50 hover:bg-purple-700/50 rounded-full flex items-center justify-center text-white text-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* ANIMATED FLOW - Inputs → Merlin → BIG SAVINGS */}
            <div className="p-6">
              
              {/* Flow Visualization */}
              <div className="relative mb-8">
                {/* Connection Line - Animated */}
                <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 hidden md:block">
                  <div className="absolute inset-0 bg-purple-900 rounded-full" />
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-amber-500 to-emerald-500 rounded-full"
                    style={{
                      animation: 'flowLine 3s ease-in-out infinite',
                      width: '100%'
                    }}
                  />
                </div>
                
                {/* Three Stage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  
                  {/* STAGE 1: YOUR INPUTS */}
                  <div 
                    className="bg-gradient-to-br from-purple-800/60 to-purple-900/60 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/40 transform transition-all hover:scale-[1.02]"
                    style={{ animation: 'slideInLeft 0.5s ease-out' }}
                  >
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-600/50 mb-3">
                        <span className="text-3xl">📊</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">Your Inputs</h3>
                    </div>
                    
                    {/* Animated Input Items */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-purple-900/50 rounded-lg" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.2s both' }}>
                        <span className="text-lg">🏢</span>
                        <div>
                          <div className="text-xs text-purple-300">Industry</div>
                          <div className="text-sm text-white font-medium">Hotel • 350 rooms</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-900/50 rounded-lg" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.4s both' }}>
                        <span className="text-lg">📍</span>
                        <div>
                          <div className="text-xs text-purple-300">Location</div>
                          <div className="text-sm text-white font-medium">California • $0.24/kWh</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-900/50 rounded-lg" style={{ animation: 'fadeSlideIn 0.6s ease-out 0.6s both' }}>
                        <span className="text-lg">🎯</span>
                        <div>
                          <div className="text-xs text-purple-300">Goals</div>
                          <div className="text-sm text-white font-medium">Cost savings + EV charging</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow indicator (mobile) */}
                    <div className="md:hidden flex justify-center mt-4 text-purple-400 animate-bounce">
                      <span className="text-2xl">↓</span>
                    </div>
                  </div>
                  
                  {/* STAGE 2: MERLIN MAGIC - Central, highlighted */}
                  <div 
                    className="bg-gradient-to-br from-amber-500/20 via-amber-600/15 to-orange-600/20 backdrop-blur-xl rounded-2xl p-5 border-2 border-amber-500/50 transform transition-all hover:scale-[1.02] relative"
                    style={{ 
                      animation: 'pulseGlow 2s ease-in-out infinite',
                      boxShadow: '0 0 40px rgba(251,191,36,0.2)'
                    }}
                  >
                    {/* Processing Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-purple-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-900 rounded-full animate-pulse" />
                      AI Processing
                    </div>
                    
                    <div className="text-center mb-4 pt-2">
                      <div className="relative inline-block">
                        <img src={merlinImage} alt="Merlin" className="w-20 h-20 animate-float drop-shadow-2xl" />
                        {/* Sparkles around Merlin */}
                        <div className="absolute -top-2 -left-2 text-lg animate-ping" style={{ animationDuration: '1.5s' }}>✨</div>
                        <div className="absolute -top-1 -right-3 text-sm animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>⚡</div>
                        <div className="absolute -bottom-1 -left-3 text-sm animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.3s' }}>🔮</div>
                      </div>
                      <h3 className="text-lg font-bold text-amber-400 mt-2">Merlin Analyzes</h3>
                    </div>
                    
                    {/* Processing Indicators */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-purple-950/40 rounded-lg">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white">Industry power profile matched</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-950/40 rounded-lg">
                        <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="text-xs text-white">NREL ATB 2024 pricing applied</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-950/40 rounded-lg">
                        <div className="w-4 h-4 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        <span className="text-xs text-white">Optimal configuration found!</span>
                      </div>
                    </div>
                    
                    {/* Arrow indicator (mobile) */}
                    <div className="md:hidden flex justify-center mt-4 text-amber-400 animate-bounce">
                      <span className="text-2xl">↓</span>
                    </div>
                  </div>
                  
                  {/* STAGE 3: BIG SAVINGS - Most emphasized */}
                  <div 
                    className="bg-gradient-to-br from-emerald-600/30 via-emerald-700/20 to-green-800/30 backdrop-blur-xl rounded-2xl p-5 border-2 border-emerald-500/60 transform transition-all hover:scale-[1.02] relative overflow-hidden"
                    style={{ 
                      animation: 'slideInRight 0.5s ease-out 0.3s both',
                      boxShadow: '0 0 50px rgba(16,185,129,0.25)'
                    }}
                  >
                    {/* Shimmer effect */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                      style={{ animation: 'shimmer 2s ease-in-out infinite' }}
                    />
                    
                    <div className="text-center mb-4 relative z-10">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/40 mb-3">
                        <span className="text-3xl">💰</span>
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">Your Savings</h3>
                    </div>
                    
                    {/* BIG SAVINGS NUMBERS - Animated counter effect */}
                    <div className="space-y-3 relative z-10">
                      <div className="text-center p-3 bg-purple-950/50 rounded-xl">
                        <div 
                          className="text-3xl md:text-4xl font-black text-amber-400"
                          style={{ textShadow: '0 0 20px rgba(251,191,36,0.5)' }}
                        >
                          $127,500
                        </div>
                        <div className="text-xs text-emerald-300/80">Annual Savings</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 bg-purple-950/50 rounded-lg">
                          <div className="text-xl font-bold text-purple-300">2.1 yrs</div>
                          <div className="text-xs text-purple-300/60">Payback</div>
                        </div>
                        <div className="text-center p-2 bg-purple-950/50 rounded-lg">
                          <div className="text-xl font-bold text-cyan-400">485%</div>
                          <div className="text-xs text-cyan-300/60">25-yr ROI</div>
                        </div>
                      </div>
                      
                      {/* Tax Credit Badge */}
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 py-2 rounded-full">
                        <span>✓</span> 30% Federal Tax Credit Included
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* System Configuration Preview */}
              <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-purple-500/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔋</div>
                      <div className="text-lg font-bold text-white">2.0 MW</div>
                      <div className="text-xs text-purple-300/60">Battery</div>
                    </div>
                    <div className="text-purple-400">+</div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-lg font-bold text-white">500 kWp</div>
                      <div className="text-xs text-purple-300/60">Solar</div>
                    </div>
                    <div className="text-purple-400">+</div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="text-lg font-bold text-white">8 Ports</div>
                      <div className="text-xs text-purple-300/60">EV Charging</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-300/60">Net System Cost</div>
                    <div className="text-xl font-bold text-white">$485,000</div>
                    <div className="text-xs text-emerald-400">After 30% ITC</div>
                  </div>
                </div>
              </div>
              
              {/* CTA - Larger, more prominent */}
              <button 
                onClick={() => { setShowMerlinVideo(false); setShowSmartWizard(true); }}
                className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-900 py-5 rounded-full font-bold text-xl hover:shadow-xl hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-3 group"
              >
                <span className="text-2xl group-hover:animate-bounce">🪄</span>
                <span>Get Your Personalized Quote</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
              <p className="text-center text-purple-300/40 text-sm mt-3">No signup required • Results in 5 minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== USE CASE DETAIL POPUP ========== */}
      {showUseCaseDetail && selectedHeroUseCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUseCaseDetail(false)}>
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            {/* Hero Image */}
            <div className="relative h-48">
              <img src={selectedHeroUseCase.image} alt={selectedHeroUseCase.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent" />
              <button 
                onClick={() => setShowUseCaseDetail(false)} 
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl transition-colors"
              >
                ×
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="bg-amber-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold">{selectedHeroUseCase.systemSize}</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6">{selectedHeroUseCase.name}</h2>
              
              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-800/30 rounded-2xl p-5 text-center border border-purple-500/20">
                  <div className="text-4xl font-black text-amber-400 mb-1">{selectedHeroUseCase.savings}</div>
                  <div className="text-sm text-purple-300/70">Annual Savings</div>
                </div>
                <div className="bg-purple-800/30 rounded-2xl p-5 text-center border border-purple-500/20">
                  <div className="text-4xl font-black text-purple-300 mb-1">{selectedHeroUseCase.payback}</div>
                  <div className="text-sm text-purple-300/70">Payback Period</div>
                </div>
                <div className="bg-purple-800/30 rounded-2xl p-5 text-center border border-purple-500/20">
                  <div className="text-4xl font-black text-cyan-400 mb-1">{selectedHeroUseCase.roi}</div>
                  <div className="text-sm text-purple-300/70">25-Year ROI</div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-purple-200/80 mb-8 leading-relaxed">
                This {selectedHeroUseCase.name.toLowerCase()} installation demonstrates the power of battery storage for energy cost reduction. 
                With a {selectedHeroUseCase.systemSize} system, businesses in this sector typically see dramatic reductions in peak demand charges 
                and can take advantage of time-of-use rate arbitrage.
              </p>
              
              {/* CTA */}
              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowUseCaseDetail(false); setShowSmartWizard(true); }}
                  className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-900 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  🪄 Get a Quote Like This
                </button>
                <button 
                  onClick={() => setShowUseCaseDetail(false)}
                  className="px-6 py-4 border border-purple-400/50 text-purple-200 rounded-full font-semibold hover:bg-purple-800/30 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* TrueQuote™ Marketing Modal */}
      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        onGetQuote={() => {
          setShowTrueQuoteModal(false);
          setShowSmartWizard(true);
        }}
      />
    </>
  );
}