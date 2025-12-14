/**
 * STEP TRANSITION MODALS
 * ======================
 * 
 * Modal popups for wizard step transitions:
 * 1. Step3to4Modal - Explains configuration step & Merlin's recommendation
 * 2. Step4to5Modal - Confirms configuration before generating quote
 * 
 * December 2025 - Professional guided experience
 */

import React from 'react';
import { X, Sparkles, Settings, Sliders, Battery, Sun, Zap, CheckCircle, ArrowRight, Shield, Wand2, TrendingUp } from 'lucide-react';
import merlinImage from '@/assets/images/new_Merlin.png';

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 → 4 TRANSITION: Welcome to Configuration
// ═══════════════════════════════════════════════════════════════════════════

interface Step3to4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  recommendation: {
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    generatorKW: number;
    annualSavings: number;
  };
  industryName: string;
}

export function Step3to4Modal({ 
  isOpen, 
  onClose, 
  onContinue,
  recommendation,
  industryName 
}: Step3to4ModalProps) {
  if (!isOpen) return null;

  const formatKW = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;
  const formatMoney = (amt: number) => amt >= 1000 ? `$${(amt/1000).toFixed(0)}K` : `$${Math.round(amt)}`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Merlin */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 p-6 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={merlinImage} alt="Merlin" className="w-20 h-20" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-3 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1">
                Great Progress! 🎉
              </h2>
              <p className="text-purple-100">
                I've analyzed your {industryName} and created a custom configuration
              </p>
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
        <div className="p-6">
          {/* What Merlin Created */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              My Recommendation for You
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-gray-800">Battery Storage</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatKWh(recommendation.batteryKWh)}</p>
                <p className="text-sm text-gray-500">{formatKW(recommendation.batteryKW)} power</p>
              </div>
              {recommendation.solarKW > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-gray-800">Solar Array</span>
                  </div>
                  <p className="text-2xl font-black text-amber-600">{formatKW(recommendation.solarKW)}</p>
                  <p className="text-sm text-gray-500">peak production</p>
                </div>
              )}
              {recommendation.generatorKW > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-slate-600" />
                    <span className="font-bold text-gray-800">Generator</span>
                  </div>
                  <p className="text-2xl font-black text-slate-600">{formatKW(recommendation.generatorKW)}</p>
                  <p className="text-sm text-gray-500">backup power</p>
                </div>
              )}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-gray-800">Est. Savings</span>
                </div>
                <p className="text-2xl font-black text-purple-600">{formatMoney(recommendation.annualSavings)}/yr</p>
                <p className="text-sm text-gray-500">projected annually</p>
              </div>
            </div>
          </div>

          {/* What's Next - Step by Step */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              What You'll Do Next
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-bold text-gray-800">Review My Configuration</p>
                  <p className="text-sm text-gray-600">See the recommended battery, solar, and generator sizes I've calculated for your facility</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-bold text-gray-800">Customize if Needed</p>
                  <p className="text-sm text-gray-600">Use the sliders to adjust any component. I'll update the savings estimate in real-time as you make changes</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-bold text-gray-800">Generate Your Quote</p>
                  <p className="text-sm text-gray-600">When you're happy with the configuration, click "Generate Quote" to see your full professional proposal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tools Available */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gray-600" />
              Tools Available to You
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">🔋 Battery Size Slider</span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">☀️ Solar Toggle & Slider</span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">⚡ Generator Options</span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">⏱️ Duration Selection</span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">📊 Real-time Cost Preview</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onContinue}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30"
          >
            Let's Configure My System
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 → 5 TRANSITION: Confirm Configuration
// ═══════════════════════════════════════════════════════════════════════════

interface Step4to5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoBack: () => void;
  configuration: {
    batteryKW: number;
    batteryKWh: number;
    durationHours: number;
    solarKW: number;
    windKW: number;
    generatorKW: number;
  };
  estimatedSavings: number;
  estimatedCost: number;
  industryName: string;
  isFirstTimeUser?: boolean;
}

