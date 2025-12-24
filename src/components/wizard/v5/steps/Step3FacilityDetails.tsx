/**
 * STEP 3: FACILITY DETAILS - V5 VERSION
 * ======================================
 * 
 * December 21, 2025 - FIXED VERSION
 * 
 * This component shows facility detail questions.
 * Loads questions from database via useCaseService.getUseCaseBySlug().
 * Falls back to hardcoded questions if database is unavailable.
 * 
 * Solar/EV questions are handled via popup modals (not inline)
 * to reduce form clutter and provide focused configuration experience.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Zap, 
  Clock, 
  Users, 
  Ruler, 
  Sun,
  Battery,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Gauge,
  PlugZap,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Minus,
  Plus,
  Settings,
  HelpCircle
} from 'lucide-react';

// Proper ES6 import for useCaseService
import { useCaseService } from '@/services/useCaseService';
import { AdvancedQuestionsModal } from '../../modals/AdvancedQuestionsModal';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Step3Props {
  selectedIndustry: string;
  industryName: string;
  useCaseData: Record<string, any>;
  onDataChange: (field: string, value: any) => void;
  // Solar & EV modal triggers
  onSolarConfigClick?: () => void;
  onEVConfigClick?: () => void;
  // Current config summaries (for badges)
  solarKW?: number;
  evChargerCount?: number;
}

interface Question {
  id: string;
  fieldName: string;
  questionText: string;
  helpText?: string;
  questionType:
    | 'select'
    | 'dropdown'
    | 'toggle'
    | 'slider'
    | 'yes_no'
    | 'number'
    | 'multiselect'
    | 'boolean'
    | 'compound';
  options?: (string | { label: string; value: string; description?: string; [key: string]: any })[];
  minValue?: number;
  maxValue?: number;
  defaultValue?: any;
  unit?: string;
  isRequired?: boolean;
}

// Fields that should be handled via popup modals instead of inline
// These are configured via the Solar & EV buttons at the top of the page
const POPUP_MODAL_FIELDS = [
  // Solar fields - all variations (handled in Power Boost panel)
  'hasSolar', 'existingSolar', 'existingSolarKW', 'existingSolarMW',
  'wantSolar', 'wantsSolar', 'solarInterest', 'desiredSolarKW',
  // EV Charging fields - all variations (handled in Power Boost panel)
  'hasEVChargers', 'hasEVCharging', 'existingEVChargers', 'existingEV',
  'wantEVChargers', 'wantsEVCharging', 'wantsMoreEVCharging', 'evInterest',
  'desiredEVChargers', 'existingL2Count', 'existingDCFCCount', 
  'desiredL2Count', 'desiredDCFCCount',
  // EV Charger specific details (handled in EV modal)
  'level2Chargers', 'dcfc50kwChargers', 'dcfc150kwChargers', 
  'dcfc350kwChargers', 'megawattChargers', 'concurrentChargingSessions',
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLLEGE INSTITUTION SIZE PRESETS
// Pre-fills form based on typical institution profiles
// ═══════════════════════════════════════════════════════════════════════════════

interface CollegePreset {
  id: string;
  label: string;
  description: string;
  studentRange: string;
  icon: string;
  defaults: Record<string, any>;
}

const COLLEGE_PRESETS: CollegePreset[] = [
  {
    id: 'small',
    label: 'Small College',
    description: 'Liberal arts, community college',
    studentRange: '< 3,000 students',
    icon: '🏫',
    defaults: {
      campusType: 'liberal_arts',
      totalBuildingSqFt: 'under_500k',
      buildingCount: 15,
      studentEnrollment: '1_3k',
      dormBeds: '1_2k',
      hasResearchFacilities: 'false',
      hasMedicalFacilities: 'false',
      hasStadium: 'false',
      hasDataCenter: 'false',
      centralPlantType: 'distributed',
      peakDemandKW: 2000,
    }
  },
  {
    id: 'medium',
    label: 'Medium College',
    description: 'Regional university, larger liberal arts',
    studentRange: '3,000 - 15,000 students',
    icon: '🎓',
    defaults: {
      campusType: 'liberal_arts',
      totalBuildingSqFt: '1_3_million',
      buildingCount: 40,
      studentEnrollment: '5_15k',
      dormBeds: '3_5k',
      hasResearchFacilities: 'true',
      hasMedicalFacilities: 'false',
      hasStadium: 'false',
      hasDataCenter: 'small',
      centralPlantType: 'central_chilled',
      peakDemandKW: 8000,
    }
  },
  {
    id: 'large',
    label: 'Large University',
    description: 'State university, research institution',
    studentRange: '15,000 - 50,000 students',
    icon: '🏛️',
    defaults: {
      campusType: 'research_university',
      totalBuildingSqFt: '3_5_million',
      buildingCount: 100,
      studentEnrollment: '15_35k',
      dormBeds: '5_10k',
      hasResearchFacilities: 'true',
      hasMedicalFacilities: 'true',
      hasStadium: 'true',
      hasDataCenter: 'medium',
      centralPlantType: 'central_chilled_steam',
      peakDemandKW: 25000,
    }
  },
  {
    id: 'major',
    label: 'Major Research University',
    description: 'Ohio State, Michigan, UCLA-scale',
    studentRange: '50,000+ students',
    icon: '🏟️',
    defaults: {
      campusType: 'research_university',
      totalBuildingSqFt: 'over_10_million',
      buildingCount: 180,
      studentEnrollment: 'over_50k',
      dormBeds: 'over_15k',
      hasResearchFacilities: 'true',
      hasMedicalFacilities: 'true',
      hasStadium: 'true',
      hasDataCenter: 'large',
      centralPlantType: 'central_chilled_steam',
      peakDemandKW: 75000,
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK QUESTIONS - Always available, industry-agnostic
// ═══════════════════════════════════════════════════════════════════════════════

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'squareFootage',
    fieldName: 'squareFootage',
    questionText: 'Facility square footage',
    helpText: 'Total building or site area',
    questionType: 'select',
    options: [
      'Under 10,000 sq ft',
      '10,000 - 50,000 sq ft',
      '50,000 - 100,000 sq ft',
      '100,000 - 250,000 sq ft',
      '250,000+ sq ft'
    ],
    isRequired: true,
  },
  {
    id: 'peakDemand',
    fieldName: 'peakDemand',
    questionText: 'Estimated peak demand',
    helpText: 'Maximum power draw during peak usage',
    questionType: 'slider',
    minValue: 50,
    maxValue: 5000,
    defaultValue: 500,
    unit: ' kW',
    isRequired: true,
  },
  {
    id: 'operatingHours',
    fieldName: 'operatingHours',
    questionText: 'Daily operating hours',
    helpText: 'How many hours per day is the facility active?',
    questionType: 'select',
    options: [
      '8 hours (single shift)',
      '12 hours (extended)',
      '16 hours (two shifts)',
      '24 hours (continuous)'
    ],
    isRequired: true,
  },
  {
    id: 'backupPowerNeeded',
    fieldName: 'backupPowerNeeded',
    questionText: 'Do you need backup power?',
    helpText: 'Battery backup during grid outages',
    questionType: 'toggle',
    options: ['Yes', 'No', 'Critical loads only'],
    isRequired: true,
  },
  {
    id: 'existingSolar',
    fieldName: 'existingSolar',
    questionText: 'Do you have existing solar?',
    helpText: 'Current solar PV installation',
    questionType: 'toggle',
    options: ['Yes', 'No', 'Planning to add'],
    isRequired: false,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY-SPECIFIC QUESTIONS (when database is not available)
// ═══════════════════════════════════════════════════════════════════════════════

const INDUSTRY_QUESTIONS: Record<string, Question[]> = {
  'hotel': [
    {
      id: 'roomCount',
      fieldName: 'roomCount',
      questionText: 'Number of guest rooms',
      helpText: 'Total rooms in the property',
      questionType: 'slider',
      minValue: 10,
      maxValue: 1000,
      defaultValue: 150,
      unit: ' rooms',
      isRequired: true,
    },
    {
      id: 'hotelCategory',
      fieldName: 'hotelCategory',
      questionText: 'Hotel category and service level',
      helpText: 'Hotel category affects energy intensity and system sizing. Star ratings define service level, facilities, and guest expectations.',
      questionType: 'select',
      options: [
        { 
          value: '1-star', 
          label: '1-Star Hotel', 
          description: 'Basic accommodation with essential needs. Clean room, basic furniture, limited services, no restaurant or minimal facilities. Functionality over comfort.' 
        },
        { 
          value: '2-star', 
          label: '2-Star Hotel', 
          description: 'Budget hotel with modest comfort. Private bathroom, daily housekeeping, limited front desk service. Affordable comfort.' 
        },
        { 
          value: '3-star', 
          label: '3-Star Hotel', 
          description: 'Mid-range hotel with standard hospitality services. 24-hour reception, breakfast or restaurant, room service (limited hours). Suitable for leisure and business travelers. Balance between price and service.' 
        },
        { 
          value: '4-star', 
          label: '4-Star Hotel', 
          description: 'Upscale hotel with enhanced comfort and service quality. Concierge or guest services, multiple dining options, fitness center or pool, higher-quality rooms and amenities. Comfort with sophistication.' 
        },
        { 
          value: '5-star', 
          label: '5-Star Hotel', 
          description: 'Luxury hotel with officially regulated standards. High staff-to-guest ratio, personalized service, concierge and valet services, spa, fine dining, and premium facilities. Strong SOPs and service consistency. Luxury defined by reliability and service depth.' 
        },
        { 
          value: 'boutique', 
          label: 'Boutique Hotel', 
          description: 'Experience-driven property, not defined by size or star rating. Small to mid-size, unique design or theme, personalized intimate service, strong local or lifestyle identity. Curated interiors, signature dining or breakfast concept, personalized guest interaction. May be star-rated or non-classified.' 
        },
        { 
          value: 'non-classified', 
          label: 'Non-Classified Hotel', 
          description: 'Operates without an official star rating. No formal government classification, service levels vary widely, quality depends on management and reviews. Basic to moderate facilities, limited standardized services, flexible pricing. Can be excellent but consistency is not guaranteed.' 
        },
      ],
      isRequired: true,
    },
    {
      id: 'amenities',
      fieldName: 'amenities',
      questionText: 'Which amenities do you have?',
      helpText: 'Select all that apply',
      questionType: 'toggle',
      options: ['Pool', 'Restaurant', 'Fitness Center', 'Spa', 'Laundry'],
      isRequired: false,
    },
    ...FALLBACK_QUESTIONS.slice(2),
  ],
  'car-wash': [
    {
      id: 'bayCount',
      fieldName: 'bayCount',
      questionText: 'Number of wash bays',
      helpText: 'Total active wash bays',
      questionType: 'slider',
      minValue: 1,
      maxValue: 20,
      defaultValue: 4,
      unit: ' bays',
      isRequired: true,
    },
    {
      id: 'washType',
      fieldName: 'washType',
      questionText: 'Type of car wash',
      helpText: 'Primary wash system',
      questionType: 'toggle',
      options: ['In-Bay Automatic', 'Tunnel', 'Self-Service', 'Express'],
      isRequired: true,
    },
    ...FALLBACK_QUESTIONS.slice(2),
  ],
  'ev-charging': [
    {
      id: 'chargerCount',
      fieldName: 'chargerCount',
      questionText: 'Number of charging ports',
      helpText: 'Total EV charging ports',
      questionType: 'slider',
      minValue: 2,
      maxValue: 100,
      defaultValue: 10,
      unit: ' ports',
      isRequired: true,
    },
    {
      id: 'chargerMix',
      fieldName: 'chargerMix',
      questionText: 'Charger type mix',
      helpText: 'Primary charger types',
      questionType: 'toggle',
      options: ['Mostly Level 2', 'Mixed L2/DCFC', 'Mostly DC Fast'],
      isRequired: true,
    },
    ...FALLBACK_QUESTIONS.slice(2),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE INPUT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Helper to normalize options - handles both string[] and object[] formats
type OptionItem = string | { label: string; value: string; description?: string; [key: string]: any };
const normalizeOption = (opt: OptionItem): { label: string; value: string } => {
  if (typeof opt === 'string') {
    return { label: opt, value: opt };
  }
  return { label: opt.label || String(opt.value), value: String(opt.value) };
};

// Compact Dropdown - only for 6+ options
const CompactDropdown: React.FC<{
  options: OptionItem[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const normalizedOptions = (options || []).map(normalizeOption);
  
  return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      className="bg-slate-800/80 border-2 border-purple-500/50 rounded-xl px-4 py-3 text-white w-full max-w-[280px] min-w-[200px] focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer shadow-lg shadow-purple-500/10 hover:border-purple-400 transition-all appearance-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '20px'
      }}
      >
        <option value="" disabled>{placeholder}</option>
        {normalizedOptions.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">
          {opt.label}
        </option>
        ))}
      </select>
  );
};

// Compact Toggle - Yes/No (2 options) - Pill style
const CompactToggle: React.FC<{
  options: OptionItem[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => {
  const normalizedOptions = (options || []).map(normalizeOption);
  
  // Check if this is a Yes/No toggle
  const isYesNo = normalizedOptions.length === 2 && 
    normalizedOptions.some(o => o.value.toLowerCase() === 'yes' || o.label.toLowerCase() === 'yes') &&
    normalizedOptions.some(o => o.value.toLowerCase() === 'no' || o.label.toLowerCase() === 'no');
  
  if (isYesNo) {
    // Yes/No style buttons - compact, side by side
    return (
      <div className="grid grid-cols-2 gap-3" style={{ maxWidth: '260px' }}>
        {normalizedOptions.map((opt) => {
          const isSelected = value === opt.value;
          const isYes = opt.value.toLowerCase() === 'yes' || opt.label.toLowerCase() === 'yes';
          const isNo = opt.value.toLowerCase() === 'no' || opt.label.toLowerCase() === 'no';
          
          let buttonClasses = 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ';
          let iconClasses = 'w-5 h-5 rounded-full flex items-center justify-center text-xs ';
          
          if (isSelected && isYes) {
            buttonClasses += 'bg-gradient-to-br from-emerald-100 to-green-200 border-emerald-500 text-emerald-800';
            iconClasses += 'bg-emerald-500 text-white';
          } else if (isSelected && isNo) {
            buttonClasses += 'bg-gradient-to-br from-red-100 to-rose-200 border-red-500 text-red-800';
            iconClasses += 'bg-red-500 text-white';
          } else {
            buttonClasses += 'bg-slate-100 border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-200';
            iconClasses += 'bg-slate-300 text-slate-500';
          }
          
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={buttonClasses}
            >
              <span className={iconClasses}>
                {isYes ? '✓' : '✕'}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }
  
  // Regular toggle for non-Yes/No options
  return (
    <div className="flex bg-slate-700/50 rounded-full p-1">
      {normalizedOptions.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// Visual Preset Cards - for 3-5 options (replaces button groups)
const VisualPresetCards: React.FC<{
  options: OptionItem[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => {
  const normalizedOptions = (options || []).map(normalizeOption);
  
  // Separate "No" option if it exists
  const noOption = normalizedOptions.find(opt => 
    opt.label.toLowerCase() === 'no' || 
    opt.value.toLowerCase() === 'no' ||
    opt.label.toLowerCase().includes('none') ||
    opt.label.toLowerCase().includes('no meeting') ||
    opt.label.toLowerCase().includes('no dedicated')
  );
  const otherOptions = normalizedOptions.filter(opt => opt !== noOption);
  
  // Get emoji for option based on label
  const getEmoji = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('express') || l.includes('tunnel')) return '🚀';
    if (l.includes('full') || l.includes('service') || l.includes('premium')) return '🏢';
    if (l.includes('in-bay') || l.includes('auto') || l.includes('automatic')) return '🤖';
    if (l.includes('self') || l.includes('diy')) return '🧽';
    if (l.includes('cut') || l.includes('cost')) return '💰';
    if (l.includes('money') || l.includes('arbitrage')) return '📈';
    if (l.includes('stay') || l.includes('resilience') || l.includes('backup')) return '🛡️';
    if (l.includes('meeting') || l.includes('conference')) return '🏢';
    if (l.includes('ballroom') || l.includes('convention')) return '🏛️';
    if (l.includes('small')) return '🏢';
    if (l.includes('medium')) return '🏢';
    if (l.includes('large')) return '🏛️';
    if (l.includes('parking') || l.includes('lot') || l.includes('garage') || l.includes('valet')) return '🅿️';
    return '🏢';
  };
  
  return (
    <div className="w-full">
      {/* Main options grid - Always 2 columns for clean layout */}
      {otherOptions.length > 0 && (
        <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: '1fr 1fr', width: '100%', boxSizing: 'border-box' }}>
          {otherOptions.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`relative p-3 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-600/30 to-violet-600/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-700/50 border-2 border-white/10 hover:border-purple-500/50 hover:bg-slate-700/70'
                }`}
                style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-lg z-10">
                    <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                )}
                <div className="flex items-start gap-2 pr-6">
                  <span className="text-lg flex-shrink-0">{getEmoji(opt.label)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm leading-tight">{opt.label}</div>
                    {opt.description && (
                      <p className="text-xs text-gray-400 leading-tight mt-0.5">{opt.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {/* "No" option at bottom if exists */}
      {noOption && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => onChange(noOption.value)}
            className={`relative w-full p-2.5 rounded-lg text-center transition-all ${
              value === noOption.value
                ? 'bg-gradient-to-br from-purple-600/30 to-violet-600/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-slate-700/50 border-2 border-white/10 hover:border-purple-500/50 hover:bg-slate-700/70'
            }`}
            style={{ boxSizing: 'border-box' }}
          >
            {value === noOption.value && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            )}
            <span className="font-semibold text-white text-sm">{noOption.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Format number helper
const formatNumber = (v: number): string => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return v.toString();
};

// SliderWithValue - for numeric questions with presets
const SliderWithValue: React.FC<{
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  presets?: number[];
  formatValue?: (v: number) => string;
}> = ({ min, max, value, onChange, unit = '', presets, formatValue }) => {
  const displayValue = formatValue ? formatValue(value) : formatNumber(value);
  const progress = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="flex-1 max-w-md">
      {/* Preset chips */}
      {presets && presets.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                Math.abs(value - preset) < 1
                  ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                  : 'bg-white/5 border border-white/20 text-gray-400 hover:border-purple-500/50'
              }`}
            >
              {formatValue ? formatValue(preset) : formatNumber(preset)}{unit}
            </button>
          ))}
      </div>
      )}
      
      {/* Slider with value display */}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${progress}%, #374151 ${progress}%, #374151 100%)`
          }}
        />
        <div className="bg-slate-800 border-2 border-purple-500/50 rounded-xl px-4 py-2 min-w-[100px] text-center shadow-lg shadow-purple-500/20">
          <span className="text-2xl font-bold text-white">{displayValue}</span>
          {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

// Inline Slider with big value display and scale markers
const InlineSlider: React.FC<{
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  formatValue?: (v: number) => string;
  showScale?: boolean;
  scaleLabels?: string[];
}> = ({ min, max, value, onChange, unit = '', formatValue, showScale = false, scaleLabels }) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayValue = formatValue ? formatValue(value) : formatNumber(value);
  
  return (
    <div className="flex-1">
      <div className="px-2 mb-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
          }}
        />
        {showScale && scaleLabels && (
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {scaleLabels.map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Slider with preset chips
const SliderWithPresets: React.FC<{
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  formatValue?: (v: number) => string;
  presets?: number[];
  presetColor?: string;
}> = ({ min, max, value, onChange, unit = '', formatValue, presets = [], presetColor = 'amber' }) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayValue = formatValue ? formatValue(value) : value.toLocaleString();
  
  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };
  
  return (
    <div className="flex-1">
      {/* Preset chips */}
      {presets.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {presets.map((preset) => {
            const isSelected = Math.abs(value - preset) < (max - min) * 0.05; // Within 5% of preset
            const presetLabel = formatValue ? formatValue(preset) : preset >= 1000 ? `${preset / 1000}K` : preset.toString();
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? `bg-${presetColor}-500/20 border-2 border-${presetColor}-500 text-${presetColor}-300`
                    : 'bg-white/5 border border-white/20 text-gray-300 hover:border-purple-500/50'
                }`}
              >
                {presetLabel}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {}} // Custom handler
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/20 text-gray-300 hover:border-purple-500/50"
          >
            Custom
          </button>
        </div>
      )}
      
      <div className="px-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${percentage}%, #374151 ${percentage}%, #374151 100%)`
          }}
        />
      </div>
    </div>
  );
};

// Refined Stepper Input for numeric values
const StepperInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}> = ({ value, onChange, min = 0, max = 10000, step = 1, unit = '' }) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };
  
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };
  
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-10 h-10 rounded-l-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-all border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        −
      </button>
      <div className="h-10 px-4 bg-slate-900 border-y border-white/10 flex items-center justify-center min-w-[80px]">
        <span className="text-xl font-bold text-white">{value}</span>
        {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-10 h-10 rounded-r-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-lg transition-all shadow-lg shadow-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  );
};

