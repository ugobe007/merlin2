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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#060F76] hover:bg-[#0815a9] rounded-lg transition-colors border border-[#4b59f5]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Location
          </button>
          <div className="px-3 py-1 bg-[#6700b6] text-white text-sm font-medium rounded-full">Step 1 of 5</div>
        </div>
        
        {/* Header - SIMPLIFIED per Vineet feedback */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#68BFFA]/20 border-2 border-[#68BFFA] rounded-full px-5 py-2 mb-4">
            <CheckCircle className="w-4 h-4 text-[#68BFFA]" />
            <span className="text-white text-sm">Location: {wizardState.state}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Select your industry
          </h2>
          <p className="text-gray-300">
            We'll customize your quote based on your facility type
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
      <h3 className="text-sm font-bold text-[#ffa600] uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#ffa600]" />
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
      <div className="animate-spin w-8 h-8 border-4 border-[#6700b6] border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-400">Loading industries...</p>
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
                      ? 'border-[#6700b6] bg-[#6700b6]/10 shadow-lg shadow-[#6700b6]/20'
                      : 'border-slate-600 bg-slate-800/50 hover:border-[#68BFFA] hover:bg-[#68BFFA]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-[#6700b6] text-white' 
                        : 'bg-[#060F76]/30 text-[#68BFFA]'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-[#cc89ff]' : 'text-white'}`}>
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
