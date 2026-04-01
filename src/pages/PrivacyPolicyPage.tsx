/* Merlin Energy — Privacy Policy
   Required for LinkedIn API developer app review.
   Route: /privacy  (also /privacy-policy)
   Design: matches Cosmic Blueprint — dark navy, cyan accents, Outfit/DM Sans */

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#060D1F] text-white">
      {/* ── Nav bar strip ── */}
      <div className="border-b border-white/[0.06] bg-[#060D1F]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight font-[Outfit] text-white group-hover:text-cyan-400 transition-colors">
              Merlin<span className="text-cyan-400">Energy</span>
            </span>
          </a>
          <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to home
          </a>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Legal</p>
          <h1 className="text-4xl font-bold font-[Outfit] leading-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">
            Effective date: April 1, 2026 &nbsp;·&nbsp; Last updated: April 1, 2026
          </p>
        </header>

        <hr className="border-white/10" />

        <Section title="1. Who We Are">
          <p>
            Merlin Energy ("Merlin," "we," "us," or "our") is an AI-powered energy procurement and
            BESS (Battery Energy Storage System) quoting platform operated by Merlin Energy, Inc.
            Our website is located at{" "}
            <a href="https://merlinenergy.net" className="text-cyan-400 hover:underline">
              merlinenergy.net
            </a>
            . You can reach us at{" "}
            <a href="mailto:privacy@merlinenergy.net" className="text-cyan-400 hover:underline">
              privacy@merlinenergy.net
            </a>
            .
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <SubSection title="Information You Provide">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Quote request data</strong> — facility type, peak demand (kW), monthly
                utility spend, ZIP code, and solar status that you enter into our TrueQuote™ wizard.
              </li>
              <li>
                <strong>Contact information</strong> — name, email address, phone number, and
                company name when you submit a quote or create an account.
              </li>
              <li>
                <strong>Account credentials</strong> — email and password used to sign in.
              </li>
            </ul>
          </SubSection>

          <SubSection title="Information Collected Automatically">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Usage data</strong> — pages visited, buttons clicked, time on page, and
                feature interactions, collected via our internal analytics service.
              </li>
              <li>
                <strong>Device &amp; browser data</strong> — IP address, browser type, operating
                system, and referral URL.
              </li>
            </ul>
          </SubSection>

          <SubSection title="LinkedIn Integration">
            <p>
              We publish educational energy market content to LinkedIn via the LinkedIn Marketing
              Developer Platform. When you connect a LinkedIn account or authorize our application:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                We request the{" "}
                <code className="text-cyan-300 text-xs bg-white/5 px-1 py-0.5 rounded">
                  w_member_social
                </code>{" "}
                scope, which allows us to post content on your behalf.
              </li>
              <li>
                We do <strong>not</strong> read your LinkedIn messages, connections, profile data,
                or any other personal information beyond what is needed to publish posts.
              </li>
              <li>
                LinkedIn access tokens are stored encrypted and are never shared with third parties.
              </li>
              <li>
                You may revoke our access at any time from your LinkedIn{" "}
                <a
                  href="https://www.linkedin.com/psettings/permitted-services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Permitted Services
                </a>{" "}
                settings.
              </li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>Generate BESS and energy storage quotes tailored to your facility.</li>
            <li>
              Send quote results, follow-up proposals, and product updates (you may unsubscribe at
              any time).
            </li>
            <li>
              Improve our AI models and pricing accuracy (using aggregated, anonymized data only).
            </li>
            <li>
              Publish daily energy market deal summaries to LinkedIn on behalf of authorized
              administrators — never on behalf of end users without explicit consent.
            </li>
            <li>Comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>
            We do <strong>not</strong> sell your personal information. We may share data with:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Supabase</strong> — our cloud database provider, used to store quote records
              and account data. Data is stored in the United States.
            </li>
            <li>
              <strong>Railway</strong> — our cloud infrastructure provider, used to host our API and
              MCP server.
            </li>
            <li>
              <strong>Anthropic / OpenAI</strong> — AI providers whose models power our TrueQuote™
              analysis. We send only anonymized facility parameters, never personally identifiable
              information, to these APIs.
            </li>
            <li>
              <strong>LinkedIn Corporation</strong> — when you authorize our LinkedIn integration,
              the LinkedIn API processes your access token and post content in accordance with{" "}
              <a
                href="https://www.linkedin.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                LinkedIn's Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Legal / safety</strong> — if required by law, court order, or to protect the
              rights and safety of Merlin Energy and its users.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain quote and account data for as long as your account is active or as needed to
            provide services. You may request deletion of your data at any time by emailing{" "}
            <a href="mailto:privacy@merlinenergy.net" className="text-cyan-400 hover:underline">
              privacy@merlinenergy.net
            </a>
            . LinkedIn access tokens are purged immediately upon disconnection.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>
            Depending on your location, you may have the right to access, correct, or delete your
            personal data; object to or restrict processing; and data portability. To exercise any
            of these rights, contact us at{" "}
            <a href="mailto:privacy@merlinenergy.net" className="text-cyan-400 hover:underline">
              privacy@merlinenergy.net
            </a>
            . We will respond within 30 days.
          </p>
          <p className="mt-2">
            California residents may have additional rights under the CCPA. Nevada residents may opt
            out of the sale of personal information (we do not sell personal information).
          </p>
        </Section>

        <Section title="7. Cookies &amp; Tracking">
          <p>
            We use functional cookies required to keep you signed in and remember your session. We
            do not use third-party advertising cookies or tracking pixels. You may disable cookies
            in your browser settings, though some features may not function properly.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We use industry-standard encryption (TLS in transit, AES-256 at rest via Supabase) and
            restrict access to personal data to authorized personnel only. No transmission over the
            Internet is 100% secure; we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Our services are not directed to children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data,
            contact us at{" "}
            <a href="mailto:privacy@merlinenergy.net" className="text-cyan-400 hover:underline">
              privacy@merlinenergy.net
            </a>{" "}
            and we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            "Last updated" date at the top of this page. Material changes will be communicated via
            email or an in-app notification. Continued use of our services after changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>For privacy questions, data requests, or concerns about our LinkedIn integration:</p>
          <address className="not-italic mt-3 text-slate-300 space-y-0.5">
            <p className="font-semibold text-white">Merlin Energy, Inc.</p>
            <p>
              Email:{" "}
              <a href="mailto:privacy@merlinenergy.net" className="text-cyan-400 hover:underline">
                privacy@merlinenergy.net
              </a>
            </p>
            <p>
              Website:{" "}
              <a href="https://merlinenergy.net" className="text-cyan-400 hover:underline">
                merlinenergy.net
              </a>
            </p>
          </address>
        </Section>

        <hr className="border-white/10" />

        <p className="text-slate-500 text-xs text-center pb-8">
          © {new Date().getFullYear()} Merlin Energy, Inc. All rights reserved.
        </p>
      </main>
    </div>
  );
}

/* ── Helper components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold font-[Outfit] text-white">{title}</h2>
      <div className="text-slate-300 leading-relaxed space-y-3 text-[15px]">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-white text-[15px]">{title}</h3>
      <div className="text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}
