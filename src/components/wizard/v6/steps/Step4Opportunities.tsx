/**
 * STEP 4: Intelligent Opportunity Discovery
 * ==========================================
 * 
 * Enhanced from passive toggles to ACTIVE recommendations based on:
 * - Location (solar irradiance, utility rates)
 * - Industry (specific benefits, typical ROI)
 * - State incentives (rebates, tax credits)
 * - Utility TOU spreads (arbitrage potential)
 * 
 * Created: December 28, 2025
 * Updated: December 28, 2025 - Intelligent scoring
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Sun, 
  Zap, 
  Fuel, 
  TrendingUp, 
  MapPin, 
  Building2, 
  DollarSign,
  CheckCircle,
  Info,
  Loader2,
  Star,
  ArrowRight,
  Sparkles,
  Battery,
  Award
} from 'lucide-react';
import type { WizardState, OpportunitySelections } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

interface OpportunityScore {
  score: number;           // 0-100
  label: 'High' | 'Medium' | 'Low' | 'Not Recommended';
  reasons: string[];
  savings10Year?: number;
  incentives?: string[];
  industryBenefit?: string;
}

interface OpportunityData {
  solar: OpportunityScore;
  ev: OpportunityScore;
  generator: OpportunityScore;
  loading: boolean;
}

// ============================================================================
// SOLAR IRRADIANCE DATA BY STATE (kWh/m²/day)
// Source: NREL Solar Resource Data
// ============================================================================

const SOLAR_IRRADIANCE: Record<string, { value: number; rank: string }> = {
  'AZ': { value: 6.5, rank: 'Excellent' },
  'NV': { value: 6.3, rank: 'Excellent' },
  'NM': { value: 6.2, rank: 'Excellent' },
  'CA': { value: 5.8, rank: 'Excellent' },
  'UT': { value: 5.6, rank: 'Very Good' },
  'CO': { value: 5.5, rank: 'Very Good' },
  'TX': { value: 5.4, rank: 'Very Good' },
  'FL': { value: 5.3, rank: 'Very Good' },
  'OK': { value: 5.2, rank: 'Good' },
  'KS': { value: 5.1, rank: 'Good' },
  'NC': { value: 5.0, rank: 'Good' },
  'GA': { value: 5.0, rank: 'Good' },
  'SC': { value: 5.0, rank: 'Good' },
  'TN': { value: 4.8, rank: 'Good' },
  'VA': { value: 4.7, rank: 'Good' },
  'MD': { value: 4.6, rank: 'Moderate' },
  'NJ': { value: 4.5, rank: 'Moderate' },
  'PA': { value: 4.4, rank: 'Moderate' },
  'NY': { value: 4.3, rank: 'Moderate' },
  'MA': { value: 4.2, rank: 'Moderate' },
  'IL': { value: 4.2, rank: 'Moderate' },
  'OH': { value: 4.1, rank: 'Moderate' },
  'MI': { value: 4.0, rank: 'Moderate' },
  'WA': { value: 3.8, rank: 'Fair' },
  'OR': { value: 3.9, rank: 'Fair' },
  'MN': { value: 4.0, rank: 'Moderate' },
  'WI': { value: 4.0, rank: 'Moderate' },
};

// ============================================================================
// STATE INCENTIVES DATA
// ============================================================================

const STATE_INCENTIVES: Record<string, { solar: string[]; ev: string[]; storage: string[] }> = {
  'CA': {
    solar: ['SGIP rebate up to $1,000/kWh', 'NEM 3.0 export credits', 'Property tax exemption'],
    ev: ['LCFS credits', '$2,500 state rebate', 'HOV lane access'],
    storage: ['SGIP $200-850/kWh rebate', 'Self-generation incentive']
  },
  'NV': {
    solar: ['Net metering available', 'Property tax abatement', 'Sales tax exemption'],
    ev: ['$2,500/charger rebate', 'NV Energy incentives'],
    storage: ['NV Energy storage rebates']
  },
  'TX': {
    solar: ['Property tax exemption', 'Local utility rebates', 'No state income tax benefit'],
    ev: ['Local utility incentives', 'Oncor rebates up to $2,500'],
    storage: ['Some utility rebates available']
  },
  'NY': {
    solar: ['NY-Sun incentive $0.20-0.40/W', 'Property tax exemption', 'Net metering'],
    ev: ['Drive Clean rebate $2,000', 'ChargeNY grants'],
    storage: ['$250/kWh storage incentive']
  },
  'AZ': {
    solar: ['Net metering (varies by utility)', 'Property tax exemption', 'Sales tax exemption'],
    ev: ['APS EV rebates', 'Reduced registration'],
    storage: ['Some utility programs']
  },
  'FL': {
    solar: ['Net metering', 'Property tax exemption', 'Sales tax exemption'],
    ev: ['Limited state incentives', 'Utility programs'],
    storage: ['Hurricane resilience programs']
  },
  'CO': {
    solar: ['$0.03/kWh production incentive', 'Property tax exemption', 'Net metering'],
    ev: ['$2,500 state tax credit', 'Xcel Energy rebates'],
    storage: ['Xcel storage pilot programs']
  },
  'MA': {
    solar: ['SMART program incentives', 'Net metering', 'Property tax exemption'],
    ev: ['MOR-EV rebate $3,500', 'Make Ready program'],
    storage: ['SMART storage adder', 'Connected Solutions']
  }
};

// ============================================================================
// INDUSTRY BENEFITS
// ============================================================================

const INDUSTRY_BENEFITS: Record<string, { solar: string; ev: string; generator: string }> = {
  'hotel': {
    solar: 'Hotels with solar see 15% boost in eco-conscious bookings',
    ev: 'Properties with EV charging report 23% higher occupancy from EV owners',
    generator: 'Critical for guest safety during outages - protects reputation'
  },
  'car_wash': {
    solar: 'Large flat roofs ideal for solar - typical 40% energy offset',
    ev: 'Add revenue stream while customers wait - $0.35/kWh markup typical',
    generator: 'Tunnel downtime costs $500+/hour - backup essential'
  },
  'ev_charging': {
    solar: 'Solar-powered charging is major differentiator - "green charging"',
    ev: 'Core business - expand capacity to capture growing demand',
    generator: 'Ensures uptime during grid outages - critical for fleet customers'
  },
  'data_center': {
    solar: 'PUE improvement and sustainability reporting benefits',
    ev: 'Employee amenity and ESG compliance',
    generator: 'Tier 3/4 requires backup - N+1 redundancy standard'
  },
  'manufacturing': {
    solar: 'Large roof/land area - economies of scale for solar',
    ev: 'Fleet electrification support, employee benefit',
    generator: 'Production line protection - downtime costs $10K+/hour'
  },
  'hospital': {
    solar: 'Energy cost reduction supports patient care budgets',
    ev: 'Staff and visitor amenity, ambulance fleet prep',
    generator: 'Life safety requirement - code mandated backup'
  },
  'retail': {
    solar: 'Visible sustainability attracts eco-conscious shoppers',
    ev: 'Increases dwell time and basket size by 20%',
    generator: 'POS and refrigeration protection during outages'
  },
  'office': {
    solar: 'LEED certification points, tenant attraction',
    ev: 'Top employee amenity - 78% of EV owners prefer workplaces with charging',
    generator: 'Business continuity for critical operations'
  },
  'college': {
    solar: 'Educational opportunity + sustainability goals',
    ev: 'Student/faculty amenity, fleet vehicles',
    generator: 'Research protection, dormitory safety'
  },
  'warehouse': {
    solar: 'Massive roof area = massive solar potential',
    ev: 'Fleet electrification (forklifts, delivery vehicles)',
    generator: 'Cold storage protection, operations continuity'
  },
  'restaurant': {
    solar: 'Reduce high energy costs from cooking equipment',
    ev: 'Customer amenity increases visit frequency',
    generator: 'Food safety - refrigeration backup critical'
  },
  'agriculture': {
    solar: 'Agrivoltaics - dual use land, irrigation pumping',
    ev: 'Farm vehicle electrification',
    generator: 'Irrigation and cold storage backup'
  }
};

// ============================================================================
// OPPORTUNITY SCORING LOGIC
// ============================================================================

function calculateSolarScore(state: WizardState): OpportunityScore {
  const stateCode = state.state?.toUpperCase() || '';
  const industry = state.industry || '';
  const sqft = state.facilityDetails?.squareFootage || 0;
  const rooftopSqft = state.facilityDetails?.rooftopSquareFootage || sqft * 0.7;
  
  let score = 50; // Base score
  const reasons: string[] = [];
  const incentives: string[] = [];
  
  // Solar irradiance factor (0-25 points)
  const irradiance = SOLAR_IRRADIANCE[stateCode];
  if (irradiance) {
    const irradianceScore = Math.min(25, (irradiance.value / 6.5) * 25);
    score += irradianceScore;
    reasons.push(`${irradiance.value} sun hours/day (${irradiance.rank})`);
  }
  
  // State incentives (0-15 points)
  const stateIncentive = STATE_INCENTIVES[stateCode];
  if (stateIncentive?.solar?.length) {
    score += Math.min(15, stateIncentive.solar.length * 5);
    incentives.push(...stateIncentive.solar);
  }
  
  // Roof size factor (0-10 points)
  if (rooftopSqft > 50000) {
    score += 10;
    reasons.push('Large roof area - excellent solar potential');
  } else if (rooftopSqft > 20000) {
    score += 7;
    reasons.push('Good roof area for solar installation');
  } else if (rooftopSqft > 5000) {
    score += 4;
    reasons.push('Moderate roof area available');
  }
  
  // Industry-specific bonus (0-10 points)
  const industryBonus = ['car_wash', 'warehouse', 'manufacturing', 'retail'].includes(industry);
  if (industryBonus) {
    score += 10;
  }
  
  // Calculate 10-year savings estimate
  const solarKW = Math.min(rooftopSqft * 0.01, 500); // ~10W per sqft, cap at 500kW
  const annualProduction = solarKW * (irradiance?.value || 4.5) * 365 * 0.15; // kWh
  const savings10Year = annualProduction * 0.12 * 10; // $0.12/kWh average
  
  // Get industry benefit
  const industryBenefit = INDUSTRY_BENEFITS[industry]?.solar;
  
  // Determine label
  let label: OpportunityScore['label'];
  if (score >= 75) label = 'High';
  else if (score >= 50) label = 'Medium';
  else if (score >= 30) label = 'Low';
  else label = 'Not Recommended';
  
  return {
    score: Math.min(100, Math.max(0, score)),
    label,
    reasons,
    savings10Year: Math.round(savings10Year),
    incentives,
    industryBenefit
  };
}

function calculateEVScore(state: WizardState): OpportunityScore {
  const stateCode = state.state?.toUpperCase() || '';
  const industry = state.industry || '';
  const goals = state.goals || [];
  
  let score = 40; // Base score
  const reasons: string[] = [];
  const incentives: string[] = [];
  
  // User explicitly wants EV (+20 points)
  if (goals.includes('ev_ready')) {
    score += 20;
    reasons.push('EV readiness is a stated goal');
  }
  
  // State incentives (0-15 points)
  const stateIncentive = STATE_INCENTIVES[stateCode];
  if (stateIncentive?.ev?.length) {
    score += Math.min(15, stateIncentive.ev.length * 5);
    incentives.push(...stateIncentive.ev);
  }
  
  // Industry-specific bonus (0-25 points)
  const highEVIndustries = ['hotel', 'retail', 'office', 'ev_charging', 'restaurant'];
  const mediumEVIndustries = ['hospital', 'college', 'car_wash'];
  
  if (highEVIndustries.includes(industry)) {
    score += 25;
    reasons.push('High customer/employee EV adoption in this industry');
  } else if (mediumEVIndustries.includes(industry)) {
    score += 15;
    reasons.push('Growing EV demand in this sector');
  }
  
  // EV adoption by state (simplified - CA, WA, OR, CO, NV are high)
  const highEVStates = ['CA', 'WA', 'OR', 'CO', 'NV', 'NY', 'MA', 'NJ'];
  if (highEVStates.includes(stateCode)) {
    score += 10;
    reasons.push('High EV adoption rate in your state');
  }
  
  // Revenue potential estimate
  const chargersEstimate = industry === 'hotel' ? 4 : industry === 'retail' ? 6 : 2;
  const sessionsPerDay = 3;
  const revenuePerSession = 15; // $15 average
  const savings10Year = chargersEstimate * sessionsPerDay * revenuePerSession * 365 * 10;
  
  // Get industry benefit
  const industryBenefit = INDUSTRY_BENEFITS[industry]?.ev;
  
  // Determine label
  let label: OpportunityScore['label'];
  if (score >= 75) label = 'High';
  else if (score >= 50) label = 'Medium';
  else if (score >= 30) label = 'Low';
  else label = 'Not Recommended';
  
  return {
    score: Math.min(100, Math.max(0, score)),
    label,
    reasons,
    savings10Year: Math.round(savings10Year),
    incentives,
    industryBenefit
  };
}

function calculateGeneratorScore(state: WizardState): OpportunityScore {
  const industry = state.industry || '';
  const goals = state.goals || [];
  
  let score = 30; // Base score
  const reasons: string[] = [];
  
  // User wants backup power (+25 points)
  if (goals.includes('backup_power')) {
    score += 25;
    reasons.push('Backup power is a stated priority');
  }
  
  // Critical industries (0-35 points)
  const criticalIndustries = ['hospital', 'data_center'];
  const highPriorityIndustries = ['manufacturing', 'car_wash', 'cold_storage', 'restaurant'];
  const mediumPriorityIndustries = ['hotel', 'retail', 'office'];
  
  if (criticalIndustries.includes(industry)) {
    score += 35;
    reasons.push('Generator is essential/code-required for this industry');
  } else if (highPriorityIndustries.includes(industry)) {
    score += 25;
    reasons.push('High downtime costs make backup critical');
  } else if (mediumPriorityIndustries.includes(industry)) {
    score += 15;
    reasons.push('Backup power protects operations and reputation');
  }
  
  // Note: BESS alone provides 4-6 hours backup
  // Generator extends to unlimited runtime
  reasons.push('Extends backup beyond battery duration (4-6 hrs → unlimited)');
  
  // Get industry benefit
  const industryBenefit = INDUSTRY_BENEFITS[industry]?.generator;
  
  // Determine label
  let label: OpportunityScore['label'];
  if (score >= 70) label = 'High';
  else if (score >= 45) label = 'Medium';
  else if (score >= 25) label = 'Low';
  else label = 'Not Recommended';
  
  return {
    score: Math.min(100, Math.max(0, score)),
    label,
    reasons,
    industryBenefit
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step4Opportunities({ state, updateState }: Props) {
  const [opportunityData, setOpportunityData] = useState<OpportunityData>({
    solar: { score: 0, label: 'Low', reasons: [] },
    ev: { score: 0, label: 'Low', reasons: [] },
    generator: { score: 0, label: 'Low', reasons: [] },
    loading: true
  });

  // Calculate scores on mount/state change
  useEffect(() => {
    // Simulate async calculation (could hit APIs for real data)
    setOpportunityData(prev => ({ ...prev, loading: true }));
    
    const timer = setTimeout(() => {
      const solar = calculateSolarScore(state);
      const ev = calculateEVScore(state);
      const generator = calculateGeneratorScore(state);
      
      setOpportunityData({
        solar,
        ev,
        generator,
        loading: false
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [state.state, state.industry, state.goals, state.facilityDetails]);

  // Toggle handler
  const toggleOpportunity = (key: keyof OpportunitySelections) => {
    updateState({
      opportunities: {
        ...state.opportunities,
        [key]: !state.opportunities[key]
      }
    });
  };

  // Get selected count
  const selectedCount = [
    state.opportunities.wantsSolar,
    state.opportunities.wantsEV,
    state.opportunities.wantsGenerator
  ].filter(Boolean).length;

  if (opportunityData.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400">Analyzing opportunities for your location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Personalized Recommendations
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          💰 BOOST YOUR ENERGY ROI 💰
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Based on your location in <span className="text-purple-400 font-medium">{state.state || 'your state'}</span> and 
          <span className="text-purple-400 font-medium"> {state.industryName || 'your industry'}</span>, 
          here are your best opportunities.
        </p>
      </div>

      {/* Opportunity Cards */}
      <div className="space-y-4 max-w-3xl mx-auto">
        
        {/* Solar Opportunity */}
        <OpportunityCard
          title="Add Solar Array"
          icon={<Sun className="w-6 h-6" />}
          iconBg="bg-yellow-500/20"
          iconColor="text-yellow-400"
          score={opportunityData.solar}
          selected={state.opportunities.wantsSolar}
          onToggle={() => toggleOpportunity('wantsSolar')}
          state={state.state}
        />

        {/* EV Charging Opportunity */}
        <OpportunityCard
          title="Add EV Charging"
          icon={<Zap className="w-6 h-6" />}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
          score={opportunityData.ev}
          selected={state.opportunities.wantsEV}
          onToggle={() => toggleOpportunity('wantsEV')}
          state={state.state}
          revenueOpportunity
        />

        {/* Generator Opportunity */}
        <OpportunityCard
          title="Add Backup Generator"
          icon={<Fuel className="w-6 h-6" />}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          score={opportunityData.generator}
          selected={state.opportunities.wantsGenerator}
          onToggle={() => toggleOpportunity('wantsGenerator')}
          state={state.state}
        />
      </div>

      {/* Summary */}
      <div className="max-w-3xl mx-auto">
        {selectedCount > 0 ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
              <CheckCircle className="w-5 h-5" />
              {selectedCount} add-on{selectedCount > 1 ? 's' : ''} selected
            </div>
            <p className="text-slate-400 text-sm mt-1">
              These will be included in your system quote
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
            <p className="text-slate-400">
              <span className="text-white font-medium">No add-ons selected</span> — 
              Your quote will include BESS only. You can always add these later.
            </p>
          </div>
        )}
      </div>

      {/* Federal ITC Note */}
      <div className="max-w-3xl mx-auto p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Federal Investment Tax Credit (ITC)</p>
            <p className="text-slate-400 text-sm mt-1">
              All components qualify for the <span className="text-emerald-400 font-medium">30% Federal ITC</span> through 2032. 
              Solar + BESS combined systems may qualify for additional bonus credits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OPPORTUNITY CARD COMPONENT
