/**
 * FACILITY BUILDER
 * 
 * Builder pattern for creating test facility data
 * Provides fluent API for constructing facility configurations
 */

export type FacilityType = 
  | 'medical_office' 
  | 'corporate_office' 
  | 'retail' 
  | 'grocery'
  | 'restaurant'
  | 'manufacturing'
  | 'warehouse'
  | 'datacenter'
  | 'hotel'
  | 'casino'
  | 'hospital'
  | 'school'
  | 'university'
  | 'ev-charging'
  | 'farm'
  | 'mining-camp'
  | 'microgrid'
  | 'residential'
  | 'multifamily';

export type GridConnection = 'reliable' | 'unreliable' | 'none';

export interface FacilityDetails {
  facilityType: FacilityType;
  squareFootage: number;
  operatingHours: number;
  gridConnection: GridConnection;
  hasRestaurant?: boolean;
  hasKitchen?: boolean;
  numberOfBeds?: number;
  numberOfRooms?: number;
  numberOfBays?: number;
  numberOfChargers?: number;
  storeType?: string;
  coolingType?: string;
  heatingType?: string;
  region?: string;
  [key: string]: any;
}

export class FacilityBuilder {
  private data: Partial<FacilityDetails> = {};

  // ============================================================================
  // CORE PROPERTIES
  // ============================================================================

  withFacilityType(type: FacilityType): this {
    this.data.facilityType = type;
    return this;
  }

  withSquareFootage(squareFootage: number): this {
    this.data.squareFootage = squareFootage;
    return this;
  }

  withOperatingHours(hours: number): this {
    this.data.operatingHours = hours;
    return this;
  }

  withGridConnection(connection: GridConnection): this {
    this.data.gridConnection = connection;
    return this;
  }

  withRegion(region: string): this {
    this.data.region = region;
    return this;
  }

  // ============================================================================
  // OPTIONAL FEATURES
  // ============================================================================

  withRestaurant(has: boolean = true): this {
    this.data.hasRestaurant = has;
    return this;
  }

  withKitchen(has: boolean = true): this {
    this.data.hasKitchen = has;
    return this;
  }

  withNumberOfBeds(beds: number): this {
    this.data.numberOfBeds = beds;
    return this;
  }

  withNumberOfRooms(rooms: number): this {
    this.data.numberOfRooms = rooms;
    return this;
  }

  withNumberOfBays(bays: number): this {
    this.data.numberOfBays = bays;
    return this;
  }

  withNumberOfChargers(chargers: number): this {
    this.data.numberOfChargers = chargers;
    return this;
  }

  withStoreType(type: string): this {
    this.data.storeType = type;
    return this;
  }

  withCoolingType(type: string): this {
    this.data.coolingType = type;
    return this;
  }

  withHeatingType(type: string): this {
    this.data.heatingType = type;
    return this;
  }

  // ============================================================================
  // PRESET CONFIGURATIONS
  // ============================================================================

  asMedicalOffice(): this {
    return this
      .withFacilityType('medical_office')
      .withSquareFootage(50000)
      .withOperatingHours(12)
      .withGridConnection('reliable')
      .withRestaurant(true);
  }

  asCorporateOffice(): this {
    return this
      .withFacilityType('corporate_office')
      .withSquareFootage(75000)
      .withOperatingHours(10)
      .withGridConnection('reliable')
      .withRestaurant(false);
  }

  asRetailStore(): this {
    return this
      .withFacilityType('retail')
      .withSquareFootage(25000)
      .withOperatingHours(12)
      .withGridConnection('reliable')
      .withStoreType('general');
  }

  asGroceryStore(): this {
    return this
      .withFacilityType('grocery')
      .withSquareFootage(40000)
      .withOperatingHours(16)
      .withGridConnection('reliable')
      .withStoreType('supermarket');
  }

  asRestaurant(): this {
    return this
      .withFacilityType('restaurant')
      .withSquareFootage(5000)
      .withOperatingHours(14)
      .withGridConnection('reliable')
      .withKitchen(true);
  }

  asManufacturingFacility(): this {
    return this
      .withFacilityType('manufacturing')
      .withSquareFootage(100000)
      .withOperatingHours(24)
      .withGridConnection('reliable');
  }

  asWarehouse(): this {
    return this
      .withFacilityType('warehouse')
      .withSquareFootage(150000)
      .withOperatingHours(16)
      .withGridConnection('reliable');
  }

  asDataCenter(): this {
    return this
      .withFacilityType('datacenter')
      .withSquareFootage(50000)
      .withOperatingHours(24)
      .withGridConnection('reliable')
      .withCoolingType('precision');
  }

  asHotel(): this {
    return this
      .withFacilityType('hotel')
      .withSquareFootage(150000)
      .withOperatingHours(24)
      .withGridConnection('reliable')
      .withNumberOfRooms(200)
      .withRestaurant(true);
  }

