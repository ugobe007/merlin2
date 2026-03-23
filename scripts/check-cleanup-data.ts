/**
 * Check actual opportunities data to understand cleanup needs
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

async function checkData() {
  console.log('=== CHECKING OPPORTUNITY DATA ===\n');
  
  // Get recent opportunities
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select('company_name, confidence_score, signals')
    .order('created_at', { ascending: false })
    .limit(30);
    
  if (error) {
    console.error('Error fetching opportunities:', error);
    return;
  }
  
  console.log(`Total checked: ${opps?.length || 0}\n`);
  
  // Analyze patterns
  const junkPatterns = {
    tooShort: opps?.filter(o => o.company_name.length < 3) || [],
    singleWord: opps?.filter(o => !o.company_name.includes(' ')) || [],
    startsWithNumber: opps?.filter(o => /^\d/.test(o.company_name)) || [],
    allCaps: opps?.filter(o => o.company_name === o.company_name.toUpperCase() && o.company_name.length > 2) || [],
    genericWords: opps?.filter(o => ['New', 'Data', 'News', 'Update', 'Report', 'Study', 'Article'].includes(o.company_name)) || [],
  };
  
  console.log('JUNK PATTERNS FOUND:');
  console.log(`- Too Short (<3 chars): ${junkPatterns.tooShort.length}`);
  console.log(`- Single Word: ${junkPatterns.singleWord.length}`);
  console.log(`- Starts with Number: ${junkPatterns.startsWithNumber.length}`);
  console.log(`- All Caps: ${junkPatterns.allCaps.length}`);
  console.log(`- Generic Words: ${junkPatterns.genericWords.length}\n`);
  
  if (junkPatterns.genericWords.length > 0) {
    console.log('Generic word examples:');
    junkPatterns.genericWords.forEach(o => console.log(`  - "${o.company_name}"`));
    console.log();
  }
  
  if (junkPatterns.singleWord.length > 0) {
    console.log('Single word examples (first 10):');
    junkPatterns.singleWord.slice(0, 10).forEach(o => console.log(`  - "${o.company_name}"`));
    console.log();
  }
  
  if (junkPatterns.tooShort.length > 0) {
    console.log('Too short examples:');
    junkPatterns.tooShort.forEach(o => console.log(`  - "${o.company_name}" (${o.company_name.length} chars)`));
    console.log();
  }
}

checkData().catch(console.error);
