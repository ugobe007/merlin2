/**
 * VALUE TICKER - Enhanced Visual Design
 * ======================================
 * 
 * Slim floating bar showing real-time value capture during wizard Steps 3-6.
 * NOW WITH MORE POP: Brighter gradients, glow effects, bolder numbers.
 * 
 * Layout (56px collapsed):
 * [💰 SAVINGS] [████████ 78%] | Annual $137k | 5-Year $685k | Payback 5.2yr | Without -$144k/yr
 * 
 * Created: December 31, 2025
 */

import React, { useState, useMemo } from 'react';

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
// VALUE CALCULATIONS (SSOT)
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

  // Solar savings: ~$400/kW/year (conservative)
  const solarSavings = hasSolar ? solarKw * 400 : 0;

  // BESS demand charge reduction: 60% of demand charges
  const bessSavings = bessKwh > 0 ? peakDemandCharges * 0.6 : 0;

  // EV charging revenue: L2 ~$150/mo, DCFC ~$800/mo
  const evRevenue = hasEv ? ((evL2Count * 150) + (evDcfcCount * 800)) * 12 : 0;

  // Outage protection value: ~$50k/year avoided losses
  const outageProtection = hasGenerator ? 50000 : (bessKwh > 0 ? 25000 : 0);

  // Generator fuel savings (if replacing grid during peak)
  const generatorSavings = hasGenerator ? generatorKw * 50 : 0;

  // Total annual savings/value
  const annualSavings = solarSavings + bessSavings + evRevenue + outageProtection + generatorSavings;

  // 5-year projection (with 3% annual increase)
  // Simple compound: Year 1 = 1.0, Year 2 = 1.03, Year 3 = 1.0609, Year 4 = 1.0927, Year 5 = 1.1255
  // Average over 5 years ≈ 1.03, so total ≈ 5.15x
  const fiveYearSavings = annualSavings * 5.15; // Accounts for 3% annual increase

  // Estimate payback period (years to break even)
  // Typical system costs (industry averages):
  // - BESS: ~$150-200/kWh
  // - Solar: ~$1.20/W ($1,200/kW)
  // - Generator: ~$700/kW
  // - EV Chargers: L2 ~$5k, DCFC ~$50k
  // After 30% ITC, net costs are ~70% of gross
  const estimatedBessCost = bessKwh > 0 ? bessKwh * 175 * 0.7 : 0; // $175/kWh × 70% after ITC
  const estimatedSolarCost = solarKw > 0 ? solarKw * 1200 * 0.7 : 0; // $1,200/kW × 70% after ITC
  const estimatedGeneratorCost = generatorKw > 0 ? generatorKw * 700 * 0.7 : 0; // $700/kW × 70% after ITC
  const estimatedEvCost = (evL2Count * 5000 + evDcfcCount * 50000) * 0.7; // × 70% after ITC
  
  const estimatedNetInvestment = estimatedBessCost + estimatedSolarCost + estimatedGeneratorCost + estimatedEvCost;
  
  // Payback period = Net Investment / Annual Savings
  const paybackYears = annualSavings > 0 && estimatedNetInvestment > 0 
    ? estimatedNetInvestment / annualSavings 
    : 0;

  // Cost of inaction: demand charges + outage exposure
  const avgOutagesPerYear = 3;
  const outageCostPerHour = 12000;
  const monthlyWaste = (peakDemandCharges / 12) + (avgOutagesPerYear * outageCostPerHour * 4 / 12);
  const annualWaste = monthlyWaste * 12;

  // Max potential (for savings progress gauge)
  const maxPotential = (annualEnergySpend * 0.35) + (peakDemandCharges * 0.6) + 50000 + 50000;
  const savingsPercent = maxPotential > 0 ? Math.min(100, (annualSavings / maxPotential) * 100) : 0;

  return {
    annualSavings,
    fiveYearSavings,
    paybackYears,
    annualWaste,
    savingsPercent,
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
// SAVINGS PROGRESS CONFIG
// ============================================================================
const getSavingsProgressState = (percent: number) => {
  if (percent < 10) return { emoji: '💰', label: 'Starting', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' };
  if (percent < 25) return { emoji: '💰', label: 'Growing', color: '#06b6d4', glow: 'rgba(6,182,212,0.5)' };
  if (percent < 45) return { emoji: '💰', label: 'Strong', color: '#10b981', glow: 'rgba(16,185,129,0.5)' };
  if (percent < 65) return { emoji: '💰', label: 'Excellent', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' };
  if (percent < 85) return { emoji: '💰', label: 'Outstanding', color: '#ef4444', glow: 'rgba(239,68,68,0.5)' };
  return { emoji: '💰', label: 'Maximum', color: '#dc2626', glow: 'rgba(220,38,38,0.6)' };
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
  const progressState = getSavingsProgressState(values.savingsPercent);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'sticky',
        top: 0, // Stick to top - will be below header due to DOM order
        marginTop: 0,
        zIndex: 98, // Just below header (100) but above all content - ensure it stays visible
        width: '100%',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.99), rgba(30,41,59,0.99))',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: `2px solid ${progressState.color}`,
        boxShadow: `0 4px 32px rgba(0,0,0,0.6), 0 0 60px ${progressState.glow}, inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)`,
        padding: isHovered ? '14px 24px 18px' : '12px 24px',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        // Hardware acceleration for smooth scrolling
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        willChange: 'transform',
        // Compact design when scrolling
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '1536px', // max-w-6xl equivalent
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Main Row */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap'
      }}>
        {/* Savings Progress Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
          {/* Emoji + Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: `linear-gradient(135deg, ${progressState.color}22, ${progressState.color}11)`,
            border: `1px solid ${progressState.color}66`,
            borderRadius: 20,
            boxShadow: `0 0 20px ${progressState.glow}`
          }}>
            <span style={{ fontSize: 20 }}>{progressState.emoji}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: progressState.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Savings
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
                width: `${values.savingsPercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f59e0b, #ef4444)`,
                backgroundSize: '500% 100%',
                backgroundPosition: `${100 - values.savingsPercent}% 0`,
                borderRadius: 5,
                transition: 'width 0.6s ease-out',
                boxShadow: `0 0 10px ${progressState.glow}`
              }}
            />
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: progressState.color,
            textShadow: `0 0 10px ${progressState.glow}`
          }}>
            {Math.round(values.savingsPercent)}%
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Annual Savings */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            Annual Savings
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#10b981',
            textShadow: '0 0 20px rgba(16,185,129,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatCurrency(values.annualSavings, true)}
          </div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>/yr</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* 5-Year Savings */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            5-Year Savings
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#60a5fa',
            textShadow: '0 0 20px rgba(96,165,250,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {formatCurrency(values.fiveYearSavings, true)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Payback Period */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            Payback
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#fbbf24',
            textShadow: '0 0 20px rgba(251,191,36,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {values.paybackYears > 0 ? `${values.paybackYears.toFixed(1)}yr` : '—'}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Cost of Inaction */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
            Without System
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#f87171',
            textShadow: '0 0 20px rgba(248,113,113,0.5)',
            fontVariantNumeric: 'tabular-nums'
          }}>
            -{formatCurrency(values.annualWaste, true)}/yr
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
    </div>
  );
};

export { ValueTicker };
export default ValueTicker;
