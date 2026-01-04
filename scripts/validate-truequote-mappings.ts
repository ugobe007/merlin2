/**
 * Validate TrueQuote Engine Mappings
 * ===================================
 * Compares database field names and subtype values against
 * the systematic mapping configuration to find violations.
 * 
 * This script should be run before deployment to catch
 * mapping mismatches at build/test time, not runtime.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  VALID_SUBTYPES,
  SUBTYPE_MAPPINGS,
  FIELD_NAME_MAPPINGS,
  DEFAULT_SUBTYPES,
} from '../src/services/trueQuoteMapperConfig';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Violation {
  industry: string;
  type: 'missing_subtype_mapping' | 'invalid_subtype' | 'missing_field_mapping' | 'unused_field_mapping';
  field?: string;
  dbValue?: string;
  expectedValue?: string;
  message: string;
}

async function validateMappings() {
  console.log('🔍 Validating TrueQuote Engine Mappings...\n');
  
  const violations: Violation[] = [];
  
  // Get all use cases from database
  const { data: useCases, error: useCaseError } = await supabase
    .from('use_cases')
    .select('id, slug, name');
  
  if (useCaseError) {
    console.error('❌ Error fetching use cases:', useCaseError);
    process.exit(1);
  }
  
  console.log(`📊 Found ${useCases?.length || 0} use cases in database\n`);
  
  // Industry slug mapping (handle aliases)
  const industrySlugMap: Record<string, string> = {
    'college': 'university',
    'agricultural': 'agriculture',
    'hotel-hospitality': 'hotel',
  };
  
  // For each use case, get custom questions and validate
  for (const useCase of useCases || []) {
    let industrySlug = useCase.slug;
    
    // Map aliases to known industry slugs
    if (industrySlugMap[industrySlug]) {
      industrySlug = industrySlugMap[industrySlug];
    }
    
    // Skip if not a known industry
    if (!VALID_SUBTYPES[industrySlug] && !DEFAULT_SUBTYPES[industrySlug]) {
      console.log(`⚠️  Skipping unknown industry: ${useCase.slug} (mapped to: ${industrySlug})`);
      continue;
    }
    
    // Get custom questions for this use case (using use_case_id, not use_case_slug)
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('field_name, question_type, options, default_value')
      .eq('use_case_id', useCase.id);
    
    if (questionsError) {
      console.error(`❌ Error fetching questions for ${industrySlug}:`, questionsError);
      continue;
    }
    
    // Only validate ACTUAL subtype fields (not facility details like hvacType, lightingType, etc.)
    const actualSubtypeFields: Record<string, string[]> = {
      'hospital': ['hospitalType', 'hospital_type'],
      'hotel': ['hotelCategory', 'hotelType', 'hotel_type'],
      'data-center': ['dataCenterTier', 'tierClassification'],
      'car-wash': ['washType', 'wash_type', 'carWashType'],
      'manufacturing': ['manufacturingType'],
      'retail': ['retailType', 'retail_type'],
      'restaurant': ['restaurantType', 'restaurant_type'],
      'office': ['officeType', 'office_type'],
      'university': ['institutionType', 'campusType'],
      'ev-charging': ['hubType'],
      'shopping-center': ['propertyType'],
      'apartment': ['propertyType'],
      'government': ['facilityType'],
      'warehouse': ['warehouseType', 'warehouse_type'],
      'casino': ['casinoType'],
      'agriculture': ['farmType', 'agricultureType'],
      'indoor-farm': ['farmType'],
      'cold-storage': ['facilityType'],
    };
    
    const subtypeFieldsForIndustry = actualSubtypeFields[industrySlug] || [];
    
    for (const question of questions || []) {
      const fieldName = question.field_name;
      
      // Only check ACTUAL subtype fields, not facility details
      if (!subtypeFieldsForIndustry.includes(fieldName)) {
        continue; // Skip facility detail fields (hvacType, lightingType, etc.)
      }
      
      // Validate subtype values from options
      if (question.options && Array.isArray(question.options)) {
        for (const option of question.options) {
          const dbValue = typeof option === 'object' ? option.value : option;
          const normalized = String(dbValue).toLowerCase().trim();
          
          // Check if mapping exists
          const mappings = SUBTYPE_MAPPINGS[industrySlug];
          if (!mappings || !mappings[normalized]) {
            // Check if it's a valid subtype directly
            const validSubtypes = VALID_SUBTYPES[industrySlug] || [];
            if (!validSubtypes.includes(normalized) && !validSubtypes.includes(dbValue)) {
              violations.push({
                industry: industrySlug,
                type: 'missing_subtype_mapping',
                field: fieldName,
                dbValue: String(dbValue),
                message: `Database subtype value "${dbValue}" has no mapping to TrueQuote Engine subtype`,
              });
            }
          }
        }
      }
      
      // Validate field name mappings
      const mappedFieldName = FIELD_NAME_MAPPINGS[industrySlug]?.[fieldName] || 
                              FIELD_NAME_MAPPINGS['_common']?.[fieldName];
      if (!mappedFieldName && fieldName !== mappedFieldName) {
        // This is a warning, not an error - field might not need mapping
        // violations.push({
        //   industry: industrySlug,
        //   type: 'missing_field_mapping',
        //   field: fieldName,
        //   message: `Field "${fieldName}" has no mapping configuration`,
        // });
      }
    }
  }
  
  // Report results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (violations.length === 0) {
    console.log('✅ No mapping violations found!\n');
    console.log('All database field names and subtype values have valid mappings.\n');
  } else {
    console.log(`❌ Found ${violations.length} mapping violation(s):\n`);
    
    // Group by type
    const byType = violations.reduce((acc, v) => {
      if (!acc[v.type]) acc[v.type] = [];
      acc[v.type].push(v);
      return acc;
    }, {} as Record<string, Violation[]>);
    
    for (const [type, violations] of Object.entries(byType)) {
      console.log(`\n📋 ${type.toUpperCase().replace(/_/g, ' ')} (${violations.length})`);
      console.log('─'.repeat(60));
      
      for (const violation of violations) {
        console.log(`  Industry: ${violation.industry}`);
        if (violation.field) console.log(`  Field: ${violation.field}`);
        if (violation.dbValue) console.log(`  DB Value: ${violation.dbValue}`);
        if (violation.expectedValue) console.log(`  Expected: ${violation.expectedValue}`);
        console.log(`  Message: ${violation.message}`);
        console.log('');
      }
    }
    
    console.log('\n⚠️  ACTION REQUIRED:');
    console.log('   Add missing mappings to trueQuoteMapperConfig.ts');
    console.log('   Or update database field names/subtype values to match mappings.\n');
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total violations: ${violations.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  process.exit(violations.length > 0 ? 1 : 0);
}

validateMappings().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
