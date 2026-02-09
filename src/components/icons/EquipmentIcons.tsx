/**
 * Equipment Icon Library — Merlin Energy Solutions
 * 
 * Professional SVG icons for BESS equipment categories.
 * Used in web UI (React components) and referenced by the docx icon generator.
 * 
 * Brand palette:
 *   Navy:  #1E3350 (primary)
 *   Amber: #FBBF24 (accent)
 *   Teal:  #14B8A6 (energy/success)
 * 
 * Usage:
 *   import { BatteryIcon, SolarIcon, EVChargerIcon } from '@/components/icons/EquipmentIcons';
 *   <BatteryIcon size={48} color="#1E3350" />
 */

import React from 'react';

export interface EquipmentIconProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

const defaultColor = '#1E3350';
const defaultAccent = '#FBBF24';

// ─────────────────────────────────────────────────────────
// 🔋 Battery / BESS
// ─────────────────────────────────────────────────────────
export const BatteryIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Battery body */}
    <rect x="8" y="16" width="44" height="36" rx="4" stroke={color} strokeWidth="3" fill="none" />
    {/* Battery terminal */}
    <rect x="52" y="26" width="6" height="16" rx="2" fill={color} />
    {/* Charge bars */}
    <rect x="14" y="22" width="8" height="24" rx="2" fill={accentColor} />
    <rect x="25" y="22" width="8" height="24" rx="2" fill={accentColor} opacity="0.8" />
    <rect x="36" y="22" width="8" height="24" rx="2" fill={accentColor} opacity="0.5" />
    {/* Lightning bolt */}
    <path d="M28 10L22 20h8l-6 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// ☀️ Solar Panel
// ─────────────────────────────────────────────────────────
export const SolarIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Sun rays */}
    <line x1="32" y1="2" x2="32" y2="10" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="52" y1="8" x2="47" y2="14" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="58" y1="24" x2="50" y2="24" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="8" x2="17" y2="14" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="6" y1="24" x2="14" y2="24" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Solar panel body */}
    <rect x="10" y="28" width="44" height="28" rx="3" stroke={color} strokeWidth="3" fill="none" />
    {/* Panel grid lines */}
    <line x1="10" y1="42" x2="54" y2="42" stroke={color} strokeWidth="1.5" />
    <line x1="25" y1="28" x2="25" y2="56" stroke={color} strokeWidth="1.5" />
    <line x1="39" y1="28" x2="39" y2="56" stroke={color} strokeWidth="1.5" />
    {/* Cell shading */}
    <rect x="11" y="29" width="13" height="12" fill={color} opacity="0.15" />
    <rect x="40" y="43" width="13" height="12" fill={color} opacity="0.15" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// ⚡ EV Charger
// ─────────────────────────────────────────────────────────
export const EVChargerIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Charger station body */}
    <rect x="14" y="8" width="28" height="44" rx="4" stroke={color} strokeWidth="3" fill="none" />
    {/* Screen */}
    <rect x="19" y="14" width="18" height="10" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
    {/* Lightning bolt on screen */}
    <path d="M30 16L26 22h5l-4 6" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Cable */}
    <path d="M42 32C48 32 50 36 50 40C50 44 48 48 50 52" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Plug */}
    <circle cx="50" cy="55" r="4" stroke={color} strokeWidth="2" fill={accentColor} />
    {/* Base */}
    <rect x="10" y="52" width="36" height="4" rx="2" fill={color} />
    {/* Status LED */}
    <circle cx="28" cy="30" r="3" fill="#22c55e" />
    <circle cx="28" cy="38" r="3" fill={color} opacity="0.3" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🔄 Inverter / Power Conversion System (PCS)
