import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: vendors, error } = await sb
  .from('vendors')
  .select('id,company_name,email,specialty,status,notification_email,webhook_url,lead_min_score')
  .limit(20);

console.log('VENDORS:');
console.table(vendors?.map(v => ({
  name: v.company_name,
  email: v.email,
  notif_email: v.notification_email,
  webhook: v.webhook_url ? '✓' : '—',
  specialty: v.specialty,
  status: v.status,
  min_score: v.lead_min_score,
})));
if (error) console.error('error:', error);

const { data: leads, error: le } = await sb
  .from('vendor_leads')
  .select('company_name,lead_category,bess_score,solar_score,generator_score,status')
  .order('created_at', { ascending: false })
  .limit(15);

console.log('\nRECENT VENDOR LEADS:');
console.table(leads);
if (le) console.error('leads error:', le);
