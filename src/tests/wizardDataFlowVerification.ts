/**
 * WIZARD DATA FLOW VERIFICATION TEST
 * ===================================
 * Traces values from database questions → wizard state → loadCalculator
 *
 * Run: npx tsx src/tests/wizardDataFlowVerification.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fvmpmozybmtzjvikrctq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0"
);

// ============================================================================
// LOAD CALCULATOR FIELD EXPECTATIONS
// These are the field names loadCalculator.ts looks for
// ============================================================================

const LOAD_CALCULATOR_FIELD_EXPECTATIONS: Record<string, string[]> = {
  // per_unit industries
  hotel: ["roomCount", "rooms"],
  hospital: ["bedCount", "beds"],
  apartment: ["totalUnits", "unitCount", "units"],
  "gas-station": ["dispenserCount", "fuelPositions"],

  // per_sqft industries - ALL sqft variations
  manufacturing: ["manufacturingSqFt", "squareFeet", "squareFootage", "totalSqFt"],
  warehouse: ["warehouseSqFt", "squareFeet", "squareFootage", "totalSqFt"],
  office: ["officeSqFt", "squareFeet", "squareFootage", "totalSqFt"],
  retail: ["retailSqFt", "storeSqFt", "squareFeet", "squareFootage"],
  "shopping-center": ["mallSqFt", "glaSqFt", "squareFeet", "squareFootage"],
  government: ["governmentSqFt", "totalSqFt", "squareFeet"],
  airport: ["terminalSqFt", "squareFeet", "squareFootage"],
  casino: ["gamingFloorSqFt", "totalSqFt", "squareFeet"],
  "indoor-farm": ["growingAreaSqFt", "squareFeet", "squareFootage"],
  college: ["totalSqFt", "squareFeet", "squareFootage"],
  "cold-storage": ["refrigeratedSqFt", "squareFeet", "squareFootage"],
  agricultural: ["squareFeet", "totalAcres", "farmAcres"],
  residential: ["squareFeet", "squareFootage"],
  restaurant: ["squareFeet", "squareFootage", "storeSqFt"],

  // custom industries
  "car-wash": [
    "bayCount",
    "washBays",
    "vacuumStations",
    "blowerCount",
    "waterHeaterType",
    "waterReclaim",
  ],
  "data-center": ["itLoadKW", "totalITLoad", "powerCapacity", "pue", "pueTarget", "rackCount"],
  "ev-charging": ["level2Count", "dcFastCount", "ultraFastCount"],
  heavy_duty_truck_stop: ["mcsChargers", "dieselLanes", "parkingSpaces"],
  microgrid: ["sitePeakLoad", "connectedBuildings"],
};

// ============================================================================
// TEST: Verify database questions have loadCalculator-expected fields
// ============================================================================

async function verifyDataFlow() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔍 WIZARD DATA FLOW VERIFICATION");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const issues: { slug: string; field: string; hasInDb: boolean; dbFields: string[] }[] = [];

  for (const [slug, expectedFields] of Object.entries(LOAD_CALCULATOR_FIELD_EXPECTATIONS)) {
    // Normalize slug for DB lookup (dash vs underscore)
    const dbSlug = slug.includes("-") ? slug : slug.replace(/_/g, "-");

    // Get use case
    const { data: useCase, error: ucError } = await supabase
      .from("use_cases")
      .select("id, slug")
      .eq("slug", dbSlug)
      .single();

    if (ucError || !useCase) {
      console.log(`⚠️  ${slug}: Use case not found (slug: ${dbSlug})`);
      continue;
    }

    // Get all field names for this use case
    const { data: questions, error: qError } = await supabase
      .from("custom_questions")
      .select("field_name")
      .eq("use_case_id", useCase.id);

    if (qError || !questions) {
      console.log(`⚠️  ${slug}: Questions fetch error`);
      continue;
    }

    const dbFields = questions.map((q) => q.field_name);

    // Check if at least ONE expected field exists in database
    const hasMatchingField = expectedFields.some((f) => dbFields.includes(f));

    if (hasMatchingField) {
      const matchedFields = expectedFields.filter((f) => dbFields.includes(f));
      console.log(`✅ ${slug.padEnd(20)} → Found: ${matchedFields.join(", ")}`);
    } else {
      console.log(`❌ ${slug.padEnd(20)} → MISSING! Expected: ${expectedFields.join(" OR ")}`);
      console.log(`   DB has: ${dbFields.join(", ")}`);
      issues.push({ slug, field: expectedFields[0], hasInDb: false, dbFields });
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(
    `Total industries checked: ${Object.keys(LOAD_CALCULATOR_FIELD_EXPECTATIONS).length}`
  );
  console.log(`Issues found: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\n🔧 FIXES NEEDED:");
    issues.forEach((i) => {
      console.log(
        `   ${i.slug}: Add '${i.field}' question OR update loadCalculator to use '${i.dbFields[0]}'`
      );
    });
  } else {
    console.log("\n🎉 All field names match! Data flow is valid.");
  }
}

verifyDataFlow();
