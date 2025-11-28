import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('calculation_formulas')
  .select('formula_key, variables')
  .limit(5)

console.log('Data:', data)
console.log('Error:', error)
