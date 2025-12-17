/**
 * Savings Scout™ Types
 * ====================
 * 
 * Type definitions for the Savings Scout opportunity detection widget.
 * 
 * @version 1.0
 * @created December 2025
 */

export type OpportunityStatus = 
  | 'high' 
  | 'moderate' 
  | 'low' 
  | 'critical' 
  | 'useful' 
  | 'not-recommended';

export interface Opportunity {
  id: string;
  name: string;
  status: OpportunityStatus;
  icon: string;
  reason: string;
  potentialMonthly: number;
  potentialAnnual: number;
  dataSource: string;
}

export interface SavingsScoutProps {
  state: string;
  industryProfile: string;
  peakDemandKW: number;
  facilityDetails?: {
    rooms?: number;
    hasEVChargers?: boolean;
    evChargerCount?: number;
    evChargersL2?: number;
    evChargersDCFC?: number;
    gridConnection?: 'on-grid' | 'unreliable' | 'limited' | 'off-grid';
  };
  /** Callback when user clicks Get Quote */
  onGetQuote?: () => void;
  /** Callback when user clicks Full Analysis */
  onFullAnalysis?: () => void;
}

export interface StateUtilityData {
  state: string;
  utilityName: string;
  electricityRate: number;      // $/kWh
  demandChargePerKW: number;    // $/kW
  peakRate?: number;            // $/kWh (TOU peak)
  offPeakRate?: number;         // $/kWh (TOU off-peak)
}

export interface SolarResourceData {
  state: string;
  peakSunHours: number;         // hours/day
  annualGHI: number;            // kWh/m²/year (Global Horizontal Irradiance)
}

export interface SavingsScoutResult {
  opportunities: Opportunity[];
  totalAnnualPotential: number;
  highPriorityCount: number;
}
