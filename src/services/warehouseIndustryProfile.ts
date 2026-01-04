/**
 * WAREHOUSE / LOGISTICS INDUSTRY PROFILE
 * =======================================
 *
 * Data-driven sizing calculations and question tiers for Warehouse/Logistics operations.
 * Based on industry workup by Bob Christopher, December 2025.
 *
 * KEY SIZING DRIVERS:
 * 1. Storage Type - Dry vs cold storage = 5-10x energy difference
 * 2. Rooftop Size - Massive roofs = excellent solar potential
 * 3. Operating Hours - 24/7 vs single shift = 3x energy difference
 * 4. Refrigeration Load - Can be 50-80% of total in cold storage
 * 5. Fleet Electrification - Forklifts, yard trucks, delivery vans
 * 6. Automation - Conveyors, AS/RS, robotics add significant load
 */

// ============================================================================
// WAREHOUSE TYPE PROFILES
// ============================================================================

export const WAREHOUSE_PROFILES = {
  dryStorage: {
    label: "Dry Storage / Bulk",
    description: "Ambient temperature, general goods",
    examples: ["General Merchandise", "Bulk Storage", "Distribution"],

    // Load characteristics
    kwhPerSqFtYear: 5,
    peakKwPerSqFt: 0.0008,
    baseLoadKw: 20,
    seasonalMultiplier: 1.1,

    // Typical ranges
    typicalSqFt: { min: 25000, max: 1500000 },
    typicalPeakKw: { min: 25, max: 1200 },
    typicalAnnualKwh: { min: 100000, max: 8000000 },

    // Cost benchmarks
    annualEnergySpend: { min: 12000, max: 960000 },
    costPerSqFtYear: { min: 0.12, max: 0.64 },

    // Recommended system sizes
    bessKwhPerSqFt: 0.0002,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.0001,

    // Question depth
    questionTier: 1,
    questionsShown: 4,
  },

  climateControlled: {
    label: "Climate-Controlled",
    description: "Temperature maintained (50-70°F), not refrigerated",
    examples: ["Climate-Controlled Storage"],

    kwhPerSqFtYear: 12,
    peakKwPerSqFt: 0.0015,
    baseLoadKw: 40,
    seasonalMultiplier: 1.3,

    typicalSqFt: { min: 25000, max: 500000 },
    typicalPeakKw: { min: 50, max: 750 },
    typicalAnnualKwh: { min: 300000, max: 6000000 },

    annualEnergySpend: { min: 36000, max: 720000 },
    costPerSqFtYear: { min: 0.12, max: 1.44 },

    bessKwhPerSqFt: 0.0003,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.00015,

    questionTier: 2,
    questionsShown: 6,
  },

  refrigerated: {
    label: "Refrigerated (Cooler)",
    description: "Cold storage (35-45°F)",
    examples: ["Produce", "Dairy", "Beverages"],

    kwhPerSqFtYear: 28,
    peakKwPerSqFt: 0.005,
    baseLoadKw: 100,
    seasonalMultiplier: 1.2,

    typicalSqFt: { min: 25000, max: 500000 },
    typicalPeakKw: { min: 150, max: 2500 },
    typicalAnnualKwh: { min: 600000, max: 15000000 },

    annualEnergySpend: { min: 72000, max: 1800000 },
    costPerSqFtYear: { min: 0.12, max: 3.6 },

    bessKwhPerSqFt: 0.003,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.002,

    questionTier: 3,
    questionsShown: 8,
  },

  frozen: {
    label: "Frozen",
    description: "Freezer storage (0°F or below)",
    examples: ["Ice Cream", "Frozen Foods", "Meat"],

    kwhPerSqFtYear: 48,
    peakKwPerSqFt: 0.008,
    baseLoadKw: 150,
    seasonalMultiplier: 1.2,

    typicalSqFt: { min: 25000, max: 300000 },
    typicalPeakKw: { min: 300, max: 2400 },
    typicalAnnualKwh: { min: 1200000, max: 15000000 },

    annualEnergySpend: { min: 144000, max: 1800000 },
    costPerSqFtYear: { min: 0.12, max: 6.0 },

    bessKwhPerSqFt: 0.005,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.003,

    questionTier: 3,
    questionsShown: 8,
  },

  mixedTemperature: {
    label: "Mixed Temperature",
    description: "Multiple zones in one facility",
    examples: ["Mixed Warehouse"],

    kwhPerSqFtYear: 20,
    peakKwPerSqFt: 0.003,
    baseLoadKw: 75,
    seasonalMultiplier: 1.25,

    typicalSqFt: { min: 50000, max: 500000 },
    typicalPeakKw: { min: 200, max: 1500 },
    typicalAnnualKwh: { min: 1000000, max: 10000000 },

    annualEnergySpend: { min: 120000, max: 1200000 },
    costPerSqFtYear: { min: 0.12, max: 2.4 },

    bessKwhPerSqFt: 0.002,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.001,

    questionTier: 3,
    questionsShown: 8,
  },

  distributionCenter: {
    label: "Distribution Center",
    description: "Regional distribution, high throughput",
    examples: ["Regional DC", "Distribution Hub"],

    kwhPerSqFtYear: 9,
    peakKwPerSqFt: 0.0012,
    baseLoadKw: 60,
    seasonalMultiplier: 1.4,

    typicalSqFt: { min: 100000, max: 1000000 },
    typicalPeakKw: { min: 150, max: 1200 },
    typicalAnnualKwh: { min: 900000, max: 9000000 },

    annualEnergySpend: { min: 108000, max: 1080000 },
    costPerSqFtYear: { min: 0.12, max: 1.08 },

    bessKwhPerSqFt: 0.00025,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.00012,

    questionTier: 2,
    questionsShown: 6,
  },

  fulfillmentCenter: {
    label: "Fulfillment Center",
    description: "E-commerce, pick/pack/ship",
    examples: ["E-commerce Fulfillment", "Last-Mile"],

    kwhPerSqFtYear: 14,
    peakKwPerSqFt: 0.002,
    baseLoadKw: 80,
    seasonalMultiplier: 2.0,

    typicalSqFt: { min: 250000, max: 1000000 },
    typicalPeakKw: { min: 500, max: 2000 },
    typicalAnnualKwh: { min: 3500000, max: 15000000 },

    annualEnergySpend: { min: 420000, max: 1800000 },
    costPerSqFtYear: { min: 0.12, max: 1.68 },

    bessKwhPerSqFt: 0.0005,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.00025,

    questionTier: 3,
    questionsShown: 8,
  },

  crossDock: {
    label: "Cross-Dock",
    description: "Transfer point, minimal storage",
    examples: ["Cross-Dock Facility"],

    kwhPerSqFtYear: 6,
    peakKwPerSqFt: 0.001,
    baseLoadKw: 30,
    seasonalMultiplier: 1.2,

    typicalSqFt: { min: 50000, max: 300000 },
    typicalPeakKw: { min: 80, max: 300 },
    typicalAnnualKwh: { min: 300000, max: 1800000 },

    annualEnergySpend: { min: 36000, max: 216000 },
    costPerSqFtYear: { min: 0.12, max: 0.72 },

    bessKwhPerSqFt: 0.0002,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.0001,

    questionTier: 1,
    questionsShown: 4,
  },

  lastMile: {
    label: "Last-Mile / Delivery Hub",
    description: "Urban delivery operations",
    examples: ["Last-Mile Hub", "Delivery Hub"],

    kwhPerSqFtYear: 12,
    peakKwPerSqFt: 0.0018,
    baseLoadKw: 50,
    seasonalMultiplier: 1.5,

    typicalSqFt: { min: 50000, max: 250000 },
    typicalPeakKw: { min: 150, max: 450 },
    typicalAnnualKwh: { min: 600000, max: 3000000 },

    annualEnergySpend: { min: 72000, max: 360000 },
    costPerSqFtYear: { min: 0.12, max: 1.44 },

    bessKwhPerSqFt: 0.0003,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.00015,

    questionTier: 2,
    questionsShown: 6,
  },

  foodProcessing: {
    label: "Food Processing + Storage",
    description: "Manufacturing with cold storage",
    examples: ["Food Processing", "Production + Storage"],

    kwhPerSqFtYear: 25,
    peakKwPerSqFt: 0.004,
    baseLoadKw: 120,
    seasonalMultiplier: 1.3,

    typicalSqFt: { min: 50000, max: 300000 },
    typicalPeakKw: { min: 300, max: 1200 },
    typicalAnnualKwh: { min: 1250000, max: 7500000 },

    annualEnergySpend: { min: 150000, max: 900000 },
    costPerSqFtYear: { min: 0.12, max: 3.0 },

    bessKwhPerSqFt: 0.0025,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.0015,

    questionTier: 3,
    questionsShown: 8,
  },

  pharmaceutical: {
    label: "Pharmaceutical / Medical",
    description: "Temperature-controlled, validated",
    examples: ["Pharma Storage", "Medical Device"],

    kwhPerSqFtYear: 22,
    peakKwPerSqFt: 0.0035,
    baseLoadKw: 100,
    seasonalMultiplier: 1.15,

    typicalSqFt: { min: 25000, max: 200000 },
    typicalPeakKw: { min: 150, max: 700 },
    typicalAnnualKwh: { min: 550000, max: 4400000 },

    annualEnergySpend: { min: 66000, max: 528000 },
    costPerSqFtYear: { min: 0.12, max: 2.64 },

    bessKwhPerSqFt: 0.003,
    solarKwPerSqFt: 0.002,
    generatorKwPerSqFt: 0.002,

    questionTier: 3,
    questionsShown: 8,
  },
};

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface WarehouseInputs {
  // Section 1: Your Facility
  warehouseType: string;
  totalSqFt?: number;
  clearHeight?: number;
  dockDoors?: number;
  numberOfBuildings?: number;

  // Cold storage breakdown
  drySqFt?: number;
  climateControlledSqFt?: number;
  climateControlledTemp?: number;
  coolerSqFt?: number;
  coolerTemp?: number;
  freezerSqFt?: number;
  freezerTemp?: number;
  blastFreezerSqFt?: number;
  blastFreezerTemp?: number;

  ownershipType?: string;

  // Section 2: Operations Profile
  operatingHours?: string;
  inboundTrucksPerDay?: number;
  outboundTrucksPerDay?: number;
  ordersPerDay?: number;
  palletsPerDay?: number;
  peakSeasonMultiplier?: number;

  // Automation
  hasConveyor?: boolean;
  conveyorFeet?: number;
  hasSortation?: boolean;
  hasASRS?: boolean;
  asrsLanes?: number;
  hasRobots?: boolean;
  robotCount?: number;
  hasPalletizers?: boolean;
  palletizerCount?: number;

  // Section 3: Fleet & Charging
  forkliftType?: string[];
  forkliftCount?: Record<string, number>;
  forkliftPower?: Record<string, string>; // electric, propane, diesel
  reachTruckCount?: number;
  orderPickerCount?: number;
  palletJackCount?: number;
  tuggerCount?: number;
  yardTruckCount?: number;
  dockTruckCount?: number;

  forkliftCharging?: string;
  forkliftChargerCount?: number;
  forkliftChargerKw?: number;
  hasChargingRoom?: boolean;

  // Delivery fleet
  electricVans?: number;
  electricVansPlanned?: number;
  electricBoxTrucks?: number;
  electricBoxTrucksPlanned?: number;
  electricSemis?: number;
  electricSemisPlanned?: number;
  employeeEvPorts?: number;
  employeeEvPortsPlanned?: number;

  // Section 4: Refrigeration Systems
  refrigerationSystem?: string;
  refrigerationTonnage?: number;
  compressorHp?: number;
  evaporatorFanHp?: number;
  condenserFanHp?: number;
  systemAge?: string;
  refrigerationConcerns?: string[];

  // Section 5: Current Power Situation
  monthlyBillAverage?: number;
  monthlyBillPeak?: number;
  annualEnergySpend?: number;
  peakDemandKw?: number;
  demandCharges?: string;
  demandChargePercent?: number;
  demandChargeDollars?: number;
  hasTOU?: boolean;

  currentBackup?: string;
  backupKw?: number;
  existingBattery?: number;
  existingSolar?: number;
  outageImpact?: string[];

  // Section 6: Roof & Solar Potential
  roofType?: string;
  roofMaterial?: string;
  roofAge?: string;
  roofCondition?: string;
  roofSqFt?: number;
  roofObstructions?: number; // percentage

  roofConstraints?: string[];
  parkingCanopySpaces?: number;
  truckYardSqFt?: number;
  adjacentLandAcres?: number;
  carportSpaces?: number;

  // Section 7: Goals & Priorities
  energyGoals?: string[];
  priorities?: string[];
  leaseTermRemaining?: number;
  ownershipHorizon?: number;
  fleetElectrificationPlans?: number;
  expansionPlans?: number;
}

