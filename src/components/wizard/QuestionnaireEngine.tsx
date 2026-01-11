import React, { useState, useEffect, useRef, useCallback } from "react";
import { QuestionRenderer } from "./QuestionRenderer";
import { SolarPreviewCard } from "./SolarPreviewCard";
import { Check } from "lucide-react";
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const questionCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get filtered questions (based on showIf conditions)
  const visibleQuestions = questions.filter((question) => {
    if (!question.showIf) return true;
    return question.showIf(answers);
  });

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

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
    if (question.type === "slider" || question.type === "number_buttons") {
      return typeof value === "number" && !isNaN(value);
    }
    if (question.type === "area_input") {
      if (!value || typeof value !== "object" || !("value" in value)) {
        return false;
      }
      const areaValue = (value as { value: string | number }).value;
      return areaValue !== null && areaValue !== undefined && areaValue !== "";
    }
    return !!value;
  }, []);

  // Check if question is answered
  const isQuestionAnswered = useCallback(
    (question: Question): boolean => {
      const answer = answers[question.field];
      return validateAnswer(question, answer);
    },
    [answers, validateAnswer]
  );

  // Handle answer change
  const handleAnswer = useCallback(
    (field: string, value: unknown) => {
      setAnswers((prev) => ({
        ...prev,
        [field]: value,
      }));
      setShowValidation((prev) => ({
        ...prev,
        [field]: false,
      }));

      // Unlock scroll when question is answered
      const question = visibleQuestions.find((q) => q.field === field);
      if (question && validateAnswer(question, value)) {
        setScrollLocked(false);
      }
    },
    [visibleQuestions, validateAnswer]
  );

  // Scroll to next question
  const scrollToNextQuestion = useCallback(() => {
    if (!scrollContainerRef.current || currentQuestionIndex >= visibleQuestions.length - 1) {
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    const nextCard = questionCardRefs.current[nextIndex];

    if (nextCard) {
      nextCard.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Lock scroll for next question after scroll completes
      setTimeout(() => {
        setScrollLocked(true);
        setCurrentQuestionIndex(nextIndex);
      }, 500);
    }
  }, [currentQuestionIndex, visibleQuestions.length]);

  // Auto-scroll to next question when current is answered
  useEffect(() => {
    if (!scrollLocked && currentQuestion && isQuestionAnswered(currentQuestion)) {
      if (!isLastQuestion) {
        scrollToNextQuestion();
      }
    }
  }, [answers, scrollLocked, currentQuestion, isQuestionAnswered, isLastQuestion, scrollToNextQuestion]);

  // Prevent scroll when locked
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = (e: Event) => {
      if (scrollLocked) {
        e.preventDefault();
        e.stopPropagation();
        container.scrollTop = questionCardRefs.current[currentQuestionIndex]?.offsetTop || 0;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: false });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [scrollLocked, currentQuestionIndex]);

  // Scroll to current question on mount/change
  useEffect(() => {
    const currentCard = questionCardRefs.current[currentQuestionIndex];
    if (currentCard && scrollContainerRef.current) {
      currentCard.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentQuestionIndex]);

  // Handle completion
  const handleComplete = useCallback(() => {
    const invalidQuestions = visibleQuestions.filter((q) => !isQuestionAnswered(q));

    if (invalidQuestions.length > 0) {
      const validationState: Record<string, boolean> = {};
      invalidQuestions.forEach((q) => {
        validationState[q.field] = true;
      });
      setShowValidation(validationState);
      const firstInvalidIndex = visibleQuestions.findIndex((q) => q.field === invalidQuestions[0].field);
      if (firstInvalidIndex >= 0) {
        setCurrentQuestionIndex(firstInvalidIndex);
      }
      return;
    }

    onComplete(answers);
  }, [answers, visibleQuestions, isQuestionAnswered, onComplete]);

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
    <div className="questionnaire-engine flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 pb-4 pt-4">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-400">Step 3 of 6 · System Details</span>
            <span className="text-sm text-slate-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scroll Container - One question per viewport */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth", scrollSnapType: "y mandatory" }}
      >
        <div className="max-w-4xl mx-auto px-8 py-12">
          {visibleQuestions.map((question, index) => {
            const isAnswered = isQuestionAnswered(question);
            const isCurrent = index === currentQuestionIndex;
            const showError = showValidation[question.field] || false;

            return (
              <div
                key={question.id || question.field}
                ref={(el) => {
                  questionCardRefs.current[index] = el;
                }}
                className={`
                  question-card
                  mb-8
                  bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-8
                  transition-all duration-300 ease-out
                  ${isCurrent ? "opacity-100 border-purple-500/50" : "opacity-60"}
                  ${showError ? "ring-2 ring-red-500 border-red-500" : ""}
                  ${isAnswered ? "border-green-500/30 bg-green-500/5" : ""}
                `}
                style={{
                  minHeight: "calc(100vh - 300px)",
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                {/* Question Number */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                      ${isAnswered ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}
                    `}
                  >
                    {isAnswered ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {question.section && (
                    <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300">
                      {question.section}
                    </div>
                  )}
                </div>

                {/* Question Renderer - includes question text and inputs */}
                <QuestionRenderer
                  question={question}
                  value={answers[question.field]}
                  onChange={(value) => handleAnswer(question.field, value)}
                  showValidation={showError}
                />
              </div>
            );
          })}

          {/* Solar Preview */}
          {shouldShowSolarPreview() && (
            <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-8">
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

          {/* Complete Button - only show when all answered */}
          {answeredCount === visibleQuestions.length && (
            <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg p-8">
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
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 bg-slate-900 border-t border-slate-800 py-3">
        <div className="max-w-4xl mx-auto px-8">
          <p className="text-sm text-center text-slate-400">You can change answers anytime</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION SUMMARY (removed for cleaner UX per spec)
// ============================================================================
