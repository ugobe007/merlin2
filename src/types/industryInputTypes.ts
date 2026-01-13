/**
 * Industry-Specific Input Types for useCaseData.inputs
 * ====================================================
 * 
 * Type-safe definitions for each industry's questionnaire inputs.
 * These types mirror the question IDs in industryQuestionnaires.ts.
 * 
 * Usage:
 * ```typescript
 * import type { HotelInputs, EVChargingInputs } from '@/types/industryInputTypes';
 * 
 * const hotelData = state.useCaseData?.inputs as HotelInputs;
 * const numRooms = hotelData?.numRooms ?? 100;
 * ```
 * 
 * SSOT: These types should match src/data/industryQuestionnaires.ts question IDs
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type GridConnectionStatus = 'on-grid' | 'off-grid' | 'hybrid' | 'limited' | 'microgrid';
export type GridReliability = 'reliable' | 'moderate' | 'unreliable';
export type YesNoFuture = 'yes' | 'no' | 'future';

// ============================================================================
// EV CHARGING
// ============================================================================

export interface EVChargingInputs {
  stationType?: 'public-highway' | 'public-urban' | 'workplace' | 'retail' | 'multifamily' | 'fleet' | 'destination';
  level2Chargers?: number;
  level2Power?: '7' | '11' | '19';
  dcFastChargers?: number;
  dcFastPower?: '50' | '150' | '250' | '350';
  utilizationProfile?: 'low' | 'medium' | 'high' | 'very-high' | 'custom';
  customUtilization?: number;
  peakConcurrency?: '30' | '50' | '70' | '85' | '100';
  gridConnection?: GridConnectionStatus;
  operatingHours?: '24-7' | 'extended' | 'business' | 'custom';
}

// ============================================================================
// CAR WASH
// ============================================================================

export interface CarWashInputs {
  numBays?: number;
  washType?: 'self-serve' | 'automatic' | 'full-service';
  gridConnection?: GridConnectionStatus;
  operatingHours?: number;
  heatedWater?: 'yes' | 'no';
  tunnelCount?: number;        // From carwash-questions-complete.config.ts
  vacuumStations?: number;
  detailBays?: number;
  hasReclaimSystem?: 'yes' | 'no';
  averageWashesPerDay?: number;
}

// ============================================================================
// HOTEL
// ============================================================================

export type HotelCategory = '1-star' | '2-star' | '3-star' | '4-star' | '5-star' | 'boutique' | 'non-classified';
export type OccupancyRate = 'high' | 'medium' | 'seasonal' | 'low';
export type HotelAmenity = 'pool' | 'restaurant' | 'hvac' | 'ev-charging' | 'laundry';

export interface HotelInputs {
  numRooms?: number;
  hotelCategory?: HotelCategory;
  squareFootage?: number;
  gridConnection?: GridConnectionStatus;
  occupancyRate?: OccupancyRate;
  amenities?: HotelAmenity[];
  evChargers?: YesNoFuture;
  numEVChargers?: number;
  utilityRate?: 'yes' | 'no';
  kwhRate?: number;
  gridReliability?: GridReliability;
}

// ============================================================================
// DATA CENTER
// ============================================================================

export type DataCenterTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';
export type CoolingSystem = 'air' | 'liquid' | 'hybrid';

export interface DataCenterInputs {
  squareFootage?: number;
  capacity?: number;  // MW
  gridConnection?: GridConnectionStatus | 'redundant' | 'single';
  uptimeRequirement?: DataCenterTier;
  coolingSystem?: CoolingSystem;
}

// ============================================================================
// HOSPITAL
// ============================================================================

export type HospitalCriticalSystem = 'icu' | 'surgery' | 'imaging' | 'lab' | 'pharmacy';
export type BackupDuration = '4hr' | '8hr' | '24hr';

export interface HospitalInputs {
  bedCount?: number;
  gridConnection?: GridConnectionStatus;
  criticalSystems?: HospitalCriticalSystem[];
  backupPower?: 'generator-only' | 'ups-generator' | 'none';
  backupDuration?: BackupDuration;
}

// ============================================================================
// AIRPORT
// ============================================================================

export type AirportFacilityType = 'terminal' | 'hangar' | 'ground-ops' | 'full-airport';
export type AirportSize = 'small' | 'medium' | 'large';
export type AirportCriticalLoad = 'atc' | 'lighting' | 'fueling' | 'baggage' | 'security';

export interface AirportInputs {
  facilityType?: AirportFacilityType;
  operationSize?: AirportSize;
  criticalLoads?: AirportCriticalLoad[];
}

// ============================================================================
// TRIBAL CASINO
// ============================================================================

export type CasinoSize = 'micro' | 'small' | 'medium' | 'large';
export type CasinoAmenity = 'hotel' | 'restaurant' | 'spa' | 'convention' | 'entertainment';

export interface TribalCasinoInputs {
  squareFootage?: number;
  facilitySize?: CasinoSize;
  gridConnection?: GridConnectionStatus;
  amenities?: CasinoAmenity[];
  operatingHours?: '24-7' | 'extended' | 'business';
}

// ============================================================================
// OFFICE BUILDING
// ============================================================================

export type BuildingClass = 'class-a' | 'class-b' | 'class-c';
export type OfficeAmenity = 'data-center' | 'cafeteria' | 'gym' | 'ev-charging' | 'rooftop';

export interface OfficeInputs {
  squareFootage?: number;
  floors?: number;
  buildingClass?: BuildingClass;
  gridConnection?: GridConnectionStatus;
  amenities?: OfficeAmenity[];
  occupancyRate?: OccupancyRate;
}

// ============================================================================
// WAREHOUSE / LOGISTICS
// ============================================================================

export type WarehouseType = 'distribution' | 'cold-storage' | 'manufacturing' | 'fulfillment';

export interface WarehouseInputs {
  squareFootage?: number;
  warehouseType?: WarehouseType;
  gridConnection?: GridConnectionStatus;
  hasColdStorage?: 'yes' | 'no';
  coldStoragePercentage?: number;
  loadingDocks?: number;
  evFleetCharging?: YesNoFuture;
  numFleetVehicles?: number;
}

// ============================================================================
// RETAIL / SHOPPING CENTER
// ============================================================================

export type RetailType = 'standalone' | 'strip-mall' | 'shopping-center' | 'mall';

export interface RetailInputs {
  squareFootage?: number;
  retailType?: RetailType;
  gridConnection?: GridConnectionStatus;
  operatingHours?: number;
  hasRefrigeration?: 'yes' | 'no';
  evCharging?: YesNoFuture;
  numEVChargers?: number;
}

// ============================================================================
// MANUFACTURING
// ============================================================================

export type ManufacturingType = 'light' | 'medium' | 'heavy' | 'process';
export type CriticalProcess = 'continuous' | 'batch' | 'mixed';

export interface ManufacturingInputs {
  squareFootage?: number;
  manufacturingType?: ManufacturingType;
  gridConnection?: GridConnectionStatus;
  processType?: CriticalProcess;
  peakDemandKW?: number;  // User-known value
  cleanroomRequired?: 'yes' | 'no';
  compressedAir?: 'yes' | 'no';
}

// ============================================================================
// RESIDENTIAL / MULTIFAMILY
// ============================================================================

export interface ResidentialInputs {
  unitCount?: number;
  squareFootage?: number;
  gridConnection?: GridConnectionStatus;
  hasCommonAreas?: 'yes' | 'no';
  evCharging?: YesNoFuture;
  numEVChargers?: number;
  solarInterest?: 'yes' | 'no' | 'existing';
}

// ============================================================================
// AGRICULTURAL
// ============================================================================

export type AgriculturalType = 'dairy' | 'poultry' | 'greenhouse' | 'processing' | 'general';

export interface AgriculturalInputs {
  acreage?: number;
  facilityType?: AgriculturalType;
  gridConnection?: GridConnectionStatus;
  irrigationPumps?: number;
  coldStorage?: 'yes' | 'no';
  processingEquipment?: 'yes' | 'no';
}

// ============================================================================
// UNION TYPE FOR ALL INDUSTRIES
// ============================================================================

export type IndustryInputs =
  | EVChargingInputs
  | CarWashInputs
  | HotelInputs
  | DataCenterInputs
  | HospitalInputs
  | AirportInputs
  | TribalCasinoInputs
  | OfficeInputs
  | WarehouseInputs
  | RetailInputs
  | ManufacturingInputs
  | ResidentialInputs
  | AgriculturalInputs;

// ============================================================================
// TYPE GUARD HELPERS
// ============================================================================

export function isHotelInputs(inputs: IndustryInputs): inputs is HotelInputs {
  return 'numRooms' in inputs || 'hotelCategory' in inputs;
}

export function isEVChargingInputs(inputs: IndustryInputs): inputs is EVChargingInputs {
  return 'level2Chargers' in inputs || 'dcFastChargers' in inputs || 'stationType' in inputs;
}

export function isCarWashInputs(inputs: IndustryInputs): inputs is CarWashInputs {
  return 'numBays' in inputs || 'washType' in inputs || 'tunnelCount' in inputs;
}

export function isDataCenterInputs(inputs: IndustryInputs): inputs is DataCenterInputs {
  return 'capacity' in inputs || 'uptimeRequirement' in inputs;
}

export function isHospitalInputs(inputs: IndustryInputs): inputs is HospitalInputs {
  return 'bedCount' in inputs || 'criticalSystems' in inputs;
}

export function isWarehouseInputs(inputs: IndustryInputs): inputs is WarehouseInputs {
  return 'warehouseType' in inputs || 'loadingDocks' in inputs;
}

export function isManufacturingInputs(inputs: IndustryInputs): inputs is ManufacturingInputs {
  return 'manufacturingType' in inputs || 'processType' in inputs;
}