export function Step4to5Modal({
  isOpen,
  onClose,
  onConfirm,
  onGoBack,
  configuration,
  estimatedSavings,
  estimatedCost,
  industryName,
  isFirstTimeUser = true,
}: Step4to5ModalProps) {
  if (!isOpen) return null;

  const formatKW = (kw: number) => kw >= 1000 ? `${(kw/1000).toFixed(1)} MW` : `${Math.round(kw)} kW`;
  const formatKWh = (kwh: number) => kwh >= 1000 ? `${(kwh/1000).toFixed(1)} MWh` : `${Math.round(kwh)} kWh`;
  const formatMoney = (amt: number) => {
    if (amt >= 1000000) return `$${(amt/1000000).toFixed(2)}M`;
    if (amt >= 1000) return `$${(amt/1000).toFixed(0)}K`;
    return `$${Math.round(amt)}`;
  };

  const totalPower = configuration.batteryKW + configuration.solarKW + configuration.windKW + configuration.generatorKW;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1">
                Ready to Generate Your Quote?
              </h2>
              <p className="text-emerald-100">
                Please confirm your configuration
              </p>
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
        <div className="p-6">
          {/* Configuration Summary */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Your Configuration Summary</h3>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Battery */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Battery className="w-4 h-4" />
                    Battery Storage
                  </div>
                  <p className="text-xl font-bold text-gray-800">{formatKWh(configuration.batteryKWh)}</p>
                  <p className="text-sm text-gray-500">{formatKW(configuration.batteryKW)} • {configuration.durationHours}hr</p>
                </div>
                
                {/* Solar */}
                {configuration.solarKW > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Sun className="w-4 h-4" />
                      Solar Array
                    </div>
                    <p className="text-xl font-bold text-gray-800">{formatKW(configuration.solarKW)}</p>
                    <p className="text-sm text-gray-500">peak capacity</p>
                  </div>
                )}
                
                {/* Wind */}
                {configuration.windKW > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="w-4 h-4" />
                      Wind Turbine
                    </div>
                    <p className="text-xl font-bold text-gray-800">{formatKW(configuration.windKW)}</p>
                  </div>
                )}
                
                {/* Generator */}
                {configuration.generatorKW > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Zap className="w-4 h-4" />
                      Backup Generator
                    </div>
                    <p className="text-xl font-bold text-gray-800">{formatKW(configuration.generatorKW)}</p>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-gray-600">Total System Power</span>
                <span className="text-xl font-black text-purple-600">{formatKW(totalPower)}</span>
              </div>
            </div>
          </div>

          {/* Financial Preview */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 text-center">
              <p className="text-sm text-emerald-600 font-semibold mb-1">Est. Annual Savings</p>
              <p className="text-3xl font-black text-emerald-600">{formatMoney(estimatedSavings)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 text-center">
              <p className="text-sm text-purple-600 font-semibold mb-1">Est. Project Cost</p>
              <p className="text-3xl font-black text-purple-600">{formatMoney(estimatedCost)}</p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">What Happens Next</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Generate your detailed professional quote
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                See complete equipment breakdown & costs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Download PDF to share with your bank or team
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onGoBack}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
            >
              Go Back & Adjust
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle className="w-5 h-5" />
              Generate My Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUEQUOTE EXPLAINER MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface TrueQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrueQuoteModal({ isOpen, onClose }: TrueQuoteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white mb-1">
                TrueQuote™ Verified
              </h2>
              <p className="text-emerald-100">
                Every number backed by authoritative sources
              </p>
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
        <div className="p-6">
          {/* What is TrueQuote */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">What is TrueQuote™?</h3>
            <p className="text-gray-600 leading-relaxed">
              TrueQuote™ is Merlin Energy's commitment to transparency. Every cost, every calculation, 
              and every recommendation in your quote is traceable to authoritative industry sources—not 
              guesswork or outdated data.
            </p>
          </div>

          {/* Our Data Sources */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Our Data Sources</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">NREL</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">National Renewable Energy Laboratory</p>
                  <p className="text-sm text-gray-600">Annual Technology Baseline (ATB) 2024 for battery and solar costs</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">IRA</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Inflation Reduction Act 2022</p>
                  <p className="text-sm text-gray-600">Federal Investment Tax Credit (ITC) calculations at 30%</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">IEEE</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">IEEE Standards</p>
                  <p className="text-sm text-gray-600">Industry sizing ratios and critical load calculations</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">EIA</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">U.S. Energy Information Administration</p>
                  <p className="text-sm text-gray-600">Regional electricity rates and utility data</p>
                </div>
              </div>
            </div>
          </div>

          {/* What This Means */}
          <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-800 mb-2">What This Means for You</h4>
            <ul className="text-sm text-emerald-700 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Take this quote to your bank with confidence—every number is defensible</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Compare against vendor quotes knowing your baseline is industry-accurate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Make informed decisions based on real-world data, not marketing claims</span>
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
