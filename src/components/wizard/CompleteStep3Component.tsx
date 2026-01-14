/**
 * Complete Step 3 Component
 *
 * Main orchestrator for the questionnaire
 * Manages state, navigation, progress tracking
 * 
 * ✅ FIXED Jan 2025: Now loads questions dynamically from database
 * based on selected industry (state.industry)
 */

import React, { useState, useEffect, useRef } from "react";
import { CompleteQuestionRenderer } from "./CompleteQuestionRenderer";
import { IndustryOpportunityPanel } from "./IndustryOpportunityPanel";
import { useCaseService } from "@/services/useCaseService";
import {
  carWashQuestionsComplete,
  carWashSections,
  type Question,
} from "@/data/carwash-questions-complete.config";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

// Industry header images
import hotelImg from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import carWashImg from '@/assets/images/Car_Wash_PitStop.jpg';
import evChargingImg from '@/assets/images/ev_charging_station.jpg';
import manufacturingImg from '@/assets/images/manufacturing_1.jpg';
import dataCenterImg from '@/assets/images/data-centers/data-center-1.jpg';
import hospitalImg from '@/assets/images/hospital_1.jpg';
import retailImg from '@/assets/images/retail_1.jpg';
import officeImg from '@/assets/images/office_building1.jpg';
import collegeImg from '@/assets/images/college_1.jpg';
import warehouseImg from '@/assets/images/logistics_1.jpg';
import restaurantImg from '@/assets/images/restaurant_1.jpg';
import agricultureImg from '@/assets/images/indoor_farm1.jpeg';
import truckStopImg from '@/assets/images/truck_stop.png';
import airportImg from '@/assets/images/airports_1.jpg';

// Map industry slugs to header images
const INDUSTRY_IMAGES: Record<string, string> = {
  'hotel': hotelImg,
  'hotel_hospitality': hotelImg,
  'car_wash': carWashImg,
  'car-wash': carWashImg,
  'ev_charging': evChargingImg,
  'ev-charging': evChargingImg,
  'manufacturing': manufacturingImg,
  'data_center': dataCenterImg,
  'data-center': dataCenterImg,
  'hospital': hospitalImg,
  'retail': retailImg,
  'office': officeImg,
  'college': collegeImg,
  'warehouse': warehouseImg,
  'restaurant': restaurantImg,
  'agriculture': agricultureImg,
  'agricultural': agricultureImg,
  'heavy_duty_truck_stop': truckStopImg,
  'truck_stop': truckStopImg,
  'airport': airportImg,
};

// Transform database question to component format
function transformDatabaseQuestion(dbQuestion: Record<string, unknown>, index: number): Question {
  // Map database options to component format
  let options: { value: string; label: string; description?: string; icon?: string }[] = [];
  
  // Try different field names for options (DB schema variations)
  const rawOptions = (dbQuestion.select_options || dbQuestion.options || []) as unknown[];
  
  if (Array.isArray(rawOptions)) {
    options = rawOptions.map((opt: unknown) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      const optObj = opt as Record<string, unknown>;
      return {
        value: String(optObj.value || optObj.id || opt),
        label: String(optObj.label || optObj.text || optObj.value || opt),
        description: optObj.description as string | undefined,
        icon: optObj.icon as string | undefined,
      };
    });
  }

  // Map section to valid values
  const sectionRaw = (dbQuestion.section || 'facility') as string;
  const validSections = ['facility', 'operations', 'equipment', 'solar'] as const;
  const section: typeof validSections[number] = validSections.includes(sectionRaw as typeof validSections[number]) 
    ? sectionRaw as typeof validSections[number]
    : 'facility';

  return {
    id: (dbQuestion.question_key || dbQuestion.field_name || `q_${index}`) as string,
    type: mapQuestionType((dbQuestion.input_type || dbQuestion.question_type || 'text') as string),
    section,
    title: (dbQuestion.question_text || dbQuestion.label || 'Question') as string,
    subtitle: dbQuestion.help_text as string | undefined || dbQuestion.description as string | undefined,
    options,
    validation: {
      required: (dbQuestion.is_required as boolean) ?? true,
    },
    smartDefault: dbQuestion.default_value,
    merlinTip: dbQuestion.merlin_tip as string | undefined,
  };
}

