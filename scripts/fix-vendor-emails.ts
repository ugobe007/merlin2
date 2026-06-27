/**
 * Fix vendors missing notification_email + check notification errors.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Fetch all approved vendors and fix missing notification_email
const { data: vendors } = await sb
  .from('vendors')
  .select('id, company_name, email, notification_email')
  .eq('status', 'approved');

console.log(`\nApproved vendors (${vendors?.length ?? 0}):`);
let fixed = 0;
for (const v of vendors ?? []) {
  const hasNotifEmail = !!v.notification_email;
  const hasEmail = !!v.email;
  const icon = hasNotifEmail ? '✓' : hasEmail ? '→' : '✗';
  console.log(`  ${icon} ${v.company_name}: notification_email=${v.notification_email ?? 'NULL'}, email=${v.email ?? 'NULL'}`);
  
  if (!hasNotifEmail && hasEmail) {
    const { error } = await sb
      .from('vendors')
      .update({ notification_email: v.email })
      .eq('id', v.id);
    if (!error) {
      fixed++;
      console.log(`    ✓ Fixed: set notification_email = ${v.email}`);
    } else {
      console.log(`    ✗ Error: ${error.message}`);
    }
  }
}

console.log(`\nFixed ${fixed} vendors missing notification_email.`);
