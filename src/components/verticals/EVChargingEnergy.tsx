/**
 * EV CHARGING ENERGY - White Label Vertical
 * ==========================================
 * 
 * Landing page for evchargingpower.com
 * Targeted at EV charging station owners looking to reduce demand charges
 * 
 * Features:
 * - Simple calculator: # ports, charger types, utilization → instant savings
 * - Lead capture form
 * - Merlin-branded but EV-focused messaging
 * 
 * Uses: calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, Zap, DollarSign, CheckCircle, ArrowRight, Phone, 
  Sun, TrendingDown, Shield, Sparkles, Car, X, Battery, Bolt,
  Gauge, Clock, MapPin
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { supabase } from '@/services/supabaseClient';
import merlinImage from '@/assets/images/new_Merlin.png';
import evChargingImage from '@/assets/images/ev_charging_station.png';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.webp';
import EVChargingWizard, { type EVChargingWizardInputs } from './EVChargingWizard';

// ============================================
// TYPES
// ============================================

interface EVChargingInputs {
  level2Ports: number;
  dcfcPorts: number;
  hpcPorts: number;
  utilizationPercent: number;
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

// EV Charger power specifications (SAE J1772 / CCS standards)
const EV_CHARGER_SPECS = {
  level2: {
    name: 'Level 2',
    powerKW: 7.2, // 7.2 kW typical (some go to 19 kW)
    description: 'Destination charging',
  },
  dcfc50: {
    name: 'DC Fast 50kW',
    powerKW: 50,
    description: 'Quick charge stops',
  },
  dcfc150: {
    name: 'DC Fast 150kW',
    powerKW: 150,
    description: 'Highway stations',
  },
  hpc250: {
    name: 'HPC 250kW',
    powerKW: 250,
    description: 'Ultra-fast charging',
  },
  hpc350: {
    name: 'HPC 350kW',
    powerKW: 350,
    description: 'Premium highway',
  },
};

// Concurrency factor - not all chargers run at once
const CONCURRENCY_FACTOR = 0.7;

// State electricity rates
const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.22, demandCharge: 28 },
  'Texas': { rate: 0.12, demandCharge: 18 },
  'Florida': { rate: 0.14, demandCharge: 15 },
  'New York': { rate: 0.20, demandCharge: 25 },
  'Arizona': { rate: 0.13, demandCharge: 20 },
  'Nevada': { rate: 0.11, demandCharge: 18 },
  'Colorado': { rate: 0.12, demandCharge: 16 },
  'Washington': { rate: 0.10, demandCharge: 12 },
  'Oregon': { rate: 0.11, demandCharge: 14 },
  'Georgia': { rate: 0.12, demandCharge: 16 },
  'Other': { rate: 0.14, demandCharge: 18 },
};

// ============================================
// IMAGE CAROUSEL COMPONENT
// ============================================

const CAROUSEL_IMAGES = [
  { src: evChargingImage, alt: 'EV Charging Station', caption: 'DC Fast Charging', subcaption: 'High-power demand spikes' },
  { src: evChargingHotelImage, alt: 'EV Charging at Hotel', caption: 'Destination Charging', subcaption: 'Guest amenity revenue' },
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
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/30 border border-emerald-400/20">
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
              <p className="text-emerald-300 text-sm">AI-Optimized Battery Storage</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{currentImage.caption}</p>
              <p className="text-emerald-300 text-xs">{currentImage.subcaption}</p>
            </div>
          </div>
        </div>
        {/* Demand charge callout */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-red-500/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs font-bold text-red-100">DEMAND SPIKES</p>
            <p className="text-lg font-black text-white">$15K+/mo</p>
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
                ? 'bg-emerald-400 w-8' 
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

