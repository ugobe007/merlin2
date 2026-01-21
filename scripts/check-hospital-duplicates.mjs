#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  // Get hospital use case
  const { data: hospital } = await supabase
    .from('use_cases')
    .select('id, name, slug')
    .eq('slug', 'hospital')
    .single();

  console.log('\n=== HOSPITAL QUESTIONS AUDIT ===\n');
  console.log('Hospital ID:', hospital.id);

  // Get all questions
  const { data: questions } = await supabase
    .from('custom_questions')
    .select('id, field_name, question_text, question_type, display_order, section_name')
    .eq('use_case_id', hospital.id)
    .order('display_order', { ascending: true });

  console.log(`\nTotal questions: ${questions.length}\n`);

  // Find duplicates related to electricity cost
  const electricityQuestions = questions.filter(q =>
    q.field_name?.toLowerCase().includes('electric') ||
    q.field_name?.toLowerCase().includes('bill') ||
    q.field_name?.toLowerCase().includes('cost') ||
    q.field_name?.toLowerCase().includes('spend') ||
    q.question_text?.toLowerCase().includes('electric') ||
    q.question_text?.toLowerCase().includes('bill')
  );

  console.log('=== ELECTRICITY/COST QUESTIONS ===\n');
  electricityQuestions.forEach(q => {
    console.log(`Order ${q.display_order}: ${q.field_name}`);
    console.log(`  Question: ${q.question_text}`);
    console.log(`  Type: ${q.question_type} | Section: ${q.section_name || 'None'}\n`);
  });

  // Find bedCount question
  const bedCountQ = questions.find(q => q.field_name === 'bedCount');
  console.log('=== BED COUNT QUESTION ===\n');
  if (bedCountQ) {
    console.log(`Currently at position: ${bedCountQ.display_order}`);
    console.log(`Question: ${bedCountQ.question_text}`);
    console.log(`Should be: 1 or 2 (FIRST/SECOND question)\n`);
  } else {
    console.log('❌ No bedCount question found!\n');
  }

  // Show first 10 questions
  console.log('=== FIRST 10 QUESTIONS (Current Order) ===\n');
  questions.slice(0, 10).forEach((q, i) => {
    console.log(`${i + 1}. [Order ${q.display_order}] ${q.field_name || 'NULL'}`);
    console.log(`   ${q.question_text.substring(0, 60)}...\n`);
  });
}

main().catch(console.error);
