/**
 * Industry Opportunity Panel
 * 
 * Shows industry-specific opportunity cards at the top of Step 3.
 * Similar to Vineet's "Goals Analysis Potential" design.
 * 
 * Each card shows potential benefits for the selected industry:
 * - Cost Reduction (savings %, annual $, payback)
 * - Backup Power (runtime, coverage, switch time)
 * - Sustainability (CO2 reduction, tons/yr, rating)
 * - Peak Shaving (peak cut %, savings, management)
 * - Revenue (grid services, arbitrage, total)
 * - Independence (self-power %, resilient, autonomy)
 * 
 * Created: January 13, 2026
 */

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, DollarSign, Battery, Leaf, 
  Zap, TrendingUp, Shield, Sun, Car, Flame
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface OpportunityCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  metrics: {
    value: string;
    label: string;
    highlight?: boolean;
  }[];
  description?: string;
}

interface IndustryOpportunityPanelProps {
  industry: string;
  industryName?: string;
  state?: string;
  electricityRate?: number;
  sunHours?: number;
  goals?: string[];
}

// ============================================================================
// INDUSTRY-SPECIFIC OPPORTUNITIES
// ============================================================================

function getIndustryOpportunities(
  industry: string,
  state?: string,
  electricityRate?: number,
  sunHours?: number,
  goals?: string[]
): OpportunityCard[] {
  const rate = electricityRate || 0.12;
  const sun = sunHours || 5.5;
  
  // Base opportunities that apply to most industries
  const baseOpportunities: OpportunityCard[] = [
    {
      id: 'cost-reduction',
      title: 'Cost Reduction',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      metrics: [
        { value: '25-35%', label: 'Savings', highlight: true },
        { value: `$${Math.round(rate * 150000 * 0.25 / 1000)}K`, label: 'Annual' },
        { value: '4.2yr', label: 'Payback' },
      ],
    },
    {
      id: 'backup-power',
      title: 'Backup Power',
      icon: <Battery className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      metrics: [
        { value: '8 hrs', label: 'Runtime', highlight: true },
        { value: '100%', label: 'Coverage' },
        { value: '<10ms', label: 'Switch' },
      ],
    },
    {
      id: 'sustainability',
      title: 'Sustainability',
      icon: <Leaf className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      metrics: [
        { value: '45%', label: 'CO₂ Cut', highlight: true },
        { value: '120T', label: 'Tons/Yr' },
        { value: 'A+', label: 'Rating' },
      ],
    },
  ];
  
  // Industry-specific opportunities
  const industryOpportunities: Record<string, OpportunityCard[]> = {
    'car-wash': [
      {
        id: 'peak-shaving',
        title: 'Peak Shaving',
        icon: <Zap className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        metrics: [
          { value: '30%', label: 'Peak Cut', highlight: true },
          { value: '$8K', label: 'Savings' },
          { value: 'Smart', label: 'Mgmt' },
        ],
        description: 'High pump loads make peak shaving very effective',
      },
      {
        id: 'solar-potential',
        title: 'Solar Potential',
        icon: <Sun className="w-5 h-5" />,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        metrics: [
          { value: `${sun.toFixed(1)}h`, label: 'Peak Sun', highlight: true },
          { value: '45kW', label: 'Roof Fit' },
          { value: '$12K', label: 'Savings' },
        ],
        description: 'Large flat roof area ideal for solar installation',
      },
    ],
    'hotel': [
      {
        id: 'ev-revenue',
        title: 'EV Revenue',
        icon: <Car className="w-5 h-5" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        metrics: [
          { value: '$2K', label: 'Monthly', highlight: true },
          { value: '8+', label: 'Chargers' },
          { value: 'Premium', label: 'Guest Perk' },
        ],
        description: 'Guest EV charging is a premium amenity with revenue potential',
      },
      {
        id: 'hvac-optimization',
        title: 'HVAC Savings',
        icon: <Flame className="w-5 h-5" />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        metrics: [
          { value: '40%', label: 'Load', highlight: true },
          { value: '$15K', label: 'Savings' },
          { value: '24/7', label: 'Comfort' },
        ],
        description: 'HVAC is your biggest load - battery storage optimizes it',
      },
    ],
    'ev-charging': [
      {
        id: 'grid-arbitrage',
        title: 'Grid Arbitrage',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        metrics: [
          { value: '$5K', label: 'Grid Svc', highlight: true },
          { value: '$3K', label: 'Arbitrage' },
          { value: '$8K', label: 'Total/Yr' },
        ],
        description: 'Buy low, sell high - maximize TOU rate differences',
      },
      {
        id: 'demand-management',
        title: 'Demand Mgmt',
        icon: <Zap className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        metrics: [
          { value: '50%', label: 'Peak Cut', highlight: true },
          { value: '$12K', label: 'Savings' },
          { value: 'Auto', label: 'Control' },
        ],
        description: 'DCFC creates massive peaks - BESS smooths them out',
      },
    ],
    'hospital': [
      {
        id: 'critical-backup',
        title: 'Critical Backup',
        icon: <Shield className="w-5 h-5" />,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        metrics: [
          { value: '100%', label: 'Coverage', highlight: true },
          { value: '<10ms', label: 'Transfer' },
          { value: 'NEC 517', label: 'Compliant' },
        ],
        description: 'Life-safety systems require seamless backup power',
      },
      {
        id: 'demand-response',
        title: 'DR Revenue',
        icon: <DollarSign className="w-5 h-5" />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        metrics: [
          { value: '$25K', label: 'Annual', highlight: true },
          { value: 'Auto', label: 'Dispatch' },
          { value: 'Low Risk', label: 'Profile' },
        ],
        description: 'Hospitals qualify for premium demand response rates',
      },
    ],
    'data-center': [
      {
        id: 'ups-integration',
        title: 'UPS Integration',
        icon: <Battery className="w-5 h-5" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        metrics: [
          { value: '99.99%', label: 'Uptime', highlight: true },
          { value: 'Tier III', label: 'Rating' },
          { value: 'Instant', label: 'Failover' },
        ],
        description: 'BESS replaces or augments traditional UPS systems',
      },
      {
        id: 'cooling-load',
        title: 'Cooling Savings',
        icon: <Flame className="w-5 h-5" />,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        metrics: [
          { value: '35%', label: 'Load', highlight: true },
          { value: '$50K', label: 'Savings' },
          { value: 'PUE 1.3', label: 'Target' },
        ],
        description: 'Optimize cooling with thermal storage + BESS',
      },
    ],
  };
  
  // Get industry-specific cards or use generic ones
  const specificCards = industryOpportunities[industry] || [
    {
      id: 'independence',
      title: 'Independence',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      metrics: [
        { value: '60%', label: 'Self-Pwr', highlight: true },
        { value: 'Yes', label: 'Resilient' },
        { value: '24/7', label: 'Autonomy' },
      ],
    },
    {
      id: 'revenue',
      title: 'Revenue',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      metrics: [
        { value: '$5K', label: 'Grid Svc', highlight: true },
        { value: '$3K', label: 'Arbitrage' },
        { value: '$8K', label: 'Total/Yr' },
      ],
    },
  ];
  
  // Filter based on selected goals
  let allCards = [...baseOpportunities, ...specificCards];
  
  // If goals are provided, prioritize cards that match goals
  if (goals && goals.length > 0) {
    const goalCardMap: Record<string, string[]> = {
      'cost-savings': ['cost-reduction', 'peak-shaving', 'hvac-optimization', 'cooling-load'],
      'backup-power': ['backup-power', 'critical-backup', 'ups-integration'],
      'sustainability': ['sustainability', 'solar-potential'],
      'ev-charging': ['ev-revenue', 'demand-management'],
      'grid-independence': ['independence', 'grid-arbitrage'],
      'demand-response': ['revenue', 'demand-response'],
    };
    
    // Boost relevant cards to top
    const boostedIds = new Set(goals.flatMap(g => goalCardMap[g] || []));
    allCards = [
      ...allCards.filter(c => boostedIds.has(c.id)),
      ...allCards.filter(c => !boostedIds.has(c.id)),
    ];
  }
  
  // Return top 6 cards
  return allCards.slice(0, 6);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IndustryOpportunityPanel({
  industry,
  industryName,
  state,
  electricityRate,
  sunHours,
  goals,
}: IndustryOpportunityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const opportunities = getIndustryOpportunities(
    industry,
    state,
    electricityRate,
    sunHours,
    goals
  );
  
  const displayName = industryName || industry.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <div className="mb-6 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold text-sm">
              {displayName} Energy Opportunities
            </h3>
            <p className="text-slate-400 text-xs">
              {isExpanded ? 'Click to collapse' : 'Click to see potential savings & benefits'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-1">
              {opportunities.slice(0, 3).map((opp) => (
                <div 
                  key={opp.id}
                  className={`w-6 h-6 rounded ${opp.bgColor} flex items-center justify-center`}
                >
                  <span className={opp.color}>{opp.icon}</span>
                </div>
              ))}
              {opportunities.length > 3 && (
                <span className="text-slate-500 text-xs ml-1">+{opportunities.length - 3}</span>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Expanded Content - Opportunity Cards Grid */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`p-3 rounded-lg ${opp.bgColor} border ${opp.borderColor} hover:scale-[1.02] transition-transform cursor-default`}
              >
                {/* Card Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={opp.color}>{opp.icon}</span>
                  <span className={`${opp.color} font-medium text-sm`}>{opp.title}</span>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1">
                  {opp.metrics.map((metric, i) => (
                    <div key={i} className="text-center">
                      <div className={`text-sm font-bold ${metric.highlight ? opp.color : 'text-white'}`}>
                        {metric.value}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Description (if available) */}
                {opp.description && (
                  <p className="mt-2 text-[10px] text-slate-400 line-clamp-2">
                    {opp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer note */}
          <p className="mt-3 text-xs text-slate-500 text-center">
            💡 Estimates based on your location and industry. Answer questions below for precise calculations.
          </p>
        </div>
      )}
    </div>
  );
}

export default IndustryOpportunityPanel;
