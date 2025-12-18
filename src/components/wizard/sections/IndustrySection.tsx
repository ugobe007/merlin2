/**
 * INDUSTRY SELECTION SECTION (Section 2)
 * =======================================
 * REDESIGNED Dec 17, 2025 - Compact card grid with Merlin palette
 * 
 * Features:
 * - Compact square cards in responsive grid (5-6 per row on desktop)
 * - Specialized verticals with dedicated landing pages
 * - Merlin color palette: purple (#6700b6), orange (#ffa600), blue (#68BFFA)
 * - Category groupings with clear visual hierarchy
 * - Auto-advances when industry is selected
 */

import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Home,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Zap,
  Building2,
  Factory,
  Hotel,
  ShoppingBag,
  Warehouse,
  Car,
  Plane,
  Heart,
  GraduationCap,
  Building,
  Server,
  Leaf,
  Droplets,
  Gamepad2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { 
  SPECIALIZED_VERTICALS, 
  INDUSTRY_ICONS 
} from '../constants/wizardConstants';
import type { WizardState } from '../types/wizardTypes';

// =============================================================================
// CATEGORY ICONS & COLORS (Merlin Palette)
// =============================================================================
const CATEGORY_STYLES: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  'Commercial': { icon: Building2, color: '#6700b6', bgColor: 'from-[#6700b6]/10 to-[#cc89ff]/10' },
  'Industrial': { icon: Factory, color: '#ffa600', bgColor: 'from-[#ffa600]/10 to-[#ffd689]/10' },
  'Institutional': { icon: Building, color: '#68BFFA', bgColor: 'from-[#68BFFA]/10 to-[#b3dffc]/10' },
  'Residential': { icon: Home, color: '#22c55e', bgColor: 'from-[#22c55e]/10 to-[#bbf7d0]/10' },
  'Agricultural': { icon: Leaf, color: '#84cc16', bgColor: 'from-[#84cc16]/10 to-[#d9f99d]/10' },
  'Other': { icon: Zap, color: '#6700b6', bgColor: 'from-[#6700b6]/10 to-[#FED19F]/10' },
};

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
      <div className="max-w-6xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#060F76] hover:bg-[#0815a9] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {onHome && (
              <button
                onClick={onHome}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#ffa600] hover:text-white hover:bg-[#ffa600]/20 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            )}
          </div>
          <div className="px-3 py-1 bg-[#6700b6] text-white text-sm font-medium rounded-full">
            Step 2 of 6
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#68BFFA]/20 border border-[#68BFFA]/50 rounded-full px-4 py-1.5 mb-3">
            <CheckCircle className="w-4 h-4 text-[#68BFFA]" />
            <span className="text-white text-sm">Location: {wizardState.state || 'Not set'}</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            What type of facility?
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            Select your industry for a customized energy quote
          </p>
        </div>
        
        {/* Specialized Verticals - Compact Row */}
        <SpecializedVerticalsRow />
        
        {/* Main Industry Grid */}
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

// =============================================================================
// SPECIALIZED VERTICALS - Compact horizontal row
// =============================================================================
function SpecializedVerticalsRow() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#ffa600]" />
        <span className="text-sm font-semibold text-[#ffa600] uppercase tracking-wider">
          Specialized Solutions
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {SPECIALIZED_VERTICALS.map((vertical) => {
          const Icon = vertical.icon;
          return (
            <a
              key={vertical.id}
              href={vertical.url}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6700b6]/20 to-[#ffa600]/20 border border-[#6700b6]/30 hover:border-[#ffa600] hover:shadow-lg hover:shadow-[#ffa600]/10 transition-all group"
            >
              <div className="p-2 rounded-lg bg-[#6700b6] text-white group-hover:bg-[#ffa600] transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white text-sm group-hover:text-[#ffa600] transition-colors">
                  {vertical.name}
                </div>
                <div className="text-xs text-gray-400">{vertical.description}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#ffa600] ml-2" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// LOADING INDICATOR
// =============================================================================
function LoadingIndicator() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin w-8 h-8 border-4 border-[#6700b6] border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-400">Loading industries...</p>
    </div>
  );
}

// =============================================================================
// INDUSTRY GRID - Compact cards with category headers
// =============================================================================
interface IndustryGridProps {
  groupedUseCases: Record<string, any[]>;
  selectedIndustry: string;
  onSelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
}

function IndustryGrid({ groupedUseCases, selectedIndustry, onSelect }: IndustryGridProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedUseCases).map(([category, useCases]) => {
        const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other'];
        const CategoryIcon = categoryStyle.icon;
        
        return (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${categoryStyle.color}20` }}
              >
                <CategoryIcon className="w-5 h-5" style={{ color: categoryStyle.color }} />
              </div>
              <h3 className="text-lg font-semibold text-white">{category}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            </div>
            
            {/* Industry Cards Grid - Compact */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {(useCases as any[]).map((useCase) => {
                const Icon = INDUSTRY_ICONS[useCase.slug] || INDUSTRY_ICONS.default || Zap;
                const isSelected = selectedIndustry === useCase.slug;
                
                return (
                  <button
                    key={useCase.slug}
                    onClick={() => onSelect(useCase.slug, useCase.name, useCase.id)}
                    className={`relative p-4 rounded-xl border-2 text-center transition-all duration-200 group ${
                      isSelected
                        ? 'border-[#6700b6] bg-gradient-to-br from-[#6700b6]/20 to-[#cc89ff]/10 shadow-lg shadow-[#6700b6]/20 scale-[1.02]'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-[#68BFFA] hover:bg-gradient-to-br hover:from-[#68BFFA]/10 hover:to-[#6700b6]/10'
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#6700b6] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Icon */}
                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                      isSelected 
                        ? 'bg-[#6700b6] text-white shadow-lg' 
                        : 'bg-slate-700/50 text-[#68BFFA] group-hover:bg-[#68BFFA]/20 group-hover:text-[#68BFFA]'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    {/* Name */}
                    <span className={`text-sm font-medium leading-tight ${
                      isSelected ? 'text-[#cc89ff]' : 'text-white group-hover:text-[#68BFFA]'
                    }`}>
                      {useCase.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default IndustrySection;
