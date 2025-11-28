/**
 * NEW Step 4: Goals & Interests
 * Refine Power Profile based on what user cares about
 */

import React, { useState } from 'react';
import { DollarSign, TrendingUp, Leaf, Shield, Target, Zap } from 'lucide-react';

interface Step4Props {
  onNext: () => void;
  onBack: () => void;
  onUpdateGoals?: (goals: string[]) => void;
}

const GOALS = [
  {
    id: 'cost-savings',
    icon: DollarSign,
    title: 'Reduce Energy Costs',
    description: 'Cut electricity bills by 30-50%',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    id: 'revenue',
    icon: TrendingUp,
    title: 'Generate Revenue',
    description: 'Earn money through grid services',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'sustainability',
    icon: Leaf,
    title: 'Go Green',
    description: 'Reduce carbon footprint',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'reliability',
    icon: Shield,
    title: 'Backup Power',
    description: 'Ensure business continuity',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'energy-independence',
    icon: Zap,
    title: 'Energy Independence',
    description: 'Reduce grid reliance',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500'
  }
];

const Step4_GoalsAndInterests: React.FC<Step4Props> = ({
  onNext,
  onBack,
  onUpdateGoals
}) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(id => id !== goalId)
      : [...selectedGoals, goalId];
    
    setSelectedGoals(newGoals);
    if (onUpdateGoals) {
      onUpdateGoals(newGoals);
    }
  };

  const handleNext = () => {
    // Auto-scroll to bottom before proceeding
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(onNext, 300);
  };

  const canProceed = selectedGoals.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Target className="w-12 h-12 text-purple-600" />
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              What Are Your Goals?
            </h2>
            <p className="text-gray-600 mt-2">
              Select what matters most to you (choose all that apply)
            </p>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoals.includes(goal.id);

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`
                relative p-6 rounded-2xl border-2 text-left transition-all transform hover:scale-105
                ${isSelected
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl ring-4 ring-blue-200'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
              )}

              {/* Icon */}
              <div className={`
                w-16 h-16 rounded-xl flex items-center justify-center mb-4
                ${isSelected 
                  ? `bg-gradient-to-br ${goal.gradient}` 
                  : 'bg-gray-100'
                }
              `}>
                <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {goal.title}
              </h3>
              <p className="text-sm text-gray-600">
                {goal.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Goals Summary */}
      {selectedGoals.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Your Selected Goals ({selectedGoals.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedGoals.map(goalId => {
              const goal = GOALS.find(g => g.id === goalId);
              return goal ? (
                <span
                  key={goalId}
                  className={`px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r ${goal.gradient}`}
                >
                  {goal.title}
                </span>
              ) : null;
            })}
          </div>
          <p className="mt-4 text-sm text-gray-700">
            Merlin will optimize your Power Profile based on these priorities
          </p>
        </div>
      )}

      {/* Helper Text */}
      {!canProceed && (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Select at least one goal to continue
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next →
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Step4_GoalsAndInterests;
