/**
 * STEP 5: Magic Fit - Power Level Selection
 * =========================================
 * The Big Reveal: 3 cards with real calculations
 * 
 * Created: December 28, 2025
 */

import React, { useEffect, useMemo } from 'react';
import { Zap, Battery, Sun, Clock, TrendingUp, Star, Check } from 'lucide-react';
import type { WizardState, PowerLevel, SystemCalculations } from '../types'; import { POWER_LEVELS } from '../types';

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateSystem(state: WizardState, multiplier: number, durationHours: number): SystemCalculations {
  const { facilityDetails, opportunities, industry } = state;
  
  // Base power calculation by industry
  let basePowerKW = 0;
  
  switch (industry) {
    case 'hotel':
      // ~3-5 kW per room
      basePowerKW = (facilityDetails.roomCount || 100) * 4;
      break;
    case 'car_wash':
      // ~150 kW per tunnel
      basePowerKW = (facilityDetails.tunnelCount || 2) * 150;
      break;
    case 'ev_charging':
      // ~50-150 kW per charger depending on type
      basePowerKW = (facilityDetails.chargerCount || 10) * 100;
      break;
    case 'data_center':
      // ~5-10 kW per rack
      basePowerKW = (facilityDetails.rackCount || 50) * 7;
      break;
    case 'hospital':
      // ~5 kW per bed
      basePowerKW = (facilityDetails.bedCount || 100) * 5;
      break;
    default:
      // Default: based on square footage (~10W per sqft for commercial)
      basePowerKW = facilityDetails.squareFootage * 0.01;
  }
  
  // Use grid connection if specified and larger
  if (facilityDetails.gridConnectionKW > basePowerKW) {
    basePowerKW = facilityDetails.gridConnectionKW * 0.8; // Size for 80% of grid
  }
  
  // Apply multiplier for power level
  const bessKW = Math.round(basePowerKW * multiplier);
  const bessKWh = bessKW * durationHours;
  
  // Solar sizing (if selected)
  // Rule: ~15 watts per sqft of rooftop
  let solarKW = 0;
  if (opportunities.wantsSolar && facilityDetails.rooftopSquareFootage) {
    solarKW = Math.round(facilityDetails.rooftopSquareFootage * 0.015);
  } else if (opportunities.wantsSolar) {
    // Default: 30% of BESS power
    solarKW = Math.round(bessKW * 0.3);
  }
  
  // EV chargers (if selected)
  let evChargers = 0;
  if (opportunities.wantsEV) {
    // Suggest chargers based on facility size
    evChargers = Math.max(2, Math.round(facilityDetails.squareFootage / 20000));
  }
  
  // Generator (if selected) - sized to cover critical load
  let generatorKW = 0;
  if (opportunities.wantsGenerator) {
    generatorKW = Math.round(bessKW * 0.5);
  }
  
  // Financial calculations
  // BESS: $300-400/kWh installed (using $350)
  const bessCost = bessKWh * 350;
  
  // Solar: $2.50-3.50/W installed (using $3)
  const solarCost = solarKW * 3000;
  
  // EV Chargers: $30,000-50,000 per Level 3 charger
  const evCost = evChargers * 40000;
  
  // Generator: ~$500/kW
  const generatorCost = generatorKW * 500;
  
  const totalInvestment = bessCost + solarCost + evCost + generatorCost;
  
  // Federal ITC: 30% of solar
  const federalITC = solarCost * 0.30;
  const netInvestment = totalInvestment - federalITC;
  
  // Annual savings
  // BESS: Demand charge reduction + TOU arbitrage
  // Assume $15/kW demand charge, 12 months, 30% reduction
  const demandSavings = bessKW * 15 * 12 * 0.3;
  
  // Solar savings: Assume $0.12/kWh, 5 hours/day production, 300 days
  const solarSavings = solarKW * 0.12 * 5 * 300;
  
  const annualSavings = demandSavings + solarSavings;
  
  // Payback
  const paybackYears = netInvestment / annualSavings;
  
  // 10-year ROI
  const tenYearSavings = annualSavings * 10;
  const tenYearROI = ((tenYearSavings - netInvestment) / netInvestment) * 100;
  
  return {
    bessKW,
    bessKWh,
    solarKW,
    evChargers,
    generatorKW,
    totalInvestment,
    annualSavings: Math.round(annualSavings),
    paybackYears: Math.round(paybackYears * 10) / 10,
    tenYearROI: Math.round(tenYearROI),
    federalITC,
    netInvestment,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

export function Step5MagicFit({ state, updateState }: Props) {
  // Calculate all three power levels
  const calculations = useMemo(() => {
    return POWER_LEVELS.map(level => ({
      level,
      calc: calculateSystem(state, level.multiplier, level.durationHours),
    }));
  }, [state]);

  // Update state with calculations when power level is selected
  const selectPowerLevel = (level: PowerLevel) => {
    const selected = calculations.find(c => c.level.id === level);
    updateState({
      selectedPowerLevel: level,
      calculations: selected?.calc || null,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Choose Your Power Level
        </h1>
        <p className="text-purple-300">
          Select the system that fits your needs
        </p>
      </div>

      {/* Power Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {calculations.map(({ level, calc }) => {
          const isSelected = state.selectedPowerLevel === level.id;
          const isRecommended = level.recommended;

          return (
            <div
              key={level.id}
              className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10 scale-105'
                  : isRecommended
                  ? 'border-purple-500/50 bg-slate-800/80'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
              onClick={() => selectPowerLevel(level.id)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  MERLIN'S PICK
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      level.id === 'starter' ? 'bg-cyan-500/20 text-cyan-400' :
                      level.id === 'perfect_fit' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{level.name}</h3>
                      <p className="text-sm text-slate-400">{level.tagline}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-900/50 rounded-xl">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Battery className="w-3 h-3" /> Power
                    </div>
                    <div className="text-white font-semibold">
                      {calc.bessKW >= 1000 ? `${(calc.bessKW / 1000).toFixed(1)} MW` : `${calc.bessKW} kW`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="text-white font-semibold">{level.durationHours} hours</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Storage
                    </div>
                    <div className="text-white font-semibold">
                      {calc.bessKWh >= 1000 ? `${(calc.bessKWh / 1000).toFixed(1)} MWh` : `${calc.bessKWh} kWh`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Solar
                    </div>
                    <div className="text-white font-semibold">
                      {calc.solarKW > 0 ? `${calc.solarKW} kW` : '—'}
                    </div>
                  </div>
                </div>

                {/* Savings */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                  <div className="text-xs text-emerald-400 mb-1">ANNUAL SAVINGS</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${Math.round(calc.annualSavings / 1000)}K<span className="text-sm font-normal">/yr</span>
                  </div>
                </div>

                {/* ROI */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-400">
                    <TrendingUp className="w-4 h-4" />
                    {calc.paybackYears} year payback
                  </div>
                  {isRecommended && (
                    <div className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                      BEST ROI
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
                    isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {state.selectedPowerLevel && state.calculations && (
        <div className="max-w-2xl mx-auto p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
          <p className="text-purple-300">
            You selected <span className="text-white font-semibold">
              {POWER_LEVELS.find(l => l.id === state.selectedPowerLevel)?.name}
            </span> — 
            <span className="text-emerald-400"> ${Math.round(state.calculations.annualSavings / 1000)}K annual savings</span>
          </p>
        </div>
      )}
    </div>
  );
}