  asCasino(): this {
    return this
      .withFacilityType('casino')
      .withSquareFootage(200000)
      .withOperatingHours(24)
      .withGridConnection('reliable')
      .withRestaurant(true);
  }

  asHospital(): this {
    return this
      .withFacilityType('hospital')
      .withSquareFootage(300000)
      .withOperatingHours(24)
      .withGridConnection('unreliable')
      .withNumberOfBeds(300);
  }

  asSchool(): this {
    return this
      .withFacilityType('school')
      .withSquareFootage(100000)
      .withOperatingHours(8)
      .withGridConnection('reliable');
  }

  asUniversity(): this {
    return this
      .withFacilityType('university')
      .withSquareFootage(500000)
      .withOperatingHours(16)
      .withGridConnection('reliable');
  }

  asEVChargingStation(): this {
    return this
      .withFacilityType('ev-charging')
      .withSquareFootage(5000)
      .withOperatingHours(24)
      .withGridConnection('reliable')
      .withNumberOfChargers(10);
  }

  asFarm(): this {
    return this
      .withFacilityType('farm')
      .withSquareFootage(10000)
      .withOperatingHours(12)
      .withGridConnection('unreliable');
  }

  asMiningCamp(): this {
    return this
      .withFacilityType('mining-camp')
      .withSquareFootage(50000)
      .withOperatingHours(24)
      .withGridConnection('none');
  }

  asMicrogrid(): this {
    return this
      .withFacilityType('microgrid')
      .withSquareFootage(20000)
      .withOperatingHours(24)
      .withGridConnection('unreliable');
  }

  asResidential(): this {
    return this
      .withFacilityType('residential')
      .withSquareFootage(3000)
      .withOperatingHours(24)
      .withGridConnection('reliable');
  }

  asMultifamily(): this {
    return this
      .withFacilityType('multifamily')
      .withSquareFootage(50000)
      .withOperatingHours(24)
      .withGridConnection('reliable')
      .withNumberOfRooms(50);
  }

  // ============================================================================
  // SIZE VARIANTS
  // ============================================================================

  small(): this {
    if (this.data.squareFootage) {
      this.data.squareFootage = Math.round(this.data.squareFootage * 0.5);
    }
    return this;
  }

  medium(): this {
    // Keep current size (default)
    return this;
  }

  large(): this {
    if (this.data.squareFootage) {
      this.data.squareFootage = Math.round(this.data.squareFootage * 2);
    }
    return this;
  }

  extraLarge(): this {
    if (this.data.squareFootage) {
      this.data.squareFootage = Math.round(this.data.squareFootage * 3);
    }
    return this;
  }

  // ============================================================================
  // GRID CONDITIONS
  // ============================================================================

  withReliableGrid(): this {
    return this.withGridConnection('reliable');
  }

  withUnreliableGrid(): this {
    return this.withGridConnection('unreliable');
  }

  offGrid(): this {
    return this.withGridConnection('none');
  }

  // ============================================================================
  // BUILD
  // ============================================================================

  build(): FacilityDetails {
    // Set defaults if not specified
    const defaults: FacilityDetails = {
      facilityType: 'medical_office',
      squareFootage: 50000,
      operatingHours: 12,
      gridConnection: 'reliable'
    };

    return { ...defaults, ...this.data } as FacilityDetails;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  clone(): FacilityBuilder {
    const builder = new FacilityBuilder();
    builder.data = { ...this.data };
    return builder;
  }

  reset(): this {
    this.data = {};
    return this;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const createFacility = () => new FacilityBuilder();

export const medicalOffice = () => new FacilityBuilder().asMedicalOffice().build();
export const corporateOffice = () => new FacilityBuilder().asCorporateOffice().build();
export const retailStore = () => new FacilityBuilder().asRetailStore().build();
export const groceryStore = () => new FacilityBuilder().asGroceryStore().build();
export const restaurant = () => new FacilityBuilder().asRestaurant().build();
export const manufacturing = () => new FacilityBuilder().asManufacturingFacility().build();
export const warehouse = () => new FacilityBuilder().asWarehouse().build();
export const datacenter = () => new FacilityBuilder().asDataCenter().build();
export const hotel = () => new FacilityBuilder().asHotel().build();
export const casino = () => new FacilityBuilder().asCasino().build();
export const hospital = () => new FacilityBuilder().asHospital().build();
export const school = () => new FacilityBuilder().asSchool().build();
export const university = () => new FacilityBuilder().asUniversity().build();
export const evCharging = () => new FacilityBuilder().asEVChargingStation().build();
export const farm = () => new FacilityBuilder().asFarm().build();
export const miningCamp = () => new FacilityBuilder().asMiningCamp().build();
export const microgrid = () => new FacilityBuilder().asMicrogrid().build();
export const residential = () => new FacilityBuilder().asResidential().build();
export const multifamily = () => new FacilityBuilder().asMultifamily().build();
