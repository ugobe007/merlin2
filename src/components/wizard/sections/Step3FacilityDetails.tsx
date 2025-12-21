/**
 * STEP 3: FACILITY DETAILS - CLEAN REDESIGN
 * ==========================================
 * 
 * Updated: December 2025 - Clean, minimal design matching HTML reference
 * 
 * Features:
 * - Compact progress header
 * - Clean page header with badge
 * - Context bar
 * - White question cards
 * - Yes/No button styling
 * - Progress ring in bottom nav
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle, Info, Building2, Users, Clock, DollarSign, Zap,
  ChevronLeft, ChevronRight, Check, X, ChevronDown, ChevronUp, Settings, Minus, Plus
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { FloatingNavigationArrows, ProgressRing, MerlinGreeting, FloatingSolarButton } from '../shared';
import { SolarOpportunityModal } from '../modals';

interface Step3FacilityDetailsProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  initializedFromVertical?: boolean;
  onBack: () => void;
  onHome?: () => void;
  onContinue: () => void;
  sectionRef?: React.RefObject<HTMLDivElement> | ((el: HTMLDivElement | null) => void);
  isHidden?: boolean;
  currentSection?: number;
}

// Advanced Questions Collapsible Component
function AdvancedQuestionsSection({ 
  advancedQuestions, 
  standardQuestionsCount, 
  renderQuestion 
}: { 
  advancedQuestions: any[]; 
  standardQuestionsCount: number; 
  renderQuestion: (question: any, index: number) => React.ReactNode;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="mt-6">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl px-4 py-3 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          <span className="text-white font-semibold text-base">
            Additional Details
          </span>
          <span className="text-white/50 text-sm">
            ({advancedQuestions.length} optional questions)
          </span>
        </div>
        {showAdvanced ? (
          <ChevronUp className="w-5 h-5 text-white/70 group-hover:text-white transition-all" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-white transition-all" />
        )}
      </button>
      
      {showAdvanced && (
        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {advancedQuestions.map((question: any, index: number) => 
            renderQuestion(question, index + standardQuestionsCount)
          )}
        </div>
      )}
    </div>
  );
}

export function Step3FacilityDetails({
  wizardState,
  setWizardState,
  initializedFromVertical = false,
  onBack,
  onHome,
  onContinue,
  sectionRef,
  isHidden = false,
  currentSection,
}: Step3FacilityDetailsProps) {
  
  // Filter questions - exclude grid/EV handled elsewhere
  // IMPORTANT: If Step 2 already asked about EV/solar, exclude those fields to prevent duplicates
  const excludedFields = [
    'gridCapacityKW', 'gridSavingsGoal', 'gridImportLimit', 'annualGridFees',
    'gridReliabilityIssues', 'offGridReason', 'annualOutageHours',
    'hasEVCharging', 'evChargerCount', 'evChargerStatus', 'evChargingPower',
    // EV fields that might be in questionnaires - exclude to prevent duplicates if Step 2 handled them
    'wantsEVCharging', 'existingEVChargers', 'existingEVL1', 'existingEVL2', 'existingEVL3',
    'evChargersL2', 'evChargersDCFC', 'evChargersHPC', 'level1Count', 'level2Count', 
    'level2Chargers', 'dcfc50kwChargers', 'dcfc150kwChargers',
    // Solar fields that might be in questionnaires - exclude to prevent duplicates if Step 2 handled them  
    'wantsSolar', 'existingSolarKW', 'hasExistingSolar'
  ];
  
  const customQuestions = Array.isArray(wizardState.customQuestions) ? wizardState.customQuestions : [];
  
  // Split into standard (1-16) and advanced (17+) questions
  const standardQuestions = customQuestions.filter(
    (q: any) => q && !excludedFields.includes(q.field_name) && (q.is_advanced !== true)
  );
  
  const advancedQuestions = customQuestions.filter(
    (q: any) => q && !excludedFields.includes(q.field_name) && q.is_advanced === true
  );
  
  // For backward compatibility, use filteredQuestions (standard + advanced combined)
  const filteredQuestions = [...standardQuestions, ...advancedQuestions];
  
  // DEBUG: Log question counts to help identify missing questions
  useEffect(() => {
    if (wizardState.selectedIndustry && customQuestions.length > 0) {
      console.log(`🔍 [Step3] Question Debug for ${wizardState.selectedIndustry}:`, {
        totalInDatabase: customQuestions.length,
        excluded: customQuestions.filter((q: any) => excludedFields.includes(q.field_name)).length,
        displayed: filteredQuestions.length,
        excludedFieldNames: customQuestions
          .filter((q: any) => excludedFields.includes(q.field_name))
          .map((q: any) => q.field_name || q.question_text),
        allQuestionFields: customQuestions.map((q: any) => q.field_name || q.id),
        displayedQuestionFields: filteredQuestions.map((q: any) => q.field_name || q.id)
      });
    } else if (wizardState.selectedIndustry) {
      console.warn(`⚠️ [Step3] No custom questions loaded for ${wizardState.selectedIndustry} - useCaseId: ${wizardState.useCaseId}`);
    }
  }, [wizardState.selectedIndustry, wizardState.useCaseId, customQuestions.length, filteredQuestions.length]);
  
  // ============================================
  // PERFORMANCE OPTIMIZATION: Local state only
  // Collect answers first, calculate once on Continue
  // ============================================
  
  // Local state for instant UI updates (NO calculations triggered)
  // MUST be declared before any useMemo that uses it
  const [localAnswers, setLocalAnswers] = useState<Record<string, any>>(
    wizardState.useCaseData || {}
  );
  
  // Solar Opportunity Modal state
  const [showSolarOpportunityModal, setShowSolarOpportunityModal] = useState(false);
  
  // Initialize local answers from wizardState on mount
  useEffect(() => {
    if (wizardState.useCaseData) {
      setLocalAnswers(wizardState.useCaseData);
    }
  }, []); // Only on mount
  
  // Calculate answered questions (use localAnswers for immediate feedback)
  const answeredCount = useMemo(() => {
    let count = 0;
    filteredQuestions.forEach((q: any) => {
      const value = localAnswers[q.field_name] ?? wizardState.useCaseData[q.field_name];
      if (value !== undefined && value !== null && value !== '') count++;
    });
    return count;
  }, [localAnswers, wizardState.useCaseData, filteredQuestions]);
  
  // Total questions (standard + advanced) for progress calculation
  const totalQuestions = filteredQuestions.length;
  // Standard questions count for context bar
  const standardQuestionsCount = standardQuestions.length;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  // Estimate peak kW (use localAnswers for immediate feedback, but this is just for display)
  const estimatedKW = useMemo(() => {
    const industry = wizardState.selectedIndustry;
    const data = { ...wizardState.useCaseData, ...localAnswers }; // Merge for display estimate
    
    if (industry === 'hotel') {
      const rooms = data.roomCount || 100;
      return Math.round(rooms * 0.45 + 25);
    }
    if (industry === 'car-wash') {
      const bays = data.bayCount || 4;
      return Math.round(bays * 30 + 15);
    }
    if (industry === 'ev-charging') {
      const ports = data.evChargerCount || 10;
      return Math.round(ports * 50);
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
    
    return Math.round((data.squareFootage || 25000) * 0.01);
  }, [wizardState.selectedIndustry, localAnswers, wizardState.useCaseData]);
  
  // Check if form is valid (use localAnswers for immediate feedback)
  const isFormValid = useMemo(() => {
    return !filteredQuestions.some((q: any) => {
      if (!q.is_required) return false;
      const value = localAnswers[q.field_name] ?? wizardState.useCaseData[q.field_name];
      return value === undefined || value === null || value === '';
    });
  }, [filteredQuestions, localAnswers, wizardState.useCaseData]);
  
  // Initialize local answers from wizardState on mount
  useEffect(() => {
    if (wizardState.useCaseData) {
      setLocalAnswers(wizardState.useCaseData);
    }
  }, []); // Only on mount
  
  // Update local state immediately (INSTANT - no calculations!)
  const handleSelectOption = (question: any, value: any) => {
    setLocalAnswers(prev => ({ ...prev, [question.field_name]: value }));
    // NO setWizardState call = NO recalculation triggered
  };
  
  const handleYesNo = (question: any, value: boolean) => {
    setLocalAnswers(prev => ({ ...prev, [question.field_name]: value }));
    // NO setWizardState call = NO recalculation triggered
  };
  
  // Sync to wizardState ONLY when Continue is clicked (triggers calculation once)
  const handleContinue = () => {
    // Sync all local answers to wizardState
    setWizardState(prev => ({
      ...prev,
      useCaseData: { ...prev.useCaseData, ...localAnswers }
    }));
    // Now call the parent's onContinue, which will trigger calculations
    onContinue();
  };
  
  const renderQuestion = (question: any, index: number) => {
    // Use localAnswers for immediate UI feedback, fallback to wizardState
    const value = localAnswers[question.field_name] ?? wizardState.useCaseData[question.field_name];
    const isYesNo = question.question_type === 'boolean' || question.field_name.toLowerCase().includes('have') || question.field_name.toLowerCase().includes('has');
    const isNumber = question.question_type === 'number' || question.question_type === 'slider';
    
    // Number/Slider Question - Compact design with +/- buttons and input
    if (isNumber) {
      const numValue = Number(value) || Number(question.default_value) || 0;
      const min = Number(question.min_value) || 0;
      const max = Number(question.max_value) || 1000;
      const step = Number(question.step_value) || (max > 100 ? 10 : 1);
      const isCurrency = question.field_name.includes('bill') || question.field_name.includes('cost') || question.field_name.includes('price');
      
      return (
        <div key={question.field_name} className="bg-gradient-to-br from-blue-100/90 to-purple-100/90 rounded-xl p-4 mb-3 border border-blue-200/60 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#1e293b] mb-1">
                {question.question_text}
              </div>
              {question.help_text && (
                <div className="text-xs text-[#64748b]">{question.help_text}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newValue = Math.max(min, numValue - step);
                handleSelectOption(question, newValue);
              }}
              className="w-10 h-10 bg-white border-2 border-purple-200 rounded-lg text-purple-700 font-bold text-lg hover:bg-purple-50 hover:border-purple-400 transition-colors shadow-sm flex items-center justify-center"
            >
              −
            </button>
            <input
              type="number"
              value={numValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val) && val >= min && val <= max) {
                  handleSelectOption(question, val);
                }
              }}
              min={min}
              max={max}
              step={step}
              className="flex-1 px-4 py-2.5 bg-white border-2 border-purple-200 rounded-lg text-center text-base font-semibold text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors shadow-sm"
            />
            <button
              onClick={() => {
                const newValue = Math.min(max, numValue + step);
                handleSelectOption(question, newValue);
              }}
              className="w-10 h-10 bg-white border-2 border-purple-200 rounded-lg text-purple-700 font-bold text-lg hover:bg-purple-50 hover:border-purple-400 transition-colors shadow-sm flex items-center justify-center"
            >
              +
            </button>
            {isCurrency && (
              <span className="text-sm font-semibold text-gray-700">USD</span>
            )}
          </div>
          {isCurrency && (
            <div className="mt-2 text-right text-xs text-gray-600">
              {numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          )}
        </div>
      );
    }
    
    // Yes/No Question - Use dropdown if 2 options, otherwise buttons
    if (isYesNo) {
      const isYes = value === true;
      const isNo = value === false;
      
      return (
        <div key={question.field_name} className="bg-gradient-to-br from-blue-100/90 to-purple-100/90 rounded-xl p-4 mb-3 border border-blue-200/60 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#1e293b] mb-1">
                {question.question_text}
              </div>
              {question.help_text && (
                <div className="text-xs text-[#64748b]">{question.help_text}</div>
              )}
            </div>
          </div>
          
          {/* Use dropdown for Yes/No to save space */}
          <select
            value={isYes ? 'yes' : isNo ? 'no' : ''}
            onChange={(e) => handleYesNo(question, e.target.value === 'yes')}
            className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-lg text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors shadow-sm"
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      );
    }
    
    // Select/Multi-select Question
    const options = question.options || [];
    const isMultiSelect = question.question_type === 'multiselect' || question.question_type === 'multi-select' || question.question_type === 'checkbox';
    const selectedValues = isMultiSelect 
      ? (Array.isArray(value) ? value : (value ? [value] : []))
      : value;
    
    const getIcon = () => {
      if (question.field_name.includes('size') || question.field_name.includes('square')) return Building2;
      if (question.field_name.includes('building') || question.field_name.includes('number')) return Building2;
      if (question.field_name.includes('population') || question.field_name.includes('student')) return Users;
      if (question.field_name.includes('schedule') || question.field_name.includes('hours')) return Clock;
      if (question.field_name.includes('bill') || question.field_name.includes('cost')) return DollarSign;
      if (question.field_name.includes('application') || question.field_name.includes('goal')) return Zap;
      return Info;
    };
    
    const Icon = getIcon();
    
    // Use dropdown for single-select questions with many options (save space)
    const useDropdown = !isMultiSelect && options.length > 5;
    
    // Determine panel tint color based on question type (light blue, purple, or orange - no grey, more vibrant)
    let panelTint = 'from-purple-100/90 to-indigo-100/90 border-purple-200/60';
    if (question.field_name.includes('amenities') || question.field_name?.toLowerCase().includes('amenity')) {
      panelTint = 'from-blue-100/90 to-cyan-100/90 border-blue-200/60';
    } else if (question.field_name.includes('food') || question.field_name.includes('beverage') || question.field_name?.toLowerCase().includes('f&b')) {
      panelTint = 'from-orange-100/90 to-amber-100/90 border-orange-200/60';
    } else if (question.field_name.includes('square') || question.field_name.includes('size') || question.field_name.includes('room') || question.field_name.includes('bed')) {
      panelTint = 'from-blue-100/90 to-purple-100/90 border-blue-200/60';
    }
      
    return (
      <div key={question.field_name} className={`bg-gradient-to-br ${panelTint} rounded-xl p-4 mb-3 border shadow-sm`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-white stroke-[2]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[#1e293b] mb-1">
              {question.question_text}
            </div>
            {question.help_text && (
              <div className="text-xs text-[#64748b]">{question.help_text}</div>
            )}
          </div>
        </div>
        
        {useDropdown ? (
          // Single-select dropdown for space efficiency
          <select
            value={selectedValues || ''}
            onChange={(e) => handleSelectOption(question, e.target.value)}
            className="w-full px-4 py-2.5 bg-white border-2 border-purple-200 rounded-lg text-sm font-semibold text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors shadow-sm"
          >
            <option value="">Select an option...</option>
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={optValue} value={optValue}>{optLabel}</option>
              );
            })}
          </select>
        ) : (
          // Multi-select or small option lists: 3 buttons per row (smaller)
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = isMultiSelect
                ? selectedValues.includes(optValue)
                : selectedValues === optValue;
              
              // Determine color scheme based on question type
              let gradientClasses = '';
              if (question.field_name.includes('amenities') || question.field_name?.toLowerCase().includes('amenity')) {
                gradientClasses = isSelected 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-600 text-white shadow-md'
                  : 'bg-white border-blue-200 text-blue-800 hover:border-blue-400 hover:bg-blue-50 shadow-sm';
              } else if (question.field_name.includes('food') || question.field_name.includes('beverage') || question.field_name?.toLowerCase().includes('f&b')) {
                gradientClasses = isSelected
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-600 text-white shadow-md'
                  : 'bg-white border-orange-200 text-orange-800 hover:border-orange-400 hover:bg-orange-50 shadow-sm';
              } else {
                gradientClasses = isSelected
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 border-purple-600 text-white shadow-md'
                  : 'bg-white border-purple-200 text-purple-800 hover:border-purple-400 hover:bg-purple-50 shadow-sm';
              }
              
              return (
                <button
                  key={optValue}
                  onClick={() => {
                    if (isMultiSelect) {
                      const newValues = isSelected
                        ? selectedValues.filter((v: any) => v !== optValue)
                        : [...selectedValues, optValue];
                      handleSelectOption(question, newValues);
                    } else {
                      handleSelectOption(question, optValue);
                    }
                  }}
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${gradientClasses}`}
                >
                  <span className="truncate text-xs">{optLabel}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  if (isHidden) return null;
  
  // Action instructions for Step 3
  const actionInstructions = [
    `Answer ${totalQuestions} questions about your ${wizardState.industryName || 'facility'}`,
    'Select options that match your building and equipment',
    'Click Continue when finished'
  ];
  
  return (
    <>
      {/* Floating Navigation Arrows */}
      <FloatingNavigationArrows
        canGoBack={true}
        canGoForward={isFormValid}
        onBack={onBack}
        onForward={onContinue}
        backLabel="Back to Industry Selection"
        forwardLabel="Continue to Magic Fit"
      />
      
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
        className="min-h-screen bg-[#0f172a] pb-[120px]"
    >
        <div className="max-w-[1000px] mx-auto px-6 py-6">
        
          {/* MerlinGreeting - Condensed Format */}
          <MerlinGreeting
            stepNumber={3}
            totalSteps={5}
            stepTitle="Facility Details"
            stepDescription="Tell me about your existing equipment and what you'd like to add. I'll analyze your facility data to recommend the perfect energy solution."
            estimatedTime="2-3 min"
            actionInstructions={actionInstructions}
            nextStepPreview="Next, I'll show you 3 optimized configurations based on your answers"
            isComplete={isFormValid}
            onCompleteMessage={isFormValid ? `Perfect! You've answered ${answeredCount} of ${totalQuestions} questions. Use the right arrow to continue to Magic Fit.` : undefined}
          />
          
          {/* Context Bar */}
          <div className="flex items-center gap-4 px-4 py-3 bg-white/3 rounded-[10px] mb-6 text-[13px] text-white/60">
            <div className="flex items-center gap-1.5">
              🏛️ {wizardState.state || 'Location'}
            </div>
            <div className="flex items-center gap-1.5">
              🎓 {wizardState.industryName || 'Industry'}
            </div>
            <div className="flex items-center gap-1.5 text-[#FBBF24] font-semibold">
              📋 {standardQuestionsCount} questions{advancedQuestions.length > 0 && ` + ${advancedQuestions.length} optional`}
            </div>
          </div>
          
          {/* Standard Questions */}
          {standardQuestions.length > 0 ? (
            <div className="space-y-3 mb-6">
              {standardQuestions.map((question: any, index: number) => renderQuestion(question, index))}
            </div>
          ) : null}
          
          {/* Advanced Questions - Collapsible Section */}
          {advancedQuestions.length > 0 && (
            <AdvancedQuestionsSection 
              advancedQuestions={advancedQuestions}
              standardQuestionsCount={standardQuestionsCount}
              renderQuestion={renderQuestion}
            />
          )}
          
          {/* No Questions Fallback */}
          {filteredQuestions.length === 0 && (
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Info className="w-5 h-5 text-white/70" />
                <p className="text-white/80 font-medium">No additional questions for this industry</p>
              </div>
              <p className="text-white/60 text-sm">You can proceed to the next step.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Nav - Will be handled by WizardBottomNav in StreamlinedWizard */}
      
      {/* Floating Solar Button - Shows when solar opportunity exists */}
      <FloatingSolarButton
        wizardState={wizardState}
        onOpen={() => setShowSolarOpportunityModal(true)}
        position="left"
      />
      
      {/* Solar Opportunity Modal */}
      <SolarOpportunityModal
        show={showSolarOpportunityModal}
        onClose={() => setShowSolarOpportunityModal(false)}
        wizardState={wizardState}
        facilityType={wizardState.selectedIndustry || 'default'}
        facilityName={wizardState.industryName || 'facility'}
        currentSolarKW={wizardState.existingSolarKW || 0}
        onSave={(constraints) => {
          setWizardState(prev => ({
            ...prev,
            physicalConstraints: constraints,
          }));
        }}
      />
    </>
  );
}

