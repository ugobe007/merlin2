import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAllIndustries() {
  // Get all active use cases
  const { data: useCases, error: ucErr } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('slug');
  
  if (ucErr) {
    console.log('Error fetching use cases:', ucErr.message);
    return;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('QUESTION AUDIT FOR ALL INDUSTRIES');
  console.log(`${'='.repeat(60)}\n`);
  
  const issues = [];
  
  for (const uc of useCases) {
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('field_name, question_text')
      .eq('use_case_id', uc.id)
      .order('display_order');
    
    if (!questions) continue;
    
    // Check for field_name duplicates
    const fieldCounts = {};
    questions.forEach(q => {
      const f = q.field_name || 'NULL';
      fieldCounts[f] = (fieldCounts[f] || 0) + 1;
    });
    
    const dupes = Object.entries(fieldCounts).filter(([, c]) => c > 1);
    
    // Check for similar question_text (semantic duplicates)
    const textSimilarity = [];
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const t1 = (questions[i].question_text || '').toLowerCase();
        const t2 = (questions[j].question_text || '').toLowerCase();
        if (t1 === t2 && t1.length > 5) {
          textSimilarity.push([questions[i].field_name, questions[j].field_name, t1]);
        }
      }
    }
    
    if (dupes.length > 0 || textSimilarity.length > 0) {
      console.log(`\n❌ ${uc.slug.toUpperCase()} (${questions.length} questions)`);
      
      if (dupes.length > 0) {
        console.log('   Field name duplicates:');
        dupes.forEach(([f, c]) => console.log(`     - ${f}: ${c} copies`));
        issues.push({ slug: uc.slug, type: 'field_dupe', count: dupes.length });
      }
      
      if (textSimilarity.length > 0) {
        console.log('   Identical question text (different field_names):');
        textSimilarity.forEach(([f1, f2, text]) => {
          console.log(`     - "${text.substring(0, 40)}..."`);
          console.log(`       Fields: ${f1} vs ${f2}`);
        });
        issues.push({ slug: uc.slug, type: 'text_dupe', count: textSimilarity.length });
      }
    } else {
      console.log(`✅ ${uc.slug} (${questions.length} questions) - Clean`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  if (issues.length === 0) {
    console.log('✅ All industries clean - no duplicates found!');
  } else {
    console.log(`⚠️ Found issues in ${issues.length} industries:`);
    issues.forEach(i => console.log(`   - ${i.slug}: ${i.type} (${i.count})`));
  }
}

checkAllIndustries().catch(console.error);
