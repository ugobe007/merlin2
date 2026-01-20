/**
 * CAR WASH ENERGY - White Label Vertical
 * ======================================
 * 
 * Landing page for carwashenergy.com
 * Targeted at car wash owners looking to reduce energy costs with battery storage
 * 
 * Features:
 * - Simple calculator: # bays, cars/day, state → instant savings
 * - Lead capture form
 * - Merlin-branded but car-wash focused messaging
 * 
 * Uses: calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 * 
 * REFACTORED Dec 2025: Now uses WizardV6 with car-wash industry selection
 * instead of separate CarWashWizard component (4K+ lines of duplicate code removed)
 */

import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, CheckCircle, ArrowRight, Phone, Sun, TrendingDown, Shield, Sparkles, Droplets, Car, X, MapPin, Loader2, ChevronDown, Zap, Check } from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { calculateCarWashPowerSimple, type CarWashTypeSimple } from '@/services/useCasePowerCalculations';
import { supabase } from '@/services/supabaseClient';
import { useCarWashLimits } from '@/services/uiConfigService';
import { useUtilityRates } from '@/hooks/useUtilityRates';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import carWashImage from '@/assets/images/car_wash_1.jpg';
import carWashTunnel from '@/assets/images/car_wash_tunnel.jpg';
import carWashRobot from '@/assets/images/car_wash_robot.jpg';
import carWashPitStop from '@/assets/images/Car_Wash_PitStop.jpg';
import carWashPitStop1 from '@/assets/images/Car_Wash_PitStop1.jpg';
import carWashPitStop2 from '@/assets/images/Car_Wash_PitStop2.jpg';
import carWashPitStop3 from '@/assets/images/Car_Wash_PitStop3.jpg';
import carWashPitStop4 from '@/assets/images/Car_Wash_PitStop4.jpg';
import carWashPitStop5 from '@/assets/images/Car_Wash_PitStop5.jpg';
import carWashPreen from '@/assets/images/Car_Wash_Preen.jpg';
// V6 Wizard (Updated Dec 2025)
import WizardV6 from '@/components/wizard/v6/WizardV6';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';

// ============================================
// TYPES
// ============================================

interface CarWashInputs {
  numberOfBays: number;
  carsPerDay: number;
  state: string;
  zipCode: string;
  includesVacuums: boolean;
  includesDryers: boolean;
  currentMonthlyBill: number;
}

interface LeadInfo {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  notes: string;
}

// ============================================
// CONSTANTS (UI display - calculations use SSOT)
// ============================================

// Peak demand typically 4-6 hours during busy periods
const PEAK_HOURS = 5;

