/**
 * Savings Scout™ Widget
 * =====================
 * 
 * Location-aware, real-time opportunity detection widget.
 * Provides personalized energy savings recommendations based on:
 * - User's state/location
 * - Facility type (hotel, hospital, data center, etc.)
 * - Peak demand profile
 * - Utility rate structure
 * 
 * Components:
 * - SavingsScoutNavbar: Collapsed/expandable navbar widget
 * - SavingsScoutInline: Full inline display for wizard Step 2
 * - OpportunityCard: Individual opportunity card
 * 
 * @version 1.0
 * @created December 2025
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, X, ExternalLink, Info } from 'lucide-react';
import { getSavingsScoutResult, calculateSavingsOpportunities } from '@/services/savingsScoutCalculations';
import type { SavingsScoutProps, Opportunity, OpportunityStatus } from '@/types/savingsScout';

// ============================================
// STYLING CONSTANTS
// ============================================

const STATUS_STYLES: Record<OpportunityStatus, {
  card: string;
  badge: { bg: string; text: string };
}> = {
  high: {
    card: 'bg-emerald-50 border-emerald-300 hover:border-emerald-400',
    badge: { bg: 'bg-emerald-500', text: 'HIGH' },
  },
  moderate: {
    card: 'bg-amber-50 border-amber-300 hover:border-amber-400',
    badge: { bg: 'bg-amber-500', text: 'MODERATE' },
  },
  low: {
    card: 'bg-gray-50 border-gray-300 hover:border-gray-400',
    badge: { bg: 'bg-gray-400', text: 'LOW' },
  },
  critical: {
    card: 'bg-red-50 border-red-300 hover:border-red-400',
    badge: { bg: 'bg-red-500', text: 'CRITICAL' },
  },
  useful: {
    card: 'bg-blue-50 border-blue-300 hover:border-blue-400',
    badge: { bg: 'bg-blue-500', text: 'USEFUL' },
  },
  'not-recommended': {
    card: 'bg-slate-50 border-slate-300',
    badge: { bg: 'bg-slate-400', text: 'N/A' },
  },
};

// ============================================
// OPPORTUNITY CARD COMPONENT
// ============================================

interface OpportunityCardProps {
  opportunity: Opportunity;
  compact?: boolean;
}

export function OpportunityCard({ opportunity, compact = false }: OpportunityCardProps) {
  const styles = STATUS_STYLES[opportunity.status];
  
  return (
    <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${styles.card}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{opportunity.icon}</span>
          <span className="font-bold text-gray-900">{opportunity.name}</span>
        </div>
        <span className={`px-2 py-0.5 ${styles.badge.bg} text-white text-xs font-bold rounded-full`}>
          {styles.badge.text}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{opportunity.reason}</p>
      
      {opportunity.potentialMonthly > 0 && (
        <p className="text-sm font-semibold text-emerald-700">
          💰 ~${opportunity.potentialMonthly.toLocaleString()}/mo 
          <span className="text-emerald-600 font-normal">
            {' '}(${opportunity.potentialAnnual.toLocaleString()}/yr)
          </span>
        </p>
      )}
      
      {opportunity.potentialMonthly === 0 && opportunity.status !== 'not-recommended' && (
        <p className="text-sm text-gray-500 italic">
          {opportunity.status === 'critical' ? '⚠️ Risk mitigation' : 'ℹ️ Qualitative benefit'}
        </p>
      )}
      
      {!compact && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {opportunity.dataSource}
        </p>
      )}
    </div>
  );
}

// ============================================
// NAVBAR WIDGET (Collapsed/Expandable)
// ============================================

export function SavingsScoutNavbar({
  state,
  industryProfile,
  peakDemandKW,
  facilityDetails,
  onGetQuote,
  onFullAnalysis,
}: SavingsScoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate opportunities based on inputs
  const result = useMemo(() => 
    getSavingsScoutResult(state, peakDemandKW, industryProfile, facilityDetails),
    [state, peakDemandKW, industryProfile, facilityDetails]
  );
  
  const { opportunities, totalAnnualPotential, highPriorityCount } = result;
  
  // Filter out not-recommended for dropdown display
  const displayOpportunities = opportunities.filter(o => o.status !== 'not-recommended');
  
  return (
    <div className="relative">
      {/* Collapsed Trigger Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 
                   border-2 border-amber-300 rounded-full hover:shadow-lg transition-all
                   hover:from-amber-200 hover:to-amber-100"
      >
        <span className="text-lg">🔭</span>
        <span className="font-semibold text-amber-800">Savings Scout™</span>
        {highPriorityCount > 0 && (
          <span className="flex items-center justify-center w-6 h-6 bg-emerald-500 
                          text-white text-xs font-bold rounded-full animate-pulse">
            {highPriorityCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${
          isExpanded ? 'rotate-180' : ''
        }`} />
      </button>
      
      {/* Expanded Dropdown */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute top-full right-0 mt-2 w-[420px] bg-white rounded-2xl 
                         shadow-2xl border-2 border-amber-200 overflow-hidden z-50
                         animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔭</span>
                  <h3 className="font-bold text-white text-lg">Savings Scout™</h3>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-amber-100 text-sm mt-1">
                📍 {state} • 🏨 {facilityDetails?.rooms || 0}-Room {industryProfile}
              </p>
            </div>
            
            {/* Opportunities List */}
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Your Top Opportunities
              </h4>
              {displayOpportunities.map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} compact />
              ))}
            </div>
            
            {/* Total Potential */}
            {totalAnnualPotential > 0 && (
              <div className="px-5 py-3 bg-emerald-50 border-t-2 border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">Total Annual Potential:</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ${totalAnnualPotential.toLocaleString()}+
                  </span>
                </div>
              </div>
            )}
            
            {/* CTAs */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  onGetQuote?.();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 
                          text-white font-bold rounded-xl hover:shadow-lg transition-all
                          hover:from-amber-600 hover:to-amber-500"
              >
                🚀 Get My Quote
              </button>
              <button 
                onClick={() => {
                  setIsExpanded(false);
                  onFullAnalysis?.();
                }}
                className="flex-1 py-3 bg-white border-2 border-gray-300 
                          text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
              >
                📊 Full Analysis
              </button>
            </div>
            
            {/* Data Sources Footer */}
            <div className="px-5 py-2 bg-gray-100 text-xs text-gray-500 text-center">
              📖 Sources: NREL Solar • EIA Rates • State Utility Databases
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// INLINE WIDGET (For Wizard Step 2)
// ============================================

interface SavingsScoutInlineProps extends SavingsScoutProps {
  showNotRecommended?: boolean;
  className?: string;
}

export function SavingsScoutInline({
  state,
  industryProfile,
  peakDemandKW,
  facilityDetails,
  showNotRecommended = false,
  className = '',
}: SavingsScoutInlineProps) {
  const [showHelp, setShowHelp] = useState(false);
  
  // Calculate opportunities based on inputs
  const result = useMemo(() => 
    getSavingsScoutResult(state, peakDemandKW, industryProfile, facilityDetails),
    [state, peakDemandKW, industryProfile, facilityDetails]
  );
  
  const { opportunities, totalAnnualPotential, highPriorityCount } = result;
  
  // Filter opportunities
  const displayOpportunities = showNotRecommended 
    ? opportunities 
    : opportunities.filter(o => o.status !== 'not-recommended');
  
  return (
    <div className={`bg-white rounded-2xl border-2 border-amber-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔭</span>
            <div>
              <h3 className="font-bold text-white text-xl">Savings Scout™</h3>
              <p className="text-amber-100 text-sm">
                Based on {state} and your {facilityDetails?.rooms || 0}-room {industryProfile} profile
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            title="What's this?"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        
        {/* Help tooltip */}
        {showHelp && (
          <div className="mt-3 p-3 bg-white/20 rounded-lg text-white text-sm">
            <strong>Savings Scout™</strong> analyzes your location, utility rates, and facility 
            profile to identify the best energy savings opportunities for your business.
            All calculations are based on authoritative data sources from NREL, EIA, and state utilities.
          </div>
        )}
      </div>
      
      {/* Opportunities Grid */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {displayOpportunities.map(opportunity => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
        
        {/* Summary Stats */}
        {totalAnnualPotential > 0 && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 font-semibold">Total Estimated Annual Savings</p>
                <p className="text-xs text-emerald-600">Based on current utility rates and industry benchmarks</p>
              </div>
              <span className="text-3xl font-black text-emerald-600">
                ${totalAnnualPotential.toLocaleString()}+
              </span>
            </div>
          </div>
        )}
        
        {/* Tip */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-800">
          <strong>💡 TIP:</strong> Based on your goals, consider adding Solar + expanding EV charging 
          infrastructure to maximize your savings potential.
        </div>
      </div>
      
      {/* Data Sources Footer */}
      <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>📖 Data Sources: NREL Solar Resource • EIA Utility Rates • State Databases</span>
        <a 
          href="https://openei.org/wiki/Utility_Rate_Database" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline"
        >
          Learn more <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// ============================================
// COMPACT CARD (For Dashboard)
// ============================================

interface SavingsScoutCardProps extends SavingsScoutProps {
  onClick?: () => void;
}

export function SavingsScoutCard({
  state,
  industryProfile,
  peakDemandKW,
  facilityDetails,
  onClick,
}: SavingsScoutCardProps) {
  // Calculate opportunities based on inputs
  const result = useMemo(() => 
    getSavingsScoutResult(state, peakDemandKW, industryProfile, facilityDetails),
    [state, peakDemandKW, industryProfile, facilityDetails]
  );
  
  const { opportunities, totalAnnualPotential, highPriorityCount } = result;
  
  // Get top 3 opportunities (excluding not-recommended)
  const topOpportunities = opportunities
    .filter(o => o.status !== 'not-recommended')
    .slice(0, 3);
  
  return (
    <div 
      className="bg-gradient-to-br from-amber-50 to-white rounded-xl border-2 border-amber-200 
                 p-5 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔭</span>
          <h3 className="font-bold text-amber-900 text-lg">Savings Scout™</h3>
        </div>
        {highPriorityCount > 0 && (
          <span className="flex items-center justify-center px-3 py-1 bg-emerald-500 
                          text-white text-xs font-bold rounded-full animate-pulse">
            {highPriorityCount} opportunities
          </span>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {topOpportunities.map(opp => (
          <div key={opp.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span>{opp.icon}</span>
              <span className="text-gray-700">{opp.name}</span>
            </span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              STATUS_STYLES[opp.status].badge.bg
            } text-white`}>
              {STATUS_STYLES[opp.status].badge.text}
            </span>
          </div>
        ))}
      </div>
      
      {totalAnnualPotential > 0 && (
        <div className="pt-3 border-t border-amber-200">
          <p className="text-sm text-gray-600">Potential Annual Savings</p>
          <p className="text-xl font-black text-emerald-600">
            ${totalAnnualPotential.toLocaleString()}+
          </p>
        </div>
      )}
      
      <button className="w-full mt-4 py-2 text-amber-700 font-semibold text-sm 
                        hover:bg-amber-100 rounded-lg transition-colors">
        View Full Analysis →
      </button>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default SavingsScoutNavbar;
export { calculateSavingsOpportunities, getSavingsScoutResult };
