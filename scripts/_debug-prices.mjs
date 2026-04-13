import pg from 'pg';
const { Client } = pg;
const c = new Client({ host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432, database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P', ssl: { rejectUnauthorized: false } });
await c.connect();

// Find articles that have price text in content or title
const r = await c.query(`
  SELECT id, title, prices_extracted, LEFT(content, 400) c
  FROM scraped_articles
  WHERE (content ~* '\\$[0-9]+.*kWh' OR title ~* '\\$[0-9]+.*kW' OR content ~* '\\$[0-9]+.*\\/W')
  ORDER BY created_at DESC
  LIMIT 5
`);

for (const row of r.rows) {
  console.log('title:', row.title);
  console.log('prices_extracted:', JSON.stringify(row.prices_extracted));
  console.log('content snippet:', row.c?.slice(0, 200));
  console.log('---');
}

await c.end();
