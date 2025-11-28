/**
 * NEW Step 1: Industry + Location
 * Combined industry selection and location input
 */

import React, { useState } from 'react';
import { Building2, Factory, Store, Zap, Car, Hotel, Server, MapPin } from 'lucide-react';

interface Step1Props {
  selectedTemplate: string | null;
  availableUseCases: any[];
  location: string;
  onSelectTemplate: (slug: string) => void;
  onUpdateLocation: (location: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const INDUSTRY_ICONS: Record<string, any> = {
  'ev-charging': Car,
  'datacenter': Server,
  'hotel': Hotel,
  'office': Building2,
  'manufacturing': Factory,
  'retail': Store,
  'default': Zap
};

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const Step1_IndustryAndLocation: React.FC<Step1Props> = ({
  selectedTemplate,
  availableUseCases = [],
  location,
  onSelectTemplate,
  onUpdateLocation,
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
  };

  const canProceed = !!selectedTemplate && !!location;

  return (
    <div className="space-y-8 relative">
      {/* Fixed Scroll Prompt - Center (appears after industry selected) */}
      {selectedTemplate && !location && (
        <div className="sticky top-0 z-50 flex justify-center mb-4">
          <button
            onClick={() => {
              const locationSection = document.getElementById('location-section');
              locationSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-5 py-3 bg-gradient-to-r from-purple-700 via-purple-500 to-gray-400 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-all flex items-center gap-3 text-base border border-purple-400"
          >
            <span className="text-xl">📍</span>
            <span>After you chose your industry, scroll down to select your state ↓</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-5xl">🚀</span>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Start Your Power Profile
            </h2>
            <p className="text-gray-600 mt-2">
              Select your industry and location
            </p>
          </div>
        </div>
      </div>

      {/* Industry Selection */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          Step 1a: Select Your Industry
        </h3>
        <div className="space-y-6">
          {Object.entries(groupedUseCases).map(([industry, useCases]) => (
            <div key={industry}>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">{industry}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {useCases.map((useCase) => {
                  const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default;
                  const isSelected = selectedTemplate === useCase.slug;

                  return (
                    <button
                      key={useCase.slug}
                      onClick={() => handleSelect(useCase.slug)}
                      className={`
                        p-5 rounded-xl border-2 text-left transition-all
                        ${isSelected
                          ? 'border-purple-600 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 shadow-lg ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50/50 hover:via-blue-50/50 hover:to-amber-50/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${isSelected 
                            ? 'bg-gradient-to-br from-purple-600 via-blue-500 to-amber-500 text-white' 
                            : 'bg-gradient-to-br from-purple-100 via-blue-100 to-amber-100 text-purple-700'}
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h5 className={`font-semibold ${isSelected ? 'text-purple-800' : 'text-gray-900'}`}>
                          {useCase.name}
                        </h5>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Selection */}
      {selectedTemplate && (
        <div id="location-section" className="animate-fade-in">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Step 1b: Where is your project located?
          </h3>
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              State / Province
            </label>
            <select
              value={location}
              onChange={(e) => onUpdateLocation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900"
            >
              <option value="" className="text-gray-500">Select your state...</option>
              {US_STATES.map(state => (
                <option key={state} value={state} className="text-gray-900">{state}</option>
              ))}
            </select>
            {location && (
              <p className="mt-3 text-sm text-green-600 flex items-center gap-2">
                <span className="text-lg">✓</span>
                Location set to {location}
              </p>
            )}
          </div>
        </div>
      )}

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

export default Step1_IndustryAndLocation;
