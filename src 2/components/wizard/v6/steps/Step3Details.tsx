/**
 * V6 Step 3: Facility Details - Dynamic Questions from Database
 * 
 * Updated: December 28, 2025
 * - Fixed z-index for dropdowns
 * - Light blue/lavender gradient inputs (matching BESS Quote Builder panel)
 * - Color: from-blue-100 via-purple-100/50 to-pink-100/30
 */
import React, { useEffect, useState } from 'react';
import { Building2, Loader2, AlertCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { WizardState } from '../types';
import { supabase } from '@/services/supabaseClient';

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

// Map industry slug to use_case_id
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
  'agriculture': '3a697fd6-ed56-4ad3-b4d5-1d6f5fa0692a',
  'restaurant': '67d5aa44-4f0c-49b6-af24-ba9cc6a1e368',
  'car-wash': '4c736f5e-3d8e-44e0-8472-68a903d406d2',
  'data-center': '79884210-7439-45fd-8853-b1c3978b75e7',
  'ev-charging': '19d0266d-feb9-4c6e-8f70-905b06f16e71',
  'indoor-farm': '91a73821-e782-4380-935b-56f4472c566f',
  'agricultural': '3a697fd6-ed56-4ad3-b4d5-1d6f5fa0692a',
  'apartment': '908acfe0-7ef8-4fb7-85c2-56700dc815b9',
  'casino': '2be3845b-66f2-4e36-985d-58cc3a488e21',
  'cold-storage': '757f3665-dade-42a3-848b-21392b4343b5',
  'gas-station': '56ff75de-f2ef-4fb8-a9b0-4586887fbd3c',
  'government': '36e2303b-0e7f-4a26-b177-ec3e0bdb8cd3',
  'microgrid': 'ff7473e1-09b4-4a48-bcfd-c0901d124914',
  'residential': '24ebfd00-562d-47e8-803b-278281f2e807',
  'shopping-center': 'f9510e02-05cd-467b-ba31-9aa54c66dd17',
  'backup-critical-infrastructure': '2df1ea0a-3166-4706-a655-3f28313e7e11',
  'energy-arbitrage-utility': '3f68b068-ab12-4987-8a33-3a3f8cd7761f',
  'hotel-hospitality': 'c72b0ecf-f8a0-4730-8877-359bdd3ba5ab',
  'peak-shaving-commercial': '5121b33e-2523-42d1-878a-88aabf0915bf',
};

// ============================================================================
// BESS QUOTE BUILDER PANEL COLORS (matching design)
// ============================================================================
const inputBaseClass = "w-full px-4 py-3 bg-white border border-purple-200/60 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all shadow-sm hover:border-purple-300";

// ============================================================================
// QUESTION COMPONENTS
// ============================================================================

function SelectQuestion({ 
  question, 
  value, 
  onChange,
  zIndex
}: { 
  question: CustomQuestion; 
  value: string; 
  onChange: (val: string) => void;
  zIndex: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const normalizedOptions = question.options?.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: opt };
    }
    return opt;
  }) || [];

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className="relative" style={{ zIndex: isOpen ? 100 : zIndex }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border border-purple-200/60 rounded-xl text-left flex items-center justify-between hover:border-purple-400 hover:shadow-md transition-all duration-200 shadow-sm"
      >
        <span className={selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {selectedOption?.label || question.placeholder || 'Select an option...'}
        </span>
        <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-[100] mt-2 w-full bg-white border-2 border-purple-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {normalizedOptions.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 flex items-center justify-between transition-colors ${
                  idx === 0 ? 'rounded-t-xl' : ''
                } ${
                  idx === normalizedOptions.length - 1 ? 'rounded-b-xl' : ''
                } ${
                  value === opt.value ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 font-medium' : 'text-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="w-5 h-5 text-purple-600" />}
              </button>
            ))}
          </div>
        </>
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
  
  const range = max - min;
  const step = range > 1000 ? 100 : range > 100 ? 10 : 1;
  
  const presets = [
    min,
    Math.round((min + max) * 0.25),
    Math.round((min + max) * 0.5),
    Math.round((min + max) * 0.75),
    max
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString();
  };

  const currentValue = value || defaultVal;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #e0e7ff ${percentage}%, #e0e7ff 100%)`
        }}
      />
      
      {/* Presets and value */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {presets.slice(0, 5).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentValue === preset
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-purple-200/60 hover:border-purple-400 hover:shadow-sm'
              }`}
            >
              {formatValue(preset)}
            </button>
          ))}
        </div>
        
        {/* Value display - lavender gradient */}
        <div className="min-w-[70px] h-12 flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-purple-50 rounded-xl border-2 border-purple-300 shadow-inner">
          <span className="text-purple-700 font-bold text-lg">{formatValue(currentValue)}</span>
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
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
          value === true
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
            : 'bg-white border border-purple-200/60 text-slate-600 hover:border-emerald-400 hover:shadow-md'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
          value === false
            ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg'
            : 'bg-white border border-purple-200/60 text-slate-600 hover:border-slate-400 hover:shadow-md'
        }`}
      >
        No
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
      className={inputBaseClass}
    />
  );
}