// ============================================================================
// QUESTION DEFINITIONS
// ============================================================================

export const WAREHOUSE_QUESTIONS = [
  // Section 1: Your Facility
  {
    id: "warehouseType",
    section: 1,
    sectionTitle: "Your Facility",
    type: "select",
    label: "What type of warehouse is this?",
    required: true,
    options: [
      { value: "dryStorage", label: "Dry Storage / Bulk" },
      { value: "climateControlled", label: "Climate-Controlled" },
      { value: "refrigerated", label: "Refrigerated (Cooler)" },
      { value: "frozen", label: "Frozen" },
      { value: "mixedTemperature", label: "Mixed Temperature" },
      { value: "distributionCenter", label: "Distribution Center" },
      { value: "fulfillmentCenter", label: "Fulfillment Center" },
      { value: "crossDock", label: "Cross-Dock" },
      { value: "lastMile", label: "Last-Mile / Delivery Hub" },
      { value: "foodProcessing", label: "Food Processing + Storage" },
      { value: "pharmaceutical", label: "Pharmaceutical / Medical" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "totalSqFt",
    section: 1,
    type: "number",
    label: "Total building square feet",
    required: true,
    min: 1000,
    max: 5000000,
  },
  {
    id: "clearHeight",
    section: 1,
    type: "number",
    label: "Clear height (feet)",
    required: false,
    min: 10,
    max: 50,
  },
  {
    id: "dockDoors",
    section: 1,
    type: "number",
    label: "Number of dock doors",
    required: false,
    min: 0,
  },
  {
    id: "drySqFt",
    section: 1,
    type: "number",
    label: "Dry / Ambient square feet",
    required: false,
    conditional: { field: "warehouseType", values: ["mixedTemperature"] },
    min: 0,
  },
  {
    id: "coolerSqFt",
    section: 1,
    type: "number",
    label: "Cooler square feet",
    required: false,
    conditional: { field: "warehouseType", values: ["refrigerated", "mixedTemperature"] },
    min: 0,
  },
  {
    id: "coolerTemp",
    section: 1,
    type: "number",
    label: "Cooler temperature (°F)",
    required: false,
    conditional: { field: "coolerSqFt", min: 1 },
    min: 30,
    max: 50,
  },
  {
    id: "freezerSqFt",
    section: 1,
    type: "number",
    label: "Freezer square feet",
    required: false,
    conditional: { field: "warehouseType", values: ["frozen", "mixedTemperature"] },
    min: 0,
  },
  {
    id: "freezerTemp",
    section: 1,
    type: "number",
    label: "Freezer temperature (°F)",
    required: false,
    conditional: { field: "freezerSqFt", min: 1 },
    min: -20,
    max: 10,
  },
  {
    id: "ownershipType",
    section: 1,
    type: "select",
    label: "Do you own or lease?",
    required: false,
    options: [
      { value: "own", label: "Own Building" },
      { value: "nnn", label: "Lease — NNN" },
      { value: "gross", label: "Lease — Gross / Modified" },
      { value: "groundLease", label: "Own Building, Leased Land" },
      { value: "spec", label: "Developer / Spec Building" },
    ],
  },

  // Section 2: Operations Profile
  {
    id: "operatingHours",
    section: 2,
    sectionTitle: "Operations Profile",
    type: "select",
    label: "What are your operating hours?",
    required: false,
    options: [
      { value: "singleShift", label: "Single Shift (6 AM - 4 PM)" },
      { value: "twoShift", label: "Two Shifts (6 AM - 12 AM)" },
      { value: "24x7", label: "24/7 (Always Operating)" },
      { value: "seasonal", label: "Seasonal" },
    ],
  },
  {
    id: "inboundTrucksPerDay",
    section: 2,
    type: "number",
    label: "Inbound trucks per day",
    required: false,
    min: 0,
  },
  {
    id: "outboundTrucksPerDay",
    section: 2,
    type: "number",
    label: "Outbound trucks per day",
    required: false,
    min: 0,
  },
  {
    id: "ordersPerDay",
    section: 2,
    type: "number",
    label: "Orders / Picks per day",
    required: false,
    min: 0,
  },
  {
    id: "palletsPerDay",
    section: 2,
    type: "number",
    label: "Pallets in/out per day",
    required: false,
    min: 0,
  },
  {
    id: "hasConveyor",
    section: 2,
    type: "boolean",
    label: "Do you have conveyor systems?",
    required: false,
  },
  {
    id: "conveyorFeet",
    section: 2,
    type: "number",
    label: "Conveyor linear feet",
    required: false,
    conditional: { field: "hasConveyor", value: true },
    min: 0,
  },
  {
    id: "hasASRS",
    section: 2,
    type: "boolean",
    label: "Do you have AS/RS (Automated Storage)?",
    required: false,
  },
  {
    id: "asrsLanes",
    section: 2,
    type: "number",
    label: "AS/RS lanes",
    required: false,
    conditional: { field: "hasASRS", value: true },
    min: 0,
  },
  {
    id: "hasRobots",
    section: 2,
    type: "boolean",
    label: "Do you have AMRs / AGVs (Robots)?",
    required: false,
  },
  {
    id: "robotCount",
    section: 2,
    type: "number",
    label: "Number of robots",
    required: false,
    conditional: { field: "hasRobots", value: true },
    min: 0,
  },

  // Section 3: Fleet & Charging
  {
    id: "forkliftCharging",
    section: 3,
    sectionTitle: "Fleet & Charging",
    type: "select",
    label: "What's your forklift charging situation?",
    required: false,
    options: [
      { value: "conventional", label: "Conventional Charging (8-hour)" },
      { value: "opportunity", label: "Opportunity Charging" },
      { value: "fast", label: "Fast Charging" },
      { value: "batterySwap", label: "Battery Swap" },
      { value: "propane", label: "Propane — Considering Electric" },
      { value: "hydrogen", label: "Hydrogen Fuel Cell" },
    ],
  },
  {
    id: "forkliftChargerCount",
    section: 3,
    type: "number",
    label: "Number of forklift chargers",
    required: false,
    conditional: { field: "forkliftCharging", notValue: "propane" },
    min: 0,
  },
  {
    id: "forkliftChargerKw",
    section: 3,
    type: "number",
    label: "Charger kW each",
    required: false,
    conditional: { field: "forkliftChargerCount", min: 1 },
    min: 0,
  },
  {
    id: "electricVans",
    section: 3,
    type: "number",
    label: "Electric vans (current)",
    required: false,
    min: 0,
  },
  {
    id: "electricVansPlanned",
    section: 3,
    type: "number",
    label: "Electric vans (planned)",
    required: false,
    min: 0,
  },
  {
    id: "electricBoxTrucks",
    section: 3,
    type: "number",
    label: "Electric box trucks (current)",
    required: false,
    min: 0,
  },
  {
    id: "electricBoxTrucksPlanned",
    section: 3,
    type: "number",
    label: "Electric box trucks (planned)",
    required: false,
    min: 0,
  },
  {
    id: "employeeEvPorts",
    section: 3,
    type: "number",
    label: "Employee EV charging ports (current)",
    required: false,
    min: 0,
  },
  {
    id: "employeeEvPortsPlanned",
    section: 3,
    type: "number",
    label: "Employee EV charging ports (planned)",
    required: false,
    min: 0,
  },

  // Section 4: Refrigeration Systems
  {
    id: "refrigerationSystem",
    section: 4,
    sectionTitle: "Refrigeration Systems",
    type: "select",
    label: "What refrigeration systems do you have?",
    required: false,
    conditional: {
      field: "warehouseType",
      values: ["refrigerated", "frozen", "mixedTemperature", "foodProcessing"],
    },
    options: [
      { value: "ammonia", label: "Ammonia (NH3) Central Plant" },
      { value: "freon", label: "Freon / HFC Central Plant" },
      { value: "co2", label: "CO2 / Transcritical" },
      { value: "rooftop", label: "Rooftop Condensing Units" },
      { value: "selfContained", label: "Self-Contained Units" },
      { value: "notSure", label: "Not Sure" },
    ],
  },
  {
    id: "refrigerationTonnage",
    section: 4,
    type: "number",
    label: "Total refrigeration tonnage (TR)",
    required: false,
    conditional: { field: "refrigerationSystem", notValue: "notSure" },
    min: 0,
  },
  {
    id: "compressorHp",
    section: 4,
    type: "number",
    label: "Compressor total HP",
    required: false,
    conditional: { field: "refrigerationTonnage", min: 1 },
    min: 0,
  },
  {
    id: "evaporatorFanHp",
    section: 4,
    type: "number",
    label: "Evaporator fan HP",
    required: false,
    conditional: { field: "refrigerationTonnage", min: 1 },
    min: 0,
  },
  {
    id: "systemAge",
    section: 4,
    type: "select",
    label: "System age",
    required: false,
    conditional: { field: "refrigerationSystem", notValue: "notSure" },
    options: [
      { value: "under5", label: "Under 5 years" },
      { value: "5to15", label: "5-15 years" },
      { value: "15to25", label: "15-25 years" },
      { value: "over25", label: "Over 25 years" },
    ],
  },
  {
    id: "refrigerationConcerns",
    section: 4,
    type: "multiselect",
    label: "Do you have refrigeration concerns?",
    required: false,
    conditional: { field: "refrigerationSystem", notValue: "notSure" },
    options: [
      { value: "highEnergyCosts", label: "High energy costs for refrigeration" },
      { value: "agingEquipment", label: "Aging equipment needs replacement" },
      { value: "refrigerantPhaseOut", label: "Refrigerant phase-out concerns" },
      { value: "peakDemand", label: "Peak demand charges from compressors" },
      { value: "productLoss", label: "Product loss during outages" },
      { value: "noConcerns", label: "No major concerns" },
    ],
  },

  // Section 5: Current Power Situation
  {
    id: "monthlyBillAverage",
    section: 5,
    sectionTitle: "Current Power Situation",
    type: "select",
    label: "Monthly electric bill (average)",
    required: false,
    options: [
      { value: "under5k", label: "Under $5,000" },
      { value: "5kto15k", label: "$5,000 - $15,000" },
      { value: "15kto30k", label: "$15,000 - $30,000" },
      { value: "30kto60k", label: "$30,000 - $60,000" },
      { value: "60kto100k", label: "$60,000 - $100,000" },
      { value: "over100k", label: "Over $100,000" },
    ],
  },
  {
    id: "monthlyBillPeak",
    section: 5,
    type: "select",
    label: "Monthly electric bill (peak)",
    required: false,
    options: [
      { value: "under5k", label: "Under $5,000" },
      { value: "5kto15k", label: "$5,000 - $15,000" },
      { value: "15kto30k", label: "$15,000 - $30,000" },
      { value: "30kto60k", label: "$30,000 - $60,000" },
      { value: "60kto100k", label: "$60,000 - $100,000" },
      { value: "over100k", label: "Over $100,000" },
    ],
  },
  {
    id: "annualEnergySpend",
    section: 5,
    type: "select",
    label: "Annual electricity spend",
    required: false,
    options: [
      { value: "under100k", label: "Under $100,000" },
      { value: "100kto300k", label: "$100,000 - $300,000" },
      { value: "300kto600k", label: "$300,000 - $600,000" },
      { value: "600kto1m", label: "$600,000 - $1,000,000" },
      { value: "over1m", label: "Over $1,000,000" },
    ],
  },
  {
    id: "peakDemandKw",
    section: 5,
    type: "number",
    label: "Peak demand (kW) if known",
    required: false,
    min: 0,
  },
  {
    id: "demandCharges",
    section: 5,
    type: "select",
    label: "Do you know your demand charges?",
    required: false,
    options: [
      { value: "dontKnow", label: "Don't Know / Don't Have" },
      { value: "percent", label: "Yes — Roughly ___% of bill" },
      { value: "dollars", label: "Yes — Approximately $___/month" },
      { value: "tou", label: "We have time-of-use rates" },
    ],
  },
  {
    id: "demandChargePercent",
    section: 5,
    type: "number",
    label: "Demand charge percentage of bill",
    required: false,
    conditional: { field: "demandCharges", value: "percent" },
    min: 0,
    max: 100,
  },
  {
    id: "currentBackup",
    section: 5,
    type: "select",
    label: "Do you have backup power today?",
    required: false,
    options: [
      { value: "none", label: "None" },
      { value: "dieselFull", label: "Diesel Generator (Full Facility)" },
      { value: "dieselCritical", label: "Diesel Generator (Critical Only)" },
      { value: "naturalGas", label: "Natural Gas Generator" },
      { value: "ups", label: "UPS for IT / Controls Only" },
      { value: "battery", label: "Battery Backup (Existing)" },
      { value: "solar", label: "Solar (Existing)" },
    ],
  },
  {
    id: "backupKw",
    section: 5,
    type: "number",
    label: "Backup generator capacity (kW)",
    required: false,
    conditional: { field: "currentBackup", values: ["dieselFull", "dieselCritical", "naturalGas"] },
    min: 0,
  },
  {
    id: "outageImpact",
    section: 5,
    type: "multiselect",
    label: "What happens when power goes out?",
    required: false,
    options: [
      { value: "operationsStop", label: "Operations stop, can wait" },
      { value: "refrigerationAtRisk", label: "Refrigeration at risk — product loss" },
      { value: "automationDown", label: "Automation down — major disruption" },
      { value: "forkliftChargingStops", label: "Forklift charging stops" },
      { value: "slaImpact", label: "Customer SLAs impacted" },
      { value: "minimalImpact", label: "We have backup — minimal impact" },
    ],
  },

  // Section 6: Roof & Solar Potential
  {
    id: "roofType",
    section: 6,
    sectionTitle: "Roof & Solar Potential",
    type: "select",
    label: "Roof type",
    required: false,
    options: [
      { value: "flat", label: "Flat" },
      { value: "lowSlope", label: "Low Slope" },
      { value: "peaked", label: "Peaked" },
    ],
  },
  {
    id: "roofMaterial",
    section: 6,
    type: "select",
    label: "Roof material",
    required: false,
    options: [
      { value: "tpo", label: "TPO" },
      { value: "epdm", label: "EPDM" },
      { value: "metal", label: "Metal" },
      { value: "builtUp", label: "Built-Up" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "roofAge",
    section: 6,
    type: "select",
    label: "Roof age",
    required: false,
    options: [
      { value: "under5", label: "Under 5 years" },
      { value: "5to15", label: "5-15 years" },
      { value: "15to25", label: "15-25 years" },
      { value: "over25", label: "Over 25 years" },
    ],
  },
  {
    id: "roofCondition",
    section: 6,
    type: "select",
    label: "Roof condition",
    required: false,
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "fair", label: "Fair" },
      { value: "poor", label: "Poor" },
    ],
  },
  {
    id: "roofSqFt",
    section: 6,
    type: "number",
    label: "Approximate roof square feet",
    required: false,
    min: 0,
  },
  {
    id: "roofObstructions",
    section: 6,
    type: "number",
    label: "Roof obstructions (percentage)",
    required: false,
    min: 0,
    max: 100,
    helpText: "HVAC units, skylights, vents, etc.",
  },
  {
    id: "roofConstraints",
    section: 6,
    type: "multiselect",
    label: "Any roof or solar constraints?",
    required: false,
    options: [
      { value: "replacementNeeded", label: "Roof replacement needed soon" },
      { value: "structuralConcerns", label: "Structural concerns (load capacity)" },
      { value: "landlordApproval", label: "Landlord approval required" },
      { value: "leaseTooShort", label: "Lease term too short" },
      { value: "hoaRestrictions", label: "HOA / Aesthetic restrictions" },
      { value: "interconnectionLimits", label: "Utility interconnection limits" },
      { value: "fireCode", label: "Fire code setback requirements" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "parkingCanopySpaces",
    section: 6,
    type: "number",
    label: "Parking lot canopy spaces available",
    required: false,
    min: 0,
  },
  {
    id: "truckYardSqFt",
    section: 6,
    type: "number",
    label: "Truck yard / Staging area square feet",
    required: false,
    min: 0,
  },
  {
    id: "adjacentLandAcres",
    section: 6,
    type: "number",
    label: "Adjacent land available (acres)",
    required: false,
    min: 0,
  },

  // Section 7: Goals & Priorities
  {
    id: "energyGoals",
    section: 7,
    sectionTitle: "Goals & Priorities",
    type: "multiselect",
    label: "What are your energy goals?",
    required: false,
    options: [
      { value: "reduceCosts", label: "Reduce energy costs" },
      { value: "protectInventory", label: "Protect refrigerated inventory" },
      { value: "reduceDemandCharges", label: "Reduce demand charges" },
      { value: "sustainability", label: "Meet corporate sustainability targets" },
      { value: "tenantAttraction", label: "Attract / Retain tenants (if landlord)" },
      { value: "electrifyFleet", label: "Electrify fleet (forklifts, trucks)" },
      { value: "evMandates", label: "Prepare for EV truck mandates" },
      { value: "improveResilience", label: "Improve resilience / Backup power" },
      { value: "maximizeSolar", label: "Maximize solar on rooftop" },
      { value: "qualifyIncentives", label: "Qualify for incentives" },
      { value: "customerRequirements", label: "Meet customer / Retailer requirements" },
    ],
  },
  {
    id: "priorities",
    section: 7,
    type: "ranking",
    label: "Rank what matters most (select top 3)",
    required: false,
    maxSelections: 3,
    options: [
      { value: "reduceCosts", label: "Reduce operating costs" },
      { value: "protectInventory", label: "Protect inventory" },
      { value: "maximizeSolar", label: "Maximize solar" },
      { value: "fleetElectrification", label: "Fleet electrification" },
      { value: "sustainability", label: "Sustainability / ESG" },
      { value: "demandChargeReduction", label: "Demand charge reduction" },
      { value: "quickPayback", label: "Quick payback" },
      { value: "tenantAttraction", label: "Tenant attraction" },
      { value: "minimalDisruption", label: "Minimal disruption" },
    ],
  },
  {
    id: "leaseTermRemaining",
    section: 7,
    type: "number",
    label: "Lease term remaining (if tenant, in years)",
    required: false,
    conditional: { field: "ownershipType", values: ["nnn", "gross"] },
    min: 0,
  },
  {
    id: "ownershipHorizon",
    section: 7,
    type: "number",
    label: "Building ownership horizon (years)",
    required: false,
    conditional: { field: "ownershipType", value: "own" },
    min: 0,
  },
  {
    id: "fleetElectrificationPlans",
    section: 7,
    type: "number",
    label: "Fleet electrification plans timeframe (years)",
    required: false,
    min: 0,
  },
];

// ============================================================================
// CALCULATION FUNCTION
// ============================================================================

export interface WarehouseProfileResult {
  estimatedPeakKw: number;
  estimatedAnnualKwh: number;
  baseLoadKw: number;
  refrigerationLoadKw: number;
  automationLoadKw: number;
  fleetChargingLoadKw: number;
  lightingLoadKw: number;
  recommendedBessKwh: number;
  recommendedSolarKw: number;
  recommendedGeneratorKw: number;
  solarPotentialKw: number;
  criticalLoadKw: number;
  backupHoursRequired: number;
  demandChargeSavingsPotential: number;
}

export function calculateWarehouseProfile(inputs: WarehouseInputs): WarehouseProfileResult {
  const profile = WAREHOUSE_PROFILES[inputs.warehouseType as keyof typeof WAREHOUSE_PROFILES];
  const profileAny = profile as any;

  if (!profile) {
    // Default fallback
    return {
      estimatedPeakKw: 100,
      estimatedAnnualKwh: 800000,
      baseLoadKw: 50,
      refrigerationLoadKw: 0,
      automationLoadKw: 0,
      fleetChargingLoadKw: 0,
      lightingLoadKw: 50,
      recommendedBessKwh: 200,
      recommendedSolarKw: 500,
      recommendedGeneratorKw: 100,
      solarPotentialKw: 500,
      criticalLoadKw: 0,
      backupHoursRequired: 4,
      demandChargeSavingsPotential: 0,
    };
  }

  const sqFt = inputs.totalSqFt || 50000;

  // Base load calculation
  const baseLoadKw = profileAny.baseLoadKw || 20;
  let estimatedPeakKw = (profileAny.peakKwPerSqFt || 0.001) * sqFt;
  let estimatedAnnualKwh = (profileAny.kwhPerSqFtYear || 5) * sqFt;

  let refrigerationLoadKw = 0;
  let automationLoadKw = 0;
  let fleetChargingLoadKw = 0;
  let lightingLoadKw = 0;
  let criticalLoadKw = 0;

  // Calculate refrigeration load for cold storage
  if (
    inputs.warehouseType === "refrigerated" ||
    inputs.warehouseType === "frozen" ||
    inputs.warehouseType === "mixedTemperature" ||
    inputs.warehouseType === "foodProcessing"
  ) {
    if (inputs.refrigerationTonnage) {
      // 1 TR ≈ 3.5 kW, but with fans and auxiliaries, use 4.5 kW/TR
      refrigerationLoadKw = inputs.refrigerationTonnage * 4.5;
    } else if (inputs.compressorHp) {
      // If we have compressor HP, use that + fans
      refrigerationLoadKw = inputs.compressorHp * 0.8; // Motor kW
      if (inputs.evaporatorFanHp) {
        refrigerationLoadKw += inputs.evaporatorFanHp * 0.8;
      }
      if (inputs.condenserFanHp) {
        refrigerationLoadKw += inputs.condenserFanHp * 0.8;
      }
    } else {
      // Estimate from square footage
      const coldSqFt = inputs.coolerSqFt || inputs.freezerSqFt || sqFt * 0.7;
      if (inputs.warehouseType === "frozen") {
        refrigerationLoadKw = coldSqFt * 0.008; // Higher for frozen
      } else {
        refrigerationLoadKw = coldSqFt * 0.005; // Lower for cooler
      }
    }

    criticalLoadKw = refrigerationLoadKw * 0.8; // 80% is critical for product protection
    estimatedPeakKw = Math.max(estimatedPeakKw, refrigerationLoadKw);
  }

  // Calculate automation load
  if (inputs.hasConveyor && inputs.conveyorFeet) {
    // Rough estimate: 0.1 kW per 10 feet of conveyor
    automationLoadKw += (inputs.conveyorFeet / 10) * 0.1;
  }

  if (inputs.hasASRS && inputs.asrsLanes) {
    // AS/RS: ~5-10 kW per lane depending on size
    automationLoadKw += inputs.asrsLanes * 7;
  }

  if (inputs.hasRobots && inputs.robotCount) {
    // AMRs/AGVs: ~1-2 kW each during operation
    automationLoadKw += inputs.robotCount * 1.5;
  }

  if (inputs.hasPalletizers && inputs.palletizerCount) {
    // Palletizers: ~3-5 kW each
    automationLoadKw += inputs.palletizerCount * 4;
  }

  estimatedPeakKw += automationLoadKw;

  // Calculate fleet charging load
  if (inputs.forkliftChargerCount && inputs.forkliftChargerKw) {
    // Forklift chargers: assume 50% utilization during peak hours
    fleetChargingLoadKw += inputs.forkliftChargerCount * inputs.forkliftChargerKw * 0.5;
  } else if (inputs.forkliftCharging && inputs.forkliftCharging !== "propane") {
    // Estimate: 5-10 chargers for typical warehouse
    const estimatedChargers = Math.ceil(sqFt / 10000); // 1 charger per 10k sq ft
    fleetChargingLoadKw += estimatedChargers * 8 * 0.5; // 8 kW chargers, 50% utilization
  }

  // Add delivery fleet charging
  if (inputs.electricVans || inputs.electricVansPlanned) {
    const vans = (inputs.electricVans || 0) + (inputs.electricVansPlanned || 0);
    // Electric vans: ~7 kW Level 2, assume 30% charging during peak
    fleetChargingLoadKw += vans * 7 * 0.3;
  }

  if (inputs.electricBoxTrucks || inputs.electricBoxTrucksPlanned) {
    const trucks = (inputs.electricBoxTrucks || 0) + (inputs.electricBoxTrucksPlanned || 0);
    // Box trucks: ~19 kW Level 2, assume 25% charging during peak
    fleetChargingLoadKw += trucks * 19 * 0.25;
  }

  if (inputs.employeeEvPorts || inputs.employeeEvPortsPlanned) {
    const ports = (inputs.employeeEvPorts || 0) + (inputs.employeeEvPortsPlanned || 0);
    // Employee charging: ~7 kW Level 2, assume 20% utilization during peak
    fleetChargingLoadKw += ports * 7 * 0.2;
  }

  estimatedPeakKw += fleetChargingLoadKw;

  // Calculate lighting load
  // Warehouse lighting: ~0.5-1.5 W/sq ft for LED, 2-3 W/sq ft for old fixtures
  // Assume average 1 W/sq ft = 0.001 kW/sq ft
  lightingLoadKw = sqFt * 0.001;
  estimatedPeakKw += lightingLoadKw;

  // Adjust for operating hours
  const operatingHoursMultiplier =
    inputs.operatingHours === "24x7"
      ? 1.0
      : inputs.operatingHours === "twoShift"
        ? 0.7
        : inputs.operatingHours === "singleShift"
          ? 0.4
          : 0.5;

  // Peak demand doesn't change much with hours, but annual kWh does
  const hoursMultiplier =
    inputs.operatingHours === "24x7"
      ? 1.0
      : inputs.operatingHours === "twoShift"
        ? 0.65
        : inputs.operatingHours === "singleShift"
          ? 0.35
          : 0.5;

  estimatedAnnualKwh = estimatedAnnualKwh * hoursMultiplier;

  // Apply seasonal variation for fulfillment centers
  if (inputs.warehouseType === "fulfillmentCenter" && inputs.peakSeasonMultiplier) {
    estimatedPeakKw = estimatedPeakKw * inputs.peakSeasonMultiplier;
  }

  // Determine backup hours based on critical loads
  let backupHoursRequired = 4; // Default
  if (inputs.outageImpact) {
    if (inputs.outageImpact.includes("refrigerationAtRisk")) {
      backupHoursRequired = 12; // Critical for cold storage
    } else if (inputs.outageImpact.includes("automationDown")) {
      backupHoursRequired = 8;
    } else if (inputs.outageImpact.includes("slaImpact")) {
      backupHoursRequired = 6;
    }
  }

  // Calculate demand charge savings potential
  let demandChargeSavingsPotential = 0;
  if (inputs.demandCharges && inputs.demandCharges !== "dontKnow") {
    // Assume 20-30% peak shaving potential
    const peakShavingPercent = 0.25;
    const peakShavingKw = estimatedPeakKw * peakShavingPercent;
    // Average demand charge: $15/kW/month
    const avgDemandCharge = 15;
    demandChargeSavingsPotential = peakShavingKw * avgDemandCharge * 12; // Annual
  }

  // Calculate solar potential
  let solarPotentialKw = 0;
  if (inputs.roofSqFt) {
    // Solar: ~6-8 W/sq ft for flat roofs, 8-10 W/sq ft for sloped
    const wattsPerSqFt = inputs.roofType === "flat" ? 7 : 9;
    const availableSqFt = inputs.roofSqFt * (1 - (inputs.roofObstructions || 0) / 100);
    solarPotentialKw = (availableSqFt * wattsPerSqFt) / 1000; // Convert to kW
  } else {
    // Estimate from building sq ft (roof ≈ building footprint)
    const estimatedRoofSqFt = sqFt;
    const wattsPerSqFt = 7;
    solarPotentialKw = (estimatedRoofSqFt * wattsPerSqFt) / 1000;
  }

  // Add parking canopy and other solar
  if (inputs.parkingCanopySpaces) {
    // ~10 kW per 10 parking spaces
    solarPotentialKw += (inputs.parkingCanopySpaces / 10) * 10;
  }

  // System sizing recommendations
  let recommendedBessKwh = 0;
  let recommendedSolarKw = 0;
  let recommendedGeneratorKw = 0;

  // Base sizing from profile
  recommendedBessKwh = (profileAny.bessKwhPerSqFt || 0.0002) * sqFt;
  recommendedSolarKw = Math.min(
    (profileAny.solarKwPerSqFt || 0.002) * sqFt,
    solarPotentialKw * 0.9 // Don't exceed 90% of available roof
  );
  recommendedGeneratorKw = (profileAny.generatorKwPerSqFt || 0.0001) * sqFt;

  // Adjust BESS for backup requirements
  if (backupHoursRequired > 4) {
    recommendedBessKwh = Math.max(recommendedBessKwh, criticalLoadKw * backupHoursRequired);
  }

  // Adjust BESS for demand charge management
  if (inputs.demandCharges && inputs.demandCharges !== "dontKnow") {
    // Add BESS for peak shaving: 2-hour duration at 25% of peak
    const peakShavingKwh = estimatedPeakKw * 0.25 * 2;
    recommendedBessKwh = Math.max(recommendedBessKwh, peakShavingKwh);
  }

  // Adjust generator for critical loads
  if (criticalLoadKw > 0) {
    recommendedGeneratorKw = Math.max(recommendedGeneratorKw, criticalLoadKw * 1.2); // 20% margin
  }

  return {
    estimatedPeakKw: Math.round(estimatedPeakKw),
    estimatedAnnualKwh: Math.round(estimatedAnnualKwh),
    baseLoadKw: Math.round(baseLoadKw),
    refrigerationLoadKw: Math.round(refrigerationLoadKw),
    automationLoadKw: Math.round(automationLoadKw),
    fleetChargingLoadKw: Math.round(fleetChargingLoadKw),
    lightingLoadKw: Math.round(lightingLoadKw),
    recommendedBessKwh: Math.round(recommendedBessKwh),
    recommendedSolarKw: Math.round(recommendedSolarKw),
    recommendedGeneratorKw: Math.round(recommendedGeneratorKw),
    solarPotentialKw: Math.round(solarPotentialKw),
    criticalLoadKw: Math.round(criticalLoadKw),
    backupHoursRequired,
    demandChargeSavingsPotential: Math.round(demandChargeSavingsPotential),
  };
}

// ============================================================================
// GET QUESTIONS FUNCTION
// ============================================================================

export function getQuestionsForWarehouse(warehouseType?: string): typeof WAREHOUSE_QUESTIONS {
  if (!warehouseType) {
    return WAREHOUSE_QUESTIONS;
  }

  // Filter questions based on warehouse type and conditionals
  return WAREHOUSE_QUESTIONS.filter((q) => {
    if (!q.conditional) return true;

    const cond = q.conditional;

    // Handle field value conditions
    if ("field" in cond && "value" in cond) {
      // UI handles conditional display
      return true;
    }

    if ("field" in cond && "values" in cond) {
      return true;
    }

    if ("notValue" in cond) {
      return true;
    }

    if ("min" in cond) {
      return true;
    }

    return true;
  }) as typeof WAREHOUSE_QUESTIONS;
}