// State electricity rates (for UI and calculation)
const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'Alabama': { rate: 0.13, demandCharge: 12 },
  'Alaska': { rate: 0.22, demandCharge: 15 },
  'Arizona': { rate: 0.13, demandCharge: 18 },
  'Arkansas': { rate: 0.10, demandCharge: 11 },
  'California': { rate: 0.22, demandCharge: 25 },
  'Colorado': { rate: 0.12, demandCharge: 14 },
  'Connecticut': { rate: 0.21, demandCharge: 20 },
  'Delaware': { rate: 0.12, demandCharge: 13 },
  'Florida': { rate: 0.14, demandCharge: 12 },
  'Georgia': { rate: 0.12, demandCharge: 13 },
  'Hawaii': { rate: 0.33, demandCharge: 30 },
  'Idaho': { rate: 0.10, demandCharge: 10 },
  'Illinois': { rate: 0.13, demandCharge: 14 },
  'Indiana': { rate: 0.12, demandCharge: 12 },
  'Iowa': { rate: 0.11, demandCharge: 11 },
  'Kansas': { rate: 0.12, demandCharge: 13 },
  'Kentucky': { rate: 0.11, demandCharge: 11 },
  'Louisiana': { rate: 0.10, demandCharge: 12 },
  'Maine': { rate: 0.17, demandCharge: 15 },
  'Maryland': { rate: 0.14, demandCharge: 15 },
  'Massachusetts': { rate: 0.22, demandCharge: 22 },
  'Michigan': { rate: 0.16, demandCharge: 16 },
  'Minnesota': { rate: 0.13, demandCharge: 13 },
  'Mississippi': { rate: 0.11, demandCharge: 11 },
  'Missouri': { rate: 0.11, demandCharge: 12 },
  'Montana': { rate: 0.11, demandCharge: 10 },
  'Nebraska': { rate: 0.10, demandCharge: 11 },
  'Nevada': { rate: 0.11, demandCharge: 16 },
  'New Hampshire': { rate: 0.19, demandCharge: 18 },
  'New Jersey': { rate: 0.16, demandCharge: 17 },
  'New Mexico': { rate: 0.12, demandCharge: 13 },
  'New York': { rate: 0.20, demandCharge: 22 },
  'North Carolina': { rate: 0.11, demandCharge: 12 },
  'North Dakota': { rate: 0.10, demandCharge: 10 },
  'Ohio': { rate: 0.12, demandCharge: 13 },
  'Oklahoma': { rate: 0.10, demandCharge: 11 },
  'Oregon': { rate: 0.11, demandCharge: 11 },
  'Pennsylvania': { rate: 0.14, demandCharge: 14 },
  'Rhode Island': { rate: 0.21, demandCharge: 20 },
  'South Carolina': { rate: 0.12, demandCharge: 12 },
  'South Dakota': { rate: 0.11, demandCharge: 10 },
  'Tennessee': { rate: 0.11, demandCharge: 11 },
  'Texas': { rate: 0.12, demandCharge: 15 },
  'Utah': { rate: 0.10, demandCharge: 12 },
  'Vermont': { rate: 0.18, demandCharge: 16 },
  'Virginia': { rate: 0.12, demandCharge: 13 },
  'Washington': { rate: 0.10, demandCharge: 10 },
  'West Virginia': { rate: 0.11, demandCharge: 11 },
  'Wisconsin': { rate: 0.13, demandCharge: 13 },
  'Wyoming': { rate: 0.10, demandCharge: 10 },
  'Other': { rate: 0.13, demandCharge: 15 },
};

// ============================================
// CALCULATOR LOGIC (uses SSOT from useCasePowerCalculations)
// ============================================

function calculateCarWashPower(inputs: CarWashInputs): { peakKW: number; dailyKWh: number } {
  const { numberOfBays, carsPerDay, state, includesVacuums, includesDryers } = inputs;
  
  const stateData = STATE_RATES[state] || STATE_RATES['Other'];
  
  // Call SSOT calculator - map to 'tunnel' type which is closest to typical landing page scenario
  const result = calculateCarWashPowerSimple({
    bays: numberOfBays,
    washType: 'tunnel' as CarWashTypeSimple, // Default to tunnel for landing page
    hasVacuums: includesVacuums,
    hasDryers: includesDryers,
    carsPerDay,
    electricityRate: stateData.rate,
  });
  
  // Calculate dailyKWh from peak hours operation
  const dailyKWh = (result.peakKW * PEAK_HOURS) + (result.peakKW * 0.3 * (12 - PEAK_HOURS));
  
  return { peakKW: result.peakKW, dailyKWh: Math.round(dailyKWh) };
}

// ============================================
// IMAGE CAROUSEL COMPONENT
// ============================================

const CAROUSEL_IMAGES = [
  { src: carWashPitStop, alt: 'PitStop Car Wash', caption: 'Professional Service', subcaption: 'Industry-leading results' },
  { src: carWashPitStop1, alt: 'PitStop Express Bay', caption: 'Express Tunnel', subcaption: 'High-volume efficiency' },
  { src: carWashPitStop2, alt: 'PitStop Premium Service', caption: 'Premium Detailing', subcaption: 'Superior customer experience' },
  { src: carWashPitStop3, alt: 'PitStop Wash System', caption: 'Advanced Equipment', subcaption: 'Energy-intensive operations' },
  { src: carWashPitStop4, alt: 'PitStop Operations', caption: 'Streamlined Process', subcaption: 'Optimized for savings' },
  { src: carWashPitStop5, alt: 'PitStop Full Service', caption: 'Full Service Wash', subcaption: 'Complete car care' },
  { src: carWashPreen, alt: 'Preen Car Wash', caption: 'Modern Facility', subcaption: 'Next-gen technology' },
  { src: carWashTunnel, alt: 'Modern Car Wash Tunnel', caption: 'High-Tech Equipment', subcaption: 'Energy-intensive operations' },
  { src: carWashRobot, alt: 'Car Being Washed', caption: 'Premium Service', subcaption: 'Consistent quality results' },
  { src: carWashImage, alt: 'Car Wash Interior', caption: 'Efficient Operations', subcaption: 'Optimized for savings' },
];

