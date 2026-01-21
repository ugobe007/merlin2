# Smoke Test - Quick Run Guide

## Automated Database Test

The automated test script (`scripts/smoke-test-all-industries.ts`) requires Supabase credentials.

**Quick Alternative - Manual Database Check:**

```bash
# Option 1: Check via browser console on running app
# 1. Open http://localhost:5179/wizard-v6
# 2. Open DevTools Console (F12)
# 3. Paste this:

const testIndustries = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  const { data: industries } = await supabase
    .from('use_cases')
    .select('id, slug, name')
    .eq('is_active', true);
  
  console.log(`Found ${industries.length} active industries:`);
  
  for (const ind of industries) {
    const { data: questions } = await supabase
      .from('custom_questions')
      .select('id, question_tier')
      .eq('use_case_id', ind.id)
      .eq('is_active', true);
    
    const essential = questions?.filter(q => q.question_tier === 'essential').length || 0;
    const total = questions?.length || 0;
    const status = total > 0 && essential >= 3 ? '✅' : '❌';
    
    console.log(`${status} ${ind.name.padEnd(30)} - ${total} questions, ${essential} essential`);
  }
};

testIndustries();
```

## OR: Simplified CLI Test (no Supabase needed)

Check TypeScript compilation and industry logic:

```bash
# 1. Build check (catches type errors)
npm run build

# 2. Check industry-specific validation logic
grep -A 20 "Industry-specific requirements" src/components/wizard/v6/step3/step3Validator.ts

# 3. Check question loading logic
grep -A 30 "Dynamic questions loading" src/components/wizard/CompleteStep3Component.tsx
```

## Manual Testing (Fastest & Most Reliable)

See `MANUAL_SMOKE_TEST_CHECKLIST.md` for full manual testing protocol.

**Quick 5-minute test:**
1. Start dev server: `npm run dev`
2. Open: http://localhost:5179/wizard-v6
3. Test Data Center use case (Steps 1-3)
4. Watch console for `📊 Step 3 Validity:` logs
5. Verify Next button enables after answering 3-4 questions

If Data Center works → likely all industries work (same code path)
If Data Center fails → critical bug, do not deploy
