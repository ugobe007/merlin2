/**
 * STEP 4: Merlin's Opportunities (THE UPSELL)
 * ===========================================
 * "Like buying a car and getting offered the extended warranty"
 * But actually useful and tailored to their location.
 * 
 * Created: December 28, 2025
 */

import React from 'react';
import { Sun, Zap, Fuel, Check, TrendingUp, MapPin } from 'lucide-react';
import type { WizardState, OpportunitySelections } from '../types';

// Solar data by state (from v6-savage)
const SOLAR_RATINGS: Record<string, { hours: number; rating: string }> = {
  'Nevada': { hours: 6.4, rating: 'Excellent' },
  'Arizona': { hours: 6.5, rating: 'Excellent' },
  'California': { hours: 5.8, rating: 'Excellent' },
  'Texas': { hours: 5.3, rating: 'Very Good' },
  'Florida': { hours: 5.2, rating: 'Very Good' },
  'Colorado': { hours: 5.5, rating: 'Excellent' },
  'New York': { hours: 3.8, rating: 'Moderate' },
};

// EV adoption rates by state
const EV_RATES: Record<string, number> = {
  'California': 18.2,
  'Nevada': 8.2,
  'Arizona': 7.5,
  'Texas': 4.8,
  'Florida': 5.8,
  'Colorado': 10.2,
  'New York': 6.5,
};

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

export function Step4Opportunities({ state, updateState }: Props) {
  const { opportunities } = state;
  const solar = SOLAR_RATINGS[state.state] || { hours: 4.5, rating: 'Good' };
  const evRate = EV_RATES[state.state] || 5.0;

  const toggleOpportunity = (key: keyof OpportunitySelections) => {
    updateState({
      opportunities: {
        ...opportunities,
        [key]: !opportunities[key],
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Merlin */}
      <div className="text-center">
        <div className="text-4xl mb-4">🧙‍♂️</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Merlin's Opportunities
        </h1>
        <p className="text-purple-300 max-w-xl mx-auto">
          Based on your location in <span className="text-cyan-400 font-semibold">{state.state || 'your area'}</span>, 
          here's what could boost your savings. These are optional—your BESS quote is already included.
        </p>
      </div>

      {/* Location Context */}
      <div className="max-w-2xl mx-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-4">
        <MapPin className="w-6 h-6 text-purple-400" />
        <div>
          <div className="text-white font-medium">{state.state || 'Your Location'}</div>
          <div className="text-sm text-slate-400">
            {solar.hours} sun hours/day • {evRate}% EV adoption rate
          </div>
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="max-w-3xl mx-auto space-y-4">
        {/* SOLAR */}
        <OpportunityCard
          icon={<Sun className="w-8 h-8" />}
          iconBg="bg-yellow-500/20"
          iconColor="text-yellow-400"
          title="Add Solar"
          subtitle={`${solar.rating} solar potential in ${state.state || 'your area'}`}
          description={`With ${solar.hours} peak sun hours daily, solar can offset 40-70% of your energy costs and provide clean backup power.`}
          benefit={
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>Potential 25-40% additional savings</span>
            </div>
          }
          selected={opportunities.wantsSolar}
          onToggle={() => toggleOpportunity('wantsSolar')}
        />

        {/* EV CHARGING */}
        <OpportunityCard
          icon={<Zap className="w-8 h-8" />}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
          title="Add EV Charging"
          subtitle={`${evRate}% EV adoption in ${state.state || 'your area'} and growing`}
          description="EV chargers can attract customers, provide employee benefits, and generate revenue. BESS helps manage charging load."
          benefit={
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>New revenue stream + customer attraction</span>
            </div>
          }
          selected={opportunities.wantsEV}
          onToggle={() => toggleOpportunity('wantsEV')}
        />

        {/* GENERATOR */}
        <OpportunityCard
          icon={<Fuel className="w-8 h-8" />}
          iconBg="bg-orange-500/20"
          iconColor="text-orange-400"
          title="Add Backup Generator"
          subtitle="Extended outage protection"
          description="For critical facilities, a generator provides unlimited runtime backup beyond what BESS alone can offer."
          benefit={
            <div className="flex items-center gap-2 text-slate-400">
              <span>Recommended for hospitals, data centers, critical ops</span>
            </div>
          }
          selected={opportunities.wantsGenerator}
          onToggle={() => toggleOpportunity('wantsGenerator')}
          muted
        />
      </div>

      {/* Summary */}
      <div className="max-w-2xl mx-auto p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
        <p className="text-purple-300">
          Your quote will include: <span className="text-white font-semibold">BESS</span>
          {opportunities.wantsSolar && <span className="text-yellow-400 font-semibold"> + Solar</span>}
          {opportunities.wantsEV && <span className="text-cyan-400 font-semibold"> + EV Charging</span>}
          {opportunities.wantsGenerator && <span className="text-orange-400 font-semibold"> + Generator</span>}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// OPPORTUNITY CARD COMPONENT
// ============================================================================

interface OpportunityCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
  benefit: React.ReactNode;
  selected: boolean;
  onToggle: () => void;
  muted?: boolean;
}

function OpportunityCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  description,
  benefit,
  selected,
  onToggle,
  muted,
}: OpportunityCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-purple-500 bg-purple-500/10'
          : muted
          ? 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
          : 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className={`text-lg font-semibold ${selected ? 'text-white' : 'text-slate-200'}`}>
                {title}
              </h3>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>

            {/* Toggle */}
            <div
              className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                selected ? 'bg-purple-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  selected ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <p className={`text-sm mb-3 ${muted ? 'text-slate-500' : 'text-slate-400'}`}>
            {description}
          </p>

          {benefit}
        </div>
      </div>
    </button>
  );
}
