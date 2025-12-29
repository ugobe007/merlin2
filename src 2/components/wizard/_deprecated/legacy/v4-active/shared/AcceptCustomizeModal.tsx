/**
 * ACCEPT/CUSTOMIZE MODAL - Shared Component
 * ==========================================
 * 
 * Reusable modal for all vertical wizards to present AI recommendation
 * and offer choice between accepting or customizing the configuration.
 * 
 * SSOT Compliance: Uses quote data from unifiedQuoteCalculator
 * TrueQuote™ Badge: Displays on recommendation summary
 */

import React from 'react';
import { 
  X, CheckCircle, Gauge, ArrowRight, Battery, Sun, 
  Zap, DollarSign, Sparkles
} from 'lucide-react';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';

export interface AcceptCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onCustomize: () => void;
  quoteResult: QuoteResult;
  verticalName: string;
  facilityDetails: {
    name?: string;
    size?: string; // e.g., "150 rooms", "4 bays", "12 chargers"
    location?: string;
  };
  systemSummary: {
    bessKW: number;
    bessKWh: number;
    solarKW?: number;
    generatorKW?: number;
    paybackYears: number;
    annualSavings: number;
  };
  colorScheme?: 'cyan' | 'emerald' | 'purple' | 'amber'; // Vertical branding
}

export function AcceptCustomizeModal({
  isOpen,
  onClose,
  onAccept,
  onCustomize,
  quoteResult,
  verticalName,
  facilityDetails,
  systemSummary,
  colorScheme = 'cyan'
}: AcceptCustomizeModalProps) {
  if (!isOpen) return null;

  // Color scheme variants
  const colors = {
    cyan: {
      primary: 'cyan',
      secondary: 'purple',
      gradient: 'from-cyan-900/30 to-purple-900/30',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      bg: 'bg-cyan-900/40',
    },
    emerald: {
      primary: 'emerald',
      secondary: 'teal',
      gradient: 'from-emerald-900/30 to-teal-900/30',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-900/40',
    },
    purple: {
      primary: 'purple',
      secondary: 'indigo',
      gradient: 'from-purple-900/30 to-indigo-900/30',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      bg: 'bg-purple-900/40',
    },
    amber: {
      primary: 'amber',
      secondary: 'orange',
      gradient: 'from-amber-900/30 to-orange-900/30',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-900/40',
    }
  };

  const theme = colors[colorScheme];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-3xl border-2 border-cyan-500/40 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className={`w-10 h-10 ${theme.text}`} />
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">
                Merlin AI Recommendation
              </h2>
            </div>
            <p className="text-gray-300 text-lg">
              Your custom {verticalName} energy storage system is ready!
            </p>
            {facilityDetails.name && (
              <p className="text-cyan-200/70 mt-2">
                {facilityDetails.name} • {facilityDetails.size} • {facilityDetails.location}
              </p>
            )}
          </div>
          
          {/* AI Recommended System Summary */}
          <div className={`bg-gradient-to-r ${theme.gradient} rounded-2xl p-6 border-2 ${theme.border} mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Battery className={`w-6 h-6 ${theme.text}`} />
                Recommended Configuration
              </h3>
              <TrueQuoteBadge size="md" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* BESS Power */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className={`text-3xl font-black ${theme.text} mb-1`}>
                  {systemSummary.bessKW} kW
                </p>
                <p className="text-sm text-gray-400">BESS Power</p>
              </div>
              
              {/* Storage Capacity */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-purple-400 mb-1">
                  {systemSummary.bessKWh >= 1000
                    ? `${(systemSummary.bessKWh / 1000).toFixed(1)} MWh`
                    : `${systemSummary.bessKWh} kWh`}
                </p>
                <p className="text-sm text-gray-400">Storage</p>
              </div>
              
              {/* Solar (if any) */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-amber-400 mb-1">
                  {systemSummary.solarKW ? `${systemSummary.solarKW} kW` : '—'}
                </p>
                <p className="text-sm text-gray-400">Solar</p>
              </div>
              
              {/* Payback */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-emerald-400 mb-1">
                  {systemSummary.paybackYears.toFixed(1)} yr
                </p>
                <p className="text-sm text-gray-400">Payback</p>
              </div>
            </div>
            
            {/* Annual Savings - Prominent */}
            <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-xl p-5 border border-emerald-500/30 text-center">
              <p className="text-emerald-200 uppercase tracking-widest text-xs font-bold mb-2">
                💰 Estimated Annual Savings
              </p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                ${Math.round(systemSummary.annualSavings).toLocaleString()}
              </p>
              <p className="text-gray-300 text-sm mt-2">per year</p>
            </div>
            
            {/* Generator (if any) */}
            {systemSummary.generatorKW && systemSummary.generatorKW > 0 && (
              <div className="mt-4 flex items-center gap-3 bg-slate-800/30 rounded-lg p-3">
                <Zap className="w-5 h-5 text-orange-400" />
                <p className="text-gray-300">
                  <span className="font-bold text-orange-400">{systemSummary.generatorKW} kW</span> backup generator included
                </p>
              </div>
            )}
          </div>
          
          {/* Choice Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Accept AI Setup */}
            <button
              onClick={onAccept}
              className="group relative bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl p-8 text-left transition-all transform hover:scale-[1.02] border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-white mb-2">Accept Merlin AI Setup</h4>
                  <p className="text-emerald-100 text-sm mb-4 leading-relaxed">
                    Proceed with Merlin's optimized configuration. You'll be able to export quotes, 
                    review detailed breakdowns, and contact our team.
                  </p>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span>View Full Quote</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
            
            {/* Customize */}
            <button
              onClick={onCustomize}
              className="group relative bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl p-8 text-left transition-all transform hover:scale-[1.02] border-2 border-purple-400/50 shadow-xl shadow-purple-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Gauge className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-white mb-2">Customize Configuration</h4>
                  <p className="text-purple-100 text-sm mb-4 leading-relaxed">
                    Fine-tune system sizing, adjust solar/generator capacity, and explore 
                    different equipment options to match your exact needs.
                  </p>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span>Adjust System</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Close Button */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <X className="w-5 h-5" />
              Go Back to Previous Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
