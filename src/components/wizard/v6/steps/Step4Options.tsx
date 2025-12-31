/**
 * STEP 4: System Options - REDESIGNED
 * ====================================
 * Progressive disclosure with dependency logic
 * 
 * Order: Solar → Generator → EV Charging
 * 
 * Key Rules:
 * - Solar NO → Generator is MANDATORY (BESS needs power source)
 * - Recommended tiers PRE-FILL Customize sliders (hybrid approach)
 * - Each section has YES/NO gate before showing options
 * 
 * Updated: December 31, 2025
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { WizardState } from '../types';

// ============================================================================
// PULSE ANIMATION CSS
// ============================================================================
const pulseStyles = `
@keyframes subtlePulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
  }
  50% { 
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}
@keyframes greenPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
@keyframes cyanPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(6, 182, 212, 0); }
}
.pulse-amber { animation: subtlePulse 2s ease-in-out infinite; }
.pulse-green { animation: greenPulse 2s ease-in-out infinite; }
.pulse-cyan { animation: cyanPulse 2s ease-in-out infinite; }
`;

if (typeof document !== 'undefined' && !document.getElementById('pulse-styles-v2')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'pulse-styles-v2';
  styleEl.textContent = pulseStyles;
  document.head.appendChild(styleEl);
}

// ============================================================================
// TYPES
// ============================================================================
interface Step4State {
  solarDecision: 'undecided' | 'yes' | 'no';
  generatorDecision: 'undecided' | 'yes' | 'no';
  evDecision: 'undecided' | 'yes' | 'no';
  solarMode: 'undecided' | 'recommended' | 'customize';
  generatorMode: 'undecided' | 'recommended' | 'customize';
  evMode: 'undecided' | 'recommended' | 'customize';
}

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onStep4StateChange?: (state: Step4State) => void;
}

type DecisionState = 'undecided' | 'yes' | 'no';
type ConfigMode = 'undecided' | 'recommended' | 'customize';
type FuelType = 'natural-gas' | 'diesel';

interface SolarTier {
  name: string;
  sizeKw: number;
  coverage: string;
  panels: number;
  annualSavingsRaw: number;
  installCostRaw: number;
  netCostRaw: number;
  paybackYears: number;
  tag?: string;
}

interface EvTier {
  name: string;
  l2Count: number;
  dcfcCount: number;
  powerKw: number;
  monthlyRevenueRaw: number;
  installCostRaw: number;
  tag?: string;
}

interface GeneratorTier {
  name: string;
  sizeKw: number;
  coverage: string;
  runtimeHours: number;
  netCostRaw: number;
  tag?: string;
}

// ============================================================================
// SSOT CONFIGURATION
// ============================================================================
const SSOT = {
  solar: { costPerWatt: 1.50, federalITC: 0.30 },
  ev: { l2Cost: 6000, dcfcCost: 45000, l2Revenue: 150, dcfcRevenue: 800 },
  generator: { 
    costPerKw: 350, 
    installMultiplier: 1.4, 
    federalCredit: 0.10,
    dieselMultiplier: 0.90  // Diesel is 10% cheaper
  },
  utility: { rate: 0.12 }
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================
function calcSolarTier(name: string, coveragePct: number, annualUsage: number, sunHours: number, tag?: string): SolarTier {
  const kw = Math.round((annualUsage * coveragePct) / (sunHours * 365 * 0.85) / 5) * 5;
  const production = kw * sunHours * 365 * 0.85;
  const cost = kw * 1000 * SSOT.solar.costPerWatt;
  const netCost = cost * (1 - SSOT.solar.federalITC);
  const savings = production * SSOT.utility.rate;
  return {
    name,
    sizeKw: kw,
    coverage: `${Math.round(coveragePct * 100)}%`,
    panels: Math.ceil(kw * 1000 / 500),
    annualSavingsRaw: Math.round(savings),
    installCostRaw: Math.round(cost),
    netCostRaw: Math.round(netCost),
    paybackYears: Math.round((netCost / savings) * 10) / 10,
    tag
  };
}

function calcEvTier(name: string, l2: number, dcfc: number, tag?: string): EvTier {
  return {
    name,
    l2Count: l2,
    dcfcCount: dcfc,
    powerKw: Math.round(l2 * 7.7 + dcfc * 62.5),
    monthlyRevenueRaw: l2 * SSOT.ev.l2Revenue + dcfc * SSOT.ev.dcfcRevenue,
    installCostRaw: l2 * SSOT.ev.l2Cost + dcfc * SSOT.ev.dcfcCost,
    tag
  };
}

function calcGeneratorTier(name: string, kw: number, fuel: FuelType, tag?: string): GeneratorTier {
  const baseCost = kw * SSOT.generator.costPerKw * SSOT.generator.installMultiplier;
  const fuelMultiplier = fuel === 'diesel' ? SSOT.generator.dieselMultiplier : 1;
  const netCost = baseCost * fuelMultiplier * (1 - SSOT.generator.federalCredit);
  const consumption = fuel === 'diesel' ? 0.06 : 0.07; // gal/kWh
  return {
    name,
    sizeKw: kw,
    coverage: kw >= 400 ? 'Full facility' : kw >= 200 ? 'Critical loads' : 'Emergency only',
    runtimeHours: Math.round(500 / (kw * consumption)),
    netCostRaw: Math.round(netCost),
    tag
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Step4Options = ({ state, updateState, onStep4StateChange }: Props) => {
  // Location & usage data
  const sunHours = state.useCaseData?.sunHours || state.solarData?.sunHours || 6.3;
  const annualUsage = state.useCaseData?.estimatedAnnualKwh || 1850000;
  const peakDemand = state.useCaseData?.peakDemandKw || Math.round(annualUsage / 8760 * 1.5);

  // ========== SECTION 1: SOLAR ==========
  const [solarDecision, setSolarDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('solar')) return 'yes';
    return 'undecided';
  });
  const [solarMode, setSolarMode] = useState<ConfigMode>('undecided');
  const [solarTierKey, setSolarTierKey] = useState<string>('recommended');
  const [customSolarKw, setCustomSolarKw] = useState<number>(0);

  // ========== SECTION 2: GENERATOR ==========
  const [generatorDecision, setGeneratorDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('generator')) return 'yes';
    return 'undecided';
  });
  const [generatorFuel, setGeneratorFuel] = useState<FuelType>('natural-gas');
  const [generatorMode, setGeneratorMode] = useState<ConfigMode>('undecided');
  const [generatorTierKey, setGeneratorTierKey] = useState<string>('standard');
  const [customGeneratorKw, setCustomGeneratorKw] = useState<number>(200);

  // ========== SECTION 3: EV CHARGING ==========
  const [evDecision, setEvDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('ev')) return 'yes';
    return 'undecided';
  });
  const [evMode, setEvMode] = useState<ConfigMode>('undecided');
  const [evTierKey, setEvTierKey] = useState<string>('standard');
  const [customL2, setCustomL2] = useState<number>(6);
  const [customDcfc, setCustomDcfc] = useState<number>(2);

  // ========== COMPUTED TIERS ==========
  const solarTiers = useMemo(() => ({
    starter: calcSolarTier('Starter', 0.15, annualUsage, sunHours),
    recommended: calcSolarTier('Recommended', 0.30, annualUsage, sunHours, 'Best ROI'),
    maximum: calcSolarTier('Maximum', 0.50, annualUsage, sunHours, 'Max Savings')
  }), [annualUsage, sunHours]);

  const evTiers = useMemo(() => ({
    basic: calcEvTier('Basic', 4, 0),
    standard: calcEvTier('Standard', 6, 2, 'Most Popular'),
    premium: calcEvTier('Premium', 8, 4, 'EV Destination')
  }), []);

  const generatorTiers = useMemo(() => ({
    essential: calcGeneratorTier('Essential', 150, generatorFuel),
    standard: calcGeneratorTier('Standard', 300, generatorFuel, 'Recommended'),
    full: calcGeneratorTier('Full Backup', Math.round(peakDemand * 1.1 / 50) * 50, generatorFuel, 'Full Coverage')
  }), [peakDemand, generatorFuel]);

  // ========== DEPENDENCY LOGIC ==========
  // If Solar = NO, Generator MUST = YES
  const generatorLocked = solarDecision === 'no';
  
  useEffect(() => {
    if (solarDecision === 'no' && generatorDecision !== 'yes') {
      setGeneratorDecision('yes');
    }
  }, [solarDecision]);

  // ========== RECOMMENDED PRE-FILLS CUSTOMIZE ==========
  useEffect(() => {
    if (solarMode === 'recommended') {
      const tier = solarTiers[solarTierKey as keyof typeof solarTiers];
      setCustomSolarKw(tier.sizeKw);
    }
  }, [solarMode, solarTierKey, solarTiers]);

  useEffect(() => {
    if (evMode === 'recommended') {
      const tier = evTiers[evTierKey as keyof typeof evTiers];
      setCustomL2(tier.l2Count);
      setCustomDcfc(tier.dcfcCount);
    }
  }, [evMode, evTierKey, evTiers]);

  useEffect(() => {
    if (generatorMode === 'recommended') {
      const tier = generatorTiers[generatorTierKey as keyof typeof generatorTiers];
      setCustomGeneratorKw(tier.sizeKw);
    }
  }, [generatorMode, generatorTierKey, generatorTiers]);

  // ========== CURRENT SELECTIONS ==========
  const currentSolar = solarDecision === 'yes' ? (
    solarMode === 'customize' 
      ? { ...calcSolarTier('Custom', customSolarKw / (annualUsage / (sunHours * 365 * 0.85)), annualUsage, sunHours), sizeKw: customSolarKw }
      : solarTiers[solarTierKey as keyof typeof solarTiers]
  ) : null;

  const currentEv = evDecision === 'yes' ? (
    evMode === 'customize'
      ? calcEvTier('Custom', customL2, customDcfc)
      : evTiers[evTierKey as keyof typeof evTiers]
  ) : null;

  const currentGenerator = generatorDecision === 'yes' ? (
    generatorMode === 'customize'
      ? calcGeneratorTier('Custom', customGeneratorKw, generatorFuel)
      : generatorTiers[generatorTierKey as keyof typeof generatorTiers]
  ) : null;

  // ========== COMPLETION CHECK ==========
  const solarComplete = solarDecision === 'no' || (solarDecision === 'yes' && solarMode !== 'undecided');
  const generatorComplete = generatorDecision === 'no' || (generatorDecision === 'yes' && generatorMode !== 'undecided');
  const evComplete = evDecision === 'no' || (evDecision === 'yes' && evMode !== 'undecided');
  const allComplete = solarComplete && generatorComplete && evComplete;

  // ========== SYNC TO PARENT ==========
  useEffect(() => {
    const opts: string[] = [];
    if (solarDecision === 'yes') opts.push('solar');
    if (generatorDecision === 'yes') opts.push('generator');
    if (evDecision === 'yes') opts.push('ev');
    
    updateState({
      selectedOptions: opts,
      solarTier: currentSolar ? solarTierKey : null,
      evTier: currentEv ? evTierKey : null,
      // Store custom values for calculations
      customSolarKw: currentSolar?.sizeKw,
      customEvL2: currentEv?.l2Count,
      customEvDcfc: currentEv?.dcfcCount,
      customGeneratorKw: currentGenerator?.sizeKw,
      generatorFuel: generatorFuel
    });
  }, [solarDecision, generatorDecision, evDecision, solarMode, evMode, generatorMode, 
      solarTierKey, evTierKey, generatorTierKey, customSolarKw, customL2, customDcfc, 
      customGeneratorKw, generatorFuel, currentSolar, currentEv, currentGenerator, updateState]);

  // ========== REPORT STATE TO PARENT (for MerlinGuide) ==========
  useEffect(() => {
    if (onStep4StateChange) {
      onStep4StateChange({
        solarDecision,
        generatorDecision,
        evDecision,
        solarMode,
        generatorMode,
        evMode
      });
    }
  }, [solarDecision, generatorDecision, evDecision, solarMode, generatorMode, evMode, onStep4StateChange]);

  // ========== STYLES ==========
  const yesNoBtn = (selected: boolean, isYes: boolean, disabled: boolean = false): React.CSSProperties => ({
    padding: '14px 28px',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    background: selected 
      ? (isYes ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)')
      : 'rgba(100,116,139,0.2)',
    color: selected ? '#fff' : '#64748b',
    boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
  });

  const modeBtn = (selected: boolean, disabled: boolean = false): React.CSSProperties => ({
    flex: 1,
    padding: '12px 20px',
    border: selected ? '2px solid #8b5cf6' : '2px solid rgba(100,116,139,0.3)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
    color: selected ? '#a78bfa' : disabled ? '#475569' : '#94a3b8',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.2s'
  });

  const tierCard = (selected: boolean, color: string): React.CSSProperties => ({
    padding: 18,
    background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
    border: selected ? `2px solid ${color}` : '2px solid rgba(100,116,139,0.2)',
    borderRadius: 14,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
    boxShadow: selected ? `0 4px 20px ${color}33` : 'none'
  });

  const sectionStyle = (active: boolean, completed: boolean): React.CSSProperties => ({
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    border: completed ? '2px solid #10b981' : active ? '2px solid #fbbf24' : '2px solid rgba(100,116,139,0.3)',
    overflow: 'hidden',
    opacity: active || completed ? 1 : 0.5,
    transition: 'all 0.3s'
  });

  // ========== RENDER ==========
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 50, fontSize: 13, fontWeight: 500, color: '#fcd34d', marginBottom: 14 }}>
          ✨ Configure Your System
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0', color: '#fff' }}>
          Customize Your Energy Solution
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>
          Make selections for each component below
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {[
          { label: '☀️ Solar', done: solarComplete, active: !solarComplete },
          { label: '🔥 Generator', done: generatorComplete, active: solarComplete && !generatorComplete },
          { label: '⚡ EV Charging', done: evComplete, active: solarComplete && generatorComplete && !evComplete }
        ].map((step, i) => (
          <div key={i} style={{ flex: 1, padding: '12px 16px', background: step.done ? 'rgba(16,185,129,0.2)' : step.active ? 'rgba(251,191,36,0.2)' : 'rgba(100,116,139,0.1)', border: `1px solid ${step.done ? '#10b981' : step.active ? '#fbbf24' : 'rgba(100,116,139,0.3)'}`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#10b981' : step.active ? '#fbbf24' : '#64748b' }}>
              {step.done ? '✓ ' : ''}{step.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ================================================================
            SECTION 1: SOLAR
            ================================================================ */}
        <div style={sectionStyle(true, solarComplete)}>
          <div style={{ padding: 24 }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>☀️</div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#fff' }}>Add Solar Array</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>Primary power source for your BESS</p>
                </div>
              </div>
              
              {/* YES / NO Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setSolarDecision('yes')}
                  className={solarDecision === 'undecided' ? 'pulse-amber' : ''}
                  style={yesNoBtn(solarDecision === 'yes', true)}
                >
                  ✓ YES
                </button>
                <button 
                  onClick={() => setSolarDecision('no')}
                  className={solarDecision === 'undecided' ? 'pulse-amber' : ''}
                  style={yesNoBtn(solarDecision === 'no', false)}
                >
                  ✗ NO
                </button>
              </div>
            </div>

            {/* Warning if undecided */}
            {solarDecision === 'undecided' && (
              <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>👆</span>
                <span style={{ fontSize: 13, color: '#fcd34d', fontWeight: 500 }}>Please select YES or NO to continue</span>
              </div>
            )}

            {/* NO selected - info message */}
            {solarDecision === 'no' && (
              <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 14, color: '#fca5a5', fontWeight: 600 }}>Generator will be required</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Without solar, your BESS needs a backup power source</div>
                </div>
              </div>
            )}

            {/* YES selected - show mode selector */}
            {solarDecision === 'yes' && (
              <div style={{ marginTop: 16 }}>
                {/* Mode Toggle: Recommended vs Customize */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setSolarMode('recommended')}
                    className={solarMode === 'undecided' ? 'pulse-amber' : ''}
                    style={modeBtn(solarMode === 'recommended')}
                  >
                    ⭐ Recommended
                  </button>
                  <button
                    onClick={() => setSolarMode('customize')}
                    className={solarMode === 'undecided' ? 'pulse-amber' : ''}
                    style={modeBtn(solarMode === 'customize')}
                  >
                    🎛️ Customize
                  </button>
                </div>

                {/* Recommended Tiers */}
                {solarMode !== 'undecided' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {Object.entries(solarTiers).map(([key, tier]) => (
                      <div
                        key={key}
                        onClick={() => {
                          setSolarTierKey(key);
                          if (solarMode === 'recommended') {
                            setCustomSolarKw(tier.sizeKw);
                          }
                        }}
                        style={{
                          ...tierCard(solarTierKey === key || (solarMode === 'customize' && customSolarKw === tier.sizeKw), '#f59e0b'),
                          opacity: solarMode === 'customize' ? 0.6 : 1
                        }}
                      >
                        {tier.tag && (
                          <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: key === 'recommended' ? '#8b5cf6' : '#06b6d4', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                            {tier.tag}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{tier.name}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', margin: '6px 0 14px' }}>{tier.sizeKw} kW</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Coverage</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{tier.coverage}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Annual Savings</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>${tier.annualSavingsRaw.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Payback</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{tier.paybackYears} years</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>After 30% ITC</span>
                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>${tier.netCostRaw.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customize Slider */}
                {solarMode === 'customize' && (
                  <div style={{ marginTop: 20, padding: 20, background: 'rgba(251,191,36,0.1)', borderRadius: 14, border: '1px solid rgba(251,191,36,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, color: '#fcd34d', fontWeight: 600 }}>Solar Capacity</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>{customSolarKw} kW</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={500}
                      step={10}
                      value={customSolarKw}
                      onChange={(e) => setCustomSolarKw(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#fbbf24' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                      <span>20 kW</span>
                      <span>500 kW</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            SECTION 2: GENERATOR
            ================================================================ */}
        <div style={sectionStyle(solarComplete, generatorComplete)}>
          <div style={{ padding: 24 }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔥</div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#fff' }}>Add Backup Generator</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>
                    {generatorLocked ? '⚠️ Required - BESS needs power source without solar' : 'Extended outage protection'}
                  </p>
                </div>
              </div>
              
              {/* YES / NO Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setGeneratorDecision('yes')}
                  className={solarComplete && generatorDecision === 'undecided' ? 'pulse-green' : ''}
                  style={yesNoBtn(generatorDecision === 'yes', true, !solarComplete)}
                  disabled={!solarComplete}
                >
                  ✓ YES
                </button>
                <button 
                  onClick={() => !generatorLocked && setGeneratorDecision('no')}
                  className={solarComplete && !generatorLocked && generatorDecision === 'undecided' ? 'pulse-green' : ''}
                  style={yesNoBtn(generatorDecision === 'no', false, !solarComplete || generatorLocked)}
                  disabled={!solarComplete || generatorLocked}
                >
                  ✗ NO {generatorLocked && '🔒'}
                </button>
              </div>
            </div>

            {/* Locked message */}
            {generatorLocked && solarComplete && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#fca5a5' }}>🔒 Generator is required since you chose not to add solar</span>
              </div>
            )}

            {/* YES selected - show fuel type then mode */}
            {generatorDecision === 'yes' && solarComplete && (
              <div style={{ marginTop: 16 }}>
                {/* Fuel Type Toggle */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: 500 }}>Fuel Type:</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setGeneratorFuel('natural-gas')}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        border: generatorFuel === 'natural-gas' ? '2px solid #3b82f6' : '2px solid rgba(100,116,139,0.3)',
                        borderRadius: 10,
                        background: generatorFuel === 'natural-gas' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                        color: generatorFuel === 'natural-gas' ? '#60a5fa' : '#94a3b8',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🔵 Natural Gas
                    </button>
                    <button
                      onClick={() => setGeneratorFuel('diesel')}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        border: generatorFuel === 'diesel' ? '2px solid #f97316' : '2px solid rgba(100,116,139,0.3)',
                        borderRadius: 10,
                        background: generatorFuel === 'diesel' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                        color: generatorFuel === 'diesel' ? '#fb923c' : '#94a3b8',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🟠 Diesel (10% less)
                    </button>
                  </div>
                </div>

                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setGeneratorMode('recommended')}
                    className={generatorMode === 'undecided' ? 'pulse-green' : ''}
                    style={modeBtn(generatorMode === 'recommended')}
                  >
                    ⭐ Recommended
                  </button>
                  <button
                    onClick={() => setGeneratorMode('customize')}
                    className={generatorMode === 'undecided' ? 'pulse-green' : ''}
                    style={modeBtn(generatorMode === 'customize')}
                  >
                    🎛️ Customize
                  </button>
                </div>

                {/* Tiers */}
                {generatorMode !== 'undecided' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {Object.entries(generatorTiers).map(([key, tier]) => (
                      <div
                        key={key}
                        onClick={() => {
                          setGeneratorTierKey(key);
                          if (generatorMode === 'recommended') {
                            setCustomGeneratorKw(tier.sizeKw);
                          }
                        }}
                        style={{
                          ...tierCard(generatorTierKey === key, '#ef4444'),
                          opacity: generatorMode === 'customize' ? 0.6 : 1
                        }}
                      >
                        {tier.tag && (
                          <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: key === 'standard' ? '#8b5cf6' : '#ef4444', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                            {tier.tag}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{tier.name}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', margin: '6px 0 14px' }}>{tier.sizeKw} kW</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Coverage</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{tier.coverage}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Runtime</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{tier.runtimeHours} hrs</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>After Credits</span>
                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>${tier.netCostRaw.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customize Slider */}
                {generatorMode === 'customize' && (
                  <div style={{ marginTop: 20, padding: 20, background: 'rgba(239,68,68,0.1)', borderRadius: 14, border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 14, color: '#fca5a5', fontWeight: 600 }}>Generator Capacity</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{customGeneratorKw} kW</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={800}
                      step={25}
                      value={customGeneratorKw}
                      onChange={(e) => setCustomGeneratorKw(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#ef4444' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                      <span>50 kW (Emergency)</span>
                      <span>800 kW (Full Facility)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Waiting message */}
            {!solarComplete && (
              <div style={{ padding: '12px 16px', background: 'rgba(100,116,139,0.1)', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>⏳ Complete Solar selection first</span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            SECTION 3: EV CHARGING
            ================================================================ */}
        <div style={sectionStyle(solarComplete && generatorComplete, evComplete)}>
          <div style={{ padding: 24 }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚡</div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#fff' }}>Add EV Charging</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0' }}>Revenue opportunity - attract EV drivers</p>
                </div>
              </div>
              
              {/* YES / NO Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setEvDecision('yes')}
                  className={solarComplete && generatorComplete && evDecision === 'undecided' ? 'pulse-cyan' : ''}
                  style={yesNoBtn(evDecision === 'yes', true, !(solarComplete && generatorComplete))}
                  disabled={!(solarComplete && generatorComplete)}
                >
                  ✓ YES
                </button>
                <button 
                  onClick={() => setEvDecision('no')}
                  className={solarComplete && generatorComplete && evDecision === 'undecided' ? 'pulse-cyan' : ''}
                  style={yesNoBtn(evDecision === 'no', false, !(solarComplete && generatorComplete))}
                  disabled={!(solarComplete && generatorComplete)}
                >
                  ✗ NO
                </button>
              </div>
            </div>

            {/* YES selected */}
            {evDecision === 'yes' && solarComplete && generatorComplete && (
              <div style={{ marginTop: 16 }}>
                {/* Mode Toggle */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setEvMode('recommended')}
                    className={evMode === 'undecided' ? 'pulse-cyan' : ''}
                    style={modeBtn(evMode === 'recommended')}
                  >
                    ⭐ Recommended
                  </button>
                  <button
                    onClick={() => setEvMode('customize')}
                    className={evMode === 'undecided' ? 'pulse-cyan' : ''}
                    style={modeBtn(evMode === 'customize')}
                  >
                    🎛️ Customize
                  </button>
                </div>

                {/* Tiers */}
                {evMode !== 'undecided' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {Object.entries(evTiers).map(([key, tier]) => (
                      <div
                        key={key}
                        onClick={() => {
                          setEvTierKey(key);
                          if (evMode === 'recommended') {
                            setCustomL2(tier.l2Count);
                            setCustomDcfc(tier.dcfcCount);
                          }
                        }}
                        style={{
                          ...tierCard(evTierKey === key, '#06b6d4'),
                          opacity: evMode === 'customize' ? 0.6 : 1
                        }}
                      >
                        {tier.tag && (
                          <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: key === 'standard' ? '#8b5cf6' : '#06b6d4', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                            {tier.tag}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{tier.name}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#06b6d4', margin: '6px 0 14px' }}>
                          {tier.l2Count} L2 + {tier.dcfcCount} DCFC
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Power</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{tier.powerKw} kW</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Monthly Rev</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>${tier.monthlyRevenueRaw.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>10yr Revenue</span>
                            <span style={{ color: '#06b6d4', fontWeight: 600 }}>${Math.round(tier.monthlyRevenueRaw * 120 / 1000)}k</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customize Sliders */}
                {evMode === 'customize' && (
                  <div style={{ marginTop: 20, padding: 20, background: 'rgba(6,182,212,0.1)', borderRadius: 14, border: '1px solid rgba(6,182,212,0.3)' }}>
                    {/* L2 Slider */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: '#67e8f9', fontWeight: 600 }}>Level 2 Chargers</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{customL2}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={customL2}
                        onChange={(e) => setCustomL2(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#06b6d4' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        <span>0</span>
                        <span>20 chargers</span>
                      </div>
                    </div>
                    
                    {/* DCFC Slider */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: '#67e8f9', fontWeight: 600 }}>DC Fast Chargers</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{customDcfc}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={customDcfc}
                        onChange={(e) => setCustomDcfc(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#06b6d4' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        <span>0</span>
                        <span>10 chargers</span>
                      </div>
                    </div>
                    
                    {/* Summary */}
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(6,182,212,0.15)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#67e8f9', fontWeight: 500 }}>Monthly Revenue Estimate:</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>${(customL2 * 150 + customDcfc * 800).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Waiting message */}
            {!(solarComplete && generatorComplete) && (
              <div style={{ padding: '12px 16px', background: 'rgba(100,116,139,0.1)', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>⏳ Complete previous sections first</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          SUMMARY BAR
          ================================================================ */}
      {allComplete && (currentSolar || currentEv || currentGenerator) && (
        <div style={{ marginTop: 28, padding: 24, background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981', borderRadius: 16 }}>
          <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span> YOUR CONFIGURATION
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {currentSolar && (
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>☀️ Solar</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{currentSolar.sizeKw} kW</div>
                <div style={{ fontSize: 13, color: '#10b981' }}>${currentSolar.annualSavingsRaw.toLocaleString()}/yr</div>
              </div>
            )}
            {currentGenerator && (
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>🔥 Generator</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{currentGenerator.sizeKw} kW</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{generatorFuel === 'diesel' ? 'Diesel' : 'Natural Gas'}</div>
              </div>
            )}
            {currentEv && (
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>⚡ EV Charging</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#06b6d4' }}>{currentEv.l2Count}L2 + {currentEv.dcfcCount}DC</div>
                <div style={{ fontSize: 13, color: '#10b981' }}>${currentEv.monthlyRevenueRaw.toLocaleString()}/mo</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not complete warning */}
      {!allComplete && (
        <div style={{ marginTop: 28, padding: '20px 24px', background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)', borderRadius: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 24 }}>👆</span>
          <div style={{ fontSize: 16, color: '#fcd34d', fontWeight: 600, marginTop: 8 }}>
            Complete all selections above to continue
          </div>
        </div>
      )}
    </div>
  );
};

export { Step4Options };
export default Step4Options;
