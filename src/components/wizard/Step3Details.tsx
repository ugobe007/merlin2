import React, { useState, useEffect, useMemo } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { QuestionnaireEngine } from './QuestionnaireEngine';
import { MerlinAdvisorPanel } from './MerlinAdvisorPanel';
import { CAR_WASH_QUESTIONS } from '@/data/carwash-questions.config';
import type { Question } from '@/data/carwash-questions.config';
import { UseCaseService } from '@/services/useCaseService';
import { loadUseCaseConditions, type UseCaseConditions } from '@/services/useCaseConditionsService';



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
  // CRITICAL: number_buttons REQUIRES options, so check first!
  let questionType: Question['type'] = 'buttons';
  
  // Check if we have min/max for number types (can use slider instead)
  const hasMinMax = (dbQuestion.min_value !== null && dbQuestion.min_value !== undefined) &&
                    (dbQuestion.max_value !== null && dbQuestion.max_value !== undefined);
  
  if (dbType === 'number') {
    // If number type has min/max, prefer slider (doesn't need options)
    if (hasMinMax) {
      questionType = 'slider';
    } else {
      // number_buttons requires options - will check below
      questionType = 'number_buttons';
    }
  } else if (dbType === 'slider') {
    questionType = 'slider';
  } else if (dbType === 'select') {
    questionType = 'buttons';
  } else if (dbType === 'boolean' || dbType === 'toggle') {
    questionType = 'toggle';
  } else if (dbType === 'area_input') {
    questionType = 'area_input';
  } else if (dbType === 'text') {
    // Text input - not yet supported, fallback to buttons
    console.warn(`⚠️ Text input type not yet supported for question: ${fieldName}`);
    questionType = 'buttons';
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
  
  // CRITICAL FIX: If number_buttons has no options, generate them or fallback to slider
  // Also: If range is large (>20 or >15 options), prefer slider for better UX
  if (questionType === 'number_buttons' && !options) {
    const min = dbQuestion.min_value !== null && dbQuestion.min_value !== undefined 
      ? Number(dbQuestion.min_value) 
      : 0;
    const max = dbQuestion.max_value !== null && dbQuestion.max_value !== undefined 
      ? Number(dbQuestion.max_value) 
      : 10;
    
    // If range is large, use slider instead
    if (max > 20 || (max - min) > 15) {
      questionType = 'slider';
      console.log(`⚠️ Number question "${fieldName}" has large range (${min}-${max}), using slider instead`);
    }
    
    // If we have a reasonable range, generate options
    if (max <= 20 && max > min) {
      options = Array.from({ length: max - min + 1 }, (_, i) => ({
        value: String(min + i),
        label: String(min + i),
        icon: undefined,
        description: undefined
      }));
      console.log(`✅ Generated ${options.length} options for number_buttons question: ${fieldName}`);
    } else if (hasMinMax) {
      // Fallback to slider if range is too large
      console.warn(`⚠️ Number question "${fieldName}" has large range (${min}-${max}), using slider instead`);
      questionType = 'slider';
    } else {
      // Last resort: generate 0-10 options
      console.warn(`⚠️ Number question "${fieldName}" has no options or range, generating 0-10 options`);
      options = Array.from({ length: 11 }, (_, i) => ({
        value: String(i),
        label: String(i),
        icon: undefined,
        description: undefined
      }));
    }
  }
  
  // Validate: buttons and number_buttons MUST have options
  if ((questionType === 'buttons' || questionType === 'number_buttons') && !options) {
    console.error(`❌ CRITICAL: Question "${fieldName}" (${questionType}) has no options!`);
    console.error(`   Database question:`, {
      question_type: dbType,
      field_name: fieldName,
      select_options: dbQuestion.select_options,
      options: dbQuestion.options,
      min_value: dbQuestion.min_value,
      max_value: dbQuestion.max_value
    });
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visibleQuestionsLength, setVisibleQuestionsLength] = useState(0);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<UseCaseConditions | null>(null);

  // Load questions based on industry
  useEffect(() => {
    async function loadQuestions() {
      if (!state.industry) {
        console.warn('⚠️ No industry selected, showing empty state');
        setQuestions([]);
        setCurrentQuestion(null);
        setLoading(false);
        return;
      }

      // Load use case conditions (all template variables in one place)
      try {
        const useCaseConditions = await loadUseCaseConditions(state.industry);
        setConditions(useCaseConditions);
        
        if (import.meta.env.DEV) {
          console.log('✅ [Conditions Loaded]', {
            useCase: useCaseConditions.useCaseSlug,
            version: useCaseConditions.version,
            source: useCaseConditions.source,
            errors: useCaseConditions.errors?.length || 0
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to load conditions, using fallbacks:', error);
        // Continue without conditions (fallback behavior)
      }

      try {
        // Try multiple slug formats (database uses dashes, but Step2Industry might use underscores)
        const slugVariants = [
          state.industry,                    // Try as-is first
          state.industry.replace(/_/g, '-'), // Convert underscores to dashes (data_center -> data-center)
          state.industry.replace(/-/g, '_')  // Convert dashes to underscores (data-center -> data_center)
        ];
        
        // Remove duplicates
        const uniqueSlugs = Array.from(new Set(slugVariants));
        
        console.log(`\n📋 ========================================`);
        console.log(`📋 STEP 3: Loading Questions`);
        console.log(`📋 ========================================`);
        console.log(`📋 Industry from state: "${state.industry}"`);
        console.log(`🔍 Trying slug variants: ${uniqueSlugs.map(s => `"${s}"`).join(', ')}`);
        
        let useCase = null;
        let foundSlug = null;
        
        // Try each slug variant until we find one that works
        for (const slug of uniqueSlugs) {
          try {
            console.log(`   🔎 Attempting: "${slug}"...`);
            useCase = await useCaseService.getUseCaseBySlug(slug);
            if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
              foundSlug = slug;
              console.log(`   ✅ FOUND! "${slug}" has ${useCase.custom_questions.length} questions`);
              break;
            } else if (useCase) {
              console.log(`   ⚠️  Found use case "${slug}" but it has no questions`);
            } else {
              console.log(`   ❌ Use case "${slug}" not found in database`);
            }
          } catch (err) {
            // Continue to next variant
            console.log(`   ❌ Error with "${slug}":`, err instanceof Error ? err.message : String(err));
          }
        }
        
        if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
          const dbQuestions = useCase.custom_questions;
          console.log(`\n✅ SUCCESS: Loaded ${dbQuestions.length} questions from database`);
          console.log(`✅ Use Case: "${foundSlug}" (${useCase.name || 'Unknown'})`);
          console.log(`✅ First question: "${dbQuestions[0]?.question_text || 'N/A'}"`);
          console.log(`📋 ========================================\n`);
          
          // Transform database questions to our Question format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedQuestions = dbQuestions.map((q: any, index: number) => 
            transformDatabaseQuestion(q, index)
          );
          
          setQuestions(transformedQuestions);
          setCurrentQuestion(transformedQuestions[0]);
          setVisibleQuestionsLength(transformedQuestions.length);
        } else {
          // Fallback to config files if no database questions
          console.log(`\n⚠️  ========================================`);
          console.log(`⚠️  WARNING: No Database Questions Found`);
          console.log(`⚠️  ========================================`);
          console.log(`⚠️  Industry: "${state.industry}"`);
          console.log(`⚠️  Tried slugs: ${uniqueSlugs.map(s => `"${s}"`).join(', ')}`);
          console.log(`⚠️  Checking fallback config files...`);
          
          // For now, only car wash has a config file
          if (state.industry === 'car_wash' || state.industry === 'car-wash') {
            console.log(`✅ Using car wash config file fallback (${CAR_WASH_QUESTIONS.length} questions)`);
            setQuestions(CAR_WASH_QUESTIONS);
            setCurrentQuestion(CAR_WASH_QUESTIONS[0]);
            setVisibleQuestionsLength(CAR_WASH_QUESTIONS.length);
          } else {
            // Empty questions - show "not available" message
            console.error(`❌ No questions available for industry: "${state.industry}"`);
            console.error(`❌ Please check:`);
            console.error(`   1. Does use case "${state.industry}" exist in database?`);
            console.error(`   2. Does it have custom_questions?`);
            console.error(`   3. Is the slug format correct? (tried: ${uniqueSlugs.join(', ')})`);
            console.log(`⚠️  ========================================\n`);
            setQuestions([]);
            setCurrentQuestion(null);
          }
        }
      } catch (error) {
        console.error(`❌ Error loading questions for ${state.industry}:`, error);
        // Show empty state on error (user will see "Questions Not Available" message)
        setQuestions([]);
        setCurrentQuestion(null);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [state.industry]);

  // CRITICAL FIX: Memoize initialValues to prevent infinite loops
  // If we don't memoize, this creates a new object on every render, causing QuestionnaireEngine to reset answers
  const initialValues = useMemo(() => {
    return conditions
      ? { ...conditions.questionDefaults, ...(state.useCaseData?.inputs || {}) }
      : (state.useCaseData?.inputs || {});
  }, [conditions?.questionDefaults, state.useCaseData?.inputs]);

  // Handle questionnaire completion - SIMPLIFIED
  const handleComplete = (answers: Record<string, unknown>) => {
    // Structure the data according to our SSOT format
    const useCaseData = {
      version: '2.0.0',
      industry: state.industry,
      inputs: answers,
      calculated: {}
    };

    // Update wizard state
    updateState({
      useCaseData
    });

    // Move to next step - WizardV6's canProceed() will validate before allowing navigation
    onNext();
  };

  // Handle progress updates
  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  // Handle question changes
  const handleQuestionChange = (question: Question, newProgress: number, questionIndex: number, totalVisible: number) => {
    setCurrentQuestion(question);
    setProgress(newProgress);
    setCurrentQuestionIndex(questionIndex);
    setVisibleQuestionsLength(totalVisible);
  };

  // Track answers and save to wizard state - SIMPLIFIED VERSION
  const handleAnswerUpdate = (updatedAnswers: Record<string, unknown>) => {
    setAnswers(updatedAnswers);
    
    // Count valid answers
    const validAnswerCount = Object.keys(updatedAnswers).filter(key => {
      const value = updatedAnswers[key];
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'object' && 'value' in value) {
        return value.value !== undefined && value.value !== null && value.value !== '';
      }
      return true;
    }).length;
    
    // Update wizard state with current answers
    // WizardV6's canProceed() will check if all questions are answered
    const useCaseData = {
      version: '2.0.0',
      industry: state.industry,
      inputs: updatedAnswers,
      calculated: state.useCaseData?.calculated || {},
      _totalQuestions: questions.length,
      _answeredCount: validAnswerCount
    };
    
    updateState({
      useCaseData
    });
  };

  // Note: Financial metrics are now displayed in the ValueTicker component (sticky at top)
  // This removes duplicate displays and reduces clutter. The ValueTicker receives data from WizardV6.

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

  // Get industry image path
  const getIndustryImage = (industry: string): string => {
    const imageMap: Record<string, string> = {
      'car_wash': '/src/assets/images/car_wash_1.jpg',
      'car-wash': '/src/assets/images/car_wash_1.jpg',
      'hotel_hospitality': '/src/assets/images/hotel_motel_holidayinn_1.jpg',
      'hotel': '/src/assets/images/hotel_motel_holidayinn_1.jpg',
      'heavy_duty_truck_stop': '/src/assets/images/truck_stop.png',
      'heavy-duty-truck-stop': '/src/assets/images/truck_stop.png',
      'ev_charging': '/src/assets/images/ev_charging_station.jpg',
      'ev-charging': '/src/assets/images/ev_charging_station.jpg',
      'retail': '/src/assets/images/retail_1.jpg',
      'warehouse_logistics': '/src/assets/images/logistics_1.jpg',
      'manufacturing': '/src/assets/images/manufacturing_1.jpg',
      'hospital': '/src/assets/images/hospital_1.jpg',
      'office': '/src/assets/images/office_building1.jpg',
      'college': '/src/assets/images/college_1.jpg',
      'restaurant': '/src/assets/images/restaurant_1.jpg',
      'data_center': '/src/assets/images/data-centers',
      'agriculture': '/src/assets/images/agriculture.jpg'
    };
    return imageMap[industry] || '/src/assets/images/Merlin_energy1.jpg';
  };

  return (
    <div className="step3-details relative min-h-screen" style={{ background: 'transparent' }}>
      {/* Left-Side Collapsible Merlin Advisor Panel */}
      {currentQuestion && questions.length > 0 && (
        <MerlinAdvisorPanel
          currentQuestion={currentQuestion}
          questions={questions}
          answers={answers || (initialValues as Record<string, unknown>)}
          currentQuestionIndex={currentQuestionIndex}
          visibleQuestionsLength={visibleQuestionsLength}
          currentWizardStep={3}
          totalWizardSteps={6}
          onJumpToSection={handleJumpToSection}
          onCollapseChange={setIsPanelCollapsed}
        />
      )}

      {/* Main Content Area - Shifts right when panel is open */}
      <div 
        className="relative max-w-6xl mx-auto px-4 py-8 transition-all duration-300" 
        style={{ 
          paddingBottom: '120px',
          marginLeft: isPanelCollapsed ? '0' : '320px' // Shift content when panel is open
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Let's Learn About Your {getIndustryName(state.industry)}
          </h1>
          <p className="text-purple-300 text-lg">
            Answer the questions below - scroll through as you go
          </p>
        </div>

        {/* Questionnaire Engine - Full Width, Scrollable */}
        <div className="space-y-8">
          <QuestionnaireEngine
            questions={questions}
            industry={state.industry}
            initialValues={(initialValues || {}) as Record<string, unknown>}
            onComplete={handleComplete}
            onProgressUpdate={handleProgressUpdate}
            onQuestionChange={(question, progress, questionIndex, totalVisible) => {
              handleQuestionChange(question, progress, questionIndex, totalVisible);
              // CRITICAL: Update total question count in wizard state when question changes
              // This allows Continue button to validate that all questions are answered
              if (totalVisible > 0 && state.useCaseData?._totalQuestions !== totalVisible) {
                updateState({
                  useCaseData: {
                    ...state.useCaseData,
                    _totalQuestions: totalVisible,
                    _visibleQuestionsCount: totalVisible
                  }
                });
              }
            }}
            onAnswerUpdate={handleAnswerUpdate}
            onJumpToSection={handleJumpToSection}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================


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
