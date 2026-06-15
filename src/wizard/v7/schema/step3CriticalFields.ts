/**
 * STEP 3 — CRITICAL QUESTION RESOLVER
 * ===================================
 *
 * Identifies the subset of Step 3 questions that genuinely drive the quote
 * (load sizing, BESS duration, backup) versus refinement questions that only
 * sharpen accuracy. Powers the "Critical questions" detail level in the wizard.
 *
 * Resolution order for an industry's curated schema:
 *   1. Explicit per-industry list in CRITICAL_FIELDS_BY_SCHEMA (curated by us).
 *   2. Generic fallback: any question whose `impactsCalculations` references a
 *      load/sizing driver (peak demand, BESS capacity, cooling load, etc.).
 *   3. Last resort: the first section's questions (typically facility size).
 *
 * Hidden (non-critical) questions always keep their smart defaults, so the
 * quote still computes regardless of which detail level the user picks.
 */

/**
 * Explicit critical field IDs keyed by curated schema key
 * (the `industry` field on a resolved CuratedSchema, e.g. "datacenter").
 *
 * These are the inputs a sales engineer would insist on before trusting a
 * quote for that vertical. Extend this map as more verticals are curated.
 */
export const CRITICAL_FIELDS_BY_SCHEMA: Record<string, string[]> = {
  // Data center — IT load × PUE drives facility power; cooling tech + backup
  // runtime drive cooling load and BESS sizing.
  datacenter: [
    "dataCenterTier",
    "itLoadCapacity",
    "currentPUE",
    "itUtilization",
    "coolingSystem",
    "evaporativeCooling",
    "requiredRuntime",
    "gridReliability",
  ],

  // Car wash — throughput + dominant motor loads (conveyor, blowers).
  "car-wash": [
    "facilityType",
    "tunnelOrBayCount",
    "operatingHours",
    "daysPerWeek",
    "dailyVehicles",
    "conveyorMotorSize",
    "blowerMotorSize",
  ],

  // Hospital — bed count + acuity drive base load; backup duration sizes BESS.
  hospital: [
    "facilityType",
    "bedCount",
    "operatingRooms",
    "imagingEquipment",
    "criticalSystems",
    "gridReliability",
    "backupDuration",
  ],

  // Hotel — room count, class, and occupancy are the calculator requiredInputs.
  hotel: ["hotelCategory", "numRooms", "occupancyRate", "gridReliability", "existingGenerator"],

  // EV charging — charger counts and utilization drive peak demand.
  "ev-charging": [
    "stationType",
    "level2Chargers",
    "dcFastChargers",
    "hpcChargers",
    "utilizationProfile",
    "peakConcurrency",
    "siteDemandCap",
    "gridReliability",
  ],

  // Manufacturing — facility size, shifts, and process loads.
  manufacturing: [
    "facilityType",
    "squareFootage",
    "shifts",
    "processLoads",
    "compressedAir",
    "heavyMachinery",
    "gridReliability",
  ],

  // Office — building class, size, occupancy, and HVAC.
  office: [
    "buildingClass",
    "squareFootage",
    "occupancyType",
    "operatingHours",
    "hvacSystem",
    "demandCharges",
    "gridReliability",
  ],

  // Warehouse — size, refrigeration, and material handling.
  warehouse: [
    "warehouseType",
    "squareFootage",
    "refrigeration",
    "materialHandling",
    "operatingHours",
    "demandCharges",
    "gridReliability",
  ],

  // Retail — store type, size, refrigeration, and demand charges.
  retail: [
    "retailType",
    "squareFootage",
    "operatingHours",
    "refrigerationLevel",
    "demandCharges",
    "gridReliability",
  ],

  // Gas / truck stop — pumps and attached services drive load.
  "gas-station": [
    "stationType",
    "fuelPumps",
    "operatingHours",
    "convenienceStore",
    "carWash",
    "evChargers",
    "demandCharges",
    "gridReliability",
  ],

  // Airport — passenger volume and terminal scale.
  airport: [
    "airportClass",
    "annualPassengers",
    "terminalSqFt",
    "jetBridges",
    "cargoFacility",
    "gridReliability",
    "existingGenerator",
  ],

  // Casino — gaming floor and property scale.
  casino: [
    "casinoType",
    "gamingFloorSqft",
    "totalPropertySqFt",
    "hotelRooms",
    "demandCharges",
    "gridReliability",
    "existingGenerator",
  ],

  // Apartment — unit count and HVAC type.
  apartment: [
    "propertyType",
    "unitCount",
    "hvacType",
    "commonAmenities",
    "evChargers",
    "gridReliability",
    "metering",
  ],

  // College — enrollment and high-load buildings (labs, HPC).
  college: [
    "institutionType",
    "enrollment",
    "campusSqFt",
    "researchLabs",
    "dataCenterHPC",
    "gridReliability",
    "existingGenerator",
  ],

  // Cold storage — refrigeration dominates load.
  "cold-storage": [
    "facilityType",
    "squareFootage",
    "temperatureZones",
    "compressorSystem",
    "throughput",
    "demandCharges",
    "gridReliability",
  ],

  // Indoor farm — lighting and climate control are the primary loads.
  "indoor-farm": [
    "farmType",
    "squareFootage",
    "lightingSystem",
    "lightSchedule",
    "hvacDehumidification",
    "demandCharges",
    "gridReliability",
  ],

  // Agriculture — acreage and irrigation type.
  agriculture: [
    "farmType",
    "acreage",
    "irrigationType",
    "coldStorage",
    "grainDrying",
    "seasonalProfile",
    "gridReliability",
  ],

  // Residential — home size, HVAC, and major appliances.
  residential: [
    "homeType",
    "squareFootage",
    "occupants",
    "hvacType",
    "evCharging",
    "monthlyBill",
    "gridReliability",
  ],

  // Government — facility type, critical ops, and resilience.
  government: [
    "facilityType",
    "squareFootage",
    "criticalOperations",
    "dataCenter",
    "gridReliability",
    "existingGenerator",
    "demandCharges",
  ],

  // Restaurant — seating, kitchen type, and cooking equipment.
  restaurant: [
    "restaurantType",
    "seatingCapacity",
    "kitchenType",
    "operatingHours",
    "cookingEquipment",
    "refrigeration",
    "gridReliability",
  ],
};

