/**
 * MERLIN ADVISOR - The Star of the Wizard ⭐
 * ==========================================
 * 
 * Merlin is the NARRATOR. ValueTracker is the SCOREBOARD. They work together.
 * 
 * Features:
 * - Sticky floating panel that scrolls with page
 * - Pulsing effect when important suggestions available
 * - "Suggestions" button for recommendations
 * - Progressive reveal of savings potential (Easter Egg hunt)
 * - Explains what the numbers mean at each step
 * - Educational content about energy opportunities
 * - Never fully hideable (minimizes to avatar)
 * 
 * Created: January 13, 2026
 * Updated: January 14, 2026 - Made sticky + added pulsing + suggestions CTA
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sun, Zap, Battery, Car, Flame, TrendingUp, Lightbulb, MessageCircle } from 'lucide-react';
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
  const [showSuggestions, setShowSuggestions] = useState(false); // Start CLOSED - only show when user needs help
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [idleWarningShown, setIdleWarningShown] = useState(false);
  
  const estimate = useMemo(() => getProgressiveEstimate(props), [props]);
  const message = useMemo(() => getMerlinMessage(props), [props]);
  
  // Track user activity - reset idle timer when props change (user is active)
  useEffect(() => {
    setLastActivityTime(Date.now());
    setIdleWarningShown(false);
    setHasPendingSuggestion(false);
  }, [currentStep, props.state, props.industry, props.facilitySize, props.hasSolar, props.hasGenerator, props.selectedTier]);
  
  // Detect when user has been idle for 20 seconds - then suggest help
  useEffect(() => {
    const checkIdleTimer = setInterval(() => {
      const idleTime = Date.now() - lastActivityTime;
      
      // After 20 seconds of inactivity, offer help
      if (idleTime > 20000 && !idleWarningShown && !showSuggestions) {
        setHasPendingSuggestion(true);
        setIdleWarningShown(true);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkIdleTimer);
  }, [lastActivityTime, idleWarningShown, showSuggestions]);
  
  // Determine which opportunities are relevant
  const relevantOpportunities = useMemo(() => {
    if (!state) return [];
    
    return Object.entries(ENERGY_OPPORTUNITIES)
      .filter(([_, opp]) => opp.requirement(electricityRate || 0.10, sunHours))
      .slice(0, 4); // Show max 4
  }, [state, electricityRate, sunHours]);
  
  // Get step-specific suggestions
  const suggestions = useMemo(() => {
    const tips: string[] = [];
    
    if (currentStep === 1) {
      if (!state) tips.push("Select your state to unlock local energy rates and solar data");
      if (state && (!goals || goals.length === 0)) tips.push("Choose your energy goals to personalize recommendations");
      if (sunHours && sunHours >= 5) tips.push("☀️ Great solar potential! Consider solar + storage combo");
      if (electricityRate && electricityRate >= 0.15) tips.push("💡 High rates = bigger savings! Peak shaving could save 30%+");
    }
    
    if (currentStep === 2) {
      if (!props.industry) tips.push("Select your industry for tailored energy analysis");
      if (props.industry) tips.push(`${props.industryName || 'Your industry'} typically saves ${formatCurrency(estimate.savingsLow)} - ${formatCurrency(estimate.savingsHigh)}/year`);
    }
    
    if (currentStep === 3) {
      tips.push("Answer questions accurately for the most precise quote");
      tips.push("Operating hours greatly impact your savings potential");
      tips.push("Equipment age affects efficiency - older = more savings potential");
    }
    
    if (currentStep === 4) {
      tips.push("Solar + BESS = Maximum savings (up to 60% more)");
      tips.push("Consider backup power if you're in an area with outages");
      tips.push("EV chargers can generate revenue and attract customers");
    }
    
    if (currentStep === 5) {
      tips.push("Compare tier options carefully - payback differs");
      tips.push("Tax credits (ITC) can cover 30-50% of costs");
    }
    
    return tips;
  }, [currentStep, state, goals, props.industry, props.industryName, sunHours, electricityRate, estimate]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Minimized state - floating avatar with pulse
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 group"
        style={{ zIndex: 9999 }}
      >
        <div className="relative">
          {/* Pulsing ring when has suggestion */}
          {hasPendingSuggestion && (
            <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/40" style={{ animationDuration: '1.5s' }} />
          )}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 p-1 shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-transform ${hasPendingSuggestion ? 'ring-4 ring-purple-400/50 ring-offset-2 ring-offset-slate-900' : ''}`}>
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-full h-full rounded-full object-cover border-2 border-purple-300"
            />
          </div>
          {/* Notification badge */}
          <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ${hasPendingSuggestion ? 'animate-bounce' : ''}`}>
            <Lightbulb className="w-3 h-3 text-white" />
          </div>
          {/* CTA tooltip */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={`bg-white/5 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border ${hasPendingSuggestion ? 'border-amber-500 bg-amber-900/50' : 'border-purple-500/30'}`}>
              <ChevronLeft className="w-3 h-3 inline mr-1" />
              {hasPendingSuggestion ? '💡 See Suggestions!' : 'Ask Merlin'}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className="fixed right-4 top-20 z-40 w-80"
      style={{ 
        zIndex: 9998,
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Pulsing glow effect when has suggestions */}
      {hasPendingSuggestion && (
        <div 
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-30 blur-sm animate-pulse"
          style={{ animationDuration: '2s' }}
        />
      )}
      
      {/* Glassmorphism Panel */}
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.90))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: hasPendingSuggestion 
            ? '2px solid rgba(251, 191, 36, 0.5)' 
            : '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: hasPendingSuggestion
            ? '0 8px 32px rgba(251, 191, 36, 0.3), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
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
                className="w-10 h-10 rounded-full border-2 border-purple-400 shadow-lg shadow-purple-500/30 object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                <span className="text-[8px]">✓</span>
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Merlin Advisor</h3>
              <p className="text-purple-300 text-xs">AI Energy Guide</p>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Minimize"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* � SUGGESTIONS BANNER - Only shows when user needs help (idle 20s+) */}
        {suggestions.length > 0 && (
          <div className="relative">
            {/* Attention-grabbing pulsing border when user idle */}
            {hasPendingSuggestion && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse opacity-50" />
            )}
            <button
              onClick={() => {
                setShowSuggestions(!showSuggestions);
                setHasPendingSuggestion(false);
                setIdleWarningShown(false);
              }}
              className={`relative w-full px-4 py-3 flex items-center justify-between transition-all ${
                hasPendingSuggestion 
                  ? 'bg-gradient-to-r from-amber-600/40 via-orange-500/30 to-amber-600/40' 
                  : showSuggestions
                    ? 'bg-purple-500/20'
                    : 'bg-purple-500/10 hover:bg-purple-500/20'
              }`}
              style={{
                borderBottom: hasPendingSuggestion ? '2px solid rgba(251, 191, 36, 0.6)' : '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                {/* Animated lightbulb icon */}
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ${
                  hasPendingSuggestion 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50' 
                    : 'bg-purple-500/30'
                }`}>
                  <Lightbulb className={`w-4 h-4 ${hasPendingSuggestion ? 'text-white' : 'text-purple-300'}`} />
                  {hasPendingSuggestion && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/40" style={{ animationDuration: '1.5s' }} />
                  )}
                </div>
                
                {/* Text with speech bubble feel */}
                <div className="text-left">
                  <span className={`font-bold text-sm block ${hasPendingSuggestion ? 'text-amber-300' : 'text-purple-300'}`}>
                    {hasPendingSuggestion ? '🧙‍♂️ Need help?' : 'Ask for Help'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {hasPendingSuggestion ? 'Click for tips!' : `${suggestions.length} tip${suggestions.length > 1 ? 's' : ''} available`}
                  </span>
                </div>
                
                {/* Count badge */}
                {hasPendingSuggestion && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-bounce">
                    {suggestions.length}
                  </span>
                )}
              </div>
              
              {/* Expand/collapse indicator */}
              <div className={`flex items-center gap-1 ${hasPendingSuggestion ? 'text-amber-300' : 'text-slate-400'}`}>
                <span className="text-xs">{showSuggestions ? 'Hide' : 'Show'}</span>
                {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
          </div>
        )}

        {/* Suggestions Panel (Expandable) - Now more prominent */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="px-4 py-3 space-y-2.5 max-h-56 overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(249, 115, 22, 0.05))',
              borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
            }}
          >
            <p className="text-amber-400/80 text-[10px] font-semibold uppercase tracking-wider mb-2">
              💡 Merlin's Recommendations
            </p>
            {suggestions.map((tip, i) => (
              <div 
                key={i} 
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-slate-200 text-sm leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 py-3 space-y-4" style={{ maxHeight: showSuggestions ? '250px' : '380px' }}>
          
          {/* Main Message */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-400 font-bold text-sm">{message.title}</p>
                <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{message.message}</p>
              </div>
            </div>
          </div>

          {/* Progressive Savings Estimate */}
          <div 
            className="rounded-xl p-3"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.10))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                💰 Est. Annual Savings
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={`text-xs ${star <= estimate.confidence ? 'text-amber-400' : 'text-slate-600'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            
            {/* Savings Range */}
            <div className="text-center mb-2">
              {estimate.savingsLow === estimate.savingsHigh ? (
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(estimate.savingsLow)}
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-bold text-emerald-300">
                    {formatCurrency(estimate.savingsLow)}
                  </span>
                  <span className="text-slate-400 text-sm">—</span>
                  <span className="text-xl font-bold text-emerald-300">
                    {formatCurrency(estimate.savingsHigh)}
                  </span>
                </div>
              )}
              <p className="text-slate-400 text-[10px] mt-0.5">per year</p>
            </div>

            {/* Progress/Confidence indicator */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                style={{ width: `${estimate.confidence * 20}%` }}
              />
            </div>
            
            {/* Next unlock hint */}
            <p className="text-emerald-300 text-[10px] text-center">
              🔓 {estimate.nextUnlock}
            </p>
          </div>

          {/* Energy Opportunities (Step 1+) */}
          {currentStep >= 1 && state && relevantOpportunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                ⚡ Your Opportunities
              </p>
              <div className="space-y-1.5">
                {relevantOpportunities.slice(0, 3).map(([key, opp]) => {
                  const Icon = opp.icon;
                  return (
                    <div 
                      key={key}
                      className="flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium">{opp.title}</p>
                        <p className="text-slate-400 text-[10px] truncate">{opp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Stats (Step 1+) - Compact */}
          {state && (sunHours || electricityRate) && (
            <div className="grid grid-cols-2 gap-2">
              {sunHours && (
                <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Sun className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                  <p className="text-amber-300 text-base font-bold">{sunHours}</p>
                  <p className="text-slate-400 text-[9px]">Sun hrs/day</p>
                </div>
              )}
              {electricityRate && (
                <div className="text-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                  <p className="text-yellow-300 text-base font-bold">${electricityRate.toFixed(2)}</p>
                  <p className="text-slate-400 text-[9px]">per kWh</p>
                </div>
              )}
            </div>
          )}

          {/* Step Progress - Compact */}
          <div className="pt-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    s === currentStep 
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500' 
                      : s < currentStep 
                        ? 'bg-purple-500/50' 
                        : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-slate-500 text-[10px] mt-1">Step {currentStep} of 6</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerlinAdvisor;
