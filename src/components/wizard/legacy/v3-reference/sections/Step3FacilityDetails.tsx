/**
 * STEP 3: FACILITY DETAILS
 * =========================
 * 
 * December 21, 2025 - V5 REDESIGN (Using MerlinInputs)
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
 * 
 * V5 UPDATE: Now uses MerlinInputs components for consistent November design
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
import { FloatingNavigationArrows, MerlinGreeting } from '../shared';
import merlinImage from '@/assets/images/new_profile_merlin.png';

// V5 MerlinInputs - November Design System
import { 
  QuestionCard, 
  MerlinDropdown, 
  MerlinToggle, 
  MerlinSlider, 
  MerlinStepper, 
  MerlinChips,
  MerlinYesNo
} from '../v5/MerlinInputs';

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
  
  // ============================================
  // RENDER QUESTION - V5 MerlinInputs Components
  // December 21, 2025 - Official November Design
  // ============================================
  const renderQuestion = (question: any, index: number) => {
    const value = wizardState.useCaseData[question.field_name];
    const isBESSQuestion = question.field_name === 'primaryBESSApplication';
    
    // Get icon gradient based on field type (purple default, emerald for BESS, etc.)
    const getIconGradient = (): 'purple' | 'emerald' | 'amber' | 'cyan' | 'pink' => {
      if (isBESSQuestion) return 'emerald';
      if (question.field_name.includes('amenities') || question.field_name.includes('pool')) return 'cyan';
      if (question.field_name.includes('food') || question.field_name.includes('dining')) return 'amber';
      if (question.field_name.includes('goal') || question.field_name.includes('priority')) return 'pink';
      return 'purple';
    };
    
    const iconGradient = getIconGradient();
    
    // Get appropriate icon for the question
    const getQuestionIcon = () => {
      if (question.field_name.includes('room') || question.field_name.includes('unit')) return Home;
      if (question.field_name.includes('sqft') || question.field_name.includes('square')) return Building2;
      if (question.field_name.includes('bay') || question.field_name.includes('stall')) return Car;
      if (question.field_name.includes('charger') || question.field_name.includes('ev')) return Plug;
      if (question.field_name.includes('solar')) return Sun;
      if (question.field_name.includes('pool') || question.field_name.includes('spa')) return Waves;
      if (question.field_name.includes('restaurant') || question.field_name.includes('food')) return Utensils;
      if (question.field_name.includes('gym') || question.field_name.includes('fitness')) return Dumbbell;
      if (isBESSQuestion) return Battery;
      return Gauge;
    };
    
    const QuestionIcon = getQuestionIcon();
    
    // NUMBER INPUT → QuestionCard + MerlinSlider + MerlinStepper
    if (question.question_type === 'number') {
      const numValue = Number(value ?? question.default_value ?? 0);
      const minVal = question.min_value || 0;
      const maxVal = question.max_value || (numValue > 1000 ? numValue * 2 : 1000);
      const step = maxVal > 1000 ? 100 : maxVal > 100 ? 10 : 1;
      
      return (
        <QuestionCard
          key={question.field_name}
          icon={QuestionIcon}
          iconGradient={iconGradient}
          title={question.question_text}
          subtitle={question.help_text}
          required={question.is_required}
        >
          <div className="space-y-4">
            <MerlinSlider
              min={minVal}
              max={maxVal}
              step={step}
              value={numValue}
              onChange={(newVal) => {
                setWizardState(prev => ({
                  ...prev,
                  useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
                }));
              }}
              formatValue={(v) => v.toLocaleString()}
            />
            <MerlinStepper
              value={numValue}
              min={minVal}
              max={maxVal}
              step={step}
              onChange={(newVal) => {
                setWizardState(prev => ({
                  ...prev,
                  useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
                }));
              }}
            />
          </div>
        </QuestionCard>
      );
    }
    
    // SELECT / DROPDOWN → QuestionCard + MerlinToggle (2-4 options) or MerlinDropdown (5+ options)
    if (question.question_type === 'select' || question.question_type === 'dropdown') {
      const rawOptions = question.options || [];
      
      // Normalize options to { value, label } format
      const options = rawOptions.map((opt: any) => {
        if (typeof opt === 'string') return { value: opt, label: opt };
        return { value: opt.value, label: opt.label || opt.value };
      });
      
      // Use MerlinToggle for 2-4 options (visual pill buttons)
      if (options.length <= 4) {
        return (
          <QuestionCard
            key={question.field_name}
            icon={QuestionIcon}
            iconGradient={iconGradient}
            title={question.question_text}
            subtitle={question.help_text}
            required={question.is_required}
          >
            <MerlinToggle
              options={options}
              value={value || question.default_value}
              onChange={(newVal) => {
                setWizardState(prev => ({
                  ...prev,
                  useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
                }));
              }}
            />
          </QuestionCard>
        );
      }
      
      // Use MerlinDropdown for 5+ options
      return (
        <QuestionCard
          key={question.field_name}
          icon={QuestionIcon}
          iconGradient={iconGradient}
          title={question.question_text}
          subtitle={question.help_text}
          required={question.is_required}
        >
          <MerlinDropdown
            options={options}
            value={value || question.default_value}
            onChange={(newVal) => {
              setWizardState(prev => ({
                ...prev,
                useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
              }));
            }}
            placeholder="Select an option..."
          />
        </QuestionCard>
      );
    }
    
    // MULTI-SELECT → QuestionCard + MerlinChips
    if (question.question_type === 'multi-select' || question.question_type === 'checkbox') {
      const rawOptions = question.options || [];
      const options = rawOptions.map((opt: any) => {
        if (typeof opt === 'string') return { value: opt, label: opt };
        return { value: opt.value, label: opt.label || opt.value };
      });
      const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
      
      return (
        <QuestionCard
          key={question.field_name}
          icon={CheckCircle}
          iconGradient={iconGradient}
          title={question.question_text}
          subtitle={question.help_text}
          required={question.is_required}
        >
          <MerlinChips
            options={options}
            values={selectedValues}
            onChange={(newVal) => {
              setWizardState(prev => ({
                ...prev,
                useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
              }));
            }}
          />
        </QuestionCard>
      );
    }
    
    // SLIDER / RANGE → QuestionCard + MerlinSlider
    if (question.question_type === 'slider' || question.question_type === 'range') {
      const numValue = Number(value ?? question.default_value ?? question.min_value ?? 0);
      const minVal = question.min_value || 0;
      const maxVal = question.max_value || 100;
      
      return (
        <QuestionCard
          key={question.field_name}
          icon={TrendingUp}
          iconGradient={iconGradient}
          title={question.question_text}
          subtitle={question.help_text}
          required={question.is_required}
        >
          <MerlinSlider
            min={minVal}
            max={maxVal}
            step={question.step || 1}
            value={numValue}
            onChange={(newVal) => {
              setWizardState(prev => ({
                ...prev,
                useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
              }));
            }}
            formatValue={(v) => v.toLocaleString()}
          />
        </QuestionCard>
      );
    }
    
    // BOOLEAN / YES-NO → QuestionCard + MerlinYesNo
    if (question.question_type === 'boolean' || question.question_type === 'yes_no') {
      return (
        <QuestionCard
          key={question.field_name}
          icon={QuestionIcon}
          iconGradient={iconGradient}
          title={question.question_text}
          subtitle={question.help_text}
          required={question.is_required}
        >
          <MerlinYesNo
            value={value === true || value === 'yes'}
            onChange={(newVal) => {
              setWizardState(prev => ({
                ...prev,
                useCaseData: { ...prev.useCaseData, [question.field_name]: newVal }
              }));
            }}
          />
        </QuestionCard>
      );
    }
    
    // TEXT INPUT (fallback) → QuestionCard + standard input
    return (
      <QuestionCard
        key={question.field_name}
        icon={Info}
        iconGradient={iconGradient}
        title={question.question_text}
        subtitle={question.help_text}
        required={question.is_required}
      >
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all text-gray-800"
        />
      </QuestionCard>
    );
  };
  
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-80px)] p-6 md:p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GREETING (Dec 21, 2025 - Unified component)
        ═══════════════════════════════════════════════════════════════ */}
        <MerlinGreeting
          stepNumber={3}
          totalSteps={5}
          stepTitle="Facility Details"
          className="mb-6"
          showMerlinAvatar={true}
          acknowledgment={`Great choice! You selected ${wizardState.industryName} in ${wizardState.state || 'your state'}`}
          stepDescription={getMerlinMessage()}
          estimatedTime="2-3 min"
          instructions={[
            { text: "Answer the facility questions below" },
            { text: "Select your primary BESS application" },
            { text: "Click Continue when done", highlight: "Continue" },
          ]}
          recommendation={{
            title: `💡 Merlin's Recommendation for ${wizardState.industryName}`,
            content: (
              <>
                <p className="mb-2">{bessRec.tip}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80">
                    <Battery className="w-3 h-3" /> Typical: {bessRec.sizing}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/80">
                    <Target className="w-3 h-3" /> Best for: {bessRec.application}
                  </span>
                </div>
              </>
            )
          }}
          proTip={{
            title: "👆 Pro Tip: Watch the Header!",
            content: "As you answer, the <strong>Solar</strong> and <strong>Power Profile</strong> indicators update in real-time!"
          }}
        />
        
        {/* Custom Progress Indicator for this step */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-4 mb-6 border border-indigo-400/20">
          <div className="flex items-center gap-3">
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
            NAVIGATION - Themed Buttons
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-center gap-4 mt-10 pb-24">
          {/* Continue Button - Primary Action */}
          <button
            onClick={onContinue}
            disabled={!isFormValid}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg transition-all ${
              isFormValid
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 border-2 border-emerald-400/50 text-white shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105'
                : 'bg-gray-500/30 border-2 border-gray-500/50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Continue to Configuration</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {!isFormValid && (
          <p className="text-center text-amber-300/80 text-sm -mt-4 pb-20">
            💡 Answer the questions above to continue
          </p>
        )}
        
      </div>
      
      {/* Floating Navigation Arrows */}
      <FloatingNavigationArrows
        canGoBack={true}
        canGoForward={isFormValid}
        onBack={onBack}
        onForward={onContinue}
        backLabel="Back to Industry"
        forwardLabel="Continue to Configuration"
      />
    </div>
  );
}

export default Step3FacilityDetails;
