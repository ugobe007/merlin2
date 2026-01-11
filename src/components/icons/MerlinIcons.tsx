/**
 * Merlin Icons Library
 * 
 * Custom SVG icons specifically designed for Merlin questionnaires
 * Organized by category with consistent sizing and styling
 * 
 * Usage:
 * import { CarWashIcon, SolarPanelIcon } from '@/components/icons/MerlinIcons';
 * 
 * <CarWashIcon className="w-6 h-6 text-purple-400" />
 */

import React from 'react';

// ============================================================================
// CAR WASH FACILITY TYPES
// ============================================================================

export function ExpressTunnelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="8" width="20" height="10" rx="2" />
      <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <circle cx="7" cy="13" r="1.5" fill="currentColor" />
      <circle cx="17" cy="13" r="1.5" fill="currentColor" />
      <path d="M2 13h20" strokeDasharray="2 2" />
      <path d="M12 18v-5" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  );
}

export function MiniTunnelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M7 9V7a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v2" />
      <circle cx="8" cy="13" r="1" fill="currentColor" />
      <circle cx="16" cy="13" r="1" fill="currentColor" />
      <path d="M4 13h16" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

export function InBayAutomaticIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="10" width="18" height="8" rx="1" />
      <circle cx="7" cy="14" r="1.5" fill="currentColor" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
      <path d="M12 6v4" />
      <path d="M12 18v-4" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <path d="M10 8l2-2 2 2" />
      <path d="M10 16l2 2 2-2" />
    </svg>
  );
}

export function SelfServeBayIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="6" width="16" height="14" rx="1" />
      <path d="M4 10h16" />
      <circle cx="9" cy="15" r="1.5" fill="currentColor" />
      <circle cx="15" cy="15" r="1.5" fill="currentColor" />
      <path d="M12 2v4" />
      <circle cx="12" cy="2" r="1" fill="currentColor" />
      <path d="M16 13l3 3" />
      <path d="M8 13l-3 3" />
    </svg>
  );
}

// ============================================================================
// WATER & HEATING
// ============================================================================

export function WaterDropIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M12 18a4 4 0 0 1-4-4c0-1.5 1-3 2-4s2-2 2-4" strokeLinecap="round" />
    </svg>
  );
}

export function ElectricIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function GasFlameIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c-1.5 4-3 6-3 9a3 3 0 0 0 6 0c0-3-1.5-5-3-9z" fill="currentColor" opacity="0.3" />
      <path d="M12 2c-1.5 4-3 6-3 9a3 3 0 0 0 6 0c0-3-1.5-5-3-9z" />
      <path d="M9 15c0 1.5.5 3 3 5 2.5-2 3-3.5 3-5" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

export function PropaneIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 18h8v3a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-3z" />
      <rect x="6" y="8" width="12" height="10" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
      <path d="M12 14.5v2" />
    </svg>
  );
}

export function SnowflakeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20M6.34 6.34l11.32 11.32M17.66 6.34L6.34 17.66" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2l2 2M12 2l-2 2M12 22l2-2M12 22l-2-2M2 12l2 2M2 12l2-2M22 12l-2 2M22 12l-2-2" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// PUMPS & EQUIPMENT
// ============================================================================

export function PumpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M8 12h8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
      <path d="M6.34 6.34l1.42 1.42M16.24 16.24l1.42 1.42M6.34 17.66l1.42-1.42M16.24 7.76l1.42-1.42" />
    </svg>
  );
}

export function HighPressurePumpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 6v12M6 12h12" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
      <path d="M16 8l2-2M16 16l2 2M8 8l-2-2M8 16l-2 2" strokeWidth="2" />
    </svg>
  );
}

export function MultiplePumpsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="10" r="4" />
      <circle cx="16" cy="14" r="4" />
      <path d="M8 6v8M6 10h4M16 10v8M14 14h4" />
    </svg>
  );
}

export function VFDIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 13h2M7 16h4M15 13h4M15 16h2" strokeWidth="1.5" />
      <path d="M8 5v2M12 5v2M16 5v2" strokeWidth="1.5" />
      <circle cx="19" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// WATER RECLAMATION
