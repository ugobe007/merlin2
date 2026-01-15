/**
 * Business Size Panel
 * ====================
 * Sliding panel that appears after industry selection in Step 2.
 * Asks user to select their business size, which determines:
 * - Questionnaire depth (minimal/standard/detailed)
 * - Number of questions shown in Step 3
 * 
 * Created: January 14, 2026
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import type { BusinessSizeTier, QuestionnaireDepth, BusinessSizeOption } from '../types';

// ============================================================================
// INDUSTRY-SPECIFIC SIZE OPTIONS
// ============================================================================

const INDUSTRY_SIZE_OPTIONS: Record<string, BusinessSizeOption[]> = {
  hotel: [
    { tier: 'small', label: 'Boutique', description: 'Under 50 rooms', icon: '🏠', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Mid-Size', description: '50-150 rooms', icon: '🏨', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Full-Service', description: '150-400 rooms', icon: '🏬', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Resort/Casino', description: '400+ rooms', icon: '🏰', questionnaireDepth: 'detailed' },
  ],
  car_wash: [
    { tier: 'small', label: 'Single Bay', description: '1-2 bays', icon: '🚗', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Express', description: '3-6 bays', icon: '🚙', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Full-Service', description: '6-12 bays + detail', icon: '🚐', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Multi-Location', description: '12+ bays or chain', icon: '🏭', questionnaireDepth: 'detailed' },
  ],
  ev_charging: [
    { tier: 'small', label: 'Starter', description: '2-8 chargers', icon: '⚡', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Hub', description: '8-20 chargers', icon: '🔋', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Super Hub', description: '20-50 chargers', icon: '⚡', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Fleet Depot', description: '50+ chargers', icon: '🚛', questionnaireDepth: 'detailed' },
  ],
  manufacturing: [
    { tier: 'small', label: 'Workshop', description: 'Under 25,000 sq ft', icon: '🔧', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Mid-Size Plant', description: '25K-100K sq ft', icon: '🏭', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Large Factory', description: '100K-500K sq ft', icon: '🏗️', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Industrial Complex', description: '500K+ sq ft', icon: '⚙️', questionnaireDepth: 'detailed' },
  ],
  data_center: [
    { tier: 'small', label: 'Edge/Colocation', description: 'Under 1 MW', icon: '💾', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Enterprise DC', description: '1-10 MW', icon: '🖥️', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Hyperscale', description: '10-50 MW', icon: '📊', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Campus', description: '50+ MW', icon: '🏢', questionnaireDepth: 'detailed' },
  ],
  hospital: [
    { tier: 'small', label: 'Clinic', description: 'Under 50 beds', icon: '🏥', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Community Hospital', description: '50-200 beds', icon: '🏨', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Regional Medical', description: '200-500 beds', icon: '🏬', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Medical Campus', description: '500+ beds', icon: '🏰', questionnaireDepth: 'detailed' },
  ],
  retail: [
    { tier: 'small', label: 'Single Store', description: 'Under 10,000 sq ft', icon: '🏪', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Big Box', description: '10K-50K sq ft', icon: '🏬', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Strip Mall', description: '50K-200K sq ft', icon: '🛒', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Shopping Center', description: '200K+ sq ft', icon: '🏢', questionnaireDepth: 'detailed' },
  ],
  office: [
    { tier: 'small', label: 'Small Office', description: 'Under 25,000 sq ft', icon: '🏠', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Mid-Rise', description: '25K-100K sq ft', icon: '🏢', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'High-Rise', description: '100K-500K sq ft', icon: '🏙️', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Campus', description: '500K+ sq ft', icon: '🌆', questionnaireDepth: 'detailed' },
  ],
  college: [
    { tier: 'small', label: 'Single Building', description: 'Under 5,000 students', icon: '🎓', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Small Campus', description: '5K-15K students', icon: '🏫', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'University', description: '15K-40K students', icon: '🎒', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Major University', description: '40K+ students', icon: '🏛️', questionnaireDepth: 'detailed' },
  ],
  warehouse: [
    { tier: 'small', label: 'Small Warehouse', description: 'Under 50,000 sq ft', icon: '📦', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Distribution Center', description: '50K-250K sq ft', icon: '🏭', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Fulfillment Center', description: '250K-1M sq ft', icon: '🚚', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Mega DC', description: '1M+ sq ft', icon: '🏢', questionnaireDepth: 'detailed' },
  ],
  restaurant: [
    { tier: 'small', label: 'Café/Quick Service', description: 'Under 2,500 sq ft', icon: '☕', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Full-Service', description: '2,500-5,000 sq ft', icon: '🍽️', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Large Restaurant', description: '5K-10K sq ft', icon: '🍴', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Multi-Location', description: '10K+ or chain', icon: '🏪', questionnaireDepth: 'detailed' },
  ],
  agriculture: [
    { tier: 'small', label: 'Small Farm', description: 'Under 100 acres', icon: '🌱', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Mid-Size Farm', description: '100-500 acres', icon: '🌾', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Large Operation', description: '500-2,000 acres', icon: '🚜', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Industrial Farm', description: '2,000+ acres', icon: '🏭', questionnaireDepth: 'detailed' },
  ],
  heavy_duty_truck_stop: [
    { tier: 'small', label: 'Local Stop', description: '10-30 spaces', icon: '🚚', questionnaireDepth: 'minimal' },
    { tier: 'medium', label: 'Travel Center', description: '30-100 spaces', icon: '⛽', questionnaireDepth: 'standard' },
    { tier: 'large', label: 'Major Hub', description: '100-250 spaces', icon: '🛣️', questionnaireDepth: 'detailed' },
    { tier: 'enterprise', label: 'Interstate Plaza', description: '250+ spaces', icon: '🏭', questionnaireDepth: 'detailed' },
  ],
};

// Default options for industries not specifically defined
const DEFAULT_SIZE_OPTIONS: BusinessSizeOption[] = [
  { tier: 'small', label: 'Small', description: 'Starter operation', icon: '🏠', questionnaireDepth: 'minimal' },
  { tier: 'medium', label: 'Medium', description: 'Growing business', icon: '🏢', questionnaireDepth: 'standard' },
  { tier: 'large', label: 'Large', description: 'Established operation', icon: '🏬', questionnaireDepth: 'detailed' },
  { tier: 'enterprise', label: 'Enterprise', description: 'Major facility', icon: '🏰', questionnaireDepth: 'detailed' },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  industry: string;
  industryName: string;
  selectedSize: BusinessSizeTier | undefined;
  onSelectSize: (tier: BusinessSizeTier, depth: QuestionnaireDepth) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function BusinessSizePanel({ 
  industry, 
  industryName, 
  selectedSize, 
  onSelectSize, 
  onSkip,
  onClose 
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Get industry-specific size options
  const normalizedIndustry = industry.replace(/-/g, '_');
  const sizeOptions = INDUSTRY_SIZE_OPTIONS[normalizedIndustry] || DEFAULT_SIZE_OPTIONS;

  // Extract the industry type for the question (e.g., "hotel", "car wash")
  const industryType = industryName.toLowerCase().split('/')[0].trim();

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Quick question</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            What size <span className="text-purple-400">{industryType}</span> do you operate?
          </h2>
          <p className="text-slate-400">
            This helps us ask the right questions for your specific needs
          </p>
        </div>

        {/* Size Options Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {sizeOptions.map((option) => {
            const isSelected = selectedSize === option.tier;
            return (
              <button
                key={option.tier}
                onClick={() => onSelectSize(option.tier, option.questionnaireDepth)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-purple-500/50 hover:bg-slate-700'
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Icon */}
                <span className="text-3xl mb-3 block">{option.icon}</span>

                {/* Label */}
                <h3 className={`font-bold text-lg mb-1 ${
                  isSelected ? 'text-white' : 'text-slate-200'
                }`}>
                  {option.label}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-sm">{option.description}</p>

                {/* Question count hint */}
                <div className="mt-3 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    option.questionnaireDepth === 'minimal' 
                      ? 'bg-green-500/20 text-green-300'
                      : option.questionnaireDepth === 'standard'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {option.questionnaireDepth === 'minimal' && '~8 questions'}
                    {option.questionnaireDepth === 'standard' && '~14 questions'}
                    {option.questionnaireDepth === 'detailed' && '~20 questions'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center mt-6">
          <button
            onClick={onSkip}
            className="text-slate-400 hover:text-white transition-colors text-sm underline"
          >
            Skip — use standard questionnaire
          </button>
        </div>
        
        {/* Hint text */}
        <p className="text-center text-slate-500 text-xs mt-4">
          Click a size above to continue. This determines how detailed your questionnaire will be.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER: Get size options for any industry
// ============================================================================

export function getSizeOptionsForIndustry(industrySlug: string): BusinessSizeOption[] {
  const normalized = industrySlug.replace(/-/g, '_');
  return INDUSTRY_SIZE_OPTIONS[normalized] || DEFAULT_SIZE_OPTIONS;
}
