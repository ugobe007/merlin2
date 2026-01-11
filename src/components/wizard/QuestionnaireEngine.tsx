import React, { useState, useEffect, useRef, useCallback } from "react";
import { QuestionRenderer } from "./QuestionRenderer";
import { SolarPreviewCard } from "./SolarPreviewCard";
import { Check, Sparkles, ArrowDown } from "lucide-react";
import type { Question } from "@/data/carwash-questions.config";

interface QuestionnaireEngineProps {
  questions: Question[];
  industry: string;
  initialValues?: Record<string, unknown>;
  onComplete: (answers: Record<string, unknown>) => void;
  onProgressUpdate?: (progress: number) => void;
  onQuestionChange?: (question: Question, progress: number) => void;
  onJumpToSection?: (sectionId: string) => void;
}

export function QuestionnaireEngine({
  questions,
  industry,
  initialValues = {},
  onComplete,
  onProgressUpdate,
  onQuestionChange: _onQuestionChange,
  onJumpToSection,
}: QuestionnaireEngineProps) {
  // State
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialValues);
  const [showValidation, setShowValidation] = useState<Record<string, boolean>>({});
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [scrollingToQuestion, setScrollingToQuestion] = useState<string | null>(null);
  
  // Refs for question elements
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get filtered questions (based on showIf conditions)
  const visibleQuestions = questions.filter((question) => {
    if (!question.showIf) return true;
    return question.showIf(answers);
  });

  // Calculate progress
  const answeredCount = visibleQuestions.filter((q) => {
    const answer = answers[q.field];
    if (q.type === "area_input") {
      return (
        answer &&
        typeof answer === "object" &&
        "value" in answer &&
        (answer as { value: string | number }).value
      );
    }
    if (q.type === "slider" || q.type === "number_buttons") {
      return typeof answer === "number" && !isNaN(answer);
    }
    return answer !== undefined && answer !== null && answer !== "";
  }).length;

  const progress = (answeredCount / visibleQuestions.length) * 100;

  // Update progress callback
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
  }, [progress, onProgressUpdate]);

  // Validate answer based on question type
  const validateAnswer = useCallback((question: Question, value: unknown): boolean => {
    // Number inputs (slider, number_buttons): 0 is valid, only check for null/undefined/NaN
    if (question.type === "slider" || question.type === "number_buttons") {
      return typeof value === "number" && !isNaN(value);
    }

    // Area input: must be object with value property
    if (question.type === "area_input") {
      if (!value || typeof value !== "object" || !("value" in value)) {
        return false;
      }
      const areaValue = (value as { value: string | number }).value;
      return areaValue !== null && areaValue !== undefined && areaValue !== "";
    }

    // Other types (buttons, toggle, etc.): check for falsy values
    return !!value;
  }, []);

  // Handle answer change
  const handleAnswer = useCallback((field: string, value: unknown) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [field]: value,
      };
      return newAnswers;
    });
    setShowValidation((prev) => ({
      ...prev,
      [field]: false,
    }));
  }, []);

  // Check if question is answered
  const isQuestionAnswered = useCallback((question: Question): boolean => {
    const answer = answers[question.field];
    return validateAnswer(question, answer);
  }, [answers, validateAnswer]);

  // Find next unanswered question
  const findNextUnansweredQuestion = useCallback((): Question | null => {
    const currentIndex = visibleQuestions.findIndex((q) => !isQuestionAnswered(q));
    if (currentIndex >= 0) {
      return visibleQuestions[currentIndex];
    }
    return null;
  }, [visibleQuestions, isQuestionAnswered]);

  // Smooth scroll to question element using scrollIntoView
  const scrollToQuestion = useCallback((questionField: string, behavior: ScrollBehavior = 'smooth') => {
    const questionElement = questionRefs.current[questionField];
    if (questionElement) {
      setScrollingToQuestion(questionField);
      
      // Use scrollIntoView for smooth scrolling to specific element
      questionElement.scrollIntoView({
        behavior: behavior,
        block: 'center', // Center the element in the viewport
        inline: 'nearest',
      });

      // Clear scrolling state after scroll completes
      setTimeout(() => {
        setScrollingToQuestion(null);
      }, behavior === 'smooth' ? 800 : 100);
    }
  }, []);

  // Auto-scroll to next unanswered question when answer is provided
  useEffect(() => {
    if (!autoScrollEnabled || userScrolled) return;

    // Find the most recently answered question
    const lastAnsweredQuestion = visibleQuestions
      .slice()
      .reverse()
      .find((q) => isQuestionAnswered(q));

    if (lastAnsweredQuestion) {
      const nextUnanswered = findNextUnansweredQuestion();
      if (nextUnanswered && nextUnanswered.field !== lastAnsweredQuestion.field) {
        // Scroll to next unanswered question after a short delay
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          scrollToQuestion(nextUnanswered.field, 'smooth');
        }, 500); // Delay to allow UI to update
      }
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [answers, autoScrollEnabled, userScrolled, visibleQuestions, isQuestionAnswered, findNextUnansweredQuestion, scrollToQuestion]);

  // Track user scroll to disable auto-scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      setUserScrolled(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setUserScrolled(false); // Re-enable auto-scroll after user stops scrolling for 2 seconds
      }, 2000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  // Handle completion
  const handleComplete = useCallback(() => {
    // Validate all required questions
    const invalidQuestions = visibleQuestions.filter((q) => {
      // All questions are considered required for now
      return !isQuestionAnswered(q);
    });

    if (invalidQuestions.length > 0) {
      // Show validation errors and scroll to first invalid question
      const validationState: Record<string, boolean> = {};
      invalidQuestions.forEach((q) => {
        validationState[q.field] = true;
      });
      setShowValidation(validationState);
      scrollToQuestion(invalidQuestions[0].field, 'smooth');
      return;
    }

    // All questions answered - complete
    onComplete(answers);
  }, [answers, visibleQuestions, isQuestionAnswered, onComplete, scrollToQuestion]);

  // Check if should show solar preview
  const shouldShowSolarPreview = useCallback(() => {
    const roofArea = answers.roofArea;
    if (!roofArea || typeof roofArea !== "object" || !("value" in roofArea)) {
      return false;
    }
    const value = (roofArea as { value: string | number }).value;
    return value && Number(value) > 0;
  }, [answers]);

  if (visibleQuestions.length === 0) {
    return (
      <div className="text-center text-white py-12">
        <p>No questions available</p>
      </div>
    );
  }

  return (
    <div className="questionnaire-engine">
      {/* Progress Bar (Top) */}
      <div className="mb-8 sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm pb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">
            {answeredCount} of {visibleQuestions.length} questions answered
          </span>
          <div className="flex items-center gap-3">
            {/* Auto-scroll Toggle */}
            <button
              onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
              className={`
                text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2
                ${autoScrollEnabled
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
                }
              `}
              title={autoScrollEnabled ? "Auto-scroll enabled" : "Auto-scroll disabled"}
            >
              <Sparkles className={`w-3 h-3 ${autoScrollEnabled ? 'text-purple-400' : 'text-slate-500'}`} />
              {autoScrollEnabled ? "Auto-scroll" : "Manual"}
            </button>
            <span className="text-sm text-slate-400">{Math.round(progress)}% Complete</span>
          </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scrolling Questions Container */}
      <div
        ref={containerRef}
        className="space-y-12 pb-12"
        style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}
      >
        {visibleQuestions.map((question, index) => {
          const isAnswered = isQuestionAnswered(question);
          const isScrollingTo = scrollingToQuestion === question.field;
          const showError = showValidation[question.field] || false;

          return (
            <div
              key={question.id || question.field}
              ref={(el) => {
                questionRefs.current[question.field] = el;
              }}
              className={`
                question-container
                p-6 rounded-2xl border-2 transition-all duration-300
                ${isAnswered
                  ? "bg-green-500/5 border-green-500/30"
                  : showError
                    ? "bg-red-500/5 border-red-500/50 animate-pulse"
                    : isScrollingTo
                      ? "bg-purple-500/10 border-purple-500/50 ring-4 ring-purple-500/20"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }
              `}
              data-question-field={question.field}
              data-question-index={index}
            >
              {/* Question Number Badge */}
              <div className="mb-4 flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                  ${isAnswered
                    ? "bg-green-500 text-white"
                    : "bg-slate-700 text-slate-300"
                  }
                `}>
                  {isAnswered ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <SectionBadge section={question.section || 'facility'} />
              </div>

              {/* Question Input - QuestionRenderer includes question text and inputs */}
              <QuestionRenderer
                question={question}
                value={answers[question.field]}
                onChange={(value) => handleAnswer(question.field, value)}
                showValidation={showError}
              />

              {/* Auto-scroll Prompt (appears when question is answered) */}
              {isAnswered && autoScrollEnabled && index < visibleQuestions.length - 1 && (
                <div className="mt-6 ml-14 animate-pulse">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                    <ArrowDown className="w-4 h-4" />
                    <span>Scrolling to next question...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Solar Preview (appears when roof area is entered) */}
        {shouldShowSolarPreview() && (
          <div className="mt-8">
            <SolarPreviewCard
              industry={industry}
              roofArea={
                answers.roofArea &&
                typeof answers.roofArea === "object" &&
                "value" in answers.roofArea
                  ? Number((answers.roofArea as { value: string | number }).value)
                  : undefined
              }
              roofUnit={
                answers.roofArea && typeof answers.roofArea === "object" && "unit" in answers.roofArea
                  ? ((answers.roofArea as { unit: string }).unit as "sqft" | "sqm")
                  : "sqft"
              }
              carportInterest={answers.carportInterest as "yes" | "no" | "unsure" | undefined}
              carportArea={
                answers.carportArea &&
                typeof answers.carportArea === "object" &&
                "value" in answers.carportArea
                  ? Number((answers.carportArea as { value: string | number }).value)
                  : undefined
              }
              carportUnit={
                answers.carportArea &&
                typeof answers.carportArea === "object" &&
                "unit" in answers.carportArea
                  ? ((answers.carportArea as { unit: string }).unit as "sqft" | "sqm")
                  : "sqft"
              }
            />
          </div>
        )}

        {/* Complete Button (only show when all questions answered) */}
        {answeredCount === visibleQuestions.length && (
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm pt-6 pb-4 border-t border-slate-800 mt-12">
            <button
              onClick={handleComplete}
              className="
                w-full px-8 py-4 rounded-xl font-semibold text-lg
                bg-gradient-to-r from-purple-500 to-indigo-600
                text-white hover:shadow-lg hover:shadow-purple-500/30
                transition-all flex items-center justify-center gap-2
              "
            >
              <span>Complete Questionnaire</span>
              <Check className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Section Summary (Bottom) */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <SectionSummary
          questions={visibleQuestions}
          answers={answers}
          onJumpToSection={onJumpToSection}
          scrollToQuestion={scrollToQuestion}
        />
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
      label: "Facility Details",
      icon: "🏪",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    operations: {
      label: "Operations",
      icon: "⚙️",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    energy: {
      label: "Energy Systems",
      icon: "⚡",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    solar: {
      label: "Solar Potential",
      icon: "☀️",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  };

  const meta = sectionMeta[section] || sectionMeta.facility;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${meta.color}`}>
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </div>
  );
}

