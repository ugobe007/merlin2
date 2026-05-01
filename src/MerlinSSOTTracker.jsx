import React, { useState, useMemo, useCallback } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Lock, ChevronDown, ChevronRight, Activity, Database, Zap, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// MERLIN ENERGY — SSOT GOVERNANCE TRACKER
// ═══════════════════════════════════════════════════════════════════════════
// v6.0 — Feb 11, 2026 | 232 fixes | 74 suppliers | 7 flaws all fixed | SSOT 30/30
// Imported by both EnergyWizard A (Steps 1-3) and B (Steps 4-7)
// PIN-protected: 4-digit PIN required to view internal compliance state

const PIN_CODE = '2026';
const PHASE_DATA = [
  { num: 1, name: 'Legal & ITC', date: '2026-02-08', fixes: 14, acc: { a: 94, b: 96 }, gates: ['ITC dynamic (6 hardcodes)', 'Prevailing wage >1MW', 'Legal disclaimers'], status: 'complete' },
  { num: 2, name: 'Data Accuracy', date: '2026-02-08', fixes: 28, acc: { a: 97, b: 98 }, gates: ['50-state incentives aligned', 'Weather risk 13 categories', 'Utility rate tables'], status: 'complete' },
  { num: 3, name: 'Financial Engine', date: '2026-02-08', fixes: 42, acc: { a: 99, b: 99 }, gates: ['MACRS 100% bonus (OBBBA)', 'Tiered BESS pricing', 'Self-consumption curve'], status: 'complete' },
  { num: 4, name: 'Supplier & Compliance', date: '2026-02-09', fixes: 48, acc: { a: 100, b: 100 }, gates: ['35→74 suppliers scored', 'FEOC/UFLPA compliance', 'SEC EDGAR live feed'], status: 'complete' },
  { num: 5, name: 'Stress Test & Supplier Expansion', date: '2026-02-09', fixes: 28, acc: { a: 100, b: 100 }, gates: ['1,294-scenario stress test', 'F1-F7 all fixed', '74 suppliers across 7 categories', '6-dimension scoring all categories', 'Scrollable supplier popups'], status: 'complete' },
  { num: 6, name: 'CVR Deep Audit + Post-ITC Engine', date: '2026-02-09', fixes: 35, acc: { a: 100, b: 100 }, gates: ['CVR #164-189 (26 WizB fixes)', '5 improvements #190-194', 'Post-ITC scenario engine #195', 'OBBBA §70301/§70513 legal citations', '3-scenario comparison UI'], status: 'complete' },
  { num: 7, name: 'v6 Full System Sweep', date: '2026-02-11', fixes: 37, acc: { a: 100, b: 100 }, gates: ['SSOT 30/30 (100%)', 'M-10 EDGAR live', 'M-11 retry logic', 'M-13 TrueQuote hash', 'M-14 API cache', 'ARIA accessibility', 'Mobile responsive', 'Print CSS'], status: 'complete' },
];

const CROSS_FILE_CHECKS = [
  { f: 'ITC rate (30%)', a: true, b: true, m: true, n: 'All use 0.30' },
  { f: 'MACRS schedule', a: true, b: true, m: true, n: '[0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576]' },
  { f: 'Bonus depreciation (100%)', a: true, b: true, m: true, n: 'OBBBA §70301 permanent' },
  { f: 'Merlin margin (18%)', a: true, b: true, m: true, n: 'Was 30% pre-fix #46' },
  { f: 'State incentives (50+DC)', a: true, b: true, m: true, n: 'M1 fix aligned A→B' },
  { f: 'Solar cost tiers', a: true, b: true, m: true, n: 'F6: ≤20=$3.20, ≤50=$2.80, ≤200=$2.50, >200=$2.20' },
  { f: 'Self-consumption curve', a: true, b: true, m: true, n: 'F3: continuous linear interpolation' },
  { f: 'BESS cost tiers', a: true, b: true, m: true, n: '≤50=$750, ≤100=$480, ≤500=$350, >500=$160' },
  { f: 'Climate multipliers', a: true, b: true, m: true, n: 'F1+F2: 30 states adjusted' },
  { f: 'Dynamic BESS sizing', a: true, b: true, m: true, n: 'F5: 15-40% based on demand charge' },
  { f: 'Legal disclaimer', a: true, b: true, m: true, n: 'Both have fixed footer' },
  { f: 'Supplier count (74)', a: false, b: true, m: true, n: 'B has full DB; A uses scoring output' },
  { f: 'Financing recommendation', a: false, b: true, m: false, n: '★ starred best option in Step 7' },
  { f: 'TrueQuote auth', a: false, b: true, m: false, n: 'PIN + timestamp on Step 7' },
];

