/**
 * Goals Modal - Step 1B
 * 
 * Appears after user confirms location in Step 1.
 * User selects their energy goals before proceeding to industry selection.
 * 
 * Design: Clean, professional modal with actual Merlin wizard icon
 */

import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import merlinIcon from '@/assets/images/new_small_profile_.png';

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
  // ✅ Focus primary button when modal opens (accessibility + mobile UX)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const primary = document.getElementById("goals-primary");
        if (primary) primary.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canContinue = selectedGoals.length > 0;

  // Trace wrapper to debug who is calling onSkip
  const handleSkip = () => {
    console.trace('[GoalsModal] onSkip fired');
    onSkip();
  };

  return (
    <>
      {/* Backdrop (visual only, never clickable) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] pointer-events-none" />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
          
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-slate-800">
            {/* Close button */}
            <button
              onClick={handleSkip}
              type="button"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Skip goals"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Merlin + Headline */}
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={merlinIcon} 
                alt="Merlin" 
                className="w-16 h-16 rounded-xl"
              />
              <div>
                <h2 className="text-3xl font-bold text-white">
                  What are your energy goals?
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Select all that apply
                </p>
              </div>
            </div>
          </div>

          {/* Goals List */}
          <div className="p-6 space-y-3 overflow-y-auto max-h-[50vh]">
            {GOAL_OPTIONS.map((option) => {
              const isSelected = selectedGoals.includes(option.id);
              
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (typeof onToggleGoal !== "function") {
                      console.error("[GoalsModal] onToggleGoal missing", { onToggleGoal });
                      return;
                    }
                    onToggleGoal(option.id);
                  }}
                  className={`
                    w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Emoji */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xl
                      ${isSelected ? 'bg-blue-500' : 'bg-slate-700'}
                    `}>
                      {option.emoji}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-0.5">
                        {option.label}
                      </div>
                      <div className="text-sm text-slate-400">
                        {option.description}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className={`
                      flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center
                      ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}
                    `}>
                      {isSelected && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleSkip}
              className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors"
            >
              Skip
            </button>
            
            <button
              id="goals-primary"
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className={`
                px-6 py-2.5 rounded-lg font-semibold transition-all
                ${
                  canContinue
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }
              `}
              aria-label={canContinue ? "Continue to industry selection" : "Select at least one goal"}
            >
              {canContinue ? (
                'Continue → Industry'
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
