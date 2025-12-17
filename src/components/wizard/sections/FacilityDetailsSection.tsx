// ═══════════════════════════════════════════════════════════════════════════
// FACILITY DETAILS SECTION (Section 2)
// Extracted from StreamlinedWizard.tsx - Dec 2025 Refactor
// 
// Purpose: Handle industry-specific custom questions from database
// with fallback to facility size presets
// 
// Updated Dec 15, 2025: Added Facility Subtype + Equipment Tier selectors
// per Vineet feedback (Universal Pattern)
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  CheckCircle, 
  Gauge, 
  Info, 
  Minus, 
  Plus,
  Sparkles,
  Settings,
  Star,
  // Icons for amenities/options
  Waves,
  Dumbbell,
  Briefcase,
  ShoppingBag,
  Shirt,
  CircleDot,
  Utensils,
  Coffee,
  Wine,
  UtensilsCrossed,
  ChefHat,
  GlassWater,
  Users,
  Presentation,
  Building,
  Car,
  ParkingCircle,
  Sun,
  Zap,
  Battery,
  Plug,
  Target,
  Leaf,
  Award,
  Clock,
  TrendingDown,
  ShieldCheck,
  Banknote,
  CircleOff
} from 'lucide-react';
import { FACILITY_PRESETS, EQUIPMENT_TIER_OPTIONS, FACILITY_SUBTYPES } from '../constants/wizardConstants';
import type { WizardState, FacilityDetailsSectionProps, EquipmentTier } from '../types/wizardTypes';

// Import new high-fidelity UI components
import { StepExplanation, PrimaryButton, SecondaryButton } from '../ui';

// Icon mapping for common amenity/option values
const OPTION_ICONS: Record<string, React.ElementType> = {
  // Pool & Spa
  indoor_pool: Waves,
  outdoor_pool: Waves,
  pool_unheated: Waves,
  hot_tub: GlassWater,
  spa_full: Sparkles,
  spa: Sparkles,
  pool: Waves,
  // Fitness
  fitness_small: Dumbbell,
  fitness_large: Dumbbell,
  fitness: Dumbbell,
  // Business
  business_center: Briefcase,
  // Retail
  gift_shop: ShoppingBag,
  retail: ShoppingBag,
  // Laundry
  guest_laundry: Shirt,
  commercial_laundry: Shirt,
  laundry: Shirt,
  // Recreation
  tennis_courts: CircleDot,
  // F&B
  breakfast: Coffee,
  casual_dining: Utensils,
  fine_dining: UtensilsCrossed,
  bar_lounge: Wine,
  room_service: ChefHat,
  banquet: Users,
  coffee_shop: Coffee,
  pool_bar: GlassWater,
  restaurant: Utensils,
  // Meeting (compound values from DB)
  small: Users,
  medium: Presentation,
  large: Building,
  convention: Building,
  meeting_small: Users,
  meeting_medium: Presentation,
  ballroom: Building,
  // Parking (compound values from DB)
  surface: Car,
  structure: ParkingCircle,
  valet: Car,
  surface_lot: Car,
  parking_garage: ParkingCircle,
  // Solar (compound values from DB)
  operational: Sun,
  not_working: Sun,
  under_construction: Sun,
  approved: Sun,
  active: Sun,
  exploring: Sun,
  maybe_solar: Sun,
  solar_yes: Sun,
  solar_no: CircleOff,
  solar_construction: Sun,
  solar_permitted: Sun,
  // EV (compound values from DB)
  level2: Plug,
  dcfc: Zap,
  ultrafast: Battery,
  ev_level2: Plug,
  ev_dcfc: Zap,
  ev_ultrafast: Battery,
  ev_charging: Plug,
  high_priority: Zap,
  moderate: Plug,
  // Goals
  reduce_costs: Banknote,
  reduce_demand: TrendingDown,
  net_zero: Leaf,
  sustainability: Leaf,
  green_cert: Award,
  reduce_grid: ShieldCheck,
  demand_response: Clock,
  tou_optimization: Clock,
  // Generic
  none: CircleOff,
  no: CircleOff,
  yes: CheckCircle,
  sufficient: CheckCircle,
};