const KNOWN_FLAWS = [
  { id: 'F1', title: 'Electrical consumption climate-adjusted', severity: 'medium', status: 'fixed', fix: 'Climate multipliers: cold ×1.08-1.18, hot ×0.94-0.97' },
  { id: 'F2', title: 'Peak demand climate-adjusted', severity: 'low-medium', status: 'fixed', fix: 'Climate peak factors: cold ×1.03-1.06, hot ×1.04-1.08' },
  { id: 'F3', title: 'Self-consumption cliff removed', severity: 'medium', status: 'fixed', fix: 'Continuous linear interpolation curve (98%→55%)' },
  { id: 'F4', title: 'Wash-type vehicle defaults', severity: 'medium', status: 'fixed', fix: 'express=300, full=200, flex=250, self=100, inbay=80' },
  { id: 'F5', title: 'BESS dynamic sizing', severity: 'low-medium', status: 'fixed', fix: 'bessPct = 0.15 + 0.25 × min(1, demandCharge/25)' },
  { id: 'F6', title: 'Size-tiered solar $/W', severity: 'medium', status: 'fixed', fix: '≤20kW=$3.20, ≤50=$2.80, ≤200=$2.50, >200=$2.20/W' },
  { id: 'F7', title: 'Generator conditional inclusion', severity: 'low', status: 'fixed', fix: 'includeGenerator = rec.generator.recommended && !userRemoved' },
];

const SUPPLIER_SUMMARY = {
  solar: { count: 11, names: ['Qcells', 'Canadian Solar', 'JinkoSolar', 'Silfab', 'First Solar', 'LONGi', 'Trina', 'REC', 'Maxeon', 'Heliene', 'Mission Solar'] },
  inverter: { count: 7, names: ['SolarEdge', 'Enphase', 'SMA', 'Sigenergy', 'Sungrow', 'Fronius', 'GoodWe'] },
  bess: { count: 10, names: ['Tesla', 'BYD', 'Enphase', 'Sungrow', 'Sigenergy', 'Fortress Power', 'SimpliPhi', 'Sonnen', 'Samsung SDI', 'EG4'] },
  generator: { count: 10, names: ['Generac ×2', 'Kohler', 'Cummins ×2', 'Caterpillar', 'Briggs & Stratton', 'MTU', 'Gillette', 'Hipower'] },
  racking: { count: 16, names: ['IronRidge', 'Unirac', 'SnapNrack', 'Quick Mount PV', 'Schletter', 'GameChange', 'NextPower', 'K2 Systems', 'PanelClaw', 'EcoFasten', 'S:FLEX', 'Array Technologies', 'Trina Tracker', 'Arctech', 'Soltec', 'Flexrack'] },
  evCharger: { count: 10, names: ['ChargePoint', 'Wallbox', 'Enel X', 'Grizzl-E', 'Emporia', 'Autel', 'ABB', 'Blink', 'Tesla', 'Siemens'] },
  monitor: { count: 10, names: ['Span', 'Sense', 'Emporia', 'Schneider', 'Leviton', 'Enphase', 'SolarEdge', 'Curb', 'Iotawatt', 'Rainforest'] },
};

export const SSOTTriggerButton = ({ onClick }) => (
  <button onClick={onClick} title="SSOT Governance Tracker"
    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
    <Shield size={14} color="#10b981" />
    <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>SSOT</span>
  </button>
);

const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', flex: 1 }}>{title}</span>
        {open ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
      </div>
      {open && <div style={{ padding: '10px 14px' }}>{children}</div>}
    </div>
  );
};

