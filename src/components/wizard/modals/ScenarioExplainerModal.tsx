/**
 * SCENARIO EXPLAINER MODAL
 * =========================
 * 
 * Pop-up that explains the 3 scenario options to users before they make a selection.
 * Helps users understand what each optimization strategy means for their business.
 * 
 * Created: Dec 2025
 */

import React from 'react';
import { X, TrendingUp, Shield, Zap, DollarSign, Clock, Battery, Sun, Info, CheckCircle, ArrowRight } from 'lucide-react';

interface ScenarioExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function ScenarioExplainerModal({ isOpen, onClose, onContinue }: ScenarioExplainerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Choose Your Optimization Strategy</h2>
                <p className="text-purple-200">Merlin has prepared 3 configurations based on your facility</p>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-900 font-medium">
                  Based on your facility details, Merlin has calculated 3 optimized configurations. 
                  Each strategy balances cost, savings, and resilience differently.
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Select the one that best matches your business priorities, then fine-tune with your goals.
                </p>
              </div>
            </div>
          </div>

          {/* Three Scenarios Explained */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Savings Optimized */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-emerald-800">Savings Optimized</h3>
              </div>
              <p className="text-emerald-700 text-sm mb-4">
                Focuses on fastest return on investment with minimal upfront cost.
              </p>
              <ul className="space-y-2 text-sm text-emerald-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Shortest payback period
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Lower initial investment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Best for tight budgets
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-emerald-200">
                <p className="text-xs text-emerald-500 italic">Best for: Cash flow focused businesses</p>
              </div>
            </div>

            {/* Balanced */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 ring-2 ring-blue-400 ring-offset-2">
              <div className="absolute -mt-8 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-blue-800">Balanced</h3>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                Optimal balance between savings and reliability for most businesses.
              </p>
              <ul className="space-y-2 text-sm text-blue-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strong ROI + reliability
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  4-hour backup coverage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Moderate solar included
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-500 italic">Best for: Most businesses</p>
              </div>
            </div>

            {/* Maximum Resilience */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-purple-800">Maximum Resilience</h3>
              </div>
              <p className="text-purple-700 text-sm mb-4">
                Maximum protection with extended backup and renewable generation.
              </p>
              <ul className="space-y-2 text-sm text-purple-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  6+ hour backup coverage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Maximum solar + storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Full critical load support
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-500 italic">Best for: Critical operations, hospitals</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              How This Works
            </h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">1</div>
                <span>Select a strategy</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">2</div>
                <span>Add your goals</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">3</div>
                <span>Merlin optimizes</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">✓</div>
                <span>Confirm & Quote</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-3xl">
          <button
            onClick={onContinue}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            I Understand - Show Me My Options
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioExplainerModal;
