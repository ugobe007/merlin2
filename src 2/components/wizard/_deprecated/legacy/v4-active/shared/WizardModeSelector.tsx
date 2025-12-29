/**
 * WIZARD MODE SELECTOR - Shared Component
 * ========================================
 * 
 * Provides two-path entry for vertical wizards:
 * 1. PRO MODE - Direct to AdvancedQuoteBuilder for users with specs
 * 2. GUIDED MODE - Step-by-step wizard for discovery
 * 
 * Usage:
 * ```tsx
 * <WizardModeSelector
 *   vertical="hotel" | "car-wash" | "ev-charging"
 *   onSelectMode={(mode) => setQuoteMode(mode)}
 *   onClose={onClose}
 *   colorScheme="purple" | "cyan" | "emerald"
 * />
 * ```
 * 
 * @since Dec 2025 - Extracted from HotelWizard for reuse
 */

import React from 'react';
import { FileText, Sparkles, Check, ArrowRight, ArrowLeft, Zap, Upload, TrendingUp } from 'lucide-react';

export type WizardMode = 'select' | 'pro' | 'guided';

export type VerticalType = 'hotel' | 'car-wash' | 'ev-charging' | 'data-center' | 'hospital' | 'retail';

export interface WizardModeSelectorProps {
  vertical: VerticalType;
  mode: WizardMode;
  onSelectMode: (mode: WizardMode) => void;
  onClose: () => void;
  colorScheme?: 'purple' | 'cyan' | 'emerald' | 'amber';
}

// Vertical-specific configuration
const VERTICAL_CONFIG: Record<VerticalType, { 
  name: string; 
  icon: string;
  proDescription: string;
  guidedDescription: string;
  urlParam: string;
}> = {
  'hotel': {
    name: 'Hotel',
    icon: '🏨',
    proDescription: 'Enter your power requirements directly. Perfect for professionals with site surveys, utility data, or engineering specs.',
    guidedDescription: 'Answer simple questions about your hotel and we\'ll calculate your power requirements automatically.',
    urlParam: 'hotel',
  },
  'car-wash': {
    name: 'Car Wash',
    icon: '🚗',
    proDescription: 'Enter your tunnel specifications directly. Perfect for operators with equipment lists, utility data, or existing site surveys.',
    guidedDescription: 'Answer simple questions about your car wash and we\'ll calculate your power requirements automatically.',
    urlParam: 'car-wash',
  },
  'ev-charging': {
    name: 'EV Charging',
    icon: '⚡',
    proDescription: 'Enter your charger configuration directly. Perfect for fleet operators with load studies or charging infrastructure plans.',
    guidedDescription: 'Answer simple questions about your EV charging station and we\'ll recommend the optimal configuration.',
    urlParam: 'ev-charging',
  },
  'data-center': {
    name: 'Data Center',
    icon: '🖥️',
    proDescription: 'Enter your rack and cooling requirements directly. Perfect for IT managers with detailed power requirements.',
    guidedDescription: 'Answer questions about your data center and we\'ll size the BESS for your needs.',
    urlParam: 'data-center',
  },
  'hospital': {
    name: 'Hospital',
    icon: '🏥',
    proDescription: 'Enter your critical load requirements directly. Perfect for facilities managers with utility data and equipment specs.',
    guidedDescription: 'Answer questions about your hospital and we\'ll ensure critical systems have reliable backup power.',
    urlParam: 'hospital',
  },
  'retail': {
    name: 'Retail',
    icon: '🛒',
    proDescription: 'Enter your store specifications directly. Perfect for corporate energy managers with multi-site data.',
    guidedDescription: 'Answer questions about your retail location and we\'ll optimize for peak shaving and demand charges.',
    urlParam: 'retail',
  },
};

