#!/usr/bin/env node
/**
 * RUN SYSTEM HEALTH CHECK
 * =======================
 * 
 * Command-line script to run comprehensive system health checks.
 * Can be scheduled for daily/weekly runs.
 * 
 * Usage:
 *   node scripts/run-health-check.mjs
 *   node scripts/run-health-check.mjs --json
 *   node scripts/run-health-check.mjs --save-report
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import health check (would need to be converted to ESM or use dynamic import)
// For now, we'll create a simplified version

async function runHealthCheck() {
  console.log('🔍 Running System Health Check...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: { total: 0, passed: 0, warnings: 0, failed: 0, errors: 0 }
  };
  
  // Check 1: Database Connection
  console.log('1. Checking database connection...');
  try {
    const { error } = await supabase.from('use_cases').select('id').limit(1);
    if (error) throw error;
    results.checks.push({ name: 'Database Connection', status: 'pass', message: 'Connected' });
    results.summary.passed++;
  } catch (error) {
    results.checks.push({ name: 'Database Connection', status: 'error', message: error.message });
    results.summary.errors++;
  }
  results.summary.total++;
  
  // Check 2: Backend Scraper
  console.log('2. Checking backend scraper...');
  try {
    const { data: sources, error } = await supabase
      .from('market_data_sources')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(5);
    
    if (error) throw error;
    const activeSources = sources?.length || 0;
    if (activeSources > 0) {
      results.checks.push({ name: 'Backend Scraper', status: 'pass', message: `${activeSources} active sources` });
      results.summary.passed++;
    } else {
      results.checks.push({ name: 'Backend Scraper', status: 'warning', message: 'No active sources' });
      results.summary.warnings++;
    }
  } catch (error) {
    results.checks.push({ name: 'Backend Scraper', status: 'error', message: error.message });
    results.summary.errors++;
  }
  results.summary.total++;
  
  // Check 3: Database Schemas
  console.log('3. Checking database schemas...');
  const criticalTables = ['use_cases', 'custom_questions', 'pricing_configurations', 'equipment_pricing'];
  let missingTables = [];
  
  for (const table of criticalTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === '42P01') {
        missingTables.push(table);
      }
    } catch (error) {
      // Ignore
    }
  }
  
  if (missingTables.length === 0) {
    results.checks.push({ name: 'Database Schemas', status: 'pass', message: 'All critical tables exist' });
    results.summary.passed++;
  } else {
    results.checks.push({ name: 'Database Schemas', status: 'fail', message: `Missing: ${missingTables.join(', ')}` });
    results.summary.failed++;
  }
  results.summary.total++;
  
  // Calculate overall score
  const overallScore = results.summary.total > 0
    ? Math.round((results.summary.passed / results.summary.total) * 100)
    : 0;
  
  results.overallScore = overallScore;
  results.overallStatus = overallScore >= 90 ? 'healthy' : overallScore >= 70 ? 'degraded' : 'critical';
  
  // Output results
  console.log('\n' + '═'.repeat(60));
  console.log('📊 HEALTH CHECK RESULTS');
  console.log('═'.repeat(60));
  console.log(`Overall Status: ${results.overallStatus.toUpperCase()}`);
  console.log(`Overall Score: ${overallScore}%`);
  console.log(`\nSummary:`);
  console.log(`  ✅ Passed: ${results.summary.passed}`);
  console.log(`  ⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`  ❌ Failed: ${results.summary.failed}`);
  console.log(`  🔴 Errors: ${results.summary.errors}`);
  console.log('\nDetailed Results:');
  results.checks.forEach((check, i) => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${i + 1}. ${icon} ${check.name}: ${check.message}`);
  });
  console.log('═'.repeat(60) + '\n');
  
  // Save to database if requested
  if (process.argv.includes('--save-report')) {
    try {
      await supabase.from('health_check_reports').insert({
        report_data: results,
        overall_status: results.overallStatus,
        overall_score: overallScore,
        created_at: new Date().toISOString()
      });
      console.log('✅ Report saved to database');
    } catch (error) {
      console.error('⚠️  Could not save report:', error.message);
    }
  }
  
  // JSON output if requested
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  }
  
  // Exit with appropriate code
  process.exit(results.overallStatus === 'critical' ? 1 : 0);
}

runHealthCheck().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});