/**
 * Tokens in a question's `impactsCalculations` that mark it as load/sizing
 * critical. Add-on-only impacts (solar, carport, EV revenue) are intentionally
 * excluded — those are configured in the add-ons step, not the load profile.
 */
const LOAD_DRIVING_IMPACTS = new Set<string>([
  "peakDemand",
  "peakLoad",
  "averageLoadKW",
  "totalFacilityPower",
  "annualEnergy",
  "bessCapacity",
  "bessRequirements",
  "backupCapacity",
  "coolingLoad",
  "duration",
  "generatorSizing",
]);

interface MinimalQuestion {
  id?: unknown;
  section?: unknown;
  impactsCalculations?: unknown;
}

/**
 * Resolve the set of critical question IDs for a given curated schema.
 *
 * @param schemaKey  CuratedSchema.industry (e.g. "datacenter", "car-wash")
 * @param questions  The schema's questions (only id/section/impactsCalculations read)
 */
export function getCriticalFieldIds(
  schemaKey: string | undefined,
  questions: ReadonlyArray<MinimalQuestion>
): Set<string> {
  const ids = new Set<string>();
  const validIds = new Set(
    questions.map((q) => String(q?.id ?? "")).filter((id) => id && id !== "undefined")
  );

  // 1. Explicit curated list (filtered to IDs that actually exist in the schema).
  const explicit = schemaKey ? CRITICAL_FIELDS_BY_SCHEMA[schemaKey] : undefined;
  if (explicit && explicit.length > 0) {
    for (const id of explicit) {
      if (validIds.has(id)) ids.add(id);
    }
    if (ids.size > 0) return ids;
  }

  // 2. Generic fallback — questions that impact a load/sizing driver.
  for (const q of questions) {
    const id = String(q?.id ?? "");
    if (!validIds.has(id)) continue;
    const impacts = Array.isArray(q?.impactsCalculations)
      ? (q.impactsCalculations as unknown[]).map((x) => String(x))
      : [];
    if (impacts.some((token) => LOAD_DRIVING_IMPACTS.has(token))) {
      ids.add(id);
    }
  }
  if (ids.size > 0) return ids;

  // 3. Last resort — the first section's questions (usually facility size).
  const firstSection = questions.find((q) => q?.section != null)?.section;
  if (firstSection != null) {
    for (const q of questions) {
      const id = String(q?.id ?? "");
      if (validIds.has(id) && q?.section === firstSection) ids.add(id);
    }
  }

  return ids;
}
