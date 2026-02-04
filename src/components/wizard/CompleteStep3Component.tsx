/**
 * Complete Step 3 Component
 *
 * Main orchestrator for the questionnaire
 * Manages state, navigation, progress tracking
 *
 * ✅ FIXED Jan 2025: Now loads questions dynamically from database
 * based on selected industry (state.industry)
 * 
 * ⚠️  SSOT DOCTRINE (Jan 31, 2026):
 * BUSINESS_SIZE_PREFILLS is a LEGACY divergent source and is now GATED.
 * Canonical defaults come ONLY from:
 * 1. template.defaults (contract)
 * 2. question.defaultValue (legacy fallback)
 * 3. locationIntel (ground truth)
 * 
 * Set ENABLE_LEGACY_PREFILLS = true only for backward compat debugging.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CompleteQuestionRenderer } from "./CompleteQuestionRenderer";
import { IndustryOpportunityPanel } from "./IndustryOpportunityPanel";
import { useCaseService } from "@/services/useCaseService";
import {
  carWashQuestionsComplete,
  carWashSections,
  type Question,
} from "@/data/carwash-questions-complete.config";
import { Loader2 } from "lucide-react";

// ============================================================================
// FEATURE FLAG: Legacy prefills (DEPRECATED - use template.defaults instead)
// ============================================================================
const ENABLE_LEGACY_PREFILLS = false; // Set to true only for debugging

// Industry header images
import hotelImg from "@/assets/images/hotel_motel_holidayinn_1.jpg";
import carWashImg from "@/assets/images/Car_Wash_PitStop.jpg";
import evChargingImg from "@/assets/images/EV charger_2.jpg";
import manufacturingImg from "@/assets/images/manufacturing_1.jpg";
import dataCenterImg from "@/assets/images/data-center-1.jpg";
import hospitalImg from "@/assets/images/hospital_1.jpg";
import retailImg from "@/assets/images/retail_2.jpg";
import officeImg from "@/assets/images/office_building1.jpg";
import collegeImg from "@/assets/images/college_1.jpg";
import warehouseImg from "@/assets/images/logistics_1.jpg";
import restaurantImg from "@/assets/images/restaurant_1.jpg";
import agricultureImg from "@/assets/images/agriculture_1.jpg";
import truckStopImg from "@/assets/images/truck_stop.png";
import airportImg from "@/assets/images/airport_11.jpeg";
import shoppingCenterImg from "@/assets/images/shopping_center.jpg";
import coldStorageImg from "@/assets/images/cold_storage.jpg";
import apartmentImg from "@/assets/images/apartment_building.jpg";
import residentialImg from "@/assets/images/residential.jpg";
import indoorFarmImg from "@/assets/images/indoor_farm1.jpg";
import casinoImg from "@/assets/images/casino_gaming1.jpg";

// Map industry slugs to header images
const INDUSTRY_IMAGES: Record<string, string> = {
  hotel: hotelImg,
  hotel_hospitality: hotelImg,
  car_wash: carWashImg,
  "car-wash": carWashImg,
  ev_charging: evChargingImg,
  "ev-charging": evChargingImg,
  manufacturing: manufacturingImg,
  data_center: dataCenterImg,
  "data-center": dataCenterImg,
  hospital: hospitalImg,
  retail: retailImg,
  office: officeImg,
  college: collegeImg,
  warehouse: warehouseImg,
  restaurant: restaurantImg,
  agriculture: agricultureImg,
  agricultural: agricultureImg,
  heavy_duty_truck_stop: truckStopImg,
  truck_stop: truckStopImg,
  airport: airportImg,
  "shopping-center": shoppingCenterImg,
  shopping_center: shoppingCenterImg,
  "cold-storage": coldStorageImg,
  cold_storage: coldStorageImg,
  apartment: apartmentImg,
  residential: residentialImg,
  "indoor-farm": indoorFarmImg,
  indoor_farm: indoorFarmImg,
  casino: casinoImg,
  "casino-gaming": casinoImg,
};

// ============================================================================
// BUSINESS SIZE → PRE-FILL MAPPING (LEGACY - GATED BY FEATURE FLAG)
// ⚠️  DEPRECATED: Use template.defaults from SSOT instead
// Maps the businessSizeTier from Step 2 to pre-fill values for Step 3 questions
// This prevents asking redundant questions about facility size
// ============================================================================
const BUSINESS_SIZE_PREFILLS: Record<string, Record<string, Record<string, unknown>>> = {
  // Data Center: Maps tier to facilityType and powerCapacity
  "data-center": {
    small: {
      facilityType: "edge",
      powerCapacity: "0.5",
      dataCenterType: "edge",
      totalITLoad: "500",
    },
    medium: {
      facilityType: "enterprise",
      powerCapacity: "5",
      dataCenterType: "enterprise",
      totalITLoad: "5000",
    },
    large: {
      facilityType: "hyperscale",
      powerCapacity: "25",
      dataCenterType: "hyperscale",
      totalITLoad: "25000",
    },
    enterprise: {
      facilityType: "hyperscale",
      powerCapacity: "75",
      dataCenterType: "campus",
      totalITLoad: "75000",
    },
  },
  data_center: {
    small: {
      facilityType: "edge",
      powerCapacity: "0.5",
      dataCenterType: "edge",
      totalITLoad: "500",
    },
    medium: {
      facilityType: "enterprise",
      powerCapacity: "5",
      dataCenterType: "enterprise",
      totalITLoad: "5000",
    },
    large: {
      facilityType: "hyperscale",
      powerCapacity: "25",
      dataCenterType: "hyperscale",
      totalITLoad: "25000",
    },
    enterprise: {
      facilityType: "hyperscale",
      powerCapacity: "75",
      dataCenterType: "campus",
      totalITLoad: "75000",
    },
  },
  // Hotel: Maps tier to roomCount and hotelClass
  hotel: {
    small: { roomCount: "40", hotelClass: "budget", numberOfRooms: "40" },
    medium: { roomCount: "100", hotelClass: "midscale", numberOfRooms: "100" },
    large: { roomCount: "300", hotelClass: "upscale", numberOfRooms: "300" },
    enterprise: { roomCount: "500", hotelClass: "luxury", numberOfRooms: "500" },
  },
  // Car Wash: Maps tier to bayCount
  "car-wash": {
    small: { bayCount: "2", numberOfBays: "2", washType: "self_service" },
    medium: { bayCount: "5", numberOfBays: "5", washType: "automatic" },
    large: { bayCount: "10", numberOfBays: "10", washType: "tunnel" },
    enterprise: { bayCount: "20", numberOfBays: "20", washType: "full_service" },
  },
  car_wash: {
    small: { bayCount: "2", numberOfBays: "2", washType: "self_service" },
    medium: { bayCount: "5", numberOfBays: "5", washType: "automatic" },
    large: { bayCount: "10", numberOfBays: "10", washType: "tunnel" },
    enterprise: { bayCount: "20", numberOfBays: "20", washType: "full_service" },
  },
  // EV Charging: Maps tier to charger counts
  "ev-charging": {
    small: { totalChargers: "4", level2Chargers: "2", dcfcChargers: "2", stationSize: "small" },
    medium: { totalChargers: "12", level2Chargers: "6", dcfcChargers: "6", stationSize: "medium" },
    large: { totalChargers: "30", level2Chargers: "12", dcfcChargers: "18", stationSize: "large" },
    enterprise: {
      totalChargers: "60",
      level2Chargers: "20",
      dcfcChargers: "40",
      stationSize: "hub",
    },
  },
  ev_charging: {
    small: { totalChargers: "4", level2Chargers: "2", dcfcChargers: "2", stationSize: "small" },
    medium: { totalChargers: "12", level2Chargers: "6", dcfcChargers: "6", stationSize: "medium" },
    large: { totalChargers: "30", level2Chargers: "12", dcfcChargers: "18", stationSize: "large" },
    enterprise: {
      totalChargers: "60",
      level2Chargers: "20",
      dcfcChargers: "40",
      stationSize: "hub",
    },
  },
  // Hospital: Maps tier to bedCount
  hospital: {
    small: { bedCount: "30", numberOfBeds: "30", facilityType: "clinic" },
    medium: { bedCount: "125", numberOfBeds: "125", facilityType: "community" },
    large: { bedCount: "350", numberOfBeds: "350", facilityType: "regional" },
    enterprise: { bedCount: "600", numberOfBeds: "600", facilityType: "medicalCenter" },
  },
  // Manufacturing: Maps tier to square footage
  manufacturing: {
    small: { squareFootage: "15000", facilitySize: "15000" },
    medium: { squareFootage: "60000", facilitySize: "60000" },
    large: { squareFootage: "250000", facilitySize: "250000" },
    enterprise: { squareFootage: "750000", facilitySize: "750000" },
  },
  // Office: Maps tier to square footage
  office: {
    small: { squareFootage: "15000", buildingSize: "15000" },
    medium: { squareFootage: "50000", buildingSize: "50000" },
    large: { squareFootage: "200000", buildingSize: "200000" },
    enterprise: { squareFootage: "750000", buildingSize: "750000" },
  },
  // Warehouse: Maps tier to square footage
  warehouse: {
    small: { squareFootage: "30000", warehouseSize: "30000" },
    medium: { squareFootage: "150000", warehouseSize: "150000" },
    large: { squareFootage: "500000", warehouseSize: "500000" },
    enterprise: { squareFootage: "1500000", warehouseSize: "1500000" },
  },
  // Retail: Maps tier to square footage
  retail: {
    small: { squareFootage: "5000", storeSize: "5000" },
    medium: { squareFootage: "25000", storeSize: "25000" },
    large: { squareFootage: "100000", storeSize: "100000" },
    enterprise: { squareFootage: "300000", storeSize: "300000" },
  },
  // College: Maps tier to student count
  college: {
    small: { studentCount: "3000", numberOfStudents: "3000" },
    medium: { studentCount: "10000", numberOfStudents: "10000" },
    large: { studentCount: "25000", numberOfStudents: "25000" },
    enterprise: { studentCount: "50000", numberOfStudents: "50000" },
  },
  // Restaurant: Maps tier to square footage and seating
  restaurant: {
    small: { squareFootage: "1500", seatingCapacity: "30", restaurantType: "quick_service" },
    medium: { squareFootage: "3500", seatingCapacity: "80", restaurantType: "full_service" },
    large: { squareFootage: "7000", seatingCapacity: "150", restaurantType: "large" },
    enterprise: {
      squareFootage: "12000",
      seatingCapacity: "250",
      restaurantType: "multi_location",
    },
  },
  // Cold Storage: Maps tier to square footage and temperature
  "cold-storage": {
    small: { squareFootage: "10000", warehouseSize: "10000", coldStorageType: "refrigerated" },
    medium: { squareFootage: "50000", warehouseSize: "50000", coldStorageType: "frozen" },
    large: { squareFootage: "150000", warehouseSize: "150000", coldStorageType: "mixed" },
    enterprise: {
      squareFootage: "400000",
      warehouseSize: "400000",
      coldStorageType: "distribution",
    },
  },
  cold_storage: {
    small: { squareFootage: "10000", warehouseSize: "10000", coldStorageType: "refrigerated" },
    medium: { squareFootage: "50000", warehouseSize: "50000", coldStorageType: "frozen" },
    large: { squareFootage: "150000", warehouseSize: "150000", coldStorageType: "mixed" },
    enterprise: {
      squareFootage: "400000",
      warehouseSize: "400000",
      coldStorageType: "distribution",
    },
  },
  // Apartment: Maps tier to unit count
  apartment: {
    small: { unitCount: "20", numberOfUnits: "20" },
    medium: { unitCount: "75", numberOfUnits: "75" },
    large: { unitCount: "200", numberOfUnits: "200" },
    enterprise: { unitCount: "500", numberOfUnits: "500" },
  },
};

// Transform database question to component format
function transformDatabaseQuestion(
  dbQuestion: Record<string, unknown>,
  index: number
): Question & { questionTier?: string } {
  // Map database options to component format
  let options: { value: string; label: string; description?: string; icon?: string }[] = [];

  // Get database options - can be array (select options) or object (slider/range config)
  const dbOptions = dbQuestion.options as Record<string, unknown> | unknown[] | null;

  // Try different field names for select/multiselect options (DB schema variations)
  const rawOptions = (dbQuestion.select_options ||
    (Array.isArray(dbOptions) ? dbOptions : null) ||
    []) as unknown[];

  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    options = rawOptions.map((opt: unknown) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      const optObj = opt as Record<string, unknown>;
      return {
        value: String(optObj.value || optObj.id || opt),
        label: String(optObj.label || optObj.text || optObj.value || opt),
        description: optObj.description as string | undefined,
        icon: optObj.icon as string | undefined,
      };
    });
  }

  // Map section to valid values (check both 'section' and 'section_name' from DB)
  const sectionRaw = (dbQuestion.section_name || dbQuestion.section || "facility") as string;
  const sectionLower = sectionRaw.toLowerCase();
  
  // ✅ Bug #2 Fix (Jan 23, 2026): Normalize section names to match all sectionConfig keys
  // Normalize section names: "Facility Basics" → "facility", "Energy Profile" → "energy", etc.
  let sectionNormalized: string;
  if (sectionLower.includes("facility") || sectionLower.includes("infrastructure") || sectionLower.includes("basic")) {
    sectionNormalized = "facility";
  } else if (sectionLower.includes("operation")) {
    sectionNormalized = "operations";
  } else if (sectionLower.includes("equipment") || sectionLower.includes("charger")) {
    sectionNormalized = "equipment";
  } else if (sectionLower.includes("solar") || sectionLower.includes("renewable")) {
    sectionNormalized = "solar";
  } else if (sectionLower.includes("energy") || sectionLower.includes("power") || sectionLower.includes("utility")) {
    sectionNormalized = "energy";
  } else if (sectionLower.includes("goal")) {
    sectionNormalized = "goals";
  } else {
    sectionNormalized = "general"; // Default unknown sections to general
  }
  
  const validSections = ["facility", "operations", "equipment", "solar", "energy", "goals", "general"] as const;
  const section: (typeof validSections)[number] = validSections.includes(
    sectionNormalized as (typeof validSections)[number]
  )
    ? (sectionNormalized as (typeof validSections)[number])
    : "facility";

  // ============================================================================
  // CRITICAL FIX: Extract slider/number range from options JSON
  // Database stores: options = '{"min":0,"max":1000,"step":10,"suffix":" kW"}'
  // ============================================================================
  const optionsObj =
    !Array.isArray(dbOptions) && dbOptions && typeof dbOptions === "object"
      ? (dbOptions as Record<string, unknown>)
      : null;

  // Extract range config for sliders and number inputs
  const rangeMin =
    (optionsObj?.min as number | undefined) ?? (dbQuestion.min_value as number | undefined) ?? 0;
  const rangeMax =
    (optionsObj?.max as number | undefined) ?? (dbQuestion.max_value as number | undefined) ?? 1000;
  const rangeStep = (optionsObj?.step as number | undefined) ?? 1;
  const rangeSuffix = (optionsObj?.suffix as string | undefined) ?? "";

  // Extract range_buttons config from options if present
  const rangeConfig =
    optionsObj && "ranges" in optionsObj
      ? {
          ranges:
            (optionsObj.ranges as Array<{ label: string; min: number; max: number | null }>) || [],
          suffix: (optionsObj.suffix as string) || "",
        }
      : undefined;

  // ============================================================================
  // CRITICAL FIX: Use field_name as ID (not question_key)
  // Calculations look up values by field_name (bedCount, squareFeet, etc.)
  // ============================================================================
  const fieldName = (dbQuestion.field_name || dbQuestion.question_key || `q_${index}`) as string;

  return {
    id: fieldName, // CRITICAL: Use field_name so calculations can find the value
    type: mapQuestionType((dbQuestion.input_type || dbQuestion.question_type || "text") as string, fieldName),
    section,
    title: (dbQuestion.question_text || dbQuestion.label || "Question") as string,
    subtitle:
      (dbQuestion.help_text as string | undefined) ||
      (dbQuestion.description as string | undefined),
    options,
    validation: {
      required: (dbQuestion.is_required as boolean) ?? true,
    },
    smartDefault: dbQuestion.default_value,
    merlinTip: dbQuestion.merlin_tip as string | undefined,
    // Add question tier for filtering (default to 'essential' so questions without tier always show)
    questionTier: (dbQuestion.question_tier || "essential") as string,
    // CRITICAL FIX: Extract range from options JSON, not just min_value/max_value columns
    range: {
      min: rangeMin,
      max: rangeMax,
      step: rangeStep,
    },
    // Store field name for smart input selection
    fieldName: fieldName,
    // Store suffix from options
    suffix: rangeSuffix,
    // NEW: Range buttons config from database
    rangeConfig,
  };
}

// Map database question types to component types
function mapQuestionType(dbType: string, fieldName?: string): Question["type"] {
  const typeMap: Record<string, Question["type"]> = {
    // Selection types
    select: "buttons",
    dropdown: "buttons",
    radio: "buttons",
    buttons: "buttons",

    // Multi-selection types
    checkbox: "multiselect",
    "multi-select": "multiselect",
    multiselect: "multiselect",

    // Numeric types
    number: "number_input",
    number_input: "number_input",
    slider: "slider",
    range_buttons: "range_buttons",

    // Boolean types
    toggle: "toggle",
    boolean: "toggle",
    yes_no: "toggle",

    // Text types - handled specially below
    text_input: "number_input",
    freeform: "number_input",
  };

  // ✅ Bug #1 Fix (Jan 23, 2026): Handle 'text' type intelligently
  // Only treat as numeric if field name contains numeric hints
  if (dbType === "text" || dbType === "text_input" || dbType === "freeform") {
    const numericHints = ['kw', 'kwh', 'sqft', 'sq_ft', 'count', 'rate', 'cost', 'spend', 
      'size', 'capacity', 'load', 'power', 'voltage', 'amp', 'watt', 'number', 'total',
      'bay', 'room', 'bed', 'unit', 'charger', 'motor', 'throughput', 'duration', 'hours'];
    const fieldLower = (fieldName || '').toLowerCase();
    const isNumeric = numericHints.some(hint => fieldLower.includes(hint));
    
    if (isNumeric) {
      return "number_input";
    }
    // For actual text fields (names, notes, etc.), use buttons as fallback
    // TODO: Add proper text_input renderer if needed
    return "buttons";
  }

  const mappedType = typeMap[dbType];
  if (!mappedType) {
    console.warn(`⚠️ Unknown question type: "${dbType}" - defaulting to 'buttons'`);
  }
  return mappedType || "buttons";
}

// Create sections from questions
function createSectionsFromQuestions(questions: Question[]) {
  const sectionMap = new Map<
    string,
    { id: string; title: string; description: string; icon: string; questions: Question[] }
  >();

  const sectionConfig: Record<string, { title: string; description: string; icon: string }> = {
    facility: {
      title: "Facility Details",
      description: "Basic information about your facility",
      icon: "🏢",
    },
    operations: { title: "Operations", description: "How your facility operates", icon: "⚙️" },
    equipment: { title: "Equipment", description: "Equipment and machinery details", icon: "🔧" },
    solar: {
      title: "Solar Potential",
      description: "Solar and renewable energy options",
      icon: "☀️",
    },
    energy: { title: "Energy Profile", description: "Your energy usage and needs", icon: "⚡" },
    goals: { title: "Goals", description: "Your energy goals", icon: "🎯" },
    general: { title: "General", description: "General information", icon: "📋" },
  };

  questions.forEach((q) => {
    const sectionId = q.section || "general";
    if (!sectionMap.has(sectionId)) {
      const config = sectionConfig[sectionId] || {
        title: sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
        description: `${sectionId} questions`,
        icon: "📋",
      };
      sectionMap.set(sectionId, {
        id: sectionId,
        title: config.title,
        description: config.description,
        icon: config.icon,
        questions: [],
      });
    }
    sectionMap.get(sectionId)!.questions.push(q);
  });

  return Array.from(sectionMap.values());
}

interface CompleteStep3ComponentProps {
  state?: {
    industry?: string;
    industryName?: string;
    location?: string;
    electricityRate?: number;
    sunHours?: number;
    goals?: string[];
    useCaseData?: Record<string, unknown>;
    questionnaireDepth?: "minimal" | "standard" | "detailed";
    businessSizeTier?: "small" | "medium" | "large" | "enterprise";
  };
  updateState?: (updates: Record<string, unknown>) => void;
  onNext?: () => void;
  initialAnswers?: Record<string, unknown>;
  onAnswersChange?: (answers: Record<string, unknown>) => void;
  onComplete?: () => void;
  onBack?: () => void;
  onValidityChange?: (isValid: boolean) => void;
}

// ✅ Bug #3 Fix (Jan 23, 2026): Helper to properly check if a value is "answered"
// Handles empty strings, empty arrays, null, undefined
const isAnswered = (v: unknown): boolean => {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // numbers, booleans, non-empty objects
};

// ✅ FIX (Jan 25, 2026): Normalize multi-select answers to prevent string/char array corruption
function normalizeAnswer(value: unknown): unknown {
  if (Array.isArray(value)) return value;

  // If we accidentally stored JSON as a string, recover it
  if (typeof value === "string") {
    const s = value.trim();
    if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
      try {
        return JSON.parse(s);
      } catch {
        // Not valid JSON, return as-is
      }
    }
    return value;
  }

  return value;
}

export function CompleteStep3Component({
  state = {},
  updateState,
  onNext,
  initialAnswers = {},
  onAnswersChange,
  onComplete,
  onBack,
  onValidityChange,
}: CompleteStep3ComponentProps) {
  // ============================================================================
  // DEBUG LOGGING - Verify state.industry at mount (Jan 25, 2026)
  // ============================================================================
  if (import.meta.env.DEV) {
    console.log("🧭 Step3 mount state.industry =", state.industry, "industryName =", state.industryName);
    console.log("🧭 Step3 state keys:", Object.keys(state || {}));
  }

  // ============================================================================
  // MULTI-SOURCE INDUSTRY RESOLVER - Resilient to Step 2 representation (Jan 25, 2026)
  // ============================================================================
  // Step 3 must be resilient to different ways Step 2 might write industry data
  const industrySlugResolved = useMemo(() => {
    const anyState = state as any;
    return (
      (typeof state.industry === "string" && state.industry.trim()) ||
      anyState.industry?.type ||
      anyState.industryType ||
      anyState.industrySlug ||
      anyState.detectedIndustry ||
      ""
    );
  }, [state]);

  // ============================================================================
  // STATE MANAGEMENT - WIZARD STORE IS SINGLE SOURCE OF TRUTH (Jan 24, 2026)
  // ============================================================================
  // ✅ CRITICAL FIX: NO local answers state!
  // The wizard store (state.useCaseData.inputs) is the ONLY source of truth.
  // This ensures:
  // 1. Prefill updates the same object that validation reads
  // 2. Validation reads the same object that Step 4 reads
  // 3. No sync effects that can overwrite user input
  
  // Read answers directly from wizard store
  const answers = useMemo(() => {
    // Priority: initialAnswers (from parent) > state.useCaseData.inputs > empty
    const fromInitial = initialAnswers && Object.keys(initialAnswers).length > 0 ? initialAnswers : null;
    const fromState = (state.useCaseData?.inputs as Record<string, unknown>) ?? {};
    return fromInitial ?? fromState;
  }, [initialAnswers, state.useCaseData?.inputs]);

  // Single setter function - writes to wizard store AND notifies parent
  const setAnswer = useCallback((field: string, value: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`💾 [Step3/setAnswer] START:`, {
        field,
        value,
        oldValue: answers[field],
        answerCount: Object.keys(answers).filter(k => isAnswered(answers[k])).length,
        hasUpdateState: typeof updateState === 'function',
        hasOnAnswersChange: typeof onAnswersChange === 'function'
      });
    }
    
    // ✅ FIX (Jan 25, 2026): Normalize multi-select answers before storing
    const normalizedValue = normalizeAnswer(value);
    const newAnswers = { ...answers, [field]: normalizedValue };
    
    // Write to wizard store (this is what Step 4 reads)
    if (updateState) {
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: newAnswers,
        },
      });
      if (import.meta.env.DEV) {
        console.log(`✅ [Step3/setAnswer] Updated wizard store`);
      }
    }
    
    // Notify parent for any additional handling
    if (onAnswersChange) {
      onAnswersChange(newAnswers);
      if (import.meta.env.DEV) {
        console.log(`✅ [Step3/setAnswer] Called onAnswersChange`);
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`📝 [Step3/setAnswer] DONE: ${field} =`, normalizedValue);
    }
  }, [answers, updateState, state.useCaseData, onAnswersChange]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [, setIsTransitioning] = useState(false); // Only setter used
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ✅ NEW: Dynamic questions loading based on industry
  // Start with empty arrays - will be populated based on industry
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<typeof carWashSections>([]);
  const [loading, setLoading] = useState(true);
  const [industryTitle, setIndustryTitle] = useState("");

  // ⚠️  LEGACY: Apply business size pre-fills to answers
  // GATED by ENABLE_LEGACY_PREFILLS feature flag
  // Canonical defaults should come from template.defaults via SSOT
  const preFillsAppliedRef = useRef<string | null>(null);
  
  useEffect(() => {
    // ⚠️  SSOT DOCTRINE: Legacy prefills are DISABLED by default
    if (!ENABLE_LEGACY_PREFILLS) {
      return;
    }

    const industry = state.industry;
    const businessSizeTier = state.businessSizeTier as
      | "small"
      | "medium"
      | "large"
      | "enterprise"
      | undefined;

    if (!industry || !businessSizeTier) {
      console.log("📋 [LEGACY] No business size pre-fill: industry=", industry, "tier=", businessSizeTier);
      return;
    }

    // ✅ CRITICAL FIX (Jan 26, 2026): Only apply pre-fills ONCE per industry+tier combination
    // This prevents infinite loop where effect modifies state.useCaseData which triggers effect again
    const preFillKey = `${industry}-${businessSizeTier}`;
    if (preFillsAppliedRef.current === preFillKey) {
      console.log(`✅ [LEGACY] Pre-fills already applied for ${preFillKey}, skipping`);
      return;
    }

    const industryPrefills = BUSINESS_SIZE_PREFILLS[industry];
    if (!industryPrefills) {
      console.log(`📋 [LEGACY] No pre-fill mapping for industry: ${industry}`);
      return;
    }

    const tierPrefills = industryPrefills[businessSizeTier];
    if (!tierPrefills) {
      console.log(`📋 [LEGACY] No pre-fill mapping for tier: ${businessSizeTier}`);
      return;
    }

    console.warn(
      `⚠️  [LEGACY PREFILLS] Applying divergent pre-fills for ${industry} (${businessSizeTier}):`,
      tierPrefills,
      "\n  ⚠️  These should come from template.defaults instead!"
    );

    // ✅ SINGLE SOURCE OF TRUTH: Write pre-fills to wizard store
    // Merge pre-fills into current answers, but DON'T override existing user answers
    const currentAnswers = (state.useCaseData?.inputs as Record<string, unknown>) ?? {};
    const merged = { ...tierPrefills };
    // User's existing answers take precedence
    Object.keys(currentAnswers).forEach((key) => {
      if (
        currentAnswers[key] !== undefined &&
        currentAnswers[key] !== "" &&
        currentAnswers[key] !== null
      ) {
        merged[key] = currentAnswers[key];
      }
    });
    console.log("📋 [LEGACY] Merged answers with pre-fills:", merged);
    
    // Mark as applied BEFORE calling updateState to prevent re-entry
    preFillsAppliedRef.current = preFillKey;
    
    // ✅ FIX (Jan 26, 2026 evening): Ensure validation sees the pre-filled answers
    // Write to wizard store AND trigger validation
    if (updateState) {
      console.log("📝 Writing pre-fills to wizard store...");
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: merged,
        },
      });
      
      // Force validation to re-check after next render
      queueMicrotask(() => {
        console.log("✅ Pre-fills written, validation should re-check now");
      });
    }
  }, [state.industry, state.businessSizeTier, updateState]);

  // ✅ Load questions dynamically based on industry
  useEffect(() => {
    async function loadQuestions() {
      // Use resolved industry slug from multi-source resolver (not state.industry directly)
      const industry = industrySlugResolved;

      if (!industry || industry === "unknown") {
        console.warn("⚠️ Step3: No valid industry selected (got '", industry, "'), using car-wash fallback");
        setQuestions(carWashQuestionsComplete);
        setSections(carWashSections);
        setIndustryTitle("Car Wash");
        setLoading(false);
        return;
      }

      // ✅ CRITICAL FIX (Jan 24, 2026): Helper to apply smartDefaults to answers
      // When questions have default_value in DB, pre-populate them as answers
      // This fixes the bug where pre-selected values don't count as "answered"
      // ✅ SINGLE SOURCE OF TRUTH: Write defaults directly to wizard store
      const applySmartDefaults = (loadedQuestions: Question[]) => {
        const currentAnswers = (state.useCaseData?.inputs as Record<string, unknown>) ?? {};
        const withDefaults = { ...currentAnswers };
        let appliedCount = 0;
        
        loadedQuestions.forEach((q) => {
          // Only apply default if user hasn't already answered this question
          if (!isAnswered(currentAnswers[q.id]) && q.smartDefault !== undefined && q.smartDefault !== null) {
            withDefaults[q.id] = q.smartDefault;
            appliedCount++;
          }
        });
        
        if (appliedCount > 0 && updateState) {
          console.log(`📋 Applied ${appliedCount} smart defaults from database:`, 
            loadedQuestions.filter(q => q.smartDefault).map(q => ({ id: q.id, default: q.smartDefault })));
          updateState({
            useCaseData: {
              ...state.useCaseData,
              inputs: withDefaults,
            },
          });
        }
      };

      try {
        // Try multiple slug formats since DB has inconsistent naming:
        // - heavy_duty_truck_stop (underscores)
        // - data-center (hyphens)
        // - hotel (no separator)
        const slugVariants = [
          industry, // Original: heavy_duty_truck_stop
          industry.replace(/_/g, "-"), // With hyphens: heavy-duty-truck-stop
          industry.replace(/-/g, "_"), // With underscores: data_center
        ].filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates

        console.log(`📋 Loading questions for industry: ${industry}, trying slugs:`, slugVariants);

        // Try each slug variant until one works
        let useCase = null;
        let _successSlug = null;
        for (const slug of slugVariants) {
          console.log(`🔎 Trying slug: "${slug}"...`);
          useCase = await useCaseService.getUseCaseBySlug(slug);
          console.log(
            `   Result for "${slug}":`,
            useCase
              ? `✅ Found! Name: ${useCase.name}, Questions: ${useCase.custom_questions?.length || 0}`
              : "❌ Not found"
          );
          if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
            console.log(`✅ Found use case with slug: ${slug}`);
            _successSlug = slug;
            break;
          }
        }

        if (useCase && useCase.custom_questions && useCase.custom_questions.length > 0) {
          const dbQuestions = useCase.custom_questions as Record<string, unknown>[];
          console.log(
            `✅ Loaded ${dbQuestions.length} questions from database for ${useCase.name}`
          );

          // Debug: Log first few questions to see what fields we're getting
          if (dbQuestions.length > 0) {
            console.log("📋 Sample question from DB:", JSON.stringify(dbQuestions[0], null, 2));
          }

          // Transform to component format
          const transformedQuestions = dbQuestions.map((q, i) => transformDatabaseQuestion(q, i));

          // DEDUPLICATION: Remove questions with duplicate IDs (keep first occurrence)
          const seenIds = new Set<string>();
          const dedupedQuestions = transformedQuestions.filter((q) => {
            if (seenIds.has(q.id)) {
              console.warn(`⚠️ Duplicate question ID removed: ${q.id}`);
              return false;
            }
            seenIds.add(q.id);
            return true;
          });

          console.log(
            `📋 Transformed ${transformedQuestions.length} questions, ${dedupedQuestions.length} after deduplication`
          );
          if (dedupedQuestions.length > 0) {
            console.log(
              "📋 Sample transformed question:",
              JSON.stringify(dedupedQuestions[0], null, 2)
            );
          }

          setQuestions(dedupedQuestions);
          setSections(createSectionsFromQuestions(dedupedQuestions));
          setIndustryTitle(useCase.name || state.industryName || industry);
          
          // ✅ CRITICAL (Jan 24, 2026): Apply smart defaults from database
          // This ensures pre-filled values count as "answered"
          applySmartDefaults(dedupedQuestions);

          // ✅ NEW (Jan 23, 2026): Store Step 3 industry template (load profile + equipment summary) into SSOT
          if (updateState && useCase?.id) {
            try {
              const template = await useCaseService.getStep3IndustryTemplateByUseCase({
                id: useCase.id,
                slug: useCase.slug,
                name: useCase.name,
              });

              updateState({
                useCaseData: {
                  ...state.useCaseData,
                  template, // <- SSOT snapshot for Step 3+
                },
              });

              if (import.meta.env.DEV) {
                console.log("✅ Step 3 industry template loaded:", template);
              }
            } catch (e) {
              console.warn("⚠️ Failed to load Step 3 template bundle:", e);
            }
          }
        } else {
          // Log what we actually got from the service
          console.log(
            "🔍 useCase result:",
            useCase
              ? {
                  name: useCase.name,
                  slug: useCase.slug,
                  questionCount: useCase.custom_questions?.length || 0,
                }
              : "null"
          );

          // Fallback to car wash if no DB questions
          console.log(`⚠️ No database questions found for ${industry}, using car wash fallback`);

          if (industry === "car_wash" || industry === "car-wash") {
            setQuestions(carWashQuestionsComplete);
            setSections(carWashSections);
            setIndustryTitle("Car Wash");
          } else {
            // For other industries without DB questions, show a message
            console.warn(`No questions available for industry: ${industry}`);
            setQuestions([]);
            setSections([]);
            setIndustryTitle(
              state.industryName ||
                industry.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            );
          }
        }
      } catch (error) {
        console.error(`Error loading questions for ${industry}:`, error);
        // Show error state instead of defaulting to car wash
        setQuestions([]);
        setSections([]);
        setIndustryTitle(`Error loading ${state.industryName || industry}`);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [industrySlugResolved, state.industryName]);

  // Sync with parent component (debounced to prevent infinite loops)
  const prevAnswersRef = useRef<Record<string, unknown>>(answers);
  useEffect(() => {
    // Only call onAnswersChange if answers actually changed
    const answersChanged = JSON.stringify(prevAnswersRef.current) !== JSON.stringify(answers);

    if (answersChanged && onAnswersChange) {
      prevAnswersRef.current = answers;
      onAnswersChange(answers);
    }
  }, [answers, onAnswersChange]);

  // ============================================================================
  // VALIDITY TRACKING - Notify parent when questionnaire becomes valid
  // ============================================================================
  useEffect(() => {
    if (!onValidityChange) return;

    // ✅ GUARD: If questions haven't loaded yet, don't report validity
    // BUT log it so we can see the timing in dev mode
    if (questions.length === 0) {
      if (import.meta.env.DEV) {
        console.log('📊 Step 3 Validity: Skipping - questions not loaded yet');
      }
      // Don't report - wait for questions to load
      return;
    }

    // ✅ CRITICAL: Count total answered INCLUDING business size pre-fills
    const totalAnsweredCount = Object.keys(answers).filter(k => isAnswered(answers[k])).length;

    // Count required questions (essential tier questions)
    const requiredQuestions = questions.filter((q) => {
      // Only count questions that are visible based on depth
      if (!shouldShowByDepth(q.questionTier)) return false;
      // Only count questions that pass conditional logic
      if (q.conditionalLogic) {
        const dependentValue = answers[q.conditionalLogic.dependsOn];
        if (!q.conditionalLogic.showIf(dependentValue)) return false;
      }
      // Essential tier questions are required
      return q.questionTier === "essential" || !q.questionTier;
    });

    // ✅ Bug #3 Fix: Use isAnswered helper (handles empty arrays)
    const answeredRequired = requiredQuestions.filter(
      (q) => isAnswered(answers[q.id])
    );
    const requiredProgress =
      requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 0;

    // ✅ FIX (Jan 24, 2026): If user has answered ALL visible questions, consider valid
    // This fixes the case where user answered 100% but validation still fails
    const allVisibleQuestions = questions.filter((q) => {
      if (!shouldShowByDepth(q.questionTier)) return false;
      if (q.conditionalLogic) {
        const dependentValue = answers[q.conditionalLogic.dependsOn];
        if (!q.conditionalLogic.showIf(dependentValue)) return false;
      }
      return true;
    });
    const answeredAll = allVisibleQuestions.filter(q => isAnswered(answers[q.id]));
    const allAnsweredPercent = allVisibleQuestions.length > 0 
      ? (answeredAll.length / allVisibleQuestions.length) * 100 
      : 0;

    // Consider valid if:
    // - At least 50% of ESSENTIAL questions are answered, OR
    // - At least 50% of ALL visible questions are answered, OR
    // - No questions exist (proceed with defaults), OR
    // - User has at least 3 answers in state (pre-fills count!)
    // ✅ RELAXED (Jan 24, 2026): Added totalAnsweredCount >= 3 fallback
    // This ensures pre-filled values from business size selection work
    const isValid = requiredProgress >= 50 || allAnsweredPercent >= 50 || allVisibleQuestions.length === 0 || totalAnsweredCount >= 3;

    // DEBUG: Log validity status
    if (import.meta.env.DEV) {
      console.log(
        `📊 Step 3 Validity: Essential ${Math.round(requiredProgress)}% (${answeredRequired.length}/${requiredQuestions.length}) | All ${Math.round(allAnsweredPercent)}% (${answeredAll.length}/${allVisibleQuestions.length}) | Total answers: ${totalAnsweredCount} - ${isValid ? "✅ VALID" : "❌ INVALID"}`
      );
      
      // Show which required questions are NOT answered
      const unanswered = requiredQuestions.filter(q => !isAnswered(answers[q.id]));
      if (unanswered.length > 0) {
        console.log(`❓ Unanswered essential questions:`, unanswered.map(q => ({ id: q.id, title: q.title.substring(0, 40) })));
      }
      
      // Show what's in answers object
      console.log(`📝 Current answers (${Object.keys(answers).filter(k => isAnswered(answers[k])).length} answered):`, Object.keys(answers).filter(k => isAnswered(answers[k])));
    }

    onValidityChange(isValid);
    
    // ✅ SSOT VERIFICATION (Jan 24, 2026): Confirm validator reads wizard store
    if (import.meta.env.DEV) {
      const wizardStoreInputs = state.useCaseData?.inputs as Record<string, unknown> | undefined;
      const wizardStoreCount = wizardStoreInputs ? Object.keys(wizardStoreInputs).filter(k => isAnswered(wizardStoreInputs[k])).length : 0;
      const answersCount = Object.keys(answers).filter(k => isAnswered(answers[k])).length;
      if (wizardStoreCount !== answersCount) {
        console.error(`🚨 SSOT DIVERGENCE: answers has ${answersCount}, wizard store has ${wizardStoreCount}`);
      } else {
        console.log(`✅ SSOT OK: Both answers and wizard store have ${answersCount} answered`);
      }
    }
  }, [answers, questions, onValidityChange, state.questionnaireDepth, state.useCaseData?.inputs]);

  // ✅ SINGLE SOURCE OF TRUTH: Initial answers are now handled via:
  // 1. useMemo for `answers` reads from state.useCaseData.inputs (which already has initialAnswers)
  // 2. No need for separate sync - the wizard store is the single source

  // Helper: Check if a question should be shown based on questionnaire depth
  // Questionnaire depths (from BusinessSizePanel): 'minimal', 'standard', 'detailed'
  // Question tiers (from DB): 'essential', 'standard', 'detailed'
  //
  // Mapping:
  // - 'minimal' depth → shows 'essential' questions only (quick wizard for small businesses)
  // UPDATED: All depths now show 'essential' + 'standard' questions
  // - 'minimal' depth → shows 'essential' + 'standard' questions (for small businesses)
  // - 'standard' depth → shows 'essential' + 'standard' questions
  // - 'detailed' depth → shows ALL questions (essential + standard + detailed)
  // NOTE: The tier distinction is now about business SIZE context, not question count
  const shouldShowByDepth = (questionTier: string | undefined): boolean => {
    const depth = state.questionnaireDepth || "standard"; // Default to standard if not set
    const tier = questionTier || "essential"; // Default to essential (always show) if not set

    // Essential questions ALWAYS show regardless of depth
    if (tier === "essential") return true;

    // Standard questions show for ALL depths (minimal, standard, detailed)
    // This ensures users always see meaningful questionnaires
    if (tier === "standard") return true;

    // Detailed questions only show for 'detailed' depth
    if (tier === "detailed") return depth === "detailed";

    return true; // Fallback: show if unknown tier
  };

  // Filter visible questions based on:
  // 1. Questionnaire depth (based on business size tier)
  // 2. Conditional logic (dynamic show/hide based on answers)
  const visibleQuestions = (questions as (Question & { questionTier?: string })[]).filter((q) => {
    // First filter by questionnaire depth
    if (!shouldShowByDepth(q.questionTier)) return false;

    // Then filter by conditional logic
    if (!q.conditionalLogic) return true;
    const dependentValue = answers[q.conditionalLogic.dependsOn];
    return q.conditionalLogic.showIf(dependentValue);
  });

  // DEBUG: Log filtering results
  if (import.meta.env.DEV && questions.length > 0) {
    const allQuestions = questions as (Question & { questionTier?: string })[];
    const depthFilteredOut = allQuestions.filter((q) => !shouldShowByDepth(q.questionTier));
    console.log("📊 Question filtering:", {
      totalLoaded: questions.length,
      visibleAfterFilters: visibleQuestions.length,
      hiddenByDepth: depthFilteredOut.length,
      questionnaireDepth: state.questionnaireDepth || "not set (defaulting to standard)",
      tierBreakdown: {
        essential: allQuestions.filter((q) => q.questionTier === "essential").length,
        standard: allQuestions.filter((q) => q.questionTier === "standard").length,
        detailed: allQuestions.filter((q) => q.questionTier === "detailed").length,
        undefined: allQuestions.filter((q) => !q.questionTier).length,
      },
      hiddenQuestions: depthFilteredOut.map((q) => ({ id: q.id, tier: q.questionTier })),
    });
  }

  // ✅ Bug #4 Fix (Jan 23, 2026): Clamp index when conditional logic hides questions
  useEffect(() => {
    if (visibleQuestions.length > 0 && currentQuestionIndex > visibleQuestions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [visibleQuestions.length, currentQuestionIndex]);

  // Current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Progress calculation - ✅ Bug #3 Fix: Use isAnswered for accurate count
  const answeredCount = visibleQuestions.filter(q => isAnswered(answers[q.id])).length;
  const totalQuestions = visibleQuestions.length;
  const _overallProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  void _overallProgress; // Used for progress tracking

  // Section progress (also filtered by questionnaire depth)
  const _sectionProgress = sections.map((section) => {
    const sectionQuestions = (section.questions as (Question & { questionTier?: string })[]).filter(
      (q) => {
        // Filter by questionnaire depth
        if (!shouldShowByDepth(q.questionTier)) return false;
        // Filter by conditional logic
        if (!q.conditionalLogic) return true;
        const dependentValue = answers[q.conditionalLogic.dependsOn];
        return q.conditionalLogic.showIf(dependentValue);
      }
    );
    // ✅ Bug #3 Fix: Use isAnswered helper
    const answered = sectionQuestions.filter((q: Question) => isAnswered(answers[q.id])).length;
    const total = sectionQuestions.length;

    return {
      ...section,
      totalQuestions: total,
      answeredQuestions: answered,
      isLocked: false,
    };
  });

  // Current section
  const _currentSection = currentQuestion?.section || "facility";
  void _currentSection; // Explicitly mark as intentionally unused

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAnswer = (questionId: string, value: unknown) => {
    // ✅ SINGLE SOURCE OF TRUTH: Use setAnswer which writes to wizard store
    // This ensures validation and Step 4 see the same data
    setAnswer(questionId, value);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < visibleQuestions.length) {
      setIsTransitioning(true);
      setCurrentQuestionIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
        scrollToQuestion(index);
      }, 100);
    }
  };

  const _goToNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };
  void _goToNextQuestion; // Reserved for keyboard navigation

  const _goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    } else if (onBack) {
      // Go back to previous step
      onBack();
    }
  };

  const scrollToQuestion = (index: number) => {
    const element = questionRefs.current[index];
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const canProceed = () => {
    // Check if all required questions are answered
    // ✅ Bug #3 Fix: Use isAnswered helper (handles empty arrays)
    const requiredQuestions = visibleQuestions.filter((q) => q.validation?.required);
    return requiredQuestions.every((q) => isAnswered(answers[q.id]));
  };

  const _handleComplete = () => {
    if (canProceed()) {
      if (onComplete) {
        onComplete();
      } else if (onNext) {
        onNext();
      }
    }
  };
  void _handleComplete; // Reserved for form completion handler

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">
            Loading questions for {state.industryName || state.industry || "your facility"}...
          </p>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-white mb-2">Questions Coming Soon</h2>
          <p className="text-slate-400 mb-6">
            We're still building the questionnaire for {industryTitle}. In the meantime, you can
            continue with default settings.
          </p>
          <button
            onClick={() => onNext?.()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
          >
            Continue with Defaults
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ✅ DEBUG PANEL (Jan 24, 2026) - Shows actual state for troubleshooting */}
      {/* Enable with ?debug=1 in URL */}
      {import.meta.env.DEV && new URLSearchParams(window.location.search).get("debug") === "1" && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 border border-purple-500/50 rounded-lg p-3 text-xs font-mono overflow-auto max-h-64">
          <div className="text-purple-400 font-bold mb-2">Step 3 Debug Panel</div>
          <div className="text-slate-300">
            <div className="mb-1">Questions: {visibleQuestions.length}</div>
            <div className="mb-1">Answered: {answeredCount}/{totalQuestions} ({Math.round((answeredCount/totalQuestions)*100)}%)</div>
            <div className="mb-1">Valid: {answeredCount >= totalQuestions * 0.5 ? '✅ YES' : '❌ NO'}</div>
            <div className="text-slate-500 mt-2">Answers ({Object.keys(answers).filter(k => isAnswered(answers[k])).length} non-empty):</div>
            <pre className="text-[10px] text-slate-400 mt-1 whitespace-pre-wrap">
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(answers).filter(([_, v]) => isAnswered(v)).slice(0, 10)
                ),
                null,
                1
              )}
              {Object.keys(answers).filter(k => isAnswered(answers[k])).length > 10 && '\n...and more'}
            </pre>
          </div>
        </div>
      )}
      {/* Main Content - Full Width (no sidebar) */}
      <div className="flex flex-col min-h-screen">
        {/* Compact Header with Progress */}
        {/* STICKY HEADER REMOVED - Progress shown in floating battery widget (Jan 20, 2026) */}

        {/* Scrollable Questions Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Industry Header Image - Slimmer */}
            {state.industry && INDUSTRY_IMAGES[state.industry] && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-xl shadow-purple-900/20">
                <div className="relative h-36 md:h-44">
                  <img
                    src={INDUSTRY_IMAGES[state.industry]}
                    alt={industryTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-0.5">
                      Your {industryTitle} Details
                    </h1>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback title if no image */}
            {(!state.industry || !INDUSTRY_IMAGES[state.industry]) && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Your {industryTitle} Details</h1>
              </div>
            )}

            {/* Industry Opportunity Panel */}
            {/* ✅ Bug #5 Fix (Jan 23, 2026): Renamed prop from 'state' to 'locationString' for clarity */}
            <IndustryOpportunityPanel
              industry={state.industry || "car-wash"}
              industryName={state.industryName || industryTitle}
              locationString={state.location}
              electricityRate={state.electricityRate}
              sunHours={state.sunHours}
              goals={state.goals}
            />

            {/* Questions - Compact Grid */}
            <div className="space-y-6">
              {visibleQuestions.map((question, index) => (
                <div
                  key={question.id}
                  ref={(el) => {
                    questionRefs.current[index] = el;
                  }}
                  className="scroll-mt-24 transition-all duration-300 opacity-100"
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  <div className="group p-5 bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-xl hover:border-violet-500/30 hover:bg-slate-900/80 transition-all duration-200">
                    <CompleteQuestionRenderer
                      question={
                        {
                          ...question,
                          questionNumber: index + 1,
                        } as Question & { questionNumber: number }
                      }
                      value={answers[question.id]}
                      onChange={(value) => handleAnswer(question.id, value)}
                      allAnswers={answers}
                      questionNumber={index + 1}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Message */}
            {answeredCount === totalQuestions && totalQuestions > 0 && (
              <div className="mt-8 p-5 bg-gradient-to-br from-emerald-900/30 to-green-900/20 border border-emerald-500/50 rounded-xl text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-lg font-bold text-white mb-1">Questionnaire Complete!</h3>
                <p className="text-slate-300 text-sm">
                  All questions answered. Click Continue below to proceed.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Fixed Bottom Navigation - REMOVED: WizardV6 has floating navigation (Jan 20, 2026) */}
      </div>
    </div>
  );
}

export default CompleteStep3Component;
