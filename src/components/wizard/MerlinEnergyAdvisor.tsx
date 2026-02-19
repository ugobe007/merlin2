import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import type { Question } from '@/data/carwash-questions.config';
import { SECTIONS } from '@/data/carwash-questions.config';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';

interface MerlinEnergyAdvisorProps {
  currentQuestion: Question;
  questions: Question[];
  answers: Record<string, unknown>;
  currentQuestionIndex: number;
  visibleQuestionsLength: number;
}

export function MerlinEnergyAdvisor({
  currentQuestion,
  questions,
  answers,
  currentQuestionIndex,
  visibleQuestionsLength
}: MerlinEnergyAdvisorProps) {
  // Calculate answered questions count
  const answeredCount = questions.filter((q) => {
    const answer = answers[q.field];
    if (q.type === 'area_input') {
      return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
    }
    return answer !== undefined && answer !== null && answer !== '';
  }).length;

  // Calculate overall progress based on answered questions
  const overallProgress = visibleQuestionsLength > 0 
    ? ((answeredCount / visibleQuestionsLength) * 100)
    : 0;
  const questionsAnswered = answeredCount;

  // Calculate section progress
  const getSectionProgress = (sectionId: string) => {
    const sectionQuestions = questions.filter((q) => q.section === sectionId);
    const currentSectionIndex = sectionQuestions.findIndex((q) => q.id === currentQuestion.id);
    return {
      current: currentSectionIndex + 1,
      total: sectionQuestions.length,
      percentage: ((currentSectionIndex + 1) / sectionQuestions.length) * 100
    };
  };

  const sectionProgress = getSectionProgress(currentQuestion.section);
  const currentSection = SECTIONS.find((s) => s.id === currentQuestion.section);

  // Generate dynamic message based on current question
  const getDynamicMessage = (): string => {
    // Use merlinTip if available, otherwise generate contextual message
    if (currentQuestion.merlinTip) {
      return currentQuestion.merlinTip;
    }

    // Contextual messages by question type
    switch (currentQuestion.field) {
      case 'facilityType':
        return '✨ Great start! Let\'s understand your car wash type to optimize energy recommendations.';
      case 'tunnelCount':
      case 'bayCount':
        return '✨ Tunnel systems have high throughput. Let\'s confirm your bay count.';
      case 'operatingHours':
        return '✨ Operating hours help us understand your energy demand profile.';
      case 'daysPerWeek':
        return '✨ Days per week affect your total energy consumption and savings potential.';
      case 'dailyVehicles':
        return '✨ Vehicle volume impacts your peak demand and battery sizing needs.';
      case 'roofArea':
        return '✨ Roof area determines your solar potential and renewable energy capacity.';
      case 'carportInterest':
        return '✨ Carports offer additional solar capacity while providing shade for vehicles.';
      default:
        return '✨ Let\'s continue gathering information to tailor your energy solution.';
    }
  };

  // Generate pro tip based on current question
  const getProTip = (): string => {
    switch (currentQuestion.field) {
      case 'facilityType':
        return 'Express tunnels typically see 15-25% energy savings with BESS!';
      case 'tunnelCount':
      case 'bayCount':
        return 'More bays = more savings potential with load balancing.';
      case 'operatingHours':
        return 'Extended hours increase demand charges - BESS can shave these peaks.';
      case 'dailyVehicles':
        return 'Higher volume facilities benefit most from peak shaving strategies.';
      case 'roofArea':
        return 'Solar + storage maximizes ROI by reducing both energy and demand charges.';
      case 'carportInterest':
        return 'Carport solar can generate 2-3x more than roof-mounted systems.';
      case 'waterHeaterType':
        return 'Electric water heaters pair perfectly with solar - reduce 40-60% of heating costs.';
      case 'pumpConfiguration':
        return 'VFD pumps save 20-40% energy vs constant speed systems.';
      default:
        return 'Every detail helps Merlin calculate the optimal energy solution for your facility.';
    }
  };

  const [showTrueQuoteCalculator, setShowTrueQuoteCalculator] = useState(false);

  // Only show merlinTip if it exists and is meaningful (not generic fluff)
  const hasActionableTip = currentQuestion.merlinTip && 
    !currentQuestion.merlinTip.includes('Let\'s continue gathering') &&
    !currentQuestion.merlinTip.includes('Every detail helps');

  // Get actionable pro tip (only if it's specific, not generic)
  const actionableProTip = getProTip();
  const hasActionableProTip = actionableProTip && 
    !actionableProTip.includes('Every detail helps') &&
    actionableProTip.length < 100; // Keep it concise

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-2 border-purple-500/30 rounded-xl p-4 mb-4 shadow-lg shadow-purple-500/10">
      {/* Compact Header with Wizard Icon */}
      <div className="flex items-start gap-3">
        <img src="/images/new_profile_merlin.png" alt="Merlin" className="w-10 h-10 rounded-full border border-purple-400/30 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
              Merlin's Guidance
            </h3>
            
            {/* TrueQuote Badge with Calculator Icon - Fixed: Changed button to div to avoid nested button */}
            <div
              onClick={() => setShowTrueQuoteCalculator(!showTrueQuoteCalculator)}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all group cursor-pointer"
              title="View TrueQuote calculations"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTrueQuoteCalculator(!showTrueQuoteCalculator);
                }
              }}
            >
              <span className="text-xs font-bold text-amber-500">TrueQuote</span>
              <span className="text-xs font-bold text-amber-400">™</span>
              <Calculator className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
              {showTrueQuoteCalculator ? (
                <ChevronUp className="w-3 h-3 text-amber-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>
          
          {/* Merlin's Explanation */}
          <p className="text-white text-xs leading-relaxed mb-2">
            I'm calculating your maximum savings potential. The Value Tracker above shows real-time savings as you answer questions. Click <span className="text-amber-400 font-semibold">TrueQuote™</span> to verify the calculations.
          </p>
          
          {/* Only show actionable tips - no fluff */}
          {hasActionableTip && (
            <p className="text-white text-sm leading-relaxed mb-2">
              {currentQuestion.merlinTip}
            </p>
          )}
          
          {hasActionableProTip && (
            <div className="bg-purple-500/10 border-l-2 border-purple-400/40 pl-3 py-1.5 rounded mb-2">
              <p className="text-purple-200 text-xs leading-relaxed">
                {actionableProTip}
              </p>
            </div>
          )}
          
          {/* If no actionable tips, show minimal progress only */}
          {!hasActionableTip && !hasActionableProTip && (
            <p className="text-slate-400 text-xs">
              Question {currentQuestionIndex + 1} of {visibleQuestionsLength}
            </p>
          )}

          {/* TrueQuote Calculator - Expandable */}
          {showTrueQuoteCalculator && (
            <div className="mt-4 p-4 bg-slate-900/50 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrueQuoteBadge size="sm" variant="default" />
                <h4 className="text-sm font-bold text-white">How TrueQuote Works</h4>
              </div>
              
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <p className="font-semibold text-amber-400 mb-1">Real-Time Calculations:</p>
                  <p className="leading-relaxed">
                    As you answer questions, Merlin calculates savings using industry-standard formulas from NREL, EIA, and verified vendor pricing.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-amber-400 mb-1">Value Tracker Proof:</p>
                  <p className="leading-relaxed">
                    The Value Tracker above updates in real-time, showing how your choices affect:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                    <li>Annual Savings (energy + demand charge reduction)</li>
                    <li>5-Year Projection (with 3% annual rate increases)</li>
                    <li>Payback Period (time to break even)</li>
                    <li>Cost of Inaction (what you lose without a system)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-amber-400 mb-1">Verified Sources:</p>
                  <p className="leading-relaxed text-slate-400">
                    All calculations use NREL ATB 2024 pricing, EIA utility rates, and IRS tax credit data. This ensures accuracy and transparency.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Current Question Indicator - Moved here from main content area */}
      <div className="mt-4 pt-4 border-t border-purple-500/20">
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {currentQuestionIndex + 1}
              </div>
              <div>
                <div className="text-xs text-purple-300 uppercase tracking-wider font-semibold">
                  Question {currentQuestionIndex + 1} of {visibleQuestionsLength}
                </div>
                <div className="text-xs text-slate-400">
                  {Math.round(overallProgress)}% Complete
                </div>
              </div>
            </div>
            <div className="text-xs text-purple-400 font-semibold">
              {currentSection?.label || currentQuestion.section}
            </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
