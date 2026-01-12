/**
 * Complete Step 3 Component
 *
 * Main orchestrator for the questionnaire
 * Manages state, navigation, progress tracking
 */

import React, { useState, useEffect, useRef } from "react";
import { CompleteQuestionRenderer } from "./CompleteQuestionRenderer";
import {
  carWashQuestionsComplete,
  carWashSections,
  type Question,
} from "@/data/carwash-questions-complete.config";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CompleteStep3ComponentProps {
  state?: {
    industry?: string;
    useCaseData?: Record<string, unknown>;
  };
  updateState?: (updates: Record<string, unknown>) => void;
  onNext?: () => void;
  initialAnswers?: Record<string, unknown>;
  onAnswersChange?: (answers: Record<string, unknown>) => void;
  onComplete?: () => void;
  onBack?: () => void;
}

export function CompleteStep3Component({
  state = {},
  updateState,
  onNext,
  initialAnswers = {},
  onAnswersChange,
  onComplete,
  onBack,
}: CompleteStep3ComponentProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    (initialAnswers as Record<string, unknown>) ||
      ((state.useCaseData?.inputs as Record<string, unknown>) ?? {})
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [, setIsTransitioning] = useState(false); // Only setter used
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Sync with parent component (debounced to prevent infinite loops)
  const prevAnswersRef = useRef<Record<string, unknown>>(answers);
  useEffect(() => {
    // Only call onAnswersChange if answers actually changed
    const answersChanged = JSON.stringify(prevAnswersRef.current) !== JSON.stringify(answers);

    if (answersChanged && onAnswersChange) {
      prevAnswersRef.current = answers;
      onAnswersChange(answers);
    }
  }, [answers, onAnswersChange]);

  // Load initial answers
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  // Filter visible questions based on conditional logic
  const visibleQuestions = carWashQuestionsComplete.filter((q) => {
    if (!q.conditionalLogic) return true;
    const dependentValue = answers[q.conditionalLogic.dependsOn];
    return q.conditionalLogic.showIf(dependentValue);
  });

  // Current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Progress calculation
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = visibleQuestions.length;
  const overallProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Section progress
  const sectionProgress = carWashSections.map((section) => {
    const sectionQuestions = section.questions.filter((q) => {
      if (!q.conditionalLogic) return true;
      const dependentValue = answers[q.conditionalLogic.dependsOn];
      return q.conditionalLogic.showIf(dependentValue);
    });
    const answered = sectionQuestions.filter((q) => answers[q.id] !== undefined).length;
    const total = sectionQuestions.length;

    return {
      ...section,
      totalQuestions: total,
      answeredQuestions: answered,
      isLocked: false,
    };
  });

  // Current section
  const _currentSection = currentQuestion?.section || "facility";
  void _currentSection; // Explicitly mark as intentionally unused

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAnswer = (questionId: string, value: unknown) => {
    const newAnswers = {
      ...answers,
      [questionId]: value,
    };
    setAnswers(newAnswers);

    // Update parent state if updateState is provided
    if (updateState) {
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: newAnswers,
        },
      });
    }

    // DISABLED: Auto-scroll removed per user request
    // User should manually scroll/click to continue
    // Auto-advance was causing issues with premature triggering
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < visibleQuestions.length) {
      setIsTransitioning(true);
      setCurrentQuestionIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
        scrollToQuestion(index);
      }, 100);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    } else if (onBack) {
      // Go back to previous step
      onBack();
    }
  };

  const scrollToQuestion = (index: number) => {
    const element = questionRefs.current[index];
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const canProceed = () => {
    // Check if all required questions are answered
    const requiredQuestions = visibleQuestions.filter((q) => q.validation?.required);
    return requiredQuestions.every(
      (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
    );
  };

  const handleComplete = () => {
    if (canProceed()) {
      if (onComplete) {
        onComplete();
      } else if (onNext) {
        onNext();
      }
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Simplified for now */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Progress</h2>
          <div className="space-y-4">
            {sectionProgress.map((section) => (
              <div key={section.id} className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{section.title}</span>
                  <span className="text-xs text-slate-400">
                    {section.answeredQuestions}/{section.totalQuestions}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{
                      width: `${section.totalQuestions > 0 ? (section.answeredQuestions / section.totalQuestions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="px-8 py-4">
            {/* Top Row: Logo & Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors">
                  <span className="text-xl">🏠</span>
                  <span className="font-semibold">Merlin Home</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white transition-colors">
                  <span className="text-xl">🔄</span>
                  <span className="font-semibold">Start Over</span>
                </button>
              </div>

              <div className="text-slate-400">
                Step <span className="text-white font-semibold">3</span> of{" "}
                <span className="text-white font-semibold">6</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>🌟 STARTING</span>
                <span className="font-semibold text-white">{Math.round(overallProgress)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 transition-all duration-500 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Questions Area */}
        <main className="flex-1 overflow-y-auto px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-3">
                Let's Learn About Your Car Wash
              </h1>
              <p className="text-xl text-slate-400">
                Answer a few questions so Merlin can size the perfect energy system for you.
              </p>
            </div>

            {/* Questions */}
            <div className="space-y-12">
              {visibleQuestions.map((question, index) => (
                <div
                  key={question.id}
                  ref={(el) => {
                    questionRefs.current[index] = el;
                  }}
                  className={`
                    scroll-mt-24 transition-all duration-300
                    ${
                      index === currentQuestionIndex
                        ? "opacity-100 scale-100"
                        : index < currentQuestionIndex
                          ? "opacity-60 scale-95"
                          : "opacity-40 scale-90"
                    }
                  `}
                >
                  <div className="p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl">
                    <CompleteQuestionRenderer
                      question={
                        {
                          ...question,
                          questionNumber: index + 1,
                        } as Question & { questionNumber: number }
                      }
                      value={answers[question.id]}
                      onChange={(value) => handleAnswer(question.id, value)}
                      allAnswers={answers}
                      questionNumber={index + 1}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Message */}
            {answeredCount === totalQuestions && totalQuestions > 0 && (
              <div className="mt-12 p-8 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500 rounded-2xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">Questionnaire Complete!</h3>
                <p className="text-slate-300 mb-6">
                  All questions answered. Click Continue below to proceed.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Navigation */}
        <footer className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={goToPreviousQuestion}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back</span>
            </button>

            {/* Progress Indicator */}
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-1">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
              <div className="text-xs text-slate-500">{answeredCount} answered</div>
            </div>

            {/* Next/Finish Button */}
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={goToNextQuestion}
                disabled={!answers[currentQuestion?.id]}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all hover:scale-105"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all hover:scale-105"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default CompleteStep3Component;
