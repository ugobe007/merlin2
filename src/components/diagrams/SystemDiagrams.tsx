/**
 * System Architecture Diagrams — Merlin Energy Solutions
 * 
 * High-level equipment topology diagrams for BESS, Solar+BESS, and EV Charging.
 * Used in quotes, proposals, and the web UI to help customers visualize their system.
 * 
 * Brand palette:
 *   Navy:   #1E3350 (primary), #0F1D2E (dark)
 *   Amber:  #FBBF24 (accent/energy flow)
 *   Teal:   #14B8A6 (savings/success)
 *   Slate:  #94A3B8 (secondary text)
 * 
 * Usage:
 *   import { BESSDiagram, SolarBESSDiagram, EVChargingDiagram } from '@/components/diagrams/SystemDiagrams';
 *   <BESSDiagram width={600} />
 */

import React from 'react';

interface DiagramProps {
  width?: number;
  className?: string;
}

const navy = '#1E3350';
const _navyLight = '#2A4468';
const amber = '#FBBF24';
const teal = '#14B8A6';
const slate = '#94A3B8';
const bg = '#F8FAFC';
const green = '#22C55E';

// ─────────────────────────────────────────────────────────
// BESS System Diagram
// Grid ↔ Transformer ↔ PCS/Inverter ↔ Battery Bank
// ─────────────────────────────────────────────────────────
export const BESSDiagram: React.FC<DiagramProps> = ({ width = 680, className }) => {
  const h = width * 0.38;
  return (
    <svg width={width} height={h} viewBox="0 0 680 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="680" height="260" rx="12" fill={bg} />
      <text x="340" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill={navy} fontFamily="Helvetica">
        BATTERY ENERGY STORAGE SYSTEM (BESS) — Single Line Diagram
      </text>

      {/* ── Grid ── */}
      <rect x="20" y="70" width="100" height="100" rx="8" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="70" y="110" textAnchor="middle" fontSize="12" fontWeight="bold" fill={navy} fontFamily="Helvetica">UTILITY</text>
      <text x="70" y="126" textAnchor="middle" fontSize="12" fontWeight="bold" fill={navy} fontFamily="Helvetica">GRID</text>
      {/* Grid symbol */}
      <path d="M50 140L60 150M70 140L60 150M60 150L70 160M60 150L50 160" stroke={slate} strokeWidth="1.5" />
      <circle cx="70" cy="56" r="8" fill={green} opacity="0.2" stroke={green} strokeWidth="1.5" />
      <text x="70" y="60" textAnchor="middle" fontSize="8" fill={green} fontFamily="Helvetica">ON</text>

      {/* ── Arrow: Grid → Transformer ── */}
      <line x1="120" y1="120" x2="170" y2="120" stroke={amber} strokeWidth="3" />
      <polygon points="168,114 178,120 168,126" fill={amber} />
      <text x="149" y="112" textAnchor="middle" fontSize="9" fill={slate} fontFamily="Helvetica">AC</text>

      {/* ── Switchgear ── */}
      <rect x="178" y="85" width="80" height="70" rx="6" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="218" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">SWITCHGEAR</text>
      <text x="218" y="124" textAnchor="middle" fontSize="9" fill={slate} fontFamily="Helvetica">&amp; Protection</text>
      {/* Breaker symbol */}
      <line x1="208" y1="140" x2="228" y2="140" stroke={navy} strokeWidth="2" />
      <circle cx="218" cy="140" r="4" fill="none" stroke={amber} strokeWidth="1.5" />

      {/* ── Arrow: Switchgear → Transformer ── */}
      <line x1="258" y1="120" x2="298" y2="120" stroke={amber} strokeWidth="3" />
      <polygon points="296,114 306,120 296,126" fill={amber} />

      {/* ── Transformer ── */}
      <rect x="306" y="75" width="90" height="90" rx="8" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="351" y="100" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">STEP-DOWN</text>
      <text x="351" y="116" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">XFMR</text>
      {/* Transformer coil symbol */}
      <circle cx="340" cy="138" r="10" fill="none" stroke={navy} strokeWidth="2" />
      <circle cx="360" cy="138" r="10" fill="none" stroke={navy} strokeWidth="2" />

      {/* ── Arrow: Transformer → PCS ── */}
      <line x1="396" y1="120" x2="436" y2="120" stroke={amber} strokeWidth="3" />
      <polygon points="434,114 444,120 434,126" fill={amber} />
      <line x1="436" y1="120" x2="396" y2="120" stroke={amber} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

      {/* ── PCS / Inverter ── */}
      <rect x="444" y="75" width="90" height="90" rx="8" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="489" y="100" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">PCS /</text>
      <text x="489" y="116" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">INVERTER</text>
      {/* AC↔DC symbol */}
      <text x="474" y="140" fontSize="9" fill={slate} fontFamily="Helvetica">AC↔DC</text>
      <path d="M470 148C474 142 478 142 482 148" stroke={amber} strokeWidth="1.5" fill="none" />
      <line x1="490" y1="145" x2="508" y2="145" stroke={amber} strokeWidth="1.5" />

      {/* ── Arrow: PCS → Battery ── */}
      <line x1="534" y1="120" x2="574" y2="120" stroke={amber} strokeWidth="3" />
      <polygon points="572,114 582,120 572,126" fill={amber} />
      <text x="553" y="112" textAnchor="middle" fontSize="9" fill={slate} fontFamily="Helvetica">DC</text>

      {/* ── Battery Bank ── */}
      <rect x="582" y="60" width="80" height="120" rx="8" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="2.5" />
      <text x="622" y="84" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">BATTERY</text>
      <text x="622" y="98" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">BANK</text>
      {/* Battery cells */}
      <rect x="594" y="108" width="20" height="30" rx="3" fill={amber} opacity="0.3" stroke={amber} strokeWidth="1.5" />
      <rect x="618" y="108" width="20" height="30" rx="3" fill={amber} opacity="0.5" stroke={amber} strokeWidth="1.5" />
      <rect x="606" y="142" width="20" height="30" rx="3" fill={amber} opacity="0.7" stroke={amber} strokeWidth="1.5" />
      {/* Battery charge indicator */}
      <text x="622" y="158" textAnchor="middle" fontSize="14" fill={amber}>⚡</text>

      {/* ── BMS label ── */}
      <rect x="592" y="195" width="60" height="22" rx="4" fill={teal} opacity="0.15" stroke={teal} strokeWidth="1.5" />
      <text x="622" y="210" textAnchor="middle" fontSize="9" fontWeight="bold" fill={teal} fontFamily="Helvetica">BMS</text>
      <line x1="622" y1="180" x2="622" y2="195" stroke={teal} strokeWidth="1" strokeDasharray="3 2" />

      {/* ── Monitoring / SCADA ── */}
      <rect x="250" y="210" width="180" height="34" rx="6" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="1.5" />
      <text x="340" y="231" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">
        📊 SCADA / EMS MONITORING
      </text>
      {/* Dashed connections to all components */}
      <line x1="218" y1="155" x2="260" y2="210" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />
      <line x1="351" y1="165" x2="340" y2="210" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />
      <line x1="489" y1="165" x2="420" y2="210" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />

      {/* ── Energy flow label ── */}
      <rect x="230" y="40" width="220" height="22" rx="4" fill={amber} fillOpacity="0.15" />
      <text x="340" y="55" textAnchor="middle" fontSize="10" fill={amber} fontFamily="Helvetica" fontWeight="bold">
        ⚡ Bidirectional Energy Flow ⚡
      </text>
    </svg>
  );
};


