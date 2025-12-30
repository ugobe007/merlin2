import React, { useState, useMemo, useEffect } from 'react';
import type { WizardState } from '../types';

// Inject pulse animation CSS
const pulseStyles = `
@keyframes subtlePulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
  }
  50% { 
    transform: scale(1.03);
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}
.pulse-attention {
  animation: subtlePulse 2s ease-in-out infinite;
}
`;

// Inject styles into document head (once)
if (typeof document !== 'undefined' && !document.getElementById('pulse-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'pulse-styles';
  styleEl.textContent = pulseStyles;
  document.head.appendChild(styleEl);
}

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

/**
 * SSOT Configuration - All pricing from authoritative sources
 * Source: NREL ATB 2024, DOE, EIA
 */
const SSOT_CONFIG = {
  solar: { costPerWatt: 1.50, panelWatts: 500, federalITC: 0.30, efficiencyFactor: 0.85, co2PerKwh: 0.0007 },
  utility: { ratePerKwh: 0.12, demandCharge: 12.50 },
  ev: { l2CostPerPort: 6000, dcfcCostPerPort: 45000, l2RevenuePerMonth: 150, dcfcRevenuePerMonth: 800, federalCredit: 0.30 },
  generator: { costPerKw: 350, installMultiplier: 1.4, federalCredit: 0.10, maintenancePerYear: 0.02 }
};

interface SolarTier { name: string; size: string; sizeKw: number; coverage: string; panels: number; annualProduction: string; annualProductionRaw: number; annualSavings: string; annualSavingsRaw: number; installCost: string; installCostRaw: number; netCost: string; netCostRaw: number; payback: string; co2Offset: string; tag?: string; }
interface EvTier { name: string; chargers: string; l2Count: number; dcfcCount: number; power: string; carsPerDay: string; monthlyRevenue: string; monthlyRevenueRaw: number; installCost: string; installCostRaw: number; tenYearRevenue: number; guestAppeal: string; tag?: string; }
interface GeneratorTier { name: string; size: string; sizeKw: number; fuelType: string; runtime: string; installCost: string; netCost: string; netCostRaw: number; annualMaintenance: string; coverage: string; tag?: string; }

function calcSolar(name: string, pct: number, usage: number, sun: number): SolarTier {
  const kw = Math.round((usage * pct) / (sun * 365 * 0.85) / 5) * 5;
  const prod = kw * sun * 365 * 0.85;
  const cost = kw * 1000 * 1.50;
  const net = cost * 0.70;
  const savings = prod * 0.12;
  return { name, size: `${kw} kW`, sizeKw: kw, coverage: `${Math.round(pct*100)}%`, panels: Math.ceil(kw*1000/500), annualProduction: Math.round(prod).toLocaleString(), annualProductionRaw: Math.round(prod), annualSavings: `$${Math.round(savings).toLocaleString()}`, annualSavingsRaw: Math.round(savings), installCost: `$${Math.round(cost).toLocaleString()}`, installCostRaw: Math.round(cost), netCost: `$${Math.round(net).toLocaleString()}`, netCostRaw: Math.round(net), payback: `${(net/savings).toFixed(1)} years`, co2Offset: `${Math.round(prod*0.0007)} tons/yr` };
}

function calcEv(name: string, l2: number, dc: number): EvTier {
  const cost = l2*6000 + dc*45000;
  const rev = l2*150 + dc*800;
  const stars = dc > 0 ? (dc >= 4 ? '★★★★★' : '★★★★☆') : '★★★☆☆';
  return { name, chargers: dc > 0 ? `${l2} L2 + ${dc} DC Fast` : `${l2} Level 2`, l2Count: l2, dcfcCount: dc, power: `${Math.round(l2*7.7+dc*62.5)} kW`, carsPerDay: `${Math.round((l2*2+dc*8)*0.8)}-${l2*2+dc*8}`, monthlyRevenue: `$${rev.toLocaleString()}`, monthlyRevenueRaw: rev, installCost: `$${cost.toLocaleString()}`, installCostRaw: cost, tenYearRevenue: rev*12*10, guestAppeal: stars };
}

function calcGen(name: string, kw: number, fuel: string): GeneratorTier {
  const cost = kw * 350 * 1.4;
  const net = cost * 0.90;
  return { name, size: `${kw} kW`, sizeKw: kw, fuelType: fuel, runtime: `${Math.round(500/(kw*0.07))} hrs`, installCost: `$${Math.round(cost).toLocaleString()}`, netCost: `$${Math.round(net).toLocaleString()}`, netCostRaw: Math.round(net), annualMaintenance: `$${Math.round(cost*0.02).toLocaleString()}/yr`, coverage: kw >= 400 ? 'Full facility' : kw >= 200 ? 'Critical loads' : 'Emergency only' };
}

type DecisionState = 'undecided' | 'yes' | 'no';

const Step4Options = ({ state, updateState }: Props) => {
  // Decision states - MUST be explicit before continuing
  const [solarDecision, setSolarDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('solar')) return 'yes';
    if (state.selectedOptions && state.selectedOptions.length > 0 && !state.selectedOptions.includes('solar')) return 'no';
    return 'undecided';
  });
  const [evDecision, setEvDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('ev')) return 'yes';
    if (state.selectedOptions && state.selectedOptions.length > 0 && !state.selectedOptions.includes('ev')) return 'no';
    return 'undecided';
  });
  const [generatorDecision, setGeneratorDecision] = useState<DecisionState>(() => {
    if (state.selectedOptions?.includes('generator')) return 'yes';
    return 'undecided';
  });

  const [solarTier, setSolarTier] = useState<string>(state.solarTier || 'recommended');
  const [evTier, setEvTier] = useState<string>(state.evTier || 'standard');
  const [generatorTier, setGeneratorTier] = useState<string>('standard');
  
  const [solarExpanded, setSolarExpanded] = useState(solarDecision === 'yes');
  const [evExpanded, setEvExpanded] = useState(evDecision === 'yes');
  const [generatorExpanded, setGeneratorExpanded] = useState(generatorDecision === 'yes');

  const loc = { city: state.city || 'Las Vegas', state: state.state || 'NV', sunHours: state.useCaseData?.sunHours || state.solarData?.sunHours || 6.3 };
  const ind = { type: state.industryName || 'Hotel / Hospitality', rooms: state.useCaseData?.roomCount || 150 };
  const usage = state.useCaseData?.estimatedAnnualKwh || 1850000;
  const peak = state.useCaseData?.peakDemandKw || Math.round(usage / 8760 * 1.5);

  const solarOpts = useMemo(() => ({
    starter: calcSolar('Starter', 0.15, usage, loc.sunHours),
    recommended: { ...calcSolar('Recommended', 0.30, usage, loc.sunHours), tag: 'Best ROI' },
    maximum: { ...calcSolar('Maximum', 0.50, usage, loc.sunHours), tag: 'Max Savings' }
  }), [usage, loc.sunHours]);

  const evOpts = useMemo(() => ({
    basic: calcEv('Basic', 4, 0),
    standard: { ...calcEv('Standard', 6, 2), tag: 'Most Popular' },
    premium: { ...calcEv('Premium', 8, 4), tag: 'EV Destination' }
  }), []);

  const genOpts = useMemo(() => ({
    essential: calcGen('Essential', 150, 'Natural Gas'),
    standard: { ...calcGen('Standard', 300, 'Natural Gas'), tag: 'Recommended' },
    full: { ...calcGen('Full Backup', Math.round(peak * 1.1 / 50) * 50, 'Natural Gas'), tag: 'Full Coverage' }
  }), [peak]);

  const curSolar = solarDecision === 'yes' ? solarOpts[solarTier as keyof typeof solarOpts] : null;
  const curEv = evDecision === 'yes' ? evOpts[evTier as keyof typeof evOpts] : null;
  const curGen = generatorDecision === 'yes' ? genOpts[generatorTier as keyof typeof genOpts] : null;
  const tenYr = (curSolar ? curSolar.annualSavingsRaw * 10 : 0) + (curEv ? curEv.tenYearRevenue : 0);
  const maxSolar = solarOpts.maximum.annualSavingsRaw;

  // ALL DECISIONS MUST BE MADE
  const allDecisionsMade = solarDecision !== 'undecided' && evDecision !== 'undecided' && generatorDecision !== 'undecided';

  // Sync to parent
  useEffect(() => {
    const opts: string[] = [];
    if (solarDecision === 'yes') opts.push('solar');
    if (evDecision === 'yes') opts.push('ev');
    if (generatorDecision === 'yes') opts.push('generator');
    updateState({ 
      selectedOptions: opts, 
      solarTier: solarDecision === 'yes' ? solarTier : null, 
      evTier: evDecision === 'yes' ? evTier : null 
    });
  }, [solarDecision, evDecision, generatorDecision, solarTier, evTier]);

  const tierStyle = (sel: boolean, color: string): React.CSSProperties => ({ 
    padding: 18, background: sel ? '#fff' : 'rgba(255,255,255,0.5)', 
    border: sel ? `2px solid ${color}` : '2px solid rgba(0,0,0,0.1)`, 
    borderRadius: 14, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', 
    boxShadow: sel ? `0 4px 16px ${color}33` : 'none' 
  });

  const btnStyle = (sel: boolean, isYes: boolean): React.CSSProperties => ({
    padding: '12px 24px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
    background: sel ? (isYes ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6b7280, #4b5563)') : 'rgba(0,0,0,0.05)',
    color: sel ? '#fff' : '#64748b',
    transform: sel ? 'scale(1.02)' : 'scale(1)',
    boxShadow: sel ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
  });

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 50, fontSize: 13, fontWeight: 500, color: '#fcd34d', marginBottom: 14 }}>✨ Personalized Recommendations</span>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 10px 0', color: '#fff' }}>💰 Boost Your Energy ROI 💰</h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>Based on your <span style={{ color: '#22d3ee', fontWeight: 600 }}>{loc.state}</span> location and <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{ind.type}</span> profile</p>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '14px 20px', background: allDecisionsMade ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', border: `1px solid ${allDecisionsMade ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`, borderRadius: 12, marginBottom: 24 }}>
          {[{ label: 'Solar', done: solarDecision !== 'undecided' }, { label: 'EV Charging', done: evDecision !== 'undecided' }, { label: 'Generator', done: generatorDecision !== 'undecided' }].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: item.done ? '#10b981' : '#fbbf24', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.done ? '✓' : i+1}</span>
                <span style={{ color: item.done ? '#10b981' : '#fbbf24', fontWeight: 500, fontSize: 13 }}>{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '18px 28px', background: '#fff', borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b' }}>Annual Usage</div><div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{(usage/1e6).toFixed(2)}M kWh</div></div>
          <div style={{ width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b' }}>Sun Hours/Day</div><div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>☀️ {loc.sunHours}</div></div>
          <div style={{ width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#64748b' }}>Property Size</div><div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{ind.rooms} rooms</div></div>
          <div style={{ width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#059669' }}>Potential Savings</div><div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>${Math.round((maxSolar + evOpts.premium.monthlyRevenueRaw*12)/1000)}k+/yr</div></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SOLAR CARD */}
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: solarDecision === 'yes' ? '0 4px 24px rgba(251,191,36,0.2), 0 0 0 2px #fbbf24' : solarDecision === 'undecided' ? '0 4px 20px rgba(0,0,0,0.15), 0 0 0 2px #fbbf24' : '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', background: solarDecision !== 'no' ? '#fffbeb' : '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>☀️</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1e293b' }}>Solar Array</h3><span style={{ padding: '4px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#fff' }}>High Opportunity ⭐</span></div>
                  <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>Hotels with solar see 15% boost in eco-conscious bookings</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right', marginRight: 8 }}><div style={{ fontSize: 11, color: '#64748b' }}>{curSolar ? 'Selected' : 'Up to'}</div><div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{curSolar ? curSolar.annualSavings : `$${maxSolar.toLocaleString()}`}/yr</div></div>
                <button onClick={() => { setSolarDecision('yes'); setSolarExpanded(true); }} className={solarDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(solarDecision === 'yes', true)}>✓ Add</button>
                <button onClick={() => { setSolarDecision('no'); setSolarExpanded(false); }} className={solarDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(solarDecision === 'no', false)}>No Thanks</button>
              </div>
            </div>
            {solarDecision === 'undecided' && <div style={{ padding: '12px 26px', background: '#fef3c7', borderTop: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>⚠️</span><span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>Please select "Add" or "No Thanks" to continue</span></div>}
            {solarDecision === 'yes' && (
              <div style={{ padding: '0 26px 26px', borderTop: '1px solid #e2e8f0', background: '#fefce8' }}>
                <div style={{ padding: '18px 0 14px', fontSize: 14, color: '#78716c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setSolarExpanded(!solarExpanded)}><span>📊 Choose configuration:</span><span style={{ fontSize: 18, color: '#a8a29e' }}>{solarExpanded ? '▼' : '▶'}</span></div>
                {solarExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    {Object.entries(solarOpts).map(([k, o]) => (
                      <div key={k} onClick={() => setSolarTier(k)} style={tierStyle(solarTier === k, '#f59e0b')}>
                        {o.tag && <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: k === 'recommended' ? '#8b5cf6' : '#06b6d4', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>{o.tag}</div>}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#78716c' }}>{o.name}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b', margin: '4px 0 12px' }}>{o.size}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#78716c' }}>Coverage</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.coverage}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#78716c' }}>Savings</span><span style={{ fontWeight: 700, color: '#10b981' }}>{o.annualSavings}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#78716c' }}>Payback</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.payback}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#78716c' }}>After 30% ITC</span><span style={{ fontWeight: 600, color: '#8b5cf6' }}>{o.netCost}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EV CHARGING CARD */}
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: evDecision === 'yes' ? '0 4px 24px rgba(6,182,212,0.2), 0 0 0 2px #06b6d4' : evDecision === 'undecided' ? '0 4px 20px rgba(0,0,0,0.15), 0 0 0 2px #06b6d4' : '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', background: evDecision !== 'no' ? '#ecfeff' : '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>⚡</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1e293b' }}>EV Charging</h3><span style={{ padding: '4px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#fff' }}>Revenue Opportunity ⭐</span></div>
                  <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>Properties with EV charging report 23% higher occupancy</p>
                </div>
              </div>
              <div style={{ display: 'flex', items: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right', marginRight: 8 }}><div style={{ fontSize: 11, color: '#64748b' }}>{curEv ? 'Selected' : '10yr Revenue'}</div><div style={{ fontSize: 22, fontWeight: 700, color: '#0891b2' }}>${curEv ? Math.round(curEv.tenYearRevenue/1000)+'k' : Math.round(evOpts.premium.tenYearRevenue/1000)+'k+'}</div></div>
                <button onClick={() => { setEvDecision('yes'); setEvExpanded(true); }} className={evDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(evDecision === 'yes', true)}>✓ Add</button>
                <button onClick={() => { setEvDecision('no'); setEvExpanded(false); }} className={evDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(evDecision === 'no', false)}>No Thanks</button>
              </div>
            </div>
            {evDecision === 'undecided' && <div style={{ padding: '12px 26px', background: '#cffafe', borderTop: '1px solid #22d3ee', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>⚠️</span><span style={{ fontSize: 13, color: '#0e7490', fontWeight: 500 }}>Please select "Add" or "No Thanks" to continue</span></div>}
            {evDecision === 'yes' && (
              <div style={{ padding: '0 26px 26px', borderTop: '1px solid #e2e8f0', background: '#f0fdfa' }}>
                <div style={{ padding: '18px 0 14px', fontSize: 14, color: '#0d9488', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setEvExpanded(!evExpanded)}><span>🔌 Choose charging setup:</span><span style={{ fontSize: 18, color: '#5eead4' }}>{evExpanded ? '▼' : '▶'}</span></div>
                {evExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    {Object.entries(evOpts).map(([k, o]) => (
                      <div key={k} onClick={() => setEvTier(k)} style={tierStyle(evTier === k, '#06b6d4')}>
                        {o.tag && <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: k === 'standard' ? '#8b5cf6' : '#06b6d4', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>{o.tag}</div>}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0d9488' }}>{o.name}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0891b2', margin: '4px 0 12px' }}>{o.chargers}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Power</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.power}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Monthly Rev</span><span style={{ fontWeight: 700, color: '#10b981' }}>{o.monthlyRevenue}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>10yr Revenue</span><span style={{ fontWeight: 700, color: '#0891b2' }}>${(o.tenYearRevenue/1000).toFixed(0)}k</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Guest Appeal</span><span style={{ fontWeight: 600, color: '#f59e0b' }}>{o.guestAppeal}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GENERATOR CARD */}
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: generatorDecision === 'yes' ? '0 4px 24px rgba(239,68,68,0.2), 0 0 0 2px #ef4444' : generatorDecision === 'undecided' ? '0 4px 20px rgba(0,0,0,0.15), 0 0 0 2px #ef4444' : '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 26px', background: generatorDecision !== 'no' ? '#fef2f2' : '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔌</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1e293b' }}>Backup Generator</h3><span style={{ padding: '4px 10px', background: '#fef3c7', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#92400e' }}>Business Continuity</span></div>
                  <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0 0' }}>Protect against outages • Critical for 24/7 operations</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right', marginRight: 8 }}><div style={{ fontSize: 11, color: '#64748b' }}>{curGen ? 'Selected' : 'From'}</div><div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{curGen ? curGen.netCost : '$73k'}</div></div>
                <button onClick={() => { setGeneratorDecision('yes'); setGeneratorExpanded(true); }} className={generatorDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(generatorDecision === 'yes', true)}>✓ Add</button>
                <button onClick={() => { setGeneratorDecision('no'); setGeneratorExpanded(false); }} className={generatorDecision === 'undecided' ? 'pulse-attention' : ''} style={btnStyle(generatorDecision === 'no', false)}>No Thanks</button>
              </div>
            </div>
            {generatorDecision === 'undecided' && <div style={{ padding: '12px 26px', background: '#fee2e2', borderTop: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>⚠️</span><span style={{ fontSize: 13, color: '#991b1b', fontWeight: 500 }}>Please select "Add" or "No Thanks" to continue</span></div>}
            {generatorDecision === 'yes' && (
              <div style={{ padding: '0 26px 26px', borderTop: '1px solid #fecaca', background: '#fef2f2' }}>
                <div style={{ padding: '18px 0 14px', fontSize: 14, color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setGeneratorExpanded(!generatorExpanded)}><span>⛽ Choose backup power (Peak: ~{peak} kW):</span><span style={{ fontSize: 18, color: '#fca5a5' }}>{generatorExpanded ? '▼' : '▶'}</span></div>
                {generatorExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    {Object.entries(genOpts).map(([k, o]) => (
                      <div key={k} onClick={() => setGeneratorTier(k)} style={tierStyle(generatorTier === k, '#ef4444')}>
                        {o.tag && <div style={{ position: 'absolute', top: -10, right: 12, padding: '4px 10px', background: k === 'standard' ? '#8b5cf6' : '#ef4444', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>{o.tag}</div>}
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>{o.name}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 12px' }}>{o.size}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Coverage</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.coverage}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Fuel</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.fuelType}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>After Credits</span><span style={{ fontWeight: 600, color: '#8b5cf6' }}>{o.netCost}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Maintenance</span><span style={{ fontWeight: 600, color: '#1e293b' }}>{o.annualMaintenance}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {(curSolar || curEv || curGen) && (
          <div style={{ marginTop: 24, padding: 22, background: '#fff', border: '2px solid #10b981', borderRadius: 18, boxShadow: '0 4px 20px rgba(16,185,129,0.15)' }}>
            <div style={{ fontSize: 13, color: '#059669', fontWeight: 700, marginBottom: 14 }}>📋 YOUR SELECTIONS</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              {curSolar && <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: '#64748b' }}>Solar Array</div><div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{curSolar.size} — {curSolar.name}</div><div style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>{curSolar.annualSavings}/year</div></div>}
              {curEv && <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: '#64748b' }}>EV Charging</div><div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{curEv.chargers} — {curEv.name}</div><div style={{ fontSize: 14, color: '#0891b2', fontWeight: 600 }}>{curEv.monthlyRevenue}/month</div></div>}
              {curGen && <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 12, color: '#64748b' }}>Generator</div><div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{curGen.size} — {curGen.name}</div><div style={{ fontSize: 14, color: '#dc2626', fontWeight: 600 }}>{curGen.coverage}</div></div>}
              <div style={{ borderLeft: '2px solid #d1fae5', paddingLeft: 24, textAlign: 'right' }}><div style={{ fontSize: 11, color: '#64748b' }}>Combined 10-Year Value</div><div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>${Math.round(tenYr/1000).toLocaleString()}k</div></div>
            </div>
          </div>
        )}

        {/* Warning Banner - High visibility */}
        {!allDecisionsMade && (
          <div style={{ 
            marginTop: 24, 
            padding: '20px 28px', 
            background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.2))', 
            border: '2px solid #fbbf24', 
            borderRadius: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 14,
            boxShadow: '0 4px 20px rgba(251,191,36,0.3)'
          }}>
            <span style={{ fontSize: 32 }}>👆</span>
            <span style={{ fontSize: 18, color: '#fcd34d', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              Please select "Add" or "No Thanks" for each option above to continue
            </span>
          </div>
        )}

        {/* TrueQuote Attribution */}
        <div style={{ marginTop: 20, textAlign: 'center', opacity: 0.6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>💰 Pricing data: NREL ATB 2024 • DOE AFDC • EIA Commercial Rates</span>
        </div>
      </div>
    </div>
  );
};

export { Step4Options };
export default Step4Options;
