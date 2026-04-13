import pg from 'pg';
const { Client } = pg;
const c = new Client({ host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432, user: 'postgres', password: 'YSyHG0FABFExsH9P', database: 'postgres', ssl: { rejectUnauthorized: false }, family: 4 });
await c.connect();
const { rows } = await c.query("SELECT source_type, COUNT(*) as cnt, COUNT(*) FILTER (WHERE is_active) as active FROM market_data_sources GROUP BY source_type ORDER BY cnt DESC");
console.log('source types:', rows);

// Also check use_cases is_active
const { rows: uc } = await c.query("SELECT COUNT(*) FILTER (WHERE is_active) as active, COUNT(*) as total FROM use_cases");
console.log('use_cases active:', uc[0]);

// Check ssot_alerts recency
const { rows: alerts } = await c.query("SELECT created_at FROM ssot_alerts ORDER BY created_at DESC LIMIT 1");
console.log('latest ssot_alert:', alerts[0]);
await c.end();
