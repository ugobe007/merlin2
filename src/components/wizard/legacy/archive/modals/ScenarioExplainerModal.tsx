/**
 * MAGIC FIT EXPLAINER MODAL
 * ==========================
 * 
 * Explains the 3 savings options to users in simple, business-focused language.
 * NO technical jargon - focuses on outcomes: savings, backup time, and ROI.
 * 
 * Created: Dec 2025
 * Updated: Dec 15, 2025 - Reframed as savings-focused "Magic Fit"
 */

import React from 'react';
import { X, TrendingUp, Shield, DollarSign, Clock, ArrowRight, Sparkles, PiggyBank } from 'lucide-react';

interface ScenarioExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function ScenarioExplainerModal({ isOpen, onClose, onContinue }: ScenarioExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Friendly, not technical */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Magic Fit™</h2>
                <p className="text-emerald-100">We found 3 ways to save you money</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Simple language */}
        <div className="p-6 space-y-6">
          {/* The Promise */}
          <div className="text-center py-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Based on what you told us, here's how we can help
            </h3>
            <p className="text-gray-600">
              Each option balances savings, protection, and investment differently. 
              <span className="font-medium text-emerald-600"> Pick the one that feels right for your business.</span>
            </p>
          </div>

          {/* Three Options - Outcome focused */}
          <div className="space-y-4">
            {/* Option 1: Maximum Savings */}
            <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
              <div className="p-3 bg-emerald-500 rounded-xl flex-shrink-0">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-emerald-800">Maximum Savings</h4>
                  <span className="text-xs bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">Fastest Payback</span>
                </div>
                <p className="text-emerald-700 text-sm mb-2">
                  Get the biggest bang for your buck. Smaller upfront cost, pays for itself quickly.
                </p>
                <div className="flex items-center gap-4 text-xs text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~3 year payback
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Lower investment
                  </span>
                </div>
              </div>
            </div>

            {/* Option 2: Best Value */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-400 ring-2 ring-blue-200 transition-colors">
              <div className="p-3 bg-blue-500 rounded-xl flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-blue-800">Best Value</h4>
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                </div>
                <p className="text-blue-700 text-sm mb-2">
                  The sweet spot. Great savings PLUS backup power when the grid goes down.
                </p>
                <div className="flex items-center gap-4 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~4 year payback
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> 4+ hours backup
                  </span>
                </div>
              </div>
            </div>

            {/* Option 3: Maximum Protection */}
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-colors">
              <div className="p-3 bg-purple-500 rounded-xl flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-purple-800">Maximum Protection</h4>
                  <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Most Resilient</span>
                </div>
                <p className="text-purple-700 text-sm mb-2">
                  Peace of mind first. Extended backup keeps you running when others can't.
                </p>
                <div className="flex items-center gap-4 text-xs text-purple-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~5 year payback
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> 8+ hours backup
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simple explanation */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-800">Don't worry about the technical stuff.</span>
              {' '}We handle the equipment sizing. You just tell us what matters most to you.
            </p>
          </div>
        </div>

        {/* Footer - Clear CTA */}
        <div className="border-t border-gray-100 p-6 bg-gradient-to-b from-gray-50 to-white rounded-b-3xl">
          <button
            onClick={onContinue}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            Show Me My Options
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-gray-500 text-xs mt-3">
            You can compare all 3 side by side and pick the one that works for you
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScenarioExplainerModal;
