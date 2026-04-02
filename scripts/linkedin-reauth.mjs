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
import { exec } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { URL } from 'url';

// Load .env if present
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length && !process.env[k]) {
      process.env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
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
//   w_member_social             → post as personal profile
//   w_organization_social       → post as Merlin Energy company page (approved ✅)
const SCOPES = 'openid profile email w_member_social w_organization_social';

const authUrl =
  `https://www.linkedin.com/oauth/v2/authorization` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}`;

console.log('\n🔗 LinkedIn OAuth — Merlin Energy Company Page\n');
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

  const personUrn = me.sub ? `urn:li:person:${me.sub}` : '(could not determine)';

  console.log('\n' + '='.repeat(60));
  console.log('✅  NEW LINKEDIN CREDENTIALS — copy these to GitHub Secrets');
  console.log('='.repeat(60));
  console.log('\nSecret name:  LINKEDIN_ACCESS_TOKEN');
  console.log(`Secret value: ${token.access_token}`);
  console.log('\nSecret name:  LINKEDIN_PERSON_URN');
  console.log(`Secret value: ${personUrn}`);
  console.log('\nSecret name:  LINKEDIN_ORG_URN');
  console.log('Secret value: urn:li:organization:112979004');
  console.log('\nToken expires in:', Math.round(token.expires_in / 86400), 'days');
  console.log('\nAlso update Fly.io secrets:');
  console.log(`  fly secrets set LINKEDIN_ACCESS_TOKEN="${token.access_token}" -a merlin2`);
  console.log(`  fly secrets set LINKEDIN_PERSON_URN="${personUrn}" -a merlin2`);
  console.log('='.repeat(60) + '\n');
});

server.listen(3333, () => {
  console.log('Listening on http://localhost:3333 for LinkedIn callback...\n');
});
