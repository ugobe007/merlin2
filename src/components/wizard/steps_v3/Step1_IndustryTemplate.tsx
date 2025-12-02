/**
 * Step 1: Industry Template Selection
 * Clean rebuild for V3 architecture
 */

import React from 'react';
import { Building2, Factory, Store, Zap, Car, Hotel, Server, Droplets, ExternalLink } from 'lucide-react';
import type { BaseStepProps } from '@/types/wizard.types';

interface Step1Props extends BaseStepProps {
  selectedTemplate: string | null;
  availableUseCases: any[];
  onSelectTemplate: (slug: string) => void;
  zipCode?: string;
  onZipCodeChange?: (zip: string) => void;
}

const INDUSTRY_ICONS: Record<string, any> = {
  'ev-charging': Car,
  'datacenter': Server,
  'hotel': Hotel,
  'office': Building2,
  'manufacturing': Factory,
  'retail': Store,
  'car-wash': Droplets,
  'default': Zap
};

// Special verticals that redirect to dedicated sites
const VERTICAL_REDIRECTS: Record<string, string> = {
  'car-wash': '/carwashenergy', // Will be carwashenergy.com in production
};

const Step1_IndustryTemplate: React.FC<Step1Props> = ({
  selectedTemplate,
  availableUseCases = [], // Default to empty array if undefined
  onSelectTemplate,
  zipCode = '',
  onZipCodeChange,
  onNext,
  onBack
}) => {
  // Group use cases by industry
  const groupedUseCases = (availableUseCases || []).reduce((acc: Record<string, any[]>, useCase: any) => {
    const industry = useCase.industry || 'Other';
    if (!acc[industry]) {
      acc[industry] = [];
    }
    acc[industry].push(useCase);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSelect = async (slug: string) => {
    console.log('[Step1] Selected template:', slug);
    await onSelectTemplate(slug);
    console.log('[Step1] Template loaded');
    // Don't auto-advance - let user click Next button
  };

  const canProceed = !!selectedTemplate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-5xl">📊</span>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Building Your Power Profile
            </h2>
            <p className="text-gray-600 mt-2">
              Let's start by selecting your industry
            </p>
          </div>
        </div>
      </div>

      {/* Zip Code Input - NEW: At the top */}
      <div className="max-w-md mx-auto mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Your Location (Zip Code)
        </label>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => onZipCodeChange?.(e.target.value)}
          placeholder="Enter your zip code (e.g., 90210)"
          maxLength={5}
          pattern="[0-9]{5}"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg"
        />
        <p className="text-xs text-gray-500 mt-1 text-center">
          We'll use this for regional pricing and utility rates
        </p>
      </div>

      {/* Use Case Grid */}
      <div className="space-y-8">
        {/* Special Verticals Section - Car Wash */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span> Specialized Solutions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Car Wash - Redirects to carwashenergy.com */}
            <a
              href="/carwashenergy"
              className="p-5 rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 text-left transition-all hover:shadow-xl hover:scale-105 hover:border-cyan-500 group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Dedicated Site
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-cyan-700 transition-colors">
                    Car Wash
                  </h4>
                  <p className="text-sm text-gray-500">Specialized quote builder</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-cyan-600 font-medium">
                🚗 Tailored for car wash owners with bay-specific calculations
              </p>
            </a>
          </div>
        </div>

        {/* Standard Use Cases */}
        {Object.entries(groupedUseCases).map(([industry, useCases]) => (
          <div key={industry}>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{industry}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {useCases.map((useCase) => {
                const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default;
                const isSelected = selectedTemplate === useCase.slug;

                return (
                  <button
                    key={useCase.slug}
                    data-testid={`use-case-${useCase.slug}`}
                    onClick={() => handleSelect(useCase.slug)}
                    className={`
                      p-5 rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-purple-600 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 shadow-lg ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50/50 hover:via-blue-50/50 hover:to-amber-50/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        p-3 rounded-lg
                        ${isSelected 
                          ? 'bg-gradient-to-br from-purple-600 via-blue-500 to-amber-500 text-white' 
                          : 'bg-gradient-to-br from-purple-100 via-blue-100 to-amber-100 text-purple-700'}
                      `}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className={`font-semibold ${isSelected ? 'text-purple-800' : 'text-gray-900'}`}>
                        {useCase.name}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-lg font-medium transition-colors ${
            canProceed
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step1_IndustryTemplate;
