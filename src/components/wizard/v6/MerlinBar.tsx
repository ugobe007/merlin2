/**
 * MERLIN BAR - Unified Floating Command Center
 * =============================================
 * 
 * Combines ValueTicker data + MerlinAdvisor intelligence into one sticky top bar.
 * This replaces BOTH the right-side MerlinAdvisor AND the separate ValueTicker.
 * 
 * Design: Always present, scrolls with user, context-aware per step.
 * 
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ [🧙 Merlin] [Message/Tip based on step] │ $17K-$111K savings │ [Action Buttons] [▼] │
 * └──────────────────────────────────────────────────────────────────────────────────────┘
 * 
 * Expanded (click ▼):
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │ Energy Opportunities: [Peak Shaving] [Solar + Storage] [EV Revenue]                 │
 * │ Quick Actions: [Solar Sizing Help] [Savings Calculator] [Compare Options]           │
 * └──────────────────────────────────────────────────────────────────────────────────────┘
 * 
 * Created: January 13, 2026
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Sun, Zap, Battery, Car, Flame,
  TrendingUp, Shield, Leaf, DollarSign, Sparkles, Info,
  Calculator, BarChart3, ArrowRight, Star, CheckCircle,
  Lock, Unlock, Gift, Lightbulb, Target, Award, AlertTriangle
} from 'lucide-react';

// Merlin avatar image
import merlinAvatar from '@/assets/images/new_small_profile_.png';

// ============================================================================
// TYPES
// ============================================================================
interface MerlinBarProps {
  currentStep: number;
  
  // Location data
  state?: string;
  city?: string;
  sunHours?: number;
  electricityRate?: number;
  solarRating?: string;
  
  // Goals
  goals?: string[];
  
  // Industry
  industry?: string;
  industryName?: string;
  
  // Options selected
  hasSolar?: boolean;
  hasGenerator?: boolean;
  hasEv?: boolean;
  
  // Values from calculations
  solarKw?: number;
  bessKwh?: number;
  generatorKw?: number;
  generatorFuel?: 'natural-gas' | 'diesel';
  evL2Count?: number;
  evDcfcCount?: number;
  
  // Energy baseline
  annualEnergySpend?: number;
  peakDemandCharges?: number;
  annualUsageKwh?: number;
  
  // Selection state
  selectedTier?: 'efficient' | 'balanced' | 'maximum';
  annualSavings?: number;
  
  // MagicFit options (for Step 5)
  magicFitOptions?: Array<{
    tier: string;
    bessKwh: number;
    solarKw?: number;
    annualSavings: number;
    netCost: number;
  }>;
  
  // Callbacks for actions
  onShowSolarHelp?: () => void;
  onShowSavingsBreakdown?: () => void;
  onShowComparison?: () => void;
  onJumpToStep?: (step: number) => void;
}

// ============================================================================
// STEP MESSAGES - What Merlin says at each step
// ============================================================================
const STEP_MESSAGES: Record<number, (props: MerlinBarProps) => { main: string; tip?: string }> = {
  1: (p) => {
    if (!p.state) {
      return { main: "👋 Hi! I'm Merlin, your energy advisor. Let's find your location first." };
    }
    if (p.sunHours && p.sunHours >= 5.5) {
      return { 
        main: `☀️ Great solar potential in ${p.state}! ${p.sunHours} hrs/day.`,
        tip: "Select your goals so I can design your optimal system."
      };
    }
    return { 
      main: `📍 ${p.state} locked in! Now tell me your energy goals.`,
      tip: "Pick at least 2 goals for the best recommendations."
    };
  },
  2: (p) => {
    if (!p.industry) {
      return { main: "🏢 What type of facility do you have? I'll tailor your system." };
    }
    return { 
      main: `Perfect! I know ${p.industryName || p.industry} energy patterns well.`,
      tip: "Next: Tell me about your facility size and usage."
    };
  },
  3: (p) => ({
    main: "📊 Great info! I'm calculating your baseline load...",
    tip: "Accurate details = more precise savings estimate."
  }),
  4: (p) => {
    const parts: string[] = [];
    if (p.hasSolar) parts.push('solar');
    if (p.hasGenerator) parts.push('backup power');
    if (p.hasEv) parts.push('EV charging');
    
    if (parts.length === 0) {
      return { main: "⚡ Select your energy options - I'll size them optimally." };
    }
    return { 
      main: `🔧 Configuring your ${parts.join(' + ')}...`,
      tip: "Use the sliders to customize, or trust my recommendations."
    };
  },
  5: (p) => {
    if (p.selectedTier) {
      const tierNames = { efficient: 'Efficient', balanced: 'Balanced', maximum: 'Maximum' };
      return { 
        main: `✨ ${tierNames[p.selectedTier]} tier selected! Great choice.`,
        tip: "Review your system details or proceed to your quote."
      };
    }
    return { 
      main: "🎯 Here are your 3 MagicFit options - each optimized differently.",
      tip: "Click a card to select, then continue for your official quote."
    };
  },
  6: (p) => ({
    main: `🎉 Congratulations! Your ${p.industryName || 'business'} energy plan is ready!`,
    tip: "Request your official quote to get started."
  })
};

// ============================================================================
// INDUSTRY SAVINGS RANGES (for progressive estimates)
// ============================================================================
const INDUSTRY_SAVINGS: Record<string, { min: number; max: number; typical: number }> = {
  hotel: { min: 12000, max: 85000, typical: 35000 },
  'data-center': { min: 50000, max: 500000, typical: 150000 },
  hospital: { min: 40000, max: 300000, typical: 100000 },
  manufacturing: { min: 30000, max: 400000, typical: 120000 },
  warehouse: { min: 15000, max: 150000, typical: 50000 },
  retail: { min: 8000, max: 60000, typical: 25000 },
  restaurant: { min: 5000, max: 40000, typical: 15000 },
  office: { min: 10000, max: 100000, typical: 40000 },
  'ev-charging': { min: 20000, max: 200000, typical: 75000 },
  'car-wash': { min: 8000, max: 50000, typical: 20000 },
  default: { min: 10000, max: 150000, typical: 50000 }
};

// ============================================================================
// VALUE CALCULATIONS (from ValueTicker, but simplified)
// ============================================================================
function calculateProgressiveEstimate(props: MerlinBarProps): { 
  low: number; 
  high: number; 
  confidence: number; // 1-5 stars
  source: string;
} {
  const { currentStep, industry, sunHours, electricityRate, annualSavings, goals } = props;
  
  // If we have actual calculations, use them
  if (annualSavings && annualSavings > 0) {
    const margin = annualSavings * 0.1; // ±10%
    return {
      low: Math.round(annualSavings - margin),
      high: Math.round(annualSavings + margin),
      confidence: 5,
      source: 'TrueQuote calculation'
    };
  }
  
  // Progressive narrowing based on what we know
  const industryData = INDUSTRY_SAVINGS[industry || 'default'] || INDUSTRY_SAVINGS.default;
  
  // Step 1-2: Wide range based on industry
  if (currentStep <= 2) {
    let multiplier = 1;
    if (sunHours && sunHours >= 5.5) multiplier *= 1.2;
    if (electricityRate && electricityRate >= 0.12) multiplier *= 1.15;
    
    return {
      low: Math.round(industryData.min * multiplier * 0.8),
      high: Math.round(industryData.max * multiplier * 1.2),
      confidence: industry ? 2 : 1,
      source: industry ? `${industry} industry benchmark` : 'General estimate'
    };
  }
  
  // Step 3-4: Narrower based on facility details
  if (currentStep <= 4) {
    const hasOptions = props.hasSolar || props.hasGenerator || props.hasEv;
    return {
      low: Math.round(industryData.typical * 0.6),
      high: Math.round(industryData.typical * 1.4),
      confidence: hasOptions ? 4 : 3,
      source: 'Facility-based estimate'
    };
  }
  
  // Step 5-6: Should have actual calculations
  return {
    low: Math.round(industryData.typical * 0.8),
    high: Math.round(industryData.typical * 1.2),
    confidence: 4,
    source: 'System configuration'
  };
}

// ============================================================================
// ENERGY OPPORTUNITIES
// ============================================================================
function getEnergyOpportunities(props: MerlinBarProps): Array<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> {
  const opportunities: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
  }> = [];
  
  const { sunHours, electricityRate, goals, hasSolar, hasGenerator, hasEv } = props;
  
  // Peak shaving is always available with BESS
  opportunities.push({
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Peak Shaving',
    value: '30-50% demand reduction',
    color: 'text-purple-400'
  });
  
  // Solar if good sun
  if (sunHours && sunHours >= 4.5) {
    opportunities.push({
      icon: <Sun className="w-4 h-4" />,
      label: 'Solar + Storage',
      value: `${sunHours} hrs/day potential`,
      color: 'text-amber-400'
    });
  }
  
  // EV revenue
  if (hasEv || goals?.includes('generate_revenue')) {
    opportunities.push({
      icon: <Car className="w-4 h-4" />,
      label: 'EV Revenue',
      value: '$500-2K/mo per charger',
      color: 'text-cyan-400'
    });
  }
  
  // Backup power
  if (hasGenerator || goals?.includes('backup_power')) {
    opportunities.push({
      icon: <Shield className="w-4 h-4" />,
      label: 'Backup Power',
      value: '8-72 hrs runtime',
      color: 'text-green-400'
    });
  }
  
  return opportunities.slice(0, 4); // Max 4 shown
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toLocaleString()}`;
}

// ============================================================================
// DISCOVERY PANEL - Hidden clues that unlock based on user selections
// ============================================================================
interface DiscoveryClue {
  id: string;
  icon: React.ReactNode;
  title: string;
  secret: string;
  unlocked: boolean;
  unlockedBy: string;
  category: 'savings' | 'opportunity' | 'warning' | 'bonus';
  impactValue?: string;
}

function getDiscoveryClues(props: MerlinBarProps): DiscoveryClue[] {
  const clues: DiscoveryClue[] = [];
  const { 
    state, sunHours, electricityRate, goals, industry, industryName,
    hasSolar, hasGenerator, hasEv, solarKw, generatorKw, bessKwh,
    evL2Count, evDcfcCount, currentStep, selectedTier, annualSavings
  } = props;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATION-BASED SECRETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // High electricity rate secret
  clues.push({
    id: 'high-rate-bonus',
    icon: <DollarSign className="w-4 h-4" />,
    title: 'Rate Arbitrage Opportunity',
    secret: electricityRate && electricityRate >= 0.15 
      ? `Your $${electricityRate.toFixed(2)}/kWh rate means BESS pays back 2x faster than average!`
      : 'Unlock: Location with rates above $0.15/kWh reveals arbitrage bonus',
    unlocked: !!(electricityRate && electricityRate >= 0.15),
    unlockedBy: 'High electricity rate detected',
    category: 'savings',
    impactValue: electricityRate && electricityRate >= 0.15 ? '+40% ROI boost' : undefined
  });
  
  // Solar goldmine states
  const solarGoldmineStates = ['CA', 'AZ', 'NV', 'TX', 'FL', 'NM', 'CO', 'UT'];
  clues.push({
    id: 'solar-goldmine',
    icon: <Sun className="w-4 h-4" />,
    title: 'Solar Goldmine Zone',
    secret: state && solarGoldmineStates.includes(state)
      ? `${state} is in the top 10% for solar production! Your panels will generate 20-30% more than northern states.`
      : 'Unlock: Select a location in the Solar Belt (CA, AZ, NV, TX, FL...)',
    unlocked: !!(state && solarGoldmineStates.includes(state)),
    unlockedBy: `Location: ${state}`,
    category: 'opportunity',
    impactValue: state && solarGoldmineStates.includes(state) ? '+25% solar output' : undefined
  });
  
  // Peak sun hours secret
  clues.push({
    id: 'peak-sun-bonus',
    icon: <Sparkles className="w-4 h-4" />,
    title: 'Peak Sun Performer',
    secret: sunHours && sunHours >= 5.5
      ? `${sunHours} peak sun hours/day = ${Math.round(sunHours * 365)} hours/year of prime solar production!`
      : 'Unlock: Location with 5.5+ peak sun hours reveals solar optimization secret',
    unlocked: !!(sunHours && sunHours >= 5.5),
    unlockedBy: `${sunHours} hrs/day sun`,
    category: 'opportunity',
    impactValue: sunHours && sunHours >= 5.5 ? `${Math.round((sunHours - 4) * 15)}% above avg` : undefined
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRY-SPECIFIC SECRETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Hotel night load secret
  if (industry === 'hotel' || !industry) {
    clues.push({
      id: 'hotel-night-load',
      icon: <Battery className="w-4 h-4" />,
      title: 'Night Owl Advantage',
      secret: industry === 'hotel'
        ? 'Hotels use 60% of energy at night for HVAC/lighting. BESS charges cheap (off-peak) and powers your nights!'
        : 'Unlock: Select Hotel industry to reveal night-load optimization',
      unlocked: industry === 'hotel',
      unlockedBy: 'Hotel industry selected',
      category: 'savings',
      impactValue: industry === 'hotel' ? 'TOU arbitrage: $2K-8K/yr' : undefined
    });
  }
  
  // Data center UPS replacement
  if (industry === 'data-center' || !industry) {
    clues.push({
      id: 'datacenter-ups',
      icon: <Shield className="w-4 h-4" />,
      title: 'UPS Replacement Bonus',
      secret: industry === 'data-center'
        ? 'BESS replaces expensive UPS systems while earning revenue! Typical savings: $50-200K on UPS equipment.'
        : 'Unlock: Select Data Center to reveal UPS cost elimination',
      unlocked: industry === 'data-center',
      unlockedBy: 'Data Center selected',
      category: 'bonus',
      impactValue: industry === 'data-center' ? '$50-200K saved' : undefined
    });
  }
  
  // Manufacturing demand spike protection
  if (industry === 'manufacturing' || !industry) {
    clues.push({
      id: 'mfg-demand-spike',
      icon: <TrendingUp className="w-4 h-4" />,
      title: 'Demand Spike Shield',
      secret: industry === 'manufacturing'
        ? 'Your machinery creates demand spikes = huge demand charges. BESS shaves peaks by 40-60%, saving $30K-100K/yr!'
        : 'Unlock: Select Manufacturing to reveal demand charge elimination',
      unlocked: industry === 'manufacturing',
      unlockedBy: 'Manufacturing selected',
      category: 'savings',
      impactValue: industry === 'manufacturing' ? '$30K-100K/yr saved' : undefined
    });
  }
  
  // EV station stacking
  if (industry === 'ev-charging' || hasEv) {
    clues.push({
      id: 'ev-revenue-stack',
      icon: <Car className="w-4 h-4" />,
      title: 'Revenue Stacking Secret',
      secret: hasEv || industry === 'ev-charging'
        ? 'Stack EV charging fees + demand response payments + grid services = 3 revenue streams from one BESS!'
        : 'Unlock: Add EV Charging to reveal triple-revenue strategy',
      unlocked: hasEv || industry === 'ev-charging',
      unlockedBy: 'EV charging enabled',
      category: 'bonus',
      impactValue: hasEv || industry === 'ev-charging' ? '+$15-50K/yr revenue' : undefined
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GOAL-BASED SECRETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Sustainability + solar combo
  clues.push({
    id: 'green-bonus',
    icon: <Leaf className="w-4 h-4" />,
    title: 'Green Premium Unlock',
    secret: goals?.includes('sustainability') && hasSolar
      ? 'Solar + BESS combo qualifies for green energy credits, ESG reporting benefits, and potential carbon credit revenue!'
      : 'Unlock: Select Sustainability goal + Solar to reveal green premium',
    unlocked: !!(goals?.includes('sustainability') && hasSolar),
    unlockedBy: 'Sustainability + Solar',
    category: 'bonus',
    impactValue: goals?.includes('sustainability') && hasSolar ? 'Carbon credits available' : undefined
  });
  
  // Revenue generation secret
  clues.push({
    id: 'grid-services',
    icon: <Zap className="w-4 h-4" />,
    title: 'Grid Services Revenue',
    secret: goals?.includes('generate_revenue')
      ? 'Your BESS can earn $50-150/kW/year from frequency regulation + demand response programs!'
      : 'Unlock: Select "Generate Revenue" goal to reveal grid income streams',
    unlocked: goals?.includes('generate_revenue') || false,
    unlockedBy: 'Revenue goal selected',
    category: 'opportunity',
    impactValue: goals?.includes('generate_revenue') ? '$50-150/kW/yr' : undefined
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EQUIPMENT COMBINATION SECRETS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Solar + BESS synergy
  clues.push({
    id: 'solar-bess-synergy',
    icon: <Target className="w-4 h-4" />,
    title: 'Perfect Pairing Bonus',
    secret: hasSolar && bessKwh && bessKwh > 0
      ? `Solar + ${Math.round(bessKwh)} kWh BESS = store excess solar for peak hours. Typical boost: +30% solar value!`
      : 'Unlock: Enable Solar + BESS together to reveal synergy bonus',
    unlocked: !!(hasSolar && bessKwh && bessKwh > 0),
    unlockedBy: 'Solar + BESS combo',
    category: 'savings',
    impactValue: hasSolar && bessKwh ? '+30% solar value' : undefined
  });
  
  // Generator + BESS hybrid
  clues.push({
    id: 'gen-bess-hybrid',
    icon: <Flame className="w-4 h-4" />,
    title: 'Hybrid Power Secret',
    secret: hasGenerator && bessKwh && bessKwh > 0
      ? 'BESS handles short outages (80% of events). Generator kicks in for extended outages. Result: 50% less fuel use!'
      : 'Unlock: Enable Generator + BESS for hybrid fuel savings',
    unlocked: !!(hasGenerator && bessKwh && bessKwh > 0),
    unlockedBy: 'Generator + BESS combo',
    category: 'savings',
    impactValue: hasGenerator && bessKwh ? '50% fuel reduction' : undefined
  });
  
  // Triple threat: Solar + BESS + Generator
  clues.push({
    id: 'triple-threat',
    icon: <Award className="w-4 h-4" />,
    title: '🏆 Triple Threat Achievement',
    secret: hasSolar && hasGenerator && bessKwh && bessKwh > 0
      ? 'ULTIMATE COMBO: Solar generates, BESS stores, Generator backs up. You have the most resilient + profitable setup possible!'
      : 'Unlock: Enable Solar + Generator + BESS for ultimate energy independence',
    unlocked: !!(hasSolar && hasGenerator && bessKwh && bessKwh > 0),
    unlockedBy: 'All three systems',
    category: 'bonus',
    impactValue: hasSolar && hasGenerator && bessKwh ? 'Max resilience achieved!' : undefined
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER SELECTION SECRETS (Step 5+)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (currentStep >= 5) {
    clues.push({
      id: 'tier-insight',
      icon: <Lightbulb className="w-4 h-4" />,
      title: 'MagicFit Insight',
      secret: selectedTier
        ? selectedTier === 'efficient' 
          ? 'Efficient tier = fastest payback. Great if you want ROI proof before expanding!'
          : selectedTier === 'balanced'
            ? 'Balanced tier = sweet spot for most businesses. Best risk/reward ratio!'
            : 'Maximum tier = future-proof investment. Best for growing businesses with expanding needs.'
        : 'Unlock: Select a MagicFit tier to reveal optimization insight',
      unlocked: !!selectedTier,
      unlockedBy: `${selectedTier ? selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1) : 'None'} tier`,
      category: 'opportunity'
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WARNING CLUES (things to watch out for)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Low rate warning
  if (electricityRate && electricityRate < 0.08) {
    clues.push({
      id: 'low-rate-warning',
      icon: <AlertTriangle className="w-4 h-4" />,
      title: 'Low Rate Strategy',
      secret: 'Your low electricity rate means demand charge reduction is your primary savings driver, not energy arbitrage. Focus on peak shaving!',
      unlocked: true,
      unlockedBy: `Rate: $${electricityRate.toFixed(2)}/kWh`,
      category: 'warning'
    });
  }
  
  return clues;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MerlinBar: React.FC<MerlinBarProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false); // Start CLOSED
  const [activeTab, setActiveTab] = useState<'discoveries' | 'tips'>('tips');
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);
  const [lastStep, setLastStep] = useState(props.currentStep);
  const [userDismissedThisStep, setUserDismissedThisStep] = useState(false);
  const { currentStep } = props;
  
  // AUTO-OPEN only when [A] step changes AND [B] there are suggestions
  React.useEffect(() => {
    // Only trigger when step actually changes (not on initial load or same step)
    if (currentStep !== lastStep) {
      setLastStep(currentStep);
      setUserDismissedThisStep(false); // Reset dismiss flag for new step
      
      // ⚠️ DON'T auto-expand on Steps 2-5 - keep minimized so users can focus on inputs
      // Step 2: Industry selection cards need to be clickable
      // Step 3: Custom questions need focus
      // Step 4: Goals/options selection needs attention
      // Step 5: Configuration sliders need precision
      if (currentStep >= 2 && currentStep <= 5) {
        setHasPendingSuggestion(true); // Show pulse but stay closed
        setIsExpanded(false); // Keep closed
        return;
      }
      
      // Only auto-open on Steps 1 and 6+ (where user needs guidance)
      setHasPendingSuggestion(true);
      setIsExpanded(true); // Auto-open on new step
      
      // Dismiss pulse after 8 seconds (but keep panel open until user closes)
      const timer = setTimeout(() => setHasPendingSuggestion(false), 8000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStep, lastStep]);
  
  // Get step-specific message
  const messageGetter = STEP_MESSAGES[currentStep] || STEP_MESSAGES[1];
  const message = messageGetter(props);
  
  // Calculate progressive estimate
  const estimate = useMemo(() => calculateProgressiveEstimate(props), [props]);
  
  // Get energy opportunities
  const opportunities = useMemo(() => getEnergyOpportunities(props), [props]);
  
  // Get discovery clues
  const discoveryClues = useMemo(() => getDiscoveryClues(props), [props]);
  const unlockedClues = discoveryClues.filter(c => c.unlocked);
  const lockedClues = discoveryClues.filter(c => !c.unlocked);
  
  // Confidence stars
  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= count ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="relative z-30"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
        backdropFilter: 'blur(16px)',
        borderBottom: '2px solid rgba(139,92,246,0.3)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.1)',
      }}
    >
      {/* Main Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Left: Merlin Avatar + Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <img 
                src={merlinAvatar} 
                alt="Merlin"
                className="w-10 h-10 rounded-full border-2 border-amber-400 shadow-lg shadow-amber-500/30"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300">
                <span className="text-xl">🧙</span>
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
            </div>
            
            {/* Message + Location Metrics */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold text-sm">Merlin</span>
              </div>
              <p className="text-white text-sm truncate">{message.main}</p>
              
              {/* Location Metrics Row - Show when location is confirmed */}
              {props.state && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Peak Sun */}
                  {props.sunHours && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400 text-xs font-medium">{props.sunHours.toFixed(1)}</span>
                      <span className="text-slate-500 text-[10px]">hrs/day</span>
                    </div>
                  )}
                  
                  {/* Electricity Rate */}
                  {props.electricityRate && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400 text-xs font-medium">${props.electricityRate.toFixed(2)}</span>
                      <span className="text-slate-500 text-[10px]">/kWh</span>
                    </div>
                  )}
                  
                  {/* Weather Risk - based on state */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium">Low</span>
                    <span className="text-slate-500 text-[10px]">Risk</span>
                  </div>
                  
                  {/* Solar Grade */}
                  {props.solarRating && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                      props.solarRating === 'A' || props.solarRating === 'A+' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : props.solarRating === 'B' || props.solarRating === 'B+'
                          ? 'bg-yellow-500/10 border border-yellow-500/20'
                          : 'bg-slate-500/10 border border-slate-500/20'
                    }`}>
                      <Sun className={`w-3 h-3 ${
                        props.solarRating === 'A' || props.solarRating === 'A+' ? 'text-emerald-400' :
                        props.solarRating === 'B' || props.solarRating === 'B+' ? 'text-yellow-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-xs font-bold ${
                        props.solarRating === 'A' || props.solarRating === 'A+' ? 'text-emerald-400' :
                        props.solarRating === 'B' || props.solarRating === 'B+' ? 'text-yellow-400' : 'text-slate-400'
                      }`}>{props.solarRating}</span>
                      <span className="text-slate-500 text-[10px]">Solar</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Tip (only show if no metrics) */}
              {message.tip && !isExpanded && !props.state && (
                <p className="text-slate-400 text-xs truncate">{message.tip}</p>
              )}
            </div>
          </div>
          
          {/* Center: Savings Estimate */}
          <div className="flex-shrink-0 text-center px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Est. Annual Savings</span>
              {renderStars(estimate.confidence)}
            </div>
            <div className="text-emerald-400 font-bold text-xl">
              {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
            </div>
            <div className="text-slate-500 text-xs">{estimate.source}</div>
          </div>
          
          {/* Right: Action Buttons + Expand */}
          <div className="flex items-center gap-2">
            {/* Quick action buttons (show on Steps 3+) */}
            {currentStep >= 3 && (
              <div className="hidden md:flex items-center gap-2">
                {props.onShowSavingsBreakdown && (
                  <button
                    onClick={props.onShowSavingsBreakdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white text-xs transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Breakdown
                  </button>
                )}
                {props.onShowSolarHelp && props.hasSolar && (
                  <button
                    onClick={props.onShowSolarHelp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs transition-colors"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Solar Help
                  </button>
                )}
              </div>
            )}
            
            {/* Expand/Collapse with PROMINENT pulsing effect */}
            <button
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                setHasPendingSuggestion(false);
                if (!newExpanded) {
                  setUserDismissedThisStep(true); // User closed it, don't auto-reopen this step
                }
              }}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                hasPendingSuggestion && !isExpanded
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/50'
                  : isExpanded
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400'
              }`}
            >
              {/* Pulsing ring when has new suggestions */}
              {hasPendingSuggestion && !isExpanded && (
                <div className="absolute inset-0 rounded-lg animate-ping bg-amber-500/40" style={{ animationDuration: '1.5s' }} />
              )}
              
              {/* Badge showing count */}
              {unlockedClues.length > 0 && !isExpanded && (
                <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                  hasPendingSuggestion 
                    ? 'bg-white text-amber-600 animate-bounce' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse'
                }`}>
                  {unlockedClues.length}
                </span>
              )}
              
              <Lightbulb className={`w-4 h-4 ${hasPendingSuggestion && !isExpanded ? 'animate-pulse' : ''}`} />
              {isExpanded ? (
                <>Hide <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>{hasPendingSuggestion ? '🧙‍♂️ See Tips!' : 'Suggestions'} <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Section - Discovery Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          {/* Tab Selector */}
          <div className="flex gap-2 pt-3 mb-3">
            <button
              onClick={() => setActiveTab('discoveries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'discoveries'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              <Gift className="w-4 h-4" />
              Discoveries
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === 'discoveries' ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {unlockedClues.length}/{discoveryClues.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tips'
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Tips & Actions
            </button>
          </div>
          
          {/* Discovery Panel Content */}
          {activeTab === 'discoveries' && (
            <div className="space-y-4">
              {/* Unlocked Secrets */}
              {unlockedClues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Unlock className="w-3.5 h-3.5" />
                    Unlocked Suggestions ({unlockedClues.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unlockedClues.map((clue) => (
                      <DiscoveryCard key={clue.id} clue={clue} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Locked Secrets (teasers) */}
              {lockedClues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    More Suggestions ({lockedClues.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {lockedClues.slice(0, 4).map((clue) => (
                      <DiscoveryCard key={clue.id} clue={clue} />
                    ))}
                  </div>
                  {lockedClues.length > 4 && (
                    <p className="text-slate-500 text-xs mt-2 text-center">
                      +{lockedClues.length - 4} more suggestions to unlock...
                    </p>
                  )}
                </div>
              )}
              
              {/* Progress bar */}
              <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400">Discovery Progress</span>
                  <span className="text-amber-400 font-medium">
                    {unlockedClues.length}/{discoveryClues.length} suggestions unlocked
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${(unlockedClues.length / discoveryClues.length) * 100}%` }}
                  />
                </div>
                {unlockedClues.length === discoveryClues.length && (
                  <p className="text-emerald-400 text-xs mt-2 text-center flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" /> All suggestions unlocked! Maximum savings revealed!
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Tips Panel Content */}
          {activeTab === 'tips' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Energy Opportunities */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Your Energy Opportunities
              </h4>
              <div className="space-y-2">
                {opportunities.map((opp, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className={`${opp.color}`}>{opp.icon}</div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{opp.label}</div>
                      <div className="text-slate-400 text-xs">{opp.value}</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500/50" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tips & Actions */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Merlin's Tips
              </h4>
              <div className="space-y-2">
                {/* Step-specific tips */}
                {currentStep === 1 && (
                  <>
                    <TipCard 
                      icon={<Info className="w-4 h-4" />}
                      text="Select 2+ goals for the most accurate recommendations"
                      color="cyan"
                    />
                    {props.sunHours && props.sunHours >= 5.5 && (
                      <TipCard 
                        icon={<Sun className="w-4 h-4" />}
                        text="Your location is ideal for solar - I'll size it in Step 4"
                        color="amber"
                      />
                    )}
                  </>
                )}
                {currentStep === 2 && (
                  <TipCard 
                    icon={<BarChart3 className="w-4 h-4" />}
                    text="Industry selection helps me apply the right load profiles"
                    color="purple"
                  />
                )}
                {currentStep === 3 && (
                  <TipCard 
                    icon={<Calculator className="w-4 h-4" />}
                    text="More details = tighter savings estimate (see stars above)"
                    color="emerald"
                  />
                )}
                {currentStep === 4 && (
                  <>
                    {props.hasSolar && (
                      <TipCard 
                        icon={<Sun className="w-4 h-4" />}
                        text={`Solar sized at ${props.solarKw || 0} kW based on your load`}
                        color="amber"
                        onClick={props.onShowSolarHelp}
                      />
                    )}
                    {props.hasGenerator && (
                      <TipCard 
                        icon={<Flame className="w-4 h-4" />}
                        text={`${props.generatorFuel === 'diesel' ? 'Diesel' : 'Natural gas'} generator for ${props.generatorKw || 0} kW backup`}
                        color="orange"
                      />
                    )}
                    {props.hasEv && (
                      <TipCard 
                        icon={<Car className="w-4 h-4" />}
                        text="EV chargers can generate $500-2K/month revenue"
                        color="cyan"
                      />
                    )}
                    {!props.hasSolar && !props.hasGenerator && !props.hasEv && (
                      <TipCard 
                        icon={<Battery className="w-4 h-4" />}
                        text="Add solar or generator for maximum savings"
                        color="purple"
                      />
                    )}
                  </>
                )}
                {currentStep === 5 && (
                  <>
                    <TipCard 
                      icon={<Sparkles className="w-4 h-4" />}
                      text="Each MagicFit option is optimized for different priorities"
                      color="purple"
                    />
                    {!props.selectedTier && (
                      <TipCard 
                        icon={<ArrowRight className="w-4 h-4" />}
                        text="Click a card to select your preferred configuration"
                        color="cyan"
                      />
                    )}
                  </>
                )}
                {currentStep === 6 && (
                  <TipCard 
                    icon={<CheckCircle className="w-4 h-4" />}
                    text="Your energy plan is ready! Request a quote to get started."
                    color="emerald"
                  />
                )}
                
                {/* Jump to step buttons */}
                {props.onJumpToStep && currentStep > 1 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => props.onJumpToStep?.(4)}
                      className="text-xs px-3 py-1.5 rounded bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
                    >
                      Review Options
                    </button>
                    <button
                      onClick={() => props.onJumpToStep?.(5)}
                      className="text-xs px-3 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                    >
                      See MagicFit
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DISCOVERY CARD COMPONENT
// ============================================================================
interface DiscoveryCardProps {
  clue: DiscoveryClue;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ clue }) => {
  const categoryStyles = {
    savings: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300'
    },
    opportunity: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300'
    },
    warning: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300'
    },
    bonus: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300'
    }
  };
  
  const style = categoryStyles[clue.category];
  
  if (clue.unlocked) {
    return (
      <div className={`p-3 rounded-lg ${style.bg} border ${style.border} transition-all hover:scale-[1.02]`}>
        <div className="flex items-start gap-2">
          <div className={`flex-shrink-0 ${style.icon} mt-0.5`}>{clue.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white text-sm font-medium">{clue.title}</span>
              {clue.impactValue && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.badge} font-medium`}>
                  {clue.impactValue}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{clue.secret}</p>
            <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
              <Unlock className="w-3 h-3" /> {clue.unlockedBy}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Locked state
  return (
    <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 opacity-60 hover:opacity-80 transition-opacity">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 text-slate-500 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-400 text-sm font-medium mb-1">{clue.title}</div>
          <p className="text-slate-500 text-xs leading-relaxed">{clue.secret}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIP CARD COMPONENT
// ============================================================================
interface TipCardProps {
  icon: React.ReactNode;
  text: string;
  color: 'cyan' | 'amber' | 'purple' | 'emerald' | 'orange';
  onClick?: () => void;
}

const TipCard: React.FC<TipCardProps> = ({ icon, text, color, onClick }) => {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-2 p-2 rounded-lg border ${colorClasses[color]} ${onClick ? 'hover:opacity-80 cursor-pointer' : ''}`}
    >
      <div className={`flex-shrink-0 ${colorClasses[color].split(' ')[0]}`}>{icon}</div>
      <span className="text-slate-300 text-xs">{text}</span>
      {onClick && <ArrowRight className="w-3 h-3 ml-auto text-slate-500" />}
    </Component>
  );
};

export default MerlinBar;
export { MerlinBar };