// ─────────────────────────────────────────────────────────
export const InverterIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Box */}
    <rect x="8" y="12" width="48" height="40" rx="4" stroke={color} strokeWidth="3" fill="none" />
    {/* DC input (flat line) */}
    <line x1="14" y1="32" x2="24" y2="32" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <text x="15" y="26" fontSize="8" fontWeight="bold" fill={color} fontFamily="Helvetica">DC</text>
    {/* Arrow */}
    <path d="M28 32L36 32" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M33 28L37 32L33 36" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* AC output (sine wave) */}
    <path d="M40 32C42 26 44 26 46 32C48 38 50 38 52 32" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <text x="42" y="26" fontSize="8" fontWeight="bold" fill={color} fontFamily="Helvetica">AC</text>
    {/* Heat fins */}
    <line x1="16" y1="44" x2="16" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="44" x2="22" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="28" y1="44" x2="28" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="34" y1="44" x2="34" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="40" y1="44" x2="40" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="46" y1="44" x2="46" y2="48" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// ⚙️ Transformer
// ─────────────────────────────────────────────────────────
export const TransformerIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Primary coil */}
    <path d="M16 14C22 14 22 22 16 22C22 22 22 30 16 30C22 30 22 38 16 38C22 38 22 46 16 46" 
          stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Secondary coil */}
    <path d="M48 14C42 14 42 22 48 22C42 22 42 30 48 30C42 30 42 38 48 38C42 38 42 46 48 46" 
          stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Core */}
    <line x1="30" y1="10" x2="30" y2="54" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="34" y1="10" x2="34" y2="54" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Magnetic flux arrows */}
    <path d="M28 20L32 16L36 20" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M28 44L32 48L36 44" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Input/output labels */}
    <text x="8" y="58" fontSize="7" fontWeight="bold" fill={color} fontFamily="Helvetica">HV</text>
    <text x="42" y="58" fontSize="7" fontWeight="bold" fill={color} fontFamily="Helvetica">LV</text>
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🔥 Generator
// ─────────────────────────────────────────────────────────
export const GeneratorIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Generator housing */}
    <rect x="10" y="18" width="36" height="30" rx="4" stroke={color} strokeWidth="3" fill="none" />
    {/* G label */}
    <text x="21" y="39" fontSize="18" fontWeight="bold" fill={color} fontFamily="Helvetica">G</text>
    {/* Rotor circle */}
    <circle cx="28" cy="33" r="14" stroke={color} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
    {/* Exhaust pipe */}
    <path d="M46 24L52 24L52 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Exhaust puffs */}
    <circle cx="52" cy="12" r="3" fill={color} opacity="0.2" />
    <circle cx="56" cy="9" r="2" fill={color} opacity="0.15" />
    {/* Power output bolt */}
    <path d="M50 36L47 42h5l-4 6" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Base/skid */}
    <rect x="6" y="48" width="44" height="4" rx="2" fill={color} />
    <rect x="10" y="52" width="4" height="4" rx="1" fill={color} />
    <rect x="42" y="52" width="4" height="4" rx="1" fill={color} />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🔌 BMS (Battery Management System)
// ─────────────────────────────────────────────────────────
export const BMSIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circuit board */}
    <rect x="8" y="12" width="48" height="40" rx="3" stroke={color} strokeWidth="3" fill="none" />
    {/* Chip */}
    <rect x="22" y="24" width="20" height="16" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="2" />
    <text x="25" y="35" fontSize="8" fontWeight="bold" fill={color} fontFamily="Helvetica">BMS</text>
    {/* Chip pins - top */}
    <line x1="27" y1="24" x2="27" y2="18" stroke={color} strokeWidth="1.5" />
    <line x1="32" y1="24" x2="32" y2="18" stroke={color} strokeWidth="1.5" />
    <line x1="37" y1="24" x2="37" y2="18" stroke={color} strokeWidth="1.5" />
    {/* Chip pins - bottom */}
    <line x1="27" y1="40" x2="27" y2="46" stroke={color} strokeWidth="1.5" />
    <line x1="32" y1="40" x2="32" y2="46" stroke={color} strokeWidth="1.5" />
    <line x1="37" y1="40" x2="37" y2="46" stroke={color} strokeWidth="1.5" />
    {/* Traces */}
    <path d="M12 20H22" stroke={accentColor} strokeWidth="1.5" />
    <path d="M42 20H52" stroke={accentColor} strokeWidth="1.5" />
    <path d="M12 32H22" stroke={accentColor} strokeWidth="1.5" />
    <path d="M42 32H52" stroke={accentColor} strokeWidth="1.5" />
    <path d="M12 44H22" stroke={accentColor} strokeWidth="1.5" />
    <path d="M42 44H52" stroke={accentColor} strokeWidth="1.5" />
    {/* Status LEDs */}
    <circle cx="15" y="15" r="2" fill="#22c55e" />
    <circle cx="49" y="15" r="2" fill={accentColor} />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🌬️ Wind Turbine