// Map database question types to component types
function mapQuestionType(dbType: string): Question['type'] {
  const typeMap: Record<string, Question['type']> = {
    'select': 'buttons',
    'dropdown': 'buttons',
    'radio': 'buttons',
    'checkbox': 'multiselect',
    'number': 'number_input',
    'text': 'buttons',
    'slider': 'slider',
    'toggle': 'toggle',
    'buttons': 'buttons',
    'multi-select': 'multiselect',
    'multiselect': 'multiselect',
  };
  return typeMap[dbType] || 'buttons';
}

// Create sections from questions
function createSectionsFromQuestions(questions: Question[]) {
  const sectionMap = new Map<string, { id: string; title: string; description: string; icon: string; questions: Question[] }>();
  
  const sectionConfig: Record<string, { title: string; description: string; icon: string }> = {
    'facility': { title: 'Facility Details', description: 'Basic information about your facility', icon: '🏢' },
    'operations': { title: 'Operations', description: 'How your facility operates', icon: '⚙️' },
    'equipment': { title: 'Equipment', description: 'Equipment and machinery details', icon: '🔧' },
    'solar': { title: 'Solar Potential', description: 'Solar and renewable energy options', icon: '☀️' },
    'energy': { title: 'Energy Profile', description: 'Your energy usage and needs', icon: '⚡' },
    'goals': { title: 'Goals', description: 'Your energy goals', icon: '🎯' },
    'general': { title: 'General', description: 'General information', icon: '📋' },
  };
  
  questions.forEach(q => {
    const sectionId = q.section || 'general';
    if (!sectionMap.has(sectionId)) {
      const config = sectionConfig[sectionId] || { 
        title: sectionId.charAt(0).toUpperCase() + sectionId.slice(1), 
        description: `${sectionId} questions`,
        icon: '📋'
      };
      sectionMap.set(sectionId, {
        id: sectionId,
        title: config.title,
        description: config.description,
        icon: config.icon,
        questions: [],
      });
    }
    sectionMap.get(sectionId)!.questions.push(q);
  });
  
  return Array.from(sectionMap.values());
}