const MerlinSSOTTracker = ({ isOpen, onClose, locationData, projectData }) => {
  const [pinInput, setPinInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handlePin = useCallback((val) => {
    setPinInput(val);
    if (val === PIN_CODE) setAuthenticated(true);
  }, []);

  const totalFixes = PHASE_DATA.reduce((s, p) => s + p.fixes, 0);
  const fixedFlaws = KNOWN_FLAWS.filter(f => f.status === 'fixed').length;
  const totalSuppliers = Object.values(SUPPLIER_SUMMARY).reduce((s, c) => s + c.count, 0);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '95vw', zIndex: 70, background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>SSOT Governance Tracker</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>v6.0 · {totalFixes} fixes · {totalSuppliers} suppliers · SSOT 30/30</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      {/* PIN Gate */}
      {!authenticated ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Lock size={32} color="#64748b" />
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Enter 4-digit PIN to access</div>
          <input type="password" maxLength={4} value={pinInput} onChange={e => handlePin(e.target.value)}
            style={{ width: 120, padding: '10px', textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', outline: 'none', fontFamily: 'monospace' }}
            placeholder="····" autoFocus />
          {pinInput.length === 4 && pinInput !== PIN_CODE && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>Incorrect PIN</div>
          )}
        </div>
      ) : (
        /* Authenticated Content */
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Fixes', value: totalFixes, color: '#10b981' },
              { label: 'Flaws Fixed', value: `${fixedFlaws}/${KNOWN_FLAWS.length}`, color: '#f59e0b' },
              { label: 'Suppliers', value: totalSuppliers, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Phases */}
          <Section title="Phase Milestones" icon={<Activity size={14} color="#10b981" />}>
            {PHASE_DATA.map(p => (
              <div key={p.num} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Phase {p.num}: {p.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{p.fixes} fixes · {p.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 20, flexWrap: 'wrap' }}>
                  {p.gates.map((g, i) => (
                    <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>✓ {g}</span>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          {/* Cross-File Checks */}
          <Section title="Cross-File Alignment (A ↔ B ↔ Constants)" icon={<Database size={14} color="#3b82f6" />} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CROSS_FILE_CHECKS.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, background: c.a && c.b ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: c.a && c.b ? '#34d399' : '#fbbf24' }}>
                    {c.a && c.b ? '✓' : '~'}
                  </span>
                  <span style={{ color: '#e2e8f0', flex: 1, minWidth: 0 }}>{c.f}</span>
                  <span style={{ color: '#64748b', fontSize: 10, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.n}>{c.n}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Known Flaws */}
          <Section title="Known Flaws (F1–F7)" icon={<AlertTriangle size={14} color="#f59e0b" />} defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {KNOWN_FLAWS.map(f => (
                <div key={f.id} style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: `1px solid ${f.status === 'fixed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {f.status === 'fixed' ? <CheckCircle size={12} color="#10b981" /> : <AlertTriangle size={12} color="#f59e0b" />}
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{f.id}: {f.title}</span>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: f.status === 'fixed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: f.status === 'fixed' ? '#34d399' : '#fbbf24', fontWeight: 700, marginLeft: 'auto' }}>{f.status.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginLeft: 18 }}>{f.fix}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Supplier Database */}
          <Section title={`Supplier Database (${totalSuppliers} suppliers)`} icon={<Zap size={14} color="#f59e0b" />} defaultOpen={false}>
            {Object.entries(SUPPLIER_SUMMARY).map(([cat, data]) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{cat} ({data.count})</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {data.names.map(n => (
                    <span key={n} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0' }}>{n}</span>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          {/* Test Harness Results */}
          <Section title="Validation Results" icon={<Eye size={14} color="#34d399" />} defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { name: '102-Scenario', errors: 0, warnings: 0, anomalies: 0 },
                { name: '1,294-Scenario', errors: 0, warnings: 2, anomalies: 0 },
              ].map(t => (
                <div key={t.name} style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#34d399' }}>🟢 {t.errors} errors</div>
                  <div style={{ fontSize: 10, color: t.warnings > 0 ? '#fbbf24' : '#34d399' }}>{t.warnings > 0 ? '🟡' : '🟢'} {t.warnings} warnings</div>
                  <div style={{ fontSize: 10, color: '#34d399' }}>🟢 {t.anomalies} anomalies</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Live Project Context */}
          {projectData && (
            <Section title="Live Project Context" icon={<Activity size={14} color="#a78bfa" />} defaultOpen={false}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(projectData).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ color: '#64748b' }}>{k}: </span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>
          Merlin SSOT v6.0 · {totalFixes} cumulative fixes · Last validated Feb 16, 2026
        </div>
      </div>
    </div>
  );
};

export default MerlinSSOTTracker;
