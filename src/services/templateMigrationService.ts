/**
 * Template Migration Service
 *
 * Purpose: One-time migration of useCaseTemplates.ts data to Supabase database
 *
 * What it does:
 * 1. Reads all 9 templates from useCaseTemplates.ts
 * 2. Inserts each template into use_case_templates table
 * 3. Inserts 100+ equipment items into equipment_database table
 * 4. Validates migration success
 * 5. Provides rollback capability
 *
 * Usage:
 * - Import in AdminDashboard.tsx
 * - Add "Migrate Templates" button
 * - Run once to populate database
 * - Keep useCaseTemplates.ts as fallback
 */

import { USE_CASE_TEMPLATES } from "../data/useCaseTemplates";
import { supabase } from "./supabaseClient";

export interface MigrationResult {
  success: boolean;
  templatesCreated: number;
  equipmentCreated: number;
  errors: string[];
  details: {
    templateId: string;
    name: string;
    equipmentCount: number;
  }[];
}

/**
 * Main migration function - migrates all templates to database
 */
export async function migrateTemplatesToDatabase(): Promise<MigrationResult> {
  console.log("🔄 Starting template migration to database...");
  console.log(`📊 Found ${USE_CASE_TEMPLATES.length} templates to migrate`);

  const result: MigrationResult = {
    success: true,
    templatesCreated: 0,
    equipmentCreated: 0,
    errors: [],
    details: [],
  };

  // Check if tables exist first
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    result.success = false;
    result.errors.push("❌ Database tables not found. Please run 03_USE_CASE_TABLES.sql first.");
    return result;
  }

  // Migrate each template
  for (const template of USE_CASE_TEMPLATES) {
    try {
      console.log(`\n📝 Migrating: ${template.name} (${template.slug})`);

      // Check if template already exists
      const { data: existing } = await supabase
        .from("use_case_templates")
        .select("id, slug, version")
        .eq("slug", template.slug)
        .single();

      if (existing) {
        console.log(
          `⚠️  Template ${template.slug} already exists (version ${existing.version}). Skipping...`
        );
        result.errors.push(`Template ${template.slug} already exists`);
        continue;
      }

      // 1. Insert template
      const { data: templateData, error: templateError } = await (supabase
        .from("use_case_templates") as any)
        .insert({
          slug: template.slug,
          name: template.name,
          description: template.description,
          icon: template.icon,
          image_url: template.image || null,
          category: template.category,
          required_tier: template.requiredTier,
          is_active: template.isActive,
          display_order: template.displayOrder,

          // JSONB fields - direct mapping
          power_profile: template.powerProfile,
          financial_params: template.financialParams,
          custom_questions: template.customQuestions || [],
          recommended_applications: template.recommendedApplications || [],

          // Solar compatibility - NEW field (will add later)
          solar_compatibility: null,

          // Industry standards - Extract from template if available
          industry_standards: {
            nrel: "NREL Commercial Reference Buildings",
            ashrae: "ASHRAE 90.1 Standard",
            ieee: "IEEE 2450 Battery Standards",
            epri: "EPRI Energy Storage Database",
            cbecs: "DOE/EIA CBECS Survey",
          },

          version: "1.0.0",
        })
        .select()
        .single();

      if (templateError) {
        console.error(`❌ Error migrating template ${template.slug}:`, templateError);
        result.success = false;
        result.errors.push(`Template ${template.slug}: ${templateError.message}`);
        continue;
      }

      console.log(`✅ Template created: ${templateData.id}`);
      result.templatesCreated++;

      // 2. Insert equipment (if exists)
      let equipmentCount = 0;
      if (template.equipment && template.equipment.length > 0) {
        console.log(`   📦 Migrating ${template.equipment.length} equipment items...`);

        const equipmentRecords = template.equipment.map((eq, index) => ({
          use_case_template_id: templateData.id,
          name: eq.name,
          power_kw: eq.powerKw,
          duty_cycle: eq.dutyCycle,
          description: eq.description || null,
          category: extractEquipmentCategory(eq.name),
          data_source: eq.description || null, // Use description as data source
          display_order: index,
          is_active: true,
          show_in_ui: true,
        }));

        const { data: equipmentData, error: equipmentError } = await supabase
          .from("equipment_database")
          .insert(equipmentRecords)
          .select();

        if (equipmentError) {
          console.error(`❌ Error migrating equipment for ${template.slug}:`, equipmentError);
          result.errors.push(`Equipment for ${template.slug}: ${equipmentError.message}`);
        } else {
          equipmentCount = equipmentData?.length || 0;
          result.equipmentCreated += equipmentCount;
          console.log(`   ✅ Created ${equipmentCount} equipment items`);
        }
      } else {
        console.log(`   ℹ️  No equipment items for this template`);
      }

      result.details.push({
        templateId: templateData.id,
        name: template.name,
        equipmentCount,
      });
    } catch (error) {
      console.error(`❌ Unexpected error migrating ${template.slug}:`, error);
      result.success = false;
      result.errors.push(`Unexpected error for ${template.slug}: ${error}`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Templates created: ${result.templatesCreated}/${USE_CASE_TEMPLATES.length}`);
  console.log(`✅ Equipment created: ${result.equipmentCreated}`);
  console.log(`❌ Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\n⚠️  ERRORS:");
    result.errors.forEach((err) => console.log(`   - ${err}`));
  }

  console.log("=".repeat(60) + "\n");

  return result;
}

/**
 * Check if required database tables exist
 */
async function checkTablesExist(): Promise<boolean> {
  try {
    // Try to query use_case_templates table
    const { error: templateError } = await supabase
      .from("use_case_templates")
      .select("id")
      .limit(1);

    // Try to query equipment_database table
    const { error: equipmentError } = await supabase
      .from("equipment_database")
      .select("id")
      .limit(1);

    if (templateError || equipmentError) {
      console.error("❌ Tables not found:", { templateError, equipmentError });
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error checking tables:", error);
    return false;
  }
}

/**
 * Extract equipment category from name
 */
function extractEquipmentCategory(name: string): string {
  const nameLower = name.toLowerCase();

  if (nameLower.includes("hvac") || nameLower.includes("air") || nameLower.includes("climate")) {
    return "HVAC";
  }
  if (nameLower.includes("light")) {
    return "Lighting";
  }
  if (
    nameLower.includes("kitchen") ||
    nameLower.includes("food") ||
    nameLower.includes("laundry")
  ) {
    return "Kitchen & Laundry";
  }
  if (nameLower.includes("medical") || nameLower.includes("equipment")) {
    return "Medical Equipment";
  }
  if (nameLower.includes("it") || nameLower.includes("server") || nameLower.includes("data")) {
    return "IT & Communications";
  }
  if (nameLower.includes("elevator") || nameLower.includes("transport")) {
    return "Transport";
  }
  if (nameLower.includes("emergency") || nameLower.includes("backup")) {
    return "Emergency Systems";
  }
  if (nameLower.includes("water") || nameLower.includes("pump")) {
    return "Water Systems";
  }
  if (nameLower.includes("security") || nameLower.includes("surveillance")) {
    return "Security";
  }

  return "Other";
}

/**
 * Validate migration - checks if all templates and equipment were created
 */
export async function validateMigration(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  console.log("🔍 Validating migration...");

  const issues: string[] = [];

  try {
    // Check template count
    const { data: templates, error: templateError } = await supabase
      .from("use_case_templates")
      .select("*");

    if (templateError) {
      issues.push(`Error fetching templates: ${templateError.message}`);
      return { valid: false, issues };
    }

    if (!templates || templates.length !== USE_CASE_TEMPLATES.length) {
      issues.push(
        `Template count mismatch: Expected ${USE_CASE_TEMPLATES.length}, found ${templates?.length || 0}`
      );
    }

    // Check each template has equipment
    for (const template of USE_CASE_TEMPLATES) {
      const dbTemplate = templates?.find((t) => t.slug === template.slug);

      if (!dbTemplate) {
        issues.push(`Template missing: ${template.slug}`);
        continue;
      }

      // Check equipment count
      const { data: equipment, error: eqError } = await supabase
        .from("equipment_database")
        .select("*")
        .eq("use_case_template_id", dbTemplate.id);

      if (eqError) {
        issues.push(`Error fetching equipment for ${template.slug}: ${eqError.message}`);
        continue;
      }

      const expectedCount = template.equipment?.length || 0;
      const actualCount = equipment?.length || 0;

      if (expectedCount !== actualCount) {
        issues.push(
          `Equipment count mismatch for ${template.slug}: Expected ${expectedCount}, found ${actualCount}`
        );
      }
    }

    console.log(`✅ Validation complete: ${issues.length} issues found`);
    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    return { valid: false, issues };
  }
}

/**
 * Rollback migration - deletes all migrated templates and equipment
 * USE WITH CAUTION!
 */
export async function rollbackMigration(): Promise<{
  success: boolean;
  templatesDeleted: number;
  equipmentDeleted: number;
  errors: string[];
}> {
  console.log("⚠️  ROLLBACK: Deleting all migrated templates...");

  const result = {
    success: true,
    templatesDeleted: 0,
    equipmentDeleted: 0,
    errors: [] as string[],
  };

  try {
    // Get all template IDs
    const { data: templates, error: fetchError } = await supabase
      .from("use_case_templates")
      .select("id, slug");

    if (fetchError) {
      result.errors.push(`Error fetching templates: ${fetchError.message}`);
      return result;
    }

    if (!templates || templates.length === 0) {
      console.log("ℹ️  No templates to delete");
      return result;
    }

    // Equipment will be deleted automatically via CASCADE
    const { error: deleteError } = await supabase
      .from("use_case_templates")
      .delete()
      .in(
        "id",
        templates.map((t) => t.id)
      );

    if (deleteError) {
      result.success = false;
      result.errors.push(`Error deleting templates: ${deleteError.message}`);
    } else {
      result.templatesDeleted = templates.length;
      console.log(`✅ Deleted ${templates.length} templates (equipment auto-deleted via CASCADE)`);
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Rollback error: ${error}`);
  }

  return result;
}

/**
 * Get migration status - checks what's in database vs what's in code
 */
export async function getMigrationStatus(): Promise<{
  templatesInCode: number;
  templatesInDatabase: number;
  equipmentInCode: number;
  equipmentInDatabase: number;
  needsMigration: boolean;
  details: {
    slug: string;
    name: string;
    inDatabase: boolean;
    equipmentInCode: number;
    equipmentInDatabase: number;
  }[];
}> {
  const status = {
    templatesInCode: USE_CASE_TEMPLATES.length,
    templatesInDatabase: 0,
    equipmentInCode: 0,
    equipmentInDatabase: 0,
    needsMigration: false,
    details: [] as any[],
  };

  // Count equipment in code
  USE_CASE_TEMPLATES.forEach((t) => {
    status.equipmentInCode += t.equipment?.length || 0;
  });

  try {
    // Check database
    const { data: templates, error: templateError } = await supabase
      .from("use_case_templates")
      .select("*");

    if (templateError) {
      console.error("Error fetching templates:", templateError);
      status.needsMigration = true;
      return status;
    }

    status.templatesInDatabase = templates?.length || 0;

    // Check each template
    for (const codeTemplate of USE_CASE_TEMPLATES) {
      const dbTemplate = templates?.find((t) => t.slug === codeTemplate.slug);

      let equipmentInDb = 0;
      if (dbTemplate) {
        const { data: equipment } = await supabase
          .from("equipment_database")
          .select("id")
          .eq("use_case_template_id", dbTemplate.id);

        equipmentInDb = equipment?.length || 0;
        status.equipmentInDatabase += equipmentInDb;
      }

      status.details.push({
        slug: codeTemplate.slug,
        name: codeTemplate.name,
        inDatabase: !!dbTemplate,
        equipmentInCode: codeTemplate.equipment?.length || 0,
        equipmentInDatabase: equipmentInDb,
      });
    }

    status.needsMigration =
      status.templatesInDatabase < status.templatesInCode ||
      status.equipmentInDatabase < status.equipmentInCode;
  } catch (error) {
    console.error("Error getting migration status:", error);
    status.needsMigration = true;
  }

  return status;
}
