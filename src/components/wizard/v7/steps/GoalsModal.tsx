/**
 * Goals Modal - Step 1B
 * 
 * Appears after user confirms location in Step 1.
 * User selects their energy goals before proceeding to industry selection.
 * 
 * Design: Merlin-guided conversational modal with multi-select checkboxes
 */

import React from 'react';
import { X } from 'lucide-react';

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
    description: 'Reduce monthly electricity costs through peak shaving and arbitrage',
  },
  {
    id: 'backup_power',
    emoji: '🔋',
    label: 'Backup Power',
    description: 'Keep operations running during grid outages and emergencies',
  },
  {
    id: 'reduce_carbon',
    emoji: '♻️',
    label: 'Reduce Carbon Footprint',
    description: 'Lower emissions and support sustainability goals',
  },
  {
    id: 'energy_independence',
    emoji: '⚡',
    label: 'Energy Independence',
    description: 'Reduce reliance on the grid and control your own power',
  },
  {
    id: 'reduce_demand_charges',
    emoji: '🎯',
    label: 'Reduce Demand Charges',
    description: 'Lower peak demand fees and utility penalties',
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          
          {/* Header with Merlin Avatar */}
          <div className="relative p-6 border-b border-slate-700/50">
            {/* Close button (top-right) */}
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
                  Great! Now help me understand your goals.
                </h3>
                <p className="text-slate-400 text-sm">
                  Select all that apply — this helps me recommend the right system for you
                </p>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="p-6 space-y-3">
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              
              return (
                <button
                  key={goal.id}
                  onClick={() => onToggleGoal(goal.id)}
                  className={`
                    w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
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

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{goal.emoji}</span>
                        <span className="text-white font-semibold">{goal.label}</span>
                      </div>
                      <p className="text-slate-400 text-sm">{goal.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-700/50 flex items-center justify-between gap-4">
            <button
              onClick={onSkip}
              className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
            
            <button
              onClick={onContinue}
              disabled={selectedGoals.length === 0}
              className={`
                px-8 py-3 rounded-xl font-semibold transition-all
                ${
                  selectedGoals.length > 0
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }
              `}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
