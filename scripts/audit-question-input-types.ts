/**
 * QUESTION INPUT TYPE AUDIT SCRIPT
 * =================================
 * Analyzes all custom_questions across all use cases and recommends
 * the appropriate input field type based on these guidelines:
 * 
 * INPUT TYPE GUIDELINES:
 * ----------------------
 * 1. RANGE_BUTTONS - Small to medium counts (rooms, beds, racks, bays, chargers)
 *    - Shows preset range buttons like "1-5", "6-10", "11-20", "21-50", "50+"
 *    - Best for: numberOfRooms, bedCount, serverRacks, washBays, chargerCount
 * 
 * 2. SLIDER - Continuous/operational values
 *    - Shows slider with +/- buttons
 *    - Best for: carsPerDay, hoursOfOperation, loadingBays, squareFootage, acreage
 * 
 * 3. MULTISELECT (Checkboxes) - Multiple selections allowed
 *    - Shows checkbox grid
 *    - Best for: amenities, facilities, services, features
 * 
 * 4. SELECT (Buttons/Dropdown) - Single choice from options
 *    - ≤6 options: Panel buttons
 *    - >6 options: Dropdown
 *    - Best for: buildingType, climateZone, gridConnection, operatingHours
 * 
 * 5. TOGGLE - Yes/No binary choice
 *    - Shows Yes/No toggle buttons
 *    - Best for: hasPool, hasRestaurant, hasBackupGenerator
 * 
 * 6. NUMBER_INPUT - Direct numeric entry (rare, for very specific values)
 *    - Shows text input with suffix
 *    - Best for: exactSquareFootage, specificKW, customValues
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// INPUT TYPE CLASSIFICATION RULES
// ============================================

interface InputTypeRule {
  type: 'range_buttons' | 'slider' | 'multiselect' | 'select' | 'toggle' | 'number_input';
  config?: {
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    ranges?: { label: string; min: number; max: number | null }[];
    options?: { label: string; value: string }[];
  };
  reason: string;
}

// Field name patterns that indicate specific input types
const FIELD_PATTERNS: Record<string, (fieldName: string, questionText: string, currentType: string, options: any) => InputTypeRule> = {
  
  // ============================================
  // RANGE BUTTONS - Countable items
  // ============================================
  
  // Room/Unit counts
  'numberOfRooms|roomCount|hotelRooms|rooms': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-25', min: 1, max: 25 },
        { label: '26-75', min: 26, max: 75 },
        { label: '76-150', min: 76, max: 150 },
        { label: '151-300', min: 151, max: 300 },
        { label: '300+', min: 301, max: null },
      ],
      suffix: 'rooms'
    },
    reason: 'Hotel rooms - discrete count ranges'
  }),
  
  'numberOfUnits|unitCount|apartmentUnits|units': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-20', min: 1, max: 20 },
        { label: '21-50', min: 21, max: 50 },
        { label: '51-100', min: 51, max: 100 },
        { label: '101-250', min: 101, max: 250 },
        { label: '250+', min: 251, max: null },
      ],
      suffix: 'units'
    },
    reason: 'Apartment units - discrete count ranges'
  }),
  
  // Medical
  'bedCount|hospitalBeds|beds': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-50', min: 1, max: 50 },
        { label: '51-150', min: 51, max: 150 },
        { label: '151-300', min: 151, max: 300 },
        { label: '301-500', min: 301, max: 500 },
        { label: '500+', min: 501, max: null },
      ],
      suffix: 'beds'
    },
    reason: 'Hospital beds - discrete count ranges'
  }),
  
  // Data Center
  'serverRacks|rackCount|racks': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-10', min: 1, max: 10 },
        { label: '11-50', min: 11, max: 50 },
        { label: '51-100', min: 51, max: 100 },
        { label: '101-500', min: 101, max: 500 },
        { label: '500+', min: 501, max: null },
      ],
      suffix: 'racks'
    },
    reason: 'Server racks - discrete count ranges'
  }),
  
  // Car Wash
  'bayCount|washBays|bays|numBays': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-2', min: 1, max: 2 },
        { label: '3-4', min: 3, max: 4 },
        { label: '5-6', min: 5, max: 6 },
        { label: '7-10', min: 7, max: 10 },
        { label: '10+', min: 11, max: null },
      ],
      suffix: 'bays'
    },
    reason: 'Wash bays - small discrete count'
  }),
  
  // EV Charging
  'mcsChargers': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0', min: 0, max: 0 },
        { label: '1-2', min: 1, max: 2 },
        { label: '3-4', min: 3, max: 4 },
        { label: '5-8', min: 5, max: 8 },
        { label: '8+', min: 9, max: null },
      ],
      suffix: 'chargers (1,250 kW each)'
    },
    reason: 'MCS chargers - expensive, typically 0-8'
  }),
  
  'dcfc350|dcfcChargers|dcfc': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0-4', min: 0, max: 4 },
        { label: '5-10', min: 5, max: 10 },
        { label: '11-20', min: 11, max: 20 },
        { label: '21-40', min: 21, max: 40 },
        { label: '40+', min: 41, max: null },
      ],
      suffix: 'chargers (350 kW each)'
    },
    reason: 'DCFC chargers - moderate count'
  }),
  
  'level2|level2Chargers|l2Chargers': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0-5', min: 0, max: 5 },
        { label: '6-15', min: 6, max: 15 },
        { label: '16-30', min: 16, max: 30 },
        { label: '31-50', min: 31, max: 50 },
        { label: '50+', min: 51, max: null },
      ],
      suffix: 'chargers (19.2 kW each)'
    },
    reason: 'Level 2 chargers - higher count typical'
  }),
  
  // Truck Stop
  'serviceBays': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0-2', min: 0, max: 2 },
        { label: '3-6', min: 3, max: 6 },
        { label: '7-10', min: 7, max: 10 },
        { label: '11-15', min: 11, max: 15 },
        { label: '15+', min: 16, max: null },
      ],
      suffix: 'bays (60 kW avg each)'
    },
    reason: 'Service bays - industrial count'
  }),
  
  'truckWashBays': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0', min: 0, max: 0 },
        { label: '1', min: 1, max: 1 },
        { label: '2', min: 2, max: 2 },
        { label: '3-4', min: 3, max: 4 },
        { label: '5+', min: 5, max: null },
      ],
      suffix: 'tunnels (300 kW each)'
    },
    reason: 'Truck wash - very limited count'
  }),
  
  // Restaurant/Food
  'restaurantSeats|seatCount|seats': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0-50', min: 0, max: 50 },
        { label: '51-100', min: 51, max: 100 },
        { label: '101-200', min: 101, max: 200 },
        { label: '201-400', min: 201, max: 400 },
        { label: '400+', min: 401, max: null },
      ],
      suffix: 'seats'
    },
    reason: 'Restaurant seats - food service scale'
  }),
  
  // Fuel
  'numPumps|fuelPumps|pumps|dieselPumps': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-4', min: 1, max: 4 },
        { label: '5-8', min: 5, max: 8 },
        { label: '9-16', min: 9, max: 16 },
        { label: '17-24', min: 17, max: 24 },
        { label: '24+', min: 25, max: null },
      ],
      suffix: 'pumps'
    },
    reason: 'Fuel pumps - discrete count'
  }),
  
  // Loading/Logistics
  'loadingDocks|docks|numDocks': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-5', min: 1, max: 5 },
        { label: '6-15', min: 6, max: 15 },
        { label: '16-30', min: 16, max: 30 },
        { label: '31-60', min: 31, max: 60 },
        { label: '60+', min: 61, max: null },
      ],
      suffix: 'docks'
    },
    reason: 'Loading docks - warehouse scale'
  }),
  
  // ============================================
  // SLIDERS - Continuous/operational values
  // ============================================
  
  'carsPerDay|vehiclesPerDay|dailyVolume': (fn) => ({
    type: 'slider',
    config: { min: 10, max: 500, step: 10, suffix: ' cars/day' },
    reason: 'Daily volume - continuous operational metric'
  }),
  
  'hoursOfOperation|operatingHours|dailyHours': (fn) => ({
    type: 'slider',
    config: { min: 6, max: 24, step: 1, suffix: ' hrs/day' },
    reason: 'Operating hours - continuous 6-24 range'
  }),
  
  'daysPerWeek|daysOpen': (fn) => ({
    type: 'slider',
    config: { min: 1, max: 7, step: 1, suffix: ' days/week' },
    reason: 'Days per week - 1-7 range'
  }),
  
  'squareFootage|sqft|buildingSize|facilitySqFt|warehouseSqFt|totalSqFt|glaSqFt|mallSqFt|retailSqFt|officeSqFt|storeSqFt|homeSqFt|manufacturingSqFt|growingAreaSqFt|rooftopSqFt|buildingSqFt': (fn) => ({
    type: 'slider',
    config: { min: 1000, max: 500000, step: 1000, suffix: ' sq ft' },
    reason: 'Square footage - continuous area'
  }),
  
  // Generic squareFeet - catch-all for sq ft
  '^squareFeet$': (fn) => ({
    type: 'slider',
    config: { min: 1000, max: 500000, step: 1000, suffix: ' sq ft' },
    reason: 'Square footage (generic) - continuous area'
  }),
  
  'parkingLotAcres|acreage|lotSize': (fn) => ({
    type: 'slider',
    config: { min: 0.5, max: 20, step: 0.5, suffix: ' acres' },
    reason: 'Acreage - continuous area'
  }),
  
  'peakDemandKW|demandKW|facilityKW': (fn) => ({
    type: 'slider',
    config: { min: 50, max: 5000, step: 50, suffix: ' kW' },
    reason: 'Power demand - continuous electrical'
  }),
  
  // Existing solar/EV capacity (numeric, not boolean)
  'existingSolarKW|existingSolarCapacity|solarCapacityKW': (fn) => ({
    type: 'slider',
    config: { min: 0, max: 500, step: 10, suffix: ' kW' },
    reason: 'Existing solar capacity - continuous kW'
  }),
  
  'existingEVChargers|existingChargers|evChargerCount': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0', min: 0, max: 0 },
        { label: '1-5', min: 1, max: 5 },
        { label: '6-15', min: 6, max: 15 },
        { label: '16-30', min: 16, max: 30 },
        { label: '30+', min: 31, max: null },
      ],
      suffix: 'chargers'
    },
    reason: 'Existing EV chargers - discrete count'
  }),
  
  'monthlyBill|electricityBill|utilityBill': (fn) => ({
    type: 'slider',
    config: { min: 500, max: 100000, step: 500, suffix: ' $/mo' },
    reason: 'Monthly bill - continuous cost'
  }),
  
  'coolingTons|hvacTons|chillerCapacity': (fn) => ({
    type: 'slider',
    config: { min: 10, max: 1000, step: 10, suffix: ' tons' },
    reason: 'HVAC capacity - continuous'
  }),
  
  // Floor/level counts
  'floorCount|floors|numberOfFloors|growingLevels': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-3', min: 1, max: 3 },
        { label: '4-10', min: 4, max: 10 },
        { label: '11-25', min: 11, max: 25 },
        { label: '26-50', min: 26, max: 50 },
        { label: '50+', min: 51, max: null },
      ],
      suffix: 'floors'
    },
    reason: 'Floor count - discrete ranges'
  }),
  
  'elevatorCount|elevators|numberOfElevators': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '0-2', min: 0, max: 2 },
        { label: '3-6', min: 3, max: 6 },
        { label: '7-12', min: 7, max: 12 },
        { label: '13-20', min: 13, max: 20 },
        { label: '20+', min: 21, max: null },
      ],
      suffix: 'elevators'
    },
    reason: 'Elevator count - discrete ranges'
  }),
  
  'tenantCount|tenants|numberOfTenants': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-10', min: 1, max: 10 },
        { label: '11-30', min: 11, max: 30 },
        { label: '31-75', min: 31, max: 75 },
        { label: '76-150', min: 76, max: 150 },
        { label: '150+', min: 151, max: null },
      ],
      suffix: 'tenants'
    },
    reason: 'Tenant count - shopping center scale'
  }),
  
  'dockDoors|loadingDocks|docks': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-5', min: 1, max: 5 },
        { label: '6-15', min: 6, max: 15 },
        { label: '16-30', min: 16, max: 30 },
        { label: '31-60', min: 31, max: 60 },
        { label: '60+', min: 61, max: null },
      ],
      suffix: 'docks'
    },
    reason: 'Loading dock count - warehouse scale'
  }),
  
  'connectedBuildings': (fn) => ({
    type: 'range_buttons',
    config: {
      ranges: [
        { label: '1-3', min: 1, max: 3 },
        { label: '4-8', min: 4, max: 8 },
        { label: '9-15', min: 9, max: 15 },
        { label: '16-30', min: 16, max: 30 },
        { label: '30+', min: 31, max: null },
      ],
      suffix: 'buildings'
    },
    reason: 'Connected buildings - microgrid scale'
  }),
  
  // ============================================
  // MULTISELECT (Checkboxes) - Multiple selections
  // ============================================
  
  'amenities|facilities|services|features|additionalServices': (fn, qt, ct, opts) => ({
    type: 'multiselect',
    config: { options: opts || [] },
    reason: 'Multiple amenities/features can be selected'
  }),
  
  'hvacSystems|coolingTypes|heatingTypes|climateControl': (fn, qt, ct, opts) => ({
    type: 'multiselect',
    config: { options: opts || [] },
    reason: 'Multiple HVAC/climate systems possible'
  }),
  
  'existingInfrastructure|existingGeneration': (fn, qt, ct, opts) => ({
    type: 'multiselect',
    config: { options: opts || [] },
    reason: 'Multiple existing infrastructure types'
  }),
  
  // ============================================
  // SELECT (Single choice) - Categorical
  // ============================================
  
  'buildingType|facilityType|propertyType|stationType|truckStopType': (fn, qt, ct, opts) => ({
    type: 'select',
    config: { options: opts || [] },
    reason: 'Single categorical selection'
  }),
  
  'climateZone|climate|region': (fn) => ({
    type: 'select',
    config: {
      options: [
        { label: '🏜️ Hot/Arid (AZ, NV, TX)', value: 'hot-arid' },
        { label: '☀️ Hot/Humid (FL, LA, Gulf)', value: 'hot-humid' },
        { label: '🌤️ Temperate (CA, Mid-Atlantic)', value: 'temperate' },
        { label: '❄️ Cold (Northeast, Midwest)', value: 'cold' },
        { label: '🏔️ Mountain (CO, UT, MT)', value: 'mountain' },
      ]
    },
    reason: 'Climate zone affects HVAC and thermal management'
  }),
  
  'gridConnection|gridStatus': (fn) => ({
    type: 'select',
    config: {
      options: [
        { label: '🔌 On-Grid', value: 'on-grid' },
        { label: '🏝️ Off-Grid', value: 'off-grid' },
        { label: '🔄 Hybrid', value: 'hybrid' },
      ]
    },
    reason: 'Grid connection is single choice'
  }),
  
  'operations|operationType|operationSchedule': (fn) => ({
    type: 'select',
    config: {
      options: [
        { label: '🌙 24/7 Operations', value: '24-7' },
        { label: '🌅 Extended (16-20 hrs)', value: 'extended' },
        { label: '🏢 Standard (8-12 hrs)', value: 'standard' },
      ]
    },
    reason: 'Operation schedule is single choice'
  }),
  
  'hotelClass|propertyClass|facilityClass': (fn) => ({
    type: 'select',
    config: {
      options: [
        { label: '🌟 Luxury', value: 'luxury' },
        { label: '⭐ Upper Upscale', value: 'upper-upscale' },
        { label: '🏨 Upscale', value: 'upscale' },
        { label: '🏢 Midscale', value: 'midscale' },
        { label: '💰 Economy', value: 'economy' },
      ]
    },
    reason: 'Hotel class is single categorical choice'
  }),
  
  'housingType|residentialType': (fn) => ({
    type: 'select',
    config: {
      options: [
        { label: '🌟 Luxury Apartments', value: 'luxury_apartments' },
        { label: '🏢 Market Rate', value: 'market_rate' },
        { label: '🏠 Affordable Housing', value: 'affordable_housing' },
        { label: '👵 Senior Housing', value: 'senior_housing' },
        { label: '🎓 Student Housing', value: 'student_housing' },
      ]
    },
    reason: 'Housing type is single categorical choice'
  }),
  
  // ============================================
  // TOGGLE (Yes/No) - Boolean
  // These patterns MUST start with these words
  // ============================================
  
  '^has[A-Z]|^is[A-Z]|^wants[A-Z]|^includes[A-Z]|^needs[A-Z]': (fn, qt) => ({
    type: 'toggle',
    reason: 'Yes/No boolean question (starts with has/is/wants/needs)'
  }),
};

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

function classifyQuestion(
  fieldName: string,
  questionText: string,
  currentType: string,
  options: any
): InputTypeRule {
  // Ensure options is an array if present
  const optionsArray = Array.isArray(options) ? options : [];
  
  // Check each pattern
  for (const [pattern, classifier] of Object.entries(FIELD_PATTERNS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(fieldName)) {
      return classifier(fieldName, questionText, currentType, optionsArray);
    }
  }
  
  // Fallback logic based on current type
  if (currentType === 'boolean' || (currentType === 'select' && optionsArray.length === 2)) {
    const hasYesNo = optionsArray.some((o: any) => 
      o.value === 'true' || o.value === 'false' || 
      o.label?.toLowerCase().includes('yes') || o.label?.toLowerCase().includes('no')
    );
    if (hasYesNo) {
      return { type: 'toggle', reason: 'Boolean yes/no question (auto-detected)' };
    }
  }
  
  if (currentType === 'multiselect') {
    return { type: 'multiselect', config: { options: optionsArray }, reason: 'Multiselect (preserved from DB)' };
  }
  
  if (currentType === 'select' && optionsArray.length > 0) {
    return { type: 'select', config: { options: optionsArray }, reason: 'Select (preserved from DB)' };
  }
  
  if (currentType === 'number') {
    // Default number handling - try to infer from field name
    if (fieldName.toLowerCase().includes('count') || 
        fieldName.toLowerCase().includes('number') ||
        fieldName.toLowerCase().includes('qty')) {
      return {
        type: 'range_buttons',
        config: {
          ranges: [
            { label: '1-10', min: 1, max: 10 },
            { label: '11-25', min: 11, max: 25 },
            { label: '26-50', min: 26, max: 50 },
            { label: '51-100', min: 51, max: 100 },
            { label: '100+', min: 101, max: null },
          ]
        },
        reason: 'Generic count - using range buttons'
      };
    }
    return {
      type: 'slider',
      config: { min: 0, max: 1000, step: 10 },
      reason: 'Generic number - using slider'
    };
  }
  
  return {
    type: 'number_input',
    reason: 'Unclassified - defaulting to text input'
  };
}

// ============================================
// MAIN AUDIT FUNCTION
// ============================================

interface QuestionAudit {
  use_case_slug: string;
  use_case_name: string;
  field_name: string;
  question_text: string;
  current_type: string;
  current_options: any;
  recommended_type: string;
  recommended_config: any;
  reason: string;
  needs_update: boolean;
}

async function runAudit(): Promise<void> {
  console.log('========================================');
  console.log('QUESTION INPUT TYPE AUDIT');
  console.log('========================================\n');

  // Fetch all use cases with their questions
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('name');

  if (ucError) {
    console.error('Error fetching use cases:', ucError);
    return;
  }

  const results: QuestionAudit[] = [];
  const summary: Record<string, { total: number; needsUpdate: number }> = {};

  for (const uc of useCases || []) {
    const { data: questions, error: qError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', uc.id)
      .order('display_order');

    if (qError) {
      console.error(`Error fetching questions for ${uc.slug}:`, qError);
      continue;
    }

    let needsUpdate = 0;

    for (const q of questions || []) {
      const recommendation = classifyQuestion(
        q.field_name,
        q.question_text,
        q.question_type,
        q.options
      );

      const questionNeedsUpdate = 
        recommendation.type !== q.question_type ||
        (q.question_type === 'number' && !q.options?.min && !q.options?.max);

      if (questionNeedsUpdate) needsUpdate++;

      results.push({
        use_case_slug: uc.slug,
        use_case_name: uc.name,
        field_name: q.field_name,
        question_text: q.question_text,
        current_type: q.question_type,
        current_options: q.options,
        recommended_type: recommendation.type,
        recommended_config: recommendation.config,
        reason: recommendation.reason,
        needs_update: questionNeedsUpdate,
      });
    }

    summary[uc.slug] = {
      total: questions?.length || 0,
      needsUpdate,
    };
  }

  // Output summary
  console.log('USE CASE SUMMARY');
  console.log('----------------');
  for (const [slug, stats] of Object.entries(summary)) {
    const status = stats.needsUpdate > 0 ? '⚠️' : '✅';
    console.log(`${status} ${slug}: ${stats.needsUpdate}/${stats.total} need updates`);
  }

  // Output detailed recommendations grouped by use case
  console.log('\n\nDETAILED RECOMMENDATIONS');
  console.log('========================\n');

  const groupedByUseCase = results.reduce((acc, r) => {
    if (!acc[r.use_case_slug]) acc[r.use_case_slug] = [];
    acc[r.use_case_slug].push(r);
    return acc;
  }, {} as Record<string, QuestionAudit[]>);

  for (const [slug, questions] of Object.entries(groupedByUseCase)) {
    const needsUpdateCount = questions.filter(q => q.needs_update).length;
    if (needsUpdateCount === 0) continue;

    console.log(`\n🏢 ${slug.toUpperCase()}`);
    console.log('-'.repeat(50));

    for (const q of questions) {
      if (!q.needs_update) continue;
      
      console.log(`\n  📋 ${q.field_name}`);
      console.log(`     Question: "${q.question_text}"`);
      console.log(`     Current:  ${q.current_type}`);
      console.log(`     → Recommended: ${q.recommended_type}`);
      console.log(`     Reason: ${q.reason}`);
      if (q.recommended_config) {
        console.log(`     Config: ${JSON.stringify(q.recommended_config, null, 2).split('\n').join('\n            ')}`);
      }
    }
  }

  // Save full results to JSON for migration script
  const outputPath = join(__dirname, '../audit-results/question-input-audit.json');
  fs.mkdirSync(dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\n📁 Full results saved to: ${outputPath}`);

  // Generate migration SQL template
  const migrationPath = join(__dirname, '../audit-results/question-input-migration.sql');
  let migrationSQL = `-- ============================================
-- QUESTION INPUT TYPE MIGRATION
-- Generated: ${new Date().toISOString()}
-- ============================================
-- 
-- This migration updates custom_questions to use proper input types
-- based on the audit recommendations.
-- 
-- INPUT TYPES:
-- - range_buttons: Preset ranges for discrete counts
-- - slider: Continuous values with min/max/step
-- - multiselect: Checkbox grid for multiple selections
-- - select: Single choice (buttons ≤6, dropdown >6)
-- - toggle: Yes/No boolean
-- - number_input: Direct numeric entry
-- ============================================

`;

  for (const [slug, questions] of Object.entries(groupedByUseCase)) {
    const needsUpdate = questions.filter(q => q.needs_update);
    if (needsUpdate.length === 0) continue;

    migrationSQL += `\n-- ${slug.toUpperCase()}\n`;
    migrationSQL += `-- ${'='.repeat(40)}\n`;

    for (const q of needsUpdate) {
      const configJSON = q.recommended_config ? JSON.stringify(q.recommended_config) : 'null';
      migrationSQL += `
UPDATE custom_questions 
SET 
  question_type = '${q.recommended_type}',
  options = '${configJSON}'::jsonb
WHERE field_name = '${q.field_name}' 
  AND use_case_id = (SELECT id FROM use_cases WHERE slug = '${slug}');
`;
    }
  }

  fs.writeFileSync(migrationPath, migrationSQL);
  console.log(`📁 Migration SQL saved to: ${migrationPath}`);

  // Final stats
  const totalNeedsUpdate = results.filter(r => r.needs_update).length;
  const totalQuestions = results.length;
  console.log(`\n\n========================================`);
  console.log(`SUMMARY: ${totalNeedsUpdate}/${totalQuestions} questions need updates`);
  console.log(`========================================`);
}

// Run
runAudit().catch(console.error);
