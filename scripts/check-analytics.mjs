const url = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3ODU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg';

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function countTable(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { ...headers, Prefer: 'count=exact' }
  });
  const range = r.headers.get('content-range');
  if (r.status === 404 || r.status === 400) return `table not found (${r.status})`;
  return range ? range.split('/')[1] : `status ${r.status}`;
}

async function getUsers() {
  const r = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, { headers });
  const data = await r.json();
  return data?.users ?? data;
}

async function getSample(table, limit = 5) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=${limit}&order=created_at.desc`, { headers });
  if (r.status !== 200) return null;
  return r.json();
}

// Discover tables from OpenAPI
async function listTables() {
  const r = await fetch(`${url}/rest/v1/`, { headers });
  const text = await r.text();
  // Extract table names from paths
  const matches = text.match(/"\/([a-z_]+)":\{/g) || [];
  return matches.map(m => m.replace(/["\/:{]/g, ''));
}

console.log('=== MERLIN SUPABASE ANALYTICS ===\n');

try {
  const tables = await listTables();
  console.log('Tables found:', tables.join(', ') || 'none visible');
  console.log('');

  const users = await getUsers();
  const userList = Array.isArray(users) ? users : [];
  console.log(`Registered Users: ${userList.length}`);
  if (userList.length > 0) {
    userList.slice(0, 10).forEach(u => {
      console.log(`  - ${u.email} | created: ${u.created_at?.split('T')[0]} | last_sign_in: ${u.last_sign_in_at?.split('T')[0] ?? 'never'}`);
    });
  }
  console.log('');

  // Check likely tables
  const tablesToCheck = [
    'quotes', 'quote_submissions', 'quote_requests', 'saved_quotes',
    'page_views', 'sessions', 'visits', 'analytics', 'events', 'telemetry',
    'leads', 'contacts', 'demo_requests', 'pricing_plans', 'subscribers',
    'profiles', 'users'
  ];

  for (const t of tablesToCheck) {
    const count = await countTable(t);
    if (!count.includes('not found')) {
      console.log(`  ${t}: ${count} rows`);
      const sample = await getSample(t, 3);
      if (sample && sample.length > 0) {
        console.log(`    Sample keys: ${Object.keys(sample[0]).join(', ')}`);
        console.log(`    Latest: ${JSON.stringify(sample[0]).substring(0, 200)}`);
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