interface CompleteStep3ComponentProps {
  state?: {
    industry?: string;
    industryName?: string;
    location?: string;
    electricityRate?: number;
    sunHours?: number;
    goals?: string[];
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

  // ✅ NEW: Dynamic questions loading based on industry
  const [questions, setQuestions] = useState<Question[]>(carWashQuestionsComplete);
  const [sections, setSections] = useState(carWashSections);
  const [loading, setLoading] = useState(true);
  const [industryTitle, setIndustryTitle] = useState("Car Wash");

  // ✅ Load questions dynamically based on industry
  useEffect(() => {
    async function loadQuestions() {
      const industry = state.industry;
      
      if (!industry) {
        console.log("📋 No industry selected, using car wash questions as default");
        setQuestions(carWashQuestionsComplete);
        setSections(carWashSections);
        setIndustryTitle("Car Wash");
        setLoading(false);
        return;
      }

      try {
        // Normalize slug: convert underscores to hyphens for DB
        let slug = industry.replace(/_/g, '-');
        console.log(`📋 Loading questions for industry: ${industry} (slug: ${slug})`);

        // Fetch from database
        let useCase = await useCaseService.getUseCaseBySlug(slug);
        
        // Fallback: try with underscores if hyphens don't work
        if (!useCase && slug.includes('-')) {
          slug = industry;
          console.log(`⚠️ Not found with hyphen, trying: ${slug}`);
          useCase = await useCaseService.getUseCaseBySlug(slug);
        }

        if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
          const dbQuestions = useCase.custom_questions as Record<string, unknown>[];
          console.log(`✅ Loaded ${dbQuestions.length} questions from database for ${useCase.name}`);
          
          // Transform to component format
          const transformedQuestions = dbQuestions.map((q, i) => 
            transformDatabaseQuestion(q, i)
          );
          
          setQuestions(transformedQuestions);
          setSections(createSectionsFromQuestions(transformedQuestions));
          setIndustryTitle(useCase.name || state.industryName || industry);
        } else {
          // Fallback to car wash if no DB questions
          console.log(`⚠️ No database questions found for ${slug}, using car wash fallback`);
          
          if (industry === 'car_wash' || industry === 'car-wash') {
            setQuestions(carWashQuestionsComplete);
            setSections(carWashSections);
            setIndustryTitle("Car Wash");
          } else {
            // For other industries without DB questions, show a message
            console.warn(`No questions available for industry: ${industry}`);
            setQuestions([]);
            setSections([]);
            setIndustryTitle(state.industryName || industry.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
          }
        }
      } catch (error) {
        console.error(`Error loading questions for ${industry}:`, error);
        // Fallback to car wash on error
        setQuestions(carWashQuestionsComplete);
        setSections(carWashSections);
        setIndustryTitle("Car Wash");
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [state.industry, state.industryName]);

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
  const visibleQuestions = questions.filter((q) => {
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
  const sectionProgress = sections.map((section) => {
    const sectionQuestions = section.questions.filter((q: Question) => {
      if (!q.conditionalLogic) return true;
      const dependentValue = answers[q.conditionalLogic.dependsOn];
      return q.conditionalLogic.showIf(dependentValue);
    });
    const answered = sectionQuestions.filter((q: Question) => answers[q.id] !== undefined).length;
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
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading questions for {state.industryName || state.industry || 'your facility'}...</p>
        </div>
      </div>
    );
  }
  
  // No questions state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-white mb-2">Questions Coming Soon</h2>
          <p className="text-slate-400 mb-6">
            We're still building the questionnaire for {industryTitle}. 
            In the meantime, you can continue with default settings.
          </p>
          <button
            onClick={() => onNext?.()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
          >
            Continue with Defaults
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Main Content - Full Width (no sidebar) */}
      <div className="flex flex-col min-h-screen">
        {/* Compact Header with Progress */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Navigation */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors">
                  <span>🏠</span>
                  <span className="font-medium">Home</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-white text-sm transition-colors">
                  <span>🔄</span>
                  <span className="font-medium">Start Over</span>
                </button>
              </div>

              {/* Center: Progress Ring */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#334155" strokeWidth="3" />
                      <circle 
                        cx="20" cy="20" r="16" fill="none" 
                        stroke="url(#progress-gradient)" 
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                        strokeDashoffset="0"
                        style={{ strokeDasharray: `${overallProgress * 1.005} 100` }}
                      />
                      <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {Math.round(overallProgress)}%
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="text-white font-medium">{answeredCount}/{totalQuestions}</div>
                    <div className="text-slate-400 text-xs">answered</div>
                  </div>
                </div>
              </div>

              {/* Right: Step indicator */}
              <div className="text-slate-400 text-sm">
                Step <span className="text-white font-semibold">3</span> of{" "}
                <span className="text-white font-semibold">6</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Questions Area */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Industry Header Image */}
            {state.industry && INDUSTRY_IMAGES[state.industry] && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">
                <div className="relative h-48 md:h-56">
                  <img 
                    src={INDUSTRY_IMAGES[state.industry]} 
                    alt={industryTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                      Let's Learn About Your {industryTitle}
                    </h1>
                    <p className="text-slate-300 text-lg">
                      Answer a few questions so Merlin can size the perfect energy system for you.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Fallback title if no image */}
            {(!state.industry || !INDUSTRY_IMAGES[state.industry]) && (
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-3">
                  Let's Learn About Your {industryTitle}
                </h1>
                <p className="text-xl text-slate-400">
                  Answer a few questions so Merlin can size the perfect energy system for you.
                </p>
              </div>
            )}
            
            {/* Industry Opportunity Panel */}
            <IndustryOpportunityPanel
              industry={state.industry || 'car-wash'}
              industryName={state.industryName || industryTitle}
              state={state.location}
              electricityRate={state.electricityRate}
              sunHours={state.sunHours}
              goals={state.goals}
            />

            {/* Questions */}
            <div className="space-y-12">
              {visibleQuestions.map((question, index) => (
                <div
                  key={question.id}
                  ref={(el) => {
                    questionRefs.current[index] = el;
                  }}
                  className="scroll-mt-24 transition-all duration-300 opacity-100"
                  onClick={() => setCurrentQuestionIndex(index)}
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
