/**
 * V6 Step 3: Facility Details - Dynamic Questions from Database
 * Fetches questions from Supabase custom_questions table based on use_case_id
 * Supports: select, number, boolean, text question types
 */
import React, { useEffect, useState } from 'react';
import { Building2, Loader2, AlertCircle, ChevronDown, Check, Sun } from 'lucide-react';
import type { WizardState } from '../types';
import { supabase } from '@/services/supabaseClient';
import sunIcon from '@/assets/images/sun_icon.png';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

interface CustomQuestion {
  id: string;
  use_case_id: string;
  question_text: string;
  question_type: 'select' | 'number' | 'boolean' | 'text' | 'multiselect';
  field_name: string;
  options: Array<{ label: string; value: string }> | string[] | null;
  is_required: boolean;
  min_value: string | null;
  max_value: string | null;
  default_value: string | null;
  display_order: number;
  help_text: string | null;
  placeholder: string | null;
  is_advanced: boolean;
}

// Map industry slug to use_case_id (from your database)
const INDUSTRY_TO_USE_CASE: Record<string, string> = {
  'car_wash': '4c736f5e-3d8e-44e0-8472-68a903d406d2',
  'hotel': '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9',
  'data_center': '79884210-7439-45fd-8853-b1c3978b75e7',
  'ev_charging': '19d0266d-feb9-4c6e-8f70-905b06f16e71',
  'hospital': '0e2c2c6c-0939-41f9-b1ba-bf7d1d34eaf9',
  'manufacturing': '77b9da75-9805-4635-91e2-db9bfed2e5fb',
  'office': 'e72265cf-d87e-41cc-9676-24dc215590b5',
  'retail': '67d5aa44-4f0c-49b6-af24-ba9cc6a1e368',
  'warehouse': '50a119a7-99b5-4403-b6a7-18ce5816ab53',
  'college': 'dd7fb36d-342e-4198-8267-c292d1155022',
  'indoor_farm': '91a73821-e782-4380-935b-56f4472c566f',
  'airport': 'eca5965d-ce78-438a-af1b-2b1cb49dd6a8',
};

// ============================================================================
// QUESTION COMPONENTS
// ============================================================================

