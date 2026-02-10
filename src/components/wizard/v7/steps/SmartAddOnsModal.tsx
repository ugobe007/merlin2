/**
 * Smart Add-Ons Modal - Step 3.5
 * 
 * Appears after user completes Step 3 questionnaire.
 * Uses their goals + facility profile to recommend solar/generator/EV.
 * User says YES/NO - MagicFit handles sizing in Step 4.
 * 
 * Design: Merlin-guided recommendations with smart defaults
 */

import React from 'react';
import { X, Sun, Zap, Cable } from 'lucide-react';
import type { EnergyGoal } from '@/wizard/v7/hooks/useWizardV7';

interface SmartAddOnsModalProps {
  isOpen: boolean;
  goals: EnergyGoal[];
  industry: string;
  peakDemandKW?: number;
  
  // Current selections
  includeSolar: boolean;
  includeGenerator: boolean;
  includeEV: boolean;
  
  // Toggle handlers
  onToggleSolar: () => void;
  onToggleGenerator: () => void;
  onToggleEV: () => void;
  
  // Navigation
  onContinue: () => void;
  onSkip: () => void;
}

interface AddOnOption {
  id: 'solar' | 'generator' | 'ev';
  icon: React.ReactNode;
  name: string;
  tagline: string;
  benefit: string;
  recommended: boolean;
  recommendedReason: string;
}

/**
 * Generate smart recommendations based on goals + context
 */
function getRecommendations(
  goals: EnergyGoal[],
  industry: string,
  peakDemandKW?: number
): AddOnOption[] {
  const hasBackupGoal = goals.includes('backup_power');
  const hasIndependenceGoal = goals.includes('energy_independence');
  const hasCarbonGoal = goals.includes('reduce_carbon');
  const hasBillsGoal = goals.includes('lower_bills');
  
  const isHospital = industry === 'hospital' || industry === 'healthcare';
  const isDataCenter = industry === 'data_center' || industry === 'datacenter';
  const isCriticalInfra = isHospital || isDataCenter;
  
  return [
    {
      id: 'solar',
      icon: <Sun className="w-6 h-6" />,
      name: 'Solar Panels',
      tagline: 'Reduce grid dependence',
      benefit: 'Can offset 30-70% of daytime energy consumption',
      recommended: hasBillsGoal || hasCarbonGoal || hasIndependenceGoal,
      recommendedReason: hasCarbonGoal 
        ? 'Great for reducing carbon footprint'
        : hasBillsGoal
        ? 'Solar significantly lowers energy bills'
        : 'Supports your energy independence goals',
    },
    {
      id: 'generator',
      icon: <Zap className="w-6 h-6" />,
      name: 'Backup Generator',
      tagline: 'Extended outage protection',
      benefit: 'Provides multi-day backup power during prolonged outages',
      recommended: hasBackupGoal || isCriticalInfra,
      recommendedReason: isCriticalInfra
        ? 'Critical for hospitals/data centers'
        : hasBackupGoal
        ? 'Essential for reliable backup power'
        : 'Recommended for complete resilience',
    },
    {
      id: 'ev',
      icon: <Cable className="w-6 h-6" />,
      name: 'EV Charging',
      tagline: 'Revenue + sustainability',
      benefit: 'Charging stations can generate $20-50K+ annual revenue',
      recommended: hasCarbonGoal || hasBillsGoal,
      recommendedReason: hasCarbonGoal
        ? 'Supports fleet electrification goals'
        : 'New revenue stream from charging fees',
    },
  ];
}

export default function SmartAddOnsModal({
  isOpen,
  goals,
  industry,
  peakDemandKW,
  includeSolar,
  includeGenerator,
  includeEV,
  onToggleSolar,
  onToggleGenerator,
  onToggleEV,
  onContinue,
  onSkip,
}: SmartAddOnsModalProps) {
  if (!isOpen) return null;

  const recommendations = getRecommendations(goals, industry, peakDemandKW);
  
  const selections = {
    solar: includeSolar,
    generator: includeGenerator,
    ev: includeEV,
  };
  
  const togglers = {
    solar: onToggleSolar,
    generator: onToggleGenerator,
    ev: onToggleEV,
  };
  
  const hasAnyRecommendations = recommendations.some((opt) => opt.recommended);
  const hasSelections = includeSolar || includeGenerator || includeEV;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          
          {/* Header with Merlin Avatar */}
          <div className="relative p-6 border-b border-slate-700/50">
            {/* Close button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Merlin Avatar */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
                🧙‍♂️
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {hasAnyRecommendations 
                    ? "Based on your goals, here's what I recommend..."
                    : "Want to supercharge your system?"
                  }
                </h3>
                <p className="text-slate-400 text-sm">
                  {hasAnyRecommendations
                    ? "Select what makes sense for your facility. I'll size everything optimally."
                    : "These add-ons can increase savings and resilience. Choose what works for you."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Add-Ons Grid */}
          <div className="p-6 space-y-3">
            {recommendations.map((option) => {
              const isSelected = selections[option.id];
              const isRecommended = option.recommended;
              
              return (
                <button
                  key={option.id}
                  onClick={togglers[option.id]}
                  className={`
                    w-full text-left p-5 rounded-xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                        : isRecommended
                        ? 'border-blue-500/50 bg-blue-500/5 hover:border-blue-500/70 hover:bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <div
                      className={`
                        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : isRecommended
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700/50 text-slate-400'
                        }
                      `}
                    >
                      {option.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-lg">{option.name}</span>
                        {isRecommended && !isSelected && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                            Recommended
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30">
                            Selected ✓
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-2">{option.tagline}</p>
                      <p className="text-slate-300 text-sm font-medium">{option.benefit}</p>
                      {isRecommended && !isSelected && (
                        <p className="text-blue-400 text-xs mt-2 italic">
                          💡 {option.recommendedReason}
                        </p>
                      )}
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-slate-600 bg-slate-900'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Banner */}
          <div className="px-6 pb-4">
            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Don't worry about sizing!</span> In the next step, I'll show you 3 
                optimized system configurations (Starter / Perfect Fit / Beast Mode) with everything sized correctly 
                for your facility.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-700/50 flex items-center justify-between gap-4">
            <button
              onClick={onSkip}
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              {hasSelections ? 'Just BESS' : 'Skip for now'}
            </button>
            
            <button
              onClick={onContinue}
              className="px-8 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              {hasSelections ? `Continue with ${includeSolar ? 'Solar' : ''}${includeSolar && (includeGenerator || includeEV) ? ' + ' : ''}${includeGenerator ? 'Generator' : ''}${includeGenerator && includeEV ? ' + ' : ''}${includeEV ? 'EV' : ''} →` : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
