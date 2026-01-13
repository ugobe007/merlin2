/**
 * VALUE TICKER - Enhanced Visual Design
 * ======================================
 * 
 * Slim floating bar showing real-time value capture during wizard Steps 3-6.
 * NOW WITH MORE POP: Brighter gradients, glow effects, bolder numbers.
 * 
 * Layout (56px collapsed):
 * [❄️ VALUE] [████████ 78%] | Annual $137k | 10-Year $1.4M | Without -$12k/mo
 * 
 * SSOT: Uses DEFAULTS.Preview for all calculations
 * 
 * Created: December 31, 2025
 * Updated: January 2026 - SSOT compliance
 */

import React, { useState, useMemo } from 'react';
import { DEFAULTS } from '@/services/data/constants';

// ============================================================================
// TYPES
// ============================================================================
interface ValueTickerProps {
  currentStep: number;
  
  // Energy baseline
  annualEnergySpend: number;      // $ per year on energy
  peakDemandCharges: number;      // $ per year in demand charges
  annualUsageKwh: number;         // kWh per year
  
  // User selections
  solarKw: number;
  bessKwh: number;
  generatorKw: number;
  generatorFuel: 'natural-gas' | 'diesel';
  evL2Count: number;
  evDcfcCount: number;
  
  // Flags
  hasSolar: boolean;
  hasGenerator: boolean;
  hasEv: boolean;
  industryType?: string;
}

// ============================================================================
// VALUE CALCULATIONS (SSOT - uses DEFAULTS.Preview)
// ============================================================================
function calculateValues(props: ValueTickerProps) {
  const {
    annualEnergySpend,
    peakDemandCharges,
    solarKw,
    bessKwh,
    generatorKw,
    evL2Count,
    evDcfcCount,
    hasSolar,
    hasGenerator,
    hasEv
  } = props;

  const P = DEFAULTS.Preview;

  // Solar savings: uses DEFAULTS.Preview.solarSavingsPerKW
  const solarSavings = hasSolar ? solarKw * P.solarSavingsPerKW : 0;

  // BESS demand charge reduction: uses DEFAULTS.Preview.bessDemanReductionPercent
  const bessSavings = bessKwh > 0 ? peakDemandCharges * P.bessDemanReductionPercent : 0;

  // EV charging revenue: uses DEFAULTS.Preview.evL2/evDcfcMonthlyRevenue
  const evRevenue = hasEv ? ((evL2Count * P.evL2MonthlyRevenue) + (evDcfcCount * P.evDcfcMonthlyRevenue)) * 12 : 0;

  // Outage protection value: uses DEFAULTS.Preview.outageProtectionWith*
  const outageProtection = hasGenerator ? P.outageProtectionWithGen : (bessKwh > 0 ? P.outageProtectionWithBess : 0);

  // Generator fuel savings: uses DEFAULTS.Preview.generatorSavingsPerKW
  const generatorSavings = hasGenerator ? generatorKw * P.generatorSavingsPerKW : 0;

  // Total annual value
  const annualValue = solarSavings + bessSavings + evRevenue + outageProtection + generatorSavings;

  // 10-year projection: uses DEFAULTS.Preview.tenYearMultiplier
  const tenYearValue = annualValue * P.tenYearMultiplier;

  // Cost of inaction: demand charges + outage exposure
  const monthlyWaste = (peakDemandCharges / 12) + (P.avgOutagesPerYear * P.outageCostPerHour * 4 / 12);

  // Max potential (for temperature gauge)
  const maxPotential = (annualEnergySpend * 0.35) + (peakDemandCharges * P.bessDemanReductionPercent) + P.outageProtectionWithGen + P.outageProtectionWithGen;
  const temperaturePercent = maxPotential > 0 ? Math.min(100, (annualValue / maxPotential) * 100) : 0;

  return {
    annualValue,
    tenYearValue,
    monthlyWaste,
    temperaturePercent,
    breakdown: {
      solar: solarSavings,
      bess: bessSavings,
      ev: evRevenue,
      outage: outageProtection,
      generator: generatorSavings
    }
  };
}

