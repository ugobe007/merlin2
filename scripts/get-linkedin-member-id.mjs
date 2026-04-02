#!/usr/bin/env node
/**
 * One-time script to get your LinkedIn member ID.
 * Run: node scripts/get-linkedin-member-id.mjs
 * Then open the printed URL in your browser and authorize.
 */

import http from 'http';
import { exec } from 'child_process';

const CLIENT_ID     = '868g3b32687gnn';
const CLIENT_SECRET = 'WPL_AP1.8YHmKTTJPySqyx5z.d5PE0g==';
const REDIRECT_URI  = 'http://localhost:3333/callback';
const PORT          = 3333;

const authUrl =
  `https://www.linkedin.com/oauth/v2/authorization` +
  `?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent('openid profile w_member_social')}` +
  `&state=merlin_get_id`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') { res.end('wrong path'); return; }

  const code = url.searchParams.get('code');
  if (!code) { res.end('No code received'); return; }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h2>✅ Got the code! Check your terminal.</h2>');

  console.log('\n📦 Got auth code, exchanging for token...');

  // Exchange code for token
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

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    console.error('❌ Token exchange failed:', JSON.stringify(tokenData));
    server.close(); process.exit(1);
  }

  console.log('✅ Got new access token (has openid+profile+w_member_social)');

  // Get member ID
  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  console.log('\n═══════════════════════════════════════');
  console.log('✅ YOUR LINKEDIN MEMBER ID:', user.sub);
  console.log('   Name:', user.name ?? `${user.given_name} ${user.family_name}`);
  console.log('   Email:', user.email ?? '(not returned)');
  console.log('\n   LINKEDIN_PERSON_URN=urn:li:member:' + user.sub);
  console.log('   ACCESS_TOKEN=' + tokenData.access_token);
  console.log('═══════════════════════════════════════\n');

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🔗 Opening LinkedIn authorization...');
  console.log('\nIf browser does not open, paste this URL manually:');
  console.log(authUrl);
  console.log('═══════════════════════════════════════\n');
  exec(`open "${authUrl}"`);
});
