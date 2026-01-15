import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qdrtjnjftnnbkxxlppfq.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRqbmpmdG5uYmt4eGxwcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTYyMDAsImV4cCI6MjA0NzY3MjIwMH0.3tjclc2H8PxNQOT0NSkEqVf96GsRiPXSmqJFb8EhqCI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check tables that exist
  console.log("=== Checking tables ===\n");
  
  // Try use_cases with no filters
  const { data: d1, error: e1 } = await supabase
    .from("use_cases")
    .select("id, name, slug, is_active")
    .limit(5);
  
  console.log("use_cases results:", d1);
  if (e1) console.log("Error:", e1);
  
  // Try custom_questions
  const { data: d2, error: e2 } = await supabase
    .from("custom_questions")
    .select("id, field_name, use_case_id")
    .limit(5);
  
  console.log("\ncustom_questions results:", d2);
  if (e2) console.log("Error:", e2);
  
  // Get some use_case_ids from custom_questions
  const { data: d3 } = await supabase
    .from("custom_questions")
    .select("use_case_id")
    .limit(100);
  
  const uniqueIds = [...new Set(d3?.map(x => x.use_case_id) || [])];
  console.log("\nUnique use_case_ids in custom_questions:", uniqueIds);
  
  // If we have use_case_ids, look them up
  if (uniqueIds.length > 0) {
    for (const id of uniqueIds.slice(0, 3)) {
      const { data: uc } = await supabase
        .from("use_cases")
        .select("id, name, slug")
        .eq("id", id)
        .single();
      console.log(`  ${id} => ${uc?.name || 'NOT FOUND'} (${uc?.slug})`);
    }
  }
}

main().catch(console.error);
