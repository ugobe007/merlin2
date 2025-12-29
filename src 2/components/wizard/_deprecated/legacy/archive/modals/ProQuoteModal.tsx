/**
 * PROQUOTE EXPLANATION MODAL
 * ==========================
 * 
 * Modal that explains ProQuote and allows users to:
 * - Learn what ProQuote is and how to use it
 * - Continue to the configuration page with wizard values
 * - Close and return to wizard
 */

import React from 'react';
import { X, Calculator, Settings, Zap, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface ProQuoteModalProps {
  show: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function ProQuoteModal({
  show,
  onClose,
  onContinue,
}: ProQuoteModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] rounded-2xl shadow-2xl border-2 border-[#6366F1]/40 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A855F7] px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                ProQuote™ Builder
              </h2>
              <p className="text-white/90 text-sm">
                Advanced configuration for professionals
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* What is ProQuote */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FDE047]" />
              What is ProQuote?
            </h3>
            <p className="text-white/80 leading-relaxed">
              ProQuote™ is our advanced energy system configuration tool designed for professionals who want 
              complete control over their energy solution. Unlike the guided wizard, ProQuote lets you 
              fine-tune every aspect of your system with precision.
            </p>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#22D3EE]" />
              Key Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-1">Custom Configuration</div>
                  <div className="text-white/70 text-sm">
                    Adjust battery capacity, solar panels, generators, and more with precise controls
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-1">Real-Time Calculations</div>
                  <div className="text-white/70 text-sm">
                    See instant updates to savings, payback, and ROI as you adjust parameters
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-1">Professional Financial Models</div>
                  <div className="text-white/70 text-sm">
                    Access advanced financial modeling with debt financing, tax credits, and more
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold mb-1">Your Wizard Data</div>
                  <div className="text-white/70 text-sm">
                    All your wizard inputs (location, goals, facility details) will be pre-filled
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Use */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4ADE80]" />
              How to Use It
            </h3>
            <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 rounded-xl p-4 border border-[#6366F1]/30">
              <ol className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#FDE047]">1.</span>
                  <span>Click "Continue" to open ProQuote with your current wizard data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#FDE047]">2.</span>
                  <span>Review and adjust system parameters using the interactive controls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#FDE047]">3.</span>
                  <span>Watch real-time calculations update as you make changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#FDE047]">4.</span>
                  <span>Generate your custom quote with TrueQuote™ verified data</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gradient-to-t from-[#1a1a2e] to-transparent border-t border-white/10 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
          >
            Close
          </button>
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[0_4px_16px_rgba(16,185,129,0.5)] flex items-center gap-2"
          >
            Continue to ProQuote
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

