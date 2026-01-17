/**
 * Savings Preview Panel
 * ======================
 * Shows a "sneak peek" of potential savings in Step 1 after business lookup.
 * 
 * ⚠️ IMPORTANT: This is NOT TrueQuote™ verified data!
 * - Based on industry averages and heuristics
 * - Clearly labeled as "ESTIMATE" in UI
 * - Real TrueQuote™ numbers are calculated in Steps 4-6
 * 
 * Created: January 14, 2026
 */

import React from 'react';
import { Sparkles, TrendingUp, Sun, Battery, ArrowRight, Info, Zap, Clock } from 'lucide-react';
import type { SavingsPreviewEstimate } from '../types';

// ============================================================================
// INDUSTRY AVERAGE SAVINGS (Used for estimates ONLY)
// ============================================================================

/**
 * Industry average energy profiles for ESTIMATE calculations
 * These are NOT SSOT - they're rough averages for preview purposes
 * 
 * Source: Industry benchmarks, NOT TrueQuote verified
 */
const INDUSTRY_AVERAGES: Record<string, {
  avgPeakKW: number;
  avgAnnualKWh: number;
  peakShavingPercent: number;
  solarFitPercent: number;
  backupValueMultiplier: number;
  typicalBESSKW: number;
  typicalSolarKW: number;
}> = {
  hotel: { avgPeakKW: 350, avgAnnualKWh: 1_500_000, peakShavingPercent: 0.25, solarFitPercent: 0.3, backupValueMultiplier: 1.2, typicalBESSKW: 150, typicalSolarKW: 200 },
  car_wash: { avgPeakKW: 200, avgAnnualKWh: 600_000, peakShavingPercent: 0.35, solarFitPercent: 0.4, backupValueMultiplier: 0.8, typicalBESSKW: 100, typicalSolarKW: 150 },
  ev_charging: { avgPeakKW: 500, avgAnnualKWh: 1_000_000, peakShavingPercent: 0.40, solarFitPercent: 0.35, backupValueMultiplier: 1.0, typicalBESSKW: 250, typicalSolarKW: 300 },
  manufacturing: { avgPeakKW: 800, avgAnnualKWh: 3_000_000, peakShavingPercent: 0.30, solarFitPercent: 0.25, backupValueMultiplier: 1.5, typicalBESSKW: 400, typicalSolarKW: 500 },
  data_center: { avgPeakKW: 2000, avgAnnualKWh: 15_000_000, peakShavingPercent: 0.20, solarFitPercent: 0.15, backupValueMultiplier: 2.0, typicalBESSKW: 1000, typicalSolarKW: 800 },
  hospital: { avgPeakKW: 1500, avgAnnualKWh: 8_000_000, peakShavingPercent: 0.20, solarFitPercent: 0.2, backupValueMultiplier: 2.5, typicalBESSKW: 750, typicalSolarKW: 600 },
  retail: { avgPeakKW: 250, avgAnnualKWh: 800_000, peakShavingPercent: 0.30, solarFitPercent: 0.35, backupValueMultiplier: 0.7, typicalBESSKW: 100, typicalSolarKW: 150 },
  office: { avgPeakKW: 400, avgAnnualKWh: 1_200_000, peakShavingPercent: 0.25, solarFitPercent: 0.3, backupValueMultiplier: 0.8, typicalBESSKW: 200, typicalSolarKW: 250 },
  college: { avgPeakKW: 3000, avgAnnualKWh: 12_000_000, peakShavingPercent: 0.25, solarFitPercent: 0.35, backupValueMultiplier: 1.0, typicalBESSKW: 1500, typicalSolarKW: 2000 },
  warehouse: { avgPeakKW: 300, avgAnnualKWh: 1_000_000, peakShavingPercent: 0.30, solarFitPercent: 0.45, backupValueMultiplier: 0.6, typicalBESSKW: 150, typicalSolarKW: 300 },
  restaurant: { avgPeakKW: 100, avgAnnualKWh: 300_000, peakShavingPercent: 0.30, solarFitPercent: 0.3, backupValueMultiplier: 0.9, typicalBESSKW: 50, typicalSolarKW: 75 },
  agriculture: { avgPeakKW: 200, avgAnnualKWh: 500_000, peakShavingPercent: 0.35, solarFitPercent: 0.5, backupValueMultiplier: 0.7, typicalBESSKW: 100, typicalSolarKW: 200 },
  heavy_duty_truck_stop: { avgPeakKW: 400, avgAnnualKWh: 1_500_000, peakShavingPercent: 0.35, solarFitPercent: 0.35, backupValueMultiplier: 0.9, typicalBESSKW: 200, typicalSolarKW: 250 },
};

