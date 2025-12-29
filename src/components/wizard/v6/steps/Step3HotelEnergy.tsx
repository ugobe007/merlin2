import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Loader2 } from 'lucide-react';
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
        // Set defaults
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

  // Get question by field name
  const getQuestion = (fieldName: string): Question | undefined => {
    return questions.find(q => q.field_name === fieldName);
  };

  // Get options for a question
  const getOptions = (fieldName: string): QuestionOption[] => {
    const q = getQuestion(fieldName);
    return q?.options || [];
  };

  // Calculate estimated sqft based on rooms and category
  const estimatedSqft = useMemo(() => {
    const categoryOptions = getOptions('hotelCategory');
    const selectedCategory = categoryOptions.find(o => o.value === answers.hotelCategory);
    const multiplier = selectedCategory?.sqftMultiplier || 500;
    return (answers.roomCount || 150) * multiplier;
  }, [answers.hotelCategory, answers.roomCount, questions]);

  // Calculate live energy estimate from database values
  const calculateEnergy = (): number => {
    const sqft = answers.squareFootage > 0 ? answers.squareFootage : estimatedSqft;
    let base = sqft * 15; // Base kWh/year per sqft

    // Add energy from select questions
    ['poolType', 'fitnessCenter', 'spaServices', 'foodBeverage', 'laundryType', 'meetingSpace', 'parkingType'].forEach(field => {
      const options = getOptions(field);
      const selected = options.find(o => o.value === answers[field]);
      if (selected?.energyKwh) {
        base += selected.energyKwh;
      }
    });

    // Add energy from multiselect questions
    ['exteriorLoads'].forEach(field => {
      const options = getOptions(field);
      const selectedValues = answers[field] || [];
      options.forEach(opt => {
        if (selectedValues.includes(opt.value) && opt.energyKwh) {
          base += opt.energyKwh;
        }
      });
    });

    // Elevator energy (per unit)
    const elevatorQ = getQuestion('elevatorCount');
    const elevatorEnergy = elevatorQ?.options?.[0]?.energyPerUnit || 8000;
    base += (answers.elevatorCount || 2) * elevatorEnergy;

    // HVAC multiplier
    const hvacOptions = getOptions('hvacType');
    const selectedHvac = hvacOptions.find(o => o.value === answers.hvacType);
    if (selectedHvac?.energyMultiplier) {
      base *= selectedHvac.energyMultiplier;
    }

    // Occupancy adjustment
    const occupancy = answers.avgOccupancy || 65;
    base *= (occupancy / 100) * 0.7 + 0.3;

    return Math.round(base);
  };

  // Autofill based on category
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

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setAnswers(prev => ({ ...prev, hotelCategory: value }));
    setShowAutofillPrompt(true);
  };

  // Toggle multiselect item
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
        <span className="ml-3 text-slate-400">Loading hotel questions...</span>
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
  const sqftQ = getQuestion('squareFootage');
  const occupancyQ = getQuestion('avgOccupancy');
  const floorsQ = getQuestion('floorCount');
  const elevatorsQ = getQuestion('elevatorCount');

  return (
    <div style={{ position: 'relative', paddingBottom: 40 }}>
      {/* Live Energy Estimate - Floating */}
      <div style={{
        position: 'fixed',
        top: 100,
        right: 24,
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        borderRadius: 16,
        padding: '16px 24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(16, 185, 129, 0.2)',
        zIndex: 100,
        minWidth: 200,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: '#a7f3d0', marginBottom: 4 }}>
          Estimated Annual Usage
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
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
          fontSize: 36, 
          fontWeight: 700, 
          margin: 0,
          background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Hotel Energy Profile
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
          Tell us about your property • {questions.length} questions
        </p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* ZONE 1: Category Selection */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#94a3b8' }}>
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
                    : '2px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: '20px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: answers.hotelCategory === cat.value ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {showAutofillPrompt && answers.hotelCategory && (
            <div style={{
              marginTop: 20,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: 14, color: '#fff' }}>💡 Auto-fill typical amenities for </span>
                <strong style={{ color: '#fff' }}>{categoryOptions.find(c => c.value === answers.hotelCategory)?.label}</strong>
                <span style={{ fontSize: 14, color: '#fff' }}> hotels?</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={autofillForCategory} style={{ background: '#3b82f6', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  Yes, autofill
                </button>
                <button onClick={() => setShowAutofillPrompt(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                  I'll customize
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ZONE 2: Property Snapshot */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#94a3b8' }}>
            2 → Property Snapshot
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Guest Rooms</label>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginTop: 4 }}>{answers.roomCount || 150}</div>
              <input type="range" min={roomQ?.min_value || 10} max={roomQ?.max_value || 1000} value={answers.roomCount || 150}
                onChange={(e) => setAnswers(prev => ({ ...prev, roomCount: Number(e.target.value) }))}
                style={{ width: '100%', marginTop: 8, accentColor: '#3b82f6' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Square Footage</label>
              <div style={{ fontSize: 36, fontWeight: 700, color: answers.squareFootage > 0 ? '#fff' : '#64748b', marginTop: 4 }}>
                {formatNumber(answers.squareFootage > 0 ? answers.squareFootage : estimatedSqft)}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!answers.squareFootage || answers.squareFootage === 0}
                  onChange={(e) => setAnswers(prev => ({ ...prev, squareFootage: e.target.checked ? 0 : estimatedSqft }))}
                  style={{ accentColor: '#3b82f6' }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Auto-estimate</span>
              </label>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Avg Occupancy</label>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginTop: 4 }}>{answers.avgOccupancy || 65}%</div>
              <input type="range" min={occupancyQ?.min_value || 20} max={occupancyQ?.max_value || 95} value={answers.avgOccupancy || 65}
                onChange={(e) => setAnswers(prev => ({ ...prev, avgOccupancy: Number(e.target.value) }))}
                style={{ width: '100%', marginTop: 8, accentColor: '#3b82f6' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Floors / Elevators</label>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                {answers.floorCount || 4} <span style={{ color: '#64748b', fontSize: 20 }}>/</span> {answers.elevatorCount || 2}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="range" min={floorsQ?.min_value || 1} max={floorsQ?.max_value || 50} value={answers.floorCount || 4}
                  onChange={(e) => setAnswers(prev => ({ ...prev, floorCount: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: '#8b5cf6' }} />
                <input type="range" min={elevatorsQ?.min_value || 0} max={elevatorsQ?.max_value || 20} value={answers.elevatorCount || 2}
                  onChange={(e) => setAnswers(prev => ({ ...prev, elevatorCount: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: '#8b5cf6' }} />
              </div>
            </div>
          </div>

          {/* HVAC */}
          <div style={{ marginTop: 24 }}>
            <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>
              {getQuestion('hvacType')?.question_text || 'Primary HVAC System'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {hvacOptions.map(opt => (
                <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, hvacType: opt.value }))}
                  style={{
                    flex: 1, padding: '12px 16px',
                    background: answers.hvacType === opt.value ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: answers.hvacType === opt.value ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s ease'
                  }}>
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div style={{ fontSize: 12, color: '#fff', marginTop: 4 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ZONE 3: Amenities Grid */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#94a3b8' }}>
            3 → Amenities & Services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { field: 'poolType', label: 'Pool', options: poolOptions },
              { field: 'fitnessCenter', label: 'Fitness', options: fitnessOptions },
              { field: 'spaServices', label: 'Spa', options: spaOptions },
              { field: 'foodBeverage', label: 'Food & Beverage', options: fbOptions },
              { field: 'laundryType', label: 'Laundry', options: laundryOptions },
              { field: 'meetingSpace', label: 'Meeting', options: meetingOptions }
            ].map(({ field, label, options }) => (
              <div key={field}>
                <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' }}>{label}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {options.map(opt => (
                    <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, [field]: opt.value }))} title={opt.label}
                      style={{
                        flex: 1, padding: '10px 4px',
                        background: answers[field] === opt.value ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))' : 'rgba(255,255,255,0.02)',
                        border: answers[field] === opt.value ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.06)',
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease'
                      }}>
                      <div style={{ fontSize: 18 }}>{opt.icon}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZONE 4: Parking & Solar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#94a3b8' }}>4 → Parking & Exterior</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {parkingOptions.map(opt => (
                <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, parkingType: opt.value }))}
                  style={{
                    flex: 1, padding: '14px 8px',
                    background: answers.parkingType === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: answers.parkingType === opt.value ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, cursor: 'pointer'
                  }}>
                  <div style={{ fontSize: 20 }}>{opt.icon}</div>
                  <div style={{ fontSize: 11, color: '#fff', marginTop: 4 }}>{opt.label}</div>
                </button>
              ))}
            </div>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'block' }}>Exterior Loads</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {exteriorOptions.map(opt => (
                <button key={opt.value} onClick={() => toggleMultiselect('exteriorLoads', opt.value)}
                  style={{
                    padding: '8px 12px',
                    background: (answers.exteriorLoads || []).includes(opt.value) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: (answers.exteriorLoads || []).includes(opt.value) ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#fff'
                  }}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.02))', borderRadius: 24, padding: 32, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#fbbf24' }}>☀️ Solar Interest</h2>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {solarInterestOptions.map(opt => (
                <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, solarInterest: opt.value }))}
                  style={{
                    flex: 1, padding: '10px 6px',
                    background: answers.solarInterest === opt.value ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: answers.solarInterest === opt.value ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, cursor: 'pointer', fontSize: 11, color: '#fff'
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <label style={{ fontSize: 12, color: '#64748b', marginBottom: 8, display: 'block' }}>Available Space for Solar</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {solarSpaceOptions.map(opt => (
                <button key={opt.value} onClick={() => toggleMultiselect('solarSpace', opt.value)}
                  style={{
                    flex: 1, padding: '12px 8px',
                    background: (answers.solarSpace || []).includes(opt.value) ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.02)',
                    border: (answers.solarSpace || []).includes(opt.value) ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, cursor: 'pointer'
                  }}>
                  <div style={{ fontSize: 18 }}>{opt.icon}</div>
                  <div style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ZONE 5: Existing Infrastructure */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 32, marginBottom: 32, border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#94a3b8' }}>5 → Existing Infrastructure</h2>
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
                    ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, cursor: 'pointer'
                }}>
                <div style={{ fontSize: 28 }}>{opt.icon}</div>
                <div style={{ fontSize: 13, color: '#fff', marginTop: 8 }}>{opt.label}</div>
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