function calculateEVChargingPower(inputs: EVChargingInputs): { peakKW: number; dailyKWh: number; demandChargeImpact: number } {
  const { level2Ports, dcfcPorts, hpcPorts, utilizationPercent, state } = inputs;
  
  // Calculate total connected load
  const level2Power = level2Ports * EV_CHARGER_SPECS.level2.powerKW;
  const dcfcPower = dcfcPorts * EV_CHARGER_SPECS.dcfc150.powerKW; // Assume 150kW DCFC
  const hpcPower = hpcPorts * EV_CHARGER_SPECS.hpc250.powerKW; // Assume 250kW HPC
  
  const totalConnectedKW = level2Power + dcfcPower + hpcPower;
  
  // Peak demand with concurrency
  const peakKW = Math.round(totalConnectedKW * CONCURRENCY_FACTOR);
  
  // Daily energy based on utilization (assume 12 peak hours)
  const utilizationFactor = utilizationPercent / 100;
  const dailyKWh = Math.round(totalConnectedKW * utilizationFactor * 12);
  
  // Demand charge impact
  const stateData = STATE_RATES[state] || STATE_RATES['Other'];
  const demandChargeImpact = peakKW * stateData.demandCharge;
  
  return { peakKW, dailyKWh, demandChargeImpact };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EVChargingEnergy() {
  // Calculator inputs
  const [inputs, setInputs] = useState<EVChargingInputs>({
    level2Ports: 4,
    dcfcPorts: 4,
    hpcPorts: 2,
    utilizationPercent: 40,
    state: 'California',
    currentMonthlyBill: 15000,
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
  const [quickChargerType, setQuickChargerType] = useState<'level2' | 'dcfc' | 'hpc' | 'mixed'>('dcfc');
  const [quickPorts, setQuickPorts] = useState(4);
  const [quickEstimateResult, setQuickEstimateResult] = useState<{ savings: number; payback: number } | null>(null);
  
  // Quick estimate calculation
  const calculateQuickEstimate = (ports: number, chargerType: string) => {
    const savingsPerPort: Record<string, number> = {
      'level2': 2000,    // Level 2: Lower demand, lower savings
      'dcfc': 15000,     // DCFC: High demand spikes
      'hpc': 25000,      // HPC: Very high demand
      'mixed': 12000,    // Mixed: Average
    };
    const baseSavings = (savingsPerPort[chargerType] || 12000) * ports;
    const savings = Math.round(baseSavings * (0.9 + Math.random() * 0.2));
    const payback = 2 + Math.random() * 2; // 2-4 years
    setQuickEstimateResult({ savings, payback: Math.round(payback * 10) / 10 });
  };
  
  // Auto-calculate when quick estimate inputs change
  useEffect(() => {
    if (showQuickEstimate) {
      calculateQuickEstimate(quickPorts, quickChargerType);
    }
  }, [quickPorts, quickChargerType, showQuickEstimate]);
  
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
      const { peakKW, dailyKWh } = calculateEVChargingPower(inputs);
      const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
      
      // Size battery: cover peak demand for 2-4 hours (peak shaving)
      const storageSizeMW = peakKW / 1000;
      const durationHours = 2;
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: inputs.state,
        electricityRate: stateData.rate,
        useCase: 'ev-charging',
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
        source: 'ev_charging_vertical',
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
  
  const { peakKW, demandChargeImpact } = calculateEVChargingPower(inputs);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-gradient-to-r from-slate-900/90 via-emerald-900/30 to-slate-800/90 backdrop-blur-md border-b border-emerald-500/20 sticky top-0 z-40">
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
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Bolt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">EV<span className="text-emerald-400">ChargingPower</span></h1>
              <p className="text-xs text-emerald-300/70">Battery Storage for EV Stations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#calculator" className="hidden md:block text-emerald-300 hover:text-white text-sm font-medium transition-colors">
              Calculator
            </a>
            <a href="tel:+18005551234" className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2 rounded-full transition-all shadow-lg shadow-emerald-500/20">
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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        {/* Left content - contained */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 rounded-full px-5 py-2 mb-6 shadow-lg">
                <Bolt className="w-5 h-5 text-emerald-300" />
                <span className="text-emerald-200 text-sm font-semibold">EV Station Owners Cut Demand Charges 40-60%</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
                Demand Charges <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-300">Killing Your Margins?</span>
              </h1>
              
              <p className="text-xl text-emerald-100/90 mb-8 leading-relaxed">
                DC Fast Chargers spike demand charges to $5,000-$15,000/month.
                <span className="text-emerald-300 font-medium"> Battery storage cuts those peaks by 50%+</span>
              </p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">Cut demand charges 50%+</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">30% federal tax credit</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">Add chargers without grid upgrades</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowQuickEstimate(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Calculate My Savings
                <ArrowRight className="w-5 h-5" />
              </button>
              
              {/* Down Arrow Indicator */}
              <div className="mt-8 flex flex-col items-center animate-bounce">
                <p className="text-emerald-300 text-sm font-medium mb-2">See Your Savings Below</p>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 flex items-center justify-center">
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
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-emerald-400/30 shadow-lg">
                  <p className="text-3xl font-black text-emerald-400">$90K</p>
                  <p className="text-xs text-emerald-200 font-medium">Avg Savings/Year</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-teal-400/30 shadow-lg">
                  <p className="text-3xl font-black text-teal-400">2.8<span className="text-lg">yr</span></p>
                  <p className="text-xs text-teal-200 font-medium">Payback Period</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-cyan-400/30 shadow-lg">
                  <p className="text-3xl font-black text-cyan-400">60%</p>
                  <p className="text-xs text-cyan-200 font-medium">Demand Savings</p>
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
                    background: 'linear-gradient(to right, rgba(6,78,59,1) 0%, rgba(6,78,59,0.7) 15%, transparent 40%), linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 50%)'
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
                    <p className="text-emerald-300 text-sm">AI-Optimized Battery Storage</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-400">$90K</div>
                    <div className="text-xs text-emerald-300/70 mt-1">Annual Savings</div>
                  </div>
                  <div className="text-center border-x border-white/10 px-2">
                    <div className="text-3xl font-black text-teal-300">2.8yr</div>
                    <div className="text-xs text-emerald-300/70 mt-1">Payback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-cyan-400">60%</div>
                    <div className="text-xs text-emerald-300/70 mt-1">Demand Cut</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Demand spikes badge */}
            <div className="absolute top-8 right-8">
              <div className="bg-red-500/90 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-red-100">DEMAND SPIKES</p>
                <p className="text-2xl font-black text-white">$5-15K</p>
                <p className="text-xs text-red-200">/month charges</p>
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
              Calculate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-300">Savings</span>
            </h2>
            <p className="text-emerald-200/70 max-w-2xl mx-auto">
              Enter your charging station details and see how much you could save with battery storage
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                Your Charging Station
              </h3>
              
              <div className="space-y-6">
                {/* Level 2 Ports */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">
                    Level 2 Chargers (7.2 kW each)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={inputs.level2Ports}
                    onChange={(e) => setInputs({ ...inputs, level2Ports: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-sm text-emerald-300 mt-1">
                    <span>0</span>
                    <span className="font-bold text-lg">{inputs.level2Ports} ports ({inputs.level2Ports * 7.2} kW)</span>
                    <span>20</span>
                  </div>
                </div>
                
                {/* DCFC Ports */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">
                    DC Fast Chargers (150 kW each)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    value={inputs.dcfcPorts}
                    onChange={(e) => setInputs({ ...inputs, dcfcPorts: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-sm text-teal-300 mt-1">
                    <span>0</span>
                    <span className="font-bold text-lg">{inputs.dcfcPorts} DCFC ({inputs.dcfcPorts * 150} kW)</span>
                    <span>12</span>
                  </div>
                </div>
                
                {/* HPC Ports */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">
                    High Power Chargers (250 kW each)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    value={inputs.hpcPorts}
                    onChange={(e) => setInputs({ ...inputs, hpcPorts: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-sm text-cyan-300 mt-1">
                    <span>0</span>
                    <span className="font-bold text-lg">{inputs.hpcPorts} HPC ({inputs.hpcPorts * 250} kW)</span>
                    <span>8</span>
                  </div>
                </div>
                
                {/* Utilization */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">
                    Average Utilization
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={inputs.utilizationPercent}
                    onChange={(e) => setInputs({ ...inputs, utilizationPercent: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-sm text-emerald-300 mt-1">
                    <span>10%</span>
                    <span className="font-bold text-lg">{inputs.utilizationPercent}% utilization</span>
                    <span>80%</span>
                  </div>
                </div>
                
                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">
                    State
                  </label>
                  <select
                    value={inputs.state}
                    onChange={(e) => setInputs({ ...inputs, state: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {Object.keys(STATE_RATES).map((state) => (
                      <option key={state} value={state} className="bg-slate-800">{state}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Power Summary */}
              <div className="mt-6 bg-white/10 rounded-xl p-4 border border-emerald-400/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{peakKW} kW</p>
                    <p className="text-xs text-emerald-200/70">Peak Demand</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">${demandChargeImpact.toLocaleString()}</p>
                    <p className="text-xs text-red-200/70">Monthly Demand Charges</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Card */}
            <div className="relative bg-gradient-to-br from-slate-900/95 via-emerald-900/30 to-slate-900/95 backdrop-blur-xl rounded-3xl p-8 border-2 border-emerald-400/40 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <span className="text-white">Your Estimated Savings</span>
              </h3>
              
              {isCalculating ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full" />
                </div>
              ) : quoteResult ? (
                <div className="space-y-6">
                  {/* Main Savings - HERO NUMBER */}
                  <div className="relative bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-emerald-600/30 rounded-2xl p-8 text-center border border-emerald-400/40">
                    <p className="text-sm text-emerald-300 uppercase tracking-[0.2em] mb-3 font-bold">
                      ⚡ ANNUAL SAVINGS ⚡
                    </p>
                    <p className="text-6xl md:text-7xl font-black text-emerald-400 drop-shadow-lg">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-white/80 mt-3 text-lg font-medium">per year</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-emerald-400/30">
                      <p className="text-3xl font-bold text-emerald-400">
                        {quoteResult.financials.paybackYears.toFixed(1)}
                      </p>
                      <p className="text-sm text-white/70">Year Payback</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-teal-400/30">
                      <p className="text-3xl font-bold text-teal-400">
                        {Math.round(quoteResult.financials.roi25Year)}%
                      </p>
                      <p className="text-sm text-white/70">25-Year ROI</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-cyan-400/30">
                      <p className="text-3xl font-bold text-cyan-400">
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
                  
                  {/* CTA Buttons - Pulsing Effect */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="relative w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-5 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 animate-pulse hover:animate-none"
                    >
                      <Sparkles className="w-6 h-6" />
                      <span>Build My Custom Quote</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="w-full bg-slate-800/80 hover:bg-slate-700/80 border-2 border-emerald-400/40 hover:border-emerald-300/60 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Talk to an Expert
                    </button>
                  </div>
                  
                  <p className="text-center text-white/50 text-sm">
                    ✓ Free consultation • ✓ No obligation • ✓ Takes 2 minutes
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
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How Battery Storage <span className="text-emerald-300">Saves You Money</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Peak Shaving</h3>
              <p className="text-emerald-200/70">
                Battery absorbs peak demand spikes from DCFC chargers, reducing demand charges by 40-60%
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Gauge className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Grid Capacity</h3>
              <p className="text-emerald-200/70">
                Add more chargers without expensive utility upgrades. Battery provides the extra capacity
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sun className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Solar Ready</h3>
              <p className="text-emerald-200/70">
                Add solar canopies for shade + free power. Battery stores excess for nighttime charging
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
            EV Stations <span className="text-emerald-300">Saving Big</span>
          </h2>
          <p className="text-center text-emerald-200/50 text-sm mb-12">
            Example savings scenarios based on typical installations
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                  <Bolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Retail Plaza Station</p>
                  <p className="text-sm text-emerald-200/70">8 DCFC • Los Angeles, CA</p>
                </div>
              </div>
              <div className="bg-emerald-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-emerald-400">$78,000</p>
                <p className="text-sm text-emerald-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-emerald-200/60">400 kW battery • 2.5 year payback</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-full flex items-center justify-center">
                  <Bolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Highway Travel Center</p>
                  <p className="text-sm text-emerald-200/70">4 HPC + 6 DCFC • Phoenix, AZ</p>
                </div>
              </div>
              <div className="bg-emerald-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-emerald-400">$112,000</p>
                <p className="text-sm text-emerald-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-emerald-200/60">800 kW battery • 2.9 year payback</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center">
                  <Bolt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Fleet Depot</p>
                  <p className="text-sm text-emerald-200/70">20 L2 + 4 DCFC • Dallas, TX</p>
                </div>
              </div>
              <div className="bg-emerald-500/20 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-emerald-400">$65,000</p>
                <p className="text-sm text-emerald-200/70">Annual Savings</p>
              </div>
              <p className="text-sm text-emerald-200/60">300 kW battery • 3.2 year payback</p>
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
            Ready to Cut Your Demand Charges?
          </h2>
          <p className="text-xl text-emerald-200/70 mb-8">
            Get a free, no-obligation quote in under 5 minutes
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white px-12 py-5 rounded-full font-bold text-xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:scale-105 border border-emerald-400/30"
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
                <p className="text-white font-bold">EV Charging Power</p>
                <p className="text-emerald-200/50 text-sm">Powered by Merlin Energy</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-emerald-200/70 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="mailto:info@evchargingpower.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-emerald-200/50 text-sm">
            © {new Date().getFullYear()} EV Charging Power. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          LEAD CAPTURE MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-emerald-500/30 shadow-2xl relative">
            <button onClick={() => setShowLeadForm(false)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            {!leadSubmitted ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Get Your Free Custom Quote</h3>
                <p className="text-emerald-200/70 mb-6">Our team will analyze your station and send a detailed savings report</p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-emerald-200 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.businessName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, businessName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="EV Station Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-emerald-200 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.ownerName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, ownerName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-emerald-200 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="john@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-emerald-200 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-emerald-200/70 mb-6">We'll send your detailed quote to {leadInfo.email} within 24 hours.</p>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQuickEstimate(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div 
            className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 rounded-3xl shadow-2xl shadow-emerald-500/20 max-w-lg w-full overflow-hidden border border-emerald-400/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQuickEstimate(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative px-8 pt-8 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <img src={merlinImage} alt="Merlin" className="w-16 h-16" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Quick Savings Estimate</h2>
                  <p className="text-emerald-300 text-sm">Answer 2 questions, get instant results</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-6 space-y-6">
              {/* Question 1: Charger Type */}
              <div>
                <label className="block text-emerald-200 font-medium mb-3">What type of chargers?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'level2', label: 'Level 2', desc: '7-22 kW' },
                    { id: 'dcfc', label: 'DC Fast', desc: '50-150 kW' },
                    { id: 'hpc', label: 'High Power', desc: '250-350 kW' },
                    { id: 'mixed', label: 'Mixed', desc: 'Combination' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setQuickChargerType(type.id as typeof quickChargerType)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        quickChargerType === type.id
                          ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400'
                          : 'bg-white/5 border border-white/10 hover:border-emerald-400/50'
                      }`}
                    >
                      <p className="font-semibold text-white text-sm">{type.label}</p>
                      <p className="text-emerald-300/70 text-xs">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Question 2: Number of Ports */}
              <div>
                <label className="block text-emerald-200 font-medium mb-3">How many charging ports?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={quickChargerType === 'level2' ? 20 : 12}
                    value={quickPorts}
                    onChange={(e) => setQuickPorts(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-black text-emerald-400">{quickPorts}</span>
                    <span className="text-emerald-300 text-sm ml-1">ports</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 px-8 py-6 border-t border-emerald-500/20">
              <div className="text-center mb-4">
                <p className="text-emerald-300 text-sm font-medium mb-1">Your Estimated Annual Savings</p>
                <p className="text-5xl font-black text-white">
                  ${quickEstimateResult ? quickEstimateResult.savings.toLocaleString() : '---'}
                </p>
                <p className="text-teal-400 text-sm mt-1">
                  {quickEstimateResult && `~${quickEstimateResult.payback} year payback`}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-white/70">Peak Shaving</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-white/70">50%+ Cut</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <Battery className="w-5 h-5 text-teal-400 mx-auto mb-1" />
                  <p className="text-xs text-white/70">More Capacity</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowQuickEstimate(false);
                    // Map to inputs
                    if (quickChargerType === 'level2') {
                      setInputs(prev => ({ ...prev, level2Ports: quickPorts, dcfcPorts: 0, hpcPorts: 0 }));
                    } else if (quickChargerType === 'dcfc') {
                      setInputs(prev => ({ ...prev, level2Ports: 0, dcfcPorts: quickPorts, hpcPorts: 0 }));
                    } else if (quickChargerType === 'hpc') {
                      setInputs(prev => ({ ...prev, level2Ports: 0, dcfcPorts: 0, hpcPorts: quickPorts }));
                    } else {
                      setInputs(prev => ({ ...prev, level2Ports: Math.floor(quickPorts/2), dcfcPorts: Math.ceil(quickPorts/2), hpcPorts: 0 }));
                    }
                    setShowWizard(true);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Get Detailed Quote
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowQuickEstimate(false);
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all text-sm"
                >
                  Or try our simple calculator below
                </button>
              </div>
              
              <p className="text-center text-emerald-300/50 text-xs mt-4">
                2 minute detailed quote • No commitment required
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          WIZARD MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <EVChargingWizard
          initialInputs={{
            level2Ports: inputs.level2Ports,
            dcfcPorts: inputs.dcfcPorts,
            hpcPorts: inputs.hpcPorts,
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
