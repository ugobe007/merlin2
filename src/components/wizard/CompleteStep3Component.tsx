/**
 * Complete Step 3 Component
 *
 * Main orchestrator for the questionnaire
 * Manages state, navigation, progress tracking
 *
 * ✅ FIXED Jan 2025: Now loads questions dynamically from database
 * based on selected industry (state.industry)
 */

import React, { useState, useEffect, useRef } from "react";
import { CompleteQuestionRenderer } from "./CompleteQuestionRenderer";
import { IndustryOpportunityPanel } from "./IndustryOpportunityPanel";
import { useCaseService } from "@/services/useCaseService";
import {
  carWashQuestionsComplete,
  carWashSections,
  type Question,
} from "@/data/carwash-questions-complete.config";
import { Loader2 } from "lucide-react";

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
// BUSINESS SIZE → PRE-FILL MAPPING
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
  // Normalize section names: "Facility Basics" → "facility", "Site & Infrastructure" → "facility", etc.
  const sectionNormalized =
    sectionRaw.toLowerCase().includes("facility") ||
    sectionRaw.toLowerCase().includes("infrastructure") ||
    sectionRaw.toLowerCase().includes("basic")
      ? "facility"
      : sectionRaw.toLowerCase().includes("operation")
        ? "operations"
        : sectionRaw.toLowerCase().includes("equipment") ||
            sectionRaw.toLowerCase().includes("charger")
          ? "equipment"
          : sectionRaw.toLowerCase().includes("solar") ||
              sectionRaw.toLowerCase().includes("energy")
            ? "solar"
            : "facility";
  const validSections = ["facility", "operations", "equipment", "solar"] as const;
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
    type: mapQuestionType((dbQuestion.input_type || dbQuestion.question_type || "text") as string),
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
function mapQuestionType(dbType: string): Question["type"] {
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

    // Text types - CRITICAL FIX: 'text' should NOT become buttons!
    text: "number_input", // Most "text" in our DB are actually numeric
    text_input: "number_input",
    freeform: "number_input",
  };

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
  // STATE MANAGEMENT
  // ============================================================================
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    (initialAnswers as Record<string, unknown>) ||
      ((state.useCaseData?.inputs as Record<string, unknown>) ?? {})
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [, setIsTransitioning] = useState(false); // Only setter used
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ✅ NEW: Dynamic questions loading based on industry
  // Start with empty arrays - will be populated based on industry
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<typeof carWashSections>([]);
  const [loading, setLoading] = useState(true);
  const [industryTitle, setIndustryTitle] = useState("");

  // ✅ Apply business size pre-fills to answers (e.g., "Hyperscale" → dataCenterType: 'hyperscale')
  useEffect(() => {
    const industry = state.industry;
    const businessSizeTier = state.businessSizeTier as
      | "small"
      | "medium"
      | "large"
      | "enterprise"
      | undefined;

    if (!industry || !businessSizeTier) {
      console.log("📋 No business size pre-fill: industry=", industry, "tier=", businessSizeTier);
      return;
    }

    const industryPrefills = BUSINESS_SIZE_PREFILLS[industry];
    if (!industryPrefills) {
      console.log(`📋 No pre-fill mapping for industry: ${industry}`);
      return;
    }

    const tierPrefills = industryPrefills[businessSizeTier];
    if (!tierPrefills) {
      console.log(`📋 No pre-fill mapping for tier: ${businessSizeTier}`);
      return;
    }

    console.log(
      `✅ Applying business size pre-fills for ${industry} (${businessSizeTier}):`,
      tierPrefills
    );

    // Merge pre-fills into answers, but DON'T override existing user answers
    setAnswers((prevAnswers) => {
      const merged = { ...tierPrefills };
      // User's existing answers take precedence
      Object.keys(prevAnswers).forEach((key) => {
        if (
          prevAnswers[key] !== undefined &&
          prevAnswers[key] !== "" &&
          prevAnswers[key] !== null
        ) {
          merged[key] = prevAnswers[key];
        }
      });
      console.log("📋 Merged answers with pre-fills:", merged);
      return merged;
    });
  }, [state.industry, state.businessSizeTier]);

  // ✅ Load questions dynamically based on industry
  useEffect(() => {
    async function loadQuestions() {
      const industry = state.industry;

      if (!industry) {
        console.log("📋 No industry selected, using car wash questions as default");
        setQuestions(carWashQuestionsComplete);
        setSections(carWashSections);
        setIndustryTitle("Car Wash");
        setLoading(false);
        return;
      }

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
  }, [state.industry, state.industryName]);

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

    const answeredRequired = requiredQuestions.filter(
      (q) => answers[q.id] !== undefined && answers[q.id] !== ""
    );
    const requiredProgress =
      requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 0;

    // Consider valid if:
    // - At least 70% of required questions are answered, OR
    // - All essential questions are answered
    const isValid = requiredProgress >= 70;

    // DEBUG: Log validity status
    if (import.meta.env.DEV) {
      console.log(
        `📊 Step 3 Validity: ${Math.round(requiredProgress)}% (${answeredRequired.length}/${requiredQuestions.length} required) - ${isValid ? "✅ VALID" : "❌ INVALID"}`
      );
    }

    onValidityChange(isValid);
  }, [answers, questions, onValidityChange, state.questionnaireDepth]);

  // Load initial answers
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

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

  // Current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Progress calculation
  const answeredCount = Object.keys(answers).length;
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
    const answered = sectionQuestions.filter((q: Question) => answers[q.id] !== undefined).length;
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
    // DEBUG: Log answer capture for troubleshooting
    if (import.meta.env.DEV) {
      console.log(`📝 Answer captured: ${questionId} =`, value, `(type: ${typeof value})`);
    }

    const newAnswers = {
      ...answers,
      [questionId]: value,
    };
    setAnswers(newAnswers);

    // Update parent state if updateState is provided
    if (updateState) {
      updateState({
        useCaseData: {
          ...state.useCaseData,
          inputs: newAnswers,
        },
      });

      // DEBUG: Log state update
      if (import.meta.env.DEV) {
        console.log(`📊 State updated with ${Object.keys(newAnswers).length} answers:`, newAnswers);
      }
    }

    // DISABLED: Auto-scroll removed per user request
    // User should manually scroll/click to continue
    // Auto-advance was causing issues with premature triggering
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
    const requiredQuestions = visibleQuestions.filter((q) => q.validation?.required);
    return requiredQuestions.every(
      (q) => answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
    );
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
                    <p className="text-slate-300 text-sm">
                      Help Merlin size the perfect energy system for you.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback title if no image */}
            {(!state.industry || !INDUSTRY_IMAGES[state.industry]) && (
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-1">Your {industryTitle} Details</h1>
                <p className="text-base text-slate-400">
                  Help Merlin size the perfect energy system for you.
                </p>
              </div>
            )}

            {/* Industry Opportunity Panel */}
            <IndustryOpportunityPanel
              industry={state.industry || "car-wash"}
              industryName={state.industryName || industryTitle}
              state={state.location}
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
