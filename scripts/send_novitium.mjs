import { Resend } from 'resend';
import { readFileSync } from 'fs';

// Load .env manually
const env = readFileSync('/Users/robertchristopher/merlin2/.env', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const key = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
if (!key) { console.error('No Resend key found'); process.exit(1); }
console.log('Key found:', key.slice(0,8) + '...');

const resend = new Resend(key);

const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e; background: #ffffff; padding: 32px;">
  <div style="border-left: 3px solid #10B981; padding-left: 16px; margin-bottom: 28px;">
    <span style="font-size: 11px; font-weight: 700; color: #10B981; letter-spacing: 0.08em; text-transform: uppercase;">Merlin Energy &middot; Energy Stacking&trade;</span>
  </div>

  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #111;">Hi Wissam,</p>

  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333;">
    I came across Novitium Energy through your recent project work &mdash; 200+ commercial solar installations,
    $100M+ in project value, clients across nonprofits, hotels, shopping centers, and industrial.
    That&rsquo;s exactly the profile we&rsquo;re building the <strong>ProStack&trade; vendor network</strong> around.
  </p>

  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333;">
    Merlin Energy built <strong>StackQuote&trade;</strong> &mdash; an AI-enabled stack analysis engine that
    facility operators (CFOs, project managers, energy directors) use to model commercial solar, BESS,
    EV charging, and backup generation <em>together</em> before they ever talk to an EPC. Every output
    includes system sizing, ITC stacking, 25-yr NPV, and source-attributed pricing backed by NREL ATB 2024
    and IRA 2022.
  </p>

  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333;">
    When an operator completes a StackQuote&trade;, they generate a structured project brief.
    <strong>ProStack&trade;</strong> is how EPCs like Novitium receive and respond to those briefs &mdash;
    with cleaner assumptions, pre-qualified project parameters, and no blank-page proposals.
  </p>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em;">What this means for Novitium:</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #333; line-height: 2.2;">
      <li>Inbound briefs from qualified commercial operators &mdash; facilities already engaged, modeled, and cost-aware</li>
      <li>Standardized project data: load profile, site location, system targets, financial parameters, utility rate context</li>
      <li>Less proposal friction &mdash; responding to structured specs, not cold RFPs</li>
    </ul>
  </div>

  <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #333;">
    We&rsquo;re selectively onboarding commercial solar EPCs in key markets.
    <strong>New Jersey / Mid-Atlantic</strong> is a market we&rsquo;re actively seeding with operator leads
    right now &mdash; a natural fit for Novitium&rsquo;s geography and client base.
  </p>

  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #333;">
    Would you be open to a 20-minute call to see what a ProStack&trade; brief looks like
    and whether there&rsquo;s a fit for Novitium&rsquo;s pipeline?
  </p>

  <a href="https://merlin2.fly.dev"
     style="display: inline-block; background: #10B981; color: #ffffff; text-decoration: none;
            font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin-bottom: 28px;">
    View ProStack&trade; &rarr;
  </a>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
    &mdash; Alex &middot; Merlin Energy &middot; Energy Stacking&trade;<br>
    <a href="mailto:hello@merlin.energy" style="color: #10B981;">hello@merlin.energy</a>
    &middot;
    <a href="https://merlin2.fly.dev" style="color: #10B981;">merlin2.fly.dev</a>
  </p>
</div>
`;

const { data, error } = await resend.emails.send({
  from: 'StackQuote by Merlin <hello@merlin.energy>',
  to: ['info@novitiumenergy.com'],
  reply_to: 'sales@merlinenergy.net',
  bcc: 'sales@merlinenergy.net',
  subject: 'Novitium Energy \u2014 ProStack\u2122 vendor network \u00b7 commercial solar + BESS briefs',
  html,
});

if (error) {
  console.error('Send failed:', JSON.stringify(error, null, 2));
  process.exit(1);
} else {
  console.log('Sent successfully. ID:', data.id);
}
