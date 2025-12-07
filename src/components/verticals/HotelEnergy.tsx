/**
 * HOTEL ENERGY PARTNERS - White Label Vertical
 * =============================================
 * 
 * Landing page for hotelenegypartners.com
 * Targeted at hotel owners looking to reduce energy costs and improve guest experience
 * 
 * Features:
 * - Simple calculator: # rooms, amenities, state → instant savings
 * - Lead capture form
 * - Merlin-branded but hospitality-focused messaging
 * 
 * Uses: calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, Zap, DollarSign, CheckCircle, ArrowRight, Phone, 
  Sun, TrendingDown, Shield, Sparkles, X, Battery, ChevronDown,
  Gauge, Building2, Wifi, Car, Coffee, Waves, Dumbbell
} from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { 
  calculateHotelPowerSimple, 
  HOTEL_CLASS_PROFILES_SIMPLE, 
  HOTEL_AMENITY_POWER_SIMPLE,
  type HotelClassSimple,
  type HotelAmenitySimple
} from '@/services/useCasePowerCalculations';
import { supabase } from '@/services/supabaseClient';
import merlinImage from '@/assets/images/new_Merlin.png';
import hotelImage from '@/assets/images/hotel_1.avif';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.webp';
import HotelWizard, { type HotelWizardInputs } from './HotelWizard';

// ============================================
// TYPES
// ============================================

interface HotelInputs {
  numberOfRooms: number;
  hotelClass: HotelClassSimple;
  hasPool: boolean;
  hasRestaurant: boolean;
  hasSpa: boolean;
  hasFitnessCenter: boolean;
  hasEVCharging: boolean;
  state: string;
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
// CONSTANTS (UI display only - calculations use SSOT)
// ============================================

// Hotel class descriptions for UI display
const HOTEL_CLASS_DISPLAY = {
  economy: { name: 'Economy/Budget', description: 'Basic amenities' },
  midscale: { name: 'Midscale', description: 'Standard amenities + breakfast' },
  upscale: { name: 'Upscale', description: 'Full-service hotel' },
  luxury: { name: 'Luxury/Resort', description: 'Premium experience' },
};

// Amenity names for UI display (values from SSOT)
const AMENITY_DISPLAY = {
  pool: { name: 'Pool & Hot Tub' },
  restaurant: { name: 'Restaurant/Kitchen' },
  spa: { name: 'Spa/Sauna' },
  fitness: { name: 'Fitness Center' },
  evCharging: { name: 'EV Charging (8 L2)' },
};

// State electricity rates (for UI and calculation)
const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.20, demandCharge: 22 },
  'Florida': { rate: 0.13, demandCharge: 14 },
  'Texas': { rate: 0.11, demandCharge: 12 },
  'New York': { rate: 0.18, demandCharge: 20 },
  'Nevada': { rate: 0.12, demandCharge: 15 },
  'Arizona': { rate: 0.12, demandCharge: 16 },
  'Colorado': { rate: 0.11, demandCharge: 13 },
  'Hawaii': { rate: 0.35, demandCharge: 30 },
  'Massachusetts': { rate: 0.22, demandCharge: 18 },
  'Washington': { rate: 0.10, demandCharge: 10 },
  'Other': { rate: 0.13, demandCharge: 15 },
};

// ============================================
// IMAGE CAROUSEL COMPONENT
// ============================================

const CAROUSEL_IMAGES = [
  { src: hotelImage, alt: 'Luxury Hotel', caption: 'Premium Hospitality', subcaption: 'Energy costs 6-8% of revenue' },
  { src: evChargingHotelImage, alt: 'Hotel EV Charging', caption: 'Guest Amenities', subcaption: 'EV charging differentiator' },
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
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/30 border border-indigo-400/20">
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
              <p className="text-indigo-300 text-sm">AI-Optimized Battery Storage</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{currentImage.caption}</p>
              <p className="text-indigo-300 text-xs">{currentImage.subcaption}</p>
            </div>
          </div>
        </div>
        {/* Energy cost callout */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-pink-500/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs font-bold text-pink-100">ENERGY COSTS</p>
            <p className="text-lg font-black text-white">6-8% Revenue</p>
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
                ? 'bg-indigo-400 w-8' 
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
// CALCULATOR LOGIC (uses SSOT from useCasePowerCalculations)
// ============================================