// Chip Selector for presets
const ChipSelector: React.FC<{
  options: OptionItem[];
  value: string | number;
  onChange: (v: string | number) => void;
  showCustom?: boolean;
  onCustomClick?: () => void;
}> = ({ options, value, onChange, showCustom = false, onCustomClick }) => {
  const normalizedOptions = (options || []).map(normalizeOption);
  
  return (
    <div className="flex flex-wrap gap-2">
      {normalizedOptions.map((opt) => {
        const isSelected = String(value) === String(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              isSelected
                ? 'bg-purple-500/20 border-2 border-purple-500 text-white font-medium'
                : 'bg-white/5 border border-white/20 text-gray-300 hover:border-purple-500'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
      {showCustom && (
        <button
          type="button"
          onClick={onCustomClick}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/20 text-sm text-gray-300 hover:border-purple-500 transition-all"
        >
          Custom...
        </button>
      )}
    </div>
  );
};

// Simple Question Card - Always vertical stacked layout
const QuestionCard: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }> | string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  iconColor?: string;
}> = ({ icon: IconOrEmoji, title, subtitle, children, iconColor = 'from-purple-500 to-violet-600' }) => {
  const isEmoji = typeof IconOrEmoji === 'string';
  
  return (
    <div className="bg-slate-800/60 rounded-2xl p-5 border border-white/10 shadow-[0_0_0_1px_rgba(139,92,246,0.1),0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(139,92,246,0.3),0_8px_30px_rgba(139,92,246,0.15)] transition-all">
      {/* Header: Icon + Title + Subtitle */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {isEmoji ? (
            <span className="text-2xl">{IconOrEmoji}</span>
          ) : (
            <IconOrEmoji className="w-5 h-5 text-white" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      
      {/* Input/Options: Full width below */}
      <div className="w-full">{children}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const Step3FacilityDetails: React.FC<Step3Props> = ({
  selectedIndustry,
  industryName,
  useCaseData,
  onDataChange,
  onSolarConfigClick,
  onEVConfigClick,
  solarKW,
  evChargerCount,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showAdvancedQuestions, setShowAdvancedQuestions] = useState(false);

  // Check if this is a college/university use case
  const isCollegeUseCase = selectedIndustry?.toLowerCase().includes('college') || 
                          selectedIndustry?.toLowerCase().includes('university') ||
                          industryName?.toLowerCase().includes('college') ||
                          industryName?.toLowerCase().includes('university');

  // Handle preset selection - pre-fills all defaults
  const handlePresetSelect = (preset: CollegePreset) => {
    setSelectedPreset(preset.id);
    // Apply all preset defaults
    Object.entries(preset.defaults).forEach(([field, value]) => {
      onDataChange(field, value);
    });
  };

  // Load questions - try database first, fall back to hardcoded
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      console.log('📥 Step3: Loading questions for industry:', selectedIndustry);

      // Try database first via useCaseService.getUseCaseBySlug()
      if (selectedIndustry) {
        try {
          // The service returns DetailedUseCase with custom_questions included
          const useCaseData = await useCaseService.getUseCaseBySlug(selectedIndustry);
          console.log('📊 Database returned use case:', useCaseData?.name || 'null');
          
          // custom_questions is already transformed by getUseCaseBySlug
          // Format: { id, question, type, default, required, options, min, max, helpText }
          const dbQuestions = useCaseData?.custom_questions || (useCaseData as any)?.customQuestions;
          console.log('📊 Database returned:', dbQuestions?.length || 0, 'questions');

          if (dbQuestions && dbQuestions.length > 0) {
            // Transform from service format to Step3 Question format
            const transformed: Question[] = dbQuestions.map((q: any) => ({
              id: q.id || q.field_name,
              fieldName: q.id || q.field_name, // service uses 'id' which is field_name
              questionText: q.question || q.question_text,
              helpText: q.helpText || q.help_text,
              questionType: q.type || q.question_type || 'select',
              options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
              minValue: q.min ?? q.min_value,
              maxValue: q.max ?? q.max_value,
              defaultValue: q.default ?? q.default_value,
              unit: q.unit,
              isRequired: q.required ?? q.is_required,
              metadata: q.metadata || (q as any).metadata_json || {},
            }));
            console.log('✅ Step3: Loaded', transformed.length, 'questions from database for:', selectedIndustry);
            setQuestions(transformed);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn('❌ Database query failed, using fallback:', error);
        }
      }

      // Use industry-specific questions if available
      const industryKey = selectedIndustry?.toLowerCase().replace(/[^a-z]/g, '-') || '';
      const industryQuestions = INDUSTRY_QUESTIONS[industryKey];
      
      if (industryQuestions) {
        console.log('📋 Using industry-specific questions for:', industryKey);
        setQuestions(industryQuestions);
      } else {
        console.log('📋 Using generic fallback questions');
        setQuestions(FALLBACK_QUESTIONS);
      }
      
      setIsLoading(false);
    };

    loadQuestions();
  }, [selectedIndustry]);

  // Count answered questions
  const answeredCount = useMemo(() => {
    return questions.filter(q => {
      const value = useCaseData[q.fieldName];
      return value !== undefined && value !== '' && value !== null;
    }).length;
  }, [questions, useCaseData]);

  // Get advanced questions (for modal)
  // Only questions explicitly marked as advanced in metadata
  const advancedQuestions = useMemo(() => {
    return questions.filter(q => {
      const metadata = (q as any).metadata;
      return metadata?.is_advanced === true;
    });
  }, [questions]);

  // Filter questions based on conditional display rules (showWhen)
  // Also exclude solar/EV fields that are handled via popup modals
  // Exclude advanced questions (shown in modal instead)
  // Remove duplicates by fieldName
  const visibleQuestions = useMemo(() => {
    const filtered = questions.filter(q => {
      // Exclude solar/EV fields - these are handled by popup modals
      if (POPUP_MODAL_FIELDS.includes(q.fieldName)) {
        return false;
      }
      
      // Exclude advanced questions (shown in Advanced Questions modal)
      const metadata = (q as any).metadata;
      if (metadata?.is_advanced === true) {
        return false;
      }
      
      // Note: meetingSpace and parking are now essential questions, not advanced
      
      // Check if options has showWhen condition
      const opts = q.options;
      if (!opts || typeof opts !== 'object') return true;
      
      // If it's an array (select options), always show
      if (Array.isArray(opts)) return true;
      
      // Check for showWhen condition in options object
      const showWhen = (opts as any).showWhen;
      if (!showWhen || showWhen === 'always') return true;
      
      // Handle conditional display
      if (typeof showWhen === 'object') {
        const { field, equals } = showWhen;
        if (!field) return true;
        
        const currentValue = useCaseData[field];
        
        // Handle boolean comparison (toggle fields store 'true'/'false' strings)
        if (typeof equals === 'boolean') {
          const boolValue = currentValue === true || currentValue === 'true';
          return boolValue === equals;
        }
        
        return currentValue === equals;
      }
      
      return true;
    });
    
    // Remove duplicates by fieldName (keep first occurrence)
    const seen = new Set<string>();
    return filtered.filter(q => {
      if (seen.has(q.fieldName)) {
        return false;
      }
      seen.add(q.fieldName);
      return true;
    });
  }, [questions, useCaseData]);

  // Get icon and color based on field name
  const getIconAndColor = (fieldName: string) => {
    const field = fieldName.toLowerCase();
    if (field.includes('square') || field.includes('size') || field.includes('footage')) {
      return { icon: '📐', color: 'from-amber-500 to-orange-500' };
    }
    if (field.includes('peak') || field.includes('power') || field.includes('demand')) {
      return { icon: '⚡', color: 'from-pink-500 to-rose-500' };
    }
    if (field.includes('hour') || field.includes('time') || field.includes('operating')) {
      return { icon: '⏰', color: 'from-blue-500 to-indigo-600' };
    }
    if (field.includes('solar')) {
      return { icon: '☀️', color: 'from-orange-500 to-amber-500' };
    }
    if (field.includes('ev') || field.includes('charger')) {
      return { icon: '🔌', color: 'from-emerald-500 to-teal-500' };
    }
    if (field.includes('backup') || field.includes('critical')) {
      return { icon: '🛡️', color: 'from-purple-500 to-violet-600' };
    }
    if (field.includes('room') || field.includes('bay') || field.includes('port')) {
      return { icon: '🚿', color: 'from-purple-500 to-violet-600' };
    }
    if (field.includes('occupan') || field.includes('people') || field.includes('guest')) {
      return { icon: '👥', color: 'from-cyan-500 to-blue-500' };
    }
    if (field.includes('vehicle') || field.includes('car') || field.includes('count')) {
      return { icon: '🚗', color: 'from-cyan-500 to-blue-500' };
    }
    if (field.includes('dryer') || field.includes('blower')) {
      return { icon: '💨', color: 'from-blue-500 to-cyan-500' };
    }
    if (field.includes('vacuum')) {
      return { icon: '🌀', color: 'from-emerald-500 to-teal-500' };
    }
    if (field.includes('equipment')) {
      return { icon: '⚙️', color: 'from-slate-500 to-gray-500' };
    }
    return { icon: '🏢', color: 'from-purple-500 to-violet-600' };
  };

  // Render the appropriate input type - COMPACT VERSION
  const renderInput = (question: Question) => {
    const value = useCaseData[question.fieldName];
    const options = question.options || [];
    const optionCount = Array.isArray(options) ? options.length : 0;
    const fieldName = question.fieldName.toLowerCase();
    
    switch (question.questionType) {
      case 'select':
      case 'dropdown':
      case 'compound':
        // Special cases: Use buttons instead of dropdown for these questions
        if (fieldName === 'hotelcategory' || fieldName === 'hotel_category' || 
            fieldName === 'elevatorcount' || fieldName === 'elevator_count' ||
            fieldName === 'foodbeverage' || fieldName === 'food_beverage') {
          // For compound questions (like foodBeverage), handle multiselect
          if (question.questionType === 'compound') {
            const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
            return (
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const normalized = normalizeOption(opt);
                  const isSelected = selectedValues.includes(normalized.value);
                  return (
                    <button
                      key={normalized.value}
                      type="button"
                      onClick={() => {
                        const newValues = isSelected
                          ? selectedValues.filter((v: string) => v !== normalized.value)
                          : [...selectedValues, normalized.value];
                        onDataChange(question.fieldName, newValues);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600/30 to-violet-600/30 border-2 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/60 border-2 border-white/10 text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/10'
                      }`}
                    >
                      {normalized.label}
                    </button>
                  );
                })}
              </div>
            );
          }
          
          // For single-select questions (elevatorCount, hotelCategory)
          return (
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const normalized = normalizeOption(opt);
                const isSelected = String(value || '') === String(normalized.value);
                return (
                  <button
                    key={normalized.value}
                    type="button"
                    onClick={() => onDataChange(question.fieldName, normalized.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600/30 to-violet-600/30 border-2 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800/60 border-2 border-white/10 text-gray-300 hover:border-purple-500/50 hover:bg-purple-500/10'
                    }`}
                  >
                    {normalized.label}
                  </button>
                );
              })}
            </div>
          );
        }
        
        // Check if this is a numeric question that should use slider
        const isNumericQuestion = fieldName.includes('square') || 
                                 fieldName.includes('footage') || 
                                 fieldName.includes('grid') || 
                                 fieldName.includes('connection') || 
                                 fieldName.includes('kw') ||
                                 fieldName.includes('vehicle') || 
                                 fieldName.includes('throughput') ||
                                 fieldName.includes('daily');
        
        // If it's a numeric question with min/max, use slider
        if (isNumericQuestion && question.minValue !== undefined && question.maxValue !== undefined) {
          const numericValue = typeof value === 'number' ? value : (value ?? question.defaultValue ?? question.minValue ?? 0);
          let presets: number[] | undefined;
          if (fieldName.includes('square') || fieldName.includes('footage')) {
            presets = [5000, 10000, 25000, 50000, 100000];
          } else if (fieldName.includes('grid') || fieldName.includes('connection') || fieldName.includes('kw')) {
            presets = [50, 100, 200, 500, 1000];
          } else if (fieldName.includes('vehicle') || fieldName.includes('throughput') || fieldName.includes('daily')) {
            presets = [100, 250, 500, 1000, 2000];
          }
          
        return (
            <SliderWithValue
              min={question.minValue || 0}
              max={question.maxValue || 1000}
              value={Number(numericValue)}
              onChange={(v) => onDataChange(question.fieldName, v)}
              unit={question.unit}
              presets={presets?.filter(p => p >= (question.minValue || 0) && p <= (question.maxValue || 1000))}
              formatValue={formatNumber}
            />
          );
        }
        
        // Use dropdown only for 6+ options, otherwise use visual preset cards
        if (optionCount >= 6) {
          return (
            <CompactDropdown
              options={options}
            value={value || ''}
            onChange={(v) => onDataChange(question.fieldName, v)}
          />
        );
        } else if (optionCount >= 3) {
          return (
            <VisualPresetCards
              options={options}
              value={value || ''}
              onChange={(v) => onDataChange(question.fieldName, v)}
            />
          );
        } else {
          return (
            <CompactToggle
              options={options}
              value={value || ''}
              onChange={(v) => onDataChange(question.fieldName, v)}
            />
          );
        }
        
      case 'toggle':
        // For 2 options, use toggle; for 3-5, use visual preset cards
        if (optionCount === 2) {
        return (
            <CompactToggle
              options={options}
            value={value || ''}
            onChange={(v) => onDataChange(question.fieldName, v)}
          />
        );
        } else {
          return (
            <VisualPresetCards
              options={options}
              value={value || ''}
              onChange={(v) => onDataChange(question.fieldName, v)}
            />
          );
        }
      
      case 'multiselect':
        // Render as checkbox chips
        return (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const normalized = normalizeOption(opt);
              const selectedValues = Array.isArray(value) ? value : [];
              const isSelected = selectedValues.includes(normalized.value);
              
              return (
                <button
                  key={normalized.value}
                  type="button"
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v: string) => v !== normalized.value)
                      : [...selectedValues, normalized.value];
                    onDataChange(question.fieldName, newValues);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-purple-500/20 border-2 border-purple-500 text-white font-medium'
                      : 'bg-white/5 border border-white/20 text-gray-300 hover:border-purple-500'
                  }`}
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                    isSelected ? 'bg-purple-500' : 'border border-white/30'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  {normalized.label}
                </button>
              );
            })}
          </div>
        );
        
      case 'slider':
      case 'number':
        // Use SliderWithValue for numeric questions
        const numericValue = typeof value === 'number' ? value : (value ?? question.defaultValue ?? question.minValue ?? 0);
        
        // Determine presets based on field type
        let presets: number[] | undefined;
        if (fieldName.includes('square') || fieldName.includes('footage') || fieldName.includes('size')) {
          presets = [5000, 10000, 25000, 50000, 100000];
        } else if (fieldName.includes('grid') || fieldName.includes('connection') || fieldName.includes('kw')) {
          presets = [50, 100, 200, 500, 1000];
        } else if (fieldName.includes('vehicle') || fieldName.includes('throughput') || fieldName.includes('daily')) {
          presets = [100, 250, 500, 1000, 2000];
        }
        
        return (
          <SliderWithValue
            min={question.minValue || 0}
            max={question.maxValue || 1000}
            value={Number(numericValue)}
            onChange={(v) => onDataChange(question.fieldName, v)}
            unit={question.unit}
            presets={presets?.filter(p => p >= (question.minValue || 0) && p <= (question.maxValue || 1000))}
            formatValue={formatNumber}
          />
        );
        
        
      case 'yes_no':
      case 'boolean':
        return (
          <CompactToggle
            options={['Yes', 'No']}
            value={value === true || value === 'true' ? 'Yes' : value === false || value === 'false' ? 'No' : ''}
            onChange={(v) => onDataChange(question.fieldName, v === 'Yes' ? true : false)}
          />
        );
      
      default:
        // Default to visual preset cards for 3-5 options, dropdown for 6+
        if (optionCount >= 6) {
        return (
            <CompactDropdown
              options={options}
            value={value || ''}
            onChange={(v) => onDataChange(question.fieldName, v)}
          />
        );
        } else if (optionCount >= 3) {
        return (
            <VisualPresetCards
              options={options}
              value={value || ''}
              onChange={(v) => onDataChange(question.fieldName, v)}
            />
          );
        } else {
          return (
            <CompactToggle
              options={options}
            value={value || ''}
            onChange={(v) => onDataChange(question.fieldName, v)}
          />
        );
        }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  const progressWidth = visibleQuestions.length > 0 ? (answeredCount / visibleQuestions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-8 w-full min-h-0">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Tell us about your {industryName || 'Facility'}
        </h1>
        <p className="text-white/60">
          These details help us recommend the perfect system size
        </p>
        <p className="text-white/40 text-sm mt-2">
          {answeredCount} of {visibleQuestions.length} questions answered
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="ml-3 text-white/60">Loading questions...</span>
        </div>
      ) : (
        <>
          {/* College Institution Size Presets */}
          {isCollegeUseCase && (
            <div className="mb-6 p-5 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-violet-500/15 rounded-2xl border border-indigo-400/30">
              <h3 className="text-white text-base font-semibold mb-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Quick Setup: What size is your institution?
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Select your institution size to pre-fill typical values. You can adjust any answers below.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COLLEGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedPreset === preset.id
                        ? 'bg-indigo-500/30 border-2 border-indigo-400 ring-2 ring-indigo-400/30'
                        : 'bg-white/5 border border-white/10 hover:bg-indigo-500/10 hover:border-indigo-400/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">{preset.icon}</div>
                    <div className={`font-semibold text-sm ${selectedPreset === preset.id ? 'text-indigo-300' : 'text-white'}`}>
                      {preset.label}
                    </div>
                    <div className="text-xs text-white/50 mt-1">{preset.studentRange}</div>
                    <div className="text-xs text-white/40 mt-0.5">{preset.description}</div>
                    {selectedPreset === preset.id && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-indigo-300">
                        <Check className="w-3 h-3" />
                        Applied
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Power Boosters Panel - Solar & EV Cards */}
          {(onSolarConfigClick || onEVConfigClick) && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-300">⚡ Power Boosters (Click to Configure)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Solar Card */}
                {onSolarConfigClick && (
                  <div 
                    className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                    onClick={onSolarConfigClick}
                  >
                    {/* Orange gradient header */}
                    <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Sun className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Add Solar</h3>
                            <p className="text-orange-100 text-sm flex items-center gap-1">
                              <span>⭐</span> Very Good Potential
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    
                    {/* Stats row */}
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-5 py-4 grid grid-cols-3 gap-3 border-x border-slate-700">
                      <div className="text-center">
                        <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>⚡</span> Peak Sun
                        </div>
                        <div className="text-2xl font-bold text-white">5.0</div>
                        <div className="text-xs text-gray-400">hrs/day</div>
                      </div>
                      <div className="text-center border-x border-slate-700">
                        <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>🏆</span> Rating
                        </div>
                        <div className="text-lg font-bold text-white">Very Good</div>
                        <div className="text-xs text-emerald-400">Great for solar!</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>💰</span> Rate
                        </div>
                        <div className="text-2xl font-bold text-white">$0.10</div>
                        <div className="text-xs text-gray-400">per kWh</div>
                      </div>
                    </div>
                    
                    {/* Bottom section */}
                    <div className="bg-slate-900 px-5 py-4 border-x border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                      {solarKW && solarKW > 0 ? (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-emerald-400 text-sm font-medium">Configured</div>
                                <div className="text-white font-bold">{solarKW.toLocaleString()} kW Rooftop</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                <Sun className="w-5 h-5 text-gray-400" />
                    </div>
                              <div>
                                <div className="text-gray-400 text-sm">Future-proof your facility</div>
                                <div className="text-white font-medium">BESS optimizes solar savings</div>
                              </div>
                            </>
                          )}
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all shadow-lg shadow-orange-500/30">
                          {solarKW && solarKW > 0 ? 'Edit →' : 'Configure →'}
                  </button>
                      </div>
                    </div>
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-orange-500/0 group-hover:ring-orange-500/50 transition-all pointer-events-none"></div>
                  </div>
                )}

                {/* EV Chargers Card */}
                {onEVConfigClick && (
                  <div 
                    className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                    onClick={onEVConfigClick}
                  >
                    {/* Teal/Emerald gradient header */}
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <PlugZap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Add EV Chargers</h3>
                            <p className="text-emerald-100 text-sm flex items-center gap-1">
                              <span>⚡</span> Level 2 & DC Fast Charging
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    
                    {/* Stats row */}
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-5 py-4 grid grid-cols-3 gap-3 border-x border-slate-700">
                      <div className="text-center">
                        <div className="text-cyan-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>⚡</span> Peak Rate
                        </div>
                        <div className="text-2xl font-bold text-white">$0.14</div>
                        <div className="text-xs text-gray-400">per kWh</div>
                      </div>
                      <div className="text-center border-x border-slate-700">
                        <div className="text-cyan-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>🌙</span> Off-Peak
                        </div>
                        <div className="text-2xl font-bold text-white">$0.08</div>
                        <div className="text-xs text-emerald-400">Save 43%!</div>
                      </div>
                      <div className="text-center">
                        <div className="text-cyan-400 text-xs font-medium mb-1 flex items-center justify-center gap-1">
                          <span>⏰</span> Peak Hrs
                        </div>
                        <div className="text-lg font-bold text-white">1-7 PM</div>
                        <div className="text-xs text-gray-400">weekdays</div>
                      </div>
                    </div>
                    
                    {/* Bottom section */}
                    <div className="bg-slate-900 px-5 py-4 border-x border-b border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                      {evChargerCount && evChargerCount > 0 ? (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                <div className="text-emerald-400 text-sm font-medium">Configured</div>
                                <div className="text-white font-bold">{evChargerCount} Chargers</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                <PlugZap className="w-5 h-5 text-gray-400" />
                    </div>
                              <div>
                                <div className="text-gray-400 text-sm">Future-proof your facility</div>
                                <div className="text-white font-medium">BESS optimizes charging costs</div>
                              </div>
                            </>
                          )}
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/30">
                          {evChargerCount && evChargerCount > 0 ? 'Edit →' : 'Configure →'}
                  </button>
              </div>
                    </div>
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/50 transition-all pointer-events-none"></div>
            </div>
                )}
              </div>
            </section>
          )}

          {/* Questions - Compact Layout */}
          {visibleQuestions.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-white/10">
              <p className="text-white/60">No questions available.</p>
              <p className="text-white/40 text-sm mt-2">You can continue to the next step.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleQuestions.map((question) => {
                const { icon, color } = getIconAndColor(question.fieldName);
                
                return (
                  <QuestionCard
                    key={question.id}
                    icon={icon}
                    title={question.questionText}
                    subtitle={question.helpText}
                    iconColor={color}
                  >
                    {renderInput(question)}
                  </QuestionCard>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* Progress indicator */}
      <div className="mt-8 bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Progress</span>
          <span className="text-white font-medium">{answeredCount}/{visibleQuestions.length}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      {/* Advanced Questions Modal */}
      <AdvancedQuestionsModal
        isOpen={showAdvancedQuestions}
        onClose={() => setShowAdvancedQuestions(false)}
        questions={questions}
        useCaseData={useCaseData}
        onDataChange={onDataChange}
        industryName={industryName}
      />
    </div>
  );
};

export default Step3FacilityDetails;