// ============================================================================

export function NoReclaimIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}

export function PartialReclaimIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M8 14h8" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

export function FullReclaimIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="5" opacity="0.2" fill="currentColor" />
    </svg>
  );
}

export function AdvancedTreatmentIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M12 10v8M8 14h8M10 12h4M10 16h4" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="6" opacity="0.15" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// DRYERS & BLOWERS
// ============================================================================

export function BlowerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <path d="M14 9l6-3M14 12h6M14 15l6 3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="12" r="3" fill="currentColor" opacity="0.2" />
      <path d="M10 9v6M7 12h6" />
    </svg>
  );
}

export function HeatedDryerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <path d="M14 9l6-3M14 12h6M14 15l6 3" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10l-1 1 1 1-1 1 1 1" stroke="orange" strokeWidth="1.5" />
    </svg>
  );
}

export function HybridDryerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <path d="M14 9l6-3M14 12h6M14 15l6 3" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12h4M10 10v4" strokeWidth="1.5" />
    </svg>
  );
}

export function NoDryerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <path d="M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// VACUUM SYSTEMS
// ============================================================================

export function VacuumIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 16v6" />
      <path d="M8 12l-4 4M16 12l4 4M8 12l-4-4M16 12l4-4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function CentralVacuumIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="6" />
      <path d="M12 6V2M12 22v-4M6 12H2M22 12h-4" />
      <path d="M8.5 8.5L5 5M15.5 8.5L19 5M8.5 15.5L5 19M15.5 15.5L19 19" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

// ============================================================================
// SOLAR & ENERGY
// ============================================================================

export function SolarPanelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="8" width="16" height="10" rx="1" />
      <path d="M4 13h16M12 8v10" />
      <path d="M8 8v10M16 8v10" strokeWidth="1" />
      <circle cx="12" cy="4" r="2" />
      <path d="M10 4l-1-2M14 4l1-2M12 2v2" strokeWidth="1" />
    </svg>
  );
}

export function RoofIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9" strokeLinejoin="round" />
      <path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
      <rect x="9" y="14" width="6" height="5" />
    </svg>
  );
}

export function CarportIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h18" strokeWidth="2.5" />
      <path d="M4 8v12M20 8v12" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
      <circle cx="9" cy="17" r="1" fill="currentColor" />
      <circle cx="15" cy="17" r="1" fill="currentColor" />
      <path d="M3 8l9-6 9 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BatteryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path d="M22 10v4" strokeWidth="3" strokeLinecap="round" />
      <rect x="5" y="10" width="10" height="4" rx="1" fill="currentColor" opacity="0.3" />
      <path d="M7 12h6" strokeWidth="2" />
    </svg>
  );
}

// ============================================================================
// EV CHARGING
// ============================================================================

export function EVChargerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M18 7h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <circle cx="19" cy="11" r="1" fill="currentColor" />
      <path d="M11 8l-2 4h4l-2 4" fill="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function Level2ChargerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <path d="M17 8h2a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-2" />
      <circle cx="18.5" cy="11.5" r="0.8" fill="currentColor" />
      <path d="M12 9v6M9 12h6" strokeWidth="1.5" />
      <rect x="10" y="7" width="4" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function DCFastChargerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M18 7h2.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H18" />
      <circle cx="19.5" cy="12" r="1" fill="currentColor" />
      <path d="M11 7l-2 5h4l-2 5" fill="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 19h6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// OPERATIONS
// ============================================================================

export function ClockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
      <path d="M8 14h2M8 18h2M14 14h2M14 18h2" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function CarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 11l2-4h10l2 4" strokeLinejoin="round" />
      <path d="M3 11v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
      <circle cx="7" cy="14" r="1.5" fill="currentColor" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
      <path d="M5 11h14" />
    </svg>
  );
}

// ============================================================================
// FACILITIES
// ============================================================================