export const WizardModeSelector: React.FC<WizardModeSelectorProps> = ({
  vertical,
  mode,
  onSelectMode,
  onClose,
  colorScheme = 'purple',
}) => {
  const config = VERTICAL_CONFIG[vertical];
  
  // Color scheme mapping
  const colors = {
    purple: {
      gradient: 'from-purple-900/30 via-indigo-900/20 to-purple-900/30',
      border: 'border-purple-500/40 hover:border-purple-400',
      badge: 'bg-purple-500/20 text-purple-300',
      iconBg: 'from-purple-500 to-indigo-500',
      shadow: 'shadow-purple-500/20',
      iconShadow: 'shadow-purple-500/30',
      text: 'text-purple-200/80',
      check: 'text-purple-400',
      cta: 'text-purple-400',
    },
    cyan: {
      gradient: 'from-cyan-900/30 via-teal-900/20 to-cyan-900/30',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300',
      iconBg: 'from-cyan-500 to-teal-500',
      shadow: 'shadow-cyan-500/20',
      iconShadow: 'shadow-cyan-500/30',
      text: 'text-cyan-200/80',
      check: 'text-cyan-400',
      cta: 'text-cyan-400',
    },
    emerald: {
      gradient: 'from-emerald-900/30 via-green-900/20 to-emerald-900/30',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
      iconBg: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-500/20',
      iconShadow: 'shadow-emerald-500/30',
      text: 'text-emerald-200/80',
      check: 'text-emerald-400',
      cta: 'text-emerald-400',
    },
    amber: {
      gradient: 'from-amber-900/30 via-orange-900/20 to-amber-900/30',
      border: 'border-amber-500/40 hover:border-amber-400',
      badge: 'bg-amber-500/20 text-amber-300',
      iconBg: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/20',
      iconShadow: 'shadow-amber-500/30',
      text: 'text-amber-200/80',
      check: 'text-amber-400',
      cta: 'text-amber-400',
    },
  };
  
  const c = colors[colorScheme];
  const proColors = colors['amber']; // Pro mode always uses amber

  // MODE: SELECT - Show mode picker
  if (mode === 'select') {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-black text-white mb-3">How would you like to build your quote?</h3>
          <p className="text-gray-400 text-lg">Choose the path that fits your needs</p>
        </div>
        
        {/* Two Path Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* PRO MODE - I Have Specs */}
          <button
            onClick={() => onSelectMode('pro')}
            className={`group relative bg-gradient-to-br ${proColors.gradient} rounded-3xl p-8 ${proColors.border} border-2 transition-all transform hover:scale-[1.02] hover:shadow-2xl ${proColors.shadow} text-left`}
          >
            <div className={`absolute top-4 right-4 ${proColors.badge} px-3 py-1 rounded-full`}>
              <span className="text-xs font-bold">PRO</span>
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${proColors.iconBg} flex items-center justify-center mb-6 shadow-lg ${proColors.iconShadow}`}>
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-2xl font-black text-white mb-3">I Have My Specs</h4>
            <p className={`${proColors.text} mb-4`}>
              {config.proDescription}
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${proColors.check}`} />
                <span>Direct input: kW, kWh, solar, rates</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${proColors.check}`} />
                <span>Upload utility bills for auto-populate</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${proColors.check}`} />
                <span>Skip the guided questions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${proColors.check}`} />
                <span>Get your quote in 30 seconds</span>
              </li>
            </ul>
            <div className={`mt-6 flex items-center gap-2 ${proColors.cta} font-bold group-hover:translate-x-2 transition-transform`}>
              <span>Enter Specs Directly</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
          
          {/* GUIDED MODE - Build My Specs */}
          <button
            onClick={() => onSelectMode('guided')}
            className={`group relative bg-gradient-to-br ${c.gradient} rounded-3xl p-8 ${c.border} border-2 transition-all transform hover:scale-[1.02] hover:shadow-2xl ${c.shadow} text-left`}
          >
            <div className={`absolute top-4 right-4 ${c.badge} px-3 py-1 rounded-full`}>
              <span className="text-xs font-bold">GUIDED</span>
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center mb-6 shadow-lg ${c.iconShadow}`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-2xl font-black text-white mb-3">Help Me Build My Specs</h4>
            <p className={`${c.text} mb-4`}>
              {config.guidedDescription}
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${c.check}`} />
                <span>Step-by-step guided experience</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${c.check}`} />
                <span>Smart recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${c.check}`} />
                <span>Perfect for first-timers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className={`w-4 h-4 ${c.check}`} />
                <span>Learn as you go</span>
              </li>
            </ul>
            <div className={`mt-6 flex items-center gap-2 ${c.cta} font-bold group-hover:translate-x-2 transition-transform`}>
              <span>Start Guided Wizard</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
        
        {/* Helper Text */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            💡 Not sure? The <span className={`${c.cta} font-medium`}>Guided Wizard</span> will help you discover what you need.
            <br/>
            Already have a site survey or utility data? Try <span className={`${proColors.cta} font-medium`}>Pro Mode</span> for faster quotes.
          </p>
        </div>
      </div>
    );
  }
  
  // MODE: PRO - Show redirect to Advanced Builder
  if (mode === 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        {/* Pro Mode Redirect Screen */}
        <div className="text-center">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${proColors.iconBg} flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-amber-500/40`}>
            <FileText className="w-12 h-12 text-white" />
          </div>
          <div className={`inline-flex items-center gap-2 ${proColors.badge} px-4 py-2 rounded-full mb-4`}>
            <span className="font-bold">PRO MODE</span>
          </div>
          <h3 className="text-3xl font-black text-white mb-3">Advanced Quote Builder</h3>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            You'll be taken to our full-featured quote builder where you can enter exact specifications, 
            upload documents, and access advanced financial modeling.
          </p>
        </div>
        
        {/* Feature List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
            <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Direct Input</p>
            <p className="text-xs text-gray-500">Enter kW, kWh, rates</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
            <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Upload Bills</p>
            <p className="text-xs text-gray-500">Auto-extract data</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
            <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Financial Models</p>
            <p className="text-xs text-gray-500">NPV, IRR, DSCR</p>
          </div>
          <div className="bg-gray-800/60 rounded-xl p-4 text-center border border-gray-700">
            <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Export Reports</p>
            <p className="text-xs text-gray-500">Word, Excel, PDF</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => onSelectMode('select')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all border border-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={() => {
              // Close wizard and redirect to Advanced Quote Builder
              onClose();
              window.location.href = `/?advanced=true&vertical=${config.urlParam}&view=custom-config`;
            }}
            className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 border border-amber-400/50"
          >
            <span>Open Advanced Builder</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-500 text-sm">
          💡 Your {config.name.toLowerCase()} vertical preferences will be pre-loaded
        </p>
      </div>
    );
  }
  
  // MODE: GUIDED - Return null, let parent render the guided wizard steps
  return null;
};

export default WizardModeSelector;
