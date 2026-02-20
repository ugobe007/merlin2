/**
 * COMPARISON MODE TYPES
 * TypeScript definitions for scenario comparison feature
 */

export interface SavedScenario {
  id: string;
  userId?: string;
  sessionId: string;
  scenarioName: string;
  scenarioData: Record<string, any>;  // Full wizard state
  quoteResult?: Record<string, any>;  // Cached quote calculation
  createdAt: string;
  updatedAt: string;
  isBaseline: boolean;
  tags?: string[];
  notes?: string;
  // Computed fields
  peakKw?: number;
  kwhCapacity?: number;
  totalCost?: number;
  annualSavings?: number;
  paybackYears?: number;
}

export interface ComparisonSet {
  id: string;
  userId?: string;
  sessionId: string;
  setName: string;
  scenarioIds: string[];
  createdAt: string;
  lastViewedAt?: string;
  isActive: boolean;
}

export interface ComparisonMetrics {
  id: string;
  name: string;
  peakKw: number;
  kwhCapacity: number;
  totalCost: number;
  annualSavings: number;
  paybackYears: number;
  costPerKwh: number;
  savingsDeltaPct: number;  // % difference from baseline
}

export interface ScenarioFormData {
  name: string;
  tags?: string[];
  notes?: string;
}
