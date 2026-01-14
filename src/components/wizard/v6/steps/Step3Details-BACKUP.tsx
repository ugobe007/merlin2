/**
 * STEP 3: Facility Details - PROGRESSIVE DISCLOSURE
 * ===================================================
 * Version 5.0 - Unified Design System
 * 
 * Approach: Vineet's progressive disclosure + Smart defaults
 * Design: Slate blue foundation + Merlin purple accents
 * 
 * Experience:
 * - One question at a time (reduces overwhelm)
 * - Smart defaults pre-filled (saves time)
 * - Auto-advance when answered (smooth flow)
 * - Can go back to edit (user-friendly)
 * - Progress tracking (clear completion)
 * 
 * Visual:
 * - Split screen: Dark left sidebar + Main right panel
 * - Left: Progress summary, Merlin avatar
 * - Right: Active question with smart default
 * - Slate blue foundation, purple accents
 * 
 * January 2026
 */

import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import type { WizardState } from '../types';
import merlinIcon from '@/assets/images/new_small_profile_.png';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
  goToStep?: (step: number) => void;
}

// ============================================================================
// QUESTION DEFINITION
// ============================================================================

interface Question {
  id: number;
  field: string;
  question: string;
  subtitle?: string;
  type: 'buttons' | 'slider' | 'number_buttons' | 'toggle';
  options?: Array<{ value: string; label: string; description?: string }>;
  smartDefault: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required?: boolean;
}