// ─────────────────────────────────────────────────────────
// Solar + BESS System Diagram
// Solar → Inverter → BESS + Grid (DC-coupled or AC-coupled)
// ─────────────────────────────────────────────────────────
export const SolarBESSDiagram: React.FC<DiagramProps> = ({ width = 680, className }) => {
  const h = width * 0.5;
  return (
    <svg width={width} height={h} viewBox="0 0 680 340" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="680" height="340" rx="12" fill={bg} />
      <text x="340" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill={navy} fontFamily="Helvetica">
        SOLAR + BESS INTEGRATED SYSTEM
      </text>

      {/* ── Solar Array ── */}
      <rect x="20" y="50" width="140" height="100" rx="8" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="90" y="74" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">SOLAR ARRAY</text>
      {/* Panel grid */}
      <rect x="32" y="82" width="28" height="20" rx="2" fill={amber} opacity="0.2" stroke={navy} strokeWidth="1" />
      <rect x="64" y="82" width="28" height="20" rx="2" fill={amber} opacity="0.3" stroke={navy} strokeWidth="1" />
      <rect x="96" y="82" width="28" height="20" rx="2" fill={amber} opacity="0.2" stroke={navy} strokeWidth="1" />
      <rect x="32" y="106" width="28" height="20" rx="2" fill={amber} opacity="0.3" stroke={navy} strokeWidth="1" />
      <rect x="64" y="106" width="28" height="20" rx="2" fill={amber} opacity="0.2" stroke={navy} strokeWidth="1" />
      <rect x="96" y="106" width="28" height="20" rx="2" fill={amber} opacity="0.3" stroke={navy} strokeWidth="1" />
      {/* Sun */}
      <circle cx="140" cy="44" r="14" fill={amber} opacity="0.3" />
      <circle cx="140" cy="44" r="8" fill={amber} />
      <line x1="140" y1="26" x2="140" y2="22" stroke={amber} strokeWidth="2" strokeLinecap="round" />
      <line x1="154" y1="34" x2="158" y2="30" stroke={amber} strokeWidth="2" strokeLinecap="round" />
      <line x1="126" y1="34" x2="122" y2="30" stroke={amber} strokeWidth="2" strokeLinecap="round" />

      {/* ── Arrow: Solar → Solar Inverter ── */}
      <line x1="160" y1="100" x2="210" y2="100" stroke={amber} strokeWidth="3" />
      <polygon points="208,94 218,100 208,106" fill={amber} />
      <text x="185" y="92" textAnchor="middle" fontSize="9" fill={slate} fontFamily="Helvetica">DC</text>

      {/* ── Solar Inverter ── */}
      <rect x="218" y="70" width="90" height="60" rx="6" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="263" y="94" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">SOLAR</text>
      <text x="263" y="108" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">INVERTER</text>
      <text x="263" y="122" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">DC → AC</text>

      {/* ── AC Bus (horizontal line) ── */}
      <line x1="308" y1="100" x2="520" y2="100" stroke={navy} strokeWidth="3" />
      <rect x="370" y="88" width="60" height="24" rx="4" fill="white" stroke={navy} strokeWidth="1.5" />
      <text x="400" y="104" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">AC BUS</text>

      {/* ── Branch down to BESS ── */}
      <line x1="340" y1="100" x2="340" y2="170" stroke={amber} strokeWidth="2.5" />
      <polygon points="334,168 340,178 346,168" fill={amber} />

      {/* ── Battery Inverter / PCS ── */}
      <rect x="295" y="178" width="90" height="60" rx="6" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="340" y="202" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">BESS PCS</text>
      <text x="340" y="216" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">(INVERTER)</text>
      <text x="340" y="230" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">AC ↔ DC</text>

      {/* ── Arrow: PCS → Battery ── */}
      <line x1="340" y1="238" x2="340" y2="268" stroke={amber} strokeWidth="2.5" />
      <polygon points="334,266 340,276 346,266" fill={amber} />

      {/* ── Battery Bank ── */}
      <rect x="280" y="276" width="120" height="50" rx="8" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="2.5" />
      <text x="340" y="298" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">BATTERY BANK</text>
      <rect x="294" y="306" width="16" height="12" rx="2" fill={amber} opacity="0.4" stroke={amber} strokeWidth="1" />
      <rect x="314" y="306" width="16" height="12" rx="2" fill={amber} opacity="0.6" stroke={amber} strokeWidth="1" />
      <rect x="334" y="306" width="16" height="12" rx="2" fill={amber} opacity="0.8" stroke={amber} strokeWidth="1" />
      <rect x="354" y="306" width="16" height="12" rx="2" fill={amber} opacity="1" stroke={amber} strokeWidth="1" />

      {/* ── Branch right to Transformer → Grid ── */}
      <line x1="520" y1="100" x2="540" y2="100" stroke={amber} strokeWidth="3" />
      <polygon points="538,94 548,100 538,106" fill={amber} />

      {/* ── Transformer ── */}
      <rect x="548" y="70" width="80" height="60" rx="6" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="588" y="92" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">STEP-UP</text>
      <text x="588" y="106" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">XFMR</text>
      <circle cx="580" cy="120" r="6" fill="none" stroke={navy} strokeWidth="1.5" />
      <circle cx="596" cy="120" r="6" fill="none" stroke={navy} strokeWidth="1.5" />

      {/* ── Arrow to Grid ── */}
      <line x1="628" y1="100" x2="648" y2="100" stroke={amber} strokeWidth="3" />

      {/* ── Grid ── */}
      <rect x="648" y="76" width="22" height="48" rx="3" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="659" y="104" textAnchor="middle" fontSize="7" fontWeight="bold" fill={navy} fontFamily="Helvetica" transform="rotate(-90,659,104)">GRID</text>

      {/* ── Loads branch (down from AC bus) ── */}
      <line x1="460" y1="100" x2="460" y2="170" stroke={teal} strokeWidth="2" />
      <polygon points="454,168 460,178 466,168" fill={teal} />
      <rect x="420" y="178" width="80" height="50" rx="6" fill="white" stroke={teal} strokeWidth="2" />
      <text x="460" y="198" textAnchor="middle" fontSize="10" fontWeight="bold" fill={teal} fontFamily="Helvetica">FACILITY</text>
      <text x="460" y="212" textAnchor="middle" fontSize="10" fontWeight="bold" fill={teal} fontFamily="Helvetica">LOADS</text>
      <text x="460" y="224" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">🏢 🏭 🏨</text>

      {/* ── Monitoring ── */}
      <rect x="530" y="178" width="120" height="30" rx="5" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="1.5" />
      <text x="590" y="197" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">📊 EMS / SCADA</text>
      <line x1="400" y1="112" x2="530" y2="190" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />

      {/* ── Legend ── */}
      <line x1="20" y1="320" x2="40" y2="320" stroke={amber} strokeWidth="3" />
      <text x="44" y="324" fontSize="9" fill={slate} fontFamily="Helvetica">Energy Flow</text>
      <line x1="120" y1="320" x2="140" y2="320" stroke={teal} strokeWidth="2" />
      <text x="144" y="324" fontSize="9" fill={slate} fontFamily="Helvetica">Load Supply</text>
      <line x1="230" y1="320" x2="250" y2="320" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />
      <text x="254" y="324" fontSize="9" fill={slate} fontFamily="Helvetica">Communications</text>
    </svg>
  );
};


