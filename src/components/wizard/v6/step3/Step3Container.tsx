// ============================================
// MERLIN STEP 3 CONTAINER
// File: src/components/wizard/v6/step3/Step3Container.tsx
// Groups questions by section_name and renders with proper components
// ============================================

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/services/supabaseClient';
import { SectionHeader, SmartQuestion } from './inputs';
import { getColorScheme } from './inputs/registry';
import { Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Question {
  id: string;
  question_text: string;
  question_type: 'select' | 'multiselect' | 'number' | 'boolean' | 'text' | 'range_buttons' | 'slider' | 'toggle';
  field_name: string;
  options: unknown;
  is_required: boolean;
  display_order: number;
  help_text: string;
  section_name: string;
  icon_name: string;
}

interface Step3ContainerProps {
  industry: string;
  useCaseId: string;
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
  _onBack: () => void;
  onNext: () => void;
}

// ============================================
// SECTION ICON MAPPING (fallbacks)
// ============================================

const SECTION_ICONS: Record<string, string> = {
  'Property Basics': 'Building2',
  'Facility Basics': 'Building2',
  'Station Basics': 'PlugZap',
  'Building Systems': 'Layers',
  'Equipment': 'Settings',
  'Charger Mix': 'BatteryCharging',
  'Guest Amenities': 'Dumbbell',
  'Site Amenities': 'Coffee',
  'Food & Beverage': 'UtensilsCrossed',
  'Operations': 'Settings',
  'Water & Sustainability': 'Droplets',
  'Power & Grid': 'Zap',
  'Parking & Exterior': 'Car',
  'Site & Infrastructure': 'Building',
  'Existing Infrastructure': 'Zap',
  'Solar & EV Interest': 'Sun',
  'Solar Interest': 'Sun',
};

// ============================================
// COMPONENT
// ============================================

export const Step3Container: React.FC<Step3ContainerProps> = ({
  industry,
  useCaseId,
  values,
  onChange,
  _onBack,
  onNext,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from Supabase
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!useCaseId) {
        setError('No use case selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('custom_questions')
          .select('*')
          .eq('use_case_id', useCaseId)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        console.log(`[Step3] Loaded ${data?.length || 0} questions for ${industry}`);
        setQuestions((data || []) as unknown as Question[]);
        setError(null);
      } catch (err) {
        console.error('[Step3] Error fetching questions:', err);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [useCaseId, industry]);

  // Group questions by section
  const sections = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    
    questions.forEach((q) => {
      const sectionName = q.section_name || 'General';
      if (!grouped[sectionName]) {
        grouped[sectionName] = [];
      }
      grouped[sectionName].push(q);
    });

    // Convert to array with icons
    return Object.entries(grouped).map(([name, qs]) => ({
      name,
      icon: SECTION_ICONS[name] || 'HelpCircle',
      questions: qs.sort((a, b) => a.display_order - b.display_order),
    }));
  }, [questions]);

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const required = questions.filter((q) => q.is_required);
    const completed = required.filter((q) => {
      const val = values[q.field_name];
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
    return {
      total: required.length,
      completed: completed.length,
      isComplete: completed.length === required.length,
    };
  }, [questions, values]);

  // Section completion
  const getSectionCompletion = (sectionQuestions: Question[]) => {
    const required = sectionQuestions.filter((q) => q.is_required);
    const completed = required.filter((q) => {
      const val = values[q.field_name];
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
    return { total: required.length, completed: completed.length };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-600">Loading questions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-600 mb-4">No questions found for this industry.</p>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
        >
          Continue Anyway
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Tell Us About Your {industry}
        </h2>
        <p className="text-slate-600">
          Answer a few questions to help us size your energy system accurately.
        </p>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">
              {completionStatus.completed} of {completionStatus.total} required fields complete
            </span>
            <span className="text-violet-600 font-medium">
              {sections.length} sections
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{
                width: completionStatus.total > 0
                  ? `${(completionStatus.completed / completionStatus.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, sectionIndex) => {
          const completion = getSectionCompletion(section.questions);
          const colorScheme = getColorScheme(sectionIndex);
          return (
            <div
              key={section.name}
              className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <SectionHeader
                title={section.name}
                icon={section.icon}
                questionCount={completion.total > 0 ? completion.total : undefined}
                completedCount={completion.total > 0 ? completion.completed : undefined}
                colorScheme={colorScheme}
              />
              
              <div className="space-y-6">
                {section.questions.map((question) => (
                  <SmartQuestion
                    key={question.id}
                    question={question as any}
                    value={values[question.field_name]}
                    onChange={onChange}
                    colorScheme={colorScheme}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation removed - using floating nav bar in WizardV6 (Jan 18, 2026) */}
      {/* Show progress indicator if questions remaining */}
      {!completionStatus.isComplete && completionStatus.total > 0 && (
        <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
          <span className="text-sm text-amber-400">
            ⚠️ {completionStatus.total - completionStatus.completed} required fields remaining
          </span>
        </div>
      )}
    </div>
  );
};

export default Step3Container;
