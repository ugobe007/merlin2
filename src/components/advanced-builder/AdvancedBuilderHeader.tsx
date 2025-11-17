import React from 'react';
import { X, Wrench, Zap, Sparkles, Calculator } from 'lucide-react';
import type { ViewMode } from '../../utils/advancedBuilderConstants';

/**
 * Advanced Builder Header Component
 * 
 * Sticky header with branding, quick access buttons, and close control.
 * Used in both landing and custom config views.
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.3)
 */

interface AdvancedBuilderHeaderProps {
  viewMode: ViewMode;
  onClose: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onQuickAccess?: (section: string) => void;
}

export function AdvancedBuilderHeader({
  viewMode,
  onClose,
  onViewModeChange,
  onQuickAccess,
}: AdvancedBuilderHeaderProps) {
  
  const handleQuickAccess = (section: string) => {
    if (viewMode !== 'custom-config' && onViewModeChange) {
      onViewModeChange('custom-config');
    }
    setTimeout(() => {
      const element = document.querySelector(`[data-section="${section}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    onQuickAccess?.(section);
  };
  
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 border-b-4 border-purple-400 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl shadow-2xl ring-2 ring-purple-300/30">
              <Wrench className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl">
                Advanced Quote Builder
              </h1>
              <p className="text-purple-200 text-xs drop-shadow-lg font-medium">Professional-grade BESS configuration</p>
            </div>
          </div>
          
          {/* Quick Access Buttons - only show in landing mode */}
          {viewMode === 'landing' && (
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => handleQuickAccess('electrical')}
                className="group flex items-center gap-2 bg-blue-600/30 hover:bg-blue-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/40 hover:border-blue-300/60 transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-semibold text-white">Electrical</span>
              </button>
              
              <button
                onClick={() => handleQuickAccess('renewables')}
                className="group flex items-center gap-2 bg-green-600/30 hover:bg-green-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-400/40 hover:border-green-300/60 transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-green-200" />
                <span className="text-xs font-semibold text-white">Renewables</span>
              </button>
              
              <button
                onClick={() => handleQuickAccess('financial')}
                className="group flex items-center gap-2 bg-purple-600/30 hover:bg-purple-600/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-400/40 hover:border-purple-300/60 transition-all duration-300 hover:scale-105"
              >
                <Calculator className="w-4 h-4 text-purple-200" />
                <span className="text-xs font-semibold text-white">Financial</span>
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all text-white hover:shadow-xl hover:scale-110 ring-2 ring-white/20 hover:ring-white/40"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
