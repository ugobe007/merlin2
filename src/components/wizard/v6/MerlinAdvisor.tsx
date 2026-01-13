/**
 * MERLIN ADVISOR - The Star of the Wizard ⭐
 * ==========================================
 * 
 * Merlin is the NARRATOR. ValueTracker is the SCOREBOARD. They work together.
 * 
 * Features:
 * - Fixed right panel with glassmorphism effect
 * - Progressive reveal of savings potential (Easter Egg hunt)
 * - Explains what the numbers mean at each step
 * - Educational content about energy opportunities
 * - Never fully hideable (minimizes to avatar)
 * 
 * Created: January 13, 2026
 */

import React, { useState, useMemo } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Sun, Zap, Battery, Car, Flame, TrendingUp } from 'lucide-react';
import merlinImage from '@/assets/images/new_small_profile_.png';
import type { EnergyGoal } from './types';
import { US_STATE_DATA } from '@/services/data/stateElectricityRates';

// ============================================================================
// TYPES
// ============================================================================
interface MerlinAdvisorProps {
  currentStep: number;
  
  // Step 1 data
  state?: string;
  city?: string;
  goals?: EnergyGoal[];
  sunHours?: number;
  electricityRate?: number;
  demandCharge?: number;
  solarRating?: string;
  
  // Step 2 data
  industry?: string;
  industryName?: string;
  
  // Step 3 data (facility size indicator)
  facilitySize?: 'small' | 'medium' | 'large';
  
  // Step 4 data
  hasSolar?: boolean;
  hasGenerator?: boolean;
  hasEv?: boolean;
  solarKw?: number;
  generatorKw?: number;
  
  // Step 5+ data
  selectedTier?: 'starter' | 'perfect' | 'premium';
  annualSavings?: number;
}

// ============================================================================
// INDUSTRY SAVINGS BENCHMARKS (For progressive reveal)
// ============================================================================
const INDUSTRY_SAVINGS_RANGES: Record<string, { low: number; high: number; description: string }> = {
  hotel: { low: 25000, high: 75000, description: 'Hotels see major savings from HVAC optimization + peak shaving' },
  car_wash: { low: 15000, high: 45000, description: 'Car washes benefit from high peak demand reduction' },
  manufacturing: { low: 50000, high: 200000, description: 'Manufacturing facilities have huge demand charge savings potential' },
  data_center: { low: 100000, high: 500000, description: 'Data centers require 24/7 power - BESS is critical' },
  hospital: { low: 75000, high: 250000, description: 'Hospitals need reliable backup + can save on demand charges' },
  retail: { low: 20000, high: 60000, description: 'Retail stores can cut lighting and HVAC costs significantly' },
  office: { low: 15000, high: 50000, description: 'Office buildings benefit from peak shaving during business hours' },
  restaurant: { low: 12000, high: 35000, description: 'Restaurants have variable loads perfect for BESS' },
  warehouse: { low: 20000, high: 80000, description: 'Warehouses with cold storage see excellent ROI' },
  ev_charging: { low: 30000, high: 100000, description: 'EV charging hubs need demand management + can arbitrage' },
  college: { low: 50000, high: 150000, description: 'Universities have diverse loads and can showcase sustainability' },
  agriculture: { low: 15000, high: 60000, description: 'Farms benefit from irrigation scheduling + cold storage' },
  heavy_duty_truck_stop: { low: 40000, high: 120000, description: 'Truck stops need 24/7 power + EV charging is growing' },
};

// Default range when industry not yet selected
const DEFAULT_SAVINGS_RANGE = { low: 15000, high: 100000 };

// ============================================================================
// ENERGY OPPORTUNITY DEFINITIONS
// ============================================================================
const ENERGY_OPPORTUNITIES = {
  peak_shaving: {
    icon: TrendingUp,
    title: 'Peak Shaving',
    description: 'Cut demand charges 30-50%',
    requirement: (rate: number) => rate >= 0.08,
  },
  arbitrage: {
    icon: Zap,
    title: 'Energy Arbitrage',
    description: 'Buy low, use high - save 15-25%',
    requirement: (rate: number) => rate >= 0.10,
  },
  solar_storage: {
    icon: Sun,
    title: 'Solar + Storage',
    description: 'Maximum savings combo',
    requirement: (_rate: number, sunHours?: number) => (sunHours || 0) >= 4.5,
  },
  backup_power: {
    icon: Battery,
    title: 'Backup Power',
    description: '8-24 hours outage protection',
    requirement: () => true, // Always relevant
  },
  ev_revenue: {
    icon: Car,
    title: 'EV Charging Revenue',
    description: 'Earn $3K-15K/year',
    requirement: () => true,
  },
  generator_hybrid: {
    icon: Flame,
    title: 'Hybrid Generator',
    description: 'Reliable backup + fuel savings',
    requirement: (_rate: number, sunHours?: number) => (sunHours || 0) < 4.5,
  },
};

