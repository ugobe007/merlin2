import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qdrtjnjftnnbkxxlppfq.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRqbmpmdG5uYmt4eGxwcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTYyMDAsImV4cCI6MjA0NzY3MjIwMH0.3tjclc2H8PxNQOT0NSkEqVf96GsRiPXSmqJFb8EhqCI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // First, let's see all use cases to find the hospital
  const { data: allUseCases } = await supabase
    .from("use_cases")
    .select("id, name, slug")
    .order("name");

  console.log("=== ALL USE CASES ===\n");
  allUseCases?.forEach(uc => {
    console.log(`${uc.slug}: ${uc.name}`);
  });
  
  // Find hospital-related ones
  console.log("\n=== HOSPITAL-RELATED ===\n");
  const hospitalCases = allUseCases?.filter(uc => 
    uc.name.toLowerCase().includes('hospital') || 
    uc.slug.toLowerCase().includes('hospital')
  );
  console.log(hospitalCases);
}

main();
