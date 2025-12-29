/**
 * INDUSTRY SELECTION SECTION (Step 2)
 * ====================================
 * REDESIGNED Dec 17, 2025 - Prominent Merlin guidance + visible step indicator
 * 
 * Features:
 * - Large Merlin guidance banner at top (matching other sections)
 * - Highly visible step indicator (large, orange background)
 * - Clean 3-column card grid with white backgrounds
 * - Specialized verticals with dedicated landing pages
 * - Auto-advances when industry is selected
 */

import React from 'react';
import {
  ArrowLeft,
  Home,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Zap,
  Building2,
} from 'lucide-react';
import { 
  SPECIALIZED_VERTICALS, 
  INDUSTRY_ICONS 
} from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface IndustrySectionProps {
  wizardState: WizardState;
  availableUseCases: any[];
  isLoadingUseCases: boolean;
  groupedUseCases: Record<string, any[]>;
  onIndustrySelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
  onBack: () => void;
  onHome?: () => void;
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
  onHome,
  sectionRef,
  isHidden = false,
}: IndustrySectionProps) {
  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-120px)] p-4 md:p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════════
            MERLIN GUIDANCE BANNER - Large, prominent, matches other sections
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 bg-gradient-to-br from-[#FED19F]/30 via-[#ffa600]/20 to-[#ffd689]/20 border-4 border-[#ffa600] rounded-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-5">
            {/* Merlin Avatar */}
            <div className="flex-shrink-0 hidden sm:block">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-[#6700b6] shadow-xl bg-gradient-to-br from-[#6700b6] to-[#060F76]">
                <img 
                  src={merlinImage} 
                  alt="Merlin" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              {/* Step Indicator - LARGE and PROMINENT */}
              <div className="flex items-center gap-3 mb-3">
                <span className="px-4 py-2 bg-[#ffa600] text-white text-lg font-bold rounded-full shadow-lg">
                  Step 2 of 5
                </span>
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#ffa600] rounded-full" style={{ width: '33%' }} />
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What type of facility do you have?
              </h2>
              <p className="text-white/80 text-base md:text-lg leading-relaxed">
                Select your industry and I'll customize your energy quote with 
                <span className="text-[#ffd689] font-semibold"> industry-specific pricing</span>, 
                <span className="text-[#68BFFA] font-semibold"> typical load profiles</span>, and 
                <span className="text-[#cc89ff] font-semibold"> recommended equipment</span>.
              </p>
            </div>
          </div>
          
          {/* Location Confirmation Badge */}
          {wizardState.state && (
            <div className="mt-4 pt-4 border-t border-[#ffa600]/30">
              <div className="inline-flex items-center gap-2 bg-[#22c55e]/20 border-2 border-[#22c55e] rounded-full px-4 py-2">
                <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                <span className="text-white font-medium">
                  Location confirmed: <span className="text-[#22c55e] font-bold">{wizardState.state}</span>
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation - Back / Home */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#060F76] hover:bg-[#0815a9] rounded-lg transition-colors border border-[#4b59f5]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#ffa600] hover:bg-[#ffa600]/10 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          )}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════
            SPECIALIZED VERTICALS - Horizontal cards with dedicated sites
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#ffa600]" />
            <h3 className="text-lg font-bold text-[#ffa600]">Specialized Solutions</h3>
            <span className="text-sm text-gray-400 ml-2">— Dedicated landing pages with industry expertise</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {SPECIALIZED_VERTICALS.map((vertical) => {
              const Icon = vertical.icon;
              return (
                <a
                  key={vertical.id}
                  href={vertical.url}
                  className="relative p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#6700b6] hover:shadow-xl transition-all group"
                >
                  <div className="absolute top-2 right-2 bg-[#6700b6] text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Visit Site
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#6700b6] to-[#060F76] text-white shadow-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-[#6700b6] transition-colors">
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
        
        {/* ═══════════════════════════════════════════════════════════════════
            STANDARD INDUSTRIES - Clean card grid
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-[#68BFFA]" />
            <h3 className="text-lg font-bold text-white">All Industries</h3>
            <span className="text-sm text-gray-400 ml-2">— Click to select and continue</span>
          </div>
        </div>
        
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
// LOADING INDICATOR
// ============================================
function LoadingIndicator() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin w-10 h-10 border-4 border-[#6700b6] border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-300 text-lg">Loading industries...</p>
    </div>
  );
}

// ============================================
// INDUSTRY GRID - Clean white cards
// ============================================
interface IndustryGridProps {
  groupedUseCases: Record<string, any[]>;
  selectedIndustry: string;
  onSelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
}

function IndustryGrid({ groupedUseCases, selectedIndustry, onSelect }: IndustryGridProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedUseCases).map(([category, useCases]) => (
        <div key={category}>
          {/* Category Header */}
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-base font-semibold text-[#68BFFA]">{category}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#68BFFA]/30 to-transparent" />
          </div>
          
          {/* Industry Cards - 3 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(useCases as any[]).map((useCase) => {
              const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default || Zap;
              const isSelected = selectedIndustry === useCase.slug;
              
              return (
                <button
                  key={useCase.slug}
                  onClick={() => onSelect(useCase.slug, useCase.name, useCase.id)}
                  className={`relative p-5 rounded-xl text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#6700b6] to-[#060F76] border-2 border-[#cc89ff] shadow-xl shadow-[#6700b6]/30 scale-[1.02]'
                      : 'bg-white border-2 border-gray-200 hover:border-[#6700b6] hover:shadow-lg'
                  }`}
                >
                  {/* Selected Checkmark */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[#6700b6]/10 text-[#6700b6]'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    {/* Name */}
                    <span className={`font-semibold text-base ${
                      isSelected ? 'text-white' : 'text-gray-800'
                    }`}>
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
