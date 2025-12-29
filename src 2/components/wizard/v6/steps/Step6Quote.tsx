/**
 * STEP 6: Quote Review
 * ====================
 * The final summary with all the numbers
 * 
 * Created: December 28, 2025
 */

import React from 'react';
import { 
  Battery, 
  Sun, 
  Zap, 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  Download,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import type { WizardState } from '../types'; import { POWER_LEVELS } from '../types';

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
}

export function Step6Quote({ state }: Props) {
  const { calculations, selectedPowerLevel, opportunities } = state;
  const powerLevel = POWER_LEVELS.find(l => l.id === selectedPowerLevel);

  if (!calculations || !powerLevel) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Please complete the previous steps first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
          <CheckCircle className="w-4 h-4" />
          Your Quote is Ready
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Your Merlin Energy Quote
        </h1>
        <p className="text-purple-300">
          {powerLevel.name} system for your {state.industryName}
        </p>
      </div>

      {/* Quote Card */}
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 overflow-hidden">
        {/* Project Summary Header */}
        <div className="p-6 bg-purple-500/10 border-b border-purple-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{powerLevel.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4" />
                  {state.city || state.state || state.zipCode}
                  <span className="mx-1">•</span>
                  <Building2 className="w-4 h-4" />
                  {state.industryName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Quote ID</div>
              <div className="text-white font-mono">MQ-{Date.now().toString(36).toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* System Components */}
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
            System Components
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BESS */}
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Battery className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-medium">Battery Storage (BESS)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-slate-500">Power</div>
                  <div className="text-white">
                    {calculations.bessKW >= 1000 
                      ? `${(calculations.bessKW / 1000).toFixed(1)} MW` 
                      : `${calculations.bessKW} kW`}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Capacity</div>
                  <div className="text-white">
                    {calculations.bessKWh >= 1000 
                      ? `${(calculations.bessKWh / 1000).toFixed(1)} MWh` 
                      : `${calculations.bessKWh} kWh`}
                  </div>
                </div>
              </div>
            </div>

            {/* Solar (if selected) */}
            {calculations.solarKW > 0 && (
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Solar Array</span>
                </div>
                <div className="text-sm">
                  <div className="text-slate-500">Capacity</div>
                  <div className="text-white">{calculations.solarKW} kW</div>
                </div>
              </div>
            )}

            {/* EV Chargers (if selected) */}
            {calculations.evChargers > 0 && (
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-medium">EV Charging</span>
                </div>
                <div className="text-sm">
                  <div className="text-slate-500">Stations</div>
                  <div className="text-white">{calculations.evChargers} Level 3 Chargers</div>
                </div>
              </div>
            )}

            {/* Generator (if selected) */}
            {calculations.generatorKW > 0 && (
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Fuel className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-medium">Backup Generator</span>
                </div>
                <div className="text-sm">
                  <div className="text-slate-500">Capacity</div>
                  <div className="text-white">{calculations.generatorKW} kW</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
            Financial Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Investment</span>
              <span className="text-white font-semibold">
                ${calculations.totalInvestment.toLocaleString()}
              </span>
            </div>
            
            {calculations.federalITC > 0 && (
              <div className="flex justify-between items-center text-emerald-400">
                <span>Federal ITC (30%)</span>
                <span>-${calculations.federalITC.toLocaleString()}</span>
              </div>
            )}
            
            <div className="h-px bg-slate-700 my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Net Investment</span>
              <span className="text-2xl font-bold text-white">
                ${calculations.netInvestment.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Returns */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
            Projected Returns
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-400">
                ${Math.round(calculations.annualSavings / 1000)}K
              </div>
              <div className="text-xs text-slate-400">Annual Savings</div>
            </div>
            
            <div className="text-center p-4 bg-cyan-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-cyan-400">
                {calculations.paybackYears}
              </div>
              <div className="text-xs text-slate-400">Year Payback</div>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {calculations.tenYearROI}%
              </div>
              <div className="text-xs text-slate-400">10-Year ROI</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-500/25">
          <Mail className="w-5 h-5" />
          Request Official Quote
        </button>
        
        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all">
          <Download className="w-5 h-5" />
          Download PDF
        </button>
        
        <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all">
          <Phone className="w-5 h-5" />
          Talk to Expert
        </button>
      </div>

      {/* Disclaimer */}
      <div className="max-w-3xl mx-auto text-center text-xs text-slate-500">
        This is an estimate based on the information provided. Final pricing may vary based on 
        site assessment, utility rates, and equipment availability. Contact us for an official quote.
      </div>
    </div>
  );
}
