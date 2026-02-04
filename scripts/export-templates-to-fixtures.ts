#!/usr/bin/env npx tsx
/**
 * export-templates-to-fixtures.ts
 * ================================
 * 
 * Exports DB templates to versioned JSON fixtures for golden testing.
 * 
 * Usage:
 *   npx tsx scripts/export-templates-to-fixtures.ts
 *   npx tsx scripts/export-templates-to-fixtures.ts --template=hotel
 *   npx tsx scripts/export-templates-to-fixtures.ts --all
 * 
 * Output:
 *   tests/fixtures/templates/<templateId>.json
 * 
 * Policy: These fixtures ARE the canonical business definitions.
 * Tests run against these. Drift requires an intentional golden update PR.
 */

// Load environment variables from .env file
import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.join(process.cwd(), "tests/fixtures/templates");
const GOLDENS_DIR = path.join(process.cwd(), "tests/goldens/magicfit");

// Supabase connection (uses env vars)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
  console.error("   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface TemplateFixture {
  /** Metadata for traceability */
  _meta: {
    exportedAt: string;
    exporterVersion: string;
    sourceTable: string;
  };
  /** Template identity (REQUIRED for golden keying) */
  templateId: string;
  templateVersion: string;
  industry: string;
  useCase: string;
  /** Template content */
  name: string;
  slug: string;
  description?: string;
  tier?: string;
  category?: string;
  /** Questions schema */
  questions: Array<{
    id: string;
    questionId: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    options?: unknown[];
    validation?: Record<string, unknown>;
  }>;
  /** Defaults (the fixture "data") */
  defaults: Record<string, unknown>;
  /** Parts structure (for gated wizard) */
  parts?: Array<{
    id: string;
    label: string;
    questionIds: string[];
  }>;
  /** Calculator binding */
  calculatorId?: string;
  calculatorVersion?: string;
}

// ---------------------------------------------------------------------------
// EXPORT FUNCTION
// ---------------------------------------------------------------------------

async function exportTemplate(slug: string): Promise<TemplateFixture | null> {
  console.log(`📦 Exporting template: ${slug}`);

  // 1. Fetch use case
  const { data: useCase, error: useCaseError } = await supabase
    .from("use_cases")
    .select("*")
    .eq("slug", slug)
    .single();

  if (useCaseError || !useCase) {
    console.error(`   ❌ Use case not found: ${slug}`);
    return null;
  }

  // 2. Fetch questions (join on use_case_id, not slug)
  const { data: questions, error: questionsError } = await supabase
    .from("custom_questions")
    .select("*")
    .eq("use_case_id", useCase.id)
    .order("display_order", { ascending: true });

  if (questionsError) {
    console.error(`   ❌ Error fetching questions for ${slug}:`, questionsError.message);
    return null;
  }

  // 3. Build defaults from questions
  const defaults: Record<string, unknown> = {};
  for (const q of questions || []) {
    if (q.default_value !== null && q.default_value !== undefined) {
      defaults[q.question_id] = q.default_value;
    }
  }

  // 4. Build parts structure (if available from use_case or derived)
  // For now, single "profile" part containing all questions
  const parts = [
    {
      id: "profile",
      label: "Profile",
      questionIds: (questions || []).map((q) => q.question_id),
    },
  ];

  // 5. Construct fixture
  const fixture: TemplateFixture = {
    _meta: {
      exportedAt: new Date().toISOString(),
      exporterVersion: "1.0.0",
      sourceTable: "use_cases + custom_questions",
    },
    templateId: useCase.id,
    templateVersion: useCase.updated_at || useCase.created_at || "1.0.0",
    industry: useCase.industry || slug,
    useCase: slug,
    name: useCase.name,
    slug: useCase.slug,
    description: useCase.description,
    tier: useCase.tier,
    category: useCase.category,
    questions: (questions || []).map((q) => ({
      id: q.id,
      questionId: q.question_id,
      label: q.label || q.question_id,
      type: q.input_type || "text",
      required: q.required ?? false,
      defaultValue: q.default_value,
      options: q.options,
      validation: q.validation,
    })),
    defaults,
    parts,
    calculatorId: useCase.calculator_id || `${slug}_load_v1`,
    calculatorVersion: "1.0.0",
  };

  console.log(`   ✅ Exported: ${fixture.name} (${fixture.questions.length} questions, ${Object.keys(defaults).length} defaults)`);
  return fixture;
}

async function exportAllTemplates(): Promise<void> {
  // Fetch all active use cases
  const { data: useCases, error } = await supabase
    .from("use_cases")
    .select("slug, name")
    .eq("is_active", true)
    .order("name");

  if (error || !useCases) {
    console.error("❌ Failed to fetch use cases:", error?.message);
    process.exit(1);
  }

  console.log(`\n📋 Found ${useCases.length} active use cases\n`);

  // Ensure directories exist
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.mkdirSync(GOLDENS_DIR, { recursive: true });

  let exported = 0;
  let failed = 0;

  for (const uc of useCases) {
    const fixture = await exportTemplate(uc.slug);
    if (fixture) {
      const filePath = path.join(FIXTURES_DIR, `${uc.slug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(fixture, null, 2));
      exported++;
    } else {
      failed++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Exported: ${exported} templates`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} templates`);
  }
  console.log(`📁 Output: ${FIXTURES_DIR}`);
  console.log(`═══════════════════════════════════════\n`);
}

async function exportSingleTemplate(slug: string): Promise<void> {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  const fixture = await exportTemplate(slug);
  if (fixture) {
    const filePath = path.join(FIXTURES_DIR, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fixture, null, 2));
    console.log(`\n✅ Exported to: ${filePath}\n`);
  } else {
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage:
  npx tsx scripts/export-templates-to-fixtures.ts [options]

Options:
  --all                 Export all active templates
  --template=<slug>     Export a single template by slug
  --help, -h            Show this help

Examples:
  npx tsx scripts/export-templates-to-fixtures.ts --all
  npx tsx scripts/export-templates-to-fixtures.ts --template=hotel
  npx tsx scripts/export-templates-to-fixtures.ts --template=car-wash
`);
    process.exit(0);
  }

  const templateArg = args.find((a) => a.startsWith("--template="));
  if (templateArg) {
    const slug = templateArg.split("=")[1];
    await exportSingleTemplate(slug);
    return;
  }

  if (args.includes("--all") || args.length === 0) {
    await exportAllTemplates();
    return;
  }

  console.error("❌ Unknown arguments. Use --help for usage.");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
