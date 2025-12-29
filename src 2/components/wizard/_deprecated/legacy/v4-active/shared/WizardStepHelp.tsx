/**
 * WIZARD STEP HELP - Contextual Help Component
 * =============================================
 * 
 * Displays step-specific instructions and helpful links.
 * Collapsible to save space, with quick tips visible by default.
 * 
 * THIS IS A SHARED COMPONENT - Used by ALL vertical wizards:
 * - CarWashWizard
 * - EVChargingWizard
 * - HotelWizard
 * - (Future: HospitalWizard, OfficeWizard, etc.)
 * 
 * ARCHITECTURE NOTES:
 * - Configuration-driven (pass help content as props)
 * - No hardcoded content - verticals define their own help text
 * - Supports links, tips, and warnings
 * 
 * Version: 1.0.0
 * Date: December 2025
 */

import React, { useState } from 'react';
import { 
  HelpCircle, ChevronDown, ChevronUp, ExternalLink, 
  Lightbulb, AlertTriangle, Info, CheckCircle, Sparkles
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

export interface HelpLink {
  label: string;
  url: string;
  description?: string;
}

export interface HelpTip {
  type: 'tip' | 'warning' | 'info' | 'success';
  text: string;
}

export interface StepHelpContent {
  stepId: string;
  title: string;
  description: string;
  tips?: HelpTip[];
  links?: HelpLink[];
  videoUrl?: string;
}

export interface WizardStepHelpProps {
  content: StepHelpContent;
  defaultExpanded?: boolean;
  compact?: boolean;
  colorScheme?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'indigo';
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const TIP_ICONS: Record<HelpTip['type'], React.ElementType> = {
  tip: Lightbulb,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const TIP_COLORS: Record<HelpTip['type'], { bg: string; text: string; icon: string }> = {
  tip: { bg: 'bg-amber-500/10', text: 'text-amber-200', icon: 'text-amber-400' },
  warning: { bg: 'bg-red-500/10', text: 'text-red-200', icon: 'text-red-400' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-200', icon: 'text-blue-400' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-200', icon: 'text-emerald-400' },
};

const COLOR_SCHEMES = {
  cyan: {
    header: 'text-cyan-300',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    hover: 'hover:bg-cyan-500/10',
  },
  purple: {
    header: 'text-purple-300',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    hover: 'hover:bg-purple-500/10',
  },
  emerald: {
    header: 'text-emerald-300',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    hover: 'hover:bg-emerald-500/10',
  },
  amber: {
    header: 'text-amber-300',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    hover: 'hover:bg-amber-500/10',
  },
  indigo: {
    header: 'text-indigo-300',
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/5',
    hover: 'hover:bg-indigo-500/10',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function WizardStepHelp({
  content,
  defaultExpanded = false,
  compact = false,
  colorScheme = 'cyan',
  className = '',
}: WizardStepHelpProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = COLOR_SCHEMES[colorScheme];
  
  // ============================================
  // COMPACT MODE - Just an icon button with tooltip
  // ============================================
  if (compact) {
    return (
      <div className={`relative group ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1.5 rounded-full ${colors.bg} ${colors.hover} transition-colors`}
          title={content.title}
        >
          <HelpCircle className={`w-4 h-4 ${colors.header}`} />
        </button>
        
        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block w-64 p-3 bg-slate-800 rounded-lg shadow-xl border border-white/10">
          <h4 className={`font-medium ${colors.header} mb-1`}>{content.title}</h4>
          <p className="text-xs text-white/70">{content.description}</p>
          {content.tips && content.tips.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-xs text-amber-300">
                💡 {content.tips[0].text}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // ============================================
  // FULL MODE - Collapsible help panel
  // ============================================
  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} ${className}`}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-4 py-3 ${colors.hover} transition-colors rounded-lg`}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className={`w-4 h-4 ${colors.header}`} />
          <span className={`text-sm font-medium ${colors.header}`}>
            {content.title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50" />
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Description */}
          <p className="text-sm text-white/70">{content.description}</p>
          
          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div className="space-y-2">
              {content.tips.map((tip, index) => {
                const Icon = TIP_ICONS[tip.type];
                const tipColors = TIP_COLORS[tip.type];
                
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg ${tipColors.bg}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tipColors.icon}`} />
                    <span className={`text-xs ${tipColors.text}`}>{tip.text}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Links */}
          {content.links && content.links.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Learn More
              </h5>
              <div className="space-y-1">
                {content.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Video */}
          {content.videoUrl && (
            <div className="pt-2 border-t border-white/10">
              <a
                href={content.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Watch video tutorial</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRE-BUILT HELP CONTENT FOR COMMON STEPS
// ============================================

/**
 * Pre-built help content for common wizard steps.
 * Verticals can use these as-is or customize them.
 */
export const COMMON_STEP_HELP: Record<string, StepHelpContent> = {
  // Business Type Selection
  'business-type': {
    stepId: 'business-type',
    title: 'About Your Business',
    description: 'Select the type of business you operate. This helps us provide accurate power estimates based on industry benchmarks.',
    tips: [
      { type: 'tip', text: 'Your business type affects equipment recommendations and typical energy usage patterns.' },
      { type: 'info', text: 'Not sure? Choose the closest match - you can adjust details in the next steps.' },
    ],
  },
  
  // Equipment Selection
  'equipment': {
    stepId: 'equipment',
    title: 'Your Equipment',
    description: 'Tell us about your current equipment. This helps calculate your actual power needs rather than just estimates.',
    tips: [
      { type: 'tip', text: 'Drying systems and HVAC typically account for 40-60% of energy use.' },
      { type: 'warning', text: 'Underestimating equipment can lead to an undersized battery system.' },
    ],
    links: [
      { label: 'Equipment Power Guide', url: '/docs/equipment-power' },
    ],
  },
  
  // Operations
  'operations': {
    stepId: 'operations',
    title: 'Operating Hours',
    description: 'Your operating schedule helps us calculate energy storage requirements and identify peak demand periods.',
    tips: [
      { type: 'tip', text: 'Peak hours (typically 4-9 PM) have higher electricity rates - battery storage can shift usage to save money.' },
      { type: 'info', text: 'Seasonal variations matter! Summer A/C and winter heating affect your energy profile.' },
    ],
  },
  
  // Energy Goals
  'energy-goals': {
    stepId: 'energy-goals',
    title: 'Your Goals',
    description: 'What do you want to achieve with energy storage? Your priorities help us size the system correctly.',
    tips: [
      { type: 'tip', text: 'Peak demand reduction often provides the fastest payback.' },
      { type: 'info', text: 'Backup power and sustainability goals may require larger battery capacity.' },
    ],
  },
  
  // System Configuration
  'configuration': {
    stepId: 'configuration',
    title: 'System Configuration',
    description: 'Review and adjust the recommended battery and solar configuration based on your needs.',
    tips: [
      { type: 'tip', text: 'Duration (hours) determines how long you can operate on battery alone.' },
      { type: 'warning', text: 'Larger systems cost more upfront but may have better ROI over 10+ years.' },
    ],
    links: [
      { label: 'Understanding BESS Sizing', url: '/docs/bess-sizing' },
      { label: 'Solar + Storage Calculator', url: '/docs/solar-storage' },
    ],
  },
  
  // Quote Review
  'quote': {
    stepId: 'quote',
    title: 'Your Quote',
    description: 'Review your customized quote. This includes equipment costs, installation, tax credits, and projected savings.',
    tips: [
      { type: 'success', text: 'The 30% Federal ITC can significantly reduce your net cost.' },
      { type: 'tip', text: 'Download your quote to share with stakeholders or compare financing options.' },
    ],
  },
  
  // EV Charger Configuration
  'ev-chargers': {
    stepId: 'ev-chargers',
    title: 'EV Charger Setup',
    description: 'Configure your EV charging infrastructure. Mix charger types based on your use case.',
    tips: [
      { type: 'tip', text: 'Level 2 (7-22 kW) is best for 2-8 hour dwell times. DCFC (50-150 kW) for quick stops.' },
      { type: 'warning', text: 'NO "Level 3" - industry uses DCFC (DC Fast Charge) and HPC (High-Power Charging) instead.' },
      { type: 'info', text: 'Battery storage can help manage peak demand from fast chargers.' },
    ],
    links: [
      { label: 'EV Charger Types Explained', url: '/docs/ev-charger-types' },
      { label: 'Demand Charge Management', url: '/docs/demand-charges' },
    ],
  },
};
