/**
 * Manual Cleanup of Junk Opportunities
 * 
 * Removes obviously invalid company names based on patterns
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Generic words that shouldn't be company names
const GENERIC_WORDS = new Set([
  'New', 'Data', 'News', 'Update', 'Report', 'Study', 'Article', 'Top',
  'Best', 'Latest', 'Breaking', 'Special', 'Featured', 'Trending',
  'Groundbreaking', 'Multibillion', 'First', 'Second', 'Third'
]);

// Geographic locations that shouldn't be company names
const LOCATIONS = new Set([
  'Ohio', 'Denver', 'Texas', 'California', 'Florida', 'Chicago',
  'Boston', 'Seattle', 'Portland', 'Austin', 'Dallas', 'Houston'
]);

async function cleanupJunk() {
  console.log('========================================');
  console.log('Running Manual Opportunity Cleanup');
  console.log('========================================\n');
  
  // Get all opportunities
  const { data: opps, error: fetchError } = await supabase
    .from('opportunities')
    .select('id, company_name');
    
  if (fetchError) {
    console.error('Error fetching opportunities:', fetchError);
    return;
  }
  
  console.log(`Total opportunities: ${opps?.length || 0}\n`);
  
  // Identify junk entries
  const idsToDelete: string[] = [];
  const reasons: Record<string, string[]> = {};
  
  opps?.forEach(opp => {
    const name = opp.company_name;
    let isJunk = false;
    let reason = '';
    
    // Check for generic words
    if (GENERIC_WORDS.has(name)) {
      isJunk = true;
      reason = 'Generic word';
    }
    // Check for locations
    else if (LOCATIONS.has(name)) {
      isJunk = true;
      reason = 'Geographic location';
    }
    // Check for too short (< 2 chars)
    else if (name.length < 2) {
      isJunk = true;
      reason = 'Too short';
    }
    // Check for article fragments (starts with lowercase or common fragments)
    else if (/^(the|a|an|in|on|at|to|for|of|with)\s/i.test(name)) {
      isJunk = true;
      reason = 'Article fragment';
    }
    
    if (isJunk) {
      idsToDelete.push(opp.id);
      if (!reasons[reason]) reasons[reason] = [];
      reasons[reason].push(name);
    }
  });
  
  console.log(`Found ${idsToDelete.length} junk entries:\n`);
  
  for (const [reason, names] of Object.entries(reasons)) {
    console.log(`${reason}: ${names.length} entries`);
    names.forEach(name => console.log(`  - "${name}"`));
    console.log();
  }
  
  if (idsToDelete.length === 0) {
    console.log('No junk entries to clean up!');
    return;
  }
  
  console.log(`\nDeleting ${idsToDelete.length} entries...`);
  
  const { error: deleteError } = await supabase
    .from('opportunities')
    .delete()
    .in('id', idsToDelete);
    
  if (deleteError) {
    console.error('Error deleting opportunities:', deleteError);
    return;
  }
  
  console.log('✓ Cleanup complete\n');
  
  // Show remaining count
  const { count } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Remaining opportunities: ${count}`);
}

cleanupJunk().catch(console.error);
