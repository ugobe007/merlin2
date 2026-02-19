import React from 'react';
import type { Question } from '@/data/carwash-questions.config';
import { SECTIONS } from '@/data/carwash-questions.config';

interface ProgressSidebarProps {
  questions: Question[];
  answers: Record<string, unknown>;
  currentQuestion: Question;
  progress: number;
  onJumpToSection?: (sectionId: string) => void;
}

export function ProgressSidebar({
  questions,
  answers,
  currentQuestion,
  progress,
  onJumpToSection
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
        <h2 className="text-xl font-bold text-white mb-1">
          Your Progress
        </h2>
        <p className="text-sm text-slate-400">
          Step 3: Use Case Details
        </p>
      </div>

      {/* Progress Ring */}
      <div className="p-6 flex justify-center">
        <HeatMapProgressRing progress={progress} />
      </div>

      {/* Section Checklist */}
      <div className="px-6 pb-6 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Sections
        </h3>
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const sectionProgress = getSectionProgress(section.id);
            const isCurrentSection = currentQuestion.section === section.id;
            const isComplete = sectionProgress.percentage === 100;

            return (
              <button
                key={section.id}
                onClick={() => onJumpToSection && onJumpToSection(section.id)}
                className={`
                  w-full text-left p-4 rounded-xl transition-all
                  ${isCurrentSection
                    ? 'bg-purple-500/20 border-2 border-purple-500/50'
                    : isComplete
                    ? 'bg-green-500/10 border-2 border-green-500/30 hover:bg-green-500/15'
                    : 'bg-slate-800 border-2 border-slate-700 hover:bg-slate-750'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">{section.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-semibold text-sm ${isCurrentSection ? 'text-purple-300' : 'text-white'}`}>
                        {section.label}
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
                      {section.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`
                            h-full transition-all duration-500
                            ${isComplete
                              ? 'bg-green-500'
                              : isCurrentSection
                              ? 'bg-purple-500'
                              : 'bg-slate-600'
                            }
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
            );
          })}
        </div>
      </div>

      {/* Merlin Assistant */}
      <div className="px-6 pb-6 border-t border-slate-800 pt-6">
        <MerlinAssistant
          currentQuestion={currentQuestion}
          estimatedSavings={estimatedMonthlySavings}
        />
      </div>

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
// HEAT-MAP PROGRESS RING
// ============================================================================

function HeatMapProgressRing({ progress }: { progress: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Color based on progress (Red → Yellow → Green)
  const getColor = (progress: number) => {
    if (progress < 33) {
      return '#ef4444'; // Red
    } else if (progress < 66) {
      return '#f59e0b'; // Amber/Yellow
    } else {
      return '#10b981'; // Green
    }
  };

  const color = getColor(progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="160" height="160" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="rgb(30 41 59)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-white">
          {Math.round(progress)}%
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Complete
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
          <img src="/images/new_profile_merlin.png" alt="Merlin" className="w-12 h-12 rounded-full shadow-lg shadow-purple-500/30" />
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