// ─────────────────────────────────────────────────────────
export const WindIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Hub */}
    <circle cx="32" cy="22" r="4" fill={color} />
    {/* Blades */}
    <path d="M32 22L32 4C28 4 26 10 29 18" stroke={color} strokeWidth="2.5" fill={color} opacity="0.3" />
    <path d="M32 22L46 30C46 26 40 22 34 23" stroke={color} strokeWidth="2.5" fill={color} opacity="0.3" />
    <path d="M32 22L18 30C18 26 24 22 30 23" stroke={color} strokeWidth="2.5" fill={color} opacity="0.3" />
    {/* Tower */}
    <line x1="32" y1="26" x2="32" y2="56" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Base */}
    <path d="M22 56L42 56" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Wind lines */}
    <line x1="48" y1="14" x2="56" y2="14" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="20" x2="58" y2="20" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="26" x2="54" y2="26" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🔀 Switchgear
// ─────────────────────────────────────────────────────────
export const SwitchgearIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cabinet */}
    <rect x="12" y="8" width="40" height="48" rx="3" stroke={color} strokeWidth="3" fill="none" />
    {/* Divider */}
    <line x1="12" y1="32" x2="52" y2="32" stroke={color} strokeWidth="1.5" />
    {/* Breaker switches - top section */}
    <rect x="18" y="14" width="10" height="14" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
    <rect x="36" y="14" width="10" height="14" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
    {/* Switch handles */}
    <line x1="23" y1="17" x2="23" y2="25" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
    <line x1="41" y1="17" x2="41" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Bottom section - bus bars */}
    <line x1="18" y1="38" x2="46" y2="38" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="18" y1="44" x2="46" y2="44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="18" y1="50" x2="46" y2="50" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    {/* Status indicator */}
    <circle cx="32" cy="12" r="2" fill="#22c55e" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 📦 ESS Enclosure
// ─────────────────────────────────────────────────────────
export const ESSEnclosureIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Container body - 3D effect */}
    <rect x="6" y="16" width="44" height="36" rx="3" stroke={color} strokeWidth="3" fill="none" />
    {/* 3D top */}
    <path d="M6 16L14 8H58L50 16" stroke={color} strokeWidth="2.5" fill={color} opacity="0.08" />
    {/* 3D side */}
    <path d="M50 16H58V44L50 52" stroke={color} strokeWidth="2.5" fill={color} opacity="0.05" />
    {/* Ventilation louvers */}
    <line x1="12" y1="24" x2="28" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="28" x2="28" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="32" x2="28" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Door handle */}
    <rect x="34" y="26" width="2" height="12" rx="1" fill={color} />
    {/* Battery symbol inside */}
    <rect x="14" y="38" width="12" height="8" rx="1" stroke={accentColor} strokeWidth="1.5" fill="none" />
    <rect x="26" y="40" width="2" height="4" rx="0.5" fill={accentColor} />
    {/* HVAC unit on top */}
    <rect x="36" y="10" width="10" height="6" rx="1" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 📊 Monitoring / Software
// ─────────────────────────────────────────────────────────
export const MonitoringIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Monitor frame */}
    <rect x="8" y="8" width="48" height="36" rx="4" stroke={color} strokeWidth="3" fill="none" />
    {/* Screen */}
    <rect x="12" y="12" width="40" height="28" rx="2" fill={color} opacity="0.06" />
    {/* Chart line (energy curve) */}
    <path d="M16 34L24 28L30 32L38 20L44 24L48 18" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Grid lines */}
    <line x1="16" y1="36" x2="48" y2="36" stroke={color} strokeWidth="0.75" opacity="0.3" />
    <line x1="16" y1="30" x2="48" y2="30" stroke={color} strokeWidth="0.75" opacity="0.3" />
    <line x1="16" y1="24" x2="48" y2="24" stroke={color} strokeWidth="0.75" opacity="0.3" />
    {/* Data points */}
    <circle cx="24" cy="28" r="2" fill={accentColor} />
    <circle cx="38" cy="20" r="2" fill={accentColor} />
    {/* Stand */}
    <rect x="26" y="44" width="12" height="4" rx="1" fill={color} />
    <rect x="22" y="48" width="20" height="3" rx="1.5" fill={color} opacity="0.5" />
    {/* WiFi signal */}
    <path d="M52 10C54 8 56 8 58 10" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M54 12C55 11 57 11 58 12" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// 🏗️ Microgrid Controller
