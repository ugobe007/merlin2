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
  Star
} from 'lucide-react';
import { FACILITY_PRESETS, EQUIPMENT_TIER_OPTIONS, FACILITY_SUBTYPES } from '../constants/wizardConstants';
import type { WizardState, FacilityDetailsSectionProps, EquipmentTier } from '../types/wizardTypes';

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
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Industry
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600">
              <Sparkles className="w-4 h-4" />
              <span>Pre-filled from your calculator</span>
            </div>
          )}
          <div className="text-sm text-gray-400">
            {initializedFromVertical ? 'Step 1 of 4' : 'Step 3 of 6'}
          </div>
        </div>
        
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
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {initializedFromVertical 
              ? <>Confirm your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">{wizardState.industryName || 'facility'}</span> details</>
              : <>Tell us about your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">{wizardState.industryName || 'facility'}</span></>
            }
          </h2>
          <p className="text-gray-300">
            {initializedFromVertical 
              ? 'Review the values below - adjust if needed, then continue'
              : 'This helps Merlin size your system accurately'
            }
          </p>
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
              <div className="space-y-6">
                {filteredQuestions.map((question: any, index: number) => {
                  // Special styling for primaryBESSApplication
                  const isBESSQuestion = question.field_name === 'primaryBESSApplication';
                  
                  return (
                  <div key={question.field_name} className={`rounded-xl p-5 border ${isBESSQuestion ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-purple-50/50 border-purple-100'}`}>
                    {/* Special BESS explanation banner */}
                    {isBESSQuestion && (
                      <div className="mb-4 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-800 font-medium">💡 What is BESS?</p>
                        <p className="text-xs text-emerald-700 mt-1">
                          <strong>Battery Energy Storage Systems (BESS)</strong> store electricity to use later—helping you cut costs, avoid outages, and maximize renewable energy. Choose your primary application below.
                        </p>
                      </div>
                    )}
                    
                    <label className={`block font-medium mb-2 ${isBESSQuestion ? 'text-emerald-800 text-lg' : 'text-gray-700'}`}>
                      {question.question_text}
                      {question.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.help_text && (
                      <p className={`text-sm mb-3 ${isBESSQuestion ? 'text-emerald-600' : 'text-gray-500'}`}>{question.help_text}</p>
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
                    
                    {/* Select input */}
                    {question.question_type === 'select' && question.options && (
                      <div className={`grid gap-3 ${isBESSQuestion ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option: any) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          const isSelected = wizardState.useCaseData[question.field_name] === optionValue;
                          
                          return (
                            <button
                              key={optionValue}
                              onClick={() => setWizardState(prev => ({
                                ...prev,
                                useCaseData: { ...prev.useCaseData, [question.field_name]: optionValue }
                              }))}
                              className={`py-3 px-4 rounded-xl font-medium transition-all text-left ${
                                isBESSQuestion
                                  ? isSelected
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'bg-white border-2 border-emerald-200 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                                  : isSelected
                                    ? 'bg-purple-500 text-white shadow-lg'
                                    : 'bg-white border-2 border-purple-200 text-gray-700 hover:border-purple-400'
                              }`}
                            >
                              {optionLabel}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
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
                        MULTISELECT INPUT (Dec 2025) - Phase 1 Hotel Questionnaire
                        Renders checkboxes for multiple selection (amenities, F&B, etc.)
                        Stores selected values as JSON array in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {(question.question_type === 'multiselect' || question.question_type === 'multi-select') && question.options && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((option: any) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          const optionPower = typeof option === 'object' ? option.powerKw : null;
                          
                          // Get current selections as array
                          const currentSelections: string[] = Array.isArray(wizardState.useCaseData[question.field_name])
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : []);
                          const isSelected = currentSelections.includes(optionValue);
                          
                          return (
                            <label
                              key={optionValue}
                              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                                isSelected
                                  ? 'bg-purple-100 border-purple-400 shadow-sm'
                                  : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
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
                                className="w-5 h-5 mt-0.5 rounded accent-purple-500 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <span className={`font-medium ${isSelected ? 'text-purple-800' : 'text-gray-700'}`}>
                                  {optionLabel}
                                </span>
                                {optionPower && (
                                  <span className="block text-xs text-gray-500 mt-0.5">
                                    +{optionPower} kW
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* ═══════════════════════════════════════════════════════════════════
                        COMPOUND INPUT (Dec 2025) - Phase 1 Hotel Questionnaire
                        Renders nested questions (e.g., F&B with seat counts, EV with charger counts)
                        Each sub-question has enable checkbox + optional numeric input
                        Stores as JSON object in useCaseData
                        ═══════════════════════════════════════════════════════════════════ */}
                    {question.question_type === 'compound' && question.options && (
                      <div className="space-y-3">
                        {(Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]')).map((subQ: any) => {
                          // Get current compound state as object
                          const compoundData: Record<string, any> = typeof wizardState.useCaseData[question.field_name] === 'object'
                            ? wizardState.useCaseData[question.field_name]
                            : (wizardState.useCaseData[question.field_name] ? JSON.parse(wizardState.useCaseData[question.field_name]) : {});
                          
                          const subValue = subQ.value;
                          const isEnabled = compoundData[subValue]?.enabled ?? false;
                          const subAmount = compoundData[subValue]?.amount ?? (subQ.defaultAmount || 0);
                          
                          return (
                            <div 
                              key={subValue}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                isEnabled 
                                  ? 'bg-purple-50 border-purple-300' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
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
                                    className="w-5 h-5 rounded accent-purple-500"
                                  />
                                  <div>
                                    <span className={`font-medium ${isEnabled ? 'text-purple-800' : 'text-gray-600'}`}>
                                      {subQ.label}
                                    </span>
                                    {subQ.powerKw && (
                                      <span className="text-xs text-gray-500 ml-2">
                                        (+{subQ.powerKw} kW base)
                                      </span>
                                    )}
                                  </div>
                                </label>
                                
                                {/* Optional numeric input for sub-question */}
                                {isEnabled && subQ.hasAmount && (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={subQ.minAmount || 0}
                                      max={subQ.maxAmount || 9999}
                                      value={subAmount}
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
                                      className="w-24 px-3 py-2 bg-white border-2 border-purple-300 rounded-lg text-center font-bold text-purple-700 focus:border-purple-500"
                                    />
                                    <span className="text-sm text-gray-500">{subQ.amountUnit || ''}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Help text for sub-question */}
                              {isEnabled && subQ.helpText && (
                                <p className="text-xs text-gray-500 mt-2 ml-8">{subQ.helpText}</p>
                              )}
                            </div>
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
          <button
            onClick={onContinue}
            disabled={!isFormValid}
            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
