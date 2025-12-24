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
        className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg px-5 py-4 transition-all duration-200 group hover:border-purple-400 hover:from-purple-50 hover:to-purple-100 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-semibold text-base">
            Additional Details
          </span>
          <span className="text-gray-600 text-sm font-medium">
            ({advancedQuestions.length} optional questions)
          </span>
        </div>
        {showAdvanced ? (
          <ChevronUp className="w-5 h-5 text-purple-600 transition-all" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600 transition-all" />
        )}
      </button>
      
      {showAdvanced && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
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
    
      // Number/Slider Question - Professional design
      if (isNumber) {
        const numValue = Number(value) || Number(question.default_value) || 0;
        const min = Number(question.min_value) || 0;
        const max = Number(question.max_value) || 1000;
        const step = Number(question.step_value) || (max > 100 ? 10 : 1);
        const isCurrency = question.field_name.includes('bill') || question.field_name.includes('cost') || question.field_name.includes('price');
        
        // Determine unit suffix based on field name
        const getUnit = () => {
          if (question.field_name.includes('room')) return 'rooms';
          if (question.field_name.includes('square') || question.field_name.includes('sqft') || question.field_name.includes('sq_ft')) return 'sq ft';
          if (question.field_name.includes('bed')) return 'beds';
          if (question.field_name.includes('bay')) return 'bays';
          if (question.field_name.includes('port') || question.field_name.includes('charger')) return 'ports';
          if (isCurrency) return 'USD';
          return '';
        };
        
        const unit = getUnit();
        const hasValue = numValue > 0;
        const isValid = numValue >= min && numValue <= max;
        
        // Get appropriate icon
        const getNumberIcon = () => {
          if (question.field_name.includes('room') || question.field_name.includes('bed')) return Building2;
          if (question.field_name.includes('square') || question.field_name.includes('size')) return Building2;
          if (question.field_name.includes('bill') || question.field_name.includes('cost')) return DollarSign;
          if (question.field_name.includes('hour') || question.field_name.includes('time')) return Clock;
          return Info;
        };
        
        const NumberIcon = getNumberIcon();
        
        // Check if this is a property size question (will be rendered in grouped card)
        const isPropertySize = ['roomCount', 'squareFootage', 'bedCount', 'bayCount', 'evChargerCount'].includes(question.field_name);
        
        return (
          <div key={question.field_name} className={isPropertySize ? "mb-0" : "bg-white rounded-lg p-6 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"}>
            {/* Section Header with Icon - only show if not in property size card */}
            {!isPropertySize && (
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <NumberIcon className="w-6 h-6 text-white stroke-[2]" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    {question.question_text}
                  </div>
                  {question.help_text && (
                    <div className="text-sm text-gray-500">{question.help_text}</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Input Group */}
            <div className={isPropertySize ? "space-y-2" : "relative"}>
              {isPropertySize && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.question_text}
                </label>
              )}
              
              {/* Input with +/- buttons and suffix */}
              <div className="relative">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newValue = Math.max(min, numValue - step);
                    handleSelectOption(question, newValue);
                  }}
                  disabled={numValue <= min}
                  className="w-11 h-11 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-600 font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <Minus className="w-5 h-5" />
                </button>
                
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={numValue || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val >= min && val <= max) {
                        handleSelectOption(question, val);
                      }
                    }}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={question.help_text || `Enter ${question.question_text.toLowerCase()}`}
                    className={`w-full px-4 py-3.5 pr-16 border-2 rounded-lg text-base font-semibold text-gray-900 transition-all ${
                      hasValue
                        ? 'bg-blue-50 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                        : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                    }`}
                  />
                  {unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-600 font-semibold pointer-events-none">
                      {unit}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    const newValue = Math.min(max, numValue + step);
                    handleSelectOption(question, newValue);
                  }}
                  disabled={numValue >= max}
                  className="w-11 h-11 bg-blue-50 border-2 border-blue-200 rounded-lg text-blue-600 font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Validation hint when valid */}
              {hasValue && isValid && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">
                    {question.field_name.includes('room') && `${numValue} ${numValue === 1 ? 'room' : 'rooms'} entered`}
                    {question.field_name.includes('square') && `${numValue.toLocaleString()} sq ft entered`}
                    {question.field_name.includes('bed') && `${numValue} ${numValue === 1 ? 'bed' : 'beds'} entered`}
                    {question.field_name.includes('bay') && `${numValue} ${numValue === 1 ? 'bay' : 'bays'} entered`}
                    {!question.field_name.includes('room') && !question.field_name.includes('square') && !question.field_name.includes('bed') && !question.field_name.includes('bay') && 'Value entered'}
                  </span>
                </div>
              )}
              </div>
            </div>
          </div>
        );
      }
    
    // Yes/No Question - Professional dropdown
    if (isYesNo) {
      const isYes = value === true;
      const isNo = value === false;
      
      return (
        <div key={question.field_name} className="bg-white rounded-lg p-6 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle className="w-6 h-6 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-gray-900 mb-1">
                {question.question_text}
              </div>
              {question.help_text && (
                <div className="text-sm text-gray-500">{question.help_text}</div>
              )}
            </div>
          </div>
          <div className="relative">
            <select
              value={isYes ? 'yes' : isNo ? 'no' : ''}
              onChange={(e) => handleYesNo(question, e.target.value === 'yes')}
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-base font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer appearance-none pr-10 hover:border-gray-400"
            >
              <option value="">Select an option...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 pointer-events-none" />
          </div>
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
      
    return (
      <div key={question.field_name} className="bg-white rounded-lg p-6 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <Icon className="w-6 h-6 text-white stroke-[2]" />
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-900 mb-1">
              {question.question_text}
            </div>
            {question.help_text && (
              <div className="text-sm text-gray-500">{question.help_text}</div>
            )}
          </div>
        </div>
        
        {useDropdown ? (
          // Single-select dropdown
          <div className="relative">
            <select
              value={selectedValues || ''}
              onChange={(e) => handleSelectOption(question, e.target.value)}
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-300 rounded-lg text-gray-900 text-base font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none pr-10 hover:border-gray-400"
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
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 pointer-events-none" />
          </div>
        ) : (
          // Multi-select or small option lists: 3 buttons per row
          <div className="grid grid-cols-3 gap-2.5">
            {options.map((opt: any) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const isSelected = isMultiSelect
                ? selectedValues.includes(optValue)
                : selectedValues === optValue;
              
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
                  className={`px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-700 text-white shadow-md hover:from-purple-600 hover:to-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                  }`}
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
          
          {/* Context Bar - Professional with Color */}
          <div className="flex items-center gap-6 px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 mb-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{wizardState.state || 'Location'}</span>
            </div>
            <div className="w-px h-5 bg-blue-300" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{wizardState.industryName || 'Industry'}</span>
            </div>
            <div className="w-px h-5 bg-blue-300" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{standardQuestionsCount} questions</span>
              {advancedQuestions.length > 0 && (
                <span className="text-gray-600 font-medium">+ {advancedQuestions.length} optional</span>
              )}
            </div>
          </div>
          
          {/* Standard Questions - Group property size inputs together */}
          {standardQuestions.length > 0 ? (
            <div className="space-y-4 mb-6">
              {(() => {
                const questions = [...standardQuestions];
                const propertySizeFields = ['roomCount', 'squareFootage', 'bedCount', 'bayCount', 'evChargerCount'];
                const propertySizeQuestions: any[] = [];
                const otherQuestions: any[] = [];
                
                // Separate property size questions from others
                questions.forEach((q: any) => {
                  if (propertySizeFields.includes(q.field_name)) {
                    propertySizeQuestions.push(q);
                  } else {
                    otherQuestions.push(q);
                  }
                });
                
                // Render property size questions in a two-column card if we have them
                return (
                  <>
                    {propertySizeQuestions.length > 0 && (
                      <div className="bg-white rounded-lg p-6 mb-4 border-2 border-blue-200 shadow-md">
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Building2 className="w-6 h-6 text-white stroke-[2]" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">Property Size</div>
                            <div className="text-sm text-gray-500">Enter your facility dimensions</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {propertySizeQuestions.map((question: any, index: number) => renderQuestion(question, index))}
                        </div>
                      </div>
                    )}
                    {/* Render other questions normally */}
                    {otherQuestions.map((question: any, index: number) => renderQuestion(question, index + propertySizeQuestions.length))}
                  </>
                );
              })()}
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