const DEFAULT_AVERAGES = { avgPeakKW: 300, avgAnnualKWh: 1_000_000, peakShavingPercent: 0.28, solarFitPercent: 0.3, backupValueMultiplier: 1.0, typicalBESSKW: 150, typicalSolarKW: 200 };

// ============================================================================
// ESTIMATE CALCULATOR (NOT SSOT!)
// ============================================================================

/**
 * Calculate ESTIMATED savings preview
 * 
 * ⚠️ WARNING: This is for UI preview ONLY!
 * Real calculations use TrueQuote™ in Steps 4-6
 */
export function calculateSavingsPreview(
  industrySlug: string,
  electricityRate: number = 0.12,
  demandCharge: number = 15,
  sunHours: number = 5
): SavingsPreviewEstimate & { typicalBESSKW: number; typicalSolarKW: number; estimatedROI: number; paybackYears: number } {
  const normalized = industrySlug.replace(/-/g, '_');
  const averages = INDUSTRY_AVERAGES[normalized] || DEFAULT_AVERAGES;

  // Peak shaving estimate: peakKW * demandCharge * 12 months * savings %
  const peakShavingSavings = Math.round(
    averages.avgPeakKW * demandCharge * 12 * averages.peakShavingPercent
  );

  // Solar estimate: based on sun hours and solar fit
  const solarKW = averages.avgPeakKW * averages.solarFitPercent;
  const solarAnnualKWh = solarKW * sunHours * 365 * 0.8; // 80% capacity factor
  const solarPotential = Math.round(solarAnnualKWh * electricityRate);

  // Backup value: based on industry criticality
  const backupValue = Math.round(
    averages.avgPeakKW * 100 * averages.backupValueMultiplier
  );

  // Total range (low = conservative, high = optimistic)
  const baseTotal = peakShavingSavings + solarPotential;
  const estimatedSavingsLow = Math.round(baseTotal * 0.7);
  const estimatedSavingsHigh = Math.round(baseTotal * 1.4);

  // ROI & Payback estimate (rough - assumes $150/kWh for BESS, $1.50/W for solar)
  const bessCapex = averages.typicalBESSKW * 4 * 150; // 4-hour duration
  const solarCapex = averages.typicalSolarKW * 1500;
  const totalCapex = bessCapex + solarCapex;
  const avgAnnualSavings = (estimatedSavingsLow + estimatedSavingsHigh) / 2;
  const paybackYears = Math.round((totalCapex / avgAnnualSavings) * 10) / 10;
  const estimatedROI = Math.round(((avgAnnualSavings * 10) / totalCapex - 1) * 100); // 10-year ROI %

  return {
    estimatedSavingsLow,
    estimatedSavingsHigh,
    peakShavingSavings,
    solarPotential,
    backupValue,
    typicalBESSKW: averages.typicalBESSKW,
    typicalSolarKW: averages.typicalSolarKW,
    estimatedROI,
    paybackYears,
    isEstimate: true,
    disclaimer: `Preliminary estimate based on typical ${industrySlug.replace(/_/g, ' ')} energy profiles. Your personalized TrueQuote™ with verified savings will be calculated in Step 5.`,
    generatedAt: Date.now(),
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  businessName: string;
  industrySlug: string;
  industryName: string;
  electricityRate: number;
  demandCharge?: number;
  sunHours?: number;
  state?: string;
  onContinue: () => void;
  onChangeIndustry: () => void;
}

export function SavingsPreviewPanel({
  businessName,
  industrySlug,
  industryName,
  electricityRate,
  demandCharge = 15,
  sunHours = 5,
  state,
  onContinue,
  onChangeIndustry,
}: Props) {
  // Calculate estimate
  const preview = calculateSavingsPreview(industrySlug, electricityRate, demandCharge, sunHours);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="rounded-xl overflow-hidden border border-amber-500/50 shadow-lg shadow-amber-500/10">
      {/* Header - Compact ESTIMATE warning */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white font-bold">🔮 Savings Sneak Preview</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-amber-100 text-xs font-medium">
              ESTIMATE
            </span>
          </div>
          <p className="text-amber-100 text-xs">Based on {industryName} averages</p>
        </div>
      </div>

      {/* Content - Compact layout */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
        {/* Business Name - Left aligned small */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-white">{businessName}</h3>
            {state && <p className="text-amber-200/70 text-xs">{state}</p>}
          </div>
          <button
            onClick={onChangeIndustry}
            className="text-amber-300 hover:text-amber-200 transition-colors text-xs underline underline-offset-2"
          >
            Change industry
          </button>
        </div>

        {/* HERO: Main Savings Range - CENTER & PROMINENT */}
        <div className="text-center py-4 mb-3 bg-gradient-to-r from-amber-600/20 via-orange-500/30 to-amber-600/20 rounded-xl border border-amber-500/40">
          <p className="text-amber-200/90 text-sm mb-1 font-medium">💰 Potential Annual Savings</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-black text-amber-300 drop-shadow-lg">
              {formatCurrency(preview.estimatedSavingsLow)}
            </span>
            <span className="text-amber-400 text-2xl font-bold">-</span>
            <span className="text-4xl font-black text-amber-300 drop-shadow-lg">
              {formatCurrency(preview.estimatedSavingsHigh)}
            </span>
            <span className="text-amber-200/70 text-lg">/yr*</span>
          </div>
        </div>

        {/* Breakdown Cards - 5 columns now */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10/50">
            <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-cyan-300 font-bold text-sm">~{formatCurrency(preview.peakShavingSavings)}</p>
            <p className="text-slate-400 text-[10px]">Peak Shaving</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10/50">
            <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-amber-300 font-bold text-sm">~{formatCurrency(preview.solarPotential)}</p>
            <p className="text-slate-400 text-[10px]">Solar Potential</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/10/50">
            <Battery className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-green-300 font-bold text-sm">~{formatCurrency(preview.backupValue)}</p>
            <p className="text-slate-400 text-[10px]">Backup Value</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center border border-purple-500/50">
            <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-purple-300 font-bold text-sm">~{preview.paybackYears}yr</p>
            <p className="text-slate-400 text-[10px]">Payback</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center border border-emerald-500/50">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-emerald-300 font-bold text-sm">~{preview.estimatedROI}%</p>
            <p className="text-slate-400 text-[10px]">10yr ROI</p>
          </div>
        </div>

        {/* Potential System Config - NEW */}
        <div className="flex items-center justify-center gap-4 mb-3 py-2 px-3 bg-white/5/60 rounded-lg border border-white/10/50">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-green-400" />
            <span className="text-slate-300 text-sm">BESS: <span className="text-green-300 font-semibold">~{preview.typicalBESSKW} kW</span></span>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 text-sm">Solar: <span className="text-amber-300 font-semibold">~{preview.typicalSolarKW} kW</span></span>
          </div>
          <div className="w-px h-4 bg-slate-600" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300 text-sm">Duration: <span className="text-yellow-300 font-semibold">4 hrs</span></span>
          </div>
        </div>

        {/* Disclaimer - Compact */}
        <div className="flex items-center gap-2 mb-3 text-xs text-amber-200/70">
          <Info className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span>*Estimate based on typical {industryName.toLowerCase()} profiles. TrueQuote™ verified in Step 5.</span>
        </div>

        {/* Actions - Compact */}
        <div className="flex items-center justify-center">
          <button
            onClick={onContinue}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold text-sm hover:from-amber-400 hover:to-orange-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30"
          >
            👇 Pick 2 Goals Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
