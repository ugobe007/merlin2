/**
 * Complete Car Wash Questionnaire Configuration
 *
 * All 27 questions with proper types, validations, and conditional logic
 * Production-ready implementation
 */

// Note: Icons will be imported from existing icon system
// For now, using string identifiers that can be mapped to actual icons

export interface Question {
  id: string;
  type:
    | "buttons"
    | "auto_confirm"
    | "slider"
    | "number_input"
    | "toggle"
    | "conditional_buttons"
    | "type_then_quantity"
    | "existing_then_planned"
    | "increment_box"
    | "wheel"
    | "multiselect"
    | "hours_grid"
    | "range_buttons";
  // Optional: range button config from database
  rangeConfig?: {
    ranges: Array<{ label: string; min: number; max: number | null }>;
    suffix?: string;
  };
  // Optional: field name for database mapping
  fieldName?: string;
  section: "facility" | "operations" | "equipment" | "billing" | "solar";
  title: string;
  subtitle?: string;
  helpText?: string;
  merlinTip?: string;
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
  }>;
  range?: {
    min: number;
    max: number;
    step: number;
  };
  unit?: string;
  suffix?: string; // NEW: Suffix from database options (e.g., " kW", " sq ft")
  smartDefault?: unknown;
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    customRule?: (value: unknown) => boolean | string;
  };
  conditionalLogic?: {
    dependsOn: string;
    showIf: (value: unknown) => boolean;
    modifyOptions?: (value: unknown) => unknown;
  };
  quantityOptions?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
  }>;
  existingOptions?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    quantityRange?: { min: number; max: number; step: number };
  }>;
  plannedOptions?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
  }>;
  impactsCalculations?: string[];
  // Optional: question tier for filtering
  questionTier?: string;
}

