import React from 'react';
import type { Question } from '@/data/carwash-questions.config';
import { SECTIONS } from '@/data/carwash-questions.config';

interface ProgressSidebarProps {
  questions: Question[];
  answers: Record<string, unknown>;
  currentQuestion: Question;
  progress: number;
  onJumpToSection?: (sectionId: string) => void;
  currentWizardStep?: number; // Step 1-6 in overall wizard
  totalWizardSteps?: number;  // Usually 6
  isFirstQuestion?: boolean;  // Show welcome message if true
}

export function ProgressSidebar({
  questions,
  answers,
  currentQuestion,
  progress,
  onJumpToSection,
  currentWizardStep = 3,
  totalWizardSteps = 6,
  isFirstQuestion = false
}: ProgressSidebarProps) {
  // Calculate section progress
  const getSectionProgress = (sectionId: string) => {
    const sectionQuestions = questions.filter((q) => q.section === sectionId);
    const answeredCount = sectionQuestions.filter((q) => {
      const answer = answers[q.field];
      if (q.type === 'area_input') {
        return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
      }
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    return {
      completed: answeredCount,
      total: sectionQuestions.length,
      percentage: (answeredCount / sectionQuestions.length) * 100
    };
  };

  // Calculate estimated savings (rough estimate)
  const roofArea = answers.roofArea;
  const estimatedMonthlySavings = 
    roofArea && typeof roofArea === 'object' && 'value' in roofArea
      ? Math.round((Number((roofArea as { value: string | number }).value) * 0.65 * 0.15 * 1200 * 0.12) / 12)
      : 0;

  return (
    <div className="progress-sidebar bg-slate-900 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">
          Your Progress
        </h2>
        
        {/* Battery Progress Indicator - Visual wizard progress */}
        <BatteryProgressIndicator currentStep={currentWizardStep} />
        
        {/* Welcome Message (only for first question) - Cleaner, more concise */}
        {isFirstQuestion && (
          <div className="mt-4 p-3 bg-gradient-to-br from-purple-600/15 to-purple-600/5 border border-purple-600/30 rounded-lg">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">👋</span>
              <div>
                <p className="text-xs text-purple-200 leading-relaxed font-medium">
                  Click options to answer. Answers save automatically and you'll move forward.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Section Only - Dynamic, shows only active section */}
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        {/* Only show the current section, not all sections */}
        {(() => {
          const currentSection = SECTIONS.find(s => s.id === currentQuestion.section);
          if (!currentSection) return null;
          
          const sectionProgress = getSectionProgress(currentSection.id);
          const isComplete = sectionProgress.percentage === 100;
          
          return (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Current Section
              </h3>
              <button
                onClick={() => onJumpToSection && onJumpToSection(currentSection.id)}
                className={`
                  w-full text-left p-4 rounded-xl transition-all
                  ${isComplete
                    ? 'bg-green-500/10 border-2 border-green-500/30'
                    : 'bg-purple-500/20 border-2 border-purple-500/50'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">{currentSection.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-purple-300">
                        {currentSection.label}
                      </h4>
                      {isComplete && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      {currentSection.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`
                            h-full transition-all duration-500
                            ${isComplete ? 'bg-green-500' : 'bg-purple-500'}
                          `}
                          style={{ width: `${sectionProgress.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {sectionProgress.completed}/{sectionProgress.total}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })()}
      </div>

      {/* Merlin Assistant - Removed (now shown in main content area at top) */}

      {/* Savings Preview (if available) */}
      {estimatedMonthlySavings > 0 && (
        <div className="px-6 pb-6 border-t border-slate-800">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4">
            <div className="text-sm text-green-300 mb-2 font-semibold">
              💰 Estimated Savings
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Monthly:</span>
                <span className="text-lg font-bold text-green-400">
                  ${estimatedMonthlySavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Annual:</span>
                <span className="text-sm font-semibold text-green-300">
                  ${(estimatedMonthlySavings * 12).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">10-Year:</span>
                <span className="text-sm font-semibold text-green-300">
                  ${(estimatedMonthlySavings * 12 * 10).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Based on current inputs • Final quote in Step 6
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BATTERY PROGRESS INDICATOR
// ============================================================================

interface BatteryProgressIndicatorProps {
  currentStep: number; // 1-6 in overall wizard
}

function BatteryProgressIndicator({ currentStep }: BatteryProgressIndicatorProps) {
  // M-E-R-L-I-N (6 letters for 6 steps)
  const steps = [
    { number: 6, label: 'Quote', short: 'N', color: '#8b5cf6' },
    { number: 5, label: 'System', short: 'I', color: '#06b6d4' },
    { number: 4, label: 'Options', short: 'L', color: '#10b981' },
    { number: 3, label: 'Details', short: 'R', color: '#3b82f6' },
    { number: 2, label: 'Industry', short: 'E', color: '#f59e0b' },
    { number: 1, label: 'Location', short: 'M', color: '#ef4444' }
  ];

  // Calculate fill percentage (Step 1 = 0%, Step 6 = 100%)
  const fillPercentage = ((currentStep - 1) / 5) * 100;

  // Get step color
  const getStepColor = (step: number) => {
    if (step < currentStep) return steps.find(s => s.number === step)?.color || '#10b981'; // Completed (use step color)
    if (step === currentStep) return '#3b82f6'; // Current (blue)
    return '#475569'; // Upcoming (gray)
  };

  // Build gradient stops for the fill
  const gradientStops = steps.map((step, index) => {
    const percentage = (index / 5) * 100;
    const color = getStepColor(step.number);
    return `${color} ${percentage}%`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center">
      {/* Battery Container */}
      <div className="relative w-20 h-56 bg-slate-800/50 rounded-lg border-2 border-slate-600 overflow-hidden shadow-inner">
        {/* Battery Fill (from bottom to top, like charging) */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{
            height: `${fillPercentage}%`,
            background: `linear-gradient(to top, ${gradientStops})`,
            boxShadow: `0 0 30px ${getStepColor(currentStep)}60, inset 0 0 15px rgba(255,255,255,0.15)`,
            filter: `drop-shadow(0 0 8px ${getStepColor(currentStep)}40)`
          }}
        />
        
        {/* Step Dividers and Labels */}
        <div className="absolute inset-0 flex flex-col">
          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;
            const stepHeight = 100 / 6; // Each step takes 1/6 of the height
            
            return (
              <React.Fragment key={step.number}>
                {/* Step Segment */}
                <div
                  className={`
                    flex-1 flex items-center justify-center relative
                    transition-all duration-300
                    ${isActive 
                      ? 'bg-blue-500/20' 
                      : isCompleted
                      ? 'bg-green-500/10'
                      : ''
                    }
                  `}
                  style={{ minHeight: `${stepHeight}%` }}
                >
                  {/* Step Label */}
                  <div
                    className={`
                      w-full h-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${isActive 
                        ? 'text-blue-200 scale-110' 
                        : isCompleted
                        ? 'text-green-300'
                        : 'text-slate-500'
                      }
                    `}
                    title={step.label}
                  >
                    {step.short}
                  </div>
                  
                  {/* Divider (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-700/50" />
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* Battery Terminal (top - positive terminal) */}
      <div className="w-6 h-3 bg-slate-600 rounded-t border-2 border-slate-700 border-b-0" />
      
      {/* Current Step Label */}
      <div className="mt-4 text-center">
        <div className="text-sm font-bold text-white mb-1">
          Step {currentStep} of 6
        </div>
        <div className="text-xs text-slate-400">
          {steps.find(s => s.number === currentStep)?.label}
        </div>
        {/* Progress Percentage */}
        <div className="mt-2 text-xs text-purple-300 font-semibold">
          {Math.round(fillPercentage)}% Complete
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MERLIN ASSISTANT
// ============================================================================

function MerlinAssistant({ 
  currentQuestion, 
  estimatedSavings 
}: { 
  currentQuestion: Question;
  estimatedSavings: number;
}) {
  const getTipForQuestion = () => {
    if (currentQuestion.merlinTip) {
      return currentQuestion.merlinTip;
    }

    // Fallback tips based on section
    const fallbackTips: Record<string, string> = {
      facility: "I'm here to help you provide the details about your facility. Don't worry about being exact - we'll verify everything later!",
      operations: "Understanding your operating patterns helps me recommend the perfect solar + storage system sized for your actual usage.",
      energy: "These energy systems are where we'll find the biggest savings opportunities. Electric equipment pairs perfectly with solar!",
      solar: "This is where it gets exciting! I'll calculate your solar potential in real-time using industry-standard formulas."
    };

    return fallbackTips[currentQuestion.section] || "Take your time answering. I'm calculating everything in the background to give you accurate recommendations.";
  };

  return (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
      <div className="flex gap-3">
        {/* Merlin Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
            🧙‍♂️
          </div>
        </div>

        {/* Tip Content */}
        <div className="flex-1 min-w-0">
          <div className="text-purple-300 text-xs font-semibold mb-1 uppercase tracking-wide">
            Merlin's Guidance
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {getTipForQuestion()}
          </p>

          {/* Progress Encouragement */}
          {estimatedSavings > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <p className="text-xs text-purple-300">
                💡 Great progress! You're on track to save ${estimatedSavings.toLocaleString()}/month with solar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
