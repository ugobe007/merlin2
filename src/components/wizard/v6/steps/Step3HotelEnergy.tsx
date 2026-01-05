import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Loader2, Plus, Minus } from 'lucide-react';
import type { WizardState } from '../types';

// Hotel image
import hotelImg from '@/assets/images/hotel_motel_holidayinn_1.jpg';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
}

interface QuestionOption {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  energyKwh?: number;
  energyMultiplier?: number;
  energyPerUnit?: number;
  sqftMultiplier?: number;
}

interface Question {
  id: string;
  field_name: string;
  question_text: string;
  question_type: string;
  options: QuestionOption[] | null;
  min_value: string | null;
  max_value: string | null;
  default_value: string | null;
  help_text: string | null;
  display_order: number;
}

const HOTEL_USE_CASE_ID = '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9';

// ══════════════════════════════════════════════════════════════════════════════
// CONSISTENT COLOR PALETTE - TrueQuote Compliant
// ══════════════════════════════════════════════════════════════════════════════
const COLORS = {
  // Text colors (consistent throughout)
  label: '#94a3b8',           // slate-400 - Secondary labels
  value: '#ffffff',           // White - Primary values
  valueAlt: '#e2e8f0',        // slate-200 - Slightly dimmed values
  heading: '#ffffff',         // White - Section headings
  subheading: '#94a3b8',      // slate-400 - Subheadings
  muted: '#64748b',           // slate-500 - Muted/hint text
  
  // Accent colors
  primary: '#3b82f6',         // Blue - Primary actions
  success: '#10b981',         // Green - Success/energy
  warning: '#fbbf24',         // Amber - Solar/warnings
  purple: '#8b5cf6',          // Purple - Brand accent
  
  // Backgrounds
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.06)',
  selectedBg: 'rgba(16, 185, 129, 0.3)',
  selectedBorder: '#10b981',
};

// ══════════════════════════════════════════════════════════════════════════════
// SLIDER WITH +/- BUTTONS COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
interface SliderWithButtonsProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  color?: string;
  formatValue?: (val: number) => string;
}

