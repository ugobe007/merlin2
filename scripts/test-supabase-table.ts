import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function main() {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await sb.from('daily_deals').select('id').limit(1);
  console.log('data:', data);
  console.log('error:', error?.message ?? 'none');
}

main().catch(console.error);
