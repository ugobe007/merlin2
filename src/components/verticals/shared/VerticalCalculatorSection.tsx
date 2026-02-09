/**
 * SHARED VERTICAL CALCULATOR SECTION
 * =====================================
 * Config-driven calculator: renders inputs from VerticalConfig.calculator.inputs
 * on the left, results card on the right.
 * 
 * Supports input types: number (slider), toggle, select, zip
 * Auto-calculates quote via QuoteEngine when inputs change (debounced).
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator as CalcIcon, DollarSign, MapPin } from 'lucide-react';
import type { VerticalConfig, CalculatorInput } from '@/config/verticalConfig';
import { getStateRate, STATE_NAMES } from '@/config/stateRates';
import { CalculatorResultsCard } from './CalculatorResultsCard';
import { QuoteEngine } from '@/core/calculations/QuoteEngine';

// ─── SSOT power calculators ────────────────────────────────────────────
import {
  calculateCarWashPowerSimple,
  calculateHotelPowerSimple,
  type CarWashTypeSimple,
} from '@/services/useCasePowerCalculations';
import {
  calculateEVChargingPowerSimple,
} from '@/services/evChargingCalculations';

/** Matches QuoteEngine.generateQuote() return type */
interface QuoteResult {
  financials: { annualSavings: number; paybackYears: number; roi25Year: number; [k: string]: any };
  costs: { netCost: number; [k: string]: any };
  benchmarkAudit?: { sources?: any[]; [k: string]: any };
  [k: string]: any;
}

interface VerticalCalculatorSectionProps {
  config: VerticalConfig;
  /** Called when "Build My Quote" is clicked */
  onBuildQuote: () => void;
  /** Called when "Talk to an Expert" is clicked */
  onTalkToExpert: () => void;
  /** Called to open TrueQuote modal */
  onShowTrueQuote: () => void;
  /** Expose current calculator inputs to parent for inline estimate */
  onInputsChange?: (inputs: Record<string, any>) => void;
  /** Optional: override initial state (e.g., California) */
  initialState?: string;
}

// ─── SSOT-backed power calculation dispatcher ────────────────────────────
function calculatePeakKW(slug: string, inputs: Record<string, any>, electricityRate: number): number {
  try {
    switch (slug) {
      case 'car-wash': {
        const result = calculateCarWashPowerSimple({
          bays: Number(inputs.numberOfBays) || 4,
          washType: 'tunnel' as CarWashTypeSimple,
          hasVacuums: !!inputs.includesVacuums,
          hasDryers: !!inputs.includesDryers,
          carsPerDay: Number(inputs.carsPerDay) || 150,
          electricityRate,
        });
        return result.peakKW;
      }
      case 'ev-charging': {
        const result = calculateEVChargingPowerSimple({
          level2Count: Number(inputs.level2Ports) || 4,
          dcfcCount: Number(inputs.dcfcPorts) || 4,
          hpcCount: Number(inputs.hpcPorts) || 2,
          electricityRate,
          demandCharge: 20,
        });
        return result.peakKW;
      }
      case 'hotel': {
        // Map landing-page hotel class options → SSOT HotelClassSimple type
        const HOTEL_CLASS_MAP: Record<string, 'economy' | 'midscale' | 'upscale' | 'luxury'> = {
          'economy': 'economy',
          'boutique': 'midscale',
          'commercial-chain': 'midscale',
          'brand-hotel': 'upscale',
          'midscale': 'midscale',
          'upscale': 'upscale',
          'luxury': 'luxury',
        };
        const mappedClass = HOTEL_CLASS_MAP[String(inputs.hotelClass)] || 'midscale';
        const result = calculateHotelPowerSimple({
          rooms: Number(inputs.numberOfRooms) || 150,
          hotelClass: mappedClass,
          amenities: [],
          electricityRate,
        });
        return result.peakKW;
      }
      default: {
        // Fallback: rough estimate from monthly bill
        const monthlyBill = Number(inputs.currentMonthlyBill) || 5000;
        return Math.round(monthlyBill / (electricityRate * 730) * 0.6);
      }
    }
  } catch {
    return 100; // safe minimum
  }
}

