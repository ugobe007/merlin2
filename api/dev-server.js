import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import handler from './analyze-site.js';

const PORT = Number(process.env.API_PORT || 8787);

function loadLocalEnv(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadLocalEnv('.env');
loadLocalEnv('.env.local');

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);

  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://127.0.0.1:3002');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true, service: 'merlin-epc-api' });
    return;
  }

  if (url.pathname === '/api/analyze-site') {
    await handler(request, response);
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[api] Merlin EPC API listening on http://127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
