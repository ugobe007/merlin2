import React, { useState, useEffect } from 'react';
import { QuestionnaireEngine } from './QuestionnaireEngine';
import { ProgressSidebar } from './ProgressSidebar';
import { CAR_WASH_QUESTIONS } from '@/data/carwash-questions.config';
import type { Question } from '@/data/carwash-questions.config';
import { UseCaseService } from '@/services/useCaseService';

interface Step3DetailsProps {
  state: {
    industry: string;
    useCaseData?: Record<string, unknown>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateState: (updates: any) => void;
  onNext: () => void;
}

const useCaseService = new UseCaseService();

// Transform database question format to Question interface
// The UseCaseService transforms questions, but we need to handle both raw DB format and transformed format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDatabaseQuestion(dbQuestion: any, index: number): Question {
  // Get field name - handle both question_key (schema) and field_name (migrations)
  // UseCaseService ensures both exist, but prioritize field_name (used in migrations)
  const fieldName = dbQuestion.field_name || dbQuestion.question_key || dbQuestion.field || String(dbQuestion.id || index + 1);
  
  // Get question text
  const questionText = dbQuestion.question_text || dbQuestion.question || '';
  
  // Get question type
  const dbType = dbQuestion.question_type || dbQuestion.type || 'select';
  
  // Map database question_type to our Question type
  let questionType: Question['type'] = 'buttons';
  if (dbType === 'number') {
    questionType = 'number_buttons';
  } else if (dbType === 'slider') {
    questionType = 'slider';
  } else if (dbType === 'select') {
    questionType = 'buttons';
  } else if (dbType === 'toggle') {
    questionType = 'toggle';
  } else if (dbType === 'area_input') {
    questionType = 'area_input';
  }

  // Parse options - database schema uses select_options, migrations use options
  let options: Question['options'] = undefined;
  const rawOptions = dbQuestion.select_options || dbQuestion.options;
  
  if (rawOptions) {
    try {
      // Parse JSONB if string, otherwise use directly
      const parsed = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Transform to our format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options = parsed.map((opt: any) => {
          // Handle both {value, label} and simple string formats
          if (typeof opt === 'string') {
            return {
              value: opt.toLowerCase(),
              label: opt,
              icon: undefined,
              description: undefined
            };
          }
          
          return {
            value: opt.value || String(opt).toLowerCase(),
            label: opt.label || opt.value || String(opt),
            icon: opt.icon,
            description: opt.description
          };
        });
      }
    } catch (error) {
      console.warn(`Failed to parse options for question ${fieldName}:`, error);
    }
  }
  
  // Default options for toggle/boolean types
  if (questionType === 'toggle' && !options) {
    options = [
      { value: 'yes', label: 'Yes', icon: '✅' },
      { value: 'no', label: 'No', icon: '❌' }
    ];
  }

  // Map section from section_name (if available) or infer from field name
  let section: Question['section'] = 'facility';
  
  // First, try to use section_name from database
  if (dbQuestion.section_name) {
    const sectionName = String(dbQuestion.section_name).toLowerCase();
    if (sectionName.includes('facility') || sectionName.includes('basics')) {
      section = 'facility';
    } else if (sectionName.includes('operation') || sectionName.includes('hours')) {
      section = 'operations';
    } else if (sectionName.includes('energy') || sectionName.includes('equipment') || sectionName.includes('system')) {
      section = 'energy';
    } else if (sectionName.includes('solar') || sectionName.includes('roof') || sectionName.includes('carport')) {
      section = 'solar';
    }
  } else {
    // Infer section from field name
    const lowerFieldName = fieldName.toLowerCase();
    if (lowerFieldName.includes('solar') || lowerFieldName.includes('roof') || lowerFieldName.includes('carport')) {
      section = 'solar';
    } else if (lowerFieldName.includes('hours') || lowerFieldName.includes('vehicles') || lowerFieldName.includes('operating') || lowerFieldName.includes('days')) {
      section = 'operations';
    } else if (lowerFieldName.includes('charger') || lowerFieldName.includes('ev') || lowerFieldName.includes('heater') || lowerFieldName.includes('pump') || lowerFieldName.includes('service') || lowerFieldName.includes('wash') || lowerFieldName.includes('bay') || lowerFieldName.includes('mcs') || lowerFieldName.includes('dcfc')) {
      section = 'energy';
    }
  }

  // Get range (for sliders and number inputs)
  let range: Question['range'] = undefined;
  const min = dbQuestion.min_value !== null && dbQuestion.min_value !== undefined ? dbQuestion.min_value : dbQuestion.min;
  const max = dbQuestion.max_value !== null && dbQuestion.max_value !== undefined ? dbQuestion.max_value : dbQuestion.max;
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    range = {
      min: Number(min),
      max: Number(max),
      step: Number(dbQuestion.step_value) || Number(dbQuestion.step) || 1
    };
  }

  // Get default value (could be JSONB, string, or number)
  let smartDefault: any = '';
  if (dbQuestion.default_value !== null && dbQuestion.default_value !== undefined) {
    try {
      // Try to parse JSONB, otherwise use directly
      smartDefault = typeof dbQuestion.default_value === 'string' 
        ? (dbQuestion.default_value.startsWith('{') || dbQuestion.default_value.startsWith('[')
          ? JSON.parse(dbQuestion.default_value)
          : dbQuestion.default_value)
        : dbQuestion.default_value;
    } catch {
      smartDefault = dbQuestion.default_value;
    }
  }

  return {
    id: index + 1,
    section,
    field: fieldName,
    question: questionText,
    type: questionType,
    options,
    range,
    unit: dbQuestion.unit || dbQuestion.suffix || '',
    smartDefault,
    helpText: dbQuestion.help_text || dbQuestion.helpText || undefined,
    showIf: undefined, // Can be added later if database supports conditional logic
    merlinTip: undefined // Can be added later if database supports Merlin tips
  };
}