// ============================================================================
// TEMPERATURE CONFIG
// ============================================================================
const getTemperatureState = (percent: number) => {
  if (percent < 10) return { emoji: '❄️', label: 'Starting', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' };
  if (percent < 25) return { emoji: '🌡️', label: 'Warming', color: '#06b6d4', glow: 'rgba(6,182,212,0.5)' };
  if (percent < 45) return { emoji: '📈', label: 'Building', color: '#10b981', glow: 'rgba(16,185,129,0.5)' };
  if (percent < 65) return { emoji: '🔥', label: 'Strong', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' };
  if (percent < 85) return { emoji: '💰', label: 'Excellent', color: '#ef4444', glow: 'rgba(239,68,68,0.5)' };
  return { emoji: '🚀', label: 'Maximum', color: '#dc2626', glow: 'rgba(220,38,38,0.6)' };
};

// ============================================================================
// FORMAT HELPERS
// ============================================================================
const formatCurrency = (value: number, compact = false) => {
  if (compact && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${value.toLocaleString()}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ValueTicker: React.FC<ValueTickerProps> = (props) => {
  const { currentStep } = props;
  const [isHovered, setIsHovered] = useState(false);
  const values = useMemo(() => calculateValues(props), [props]);

  // Only show on Steps 3-6 (but calculate values for all steps to maintain hook order)
  if (currentStep < 3) return null;
  const tempState = getTemperatureState(values.temperaturePercent);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
        backdropFilter: 'blur(12px)',
        borderBottom: `2px solid ${tempState.color}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 40px ${tempState.glow}`,
        padding: isHovered ? '12px 24px 16px' : '12px 24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Main Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap'
      }}>
        {/* Temperature Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
          {/* Emoji + Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: `linear-gradient(135deg, ${tempState.color}22, ${tempState.color}11)`,
            border: `1px solid ${tempState.color}66`,
            borderRadius: 20,
            boxShadow: `0 0 20px ${tempState.glow}`
          }}>
            <span style={{ fontSize: 20 }}>{tempState.emoji}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: tempState.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {tempState.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: 120,
            height: 10,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div
              style={{
                width: `${values.temperaturePercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)`,
                backgroundSize: '500% 100%',
                backgroundPosition: `${100 - values.temperaturePercent}% 0`,
                borderRadius: 5,
                transition: 'width 0.6s ease-out',
                boxShadow: `0 0 10px ${tempState.glow}`
              }}
            />
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: tempState.color,
            textShadow: `0 0 10px ${tempState.glow}`
          }}>
            {Math.round(values.temperaturePercent)}%
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Annual Value */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            Annual Value
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#10b981',
            textShadow: '0 0 20px rgba(16,185,129,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatCurrency(values.annualValue, true)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* 10-Year Value */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            10-Year Value
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#60a5fa',
            textShadow: '0 0 20px rgba(96,165,250,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatCurrency(values.tenYearValue, true)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Cost of Inaction */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            Without Action
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#f87171',
            textShadow: '0 0 20px rgba(248,113,113,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            -{formatCurrency(values.monthlyWaste, true)}/mo
          </div>
        </div>

        {/* Expand Indicator */}
        <div style={{
          marginLeft: 'auto',
          fontSize: 18,
          color: '#64748b',
          transition: 'transform 0.3s ease',
          transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </div>
      </div>

      {/* Expanded Breakdown */}
      <div style={{
        maxHeight: isHovered ? 80 : 0,
        opacity: isHovered ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        marginTop: isHovered ? 16 : 0
      }}>
        <div style={{
          display: 'flex',
          gap: 24,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {values.breakdown.bess > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🔋</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>BESS:</span>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                +{formatCurrency(values.breakdown.bess, true)}/yr
              </span>
            </div>
          )}
          {values.breakdown.solar > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>☀️</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Solar:</span>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>
                +{formatCurrency(values.breakdown.solar, true)}/yr
              </span>
            </div>
          )}
          {values.breakdown.generator > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Generator:</span>
              <span style={{ color: '#f97316', fontWeight: 700, fontSize: 14 }}>
                +{formatCurrency(values.breakdown.generator, true)}/yr
              </span>
            </div>
          )}
          {values.breakdown.ev > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🚗</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>EV:</span>
              <span style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 14 }}>
                +{formatCurrency(values.breakdown.ev, true)}/yr
              </span>
            </div>
          )}
          {values.breakdown.outage > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🛡️</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Protected:</span>
              <span style={{ color: '#06b6d4', fontWeight: 700, fontSize: 14 }}>
                {formatCurrency(values.breakdown.outage, true)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ValueTicker };
export default ValueTicker;