function getQuestionsForIndustry(industry: string): Question[] {
  // HOTEL QUESTIONS
  if (industry === 'hotel_hospitality' || industry === 'hotel') {
    return [
      {
        id: 1,
        field: 'propertyType',
        question: 'What type of hotel property?',
        subtitle: 'This helps us estimate your energy profile',
        type: 'buttons',
        options: [
          { value: 'full_service', label: 'Full Service', description: 'Marriott, Hilton, Hyatt style' },
          { value: 'limited_service', label: 'Limited Service', description: 'Holiday Inn, Hampton Inn' },
          { value: 'extended_stay', label: 'Extended Stay', description: 'Residence Inn, Homewood' },
        ],
        smartDefault: 'full_service',
        required: true,
      },
      {
        id: 2,
        field: 'numberOfRooms',
        question: 'How many guest rooms?',
        subtitle: 'Total number of rentable rooms',
        type: 'slider',
        smartDefault: 150,
        min: 20,
        max: 500,
        step: 10,
        unit: ' rooms',
        required: true,
      },
      {
        id: 3,
        field: 'floors',
        question: 'Number of floors?',
        type: 'number_buttons',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6+', label: '6+' },
        ],
        smartDefault: '4',
        required: true,
      },
      {
        id: 4,
        field: 'hasRestaurant',
        question: 'On-site restaurant?',
        type: 'toggle',
        smartDefault: true,
      },
      {
        id: 5,
        field: 'hasPool',
        question: 'Swimming pool?',
        type: 'toggle',
        smartDefault: true,
      },
      {
        id: 6,
        field: 'hasFitness',
        question: 'Fitness center?',
        type: 'toggle',
        smartDefault: true,
      },
      {
        id: 7,
        field: 'hasConference',
        question: 'Conference/meeting rooms?',
        type: 'toggle',
        smartDefault: true,
      },
      {
        id: 8,
        field: 'occupancyRate',
        question: 'Average occupancy rate?',
        subtitle: 'Typical throughout the year',
        type: 'slider',
        smartDefault: 70,
        min: 30,
        max: 95,
        step: 5,
        unit: '%',
        required: true,
      },
    ];
  }

  // CAR WASH QUESTIONS
  if (industry === 'car_wash') {
    return [
      {
        id: 1,
        field: 'washType',
        question: 'What type of car wash?',
        type: 'buttons',
        options: [
          { value: 'express_tunnel', label: 'Express Tunnel', description: '100-200 ft automated' },
          { value: 'mini_tunnel', label: 'Mini Tunnel', description: '50-80 ft compact' },
          { value: 'iba', label: 'In-Bay Automatic', description: 'Single bay rollover' },
          { value: 'self_serve', label: 'Self-Serve', description: 'Multiple bays' },
        ],
        smartDefault: 'express_tunnel',
        required: true,
      },
      {
        id: 2,
        field: 'tunnelLength',
        question: 'Tunnel length?',
        type: 'slider',
        smartDefault: 120,
        min: 50,
        max: 200,
        step: 10,
        unit: ' ft',
        required: true,
      },
      {
        id: 3,
        field: 'washesPerDay',
        question: 'How many washes per day?',
        subtitle: 'Average daily volume',
        type: 'slider',
        smartDefault: 200,
        min: 50,
        max: 500,
        step: 25,
        unit: ' cars',
        required: true,
      },
      {
        id: 4,
        field: 'hasVacuums',
        question: 'Vacuum stations?',
        type: 'toggle',
        smartDefault: true,
      },
      {
        id: 5,
        field: 'hasDetailBays',
        question: 'Detail bays?',
        type: 'toggle',
        smartDefault: false,
      },
    ];
  }

  // DEFAULT QUESTIONS
  return [
    {
      id: 1,
      field: 'facilitySize',
      question: 'Total facility size?',
      type: 'slider',
      smartDefault: 10000,
      min: 1000,
      max: 100000,
      step: 1000,
      unit: ' sq ft',
      required: true,
    },
    {
      id: 2,
      field: 'operatingHours',
      question: 'Daily operating hours?',
      type: 'slider',
      smartDefault: 12,
      min: 8,
      max: 24,
      step: 1,
      unit: ' hrs',
      required: true,
    },
  ];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step3Details({ state, updateState, goToStep }: Props) {
  const questions = getQuestionsForIndustry(state.industry || 'default');
  
  // Initialize with smart defaults
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    questions.forEach(q => {
      initial[q.field] = q.smartDefault;
    });
    return { ...initial, ...(state.useCaseData?.inputs || {}) };
  });

  const [activeQuestion, setActiveQuestion] = useState(1);

  // Update parent state
  useEffect(() => {
    updateState({ useCaseData: { inputs: answers } });
  }, [answers, updateState]);

  // Auto-advance when question is answered (optional)
  const handleAnswer = (field: string, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    
    // Auto-advance to next question after brief delay
    setTimeout(() => {
      if (activeQuestion < questions.length) {
        setActiveQuestion(activeQuestion + 1);
      }
    }, 400);
  };

  const currentQuestion = questions[activeQuestion - 1];
  const answeredCount = questions.filter(q => answers[q.field] !== undefined).length;
  const completionPercent = Math.round((answeredCount / questions.length) * 100);

  const industryName = state.industryName || state.industry || 'facility';
  const locationName = state.city ? `${state.city}, ${state.state}` : state.state || 'your location';

  return (
    <div className="flex min-h-[calc(100vh-200px)]">
      {/* ═══════════════════════════════════════════════════════════
          LEFT SIDEBAR - Progress & Summary
          ═══════════════════════════════════════════════════════════ */}
      <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8 flex flex-col">
        {/* Merlin Avatar */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-1 shadow-lg shadow-purple-500/30">
              <img 
                src={merlinIcon} 
                alt="Merlin" 
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-900">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Tell me about your facility
          </h2>
          <p className="text-slate-400 text-sm">
            {industryName} in {locationName}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm font-semibold text-white">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {answeredCount} of {questions.length} questions
          </p>
        </div>

        {/* Question List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {questions.map((q) => {
            const isAnswered = answers[q.field] !== undefined;
            const isActive = q.id === activeQuestion;
            
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(q.id)}
                className={`
                  w-full text-left p-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-purple-500/20 border-2 border-purple-500' 
                    : isAnswered
                      ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                      : 'bg-slate-800/30 border border-slate-700/50 opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                    ${isAnswered 
                      ? 'bg-emerald-500 text-white' 
                      : isActive
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-500'
                    }
                  `}>
                    {isAnswered ? <Check className="w-4 h-4" /> : q.id}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {q.question}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Smart Defaults Notice */}
        <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-xs text-purple-300">
            <Sparkles className="w-3 h-3 inline mr-1" />
            All questions have smart defaults pre-filled. Just review and adjust if needed.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL - Active Question
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 bg-slate-900 flex flex-col">
        {/* Question Content */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-2xl w-full">
            {/* Question Number */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                <span className="text-lg font-bold text-purple-300">
                  {currentQuestion.id}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                Question {currentQuestion.id} of {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {currentQuestion.question}
            </h1>
            
            {currentQuestion.subtitle && (
              <p className="text-lg text-slate-400 mb-8">{currentQuestion.subtitle}</p>
            )}

            {/* Smart Default Indicator */}
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">
                Smart default: <span className="font-semibold">
                  {typeof currentQuestion.smartDefault === 'boolean' 
                    ? (currentQuestion.smartDefault ? 'Yes' : 'No')
                    : currentQuestion.smartDefault + (currentQuestion.unit || '')}
                </span>
              </span>
            </div>

            {/* Input Component */}
            <div>
              {currentQuestion.type === 'buttons' && currentQuestion.options && (
                <div className="grid gap-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.field] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.field, option.value)}
                        className={`
                          p-6 rounded-2xl text-left transition-all border-2
                          ${isSelected
                            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500 shadow-lg shadow-purple-500/25'
                            : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">{option.label}</h3>
                            {option.description && (
                              <p className="text-sm text-slate-400">{option.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'slider' && (
                <div className="space-y-6">
                  {/* Current Value */}
                  <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <span className="text-6xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {answers[currentQuestion.field] || currentQuestion.smartDefault}
                    </span>
                    {currentQuestion.unit && (
                      <span className="text-3xl text-purple-300 ml-2">{currentQuestion.unit}</span>
                    )}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    step={currentQuestion.step}
                    value={answers[currentQuestion.field] || currentQuestion.smartDefault}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.field]: Number(e.target.value) }))}
                    className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-xl
                      [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-purple-500 [&::-moz-range-thumb]:to-indigo-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-xl"
                  />

                  {/* Min/Max Labels */}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{currentQuestion.min}{currentQuestion.unit}</span>
                    <span>{currentQuestion.max}{currentQuestion.unit}</span>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => {
                      if (activeQuestion < questions.length) {
                        setActiveQuestion(activeQuestion + 1);
                      } else if (goToStep) {
                        // If on last question, advance to next step
                        goToStep(4);
                      }
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    {activeQuestion < questions.length ? 'Next Question' : 'Continue to Options'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {currentQuestion.type === 'number_buttons' && currentQuestion.options && (
                <div className="grid grid-cols-3 gap-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.field] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.field, option.value)}
                        className={`
                          aspect-square rounded-2xl text-4xl font-bold transition-all border-2
                          ${isSelected
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-500 border-transparent text-white shadow-xl shadow-purple-500/30'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'toggle' && (
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => handleAnswer(currentQuestion.field, true)}
                    className={`
                      p-8 rounded-2xl text-2xl font-bold transition-all border-2
                      ${answers[currentQuestion.field] === true
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-transparent text-white shadow-xl shadow-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-emerald-500/50'
                      }
                    `}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleAnswer(currentQuestion.field, false)}
                    className={`
                      p-8 rounded-2xl text-2xl font-bold transition-all border-2
                      ${answers[currentQuestion.field] === false
                        ? 'bg-slate-700 border-slate-600 text-white shadow-lg'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                      }
                    `}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setActiveQuestion(Math.max(1, activeQuestion - 1))}
            disabled={activeQuestion === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${q.id === activeQuestion
                    ? 'bg-purple-500 w-8'
                    : answers[q.field] !== undefined
                      ? 'bg-emerald-500'
                      : 'bg-slate-700'
                  }
                `}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveQuestion(Math.min(questions.length, activeQuestion + 1))}
            disabled={activeQuestion === questions.length}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Step3Details;
