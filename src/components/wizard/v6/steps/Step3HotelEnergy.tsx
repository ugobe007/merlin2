import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Loader2, Plus, Minus } from 'lucide-react';
import type { WizardState } from '../types';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
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
      <label style={{ fontSize: 12, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
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
        <span style={{ fontSize: 10, color: COLORS.muted }}>{min}</span>
        <span style={{ fontSize: 10, color: COLORS.muted }}>{max}</span>
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
  const [answers, setAnswers] = useState<Record<string, any>>(state.useCaseData || {});
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);

  // Fetch questions from database
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
        const defaults: Record<string, any> = {};
        data?.forEach(q => {
          if (q.default_value && !answers[q.field_name]) {
            if (q.question_type === 'number') {
              defaults[q.field_name] = parseFloat(q.default_value);
            } else {
              defaults[q.field_name] = q.default_value;
            }
          }
        });
        if (Object.keys(defaults).length > 0) {
          setAnswers(prev => ({ ...defaults, ...prev }));
        }
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  // Sync answers to parent state
  useEffect(() => {
    const energyEstimate = calculateEnergy();
    updateState({
      useCaseData: {
        ...answers,
        estimatedAnnualKwh: energyEstimate
      }
    });
  }, [answers]);

  const getQuestion = (fieldName: string): Question | undefined => {
    return questions.find(q => q.field_name === fieldName);
  };

  const getOptions = (fieldName: string): QuestionOption[] => {
    const q = getQuestion(fieldName);
    return q?.options || [];
  };

  const estimatedSqft = useMemo(() => {
    const categoryOptions = getOptions('hotelCategory');
    const selectedCategory = categoryOptions.find(o => o.value === answers.hotelCategory);
    const multiplier = selectedCategory?.sqftMultiplier || 500;
    return (answers.roomCount || 150) * multiplier;
  }, [answers.hotelCategory, answers.roomCount, questions]);

  const calculateEnergy = (): number => {
    const sqft = answers.squareFootage > 0 ? answers.squareFootage : estimatedSqft;
    let base = sqft * 15;

    ['poolType', 'fitnessCenter', 'spaServices', 'foodBeverage', 'laundryType', 'meetingSpace', 'parkingType'].forEach(field => {
      const options = getOptions(field);
      const selected = options.find(o => o.value === answers[field]);
      if (selected?.energyKwh) {
        base += selected.energyKwh;
      }
    });

    ['exteriorLoads'].forEach(field => {
      const options = getOptions(field);
      const selectedValues = answers[field] || [];
      options.forEach(opt => {
        if (selectedValues.includes(opt.value) && opt.energyKwh) {
          base += opt.energyKwh;
        }
      });
    });

    const elevatorQ = getQuestion('elevatorCount');
    const elevatorEnergy = elevatorQ?.options?.[0]?.energyPerUnit || 8000;
    base += (answers.elevatorCount || 2) * elevatorEnergy;

    const hvacOptions = getOptions('hvacType');
    const selectedHvac = hvacOptions.find(o => o.value === answers.hvacType);
    if (selectedHvac?.energyMultiplier) {
      base *= selectedHvac.energyMultiplier;
    }

    const occupancy = answers.avgOccupancy || 65;
    base *= (occupancy / 100) * 0.7 + 0.3;

    return Math.round(base);
  };

  const autofillForCategory = () => {
    const presets: Record<string, Record<string, string>> = {
      'budget': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'none' },
      'midscale': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'small' },
      'upscale': { poolType: 'heated', fitnessCenter: 'full', spaServices: 'basic', foodBeverage: 'restaurant', laundryType: 'commercial', meetingSpace: 'medium' },
      'luxury': { poolType: 'indoor', fitnessCenter: 'full', spaServices: 'full', foodBeverage: 'full', laundryType: 'commercial', meetingSpace: 'large' },
      'boutique': { poolType: 'none', fitnessCenter: 'basic', spaServices: 'basic', foodBeverage: 'restaurant', laundryType: 'outsourced', meetingSpace: 'small' },
      'extended': { poolType: 'outdoor', fitnessCenter: 'basic', spaServices: 'none', foodBeverage: 'breakfast', laundryType: 'guest', meetingSpace: 'none' }
    };
    if (answers.hotelCategory && presets[answers.hotelCategory]) {
      setAnswers(prev => ({ ...prev, ...presets[answers.hotelCategory] }));
    }
    setShowAutofillPrompt(false);
  };

  const handleCategoryChange = (value: string) => {
    setAnswers(prev => ({ ...prev, hotelCategory: value }));
    setShowAutofillPrompt(true);
  };

  const toggleMultiselect = (field: string, value: string) => {
    const current = answers[field] || [];
    if (current.includes(value)) {
      setAnswers(prev => ({ ...prev, [field]: current.filter((v: string) => v !== value) }));
    } else {
      setAnswers(prev => ({ ...prev, [field]: [...current, value] }));
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
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#a7f3d0', marginBottom: 4 }}>
          Estimated Annual Usage
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.value }}>
          {formatNumber(calculateEnergy())}
          <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>kWh</span>
        </div>
        <div style={{ fontSize: 12, color: '#a7f3d0', marginTop: 4 }}>
          ~{formatNumber(Math.round(calculateEnergy() / 12))} kWh/month
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: 36, fontWeight: 700, margin: 0,
          background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Hotel Energy Profile
        </h1>
        <p style={{ color: COLORS.label, marginTop: 8, fontSize: 16 }}>
          Tell us about your property • {questions.length} questions
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* ZONE 1: Category Selection */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: COLORS.heading }}>
            1 → {getQuestion('hotelCategory')?.question_text || 'What type of hotel?'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {categoryOptions.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                style={{
                  background: answers.hotelCategory === cat.value 
                    ? `linear-gradient(135deg, ${cat.color}40, ${cat.color}20)`
                    : 'rgba(255,255,255,0.02)',
                  border: answers.hotelCategory === cat.value 
                    ? `2px solid ${cat.color}`
                    : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 16, padding: '20px 12px', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: answers.hotelCategory === cat.value ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.value }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {showAutofillPrompt && answers.hotelCategory && (
            <div style={{
              marginTop: 20, padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: 14, color: COLORS.value }}>💡 Auto-fill typical amenities for </span>
                <strong style={{ color: COLORS.value }}>{categoryOptions.find(c => c.value === answers.hotelCategory)?.label}</strong>
                <span style={{ fontSize: 14, color: COLORS.value }}> hotels?</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={autofillForCategory} className="pulse-attention" style={{ 
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                  border: '2px solid #fcd34d', 
                  borderRadius: 12, 
                  padding: '12px 24px', 
                  color: '#1e293b', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  fontSize: 15,
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
                  transition: 'all 0.2s ease'
                }}>
                  ✨ Yes, autofill
                </button>
                <button onClick={() => setShowAutofillPrompt(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', color: COLORS.label, cursor: 'pointer', fontSize: 13 }}>
                  I'll customize
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ZONE 2: Property Snapshot - WITH +/- BUTTONS */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: COLORS.heading }}>
            2 → Property Snapshot
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            {/* Guest Rooms with +/- */}
            <SliderWithButtons
              label="Guest Rooms"
              value={answers.roomCount || 150}
              min={Number(roomQ?.min_value) || 10}
              max={Number(roomQ?.max_value) || 1000}
              step={10}
              onChange={(val) => setAnswers(prev => ({ ...prev, roomCount: val }))}
              color={COLORS.primary}
            />

            {/* Square Footage */}
            <div>
              <label style={{ fontSize: 12, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1 }}>Square Footage</label>
              <div style={{ fontSize: 28, fontWeight: 700, color: answers.squareFootage > 0 ? COLORS.value : COLORS.muted, marginTop: 8 }}>
                {formatNumber(answers.squareFootage > 0 ? answers.squareFootage : estimatedSqft)}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={!answers.squareFootage || answers.squareFootage === 0}
                  onChange={(e) => setAnswers(prev => ({ ...prev, squareFootage: e.target.checked ? 0 : estimatedSqft }))}
                  style={{ accentColor: COLORS.primary }} />
                <span style={{ fontSize: 12, color: COLORS.label }}>Auto-estimate</span>
              </label>
            </div>

            {/* Avg Occupancy with +/- */}
            <SliderWithButtons
              label="Avg Occupancy"
              value={answers.avgOccupancy || 65}
              min={Number(occupancyQ?.min_value) || 20}
              max={Number(occupancyQ?.max_value) || 95}
              step={5}
              onChange={(val) => setAnswers(prev => ({ ...prev, avgOccupancy: val }))}
              unit="%"
              color={COLORS.success}
            />

            {/* Floors & Elevators */}
            <div>
              <label style={{ fontSize: 12, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>
                Floors / Elevators
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <SliderWithButtons
                    label=""
                    value={answers.floorCount || 4}
                    min={Number(floorsQ?.min_value) || 1}
                    max={Number(floorsQ?.max_value) || 50}
                    step={1}
                    onChange={(val) => setAnswers(prev => ({ ...prev, floorCount: val }))}
                    color={COLORS.purple}
                  />
                </div>
                <span style={{ color: COLORS.muted, fontSize: 20 }}>/</span>
                <div style={{ flex: 1 }}>
                  <SliderWithButtons
                    label=""
                    value={answers.elevatorCount || 2}
                    min={Number(elevatorsQ?.min_value) || 0}
                    max={Number(elevatorsQ?.max_value) || 20}
                    step={1}
                    onChange={(val) => setAnswers(prev => ({ ...prev, elevatorCount: val }))}
                    color={COLORS.purple}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HVAC */}
          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 12, color: COLORS.label, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>
              {getQuestion('hvacType')?.question_text || 'Primary HVAC System'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {hvacOptions.map(opt => (
                <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, hvacType: opt.value }))}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: answers.hvacType === opt.value ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: answers.hvacType === opt.value ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.cardBorder}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease'
                  }}>
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div style={{ fontSize: 12, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ZONE 3: Amenities Grid - 2 per row, larger boxes */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: COLORS.heading }}>
            3 → Amenities & Services
          </h2>
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
                    <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, [field]: opt.value }))} title={opt.label}
                      style={{
                        padding: '14px 8px',
                        background: answers[field] === opt.value ? COLORS.selectedBg : 'rgba(255,255,255,0.02)',
                        border: answers[field] === opt.value ? `2px solid ${COLORS.selectedBorder}` : `2px solid ${COLORS.cardBorder}`,
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s ease'
                      }}>
                      <div style={{ fontSize: 24 }}>{opt.icon}</div>
                      <div style={{ fontSize: 11, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZONE 4: Parking & Exterior */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: COLORS.heading }}>4 → Parking & Exterior</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {parkingOptions.map(opt => (
              <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, parkingType: opt.value }))}
                style={{
                  flex: 1, padding: '14px 8px',
                  background: answers.parkingType === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: answers.parkingType === opt.value ? `2px solid ${COLORS.purple}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 10, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 20 }}>{opt.icon}</div>
                <div style={{ fontSize: 11, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
              </button>
            ))}
          </div>
          <label style={{ fontSize: 12, color: COLORS.label, marginBottom: 8, display: 'block' }}>Exterior Loads</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {exteriorOptions.map(opt => (
              <button key={opt.value} onClick={() => toggleMultiselect('exteriorLoads', opt.value)}
                style={{
                  padding: '8px 12px',
                  background: (answers.exteriorLoads || []).includes(opt.value) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (answers.exteriorLoads || []).includes(opt.value) ? `2px solid ${COLORS.purple}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 12, color: COLORS.value
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
              <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, solarInterest: opt.value }))}
                style={{
                  flex: 1, padding: '10px 6px',
                  background: answers.solarInterest === opt.value ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: answers.solarInterest === opt.value ? `2px solid ${COLORS.warning}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 8, cursor: 'pointer', fontSize: 11, color: COLORS.value
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 12, color: COLORS.label, marginBottom: 8, display: 'block' }}>Available Space for Solar</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {solarSpaceOptions.map(opt => (
              <button key={opt.value} onClick={() => toggleMultiselect('solarSpace', opt.value)}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: (answers.solarSpace || []).includes(opt.value) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (answers.solarSpace || []).includes(opt.value) ? `2px solid ${COLORS.warning}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 10, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 18 }}>{opt.icon}</div>
                <div style={{ fontSize: 10, color: COLORS.value, marginTop: 4 }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ZONE 6: Existing Infrastructure */}
        <div style={{ background: COLORS.cardBg, borderRadius: 24, padding: 32, marginBottom: 32, border: `1px solid ${COLORS.cardBorder}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: COLORS.heading }}>6 → Existing Infrastructure</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {existingOptions.map(opt => (
              <button key={opt.value}
                onClick={() => {
                  if (opt.value === 'none') {
                    setAnswers(prev => ({ ...prev, existingGeneration: [] }));
                  } else {
                    toggleMultiselect('existingGeneration', opt.value);
                  }
                }}
                style={{
                  flex: 1, padding: '20px 16px',
                  background: (opt.value === 'none' && (answers.existingGeneration || []).length === 0) || (answers.existingGeneration || []).includes(opt.value)
                    ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                  border: (opt.value === 'none' && (answers.existingGeneration || []).length === 0) || (answers.existingGeneration || []).includes(opt.value)
                    ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.cardBorder}`,
                  borderRadius: 12, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 28 }}>{opt.icon}</div>
                <div style={{ fontSize: 13, color: COLORS.value, marginTop: 8 }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { Step3HotelEnergy };
export default Step3HotelEnergy;