export function OfficeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M10 4v16" />
      <rect x="7" y="7" width="2" height="2" fill="currentColor" />
      <rect x="13" y="7" width="2" height="2" fill="currentColor" />
      <rect x="7" y="13" width="2" height="2" fill="currentColor" />
      <rect x="13" y="13" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export function SecurityCameraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="8" width="16" height="8" rx="2" />
      <circle cx="15" cy="12" r="3" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <path d="M4 10l-2-2M20 10l2-2" />
      <path d="M12 2v4" />
    </svg>
  );
}

export function LightBulbIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 22h4" />
      <path d="M15 2.13a7 7 0 1 1-6 0M12 2v2" />
      <circle cx="12" cy="9" r="5" />
      <path d="M9 14v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2" />
      <circle cx="12" cy="9" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function SignIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="3" width="12" height="7" rx="1" />
      <path d="M12 10v12M8 22h8" />
      <path d="M9 5h6M9 7h4" strokeWidth="1.5" />
      <circle cx="16" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

// ============================================================================
// MISC
// ============================================================================

export function AreaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeWidth="1" opacity="0.5" />
      <path d="M7 7h2M7 12h2M7 17h2M15 7h2M15 12h2M15 17h2" strokeWidth="2" />
    </svg>
  );
}

export function RulerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M7 8v3M11 8v5M15 8v3M19 8v5" strokeWidth="1.5" />
    </svg>
  );
}

export function DollarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// SPORTS STADIUM
// ============================================================================

export function StadiumIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18" strokeWidth="2.5" />
      <path d="M3 12c0-3 3-6 9-6s9 3 9 6" strokeLinejoin="round" />
      <path d="M3 12c0 3 3 6 9 6s9-3 9-6" strokeLinejoin="round" />
      <path d="M6 9v6M18 9v6" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" />
      <path d="M12 8v8M8 12h8" strokeWidth="1.5" />
    </svg>
  );
}

export function ArenaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="10" ry="8" />
      <ellipse cx="12" cy="12" rx="6" ry="4" fill="currentColor" opacity="0.1" />
      <path d="M2 12h20M12 4v16" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M8 8l2 2M16 8l-2 2M8 16l2-2M16 16l-2-2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 12h18" strokeDasharray="2 2" />
      <circle cx="12" cy="12" r="3" fill="none" />
      <path d="M6 6h12M6 18h12" strokeWidth="2" />
      <rect x="3" y="8" width="6" height="8" rx="1" fill="currentColor" opacity="0.1" />
      <rect x="15" y="8" width="6" height="8" rx="1" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function SeatingIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h18v12H3z" strokeLinejoin="round" />
      <path d="M3 14h18M3 18h18" strokeWidth="1.5" />
      <circle cx="7" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      <circle cx="17" cy="11" r="1" fill="currentColor" />
      <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ScoreboardIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="8" rx="1" />
      <path d="M4 8h16M8 4v8M16 4v8" strokeWidth="1.5" />
      <rect x="6" y="6" width="4" height="2" fill="currentColor" />
      <rect x="14" y="6" width="4" height="2" fill="currentColor" />
      <path d="M12 12v8M10 14h4M10 18h4" />
    </svg>
  );
}

export function ConcessionsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10h16M10 6v14" strokeWidth="1.5" />
      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
      <circle cx="16" cy="13" r="1.5" fill="currentColor" />
      <path d="M8 16v4M16 16v4" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4h4M14 4h4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ParkingLotIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 12h18M12 5v14" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="7" cy="9" r="1" fill="currentColor" />
      <circle cx="17" cy="9" r="1" fill="currentColor" />
      <circle cx="7" cy="15" r="1" fill="currentColor" />
      <circle cx="17" cy="15" r="1" fill="currentColor" />
      <path d="M7 9h10M7 15h10" strokeWidth="1" />
    </svg>
  );
}

export function LightingTowerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M10 2h4" strokeWidth="2.5" />
      <rect x="9" y="4" width="6" height="4" rx="1" />
      <path d="M12 8v4" />
      <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.2" />
      <path d="M9 13l6-6M15 13L9 19" strokeWidth="1.5" />
      <path d="M8 18h8M10 20h4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BroadcastBoothIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="8" width="12" height="10" rx="1" />
      <path d="M6 12h12M10 8V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
      <path d="M12 14v4M10 18h4" />
      <path d="M18 10l2-2M6 10L4 8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LockerRoomIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="6" width="16" height="14" rx="1" />
      <path d="M4 10h16M10 6v14" strokeWidth="1.5" />
      <rect x="6" y="12" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="15" y="12" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.2" />
      <circle cx="7.5" cy="15" r="0.5" fill="currentColor" />
      <circle cx="16.5" cy="15" r="0.5" fill="currentColor" />
      <path d="M7.5 12v-2M16.5 12v-2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// GANTRY / TRUCK WASH