function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  const currentImage = CAROUSEL_IMAGES[currentIndex];
  
  return (
    <div className="relative w-full max-w-xl mx-auto mb-6">
      {/* Main Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 border border-cyan-400/20">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent z-10" />
        <img 
          src={currentImage.src} 
          alt={currentImage.alt} 
          className="w-full h-80 object-cover transition-opacity duration-500"
        />
        {/* Overlay badge */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
            <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
            <div className="flex-1">
              <p className="text-white font-bold">Powered by Merlin</p>
              <p className="text-cyan-300 text-sm">AI-Optimized Battery Storage</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{currentImage.caption}</p>
              <p className="text-cyan-300 text-xs">{currentImage.subcaption}</p>
            </div>
          </div>
        </div>
        {/* Energy consumption callout */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-amber-500/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs font-bold text-amber-900">PEAK DEMAND</p>
            <p className="text-lg font-black text-white">100-250 kW</p>
          </div>
        </div>
      </div>
      
      {/* Carousel Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-cyan-400 w-8' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CarWashEnergy() {

  // Database-driven UI limits
  const { limits, loading: limitsLoading } = useCarWashLimits();
  
  // Calculator inputs (defaults updated from database)
  // NOTE: Default to California - user can change via ZIP lookup or state selection
  const [inputs, setInputs] = useState<CarWashInputs>({
    numberOfBays: 4,
    carsPerDay: 150,
    state: 'California',
    zipCode: '',
    includesVacuums: true,
    includesDryers: true,
    currentMonthlyBill: 5000,
  });
  
  // Utility rate lookup by ZIP code
  const { 
    rate: utilityRate, 
    demandCharge: utilityDemandCharge,
    utilityName,
    state: detectedState,
    hasTOU,
    savingsScore,
    savingsRating,
    savingsReasons,
    loading: ratesLoading 
  } = useUtilityRates(inputs.zipCode);
  
  // Update state when ZIP code lookup returns
  useEffect(() => {
    if (detectedState && inputs.zipCode.length >= 5) {
      setInputs(prev => ({ ...prev, state: detectedState }));
    }
  }, [detectedState, inputs.zipCode]);
  
  // Update defaults when limits load from database
  useEffect(() => {
    if (limits) {
      setInputs(prev => ({
        ...prev,
        numberOfBays: limits.numberOfBays?.default ?? prev.numberOfBays,
        carsPerDay: limits.carsPerDay?.default ?? prev.carsPerDay,
        currentMonthlyBill: limits.currentMonthlyBill?.default ?? prev.currentMonthlyBill,
      }));
    }
  }, [limits]);
  
  // Quote result
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Hero carousel state (shared between mobile and desktop views)
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  
  // Auto-rotate hero images
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  // Lead capture
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  // Wizard mode
  const [showWizard, setShowWizard] = useState(false);
  
  // TrueQuote Modal
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  
  // Hero inline estimate - calculated from inputs (Dec 2025 - removed popup)
  const heroEstimate = React.useMemo(() => {
    // Car washes: average $10,000-12,000 savings per bay per year
    const bays = inputs.numberOfBays || 1;
    const savingsPerBay = 11000; // Average across wash types
    const savings = savingsPerBay * bays;
    const payback = 3.0; // Average payback
    return { savings, payback, bays };
  }, [inputs.numberOfBays]);
  
  // Calculate quote when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCalculate();
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);
  
  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const { peakKW, dailyKWh } = calculateCarWashPower(inputs);
      
      // Use ZIP-based utility rates if available, fallback to state rates
      const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
      const effectiveRate = utilityRate ?? stateData.rate;
      const effectiveDemandCharge = utilityDemandCharge ?? stateData.demandCharge;
      
      // Size battery: 0.50 ratio (arbitrage - balanced cost savings + backup capability)
      // Ratio per SSOT standards: peak_shaving=0.40, arbitrage=0.50, resilience=0.70, microgrid=1.00
      const bessRatio = 0.50; // Arbitrage use case (cost optimization)
      const storageSizeMW = (peakKW * bessRatio) / 1000;
      const durationHours = 2; // 2 hour duration for peak shaving
      
      // Use unified calculator with ZIP-based rates
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW), // Min 100 kW
        durationHours,
        location: inputs.state,
        electricityRate: effectiveRate,
        useCase: 'car-wash',
      });
      
      setQuoteResult(result);
      setHasCalculated(true);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Save to Supabase leads table
      // Note: 'leads' table columns: id, name, email, company, phone, source, format, created_at
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: leadInfo.ownerName,
          email: leadInfo.email,
          company: leadInfo.businessName,
          phone: leadInfo.phone,
          source: 'carwash_vertical',
          format: 'consultation',
        }]);
      
      if (error) {
        console.error('Lead insert error:', error);
        // Continue anyway - lead capture shouldn't block UX
      }
      
      setLeadSubmitted(true);
      
    } catch (error: any) {
      console.error('Lead submission error:', error);
      // Don't show error to user - lead capture is secondary to UX
      setLeadSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
  const { peakKW } = calculateCarWashPower(inputs);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-gradient-to-r from-slate-900/90 via-purple-900/30 to-slate-800/90 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Back to Merlin Button */}
          <a 
            href="/"
            className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors group mr-4"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
            <span className="hidden sm:inline text-sm font-medium">Back to Merlin</span>
          </a>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CarWash<span className="text-cyan-400">Energy</span></h1>
              <p className="text-xs text-cyan-300/70">Battery Storage Solutions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="#calculator"
              className="hidden md:block text-cyan-300 hover:text-white text-sm font-medium transition-colors"
            >
              Calculator
            </a>
            <a 
              href="tel:+18005551234"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 px-4 py-2 rounded-full transition-all shadow-lg shadow-purple-500/20"
            >
              <Phone className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">Get Quote</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION - Edge-Bleeding Image Design
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzAwYmNkNCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        {/* Left content - contained */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 border border-purple-400/40 rounded-full px-5 py-2 mb-6 shadow-lg">
                <Car className="w-5 h-5 text-emerald-300" />
                <span className="text-emerald-200 text-sm font-semibold">Car Wash Owners Save 30-50% on Energy</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
                Stop Overpaying for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-emerald-300">Electricity!</span>
              </h1>
              
              <p className="text-xl text-cyan-100/90 mb-8 leading-relaxed">
                High-powered dryers, pumps, and vacuums spike your demand charges. 
                <span className="text-emerald-300 font-medium">Battery storage cuts those peaks by 50%.</span>
              </p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">$0 down financing</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">30% federal tax credit</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">Keep washing during outages</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Calculate My Savings
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {/* Inline savings preview - Dec 2025 */}
              {heroEstimate.bays > 0 && (
                <div className="mt-3 text-center lg:text-left">
                  <p className="text-emerald-300 text-sm font-medium">
                    Est. ${heroEstimate.savings.toLocaleString()}/year savings · {heroEstimate.payback.toFixed(1)} year payback
                  </p>
                </div>
              )}
              
              {/* TrueQuote Badge - Trust signal */}
              <div className="flex items-center gap-2 mt-4">
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="hover:scale-105 transition-transform cursor-pointer"
                >
                  <TrueQuoteBadge size="sm" />
                </button>
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="text-cyan-300 text-xs hover:text-white transition-colors cursor-pointer"
                >
                  Every number sourced →
                </button>
              </div>
              
              {/* Down Arrow Indicator */}
              <div className="mt-8 flex flex-col items-center animate-bounce lg:items-start">
                <p className="text-cyan-300 text-sm font-medium mb-2">See Your Savings Below</p>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Right side placeholder for mobile only - actual content is absolutely positioned */}
            <div className="lg:hidden">
              <ImageCarousel />
              
              {/* Stats cards - mobile only */}
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-emerald-400/30 shadow-lg">
                  <p className="text-3xl font-black text-emerald-400">$47K</p>
                  <p className="text-xs text-emerald-200 font-medium">Avg Savings/Year</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-cyan-400/30 shadow-lg">
                  <p className="text-3xl font-black text-cyan-400">3.2<span className="text-lg">yr</span></p>
                  <p className="text-xs text-cyan-200 font-medium">Payback Period</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-400/30 shadow-lg">
                  <p className="text-3xl font-black text-purple-400">50%</p>
                  <p className="text-xs text-purple-200 font-medium">Demand Savings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ========== RIGHT HALF - Edge-Bleeding Image (Desktop Only) ========== */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
          <div className="relative w-full h-full">
            {CAROUSEL_IMAGES.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === heroImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Full-bleed image - no rounded corners on right edge */}
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient overlay - fades into background on left */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to right, rgba(30,58,138,1) 0%, rgba(30,58,138,0.8) 15%, transparent 40%), linear-gradient(to top, rgba(30,58,138,0.9) 0%, transparent 50%)'
                  }}
                />
              </div>
            ))}
            
            {/* Financial overlay card */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="backdrop-blur-xl rounded-3xl p-6 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
                  <div>
                    <p className="text-white font-bold">Powered by Merlin</p>
                    <p className="text-cyan-300 text-sm">AI-Optimized Battery Storage</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-400">$47K</div>
                    <div className="text-xs text-cyan-300/70 mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center border-x border-white/10 px-2">
                    <div className="text-3xl font-black text-cyan-300">3.2yr</div>
                    <div className="text-xs text-cyan-300/70 mt-1">Payback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-purple-400">50%</div>
                    <div className="text-xs text-cyan-300/70 mt-1">Demand Cut</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Peak demand badge */}
            <div className="absolute top-8 right-8">
              <div className="bg-amber-500/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-amber-900">PEAK DEMAND</p>
                <p className="text-2xl font-black text-white">100-250 kW</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CALCULATOR SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="calculator" className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-400 to-emerald-300">Savings</span>
            </h2>
            <p className="text-cyan-200/70 max-w-2xl mx-auto">
              Enter your car wash details below and see how much you could save with battery storage
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30 shadow-2xl shadow-purple-500/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                Your Car Wash Details
              </h3>
              
              <div className="space-y-6">
                {/* Number of Bays */}
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    {limits?.numberOfBays?.label || 'Number of Wash Bays'}
                  </label>
                  <input
                    type="range"
                    min={limits?.numberOfBays?.min ?? 1}
                    max={limits?.numberOfBays?.max ?? 20}
                    step={limits?.numberOfBays?.step ?? 1}
                    value={inputs.numberOfBays}
                    onChange={(e) => setInputs({ ...inputs, numberOfBays: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-sm text-cyan-300 mt-1">
                    <span>{limits?.numberOfBays?.min ?? 1} bay</span>
                    <span className="font-bold text-lg">{inputs.numberOfBays} bays</span>
                    <span>{limits?.numberOfBays?.max ?? 20} bays</span>
                  </div>
                </div>
                
                {/* Cars per Day */}
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    {limits?.carsPerDay?.label || 'Cars Washed per Day'}
                  </label>
                  <input
                    type="range"
                    min={limits?.carsPerDay?.min ?? 25}
                    max={limits?.carsPerDay?.max ?? 1000}
                    step={limits?.carsPerDay?.step ?? 25}
                    value={inputs.carsPerDay}
                    onChange={(e) => setInputs({ ...inputs, carsPerDay: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-sm text-cyan-300 mt-1">
                    <span>{limits?.carsPerDay?.min ?? 25}</span>
                    <span className="font-bold text-lg">{inputs.carsPerDay} cars/day</span>
                    <span>{limits?.carsPerDay?.max ?? 1000}</span>
                  </div>
                </div>
                
                {/* ZIP Code & Location */}
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    ZIP Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputs.zipCode}
                      onChange={(e) => {
                        const zip = e.target.value.replace(/\D/g, '').substring(0, 5);
                        setInputs({ ...inputs, zipCode: zip });
                      }}
                      placeholder="Enter ZIP code (e.g., 48226)"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      maxLength={5}
                    />
                    {ratesLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 animate-spin" />
                    )}
                  </div>
                  
                  {/* Auto-detected utility info */}
                  {inputs.zipCode.length >= 5 && utilityName && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-400/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-200 text-sm font-medium">Detected Utility</span>
                        {savingsRating && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            savingsRating === 'excellent' ? 'bg-green-500/30 text-green-300' :
                            savingsRating === 'good' ? 'bg-cyan-500/30 text-cyan-300' :
                            savingsRating === 'fair' ? 'bg-amber-500/30 text-amber-300' :
                            'bg-gray-500/30 text-gray-300'
                          }`}>
                            {savingsRating.toUpperCase()} BESS FIT
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold">{utilityName}</p>
                      <p className="text-cyan-300 text-sm">{detectedState}</p>
                      {utilityRate && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 rounded-lg p-2">
                            <span className="text-cyan-400">Rate:</span>
                            <span className="text-white ml-1">${utilityRate.toFixed(3)}/kWh</span>
                          </div>
                          {utilityDemandCharge && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <span className="text-cyan-400">Demand:</span>
                              <span className="text-white ml-1">${utilityDemandCharge}/kW</span>
                            </div>
                          )}
                        </div>
                      )}
                      {hasTOU && (
                        <p className="text-amber-300 text-xs mt-2 flex items-center gap-1.5">
                          <Zap className="w-3 h-3" />
                          Time-of-Use rates available - great for battery arbitrage!
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* State - Falls back to dropdown if no ZIP */}
                {!inputs.zipCode && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">
                      State
                    </label>
                    <select
                      value={inputs.state}
                      onChange={(e) => setInputs({ ...inputs, state: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      {Object.keys(STATE_RATES).map((state) => (
                        <option key={state} value={state} className="bg-slate-800">{state}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Equipment Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={inputs.includesVacuums}
                      onChange={(e) => setInputs({ ...inputs, includesVacuums: e.target.checked })}
                      className="w-5 h-5 rounded accent-cyan-500"
                    />
                    <span className="text-white">Vacuum Stations</span>
                  </label>
                  <label className="flex items-center gap-3 bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={inputs.includesDryers}
                      onChange={(e) => setInputs({ ...inputs, includesDryers: e.target.checked })}
                      className="w-5 h-5 rounded accent-cyan-500"
                    />
                    <span className="text-white">High-Speed Dryers</span>
                  </label>
                </div>
                
                {/* Current Bill */}
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    Current Monthly Electric Bill (optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={inputs.currentMonthlyBill || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setInputs({ ...inputs, currentMonthlyBill: parseInt(val) || 0 });
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder="5000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Card */}
            <div className="relative bg-gradient-to-br from-slate-900/95 via-emerald-900/30 to-slate-900/95 backdrop-blur-xl rounded-3xl p-8 border-2 border-emerald-400/40 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <span className="text-white">Your Estimated Savings</span>
              </h3>
              
              {isCalculating ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
                </div>
              ) : quoteResult ? (
                <div className="space-y-6">
                  {/* Main Savings - HERO NUMBER */}
                  <div className="relative bg-gradient-to-br from-emerald-600/30 via-cyan-600/20 to-emerald-600/30 rounded-2xl p-8 text-center border border-emerald-400/40">
                    <p className="text-sm text-emerald-300 uppercase tracking-[0.2em] mb-3 font-bold">
                      <span className="flex items-center gap-2 justify-center">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        <span>ANNUAL SAVINGS</span>
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </span>
                    </p>
                    <p className="text-6xl md:text-7xl font-black text-emerald-400 drop-shadow-lg">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-white/80 mt-3 text-lg font-medium">per year</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-cyan-400/30">
                      <p className="text-3xl font-bold text-cyan-400">
                        {quoteResult.financials.paybackYears.toFixed(1)}
                      </p>
                      <p className="text-sm text-white/70">Year Payback</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-purple-400/30">
                      <p className="text-3xl font-bold text-purple-400">
                        {Math.round(quoteResult.financials.roi25Year)}%
                      </p>
                      <p className="text-sm text-white/70">25-Year ROI</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-blue-400/30">
                      <p className="text-3xl font-bold text-blue-400">
                        {peakKW} kW
                      </p>
                      <p className="text-sm text-white/70">Battery Size</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-amber-400/30">
                      <p className="text-3xl font-bold text-amber-400">
                        ${Math.round(quoteResult.costs.netCost).toLocaleString()}
                      </p>
                      <p className="text-sm text-white/70">Net Cost (after ITC)</p>
                    </div>
                  </div>
                  
                  {/* TrueQuote™ Attribution - NEW Dec 13, 2025 */}
                  {quoteResult.benchmarkAudit && (
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-xl p-4 border border-emerald-400/30">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-emerald-300">TrueQuote™ Verified</span>
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-xs text-emerald-200/80 mb-2">
                            All costs traceable to {quoteResult.benchmarkAudit.sources?.length || 0} authoritative sources
                          </p>
                          <button
                            onClick={() => setShowTrueQuoteModal(true)}
                            className="text-xs text-emerald-300 hover:text-emerald-200 underline flex items-center gap-1"
                          >
                            View Source Attribution
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* CTA Buttons - Pulsing Effect */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="relative w-full bg-white hover:bg-purple-50 text-purple-700 py-5 rounded-xl font-black text-lg shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-purple-500 hover:border-purple-600 hover:shadow-purple-300/50"
                    >
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      <span>Build My Quote</span>
                      <ArrowRight className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="w-full bg-slate-800/80 hover:bg-slate-700/80 border-2 border-cyan-400/40 hover:border-cyan-300/60 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Talk to an Expert
                    </button>
                  </div>
                  
                  <p className="text-center text-white/50 text-sm">
                    <div className="flex items-center gap-2 text-emerald-200 text-xs">
                      <Check className="w-3 h-3" />
                      <span>Free consultation</span>
                      <span>•</span>
                      <Check className="w-3 h-3" />
                      <span>No obligation</span>
                      <span>•</span>
                      <Check className="w-3 h-3" />
                      <span>Takes 2 minutes</span>
                    </div>
                  </p>
                </div>
              ) : (
                <div className="text-center py-16 text-white/60">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Adjust the sliders to see your savings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS - HIGH CONTRAST DESIGN
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <h2 className="text-4xl font-black text-white text-center mb-4">
            How Battery Storage <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Saves You Money</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">Three powerful ways BESS transforms your energy costs</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 - Cut Peak Demand */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-8 border-2 border-blue-500/40 text-center shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all hover:scale-[1.02] hover:border-blue-400/60">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
                <TrendingDown className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Cut Peak Demand</h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Battery stores cheap energy and releases it during expensive peak hours, <span className="text-cyan-400 font-bold">reducing demand charges by up to 50%</span>
              </p>
            </div>
            
            {/* Step 2 - Backup Power */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-8 border-2 border-emerald-500/40 text-center shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:border-emerald-400/60">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Backup Power</h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Keep washing cars during outages. Battery provides <span className="text-emerald-400 font-bold">instant backup so you never lose a customer</span>
              </p>
            </div>
            
            {/* Step 3 - Solar Ready */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-8 border-2 border-amber-500/40 text-center shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:scale-[1.02] hover:border-amber-400/60">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30">
                <Sun className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Solar Ready</h3>
              <p className="text-gray-300 text-base leading-relaxed">
                Add solar panels later to generate your own power. <span className="text-amber-400 font-bold">Battery stores excess for use anytime</span>
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF - HIGH CONTRAST DESIGN
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 via-purple-950/20 to-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-white text-center mb-4">
            Car Washes <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Saving Big</span>
          </h2>
          <p className="text-center text-gray-400 text-lg mb-12">
            Example savings scenarios based on typical installations
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Example 1 - Phoenix */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-cyan-500/30">
                  4
                </div>
                <div>
                  <p className="font-black text-white text-lg">4-Bay Tunnel Wash</p>
                  <p className="text-cyan-400 font-medium">Phoenix, AZ</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl p-5 text-center mb-4 border-2 border-emerald-500/30">
                <p className="text-4xl font-black text-emerald-400">$38,000</p>
                <p className="text-gray-300 font-medium mt-1">Annual Savings</p>
              </div>
              <div className="flex justify-between text-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <span className="text-gray-400">200 kW system</span>
                <span className="text-cyan-400 font-bold">3.1 yr payback</span>
              </div>
            </div>
            
            {/* Example 2 - Los Angeles */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-6 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/30">
                  8
                </div>
                <div>
                  <p className="font-black text-white text-lg">8-Bay Express Wash</p>
                  <p className="text-emerald-400 font-medium">Los Angeles, CA</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl p-5 text-center mb-4 border-2 border-emerald-500/30">
                <p className="text-4xl font-black text-emerald-400">$67,000</p>
                <p className="text-gray-300 font-medium mt-1">Annual Savings</p>
              </div>
              <div className="flex justify-between text-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <span className="text-gray-400">400 kW system</span>
                <span className="text-emerald-400 font-bold">2.8 yr payback</span>
              </div>
            </div>
            
            {/* Example 3 - Miami */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl p-6 border-2 border-purple-500/40 shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/30">
                  12
                </div>
                <div>
                  <p className="font-black text-white text-lg">12-Bay Full Service</p>
                  <p className="text-purple-400 font-medium">Miami, FL</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 rounded-2xl p-5 text-center mb-4 border-2 border-emerald-500/30">
                <p className="text-4xl font-black text-emerald-400">$89,000</p>
                <p className="text-gray-300 font-medium mt-1">Annual Savings</p>
              </div>
              <div className="flex justify-between text-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <span className="text-gray-400">600 kW system</span>
                <span className="text-purple-400 font-bold">3.4 yr payback</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-cyan-200/70 mb-8">
            Get a free, no-obligation quote in under 5 minutes
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 text-white px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-105 border border-purple-400/30"
          >
            <Sparkles className="w-6 h-6" />
            Start My Free Quote
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-black/30 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <p className="text-white font-bold">CarWash Energy</p>
                <p className="text-cyan-200/50 text-sm">Powered by Merlin Energy</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-cyan-200/70 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="mailto:info@carwashenergy.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-cyan-200/50 text-sm">
            © {new Date().getFullYear()} CarWash Energy. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          LEAD CAPTURE MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-cyan-500/30 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setShowLeadForm(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {!leadSubmitted ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Get Your Free Custom Quote</h3>
                <p className="text-cyan-200/70 mb-6">Our team will analyze your car wash and send a detailed savings report</p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-cyan-200 mb-1">Car Wash Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.businessName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, businessName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Sparkle Car Wash"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyan-200 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.ownerName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, ownerName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-cyan-200 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="john@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-200 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-cyan-200 mb-1">Questions or Comments</label>
                    <textarea
                      value={leadInfo.notes}
                      onChange={(e) => setLeadInfo({ ...leadInfo, notes: e.target.value })}
                      rows={2}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                      placeholder="Anything you'd like us to know?"
                    />
                  </div>
                  
                  {submitError && (
                    <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-red-200 text-sm">
                      {submitError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Get My Free Quote'
                    )}
                  </button>
                </form>
                
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="w-full mt-4 text-cyan-200/70 hover:text-white py-2 transition-colors"
                >
                  Maybe Later
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-cyan-200/70 mb-6">
                  We'll send your detailed quote to {leadInfo.email} within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setShowLeadForm(false);
                    setLeadSubmitted(false);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CAR WASH WIZARD MODAL - Uses WizardV6 with car-wash industry selection
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <div className="fixed inset-0 z-50">
          <WizardV6 />
        </div>
      )}
      
      {/* TrueQuote Modal */}
      <TrueQuoteModal 
        isOpen={showTrueQuoteModal} 
        onClose={() => setShowTrueQuoteModal(false)} 
      />
    </div>
  );
}