// ============================================================================
// PROGRESSIVE ESTIMATE CALCULATOR
// ============================================================================
function getProgressiveEstimate(props: MerlinAdvisorProps): {
  savingsLow: number;
  savingsHigh: number;
  confidence: number; // 1-5 stars
  nextUnlock: string;
} {
  const { state, industry, facilitySize, hasSolar, hasGenerator, selectedTier, annualSavings } = props;
  
  // Step 6: Final quote available
  if (annualSavings && annualSavings > 0) {
    return {
      savingsLow: annualSavings,
      savingsHigh: annualSavings,
      confidence: 5,
      nextUnlock: "Your complete quote is ready!"
    };
  }
  
  // Step 5: Tier selected
  if (selectedTier) {
    // Tighten range based on tier
    const industryRange = INDUSTRY_SAVINGS_RANGES[industry || ''] || DEFAULT_SAVINGS_RANGE;
    const mid = (industryRange.low + industryRange.high) / 2;
    return {
      savingsLow: Math.round(mid * 0.9),
      savingsHigh: Math.round(mid * 1.1),
      confidence: 4,
      nextUnlock: "Calculating your final quote..."
    };
  }
  
  // Step 4: Add-ons selected
  if (hasSolar !== undefined || hasGenerator !== undefined) {
    const industryRange = INDUSTRY_SAVINGS_RANGES[industry || ''] || DEFAULT_SAVINGS_RANGE;
    let multiplier = 1.0;
    if (hasSolar) multiplier += 0.3;
    if (hasGenerator) multiplier += 0.1;
    
    return {
      savingsLow: Math.round(industryRange.low * multiplier * 0.85),
      savingsHigh: Math.round(industryRange.high * multiplier * 0.85),
      confidence: 3,
      nextUnlock: "Review your Magic Fit options →"
    };
  }
  
  // Step 3: Facility details
  if (facilitySize) {
    const industryRange = INDUSTRY_SAVINGS_RANGES[industry || ''] || DEFAULT_SAVINGS_RANGE;
    const sizeMultiplier = facilitySize === 'small' ? 0.6 : facilitySize === 'large' ? 1.4 : 1.0;
    return {
      savingsLow: Math.round(industryRange.low * sizeMultiplier),
      savingsHigh: Math.round(industryRange.high * sizeMultiplier),
      confidence: 2,
      nextUnlock: "Add solar/generator to boost savings →"
    };
  }
  
  // Step 2: Industry selected
  if (industry) {
    const industryRange = INDUSTRY_SAVINGS_RANGES[industry] || DEFAULT_SAVINGS_RANGE;
    return {
      savingsLow: industryRange.low,
      savingsHigh: industryRange.high,
      confidence: 2,
      nextUnlock: "Tell me about your facility →"
    };
  }
  
  // Step 1: Location only
  if (state) {
    const stateData = US_STATE_DATA[state];
    const rateMultiplier = stateData?.electricityRate ? stateData.electricityRate / 0.12 : 1;
    return {
      savingsLow: Math.round(DEFAULT_SAVINGS_RANGE.low * rateMultiplier),
      savingsHigh: Math.round(DEFAULT_SAVINGS_RANGE.high * rateMultiplier),
      confidence: 1,
      nextUnlock: "Select your industry to narrow this →"
    };
  }
  
  // No data yet
  return {
    savingsLow: 15000,
    savingsHigh: 100000,
    confidence: 0,
    nextUnlock: "Enter your location to start →"
  };
}

