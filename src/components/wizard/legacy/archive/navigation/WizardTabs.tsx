/**
 * WIZARD TABS - Header Navigation
 * 
 * Tab-style navigation for the wizard header.
 * Shows all sections with ability to jump between them.
 * 
 * Dependencies: lucide-react icons
 * Used by: StreamlinedWizard header
 */

import React from 'react';
import {
  MapPin,
  Building2,
  FileText,
  Settings2,
  Receipt,
  Target,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface WizardTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface WizardTabsProps {
  currentSection: number;
  completedSections: string[];
  onTabClick?: (sectionIndex: number) => void;
  /** Only allow clicking completed sections */
  restrictNavigation?: boolean;
}

// ============================================
// DEFAULT TABS CONFIGURATION
// ============================================

export const DEFAULT_WIZARD_TABS: WizardTab[] = [
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'industry', label: 'Industry', icon: Building2 },
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'configure', label: 'Configure', icon: Settings2 },
  { id: 'quote', label: 'Quote', icon: Receipt },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function WizardTabs({
  currentSection,
  completedSections,
  onTabClick,
  restrictNavigation = true,
}: WizardTabsProps) {
  const tabs = DEFAULT_WIZARD_TABS;
  
  return (
    <nav className="flex items-center gap-1 bg-purple-800/50 px-2 py-1 rounded-xl">
      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = idx === currentSection;
        const isCompleted = completedSections.includes(tab.id);
        const canClick = onTabClick && (!restrictNavigation || isCompleted || idx <= currentSection);
        
        return (
          <button
            key={tab.id}
            onClick={canClick ? () => onTabClick(idx) : undefined}
            disabled={!canClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-purple-600 shadow-md'
                : isCompleted
                  ? 'text-purple-200 hover:bg-purple-700/50'
                  : 'text-purple-400/60'
            } ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default WizardTabs;
