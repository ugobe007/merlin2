/**
 * Check Opportunities Data Quality
 * 
 * Queries the opportunities table to find junk company names and patterns
 * to filter out.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkOpportunities() {
  console.log('========================================');
  console.log('Checking Opportunities Data Quality');
  console.log('========================================\n');
  
  // Get all opportunities
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('Error fetching opportunities:', error);
    return;
  }
  
  console.log(`Total opportunities found: ${opportunities?.length || 0}\n`);
  
  if (!opportunities || opportunities.length === 0) {
    console.log('No opportunities found. Table may be empty.');
    return;
  }
  
  // Group by company name
  const companyGroups = opportunities.reduce((acc, opp) => {
    const name = opp.company_name;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(opp);
    return acc;
  }, {} as Record<string, any[]>);
  
  console.log('\n=== COMPANY NAME FREQUENCY ===');
  const sorted = Object.entries(companyGroups)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 30);
  
  sorted.forEach(([name, opps]) => {
    console.log(`${opps.length}x - "${name}"`);
  });
  
  // Check for patterns
  console.log('\n=== SUSPICIOUS PATTERNS ===');
  
  const patterns = {
    'Too Short': opportunities.filter(o => o.company_name.length < 3),
    'All Caps': opportunities.filter(o => o.company_name === o.company_name.toUpperCase() && o.company_name.length > 5),
    'Has URLs': opportunities.filter(o => /https?:\/\//.test(o.company_name)),
    'Has Email': opportunities.filter(o => /@/.test(o.company_name)),
    'Special Chars': opportunities.filter(o => /[<>{}[\]\\|]/.test(o.company_name)),
    'Numbers Only': opportunities.filter(o => /^\d+$/.test(o.company_name)),
    'Starts with Number': opportunities.filter(o => /^\d/.test(o.company_name)),
  };
  
  Object.entries(patterns).forEach(([pattern, matches]) => {
    if (matches.length > 0) {
      console.log(`\n${pattern} (${matches.length}):`);
      matches.slice(0, 5).forEach(m => {
        console.log(`  - "${m.company_name}" (${m.source_name})`);
      });
      if (matches.length > 5) {
        console.log(`  ... and ${matches.length - 5} more`);
      }
    }
  });
  
  // Sample some opportunities
  console.log('\n=== SAMPLE OPPORTUNITIES ===');
  opportunities.slice(0, 10).forEach(opp => {
    console.log(`\nCompany: "${opp.company_name}"`);
    console.log(`  Description: ${opp.description.slice(0, 100)}...`);
    console.log(`  Source: ${opp.source_name}`);
    console.log(`  Signals: ${opp.signals.join(', ')}`);
    console.log(`  Confidence: ${opp.confidence_score}`);
  });
}

checkOpportunities()
  .then(() => {
    console.log('\n✓ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