// ============================================================================
// SECTION SUMMARY
// ============================================================================

function SectionSummary({
  questions,
  answers,
  onJumpToSection,
  scrollToQuestion,
}: {
  questions: Question[];
  answers: Record<string, unknown>;
  onJumpToSection?: (sectionId: string) => void;
  scrollToQuestion: (field: string, behavior?: ScrollBehavior) => void;
}) {
  const sections = ["facility", "operations", "energy", "solar"];

  const isQuestionAnswered = (question: Question): boolean => {
    const answer = answers[question.field];
    if (question.type === "area_input") {
      return Boolean(
        answer &&
        typeof answer === "object" &&
        "value" in answer &&
        (answer as { value: string | number }).value
      );
    }
    if (question.type === "slider" || question.type === "number_buttons") {
      return typeof answer === "number" && !isNaN(answer);
    }
    return answer !== undefined && answer !== null && answer !== "";
  };

  const handleSectionClick = (sectionId: string) => {
    if (onJumpToSection) {
      onJumpToSection(sectionId);
    }
    // Find first question in section and scroll to it
    const sectionQuestion = questions.find((q) => q.section === sectionId);
    if (sectionQuestion) {
      scrollToQuestion(sectionQuestion.field, 'smooth');
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {sections.map((sectionId) => {
        const sectionQuestions = questions.filter((q) => q.section === sectionId);
        const answeredCount = sectionQuestions.filter(isQuestionAnswered).length;
        const progress = sectionQuestions.length > 0 ? (answeredCount / sectionQuestions.length) * 100 : 0;

        const sectionMeta: Record<string, { label: string; icon: string }> = {
          facility: { label: "Facility", icon: "🏪" },
          operations: { label: "Operations", icon: "⚙️" },
          energy: { label: "Energy", icon: "⚡" },
          solar: { label: "Solar", icon: "☀️" },
        };

        const meta = sectionMeta[sectionId];

        return (
          <button
            key={sectionId}
            onClick={() => handleSectionClick(sectionId)}
            className="
              text-center p-3 rounded-lg transition-all w-full
              bg-slate-900/50 hover:bg-slate-800/50
              border border-slate-800 hover:border-slate-700
            "
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
                    ? "bg-green-500"
                    : "bg-purple-500"
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
