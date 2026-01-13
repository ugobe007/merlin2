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
  Calculator, BarChart3, HelpCircle, ArrowRight, Star, CheckCircle
} from 'lucide-react';
import { DEFAULTS } from '@/services/data/constants';

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
// MAIN COMPONENT
// ============================================================================
const MerlinBar: React.FC<MerlinBarProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentStep } = props;
  
  // Get step-specific message
  const messageGetter = STEP_MESSAGES[currentStep] || STEP_MESSAGES[1];
  const message = messageGetter(props);
  
  // Calculate progressive estimate
  const estimate = useMemo(() => calculateProgressiveEstimate(props), [props]);
  
  // Get energy opportunities
  const opportunities = useMemo(() => getEnergyOpportunities(props), [props]);
  
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
      className="sticky top-0 z-50"
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
                src="/images/new_small_profile_.png" 
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
            
            {/* Message */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold text-sm">Merlin</span>
                <span className="text-slate-500 text-xs">AI Energy Advisor</span>
              </div>
              <p className="text-white text-sm truncate">{message.main}</p>
              {message.tip && !isExpanded && (
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
            
            {/* Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm transition-colors"
            >
              {isExpanded ? (
                <>Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>More <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Section */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            
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
        </div>
      )}
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
