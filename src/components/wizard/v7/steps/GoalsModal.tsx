/**
 * Goals Modal - Step 1B
 * 
 * Appears after user confirms location in Step 1.
 * User selects their energy goals before proceeding to industry selection.
 * 
 * Design: Professional Merlin-guided modal with proper wizard icon
 */

import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';

export type EnergyGoal = 
  | 'lower_bills'
  | 'backup_power'
  | 'reduce_carbon'
  | 'energy_independence'
  | 'reduce_demand_charges';

interface GoalsModalProps {
  isOpen: boolean;
  selectedGoals: EnergyGoal[];
  onToggleGoal: (goal: EnergyGoal) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const GOAL_OPTIONS: Array<{ id: EnergyGoal; emoji: string; label: string; description: string }> = [
  {
    id: 'lower_bills',
    emoji: '💰',
    label: 'Lower Energy Bills',
    description: 'Reduce monthly electricity costs',
  },
  {
    id: 'backup_power',
    emoji: '🔋',
    label: 'Backup Power',
    description: 'Stay operational during outages',
  },
  {
    id: 'reduce_carbon',
    emoji: '♻️',
    label: 'Reduce Carbon Footprint',
    description: 'Meet sustainability targets',
  },
  {
    id: 'energy_independence',
    emoji: '⚡',
    label: 'Energy Independence',
    description: 'Control your own power supply',
  },
  {
    id: 'reduce_demand_charges',
    emoji: '🎯',
    label: 'Reduce Demand Charges',
    description: 'Lower peak demand penalties',
  },
];

export default function GoalsModal({
  isOpen,
  selectedGoals,
  onToggleGoal,
  onContinue,
  onSkip,
}: GoalsModalProps) {
  if (!isOpen) return null;

  const canContinue = selectedGoals.length > 0;

  return (
    <>
      {/* Backdrop - clickable to close */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998] animate-in fade-in duration-300"
        onClick={onSkip}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border-2 border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 max-w-3xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header with Gradient Background */}
          <div className="relative p-8 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-blue-600/10 border-b border-purple-500/20">
            {/* Close button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all hover:scale-110"
              aria-label="Skip"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Merlin Avatar - Proper Wizard Hat Icon */}
            <div className="flex items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/50 ring-4 ring-purple-500/20">
                  {/* Custom Wizard Hat SVG */}
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Hat body */}
                    <path d="M12 2L2 22h20L12 2z" fill="currentColor" opacity="0.3"/>
                    <path d="M12 2L2 22h20L12 2z"/>
                    {/* Stars on hat */}
                    <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="9" cy="14" r="1" fill="currentColor" opacity="0.7"/>
                    <circle cx="15" cy="13" r="0.8" fill="currentColor" opacity="0.7"/>
                    <circle cx="12" cy="16" r="0.6" fill="currentColor" opacity="0.5"/>
                  </svg>
                </div>
                {/* Sparkle effect */}
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              
              <div className="flex-1 pt-1">
                <h3 className="text-4xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-3 leading-tight">
                  What are your energy goals?
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  Select all that apply. I'll use this to recommend the perfect system configuration for your needs.
                </p>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="p-8 space-y-3 overflow-y-auto max-h-[50vh]">
            {GOAL_OPTIONS.map((option) => {
              const isSelected = selectedGoals.includes(option.id);
              
              return (
                <button
                  key={option.id}
                  onClick={() => onToggleGoal(option.id)}
                  className={`
                    group w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 scale-[1.02]'
                        : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50 hover:bg-slate-800 hover:scale-[1.01]'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Emoji Icon Circle */}
                    <div
                      className={`
                        flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all
                        ${
                          isSelected
                            ? 'bg-purple-500 shadow-lg shadow-purple-500/30'
                            : 'bg-slate-700/50 group-hover:bg-slate-700'
                        }
                      `}
                    >
                      {option.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {option.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {option.description}
                      </p>
                    </div>

                    {/* Checkmark */}
                    <div
                      className={`
                        flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all
                        ${
                          isSelected
                            ? 'border-purple-400 bg-purple-500 shadow-lg shadow-purple-500/30'
                            : 'border-slate-600 bg-slate-900/50 group-hover:border-slate-500'
                        }
                      `}
                    >
                      {isSelected && (
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between gap-4">
            <button
              onClick={onSkip}
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors text-base font-medium"
            >
              Skip for now
            </button>
            
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`
                px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg
                ${
                  canContinue
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                }
              `}
            >
              {canContinue ? (
                <>
                  Continue with {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} →
                </>
              ) : (
                'Select at least one goal'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
