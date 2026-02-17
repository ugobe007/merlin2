import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sun } from 'lucide-react';
import type { Question } from '@/data/carwash-questions.config';
import { SECTIONS } from '@/data/carwash-questions.config';
import merlinProfileImage from '@/assets/images/new_small_profile_.png';

interface MerlinAdvisorPanelProps {
  currentQuestion?: Question; // Optional for Steps 4 and 5
  questions?: Question[]; // Optional for Steps 4 and 5
  answers?: Record<string, unknown>; // Optional for Steps 4 and 5
  currentQuestionIndex?: number; // Optional for Steps 4 and 5
  visibleQuestionsLength?: number; // Optional for Steps 4 and 5
  currentWizardStep?: number;
  totalWizardSteps?: number;
  onJumpToSection?: (sectionId: string) => void;
  onCollapseChange?: (isCollapsed: boolean) => void; // Callback to notify parent of collapse state
  defaultCollapsed?: boolean; // Start collapsed by default (for Steps 4 and 5)
  stepGuidance?: string; // Custom guidance message for steps without questions
}

export function MerlinAdvisorPanel({
  currentQuestion,
  questions = [],
  answers = {},
  currentQuestionIndex = 0,
  visibleQuestionsLength = 0,
  currentWizardStep = 3,
  totalWizardSteps = 6,
  onJumpToSection,
  onCollapseChange,
  defaultCollapsed = false,
  stepGuidance
}: MerlinAdvisorPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Check if this is a step with questions (Step 3) or without (Steps 4, 5)
  const hasQuestions = questions.length > 0 && currentQuestion;

  // Notify parent of collapse state changes
  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  };

  // Calculate answered questions count (only if questions exist)
  const answeredCount = hasQuestions ? questions.filter((q) => {
    const answer = answers[q.field];
    if (q.type === 'area_input') {
      return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
    }
    return answer !== undefined && answer !== null && answer !== '';
  }).length : 0;

  // Calculate overall progress
  const overallProgress = hasQuestions && visibleQuestionsLength > 0 
    ? ((answeredCount / visibleQuestionsLength) * 100)
    : ((currentWizardStep / totalWizardSteps) * 100); // For Steps 4, 5, use wizard step progress

  // Calculate section progress (only if questions exist)
  const getSectionProgress = (sectionId: string) => {
    if (!hasQuestions) return { completed: 0, total: 0, percentage: 0 };
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

  const currentSection = hasQuestions && currentQuestion ? SECTIONS.find((s) => s.id === currentQuestion.section) : null;
  const sectionProgress = hasQuestions && currentQuestion ? getSectionProgress(currentQuestion.section) : { completed: 0, total: 0, percentage: 0 };

  // Get Merlin tip for current question or step
  const getMerlinTip = (): string => {
    // If custom step guidance provided, use it
    if (stepGuidance) {
      return stepGuidance;
    }
    
    // If step has questions, use question-based tips
    if (hasQuestions && currentQuestion) {
      // Use merlinTip if available, otherwise generate contextual message
      if (currentQuestion.merlinTip) {
        return currentQuestion.merlinTip;
      }

      // Contextual messages by section
      const sectionTips: Record<string, string> = {
        facility: "✨ Great start! Let's understand your facility type to optimize energy recommendations.",
        operations: "✨ Operating patterns help us understand your energy demand profile.",
        energy: "✨ Energy systems are where we'll find the biggest savings opportunities.",
        equipment: "✨ Equipment details help me calculate your exact power requirements.",
        solar: "✨ This is where it gets exciting! I'll calculate your solar potential in real-time."
      };

      return sectionTips[currentQuestion.section] || "✨ Let's continue gathering information to tailor your energy solution.";
    }
    
    // Step-specific guidance for Steps 4 and 5
    const stepTips: Record<number, string> = {
      4: "✨ Now let's explore opportunities! Solar, EV charging, and backup generators can maximize your ROI and energy independence.",
      5: "✨ Almost there! Choose your power level based on your needs. Perfect Fit is our recommendation for the best balance of savings and investment."
    };
    
    return stepTips[currentWizardStep] || "✨ I'm here to guide you through your energy journey. Let me know if you need help!";
  };

  // Check if solar question (for sun icon)
  const isSolarQuestion = hasQuestions && currentQuestion ? (
    currentQuestion.section === 'solar' || 
    currentQuestion.field === 'roofArea' || 
    currentQuestion.field === 'carportInterest'
  ) : currentWizardStep === 4; // Step 4 is about options including solar


  // Collapsed state - just a button
  if (isCollapsed) {
    return (
      <div className="fixed top-40 left-0 z-30">
      <button
        onClick={() => handleCollapse(false)}
          className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-r-2xl shadow-2xl border border-purple-500/30 flex items-center justify-center hover:scale-105 transition-all group"
          title="Open Merlin Advisor"
        >
          <img 
            src={merlinProfileImage}
            alt="Merlin"
            className="w-10 h-10 rounded-full object-cover group-hover:scale-110 transition-transform"
          />
          <ChevronRight className="absolute -right-2 w-5 h-5 text-purple-300 bg-slate-800 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  // Expanded state - full panel
  return (
    <div 
      className="fixed top-40 left-0 z-30 w-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-r-2xl shadow-2xl border-r border-b border-t border-purple-500/30 overflow-hidden transition-all duration-300"
      style={{ maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => handleCollapse(true)}
        className="absolute top-4 right-4 w-8 h-8 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
        title="Collapse panel"
      >
        <ChevronLeft className="w-4 h-4 text-slate-300" />
      </button>

      <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {/* Header - Merlin Avatar & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-500/60 flex items-center justify-center relative shrink-0 overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
            }}
          >
            <img 
              src={merlinProfileImage}
              alt="Merlin AI Energy Advisor"
              className="w-full h-full object-cover rounded-full"
            />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 z-10" 
              style={{
                boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-1" style={{ textShadow: '0 2px 10px rgba(168, 85, 247, 0.3)' }}>
              Merlin Advisor
            </h2>
            <p className="text-xs text-slate-400">Your Energy Guide</p>
          </div>
        </div>

        {/* Merlin Tip Section */}
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            {isSolarQuestion ? (
              <Sun className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">✨</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                {isSolarQuestion ? 'Solar Opportunity' : 'Current Tip'}
              </h3>
              <p className="text-sm text-white leading-relaxed">
                {getMerlinTip()}
              </p>
            </div>
          </div>
        </div>

        {/* Current Question Info (only show if questions exist) */}
        {hasQuestions && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 border border-purple-500/50 flex items-center justify-center font-bold text-sm text-purple-300">
                  {currentQuestionIndex + 1}
                </div>
                <div>
                  <div className="text-xs text-slate-400">Question</div>
                  <div className="text-sm font-semibold text-white">
                    {currentQuestionIndex + 1} of {visibleQuestionsLength}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Progress</div>
                <div className="text-sm font-semibold text-purple-300">
                  {Math.round(overallProgress)}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Progress (for Steps 4 and 5 without questions) */}
        {!hasQuestions && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <div className="text-center mb-3">
              <div className="text-xs text-slate-400 mb-1">Wizard Progress</div>
              <div className="text-sm font-semibold text-white">
                Step {currentWizardStep} of {totalWizardSteps}
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Section Progress (only show if questions exist) */}
        {hasQuestions && currentSection && (
          <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                {currentSection.label}
              </h3>
              <div className="text-xs text-slate-400">
                {sectionProgress.completed} / {sectionProgress.total}
              </div>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${sectionProgress.percentage}%` }}
              />
            </div>
            {onJumpToSection && currentQuestion && (
              <button
                onClick={() => onJumpToSection(currentQuestion.section)}
                className="mt-3 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Jump to section →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}