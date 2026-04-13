import pg from 'pg';
const { Client } = pg;
const c = new Client({ host: 'db.fvmpmozybmtzjvikrctq.supabase.co', port: 5432, database: 'postgres', user: 'postgres', password: 'YSyHG0FABFExsH9P', ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='scraped_articles' ORDER BY ordinal_position");
r.rows.forEach(row => console.log(row.column_name, '->', row.data_type));
await c.end();