export function VerticalCalculatorSection({
  config,
  onBuildQuote,
  onTalkToExpert,
  onShowTrueQuote,
  onInputsChange,
  initialState = 'California',
}: VerticalCalculatorSectionProps) {
  const { theme, calculator } = config;

  // ─── Build initial input state from config ─────────────────────────
  const initialInputs = useMemo(() => {
    const defaults: Record<string, any> = { state: initialState };
    for (const input of calculator.inputs) {
      defaults[input.id] = input.defaultValue;
    }
    return defaults;
  }, [calculator.inputs, initialState]);

  const [inputs, setInputs] = useState<Record<string, any>>(initialInputs);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [peakKW, setPeakKW] = useState(0);

  // Propagate inputs to parent
  useEffect(() => {
    onInputsChange?.(inputs);
  }, [inputs, onInputsChange]);

  // ─── Debounced calculation ─────────────────────────────────────────
  const runCalculation = useCallback(async () => {
    setIsCalculating(true);
    try {
      const stateData = getStateRate(inputs.state);
      const kw = calculatePeakKW(calculator.ssotSlug, inputs, stateData.rate);
      setPeakKW(kw);

      const storageSizeMW = Math.max(0.1, (kw * calculator.bessRatio) / 1000);
      const result = await QuoteEngine.generateQuote({
        storageSizeMW,
        durationHours: calculator.durationHours,
        location: inputs.state,
        electricityRate: stateData.rate,
        useCase: calculator.ssotSlug,
      });

      setQuoteResult(result as unknown as QuoteResult);
    } catch (error) {
      console.error('Calculator error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, calculator]);

  useEffect(() => {
    const timer = setTimeout(runCalculation, 500);
    return () => clearTimeout(timer);
  }, [runCalculation]);

  // ─── Input update helper ───────────────────────────────────────────
  const updateInput = (id: string, value: any) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <section id="calculator" className="py-16 bg-white/5 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Calculate Your{' '}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-300 via-${theme.accentSecondary}-400 to-${theme.accent}-300`}>
              Savings
            </span>
          </h2>
          <p className={`text-${theme.accent}-200/70 max-w-2xl mx-auto`}>
            Enter your details below and see how much you could save with battery storage
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ─── LEFT: Input Form ─────────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30 shadow-2xl shadow-purple-500/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-${theme.accent}-500 rounded-xl flex items-center justify-center`}>
                <CalcIcon className="w-5 h-5 text-white" />
              </div>
              Your Details
            </h3>

            <div className="space-y-6">
              {calculator.inputs.map((inputDef) => (
                <CalculatorInputRenderer
                  key={inputDef.id}
                  def={inputDef}
                  value={inputs[inputDef.id]}
                  onChange={(val) => updateInput(inputDef.id, val)}
                  theme={theme}
                />
              ))}

              {/* State dropdown (always shown) */}
              <div>
                <label className={`block text-sm font-medium text-${theme.accent}-200 mb-2`}>State</label>
                <select
                  value={inputs.state}
                  onChange={(e) => updateInput('state', e.target.value)}
                  className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
                >
                  {STATE_NAMES.map((name) => (
                    <option key={name} value={name} className="bg-slate-800">{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Results Card ──────────────────────────── */}
          <CalculatorResultsCard
            config={config}
            quoteResult={quoteResult}
            isCalculating={isCalculating}
            peakKW={peakKW}
            onBuildQuote={onBuildQuote}
            onTalkToExpert={onTalkToExpert}
            onShowTrueQuote={onShowTrueQuote}
          />
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// INPUT RENDERER — renders a single CalculatorInput based on its type
// =============================================================================

interface CalculatorInputRendererProps {
  def: CalculatorInput;
  value: any;
  onChange: (val: any) => void;
  theme: VerticalConfig['theme'];
}

function CalculatorInputRenderer({ def, value, onChange, theme }: CalculatorInputRendererProps) {
  switch (def.type) {
    case 'number':
    case 'slider': {
      const numValue = Number(value) || Number(def.defaultValue) || 0;
      // If min/max provided, render as slider
      if (def.min != null && def.max != null) {
        return (
          <div>
            <label className={`block text-sm font-medium text-${theme.accent}-200 mb-2`}>{def.label}</label>
            <input
              type="range"
              min={def.min}
              max={def.max}
              step={def.step ?? 1}
              value={numValue}
              onChange={(e) => onChange(Number(e.target.value))}
              className={`w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-${theme.accent}-500`}
            />
            <div className="flex justify-between text-sm mt-1">
              <span className={`text-${theme.accent}-300`}>{def.min}{def.suffix ? ` ${def.suffix}` : ''}</span>
              <span className={`font-bold text-lg text-${theme.accent}-300`}>{numValue}{def.suffix ? ` ${def.suffix}` : ''}</span>
              <span className={`text-${theme.accent}-300`}>{def.max}{def.suffix ? ` ${def.suffix}` : ''}</span>
            </div>
          </div>
        );
      }
      // No min/max — render as text input (e.g., monthly bill)
      return (
        <div>
          <label className={`block text-sm font-medium text-${theme.accent}-200 mb-2`}>{def.label}</label>
          <div className="relative">
            {def.suffix === '$/mo' && (
              <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.accent}-400`} />
            )}
            <input
              type="text"
              inputMode="numeric"
              value={numValue || ''}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                onChange(parseInt(cleaned) || 0);
              }}
              onFocus={(e) => e.target.select()}
              placeholder={String(def.defaultValue)}
              className={`w-full bg-white/10 border border-white/20 rounded-xl ${def.suffix === '$/mo' ? 'pl-12' : 'pl-4'} pr-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
            />
          </div>
        </div>
      );
    }

    case 'toggle': {
      const isChecked = !!value;
      return (
        <label className="flex items-center gap-3 bg-white/5 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onChange(e.target.checked)}
            className={`w-5 h-5 rounded accent-${theme.accent}-500`}
          />
          <span className="text-white">{def.label}</span>
        </label>
      );
    }

    case 'select': {
      return (
        <div>
          <label className={`block text-sm font-medium text-${theme.accent}-200 mb-2`}>{def.label}</label>
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
          >
            {def.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    case 'zip': {
      return (
        <div>
          <label className={`block text-sm font-medium text-${theme.accent}-200 mb-2`}>
            <MapPin className="w-4 h-4 inline mr-1" />
            {def.label || 'ZIP Code'}
          </label>
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => {
              const zip = e.target.value.replace(/\D/g, '').substring(0, 5);
              onChange(zip);
            }}
            placeholder="Enter ZIP code"
            className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
            maxLength={5}
          />
        </div>
      );
    }

    default:
      return null;
  }
}
