const url = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg';
const h = { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' };
const hj = { apikey: key, Authorization: `Bearer ${key}` };

async function count(t) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: h });
  const cr = r.headers.get('content-range');
  return cr ? cr.split('/')[1] : `(${r.status})`;
}

async function sample(t, n = 3) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=${n}&order=created_at.desc`, { headers: hj });
  if (r.status !== 200) return [];
  return r.json();
}

const tables = ['wizard_sessions','leads','smb_leads','page_views','saved_quotes','widget_usage','contract_telemetry','rfqs','shared_quotes','activity_logs'];
console.log('=== COUNTS ===');
for (const t of tables) {
  const c = await count(t);
  console.log(`  ${t}: ${c}`);
}

console.log('\n=== LEADS ===');
const leads = await sample('leads', 10);
leads.forEach(l => console.log(JSON.stringify(l)));

console.log('\n=== SMB_LEADS ===');
const smb = await sample('smb_leads', 10);
smb.forEach(l => console.log(JSON.stringify(l)));

console.log('\n=== WIZARD SESSIONS (recent 8) ===');
const ws = await sample('wizard_sessions', 8);
ws.forEach(l => console.log(JSON.stringify({ id: l.id, industry: l.industry, step: l.current_step, completed: l.completed, created_at: l.created_at })));

console.log('\n=== PAGE VIEWS by path (top 15) ===');
const pv = await fetch(`${url}/rest/v1/page_views?select=path&limit=2000`, { headers: hj }).then(r => r.json());
const paths = {};
pv.forEach(p => { paths[p.path] = (paths[p.path] || 0) + 1; });
Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([p, c]) => console.log(`  ${c}x  ${p}`));

console.log('\n=== PAGE VIEWS — unique sessions ===');
const sessions = new Set(pv.map(p => p.session_id));
console.log(`  Total page views: ${pv.length}`);
console.log(`  Unique sessions: ${sessions.size}`);