// ============================================================================

export function GantryTruckWashIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {/* Gantry Frame Structure */}
      <rect x="3" y="6" width="18" height="14" rx="1" />
      <path d="M6 6v-2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
      <path d="M3 12h18" strokeWidth="1.5" strokeDasharray="2 2" />
      
      {/* Vertical Frame Supports */}
      <path d="M6 6v14M18 6v14" strokeWidth="2" />
      <path d="M9 6v14M15 6v14" strokeWidth="1.5" opacity="0.5" />
      
      {/* Horizontal Cross Beams */}
      <path d="M3 10h18M3 14h18M3 18h18" strokeWidth="1" opacity="0.4" />
      
      {/* Water Sprays (indicating wash system) */}
      <circle cx="9" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
      <path d="M9 10v4M15 10v4" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Truck silhouette */}
      <rect x="10" y="14" width="4" height="3" rx="0.5" />
      <circle cx="11.5" cy="17.5" r="0.8" fill="currentColor" />
      <circle cx="12.5" cy="17.5" r="0.8" fill="currentColor" />
      <rect x="11" y="13" width="2" height="1.5" rx="0.3" />
    </svg>
  );
}

// ============================================================================
// MERLIN AVATAR
// ============================================================================

export function MerlinAvatarIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      {/* Wizard Hat */}
      <path 
        d="M24 4l-8 16h16l-8-16z" 
        fill="url(#gradient1)" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <ellipse cx="24" cy="20" rx="10" ry="3" fill="url(#gradient1)" stroke="currentColor" strokeWidth="2" />
      
      {/* Face */}
      <circle cx="24" cy="30" r="12" fill="url(#gradient2)" stroke="currentColor" strokeWidth="2" />
      
      {/* Eyes */}
      <circle cx="20" cy="28" r="1.5" fill="currentColor" />
      <circle cx="28" cy="28" r="1.5" fill="currentColor" />
      
      {/* Beard */}
      <path 
        d="M16 32c0 4 3 6 8 6s8-2 8-6" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
      
      {/* Stars on hat */}
      <path d="M24 10l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="gold" />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="24" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9333ea" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="gradient2" x1="24" y1="18" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Facility Types
  ExpressTunnelIcon,
  MiniTunnelIcon,
  InBayAutomaticIcon,
  SelfServeBayIcon,
  // Water & Heating
  WaterDropIcon,
  ElectricIcon,
  GasFlameIcon,
  PropaneIcon,
  SnowflakeIcon,
  // Pumps
  PumpIcon,
  HighPressurePumpIcon,
  MultiplePumpsIcon,
  VFDIcon,
  // Water Reclamation
  NoReclaimIcon,
  PartialReclaimIcon,
  FullReclaimIcon,
  AdvancedTreatmentIcon,
  // Dryers
  BlowerIcon,
  HeatedDryerIcon,
  HybridDryerIcon,
  NoDryerIcon,
  // Vacuum
  VacuumIcon,
  CentralVacuumIcon,
  // Solar & Energy
  SolarPanelIcon,
  RoofIcon,
  CarportIcon,
  BatteryIcon,
  // EV Charging
  EVChargerIcon,
  Level2ChargerIcon,
  DCFastChargerIcon,
  // Operations
  ClockIcon,
  CalendarIcon,
  CarIcon,
  // Facilities
  OfficeIcon,
  SecurityCameraIcon,
  LightBulbIcon,
  SignIcon,
  // Misc
  AreaIcon,
  RulerIcon,
  DollarIcon,
  CheckCircleIcon,
  InfoIcon,
  // Merlin
  MerlinAvatarIcon
};
