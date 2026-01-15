import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qdrtjnjftnnbkxxlppfq.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnRqbmpmdG5uYmt4eGxwcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTYyMDAsImV4cCI6MjA0NzY3MjIwMH0.3tjclc2H8PxNQOT0NSkEqVf96GsRiPXSmqJFb8EhqCI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Get hospital use case ID first
  const { data: useCase } = await supabase
    .from("use_cases")
    .select("id, name, slug")
    .eq("slug", "hospital")
    .single();

  console.log("Hospital Use Case:", useCase);

  // Get all questions for hospital
  const { data: questions, error } = await supabase
    .from("custom_questions")
    .select("id, field_name, question_text, question_type, display_order, icon_name, section_name")
    .eq("use_case_id", useCase.id)
    .order("display_order", { ascending: true })
    .order("field_name", { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("\n=== ALL HOSPITAL QUESTIONS ===\n");
  console.log(`Total: ${questions.length} questions`);
  
  // Check for duplicate field_name
  const fieldCounts = {};
  questions.forEach(q => {
    fieldCounts[q.field_name] = (fieldCounts[q.field_name] || 0) + 1;
  });
  
  const duplicates = Object.entries(fieldCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log("\n🚨 DUPLICATE FIELD_NAMES FOUND:");
    duplicates.forEach(([field, count]) => {
      console.log(`  - ${field}: ${count} occurrences`);
    });
  } else {
    console.log("\n✅ No duplicate field_name values");
  }
  
  // Check for duplicate display_order
  const orderCounts = {};
  questions.forEach(q => {
    orderCounts[q.display_order] = (orderCounts[q.display_order] || 0) + 1;
  });
  
  const dupOrders = Object.entries(orderCounts).filter(([_, count]) => count > 1);
  if (dupOrders.length > 0) {
    console.log("\n⚠️ DUPLICATE DISPLAY_ORDER VALUES:");
    dupOrders.forEach(([order, count]) => {
      console.log(`  - Order ${order}: ${count} questions`);
    });
  }
  
  console.log("\n=== QUESTIONS LIST ===\n");
  
  // Show all questions
  questions.forEach((q, i) => {
    console.log(`${i+1}. [order=${q.display_order}] ${q.field_name}`);
    console.log(`   type: ${q.question_type} | icon: ${q.icon_name || 'NULL'} | section: ${q.section_name}`);
    console.log(`   text: ${q.question_text.substring(0, 60)}...`);
    console.log("");
  });
}

main();
