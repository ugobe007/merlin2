/**
 * STEP 3: Facility Details - SMART DEFAULTS + VISUAL REVIEW
 * ==========================================================
 * 
 * Design Philosophy:
 * "Merlin is your consultant, not your interrogator"
 * 
 * Experience:
 * 1. Merlin calculates intelligent defaults based on industry + location
 * 2. Shows all estimates on ONE beautiful screen
 * 3. User reviews and adjusts only what needs changing
 * 4. Feels like consulting, not form-filling
 * 
 * Interaction Model:
 * - Everything pre-filled with smart defaults
 * - Tap any card to adjust
 * - Visual sliders and button groups
 * - "Looks Good" always visible
 * 
 * Version: 3.0.0 - "The Steve Jobs Version"
 * Date: January 6, 2026
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Check, Edit3, Sparkles, ArrowRight, Loader2, AlertCircle, X, Minus, Plus } from 'lucide-react';
import type { WizardState } from '../types';
import { supabase } from '@/services/supabaseClient';
import { industryQuestionnaires } from '@/data/industryQuestionnaires';
import merlinIcon from '@/assets/images/new_small_profile_.png';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
}

interface CustomQuestion {
  id: string;
  use_case_id: string;
  question_text: string;
  question_type: 'select' | 'number' | 'boolean' | 'text' | 'multiselect';
  field_name: string;
  options: Array<{ label: string; value: string; icon?: string; description?: string }> | string[] | null;
  is_required: boolean;
  min_value: string | null;
  max_value: string | null;
  default_value: string | null;
  display_order: number;
  help_text: string | null;
  placeholder: string | null;
  is_advanced: boolean;
  section_name: string | null;
  icon_name: string | null;
}

interface FieldConfig {
  value: any;
  label: string;
  icon: string;
  type: 'buttons' | 'slider' | 'toggle' | 'text';
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
}

// ============================================================================
// SMART DEFAULTS ENGINE
// ============================================================================

function normalizeIndustryToUseCaseSlug(industry: string | null | undefined): string | null {
  if (!industry) return null;
  const aliases: Record<string, string> = {
    car_wash: 'car-wash',
    ev_charging: 'ev-charging',
    indoor_farm: 'indoor-farm',
    shopping_center: 'shopping-center',
    gas_station: 'gas-station',
    cold_storage: 'cold-storage',
    agriculture: 'agricultural',
  };
  return aliases[industry] || industry;
}

function getSmartDefaultsForIndustry(state: WizardState): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  // Climate zone inference
  const hotStates = new Set(['AZ', 'NV', 'TX', 'FL', 'CA', 'NM', 'OK', 'LA', 'MS', 'AL', 'GA', 'SC', 'HI']);
  const coldStates = new Set(['MN', 'WI', 'NY', 'ME', 'VT', 'NH', 'MA', 'MI', 'ND', 'SD', 'MT', 'WY', 'AK']);
  if (state.state) {
    defaults.climateZone = hotStates.has(state.state)
      ? 'hot'
      : coldStates.has(state.state)
        ? 'cold'
        : 'moderate';
  }

  // Industry-specific defaults
  if (state.industry === 'heavy_duty_truck_stop') {
    defaults.operatingHours = '24_7';
    defaults.mcsChargers = 2;
    defaults.dcfc350 = 10;
    defaults.level2 = 20;
    defaults.serviceBays = 6;
    defaults.truckWashBays = 1;
    defaults.restaurantSeats = 150;
    defaults.hasShowers = true;
    defaults.hasLaundry = true;
    defaults.parkingLotAcres = 5;
    defaults.gridCapacityKW = '5000-10000';
    defaults.monthlyElectricBill = '15000-30000';
    defaults.monthlyDemandCharges = '5000-10000';
    defaults.backupRequirements = 'critical';
    defaults.primaryBESSApplication = 'demand_charge_management';
  } else if (state.industry === 'hotel') {
    defaults.operatingHours = '24_7';
    const roomCount = state.useCaseData?.roomCount || state.useCaseData?.rooms;
    if (typeof roomCount === 'number' && roomCount > 0) {
      defaults.squareFeet = roomCount * 400;
      defaults.monthlyElectricBill = roomCount < 50 ? '2000-5000' : roomCount < 150 ? '5000-15000' : '15000-30000';
      defaults.gridCapacityKW = roomCount < 50 ? '200-500' : roomCount < 150 ? '500-1000' : '1000-2000';
    }
  } else if (state.industry === 'car_wash') {
    defaults.operatingHours = '12-16';
    defaults.numberOfTunnels = 2;
    defaults.vacuumStations = 6;
    defaults.monthlyElectricBill = '2000-5000';
  }

  if (!defaults.operatingHours) {
    defaults.operatingHours = '12-16';
  }
  if (!defaults.backupRequirements) {
    defaults.backupRequirements = 'important';
  }
  if (!defaults.primaryBESSApplication) {
    defaults.primaryBESSApplication = 'demand_charge_management';
  }

  return defaults;
}

// Convert database questions to field configs
function questionsToFieldConfigs(questions: CustomQuestion[], smartDefaults: Record<string, unknown>): Record<string, FieldConfig> {
  const configs: Record<string, FieldConfig> = {};

  questions.forEach((q) => {
    const defaultValue = smartDefaults[q.field_name] ?? 
      (q.default_value ? (q.question_type === 'number' ? parseFloat(q.default_value) : q.default_value === 'true' ? true : q.default_value) : null) ??
      (q.question_type === 'number' ? 0 : q.question_type === 'boolean' ? false : '');

    const icon = q.icon_name || '📋';
    
    if (q.question_type === 'select' && Array.isArray(q.options) && q.options.length > 0) {
      const options = q.options.map(opt => {
        if (typeof opt === 'string') {
          return { value: opt, label: opt };
        }
        return { value: opt.value, label: opt.label };
      });
      
      configs[q.field_name] = {
        value: defaultValue,
        label: q.question_text,
        icon,
        type: 'buttons',
        options,
        helpText: q.help_text || undefined,
      };
    } else if (q.question_type === 'number') {
      const min = q.min_value ? parseFloat(q.min_value) : 0;
      const max = q.max_value ? parseFloat(q.max_value) : 1000;
      const step = 1;
      
      configs[q.field_name] = {
        value: typeof defaultValue === 'number' ? defaultValue : 0,
        label: q.question_text,
        icon,
        type: 'slider',
        min,
        max,
        step,
        helpText: q.help_text || undefined,
      };
    } else if (q.question_type === 'boolean') {
      configs[q.field_name] = {
        value: defaultValue === true || defaultValue === 'true',
        label: q.question_text,
        icon,
        type: 'toggle',
        helpText: q.help_text || undefined,
      };
    } else if (q.question_type === 'text') {
      configs[q.field_name] = {
        value: defaultValue || '',
        label: q.question_text,
        icon,
        type: 'text',
        helpText: q.help_text || undefined,
      };
    }
  });

  return configs;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Step3Details({ state, updateState }: Props) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  const useCaseSlug = useMemo(() => normalizeIndustryToUseCaseSlug(state.industry), [state.industry]);

  // Fetch questions from database
  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      setError(null);

      try {
        // Try to find use case by slug first
        let useCaseId: string | null = null;
        
        if (useCaseSlug) {
          const { data: useCase } = await supabase
            .from('use_cases')
            .select('id')
            .eq('slug', useCaseSlug)
            .single();
          
          if (useCase) useCaseId = useCase.id;
        }

        // Fallback to UUID mapping
        const INDUSTRY_TO_USE_CASE: Record<string, string> = {
          'heavy_duty_truck_stop': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'car-wash': 'f8e7d6c5-b4a3-2910-8765-432109876543',
        };
        
        if (!useCaseId && state.industry) {
          useCaseId = INDUSTRY_TO_USE_CASE[state.industry] || INDUSTRY_TO_USE_CASE[useCaseSlug || ''];
        }

        if (useCaseId) {
          const { data, error: fetchError } = await supabase
            .from('custom_questions')
            .select('*')
            .eq('use_case_id', useCaseId)
            .order('display_order', { ascending: true });

          if (fetchError) throw fetchError;
          if (data && !cancelled) {
            setQuestions(data as CustomQuestion[]);
            setLoading(false);
            return;
          }
        }

        // Fallback to built-in questionnaires
        const questionnaire = industryQuestionnaires[state.industry];
        if (questionnaire) {
          const fallbackQuestions: CustomQuestion[] = questionnaire.questions.map((q, idx) => {
            const questionText = q.label || q.question || `Question ${idx + 1}`;
            const fieldName = q.id || `field_${idx}`;
            const questionType = q.type === 'multi-select' || q.type === 'multiselect' ? 'multiselect' : 
                                q.type === 'select' ? 'select' : 
                                q.type === 'number' ? 'number' : 'text';
            
            return {
              id: `fallback-${idx}`,
              use_case_id: '',
              question_text: questionText,
              question_type: questionType as 'select' | 'number' | 'boolean' | 'text' | 'multiselect',
              field_name: fieldName,
              options: Array.isArray(q.options) ? q.options.map((opt: any) => typeof opt === 'string' ? { label: opt, value: opt } : opt) : null,
              is_required: false,
              min_value: null,
              max_value: null,
              default_value: null,
              display_order: idx,
              help_text: q.helpText || null,
              placeholder: q.placeholder || null,
              is_advanced: false,
              section_name: null,
              icon_name: null,
            };
          });
          if (!cancelled) {
            setQuestions(fallbackQuestions);
            setLoading(false);
          }
        } else {
          if (!cancelled) {
            setQuestions([]);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load questions');
          setLoading(false);
        }
      }
    }

    fetchQuestions();
    return () => { cancelled = true; };
  }, [state.industry, useCaseSlug]);

  // Calculate smart defaults
  const smartDefaults = useMemo(() => getSmartDefaultsForIndustry(state), [state.industry, state.state, state.useCaseData]);

  // Convert questions to field configs
  const fieldConfigs = useMemo(() => {
    if (questions.length === 0) return {};
    return questionsToFieldConfigs(questions, smartDefaults);
  }, [questions, smartDefaults]);

  // Initialize values with smart defaults + existing data
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.keys(fieldConfigs).forEach(key => {
      initial[key] = fieldConfigs[key].value;
    });
    return { ...initial, ...(state.useCaseData || {}) };
  });

  // Update values when fieldConfigs change
  useEffect(() => {
    setValues(prev => {
      const updated = { ...prev };
      Object.keys(fieldConfigs).forEach(key => {
        if (updated[key] === undefined) {
          updated[key] = fieldConfigs[key].value;
        }
      });
      return updated;
    });
  }, [fieldConfigs]);

  // Update parent state
  useEffect(() => {
    updateState({ useCaseData: values });
  }, [values, updateState]);

  const handleChange = (field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setModifiedFields(prev => new Set([...prev, field]));
    setEditingField(null);
  };

  const industryName = state.industryName || state.industry || 'facility';
  const locationName = state.city ? `${state.city}, ${state.state}` : state.state || 'your location';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-purple-300 text-lg">Loading {industryName} questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 font-medium">{error}</p>
      </div>
    );
  }

  if (Object.keys(fieldConfigs).length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-purple-500/20 border border-purple-500/50 rounded-xl text-center">
        <p className="text-purple-300 font-medium">No questions available for {industryName}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-medium">Smart Estimation</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Let me get this right
        </h1>
      </div>

      {/* Merlin's Intelligence */}
      <div className="bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-slate-900/30 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 mb-10 shadow-2xl">
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-1">
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
          
          <div className="flex-1">
            <p className="text-xl text-white font-semibold mb-3">
              Based on your <span className="text-purple-300">{industryName}</span> in <span className="text-cyan-300">{locationName}</span>, here&apos;s what I&apos;m estimating:
            </p>
            <p className="text-slate-400">
              I&apos;ve pre-filled everything with smart defaults. Tap any card below to adjust. Most customers only change 1-2 things.
            </p>
          </div>
        </div>
      </div>

      {/* Smart Defaults Grid */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        {Object.entries(fieldConfigs).map(([field, config]) => {
          const isEditing = editingField === field;
          const isModified = modifiedFields.has(field);
          const currentValue = values[field];

          return (
            <div
              key={field}
              className={`
                relative group
                bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm
                border-2 rounded-2xl p-6 transition-all duration-300
                ${isEditing 
                  ? 'border-purple-500 shadow-lg shadow-purple-500/25 scale-[1.02]' 
                  : isModified
                    ? 'border-cyan-500/50 hover:border-cyan-500'
                    : 'border-slate-700/50 hover:border-purple-500/50'
                }
              `}
            >
              {/* Modified Indicator */}
              {isModified && !isEditing && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Field Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{config.label}</h3>
                    {config.helpText && (
                      <p className="text-xs text-slate-500 mt-1">{config.helpText}</p>
                    )}
                    {!isEditing && (
                      <p className="text-xs text-slate-500 mt-1">
                        {isModified ? 'Modified' : 'Default estimate'}
                      </p>
                    )}
                  </div>
                </div>
                
                {!isEditing && (
                  <button
                    onClick={() => setEditingField(field)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Field Input */}
              {!isEditing ? (
                // Display Mode
                <button
                  onClick={() => setEditingField(field)}
                  className="w-full text-left"
                >
                  <DisplayValue value={currentValue} config={config} />
                </button>
              ) : (
                // Edit Mode
                <div>
                  {config.type === 'buttons' && config.options && (
                    <ButtonGroup
                      options={config.options}
                      value={currentValue}
                      onChange={(v) => handleChange(field, v)}
                    />
                  )}
                  
                  {config.type === 'slider' && (
                    <Slider
                      min={config.min!}
                      max={config.max!}
                      step={config.step!}
                      value={currentValue}
                      onChange={(v) => handleChange(field, v)}
                      unit={config.unit}
                    />
                  )}
                  
                  {config.type === 'toggle' && (
                    <Toggle
                      value={currentValue}
                      onChange={(v) => handleChange(field, v)}
                    />
                  )}

                  {config.type === 'text' && (
                    <TextInput
                      value={currentValue}
                      onChange={(v) => handleChange(field, v)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-slate-800/50 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Ready to calculate</p>
              <p className="text-sm text-slate-400">
                {modifiedFields.size > 0 
                  ? `You've adjusted ${modifiedFields.size} estimate${modifiedFields.size > 1 ? 's' : ''}`
                  : 'Using all smart defaults'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Next Step</p>
            <p className="text-sm text-emerald-400 font-semibold">System Options →</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================

function DisplayValue({ value, config }: { value: any; config: FieldConfig }) {
  if (config.type === 'buttons' && config.options) {
    const option = config.options.find((o: any) => o.value === value);
    return (
      <div className="px-4 py-3 bg-slate-700/50 rounded-xl">
        <p className="text-2xl font-bold text-white">{option?.label || value}</p>
      </div>
    );
  }
  
  if (config.type === 'slider') {
    return (
      <div className="px-4 py-3 bg-slate-700/50 rounded-xl">
        <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {config.unit && <span className="text-lg text-slate-400 ml-2">{config.unit}</span>}
        </p>
      </div>
    );
  }
  
  if (config.type === 'toggle') {
    return (
      <div className="px-4 py-3 bg-slate-700/50 rounded-xl">
        <p className="text-2xl font-bold text-white">{value ? 'Yes' : 'No'}</p>
      </div>
    );
  }

  if (config.type === 'text') {
    return (
      <div className="px-4 py-3 bg-slate-700/50 rounded-xl">
        <p className="text-lg font-medium text-white">{value || 'Not set'}</p>
      </div>
    );
  }
  
  return null;
}

// ============================================================================
// EDIT COMPONENTS
// ============================================================================

function ButtonGroup({ options, value, onChange }: { options: any[]; value: any; onChange: (v: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-4 rounded-xl font-semibold transition-all
              ${isSelected
                ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Slider({ min, max, step, value, onChange, unit }: { min: number; max: number; step: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {value.toLocaleString()}
        </span>
        {unit && <span className="text-xl text-purple-300 ml-2">{unit}</span>}
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-xl
          [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-purple-500 [&::-moz-range-thumb]:to-cyan-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-xl"
        style={{
          background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${((value - min) / (max - min)) * 100}%, rgb(51, 65, 85) ${((value - min) / (max - min)) * 100}%, rgb(51, 65, 85) 100%)`
        }}
      />
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onChange(true)}
        className={`
          p-4 rounded-xl font-semibold transition-all
          ${value
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }
        `}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`
          p-4 rounded-xl font-semibold transition-all
          ${!value
            ? 'bg-slate-600 text-white shadow-lg'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
          }
        `}
      >
        No
      </button>
    </div>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-lg font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
      placeholder="Enter value..."
    />
  );
}

export default Step3Details;