// ─────────────────────────────────────────────────────────
// EV Charging Hub Diagram
// Grid → Transformer → BESS + Charger Array
// ─────────────────────────────────────────────────────────
export const EVChargingDiagram: React.FC<DiagramProps> = ({ width = 680, className }) => {
  const h = width * 0.47;
  return (
    <svg width={width} height={h} viewBox="0 0 680 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="680" height="320" rx="12" fill={bg} />
      <text x="340" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill={navy} fontFamily="Helvetica">
        EV CHARGING HUB WITH BESS PEAK SHAVING
      </text>

      {/* ── Grid ── */}
      <rect x="20" y="80" width="80" height="80" rx="8" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">UTILITY</text>
      <text x="60" y="130" textAnchor="middle" fontSize="11" fontWeight="bold" fill={navy} fontFamily="Helvetica">GRID</text>

      {/* ── Arrow → Transformer ── */}
      <line x1="100" y1="120" x2="150" y2="120" stroke={amber} strokeWidth="3" />
      <polygon points="148,114 158,120 148,126" fill={amber} />

      {/* ── Transformer ── */}
      <rect x="158" y="80" width="90" height="80" rx="6" fill="white" stroke={navy} strokeWidth="2.5" />
      <text x="203" y="108" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">TRANSFORMER</text>
      <circle cx="192" cy="132" r="8" fill="none" stroke={navy} strokeWidth="1.5" />
      <circle cx="214" cy="132" r="8" fill="none" stroke={navy} strokeWidth="1.5" />

      {/* ── Main AC Bus ── */}
      <line x1="248" y1="120" x2="460" y2="120" stroke={navy} strokeWidth="3" />
      <rect x="310" y="108" width="60" height="24" rx="4" fill="white" stroke={navy} strokeWidth="1.5" />
      <text x="340" y="124" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">AC BUS</text>

      {/* ── Branch down to BESS (left side) ── */}
      <line x1="280" y1="120" x2="280" y2="180" stroke={amber} strokeWidth="2.5" />
      <polygon points="274,178 280,188 286,178" fill={amber} />

      {/* ── BESS System ── */}
      <rect x="230" y="188" width="100" height="90" rx="8" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="2.5" />
      <text x="280" y="210" textAnchor="middle" fontSize="10" fontWeight="bold" fill={navy} fontFamily="Helvetica">BESS</text>
      <text x="280" y="224" textAnchor="middle" fontSize="9" fill={slate} fontFamily="Helvetica">Peak Shaving</text>
      {/* Battery cells */}
      <rect x="248" y="234" width="14" height="20" rx="2" fill={amber} opacity="0.4" stroke={amber} strokeWidth="1" />
      <rect x="266" y="234" width="14" height="20" rx="2" fill={amber} opacity="0.6" stroke={amber} strokeWidth="1" />
      <rect x="284" y="234" width="14" height="20" rx="2" fill={amber} opacity="0.8" stroke={amber} strokeWidth="1" />
      <rect x="302" y="234" width="14" height="20" rx="2" fill={amber} opacity="1" stroke={amber} strokeWidth="1" />
      <text x="280" y="270" textAnchor="middle" fontSize="8" fill={teal} fontFamily="Helvetica" fontWeight="bold">
        Reduces demand charges
      </text>

      {/* ── Branch down to Chargers (right side) ── */}
      <line x1="420" y1="120" x2="420" y2="160" stroke={teal} strokeWidth="2.5" />

      {/* ── Charger Distribution Panel ── */}
      <rect x="370" y="160" width="100" height="30" rx="4" fill="white" stroke={navy} strokeWidth="2" />
      <text x="420" y="180" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">DISTRIBUTION PANEL</text>

      {/* ── Individual EV Chargers ── */}
      {/* Level 2 Chargers */}
      <line x1="390" y1="190" x2="390" y2="215" stroke={teal} strokeWidth="2" />
      <rect x="370" y="215" width="40" height="55" rx="4" fill="white" stroke={teal} strokeWidth="2" />
      <text x="390" y="232" textAnchor="middle" fontSize="8" fontWeight="bold" fill={teal} fontFamily="Helvetica">L2</text>
      <text x="390" y="244" textAnchor="middle" fontSize="7" fill={slate} fontFamily="Helvetica">7-19 kW</text>
      {/* Plug icon */}
      <path d="M385 252L385 260M395 252L395 260M383 260L397 260" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />

      {/* DCFC Chargers */}
      <line x1="440" y1="190" x2="440" y2="215" stroke={amber} strokeWidth="2" />
      <rect x="420" y="215" width="40" height="55" rx="4" fill="white" stroke={amber} strokeWidth="2" />
      <text x="440" y="232" textAnchor="middle" fontSize="8" fontWeight="bold" fill={amber} fontFamily="Helvetica">DCFC</text>
      <text x="440" y="244" textAnchor="middle" fontSize="7" fill={slate} fontFamily="Helvetica">50-150kW</text>
      <path d="M436 252L432 260h8l-5 8" stroke={amber} strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* HPC Chargers */}
      <line x1="490" y1="190" x2="490" y2="215" stroke={navy} strokeWidth="2" />
      <rect x="470" y="215" width="40" height="55" rx="4" fill="white" stroke={navy} strokeWidth="2" />
      <text x="490" y="232" textAnchor="middle" fontSize="8" fontWeight="bold" fill={navy} fontFamily="Helvetica">HPC</text>
      <text x="490" y="244" textAnchor="middle" fontSize="7" fill={slate} fontFamily="Helvetica">250-350kW</text>
      <path d="M486 252L482 258h6l-4 6M494 252L490 258h6l-4 6" stroke={navy} strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* ── Vehicles ── */}
      <text x="390" y="284" textAnchor="middle" fontSize="16">🚗</text>
      <text x="440" y="284" textAnchor="middle" fontSize="16">🚙</text>
      <text x="490" y="284" textAnchor="middle" fontSize="16">🚐</text>

      {/* ── Solar (optional, top right) ── */}
      <rect x="530" y="50" width="130" height="60" rx="6" fill="white" stroke={navy} strokeWidth="2" strokeDasharray="6 3" />
      <text x="595" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">SOLAR CANOPY</text>
      <text x="595" y="86" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">(Optional)</text>
      <text x="595" y="100" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">☀️ On-site generation</text>
      <line x1="530" y1="100" x2="460" y2="120" stroke={amber} strokeWidth="1.5" strokeDasharray="6 3" />

      {/* ── EMS ── */}
      <rect x="530" y="140" width="130" height="40" rx="5" fill={navy} fillOpacity="0.06" stroke={navy} strokeWidth="1.5" />
      <text x="595" y="158" textAnchor="middle" fontSize="9" fontWeight="bold" fill={navy} fontFamily="Helvetica">📊 CHARGE MANAGEMENT</text>
      <text x="595" y="172" textAnchor="middle" fontSize="8" fill={slate} fontFamily="Helvetica">Load balancing + scheduling</text>
      <line x1="530" y1="160" x2="470" y2="175" stroke={slate} strokeWidth="1" strokeDasharray="4 3" />

      {/* ── Cost Savings Callout ── */}
      <rect x="530" y="200" width="130" height="56" rx="6" fill={teal} fillOpacity="0.08" stroke={teal} strokeWidth="1.5" />
      <text x="595" y="218" textAnchor="middle" fontSize="9" fontWeight="bold" fill={teal} fontFamily="Helvetica">💰 BESS SAVINGS</text>
      <text x="595" y="232" textAnchor="middle" fontSize="8" fill={teal} fontFamily="Helvetica">Demand charge reduction</text>
      <text x="595" y="246" textAnchor="middle" fontSize="8" fill={teal} fontFamily="Helvetica">up to 30-50% with BESS</text>

      {/* ── Legend ── */}
      <line x1="20" y1="304" x2="40" y2="304" stroke={amber} strokeWidth="3" />
      <text x="44" y="308" fontSize="9" fill={slate} fontFamily="Helvetica">Power Flow</text>
      <line x1="120" y1="304" x2="140" y2="304" stroke={teal} strokeWidth="2" />
      <text x="144" y="308" fontSize="9" fill={slate} fontFamily="Helvetica">EV Charging</text>
      <line x1="230" y1="304" x2="250" y2="304" stroke={navy} strokeWidth="1.5" strokeDasharray="6 3" />
      <text x="254" y="308" fontSize="9" fill={slate} fontFamily="Helvetica">Optional</text>
    </svg>
  );
};

export default { BESSDiagram, SolarBESSDiagram, EVChargingDiagram };