function calculateHotelPower(inputs: HotelInputs): { peakKW: number; dailyKWh: number; demandChargeImpact: number } {
  const { numberOfRooms, hotelClass, hasPool, hasRestaurant, hasSpa, hasFitnessCenter, hasEVCharging, state } = inputs;
  
  // Map local amenity booleans to SSOT amenity keys
  const amenities: HotelAmenitySimple[] = [];
  if (hasPool) amenities.push('pool');
  if (hasRestaurant) amenities.push('restaurant');
  if (hasSpa) amenities.push('spa');
  if (hasFitnessCenter) amenities.push('fitness');
  if (hasEVCharging) amenities.push('evCharging');
  
  const stateData = STATE_RATES[state] || STATE_RATES['Other'];
  
  // Call SSOT calculator
  const result = calculateHotelPowerSimple({
    rooms: numberOfRooms,
    hotelClass,
    amenities,
    electricityRate: stateData.rate,
  });
  
  // Calculate dailyKWh from SSOT annualEnergyCost / electricityRate / 365
  // Or use a simpler estimate based on peak with 40% capacity factor
  const dailyKWh = Math.round(result.peakKW * 24 * 0.4);
  
  // Demand charge impact using state-specific rates
  const demandChargeImpact = result.peakKW * stateData.demandCharge;
  
  return { 
    peakKW: result.peakKW, 
    dailyKWh, 
    demandChargeImpact: Math.round(demandChargeImpact) 
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HotelEnergy() {
  // Calculator inputs
  const [inputs, setInputs] = useState<HotelInputs>({
    numberOfRooms: 150,
    hotelClass: 'midscale',
    hasPool: true,
    hasRestaurant: true,
    hasSpa: false,
    hasFitnessCenter: true,
    hasEVCharging: false,
    state: 'Florida',
    currentMonthlyBill: 25000,
  });
  
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
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  // Wizard mode
  const [showWizard, setShowWizard] = useState(false);
  
  // Quick Estimate Modal - Progressive Disclosure
  const [showQuickEstimate, setShowQuickEstimate] = useState(false);
  const [quickRooms, setQuickRooms] = useState(150);
  const [quickClass, setQuickClass] = useState<'economy' | 'midscale' | 'upscale' | 'luxury'>('midscale');
  const [quickEstimateResult, setQuickEstimateResult] = useState<{ savings: number; payback: number } | null>(null);
  
  // Quick estimate calculation
  const calculateQuickEstimate = (rooms: number, hotelClass: string) => {
    const savingsPerRoom: Record<string, number> = {
      'economy': 200,
      'midscale': 350,
      'upscale': 500,
      'luxury': 800,
    };
    const baseSavings = (savingsPerRoom[hotelClass] || 350) * rooms;
    const savings = Math.round(baseSavings * (0.9 + Math.random() * 0.2));
    const payback = 3.5 + Math.random() * 2; // 3.5-5.5 years
    setQuickEstimateResult({ savings, payback: Math.round(payback * 10) / 10 });
  };
  
  // Auto-calculate when quick estimate inputs change
  useEffect(() => {
    if (showQuickEstimate) {
      calculateQuickEstimate(quickRooms, quickClass);
    }
  }, [quickRooms, quickClass, showQuickEstimate]);
  
  // Calculate quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCalculate();
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);
  
  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const { peakKW, dailyKWh } = calculateHotelPower(inputs);
      const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
      
      // Size battery: cover ~40% of peak for 4 hours (backup + peak shaving)
      const storageSizeMW = (peakKW * 0.4) / 1000;
      const durationHours = 4;
      
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: inputs.state,
        electricityRate: stateData.rate,
        useCase: 'hotel',
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
    
    try {
      await supabase.from('leads').insert([{
        name: leadInfo.ownerName,
        email: leadInfo.email,
        company: leadInfo.businessName,
        phone: leadInfo.phone,
        source: 'hotel_vertical',
        format: 'consultation',
      }]);
      setLeadSubmitted(true);
    } catch (error) {
      console.error('Lead submission error:', error);
      setLeadSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const { peakKW, demandChargeImpact } = calculateHotelPower(inputs);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900/50 to-slate-900 backdrop-blur-xl border-b-2 border-indigo-500/40 sticky top-0 z-40 shadow-lg shadow-indigo-500/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Back to Merlin Button */}
          <a 
            href="/"
            className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors group mr-4 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-2 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <img src={merlinImage} alt="Merlin" className="w-7 h-7" />
            <span className="hidden sm:inline text-sm font-semibold">Merlin</span>
          </a>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-indigo-400/50">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Hotel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">EnergyPartners</span></h1>
              <p className="text-xs text-indigo-300 font-medium">🏨 Battery Storage for Hospitality</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#calculator" className="hidden md:block text-indigo-200 hover:text-white text-sm font-semibold transition-colors hover:bg-indigo-500/20 px-4 py-2 rounded-lg">
              Calculator
            </a>
            <a href="tel:+18005551234" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-500/30 border-2 border-indigo-300/50 hover:scale-105">
              <Phone className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">Get Quote</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION - Edge-Bleeding Image Design
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzgxODJmNCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        {/* Left content - contained */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/40 rounded-full px-5 py-2 mb-6 shadow-lg">
                <Building2 className="w-5 h-5 text-indigo-300" />
                <span className="text-indigo-200 text-sm font-semibold">Hotels Save 25-40% on Energy Costs</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
                Protect Guest Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-300">& Cut Costs</span>
              </h1>
              
              <p className="text-xl text-indigo-100/90 mb-8 leading-relaxed">
                HVAC, pools, kitchens, and laundry spike your energy bills.
                <span className="text-indigo-300 font-medium"> Battery storage cuts peak demand and provides backup power.</span>
              </p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="font-medium">Never lose power to guests</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="font-medium">30% federal tax credit</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="font-medium">Sustainability credentials</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowQuickEstimate(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Calculate My Savings
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {/* Down arrow indicator */}
              <div className="flex flex-col items-center mt-6 animate-bounce">
                <ChevronDown className="w-6 h-6 text-indigo-400" />
                <span className="text-xs text-indigo-300 font-medium">See Your Savings ↓</span>
              </div>
            </div>
            
            {/* Right side placeholder for mobile only - actual content is absolutely positioned */}
            <div className="lg:hidden">
              <ImageCarousel />
              
              {/* Stats cards - mobile only */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-indigo-400/30 shadow-lg">
                  <p className="text-3xl font-black text-indigo-400">$52K</p>
                  <p className="text-xs text-indigo-200 font-medium">Avg Savings/Year</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-400/30 shadow-lg">
                  <p className="text-3xl font-black text-purple-400">4.5<span className="text-lg">yr</span></p>
                  <p className="text-xs text-purple-200 font-medium">Payback Period</p>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-pink-400/30 shadow-lg">
                  <p className="text-3xl font-black text-pink-400">4hr</p>
                  <p className="text-xs text-pink-200 font-medium">Backup Power</p>
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
                    background: 'linear-gradient(to right, rgba(49,46,129,1) 0%, rgba(49,46,129,0.7) 15%, transparent 40%), linear-gradient(to top, rgba(30,15,60,0.9) 0%, transparent 50%)'
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
                    <p className="text-indigo-300 text-sm">AI-Optimized Battery Storage</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-indigo-400">$52K</div>
                    <div className="text-xs text-indigo-300/70 mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center border-x border-white/10 px-2">
                    <div className="text-3xl font-black text-purple-300">4.5yr</div>
                    <div className="text-xs text-indigo-300/70 mt-1">Payback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-pink-400">4hr</div>
                    <div className="text-xs text-indigo-300/70 mt-1">Backup</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Energy cost badge */}
            <div className="absolute top-8 right-8">
              <div className="bg-purple-500/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-purple-100">ENERGY COSTS</p>
                <p className="text-2xl font-black text-white">6-8%</p>
                <p className="text-xs text-purple-200">of revenue</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CALCULATOR SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="calculator" className="py-16 bg-gradient-to-b from-black/30 via-indigo-900/20 to-black/30 backdrop-blur-sm relative overflow-hidden">
        {/* Decorative floating elements */}
        <div className="absolute top-8 left-8 text-5xl animate-bounce" style={{ animationDuration: '3s' }}>🏨</div>
        <div className="absolute top-12 right-12 text-4xl animate-pulse" style={{ animationDuration: '2s' }}>💰</div>
        <div className="absolute bottom-8 right-8 text-3xl animate-bounce" style={{ animationDuration: '4s' }}>⚡</div>
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            {/* Badge - larger with pulse animation */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 px-6 py-3 rounded-full border-2 border-indigo-400/50 mb-6 shadow-lg shadow-indigo-500/20 animate-pulse" style={{ animationDuration: '3s' }}>
              <Calculator className="w-6 h-6 text-indigo-400" />
              <span className="text-indigo-100 text-base font-black tracking-wide">🏨 HOTEL SAVINGS CALCULATOR 💰</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-300 animate-pulse" style={{ animationDuration: '2s' }}>Savings</span>
            </h2>
            <p className="text-indigo-200 max-w-2xl mx-auto font-bold text-lg">
              👇 Enter your hotel details and see <span className="text-indigo-100">instant savings estimates</span> 👇
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900/30 to-slate-900 backdrop-blur-xl rounded-3xl p-8 border-3 border-indigo-500/50 shadow-2xl shadow-indigo-500/20">
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-indigo-400/50">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Your Hotel Details</span>
              </h3>
              
              <div className="space-y-6">
                {/* Number of Rooms */}
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Number of Rooms
                  </label>
                  <input
                    type="range"
                    min={25}
                    max={500}
                    step={25}
                    value={inputs.numberOfRooms}
                    onChange={(e) => setInputs({ ...inputs, numberOfRooms: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-sm text-indigo-300 mt-1">
                    <span>25</span>
                    <span className="font-bold text-lg">{inputs.numberOfRooms} rooms</span>
                    <span>500</span>
                  </div>
                </div>
                
                {/* Hotel Class */}
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Hotel Class
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(HOTEL_CLASS_DISPLAY).map(([key, profile]) => (
                      <button
                        key={key}
                        onClick={() => setInputs({ ...inputs, hotelClass: key as HotelClassSimple })}
                        className={`p-3 rounded-xl text-left transition-all ${
                          inputs.hotelClass === key
                            ? 'bg-indigo-500/30 border-2 border-indigo-400'
                            : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{profile.name}</p>
                        <p className="text-xs text-indigo-200/60">{profile.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-3">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={inputs.hasPool} onChange={(e) => setInputs({ ...inputs, hasPool: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                      <Waves className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm">Pool/Hot Tub</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={inputs.hasRestaurant} onChange={(e) => setInputs({ ...inputs, hasRestaurant: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span className="text-white text-sm">Restaurant</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={inputs.hasSpa} onChange={(e) => setInputs({ ...inputs, hasSpa: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="text-white text-sm">Spa/Sauna</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={inputs.hasFitnessCenter} onChange={(e) => setInputs({ ...inputs, hasFitnessCenter: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                      <Dumbbell className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm">Fitness Center</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-all col-span-2">
                      <input type="checkbox" checked={inputs.hasEVCharging} onChange={(e) => setInputs({ ...inputs, hasEVCharging: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
                      <Car className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm">EV Charging for Guests</span>
                    </label>
                  </div>
                </div>
                
                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    State
                  </label>
                  <select
                    value={inputs.state}
                    onChange={(e) => setInputs({ ...inputs, state: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.keys(STATE_RATES).map((state) => (
                      <option key={state} value={state} className="bg-slate-800">{state}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Power Summary */}
              <div className="mt-6 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-5 border-2 border-indigo-400/40">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-indigo-500/20 rounded-xl p-3 border border-indigo-400/30">
                    <p className="text-3xl font-black text-indigo-400">{peakKW} kW</p>
                    <p className="text-xs text-indigo-200 font-semibold">⚡ Peak Demand</p>
                  </div>
                  <div className="bg-pink-500/20 rounded-xl p-3 border border-pink-400/30">
                    <p className="text-3xl font-black text-pink-400">${demandChargeImpact.toLocaleString()}</p>
                    <p className="text-xs text-pink-200 font-semibold">💰 Monthly Charges</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results - ATTENTION GRABBING */}
            <div className="relative">
              {/* Clean card with pulsing border */}
              <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/40 backdrop-blur-xl rounded-3xl p-8 border-3 border-indigo-400/60 shadow-2xl shadow-indigo-500/30" style={{ animation: 'pulse 3s infinite' }}>
                {/* Static decorations */}
                <div className="absolute top-3 right-3 text-2xl">🏨</div>
                <div className="absolute top-3 left-3 text-xl animate-bounce">💰</div>
                
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50 border-2 border-indigo-300/50">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Your Estimated Savings</span>
                </h3>
              
              {isCalculating ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full" />
                </div>
              ) : quoteResult ? (
                <div className="space-y-6">
                  {/* Main Savings - HERO NUMBER */}
                  <div className="relative bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-2xl p-8 text-center border border-indigo-300/40 overflow-hidden">
                    <div className="relative">
                      <p className="text-sm text-indigo-200 uppercase tracking-[0.2em] mb-3 font-semibold">
                        ⚡ ANNUAL SAVINGS ⚡
                      </p>
                      <p className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300">
                        ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                      </p>
                      <p className="text-indigo-200 mt-2 font-medium">per year</p>
                    </div>
                  </div>
                  
                  {/* Stats Grid - Color coded */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-xl p-4 text-center border border-indigo-400/30 hover:scale-105 transition-transform">
                      <p className="text-3xl font-bold text-indigo-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-sm text-indigo-200">Year Payback</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 text-center border border-purple-400/30 hover:scale-105 transition-transform">
                      <p className="text-3xl font-bold text-purple-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                      <p className="text-sm text-purple-200">25-Year ROI</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-xl p-4 text-center border border-violet-400/30 hover:scale-105 transition-transform">
                      <p className="text-3xl font-bold text-violet-400">{Math.round(peakKW * 0.4)} kW</p>
                      <p className="text-sm text-violet-200">Battery Size</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-xl p-4 text-center border border-pink-400/30 hover:scale-105 transition-transform">
                      <p className="text-3xl font-bold text-pink-400">${Math.round(quoteResult.costs.netCost).toLocaleString()}</p>
                      <p className="text-sm text-pink-200">Net Cost (after ITC)</p>
                    </div>
                  </div>
                  
                  {/* CTA Button - PULSING */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="group relative w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 border border-indigo-300/50 animate-pulse"
                      style={{ animationDuration: '2s' }}
                    >
                      <Sparkles className="w-6 h-6" />
                      <span>Build My Custom Quote</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-400/40 hover:border-indigo-300/60 text-indigo-100 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Talk to an Expert
                    </button>
                  </div>
                  
                  <p className="text-center text-indigo-200/60 text-sm font-medium">
                    ✓ Free consultation • ✓ No obligation • ✓ Takes 2 minutes
                  </p>
                </div>
              ) : (
                <div className="text-center py-16 text-indigo-200/70">
                  <div className="relative inline-block">
                    <Calculator className="w-20 h-20 mx-auto mb-4 opacity-60" />
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👆</div>
                  </div>
                  <p className="text-lg font-medium">Adjust the sliders to see your savings</p>
                  <p className="text-sm mt-2 text-indigo-300/50">Your personalized estimate updates instantly</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-transparent via-indigo-900/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-400/40 mb-4">
              <Battery className="w-5 h-5 text-purple-400" />
              <span className="text-purple-200 text-sm font-bold">🔋 HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl font-black text-white">
              How Battery Storage <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Benefits Hotels</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900/30 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-2 border-indigo-500/40 text-center hover:scale-105 transition-transform hover:border-indigo-400/60 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/40 border-2 border-indigo-300/40">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Cut Demand Charges</h3>
              <p className="text-indigo-200 font-medium">
                Battery absorbs HVAC and kitchen peaks, reducing demand charges by 30-40%
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-2 border-purple-500/40 text-center hover:scale-105 transition-transform hover:border-purple-400/60 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/40 border-2 border-purple-300/40">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Backup Power</h3>
              <p className="text-purple-200 font-medium">
                Keep critical systems running during outages. Never compromise guest experience
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 via-pink-900/30 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-2 border-pink-500/40 text-center hover:scale-105 transition-transform hover:border-pink-400/60 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/40 border-2 border-pink-300/40">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Sustainability</h3>
              <p className="text-pink-200 font-medium">
                Meet ESG goals and guest expectations. Add solar to go even greener
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CASE STUDIES
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-black/30 via-indigo-900/20 to-black/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-400/40 mb-4">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-200 text-sm font-bold">🏆 SUCCESS STORIES</span>
            </div>
            <h2 className="text-3xl font-black text-white">
              Hotels <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Saving Big</span>
            </h2>
            <p className="text-indigo-200 text-sm mt-2 font-medium">
              Example savings scenarios based on typical installations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Midscale */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-indigo-500/50 hover:scale-105 hover:border-indigo-400/70 transition-all shadow-2xl shadow-indigo-500/20 group">
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">⭐</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-indigo-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Midscale Hotel</p>
                  <p className="text-sm text-indigo-200/80 font-medium">120 rooms • Orlando, FL</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-2xl p-5 text-center mb-4 border border-indigo-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">$38,000</p>
                <p className="text-sm text-indigo-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-indigo-200/70 font-semibold text-center">🔋 150 kW battery • ⏱️ 4.2 year payback</p>
            </div>
            
            {/* Card 2 - Upscale (Featured) */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-purple-400/60 hover:scale-105 hover:border-purple-400/80 transition-all shadow-2xl shadow-purple-500/30 relative group">
              {/* Featured badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-4 py-1 rounded-full text-xs font-black text-white shadow-lg border border-purple-300/50">🏆 TOP PERFORMER</div>
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">✨</div>
              <div className="flex items-center gap-3 mb-5 mt-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-purple-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Upscale Resort</p>
                  <p className="text-sm text-purple-200/80 font-medium">250 rooms • San Diego, CA</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-2xl p-5 text-center mb-4 border border-purple-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">$72,000</p>
                <p className="text-sm text-purple-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-purple-200/70 font-semibold text-center">🔋 300 kW battery • ⏱️ 3.8 year payback</p>
            </div>
            
            {/* Card 3 - Boutique */}
            <div className="bg-gradient-to-br from-slate-900 via-pink-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-pink-500/50 hover:scale-105 hover:border-pink-400/70 transition-all shadow-2xl shadow-pink-500/20 relative group">
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">💎</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/40 border-2 border-pink-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Boutique Hotel</p>
                  <p className="text-sm text-pink-200/80 font-medium">75 rooms • Miami, FL</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-500/30 to-rose-500/20 rounded-2xl p-5 text-center mb-4 border border-pink-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-300">$28,000</p>
                <p className="text-sm text-pink-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-pink-200/70 font-semibold text-center">🔋 100 kW battery • ⏱️ 4.5 year payback</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Decorative floating elements */}
        <div className="absolute top-12 left-12 text-6xl animate-bounce" style={{ animationDuration: '3s' }}>🏨</div>
        <div className="absolute bottom-12 right-12 text-5xl animate-pulse" style={{ animationDuration: '2s' }}>💰</div>
        <div className="absolute top-20 right-24 text-4xl animate-bounce" style={{ animationDuration: '4s' }}>⚡</div>
        <div className="absolute bottom-20 left-24 text-4xl animate-pulse" style={{ animationDuration: '3s' }}>🔋</div>
        
        {/* Gradient background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-900/40 to-pink-900/30 blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 px-5 py-2 rounded-full border-2 border-purple-400/50 mb-6 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-100 font-black tracking-wide">🚀 LIMITED TIME OFFER</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Improve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Bottom Line?</span>
          </h2>
          <p className="text-xl text-indigo-200 mb-8 font-bold">
            ✅ Free consultation • ✅ No obligation • ✅ Takes 2 minutes
          </p>
          
          {/* Big CTA Button with pulse */}
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white px-14 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 border-3 border-purple-300/50 animate-pulse group"
            style={{ animationDuration: '2s' }}
          >
            <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            Start My Free Quote
            <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
          </button>
          
          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-8 text-indigo-200/60 text-sm font-medium">
            <span>🔒 Secure</span>
            <span>⚡ Instant Results</span>
            <span>💼 Professional</span>
          </div>
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
                <p className="text-white font-bold">Hotel Energy Partners</p>
                <p className="text-indigo-200/50 text-sm">Powered by Merlin Energy</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-indigo-200/70 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="mailto:info@hotelenergypartners.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-indigo-200/50 text-sm">
            © {new Date().getFullYear()} Hotel Energy Partners. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          LEAD CAPTURE MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
          <div 
            className="bg-gradient-to-br from-slate-900 via-indigo-900/50 to-slate-900 rounded-3xl p-8 max-w-md w-full border-3 border-indigo-400/60 shadow-2xl shadow-indigo-500/30 relative overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 16px)' }}
          >
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 text-2xl">🏨</div>
            <div className="absolute top-2 right-12 text-xl">✨</div>
            <button onClick={() => setShowLeadForm(false)} className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-indigo-500/30 rounded-xl transition-all border border-transparent hover:border-indigo-400/50">
              <X className="w-6 h-6" />
            </button>
            
            {!leadSubmitted ? (
              <>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-2">Get Your Free Custom Quote</h3>
                <p className="text-indigo-200 mb-6 font-medium">Our hospitality energy experts will analyze your hotel</p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-indigo-200 mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.businessName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, businessName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Hotel Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-indigo-200 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.ownerName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, ownerName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-indigo-200 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="john@hotel.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-indigo-200 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 border-2 border-indigo-300/50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="animate-pulse">Processing...</span>
                      </>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Get My Free Quote <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/40 animate-pulse">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300 mb-3">🎉 Thank You!</h3>
                <p className="text-indigo-200 mb-6 font-medium">We'll send your detailed quote to <span className="text-indigo-300 font-bold">{leadInfo.email}</span> within 24 hours.</p>
                <button
                  onClick={() => { setShowLeadForm(false); setLeadSubmitted(false); }}
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
          QUICK ESTIMATE MODAL - Progressive Disclosure
          ═══════════════════════════════════════════════════════════════════════ */}
      {showQuickEstimate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
          onClick={() => setShowQuickEstimate(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <div 
            className="relative bg-gradient-to-br from-slate-900 via-indigo-900/70 to-purple-900/80 rounded-3xl shadow-2xl shadow-indigo-500/40 max-w-lg w-full overflow-y-auto border-3 border-indigo-400/60"
            style={{ maxHeight: 'calc(100vh - 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative elements */}
            <div className="absolute top-3 left-3 text-2xl animate-pulse">⚡</div>
            <button
              onClick={() => setShowQuickEstimate(false)}
              className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-indigo-500/30 rounded-xl transition-all border border-transparent hover:border-indigo-400/50 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative px-8 pt-8 pb-4 bg-gradient-to-b from-indigo-600/20 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={merlinImage} alt="Merlin" className="w-16 h-16" />
                  <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-1"><Sparkles className="w-3 h-3 text-white" /></div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Quick Savings Estimate</h2>
                  <p className="text-indigo-200 text-sm font-medium">⏱️ Answer 2 questions, get instant results</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-6 space-y-6">
              {/* Question 1: Hotel Class */}
              <div>
                <label className="block text-indigo-200 font-medium mb-3">What class of hotel?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'economy', label: 'Economy', desc: 'Budget-friendly' },
                    { id: 'midscale', label: 'Midscale', desc: 'Standard amenities' },
                    { id: 'upscale', label: 'Upscale', desc: 'Full-service' },
                    { id: 'luxury', label: 'Luxury', desc: 'Premium resort' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setQuickClass(type.id as typeof quickClass)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        quickClass === type.id
                          ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400'
                          : 'bg-white/5 border border-white/10 hover:border-indigo-400/50'
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{type.label}</p>
                      <p className="text-indigo-300/70 text-xs">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Question 2: Number of Rooms */}
              <div>
                <label className="block text-indigo-200 font-medium mb-3">How many rooms?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={20}
                    max={500}
                    step={10}
                    value={quickRooms}
                    onChange={(e) => setQuickRooms(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-black text-indigo-400">{quickRooms}</span>
                    <span className="text-indigo-300 text-sm ml-1">rooms</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 px-8 py-6 border-t-2 border-indigo-400/40">
              <div className="text-center mb-5 bg-slate-900/50 rounded-2xl p-5 border-2 border-indigo-400/40">
                <p className="text-indigo-200 text-sm font-bold mb-2 tracking-wide">💰 YOUR ESTIMATED ANNUAL SAVINGS</p>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-lg">
                  ${quickEstimateResult ? quickEstimateResult.savings.toLocaleString() : '---'}
                </p>
                <p className="text-purple-300 text-sm mt-2 font-semibold">
                  {quickEstimateResult && <><span className="text-pink-400">⚡</span> ~{quickEstimateResult.payback} year payback</>}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/40 hover:scale-105 transition-transform">
                  <Battery className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                  <p className="text-xs text-white font-medium">Backup Power</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/40 hover:scale-105 transition-transform">
                  <TrendingDown className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-white font-medium">Demand Cut</p>
                </div>
                <div className="text-center p-3 bg-amber-500/20 rounded-xl border border-amber-400/40 hover:scale-105 transition-transform">
                  <Sun className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-white font-medium">Green Creds</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowQuickEstimate(false);
                    setInputs(prev => ({ ...prev, numberOfRooms: quickRooms, hotelClass: quickClass }));
                    setShowWizard(true);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white px-6 py-5 rounded-xl font-black text-lg shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 border-2 border-indigo-300/50 hover:scale-[1.02] animate-pulse hover:animate-none"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Detailed Quote
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowQuickEstimate(false);
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-slate-800/60 hover:bg-slate-700/60 border-2 border-indigo-400/40 hover:border-indigo-300/60 text-indigo-100 px-6 py-3 rounded-xl font-semibold transition-all text-sm"
                >
                  Or try our simple calculator below
                </button>
              </div>
              
              <p className="text-center text-indigo-200 text-xs mt-4 font-medium">
                ✓ 2 minute detailed quote • ✓ No commitment required
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          WIZARD MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <HotelWizard
          initialInputs={{
            numberOfRooms: inputs.numberOfRooms,
            hotelClass: inputs.hotelClass,
            state: inputs.state,
          }}
          onClose={() => setShowWizard(false)}
          onComplete={(quote) => {
            console.log('Wizard completed with quote:', quote);
            setShowWizard(false);
          }}
          onRequestConsultation={() => {
            setShowWizard(false);
            setShowLeadForm(true);
          }}
        />
      )}
    </div>
  );
}
