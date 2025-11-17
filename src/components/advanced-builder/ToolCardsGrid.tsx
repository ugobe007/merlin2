import React from 'react';
import { 
  Gauge, Wand2, PiggyBank, BarChart3, Box, 
  ScrollText, Search, ArrowRight, Sparkles 
} from 'lucide-react';
import type { ViewMode } from '../../utils/advancedBuilderConstants';
import { TOOL_CARDS } from '../../utils/advancedBuilderConstants';
import merlinImage from '../../assets/images/new_Merlin.png';

/**
 * Tool Cards Grid Component
 * 
 * Displays all available tools in the Advanced Quote Builder with
 * premium 3D gradient styling and hover effects.
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.3)
 */

interface ToolCardsGridProps {
  onViewModeChange: (mode: ViewMode) => void;
  onClose: () => void;
  onOpenSmartWizard?: () => void;
  onOpenFinancing?: () => void;
  onOpenMarketIntel?: () => void;
  onOpenQuoteTemplates?: () => void;
  setShowQuotePreview?: (show: boolean) => void;
  setSkipWizardIntro?: (skip: boolean) => void;
}

// Icon mapping for Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Gauge,
  Wand2,
  PiggyBank,
  BarChart3,
  Box,
  ScrollText,
  Search,
};

export function ToolCardsGrid({
  onViewModeChange,
  onClose,
  onOpenSmartWizard,
  onOpenFinancing,
  onOpenMarketIntel,
  onOpenQuoteTemplates,
  setShowQuotePreview,
  setSkipWizardIntro,
}: ToolCardsGridProps) {
  
  const handleToolClick = (tool: typeof TOOL_CARDS[number]) => {
    switch (tool.action) {
      case 'custom-config':
        onViewModeChange('custom-config');
        break;
      case 'interactive-dashboard':
        onViewModeChange('interactive-dashboard');
        break;
      case 'smart-wizard':
        // Set flag to skip intro and go directly to step 0 (Industry Template)
        if (setSkipWizardIntro) {
          setSkipWizardIntro(true);
        }
        onClose();
        onOpenSmartWizard?.();
        break;
      case 'financing':
        onClose();
        onOpenFinancing?.();
        break;
      case 'market-intel':
        onClose();
        onOpenMarketIntel?.();
        break;
      case 'component-library':
        alert('🔧 Component Library\n\nBrowse batteries, solar panels, inverters, and BOS equipment.\n\nComing soon...');
        onClose();
        break;
      case 'quote-templates':
        onClose();
        onOpenQuoteTemplates?.();
        break;
      case 'quote-preview':
        setShowQuotePreview?.(true);
        break;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
        ✨ Professional Tools & Wizards
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOOL_CARDS.map((tool, index) => {
          const IconComponent = tool.iconType === 'lucide' && tool.iconName 
            ? ICON_MAP[tool.iconName] 
            : null;
          
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`group relative bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl text-left transition-all duration-500 will-change-transform hover:scale-105 hover:-translate-y-3 animate-fadeIn overflow-visible shadow-[0_10px_40px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] border-t-2 border-white/50 ${tool.id === 'custom-config' ? 'md:col-span-2 lg:col-span-3 p-8 md:p-12 min-h-[200px]' : 'p-8 min-h-[320px]'}`}
            >
              {/* Magical glow effect on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-20 rounded-3xl transition-all duration-500 blur-xl`} />
              
              {/* Sparkle effect */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkles className={`${tool.id === 'custom-config' ? 'w-7 h-7' : 'w-5 h-5'} text-yellow-300 animate-pulse`} />
              </div>
              
              {/* Special horizontal layout for Start Here card with Merlin on left */}
              {tool.id === 'custom-config' ? (
                <div className="flex items-center gap-8">
                  {/* Merlin on the left */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-2 shadow-2xl">
                      <img src={merlinImage} alt="Merlin" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  
                  {/* Content on the right */}
                  <div className="flex-1">
                    <h3 className="relative text-4xl md:text-5xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-pink-200 group-hover:to-cyan-200 group-hover:bg-clip-text transition-all duration-300 drop-shadow-lg">
                      {tool.title}
                    </h3>
                    <p className="relative text-white/90 text-lg md:text-xl leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-md">
                      {tool.description}
                    </p>
                    
                    {/* Animated arrow indicator */}
                    <div className="relative mt-6 flex items-center text-white/80 group-hover:text-yellow-200 transition-all duration-300">
                      <span className="text-sm font-bold tracking-wide drop-shadow-md">Launch Tool</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                      <div className="absolute -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Large colorful icon with glow effect - no box */}
                  <div className="relative mb-6 inline-flex h-24 w-24 items-center justify-center">
                    <div className={`bg-gradient-to-br ${tool.color} p-6 rounded-full shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                      <div className="text-white [&>svg]:w-12 [&>svg]:h-12">
                        {IconComponent && <IconComponent />}
                      </div>
                    </div>
                    {/* Animated glow ring on hover */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500`} />
                  </div>
                  
                  {/* Content with white text for gradient background */}
                  <h3 className="relative text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-200 group-hover:via-pink-200 group-hover:to-cyan-200 group-hover:bg-clip-text transition-all duration-300 drop-shadow-lg">
                    {tool.title}
                  </h3>
                  <p className="relative text-white/90 text-sm leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-md">
                    {tool.description}
                  </p>
                  
                  {/* Animated arrow indicator */}
                  <div className="relative mt-6 flex items-center text-white/80 group-hover:text-yellow-200 transition-all duration-300">
                    <span className="text-sm font-bold tracking-wide drop-shadow-md">Launch Tool</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-3 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                    <div className="absolute -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                    </div>
                  </div>
                </>
              )}
              
              {/* Bottom accent line with 3D effect */}
              <div className={`absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r ${tool.color} opacity-70 group-hover:opacity-100 transition-all duration-500 rounded-b-3xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
