/**
 * STEP 3: FACILITY DETAILS
 * =========================
 * 
 * December 18, 2025 - COMPLETE REDESIGN
 * 
 * DESIGN PHILOSOPHY (Steve Jobs inspired):
 * - Self-evident UI - questions flow naturally
 * - Merlin guides with educational hints
 * - Summary bar shows progress + live estimates
 * - Visual answer cards, not form fields
 * - Instant feedback as they answer
 * 
 * CAPTURES:
 * - Facility subtype (economy hotel vs luxury, etc.)
 * - Key sizing question (rooms, bays, sqft)
 * - Industry-specific amenities/features
 * - Equipment tier preference
 * 
 * DISPLAYS:
 * - Estimated peak demand (updates live)
 * - Comparison to industry average
 * - Merlin's insight about their configuration
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CheckCircle, Building2, Zap, Battery,
  Sparkles, Star, Info, Settings, TrendingUp, Home, Gauge, Target,
  // Common amenity icons
  Waves, Dumbbell, Utensils, Coffee, Users, Car, Sun, Plug,
  ShoppingBag, Briefcase, Shirt, Wine, ChefHat, ParkingCircle,
  CircleOff, Award, Leaf, ShieldCheck, Banknote, Clock,
  TrendingDown, Presentation, Building, Minus, Plus
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { FACILITY_SUBTYPES } from '../constants/wizardConstants';
import { getStepColors } from '../constants/stepColors';
import { MerlinHat } from '../MerlinHat';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// TYPES
// ============================================

interface Step3FacilityDetailsProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  initializedFromVertical?: boolean;
  onBack: () => void;
  onHome?: () => void;
  onContinue: () => void;
  sectionRef?: React.RefObject<HTMLDivElement> | ((el: HTMLDivElement | null) => void);
  isHidden?: boolean;
}

// ============================================
// ICON MAPPING - for visual answer cards
// ============================================

const OPTION_ICONS: Record<string, React.ElementType> = {
  // Pool & Spa
  pool: Waves, indoor_pool: Waves, outdoor_pool: Waves, hot_tub: Waves, spa: Sparkles,
  // Fitness & Business
  fitness: Dumbbell, gym: Dumbbell, business_center: Briefcase,
  // F&B
  restaurant: Utensils, breakfast: Coffee, bar: Wine, room_service: ChefHat, 
  casual_dining: Utensils, fine_dining: ChefHat, banquet: Users,
  // Meeting
  meeting_small: Users, meeting_medium: Presentation, ballroom: Building,
  small: Users, medium: Presentation, large: Building, convention: Building,
  // Parking & EV
  parking: ParkingCircle, surface: Car, structure: ParkingCircle, valet: Car,
  ev_charging: Plug, level2: Plug, dcfc: Zap,
  // Solar
  solar: Sun, solar_yes: Sun, solar_no: CircleOff, exploring: Sun,
  // Goals
  reduce_costs: Banknote, sustainability: Leaf, backup_power: ShieldCheck,
  demand_management: TrendingDown, peak_shaving: Gauge, energy_arbitrage: TrendingUp,
  // Equipment
  retail: ShoppingBag, laundry: Shirt,
  // Generic
  none: CircleOff, no: CircleOff, yes: CheckCircle, standard: Building2, premium: Star,
};

// ============================================
// INDUSTRY-SPECIFIC MESSAGING
// ============================================

interface IndustryInsight {
  intro: string;
  sizeHint: string;
  amenityHint: string;
  savingsTeaser: string;
}

const INDUSTRY_INSIGHTS: Record<string, IndustryInsight> = {
  'hotel': {
    intro: "Hotels are excellent candidates for BESS! With HVAC running 24/7, pool pumps, and laundry, demand charges can be brutal.",
    sizeHint: "Room count is the #1 driver of your peak demand. More rooms = more savings potential!",
    amenityHint: "Pools and restaurants can add 30-50 kW to peak demand. Select all that apply.",
    savingsTeaser: "Hotels typically save $150-400 per room annually with the right BESS system.",
  },
  'car-wash': {
    intro: "Car washes have some of the highest demand spikes in commercial! Blowers and pumps create perfect peak-shaving opportunities.",
    sizeHint: "Each bay adds significant demand. Tunnel washes have different profiles than in-bay automatics.",
    amenityHint: "Vacuums, detail bays, and water recycling all affect your peak demand profile.",
    savingsTeaser: "Car washes typically reduce demand charges by 35-50% with battery storage.",
  },
  'ev-charging': {
    intro: "EV charging creates massive demand spikes. BESS can buffer these peaks and enable more chargers without utility upgrades!",
    sizeHint: "The mix of Level 2 vs DC Fast Chargers dramatically affects peak demand.",
    amenityHint: "On-site amenities keep drivers engaged while charging and can share the BESS system.",
    savingsTeaser: "EV stations typically save 40-60% on demand charges with smart BESS integration.",
  },
  'manufacturing': {
    intro: "Manufacturing has predictable load profiles—perfect for peak shaving. The right system can also provide critical backup.",
    sizeHint: "Square footage combined with your shift pattern determines base load requirements.",
    amenityHint: "CNC machines, compressors, and HVAC all contribute to demand peaks at shift changes.",
    savingsTeaser: "Manufacturing facilities typically see 25-40% demand charge reduction.",
  },
  'retail': {
    intro: "Retail peaks during business hours with HVAC and lighting. Battery storage keeps you running during outages too!",
    sizeHint: "Store size and refrigeration needs are the biggest drivers of your demand profile.",
    amenityHint: "Refrigerated cases, bakery ovens, and EV charging can add significant peak demand.",
    savingsTeaser: "Retail stores typically save $8-15 per square foot annually on energy.",
  },
  'default': {
    intro: "Every business can benefit from energy storage. Let me analyze your specific facility to find savings.",
    sizeHint: "Facility size helps us estimate your baseline power requirements.",
    amenityHint: "Select all features that apply—each one helps refine our sizing recommendations.",
    savingsTeaser: "Most commercial facilities see 20-35% demand charge reduction with BESS.",
  },
};

// ============================================
// SUMMARY BAR COMPONENT
// ============================================

interface SummaryBarProps {
  state: string;
  industry: string;
  estimatedKW: number;
  answeredQuestions: number;
  totalQuestions: number;
}

const SummaryBar: React.FC<SummaryBarProps> = ({ 
  state, industry, estimatedKW, answeredQuestions, totalQuestions 
}) => {
  return (
    <div className="bg-gradient-to-r from-[#6700b6]/30 via-[#060F76]/30 to-[#68BFFA]/30 rounded-2xl p-4 border border-[#68BFFA]/50 mb-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
        {/* Location */}
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#68BFFA]" />
          <span className="text-white/80 text-sm">{state}</span>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* Industry */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">{industry}</span>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* Estimated Peak */}
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-amber-300 font-bold">{estimatedKW.toLocaleString()} kW</span>
          <span className="text-white/50 text-sm">est. peak</span>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-white/20" />
        
        {/* Progress */}
        <div className="flex items-center gap-2">
          <Battery className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 font-semibold">{answeredQuestions}/{totalQuestions}</span>
          <span className="text-white/50 text-sm">questions</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export function Step3FacilityDetails({
  wizardState,
  setWizardState,
  initializedFromVertical = false,
  onBack,
  onHome,
  onContinue,
  sectionRef,
  isHidden = false,
}: Step3FacilityDetailsProps) {
  
  // Get step colors for visual progression (Step 2 = cool blue)
  const stepColors = getStepColors(2);
  
  // Filter questions - exclude grid/EV handled elsewhere
  const excludedFields = [
    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
    'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
    'wantsSolar', 'hasEVCharging', 'evChargerCount', 'existingEVChargers', 
    'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
  ];
  
  const filteredQuestions = wizardState.customQuestions.filter(
    (q: any) => !excludedFields.includes(q.field_name)
  );
  
  // Get industry insights
  const insights = INDUSTRY_INSIGHTS[wizardState.selectedIndustry] || INDUSTRY_INSIGHTS['default'];
  
  // Get subtypes for this industry
  const subtypes = FACILITY_SUBTYPES[wizardState.selectedIndustry] || FACILITY_SUBTYPES['default'];
  const hasSubtypes = subtypes.length > 1 || subtypes[0]?.id !== 'standard';
  
  // Calculate answered questions (equipment tier removed for simplification)
  const answeredCount = useMemo(() => {
    let count = 0;
    if (wizardState.facilitySubtype && hasSubtypes) count++;
    filteredQuestions.forEach((q: any) => {
      const value = wizardState.useCaseData[q.field_name];
      if (value !== undefined && value !== null && value !== '') count++;
    });
    return count;
  }, [wizardState, filteredQuestions, hasSubtypes]);
  
  const totalQuestions = (hasSubtypes ? 1 : 0) + filteredQuestions.length; // subtype + questions (tier removed)
  
  // Estimate peak kW based on current inputs
  const estimatedKW = useMemo(() => {
    const industry = wizardState.selectedIndustry;
    const data = wizardState.useCaseData;
    
    // Industry-specific estimation
    if (industry === 'hotel') {
      const rooms = data.roomCount || 100;
      return Math.round(rooms * 0.45 + 25); // ~45W per room + base
    }
    if (industry === 'car-wash') {
      const bays = data.bayCount || 4;
      return Math.round(bays * 30 + 15); // ~30kW per bay + base
    }
    if (industry === 'ev-charging') {
      const ports = data.evChargerCount || 10;
      return Math.round(ports * 50); // Mix of L2 + DCFC
    }
    if (industry === 'manufacturing' || industry === 'warehouse') {
      const sqft = data.squareFootage || 50000;
      return Math.round(sqft * 0.012);
    }
    if (industry === 'retail' || industry === 'office') {
      const sqft = data.squareFootage || 15000;
      return Math.round(sqft * 0.01);
    }
    if (industry === 'hospital') {
      const beds = data.bedCount || 100;
      return Math.round(beds * 5 + 200);
    }
    if (industry === 'data-center') {
      const itLoad = data.itLoadKW || 500;
      return Math.round(itLoad * 1.5);
    }
    
    // Default
    return Math.round((data.squareFootage || 25000) * 0.01);
  }, [wizardState.selectedIndustry, wizardState.useCaseData]);
  
  // Check if form is valid
  const isFormValid = useMemo(() => {
    // Check required questions have answers
    const hasRequiredAnswers = !filteredQuestions.some((q: any) => {
      if (!q.is_required) return false;
      const value = wizardState.useCaseData[q.field_name];
      const hasValue = value !== undefined && value !== null && value !== '';
      const hasDefault = q.default_value !== undefined && q.default_value !== null && q.default_value !== '';
      return !hasValue && !hasDefault;
    });
    return hasRequiredAnswers;
  }, [filteredQuestions, wizardState.useCaseData]);
  
  // Get Merlin's dynamic message
  const getMerlinMessage = () => {
    if (answeredCount === 0) {
      return insights.intro;
    }
    if (answeredCount < totalQuestions / 2) {
      return `Great start! ${insights.sizeHint}`;
    }
    if (answeredCount < totalQuestions) {
      return `Almost there! ${insights.amenityHint}`;
    }
    return `Perfect! Based on your inputs, I'm estimating ~${estimatedKW.toLocaleString()} kW peak demand. ${insights.savingsTeaser}`;
  };
  
  // Get industry-specific BESS recommendation
  const getBESSRecommendation = () => {
    const industry = wizardState.selectedIndustry?.toLowerCase() || '';
    const recommendations: Record<string, { sizing: string; application: string; tip: string }> = {
      'casino': { 
        sizing: '2-5 MW / 8-20 MWh', 
        application: 'Peak shaving + Backup power',
        tip: 'Casinos operate 24/7 with high, consistent loads—BESS helps reduce demand charges by 20-40%'
      },
      'hotel': { 
        sizing: '0.5-2 MW / 2-8 MWh', 
        application: 'Peak shaving + Demand response',
        tip: 'Hotels see peak demand during check-in hours and HVAC ramp-up—BESS smooths these spikes'
      },
      'hospital': { 
        sizing: '1-5 MW / 4-20 MWh', 
        application: 'Backup power + Peak shaving',
        tip: 'Hospitals require 100% uptime—BESS provides instant backup before generators kick in'
      },
      'data-center': { 
        sizing: '2-10 MW / 8-40 MWh', 
        application: 'UPS replacement + Peak shaving',
        tip: 'Data centers benefit from BESS as a UPS replacement with added peak shaving revenue'
      },
      'manufacturing': { 
        sizing: '1-10 MW / 4-40 MWh', 
        application: 'Peak shaving + Power quality',
        tip: 'Manufacturing sees sharp demand spikes from motor startups—BESS provides instant response'
      },
      'ev-charging': { 
        sizing: '0.5-5 MW / 2-20 MWh', 
        application: 'Peak shaving + Grid buffering',
        tip: 'EV charging creates extreme demand spikes—BESS can reduce demand charges by 50-70%'
      },
      'car-wash': { 
        sizing: '100-500 kW / 200-1000 kWh', 
        application: 'Peak shaving + Motor smoothing',
        tip: 'Car washes have short, intense motor cycles—BESS smooths these for consistent grid draw'
      },
      'warehouse': { 
        sizing: '0.5-2 MW / 2-8 MWh', 
        application: 'Peak shaving + Solar integration',
        tip: 'Large rooftops = solar opportunity. BESS stores excess generation for evening use'
      },
      'retail': { 
        sizing: '0.2-1 MW / 0.8-4 MWh', 
        application: 'Peak shaving + Backup lighting',
        tip: 'Retail sees peaks during business hours—BESS reduces demand charges while providing backup'
      },
      'office': { 
        sizing: '0.3-2 MW / 1-8 MWh', 
        application: 'Peak shaving + Demand response',
        tip: 'Office buildings peak mid-afternoon with HVAC—BESS shaves these predictable peaks'
      },
      'airport': { 
        sizing: '5-20 MW / 20-80 MWh', 
        application: 'Peak shaving + Critical backup',
        tip: 'Airports need instant backup for critical systems—BESS bridges until generators start'
      }
    };
    // Find matching industry
    for (const [key, value] of Object.entries(recommendations)) {
      if (industry.includes(key)) return value;
    }
    // Default recommendation
    return { 
      sizing: '0.5-2 MW / 2-8 MWh', 
      application: 'Peak shaving + Backup power',
      tip: 'BESS helps reduce demand charges and provides backup power during outages'
    };
  };
  
  const bessRec = getBESSRecommendation();
  
  // Render a question based on type
  const renderQuestion = (question: any, index: number) => {
    const value = wizardState.useCaseData[question.field_name];
    const isBESSQuestion = question.field_name === 'primaryBESSApplication';
    
    // Get color accent based on field type
    const getFieldAccent = () => {
      if (isBESSQuestion) return { bg: 'from-emerald-500 to-teal-500', text: 'text-emerald-700', border: 'border-emerald-300' };
      if (question.field_name.includes('amenities') || question.field_name.includes('pool')) 
        return { bg: 'from-cyan-500 to-blue-500', text: 'text-cyan-700', border: 'border-cyan-300' };
      if (question.field_name.includes('food') || question.field_name.includes('dining')) 
        return { bg: 'from-orange-500 to-amber-500', text: 'text-orange-700', border: 'border-orange-300' };
      if (question.field_name.includes('goal') || question.field_name.includes('priority')) 
        return { bg: 'from-purple-500 to-violet-500', text: 'text-purple-700', border: 'border-purple-300' };
      return { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-700', border: 'border-blue-200' };
    };
    
    const accent = getFieldAccent();
    
    // NUMBER INPUT
    if (question.question_type === 'number') {
      const numValue = value ?? question.default_value ?? 0;
      const step = question.max_value > 1000 ? 100 : question.max_value > 100 ? 10 : 1;
      
      return (
        <div key={question.field_name} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center flex-shrink-0`}>
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold ${accent.text} mb-1`}>
                {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              {question.help_text && (
                <p className="text-sm text-gray-500 mb-3">{question.help_text}</p>
              )}
              
              {/* Stepper Input */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const newVal = Math.max(question.min_value || 0, (numValue as number) - step);
                    setWizardState(prev => ({
                      ...prev,
                      useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
                    }));
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="number"
                  value={numValue}
                  onChange={(e) => {
                    setWizardState(prev => ({
                      ...prev,
                      useCaseData: { ...prev.useCaseData, [question.field_name]: parseFloat(e.target.value) || 0 }
                    }));
                  }}
                  className={`w-28 px-4 py-2 text-center text-xl font-bold rounded-xl border-2 ${accent.border} focus:ring-2 focus:ring-blue-300 outline-none`}
                />
                <button
                  onClick={() => {
                    const newVal = Math.min(question.max_value || 99999, (numValue as number) + step);
                    setWizardState(prev => ({
                      ...prev,
                      useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
                    }));
                  }}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
                {question.max_value && (
                  <span className="text-sm text-gray-400">max {question.max_value.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // SELECT / DROPDOWN
    if (question.question_type === 'select') {
      const options = question.options || [];
      
      return (
        <div key={question.field_name} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center flex-shrink-0`}>
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold ${accent.text}`}>
                {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              {question.help_text && (
                <p className="text-sm text-gray-500">{question.help_text}</p>
              )}
            </div>
          </div>
          
          {/* Visual option cards - 2 column grid */}
          <div className="grid grid-cols-2 gap-2">
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = value === optValue;
              const Icon = OPTION_ICONS[optValue.toLowerCase().replace(/[-\s]/g, '_')] || Building2;
              
              return (
                <button
                  key={optValue}
                  onClick={() => {
                    setWizardState(prev => ({
                      ...prev,
                      useCaseData: { ...prev.useCaseData, [question.field_name]: optValue }
                    }));
                  }}
                  className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? `bg-gradient-to-br ${accent.bg} text-white shadow-md`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">{optLabel}</span>
                  {isSelected && <CheckCircle className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    
    // MULTI-SELECT (checkboxes as cards)
    if (question.question_type === 'multi-select' || question.question_type === 'checkbox') {
      const options = question.options || [];
      const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
      
      return (
        <div key={question.field_name} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center flex-shrink-0`}>
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold ${accent.text}`}>
                {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              {question.help_text && (
                <p className="text-sm text-gray-500">{question.help_text}</p>
              )}
            </div>
          </div>
          
          {/* Multi-select grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = selectedValues.includes(optValue);
              const Icon = OPTION_ICONS[optValue.toLowerCase().replace(/[-\s]/g, '_')] || Star;
              
              return (
                <button
                  key={optValue}
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter((v: string) => v !== optValue)
                      : [...selectedValues, optValue];
                    setWizardState(prev => ({
                      ...prev,
                      useCaseData: { ...prev.useCaseData, [question.field_name]: newValues }
                    }));
                  }}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${accent.bg} text-white shadow-md`
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  <span className="font-medium text-xs block">{optLabel}</span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    
    // SLIDER (range)
    if (question.question_type === 'slider' || question.question_type === 'range') {
      const numValue = value ?? question.default_value ?? question.min_value ?? 0;
      
      return (
        <div key={question.field_name} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center flex-shrink-0`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className={`font-bold ${accent.text}`}>
                {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              {question.help_text && (
                <p className="text-sm text-gray-500">{question.help_text}</p>
              )}
            </div>
            <div className={`text-2xl font-bold ${accent.text}`}>
              {(numValue as number).toLocaleString()}
            </div>
          </div>
          
          <input
            type="range"
            min={question.min_value || 0}
            max={question.max_value || 100}
            step={question.step || 1}
            value={numValue as number}
            onChange={(e) => {
              setWizardState(prev => ({
                ...prev,
                useCaseData: { ...prev.useCaseData, [question.field_name]: parseInt(e.target.value) }
              }));
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{(question.min_value || 0).toLocaleString()}</span>
            <span>{(question.max_value || 100).toLocaleString()}</span>
          </div>
        </div>
      );
    }
    
    // TEXT INPUT (fallback)
    return (
      <div key={question.field_name} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent.bg} flex items-center justify-center flex-shrink-0`}>
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className={`font-bold ${accent.text} mb-1`}>
              {question.question_text}
              {question.is_required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            {question.help_text && (
              <p className="text-sm text-gray-500 mb-3">{question.help_text}</p>
            )}
            <input
              type="text"
              value={value || question.default_value || ''}
              onChange={(e) => {
                setWizardState(prev => ({
                  ...prev,
                  useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                }));
              }}
              placeholder={question.placeholder || 'Enter value...'}
              className={`w-full px-4 py-3 rounded-xl border-2 ${accent.border} focus:ring-2 focus:ring-blue-300 outline-none`}
            />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-80px)] p-6 md:p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GUIDANCE PANEL - Comprehensive with all requirements
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 mb-6 shadow-xl border border-indigo-400/30">
          {/* Top Row: Avatar + Acknowledgment */}
          <div className="flex items-start gap-5 mb-5">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                <img src={merlinImage} alt="Merlin" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="flex-1">
              {/* 1. ACKNOWLEDGE PREVIOUS STEP */}
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  ✅ Great choice! You selected {wizardState.industryName} in {wizardState.state || 'your state'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Now, Tell Me About Your Facility
              </h1>
              <p className="text-white/90 text-base leading-relaxed">
                {getMerlinMessage()}
              </p>
            </div>
          </div>
          
          {/* 2. STEP BY STEP INSTRUCTIONS */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Here's what to do on this page:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <span className="text-white/90 text-sm">Answer the facility questions below</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="text-white/90 text-sm">Select your primary BESS application</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <span className="text-white/90 text-sm">Click <strong>Continue</strong> when done</span>
              </div>
            </div>
          </div>
          
          {/* 3. INDUSTRY-SPECIFIC RECOMMENDATION */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 mb-5 border border-emerald-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-emerald-300 font-bold mb-1">
                  💡 Merlin's Recommendation for {wizardState.industryName}
                </h4>
                <p className="text-white/90 text-sm mb-2">{bessRec.tip}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80">
                    <Battery className="w-3 h-3" /> Typical: {bessRec.sizing}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80">
                    <Target className="w-3 h-3" /> Best for: {bessRec.application}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 4. POWER GAP / NAV BAR TIP */}
          <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-amber-300 font-bold text-sm mb-1">
                  👆 Pro Tip: Check the Top Navigation Bar
                </h4>
                <p className="text-white/80 text-sm">
                  As you answer questions, watch the <strong>Power Gap</strong>, <strong>Solar</strong>, and <strong>Power Profile</strong> 
                  indicators update in real-time. They show how well your BESS configuration matches your facility's needs!
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-3 mt-5">
            <span className="text-white/60 text-sm">Progress:</span>
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-white/80 text-sm font-semibold">{answeredCount}/{totalQuestions} answered</span>
          </div>
        </div>
        
        {/* SUMMARY BAR */}
        <SummaryBar
          state={wizardState.state}
          industry={wizardState.industryName}
          estimatedKW={estimatedKW}
          answeredQuestions={answeredCount}
          totalQuestions={totalQuestions}
        />
        
        {/* Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#060F76]/80 hover:bg-[#060F76] rounded-lg transition-colors border border-[#4b59f5]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#7DD3FC] hover:bg-[#060F76]/30 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          )}
          <div className="flex-1" />
          <div className="inline-flex items-center gap-2 bg-[#060F76]/40 border border-[#4b59f5]/60 rounded-full px-4 py-1.5">
            <span className="text-[#7DD3FC] font-bold">Step 3 of 4</span>
            <span className="text-white/60">•</span>
            <span className="text-white/80 text-sm">Facility Details</span>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            FACILITY SUBTYPE (if applicable)
        ═══════════════════════════════════════════════════════════════ */}
        {hasSubtypes && (
          <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-xl mb-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">What type of {wizardState.industryName}?</h3>
                <p className="text-sm text-gray-500">This affects power requirements and typical savings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subtypes.map((subtype) => (
                <button
                  key={subtype.id}
                  onClick={() => setWizardState(prev => ({ ...prev, facilitySubtype: subtype.id }))}
                  className={`p-4 rounded-xl text-left transition-all ${
                    wizardState.facilitySubtype === subtype.id
                      ? 'bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-purple-50 text-gray-700 border-2 border-transparent hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${wizardState.facilitySubtype === subtype.id ? 'bg-white/20' : 'bg-purple-100'} flex items-center justify-center`}>
                      <Building2 className={`w-5 h-5 ${wizardState.facilitySubtype === subtype.id ? 'text-white' : 'text-purple-500'}`} />
                    </div>
                    <div>
                      <div className="font-bold">{subtype.label}</div>
                      <div className={`text-sm ${wizardState.facilitySubtype === subtype.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {subtype.description}
                      </div>
                    </div>
                    {wizardState.facilitySubtype === subtype.id && (
                      <CheckCircle className="w-5 h-5 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Equipment tier removed for simplification - defaults to standard */}
        
        {/* ═══════════════════════════════════════════════════════════════
            CUSTOM QUESTIONS - Visual Cards
        ═══════════════════════════════════════════════════════════════ */}
        {filteredQuestions.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 px-2">
              <MerlinHat size="sm" color="purple" withSparkle />
              <h3 className="text-lg font-bold text-white">Industry Details</h3>
              <span className="text-white/50 text-sm">— {filteredQuestions.length} questions</span>
            </div>
            
            {filteredQuestions.map((question: any, index: number) => renderQuestion(question, index))}
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════
            NAVIGATION BUTTONS - CONSISTENT DESIGN
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mt-8">
          {/* Left side: Back + Home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-r from-slate-600 to-slate-700
                         border-2 border-slate-500
                         text-white font-bold
                         hover:from-slate-500 hover:to-slate-600
                         hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="flex items-center gap-2 px-4 py-3 rounded-xl
                           bg-slate-800/50 border-2 border-slate-600
                           text-gray-300 font-semibold
                           hover:bg-slate-700 hover:text-white transition-all"
              >
                <Home className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Right side: Continue */}
          <button
            onClick={onContinue}
            disabled={!isFormValid}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isFormValid
                ? 'bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6] border-2 border-[#ad42ff] text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105'
                : 'bg-gray-300 border-2 border-gray-400 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Next Step</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {!isFormValid && (
          <p className="text-center text-amber-300 text-sm mt-3">
            Please answer all required questions to continue
          </p>
        )}
        
      </div>
    </div>
  );
}

export default Step3FacilityDetails;
