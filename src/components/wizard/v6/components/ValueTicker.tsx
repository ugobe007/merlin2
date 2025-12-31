/**
 * VALUE TICKER - SLIM VERSION
 * ============================
 * 
 * A thin floating bar showing real-time economic impact.
 * Single row design - minimal vertical footprint.
 * 
 * Height: ~60px collapsed, ~120px expanded on hover
 * 
 * Created: December 31, 2025
 */

import React, { useMemo, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface ValueTickerProps {
  annualEnergySpend?: number;
  peakDemandCharges?: number;
  annualUsageKwh?: number;
  avgOutagesPerYear?: number;
  solarKw?: number;
  bessKwh?: number;
  generatorKw?: number;
  generatorFuel?: 'natural-gas' | 'diesel';
  evL2Count?: number;
  evDcfcCount?: number;
  hasSolar?: boolean;
  hasGenerator?: boolean;
  hasEv?: boolean;
  currentStep: number;
  industryType?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const SSOT = {
  utility: { rate: 0.12, demandRate: 15 },
  solar: { savingsPerKw: 400 },
  bess: { demandReductionPct: 0.60 },
  ev: { l2Revenue: 150, dcfcRevenue: 800 },
  outage: { costPerHour: 12000, avgDurationHours: 4 }
};

const TEMP_LEVELS = [
  { pct: 0, color: '#3b82f6', label: 'Starting', emoji: '❄️' },
  { pct: 20, color: '#06b6d4', label: 'Warming Up', emoji: '🌡️' },
  { pct: 40, color: '#10b981', label: 'Building', emoji: '📈' },
  { pct: 60, color: '#f59e0b', label: 'Strong', emoji: '🔥' },
  { pct: 80, color: '#ef4444', label: 'Excellent', emoji: '💰' },
  { pct: 100, color: '#dc2626', label: 'Maximum!', emoji: '🚀' }
];

function getTemperatureLevel(pct: number) {
  for (let i = TEMP_LEVELS.length - 1; i >= 0; i--) {
    if (pct >= TEMP_LEVELS[i].pct) return TEMP_LEVELS[i];
  }
  return TEMP_LEVELS[0];
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value.toLocaleString()}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ValueTicker: React.FC<ValueTickerProps> = ({
  annualEnergySpend = 0,
  peakDemandCharges = 0,
  avgOutagesPerYear = 4.2,
  solarKw = 0,
  bessKwh = 0,
  evL2Count = 0,
  evDcfcCount = 0,
  hasSolar = false,
  hasGenerator = false,
  hasEv = false,
  currentStep
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // ========== CALCULATIONS ==========
  const calc = useMemo(() => {
    const solarSavings = hasSolar ? solarKw * SSOT.solar.savingsPerKw : 0;
    const demandReduction = peakDemandCharges * SSOT.bess.demandReductionPct;
    const evRevenue = hasEv ? (evL2Count * SSOT.ev.l2Revenue + evDcfcCount * SSOT.ev.dcfcRevenue) * 12 : 0;
    const outageRisk = avgOutagesPerYear * SSOT.outage.costPerHour * SSOT.outage.avgDurationHours;
    const riskProtection = hasGenerator ? outageRisk : (bessKwh > 0 ? outageRisk * 0.5 : 0);
    
    const totalAnnual = solarSavings + demandReduction + evRevenue;
    const tenYear = totalAnnual * 10;
    
    const maxPotential = (annualEnergySpend * 0.35) + (peakDemandCharges * 0.6) + 50000 + 50000;
    const temperaturePct = Math.min(100, Math.round(((totalAnnual + riskProtection) / Math.max(maxPotential, 1)) * 100));
    
    const monthlyWaste = Math.round((peakDemandCharges + outageRisk) / 12);
    
    return { solarSavings, demandReduction, evRevenue, riskProtection, totalAnnual, tenYear, temperaturePct, monthlyWaste };
  }, [hasSolar, hasGenerator, hasEv, solarKw, bessKwh, evL2Count, evDcfcCount, peakDemandCharges, annualEnergySpend, avgOutagesPerYear]);

  // Animate total
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const increment = (calc.totalAnnual - animatedTotal) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setAnimatedTotal(prev => Math.round(prev + increment));
      if (step >= steps) {
        setAnimatedTotal(calc.totalAnnual);
        clearInterval(timer);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [calc.totalAnnual]);

  const tempLevel = getTemperatureLevel(calc.temperaturePct);
  
  if (currentStep < 3) return null;

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: 'sticky',
        top: 8,
        zIndex: 100,
        margin: '0 auto 20px',
        maxWidth: 900,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
        backdropFilter: 'blur(16px)',
        borderRadius: 14,
        border: '1px solid rgba(251,191,36,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* MAIN BAR - Always visible */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        height: 56
      }}>
        {/* Temperature Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
          <span style={{ fontSize: 22 }}>{tempLevel.emoji}</span>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>VALUE</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tempLevel.color, lineHeight: 1.2 }}>{tempLevel.label}</div>
          </div>
        </div>

        {/* Temperature Bar */}
        <div style={{ flex: 1, height: 20, background: 'rgba(0,0,0,0.4)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${calc.temperaturePct}%`,
            background: `linear-gradient(90deg, #3b82f6, #06b6d4, #10b981, #f59e0b, ${tempLevel.color})`,
            borderRadius: 10,
            transition: 'width 0.6s ease',
            boxShadow: `0 0 12px ${tempLevel.color}66`
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.7)'
          }}>
            {calc.temperaturePct}%
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Annual Value */}
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Annual</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{formatCurrency(animatedTotal)}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* 10-Year Value */}
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>10-Year</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>{formatCurrency(calc.tenYear)}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

        {/* Cost of Inaction */}
        <div style={{ textAlign: 'center', minWidth: 100 }}>
          <div style={{ fontSize: 9, color: '#fca5a5', textTransform: 'uppercase' }}>Without Action</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>-{formatCurrency(calc.monthlyWaste)}/mo</div>
        </div>

        {/* Expand hint */}
        <div style={{ 
          fontSize: 18, 
          color: '#64748b',
          transition: 'transform 0.3s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </div>
      </div>

      {/* EXPANDED DETAILS - Shows on hover */}
      <div style={{
        maxHeight: isExpanded ? 80 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        borderTop: isExpanded ? '1px solid rgba(255,255,255,0.1)' : 'none'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          gap: 12
        }}>
          {/* Breakdown items */}
          {calc.demandReduction > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔋</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>BESS:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>+{formatCurrency(calc.demandReduction)}/yr</span>
            </div>
          )}
          
          {hasSolar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>☀️</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Solar:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>+{formatCurrency(calc.solarSavings)}/yr</span>
            </div>
          )}
          
          {hasGenerator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔥</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Protected:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{formatCurrency(calc.riskProtection)}</span>
            </div>
          )}
          
          {hasEv && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>EV:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4' }}>+{formatCurrency(calc.evRevenue)}/yr</span>
            </div>
          )}

          {/* Merlin hint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 18 }}>🧙</span>
            <span style={{ fontSize: 11, color: '#fcd34d', fontStyle: 'italic' }}>
              {calc.temperaturePct < 40 ? "Add options to increase value →" : 
               calc.temperaturePct < 70 ? "You're building solid returns!" : 
               "Excellent configuration! 🎉"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ValueTicker };
export default ValueTicker;