export const carWashQuestionsComplete: Question[] = [
  // ============================================================================
  // SECTION 1: FACILITY & OPERATIONS (Q1–Q6)
  // ============================================================================
  {
    id: "facilityType",
    type: "buttons",
    section: "facility",
    title: "What type of car wash?",
    options: [
      {
        value: "express_tunnel",
        label: "Express Tunnel",
        description: "High-speed conveyor, 80–180 feet",
      },
      {
        value: "flex_service",
        label: "Flex / Full-Service",
        description: "Interior + exterior, larger building 10-15K sqft",
      },
      {
        value: "mini_tunnel",
        label: "Mini-Tunnel",
        description: "Shorter conveyor under 90 feet",
      },
      {
        value: "in_bay_automatic",
        label: "In-Bay Automatic (IBA)",
        description: "Vehicle stationary, machine moves over it",
      },
      {
        value: "self_serve",
        label: "Self-Serve Bay",
        description: "Customer wand wash",
      },
    ],
    smartDefault: "express_tunnel",
    validation: { required: true },
    impactsCalculations: ["peakDemand", "equipmentLoad"],
  },
  {
    id: "tunnelOrBayCount",
    type: "buttons",
    section: "facility",
    title: "Number of tunnels or bays?",
    options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
    ],
    smartDefault: "1",
    merlinTip: "Express tunnels typically have 1–2 lanes · Self-serve locations average 4–6 bays",
    validation: { required: true },
    impactsCalculations: ["capacity", "equipmentLoad"],
  },
  {
    id: "operatingHours",
    type: "buttons",
    section: "facility",
    title: "Operating hours per day?",
    options: [
      { value: "8", label: "8", description: "hrs/day" },
      { value: "10", label: "10", description: "hrs/day" },
      { value: "12", label: "12", description: "hrs/day" },
      { value: "14", label: "14", description: "hrs/day" },
      { value: "16", label: "16", description: "hrs/day" },
      { value: "20", label: "20", description: "hrs/day" },
      { value: "24", label: "24/7", description: "Always open" },
    ],
    smartDefault: "12",
    merlinTip: "Most car washes operate 10-14 hours per day",
    validation: { required: true },
    impactsCalculations: ["annualConsumption", "operatingCosts"],
  },
  {
    id: "daysPerWeek",
    type: "buttons",
    section: "facility",
    title: "Days open per week?",
    options: [
      { value: "5", label: "5", description: "days" },
      { value: "6", label: "6", description: "days" },
      { value: "7", label: "7", description: "days" },
    ],
    smartDefault: "7",
    validation: { required: true },
    impactsCalculations: ["annualConsumption", "operatingCosts"],
  },
  {
    id: "dailyVehicles",
    type: "slider",
    section: "facility",
    title: "Estimated daily vehicles washed?",
    range: { min: 0, max: 600, step: 10 },
    smartDefault: 200,
    unit: " vehicles/day",
    merlinTip: "Express tunnels: 200–400/day typical · PE-backed express chains push 400–600/day",
    validation: { required: true, min: 0, max: 600 },
    impactsCalculations: ["waterUsage", "revenueProjection"],
  },
  {
    id: "peakCarsPerHour",
    type: "slider",
    section: "facility",
    title: "Peak cars per hour?",
    subtitle: "Highest throughput during your busiest hour — drives BESS demand shaving size",
    helpText:
      "Two sites with 300 cars/day: 30/hr vs 50/hr peak produce a $12K/yr difference in demand charges and require 2.5× different BESS sizing",
    range: { min: 20, max: 80, step: 5 },
    smartDefault: 40,
    unit: " cars/hr",
    merlinTip: "Typical express tunnel: 30–50 cars/hr · High-volume express: 60–80 cars/hr",
    validation: { required: true, min: 20, max: 80 },
    impactsCalculations: ["peakDemand", "bessSize", "demandCharges"],
  },
  // ============================================================================
  // SECTION 2: EQUIPMENT — TUNNEL WALK (Q7–Q21)
  // Zone A — Entry
  // ============================================================================
  {
    id: "kioskControls",
    type: "buttons",
    section: "equipment",
    title: "Entry kiosk / control system?",
    subtitle: "Payment kiosk, swipe card reader, safety gates, sensors & cameras at lane entry",
    merlinTip:
      "Each entry lane typically has 1 kiosk plus safety gate, sensors, and cameras — all drawing continuous power",
    options: [
      { value: "no", label: "No Kiosks", description: "Cashier / attendant only" },
      { value: "yes", label: "Has Kiosks", description: "LPR + kiosk system" },
    ],
    smartDefault: "yes",
    validation: { required: true },
    impactsCalculations: ["controlsLoad"],
  },
  {
    id: "kioskCount",
    type: "buttons",
    section: "equipment",
    title: "How many entry kiosks?",
    subtitle: "Count each payment/swipe kiosk — safety gates and cameras are included per lane",
    merlinTip:
      "Most express tunnels run 1–2 kiosks (1 per lane) · High-volume sites may add a 3rd for a dedicated membership lane",
    options: [
      { value: "1", label: "1", description: "~1 kW" },
      { value: "2", label: "2", description: "~2 kW" },
      { value: "3", label: "3", description: "~3 kW" },
    ],
    smartDefault: "1",
    conditionalLogic: {
      dependsOn: "kioskControls",
      showIf: (val) => val === "yes",
    },
    validation: { required: false },
    impactsCalculations: ["controlsLoad"],
  },
  {
    id: "conveyorMotorSize",
    type: "type_then_quantity",
    section: "equipment",
    title: "Conveyor motor size?",
    subtitle: "Main drive motor(s) for tunnel conveyor",
    merlinTip:
      "Most express tunnel operators run 15–25 HP drives. Dual-belt = 2 motors = built-in backup.",
    options: [
      { value: "15", label: "15 HP", description: "11.2 kW" },
      { value: "20", label: "20 HP", description: "14.9 kW" },
      { value: "25", label: "25 HP", description: "18.7 kW" },
      { value: "30", label: "30 HP", description: "22.4 kW" },
    ],
    quantityOptions: [
      { value: "chain", label: "Chain Drive", description: "1 motor" },
      { value: "dual_belt", label: "Dual Belt", description: "2 motors (backup)" },
    ],
    smartDefault: "20",
    conditionalLogic: {
      dependsOn: "facilityType",
      showIf: (type) =>
        type === "express_tunnel" || type === "mini_tunnel" || type === "flex_service",
    },
    validation: { required: true },
    impactsCalculations: ["conveyorLoad"],
  },
  // Zone B — Wash
  {
    id: "highPressurePumps",
    type: "type_then_quantity",
    section: "equipment",
    title: "High-pressure wash pumps?",
    subtitle: "HP pump selection drives 20–30% of your total electric bill",
    merlinTip:
      "Pump HP drives 20–30% of your total electric bill · Common sizes: 3, 7.5, 10, and 15 HP",
    options: [
      { value: "3", label: "3 HP", description: "2.2 kW each" },
      { value: "5", label: "5 HP", description: "3.7 kW each" },
      { value: "7.5", label: "7.5 HP", description: "5.6 kW each" },
      { value: "10", label: "10 HP", description: "7.5 kW each" },
      { value: "15", label: "15 HP", description: "11.2 kW each" },
    ],
    quantityOptions: [
      { value: "2", label: "2 Pumps" },
      { value: "3", label: "3 Pumps" },
      { value: "4", label: "4 Pumps" },
      { value: "5", label: "5 Pumps" },
    ],
    smartDefault: "10",
    validation: { required: true },
    impactsCalculations: ["pumpLoad", "peakDemand"],
  },
  {
    id: "brushDriveType",
    type: "buttons",
    section: "equipment",
    title: "Brush motor drive type?",
    subtitle: "Electric gearmotors (1–2 HP each) vs hydraulic power pack (5–15 HP, 1–2 packs)",
    merlinTip:
      "Electric gearmotors: 1–2 HP each on all brushes · Hydraulic packs: 5–15 HP per pack driving multiple brushes",
    options: [
      { value: "electric", label: "Electric Gearmotors", description: "1–2 HP per brush" },
      { value: "hydraulic", label: "Hydraulic Power Pack", description: "5–15 HP per pack" },
    ],
    smartDefault: "electric",
    validation: { required: true },
    impactsCalculations: ["brushLoad", "mechanicalLoad"],
  },
  {
    id: "brushElectricHP",
    type: "buttons",
    section: "equipment",
    title: "HP per brush gearmotor?",
    subtitle: "Individual motor size — multiply by count below",
    options: [
      { value: "1", label: "1 HP", description: "0.75 kW each" },
      { value: "1.5", label: "1.5 HP", description: "1.1 kW each (industry standard)" },
      { value: "2", label: "2 HP", description: "1.5 kW each" },
    ],
    smartDefault: "1.5",
    conditionalLogic: {
      dependsOn: "brushDriveType",
      showIf: (type) => type === "electric",
    },
    validation: { required: false },
    impactsCalculations: ["brushLoad"],
  },
  {
    id: "brushElectricCount",
    type: "buttons",
    section: "equipment",
    title: "Number of brush motors?",
    subtitle: "Wrap-around, top, side brushes, tire shiners",
    options: [
      { value: "6", label: "6 Motors", description: "Small tunnel" },
      { value: "10", label: "10 Motors", description: "Standard" },
      { value: "14", label: "14 Motors", description: "Full featured" },
      { value: "18", label: "18 Motors", description: "High volume" },
    ],
    smartDefault: "10",
    conditionalLogic: {
      dependsOn: "brushDriveType",
      showIf: (type) => type === "electric",
    },
    validation: { required: false },
    impactsCalculations: ["brushLoad"],
  },
  {
    id: "brushHydraulicPackHP",
    type: "buttons",
    section: "equipment",
    title: "HP per hydraulic power pack?",
    subtitle: "One pack drives multiple brushes via hydraulic lines",
    options: [
      { value: "5", label: "5 HP", description: "3.7 kW" },
      { value: "10", label: "10 HP", description: "7.5 kW" },
      { value: "15", label: "15 HP", description: "11.2 kW" },
    ],
    smartDefault: "10",
    conditionalLogic: {
      dependsOn: "brushDriveType",
      showIf: (type) => type === "hydraulic",
    },
    validation: { required: false },
    impactsCalculations: ["brushLoad"],
  },
  {
    id: "brushHydraulicPackCount",
    type: "buttons",
    section: "equipment",
    title: "Number of hydraulic packs?",
    options: [
      { value: "1", label: "1 Pack" },
      { value: "2", label: "2 Packs" },
    ],
    smartDefault: "1",
    conditionalLogic: {
      dependsOn: "brushDriveType",
      showIf: (type) => type === "hydraulic",
    },
    validation: { required: false },
    impactsCalculations: ["brushLoad"],
  },
  {
    id: "reclaimSystem",
    type: "buttons",
    section: "equipment",
    title: "Water reclamation system?",
    subtitle: "Reclaim adds pump load but reduces water costs significantly",
    merlinTip:
      "Partial reclaim adds ~7 kW pump load · Full+VFD adds ~11 kW but significantly reduces water costs",
    options: [
      { value: "none", label: "No Reclaim", description: "Fresh water only" },
      { value: "partial", label: "Partial Reclaim", description: "30–60% recycled, ~7 kW" },
      { value: "full_vfd", label: "Full + VFD", description: "70–85% recycled, ~11 kW" },
    ],
    smartDefault: "partial",
    validation: { required: true },
    impactsCalculations: ["waterUsage", "pumpLoad"],
  },
  {
    id: "roSystem",
    type: "buttons",
    section: "equipment",
    title: "RO (Reverse Osmosis) system?",
    subtitle: "For spot-free rinse water — reverse osmosis produces mineral-free final rinse",
    options: [
      { value: "yes", label: "Yes", description: "3–5 kW pump" },
      { value: "no", label: "No", description: "Tap water rinse" },
    ],
    smartDefault: "yes",
    conditionalLogic: {
      dependsOn: "reclaimSystem",
      showIf: (val) => val !== "none",
    },
    validation: { required: false },
    impactsCalculations: ["pumpLoad"],
  },
  // Zone C — Dry (PRIMARY BESS TARGET: 50–60% of total draw)
  {
    id: "blowerMotorSize",
    type: "type_then_quantity",
    section: "equipment",
    title: "Blower / dryer motor size?",
    subtitle: "Dryer zone is 50–60% of total electric draw — largest BESS target",
    merlinTip:
      "Common configurations: 8×15 HP (short tunnel) · 10×10 HP (standard express) · 16×10 HP (high-volume) · total dryer kW = count × HP × 0.746",
    options: [
      { value: "7.5", label: "7.5 HP", description: "5.6 kW each" },
      { value: "10", label: "10 HP", description: "7.5 kW each (standard)" },
      { value: "15", label: "15 HP", description: "11.2 kW each (high-power)" },
    ],
    quantityOptions: [
      { value: "8", label: "8 Producers", description: "Short tunnel / mini" },
      { value: "10", label: "10 Producers", description: "Standard express" },
      { value: "12", label: "12 Producers", description: "Full express" },
      { value: "14", label: "14 Producers", description: "High volume" },
      { value: "16", label: "16 Producers", description: "Max / high-volume" },
    ],
    smartDefault: "10",
    validation: { required: true },
    impactsCalculations: ["dryerLoad", "peakDemand"],
  },
  {
    id: "blowerCount",
    type: "buttons",
    section: "equipment",
    title: "How many blowers / dryer producers?",
    subtitle: "Blowers are ~50% of total energy draw — count drives BESS sizing",
    merlinTip:
      "Short tunnel: 6–8 producers · Standard express: 10–12 producers · High-volume: 14–16 producers · Total kW = count × HP × 0.746",
    options: [
      { value: "6", label: "6", description: "Mini / short tunnel" },
      { value: "8", label: "8", description: "Short tunnel" },
      { value: "10", label: "10", description: "Standard express" },
      { value: "12", label: "12", description: "Full express" },
      { value: "14", label: "14", description: "High volume" },
      { value: "16", label: "16", description: "Max / high-volume express" },
    ],
    smartDefault: "10",
    validation: { required: true },
    impactsCalculations: ["dryerLoad", "peakDemand"],
  },
  {
    id: "blowerHeated",
    type: "buttons",
    section: "equipment",
    title: "Are the blowers / dryers heated?",
    subtitle:
      "Heated blowers add significant electric load — this directly impacts BESS sizing and annual savings",
    merlinTip:
      "Heated dryers are common in cold climates to prevent water freeze on vehicles · Electric heat elements add 3–8 kW per producer to the load",
    options: [
      { value: "no", label: "No", description: "Unheated — ambient air only" },
      { value: "yes", label: "Yes", description: "Heated blowers" },
    ],
    smartDefault: "no",
    validation: { required: true },
    impactsCalculations: ["dryerLoad", "peakDemand"],
  },
  {
    id: "blowerHeatSource",
    type: "buttons",
    section: "equipment",
    title: "Blower heat source?",
    subtitle: "Electric resistance adds directly to peak demand · Gas-fired adds no electric load",
    merlinTip:
      "Electric heated dryers: add 3–8 kW per producer to peak electric demand — highest BESS impact · Gas-fired: 0 kW electric, but still has ignition controls",
    options: [
      {
        value: "electric",
        label: "Electric",
        description: "3–8 kW per blower added to electric peak",
      },
      { value: "gas", label: "Natural Gas", description: "0 kW electric — gas burner" },
      { value: "mixed", label: "Mixed", description: "Some electric, some gas" },
    ],
    smartDefault: "electric",
    conditionalLogic: {
      dependsOn: "blowerHeated",
      showIf: (val) => val === "yes",
    },
    validation: { required: false },
    impactsCalculations: ["dryerLoad", "heatingLoad", "peakDemand"],
  },
  // Zone D — Exit
  {
    id: "vacuumStalls",
    type: "increment_box",
    section: "equipment",
    title: "Free-standing vacuum stalls?",
    subtitle: "Free-standing self-service vacuum islands at exit",
    range: { min: 0, max: 20, step: 1 },
    smartDefault: 10,
    unit: " stalls",
    validation: { required: true, min: 0, max: 20 },
    impactsCalculations: ["vacuumLoad", "peakDemand"],
  },
  {
    id: "vacuumType",
    type: "buttons",
    section: "equipment",
    title: "Vacuum system type?",
    subtitle: "Central systems vs individual stall units",
    merlinTip:
      "Central systems: 1–3 large motors (10–25 HP each) · Individual stalls: 2–3×1.6 HP motors per stall",
    options: [
      {
        value: "central",
        label: "Central System",
        description: "1–3 large motors, 10–25 HP each",
      },
      {
        value: "individual",
        label: "Individual Stalls",
        description: "3×1.6 HP per stall (auto-calc from stall count)",
      },
    ],
    smartDefault: "central",
    conditionalLogic: {
      dependsOn: "vacuumStalls",
      showIf: (val) => (typeof val === "number" ? val > 0 : Number(val) > 0),
    },
    validation: { required: false },
    impactsCalculations: ["vacuumLoad"],
  },
  {
    id: "vacuumCentralHP",
    type: "buttons",
    section: "equipment",
    title: "HP per central vacuum motor?",
    subtitle: "Typical range: 10–25 HP per central vacuum motor",
    options: [
      { value: "10", label: "10 HP", description: "7.5 kW" },
      { value: "15", label: "15 HP", description: "11.2 kW" },
      { value: "20", label: "20 HP", description: "14.9 kW" },
      { value: "25", label: "25 HP", description: "18.7 kW" },
    ],
    smartDefault: "25",
    conditionalLogic: {
      dependsOn: "vacuumType",
      showIf: (val) => val === "central",
    },
    validation: { required: false },
    impactsCalculations: ["vacuumLoad"],
  },
  {
    id: "vacuumCentralMotorCount",
    type: "buttons",
    section: "equipment",
    title: "Number of central vacuum motors?",
    options: [
      { value: "1", label: "1 Motor" },
      { value: "2", label: "2 Motors", description: "Dual system" },
      { value: "3", label: "3 Motors", description: "High volume" },
    ],
    smartDefault: "1",
    conditionalLogic: {
      dependsOn: "vacuumType",
      showIf: (val) => val === "central",
    },
    validation: { required: false },
    impactsCalculations: ["vacuumLoad"],
  },
  {
    id: "airCompressorSize",
    type: "type_then_quantity",
    section: "equipment",
    title: "Air compressor size?",
    subtitle: "For soap foaming, chemical dosing, pneumatic equipment",
    merlinTip:
      "Standard: 10 HP / 120-gal tank · High-capacity sites: 15 HP · Duty cycle ~40% so actual average draw is lower than peak",
    options: [
      { value: "7.5", label: "7.5 HP", description: "5.6 kW" },
      { value: "10", label: "10 HP", description: "7.5 kW (standard)" },
      { value: "15", label: "15 HP", description: "11.2 kW" },
    ],
    quantityOptions: [
      { value: "1", label: "1 Unit" },
      { value: "2", label: "2 Units" },
    ],
    smartDefault: "10",
    validation: { required: true },
    impactsCalculations: ["compressorLoad"],
  },
  {
    id: "evChargingExisting",
    type: "type_then_quantity",
    section: "equipment",
    title: "EV charging infrastructure?",
    subtitle: "Current chargers on site — baseline for future DCFC planning",
    options: [
      { value: "none", label: "None", description: "0 kW" },
      { value: "l2", label: "Level 2", description: "7.2 kW each" },
      { value: "dcfc", label: "DC Fast Charger", description: "50 kW each" },
    ],
    quantityOptions: [
      { value: "1", label: "1 Charger" },
      { value: "2", label: "2 Chargers" },
      { value: "3", label: "3 Chargers" },
      { value: "4", label: "4 Chargers" },
    ],
    smartDefault: "none",
    validation: { required: false },
    impactsCalculations: ["evLoad", "futureExpansion"],
  },
  // Zone E — Building (always-on loads)
  {
    id: "lightingType",
    type: "buttons",
    section: "equipment",
    title: "Tunnel lighting type?",
    subtitle: "Interior wash tunnel illumination",
    merlinTip:
      "LED is now standard for new builds — lower wattage and longer life · Light-show installations add ~3 kW over basic LED",
    options: [
      { value: "led", label: "LED", description: "5 kW (most efficient)" },
      { value: "mixed", label: "LED + Effects", description: "8 kW" },
      { value: "fluorescent", label: "Fluorescent / HID", description: "12 kW" },
    ],
    smartDefault: "led",
    validation: { required: true },
    impactsCalculations: ["lightingLoad"],
  },
  {
    id: "exteriorSignage",
    type: "type_then_quantity",
    section: "equipment",
    title: "Exterior signage?",
    subtitle: "Illuminated brand signs and pricing displays",
    merlinTip:
      "Large illuminated monument signs: 8–12 kW each · Standard channel-letter LED: 3–5 kW each",
    options: [
      { value: "standard", label: "Standard LED", description: "5 kW each" },
      { value: "large_led", label: "Large / Signature LED", description: "10 kW each" },
    ],
    quantityOptions: [
      { value: "1", label: "1 Sign" },
      { value: "2", label: "2 Signs" },
      { value: "3", label: "3 Signs" },
    ],
    smartDefault: "standard",
    validation: { required: true },
    impactsCalculations: ["lightingLoad"],
  },
  {
    id: "hvacBuilding",
    type: "buttons",
    section: "equipment",
    title: "Building HVAC system?",
    subtitle: "Customer lounge, employee area, chemical room conditioning",
    helpText:
      "Gas furnace = 0 kW on electric meter · Electric heat pump hits the meter directly at 10–20 kW",
    options: [
      { value: "none", label: "None", description: "Unheated / open" },
      { value: "gas_furnace", label: "Gas Furnace", description: "0 kW electric" },
      { value: "electric_heat_pump", label: "Electric Heat Pump", description: "10–20 kW" },
    ],
    smartDefault: "none",
    validation: { required: true },
    impactsCalculations: ["hvacLoad"],
  },
  {
    id: "waterHeaterType",
    type: "buttons",
    section: "equipment",
    title: "Water heating system?",
    subtitle: "Electric water heaters add 30–50 kW continuous load",
    merlinTip:
      "~67% of US car washes use natural gas for water heating (0 kW on electric meter) · Electric tankless adds 25–50 kW continuous to peak demand",
    options: [
      { value: "gas", label: "Natural Gas", description: "0 kW electric" },
      { value: "electric", label: "Electric", description: "30–50 kW" },
      { value: "tankless_electric", label: "Tankless Electric", description: "25–40 kW" },
      { value: "heat_pump", label: "Heat Pump", description: "10–15 kW" },
    ],
    smartDefault: "gas",
    validation: { required: true },
    impactsCalculations: ["peakDemand", "heatingLoad"],
  },
  // ============================================================================
  // SECTION 3: BILLING & UTILITY (Q23–Q26)
  // Actual bill data overrides calc estimates — most impactful for BESS ROI accuracy
  // Note: demand charge applicability + rate are now auto-detected from your ZIP/utility.
  //       The questions below let you confirm or override our estimate.
  // ============================================================================
  {
    id: "peakDemandKw",
    type: "slider",
    section: "billing",
    title: "What's your highest peak demand on a recent bill?",
    subtitle:
      "Found under 'Peak Demand' or 'Billing Demand' — typically the highest kW in the last 12 months. We'll use it to match the exact tariff tier for your utility.",
    helpText:
      "This single number drives 60–80% of BESS savings. Even an approximate figure gives us a far more accurate quote than our equipment estimate alone.",
    range: { min: 0, max: 500, step: 5 },
    smartDefault: 0,
    unit: " kW",
    merlinTip: "A typical express tunnel runs 150–300 kW peak · Flex/full-service: 200–400 kW",
    validation: { required: false, min: 0, max: 500 },
    impactsCalculations: ["bessROI", "bessSize", "demandSavings"],
  },
  {
    id: "demandChargeRate",
    type: "buttons",
    section: "billing",
    title: "Demand charge rate?",
    subtitle:
      "We've pre-filled your utility's rate below — confirm or override if your bill shows a different number",
    options: [
      { value: "10", label: "$10", description: "/kW-mo" },
      { value: "15", label: "$15", description: "/kW-mo" },
      { value: "20", label: "$20", description: "/kW-mo" },
      { value: "25", label: "$25", description: "/kW-mo" },
      { value: "30", label: "$30", description: "/kW-mo" },
      { value: "unsure", label: "Use Auto", description: "Keep detected rate" },
    ],
    smartDefault: "unsure",
    merlinTip: "U.S. commercial average: $15–20/kW-mo · Southwest utilities can hit $25–35",
    validation: { required: false },
    impactsCalculations: ["bessROI", "demandSavings"],
  },
  {
    id: "monthlyKwh",
    type: "slider",
    section: "billing",
    title: "Average monthly electricity usage?",
    subtitle:
      "From your utility bill — used to cross-check our load estimate and size the solar system",
    range: { min: 0, max: 150000, step: 1000 },
    smartDefault: 0,
    unit: " kWh/mo",
    merlinTip: "Typical express tunnel: 30K–60K kWh/mo · Flex/full-service: 50K–100K kWh/mo",
    validation: { required: false, min: 0, max: 150000 },
    impactsCalculations: ["solarOffset", "annualEnergyCost"],
  },
  // ============================================================================
  // SECTION 4: SOLAR & SITE (Q27–Q30, all industries)
  // ============================================================================
  {
    id: "totalSiteArea",
    type: "slider",
    section: "solar",
    title: "Total site area?",
    subtitle:
      "Total property including tunnel, vacuum islands, and drive lanes. Typical express tunnel: 1.0–1.5 acres (43K–65K sq ft).",
    range: { min: 0, max: 100000, step: 1000 },
    smartDefault: 50000,
    unit: " sq ft",
    validation: { required: true, min: 0, max: 100000 },
    impactsCalculations: ["siteLayout"],
  },
  {
    id: "roofArea",
    type: "slider",
    section: "solar",
    title: "Available roof area for solar panels?",
    subtitle: "Building roof space only — not the full property",
    range: { min: 0, max: 25000, step: 500 },
    smartDefault: 6500,
    unit: " sq ft",
    helpText:
      "Express tunnel: 4,500–8,000 sq ft. Flex/full-service: 10,000–15,000 sq ft. Includes building, mechanical room, and customer lounge.",
    validation: { required: false, min: 0, max: 25000 },
    impactsCalculations: ["roofSolar", "solarCapacity"],
  },
  {
    id: "roofType",
    type: "buttons",
    section: "solar",
    title: "What is your building's roof construction?",
    subtitle: "Roof type determines how much of the roof area can hold solar panels",
    options: [
      {
        value: "opaque",
        label: "Metal / Concrete",
        description: "Standard opaque roof — best solar economics (70% usable)",
      },
      {
        value: "mixed",
        label: "Mixed (Some Skylights)",
        description: "Partial skylights or polycarbonate strips (55% usable)",
      },
      {
        value: "polycarbonate",
        label: "Heavy Polycarbonate",
        description: "Tommy's / Quick Quack daylight-roof style (40% usable)",
      },
    ],
    smartDefault: "opaque",
    validation: { required: false },
    impactsCalculations: ["roofSolar", "solarCapacity"],
  },
  {
    id: "canopyInterest",
    type: "buttons",
    section: "solar",
    title: "Interested in solar carports over vacuum areas?",
    subtitle: "Solar carports provide customer shade while generating power",
    options: [
      {
        value: "yes",
        label: "Yes, Interested",
        description: "Provides shade + solar",
      },
      {
        value: "learn_more",
        label: "Tell Me More",
        description: "Want to learn benefits",
      },
      {
        value: "no",
        label: "No Thanks",
        description: "Roof solar only",
      },
    ],
    smartDefault: "learn_more",
    validation: { required: true },
    impactsCalculations: ["carportSolar", "solarCapacity"],
  },
  {
    id: "parkingSpots",
    type: "slider",
    section: "solar",
    title: "Total parking spots?",
    subtitle: "Parking lot size sets DCFC ceiling — up to 20% of spots can charge simultaneously",
    range: { min: 0, max: 100, step: 5 },
    smartDefault: 20,
    unit: " spots",
    validation: { required: false, min: 0, max: 100 },
    impactsCalculations: ["evFuture", "dcfcCeiling"],
  },
];

// Export section metadata
export const carWashSections = [
  {
    id: "facility",
    title: "Facility Details",
    description: "Basic information about your car wash",
    icon: "🏢",
    questions: carWashQuestionsComplete.filter((q) => q.section === "facility"),
  },
  {
    id: "operations",
    title: "Operations",
    description: "Operating hours and throughput",
    icon: "⏰",
    questions: carWashQuestionsComplete.filter((q) => q.section === "operations"),
  },
  {
    id: "equipment",
    title: "Equipment",
    description: "Machinery and systems",
    icon: "⚙️",
    questions: carWashQuestionsComplete.filter((q) => q.section === "equipment"),
  },
  {
    id: "billing",
    title: "Utility & Billing",
    description: "Actual bill data supercharges ROI accuracy",
    icon: "⚡",
    questions: carWashQuestionsComplete.filter((q) => q.section === "billing"),
  },
  {
    id: "solar",
    title: "Solar Potential",
    description: "Site characteristics for solar",
    icon: "☀️",
    questions: carWashQuestionsComplete.filter((q) => q.section === "solar"),
  },
];
