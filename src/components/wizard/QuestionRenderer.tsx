import React, { useState, useEffect } from 'react';
import { Users, Truck, MapPin, Route } from 'lucide-react';
import type { Question } from '@/data/carwash-questions.config';
import { getQuestionIcon, isImageIcon, isSvgIcon, QUESTION_ICON_MAP, type IconConfig } from './QuestionIconMap';
import { 
  BlowerIcon, 
  HeatedDryerIcon, 
  NoDryerIcon, 
  GasFlameIcon, 
  ElectricIcon, 
  FullReclaimIcon, 
  PartialReclaimIcon, 
  NoReclaimIcon,
  SnowflakeIcon
} from '@/components/icons/MerlinIcons';

interface QuestionRendererProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  showValidation?: boolean;
  onAdjustingChange?: (isAdjusting: boolean) => void; // Signal when user is actively adjusting (smart input +/-)
}

export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  showValidation = false,
  onAdjustingChange
}: QuestionRendererProps) {
  // Get icon for question
  const questionIcon = getQuestionIcon(question.field, question.question);
  
  return (
    <div 
      className="question-container" 
      data-question={question.field}
      data-testid={`question-${question.field}`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Question Header - VINEET'S STYLE: Clean, prominent, not overwhelming */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 leading-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          {question.question}
        </h2>
        {question.helpText && (
          <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {question.helpText}
          </p>
        )}
      </div>
      
      {/* Clear Answer Prompt - VINEET'S STYLE: Subtle, not intrusive */}
      <div className="mb-5 p-3 bg-purple-600/10 border border-purple-600/20 rounded-lg">
        <div className="flex items-center gap-2">
          {typeof questionIcon === 'object' && isSvgIcon(questionIcon) ? (
            React.createElement(questionIcon.value, { className: "w-5 h-5 text-purple-300" })
          ) : typeof questionIcon === 'object' && isImageIcon(questionIcon) ? (
            <img 
              src={typeof questionIcon.value === 'string' ? questionIcon.value : ''} 
              alt={questionIcon.alt || 'Icon'} 
              className="w-5 h-5 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          ) : (
            <span className="text-lg">{typeof questionIcon === 'string' ? questionIcon : '❓'}</span>
          )}
          <p className="text-purple-300 text-xs font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Select your answer below
          </p>
        </div>
      </div>

      {/* Question Input - Rendered by Type */}
      <div className="question-input mb-6">
        {question.type === 'buttons' && (
          <ButtonsQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'slider' && (
          <SliderQuestion 
            question={question} 
            value={value} 
            onChange={onChange}
            onAdjustingChange={onAdjustingChange}
          />
        )}
        
        {question.type === 'number_buttons' && (
          <NumberButtonsQuestion 
            question={question} 
            value={value} 
            onChange={onChange}
            onAdjustingChange={onAdjustingChange}
          />
        )}
        
        {question.type === 'toggle' && (
          <ToggleQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'area_input' && (
          <AreaInputQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'increment_box' && (
          <IncrementBoxQuestion 
            question={question} 
            value={value} 
            onChange={onChange}
            onAdjustingChange={onAdjustingChange}
          />
        )}
        
        {question.type === 'multiselect' && (
          <MultiselectQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {/* Fallback for unknown question types */}
        {!['buttons', 'slider', 'number_buttons', 'toggle', 'area_input', 'increment_box', 'multiselect'].includes(question.type) && (
          <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 font-semibold mb-2">⚠️ Unsupported Question Type</p>
            <p className="text-slate-300 text-sm">
              Question type "{question.type}" is not yet supported. Please contact support.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Question: {question.question} | Field: {question.field}
            </p>
          </div>
        )}
      </div>

      {/* Note: Merlin Tip removed - now shown in left sidebar (MerlinEnergyAdvisor) */}

      {/* Validation Error */}
      {showValidation && !value && (
        <div className="mt-4 text-red-400 text-sm">
          This field is required
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUTTONS QUESTION
// ============================================================================

function ButtonsQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [];
  
  // Check if this is EV Charging Hub use case question (hubType or similar)
  const isEvChargingHub = question.field === 'hubType' || 
                          question.field === 'useCaseType' || 
                          question.field === 'chargingUseCase' ||
                          question.question.toLowerCase().includes('charging use case') ||
                          question.question.toLowerCase().includes('charging hub');
  
  // VINEET'S DESIGN: Goal card style - 2x3 grid, compact, elegant
  // EV Charging Hub uses 2-column grid for large cards, others use compact grid
  const gridCols = isEvChargingHub 
    ? 'grid-cols-1 md:grid-cols-2' 
    : options.length <= 4 ? 'grid-cols-2' : 'grid-cols-2';
  const gapClass = isEvChargingHub ? 'gap-6' : 'gap-2.5';
  
  return (
    <div className={`grid ${gridCols} ${gapClass}`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        
        // Get icon for this option
        // PRIORITY: 1. Check option.value + question.field context mapping (car wash specific)
        //           2. Check option.value mapping (generic)
        //           3. Check option.icon as a key in QUESTION_ICON_MAP
        //           4. Fallback to question field icon
        let displayIcon: IconConfig | string | null = null;
        
        // FIRST: Check context-specific mappings (option.value + question.field combination)
        if (option.value && typeof option.value === 'string' && question.field) {
          const valueKey = option.value.toLowerCase();
          const fieldKey = question.field.toLowerCase();
          
          // Car Wash context-specific icon mappings based on question field + option value
          if (fieldKey === 'blowertype' || fieldKey === 'blower_type') {
            if (valueKey === 'none') {
              displayIcon = { type: 'svg', value: NoDryerIcon, alt: 'No Dryers (Air Dry)' };
            } else if (valueKey === 'standard_4') {
              displayIcon = { type: 'svg', value: BlowerIcon, alt: 'Standard 4 Blowers' };
            } else if (valueKey === 'premium_6') {
              displayIcon = { type: 'svg', value: BlowerIcon, alt: 'Premium 6+ Blowers' };
            } else if (valueKey === 'heated') {
              displayIcon = { type: 'svg', value: HeatedDryerIcon, alt: 'Heated Dryers' };
            }
          } else if (fieldKey === 'waterheatertype' || fieldKey === 'water_heater_type') {
            if (valueKey === 'gas') {
              displayIcon = { type: 'svg', value: GasFlameIcon, alt: 'Natural Gas' };
            } else if (valueKey === 'electric') {
              displayIcon = { type: 'svg', value: ElectricIcon, alt: 'Electric' };
            } else if (valueKey === 'none') {
              displayIcon = { type: 'svg', value: SnowflakeIcon, alt: 'No Heated Water' };
            }
          } else if (fieldKey === 'waterreclaim' || fieldKey === 'water_reclaim') {
            if (valueKey === 'full') {
              displayIcon = { type: 'svg', value: FullReclaimIcon, alt: 'Full Reclaim System' };
            } else if (valueKey === 'partial') {
              displayIcon = { type: 'svg', value: PartialReclaimIcon, alt: 'Partial Reclaim' };
            } else if (valueKey === 'none') {
              displayIcon = { type: 'svg', value: NoReclaimIcon, alt: 'No Reclaim (Fresh Water Only)' };
            }
          } else if (fieldKey === 'hasnaturalgas' || fieldKey === 'has_natural_gas') {
            if (valueKey === 'yes' || valueKey === 'true') {
              displayIcon = '✅';
            } else if (valueKey === 'no' || valueKey === 'false') {
              displayIcon = '❌';
            } else if (valueKey === 'unknown') {
              displayIcon = '❓';
            }
          }
        }
        
        // SECOND: If no context-specific mapping, check generic option.value mapping
        if (!displayIcon && option.value && typeof option.value === 'string') {
          const valueKey = option.value.toLowerCase();
          const valueSnakeCase = valueKey.replace(/-/g, '_');
          const valueCamelCase = valueKey.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
          
          // Check various formats of the option value
          if (QUESTION_ICON_MAP[valueKey]) {
            displayIcon = QUESTION_ICON_MAP[valueKey];
          } else if (QUESTION_ICON_MAP[valueSnakeCase]) {
            displayIcon = QUESTION_ICON_MAP[valueSnakeCase];
          } else if (QUESTION_ICON_MAP[valueCamelCase]) {
            displayIcon = QUESTION_ICON_MAP[valueCamelCase];
          } else {
            // Try pattern matching on the value
            const valueIcon = getQuestionIcon(valueKey, option.label || '');
            if (valueIcon !== '❓') {
              displayIcon = valueIcon;
            }
          }
        }
        
        // SECOND: If no value mapping found, check option.icon
        if (!displayIcon && option.icon && typeof option.icon === 'string') {
          const iconKey = option.icon;
          const snakeCaseKey = iconKey.replace(/([A-Z])/g, '_$1').toLowerCase();
          
          // Skip if it's clearly an emoji (we prefer value-based mapping for car wash)
          const isEmoji = iconKey.length <= 2 || /[\p{Emoji}]/u.test(iconKey);
          
          if (!isEmoji && QUESTION_ICON_MAP[iconKey]) {
            displayIcon = QUESTION_ICON_MAP[iconKey];
          } else if (!isEmoji && QUESTION_ICON_MAP[snakeCaseKey]) {
            displayIcon = QUESTION_ICON_MAP[snakeCaseKey];
          } else if (!isEmoji) {
            // Try getQuestionIcon as fallback (handles pattern matching)
            const iconFromMap = getQuestionIcon(iconKey, '');
            if (iconFromMap !== '❓') {
              displayIcon = iconFromMap;
            } else if (isEmoji) {
              // Use emoji as last resort (but prefer value-based mapping)
              displayIcon = option.icon;
            }
          } else if (isEmoji && !displayIcon) {
            // Only use emoji if we haven't found a better icon from value mapping
            displayIcon = option.icon;
          }
        }
        
        // THIRD: Final fallback to question field icon
        if (!displayIcon) {
          displayIcon = getQuestionIcon(question.field, question.question);
        }
        
        // EV Charging Hub: PROFESSIONAL REDESIGN (Option 1 - Full Featured)
        if (isEvChargingHub) {
          // Map option values to category metadata
          const getCategoryInfo = (value: string, label: string) => {
            const valueLower = value.toLowerCase();
            const labelLower = label.toLowerCase();
            
            // Map based on value or label
            if (valueLower.includes('public') || labelLower.includes('public') || labelLower.includes('users')) {
              return {
                icon: Users,
                title: 'Public Charging',
                subtitle: 'Open to all EV drivers',
                description: option.description || 'Shopping centers, parking garages, street parking'
              };
            }
            if (valueLower.includes('fleet') || labelLower.includes('fleet') || labelLower.includes('truck')) {
              return {
                icon: Truck,
                title: 'Fleet Depot',
                subtitle: 'Commercial/delivery vehicles',
                description: option.description || 'Return-to-base charging for commercial fleets'
              };
            }
            if (valueLower.includes('destination') || labelLower.includes('destination') || labelLower.includes('mappin')) {
              return {
                icon: MapPin,
                title: 'Destination Charging',
                subtitle: 'Hotel, retail, workplace',
                description: option.description || 'Extended stay locations, 2-8 hour dwell time'
              };
            }
            if (valueLower.includes('corridor') || valueLower.includes('highway') || labelLower.includes('corridor') || labelLower.includes('route')) {
              return {
                icon: Route,
                title: 'Highway Corridor',
                subtitle: 'Travel stop, high-speed charging',
                description: option.description || 'Fast charging for long-distance travel'
              };
            }
            
            // Default fallback
            return {
              icon: Users,
              title: option.label || 'EV Charging',
              subtitle: option.description || '',
              description: ''
            };
          };

          const categoryInfo = getCategoryInfo(option.value, option.label);
          const IconComponent = categoryInfo.icon;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                group relative p-8 rounded-2xl text-left transition-all duration-200
                ${isSelected 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl shadow-purple-500/30 scale-[1.02]' 
                  : 'bg-slate-800/50 hover:bg-slate-800 hover:scale-[1.01] border border-slate-700 hover:border-purple-500/50'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className={`
                inline-flex p-4 rounded-xl mb-6 transition-colors
                ${isSelected 
                  ? 'bg-white/20' 
                  : 'bg-purple-500/10 group-hover:bg-purple-500/20'
                }
              `}>
                <IconComponent 
                  className={`
                    w-8 h-8 transition-colors
                    ${isSelected ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'}
                  `}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className={`
                  text-2xl font-bold transition-colors
                  ${isSelected ? 'text-white' : 'text-white group-hover:text-purple-200'}
                `}>
                  {categoryInfo.title}
                </h3>
                
                <p className={`
                  text-base font-medium transition-colors
                  ${isSelected ? 'text-purple-100' : 'text-slate-400 group-hover:text-slate-300'}
                `}>
                  {categoryInfo.subtitle}
                </p>
                
                {categoryInfo.description && (
                  <p className={`
                    text-sm transition-colors pt-2
                    ${isSelected ? 'text-purple-200' : 'text-slate-500 group-hover:text-slate-400'}
                  `}>
                    {categoryInfo.description}
                  </p>
                )}
              </div>

              {/* Hover Glow Effect */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5" />
                </div>
              )}
            </button>
          );
        }
        
        // Default styling - PREMIUM BANNER-STYLE DESIGN (like Smart Wizard button)
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              minHeight: '110px',
              padding: '20px 24px',
              borderRadius: '20px',
              ...(isSelected ? {
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.5) 0%, rgba(139, 92, 246, 0.45) 50%, rgba(124, 58, 237, 0.5) 100%)',
                border: '1.5px solid rgba(147, 197, 253, 0.8)',
                boxShadow: '0 8px 32px rgba(96, 165, 250, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                animation: 'pulseGlowBlue 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              } : {
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%)',
                border: '1px solid rgba(71, 85, 105, 0.4)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
              })
            }}
          >
            {/* Content - Left-aligned like banner (SINGLE TITLE, no duplicates) */}
            <div className="relative z-10 flex flex-col h-full text-left">
              {/* Icon and Title Row */}
              <div className="flex items-center gap-3 mb-2">
                {/* Icon with gradient effect */}
                <div className="relative flex-shrink-0">
                  {typeof displayIcon === 'object' && isSvgIcon(displayIcon) ? (
                    <div className="relative">
                      {React.createElement(displayIcon.value, { 
                        className: `w-10 h-10 ${isSelected ? 'text-purple-300' : 'text-purple-400'}` 
                      })}
                      {/* White highlight on left edge */}
                      {isSelected && (
                        <div 
                          className="absolute left-0 top-0 w-2 h-full"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4), transparent)',
                            borderRadius: '4px 0 0 4px'
                          }}
                        />
                      )}
                    </div>
                  ) : typeof displayIcon === 'object' && isImageIcon(displayIcon) ? (
                    <div className="relative">
                      <img 
                        src={typeof displayIcon.value === 'string' ? displayIcon.value : ''} 
                        alt={displayIcon.alt || 'Icon'} 
                        className="w-10 h-10 object-contain"
                        style={{ 
                          filter: 'brightness(0) invert(1)',
                          opacity: isSelected ? 1 : 0.9
                        }}
                      />
                      {/* White highlight on left edge */}
                      {isSelected && (
                        <div 
                          className="absolute left-0 top-0 w-2 h-full"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.4), transparent)',
                            borderRadius: '4px 0 0 4px'
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <span 
                        className="text-3xl block"
                        style={{ 
                          backgroundImage: isSelected 
                            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {typeof displayIcon === 'string' ? displayIcon : '❓'}
                      </span>
                      {/* White highlight on left edge for emoji */}
                      {isSelected && (
                        <div 
                          className="absolute left-0 top-0 w-1 h-full opacity-50"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.6), transparent)'
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
                
                {/* SINGLE Title - Always use label, never duplicate */}
                <span 
                  className="text-lg font-bold"
                  style={{ 
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    letterSpacing: '-0.01em',
                    lineHeight: '1.3'
                  }}
                >
                  {option.label}
                </span>
              </div>
              
              {/* Description - Only show if description exists and is meaningful */}
              {option.description && (
                <span 
                  className="text-xs leading-relaxed mb-3 block mt-1"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.75)',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {option.description}
                </span>
              )}
              
              {/* Selected badge - Bottom right */}
              <div className="mt-auto flex items-center justify-end gap-2">
                <div 
                  className="rounded-full flex items-center justify-center transition-all"
                  style={{
                    width: '18px',
                    height: '18px',
                    ...(isSelected ? {
                      background: 'rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    } : {
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.25)'
                    })
                  }}
                >
                  {isSelected && (
                    <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <span 
                  className="text-xs font-medium"
                  style={{ 
                    color: '#ffffff',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
                    opacity: 0.9
                  }}
                >
                  {isSelected ? 'Selected' : 'Click to select'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SLIDER QUESTION
// ============================================================================

function SliderQuestion({ question, value, onChange, onAdjustingChange }: QuestionRendererProps) {
  const range = question.range!;
  const rangeWithStep = { ...range, step: range.step ?? 1 }; // Ensure step is always defined
  const currentValue = value || question.smartDefault;
  const sliderAdjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  // Calculate percentage for gradient
  const percentage = ((currentValue - range.min) / (range.max - range.min)) * 100;
  
  const clearSliderTimeout = () => {
    if (sliderAdjustmentTimeoutRef.current) {
      clearTimeout(sliderAdjustmentTimeoutRef.current);
      sliderAdjustmentTimeoutRef.current = null;
    }
  };
  
  // CRITICAL FIX: Handle mouse down - user starts dragging
  const handleMouseDown = () => {
    clearSliderTimeout();
    setIsDragging(true);
    if (onAdjustingChange) {
      onAdjustingChange(true); // Set adjusting flag immediately
    }
  };
  
    // CRITICAL FIX: Handle mouse up - user stops dragging
    const handleMouseUp = () => {
      setIsDragging(false);
      // Mark the question as answered NOW that user has finished adjusting
      // We need to trigger onChange one more time to mark it as answered
      const finalValue = value || question.smartDefault || 0;
      
      // Wait 3 seconds after user releases mouse before allowing auto-advance
      clearSliderTimeout();
      sliderAdjustmentTimeoutRef.current = setTimeout(() => {
        // After timeout, mark question as answered and clear adjusting flag
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // Force one more onChange call to mark as answered (now that adjusting is done)
        onChange(Number(finalValue));
      }, 3000);
    };
  
  // Handle slider value change (fires continuously while dragging)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't clear the adjusting flag here - it's already set on mouseDown
    // Just update the value
    onChange(Number(e.target.value));
  };
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearSliderTimeout();
      if (onAdjustingChange) {
        onAdjustingChange(false); // Clean up adjusting flag
      }
    };
  }, [onAdjustingChange]);
  
  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="text-center">
        <div className="text-6xl font-bold text-white mb-2">
          {currentValue.toLocaleString()}
        </div>
        {question.unit && (
          <div className="text-xl text-slate-400">
            {question.unit}
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="relative px-2">
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={rangeWithStep.step}
          value={currentValue}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="slider-input w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              rgb(168 85 247) 0%, 
              rgb(99 102 241) ${percentage}%, 
              rgb(30 41 59) ${percentage}%, 
              rgb(30 41 59) 100%)`
          }}
        />
        
        {/* Min/Max Labels */}
        <div className="flex justify-between text-sm text-slate-500 mt-2">
          <span>{range.min}</span>
          <span>{range.max}</span>
        </div>
      </div>

      {/* Quick Select Buttons (Optional) */}
      {getQuickSelectValues(rangeWithStep).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {getQuickSelectValues(rangeWithStep).map((quickValue) => (
            <button
              key={quickValue}
              onClick={() => onChange(quickValue)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${currentValue === quickValue
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }
              `}
            >
              {quickValue}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper: Generate quick select values for common ranges
function getQuickSelectValues(range: { min: number; max: number; step: number }): number[] {
  const span = range.max - range.min;
  
  // For small ranges, show all values
  if (span <= 20) {
    return [];
  }
  
  // For larger ranges, show quartiles
  const quartile = span / 4;
  return [
    range.min,
    Math.round(range.min + quartile),
    Math.round(range.min + quartile * 2),
    Math.round(range.min + quartile * 3),
    range.max
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates
}

// ============================================================================
// NUMBER BUTTONS QUESTION
// ============================================================================

function NumberButtonsQuestion({ question, value, onChange, onAdjustingChange }: QuestionRendererProps) {
  const options = question.options || [];
  
  // SMART DECISION: Choose input method based on range size
  const maxValue = options.length > 0 ? Math.max(...options.map(o => Number(o.value) || 0)) : 0;
  const minValue = options.length > 0 ? Math.min(...options.map(o => Number(o.value) || 0)) : 0;
  const optionCount = options.length;
  
  // Logic:
  // - 0-5 options: Buttons (quick selection)
  // - 6-15 options: Smart input with +/- (Merlin suggests, user adjusts)
  // - 16+ options or max > 20: Slider (large ranges)
  const shouldUseSlider = optionCount > 15 || maxValue > 20;
  const shouldUseSmartInput = optionCount > 5 && optionCount <= 15 && !shouldUseSlider;
  
  // If should use slider and range is available, render slider instead
  if (shouldUseSlider && question.range) {
    const range = question.range;
    const currentValue = value ? Number(value) : (range.default || range.min || 0);
    const sliderAdjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    
    const clearSliderTimeout = () => {
      if (sliderAdjustmentTimeoutRef.current) {
        clearTimeout(sliderAdjustmentTimeoutRef.current);
        sliderAdjustmentTimeoutRef.current = null;
      }
    };
    
    // CRITICAL FIX: Handle mouse down - user starts dragging
    const handleMouseDown = () => {
      console.log('🖱️ Slider mouse down - setting adjusting flag');
      clearSliderTimeout();
      setIsDragging(true);
      if (onAdjustingChange) {
        onAdjustingChange(true); // Set adjusting flag immediately
      }
    };
    
    // CRITICAL FIX: Handle mouse up - user stops dragging
    const handleMouseUp = () => {
      console.log('🖱️ Slider mouse up - will clear adjusting flag in 3 seconds');
      setIsDragging(false);
      
      // Get final value to mark as answered after timeout
      const finalValue = value !== undefined && value !== null ? Number(value) : (range.default || range.min || 0);
      
      // Wait 3 seconds after user releases mouse before allowing auto-advance
      clearSliderTimeout();
      sliderAdjustmentTimeoutRef.current = setTimeout(() => {
        console.log('✅ Slider adjustment complete - clearing adjusting flag');
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
        // This ensures the question is marked as answered AND notification is shown when adjusting is completely done
        // Use a small delay to ensure adjusting flag is cleared first
        setTimeout(() => {
          onChange(finalValue);
        }, 50);
      }, 3000);
    };
    
    // Handle slider value change (fires continuously while dragging)
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // CRITICAL: Make sure adjusting flag is set (in case onChange fires before mouseDown)
      // This is a defensive check for race conditions
      if (!isDragging && onAdjustingChange) {
        console.log('⚠️ Slider onChange fired before mouseDown - setting adjusting flag now');
        setIsDragging(true);
        onAdjustingChange(true);
      }
      // Update the value (adjusting flag prevents marking as answered)
      onChange(Number(e.target.value));
    };
    
    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        clearSliderTimeout();
        if (onAdjustingChange) {
          onAdjustingChange(false); // Clean up adjusting flag
        }
      };
    }, [onAdjustingChange]);
    
    return (
      <div className="space-y-6">
        {/* Current Value Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-2">
            {currentValue.toLocaleString()}
          </div>
          {question.unit && (
            <div className="text-xl text-slate-400">
              {question.unit}
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="relative px-2">
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step || 1}
            value={currentValue}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="slider-input w-full h-3 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${((currentValue - range.min) / (range.max - range.min)) * 100}%, rgb(51 65 85) ${((currentValue - range.min) / (range.max - range.min)) * 100}%, rgb(51 65 85) 100%)`
            }}
          />
        </div>

        {/* Min/Max Labels */}
        <div className="flex justify-between text-sm text-slate-500">
          <span>{range.min}{question.unit}</span>
          <span>{range.max}{question.unit}</span>
        </div>
      </div>
    );
  }
  
  // If should use smart input (6-15 options), render smart input with +/- buttons
  if (shouldUseSmartInput) {
    const smartDefault = typeof question.smartDefault === 'number' ? question.smartDefault : Number(question.smartDefault) || minValue;
    const currentValue = value ? Number(value) : smartDefault;
    const questionIcon = getQuestionIcon(question.field, question.question);
    const adjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    const setAdjusting = (isAdjusting: boolean) => {
      if (onAdjustingChange) {
        onAdjustingChange(isAdjusting);
      }
    };
    
    const clearAdjustmentTimeout = () => {
      if (adjustmentTimeoutRef.current) {
        clearTimeout(adjustmentTimeoutRef.current);
        adjustmentTimeoutRef.current = null;
      }
    };
    
    const handleIncrement = () => {
      clearAdjustmentTimeout();
      // CRITICAL FIX: Set adjusting flag BEFORE calling onChange to prevent auto-advance
      setAdjusting(true);
      if (onAdjustingChange) {
        onAdjustingChange(true);
      }
      
      const nextValue = Math.min(currentValue + 1, maxValue);
      onChange(String(nextValue));
      
      // Clear adjusting flag after user stops clicking (3 seconds of inactivity)
      // Then call onChange one final time to mark as answered and show notification
      adjustmentTimeoutRef.current = setTimeout(() => {
        console.log('✅ Smart input increment complete - clearing adjusting flag');
        setAdjusting(false);
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
        // This ensures the question is marked as answered and notification is shown
        setTimeout(() => {
          onChange(String(nextValue));
        }, 50);
      }, 3000);
    };
    
    const handleDecrement = () => {
      clearAdjustmentTimeout();
      // CRITICAL FIX: Set adjusting flag BEFORE calling onChange to prevent auto-advance
      setAdjusting(true);
      if (onAdjustingChange) {
        onAdjustingChange(true);
      }
      
      const nextValue = Math.max(currentValue - 1, minValue);
      onChange(String(nextValue));
      
      // Clear adjusting flag after user stops clicking (3 seconds of inactivity)
      // Then call onChange one final time to mark as answered and show notification
      adjustmentTimeoutRef.current = setTimeout(() => {
        console.log('✅ Smart input decrement complete - clearing adjusting flag');
        setAdjusting(false);
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
        // This ensures the question is marked as answered and notification is shown
        setTimeout(() => {
          onChange(String(nextValue));
        }, 50);
      }, 3000);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      clearAdjustmentTimeout();
      // CRITICAL FIX: Set adjusting flag BEFORE calling onChange
      setAdjusting(true);
      if (onAdjustingChange) {
        onAdjustingChange(true);
      }
      
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange('');
        adjustmentTimeoutRef.current = setTimeout(() => {
          setAdjusting(false);
          if (onAdjustingChange) {
            onAdjustingChange(false);
          }
        }, 3000);
        return;
      }
      const numValue = Number(inputValue);
      if (!isNaN(numValue) && numValue >= minValue && numValue <= maxValue) {
        onChange(String(numValue));
      }
      // Clear adjusting flag after user stops typing (3 seconds of inactivity)
      // Then call onChange one final time to mark as answered and show notification
      adjustmentTimeoutRef.current = setTimeout(() => {
        console.log('✅ Smart input typing complete - clearing adjusting flag');
        setAdjusting(false);
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
        if (!isNaN(numValue) && numValue >= minValue && numValue <= maxValue) {
          setTimeout(() => {
            onChange(String(numValue));
          }, 50);
        }
      }, 3000);
    };
    
    const handleInputFocus = () => {
      setAdjusting(true);
      if (onAdjustingChange) {
        onAdjustingChange(true);
      }
    };
    
    const handleInputBlur = () => {
      // When user finishes typing, wait a bit before allowing auto-advance
      clearAdjustmentTimeout();
      const finalValue = value !== undefined && value !== null ? String(value) : String(currentValue);
      adjustmentTimeoutRef.current = setTimeout(() => {
        console.log('✅ Smart input blur complete - clearing adjusting flag');
        setAdjusting(false);
        if (onAdjustingChange) {
          onAdjustingChange(false);
        }
        // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
        setTimeout(() => {
          onChange(finalValue);
        }, 50);
      }, 2000); // Wait 2 seconds after blur
    };
    
    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        clearAdjustmentTimeout();
      };
    }, []);
    
    return (
      <div className="space-y-4">
        {/* Icon + Label */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {typeof questionIcon === 'object' && isSvgIcon(questionIcon) ? (
            React.createElement(questionIcon.value, { className: "w-10 h-10 text-purple-300" })
          ) : typeof questionIcon === 'object' && isImageIcon(questionIcon) ? (
            <img 
              src={typeof questionIcon.value === 'string' ? questionIcon.value : ''} 
              alt={questionIcon.alt || 'Icon'} 
              className="w-10 h-10 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          ) : (
            <span className="text-4xl">{typeof questionIcon === 'string' ? questionIcon : '🔢'}</span>
          )}
          <p className="text-slate-400 text-sm">Merlin suggests: <span className="text-purple-300 font-semibold">{smartDefault}</span></p>
        </div>
        
        {/* Smart Input with +/- */}
        <div className="flex items-center justify-center gap-4">
          {/* Decrement Button */}
          <button
            onClick={handleDecrement}
            disabled={currentValue <= minValue}
            className={`
              w-12 h-12 rounded-xl border-2 font-bold text-xl transition-all
              flex items-center justify-center
              ${currentValue <= minValue
                ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50'
                : 'bg-slate-800 text-white border-purple-500/50 hover:bg-slate-700 hover:border-purple-500 hover:scale-105'
              }
            `}
          >
            −
          </button>
          
          {/* Input Field */}
          <div className="relative">
            <input
              type="number"
              min={minValue}
              max={maxValue}
              value={currentValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="
                w-32 h-16 text-center text-4xl font-bold text-white
                bg-slate-800/80 border-2 border-purple-500/50 rounded-xl
                focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30
                transition-all
              "
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            />
            {question.unit && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400">
                {question.unit}
              </div>
            )}
          </div>
          
          {/* Increment Button */}
          <button
            onClick={handleIncrement}
            disabled={currentValue >= maxValue}
            className={`
              w-12 h-12 rounded-xl border-2 font-bold text-xl transition-all
              flex items-center justify-center
              ${currentValue >= maxValue
                ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50'
                : 'bg-slate-800 text-white border-purple-500/50 hover:bg-slate-700 hover:border-purple-500 hover:scale-105'
              }
            `}
          >
            +
          </button>
        </div>
        
        {/* Range Display - Only show if meaningful range */}
        {maxValue > minValue && (
          <div className="text-center text-sm text-slate-500">
            Range: {minValue} - {maxValue}{question.unit ? ` ${question.unit}` : ''}
          </div>
        )}
      </div>
    );
  }
  
  // CRITICAL: If no options, show error message
  if (options.length === 0) {
    console.error(`❌ NumberButtonsQuestion has no options for question: ${question.field}`);
    return (
      <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold mb-2">⚠️ Configuration Error</p>
        <p className="text-slate-300 text-sm">
          This question is missing options. Please contact support or try refreshing the page.
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Question: {question.question} | Field: {question.field}
        </p>
      </div>
    );
  }
  
  // Get icon for this question - debug logging
  const baseQuestionIcon = getQuestionIcon(question.field, question.question);
  if (import.meta.env.DEV) {
    console.log(`🔍 Icon lookup for field "${question.field}":`, baseQuestionIcon);
  }
  
  // VINEET'S DESIGN: Compact, elegant cards like goal cards in Step 2
  // Grid: 3-4 columns for numbers, compact height, icon + number
  const gridCols = options.length <= 6 ? 'grid-cols-3' : options.length <= 10 ? 'grid-cols-4' : 'grid-cols-5';
  
  const handleClick = (optionValue: string) => {
    onChange(optionValue);
    // No disappearing confirmation - selection is persistent and clear
  };
  
  return (
    <div>
      <div className={`grid ${gridCols} gap-2.5`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          // Use base question icon for all options (consistent)
          const displayIcon = option.icon ? (option.icon.startsWith('/') || option.icon.includes('.') 
            ? { type: 'image' as const, value: option.icon, alt: question.question }
            : option.icon)
            : baseQuestionIcon;
          
          return (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              className={`
                h-20 rounded-xl border-2 transition-all font-semibold relative
                flex flex-col items-center justify-center
                hover:-translate-y-0.5 hover:scale-105
                ${isSelected
                  ? 'bg-gradient-to-br from-blue-400/40 via-violet-500/40 to-purple-500/40 border-blue-400 shadow-2xl shadow-blue-500/40 scale-105 ring-2 ring-blue-400/50'
                  : 'bg-gradient-to-br from-slate-800/80 to-slate-700/40 border-white/10 hover:border-purple-500/30'
                }
              `}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Icon - Use real icons, not question marks */}
              {(() => {
                // Resolve icon properly - check SVG first, then image, then string
                if (typeof displayIcon === 'object' && isSvgIcon(displayIcon)) {
                  return React.createElement(displayIcon.value, { className: "w-8 h-8 mb-1 text-purple-300" });
                } else if (typeof displayIcon === 'object' && isImageIcon(displayIcon)) {
                  return (
                    <img 
                      src={typeof displayIcon.value === 'string' ? displayIcon.value : ''} 
                      alt={displayIcon.alt || 'Icon'} 
                      className="w-8 h-8 mb-1 object-contain"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  );
                } else if (typeof displayIcon === 'string') {
                  return <span className="text-2xl mb-1">{displayIcon}</span>;
                } else if (typeof baseQuestionIcon === 'object' && isSvgIcon(baseQuestionIcon)) {
                  return React.createElement(baseQuestionIcon.value, { className: "w-8 h-8 mb-1 text-purple-300" });
                } else if (typeof baseQuestionIcon === 'object' && isImageIcon(baseQuestionIcon)) {
                  return (
                    <img 
                      src={typeof baseQuestionIcon.value === 'string' ? baseQuestionIcon.value : ''} 
                      alt={baseQuestionIcon.alt || 'Icon'} 
                      className="w-8 h-8 mb-1 object-contain"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  );
                } else {
                  const iconToShow = typeof baseQuestionIcon === 'string' ? baseQuestionIcon : '🔢';
                  return <span className="text-2xl mb-1">{iconToShow}</span>;
                }
              })()}
              
              {/* Number */}
              <span className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {option.label}
              </span>
              
              {/* Check indicator - more prominent and persistent */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-lg ring-2 ring-blue-400/50">
                  <span className="text-white text-base font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Persistent selection confirmation - only shows when something is selected */}
      {value !== undefined && value !== null && value !== '' && (
        <div className="mt-4 p-3 bg-blue-500/15 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg">✓</span>
            <p className="text-blue-300 text-sm font-medium">
              Selected: <span className="font-bold">{String(options.find(o => String(o.value) === String(value))?.label || value)}</span>
            </p>
            <span className="text-blue-400/70 text-xs ml-auto">Answer saved • Auto-advancing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TOGGLE QUESTION
// ============================================================================

function ToggleQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [
    { value: 'yes', label: 'Yes', icon: '✅' },
    { value: 'no', label: 'No', icon: '❌' }
  ];
  
  return (
    <div className="flex gap-4 justify-center max-w-md mx-auto">
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 h-32 rounded-xl border-2 transition-all
              flex flex-col items-center justify-center gap-3
              ${isSelected
                ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-750'
              }
            `}
          >
            {option.icon && (
              <span className="text-4xl">{option.icon}</span>
            )}
            <span className="text-xl font-semibold">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// AREA INPUT QUESTION
// ============================================================================

function AreaInputQuestion({ question, value, onChange }: QuestionRendererProps) {
  const defaultValue = question.smartDefault || { value: '', unit: 'sqft' };
  const currentValue = value || defaultValue;
  
  const handleValueChange = (newValue: string) => {
    onChange({
      ...currentValue,
      value: newValue
    });
  };
  
  const handleUnitChange = (newUnit: 'sqft' | 'sqm') => {
    onChange({
      ...currentValue,
      unit: newUnit
    });
  };
  
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Number Input */}
      <div className="relative">
        <input
          type="number"
          value={currentValue.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter area"
          className="
            w-full h-20 px-6 text-3xl font-bold text-white text-center
            bg-slate-800 border-2 border-slate-700 rounded-xl
            focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20
            transition-all
          "
        />
      </div>

      {/* Unit Toggle */}
      <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => handleUnitChange('sqft')}
          className={`
            flex-1 py-3 rounded-lg font-semibold transition-all
            ${currentValue.unit === 'sqft'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          Square Feet (sq ft)
        </button>
        <button
          onClick={() => handleUnitChange('sqm')}
          className={`
            flex-1 py-3 rounded-lg font-semibold transition-all
            ${currentValue.unit === 'sqm'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          Square Meters (sq m)
        </button>
      </div>

      {/* Conversion Helper */}
      {currentValue.value && (
        <div className="text-center text-sm text-slate-400">
          {currentValue.unit === 'sqft' 
            ? `≈ ${(Number(currentValue.value) / 10.764).toFixed(0)} sq m`
            : `≈ ${(Number(currentValue.value) * 10.764).toFixed(0)} sq ft`
          }
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INCREMENT BOX QUESTION
// ============================================================================

function IncrementBoxQuestion({ question, value, onChange, onAdjustingChange }: QuestionRendererProps) {
  const range = question.range || { min: 0, max: 10, default: 0 };
  const currentValue = (value as number) ?? range.default ?? range.min;
  const incrementBy = question.incrementBy ?? 1;
  const adjustmentTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const clearAdjustmentTimeout = () => {
    if (adjustmentTimeoutRef.current) {
      clearTimeout(adjustmentTimeoutRef.current);
      adjustmentTimeoutRef.current = null;
    }
  };
  
  const handleIncrement = () => {
    clearAdjustmentTimeout();
    // CRITICAL FIX: Set adjusting flag BEFORE calling onChange to prevent auto-advance
    if (onAdjustingChange) {
      onAdjustingChange(true);
    }
    
    const newValue = Math.min(range.max, currentValue + incrementBy);
    onChange(newValue);
    
    // Clear adjusting flag after user stops clicking (3 seconds of inactivity)
    // Then call onChange one final time to mark as answered and show notification
    adjustmentTimeoutRef.current = setTimeout(() => {
      console.log('✅ Increment box adjustment complete - clearing adjusting flag');
      if (onAdjustingChange) {
        onAdjustingChange(false);
      }
      // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
      // This ensures the question is marked as answered and notification is shown
      setTimeout(() => {
        onChange(newValue);
      }, 50);
    }, 3000);
  };
  
  const handleDecrement = () => {
    clearAdjustmentTimeout();
    // CRITICAL FIX: Set adjusting flag BEFORE calling onChange to prevent auto-advance
    if (onAdjustingChange) {
      onAdjustingChange(true);
    }
    
    const newValue = Math.max(range.min, currentValue - incrementBy);
    onChange(newValue);
    
    // Clear adjusting flag after user stops clicking (3 seconds of inactivity)
    // Then call onChange one final time to mark as answered and show notification
    adjustmentTimeoutRef.current = setTimeout(() => {
      console.log('✅ Increment box adjustment complete - clearing adjusting flag');
      if (onAdjustingChange) {
        onAdjustingChange(false);
      }
      // IMPORTANT: Call onChange one final time AFTER clearing adjusting flag
      // This ensures the question is marked as answered and notification is shown
      setTimeout(() => {
        onChange(newValue);
      }, 50);
    }, 3000);
  };
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearAdjustmentTimeout();
    };
  }, []);
  
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Value Display with Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleDecrement}
          disabled={currentValue <= range.min}
          className={`
            w-16 h-16 rounded-xl border-2 transition-all flex items-center justify-center
            text-3xl font-bold
            ${currentValue <= range.min
              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 border-slate-700 text-white hover:border-purple-500 hover:bg-purple-500/20 active:scale-95'
            }
          `}
        >
          −
        </button>
        
        <div className="
          w-32 h-20 px-6 rounded-xl border-2 border-purple-500/50
          bg-gradient-to-br from-purple-900/30 to-indigo-900/30
          flex items-center justify-center
        ">
          <span className="text-4xl font-bold text-white">
            {currentValue}
          </span>
        </div>
        
        <button
          onClick={handleIncrement}
          disabled={currentValue >= range.max}
          className={`
            w-16 h-16 rounded-xl border-2 transition-all flex items-center justify-center
            text-3xl font-bold
            ${currentValue >= range.max
              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 border-slate-700 text-white hover:border-purple-500 hover:bg-purple-500/20 active:scale-95'
            }
          `}
        >
          +
        </button>
      </div>
      
      {/* Power Estimate */}
      {question.powerEstimate && (
        <div className="text-center text-sm text-slate-400">
          {question.powerEstimate}
        </div>
      )}
      
      {/* Range Indicator */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>Min: {range.min}</span>
        <span>Max: {range.max}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MULTISELECT QUESTION
// ============================================================================

function MultiselectQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [];
  const selectedValues = (value as string[]) || [];
  
  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        
        return (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            className={`
              min-h-[96px] p-5 rounded-xl border-2 transition-all
              flex flex-col items-start text-left relative
              ${isSelected 
                ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'bg-slate-800 border-slate-700 hover:border-purple-500/50 hover:bg-slate-750'
              }
            `}
          >
            {/* Checkbox */}
            <div className={`
              absolute top-4 right-4 w-6 h-6 rounded border-2 flex items-center justify-center
              ${isSelected 
                ? 'bg-purple-500 border-purple-500' 
                : 'border-slate-600'
              }
            `}>
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            <span className={`text-lg font-semibold pr-8 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
              {option.label}
            </span>
            {option.description && (
              <span className="text-sm text-slate-400 mt-1">
                {option.description}
              </span>
            )}
            {option.kW !== undefined && (
              <span className="text-xs text-purple-400 mt-2">
                {option.kW} kW
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
