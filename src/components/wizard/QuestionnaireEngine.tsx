import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { QuestionRenderer } from './QuestionRenderer';
import { SolarPreviewCard } from './SolarPreviewCard';
import type { Question } from '@/data/carwash-questions.config';

interface QuestionnaireEngineProps {
  questions: Question[];
  industry: string;
  initialValues?: Record<string, unknown>;
  onComplete: (answers: Record<string, unknown>) => void;
  onProgressUpdate?: (progress: number) => void;
  onQuestionChange?: (question: Question, progress: number, questionIndex: number, totalVisible: number) => void;
  onAnswerUpdate?: (answers: Record<string, unknown>) => void;
  onJumpToSection?: (sectionId: string) => void;
}

export function QuestionnaireEngine({
  questions,
  industry,
  initialValues = {},
  onComplete,
  onProgressUpdate,
  onQuestionChange,
  onAnswerUpdate,
  onJumpToSection
}: QuestionnaireEngineProps) {
  // CRITICAL FIX: Only initialize answers once on mount, don't reset when initialValues changes
  // This prevents infinite loops when initialValues changes due to state updates from handleAnswerUpdate
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialValues);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [nextQuestionNotification, setNextQuestionNotification] = useState<{ message: string; question: Question | null } | null>(null);
  const [isUserAdjusting, setIsUserAdjusting] = useState(false); // Track if user is actively adjusting (smart input +/-)
  const [userAnsweredQuestions, setUserAnsweredQuestions] = useState<Set<string>>(new Set()); // Track which questions user has explicitly answered
  const questionRef = useRef<HTMLDivElement>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isAdjustingRef = useRef(false); // CRITICAL: Use ref for synchronous checking (state updates are async)
  
  // Sync ref with state for use in callbacks
  const setIsUserAdjustingSync = (value: boolean) => {
    isAdjustingRef.current = value;
    setIsUserAdjusting(value);
  };

  // Get filtered questions (based on showIf conditions)
  const visibleQuestions = questions.filter((question) => {
    if (!question.showIf) return true;
    return question.showIf(answers);
  });

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;

  // Update progress callback
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
    if (onQuestionChange && currentQuestion) {
      onQuestionChange(currentQuestion, progress, currentQuestionIndex, visibleQuestions.length);
    }
  }, [progress, currentQuestion, currentQuestionIndex, visibleQuestions.length, onProgressUpdate, onQuestionChange]);

  // Update answers callback - SIMPLIFIED: Only call when answers actually change
  // Use a ref to track if we've already called the callback for this answer set
  const lastCallbackRef = useRef<string>('');
  
  useEffect(() => {
    // Create a stable key from answers to detect actual changes
    const answersKey = JSON.stringify(answers);
    
    // Only call callback if answers actually changed
    if (answersKey !== lastCallbackRef.current && onAnswerUpdate) {
      lastCallbackRef.current = answersKey;
      // Call immediately - no debouncing needed if we're checking for actual changes
      onAnswerUpdate(answers);
    }
  }, [answers, onAnswerUpdate]);

  // DISABLED: Auto-advance completely disabled - users must manually click Continue button
  // This prevents premature advancement when adjusting sliders or number inputs
  // The Continue button in the footer will be highlighted when questions are answered
  useEffect(() => {
    // Clear any existing timer - auto-advance is disabled
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    return undefined;
  }, [answers, currentQuestion]);

  // Handle answer change
  const handleAnswer = (field: string, value: unknown) => {
    // CRITICAL FIX: Only mark as user-answered if NOT currently adjusting
    // Use ref for synchronous check (state updates are async and might not be ready yet)
    const isAdjusting = isAdjustingRef.current;
    
    if (!isAdjusting) {
      setUserAnsweredQuestions(prev => new Set(prev).add(field));
      console.log(`✅ Marked question "${field}" as answered by user`);
      
      // CRITICAL FIX: Only show next question notification if NOT adjusting
      // Show next question notification only when user has finished adjusting
      if (!isLastQuestion) {
        const nextQuestion = visibleQuestions[currentQuestionIndex + 1];
        if (nextQuestion) {
          // Extract what to select from next question text
          const nextQuestionText = nextQuestion.question.toLowerCase();
          let notificationMessage = 'Next question';
          
          // Try to extract "number of X" from question text
          const numberMatch = nextQuestionText.match(/number of (.+?)(\?|$)/);
          if (numberMatch) {
            notificationMessage = `Next, select number of ${numberMatch[1]}`;
          } else if (nextQuestionText.includes('how many')) {
            const howManyMatch = nextQuestionText.match(/how many (.+?)(\?|$)/);
            if (howManyMatch) {
              notificationMessage = `Next, select number of ${howManyMatch[1]}`;
            }
          }
          
          setNextQuestionNotification({
            message: notificationMessage,
            question: nextQuestion
          });
          
          // Don't auto-dismiss - user must click Next or close button
        }
      }
    } else {
      console.log(`🚫 Question "${field}" NOT marked as answered - user is adjusting (notification blocked)`);
    }
    
    // Always update the answer value (even while adjusting, so UI reflects changes)
    const updatedAnswers = {
      ...answers,
      [field]: value
    };
    setAnswers(updatedAnswers);
    setShowValidation(false);
    
    // CRITICAL FIX: Don't call onAnswerUpdate directly here - let the useEffect handle it
    // This prevents double updates and infinite loops
    // The useEffect (line 72) will detect the change and call onAnswerUpdate with debouncing
  };

  // Navigate to next question
  const handleNext = (clearNotification = false) => {
    // Only clear notification if explicitly requested (user clicked Next button)
    if (clearNotification) {
      setNextQuestionNotification(null);
    }
    
    if (!currentQuestion) return;
    
    const currentValue = answers[currentQuestion.field];

    // Validate current answer
    if (!currentValue) {
      setShowValidation(true);
      return;
    }
    if (currentQuestion.type === 'area_input') {
      if (typeof currentValue !== 'object' || !('value' in currentValue)) {
        setShowValidation(true);
        return;
      }
      const value = (currentValue as { value: string | number }).value;
      if (!value) {
        setShowValidation(true);
        return;
      }
    }

    if (isLastQuestion) {
      // Check that all visible questions have been answered
      const allAnswered = visibleQuestions.every((q) => {
        const answer = answers[q.field];
        if (q.type === 'area_input') {
          return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
        }
        return answer !== undefined && answer !== null && answer !== '';
      });
      
      if (allAnswered) {
        // All questions answered - complete questionnaire
        onComplete(answers);
      } else {
        // Not all questions answered - show validation
        setShowValidation(true);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowValidation(false);
      
      // Smooth scroll to top of question container after state update
      setTimeout(() => {
        if (questionRef.current && typeof questionRef.current.scrollIntoView === 'function') {
          questionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 50);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setShowValidation(false);
    }
  };

  // Jump to specific question
  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < visibleQuestions.length) {
      setCurrentQuestionIndex(index);
      setShowValidation(false);
    }
  };

  // Jump to first question in a section
  const handleJumpToSection = (sectionId: string) => {
    const sectionQuestionIndex = visibleQuestions.findIndex((q) => q.section === sectionId);
    if (sectionQuestionIndex >= 0) {
      setCurrentQuestionIndex(sectionQuestionIndex);
      setShowValidation(false);
    }
  };

  // Expose section jump to parent
  useEffect(() => {
    if (onJumpToSection) {
      // Create a wrapper function that can be called from parent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__questionnaireJumpToSection = handleJumpToSection;
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__questionnaireJumpToSection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__questionnaireJumpToSection;
      }
    };
  }, [visibleQuestions, onJumpToSection]);

  // Calculate section progress (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getSectionProgress = (sectionId: string) => {
    const sectionQuestions = visibleQuestions.filter((q) => q.section === sectionId);
    const answeredCount = sectionQuestions.filter((q) => {
      const answer = answers[q.field];
      if (q.type === 'area_input') {
        return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
      }
      return answer !== undefined && answer !== null && answer !== '';
    }).length;
    return (answeredCount / sectionQuestions.length) * 100;
  };

  // Check if should show solar preview
  const shouldShowSolarPreview = () => {
    const roofArea = answers.roofArea;
    if (!roofArea || typeof roofArea !== 'object' || !('value' in roofArea)) {
      return false;
    }
    const value = (roofArea as { value: string | number }).value;
    return value && Number(value) > 0;
  };

  if (!currentQuestion) {
    return (
      <div className="text-center text-white">
        <p>No questions available</p>
      </div>
    );
  }

  // Track refs for each question to enable smooth scrolling
  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Enhanced scroll to next unanswered question with smooth animation and visual feedback
  const scrollToNextUnanswered = useCallback((fromIndex: number) => {
    // Find next unanswered question
    const nextUnansweredIndex = visibleQuestions.findIndex((q, idx) => {
      if (idx <= fromIndex) return false;
      const answer = answers[q.field];
      if (q.type === 'area_input') {
        return !answer || typeof answer !== 'object' || !('value' in answer) || !(answer as { value: string | number }).value;
      }
      return !answer || answer === null || answer === '';
    });
    
    if (nextUnansweredIndex >= 0) {
      const questionElement = questionRefs.current.get(nextUnansweredIndex);
      if (questionElement) {
        // Update current question index first
        setCurrentQuestionIndex(nextUnansweredIndex);
        
        // Smooth scroll with offset for better visibility
        setTimeout(() => {
          // Use scrollIntoView with options for smooth centering
          questionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', // Center the question for better visibility
            inline: 'nearest'
          });
          
          // Add a visual highlight effect using CSS class
          questionElement.classList.add('animate-scroll-highlight');
          setTimeout(() => {
            questionElement.classList.remove('animate-scroll-highlight');
          }, 1500);
        }, 150); // Slight delay to let state update
      }
    } else if (fromIndex < visibleQuestions.length - 1) {
      // All questions answered - scroll to show completion
      const lastQuestionElement = questionRefs.current.get(visibleQuestions.length - 1);
      if (lastQuestionElement) {
        setTimeout(() => {
          lastQuestionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 150);
      }
    }
  }, [visibleQuestions, answers]);

  return (
    <div className="questionnaire-engine space-y-6">
      {/* Render ALL questions in vertical scroll format */}
      {visibleQuestions.map((question, index) => {
        const isAnswered = answers[question.field] !== undefined && answers[question.field] !== null && answers[question.field] !== '';
        const isCurrent = index === currentQuestionIndex;
        
        return (
          <div 
            key={question.id}
            ref={(el) => {
              if (el) {
                questionRefs.current.set(index, el);
              } else {
                questionRefs.current.delete(index);
              }
            }}
            className="scroll-mt-24 transition-all duration-500"
            style={{
              scrollMarginTop: '120px' // Account for header/fixed elements
            }}
          >
            {/* Question Card */}
            <div className={`
              bg-slate-800/50 border-2 rounded-2xl p-8 shadow-xl transition-all duration-300
              ${isCurrent 
                ? 'border-purple-500/50 shadow-purple-500/20 ring-2 ring-purple-500/30' 
                : isAnswered
                ? 'border-blue-500/30 shadow-blue-500/10'
                : 'border-slate-700/50'
              }
            `}
            id={`question-${question.id}`}
            >
              {/* Question Number Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all
                  ${isCurrent 
                    ? 'bg-purple-500/30 border-2 border-purple-500/50 text-purple-300' 
                    : isAnswered
                    ? 'bg-blue-500/20 border-2 border-blue-500/30 text-blue-300'
                    : 'bg-slate-700/50 border-2 border-slate-600/50 text-slate-400'
                  }
                `}>
                  {index + 1}
                </div>
                <span className="text-sm text-slate-400">
                  Question {index + 1} of {visibleQuestions.length}
                </span>
                {isAnswered && (
                  <span className="ml-auto text-blue-400 text-sm font-medium flex items-center gap-1">
                    ✓ Answered
                  </span>
                )}
              </div>

              {/* Question Renderer */}
              <QuestionRenderer
                question={question}
                value={answers[question.field]}
                onChange={(value) => {
                  handleAnswer(question.field, value);
                  // Automated scroll to next unanswered question after a brief delay
                  // This provides visual feedback and guides the user naturally
                  if (!isUserAdjusting) {
                    setTimeout(() => {
                      scrollToNextUnanswered(index);
                    }, 600); // Reduced delay for snappier feel
                  }
                }}
                showValidation={showValidation && isCurrent}
                onAdjustingChange={setIsUserAdjustingSync}
              />
            </div>

            {/* Solar Preview (show after roof area question) */}
            {question.section === 'solar' && question.field === 'roofArea' && shouldShowSolarPreview() && (
              <div className="mt-4">
                <SolarPreviewCard
                  industry={industry}
                  roofArea={
                    answers.roofArea && typeof answers.roofArea === 'object' && 'value' in answers.roofArea
                      ? Number((answers.roofArea as { value: string | number }).value)
                      : undefined
                  }
                  roofUnit={
                    answers.roofArea && typeof answers.roofArea === 'object' && 'unit' in answers.roofArea
                      ? (answers.roofArea as { unit: string }).unit as 'sqft' | 'sqm'
                      : 'sqft'
                  }
                  carportInterest={answers.carportInterest as 'yes' | 'no' | 'unsure' | undefined}
                  carportArea={
                    answers.carportArea && typeof answers.carportArea === 'object' && 'value' in answers.carportArea
                      ? Number((answers.carportArea as { value: string | number }).value)
                      : undefined
                  }
                  carportUnit={
                    answers.carportArea && typeof answers.carportArea === 'object' && 'unit' in answers.carportArea
                      ? (answers.carportArea as { unit: string }).unit as 'sqft' | 'sqm'
                      : 'sqft'
                  }
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Progress Summary at Bottom */}
      <div className="mt-12 pt-8 border-t border-slate-800">
        <div className="bg-slate-800/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Progress Summary</h3>
            <span className="text-purple-300 font-medium">
              {visibleQuestions.filter(q => answers[q.field] && answers[q.field] !== '').length} of {visibleQuestions.length} answered
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500"
              style={{ 
                width: `${(visibleQuestions.filter(q => answers[q.field] && answers[q.field] !== '').length / visibleQuestions.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION BADGE
// ============================================================================

function SectionBadge({ section }: { section: string }) {
  const sectionMeta: Record<string, { label: string; icon: string; color: string }> = {
    facility: { 
      label: 'Facility Details', 
      icon: '🏪', 
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
    },
    operations: { 
      label: 'Operations', 
      icon: '⚙️', 
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
    },
    energy: { 
      label: 'Energy Systems', 
      icon: '⚡', 
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
    },
    equipment: { 
      label: 'Equipment Details', 
      icon: '🔧', 
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
    },
    solar: { 
      label: 'Solar Potential', 
      icon: '☀️', 
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
    }
  };

  const meta = sectionMeta[section] || sectionMeta.facility;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${meta.color}`}>
      <span className="text-lg">{meta.icon}</span>
      <span className="text-sm font-semibold">{meta.label}</span>
    </div>
  );
}

// ============================================================================
// SECTION SUMMARY
// ============================================================================

function SectionSummary({ 
  questions, 
  answers, 
  currentSection,
  onJumpToSection
}: { 
  questions: Question[]; 
  answers: Record<string, unknown>;
  currentSection: string;
  onJumpToSection?: (sectionId: string) => void;
}) {
  const sections = ['facility', 'operations', 'energy', 'solar'];
  
  return (
    <div className="grid grid-cols-4 gap-3">
      {sections.map((sectionId) => {
        const sectionQuestions = questions.filter((q) => q.section === sectionId);
        const answeredCount = sectionQuestions.filter((q) => {
          const answer = answers[q.field];
          if (q.type === 'area_input') {
            return answer && typeof answer === 'object' && 'value' in answer && (answer as { value: string | number }).value;
          }
          return answer !== undefined && answer !== null && answer !== '';
        }).length;
        const progress = (answeredCount / sectionQuestions.length) * 100;
        const isCurrentSection = sectionId === currentSection;

        const sectionMeta: Record<string, { label: string; icon: string }> = {
          facility: { label: 'Facility', icon: '🏪' },
          operations: { label: 'Operations', icon: '⚙️' },
          energy: { label: 'Energy', icon: '⚡' },
          solar: { label: 'Solar', icon: '☀️' }
        };

        const meta = sectionMeta[sectionId];

        return (
          <button
            key={sectionId}
            onClick={() => onJumpToSection && onJumpToSection(sectionId)}
            className={`
              text-center p-3 rounded-lg transition-all w-full
              ${isCurrentSection
                ? 'bg-purple-500/10 border border-purple-500/30'
                : 'bg-slate-900/50 hover:bg-slate-800/50'
              }
            `}
          >
            <div className="text-2xl mb-1">{meta.icon}</div>
            <div className="text-xs text-slate-400 mb-2">{meta.label}</div>
            <div className="text-sm font-bold text-white">
              {answeredCount}/{sectionQuestions.length}
            </div>
            <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`
                  h-full transition-all duration-300
                  ${progress === 100
                    ? 'bg-green-500'
                    : isCurrentSection
                    ? 'bg-purple-500'
                    : 'bg-slate-600'
                  }
                `}
                style={{ width: `${progress}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