const SliderWithButtons: React.FC<SliderWithButtonsProps> = ({
  value, min, max, step = 1, onChange, label, unit = '', color = COLORS.primary, formatValue
}) => {
  const displayValue = formatValue ? formatValue(value) : value.toString();
  
  const increment = () => {
    const newVal = Math.min(max, value + step);
    onChange(newVal);
  };
  
  const decrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(newVal);
  };

  const handleDirectInput = () => {
    const input = prompt(`Enter ${label}:`, value.toString());
    if (input !== null) {
      const parsed = parseInt(input, 10);
      if (!isNaN(parsed) && parsed >= min && parsed <= max) {
        onChange(parsed);
      }
    }
  };

  return (
    <div>
      <label style={{ fontSize: 14, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Minus Button */}
        <button
          onClick={decrement}
          disabled={value <= min}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: value <= min ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: value <= min ? COLORS.muted : COLORS.value,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value <= min ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Minus size={16} />
        </button>

        {/* Value Display - Clickable for direct input */}
        <div 
          onClick={handleDirectInput}
          style={{ 
            flex: 1, textAlign: 'center', cursor: 'pointer',
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.15s ease'
          }}
          title="Click to enter value directly"
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.value }}>
            {displayValue}{unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2, color: COLORS.label }}>{unit}</span>}
          </div>
        </div>

        {/* Plus Button */}
        <button
          onClick={increment}
          disabled={value >= max}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: value >= max ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: value >= max ? COLORS.muted : COLORS.value,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: value >= max ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Slider */}
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ 
          width: '100%', 
          marginTop: 12, 
          accentColor: color,
          height: 6,
          cursor: 'pointer'
        }} 
      />
      
      {/* Min/Max labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 14, color: COLORS.muted }}>{min}</span>
        <span style={{ fontSize: 14, color: COLORS.muted }}>{max}</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Step3HotelEnergy = ({ state, updateState }: Props) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);

  // Fetch questions from database and initialize defaults (if missing from state)
  useEffect(() => {
    async function fetchQuestions() {
      const { data, error } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('use_case_id', HOTEL_USE_CASE_ID)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching questions:', error);
      } else {
        setQuestions(data || []);
        
        // Initialize defaults from database questions (UI initialization only)
        // SSOT: state.useCaseData (user-provided values) takes precedence
        const currentData = state.useCaseData || {}; // SSOT - user-provided values
        const defaults: Record<string, any> = {};
        
        data?.forEach(q => {
          // Only use default if field is not in SSOT (currentData)
          // Defaults are for UI initialization only, NOT SSOT
          if (q.default_value && currentData[q.field_name] === undefined) {
            if (q.question_type === 'number') {
              defaults[q.field_name] = parseFloat(q.default_value);
            } else if (q.question_type === 'boolean') {
              defaults[q.field_name] = q.default_value === 'true';
            } else {
              defaults[q.field_name] = q.default_value;
            }
          }
        });
        
        // Only update if defaults were found (missing fields)
        if (Object.keys(defaults).length > 0) {
          updateState((prev: WizardState): Partial<WizardState> => ({
            useCaseData: { ...defaults, ...prev.useCaseData } // defaults first, then SSOT overrides
          }));
        }
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const getQuestion = (fieldName: string): Question | undefined => {
    return questions.find(q => q.field_name === fieldName);
  };

  const getOptions = (fieldName: string): QuestionOption[] => {
    const q = getQuestion(fieldName);
    return q?.options || [];
  };

  // SSOT: Get value from state.useCaseData (like Step3Details)
  const getValue = (fieldName: string) => {
    const stored = state.useCaseData?.[fieldName];
    if (stored !== undefined) return stored;
    
    const question = getQuestion(fieldName);
    if (question?.default_value) {
      if (question.question_type === 'number') return parseFloat(question.default_value);
      if (question.question_type === 'boolean') return question.default_value === 'true';
      return question.default_value;
    }
    
    return question?.question_type === 'number' ? 0 : 
           question?.question_type === 'boolean' ? false :
           question?.question_type === 'multiselect' ? [] : '';
  };

  // SSOT: Update value using functional update (like Step3Details)
  const updateAnswer = (fieldName: string, value: any) => {
    updateState((prev: WizardState): Partial<WizardState> => ({
      useCaseData: { ...prev.useCaseData, [fieldName]: value }
    }));
  };

  const estimatedSqft = useMemo(() => {
    const categoryOptions = getOptions('hotelCategory');
    const selectedCategory = categoryOptions.find(o => o.value === getValue('hotelCategory'));
    const multiplier = selectedCategory?.sqftMultiplier || 500;
    const roomCount = getValue('roomCount') || (getQuestion('roomCount')?.default_value ? parseFloat(getQuestion('roomCount')!.default_value!) : 150);
    return roomCount * multiplier;
  }, [state.useCaseData?.hotelCategory, state.useCaseData?.roomCount, questions]);

  const calculateEnergy = (): number => {
    const sqft = (getValue('squareFootage') || 0) > 0 ? getValue('squareFootage') : estimatedSqft;
    let base = sqft * 15;

    ['poolType', 'fitnessCenter', 'spaServices', 'foodBeverage', 'laundryType', 'meetingSpace', 'parkingType'].forEach(field => {
      const options = getOptions(field);
      const selected = options.find(o => o.value === getValue(field));
      if (selected?.energyKwh) {
        base += selected.energyKwh;
      }
    });

    ['exteriorLoads'].forEach(field => {
      const options = getOptions(field);
      const selectedValues = getValue(field) || [];
      options.forEach(opt => {
        if (selectedValues.includes(opt.value) && opt.energyKwh) {
          base += opt.energyKwh;
        }
      });
    });

    const elevatorQ = getQuestion('elevatorCount');
    const elevatorEnergy = elevatorQ?.options?.[0]?.energyPerUnit || 8000;
    base += (getValue('elevatorCount') || 2) * elevatorEnergy;

    const hvacOptions = getOptions('hvacType');
    const selectedHvac = hvacOptions.find(o => o.value === getValue('hvacType'));
    if (selectedHvac?.energyMultiplier) {
      base *= selectedHvac.energyMultiplier;
    }

    const occupancy = getValue('avgOccupancy') || 65;
    base *= (occupancy / 100) * 0.7 + 0.3;

    return Math.round(base);
  };

  // FIXED: Move state update to useEffect to prevent setState during render
  const energyEstimate = useMemo(() => calculateEnergy(), [
    state.useCaseData?.squareFootage,
    estimatedSqft,
    state.useCaseData?.poolType,
    state.useCaseData?.fitnessCenter,
    state.useCaseData?.spaServices,
    state.useCaseData?.foodBeverage,
    state.useCaseData?.laundryType,
    state.useCaseData?.meetingSpace,
    state.useCaseData?.parkingType,
    state.useCaseData?.exteriorLoads,
    state.useCaseData?.elevatorCount,
    state.useCaseData?.hvacType,
    state.useCaseData?.avgOccupancy,
    questions,
  ]);

  // Update estimatedAnnualKwh in state when energy estimate changes
  useEffect(() => {
    if (state.useCaseData?.estimatedAnnualKwh !== energyEstimate) {
      updateState((prev: WizardState): Partial<WizardState> => ({
        useCaseData: { ...prev.useCaseData, estimatedAnnualKwh: energyEstimate }
      }));
    }
  }, [energyEstimate, state.useCaseData?.estimatedAnnualKwh, updateState]);

  const autofillForCategory = () => {
    const presets: Record<string, Record<string, string>> = {
      'budget': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'none' },
      'midscale': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'small' },
      'upscale': { poolType: 'heated', fitnessCenter: 'full', spaServices: 'basic', foodBeverage: 'restaurant', laundryType: 'commercial', meetingSpace: 'medium' },
      'luxury': { poolType: 'indoor', fitnessCenter: 'full', spaServices: 'full', foodBeverage: 'full', laundryType: 'commercial', meetingSpace: 'large' },
      'boutique': { poolType: 'none', fitnessCenter: 'basic', spaServices: 'basic', foodBeverage: 'restaurant', laundryType: 'outsourced', meetingSpace: 'small' },
      'extended': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'none' }
    };
    const hotelCategory = getValue('hotelCategory');
    if (hotelCategory && presets[hotelCategory]) {
      updateState((prev: WizardState): Partial<WizardState> => ({
        useCaseData: { ...prev.useCaseData, ...presets[hotelCategory] }
      }));
    }
    setShowAutofillPrompt(false);
  };

  const handleCategoryChange = (value: string) => {
    updateAnswer('hotelCategory', value);
    setShowAutofillPrompt(true);
  };

  const toggleMultiselect = (field: string, value: string) => {
    const current = getValue(field) || [];
    if (current.includes(value)) {
      updateAnswer(field, current.filter((v: string) => v !== value));
    } else {
      updateAnswer(field, [...current, value]);
    }
  };

  const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3" style={{ color: COLORS.label }}>Loading hotel questions...</span>
      </div>
    );
  }

  const categoryOptions = getOptions('hotelCategory');
  const hvacOptions = getOptions('hvacType');
  const poolOptions = getOptions('poolType');
  const fitnessOptions = getOptions('fitnessCenter');
  const spaOptions = getOptions('spaServices');
  const fbOptions = getOptions('foodBeverage');
  const laundryOptions = getOptions('laundryType');
  const meetingOptions = getOptions('meetingSpace');
  const parkingOptions = getOptions('parkingType');
  const exteriorOptions = getOptions('exteriorLoads');
  const solarInterestOptions = getOptions('solarInterest');
  const solarSpaceOptions = getOptions('solarSpace');
  const existingOptions = getOptions('existingGeneration');

  const roomQ = getQuestion('roomCount');
  const occupancyQ = getQuestion('avgOccupancy');
  
  // Dynamic room limits based on hotel category (Vineet's spec)
  const getRoomLimits = () => {
    const category = state.useCaseData?.hotelCategory;
    switch (category) {
      case 'budget':
        return { min: 50, max: 100, step: 1 };
      case 'midscale':
        return { min: 50, max: 200, step: 1 };
      case 'upper_midscale':
        return { min: 100, max: 500, step: 5 };
      case 'upscale':
        return { min: 150, max: 750, step: 5 };
      case 'luxury':
        return { min: 250, max: 1000, step: 10 };
      case 'boutique':
        return { min: 20, max: 150, step: 1 };
      default:
        return { min: 10, max: 1000, step: 10 };
    }
  };
  const roomLimits = getRoomLimits();
  const floorsQ = getQuestion('floorCount');
  const elevatorsQ = getQuestion('elevatorCount');

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'relative', paddingBottom: 40 }}>
      {/* Live Energy Estimate - Floating */}
      <div style={{
        position: 'fixed', top: 100, right: 24,
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        borderRadius: 16, padding: '16px 24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(16, 185, 129, 0.2)',
        zIndex: 100, minWidth: 200, border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, color: '#a7f3d0', marginBottom: 4 }}>
          Estimated Annual Usage
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.value }}>
          {formatNumber(energyEstimate)}
          <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>kWh</span>
        </div>
        <div style={{ fontSize: 14, color: '#a7f3d0', marginTop: 4 }}>
          ~{formatNumber(Math.round(energyEstimate / 12))} kWh/month
        </div>
      </div>

      {/* Header with Image */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ 
          position: 'relative', 
          borderRadius: 24, 
          overflow: 'hidden', 
          marginBottom: 24,
          height: 200,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          {/* Hotel Image */}
          <img 
            src={hotelImg} 
            alt="Hotel"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6
            }}
          />
          
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
          }} />
          
          {/* Title Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 32px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 700, 
              margin: 0,
              color: COLORS.value,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              Hotel Energy Profile
            </h1>
            <p style={{ 
              color: COLORS.label, 
              marginTop: 8, 
              fontSize: 16,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)'
            }}>
              Tell us about your property • {questions.length} questions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* SECTION LABEL: Core Energy Drivers */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          padding: '12px 20px', background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent)',
          borderLeft: '4px solid #3b82f6', borderRadius: '0 12px 12px 0'
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1 }}>
            ⚡ Core Energy Drivers
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>These inputs have the highest impact on your quote</span>
        </div>

        {/* ZONE 1: Category Selection */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>
              1 → {getQuestion('hotelCategory')?.question_text || 'What type of hotel?'}
            </h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 600 }}>HIGH IMPACT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {categoryOptions.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                style={{
                  background: state.useCaseData?.hotelCategory === cat.value 
                    ? `linear-gradient(135deg, ${cat.color}40, ${cat.color}20)`
                    : 'rgba(255,255,255,0.02)',
                  border: state.useCaseData?.hotelCategory === cat.value 
                    ? `2px solid ${cat.color}`
                    : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 16, padding: '20px 12px', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: state.useCaseData?.hotelCategory === cat.value ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.value }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {showAutofillPrompt && state.useCaseData?.hotelCategory && (
            <div style={{
              marginTop: 20, padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative',
              zIndex: 10
            }}>
              <div>
                <span style={{ fontSize: 14, color: COLORS.value }}>💡 Auto-fill typical amenities for </span>
                <strong style={{ color: COLORS.value }}>{categoryOptions.find(c => c.value === state.useCaseData?.hotelCategory)?.label}</strong>
                <span style={{ fontSize: 14, color: COLORS.value }}> hotels?</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    autofillForCategory();
                  }} 
                  className="pulse-attention" 
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                    border: '2px solid #fcd34d', 
                    borderRadius: 12, 
                    padding: '12px 24px', 
                    color: '#1e293b', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    fontSize: 15,
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 20
                  }}
                >
                  ✨ Yes, autofill
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAutofillPrompt(false);
                  }} 
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: 8, 
                    padding: '8px 16px', 
                    color: COLORS.label, 
                    cursor: 'pointer', 
                    fontSize: 15,
                    position: 'relative',
                    zIndex: 20
                  }}
                >
                  I'll customize
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ZONE 2: Property Snapshot - WITH +/- BUTTONS */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>
              2 → Property Snapshot
            </h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 600 }}>HIGH IMPACT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            {/* Guest Rooms with +/- */}
            <SliderWithButtons
              label="Guest Rooms"
              value={getValue('roomCount') ?? (roomQ?.default_value ? parseFloat(roomQ.default_value) : 150)}
              min={roomLimits.min}
              max={roomLimits.max}
              step={roomLimits.step}
              onChange={(val) => {
                console.log('🏨 [Step3HotelEnergy] roomCount changed to:', val);
                updateAnswer('roomCount', val);
              }}
              color={COLORS.primary}
            />

            {/* Square Footage */}
            <div>
              <label style={{ fontSize: 14, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1 }}>Square Footage</label>
              <div style={{ fontSize: 28, fontWeight: 700, color: (state.useCaseData?.squareFootage || 0) > 0 ? COLORS.value : COLORS.muted, marginTop: 8 }}>
                {formatNumber((state.useCaseData?.squareFootage || 0) > 0 ? state.useCaseData.squareFootage : estimatedSqft)}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={!state.useCaseData?.squareFootage || state.useCaseData.squareFootage === 0}
                  onChange={(e) => updateAnswer('squareFootage', e.target.checked ? 0 : estimatedSqft)}
                  style={{ accentColor: COLORS.primary }} />
                <span style={{ fontSize: 14, color: COLORS.label }}>Auto-estimate</span>
              </label>
            </div>

            {/* Avg Occupancy with +/- */}
            <SliderWithButtons
              label="Avg Occupancy"
              value={getValue('avgOccupancy') || 65}
              min={Number(occupancyQ?.min_value) || 20}
              max={Number(occupancyQ?.max_value) || 95}
              step={5}
              onChange={(val) => updateAnswer('avgOccupancy', val)}
              unit="%"
              color={COLORS.success}
            />

            {/* Floors & Elevators */}
            <div>
              <label style={{ fontSize: 14, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                Floors / Elevators
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <SliderWithButtons
                    label=""
                    value={getValue('floorCount') || 4}
                    min={Number(floorsQ?.min_value) || 1}
                    max={Number(floorsQ?.max_value) || 50}
                    step={1}
                    onChange={(val) => updateAnswer('floorCount', val)}
                    color={COLORS.purple}
                  />
                </div>
                <span style={{ color: COLORS.muted, fontSize: 20 }}>/</span>
                <div style={{ flex: 1 }}>
                  <SliderWithButtons
                    label=""
                    value={getValue('elevatorCount') || 2}
                    min={Number(elevatorsQ?.min_value) || 0}
                    max={Number(elevatorsQ?.max_value) || 20}
                    step={1}
                    onChange={(val) => updateAnswer('elevatorCount', val)}
                    color={COLORS.purple}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HVAC */}
          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 14, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>
              {getQuestion('hvacType')?.question_text || 'Primary HVAC System'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {hvacOptions.map(opt => (
                <button key={opt.value} onClick={() => updateAnswer('hvacType', opt.value)}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: state.useCaseData?.hvacType === opt.value ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: state.useCaseData?.hvacType === opt.value ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.cardBorder}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease'
                  }}>
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div style={{ fontSize: 14, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION LABEL: Optional Modifiers */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 16,
          padding: '12px 20px', background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.2), transparent)',
          borderLeft: '4px solid #8b5cf6', borderRadius: '0 12px 12px 0'
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1 }}>
            🎛️ Optional Modifiers
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>Fine-tune your energy profile</span>
        </div>

        {/* ZONE 3: Amenities Grid - 2 per row, larger boxes */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>
              3 → Amenities & Services
            </h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 600 }}>MEDIUM IMPACT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { field: 'poolType', label: 'Pool', options: poolOptions },
              { field: 'fitnessCenter', label: 'Fitness Center', options: fitnessOptions },
              { field: 'spaServices', label: 'Spa Services', options: spaOptions },
              { field: 'foodBeverage', label: 'Food & Beverage', options: fbOptions },
              { field: 'laundryType', label: 'Laundry Services', options: laundryOptions },
              { field: 'meetingSpace', label: 'Meeting Space', options: meetingOptions }
            ].map(({ field, label, options }) => (
              <div key={field} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
                <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>{label}</label>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, 1fr)`, gap: 8 }}>
                  {options.map(opt => (
                    <button key={opt.value} onClick={() => updateAnswer(field, opt.value)} title={opt.label}
                      style={{
                        padding: '14px 8px',
                        background: state.useCaseData?.[field] === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                        border: state.useCaseData?.[field] === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s ease'
                      }}>
                      <div style={{ fontSize: 24 }}>{opt.icon}</div>
                      <div style={{ fontSize: 14, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZONE 4: Parking & Exterior */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>4 → Parking & Exterior</h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 600 }}>LOW IMPACT</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {parkingOptions.map(opt => (
              <button key={opt.value} onClick={() => updateAnswer('parkingType', opt.value)}
                style={{
                  flex: 1, padding: '14px 8px',
                  background: state.useCaseData?.parkingType === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: state.useCaseData?.parkingType === opt.value ? `2px solid ${COLORS.purple}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 10, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 20 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
              </button>
            ))}
          </div>
          <label style={{ fontSize: 14, color: COLORS.label, marginBottom: 8, display: 'block' }}>Exterior Loads</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {exteriorOptions.map(opt => (
              <button key={opt.value} onClick={() => toggleMultiselect('exteriorLoads', opt.value)}
                style={{
                  padding: '8px 12px',
                  background: (state.useCaseData?.exteriorLoads || []).includes(opt.value) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (state.useCaseData?.exteriorLoads || []).includes(opt.value) ? `2px solid ${COLORS.purple}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, color: COLORS.value
                }}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 5: Solar Interest */}
        <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.02))', borderRadius: 24, padding: 32, marginBottom: 24, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: COLORS.warning }}>5 → ☀️ Solar Interest</h2>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {solarInterestOptions.map(opt => (
              <button key={opt.value} onClick={() => updateAnswer('solarInterest', opt.value)}
                style={{
                  flex: 1, padding: '10px 6px',
                  background: state.useCaseData?.solarInterest === opt.value ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: state.useCaseData?.solarInterest === opt.value ? `2px solid ${COLORS.warning}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, color: COLORS.value
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 14, color: COLORS.label, marginBottom: 8, display: 'block' }}>Available Space for Solar</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {solarSpaceOptions.map(opt => (
              <button key={opt.value} onClick={() => toggleMultiselect('solarSpace', opt.value)}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: (state.useCaseData?.solarSpace || []).includes(opt.value) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (state.useCaseData?.solarSpace || []).includes(opt.value) ? `2px solid ${COLORS.warning}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 10, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 18 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 6: Existing Infrastructure */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>6 → Existing Infrastructure</h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 600 }}>LOW IMPACT</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {existingOptions.map(opt => (
              <button key={opt.value}
                onClick={() => {
                  if (opt.value === 'none') {
                    updateAnswer('existingGeneration', []);
                  } else {
                    toggleMultiselect('existingGeneration', opt.value);
                  }
                }}
                style={{
                  flex: 1, padding: '20px 16px',
                  background: (opt.value === 'none' && (state.useCaseData?.existingGeneration || []).length === 0) || (state.useCaseData?.existingGeneration || []).includes(opt.value)
                    ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (opt.value === 'none' && (state.useCaseData?.existingGeneration || []).length === 0) || (state.useCaseData?.existingGeneration || []).includes(opt.value)
                    ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 12, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 28 }}>{opt.icon}</div>
                <div style={{ fontSize: 15, color: COLORS.value, marginTop: 8 }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION LABEL: Business Context */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 16,
          padding: '12px 20px', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), transparent)',
          borderLeft: '4px solid #10b981', borderRadius: '0 12px 12px 0'
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1 }}>
            🎯 Business Context
          </span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>Help us understand your priorities</span>
        </div>

        {/* ZONE 7: Business Context - ChatGPT's 5 Strategic Questions */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.heading }}>7 → Operations & Planning</h2>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 600 }}>STRATEGIC</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Q1: Peak Demand Timing */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
              <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>
                ⏰ When is your highest energy stress?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { value: 'morning', label: 'Morning', desc: '6-10am' },
                  { value: 'afternoon', label: 'Afternoon', desc: '12-5pm' },
                  { value: 'evening', label: 'Evening', desc: '5-10pm' },
                  { value: 'summer', label: 'Summer', desc: 'Seasonal' },
                  { value: 'winter', label: 'Winter', desc: 'Seasonal' },
                  { value: 'unsure', label: 'Unsure', desc: 'Auto-estimate' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => updateAnswer('peakTiming', opt.value)}
                    style={{
                      padding: '12px 8px',
                      background: state.useCaseData?.peakTiming === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                      border: state.useCaseData?.peakTiming === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'center'
                    }}>
                    <div style={{ fontSize: 13, color: COLORS.value, fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Outage Tolerance */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
              <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>
                ⚡ How critical is backup power?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { value: 'nice_to_have', label: 'Nice to have', icon: '🟢' },
                  { value: 'critical_only', label: 'Critical systems', icon: '🟡' },
                  { value: 'guest_rooms', label: 'Guest rooms operational', icon: '🟠' },
                  { value: 'full_operation', label: 'Full hotel operation', icon: '🔴' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => updateAnswer('outageTolerance', opt.value)}
                    style={{
                      padding: '14px 12px',
                      background: state.useCaseData?.outageTolerance === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                      border: state.useCaseData?.outageTolerance === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left'
                    }}>
                    <span style={{ marginRight: 8 }}>{opt.icon}</span>
                    <span style={{ fontSize: 13, color: COLORS.value }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Brand Affiliation */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
              <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>
                🏷️ Brand affiliation
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { value: 'independent', label: 'Independent' },
                  { value: 'marriott', label: 'Marriott' },
                  { value: 'hilton', label: 'Hilton' },
                  { value: 'hyatt', label: 'Hyatt' },
                  { value: 'ihg', label: 'IHG' },
                  { value: 'other', label: 'Other' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => updateAnswer('brandAffiliation', opt.value)}
                    style={{
                      padding: '12px 8px',
                      background: state.useCaseData?.brandAffiliation === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                      border: state.useCaseData?.brandAffiliation === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease'
                    }}>
                    <div style={{ fontSize: 13, color: COLORS.value }}>{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Parking Scale (for EV planning) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
              <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>
                🅿️ Parking capacity
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { value: 'small', label: '< 25', desc: 'spaces' },
                  { value: 'medium', label: '25-100', desc: 'spaces' },
                  { value: 'large', label: '100-300', desc: 'spaces' },
                  { value: 'xlarge', label: '300+', desc: 'spaces' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => updateAnswer('parkingCapacity', opt.value)}
                    style={{
                      padding: '12px 8px',
                      background: state.useCaseData?.parkingCapacity === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                      border: state.useCaseData?.parkingCapacity === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'center'
                    }}>
                    <div style={{ fontSize: 15, color: COLORS.value, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Q5: Electrification Plans (full width) */}
          <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.cardBorder}` }}>
            <label style={{ fontSize: 14, color: COLORS.value, fontWeight: 600, marginBottom: 12, display: 'block' }}>
              🔮 Planning to electrify in next 3-5 years? <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 400 }}>(select all that apply)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 'hvac', label: '🌡️ HVAC' },
                { value: 'water_heating', label: '🚿 Water Heating' },
                { value: 'kitchen', label: '👨‍🍳 Kitchen' },
                { value: 'laundry', label: '🧺 Laundry' },
                { value: 'fleet', label: '🚐 Fleet/Valet' },
                { value: 'none', label: '❌ Not planned' },
              ].map(opt => (
                <button key={opt.value} 
                  onClick={() => {
                    const current = state.useCaseData?.electrificationPlans || [];
                    if (opt.value === 'none') {
                      updateAnswer('electrificationPlans', ['none']);
                    } else {
                      const filtered = current.filter((v: string) => v !== 'none');
                      if (filtered.includes(opt.value)) {
                        updateAnswer('electrificationPlans', filtered.filter((v: string) => v !== opt.value));
                      } else {
                        updateAnswer('electrificationPlans', [...filtered, opt.value]);
                      }
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    background: (state.useCaseData?.electrificationPlans || []).includes(opt.value) ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                    border: (state.useCaseData?.electrificationPlans || []).includes(opt.value) ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease'
                  }}>
                  <span style={{ fontSize: 13, color: COLORS.value }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Step3HotelEnergy };
export default Step3HotelEnergy;