// ============================================================================

interface OpportunityCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  score: OpportunityScore;
  selected: boolean;
  onToggle: () => void;
  state?: string;
  revenueOpportunity?: boolean;
}

function OpportunityCard({
  title,
  icon,
  iconBg,
  iconColor,
  score,
  selected,
  onToggle,
  state,
  revenueOpportunity
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreBadgeColor = 
    score.label === 'High' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    score.label === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    score.label === 'Low' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <div 
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        selected 
          ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      {/* Main Row */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${scoreBadgeColor}`}>
                {score.label} Opportunity
              </span>
              {score.label === 'High' && (
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
            </div>

            {/* Industry Benefit */}
            {score.industryBenefit && (
              <p className="text-slate-300 text-sm mb-3">
                {score.industryBenefit}
              </p>
            )}

            {/* Key Stats Row */}
            <div className="flex flex-wrap gap-4 mb-3">
              {score.savings10Year && score.savings10Year > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">
                    ${(score.savings10Year / 1000).toFixed(0)}K
                  </span>
                  <span className="text-slate-500">
                    {revenueOpportunity ? '10yr revenue potential' : '10yr savings est.'}
                  </span>
                </div>
              )}
              {score.reasons[0] && (
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400">{score.reasons[0]}</span>
                </div>
              )}
            </div>

            {/* Expand/Collapse for Details */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1"
            >
              {expanded ? 'Hide details' : 'See why'}
              <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex-shrink-0 ${
              selected
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {selected ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Added
              </span>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-700/50">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Reasons */}
            {score.reasons.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Why This Scores {score.label}</p>
                <ul className="space-y-1.5">
                  {score.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Incentives */}
            {score.incentives && score.incentives.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                  Available Incentives {state && `(${state})`}
                </p>
                <ul className="space-y-1.5">
                  {score.incentives.map((incentive, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      {incentive}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Score Bar */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Opportunity Score</span>
              <span>{score.score}/100</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  score.label === 'High' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                  score.label === 'Medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-slate-500'
                }`}
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step4Opportunities;
