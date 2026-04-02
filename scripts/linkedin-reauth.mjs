#!/usr/bin/env node
/**
 * LinkedIn OAuth Re-Authorization Script
 * =======================================
 * Gets a fresh LinkedIn access token with BOTH scopes:
 *   - w_member_social      → post as personal profile
 *   - w_organization_social → post as Merlin Energy company page
 *
 * Usage:
 *   node scripts/linkedin-reauth.mjs
 *
 * Prerequisites:
 *   LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be in .env
 *   or set as environment variables.
 *
 * After running:
 *   1. Copy the access token printed at the end
 *   2. Set it as GitHub secret LINKEDIN_ACCESS_TOKEN
 *   3. Set LINKEDIN_ORG_URN = urn:li:organization:112979004
 */

import http from 'http';
import { exec, execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { URL } from 'url';

const ORG_URN = 'urn:li:organization:112979004'; // Merlin Energy LinkedIn page
const ENV_PATH = '.env';

// Load .env if present
function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
  const env = readFileSync(ENV_PATH, 'utf8');
  for (const line of env.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

// Update a key=value pair in .env in-place
function patchEnv(key, value) {
  let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  writeFileSync(ENV_PATH, content, 'utf8');
}

const CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:3333/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌  LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

// Scopes:
//   openid + profile + email    → identify the user
//   w_member_social             → post as personal profile (always available)
//   w_organization_social       → post as Merlin Energy company page (Community Management API — pending)
// NOTE: w_organization_social is excluded until LinkedIn approves the Community
// Management API — requesting it before approval crashes the OAuth consent page.
// Once approved, add it back and re-run this script.
const SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
  // 'w_organization_social',  // add back after LinkedIn approves Community Management API
].join(' ');

const authUrl =
  `https://www.linkedin.com/oauth/v2/authorization` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}`;

console.log('\n🔗 LinkedIn OAuth — Merlin Energy / Robert Christopher\n');
console.log('Scopes: openid profile email w_member_social');
console.log('(w_organization_social will be added once LinkedIn approves Community Management API)\n');
console.log('Opening browser for authorization...');
console.log('If it does not open automatically, paste this URL:\n');
console.log(authUrl + '\n');

// Open browser
const open = process.platform === 'darwin' ? 'open' : 'xdg-open';
exec(`${open} "${authUrl}"`);

// Local callback server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.end(`<h1>❌ Auth failed: ${error}</h1>`);
    console.error('Auth error:', error, url.searchParams.get('error_description'));
    server.close();
    return;
  }

  if (!code) {
    res.end('<h1>Waiting for authorization...</h1>');
    return;
  }

  // Exchange code for token
  console.log('\n✅ Authorization code received — exchanging for token...');
  res.end('<h1>✅ Authorized! Check your terminal for the token.</h1><p>You can close this window.</p>');
  server.close();

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const token = await tokenRes.json();

  if (!tokenRes.ok || !token.access_token) {
    console.error('❌ Token exchange failed:', JSON.stringify(token, null, 2));
    process.exit(1);
  }

  // Get person URN
  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = await meRes.json();

  const accessToken = token.access_token;
  const expiryDays  = Math.round((token.expires_in ?? 5184000) / 86400);
  const personUrn   = me.sub ? `urn:li:person:${me.sub}` : (process.env.LINKEDIN_PERSON_URN ?? '');

  // Check which scopes were actually granted
  const grantedScopes = token.scope ?? '';
  const hasOrgScope   = grantedScopes.includes('w_organization_social');
  const postingAs     = hasOrgScope ? `company page (${ORG_URN})` : `personal profile (${personUrn})`;

  console.log('\n' + '='.repeat(65));
  console.log('✅  FRESH LINKEDIN TOKEN');
  console.log('='.repeat(65));
  console.log(`\nScopes granted: ${grantedScopes || '(not reported by LinkedIn)'}`);
  if (hasOrgScope) {
    console.log('🎉 w_organization_social GRANTED — posts will go to Merlin Energy page!');
  } else {
    console.log('⚠️  w_organization_social NOT YET granted (Community Management API still pending)');
    console.log('   Posts will fall back to personal profile until LinkedIn approves.');
  }
  console.log(`\nPosting as: ${postingAs}`);
  console.log(`Token expires in: ${expiryDays} days`);

  // ── Patch .env ───────────────────────────────────────────────────────────
  console.log('\n📝 Updating .env...');
  patchEnv('LINKEDIN_ACCESS_TOKEN', accessToken);
  patchEnv('LINKEDIN_PERSON_URN',   personUrn);
  patchEnv('LINKEDIN_ORG_URN',      ORG_URN);
  console.log('   ✅ .env updated');

  // ── Update Fly.io secrets ────────────────────────────────────────────────
  console.log('\n🚀 Updating Fly.io secrets (merlin2)...');
  try {
    execSync(
      `fly secrets set LINKEDIN_ACCESS_TOKEN="${accessToken}" LINKEDIN_PERSON_URN="${personUrn}" LINKEDIN_ORG_URN="${ORG_URN}" -a merlin2`,
      { stdio: 'inherit' }
    );
    console.log('   ✅ Fly.io secrets updated (live immediately — no redeploy needed)');
  } catch (_e) {
    console.warn('   ⚠️  fly CLI failed — set manually:');
    console.log(`   fly secrets set LINKEDIN_ACCESS_TOKEN="${accessToken}" LINKEDIN_PERSON_URN="${personUrn}" LINKEDIN_ORG_URN="${ORG_URN}" -a merlin2`);
  }

  // ── Verify token ─────────────────────────────────────────────────────────
  console.log('\n🔍 Verifying token with LinkedIn API...');
  const verifyRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (verifyRes.ok) {
    console.log(`   ✅ Token valid — authenticated as: ${me.name ?? me.sub}`);
  } else {
    console.log(`   ⚠️  Token verification returned: ${verifyRes.status}`);
  }

  console.log('\n' + '='.repeat(65));
  console.log('DONE — Merlin Energy LinkedIn connection refreshed');
  console.log(`Posts will go to: ${postingAs}`);
  console.log('='.repeat(65) + '\n');
});

server.listen(3333, () => {
  console.log('Listening on http://localhost:3333 for LinkedIn callback...\n');
});
