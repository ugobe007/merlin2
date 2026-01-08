import React, { useState } from 'react';
import { QuestionnaireEngine } from './QuestionnaireEngine';
import { ProgressSidebar } from './ProgressSidebar';
import { CAR_WASH_QUESTIONS } from '@/data/carwash-questions.config';
import type { Question } from '@/data/carwash-questions.config';

interface Step3DetailsProps {
  state: {
    industry: string;
    useCaseData?: Record<string, unknown>;
  };
  updateState: (updates: any) => void;
  onNext: () => void;
}

export function Step3Details({ state, updateState, onNext }: Step3DetailsProps) {
  const [progress, setProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(CAR_WASH_QUESTIONS[0]);

  // Get questions for current industry
  // NOTE: For now, we only have car wash questions
  // In the future, this will load questions based on state.industry
  const questions = CAR_WASH_QUESTIONS;

  // Initialize with existing data or smart defaults
  const initialValues = state.useCaseData?.inputs || {};

  // Handle questionnaire completion
  const handleComplete = (answers: Record<string, unknown>) => {
    // Structure the data according to our SSOT format
    const useCaseData = {
      version: '2.0.0',
      industry: state.industry,
      
      // Raw user inputs
      inputs: answers,
      
      // Pre-calculated values will be added here by TrueQuoteEngine
      // This happens in the next step or during validation
      calculated: {}
    };

    // Update wizard state
    updateState({
      useCaseData
    });

    // Move to next step
    onNext();
  };

  // Handle progress updates
  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  // Handle question changes
  const handleQuestionChange = (question: Question, newProgress: number) => {
    setCurrentQuestion(question);
    setProgress(newProgress);
  };

  // Handle section jump (from sidebar)
  const handleJumpToSection = (sectionId: string) => {
    // Find first question in that section
    const sectionQuestionIndex = questions.findIndex((q) => q.section === sectionId);
    if (sectionQuestionIndex >= 0) {
      // Call the section jump handler exposed by QuestionnaireEngine
      if ((window as any).__questionnaireJumpToSection) {
        (window as any).__questionnaireJumpToSection(sectionId);
      }
    }
  };

  return (
    <div className="step3-details flex h-screen bg-slate-900">
      {/* Left Sidebar - Progress Tracking */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800 overflow-y-auto">
        <ProgressSidebar
          questions={questions}
          answers={initialValues as Record<string, unknown>}
          currentQuestion={currentQuestion}
          progress={progress}
          onJumpToSection={handleJumpToSection}
        />
      </div>

      {/* Right Panel - Questionnaire */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Let's Learn About Your {getIndustryName(state.industry)}
            </h1>
            <p className="text-xl text-slate-400">
              Answer a few questions so Merlin can size the perfect energy system for you.
            </p>
          </div>

          {/* Questionnaire Engine */}
          <QuestionnaireEngine
            questions={questions}
            industry={state.industry}
            initialValues={(initialValues || {}) as Record<string, unknown>}
            onComplete={handleComplete}
            onProgressUpdate={handleProgressUpdate}
            onQuestionChange={handleQuestionChange}
            onJumpToSection={handleJumpToSection}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIndustryName(industry: string): string {
  const industryNames: Record<string, string> = {
    car_wash: 'Car Wash',
    hotel_hospitality: 'Hotel',
    retail: 'Retail Store',
    warehouse_logistics: 'Warehouse',
    manufacturing: 'Manufacturing Facility',
    tribal_casino: 'Tribal Casino',
    government: 'Government Facility'
  };

  return industryNames[industry] || 'Facility';
}

// ============================================================================
// ALTERNATIVE: Simplified Step3Details (No Sidebar)
// ============================================================================

/**
 * Use this version if you want to start without the sidebar
 * and add it later for polish
 */
export function Step3DetailsSimple({ state, updateState, onNext }: Step3DetailsProps) {
  const questions = CAR_WASH_QUESTIONS;
  const initialValues = (state.useCaseData?.inputs || {}) as Record<string, unknown>;

  const handleComplete = (answers: Record<string, unknown>) => {
    const useCaseData = {
      version: '2.0.0',
      industry: state.industry,
      inputs: answers,
      calculated: {}
    };

    updateState({ useCaseData });
    onNext();
  };

  return (
    <div className="step3-details-simple min-h-screen bg-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Let's Learn About Your {getIndustryName(state.industry)}
          </h1>
          <p className="text-xl text-slate-400">
            Answer a few questions so Merlin can size the perfect energy system for you.
          </p>
        </div>

        {/* Questionnaire */}
        <QuestionnaireEngine
          questions={questions}
          industry={state.industry}
          initialValues={initialValues || {}}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
