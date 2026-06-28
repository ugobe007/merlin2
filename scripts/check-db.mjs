#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const [p, u, sq, opp] = await Promise.all([
  sb.from('user_profiles').select('id, email, tier, created_at').limit(5),
  sb.from('users').select('id, email, tier').limit(5),
  sb.from('saved_quotes').select('id', { count: 'exact', head: true }),
  sb.from('opportunities').select('id', { count: 'exact', head: true }),
]);

console.log('user_profiles rows:', p.data?.length ?? 0, '| error:', p.error?.message ?? 'none');
console.log('users rows:        ', u.data?.length ?? 0, '| error:', u.error?.message ?? 'none');
console.log('saved_quotes count:', sq.count, '| error:', sq.error?.message ?? 'none');
console.log('opportunities count:', opp.count, '| error:', opp.error?.message ?? 'none');
console.log('\nSample user_profiles:', JSON.stringify(p.data?.slice(0, 3), null, 2));
console.log('Sample users:', JSON.stringify(u.data?.slice(0, 3), null, 2));
