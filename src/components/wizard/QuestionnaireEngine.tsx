import React, { useState, useEffect } from "react";
import { QuestionRenderer } from "./QuestionRenderer";
import { SolarPreviewCard } from "./SolarPreviewCard";
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
  onQuestionChange,
  onJumpToSection,
}: QuestionnaireEngineProps) {
  // State
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialValues);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

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
      onQuestionChange(currentQuestion, progress);
    }
  }, [progress, currentQuestion, onProgressUpdate, onQuestionChange]);

  // Auto-advance when answer is provided
  useEffect(() => {
    if (!autoAdvanceEnabled || !currentQuestion) return undefined;

    const currentValue = answers[currentQuestion.field];

    // Check if question has been answered
    if (currentValue !== undefined && currentValue !== null && currentValue !== "") {
      // For area_input type, check if value exists
      if (currentQuestion.type === "area_input") {
        if (!currentValue || typeof currentValue !== "object" || !("value" in currentValue)) {
          return undefined;
        }
        const value = (currentValue as { value: string | number }).value;
        if (!value || value === "") {
          return undefined;
        }
      }

      // Auto-advance after short delay (for better UX)
      const timer = setTimeout(() => {
        if (!isLastQuestion) {
          handleNext();
        }
      }, 600);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [answers, currentQuestion, autoAdvanceEnabled, isLastQuestion]);

  // Handle answer change
  const handleAnswer = (field: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
    setShowValidation(false);
  };

  // Navigate to next question
  const handleNext = () => {
    if (!currentQuestion) return;

    const currentValue = answers[currentQuestion.field];

    // Validate current answer
    // For number inputs, 0 is a valid value, so check for null/undefined specifically
    if (currentQuestion.type === "slider" || currentQuestion.type === "number_buttons") {
      if (currentValue === null || currentValue === undefined) {
        setShowValidation(true);
        return;
      }
      // Ensure it's a number
      if (typeof currentValue !== "number" || isNaN(currentValue)) {
        setShowValidation(true);
        return;
      }
    } else if (currentQuestion.type === "area_input") {
      if (currentValue === null || currentValue === undefined || typeof currentValue !== "object" || !("value" in currentValue)) {
        setShowValidation(true);
        return;
      }
      const value = (currentValue as { value: string | number }).value;
      if (value === null || value === undefined || value === "") {
        setShowValidation(true);
        return;
      }
    } else {
      // For other types (buttons, toggle, etc.), check for falsy values
      if (!currentValue) {
        setShowValidation(true);
        return;
      }
    }

    if (isLastQuestion) {
      // Complete questionnaire
      onComplete(answers);
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowValidation(false);
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
      if (q.type === "area_input") {
        return (
          answer &&
          typeof answer === "object" &&
          "value" in answer &&
          (answer as { value: string | number }).value
        );
      }
      return answer !== undefined && answer !== null && answer !== "";
    }).length;
    return (answeredCount / sectionQuestions.length) * 100;
  };

  // Check if should show solar preview
  const shouldShowSolarPreview = () => {
    const roofArea = answers.roofArea;
    if (!roofArea || typeof roofArea !== "object" || !("value" in roofArea)) {
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

  return (
    <div className="questionnaire-engine">
      {/* Progress Bar (Top) */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">
            Question {currentQuestionIndex + 1} of {visibleQuestions.length}
          </span>
          <span className="text-sm text-slate-400">{progress.toFixed(0)}% Complete</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section Badge */}
      <div className="mb-6">
        <SectionBadge section={currentQuestion.section} />
      </div>

      {/* Current Question */}
      <div className="mb-8">
        <QuestionRenderer
          question={currentQuestion}
          value={answers[currentQuestion.field]}
          onChange={(value) => handleAnswer(currentQuestion.field, value)}
          showValidation={showValidation}
        />
      </div>

      {/* Solar Preview (appears when roof area is entered) */}
      {shouldShowSolarPreview() && currentQuestion.section === "solar" && (
        <div className="mb-8">
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

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4 mt-8">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all
            ${
              currentQuestionIndex === 0
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-slate-800 text-white hover:bg-slate-700"
            }
          `}
        >
          ← Previous
        </button>

        {/* Auto-advance Toggle */}
        <button
          onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
          title={autoAdvanceEnabled ? "Auto-advance enabled" : "Auto-advance disabled"}
        >
          {autoAdvanceEnabled ? "⚡ Auto-advance" : "⏸️ Manual"}
        </button>

        {/* Next/Complete Button */}
        <button
          onClick={handleNext}
          className="
            px-8 py-3 rounded-xl font-semibold
            bg-gradient-to-r from-purple-500 to-indigo-600
            text-white hover:shadow-lg hover:shadow-purple-500/30
            transition-all
          "
        >
          {isLastQuestion ? "Complete ✓" : "Next →"}
        </button>
      </div>

      {/* Question Navigation Dots */}
      <div className="mt-8 flex justify-center gap-2 flex-wrap">
        {visibleQuestions.map((question, index) => {
          const isAnswered =
            answers[question.field] !== undefined && answers[question.field] !== null;
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              key={question.id}
              onClick={() => handleJumpToQuestion(index)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all
                ${
                  isCurrent
                    ? "bg-purple-500 w-8"
                    : isAnswered
                      ? "bg-green-500 hover:bg-green-400"
                      : "bg-slate-700 hover:bg-slate-600"
                }
              `}
              title={`Question ${index + 1}: ${question.question}`}
            />
          );
        })}
      </div>

      {/* Section Summary (Bottom) */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <SectionSummary
          questions={visibleQuestions}
          answers={answers}
          currentSection={currentQuestion.section}
          onJumpToSection={onJumpToSection}
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
  onJumpToSection,
}: {
  questions: Question[];
  answers: Record<string, unknown>;
  currentSection: string;
  onJumpToSection?: (sectionId: string) => void;
}) {
  const sections = ["facility", "operations", "energy", "solar"];

  return (
    <div className="grid grid-cols-4 gap-3">
      {sections.map((sectionId) => {
        const sectionQuestions = questions.filter((q) => q.section === sectionId);
        const answeredCount = sectionQuestions.filter((q) => {
          const answer = answers[q.field];
          if (q.type === "area_input") {
            return (
              answer &&
              typeof answer === "object" &&
              "value" in answer &&
              (answer as { value: string | number }).value
            );
          }
          return answer !== undefined && answer !== null && answer !== "";
        }).length;
        const progress = (answeredCount / sectionQuestions.length) * 100;
        const isCurrentSection = sectionId === currentSection;

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
            onClick={() => onJumpToSection && onJumpToSection(sectionId)}
            className={`
              text-center p-3 rounded-lg transition-all w-full
              ${
                isCurrentSection
                  ? "bg-purple-500/10 border border-purple-500/30"
                  : "bg-slate-900/50 hover:bg-slate-800/50"
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
                  ${
                    progress === 100
                      ? "bg-green-500"
                      : isCurrentSection
                        ? "bg-purple-500"
                        : "bg-slate-600"
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
