/**
 * API smoke test — starts the Express app on a random port,
 * hits every route family, prints results, exits.
 */
import { createServer } from 'http';

process.env.VERCEL = ''; // allow the listen() branch to be skipped; we manage server ourselves

const { default: app } = await import('../server/index.js');

const server = createServer(app);

await new Promise(r => server.listen(0, '127.0.0.1', r));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

console.log(`\n🔬 Smoke tests — server on :${port}\n`);

const tests = [
  ['GET', '/api/health'],
  ['GET', '/api/places/autocomplete?input=Austin'],
  ['GET', '/api/location/resolve?zip=78701'],
  ['GET', '/api/templates'],
  ['GET', '/api/telemetry/ping'],
  ['GET', '/api/partner/v1/health'],
  ['GET', '/api/epc/search'],
  ['GET', '/api/sales-agent/leads'],
  ['GET', '/api/opportunities'],
  ['GET', '/health'],
  // verify old sub-path catch-alls still resolve via the single top-level handler
  ['GET', '/api/quote/estimate'],
];

let passed = 0, failed = 0;

for (const [method, path] of tests) {
  try {
    const res = await fetch(base + path, { method });
    // anything < 500 is "the route exists and responded" — auth/param errors (401/400/404) are fine
    const ok = res.status < 500;
    console.log(`${ok ? '✅' : '❌'}  ${String(res.status).padEnd(4)} ${method} ${path}`);
    ok ? passed++ : failed++;
  } catch (e) {
    console.log(`❌  ERR  ${method} ${path}  (${e.message})`);
    failed++;
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
server.close();
process.exit(failed > 0 ? 1 : 0);
