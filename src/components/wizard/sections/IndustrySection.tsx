/**
 * INDUSTRY SELECTION SECTION (Section 1)
 * =======================================
 * 
 * Displays specialized verticals and standard industry grid.
 * Auto-advances when industry is selected.
 * 
 * Extracted from StreamlinedWizard.tsx during December 2025 refactor.
 */

import React from 'react';
import {
  ArrowLeft, CheckCircle, Sparkles, ExternalLink, Zap
} from 'lucide-react';
import { 
  SPECIALIZED_VERTICALS, 
  INDUSTRY_ICONS 
} from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';

interface IndustrySectionProps {
  wizardState: WizardState;
  availableUseCases: any[];
  isLoadingUseCases: boolean;
  groupedUseCases: Record<string, any[]>;
  onIndustrySelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
  onBack: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

export function IndustrySection({
  wizardState,
  availableUseCases,
  isLoadingUseCases,
  groupedUseCases,
  onIndustrySelect,
  onBack,
  sectionRef,
  isHidden = false,
}: IndustrySectionProps) {
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-120px)] p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Location
          </button>
          <div className="text-sm text-gray-400">Step 2 of 6</div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 rounded-full px-5 py-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-sm">Location: {wizardState.state}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            What type of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">facility</span>?
          </h2>
          <p className="text-gray-300">
            Select your industry for tailored recommendations
          </p>
        </div>
        
        {/* Specialized Verticals */}
        <SpecializedVerticalsGrid />
        
        {/* Standard Industries */}
        {isLoadingUseCases ? (
          <LoadingIndicator />
        ) : (
          <IndustryGrid 
            groupedUseCases={groupedUseCases}
            selectedIndustry={wizardState.selectedIndustry}
            onSelect={onIndustrySelect}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SpecializedVerticalsGrid() {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        Specialized Solutions
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {SPECIALIZED_VERTICALS.map((vertical) => {
          const Icon = vertical.icon;
          return (
            <a
              key={vertical.id}
              href={vertical.url}
              className={`relative p-6 rounded-2xl border-2 ${vertical.borderColor} bg-gradient-to-br ${vertical.bgColor} text-left transition-all hover:shadow-xl hover:scale-105 group overflow-hidden`}
            >
              <div className={`absolute top-2 right-2 bg-gradient-to-r ${vertical.color} text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}>
                <ExternalLink className="w-3 h-3" />
                Dedicated Site
              </div>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${vertical.color} text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {vertical.name}
                  </h4>
                  <p className="text-sm text-gray-500">{vertical.description}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-500">Loading industries...</p>
    </div>
  );
}

interface IndustryGridProps {
  groupedUseCases: Record<string, any[]>;
  selectedIndustry: string;
  onSelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
}

function IndustryGrid({ groupedUseCases, selectedIndustry, onSelect }: IndustryGridProps) {
  return (
    <div className="space-y-6">
      {Object.entries(groupedUseCases).map(([industry, useCases]) => (
        <div key={industry}>
          <h3 className="text-lg font-semibold text-white/90 mb-3">{industry}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {(useCases as any[]).map((useCase) => {
              const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default || Zap;
              const isSelected = selectedIndustry === useCase.slug;
              
              return (
                <button
                  key={useCase.slug}
                  onClick={() => onSelect(useCase.slug, useCase.name, useCase.id)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                      {useCase.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default IndustrySection;