// ─────────────────────────────────────────────────────────
export const MicrogridIcon: React.FC<EquipmentIconProps> = ({
  size = 48, color = defaultColor, accentColor = defaultAccent, className
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Central hub */}
    <circle cx="32" cy="32" r="10" stroke={color} strokeWidth="3" fill={color} opacity="0.1" />
    <text x="24" y="36" fontSize="9" fontWeight="bold" fill={color} fontFamily="Helvetica">μG</text>
    {/* Connection lines to perimeter nodes */}
    <line x1="32" y1="22" x2="32" y2="10" stroke={color} strokeWidth="2" />
    <line x1="40" y1="26" x2="50" y2="16" stroke={color} strokeWidth="2" />
    <line x1="42" y1="32" x2="54" y2="32" stroke={color} strokeWidth="2" />
    <line x1="40" y1="38" x2="50" y2="48" stroke={color} strokeWidth="2" />
    <line x1="32" y1="42" x2="32" y2="54" stroke={color} strokeWidth="2" />
    <line x1="24" y1="38" x2="14" y2="48" stroke={color} strokeWidth="2" />
    <line x1="22" y1="32" x2="10" y2="32" stroke={color} strokeWidth="2" />
    <line x1="24" y1="26" x2="14" y2="16" stroke={color} strokeWidth="2" />
    {/* Perimeter nodes */}
    <circle cx="32" cy="8" r="4" fill={accentColor} />
    <circle cx="50" cy="14" r="4" fill={accentColor} />
    <circle cx="56" cy="32" r="4" fill={accentColor} />
    <circle cx="50" cy="50" r="4" fill={accentColor} />
    <circle cx="32" cy="56" r="4" fill={accentColor} />
    <circle cx="14" cy="50" r="4" fill={color} opacity="0.3" />
    <circle cx="8" cy="32" r="4" fill={color} opacity="0.3" />
    <circle cx="14" cy="14" r="4" fill={color} opacity="0.3" />
  </svg>
);

// ─────────────────────────────────────────────────────────
// Icon Registry — Maps equipment types to components
// ─────────────────────────────────────────────────────────
export const EQUIPMENT_ICON_MAP: Record<string, React.FC<EquipmentIconProps>> = {
  battery: BatteryIcon,
  bess: BatteryIcon,
  solar: SolarIcon,
  'ev-charger': EVChargerIcon,
  'ev_charger': EVChargerIcon,
  inverter: InverterIcon,
  pcs: InverterIcon,
  transformer: TransformerIcon,
  generator: GeneratorIcon,
  bms: BMSIcon,
  wind: WindIcon,
  switchgear: SwitchgearIcon,
  'ess-enclosure': ESSEnclosureIcon,
  enclosure: ESSEnclosureIcon,
  monitoring: MonitoringIcon,
  software: MonitoringIcon,
  microgrid: MicrogridIcon,
};

/**
 * Get equipment icon component by type string.
 * Falls back to BatteryIcon if type not found.
 */
export function getEquipmentIcon(type: string): React.FC<EquipmentIconProps> {
  const normalized = type.toLowerCase().replace(/[\s_]+/g, '-');
  return EQUIPMENT_ICON_MAP[normalized] || BatteryIcon;
}

export default {
  BatteryIcon,
  SolarIcon,
  EVChargerIcon,
  InverterIcon,
  TransformerIcon,
  GeneratorIcon,
  BMSIcon,
  WindIcon,
  SwitchgearIcon,
  ESSEnclosureIcon,
  MonitoringIcon,
  MicrogridIcon,
  EQUIPMENT_ICON_MAP,
  getEquipmentIcon,
};