// ============================================================================
// QUESTION CARD - Light lavender-blue theme
// ============================================================================

function QuestionCard({ 
  question, 
  value, 
  onChange,
  index,
  totalQuestions
}: { 
  question: CustomQuestion; 
  value: any;
  onChange: (val: any) => void;
  index: number;
  totalQuestions: number;
}) {
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

  const cardZIndex = totalQuestions - index;

  return (
    <div 
      className="bg-gradient-to-br from-[#e8e6f2] via-[#dde4f0] to-[#f0e8f4] rounded-2xl p-5 border border-purple-200/50 shadow-lg hover:shadow-xl hover:border-purple-300 transition-all duration-300"
      style={{ position: 'relative', zIndex: cardZIndex }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{getIcon(question.field_name)}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800">
            {question.question_text}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.help_text && (
            <p className="text-sm text-slate-500 mt-1">{question.help_text}</p>
          )}
        </div>
      </div>

      {question.question_type === 'select' && (
        <SelectQuestion question={question} value={value} onChange={onChange} zIndex={cardZIndex} />
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

  const useCaseId = INDUSTRY_TO_USE_CASE[state.industry] || null;

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
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;
        setQuestions(data || []);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [useCaseId]);

  const answers = state.useCaseData || {};

  const updateAnswer = (fieldName: string, value: any) => {
    updateState({
      useCaseData: {
        ...answers,
        [fieldName]: value
      },
      facilityDetails: {
        ...state.facilityDetails,
        squareFootage: fieldName === 'totalFacilitySquareFootage' || fieldName === 'squareFeet' 
          ? (typeof value === 'number' ? value : parseInt(value) || 0)
          : state.facilityDetails.squareFootage
      }
    });
  };

  const getValue = (question: CustomQuestion) => {
    if (answers[question.field_name] !== undefined) {
      return answers[question.field_name];
    }
    if (question.default_value) {
      if (question.question_type === 'number') {
        return parseFloat(question.default_value);
      }
      if (question.question_type === 'boolean') {
        return question.default_value === 'true';
      }
      return question.default_value;
    }
    return question.question_type === 'number' ? 0 : '';
  };

  const basicQuestions = questions.filter(q => !q.is_advanced);
  const advancedQuestions = questions.filter(q => q.is_advanced);

  const requiredQuestions = questions.filter(q => q.is_required);
  const answeredRequired = requiredQuestions.filter(q => {
    const val = getValue(q);
    return val !== '' && val !== 0 && val !== undefined && val !== null;
  });
  const progressPercent = requiredQuestions.length > 0 
    ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Building2 className="w-12 h-12 text-purple-500 mb-4" />
        <p className="text-slate-300 mb-2">No specific questions for this industry yet.</p>
        <p className="text-slate-500 text-sm">We'll use general estimates for your quote.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tell Us About Your Facility</h2>
        <p className="text-purple-300">{state.industryName || state.industry} details</p>
        
        {/* Progress */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>{answeredRequired.length} of {requiredQuestions.length} required</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto space-y-4">
        {basicQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={getValue(question)}
            onChange={(val) => updateAnswer(question.field_name, val)}
            index={index}
            totalQuestions={basicQuestions.length}
          />
        ))}
      </div>

      {/* Advanced Questions */}
      {advancedQuestions.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-3 px-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-purple-500 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options ({advancedQuestions.length})
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {advancedQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={getValue(question)}
                  onChange={(val) => updateAnswer(question.field_name, val)}
                  index={index}
                  totalQuestions={advancedQuestions.length}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {progressPercent === 100 && (
        <div className="max-w-2xl mx-auto p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
          <p className="text-emerald-400 font-medium">✓ All required questions answered!</p>
        </div>
      )}
    </div>
  );
}
