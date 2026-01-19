/**
 * Generate SQL to fix ALL display_order duplicates
 * Output: SQL statements to run in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://fvmpmozybmtzjvikrctq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODIyOTAsImV4cCI6MjA3Nzg1ODI5MH0.ACqSuHx_-uvrK6-e0sXQO5AmHlA2K0BQUIT3dMRQS_0'
);

// Section priority for ordering
const SECTION_PRIORITY = [
  'Facility Basics', 'Farm Basics', 'Property Basics', 'Casino Basics', 'Airport Basics',
  'Cold Storage Basics', 'Campus Basics', 'Gas Station Basics', 'Government Basics',
  'Truck Stop Basics', 'Hospital Basics', 'Indoor Farm Basics', 'Manufacturing Basics',
  'Microgrid Basics', 'Office Basics', 'Home Basics', 'Retail Basics', 'Mall Basics',
  'Warehouse Basics', 'Building Basics',
  'Operations', 'Building Systems', 'Equipment & Operations',
  'Equipment', 'Amenities',
  'Energy Profile', 'Energy & Power',
  'Existing Infrastructure',
  'Solar & Storage Interest',
  'Goals'
];

function getSectionPriority(sectionName) {
  if (!sectionName) return 999;
  const index = SECTION_PRIORITY.findIndex(s => 
    sectionName.toLowerCase().includes(s.toLowerCase().replace(/ Basics$/, '').toLowerCase()) ||
    s.toLowerCase().includes(sectionName.toLowerCase())
  );
  return index >= 0 ? index : 100;
}

async function generateSQL() {
  console.log('Generating SQL...\n');

  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('is_active', true)
    .order('slug');

  let sql = `-- FIX ALL DISPLAY_ORDER DUPLICATES
-- Generated: ${new Date().toISOString()}
-- Run this in Supabase SQL Editor

`;

  for (const uc of useCases) {
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('id, field_name, display_order, section_name')
      .eq('use_case_id', uc.id);

    if (!questions || questions.length === 0) continue;

    // Check if there are duplicates
    const uniqueOrders = new Set(questions.map(q => q.display_order)).size;
    if (uniqueOrders === questions.length) {
      sql += `-- ${uc.slug}: OK (${questions.length} unique)\n\n`;
      continue;
    }

    // Sort by section priority, then by current display_order
    const sorted = [...questions].sort((a, b) => {
      const aPriority = getSectionPriority(a.section_name);
      const bPriority = getSectionPriority(b.section_name);
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a.display_order || 0) - (b.display_order || 0);
    });

    sql += `-- ${uc.slug}: Fixing ${questions.length} questions\n`;
    
    for (let i = 0; i < sorted.length; i++) {
      const newOrder = i + 1;
      const q = sorted[i];
      sql += `UPDATE custom_questions SET display_order = ${newOrder} WHERE id = '${q.id}';\n`;
    }
    sql += '\n';
  }

  // Write to file
  const filename = 'database/migrations/20260119_fix_all_display_orders_by_id.sql';
  fs.writeFileSync(filename, sql);
  console.log(`✅ SQL written to: ${filename}`);
  console.log(`   Total size: ${sql.length} bytes`);
  console.log(`\n📋 Copy the contents of this file and run in Supabase SQL Editor`);
}

generateSQL().catch(console.error);