// Color mapping for option categories
const getOptionColor = (fieldName: string, isSelected: boolean) => {
  if (!isSelected) return { bg: 'bg-gray-50 hover:bg-gray-100', text: 'text-gray-600', icon: 'text-gray-400', border: 'border-gray-200' };
  
  // Map field names to color schemes
  if (fieldName.includes('amenities') || fieldName.includes('pool') || fieldName.includes('spa') || fieldName.includes('fitness')) {
    return { bg: 'bg-cyan-50', text: 'text-cyan-800', icon: 'text-cyan-500', border: 'border-cyan-300' };
  }
  if (fieldName.includes('food') || fieldName.includes('beverage') || fieldName.includes('fb') || fieldName.includes('dining')) {
    return { bg: 'bg-orange-50', text: 'text-orange-800', icon: 'text-orange-500', border: 'border-orange-300' };
  }
  if (fieldName.includes('meeting') || fieldName.includes('event') || fieldName.includes('conference')) {
    return { bg: 'bg-blue-50', text: 'text-blue-800', icon: 'text-blue-500', border: 'border-blue-300' };
  }
  if (fieldName.includes('parking')) {
    return { bg: 'bg-slate-100', text: 'text-slate-800', icon: 'text-slate-500', border: 'border-slate-300' };
  }
  if (fieldName.includes('solar')) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'text-amber-500', border: 'border-amber-300' };
  }
  if (fieldName.includes('ev') || fieldName.includes('charger')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: 'text-emerald-500', border: 'border-emerald-300' };
  }
  if (fieldName.includes('goal') || fieldName.includes('priority')) {
    return { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-500', border: 'border-purple-300' };
  }
  if (fieldName.includes('backup') || fieldName.includes('outage')) {
    return { bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-500', border: 'border-red-300' };
  }
  // Default purple
  return { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-500', border: 'border-purple-300' };
};

export function FacilityDetailsSection({
  wizardState,
  setWizardState,
  currentSection,
  initializedFromVertical,
  sectionRef,
  onBack,
  onContinue,
}: FacilityDetailsSectionProps) {
  // Filter out redundant grid/utility questions that are handled in other sections
  const excludedFields = [
    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
    'gridReliabilityIssues', 'existingSolarKW', 'offGridReason', 'annualOutageHours',
    'wantsSolar', 'hasEVCharging', 'evChargerCount',
    // EV chargers - now handled in Section 5 with dedicated L1/L2/L3/DCFC/HPC UI
    'existingEVChargers', 'wantsEVCharging', 'evChargerStatus', 'evChargingPower'
  ];
  const filteredQuestions = wizardState.customQuestions.filter(
    (q: any) => !excludedFields.includes(q.field_name)
  );

  // Auto-apply defaults for excluded required fields (so they don't block validation)
  React.useEffect(() => {
    const excludedRequiredWithDefaults = wizardState.customQuestions.filter(
      (q: any) => excludedFields.includes(q.field_name) && q.is_required && q.default_value
    );
    const updates: Record<string, any> = {};
    excludedRequiredWithDefaults.forEach((q: any) => {
      if (wizardState.useCaseData[q.field_name] === undefined) {
        updates[q.field_name] = q.default_value;
      }
    });
    if (Object.keys(updates).length > 0) {
      setWizardState(prev => ({
        ...prev,
        useCaseData: { ...prev.useCaseData, ...updates }
      }));
    }
  }, [wizardState.customQuestions]);

  // Check if all required VISIBLE questions are answered (exclude hidden fields from validation)
  // A question is valid if:
  // 1. It's not required, OR
  // 2. It has a user-entered value, OR
  // 3. It has a default value that was applied
  const isFormValid = filteredQuestions.length > 0 
    ? !filteredQuestions.some((q: any) => {
        if (!q.is_required) return false; // Not required = valid
        const value = wizardState.useCaseData[q.field_name];
        const hasValue = value !== undefined && value !== null && value !== '';
        const hasDefault = q.default_value !== undefined && q.default_value !== null && q.default_value !== '';
        return !hasValue && !hasDefault; // Invalid only if no value AND no default
      })
    : wizardState.facilitySize > 0;

  return (
    <div 
      ref={sectionRef}
      className={`min-h-[calc(100vh-120px)] p-8 ${currentSection !== 2 ? 'hidden' : ''}`}
    >
      <div className="max-w-3xl mx-auto">
        {/* Vertical Landing Page Welcome Banner */}
        {initializedFromVertical && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-700">Welcome from {wizardState.industryName}!</h4>
                <p className="text-sm text-emerald-600">
                  We've imported your info. Let's confirm a few details to build your custom quote.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Section Navigation - Hide "Back" for vertical users on first visit */}
        <div className="flex items-center justify-between mb-6">
          {!initializedFromVertical ? (
            <SecondaryButton
              onClick={onBack}
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
              className="w-auto"
            >
              Back to Industry
            </SecondaryButton>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600">
              <Sparkles className="w-4 h-4" />
              <span>Pre-filled from your calculator</span>
            </div>
          )}
          <div className="text-sm text-gray-400">
            {initializedFromVertical ? 'Step 1 of 4' : 'Step 2 of 5'}
          </div>
        </div>
        
        {/* Step Explanation - High fidelity header */}
        <StepExplanation
          stepNumber={initializedFromVertical ? 1 : 2}
          totalSteps={initializedFromVertical ? 4 : 5}
          title={initializedFromVertical 
            ? `Confirm Your ${wizardState.industryName || 'Facility'} Details`
            : `Tell Us About Your ${wizardState.industryName || 'Facility'}`
          }
          description={initializedFromVertical 
            ? "We've pre-filled some values based on your calculator inputs. Review and adjust as needed, then continue to configure your energy system."
            : "Answer a few industry-specific questions to help Merlin accurately size your battery storage system and maximize your savings."
          }
          estimatedTime="2 minutes"
        />
        
        {/* Progress badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-4 py-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">{wizardState.state}</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-4 py-1.5">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 text-sm">{wizardState.industryName}</span>
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            FACILITY SUBTYPE SELECTOR (Dec 2025 - Universal Pattern)
            First question for all use cases - determines power profile
            ═══════════════════════════════════════════════════════════════════ */}
        {(() => {
          const subtypes = FACILITY_SUBTYPES[wizardState.selectedIndustry] || FACILITY_SUBTYPES['default'];
          // Only show if there are meaningful subtypes (more than just "standard")
          if (subtypes.length <= 1 && subtypes[0]?.id === 'standard') return null;
          
          return (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-amber-200 shadow-xl mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-700">What type of {wizardState.industryName || 'facility'}?</h3>
                  <p className="text-sm text-gray-500">This affects power requirements and sizing</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subtypes.map((subtype) => (
                  <button
                    key={subtype.id}
                    onClick={() => setWizardState(prev => ({ ...prev, facilitySubtype: subtype.id }))}
                    className={`p-4 rounded-xl text-left transition-all ${
                      wizardState.facilitySubtype === subtype.id
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-amber-50 border-2 border-amber-200 text-gray-700 hover:border-amber-400 hover:bg-amber-100'
                    }`}
                  >
                    <div className="font-bold">{subtype.label}</div>
                    <div className={`text-sm mt-1 ${wizardState.facilitySubtype === subtype.id ? 'text-amber-100' : 'text-gray-500'}`}>
                      {subtype.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
        
        {/* ═══════════════════════════════════════════════════════════════════
            EQUIPMENT TIER SELECTOR (Dec 2025 - Simplified Two-Tier System)
            Standard vs Premium - per Vineet feedback
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-indigo-200 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-700">Equipment Grade</h3>
              <p className="text-sm text-gray-500">Standard meets needs; Premium maximizes efficiency</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {EQUIPMENT_TIER_OPTIONS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setWizardState(prev => ({ ...prev, equipmentTier: tier.id as EquipmentTier }))}
                className={`p-5 rounded-xl text-left transition-all relative overflow-hidden ${
                  wizardState.equipmentTier === tier.id
                    ? tier.id === 'premium'
                      ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {tier.id === 'premium' && wizardState.equipmentTier !== 'premium' && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.icon}</span>
                  <div className="font-bold">{tier.label}</div>
                </div>
                <div className={`text-sm mt-2 ${wizardState.equipmentTier === tier.id ? 'text-white/90' : 'text-gray-500'}`}>
                  {tier.description}
                </div>
                {tier.id === 'premium' && (
                  <div className={`text-xs mt-2 font-medium ${wizardState.equipmentTier === tier.id ? 'text-white/80' : 'text-amber-600'}`}>
                    +30% capacity, +25% cost
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dynamic Custom Questions from Database */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-200 shadow-xl">
          {filteredQuestions.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-700">Industry-Specific Details</h3>
                  <p className="text-sm text-gray-500">{filteredQuestions.length} questions to accurately size your system</p>
                </div>
              </div>
              
              {/* Render each custom question dynamically */}
              <div className="space-y-8">
                {filteredQuestions.map((question: any, index: number) => {
                  // Special styling for primaryBESSApplication
                  const isBESSQuestion = question.field_name === 'primaryBESSApplication';
                  
                  // Special styling for energy goals
                  const isGoalsQuestion = question.field_name === 'energyGoals' || question.field_name.includes('goal');
                  
                  return (
                  <div key={question.field_name} className={`rounded-2xl p-6 border-2 ${
                    isBESSQuestion 
                      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
                      : isGoalsQuestion
                        ? 'bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 border-purple-300'
                        : 'bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border-purple-100'
                  }`}>
                    {/* Special BESS explanation banner */}
                    {isBESSQuestion && (
                      <div className="mb-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-800 font-medium">💡 What is BESS?</p>
                        <p className="text-xs text-emerald-700 mt-1">
                          <strong>Battery Energy Storage Systems (BESS)</strong> store electricity to use later—helping you cut costs, avoid outages, and maximize renewable energy. Choose your primary application below.
                        </p>
                      </div>
                    )}
                    
                    <label className={`block font-bold mb-2 ${
                      isBESSQuestion 
                        ? 'text-emerald-800 text-xl' 
                        : isGoalsQuestion
                          ? 'text-purple-800 text-xl'
                          : 'text-gray-800 text-lg'
                    }`}>
                      {question.question_text}
                      {question.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.help_text && (
                      <p className={`text-base mb-4 ${
                        isBESSQuestion 
                          ? 'text-emerald-600' 
                          : isGoalsQuestion
                            ? 'text-purple-600'
                            : 'text-gray-500'
                      }`}>{question.help_text}</p>
                    )}
                    
                    {/* Number input */}
                    {question.question_type === 'number' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                            const step = question.max_value > 100 ? 10 : 1;
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: Math.max(question.min_value || 0, currentVal - step)
                              }
                            }));
                          }}
                          className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                        >
                          <Minus className="w-5 h-5 text-purple-600" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: parseFloat(val) || 0
                              }
                            }));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-5 py-4 bg-white border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <button
                          onClick={() => {
                            const currentVal = wizardState.useCaseData[question.field_name] || parseFloat(question.default_value) || 0;
                            const step = question.max_value > 100 ? 10 : 1;
                            setWizardState(prev => ({
                              ...prev,
                              useCaseData: {
                                ...prev.useCaseData,
                                [question.field_name]: Math.min(question.max_value || 999999, currentVal + step)
                              }
                            }));
                          }}
                          className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-purple-600" />
                        </button>
                      </div>
                    )}
                    
                    {/* Select input - Merlin gradient styling */}
                    {question.question_type === 'select' && question.options && (() => {
                      const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]');
                      
                      // Use dropdown for selects with more than 6 options (increased threshold)
                      if (options.length > 6 && !isBESSQuestion) {
                        return (
                          <select
                            value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                            onChange={(e) => setWizardState(prev => ({
                              ...prev,
                              useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                            }))}
                            className="w-full px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl text-gray-800 text-lg font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239333ea%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                          >
                            <option value="" disabled>Select an option...</option>
                            {options.map((option: any) => {
                              const optionValue = typeof option === 'string' ? option : option.value;
                              const optionLabel = typeof option === 'string' ? option : option.label;
                              return (
                                <option key={optionValue} value={optionValue}>{optionLabel}</option>
                              );
                            })}
                          </select>
                        );
                      }
                      
                      // Use large card buttons for 6 or fewer options
                      // Gradient colors cycle: purple→indigo→emerald→amber→rose→cyan
                      const gradients = [
                        { selected: 'from-purple-600 to-indigo-600', border: 'border-purple-300 hover:border-purple-400', bg: 'from-purple-50 to-indigo-50', shadow: 'shadow-purple-500/20' },
                        { selected: 'from-indigo-600 to-blue-600', border: 'border-indigo-300 hover:border-indigo-400', bg: 'from-indigo-50 to-blue-50', shadow: 'shadow-indigo-500/20' },
                        { selected: 'from-emerald-600 to-teal-600', border: 'border-emerald-300 hover:border-emerald-400', bg: 'from-emerald-50 to-teal-50', shadow: 'shadow-emerald-500/20' },
                        { selected: 'from-amber-500 to-orange-500', border: 'border-amber-300 hover:border-amber-400', bg: 'from-amber-50 to-orange-50', shadow: 'shadow-amber-500/20' },
                        { selected: 'from-rose-500 to-pink-500', border: 'border-rose-300 hover:border-rose-400', bg: 'from-rose-50 to-pink-50', shadow: 'shadow-rose-500/20' },
                        { selected: 'from-cyan-500 to-sky-500', border: 'border-cyan-300 hover:border-cyan-400', bg: 'from-cyan-50 to-sky-50', shadow: 'shadow-cyan-500/20' },
                      ];
                      
                      return (
                        <div className={`grid gap-4 ${
                          isBESSQuestion 
                            ? 'grid-cols-1 md:grid-cols-2' 
                            : options.length <= 3 
                              ? 'grid-cols-1 sm:grid-cols-3' 
                              : options.length <= 5
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                        }`}>
                          {options.map((option: any, optIdx: number) => {
                            const optionValue = typeof option === 'string' ? option : option.value;
                            const optionLabel = typeof option === 'string' ? option : option.label;
                            const isSelected = wizardState.useCaseData[question.field_name] === optionValue;
                            const gradient = gradients[optIdx % gradients.length];
                            
                            return (
                              <button
                                key={optionValue}
                                onClick={() => setWizardState(prev => ({
                                  ...prev,
                                  useCaseData: { ...prev.useCaseData, [question.field_name]: optionValue }
                                }))}
                                className={`group py-4 px-5 rounded-2xl font-semibold text-base transition-all duration-200 text-left border-2 ${
                                  isBESSQuestion
                                    ? isSelected
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 border-emerald-400 scale-[1.02]'
                                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-gray-700 hover:border-emerald-400 hover:shadow-md'
                                    : isSelected
                                      ? `bg-gradient-to-r ${gradient.selected} text-white shadow-lg ${gradient.shadow} border-transparent scale-[1.02]`
                                      : `bg-gradient-to-r ${gradient.bg} ${gradient.border} text-gray-700 hover:shadow-md`
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  {isSelected && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                                  <span className="leading-tight">{optionLabel}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    
                    {/* Text input */}
                    {question.question_type === 'text' && (
                      <input
                        type="text"
                        value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? ''}
                        onChange={(e) => setWizardState(prev => ({
                          ...prev,
                          useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.value }
                        }))}
                        placeholder={question.placeholder || ''}
                        className="w-full px-5 py-4 bg-white border-2 border-purple-200 rounded-xl text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    )}
                    
                    {/* Boolean input */}
                    {question.question_type === 'boolean' && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizardState.useCaseData[question.field_name] === true || wizardState.useCaseData[question.field_name] === 'true'}
                          onChange={(e) => setWizardState(prev => ({
                            ...prev,
                            useCaseData: { ...prev.useCaseData, [question.field_name]: e.target.checked }
                          }))}
                          className="w-6 h-6 rounded accent-purple-500"
                        />
                        <span className="text-gray-700">Yes</span>
                      </label>
                    )}
                    
                    {/* Slider input (Dec 2025) - for elevator count, bill estimates */}
                    {question.question_type === 'slider' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={question.min_value || 0}
                            max={question.max_value || 100}
                            step={question.step_value || 1}
                            value={wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0}
                            onChange={(e) => setWizardState(prev => ({
                              ...prev,
                              useCaseData: { ...prev.useCaseData, [question.field_name]: parseFloat(e.target.value) }
                            }))}
                            className="flex-1 h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="bg-purple-100 rounded-xl px-4 py-2 min-w-[100px] text-center border-2 border-purple-300">
                            <span className="text-2xl font-black text-purple-600">
                              {question.field_name.includes('bill') || question.field_name.includes('cost') 
                                ? `$${(wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0).toLocaleString()}`
                                : (wizardState.useCaseData[question.field_name] ?? question.default_value ?? 0).toLocaleString()
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                          <span>{question.min_value || 0}{question.field_name.includes('bill') || question.field_name.includes('cost') ? '' : ''}</span>
                          <span>{question.max_value || 100}{question.field_name.includes('bill') || question.field_name.includes('cost') ? '' : ''}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        MULTISELECT INPUT (Dec 2025) - Enhanced with icons & colors
                        Uses large card-style checkboxes with category-specific colors
                        Stores selected values as JSON array in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {(question.question_type === 'multiselect' || question.question_type === 'multi-select') && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option: any) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          const optionPower = typeof option === 'object' ? option.powerKw : null;
                          
                          // Get current selections as array
                          const currentSelections: string[] = Array.isArray(wizardState.useCaseData[question.field_name])
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : []);
                          const isSelected = currentSelections.includes(optionValue);
                          
                          // Get icon and colors
                          const IconComponent = OPTION_ICONS[optionValue] || (optionValue.includes('none') || optionValue.includes('no_') ? CircleOff : CheckCircle);
                          const colors = getOptionColor(question.field_name, isSelected);
                          
                          return (
                            <label
                              key={optionValue}
                              className={`group flex items-center gap-4 cursor-pointer p-5 rounded-2xl transition-all duration-200 border-2 ${
                                isSelected
                                  ? `${colors.bg} ${colors.border} shadow-lg shadow-${colors.border.split('-')[1]}-500/20 scale-[1.02]`
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                              }`}
                            >
                              {/* Custom large checkbox */}
                              <div className={`relative flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                                isSelected 
                                  ? `${colors.border} ${colors.bg}` 
                                  : 'border-gray-300 bg-white group-hover:border-gray-400'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                                )}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSelections = e.target.checked
                                      ? [...currentSelections, optionValue]
                                      : currentSelections.filter(v => v !== optionValue);
                                    setWizardState(prev => ({
                                      ...prev,
                                      useCaseData: { ...prev.useCaseData, [question.field_name]: newSelections }
                                    }));
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                              
                              {/* Icon - larger and more prominent */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                isSelected ? `${colors.bg} ring-2 ring-offset-2 ring-${colors.border.split('-')[1]}-300` : 'bg-gray-100 group-hover:bg-gray-200'
                              }`}>
                                <IconComponent className={`w-6 h-6 ${isSelected ? colors.icon : 'text-gray-400 group-hover:text-gray-500'}`} />
                              </div>
                              
                              {/* Label and power - larger fonts */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-base font-semibold leading-tight ${isSelected ? colors.text : 'text-gray-700 group-hover:text-gray-900'}`}>
                                  {optionLabel}
                                </p>
                                {optionPower !== null && optionPower !== undefined && (
                                  <p className={`text-sm font-medium mt-1 ${isSelected ? colors.icon : 'text-gray-400'}`}>
                                    {optionPower > 0 ? `+${optionPower} kW` : optionPower === 0 ? '0 kW' : `${optionPower} kW`}
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        COMPOUND INPUT (Dec 2025) - Compact checklist with inline amounts
                        Renders nested questions (e.g., F&B with seat counts, EV with charger counts)
                        Each sub-question has enable checkbox + optional numeric input
                        Stores as JSON object in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {question.question_type === 'compound' && question.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((subQ: any) => {
                          // Get current compound state as object
                          const compoundData: Record<string, any> = typeof wizardState.useCaseData[question.field_name] === 'object'
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : {});
                          
                          const subValue = subQ.value;
                          const isEnabled = compoundData[subValue]?.enabled ?? false;
                          const subAmount = compoundData[subValue]?.amount ?? (subQ.defaultAmount || 0);
                          
                          // Get icon for this option
                          const IconComponent = OPTION_ICONS[subValue] || (subValue.includes('none') || subValue.includes('no') ? CircleOff : CheckCircle);
                          const colors = getOptionColor(question.field_name, isEnabled);
                          
                          return (
                            <label 
                              key={subValue}
                              className={`group flex flex-col cursor-pointer p-5 rounded-2xl transition-all duration-200 border-2 ${
                                isEnabled 
                                  ? `${colors.bg} ${colors.border} shadow-lg scale-[1.02]`
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {/* Custom large checkbox */}
                                <div className={`relative flex-shrink-0 w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${
                                  isEnabled 
                                    ? `${colors.border} ${colors.bg}` 
                                    : 'border-gray-300 bg-white group-hover:border-gray-400'
                                }`}>
                                  {isEnabled && (
                                    <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const newCompound = {
                                        ...compoundData,
                                        [subValue]: { 
                                          enabled: e.target.checked, 
                                          amount: subAmount 
                                        }
                                      };
                                      setWizardState(prev => ({
                                        ...prev,
                                        useCaseData: { ...prev.useCaseData, [question.field_name]: newCompound }
                                      }));
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </div>
                                
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  isEnabled ? `${colors.bg} ring-2 ring-offset-2` : 'bg-gray-100 group-hover:bg-gray-200'
                                }`}>
                                  <IconComponent className={`w-6 h-6 ${isEnabled ? colors.icon : 'text-gray-400 group-hover:text-gray-500'}`} />
                                </div>
                                
                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-base font-semibold leading-tight ${isEnabled ? colors.text : 'text-gray-700 group-hover:text-gray-900'}`}>
                                    {subQ.label}
                                  </p>
                                  {subQ.powerKw > 0 && (
                                    <p className={`text-sm font-medium mt-1 ${isEnabled ? colors.icon : 'text-gray-400'}`}>
                                      +{subQ.powerKw} kW
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Inline numeric input for sub-question - expanded */}
                              {isEnabled && subQ.hasAmount && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                                  <span className="text-sm text-gray-600 font-medium">Amount:</span>
                                  <input
                                    type="number"
                                    min={subQ.minAmount || 0}
                                    max={subQ.maxAmount || 9999}
                                    value={subAmount}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const newCompound = {
                                        ...compoundData,
                                        [subValue]: { 
                                          enabled: true, 
                                          amount: parseInt(e.target.value) || 0 
                                        }
                                      };
                                      setWizardState(prev => ({
                                        ...prev,
                                        useCaseData: { ...prev.useCaseData, [question.field_name]: newCompound }
                                      }));
                                    }}
                                    className={`flex-1 px-4 py-2 ${colors.bg} border-2 ${colors.border} rounded-xl text-center text-lg font-bold ${colors.text} focus:ring-2 focus:ring-offset-1`}
                                  />
                                  <span className={`text-sm font-medium ${colors.text} min-w-[60px]`}>{subQ.amountUnit || ''}</span>
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Fallback to facility size presets if no custom questions */
            <>
              {(() => {
                const preset = FACILITY_PRESETS[wizardState.selectedIndustry] || FACILITY_PRESETS.default;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                        <Gauge className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{preset.label}</h3>
                        <p className="text-sm text-gray-500">Select or enter your size in {preset.unit}</p>
                      </div>
                    </div>
                    
                    {/* Preset buttons */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                      {preset.presets.map((size) => (
                        <button
                          key={size}
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: size }))}
                          className={`py-3 px-4 rounded-xl font-medium transition-all ${
                            wizardState.facilitySize === size
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {size.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom input */}
                    <div className="mb-8">
                      <label className="block text-sm text-gray-500 mb-2">Or enter custom value:</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: Math.max(1000, prev.facilitySize - 5000) }))}
                          className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                        >
                          <Minus className="w-5 h-5 text-purple-600" />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={wizardState.facilitySize || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setWizardState(prev => ({ ...prev, facilitySize: parseInt(val) || 0 }));
                          }}
                          onFocus={(e) => e.target.select()}
                          className="flex-1 px-5 py-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-gray-800 text-center text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        <button
                          onClick={() => setWizardState(prev => ({ ...prev, facilitySize: prev.facilitySize + 5000 }))}
                          className="p-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-purple-600" />
                        </button>
                      </div>
                      <p className="text-center text-gray-500 mt-2">{preset.unit}</p>
                    </div>
                  </>
                );
              })()}
            </>
          )}
          
          {/* Continue button */}
          <PrimaryButton
            onClick={onContinue}
            disabled={!isFormValid}
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            className="mt-6"
          >
            Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