export function Step3Details({ state, updateState, onNext }: Step3DetailsProps) {
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(CAR_WASH_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(CAR_WASH_QUESTIONS[0]);
  const [loading, setLoading] = useState(true);

  // Load questions based on industry
  useEffect(() => {
    async function loadQuestions() {
      if (!state.industry) {
        setQuestions(CAR_WASH_QUESTIONS);
        setCurrentQuestion(CAR_WASH_QUESTIONS[0]);
        setLoading(false);
        return;
      }

      try {
        // Normalize industry slug (handle both dash and underscore formats)
        // Database uses underscores (e.g., 'heavy_duty_truck_stop')
        const useCaseSlug = state.industry.replace(/-/g, '_');
        
        console.log(`📋 Loading questions for industry: ${state.industry} (slug: ${useCaseSlug})`);
        
        // Fetch questions from database
        const useCase = await useCaseService.getUseCaseBySlug(useCaseSlug);
        
        if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
          const dbQuestions = useCase.custom_questions;
          console.log(`✅ Loaded ${dbQuestions.length} questions from database for ${useCaseSlug}`);
          
          // Transform database questions to our Question format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedQuestions = dbQuestions.map((q: any, index: number) => 
            transformDatabaseQuestion(q, index)
          );
          
          setQuestions(transformedQuestions);
          setCurrentQuestion(transformedQuestions[0]);
        } else {
          // Fallback to config files if no database questions
          console.log(`⚠️ No database questions found for ${useCaseSlug}, using fallback`);
          
          // For now, only car wash has a config file
          if (state.industry === 'car_wash' || state.industry === 'car-wash') {
            setQuestions(CAR_WASH_QUESTIONS);
            setCurrentQuestion(CAR_WASH_QUESTIONS[0]);
          } else {
            // Empty questions fallback (should not happen in production)
            console.warn(`No questions available for industry: ${state.industry}`);
            setQuestions([]);
          }
        }
      } catch (error) {
        console.error(`Error loading questions for ${state.industry}:`, error);
        // Fallback to car wash questions on error
        setQuestions(CAR_WASH_QUESTIONS);
        setCurrentQuestion(CAR_WASH_QUESTIONS[0]);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [state.industry]);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__questionnaireJumpToSection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__questionnaireJumpToSection(sectionId);
      }
    }
  };

  if (loading) {
    return (
      <div className="step3-details flex h-screen bg-slate-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="step3-details flex h-screen bg-slate-900 items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Questions Not Available
          </h1>
          <p className="text-slate-400 text-lg mb-6">
            We're sorry, but we don't have questions configured for <strong>{getIndustryName(state.industry)}</strong> yet.
          </p>
          <button
            onClick={onNext}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

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
    'car-wash': 'Car Wash',
    hotel_hospitality: 'Hotel',
    'hotel-hospitality': 'Hotel',
    hotel: 'Hotel',
    retail: 'Retail Store',
    warehouse_logistics: 'Warehouse',
    'warehouse-logistics': 'Warehouse',
    warehouse: 'Warehouse',
    manufacturing: 'Manufacturing Facility',
    tribal_casino: 'Tribal Casino',
    'tribal-casino': 'Tribal Casino',
    government: 'Government Facility',
    heavy_duty_truck_stop: 'Truck Stop / Travel Center',
    'heavy-duty-truck-stop': 'Truck Stop / Travel Center',
    ev_charging: 'EV Charging Hub',
    'ev-charging': 'EV Charging Hub',
    data_center: 'Data Center',
    'data-center': 'Data Center',
    hospital: 'Hospital / Healthcare',
    office: 'Office Building',
    college: 'College / University',
    restaurant: 'Restaurant',
    agriculture: 'Agriculture'
  };

  return industryNames[industry] || industry.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
