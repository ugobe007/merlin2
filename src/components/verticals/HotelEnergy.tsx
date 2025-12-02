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
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
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
  hotelClass: 'economy' | 'midscale' | 'upscale' | 'luxury';
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
// CONSTANTS
// ============================================

// Hotel power consumption per room by class (kW per room at peak)
const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5, name: 'Economy/Budget', description: 'Basic amenities' },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 2.0, name: 'Midscale', description: 'Standard amenities + breakfast' },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 2.5, name: 'Upscale', description: 'Full-service hotel' },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 3.5, name: 'Luxury/Resort', description: 'Premium experience' },
};

// Amenity power consumption
const AMENITY_POWER = {
  pool: { peakKW: 50, dailyKWh: 300, name: 'Pool & Hot Tub' },
  restaurant: { peakKW: 75, dailyKWh: 400, name: 'Restaurant/Kitchen' },
  spa: { peakKW: 40, dailyKWh: 200, name: 'Spa/Sauna' },
  fitnessCenter: { peakKW: 15, dailyKWh: 100, name: 'Fitness Center' },
  evCharging: { peakKW: 60, dailyKWh: 200, name: 'EV Charging (8 L2)' },
};

// State electricity rates
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
// CALCULATOR LOGIC
// ============================================

function calculateHotelPower(inputs: HotelInputs): { peakKW: number; dailyKWh: number; demandChargeImpact: number } {
  const { numberOfRooms, hotelClass, hasPool, hasRestaurant, hasSpa, hasFitnessCenter, hasEVCharging, state } = inputs;
  
  const classProfile = HOTEL_CLASS_PROFILES[hotelClass];
  
  // Base power from rooms
  let peakKW = numberOfRooms * classProfile.peakKWPerRoom;
  let dailyKWh = numberOfRooms * classProfile.kWhPerRoom;
  
  // Add amenities
  if (hasPool) {
    peakKW += AMENITY_POWER.pool.peakKW;
    dailyKWh += AMENITY_POWER.pool.dailyKWh;
  }
  if (hasRestaurant) {
    peakKW += AMENITY_POWER.restaurant.peakKW;
    dailyKWh += AMENITY_POWER.restaurant.dailyKWh;
  }
  if (hasSpa) {
    peakKW += AMENITY_POWER.spa.peakKW;
    dailyKWh += AMENITY_POWER.spa.dailyKWh;
  }
  if (hasFitnessCenter) {
    peakKW += AMENITY_POWER.fitnessCenter.peakKW;
    dailyKWh += AMENITY_POWER.fitnessCenter.dailyKWh;
  }
  if (hasEVCharging) {
    peakKW += AMENITY_POWER.evCharging.peakKW;
    dailyKWh += AMENITY_POWER.evCharging.dailyKWh;
  }
  
  // Load diversity (not all loads run simultaneously)
  peakKW = Math.round(peakKW * 0.75);
  
  const stateData = STATE_RATES[state] || STATE_RATES['Other'];
  const demandChargeImpact = peakKW * stateData.demandCharge;
  
  return { peakKW, dailyKWh: Math.round(dailyKWh), demandChargeImpact: Math.round(demandChargeImpact) };
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
      
      const result = await calculateQuote({
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
      <header className="bg-gradient-to-r from-slate-900/90 via-indigo-900/30 to-slate-800/90 backdrop-blur-md border-b border-indigo-500/20 sticky top-0 z-40">
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
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Hotel<span className="text-indigo-400">EnergyPartners</span></h1>
              <p className="text-xs text-indigo-300/70">Battery Storage for Hospitality</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#calculator" className="hidden md:block text-indigo-300 hover:text-white text-sm font-medium transition-colors">
              Calculator
            </a>
            <a href="tel:+18005551234" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 px-4 py-2 rounded-full transition-all shadow-lg shadow-indigo-500/20">
              <Phone className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">Get Quote</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzgxODJmNCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
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
              
              <a href="#calculator" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                Calculate My Savings
                <ArrowRight className="w-5 h-5" />
              </a>
              
              {/* Down arrow indicator */}
              <div className="flex flex-col items-center mt-6 animate-bounce">
                <ChevronDown className="w-6 h-6 text-indigo-400" />
                <span className="text-xs text-indigo-300 font-medium">See Your Savings ↓</span>
              </div>
            </div>
            
            {/* Right: Image Carousel + Stats */}
            <div className="relative">
              {/* Image Carousel */}
              <ImageCarousel />
              
              {/* Stats cards */}
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
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CALCULATOR SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="calculator" className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-400 to-pink-300">Savings</span>
            </h2>
            <p className="text-indigo-200/70 max-w-2xl mx-auto">
              Enter your hotel details and see how much you could save with battery storage
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                Your Hotel Details
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
                    {Object.entries(HOTEL_CLASS_PROFILES).map(([key, profile]) => (
                      <button
                        key={key}
                        onClick={() => setInputs({ ...inputs, hotelClass: key as any })}
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
              <div className="mt-6 bg-white/10 rounded-xl p-4 border border-indigo-400/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-indigo-400">{peakKW} kW</p>
                    <p className="text-xs text-indigo-200/70">Peak Demand</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-400">${demandChargeImpact.toLocaleString()}</p>
                    <p className="text-xs text-pink-200/70">Monthly Demand Charges</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results - ATTENTION GRABBING */}
            <div className="relative">
              {/* Clean card with pulsing border */}
              <div className="relative bg-gradient-to-br from-slate-900/95 via-indigo-900/40 to-slate-900/95 backdrop-blur-xl rounded-3xl p-8 border-2 border-indigo-400/50 shadow-xl animate-pulse" style={{ animationDuration: '3s' }}>
                {/* Static decorations */}
                <div className="absolute top-3 right-3 text-2xl">🏨</div>
                <div className="absolute top-3 left-3 text-xl">💰</div>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200">Your Estimated Savings</span>
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
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How Battery Storage <span className="text-indigo-300">Benefits Hotels</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cut Demand Charges</h3>
              <p className="text-indigo-200/70">
                Battery absorbs HVAC and kitchen peaks, reducing demand charges by 30-40%
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Backup Power</h3>
              <p className="text-indigo-200/70">
                Keep critical systems running during outages. Never compromise guest experience
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sustainability</h3>
              <p className="text-indigo-200/70">
                Meet ESG goals and guest expectations. Add solar to go even greener
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CASE STUDIES
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Hotels <span className="text-indigo-300">Saving Big</span>
          </h2>
          <p className="text-center text-indigo-200/50 text-sm mb-12">
            Example savings scenarios based on typical installations
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Midscale Hotel</p>
                  <p className="text-sm text-indigo-200/70">120 rooms • Orlando, FL</p>
                </div>
              </div>
              <div className="bg-indigo-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-indigo-400">$38,000</p>
                <p className="text-sm text-indigo-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-indigo-200/60">150 kW battery • 4.2 year payback</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Upscale Resort</p>
                  <p className="text-sm text-indigo-200/70">250 rooms • San Diego, CA</p>
                </div>
              </div>
              <div className="bg-indigo-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-indigo-400">$72,000</p>
                <p className="text-sm text-indigo-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-indigo-200/60">300 kW battery • 3.8 year payback</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Boutique Hotel</p>
                  <p className="text-sm text-indigo-200/70">75 rooms • Miami, FL</p>
                </div>
              </div>
              <div className="bg-indigo-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-indigo-400">$28,000</p>
                <p className="text-sm text-indigo-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-indigo-200/60">100 kW battery • 4.5 year payback</p>
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
            Ready to Improve Your Bottom Line?
          </h2>
          <p className="text-xl text-indigo-200/70 mb-8">
            Get a free, no-obligation quote in under 5 minutes
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all hover:scale-105 border border-indigo-400/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-indigo-500/30 shadow-2xl relative">
            <button onClick={() => setShowLeadForm(false)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            {!leadSubmitted ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Get Your Free Custom Quote</h3>
                <p className="text-indigo-200/70 mb-6">Our hospitality energy experts will analyze your hotel</p>
                
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
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
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
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-indigo-200/70 mb-6">We'll send your detailed quote to {leadInfo.email} within 24 hours.</p>
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
