/**
 * Equipment Domain Types
 * ======================
 * Core types for equipment specifications, pricing, and configurations.
 * 
 * These types define BESS equipment, power electronics, and generation equipment.
 * Part of the core domain layer - no dependencies on infrastructure or UI.
 */

// ============================================
// EQUIPMENT PRICING
// ============================================

export interface BatteryPricing {
  pricePerKWh: number;
  manufacturer: string;
  model: string;
  chemistry: string;
  warrantyYears: number;
  cycleLife: number;
  efficiency: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
  confidence: 'high' | 'medium' | 'low';
}

export interface InverterPricing {
  pricePerKW: number;
  manufacturer: string;
  model: string;
  efficiency: number;
  warrantyYears: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
}

export interface TransformerPricing {
  pricePerMVA: number;
  manufacturer: string;
  voltage: string;
  efficiency: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
}

export interface SolarPricing {
  pricePerWatt: number;
  manufacturer: string;
  model: string;
  efficiency: number;
  warrantyYears: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
}

export interface WindPricing {
  pricePerKW: number;
  manufacturer: string;
  model: string;
  capacityFactor: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
}

export interface GeneratorPricing {
  pricePerKW: number;
  manufacturer: string;
  model: string;
  fuelType: string;
  efficiency: number;
  dataSource: 'database' | 'nrel' | 'market' | 'fallback';
  lastUpdated: Date;
}

// ============================================
// EQUIPMENT COSTS
// ============================================

export interface EquipmentCosts {
  batteryCost: number;
  inverterCost: number;
  transformerCost: number;
  solarCost: number;
  windCost: number;
  generatorCost: number;
  bopCost: number; // Balance of Plant
  structuralCost: number;
  electricalCost: number;
  controlsCost: number;
  totalEquipmentCost: number;
}

export interface InstallationCosts {
  laborCost: number;
  sitePrepCost: number;
  foundationCost: number;
  interconnectionCost: number;
  commissioningCost: number;
  totalInstallationCost: number;
}

export interface ProjectCosts {
  equipmentCost: number;
  installationCost: number;
  shippingCost: number;
  tariffCost: number;
  contingency: number;
  totalProjectCost: number;
}

export interface PricingBreakdown extends ProjectCosts {
  equipmentBreakdown: EquipmentCosts;
  installationBreakdown: InstallationCosts;
  taxCredit: number;
  netProjectCost: number;
}

// ============================================
// POWER ELECTRONICS
// ============================================

export interface PowerInverter {
  id: string;
  name: string;
  ratedPowerKW: number;
  efficiency: number; // %
  inputVoltage: string;
  outputVoltage: string;
  pricePerKW: number;
  manufacturer: string;
  warrantyYears: number;
  type: 'string' | 'central' | 'micro';
}

export interface Transformer {
  id: string;
  name: string;
  ratedPowerMVA: number;
  primaryVoltage: string;
  secondaryVoltage: string;
  efficiency: number; // %
  pricePerMVA: number;
  manufacturer: string;
  type: 'dry' | 'oil-filled';
  impedance: number; // %
}

export interface Switchgear {
  id: string;
  name: string;
  ratedCurrent: number; // Amps
  voltage: string;
  breakingCapacity: number; // kA
  pricePerUnit: number;
  manufacturer: string;
  type: 'air' | 'vacuum' | 'sf6';
}

export interface PowerConditioner {
  id: string;
  name: string;
  ratedPowerKW: number;
  efficiency: number; // %
  inputVoltage: string;
  outputVoltage: string;
  pricePerKW: number;
  manufacturer: string;
  harmonicFiltering: boolean;
  powerFactor: number;
}

// ============================================
// SYSTEM CONTROLS
// ============================================

export interface Controller {
  id: string;
  name: string;
  type: 'plc' | 'rtu' | 'edge';
  capabilities: string[];
  pricePerUnit: number;
  manufacturer: string;
  ioPoints: number;
  communicationProtocols: string[];
}

export interface ScadaSystem {
  id: string;
  name: string;
  maxDataPoints: number;
  pricePerDataPoint: number;
  manufacturer: string;
  features: string[];
  cloudEnabled: boolean;
  redundancy: 'none' | 'hot-standby' | 'active-active';
}

export interface EnergyManagementSystem {
  id: string;
  name: string;
  maxControlledAssets: number;
  priceBase: number;
  pricePerAsset: number;
  manufacturer: string;
  features: string[];
  aiEnabled: boolean;
  gridServices: string[];
}

export interface AutomationSystem {
  id: string;
  name: string;
  type: 'bas' | 'ems' | 'dms';
  pricePerUnit: number;
  manufacturer: string;
  features: string[];
  integrations: string[];
}

// ============================================
// GENERATORS
// ============================================

export interface GeneratorSpecification {
  id: string;
  name: string;
  ratedPowerKW: number;
  fuelType: 'diesel' | 'natural-gas' | 'propane' | 'biogas';
  efficiency: number; // %
  pricePerKW: number;
  manufacturer: string;
  emissions: {
    nox: number; // g/kWh
    co2: number; // g/kWh
    particulates: number; // g/kWh
  };
  warrantyYears: number;
  maintenanceInterval: number; // hours
  startupTime: number; // seconds
}

// ============================================
// PRICING CACHE
// ============================================

export interface UnifiedPricingCache {
  battery: BatteryPricing | null;
  inverter: InverterPricing | null;
  transformer: TransformerPricing | null;
  solar: SolarPricing | null;
  wind: WindPricing | null;
  generator: GeneratorPricing | null;
  lastCacheUpdate: Date;
  cacheExpiryMinutes: number;
}