function SelectQuestion({ 
  question, 
  value, 
  onChange 
}: { 
  question: CustomQuestion; 
  value: string; 
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Normalize options to always be { label, value } format
  const normalizedOptions = question.options?.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: opt };
    }
    return opt;
  }) || [];

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className={`relative ${isOpen ? "z-[100]" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-br from-white via-purple-50/30 to-cyan-50/30 border-2 border-purple-300 rounded-xl text-left flex items-center justify-between hover:border-purple-500 hover:shadow-md transition-all"
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-emerald-500'}>
          {selectedOption?.label || question.placeholder || 'Select an option...'}
        </span>
        <ChevronDown className={`w-5 h-5 text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-[200] mt-2 w-full bg-white border-2 border-purple-300 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {normalizedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-cyan-50 flex items-center justify-between transition-all ${
                value === opt.value ? 'bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 font-medium' : 'text-emerald-600'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-4 h-4 text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberQuestion({ 
  question, 
  value, 
  onChange 
}: { 
  question: CustomQuestion; 
  value: number; 
  onChange: (val: number) => void;
}) {
  const min = question.min_value ? parseFloat(question.min_value) : 0;
  const max = question.max_value ? parseFloat(question.max_value) : 10000;
  const defaultVal = question.default_value ? parseFloat(question.default_value) : min;
  
  // Calculate smart step based on range
  const range = max - min;
  const step = range > 1000 ? 100 : range > 100 ? 10 : 1;
  
  // Generate smart presets based on range
  const presets = [
    min,
    Math.round((min + max) * 0.25),
    Math.round((min + max) * 0.5),
    Math.round((min + max) * 0.75),
    max
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString();
  };

  return (
    <div className="space-y-3">
      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || defaultVal}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #8b5cf6 0%, #06b6d4 ${((value || defaultVal - min) / (max - min)) * 100}%, #e5e7eb ${((value || defaultVal - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
      
      {/* Value display */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {presets.slice(0, 5).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                value === preset
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md'
                  : 'bg-white border border-purple-200 text-emerald-600 hover:border-purple-400 hover:bg-purple-50'
              }`}
            >
              {formatValue(preset)}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 bg-gradient-to-br from-purple-100 via-cyan-50 to-purple-100 border-2 border-purple-400 rounded-xl shadow-md">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">{formatValue(value || defaultVal)}</span>
        </div>
      </div>
    </div>
  );
}

function BooleanQuestion({ 
  question, 
  value, 
  onChange 
}: { 
  question: CustomQuestion; 
  value: boolean; 
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
          value === true
            ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-2 border-transparent shadow-lg shadow-purple-500/30'
            : 'bg-white text-emerald-600 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50'
        }`}
      >
        ✓ Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
          value === false
            ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-2 border-transparent shadow-lg'
            : 'bg-white text-emerald-600 border-2 border-slate-200 hover:border-slate-400'
        }`}
      >
        ✗ No
      </button>
    </div>
  );
}

function TextQuestion({ 
  question, 
  value, 
  onChange 
}: { 
  question: CustomQuestion; 
  value: string; 
  onChange: (val: string) => void;
}) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || 'Enter value...'}
      className="w-full px-4 py-3 bg-gradient-to-br from-white via-purple-50/30 to-cyan-50/30 border-2 border-purple-300 rounded-xl text-gray-900 placeholder-emerald-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
    />
  );
}

function MultiselectQuestion({ 
  question, 
  value, 
  onChange 
}: { 
  question: CustomQuestion; 
  value: string[]; 
  onChange: (val: string[]) => void;
}) {
  const normalizedOptions = question.options?.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: opt };
    }
    return opt;
  }) || [];

  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  // Use grid layout: 3 per row on large screens, 2 on medium, 1 on small
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {normalizedOptions.map((opt) => {
        const isSelected = selectedValues.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleOption(opt.value)}
            className={`px-4 py-3 rounded-xl text-left border-2 transition-all ${
              isSelected
                ? 'bg-gradient-to-br from-purple-500 to-cyan-500 border-transparent text-white font-medium shadow-lg shadow-purple-500/30'
                : 'bg-white border-slate-200 text-emerald-600 hover:border-purple-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{opt.label}</span>
              {isSelected && <Check className="w-5 h-5 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// QUESTION CARD WRAPPER
// ============================================================================

function QuestionCard({ 
  question, 
  value, 
  onChange,
  index
}: { 
  question: CustomQuestion;
  value: any;
  onChange: (val: any) => void;
  index: number;
}) {
  // Get emoji based on field name
  const getIcon = (fieldName: string): string => {
    const icons: Record<string, string> = {
      brand: '🏷️',
      facilitySubtype: '🏢',
      washBays: '🚗',
      squareFeet: '📐',
      totalFacilitySquareFootage: '📐',
      rooftopSquareFootage: '☀️',
      gridCapacityKW: '⚡',
      dailyVehicles: '🚙',
      peakDemandKW: '📊',
      operatingHours: '🕐',
      hoursPerDay: '🕐',
      daysPerWeek: '📅',
      pumpCount: '💧',
      vacuumStations: '🧹',
      hasVacuums: '🧹',
      hasDryers: '💨',
      monthlyDemandCharges: '💰',
      existingSolarKW: '☀️',
      wantsSolar: '🌞',
      existingEVChargers: '🔌',
      wantsEVCharging: '🔋',
      primaryBESSApplication: '🎯',
      roomCount: '🛏️',
      bedCount: '🏥',
      rackCount: '🖥️',
      chargerCount: '⚡',
    };
    return icons[fieldName] || '📋';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 border-2 border-slate-200 shadow-lg hover:border-purple-300 transition-colors" style={{ position: "relative", zIndex: 100 - index }}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{getIcon(question.field_name)}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {question.question_text}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.help_text && (
            <p className="text-sm text-emerald-500 font-medium mt-1">{question.help_text}</p>
          )}
        </div>
      </div>

      {question.question_type === 'select' && (
        <SelectQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.question_type === 'number' && (
        <NumberQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.question_type === 'boolean' && (
        <BooleanQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.question_type === 'text' && (
        <TextQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.question_type === 'multiselect' && (
        <MultiselectQuestion question={question} value={Array.isArray(value) ? value : []} onChange={onChange} />
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Step3Details({ state, updateState }: Props) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get use_case_id from industry
  const useCaseId = INDUSTRY_TO_USE_CASE[state.industry] || null;

  // Fetch questions from Supabase
  useEffect(() => {
    async function fetchQuestions() {
      if (!useCaseId) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('custom_questions')
          .select('*')
          .eq('use_case_id', useCaseId)
          .order('display_order', { ascending: true }).neq('field_name', 'energyGoals');

        if (fetchError) throw fetchError;

        setQuestions(data || []); console.log("[Step3] Loaded questions:", data?.length, data?.map(q => q.field_name));
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [useCaseId]);

  // Update answer in state
  const updateAnswer = (fieldName: string, value: any) => {
    updateState({
      useCaseData: {
        ...state.useCaseData,
        [fieldName]: value
      }
    });
  };

  // Get current value for a question
  const getValue = (question: CustomQuestion) => {
    const stored = state.useCaseData?.[question.field_name];
    if (stored !== undefined) return stored;
    
    // Return default value based on type
    if (question.default_value) {
      if (question.question_type === 'number') {
        return parseFloat(question.default_value);
      }
      if (question.question_type === 'boolean') {
        return question.default_value === 'true';
      }
      if (question.question_type === 'multiselect') {
        // Default for multiselect should be an empty array
        return [];
      }
      return question.default_value;
    }
    
    return question.question_type === 'number' ? 0 : 
           question.question_type === 'boolean' ? false :
           question.question_type === 'multiselect' ? [] : '';
  };

  // Split questions into basic and advanced
  const basicQuestions = questions.filter(q => !q.is_advanced);
  const advancedQuestions = questions.filter(q => q.is_advanced);

  // Calculate progress
  const requiredQuestions = questions.filter(q => q.is_required);
  const answeredRequired = requiredQuestions.filter(q => {
    const val = state.useCaseData?.[q.field_name];
    return val !== undefined && val !== '' && val !== null;
  });
  const progress = requiredQuestions.length > 0 
    ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
    : 100;

  const industryLabel = state.industryName || 'Your Facility';

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-purple-300 text-lg">Loading {industryLabel} questions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // No questions fallback (shouldn't happen with proper data)
  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center">
        <Building2 className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-amber-300 font-medium">
          No specific questions for {industryLabel}. Click Continue to proceed.
        </p>
      </div>
    );
  }

  // Calculate solar opportunity rating (1-10 scale)
  const solarRating = state.solarData?.sunHours ? Math.round((state.solarData.sunHours / 6.5) * 10) : 5;
  const solarRatingLabel = state.solarData?.rating || 'Moderate';

  return (
    <div className="space-y-6 pb-8">
      {/* Solar Opportunity Banner */}
      {state.solarData && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={sunIcon} alt="Sun" className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Solar Opportunity in {state.state}</h3>
                  <p className="text-sm text-emerald-600 font-semibold">{state.solarData.sunHours} sun hours/day • {solarRatingLabel} Rating</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Sun
                    key={i}
                    className={`w-6 h-6 transition-all ${
                      i < solarRating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-amber-200 fill-amber-200'
                    }`}
                  />
                ))}
                <span className="ml-3 text-lg font-bold text-amber-700">{solarRating}/10</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-amber-800 bg-amber-100/50 rounded-lg px-3 py-2">
              💡 <strong>Tip:</strong> Adding solar can maximize your energy savings. We'll show you the best options in Step 4!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Tell Us About Your Facility</h1>
        <p className="text-emerald-400 font-medium">{industryLabel} details</p>
        
        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-4">
          <div className="flex items-center justify-between text-sm text-emerald-400 font-medium mb-2">
            <span>{answeredRequired.length} of {requiredQuestions.length} required</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Basic Questions */}
      <div className="max-w-2xl mx-auto space-y-4">
        {basicQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={getValue(question)}
            onChange={(val) => updateAnswer(question.field_name, val)}
            index={index}
          />
        ))}
      </div>

      {/* Advanced Questions Toggle */}
      {advancedQuestions.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-purple-300 hover:bg-slate-800 hover:text-purple-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options ({advancedQuestions.length})</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {advancedQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={getValue(question)}
                  onChange={(val) => updateAnswer(question.field_name, val)}
                  index={basicQuestions.length + index}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ready indicator */}
      {progress >= 100 && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium">✓ All required questions answered. Click Continue!</p>
        </div>
      )}
    </div>
  );
}