// ============================================================================
// STEP-SPECIFIC MESSAGES
// ============================================================================
function getMerlinMessage(props: MerlinAdvisorProps): { title: string; message: string } {
  const { currentStep, state, city, industry, industryName, goals, sunHours, electricityRate, hasSolar, hasGenerator, selectedTier } = props;
  
  const locationName = city || state || 'your area';
  const industryLabel = industryName || industry || 'your business';
  
  switch (currentStep) {
    case 1:
      if (!state) {
        return {
          title: "Welcome! 🎉",
          message: "I'm Merlin, your energy advisor. Enter your ZIP code and I'll analyze your location's energy potential!"
        };
      }
      if (!goals || goals.length < 2) {
        return {
          title: `Great location! 📍`,
          message: `${locationName} has excellent energy potential. Select at least 2 goals so I can tailor your solution.`
        };
      }
      return {
        title: "Perfect start! ⚡",
        message: `I'm already analyzing ${locationName}'s potential. Based on your goals, I'll design the optimal system.`
      };
      
    case 2:
      if (!industry) {
        return {
          title: "What's your industry? 🏢",
          message: "Different industries have unique energy profiles. Select yours and watch your savings estimate tighten!"
        };
      }
      return {
        title: `${industryLabel} - Great choice! 💼`,
        message: `I've loaded industry-specific data. ${industryLabel} facilities typically see strong ROI with battery storage.`
      };
      
    case 3:
      return {
        title: "Tell me more 📋",
        message: `The more I know about your facility, the more accurate your quote. Don't worry - estimates work great!`
      };
      
    case 4:
      if (!hasSolar && !hasGenerator) {
        return {
          title: "Build your system ⚡",
          message: "Now for the fun part! Add solar, generators, or EV charging to maximize your savings. Watch the numbers change!"
        };
      }
      if (hasSolar && hasGenerator) {
        return {
          title: "Excellent configuration! 🚀",
          message: "Solar + Generator + BESS is a powerful combo. You're capturing maximum value!"
        };
      }
      return {
        title: "Looking good! 📈",
        message: hasSolar 
          ? "Solar will supercharge your savings. Consider a generator for backup reliability."
          : "Generator provides reliable backup. Consider solar to maximize long-term savings."
      };
      
    case 5:
      if (!selectedTier) {
        return {
          title: "Choose your Power Level 💪",
          message: "I've calculated three options. Each balances cost, savings, and backup differently. PERFECT FIT is my recommendation!"
        };
      }
      return {
        title: `${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} selected! ✅`,
        message: "Great choice! Let me finalize your quote with all the details..."
      };
      
    case 6:
      return {
        title: "Your Quote is Ready! 🎉",
        message: "Here's your personalized energy storage quote. The 30% Federal ITC makes now a great time to invest!"
      };
      
    default:
      return {
        title: "Let's get started!",
        message: "I'm here to help you find the perfect energy solution."
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function MerlinAdvisor(props: MerlinAdvisorProps) {
  const { currentStep, state, sunHours, electricityRate, goals } = props;
  const [isMinimized, setIsMinimized] = useState(false);
  
  const estimate = useMemo(() => getProgressiveEstimate(props), [props]);
  const message = useMemo(() => getMerlinMessage(props), [props]);
  
  // Determine which opportunities are relevant
  const relevantOpportunities = useMemo(() => {
    if (!state) return [];
    
    return Object.entries(ENERGY_OPPORTUNITIES)
      .filter(([_, opp]) => opp.requirement(electricityRate || 0.10, sunHours))
      .slice(0, 4); // Show max 4
  }, [state, electricityRate, sunHours]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Minimized state - just show avatar
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 group"
        style={{ zIndex: 9999 }}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 p-1 shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-transform">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-full h-full rounded-full object-cover border-2 border-purple-300"
            />
          </div>
          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          {/* Expand hint */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-purple-500/30">
              <ChevronLeft className="w-3 h-3 inline mr-1" />
              Expand Merlin
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className="fixed right-0 top-0 h-full z-40 pointer-events-none"
      style={{ zIndex: 9998 }}
    >
      {/* Glassmorphism Panel */}
      <div 
        className="absolute right-4 top-24 bottom-24 w-80 pointer-events-auto rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.80))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))',
            borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={merlinImage} 
                alt="Merlin" 
                className="w-12 h-12 rounded-full border-2 border-purple-400 shadow-lg shadow-purple-500/30 object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                <span className="text-[10px]">✓</span>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Merlin</h3>
              <p className="text-purple-300 text-xs">AI Energy Advisor</p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Minimize"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] px-5 py-4 space-y-5">
          
          {/* Main Message */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-bold text-sm">{message.title}</p>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">{message.message}</p>
              </div>
            </div>
          </div>

          {/* Progressive Savings Estimate */}
          <div 
            className="rounded-xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.10))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                💰 Estimated Annual Savings
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={`text-sm ${star <= estimate.confidence ? 'text-amber-400' : 'text-slate-600'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            
            {/* Savings Range */}
            <div className="text-center mb-3">
              {estimate.savingsLow === estimate.savingsHigh ? (
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(estimate.savingsLow)}
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-emerald-300">
                    {formatCurrency(estimate.savingsLow)}
                  </span>
                  <span className="text-slate-400">—</span>
                  <span className="text-2xl font-bold text-emerald-300">
                    {formatCurrency(estimate.savingsHigh)}
                  </span>
                </div>
              )}
              <p className="text-slate-400 text-xs mt-1">per year</p>
            </div>

            {/* Progress/Confidence indicator */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                style={{ width: `${estimate.confidence * 20}%` }}
              />
            </div>
            
            {/* Next unlock hint */}
            <p className="text-emerald-300 text-xs text-center">
              🔓 {estimate.nextUnlock}
            </p>
          </div>

          {/* Energy Opportunities (Step 1+) */}
          {currentStep >= 1 && state && relevantOpportunities.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                ⚡ Your Energy Opportunities
              </p>
              <div className="space-y-2">
                {relevantOpportunities.map(([key, opp]) => {
                  const Icon = opp.icon;
                  return (
                    <div 
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">{opp.title}</p>
                        <p className="text-slate-400 text-xs truncate">{opp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Stats (Step 1+) */}
          {state && (sunHours || electricityRate) && (
            <div 
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                📍 Location Analysis
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sunHours && (
                  <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-amber-300 text-lg font-bold">{sunHours}</p>
                    <p className="text-slate-400 text-[10px]">Sun hrs/day</p>
                  </div>
                )}
                {electricityRate && (
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-yellow-300 text-lg font-bold">${electricityRate.toFixed(2)}</p>
                    <p className="text-slate-400 text-[10px]">per kWh</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step Progress */}
          <div className="pt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    s === currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500' 
                      : s < currentStep 
                        ? 'bg-purple-500/50' 
                        : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mt-2">Step {currentStep} of 6</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerlinAdvisor;
